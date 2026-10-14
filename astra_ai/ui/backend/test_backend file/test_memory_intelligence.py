"""200 deterministic, attributed memory scenarios plus failure-path checks."""
from datetime import datetime, timezone, timedelta
import asyncio
import json
from types import SimpleNamespace
import pytest
from astra_ai.memory.shared_memory import SharedMemory, atomic
from astra_ai.memory.memory_intelligence import pack_entries
from astra_ai.memory.semantic_recall import EmbeddingPaused, normalized, GeminiEmbeddings
from astra_ai.core.time_service import TimeService

FAMILIES = ['capture', 'attribution', 'keyword', 'paraphrase', 'scope', 'private_outbound',
            'forget', 'stale_vectors', 'incremental', 'temporal', 'correction', 'repetitions',
            'protected_dormancy', 'dormancy_restore', 'whole_context', 'relative_date',
            'dst_duration', 'day_boundary', 'abstention', 'provenance']


class FixtureEmbeddings:
    model = 'fixture-v1'
    dimensions = 4
    verified = True
    def __init__(self):self.calls = []; self.fail = False
    def embed(self, text, query=False):
        self.calls.append((text, query))
        if self.fail:raise EmbeddingPaused('fixture_quota_exhausted')
        if any(word in text.casefold() for word in ['automobile', 'vehicle', 'car']):return [1, 0, 0, 0]
        if any(word in text.casefold() for word in ['orchid', 'flower']):return [0, 1, 0, 0]
        return [0, 0, 1, 0]


@pytest.fixture
def memory(tmp_path):
    manager = SharedMemory(memory_path=tmp_path/'memory.json', transcript_path=tmp_path/'history.json')
    manager.ensure_ready()
    return manager


def put(memory, key, value, **scope):
    result = memory.save_fact('meta_memory', key, value, **scope)
    assert result['status'] == 'saved'
    return result['id']


