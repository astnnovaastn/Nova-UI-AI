import asyncio,copy,json
import pytest
from pathlib import Path
from astra_ai.memory.shared_memory import SharedMemory,now
from astra_ai.memory import library
from astra_ai.ui.backend.action_jobs import ActionJobs
from astra_ai.ui.backend.task_backend.store import TaskStore
from astra_ai.ui.backend.library_api import LibraryService
from astra_ai.ui.backend.notices import Notices
from astra_ai.ui.backend.presence import PresenceTracker
from astra_ai.core.research_learning import ResearchLearning
from astra_ai.core.background_budget import BudgetPaused

@pytest.fixture
def memory(tmp_path):
 m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'history.json');m.ensure_ready();return m

def test_membership_counts_descendants_aliases_and_original_ids(memory):
 rid=memory.save_fact('user_identity','fixture_identity','Fixture User')['id']
 root=memory.category_action('create',label='Fixture collection',source_refs=[{'record_id':rid}])['id']
 child=memory.category_action('create',label='Fixture descendant',parent_id=root,source_refs=[{'record_id':rid}])['id']
 memory.append_turn('Fixture question','Fixture answer','session','turn')
 rows=library.categories(memory)['categories'];count=next(r['count'] for r in rows if r['id']==root)
 assert count==library.page(memory,category=root)['total']==1
 assert library.page(memory,category=child)['matches'][0]['id']==rid
 assert memory.load()['records'][rid]['category']=='user_identity'
 assert {r['attributes']['speaker'] for r in library.page(memory)['matches'] if r.get('source')=='conversation'}=={'user','assistant'}

def test_unlimited_categories_paged_and_palette_preserves_ids(memory):
 rid=memory.save_fact('knowledge_expertise','fixture_source','Fixture evidence')['id'];before=copy.deepcopy(memory.load()['records'])
 for i in range(135):assert memory.category_action('create',label='Fixture group '+str(i),source_refs=[{'record_id':rid}],color_family='yellow' if i%2 else 'deep_blue')['status']=='created'
 first=library.categories(memory,limit=100);second=library.categories(memory,offset=100,limit=100)
 assert first['total']==162 and len(first['categories'])==100 and len(second['categories'])==62
 assert not ({r['id'] for r in first['categories']}&{r['id'] for r in second['categories']})
 assert memory.load()['records']==before

def test_private_forgotten_expired_and_scope_counts_match_pages(memory):
 one=memory.save_fact('knowledge_expertise','fixture_a','Visible fixture')['id']
 other=memory.save_fact('knowledge_expertise','fixture_b','Other fixture',profile_id='other')['id']
 memory.save_fact('knowledge_expertise','fixture_expired','Expired fixture',valid_until='2020-01-01T00:00:00Z')
 with memory._lock:
  m=memory.load();m['records'][one]['private']=True;memory._commit(m)
 assert library.page(memory,category='knowledge_expertise')['total']==0
 assert library.page(memory,profile='other',category='knowledge_expertise')['total']==1
 memory.forget(other)
 assert library.page(memory,profile='other',state='forgotten')['matches'][0]['id']==other

def pending(memory):
 with memory._lock:
  m=memory.load();m['pending_approvals']['fixture-approval']={'id':'fixture-approval','created':now(),'reason':'uncertain','record':{'id':'fixture-record','kind':'fact','category':'user_identity','key':'fixture_pending','value':'Fixture value','scope':'default','profile_id':'','project_id':'','confidence':.5,'source':'human','evidence':'Fixture value','created':now()}};memory._commit(m)
 return library.memory_approvals(memory)[0]

def test_approval_stale_rejection_history_and_repeat(memory):
 p=pending(memory)
 assert library.decide(memory,p['source_id'],False,'stale')['status']=='conflict'
 assert library.decide(memory,p['source_id'],False,p['version'])['status']=='rejected'
 result=library.memory_approvals(memory)[0];assert result['state']=='rejected' and result['decided']
 assert library.decide(memory,p['source_id'],False,p['version'])['status']=='not_found'

