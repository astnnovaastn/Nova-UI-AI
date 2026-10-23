import asyncio,copy
import pytest
from astra_ai.core.background_budget import BackgroundBudget,BudgetPaused
from astra_ai.core.background_model import ModelUnavailable
from astra_ai.core.research_model import GeminiResearchModel,composition_ready,ResearchModelUnavailable,composition_signature

SOURCES=[{'url':'https://example.org/'+str(i),'title':'Evidence '+str(i),'content':'Supported mechanisms, comparisons, practical recommendations and limitations. '*150,'retrieved_at':'2026-10-22'} for i in range(12)]
def result(short=False):
    sections=[]
    for heading in ('Direct answer and context','Mechanisms and comparisons','Recommendations and limitations'):
        sections.append({'heading':heading,'focus':heading,'report':'## '+heading+'\n\n'+('Supported findings with concrete mechanisms, comparisons and evidence limitations. '*(2 if short else 65))+' [S1].'})
    return {'title':'Full detailed research','sections':sections}

def model(tmp_path,replies):
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            self.calls.append(payload)
            assert 5000<=max_tokens<=12000 and len(payload['evidence'])==12
            self.output_tokens=max_tokens
            assert sum(len(row['content']) for row in payload['evidence'])<=36000
            value=replies[min(len(self.calls)-1,len(replies)-1)]
            if isinstance(value,Exception):raise value
            return copy.deepcopy(value)
    item=Model(lambda:'private-test-key',BackgroundBudget(tmp_path/'budget.json'),lambda:'gemini-3.6-flash');item.batch_detailed=True;item.calls=[]
    return item

