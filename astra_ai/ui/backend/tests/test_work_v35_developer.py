"""V35 zero-API tests: pull requests through the repository's own remote, patch files, reconnecting a session's
project, follow-ups that keep their project, and the installed app's data locations."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from astra_ai.core.work import authorized_folders, dev_scope, dev_tasks
from astra_ai.core.work.repository_inputs import RepositoryInputs
from test_work_v29_router import free_web  # noqa: F401
from test_work_v34_developer import FIXTURE, dev_run, write_grants, zobjects

GIT = shutil.which('git')
needs_git = pytest.mark.skipif(not GIT, reason='git is not installed')


def git(root, *args, check=True):
    return subprocess.run([GIT, '-C', str(root), '-c', 'user.name=AEGIS Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', *args],
                          capture_output=True, text=True, check=check).stdout


@pytest.fixture
def github_like(tmp_path):
    """A clone whose `origin` is https://github.com/aegis-test/app, redirected to a local bare repo holding pull/7/head."""
    bare = tmp_path / 'origin.git'
    seed = tmp_path / 'seed'
    shutil.copytree(FIXTURE, seed)
    git(tmp_path, 'init', '-q', '--bare', str(bare))
    git(seed, 'init', '-q', '-b', 'main'); git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'base')
    git(seed, 'remote', 'add', 'origin', str(bare)); git(seed, 'push', '-q', 'origin', 'main')
    core = seed / 'calc' / 'core.py'
    core.write_text(core.read_text().replace('return a * b', 'return a // b'))
    git(seed, 'commit', '-q', '-am', 'PR change'); git(seed, 'push', '-q', 'origin', 'HEAD:refs/pull/7/head')
    clone = tmp_path / 'clone'
    git(tmp_path, 'clone', '-q', str(bare), str(clone))
    git(clone, 'remote', 'set-url', 'origin', 'https://github.com/aegis-test/app.git')
    git(clone, 'config', 'url.' + bare.as_posix() + '.insteadOf', 'https://github.com/aegis-test/app.git')
    git(clone, 'fetch', '-q', 'origin')  # origin/HEAD and origin/main exist, as in a real clone
    git(clone, 'remote', 'set-head', 'origin', 'main')
    return clone


def test_pull_request_numbers_are_recognised():
    assert dev_tasks.change_request('Review PR #12') == {'pr': 12}
    assert dev_tasks.change_request('review pull request 9 please') == {'pr': 9}
    assert dev_tasks.change_request('https://github.com/o/r/pull/31') == {'pr': 31}
    assert dev_tasks.change_request('Review the uncommitted changes') == {}


@needs_git
def test_a_pull_request_is_fetched_from_origin_and_diffed_against_its_base(github_like):
    before = git(github_like, 'branch', '--list')
    change = dev_tasks.repository_change(github_like, 'Review PR #7')
    assert change['available'] and change['kind'] == 'range', change
    assert [f['path'] for f in change['files']] == ['calc/core.py']
    assert '+    return a // b' in change['diff'] and '-    return a * b' in change['diff']
    assert git(github_like, 'branch', '--list') == before, 'no branch is created'
    assert not git(github_like, 'status', '--porcelain'), 'the working tree is untouched'


@needs_git
def test_a_pull_request_outside_github_is_reported(tmp_path):
    shutil.copytree(FIXTURE, tmp_path / 'r')
    git(tmp_path / 'r', 'init', '-q'); git(tmp_path / 'r', 'add', '-A'); git(tmp_path / 'r', 'commit', '-q', '-m', 'x')
    change = dev_tasks.repository_change(tmp_path / 'r', 'Review PR #3')
    assert not change['available'] and change['reason'] == 'origin_is_not_a_github_repository'


