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
    assert result['completeness']=='partial' and result['failures'][0]['reason']=='synthesis_unavailable'
    doc=store.document(result['research_id'],CTX);assert 'Actual evidence' in doc['report'] and 'not a completed synthesis' in doc['report']

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
