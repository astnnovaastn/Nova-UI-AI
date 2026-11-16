import json
from pathlib import Path
import pytest
from astra_ai.ui.backend.v21_workspace import NotesLibrary, TaskPresentation
from astra_ai.ui.backend.task_backend.store import TaskStore


def create(lib, text='# Note\n\nOriginal', key='first'):
    return lib.call({'kind':'create','request_id':key,'markdown':text})['summary']

def test_notes_retry_conflict_trash_and_metadata(tmp_path):
    lib=NotesLibrary(tmp_path)
    summary=create(lib)
    assert create(lib)['id']==summary['id']
    assert len(lib.read()['notes'])==1
    data=lib.read();data['custom']={'keep':True};data['summaries']=[{'id':'old','content':'Old summary'}];lib.save(data)
    response=lib.call({'kind':'write','id':summary['id'],'request_id':'second','base_revision':summary['revision'],'markdown':'# Updated'})
    assert response['kind']=='applied'
    assert lib.call({'kind':'write','id':summary['id'],'request_id':'third','base_revision':summary['revision'],'markdown':'lost edit'})['kind']=='conflict'
    lib.call({'kind':'trash','id':summary['id']})
    assert lib.call({'kind':'list','query':{}})['items']==[]
    assert len(lib.call({'kind':'list','query':{'trashed':True}})['items'])==1
    lib.call({'kind':'restore','id':summary['id']})
    assert lib.read()['custom']=={'keep':True}
    assert lib.read()['summaries'][0]['content']=='Old summary'

def test_legacy_notes_save_preserves_adapter_metadata(tmp_path):
    from astra_ai.ui.backend.notes_state import add_note
    lib=NotesLibrary(tmp_path);create(lib)
    data=lib.read();add_note(tmp_path,data['notes'],[], 'legacy')
    assert lib.read()['v21_requests']==data['v21_requests']

def test_corrupt_notes_are_not_overwritten(tmp_path):
    lib=NotesLibrary(tmp_path);lib.path.write_text('broken',encoding='utf-8')
    with pytest.raises(ValueError):create(lib)
    assert lib.path.read_text()=='broken'

def test_markdown_sync_preserves_conflicts(tmp_path):
    lib=NotesLibrary(tmp_path/'db');s=create(lib);folder=tmp_path/'files';folder.mkdir()
    assert lib.sync(folder)['changed']==1
    path=folder/(s['id']+'.md');path.write_text('# External',encoding='utf-8')
    assert lib.sync(folder)['changed']==1
    assert lib.read()['notes'][0]['content']=='# External'
    s=lib.summary(lib.read()['notes'][0])
    lib.call({'kind':'write','id':s['id'],'request_id':'edit','base_revision':s['revision'],'markdown':'# Local'})
    path.write_text('# Second external',encoding='utf-8')
    assert lib.sync(folder)['conflicts']==[s['id']]
    assert path.read_text()=='# Second external'
    assert lib.read()['notes'][0]['content']=='# Local'

def test_task_board_preserves_execution_and_owner(tmp_path):
    store=TaskStore(tmp_path);tasks=TaskPresentation(store)
    task=tasks.create('owner',{'title':'A task'},'idempotent')
    assert tasks.create('owner',{'title':'A task'},'idempotent')['id']==task['id']
    before=store.get_task('owner',task['id'])
    updated=tasks.change('owner',task['id'],{'status':'done','title':'Updated'},task['revision'])
    after=store.get_task('owner',task['id'])
    assert updated['status']=='done'
    assert before['lifecycle']==after['lifecycle']=='draft'
    assert before['trigger']==after['trigger']
    assert tasks.rows('other')==[]
    with pytest.raises(ValueError):tasks.change('owner',task['id'],{'title':'stale'},task['revision'])
    deleted=tasks.change('owner',task['id'],{'deleted':True},updated['revision'])
    assert tasks.rows('owner')==[]
    assert tasks.rows('owner',True)[0]['id']==task['id']
    tasks.change('owner',task['id'],{'deleted':False},deleted['revision'])
    assert tasks.rows('owner')[0]['id']==task['id']

def test_isolation_unavailable_never_executes_host_command(tmp_path,monkeypatch):
    from astra_ai.core.work.isolated_workspace import IsolatedWorkspace
    root=tmp_path/'repo';root.mkdir();(root/'app.py').write_text('print(1)')
    service=IsolatedWorkspace(tmp_path/'state',lambda key:json.dumps({'demo':str(root)}) if key=='AEGIS_WORK_REPOSITORIES' else '')
    proposal=service.propose('owner',{'repository':'demo','files':['app.py'],'argv':['python','app.py']})
    monkeypatch.setattr(service,'availability',lambda:{'available':False,'reason':'No container runtime'})
    monkeypatch.setattr('subprocess.Popen',lambda *a,**k:pytest.fail('Host command attempted'))
    assert service.execute('owner',proposal['id'],proposal['approval'])['blocked']=='No container runtime'
    assert service.get('owner',proposal['id'])['status']=='awaiting_approval'
    with pytest.raises(ValueError):service.propose('owner',{'repository':'demo','files':['../app.py'],'argv':['python','app.py']})
    with pytest.raises(FileNotFoundError):service.get('other',proposal['id'])
    assert service.cancel('owner',proposal['id'])['status']=='cancelled'

