from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from .orchestrator import task_orchestrator
from .schemas import ApprovalDecision, InternalEvent, AegisTaskProposal, TaskCreate, TaskPatch
from .store import TaskStoreError, task_store, utc_now


def require_task_owner(request: Request) -> str:
    mode = os.getenv("ASTRA_TASK_MODE", "local").strip().lower()
    if mode == "local":
        return os.getenv("ASTRA_LOCAL_TASK_OWNER", "local")
    if mode != "authenticated":
        raise HTTPException(503, detail={"error": {"code": "TASK_MODE_INVALID", "message": "Tasks access mode is invalid."}})
    principal = getattr(request.state, "user", None)
    owner = principal.get("id") if isinstance(principal, dict) else getattr(principal, "id", None)
    if not owner:
        raise HTTPException(401, detail={"error": {"code": "AUTH_REQUIRED", "message": "Sign in to use Tasks."}})
    return str(owner)


task_router = APIRouter(prefix="/api/tasks/v1", tags=["tasks"])
task_webhook_router = APIRouter(prefix="/api/tasks/v1/hooks", tags=["task-webhooks"])


def envelope(data: Any, **meta: Any) -> dict:
    return {"data": data, "meta": {"request_id": str(uuid.uuid4()), "server_time": utc_now(), **meta}}


def fail(exc: TaskStoreError):
    raise HTTPException(
        exc.status_code,
        detail={"error": {"code": exc.code, "message": str(exc), "details": {}, "request_id": str(uuid.uuid4()), "retryable": exc.status_code >= 500}},
    ) from exc


def expected_version(value: Optional[str]) -> int | None:
    if not value:
        return None
    try:
        return int(value.strip('W/"'))
    except ValueError as exc:
        raise HTTPException(400, detail={"error": {"code": "INVALID_ETAG", "message": "If-Match must contain a numeric task version."}}) from exc


@task_router.get("/health")
def health(owner: str = Depends(require_task_owner)):
    task_store.initialize()
    return envelope({"status": "ready", "schema_version": task_store.SCHEMA_VERSION, "owner": owner})


@task_router.get("/dashboard")
def dashboard(owner: str = Depends(require_task_owner)):
    return envelope(task_store.dashboard(owner))


@task_router.get("/tasks")
def list_tasks(
    status: str = Query(default="", max_length=40),
    q: str = Query(default="", max_length=240),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    owner: str = Depends(require_task_owner),
):
    return envelope(task_store.list_tasks(owner, status=status, query=q, limit=limit, offset=offset))


@task_router.post("/tasks", status_code=201)
def create_task(
    payload: TaskCreate,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    owner: str = Depends(require_task_owner),
):
    try:
        task = task_store.create_task(owner, payload.model_dump(), idempotency_key=idempotency_key)
        task_orchestrator.wake()
        return envelope(task)
    except TaskStoreError as exc:
        fail(exc)


@task_router.get("/tasks/{task_id}")
def get_task(task_id: str, owner: str = Depends(require_task_owner)):
    try:
        return envelope(task_store.get_task(owner, task_id))
    except TaskStoreError as exc:
        fail(exc)


@task_router.patch("/tasks/{task_id}")
def patch_task(
    task_id: str,
    payload: TaskPatch,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    owner: str = Depends(require_task_owner),
):
    try:
        return envelope(task_store.update_task(owner, task_id, payload.model_dump(exclude_none=True), expected_version(if_match)))
    except TaskStoreError as exc:
        fail(exc)


@task_router.delete("/tasks/{task_id}")
def delete_task(task_id: str, owner: str = Depends(require_task_owner)):
    try:
        return envelope(task_store.delete_task(owner, task_id))
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/tasks/{task_id}/run", status_code=202)
def run_task(task_id: str, owner: str = Depends(require_task_owner)):
    try:
        task = task_store.get_task(owner, task_id)
        risk = "high" if task["kind"] == "action" else "low"
        run = task_store.create_run(owner, task_id, risk)
        task_orchestrator.wake()
        return envelope(run)
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/runs/{run_id}/pause")
def pause_run(run_id: str, owner: str = Depends(require_task_owner)):
    try:
        run = task_store.get_run(owner, run_id)
        if run["status"] == "paused":
            return envelope(run)
        return envelope(task_store.transition_run(owner, run_id, "pausing", message="Pause requested"))
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/runs/{run_id}/resume")
def resume_run(run_id: str, owner: str = Depends(require_task_owner)):
    try:
        run = task_store.transition_run(owner, run_id, "queued", message="Run resumed")
        task_orchestrator.wake()
        return envelope(run)
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/runs/{run_id}/cancel")
def cancel_run(run_id: str, owner: str = Depends(require_task_owner)):
    try:
        run = task_store.get_run(owner, run_id)
        if run["status"] == "cancelled":
            return envelope(run)
        return envelope(task_store.transition_run(owner, run_id, "cancelled", message="Run cancelled"))
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/runs/{run_id}/retry", status_code=202)
def retry_run(run_id: str, owner: str = Depends(require_task_owner)):
    try:
        run = task_store.retry_run(owner, run_id)
        task_orchestrator.wake()
        return envelope(run)
    except TaskStoreError as exc:
        fail(exc)


