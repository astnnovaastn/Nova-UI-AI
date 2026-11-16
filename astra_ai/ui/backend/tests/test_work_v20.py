"""V20 compatibility and execution contracts. All providers are deterministic fakes."""
import copy
import pytest
from astra_ai.core.work.task_graph import compile_plan, validate, ready, coverage
from astra_ai.core.work.workspace_objects import validate as validate_object, project
from astra_ai.core.work.contracts import RunState
from astra_ai.core.work.canvas_layout import STRATEGIES
from astra_ai.core.work.catalog import WORKFLOWS


def test_small_prompt_does_not_require_specialist_stages():
    graph = compile_plan({'needs_web': False, 'sections':['Answer']}, 'quick-research')
    assert [n['type'] for n in graph['nodes']] == ['write', 'publish']
    assert [n['id'] for n in ready(graph, [])] == ['write']
    assert [n['id'] for n in ready(graph, ['write'])] == ['publish']
    assert [n['id'] for n in ready(graph, {'write':False})] == ['write']
    assert graph['planning_agents'] == 1


@pytest.mark.parametrize('mutation', ['cycle', 'missing', 'capability', 'type', 'duplicate'])
def test_invalid_graph_cannot_grant_execution(mutation):
    graph=compile_plan({'needs_web':False})
    if mutation=='cycle':graph['nodes'][0]['depends_on']=['publish']
    if mutation=='missing':graph['nodes'][0]['depends_on']=['ghost']
    if mutation=='capability':graph['nodes'][0]['capabilities']=['shell']
    if mutation=='type':graph['nodes'][0]['type']='send_email'
    if mutation=='duplicate':graph['nodes'].append(copy.deepcopy(graph['nodes'][0]))
    with pytest.raises(ValueError):validate(graph)


def test_evidence_gap_is_not_reported_complete():
    result=coverage({'sections':['Robot architecture']},[{'id':'S1','title':'Hotel prices'}],'# Robot architecture\nUnknown')
    assert result['complete'] is False
    assert result['requirements'][0]['source_ids']==[]


def test_object_validation_retains_long_report_and_rejects_active_content():
    text='A long report. '*30000
    value={'id':'r','kind':'report','title':'Result','revision':1,'body':text,'script':'alert(1)'}
    assert validate_object(value)['body']==text
    assert 'script' not in validate_object(value)
    with pytest.raises(ValueError):validate_object({**value,'kind':'javascript'})
    with pytest.raises(ValueError):validate_object({**value,'url':'javascript:alert(1)'})


def test_all_twenty_five_families_are_saveable():
    families={'focused-answer','parallel-investigation','branching-research','evidence-convergence','architecture-atlas','dependency-explorer','source-collections','comparison-desk','timeline-milestones','execution-board','daily-schedule','research-publication','visual-moodboard','ui-teardown','debugging-workbench','decision-workspace','knowledge-constellation','document-production','market-landscape','mixed-result','claim-review','code-walkthrough','change-review','priority-inbox','trip-budget'}
    assert len(families)==25 and families<=STRATEGIES


def test_projection_does_not_mutate_recorded_sources():
    from types import SimpleNamespace
    evidence=[{'id':'S1','title':'Source','url':'https://example.org'}]
    run=SimpleNamespace(evidence=evidence,plan={},artifacts=[])
    objects=project(run,'# Result\n\n| Name | Price |\n| -- | -- |\n| A | Unknown |\n\n- [ ] Review evidence')
    assert [o['kind'] for o in objects]==['report','comparison','checklist']
    assert objects[0]['sources']==evidence
    assert evidence==[{'id':'S1','title':'Source','url':'https://example.org'}]


def test_unmatched_section_is_explicit_and_partial(tmp_path):
    import asyncio
    from test_work_relations import SectionAdapter, deep_run
    from test_work_runs import CONTEXT
    adapter=SectionAdapter()
    adapter.plan['sections']=['Costs','Lifetimes','Unestablished alien capability']
    service,artifacts,identifier=deep_run(tmp_path,adapter)
    asyncio.run(service.run(identifier,CONTEXT))
    run=service.store.get(identifier)
    assert run.state=='partial'
    assert 'Evidence gap:' in run.results['report_text']
    assert run.results['report_text']==artifacts.get(identifier,CONTEXT)['artifact']['report']
    assert any(f['reason']=='report_evidence_gaps' for f in run.results['report_failures'])


