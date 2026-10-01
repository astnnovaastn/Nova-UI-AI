from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from calendar_backend.quick_add import parse_quick_add
from calendar_backend.store import CalendarStore, CalendarStoreError


@pytest.fixture()
def store(tmp_path):
    instance = CalendarStore(tmp_path / "calendar")
    instance.initialize()
    return instance


def test_initializes_default_calendar_and_european_preferences(store):
    calendars = store.list_calendars()
    assert len(calendars) == 1
    assert calendars[0]["name"] == "Personal"
    assert store.preferences()["week_start"] == "monday"
    assert store.preferences()["hour_cycle"] == "24"


def test_calendar_crud_and_last_calendar_guard(store):
    personal = store.list_calendars()[0]
    work = store.create_calendar({"name": "Work", "color": "#34A853", "timezone": "Europe/Rome"})
    renamed = store.update_calendar(work["id"], {"name": "Projects", "is_visible": False})
    assert renamed["name"] == "Projects"
    assert renamed["is_visible"] is False
    store.delete_calendar(work["id"], None, True)
    with pytest.raises(CalendarStoreError) as error:
        store.delete_calendar(personal["id"], None, True)
    assert error.value.code == "LAST_CALENDAR"


def test_timed_event_reminders_search_and_soft_delete(store):
    calendar_id = store.list_calendars()[0]["id"]
    start = datetime(2026, 7, 22, 9, 30, tzinfo=timezone.utc)
    created = store.create_event({
        "calendar_id": calendar_id, "title": "Architecture review", "description": "Calendar backend",
        "location": "Studio", "start": start, "end": start + timedelta(hours=1), "all_day": False,
        "timezone": "Europe/Rome", "tags": ["planning"], "importance": "high",
        "reminder_minutes": [15], "reminder_channels": ["in_app", "system"],
    })
    assert created["reminders"][0]["minutes_before"] == 15
    matches = store.list_events((start - timedelta(hours=1)).isoformat(), (start + timedelta(hours=2)).isoformat(), "Architecture")
    assert [item["id"] for item in matches] == [created["id"]]
    updated = store.update_event(
        created["id"],
        {
            "title": "Architecture checkpoint",
            "description": "Bring the revised architecture notes.",
            "location": "https://meet.example.test/astra",
            "tags": ["planning", "review"],
            "reminder_minutes": [5, 30],
            "reminder_channels": ["in_app"],
        },
        created["version"],
    )
    assert updated["version"] == created["version"] + 1
    assert updated["start_at"] == created["start_at"]
    assert updated["end_at"] == created["end_at"]
    assert updated["description"] == "Bring the revised architecture notes."
    assert updated["location"] == "https://meet.example.test/astra"
    assert updated["tags"] == ["planning", "review"]
    assert [item["minutes_before"] for item in updated["reminders"]] == [30, 5]
    assert all(item["channels"] == ["in_app"] for item in updated["reminders"])
    with pytest.raises(CalendarStoreError) as error:
        store.update_event(created["id"], {"title": "Stale"}, created["version"])
    assert error.value.code == "EVENT_VERSION_CONFLICT"
    store.delete_event(created["id"], updated["version"])
    assert store.list_events(None, None) == []


def test_all_day_event_uses_exclusive_end_date(store):
    event = store.create_event({
        "calendar_id": store.list_calendars()[0]["id"], "title": "Local holiday", "all_day": True,
        "start_date": date(2026, 8, 15), "end_date": date(2026, 8, 16), "timezone": "Europe/Rome",
    })
    assert event["start_date"] == "2026-08-15"
    assert event["end_date"] == "2026-08-16"
    assert event["start_at"] is None


def test_quick_add_is_review_first_and_commit_is_idempotent(store):
    parsed = parse_quick_add("Project review tomorrow at 14:30 for 45 minutes", "Europe/Rome", datetime(2026, 7, 20, 10, tzinfo=timezone.utc))
    assert parsed["requires_confirmation"] is True
    assert parsed["title"] == "Project review"
    draft = store.save_quick_draft("Project review tomorrow at 14:30 for 45 minutes", parsed, store.list_calendars()[0]["id"])
    first = store.commit_quick_draft(draft["id"], {})
    second = store.commit_quick_draft(draft["id"], {})
    assert first["id"] == second["id"]
    assert len(store.list_events(None, None)) == 1


def test_smart_views_templates_and_suggested_support_data(store):
    template = store.save_template("Focus block", {"duration": 90, "tags": ["focus"]})
    smart_view = store.save_smart_view("Deep work", {"tags": ["focus"], "importance": "high"})
    assert store.list_templates()[0]["id"] == template["id"]
    assert store.list_smart_views()[0]["id"] == smart_view["id"]


