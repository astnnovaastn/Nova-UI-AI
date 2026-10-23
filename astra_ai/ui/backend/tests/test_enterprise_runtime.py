import sqlite3
from pathlib import Path
from types import SimpleNamespace
from fastapi import FastAPI
from fastapi.testclient import TestClient
from astra_ai.memory.shared_memory import atomic,read
from astra_ai.ui.backend.runtime_paths import RuntimePaths
from astra_ai.core.research_learning import ResearchArtifacts
from astra_ai.ui.backend.research_api import register_research_api
from astra_ai.core.action_jobs import ActionJobs


def test_runtime_migration_preserves_budgets_sqlite_widgets_images_and_is_idempotent(tmp_path):
    from astra_ai.core.research.storage import managed_path
    installation=managed_path(tmp_path/'application');backend=installation/'astra_ai/ui/backend';memory=installation/'astra_ai/memory'
    atomic(memory/'research_gemini_budget.json',{'requests':59,'tokens':590000})
    atomic(backend/'theme_widget_data/settings.json',{'theme':'custom'})
    image=backend/'ai_generated_images/original.png';image.parent.mkdir(parents=True);image.write_bytes(b'original')
    memory.mkdir(exist_ok=True,parents=True)
    with sqlite3.connect(memory/'workspace-sync.sqlite3') as db:db.execute('CREATE TABLE contexts(id TEXT)');db.execute("INSERT INTO contexts VALUES('owner')")
    paths=RuntimePaths(installation,installation/'state');first=paths.initialize()
    assert read(paths.usage/'research_gemini_budget.json',{})['requests']==59
    assert read(paths.widget('theme')/'settings.json',{})=={'theme':'custom'}
    assert (paths.generated/'original.png').read_bytes()==b'original'
    with sqlite3.connect(paths.system/'workspace-sync.sqlite3') as db:assert db.execute('SELECT * FROM contexts').fetchall()==[('owner',)]
    assert paths.initialize()==first
    assert len(list((paths.root/'backups/research/migration').glob('*.json')))==1
    assert not list((paths.root/'.migration').glob('*.sqlite3'))
    atomic(paths.usage/'research_gemini_budget.json',{'requests':60,'tokens':595000})
    rollback=paths.export_legacy(tmp_path/'rollback')
    assert read(rollback/'astra_ai/memory/research_gemini_budget.json',{})['requests']==60
    assert (rollback/'astra_ai/ui/backend/ai_generated_images/original.png').read_bytes()==b'original'


def test_storage_diagnostics_and_consent_are_scoped_host_only(tmp_path):
    context={'profile_id':'owner','project_id':'p','session_id':'s'}
    artifacts=ResearchArtifacts(tmp_path/'research');row=artifacts.reserve('Prism optics','detailed',context,'op')
    app=FastAPI();jobs=ActionJobs(tmp_path/'jobs.json',None,None,None,[])
    register_research_api(app,lambda:None,lambda:None,lambda:(artifacts,None),lambda r:context,jobs,RuntimePaths(tmp_path,tmp_path/'state'))
    client=TestClient(app)
    assert client.get('/api/settings/research-storage').json()['layout']=='folders'
    endpoint='/api/research/'+row['id']+'/fallback-consent'
    assert client.post(endpoint,json={'allow':True}).status_code==200
    assert artifacts.request_state(row['id'],context)['groq_private_allowed'] is True
    assert client.post(endpoint,json={'allow':False}).status_code==200
    assert artifacts.request_state(row['id'],context)['groq_private_allowed'] is False
    assert client.post(endpoint,json={'allow':'true'}).status_code==422
    assert client.post(endpoint,json={'allow':True},headers={'x-nova-paired-device':'remote'}).status_code==403
    assert client.post('/api/research/missing/fallback-consent',json={'allow':True}).status_code==404


