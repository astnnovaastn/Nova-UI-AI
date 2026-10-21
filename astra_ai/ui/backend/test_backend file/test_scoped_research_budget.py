import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from astra_ai.core.background_budget import BackgroundBudget, BudgetPaused
from astra_ai.core.research_model import GeminiResearchModel, resume_research_budget_waits
from astra_ai.core.research_learning import ResearchArtifacts
from astra_ai.memory.shared_memory import atomic, read, StorageLock

def test_first_report_uses_preferred_text_model_without_waiting_for_live_probe():
    from astra_ai.core.research_model import research_text_model
    status={'text':{'effective':None,'verified':False}}
    assert research_text_model(lambda _:None,status,'preferred-gemini')=='preferred-gemini'
    status['text']['effective']='verified-gemini'
    assert research_text_model(lambda _:None,status,'preferred-gemini')=='verified-gemini'
    assert research_text_model(lambda _:'explicit-gemini',status,'preferred-gemini')=='explicit-gemini'


def test_full_research_has_bounded_thinking_and_time_for_complete_prose(tmp_path):
    options=[];configs=[]
    class Client:
        def __init__(self,**kwargs):options.append(kwargs);self.models=self
        def generate_content(self,**kwargs):
            configs.append(kwargs['config']);return SimpleNamespace(text='{"answer":"A complete answer."}')
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=GeminiResearchModel(lambda:'test',budget,lambda:'gemini-3.8-flash',Client)
    model.structured('Answer',{'mode':'detailed'},{'type':'object'},6000)
    assert options[0]['http_options'].timeout==180000
    assert options[0]['http_options'].retry_options.attempts==1
    assert str(configs[0].thinking_config.thinking_level).split('.')[-1].lower()=='low'
    assert configs[0].max_output_tokens==12000


@pytest.mark.parametrize('code',[404,503,504])
@pytest.mark.parametrize('interval',[0,.01])
def test_unavailable_preferred_model_tries_stable_gemini_once_with_its_own_reservation(tmp_path,code,interval):
    calls=[]
    class ProviderError(Exception):pass
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs['model'])
            if len(calls)==1:
                error=ProviderError();error.code=code;raise error
            return SimpleNamespace(text='{"answer":"Complete source-grounded answer."}',usage_metadata=SimpleNamespace(total_token_count=300))
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=interval)
    model=GeminiResearchModel(lambda:'test',budget,lambda:'gemini-3.8-flash',Client)
    assert model.structured('Answer',{}, {'type':'object'})['answer'].startswith('Complete')
    assert calls==['gemini-3.8-flash','gemini-flash-latest'] and budget.snapshot()['requests']==2
    # A new model instance after reconnect skips the failing model briefly.
    assert budget.model_deferred('gemini-3.8-flash','test')
    assert not budget.model_deferred('gemini-3.8-flash','different-key')
    if interval==0:
        reconnected=GeminiResearchModel(lambda:'test',budget,lambda:'gemini-3.8-flash',Client)
        reconnected.structured('Answer',{}, {'type':'object'})
        assert calls[-1]=='gemini-flash-latest' and len(calls)==3


def test_stable_model_failure_is_not_an_unbounded_retry(tmp_path):
    from astra_ai.core.research_model import ResearchModelUnavailable
    calls=[]
    class ProviderError(Exception):code=503
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):calls.append(kwargs['model']);raise ProviderError()
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=GeminiResearchModel(lambda:'test',budget,lambda:'gemini-3.8-flash',Client)
    with pytest.raises(ResearchModelUnavailable):model.structured('Answer',{}, {'type':'object'})
    assert len(calls)==2 and budget.snapshot()['requests']==2


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


