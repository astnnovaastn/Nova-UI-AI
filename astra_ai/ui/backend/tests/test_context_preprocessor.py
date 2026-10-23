import asyncio
import requests

from context_preprocessor.service import ContextPreprocessor


def test_small_context_uses_deterministic_path(tmp_path, monkeypatch):
    monkeypatch.delenv("ASTRA_CONTEXT_COMPACTOR_API_KEY", raising=False)
    processor = ContextPreprocessor(tmp_path)
    result = asyncio.run(processor.prepare({"connected_widgets": {"search": {"state": {"query": "Astra"}}}}, request_id="r1"))
    assert result.used_model is False
    assert result.fallback_reason == "below_threshold"
    assert "search" in result.context["connected_widgets"]


def test_large_context_falls_back_without_server_key(tmp_path, monkeypatch):
    monkeypatch.delenv("ASTRA_CONTEXT_COMPACTOR_API_KEY", raising=False)
    monkeypatch.setenv("ASTRA_CONTEXT_COMPACTOR_THRESHOLD_BYTES", "512")
    processor = ContextPreprocessor(tmp_path)
    payload = {"connected_widgets": {"search": {"state": {"query": "x" * 1000}}}}
    result = asyncio.run(processor.prepare(payload, request_id="r2"))
    assert result.used_model is False
    assert result.fallback_reason == "missing_key"
    assert (tmp_path / "trace_index.json").exists()
    trace_text = (tmp_path / "trace_index.json").read_text(encoding="utf-8")
    assert "x" * 100 not in trace_text


def test_large_context_calls_model_once_then_uses_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("ASTRA_CONTEXT_COMPACTOR_API_KEY", "test-only")
    monkeypatch.setenv("ASTRA_CONTEXT_COMPACTOR_THRESHOLD_BYTES", "512")
    processor = ContextPreprocessor(tmp_path)
    calls = []

    def compact(_payload):
        calls.append(True)
        return {
            "summary": "Search widget context",
            "connected_widgets": ["search"],
            "recent_actions": [],
            "omitted_count": 0,
            "warnings": [],
        }

    monkeypatch.setattr(processor, "_call_groq", compact)
    payload = {"connected_widgets": {"search": {"state": {"query": "x" * 1000}}}}
    first = asyncio.run(processor.prepare(payload, request_id="model-1"))
    second = asyncio.run(processor.prepare(payload, request_id="model-2"))
    assert first.used_model is True
    assert second.used_model is True
    assert len(calls) == 1
    assert processor.health()["cached_contexts"] == 1


def test_rate_limit_opens_circuit_and_next_turn_stays_local(tmp_path, monkeypatch):
    monkeypatch.setenv("ASTRA_CONTEXT_COMPACTOR_API_KEY", "test-only")
    monkeypatch.setenv("ASTRA_CONTEXT_COMPACTOR_THRESHOLD_BYTES", "512")
    processor = ContextPreprocessor(tmp_path)
    calls = []

    def rate_limited(_payload):
        calls.append(True)
        response = requests.Response()
        response.status_code = 429
        raise requests.HTTPError(response=response)

    monkeypatch.setattr(processor, "_call_groq", rate_limited)
    payload = {"connected_widgets": {"search": {"state": {"query": "x" * 1000}}}}
    first = asyncio.run(processor.prepare(payload, request_id="limited-1"))
    second = asyncio.run(processor.prepare({**payload, "new": True}, request_id="limited-2"))
    assert first.fallback_reason == "rate_limited"
    assert second.fallback_reason == "circuit_open"
    assert len(calls) == 1
    assert processor.health()["circuit_open"] is True
