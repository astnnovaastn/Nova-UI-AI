import json
from concurrent.futures import ThreadPoolExecutor
import pytest
from astra_ai.memory.shared_memory import SharedMemory, atomic
from astra_ai.memory.memory_types import MemoryCategory, ConflictType, RelationshipType, AdaptiveLearningType

@pytest.fixture
def memory(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'long_term.json',transcript_path=tmp_path/'conversation.json')
    m.ensure_ready()
    return m

@pytest.mark.parametrize('category',list(MemoryCategory))
def test_categories(memory,category):
    result=memory.save_fact(category.value,'fixture','cobalt test context',**({'source':'application','capture_source':'verified_application_event'} if category.value=='system_awareness' else {}))
    assert result['status']=='saved'
    matches=memory.recall_memory('cobalt',category=category.value,lifecycle='all')['matches']
    assert matches[0]['id']==result['id']

def test_correction_duplicates_and_scoped_operations(memory):
    first=memory.save_fact('preferences','style','concise',operation_id='one')
    assert memory.save_fact('preferences','style','concise',operation_id='one')['status']=='duplicate'
    assert memory.save_fact('preferences','style','verbose',operation_id='one')['status']=='rejected'
    changed=memory.save_fact('preferences','style','verbose',evidence='Actually I prefer verbose')
    assert changed['status']=='updated'
    record=memory.load()['records'][first['id']]
    assert record['revision']==2 and record['history'][0]['value']=='concise'
    for typ in ('trip','meeting'):
        assert memory.save_event(typ,'fixture','cobalt',operation_id='shared')['status'] in {'saved','rejected'}

@pytest.mark.parametrize('conflict',list(ConflictType))
def test_conflicts(memory,conflict):
    first=memory.save_fact('notes','fixture','before')
    pending=memory.save_fact('notes','fixture','after',conflict_type=conflict.value,evidence='uncertain change')
    # Use no explicit correction word.
    if pending['status']=='updated':
        pending=memory.save_fact('notes','fixture','third',conflict_type=conflict.value,evidence='uncertain')
    assert pending['status']=='pending_approval'
    assert memory.load()['conflicts'][-1]['type']==conflict.value
    assert memory.approve(pending['approval_id'])['status']=='updated'
    assert memory.load()['records'][first['id']]['value'] in {'after','third'}

@pytest.mark.parametrize('relationship',list(RelationshipType))
def test_relationships(memory,relationship):
    a=memory.save_fact('notes','one','cobalt one')['id']
    b=memory.save_fact('notes','two','cobalt two')['id']
    assert memory.link(a,b,relationship.value,evidence='User supplied relation')['status']=='saved'
    assert b in memory.recall_memory('cobalt',limit=10)['matches'][0]['related_ids']

@pytest.mark.parametrize('learning',list(AdaptiveLearningType))
def test_learning(memory,learning):
    rid=memory.save_fact('preferences','fixture','concise')['id']
    first=memory.learn(learning.value,rid,'User correction one')
    assert first['active']==(learning.value not in {'new_pattern','context_learning'})
    if learning.value in {'new_pattern','context_learning'}:
        refs=[]
        for i in range(3):
            session='a' if i<2 else 'b';turn=f'learning-{i}';memory.append_turn('a clear statement','okay',session,turn);refs.append({'session_id':session,'turn_id':turn})
        assert memory.learn(learning.value,rid,'Repeated evidence',evidence_refs=refs)['active']
    else:assert memory.learn(learning.value,rid,'User correction two')['active']

def test_privacy_secrets_and_invalid_data(memory):
    assert memory.save_fact('notes','api_key','hidden')['status']=='rejected'
    assert memory.save_fact('notes','fixture','x',confidence=float('nan'))['status']=='rejected'
    assert memory.save_event('fixture','x','x',attributes=['bad'])['status']=='rejected'
    pending=memory.save_fact('notes','medical','medical condition')
    assert pending['status']=='pending_approval'
    atomic(memory.transcript_path,{'privacy_settings':{'private_session':True},'conversation':[]})
    assert memory.append_turn('I prefer silence','okay')['status']=='private'
    assert memory.save_fact('notes','other','private')['status']=='private'
    assert len(memory.load()['records'])==0