def test_contextual_voice_confirmation_requires_prior_explanation(memory,tmp_path):
 async def execute(*args):return {'status':'ok'}
 async def notify(*args):pass
 jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:True,['recall_memory']);tasks=TaskStore(tmp_path/'tasks');tasks.initialize()
 service=LibraryService(memory,jobs,tasks,lambda:None,lambda:None,lambda:None)
 p=pending(memory);c={'client_id':'fixture-client','profile_id':'','project_id':'','turn_id':'turn','user_text':'Please reject the proposal you explained.'};args={'decision':'rejected','version':p['version'],'confirmation_quote':c['user_text']}
 assert asyncio.run(service.decision(p['id'],args,c,True))['status']=='rejected' # no prior explanation
 service.detail('approvals',p['id'],c)
 assert asyncio.run(service.decision(p['id'],{**args,'confirmation_quote':'made up'},c,True))['reason']=='contextual_user_confirmation_required'
 assert asyncio.run(service.decision(p['id'],args,c,True))['status']=='rejected'
 assert memory.load()['approval_history']['fixture-approval']['state']=='rejected'

def test_task_views_delegate_and_preserve_completed_work(memory,tmp_path):
 async def execute(*args):return {'status':'ok'}
 async def notify(*args):pass
 jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:True,['recall_memory']);tasks=TaskStore(tmp_path/'tasks');tasks.initialize()
 c={'client_id':'fixture','profile_id':'','project_id':''};jid=jobs.submit([{'name':'recall_memory'}],c,'once')['job_id'];service=LibraryService(memory,jobs,tasks,lambda:None,lambda:None,lambda:None)
 assert asyncio.run(service.control('job:'+jid,'pause',c))['status']=='paused'
 assert service.detail('tasks','job:'+jid,c)['item']['state']=='paused'
 assert asyncio.run(service.control('job:'+jid,'resume',c))['status']=='resumed'
 task=tasks.create_task('local',{'title':'Fixture','instruction':'Fixture work','kind':'research','priority':'normal','timezone':'Europe/Madrid','trigger':{'kind':'manual'}})
 run=tasks.create_run('local',task['id'],'high');tasks.transition_run('local',run['id'],'running');approval=tasks.request_approval('local',run['id'],'Fixture action','high')
 row=service.detail('approvals','task:'+approval['id'],c)['item']
 assert asyncio.run(service.decision(row['id'],{'decision':'rejected','version':row['version']},c))['status']=='rejected'
 assert service.listing('approvals',c,status='rejected')['total']==1

def test_notice_dedup_delivery_scope_and_restart(tmp_path):
 c={'client_id':'fixture','profile_id':'owner','project_id':''};store=Notices(tmp_path/'notices.json')
 identifier=store.enqueue('job','one','completed','Fixture result',c)
 assert store.enqueue('job','one','completed','Fixture result',c)==identifier
 assert not store.listing({'profile_id':'other'})
 assert store.acknowledge(identifier,c)['status']=='rejected'
 store.change(identifier,c,'offered',offered_to='fixture');assert store.acknowledge(identifier,c)['status']=='ok'
 assert Notices(tmp_path/'notices.json').get(identifier,c)['state']=='delivered'

def test_presence_requires_consecutive_frames_and_never_identifies():
 tracker=PresenceTracker();assert tracker.status()=='unknown'
 assert tracker.observe(True)=='unknown';assert tracker.observe(True)=='present'
 tracker.observe(False);tracker.observe(False);assert tracker.observe(False)=='absent'
 assert tracker.observe(None)=='unknown'