@pytest.mark.parametrize('variant', range(10))
@pytest.mark.parametrize('family', FAMILIES)
def test_deterministic_memory_scenario(memory, family, variant):
    key = f'fixture_{variant}'
    value = f'cobalt project {variant} uses orbital instrumentation'
    if family == 'capture':
        rid = put(memory, key, value)
        before = memory.load()['records'][rid]
        memory.prepare_intelligence()
        assert memory.load()['records'][rid] == before
    elif family == 'attribution':
        memory.append_turn(value, f'Noted fixture response {variant}', 'session_'+key, key)
        hit = memory.recall_conversations('instrumentation')['matches'][0]
        assert {m['role'] for m in hit['messages']} == {'user', 'assistant'}
        assert all(m.get('timestamp') and m.get('id') for m in hit['messages'])
    elif family == 'keyword':
        rid = put(memory, key, value)
        assert memory.retrieve_context('cobalt')['matches'][0]['id'] == rid
    elif family == 'paraphrase':
        rid = put(memory, key, f'I commute by automobile number {variant}')
        provider = FixtureEmbeddings(); memory.configure_semantic(provider, 'enabled')
        assert memory.semantic.backfill()['count'] == 1
        assert memory.retrieve_context('vehicle')['source_ids'] == [rid]
        assert memory.retrieve_context('vehicle')['source_ids'] == [rid]
        assert sum(query for _, query in provider.calls) == 1
    elif family == 'scope':
        rid = put(memory, key, value, profile_id='alice_'+key, project_id='alpha')
        assert memory.retrieve_context('cobalt', profile_id='bob_'+key)['matches'] == []
        assert memory.retrieve_context('cobalt', profile_id='alice_'+key, project_id='alpha')['source_ids'] == [rid]
    elif family == 'private_outbound':
        rid = put(memory, key, value)
        data = memory.load(); data['records'][rid]['local_only'] = True; memory._commit(data)
        provider = FixtureEmbeddings(); memory.configure_semantic(provider, 'enabled')
        assert memory.semantic.backfill()['count'] == 0 and provider.calls == []
    elif family == 'forget':
        rid = put(memory, key, value)
        memory.append_turn(value, 'Noted', 'session_'+key, key)
        memory.forget(rid)
        assert memory.retrieve_context('instrumentation')['matches'] == []
    elif family == 'stale_vectors':
        rid = put(memory, key, 'I travel by automobile')
        provider = FixtureEmbeddings(); memory.configure_semantic(provider, 'enabled')
        memory.semantic.backfill()
        memory.save_fact('meta_memory', key, 'I grow orchids', correction=True, evidence='Actually I grow orchids')
        assert memory.retrieve_context('vehicle')['matches'] == []
    elif family == 'incremental':
        rid = put(memory, key, value)
        memory.recall_memory('cobalt'); assert memory._index_stats['rebuilt']
        put(memory, 'second_'+key, 'another cobalt fixture')
        memory.recall_memory('cobalt'); assert memory._index_stats['changed'] == 1
        assert not memory._index_stats['rebuilt'] and memory._index_stats['removed'] == 0
    elif family == 'temporal':
        stamp = f'2025-02-{variant+1:02d}T11:30:00Z'
        memory.append_messages([{'id': key, 'content': value, 'role': 'user', 'session_id': key, 'timestamp': stamp}])
        assert memory.retrieve_context('cobalt', since=stamp, until=f'2025-02-{variant+2:02d}T00:00:00Z')['source_ids'] == [key]
        assert memory.retrieve_context('cobalt', until=stamp)['matches'] == []
    elif family == 'correction':
        rid = put(memory, key, value)
        memory.save_fact('meta_memory', key, 'Actually the project is amber', correction=True, evidence='Actually the project is amber')
        record = memory.memory_context_action('provenance', record_id=rid)['record']
        assert record['revision'] == 2 and record['history'][0]['value'] == value
    elif family == 'repetitions':
        memory.append_messages([{'id': f'{key}_{i}', 'content': value, 'role': 'user', 'session_id': f'session_{i}', 'timestamp': f'2025-03-{variant+1:02d}T0{i}:00:00Z'} for i in range(2)])
        assert len(memory.retrieve_context('cobalt')['source_ids']) == 2
    elif family == 'protected_dormancy':
        a = memory.save_fact('user_identity', key, value)['id']; b = memory.save_fact('user_identity', 'other_'+key, value)['id']
        assert memory.maintenance_action('dormant', record_id=a, revision=1, reason='duplicate', related_id=b)['status'] == 'rejected'
    elif family == 'dormancy_restore':
        a = put(memory, key, value); b = put(memory, 'other_'+key, value)
        data = memory.load(); data['records'][b]['key'] = key; memory._commit(data)
        assert memory.maintenance_action('dormant', record_id=a, revision=1, reason='duplicate', related_id=b)['status'] == 'saved'
        assert memory.load()['records'][a]['value'] == value
        assert a not in memory.retrieve_context('cobalt')['source_ids']
        assert memory.maintenance_action('restore', record_id=a, revision=1)['status'] == 'saved'
        assert a in {r['id'] for r in memory._eligible_sources()}
    elif family == 'whole_context':
        entries = [{'id': key, 'text': 'x'*(100+variant)}, {'id': 'short', 'text': 'hello'}]
        packed = pack_entries(entries, 70+variant)
        assert packed['entries'] == [entries[1]] and packed['overflow_ids'] == [key]
        assert json.loads(json.dumps(packed['entries'])) == packed['entries']
    elif family == 'relative_date':
        at = f'2026-10-{variant+2:02d}T12:00:00+02:00'
        result = memory.time_action('resolve', text='yesterday', at=at)
        assert result['date'] == f'2026-10-{variant+1:02d}' and result['until_exclusive']
    elif family == 'dst_duration':
        result = memory.time_action('duration', start=f'2026-03-29T01:{variant:02d}:00+01:00', end=f'2026-03-29T03:{variant:02d}:00+02:00')
        assert result['seconds'] == 3600
    elif family == 'day_boundary':
        clock = TimeService(memory, wall=lambda: datetime(2026, 10, variant+2, 1, 30, tzinfo=timezone.utc))
        assert clock.action()['conversation_day'] == f'2026-10-{variant+1:02d}'
    elif family == 'abstention':
        put(memory, key, value)
        assert memory.retrieve_context('saffron navigation')['matches'] == []
        assert memory.memory_context_action('provenance', record_id='missing_'+key)['status'] == 'not_found'
    elif family == 'provenance':
        rid = put(memory, key, value)
        result = memory.memory_context_action('provenance', record_id=rid)
        assert result['source_ids'] == [rid] and result['revision'] == 1


def test_quota_fallback_shadow_and_query_cache(memory):
    rid = put(memory, 'commute', 'I commute by automobile')
    provider = FixtureEmbeddings(); memory.configure_semantic(provider, 'shadow')
    memory.semantic.backfill()
    assert memory.retrieve_context('vehicle')['matches'] == []
    assert memory.semantic.shadow_comparisons == 1
    memory.semantic.mode = 'enabled'; provider.fail = True
    assert memory.retrieve_context('automobile')['source_ids'] == [rid]
    assert memory.semantic.last_error == 'fixture_quota_exhausted'


