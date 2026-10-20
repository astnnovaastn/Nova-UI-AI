"""Quick/deep isolation, topic reuse, publication and recoverable history operations."""
import asyncio
from types import SimpleNamespace
import pytest
from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
from astra_ai.core.research_topics import search_key,conversational_mode,topic_identity
from astra_ai.core.background_budget import BudgetPaused

CTX={'profile_id':'owner','project_id':'work','session_id':'conversation','turn_id':'one'}
SOURCE={'url':'https://example.com/evidence','title':'Evidence','content':'Verified football evidence.','retrieved_at':'2026-10-20'}

def test_provider_keys_are_separate_and_never_cross_fallbacks():
    values={'QUICK_SEARCH_API_KEY':'quick','DEEP_RESEARCH_API_KEY':'deep','SERPAPI_KEY':'old-quick','TAVILY_API_KEY':'old-deep'}
    assert search_key(values.get,'quick')=='quick' and search_key(values.get,'detailed')=='deep'
    assert search_key({'DEEP_RESEARCH_API_KEY':'deep'}.get,'quick') is None
    assert search_key({'QUICK_SEARCH_API_KEY':'quick'}.get,'detailed') is None
    assert search_key({'SERPAPI_KEY':'old'}.get,'quick')=='old'

def test_normal_conversation_cannot_silently_choose_deep():
    assert conversational_mode({'mode':'detailed'},{'user_text':'Who won today?'})=='quick'
    assert conversational_mode({'mode':'detailed'},{'user_text':'Prepare an extensive investigation comparing the evidence.'})=='detailed'
    assert conversational_mode({'mode':'detailed'},{'requested_research':True})=='detailed'
    assert conversational_mode({},CTX)=='quick'

def test_topic_identity_is_daily_and_conversation_owner_scoped():
    stamp=1792454400
    a=topic_identity(CTX,'La Liga results','football',stamp)
    assert a==topic_identity(CTX,'Champions League scores','football',stamp)
    for change in ({'session_id':'other'},{'profile_id':'other'},{'project_id':'other'},{'guest':True}):
        assert a!=topic_identity({**CTX,**change},'La Liga results','football',stamp)
    assert a!=topic_identity(CTX,'La Liga results','football',stamp+86400)
    assert a!=topic_identity(CTX,'Weather','weather',stamp)

