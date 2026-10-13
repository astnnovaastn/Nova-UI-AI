import asyncio
from pathlib import Path
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.ui.backend.action_jobs import ActionJobs
from astra_ai.core.research_learning import ResearchLearning
from astra_ai.core.learned_capabilities import LearnedCapabilities,validate_code
from astra_ai.core.background_budget import BackgroundBudget,BudgetPaused
from astra_ai.core.sandbox_worker import IsolationUnavailable
import pytest

class FakeSandbox:
    verified=True
    def status(self):return {'verified':self.verified}
    def verify(self):return self.status()
    def run(self,code,value):
        namespace={};exec(code,namespace);return {'status':'ok','result':namespace['run'](value)}

class Unavailable(FakeSandbox):
    verified=False
    def run(self,*args):raise AssertionError('Must never run without OS isolation')

def test_research_is_sourced_cached_scoped_and_forgotten(tmp_path):
    async def run():
        m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'history.json');m.ensure_ready();calls=[]
        async def execute(*args):return {'status':'ok'}
        async def notify(*args):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda _:True,['research_action'])
        async def search(query):calls.append(query);return {'status':'completed','results':[{'title':'Fixture docs','url':'https://example.org/docs','content':'Fixture orbital research findings'}]}
        research=ResearchLearning(tmp_path/'learned',m,jobs,search);research.initialize();context={'profile_id':'person','project_id':'project'}
        request=research.request('Orbital research',context,'first');result=await research.run(request['research_id'],context);assert result['status']=='completed'
        assert research.request('Orbital research',context,'second')['cached'];assert len(calls)==1
        assert research.get(request['research_id'],{})['status']=='not_found'
        note=research.get(request['research_id'],context,True)['note'];assert 'https://example.org/docs' in note['markdown'];assert list((tmp_path/'learned'/'research').rglob('*.md'))
        assert not m.context_records(profile_id='person',project_id='project')
        assert m.recall_memory('orbital',profile_id='person',project_id='project')['matches'][0]['attributes']['external_knowledge']
        sourced=m.format_response_context(query='orbital',profile_id='person',project_id='project');assert 'External research' in sourced
        from astra_ai.core.aegis_live_context import build_aegis_live_instruction
        assert 'External research' in build_aegis_live_instruction(tmp_path/'history.json',long_term_profile=sourced)
        m.forget(result['record_id']);assert research.get(request['research_id'],context)['status']=='not_found';assert research.request('Orbital research',context)['status']=='forgotten'
    asyncio.run(run())

def test_tool_activation_invocation_and_missing_isolation(tmp_path):
    async def run():
        m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'history.json');m.ensure_ready()
        async def broker(*args):raise AssertionError('No actions in pure helper')
        caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,broker,sandbox=Unavailable());caps.initialize()
        staged=caps.stage('increment','Fixture','def run(value):\n    return value+1',[{'input':4,'expected':5}],[],{})
        assert (await caps.validate(staged['tool_id'],{}))['reason']=='OS_isolation_unavailable'
        assert (await caps.invoke(staged['tool_id'],4,{},'op'))['status']=='rejected'
        caps.sandbox=FakeSandbox();assert (await caps.validate(staged['tool_id'],{}))['status']=='activated'
        assert (await caps.invoke(staged['tool_id'],4,{},'op'))['result']==5
        assert (await caps.invoke(staged['tool_id'],4,{},'op'))['result']==5
        assert (await caps.invoke(staged['tool_id'],8,{},'op'))['status']=='rejected'
    asyncio.run(run())

def test_unsafe_code_and_critical_approval(tmp_path):
    for code in ('import os\ndef run(x): return os.environ','def run(x): return __builtins__["open"](x)','import urllib.request\ndef run(x): return x'):
        with pytest.raises(ValueError):validate_code(code)
    async def run():
        m=SharedMemory(memory_path=tmp_path/'m.json',transcript_path=tmp_path/'t.json');m.ensure_ready()
        caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,None,sandbox=FakeSandbox())
        item=caps.stage('critical','Fixture','def run(value):\n    return value',[{'input':1,'expected':1}],['delete_file'],{})
        assert (await caps.validate(item['tool_id'],{}))['status']=='waiting_for_approval'
        assert caps.approve(item['tool_id'],'wrong',{})['status']=='conflict'
    asyncio.run(run())

def test_repair_reproduces_failure_and_rolls_back(tmp_path):
    async def run():
        m=SharedMemory(memory_path=tmp_path/'m.json',transcript_path=tmp_path/'t.json');m.ensure_ready()
        target=tmp_path/'astra_ai'/'ui'/'fixture_helper.py';target.parent.mkdir(parents=True);target.write_text('def adjust(value):\n    return value-1\n')
        tests_dir=tmp_path/'tests';tests_dir.mkdir();(tests_dir/'test_fixture.py').write_text('from astra_ai.ui.fixture_helper import adjust\ndef test_regression():\n    assert adjust(3)==4\n')
        caps=LearnedCapabilities(tmp_path/'learned',tmp_path,m,None,None,sandbox=FakeSandbox());caps.initialize()
        repair=caps.stage_repair(str(target.relative_to(tmp_path)),'adjust','def adjust(value):\n    return value+1',[{'input':3,'expected':4}],{})
        assert (await caps.apply_repair(repair['repair_id'],{}))['status']=='applied';assert 'value+1' in target.read_text()
        assert caps.rollback(repair['repair_id'],{})['status']=='rolled_back';assert 'value-1' in target.read_text()
    asyncio.run(run())

def test_shared_background_budget_pauses(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_requests=1,min_interval=0)
    with budget.lease(100):pass
    with pytest.raises(BudgetPaused):
        with budget.lease(100):pass
