import asyncio,base64,json
import numpy as np
import pytest
from astra_ai.memory.shared_memory import SharedMemory,read
from astra_ai.ui.backend.speaker_recognition import SpeakerRecognition,protect
from astra_ai.core.aegis_live_context import build_aegis_live_instruction

@pytest.fixture
def memory(tmp_path):
 m=SharedMemory(memory_path=tmp_path/'long.json',transcript_path=tmp_path/'chat.json');m.ensure_ready();return m

def test_sessions_resume_and_restart(memory):
 s=memory.session_action('create')['session_id']
 memory.append_turn('My project is Harbor','Tell me about Harbor',s,'t1')
 memory.session_action('rename',session_id=s,title='Harbor planning')
 restarted=SharedMemory(memory_path=memory.memory_path,transcript_path=memory.transcript_path)
 found=restarted.session_action('list',query='Harbor')['sessions']
 assert len(found)==1 and found[0]['count']==2 and found[0]['title']=='Harbor planning'
 assert restarted.session_action('resume',session_id=s)['messages'][0]['content']=='My project is Harbor'
 assert restarted.session_action('resume',session_id='missing')['status']=='not_found'
 assert list(memory.memory_path.parent.glob('backups/*pre_natural*'))

def test_session_scope_and_recent_budget(memory):
 s=memory.session_action('create',profile_id='owner')['session_id']
 memory.append_turn('a'*5000,'b'*5000,s,'t1',profile_id='owner')
 memory.append_turn('Latest question','Latest answer',s,'t2',profile_id='owner')
 assert not memory.session_action('list',profile_id='guest')['sessions']
 context=memory.recent_context(s,profile_id='owner')
 assert sum(len(x['content']) for x in context)<=12000
 assert [x['content'] for x in context[-2:]]==['Latest question','Latest answer']
 prompt=build_aegis_live_instruction(memory.transcript_path,recent_messages=context)
 assert 'Latest question' in prompt and 'Latest answer' in prompt
 assert not memory.recent_context(s,profile_id='guest')

def test_topic_evidence_restart_forget_restore(memory):
 saved=memory.save_fact('task_project_tracking','Harbor','A sample project',operation_id='fact')
 rid=saved['id']
 group=memory.topic_action('create',label='Harbor',category='task_project_tracking',member_ids=[rid])
 assert group['status']=='saved'
 tid=group['record_id']
 assert memory.topic_action('create',label='Harbor',category='task_project_tracking',member_ids=[rid])['status']=='duplicate'
 restarted=SharedMemory(memory_path=memory.memory_path,transcript_path=memory.transcript_path)
 assert restarted.topic_action('list')['topics'][0]['id']==tid
 assert restarted.memory_action('get',record_id=tid)['record']['related_ids']==[rid]
 assert restarted.topic_action('forget',topic_id=tid)['status']=='updated'
 assert not restarted.topic_action('list')['topics']
 assert restarted.topic_action('create',label='Harbor',category='task_project_tracking',member_ids=[rid])['status']=='rejected'
 assert restarted.topic_action('restore',topic_id=tid)['topic']['revision']==3
 assert restarted.topic_action('create',label='Missing',category='task_project_tracking',member_ids=['missing'])['status']=='rejected'

def test_topics_cannot_cross_profiles(memory):
 saved=memory.save_fact('personal_preferences','format','Use paragraphs',profile_id='owner')
 assert memory.topic_action('create',label='Writing',category='personal_preferences',member_ids=[saved['id']],profile_id='guest')['status']=='rejected'

def test_dpapi_fingerprint_enroll_restart_delete(tmp_path,monkeypatch):
 assert protect(protect(b'fixture'),True)==b'fixture'
 service=SpeakerRecognition(tmp_path/'profile.json')
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([1.,0.]))
 sample=base64.b64encode(b'x'*96000).decode()
 result=asyncio.run(service.enroll([sample]*3))
 assert result['enrolled'] and result['audio_retained'] is False
 serialized=service.path.read_text()
 assert sample not in serialized and 'vectors' not in serialized
 assert asyncio.run(service.classify(b'x'*64000))['state']=='matched'
 assert asyncio.run(service.classify(b'x'*32000))['state']=='matched'
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([0.,1.]))
 assert asyncio.run(service.classify(b'x'*64000))['state']=='unknown'
 restarted=SpeakerRecognition(service.path)
 assert restarted.status()['enrolled']
 assert restarted.setting(delete=True)['enrolled'] is False
 assert asyncio.run(restarted.classify(b'x'*64000))['state']=='disabled'
 service.pool.shutdown();restarted.pool.shutdown()

def test_speaker_unavailable_is_guest_safe(tmp_path,monkeypatch):
 service=SpeakerRecognition(tmp_path/'profile.json');assert service.setting(True)['status']=='rejected'
 assert asyncio.run(service.classify(b'x'*64000))['state']=='disabled'
 monkeypatch.setattr(service,'load_model',lambda:(_ for _ in ()).throw(RuntimeError('missing')))
 assert not asyncio.run(service.prepare())['model_ready']
 service.pool.shutdown()

