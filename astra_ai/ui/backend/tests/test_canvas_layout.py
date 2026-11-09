import math
import pytest
from astra_ai.core.research.artifacts import ResearchArtifacts
from astra_ai.core.work.canvas_layout import CanvasLayouts, LayoutError

CTX={'profile_id':'p','project_id':'','guest':False}
def setup(tmp_path):
    artifacts=ResearchArtifacts(tmp_path/'research')
    id=artifacts.reserve('Saved layout test','quick',CTX,'layout-fixture')['id']
    return artifacts,CanvasLayouts(artifacts),id
def payload(revision=0,operation='operation_001',x=50):
    return {'expected_revision':revision,'operation_id':operation,'layout':{'positions':{'a':{'x':x,'y':20}},'sizes':{'a':{'width':300,'height':180}},'groups':[],'constraints':{},'strategy':'editorial','automatic':False}}

def test_commit_reload_duplicate_conflict_and_undo(tmp_path):
    a,s,id=setup(tmp_path)
    first=payload();first['before']={**first['layout'],'positions':{'a':{'x':0,'y':0}}}
    assert s.put(id,CTX,first)['revision']==1
    assert s.put(id,CTX,first)['revision']==1
    assert CanvasLayouts(ResearchArtifacts(tmp_path/'research')).get(id,CTX)['positions']['a']['x']==50
    with pytest.raises(LayoutError,match='another window'):s.put(id,CTX,payload(0,'operation_002'))
    second=payload(1,'operation_003',500)
    assert s.put(id,CTX,second)['revision']==2
    second.update(expected_revision=2,operation_id='operation_004',undo=True)
    assert s.put(id,CTX,second)['positions']['a']['x']==50
    assert 'report' not in a.request_state(id,CTX)

@pytest.mark.parametrize('bad',[float('nan'),float('inf'),True,-1000001])
def test_reject_invalid_geometry(tmp_path,bad):
    _,s,id=setup(tmp_path)
    with pytest.raises(LayoutError):s.put(id,CTX,payload(x=bad))
def test_scope_removed_and_guest(tmp_path):
    a,s,id=setup(tmp_path)
    with pytest.raises(LayoutError):s.get(id,{**CTX,'profile_id':'other'})
    with pytest.raises(LayoutError):s.put(id,{**CTX,'guest':True},payload())
    data=a.read({});data.setdefault('removed',{})[id]={'token':'deleted'};a.write(data)
    with pytest.raises(LayoutError):s.put(id,CTX,payload())
def test_same_operation_cannot_change_payload(tmp_path):
    _,s,id=setup(tmp_path);s.put(id,CTX,payload())
    with pytest.raises(LayoutError):s.put(id,CTX,payload(x=90))

def test_routes_never_instantiate_research_or_provider(tmp_path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from astra_ai.ui.backend.api.work import install
    a,s,id=setup(tmp_path)
    def forbidden():raise AssertionError('Layout must never instantiate a research provider')
    events=[]
    async def emit(*args):events.append(args)
    app=FastAPI()
    install(app,context_for=lambda request:CTX,artifacts_for=lambda:(a,None),
        jobs=None,orchestrator=forbidden,owner_only=lambda request:None,emit=emit)
    with TestClient(app) as client:
        url=f'/api/work/runs/{id}/layout'
        assert client.get(url).json()['layout']['revision']==0
        assert client.put(url,json=payload()).status_code==200
        assert events[0][1]=='canvas_layout'
        assert client.put(url,content='{broken').status_code==422
        assert client.put(url,json={**payload(),'undo':'yes'}).status_code==422
        assert client.put(url,json={**payload(),'layout':{'strategy':[]}}).status_code==422

def test_two_writers_only_one_revision_wins(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    a,s,id=setup(tmp_path)
    def write(op):
        try:return s.put(id,CTX,payload(operation=op))['revision']
        except LayoutError as error:return error.status
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(write,['concurrent_01','concurrent_02']))
    assert sorted(results)==[1,409]
    assert s.get(id,CTX)['revision']==1

def test_removal_blocks_offline_write_and_restoration_keeps_layout(tmp_path):
    a,s,id=setup(tmp_path)
    s.put(id,CTX,payload())
    data=a.read({});data.setdefault('removed',{})[id]={'token':'deleted'};a.write(data)
    with pytest.raises(LayoutError):s.put(id,CTX,payload(1,'offline_operation'))
    data=a.read({});data['removed'].pop(id);a.write(data)
    assert s.get(id,CTX)['positions']['a']['x']==50
    assert s.get(id,CTX)['revision']==1
