from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


NOTES_STATE_FILE = "notes_state.json"


def prepare_notes_state_dir(state_dir: Path, legacy_dirs: Optional[List[Path]] = None) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    for legacy in legacy_dirs or []:
        if legacy.exists():
            legacy_file = legacy / NOTES_STATE_FILE
            target_file = state_dir / NOTES_STATE_FILE
            if legacy_file.exists() and not target_file.exists():
                target_file.write_text(legacy_file.read_text(encoding="utf-8"), encoding="utf-8")
    return state_dir


def _state_path(state_dir: Path) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir / NOTES_STATE_FILE


def load_notes_state(state_dir: Path) -> Dict[str, Any]:
    path = _state_path(state_dir)
    if not path.exists():
        return {"notes": [], "summaries": []}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"notes": [], "summaries": []}


def _save_notes_state(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]]) -> None:
    _state_path(state_dir).write_text(
        json.dumps({"notes": notes, "summaries": summaries}, indent=2),
        encoding="utf-8",
    )


def add_note(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]], content: str, category: str = "") -> Dict[str, Any]:
    note = {
        "id": uuid.uuid4().hex,
        "content": content,
        "category": category,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    next_notes = list(notes) + [note]
    _save_notes_state(state_dir, next_notes, list(summaries))
    return note


def update_note(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]], note_id: str, content: str, category: str = "") -> Dict[str, Any]:
    updated = None
    next_notes = []
    for note in notes:
        if str(note.get("id") or "") == note_id:
            updated = {
                **note,
                "content": content,
                "category": category,
                "updated_at": datetime.now().isoformat(),
            }
            next_notes.append(updated)
        else:
            next_notes.append(note)
    if updated is None:
        raise KeyError(note_id)
    _save_notes_state(state_dir, next_notes, list(summaries))
    return updated


def delete_note(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]], note_id: str) -> List[Dict[str, Any]]:
    next_notes = [note for note in notes if str(note.get("id") or "") != note_id]
    if len(next_notes) == len(notes):
        raise KeyError(note_id)
    _save_notes_state(state_dir, next_notes, list(summaries))
    return next_notes


def clear_notes(state_dir: Path, summaries: List[Dict[str, Any]]) -> None:
    _save_notes_state(state_dir, [], list(summaries))


def add_summary(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]], content: str, summary_type: str = "single-note", tags: Optional[List[str]] = None) -> Dict[str, Any]:
    summary = {
        "id": uuid.uuid4().hex,
        "content": content,
        "type": summary_type,
        "tags": list(tags or []),
        "created_at": datetime.now().isoformat(),
    }
    next_summaries = list(summaries) + [summary]
    _save_notes_state(state_dir, list(notes), next_summaries)
    return summary


def delete_summary(state_dir: Path, notes: List[Dict[str, Any]], summaries: List[Dict[str, Any]], summary_id: str) -> List[Dict[str, Any]]:
    next_summaries = [summary for summary in summaries if str(summary.get("id") or "") != summary_id]
    if len(next_summaries) == len(summaries):
        raise KeyError(summary_id)
    _save_notes_state(state_dir, list(notes), next_summaries)
    return next_summaries


def find_matching_note(notes: List[Dict[str, Any]], query: str) -> Optional[Dict[str, Any]]:
    lowered = str(query or "").strip().lower()
    for note in notes:
        if lowered in str(note.get("content") or "").lower():
            return note
    return None