def test_topic_merge_keeps_both_histories(memory):
 a=memory.save_fact('projects','one','First')['id'];b=memory.save_fact('projects','two','Second')['id']
 x=memory.topic_action('create',label='First',category='task_project_tracking',member_ids=[a])['record_id']
 y=memory.topic_action('create',label='Second',category='task_project_tracking',member_ids=[b])['record_id']
 result=memory.topic_action('merge',topic_id=x,merge_id=y)
 assert set(result['topic']['member_ids'])=={a,b}
 other=memory.load()['topic_groups'][y]
 assert other['state']=='superseded' and other['history'][-1]['state']=='active'
 assert other['revision']==2

def test_failed_session_write_preserves_original(memory,monkeypatch):
 import astra_ai.memory.conversation_sessions as module
 s=memory.session_action('create')['session_id'];original=memory.transcript_path.read_bytes()
 monkeypatch.setattr(module,'atomic',lambda *args:(_ for _ in ()).throw(OSError('disk fixture')))
 with pytest.raises(OSError):memory.session_action('rename',session_id=s,title='Not saved')
 assert memory.transcript_path.read_bytes()==original

def test_automatic_topic_creation_is_evidenced(memory):
 memory.save_fact('projects','sample_project','Harbor',session_id='s')
 memory.append_turn('Discuss the project','Discussing it','s','t')
 topics=memory.topic_action('list')['topics']
 assert len(topics)==1 and topics[0]['evidence_refs']
 memory.append_turn('Continue it','Continuing','s','t2')
 assert len(memory.topic_action('list')['topics'])==1

def test_owner_and_additional_speaker_profiles_are_distinct(tmp_path,monkeypatch):
 service=SpeakerRecognition(tmp_path/'voices.json')
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([1.,0.]) if pcm[0]==120 else np.array([0.,1.]))
 owner=base64.b64encode(b'x'*96000).decode();other=base64.b64encode(b'y'*96000).decode()
 assert asyncio.run(service.enroll([owner]*3))['profile_id']=='owner'
 assert asyncio.run(service.enroll([other]*3,profile_id='second',name='Other speaker'))['status']=='saved'
 assert asyncio.run(service.classify(b'x'*64000))['owner'] is True
 result=asyncio.run(service.classify(b'y'*64000));assert result['profile_id']=='second' and result['owner'] is False
 service.setting(delete=True,profile_id='second');assert len(service.status()['profiles'])==1
 service.pool.shutdown()


def test_legacy_history_resume_and_paginated_messages(memory):
 from astra_ai.memory.shared_memory import atomic
 data=read(memory.transcript_path,{})
 data['conversation']=[{'id':'legacy-user','role':'user','content':'Continue the harbor plan','timestamp':'2026-10-01T12:00:00Z','session_id':''},{'id':'legacy-ai','role':'assistant','content':'The next step is testing','timestamp':'2026-10-01T12:01:00Z'}]
 atomic(memory.transcript_path,data)
 assert memory.session_action('resume',session_id='legacy-history')['messages'][0]['id']=='legacy-user'
 assert memory.recent_context('legacy-history')[-1]['id']=='legacy-ai'
 result=memory.transcript_action('list',session_id='legacy-history',limit=1,offset=1)
 assert result['total']==2 and result['messages'][0]['id']=='legacy-ai'


def test_full_speech_match_uses_short_windows_as_corroboration(tmp_path,monkeypatch):
 service=SpeakerRecognition(tmp_path/'profile.json')
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([1.,0.]))
 sample=base64.b64encode(b'x'*96000).decode()
 assert asyncio.run(service.enroll([sample]*3))['status']=='saved'
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([1.,0.]) if len(pcm)>48000 else np.array([.78,(1-.78**2)**.5]))
 assert asyncio.run(service.classify(b'x'*96000))['state']=='matched'
 monkeypatch.setattr(service,'embedding',lambda pcm:np.array([1.,0.]) if len(pcm)>48000 else np.array([0.,1.]))
 assert asyncio.run(service.classify(b'x'*96000))['state']=='uncertain'
 service.pool.shutdown()


def test_existing_profile_threshold_matches_its_own_enrollment_evidence(tmp_path,monkeypatch):
 from astra_ai.ui.backend.speaker_recognition import calibrated_threshold
 vectors=[np.array([1.,0.,0.]),np.array([.72,(1-.72**2)**.5,0.]),np.array([.72,.27,(1-.72**2-.27**2)**.5])]
 threshold=calibrated_threshold(vectors)
 assert all(float(np.median([np.dot(a,b) for b in vectors]))>=threshold for a in vectors)
 service=SpeakerRecognition(tmp_path/'old-profile.json')
 from astra_ai.memory.shared_memory import atomic
 saved=base64.b64encode(protect(json.dumps({'vectors':[v.tolist() for v in vectors],'threshold':.82}).encode())).decode()
 atomic(service.path,{'enabled':True,'fingerprint':saved})
 before=service.path.read_bytes()
 for v in vectors:
  monkeypatch.setattr(service,'embedding',lambda pcm,v=v:v)
  result=asyncio.run(service.classify(b'x'*64000))
  assert result['state']=='matched' and result['owner']
 assert service.path.read_bytes()==before
 service.pool.shutdown()
