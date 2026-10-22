import asyncio, base64, json
from pathlib import Path
from types import SimpleNamespace
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from astra_ai.ui.backend.workspace_sync import WorkspaceHub
from astra_ai.ui.backend.collaboration import CollaborationService, SCHEMA, project
from astra_ai.ui.backend.workspace_gateway import make_gateway
from astra_ai.core.research_learning import ResearchArtifacts
from pycrdt import Doc, XmlFragment, XmlElement, XmlText

CTX = {"profile_id": "", "project_id": ""}


def test_presence_voice_fencing_and_expiry(tmp_path):
    now = [100]
    hub = WorkspaceHub(tmp_path / "sync.db", lambda: now[0])
    hub.register("a", {"window_id": "a-window-123"}, CTX)
    hub.register("b", {"window_id": "b-window-123"}, CTX)
    assert hub.presence(CTX)["count"] == 2
    lease = hub.acquire_voice("a")
    assert lease["granted"] and not hub.acquire_voice("b")["granted"]
    assert not hub.owns_voice("a", lease["owner"]["generation"] + 1)
    now[0] += 10
    hub.touch("b")
    now[0] += 6
    assert hub.acquire_voice("b")["granted"] and not hub.owns_voice("a")
    assert hub.presence(CTX)["count"] == 1


def test_scope_journal_restart_selection_and_cards(tmp_path):
    hub = WorkspaceHub(tmp_path / "sync.db")
    event = hub.append(CTX, "research", "one", {"revision": 2})
    assert hub.bootstrap({"profile_id": "other"})["events"] == []
    card = hub.select(CTX, "one", "r", "Evidence, not instructions.", {})
    hub.turn("turn", CTX, "thread", [card])
    restarted = WorkspaceHub(hub.path)
    assert (
        restarted.installation == hub.installation
        and restarted.bootstrap(CTX)["sequence"] == event["sequence"]
    )
    assert restarted.turn("turn", CTX)["cards"] == [card]
    with pytest.raises(ValueError):
        restarted.selection({"profile_id": "other"}, card["id"])
    with pytest.raises(ValueError):
        restarted.select(CTX, "one", "r", "x" * 64001, {})


def test_pairing_is_single_use_approved_revocable_and_tls_only(tmp_path):
    hub = WorkspaceHub(tmp_path / "sync.db")
    code = hub.pair_code()["code"]
    claim = hub.claim(code, "Laptop")
    assert hub.device(claim["credential"]) is None
    assert hub.device(claim["credential"], pending=True)["revoked"]
    with pytest.raises(ValueError):
        hub.claim(code, "Other")
    hub.approve(claim["device_id"], True)
    assert hub.device(claim["credential"])
    client = TestClient(make_gateway(hub, tmp_path), base_url="https://host.local")
    assert client.get("/api/sync/presence").status_code == 401
    client.cookies.set("nova_paired_device", claim["credential"])
    assert client.get("/api/runtime/status").status_code == 403
    assert client.get("/api/settings").status_code == 403
    assert (
        client.post(
            "/pair", headers={"Origin": "https://evil.example"}, json={}
        ).status_code
        == 403
    )
    hub.approve(claim["device_id"], False)
    assert client.get("/api/sync/presence").status_code == 401
    assert TestClient(make_gateway(hub, tmp_path)).get("/pair").status_code == 400


def document(text="Hello"):
    doc = Doc()
    doc["default"] = XmlFragment([XmlElement("paragraph", contents=[XmlText(text)])])
    return doc


def test_crdt_concurrent_merge_and_projection_preserves_marks(tmp_path):
    original = document()
    a = Doc()
    a.apply_update(original.get_update())
    b = Doc()
    b.apply_update(original.get_update())
    a.get("default", type=XmlFragment).children[0].children[0].insert(0, "A ")
    b.get("default", type=XmlFragment).children[0].children[0].insert(5, " B")
    a.apply_update(b.get_update())
    b.apply_update(a.get_update())
    assert project(a) == project(b) == "<p>A Hello B</p>"
    text = a.get("default", type=XmlFragment).children[0].children[0]
    text.format(0, 1, {"bold": {}})
    assert "<strong>A</strong>" in project(a)


def test_video_projection_retains_editor_and_export_attributes():
    doc = Doc()
    doc["default"] = XmlFragment(
        [
            XmlElement(
                "documentVideo",
                attributes={
                    "url": "https://www.youtube.com/watch?v=example",
                    "title": "Evidence video",
                },
            )
        ]
    )
    assert (
        project(doc)
        == '<div data-video-url="https://www.youtube.com/watch?v=example" data-video-title="Evidence video"></div>'
    )


