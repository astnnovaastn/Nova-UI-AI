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


@pytest.mark.parametrize('mode,ceiling,tokens',[('quick',18000,6000),('detailed',60000,12000)])
def test_research_depth_packs_later_evidence_and_keeps_quick_and_detailed_distinct(tmp_path,mode,ceiling,tokens):
    calls=[]
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs)
            return SimpleNamespace(text=json.dumps({'report':'# Findings\n\nA supported conclusion [S1].'}))
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'gemini.json',daily_tokens=400000,min_interval=0)
    model=GeminiResearchModel(lambda:'test',budget,lambda:'configured-gemini',Client)
    sources=[{'url':'https://example.com/'+str(i),'title':'Study '+str(i),'content':'Methods and results. '*350+'LATER_RESULT_'+str(i)+'.'} for i in range(8)]
    asyncio.run(model.report(('[QUICK]\n' if mode=='quick' else '')+'Compare study findings',sources))
    payload=json.loads(calls[0]['contents']);evidence=payload['evidence']
    assert payload['mode']==mode and sum(len(row['content']) for row in evidence)<=ceiling
    assert calls[0]['config'].max_output_tokens==tokens and budget.snapshot()['requests']==1
    if mode=='detailed':
        assert sum(len(row['content']) for row in evidence)>50000
        assert all('LATER_RESULT_'+str(i) in row['content'] for i,row in enumerate(evidence))
        assert '12,000–18,000' in calls[0]['config'].system_instruction
    else:assert all('LATER_RESULT_' not in row['content'] for row in evidence)

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


def test_normal_quick_search_reads_articles_before_writing_and_resumes_without_retrieval(tmp_path,monkeypatch):
    store,_=entry(tmp_path);calls=[];reads=[];attempts=[]
    source={'url':'https://example.com/workstation','title':'Workstation evidence','content':'A short search snippet.','retrieved_at':'2026-10-20'}
    article='Substantive source explanations, specifications and comparisons. '*150
    def read(*args):reads.append(args);return article.encode(),'text/plain; charset=utf-8'
    monkeypatch.setattr(store,'source_bytes',read)
    async def synth(query,sources):
        attempts.append(sources)
        assert sources[0]['content']==article and sources[0]['search_excerpt']==source['content']
        if len(attempts)==1:raise BudgetPaused(9999999999,'gemini_daily_quota')
        return '# Workstation evidence\n\nA connected explanation of the collected evidence [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth,read_evidence=True)
    service._request=lambda *args:(calls.append(args) or ([source],None))
    args={'query':'Compare workstations','mode':'quick'}
    first=asyncio.run(service.search(args,CTX,'normal'))
    second=asyncio.run(service.search(args,CTX,'normal'))
    assert first['status']=='waiting_for_quota' and second['status']=='completed'
    assert len(calls)==1 and calls[0][1]=='quick' and len(reads)==1

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


def test_gemini_budget_settles_actual_usage_and_explicit_rejections(tmp_path):
    budget=BackgroundBudget(tmp_path/'gemini.json',min_interval=0)
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):return SimpleNamespace(text='{"report":"A supported answer."}',usage_metadata=SimpleNamespace(total_token_count=321))
        def close(self):pass
    model=GeminiResearchModel(lambda:'test',budget,lambda:'configured-gemini',Client)
    model.structured('Compose the answer',{}, {'type':'object'})
    assert budget.snapshot()['tokens']==321 and budget.snapshot()['settled_tokens']==321
    class QuotaError(Exception):code=429
    def rejected(**kwargs):raise QuotaError()
    class Rejected(Client):
        def generate_content(self,**kwargs):return rejected(**kwargs)
    model.client_factory=Rejected
    with pytest.raises(BudgetPaused):model.structured('Compose the answer',{}, {'type':'object'})
    assert budget.snapshot()['tokens']==321 and budget.snapshot()['requests']==2


