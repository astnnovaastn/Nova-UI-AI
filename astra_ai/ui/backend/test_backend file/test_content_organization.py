from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.organization_review import OrganizationReview
from astra_ai.memory.globe_topics import topics

def fixture(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'memory.json',transcript_path=tmp_path/'chat.json');m.ensure_ready()
    return m

def category(m,label,content,profile=''):
    record=m.save_fact('notes',label.lower().replace(' ','_'),content,profile_id=profile)['id']
    row=m.category_action('create',label=label,policy_template='meta_memory',source_refs=[{'record_id':record}],profile_id=profile)
    return row['id'],record

def test_frequent_words_never_create_collections():
    records={str(i):{'id':str(i),'kind':'activity','content':'Creation created creative acts acting repeated artificial intelligence'} for i in range(60)}
    assert topics(records,{},None)==[]

def test_content_review_merges_compatible_categories_without_rewriting_records(tmp_path):
    m=fixture(tmp_path);a,one=category(m,'Animation design','Create animation frames for the UI')
    b,two=category(m,'Motion design','Design moving UI transitions and animation frames')
    original=m.load()['records']
    def review(payload):
        assert payload['categories'][0]['sources'][0]['content']=='Create animation frames for the UI'
        return {'compatible':True,'reason':'Same UI animation work','evidence_ids':[one,two]}
    r=OrganizationReview(m,review);r.enqueue([{'category_id':a,'merge_id':b}]);assert r.process_one()['state']=='applied'
    assert m.load()['records']==original
    assert m.load()['category_registry'][a]['merged_into']==b
    assert r.process_one() is None
    assert m.category_action('restore',category_id=a)['status']=='restored'
    assert 'merged_into' not in m.load()['category_registry'][a]

def test_similar_words_different_content_remain_separate(tmp_path):
    m=fixture(tmp_path);a,one=category(m,'Acts','The legal acts passed by parliament')
    b,two=category(m,'Acting','Theatre performances and stage acting')
    r=OrganizationReview(m,lambda payload:{'compatible':False,'reason':'Different meanings','evidence_ids':[one,two]})
    r.enqueue([{'category_id':a,'merge_id':b}]);assert r.process_one()['state']=='unresolved'
    assert m.load()['category_registry'][a]['state']=='active'

def test_review_rejects_changed_evidence_and_cross_scope(tmp_path):
    m=fixture(tmp_path);a,one=category(m,'Topic A','Topic A content')
    b,two=category(m,'Topic B','Topic B content')
    called=[];r=OrganizationReview(m,lambda payload:called.append(payload))
    r.enqueue([{'category_id':a,'merge_id':b}])
    m.memory_action('update',record_id=one,value='Entirely different content')
    assert r.process_one()['state']=='unresolved' and not called
    c,_=category(m,'Owner private group','Owner-only details','other')
    r.enqueue([{'category_id':a,'merge_id':c}]);assert r.process_one() is None
