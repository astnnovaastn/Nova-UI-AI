from __future__ import annotations

import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


WEEKDAYS = {
    "monday": 0, "mon": 0, "tuesday": 1, "tue": 1, "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3, "friday": 4, "fri": 4, "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6,
}


def _next_weekday(now: datetime, weekday: int) -> datetime:
    delta = (weekday - now.weekday()) % 7
    if delta == 0:
        delta = 7
    return now + timedelta(days=delta)


def parse_quick_add(text: str, timezone: str, reference_time: datetime | None = None) -> dict:
    """Deterministic, review-first parser. It never performs writes."""
    zone = ZoneInfo(timezone)
    now = reference_time or datetime.now(zone)
    if now.tzinfo is None:
        now = now.replace(tzinfo=zone)
    else:
        now = now.astimezone(zone)
    raw = " ".join(text.strip().split())
    lowered = raw.lower()
    target = now
    assumptions: list[str] = []
    ambiguities: list[dict] = []

    if re.search(r"\btomorrow\b", lowered):
        target += timedelta(days=1)
    elif re.search(r"\btoday\b", lowered):
        pass
    else:
        weekday_match = re.search(r"\b(" + "|".join(WEEKDAYS) + r")\b", lowered)
        if weekday_match:
            target = _next_weekday(now, WEEKDAYS[weekday_match.group(1)])
        else:
            assumptions.append("No date was provided; using today.")

    time_match = re.search(r"\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", lowered)
    hour, minute = 9, 0
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2) or 0)
        meridiem = time_match.group(3)
        if meridiem == "pm" and hour < 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0
        elif not meridiem and hour <= 12:
            ambiguities.append({"field": "start", "message": "Time may be morning or evening."})
    else:
        assumptions.append("No time was provided; using 09:00.")

    start = target.replace(hour=min(hour, 23), minute=min(minute, 59), second=0, microsecond=0)
    if start < now and not re.search(r"\b(today|tomorrow|" + "|".join(WEEKDAYS) + r")\b", lowered):
        start += timedelta(days=1)

    duration_match = re.search(r"\b(?:for\s+)?(\d+)\s*(minutes?|mins?|hours?|hrs?)\b", lowered)
    duration = 60
    if duration_match:
        amount = int(duration_match.group(1))
        duration = amount * 60 if duration_match.group(2).startswith(("hour", "hr")) else amount
    title = raw
    removals = [
        r"\b(?:today|tomorrow)\b", r"\b(?:" + "|".join(WEEKDAYS) + r")\b",
        r"\b(?:for\s+)?\d+\s*(?:minutes?|mins?|hours?|hrs?)\b",
        r"\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b",
    ]
    for pattern in removals:
        title = re.sub(pattern, " ", title, flags=re.IGNORECASE)
    title = re.sub(r"\s+", " ", title).strip(" ,.-") or "New event"
    confidence = max(0.45, 0.96 - 0.12 * len(assumptions) - 0.15 * len(ambiguities))
    return {
        "title": title,
        "start": start.isoformat(),
        "end": (start + timedelta(minutes=duration)).isoformat(),
        "timezone": timezone,
        "all_day": False,
        "confidence": round(confidence, 2),
        "source": "deterministic",
        "assumptions": assumptions,
        "ambiguities": ambiguities,
        "requires_confirmation": True,
    }