def test_concurrency_and_restart(memory):
    def write(i):
        m=SharedMemory(memory_path=memory.memory_path,transcript_path=memory.transcript_path)
        return m.save_fact('notes','fixture_'+str(i),'cobalt '+str(i))
    with ThreadPoolExecutor(max_workers=8) as pool:
        results=list(pool.map(write,range(40)))
    assert all(x['status']=='saved' for x in results)
    assert len(memory.load()['records'])==40
    assert len(memory.recall_memory('cobalt',limit=100)['matches'])==40
    memory.index_path.write_bytes(b'corrupt')
    assert len(memory.recall_memory('cobalt',limit=100)['matches'])==40

def test_archives_filters_and_turn_dedup(memory):
    messages=[{'id':str(i),'role':'user','content':'cobalt historical','timestamp':'2025-01-01T00:00:00Z','session_id':'old'} for i in range(2100)]
    memory.append_messages(messages)
    assert len(json.loads(memory.transcript_path.read_text())['conversation'])==2000
    assert len((memory.archive/'2025-01.jsonl').read_text().splitlines())==100
    assert memory.append_messages(messages)['count']==0
    memory.append_turn('cobalt today','okay',session_id='new',turn_id='fixed')
    assert memory.append_turn('cobalt today','okay',session_id='new',turn_id='fixed')['count']==0
    matches=memory.recall_memory('cobalt',session_id='new')['matches']
    assert len(matches)==1 and matches[0]['session_id']=='new'
    assert memory.recall_memory('cobalt',until='2024-01-01')['matches']==[]

def test_migration_backups_idempotence_and_corruption(tmp_path):
    mp=tmp_path/'long_term.json';tp=tmp_path/'conversation.json'
    atomic(mp,{'preferences':{'style':{'value':'concise'}},'memory_events':[{'key':'fixture','event_type':'meeting','content':'cobalt'}]})
    atomic(tp,{'conversation':[{'role':'user','content':'cobalt old'}],'sessions':{'old':{'started':'earlier'}}})
    m=SharedMemory(memory_path=mp,transcript_path=tp)
    assert m.preview_migration()['conversation_count']==1
    m.ensure_ready();count=len(m.load()['records'])
    assert count==2 and len(list((tmp_path/'backups').glob('*')))==4
    assert len(list((tmp_path/'backups').glob('*before_category_registry*')))==2
    m.ensure_ready()
    assert len(m.load()['records'])==count
    assert json.loads(tp.read_text())['sessions']['old']['started']=='earlier'
    mp.write_text('{broken')
    with pytest.raises(ValueError):m.ensure_ready()
    assert mp.read_text()=='{broken'

def test_failed_write_journal(memory,monkeypatch):
    import astra_ai.memory.shared_memory as module
    original=module.atomic
    def fail(path,data):
        if path==memory.memory_path:raise OSError('fixture disk failure')
        return original(path,data)
    monkeypatch.setattr(module,'atomic',fail)
    with pytest.raises(OSError):memory.save_fact('notes','fixture','cobalt')
    assert memory.stats()['healthy'] is False
    assert json.loads(memory.pending_path.read_text())['operations']
    monkeypatch.setattr(module,'atomic',original)
    assert memory.flush()['pending']==0
    assert memory.recall_memory('cobalt')['matches']

def test_prompt_bound(memory):
    for i in range(25):memory.save_fact('notes','fixture_'+str(i),'cobalt '+'x'*500)
    assert len(memory.format_for_prompt(max_chars=700,query='cobalt'))<=700


def test_pending_retry_preserves_consent(memory):
    proposal=memory.save_fact('notes','medical','medical condition',operation_id='pending')
    assert proposal['status']=='pending_approval'
    assert memory.save_fact('notes','medical','medical condition',operation_id='pending')['status']=='pending_approval'
    assert memory.approve(proposal['approval_id'])['status']=='saved'
    assert memory.save_fact('notes','medical','medical condition',operation_id='pending')['status']=='duplicate'

def test_rejected_retry_does_not_reopen_consent(memory):
    proposal=memory.save_fact('notes','medical','medical condition',operation_id='decline')
    memory.approve(proposal['approval_id'],False)
    assert memory.save_fact('notes','medical','medical condition',operation_id='decline')['status']=='rejected'

def test_legacy_adapter_uses_same_store(tmp_path):
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    from astra_ai.memory.live_memory import LiveMemoryManager
    transcript=tmp_path/'Date'/'nova_ai_memory.json'
    agent=AdvancedMemoryAgent(str(transcript))
    live=LiveMemoryManager(memory_path=tmp_path/'memory'/'long_term.json',transcript_path=transcript)
    agent.process_conversation('I prefer cobalt concise replies','Okay',turn_id='legacy-turn')
    assert live.recall_memory('cobalt',kind='fact')['matches']
    assert live.recall_conversations('cobalt')['matches']
    live.save_fact('projects','fixture','cobalt project')
    assert agent.query_memory('cobalt',)['matches']

