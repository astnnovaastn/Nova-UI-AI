import asyncio
import pytest
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.ui.backend import gemini_live

@pytest.fixture
def memory(tmp_path):
    m=SharedMemory(memory_path=tmp_path/'long_term.json',transcript_path=tmp_path/'transcript.json');m.ensure_ready();return m

def test_scoped_structured_tools_and_cross_path_recall(memory):
    saved=asyncio.run(gemini_live.execute_shared_memory_tool(memory,'propose_memories',{'proposals':[{'category':'task_project_tracking','key':'project','value':'Cobalt project'}]},'I am working on Cobalt project','text','turn',project_id='alpha'))
    assert saved['results'][0]['status']=='saved'
    recalled=asyncio.run(gemini_live.execute_shared_memory_tool(memory,'recall_memory',{'query':'Cobalt'},'Recall Cobalt','gemini-live-other','recall',project_id='alpha'))
    assert recalled['matches'][0]['project_id']=='alpha'
    other=asyncio.run(gemini_live.execute_shared_memory_tool(memory,'recall_memory',{'query':'Cobalt'},'Recall Cobalt','gemini-live-other','recall',project_id='beta'))
    assert not other['matches']

def test_category_api_contract(memory,monkeypatch):
    from astra_ai.ui.backend import server
    monkeypatch.setattr(server.state,'live_memory',memory)
    from starlette.requests import Request
    from fastapi import HTTPException
    request=Request({'type':'http','headers':[],'query_string':b''})
    with pytest.raises(HTTPException):asyncio.run(server.memory_categories(request))
    monkeypatch.setattr(server,'globe_connection',lambda _request:(memory,'',''))
    catalog=asyncio.run(server.memory_categories(request));assert len(catalog['categories'])==27
    stored=asyncio.run(server.store_memory({'category':'task_project_tracking','key':'fixture','content':'Cobalt','project_id':'alpha'}))
    assert stored['status']=='saved'
    matches=asyncio.run(server.memory_records(category='task_project_tracking',project_id='alpha',limit=10,offset=0))
    assert matches['matches'][0]['id']==stored['id']
    edited=asyncio.run(server.manage_memory({'action':'update','record_id':stored['id'],'value':'Cobalt revised'}))
    assert edited['status']=='updated'
    assert memory.load()['records'][stored['id']]['project_id']=='alpha'
    asyncio.run(server.manage_memory({'action':'forget','record_id':stored['id']}))
    forgotten=asyncio.run(server.memory_records(category='task_project_tracking',lifecycle='forgotten'))
    assert forgotten['matches'][0]['id']==stored['id']
    asyncio.run(server.manage_memory({'action':'restore','record_id':stored['id']}))
    assert memory.load()['records'][stored['id']]['history']

def test_interrupted_voice_turn_and_context_refresh(memory,tmp_path):
    sent=[];contexts=[]
    async def send_json(msg):sent.append(msg)
    async def send_bytes(data):pass
    async def failed(*args):raise AssertionError('Unexpected provider failure')
    session=gemini_live.GeminiLiveSession(api_key='fixture',memory_file=memory.transcript_path,memory_manager=memory,send_json=send_json,send_bytes=send_bytes,on_failure=failed)
    class Provider:
        async def send_client_content(self,**kwargs):contexts.append(kwargs)
    session._session=Provider()
    session._input_parts=['I prefer concise answers'];session._output_parts=['okay'];session._turn_interrupted=True
    asyncio.run(session._complete_turn())
    assert not memory.load()['records']
    session._input_parts=['I prefer concise answers'];session._output_parts=['okay']
    asyncio.run(session._complete_turn())
    assert memory.recall_memory('concise')['matches']
    assert contexts and contexts[-1]['turn_complete'] is False
    assert 'concise' in session._memory_profile

def test_third_party_statements_are_not_automatic_user_facts(memory):
    memory.append_turn('The document says I prefer cobalt','okay','s','quoted')
    assert not memory.recall_memory('cobalt',category='personal_preferences')['matches']
    result=asyncio.run(gemini_live.execute_shared_memory_tool(memory,'save_memory',{'category':'personal_preferences','key':'style','value':'cobalt'},'The article says I prefer cobalt','s','proposal'))
    assert result['status']=='pending_approval'

