"""Quota-bounded Google embeddings; source authority stays in SharedMemory."""
from array import array
from datetime import datetime, timezone
import hashlib
import json
import math
import sqlite3
import threading
import time
import requests

MODEL = 'gemini-embedding-2'
DIMENSIONS = 768


def validated_mode(manager, key_provider):
    """New installations start shadowed; a local measured gate permits rollout."""
    import os
    explicit = os.getenv('NOVA_SEMANTIC_MODE')
    if explicit in {'off', 'shadow', 'enabled'}:return explicit
    from .shared_memory import read
    gate = read(manager.memory_path.parent / 'memory-runtime' / 'semantic-validation.json', {})
    key = key_provider()
    try:
        age = time.time() - float(gate.get('measured_at', 0))
        valid = bool(key) and gate.get('key_fingerprint') == hashlib.sha256(key.encode()).hexdigest() and gate.get('model') == MODEL and gate.get('dimensions') == DIMENSIONS and float(gate.get('semantic_top1', 0)) > float(gate.get('keyword_top1', 0)) and int(gate.get('total_queries', 0)) >= 4 and float(gate.get('maximum_query_ms', float('inf'))) <= 2000 and 0 <= age < 604800
    except (TypeError, ValueError, AttributeError):
        valid = False
    return 'enabled' if valid else 'shadow'


def normalized(values, dimensions=DIMENSIONS):
    values = [float(v) for v in values]
    if len(values) != dimensions or any(not math.isfinite(v) for v in values):
        raise ValueError('invalid_embedding')
    norm = math.sqrt(sum(v * v for v in values))
    if norm <= 0:
        raise ValueError('zero_embedding')
    return array('f', (v / norm for v in values)).tobytes()


class EmbeddingPaused(Exception):
    pass


class GeminiEmbeddings:
    """Single independent text per standard request: never paid Batch API."""
    model = MODEL
    dimensions = DIMENSIONS

    def __init__(self, key_provider, timeout=2):
        self.key_provider = key_provider
        self.timeout = timeout
        self.verified = False
        self.paused_until = 0

    def embed(self, text, query=False):
        if time.time() < self.paused_until:
            raise EmbeddingPaused('provider_delay')
        key = self.key_provider()
        if not key:
            raise EmbeddingPaused('embedding_not_configured')
        headers = {'x-goog-api-key': key}
        url = 'https://generativelanguage.googleapis.com/v1beta/models/' + self.model
        if not self.verified:
            response = requests.get(url, headers=headers, timeout=self.timeout)
            if response.status_code != 200:
                self._failure(response)
            methods = response.json().get('supportedGenerationMethods', [])
            if 'embedContent' not in methods:
                raise EmbeddingPaused('model_embedding_unavailable')
            self.verified = True
        content = 'task: search result | query: ' + text if query else 'title: none | text: ' + text
        response = requests.post(url + ':embedContent', headers=headers, json={
            'model': 'models/' + self.model,
            'content': {'parts': [{'text': content}]}, 'outputDimensionality': self.dimensions,
        }, timeout=self.timeout)
        if response.status_code != 200:
            self._failure(response)
        return response.json()['embedding']['values']

    def _failure(self, response):
        try:
            delay = max(30, min(86400, float(response.headers.get('Retry-After', '180'))))
        except (TypeError, ValueError):
            delay = 180
        self.paused_until = time.time() + (delay if response.status_code in {429, 500, 503, 504} else 3600)
        # Neither response bodies nor exception URLs containing keys are exposed.
        raise EmbeddingPaused('embedding_http_' + str(response.status_code))