def test_full_depth_is_written_once_then_checkpoint_resume_uses_no_provider(tmp_path):
    item=model(tmp_path,[result()]);saved=[]
    async def checkpoint(value):saved.append(value);raise BudgetPaused(9999999999,'research_section_saved')
    with pytest.raises(BudgetPaused):asyncio.run(item.report('A full detailed comparison with recommendations',SOURCES,checkpoint=checkpoint))
    assert composition_ready({'query':'A full detailed comparison with recommendations','sources':SOURCES,'synthesis_checkpoint':saved[-1]})
    text=asyncio.run(item.report('A full detailed comparison with recommendations',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert len(text)>=12000 and len(item.calls)==1 and text.count('\n## ')==3


def test_near_budget_compacts_evidence_without_shortening_the_report(tmp_path):
    from datetime import datetime,timezone
    from astra_ai.memory.shared_memory import atomic
    item=model(tmp_path,[result()]);item.budget.daily_tokens=600000
    atomic(item.budget.path,{'day':datetime.now(timezone.utc).date().isoformat(),'requests':10,'tokens':579000})
    async def checkpoint(value):pass
    text=asyncio.run(item.report('Detailed comparison with recommendations',SOURCES,checkpoint=checkpoint))
    assert len(text)>=12000 and len(item.calls)==1
    assert sum(len(row['content']) for row in item.calls[0]['evidence'])<=12000
    assert item.calls[0]['minimum_report_characters']==12000


def test_short_candidate_is_not_published_and_one_repair_restores_full_depth(tmp_path):
    item=model(tmp_path,[result(True),result()]);saved=[]
    async def checkpoint(value):saved.append(value);raise BudgetPaused(9999999999,'research_section_saved')
    for state in ({},None):
        with pytest.raises(BudgetPaused):asyncio.run(item.report('Full depth comparison',SOURCES,state=state or (saved[-1] if saved else {}),checkpoint=checkpoint))
    assert not saved[0].get('coverage_checked') and 'candidate' in saved[0]
    text=asyncio.run(item.report('Full depth comparison',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert len(text)>=12000 and len(item.calls)==2


@pytest.mark.parametrize('used',[585102,588157])
def test_near_budget_repair_keeps_full_depth_with_bounded_input_and_output(tmp_path,used):
    from datetime import datetime,timezone
    from astra_ai.memory.shared_memory import atomic
    item=model(tmp_path,[result()]);item.budget.daily_tokens=600000
    atomic(item.budget.path,{'day':datetime.now(timezone.utc).date().isoformat(),'requests':53,'tokens':used})
    state={'signature':composition_signature('Detailed research',SOURCES),'batch_attempts':1,'composition_version':2,'candidate':result(True)}
    async def checkpoint(value):pass
    text=asyncio.run(item.report('Detailed research',SOURCES,state=state,checkpoint=checkpoint))
    assert len(text)>=12000 and 5000<=item.output_tokens<=6000
    assert item.calls[0]['minimum_report_characters']==12000
    assert sum(len(row['content']) for row in item.calls[0]['evidence'])<=6000


@pytest.mark.parametrize('bad',[{'title':'Bad','sections':None},result(True)])
def test_repair_attempts_are_bounded_and_cannot_publish_short_or_malformed_content(tmp_path,bad):
    item=model(tmp_path,[bad]);saved=[]
    async def checkpoint(value):saved.append(value);raise BudgetPaused(9999999999,'research_section_saved')
    for _ in range(2):
        with pytest.raises(BudgetPaused):asyncio.run(item.report('Detailed research',SOURCES,state=saved[-1] if saved else {},checkpoint=checkpoint))
    with pytest.raises(ModelUnavailable):asyncio.run(item.report('Detailed research',SOURCES,state=saved[-1],checkpoint=checkpoint))
    assert len(item.calls)==2 and not saved[-1].get('coverage_checked')


def test_real_quota_pause_preserves_state_without_spending_another_attempt(tmp_path):
    item=model(tmp_path,[BudgetPaused(9999999999,'gemini_daily_quota')]);saved=[]
    async def checkpoint(value):saved.append(value)
    with pytest.raises(BudgetPaused,match='gemini_daily_quota'):asyncio.run(item.report('Detailed research',SOURCES,checkpoint=checkpoint))
    assert saved==[] and len(item.calls)==1


def test_invalid_source_ids_are_never_marked_ready(tmp_path):
    bad=result();bad['sections'][1]['report']=bad['sections'][1]['report'].replace('[S1]','[S99]')
    item=model(tmp_path,[bad]);saved=[]
    async def checkpoint(value):saved.append(value);raise BudgetPaused(9999999999,'research_section_saved')
    with pytest.raises(BudgetPaused):asyncio.run(item.report('Detailed research',SOURCES,checkpoint=checkpoint))
    assert not saved[-1].get('coverage_checked')


def test_service_outage_does_not_consume_composition_repairs(tmp_path):
    item=model(tmp_path,[ResearchModelUnavailable('Service unavailable')]);saved=[]
    async def checkpoint(value):saved.append(value)
    with pytest.raises(ResearchModelUnavailable):asyncio.run(item.report('Detailed research',SOURCES,checkpoint=checkpoint))
    assert saved==[] and len(item.calls)==1


def test_empty_legacy_service_checkpoint_recovers_without_resetting_budget(tmp_path):
    item=model(tmp_path,[result()]);saved=[]
    state={'signature':composition_signature('Detailed research',SOURCES),'composition_mode':'single_pass','batch_attempts':2,'validation_issue':'The previous request did not return a complete structured report.'}
    async def checkpoint(value):saved.append(value)
    text=asyncio.run(item.report('Detailed research',SOURCES,state=state,checkpoint=checkpoint))
    assert len(text)>=12000 and len(item.calls)==1 and saved[-1]['batch_attempts']==1
    assert saved[-1]['composition_version']==2


@pytest.mark.parametrize('deferred',[False,True])
def test_strict_model_never_silently_uses_another_model(tmp_path,deferred):
    calls=[]
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs['model'])
            error=Exception('service unavailable');error.code=503;raise error
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'strict.json',min_interval=0)
    if deferred:
        import time
        budget.defer_model('gemini-3.6-flash','test',time.time()+600)
    item=GeminiResearchModel(lambda:'test',budget,lambda:'gemini-3.6-flash',Client);item.allow_model_fallback=False
    with pytest.raises(BudgetPaused if deferred else ResearchModelUnavailable):item.structured('Write',{}, {'type':'object'})
    assert calls==([] if deferred else ['gemini-3.6-flash'])
    assert budget.snapshot().get('requests',0)==(0 if deferred else 1)
