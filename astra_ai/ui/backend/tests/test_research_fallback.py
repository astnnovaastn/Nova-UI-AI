import json
import time
from types import SimpleNamespace
import pytest
from astra_ai.core.background_budget import BackgroundBudget, BudgetPaused
from astra_ai.core.background_model import ModelUnavailable
from astra_ai.core.research_model import GeminiResearchModel
from astra_ai.core.research.providers import ResearchRouter, EVIDENCE_POLICY, RouterJournal, SectionedFallback

SCHEMA={'type':'object','required':['report'],'additionalProperties':False,'properties':{'report':{'type':'string'}}}


class Error(Exception):
    def __init__(self,code):self.code=code


class Transport:
    def __init__(self,statuses=None):self.statuses=list(statuses or [200]);self.posts=[];self.gets=0
    def get(self,*args,**kwargs):
        self.gets+=1
        return SimpleNamespace(status_code=200,json=lambda:{'data':[{'id':m} for m in ['openai/gpt-oss-120b','openai/gpt-oss-20b']]})
    def post(self,*args,**kwargs):
        self.posts.append(kwargs['json']);status=self.statuses.pop(0) if self.statuses else 200
        return SimpleNamespace(status_code=status,headers={},json=lambda:{'usage':{'total_tokens':200},'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'report':'Supported answer [S1].'})}}]})


def router(tmp_path,error=None,transport=None):
    calls=[]
    def generate(**kwargs):
        calls.append(kwargs)
        if error:raise Error(error)
        return SimpleNamespace(text=json.dumps({'report':'Gemini answer [S1].'}),usage_metadata=SimpleNamespace(total_token_count=100),candidates=[])
    primary=GeminiResearchModel(lambda:'gemini-key',BackgroundBudget(tmp_path/'usage.json',daily_tokens=100000,min_interval=0),lambda:'gemini-3.5-flash-lite',lambda **kwargs:SimpleNamespace(models=SimpleNamespace(generate_content=generate)))
    primary.batch_detailed=True
    model=ResearchRouter(primary,{'GROQ_API_KEY':'groq-key'}.get,transport=transport or Transport())
    return model,calls


def run(model,private=False,allow=False,tokens=1000):
    token=EVIDENCE_POLICY.set({'private':private,'allow_private':allow})
    try:return model.structured('Write a grounded answer.',{'evidence':[{'id':'S1','content':'Evidence.'}]},SCHEMA,tokens)
    finally:EVIDENCE_POLICY.reset(token)


def test_healthy_gemini_does_not_contact_groq(tmp_path):
    transport=Transport();model,calls=router(tmp_path,transport=transport)
    assert run(model)['report'].startswith('Gemini')
    assert len(calls)==1 and transport.posts==[] and transport.gets==0


def test_resumed_fallback_progress_does_not_claim_skipped_primary(tmp_path):
    model,calls=router(tmp_path);progress=[]
    token=EVIDENCE_POLICY.set({'private':False,'validated_draft_fallback':True,'progress':lambda provider,model:progress.append(provider)})
    try:result=model.structured('Write a grounded answer.',{'evidence':[{'id':'S1','content':'Evidence.'}]},SCHEMA,1000)
    finally:EVIDENCE_POLICY.reset(token)
    assert result['report'].startswith('Supported') and not calls
    assert progress==['groq']


@pytest.mark.parametrize('code',[429,408,500,502,503,504,404])
def test_recoverable_google_failure_preserves_budget_and_uses_groq(tmp_path,code):
    transport=Transport();model,calls=router(tmp_path,code,transport)
    assert run(model)['report']=='Supported answer [S1].'
    assert transport.posts[0]['model']=='openai/gpt-oss-120b'
    assert model.effective_provider=='groq' and model.budget.snapshot()['requests']==2
    assert model.budget.snapshot()['tokens']>=200  # Ambiguous timeouts remain reserved.
    assert len(calls)==1


@pytest.mark.parametrize('code',[400,401,403])
def test_invalid_or_unauthorized_google_request_never_hops(tmp_path,code):
    transport=Transport();model,_=router(tmp_path,code,transport)
    with pytest.raises(ModelUnavailable):run(model)
    assert not transport.posts


def test_private_context_requires_conversation_permission(tmp_path):
    transport=Transport();model,_=router(tmp_path,429,transport)
    with pytest.raises(BudgetPaused,match='groq_private_consent_required'):run(model,private=True)
    assert not transport.posts
    assert run(model,private=True,allow=True)['report'].startswith('Supported')


def test_local_allowance_never_triggers_fallback(tmp_path):
    transport=Transport();model,_=router(tmp_path,429,transport);model.budget.daily_requests=0
    with pytest.raises(BudgetPaused,match='background_daily_budget'):run(model)
    assert not transport.posts


def test_alternative_model_after_model_service_failure_and_discovery_cached(tmp_path):
    transport=Transport([503,200]);model,_=router(tmp_path,503,transport)
    assert run(model)['report'].startswith('Supported')
    assert [p['model'] for p in transport.posts]==['openai/gpt-oss-120b','openai/gpt-oss-20b']
    assert transport.gets==1


def test_shared_groq_quota_does_not_hop_models(tmp_path):
    transport=Transport([429]);model,_=router(tmp_path,429,transport)
    with pytest.raises(BudgetPaused,match='groq_rate_limit'):run(model)
    assert len(transport.posts)==1


def test_long_fallback_is_replanned_not_truncated(tmp_path):
    transport=Transport();model,_=router(tmp_path,429,transport)
    with pytest.raises(SectionedFallback):run(model,tokens=12000)
    assert not transport.posts


def test_attempt_limits_persist_without_private_payload(tmp_path):
    path=tmp_path/'journal.json';journal=RouterJournal(path)
    for i in range(4):journal.attempt('stage','gemini','model')
    with pytest.raises(ModelUnavailable):RouterJournal(path).attempt('stage','groq','other')
    data=json.loads(path.read_text());assert len(data['stages']['stage']['attempts'])==4
    assert 'content' not in path.read_text()


def test_only_one_distinct_repair_per_operation(tmp_path):
    journal=RouterJournal(tmp_path/'journal.json');journal.repair('operation','same-stage')
    journal.repair('operation','same-stage')
    with pytest.raises(ModelUnavailable):journal.repair('operation','another-stage')


def test_shared_groq_gate_preserves_daily_usage_and_paces_before_outbound(tmp_path):
    from astra_ai.core.research.quota import GroqQuota
    gate=GroqQuota(tmp_path/'quota.json');reservation=gate.reserve('key',6000)
    with pytest.raises(BudgetPaused,match='groq_token_rate_limit'):GroqQuota(gate.path).reserve('key',4000)
    gate.settle(reservation,1000)
    assert gate.reserve('key',4000)
    with pytest.raises(BudgetPaused,match='groq_daily_token_limit'):GroqQuota(gate.path,daily=5000).reserve('key',1)


def test_cooperative_is_off_by_default_and_explicitly_configurable(tmp_path):
    model,_=router(tmp_path)
    assert model.status()['cooperative_enabled'] is False
    original=model.settings
    model.settings=lambda name:'1' if name=='NOVA_RESEARCH_GROQ_COOPERATIVE' else original(name)
    assert model.status()['cooperative_enabled'] is True


def test_fallback_final_validation_does_not_claim_fact_verification(tmp_path):
    model,_=router(tmp_path)
    state={'last_provider':'groq','parts':['## Section\n\nSupported finding [S1].']*3}
    assert model.prepare_local_coverage('Topic',[{'content':'Evidence.'}],state)
    assert state['coverage_checked'] and not state['evaluation']['factual_entailment_verified']
    with pytest.raises(ModelUnavailable):model.prepare_local_coverage('Topic',[{'content':'Evidence '*2000}],state)


def test_configured_cost_ceiling_is_conservative_and_unknown_is_not_zero(tmp_path):
    journal=RouterJournal(tmp_path/'journal.json')
    journal.check_cost('op',0.01,0.05);journal.record_cost('op',0.01)
    with pytest.raises(BudgetPaused,match='research_cost_limit'):journal.check_cost('op',0.05,0.05)
    with pytest.raises(BudgetPaused,match='research_cost_estimate_unavailable'):journal.check_cost('op',None,0.05)
    journal.record_cost('op',None)
    with pytest.raises(BudgetPaused,match='research_cost_estimate_unavailable'):journal.check_cost('op',0.01,0.05)


def test_explicit_writing_diagnostic_is_idempotent_and_uses_normal_allowance(tmp_path):
    class DiagnosticTransport(Transport):
        def post(self,*args,**kwargs):
            response=super().post(*args,**kwargs)
            response.json=lambda:{'usage':{'total_tokens':200},'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'report':'The second measures time, and the metre measures length. These standard units allow measurements to be compared consistently [S1].'})}}]}
            return response
    transport=DiagnosticTransport();model,calls=router(tmp_path,transport=transport)
    result=model.verify_fallback('diagnostic-operation')
    assert result['status']=='completed' and result['provider']=='groq'
    assert model.verify_fallback('diagnostic-operation')==result
    assert len(transport.posts)==1 and not calls and model.budget.snapshot()['requests']==1


def test_cooperative_role_selection_is_explicit_and_only_after_failure(tmp_path):
    transport=Transport();model,_=router(tmp_path,503,transport)
    token=EVIDENCE_POLICY.set({'private':False,'cooperative':True})
    try:model.structured('Write this section.',{'write_section':{'heading':'Optics'},'evidence':[{'id':'S1','content':'Evidence.'}]},SCHEMA,1000)
    finally:EVIDENCE_POLICY.reset(token)
    assert transport.posts[0]['model']=='openai/gpt-oss-20b'


def test_exhausted_generated_draft_validation_reuses_plan_for_checkpointed_fallback(tmp_path):
    import asyncio
    from astra_ai.core.research_model import composition_signature
    model,_=router(tmp_path);model.batch_detailed=True
    sources=[{'url':'https://example.com/evidence','content':'Supported evidence.'}]
    state={'signature':composition_signature('Detailed topic',sources),'composition_mode':'single_pass',
           'composition_version':2,'batch_attempts':2,'candidate':{'title':'Topic','sections':[{'heading':'Section '+str(i),'focus':'Evidence'} for i in range(3)]}}
    saved=[]
    async def checkpoint(value):saved.append(value);raise BudgetPaused(9999999999,'research_section_saved')
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Detailed topic',sources,state=state,checkpoint=checkpoint))
    assert saved[-1]['validated_draft_fallback'] and len(saved[-1]['plan']['sections'])==3
    assert not saved[-1].get('candidate') and saved[-1]['parts']==[]


def test_missing_and_unknown_generated_citations_are_provider_validation_failures():
    from astra_ai.core.research.providers import validate_generated_references,ProviderFailure
    payload={'evidence':[{'id':'S1','content':'Supported fact.'}]}
    validate_generated_references({'report':'Supported fact [S1].'},payload,'gemini')
    validate_generated_references({'sections':[{'heading':'Plan','focus':'Topic'}]},payload,'gemini')
    for value in ('Unsupported uncited essay.','Invented source [S99].'):
        with pytest.raises(ProviderFailure):validate_generated_references({'report':value},payload,'gemini')


def test_sequential_provider_attempt_is_not_an_extra_draft_repair(tmp_path):
    from astra_ai.memory.shared_memory import stable
    class UncitedFirst(Transport):
        def post(self,*args,**kwargs):
            response=super().post(*args,**kwargs)
            if len(self.posts)==1:
                response.json=lambda:{'usage':{'total_tokens':200},'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'report':'Uncited response.'})}}]}
            return response
    transport=UncitedFirst();model,_=router(tmp_path,503,transport)
    model.journal.repair(stable('standalone'),'earlier-explicit-repair')
    assert run(model)['report']=='Supported answer [S1].'
    assert [row['model'] for row in transport.posts]==['openai/gpt-oss-120b','openai/gpt-oss-20b']


def test_quota_wait_resumes_second_candidate_without_repeating_rejected_model(tmp_path,monkeypatch):
    class UncitedFirst(Transport):
        def post(self,*args,**kwargs):
            response=super().post(*args,**kwargs)
            if len(self.posts)==1:
                response.json=lambda:{'usage':{'total_tokens':200},'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'report':'Uncited response.'})}}]}
            return response
    transport=UncitedFirst([200,429,200]);model,calls=router(tmp_path,503,transport)
    with pytest.raises(BudgetPaused,match='groq_rate_limit'):run(model)
    now=time.time();monkeypatch.setattr(time,'time',lambda:now+70)
    assert run(model)['report']=='Supported answer [S1].'
    assert len(calls)==1
    assert [r['model'] for r in transport.posts]==['openai/gpt-oss-120b','openai/gpt-oss-20b','openai/gpt-oss-20b']


def test_primary_schema_failure_falls_back_but_safety_refusal_never_does(tmp_path):
    transport=Transport();model,_=router(tmp_path,transport=transport)
    def client(result,reason='STOP'):
        return lambda **kwargs:SimpleNamespace(models=SimpleNamespace(generate_content=lambda **args:SimpleNamespace(text=json.dumps(result),candidates=[SimpleNamespace(finish_reason=reason)],usage_metadata=SimpleNamespace(total_token_count=10))))
    model.primary.client_factory=client({'unexpected':'schema'})
    assert run(model)['report']=='Supported answer [S1].' and len(transport.posts)==1
    refused,unused=router(tmp_path/'refused',transport=Transport())
    refused.primary.client_factory=client({'refusal':'Cannot provide that'},'SAFETY')
    with pytest.raises(ModelUnavailable,match='refused'):run(refused)
    assert not refused.transport.posts
