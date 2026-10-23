from astra_ai.memory.daily_history import conversation_day, history
from astra_ai.memory.shared_memory import SharedMemory

def test_four_am_madrid_boundary_and_dst():
    assert conversation_day('2026-10-09T01:59:59Z')=='2026-10-08'
    assert conversation_day('2026-10-09T02:00:00Z')=='2026-10-09'
    assert conversation_day('2026-12-09T02:59:59Z')=='2026-12-08'
    assert conversation_day('2026-12-09T03:00:00Z')=='2026-12-09'
    assert conversation_day('2026-10-09T03:00:00')=='2026-10-08'
    assert conversation_day('unclear')=='undated'

def test_daily_history_preserves_sessions_speakers_and_scope(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcripts.json');m.ensure_ready()
    rows=[{'id':'a','role':'user','content':'Fixture user','session_id':'morning','timestamp':'2026-10-08T08:00:00Z'},
          {'id':'b','role':'assistant','content':'Fixture assistant','session_id':'evening','timestamp':'2026-10-08T23:00:00Z'},
          {'id':'c','role':'user','content':'Fixture next day','session_id':'next','timestamp':'2026-10-09T02:00:00Z'},
          {'id':'private','role':'user','content':'Hidden fixture','private_session':True,'session_id':'private','timestamp':'2026-10-08T09:00:00Z'},
          {'id':'guest','role':'user','content':'Guest fixture','profile_id':'guest','session_id':'guest','timestamp':'2026-10-08T09:00:00Z'}]
    m.append_messages(rows)
    days=history(m)['days'];assert len(days)==2
    old=history(m,day='2026-10-08');assert [r['id'] for r in old['messages']]==['a','b'];assert [r['role'] for r in old['messages']]==['user','assistant'];assert old['session_ids']==['morning','evening']
    assert old['continue_session']=='evening'
    m.transcript_action('forget',record_id='a');assert [r['id'] for r in history(m,day='2026-10-08')['messages']]==['b']
    m.transcript_action('restore',record_id='a');assert history(m,day='2026-10-08')['total']==2
    assert history(m,day='2026-10-08',offset=1,limit=1)['messages'][0]['id']=='b'
    assert {r['id'] for r in m._messages()}=={r['id'] for r in rows}


def test_globe_actions_use_existing_reversible_services(tmp_path):
    from astra_ai.memory.globe_actions import execute
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcripts.json');m.ensure_ready()
    rid=m.save_fact('user_identity','fixture','Fixture')['id']
    assert execute(m,rid,{'action':'update','value':'Corrected fact fixture','expected_revision':1})['status']=='updated'
    assert m.load()['records'][rid]['value']=='Corrected fact fixture'
    assert execute(m,rid,{'action':'forget','expected_revision':999})['status']=='conflict'
    assert execute(m,rid,{'action':'forget'})['status']=='forgotten'
    assert execute(m,rid,{'action':'restore'})['status']=='restored'
    m.append_messages([{'id':'message','role':'user','content':'Fixture user','session_id':'a','timestamp':'2026-10-08T09:00:00Z'}])
    assert execute(m,'message',{'action':'update','value':'Corrected fixture','expected_revision':1})['status']=='updated'
    assert execute(m,'message',{'action':'forget'})['status']=='forgotten'
    assert execute(m,'message',{'action':'restore'})['status']=='restored'
    other=m.save_fact('user_identity','guest','Guest fixture',profile_id='guest')['id']
    assert execute(m,other,{'action':'forget'})['status']=='not_found'
    assert other in m.load()['records']
