import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from astra_ai.core.background_budget import BackgroundBudget, BudgetPaused
from astra_ai.core.research_model import GeminiResearchModel, resume_research_budget_waits
from astra_ai.core.research_learning import ResearchArtifacts
from astra_ai.memory.shared_memory import atomic, read, StorageLock


def allowance(budget, day=None):
    day=day or datetime.now(timezone.utc).date().isoformat()
    atomic(budget.path,{'day':day,'requests':40,'tokens':1234,'settled_requests':35,'next_attempt':0,
        'research_allowances':{'pixel':{'day':day,'extra_requests':3,'used':0}}})


def test_three_extra_requests_are_report_scoped_and_never_reset_counters(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    allowance(budget)
    for scope in ('','another-report'):
        with pytest.raises(BudgetPaused,match='background_daily_budget'):
            with budget.lease(10,scope):pass
    for _ in range(3):
        with budget.lease(100,'pixel') as reservation:reservation.settle(25)
    state=budget.snapshot()
    assert state['requests']==43 and state['tokens']==1309 and state['settled_requests']==38
    assert state['research_allowances']['pixel']['used']==3
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(10,'pixel'):pass


def test_allowance_does_not_bypass_tokens_pacing_or_model_slot(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=1250,min_interval=30)
    allowance(budget)
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(20,'pixel'):pass
    assert budget.snapshot()['research_allowances']['pixel']['used']==0
    with budget.lease(10,'pixel'):
        with pytest.raises(BudgetPaused,match='background_model_busy'):
            with budget.lease(1,'pixel'):pass
    with pytest.raises(BudgetPaused,match='background_quota_paused'):
        with budget.lease(1,'pixel'):pass
    assert budget.snapshot()['research_allowances']['pixel']['used']==1


@pytest.mark.parametrize('grant',[{'day':'1900-01-01','extra_requests':3,'used':0},
    {'extra_requests':True,'used':0},{'extra_requests':4,'used':0},{'extra_requests':3,'used':-1},None])
def test_invalid_or_expired_grants_are_not_used(tmp_path,grant):
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    allowance(budget)
    state=budget.snapshot()
    if isinstance(grant,dict):grant.setdefault('day',state['day'])
    state['research_allowances']['pixel']=grant;atomic(budget.path,state)
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(1,'pixel'):pass


def test_next_day_discards_grant_and_rejection_still_counts_request(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    allowance(budget,'1900-01-01')
    with budget.lease(1,'pixel'):pass
    assert budget.snapshot()['requests']==1 and 'research_allowances' not in budget.snapshot()
    allowance(budget)
    with pytest.raises(RuntimeError):
        with budget.lease(10,'pixel') as reservation:
            reservation.settle(0)
            raise RuntimeError('Provider rejected request')
    assert budget.snapshot()['requests']==41 and budget.snapshot()['research_allowances']['pixel']['used']==1


def test_gemini_uses_frozen_model_scope_through_worker_thread(tmp_path):
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0);allowance(budget)
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):return SimpleNamespace(text='{"answer":"Camera evidence."}')
        def close(self):pass
    model=GeminiResearchModel(lambda:'test',budget,lambda:'configured-gemini',Client)
    async def run():
        token=CURRENT_OPERATION.set({'model_research_id':'pixel'})
        try:return await asyncio.to_thread(model.structured,'Answer',{}, {'type':'object'})
        finally:CURRENT_OPERATION.reset(token)
    assert asyncio.run(run())['answer']=='Camera evidence.'
    assert budget.snapshot()['research_allowances']['pixel']['used']==1


def test_only_authorised_checkpoint_is_resumed_at_daily_limit(tmp_path):
    context={'profile_id':'owner','project_id':'project','session_id':'main','requested_research':True}
    artifacts=ResearchArtifacts(tmp_path/'reports.json')
    identifiers=[]
    for key in ('pixel','unrelated'):
        item=artifacts.reserve(key,'detailed',context,key)
        identifiers.append(item['id'])
        artifacts.request_state(item['id'],context,phase='waiting_for_quota',waiting_reason='background_daily_budget',sources=[{'url':'https://example.com','content':'Saved evidence'}])
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0);allowance(budget)
    state=budget.snapshot();state['research_allowances'][identifiers[0]]=state['research_allowances'].pop('pixel');atomic(budget.path,state)
    path=tmp_path/'jobs.json'
    jobs=SimpleNamespace(lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda data:atomic(path,data))
    atomic(path,{'jobs':{key:{'state':'waiting_for_retry','context':context,'actions':[{'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':identifier},'result':{'reason':'background_daily_budget'},'attempts':2}]} for key,identifier in zip(('pixel','unrelated'),identifiers)}})
    assert resume_research_budget_waits(jobs,artifacts,budget)==1
    saved=read(path,{})['jobs']
    assert saved['pixel']['state']=='queued' and saved['pixel']['actions'][0]['attempts']==2
    assert saved['unrelated']['state']=='waiting_for_retry'
    assert budget.snapshot()['requests']==40


@pytest.mark.parametrize('quota,value,reason,minimum',[
    ('GenerateRequestsPerDayPerProjectPerModel-FreeTier','20','gemini_daily_quota',3600),
    ('GenerateRequestsPerMinutePerProjectPerModel-FreeTier','5','gemini_rate_limit',125),
    ('GenerateRequestsPerMinutePerProjectPerModel-FreeTier','0','gemini_quota_unavailable',3600)])
def test_provider_retry_signals_are_shared_and_do_not_spend_more_allowance(tmp_path,quota,value,reason,minimum):
    import time
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0);allowance(budget)
    class QuotaError(Exception):
        code=429
        details={'error':{'message':'private-provider-message','details':[{'violations':[{'quotaId':quota,'quotaValue':value}]},{'retryDelay':'125s'}]}}
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):raise QuotaError()
        def close(self):pass
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    token=CURRENT_OPERATION.set({'model_research_id':'pixel'})
    try:
        model=GeminiResearchModel(lambda:'test',budget,lambda:'configured-gemini',Client)
        started=time.time()
        with pytest.raises(BudgetPaused) as caught:model.structured('Answer',{}, {'type':'object'})
        assert caught.value.reason==reason and caught.value.until>=started+minimum
        with pytest.raises(BudgetPaused,match='background_quota_paused'):model.structured('Answer',{}, {'type':'object'})
    finally:CURRENT_OPERATION.reset(token)
    saved=budget.snapshot()
    assert saved['pause_reason']==reason and saved['requests']==41 and saved['tokens']==1234
    assert saved['research_allowances']['pixel']['used']==1
    assert 'private-provider-message' not in budget.path.read_text()
