import asyncio, contextlib, io, json, zipfile
from types import SimpleNamespace
import pytest
from PIL import Image
from astra_ai.core.research_learning import ResearchArtifacts, ResearchSearch
from astra_ai.core.research_documents import DocumentFiles, create_entry, PPTX_MIME
from astra_ai.core.research_model import GeminiResearchModel
from astra_ai.core.research_illustrations import prepare_images, place_images
from astra_ai.core.background_budget import BackgroundBudget, BudgetPaused
from astra_ai.ui.backend.document_api import authored_preview, authored_apply

CTX={'profile_id':'owner','project_id':'project','session_id':'main'}

def entry(tmp_path,kind='research'):
    store=ResearchArtifacts(tmp_path/'reports.json')
    row=store.reserve('NVIDIA workstation comparison','detailed',CTX,'sample',kind)
    return store,row['id']

def test_gemini_uses_configured_text_model_without_live_and_validates_citations(tmp_path):
    calls=[]
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs);return SimpleNamespace(text=json.dumps({'report':'# NVIDIA workstations\n\nThe supported answer. [S1]'}))
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'gemini.json',min_interval=0)
    model=GeminiResearchModel(lambda:'test',budget,lambda:'configured-gemini',Client)
    sources=[{'url':'https://example.com/source','title':'NVIDIA workstations','content':'NVIDIA source evidence.'}]
    asyncio.run(model.report('[QUICK]\nWhich workstation?',sources))
    assert calls[0]['model']=='configured-gemini'
    assert '2,000–4,000' in calls[0]['config'].system_instruction
    assert 'direct answer' in calls[0]['config'].system_instruction
    assert 'never one section per source' in calls[0]['config'].system_instruction
    assert 'supported clause' in calls[0]['config'].system_instruction
    assert budget.snapshot()['requests']==1

def test_gemini_quota_does_not_use_groq_pause(tmp_path):
    groq=BackgroundBudget(tmp_path/'groq.json',min_interval=0)
    gemini=BackgroundBudget(tmp_path/'gemini.json',min_interval=0);gemini.slot=groq.slot
    from astra_ai.memory.shared_memory import atomic
    import time
    atomic(groq.path,{'day':'2026-10-19','next_attempt':time.time()+86400})
    with gemini.lease(100):pass
    with groq.slot:
        with pytest.raises(BudgetPaused):
            with gemini.lease(100):pass

def test_quick_search_synthesizes_and_checkpoint_resume_does_not_search_again(tmp_path):
    store,_=entry(tmp_path);calls=[];attempts=[]
    async def synth(query,sources):
        attempts.append(query)
        if len(attempts)==1:raise BudgetPaused(1,'gemini_rate_limit')
        return '# Answer\n\nA direct supported answer. [S1]'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:(calls.append(a) or ([{'url':'https://example.com','title':'NVIDIA','content':'Useful NVIDIA evidence.','retrieved_at':'2026-10-19'}],None))
    first=asyncio.run(service.search({'query':'NVIDIA workstation comparison','mode':'quick'},CTX,'quick'))
    assert first['status']=='waiting_for_quota'
    second=asyncio.run(service.search({'query':'NVIDIA workstation comparison','mode':'quick'},CTX,'quick'))
    assert second['status']=='completed' and len(calls)==1
    assert attempts[0].startswith('[QUICK]\n')

def picture():
    stream=io.BytesIO();Image.new('RGB',(800,500),'teal').save(stream,format='PNG');return stream.getvalue()

def test_source_images_are_validated_and_cached_without_image_search(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path);body=picture();requests=[]
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(requests.append(url) or (body,'image/png',url)))
    source={'url':'https://example.com/nvidia','title':'NVIDIA workstation','content':'NVIDIA workstation evidence','images':[{'url':'https://example.com/workstation.png','caption':'NVIDIA workstation'}]}
    service=ResearchSearch(store,lambda _:None)
    rows=asyncio.run(prepare_images(service,identifier,CTX,[source],'NVIDIA workstation'))
    assert len(rows)==1 and rows[0]['width']==800
    assert asyncio.run(prepare_images(service,identifier,CTX,[source],'NVIDIA workstation'))==rows
    assert requests.count('https://example.com/workstation.png')==1
    assert not store.request_state(identifier,CTX).get('image_search_attempted')

