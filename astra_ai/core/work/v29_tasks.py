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
                                    'argv': {'type': 'array', 'items': {'type': 'string'}}}},
    },
}


def _parsed(raw, refs):
    """A composed object's data built as its kind requires, or {} when it does not build (so it counts as empty)."""
    try:
        return zo.build(raw.get('kind'), json.loads(raw.get('data_json') or '{}', strict=False), refs)
    except (ValueError, TypeError):
        return {}


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
        query = (self.request.query or '').lower()
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
        # A folder named in the request narrows the scope ("map core/work").
        scope = ''
        for token in re.findall(r'[\w.-]+(?:/[\w.-]+)+', self.request.query or ''):
            token = token.strip('/').lower()
            if any(f.lower().startswith(token + '/') for f in files):
                scope = token
                break
        in_scope = [f for f in files if not scope or f.lower().startswith(scope + '/')]
        files_set = set(files)
        # Files the person named or chose are read first and in full (up to 200 lines each).
        wanted = []
        for row in self.request.chosen:
            title = str(row.get('title') or '')
            if title in files_set:
                wanted.append(title)
        for token in re.findall(r'[\w./-]+\.(?:py|ts|tsx|js|jsx|mjs|cjs|svelte|vue|rs|go|java|md|json|toml|yaml|yml)', self.request.query or ''):
            hit = next((f for f in files if f == token or f.endswith('/' + token) or token.endswith('/' + f)), None)
            if hit:
                wanted.append(hit)
        wanted = list(dict.fromkeys(wanted))[:12]
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

        texts = {}
        for path in list(dict.fromkeys(wanted + ranked)):
            got = await asyncio.to_thread(read, path)
            if got.get('error'):
                self._tool('repo.read', 'refused', path=path, reason=got['error'])
                continue
            texts[path] = LINE_PREFIX.sub('', got['summary'])
            if path in wanted:
                ref = self._ref('R', kind='file', path=path, title=path, start=got['start'], end=got['end'],
                                total=got['total_lines'], sha256=got['sha256'], text=got['summary'][:9000])
                reads.append(ref['id'])
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
        self._worker_part('worker_a', 'Repository', 'computer', began)
        self._stage('repository', 'Read ' + str(len(texts)) + ' files in ' + name + (' / ' + scope if scope else ''),
                    files=len(texts), modules=len(modules), edges=len(record['edges']))
        return None

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
            if 'web.images.free' in caps:
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
                        url = zo.safe_url(hit.get('image') or hit.get('url'))
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
            if caps & {'web.search.free', 'web.read'}:
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
        kind = sr.topic(self.request.query, {'compare': 'market'}.get(self.route.get('intent', ''), ''))
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
            names = free_search.plan_sources(self.route.get('intent', 'create'), ' '.join(queries) + ' ' + self.request.query)
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
        if 'web.read' in caps or any(r['direct'] for r in rows):
            budget = reads + sum(1 for r in rows if r['direct'])
            for row in rows[:budget]:
                page = await asyncio.to_thread(browser.read, row['url'])
                status = page.get('status') if isinstance(page, dict) else 'failed'
                if isinstance(page, dict) and page.get('text'):
                    row.update(content=page['text'][:6000], read=True, title=row['title'] or page.get('title', '')[:200],
                               published=row['published'] or (page.get('meta') or {}).get('published', ''),
                               images=[i.get('src') for i in page.get('images', [])[:6] if zo.safe_url(i.get('src'))])
                    if (page.get('meta') or {}).get('canonical'):
                        row['canonical_url'] = sr.canonical(page['meta']['canonical']) or row['canonical_url']
                    if page.get('tables'):
                        row['tables'] = page['tables'][:2]
                    self._tool('browser.read', 'ok', url=row['url'], words=len(page['text'].split()), rendered=bool(page.get('rendered')))
                else:
                    self._tool('browser.read', 'blocked' if status == 'blocked' else 'failed', url=row['url'],
                               reason=str((page or {}).get('reason', '')) if isinstance(page, dict) else '')
        # A direct page that could not be read and has no snippet is not evidence of anything.
        return [r for r in rows if r.get('read') or r['content']]

    # run_check (sandbox)

    async def _run_check(self):
        from .isolated_workspace import IsolatedWorkspace
        workspace = IsolatedWorkspace(self.owner.store.root.parent, self.owner.settings)
        found = await asyncio.to_thread(workspace.availability)
        self._v29()['sandbox'] = found
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
        refs = []
        for row in v29['refs'][:80]:
            keep = {k: row[k] for k in ('id', 'kind', 'title', 'path', 'maker', 'provider', 'start', 'end', 'place', 'who', 'when', 'url') if row.get(k)}
            if row.get('text'):
                keep['text'] = row['text'][:2400 if row['kind'] == 'file' else 700]
            if row['kind'] == 'image' or row.get('images'):
                keep['has_image'] = True
            refs.append(keep)
        return {'references': refs, 'repository': {k: v for k, v in v29.get('repo', {}).items() if k not in ('reads',)},
                'accounts': v29.get('account', {}), 'sandbox': v29.get('sandbox', {}),
                'supplied': self.request.chosen[:12]}

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
        shapes = {k: zo.SHAPES[k] for k in outputs}
        required = deliverables.for_workflow(self.request.workflow, outputs)
        payload = {
            'request': self.request.query, 'workflow': self.request.workflow, 'intent': route.get('intent'),
            'answer_to_your_question': self.run.request.get('answer', ''),
            'brief': self._brief(), **({'deliverable': self.workflow.deliverable} if self.workflow else {}),
            'outputs_to_create': shapes, 'material': self._material(),
            'already_built': [o['zkind'] + ': ' + o['title'] for o in objects],
            'today': datetime.now().astimezone().strftime('%A %Y-%m-%d %H:%M %Z'),
        }
        instruction = (
            'You are AEGIS doing the task itself, not researching how to do it. Create the requested result objects from the material.'
            ' Each object: kind (one of outputs_to_create), a short title, part ("" or a helper key), and data_json = the object data as a JSON string in exactly the shape given.'
            ' Create only the kinds listed. Never invent a URL, image, price, figure, date, event or message:'
            ' to use a gathered item, put its reference id (I3, S2, R1, E4, M2) in the item\'s "ref" field and the app fills the link and pictures.'
            ' For picks of images, use only references with has_image, group them into coherent boards (one picks object per direction or source), with tags of at most three words and one recommended anchor.'
            ' A visual board uses the material generously: two or three picks objects of four to eight items each, every item a distinct reference, dropping only off-topic ones.'
            ' For code work, quote only lines present in the material and say plainly that nothing was run unless the material shows a run.'
            ' The reply is the short answer the person reads first: a headline, two or three sentences, and a few points that fit this task;'
            ' points state the key decisions or findings (a date, a channel, a number, a choice), never describe the document itself.'
            ' Plan steps carry a detail line saying what is done and by which role.'
            + (' For this visual board the points are exactly: Palette, Type, Texture, Composition, Avoid.' if route.get('board') == 'visual' else '') +
            ' proposal is only for code fixes: the files to change and the test command, as an argument list; otherwise omit it.'
            + ('\n' + deliverables.instruction(required) if required else '')
        )
        self._stage('compose', 'Creating the results', 'running', outputs=outputs, deliverables=[d.name for d in required])
        try:
            result, record = await self._model(lead, instruction, payload, COMPOSE_SCHEMA, 12000, lead=True, timeout=180)
        except (BudgetExhausted, ProviderError) as error:
            self._stage('compose', 'Could not create the results', 'failed', reason=getattr(error, 'kind', type(error).__name__))
            self._v29()['objects'] = objects
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
                data = zo.build(kind, json.loads(raw.get('data_json') or '{}', strict=False), refs)
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
        if route.get('board') == 'visual' and 'picks' in route.get('outputs', []):
            objects += self._helper_boards(objects, refs)
        try:
            reply = zo.build('reply', result.get('reply') or {}, refs)
        except ValueError:
            reply = {'headline': self.plan.title or 'Result', 'text': 'Results are on the canvas.', 'figures': [], 'points': []}
        if built_project and objects and objects[0]['zkind'] == 'project':
            objects[0]['data']['summary'] = reply['text'][:400]
        left = deliverables.missing(required, objects)
        self._v29().update({'objects': objects, 'reply': reply, 'faults': faults, 'proposal': result.get('proposal'),
                            'deliverables': {'required': [d.name for d in required], 'missing': [{k: g[k] for k in ('name', 'kind', 'minimum', 'found')} for g in left]}})
        await self._propose_check(result.get('proposal'))
        self._stage('compose', 'Created ' + str(len(objects)) + ' results', objects=[o['zkind'] for o in objects], rejected=len(faults))
        for obj in objects:
            event = self._emit('canvas_object', status='accepted', object_id=obj['id'], revision=1, object_kind=obj['zkind'])
            self._relate('produces', 'agent:lead', 'object:' + obj['id'], event)
        return None

    def _supplied_diffs(self):
        """The change the person pasted or chose, as Zephium diff objects. Nothing is rewritten."""
        texts = [self.request.query] + [str(row.get('summary', '')) for row in self.request.chosen if row.get('kind') in ('diff', 'code')]
        out = []
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
        if check:
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
