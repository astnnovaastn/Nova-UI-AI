import asyncio
from astra_ai.ui.backend.action_jobs import ActionJobs

def test_requested_research_deadline_allows_bounded_synthesis_without_extending_other_actions(tmp_path,monkeypatch):
    async def run():
        deadlines=[];original=asyncio.wait_for
        async def measured(awaitable,timeout):
            deadlines.append(timeout)
            return await original(awaitable,timeout)
        monkeypatch.setattr(asyncio,'wait_for',measured)
        async def execute(*args):return {'status':'completed'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'deadlines.json',execute,notify,lambda _:True,{'search_web','recall_memory'})
        for name,context in [('search_web',{'requested_research':True}),('search_web',{}),('recall_memory',{'requested_research':True})]:
            jid=jobs.submit([{'name':name}],context)['job_id'];job=jobs.list(jid)['job']
            await jobs.execute(job,0,job['actions'][0])
            assert jobs.list(jid)['job']['state']=='completed'
        assert deadlines==[300,60,60]
    asyncio.run(run())

def test_transient_retry_completed_dedup_and_mute_independence(tmp_path):
    async def run():
        calls=[]
        async def execute(name,args,ctx,op):
            calls.append(op)
            return {'status':'failed','retryable':True,'retry_after_seconds':0} if len(calls)<3 else {'status':'ok'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:False,['recall_memory'])
        jid=jobs.submit([{'name':'recall_memory'}],{'client_id':'muted'},'same')['job_id'];await jobs.start()
        for _ in range(50):
            if jobs.list(jid)['job']['state']=='completed':break
            await asyncio.sleep(.03)
        await jobs.stop();assert len(calls)==3 and len(set(calls))==1
        assert jobs.list(jid)['job']['actions'][0]['acknowledged']
        await jobs.start();await asyncio.sleep(.2);await jobs.stop();assert len(calls)==3
    asyncio.run(run())

def test_twenty_jobs_are_bounded_and_writes_serialized(tmp_path):
    async def run():
        active=0;peak=0;writes=0;peak_writes=0;calls=0
        async def execute(name,args,ctx,op):
            nonlocal active,peak,writes,peak_writes,calls
            active+=1;peak=max(active,peak)
            if name=='save_memory':writes+=1;peak_writes=max(writes,peak_writes)
            await asyncio.sleep(.01)
            if name=='save_memory':writes-=1
            active-=1;calls+=1;return {'status':'saved'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:True,['recall_memory','save_memory'])
        ids=[jobs.submit([{'name':'save_memory' if i%3==0 else 'recall_memory'}],{},str(i))['job_id'] for i in range(20)]
        await jobs.start()
        for _ in range(100):
            if all(jobs.list(j)['job']['state']=='completed' for j in ids):break
            await asyncio.sleep(.03)
        await jobs.stop();assert calls==20;assert peak<=4;assert peak_writes==1
    asyncio.run(run())
