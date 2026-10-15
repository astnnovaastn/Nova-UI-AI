"""Compatibility search routes share scoped research and the current Live session."""
import asyncio,json
import pytest
from fastapi import HTTPException
from starlette.requests import Request
import server


def request():return Request({'type':'http','headers':[(b'x-nova-client',b'fixture')],'query_string':b''})

def test_direct_search_rejects_empty_query():
    response=asyncio.run(server.run_search_widget({'query':'   '},request()))
    assert response.status_code==400 and json.loads(response.body)['error']=='query is required'

def test_direct_search_returns_current_artifact_state(monkeypatch):
    context={'client_id':'fixture','profile_id':'owner','project_id':'','session_id':'conversation'}
    monkeypatch.setattr(server,'_learning_context',lambda req:context)
    monkeypatch.setattr(server.state,'get_search_history_preview',lambda:[])
    async def dispatch(name,arguments,c,operation):
        assert name=='search_widget_action' and arguments['mode']=='detailed' and c['profile_id']=='owner'
        server.state.search_widget_context={'current':{'query':arguments['query'],'answer':'Full report','research_id':'artifact-one'},'history':[]}
        return {'status':'completed','research_id':'artifact-one','research_revision':'v1'}
    monkeypatch.setattr(server,'_dispatch_aegis_tool',dispatch)
    result=asyncio.run(server.run_search_widget({'query':'orbital computing'},request()))
    assert result['success'] and result['current']['research_id']=='artifact-one'

def test_direct_search_rejects_unknown_connection():
    with pytest.raises(HTTPException) as error:asyncio.run(server.run_search_widget({'query':'Public query'},request()))
    assert error.value.status_code==403

def test_compatibility_transcript_uses_live_without_legacy_processing_lock(monkeypatch):
    calls=[];socket=object()
    class Live:
        async def send_text(self,text,request_id):calls.append((text,request_id))
    monkeypatch.setattr(server.state,'live_sessions',{socket:Live()})
    monkeypatch.setattr(server.ws_manager,'client_id',lambda ws:'fixture')
    monkeypatch.setattr(server.state,'is_processing',True)
    asyncio.run(server.handle_transcript_message(socket,{'text':'Current request','isFinal':True,'request_id':'typed-123'}))
    assert calls==[('Current request','typed-123')] and server.state.is_processing is True
