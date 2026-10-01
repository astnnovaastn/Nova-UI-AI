from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


SEARCH_STATE_FILE = "search_state.json"


def sanitize_search_answer(value: Any) -> str:
    """Remove legacy transport labels that must never reach Search widget UI."""
    return re.sub(
        r"^(?:(?:SEARCH[\s_-]*RESULT)\s*:?\s*)+",
        "",
        str(value or "").strip(),
        flags=re.IGNORECASE,
    ).strip()


def _ensure_dir(state_dir: Path) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir


def _state_path(state_dir: Path) -> Path:
    return _ensure_dir(state_dir) / SEARCH_STATE_FILE


def default_search_widget_state() -> Dict[str, Any]:
    return {
        "current": {
            "query": "",
            "display_topic": "",
            "display_subtopic": "",
            "answer": "",
            "results": [],
            "search_type": "",
            "loading": False,
            "error": "",
            "history_preview": [],
            "view_mode": "current",
            "original_transcript": "",
            "request_id": "",
            "latest_request_id": "",
            "source": "",
        },
        "history": [],
    }


def load_search_widget_state(state_dir: Path) -> Dict[str, Any]:
    path = _state_path(state_dir)
    if not path.exists():
        return default_search_widget_state()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        state = default_search_widget_state()
        state["current"].update(data.get("current") or {})
        state["history"] = list(data.get("history") or [])
        state["current"]["answer"] = sanitize_search_answer(state["current"].get("answer"))
        for item in state["history"]:
            item["answer"] = sanitize_search_answer(item.get("answer"))
        return state
    except Exception:
        return default_search_widget_state()


def save_search_widget_state(state_dir: Path, state: Dict[str, Any]) -> None:
    path = _state_path(state_dir)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _compact_history_item(current: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "request_id": current.get("request_id") or "",
        "query": current.get("query") or "",
        "display_topic": current.get("display_topic") or "",
        "display_subtopic": current.get("display_subtopic") or "",
        "answer": sanitize_search_answer(current.get("answer")),
        "results": list(current.get("results") or []),
        "search_type": current.get("search_type") or "",
        "source": current.get("source") or "",
        "original_transcript": current.get("original_transcript") or "",
        "saved_at": datetime.now().isoformat(),
    }


def _rebuild_preview(state: Dict[str, Any]) -> None:
    state["current"]["history_preview"] = get_history_preview(state)


def apply_search_widget_command(state: Dict[str, Any], message: Dict[str, Any], state_dir: Path) -> Dict[str, Any]:
    state = deepcopy(state or default_search_widget_state())
    current = dict(state.get("current") or {})
    command = str(message.get("command") or "").strip().lower()
    incoming_request_id = str(message.get("request_id") or "").strip()
    latest_request_id = str(current.get("latest_request_id") or "").strip()

    if command == "show_results" and latest_request_id and incoming_request_id != latest_request_id:
        # A slower, older request completed after a newer user request began.
        # Return the unchanged snapshot so it cannot replace the latest result.
        return state

    if command == "set_loading" and incoming_request_id:
        current["latest_request_id"] = incoming_request_id

    fields = [
        "query",
        "display_topic",
        "display_subtopic",
        "answer",
        "results",
        "search_type",
        "loading",
        "error",
        "view_mode",
        "original_transcript",
        "request_id",
        "source",
    ]
    for field in fields:
        if field in message and message.get(field) is not None:
            current[field] = (
                sanitize_search_answer(message.get(field))
                if field == "answer"
                else message.get(field)
            )

    if command == "clear_current":
        current = default_search_widget_state()["current"]
        current["history_preview"] = get_history_preview(state)
    elif command == "show_history":
        current["view_mode"] = "history"
    elif command in {"show_current", "restore_latest", "restore_search_result", "show_results", "set_loading"}:
        current["view_mode"] = "current"

    should_store = bool(current.get("request_id")) and command in {"show_results", "restore_latest", "restore_search_result"}
    if should_store:
        history = [item for item in state.get("history", []) if item.get("request_id") != current.get("request_id")]
        history.insert(0, _compact_history_item(current))
        state["history"] = history[:25]

    state["current"] = current
    _rebuild_preview(state)
    return state


def build_frontend_payload(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    current = dict((state or {}).get("current") or {})
    if not current:
        return None
    return {
        "type": "widget_control",
        "widget": "search",
        "command": (
            "show_history"
            if current.get("view_mode") == "history"
            else "set_loading" if current.get("loading") else "show_results"
        ),
        "source": current.get("source") or "server_state",
        **current,
    }


def get_history_preview(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    history = list((state or {}).get("history") or [])
    preview = []
    for item in history[:12]:
        preview.append({
            "request_id": item.get("request_id") or "",
            "query": item.get("query") or "",
            "display_topic": item.get("display_topic") or "",
            "display_subtopic": item.get("display_subtopic") or "",
            "saved_at": item.get("saved_at") or "",
        })
    return preview


def restore_history_entry(state: Dict[str, Any], state_dir: Path, request_id: str) -> Dict[str, Any]:
    state = deepcopy(state or default_search_widget_state())
    for item in state.get("history", []):
        if str(item.get("request_id") or "") == request_id:
            state["current"] = {
                **default_search_widget_state()["current"],
                **item,
                "view_mode": "current",
                "history_preview": get_history_preview(state),
            }
            return state
    raise KeyError(request_id)


def restore_latest_entry(state: Dict[str, Any], state_dir: Path) -> Dict[str, Any]:
    history = list((state or {}).get("history") or [])
    if not history:
        raise KeyError("latest")
    return restore_history_entry(state, state_dir, str(history[0].get("request_id") or ""))


def find_history_matches(state: Dict[str, Any], state_dir: Path, query: str, limit: int = 8) -> List[Dict[str, Any]]:
    lowered = str(query or "").strip().lower()
    matches = []
    for item in (state or {}).get("history", []):
        haystack = " ".join([
            str(item.get("query") or ""),
            str(item.get("display_topic") or ""),
            str(item.get("display_subtopic") or ""),
            str(item.get("answer") or ""),
        ]).lower()
        if lowered in haystack:
            matches.append(item)
        if len(matches) >= limit:
            break
    return matches


def resolve_history_request_id(state: Dict[str, Any], state_dir: Path, query: str) -> Optional[str]:
    matches = find_history_matches(state, state_dir, query, limit=1)
    if not matches:
        return None
    return str(matches[0].get("request_id") or "") or None


def delete_history_entry(state: Dict[str, Any], state_dir: Path, request_id: str) -> Dict[str, Any]:
    state = deepcopy(state or default_search_widget_state())
    history = [item for item in state.get("history", []) if str(item.get("request_id") or "") != request_id]
    if len(history) == len(state.get("history", [])):
        raise KeyError(request_id)
    state["history"] = history
    state.setdefault("current", {})["view_mode"] = "history"
    _rebuild_preview(state)
    return state
