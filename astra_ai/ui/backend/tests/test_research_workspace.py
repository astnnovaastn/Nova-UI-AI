import asyncio,io,zipfile
from types import SimpleNamespace
import pytest
from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch

CTX={'profile_id':'owner','project_id':'one','session_id':'conversation'}
@pytest.fixture
def artifact(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    report=store.save('A sourced report','detailed','# A sourced report\n\nA supported finding [S1].\n\n## Details\n'+('Long evidence [S1].\n'*2000),[{'title':'Official source','url':'https://example.org/docs','retrieved_at':'2026-10-16T10:00:00Z','content':'Supported finding'}],[],CTX,'op')
    return store,report

def test_document_and_pages_share_exact_report_and_scope(artifact):
    store,r=artifact;d=store.document(r['id'],CTX,r['revision'])
    assert len(d['report'])>20000 and d['sources'][0]['id']=='S1'
    assert store.listing({**CTX,'project_id':'two'})['total']==0
    assert store.document(r['id'],{**CTX,'profile_id':'other'})['status']=='not_found'
    assert store.document(r['id'],CTX,'old')['status']=='conflict'
    assert store.get(r['id'],CTX)['artifact']['report']==d['report']


@pytest.mark.parametrize('recover',[True,False])
def test_extension_service_failure_retries_same_operation_without_research_or_duplicates(artifact,recover):
    from astra_ai.core.research_model import ResearchModelUnavailable
    store,r=artifact;calls=[]
    async def synth(*args):
        calls.append(args)
        if len(calls)==1 or not recover:raise ResearchModelUnavailable('Temporary outage')
        return '## Additional findings\n\nSupported findings with evidence [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synth)
    service._request=lambda *args:pytest.fail('Saved evidence must not be searched again')
    args={'research_id':r['id'],'research_revision':r['revision'],'detail':'Explain the supported finding'}
    first=asyncio.run(service.expand_report(args,CTX,'same-addition'))
    assert first['status']=='waiting_for_retry' and first['reason']=='gemini_service_unavailable'
    second=asyncio.run(service.expand_report(args,CTX,'same-addition'))
    if recover:
        assert second['status']=='completed'
        asyncio.run(service.expand_report(args,CTX,'same-addition'))
        assert len(calls)==2 and len(store.snapshot()['extensions'][r['id']])==1
    else:
        assert second['status']=='waiting_for_retry'
        assert asyncio.run(service.expand_report(args,CTX,'same-addition'))['status']=='failed'
        assert not store.snapshot().get('extensions',{}).get(r['id'])
        assert store.extension_operation(r['id'],CTX,'same-addition')['writer_service_attempts']==3

def test_draft_sanitization_optimistic_revision_and_recovery(artifact):
    store,r=artifact
    saved=store.save_draft(r['id'],CTX,r['revision'],'','<p>Hello <a href="javascript:evil()">bad</a><a href="https://example.org">good</a></p><script>evil()</script><img src="x" onerror="evil()">')
    assert saved['status']=='completed'
    html=saved['draft']['html'];assert 'javascript:' not in html and 'onerror' not in html and '<script' not in html
    assert store.save_draft(r['id'],CTX,r['revision'],'','overwrite')['status']=='conflict'
    v=saved['draft']['revision'];assert store.save_draft(r['id'],CTX,r['revision'],v,'<p>Updated</p>')['status']=='completed'
    assert store.path.with_suffix('.before-drafts.bak').exists()
    restarted=ResearchArtifacts(store.path)
    assert restarted.document(r['id'],CTX)['draft']['html']=='<p>Updated</p>'
    assert restarted.get(r['id'],CTX)['artifact']['report']==r['report']
    assert restarted.save_draft(r['id'],CTX,'','','x')['reason']=='source_revision_required'

@pytest.mark.parametrize('format',['md','html','pdf','docx'])
def test_exports_are_real_files_with_sources(artifact,format):
    store,r=artifact;body,mime=store.export(r['id'],CTX,r['revision'],format)
    assert body and mime
    if format=='pdf':assert body.startswith(b'%PDF') and b'example.org' in body
    elif format=='docx':
        z=zipfile.ZipFile(io.BytesIO(body));assert 'word/document.xml' in z.namelist();assert b'https://example.org/docs' in z.read('word/_rels/document.xml.rels')
    else:assert b'example.org' in body

def test_source_rejects_private_dns_before_fetch(artifact,monkeypatch):
    import socket
    store,r=artifact;monkeypatch.setattr(socket,'getaddrinfo',lambda *a,**k:[(2,1,6,'',('127.0.0.1',443))])
    with pytest.raises(ValueError,match='non_public_source'):store.source_bytes(r['id'],CTX,'S1')
    with pytest.raises(ValueError):store.source_bytes(r['id'],CTX,'../../secret')
    with pytest.raises(ValueError):store.source_bytes(r['id'],CTX,'S2')

def test_synthesis_failure_preserves_evidence_and_reports_partial(tmp_path):
    class Transport:
        def post(self,*a,**k):return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{'title':'Source','url':'https://example.org','content':'Actual evidence'}]})
    async def unavailable(*a):raise RuntimeError('quota fixture')
    store=ResearchArtifacts(tmp_path/'r.json');service=ResearchSearch(store,lambda k:'fixture',Transport(),synthesize=unavailable)
    result=asyncio.run(service.search({'query':'A public topic','mode':'detailed'},CTX,'public-op'))
    assert result['status']=='failed' and result['reason']=='synthesis_unavailable'
    doc=store.document(result['research_id'],CTX);assert not doc['sources'] and doc['phase']=='failed'
    assert store.request_state(result['research_id'],CTX)['sources'][0]['content']=='Actual evidence'
    assert not doc['report']