def test_topic_followups_append_once_remap_citations_and_preserve_draft(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    parent=store.conversation_search('La Liga results',CTX,'football')
    item=store.save(parent['query'],'quick','# Football\n\nInitial answer [S1].',[SOURCE],[],CTX,parent['operation_id'])
    draft=store.save_draft(item['id'],CTX,item['revision'],'','<p>Personal edits</p>')['draft']
    same=store.conversation_search('Champions League fixtures',CTX,'football')
    assert same['id']==parent['id'] and same['followup']
    assert store.conversation_search('Weather today',CTX,'weather')['id']!=parent['id']
    calls=[];model=[]
    async def synth(query,sources):
        model.append(sources)
        return '# Upcoming fixtures\n\nThe supported fixtures are available [S2].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:(calls.append(a) or ([{**SOURCE,'url':'https://example.com/fixtures'}],None))
    args={'action':'topic_followup','research_id':item['id'],'query':'Champions League fixtures'}
    first=asyncio.run(service.search(args,CTX,'follow'))
    repeat=asyncio.run(service.search(args,CTX,'follow'))
    assert first['status']=='completed' and repeat['duplicate'] and len(calls)==len(model)==1
    assert first['results'][0]['id']=='S2' and first['results'][0]['url']=='https://example.com/fixtures'
    assert calls[0][1]=='quick' and len(model[0])==2
    assert len(store.snapshot()['extensions'][item['id']])==1
    assert len(store.source_catalog(store.get(item['id'],CTX)['artifact']))==2
    assert store.document(item['id'],CTX)['draft']==draft
    assert store.get(item['id'],CTX)['artifact']['report']==item['report']

def test_quick_quota_resume_reuses_checkpoint_without_search(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.conversation_search('Football scores',CTX,'football')
    item=store.save(row['query'],'quick','# Football\n\nResults [S1].',[SOURCE],[],CTX,row['operation_id'])
    calls=[];attempts=[]
    async def synth(*a):
        attempts.append(a)
        if len(attempts)==1:raise BudgetPaused(9999999999,'gemini_rate_limit')
        return '# Fixtures\n\nSupported fixtures [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:(calls.append(a) or ([SOURCE],None))
    args={'action':'topic_followup','research_id':item['id'],'query':'Upcoming football fixtures'}
    assert asyncio.run(service.search(args,CTX,'follow'))['status']=='waiting_for_quota'
    assert asyncio.run(service.search(args,CTX,'follow'))['status']=='completed'
    assert len(calls)==1 and len(attempts)==2

def test_bulk_removal_is_atomic_scoped_recoverable_and_revision_checked(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    rows=[store.save('Topic '+str(i),'quick','# Answer\n\nSupported [S1].',[SOURCE],[],CTX,str(i)) for i in range(3)]
    ids=[row['id'] for row in rows[:2]]
    preview=store.deletion_preview_many(ids,CTX)
    assert store.remove_many(ids,CTX,'stale','delete')['status']=='conflict'
    assert store.deletion_preview_many(ids,{**CTX,'project_id':'other'})['status']=='not_found'
    assert store.remove_many(ids,{**CTX,'guest':True},preview['revision'],'delete')['status']=='rejected'
    result=store.remove_many(ids,CTX,preview['revision'],'delete')
    assert result['status']=='completed' and store.listing(CTX)['total']==1
    for row in result['removed']:assert store.restore(row['research_id'],CTX,row['undo_token'])['status']=='completed'
    assert store.listing(CTX)['total']==3

def test_publication_is_atomic_and_stale_labels_are_reconciled(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.reserve('Football','quick',CTX,'one')
    store.request_state(row['id'],CTX,phase='preparing_report',waiting_reason='old',next_attempt=9999999999)
    item=store.save('Football','quick','# Football\n\nSupported answer [S1].',[SOURCE],[],CTX,'one')
    assert item['phase']=='complete' and store.request_state(row['id'],CTX)['next_attempt'] is None
    store.request_state(row['id'],CTX,phase='waiting_for_quota',next_attempt=9999999999)
    assert store.document(row['id'],CTX)['phase']=='complete'
    assert store.request_state(row['id'],CTX)['waiting_reason']==''


def test_cache_reuse_happens_before_placeholder_allocation_and_aliases_old_ghosts(tmp_path):
    from astra_ai.memory.shared_memory import atomic,read,stable
    store=ResearchArtifacts(tmp_path/'reports.json')
    first=store.reserve('Football results','quick',CTX,'first')
    assert store.reserve('Football results','quick',CTX,'rapid-repeat')['id']==first['id']
    item=store.save('Football results','quick','# Football\n\nSupported results [S1].',[SOURCE],[],CTX,'first')
    assert store.reserve('Football results','quick',CTX,'cached-repeat')['id']==item['id']
    assert len(store.snapshot()['requests'])==1
    data=read(store.path,{})
    ghost=stable('research-artifact','legacy-ghost')
    data['requests'][ghost]={**data['requests'][item['id']],'id':ghost,'operation_id':'legacy-ghost','phase':'waiting_for_quota','origin_turn_id':'followup','origin_session_id':CTX['session_id']}
    atomic(store.path,data)
    assert store.listing(CTX)['total']==1
    assert store.document(ghost,CTX)=={'status':'redirect','research_id':item['id']}
    assert store.get(ghost,CTX)['artifact']['id']==item['id']
    assert {'session_id':CTX['session_id'],'turn_id':'followup'} in store.snapshot()['thread_links'][item['id']]


def test_deleted_topic_can_be_restarted_and_keeps_followups_together(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    first=store.conversation_search('Football scores',CTX,'football')
    preview=store.deletion_preview(first['id'],CTX)
    store.remove(first['id'],CTX,preview['revision'],'delete')
    second=store.conversation_search('Football fixtures',CTX,'football')
    third=store.conversation_search('Football standings',CTX,'football')
    assert second['id']!=first['id'] and third['id']==second['id'] and third['followup']
    assert store.conversation_search('x'*12001,CTX,'football')['status']=='rejected'


def test_adopted_cached_report_keeps_a_stable_daily_topic_mapping(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    row=store.reserve('Football scores','quick',CTX,'original')
    item=store.save(row['query'],'quick','# Football\n\nResults [S1].',[SOURCE],[],CTX,row['operation_id'])
    reused=store.conversation_search('Football scores',CTX,'football')
    followup=store.conversation_search('Football standings',CTX,'football')
    assert reused['id']==followup['id']==item['id'] and followup['followup']


def test_restart_only_requeues_already_published_results_not_model_quota_waits(tmp_path):
    from astra_ai.core.action_jobs import ActionJobs
    from astra_ai.core.research_model import resume_published_research
    store=ResearchArtifacts(tmp_path/'reports.json')
    ready=store.reserve('Ready topic','quick',CTX,'ready')
    store.save(ready['query'],'quick','# Answer\n\nSupported [S1].',[SOURCE],[],CTX,ready['operation_id'])
    pending=store.reserve('Waiting topic','quick',CTX,'waiting')
    jobs=ActionJobs(tmp_path/'jobs.json',None,None,None,{'search_web'})
    data={'jobs':{}}
    for key,row in [('ready',ready),('waiting',pending)]:
        data['jobs'][key]={'state':'waiting_for_retry','context':CTX,'actions':[{'name':'search_web','state':'waiting_for_retry','next_attempt':9999999999,'arguments':{'research_id':row['id']}}]}
    jobs.write(data)
    assert resume_published_research(jobs,store)==1
    assert jobs.load()['jobs']['ready']['actions'][0]['next_attempt']==0
    assert jobs.load()['jobs']['waiting']['state']=='waiting_for_retry'
    assert jobs.path.with_suffix('.before-publication-recovery.bak').exists()


def test_removed_document_route_distinguishes_recoverable_deletion_from_wrong_scope(tmp_path):
    import ast
    from pathlib import Path
    from fastapi import HTTPException
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.reserve('Removed topic','quick',CTX,'remove')
    preview=store.deletion_preview(row['id'],CTX);store.remove(row['id'],CTX,preview['revision'],'delete')
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='research_document');handler.decorator_list=[]
    namespace={'asyncio':asyncio,'Request':object,'HTTPException':HTTPException,'_learning_context':lambda request:request,'get_research_services':lambda:(store,None),'action_jobs':SimpleNamespace(list=lambda *a:{})}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),namespace)
    with pytest.raises(HTTPException) as removed:asyncio.run(namespace['research_document'](row['id'],CTX))
    assert removed.value.status_code==410
    with pytest.raises(HTTPException) as outside:asyncio.run(namespace['research_document'](row['id'],{**CTX,'profile_id':'other'}))
    assert outside.value.status_code==404
