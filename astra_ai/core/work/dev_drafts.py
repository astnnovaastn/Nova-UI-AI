"""V34: draft code changes in an isolated copy, real sandboxed test runs, and approval before anything is published.

A draft is a copy of an authorized project's readable text files (state/isolated-work/drafts/<owner>/<id>/).
- `create` snapshots the original files (sha256 of each) and applies the proposed edits to the copy only:
  exact find/replace edits, new files, and proposed deletions. The original project is never touched.
- `run(which)` executes the deterministic test command against the `before` copy (reproducing the failure)
  or the `after` copy (the patched draft) in Docker: no network, read-only root, no capabilities, bounded
  CPU / memory / pids / time / output. The record keeps the command, working directory, image, start time,
  duration, exit code and the captured output exactly as the container printed it.
- `apply` needs the approval token (the digest of the reviewed proposal), a grant that allows saving, and
  originals that still match the snapshot (conflict detection). Originals are copied to the draft's
  `rollback/` folder first; writes are atomic; a failure part-way restores what was written.
- `rollback` restores the originals if the files still hold exactly what was applied. `discard` drops the copy.
No command chosen by a model is executed: the command comes from `test_command` (pytest / node --test over
test files that exist in the index).
"""
from __future__ import annotations

import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .repository_inputs import RepositoryError, RepositoryInputs

DEFAULT_IMAGE = 'aegis-work-sandbox:1'
MAX_FILES = 400
MAX_BYTES = 6_000_000
RUN_SECONDS = 90
OUTPUT_BYTES = 400_000
CONFIG_NAMES = {'conftest.py', 'pytest.ini', 'pyproject.toml', 'setup.cfg', 'setup.py', 'tox.ini', 'package.json', '__init__.py', 'requirements.txt'}


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _flags():
    return {'creationflags': getattr(subprocess, 'CREATE_NO_WINDOW', 0)}


def sandbox_image(settings):
    """The configured image if Docker has it locally (never pulled at run time)."""
    docker = shutil.which('docker')
    # The image built from core/work/sandbox/Dockerfile is the default; a host may name another trusted local image.
    image = (settings('AEGIS_WORK_SANDBOX_IMAGE') or '').strip() or DEFAULT_IMAGE
    if not docker:
        return {'available': False, 'reason': 'Docker is not installed, so no command can run in isolation. AEGIS read the code only.'}
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_./:@-]{0,240}', image):
        return {'available': False, 'reason': 'Set AEGIS_WORK_SANDBOX_IMAGE (for example aegis-work-sandbox:1) to run tests in isolation.'}
    try:
        result = subprocess.run([docker, 'image', 'inspect', '--format', '{{.Id}}', image], capture_output=True, text=True, timeout=10, **_flags())
        image_id = result.stdout.strip()
        if result.returncode or not re.fullmatch(r'sha256:[a-f0-9]{64}', image_id):
            raise ValueError()
    except (OSError, subprocess.SubprocessError, ValueError):
        return {'available': False, 'reason': 'Docker is not running or the sandbox image ' + image + ' is missing. Nothing was executed.'}
    return {'available': True, 'image': image, 'image_id': image_id, 'docker': docker}


def test_command(files, focus=()):
    """The command that runs the project's own tests, from files that exist. None when there is no test to run."""
    py = [f for f in files if re.search(r'(^|/)(test_[^/]+|[^/]+_test)\.py$', f)]
    js = [f for f in files if re.search(r'\.(test|spec)\.(mjs|cjs|js)$', f)]
    wanted = [f for f in focus if f in py or f in js]
    if wanted and all(f.endswith('.py') for f in wanted):
        return ['python', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', *wanted[:6]]
    if wanted:
        return ['node', '--test', *wanted[:6]]
    if py:
        return ['python', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', *sorted(py)[:12]]
    if js:
        return ['node', '--test', *sorted(js)[:12]]
    return None


def summarize_output(output, exit_code):
    """Counts the runner printed (pytest / node --test), not guessed."""
    text = output or ''
    counts = {}
    for number, word in re.findall(r'(\d+) (passed|failed|errors?|skipped|xfailed|xpassed)', text):
        counts[word.rstrip('s') if word.startswith('error') else word] = int(number)
    for word, key in (('# pass', 'passed'), ('# fail', 'failed')):
        found = re.search(re.escape(word) + r' (\d+)', text)
        if found:
            counts[key] = int(found.group(1))
    failing = re.findall(r'^FAILED ([^\s]+)', text, re.M)[:12] or re.findall(r'^not ok \d+ - (.+)$', text, re.M)[:12]
    return {'counts': counts, 'failing': failing, 'passed': exit_code == 0}


def unified(path, before, after):
    return ''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                        'a/' + path if before is not None else '/dev/null', 'b/' + path if after is not None else '/dev/null'))