def test_reviewed_edit_is_revision_checked(tmp_path):
    from astra_ai.core.work.isolated_workspace import IsolatedWorkspace
    root=tmp_path/'repo';root.mkdir();source=root/'app.py';source.write_text('print(1)')
    service=IsolatedWorkspace(tmp_path/'state',lambda key:json.dumps({'demo':str(root)}) if key=='AEGIS_WORK_REPOSITORIES' else '')
    proposal=service.propose('owner',{'repository':'demo','files':['app.py'],'argv':['python','app.py'],'edits':{'app.py':'print(2)'}})
    # Simulate a recorded container result solely to exercise the apply transaction.
    proposal['status']='completed';service.save('owner',proposal)
    source.write_text('concurrent edit')
    with pytest.raises(ValueError):service.apply('owner',proposal['id'],proposal['approval'])
    assert source.read_text()=='concurrent edit'
    source.write_text('print(1)')
    assert service.apply('owner',proposal['id'],proposal['approval'])['status']=='applied'
    assert source.read_text()=='print(2)'


def test_public_result_roundtrip_and_cross_run_identity(tmp_path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from types import SimpleNamespace
    import threading
    from astra_ai.ui.backend.api.workspace_v21 import install
    app=FastAPI()
    state=SimpleNamespace(notes_state_dir=tmp_path/'notes',notes_state_lock=threading.RLock())
    notes,tasks=install(app,state=state,task_store=TaskStore(tmp_path/'tasks'),owner_only=lambda _:None,task_owner=lambda _:'owner')
    client=TestClient(app)
    obj={'id':'result','revision':1,'kind':'comparison','title':'Compare','columns':['Option','Value'],'rows':[['One','23']],'sources':[{'id':'s1','title':'Evidence','url':'https://example.com'}]}
    payload={'action':'note','object':obj}
    a=client.post('/api/workspace/v21/from-result',json=payload).json()
    assert client.post('/api/workspace/v21/from-result',json=payload).json()['summary']['id']==a['summary']['id']
    obj['rows']=[['Two','42']]
    b=client.post('/api/workspace/v21/from-result',json=payload).json()
    assert b['summary']['id']!=a['summary']['id']
    saved=notes.read()['notes']
    assert len(saved)==2 and '23' in saved[0]['content'] and '42' in saved[1]['content']
    assert saved[0]['work_provenance']['sources'][0]['id']=='s1'
    result=client.post('/api/workspace/v21/from-result',json={'action':'task','object':obj})
    assert result.status_code==200
    assert '42' in tasks.rows('owner')[0]['description']
    plan={'id':'plan','kind':'calendar','title':'Review week','entries':[{'label':'Inspect','date':'2026-11-17'},{'label':'Publish','date':'2026-11-18'}]}
    payload={'action':'task','object':plan}
    result=client.post('/api/workspace/v21/from-result',json=payload).json()
    assert len(result['items'])==2
    assert result['items'][0]['dueDate']=='2026-11-17'
    assert client.post('/api/workspace/v21/from-result',json=payload).json()==result
    assert len(tasks.rows('owner'))==3



def test_task_scheduling_and_subtasks_are_validated(tmp_path):
    tasks=TaskPresentation(TaskStore(tmp_path))
    row=tasks.create('owner',{'title':'Review','dueDate':'2026-12-01','dueTime':'10:30','duration':30,'context':{'url':'https://example.com'}},'one')
    row=tasks.change('owner',row['id'],{'steps':[{'id':'a','title':'Inspect','completed':True}]},row['revision'])
    assert row['stepDone']==1 and row['dueTime']=='10:30'
    for patch in [{'dueDate':'not a date'},{'priority':'urgent'},{'duration':-1},{'context':{'url':'javascript:alert(1)'}}]:
        with pytest.raises(ValueError):tasks.change('owner',row['id'],patch,row['revision'])
    assert tasks.rows('owner')[0]['revision']==row['revision']


def test_interrupted_execution_is_never_restored_as_success(tmp_path):
    from astra_ai.core.work.isolated_workspace import IsolatedWorkspace
    service=IsolatedWorkspace(tmp_path,lambda _: '')
    record={'id':'a'*32,'status':'running','worker':'old-process'}
    service.save('owner',record)
    restored=service.get('owner',record['id'])
    assert restored['status']=='interrupted'
    assert restored['cleanup_required']=='aegis-work-'+record['id']
