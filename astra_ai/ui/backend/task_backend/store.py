from __future__ import annotations

import hashlib
import json
import re
import secrets
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


JSON_FIELDS = {
    "tags", "checklist", "dependency_ids", "metadata", "filters", "payload",
    "result", "details",
}


def decode(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    item = dict(row)
    for key in JSON_FIELDS:
        if key in item and isinstance(item[key], str):
            try:
                item[key] = json.loads(item[key])
            except json.JSONDecodeError:
                pass
    for key in ("enabled", "deleted"):
        if key in item:
            item[key] = bool(item[key])
    return item


class TaskStoreError(RuntimeError):
    def __init__(self, message: str, status_code: int = 400, code: str = "TASK_ERROR"):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class TaskStore:
    SCHEMA_VERSION = 1
    RUN_TERMINAL = {"succeeded", "failed", "cancelled"}
    RUN_TRANSITIONS = {
        "queued": {"running", "cancelled"},
        "running": {"pausing", "waiting_approval", "waiting_input", "succeeded", "failed", "cancelled", "interrupted"},
        "pausing": {"paused", "running", "cancelled"},
        "paused": {"queued", "cancelled"},
        "waiting_approval": {"queued", "cancelled", "failed"},
        "waiting_input": {"queued", "cancelled", "failed"},
        "interrupted": {"queued", "cancelled", "failed"},
        "failed": {"queued"},
        "succeeded": set(),
        "cancelled": set(),
    }

    def __init__(self, root: Path):
        self.root = root
        self.path = root / "tasks.sqlite3"
        self._lock = threading.RLock()
        self._initialized = False

    @contextmanager
    def connection(self):
        self.root.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.path, timeout=5, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA synchronous=NORMAL")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def initialize(self) -> None:
        with self._lock, self.connection() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS task_meta (
                    key TEXT PRIMARY KEY, value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL,
                    title TEXT NOT NULL, instruction TEXT NOT NULL,
                    kind TEXT NOT NULL, lifecycle TEXT NOT NULL,
                    priority TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]',
                    project TEXT NOT NULL DEFAULT '', due_at TEXT, timezone TEXT NOT NULL,
                    checklist TEXT NOT NULL DEFAULT '[]',
                    dependency_ids TEXT NOT NULL DEFAULT '[]',
                    metadata TEXT NOT NULL DEFAULT '{}',
                    source TEXT NOT NULL DEFAULT 'manual', correlation_id TEXT,
                    version INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_task_correlation
                    ON tasks(owner_id, correlation_id) WHERE correlation_id IS NOT NULL;
                CREATE INDEX IF NOT EXISTS idx_task_owner_state
                    ON tasks(owner_id, lifecycle, updated_at DESC);
                CREATE TABLE IF NOT EXISTS task_triggers (
                    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                    owner_id TEXT NOT NULL, kind TEXT NOT NULL, schedule TEXT,
                    event_name TEXT, every_count INTEGER, event_count INTEGER NOT NULL DEFAULT 0,
                    filters TEXT NOT NULL DEFAULT '{}', timezone TEXT NOT NULL,
                    enabled INTEGER NOT NULL DEFAULT 1, next_fire_at TEXT,
                    last_fired_at TEXT, public_id TEXT UNIQUE, secret_hash TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_trigger_due
                    ON task_triggers(enabled, next_fire_at);
                CREATE INDEX IF NOT EXISTS idx_trigger_event
                    ON task_triggers(enabled, event_name);
                CREATE TABLE IF NOT EXISTS task_runs (
                    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id),
                    owner_id TEXT NOT NULL, status TEXT NOT NULL, attempt INTEGER NOT NULL,
                    progress INTEGER NOT NULL DEFAULT 0, current_step TEXT NOT NULL DEFAULT '',
                    risk_class TEXT NOT NULL DEFAULT 'low', result TEXT,
                    error TEXT, lease_until TEXT, started_at TEXT, finished_at TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_run
                    ON task_runs(task_id) WHERE status IN
                    ('queued','running','pausing','paused','waiting_approval','waiting_input');
                CREATE INDEX IF NOT EXISTS idx_run_owner_status
                    ON task_runs(owner_id, status, created_at);
                CREATE TABLE IF NOT EXISTS task_run_events (
                    cursor INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
                    owner_id TEXT NOT NULL, task_id TEXT NOT NULL, run_id TEXT,
                    type TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
                    payload TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_event_owner_cursor
                    ON task_run_events(owner_id, cursor);
                CREATE TABLE IF NOT EXISTS task_approvals (
                    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, task_id TEXT NOT NULL,
                    run_id TEXT NOT NULL REFERENCES task_runs(id) ON DELETE CASCADE,
                    action TEXT NOT NULL, risk_class TEXT NOT NULL,
                    details TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
                    note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
                    decided_at TEXT
                );
                CREATE TABLE IF NOT EXISTS task_artifacts (
                    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, task_id TEXT NOT NULL,
                    run_id TEXT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL,
                    uri TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS task_idempotency (
                    owner_id TEXT NOT NULL, key TEXT NOT NULL, operation TEXT NOT NULL,
                    resource_id TEXT NOT NULL, created_at TEXT NOT NULL,
                    PRIMARY KEY(owner_id, key, operation)
                );
                CREATE TABLE IF NOT EXISTS task_webhook_nonces (
                    public_id TEXT NOT NULL, nonce TEXT NOT NULL, created_at TEXT NOT NULL,
                    PRIMARY KEY(public_id, nonce)
                );
                """
            )
            conn.execute(
                "INSERT OR REPLACE INTO task_meta(key,value) VALUES('schema_version',?)",
                (str(self.SCHEMA_VERSION),),
            )
            self._initialized = True

    def _ensure(self) -> None:
        if not self._initialized:
            self.initialize()

    def _event(self, conn, owner: str, task_id: str, event_type: str, message: str = "", run_id: str | None = None, payload: dict | None = None) -> None:
        conn.execute(
            "INSERT INTO task_run_events(id,owner_id,task_id,run_id,type,message,payload,created_at) VALUES(?,?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), owner, task_id, run_id, event_type, message, _json(payload or {}), utc_now()),
        )

    def _task_row(self, conn, owner: str, task_id: str) -> sqlite3.Row:
        row = conn.execute(
            "SELECT * FROM tasks WHERE id=? AND owner_id=? AND deleted_at IS NULL",
            (task_id, owner),
        ).fetchone()
        if not row:
            raise TaskStoreError("Task not found.", 404, "TASK_NOT_FOUND")
        return row

    def create_task(self, owner: str, data: dict, *, idempotency_key: str | None = None, source: str = "manual", correlation_id: str | None = None) -> dict:
        self._ensure()
        with self._lock, self.connection() as conn:
            if idempotency_key:
                previous = conn.execute(
                    "SELECT resource_id FROM task_idempotency WHERE owner_id=? AND key=? AND operation='create_task'",
                    (owner, idempotency_key),
                ).fetchone()
                if previous:
                    return self._get_task_with_conn(conn, owner, previous[0])
            if correlation_id:
                previous = conn.execute(
                    "SELECT id FROM tasks WHERE owner_id=? AND correlation_id=? AND deleted_at IS NULL",
                    (owner, correlation_id),
                ).fetchone()
                if previous:
                    return self._get_task_with_conn(conn, owner, previous[0])

            task_id, now = str(uuid.uuid4()), utc_now()
            self._validate_dependencies(conn, owner, data.get("dependency_ids", []))
            conn.execute(
                """INSERT INTO tasks(
                    id,owner_id,title,instruction,kind,lifecycle,priority,tags,project,
                    due_at,timezone,checklist,dependency_ids,metadata,source,correlation_id,
                    created_at,updated_at
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    task_id, owner, data["title"], data["instruction"], data["kind"],
                    data.get("lifecycle", "active"), data["priority"], _json(data.get("tags", [])),
                    data.get("project", ""), _iso(data.get("due_at")), data["timezone"],
                    _json(data.get("checklist", [])), _json(data.get("dependency_ids", [])),
                    _json(data.get("metadata", {})), source, correlation_id, now, now,
                ),
            )
            _, webhook_secret = self._replace_trigger(conn, owner, task_id, data.get("trigger") or {"kind": "manual"})
            self._event(conn, owner, task_id, "task.created", f"Created {data['title']}")
            if idempotency_key:
                conn.execute(
                    "INSERT INTO task_idempotency(owner_id,key,operation,resource_id,created_at) VALUES(?,?,?,?,?)",
                    (owner, idempotency_key, "create_task", task_id, now),
                )
            created = self._get_task_with_conn(conn, owner, task_id)
            if webhook_secret and created.get("trigger"):
                created["trigger"]["webhook_secret"] = webhook_secret
            return created

    def _replace_trigger(self, conn, owner: str, task_id: str, trigger: dict) -> tuple[dict, str | None]:
        conn.execute("DELETE FROM task_triggers WHERE task_id=? AND owner_id=?", (task_id, owner))
        trigger_id, now = str(uuid.uuid4()), utc_now()
        public_id = str(uuid.uuid4()) if trigger.get("kind") == "webhook" else None
        raw_secret = secrets.token_urlsafe(32) if public_id else None
        secret_hash = hashlib.sha256(raw_secret.encode()).hexdigest() if raw_secret else None
        conn.execute(
            """INSERT INTO task_triggers(
                id,task_id,owner_id,kind,schedule,event_name,every_count,filters,
                timezone,enabled,next_fire_at,public_id,secret_hash,created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                trigger_id, task_id, owner, trigger.get("kind", "manual"),
                trigger.get("schedule"), trigger.get("event_name"), trigger.get("every_count"),
                _json(trigger.get("filters", {})), trigger.get("timezone", "Europe/Rome"),
                int(trigger.get("enabled", True)), _iso(trigger.get("next_fire_at")) or next_schedule_fire(trigger.get("schedule"), trigger.get("timezone")),
                public_id, secret_hash, now, now,
            ),
        )
        row = decode(conn.execute("SELECT * FROM task_triggers WHERE id=?", (trigger_id,)).fetchone())
        if row:
            row.pop("secret_hash", None)
            if raw_secret:
                row["webhook_secret"] = raw_secret
        return row or {}, raw_secret

    def _get_task_with_conn(self, conn, owner: str, task_id: str) -> dict:
        task = decode(self._task_row(conn, owner, task_id))
        trigger = decode(conn.execute(
            "SELECT * FROM task_triggers WHERE task_id=? AND owner_id=?", (task_id, owner)
        ).fetchone())
        if trigger:
            trigger.pop("secret_hash", None)
        latest_run = decode(conn.execute(
            "SELECT * FROM task_runs WHERE task_id=? AND owner_id=? ORDER BY created_at DESC LIMIT 1",
            (task_id, owner),
        ).fetchone())
        task["trigger"] = trigger
        task["latest_run"] = latest_run
        return task

    def get_task(self, owner: str, task_id: str) -> dict:
        self._ensure()
        with self.connection() as conn:
            return self._get_task_with_conn(conn, owner, task_id)

    def list_tasks(self, owner: str, *, status: str = "", query: str = "", limit: int = 100, offset: int = 0) -> list[dict]:
        self._ensure()
        clauses, params = ["owner_id=?", "deleted_at IS NULL"], [owner]
        if status:
            clauses.append("lifecycle=?")
            params.append(status)
        if query:
            clauses.append("(title LIKE ? OR instruction LIKE ? OR tags LIKE ? OR project LIKE ?)")
            value = f"%{query}%"
            params.extend([value] * 4)
        params.extend([max(1, min(limit, 500)), max(0, offset)])
        with self.connection() as conn:
            rows = conn.execute(
                f"SELECT id FROM tasks WHERE {' AND '.join(clauses)} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                tuple(params),
            ).fetchall()
            return [self._get_task_with_conn(conn, owner, row["id"]) for row in rows]

    def update_task(self, owner: str, task_id: str, patch: dict, expected_version: int | None = None) -> dict:
        self._ensure()
        allowed = {
            "title", "instruction", "kind", "lifecycle", "priority", "project",
            "due_at", "timezone", "tags", "checklist", "dependency_ids", "metadata",
        }
        with self._lock, self.connection() as conn:
            current = self._task_row(conn, owner, task_id)
            if expected_version is not None and current["version"] != expected_version:
                raise TaskStoreError("Task was changed by another client.", 409, "VERSION_CONFLICT")
            if "dependency_ids" in patch:
                self._validate_dependencies(conn, owner, patch["dependency_ids"], task_id)
            values = {}
            for key, value in patch.items():
                if key not in allowed:
                    continue
                if key in {"tags", "checklist", "dependency_ids", "metadata"}:
                    value = _json(value)
                if key == "due_at":
                    value = _iso(value)
                values[key] = value
            if values:
                values["updated_at"] = utc_now()
                assignments = ",".join(f"{key}=?" for key in values)
                conn.execute(
                    f"UPDATE tasks SET {assignments},version=version+1 WHERE id=? AND owner_id=?",
                    (*values.values(), task_id, owner),
                )
            if patch.get("trigger") is not None:
                self._replace_trigger(conn, owner, task_id, patch["trigger"])
            self._event(conn, owner, task_id, "task.updated", "Task updated")
            return self._get_task_with_conn(conn, owner, task_id)

    def _validate_dependencies(self, conn, owner: str, dependency_ids: list[str], task_id: str | None = None) -> None:
        unique = list(dict.fromkeys(dependency_ids))
        if task_id and task_id in unique:
            raise TaskStoreError("A task cannot depend on itself.", 422, "DEPENDENCY_CYCLE")
        for dependency_id in unique:
            if not conn.execute(
                "SELECT 1 FROM tasks WHERE id=? AND owner_id=? AND deleted_at IS NULL",
                (dependency_id, owner),
            ).fetchone():
                raise TaskStoreError("A dependency task was not found.", 422, "DEPENDENCY_NOT_FOUND")
        if not task_id:
            return
        pending = list(unique)
        seen: set[str] = set()
        while pending:
            current = pending.pop()
            if current == task_id:
                raise TaskStoreError("Task dependencies contain a cycle.", 422, "DEPENDENCY_CYCLE")
            if current in seen:
                continue
            seen.add(current)
            row = conn.execute(
                "SELECT dependency_ids FROM tasks WHERE id=? AND owner_id=? AND deleted_at IS NULL",
                (current, owner),
            ).fetchone()
            if row:
                pending.extend(json.loads(row[0] or "[]"))

    def delete_task(self, owner: str, task_id: str) -> dict:
        self._ensure()
        with self._lock, self.connection() as conn:
            self._task_row(conn, owner, task_id)
            now = utc_now()
            conn.execute(
                "UPDATE tasks SET deleted_at=?,lifecycle='archived',updated_at=?,version=version+1 WHERE id=? AND owner_id=?",
                (now, now, task_id, owner),
            )
            self._event(conn, owner, task_id, "task.deleted", "Task moved to trash")
        return {"deleted_id": task_id}

    def create_run(self, owner: str, task_id: str, risk_class: str = "low") -> dict:
        self._ensure()
        with self._lock, self.connection() as conn:
            task = self._task_row(conn, owner, task_id)
            blockers = json.loads(task["dependency_ids"] or "[]")
            for dependency_id in blockers:
                dependency = conn.execute(
                    "SELECT lifecycle FROM tasks WHERE id=? AND owner_id=? AND deleted_at IS NULL",
                    (dependency_id, owner),
                ).fetchone()
                if not dependency or dependency[0] != "completed":
                    raise TaskStoreError("Task dependencies are not complete.", 409, "DEPENDENCY_BLOCKED")
            live = conn.execute(
                "SELECT * FROM task_runs WHERE task_id=? AND owner_id=? AND status IN ('queued','running','pausing','paused','waiting_approval','waiting_input')",
                (task_id, owner),
            ).fetchone()
            if live:
                return decode(live)
            attempt = conn.execute(
                "SELECT COALESCE(MAX(attempt),0)+1 FROM task_runs WHERE task_id=?",
                (task_id,),
            ).fetchone()[0]
            run_id, now = str(uuid.uuid4()), utc_now()
            conn.execute(
                """INSERT INTO task_runs(
                    id,task_id,owner_id,status,attempt,risk_class,created_at,updated_at
                ) VALUES(?,?,?,?,?,?,?,?)""",
                (run_id, task_id, owner, "queued", attempt, risk_class, now, now),
            )
            self._event(conn, owner, task_id, "run.queued", "Task queued", run_id, {"attempt": attempt})
            return decode(conn.execute("SELECT * FROM task_runs WHERE id=?", (run_id,)).fetchone())

    def get_run(self, owner: str, run_id: str) -> dict:
        self._ensure()
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM task_runs WHERE id=? AND owner_id=?", (run_id, owner)).fetchone()
        if not row:
            raise TaskStoreError("Run not found.", 404, "RUN_NOT_FOUND")
        return decode(row)

    def transition_run(self, owner: str, run_id: str, target: str, *, message: str = "", progress: int | None = None, current_step: str | None = None, result: dict | None = None, error: str | None = None) -> dict:
        self._ensure()
        with self._lock, self.connection() as conn:
            row = conn.execute("SELECT * FROM task_runs WHERE id=? AND owner_id=?", (run_id, owner)).fetchone()
            if not row:
                raise TaskStoreError("Run not found.", 404, "RUN_NOT_FOUND")
            current = row["status"]
            if target != current and target not in self.RUN_TRANSITIONS.get(current, set()):
                raise TaskStoreError(f"Cannot move run from {current} to {target}.", 409, "INVALID_RUN_TRANSITION")
            values: dict[str, Any] = {"status": target, "updated_at": utc_now()}
            if progress is not None:
                if progress < row["progress"]:
                    raise TaskStoreError("Progress cannot move backwards.", 409, "INVALID_PROGRESS")
                values["progress"] = max(0, min(progress, 100))
            if current_step is not None:
                values["current_step"] = current_step[:1000]
            if target == "running" and not row["started_at"]:
                values["started_at"] = utc_now()
            if target in self.RUN_TERMINAL:
                values["finished_at"] = utc_now()
                values["progress"] = 100 if target == "succeeded" else row["progress"]
            if result is not None:
                values["result"] = _json(result)
            if error is not None:
                values["error"] = error[:5000]
            assignments = ",".join(f"{key}=?" for key in values)
            conn.execute(f"UPDATE task_runs SET {assignments} WHERE id=?", (*values.values(), run_id))
            event_type = f"run.{target}"
            self._event(conn, owner, row["task_id"], event_type, message or target.replace("_", " ").title(), run_id, {"progress": values.get("progress", row["progress"]), "current_step": values.get("current_step", row["current_step"])})
            if target == "succeeded":
                conn.execute("UPDATE tasks SET lifecycle='completed',updated_at=?,version=version+1 WHERE id=?", (utc_now(), row["task_id"]))
            return decode(conn.execute("SELECT * FROM task_runs WHERE id=?", (run_id,)).fetchone())

    def retry_run(self, owner: str, run_id: str) -> dict:
        run = self.get_run(owner, run_id)
        if run["status"] not in {"failed", "cancelled", "interrupted"}:
            raise TaskStoreError("Only failed, cancelled, or interrupted runs can be retried.", 409, "RUN_NOT_RETRYABLE")
        return self.create_run(owner, run["task_id"], run["risk_class"])

    def next_queued_run(self) -> dict | None:
        self._ensure()
        with self._lock, self.connection() as conn:
            active = conn.execute("SELECT 1 FROM task_runs WHERE status='running' LIMIT 1").fetchone()
            if active:
                return None
            row = conn.execute("SELECT * FROM task_runs WHERE status='queued' ORDER BY created_at LIMIT 1").fetchone()
            if not row:
                return None
            conn.execute(
                "UPDATE task_runs SET status='running',started_at=COALESCE(started_at,?),updated_at=? WHERE id=? AND status='queued'",
                (utc_now(), utc_now(), row["id"]),
            )
            updated = conn.execute("SELECT * FROM task_runs WHERE id=?", (row["id"],)).fetchone()
            self._event(conn, row["owner_id"], row["task_id"], "run.running", "Aegis started working", row["id"])
            return decode(updated)

    def request_approval(self, owner: str, run_id: str, action: str, risk_class: str, details: dict | None = None) -> dict:
        run = self.get_run(owner, run_id)
        approval_id, now = str(uuid.uuid4()), utc_now()
        with self._lock, self.connection() as conn:
            conn.execute(
                "INSERT INTO task_approvals(id,owner_id,task_id,run_id,action,risk_class,details,created_at) VALUES(?,?,?,?,?,?,?,?)",
                (approval_id, owner, run["task_id"], run_id, action[:500], risk_class, _json(details or {}), now),
            )
        self.transition_run(owner, run_id, "waiting_approval", message="Approval required")
        with self.connection() as conn:
            return decode(conn.execute("SELECT * FROM task_approvals WHERE id=?", (approval_id,)).fetchone())

    def decide_approval(self, owner: str, approval_id: str, decision: str, note: str = "") -> dict:
        self._ensure()
        with self._lock, self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM task_approvals WHERE id=? AND owner_id=?", (approval_id, owner)
            ).fetchone()
            if not row:
                raise TaskStoreError("Approval not found.", 404, "APPROVAL_NOT_FOUND")
            if row["status"] != "pending":
                raise TaskStoreError("Approval was already decided.", 409, "APPROVAL_DECIDED")
            conn.execute(
                "UPDATE task_approvals SET status=?,note=?,decided_at=? WHERE id=?",
                (decision, note, utc_now(), approval_id),
            )
            if decision == "approved":
                conn.execute(
                    "UPDATE task_runs SET risk_class='low',updated_at=? WHERE id=?",
                    (utc_now(), row["run_id"]),
                )
            updated = decode(conn.execute("SELECT * FROM task_approvals WHERE id=?", (approval_id,)).fetchone())
        self.transition_run(owner, row["run_id"], "queued" if decision == "approved" else "cancelled", message=f"Approval {decision}")
        return updated

    def list_activity(self, owner: str, *, cursor: int = 0, limit: int = 100, task_id: str | None = None) -> list[dict]:
        self._ensure()
        clauses, params = ["e.owner_id=?", "e.cursor>?", "t.deleted_at IS NULL"], [owner, max(0, cursor)]
        if task_id:
            clauses.append("e.task_id=?")
            params.append(task_id)
        params.append(max(1, min(limit, 500)))
        with self.connection() as conn:
            rows = conn.execute(
                f"""SELECT e.* FROM task_run_events e
                    JOIN tasks t ON t.id=e.task_id AND t.owner_id=e.owner_id
                    WHERE {' AND '.join(clauses)} ORDER BY e.cursor LIMIT ?""",
                tuple(params),
            ).fetchall()
        return [decode(row) for row in rows]

    def change_token(self, owner: str) -> int:
        self._ensure()
        with self.connection() as conn:
            return int(conn.execute(
                """SELECT COALESCE(MAX(e.cursor),0) FROM task_run_events e
                   JOIN tasks t ON t.id=e.task_id AND t.owner_id=e.owner_id
                   WHERE e.owner_id=? AND t.deleted_at IS NULL""",
                (owner,),
            ).fetchone()[0])

    def list_pending_approvals(self, owner: str) -> list[dict]:
        self._ensure()
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM task_approvals WHERE owner_id=? AND status='pending' ORDER BY created_at",
                (owner,),
            ).fetchall()
        return [decode(row) for row in rows]

    def active_runs(self, owner: str) -> list[dict]:
        self._ensure()
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM task_runs WHERE owner_id=? AND status IN ('queued','running','pausing','paused','waiting_approval','waiting_input') ORDER BY created_at",
                (owner,),
            ).fetchall()
        return [decode(row) for row in rows]

    def dashboard(self, owner: str) -> dict:
        tasks = self.list_tasks(owner, limit=200)
        return {
            "tasks": tasks,
            "active_runs": self.active_runs(owner),
            "approvals": self.list_pending_approvals(owner),
            "activity": self.list_activity(owner, cursor=max(0, self.change_token(owner) - 30), limit=30),
            "counts": {
                "total": len(tasks),
                "active": sum(task["lifecycle"] == "active" for task in tasks),
                "completed": sum(task["lifecycle"] == "completed" for task in tasks),
                "waiting": len(self.list_pending_approvals(owner)),
            },
        }

    def interrupt_running(self) -> int:
        self._ensure()
        with self._lock, self.connection() as conn:
            rows = conn.execute("SELECT * FROM task_runs WHERE status IN ('running','pausing')").fetchall()
            for row in rows:
                conn.execute(
                    "UPDATE task_runs SET status='interrupted',updated_at=?,error=? WHERE id=?",
                    (utc_now(), "Backend restarted while the task was running.", row["id"]),
                )
                self._event(conn, row["owner_id"], row["task_id"], "run.interrupted", "Run interrupted by restart", row["id"])
            return len(rows)

    def webhook_trigger(self, public_id: str) -> dict:
        self._ensure()
        with self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM task_triggers WHERE public_id=? AND enabled=1 AND kind='webhook'",
                (public_id,),
            ).fetchone()
        if not row:
            raise TaskStoreError("Webhook trigger not found.", 404, "WEBHOOK_NOT_FOUND")
        return decode(row)

    def remember_webhook_nonce(self, public_id: str, nonce: str, cutoff: str) -> None:
        self._ensure()
        with self._lock, self.connection() as conn:
            conn.execute("DELETE FROM task_webhook_nonces WHERE created_at<?", (cutoff,))
            try:
                conn.execute(
                    "INSERT INTO task_webhook_nonces(public_id,nonce,created_at) VALUES(?,?,?)",
                    (public_id, nonce, utc_now()),
                )
            except sqlite3.IntegrityError as exc:
                raise TaskStoreError("Webhook request was already used.", 409, "WEBHOOK_REPLAY") from exc

    def webhook_secret_matches(self, public_id: str, candidate: str) -> bool:
        self._ensure()
        with self.connection() as conn:
            row = conn.execute("SELECT secret_hash FROM task_triggers WHERE public_id=?", (public_id,)).fetchone()
        return bool(row and secrets.compare_digest(row[0], hashlib.sha256(candidate.encode()).hexdigest()))

    def due_triggers(self, now: str) -> list[dict]:
        self._ensure()
        with self.connection() as conn:
            rows = conn.execute(
                """SELECT * FROM task_triggers
                   WHERE enabled=1 AND kind='schedule' AND next_fire_at IS NOT NULL
                   AND next_fire_at<=? ORDER BY next_fire_at LIMIT 50""",
                (now,),
            ).fetchall()
        return [decode(row) for row in rows]

    def mark_trigger_fired(self, trigger_id: str, next_fire_at: str | None) -> None:
        self._ensure()
        with self._lock, self.connection() as conn:
            conn.execute(
                "UPDATE task_triggers SET last_fired_at=?,next_fire_at=?,updated_at=? WHERE id=?",
                (utc_now(), next_fire_at, utc_now(), trigger_id),
            )

    def consume_event(self, owner: str, name: str, payload: dict) -> list[dict]:
        self._ensure()
        queued: list[dict] = []
        with self._lock, self.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM task_triggers WHERE owner_id=? AND kind='event' AND enabled=1 AND event_name=?",
                (owner, name),
            ).fetchall()
            ready: list[tuple[str, str]] = []
            for row in rows:
                filters = json.loads(row["filters"] or "{}")
                if any(payload.get(key) != value for key, value in filters.items()):
                    continue
                count = int(row["event_count"]) + 1
                threshold = int(row["every_count"] or 1)
                conn.execute(
                    "UPDATE task_triggers SET event_count=?,updated_at=? WHERE id=?",
                    (count, utc_now(), row["id"]),
                )
                if count % threshold == 0:
                    ready.append((row["task_id"], row["id"]))
            for task_id, trigger_id in ready:
                self._event(conn, owner, task_id, "trigger.event", f"Triggered by {name}", payload={"trigger_id": trigger_id, "event": name})
        for task_id, _ in ready:
            queued.append(self.create_run(owner, task_id))
        return queued


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def next_schedule_fire(schedule: str | None, timezone_name: str | None = "Europe/Rome") -> str | None:
    if not schedule:
        return None
    try:
        zone = ZoneInfo(timezone_name or "Europe/Rome")
    except (ZoneInfoNotFoundError, ValueError):
        zone = timezone.utc
    now = datetime.now(zone)
    normalized = schedule.strip().lower()
    if normalized in {"hourly", "every hour"}:
        value = now + timedelta(hours=1)
    elif normalized in {"daily", "every day"}:
        value = now + timedelta(days=1)
    elif normalized in {"weekly", "every week"}:
        value = now + timedelta(weeks=1)
    else:
        clock = re.search(r"(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)", normalized)
        weekday_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        named_day = next((index for index, name in enumerate(weekday_names) if name in normalized), None)
        if clock and ("weekday" in normalized or named_day is not None or "daily" in normalized or "every day" in normalized):
            hour, minute = int(clock.group(1)), int(clock.group(2))
            value = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if "weekday" in normalized:
                while value <= now or value.weekday() >= 5:
                    value += timedelta(days=1)
            elif named_day is not None:
                days = (named_day - value.weekday()) % 7
                value += timedelta(days=days)
                if value <= now:
                    value += timedelta(weeks=1)
            elif value <= now:
                value += timedelta(days=1)
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        try:
            value = datetime.fromisoformat(schedule.replace("Z", "+00:00"))
            if value.tzinfo is None:
                value = value.replace(tzinfo=zone)
        except ValueError:
            return None
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


task_store = TaskStore(Path(__file__).resolve().parent.parent / "task_widget_data")
