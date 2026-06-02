import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

from astra_ai.memory import semantic_memory_manager as semantic


class FakeModels:
    def __init__(self):
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(
            text=json.dumps(
                {
                    "identity": {
                        "name": {
                            "value": "Ada",
                            "confidence": "high",
                            "source": "user_statement",
                        }
                    },
                    "goals": {
                        "current_goal": {
                            "value": "build Astra AI",
                            "confidence": "high",
                            "source": "user_statement",
                        }
                    },
                }
            )
        )


class FakeClient:
    def __init__(self):
        self.models = FakeModels()


class OrganizedFakeModels:
    def generate_content(self, **kwargs):
        return SimpleNamespace(
            text=json.dumps(
                {
                    "identity": {
                        "name": {
                            "value": "Momo",
                            "confidence": 1.0,
                            "source": "user",
                        }
                    },
                    "demographics": {},
                    "preferences": {
                        "food": {
                            "favorite_cuisines": {
                                "value": ["Italian", "Ghanaian"],
                                "confidence": 1.0,
                                "source": "user",
                            }
                        }
                    },
                    "milestones": {},
                    "goals": {},
                    "relationships": {
                        "family": {
                            "mother": {
                                "value": "Jhson",
                                "confidence": 1.0,
                                "source": "user",
                            }
                        }
                    },
                }
            )
        )


class OrganizedFakeClient:
    def __init__(self):
        self.models = OrganizedFakeModels()


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def test_sync_extracts_new_user_turns_once_and_preserves_existing_fields(tmp_path, monkeypatch):
    source_path = tmp_path / "Date" / "nova_ai_memory.json"
    state_path = tmp_path / "memory" / "semantic_sync_state.json"
    memory_path = tmp_path / "memory" / "long_term.json"
    write_json(
        source_path,
        {
            "conversation": [
                {"role": "user", "content": "My name is Ada and I want to build Astra AI."},
                {"role": "assistant", "content": "The user's name might be Grace."},
            ]
        },
    )
    write_json(memory_path, {"notes": {"keep": {"value": "existing"}}})
    write_json(state_path, {"conversation_cursor": 0})
    monkeypatch.setattr(semantic, "MEMORY_PATH", memory_path)
    monkeypatch.setattr(semantic, "FORGET_STATE_PATH", tmp_path / "memory" / "semantic_forget_state.json")
    fake_client = FakeClient()
    manager = semantic.SemanticMemoryManager(
        source_path=source_path,
        state_path=state_path,
        client=fake_client,
    )

    asyncio.run(manager.sync_latest())
    asyncio.run(manager.sync_latest())

    saved = json.loads(memory_path.read_text(encoding="utf-8"))
    state = json.loads(state_path.read_text(encoding="utf-8"))
    prompt = fake_client.models.calls[0]["contents"]
    assert saved["identity"]["name"]["value"] == "Ada"
    assert saved["goals"]["current_goal"]["value"] == "build Astra AI"
    assert saved["notes"]["keep"]["value"] == "existing"
    assert "Grace" not in prompt
    assert state["conversation_cursor"] == 2
    assert len(fake_client.models.calls) == 1


def test_sync_reorganizes_profile_and_removes_misplaced_facts(tmp_path, monkeypatch):
    source_path = tmp_path / "Date" / "nova_ai_memory.json"
    state_path = tmp_path / "memory" / "semantic_sync_state.json"
    memory_path = tmp_path / "memory" / "long_term.json"
    write_json(
        source_path,
        {"conversation": [{"role": "user", "content": "My name is Momo."}]},
    )
    write_json(state_path, {"conversation_cursor": 0})
    write_json(
        memory_path,
        {
            "identity": {"name": {"value": "Reachel"}},
            "demographics": {"mother_name": {"value": "Jhson"}},
            "notes": {"keep": {"value": "existing"}},
        },
    )
    monkeypatch.setattr(semantic, "MEMORY_PATH", memory_path)
    monkeypatch.setattr(semantic, "FORGET_STATE_PATH", tmp_path / "memory" / "semantic_forget_state.json")
    manager = semantic.SemanticMemoryManager(
        source_path=source_path,
        state_path=state_path,
        client=OrganizedFakeClient(),
    )

    asyncio.run(manager.sync_latest())

    saved = json.loads(memory_path.read_text(encoding="utf-8"))
    assert saved["identity"]["name"]["value"] == "Momo"
    assert saved["demographics"] == {}
    assert saved["relationships"]["family"]["mother"]["value"] == "Jhson"
    assert saved["preferences"]["food"]["favorite_cuisines"]["value"] == [
        "Italian",
        "Ghanaian",
    ]
    assert saved["notes"]["keep"]["value"] == "existing"
