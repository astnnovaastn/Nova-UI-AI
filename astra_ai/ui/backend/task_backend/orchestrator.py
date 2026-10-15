from __future__ import annotations

import asyncio
import inspect
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Optional

from .store import TaskStoreError, next_schedule_fire, task_store, utc_now


Executor = Callable[[dict, Callable[[int, str, dict | None], Awaitable[None]]], Any]


class TaskOrchestrator:
    """Single-concurrency durable dispatcher with cooperative control points."""

    def __init__(self):
        self._executor: Optional[Executor] = None
        self._runner: asyncio.Task | None = None
        self._stopping = asyncio.Event()
        self._wake = asyncio.Event()
        self._controls: dict[str, asyncio.Event] = {}

    def set_executor(self, executor: Optional[Executor]) -> None:
        self._executor = executor

    async def start(self) -> None:
        if self._runner and not self._runner.done():
            return
        task_store.initialize()
        task_store.interrupt_running()
        self._stopping.clear()
        self._runner = asyncio.create_task(self._loop(), name="astra-task-orchestrator")

    async def stop(self) -> None:
        self._stopping.set()
        self._wake.set()
        if self._runner:
            self._runner.cancel()
            try:
                await self._runner
            except asyncio.CancelledError:
                pass
        self._runner = None

    def wake(self) -> None:
        self._wake.set()

    async def _loop(self) -> None:
        while not self._stopping.is_set():
            try:
                await self._fire_schedules()
                for pending in await asyncio.to_thread(task_store.active_runs,'local'):
                    result=pending.get('result') or {}
                    if pending['status']=='waiting_input' and result.get('status')=='waiting_for_retry' and result.get('next_attempt',float('inf'))<=time.time():
                        await asyncio.to_thread(task_store.transition_run,'local',pending['id'],'queued',message='Retrying at the recorded budget checkpoint')
                run = await asyncio.to_thread(task_store.next_queued_run)
                if run:
                    await self._execute(run)
                    continue
                self._wake.clear()
                try:
                    await asyncio.wait_for(self._wake.wait(), timeout=2)
                except asyncio.TimeoutError:
                    pass
            except asyncio.CancelledError:
                raise
            except Exception:
                await asyncio.sleep(1)

    async def _fire_schedules(self) -> None:
        due = await asyncio.to_thread(task_store.due_triggers, utc_now())
        for trigger in due:
            try:
                await asyncio.to_thread(task_store.create_run, trigger["owner_id"], trigger["task_id"])
                next_fire = next_schedule_fire(trigger.get("schedule"), trigger.get("timezone"))
                await asyncio.to_thread(task_store.mark_trigger_fired, trigger["id"], next_fire)
            except TaskStoreError:
                continue

    async def _execute(self, run: dict) -> None:
        owner, run_id = run["owner_id"], run["id"]
        task = await asyncio.to_thread(task_store.get_task, owner, run["task_id"])
        if task["kind"] == "action" and run.get("risk_class", "low") in {"medium", "high", "critical"}:
            await asyncio.to_thread(
                task_store.request_approval,
                owner,
                run_id,
                "Run an action task",
                run["risk_class"],
                {"instruction": task["instruction"][:1000]},
            )
            return

        async def emit(progress: int, step: str, payload: dict | None = None) -> None:
            current = await asyncio.to_thread(task_store.get_run, owner, run_id)
            if current["status"] == "pausing":
                await asyncio.to_thread(task_store.transition_run, owner, run_id, "paused", message="Paused at a safe checkpoint")
                raise asyncio.CancelledError
            if current["status"] in {"paused", "cancelled"}:
                raise asyncio.CancelledError
            await asyncio.to_thread(
                task_store.transition_run,
                owner,
                run_id,
                "running",
                progress=progress,
                current_step=step,
                message=step,
                **({'result':payload} if payload else {}),
            )

        try:
            await emit(8, "Preparing Aegis task")
            if self._executor:
                result = self._executor({**task,'execution_run_id':run_id}, emit)
                if inspect.isawaitable(result):
                    result = await result
            else:
                await emit(45, "Processing instruction")
                await asyncio.sleep(0)
                result = {"summary": "Task processed by the local task orchestrator.", "instruction": task["instruction"]}
            current = await asyncio.to_thread(task_store.get_run, owner, run_id)
            if current["status"] == "running":
                state=(result or {}).get('status') if isinstance(result,dict) else None
                if state in {'waiting_for_retry','waiting_for_input'}:
                    await asyncio.to_thread(task_store.transition_run,owner,run_id,'waiting_input',result=result,current_step=result.get('reason','Waiting'),message=result.get('reason','Waiting'))
                    return
                if state in {'failed','canceled','cancelled'}:
                    await asyncio.to_thread(task_store.transition_run,owner,run_id,'failed' if state=='failed' else 'cancelled',result=result,error=result.get('reason'),message='Task did not complete')
                    return
                await asyncio.to_thread(
                    task_store.transition_run,
                    owner,
                    run_id,
                    "succeeded",
                    progress=100,
                    current_step="Complete",
                    result=result if isinstance(result, dict) else {"summary": str(result)},
                    message="Task completed",
                )
        except asyncio.CancelledError:
            return
        except Exception as exc:
            current = await asyncio.to_thread(task_store.get_run, owner, run_id)
            if current["status"] not in {"cancelled", "paused"}:
                await asyncio.to_thread(
                    task_store.transition_run,
                    owner,
                    run_id,
                    "failed",
                    error=str(exc),
                    message="Task failed",
                )


task_orchestrator = TaskOrchestrator()
