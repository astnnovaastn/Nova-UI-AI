"""V29 zero-API tests for the capability router (AEGIS_WORK_ROUTER=1).

No model, search or network API is called. The paid search raises if touched, the free web tools
and Google are replaced by recorded fixtures, and a fake lead answers the plan and compose schemas.
These prove the execution path and its guarantees (no paid search for Work, typed objects, honest
links); they do not prove what a real model would compose. Live behaviour is tested separately.
"""
import asyncio
import json
import sys
import types

import pytest

from astra_ai.core.work import router as v29router, task_graph, zephium_objects as zo
from astra_ai.core.work.v29_tasks import COMPOSE_SCHEMA

from test_work_runs import CONTEXT, FakeAdapter, FakeSearch, build, start


class PaidSearchTouched(AssertionError):
    pass


class NoPaidSearch(FakeSearch):
    def _request(self, query, mode, count, depth='advanced'):
        raise PaidSearchTouched(query)


IMAGES = [
    {'title': 'Concrete type specimen', 'image': 'https://images.are.na/a1.jpg', 'page': 'https://www.are.na/block/1', 'maker': 'Ana', 'source': 'are.na'},
    {'title': 'Warm brutalist spread', 'image': 'https://images.are.na/a2.jpg', 'page': 'https://www.are.na/block/2', 'maker': 'Ben', 'source': 'are.na'},
    {'title': 'Terracotta grid poster', 'image': 'https://upload.wikimedia.org/c3.jpg', 'page': 'https://commons.wikimedia.org/wiki/File:c3.jpg', 'source': 'commons'},
    {'title': 'Serif on raw paper', 'image': 'https://cdn.openverse.org/o4.jpg', 'page': 'https://openverse.org/image/4', 'source': 'openverse'},
]
HITS = [{'title': 'Brutalist architecture', 'url': 'https://en.wikipedia.org/wiki/Brutalist_architecture', 'snippet': 'Brutalism is a style ' * 20, 'source': 'wikipedia'}]


@pytest.fixture(autouse=True)
def free_web(monkeypatch):
    """Recorded free web tools: no network."""
    calls = {'images': [], 'search': [], 'read': []}
    free = types.ModuleType('astra_ai.core.work.free_search')
    def images(query, limit=18):
        calls['images'].append(query)
        # The first search finds the four boards' pictures; later searches find three more each.
        n = len(calls['images'])
        extra = [{'title': 'Texture ' + str(n) + '-' + str(i), 'image': 'https://upload.wikimedia.org/t' + str(n) + '-' + str(i) + '.jpg',
                  'page': 'https://commons.wikimedia.org/wiki/File:t' + str(n) + str(i), 'source': 'commons'} for i in range(3)]
        return [dict(r) for r in IMAGES] + (extra if n == 2 else [])
    free.images = images
    free.search = lambda query, kinds=('web',), limit=8, browser=None: calls['search'].append(query) or [dict(r) for r in HITS]
    free.plan_sources = lambda intent, query: ('wikipedia',)
    free.try_site_images = lambda site, query, browser: {'blocked': True, 'reason': 'robots_disallowed'}

    class Browser:
        log = []

        def read(self, url):
            calls['read'].append(url)
            return {'status': 'ok', 'text': 'Page text about ' + url + ' ' + 'word ' * 400, 'images': []}

        def close(self):
            pass

    browser = types.ModuleType('astra_ai.core.work.agent_browser')
    browser.AgentBrowser = Browser
    monkeypatch.setitem(sys.modules, 'astra_ai.core.work.free_search', free)
    monkeypatch.setitem(sys.modules, 'astra_ai.core.work.agent_browser', browser)
    import astra_ai.core.work as package
    monkeypatch.setattr(package, 'free_search', free, raising=False)
    monkeypatch.setattr(package, 'agent_browser', browser, raising=False)
    return calls


