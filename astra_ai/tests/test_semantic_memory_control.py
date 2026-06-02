import asyncio
import json
from pathlib import Path

from astra_ai.memory import semantic_memory_control as control
from astra_ai.memory import semantic_memory_manager as semantic


class FailingModels:
    def generate_content(self, **kwargs):
        raise RuntimeError("offline test")


class FailingClient:
    def __init__(self):
        self.models = FailingModels()


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def test_status_and_profile_include_all_sections(tmp_path, monkeypatch):
    memory_path = tmp_path / "long_term.json"
    write_json(
        memory_path,
        {
            "identity": {"name": {"value": "Momo"}},
            "notes": {"coding_note": {"value": "Use Python"}},
        },
    )
    monkeypatch.setattr(semantic, "MEMORY_PATH", memory_path)
    monkeypatch.setattr(semantic, "FORGET_STATE_PATH", tmp_path / "semantic_forget_state.json")
    monkeypatch.setattr(control, "MEMORY_PATH", memory_path)
    controller = control.SemanticMemoryControl(
        semantic_manager=object(),
        status_provider=lambda: {"mem0_live": True},
        client=FailingClient(),
    )

    status = asyncio.run(controller.process("memory status"))
    profile = asyncio.run(controller.process("show my profile"))

    assert "Mem0 live conversation memory: ONLINE" in status
    assert "Semantic long-term organizer: ONLINE" in status
    assert "your name is Momo" in profile
    assert "[LONG-TERM USER PROFILE" not in profile


def test_specific_forget_removes_only_requested_leaf(tmp_path, monkeypatch):
    memory_path = tmp_path / "long_term.json"
    write_json(
        memory_path,
        {
            "identity": {"name": {"value": "Momo"}},
            "relationships": {
                "family": {
                    "father": {"value": "Rich"},
                    "mother": {"value": "Jhson"},
                }
            },
        },
    )
    monkeypatch.setattr(semantic, "MEMORY_PATH", memory_path)
    monkeypatch.setattr(semantic, "FORGET_STATE_PATH", tmp_path / "semantic_forget_state.json")
    monkeypatch.setattr(control, "MEMORY_PATH", memory_path)
    controller = control.SemanticMemoryControl(client=FailingClient())

    response = asyncio.run(controller.process("forget my father's name"))
    saved = json.loads(memory_path.read_text(encoding="utf-8"))

    assert "relationships / family / father" in response
    assert "father" not in saved["relationships"]["family"]
    assert saved["relationships"]["family"]["mother"]["value"] == "Jhson"
    restored = asyncio.run(controller.process("restore my father's name"))
    assert "relationships / family / father" in restored


def test_bulk_forget_requires_clarification(tmp_path, monkeypatch):
    memory_path = tmp_path / "long_term.json"
    write_json(memory_path, {"identity": {"name": {"value": "Momo"}}})
    monkeypatch.setattr(semantic, "MEMORY_PATH", memory_path)
    monkeypatch.setattr(semantic, "FORGET_STATE_PATH", tmp_path / "semantic_forget_state.json")
    monkeypatch.setattr(control, "MEMORY_PATH", memory_path)
    controller = control.SemanticMemoryControl(client=FailingClient())

    response = asyncio.run(controller.process("forget everything about me"))

    assert "request is broad" in response
    assert json.loads(memory_path.read_text(encoding="utf-8"))["identity"]["name"]["value"] == "Momo"
