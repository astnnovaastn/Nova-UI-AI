import asyncio, json, sys, types
from pathlib import Path
import pytest
from astra_ai.ui.backend.action_jobs import ActionJobs
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.core.learned_capabilities import LearnedCapabilities
from astra_ai.core.research_learning import ResearchLearning
from astra_ai.ui.backend.aegis_runtime import unavailable

class Sandbox:
 verified=True
 def status(self):return {'verified':True}
 def verify(self):return self.status()
 def run(self,code,value):
  try:
   scope={};exec(code,scope);return {'status':'ok','result':scope['run'](value)}
  except Exception:return {'status':'failed'}

def memory(tmp_path):
 m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcripts.json');m.ensure_ready();return m

async def quiet(*args):pass

def test_scope_and_offline_learning(tmp_path):
 async def run():
  calls=[]
  async def execute(name,args,context,op):calls.append(name);return {'status':'completed'}
  jobs=ActionJobs(tmp_path/'jobs.json',execute,quiet,lambda _:False,['research_action','capability_action'])
  context={'session_id':'same','client_id':'owner','profile_id':'owner'}
  jid=jobs.submit([{'name':'research_action','arguments':{'action':'run'}}],context,'research')['job_id']
  assert jobs.list(jid,{'guest':True})['status']=='not_found'
  await jobs.attach('guest','same',{'guest':True})
  assert jobs.list(jid)['job']['context']['client_id']=='owner'
  await jobs.start()
  for _ in range(50):
   if jobs.list(jid)['job']['state']=='completed':break
   await asyncio.sleep(.02)
  await jobs.stop();assert calls==['research_action']
 asyncio.run(run())

def test_uncertain_write_is_never_replayed(tmp_path):
 async def run():
  calls=[]
  async def execute(*args):calls.append(1);raise TimeoutError()
  jobs=ActionJobs(tmp_path/'jobs.json',execute,quiet,lambda _:True,['save_memory'])
  jid=jobs.submit([{'name':'save_memory'}],{},'write')['job_id'];await jobs.start()
  for _ in range(50):
   if jobs.list(jid)['job']['state']=='failed':break
   await asyncio.sleep(.02)
  await jobs.stop();assert jobs.list(jid)['job']['actions'][0]['state']=='uncertain'
  await jobs.start();await asyncio.sleep(.2);await jobs.stop();assert len(calls)==1
  assert jobs.retry(jid)['status']=='unchanged'
 asyncio.run(run())

def test_forgotten_category_sources_are_suppressed(tmp_path):
 m=memory(tmp_path);rid=m.save_fact('notes','fixture','Fixture source')['id']
 cid=m.category_action('create',label='Fixture collection',source_refs=[{'record_id':rid}])['id']
 m.forget(rid);assert m.category_action('resolve',category_id=cid)['status']=='not_found'
 assert cid not in {c['id'] for c in m.category_action('list',limit=100)['categories']}
 m.memory_action('restore',record_id=rid);assert m.category_action('resolve',category_id=cid)['status']=='ok'

def test_repair_updates_imported_function_and_rolls_back(tmp_path):
 async def run():
  m=memory(tmp_path);target=tmp_path/'astra_ai/ui/fixture.py';target.parent.mkdir(parents=True);target.write_text('def adjust(value):\n return value-1\n')
  td=tmp_path/'tests';td.mkdir();(td/'test_fixture.py').write_text('from astra_ai.ui.fixture import adjust\ndef test_it():\n assert adjust(4)==5\n')
  module=types.ModuleType('astra_ai.ui.fixture');exec(target.read_text(),module.__dict__);sys.modules[module.__name__]=module;imported=module.adjust
  caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,None,sandbox=Sandbox());caps.initialize()
  staged=caps.stage_repair('astra_ai/ui/fixture.py','adjust','def adjust(value):\n return value+1',[{'input':4,'expected':5}],{})
  try:
   assert (await caps.apply_repair(staged['repair_id'],{}))['status']=='applied';assert imported(4)==5
   assert caps.rollback(staged['repair_id'],{})['status']=='rolled_back';assert imported(4)==3
  finally:sys.modules.pop(module.__name__,None)
 asyncio.run(run())

