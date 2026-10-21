import asyncio
from types import SimpleNamespace
from astra_ai.core.research_learning import ResearchArtifacts, ResearchSearch
from astra_ai.core.action_jobs import ActionJobs, result_value

CTX={'profile_id':'owner','project_id':'alpha','session_id':'conversation'}

def test_full_research_to_note_is_scoped_verified_and_deduplicated(tmp_path):
    artifacts=ResearchArtifacts(tmp_path/'research.json')
    calls=[]
    class Transport:
        def post(self,url,**kwargs):
            calls.append(kwargs)
            return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{'title':'Official docs','url':'https://example.org/docs','raw_content':'Evidence paragraph. '*2000}]})
    service=ResearchSearch(artifacts,lambda key:'fixture',Transport())
    result=asyncio.run(service.search({'query':'Detailed topic','mode':'detailed'},CTX,'requested-search'))
    assert result['characters']>20000 and len(result['summary'])<2000
    assert len(calls)==1 and calls[0]['json']['search_depth']=='advanced'
    again=asyncio.run(service.search({'query':'Detailed topic','mode':'detailed'},CTX,'requested-search'))
    assert again==result and len(calls)==1
    assert artifacts.get(result['research_id'],{**CTX,'profile_id':'guest'})['status']=='not_found'
    class Notes:
        rows={}
        def add_note(self,content,category):
            note={'id':'note-1','content':content};self.rows[note['id']]=note;return note
        def get_note_by_id(self,key):return self.rows.get(key)
        def get_notes_state(self):return {'notes':list(self.rows.values())}
    notes=Notes()
    saved=artifacts.import_note(result['research_id'],result['research_revision'],CTX,'write-note',notes)
    assert saved['verified'] and len(notes.rows['note-1']['content'])>20000
    assert artifacts.import_note(result['research_id'],result['research_revision'],CTX,'write-note',notes)['duplicate']
    assert artifacts.import_note(result['research_id'],'stale',CTX,'other',notes)['status']=='conflict'
    assert artifacts.page(result['research_id'],CTX,offset=20000)['content']

def test_partial_fanout_retains_sources_and_reports_quota(tmp_path):
    class Transport:
        def post(self,url,**kwargs):
            if kwargs['json']['query']=='limits':return SimpleNamespace(status_code=429,headers={'Retry-After':'60'})
            return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{'url':'https://example.org/source','content':'Supported finding'}]})
    artifacts=ResearchArtifacts(tmp_path/'r.json');service=ResearchSearch(artifacts,lambda key:'fixture',Transport())
    result=asyncio.run(service.search({'query':'topic','mode':'detailed','subquestions':['limits','topic']},CTX,'partial'))
    assert result['completeness']=='partial' and result['failures'][0]['http_status']==429 and len(result['results'])==1

def test_result_refs_feed_only_structured_prior_results(tmp_path):
    async def scenario():
        executed=[]
        async def execute(name,args,context,operation_id):
            executed.append((name,args));return {'status':'completed','research_id':'r1','revision':'v1'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda c:True,{'search_web','notes_action'})
        actions=[{'name':'search_web','arguments':{'query':'topic'}},{'name':'notes_action','arguments':{'action':'import_research'},'result_refs':{'research_id':{'action_index':0,'result_path':'/research_id'}}}]
        queued=jobs.submit(actions,CTX,'op','Research and save');job=jobs.list(queued['job_id'],CTX)['job']
        assert job['actions'][1]['depends_on']==[0]
        await jobs.execute(job,0,job['actions'][0]);await jobs.execute(job,1,job['actions'][1])
        assert executed[1][1]['research_id']=='r1'
        assert jobs.submit(actions,CTX,'op')['status']=='duplicate'
        bad=[actions[0],{**actions[1],'result_refs':{'profile_id':{'action_index':0,'result_path':'/research_id'}}}]
        assert jobs.submit(bad,CTX,'bad')['status']=='rejected'
    asyncio.run(scenario())

def test_json_pointer_does_not_evaluate_expressions():
    import pytest
    assert result_value({'a/b':[{'~value':3}]},'/a~1b/0/~0value')==3
    with pytest.raises(ValueError):result_value({'value':1},'__import__("os")')


