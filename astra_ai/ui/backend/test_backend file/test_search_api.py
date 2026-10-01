import asyncio
import json

import server


def test_direct_search_rejects_empty_query():
    response = asyncio.run(server.run_search_widget({"query": "   "}))
    assert response.status_code == 400
    assert json.loads(response.body)["error"] == "query is required"


def test_direct_search_returns_current_state(monkeypatch):
    async def fake_run(widget, arguments, request_id, client_id=""):
        assert widget == "search"
        assert arguments == {"query": "orbital computing"}
        server.state.search_widget_context = {
            "current": {"query": arguments["query"], "answer": "Direct result", "loading": False},
            "history": [],
        }

    monkeypatch.setattr(server, "_run_serp_widget", fake_run)
    monkeypatch.setattr(server.state, "get_search_history_preview", lambda: [])
    result = asyncio.run(server.run_search_widget({"query": "orbital computing"}))
    assert result["success"] is True
    assert result["current"]["answer"] == "Direct result"
    assert result["current"]["loading"] is False


def test_direct_search_persists_and_broadcasts_failure(monkeypatch):
    broadcasts = []

    async def fake_run(*_args, **_kwargs):
        raise RuntimeError("provider unavailable")

    async def fake_broadcast(payload):
        broadcasts.append(payload)

    def fake_update(payload):
        server.state.search_widget_context = {"current": dict(payload), "history": []}
        return server.state.search_widget_context

    monkeypatch.setattr(server, "_run_serp_widget", fake_run)
    monkeypatch.setattr(server.ws_manager, "broadcast", fake_broadcast)
    monkeypatch.setattr(server.state, "update_search_widget_context", fake_update)
    monkeypatch.setattr(server.state, "get_search_history_preview", lambda: [])

    response = asyncio.run(server.run_search_widget({"query": "failing query"}))
    body = json.loads(response.body)
    assert response.status_code == 502
    assert body["current"]["loading"] is False
    assert body["current"]["error"] == "provider unavailable"
    assert broadcasts[0]["command"] == "show_results"
    assert broadcasts[0]["loading"] is False


def test_typed_search_reports_correlated_busy_without_releasing_active_turn(monkeypatch):
    sent = []

    async def fake_send(_websocket, payload):
        sent.append(payload)

    monkeypatch.setattr(server.ws_manager, "client_id", lambda _websocket: "client-search")
    monkeypatch.setattr(server.ws_manager, "send_to_client", fake_send)
    server.state.is_processing = True

    try:
        asyncio.run(server.handle_transcript_message(object(), {
            "type": "transcript",
            "text": "search the web for battery research",
            "isFinal": True,
            "request_id": "typed-123",
            "source": "search_widget",
        }))
    finally:
        # The rejected request must not clear another turn's processing lock.
        assert server.state.is_processing is True
        server.state.is_processing = False

    assert sent == [{
        "type": "typed_transcript_status",
        "request_id": "typed-123",
        "source": "search_widget",
        "status": "busy",
        "detail": "Astra is finishing another request. Try again in a moment.",
    }]
