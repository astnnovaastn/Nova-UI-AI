import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

from astra_ai.ui.backend.gemini_live import GeminiLiveSession, LIVE_MODEL, VOICE_NAME
from astra_ai.ui.backend import gemini_live
from astra_ai.core.aegis_live_context import build_aegis_live_instruction
from astra_ai.memory.live_memory import LiveMemoryManager


def _memory_manager(tmp_path: Path, transcript_path: Path) -> LiveMemoryManager:
    manager = LiveMemoryManager(
        memory_path=tmp_path / "long_term.json",
        transcript_path=transcript_path,
    )
    manager.ensure_ready()
    return manager


def test_live_config_pins_requested_model_and_voice(tmp_path: Path):
    memory = tmp_path / "memory.json"
    memory.write_text('{"conversation": []}', encoding="utf-8")

    async def send_json(_message):
        return None

    async def send_bytes(_payload):
        return None

    async def failed(_reason, _audio_started, _input_text):
        return None

    session = GeminiLiveSession(
        api_key="test-key",
        memory_file=memory,
        memory_manager=_memory_manager(tmp_path, memory),
        send_json=send_json,
        send_bytes=send_bytes,
        on_failure=failed,
    )
    config = session._config()

    assert LIVE_MODEL == "gemini-3.1-flash-live-preview"
    assert config.response_modalities == ["AUDIO"]
    assert config.input_audio_transcription is not None
    assert config.output_audio_transcription is not None
    assert config.speech_config.voice_config.prebuilt_voice_config.voice_name == VOICE_NAME == "Puck"
    assert all(tool.google_search is None for tool in config.tools)
    declarations = next(tool.function_declarations for tool in config.tools if tool.function_declarations)
    assert {declaration.name for declaration in declarations} == {
        "save_memory", "forget_memory", "recall_conversations",
        "save_memory_event", "forget_memory_event", "recall_memory",
                    "get_system_status", "read_notes_context", "read_search_context", "read_calendar_context", "read_image_context", "notes_action", "calendar_create_event", "calendar_action", "image_action", "search_history_action",
            "ui_action", "search_web", "search_widget_action", "recall_search_memory", "save_search_memory",
        "update_search_memory", "delete_search_memory", "create_file", "read_file",
        "edit_file", "append_file", "list_tracked_files", "delete_file", "move_file", "file_status",
    }


def test_widget_tools_use_authoritative_callbacks(tmp_path: Path):
    memory = tmp_path / "memory.json"
    memory.write_text('{"conversation":[]}', encoding="utf-8")
    calls = []

    async def send_json(_message):
        return None

    async def send_bytes(_payload):
        return None

    async def failed(_reason, _audio_started, _input_text):
        return None

    async def execute(name, arguments):
        calls.append((name, arguments))
        return {"status": "completed", "operation_id": "op-1"}

    async def status():
        return {"status": "ok", "backend": "healthy"}

    session = GeminiLiveSession(
        api_key="test-key", memory_file=memory,
        memory_manager=_memory_manager(tmp_path, memory),
        send_json=send_json, send_bytes=send_bytes, on_failure=failed,
        operation_executor=execute, status_provider=status,
    )
    notes = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="notes-1", name="notes_action", args={"action": "create_note", "content": "hello"}
    )))
    system = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="status-1", name="get_system_status", args={}
    )))
    assert notes.response["status"] == "completed"
    assert calls == [("notes_action", {"action": "create_note", "content": "hello"})]
    assert system.response["backend"] == "healthy"


def test_context_is_bounded_and_uses_recent_conversation(tmp_path: Path):
    memory = tmp_path / "memory.json"
    memory.write_text(json.dumps({
        "user": {"name": "Test User"},
        "memory_categories": {"personal_preferences": {"tone": "brief"}},
        "conversation": [
            {"role": "user", "content": f"old-{index}"} for index in range(20)
        ],
    }), encoding="utf-8")

    instruction = build_aegis_live_instruction(memory, recent_turns=3, max_memory_chars=2000)

    assert "You are Aegis" in instruction
    assert "old-19" in instruction
    assert "old-0" not in instruction
    assert len(instruction) < 5000