def compose_answer(workflow, payload):
    refs = {r['id']: r for r in payload['material']['references']}
    images = [i for i in refs if i.startswith('I')]
    if workflow == 'moodboard':
        return {'reply': {'headline': 'Warm brutalist editorial', 'text': 'Raw concrete warmed by terracotta and serif type.',
                          'points': ['Palette: concrete grey, terracotta', 'Type: high-contrast serif', 'Texture: raw paper', 'Composition: heavy grid', 'Avoid: glossy gradients']},
                'objects': [
                    {'kind': 'picks', 'title': 'Concrete and type', 'part': 'worker_a', 'data_json': json.dumps({'facet': 'other', 'items': [
                        {'ref': images[0], 'name': 'Concrete type specimen', 'tags': ['concrete', 'serif'], 'why': 'Anchors the type.', 'recommended': True},
                        {'ref': images[1], 'name': 'Warm spread', 'tags': ['warm'], 'why': 'Warm palette.', 'url': 'https://evil.example/should-not-pass'}]})},
                    {'kind': 'picks', 'title': 'Grid and paper', 'part': 'worker_a', 'data_json': json.dumps({'facet': 'other', 'items': [
                        {'ref': images[2], 'name': 'Terracotta grid'}, {'ref': images[3], 'name': 'Serif on paper'}]})},
                    {'kind': 'document', 'title': 'Not requested', 'part': '', 'data_json': json.dumps({'paragraphs': ['x']})}]}
    if workflow == 'map-a-project':
        return {'reply': {'headline': 'Sample app map', 'text': 'An API package over a store.', 'points': []},
                'objects': [{'kind': 'document', 'title': 'Reading order', 'part': '', 'data_json': json.dumps({'paragraphs': ['## Start', 'Read app/api/server.py first.']})}]}
    if workflow == 'plan-my-day':
        event = next((i for i in refs if i.startswith('E')), None)
        return {'reply': {'headline': 'Your day', 'text': 'Standup, then focus time.', 'points': []},
                'objects': [{'kind': 'plan', 'title': 'Today', 'part': '', 'data_json': json.dumps({'calendar': True, 'checkable': True, 'steps': [
                                {'when': '09:30', 'date': '2026-11-18', 'title': refs[event]['title'] if event else 'Report', 'kind': 'event'}, {'when': '10:00', 'date': '2026-11-18', 'title': 'Focus block', 'kind': 'task'}]})},
                            {'kind': 'list', 'title': 'Priorities', 'part': '', 'data_json': json.dumps({'style': 'todo', 'items': [{'title': 'Reply to Ana', 'priority': 'high'}]})}]}
    if workflow == 'review-a-change':
        return {'reply': {'headline': 'One issue', 'text': 'Rounding changed.', 'points': []},
                'objects': [{'kind': 'list', 'title': 'Findings', 'part': '', 'data_json': json.dumps({'style': 'requirements', 'items': [{'title': 'round() was dropped', 'priority': 'high'}]})},
                            {'kind': 'diff', 'title': 'Fix', 'part': '', 'data_json': json.dumps({'path': 'calc.py', 'language': 'python', 'summary': 'Restore rounding',
                                                                                                    'hunks': [{'old_start': 1, 'new_start': 1, 'lines': [{'op': 'del', 'text': 'return x'}, {'op': 'add', 'text': 'return round(x)'}]}]})},
                            {'kind': 'draft', 'title': 'Review comment', 'part': '', 'data_json': json.dumps({'destination': 'github', 'body': 'Please keep round().'})}]}
    if workflow == 'campaign-plan':
        return {'reply': {'headline': 'Four-week launch', 'text': 'Tease, launch, sustain.', 'points': []},
                'objects': [{'kind': 'plan', 'title': 'Weeks', 'part': '', 'data_json': json.dumps({'steps': [{'when': 'Week 1', 'title': 'Teaser', 'kind': 'milestone'}, {'when': 'Week 2', 'title': 'Launch', 'kind': 'milestone'}]})},
                            {'kind': 'draft', 'title': 'Launch post', 'part': '', 'data_json': json.dumps({'destination': 'linkedin', 'body': 'We are live.'})},
                            {'kind': 'list', 'title': 'Tasks', 'part': '', 'data_json': json.dumps({'style': 'todo', 'items': [{'title': 'Book ads'}]})}]}
    return {'reply': {'headline': 'Done', 'text': 'Here it is.', 'points': []}, 'objects': []}


class WorkAdapter(FakeAdapter):
    def __init__(self, workflow, **kwargs):
        super().__init__(**kwargs)
        self.workflow = workflow
        self.compose_payloads = []

    def answer(self, schema, payload):
        if schema is COMPOSE_SCHEMA:
            self.compose_payloads.append(payload)
            return compose_answer(self.workflow, payload)
        return super().answer(schema, payload)