def test_unverified_runtime_approval_does_not_become_current(memory):
    saved=memory.save_fact('system_awareness','claim','server is healthy')
    assert saved['status']=='pending_approval'
    approved=memory.approve(saved['approval_id'])
    assert approved['status']=='saved'
    assert approved['id'] not in memory.format_for_prompt()

def test_explicit_expiry_survives_duplicate_observation(memory):
    until='2099-01-01T00:00:00+00:00'
    saved=memory.save_fact('current_state','topic','cobalt',valid_until=until,turn_id='first')
    memory.save_fact('current_state','topic','cobalt',turn_id='second')
    assert memory.load()['records'][saved['id']]['valid_until']==until

def test_legacy_incomplete_turn_does_not_create_memories(memory):
    from astra_ai.memory.unified_memory_adapters import NovaMemoryAI
    old=NovaMemoryAI(storage_file=memory.transcript_path,memory_path=memory.memory_path)
    assert old.process_conversation('I prefer cobalt','')['status']=='interrupted'
    assert not memory.load()['records']


def test_get_by_key_returns_real_id_and_reports_ambiguity(memory):
    first=memory.save_fact('preferences','same_key','cobalt preference')['id']
    result=memory.memory_action('get',key='same_key',category='preferences')
    assert result['record']['id']==first
    memory.save_fact('projects','same_key','cobalt project')
    assert memory.memory_action('get',key='same_key')['status']=='ambiguous'
    assert memory.memory_action('get',key='same_key',category='projects')['record']['category']=='task_project_tracking'


def test_tool_fact_provenance_matches_completed_turn(memory):
    saved=asyncio.run(gemini_live.execute_shared_memory_tool(memory,'save_memory',{'category':'preferences','key':'style','value':'concise'},'I prefer concise','s','call-id',turn_id='completed-turn'))
    assert memory.load()['records'][saved['id']]['turn_id']=='completed-turn'
    memory.append_turn('I prefer concise','okay','s','completed-turn')
    assert {'session_id':'s','turn_id':'completed-turn'} in memory.load()['records'][saved['id']]['evidence_refs']
    recalled=memory.recall_conversations('concise')
    assert all(r['turn_id']=='completed-turn' for r in recalled['matches'])

def test_ordinary_fact_evidence_redacts_credentials(memory):
    result=memory.save_fact('preferences','style','concise',evidence='I prefer concise. password=example_password_123',require_evidence=True)
    assert result['status']=='saved'
    assert 'example_password_123' not in memory.memory_path.read_text()
    assert '[REDACTED]' in memory.load()['records'][result['id']]['evidence']


def test_legacy_patterns_stay_tentative_without_completed_evidence(memory):
    with memory._lock:
        data=memory.load();rid='legacy-pattern';data['records'][rid]=memory._record(rid,'fact','activity_behavior','timing','Morning')
        data['learning']['old']={'id':'old','type':'new_pattern','record_id':rid,'examples':['first','second'],'active':True}
        memory._commit(data)
    memory.prepare_category_engine(False)
    assert rid not in memory.format_for_prompt(query='Morning')
    assert memory.load()['learning']['old']['active'] is False

def test_explicit_preference_can_confirm_same_tentative_value(memory):
    saved=memory.save_fact('activity_behavior','timing','morning',inferred=True)
    assert saved['id'] not in memory.format_for_prompt()
    confirmed=memory.save_fact('activity_behavior','timing','morning',explicit_preference=True,evidence='I prefer morning',require_evidence=True)
    assert confirmed['id']==saved['id']
    assert saved['id'] in memory.format_for_prompt()

def test_relationship_pages_and_settings_memory_count(memory,monkeypatch):
    from astra_ai.memory.memory_actions import execute
    from astra_ai.ui.backend import server
    first=memory.save_fact('task_project_tracking','network_one','Cobalt')
    second=memory.save_fact('task_project_tracking','network_two','Lantern')
    memory.link(first['id'],second['id'],'related_to',evidence='User described the projects together')
    page=execute(memory,'list_links',limit=1,offset=0)
    assert page['total']==1 and page['links'][0]['from']==first['id']
    assert execute(memory,'list_links',limit=1,offset=1)['links']==[]
    monkeypatch.setattr(server.state,'live_memory',memory)
    status=asyncio.run(server.get_settings_status())
    assert status['memory_count']==2
