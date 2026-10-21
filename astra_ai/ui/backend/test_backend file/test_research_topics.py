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
    assert sum(bool(row['report']) for row in store.snapshot()['extensions'][item['id']])==1
    assert len(store.source_catalog(store.get(item['id'],CTX)['artifact']))==2
    assert store.document(item['id'],CTX)['draft']==draft
    assert store.get(item['id'],CTX)['artifact']['report']==item['report']

@pytest.mark.parametrize('mode',['quick','detailed'])
@pytest.mark.parametrize('action',['','topic_followup'])
def test_queued_search_keeps_frozen_report_instead_of_allocating_another_topic(tmp_path,mode,action):
    store=ResearchArtifacts(tmp_path/'r.json')
    parent=store.save('Pixel versus iPhone',mode,'# Comparison\n\nSupported comparison [S1].',[SOURCE],[],CTX,'parent')
    context={**CTX,'research_id':parent['id'],'thread_id':'research-'+parent['id'],'job_id':'batch','user_text':'Which of these phones has the better camera?'}
    calls=[];composed=[]
    async def synth(query,sources):composed.append(query);return '## Camera comparison\n\nThe camera conclusion follows the saved and retrieved evidence [S2].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:(calls.append(a) or ([{**SOURCE,'url':'https://example.com/cameras'}],None))
    args={'query':'Pixel versus iPhone camera comparison','mode':'quick','topic':'phone cameras'}
    if action:args.update(action=action,research_id='mistaken-child')
    result=asyncio.run(service.search(args,context,'camera-turn'))
    assert result['status']=='completed' and result['research_id']==parent['id']
    assert store.listing(CTX)['total']==1 and store.listing(CTX)['items'][0]['followup_count']==1
    assert calls[0][1]=='quick' and sum(bool(row['report']) for row in store.snapshot()['extensions'][parent['id']])==1
    assert composed[0].startswith('[QUICK]\n')==(mode=='quick')
    assert store.get(parent['id'],CTX)['artifact']['report']==parent['report']
    assert asyncio.run(service.search(args,context,'camera-turn'))['duplicate']
    assert len(calls)==1

def test_explicit_new_research_in_selected_context_can_start_a_separate_session(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');parent=store.save('Phones','quick','# Phones',[SOURCE],[],CTX,'parent')
    async def synth(*a):return '# Architecture\n\nA different researched subject [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:([SOURCE],None)
    result=asyncio.run(service.search({'query':'Architecture today','mode':'quick'},{**CTX,'research_id':parent['id'],'job_id':'batch','user_text':'Start a new research about architecture'},'new'))
    assert result['research_id']!=parent['id'] and store.listing(CTX)['total']==2

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


def test_repeated_brief_reuses_quota_wait_even_after_five_minutes(tmp_path):
    from astra_ai.memory.shared_memory import atomic
    store=ResearchArtifacts(tmp_path/'reports.json')
    first=store.reserve('OpenAI company and models','detailed',CTX,'original')
    store.request_state(first['id'],CTX,phase='waiting_for_quota',waiting_reason='gemini_daily_quota',sources=[SOURCE])
    data=store.snapshot();data['requests'][first['id']]['created_epoch']-=7200;atomic(store.path,data)
    repeat=store.reserve(' OpenAI company and models\n\n','detailed',CTX,'repeat')
    assert repeat['id']==first['id'] and repeat['operation_id']=='original'
    assert len(store.snapshot()['requests'])==1
    assert store.reserve('OpenAI company and models','detailed',{**CTX,'project_id':'different'},'other')['id']!=first['id']


def test_pending_retry_publishes_full_answer_once_without_repeating_search(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');searches=[];syntheses=[]
    report='# OpenAI company and models\n\n'+'\n\n'.join('## Topic '+str(i)+'\n\n'+('A substantive explanation grounded in the preserved evidence. '*24)+' [S1].' for i in range(10))
    async def synth(query,sources):
        syntheses.append(query)
        if len(syntheses)==1:raise BudgetPaused(9999999999,'gemini_daily_quota')
        return report
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:(searches.append(args) or ([SOURCE],None))
    first=asyncio.run(service.search({'query':'OpenAI company and models','mode':'detailed'},CTX,'original'))
    second=asyncio.run(service.search({'query':'OpenAI company and models\n\n','mode':'detailed'},CTX,'repeat'))
    assert first['status']=='waiting_for_quota' and second['status']=='completed'
    assert second['research_id']==first['research_id'] and len(searches)==1
    assert len(store.snapshot()['artifacts'])==len(store.snapshot()['requests'])==1
    document=store.document(first['research_id'],CTX,bounded=True)
    assert document['phase']=='complete' and len(document['report'])>12000
    assert document['next_cursor'] is None and document['waiting_reason']==''


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


@pytest.mark.parametrize('user_text',['Which camera is better?',''])
@pytest.mark.parametrize('tool,arguments',[('search_web',{'query':'Camera question'}),
    ('search_widget_action',{'action':'run','query':'Camera question'}),
    ('research_action',{'action':'request','query':'Camera question'})])
def test_direct_tool_variants_continue_selected_report(tool,arguments,user_text):
    import ast
    from pathlib import Path
    path=Path(__file__).parents[1]/'server.py'
    tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='_dispatch_scoped_aegis_tool')
    calls=[]
    async def continuation(identifier,context,operation_id,**kwargs):
        calls.append((identifier,operation_id,kwargs));return {'status':'accepted','research_id':identifier}
    artifacts=SimpleNamespace(get=lambda *args:{'artifact':{'kind':'research'}})
    namespace={'ALL_AEGIS_TOOLS':[{'name':tool}], 'get_research_services':lambda:(artifacts,None),
        'research_followup':lambda text:True,'continue_research':continuation}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),namespace)
    result=asyncio.run(namespace[handler.name](tool,arguments,{**CTX,'client_id':'connected','research_id':'pixel','user_text':user_text},'turn-camera'))
    assert result['research_id']=='pixel' and calls==[('pixel','turn-camera',{'detail':user_text or 'Camera question'})]


