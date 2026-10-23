from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import task_backend.router as task_router_module
from task_backend.router import task_router, task_webhook_router
from task_backend.store import TaskStore, TaskStoreError


def task_payload(**overrides):
    payload = {
        "title": "Research launch options",
        "instruction": "Compare three safe launch options and summarize them.",
        "kind": "research",
        "priority": "normal",
        "tags": ["aegis", "launch"],
        "project": "Astra",
        "due_at": datetime(2027, 1, 1, tzinfo=timezone.utc),
        "timezone": "Europe/Rome",
        "checklist": [],
        "dependency_ids": [],
        "metadata": {},
        "lifecycle": "active",
        "trigger": {"kind": "manual", "timezone": "Europe/Rome", "enabled": True},
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def store(tmp_path):
    value = TaskStore(tmp_path / "tasks")
    value.initialize()
    return value


def test_task_crud_and_idempotency(store):
    created = store.create_task("owner-a", task_payload(), idempotency_key="same-request")
    duplicate = store.create_task("owner-a", task_payload(title="Ignored"), idempotency_key="same-request")
    assert duplicate["id"] == created["id"]
    assert created["trigger"]["kind"] == "manual"

    updated = store.update_task("owner-a", created["id"], {"title": "Updated"}, created["version"])
    assert updated["title"] == "Updated"
    assert updated["version"] == created["version"] + 1
    with pytest.raises(TaskStoreError, match="another client"):
        store.update_task("owner-a", created["id"], {"title": "Stale"}, created["version"])

    assert store.list_tasks("owner-b") == []
    store.delete_task("owner-a", created["id"])
    assert store.list_tasks("owner-a") == []
    assert store.list_activity("owner-a") == []


def test_run_state_machine_progress_and_activity(store):
    task = store.create_task("local", task_payload())
    run = store.create_run("local", task["id"])
    running = store.transition_run("local", run["id"], "running", progress=10, current_step="Planning")
    assert running["progress"] == 10
    with pytest.raises(TaskStoreError, match="backwards"):
        store.transition_run("local", run["id"], "running", progress=5)
    paused = store.transition_run("local", run["id"], "pausing")
    assert paused["status"] == "pausing"
    paused = store.transition_run("local", run["id"], "paused")
    assert paused["status"] == "paused"
    queued = store.transition_run("local", run["id"], "queued")
    assert queued["status"] == "queued"
    done = store.transition_run("local", run["id"], "running", progress=60)
    done = store.transition_run("local", run["id"], "succeeded", result={"summary": "Done"})
    assert done["status"] == "succeeded"
    assert store.get_task("local", task["id"])["lifecycle"] == "completed"
    assert [event["type"] for event in store.list_activity("local")]


def test_dependency_and_approval_controls(store):
    prerequisite = store.create_task("local", task_payload(title="First"))
    dependent = store.create_task(
        "local",
        task_payload(title="Second", dependency_ids=[prerequisite["id"]]),
    )
    with pytest.raises(TaskStoreError, match="dependencies"):
        store.create_run("local", dependent["id"])

    first_run = store.create_run("local", prerequisite["id"], "high")
    store.transition_run("local", first_run["id"], "running")
    approval = store.request_approval("local", first_run["id"], "Write a file", "high")
    assert store.get_run("local", first_run["id"])["status"] == "waiting_approval"
    store.decide_approval("local", approval["id"], "approved")
    assert store.get_run("local", first_run["id"])["status"] == "queued"


def test_webhook_secret_and_replay(store):
    created = store.create_task(
        "local",
        task_payload(trigger={"kind": "webhook", "timezone": "Europe/Rome", "enabled": True}),
    )
    trigger = created["trigger"]
    assert trigger["webhook_secret"]
    assert store.webhook_secret_matches(trigger["public_id"], trigger["webhook_secret"])
    store.remember_webhook_nonce(trigger["public_id"], "nonce-1", "2000-01-01T00:00:00Z")
    with pytest.raises(TaskStoreError, match="already used"):
        store.remember_webhook_nonce(trigger["public_id"], "nonce-1", "2000-01-01T00:00:00Z")


def test_rest_contract_and_webhook(monkeypatch, store):
    monkeypatch.setattr(task_router_module, "task_store", store)
    app = FastAPI()
    app.include_router(task_router)
    app.include_router(task_webhook_router)
    client = TestClient(app)

    response = client.post(
        "/api/tasks/v1/tasks",
        headers={"Idempotency-Key": "api-create-1"},
        json={
            **task_payload(
                due_at="2027-01-01T00:00:00Z",
                trigger={"kind": "webhook", "timezone": "Europe/Rome", "enabled": True},
            )
        },
    )
    assert response.status_code == 201, response.text
    created = response.json()["data"]
    assert client.get("/api/tasks/v1/dashboard").status_code == 200
    assert client.patch(
        f"/api/tasks/v1/tasks/{created['id']}",
        headers={"If-Match": str(created["version"])},
        json={"priority": "high"},
    ).status_code == 200

    trigger = created["trigger"]
    headers = {
        "X-Astra-Webhook-Token": trigger["webhook_secret"],
        "X-Astra-Webhook-Timestamp": str(int(datetime.now(timezone.utc).timestamp())),
        "X-Astra-Webhook-Nonce": "api-nonce-1",
    }
    accepted = client.post(f"/api/tasks/v1/hooks/{trigger['public_id']}", headers=headers, json={"source": "test"})
    assert accepted.status_code == 202, accepted.text
    replay = client.post(f"/api/tasks/v1/hooks/{trigger['public_id']}", headers=headers, json={"source": "test"})
    assert replay.status_code == 409