def _process_writer(paths,number):
    m=SharedMemory(memory_path=paths[0],transcript_path=paths[1])
    m.save_fact('notes','process_'+str(number),'cobalt concurrent process')

def test_interprocess_lock(memory):
    import multiprocessing
    context=multiprocessing.get_context('spawn')
    processes=[context.Process(target=_process_writer,args=((str(memory.memory_path),str(memory.transcript_path)),i)) for i in range(4)]
    for p in processes:p.start()
    for p in processes:
        p.join(15)
        assert p.exitcode==0
    assert len(memory.load()['records'])==4


def test_transcript_credentials_redacted_in_failed_write_journal(memory,monkeypatch):
    import astra_ai.memory.shared_memory as module
    original=module.atomic
    def fail(path,data):
        if path==memory.transcript_path:raise OSError('fixture transcript disk failure')
        return original(path,data)
    monkeypatch.setattr(module,'atomic',fail)
    with pytest.raises(OSError):
        memory.append_messages([{'role':'user','content':'password=fixturesecret','timestamp':'2026-01-01'}])
    assert 'fixturesecret' not in memory.pending_path.read_text()


def test_forget_moves_to_separate_file_and_restore(memory):
    result=memory.save_fact('projects','test_project_name','Blue Lantern')
    memory.forget(result['id'])
    assert result['id'] not in memory.load()['records']
    assert 'forgotten_records' not in json.loads(memory.memory_path.read_text())
    assert json.loads(memory.forgotten_path.read_text())['records'][result['id']]['value']=='Blue Lantern'
    assert memory.recall_memory('Blue Lantern',kind='fact')['matches']==[]
    forgotten=memory.memory_action('search_forgotten',query='Blue Lantern')
    assert forgotten['matches'][0]['id']==result['id']
    assert memory.restore(result['id'])['status']=='restored'
    assert memory.recall_memory('Blue Lantern',kind='fact')['matches'][0]['id']==result['id']
    assert result['id'] not in json.loads(memory.forgotten_path.read_text())['records']

def test_forget_transaction_recovers_without_record_loss(memory,monkeypatch):
    import astra_ai.memory.shared_memory as module
    result=memory.save_fact('notes','fixture','cobalt')
    original=module.atomic
    def fail(path,data):
        if path==memory.memory_path:raise OSError('fixture failure after archive')
        return original(path,data)
    monkeypatch.setattr(module,'atomic',fail)
    with pytest.raises(OSError):memory.forget(result['id'])
    assert memory.transaction_path.exists()
    monkeypatch.setattr(module,'atomic',original)
    recovered=memory.load()
    assert result['id'] not in recovered['records']
    assert result['id'] in recovered['forgotten_records']
    assert not memory.transaction_path.exists()

def test_authorized_forget_needs_no_repeated_confirmation(memory):
    import asyncio
    from astra_ai.ui.backend.gemini_live import execute_shared_memory_tool
    result=memory.save_fact('projects','fixture','Blue Lantern')
    data=memory.load();data['_meta']['policy']={'routine_autonomy':True};memory._commit(data)
    response=asyncio.run(execute_shared_memory_tool(memory,'forget_memory',{'record_id':result['id']},'Yes, that one.'))
    assert response['status']=='forgotten'
    response=asyncio.run(execute_shared_memory_tool(memory,'memory_action',{'action':'restore','record_id':result['id']},'Bring it back.'))
    assert response['status']=='restored'


