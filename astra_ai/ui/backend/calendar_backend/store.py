from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _decode_row(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    result = dict(row)
    for key in ("tags", "channels", "payload", "filters", "pinned_timezones", "parsed", "assumptions", "ambiguities"):
        if key in result and isinstance(result[key], str):
            try:
                result[key] = json.loads(result[key])
            except json.JSONDecodeError:
                pass
    for key in ("all_day", "is_visible", "enabled", "delivered", "deleted", "system_notifications"):
        if key in result:
            result[key] = bool(result[key])
    return result


class CalendarStoreError(RuntimeError):
    def __init__(self, message: str, status_code: int = 400, code: str = "CALENDAR_ERROR"):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class CalendarStore:
    SCHEMA_VERSION = 1

    def __init__(self, root: Path):
        self.root = root
        self.path = root / "calendar.sqlite3"
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
                CREATE TABLE IF NOT EXISTS calendar_meta (
                    key TEXT PRIMARY KEY, value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_calendars (
                    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL DEFAULT 'local',
                    name TEXT NOT NULL, color TEXT NOT NULL, timezone TEXT NOT NULL,
                    source TEXT NOT NULL DEFAULT 'local', is_visible INTEGER NOT NULL DEFAULT 1,
                    position INTEGER NOT NULL DEFAULT 0, remote_url TEXT, remote_etag TEXT,
                    version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL, deleted_at TEXT
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_name
                    ON calendar_calendars(owner_id, name) WHERE deleted_at IS NULL;
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL DEFAULT 'local',
                    calendar_id TEXT NOT NULL REFERENCES calendar_calendars(id), ical_uid TEXT NOT NULL,
                    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
                    all_day INTEGER NOT NULL DEFAULT 0, start_at TEXT, end_at TEXT,
                    start_date TEXT, end_date TEXT, timezone TEXT NOT NULL,
                    recurrence TEXT, tags TEXT NOT NULL DEFAULT '[]', importance TEXT NOT NULL DEFAULT 'normal',
                    color TEXT, status TEXT NOT NULL DEFAULT 'confirmed', version INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_calendar_event_range ON calendar_events(start_at, end_at);
                CREATE INDEX IF NOT EXISTS idx_calendar_event_dates ON calendar_events(start_date, end_date);
                CREATE INDEX IF NOT EXISTS idx_calendar_event_calendar ON calendar_events(calendar_id);
                CREATE TABLE IF NOT EXISTS calendar_reminders (
                    id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
                    occurrence_id TEXT, minutes_before INTEGER, trigger_at TEXT,
                    channels TEXT NOT NULL DEFAULT '["in_app"]', recipient TEXT,
                    enabled INTEGER NOT NULL DEFAULT 1, next_fire_at TEXT,
                    last_fired_at TEXT, snoozed_until TEXT, delivered INTEGER NOT NULL DEFAULT 0,
                    attempt_count INTEGER NOT NULL DEFAULT 0, last_error TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_reminder_due ON calendar_reminders(enabled, delivered, next_fire_at);
                CREATE TABLE IF NOT EXISTS calendar_preferences (
                    owner_id TEXT PRIMARY KEY, timezone TEXT NOT NULL, locale TEXT NOT NULL,
                    week_start TEXT NOT NULL, hour_cycle TEXT NOT NULL, default_calendar_id TEXT,
                    pinned_timezones TEXT NOT NULL DEFAULT '[]',
                    system_notifications INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_quick_add_drafts (
                    id TEXT PRIMARY KEY, raw_text TEXT NOT NULL, parsed TEXT NOT NULL,
                    assumptions TEXT NOT NULL, ambiguities TEXT NOT NULL,
                    calendar_id TEXT, expires_at TEXT NOT NULL, committed_event_id TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_templates (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, payload TEXT NOT NULL,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_smart_views (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, filters TEXT NOT NULL,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_sync_accounts (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, server_url TEXT NOT NULL,
                    username TEXT NOT NULL, credential_ref TEXT,
                    status TEXT NOT NULL DEFAULT 'not_configured', last_sync_at TEXT,
                    last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_outbox (
                    id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
                    operation TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
                    attempt_count INTEGER NOT NULL DEFAULT 0, last_error TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS calendar_delivery_log (
                    id TEXT PRIMARY KEY, reminder_id TEXT NOT NULL, occurrence_key TEXT NOT NULL,
                    channel TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL,
                    UNIQUE(reminder_id, occurrence_key, channel)
                );
                """
            )
            conn.execute("INSERT OR REPLACE INTO calendar_meta(key,value) VALUES('schema_version',?)", (str(self.SCHEMA_VERSION),))
            row = conn.execute("SELECT id FROM calendar_calendars WHERE deleted_at IS NULL LIMIT 1").fetchone()
            if not row:
                calendar_id = str(uuid.uuid4())
                now = utc_now()
                conn.execute(
                    "INSERT INTO calendar_calendars(id,name,color,timezone,created_at,updated_at) VALUES(?,?,?,?,?,?)",
                    (calendar_id, "Personal", "#58B4FF", "Europe/Rome", now, now),
                )
                conn.execute(
                    "INSERT OR IGNORE INTO calendar_preferences(owner_id,timezone,locale,week_start,hour_cycle,default_calendar_id,updated_at) VALUES('local','Europe/Rome','en-GB','monday','24',?,?)",
                    (calendar_id, now),
                )
            self._initialized = True

    def _ensure(self):
        if not self._initialized:
            self.initialize()

    def preferences(self) -> dict:
        self._ensure()
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM calendar_preferences WHERE owner_id='local'").fetchone()
        return _decode_row(row) or {}

    def update_preferences(self, patch: dict) -> dict:
        self._ensure()
        allowed = {"timezone", "locale", "week_start", "hour_cycle", "default_calendar_id", "pinned_timezones", "system_notifications"}
        values = {k: (_json(v) if k == "pinned_timezones" else int(v) if k == "system_notifications" else v) for k, v in patch.items() if k in allowed and v is not None}
        if values:
            values["updated_at"] = utc_now()
            assignments = ",".join(f"{key}=?" for key in values)
            with self._lock, self.connection() as conn:
                conn.execute(f"UPDATE calendar_preferences SET {assignments} WHERE owner_id='local'", tuple(values.values()))
        return self.preferences()

    def list_calendars(self) -> list[dict]:
        self._ensure()
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM calendar_calendars WHERE deleted_at IS NULL ORDER BY position,name").fetchall()
        return [_decode_row(row) for row in rows]

    def create_calendar(self, data: dict) -> dict:
        self._ensure()
        calendar_id, now = str(uuid.uuid4()), utc_now()
        with self._lock, self.connection() as conn:
            position = conn.execute("SELECT COALESCE(MAX(position),-1)+1 FROM calendar_calendars WHERE deleted_at IS NULL").fetchone()[0]
            try:
                conn.execute(
                    "INSERT INTO calendar_calendars(id,name,color,timezone,position,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
                    (calendar_id, data["name"].strip(), data["color"], data["timezone"], position, now, now),
                )
            except sqlite3.IntegrityError as exc:
                raise CalendarStoreError("A calendar with that name already exists.", 409, "DUPLICATE_CALENDAR") from exc
            row = conn.execute("SELECT * FROM calendar_calendars WHERE id=?", (calendar_id,)).fetchone()
        return _decode_row(row)

    def update_calendar(self, calendar_id: str, patch: dict) -> dict:
        allowed = {"name", "color", "is_visible", "position"}
        values = {k: int(v) if k == "is_visible" else v for k, v in patch.items() if k in allowed and v is not None}
        values["updated_at"] = utc_now()
        with self._lock, self.connection() as conn:
            if not conn.execute("SELECT 1 FROM calendar_calendars WHERE id=? AND deleted_at IS NULL", (calendar_id,)).fetchone():
                raise CalendarStoreError("Calendar not found.", 404, "CALENDAR_NOT_FOUND")
            assignments = ",".join(f"{key}=?" for key in values) + ",version=version+1"
            try:
                conn.execute(f"UPDATE calendar_calendars SET {assignments} WHERE id=?", (*values.values(), calendar_id))
            except sqlite3.IntegrityError as exc:
                raise CalendarStoreError("A calendar with that name already exists.", 409, "DUPLICATE_CALENDAR") from exc
            row = conn.execute("SELECT * FROM calendar_calendars WHERE id=?", (calendar_id,)).fetchone()
        return _decode_row(row)

    def delete_calendar(self, calendar_id: str, replacement_id: str | None, delete_events: bool) -> None:
        now = utc_now()
        with self._lock, self.connection() as conn:
            active = conn.execute("SELECT id FROM calendar_calendars WHERE deleted_at IS NULL").fetchall()
            if not any(row[0] == calendar_id for row in active):
                raise CalendarStoreError("Calendar not found.", 404, "CALENDAR_NOT_FOUND")
            if len(active) == 1:
                raise CalendarStoreError("The last calendar cannot be deleted.", 409, "LAST_CALENDAR")
            event_count = conn.execute("SELECT COUNT(*) FROM calendar_events WHERE calendar_id=? AND deleted_at IS NULL", (calendar_id,)).fetchone()[0]
            if event_count and not delete_events:
                if not replacement_id or replacement_id == calendar_id:
                    raise CalendarStoreError("Choose a replacement calendar or delete its events.", 409, "REPLACEMENT_REQUIRED")
                if not conn.execute("SELECT 1 FROM calendar_calendars WHERE id=? AND deleted_at IS NULL", (replacement_id,)).fetchone():
                    raise CalendarStoreError("Replacement calendar not found.", 404, "REPLACEMENT_NOT_FOUND")
                conn.execute("UPDATE calendar_events SET calendar_id=?,updated_at=?,version=version+1 WHERE calendar_id=? AND deleted_at IS NULL", (replacement_id, now, calendar_id))
            elif event_count:
                conn.execute("UPDATE calendar_events SET deleted_at=?,updated_at=?,version=version+1 WHERE calendar_id=? AND deleted_at IS NULL", (now, now, calendar_id))
            conn.execute("UPDATE calendar_calendars SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?", (now, now, calendar_id))
            conn.execute("UPDATE calendar_preferences SET default_calendar_id=COALESCE(?,(SELECT id FROM calendar_calendars WHERE deleted_at IS NULL LIMIT 1)),updated_at=? WHERE default_calendar_id=?", (replacement_id, now, calendar_id))

    @staticmethod
    def _event_values(data: dict) -> dict:
        all_day = bool(data.get("all_day"))
        start = data.get("start", data.get("start_at"))
        end = data.get("end", data.get("end_at"))
        return {
            "calendar_id": data["calendar_id"], "title": data["title"].strip(),
            "description": data.get("description", ""), "location": data.get("location", ""),
            "all_day": int(all_day),
            "start_at": None if all_day else (start.isoformat() if hasattr(start, "isoformat") else start),
            "end_at": None if all_day else (end.isoformat() if hasattr(end, "isoformat") else end),
            "start_date": (data.get("start_date").isoformat() if hasattr(data.get("start_date"), "isoformat") else data.get("start_date")) if all_day else None,
            "end_date": (data.get("end_date").isoformat() if hasattr(data.get("end_date"), "isoformat") else data.get("end_date")) if all_day else None,
            "timezone": data.get("timezone", "Europe/Rome"), "recurrence": data.get("recurrence"),
            "tags": _json(data.get("tags", [])), "importance": data.get("importance", "normal"),
            "color": data.get("color"),
        }

    def create_event(self, data: dict) -> dict:
        self._ensure()
        event_id, now = str(uuid.uuid4()), utc_now()
        values = self._event_values(data)
        columns = list(values)
        with self._lock, self.connection() as conn:
            if not conn.execute("SELECT 1 FROM calendar_calendars WHERE id=? AND deleted_at IS NULL", (values["calendar_id"],)).fetchone():
                raise CalendarStoreError("Calendar not found.", 404, "CALENDAR_NOT_FOUND")
            conn.execute(
                f"INSERT INTO calendar_events(id,ical_uid,{','.join(columns)},created_at,updated_at) VALUES(?,?,{','.join('?' for _ in columns)},?,?)",
                (event_id, f"{event_id}@astra.local", *values.values(), now, now),
            )
            for minutes in sorted(set(data.get("reminder_minutes", []))):
                self._insert_reminder(conn, event_id, int(minutes), data.get("reminder_channels") or ["in_app"], None)
            self._outbox(conn, "event", event_id, "create", values)
            row = conn.execute("SELECT * FROM calendar_events WHERE id=?", (event_id,)).fetchone()
        return self._event_with_reminders(_decode_row(row))

    def list_events(self, range_start: str | None, range_end: str | None, query: str = "", calendar_ids: Iterable[str] = ()) -> list[dict]:
        self._ensure()
        sql = "SELECT * FROM calendar_events WHERE deleted_at IS NULL"
        args: list[Any] = []
        if range_start and range_end:
            sql += " AND (recurrence IS NOT NULL OR (all_day=0 AND start_at < ? AND end_at > ?) OR (all_day=1 AND start_date < substr(?,1,11) AND end_date > substr(?,1,11)))"
            args += [range_end, range_start, range_end, range_start]
        ids = [item for item in calendar_ids if item]
        if ids:
            sql += f" AND calendar_id IN ({','.join('?' for _ in ids)})"
            args += ids
        if query.strip():
            needle = f"%{query.strip()}%"
            sql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR tags LIKE ?)"
            args += [needle] * 4
        sql += " ORDER BY COALESCE(start_at,start_date),title LIMIT 5000"
        with self.connection() as conn:
            rows = conn.execute(sql, args).fetchall()
            event_ids = [row["id"] for row in rows]
            reminder_rows = (
                conn.execute(
                    f"SELECT * FROM calendar_reminders WHERE event_id IN ({','.join('?' for _ in event_ids)})",
                    event_ids,
                ).fetchall()
                if event_ids
                else []
            )
        reminders: dict[str, list[dict]] = {}
        for row in reminder_rows:
            item = _decode_row(row)
            reminders.setdefault(item["event_id"], []).append(item)
        result = []
        for row in rows:
            item = _decode_row(row)
            item["reminders"] = reminders.get(item["id"], [])
            result.extend(self._expand_occurrences(item, range_start, range_end) if item.get("recurrence") and range_start and range_end else [item])
        result.sort(key=lambda item: (item.get("start_at") or item.get("start_date") or "", item["title"]))
        return result

    @staticmethod
    def _expand_occurrences(event: dict, range_start: str, range_end: str) -> list[dict]:
        """Expand common RFC5545 frequencies inside the requested window."""
        rule = str(event.get("recurrence") or "").upper().replace("RRULE:", "")
        parts = dict(part.split("=", 1) for part in rule.split(";") if "=" in part)
        frequency = parts.get("FREQ", rule).lower()
        if frequency not in {"daily", "weekly", "monthly", "yearly"}:
            return [event]
        interval = max(1, int(parts.get("INTERVAL", "1") or 1)); count = max(1, int(parts.get("COUNT", "1000") or 1000))
        window_start = datetime.fromisoformat(range_start.replace("Z", "+00:00")); window_end = datetime.fromisoformat(range_end.replace("Z", "+00:00"))
        all_day = bool(event["all_day"])
        try: zone = ZoneInfo(event.get("timezone") or "UTC")
        except ZoneInfoNotFoundError: zone = ZoneInfo("UTC")
        base = datetime.fromisoformat((event["start_date"] + "T00:00:00+00:00") if all_day else event["start_at"].replace("Z", "+00:00")).astimezone(zone)
        finish = datetime.fromisoformat((event["end_date"] + "T00:00:00+00:00") if all_day else event["end_at"].replace("Z", "+00:00")).astimezone(zone)
        duration = finish - base; until = parts.get("UNTIL")
        until_at = None
        if until:
            try: until_at = datetime.strptime(until, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
            except ValueError:
                try: until_at = datetime.strptime(until, "%Y%m%d").replace(tzinfo=timezone.utc)
                except ValueError: pass
        occurrences, wall_current = [], base.replace(tzinfo=None)
        for index in range(min(count, 1000)):
            # Rebuild each occurrence from the intended local wall time. A UTC
            # round-trip shifts only a nonexistent gap occurrence forward and
            # prevents that one adjustment from drifting later occurrences.
            current = wall_current.replace(tzinfo=zone, fold=0).astimezone(timezone.utc).astimezone(zone)
            if current >= window_end or (until_at and current > until_at): break
            if current + duration > window_start:
                occurrence = {**event, "series_id": event["id"], "occurrence_start": current.isoformat(), "id": f"{event['id']}::{current.isoformat()}"}
                if all_day:
                    occurrence.update(start_date=current.date().isoformat(), end_date=(current + duration).date().isoformat())
                else:
                    occurrence.update(start_at=current.isoformat(), end_at=(current + duration).isoformat())
                occurrences.append(occurrence)
            if frequency == "daily": wall_current += timedelta(days=interval)
            elif frequency == "weekly": wall_current += timedelta(weeks=interval)
            elif frequency == "yearly":
                try: wall_current = wall_current.replace(year=wall_current.year + interval)
                except ValueError: wall_current = wall_current.replace(month=2, day=28, year=wall_current.year + interval)
            else:
                total = wall_current.year * 12 + wall_current.month - 1 + interval; year, month = divmod(total, 12)
                day = wall_current.day
                while day > 28:
                    try: wall_current = wall_current.replace(year=year, month=month + 1, day=day); break
                    except ValueError: day -= 1
                else: wall_current = wall_current.replace(year=year, month=month + 1, day=day)
        return occurrences

    def get_event(self, event_id: str) -> dict:
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM calendar_events WHERE id=? AND deleted_at IS NULL", (event_id,)).fetchone()
        if not row:
            raise CalendarStoreError("Event not found.", 404, "EVENT_NOT_FOUND")
        return self._event_with_reminders(_decode_row(row))

    def _event_with_reminders(self, event: dict) -> dict:
        with self.connection() as conn:
            rows = conn.execute("SELECT * FROM calendar_reminders WHERE event_id=? ORDER BY minutes_before DESC", (event["id"],)).fetchall()
        event["reminders"] = [_decode_row(row) for row in rows]
        return event

    def update_event(self, event_id: str, patch: dict, expected_version: int | None = None) -> dict:
        current = self.get_event(event_id)
        merged = {**current, **{k: v for k, v in patch.items() if v is not None}}
        if merged.get("all_day"):
            start_date = merged.get("start_date")
            end_date = merged.get("end_date")
            if not start_date:
                raise CalendarStoreError("All-day events require a start date.", 422, "INVALID_EVENT_INTERVAL")
            if end_date and str(end_date) <= str(start_date):
                raise CalendarStoreError("The end date must be after the start date.", 422, "INVALID_EVENT_INTERVAL")
        else:
            start_value = merged.get("start", merged.get("start_at"))
            end_value = merged.get("end", merged.get("end_at"))
            try:
                start_at = (
                    start_value
                    if isinstance(start_value, datetime)
                    else datetime.fromisoformat(str(start_value).replace("Z", "+00:00"))
                )
                end_at = (
                    end_value
                    if isinstance(end_value, datetime)
                    else datetime.fromisoformat(str(end_value).replace("Z", "+00:00"))
                )
            except (TypeError, ValueError) as exc:
                raise CalendarStoreError("Timed events require valid start and end times.", 422, "INVALID_EVENT_INTERVAL") from exc
            if start_at.tzinfo is None or end_at.tzinfo is None or end_at <= start_at:
                raise CalendarStoreError("The event end must be after its timezone-aware start.", 422, "INVALID_EVENT_INTERVAL")
        values = self._event_values(merged)
        values["updated_at"] = utc_now()
        assignments = ",".join(f"{key}=?" for key in values) + ",version=version+1"
        with self._lock, self.connection() as conn:
            where = "id=? AND deleted_at IS NULL"
            args = [*values.values(), event_id]
            if expected_version is not None:
                where += " AND version=?"
                args.append(expected_version)
            result = conn.execute(f"UPDATE calendar_events SET {assignments} WHERE {where}", args)
            if result.rowcount == 0:
                exists = conn.execute(
                    "SELECT version FROM calendar_events WHERE id=? AND deleted_at IS NULL",
                    (event_id,),
                ).fetchone()
                if not exists:
                    raise CalendarStoreError("Event not found.", 404, "EVENT_NOT_FOUND")
                raise CalendarStoreError(
                    "The event changed since it was opened.",
                    412,
                    "EVENT_VERSION_CONFLICT",
                )

            if "reminder_minutes" in patch or "reminder_channels" in patch:
                minutes = patch.get("reminder_minutes")
                if minutes is None:
                    minutes = [item["minutes_before"] for item in current.get("reminders", [])]
                channels = patch.get("reminder_channels")
                if channels is None:
                    channels = next(
                        (
                            item.get("channels")
                            for item in current.get("reminders", [])
                            if item.get("channels")
                        ),
                        ["in_app"],
                    )
                conn.execute("DELETE FROM calendar_reminders WHERE event_id=?", (event_id,))
                for offset in sorted(set(int(value) for value in minutes)):
                    self._insert_reminder(conn, event_id, offset, channels, None)
            self._outbox(conn, "event", event_id, "update", values)
        return self.get_event(event_id)

    def delete_event(self, event_id: str, expected_version: int | None = None) -> dict:
        current = self.get_event(event_id)
        if expected_version is not None and current["version"] != expected_version:
            raise CalendarStoreError("The event changed since it was opened.", 412, "EVENT_VERSION_CONFLICT")
        now = utc_now()
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_events SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?", (now, now, event_id))
            conn.execute("UPDATE calendar_reminders SET enabled=0,updated_at=? WHERE event_id=?", (now, event_id))
            self._outbox(conn, "event", event_id, "delete", {"deleted_at": now, "ical_uid": current["ical_uid"]})
        return current

    def _insert_reminder(self, conn, event_id: str, minutes_before: int, channels: list[str], recipient: str | None) -> dict:
        event = conn.execute("SELECT * FROM calendar_events WHERE id=?", (event_id,)).fetchone()
        if not event:
            raise CalendarStoreError("Event not found.", 404, "EVENT_NOT_FOUND")
        event_data = dict(event)
        if event_data["all_day"]:
            start = datetime.fromisoformat(event_data["start_date"] + "T09:00:00+00:00")
        else:
            start = datetime.fromisoformat(event_data["start_at"].replace("Z", "+00:00"))
        next_fire = (start.astimezone(timezone.utc) - timedelta(minutes=minutes_before)).isoformat().replace("+00:00", "Z")
        reminder_id, now = str(uuid.uuid4()), utc_now()
        conn.execute(
            "INSERT INTO calendar_reminders(id,event_id,minutes_before,channels,recipient,next_fire_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
            (reminder_id, event_id, minutes_before, _json(channels), recipient, next_fire, now, now),
        )
        return _decode_row(conn.execute("SELECT * FROM calendar_reminders WHERE id=?", (reminder_id,)).fetchone())

    def add_reminder(self, event_id: str, minutes_before: int, channels: list[str], recipient: str | None = None) -> dict:
        with self._lock, self.connection() as conn:
            return self._insert_reminder(conn, event_id, minutes_before, channels, recipient)

    def due_reminders(self, limit: int = 50) -> list[dict]:
        now = utc_now()
        with self.connection() as conn:
            rows = conn.execute(
                "SELECT r.*,e.title,e.start_at,e.start_date,e.location FROM calendar_reminders r JOIN calendar_events e ON e.id=r.event_id WHERE r.enabled=1 AND r.delivered=0 AND e.deleted_at IS NULL AND COALESCE(r.snoozed_until,r.next_fire_at)<=? ORDER BY COALESCE(r.snoozed_until,r.next_fire_at) LIMIT ?",
                (now, limit),
            ).fetchall()
        return [_decode_row(row) for row in rows]

    def claim_due_reminders(self, limit: int = 50) -> list[dict]:
        """Atomically lease due reminders so multiple Astra windows cannot double-deliver."""
        now = utc_now(); stale = (datetime.now(timezone.utc) - timedelta(minutes=2)).isoformat().replace("+00:00", "Z")
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_reminders SET delivered=0 WHERE delivered=2 AND updated_at<?", (stale,))
            rows = conn.execute(
                "SELECT r.*,e.title,e.start_at,e.start_date,e.location FROM calendar_reminders r JOIN calendar_events e ON e.id=r.event_id WHERE r.enabled=1 AND r.delivered=0 AND e.deleted_at IS NULL AND COALESCE(r.snoozed_until,r.next_fire_at)<=? ORDER BY COALESCE(r.snoozed_until,r.next_fire_at) LIMIT ?",
                (now, limit),
            ).fetchall()
            if rows:
                ids = [row["id"] for row in rows]
                conn.execute(f"UPDATE calendar_reminders SET delivered=2,updated_at=? WHERE id IN ({','.join('?' for _ in ids)})", (now, *ids))
        return [_decode_row(row) for row in rows]

    def mark_reminder(self, reminder_id: str, delivered: bool, error: str | None = None) -> None:
        now = utc_now()
        with self._lock, self.connection() as conn:
            row = conn.execute("SELECT r.*,e.recurrence,e.start_at,e.start_date,e.all_day,e.timezone FROM calendar_reminders r JOIN calendar_events e ON e.id=r.event_id WHERE r.id=?", (reminder_id,)).fetchone()
            next_fire = self._next_recurring_fire(dict(row)) if delivered and row and row["recurrence"] else None
            conn.execute("UPDATE calendar_reminders SET delivered=?,next_fire_at=COALESCE(?,next_fire_at),snoozed_until=NULL,last_fired_at=?,attempt_count=attempt_count+1,last_error=?,updated_at=? WHERE id=?", (0 if next_fire else int(delivered), next_fire, now, error, now, reminder_id))

    @staticmethod
    def _next_recurring_fire(reminder: dict) -> str | None:
        rule = str(reminder.get("recurrence") or "").upper().replace("RRULE:", "")
        parts = dict(part.split("=", 1) for part in rule.split(";") if "=" in part)
        frequency = parts.get("FREQ", rule).lower(); interval = max(1, int(parts.get("INTERVAL", "1") or 1))
        if frequency not in {"daily", "weekly", "monthly", "yearly"}: return None
        try: zone = ZoneInfo(reminder.get("timezone") or "UTC")
        except ZoneInfoNotFoundError: zone = ZoneInfo("UTC")
        start = datetime.fromisoformat((reminder["start_date"] + "T09:00:00+00:00") if reminder["all_day"] else reminder["start_at"].replace("Z", "+00:00")).astimezone(zone)
        wall_start = start.replace(tzinfo=None)
        now = datetime.now(timezone.utc); minutes = int(reminder["minutes_before"])
        for _ in range(10000):
            start = wall_start.replace(tzinfo=zone, fold=0).astimezone(timezone.utc).astimezone(zone)
            fire = start - timedelta(minutes=minutes)
            if fire > now: return fire.isoformat().replace("+00:00", "Z")
            if frequency == "daily": wall_start += timedelta(days=interval)
            elif frequency == "weekly": wall_start += timedelta(weeks=interval)
            elif frequency == "yearly":
                try: wall_start = wall_start.replace(year=wall_start.year + interval)
                except ValueError: wall_start = wall_start.replace(month=2, day=28, year=wall_start.year + interval)
            else:
                total = wall_start.year * 12 + wall_start.month - 1 + interval; year, month = divmod(total, 12); day = wall_start.day
                while day > 28:
                    try: wall_start = wall_start.replace(year=year, month=month + 1, day=day); break
                    except ValueError: day -= 1
                else: wall_start = wall_start.replace(year=year, month=month + 1, day=day)
        return None

    def channel_was_delivered(self, reminder_id: str, occurrence_key: str, channel: str) -> bool:
        with self.connection() as conn:
            return bool(conn.execute("SELECT 1 FROM calendar_delivery_log WHERE reminder_id=? AND occurrence_key=? AND channel=? AND status='sent'", (reminder_id, occurrence_key, channel)).fetchone())

    def log_delivery(self, reminder_id: str, occurrence_key: str, channel: str, status: str, error: str | None = None) -> None:
        with self._lock, self.connection() as conn:
            conn.execute(
                "INSERT INTO calendar_delivery_log(id,reminder_id,occurrence_key,channel,status,error,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(reminder_id,occurrence_key,channel) DO UPDATE SET status=excluded.status,error=excluded.error,created_at=excluded.created_at",
                (str(uuid.uuid4()), reminder_id, occurrence_key, channel, status, error, utc_now()),
            )

    def snooze_reminder(self, reminder_id: str, minutes: int) -> dict:
        until = (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_reminders SET delivered=0,snoozed_until=?,updated_at=? WHERE id=?", (until, utc_now(), reminder_id))
            row = conn.execute("SELECT * FROM calendar_reminders WHERE id=?", (reminder_id,)).fetchone()
        if not row:
            raise CalendarStoreError("Reminder not found.", 404, "REMINDER_NOT_FOUND")
        return _decode_row(row)

    def save_quick_draft(self, text: str, parsed: dict, calendar_id: str | None) -> dict:
        draft_id, now = str(uuid.uuid4()), utc_now()
        expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat().replace("+00:00", "Z")
        with self._lock, self.connection() as conn:
            conn.execute(
                "INSERT INTO calendar_quick_add_drafts(id,raw_text,parsed,assumptions,ambiguities,calendar_id,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",
                (draft_id, text, _json(parsed), _json(parsed.get("assumptions", [])), _json(parsed.get("ambiguities", [])), calendar_id, expires, now, now),
            )
            row = conn.execute("SELECT * FROM calendar_quick_add_drafts WHERE id=?", (draft_id,)).fetchone()
        return _decode_row(row)

    def commit_quick_draft(self, draft_id: str, patch: dict) -> dict:
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM calendar_quick_add_drafts WHERE id=?", (draft_id,)).fetchone()
        draft = _decode_row(row)
        if not draft:
            raise CalendarStoreError("Quick Add draft not found.", 404, "DRAFT_NOT_FOUND")
        if draft.get("committed_event_id"):
            return self.get_event(draft["committed_event_id"])
        if draft["expires_at"] < utc_now():
            raise CalendarStoreError("Quick Add draft expired; parse it again.", 409, "DRAFT_EXPIRED")
        parsed = {**draft["parsed"], **patch}
        calendar_id = parsed.get("calendar_id") or draft.get("calendar_id") or self.preferences().get("default_calendar_id")
        event = self.create_event({
            "calendar_id": calendar_id, "title": parsed["title"], "description": parsed.get("description", ""),
            "location": parsed.get("location", ""), "start": datetime.fromisoformat(parsed["start"].replace("Z", "+00:00")),
            "end": datetime.fromisoformat(parsed["end"].replace("Z", "+00:00")), "all_day": False,
            "timezone": parsed.get("timezone", self.preferences().get("timezone", "Europe/Rome")),
            "recurrence": parsed.get("recurrence"), "tags": parsed.get("tags", []),
            "importance": parsed.get("importance", "normal"), "color": parsed.get("color"),
            "reminder_minutes": parsed.get("reminder_minutes", []), "reminder_channels": parsed.get("reminder_channels", ["in_app"]),
        })
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_quick_add_drafts SET committed_event_id=?,updated_at=? WHERE id=?", (event["id"], utc_now(), draft_id))
        return event

    def list_templates(self) -> list[dict]:
        with self.connection() as conn:
            return [_decode_row(row) for row in conn.execute("SELECT * FROM calendar_templates ORDER BY name").fetchall()]

    def save_template(self, name: str, payload: dict) -> dict:
        item_id, now = str(uuid.uuid4()), utc_now()
        with self._lock, self.connection() as conn:
            conn.execute("INSERT INTO calendar_templates(id,name,payload,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at", (item_id, name, _json(payload), now, now))
            row = conn.execute("SELECT * FROM calendar_templates WHERE name=?", (name,)).fetchone()
        return _decode_row(row)

    def list_smart_views(self) -> list[dict]:
        with self.connection() as conn:
            return [_decode_row(row) for row in conn.execute("SELECT * FROM calendar_smart_views ORDER BY name").fetchall()]

    def save_smart_view(self, name: str, filters: dict) -> dict:
        item_id, now = str(uuid.uuid4()), utc_now()
        with self._lock, self.connection() as conn:
            conn.execute("INSERT INTO calendar_smart_views(id,name,filters,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET filters=excluded.filters,updated_at=excluded.updated_at", (item_id, name, _json(filters), now, now))
            row = conn.execute("SELECT * FROM calendar_smart_views WHERE name=?", (name,)).fetchone()
        return _decode_row(row)

    def outbox_status(self) -> dict:
        with self.connection() as conn:
            counts = {row[0]: row[1] for row in conn.execute("SELECT status,COUNT(*) FROM calendar_outbox GROUP BY status").fetchall()}
            accounts = [{key: value for key, value in _decode_row(row).items() if key != "credential_ref"} for row in conn.execute("SELECT * FROM calendar_sync_accounts ORDER BY name").fetchall()]
        return {"counts": counts, "accounts": accounts, "last_sync_at": max((x.get("last_sync_at") or "" for x in accounts), default=None)}

    def save_sync_account(self, name: str, server_url: str, username: str, credential_ref: str) -> dict:
        account_id, now = str(uuid.uuid4()), utc_now()
        with self._lock, self.connection() as conn:
            existing = conn.execute("SELECT id FROM calendar_sync_accounts WHERE server_url=? AND username=?", (server_url, username)).fetchone()
            if existing:
                account_id = existing["id"]
                conn.execute("UPDATE calendar_sync_accounts SET name=?,credential_ref=?,status='ready',last_error=NULL,updated_at=? WHERE id=?", (name, credential_ref, now, account_id))
            else:
                conn.execute("INSERT INTO calendar_sync_accounts(id,name,server_url,username,credential_ref,status,created_at,updated_at) VALUES(?,?,?,?,?,'ready',?,?)", (account_id, name, server_url, username, credential_ref, now, now))
            row = conn.execute("SELECT * FROM calendar_sync_accounts WHERE id=?", (account_id,)).fetchone()
        return _decode_row(row)

    def update_sync_account_status(self, account_id: str, status: str, error: str | None = None) -> None:
        now = utc_now()
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_sync_accounts SET status=?,last_error=?,last_sync_at=CASE WHEN ?='synced' THEN ? ELSE last_sync_at END,updated_at=? WHERE id=?", (status, error, status, now, now, account_id))

    def pending_outbox(self, limit: int = 250) -> list[dict]:
        with self.connection() as conn:
            return [_decode_row(row) for row in conn.execute("SELECT * FROM calendar_outbox WHERE status='pending' ORDER BY created_at LIMIT ?", (limit,)).fetchall()]

    def mark_outbox(self, outbox_id: str, status: str, error: str | None = None) -> None:
        with self._lock, self.connection() as conn:
            conn.execute("UPDATE calendar_outbox SET status=?,attempt_count=attempt_count+1,last_error=?,updated_at=? WHERE id=?", (status, error, utc_now(), outbox_id))

    def change_token(self) -> str:
        """Return a cheap cursor that changes after any local calendar mutation."""
        with self.connection() as conn:
            row = conn.execute(
                "SELECT COALESCE(MAX(updated_at),'') AS latest, COUNT(*) AS total FROM calendar_outbox"
            ).fetchone()
        return f"{row['latest']}:{row['total']}"

    def _outbox(self, conn, entity_type: str, entity_id: str, operation: str, payload: dict):
        outbox_id, now = str(uuid.uuid4()), utc_now()
        conn.execute("INSERT INTO calendar_outbox(id,entity_type,entity_id,operation,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)", (outbox_id, entity_type, entity_id, operation, _json(payload), now, now))
