import asyncio,copy,json,time
from datetime import datetime,timezone
from types import SimpleNamespace
import pytest
from astra_ai.core.background_budget import BackgroundBudget,BudgetPaused
from astra_ai.core.background_model import ModelUnavailable
from astra_ai.core.research_model import composition_signature,GeminiResearchModel,ResearchModelUnavailable,resume_research_budget_waits,research_budget_path,requested_research_budget
from astra_ai.core.research_learning import ResearchArtifacts
from astra_ai.core.research_openai import OpenAIResearchModel,configured_research_model
from astra_ai.memory.shared_memory import atomic,read,StorageLock
from astra_ai.core.aegis_ai import CURRENT_OPERATION


def response(data=None,status=200,code=None,finish='stop'):
    body={'usage':{'total_tokens':123},'choices':[{'finish_reason':finish,'message':{'content':json.dumps(data or {'answer':'Supported answer.'})}}]} if status==200 else {'error':{'code':code,'message':'private-provider-response'}}
    return SimpleNamespace(status_code=status,headers={},json=lambda:body)


def test_openai_writer_uses_strict_fixed_transport_and_settles_actual_usage(tmp_path):
    calls=[];budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:(calls.append((a,k)) or response()))
    assert model.structured('Answer from evidence',{'query':'Question'},{'type':'object'})['answer']=='Supported answer.'
    args,kwargs=calls[0]
    assert args==('https://api.openai.com/v1/chat/completions',) and kwargs['allow_redirects'] is False
    assert kwargs['json']['store'] is False and kwargs['json']['response_format']['json_schema']['strict'] is True
    assert 'private-key' not in json.dumps(kwargs['json'])
    assert budget.snapshot()['requests']==1 and budget.snapshot()['tokens']==123


def test_openai_and_gemini_quota_are_isolated_but_share_local_counters(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    budget.provider_pause(time.time()+1000,'gemini_daily_quota',provider_key='google-key')
    model=OpenAIResearchModel(lambda:'openai-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:response())
    model.structured('Answer',{}, {'type':'object'})
    with pytest.raises(BudgetPaused,match='gemini_daily_quota'):
        with budget.lease(100,provider_key='google-key'):pass
    budget.provider_pause(time.time()+1000,'openai_rate_limit',provider_key='openai-key')
    with pytest.raises(BudgetPaused,match='openai_rate_limit'):model.structured('Answer',{}, {'type':'object'})
    with budget.lease(100,provider_key='another-project-key'):pass
    assert budget.snapshot()['requests']==2
    assert 'openai-key' not in budget.path.read_text() and 'google-key' not in budget.path.read_text()


@pytest.mark.parametrize('code,reason',[('insufficient_quota','openai_quota_unavailable'),('rate_limit_exceeded','openai_rate_limit')])
def test_openai_quota_waits_without_hidden_retry_or_gemini_fallback(tmp_path,code,reason):
    calls=[];budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:(calls.append(k) or response(status=429,code=code)))
    for _ in range(2):
        with pytest.raises(BudgetPaused,match=reason):model.structured('Answer',{}, {'type':'object'})
    assert len(calls)==1 and budget.snapshot()['requests']==1 and budget.snapshot()['tokens']==0
    assert 'private-provider-response' not in budget.path.read_text()


@pytest.mark.parametrize('status',[401,503])
def test_openai_failure_does_not_return_an_answer_or_repeat_the_request(tmp_path,status):
    calls=[];budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:(calls.append(k) or response(status=status)))
    with pytest.raises(ResearchModelUnavailable if status==503 else ModelUnavailable):model.structured('Answer',{}, {'type':'object'})
    assert len(calls)==1 and budget.snapshot()['requests']==1


def test_openai_retains_model_slot_and_rejects_truncated_json(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0);calls=[]
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:(calls.append(k) or response(finish='length')))
    budget.slot.acquire()
    try:
        with pytest.raises(BudgetPaused,match='background_model_busy'):model.structured('Answer',{}, {'type':'object'})
    finally:budget.slot.release()
    assert calls==[]
    with pytest.raises(ModelUnavailable,match='output limit'):model.structured('Answer',{}, {'type':'object'})
    assert len(calls)==1 and budget.snapshot()['tokens']==123


def test_one_authorized_openai_completion_reuses_existing_sections_and_publishes_cached_result(tmp_path):
    day=datetime.now(timezone.utc).date().isoformat();budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant={'day':day,'extra_tokens':16000,'used':0,'max_requests':1,'requests_used':0}
    atomic(budget.path,{'day':day,'requests':35,'tokens':438429,'next_attempt':0,'research_token_allowances':{'memory:openai':grant}})
    sources=[{'url':'https://example.com/'+str(i),'content':'Supported engineering evidence. '*500} for i in range(13)]
    first='## Foundations\n\n'+('Supported explanation. '*300)+' [S1].'
    plan={'title':'Local Memory Architectures','sections':[{'heading':h,'focus':h} for h in ('Foundations','Comparison','Local stack')]}
    state={'signature':composition_signature('Full memory comparison',sources),'plan':plan,'parts':[first]}
    saved=[];calls=[]
    def post(*args,**kwargs):
        calls.append(kwargs);payload=json.loads(kwargs['json']['messages'][1]['content'])
        assert payload['written_report']==first and len(payload['remaining_sections'])==2
        return response({'parts':['## Comparison\n\n'+('Supported comparison. '*200)+' [S2].',
            '## Local stack\n\n'+('Supported recommendation. '*180)+' [S3].'],'after_section':0,'report':''})
    async def checkpoint(value):saved.append(value)
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',post)
    token=CURRENT_OPERATION.set({'model_research_id':'memory'})
    try:
        report=asyncio.run(model.report('Full memory comparison',sources,state=state,checkpoint=checkpoint))
        assert len(report)>12000 and report.count(first)==1 and len(calls)==1
        assert asyncio.run(model.report('Full memory comparison',sources,state=saved[-1],checkpoint=checkpoint))==report
        assert len(calls)==1
        with pytest.raises(BudgetPaused):model.structured('Another request',{}, {'type':'object'})
    finally:CURRENT_OPERATION.reset(token)
    snapshot=budget.snapshot()
    assert snapshot['requests']==36 and snapshot['tokens']==438552
    assert snapshot['research_token_allowances']['memory:openai']['requests_used']==1
    assert snapshot['research_token_allowances']['memory:openai']['used']==123