def test_repairs_cannot_access_module_globals_or_file_methods(tmp_path):
 m=memory(tmp_path);target=tmp_path/'astra_ai/ui/fixture.py';target.parent.mkdir(parents=True);target.write_text('def adjust(value):\n return value+1')
 caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,None,sandbox=Sandbox())
 for code in ['def adjust(value):\n return dangerous(value)','def adjust(value):\n return value.unlink()']:
  assert caps.stage_repair('astra_ai/ui/fixture.py','adjust',code,[{'input':1,'expected':2}],{})['status']=='rejected'

def test_research_cancellation_before_commit(tmp_path):
 async def run():
  m=memory(tmp_path);jobs=ActionJobs(tmp_path/'jobs.json',quiet,quiet,lambda _:True,['research_action']);started=asyncio.Event();release=asyncio.Event()
  async def search(query):
   started.set();await release.wait();return {'status':'completed','results':[{'url':'https://example.org','content':'Fixture science'}]}
  research=ResearchLearning(tmp_path/'learned',m,jobs,search);research.initialize();request=research.request('Fixture science',{},'op')
  task=asyncio.create_task(research.run(request['research_id'],{}));await started.wait();jobs.cancel(request['job_id']);release.set();result=await task
  assert result['reason']=='task_canceled';assert not m.load().get('research_index');assert not list((tmp_path/'learned').rglob('*.md'))
 asyncio.run(run())

def test_gemini_project_quota_does_not_trigger_model_fallback():
 assert not unavailable(Exception('429 RESOURCE_EXHAUSTED project quota'))
 assert unavailable(Exception('404 model not found'))


def test_broker_cannot_expand_file_or_destructive_authorization(tmp_path):
 async def run():
  m=memory(tmp_path);calls=[]
  async def broker(*args):calls.append(args);return {'status':'completed'}
  caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,broker,sandbox=Sandbox());caps.initialize()
  for name,args in [('read_file',{'path':'unrequested'}),('delete_file',{'file_id':'different'})]:
   output={'actions':[{'name':name,'arguments':args}]};code='def run(value):\n return '+repr(output)
   staged=caps.stage(name,'Fixture',code,[{'input':{},'expected':output}],[name],{})
   if name=='delete_file':caps.approve(staged['tool_id'],caps.get(staged['tool_id'],{})['item']['hash'],{})
   await caps.validate(staged['tool_id'],{})
   ctx={'user_text':'Requested fixture','authorized_capabilities':['delete_file'],'authorized_operations':{'delete_file':{'file_id':'original'}}}
   result=await caps.invoke(staged['tool_id'],{},ctx,name)
   assert result['status']=='rejected'
  assert not calls
 asyncio.run(run())


def test_generated_run_input_is_accepted_but_interactive_input_is_not(tmp_path):
 from astra_ai.core.learned_capabilities import validate_code
 validate_code('def run(input):\n return input+1')
 with pytest.raises(ValueError):validate_code('def run(value):\n return input()')
 async def run():
  class Model:
   def structured(self,*args):return {'name':'increment','description':'Fixture','code':'def run(input):\n return input+1','tests':[{'input_json':'4','expected_json':'5'}],'capabilities':[]}
  caps=LearnedCapabilities(tmp_path/'learned',tmp_path,memory(tmp_path),None,None,model=Model(),sandbox=Sandbox());caps.initialize()
  assert (await caps.learn('Increment',{}))['status']=='activated'
 asyncio.run(run())


def test_learned_development_has_one_correction_and_caches_success(tmp_path):
 async def run():
  class Model:
   calls=0
   def structured(self,*args):
    self.calls+=1
    return {'name':'increment','description':'Fixture','code':'def run(value):\n return value'+('-1' if self.calls==1 else '+1'),'tests':[{'input_json':'4','expected_json':'5'}],'capabilities':[]}
  model=Model();caps=LearnedCapabilities(tmp_path/'learned',tmp_path,memory(tmp_path),None,None,model=model,sandbox=Sandbox());caps.initialize()
  assert (await caps.learn('Increment',{}))['status']=='waiting_for_retry'
  assert (await caps.learn('Increment',{}))['status']=='activated'
  assert (await caps.learn('Increment',{}))['cached'];assert model.calls==2
 asyncio.run(run())