def test_synthesis_replaces_presentation_without_discarding_evidence(tmp_path):
    class Transport:
        def post(self,*a,**k):return SimpleNamespace(status_code=200,headers={},json=lambda:{'results':[{'title':'Source','url':'https://example.org','content':'Original source'}]})
    calls=[]
    async def synthesize(q,s):calls.append(q);return '# Answer\n\nA supported answer [S1].'
    store=ResearchArtifacts(tmp_path/'r.json');service=ResearchSearch(store,lambda k:'fixture',Transport(),synthesize=synthesize)
    async def scenario():
        one=await service.search({'query':'Public topic','mode':'detailed'},CTX,'op');two=await service.search({'query':'Public topic','mode':'detailed'},CTX,'op');return one,two
    one,two=asyncio.run(scenario());assert one==two and len(calls)==1
    doc=store.document(one['research_id'],CTX);assert doc['report']=='# Answer\n\nA supported answer [S1].' and doc['sources'][0]['content']=='Original source'

def test_unconfirmed_ui_write_never_becomes_completed_work(tmp_path):
    from astra_ai.core.action_jobs import ActionJobs
    async def scenario():
        async def execute(*a):return {'status':'unconfirmed','reason':'No observed result'}
        async def notify(*a):pass
        jobs=ActionJobs(tmp_path/'jobs.json',execute,notify,lambda c:True,{'ui_action'})
        queued=jobs.submit([{'name':'ui_action','arguments':{'action':'invoke'}}],CTX,'ui-op')
        job=jobs.list(queued['job_id'],CTX)['job'];await jobs.execute(job,0,job['actions'][0])
        assert jobs.list(queued['job_id'],CTX)['job']['actions'][0]['state']=='uncertain'
    asyncio.run(scenario())

@pytest.mark.parametrize('ack',[None,{'status':'unconfirmed'},{'status':'completed','observed':{'visible':True}}])
def test_ui_transport_does_not_invent_completion_or_accept_supplied_scope(ack):
    import ast,uuid
    from pathlib import Path
    from typing import Dict,Any
    source=Path(__file__).parents[1]/'server.py';tree=ast.parse(source.read_text(encoding='utf-8'))
    node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='_gemini_ui_action')
    sent=[]
    async def send(client,payload):sent.append((client,payload))
    async def wait(*a,**k):return ack
    env={'Dict':Dict,'Any':Any,'uuid':uuid,'state':SimpleNamespace(register_widget_action=lambda *a:None,await_widget_action=wait),'ws_manager':SimpleNamespace(send_to_client_id=send)}
    exec(compile(ast.Module(body=[node],type_ignores=[]),str(source),'exec'),env)
    result=asyncio.run(env['_gemini_ui_action']('actual-client',{'action':'workspace','workspace':'research','profile_id':'attacker','client_id':'attacker'}))
    assert sent[0][0]=='actual-client' and 'profile_id' not in sent[0][1] and 'client_id' not in sent[0][1]
    assert result['status']==(ack or {'status':'unconfirmed'})['status']