def test_forget_during_embedding_request(memory):
    rid = put(memory, 'one', 'I commute by automobile')
    class ForgettingProvider(FixtureEmbeddings):
        def embed(self, text, query=False):
            vector = super().embed(text, query)
            memory.forget(rid)
            return vector
    memory.configure_semantic(ForgettingProvider(), 'enabled')
    assert memory.semantic.backfill()['count'] == 0
    assert memory.semantic.status()['indexed'] == 0


def test_stale_disposition_and_source_summary(memory):
    rid = put(memory, 'one', 'The cobalt project uses orbital instrumentation')
    assert memory.maintenance_action('summary', record_id=rid, revision=0, summary='Cobalt project', evidence=['cobalt'])['reason'] == 'stale_revision'
    assert memory.maintenance_action('summary', record_id=rid, revision=1, summary='Cobalt project', evidence=['invented'])['status'] == 'rejected'
    assert memory.maintenance_action('summary', record_id=rid, revision=1, summary='Cobalt project', evidence=['cobalt project'])['status'] == 'saved'
    memory.forget(rid)
    assert memory.maintenance_action('restore', record_id=rid, revision=1)['status'] == 'not_found'


def test_clock_restart_monotonic_and_unknown_stop(memory):
    wall = [datetime(2026,10,14,10,tzinfo=timezone.utc)]; tick = [100.0]
    first = TimeService(memory, wall=lambda:wall[0], monotonic=lambda:tick[0])
    first.observe('runtime_start'); first.observe('conversation_start', 's', operation_id='start')
    tick[0] += 45; wall[0] -= timedelta(hours=1)
    assert first.action('status', session_id='s')['conversation_active_seconds'] == 45
    second = TimeService(memory, wall=lambda:wall[0], monotonic=lambda:tick[0])
    second.observe('runtime_start')
    assert second.action('status')['interrupted_runtime']['stop_time'] is None
    assert second.action('status', session_id='s')['conversation_active_seconds'] is None
    assert second.action('resolve', text='recently')['status'] == 'needs_clarification'
    assert second.action('duration', start='2025-01-01T00:00:00')['status'] == 'needs_clarification'


def test_context_tools_do_not_trust_model_profile(memory):
    from astra_ai.ui.backend.gemini_live import execute_shared_memory_tool
    put(memory, 'owner', 'cobalt owner', profile_id='owner')
    result = asyncio.run(execute_shared_memory_tool(memory, 'memory_context_action', {'action':'retrieve','query':'cobalt','profile_id':'owner'}, profile_id='guest'))
    assert result['matches'] == []


def test_google_protocol_is_single_text_and_redacts_failures(monkeypatch):
    calls=[]
    def get(url, **kwargs):
        calls.append((url, kwargs)); return SimpleNamespace(status_code=200,json=lambda:{'supportedGenerationMethods':['embedContent']})
    def post(url, **kwargs):
        calls.append((url,kwargs)); return SimpleNamespace(status_code=200,json=lambda:{'embedding':{'values':[1]*768}})
    monkeypatch.setattr('astra_ai.memory.semantic_recall.requests.get',get)
    monkeypatch.setattr('astra_ai.memory.semantic_recall.requests.post',post)
    provider=GeminiEmbeddings(lambda:'fixture-key')
    assert len(provider.embed('vehicle',query=True))==768
    assert ':embedContent' in calls[-1][0] and 'batch' not in calls[-1][0].lower()
    assert calls[-1][1]['json']['content']['parts']==[{'text':'task: search result | query: vehicle'}]
    assert 'taskType' not in calls[-1][1]['json'] and calls[-1][1]['json']['outputDimensionality']==768
    with pytest.raises(ValueError):normalized([float('nan')]*768)


def test_old_conversation_is_available_from_current_live_session(memory):
    from astra_ai.ui.backend.gemini_live import execute_shared_memory_tool
    memory.append_turn('I learned cobalt instrumentation last summer', 'You described an orbital project', 'last-year', 'original-turn')
    result = asyncio.run(execute_shared_memory_tool(memory, 'memory_context_action', {'action':'retrieve','query':'instrumentation'}, session_id='current-live'))
    assert result['matches'][0]['session_id'] == 'last-year'


