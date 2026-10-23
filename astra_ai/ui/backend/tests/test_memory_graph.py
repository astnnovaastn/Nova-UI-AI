import json
import time
from datetime import datetime, timedelta, timezone
import pytest
from astra_ai.memory.shared_memory import SharedMemory, atomic

@pytest.fixture
def memory(tmp_path):
    service = SharedMemory(memory_path=tmp_path/'long_term.json', transcript_path=tmp_path/'conversation.json')
    service.ensure_ready()
    return service

def test_graph_projects_real_records_and_completed_sessions_without_rewriting_json(memory):
    a = memory.save_fact('projects', 'fixture_project', 'Cobalt test', session_id='fixture')['id']
    b = memory.save_fact('preferences', 'fixture_style', 'concise')['id']
    memory.link(a, b, 'supports', 'User explicitly connected these records')
    memory.append_turn('Discuss cobalt test', 'Completed response', 'fixture', 'turn')
    before = {p: p.read_bytes() if p.exists() else None for p in (memory.memory_path, memory.transcript_path, memory.forgotten_path)}
    graph = memory.graph_snapshot()
    assert graph['counts'] == {'memories': 2, 'sessions': 1, 'completed_turns': 1, 'connections': 1}
    assert all('value' not in node and 'content' not in node for node in graph['nodes'])
    assert len([e for e in graph['edges'] if e['type']!='topic_membership']) == 2
    assert any(e['type']=='topic_membership' and e['visual_only'] for e in graph['edges'])
    assert next(e for e in graph['edges'] if e.get('visual_only'))['type'] == 'source_session'
    assert {p: p.read_bytes() if p.exists() else None for p in before} == before
    assert memory.graph_session_details('fixture')['turns'][0]['messages'][1]['content'] == 'Completed response'
    again = memory.append_turn('Discuss cobalt test', 'Completed response', 'fixture', 'turn')
    assert again['count'] == 0
    assert memory.graph_snapshot()['counts']['completed_turns'] == 1

def test_graph_filters_scope_privacy_partial_expired_and_forgotten(memory):
    ordinary = memory.save_fact('projects', 'ordinary', 'Cobalt global')['id']
    private = memory.save_fact('projects', 'scoped', 'Cobalt alpha', project_id='alpha')['id']
    removed = memory.save_fact('projects', 'forgotten', 'Blue Lantern')['id']
    memory.append_turn('Blue Lantern discussed', 'Blue Lantern noted', 'forgotten', 'turn')
    memory.forget(removed)
    memory.append_turn('Scoped context', 'Completed', 'alpha', 'a', project_id='alpha')
    memory.append_messages([
        {'id': 'private-u', 'role': 'user', 'content': 'Private', 'turn_id': 'p', 'session_id': 'private', 'private': True},
        {'id': 'private-a', 'role': 'assistant', 'content': 'Private', 'turn_id': 'p', 'session_id': 'private', 'private': True},
        {'id': 'partial-u', 'role': 'user', 'content': 'Unfinished', 'turn_id': 'x', 'session_id': 'partial'},
        {'id': 'partial-a', 'role': 'assistant', 'content': 'Interrupted', 'turn_id': 'x', 'session_id': 'partial', 'completed': False},
    ])
    graph = memory.graph_snapshot()
    assert {n['id'] for n in graph['nodes']} == {ordinary}
    assert not memory.graph_session_details('private')['turns']
    assert not memory.graph_session_details('partial')['turns']
    scoped = memory.graph_snapshot(project_id='alpha')
    assert {ordinary, private}.issubset({n['id'] for n in scoped['nodes']})
    assert scoped['counts']['sessions'] == 1
    assert not memory.graph_session_details('forgotten')['turns']