def test_overlay_properties_merge_without_replacing_other_properties():
    from pycrdt import Map

    seed = Doc()
    seed["overlays"] = Map(
        {"1:object:rect": [10, 20, 30, 40], "1:object:text": "Original"}
    )
    a = Doc()
    b = Doc()
    a.apply_update(seed.get_update())
    b.apply_update(seed.get_update())
    a.get("overlays", type=Map)["1:object:rect"] = [20, 30, 30, 40]
    b.get("overlays", type=Map)["1:object:text"] = "Edited in the other window"
    a.apply_update(b.get_update())
    b.apply_update(a.get_update())
    assert (
        a.get("overlays", type=Map).to_py()
        == b.get("overlays", type=Map).to_py()
        == {
            "1:object:rect": [20, 30, 30, 40],
            "1:object:text": "Edited in the other window",
        }
    )


def test_collaboration_seed_once_acknowledge_and_scope(tmp_path):
    store = ResearchArtifacts(tmp_path / "reports.json")
    report = store.save("Topic", "detailed", "# Topic\n\nEvidence.", [], [], CTX, "op")
    hub = WorkspaceHub(tmp_path / "sync.db")
    app = FastAPI()
    workspace = SimpleNamespace(
        store=lambda: hub,
        artifacts=lambda: (store, None),
        request_context=lambda req: CTX,
    )
    service = CollaborationService(app, workspace)
    client = TestClient(app)
    seed = lambda text: {
        "schema": SCHEMA,
        "seed": base64.b64encode(document(text).get_update()).decode(),
    }
    with client:
        first = client.post(
            "/api/research/" + report["id"] + "/collaboration", json=seed("Original")
        ).json()
        second = client.post(
            "/api/research/" + report["id"] + "/collaboration",
            json=seed("Wrong replacement"),
        ).json()
        assert first["epoch"] == second["epoch"]
        doc = Doc()
        doc.apply_update(base64.b64decode(second["update"]))
        assert "Original" in project(doc) and "Wrong" not in project(doc)
        endpoint = "/api/research/" + report["id"] + "/collaboration/snapshot"
        assert (
            client.post(
                endpoint, json={"epoch": first["epoch"], "vector": "stale"}
            ).status_code
            == 409
        )
        r = client.post(
            endpoint,
            json={
                "epoch": first["epoch"],
                "vector": base64.b64encode(doc.get_state()).decode(),
            },
        )
        assert r.status_code == 200, r.text
        assert store.document(report["id"], CTX)["draft"]["html"] == "<p>Original</p>"
        client.portal.call(service.removal, report["id"], "removal-boundary")
        restored = client.post(
            "/api/research/" + report["id"] + "/collaboration", json=seed("Do not reseed")
        ).json()
        assert restored["epoch"] != first["epoch"]
        assert client.post(endpoint, json={"epoch": first["epoch"], "vector": base64.b64encode(doc.get_state()).decode()}).status_code == 409
        restored_doc = Doc()
        restored_doc.apply_update(base64.b64decode(restored["update"]))
        assert project(restored_doc) == "<p>Original</p>"
        client.portal.call(service.stop)


def test_state_vectors_compare_clocks_not_binary_order():
    from astra_ai.ui.backend.collaboration import state_vector

    assert state_vector(bytes([2, 1, 3, 2, 4])) == state_vector(bytes([2, 2, 4, 1, 3]))
    with pytest.raises(ValueError):
        state_vector(b"bad")


def test_mirror_uses_authorized_report_thread_without_navigation(tmp_path):
    from astra_ai.ui.backend.workspace_api import WorkspaceService

    async def run():
        store = ResearchArtifacts(tmp_path / "reports.json")
        report = store.save(
            "Topic", "detailed", "A supported answer.", [], [], CTX, "initial"
        )
        item = store.get(report["id"], CTX)["artifact"]
        thread = item.get("thread_id", "research-" + report["id"])
        sent = []
        sockets = {c: object() for c in ["a", "b", "c"]}

        class Manager:
            def websocket_for(self, c):
                return sockets[c]

            async def send_to_client(self, socket, message):
                sent.append((socket, message))

        workspace = WorkspaceService(
            FastAPI(),
            Manager(),
            SimpleNamespace(
                live_sessions={},
                live_memory=SimpleNamespace(memory_path=tmp_path / "long.json"),
            ),
            {},
            {},
            lambda: (store, None),
            lambda request: CTX,
            None,
        )
        hub = workspace.store()
        for c in sockets:
            hub.register(c, {"window_id": c + "-window-123"}, CTX)
        hub.touch("a", {"view": "research", "research_id": report["id"]})
        hub.touch("b", {"view": "research", "research_id": report["id"]})
        hub.touch("c", {"view": "memory"})
        await workspace.mirror(
            "a",
            {
                "type": "live_input_transcript",
                "research_id": report["id"],
                "thread_id": thread,
                "request_id": "turn",
                "full_text": "Question",
            },
        )
        assert len(sent) == 1 and sent[0][0] is sockets["b"]
        assert sent[0][1]["page_id"] == report["id"]
        assert hub.windows["c"]["context"]["view"] == "memory"
        assert workspace.state.live_sessions == {}

    asyncio.run(run())
