import copy
import json
import pytest
from astra_ai.core.research.storage import FolderResearchStore, ResearchBackups, digest
from astra_ai.core.research_learning import ResearchArtifacts
from astra_ai.memory.shared_memory import atomic, read


def sample():
    return {'artifacts': {'a': {'id':'a','research_session_id':'root','report':'Text [S1].'}},
            'requests': {'a': {'id':'a','research_session_id':'root','phase':'complete'}},
            'drafts': {'a': {'html':'<p>Original</p>','revision':'d1'}},
            'extensions': {'a':[{'id':'e1','report':'Addition [S1].'}]},
            'removed': {'deleted':{'token':'t'}}, 'imports': {'i': {'research_id':'a'}},
            'quick_topics': {'key':'a'}, 'unknown_future_field': {'preserve':True}}


def test_roundtrip_changed_page_and_unknown_fields(tmp_path):
    store=FolderResearchStore(tmp_path/'research'); data=sample();store.write(data)
    assert store.load()==data
    assert len(list((store.root/'conversations').glob('*/pages/*/publication.json')))==1
    updated=copy.deepcopy(data);updated['drafts']['a']['html']='<p>Typed</p>';store.write(updated)
    assert FolderResearchStore(store.root).load()==updated
    assert len(list((store.backups.root/'daily').glob('*.json')))==1
    assert not list(store.root.rglob('*.bak'))


def test_migration_idempotent_history_assets_rollback(tmp_path):
    legacy=tmp_path/'old'/'reports.json';data=sample();atomic(legacy,data)
    atomic(legacy.with_name('reports.history.json'),{'a':{'title':'My title'}})
    asset=legacy.parent/'attachments'/'a'/'original.pdf';asset.parent.mkdir(parents=True);asset.write_bytes(b'original')
    store=FolderResearchStore(tmp_path/'research');assert store.migrate(legacy)['status']=='migrated'
    assert store.load()=={**data,'history_metadata':{'a':{'title':'My title'}}}
    assert next((store.root/'conversations').glob('*/assets/*/original.pdf')).read_bytes()==b'original'
    assert store.migrate(legacy)['status']=='already_migrated'
    changed=store.load();changed['drafts']['a']['revision']='new';store.write(changed)
    destination=tmp_path/'rollback'/'reports.json';store.export_legacy(destination)
    assert read(destination,{})['drafts']['a']['revision']=='new'
    assert read(destination.with_name('reports.history.json'),{})=={'a':{'title':'My title'}}


def test_commit_intent_rolls_forward_before_read(tmp_path,monkeypatch):
    import astra_ai.core.research.storage as module
    store=FolderResearchStore(tmp_path/'research');store.write(sample()); changed=sample();changed['drafts']['a']['revision']='new'
    original=module.atomic
    def fail(path,data):
        if path==store.path:raise PermissionError('file locked')
        original(path,data)
    monkeypatch.setattr(module,'atomic',fail)
    with pytest.raises(PermissionError):store.write(changed)
    monkeypatch.setattr(module,'atomic',original)
    assert FolderResearchStore(store.root).load()==changed
    assert not list((store.root/'.transactions').iterdir())


def test_uncommitted_staging_is_not_published(tmp_path):
    store=FolderResearchStore(tmp_path/'research');store.write(sample())
    atomic(store.root/'.transactions'/'unfinished'/'files'/'catalog.json',{'wrong':True})
    assert FolderResearchStore(store.root).load()==sample()


def test_tampered_page_rejected(tmp_path):
    store=FolderResearchStore(tmp_path/'research');store.write(sample())
    file=next((store.root/'conversations').glob('*/pages/*/publication.json'));atomic(file,{'value':'tampered'})
    with pytest.raises(ValueError,match='outside the application'):FolderResearchStore(store.root).load()


def test_restore_and_retention(tmp_path,monkeypatch):
    import astra_ai.core.research.storage as module
    from datetime import datetime,timezone,timedelta
    backup=ResearchBackups(tmp_path/'backups');source=tmp_path/'value.json'
    start=datetime(2026,1,1,tzinfo=timezone.utc)
    for day in range(10):
        class Clock:
            @staticmethod
            def now(tz):return start+timedelta(days=day)
        monkeypatch.setattr(module,'datetime',Clock)
        atomic(source,{'day':day});backup.snapshot({'value.json':source})
    manifests=sorted((backup.root/'daily').glob('*.json'));assert len(manifests)==7
    assert len(list((backup.root/'objects').glob('*.gz')))==7
    backup.restore(manifests[-1],tmp_path/'restored')
    assert read(tmp_path/'restored'/'value.json',{})=={'day':9}
    with pytest.raises(ValueError):backup.restore(manifests[-1],tmp_path/'restored')


def test_real_artifact_interface_uses_folders(tmp_path):
    ctx={'profile_id':'owner','project_id':'p','session_id':'s'}
    store=ResearchArtifacts(tmp_path/'research');pending=store.reserve('Prism optics','detailed',ctx,'op')
    assert pending['status']=='ok'
    assert store.request_state(pending['id'],ctx)['phase']=='queued'
    assert not (tmp_path/'research'/'reports.json').exists()
    from astra_ai.core.research_history import update,listing
    assert update(store,pending['id'],ctx,title='Custom title')['status']=='completed'
    assert listing(store,ctx)['items'][0]['history_title']=='Custom title'


def test_empty_transaction_directory_does_not_invalidate_loaded_pages(tmp_path,monkeypatch):
    import astra_ai.core.research.storage as storage
    store=storage.FolderResearchStore(tmp_path/'research')
    store.write({'artifacts':{},'requests':{'page':{'id':'page','query':'Cached data'}}})
    store.load()
    reads=[];original=storage.read
    def tracked(path,default):
        reads.append(str(path));return original(path,default)
    monkeypatch.setattr(storage,'read',tracked)
    assert store.load()['requests']['page']['query']=='Cached data'
    assert not reads


def test_disk_failure_before_commit_preserves_authoritative_state(tmp_path,monkeypatch):
    import astra_ai.core.research.storage as storage
    store=storage.FolderResearchStore(tmp_path/'research')
    original={'artifacts':{},'requests':{'page':{'id':'page','query':'Original'}}}
    store.write(original)
    atomic=storage.atomic
    def full_disk(path,value):
        if str(path).endswith('intent.json'):raise OSError(28,'disk full')
        return atomic(path,value)
    monkeypatch.setattr(storage,'atomic',full_disk)
    with pytest.raises(OSError):store.write({'artifacts':{},'requests':{'page':{'id':'page','query':'Uncommitted'}}})
    monkeypatch.setattr(storage,'atomic',atomic)
    assert storage.FolderResearchStore(store.root).load()==original


def test_concurrent_reservations_preserve_both_records(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    from astra_ai.core.research_learning import ResearchArtifacts
    path=tmp_path/'research';left=ResearchArtifacts(path);right=ResearchArtifacts(path)
    def reserve(pair):
        store,operation=pair
        return store.reserve(operation,'detailed',{'profile_id':'owner'},operation)['id']
    with ThreadPoolExecutor(max_workers=2) as pool:identifiers=list(pool.map(reserve,[(left,'first'),(right,'second')]))
    assert set(identifiers)<=set(left.read()['requests'])