def test_token_reservation_cannot_double_refund_or_refund_uncertain_usage(tmp_path):
    budget=BackgroundBudget(tmp_path/'usage.json',min_interval=0)
    with budget.lease(1000) as reservation:
        reservation.settle(200);reservation.settle(0)
    assert budget.snapshot()['tokens']==200
    with pytest.raises(TimeoutError):
        with budget.lease(1000):raise TimeoutError()
    assert budget.snapshot()['tokens']==1200


def test_research_policy_preserves_learning_limits_and_resume_is_checkpoint_scoped(tmp_path):
    import time,copy
    from datetime import datetime,timezone
    from astra_ai.core.research_model import requested_research_budget,resume_research_budget_waits
    from astra_ai.memory.shared_memory import StorageLock,read,atomic
    store,identifier=entry(tmp_path)
    store.request_state(identifier,CTX,phase='waiting_for_quota',waiting_reason='background_daily_budget',sources=[{'url':'https://example.com','title':'NVIDIA','content':'Saved evidence','retrieved_at':'2026-10-19'}])
    learning=BackgroundBudget(tmp_path/'learning.json')
    budget=requested_research_budget(tmp_path/'research.json',learning.slot,lambda _:None)
    assert learning.daily_tokens==80000 and budget.daily_tokens==400000 and budget.slot is learning.slot
    atomic(budget.path,{'day':datetime.now(timezone.utc).date().isoformat(),'requests':8,'tokens':75402,'next_attempt':0})
    action={'name':'search_web','state':'waiting_for_retry','arguments':{'research_id':identifier},'result':{'reason':'background_daily_budget'},'next_attempt':time.time()+86400,'attempts':2}
    path=tmp_path/'jobs.json'
    jobs=SimpleNamespace(path=path,lock=StorageLock(tmp_path/'jobs.lock'),load=lambda:read(path,{}),write=lambda value:atomic(path,value))
    ready={'state':'waiting_for_retry','context':{**CTX,'requested_research':True},'actions':[copy.deepcopy(action)]}
    foreign=copy.deepcopy(ready);foreign['context']['project_id']='another-project'
    provider=copy.deepcopy(ready);provider['actions'][0]['result']['reason']='gemini_rate_limit'
    atomic(path,{'jobs':{'ready':ready,'foreign':foreign,'provider':provider}})
    assert resume_research_budget_waits(jobs,store,budget)==1
    result=read(path,{})
    assert result['jobs']['ready']['actions'][0]['state']=='queued'
    assert result['jobs']['ready']['actions'][0]['attempts']==2
    assert result['jobs']['foreign']['state']=='waiting_for_retry' and result['jobs']['provider']['state']=='waiting_for_retry'
    assert resume_research_budget_waits(jobs,store,budget)==0
    assert store.request_state(identifier,CTX)['sources'][0]['content']=='Saved evidence'


def test_gemini_refuses_output_limit_and_reserves_room_for_complete_detailed_report(tmp_path):
    from astra_ai.core.background_model import ModelUnavailable
    calls=[]
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs);return SimpleNamespace(text='{"report":"unfinished"}',usage_metadata=SimpleNamespace(total_token_count=100),candidates=[SimpleNamespace(finish_reason='MAX_TOKENS')])
        def close(self):pass
    model=GeminiResearchModel(lambda:'test',BackgroundBudget(tmp_path/'budget.json',min_interval=0),lambda:'configured-gemini',Client)
    with pytest.raises(ModelUnavailable,match='output limit'):model.structured('Report',{'query':'A detailed topic'},{'type':'object'},6000)
    assert calls[0]['config'].max_output_tokens==12000


