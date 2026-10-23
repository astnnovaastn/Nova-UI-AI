import json,time
import pytest
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.entity_graph import local_organize,apply_proposals,snapshot
from astra_ai.memory.organizer_runtime import OrganizerRuntime
from astra_ai.memory.history_import import preview,commit

@pytest.fixture
def memory(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcripts.json');m.ensure_ready();return m

def proposals(a,b,quote):
    return {'entities':[{'id':name,'label':name,'entity_type':'concept','aliases':[], 'member_ids':[rid],'evidence':[{'message_id':'source','quote':quote}]} for name,rid in [('Alpha',a),('Beta',b)]], 'relationships':[{'from':'Alpha','to':'Beta','type':'related_to','evidence':[{'message_id':'source','quote':quote}]}]}

def test_evidence_relationships_dedup_forget_restore(memory):
    a=memory.save_fact('notes','Alpha','Alpha project')['id'];b=memory.save_fact('notes','Beta','Beta project')['id']
    local_organize(memory)
    source={'id':'source','role':'user','content':'Alpha works with Beta','session_id':'s','turn_id':'t'}
    p=proposals(a,b,source['content']);r=apply_proposals(memory,p,[source],'one');assert r['pending']==0
    assert len(memory.load()['entity_graph']['connections'])==1
    assert apply_proposals(memory,p,[source],'one')['status']=='duplicate'
    memory.forget(a);g=snapshot(memory,level='detail');assert a not in {n['id'] for n in g['nodes']};assert not g['edges'] or all(e['from'] in {n['id'] for n in g['nodes']} and e['to'] in {n['id'] for n in g['nodes']} for e in g['edges'])
    memory.restore(a);assert a in {n['id'] for n in snapshot(memory,level='detail')['nodes']}

def test_cooccurrence_and_fabricated_evidence_pending(memory):
    a=memory.save_fact('notes','Alpha','Alpha')['id'];b=memory.save_fact('notes','Beta','Beta')['id'];source={'id':'source','role':'user','content':'Alpha and Beta are two names'}
    result=apply_proposals(memory,proposals(a,b,source['content']),[source],'two');assert result['pending']==1;assert not memory.load()['entity_graph']['connections']
    assert apply_proposals(memory,proposals(a,b,'Alpha works with Beta'),[source],'fake')['saved']==0
    assert apply_proposals(memory,proposals(a,b,source['content']),[{**source,'role':'assistant'}],'assistant')['saved']==0

def test_import_dates_session_attribution_and_retries(memory):
    data=json.dumps([{'role':'user','content':'Hello','timestamp':'2026-10-07T23:00:00Z','session_id':'a'},{'role':'assistant','content':'Hello','timestamp':'2026-10-07T23:00:01Z','session_id':'b'},{'role':'assistant','content':'Hi','timestamp':'2026-10-07T23:00:02Z','session_id':'a'},{'role':'user','content':'undated','timestamp':'2026-10-07T23:00:00'}])
    p=preview(data);assert p['counts']=={'messages':2,'sessions':1,'ambiguous':2}
    commit(memory,data,p['fingerprint']);commit(memory,data,p['fingerprint']);g=snapshot(memory,level='detail',timezone_name='Europe/Madrid');assert g['counts']['turns']==1;assert any(n['kind']=='day' and n['label']=='2026-10-08' for n in g['nodes'])
    assert snapshot(memory,revision='wrong')['status']=='stale'

def test_queue_restart_and_cancellation(memory):
    memory.append_turn('Hello','Hi','s','t');runtime=OrganizerRuntime({},memory);runtime.enqueue('s','t');runtime.enqueue('s','t');assert runtime.get_workflow_status()['counts']['queued']==1
    jid=runtime.get_workflow_status()['jobs'][0]['id'];runtime.cancel(jid);runtime.start_monitoring();runtime.stop_monitoring();assert runtime.get_workflow_status()['counts']['canceled']==1


def test_graph_management_reversible_and_scoped(memory):
    from astra_ai.memory.entity_graph import manage
    a=memory.save_fact('notes','Alpha','Alpha')['id'];b=memory.save_fact('notes','Beta','Beta')['id'];source={'id':'source','role':'user','content':'Alpha and Beta'}
    apply_proposals(memory,proposals(a,b,source['content']),[source],'proposal');g=memory.load()['entity_graph'];sid=next(iter(g['suggestions']))
    assert manage(memory,'approve',sid)['status']=='saved';assert any(e['id']==sid for e in snapshot(memory)['edges'])
    assert manage(memory,'forget',sid)['status']=='saved';assert not any(e['id']==sid for e in snapshot(memory)['edges'])
    manage(memory,'restore',sid);assert any(e['id']==sid for e in snapshot(memory)['edges'])
    entity=next(iter(g['entities']));manage(memory,'rename',entity,label='New title');manage(memory,'forget',entity);assert entity not in {n['id'] for n in snapshot(memory)['nodes']};manage(memory,'restore',entity);assert entity in {n['id'] for n in snapshot(memory)['nodes']}
    scoped=memory.save_fact('notes','scoped_fixture','Scoped value',profile_id='other')['id'];local_organize(memory);assert scoped not in {n['id'] for n in snapshot(memory,level='detail')['nodes']}

def test_rejected_evidence_and_disk_failure(memory,monkeypatch):
    a=memory.save_fact('notes','Alpha','Alpha')['id'];b=memory.save_fact('notes','Beta','Beta')['id'];local_organize(memory)
    source={'id':'source','role':'user','content':'Alpha works with Beta'}
    monkeypatch.setattr(memory,'_commit',lambda *_:(_ for _ in ()).throw(OSError('disk failed')))
    with pytest.raises(OSError):apply_proposals(memory,proposals(a,b,source['content']),[source],'disk')
    assert not memory.load()['entity_graph']['connections']

def test_alias_recall_and_queue_revisions(memory):
    a=memory.save_fact('notes','Alpha','Alpha is also ProjectOne')['id'];source={'id':'source','role':'user','content':'Alpha is also ProjectOne'}
    p={'entities':[{'id':'Alpha','label':'Alpha','entity_type':'concept','aliases':['ProjectOne'],'member_ids':[a],'evidence':[{'message_id':'source','quote':source['content']}]}],'relationships':[]}
    apply_proposals(memory,p,[source],'alias');assert memory.recall_memory('ProjectOne')['matches'][0]['id']==a
    runtime=OrganizerRuntime({},memory);memory.append_turn('First','reply','s','t');runtime.enqueue('s','t');runtime.pause_processing();assert OrganizerRuntime({},memory).paused


def test_pattern_requires_three_completed_turns_two_sessions(memory):
    rid=memory.save_fact('notes','alpha_fixture','Alpha routine')['id']
    for i,sid in enumerate(['a','a','b']):
        tid=str(i);memory.append_turn('Alpha is my routine','Okay',sid,tid)
        source=next(m for m in memory._messages() if m.get('turn_id')==tid and m['role']=='user')
        apply_proposals(memory,{'patterns':[{'label':'Alpha','member_ids':[rid],'evidence':[{'message_id':source['id'],'quote':'Alpha is my routine'}]}]},[source],f'pattern-{i}')
        pattern=next(iter(memory.load()['entity_graph']['patterns'].values()));assert pattern['state']==('active' if i==2 else 'pending')


def test_balanced_projection_and_visible_edges_share_revision(memory):
    for category in ['user_identity','personal_preferences','task_project_tracking']:
        memory.save_fact(category,'balanced_fixture','Fixture '+category)
    for i in range(20):memory.append_turn('Hi '+str(i),'Reply','session','turn'+str(i))
    local_organize(memory)
    page=snapshot(memory,level='detail',sample='balanced',limit=18)
    assert {'user_identity','personal_preferences','task_project_tracking'} <= {n.get('category') for n in page['nodes']}
    ids=[n['id'] for n in page['nodes']]
    joined=snapshot(memory,level='detail',node_ids=ids,revision=page['revision'])
    assert joined['status']=='ok' and joined['edges']
    assert all(e['from'] in ids and e['to'] in ids for e in joined['edges'])
    assert snapshot(memory,node_ids=ids,level='detail',revision='old')['status']=='stale'