@pytest.mark.parametrize('workflow',list(WORKFLOWS))
def test_every_existing_workflow_uses_fake_providers_and_preserves_publication(tmp_path,workflow):
    import asyncio
    from test_work_runs import FakeAdapter, build, start, CONTEXT
    adapter=FakeAdapter()
    service,artifacts,_=build(tmp_path,adapter)
    identifier=start(service,artifacts,query='Supplied fixture context for '+workflow,workflow=workflow)
    result=asyncio.run(service.run(identifier,CONTEXT))
    run=service.store.get(identifier)
    assert result['status']=='completed'
    assert run.schema_version==2
    validate(run.task_graph)
    assert run.task_graph['workflow']==workflow
    assert artifacts.get(identifier,CONTEXT)['artifact']['report']==run.results['report_text']
    assert run.canvas_objects[0]['body']==run.results['report_text']
    assert adapter.calls and all(c['model'].endswith('-test') or c['slot']!='lead' for c in adapter.calls)

def test_selected_account_context_reaches_planning_and_writing_without_web(tmp_path):
    import asyncio
    from test_work_runs import FakeAdapter, build, CONTEXT
    from astra_ai.core.work.contracts import WorkRequest,LEAD_PLAN,REPORT
    class AccountAdapter(FakeAdapter):
        def __init__(self):
            super().__init__(plan={'needs_web':False})
            self.inputs=[]
        def answer(self,schema,payload):
            self.inputs.append((schema,payload))
            return super().answer(schema,payload)
    adapter=AccountAdapter()
    service,artifacts,search=build(tmp_path,adapter)
    chosen=[{'id':'calendar:fixture','kind':'calendar','title':'Review meeting','summary':'2026-11-16 10:00–11:00'}]
    reserved=artifacts.reserve('Plan with selected context','quick',CONTEXT,'fixture-account')
    service.create(reserved['id'],WorkRequest('Plan with selected context','plan-my-day',chosen=chosen),CONTEXT)
    asyncio.run(service.run(reserved['id'],CONTEXT))
    for schema in (LEAD_PLAN,REPORT):
        assert any(s is schema and p.get('chosen_canvas_items')==chosen for s,p in adapter.inputs)
    assert not search.queries
    assert service.store.get(reserved['id']).request['chosen']==chosen


def test_scheduler_follows_dependencies_not_fixed_stage_order_and_retries_only_failure(tmp_path,monkeypatch):
    import asyncio
    from test_work_runs import FakeAdapter,build,start,CONTEXT
    from astra_ai.core.work.orchestrator import _Run
    from astra_ai.core.work.providers import ProviderError
    service,artifacts,_=build(tmp_path,FakeAdapter())
    identifier=start(service,artifacts)
    run=service.store.get(identifier)
    run.done={'plan':True}
    graph=compile_plan({'needs_web':True,'assignments':[{'role':'analysis'},{'role':'verification'}]})
    # Independent verification branch comes first; discovery fails, but analysis completes.
    nodes={n['id']:n for n in graph['nodes']}
    nodes['verify']['depends_on']=[]
    nodes['discover']['depends_on']=['verify']
    nodes['analyze']['depends_on']=['verify']
    nodes['fill_gaps']['depends_on']=['discover','analyze']
    graph['nodes']=[nodes[k] for k in ['verify','discover','analyze','fill_gaps','write','publish']]
    run.task_graph=validate(graph)
    service.store.save(run)
    calls=[]
    failed=True
    def handler(name):
        async def invoke(self):
            calls.append(name)
            if name=='discover' and failed:raise ProviderError('unavailable')
        return invoke
    for name in nodes:monkeypatch.setattr(_Run,'_'+name,handler(name))
    result=asyncio.run(service.run(identifier,CONTEXT))
    assert result['status']=='failed'
    assert calls==['verify','discover','analyze']
    assert service.store.get(identifier).done['analyze']
    failed=False
    calls.clear()
    asyncio.run(service.run(identifier,CONTEXT))
    assert calls==['discover','fill_gaps','write','publish']