def test_report_completion_revision_keeps_original_and_draft_without_researching_again(tmp_path):
    store,identifier=entry(tmp_path)
    old=store.save('NVIDIA workstation comparison','detailed','# Answer\n\nAn unfinished',[{'url':'https://example.com','title':'NVIDIA evidence','content':'Supported comparison.','retrieved_at':'2026-10-19'}],[],CTX,'sample')
    draft=store.save_draft(identifier,CTX,old['revision'],'','<p>User edited this.</p>')['draft']
    calls=[]
    async def synth(query,sources):calls.append(query);return '# Complete comparison\n\nA complete supported answer. [S1]'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *a:pytest.fail('Completion must reuse the saved evidence')
    args={'action':'repair','research_id':identifier,'research_revision':old['revision']}
    result=asyncio.run(service.search(args,CTX,'repair'))
    assert result['status']=='completed'
    assert store.get(identifier,CTX,old['revision'])['artifact']['report']==old['report']
    assert store.document(identifier,CTX)['draft']==draft
    assert store.get(identifier,CTX)['artifact']['report'].endswith('answer. [S1]')
    asyncio.run(service.search(args,CTX,'repair'))
    assert len(calls)==1 and len(store.snapshot()['report_history'][identifier])==1


def test_gemini_completes_valid_json_that_contains_unfinished_prose(tmp_path):
    calls=[]
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            calls.append(payload)
            return {'report':'# Answer\n\nSupported first section. [S1]\n\nThe remaining answer is'} if len(calls)==1 else {'report':'The remaining answer is supported by this evidence [S1].\n\n## Limitations\nNo unsupported details are invented [S1].'}
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'budget.json'),lambda:'configured-gemini')
    report=asyncio.run(model.report('A detailed comparison',[{'url':'https://example.com','title':'Evidence','content':'Supported facts.'}]))
    assert len(calls)==2 and calls[1]['unfinished_paragraph']=='The remaining answer is'
    assert report.count('Supported first section.')==1 and report.endswith('[S1].')


def test_plain_generated_headline_is_presented_as_heading_without_rewriting_archive(tmp_path):
    store,identifier=entry(tmp_path)
    report='A Clear Hardware Comparison\n\nThe source supports this answer [S1].'
    store.save('NVIDIA workstation comparison','detailed',report,[],[],CTX,'sample')
    assert store.reader(identifier,CTX)['report'].startswith('# A Clear Hardware Comparison\n\n')
    assert store.get(identifier,CTX)['artifact']['report']==report


def test_completion_keeps_main_answer_across_short_local_pacing_and_rejects_zero_citation(tmp_path):
    import time
    from astra_ai.core.background_model import ModelUnavailable
    class Model(GeminiResearchModel):
        calls=0
        def structured(self,instruction,payload,schema,max_tokens=1600):
            self.calls+=1
            if self.calls==1:raise BudgetPaused(time.time()+.01,'background_quota_paused')
            return {'report':'Remaining findings are supported [S1].'}
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'pacing.json'),lambda:'configured-gemini')
    evidence=[{'title':'Evidence','content':'Supported facts.'}]
    report=asyncio.run(model.complete_report('# Heading\n\nExisting findings [S1].\n\nUnfinished','Question',evidence))
    assert model.calls==2 and report.count('Existing findings')==1 and report.endswith('[S1].')
    model.structured=lambda *args:{'report':'Unsupported reference [S0].'}
    with pytest.raises(ModelUnavailable,match='unverifiable'):asyncio.run(model.complete_report('Unfinished','Question',evidence))


def test_repair_completes_saved_prose_without_recomposing_the_report(tmp_path):
    store,identifier=entry(tmp_path)
    old=store.save('NVIDIA workstation comparison','detailed','# Answer\n\nExisting findings [S1].\n\nUnfinished',[{'url':'https://example.com','title':'Evidence','content':'Supported facts.','retrieved_at':'2026-10-19'}],[],CTX,'sample')
    calls=[]
    async def complete(report,query,sources):
        calls.append(report);return report.removesuffix('Unfinished')+'A complete ending [S1].'
    async def synth(*args):pytest.fail('Do not regenerate already composed sections')
    service=ResearchSearch(store,lambda _:None,synthesize=synth,complete=complete)
    result=asyncio.run(service.search({'action':'repair','research_id':identifier,'research_revision':old['revision']},CTX,'complete-saved'))
    assert result['status']=='completed' and calls==[old['report']]
    assert store.get(identifier,CTX)['artifact']['report'].endswith('ending [S1].')