def hunks_of(diff):
    """A unified diff as Zephium diff hunks."""
    out, current = [], None
    for line in diff.splitlines():
        head = re.match(r'^@@ -(\d+)(?:,\d+)? \+(\d+)', line)
        if head:
            current = {'old_start': int(head.group(1)), 'new_start': int(head.group(2)), 'lines': []}
            out.append(current)
        elif current is not None and line[:1] in ('+', '-', ' ') and not line.startswith(('+++', '---')):
            current['lines'].append({'op': {'+': 'add', '-': 'del'}.get(line[:1], 'ctx'), 'text': line[1:]})
    return [h for h in out if h['lines']]


class DraftWorkspace:
    def __init__(self, state_root, settings, repositories=None):
        self.root = Path(state_root) / 'isolated-work' / 'drafts'
        self.settings = settings
        self.repositories = repositories or RepositoryInputs(settings)
        self.lock = threading.RLock()

    # storage

    def _dir(self, owner, draft_id):
        if not re.fullmatch(r'[a-f0-9]{32}', draft_id or ''):
            raise ValueError('invalid_draft')
        return self.root / _sha(str(owner).encode())[:32] / draft_id

    def get(self, owner, draft_id):
        path = self._dir(owner, draft_id) / 'record.json'
        if not path.is_file():
            raise ValueError('draft_not_found')
        return json.loads(path.read_text(encoding='utf-8'))

    def _save(self, owner, record):
        folder = self._dir(owner, record['id'])
        folder.mkdir(parents=True, exist_ok=True)
        temp = folder / 'record.tmp'
        temp.write_text(json.dumps(record, indent=1), encoding='utf-8')
        temp.replace(folder / 'record.json')

    def public(self, record):
        """What the page shows: files, diffs, runs and state. No absolute host paths."""
        return {k: record.get(k) for k in ('id', 'repository', 'title', 'status', 'created_at', 'approval', 'argv', 'runs',
                                            'files', 'warnings', 'write_allowed', 'applied_at', 'conflicts', 'run_id')}

    # creation

    def _source_files(self, name, focus):
        """The project's readable text files to copy: all of them when small, else tests, focus and config."""
        listing = self.repositories.files(name, limit=20000)
        files = listing['files']
        if len(files) > MAX_FILES:
            keep = set(focus)
            for f in files:
                base = f.rsplit('/', 1)[-1]
                if base in CONFIG_NAMES or re.search(r'(^|/)tests?/|(^|/)test_[^/]+\.py$', f):
                    keep.add(f)
            # The folders of the focus files hold their imports.
            folders = {f.rsplit('/', 1)[0] for f in focus if '/' in f}
            keep |= {f for f in files if f.rsplit('/', 1)[0] in folders}
            files = sorted(keep)[:MAX_FILES]
        return files

    def create(self, owner, name, edits, argv, focus=(), run_id='', title=''):
        """A draft of `name` with `edits` applied to the copy. edits: [{path, find, replace} | {path, create} | {path, delete: true}]."""
        root = self.repositories.root(name)
        grant = self.repositories.grant(name)
        files = self._source_files(name, list(focus) + [e.get('path') for e in edits if isinstance(e, dict)])
        snapshot, size = {}, 0
        for relative in files:
            try:
                got = self.repositories.read(name, relative, 1, 1)  # validates the path and scope rules
            except RepositoryError:
                continue
            raw = (root / relative).read_bytes()
            size += len(raw)
            if size > MAX_BYTES:
                break
            snapshot[relative] = {'sha256': got['sha256'], 'text': raw.decode('utf-8-sig')}
        after = {k: v['text'] for k, v in snapshot.items()}
        warnings, changed = [], {}
        for edit in edits[:40]:
            if not isinstance(edit, dict) or not isinstance(edit.get('path'), str):
                continue
            path = edit['path'].replace('\\', '/').strip('/')
            if not RepositoryInputs.allowed(path):
                warnings.append(path + ': this path cannot be edited')
                continue
            if edit.get('delete') is True:
                if path in after:
                    after[path] = None
                    changed[path] = 'deleted'
                else:
                    warnings.append(path + ': nothing to delete')
                continue
            if isinstance(edit.get('create'), str):
                if path in snapshot or (root / path).exists():
                    warnings.append(path + ': already exists, not created')
                    continue
                after[path] = edit['create'][:400_000]
                changed[path] = 'created'
                continue
            find, replace = edit.get('find'), edit.get('replace')
            if not isinstance(find, str) or not isinstance(replace, str) or not find:
                warnings.append(path + ': an edit needs the exact text to find and its replacement')
                continue
            current = after.get(path)
            if current is None:
                warnings.append(path + ': not in the project copy')
                continue
            count = current.count(find)
            if count == 0:
                # Models often differ only in trailing spaces or CRLF: match line by line, ignoring those.
                norm = lambda s: '\n'.join(l.rstrip() for l in s.replace('\r\n', '\n').split('\n'))
                if norm(current).count(norm(find)) == 1:
                    current, find = norm(current), norm(find)
                    count = 1
            if count != 1:
                warnings.append(path + (': the text to replace was not found' if count == 0 else ': the text to replace appears ' + str(count) + ' times'))
                continue
            after[path] = current.replace(find, replace, 1)
            changed.setdefault(path, 'modified')
        rows = []
        for path, change in changed.items():
            before = snapshot.get(path, {}).get('text')
            diff = unified(path, before if before is not None else '', after[path] if after[path] is not None else '')
            if change == 'modified' and before == after[path]:
                continue
            rows.append({'path': path, 'change': change, 'diff': diff[:60000], 'hunks': hunks_of(diff)[:12],
                         'added': sum(1 for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++')),
                         'removed': sum(1 for l in diff.splitlines() if l.startswith('-') and not l.startswith('---')),
                         'base_sha256': snapshot.get(path, {}).get('sha256')})
        record = {'id': uuid.uuid4().hex, 'repository': name, 'title': title or grant.get('title') or name, 'run_id': run_id,
                  'status': 'draft', 'created_at': datetime.now(timezone.utc).isoformat(), 'argv': list(argv or []),
                  'files': rows, 'warnings': warnings[:20], 'runs': {},
                  'write_allowed': grant.get('source') == 'authorized' and bool(grant.get('write')),
                  'snapshot': {k: v['sha256'] for k, v in snapshot.items()}}
        record['approval'] = _sha(json.dumps({'files': [(r['path'], r['change'], r['diff']) for r in rows], 'argv': record['argv'],
                                              'repository': name}, sort_keys=True).encode())
        with self.lock:
            folder = self._dir(owner, record['id'])
            for label, texts in (('before', {k: v['text'] for k, v in snapshot.items()}), ('after', after)):
                for relative, text in texts.items():
                    if text is None:
                        continue
                    target = folder / label / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(text, encoding='utf-8', newline='')
            self._save(owner, record)
        return record

    # execution

    def run(self, owner, draft_id, which='after'):
        if which not in ('before', 'after'):
            raise ValueError('invalid_run')
        record = self.get(owner, draft_id)
        if record['status'] in ('discarded',):
            raise ValueError('draft_discarded')
        argv = record.get('argv') or []
        if not argv or argv[0] not in ('python', 'node'):
            raise ValueError('no_test_command')
        found = sandbox_image(self.settings)
        started = datetime.now(timezone.utc).isoformat()
        if not found['available']:
            result = {'status': 'unavailable', 'reason': found['reason'], 'argv': argv, 'started_at': started}
        else:
            result = self._docker(self._dir(owner, draft_id) / which, argv, found, draft_id + '-' + which)
        record['runs'][which] = result
        with self.lock:
            self._save(owner, record)
        return result

    def _docker(self, folder, argv, found, label):
        container = 'aegis-draft-' + label[:40]
        mount = str(folder.resolve()).removeprefix('\\\\?\\')
        command = [found['docker'], 'run', '--rm', '--name', container, '--pull=never', '--network=none', '--read-only',
                   '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=128', '--memory=768m', '--cpus=1',
                   '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m', '--mount', 'type=bind,source=' + mount + ',target=/workspace',
                   '--workdir', '/workspace', '-e', 'PYTHONDONTWRITEBYTECODE=1', '-e', 'HOME=/tmp',
                   '--entrypoint', argv[0], found['image'], *argv[1:]]
        started_at = datetime.now(timezone.utc).isoformat()
        began = time.monotonic()
        status, code, output = 'completed', None, b''
        log = folder.parent / (label.rsplit('-', 1)[-1] + '-output.txt')
        try:
            with log.open('wb') as out:
                process = subprocess.Popen(command, stdout=out, stderr=subprocess.STDOUT, **_flags())
                while process.poll() is None:
                    if time.monotonic() - began > RUN_SECONDS or log.stat().st_size > OUTPUT_BYTES:
                        status = 'limit_reached'
                        subprocess.run([found['docker'], 'rm', '-f', container], capture_output=True, timeout=15, **_flags())
                        process.kill()
                        process.wait()
                        break
                    time.sleep(0.1)
                code = process.returncode
        except (OSError, subprocess.SubprocessError) as error:
            status = 'failed_to_start'
            output = type(error).__name__.encode()
        finally:
            try:
                subprocess.run([found['docker'], 'rm', '-f', container], capture_output=True, timeout=15, **_flags())
            except (OSError, subprocess.SubprocessError):
                pass
        if log.exists():
            output = log.read_bytes()[:OUTPUT_BYTES]
        text = output.decode('utf-8', errors='replace')
        return {'status': status, 'argv': argv, 'cwd': '/workspace', 'image': found['image'], 'image_id': found['image_id'][:19],
                'environment': {'network': 'none', 'filesystem': 'read-only root, project copy mounted', 'memory': '768 MB',
                                'cpus': 1, 'pids': 128, 'time_limit_s': RUN_SECONDS},
                'started_at': started_at, 'duration_ms': round((time.monotonic() - began) * 1000), 'exit_code': code,
                'output': text, **summarize_output(text, code)}

    # approval and publishing

    def apply(self, owner, draft_id, approval):
        with self.lock:
            record = self.get(owner, draft_id)
            if record['status'] != 'draft':
                raise ValueError('draft_' + record['status'])
            if approval != record['approval']:
                raise ValueError('approval_does_not_match_this_draft')
            if not record['files']:
                raise ValueError('nothing_to_apply')
            grant = self.repositories.grant(record['repository'])
            if grant.get('source') != 'authorized' or not grant.get('write'):
                raise RepositoryError('saving_not_authorized_for_this_folder')
            root = self.repositories.root(record['repository'])
            folder = self._dir(owner, draft_id)
            conflicts, plan = [], []
            for row in record['files']:
                target = (root / row['path'])
                if not target.resolve().is_relative_to(root) or target.is_symlink():
                    raise RepositoryError('source_path_not_allowed')
                if row['change'] == 'created':
                    if target.exists():
                        conflicts.append(row['path'] + ' now exists')
                elif not target.is_file() or _sha(target.read_bytes()) != row['base_sha256']:
                    conflicts.append(row['path'] + ' changed since the draft was made')
                after = folder / 'after' / row['path']
                plan.append((row, target, after.read_bytes() if row['change'] != 'deleted' else None))
            if conflicts:
                record['conflicts'] = conflicts
                self._save(owner, record)
                raise ValueError('conflict: ' + '; '.join(conflicts[:4]))
            backup = folder / 'rollback'
            for row, target, _ in plan:
                if target.exists():
                    copy = backup / row['path']
                    copy.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(target, copy)
            written = []
            try:
                for row, target, data in plan:
                    if data is None:
                        target.unlink()
                    else:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        temp = target.with_name(target.name + '.aegis-' + draft_id[:8] + '.tmp')
                        temp.write_bytes(data)
                        temp.replace(target)
                    written.append((row, target))
            except Exception:
                self._restore(backup, written)
                raise
            record.update(status='applied', applied_at=datetime.now(timezone.utc).isoformat(), conflicts=[],
                          applied={r['path']: _sha(d) if d is not None else None for r, _, d in plan})
            self._save(owner, record)
            return record

    def _restore(self, backup, written):
        for row, target in reversed(written):
            copy = backup / row['path']
            if copy.exists():
                shutil.copy2(copy, target)
            elif row['change'] == 'created' and target.exists():
                target.unlink()

    def rollback(self, owner, draft_id):
        with self.lock:
            record = self.get(owner, draft_id)
            if record['status'] != 'applied':
                raise ValueError('draft_' + record['status'])
            root = self.repositories.root(record['repository'])
            changed = []
            for path, digest in (record.get('applied') or {}).items():
                target = root / path
                now = _sha(target.read_bytes()) if target.is_file() else None
                if now != digest:
                    changed.append(path)
            if changed:
                raise ValueError('conflict: changed after applying: ' + ', '.join(changed[:4]))
            self._restore(self._dir(owner, draft_id) / 'rollback', [(r, root / r['path']) for r in record['files']])
            record['status'] = 'rolled_back'
            self._save(owner, record)
            return record

    def discard(self, owner, draft_id):
        with self.lock:
            record = self.get(owner, draft_id)
            if record['status'] == 'applied':
                raise ValueError('draft_applied')
            folder = self._dir(owner, draft_id)
            for label in ('before', 'after'):
                shutil.rmtree(folder / label, ignore_errors=True)
            record['status'] = 'discarded'
            self._save(owner, record)
            return record
