"""V34: which authorized project and which files a developer request is about, decided before any model call.

V33 bug this replaces: with nothing naming a repository, `_choose_repository` took the first *configured*
root (the AEGIS source itself), so a folder the person had just granted was never read. Now:

1. a repository the person chose on the canvas (a chosen row's `repository`) wins;
2. then a path in the request or the answer that lies inside a grant (the launcher's Choose folder / Choose
   file puts the granted path there), narrowing the scope to that sub-folder or file;
3. then a grant or repository named in words;
4. then the roots that actually contain a file the request names (`ai_model.py`);
5. then the person's own single grant (their choice beats the host's configured repositories);
6. several candidates and nothing to tell them apart: one question with the real choices.

Files the request names are looked up in the chosen root's index (gitignore and size rules apply):
one match is read, several are asked about, none is reported as missing. Nothing is invented and the
web is never searched for a file name. Pure reads; no project code runs.
"""
from __future__ import annotations

import difflib
import posixpath
import re
from pathlib import Path, PureWindowsPath

FILE_TOKEN = re.compile(r'(?<![\w/\\.-])((?:[\w.-]+[/\\])*[\w.-]+\.(?:py|pyi|ts|tsx|js|jsx|mjs|cjs|svelte|vue|rs|go|java|kt|cs|c|h|cpp|hpp|rb|php|swift|sql|md|json|toml|yaml|yml|css|scss|html|patch|diff))\b', re.I)
ABS_PATH = re.compile(r'(?:[A-Za-z]:[\\/]|\\\\)[^\n"\'<>|?*]+')
DEV_INTENTS = ('explain', 'map', 'review', 'modify')


def _norm(text):
    return (text or '').replace('\\', '/').strip().strip('.,;:)]}').rstrip('/')


def absolute_paths(*texts):
    """Absolute Windows paths written in the text, trimmed at the first word that is clearly prose."""
    out = []
    for text in texts:
        for match in ABS_PATH.finditer(text or ''):
            raw = match.group(0).strip().rstrip('.,;:)')
            # A path in prose ends where the sentence goes on: try the longest prefix that exists.
            parts = re.split(r'(\s+)', raw)
            for cut in range(len(parts), 0, -1):
                candidate = ''.join(parts[:cut]).strip()
                if candidate and Path(candidate).exists():
                    out.append(str(Path(candidate)))
                    break
            else:
                out.append(raw)
    return list(dict.fromkeys(out))


def named_files(*texts):
    """File names written in the request ("ai_model.py", "src/app/main.ts"), normalised to forward slashes."""
    found = []
    for text in texts:
        cleaned = ABS_PATH.sub(' ', text or '')
        for match in FILE_TOKEN.finditer(cleaned):
            token = _norm(match.group(1))
            if token and not token.startswith(('http', 'www.')):
                found.append(token)
    return list(dict.fromkeys(found))[:8]


def match_files(files, token):
    """Index paths a name refers to: an exact relative path, else a path ending in it, else the same base name."""
    token = token.lower()
    lowered = {f.lower(): f for f in files}
    if token in lowered:
        return [lowered[token]]
    tail = [f for f in files if f.lower().endswith('/' + token)]
    if tail:
        return sorted(tail)
    base = posixpath.basename(token)
    return sorted(f for f in files if posixpath.basename(f).lower() == base)


def _inside(path, root):
    try:
        return Path(path).resolve().is_relative_to(root)
    except (OSError, ValueError):
        return False


class Resolution(dict):
    @property
    def question(self):
        return self.get('question')