def sample_repo(tmp_path):
    root = tmp_path / 'sample-repo'
    (root / 'app' / 'api').mkdir(parents=True)
    (root / 'app' / 'store').mkdir(parents=True)
    (root / 'app' / 'ui').mkdir(parents=True)
    (root / 'app' / '__init__.py').write_text('')
    (root / 'app' / 'api' / '__init__.py').write_text('')
    (root / 'app' / 'store' / '__init__.py').write_text('')
    (root / 'app' / 'api' / 'server.py').write_text('from app.store.db import save\nfrom ..store import db\n\ndef handle():\n    return save()\n')
    (root / 'app' / 'store' / 'db.py').write_text('def save():\n    return 1\n')
    (root / 'app' / 'ui' / 'main.ts').write_text("import { call } from './client';\ncall();\n")
    (root / 'app' / 'ui' / 'client.ts').write_text('export function call() { return fetch("/api"); }\n')
    (root / 'requirements.txt').write_text('fastapi==0.110\nrequests>=2\n')
    return root


def run(tmp_path, workflow, query, env=None, router='1', chosen=None):
    adapter = WorkAdapter(workflow)
    search = NoPaidSearch() if router == '1' and workflow not in ('deep-research', 'quick-research') else FakeSearch()
    service, artifacts, _ = build(tmp_path, adapter, search, env={'AEGIS_WORK_ROUTER': router, **(env or {})})
    identifier = start(service, artifacts, query, workflow=workflow)
    if chosen:
        record = service.store.get(identifier)
        record.request['chosen'] = chosen
        service.store.save(record)
    result = asyncio.run(service.run(identifier, CONTEXT))
    return result, service.store.get(identifier), adapter, search, service, artifacts


def zobjects(record):
    return [o for o in record.canvas_objects if o.get('kind') == 'zephium']


# Routing rules

def test_every_workflow_has_a_spec_and_only_research_may_pay():
    from astra_ai.core.work.catalog import WORKFLOWS
    assert set(WORKFLOWS) == set(v29router.SPECS)
    for name, spec in v29router.SPECS.items():
        paid = set(spec.capabilities) & v29router.PAID
        assert bool(paid) == spec.research, name
        assert spec.board in v29router.BOARDS


def test_work_graph_has_no_paid_discovery():
    found = v29router.as_record(v29router.route('Make a moodboard for warm brutalist editorial', 'moodboard'))
    graph = task_graph.compile_plan({'mode': 'quick', 'needs_web': True, 'route': found}, 'moodboard')
    kinds = [n['type'] for n in graph['nodes']]
    assert 'discover' not in kinds and 'fill_gaps' not in kinds
    assert kinds == ['browse', 'compose', 'write', 'publish']
    compose = next(n for n in graph['nodes'] if n['id'] == 'compose')
    assert compose['depends_on'] == ['browse']


def test_research_route_keeps_the_legacy_graph():
    found = v29router.as_record(v29router.route('history of the transistor', 'deep-research'))
    graph = task_graph.compile_plan({'mode': 'deep', 'needs_web': True, 'route': found, 'assignments': [{'role': 'analysis'}, {'role': 'verification'}]}, 'deep-research')
    assert [n['type'] for n in graph['nodes']] == ['discover', 'analyze', 'verify', 'fill_gaps', 'write', 'publish']


# Moodboard: real boards, no research

def test_moodboard_makes_boards_from_recorded_images_without_paid_search(tmp_path, free_web):
    result, record, adapter, search, *_ = run(tmp_path, 'moodboard', 'Make a moodboard for warm brutalist editorial')
    assert result['status'] == 'completed', record.failure
    assert record.plan['route']['board'] == 'visual' and record.plan['route']['report'] is False
    assert record.usage.get('searches', 0) == 0
    kinds = [o['zkind'] for o in zobjects(record)]
    assert kinds.count('picks') == 3 and 'reply' in kinds, 'two lead boards plus one helper board from the second search'
    helper = next(o for o in zobjects(record) if o['id'] == 'board-1')
    assert len(helper['data']['items']) == 3 and all(i['image_candidates'][0].startswith('https://upload.wikimedia.org/t2-') for i in helper['data']['items'])
    images = [r['image'] for r in record.results['v29']['refs'] if r['kind'] == 'image']
    assert len(images) == len(set(images)) == 7, 'each picture is recorded once'
    assert 'document' not in kinds, 'kinds the workflow did not ask for are rejected'
    assert not any(o.get('kind') == 'report' for o in record.canvas_objects)
    first = next(o for o in zobjects(record) if o['zkind'] == 'picks')
    items = first['data']['items']
    assert items[0]['image_candidates'] == ['https://images.are.na/a1.jpg']
    assert items[0]['url'] == 'https://www.are.na/block/1' and items[0]['subtitle'] == 'Ana'
    assert items[1]['url'] == 'https://www.are.na/block/2', 'a model-written URL never replaces the recorded one'
    assert first['part'] == 'worker_a'
    reply = next(o for o in zobjects(record) if o['zkind'] == 'reply')
    assert len(reply['data']['points']) == 5
    assert free_web['images'], 'free image tools were used'
    tools = {t['tool'] for t in record.results['v29']['tools']}
    assert 'images' in tools and 'site_images' in tools
    blocked = [t for t in record.results['v29']['tools'] if t['tool'] == 'site_images']
    assert all(t['status'] == 'blocked' for t in blocked), 'a blocked site is reported and skipped'