@pytest.mark.parametrize('fail',[False,True])
def test_search_model_scope_uses_frozen_parent_and_restores_context(fail):
    import ast
    from pathlib import Path
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='_aegis_search_web')
    captured=[]
    async def search(arguments,context,operation):
        captured.append(dict(CURRENT_OPERATION.get()))
        if fail:raise RuntimeError('worker interrupted')
        return {'status':'rejected'}
    namespace={'get_research_services':lambda:(None,SimpleNamespace(search=search))}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),namespace)
    async def run():
        original={**CTX,'client_id':'connected','operation_id':'turn','research_id':'pixel'}
        token=CURRENT_OPERATION.set(original)
        try:
            try:return await namespace[handler.name]({'research_id':'wrong-child'})
            finally:assert CURRENT_OPERATION.get()==original
        finally:CURRENT_OPERATION.reset(token)
    if fail:
        with pytest.raises(RuntimeError):asyncio.run(run())
    else:assert asyncio.run(run())=={'status':'rejected'}
    assert captured[0]['model_research_id']=='pixel' and captured[0]['research_id']=='pixel'


@pytest.mark.parametrize('mode',['quick','detailed'])
def test_followup_waits_for_initial_report_then_appends_without_new_history(tmp_path,mode):
    store=ResearchArtifacts(tmp_path/'r.json');pending=store.reserve('Pixel versus iPhone','detailed',CTX,'original')
    context={**CTX,'research_id':pending['id'],'user_text':'Which camera is better?','job_id':'camera'}
    calls=[]
    async def synth(query,sources):return '## Cameras\n\nA supported camera conclusion [S2].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:(calls.append(args) or ([{**SOURCE,'url':'https://example.com/cameras'}],None))
    args={'action':'topic_followup','research_id':pending['id'],'query':context['user_text'],'mode':mode}
    waiting=asyncio.run(service.search(args,context,'camera-turn'))
    assert waiting['reason']=='topic_initial_report_pending' and len(calls)==1 and waiting['collected_sources']==1
    assert store.extension_state(pending['id'],CTX)['phase']=='waiting_for_report'
    assert len(store.request_state(pending['id'],CTX)['sources'])==1
    assert asyncio.run(service.search(args,context,'camera-turn'))['collected_sources']==1 and len(calls)==1
    store.save(pending['query'],'detailed','# Phone comparison\n\nThe initial answer [S1].',[SOURCE],[],CTX,pending['operation_id'])
    finished=asyncio.run(service.search(args,context,'camera-turn'))
    assert finished['status']=='completed' and finished['research_id']==pending['id']
    assert store.listing(CTX)['total']==1 and store.listing(CTX)['items'][0]['followup_count']==1
    assert len(calls)==1