@pytest.mark.parametrize('remaining,expected',[(15717,1),(0,0)])
def test_replaced_provider_resumes_small_stage_without_fixed_twenty_thousand_token_gate(tmp_path,remaining,expected):
    context={'profile_id':'owner','project_id':'project','session_id':'main','requested_research':True}
    artifacts=ResearchArtifacts(tmp_path/'reports.json')
    item=artifacts.reserve('Saved detailed comparison','detailed',context,'memory')
    artifacts.request_state(item['id'],context,phase='waiting_for_quota',waiting_reason='gemini_daily_quota',sources=[{'url':'https://example.com','content':'Saved evidence'}])
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    day=datetime.now(timezone.utc).date().isoformat()
    atomic(budget.path,{'day':day,'requests':28,'tokens':400000-remaining,'next_attempt':0,'pause_reason':''})
    path=tmp_path/'jobs.json'
    jobs=SimpleNamespace(lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda data:atomic(path,data))
    atomic(path,{'jobs':{'memory':{'state':'waiting_for_retry','context':context,'actions':[{'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':item['id']},'result':{'reason':'gemini_daily_quota'}}]}}})
    assert resume_research_budget_waits(jobs,artifacts,budget)==expected
    assert budget.snapshot()['tokens']==400000-remaining and budget.snapshot()['requests']==28
    # Recovery only schedules work; every real request still needs its full lease.
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(remaining+1,item['id']):pass
    if expected:
        with budget.lease(1000,item['id']) as reservation:reservation.settle(500)
        assert budget.snapshot()['tokens']==400000-remaining+500


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
        with pytest.raises(BudgetPaused,match=reason):model.structured('Answer',{}, {'type':'object'})
    finally:CURRENT_OPERATION.reset(token)
    saved=budget.snapshot()
    assert saved['pause_reason']==reason and saved['requests']==41 and saved['tokens']==1234
    assert saved['research_allowances']['pixel']['used']==1
    assert 'private-provider-message' not in budget.path.read_text()


def test_replacement_credential_releases_only_old_provider_pause(tmp_path):
    import time
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    allowance(budget)
    budget.provider_pause(time.time()+86400,'gemini_daily_quota',provider_key='old-private-key')
    before=budget.snapshot()
    assert not budget.provider_changed('old-private-key','old-private-key')
    assert budget.provider_changed('old-private-key','replacement-private-key')
    after=budget.snapshot()
    assert after['requests']==before['requests'] and after['tokens']==before['tokens']
    assert after['research_allowances']==before['research_allowances']
    assert after['next_attempt']==0 and after['provider_pause_history'][-1]['until']==before['next_attempt']
    budget.provider_pause(time.time()+86400,'gemini_daily_quota',provider_key='old-private-key')
    assert budget.snapshot()['next_attempt']==0  # A late response belongs to the old credential.
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(10,'unrelated'):pass
    with budget.lease(10,'pixel'):pass
    assert budget.snapshot()['requests']==41
    assert 'private-key' not in budget.path.read_text()


def test_provider_reason_survives_day_rollover_then_local_pacing_has_no_stale_reason(tmp_path):
    import time
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=10)
    atomic(budget.path,{'day':'1900-01-01','next_attempt':time.time()+100,'pause_reason':'gemini_daily_quota'})
    with pytest.raises(BudgetPaused,match='gemini_daily_quota'):
        with budget.lease(1):pass
    data=read(budget.path,{});data['next_attempt']=0;atomic(budget.path,data)
    with budget.lease(1):pass
    with pytest.raises(BudgetPaused,match='background_quota_paused'):
        with budget.lease(1):pass


@pytest.mark.parametrize('changed_evidence',[False,True])
def test_ready_cached_composition_can_publish_during_quota_without_spending_it(tmp_path,changed_evidence):
    import time
    from astra_ai.core.research_model import composition_signature
    context={'profile_id':'owner','project_id':'project','session_id':'main','requested_research':True}
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.reserve('Company report','detailed',context,'original')
    sources=[{'url':'https://example.com','title':'Evidence','content':'Saved evidence.'}]
    composition={'signature':composition_signature(row['query'],sources),'plan':{'title':'Company report','sections':[{}, {}, {}]},
        'parts':['## Findings\n\nSupported facts [S1].']*3,'coverage_checked':True,'coverage_note':{'after_section':0,'report':''}}
    if changed_evidence:sources[0]['content']='Different evidence.'
    store.request_state(row['id'],context,phase='waiting_for_quota',waiting_reason='gemini_daily_quota',sources=sources,synthesis_checkpoint=composition)
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000)
    state={'day':datetime.now(timezone.utc).date().isoformat(),'requests':40,'tokens':400000,'next_attempt':time.time()+86400,'pause_reason':'gemini_daily_quota'}
    atomic(budget.path,state)
    path=tmp_path/'jobs.json'
    jobs=SimpleNamespace(lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda data:atomic(path,data))
    atomic(path,{'jobs':{'original':{'state':'waiting_for_retry','context':context,'actions':[{'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':row['id']},'result':{'reason':'gemini_daily_quota'},'attempts':2}]}}})
    assert resume_research_budget_waits(jobs,store,budget)==(0 if changed_evidence else 1)
    assert budget.snapshot()==state