def test_unfinished_completion_is_checkpointed_and_resumed_without_repeating_prefix(tmp_path):
    from astra_ai.core.research_model import IncompleteResearchAnswer
    store,identifier=entry(tmp_path)
    old=store.save('NVIDIA workstation comparison','detailed','# Answer\n\nUnfinished',[{'url':'https://example.com','title':'Evidence','content':'Supported facts.','retrieved_at':'2026-10-19'}],[],CTX,'sample')
    calls=[]
    async def complete(report,query,sources):
        calls.append(report)
        if len(calls)==1:raise IncompleteResearchAnswer('# Answer\n\nCompleted findings [S1].\n\nRemaining')
        return report.removesuffix('Remaining')+'Conclusion [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=complete,complete=complete)
    args={'action':'repair','research_id':identifier,'research_revision':old['revision']}
    assert asyncio.run(service.search(args,CTX,'resume-completion'))['status']=='waiting_for_retry'
    assert store.get(identifier,CTX)['artifact']['report']==old['report']
    assert asyncio.run(service.search(args,CTX,'resume-completion'))['status']=='completed'
    assert calls[1].endswith('Remaining') and store.get(identifier,CTX)['artifact']['report'].count('Completed findings')==1


def test_substantial_partial_report_finishes_with_bounded_findings_and_verdict(tmp_path):
    class Model(GeminiResearchModel):
        def structured(self,instruction,payload,schema,max_tokens=1600):
            assert max_tokens==3000 and set(schema['required'])=={'findings','recommendations','limitations'}
            return {'findings':'Remaining findings are supported [S1].','recommendations':'Choose based on the verified trade-offs [S1].','limitations':'Unavailable prices cannot be verified [S1].'}
    model=Model(lambda:'test',BackgroundBudget(tmp_path/'summary.json'),lambda:'configured-gemini')
    prefix='# Comparison\n\n'+'Supported findings [S1]. '*520
    report=asyncio.run(model.complete_report(prefix+'\n\nUnfinished','Compare products',[{'title':'Evidence','content':'Supported findings.'}]))
    assert report.startswith(prefix) and report.endswith('[S1].') and len(report)<20000


def test_recompressed_resized_picture_is_deduplicated_but_distinct_images_remain():
    from PIL import ImageDraw
    from astra_ai.core.research_illustrations import image_fingerprint,same_picture
    image=Image.new('RGB',(800,500),'#326397');draw=ImageDraw.Draw(image)
    draw.rectangle((100,80,650,400),fill='#e7c778');draw.ellipse((250,160,420,330),fill='#702060')
    def row(image,quality):
        stream=io.BytesIO();image.save(stream,format='JPEG',quality=quality)
        return {'width':image.width,'height':image.height,**image_fingerprint(stream.getvalue())}
    original=row(image,95);resized=row(image.resize((640,400)),70)
    assert same_picture(original,resized)
    draw.rectangle((0,0,600,500),fill='#109020')
    assert not same_picture(original,row(image,95))


def test_image_placement_limits_groups_and_keeps_product_identity_in_its_passage():
    images=[{'id':'I'+str(n),'source_id':'S1','caption':'Samsung Galaxy S26 Ultra product image'} for n in range(7)]
    images += [{'id':'wrong','source_id':'S1','caption':'Honor Magic V5 product image'}]
    report='# Phones\n\nApple iPhone 17 Pro offers the first comparison [S1].\n\nSamsung Galaxy S26 Ultra has supported display findings [S1].\n\nSamsung Galaxy S26 Ultra has supported camera findings [S1].'
    placed=place_images(images,report)
    assert len(placed)==4 and all('Samsung' in image['placement_text'] for image in placed)
    assert max(sum(other['placement_text']==image['placement_text'] for other in placed) for image in placed)<=3


