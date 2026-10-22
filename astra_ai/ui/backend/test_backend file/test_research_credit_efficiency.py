import asyncio,time
from types import SimpleNamespace
import pytest
from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
from astra_ai.core.background_budget import BudgetPaused

CTX={'profile_id':'owner','project_id':'alpha','session_id':'same-session'}
SOURCE={'retrieved_at':'2026-10-22T08:00:00+00:00','url':'https://example.org/telescopes','title':'Telescope instruments','content':'General telescope evidence. '*200+'Ultraviolet NIRSpec MIRI spectroscopy exoplanet atmospheres.'}


def setup(tmp_path,synthesize):
    store=ResearchArtifacts(tmp_path/'reports.json')
    item=store.save('Telescope comparison','detailed','## Telescopes\n\nA comparison [S1].',[SOURCE],[],CTX,'initial')
    return store,ResearchSearch(store,lambda key:'fixture',synthesize=synthesize),item


def test_saved_report_and_later_evidence_prevent_unnecessary_tavily_search(tmp_path):
    calls=[]
    async def compose(query,sources):calls.append(sources);return '## Atmospheric spectroscopy\n\nSupported additional findings [S1].'
    store,service,item=setup(tmp_path,compose)
    service._request=lambda *args:pytest.fail('Saved evidence must be reused before spending a search credit')
    detail='Add more detail to this same report: explain ultraviolet NIRSpec MIRI spectroscopy exoplanet atmospheres. Use the evidence already saved first; append a substantial connected explanation with citations.'
    result=asyncio.run(service.expand_report({'research_id':item['id'],'research_revision':item['revision'],'detail':detail},CTX,'follow-up'))
    assert result['status']=='completed' and len(calls)==1
    again=asyncio.run(service.expand_report({'research_id':item['id'],'research_revision':item['revision'],'detail':detail},CTX,'follow-up'))
    assert again['status']=='completed' and len(calls)==1


def test_narrow_missing_evidence_uses_basic_search_and_retries_reuse_receipt(tmp_path):
    outbound=[];writes=[]
    class Transport:
        def post(self,url,**kwargs):
            outbound.append(kwargs)
            return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{'url':'https://example.org/cryogenic','title':'Cryogenic detectors','raw_content':'Cryogenic detector calibration thermal drift measurement evidence.'}]})
    async def compose(query,sources):
        writes.append(query)
        if len(writes)==1:raise BudgetPaused(time.time()+15,'background_request_interval')
        return '## Cryogenic calibration\n\nSupported detector findings [S2].'
    store,service,item=setup(tmp_path,compose);service.transport=Transport()
    args={'research_id':item['id'],'research_revision':item['revision'],'detail':'Research cryogenic detector calibration thermal drift measurements','mode':'detailed'}
    result=asyncio.run(service.expand_report(args,CTX,'gap'))
    assert result['status']=='waiting_for_retry' and 'not a daily allowance' in result['summary']
    assert store.extension_state(item['id'],CTX)['phase']=='preparing_report'
    assert asyncio.run(service.expand_report(args,CTX,'gap'))['status']=='completed'
    assert len(outbound)==1
    body=outbound[0]['json']
    assert body['search_depth']=='basic' and body['include_raw_content']=='markdown' and body['include_answer'] is False
    assert outbound[0]['headers']['Authorization']=='Bearer fixture'


def test_detailed_initial_request_collects_twelve_sources_in_one_advanced_call(tmp_path):
    calls=[]
    class Transport:
        def post(self,url,**kwargs):
            calls.append(kwargs)
            return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[SOURCE]})
    store=ResearchArtifacts(tmp_path/'reports.json')
    service=ResearchSearch(store,lambda key:'fixture',Transport())
    asyncio.run(service.search({'query':'A detailed telescope investigation','mode':'detailed'},CTX,'deep'))
    assert len(calls)==1 and calls[0]['json']['max_results']==12 and calls[0]['json']['search_depth']=='advanced'


@pytest.mark.parametrize('reason',['gemini_daily_quota','background_daily_budget'])
def test_real_provider_and_local_caps_remain_quota_waits(tmp_path,reason):
    async def compose(*args):raise BudgetPaused(time.time()+3600,reason)
    store,service,item=setup(tmp_path,compose)
    result=asyncio.run(service.expand_report({'research_id':item['id'],'research_revision':item['revision'],'detail':'More details'},CTX,'limit'))
    assert result['status']=='waiting_for_quota' and result['reason']==reason
    assert store.extension_state(item['id'],CTX)['phase']=='waiting_for_quota'


