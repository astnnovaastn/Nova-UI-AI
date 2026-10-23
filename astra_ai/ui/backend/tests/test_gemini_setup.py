import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from google import genai
import server


def test_saved_gemini_key_updates_running_server(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    monkeypatch.setattr(server, "ROOT_ENV_FILE", env_file)
    monkeypatch.setattr(server.state, "gemini_api_key", "")
    monkeypatch.setenv("GEMINI_API_KEY", "")
    result = asyncio.run(server.save_api_keys({"key_name": "gemini_api_key", "key_value": "test-only-key"}))
    assert result["success"] is True
    assert server.state.gemini_api_key == "test-only-key"
    assert "GEMINI_API_KEY=test-only-key" in env_file.read_text()
    assert asyncio.run(server.get_settings_status())["env_keys_set"]["gemini"] is True


def test_chat_uses_existing_live_session_without_another_model(monkeypatch):
    socket=object()
    async def reply(text, request_id):
        assert text=='Hello'
        return {'output_text':'Hello from Gemini Live','memory_status':'pending'}
    live=SimpleNamespace(text_reply=reply,model='gemini-3.8-live',session_id='shared')
    monkeypatch.setattr(server.ws_manager,'websocket_for',lambda client:socket if client=='connected' else None)
    monkeypatch.setattr(server.state,'live_sessions',{socket:live})
    monkeypatch.setattr(server.state,'gemini_api_key','fixture-key')
    monkeypatch.setattr(genai,'Client',lambda **kwargs:(_ for _ in ()).throw(AssertionError('must reuse Live')))
    result=asyncio.run(server.chat_rest({'text':'Hello','client_id':'connected'}))
    assert result['response']=='Hello from Gemini Live'
    assert result['provider']=='gemini_live' and result['audio_via']=='websocket'
    with pytest.raises(HTTPException) as error:
        asyncio.run(server.chat_rest({'text':'Hello','client_id':'unknown'}))
    assert error.value.status_code==403


@pytest.mark.parametrize("text", [None, 7, {}, " "])
def test_chat_rejects_invalid_text(text):
    with pytest.raises(HTTPException) as error:
        asyncio.run(server.chat_rest({"text": text}))
    assert error.value.status_code == 400


def test_chat_reports_missing_credentials(monkeypatch):
    monkeypatch.setattr(server.state, "gemini_api_key", "")
    monkeypatch.setattr(server.state, "aegis_ai", None)
    with pytest.raises(HTTPException) as error:
        asyncio.run(server.chat_rest({"text": "Hello"}))
    assert error.value.status_code == 503
    assert "GEMINI_API_KEY" in error.value.detail


def test_notes_and_news_can_use_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-key")
    providers = server._get_notes_ai_provider_chain()
    assert any(provider["name"] == "gemini" for provider in providers)
