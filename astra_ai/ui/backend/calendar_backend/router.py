from __future__ import annotations

import asyncio
import io
import json
import os
import uuid
import threading
from collections import OrderedDict
from urllib.parse import urlparse
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response, StreamingResponse

from .quick_add import parse_quick_add
from .schemas import (
    CalendarCreate, CalendarPatch, EventInput, EventPatch, PreferencesPatch,
    QuickAddCommit, QuickAddRequest, SmartViewInput, TemplateInput,
)
from .store import CalendarStore, CalendarStoreError, utc_now

try:
    from icalendar import Calendar as ICalendar, Event as ICSEvent
except Exception:  # optional at import time; health endpoint reports availability
    ICalendar = None
    ICSEvent = None


def require_calendar_owner(request: Request) -> str:
    """Fail closed until Astra has a trusted, shared authenticated principal."""
    mode = os.getenv("ASTRA_CALENDAR_MODE", "local").strip().lower()
    if mode == "local":
        return os.getenv("ASTRA_LOCAL_CALENDAR_OWNER", "local")
    if mode != "authenticated":
        raise HTTPException(
            status_code=503,
            detail={"error": {"code": "CALENDAR_MODE_INVALID", "message": "Calendar access mode is not configured."}},
        )

    principal = getattr(request.state, "user", None)
    owner_id = (
        principal.get("id") if isinstance(principal, dict)
        else getattr(principal, "id", None)
    )
    if not owner_id:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "AUTH_REQUIRED", "message": "Sign in to use Calendar."}},
        )

    # The current SQLite store is still single-owner. Do not accidentally turn a
    # trusted identity into access to the shared local database.
    raise HTTPException(
        status_code=503,
        detail={
            "error": {
                "code": "CALENDAR_OWNER_STORAGE_PENDING",
                "message": "Per-user Calendar storage is not enabled on this server.",
            }
        },
    )


calendar_router = APIRouter(
    prefix="/api/calendar/v1",
    tags=["calendar"],
    dependencies=[Depends(require_calendar_owner)],
)
calendar_store = CalendarStore(Path(__file__).resolve().parent.parent / "calendar_widget_data")
_import_previews: dict[str, dict[str, Any]] = {}
_caldav_credentials: dict[str, str] = {}
_create_idempotency: OrderedDict[str, dict[str, Any]] = OrderedDict()
_create_idempotency_lock = threading.Lock()


def envelope(data: Any, **meta: Any) -> dict:
    return {"data": data, "meta": {"request_id": str(uuid.uuid4()), "server_time": utc_now(), **meta}}


def store_error(exc: CalendarStoreError):
    raise HTTPException(
        status_code=exc.status_code,
        detail={"error": {"code": exc.code, "message": str(exc), "details": {}, "request_id": str(uuid.uuid4()), "retryable": exc.status_code >= 500}},
    ) from exc


@calendar_router.get("/health")
def health():
    calendar_store.initialize()
    return envelope({"status": "ready", "schema_version": calendar_store.SCHEMA_VERSION, "ics_available": ICalendar is not None})


@calendar_router.get("/preferences")
def get_preferences():
    return envelope(calendar_store.preferences())


@calendar_router.patch("/preferences")
def patch_preferences(payload: PreferencesPatch):
    return envelope(calendar_store.update_preferences(payload.model_dump(exclude_none=True)))


@calendar_router.get("/calendars")
def list_calendars():
    return envelope(calendar_store.list_calendars())


@calendar_router.post("/calendars", status_code=201)
def create_calendar(payload: CalendarCreate):
    try:
        return envelope(calendar_store.create_calendar(payload.model_dump()))
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.patch("/calendars/{calendar_id}")
def patch_calendar(calendar_id: str, payload: CalendarPatch):
    try:
        return envelope(calendar_store.update_calendar(calendar_id, payload.model_dump(exclude_none=True)))
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.delete("/calendars/{calendar_id}")
def remove_calendar(calendar_id: str, replacement_id: Optional[str] = None, delete_events: bool = False):
    try:
        calendar_store.delete_calendar(calendar_id, replacement_id, delete_events)
        return envelope({"deleted_id": calendar_id})
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.get("/events")
def list_events(
    range_start: Optional[str] = Query(default=None, alias="from"),
    range_end: Optional[str] = Query(default=None, alias="to"),
    q: str = Query(default="", max_length=240),
    calendar_id: list[str] = Query(default=[]),
):
    return envelope(calendar_store.list_events(range_start, range_end, q, calendar_id))


