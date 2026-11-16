"""Webpage captures are a sidecar of the authorized research source catalog."""
import atexit
import base64
import hashlib
import io
import json
import os
import re
import sqlite3
import subprocess
import threading
import time
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image

from .artifacts import scope, stable

_CAPTURE = Path(__file__).resolve().parents[2] / 'ui' / 'frontend' / 'source-preview-capture.cjs'
_MAX_CACHE = 128 * 1024 * 1024
_MAX_QUEUE = 128


def source_token(url):
    return hashlib.sha256(url.encode()).hexdigest()[:32]


def eligible_url(value):
    if not isinstance(value, str) or len(value) > 4096 or re.search(r'[\x00-\x20]', value):
        return False
    try:
        url = urlsplit(value)
        return url.scheme in ('http', 'https') and bool(url.hostname) and not url.username and not url.password and url.port in (None, 80, 443)
    except ValueError:
        return False


def source_catalog(artifacts, identifier, context, revision='', traced=True):
    if context.get('guest') or context.get('background'):
        return None
    found = artifacts.get(identifier, context, revision)
    if found.get('status') != 'ok':
        return None
    item = found['artifact']
    rows = artifacts.source_catalog(item)
    if traced and item.get('completeness') == 'pending':
        rows += [row for row in artifacts.trace.read(identifier, 0) if row.get('kind') in ('source', 'read')]
    return {source_token(row['url']): row['url'] for row in rows if not row.get('attachment_id') and eligible_url(row.get('url'))}


