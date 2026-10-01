from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Any, Literal, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator, model_validator


HEX_COLOR = r"^#[0-9A-Fa-f]{6}$"
TagValue = Annotated[str, Field(min_length=1, max_length=80)]
ReminderOffset = Annotated[int, Field(ge=0, le=525600)]


def _clean_tags(values: list[str]) -> list[str]:
    unique: dict[str, str] = {}
    for value in values:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("tags may not be blank")
        unique.setdefault(cleaned.casefold(), cleaned)
    return list(unique.values())


def _require_timezone(value: str) -> str:
    cleaned = value.strip()
    try:
        ZoneInfo(cleaned)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError("timezone must be a valid IANA timezone") from exc
    return cleaned


class CalendarCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="#58B4FF", pattern=HEX_COLOR)
    timezone: str = Field(default="Europe/Rome", min_length=1, max_length=80)


class CalendarPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    color: Optional[str] = Field(default=None, pattern=HEX_COLOR)
    is_visible: Optional[bool] = None
    position: Optional[int] = Field(default=None, ge=0)


class EventInput(BaseModel):
    calendar_id: str
    title: str = Field(min_length=1, max_length=240)
    description: str = Field(default="", max_length=20000)
    location: str = Field(default="", max_length=500)
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    all_day: bool = False
    timezone: str = Field(default="Europe/Rome", max_length=80)
    recurrence: Optional[str] = Field(default=None, max_length=1000)
    tags: list[TagValue] = Field(default_factory=list, max_length=30)
    importance: Literal["normal", "high", "critical"] = "normal"
    color: Optional[str] = Field(default=None, pattern=HEX_COLOR)
    reminder_minutes: list[ReminderOffset] = Field(default_factory=list, max_length=10)
    reminder_channels: list[Literal["in_app", "system"]] = Field(default_factory=lambda: ["in_app"], min_length=1, max_length=2)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title may not be blank")
        return cleaned

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, value: list[str]):
        return _clean_tags(value)

    @field_validator("timezone")
    @classmethod
    def require_timezone(cls, value: str):
        return _require_timezone(value)

    @field_validator("start", "end")
    @classmethod
    def require_offset(cls, value: Optional[datetime]):
        if value is not None and value.tzinfo is None:
            raise ValueError("timed events require an RFC3339 offset")
        return value

    @model_validator(mode="after")
    def validate_interval(self):
        if self.all_day:
            if not self.start_date:
                raise ValueError("all-day events require start_date")
            if self.end_date and self.end_date <= self.start_date:
                raise ValueError("end_date must be after start_date")
        else:
            if not self.start or not self.end:
                raise ValueError("timed events require start and end")
            if self.end <= self.start:
                raise ValueError("end must be after start")
        return self


class EventPatch(BaseModel):
    calendar_id: Optional[str] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=240)
    description: Optional[str] = Field(default=None, max_length=20000)
    location: Optional[str] = Field(default=None, max_length=500)
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    all_day: Optional[bool] = None
    timezone: Optional[str] = Field(default=None, max_length=80)
    recurrence: Optional[str] = Field(default=None, max_length=1000)
    tags: Optional[list[TagValue]] = Field(default=None, max_length=30)
    importance: Optional[Literal["normal", "high", "critical"]] = None
    color: Optional[str] = Field(default=None, pattern=HEX_COLOR)
    reminder_minutes: Optional[list[ReminderOffset]] = Field(default=None, max_length=10)
    reminder_channels: Optional[list[Literal["in_app", "system"]]] = Field(default=None, min_length=1, max_length=2)

    @field_validator("title")
    @classmethod
    def clean_optional_title(cls, value: Optional[str]):
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title may not be blank")
        return cleaned

    @field_validator("tags")
    @classmethod
    def clean_optional_tags(cls, value: Optional[list[str]]):
        return None if value is None else _clean_tags(value)

    @field_validator("timezone")
    @classmethod
    def require_optional_timezone(cls, value: Optional[str]):
        return None if value is None else _require_timezone(value)


class QuickAddRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    timezone: str = Field(default="Europe/Rome", max_length=80)
    locale: str = Field(default="en-GB", max_length=32)
    reference_time: Optional[datetime] = None
    calendar_id: Optional[str] = None


class QuickAddCommit(BaseModel):
    draft_id: str
    patch: dict[str, Any] = Field(default_factory=dict)


class PreferencesPatch(BaseModel):
    timezone: Optional[str] = Field(default=None, max_length=80)
    locale: Optional[str] = Field(default=None, max_length=32)
    week_start: Optional[Literal["monday", "sunday"]] = None
    hour_cycle: Optional[Literal["12", "24"]] = None
    default_calendar_id: Optional[str] = None
    pinned_timezones: Optional[list[str]] = Field(default=None, max_length=4)
    system_notifications: Optional[bool] = None


class TemplateInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    payload: dict[str, Any]


class SmartViewInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    filters: dict[str, Any]
