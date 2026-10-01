"""Durable, structured state for the live News widget."""
from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

NEWS_STATE_FILE = "news_state.json"


def _path(state_dir: Path) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir / NEWS_STATE_FILE


def default_news_widget_state() -> Dict[str, Any]:
    return {"current": {
        "query": "", "display_topic": "", "display_subtopic": "", "primary_story": None,
        "related_stories": [], "full_search_results": [], "generated_at": "", "loading": False, "error": "", "no_results": False,
        "history_preview": [], "view_mode": "current", "request_id": "", "latest_request_id": "", "source": "",
    }, "history": [], "archived_history": []}


def load_news_widget_state(state_dir: Path) -> Dict[str, Any]:
    try:
        data = json.loads(_path(state_dir).read_text(encoding="utf-8"))
        state = default_news_widget_state()
        state["current"].update(data.get("current") or {})
        state["history"] = list(data.get("history") or [])
        state["archived_history"] = list(data.get("archived_history") or [])
        return state
    except (OSError, ValueError, TypeError):
        return default_news_widget_state()


def save_news_widget_state(state_dir: Path, state: Dict[str, Any]) -> None:
    path = _path(state_dir)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def _record_id(item: Dict[str, Any]) -> str:
    return str(item.get("research_id") or item.get("id") or item.get("request_id") or "")


def get_history_preview(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [{key: item.get(key) or "" for key in ("request_id", "query", "display_topic", "display_subtopic", "saved_at", "research_id")}
            | {"id": _record_id(item)}
            | {"story_count": len(item.get("related_stories") or [])}
            for item in list((state or {}).get("history") or [])[:12]]


def _history_item(current: Dict[str, Any]) -> Dict[str, Any]:
    record = deepcopy(current)
    record_id = _record_id(record)
    record["research_id"] = record_id
    record["id"] = record_id
    record.setdefault("created_at", record.get("generated_at") or datetime.now().isoformat())
    record["updated_at"] = record.get("updated_at") or record.get("generated_at") or datetime.now().isoformat()
    record["saved_at"] = datetime.now().isoformat()
    record["loading"] = False
    record["error"] = ""
    record["no_results"] = False
    return record


def apply_news_widget_command(state: Dict[str, Any], message: Dict[str, Any], state_dir: Path) -> Dict[str, Any]:
    state = deepcopy(state or default_news_widget_state())
    current = dict(state.get("current") or {})
    command = str(message.get("command") or "").lower()
    request_id = str(message.get("request_id") or "")
    if command == "show_news" and current.get("latest_request_id") and request_id != current["latest_request_id"]:
        return state
    if command == "set_loading" and request_id:
        current["latest_request_id"] = request_id
    for field in ("query", "display_topic", "display_subtopic", "primary_story", "related_stories", "full_search_results", "generated_at", "updated_at", "created_at", "research_id", "briefing_sections", "timeline", "context", "what_to_watch", "research_state", "continuation", "expanding", "loading", "error", "no_results", "view_mode", "request_id", "source"):
        if field in message and message[field] is not None:
            current[field] = deepcopy(message[field])
    if command == "clear_current":
        current = default_news_widget_state()["current"]
    elif command == "show_history":
        current["view_mode"] = "history"
    elif command in {"show_news", "set_loading", "show_current", "restore_latest", "restore_news_result"}:
        current["view_mode"] = "current"
    # Only completed, renderable briefings belong in History. Terminal error
    # and no-results states must remain visible but must not masquerade as a
    # restorable successful search.
    if command in {"show_news", "restore_latest", "restore_news_result", "research_more"} and current.get("request_id") and current.get("primary_story"):
        record_id = _record_id(current)
        state["history"] = [_history_item(current)] + [item for item in state.get("history", []) if _record_id(item) != record_id]
        state["history"] = state["history"][:25]
    current["history_preview"] = get_history_preview(state)
    state["current"] = current
    return state


def build_frontend_payload(state: Dict[str, Any]) -> Dict[str, Any]:
    current = dict((state or {}).get("current") or {})
    return {"type": "widget_control", "widget": "news", "command": "show_history" if current.get("view_mode") == "history" else "set_loading" if current.get("loading") else "show_news", "source": current.get("source") or "server_state", **current}


def restore_history_entry(state: Dict[str, Any], state_dir: Path, request_id: str) -> Dict[str, Any]:
    state = deepcopy(state or default_news_widget_state())
    for item in state.get("history", []):
        if request_id in {str(item.get("request_id") or ""), _record_id(item)}:
            state["current"] = {**default_news_widget_state()["current"], **deepcopy(item), "view_mode": "current", "history_preview": get_history_preview(state)}
            return state
    raise KeyError(request_id)


def restore_latest_entry(state: Dict[str, Any], state_dir: Path) -> Dict[str, Any]:
    history = list((state or {}).get("history") or [])
    if not history:
        raise KeyError("latest")
    return restore_history_entry(state, state_dir, str(history[0].get("request_id") or ""))


def find_history_matches(state: Dict[str, Any], state_dir: Path, query: str, limit: int = 8) -> List[Dict[str, Any]]:
    needle = str(query or "").strip().lower()
    return [item for item in state.get("history", []) if needle in " ".join(map(str, (item.get("query"), item.get("display_topic"), item.get("display_subtopic")))).lower()][:limit]


def delete_history_entry(state: Dict[str, Any], state_dir: Path, request_id: str) -> Dict[str, Any]:
    state = deepcopy(state or default_news_widget_state())
    before = len(state.get("history", [])) + len(state.get("archived_history", []))
    state["history"] = [item for item in state["history"] if request_id not in {str(item.get("request_id") or ""), _record_id(item)}]
    state["archived_history"] = [item for item in state.get("archived_history", []) if request_id not in {str(item.get("request_id") or ""), _record_id(item)}]
    if len(state["history"]) + len(state["archived_history"]) == before:
        raise KeyError(request_id)
    state["current"]["view_mode"] = "history"
    state["current"]["history_preview"] = get_history_preview(state)
    return state


def archive_history_entry(state: Dict[str, Any], state_dir: Path, request_id: str) -> Dict[str, Any]:
    state = deepcopy(state or default_news_widget_state())
    matched = [item for item in state.get("history", []) if request_id in {str(item.get("request_id") or ""), _record_id(item)}]
    if not matched:
        raise KeyError(request_id)
    state["history"] = [item for item in state["history"] if item not in matched]
    state["archived_history"] = [{**item, "archived_at": datetime.now().isoformat()} for item in matched] + list(state.get("archived_history") or [])
    state["current"]["view_mode"] = "history"
    state["current"]["history_preview"] = get_history_preview(state)
    return state
