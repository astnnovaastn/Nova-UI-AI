"""V33: a deterministic, bounded index of a local repository the person authorized.

What it does (brief section 17):
- recursive discovery, breadth first and sorted, so the same folder always gives the same index and a
  large repository keeps its top-level structure when the file limit is reached;
- ignore rules: built-in build/dependency folders (node_modules, .venv, dist, build...), hidden and
  sensitive names, and every .gitignore on the way down (globs, **, anchored, dir-only, negation);
- a type filter (text source suffixes), a per-file size limit and a total file limit;
- a dependency index (Python and JS/TS imports, resolved inside the repository; packages kept as external);
- incremental reading: an optional cache keyed by (size, mtime) so unchanged files are not read again;
- bounded context selection: the few files and line ranges relevant to a question, within a character
  budget. A whole repository is never returned as one prompt;
- path tracking (every result names its repository-relative path), recorded errors, and cancellation
  (a `should_stop` callable checked between directories and files).

It reads files only; it never runs project code. `git_changes` runs read-only git commands with an
argument list (no shell) and options that switch off repository-configured helpers.
"""
from __future__ import annotations

import hashlib
import json
import os
import posixpath
import re
import shutil
import subprocess
from collections import Counter, defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path

IGNORED_DIRS = frozenset({
    '.git', '.hg', '.svn', 'node_modules', '.venv', 'venv', 'env', '__pycache__', 'dist', 'build', 'out', 'target',
    '.next', '.nuxt', '.svelte-kit', '.turbo', '.parcel-cache', '.cache', 'coverage', '.pytest_cache', '.mypy_cache',
    '.ruff_cache', '.tox', '.idea', '.vscode', 'site-packages', 'bower_components', '.gradle', '.terraform',
})
SENSITIVE_WORDS = ('credential', 'secret', 'token', 'password', 'private-key', 'id_rsa')
SUFFIXES = frozenset({
    '.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.svelte', '.vue', '.rs', '.go', '.java', '.c', '.h', '.cpp',
    '.cs', '.css', '.scss', '.html', '.md', '.txt', '.json', '.toml', '.yaml', '.yml', '.sql', '.cfg', '.ini',
})
CODE_SUFFIXES = ('.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.svelte', '.vue')
PY_IMPORT = re.compile(r'^\s*(?:from\s+([.\w]+)\s+import|import\s+([\w.]+(?:\s*,\s*[\w.]+)*))', re.M)
JS_IMPORT = re.compile(r'''(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\(\s*|^\s*import\s+|export\s[^'"]*?from\s*)['"]([^'"]+)['"]''', re.M)
WORD = re.compile(r'[A-Za-z_][A-Za-z0-9_]{2,}')


class Cancelled(Exception):
    """The caller asked the index to stop. `partial` holds what was found so far."""

    def __init__(self, partial=None):
        super().__init__('cancelled')
        self.partial = partial


@dataclass(frozen=True)
class Limits:
    max_files: int = 20000
    max_dirs: int = 6000
    max_depth: int = 24
    max_file_bytes: int = 512_000
    # Dependency and context reading reads at most this much of one file.
    read_bytes: int = 200_000
    max_dependency_files: int = 4000


# ---------------------------------------------------------------- .gitignore

def _glob_regex(glob):
    out, i = [], 0
    while i < len(glob):
        c = glob[i]
        if glob.startswith('**/', i):
            out.append('(?:.*/)?')
            i += 3
            continue
        if glob.startswith('/**', i) and i + 3 == len(glob):
            out.append('/.*')
            i += 3
            continue
        if glob.startswith('**', i):
            out.append('.*')
            i += 2
            continue
        if c == '*':
            out.append('[^/]*')
        elif c == '?':
            out.append('[^/]')
        elif c == '[':
            end = glob.find(']', i + 1)
            if end < 0:
                out.append(re.escape(c))
            else:
                body = glob[i + 1:end].replace('\\', '\\\\')
                if body.startswith('!'):
                    body = '^' + body[1:]
                out.append('[' + body + ']')
                i = end
        elif c == '\\' and i + 1 < len(glob):
            i += 1
            out.append(re.escape(glob[i]))
        else:
            out.append(re.escape(c))
        i += 1
    return re.compile(''.join(out) + r'\Z', re.S)


