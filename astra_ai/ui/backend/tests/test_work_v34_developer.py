"""V34 developer workspace: the granted project is the one read, files are found (or reported missing), code
annotations point at real lines, and Fix a Failing Test reproduces, drafts, re-runs and waits for approval.

No model API is called (scripted lead). Tests marked `docker` run real containers with the local
aegis-work-sandbox:1 image and are skipped when it is not available.
"""
import asyncio
import json
import shutil
from pathlib import Path

import pytest

from astra_ai.core.work import authorized_folders, dev_drafts, dev_scope
from astra_ai.core.work.repository_inputs import RepositoryInputs
from astra_ai.core.work.v29_tasks import COMPOSE_SCHEMA, ground_code, _focus_windows
from test_work_v29_router import WorkAdapter, free_web  # noqa: F401
from test_work_runs import CONTEXT, FakeSearch, build, start

FIXTURE = Path(__file__).parent / 'fixtures' / 'v33_repo'
SETTINGS = lambda name: ''
DOCKER = dev_drafts.sandbox_image(SETTINGS).get('available')
docker = pytest.mark.skipif(not DOCKER, reason='Docker or the aegis-work-sandbox:1 image is not available')


@pytest.fixture
def project(tmp_path):
    root = tmp_path / 'my project'
    shutil.copytree(FIXTURE, root)
    # A long file: the function under question sits far past line 200.
    lines = ['"""Model memory."""', 'import json', '']
    lines += [f'# filler line {i}' for i in range(4, 450)]
    lines += ['class Memory:', '    """Keeps the last N turns."""', '    def __init__(self, size=8):', '        self.size = size',
              '        self.turns = []', '', '    def remember(self, turn):', '        self.turns.append(turn)',
              '        self.turns = self.turns[-self.size:]', '        return len(self.turns)']
    lines += [f'# tail {i}' for i in range(460, 620)]
    (root / 'backend').mkdir()
    (root / 'backend' / 'ai_model.py').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return root


@pytest.fixture
def decoy(tmp_path):
    """A host-configured repository (like AEGIS_WORK_REPOSITORIES' "aegis") that must not be read by default."""
    root = tmp_path / 'decoy'
    (root / 'src').mkdir(parents=True)
    (root / 'src' / 'server.py').write_text('def serve():\n    return "decoy"\n', encoding='utf-8')
    return root


def write_grants(tmp_path, *rows):
    path = tmp_path / 'grants.json'
    path.write_text(json.dumps({'version': 1, 'folders': [{'via': 'desktop_dialog', 'write': False, **row} for row in rows]}))
    return path


def repos_for(tmp_path, grants_rows, configured=None):
    path = write_grants(tmp_path, *grants_rows)
    config = json.dumps({k: str(v).replace('\\', '/') for k, v in (configured or {}).items()})
    return RepositoryInputs(lambda name: config if name == 'AEGIS_WORK_REPOSITORIES' else '', grants_file=path), path, config


# ---------------------------------------------------------------- which project (the V33 dead end)

def test_a_granted_folder_beats_the_first_configured_repository(tmp_path, project, decoy):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}], {'aegis': decoy})
    found = dev_scope.resolve(repos, 'Explain how this code works')
    assert found['repository'] == 'mine' and found['why'] == 'only_grant'


def test_the_launcher_path_selects_the_grant_and_narrows_the_scope(tmp_path, project, decoy):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}], {'aegis': decoy})
    found = dev_scope.resolve(repos, 'Map the architecture of ' + str(project / 'calc'))
    assert (found['repository'], found['scope'], found['why']) == ('mine', 'calc', 'path')
    one = dev_scope.resolve(repos, 'Explain how this code works: ' + str(project / 'calc' / 'core.py'))
    assert one['files'] == ['calc/core.py']


def test_a_path_outside_every_grant_is_asked_about_not_read(tmp_path, project, decoy):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    found = dev_scope.resolve(repos, 'Explain ' + str(decoy / 'src' / 'server.py'))
    assert found.question and 'has not been given access' in found.question['question'] and not found['repository']