def test_typed_playback_does_not_require_microphone_or_steal_other_window(tmp_path):
    from astra_ai.ui.backend.workspace_api import WorkspaceService
    from astra_ai.ui.backend.workspace_sync import WorkspaceHub
    hub=WorkspaceHub(tmp_path/'hub.db');ctx={'profile_id':'owner'}
    hub.register('a',{'window_id':'window-a-123'},ctx);hub.register('b',{'window_id':'window-b-123'},ctx)
    service=WorkspaceService.__new__(WorkspaceService);service.store=lambda:hub
    session=SimpleNamespace()
    assert service.bind_playback('a',session) is None
    lease=hub.acquire_voice('a')['owner']
    assert service.bind_playback('a',session)==lease['generation']
    other=SimpleNamespace();assert service.bind_playback('b',other) is None
    hub.release_voice('a');hub.acquire_voice('b')
    assert service.bind_playback('a',session) is None
    assert service.bind_playback('b',other)>lease['generation']


def test_retry_resumes_same_saved_job_without_resetting_checkpoints(tmp_path):
    from astra_ai.ui.backend.api.research import install
    ctx={'profile_id':'owner','project_id':'p'}
    store=ResearchArtifacts(tmp_path/'research');entry=store.reserve('Heat pump evidence','detailed',ctx,'original')
    store.request_state(entry['id'],ctx,phase='failed',job_id='job',synthesis_checkpoint={'batch_attempts':2,'candidate':{'title':'Saved'}})
    jobs=ActionJobs(tmp_path/'jobs.json',None,None,None,[])
    jobs.write({'jobs':{'job':{'context':ctx,'state':'failed','actions':[{'name':'search_web','state':'failed','arguments':{'research_id':entry['id']}}]}}})
    app=FastAPI()
    install(app,context_for=lambda r:ctx,artifacts_for=lambda:(store,None),writer=lambda:None,learning=lambda:None,jobs=jobs,collaboration=None,state=None,manager=None,ui_context=None,workspace=None,confirm_destructive=None,continue_research=None,start_research_page=None)
    client=TestClient(app);url='/api/research/'+entry['id']+'/retry'
    assert client.post(url).json()['status']=='accepted'
    assert jobs.load()['jobs']['job']['state']=='queued'
    assert store.request_state(entry['id'],ctx)['synthesis_checkpoint']['batch_attempts']==2
    assert client.post(url).json()['status']=='unchanged'
    assert len(jobs.load()['jobs'])==1


def test_liveness_does_not_wait_for_slow_memory_statistics():
    import ast,asyncio,time
    from types import SimpleNamespace
    source=Path(__file__).parents[1]/'server.py';tree=ast.parse(source.read_text(encoding='utf-8'))
    handler=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='health_check');handler.decorator_list=[]
    gate=asyncio.Event()
    class ImportVersion:
        @staticmethod
        def version(name):return 'test'
    def slow_stats():time.sleep(.3);return {'facts':1}
    state=SimpleNamespace(live_memory=SimpleNamespace(stats=slow_stats),live_sessions={},gemini_api_key='',aegis_ai=None,context_preprocessor=SimpleNamespace(health=lambda:{}))
    namespace={'state':state,'asyncio':asyncio,'time':time,'sys':SimpleNamespace(version='3.12 test'),'importlib':SimpleNamespace(metadata=ImportVersion),'MODEL_STATUS':{'voice':{}},'LIVE_MODEL':'live','research_model':None,'ws_manager':SimpleNamespace(connections={})}
    from datetime import datetime
    namespace['datetime']=datetime;exec(compile(ast.Module(body=[handler],type_ignores=[]),str(source),'exec'),namespace)
    async def run():
        start=time.monotonic();result=await namespace['health_check']()
        assert result['status']=='healthy' and time.monotonic()-start<.1
        await state.health_memory_task
        assert (await namespace['health_check']())['memory']=={'facts':1}
    asyncio.run(run())