@dataclass(frozen=True)
class _Rule:
    base: str          # the folder holding the .gitignore, repository-relative ('' for the root)
    regex: re.Pattern
    negate: bool
    dir_only: bool
    anchored: bool


def parse_gitignore(text, base=''):
    rules = []
    for raw in text.splitlines():
        line = raw.rstrip('\n\r')
        if not line.strip() or line.startswith('#'):
            continue
        # Trailing spaces are ignored unless escaped.
        line = re.sub(r'(?<!\\)\s+$', '', line)
        negate = line.startswith('!')
        if negate:
            line = line[1:]
        if line.startswith('\\'):
            line = line[1:]
        dir_only = line.endswith('/')
        line = line.rstrip('/')
        if not line:
            continue
        anchored = '/' in line
        line = line.lstrip('/')
        rules.append(_Rule(base, _glob_regex(line), negate, dir_only, anchored))
    return rules


def ignored_by(rules, relative, is_dir):
    """Git's rule: the last matching pattern decides; `!` re-includes."""
    decision = None
    name = relative.rsplit('/', 1)[-1]
    for rule in rules:
        if rule.dir_only and not is_dir:
            continue
        if rule.base:
            if not relative.startswith(rule.base + '/'):
                continue
            local = relative[len(rule.base) + 1:]
        else:
            local = relative
        target = local if rule.anchored else name
        if rule.regex.match(target):
            decision = not rule.negate
    return bool(decision)


# ---------------------------------------------------------------- imports

