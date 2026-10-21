import asyncio
from types import SimpleNamespace
from astra_ai.core.research_learning import ResearchArtifacts,ResearchSearch
from astra_ai.core.research_sessions import reserve_page,pages,continuation_kind

CTX={'profile_id':'owner','project_id':'space','session_id':'live-session'}
SOURCE={'title':'Space evidence','url':'https://example.org/space','content':'Supported telescope findings.','retrieved_at':'2026-10-21'}

def entry(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json')
    row=store.reserve('Hubble and Webb telescopes','detailed',CTX,'root')
    item=store.save(row['query'],'detailed','# Telescopes\n\nSupported findings [S1].',[SOURCE],[],CTX,row['operation_id'])
    return store,item

def test_pages_share_thread_without_sharing_live_session_or_history_rows(tmp_path):
    store,root=entry(tmp_path)
    child=reserve_page(store,root['id'],CTX,'NASA spacecraft','new-page')
    assert child['research_session_id']==root['id'] and child['thread_id']==root['thread_id']
    assert child['session_id']=='live-session' and child['mode']=='detailed'
    assert len(pages(store,child['id'],CTX)['pages'])==2
    assert store.listing(CTX)['total']==1
    assert reserve_page(store,root['id'],CTX,'NASA spacecraft','new-page')['id']==child['id']
    assert reserve_page(store,root['id'],CTX,'Different query','new-page')['status']=='conflict'
    assert pages(store,child['id'],{**CTX,'profile_id':'other'})['status']=='not_found'

def test_session_removal_hides_pending_children_and_restore_retains_them(tmp_path):
    store,root=entry(tmp_path);child=reserve_page(store,root['id'],CTX,'NASA spacecraft','child')
    preview=store.deletion_preview(root['id'],CTX)
    removed=store.remove(root['id'],CTX,preview['revision'],'remove')
    assert store.get(child['id'],CTX)['status']=='not_found'
    assert store.listing(CTX)['total']==0
    assert store.restore(root['id'],CTX,removed['undo_token'])['status']=='completed'
    assert len(pages(store,child['id'],CTX)['pages'])==2

def test_pending_document_and_reader_do_not_leak_evidence_or_illustrations(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.reserve('Webb','detailed',CTX,'wait')
    store.request_state(row['id'],CTX,phase='waiting_for_quota',sources=[SOURCE],selected_images=[{'id':'I1','url':'https://example.org/image.png','caption':'Webb'}])
    document=store.document(row['id'],CTX,bounded=True)
    assert document['sources']==[] and document['image_items']==[] and document['media']==[] and document['report']==''
    assert store.reader(row['id'],CTX)['report']==''
    assert store.request_state(row['id'],CTX)['sources']==[SOURCE]

def test_prepared_answer_stays_hidden_until_media_settles_and_publication_survives_restart(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');row=store.reserve('Webb','detailed',CTX,'publish')
    item=store.save('Webb','detailed','# Webb\n\nAnswer [S1].',[SOURCE],[],{**CTX,'prepare_publication':True},row['operation_id'])
    pending=store.document(item['id'],CTX,bounded=True)
    assert pending['publication_state']=='preparing' and pending['report']=='' and pending['sources']==[]
    store.media_state(item['id'],CTX,item['revision'],status='unavailable',failures=[{'reason':'no_videos'}])
    store.publish_prepared(item['id'],CTX)
    final=ResearchArtifacts(store.path).document(item['id'],CTX,bounded=True)
    assert final['report']==item['report'] and final['publication_state']=='published' and len(final['sources'])==1
    assert final['update_sequence']>pending['update_sequence']

def test_media_preparation_precedes_completed_job_and_does_not_repeat_after_restart(tmp_path):
    store=ResearchArtifacts(tmp_path/'reports.json');calls=[]
    async def synthesize(*args):return '# Webb\n\nFull supported answer [S1].'
    service=ResearchSearch(store,lambda _:None,synthesize=synthesize,prepare_media=True)
    service._request=lambda *args:([SOURCE],None)
    async def media(identifier,context,revision):
        calls.append(identifier)
        assert store.document(identifier,context)['report']==''
        store.media_state(identifier,context,revision,status='complete',items=[])
        return {'status':'completed'}
    service.enrich_media=media
    result=asyncio.run(service.search({'query':'Webb','mode':'detailed'},CTX,'job'))
    assert result['status']=='completed' and len(calls)==1
    assert asyncio.run(service.search({'query':'Webb','mode':'detailed'},CTX,'job'))['research_id']==result['research_id'] and len(calls)==1

def test_extension_operations_keep_independent_receipts_and_base_drafts(tmp_path):
    store,root=entry(tmp_path)
    store.extension_state(root['id'],CTX,operation_id='one',phase='collecting_sources',search_checkpoint=[SOURCE])
    store.extension_state(root['id'],CTX,operation_id='two',phase='queued')
    assert store.extension_operation(root['id'],CTX,'one')['search_checkpoint']==[SOURCE]
    assert 'search_checkpoint' not in store.extension_operation(root['id'],CTX,'two')
    store.append_extension(root['id'],CTX,root['revision'],'one','## Instruments\n\nMore evidence [S1].')
    store.append_extension(root['id'],CTX,root['revision'],'one','SHOULD NOT DUPLICATE')
    assert len(store.snapshot()['extensions'][root['id']])==1
    assert store.extension_operation(root['id'],CTX,'one')['phase']=='complete'
    assert store.get(root['id'],CTX)['artifact']['report']==root['report']

def test_request_routing_distinguishes_enrichment_another_subject_and_explicit_sessions():
    assert continuation_kind('Research NASA spacecraft','Hubble versus Webb')=='new_page'
    assert continuation_kind('Research NASA spacecraft on a new page in this same conversation','Hubble versus Webb')=='new_page'
    assert continuation_kind('Append this to the same report, not a new page','Hubble versus Webb','new_page')=='extend'
    assert continuation_kind('Research Google robotics','Google Deep Research model')=='new_page'
    assert continuation_kind('Add more detail about its instruments','Hubble versus Webb')=='extend'
    assert continuation_kind('Which device has the better camera?','Phone comparison')=='extend'
    assert continuation_kind('Research the same topic further','Hubble versus Webb')=='extend'
    assert continuation_kind('Start a new conversation about NASA','Hubble versus Webb')=='new_session'
