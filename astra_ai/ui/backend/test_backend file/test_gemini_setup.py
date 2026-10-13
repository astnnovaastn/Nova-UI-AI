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


def test_chat_uses_gemini_without_legacy_subprocess(monkeypatch, tmp_path):
    from astra_ai.memory.live_memory import LiveMemoryManager
    manager=LiveMemoryManager(memory_path=tmp_path/"long_term.json",transcript_path=tmp_path/"conversation.json")
    manager.ensure_ready()
    monkeypatch.setattr(server.state,"live_memory",manager)
    closed = []
    async def generate_content_stream(**kwargs):
        assert kwargs["contents"][-1].parts[0].text == "Hello"
        async def chunks():
            yield SimpleNamespace(candidates=[SimpleNamespace(content=SimpleNamespace(parts=[SimpleNamespace(text="Hello from Gemini",thought=False,function_call=None)]))])
        return chunks()
    async def close():
        closed.append(True)
    client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content_stream=generate_content_stream), aclose=close))
    monkeypatch.setattr(genai, "Client", lambda **kwargs: client)
    monkeypatch.setattr(server.state, "gemini_api_key", "test-only-key")
    monkeypatch.setattr(server.state, "aegis_ai", None)
    result = asyncio.run(server.chat_rest({"text": "Hello"}))
    assert result["response"] == "Hello from Gemini"
    assert result["provider"] == "gemini"
    assert closed == [True]


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