def test_research_provider_selection_is_explicit_and_never_changes_live_key(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json');settings={}
    assert isinstance(configured_research_model(settings.get,lambda:'live-key',budget,{},'preferred'),GeminiResearchModel)
    settings.update(NOVA_RESEARCH_PROVIDER='openai',NOVA_RESEARCH_OPENAI_API_KEY='report-key')
    model=configured_research_model(settings.get,lambda:'live-key',budget,{},'preferred')
    assert isinstance(model,OpenAIResearchModel) and model.key_provider()=='report-key' and model.model_provider()=='gpt-4.1-mini'
    settings['NOVA_RESEARCH_PROVIDER']='unknown'
    with pytest.raises(ValueError):configured_research_model(settings.get,lambda:'live-key',budget,{},'preferred')


def test_restart_resumes_only_report_with_provider_scoped_allowance(tmp_path):
    context={'profile_id':'owner','project_id':'project','session_id':'main','requested_research':True}
    artifacts=ResearchArtifacts(tmp_path/'reports.json');item=artifacts.reserve('Saved comparison','detailed',context,'memory')
    identifier=item['id']
    artifacts.request_state(identifier,context,phase='waiting_for_quota',waiting_reason='background_daily_budget',sources=[{'url':'https://example.com','content':'Saved evidence'}])
    day=datetime.now(timezone.utc).date().isoformat();budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    atomic(budget.path,{'day':day,'requests':35,'tokens':440000,'next_attempt':0,'research_token_allowances':{
        identifier+':openai':{'day':day,'extra_tokens':16000,'used':0,'max_requests':1,'requests_used':0}}})
    path=tmp_path/'jobs.json';jobs=SimpleNamespace(lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda data:atomic(path,data))
    atomic(path,{'jobs':{'memory':{'state':'waiting_for_retry','context':context,'actions':[{'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':identifier},'result':{'reason':'background_daily_budget'}}]}}})
    model=OpenAIResearchModel(lambda:'openai-key',budget,lambda:'gpt-4.1-mini')
    assert resume_research_budget_waits(jobs,artifacts,budget)==0
    assert resume_research_budget_waits(jobs,artifacts,budget,provider_key=model.key_provider(),budget_scope=model.budget_scope)==1
    assert budget.snapshot()['requests']==35


def test_switching_provider_preserves_legacy_quota_pause(tmp_path):
    import hashlib
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    day=datetime.now(timezone.utc).date().isoformat()
    atomic(budget.path,{'day':day,'requests':1,'tokens':100,'next_attempt':time.time()+1000,
        'pause_reason':'gemini_daily_quota','provider_marker':hashlib.sha256(b'google-key').hexdigest()})
    with budget.lease(100,provider_key='openai-key'):pass
    with pytest.raises(BudgetPaused,match='gemini_daily_quota'):
        with budget.lease(100,provider_key='google-key'):pass
    assert budget.snapshot()['requests']==2


def test_normal_openai_research_has_its_own_policy_and_preserves_gemini_usage(tmp_path):
    import threading
    shared_slot=threading.Lock();settings={'NOVA_RESEARCH_PROVIDER':'openai','NOVA_RESEARCH_OPENAI_DAILY_REQUESTS':'40','NOVA_RESEARCH_OPENAI_DAILY_TOKENS':'400000'}
    gemini_path=research_budget_path(tmp_path,lambda _:None)
    assert gemini_path.name=='research_gemini_budget.json'
    day=datetime.now(timezone.utc).date().isoformat()
    atomic(gemini_path,{'day':day,'requests':37,'tokens':461875,'next_attempt':0})
    original=gemini_path.read_bytes()
    openai_path=research_budget_path(tmp_path,settings.get)
    assert openai_path.name=='research_openai_budget.json' and openai_path!=gemini_path
    budget=requested_research_budget(openai_path,shared_slot,settings.get)
    assert budget.daily_requests==40 and budget.daily_tokens==400000 and budget.slot is shared_slot
    model=OpenAIResearchModel(lambda:'private-key',budget,lambda:'gpt-4.1-mini',lambda *a,**k:response())
    assert model.structured('Answer the new UI brief',{'query':'New user report'},{'type':'object'})['answer']=='Supported answer.'
    assert budget.snapshot()['requests']==1 and budget.snapshot()['tokens']==123
    assert gemini_path.read_bytes()==original
    shared_slot.acquire()
    try:
        with pytest.raises(BudgetPaused,match='background_model_busy'):model.structured('Answer',{}, {'type':'object'})
    finally:shared_slot.release()