def test_destructive_confirmation_is_bound_to_owner_state_and_operation():
    import ast,time,re,uuid
    from pathlib import Path
    source=Path(__file__).parents[1]/'server.py';tree=ast.parse(source.read_text(encoding='utf-8'));node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='_confirm_destructive')
    pending={};sent=[]
    async def send(client,payload):sent.append(payload)
    async def wait(*a,**k):return None
    env={'asyncio':asyncio,'time':time,'re':re,'uuid':uuid,'_destructive_revision':lambda *a:'revision-one','_destructive_confirmations':pending,'state':SimpleNamespace(register_widget_action=lambda *a:None,await_widget_action=wait),'ws_manager':SimpleNamespace(send_to_client_id=send)}
    exec(compile(ast.Module(body=[node],type_ignores=[]),str(source),'exec'),env);confirm=env['_confirm_destructive']
    context={**CTX,'client_id':'owner','operation_id':'operation'}
    assert asyncio.run(confirm('notes_action',{'action':'delete','note_id':'n1'},context))['status']=='waiting_for_ui'
    assert len(sent)==1
    assert asyncio.run(confirm('notes_action',{'action':'delete','note_id':'n1'},context))['status']=='waiting_for_ui'
    assert len(sent)==1
    pending[('owner','revision-one')]['state']='approved'
    assert asyncio.run(confirm('notes_action',{'action':'delete','note_id':'n1'},context)) is None
    assert asyncio.run(confirm('notes_action',{'action':'delete','note_id':'n1'},{**context,'operation_id':'other'}))['status']=='rejected'
    assert asyncio.run(confirm('notes_action',{'action':'delete'},{**context,'guest':True}))['status']=='rejected'


def video_transport(status=200):
    calls=[]
    class Transport:
        def get(self,url,**kwargs):
            calls.append(kwargs['params'])
            return SimpleNamespace(status_code=status,json=lambda:{'video_results':[
                {'title':'Evidence video','link':'https://www.youtube.com/watch?v=abcdefghijk','description':'A public topic explained','channel':{'name':'Official channel'},'thumbnail':{'static':'https://i.ytimg.com/vi/abcdefghijk/default.jpg'}},
                {'title':'Duplicate','link':'https://youtu.be/abcdefghijk'},
                {'title':'Not a video','link':'https://youtube.com/channel/invalid'},
                {'title':'Other evidence','link':'https://www.youtube.com/watch?v=12345678901'}]})
    return Transport(),calls


def test_media_discovery_is_one_scoped_request_and_never_mutates_report_or_draft(artifact):
    store,r=artifact;transport,calls=video_transport()
    draft=store.save_draft(r['id'],CTX,r['revision'],'','<p>My draft</p>')['draft']
    service=ResearchSearch(store,lambda k:'fixture',transport)
    async def scenario():return await asyncio.gather(*(service.enrich_media(r['id'],CTX,r['revision']) for _ in range(3)))
    results=asyncio.run(scenario())
    assert len(calls)==1 and calls[0]['engine']=='youtube'
    assert all(len(result['media'])==2 for result in results)
    assert len({row['video_id'] for row in results[0]['media']})==2
    restarted=ResearchArtifacts(store.path);service=ResearchSearch(restarted,lambda k:'fixture',transport)
    asyncio.run(service.enrich_media(r['id'],CTX,r['revision']))
    assert len(calls)==1
    document=restarted.document(r['id'],CTX)
    assert document['report']==r['report'] and document['research_revision']==r['revision']
    assert document['sources'][0]['id']=='S1' and document['draft']==draft
    assert document['media_revision'] and store.path.with_suffix('.before-media.bak').exists()
    assert restarted.media(r['id'],{**CTX,'project_id':'other'})['status']=='not_found'
    assert asyncio.run(service.enrich_media(r['id'],CTX,'stale'))['status']=='conflict'


def test_video_quota_preserves_report_and_does_not_retry(artifact):
    store,r=artifact;transport,calls=video_transport(429);service=ResearchSearch(store,lambda k:'fixture',transport)
    one=asyncio.run(service.enrich_media(r['id'],CTX));two=asyncio.run(service.enrich_media(r['id'],CTX))
    assert one['media_status']=='partial' and two['media_failures'][0]['reason']=='video_provider_quota'
    assert len(calls)==1 and store.get(r['id'],CTX)['artifact']['report']==r['report']


def test_uncertain_media_request_after_restart_is_not_replayed(artifact):
    store,r=artifact;store.media_state(r['id'],CTX,r['revision'],status='running',attempted=True)
    transport,calls=video_transport();service=ResearchSearch(ResearchArtifacts(store.path),lambda k:'fixture',transport)
    result=asyncio.run(service.enrich_media(r['id'],CTX))
    assert not calls and result['media_status']=='unavailable'
    assert result['media_failures'][0]['reason']=='video_request_interrupted_no_automatic_retry'