def test_automatic_context_does_not_spend_query_embedding_budget(memory):
    put(memory, 'one', 'I commute by automobile')
    provider=FixtureEmbeddings();memory.configure_semantic(provider,'enabled');memory.semantic.backfill()
    before=len(provider.calls)
    memory.format_response_context(query='Hello',session_id='s')
    memory.format_response_context(query='vehicle',session_id='s')
    assert len(provider.calls)==before


def test_snapshot_invalidates_for_edit_and_forget(memory):
    rid=put(memory,'one','cobalt before')
    memory.retrieve_context('cobalt')
    memory.save_fact('meta_memory','one','Actually amber now',correction=True,evidence='Actually amber now')
    assert memory.retrieve_context('cobalt')['matches']==[]
    assert memory.retrieve_context('amber')['source_ids']==[rid]
    memory.forget(rid)
    assert memory.retrieve_context('amber')['matches']==[]


def test_resumption_handles_are_scoped_and_do_not_enter_status(memory):
    memory.live_resumption('save','s','a','p','fixture-model','opaque-token')
    assert memory.live_resumption('get','s','a','p','fixture-model')=='opaque-token'
    assert memory.live_resumption('get','s','b','p','fixture-model') is None
    assert 'opaque-token' not in json.dumps(memory.memory_context_action('status'))
    memory.live_resumption('clear','s','a','p','fixture-model')
    assert memory.live_resumption('get','s','a','p','fixture-model') is None


def test_standalone_backend_import_order():
    import ast
    from pathlib import Path
    source=(Path(__file__).resolve().parents[1]/'server.py').read_text(encoding='utf-8')
    lines=source.splitlines()
    boot=next(i for i,line in enumerate(lines) if 'sys.path.insert' in line or 'sys.path.append' in line)
    first=next(i for i,line in enumerate(lines) if line.startswith('from astra_ai'))
    assert first>boot
    assert next(i for i,line in enumerate(lines) if line.startswith('from calendar_backend'))>boot
    ast.parse(source)


def test_summary_is_sourced_searchable_and_invalidated_by_correction(memory):
    rid = put(memory, 'summary_source', 'The cobalt project uses orbital instrumentation')
    result = memory.maintenance_action('summary', record_id=rid, revision=1,
                                       summary='Spacecraft telemetry', evidence=['orbital instrumentation'])
    found = memory.retrieve_context('telemetry')['matches']
    assert found[0]['kind'] == 'summary' and found[0]['source_ids'] == [rid]
    assert found[0]['id'] == result['id']
    memory.save_fact('meta_memory', 'summary_source', 'Actually amber instruments now',
                     correction=True, evidence='Actually amber instruments now')
    assert memory.retrieve_context('telemetry')['matches'] == []
    assert memory.load()['records'][rid]['history'][0]['value'].startswith('The cobalt')


def test_dormancy_suppresses_derived_summary_and_forget_removes_it(memory):
    a = put(memory, 'duplicate', 'cobalt instrument'); b = put(memory, 'other', 'cobalt instrument')
    data = memory.load(); data['records'][b]['key'] = 'duplicate'; memory._commit(data)
    memory.maintenance_action('summary', record_id=a, revision=1, summary='telemetry', evidence=['instrument'])
    memory.maintenance_action('dormant', record_id=a, revision=1, reason='duplicate', related_id=b)
    assert memory.retrieve_context('telemetry')['matches'] == []
    assert memory.retrieve_context('telemetry', include_dormant=True)['source_ids'] == [a]
    memory.forget(a)
    assert memory.load()['_meta']['episodic_summaries'] == {}
    assert memory.retrieve_context('telemetry', include_dormant=True)['matches'] == []


def test_episode_small_limit_keeps_requested_exchange(memory):
    memory.append_turn('Earlier cobalt topic', 'Earlier response', 's', 'earlier')
    memory.append_turn('Recent amber topic', 'Recent response', 's', 'latest')
    hit = next(r for r in memory._messages() if r['turn_id'] == 'latest' and r['role'] == 'user')
    result = memory.episode(hit['id'], limit=2)
    assert {r['turn_id'] for r in result['messages']} == {'latest'}
    assert {r['role'] for r in result['messages']} == {'user', 'assistant'}
    assert not result['complete']