def test_memory_management_actions(memory):
    a=memory.memory_action('create_fact',category='projects',key='first',value='cobalt project')
    b=memory.memory_action('create_event',event_type='milestone',key='second',value='cobalt release',attributes={'phase':1})
    rid=a['id']
    assert memory.memory_action('get',record_id=rid)['record']['value']=='cobalt project'
    assert memory.memory_action('list',category='projects')['total']==1
    assert memory.memory_action('search',query='cobalt')['matches']
    assert memory.memory_action('rename',record_id=rid,key='renamed')['status']=='updated'
    result=memory.memory_action('update',record_id=rid,value='cobalt revised')
    assert result['status']=='updated' and result['id']==rid
    assert len(memory.memory_action('history',record_id=rid)['history'])==2
    link=memory.memory_action('link',record_id=rid,to_id=b['id'],relationship_type='related_to',evidence='User relationship')
    assert memory.memory_action('list_links',record_id=rid)['links']
    assert memory.memory_action('unlink',record_id=link['id'])['status']=='deleted'
    learning=memory.memory_action('learn',record_id=rid,learning_type='preference_learning',evidence='User preference')
    assert memory.memory_action('list_learning')['learning']
    assert memory.memory_action('delete_learning',record_id=learning['id'])['status']=='deleted'
    assert memory.memory_action('list_conflicts')['status']=='ok'
    assert memory.memory_action('stats')['healthy']
    assert memory.memory_action('rebuild_index')['status']=='rebuilt'
    pending=memory.save_fact('notes','medical','medical condition')
    assert memory.memory_action('list_pending')['proposals']
    assert memory.memory_action('reject',approval_id=pending['approval_id'])['status']=='rejected'
    pending=memory.save_fact('notes','medical','medical condition')
    assert memory.memory_action('approve',approval_id=pending['approval_id'])['status']=='saved'
    assert memory.memory_action('forget',record_id=rid)['status']=='forgotten'
    assert memory.memory_action('list_forgotten')['matches']
    assert memory.memory_action('search_forgotten',query='cobalt revised')['matches']
    assert memory.memory_action('restore',record_id=rid)['status']=='restored'
    assert memory.memory_action('nonsense')['status']=='rejected'

def test_forget_utterance_does_not_recreate_fact(memory):
    result=memory.save_fact('projects','current_project','Blue Lantern')
    memory.forget(result['id'])
    memory.append_turn('Forget that I am working on Blue Lantern','Forgotten',turn_id='forget-turn')
    assert result['id'] not in memory.load()['records']


def test_organization_one_representation_and_metadata_cleanup(memory):
    data=memory.load()
    rid='category_scaffold'
    data['records'][rid]=memory._record(rid,'fact','personal_preferences','description','Category explanation',source='legacy',evidence='legacy migration')
    a=memory.save_fact('preferences','fixture','cobalt')
    data=memory.load()
    data['records'][rid]=memory._record(rid,'fact','personal_preferences','description','Category explanation',source='legacy',evidence='legacy migration')
    data['records']['copy']={**data['records'][a['id']],'id':'copy'}
    memory._commit(data)
    preview=memory.organize(dry_run=True)
    assert preview['duplicates_merged']==1 and preview['category_metadata_moved']==1
    assert len(memory.load()['records'])==3
    report=memory.organize()
    assert report['after_records']==1
    raw=json.loads(memory.memory_path.read_text())
    assert 'records' not in raw and 'preferences' not in raw
    assert raw['category_definitions']['personal_preferences']['description']=='Category explanation'
    assert raw['facts']['personal_preferences'][a['id']]['value']=='cobalt'
    assert memory.recall_memory('cobalt')['matches'][0]['id']==a['id']
    assert memory.organize()['duplicates_merged']==0

def test_organization_keeps_distinct_events_and_fact_changes(memory):
    first=memory.save_fact('preferences','fixture','concise')
    memory.save_fact('preferences','fixture','detailed',correction=True)
    memory.save_event('meeting','one','same meeting')
    memory.save_event('meeting','two','same meeting')
    memory.organize()
    assert len(memory.load()['records'])==3
    assert memory.load()['records'][first['id']]['history'][0]['value']=='concise'


def test_organization_separates_historical_actions(memory):
    from astra_ai.memory.shared_memory import stable,canonical,atomic
    event={'type':'ADD','category':'projects','summary':'cobalt project recorded','timestamp':'2025-01-01T12:00:00Z','provenance':{'source':'user'}}
    key=stable(canonical(event));rid=stable('legacy',key)
    data=memory.load();data['records'][rid]=memory._record(rid,'event','meta_memory',key,event['summary'],event_type='legacy_event');memory._commit(data)
    atomic(memory.transcript_path,{'conversation':[],'memory_events':[event],'memory_categories':{'old':'metadata'},'sessions':{'kept':{}},'privacy_settings':{'retain_memories':True}})
    result=memory.organize()
    assert result['historical_actions_organized']==1
    raw=json.loads(memory.memory_path.read_text())
    assert raw['activity_history']['memory_add'][rid]['source_timestamp']==event['timestamp']
    assert raw['events']=={}
    transcript=json.loads(memory.transcript_path.read_text())
    assert 'memory_events' not in transcript and 'memory_categories' not in transcript
    assert 'kept' in transcript['sessions'] and transcript['privacy_settings']['retain_memories']