def test_graph_archives_pagination_revision_and_notification_metadata(memory):
    memory.append_messages([{'id': f'm-{i}', 'role': 'user' if i%2==0 else 'assistant', 'content': 'Archived fixture', 'timestamp': '2025-01-01T00:00:00+00:00', 'session_id': 'archive', 'turn_id': f't-{i//2}'} for i in range(2002)])
    assert memory.archive.exists()
    assert memory.graph_snapshot()['counts']['completed_turns'] == 1001
    details = memory.graph_session_details('archive', offset=1000, limit=10)
    assert details['total'] == 1001 and len(details['turns']) == 1
    before = memory.graph_snapshot()['revision']
    notifications = memory.notification_snapshot()
    memory.append_turn('New turn', 'Done', 'new', 'new')
    assert memory.graph_snapshot()['revision'] != before
    assert memory.notification_snapshot()['transcripts'] != notifications['transcripts']
    assert str(memory.memory_path.parent) not in json.dumps(memory.notification_snapshot())
    assert memory.graph_snapshot(limit=1, offset=1)['total'] == 2
    assert len(memory.graph_snapshot(limit=1, offset=1)['nodes']) == 1

def test_graph_works_with_fact_retention_disabled_and_legacy_pairs(memory):
    atomic(memory.transcript_path, {'privacy_settings': {'retain_memories': False}, 'conversation': []})
    memory.append_turn('Ordinary text', 'Completed answer', 'transcript-only', 'a')
    assert memory.graph_snapshot()['counts']['completed_turns'] == 1
    assert not memory.load()['records']
    memory.append_messages([{'id': 'old-u', 'role': 'user', 'content': 'Old user', 'session_id': 'legacy'}, {'id': 'old-a', 'role': 'assistant', 'content': 'Old answer', 'session_id': 'legacy'}])
    assert memory.graph_session_details('legacy')['total'] == 1

def test_stale_edits_cannot_overwrite_new_memory(memory):
    rid = memory.save_fact('projects', 'fixture', 'Version one')['id']
    memory.memory_action('update', record_id=rid, value='Version two', expected_revision=1)
    result = memory.memory_action('update', record_id=rid, value='Stale version', expected_revision=1)
    assert result['status'] == 'conflict'
    assert memory.load()['records'][rid]['value'] == 'Version two'

def test_forgotten_record_can_be_inspected_without_reactivation(memory):
    rid=memory.save_fact('projects','fixture','Cobalt fixture')['id']
    memory.memory_action('update',record_id=rid,value='Revised Cobalt fixture')
    memory.forget(rid)
    assert memory.memory_action('get',record_id=rid)['status']=='not_found'
    result=memory.memory_action('get',record_id=rid,include_forgotten=True)
    assert result['record']['forgotten_at']
    assert memory.memory_action('history',record_id=rid,include_forgotten=True)['history']
    assert rid not in memory.load()['records']
    assert not memory.graph_snapshot()['nodes']

def test_expiry_invalidates_graph_cache_without_a_file_change(memory):
    rid=memory.save_fact('current_state','temporary','Fixture state',valid_until=(datetime.now(timezone.utc)+timedelta(seconds=.4)).isoformat())['id']
    assert rid in {node['id'] for node in memory.graph_snapshot()['nodes']}
    time.sleep(.45)
    assert rid not in {node['id'] for node in memory.graph_snapshot()['nodes']}

def test_graph_cache_with_ten_thousand_records(memory):
    rid = memory.save_fact('projects', 'fixture', 'Cobalt')['id']
    with memory._lock:
        data = memory.load()
        template = data['records'][rid]
        data['records'] = {f'fixture-{i}': {**template, 'id': f'fixture-{i}', 'key': f'fixture_{i}'} for i in range(10000)}
        memory._commit(data)
    assert memory.graph_snapshot()['total'] == 10000
    started = time.perf_counter()
    page = memory.graph_snapshot(offset=1000)
    elapsed = (time.perf_counter() - started) * 1000
    assert len(page['nodes']) == 500 and elapsed < 100