@pytest.mark.parametrize('detail',['Which camera is better?','Compare low-light photos, portraits and video for these same phones.'])
def test_pending_report_followup_is_durably_queued_on_same_identity(tmp_path,detail):
    import ast,re
    from pathlib import Path
    from astra_ai.core.action_jobs import ActionJobs
    store=ResearchArtifacts(tmp_path/'r.json');pending=store.reserve('Pixel versus iPhone','detailed',CTX,'original')
    jobs=ActionJobs(tmp_path/'jobs.json',None,None,None,{'search_web'})
    async def wait(*args,**kwargs):return {'status':'completed','revealed':False}
    async def send(*args):pass
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='continue_research')
    env={'asyncio':asyncio,'re':re,'_research_continuation_locks':{},'get_research_services':lambda:(store,None),
        'state':SimpleNamespace(register_widget_action=lambda *args:None,await_widget_action=wait),
        'ws_manager':SimpleNamespace(send_to_client_id=send),'action_jobs':jobs}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),env)
    result=asyncio.run(env[handler.name](pending['id'],{**CTX,'client_id':'connected'},'camera-turn',detail=detail))
    assert result['status']=='queued' and result['research_id']==pending['id']
    saved=jobs.load()['jobs'][result['job_id']]
    assert saved['context']['research_id']==pending['id'] and saved['actions'][0]['arguments']['action']=='topic_followup'
    assert store.extension_state(pending['id'],CTX)['phase']=='waiting_for_report'
    again=asyncio.run(env[handler.name](pending['id'],{**CTX,'client_id':'connected'},'camera-turn',detail=detail))
    assert again['job_id']==result['job_id'] and len(jobs.load()['jobs'])==1
    other=asyncio.run(env[handler.name](pending['id'],{**CTX,'client_id':'connected'},'second-turn',detail='What about battery life?'))
    assert other['job_id']!=result['job_id'] and len(jobs.load()['jobs'])==2
    assert store.listing(CTX)['total']==1


@pytest.mark.parametrize('pending',[True,False])
def test_quota_wait_exposes_bounded_followup_evidence_with_stable_citations(tmp_path,pending):
    store=ResearchArtifacts(tmp_path/'r.json');parent=store.reserve('Tesla models','detailed',CTX,'parent')
    if not pending:store.save(parent['query'],'detailed','# Tesla models\n\nOriginal answer [S1].',[SOURCE],[],CTX,parent['operation_id'])
    question='Research the Roadster.';calls=[]
    async def paused(*args):raise BudgetPaused(9999999999,'gemini_daily_quota')
    service=ResearchSearch(store,lambda _:None,synthesize=paused)
    row={'title':'Roadster official specifications','url':'https://www.tesla.com/roadster','content':'Supported vehicle evidence. '*1000,'retrieved_at':'2026-10-20'}
    service._request=lambda *args:(calls.append(args) or ([row],None))
    context={**CTX,'research_id':parent['id']}
    result=asyncio.run(service.quick_followup({'research_id':parent['id'],'query':question},context,'roadster-turn'))
    assert result['status'] in {'waiting_for_retry','waiting_for_quota'} and result['results']
    assert calls[0][0]=='Tesla models: '+question and calls[0][1]=='quick'
    evidence=result['results'][0];document=store.document(parent['id'],CTX,bounded=True)
    assert document['sources'][int(evidence['id'][1:])-1]['url']==row['url']
    assert len(evidence['content'])<=1200 and ('promise' in result['summary'] or 'conversationally' in result['summary'])
    assert not document['extensions']['sections'] and not document['extensions']['report'].strip()
    assert store.followup_evidence(parent['id'],{**context,'project_id':'foreign'},'roadster-turn')==[]
    asyncio.run(service.quick_followup({'research_id':parent['id'],'query':question},context,'roadster-turn'))
    assert len(calls)==1 and store.listing(CTX)['total']==1