def test_flag_off_moodboard_still_uses_the_old_research_path(tmp_path):
    result, record, adapter, search, *_ = run(tmp_path, 'moodboard', 'Make a moodboard for warm brutalist editorial', router='')
    assert result['status'] == 'completed'
    assert 'route' not in record.plan and search.queries, 'unchanged when the router is off'
    assert not zobjects(record)


# Map a Project: the real files

def test_map_a_project_reads_the_repository_and_maps_real_imports(tmp_path):
    root = sample_repo(tmp_path)
    env = {'AEGIS_WORK_REPOSITORIES': json.dumps({'sample': str(root)})}
    result, record, adapter, *_ = run(tmp_path / 'svc', 'map-a-project', 'Map the architecture of this sample repository', env)
    assert result['status'] == 'completed', record.failure
    objs = {o['zkind']: o for o in zobjects(record)}
    assert {'project', 'diagram', 'document', 'reply'} <= set(objs)
    project = objs['project']['data']
    assert project['name'] == 'sample' and any(row['path'] == 'app' for row in project['tree'])
    assert any(s['name'] == 'Python' for s in project['stack']) and any(s['name'] == 'fastapi' for s in project['stack'])
    diagram = objs['diagram']['data']
    ids = {n['id'] for n in diagram['nodes']}
    assert {'app/api', 'app/store', 'app/ui'} <= ids
    assert {'from': 'app/api', 'to': 'app/store', 'label': '1 imports'} in diagram['edges'] or any(e['from'] == 'app/api' and e['to'] == 'app/store' for e in diagram['edges'])
    assert record.usage.get('searches', 0) == 0
    assert record.plan['route']['board'] == 'technical'


# Review a Change: ask before anything runs

def test_review_without_a_change_asks_first_and_spends_nothing(tmp_path):
    result, record, adapter, *_ = run(tmp_path, 'review-a-change', 'Review my GitHub change')
    assert result.get('needs_input') and 'Which change' in result['question']
    assert record.state == 'needs_input'
    assert adapter.calls == [], 'no model call before the question'
    assert len(record.request['clarifications'][-1]['options']) >= 2


def test_review_with_a_pasted_diff_makes_a_review(tmp_path):
    diff = 'Review this diff:\n```diff\n@@ -1 +1 @@\n-return round(x)\n+return x\n```'
    result, record, *_ = run(tmp_path, 'review-a-change', diff)
    assert result['status'] == 'completed', record.failure
    kinds = {o['zkind'] for o in zobjects(record)}
    assert {'list', 'diff', 'draft', 'reply'} <= kinds
    pasted = next(o for o in zobjects(record) if o['id'] == 'change-1')
    assert [l['op'] for l in pasted['data']['hunks'][0]['lines']] == ['del', 'add'], 'the pasted change is shown as written'
    sandbox = record.results['v29'].get('sandbox', {})
    assert sandbox.get('available') is False, 'no Docker here: checks are proposed, never claimed'
    assert 'tests pass' not in record.results['report_text'].lower()


# Plan My Day: the calendar, not productivity articles

def test_plan_my_day_uses_the_connected_calendar(tmp_path, monkeypatch):
    from astra_ai.core.work import google_accounts
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'status', lambda self, ctx: {'configured': True, 'connected': True, 'services': ['calendar', 'gmail']})
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'events', lambda self, ctx, a, b, limit=100: {'items': [
        {'id': 'e1', 'summary': 'Standup', 'start': {'dateTime': '2026-11-18T09:30:00+01:00'}, 'end': {'dateTime': '2026-11-18T09:45:00+01:00'}}]})
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'messages', lambda self, ctx, q='', limit=20: {'items': [
        {'id': 'ab12', 'subject': 'Deck', 'from': 'Ana', 'date': 'today', 'snippet': 'Can you send the deck?', 'url': 'https://mail.google.com/x'}]})
    result, record, adapter, *_ = run(tmp_path, 'plan-my-day', 'Plan my day')
    assert result['status'] == 'completed', record.failure
    plan = next(o for o in zobjects(record) if o['zkind'] == 'plan')
    assert plan['data']['steps'][0]['title'] == 'Standup' and plan['data']['calendar'] is True
    refs = {r['id'][0] for r in record.results['v29']['refs']}
    assert {'E', 'M'} <= refs
    assert record.plan['route']['board'] == 'schedule'