def test_image_fallback_is_once_even_when_empty_and_reopened(tmp_path):
    store,identifier=entry(tmp_path);calls=[]
    transport=SimpleNamespace(get=lambda *a,**k:(calls.append(k) or SimpleNamespace(status_code=200,json=lambda:{'images_results':[]})))
    service=ResearchSearch(store,lambda _:'test',transport)
    assert asyncio.run(prepare_images(service,identifier,CTX,[],'NVIDIA workstation'))==[]
    assert asyncio.run(prepare_images(service,identifier,CTX,[],'NVIDIA workstation'))==[]
    assert len(calls)==1 and calls[0]['params']['engine']=='google_images'
    assert store.request_state(identifier,CTX)['images_prepared']

def test_image_placement_omits_unrelated_images():
    rows=[{'id':'I1','source_id':'S1','caption':'NVIDIA workstation'},{'id':'I2','source_id':'S2','caption':'Unrelated flowers'}]
    result=place_images(rows,'# Answer\n\nThe NVIDIA workstation meets the requirements. [S1]')
    assert [r['id'] for r in result]==['I1'] and result[0]['placement_text']

def test_extension_stream_preserves_base_and_stable_blocks(tmp_path):
    store,identifier=entry(tmp_path)
    original=store.save('NVIDIA workstation comparison','detailed','# Answer\n\nOriginal facts. [S1]',[],[],CTX,'sample')
    base=store.reader(identifier,CTX,stream='base')
    store.append_extension(identifier,CTX,original['revision'],'extra','## More detail\n\nAdditional facts.')
    after=store.document(identifier,CTX,bounded=True)
    assert after['report']==base['report']
    assert 'Additional facts.' in after['extensions']['report']
    assert store.reader(identifier,CTX,stream='base')['blocks']==base['blocks']
    assert len(store.snapshot()['extensions'][identifier])==1
    store.append_extension(identifier,CTX,original['revision'],'extra','Different retry')
    assert len(store.snapshot()['extensions'][identifier])==1

def test_document_insertion_placement_and_stale_revision(tmp_path):
    store,identifier=entry(tmp_path,'documentary');files=DocumentFiles(store)
    revision=store.get(identifier,CTX)['artifact']['revision']
    draft=store.save_draft(identifier,CTX,revision,'','<h2>Analysis</h2><p>Before selected after</p>')['draft']
    proposal=authored_preview(files,identifier,CTX,'Inserted research.',draft['revision'],'selection','selection','selected')
    assert proposal['status']=='preview' and 'Before ' in proposal['html'] and ' after' in proposal['html']
    assert authored_apply(files,identifier,CTX,'selection')['status']=='completed'
    assert authored_preview(files,identifier,CTX,'Stale',draft['revision'],'stale','append')['status']=='conflict'
    latest=store.document(identifier,CTX)['draft']
    assert 'Inserted research.' in latest['html']
    result=authored_preview(files,identifier,CTX,'Section addition',latest['revision'],'section','section',section_heading='Analysis')
    assert result['html'].index('Section addition')<result['html'].index('Before ')

def test_presentation_source_extracts_real_slide_text_and_image(tmp_path):
    store,identifier=entry(tmp_path,'documentary');files=DocumentFiles(store);stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w') as archive:
        archive.writestr('[Content_Types].xml','<Types/>');archive.writestr('ppt/presentation.xml','<presentation/>')
        archive.writestr('ppt/slides/slide1.xml','<slide xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Source slide finding</a:t></slide>')
        archive.writestr('ppt/media/image1.png',picture())
    row=files.upload(identifier,CTX,'source.pptx',stream.getvalue());files.process(identifier,CTX,row['id'])
    assert row['mime']==PPTX_MIME
    assert 'Source slide finding' in files.page(identifier,CTX,row['id'])['text']
    assert files.get(identifier,CTX,row['id'])['images']


def test_image_attribution_opens_through_scoped_reader(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    store.save('NVIDIA workstation comparison','detailed','# Answer\n\nSupported answer.',[],[],CTX,'sample')
    source_id='P'+'a'*24
    store.request_state(identifier,CTX,images_prepared=True,selected_images=[{'id':'I'+'b'*24,'source_id':source_id,'source_url':'https://example.com/photo','caption':'NVIDIA photo','publication':'example.com','url':'https://example.com/photo.png'}])
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(b'<article><h1>Photo source</h1><p>A meaningful original source paragraph.</p></article>','text/html',url))
    body,mime=store.source_bytes(identifier,CTX,source_id,reader=True)
    assert b'Photo source' in body
    with pytest.raises(ValueError):store.source_bytes(identifier,{**CTX,'project_id':'other'},source_id,reader=True)