def resolve_import(source_file, spec, files_set, language):
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
        candidates = (stem + '.py', stem + '/__init__.py')
        for candidate in candidates:
            if candidate in files_set:
                return candidate
        # Absolute imports from a source root below the repository ("src/pkg/x.py" imported as "pkg.x").
        for candidate in candidates:
            hits = sorted(known for known in files_set if known.endswith('/' + candidate))
            if hits:
                return hits[0]
        return None
    if not spec.startswith('.'):
        return None
    stem = posixpath.normpath(posixpath.join(base, spec))
    for suffix in ('', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.svelte', '.vue', '/index.ts', '/index.js', '/index.tsx'):
        if stem + suffix in files_set:
            return stem + suffix
    return None


def imports_of(path, text):
    """(specs) imported by one source file, in order, without duplicates."""
    language = 'py' if path.endswith('.py') else 'js'
    found = []
    if language == 'py':
        for match in PY_IMPORT.finditer(text):
            if match.group(1):
                found.append(match.group(1))
            else:
                found.extend(part.strip().split(' ')[0] for part in match.group(2).split(','))
    else:
        found = [m.group(1) for m in JS_IMPORT.finditer(text)]
    return language, list(dict.fromkeys(s for s in found if s))


def external_name(spec, language):
    if language == 'py':
        return spec.split('.')[0]
    if spec.startswith(('node:', 'http:', 'https:', '$', '~', '/')):
        return spec
    parts = spec.split('/')
    return '/'.join(parts[:2]) if spec.startswith('@') else parts[0]


# ---------------------------------------------------------------- the index

@dataclass
class ScanResult:
    root: str
    files: list = field(default_factory=list)          # [{path, size, mtime_ns}] sorted by path
    skipped: dict = field(default_factory=dict)        # reason -> count
    ignored_dirs: list = field(default_factory=list)   # first ignored folders, for the person to see
    errors: list = field(default_factory=list)         # [{path, reason}]
    truncated: bool = False
    cancelled: bool = False
    dirs: int = 0

    def as_dict(self):
        return {'root': self.root, 'files': self.files, 'skipped': dict(sorted(self.skipped.items())),
                'ignored_dirs': self.ignored_dirs[:50], 'errors': self.errors[:50], 'truncated': self.truncated,
                'cancelled': self.cancelled, 'dirs': self.dirs, 'count': len(self.files)}


def sensitive(name):
    lower = name.lower()
    return lower.startswith('.env') or any(word in lower for word in SENSITIVE_WORDS)


class RepoIndex:
    def __init__(self, root, *, limits=None, suffixes=SUFFIXES, cache_path=None, should_stop=None, only=None):
        self.root = Path(root).resolve()
        self.limits = limits or Limits()
        self.suffixes = frozenset(s.lower() for s in suffixes) if suffixes else None
        self.cache_path = Path(cache_path) if cache_path else None
        self.should_stop = should_stop or (lambda: False)
        # A grant for single files ("Open File") limits the index to those paths.
        self.only = sorted(set(only)) if only else None
        self._scan = None
        self._cache = None

    # discovery

    def _check(self, partial):
        if self.should_stop():
            partial.cancelled = True
            raise Cancelled(partial)

    def scan(self):
        if self._scan is not None:
            return self._scan
        result = ScanResult(root=self.root.name)
        skipped = Counter()
        if not self.root.is_dir():
            result.errors.append({'path': '', 'reason': 'root_unavailable'})
            self._scan = result
            return result
        rules = []
        queue = deque([('', 0)])
        found = []
        while queue:
            self._check(result)
            relative_dir, depth = queue.popleft()
            folder = self.root / relative_dir if relative_dir else self.root
            result.dirs += 1
            if result.dirs > self.limits.max_dirs:
                result.truncated = True
                skipped['folder_limit'] += 1 + len(queue)
                break
            try:
                entries = sorted(os.scandir(folder), key=lambda e: e.name)
            except OSError as error:
                result.errors.append({'path': relative_dir, 'reason': type(error).__name__})
                continue
            ignore_file = next((e for e in entries if e.name == '.gitignore' and e.is_file(follow_symlinks=False)), None)
            if ignore_file is not None:
                try:
                    with open(ignore_file.path, 'rb') as stream:
                        rules = rules + parse_gitignore(stream.read(200_000).decode('utf-8', 'replace'), relative_dir)
                except OSError as error:
                    result.errors.append({'path': posixpath.join(relative_dir, '.gitignore'), 'reason': type(error).__name__})
            for entry in entries:
                relative = posixpath.join(relative_dir, entry.name) if relative_dir else entry.name
                try:
                    is_link = entry.is_symlink() or (hasattr(entry, 'is_junction') and entry.is_junction())
                    is_dir = not is_link and entry.is_dir(follow_symlinks=False)
                except OSError:
                    skipped['unreadable'] += 1
                    continue
                if is_link:
                    skipped['link'] += 1
                    continue
                if is_dir:
                    if entry.name.lower() in IGNORED_DIRS or entry.name.startswith('.'):
                        skipped['ignored_folder'] += 1
                        result.ignored_dirs.append(relative + '/')
                    elif ignored_by(rules, relative, True):
                        skipped['gitignore'] += 1
                        result.ignored_dirs.append(relative + '/')
                    elif depth + 1 > self.limits.max_depth:
                        skipped['too_deep'] += 1
                    else:
                        queue.append((relative, depth + 1))
                    continue
                if entry.name.startswith('.') or sensitive(entry.name):
                    skipped['hidden_or_sensitive'] += 1
                    continue
                if self.suffixes is not None and posixpath.splitext(entry.name)[1].lower() not in self.suffixes:
                    skipped['type'] += 1
                    continue
                if ignored_by(rules, relative, False):
                    skipped['gitignore'] += 1
                    continue
                if self.only is not None and relative not in self.only:
                    skipped['not_granted'] += 1
                    continue
                try:
                    stat = entry.stat(follow_symlinks=False)
                except OSError as error:
                    result.errors.append({'path': relative, 'reason': type(error).__name__})
                    continue
                if stat.st_size > self.limits.max_file_bytes:
                    skipped['too_large'] += 1
                    continue
                if len(found) >= self.limits.max_files:
                    result.truncated = True
                    skipped['file_limit'] += 1
                    continue
                found.append({'path': relative, 'size': stat.st_size, 'mtime_ns': stat.st_mtime_ns})
        result.files = sorted(found, key=lambda row: row['path'])
        result.skipped = dict(skipped)
        self._scan = result
        return result

    def paths(self):
        return [row['path'] for row in self.scan().files]

    def path_ignored(self, relative):
        """Whether one path is excluded by the ignore rules, reading only the .gitignore files on its way."""
        parts = relative.split('/')
        if any(p.lower() in IGNORED_DIRS or p.startswith('.') for p in parts[:-1]) or sensitive(parts[-1]):
            return True
        rules = []
        for depth in range(len(parts)):
            folder = '/'.join(parts[:depth])
            ignore = (self.root / folder / '.gitignore') if folder else (self.root / '.gitignore')
            try:
                if ignore.is_file() and not ignore.is_symlink():
                    rules += parse_gitignore(ignore.read_bytes()[:200_000].decode('utf-8', 'replace'), folder)
            except OSError:
                pass
            if depth < len(parts) - 1 and ignored_by(rules, '/'.join(parts[:depth + 1]), True):
                return True
        if self.only is not None and relative not in self.only:
            return True
        return ignored_by(rules, relative, False)

    def tree(self, max_entries=600):
        """Nested folders and files for a file tree, capped. Folders first, both sorted."""
        root = {'name': self.root.name, 'path': '', 'kind': 'folder', 'children': {}}
        for path in self.paths():
            node = root
            parts = path.split('/')
            for index, part in enumerate(parts[:-1]):
                node = node['children'].setdefault(part, {'name': part, 'path': '/'.join(parts[:index + 1]), 'kind': 'folder', 'children': {}})
            node['children'][parts[-1]] = {'name': parts[-1], 'path': path, 'kind': 'file'}
        count = [0]

        def out(node):
            if node['kind'] == 'file':
                return {k: node[k] for k in ('name', 'path', 'kind')}
            children = sorted(node['children'].values(), key=lambda n: (n['kind'] != 'folder', n['name'].lower()))
            kept = []
            for child in children:
                if count[0] >= max_entries:
                    break
                count[0] += 1
                kept.append(out(child))
            row = {'name': node['name'], 'path': node['path'], 'kind': 'folder', 'children': kept}
            if len(kept) < len(children):
                row['more'] = len(children) - len(kept)
            return row

        return out(root)

    # reading

    def _within(self, relative):
        if not isinstance(relative, str) or not relative or relative.startswith('/') or '\\' in relative or ':' in relative:
            return None
        parts = relative.split('/')
        if any(p in ('', '.', '..') for p in parts):
            return None
        candidate = self.root / relative
        for part in [candidate, *candidate.parents]:
            if part == self.root:
                break
            if part.is_symlink() or (hasattr(part, 'is_junction') and part.is_junction()):
                return None
        resolved = candidate.resolve()
        return resolved if resolved.is_relative_to(self.root) and resolved.is_file() else None

    def read_text(self, relative, limit=None):
        """A file's text (UTF-8), only for a path the scan listed. Raises ValueError with a reason."""
        if relative not in {row['path'] for row in self.scan().files}:
            raise ValueError('path_not_indexed')
        path = self._within(relative)
        if path is None:
            raise ValueError('path_not_allowed')
        with path.open('rb') as stream:
            raw = stream.read((limit or self.limits.max_file_bytes) + 1)
        if b'\x00' in raw:
            raise ValueError('not_text')
        return raw[:limit or self.limits.max_file_bytes].decode('utf-8', 'replace'), raw

    # incremental cache

    def _load_cache(self):
        if self._cache is None:
            self._cache = {}
            if self.cache_path and self.cache_path.is_file():
                try:
                    data = json.loads(self.cache_path.read_text(encoding='utf-8'))
                    if data.get('root') == str(self.root) and data.get('version') == 1:
                        self._cache = data.get('files', {})
                except (OSError, ValueError):
                    self._cache = {}
        return self._cache

    def _save_cache(self):
        if not self.cache_path or self._cache is None:
            return
        try:
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            temp = self.cache_path.with_suffix('.tmp')
            temp.write_text(json.dumps({'version': 1, 'root': str(self.root), 'files': self._cache}, sort_keys=True), encoding='utf-8')
            temp.replace(self.cache_path)
        except OSError:
            pass

    def dependencies(self):
        """Imports per file, resolved inside the repository; packages are external. Reads changed files only."""
        scan = self.scan()
        files_set = {row['path'] for row in scan.files}
        cache = self._load_cache()
        imports, external = {}, {}
        stats = {'read': 0, 'cached': 0, 'errors': 0}
        code = [row for row in scan.files if row['path'].endswith(CODE_SUFFIXES)][:self.limits.max_dependency_files]
        live = set()
        for row in code:
            self._check(scan)
            path = row['path']
            live.add(path)
            key = [row['size'], row['mtime_ns']]
            entry = cache.get(path)
            if entry and entry.get('key') == key:
                stats['cached'] += 1
            else:
                try:
                    text, raw = self.read_text(path, self.limits.read_bytes)
                except (OSError, ValueError):
                    stats['errors'] += 1
                    continue
                language, specs = imports_of(path, text)
                entry = {'key': key, 'sha256': hashlib.sha256(raw).hexdigest(), 'language': language, 'specs': specs}
                cache[path] = entry
                stats['read'] += 1
            targets, outside = [], []
            for spec in entry['specs']:
                target = resolve_import(path, spec, files_set, entry['language'])
                if target and target != path:
                    targets.append(target)
                elif not target and not spec.startswith('.'):
                    outside.append(external_name(spec, entry['language']))
            imports[path] = sorted(set(targets))
            external[path] = sorted(set(outside))
        for stale in [p for p in cache if p not in live]:
            del cache[stale]
        self._save_cache()
        importers = defaultdict(list)
        for src, targets in imports.items():
            for dst in targets:
                importers[dst].append(src)
        packages = Counter(name for names in external.values() for name in names)
        return {'imports': imports, 'importers': {k: sorted(v) for k, v in sorted(importers.items())},
                'external': dict(sorted(packages.items(), key=lambda kv: (-kv[1], kv[0]))), 'stats': stats,
                'files': len(code)}

    def modules(self, depth=2, limit=28):
        """Folders `depth` levels down as modules, with import edges between them, for an architecture map."""
        deps = self.dependencies()
        module_of = lambda path: '/'.join(path.split('/')[:-1][:depth]) or '(root)'
        counts = Counter(module_of(p) for p in self.paths())
        edges = Counter()
        for src, targets in deps['imports'].items():
            for dst in targets:
                a, b = module_of(src), module_of(dst)
                if a != b:
                    edges[(a, b)] += 1
        degree = Counter()
        for (a, b), n in edges.items():
            degree[a] += n
            degree[b] += n
        kept = sorted(counts, key=lambda m: (-(degree[m] * 3 + counts[m]), m))[:limit]
        return {'modules': [{'id': m, 'files': counts[m]} for m in kept],
                'edges': [{'from': a, 'to': b, 'count': n} for (a, b), n in sorted(edges.items(), key=lambda kv: (-kv[1], kv[0])) if a in kept and b in kept][:80],
                'external': list(deps['external'].items())[:20]}

    # bounded context

    def select_context(self, query='', wanted=(), budget_chars=24000, max_files=12, lines_per_file=160):
        """The files and line ranges most relevant to `query`, within `budget_chars`. Deterministic.

        Named files come first; then files whose path or text shares words with the request, then the most
        imported files. Never more than `max_files` files and `budget_chars` characters in total.
        """
        paths = self.paths()
        known = set(paths)
        terms = sorted({w.lower() for w in WORD.findall(query or '') if len(w) >= 3} - {'the', 'and', 'for', 'this', 'that', 'with', 'what', 'how', 'does', 'explain', 'code', 'file', 'project'})
        named = [p for p in wanted if p in known]
        for token in re.findall(r'[\w./-]+\.\w{1,6}', query or ''):
            hit = next((p for p in paths if p == token or p.endswith('/' + token)), None)
            if hit:
                named.append(hit)
        named = list(dict.fromkeys(named))
        deps = self.dependencies()
        imported = Counter({p: len(v) for p, v in deps['importers'].items()})
        scores = {}
        for path in paths:
            words = set(re.split(r'[/_\-.]', path.lower()))
            score = sum(3 for t in terms if t in words) + sum(1 for t in terms if t in path.lower())
            if score or imported.get(path):
                scores[path] = score * 10 + min(imported.get(path, 0), 9)
        # Text matches, only over the best path candidates and the code files, bounded.
        pool = sorted(scores, key=lambda p: (-scores[p], p))[:200] + [p for p in paths if p.endswith(CODE_SUFFIXES)][:200]
        for path in dict.fromkeys(pool):
            self._check(self.scan())
            if not terms:
                break
            try:
                text, _ = self.read_text(path, 64_000)
            except (OSError, ValueError):
                continue
            lower = text.lower()
            hits = sum(min(lower.count(t), 5) for t in terms)
            if hits:
                scores[path] = scores.get(path, 0) + hits * 2
        ranked = named + [p for p in sorted(scores, key=lambda p: (-scores[p], p)) if p not in named]
        chunks, used = [], 0
        for path in ranked:
            if len(chunks) >= max_files or used >= budget_chars:
                break
            try:
                text, raw = self.read_text(path)
            except (OSError, ValueError) as error:
                chunks.append({'path': path, 'error': str(error)})
                continue
            lines = text.splitlines()
            start = 1
            if path not in named and terms:
                # The window around the first line that mentions the request's words.
                first = next((i for i, line in enumerate(lines) if any(t in line.lower() for t in terms)), 0)
                start = max(1, first + 1 - 20)
            end = min(len(lines), start + lines_per_file - 1)
            body = '\n'.join(f'{i}: {line}' for i, line in enumerate(lines[start - 1:end], start))
            room = budget_chars - used
            if len(body) > room:
                body = body[:room].rsplit('\n', 1)[0]
                end = start + body.count('\n')
            if not body:
                break
            used += len(body)
            chunks.append({'path': path, 'start': start, 'end': end, 'total_lines': len(lines), 'text': body,
                           'sha256': hashlib.sha256(raw).hexdigest(),
                           'why': 'named' if path in named else ('matches the request' if scores.get(path, 0) >= 10 else 'widely imported')})
        return {'chunks': chunks, 'chars': used, 'budget': budget_chars, 'considered': len(ranked), 'files': len(paths)}


# ---------------------------------------------------------------- git (read-only)

REF = re.compile(r'^(?:HEAD(?:[~^]\d{0,3})*|[0-9a-fA-F]{4,40}|[A-Za-z0-9][A-Za-z0-9._/-]{0,120})$')


def _git(root, args, timeout=20, max_bytes=600_000):
    git = shutil.which('git')
    if not git:
        return None, 'git_not_installed'
    null = os.devnull
    command = [git, '--no-pager',
               # Repository configuration cannot start helpers: no fsmonitor, hooks, external diff or pager.
               '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=' + null, '-c', 'diff.external=',
               '-c', 'core.pager=cat', '-c', 'core.untrackedCache=false', '-c', 'color.ui=false',
               '-C', str(root), *args]
    env = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0', 'GIT_PAGER': 'cat', 'LC_ALL': 'C',
           'GIT_CONFIG_NOSYSTEM': '1', 'GIT_EXTERNAL_DIFF': ''}
    try:
        done = subprocess.run(command, capture_output=True, timeout=timeout, env=env, stdin=subprocess.DEVNULL,
                              creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    except subprocess.TimeoutExpired:
        return None, 'git_timeout'
    except OSError:
        return None, 'git_unavailable'
    if done.returncode != 0:
        message = done.stderr.decode('utf-8', 'replace').strip().splitlines()
        return None, (message[0][:200] if message else 'git_failed')
    return done.stdout[:max_bytes].decode('utf-8', 'replace'), ('truncated' if len(done.stdout) > max_bytes else '')


def parse_unified_diff(text, max_files=40, max_lines=4000):
    """Unified diff text -> [{path, status, hunks:[{old_start,new_start,lines:[{op,text}]}], added, removed}]."""
    files, current, hunk, total = [], None, None, 0
    for line in (text or '').splitlines():
        if line.startswith('diff --git '):
            match = re.match(r'diff --git a/(.+?) b/(.+)$', line)
            current = {'path': match.group(2) if match else line[11:], 'status': 'modified', 'hunks': [], 'added': 0, 'removed': 0}
            files.append(current)
            hunk = None
            continue
        if current is None:
            continue
        if line.startswith('new file mode'):
            current['status'] = 'added'
        elif line.startswith('deleted file mode'):
            current['status'] = 'deleted'
        elif line.startswith('rename to '):
            current['status'] = 'renamed'
            current['path'] = line[10:]
        elif line.startswith('Binary files'):
            current['binary'] = True
        elif line.startswith('@@'):
            head = re.match(r'^@@ -(\d+)(?:,\d+)? \+(\d+)', line)
            hunk = {'old_start': int(head.group(1)) if head else 0, 'new_start': int(head.group(2)) if head else 0, 'lines': []}
            current['hunks'].append(hunk)
        elif hunk is not None and line[:1] in ('+', '-', ' ') and not line.startswith(('+++ ', '--- ')):
            total += 1
            if total > max_lines:
                break
            op = {'+': 'add', '-': 'del'}.get(line[:1], 'ctx')
            if op == 'add':
                current['added'] += 1
            elif op == 'del':
                current['removed'] += 1
            hunk['lines'].append({'op': op, 'text': line[1:]})
    return files[:max_files]


def git_changes(root, *, base='', head='', staged=False, paths=None):
    """The real change: the working tree against HEAD (or the index), one commit, or base...head (a PR range)."""
    root = Path(root)
    inside, why = _git(root, ['rev-parse', '--is-inside-work-tree'], timeout=8)
    if inside is None or inside.strip() != 'true':
        return {'available': False, 'reason': 'not_a_git_repository' if inside is None and 'not a git' in (why or '').lower() else (why or 'not_a_git_repository')}
    for ref in (base, head):
        if ref and not REF.match(ref):
            return {'available': False, 'reason': 'invalid_ref'}
    safe_paths = [p for p in (paths or []) if isinstance(p, str) and re.fullmatch(r'[\w./ -]{1,300}', p) and '..' not in p.split('/')][:40]
    # Line-ending-only differences (CRLF checkouts on Windows) are not a change anyone made.
    common = ['--no-ext-diff', '--no-textconv', '--no-color', '--unified=3', '--find-renames', '--ignore-cr-at-eol']
    if base and head:
        args, kind = ['diff', *common, base + '...' + head], 'range'
    elif base:
        args, kind = ['show', *common, '--format=commit %H%nAuthor: %an%nDate: %ad%n%n%s%n', base], 'commit'
    else:
        args, kind = ['diff', *common, *(['--cached'] if staged else ['HEAD'])], 'staged' if staged else 'working_tree'
    if safe_paths:
        args += ['--', *safe_paths]
    text, note = _git(root, args)
    if text is None:
        return {'available': False, 'reason': note}
    branch, _ = _git(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout=8)
    commit, _ = _git(root, ['rev-parse', '--short', 'HEAD'], timeout=8)
    status, _ = _git(root, ['status', '--porcelain=v1', '--untracked-files=normal'], timeout=10)
    untracked = sorted(line[3:] for line in (status or '').splitlines() if line.startswith('?? '))[:50]
    header = text.split('\ndiff --git', 1)[0] if kind == 'commit' else ''
    return {'available': True, 'kind': kind, 'branch': (branch or '').strip(), 'head': (commit or '').strip(),
            'base': base, 'target': head, 'diff': text, 'truncated': note == 'truncated', 'summary': header.strip()[:600],
            'files': parse_unified_diff(text), 'untracked': untracked}