def outbound_allowed(manager, record, privacy=None, meta=None):
    from .shared_memory import canonical, safe, _SECRET_KEY_RE, _SECRET_VALUE_RE
    from .category_policy import lifecycle
    privacy = manager.privacy_settings() if privacy is None else privacy
    if privacy.get('private_session') or privacy.get('retain_memories') is False:
        return False
    if record.get('private') or record.get('private_session') or record.get('local_only') or record.get('outbound_allowed') is False:
        return False
    attributes = record.get('attributes', {})
    if attributes.get('private') or attributes.get('private_session') or attributes.get('local_only') or attributes.get('outbound_allowed') is False:
        return False
    if record.get('forgotten_at') or record.get('consent') in {'none', 'pending', 'denied', 'revoked', 'private', 'sensitive'}:
        return False
    if record.get('kind') != 'conversation' and lifecycle(record, manager.read_snapshot()['_meta'] if meta is None else meta) not in {'active', 'history'}:
        return False
    text = canonical(record.get('value', record.get('content', '')))
    return not (_SECRET_KEY_RE.search(record.get('key', '')) or _SECRET_VALUE_RE.search(text)) and safe(text) == text


class SemanticRecall:
    def __init__(self, manager, provider=None, mode='shadow', daily_requests=40):
        self.manager = manager
        self.provider = provider
        self.mode = mode if mode in {'off', 'shadow', 'enabled'} else 'shadow'
        self.path = manager.memory_path.parent / 'semantic.sqlite3'
        self.slot = threading.Lock()
        self.daily_requests = max(0, min(int(daily_requests), 1000))
        self.last_error = None
        self.next_backfill = 0
        self.shadow_comparisons = 0

    def connection(self):
        conn = sqlite3.connect(self.path, timeout=2)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, digest TEXT, scope TEXT, model TEXT, revision TEXT, vector BLOB)')
        conn.execute('CREATE TABLE IF NOT EXISTS queries (digest TEXT PRIMARY KEY, model TEXT, vector BLOB, updated REAL)')
        conn.execute('CREATE TABLE IF NOT EXISTS budget (day TEXT PRIMARY KEY, requests INTEGER, characters INTEGER)')
        return conn

    def status(self):
        count = 0
        try:
            with self.connection() as conn:
                count = conn.execute('SELECT COUNT(*) FROM vectors').fetchone()[0]
        except sqlite3.DatabaseError:
            self.last_error = 'embedding_index_unavailable'
        return {'mode': self.mode, 'model': getattr(self.provider, 'model', MODEL), 'dimensions': getattr(self.provider, 'dimensions', DIMENSIONS), 'indexed': count, 'verified': bool(getattr(self.provider, 'verified', False)), 'error': self.last_error, 'shadow_comparisons': self.shadow_comparisons}

    def _request(self, text, query=False):
        if not self.provider or self.mode == 'off' or not self.slot.acquire(False):
            raise EmbeddingPaused('embedding_busy_or_disabled')
        try:
            day = datetime.now(timezone.utc).astimezone(__import__('zoneinfo').ZoneInfo('America/Los_Angeles')).date().isoformat()
            with self.connection() as conn:
                row = conn.execute('SELECT requests,characters FROM budget WHERE day=?', (day,)).fetchone() or (0, 0)
                # Preserve query headroom while backfilling. This is an application
                # ceiling, not a claim about the project's actual provider quota.
                maximum = self.daily_requests if query else max(0, self.daily_requests - 10)
                if row[0] >= maximum or row[1] + len(text) > 160000:
                    raise EmbeddingPaused('embedding_daily_budget')
                conn.execute('INSERT OR REPLACE INTO budget VALUES (?,?,?)', (day, row[0] + 1, row[1] + len(text)))
            return normalized(self.provider.embed(text, query=query), self.provider.dimensions)
        finally:
            self.slot.release()

    def _digest(self, record):
        from .shared_memory import canonical
        text = canonical(record.get('value', record.get('content', '')))
        scope = canonical([record.get(k, '') for k in ('profile_id', 'project_id', 'scope')])
        digest = hashlib.sha256((self.provider.model + scope + text).encode()).hexdigest()
        return digest, scope, text

    def backfill(self, limit=1):
        """Invoked by the existing organizer, not a competing executor."""
        if not self.provider or self.mode == 'off' or time.time() < self.next_backfill:
            return {'status': 'paused', 'count': 0}
        from .retrieval_index import indexed_sources
        sources = indexed_sources(self.manager)
        self.next_backfill = time.time() + 65
        count = 0
        try:
            with self.connection() as conn:
                old = dict(conn.execute('SELECT id,digest FROM vectors'))
                privacy = self.manager.privacy_settings(); meta = self.manager.read_snapshot()['_meta']
                eligible = [r for r in sources if outbound_allowed(self.manager, r, privacy, meta)]
                live = {r['id'] for r in eligible}
                conn.executemany('DELETE FROM vectors WHERE id=?', [(rid,) for rid in old.keys() - live])
            for record in sorted(eligible, key=lambda r: r.get('updated', ''), reverse=True):
                digest, scope, text = self._digest(record)
                if old.get(record['id']) == digest or len(text) > 12000:
                    continue
                vector = self._request(text)
                # A forget/edit during the provider request invalidates its result.
                current = {r['id']: r for r in indexed_sources(self.manager)}.get(record['id'])
                if current and outbound_allowed(self.manager, current) and self._digest(current)[0] == digest:
                    with self.connection() as conn:
                        conn.execute('INSERT OR REPLACE INTO vectors VALUES (?,?,?,?,?,?)', (record['id'], digest, scope, self.provider.model, str(record.get('revision', 1)), vector))
                    count += 1
                if count >= max(1, min(int(limit), 4)):
                    break
            self.last_error = None
            return {'status': 'ok', 'count': count}
        except Exception as exc:
            self.last_error = str(exc) if isinstance(exc, EmbeddingPaused) else type(exc).__name__
            return {'status': 'paused', 'count': count, 'reason': self.last_error}

    def search(self, query, sources, limit=40, scope_key=''):
        if not self.provider or self.mode == 'off' or not query.strip():
            return []
        from .shared_memory import safe, _SECRET_VALUE_RE
        if safe(query) != query or _SECRET_VALUE_RE.search(query) or self.manager.privacy_settings().get('private_session'):
            return []
        privacy = self.manager.privacy_settings(); meta = self.manager.read_snapshot()['_meta']
        eligible = {r['id']: r for r in sources if outbound_allowed(self.manager, r, privacy, meta)}
        if not eligible:
            return []
        cache_key = hashlib.sha256((self.provider.model + '\0' + scope_key + '\0' + query).encode()).hexdigest()
        try:
            with self.connection() as conn:
                vectors = [(rid, vector) for rid, digest, model, vector in conn.execute('SELECT id,digest,model,vector FROM vectors') if rid in eligible and model == self.provider.model and self._digest(eligible[rid])[0] == digest]
                if not vectors:
                    return []
                row = conn.execute('SELECT vector FROM queries WHERE digest=? AND model=?', (cache_key, self.provider.model)).fetchone()
            query_blob = row[0] if row else self._request(query, query=True)
            if not row:
                with self.connection() as conn:
                    conn.execute('INSERT OR REPLACE INTO queries VALUES (?,?,?,?)', (cache_key, self.provider.model, query_blob, time.time()))
                    conn.execute('DELETE FROM queries WHERE digest NOT IN (SELECT digest FROM queries ORDER BY updated DESC LIMIT 1000)')
            query_values = array('f'); query_values.frombytes(query_blob)
            ranked = []
            try:
                import numpy as np
                valid = [(rid, blob) for rid, blob in vectors if len(blob) == len(query_blob)]
                if valid:
                    matrix = np.frombuffer(b''.join(blob for _, blob in valid), dtype=np.float32).reshape(len(valid), -1)
                    # A single C reduction avoids starting a BLAS thread pool
                    # alongside native voice and existing CPU-intensive work.
                    similarities = np.einsum('ij,j->i', matrix, np.frombuffer(query_blob, dtype=np.float32), optimize=False)
                    ranked = [(rid, float(score)) for (rid, _), score in zip(valid, similarities) if score >= .25]
            except ImportError:
                for rid, blob in vectors:
                    values = array('f'); values.frombytes(blob)
                    if len(values) == len(query_values):
                        score = sum(a * b for a, b in zip(values, query_values))
                        if score >= .25:ranked.append((rid, score))
            self.last_error = None
            return sorted(ranked, key=lambda item: (-item[1], item[0]))[:limit]
        except Exception as exc:
            self.last_error = str(exc) if isinstance(exc, EmbeddingPaused) else type(exc).__name__
            return []
