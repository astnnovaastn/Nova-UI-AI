"""Bounded long-term facts and transcript recall for Gemini Live."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = 2
MAX_STORAGE_BYTES = 16 * 1024
MAX_VALUE_CHARS = 500
MAX_PROMPT_CHARS = 6_000
MAX_EVENT_COUNT = 100
MAX_EVENT_CHARS = 800
VALID_CATEGORIES = {
    "identity", "demographics", "preferences", "projects", "goals",
    "milestones", "relationships", "wishes", "notes",
}

_KEY_RE = re.compile(r"^[a-z][a-z0-9_]{0,63}$")
_TOKEN_RE = re.compile(r"[a-z0-9']+", re.IGNORECASE)
_SECRET_KEY_RE = re.compile(
    r"(?:api_?key|password|passcode|secret|access_?token|refresh_?token|private_?key|cvv|card_?number)",
    re.IGNORECASE,
)
_SECRET_VALUE_RE = re.compile(
    r"(?:AIza[\w-]{20,}|gsk_[\w-]{20,}|sk-[A-Za-z0-9_-]{20,}|\b(?:\d[ -]*?){13,19}\b)"
)
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
_STOPWORDS = {
    "a", "an", "and", "are", "about", "did", "do", "for", "from", "how",
    "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "that",
    "the", "to", "was", "we", "what", "when", "where", "with", "you", "your",
}


def _empty_memory() -> dict[str, Any]:
    return {
        "identity": {}, "demographics": {}, "preferences": {},
        "milestones": {}, "goals": {}, "relationships": {},
        "projects": {}, "wishes": {}, "notes": {},
        "memory_events": [],
        "_meta": {"schema_version": SCHEMA_VERSION},
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _timestamp_rank(value: Any) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def _is_leaf(value: Any) -> bool:
    return isinstance(value, dict) and "value" in value


def _iter_leaves(node: Any, path: tuple[str, ...] = ()) -> Iterable[tuple[tuple[str, ...], dict]]:
    if _is_leaf(node):
        yield path, node
        return
    if not isinstance(node, dict):
        return
    for key, value in node.items():
        if key == "_meta":
            continue
        yield from _iter_leaves(value, path + (str(key),))


def _get_path(root: dict, path: tuple[str, ...]) -> Any:
    current: Any = root
    for part in path:
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _set_path(root: dict, path: tuple[str, ...], value: Any) -> None:
    current = root
    for part in path[:-1]:
        child = current.get(part)
        if not isinstance(child, dict) or _is_leaf(child):
            child = {}
            current[part] = child
        current = child
    current[path[-1]] = value


def _delete_path(root: dict, path: tuple[str, ...]) -> bool:
    parents: list[tuple[dict, str]] = []
    current: Any = root
    for part in path:
        if not isinstance(current, dict) or part not in current:
            return False
        parents.append((current, part))
        current = current[part]
    parent, key = parents[-1]
    del parent[key]
    for container, child_key in reversed(parents[:-1]):
        child = container.get(child_key)
        if isinstance(child, dict) and not child:
            del container[child_key]
    return True


def _canonical_path(category: str, key: str) -> tuple[str, ...]:
    category = category.strip().lower()
    key = key.strip().lower()
    if category == "identity" and key in {"city", "location"}:
        return ("demographics", "location")
    if category == "identity" and key == "nationality":
        return ("demographics", "nationality")
    family_aliases = {
        "mother_name": "mother", "father_name": "father", "sister_name": "sister",
        "brother_name": "brother", "partner_name": "partner",
    }
    if category == "relationships" and key in family_aliases:
        return ("relationships", "family", family_aliases[key])
    if category == "relationships" and key == "good_friend_name":
        return ("relationships", "friends", "good_friend")
    return (category, key)


def _redact_sensitive(text: str) -> str:
    return _SECRET_VALUE_RE.sub("[REDACTED]", text)


class LiveMemoryManager:
    def __init__(
        self,
        *,
        memory_path: Path,
        transcript_path: Path,
        aegis_source: Path | None = None,
        legacy_transcript_path: Path | None = None,
    ) -> None:
        self.memory_path = Path(memory_path)
        self.transcript_path = Path(transcript_path)
        self.aegis_source = Path(aegis_source) if aegis_source else None
        self.legacy_transcript_path = Path(legacy_transcript_path) if legacy_transcript_path else None
        self._lock = threading.RLock()

    def _load_json(self, path: Path, default: dict) -> dict:
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            return value if isinstance(value, dict) else default
        except (OSError, ValueError, TypeError):
            return default

    def _backup(self, path: Path, label: str) -> Path | None:
        if not path.exists():
            return None
        backup_dir = path.parent / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        destination = backup_dir / f"{path.stem}_{label}_{stamp}{path.suffix}"
        shutil.copy2(path, destination)
        return destination

    def _atomic_write(self, path: Path, value: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + f".{os.getpid()}.tmp")
        temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(temporary, path)

    def _normalized(self, data: dict) -> dict:
        result = _empty_memory()
        for key, value in data.items():
            if key == "_meta" and isinstance(value, dict):
                result["_meta"].update(value)
            elif key in VALID_CATEGORIES and isinstance(value, dict):
                result[key] = value
            elif key == "memory_events" and isinstance(value, list):
                result[key] = [item for item in value if isinstance(item, dict)]
        result["_meta"]["schema_version"] = SCHEMA_VERSION
        return result

    def ensure_ready(self) -> dict[str, Any]:
        """Migrate facts and split transcript histories exactly once per source hash."""
        with self._lock:
            memory = self._normalized(self._load_json(self.memory_path, _empty_memory()))
            meta = memory.setdefault("_meta", {})
            changed = False

            if self.aegis_source and self.aegis_source.exists():
                source_hash = _file_hash(self.aegis_source)
                if meta.get("aegis_migration_sha256") != source_hash:
                    self._backup(self.memory_path, "pre_aegis_merge")
                    aegis = self._load_json(self.aegis_source, {})
                    for source_path, source_entry in _iter_leaves(aegis):
                        if len(source_path) < 2:
                            continue
                        target_path = _canonical_path(source_path[0], source_path[-1])
                        existing = _get_path(memory, target_path)
                        if not _is_leaf(existing) or _timestamp_rank(source_entry.get("updated")) > _timestamp_rank(existing.get("updated")):
                            migrated = dict(source_entry)
                            migrated.setdefault("source", "aegis_migration")
                            migrated.setdefault("confidence", 1.0)
                            _set_path(memory, target_path, migrated)
                    meta["aegis_migration_sha256"] = source_hash
                    meta["aegis_migrated_at"] = _now()
                    changed = True

            if self.legacy_transcript_path and self.legacy_transcript_path.exists():
                source_hash = _file_hash(self.legacy_transcript_path)
                if meta.get("transcript_migration_sha256") != source_hash:
                    self._merge_transcripts(self.legacy_transcript_path, self.transcript_path)
                    meta["transcript_migration_sha256"] = source_hash
                    meta["transcript_migrated_at"] = _now()
                    changed = True

            if changed or not self.memory_path.exists():
                meta["last_updated"] = _now()
                self._trim(memory)
                self._atomic_write(self.memory_path, memory)
            return self.stats(memory)

    def _merge_transcripts(self, source_path: Path, target_path: Path) -> None:
        source = self._load_json(source_path, {})
        target = self._load_json(target_path, {"conversation": []})
        source_items = source.get("conversation", [])
        target_items = target.get("conversation", [])
        if not isinstance(source_items, list) or not isinstance(target_items, list):
            return
        self._backup(target_path, "pre_live_merge")
        seen = {
            (
                str(item.get("role") or ""), str(item.get("content") or ""),
                str(item.get("timestamp") or ""), str(item.get("session_id") or ""),
            )
            for item in target_items if isinstance(item, dict)
        }
        for item in source_items:
            if not isinstance(item, dict):
                continue
            signature = (
                str(item.get("role") or ""), str(item.get("content") or ""),
                str(item.get("timestamp") or ""), str(item.get("session_id") or ""),
            )
            if signature not in seen:
                target_items.append(item)
                seen.add(signature)
        target["conversation"] = target_items
        self._atomic_write(target_path, target)

    def _trim(self, memory: dict) -> None:
        # Measure the same indented representation written by _atomic_write so
        # the on-disk limit is real rather than only applying to compact JSON.
        while len(json.dumps(memory, indent=2, ensure_ascii=False).encode("utf-8")) > MAX_STORAGE_BYTES:
            leaves = list(_iter_leaves(memory))
            events = memory.get("memory_events", [])
            if events:
                events.sort(key=lambda item: _timestamp_rank(item.get("updated")))
                events.pop(0)
            elif leaves:
                leaves.sort(key=lambda item: _timestamp_rank(item[1].get("updated")))
                _delete_path(memory, leaves[0][0])
            else:
                break
        events = memory.get("memory_events", [])
        if isinstance(events, list):
            events.sort(key=lambda item: _timestamp_rank(item.get("updated")), reverse=True)
            memory["memory_events"] = events[:MAX_EVENT_COUNT]

    @staticmethod
    def _event_id(event_type: str, key: str) -> str:
        return f"{event_type.strip().lower()}:{key.strip().lower()}"

    def save_event(self, event_type: str, key: str, content: Any, attributes: Any = None, tags: Any = None) -> dict[str, Any]:
        event_type = str(event_type or "").strip().lower()
        key = str(key or "").strip().lower()
        value = _CONTROL_RE.sub("", str(content or "")).strip()
        if not _KEY_RE.fullmatch(event_type) or not _KEY_RE.fullmatch(key):
            return {"status": "rejected", "reason": "event_type_and_key_must_be_snake_case"}
        if not value:
            return {"status": "rejected", "reason": "empty_content"}
        if _SECRET_KEY_RE.search(event_type) or _SECRET_KEY_RE.search(key) or _SECRET_VALUE_RE.search(value):
            return {"status": "rejected", "reason": "sensitive_information"}
        clean_tags = [str(tag).strip()[:48] for tag in (tags or []) if str(tag).strip()] if isinstance(tags, list) else []
        raw_attributes = attributes if isinstance(attributes, dict) else {}
        clean_attributes = {
            str(k).strip().lower()[:48]: _CONTROL_RE.sub("", str(v))[:160]
            for k, v in raw_attributes.items()
            if _KEY_RE.fullmatch(str(k).strip().lower()) and not _SECRET_KEY_RE.search(str(k))
        }
        event = {
            "id": self._event_id(event_type, key), "event_type": event_type, "key": key,
            "content": value[:MAX_EVENT_CHARS], "attributes": clean_attributes,
            "tags": clean_tags[:12], "updated": _now(), "source": "gemini_live", "confidence": 1.0,
        }
        with self._lock:
            memory = self.load()
            events = memory.setdefault("memory_events", [])
            events[:] = [item for item in events if item.get("id") != event["id"]]
            events.append(event)
            memory["_meta"]["last_updated"] = _now()
            self._trim(memory)
            self._atomic_write(self.memory_path, memory)
        return {"status": "saved", "id": event["id"], "event_type": event_type, "key": key}

    def forget_event(self, event_id: str) -> dict[str, Any]:
        event_id = str(event_id or "").strip().lower()
        if not _KEY_RE.fullmatch(event_id.replace(":", "_")):
            return {"status": "rejected", "reason": "invalid_event_id"}
        with self._lock:
            memory = self.load()
            events = memory.setdefault("memory_events", [])
            before = len(events)
            events[:] = [item for item in events if str(item.get("id") or "").lower() != event_id]
            removed = len(events) != before
            if removed:
                memory["_meta"]["last_updated"] = _now()
                self._atomic_write(self.memory_path, memory)
        return {"status": "forgotten" if removed else "not_found", "id": event_id}

    def load(self) -> dict:
        with self._lock:
            return self._normalized(self._load_json(self.memory_path, _empty_memory()))

    def save_fact(self, category: str, key: str, value: Any) -> dict[str, Any]:
        category = str(category or "").strip().lower()
        key = str(key or "").strip().lower()
        cleaned = _CONTROL_RE.sub("", str(value or "")).strip()
        if category not in VALID_CATEGORIES:
            return {"status": "rejected", "reason": "invalid_category"}
        if not _KEY_RE.fullmatch(key):
            return {"status": "rejected", "reason": "invalid_key"}
        if not cleaned:
            return {"status": "rejected", "reason": "empty_value"}
        if _SECRET_KEY_RE.search(key) or _SECRET_VALUE_RE.search(cleaned):
            return {"status": "rejected", "reason": "sensitive_information"}
        cleaned = cleaned[:MAX_VALUE_CHARS].rstrip()
        path = _canonical_path(category, key)
        with self._lock:
            memory = self.load()
            _set_path(memory, path, {
                "value": cleaned, "updated": _now(),
                "confidence": 1.0, "source": "gemini_live",
            })
            memory["_meta"]["last_updated"] = _now()
            self._trim(memory)
            self._atomic_write(self.memory_path, memory)
        return {"status": "saved", "category": path[0], "key": ".".join(path[1:])}

    def forget_fact(self, category: str, key: str) -> dict[str, Any]:
        category = str(category or "").strip().lower()
        key = str(key or "").strip().lower()
        if category not in VALID_CATEGORIES or not _KEY_RE.fullmatch(key):
            return {"status": "rejected", "reason": "invalid_specific_fact"}
        path = _canonical_path(category, key)
        with self._lock:
            memory = self.load()
            removed = _delete_path(memory, path)
            if removed:
                memory["_meta"]["last_updated"] = _now()
                self._atomic_write(self.memory_path, memory)
        return {
            "status": "forgotten" if removed else "not_found",
            "category": path[0], "key": ".".join(path[1:]),
        }

    def format_for_prompt(self, max_chars: int = MAX_PROMPT_CHARS) -> str:
        memory = self.load()
        priority = {
            "identity": 0, "demographics": 1, "preferences": 2, "goals": 3,
            "projects": 4, "relationships": 5, "wishes": 6, "milestones": 7, "notes": 8,
        }
        leaves = list(_iter_leaves(memory))
        leaves.sort(key=lambda item: (
            priority.get(item[0][0], 99), -_timestamp_rank(item[1].get("updated")), item[0]
        ))
        lines = ["[LONG-TERM USER PROFILE — use naturally, never recite as a list]"]
        for path, entry in leaves:
            value = entry.get("value")
            rendered = json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else str(value)
            line = f"{' / '.join(part.replace('_', ' ') for part in path)}: {rendered}"
            if len("\n".join(lines + [line])) > max_chars:
                continue
            lines.append(line)
        for event in memory.get("memory_events", []):
            line = f"memory event / {event.get('event_type')} / {event.get('key')}: {event.get('content')}"
            if len("\n".join(lines + [line])) > max_chars:
                continue
            lines.append(line)
        return "\n".join(lines) if len(lines) > 1 else ""

    def recall_conversations(self, query: str, limit: int = 5) -> dict[str, Any]:
        cleaned_query = str(query or "").strip()
        if not cleaned_query:
            return {"status": "rejected", "reason": "empty_query", "matches": []}
        limit = max(1, min(int(limit or 5), 5))
        transcript = self._load_json(self.transcript_path, {})
        items = transcript.get("conversation", [])
        if not isinstance(items, list):
            return {"status": "ok", "matches": []}
        terms = {term.lower() for term in _TOKEN_RE.findall(cleaned_query) if term.lower() not in _STOPWORDS}
        phrase = cleaned_query.lower()
        candidates: list[tuple[float, int]] = []
        for index, item in enumerate(items):
            if not isinstance(item, dict) or str(item.get("role") or "").lower() not in {"user", "assistant"}:
                continue
            content = str(item.get("content") or "")
            lowered = content.lower()
            overlap = sum(1 for term in terms if term in lowered)
            if not overlap and phrase not in lowered:
                continue
            score = overlap * 10 + (25 if phrase in lowered else 0) + index / max(len(items), 1)
            candidates.append((score, index))
        candidates.sort(reverse=True)
        matches = []
        used: set[int] = set()
        for _, index in candidates:
            if len(matches) >= limit or index in used:
                continue
            window = []
            for adjacent in range(max(0, index - 1), min(len(items), index + 2)):
                item = items[adjacent]
                if not isinstance(item, dict):
                    continue
                role = str(item.get("role") or "").lower()
                if role not in {"user", "assistant"}:
                    continue
                used.add(adjacent)
                window.append({
                    "role": role,
                    "content": _redact_sensitive(str(item.get("content") or ""))[:1200],
                    "timestamp": str(item.get("timestamp") or ""),
                })
            if window:
                matches.append({"messages": window})
        return {"status": "ok", "query": cleaned_query, "matches": matches}

    def recall_memory(self, query: str, limit: int = 5) -> dict[str, Any]:
        cleaned = str(query or "").strip().lower()
        if not cleaned:
            return {"status": "rejected", "reason": "empty_query", "matches": []}
        terms = [term for term in _TOKEN_RE.findall(cleaned) if term not in _STOPWORDS]
        memory = self.load()
        matches = []
        for event in memory.get("memory_events", []):
            haystack = json.dumps(event, ensure_ascii=False).lower()
            score = sum(term in haystack for term in terms)
            if score:
                matches.append((score, event))
        matches.sort(key=lambda item: (item[0], _timestamp_rank(item[1].get("updated"))), reverse=True)
        return {"status": "ok", "query": cleaned, "matches": [event for _, event in matches[:max(1, min(int(limit or 5), 5))]]}

    def stats(self, memory: dict | None = None) -> dict[str, Any]:
        data = memory if memory is not None else self.load()
        meta = data.get("_meta", {}) if isinstance(data, dict) else {}
        return {
            "schema_version": SCHEMA_VERSION,
            "fact_count": len(list(_iter_leaves(data))),
            "event_count": len(data.get("memory_events", [])) if isinstance(data.get("memory_events"), list) else 0,
            "last_updated": str(meta.get("last_updated") or ""),
            "aegis_migrated": bool(meta.get("aegis_migration_sha256")),
            "transcripts_migrated": bool(meta.get("transcript_migration_sha256")),
        }