def test_fanout_checkpoints_survive_quota_and_avoid_repeat_search(memory,tmp_path):
 async def execute(*args):return {'status':'ok'}
 async def notify(*args):pass
 jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:True,['research_action']);calls=[];paused=True
 async def search(q):
  nonlocal paused
  calls.append(q)
  if q=='Second question' and paused:paused=False;raise BudgetPaused(0,'fixture_quota')
  return {'status':'completed','results':[{'title':'Fixture docs','url':'https://example.org/'+q.replace(' ','-'),'content':'Fixture findings'}]}
 research=ResearchLearning(tmp_path/'learned',memory,jobs,search);research.initialize();c={'profile_id':'','project_id':''}
 item=research.request('Fixture question',c,'one',subquestions=['First question','Second question','First question'])
 assert asyncio.run(research.run(item['research_id'],c))['status']=='waiting_for_quota'
 assert asyncio.run(research.run(item['research_id'],c))['status']=='completed'
 assert calls.count('First question')==1 and calls.count('Second question')==2
 assert research.request('Fixture question',c,'one',subquestions=['First question','Second question'])['cached']
 assert research.request('Fixture question',c,'bad',subquestions=['a']*5)['status']=='rejected'

def test_library_collections_have_no_127_ceiling(memory):
 from astra_ai.memory.globe_topics import topics,MAX_AUTO_TOPICS
 records={f'r{i}':{'id':f'r{i}','kind':'activity','content':' '.join('term'+word for word in ['alpha','bravo','charlie','delta','echo','foxtrot'])} for i in range(40)}
 # Stored supported collections are not truncated by display limits.
 stored={f't{i}':{'state':'active','label':f'Fixture collection {i}','member_ids':['r0','r1']} for i in range(160)}
 assert len(topics(records,stored,limit=None))>=160

def test_notice_default_scope_is_not_shared_with_other_profiles(tmp_path):
 store=Notices(tmp_path/'notices.json');store.enqueue('task','fixture','1','Fixture result',{})
 assert not store.listing({'profile_id':'other'})
 assert not store.listing({'guest':True})

def test_relationship_decision_history_respects_scope_and_forgetting(memory):
 a=memory.save_fact('notes','fixture_one','Fixture one',profile_id='owner')['id']
 b=memory.save_fact('notes','fixture_two','Fixture two',profile_id='owner')['id']
 with memory._lock:
  data=memory.load();data['pending_approvals']['relation-review']={'kind':'relationship','relationship':{'from':a,'to':b,'type':'related_to','evidence':'Fixture evidence'}};memory._commit(data)
 approval=library.memory_approvals(memory,profile='owner')[0]
 assert library.decide(memory,'relation-review',False,approval['version'],profile='owner')['status']=='rejected'
 assert not library.memory_approvals(memory,profile='other')
 assert len(library.memory_approvals(memory,profile='owner'))==1
 memory.forget(a)
 assert not library.memory_approvals(memory,profile='owner')

def test_optional_camera_uses_selected_model_and_respects_shared_pacing(tmp_path,monkeypatch):
 from astra_ai.ui.backend.camera_access import CameraAccess
 from astra_ai.ui.backend.aegis_runtime import MODEL_STATUS
 from astra_ai.core.background_budget import BackgroundBudget
 monkeypatch.setitem(MODEL_STATUS,'text',{'verified':True,'effective':'fixture-model'})
 calls=[]
 async def generate(model,image,mime,prompt):
  calls.append((model,mime));return 'Fixture image result'
 access=CameraAccess(lambda:'fixture-key',lambda:budget,generate)
 budget=BackgroundBudget(tmp_path/'budget.json')
 assert asyncio.run(access.inspect('fake'))['status']=='unavailable'
 assert asyncio.run(access.verify())['status']=='ok'
 import base64
 assert asyncio.run(access.inspect(base64.b64encode(bytes([255,216])+b'fixture').decode()))['status']=='quota_paused'
 assert calls==[('fixture-model','image/png')]
 assert asyncio.run(access.inspect('invalid'))['status']=='rejected'

def test_presence_worker_without_optional_environment_fails_closed(monkeypatch,tmp_path):
 from astra_ai.ui.backend.presence import PresenceWorker
 monkeypatch.setenv('NOVA_PRESENCE_PYTHON',str(tmp_path/'missing.exe'))
 worker=PresenceWorker()
 assert asyncio.run(worker.detect('fake')) is None
 assert worker.reason=='optional_detector_not_installed'

