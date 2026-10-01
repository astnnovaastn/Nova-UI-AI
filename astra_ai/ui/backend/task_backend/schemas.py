from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator, model_validator


TaskKind = Literal["prompt", "research", "action"]
TriggerKind = Literal["manual", "schedule", "event", "webhook"]
Priority = Literal["low", "normal", "high", "urgent"]


class TriggerInput(BaseModel):
    kind: TriggerKind = "manual"
    schedule: Optional[str] = Field(default=None, max_length=200)
    event_name: Optional[str] = Field(default=None, max_length=120)
    every_count: Optional[int] = Field(default=None, ge=1, le=100000)
    filters: dict[str, Any] = Field(default_factory=dict)
    timezone: str = Field(default="Europe/Rome", max_length=80)
    enabled: bool = True

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError("timezone must be a valid IANA timezone") from exc
        return value

    @model_validator(mode="after")
    def validate_trigger(self):
        if self.kind == "schedule" and not self.schedule:
            raise ValueError("scheduled triggers require schedule")
        if self.kind == "event" and not self.event_name:
            raise ValueError("event triggers require event_name")
        if self.kind != "event" and self.every_count is not None:
            raise ValueError("every_count is only valid for event triggers")
        return self


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    instruction: str = Field(min_length=1, max_length=20000)
    kind: TaskKind = "prompt"
    priority: Priority = "normal"
    tags: list[str] = Field(default_factory=list, max_length=30)
    project: str = Field(default="", max_length=120)
    due_at: Optional[datetime] = None
    timezone: str = Field(default="Europe/Rome", max_length=80)
    trigger: TriggerInput = Field(default_factory=TriggerInput)
    checklist: list[str] = Field(default_factory=list, max_length=100)
    dependency_ids: list[str] = Field(default_factory=list, max_length=50)
    metadata: dict[str, Any] = Field(default_factory=dict)
    lifecycle: Literal["draft", "active"] = "active"

    @field_validator("title", "instruction")
    @classmethod
    def clean_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("value may not be blank")
        return value

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, values: list[str]) -> list[str]:
        result: dict[str, str] = {}
        for raw in values:
            value = raw.strip()
            if not value:
                raise ValueError("tags may not be blank")
            result.setdefault(value.casefold(), value[:80])
        return list(result.values())

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError("timezone must be a valid IANA timezone") from exc
        return value

    @field_validator("due_at")
    @classmethod
    def due_has_offset(cls, value: Optional[datetime]):
        if value is not None and value.tzinfo is None:
            raise ValueError("due_at requires an RFC3339 timezone offset")
        return value


class TaskPatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=240)
    instruction: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    kind: Optional[TaskKind] = None
    priority: Optional[Priority] = None
    tags: Optional[list[str]] = Field(default=None, max_length=30)
    project: Optional[str] = Field(default=None, max_length=120)
    due_at: Optional[datetime] = None
    timezone: Optional[str] = Field(default=None, max_length=80)
    trigger: Optional[TriggerInput] = None
    checklist: Optional[list[str]] = Field(default=None, max_length=100)
    dependency_ids: Optional[list[str]] = Field(default=None, max_length=50)
    metadata: Optional[dict[str, Any]] = None
    lifecycle: Optional[Literal["draft", "active", "paused", "completed", "archived"]] = None


class ApprovalDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    note: str = Field(default="", max_length=1000)


class AegisTaskProposal(TaskCreate):
    correlation_id: str = Field(min_length=1, max_length=200)
    risk_class: Literal["low", "medium", "high", "critical"] = "low"
    source: Literal["aegis", "chat", "voice"] = "aegis"


class InternalEvent(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)
    correlation_id: Optional[str] = Field(default=None, max_length=200)