def test_page_break_survives_draft_and_pdf_export(tmp_path):
    store,identifier=entry(tmp_path,'documentary');revision=store.get(identifier,CTX)['artifact']['revision']
    result=store.save_draft(identifier,CTX,revision,'','<p>First page.</p><div data-page-break="true"></div><p>Second page.</p>')
    assert 'data-page-break' in result['draft']['html']
    body,_=store.export(identifier,CTX,revision,'pdf',True)
    from pypdf import PdfReader
    pages=PdfReader(io.BytesIO(body)).pages
    assert len(pages)>=2 and 'Second page.' in pages[1].extract_text()


def test_provider_migration_only_releases_checkpointed_research_waits_once(tmp_path):
    from astra_ai.core.research_model import resume_legacy_research_waits
    from astra_ai.memory.shared_memory import StorageLock, read, atomic
    path=tmp_path/'jobs.json'
    action={'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':'existing'},'next_attempt':9999999999,'result':{'reason':'background_daily_budget'},'attempts':2}
    import copy
    atomic(path,{'jobs':{'research':{'state':'waiting_for_retry','context':{'requested_research':True},'actions':[copy.deepcopy(action)]},'other':{'state':'waiting_for_retry','context':{},'actions':[copy.deepcopy(action)]}},'metadata':{}})
    jobs=SimpleNamespace(path=path,lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda value:atomic(path,value))
    assert resume_legacy_research_waits(jobs)==1
    data=read(path,{})
    assert data['jobs']['research']['actions'][0]['attempts']==2
    assert data['jobs']['other']['actions'][0]['next_attempt']==9999999999
    assert resume_legacy_research_waits(jobs)==0


def test_source_page_image_precedes_fallback_and_legacy_archive_is_unchanged(tmp_path,monkeypatch):
    from astra_ai.memory.shared_memory import read,atomic
    store,identifier=entry(tmp_path)
    source={'url':'https://example.com/nvidia','title':'NVIDIA workstation','content':'The NVIDIA workstation is the subject.','retrieved_at':'2026-10-19'}
    original=store.save('NVIDIA workstation comparison','detailed','# NVIDIA\n\nNVIDIA workstation findings. [S1]',[source],[],CTX,'sample')
    data=read(store.path,{});data['requests'].pop(identifier);atomic(store.path,data)
    body=picture();calls=[]
    def fetch(url,image=False):
        calls.append(url)
        return (body,'image/png',url) if image else (b'<article><h1>NVIDIA workstation</h1><img src="/workstation.png" alt="NVIDIA workstation"></article>','text/html',url)
    monkeypatch.setattr(store,'_fetch_public_source',fetch)
    rows=asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,[source],'NVIDIA workstation'))
    assert len(rows)==1 and len(calls)==2
    assert store.get(identifier,CTX)['artifact']['report']==original['report']
    assert store.request_state(identifier,CTX)['images_prepared']


def test_scoped_image_discovery_rejects_low_resolution_without_empty_cards(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path);stream=io.BytesIO();Image.new('RGB',(100,100)).save(stream,format='PNG')
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(stream.getvalue(),'image/png',url))
    sources=[{'url':'https://example.com','title':'NVIDIA workstation','images':[{'url':'https://example.com/tiny.png','caption':'NVIDIA workstation'}]}]
    assert asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,sources,'NVIDIA workstation'))==[]
    assert store.images(identifier,CTX)==[]


def test_generated_headline_does_not_strip_greeting_prefix_from_subject_words():
    from astra_ai.core.research_learning import display_title
    assert display_title('High-Memory Workstations')=='High-Memory Workstations'
    assert display_title('History of artificial intelligence')=='History of artificial intelligence'
    assert display_title('Hi, can you research high-memory workstations')=='High-memory workstations'


def test_grouped_model_citations_validate_and_place_images_without_modifying_evidence():
    from astra_ai.core.background_model import BackgroundModel,ModelUnavailable
    class Model(BackgroundModel):
        def structured(self,*args):return {'report':'# Workstations\n\n**NVIDIA workstation** findings. [S1, S2]'}
    sources=[{'title':'NVIDIA workstation','url':'https://example.com/'+str(i),'content':'NVIDIA workstation evidence'} for i in range(2)]
    model=Model(lambda:None,None)
    report=asyncio.run(model.report('NVIDIA workstation',sources))
    assert '[S1, S2]' in report
    placed=place_images([{'id':'I1','source_id':'S2','caption':'NVIDIA workstation'}],report)
    assert placed[0]['placement_text']=='NVIDIA workstation findings.'
    model.structured=lambda *args:{'report':'# Unsupported\n\nClaim [S1, S999]'}
    with pytest.raises(ModelUnavailable):asyncio.run(model.report('NVIDIA workstation',sources))