@task_router.get("/runs/{run_id}")
def get_run(run_id: str, owner: str = Depends(require_task_owner)):
    try:
        return envelope(task_store.get_run(owner, run_id))
    except TaskStoreError as exc:
        fail(exc)


@task_router.get("/activity")
def activity(
    cursor: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    task_id: Optional[str] = None,
    owner: str = Depends(require_task_owner),
):
    return envelope(task_store.list_activity(owner, cursor=cursor, limit=limit, task_id=task_id), next_cursor=task_store.change_token(owner))


@task_router.get("/changes")
async def changes(request: Request, cursor: int = Query(default=0, ge=0), owner: str = Depends(require_task_owner)):
    async def stream():
        token = max(cursor, task_store.change_token(owner))
        yield f"event: ready\ndata: {json.dumps({'cursor': token})}\n\n"
        while not await request.is_disconnected():
            await asyncio.sleep(1.5)
            next_token = await asyncio.to_thread(task_store.change_token, owner)
            if next_token != token:
                events = await asyncio.to_thread(task_store.list_activity, owner, cursor=token, limit=200)
                token = next_token
                yield f"id: {token}\nevent: task-change\ndata: {json.dumps({'cursor': token, 'events': events})}\n\n"
            else:
                yield ": keep-alive\n\n"
    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@task_router.get("/approvals")
def approvals(owner: str = Depends(require_task_owner)):
    return envelope(task_store.list_pending_approvals(owner))


@task_router.post("/approvals/{approval_id}/decision")
def decide_approval(approval_id: str, payload: ApprovalDecision, owner: str = Depends(require_task_owner)):
    try:
        result = task_store.decide_approval(owner, approval_id, payload.decision, payload.note)
        task_orchestrator.wake()
        return envelope(result)
    except TaskStoreError as exc:
        fail(exc)


@task_router.post("/events", status_code=202)
def consume_event(payload: InternalEvent, owner: str = Depends(require_task_owner)):
    runs = task_store.consume_event(owner, payload.name, payload.payload)
    task_orchestrator.wake()
    return envelope({"accepted": True, "queued_runs": runs, "correlation_id": payload.correlation_id})


@task_router.post("/aegis/proposals", status_code=201)
def aegis_proposal(payload: AegisTaskProposal, owner: str = Depends(require_task_owner)):
    try:
        data = payload.model_dump(exclude={"correlation_id", "risk_class", "source"})
        task = task_store.create_task(owner, data, source=payload.source, correlation_id=payload.correlation_id)
        if task["lifecycle"] == "active" and task["trigger"]["kind"] == "manual":
            task_store.create_run(owner, task["id"], payload.risk_class)
            task_orchestrator.wake()
            task = task_store.get_task(owner, task["id"])
        return envelope(task, correlation_id=payload.correlation_id)
    except TaskStoreError as exc:
        fail(exc)


@task_webhook_router.post("/{public_id}", status_code=202)
async def webhook(
    public_id: str,
    request: Request,
    token: str = Header(default="", alias="X-Astra-Webhook-Token"),
    timestamp: str = Header(default="", alias="X-Astra-Webhook-Timestamp"),
    nonce: str = Header(default="", alias="X-Astra-Webhook-Nonce"),
):
    body = await request.body()
    if len(body) > 256 * 1024:
        raise HTTPException(413, detail={"error": {"code": "WEBHOOK_TOO_LARGE", "message": "Webhook bodies are limited to 256 KB."}})
    try:
        trigger = task_store.webhook_trigger(public_id)
        if not token or not task_store.webhook_secret_matches(public_id, token):
            raise HTTPException(401, detail={"error": {"code": "WEBHOOK_AUTH_FAILED", "message": "Webhook token is invalid."}})
        try:
            sent_at = datetime.fromtimestamp(int(timestamp), timezone.utc)
        except (TypeError, ValueError, OSError) as exc:
            raise HTTPException(400, detail={"error": {"code": "WEBHOOK_TIMESTAMP_INVALID", "message": "Webhook timestamp is invalid."}}) from exc
        now = datetime.now(timezone.utc)
        if abs((now - sent_at).total_seconds()) > 300:
            raise HTTPException(401, detail={"error": {"code": "WEBHOOK_EXPIRED", "message": "Webhook timestamp is outside the five-minute window."}})
        if not nonce or len(nonce) > 200:
            raise HTTPException(400, detail={"error": {"code": "WEBHOOK_NONCE_INVALID", "message": "A unique nonce is required."}})
        cutoff = (now - timedelta(minutes=10)).isoformat().replace("+00:00", "Z")
        task_store.remember_webhook_nonce(public_id, nonce, cutoff)
        payload = json.loads(body or b"{}")
        run = task_store.create_run(trigger["owner_id"], trigger["task_id"])
        task_orchestrator.wake()
        return envelope({"accepted": True, "run": run, "payload_received": bool(payload)})
    except TaskStoreError as exc:
        fail(exc)