def test_rollout_gate_requires_recent_matching_project_and_improvement(memory, monkeypatch):
    import hashlib, time
    from astra_ai.memory.semantic_recall import validated_mode, MODEL
    from astra_ai.memory.shared_memory import atomic
    monkeypatch.delenv('NOVA_SEMANTIC_MODE', raising=False)
    path = memory.memory_path.parent/'memory-runtime'/'semantic-validation.json'
    gate = {'key_fingerprint': hashlib.sha256(b'fixture-key').hexdigest(), 'model': MODEL,
            'dimensions': 768, 'semantic_top1': 4, 'keyword_top1': 1, 'total_queries': 4,
            'maximum_query_ms': 500, 'measured_at': time.time()}
    atomic(path, gate)
    assert validated_mode(memory, lambda:'fixture-key') == 'enabled'
    assert validated_mode(memory, lambda:'different-project') == 'shadow'
    for change in ({'measured_at': time.time()+86400}, {'measured_at': 'bad'}, {'semantic_top1':1}):
        atomic(path, {**gate, **change})
        assert validated_mode(memory, lambda:'fixture-key') == 'shadow'
    monkeypatch.setenv('NOVA_SEMANTIC_MODE', 'off')
    assert validated_mode(memory, lambda:'fixture-key') == 'off'


def test_invalid_time_filter_is_rejected(memory):
    assert memory.retrieve_context('cobalt', since='not-a-date')['reason'] == 'invalid_time_filter'


def test_organizer_resume_does_not_reexecute_completed_work(memory):
    from astra_ai.memory.organizer_runtime import OrganizerRuntime
    from astra_ai.memory.shared_memory import atomic, read
    runtime = OrganizerRuntime(memory_system=memory)
    atomic(runtime.path, {'jobs': {'done': {'id':'done','state':'completed','attempts':2},
                                 'retry': {'id':'retry','state':'quota_paused','attempts':1}}})
    runtime.pause_processing(); runtime.resume_processing()
    jobs = read(runtime.path, {})['jobs']
    assert jobs['done'] == {'id':'done','state':'completed','attempts':2}
    assert jobs['retry']['state'] == 'queued' and not runtime.paused


@pytest.mark.parametrize('name,args', [
    ('recall_memory', {'query':'cobalt','profile_id':'owner'}),
    ('recall_conversations', {'query':'cobalt','profile_id':'owner'}),
    ('memory_action', {'action':'get','profile_id':'owner'}),
    ('memory_action', {'action':'history','profile_id':'owner'}),
    ('memory_action', {'action':'forget','profile_id':'owner'}),
    ('forget_memory', {'profile_id':'owner'}),
    ('learn_memory', {'learning_type':'preference_learning','evidence':'cobalt'}),
])
def test_compatibility_tools_cannot_cross_connection_scope(memory,name,args):
    from astra_ai.ui.backend.gemini_live import execute_shared_memory_tool
    rid = put(memory,'owner_record','cobalt owner',profile_id='owner')
    result = asyncio.run(execute_shared_memory_tool(memory,name,{**args,'record_id':rid},
                                                   user_text='Forget cobalt',profile_id='guest'))
    assert result.get('matches',[]) == []
    assert 'cobalt owner' not in json.dumps(result)
    assert rid in memory.load()['records']


def test_compatibility_proposals_use_actual_connection_scope(memory):
    from astra_ai.ui.backend.gemini_live import execute_shared_memory_tool
    result = asyncio.run(execute_shared_memory_tool(memory,'save_memory',
                        {'category':'meta_memory','key':'scope','value':'cobalt','profile_id':'owner'},
                        user_text='I prefer cobalt',profile_id='guest'))
    assert result['status']=='saved'
    assert memory.load()['records'][result['id']]['profile_id']=='guest'


@pytest.mark.parametrize('flags', [{'private':True}, {'private_session':True},
                                   {'attributes':{'private_session':True}}, {'consent':'revoked'}])
def test_private_records_are_filtered_even_with_semantic_off(memory,flags):
    from astra_ai.memory.semantic_recall import outbound_allowed
    rid = put(memory,'hidden','cobalt hidden')
    data = memory.load(); data['records'][rid].update(flags); memory._commit(data)
    assert memory._keyword_recall('cobalt')['matches']==[]
    assert memory.retrieve_context('cobalt')['matches']==[]
    assert not outbound_allowed(memory,memory.load()['records'][rid])


def test_unavailable_semantic_index_keeps_local_recall_and_startup_status(memory):
    rid = put(memory,'available','cobalt local')
    path = memory.memory_path.parent/'semantic.sqlite3'
    path.write_bytes(b'fixture corrupted disposable cache')
    status = memory.configure_semantic(FixtureEmbeddings(),'enabled')
    assert status['error']=='embedding_index_unavailable'
    assert memory.retrieve_context('cobalt')['source_ids']==[rid]
