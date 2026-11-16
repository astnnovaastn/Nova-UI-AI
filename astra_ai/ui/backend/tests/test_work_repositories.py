import json
from types import SimpleNamespace
import pytest
from astra_ai.core.work.repository_inputs import RepositoryInputs,RepositoryError
from astra_ai.ui.backend.api.work import _chosen

@pytest.fixture
def repo(tmp_path):
    root=tmp_path/'project';root.mkdir()
    (root/'main.py').write_text('def answer():\n    return 42\n',encoding='utf8')
    (root/'.env').write_text('fixture secret',encoding='utf8')
    (root/'credentials.json').write_text('{}')
    hidden=root/'.git';hidden.mkdir();(hidden/'config.txt').write_text('hidden')
    return RepositoryInputs(lambda name:json.dumps({'project':str(root)}) if name=='AEGIS_WORK_REPOSITORIES' else ''),root

def test_configured_inventory_is_readonly_and_omits_sensitive_paths(repo):
    service,root=repo
    assert service.list()['repositories']==[{'id':'project','title':'project'}]
    assert service.list()['execution_available'] is False
    assert service.files('project')['files']==['main.py']
    item=service.read('project','main.py',1,2)
    assert item['summary']=='1: def answer():\n2:     return 42'
    assert len(item['sha256'])==64
    assert item['total_lines']==2
    assert 'path' not in item

@pytest.mark.parametrize('path',['../outside.py','.env','credentials.json','.git/config.txt','C:/outside.py','main.py:alternate.py','..\\outside.py'])
def test_escaping_and_sensitive_paths_are_rejected(repo,path):
    with pytest.raises(RepositoryError):repo[0].read('project',path)

def test_unavailable_roots_and_long_excerpt_do_not_silently_succeed(repo):
    service,root=repo
    with pytest.raises(RepositoryError):service.read('missing','main.py')
    with pytest.raises(RepositoryError):service.read('project','main.py',1,500)
    (root/'long.py').write_text('x'*12000)
    with pytest.raises(RepositoryError,match='shorter'):service.read('project','long.py')
    assert RepositoryInputs(lambda _: '').list()['repositories']==[]

def test_source_revision_and_selected_code_context_are_preserved(repo):
    service,root=repo
    before=service.read('project','main.py')
    (root/'main.py').write_text('print(43)')
    assert service.read('project','main.py')['sha256']!=before['sha256']
    assert _chosen([{'id':'file','kind':'code','summary':'x'*10000}])[0]['summary']=='x'*10000

def test_repository_routes_are_owner_only_and_never_edit(repo):
    from fastapi import FastAPI,HTTPException
    from fastapi.testclient import TestClient
    from astra_ai.ui.backend.api.work_repositories import install
    app=FastAPI()
    def owner(request):
        if request.headers.get('x-owner')!='yes':raise HTTPException(403,'Owner only')
    install(app,owner_only=owner,orchestrator=lambda:SimpleNamespace(settings=repo[0].settings))
    client=TestClient(app)
    assert client.get('/api/work/repositories').status_code==403
    assert client.get('/api/work/repositories/project/source?path=main.py',headers={'x-owner':'yes'}).json()['kind']=='code'
    assert client.put('/api/work/repositories/project/source?path=main.py',headers={'x-owner':'yes'}).status_code==405