def test_installed_presence_worker_decodes_without_retaining_frames(monkeypatch):
 import os,base64
 from astra_ai.ui.backend.presence import PresenceWorker
 optional=os.environ.get('NOVA_TEST_PRESENCE_PYTHON')
 if not optional or not Path(optional).exists():pytest.skip('Separate optional decoder environment unavailable')
 monkeypatch.setenv('NOVA_PRESENCE_PYTHON',optional)
 import subprocess
 fixture=subprocess.check_output([optional,'-I','-c',"import cv2,numpy as np,base64;print(base64.b64encode(cv2.imencode('.jpg',np.zeros((96,128,3),dtype=np.uint8))[1]).decode())"],env={k:v for k,v in os.environ.items() if k.upper() in {'SYSTEMROOT','WINDIR','TEMP','TMP'}}).decode().strip()
 async def run():
  worker=PresenceWorker()
  try:
   result=await worker.detect(fixture)
   assert result is False,worker.reason
   assert worker.limits is not None
   worker.last=0
   assert await worker.detect('not an image') is None
  finally:await worker.close()
  assert worker.process is None and worker.limits is None
 asyncio.run(run())

def test_stale_approval_notice_releases_presence_and_cannot_speak(memory,tmp_path,monkeypatch):
 from types import SimpleNamespace
 from astra_ai.ui.backend import server
 store=Notices(tmp_path/'notices.json');c={'client_id':'fixture-client','profile_id':'','project_id':''}
 identifier=store.enqueue('approval','memory:fixture','v1','Fixture approval',c);store.change(identifier,c,'awaiting_presence')
 spoken=[];closed=[]
 async def send(*args):pass
 async def review(item):spoken.append(item)
 async def close():closed.append(True)
 live=SimpleNamespace(guest=False,profile_id='',project_id='',session_id='',_speech_active=False,_audio_started=False,_response_pending=False,_input_parts=[],_text_suspended=False,review_notice=review)
 monkeypatch.setattr(server.state,'live_sessions',{'fixture-socket':live})
 monkeypatch.setattr(server.ws_manager,'client_id',lambda _:c['client_id'])
 monkeypatch.setattr(server.ws_manager,'send_to_client',send)
 monkeypatch.setattr(server,'notice_store',store)
 monkeypatch.setattr(server,'get_library_service',lambda:SimpleNamespace(approvals=lambda _:[],work=lambda _:[]))
 monkeypatch.setattr(server,'presence_purposes',{c['client_id']:{'notice_id':identifier}})
 tracker=PresenceTracker();tracker.observe(True);tracker.observe(True)
 monkeypatch.setattr(server,'presence_trackers',{c['client_id']:tracker})
 monkeypatch.setattr(server,'presence_worker',SimpleNamespace(close=close))
 asyncio.run(server.check_operation_notices('fixture-socket'))
 assert store.get(identifier,c)['state']=='dismissed'
 assert not spoken and closed and not server.presence_purposes

def test_library_api_rejects_unknown_connections_and_scope_spoofing(memory,tmp_path,monkeypatch):
 from fastapi import FastAPI
 from fastapi.testclient import TestClient
 from astra_ai.ui.backend import server
 from astra_ai.ui.backend.library_api import install
 monkeypatch.setattr(server.state,'live_memory',memory)
 monkeypatch.setattr(server.state,'live_sessions',{})
 monkeypatch.setattr(server.ws_manager,'websocket_for',lambda client:'fixture-socket' if client=='fixture-client' else None)
 async def noop(*args):pass
 jobs=ActionJobs(tmp_path/'jobs.json',noop,noop,lambda _:True,['recall_memory']);tasks=TaskStore(tmp_path/'tasks');tasks.initialize()
 service=LibraryService(memory,jobs,tasks,lambda:None,lambda:None,lambda:None)
 app=FastAPI();install(app,lambda:service,server._learning_context)
 with TestClient(app) as client:
  assert client.get('/api/memory/library/categories').status_code==403
  assert client.get('/api/memory/library/categories?profile_id=other',headers={'X-Nova-Client':'fixture-client'}).status_code==403
  assert client.get('/api/memory/library/categories',headers={'X-Nova-Client':'fixture-client'}).status_code==200