@calendar_router.post("/events", status_code=201)
def create_event(payload: EventInput, idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key")):
    try:
        if idempotency_key:
            with _create_idempotency_lock:
                cached = _create_idempotency.get(idempotency_key)
                if cached is not None:
                    _create_idempotency.move_to_end(idempotency_key)
                    return envelope(cached, idempotency_key=idempotency_key, idempotent_replay=True)
        event = calendar_store.create_event(payload.model_dump())
        if idempotency_key:
            with _create_idempotency_lock:
                _create_idempotency[idempotency_key] = event
                while len(_create_idempotency) > 256:
                    _create_idempotency.popitem(last=False)
        return envelope(event, idempotency_key=idempotency_key)
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.get("/events/{event_id}")
def get_event(event_id: str):
    try:
        return envelope(calendar_store.get_event(event_id))
    except CalendarStoreError as exc:
        store_error(exc)


def _expected_version(if_match: Optional[str]) -> Optional[int]:
    if not if_match:
        return None
    try:
        return int(if_match.strip('W/"'))
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": {"code": "INVALID_ETAG", "message": "If-Match must contain an event version."}})


@calendar_router.patch("/events/{event_id}")
def patch_event(event_id: str, payload: EventPatch, if_match: Optional[str] = Header(default=None, alias="If-Match")):
    try:
        return envelope(calendar_store.update_event(event_id, payload.model_dump(exclude_none=True), _expected_version(if_match)))
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.delete("/events/{event_id}")
def remove_event(event_id: str, if_match: Optional[str] = Header(default=None, alias="If-Match"), scope: str = "series"):
    if scope not in {"occurrence", "future", "series"}:
        raise HTTPException(status_code=422, detail={"error": {"code": "INVALID_RECURRENCE_SCOPE", "message": "scope must be occurrence, future, or series"}})
    try:
        return envelope(calendar_store.delete_event(event_id, _expected_version(if_match)), recurrence_scope=scope)
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.post("/events/{event_id}/reminders", status_code=201)
def add_reminder(event_id: str, payload: dict):
    minutes = int(payload.get("minutes_before", 0))
    channels = payload.get("channels") or ["in_app"]
    if minutes < 0 or minutes > 525600 or not set(channels).issubset({"in_app", "system"}):
        raise HTTPException(status_code=422, detail={"error": {"code": "INVALID_REMINDER", "message": "Invalid reminder offset or channel."}})
    try:
        return envelope(calendar_store.add_reminder(event_id, minutes, channels, payload.get("recipient")))
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.get("/reminders/due")
def reminders_due():
    return envelope(calendar_store.claim_due_reminders())


@calendar_router.post("/reminders/{reminder_id}/ack")
def acknowledge_reminder(reminder_id: str):
    calendar_store.mark_reminder(reminder_id, True)
    return envelope({"acknowledged": reminder_id})


@calendar_router.post("/reminders/{reminder_id}/snooze")
def snooze_reminder(reminder_id: str, payload: dict):
    try:
        minutes = max(1, min(int(payload.get("minutes", 10)), 10080))
        return envelope(calendar_store.snooze_reminder(reminder_id, minutes))
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.post("/quick-add/parse")
def quick_add_parse(payload: QuickAddRequest):
    try:
        parsed = parse_quick_add(payload.text, payload.timezone, payload.reference_time)
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"error": {"code": "QUICK_ADD_PARSE_ERROR", "message": str(exc)}}) from exc
    draft = calendar_store.save_quick_draft(payload.text, parsed, payload.calendar_id)
    return envelope({"draft_id": draft["id"], "expires_at": draft["expires_at"], **parsed})


