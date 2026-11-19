"""V29 Work task handlers, mixed into the orchestrator's `_Run` (AEGIS_WORK_ROUTER=1 runs only).

Each handler performs real work with one capability and records what it found in
`run.results['v29']`. Nothing here calls the paid research search or media enrichment.
`compose` turns the recorded material into typed Zephium objects in one bounded lead call;
URLs and pictures in those objects come only from what the tools recorded.
"""
from __future__ import annotations

import asyncio
import json
import posixpath
import re
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from astra_ai.memory.shared_memory import now, safe

from . import deliverables
from . import evidence_text as et
from . import ui_teardown
from . import zephium_objects as zo
from .contracts import as_dict, EvidenceRecord
from .providers import BudgetExhausted, ProviderError, WorkPaused

CODE_SUFFIXES = ('.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.svelte', '.vue', '.rs', '.go', '.java', '.cs')
PY_IMPORT = re.compile(r'^\s*(?:from\s+([.\w]+)\s+import|import\s+([\w.]+))', re.M)
JS_IMPORT = re.compile(r'''(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\(\s*|^\s*import\s+)['"]([^'"]+)['"]''', re.M)
LINE_PREFIX = re.compile(r'^\d+: ', re.M)
KIND_HINTS = [
    (('frontend', 'ui', 'web', 'client', 'app', 'components', 'pages', 'views', 'canvas'), 'client'),
    (('api', 'server', 'routes', 'gateway', 'http'), 'gateway'),
    (('store', 'db', 'database', 'storage', 'memory', 'persistence', 'models'), 'store'),
    (('worker', 'jobs', 'queue', 'tasks', 'scheduler'), 'worker'),
    (('llm', 'ai', 'providers', 'model', 'inference', 'voice'), 'model'),
    (('cache',), 'cache'),
    (('tests', 'test', 'spec'), 'other'),
]

COMPOSE_SCHEMA = {
    'type': 'object', 'additionalProperties': False, 'required': ['reply', 'objects'],
    'properties': {
        'reply': {'type': 'object', 'additionalProperties': False, 'required': ['headline', 'text', 'points'],
                  'properties': {'headline': {'type': 'string'}, 'text': {'type': 'string'},
                                 'points': {'type': 'array', 'items': {'type': 'string'}}}},
        'objects': {'type': 'array', 'items': {
            'type': 'object', 'additionalProperties': False, 'required': ['kind', 'title', 'part', 'data_json'],
            'properties': {'kind': {'type': 'string'}, 'title': {'type': 'string'}, 'part': {'type': 'string'},
                           'data_json': {'type': 'string'}}}},
        'proposal': {'type': 'object', 'additionalProperties': False, 'required': ['files', 'argv'],
                     'properties': {'files': {'type': 'array', 'items': {'type': 'string'}},
                                    'argv': {'type': 'array', 'items': {'type': 'string'}},
                                    # V34: the patch itself, applied only to an isolated draft copy.
                                    'edits': {'type': 'array', 'items': {
                                        'type': 'object', 'additionalProperties': False, 'required': ['path', 'find', 'replace'],
                                        'properties': {'path': {'type': 'string'}, 'find': {'type': 'string'},
                                                       'replace': {'type': 'string'}, 'delete': {'type': 'boolean'}}}}}},
    },
}


#: Drafts belong to the desktop's single owner (as V33 reviewed edits do); the API that applies them is owner-only.
DRAFT_OWNER = 'owner'

#: V34: what each developer workflow asks of the lead once the real files are in the material.
DEV_INSTRUCTIONS = {
    'explain': (' This explains real files from the person\'s project (material.references with kind "file"; each line is numbered as in the file).'
                ' Make one or two code objects with ref set to the file\'s R id and no text: the app shows the real lines.'
                ' Give each code object 4 to 10 notes, each {from, to, text} on line numbers exactly as numbered in the material,'
                ' covering the important definitions, data structures, inputs/outputs and control flow, in file order and without overlaps.'
                ' A document object explains the execution flow and the dependencies (imports) in plain paragraphs, naming functions and classes as they appear.'
                ' A diagram, if made, shows only functions, classes and modules that appear in the material and the calls/imports between them.'
                ' If material.scope.missing lists a file, say it was not found; never describe a file that is not in the material.'),
    'map': (' The project card and the module map were built from the real file tree and imports: do not repeat them.'
            ' A document object summarises each main module (what it holds, its entry points, what it imports) using only names from the material,'
            ' and where to start reading.'),
    'review': (' Review the real change (the diff objects already built and the read files). A list object (style todo) holds each problem:'
               ' title, detail with the exact file and new-side line number from the hunk, why it is a bug or regression, and the corrected code.'
               ' A draft object drafts the review comment. Never report a problem in code that is not in the diff or the read files.'),
    'modify': (' Fix the failing test. material.baseline_test_run is the real sandbox run of the project\'s tests (or why none could run).'
               ' Diagnose from that output and the read files. proposal.edits is the patch: each edit {path, find, replace} where find is an exact,'
               ' unique, verbatim excerpt of the current file (copy it from the material without the line-number prefixes) and replace its new text;'
               ' find "" with replace = the full content creates a new file. Keep the patch minimal. proposal.argv: leave the test command as given.'
               ' The patch is applied to an isolated draft copy and the tests are re-run there; nothing touches the person\'s files until they approve.'
               ' Do not claim the fix works: the app reports the real re-run.'),
}


def card_picture(url):
    """V33: a Wikimedia thumbnail at the size a board card shows (500 px for a 248 px card at 2x), not 800-960 px.

    Measured on a Commons moodboard picture: 960 px = 185 KB, 500 px = 63 KB. Other hosts are left as they are."""
    if not url or '.wikimedia.org/' not in url or '/thumb/' not in url:
        return url
    return re.sub(r'/(\d{3,4})px-', lambda m: '/500px-' if int(m.group(1)) > 500 else m.group(0), url, count=1)


def _parsed(raw, refs):
    """A composed object's data built as its kind requires, or {} when it does not build (so it counts as empty)."""
    try:
        data = json.loads(raw.get('data_json') or '{}', strict=False)
        if raw.get('kind') == 'code' and isinstance(data, dict):
            data = ground_code(data, list(refs.rows.values()))
        return zo.build(raw.get('kind'), data, refs)
    except (ValueError, TypeError):
        return {}


def _focus_windows(windows, words, limit):
    """Numbered windows of one file within `limit` characters: all when they fit, else the first window and the
    windows that mention the request's words most, kept in file order. Gaps are marked with a bare '⋯' line."""
    if sum(len(w) for w in windows) <= limit:
        return '\n'.join(windows)
    lowered = [w.lower() for w in windows]
    score = lambda i: sum(lowered[i].count(word) for word in words) if words else 0
    keep, used = {0}, len(windows[0])
    for i in sorted(range(1, len(windows)), key=lambda i: (-score(i), i)):
        if used + len(windows[i]) > limit:
            continue
        keep.add(i)
        used += len(windows[i])
    out, last = [], -1
    for i in sorted(keep):
        if last >= 0 and i != last + 1:
            out.append('⋯')
        out.append(windows[i])
        last = i
    return '\n'.join(out)


def _numbered(text):
    """{line number: text} from a numbered excerpt ('12: code'); '⋯' gap lines are skipped."""
    lines = {}
    for raw in (text or '').splitlines():
        found = re.match(r'^(\d+): ?(.*)$', raw)
        if found:
            lines[int(found.group(1))] = found.group(2)
    return lines


def ground_code(data, refs_rows):
    """V34: a code object shows the file's real lines. With a file ref, its text, path and first line come from
    what was read; otherwise the model's text must match a read file (>=60% of its lines) or it is left unmarked.
    Notes outside the shown lines are dropped, so every annotation points at real code."""
    files = [r for r in refs_rows if r.get('kind') == 'file' and r.get('text')]
    ref = next((r for r in files if r['id'] == str(data.get('ref') or '')), None)
    model_lines = [l.strip() for l in str(data.get('text') or '').splitlines() if l.strip()]
    if ref is None and model_lines:
        best, overlap = None, 0.0
        for row in files:
            have = {l.strip() for l in _numbered(row['text']).values() if l.strip()}
            share = sum(1 for l in model_lines if l in have) / len(model_lines)
            if share > overlap:
                best, overlap = row, share
        ref = best if overlap >= 0.6 else None
    if ref is None:
        if files and model_lines:
            data['grounded'] = False
        return data
    lines = _numbered(ref['text'])
    if not lines:
        return data
    notes = [n for n in data.get('notes') or [] if isinstance(n, dict)]
    wanted = [(n['from'], n['to']) for n in notes if isinstance(n.get('from'), int) and isinstance(n.get('to'), int)]
    # Show the span the notes talk about (with a little context), else the first lines read.
    if wanted:
        lo = max(min(lines), min(a for a, _ in wanted) - 2)
        hi = min(max(lines), max(b for _, b in wanted) + 2)
    elif model_lines:
        hits = [n for n, t in lines.items() if t.strip() in set(model_lines)]
        lo, hi = (min(hits), max(hits)) if hits else (min(lines), min(max(lines), min(lines) + 60))
    else:
        lo, hi = min(lines), min(max(lines), min(lines) + 60)
    if hi - lo > 400:
        hi = lo + 400
    span = [n for n in range(lo, hi + 1) if n in lines]
    if not span:
        return data
    # A gap in what was read stops the excerpt there, so the shown lines are contiguous and correctly numbered.
    contiguous = [span[0]]
    for n in span[1:]:
        if n != contiguous[-1] + 1:
            break
        contiguous.append(n)
    first, last = contiguous[0], contiguous[-1]
    # Notes are stored as positions in the excerpt (Zephium's CodeBlock), with `start` giving the file line of row 1.
    kept = [{'from': max(first, a) - first + 1, 'to': min(last, b) - first + 1, 'text': n.get('text', '')}
            for n, (a, b) in zip([n for n in notes if isinstance(n.get('from'), int) and isinstance(n.get('to'), int)], wanted)
            if b >= first and a <= last and a <= b]
    return {**data, 'text': '\n'.join(lines[n] for n in contiguous), 'start': first, 'path': ref.get('path') or ref.get('title'),
            'notes': kept, 'grounded': True, 'ref': ref['id'], 'sha256': ref.get('sha256', ''), 'total_lines': ref.get('total')}