def test_change_cursor_advances_after_mutation(store):
    before = store.change_token()
    store.create_event({
        "calendar_id": store.list_calendars()[0]["id"], "title": "Realtime cursor",
        "start": datetime(2026, 7, 24, 9, tzinfo=timezone.utc),
        "end": datetime(2026, 7, 24, 10, tzinfo=timezone.utc), "timezone": "Europe/Rome",
    })
    assert store.change_token() != before


def test_caldav_account_metadata_never_exposes_credential_reference(store):
    account = store.save_sync_account("Work", "https://calendar.example.test/dav", "astra", "session:secret-ref")
    assert account["credential_ref"] == "session:secret-ref"
    public = store.outbox_status()["accounts"][0]
    assert public["status"] == "ready"
    assert "credential_ref" not in public


def test_weekly_recurrence_expands_inside_requested_window(store):
    calendar_id = store.list_calendars()[0]["id"]
    store.create_event({
        "calendar_id": calendar_id, "title": "Weekly studio review",
        "start": datetime(2026, 7, 1, 9, tzinfo=timezone.utc),
        "end": datetime(2026, 7, 1, 10, tzinfo=timezone.utc),
        "timezone": "Europe/Rome", "recurrence": "weekly",
    })
    occurrences = store.list_events("2026-07-20T00:00:00+00:00", "2026-08-01T00:00:00+00:00")
    assert [item["start_at"][:10] for item in occurrences] == ["2026-07-22", "2026-07-29"]
    assert all(item["series_id"] for item in occurrences)


def test_reminder_claim_is_single_consumer_and_recurring_ack_reschedules(store):
    event = store.create_event({
        "calendar_id": store.list_calendars()[0]["id"], "title": "Recurring reminder",
        "start": datetime(2020, 1, 1, 9, tzinfo=timezone.utc),
        "end": datetime(2020, 1, 1, 10, tzinfo=timezone.utc), "timezone": "Europe/Rome",
        "recurrence": "daily", "reminder_minutes": [0], "reminder_channels": ["in_app", "system"],
    })
    claimed = store.claim_due_reminders()
    assert claimed[0]["event_id"] == event["id"]
    assert store.claim_due_reminders() == []
    store.mark_reminder(claimed[0]["id"], True)
    assert store.claim_due_reminders() == []
    with store.connection() as conn:
        row = conn.execute("SELECT delivered,next_fire_at FROM calendar_reminders WHERE id=?", (claimed[0]["id"],)).fetchone()
    assert row["delivered"] == 0
    assert datetime.fromisoformat(row["next_fire_at"].replace("Z", "+00:00")) > datetime.now(timezone.utc)


def test_recurrence_preserves_rome_wall_time_across_dst_gap_and_overlap(store):
    zone = ZoneInfo("Europe/Rome"); calendar_id = store.list_calendars()[0]["id"]
    spring = store.create_event({
        "calendar_id": calendar_id, "title": "Spring weekly",
        "start": datetime(2026, 3, 22, 2, 30, tzinfo=zone), "end": datetime(2026, 3, 22, 3, 30, tzinfo=zone),
        "timezone": "Europe/Rome", "recurrence": "weekly",
    })
    spring_items = [item for item in store.list_events("2026-03-20T00:00:00Z", "2026-04-12T00:00:00Z") if item["series_id"] == spring["id"]]
    assert [(datetime.fromisoformat(item["start_at"]).day, datetime.fromisoformat(item["start_at"]).hour, datetime.fromisoformat(item["start_at"]).utcoffset()) for item in spring_items] == [
        (22, 2, timedelta(hours=1)), (29, 3, timedelta(hours=2)), (5, 2, timedelta(hours=2)),
    ]
    autumn = store.create_event({
        "calendar_id": calendar_id, "title": "Autumn weekly",
        "start": datetime(2026, 10, 18, 2, 30, tzinfo=zone), "end": datetime(2026, 10, 18, 3, 30, tzinfo=zone),
        "timezone": "Europe/Rome", "recurrence": "weekly",
    })
    autumn_items = [item for item in store.list_events("2026-10-17T00:00:00Z", "2026-11-02T00:00:00Z") if item["series_id"] == autumn["id"]]
    assert [datetime.fromisoformat(item["start_at"]).utcoffset() for item in autumn_items] == [timedelta(hours=2), timedelta(hours=2), timedelta(hours=1)]