@calendar_router.post("/quick-add/commit", status_code=201)
def quick_add_commit(payload: QuickAddCommit, idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key")):
    try:
        return envelope(calendar_store.commit_quick_draft(payload.draft_id, payload.patch), idempotency_key=idempotency_key)
    except CalendarStoreError as exc:
        store_error(exc)


@calendar_router.post("/suggested-times")
def suggested_times(payload: dict):
    duration = max(15, min(int(payload.get("duration_minutes", 60)), 480))
    zone_now = datetime.now().astimezone()
    start = zone_now.replace(minute=(zone_now.minute // 30 + 1) * 30 % 60, second=0, microsecond=0)
    if start <= zone_now:
        start += timedelta(minutes=30)
    candidates = []
    for offset in range(0, 14 * 24 * 2):
        candidate = start + timedelta(minutes=30 * offset)
        if candidate.weekday() >= 5 or candidate.hour < 8 or candidate.hour >= 18:
            continue
        end = candidate + timedelta(minutes=duration)
        conflicts = calendar_store.list_events(candidate.isoformat(), end.isoformat())
        if not conflicts:
            candidates.append({"start": candidate.isoformat(), "end": end.isoformat()})
        if len(candidates) == 3:
            break
    return envelope(candidates)


@calendar_router.get("/templates")
def list_templates():
    return envelope(calendar_store.list_templates())


@calendar_router.post("/templates")
def save_template(payload: TemplateInput):
    return envelope(calendar_store.save_template(payload.name, payload.payload))


@calendar_router.get("/smart-views")
def list_smart_views():
    return envelope(calendar_store.list_smart_views())


@calendar_router.post("/smart-views")
def save_smart_view(payload: SmartViewInput):
    return envelope(calendar_store.save_smart_view(payload.name, payload.filters))


def _decode_ics_event(component) -> dict:
    start_value = component.decoded("DTSTART")
    end_value = component.decoded("DTEND") if component.get("DTEND") else None
    all_day = isinstance(start_value, date) and not isinstance(start_value, datetime)
    if end_value is None:
        end_value = start_value + (timedelta(days=1) if all_day else timedelta(hours=1))
    return {
        "uid": str(component.get("UID") or uuid.uuid4()),
        "title": str(component.get("SUMMARY") or "Untitled event"),
        "description": str(component.get("DESCRIPTION") or ""),
        "location": str(component.get("LOCATION") or ""),
        "all_day": all_day,
        "start": start_value.isoformat(), "end": end_value.isoformat(),
        "recurrence": str(component.get("RRULE").to_ical().decode()) if component.get("RRULE") else None,
    }


@calendar_router.post("/ics/import/preview")
async def preview_ics(file: UploadFile = File(...)):
    if ICalendar is None:
        raise HTTPException(status_code=503, detail={"error": {"code": "ICS_UNAVAILABLE", "message": "Install the icalendar package to import ICS files."}})
    body = await file.read(10 * 1024 * 1024 + 1)
    if len(body) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail={"error": {"code": "ICS_TOO_LARGE", "message": "ICS files may not exceed 10 MB."}})
    try:
        calendar = ICalendar.from_ical(body)
        events = [_decode_ics_event(item) for item in calendar.walk("VEVENT")]
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"error": {"code": "INVALID_ICS", "message": "The selected file is not a valid calendar."}}) from exc
    if len(events) > 20000:
        raise HTTPException(status_code=413, detail={"error": {"code": "ICS_TOO_MANY_EVENTS", "message": "ICS imports are limited to 20,000 events."}})
    import_id = str(uuid.uuid4())
    _import_previews[import_id] = {"events": events, "expires": datetime.now(timezone.utc) + timedelta(minutes=30)}
    return envelope({"import_id": import_id, "filename": file.filename, "event_count": len(events), "events": events[:100], "warnings": []})


@calendar_router.post("/ics/import/commit")
def commit_ics(payload: dict):
    import_id, calendar_id = payload.get("import_id"), payload.get("calendar_id")
    preview = _import_previews.get(import_id)
    if not preview or preview["expires"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail={"error": {"code": "IMPORT_EXPIRED", "message": "Import preview expired; select the file again."}})
    imported, errors = [], []
    for item in preview["events"]:
        try:
            if item["all_day"]:
                event_data = {"calendar_id": calendar_id, "title": item["title"], "description": item["description"], "location": item["location"], "all_day": True, "start_date": date.fromisoformat(item["start"]), "end_date": date.fromisoformat(item["end"]), "timezone": calendar_store.preferences().get("timezone", "Europe/Rome")}
            else:
                start = datetime.fromisoformat(item["start"].replace("Z", "+00:00")); end = datetime.fromisoformat(item["end"].replace("Z", "+00:00"))
                if start.tzinfo is None: start = start.astimezone()
                if end.tzinfo is None: end = end.astimezone()
                event_data = {"calendar_id": calendar_id, "title": item["title"], "description": item["description"], "location": item["location"], "all_day": False, "start": start, "end": end, "timezone": str(getattr(start.tzinfo, "key", None) or start.tzinfo), "recurrence": item.get("recurrence")}
            imported.append(calendar_store.create_event(event_data)["id"])
        except Exception as exc:
            errors.append({"title": item["title"], "error": str(exc)})
    _import_previews.pop(import_id, None)
    return envelope({"imported": len(imported), "failed": len(errors), "event_ids": imported, "errors": errors[:100]})