def test_followup_reads_collected_articles_once_without_new_search_or_model_work(tmp_path,monkeypatch):
    store=ResearchArtifacts(tmp_path/'r.json');parent=store.reserve('Tesla cars','detailed',CTX,'parent');calls=[];reads=[]
    row={**SOURCE,'url':'https://www.tesla.com/roadster','content':'Short search snippet.'}
    service=ResearchSearch(store,lambda _:None,read_evidence=True)
    service._request=lambda *args:(calls.append(args) or ([row],None))
    text='Official source statements with supported range and acceleration. '*100
    def read(*args):reads.append(args);return text.encode(),'text/plain; charset=utf-8'
    monkeypatch.setattr(store,'source_bytes',read)
    context={**CTX,'research_id':parent['id']}
    first=asyncio.run(service.quick_followup({'research_id':parent['id'],'query':'Research the Roadster'},context,'roadster'))
    second=asyncio.run(service.quick_followup({'research_id':parent['id'],'query':'Research the Roadster'},context,'roadster'))
    assert len(calls)==1 and len(reads)==1 and first['results']==second['results']
    assert first['results'][0]['content'].startswith('Official source statements')
    assert len(first['results'][0]['content'])<=1200
    saved=store.request_state(parent['id'],context)['quick_followups']['roadster']['sources'][0]
    assert saved['search_excerpt']==row['content'] and saved['content']==text


def test_chat_continuation_waits_for_collected_evidence_without_reexecuting_search():
    import ast,time
    from pathlib import Path
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='_research_collection_receipt')
    calls=[];evidence=[{'id':'S4','url':'https://www.tesla.com/roadster','content':'Supported specifications.'}]
    def listing(job,context):
        calls.append((job,context))
        result={} if len(calls)==1 else {'status':'waiting_for_retry','research_id':'tesla','results':evidence,'summary':'Answer from the collected evidence.','report':'private large archive'}
        return {'status':'ok','job':{'state':'running','actions':[{'result':result}]}}
    env={'asyncio':asyncio,'time':time,'action_jobs':SimpleNamespace(list=listing)}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),env)
    result=asyncio.run(env[handler.name]({'status':'queued','research_id':'tesla','job_id':'roadster'},CTX))
    assert len(calls)==2 and result['research_id']=='tesla' and result['results']==evidence
    assert result['status']=='completed' and result['operation']=='collect_followup_evidence' and 'report' not in result
    assert result['publication_pending'] and result['report_status']=='waiting_for_retry'
    cached=asyncio.run(env[handler.name]({'status':'queued','research_id':'tesla','job_id':'roadster','results':evidence},CTX))
    assert cached['status']=='completed' and cached['publication_pending'] and len(calls)==2


