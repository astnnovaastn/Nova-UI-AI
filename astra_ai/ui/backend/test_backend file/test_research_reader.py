"""Reader projections, pending checkpoints and scoped versioned report extensions."""
import asyncio,io
from types import SimpleNamespace
import pytest
from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch,display_title,reader_text
from astra_ai.core.background_budget import BudgetPaused

CTX={'profile_id':'owner','project_id':'project','session_id':'main','turn_id':'origin','user_text':'Please research honeybee communication'}

def test_followup_sections_keep_identity_across_bounded_pages_and_preserve_original(tmp_path):
    store=ResearchArtifacts(tmp_path/'sections.json')
    item=store.save('Honeybees','detailed','# Honeybees\n\nOriginal findings.',[source()],[],CTX,'original')
    store.append_extension(item['id'],CTX,item['revision'],'camera','# Evidence follow-up\n\n'+('Supported additional evidence. '*35)+'\n\n'+('Second paragraph. '*40),[source('New evidence')],'How does the waggle signal vary?')
    store.append_extension(item['id'],CTX,item['revision'],'second','## Next subject\n\nA further related conclusion.',[], 'A related subject')
    first=store.reader(item['id'],CTX,limit=1000,stream='extensions')
    assert len(first['sections'])==2 and first['sections'][0]['title']=='How does the waggle signal vary?'
    cursor=first['next_cursor'];blocks=first['blocks'][:]
    while cursor is not None:
        page=store.reader(item['id'],CTX,limit=1000,stream='extensions',cursor=cursor)
        assert page['sections']==first['sections']
        blocks+=page['blocks'];cursor=page['next_cursor']
    assert len({block['id'] for block in blocks})==len(blocks)
    assert {block['section_id'] for block in blocks}=={s['id'] for s in first['sections']}
    assert store.get(item['id'],CTX)['artifact']['report']==item['report']
    assert store.reader(item['id'],{**CTX,'project_id':'other'},stream='extensions')['status']=='not_found'

def test_scoped_questions_continue_research_unless_new_topic_is_explicit():
    import ast,re
    from pathlib import Path
    path=Path(__file__).parents[1]/'server.py';tree=ast.parse(path.read_text(encoding='utf-8'))
    node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='research_followup')
    env={'re':re};exec(compile(ast.Module(body=[node],type_ignores=[]),str(path),'exec'),env)
    assert env['research_followup']('Which has the better camera?')
    assert env['research_followup']('What about battery life?')
    assert not env['research_followup']('Start a new topic about architecture')
    assert not env['research_followup']('New research about football')
def source(content='Real supported evidence.'):
    return {'title':'Source','url':'https://example.org/article','retrieved_at':'2026-10-16T10:00:00Z','content':content}

@pytest.mark.parametrize('brief',[
 'Hey, can you search information about honeybee communication?',
 'Create an exhaustive, multimedia research report titled "The Global AI Race 2026–2030"\nRESEARCH REQUIREMENTS: '+('Instructions. '*500),
 'A subject '+('word '*200),
])
def test_conservative_titles_are_separate_and_bounded(brief):
    title=display_title(brief)
    assert len(title)<=90 and '\n' not in title
    assert 'RESEARCH REQUIREMENTS' not in title

def test_long_brief_reservation_is_scoped_and_idempotent(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');brief='Subject\n'+('Detailed instruction. '*500)
    one=store.reserve(brief,'detailed',CTX,'op');two=store.reserve(brief,'detailed',CTX,'op')
    assert one['id']==two['id'] and one['thread_id']==two['thread_id']
    assert one['query']==brief and one['origin_turn_id']=='origin'
    assert store.get(one['id'],{**CTX,'project_id':'other'})['status']=='not_found'
    assert store.reserve('x'*12001,'detailed',CTX,'too-long')['status']=='rejected'
    assert store.reserve('Another subject','detailed',CTX,'op')['status']=='conflict'
    assert store.listing(CTX)['items'][0]['research_id']==one['id']

def test_quota_restart_uses_checkpoint_without_another_search(tmp_path):
    calls=[]
    class Transport:
        def post(self,*args,**kwargs):
            calls.append(kwargs);return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[source()]})
    async def paused(*args):raise BudgetPaused(9999999999,'daily_budget')
    store=ResearchArtifacts(tmp_path/'reports.json')
    first=asyncio.run(ResearchSearch(store,lambda k:'fixture',Transport(),paused).search({'query':'Public honeybee topic','mode':'detailed'},CTX,'op'))
    assert first['status']=='waiting_for_quota' and len(calls)==1
    doc=store.document(first['research_id'],CTX,bounded=True)
    assert doc['phase']=='waiting_for_quota' and doc['sources'][0]['content']=='Real supported evidence.' and doc['report']==''
    async def done(*args):return '# Honeybee Communication\n\nSupported finding [S1].'
    restarted=ResearchArtifacts(store.path)
    result=asyncio.run(ResearchSearch(restarted,lambda k:'fixture',Transport(),done).search({'research_id':first['research_id']},CTX,'ignored'))
    assert result['status']=='completed' and len(calls)==1
    assert restarted.document(result['research_id'],CTX)['phase']=='complete'
    assert store.path.with_suffix('.before-reader-threads.bak').exists()