def test_completed_research_references_survive_restart_only_in_same_conversation(tmp_path):
    from astra_ai.memory.shared_memory import atomic
    jobs=ActionJobs(tmp_path/'jobs.json',None,None,None,{'search_web'})
    submitted=jobs.submit([{'name':'search_web','arguments':{'query':'Fixture public research'}}],CTX,'search-reference')
    data=jobs.load();step=data['jobs'][submitted['job_id']]['actions'][0]
    step.update(state='completed',result={'status':'completed','research_id':'report-fixture','research_revision':'hash-fixture','summary':'This full text must not be injected'})
    atomic(jobs.path,data)
    restarted=ActionJobs(jobs.path,None,None,None,{'search_web'})
    refs=restarted.recent_references(CTX)
    assert len(refs)==1 and refs[0]['research_id']=='report-fixture' and 'summary' not in refs[0]
    assert restarted.recent_references({**CTX,'session_id':'other'})==[]
    assert restarted.recent_references({**CTX,'profile_id':'other'})==[]
    assert restarted.recent_references({**CTX,'guest':True})==[]

def test_authentication_failure_does_not_repeat_or_create_a_report(tmp_path):
    calls=[]
    class Transport:
        def post(self,*args,**kwargs):
            calls.append(1);return SimpleNamespace(status_code=401,headers={})
    service=ResearchSearch(ResearchArtifacts(tmp_path/'r.json'),lambda key:'invalid-fixture',Transport())
    for operation in ('one','two'):
        result=asyncio.run(service.search({'query':'Public query','mode':'detailed'},CTX,operation))
        assert result['reason']=='provider_authentication_required' and not result['retryable']
        assert not service.artifacts.get(result['research_id'],CTX)['artifact']['report']
    assert calls==[1]

def test_saved_task_uses_the_existing_queue_and_preserves_results(tmp_path):
    from astra_ai.core.action_jobs import TaskCoordinator
    class Planner:
        calls=0
        def structured(self,*args):
            self.calls+=1
            return {'goal':'Save sourced research','actions':[{'name':'search_web','arguments_json':'{"query":"Public topic"}','depends_on':[]}]}
    async def scenario():
        async def execute(*args):return {'status':'completed','research_id':'verified-source'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda c:True,{'search_web'})
        planner=Planner();core=TaskCoordinator(jobs,planner,[{'name':'search_web'}]);progress=[]
        task={'title':'Research task','instruction':'Find public topic','execution_run_id':'run-1','metadata':{}}
        async def emit(value,step,payload):
            progress.append(payload)
        await jobs.start()
        try:
            result=await core.run(task,emit)
            assert result['status']=='completed' and result['results'][0]['research_id']=='verified-source'
            again=await core.run(task,emit)
            assert again==result and planner.calls==1
            assert progress[-1]['job_id']==result['job_id']
        finally:await jobs.stop()
    asyncio.run(scenario())

def test_one_search_operation_durably_saves_notes_without_model_continuation(tmp_path,monkeypatch):
    from astra_ai.ui.backend import server
    async def scenario():
        calls=[]
        async def execute(name,args,context,operation_id):
            calls.append((name,args))
            if name=='search_web':return {'status':'completed','research_id':'full-report','research_revision':'hash-one'}
            assert args=={'action':'import_research','research_id':'full-report','research_revision':'hash-one'}
            return {'status':'completed','note_id':'persisted-note','verified':True}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda c:True,{'search_web','notes_action'})
        monkeypatch.setattr(server,'action_jobs',jobs)
        await jobs.start()
        try:
            result=await server._dispatch_aegis_tool('search_web',{'query':'Public source','mode':'quick','save_to_notes':True},{**CTX,'client_id':'fixture','user_text':'Search this topic and save all of it to Notes'},'one-authorized-request')
            assert result['verified'] and result['note_id']=='persisted-note'
            assert [name for name,args in calls]==['search_web','notes_action']
            again=await server._dispatch_aegis_tool('search_web',{'query':'Public source','mode':'quick','save_to_notes':True},{**CTX,'client_id':'fixture'},'one-authorized-request')
            assert again['verified'] and len(calls)==2
        finally:await jobs.stop()
    asyncio.run(scenario())