def resolve(repos, query='', answer='', chosen=(), intent='explain', list_files=None):
    """The repository, scope and files for a developer request, or the one question that decides them.

    `list_files(name)` returns that root's indexed relative paths (defaults to `repos.files(name)['files']`)."""
    list_files = list_files or (lambda name: repos.files(name, limit=20000)['files'])
    roots = repos.roots()
    grants = repos.grants()
    configured = repos.configured()
    text = (query or '') + '\n' + (answer or '')
    out = Resolution(repository='', scope='', files=[], missing=[], why='', roots=len(roots))
    if not roots:
        return out
    cache = {}

    def files_of(name):
        if name not in cache:
            try:
                cache[name] = list_files(name)
            except Exception:  # an unreadable root simply has no files to offer
                cache[name] = []
        return cache[name]

    def title(name):
        return grants[name]['title'] if name in grants else name

    # 1. A repository chosen on the canvas, or kept by the Work session this request continues (V35).
    for row in chosen or []:
        name = str(row.get('repository') or '')
        if name in roots:
            out.update(repository=name, why='chosen')
            break
        if name and not answer:
            # The project this session worked on was moved, deleted or its access removed: ask, never guess another.
            label = str(row.get('title') or name)[:80]
            return Resolution(out, question={'question': 'The project “' + label + '” is no longer connected to AEGIS (it was moved, deleted, or its access was removed). Reconnect it with Choose folder, then continue.',
                                             'options': ['I reconnected it, continue'] + [title(n) for n in list(grants)[:3]]}, reconnect=name)
    # 2. A path inside a grant (or a configured root): the launcher writes the granted path into the request.
    unreadable = []
    if not out['repository']:
        for raw in absolute_paths(query, answer):
            hits = [(name, root) for name, root in roots.items() if _inside(raw, root)]
            if not hits:
                unreadable.append(raw)
                continue
            # The deepest root containing the path is the most specific grant.
            name, root = max(hits, key=lambda kv: len(str(kv[1])))
            relative = Path(raw).resolve().relative_to(root).as_posix() if Path(raw).resolve() != root else ''
            out.update(repository=name, why='path')
            if relative and Path(raw).is_file():
                out['files'] = [relative]
            elif relative:
                out['scope'] = relative
            break
    if not out['repository'] and unreadable:
        shown = unreadable[0]
        return Resolution(out, question={
            'question': 'AEGIS has not been given access to ' + shown + '. Choose it with Choose folder (or Choose file), so the work can read it.',
            'options': ['I chose it, continue'] + [title(n) for n in list(grants)[:3]]}, unreadable=unreadable)
    # 3. A grant or repository named in words (its id or its folder name).
    lowered = text.lower()
    if not out['repository']:
        named = [n for n in roots if re.search(r'(?<![\w-])' + re.escape(n.lower()) + r'(?![\w-])', lowered)
                 or (n in grants and len(grants[n]['title']) > 2 and grants[n]['title'].lower() in lowered)]
        if len(named) == 1:
            out.update(repository=named[0], why='named')
        elif len(named) > 1:
            out.update(repository=max(named, key=lambda n: len(title(n))), why='named')
    names = named_files(query, answer)
    # 4. The roots that contain the files the request names.
    if not out['repository'] and names:
        holders = {}
        for name in list(grants) + [n for n in configured if n not in grants]:
            hits = [m for token in names for m in match_files(files_of(name), token)]
            if hits:
                holders[name] = hits
        if len(holders) == 1:
            out.update(repository=next(iter(holders)), why='file')
        elif len(holders) > 1:
            options = [title(n) + ': ' + holders[n][0] for n in list(holders)[:4]]
            return Resolution(out, question={'question': names[0] + ' is in more than one connected project. Which one?', 'options': options},
                              candidates=list(holders))
    # 5. The person's own grant; then a single configured root.
    if not out['repository']:
        own = list(grants)
        if len(own) == 1:
            out.update(repository=own[0], why='only_grant')
        elif len(own) > 1:
            return Resolution(out, question={'question': 'Which connected project should AEGIS read?', 'options': [title(n) for n in own[:4]]},
                              candidates=own)
        elif len(configured) == 1:
            out.update(repository=next(iter(configured)), why='only_configured')
        else:
            return Resolution(out, question={'question': 'Which project should AEGIS read?', 'options': list(configured)[:4]},
                              candidates=list(configured))
    name = out['repository']
    out['title'] = title(name)
    out['source'] = 'authorized' if name in grants else 'configured'
    # A grant of single files ("only") has those files and nothing else.
    available = files_of(name)
    out['indexed'] = len(available)
    for token in names:
        hits = match_files(available, token)
        if out['scope']:
            scoped = [h for h in hits if h.startswith(out['scope'] + '/')]
            hits = scoped or hits
        if len(hits) == 1:
            out['files'].append(hits[0])
        elif len(hits) > 1:
            # The same answer twice (the person picked one of these paths) settles it.
            picked = [h for h in hits if h.lower() in (answer or '').lower()]
            if len(picked) == 1:
                out['files'].append(picked[0])
                continue
            return Resolution(out, question={'question': 'Several files are called ' + posixpath.basename(token) + ' in ' + out['title'] + '. Which one?',
                                             'options': hits[:4]}, ambiguous={token: hits[:12]})
        else:
            out['missing'].append(token)
    out['files'] = list(dict.fromkeys(out['files']))[:12]
    if out['missing'] and not out['files'] and intent == 'explain':
        close = []
        for token in out['missing']:
            close += difflib.get_close_matches(posixpath.basename(token), [posixpath.basename(f) for f in available], n=3, cutoff=0.6)
        paths = [f for f in available if posixpath.basename(f) in close][:3]
        where = '“' + out['title'] + '”' + (' (' + str(len(available)) + ' readable files)' if available else ' (no readable files)')
        return Resolution(out, question={'question': 'I could not find ' + ', '.join(out['missing']) + ' in ' + where
                                         + '. Choose the folder that contains it, or pick one of these files.',
                                         'options': paths + ['I will choose another folder']}, not_found=True)
    return out


def describe(found):
    """One plain line for the stage trail: what will be read and why that project."""
    if not found.get('repository'):
        return ''
    why = {'chosen': 'chosen on the canvas', 'path': 'the folder you chose', 'named': 'named in the request',
           'file': 'it contains the file you named', 'only_grant': 'your connected folder',
           'only_configured': 'the configured repository'}.get(found.get('why'), '')
    head = found.get('title') or found['repository']
    return head + (' / ' + found['scope'] if found.get('scope') else '') + (' (' + why + ')' if why else '')