@calendar_router.get("/ics/export/{calendar_id}")
def export_ics(calendar_id: str):
    if ICalendar is None:
        raise HTTPException(status_code=503, detail={"error": {"code": "ICS_UNAVAILABLE", "message": "Install the icalendar package to export ICS files."}})
    selected = next((item for item in calendar_store.list_calendars() if item["id"] == calendar_id), None)
    if not selected:
        raise HTTPException(status_code=404, detail={"error": {"code": "CALENDAR_NOT_FOUND", "message": "Calendar not found."}})
    output = _build_ics([calendar_id])
    filename = "".join(ch for ch in selected["name"] if ch.isalnum() or ch in "-_ ").strip().replace(" ", "-") or "calendar"
    return Response(output.to_ical(), media_type="text/calendar", headers={"Content-Disposition": f'attachment; filename="{filename}.ics"'})


def _build_ics(calendar_ids: list[str]):
    output = ICalendar(); output.add("prodid", "-//Astra AI//Calendar//EN"); output.add("version", "2.0")
    for event in calendar_store.list_events(None, None, calendar_ids=calendar_ids):
        component = ICSEvent(); component.add("uid", event["ical_uid"]); component.add("summary", event["title"])
        if event["description"]: component.add("description", event["description"])
        if event["location"]: component.add("location", event["location"])
        _add_recurrence(component, event.get("recurrence"))
        if event["all_day"]:
            component.add("dtstart", date.fromisoformat(event["start_date"])); component.add("dtend", date.fromisoformat(event["end_date"]))
        else:
            component.add("dtstart", datetime.fromisoformat(event["start_at"].replace("Z", "+00:00"))); component.add("dtend", datetime.fromisoformat(event["end_at"].replace("Z", "+00:00")))
        output.add_component(component)
    return output


def _add_recurrence(component, recurrence: str | None) -> None:
    if not recurrence:
        return
    raw = recurrence.upper().replace("RRULE:", "")
    if "=" not in raw:
        raw = f"FREQ={raw}"
    rule = {key.lower(): value.split(",") for key, value in (part.split("=", 1) for part in raw.split(";") if "=" in part)}
    if rule:
        component.add("rrule", rule)


@calendar_router.get("/ics/export")
def export_all_ics():
    if ICalendar is None:
        raise HTTPException(status_code=503, detail={"error": {"code": "ICS_UNAVAILABLE", "message": "Install the icalendar package to export ICS files."}})
    calendar_ids = [item["id"] for item in calendar_store.list_calendars()]
    return Response(_build_ics(calendar_ids).to_ical(), media_type="text/calendar", headers={"Content-Disposition": 'attachment; filename="astra-calendars.ics"'})


@calendar_router.get("/sync/status")
def sync_status():
    return envelope(calendar_store.outbox_status())


@calendar_router.get("/changes")
async def calendar_changes():
    """SSE cursor for inexpensive multi-window and multi-device refreshes."""
    async def stream():
        token = await asyncio.to_thread(calendar_store.change_token)
        yield f"event: ready\ndata: {json.dumps({'token': token})}\n\n"
        while True:
            try:
                await asyncio.sleep(2)
                next_token = await asyncio.to_thread(calendar_store.change_token)
                if next_token != token:
                    token = next_token
                    yield f"event: calendar-change\ndata: {json.dumps({'token': token})}\n\n"
                else:
                    yield ": keep-alive\n\n"
            except asyncio.CancelledError:
                break

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@calendar_router.post("/sync")
async def sync_now():
    status = calendar_store.outbox_status()
    if not status["accounts"]:
        return envelope({**status, "status": "local_only", "message": "No CalDAV account is configured. Local changes are safely stored."})
    account = status["accounts"][0]
    password = _caldav_credentials.get(account["id"])
    if not password:
        calendar_store.update_sync_account_status(account["id"], "credentials_required", "Reconnect to unlock this session.")
        return envelope({**calendar_store.outbox_status(), "status": "credentials_required", "message": "Reconnect the CalDAV account to unlock sync for this Astra session."})
    calendar_store.update_sync_account_status(account["id"], "syncing")
    try:
        result = await asyncio.wait_for(asyncio.to_thread(_push_caldav_outbox, account, password), timeout=45)
        calendar_store.update_sync_account_status(account["id"], "synced")
        return envelope({**calendar_store.outbox_status(), "status": "synced", "message": "CalDAV changes are synchronized.", **result})
    except asyncio.TimeoutError as exc:
        calendar_store.update_sync_account_status(account["id"], "error", "Sync timed out.")
        raise HTTPException(status_code=504, detail={"error": {"code": "CALDAV_SYNC_TIMEOUT", "message": "CalDAV sync timed out; pending changes remain queued."}}) from exc
    except Exception as exc:
        calendar_store.update_sync_account_status(account["id"], "error", str(exc)[:300])
        raise HTTPException(status_code=502, detail={"error": {"code": "CALDAV_SYNC_FAILED", "message": "CalDAV sync failed; pending changes remain queued.", "details": {"reason": str(exc)[:200]}}}) from exc