def _kind_for(path):
    words = set(re.split(r'[/_\-.]', path.lower()))
    for hints, kind in KIND_HINTS:
        if words & set(hints):
            return kind
    return 'service'


def _module_of(path, depth):
    parts = path.split('/')[:-1]
    return '/'.join(parts[:depth]) or '(root)'


def _resolve_import(source_file, spec, files_set, language):
    """The repository file an import refers to, or None for an external package."""
    base = posixpath.dirname(source_file)
    if language == 'py':
        if spec.startswith('.'):
            level = len(spec) - len(spec.lstrip('.'))
            target = base
            for _ in range(level - 1):
                target = posixpath.dirname(target)
            rest = spec.lstrip('.').replace('.', '/')
            stem = posixpath.join(target, rest) if rest else target
        else:
            stem = spec.replace('.', '/')
        for candidate in (stem + '.py', stem + '/__init__.py'):
            if candidate in files_set:
                return candidate
            # Absolute package imports often include the repository's own top folder.
            for known in files_set:
                if known.endswith('/' + candidate):
                    return known
        return None
    if not spec.startswith('.'):
        return None
    stem = posixpath.normpath(posixpath.join(base, spec))
    for suffix in ('', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.svelte', '/index.ts', '/index.js'):
        if stem + suffix in files_set:
            return stem + suffix
    return None


class WorkTasks:
    """Handlers for the V29 Work graph. Requires the `_Run` attributes they use."""

    # Shared helpers

    @property
    def routed(self):
        return self.run.request.get('router') == 'v29'

    @property
    def route(self):
        return (self.run.plan or {}).get('route') or {}

    @property
    def routed_work(self):
        return self.routed and bool(self.route) and not self.route.get('research')

    def _v29(self):
        return self.run.results.setdefault('v29', {'refs': [], 'tools': []})

    def _tool(self, name, status, **detail):
        """One tool action, recorded for the trace and the live-validation log."""
        row = {'tool': name, 'status': status, 'at': now(), **{k: v for k, v in detail.items() if v not in (None, '')}}
        self._v29()['tools'].append(row)
        self._emit('tool', status='done' if status == 'ok' else status, tool=name,
                   **{k: v for k, v in detail.items() if isinstance(v, (str, int, float, bool))})
        return row

    def _ref(self, prefix, **row):
        refs = self._v29()['refs']
        number = sum(1 for r in refs if r['id'].startswith(prefix)) + 1
        row = {'id': prefix + str(number), **row}
        refs.append(row)
        return row

    def _worker_part(self, key, title, helper, began):
        parts = self.run.usage.setdefault('parts', {})
        row = parts.setdefault(key, {'title': title, 'helper': helper, 'began': round(began, 3), 'ended': round(began, 3),
                                     'calls': 0, 'tokens': 0, 'searches': 0, 'model': ''})
        row['title'], row['helper'] = title, helper
        row['ended'] = round(max(row['ended'], time.time()), 3)

    # read_repo

    def _choose_repository(self, roots):
        # V34: the project decided at routing (dev_scope.resolve) from the person's grants.
        decided = (self._v29().get('scope') or {}).get('repository')
        if decided in roots:
            return decided
        query = ((self.request.query or '') + ' ' + str(self.run.request.get('answer') or '')).lower()
        for row in self.request.chosen:
            name = str(row.get('repository') or '')
            if name in roots:
                return name
        named = [name for name in roots if name.lower() in query]
        return named[0] if named else (next(iter(roots)) if roots else '')

    async def _read_repo(self):
        from .repository_inputs import RepositoryInputs, RepositoryError
        began = time.time()
        repos = RepositoryInputs(self.owner.settings)
        roots = await asyncio.to_thread(repos.roots)
        record = self._v29().setdefault('repo', {'available': False})
        if not roots:
            self._stage('repository', 'No repository is configured, so AEGIS works from what you supplied', 'failed', reason='repository_not_configured')
            self._tool('repo.list', 'unavailable', reason='repository_not_configured')
            return None
        name = self._choose_repository(roots)
        self._stage('repository', 'Reading ' + name, 'running', repository=name)
        listing = await asyncio.to_thread(repos.files, name)
        files = listing['files']
        self._tool('repo.files', 'ok', repository=name, count=len(files), truncated=listing['truncated'])
        # A folder named in the request narrows the scope ("map core/work"); V34: so does a granted sub-folder path.
        decided = self._v29().get('scope') or {}
        scope = decided.get('scope', '') if decided.get('repository') == name else ''
        for token in ([] if scope else re.findall(r'[\w.-]+(?:/[\w.-]+)+', self.request.query or '')):
            token = token.strip('/').lower()
            if any(f.lower().startswith(token + '/') for f in files):
                scope = token
                break
        in_scope = [f for f in files if not scope or f.lower().startswith(scope.lower() + '/')]
        files_set = set(files)
        # Files the person named or chose are read first; V34: the resolved files come from the whole index,
        # not only the first 1000 listed paths, and a long file is read in windows with its real line numbers.
        resolved = decided.get('repository') == name
        wanted = list(decided.get('files', [])) if resolved else []
        for row in self.request.chosen:
            title = str(row.get('title') or '')
            if title in files_set:
                wanted.append(title)
        for token in ([] if resolved else re.findall(r'[\w./-]+\.(?:py|ts|tsx|js|jsx|mjs|cjs|svelte|vue|rs|go|java|md|json|toml|yaml|yml)', self.request.query or '')):
            hit = next((f for f in files if f == token or f.endswith('/' + token) or token.endswith('/' + f)), None)
            if hit:
                wanted.append(hit)
        wanted = list(dict.fromkeys(wanted))[:12]
        if resolved and decided.get('missing'):
            self._tool('repo.find', 'not_found', repository=name, files=', '.join(decided['missing'])[:200])
        code_files = [f for f in in_scope if f.endswith(CODE_SUFFIXES)]
        # Import scan: entry points and short paths first, bounded so a large repository stays fast.
        ranked = sorted(code_files, key=lambda f: (f.count('/'), 'test' in f.lower(), len(f)))[:90]
        if self.route.get('intent') not in ('map', 'explain') and wanted:
            ranked = []  # a review or fix reads the files it is about, not the whole repository
        reads, imports = [], defaultdict(set)

        def read(path, end=200):
            for stop in (end, 80, 30):
                try:
                    return repos.read(name, path, 1, stop)
                except RepositoryError as error:
                    if str(error) != 'choose_a_shorter_line_range':
                        return {'error': str(error), 'title': path}
            return {'error': 'choose_a_shorter_line_range', 'title': path}

        def read_whole(path, limit_lines=2400):
            """A wanted file in 200-line windows (shorter where lines are long), numbered as in the file."""
            first = read(path)
            if first.get('error') or first['end'] >= first['total_lines']:
                return first, [first['summary']] if not first.get('error') else []
            windows, start = [first['summary']], first['end'] + 1
            while start <= min(first['total_lines'], limit_lines):
                got = None
                for size in (200, 80, 30):
                    try:
                        got = repos.read(name, path, start, start + size - 1)
                        break
                    except RepositoryError as error:
                        if str(error) != 'choose_a_shorter_line_range':
                            return first, windows
                if not got:
                    break
                windows.append(got['summary'])
                start = got['end'] + 1
            return {**first, 'end': start - 1}, windows

        texts = {}
        focus_words = et.words_of(self.request.query, str(self.run.request.get('answer') or ''))
        for path in list(dict.fromkeys(wanted + ranked)):
            if path in wanted:
                got, windows = await asyncio.to_thread(read_whole, path)
            else:
                got = await asyncio.to_thread(read, path)
                windows = [got.get('summary', '')]
            if got.get('error'):
                self._tool('repo.read', 'refused', path=path, reason=got['error'])
                continue
            texts[path] = LINE_PREFIX.sub('', '\n'.join(windows))
            if path in wanted:
                numbered = _focus_windows(windows, focus_words, 16000)
                ref = self._ref('R', kind='file', path=path, title=path, start=got['start'], end=got['end'],
                                total=got['total_lines'], sha256=got['sha256'], text=numbered, focus=True)
                reads.append(ref['id'])
                self._tool('repo.read_file', 'ok', repository=name, path=path, lines=got['end'], total=got['total_lines'])
        self._tool('repo.read', 'ok', repository=name, files=len(texts))
        for path, text in texts.items():
            language = 'py' if path.endswith('.py') else 'js'
            pattern = PY_IMPORT if language == 'py' else JS_IMPORT
            for match in pattern.finditer(text):
                spec = next((g for g in match.groups() if g), '')
                target = _resolve_import(path, spec, files_set, language)
                if target and target != path:
                    imports[path].add(target)
        # Modules: folders two levels under the scope, so the map shows architecture, not every file.
        depth = (scope.count('/') + 1 if scope else 0) + 2
        module_files = Counter(_module_of(f, depth) for f in in_scope)
        flat = len([m for m in module_files if module_files[m] > 1]) < 3
        if flat:
            # One flat folder: its files are the architecture, so map them one by one.
            module_of = lambda f: f.rsplit('.', 1)[0] if f.endswith(CODE_SUFFIXES) else _module_of(f, depth)
        else:
            module_of = lambda f: _module_of(f, depth)
        module_files = Counter(module_of(f) for f in in_scope if not flat or f.endswith(CODE_SUFFIXES) or '/' in f[len(scope) + 1:])
        edges = Counter()
        for src, targets in imports.items():
            for dst in targets:
                a, b = module_of(src), module_of(dst)
                if a != b:
                    edges[(a, b)] += 1
        degree = Counter()
        for (a, b), n in edges.items():
            degree[a] += n
            degree[b] += n
        modules = sorted(module_files, key=lambda m: (-(degree[m] * 3 + module_files[m])))[:28]
        tops = Counter(f.split('/')[0] if '/' in f else f for f in in_scope)
        tree = []
        for top, count in sorted(tops.items(), key=lambda kv: -kv[1])[:14]:
            is_dir = any(f.startswith(top + '/') for f in in_scope)
            tree.append({'path': (scope + '/' if scope else '') + top if not scope else top, 'kind': 'folder' if is_dir else 'file',
                         **({'more': count} if is_dir else {})})
        stack, scripts = self._stack(texts, in_scope if scope else files, repos, name)
        record.update({'available': True, 'name': name, 'root': roots[name].name, 'scope': scope, 'files': len(files),
                       'in_scope': len(in_scope), 'truncated': listing['truncated'], 'tree': tree, 'stack': stack,
                       'scripts': scripts, 'modules': [{'id': m, 'files': module_files[m]} for m in modules],
                       'edges': [{'from': a, 'to': b, 'count': n} for (a, b), n in edges.most_common(60) if a in modules and b in modules],
                       'reads': reads, 'scanned': len(texts)})
        await self._v33_developer_context(repos, name, roots[name], files, record)
        self._worker_part('worker_a', 'Repository', 'computer', began)
        self._stage('repository', 'Read ' + str(len(texts)) + ' files in ' + name + (' / ' + scope if scope else ''),
                    files=len(texts), modules=len(modules), edges=len(record['edges']))
        return None

    async def _v33_developer_context(self, repos, name, root, files, record):
        """V33: the real git change (review, fix) and a bounded, relevant code context (explain, fix). Read-only."""
        from . import dev_tasks
        intent = self.route.get('intent')
        if intent in ('review', 'modify'):
            change = await asyncio.to_thread(dev_tasks.repository_change, root, self.request.query)
            self._v29()['change_hunks'] = change.pop('hunks', {})
            record['change'] = change
            self._tool('repo.git_diff', 'ok' if change.get('available') else 'unavailable', repository=name,
                       files=len(change.get('files', [])), reason=change.get('reason', ''))
        if intent in ('explain', 'modify', 'review'):
            wanted = [ref['path'] for ref in self._v29()['refs'] if ref.get('kind') == 'file']
            if intent == 'modify':
                wanted += dev_tasks.failing_test_names(self.request.query, files)[0]
            try:
                picked = await asyncio.to_thread(lambda: repos.index(name).select_context(self.request.query, wanted, 16000, 6))
            except Exception as error:  # an index failure leaves the run with what it already read
                self._tool('repo.context', 'failed', reason=type(error).__name__)
                return
            known = {ref.get('path') for ref in self._v29()['refs'] if ref.get('kind') == 'file'}
            for chunk in picked['chunks']:
                if chunk.get('error') or chunk['path'] in known:
                    continue
                ref = self._ref('R', kind='file', path=chunk['path'], title=chunk['path'], start=chunk['start'], end=chunk['end'],
                                total=chunk['total_lines'], sha256=chunk['sha256'], text=chunk['text'][:9000], why=chunk['why'])
                record.setdefault('reads', []).append(ref['id'])
            record['context'] = {'chars': picked['chars'], 'files': [c['path'] for c in picked['chunks'] if not c.get('error')], 'considered': picked['considered']}
            self._tool('repo.context', 'ok', repository=name, files=len(record['context']['files']), chars=picked['chars'])

    def _stack(self, texts, files, repos, name):
        stack, scripts = [], []
        # The manifest nearest the root of the mapped scope describes it; deeper ones belong to sub-projects.
        names = {}
        for f in sorted(files, key=lambda f: f.count('/')):
            names.setdefault(posixpath.basename(f), f)
        try:
            if 'package.json' in names:
                raw = LINE_PREFIX.sub('', repos.read(name, names['package.json'], 1, 199)['summary'])
                data = json.loads(raw) if raw.strip().endswith('}') else {}
                for dep in list({**data.get('dependencies', {}), **data.get('devDependencies', {})})[:10]:
                    stack.append({'name': dep})
                for key, command in list(data.get('scripts', {}).items())[:8]:
                    scripts.append({'name': key, 'command': str(command)[:120], 'source': names['package.json']})
        except Exception:
            pass
        for manifest in ('requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod'):
            if manifest in names and len(stack) < 14:
                try:
                    raw = LINE_PREFIX.sub('', repos.read(name, names[manifest], 1, 120)['summary'])
                    for line in raw.splitlines():
                        dep = re.match(r'^\s*([A-Za-z][\w.-]{1,40})\s*(?:[=<>~!]|$)', line)
                        if dep and manifest == 'requirements.txt':
                            stack.append({'name': dep.group(1)})
                        if len(stack) >= 14:
                            break
                except Exception:
                    pass
        languages = Counter(posixpath.splitext(f)[1] for f in files)
        for suffix, label in (('.py', 'Python'), ('.ts', 'TypeScript'), ('.svelte', 'Svelte'), ('.tsx', 'React'), ('.rs', 'Rust')):
            if languages.get(suffix):
                stack.insert(0, {'name': label, 'role': str(languages[suffix]) + ' files'})
        seen, out = set(), []
        for row in stack:
            if row['name'] not in seen:
                seen.add(row['name'])
                out.append(row)
        return out[:14], scripts

    # read_account

    async def _read_account(self):
        from .google_accounts import GoogleAccounts, AccountError
        began = time.time()
        caps = set(self.route.get('capabilities', []))
        record = self._v29().setdefault('account', {'connected': False})
        try:
            accounts = GoogleAccounts(self.owner.store.root, self.owner.settings)
            status = await asyncio.to_thread(accounts.status, self.context)
        except AccountError as error:
            # An unconfigured or unreadable connection never stops the work; it is reported.
            status = {'configured': False, 'connected': False, 'error': str(error)}
        if not status.get('connected'):
            record['reason'] = 'not_connected' if status.get('configured') else 'not_configured'
            self._stage('accounts', 'Google is not connected, so AEGIS uses what you supplied', 'failed', reason=record['reason'])
            self._tool('account.status', 'unavailable', reason=record['reason'])
            return None
        record['connected'] = True
        self._stage('accounts', 'Reading your connected accounts', 'running')
        services = set(status.get('services', []))
        if 'account.calendar' in caps and 'calendar' in services:
            start = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
            span = 7 if self.request.workflow in ('meeting-prep', 'weekly-status') else 1
            try:
                found = await asyncio.to_thread(accounts.events, self.context, start.isoformat(), (start + timedelta(days=span)).isoformat(), 50)
                for row in found['items']:
                    when = row.get('start', {}).get('dateTime') or row.get('start', {}).get('date') or ''
                    end = row.get('end', {}).get('dateTime') or row.get('end', {}).get('date') or ''
                    self._ref('E', kind='event', title=safe(row.get('summary', '(no title)'))[:160], start=when, end=end,
                              place=safe(row.get('location', ''))[:120], url=row.get('htmlLink', ''), text=safe(row.get('description', ''))[:600])
                self._tool('calendar.events', 'ok', count=len(found['items']))
            except AccountError as error:
                self._tool('calendar.events', 'failed', reason=str(error))
        if 'account.gmail' in caps and 'gmail' in services:
            query = 'newer_than:7d' if self.request.workflow == 'weekly-status' else 'newer_than:2d in:inbox'
            try:
                found = await asyncio.to_thread(accounts.messages, self.context, query, 20)
                for row in found['items']:
                    self._ref('M', kind='message', title=safe(row.get('subject', ''))[:200], who=safe(row.get('from', ''))[:120],
                              when=row.get('date', ''), url=row.get('url', ''), text=safe(row.get('snippet', ''))[:500])
                self._tool('gmail.messages', 'ok', count=len(found['items']))
            except AccountError as error:
                self._tool('gmail.messages', 'failed', reason=str(error))
        self._worker_part('worker_a', 'Accounts', 'connection', began)
        events = sum(1 for r in self._v29()['refs'] if r['id'][0] == 'E')
        messages = sum(1 for r in self._v29()['refs'] if r['id'][0] == 'M')
        self._stage('accounts', 'Read ' + str(events) + ' events and ' + str(messages) + ' messages', events=events, messages=messages)
        return None

    # browse (free, permitted web retrieval)

    def _browse_queries(self):
        queries = [safe(q).strip()[:200] for q in (self.run.plan.get('queries') or []) if safe(q).strip()]
        if not queries:
            text = re.sub(r'^(make|create|build|give me|design|plan|find)\s+(me\s+)?(a|an|the)?\s*', '', self.request.query.strip(), flags=re.I)
            text = re.sub(r'\b(moodboard|mood board)\s+(for|of|about)\s+', '', text, flags=re.I)
            queries = [text[:120] or self.request.query[:120]]
        # A comparison needs a search per thing compared; other Work needs a few.
        return queries[:5 if self.route.get('intent') == 'compare' else 3]

    async def _browse(self):
        try:
            from . import free_search
            from .agent_browser import AgentBrowser
        except ImportError as error:
            self._stage('browse', 'Free web retrieval is not installed', 'failed', reason=type(error).__name__)
            self._tool('browse', 'unavailable', reason='module_missing')
            return None
        began = time.time()
        caps = set(self.route.get('capabilities', []))
        queries = self._browse_queries()
        self._stage('browse', 'Gathering references without paid search', 'running', queries=queries)
        browser = AgentBrowser()
        hits_total, images_total = 0, 0
        rows_for_state = []
        try:
            # V31: a UI teardown shows the products' own pages (their og:image and page images, cited to the page),
            # never generic free-licence pictures found by searching the request's words.
            if 'web.images.free' in caps and self.request.workflow != 'ui-teardown':
                # Short style terms find pictures; long research-style queries find documents.
                core = ' '.join(self._browse_queries()[0].split()[:4])
                if self.request.workflow == 'moodboard':
                    stripped = re.sub(r'^(make|create|build|give me|design)\s+(me\s+)?(a|an|the)?\s*(moodboard|mood board)\s*(for|of|about)?\s*', '', self.request.query.strip(), flags=re.I).strip(' .')
                    core = ' '.join(stripped.split()[:4]) or core
                words = core.split()
                strongest = max(words, key=len) if words else core
                # Image search matches every word, so each query falls back to fewer words until it finds pictures.
                plans = [[core, ' '.join(words[:-1]), ' '.join(words[1:]), strongest]] + [
                    [strongest + ' ' + facet, facet + ' ' + ' '.join(words[:1])] for facet in ('poster', 'typography', 'texture')]
                for variants in plans:
                    found, query = [], core
                    for query in [v for v in dict.fromkeys(variants) if v.strip()]:
                        found = await asyncio.to_thread(free_search.images, query, 10)
                        if found:
                            break
                    self._tool('images', 'ok', query=query, count=len(found))
                    for hit in found:
                        url = card_picture(zo.safe_url(hit.get('image') or hit.get('url')))
                        if not url or any(r.get('image') == url for r in self._v29()['refs']):
                            continue
                        page = zo.safe_url(hit.get('page') or hit.get('url'))
                        self._ref('I', kind='image', title=safe(hit.get('title', ''))[:160], image=url, images=[url], page=page or url,
                                  url=page or url, maker=safe(hit.get('maker') or hit.get('author') or '')[:80],
                                  provider=hit.get('source', ''), query=query)
                        images_total += 1
                if self.request.workflow == 'moodboard' and hasattr(free_search, 'try_site_images'):
                    for site in ('dribbble', 'behance'):
                        try:
                            extra = await asyncio.to_thread(free_search.try_site_images, site, queries[0], browser)
                        except Exception as error:
                            extra = []
                            self._tool('site_images', 'failed', site=site, reason=type(error).__name__)
                        status = extra.get('status', 'blocked') if isinstance(extra, dict) else getattr(extra, 'status', 'ok')
                        if isinstance(extra, dict) or (status not in ('ok', None) and not extra):
                            reason = extra.get('reason', '') if isinstance(extra, dict) else getattr(extra, 'reason', '')
                            self._tool('site_images', 'blocked', site=site, reason=str(reason or status))
                            extra = []
                        for hit in extra[:10]:
                            url = zo.safe_url(hit.get('image'))
                            if url:
                                page = zo.safe_url(hit.get('page') or hit.get('url')) or url
                                self._ref('I', kind='image', title=safe(hit.get('title', ''))[:160], image=url, images=[url], page=page,
                                          url=page, maker=safe(hit.get('maker', ''))[:80], provider=site, query=queries[0])
                                images_total += 1
            # V33: a UI teardown of pasted HTML inspects that interface and searches nothing (no generic articles).
            supplied_ui = self._teardown_supplied() if self.request.workflow == 'ui-teardown' else 0
            if caps & {'web.search.free', 'web.read'} and not (supplied_ui and not self._direct_urls()):
                rows_for_state = await self._discover_and_read(browser, queries, caps)
                hits_total = len(rows_for_state)
        finally:
            for action in getattr(browser, 'log', [])[-40:]:
                self._v29().setdefault('browser_log', []).append(action)
            try:
                browser.close()
            except Exception:
                pass
        # Pages become evidence the same way searched sources do, so citations, Sources and the Reader keep working.
        records = list(self.run.evidence)
        for row in rows_for_state[:self.budget.sources]:
            number = len(records) + 1
            record = EvidenceRecord(id='S' + str(number), url=row['url'], title=row['title'] or row['url'], domain=(row['url'].split('/')[2] if '//' in row['url'] else ''),
                                    retrieved_at=row['retrieved_at'], query=row.get('query', '')[:200], provider=row['provider'], excerpt=row['content'][:600],
                                    fetched=bool(row.get('read')), relevance=int(round(10 * min(1.0, row.get('score', 0) / 10))),
                                    source_type=row.get('source_type', ''), canonical_url=row.get('canonical_url', ''),
                                    discovered_by=row.get('discovered_by', row['provider']), agent='worker_a', task='browse',
                                    published=str(row.get('published', ''))[:40], media=[{'url': u} for u in row.get('images', [])[:6]],
                                    verification='read' if row.get('read') else 'snippet')
            records.append(as_dict(record))
            self._v29()['refs'].append({'id': record.id, 'kind': 'page', 'title': record.title, 'url': record.url, 'page': record.url,
                                        'images': row.get('images', []), 'text': row['content'][:2400], 'provider': row['provider']})
            self._emit('source', 'collecting_sources', 'done', url=row['url'], title=row['title'], excerpt=row['content'][:600], retrieved_at=row['retrieved_at'], query=row.get('query', ''))
        self.run.evidence = records
        for entry in self._v29().get('teardown', []):
            # V33: each inspected page is cited by its evidence number.
            entry['ref'] = entry.get('ref') or next((r['id'] for r in records if r.get('url') == entry.get('url')), '')
        if rows_for_state:
            # The research Reader reads source images as {url, caption} records.
            saved = [{**row, 'images': [{'url': url, 'caption': row['title']} for url in row.get('images', [])]} for row in rows_for_state[:self.budget.sources]]
            await self._state(sources=saved)
        self._worker_part('worker_a', 'References', 'browser', began)
        self._stage('browse', 'Gathered ' + str(images_total) + ' images and ' + str(hits_total) + ' pages for free',
                    images=images_total, pages=hits_total)
        return None


    # V30 discovery: direct primary sources first, then the topic's adapters, ranked for relevance and diversity.

    def _direct_urls(self):
        """Pages to read before any search: the ones the person supplied, then the official pages the lead named."""
        found = re.findall(r'https?://[^\s<>()"\']+', self.request.query or '')
        found += [str(row.get('url')) for row in self.request.chosen if str(row.get('url', '')).startswith(('http://', 'https://'))]
        found += [u for u in (self.run.plan.get('urls') or []) if isinstance(u, str)]
        out = []
        for url in found:
            url = zo.safe_url(url.rstrip('.,;'))
            if url and url not in out:
                out.append(url)
        return out[:8]

    def _named_things(self):
        """Products or companies a request lists ("Compare A, B and C" / "...: A, B, C"), in order."""
        text = self.request.query or ''
        listed = text.split(':', 1)[1] if ':' in text else re.sub(r'^\s*(compare|map|research|list)\s+(the\s+)?', '', text, flags=re.I)
        parts = re.split(r',|\band\b|\bvs\.?\b|\bversus\b|/|;', listed)
        names = []
        for part in parts:
            name = re.sub(r'[.?!]+$', '', part).strip()
            if 1 <= len(name.split()) <= 5 and re.search(r'[A-Z0-9]', name[:1] + ''.join(w[:1] for w in name.split())) and name not in names:
                names.append(name)
        return names if len(names) >= 2 else []

    async def _discover_and_read(self, browser, queries, caps):
        from . import free_search
        from . import source_ranking as sr
        # A UI teardown is about products (their own pages), not papers: it searches like a comparison.
        intent = 'compare' if self.request.workflow == 'ui-teardown' else self.route.get('intent', '')
        kind = sr.topic(self.request.query, {'compare': 'market'}.get(intent, ''))
        hits = []
        for url in self._direct_urls():
            hits.append({'title': '', 'url': url, 'snippet': '', 'source': 'direct', 'direct': True, 'query': ''})
        searched = {}
        # The things a comparison names get their official site from Wikidata (P856): a primary source without guessing an address.
        if 'web.search.free' in caps and self.route.get('intent') == 'compare' and hasattr(free_search, '_run'):
            for name in self._named_things()[:6]:
                found = await asyncio.to_thread(free_search._run, 'wikidata_official', name, 2)
                best = next((h for h in found if sr.relevance(h, name) >= 0.5), None)
                if best:
                    hits.append({**best, 'direct': True, 'query': name})
            searched['official sites'] = sum(1 for h in hits if h.get('source') == 'wikidata_official')
        if 'web.search.free' in caps:
            names = free_search.plan_sources(intent or 'create', ' '.join(queries) + ' ' + self.request.query)
            for query in queries:
                found = await asyncio.to_thread(free_search.search, query, names, 10)
                searched[query] = len(found)
                self._tool('search.free', 'ok', query=query, count=len(found), adapters=names)
                hits += [{**hit, 'query': query} for hit in found]
        # Read more pages when the task compares or maps things; a plan or a draft needs fewer.
        reads = 6 if self.route.get('intent') in ('compare', 'review', 'map') else 4
        chosen = sr.rank(hits, self.request.query + ' ' + ' '.join(queries), kind, limit=max(self.budget.sources, reads), per_domain=2)
        self._v29()['discovery'] = {'topic': kind, 'searched': searched, 'candidates': len(hits), 'chosen': len(chosen),
                                    'coverage': sr.coverage(chosen),
                                    'adapters': sorted({h.get('source', '') for h in hits}), 'errors': getattr(free_search, 'last_errors', dict)()}
        rows = []
        for hit in chosen:
            url = zo.safe_url(hit.get('url'))
            if not url or any(r.get('url') == url for r in self._v29()['refs']):
                continue
            rows.append({'url': url, 'title': hit.get('title', '')[:200], 'content': hit.get('snippet', '')[:1200], 'retrieved_at': now(),
                         'provider': hit.get('source', 'free'), 'query': hit.get('query', ''), 'score': hit.get('score', 0),
                         'source_type': hit.get('source_type', ''), 'canonical_url': hit.get('canonical_url', ''),
                         'discovered_by': hit.get('source', ''), 'published': hit.get('published', ''), 'direct': bool(hit.get('direct'))})
        wanted = et.words_of(self.request.query, ' '.join(queries))
        seen = et.Seen()
        follows = 3 if self.route.get('intent') == 'compare' else 0
        queue = []
        if 'web.read' in caps or any(r['direct'] for r in rows):
            budget = reads + sum(1 for r in rows if r['direct'])
            queue = rows[:budget]
            index = 0
            while index < len(queue):
                row = queue[index]
                index += 1
                page = await asyncio.to_thread(browser.read, row['url'])
                status = page.get('status') if isinstance(page, dict) else 'failed'
                if isinstance(page, dict) and page.get('text'):
                    # V31: the paragraphs that matter for this task (and the page's tables), not its first screenful.
                    tables = et.table_text(page.get('tables'))
                    excerpt = et.relevant(page['text'], wanted, 2400 if not tables else 1800, seen)
                    meta = page.get('meta') or {}
                    pictures = ([meta['og:image']] if zo.safe_url(meta.get('og:image')) else []) + [i.get('src') for i in page.get('images', [])[:6]]
                    row.update(content=(excerpt + ('\n\nTables:\n' + tables if tables else ''))[:3300], read=True,
                               title=row['title'] or page.get('title', '')[:200], chars=len(page['text']),
                               published=row['published'] or meta.get('published', ''),
                               images=[u for u in dict.fromkeys(pictures) if zo.safe_url(u)][:6])
                    # A comparison usually needs the vendor's pricing or features page: follow one same-site link, deterministically.
                    if follows > 0 and row.get('source_type') in ('official', 'docs', 'repository') and not row.get('followed'):
                        for link in et.follow_links(page.get('final_url') or row['url'], page.get('links'), 1):
                            if follows <= 0 or any(r['url'] == link for r in queue) or any(r.get('url') == link for r in self._v29()['refs']):
                                continue
                            follows -= 1
                            queue.append({**row, 'url': link, 'title': '', 'content': '', 'read': False, 'direct': False, 'followed': True,
                                          'provider': 'followed', 'discovered_by': 'link from ' + row['url'][:200], 'canonical_url': '', 'query': row.get('query', '')})
                    if (page.get('meta') or {}).get('canonical'):
                        row['canonical_url'] = sr.canonical(page['meta']['canonical']) or row['canonical_url']
                    if page.get('tables'):
                        row['tables'] = page['tables'][:2]
                    self._tool('browser.read', 'ok', url=row['url'], words=len(page['text'].split()), rendered=bool(page.get('rendered')))
                    if self.request.workflow == 'ui-teardown':
                        # V33: the interface itself, measured from its HTML, and a picture of it when a renderer can take one.
                        await self._teardown_page(browser, row, page)
                else:
                    self._tool('browser.read', 'blocked' if status == 'blocked' else 'failed', url=row['url'],
                               reason=str((page or {}).get('reason', '')) if isinstance(page, dict) else '')
        self._v29().setdefault('discovery', {})['followed'] = sum(1 for r in queue if r.get('followed'))
        kept = queue + [r for r in rows if r not in queue]
        # A direct page that could not be read and has no snippet is not evidence of anything.
        return [r for r in kept if r.get('read') or r['content']]

    # run_check (sandbox)

    def _drafts(self):
        from .dev_drafts import DraftWorkspace
        return DraftWorkspace(self.owner.store.root.parent, self.owner.settings)

    async def _run_check(self):
        """V34: Fix a Failing Test reproduces the failure first: the project's own tests (found in the index, never a
        model-chosen command) run on an isolated copy. Other workflows only record whether a sandbox exists."""
        from . import dev_drafts
        from .google_accounts import owner_key
        repo = self._v29().get('repo') or {}
        found = await asyncio.to_thread(dev_drafts.sandbox_image, self.owner.settings)
        self._v29()['sandbox'] = {k: v for k, v in found.items() if k != 'docker'}
        if self.route.get('intent') == 'modify' and repo.get('available'):
            from .repository_inputs import RepositoryInputs
            from . import dev_tasks
            files = await asyncio.to_thread(lambda: RepositoryInputs(self.owner.settings).files(repo['name'], limit=20000)['files'])
            named, _ = dev_tasks.failing_test_names(self.request.query + ' ' + str(self.run.request.get('answer') or ''), files)
            argv = dev_drafts.test_command(files, named)
            self._v29()['test_argv'] = argv
            if not argv:
                self._stage('sandbox', 'No test files found in ' + repo['name'] + ', so nothing can be reproduced', 'failed', reason='no_tests')
                self._tool('sandbox.reproduce', 'unavailable', reason='no_test_files')
                return None
            if not found.get('available'):
                self._v29()['baseline'] = {'status': 'unavailable', 'reason': found['reason'], 'argv': argv}
                self._stage('sandbox', 'No sandbox, so the failure is diagnosed from the code only', 'failed', reason=found['reason'])
                self._tool('sandbox.reproduce', 'unavailable', reason=found['reason'])
                return None
            self._stage('sandbox', 'Reproducing the failure in the sandbox: ' + ' '.join(argv[2:] if argv[0] == 'python' else argv), 'running', argv=argv)
            drafts = self._drafts()
            try:
                draft = await asyncio.to_thread(drafts.create, DRAFT_OWNER, repo['name'], [], argv, named, self.run.run_id, 'Baseline')
                result = await asyncio.to_thread(drafts.run, DRAFT_OWNER, draft['id'], 'before')
                await asyncio.to_thread(drafts.discard, DRAFT_OWNER, draft['id'])
            except Exception as error:  # a sandbox fault is reported, never turned into a result
                self._v29()['baseline'] = {'status': 'failed_to_start', 'reason': str(error)[:200], 'argv': argv}
                self._stage('sandbox', 'The sandbox could not run the tests', 'failed', reason=str(error)[:200])
                self._tool('sandbox.reproduce', 'failed', reason=type(error).__name__)
                return None
            self._v29()['baseline'] = result
            counts = ', '.join(f'{v} {k}' for k, v in result.get('counts', {}).items()) or 'no counts printed'
            self._stage('sandbox', 'Ran the tests in the sandbox: exit ' + str(result.get('exit_code')) + ' (' + counts + ')',
                        exit_code=result.get('exit_code'), failing=result.get('failing', [])[:6], duration_ms=result.get('duration_ms'))
            self._tool('sandbox.reproduce', 'ok' if result.get('status') == 'completed' else result.get('status', 'failed'),
                       exit_code=result.get('exit_code') if result.get('exit_code') is not None else -1, duration_ms=result.get('duration_ms', 0))
            return None
        self._v29()['sandbox'] = found = {k: v for k, v in found.items() if k != 'docker'}
        if found.get('available'):
            self._stage('sandbox', 'Sandbox ready: checks run only after you approve them', sandbox='docker')
            self._tool('sandbox.availability', 'ok')
        else:
            self._stage('sandbox', 'No sandbox, so checks are proposed, not run', 'failed', reason=found.get('reason', ''))
            self._tool('sandbox.availability', 'unavailable', reason=found.get('reason', ''))
        return None

    # compose

    def _material(self):
        v29 = self._v29()
        wanted = et.words_of(self.request.query, ' '.join(self.run.plan.get('queries') or []))
        refs = []
        for row in v29['refs'][:80]:
            keep = {k: row[k] for k in ('id', 'kind', 'title', 'path', 'maker', 'provider', 'start', 'end', 'place', 'who', 'when', 'url') if row.get(k)}
            if row.get('text'):
                keep['text'] = row['text'][:16000 if row.get('focus') else 2400] if row['kind'] == 'file' else et.relevant(row['text'], wanted, 900)
            if row['kind'] == 'image' or row.get('images'):
                keep['has_image'] = True
            refs.append(keep)
        return {'references': refs, 'repository': {k: v for k, v in v29.get('repo', {}).items() if k not in ('reads',)},
                'accounts': v29.get('account', {}), 'sandbox': v29.get('sandbox', {}),
                # V34: where the code came from, what could not be found, and the real reproduction of a failing test.
                **({'scope': {k: v29['scope'].get(k) for k in ('title', 'scope', 'files', 'missing', 'why', 'indexed')}} if v29.get('scope') else {}),
                **({'baseline_test_run': {k: v29['baseline'].get(k) for k in ('argv', 'exit_code', 'counts', 'failing', 'status', 'reason')}
                    | {'output_tail': (v29['baseline'].get('output') or '')[-5000:]}} if v29.get('baseline') else {}),
                'supplied': self.request.chosen[:12],
                # V33: a UI teardown's measured inspection of each interface (components, accessibility, structure).
                **({'ui_inspection': [{'ref': e.get('ref', ''), 'screenshot': bool(e.get('shot')), **ui_teardown.summary(e['inspection'])}
                                      for e in v29.get('teardown', [])]} if v29.get('teardown') else {})}

    async def _compose(self):
        lead = self.owner.router.route('lead')
        route = self.route
        outputs = [k for k in route.get('outputs', []) if k in zo.MODEL_KINDS and k != 'reply']
        built_project = 'project' in route.get('outputs', []) and self._v29().get('repo', {}).get('available')
        refs = zo.References(self._v29()['refs'])
        objects = []
        # The project card and the module map come from the files, not from a model.
        if built_project:
            repo = self._v29()['repo']
            objects.append(zo.canvas_object('project', 'project', repo['name'] + (' / ' + repo['scope'] if repo['scope'] else ''), {
                'name': repo['name'], 'summary': '', 'root': repo['root'] + ('/' + repo['scope'] if repo['scope'] else ''),
                'stack': repo['stack'], 'tree': repo['tree'], 'scripts': repo['scripts']}, part='worker_a'))
            if 'diagram' in outputs and repo.get('modules'):
                layers = sorted({m['id'].split('/')[0] for m in repo['modules']})
                data = zo.build('diagram', {
                    'nodes': [{'id': m['id'], 'name': m['id'].split('/')[-1] or m['id'], 'kind': _kind_for(m['id']),
                               'note': str(m['files']) + ' files', 'layer': m['id'].split('/')[0]} for m in repo['modules']],
                    'edges': [{'from': e['from'], 'to': e['to'], 'label': str(e['count']) + ' imports'} for e in repo['edges']],
                    'layers': [{'id': l, 'name': l} for l in layers]}, refs)
                objects.append(zo.canvas_object('module-map', 'diagram', 'Module map (from imports)', data, part='worker_a'))
                outputs = [k for k in outputs if k != 'diagram']
        if 'diff' in outputs:
            for index, diff in enumerate(self._supplied_diffs()[:3]):
                objects.append(zo.canvas_object('change-' + str(index + 1), 'diff', diff['path'], diff))
        # V33: a UI teardown's screenshot, component inventory and accessibility findings are measured, not written;
        # they join the result after the lead's objects so the deliverable check counts only what the lead wrote.
        prebuilt = self._teardown_objects() if self.request.workflow == 'ui-teardown' else []
        if prebuilt:
            outputs = [k for k in outputs if k != 'media']
        teardown = self.request.workflow == 'ui-teardown'
        shapes = {k: zo.SHAPES[k] for k in outputs}
        required = deliverables.for_workflow(self.request.workflow, outputs)
        payload = {
            'request': self.request.query, 'workflow': self.request.workflow, 'intent': route.get('intent'),
            'answer_to_your_question': self.run.request.get('answer', ''),
            'brief': self._brief(), **({'deliverable': self.workflow.deliverable} if self.workflow else {}),
            'outputs_to_create': shapes, 'material': self._material(),
            'already_built': [o['zkind'] + ': ' + o['title'] for o in objects + prebuilt],
            'today': datetime.now().astimezone().strftime('%A %Y-%m-%d %H:%M %Z'),
        }
        instruction = (
            'You are AEGIS doing the task itself, not researching how to do it. Create the requested result objects from the material.'
            ' Each object: kind (one of outputs_to_create), a short title, part ("" or a helper key), and data_json = the object data as a JSON string in exactly the shape given.'
            ' Create only the kinds listed. Never invent a URL, image, price, figure, date, event or message:'
            ' to use a gathered item, put its reference id (I3, S2, R1, E4, M2) in the item\'s "ref" field and the app fills the link and pictures.'
            ' For picks of images, use only references with has_image, group them into coherent boards (one picks object per direction or source), with tags of at most three words and one recommended anchor.'
            + ('' if teardown else ' A visual board uses the material generously: two or three picks objects of four to eight items each, every item a distinct reference, dropping only off-topic ones.')
            + (' This is a UI teardown of the interfaces in material.ui_inspection: write about these interfaces only (their layout, hierarchy, type,'
               ' colour, forms, navigation and the measured accessibility findings), each item citing the page ref, never a general article about design.'
               ' The screenshot, component inventory and accessibility list are already built: do not repeat them.' if teardown else '') +
            ' For code work, quote only lines present in the material and say plainly that nothing was run unless the material shows a run.'
            + (DEV_INSTRUCTIONS.get(route.get('intent'), '') if self._v29().get('repo', {}).get('available') else '') +
            ' The reply is the short answer the person reads first: a headline, two or three sentences, and a few points that fit this task;'
            ' points state the key decisions or findings (a date, a channel, a number, a choice), never describe the document itself.'
            ' Plan steps carry a detail line saying what is done and by which role.'
            + (' For this visual board the points are exactly: Palette, Type, Texture, Composition, Avoid.' if route.get('board') == 'visual' and not teardown else '') +
            ' proposal is only for code fixes: the files to change and the test command, as an argument list; otherwise omit it.'
            + ('\n' + deliverables.instruction(required) if required else '')
        )
        self._stage('compose', 'Creating the results', 'running', outputs=outputs, deliverables=[d.name for d in required])
        try:
            result, record = await self._model(lead, instruction, payload, COMPOSE_SCHEMA, 12000, lead=True, timeout=180)
        except (BudgetExhausted, ProviderError) as error:
            self._stage('compose', 'Could not create the results', 'failed', reason=getattr(error, 'kind', type(error).__name__))
            self._v29()['objects'] = prebuilt + objects
            self._v29()['reply'] = {'headline': 'Results could not be composed', 'text': 'The model could not finish composing results. What was read is still recorded.', 'points': []}
            return None
        faults, counts = [], Counter()
        keep = {**{k: 2 for k in outputs}, **deliverables.limits(required)}
        raws = list(result.get('objects', [])[:16])
        gaps = deliverables.missing(required, objects + [{'zkind': r.get('kind'), 'data': _parsed(r, refs)} for r in raws])
        if gaps:
            # One repair call for what the first pass left out or left too thin, within the same Work budget.
            self._stage('compose', 'Completing ' + ', '.join(g['name'] for g in gaps), 'running', missing=[g['name'] for g in gaps])
            repair = ('Your first pass did not meet these deliverables. Create ONLY these objects now, complete, specific to the request,'
                      ' in the same object format; each replaces the thin one of the same name.\n'
                      + '\n'.join(f"- {g['name']}: kind \"{g['kind']}\", at least {g['minimum']} (you made {g['found']}). Covers: {g['covers']}." for g in gaps))
            try:
                more, _ = await self._model(lead, instruction + '\n\n' + repair, {**payload, 'first_pass': {'reply': result.get('reply'), 'objects': [
                    {'kind': r.get('kind'), 'title': r.get('title')} for r in raws]}}, COMPOSE_SCHEMA, 12000, lead=True, timeout=180)
                replaced = [r for r in more.get('objects', [])[:8] if r.get('kind') in {g['kind'] for g in gaps}]
                # A repaired deliverable replaces the thin object that stood in for it; repaired ones go first so kind limits keep them.
                arrived = Counter(r.get('kind') for r in replaced)
                drop = set()
                for gap in gaps:
                    if gap['index'] is not None and gap['index'] >= len(objects) and arrived[gap['kind']] > 0:
                        arrived[gap['kind']] -= 1
                        drop.add(gap['index'] - len(objects))
                raws = replaced + [r for i, r in enumerate(raws) if i not in drop]
            except (BudgetExhausted, ProviderError, WorkPaused) as error:
                # The repair is optional: an outage here keeps the first pass instead of pausing and redoing the whole composition.
                self._tool('compose.repair', 'failed', reason=getattr(error, 'kind', None) or getattr(error, 'reason', None) or type(error).__name__)
        for index, raw in enumerate(raws):
            kind = raw.get('kind')
            if kind not in outputs or counts[kind] >= keep.get(kind, 2):
                faults.append({'index': index, 'kind': kind, 'reason': 'kind_not_requested'})
                continue
            try:
                parsed = json.loads(raw.get('data_json') or '{}', strict=False)
                if kind == 'code' and isinstance(parsed, dict):
                    parsed = ground_code(parsed, self._v29()['refs'])
                data = zo.build(kind, parsed, refs)
            except (ValueError, TypeError) as error:
                faults.append({'index': index, 'kind': kind, 'reason': str(error)[:120]})
                continue
            if kind == 'picks' and route.get('board') == 'visual':
                data['facet'] = 'other'
            counts[kind] += 1
            cited = sorted({i.get('source') for i in data.get('items', []) + data.get('rows', []) if isinstance(i, dict) and str(i.get('source', '')).startswith('S')})
            sources = [{'id': e['id'], 'title': e.get('title', e['id']), 'url': e.get('url', '')} for e in self.run.evidence if e['id'] in cited]
            part = raw.get('part') if raw.get('part') in ('worker_a', 'worker_b', 'worker_c', 'lead') else ('worker_a' if kind == 'picks' else '')
            objects.append(zo.canvas_object(kind + '-' + str(counts[kind]), kind, safe(raw.get('title') or kind)[:120], data, sources, part))
        objects = prebuilt + objects
        if route.get('board') == 'visual' and 'picks' in route.get('outputs', []):
            objects += self._helper_boards(objects, refs)
        try:
            reply = zo.build('reply', result.get('reply') or {}, refs)
        except ValueError:
            reply = {'headline': self.plan.title or 'Result', 'text': 'Results are on the canvas.', 'figures': [], 'points': []}
        if built_project and objects and objects[0]['zkind'] == 'project':
            objects[0]['data']['summary'] = reply['text'][:400]
        left = deliverables.missing(required, [o for o in objects if not any(o is p for p in prebuilt)])
        self._v29().update({'objects': objects, 'reply': reply, 'faults': faults, 'proposal': result.get('proposal'),
                            'deliverables': {'required': [d.name for d in required], 'missing': [{k: g[k] for k in ('name', 'kind', 'minimum', 'found')} for g in left]}})
        if route.get('intent') == 'modify' and self._v29().get('test_argv'):
            await self._draft_fix(result.get('proposal') or {}, objects, reply)
        else:
            await self._propose_check(result.get('proposal'))
        if route.get('intent') == 'explain':
            self._ensure_code_objects(objects)
        objects = self._v29()['objects']
        self._stage('compose', 'Created ' + str(len(objects)) + ' results', objects=[o['zkind'] for o in objects], rejected=len(faults))
        for obj in objects:
            event = self._emit('canvas_object', status='accepted', object_id=obj['id'], revision=1, object_kind=obj['zkind'])
            self._relate('produces', 'agent:lead', 'object:' + obj['id'], event)
        return None

    def _supplied_diffs(self):
        """The change the person pasted or chose, as Zephium diff objects. Nothing is rewritten."""
        texts = [self.request.query] + [str(row.get('summary', '')) for row in self.request.chosen if row.get('kind') in ('diff', 'code')]
        # V35: a chosen .patch / .diff file is the change itself (its read text, line numbers removed).
        texts += [LINE_PREFIX.sub('', r['text']) for r in self._v29()['refs'] if r.get('kind') == 'file' and str(r.get('path', '')).endswith(('.patch', '.diff'))]
        texts = [t if '```' in t or not re.search(r'^(diff --git|--- |@@ )', t, re.M) else '```diff\n' + t + '\n```' for t in texts]
        # V33: the repository's real git change comes first, as git reported it.
        from . import dev_tasks
        out = dev_tasks.change_diffs((self._v29().get('repo') or {}).get('change'), self._v29().get('change_hunks') or {}, lambda kind, data: zo.build(kind, data, zo.References()))
        for text in texts:
            for block in re.findall(r'```(?:diff|patch)?\n([\s\S]*?)```', text or '') or ([text] if re.search(r'^@@ -\d', text or '', re.M) else []):
                current, path = None, 'change'
                files = []
                for line in block.splitlines():
                    if line.startswith('+++ '):
                        path = re.sub(r'^\+\+\+ (b/)?', '', line).strip()
                        continue
                    if line.startswith(('--- ', 'diff --git', 'index ')):
                        continue
                    head = re.match(r'^@@ -(\d+)(?:,\d+)? \+(\d+)', line)
                    if head:
                        current = {'old_start': int(head.group(1)), 'new_start': int(head.group(2)), 'lines': []}
                        files.append((path, current))
                        continue
                    if current is not None and line[:1] in ('+', '-', ' '):
                        current['lines'].append({'op': {'+': 'add', '-': 'del'}.get(line[:1], 'ctx'), 'text': line[1:]})
                by_path = {}
                for path, hunk in files:
                    if hunk['lines']:
                        by_path.setdefault(path, []).append(hunk)
                for path, hunks in by_path.items():
                    language = posixpath.splitext(path)[1].lstrip('.') or 'text'
                    try:
                        out.append(zo.build('diff', {'path': path, 'language': language, 'summary': 'The change under review', 'hunks': hunks}, zo.References()))
                    except ValueError:
                        pass
        return out

    # V33 UI teardown (Designer): inspect the interface itself, then build its measured objects.

    def _teardown_supplied(self):
        """Interfaces the person pasted as HTML, inspected in place (nothing is fetched). Returns how many."""
        texts = [self.request.query] + [str(row.get('summary', '')) for row in self.request.chosen]
        found = ui_teardown.supplied_html(*texts)[:3]
        for index, html in enumerate(found):
            inspection = ui_teardown.inspect(html, '', '')
            ref = self._ref('R', kind='file', title=inspection['title'] or 'Supplied interface ' + str(index + 1),
                            text='Supplied HTML, ' + str(len(html)) + ' characters', provider='supplied')
            self._v29().setdefault('teardown', []).append({'url': '', 'ref': ref['id'], 'inspection': inspection, 'shot': None})
            self._tool('ui.inspect', 'ok', source='supplied', components=sum(c['count'] for c in inspection['components']),
                       findings=len(inspection['accessibility']))
        return len(found)

    async def _teardown_page(self, browser, row, page):
        """One read page of a UI teardown: its HTML inspected, and a screenshot when the desktop renderer can take one."""
        entries = self._v29().setdefault('teardown', [])
        if len(entries) >= 3 or not page.get('html'):
            if not page.get('html'):
                self._tool('ui.inspect', 'unavailable', url=row['url'], reason='no_html')
            return
        inspection = ui_teardown.inspect(page['html'], page.get('final_url') or row['url'], page.get('title') or row.get('title', ''))
        entry = {'url': row['url'], 'inspection': inspection, 'shot': None}
        entries.append(entry)
        self._tool('ui.inspect', 'ok', url=row['url'], components=sum(c['count'] for c in inspection['components']),
                   findings=len(inspection['accessibility']))
        capture = getattr(browser, 'capture_screenshot', None)
        shot = await asyncio.to_thread(capture) if capture else {'available': False, 'reason': 'not_supported'}
        if not shot.get('available') or not shot.get('png_base64'):
            self._tool('ui.screenshot', 'unavailable', url=row['url'], reason=str(shot.get('reason') or 'no_image'))
            return
        import base64
        try:
            data = base64.b64decode(shot['png_base64'], validate=True)
        except (ValueError, TypeError):
            self._tool('ui.screenshot', 'failed', url=row['url'], reason='bad_image')
            return
        if not data.startswith(b'\x89PNG'):
            self._tool('ui.screenshot', 'failed', url=row['url'], reason='not_png')
            return
        name = str(len(entries)) + '.png'
        folder = self.owner.store.root / 'shots' / self.run.run_id
        await asyncio.to_thread(lambda: (folder.mkdir(parents=True, exist_ok=True), (folder / name).write_bytes(data)))
        entry['shot'] = {'url': '/api/work/runs/' + self.run.research_id + '/shots/' + name,
                         'width': shot.get('width'), 'height': shot.get('height')}
        self._tool('ui.screenshot', 'ok', url=row['url'], bytes=len(data))

    def _teardown_objects(self):
        """The teardown's measured objects: a screenshot per page that has one, the inventory, the accessibility list."""
        entries = [e for e in self._v29().get('teardown', []) if e.get('inspection')]
        if not entries:
            return []
        refs = [e.get('ref') or '' for e in entries]
        out = []
        for index, entry in enumerate(entries):
            if entry.get('shot'):
                out.append(zo.canvas_object('ui-shot-' + str(index + 1), 'media', 'Screenshot: ' + (entry['inspection']['title'] or 'page')[:80],
                                            {'medium': 'image', 'url': entry['shot']['url'], 'poster': entry['shot']['url'],
                                             'title': entry['inspection']['title'][:120], 'provider': 'file'}, part='worker_a'))
        cited = [{'id': e['id'], 'title': e.get('title', e['id']), 'url': e.get('url', '')} for e in self.run.evidence if e['id'] in refs]
        out.append(zo.canvas_object('ui-inventory', 'sheet', 'Component inventory', ui_teardown.inventory_data([e['inspection'] for e in entries], refs), cited))
        out.append(zo.canvas_object('ui-accessibility', 'list', 'Accessibility findings', ui_teardown.accessibility_data([e['inspection'] for e in entries], refs), cited))
        return out

    def _helper_boards(self, objects, refs, total=3, per_board=8):
        """Boards placed from what each image search recorded, as Zephium's browser helpers place picks.

        Only recorded images are used, each once; the lead's own boards come first.
        """
        used = {i.get('source') for o in objects if o['zkind'] == 'picks' for i in o['data']['items']}
        boards = [o for o in objects if o['zkind'] == 'picks']
        groups = {}
        for row in self._v29()['refs']:
            if row['kind'] == 'image' and row['id'] not in used:
                groups.setdefault(row.get('query', ''), []).append(row)
        added = []
        for query, rows in sorted(groups.items(), key=lambda kv: -len(kv[1])):
            if len(boards) + len(added) >= total or len(rows) < 3:
                continue
            words = [w for w in re.findall(r'[a-zA-Z]{3,}', query.lower())][:3]
            items = [{'ref': row['id'], 'name': (row.get('title') or 'Reference').rsplit('.', 1)[0][:80],
                      'tags': words[-2:] or ['reference']} for row in rows[:per_board]]
            try:
                data = zo.build('picks', {'facet': 'other', 'items': items}, refs)
            except ValueError:
                continue
            added.append(zo.canvas_object('board-' + str(len(added) + 1), 'picks', (query or 'References').title()[:60], data,
                                          part='worker_a'))
        return added

    def _ensure_code_objects(self, objects):
        """V34: an explanation of a read file always shows that file's real lines, even if the model made no code object."""
        focus = [r for r in self._v29()['refs'] if r.get('kind') == 'file' and r.get('focus')]
        shown = {o['data'].get('ref') for o in objects if o['zkind'] == 'code'}
        for ref in focus[:2]:
            if ref['id'] in shown:
                continue
            data = ground_code({'ref': ref['id'], 'language': posixpath.splitext(ref['path'])[1].lstrip('.') or 'text'}, self._v29()['refs'])
            try:
                built = zo.build('code', data, zo.References(self._v29()['refs']))
            except ValueError:
                continue
            objects.append(zo.canvas_object('file-' + ref['id'].lower(), 'code', ref['path'], built, part='worker_a'))

    @staticmethod
    def _terminal_text(run):
        """A sandbox run as the terminal shows it: the real header facts, then the output exactly as printed."""
        env = run.get('environment') or {}
        head = ['$ ' + ' '.join(run.get('argv') or []),
                '# cwd ' + str(run.get('cwd', '/workspace')) + ' · image ' + str(run.get('image', '')) + ' · network ' + str(env.get('network', 'none')),
                '# started ' + str(run.get('started_at', '')) + ' · ' + str(run.get('duration_ms', 0)) + ' ms · exit ' + str(run.get('exit_code'))]
        return '\n'.join(head) + '\n' + (run.get('output') or '').rstrip()[-14000:]

    async def _draft_fix(self, proposal, objects, reply):
        """V34: the model's patch goes to an isolated draft copy; the tests re-run there; the person approves before
        anything touches their files. Every object added here shows what actually ran."""
        from .google_accounts import owner_key
        repo = self._v29()['repo']
        argv = self._v29()['test_argv']
        edits = [e for e in proposal.get('edits') or [] if isinstance(e, dict)][:20]
        edits = [({'path': e['path'], 'create': e['replace']} if not e.get('find') and not e.get('delete') else e) for e in edits]
        record = {'files': [e.get('path') for e in edits], 'argv': argv, 'state': 'no_patch'}
        self._v29()['check'] = record
        if not edits:
            self._stage('draft', 'No patch was proposed', 'failed', reason='no_edits')
            return
        drafts = self._drafts()
        owner = DRAFT_OWNER
        named = [f for f in argv if '/' in f or f.endswith(('.py', '.js', '.mjs', '.cjs'))]
        try:
            draft = await asyncio.to_thread(drafts.create, owner, repo['name'], edits, argv, named, self.run.run_id, repo.get('root', ''))
        except Exception as error:
            self._stage('draft', 'The draft could not be created', 'failed', reason=str(error)[:200])
            return
        self._tool('draft.create', 'ok' if draft['files'] else 'empty', files=len(draft['files']), warnings=len(draft['warnings']))
        sandbox = self._v29().get('sandbox') or {}
        runs = {}
        if draft['files'] and sandbox.get('available'):
            for which in ('before', 'after'):
                self._stage('draft', 'Running the tests on the ' + ('original copy' if which == 'before' else 'patched draft'), 'running', which=which)
                runs[which] = await asyncio.to_thread(drafts.run, owner, draft['id'], which)
                self._tool('sandbox.' + which, 'ok' if runs[which].get('status') == 'completed' else runs[which].get('status', 'failed'),
                           exit_code=runs[which].get('exit_code') if runs[which].get('exit_code') is not None else -1)
        draft = await asyncio.to_thread(drafts.get, owner, draft['id'])
        self._v29()['draft'] = drafts.public(draft)
        record.update(state='draft' if draft['files'] else 'patch_not_applicable', draft=draft['id'])
        for index, row in enumerate(draft['files'][:4]):
            language = posixpath.splitext(row['path'])[1].lstrip('.') or 'text'
            try:
                data = zo.build('diff', {'path': row['path'], 'language': language, 'hunks': row['hunks'],
                                         'summary': {'created': 'New file (draft)', 'deleted': 'Deletion proposed (draft)'}.get(row['change'], 'Proposed patch (draft)')
                                         + ' +' + str(row['added']) + ' −' + str(row['removed'])}, zo.References())
            except ValueError:
                continue
            objects.append(zo.canvas_object('draft-diff-' + str(index + 1), 'diff', row['path'], {**data, 'draft': draft['id'], 'change': row['change']}, part='worker_a'))
        for which, run in runs.items():
            if run.get('status') == 'unavailable':
                continue
            objects.append(zo.canvas_object('terminal-' + which, 'code', ('Sandbox run · original' if which == 'before' else 'Sandbox run · patched draft'),
                                            {'language': 'shell', 'text': self._terminal_text(run), 'notes': [], 'terminal': True,
                                             'exit_code': run.get('exit_code'), 'duration_ms': run.get('duration_ms'), 'draft': draft['id']}, part='worker_a'))
        before, after = runs.get('before') or {}, runs.get('after') or {}
        fmt = lambda r: ('exit ' + str(r.get('exit_code')) + ' · ' + (', '.join(f'{v} {k}' for k, v in r.get('counts', {}).items()) or 'no counts')) if r else 'not run'
        items = [{'title': 'Original copy: ' + fmt(before), 'detail': ', '.join(before.get('failing', [])[:4]) or ('All tests passed' if before.get('passed') else ''), 'done': bool(before.get('passed'))},
                 {'title': 'Patched draft: ' + fmt(after), 'detail': ', '.join(after.get('failing', [])[:4]) or ('All tests passed' if after.get('passed') else ''), 'done': bool(after.get('passed'))}]
        items += [{'title': 'Not applied: ' + w[:150]} for w in draft['warnings'][:4]]
        if not sandbox.get('available'):
            items = [{'title': 'Not run: ' + str(sandbox.get('reason', 'no sandbox'))[:150]}] + items[2:]
        try:
            objects.append(zo.canvas_object('sandbox-results', 'list', 'Sandbox test results', zo.build('list', {'style': 'todo', 'items': items}, zo.References()), part='worker_a'))
        except ValueError:
            pass
        # The reply states the real outcome; the model wrote it before the re-run, so it may not claim one.
        if after:
            verdict = ('The patched draft passes: ' if after.get('passed') else 'The patched draft still fails: ') + fmt(after) + ' (was ' + fmt(before) + ').'
        elif draft['files']:
            verdict = 'The patch is drafted but was not run: ' + str(sandbox.get('reason', 'no sandbox')) + '.'
        else:
            verdict = 'The proposed patch did not match the current files, so no draft was made.'
        reply['text'] = (verdict + ' ' + reply.get('text', '')).strip()[:1200]
        reply['points'] = ([verdict[:200], 'Nothing was changed in your project: review the draft, then approve to apply it.'] + list(reply.get('points') or []))[:6]
        self._stage('draft', verdict[:200], draft=draft['id'], files=len(draft['files']),
                    passed=bool(after.get('passed')) if after else None)
        self._emit('approval', status='requested', draft=draft['id'])

    async def _propose_check(self, proposal):
        sandbox = self._v29().get('sandbox') or {}
        repo = self._v29().get('repo') or {}
        if not proposal or not isinstance(proposal, dict):
            return
        record = {'files': [str(f)[:300] for f in proposal.get('files', [])[:20]], 'argv': [str(a)[:300] for a in proposal.get('argv', [])[:20]],
                  'state': 'proposed_not_run'}
        if sandbox.get('available') and repo.get('name') and record['files'] and record['argv']:
            from .google_accounts import owner_key
            from .isolated_workspace import IsolatedWorkspace
            try:
                workspace = IsolatedWorkspace(self.owner.store.root.parent, self.owner.settings)
                proposed = await asyncio.to_thread(workspace.propose, owner_key(self.context),
                                                   {'repository': repo['name'], 'files': record['files'], 'argv': record['argv'], 'edits': {}})
                record.update(state='awaiting_approval', execution=proposed['id'])
                self._stage('approval', 'Approve the sandboxed test run to see real results', 'queued', execution=proposed['id'], argv=record['argv'])
                self._emit('approval', status='requested', execution=proposed['id'])
            except Exception as error:
                record['reason'] = str(error)[:200]
        self._v29()['check'] = record

    # write (Work runs publish a short result, not a research report)

    async def _write_work(self):
        """The Work report: the reply and every result object written out (V30), so the Report shows the whole deliverable."""
        v29 = self._v29()
        reply = v29.get('reply') or {'headline': self.plan.title or 'Result', 'text': '', 'points': []}
        report = deliverables.render(reply, v29.get('objects', []), self.run.evidence)
        lines = [report]
        left = (v29.get('deliverables') or {}).get('missing') or []
        if left:
            lines += ['', '> **Not complete:** ' + '; '.join(f"{g['name']} ({g['found']} of {g['minimum']})" for g in left)
                      + '. The model did not produce these in full within the run budget.']
        check = v29.get('check')
        draft = v29.get('draft')
        if draft:
            runs = draft.get('runs') or {}
            lines += ['', '**Draft (not applied):** ' + ', '.join(f"`{f['path']}` ({f['change']})" for f in draft['files']) + '.'
                      + ''.join(f" {label} run: exit {runs[key].get('exit_code')}." for key, label in (('before', 'Original'), ('after', 'Patched')) if runs.get(key) and runs[key].get('status') != 'unavailable')
                      + ' Review it and approve to apply it to your project.']
        elif check and check.get('state') in ('no_patch', 'patch_not_applicable'):
            lines += ['', '**Check:** no draft was made (' + check['state'].replace('_', ' ') + ').']
        elif check:
            lines += ['', '**Check:** ' + ('awaiting your approval to run `' + ' '.join(check['argv']) + '` in the sandbox.' if check['state'] == 'awaiting_approval'
                                          else 'proposed, not run (`' + ' '.join(check['argv']) + '`). ' + (v29.get('sandbox') or {}).get('reason', ''))]
        paid = int(self.run.usage.get('searches', 0) or 0)
        read = sum(1 for e in self.run.evidence if e.get('verification') == 'read' or e.get('fetched'))
        made = (f'{read} pages read across {len({e.get("domain") for e in self.run.evidence})} sites' if read
                else ', '.join(sorted({r['kind'] + ('s' if not r['kind'].endswith('s') else '') for r in v29['refs']})) or 'your request')
        lines += ['', '*Made from ' + made + ('. Paid search calls: ' + str(paid) + '.*' if paid else '. No paid search was used.*')]
        report = '\n'.join(lines).strip()
        self.run.results['report_text'] = report
        self.run.results['report_failures'] = []
        self.run.results['lead'] = {**self.run.results.get('lead', {}), 'state': 'done', 'summary': safe(reply.get('text', ''))[:600]}
        self._emit('agent', agent='lead', role='lead', state='done', summary=safe(reply.get('text', ''))[:400])
        return None

    def _work_objects(self):
        v29 = self._v29()
        reply = v29.get('reply')
        objects = list(v29.get('objects', []))
        if reply:
            objects.insert(0, zo.canvas_object('reply', 'reply', reply.get('headline') or 'Result', reply, part='lead'))
        return objects