def test_turn_completion_appends_transcripts_only(tmp_path: Path):
    memory = tmp_path / "memory.json"
    memory.write_text(json.dumps({"conversation": []}), encoding="utf-8")
    sent = []

    async def send_json(message):
        sent.append(message)

    async def send_bytes(_payload):
        return None

    async def failed(_reason, _audio_started, _input_text):
        return None

    session = GeminiLiveSession(
        api_key="test-key",
        memory_file=memory,
        memory_manager=_memory_manager(tmp_path, memory),
        send_json=send_json,
        send_bytes=send_bytes,
        on_failure=failed,
    )
    session._input_parts = ["hello", "Aegis"]
    session._output_parts = ["hello", "back"]

    asyncio.run(session._complete_turn())

    stored = json.loads(memory.read_text(encoding="utf-8"))
    assert [item["role"] for item in stored["conversation"]] == ["user", "assistant"]
    assert stored["conversation"][0]["content"] == "hello Aegis"
    assert stored["conversation"][1]["content"] == "hello back"
    assert sent[-1]["type"] == "live_turn_complete"


def test_memory_tool_calls_are_correlated_and_persist(tmp_path: Path):
    transcript = tmp_path / "memory.json"
    transcript.write_text(json.dumps({
        "conversation": [
            {"role": "user", "content": "My lighthouse project uses cobalt."},
            {"role": "assistant", "content": "I will remember the lighthouse project."},
        ],
    }), encoding="utf-8")
    manager = _memory_manager(tmp_path, transcript)

    async def send_json(_message):
        return None

    async def send_bytes(_payload):
        return None

    async def failed(_reason, _audio_started, _input_text):
        return None

    session = GeminiLiveSession(
        api_key="test-key",
        memory_file=transcript,
        memory_manager=manager,
        send_json=send_json,
        send_bytes=send_bytes,
        on_failure=failed,
    )

    saved = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-save",
        name="save_memory",
        args={"category": "projects", "key": "lighthouse", "value": "Uses cobalt"},
    )))
    recalled = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-recall",
        name="recall_conversations",
        args={"query": "lighthouse cobalt", "limit": 2},
    )))
    forgotten = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-forget",
        name="forget_memory",
        args={"category": "projects", "key": "lighthouse"},
    )))
    event_saved = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-event-save", name="save_memory_event",
        args={"event_type": "speaking_rule", "key": "avoid_example", "content": "Use concise replies."},
    )))
    event_recalled = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-event-recall", name="recall_memory",
        args={"query": "concise replies", "limit": 2},
    )))
    event_forgotten = asyncio.run(session._execute_memory_tool(SimpleNamespace(
        id="call-event-forget", name="forget_memory_event",
        args={"event_id": event_saved.response["id"]},
    )))

    assert saved.id == "call-save"
    assert saved.response["status"] == "saved"
    assert recalled.id == "call-recall"
    assert recalled.response["matches"]
    assert forgotten.id == "call-forget"
    assert forgotten.response["status"] == "forgotten"
    assert event_saved.response["status"] == "saved"
    assert event_recalled.response["matches"]
    assert event_forgotten.response["status"] == "forgotten"


def test_transcript_write_failure_does_not_end_live_session(tmp_path: Path, monkeypatch):
    transcript = tmp_path / "memory.json"
    transcript.write_text(json.dumps({"conversation": []}), encoding="utf-8")
    sent = []

    async def send_json(message):
        sent.append(message)

    async def send_bytes(_payload):
        return None

    async def failed(_reason, _audio_started, _input_text):
        raise AssertionError("fallback must not run for transcript persistence errors")

    def fail_write(*_args):
        raise PermissionError("simulated Windows file lock")

    monkeypatch.setattr(gemini_live, "_append_turn", fail_write)
    session = GeminiLiveSession(
        api_key="test-key",
        memory_file=transcript,
        memory_manager=_memory_manager(tmp_path, transcript),
        send_json=send_json,
        send_bytes=send_bytes,
        on_failure=failed,
    )
    session._input_parts = ["still complete"]

    asyncio.run(session._complete_turn())

    assert sent[-1]["type"] == "live_turn_complete"