class CaptureProcess:
    """Runs the installed frontend's Playwright and captures without showing a desktop window."""
    def __init__(self):
        self.process = None

    def __call__(self, url):
        if self.process is None or self.process.poll() is not None:
            self.process = subprocess.Popen(
                ['node', str(_CAPTURE)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL, text=True, encoding='utf-8',
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
            )
        expired = threading.Timer(28, self.close)
        expired.daemon = True
        expired.start()
        try:
            process = self.process
            process.stdin.write(json.dumps({'url': url}) + '\n')
            process.stdin.flush()
            line = process.stdout.readline(9_000_000)
            png = json.loads(line).get('png')
            if not png:
                return None
            with Image.open(io.BytesIO(base64.b64decode(png, validate=True))) as image:
                if image.width > 1200 or image.height > 900:
                    return None
                image.thumbnail((720, 468), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                image.convert('RGB').save(output, 'WEBP', quality=76, method=4)
                return output.getvalue()
        except (OSError, ValueError, AttributeError):
            return None
        finally:
            expired.cancel()

    def close(self):
        process, self.process = self.process, None
        if process and process.poll() is None:
            try:
                process.stdin.close()
                process.wait(timeout=2)
            except (OSError, subprocess.TimeoutExpired):
                process.kill()
                process.wait()


class SourcePreviews:
    """One bounded worker, with live requests ahead of idle history work."""
    def __init__(self, root, capture=None):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.root / 'index.sqlite3', check_same_thread=False)
        with self.db:
            self.db.execute('CREATE TABLE IF NOT EXISTS previews (key TEXT PRIMARY KEY, captured REAL, size INTEGER, retry_after REAL, attempts INTEGER)')
        self.changed = threading.Condition()
        self.pending = OrderedDict()
        self.scans = OrderedDict()
        self.scan_after = {}
        self.active = None
        self.worker = None
        self.stopped = False
        self.capture = capture or CaptureProcess()
        atexit.register(self.close)

    @staticmethod
    def key(context, url):
        return stable('website-thumbnail', scope(context), url)

    def request(self, artifacts, context, catalog):
        """Read ready metadata and submit work without blocking on a page load."""
        with self.changed:
            now = time.time()
            owner = scope(context)
            if owner not in self.scans and self.scan_after.get(owner, 0) < now:
                self.scans[owner] = self.history(artifacts, dict(zip(('profile_id', 'project_id', 'guest'), owner)))
                self.scan_after[owner] = now + 1800
            result = {}
            for token, url in catalog.items():
                key = self.key(context, url)
                row = self.db.execute('SELECT captured, retry_after FROM previews WHERE key=?', (key,)).fetchone()
                if row and row[0] and (self.root / (key + '.webp')).is_file():
                    result[token] = {'status': 'ready', 'captured_at': row[0]}
                elif row and row[1] > now:
                    result[token] = {'status': 'unavailable'}
                else:
                    result[token] = {'status': 'pending'}
                    if key != self.active and len(self.pending) < _MAX_QUEUE:
                        self.pending[key] = url
            if not self.worker or not self.worker.is_alive():
                self.worker = threading.Thread(target=self._work, name='research-thumbnails', daemon=True)
                self.worker.start()
            self.changed.notify()
            return result

    def read(self, context, url):
        try:
            return (self.root / (self.key(context, url) + '.webp')).read_bytes()
        except OSError:
            return None

    def history(self, artifacts, context):
        # Enumerate both Active and Archived through the same owner scope and access checks.
        snapshot = artifacts.snapshot()
        identifiers = [key for key, item in snapshot.get('artifacts', {}).items()
                       if scope(item) == scope(context) and key not in snapshot.get('removed', {})]
        for identifier in reversed(identifiers):
            catalog = source_catalog(artifacts, identifier, context, traced=False) or {}
            for url in catalog.values():
                yield self.key(context, url), url

    def _next(self):
        with self.changed:
            if self.stopped:
                return None
            if self.pending:
                job = self.pending.popitem(last=False)
            elif self.scans:
                owner, scan = next(iter(self.scans.items()))
                # Yield to newly visible requests between already-captured history entries.
                job = next(scan, None)
                if job is None:
                    del self.scans[owner]
                    return ()
            else:
                closer = getattr(self.capture, 'close', None)
                if closer:
                    closer()
                return None
            self.active = job[0]
            return job

    def _work(self):
        while True:
            job = self._next()
            if job is None:
                with self.changed:
                    if not self.stopped and (self.pending or self.scans):
                        continue
                    self.worker = None
                return
            if not job:
                continue
            key, url = job
            try:
                self._save(key, url)
            finally:
                with self.changed:
                    self.active = None

    def _save(self, key, url):
        path = self.root / (key + '.webp')
        with self.changed:
            prior = self.db.execute('SELECT captured, retry_after, attempts FROM previews WHERE key=?', (key,)).fetchone()
        if prior and (prior[0] and path.is_file() or prior[1] > time.time()):
            return
        try:
            content = self.capture(url)
            if content:
                temporary = path.with_suffix('.tmp')
                temporary.write_bytes(content)
                os.replace(temporary, path)
        except (OSError, ValueError):
            content = None
        now = time.time()
        attempts = min(3, (prior[2] if prior else 0) + 1)
        retry = now + (300, 3600, 86400)[attempts - 1]
        with self.changed, self.db:
            self.db.execute('INSERT OR REPLACE INTO previews VALUES (?, ?, ?, ?, ?)',
                            (key, now if content else 0, len(content) if content else 0, 0 if content else retry, 0 if content else attempts))
            total = self.db.execute('SELECT COALESCE(SUM(size), 0) FROM previews').fetchone()[0]
            if total > _MAX_CACHE:
                for old, size in self.db.execute('SELECT key, size FROM previews WHERE size>0 ORDER BY captured').fetchall():
                    (self.root / (old + '.webp')).unlink(missing_ok=True)
                    self.db.execute('DELETE FROM previews WHERE key=?', (old,))
                    total -= size
                    if total <= _MAX_CACHE:
                        break
            self.db.execute('DELETE FROM previews WHERE captured=0 AND retry_after<?', (now - 30 * 86400,))

    def close(self):
        with self.changed:
            self.stopped = True
            self.changed.notify_all()
        closer = getattr(self.capture, 'close', None)
        if closer:
            closer()
