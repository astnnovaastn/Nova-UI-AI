import asyncio
import pytest
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.globe_projection import page,projection,detail

@pytest.fixture
def memory(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcript.json');m.ensure_ready();return m

def test_scope_history_transcripts_and_pagination(memory):
    one=memory.save_fact('user_identity','fixture_name','Fake User')['id']
    other=memory.save_fact('user_identity','other_fixture','Other User',profile_id='other')['id']
    memory.append_turn('Fake historical user message','Fake assistant response','fixture-session','fixture-turn')
    snapshot=projection(memory);assert one in snapshot['records'];assert other not in snapshot['records'];assert len(snapshot['raw']['category_definitions'])==27
    transcripts=[r for r in snapshot['records'].values() if r.get('source')=='conversation'];assert {r['attributes']['speaker'] for r in transcripts}=={'user','assistant'}
    first=page(memory,limit=1);assert first['next_cursor'];second=page(memory,cursor=first['next_cursor'],limit=1);assert first['revision']==second['revision']
    assert page(memory,profile_id='other',cursor=first['next_cursor'])['status']=='stale'
    memory.save_fact('personal_preferences','fixture_preference','Fake preference');assert page(memory,cursor=first['next_cursor'])['status']=='stale'
    with pytest.raises(ValueError):page(memory,cursor='not-json')

def test_forget_restore_and_private_transcript(memory):
    rid=memory.save_fact('personal_preferences','fixture_private','Fake secret context')['id'];memory.append_turn('Fake secret context','Okay','s','t')
    memory.append_messages([{'id':'private-message','role':'user','content':'Do not expose fixture','private_session':True,'timestamp':'2026-10-08T12:00:00Z'}])
    assert 'private-message' not in projection(memory)['records'];memory.forget(rid);assert not detail(memory,rid)['record'];assert not any('Fake secret context' in str(r.get('content','')) for r in projection(memory)['records'].values())
    memory.restore(rid);assert detail(memory,rid)['record']['value']=='Fake secret context'

def test_api_rejects_unknown_connection_and_scope_spoof(memory,monkeypatch):
    from astra_ai.ui.backend import server
    from starlette.requests import Request
    from fastapi import HTTPException
    monkeypatch.setattr(server.state,'live_memory',memory)
    def req(client='',query=b''):return Request({'type':'http','headers':[(b'x-nova-client',client.encode())],'query_string':query})
    with pytest.raises(HTTPException) as unknown:asyncio.run(server.memory_globe(req()))
    assert unknown.value.status_code==403
    socket=object();monkeypatch.setattr(server.ws_manager,'websocket_for',lambda c:socket if c=='fixture-client' else None)
    assert asyncio.run(server.memory_globe(req('fixture-client')))['status']=='ok'
    with pytest.raises(HTTPException):asyncio.run(server.memory_globe(req('fixture-client',b'profile_id=other')))
    with pytest.raises(HTTPException):asyncio.run(server.memory_globe_record('missing',req('fixture-client')))

def test_guest_reads_only_its_separate_manager(memory,monkeypatch,tmp_path):
    from astra_ai.ui.backend import server
    from starlette.requests import Request
    from types import SimpleNamespace
    guest=SharedMemory(memory_path=tmp_path/'guest-memory.json',transcript_path=tmp_path/'guest-transcript.json');guest.ensure_ready()
    owner_id=memory.save_fact('user_identity','owner_fixture','Owner fixture')['id'];guest_id=guest.save_fact('user_identity','guest_fixture','Guest fixture',profile_id='guest-fixture')['id']
    monkeypatch.setattr(server.state,'live_memory',memory);monkeypatch.setattr(server,'guest_memory',guest);socket=object();monkeypatch.setattr(server.ws_manager,'websocket_for',lambda _:socket);monkeypatch.setattr(server.state,'live_sessions',{socket:SimpleNamespace(guest=True,profile_id='guest-fixture',project_id='')})
    result=asyncio.run(server.memory_globe(Request({'type':'http','headers':[(b'x-nova-client',b'fixture')],'query_string':b''})))
    ids={r['id'] for sec in ('facts','events','activity_history') for group in result['raw'][sec].values() for r in group.values()};assert guest_id in ids and owner_id not in ids


def test_scope_change_during_projection_fails_closed(memory,monkeypatch):
    from astra_ai.ui.backend import server
    from astra_ai.memory import globe_projection
    from starlette.requests import Request
    from types import SimpleNamespace
    from fastapi import HTTPException
    socket=object();monkeypatch.setattr(server.state,'live_memory',memory);monkeypatch.setattr(server.ws_manager,'websocket_for',lambda _:socket);sessions={};monkeypatch.setattr(server.state,'live_sessions',sessions)
    original=globe_projection.page
    def changing(*args):
        result=original(*args);sessions[socket]=SimpleNamespace(guest=True,profile_id='guest-fixture',project_id='');return result
    monkeypatch.setattr(globe_projection,'page',changing)
    request=Request({'type':'http','headers':[(b'x-nova-client',b'fixture')],'query_string':b''})
    with pytest.raises(HTTPException) as changed:asyncio.run(server.memory_globe(request))
    assert changed.value.status_code==403


def test_visual_topics_are_bounded_and_never_modify_category_or_relationship(memory):
    from astra_ai.memory.globe_topics import topics
    records={str(i):{'id':str(i),'category':'session_themes','kind':'activity','content':'Memory Python voice projects', 'source':'conversation'} for i in range(250)}
    stored={str(i):{'state':'active','label':'Topic '+str(i),'member_ids':[str(i),str(i+1)]} for i in range(220)}
    groups=topics(records,stored);assert 220<=len(groups)<=320;assert all(g['visual_only'] for g in groups);assert all(r['category']=='session_themes' for r in records.values())
    assert all(set(g['member_ids'])<=records.keys() for g in groups)


def test_private_topic_labels_and_expired_transcripts_are_filtered(memory):
    one=memory.save_fact('user_identity','one','Fixture one')['id'];two=memory.save_fact('user_identity','two','Fixture two')['id']
    m=memory.load();m['topic_groups']={'foreign':{'id':'foreign','state':'active','label':'Foreign private fixture','profile_id':'other','member_ids':[one,two]},'private':{'id':'private','state':'active','label':'Private fixture topic','private':True,'member_ids':[one,two]}};memory._commit(m)
    memory.append_messages([{'id':'expired-fixture','role':'user','content':'Expired fixture text','timestamp':'2025-01-01T00:00:00Z','valid_until':'2025-01-02T00:00:00Z'}])
    result=projection(memory);assert 'expired-fixture' not in result['records'];assert not any(g['label'] in {'Foreign private fixture','Private fixture topic'} for g in result['raw']['visual_topics'])


def test_daily_history_and_actions_reject_unknown_connections(memory,monkeypatch):
    from astra_ai.ui.backend import server
    from starlette.requests import Request
    from fastapi import HTTPException
    monkeypatch.setattr(server.state,'live_memory',memory);monkeypatch.setattr(server.ws_manager,'websocket_for',lambda _:None)
    request=Request({'type':'http','headers':[],'query_string':b''})
    with pytest.raises(HTTPException):asyncio.run(server.memory_globe_history(request))
    with pytest.raises(HTTPException):asyncio.run(server.memory_globe_action('missing',{'action':'forget'},request))