def test_a_sessions_removed_project_asks_to_reconnect(tmp_path):
    root = tmp_path / 'other'
    shutil.copytree(FIXTURE, root)
    repos = RepositoryInputs(lambda n: '', grants_file=write_grants(tmp_path, {'id': 'other', 'path': str(root), 'title': 'other'}))
    found = dev_scope.resolve(repos, 'Explain calc/core.py', chosen=[{'kind': 'folder', 'title': 'my project', 'repository': 'gone-1234'}])
    assert found.question and 'my project' in found.question['question'] and 'no longer connected' in found.question['question']
    assert found['repository'] == '', 'another project is never read in its place'


def test_a_reconnected_project_is_used_again(tmp_path):
    root = tmp_path / 'proj'
    shutil.copytree(FIXTURE, root)
    repos = RepositoryInputs(lambda n: '', grants_file=write_grants(tmp_path, {'id': 'proj-1', 'path': str(root), 'title': 'proj'}))
    found = dev_scope.resolve(repos, 'Explain calc/core.py', chosen=[{'kind': 'folder', 'title': 'proj', 'repository': 'proj-1'}])
    assert found['repository'] == 'proj-1' and found['why'] == 'chosen' and found['files'] == ['calc/core.py']


def test_a_patch_file_is_reviewed_as_the_change(tmp_path, free_web):
    root = tmp_path / 'proj'
    shutil.copytree(FIXTURE, root)
    (root / 'fix.patch').write_text('--- a/calc/core.py\n+++ b/calc/core.py\n@@ -9,1 +9,1 @@\n-    return a * b\n+    return a / b\n', encoding='utf-8')
    answer = lambda payload: {'reply': {'headline': 'One change', 'text': 'Division fixed.', 'points': []},
                              'objects': [{'kind': 'list', 'title': 'Findings', 'part': '', 'data_json': json.dumps({'style': 'todo', 'items': [{'title': 'Looks right'}]})}]}
    result, record, adapter, _ = dev_run(tmp_path, 'review-a-change', 'Review the change in fix.patch', answer, [{'id': 'proj', 'path': str(root), 'title': 'proj'}])
    assert result['status'] == 'completed', record.failure
    diff = next(o for o in zobjects(record) if o['zkind'] == 'diff' and o['data']['path'] == 'calc/core.py')
    assert {'op': 'add', 'text': '    return a / b'} in diff['data']['hunks'][0]['lines']


def test_a_follow_up_in_a_developer_session_keeps_its_project(tmp_path, free_web):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    import astra_ai.ui.backend.api.work as work_api
    root = tmp_path / 'proj'
    shutil.copytree(FIXTURE, root)
    answer = lambda payload: {'reply': {'headline': 'x', 'text': 'y', 'points': []}, 'objects': []}
    _, first, _, service = dev_run(tmp_path, 'explain-code', 'Explain calc/core.py', answer, [{'id': 'proj-1', 'path': str(root), 'title': 'proj'}])
    assert first.results['v29']['scope']['repository'] == 'proj-1'
    # The API's inheritance step: a request continuing that session gets its project as a chosen connection.
    source = Path(work_api.__file__).read_text(encoding='utf-8')
    assert "scope.get('repository')" in source and "'repository': scope['repository']" in source
    previous = service.store.get(first.research_id)
    scope = previous.results['v29']['scope']
    assert scope['repository'] == 'proj-1' and scope['title'] == 'proj'


def test_installed_data_locations_follow_the_environment(tmp_path, monkeypatch):
    monkeypatch.delenv('AEGIS_WORK_AUTHORIZED_FOLDERS_FILE', raising=False)
    monkeypatch.setenv('NOVA_STATE_DIR', str(tmp_path / 'state'))
    assert authorized_folders.grants_file() == tmp_path / 'state' / 'work' / 'authorized_folders.json'
    source = (Path(__file__).parents[1] / 'server.py').read_text(encoding='utf-8')
    assert "os.environ['AEGIS_ENV_FILE']" in source, 'an installed backend reads its .env from the data folder'
    assert "int(os.getenv('AEGIS_BACKEND_PORT', '8340'))" in source
