import pytest
from astra_ai.ui.backend.task_backend.store import TaskStore
from astra_ai.ui.backend.v21_workspace import TaskPresentation
from astra_ai.ui.backend.v22_task_resources import TaskResources

@pytest.fixture
def api(tmp_path):return TaskResources(TaskPresentation(TaskStore(tmp_path)))

def create(api,key='one',owner='owner'):
    return api.call(owner,{'kind':'mutate','command':{'version':1,'request_id':key,'intent':{'kind':'create','draft':{'title':'Review evidence','pinned':False,'related':[],'content':{'kind':'task','description':'Keep citations','status':'open','details':{'inbox':True,'priority':'medium','steps':[]}}}}}})

def mutate(api,key,intent,owner='owner'):
    return api.call(owner,{'kind':'mutate','command':{'version':1,'request_id':key,'intent':intent}})

def test_resource_roundtrip_owner_retry_and_receipt(api):
    first=create(api);assert first['kind']=='applied',first
    assert create(api)==first
    assert 1_600_000_000 < float(first['record']['created_at']) < 3_000_000_000
    id=first['record']['id']
    assert api.call('other',{'kind':'get','id':id})['error']=='not_found'
    page=api.call('owner',{'kind':'list_tasks','query':{'view':'inbox','today':'2026-11-16'}})
    assert page['items'][0]['id']==id and page['metadata'][0]['inbox']
    change={'kind':'update_task','id':id,'set':[{'field':'description','value':'Reviewed'}],'expect':[{'field':'description','value':'Keep citations'}]}
    reply=mutate(api,'two',change);assert reply['record']['draft']['content']['description']=='Reviewed'
    assert mutate(api,'two',change)==reply
    assert mutate(api,'three',change)['error']=='conflict'
    change['set'][0]['value']='Other'
    assert mutate(api,'two',change)['error']=='invalid'
    assert api.store.get_task('owner',id)['lifecycle']=='draft'

def test_original_task_fields_undo_trash_lists(api):
    id=create(api)['record']['id']
    list_reply=mutate(api,'list',{'kind':'create_task_list','title':'Project'})
    assert list_reply['kind']=='task_list_applied'
    li=list_reply['list']
    fields=[{'field':'schedule','date':'2026-11-16','time':'11:00'},{'field':'organization','list':li['id'],'inbox':False},{'field':'steps','value':[{'id':'s','title':'Check source','completed':True}]},{'field':'duration','minutes':30},{'field':'deadline','date':'2026-11-17'},{'field':'status','value':'done'}]
    r=mutate(api,'fields',{'kind':'update_task','id':id,'set':fields})
    assert r['kind']=='applied',r
    content=r['record']['draft']['content'];assert content['details']['steps'][0]['completed']
    assert content['details']['deadline']=='2026-11-17'
    restored=mutate(api,'undo',{'kind':'update_task','id':id,'set':[{'field':'status','value':'open'}]})
    assert restored['record']['draft']['content']['details']['completed_at'] is None
    trash=mutate(api,'trash',{'kind':'trash','id':id,'expected_revision':restored['record']['revision']})
    assert trash['record']['trashed']
    restored=mutate(api,'restore',{'kind':'restore','id':id,'expected_revision':trash['record']['revision']})
    assert not restored['record']['trashed']
    mutate(api,'delete-list',{'kind':'delete_task_list','id':li['id'],'expected_revision':li['revision']})
    final=api.call('owner',{'kind':'get','id':id})['record']['draft']['content']
    assert final['details']['list'] is None and final['details']['inbox']

def test_invalid_update_rolls_back(api):
    first=create(api);id=first['record']['id']
    r=mutate(api,'invalid',{'kind':'update_task','id':id,'set':[{'field':'schedule','date':'not-a-date','time':None}]})
    assert r['error']=='invalid'
    assert api.call('owner',{'kind':'get','id':id})['record']==first['record']


def test_render_metadata_roundtrip_and_validation():
    from astra_ai.core.work.workspace_objects import validate
    value=dict(id='chart',title='Recorded values',kind='chart',revision=1,orientation='vertical',chartKind='bars',columnKinds=['entity','yes_no'])
    assert validate(value)==value
    with pytest.raises(ValueError):validate({**value,'orientation':'script'})


def test_legacy_note_title_updates_only_on_heading_change(tmp_path):
    from astra_ai.ui.backend.v21_workspace import NotesLibrary
    lib=NotesLibrary(tmp_path)
    first=lib.call({'kind':'create','request_id':'create','markdown':'# Before\n\nBody'})['summary']
    data=lib.read();data['notes'][0]['title']='Legacy title';lib.save(data)
    changed=lib.call({'kind':'write','id':first['id'],'request_id':'edit','base_revision':first['revision'],'markdown':'# After\n\nBody'})
    assert changed['summary']['title']=='After'


def test_personal_work_context_is_bounded_and_explicit():
    from astra_ai.ui.backend.api.work import _chosen
    result=_chosen([{'id':'note','kind':'note','summary':'x'*15000},{'id':'task','kind':'task','summary':'y'*2000}])
    assert result[0]['summary'].startswith('x'*12000)
    assert 'truncated' in result[0]['summary']
    assert result[1]['summary']=='y'*2000