@calendar_router.get("/caldav/status")
async def caldav_status_alias():
    return sync_status()


@calendar_router.post("/caldav/sync")
async def caldav_sync_alias():
    return await sync_now()


@calendar_router.post("/caldav/accounts/test")
async def test_caldav(payload: dict):
    url = str(payload.get("url") or "").strip()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=422, detail={"error": {"code": "INVALID_CALDAV_URL", "message": "Enter a complete HTTP or HTTPS CalDAV URL."}})
    if not username or not password:
        raise HTTPException(status_code=422, detail={"error": {"code": "CALDAV_CREDENTIALS_REQUIRED", "message": "Username and password are required for the connection test."}})
    try:
        import caldav
        def connect():
            with caldav.DAVClient(url=url, username=username, password=password, timeout=10) as client:
                principal = client.principal()
                return [str(calendar.name) for calendar in principal.calendars()]
        calendars = await asyncio.wait_for(asyncio.to_thread(connect), timeout=12)
        return envelope({"connected": True, "calendar_count": len(calendars), "calendars": calendars})
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=504, detail={"error": {"code": "CALDAV_TIMEOUT", "message": "The CalDAV server did not respond in time."}}) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"error": {"code": "CALDAV_CONNECTION_FAILED", "message": "The CalDAV connection could not be verified.", "details": {"reason": str(exc)[:200]}}}) from exc


@calendar_router.post("/caldav/accounts", status_code=201)
async def connect_caldav(payload: dict):
    tested = await test_caldav(payload)
    url = str(payload.get("url") or "").strip()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    account = calendar_store.save_sync_account(payload.get("name") or urlparse(url).hostname or "CalDAV", url, username, f"session:{uuid.uuid4()}")
    _caldav_credentials[account["id"]] = password
    safe_account = {key: value for key, value in account.items() if key != "credential_ref"}
    return envelope({"account": safe_account, "calendars": tested["data"]["calendars"], "credential_storage": "session_only"})


def _single_event_ical(event: dict) -> str:
    output = ICalendar(); output.add("prodid", "-//Astra AI//Calendar//EN"); output.add("version", "2.0")
    component = ICSEvent(); component.add("uid", event["ical_uid"]); component.add("summary", event["title"])
    if event.get("description"): component.add("description", event["description"])
    if event.get("location"): component.add("location", event["location"])
    _add_recurrence(component, event.get("recurrence"))
    if event["all_day"]:
        component.add("dtstart", date.fromisoformat(event["start_date"])); component.add("dtend", date.fromisoformat(event["end_date"]))
    else:
        component.add("dtstart", datetime.fromisoformat(event["start_at"].replace("Z", "+00:00"))); component.add("dtend", datetime.fromisoformat(event["end_at"].replace("Z", "+00:00")))
    output.add_component(component)
    return output.to_ical().decode("utf-8")


def _push_caldav_outbox(account: dict, password: str) -> dict:
    import caldav
    from caldav.lib.error import NotFoundError
    pushed, failed = 0, 0
    with caldav.DAVClient(url=account["server_url"], username=account["username"], password=password, timeout=20) as client:
        calendars = client.principal().calendars()
        if not calendars:
            raise RuntimeError("The CalDAV account has no writable calendars.")
        remote_calendar = calendars[0]
        for item in calendar_store.pending_outbox():
            try:
                if item["operation"] == "delete":
                    try: remote_calendar.event_by_uid(item["payload"].get("ical_uid")).delete()
                    except NotFoundError: pass
                else:
                    event = calendar_store.get_event(item["entity_id"])
                    ical = _single_event_ical(event)
                    if item["operation"] == "update":
                        try:
                            remote = remote_calendar.event_by_uid(event["ical_uid"]); remote.data = ical; remote.save()
                        except NotFoundError:
                            remote_calendar.save_event(ical=ical)
                    else:
                        remote_calendar.save_event(ical=ical)
                calendar_store.mark_outbox(item["id"], "synced"); pushed += 1
            except Exception as exc:
                calendar_store.mark_outbox(item["id"], "pending", str(exc)[:300]); failed += 1
    return {"pushed": pushed, "failed": failed}


async def reminder_loop() -> None:
    """Keep the local reminder service alive; clients poll the durable due queue."""
    while True:
        try:
            await asyncio.to_thread(calendar_store.due_reminders, limit=1)
        except asyncio.CancelledError:
            raise
        except Exception:
            pass
        await asyncio.sleep(15)
