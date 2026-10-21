import asyncio,copy
import pytest
from astra_ai.core.background_budget import BackgroundBudget,BudgetPaused
from astra_ai.core.background_model import ModelUnavailable
from astra_ai.core.research_model import GeminiResearchModel,canonical_citations,composition_signature

SOURCES=[{'url':'https://example.com/'+str(i),'title':'Evidence '+str(i),'retrieved_at':'2026-10-21','content':'Supported company, models, pricing and comparison evidence. '*500} for i in range(12)]
PLAN={'title':'Company, Models and Outlook','sections':[{'heading':h,'focus':h+' with evidence and limitations'} for h in ('Company and history','Models and comparisons','Outlook and limitations')]}

def test_sections_resume_after_quota_without_rewriting_completed_prose(tmp_path):
    saved=[];calls=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            assert sum(len(s['content']) for s in payload['evidence'])<=18000
            if 'written_report' in payload:return {'report':'### Requested leadership\n\nSupported CEO and founders [S1].','after_section':0}
            if 'section_index' not in payload:return copy.deepcopy(PLAN)
            if len(calls)==3:raise BudgetPaused(9999999999,'gemini_rate_limit')
            return {'report':'## '+payload['write_section']['heading']+'\n\n'+('Supported substantive findings. '*150)+' [S1].'}
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Full detailed company report',SOURCES,checkpoint=checkpoint))
    assert len(saved[-1]['parts'])==1 and len(calls)==3
    restarted=Model(lambda:'test',model.budget,lambda:'configured')
    report=asyncio.run(restarted.report('Full detailed company report',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert len(calls)==6 and report.count('## Company and history')==1 and len(report)>12000
    assert report.index('Supported CEO')<report.index('## Models and comparisons')
    assert [p['section_index'] for p in calls if 'section_index' in p]==[1,2,2,3]
    assert len(saved[-1]['parts'])==3
    cached=asyncio.run(restarted.report('Full detailed company report',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert cached==report and len(calls)==6


@pytest.mark.parametrize('bad_part',['## Findings\n\nUnsupported [S99].','## Findings\n\nAn unfinished finding [S1]'])
def test_invalid_section_is_never_checkpointed_as_complete(tmp_path,bad_part):
    saved=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):return {'report':bad_part} if 'section_index' in payload else copy.deepcopy(PLAN)
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Full company report',SOURCES,checkpoint=checkpoint))
    assert saved[-1]['parts']==[] and saved[-1]['pending_section_repair']['text']==bad_part
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Full company report',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert saved[-1]['pending_section_repair']['attempted'] is True
    with pytest.raises(ModelUnavailable):asyncio.run(model.report('Full company report',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert saved[-1]['parts']==[]


def test_changed_brief_or_evidence_cannot_reuse_another_composition(tmp_path):
    calls=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            if 'written_report' in payload:return {'report':'','after_section':0}
            return {'report':'## Findings\n\nSupported complete findings [S1].'} if 'section_index' in payload else copy.deepcopy(PLAN)
    saved=[]
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    asyncio.run(model.report('Original brief',SOURCES,checkpoint=checkpoint));old=copy.deepcopy(saved[-1])
    asyncio.run(model.report('Different brief',SOURCES,state=old,checkpoint=checkpoint))
    assert len(calls)==10 and saved[-1]['signature']!=old['signature']


@pytest.mark.parametrize('recover',[True,False])
def test_service_outage_retries_are_bounded_and_reuse_sources(tmp_path,recover):
    from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
    from astra_ai.core.research_model import ResearchModelUnavailable
    context={'profile_id':'owner','project_id':'project','session_id':'session'}
    store=ResearchArtifacts(tmp_path/'reports.json');calls=[];searches=[]
    async def synth(query,sources):
        calls.append(query)
        if len(calls)<3 or not recover:raise ResearchModelUnavailable('Service unavailable')
        return '# Complete answer\n\nSupported facts [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:(searches.append(args) or ([SOURCES[0]],None))
    args={'query':'A detailed company report','mode':'detailed'}
    results=[asyncio.run(service.search(args,context,'original')) for _ in range(3)]
    assert [r['status'] for r in results]==['waiting_for_retry','waiting_for_retry','completed' if recover else 'failed']
    assert len(searches)==1 and len(calls)==3


def test_each_saved_stage_yields_without_publishing_partial_answer(tmp_path):
    from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
    context={'profile_id':'owner','project_id':'project','session_id':'session'}
    store=ResearchArtifacts(tmp_path/'reports.json');model_calls=[];searches=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            model_calls.append(payload)
            if 'written_report' in payload:return {'report':'','after_section':0}
            if 'section_index' not in payload:return copy.deepcopy(PLAN)
            return {'report':'## '+payload['write_section']['heading']+'\n\n'+('Substantive supported findings. '*160)+' [S1].'}
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    async def synth(query,sources):
        row=next(iter(store.snapshot()['requests'].values()))
        async def checkpoint(value):
            store.request_state(row['id'],context,synthesis_checkpoint=value)
            raise BudgetPaused(1,'research_section_saved')
        return await model.report(query,sources,state=row.get('synthesis_checkpoint',{}),checkpoint=checkpoint)
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:(searches.append(args) or ([SOURCES[0]],None))
    args={'query':'A complete detailed report','mode':'detailed'}
    for _ in range(5):
        result=asyncio.run(service.search(args,context,'original'))
        assert result['status']=='waiting_for_retry' and result['reason']=='research_section_saved'
        doc=store.document(result['research_id'],context)
        assert doc['phase']=='preparing_report' and not doc['report']
    result=asyncio.run(service.search(args,context,'original'))
    assert result['status']=='completed' and len(model_calls)==5 and len(searches)==1
    assert len(store.get(result['research_id'],context)['artifact']['report'])>12000


def test_quota_before_first_section_keeps_report_pending_then_publishes_same_identity(tmp_path):
    """A quota screen is not a short answer; resume writing without another search."""
    from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
    context={'profile_id':'owner','project_id':'project','session_id':'session'}
    store=ResearchArtifacts(tmp_path/'reports.json');searches=[];calls=[];blocked=True
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            if blocked:raise BudgetPaused(9999999999,'gemini_daily_quota')
            if 'written_report' in payload:return {'report':'','after_section':0}
            if 'section_index' not in payload:return copy.deepcopy(PLAN)
            return {'report':'## '+payload['write_section']['heading']+'\n\n'+('Substantive supported findings. '*160)+' [S1].'}
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    async def synth(query,sources):
        row=next(iter(store.snapshot()['requests'].values()))
        async def checkpoint(value):
            store.request_state(row['id'],context,synthesis_checkpoint=value)
            raise BudgetPaused(1,'research_section_saved')
        return await model.report(query,sources,state=row.get('synthesis_checkpoint',{}),checkpoint=checkpoint)
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:(searches.append(args) or ([SOURCES[0]],None))
    args={'query':'Compare graph memory and vector RAG for a local AI assistant, including latency, accuracy, persistence and state management.','mode':'detailed'}
    pending=asyncio.run(service.search(args,context,'memory-comparison'))
    identifier=pending['research_id']
    assert pending['status']=='waiting_for_quota' and pending['reason']=='gemini_daily_quota'
    document=store.document(identifier,context)
    assert document['phase']=='waiting_for_quota' and not document['report']
    assert not document['sources'] and len(calls)==1
    assert len(store.request_state(identifier,context)['sources'])==1
    blocked=False
    for _ in range(5):
        resumed=asyncio.run(service.search(args,context,'memory-comparison'))
        assert resumed['research_id']==identifier and resumed['status']=='waiting_for_retry'
        assert not store.document(identifier,context)['report']
    completed=asyncio.run(service.search(args,context,'memory-comparison'))
    assert completed['research_id']==identifier and completed['status']=='completed'
    assert len(store.document(identifier,context)['report'])>12000
    assert len(searches)==1 and len(calls)==6
    assert len(store.snapshot()['requests'])==1


@pytest.mark.parametrize('invalid',[False,True])
def test_low_remaining_budget_finishes_saved_sections_and_reviews_in_one_call(tmp_path,invalid):
    from datetime import datetime,timezone
    from astra_ai.memory.shared_memory import atomic
    from astra_ai.core.research_model import composition_signature,composition_ready
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=50000,min_interval=0)
    atomic(budget.path,{'day':datetime.now(timezone.utc).date().isoformat(),'tokens':33000,'requests':10})
    first='## Company and history\n\n'+('Substantive supported findings. '*200)+' [S1].'
    state={'signature':composition_signature('Full brief',SOURCES),'plan':copy.deepcopy(PLAN),'parts':[first]}
    calls=[];saved=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            assert len(payload['remaining_sections'])==2 and payload['written_report']==first
            assert sum(len(s['content']) for s in payload['evidence'])<=12000
            assert max_tokens==6500
            comparison='## Models and comparisons\n\n'+('Supported comparison. '*200)+(' [S99].' if invalid else ' [S1].')
            return {'parts':[comparison,
                '## Outlook and limitations\n\n'+('Supported practical guidance. '*150)+' [S2].'],'after_section':0,'report':''}
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',budget,lambda:'configured')
    if invalid:
        with pytest.raises(ModelUnavailable):asyncio.run(model.report('Full brief',SOURCES,state=state,checkpoint=checkpoint))
        assert saved==[] and state['parts']==[first]
    else:
        report=asyncio.run(model.report('Full brief',SOURCES,state=state,checkpoint=checkpoint))
        assert len(calls)==1 and len(report)>12000 and report.count(first)==1
        assert composition_ready({'query':'Full brief','sources':SOURCES,'synthesis_checkpoint':saved[-1]})
        assert asyncio.run(model.report('Full brief',SOURCES,state=saved[-1],checkpoint=checkpoint))==report
        assert len(calls)==1


def test_complete_substantive_section_is_not_discarded_at_eight_thousand_characters(tmp_path):
    calls=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            if 'written_report' in payload:return {'report':'','after_section':0}
            if 'section_index' not in payload:return copy.deepcopy(PLAN)
            return {'report':'## '+payload['write_section']['heading']+'\n\n'+('Substantive supported findings. '*280)+' [S1].'}
    saved=[]
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    report=asyncio.run(model.report('Full brief',SOURCES,checkpoint=checkpoint))
    assert len(saved[-1]['parts'][0])>8000 and len(calls)==5
    assert report.count('## Company and history')==1


def test_invalid_section_and_review_repair_once_from_durable_drafts_without_rewriting_prior_sections(tmp_path):
    from astra_ai.core.research_model import composition_signature,composition_ready
    first='## Company and history\n\nSupported complete findings [S1].'
    state={'signature':composition_signature('Full brief',SOURCES),'plan':copy.deepcopy(PLAN),'parts':[first]}
    saved=[];sections=[];reviews=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            if 'section_index' in payload:
                sections.append(payload['section_index'])
                if payload['section_index']==2 and 'unvalidated_draft' not in payload:return {'report':'## Comparison\n\nSupported but unfinished [S1]'}
                if 'unvalidated_draft' in payload:assert payload['unvalidated_draft'].endswith('[S1]')
                return {'report':'## '+payload['write_section']['heading']+'\n\nSupported complete comparison [S1].'}
            reviews.append(payload)
            assert 'maxLength' not in schema['properties']['report']
            return {'after_section':2,'report':'' if 'unvalidated_note' in payload else 'Unfinished note [S1]'}
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Full brief',SOURCES,state=state,checkpoint=checkpoint))
    assert saved[-1]['parts']==[first]
    with pytest.raises(BudgetPaused):asyncio.run(model.report('Full brief',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert len(saved[-1]['parts'])==3 and not saved[-1].get('coverage_checked')
    report=asyncio.run(model.report('Full brief',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert sections==[2,2,3] and len(reviews)==2 and report.count(first)==1
    assert 'pending_section_repair' not in saved[-1] and 'pending_coverage_repair' not in saved[-1]
    assert composition_ready({'query':'Full brief','sources':SOURCES,'synthesis_checkpoint':saved[-1]})


def test_parenthesized_citations_keep_valid_ids_without_changing_code_or_inventing_evidence():
    text='Supported (S1, S2). Unknown (S99). Prose (see source one). `literal (S1)`\n```\n(S2)\n```'
    assert canonical_citations(text)=='Supported [S1, S2]. Unknown [S99]. Prose (see source one). `literal (S1)`\n```\n(S2)\n```'


def test_saved_valid_parenthesized_section_recovers_without_another_writing_request(tmp_path):
    saved=[];calls=[]
    part='## Company and history\n\nSupported full company facts (S1, S2).'
    state={'signature':composition_signature('Full brief',SOURCES),'plan':copy.deepcopy(PLAN),'parts':[],
        'pending_section_repair':{'index':0,'text':part,'attempted':True}}
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            if 'written_report' in payload:return {'report':'Supported gap (S1).','after_section':0}
            assert payload['section_index'] in (2,3)
            return {'report':'## '+payload['write_section']['heading']+'\n\nSupported complete findings (S1, S2).'}
    async def checkpoint(value):saved.append(value)
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured')
    report=asyncio.run(model.report('Full brief',SOURCES,state=state,checkpoint=checkpoint))
    assert canonical_citations(part) in report and len(calls)==3
    assert 'pending_section_repair' not in saved[-1] and 'Supported gap [S1].' in report


@pytest.mark.parametrize('message,kind',[
    ('Gemini answer reached its output limit before completion','output_limit'),
    ('Research section is incomplete or unverifiable','incomplete_section'),
    ('provider-secret-that-must-not-be-persisted','unavailable')])
def test_failed_writing_retains_only_a_safe_diagnostic_not_provider_messages(tmp_path,message,kind):
    from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
    context={'profile_id':'owner','project_id':'project','session_id':'session'}
    store=ResearchArtifacts(tmp_path/'reports.json')
    async def synth(*args):raise ModelUnavailable(message)
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:([SOURCES[0]],None)
    result=asyncio.run(service.search({'query':'Detailed comparison','mode':'detailed'},context,'original'))
    assert result['status']=='failed'
    row=store.request_state(result['research_id'],context)
    assert row['synthesis_failure_kind']==kind
    assert not store.document(result['research_id'],context)['report']
    assert message not in store.path.read_text(encoding='utf-8')