def test_a_named_file_is_found_inside_the_authorized_scope(tmp_path, project, decoy):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}], {'aegis': decoy})
    found = dev_scope.resolve(repos, 'Explain how ai_model.py manages memory')
    assert found['repository'] == 'mine' and found['files'] == ['backend/ai_model.py']


def test_several_matching_files_are_asked_about(tmp_path, project):
    (project / 'web' / 'core.py').write_text('x = 1\n')
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    found = dev_scope.resolve(repos, 'Explain core.py')
    assert found.question and set(found.question['options']) == {'calc/core.py', 'web/core.py'}
    settled = dev_scope.resolve(repos, 'Explain core.py', answer='web/core.py')
    assert settled['files'] == ['web/core.py'] and not settled.question


def test_a_missing_file_is_reported_not_invented(tmp_path, project):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    found = dev_scope.resolve(repos, 'Explain how memory_store.py works')
    assert found.question and 'could not find memory_store.py' in found.question['question'] and found['missing'] == ['memory_store.py']


def test_two_grants_and_nothing_named_asks_which(tmp_path, project, decoy):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}, {'id': 'other', 'path': str(decoy), 'title': 'decoy'}])
    found = dev_scope.resolve(repos, 'Map this project')
    assert found.question and found.question['options'] == ['my project', 'decoy']
    assert dev_scope.resolve(repos, 'Map this project', answer='decoy')['repository'] == 'other'


def test_a_revoked_grant_is_no_longer_read(tmp_path, project, decoy):
    repos, path, _ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}], {'aegis': decoy})
    assert authorized_folders.revoke(path, 'mine')
    found = dev_scope.resolve(repos, 'Explain how ai_model.py manages memory')
    assert found['repository'] != 'mine'


def test_a_chosen_connection_passes_the_request_sanitiser():
    from astra_ai.ui.backend.api.work import _chosen
    rows = _chosen([{'kind': 'folder', 'title': 'my project', 'repository': 'mine'}, {'kind': 'folder', 'repository': '../etc'}])
    assert rows[0]['repository'] == 'mine' and 'repository' not in rows[1]


# ---------------------------------------------------------------- grounded code and windowed reading

def test_code_annotations_are_grounded_in_the_read_lines():
    refs = [{'id': 'R1', 'kind': 'file', 'path': 'calc/core.py', 'total': 12, 'sha256': 'x',
             'text': '\n'.join(f'{n}: line {n}' for n in range(1, 13))}]
    data = ground_code({'ref': 'R1', 'text': 'invented code', 'notes': [{'from': 3, 'to': 5, 'text': 'real'}, {'from': 40, 'to': 44, 'text': 'outside'}]}, refs)
    assert data['text'].splitlines()[0] == 'line 1' and 'invented' not in data['text']
    assert data['path'] == 'calc/core.py' and data['start'] == 1 and data['grounded'] is True
    assert [(n['from'], n['to'], n['text']) for n in data['notes']] == [(3, 5, 'real')]


def test_model_text_that_matches_no_file_is_marked_ungrounded():
    refs = [{'id': 'R1', 'kind': 'file', 'path': 'a.py', 'text': '1: def a():\n2:     return 1'}]
    assert ground_code({'text': 'def b():\n    return 2', 'notes': []}, refs)['grounded'] is False
    matched = ground_code({'text': 'def a():\n    return 1', 'notes': []}, refs)
    assert matched['grounded'] is True and matched['ref'] == 'R1'


def test_long_files_keep_relevant_windows_with_true_line_numbers():
    windows = ['\n'.join(f'{n}: filler' for n in range(s, s + 200)) for s in (1, 201, 401)]
    windows[2] = windows[2].replace('450: filler', '450: class Memory:')
    text = _focus_windows(windows, ['memory'], 4800)
    assert '450: class Memory:' in text and '⋯' in text and text.startswith('1: filler')


# ---------------------------------------------------------------- whole runs (scripted lead, real files)