def test_legacy_preallocated_child_recovers_query_without_restarting_collection(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json')
    parent=store.reserve('Pixel comparison','detailed',CTX,'parent')
    child=store.reserve('Pixel camera question','quick',CTX,'legacy-child')
    context={**CTX,'research_id':parent['id'],'job_id':'legacy','user_text':''}
    service=ResearchSearch(store,lambda _:None)
    calls=[]
    service._request=lambda *args:(calls.append(args) or ([SOURCE],None))
    result=asyncio.run(service.search({'research_id':child['id'],'mode':'quick'},context,'legacy-turn'))
    assert result['research_id']==parent['id'] and result['reason']=='topic_initial_report_pending'
    assert len(calls)==1 and calls[0][0]==parent['query']+': '+child['query']
    assert store.extension_state(parent['id'],CTX)['operation_id']=='legacy-turn'
    assert store.get(child['id'],CTX)['artifact']['completeness']=='pending'


@pytest.mark.parametrize('text,view',[
    ('Which camera is better for portraits and video?','reader'),
    ('Compare video quality and low-light photos.','reader'),
    ('Find more independent sources for the video quality comparison.','reader'),
    ('Show me related YouTube videos about these phones.','media'),
    ('Find a video review of these phones.','media'),
    ('More videos please.','media'),
    ('Play this video.','media'),
    ('Give me additional sources.','sources')])
def test_camera_video_quality_is_reader_content_not_a_media_navigation(text,view):
    from astra_ai.core.research_topics import followup_view
    assert followup_view(text)==view


def test_late_search_uses_frozen_question_instead_of_unrelated_model_query(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');parent=store.reserve('Pixel comparison','detailed',CTX,'parent')
    question='Which camera has better low-light photos?'
    context={**CTX,'research_id':parent['id'],'job_id':'late','user_text':'','research_user_text':question}
    service=ResearchSearch(store,lambda _:None)
    captured=[]
    async def followup(args,*unused):captured.append(args);return {'status':'waiting_for_retry','research_id':args['research_id']}
    service.quick_followup=followup
    result=asyncio.run(service.search({'query':'Unrelated football rankings','mode':'quick'},context,'camera'))
    assert result['research_id']==parent['id'] and captured[0]['query']==question
    assert store.listing(CTX)['total']==1


def test_research_context_includes_real_quota_and_followup_status(tmp_path):
    import ast,re,threading
    from pathlib import Path
    store=ResearchArtifacts(tmp_path/'r.json');parent=store.reserve('Pixel comparison','detailed',CTX,'parent')
    store.request_state(parent['id'],CTX,phase='waiting_for_quota',waiting_reason='gemini_daily_quota',next_attempt=1234)
    store.extension_state(parent['id'],CTX,phase='waiting_for_report',reason='initial_report_pending',job_id='camera-job')
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    handler=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='_research_thread')
    memory=SimpleNamespace(_lock=threading.RLock(),_messages=lambda:[])
    env={'asyncio':asyncio,'re':re,'get_research_services':lambda:(store,None),'state':SimpleNamespace(live_memory=memory)}
    exec(compile(ast.Module(body=[handler],type_ignores=[]),str(path),'exec'),env)
    result=asyncio.run(env[handler.name](parent['id'],CTX))
    assert result['research_id']==parent['id'] and result['progress']=={'completeness':'pending','phase':'waiting_for_quota','waiting_reason':'gemini_daily_quota','next_attempt':1234,'followup':{'phase':'waiting_for_report','reason':'initial_report_pending','job_id':'camera-job','collected_sources':None}}
    assert result['followup_evidence']==[]
    row={**SOURCE,'url':'https://www.tesla.com/roadster','content':'Supported Roadster specifications.'}
    store.request_state(parent['id'],CTX,quick_followups={'roadster':{'query':'Roadster specifications?','sources':[row]}})
    store.append_extension(parent['id'],CTX,store.get(parent['id'],CTX)['artifact']['revision'],'roadster:sources','',[row])
    store.extension_state(parent['id'],CTX,operation_id='roadster')
    result=asyncio.run(env[handler.name](parent['id'],CTX))
    assert result['followup_question']=='Roadster specifications?'
    assert result['followup_evidence'][0]['url']==row['url'] and result['followup_evidence'][0]['content']==row['content']


@pytest.mark.parametrize('phase,checkpoint',[
    ('preparing_report',{}),
    ('waiting_for_quota',{'signature':'saved-composition','parts':['Already written.']}),
    ('waiting_for_quota',{})])
def test_followup_does_not_invalidate_evidence_already_being_written(tmp_path,phase,checkpoint):
    store=ResearchArtifacts(tmp_path/'reports.json')
    parent=store.reserve('Original memory comparison','detailed',CTX,'original')
    store.request_state(parent['id'],CTX,sources=[SOURCE],phase=phase,synthesis_checkpoint=checkpoint)
    extra={**SOURCE,'url':'https://example.com/new-memory-evidence','title':'Additional memory evidence'}
    service=ResearchSearch(store,lambda _:None)
    service._request=lambda *args:([extra],None)
    result=asyncio.run(service.quick_followup({'research_id':parent['id'],'query':'Add more about persistence'},
        {**CTX,'research_id':parent['id']},'followup'))
    assert result['reason']=='topic_initial_report_pending' and result['research_id']==parent['id']
    row=store.request_state(parent['id'],CTX)
    assert row['synthesis_checkpoint']==checkpoint
    frozen=phase=='preparing_report' or bool(checkpoint)
    assert len(row['sources'])==(1 if frozen else 2)
    catalog=store.source_catalog(store.get(parent['id'],CTX)['artifact'])
    assert [s['url'] for s in catalog]==[SOURCE['url'],extra['url']]
    assert len(store.snapshot()['requests'])==1