def test_illustration_budget_is_four_normally_and_never_exceeds_six():
    images=[{'id':'I'+str(n),'source_id':'S1','caption':'NVIDIA workstation architecture'} for n in range(30)]
    short='# NVIDIA Workstations\n\n'+''.join(f'NVIDIA workstation architecture comparison {i} [S1].\n\n' for i in range(12))
    assert len(place_images(images,short))==4
    long=short+'\n\n'+('Supported NVIDIA workstation architecture findings. '*400)
    assert len(place_images(images,long))==6


def test_saved_report_presentation_caps_legacy_images_without_fetch_or_draft_changes(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    report='# NVIDIA Workstations\n\n'+''.join(f'NVIDIA workstation architecture finding {i} [S1].\n\n' for i in range(10))
    item=store.save('NVIDIA workstation comparison','detailed',report,[],[],CTX,'sample')
    rows=[{'id':'I'+str(n),'url':f'https://example.com/{n}.png','source_id':'S1','caption':'NVIDIA workstation architecture'} for n in range(20)]
    store.request_state(identifier,CTX,selected_images=rows,validated_images=rows,images_prepared=True,image_enrichment_version=5)
    draft=store.save_draft(identifier,CTX,item['revision'],'','<p>Preserve my draft.</p>')['draft']
    monkeypatch.setattr(store,'_fetch_public_source',lambda *a:pytest.fail('Saved presentation must not fetch'))
    doc=store.document(identifier,CTX,bounded=True)
    assert len(doc['image_items'])==4 and doc['draft']==draft
    assert len(store.images(identifier,CTX))==20
    assert store.get(identifier,CTX)['artifact']['report']==report


def test_illustrated_draft_groups_survive_sanitization_and_revision_history(tmp_path):
    store,identifier=entry(tmp_path);revision=store.get(identifier,CTX)['artifact']['revision']
    html='<div data-illustrated="" data-composition="pair"><div data-image-group="pair"><img src="https://example.com/a.png" alt="A"><img src="https://example.com/b.png" alt="B"></div><div data-illustrated-copy=""><p>Connected prose.</p></div></div>'
    result=store.save_draft(identifier,CTX,revision,'',html)
    assert result['status']=='completed'
    assert 'data-image-group="pair"' in result['draft']['html']
    assert 'data-illustrated-copy' in result['draft']['html']


def test_image_upgrade_keeps_old_duplicate_ids_available_to_existing_drafts(tmp_path,monkeypatch):
    store,identifier=entry(tmp_path)
    rows=[{'id':'I'+str(n)*24,'url':f'https://example.com/photo{n}.png','source_id':'S1','caption':'NVIDIA workstation','publication':'example.com','source_url':'https://example.com'} for n in (1,2)]
    store.request_state(identifier,CTX,images_prepared=True,image_enrichment_version=4,validated_images=rows,selected_images=rows,image_search_attempted=True,image_pages_version=5)
    monkeypatch.setattr(store,'_fetch_public_source',lambda url,image=False:(picture(),'image/png',url))
    selected=asyncio.run(prepare_images(ResearchSearch(store,lambda _:None),identifier,CTX,[],'NVIDIA workstation'))
    assert len(selected)==1
    archived=store.request_state(identifier,CTX)['image_archive']
    assert archived[0]['id']==rows[1]['id'] and archived[0]['source_only']
    assert store.image_bytes(identifier,CTX,rows[1]['id'])[1]=='image/png'


def test_phone_comparison_does_not_illustrate_incidental_other_models():
    rows=[{'id':'main','source_id':'S1','caption':'Samsung Galaxy S26 Ultra'}, {'id':'incidental','source_id':'S1','caption':'OnePlus 15'}]
    report='# Apple iPhone 17 and Samsung Galaxy S26 Ultra\n\n## Samsung Galaxy S26 Ultra\n\nThe camera comparison also briefly mentions the OnePlus 15 [S1].'
    assert [row['id'] for row in place_images(rows,report)]==['main']
