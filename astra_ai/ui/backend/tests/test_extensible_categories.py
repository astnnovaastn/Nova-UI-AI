import pytest
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.category_registry import execute,prepare,policy
@pytest.fixture
def memory(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'transcript.json');m.ensure_ready();return m

def test_registry_is_unlimited_and_preserves_records(memory):
    saved=memory.save_fact('user_identity','fixture','Fixture user');before=memory.load()['records'].copy();prepare(memory)
    for i in range(140):
        result=execute(memory,'create',label='Fixture category '+str(i),evidence='User requested organization')
        assert result['status']=='created'
    assert execute(memory,'list',limit=100)['total']==167
    root=execute(memory,'create',label='New root',policy_template='personal_preferences',evidence='Organize fixture')['id']
    child=execute(memory,'create',label='Nested fixture',parent_id=root,evidence='Organize fixture')['id']
    assert memory.save_fact(child,'fixture','A fixture preference')['status']=='saved'
    assert memory.recall_memory('fixture',category=root,descendants=True)['matches']
    assert before[saved['id']]==memory.load()['records'][saved['id']]

def test_aliases_cycles_policy_and_scopes(memory):
    root=execute(memory,'create',label='Fixture root',evidence='Organize fixture')['id']
    child=execute(memory,'create',label='Child',parent_id=root,evidence='Organize fixture')['id']
    assert execute(memory,'update',category_id=root,parent_id=child)['reason']=='category_cycle'
    assert execute(memory,'update',category_id=child,policy_template='data_privacy')['reason']=='policy_cannot_be_relaxed'
    assert execute(memory,'update',category_id=child,expected_revision=999,label='Changed')['status']=='conflict'
    assert execute(memory,'update',category_id=child,label='Renamed',aliases=['Child alias'])['status']=='updated'
    assert execute(memory,'resolve',label='Child alias')['category']['id']==child
    guest=execute(memory,'create',label='Guest category',evidence='Organize fixture',profile_id='guest')['id']
    assert execute(memory,'resolve',category_id=guest)['status']=='not_found'
    assert memory.save_fact(guest,'secret_fixture','Guest fixture')['status']=='rejected'
    assert execute(memory,'retire',category_id=child)['status']=='retired'
    assert memory.save_fact(child,'fixture','Fixture')['status']=='rejected'
    assert execute(memory,'restore',category_id=child)['status']=='restored'

def test_merge_keeps_record_ids_and_is_idempotent(memory):
    a=execute(memory,'create',label='First',evidence='Organization')['id'];b=execute(memory,'create',label='Second',evidence='Organization')['id']
    rid=memory.save_fact(a,'fixture','Fixture detail')['id']
    assert execute(memory,'merge',category_id=a,merge_id=b,operation_id='merge')['status']=='merged'
    assert execute(memory,'merge',category_id=a,merge_id=b,operation_id='merge')['status']=='duplicate'
    assert memory.recall_memory('fixture',category=b)['matches'][0]['id']==rid
    assert memory.load()['records'][rid]['category']==a
    catalog={r['id']:r for r in memory.category_catalog()['categories']};assert catalog[b]['counts']['active']==1;assert catalog[a]['counts']['active']==0
    from astra_ai.memory.globe_projection import projection
    assert rid in projection(memory)['raw']['category_definitions'][b]['member_ids']
    assert memory.memory_action('forget',record_id=rid)['status']=='forgotten'
    assert memory.memory_action('restore',record_id=rid)['status']=='restored'