@pytest.mark.parametrize('mode,count',[('quick',0),('detailed',3)])
def test_existing_videos_and_quick_lookup_never_spend_extra_credit(tmp_path,mode,count):
    store=ResearchArtifacts(tmp_path/'r.json')
    sources=[{'title':'Video','url':'https://youtube.com/watch?v='+v,'retrieved_at':'2026-10-16'} for v in ['abcdefghijk','12345678901','ABCDEFGHIJK'][:count]]
    r=store.save('Public topic',mode,'Report',sources,[],CTX,'op')
    transport,calls=video_transport();result=asyncio.run(ResearchSearch(store,lambda k:'fixture',transport).enrich_media(r['id'],CTX))
    assert not calls and len(result['media'])==count


def test_internal_source_reader_preserves_structure_and_mints_scoped_link_ids(artifact,monkeypatch):
    import json
    store,r=artifact;calls=[]
    def fetch(url):
        calls.append(url)
        return b'<html><nav>Navigation clutter</nav><article><h1>Actual heading</h1><p>Evidence <strong>retained</strong>.</p><a href="/next">Next article</a><a href="javascript:evil()">Bad link</a><script>evil()</script><table><tr><td>Data</td></tr></table></article></html>','text/html',url
    monkeypatch.setattr(store,'_fetch_public_source',fetch)
    body,mime=store.source_bytes(r['id'],CTX,'S1',True,r['revision']);reader=json.loads(body)
    assert mime=='application/json' and '<h1>' in reader['html'] and '<table>' in reader['html']
    assert 'Navigation clutter' not in reader['html'] and 'javascript:' not in reader['html'] and '<script' not in reader['html']
    link_id=next(iter(reader['links']));assert reader['links'][link_id]=='https://example.org/next'
    assert 'data-source-link="'+link_id+'"' in reader['html']
    store.source_bytes(r['id'],CTX,'S1',True,r['revision']);assert len(calls)==1
    store.source_bytes(r['id'],CTX,link_id,True,r['revision']);assert calls[-1]=='https://example.org/next'
    with pytest.raises(ValueError):store.source_bytes(r['id'],{**CTX,'profile_id':'other'},link_id,True)
    second=store.save('Different report','detailed','Other report',r['sources'],[],CTX,'second')
    with pytest.raises(ValueError,match='source_link_expired'):store.source_bytes(second['id'],CTX,link_id,True)
    with pytest.raises(ValueError,match='conflict'):store.source_bytes(r['id'],CTX,'S1',True,'old')


def test_source_reader_blocks_private_follow_on_links_when_opened(artifact,monkeypatch):
    import json,socket
    store,r=artifact
    monkeypatch.setattr(store,'_fetch_public_source',lambda url:(b'<article><a href="http://127.0.0.1/private">Internal</a></article>','text/html',url))
    reader=json.loads(store.source_bytes(r['id'],CTX,'S1',True)[0]);link_id=next(iter(reader['links']))
    monkeypatch.setattr(store,'_fetch_public_source',ResearchArtifacts._fetch_public_source)
    monkeypatch.setattr(socket,'getaddrinfo',lambda *a,**k:[(2,1,6,'',('127.0.0.1',80))])
    with pytest.raises(ValueError,match='non_public_source'):store.source_bytes(r['id'],CTX,link_id,True)


def test_report_follow_on_links_must_exist_in_preserved_evidence(tmp_path,monkeypatch):
    store=ResearchArtifacts(tmp_path/'r.json')
    report=store.save('Public topic','detailed','[Known](https://example.org/evidence) [Invented](https://invented.invalid/claim)',[{'title':'Source','url':'https://example.org/source','content':'[A real link](https://example.org/evidence)','retrieved_at':'2026-10-16'}],[],CTX,'op')
    doc=store.document(report['id'],CTX)
    assert [row['url'] for row in doc['linked_sources']]==['https://example.org/evidence']
    monkeypatch.setattr(store,'_fetch_public_source',lambda url:(b'<p>Read internally</p>','text/html',url))
    assert b'Read internally' in store.source_bytes(report['id'],CTX,doc['linked_sources'][0]['id'],True)[0]


def test_videos_linked_in_report_evidence_count_toward_the_shared_media_set(tmp_path):
    store=ResearchArtifacts(tmp_path/'r.json');urls=['https://youtube.com/watch?v='+v for v in ['abcdefghijk','12345678901','ABCDEFGHIJK']]
    body='\n'.join('[Evidence video '+str(i)+']('+url+')' for i,url in enumerate(urls))
    report=store.save('Public topic','detailed',body,[{'title':'Source','url':'https://example.org','content':body,'retrieved_at':'2026-10-16'}],[],CTX,'op')
    transport,calls=video_transport();result=asyncio.run(ResearchSearch(store,lambda k:'fixture',transport).enrich_media(report['id'],CTX))
    assert len(result['media'])==3 and not calls
    assert result['media'][0]['title']=='Evidence video 0'