# Research is unchanged

def test_deep_research_still_uses_the_research_pipeline(tmp_path):
    result, record, adapter, search, *_ = run(tmp_path, 'deep-research', 'History of the transistor')
    assert result['status'] == 'completed', record.failure
    assert record.plan['route']['research'] is True and search.queries, 'research keeps paid search'
    assert any(o.get('kind') == 'report' for o in record.canvas_objects)


# Different workflows, different results

def test_workflows_produce_different_object_sets_and_boards(tmp_path, monkeypatch):
    from astra_ai.core.work import google_accounts
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'status', lambda self, ctx: {'configured': True, 'connected': True, 'services': ['calendar']})
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'events', lambda self, ctx, a, b, limit=100: {'items': [{'id': 'e', 'summary': 'Standup', 'start': {}, 'end': {}}]})
    root = sample_repo(tmp_path)
    env = {'AEGIS_WORK_REPOSITORIES': json.dumps({'sample': str(root)})}
    table = {}
    for workflow, query in [('moodboard', 'Make a moodboard for warm brutalist editorial'), ('map-a-project', 'Map this repository'),
                            ('plan-my-day', 'Plan my day'), ('campaign-plan', 'Plan a four-week launch campaign for Tidewater'),
                            ('review-a-change', '```diff\n@@ -1 +1 @@\n-a\n+b\n```')]:
        result, record, *_ = run(tmp_path / workflow, workflow, query, env)
        assert result['status'] == 'completed', (workflow, record.failure)
        assert record.usage.get('searches', 0) == 0, workflow
        table[workflow] = (record.plan['route']['board'], frozenset(o['zkind'] for o in zobjects(record)))
    boards = {board for board, _ in table.values()}
    assert len(boards) == 4, table
    assert len({kinds for _, kinds in table.values()}) == len(table), table


# Object validation

def test_object_builders_fill_links_only_from_references():
    refs = zo.References([{'id': 'I1', 'kind': 'image', 'image': 'https://x.org/a.jpg', 'images': ['https://x.org/a.jpg'], 'page': 'https://x.org/a'}])
    data = zo.build('picks', {'facet': 'nonsense', 'items': [{'name': 'A', 'ref': 'I1'}, {'name': 'B', 'url': 'https://made.up/'}]}, refs)
    assert data['facet'] == 'other'
    assert data['items'][0]['image_candidates'] == ['https://x.org/a.jpg'] and data['items'][0]['recommended'] is True
    assert 'url' not in data['items'][1]
    with pytest.raises(zo.ObjectFault):
        zo.build('media', {'medium': 'image', 'url': 'https://made.up/x.jpg'}, refs)
    with pytest.raises(zo.ObjectFault):
        zo.build('plan', {'steps': []}, refs)
    data = zo.build('diagram', {'nodes': [{'id': 'a', 'name': 'A', 'kind': 'service'}, {'id': 'b', 'name': 'B', 'kind': 'bogus'}],
                                'edges': [{'from': 'a', 'to': 'b'}, {'from': 'a', 'to': 'zzz'}]}, refs)
    assert data['nodes'][1]['kind'] == 'other' and data['edges'] == [{'from': 'a', 'to': 'b'}]


def test_an_account_error_never_stops_the_run(tmp_path, monkeypatch):
    from astra_ai.core.work import google_accounts

    def broken(self, ctx):
        raise google_accounts.AccountError('account_storage_unavailable')
    monkeypatch.setattr(google_accounts.GoogleAccounts, 'status', broken)
    result, record, *_ = run(tmp_path, 'plan-my-day', 'Plan my day: report by 15:00, gym at 18:00')
    assert result['status'] == 'completed', record.failure
    assert record.results['v29']['account']['connected'] is False
    assert any(o['zkind'] == 'plan' for o in zobjects(record))


def test_undated_plans_are_timelines_not_calendars():
    data = zo.build('plan', {'calendar': True, 'steps': [{'when': 'Week 1', 'title': 'Tease', 'kind': 'milestone'}, {'when': 'Week 2', 'title': 'Launch', 'kind': 'milestone'}]}, zo.References())
    assert data['calendar'] is False