def test_bounded_reader_pages_preserve_markup_and_require_no_providers(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    text='# Topic\n\n'+''.join('## Section '+str(i)+'\n\n'+'A supported paragraph [S1]. '*250+'\n\n' for i in range(8))+'```python\nx = "[S1]"\n```\n'
    item=store.save('Please research this subject','detailed',text,[source()],[],CTX,'op')
    cursor=0;parts=[]
    while cursor is not None:
        page=store.reader(item['id'],CTX,item['revision'],cursor)
        assert len(page['report'])<=20000
        parts.append(page['report']);cursor=page['next_cursor']
    joined=''.join(parts)
    assert 'Section 7' in joined and '```python\nx = "[S1]"\n```' in joined
    assert len(store.document(item['id'],CTX,bounded=True)['report'])<=20000
    assert store.get(item['id'],CTX)['artifact']['report']==text

def test_extension_is_deduplicated_and_preserves_archive_and_draft(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');item=store.save('Topic','detailed','# Topic\n\nOriginal [S1].',[source()],[],CTX,'op')
    draft=store.save_draft(item['id'],CTX,item['revision'],'','<p>Personal edits</p>')['draft']
    for _ in range(2):assert store.append_extension(item['id'],CTX,item['revision'],'extend','# More\n\nMore evidence [S1].')['status']=='completed'
    assert store.reader(item['id'],CTX)['report'].count('More evidence')==1
    assert store.get(item['id'],CTX)['artifact']['report']==item['report']
    assert store.document(item['id'],CTX)['draft']==draft
    assert store.reader(item['id'],{**CTX,'profile_id':'other'})['status']=='not_found'


def test_initial_detailed_page_reserves_saved_findings_without_provider_requests(tmp_path,monkeypatch):
    store=ResearchArtifacts(tmp_path/'reports.json')
    text='# Topic\n\n'+''.join('## Finding '+str(i)+'\n\n'+('Supported facts [S1]. '*90)+'\n\n' for i in range(9))
    item=store.save('Topic','detailed',text,[source()],[],CTX,'saved-only')
    draft=store.save_draft(item['id'],CTX,item['revision'],'','<p>My changes</p>')['draft']
    monkeypatch.setattr(ResearchSearch,'_request',lambda *a:pytest.fail('Expansion must not search'))
    first=store.document(item['id'],CTX,bounded=True)
    assert len(first['report'])<=12000 and first['next_cursor'] is not None
    next_page=store.reader(item['id'],CTX,item['revision'],first['next_cursor'],stream='base')
    assert next_page['blocks']==store.reader(item['id'],CTX,item['revision'],first['next_cursor'],stream='base')['blocks']
    assert 'Finding 8' in next_page['report']
    assert store.document(item['id'],CTX)['draft']==draft
    assert store.get(item['id'],CTX)['artifact']['report']==text


def test_article_extraction_strips_notifications_and_preserves_prose_and_bibliography():
    from bs4 import BeautifulSoup
    from astra_ai.core.research_learning import article_root
    html='<main><div class="notificationBar">Enable notifications</div><div id="oneTrust">Cookies</div><nav>Home</nav><article><h1>Actual article</h1><p>Substantive article facts and explanation.</p><div class="tableOfContents"><a href="#one">One</a></div><h2>References</h2><ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li><li><a href="/c">C</a></li></ul></article></main>'
    text=article_root(BeautifulSoup(html,'html.parser')).get_text(' ',strip=True)
    assert 'Substantive article facts' in text and 'References A B C' in text
    assert all(word not in text for word in ('Cookies','Enable notifications','Home','One'))

def test_legacy_reader_does_not_dump_request_or_entire_source(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');brief='Create a report titled "Clean Topic"\nREQUIREMENTS: '+('long instruction '*500)
    raw='# '+brief+'\n\nSourced research excerpts.\n'+('full webpage '*5000)
    item=store.save(brief,'detailed',raw,[source('A valid excerpt. '*2000)],[],CTX,'legacy')
    page=store.reader(item['id'],CTX)
    assert page['report'].startswith('# Clean Topic') and 'long instruction' not in page['report'] and 'full webpage' not in page['report']
    assert store.get(item['id'],CTX)['artifact']['report']==raw

def test_cleanup_preserves_unicode_code_math_and_quoted_evidence():
    text='“Quoted” — x² = α + β. https://example.org\n```json\n{"report":"literal"}\n```'
    assert reader_text(text)==text
    assert reader_text('{"report":"Clean \u0000 text"}')=='Clean  text'

def test_image_ids_are_scoped_validated_and_decode_limited(tmp_path,monkeypatch):
    from PIL import Image
    store=ResearchArtifacts(tmp_path/'reports.json');row=source();row['images']=[{'url':'https://example.org/image.png','caption':'Related image'}]
    item=store.save('Topic','quick','# Topic',[row],[],CTX,'image')
    image=store.images(item['id'],CTX)[0];out=io.BytesIO();Image.new('RGB',(320,180)).save(out,format='PNG');body=out.getvalue();calls=[]
    def fetch(url,image=False):calls.append(url);return body,'image/png',url
    monkeypatch.setattr(store,'_fetch_public_source',fetch)
    assert store.image_bytes(item['id'],CTX,image['id'])[0]==body
    assert store.image_bytes(item['id'],CTX,image['id'])[0]==body and len(calls)==1
    with pytest.raises(ValueError):store.image_bytes(item['id'],{**CTX,'profile_id':'other'},image['id'])
    with pytest.raises(ValueError):store.image_bytes(item['id'],CTX,'https://127.0.0.1/secret')


def test_prepared_image_source_action_resolves_the_current_catalog(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');row=source();item=store.save('Topic','quick','# Topic',[row],[],CTX,'image')
    image={'id':'I'+'a'*24,'url':'https://example.org/image.png','caption':'Related illustration','source_url':row['url'],'source_id':'S99','width':640,'height':400}
    store.request_state(item['id'],CTX,images_prepared=True,selected_images=[image])
    assert store.images(item['id'],CTX)[0]['source_id']=='S1'

def test_related_evidence_preserves_origin_and_cannot_cross_scope(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');item=store.save('Honeybee communication dance','detailed','# Bees',[source()],[],CTX,'old')
    reused=store.related_evidence('Honeybee communication',CTX)
    assert reused[0]['origin_research_id']==item['id'] and reused[0]['retrieved_at']==source()['retrieved_at']
    assert not store.related_evidence('Honeybee communication',{**CTX,'project_id':'other'})


def test_reuse_does_not_match_generic_request_words_or_relabel_unrelated_origins(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    pc=store.save('can you research the new pc that can run the biger ai model in the world or pc','detailed','# PC',[source()],[],CTX,'pc')
    query='Can you research about Tesla new cas model'
    assert not store.related_evidence(query,CTX)
    row={**source(),'origin_query':pc['query'],'origin_research_id':pc['id']}
    store.save(query,'detailed','# Tesla',[row],[],CTX,'tesla')
    assert not store.related_evidence(query,CTX)


def test_explicit_report_links_reference_turns_without_copying_transcripts(tmp_path):
    from astra_ai.memory.shared_memory import read
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Topic','quick','# Topic',[source()],[],CTX,'op')
    explicit={**CTX,'user_text':'Read the previous research report'}
    store.link_turn(item['id'],explicit);store.link_turn(item['id'],explicit)
    assert read(store.path,{})['thread_links'][item['id']]==[{'session_id':'main','turn_id':'origin'}]
    store.link_turn(item['id'],{**explicit,'profile_id':'other','turn_id':'denied'})
    assert len(read(store.path,{})['thread_links'][item['id']])==1
    assert 'conversation' not in read(store.path,{})


def test_processing_timer_freezes_during_quota_wait_and_resumes(tmp_path,monkeypatch):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.reserve('Public subject','detailed',CTX,'timed')
    stamp=[100.0];monkeypatch.setattr('astra_ai.core.research_learning.time.time',lambda:stamp[0])
    store.request_state(item['id'],CTX,phase='collecting_sources')
    stamp[0]=105.0;store.request_state(item['id'],CTX,phase='comparing_evidence',sources=[source()])
    stamp[0]=107.0;paused=store.request_state(item['id'],CTX,phase='waiting_for_quota')
    assert paused['processing_seconds']==7 and paused['active_since'] is None
    stamp[0]=10000.0;restarted=ResearchArtifacts(store.path)
    assert restarted.request_state(item['id'],CTX)['processing_seconds']==7
    resumed=restarted.request_state(item['id'],CTX,phase='preparing_report')
    assert resumed['active_since']==10000 and resumed['processing_seconds']==7
    stamp[0]=10003.0;done=restarted.request_state(item['id'],CTX,phase='complete')
    assert done['processing_seconds']==10 and done['active_since'] is None
    doc=restarted.document(item['id'],CTX,bounded=True)
    assert doc['processing_seconds']==10 and doc['sources']


def test_history_projection_cache_invalidates_after_external_save_and_is_scoped(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Subject','quick','# Subject\n\nEvidence [S1].',[source()],[],CTX,'op')
    first=store.document(item['id'],CTX,bounded=True)
    other=ResearchArtifacts(store.path);other.save_draft(item['id'],CTX,item['revision'],'','<p>External edit</p>')
    second=store.document(item['id'],CTX,bounded=True)
    assert first['draft'] is None and second['draft']['html']=='<p>External edit</p>'
    assert store.document(item['id'],{**CTX,'profile_id':'other'},bounded=True)['status']=='not_found'


def test_article_reader_removes_unmarked_menus_but_preserves_article_links_and_tables(tmp_path,monkeypatch):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Article','quick','# Article',[source()],[],CTX,'op')
    markup=b'<body><div class="site-menu"><ul><li><a href="/news">News</a></li><li><a href="/crypto">Crypto</a></li><li><a href="/about">About</a></li></ul></div><main><h1>Introduction</h1><p><a href="/play">How to Play</a></p><p><a href="/game">Play Game</a></p><a href="/menu"><p>Menu</p></a><p>A detailed article passage with a <a href="/study">supporting study</a>.</p><table><tr><td>Actual data</td></tr></table><div class="newsletter">Subscribe now</div><h2>References</h2><ul><li><a href="/ref1">Paper one</a></li><li><a href="/ref2">Paper two</a></li><li><a href="/ref3">Paper three</a></li></ul></main></body>'
    monkeypatch.setattr(store,'_fetch_public_source',lambda url:(markup,'text/html',url))
    import json
    data=json.loads(store.source_bytes(item['id'],CTX,'S1',True)[0]);html=data['html']
    assert 'Crypto' not in html and 'How to Play' not in html and 'Subscribe' not in html and '>Menu<' not in html
    assert 'supporting study' in html and 'Actual data' in html and 'Paper three' in html
    assert len(data['links'])==4


def test_research_removal_is_revision_checked_recoverable_and_scope_isolated(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Subject','quick','# Subject',[source()],[],CTX,'op')
    preview=store.deletion_preview(item['id'],CTX)
    assert store.remove(item['id'],CTX,'stale','delete')['status']=='conflict'
    removed=store.remove(item['id'],CTX,preview['revision'],'delete')
    assert store.get(item['id'],CTX)['status']=='not_found' and store.listing(CTX)['total']==0
    assert store.listing(CTX)['removed'][0]['undo_token']==removed['undo_token']
    assert store.restore(item['id'],{**CTX,'project_id':'other'},removed['undo_token'])['status']=='not_found'
    assert store.restore(item['id'],CTX,'wrong')['status']=='conflict'
    assert store.restore(item['id'],CTX,removed['undo_token'])['status']=='completed'
    assert store.get(item['id'],CTX)['artifact']['report']=='# Subject'


def test_expansion_appends_new_scoped_citations_without_new_report_or_draft_changes(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Subject','detailed','# Subject\n\nOriginal [S1].',[source()],[],CTX,'op')
    draft=store.save_draft(item['id'],CTX,item['revision'],'','<p>My draft</p>')['draft']
    requests=[]
    class Transport:
        def post(self,*a,**kw):requests.append(kw);return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{**source('New evidence'),'url':'https://example.org/new'}]})
    async def synthesize(q,rows):return '## Further findings\n\nNew support [S2].'
    service=ResearchSearch(store,lambda k:'fixture',Transport(),synthesize)
    result=asyncio.run(service.search({'action':'expand','research_id':item['id'],'research_revision':item['revision'],'detail':'Include the latest evidence'},CTX,'extend'))
    assert result['research_id']==item['id'] and store.listing(CTX)['total']==1 and len(requests)==1
    doc=store.document(item['id'],CTX,bounded=True)
    assert [r['id'] for r in doc['sources']]==['S1','S2'] and 'New support' in doc['extensions']['report']
    assert 'New support' not in doc['report']
    assert doc['draft']==draft and store.get(item['id'],CTX)['artifact']['report']==item['report']
    again=asyncio.run(service.search({'action':'expand','research_id':item['id'],'research_revision':item['revision']},CTX,'extend'))
    assert again['status']=='completed' and len(requests)==1


def test_expansion_quota_retry_uses_search_checkpoint(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Subject','detailed','# Subject [S1]',[source()],[],CTX,'op');calls=[]
    class Transport:
        def post(self,*a,**kw):calls.append(kw);return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{**source(),'url':'https://example.org/fresh'}]})
    async def paused(*a):raise BudgetPaused(9999999999,'budget')
    arguments={'action':'expand','research_id':item['id'],'research_revision':item['revision'],'detail':'latest details'}
    service=ResearchSearch(store,lambda k:'fixture',Transport(),paused)
    first=asyncio.run(service.search(arguments,CTX,'extend'));assert first['status']=='waiting_for_quota'
    async def done(*a):return '## Update\n\nSupported [S2].'
    service=ResearchSearch(ResearchArtifacts(store.path),lambda k:'fixture',Transport(),done)
    assert asyncio.run(service.search(arguments,CTX,'extend'))['status']=='completed' and len(calls)==1


def test_more_videos_deduplicates_and_persists_one_request_per_operation(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Public subject','detailed','# Subject',[source()],[],CTX,'op');calls=[]
    store.media_state(item['id'],CTX,item['revision'],status='complete',items=[{'video_id':'abcdefghijk','url':'https://youtu.be/abcdefghijk','title':'Existing'}])
    class Transport:
        def get(self,*a,**kw):
            calls.append(kw)
            return SimpleNamespace(status_code=200,json=lambda:{'video_results':[{'title':'Existing','link':'https://youtu.be/abcdefghijk'},{'title':'New evidence','link':'https://youtu.be/12345678901'}]})
    arguments={'action':'more_media','research_id':item['id'],'research_revision':item['revision']}
    service=ResearchSearch(store,lambda k:'fixture',Transport())
    first=asyncio.run(service.search(arguments,CTX,'videos'))
    assert first['status']=='completed' and first['added_media']==1 and first['research_id']==item['id']
    service=ResearchSearch(ResearchArtifacts(store.path),lambda k:'fixture',Transport())
    again=asyncio.run(service.search(arguments,CTX,'videos'))
    assert again['added_media']==1 and len(calls)==1
    none=asyncio.run(service.search(arguments,CTX,'videos-two'))
    assert none['status']=='completed' and none['no_more'] and len(calls)==2
    assert store.get(item['id'],CTX)['artifact']['report']=='# Subject' and store.listing(CTX)['total']==1


@pytest.mark.parametrize('revealed',[True,False])
@pytest.mark.parametrize('detail,reveal_saved',[('more information',True),('Which device has the better camera?',False)])
def test_continuation_reveals_saved_content_before_queueing_same_report(tmp_path,revealed,detail,reveal_saved):
    import ast,re
    from pathlib import Path
    store=ResearchArtifacts(tmp_path/'r.json');item=store.save('Subject','detailed','# Subject',[source()],[],CTX,'op');submitted=[];sent=[]
    async def wait(*a,**kw):return {'status':'completed','revealed':revealed}
    async def send(client,payload):sent.append(payload)
    def submit(actions,context,operation_id,**kwargs):
        submitted.append(actions)
        # Simulate a worker advancing immediately after admission. Enqueue must not reset its checkpoint.
        store.extension_state(item['id'],CTX,phase='collecting_sources',search_checkpoint=[source()])
        return {'status':'queued','job_id':'job'}
    source_path=Path(__file__).parents[1]/'server.py';tree=ast.parse(source_path.read_text(encoding='utf-8'))
    node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='continue_research')
    env={'_research_continuation_locks':{},'asyncio':asyncio,'re':re,'get_research_services':lambda:(store,None),'state':SimpleNamespace(register_widget_action=lambda *a:None,await_widget_action=wait),'ws_manager':SimpleNamespace(send_to_client_id=send),'action_jobs':SimpleNamespace(submit=submit)}
    exec(compile(ast.Module(body=[node],type_ignores=[]),str(source_path),'exec'),env)
    result=asyncio.run(env['continue_research'](item['id'],CTX,'continuation',detail=detail))
    assert result['research_id']==item['id'] and store.listing(CTX)['total']==1
    assert sent[0]['reveal_saved']==reveal_saved
    if revealed and reveal_saved:assert not submitted and result['provider_calls']==0
    else:
        assert submitted[0][0]['arguments']['research_id']==item['id']
        assert submitted[0][0]['arguments']['mode']=='quick'
        activity=store.extension_state(item['id'],CTX)
        assert activity['phase']=='collecting_sources' and activity['search_checkpoint']==[source()]