class DevAdapter(WorkAdapter):
    def __init__(self, workflow, answer_for):
        super().__init__(workflow)
        self.answer_for = answer_for

    def answer(self, schema, payload):
        if schema is COMPOSE_SCHEMA:
            self.compose_payloads.append(payload)
            return self.answer_for(payload)
        return super().answer(schema, payload)


def dev_run(tmp_path, workflow, query, answer_for, grants_rows, configured=None, answer=None):
    path = write_grants(tmp_path, *grants_rows)
    config = json.dumps({k: str(v).replace('\\', '/') for k, v in (configured or {}).items()})
    adapter = DevAdapter(workflow, answer_for)
    from test_work_v29_router import NoPaidSearch
    service, artifacts, _ = build(tmp_path / 'svc', adapter, NoPaidSearch(), env={
        'AEGIS_WORK_ROUTER': '1', 'AEGIS_WORK_AUTHORIZED_FOLDERS_FILE': str(path), 'AEGIS_WORK_REPOSITORIES': config})
    identifier = start(service, artifacts, query, workflow=workflow)
    result = asyncio.run(service.run(identifier, CONTEXT))
    return result, service.store.get(identifier), adapter, service


def zobjects(record):
    return [o for o in record.canvas_objects if o.get('kind') == 'zephium']


def explain_answer(payload):
    ref = next(r for r in payload['material']['references'] if r.get('path') == 'backend/ai_model.py')
    return {'reply': {'headline': 'Memory keeps the last turns', 'text': 'Memory.remember trims to size.', 'points': []},
            'objects': [{'kind': 'code', 'title': 'Memory', 'part': '', 'data_json': json.dumps({'ref': ref['id'], 'language': 'python', 'notes': [
                            {'from': 450, 'to': 451, 'text': 'Declares the memory class.'}, {'from': 456, 'to': 459, 'text': 'Appends and trims to size.'},
                            {'from': 900, 'to': 901, 'text': 'Past the end of the file.'}]})},
                        {'kind': 'document', 'title': 'How memory works', 'part': '', 'data_json': json.dumps({'paragraphs': ['remember() appends a turn.']})}]}


def test_explain_code_reads_the_granted_file_and_annotates_real_lines(tmp_path, project, decoy, free_web):
    result, record, adapter, _ = dev_run(tmp_path, 'explain-code', 'Explain how ai_model.py manages memory', explain_answer,
                                         [{'id': 'mine', 'path': str(project), 'title': 'my project'}], {'aegis': decoy})
    assert result['status'] == 'completed', record.failure
    v29 = record.results['v29']
    assert v29['scope']['repository'] == 'mine' and v29['repo']['name'] == 'mine', 'the granted folder is read, not the configured decoy'
    sent = adapter.compose_payloads[0]['material']
    focus = next(r for r in sent['references'] if r.get('path') == 'backend/ai_model.py')
    assert '450: class Memory:' in focus['text'], 'a line far past 200 reaches the model with its real number'
    assert not any('decoy' in json.dumps(r) for r in sent['references'])
    code = next(o for o in zobjects(record) if o['zkind'] == 'code')
    lines = (project / 'backend' / 'ai_model.py').read_text().splitlines()
    start = code['data']['start']
    shown = code['data']['text'].splitlines()
    assert shown == lines[start - 1:start - 1 + len(shown)], 'the code card shows the file exactly'
    assert code['data']['path'] == 'backend/ai_model.py' and code['data']['grounded']
    assert [(n['from'] + start - 1, n['to'] + start - 1) for n in code['data']['notes']] == [(450, 451), (456, 459)], 'notes land on the real lines'
    assert lines[449] == 'class Memory:'
    assert free_web['search'] == [] and free_web['read'] == [], 'a named file is never searched for on the web'
    assert {o['zkind'] for o in zobjects(record)} >= {'code', 'document', 'reply'}