def test_image_placement_keeps_paragraph_immediately_below_heading():
    report='# Comparison\n\nGeneral overview of AI PCs and their limitations. [S1, S2]\n\n### Consumer AI PCs\nAI PCs provide everyday assistance. [S2]'
    placed=place_images([{'id':'I1','source_id':'S2','caption':'AI PCs'}],report)
    assert placed[0]['placement_text']=='AI PCs provide everyday assistance.'


def test_pending_reports_expose_collected_images_before_synthesis_budget_resumes(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(picture(),'image/png',url))
    rows=asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,[{'url':'https://example.com','title':'NVIDIA workstation','images':[{'url':'https://example.com/photo.png','caption':'NVIDIA workstation'}]}],'NVIDIA workstation'))
    store.request_state(identifier,CTX,phase='waiting_for_quota',sources=[{'url':'https://example.com','title':'NVIDIA workstation','content':'Collected evidence.','retrieved_at':'2026-10-19'}])
    asyncio.run(ResearchSearch(store,lambda _:None).search({'action':'images','research_id':identifier},CTX,'pending-images'))
    document=store.document(identifier,CTX,bounded=True)
    assert document['completeness']=='pending' and document['image_items'][0]['id']==rows[0]['id']
    assert 'url' not in document['image_items'][0]


def test_image_validation_continues_past_failed_first_batch_and_keeps_more_than_four(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path);calls=[]
    def fetch(url,image=False):
        calls.append(url)
        if not image:return b'<article>No article images.</article>','text/html',url
        number=int(url.rsplit('/',1)[1].split('.')[0])
        if number<8:raise ValueError('source_http_error')
        stream=io.BytesIO();Image.new('RGB',(800+number,500),(number*10,20,30)).save(stream,format='PNG')
        return stream.getvalue(),'image/png',url
    monkeypatch.setattr(store,'_fetch_public_source',fetch)
    source={'url':'https://example.com','title':'NVIDIA workstation','images':[{'url':f'https://example.com/{n}.png','caption':'NVIDIA workstation'} for n in range(14)]}
    rows=asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,[source],'NVIDIA workstation'))
    assert len(rows)==6 and len(calls)==14


def test_page_images_after_first_two_sources_and_lazy_srcset_originals(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    sources=[{'url':f'https://example.com/page{n}','title':'NVIDIA workstation','content':'Evidence'} for n in range(3)]
    def fetch(url,image=False):
        if image:return picture(),'image/png',url
        html='<article><p>NVIDIA workstation evidence.</p><picture><source srcset="/small.png 320w, /large.png 1600w"><img src="data:image/png;base64,AA" alt="NVIDIA workstation"></picture></article>' if url.endswith('page2') else '<article><p>No image here.</p></article>'
        return html.encode(),'text/html',url
    monkeypatch.setattr(store,'_fetch_public_source',fetch)
    rows=asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,sources,'NVIDIA workstation'))
    assert len(rows)==1 and rows[0]['url']=='https://example.com/large.png' and rows[0]['source_id']=='S3'


def test_internal_source_reader_retains_article_images_using_scoped_ids(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    store.request_state(identifier,CTX,sources=[{'url':'https://example.com/article','title':'NVIDIA workstation','content':'Evidence.'}])
    article=b'<nav><img src="/nav.png"></nav><article><p>NVIDIA workstation evidence.</p><figure><img data-src="/photo.png" alt="NVIDIA workstation"><figcaption>Workstation photo</figcaption></figure><img src="/google.png" alt="Add as a preferred source on Google"></article>'
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(picture(),'image/png',url) if image else (article,'text/html',url))
    body,mime=store.source_bytes(identifier,CTX,'S1',reader=True);page=json.loads(body)
    assert mime=='application/json' and len(page['images'])==1
    image=page['images'][0]
    assert image['id'] in page['html'] and 'data-research-image' in page['html']
    assert 'https://example.com/photo.png' not in page['html'] and 'url' not in image
    assert '/nav.png' not in page['html'] and store.image_bytes(identifier,CTX,image['id'])[1]=='image/png'
    with pytest.raises(ValueError):store.image_bytes(identifier,{**CTX,'project_id':'other'},image['id'])
