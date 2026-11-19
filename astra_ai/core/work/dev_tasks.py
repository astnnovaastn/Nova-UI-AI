"""V33 developer workflow helpers for v29_tasks (Explain Code, Map a Project, Review a Change, Fix a Failing Test).

Kept apart from v29_tasks so that file only gains a few calls. Everything here reads; nothing runs project code.
"""
from __future__ import annotations

import re

from .repo_index import _git, git_changes

DIFF_CHARS = 14000


def change_request(query):
    """Which real change the request is about: a commit, a base...head range (a PR), staged, or the working tree."""
    text = query or ''
    # V35: a GitHub pull request of the connected repository ("PR #12", "pull request 12", a /pull/12 address).
    pr = re.search(r'\b(?:PR|pull request|pull)\s*#?\s*(\d{1,7})\b', text, re.I) or re.search(r'github\.com/[\w.-]+/[\w.-]+/pull/(\d{1,7})', text)
    if pr:
        return {'pr': int(pr.group(1))}
    commit = re.search(r'\bcommit\s+([0-9a-fA-F]{7,40})\b', text)
    if commit:
        return {'base': commit.group(1)}
    pair = re.search(r'\b([A-Za-z0-9][\w./-]{0,80})\.\.\.?([A-Za-z0-9][\w./-]{0,80})\b', text)
    if pair and not re.search(r'\.\w{1,5}$', pair.group(1)):
        return {'base': pair.group(1), 'head': pair.group(2)}
    branch = re.search(r'\bbranch\s+([A-Za-z0-9][\w./-]{0,80})\s+(?:against|onto|into|vs\.?|versus)\s+([A-Za-z0-9][\w./-]{0,80})', text, re.I)
    if branch:
        return {'base': branch.group(2), 'head': branch.group(1)}
    if re.search(r'\bstaged\b', text, re.I):
        return {'staged': True}
    return {}


def repository_change(root, query):
    """The real git change for a review or fix, bounded for the model. `available` False carries the reason."""
    asked = change_request(query)
    if 'pr' in asked:
        fetched = pull_request(root, asked['pr'])
        if not fetched.get('available'):
            return {'available': False, 'reason': fetched['reason'], 'pr': asked['pr']}
        asked = {'base': fetched['base'], 'head': fetched['head']}
    found = git_changes(root, **asked)
    if not found.get('available'):
        return {'available': False, 'reason': found.get('reason', 'git_unavailable'), **asked}
    diff = found['diff']
    return {'available': True, 'kind': found['kind'], 'branch': found['branch'], 'head': found['head'],
            'base': found.get('base', ''), 'target': found.get('target', ''), 'summary': found.get('summary', ''),
            'files': [{'path': f['path'], 'status': f['status'], 'added': f['added'], 'removed': f['removed']} for f in found['files']],
            'untracked': found['untracked'][:20], 'diff': diff[:DIFF_CHARS], 'diff_truncated': found['truncated'] or len(diff) > DIFF_CHARS,
            'hunks': {f['path']: f['hunks'] for f in found['files'][:6]}}


def pull_request(root, number):
    """Fetches pull request `number` from the repository's own `origin` with the person's existing Git credentials
    (never browser cookies) into FETCH_HEAD only: no branch is created and the working tree is untouched.
    Returns the merge base with origin's default branch and the fetched head commit."""
    import os
    remote, _ = _git(root, ['config', '--get', 'remote.origin.url'], timeout=8)  # as configured (before insteadOf rewrites)
    if not remote or 'github.com' not in remote:
        return {'available': False, 'reason': 'origin_is_not_a_github_repository'}
    os.environ.setdefault('GCM_INTERACTIVE', 'never')  # a missing credential fails instead of opening a sign-in window
    fetched, why = _git(root, ['fetch', '--no-tags', '--no-recurse-submodules', 'origin', 'pull/%d/head' % int(number)], timeout=90)
    if fetched is None:
        return {'available': False, 'reason': 'fetch_failed: ' + str(why)[:160]}
    head, _ = _git(root, ['rev-parse', 'FETCH_HEAD'], timeout=8)
    default, _ = _git(root, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], timeout=8)
    base_ref = (default or 'origin/main').strip()
    base, why = _git(root, ['merge-base', base_ref, (head or '').strip()], timeout=15)
    if not head or not base:
        return {'available': False, 'reason': 'no_merge_base: ' + str(why)[:120]}
    return {'available': True, 'base': base.strip()[:40], 'head': head.strip()[:40], 'base_ref': base_ref}


def change_diffs(change, hunks, build):
    """Zephium diff objects for the recorded change, as git reported it. `build` is zephium_objects.build."""
    out = []
    if not change or not change.get('available'):
        return out
    for row in change.get('files', [])[:3]:
        kept = [{'old_start': h['old_start'], 'new_start': h['new_start'], 'lines': h['lines'][:120]} for h in (hunks or {}).get(row['path'], []) if h['lines']][:6]
        if not kept:
            continue
        language = row['path'].rsplit('.', 1)[-1] if '.' in row['path'] else 'text'
        label = {'working_tree': 'Uncommitted change', 'staged': 'Staged change', 'commit': 'Commit ' + change.get('base', '')[:10],
                 'range': change.get('base', '') + '...' + change.get('target', '')}.get(change.get('kind'), 'Change')
        try:
            out.append(build('diff', {'path': row['path'], 'language': language, 'summary': label + ' (git, +' + str(row['added']) + ' −' + str(row['removed']) + ')', 'hunks': kept}))
        except ValueError:
            continue
    return out


def failing_test_names(query, files):
    """Test files and test names the request points at, only those that exist in the index."""
    names = set(re.findall(r'\btest_\w+', query or ''))
    paths = [f for f in files if re.search(r'(^|/)(test_[^/]+|[^/]+_test)\.py$|\.(test|spec)\.[jt]sx?$', f)]
    named = [f for f in paths if any(n in f for n in names) or f.rsplit('/', 1)[-1] in (query or '')]
    return named[:4] or paths[:2], sorted(names)[:6]
