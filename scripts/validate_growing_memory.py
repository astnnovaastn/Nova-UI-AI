"""Temporary-data workload and native isolation validation; never calls model/search providers."""
import asyncio, json, sys, tempfile, time, statistics, importlib.util
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.ui.backend.action_jobs import ActionJobs
from astra_ai.core.learned_capabilities import LearnedCapabilities
from astra_ai.core.sandbox_worker import SandboxWorker

async def main():
 report={};delays=[];running=True;active=0;peak=0;calls=0
 async def heartbeat():
  while running:
   start=time.perf_counter();await asyncio.sleep(.01);delays.append(max(0,(time.perf_counter()-start-.01)*1000))
 with tempfile.TemporaryDirectory(prefix='nova-learning-validation-') as temporary:
  root=Path(temporary).resolve();assert root.is_relative_to(Path(tempfile.gettempdir()).resolve())
  memory=SharedMemory(memory_path=root/'memory.json',transcript_path=root/'history.json');memory.ensure_ready()
  async def execute(name,args,context,operation):
   nonlocal active,peak,calls
   active+=1;peak=max(peak,active);await asyncio.sleep(.05);active-=1;calls+=1;return {'status':'completed'}
  async def quiet(*args):pass
  jobs=ActionJobs(root/'jobs.json',execute,quiet,lambda _:False,['recall_memory'])
  ids=[jobs.submit([{'name':'recall_memory'}],{},str(i))['job_id'] for i in range(20)]
  beat=asyncio.create_task(heartbeat());start=time.perf_counter();await jobs.start()
  while any(jobs.list(jid)['job']['state']!='completed' for jid in ids):
   if time.perf_counter()-start>15:raise RuntimeError('Workload timed out')
   await asyncio.sleep(.02)
  report['jobs']={'admitted':20,'completed':calls,'peak_operations':peak,'elapsed_ms':round((time.perf_counter()-start)*1000,1)}
  await jobs.stop();worker=SandboxWorker();start=time.perf_counter();isolation=await asyncio.to_thread(worker.verify)
  report['isolation']={**isolation,'probe_ms':round((time.perf_counter()-start)*1000,1)}
  if not isolation['verified']:raise RuntimeError('Isolation failed closed')
  async def broker(*args):raise RuntimeError('No capabilities requested by pure fixture')
  caps=LearnedCapabilities(root/'learned',root,memory,jobs,broker,sandbox=worker);caps.initialize()
  staged=caps.stage('increment','Temporary native test','def run(value):\n    return value + 1',[{'input':4,'expected':5}],[],{})
  start=time.perf_counter();activation=await caps.validate(staged['tool_id'],{});result=await caps.invoke(staged['tool_id'],4,{},'native-test')
  assert activation['status']=='activated' and result['result']==5
  duplicate=await caps.invoke(staged['tool_id'],4,{},'native-test');assert duplicate==result
  report['native_tool']={'activation':activation['status'],'result':result['result'],'deduplicated':duplicate==result,'validate_invoke_ms':round((time.perf_counter()-start)*1000,1)}
  target=root/'astra_ai/ui/fixture.py';target.parent.mkdir(parents=True);target.write_text('def adjust(value):\n    return value - 1\n')
  tests=root/'tests';tests.mkdir();(tests/'test_fixture.py').write_text('from astra_ai.ui.fixture import adjust\ndef test_regression():\n    assert adjust(3) == 4\n')
  repair=caps.stage_repair('astra_ai/ui/fixture.py','adjust','def adjust(value):\n    return value + 1',[{'input':3,'expected':4}],{})
  start=time.perf_counter();applied=await caps.apply_repair(repair['repair_id'],{});assert applied['status']=='applied';rolled=caps.rollback(repair['repair_id'],{});assert rolled['status']=='rolled_back'
  report['native_repair']={'applied':True,'rollback':True,'regressions':applied['regression_count'],'elapsed_ms':round((time.perf_counter()-start)*1000,1)}
  running=False;await beat
  report['event_loop_delay_ms']={'samples':len(delays),'p95':round(sorted(delays)[int(len(delays)*.95)],2),'max':round(max(delays),2),'mean':round(statistics.mean(delays),2)}
  if importlib.util.find_spec('psutil'):
   import psutil
   process=psutil.Process();report['resource_usage']={'parent_rss_mb':round(process.memory_info().rss/1024**2,1),'cpu_seconds':round(sum(process.cpu_times()[:2]),2),'worker_limit_mb':256,'worker_cpu_cap_percent':10}
  else:
   import ctypes as c
   from ctypes import wintypes as w
   class Counters(c.Structure):
    _fields_=[('cb',w.DWORD),('faults',w.DWORD),('peak_rss',c.c_size_t),('rss',c.c_size_t),('peak_paged',c.c_size_t),('paged',c.c_size_t),('peak_nonpaged',c.c_size_t),('nonpaged',c.c_size_t),('pagefile',c.c_size_t),('peak_pagefile',c.c_size_t)]
   kernel=c.WinDLL('kernel32');kernel.GetCurrentProcess.restype=w.HANDLE;handle=kernel.GetCurrentProcess()
   counters=Counters();counters.cb=c.sizeof(counters);meter=c.WinDLL('psapi').GetProcessMemoryInfo;meter.argtypes=[w.HANDLE,c.POINTER(Counters),w.DWORD];meter(handle,c.byref(counters),c.sizeof(counters))
   report['resource_usage']={'parent_rss_mb':round(counters.rss/1024**2,1),'parent_peak_rss_mb':round(counters.peak_rss/1024**2,1),'worker_limit_mb':256,'worker_cpu_cap_percent':10}

 Path('artifacts').mkdir(exist_ok=True);Path('artifacts/growing-memory-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
if __name__=='__main__':asyncio.run(main())