def test_explain_code_with_no_code_object_still_shows_the_real_file(tmp_path, project, free_web):
    answer = lambda payload: {'reply': {'headline': 'x', 'text': 'y', 'points': []}, 'objects': []}
    result, record, *_ = dev_run(tmp_path, 'explain-code', 'Explain calc/core.py', answer, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    code = next(o for o in zobjects(record) if o['zkind'] == 'code')
    assert code['data']['path'] == 'calc/core.py' and 'def divide(a, b):' in code['data']['text']


def test_a_missing_file_stops_before_any_model_call(tmp_path, project, free_web):
    result, record, adapter, _ = dev_run(tmp_path, 'explain-code', 'Explain how memory_store.py works', explain_answer,
                                         [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    assert result.get('needs_input') and 'could not find memory_store.py' in result['question']
    assert adapter.compose_payloads == [] and record.usage.get('calls', 0) == 0


def test_public_run_reports_what_was_read(tmp_path, project, free_web):
    result, record, _, service = dev_run(tmp_path, 'explain-code', 'Explain how ai_model.py manages memory', explain_answer,
                                         [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    public = service.store.public(record)['developer']
    assert public['scope']['title'] == 'my project' and public['read'][0]['path'] == 'backend/ai_model.py'
    assert str(project) not in json.dumps(public), 'no host paths reach the page'


def test_map_a_large_nested_project_stays_bounded(tmp_path, free_web):
    root = tmp_path / 'big'
    for a in range(6):
        for b in range(10):
            folder = root / f'pkg{a}' / f'mod{b}'
            folder.mkdir(parents=True)
            for c in range(25):
                (folder / f'f{c}.py').write_text(f'from pkg{(a + 1) % 6}.mod{b} import f{c}\n' if c == 0 else 'x = 1\n')
    answer = lambda payload: {'reply': {'headline': 'Big', 'text': 'Six packages.', 'points': []}, 'objects': []}
    result, record, adapter, _ = dev_run(tmp_path, 'map-a-project', 'Map this project', answer, [{'id': 'big', 'path': str(root), 'title': 'big'}])
    assert result['status'] == 'completed', record.failure
    repo = record.results['v29']['repo']
    assert repo['name'] == 'big' and repo['files'] <= 1000 and repo['scanned'] <= 90
    assert len(json.dumps(adapter.compose_payloads[0]['material'])) < 60000, 'the repository is never sent whole'
    diagram = next(o for o in zobjects(record) if o['zkind'] == 'diagram')
    assert {n['id'].split('/')[0] for n in diagram['data']['nodes']} <= {f'pkg{a}' for a in range(6)}


def fix_answer(payload):
    assert payload['material']['baseline_test_run']['exit_code'] not in (0, None), 'the model sees the real failure'
    return {'reply': {'headline': 'divide multiplied', 'text': 'divide used * instead of /.', 'points': []},
            'objects': [{'kind': 'list', 'title': 'Diagnosis', 'part': '', 'data_json': json.dumps({'style': 'todo', 'items': [{'title': 'divide() multiplies'}]})}],
            'proposal': {'files': ['calc/core.py'], 'argv': ['rm', '-rf', '/'],
                         'edits': [{'path': 'calc/core.py', 'find': '    return a * b', 'replace': '    return a / b'}]}}


@docker
def test_fix_a_failing_test_reproduces_drafts_reruns_and_waits_for_approval(tmp_path, project, free_web):
    original = (project / 'calc' / 'core.py').read_bytes()
    result, record, adapter, _ = dev_run(tmp_path, 'fix-a-bug', 'tests/test_core.py::test_divide fails: AssertionError assert 18 == 2', fix_answer,
                                         [{'id': 'mine', 'path': str(project), 'title': 'my project', 'write': True}])
    assert result['status'] == 'completed', record.failure
    v29 = record.results['v29']
    assert v29['baseline']['exit_code'] == 1 and 'tests/test_core.py::test_divide' in v29['baseline']['failing']
    draft = v29['draft']
    assert draft['argv'][:3] == ['python', '-m', 'pytest'], 'the model-proposed command is never run'
    assert draft['runs']['before']['exit_code'] == 1 and draft['runs']['after']['exit_code'] == 0
    assert draft['runs']['after']['environment']['network'] == 'none'
    assert (project / 'calc' / 'core.py').read_bytes() == original, 'nothing changes before approval'
    kinds = [o['zkind'] for o in zobjects(record)]
    assert kinds.count('diff') >= 1 and any(o['data'].get('terminal') for o in zobjects(record) if o['zkind'] == 'code')
    assert 'patched draft passes' in v29['reply']['text']
    work = dev_drafts.DraftWorkspace(tmp_path / 'svc', lambda name: str(tmp_path / 'grants.json') if name == 'AEGIS_WORK_AUTHORIZED_FOLDERS_FILE' else '')
    with pytest.raises(ValueError):
        work.apply('owner', draft['id'], 'not-the-token')
    applied = work.apply('owner', draft['id'], draft['approval'])
    assert applied['status'] == 'applied' and b'return a / b' in (project / 'calc' / 'core.py').read_bytes()
    work.rollback('owner', draft['id'])
    assert (project / 'calc' / 'core.py').read_bytes() == original


@docker
def test_a_draft_detects_a_conflict_and_needs_a_write_grant(tmp_path, project):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    work = dev_drafts.DraftWorkspace(tmp_path / 'state', SETTINGS, repos)
    draft = work.create('owner', 'mine', [{'path': 'calc/core.py', 'find': 'return a * b', 'replace': 'return a / b'}], ['python', '-m', 'pytest', '-q'])
    with pytest.raises(Exception, match='saving_not_authorized'):
        work.apply('owner', draft['id'], draft['approval'])
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project', 'write': True}])
    work = dev_drafts.DraftWorkspace(tmp_path / 'state', SETTINGS, repos)
    (project / 'calc' / 'core.py').write_text((project / 'calc' / 'core.py').read_text() + '\n# edited meanwhile\n')
    with pytest.raises(ValueError, match='conflict'):
        work.apply('owner', draft['id'], draft['approval'])
    assert work.discard('owner', draft['id'])['status'] == 'discarded'


def test_drafts_create_new_files_and_report_edits_that_do_not_match(tmp_path, project):
    repos, *_ = repos_for(tmp_path, [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    work = dev_drafts.DraftWorkspace(tmp_path / 'state', SETTINGS, repos)
    draft = work.create('owner', 'mine', [{'path': 'calc/extra.py', 'create': 'X = 1\n'}, {'path': 'calc/core.py', 'find': 'not in the file', 'replace': 'y'}], [])
    assert [(f['path'], f['change']) for f in draft['files']] == [('calc/extra.py', 'created')]
    assert any('not found' in w for w in draft['warnings']) and not (project / 'calc' / 'extra.py').exists()


def test_without_a_sandbox_nothing_is_claimed(tmp_path, project, free_web, monkeypatch):
    monkeypatch.setattr(dev_drafts, 'sandbox_image', lambda settings: {'available': False, 'reason': 'Docker is not running. Nothing was executed.'})
    answer = lambda payload: {
        'reply': {'headline': 'divide multiplied', 'text': 'Use /.', 'points': []}, 'objects': [],
        'proposal': {'files': ['calc/core.py'], 'argv': [], 'edits': [{'path': 'calc/core.py', 'find': '    return a * b', 'replace': '    return a / b'}]}}
    result, record, *_ = dev_run(tmp_path, 'fix-a-bug', 'tests/test_core.py::test_divide fails: AssertionError', answer,
                                 [{'id': 'mine', 'path': str(project), 'title': 'my project'}])
    v29 = record.results['v29']
    assert v29['draft']['runs'] == {} and 'was not run' in v29['reply']['text']
    assert 'passed' not in record.results['report_text'].lower()


def test_test_command_comes_from_existing_test_files():
    assert dev_drafts.test_command(['a.py', 'tests/test_a.py'], ['tests/test_a.py'])[:3] == ['python', '-m', 'pytest']
    assert dev_drafts.test_command(['x.test.mjs'])[0] == 'node'
    assert dev_drafts.test_command(['a.py']) is None
