"""Durable installation-level layouts for the Live News Briefing."""
from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

LAYOUT_FILE = "news_layouts.json"
SCHEMA_VERSION = 4
DEFAULT_LAYOUT: Dict[str, Any] = {
    "id": "default-aegis", "name": "Default AEGIS", "schemaVersion": SCHEMA_VERSION,
    "grid": {"columns": 12, "gap": 14},
    "globalSettings": {"contentDensity": "balanced", "mediaDensity": "balanced", "textScale": "normal", "sectionGap": "normal", "animations": "subtle"},
    "blocks": [
        {"id": "top-story", "kind": "topStoryLabel", "binding": "topStoryLabel", "layout": {"desktop": {"x": 0, "y": 0, "w": 7, "minRows": 1}}},
        {"id": "headline", "kind": "headline", "binding": "headline", "layout": {"desktop": {"x": 0, "y": 1, "w": 7, "minRows": 3}}},
        {"id": "metadata", "kind": "metadata", "binding": "metadata", "layout": {"desktop": {"x": 0, "y": 4, "w": 7, "minRows": 1}}},
        {"id": "intro", "kind": "intro", "binding": "intro", "layout": {"desktop": {"x": 0, "y": 5, "w": 7, "minRows": 4}}},
        {"id": "hero", "kind": "heroCarousel", "binding": "heroMedia", "layout": {"desktop": {"x": 7, "y": 0, "w": 5, "minRows": 7}}, "settings": {"maxItems": 4}},
        {"id": "section-one", "kind": "dynamicSection", "binding": "dynamicSection", "layout": {"desktop": {"x": 0, "y": 10, "w": 7, "minRows": 4}}, "settings": {"depth": "detailed", "purpose": "auto"}},
        {"id": "supporting", "kind": "supportingImage", "binding": "supportingMedia", "layout": {"desktop": {"x": 7, "y": 10, "w": 5, "minRows": 4}}},
        {"id": "section-two", "kind": "dynamicSection", "binding": "dynamicSection", "layout": {"desktop": {"x": 0, "y": 15, "w": 12, "minRows": 4}}, "settings": {"purpose": "analysis"}},
        {"id": "section-three", "kind": "dynamicSection", "binding": "dynamicSection", "layout": {"desktop": {"x": 0, "y": 20, "w": 7, "minRows": 4}}, "settings": {"purpose": "impact"}},
        {"id": "insight", "kind": "quote", "binding": "insight", "layout": {"desktop": {"x": 7, "y": 20, "w": 5, "minRows": 3}}},
        {"id": "section-four", "kind": "dynamicSection", "binding": "dynamicSection", "layout": {"desktop": {"x": 0, "y": 25, "w": 12, "minRows": 4}}, "settings": {"purpose": "future"}},
        {"id": "watch", "kind": "whatToWatch", "binding": "whatToWatch", "layout": {"desktop": {"x": 0, "y": 30, "w": 12, "minRows": 2}}},
        {"id": "related", "kind": "relatedCoverage", "binding": "relatedCoverage", "layout": {"desktop": {"x": 0, "y": 33, "w": 12, "minRows": 3}}},
        {"id": "sources", "kind": "sourceCoverage", "binding": "sourceCoverage", "layout": {"desktop": {"x": 0, "y": 37, "w": 12, "minRows": 2}}},
        {"id": "full-search", "kind": "fullSearchAction", "binding": "fullSearchAction", "layout": {"desktop": {"x": 0, "y": 40, "w": 4, "minRows": 1}}},
    ],
}

_BLOCK_LABELS = {
    "topStoryLabel": "Top Story Label", "headline": "Headline", "metadata": "Metadata", "intro": "Intro / Summary",
    "text": "Text Box", "dynamicSection": "Dynamic News Section", "timeline": "Timeline", "quote": "Quote / Insight",
    "whatToWatch": "What To Watch", "list": "List Box", "heroCarousel": "Hero Slideshow", "supportingImage": "Supporting Image",
    "imageGallery": "Image Gallery", "relatedCoverage": "Related Coverage", "sourceCoverage": "Source Coverage",
    "fullSearchAction": "Full Search Link", "divider": "Divider", "group": "Container / Group",
}


def _migrate_layout(layout: Dict[str, Any]) -> Dict[str, Any]:
    """Upgrade persisted presentation-only state without changing News data."""
    result = deepcopy(layout)
    if result.get("id") == "default-aegis" and int(result.get("schemaVersion") or 1) < SCHEMA_VERSION:
        return deepcopy(DEFAULT_LAYOUT)
    if int(result.get("schemaVersion") or 1) >= SCHEMA_VERSION:
        return result
    result["schemaVersion"] = SCHEMA_VERSION
    result["globalSettings"] = {
        "fontFamily": "theme", "contentDensity": "balanced", "mediaDensity": "balanced",
        "textScale": "normal", "sectionGap": "normal", "animations": "subtle",
        **(result.get("globalSettings") or {}),
    }
    for block in result.get("blocks") or []:
        if not isinstance(block, dict):
            continue
        kind = str(block.get("kind") or "")
        block.setdefault("label", _BLOCK_LABELS.get(kind, kind or "News block"))
        block.setdefault("priority", "required" if block.get("binding") == "headline" else "optional" if kind in {"quote", "supportingImage", "imageGallery"} else "preferred")
        block.setdefault("collapseWhenEmpty", block.get("binding") != "headline")
        block.setdefault("locked", False)
        block.setdefault("hidden", False)
        block.setdefault("settings", {})
    return result


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _path(state_dir: Path) -> Path:
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir / LAYOUT_FILE


def default_layout_state() -> Dict[str, Any]:
    return {"schemaVersion": SCHEMA_VERSION, "activeLayoutId": "default-aegis", "layouts": [deepcopy(DEFAULT_LAYOUT)]}


def _validate(layout: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(layout, dict):
        raise ValueError("Layout must be an object")
    layout = _migrate_layout(layout)
    layout_id = str(layout.get("id") or "").strip()
    name = str(layout.get("name") or "").strip()
    blocks = layout.get("blocks")
    if not layout_id or len(layout_id) > 96 or not name or len(name) > 80 or not isinstance(blocks, list):
        raise ValueError("Layout id, name, and blocks are required")
    if not any(isinstance(block, dict) and block.get("binding") == "headline" and not block.get("hidden") for block in blocks):
        raise ValueError("A visible headline block is required")
    if len(blocks) > 64:
        raise ValueError("A layout may contain at most 64 blocks")
    return deepcopy(layout)


def load_layout_state(state_dir: Path) -> Dict[str, Any]:
    try:
        raw = json.loads(_path(state_dir).read_text(encoding="utf-8"))
        layouts = [_validate(item) for item in raw.get("layouts") or []]
        if not any(item.get("id") == "default-aegis" for item in layouts):
            layouts.insert(0, deepcopy(DEFAULT_LAYOUT))
        active = str(raw.get("activeLayoutId") or "default-aegis")
        if not any(item.get("id") == active for item in layouts):
            active = "default-aegis"
        return {"schemaVersion": SCHEMA_VERSION, "activeLayoutId": active, "layouts": layouts}
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        return default_layout_state()


def save_layout_state(state_dir: Path, state: Dict[str, Any]) -> None:
    path = _path(state_dir)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def get_active_layout(state: Dict[str, Any]) -> Dict[str, Any]:
    active = str(state.get("activeLayoutId") or "default-aegis")
    return deepcopy(next((item for item in state.get("layouts", []) if item.get("id") == active), DEFAULT_LAYOUT))


def create_layout(state: Dict[str, Any], layout: Dict[str, Any]) -> Dict[str, Any]:
    next_state = deepcopy(state)
    item = _validate(layout)
    if any(existing.get("id") == item["id"] for existing in next_state.get("layouts", [])):
        raise ValueError("A layout with this id already exists")
    item["createdAt"] = _now(); item["updatedAt"] = item["createdAt"]
    next_state.setdefault("layouts", []).append(item)
    return next_state


def update_layout(state: Dict[str, Any], layout_id: str, layout: Dict[str, Any]) -> Dict[str, Any]:
    next_state = deepcopy(state)
    item = _validate({**layout, "id": layout_id})
    for index, existing in enumerate(next_state.get("layouts", [])):
        if existing.get("id") == layout_id:
            item["createdAt"] = existing.get("createdAt") or _now(); item["updatedAt"] = _now()
            next_state["layouts"][index] = item
            return next_state
    raise KeyError(layout_id)


def set_active_layout(state: Dict[str, Any], layout_id: str) -> Dict[str, Any]:
    next_state = deepcopy(state)
    if not any(item.get("id") == layout_id for item in next_state.get("layouts", [])):
        raise KeyError(layout_id)
    next_state["activeLayoutId"] = layout_id
    return next_state


def delete_layout(state: Dict[str, Any], layout_id: str) -> Dict[str, Any]:
    if layout_id == "default-aegis":
        raise ValueError("The default layout cannot be deleted")
    next_state = deepcopy(state)
    before = len(next_state.get("layouts", []))
    next_state["layouts"] = [item for item in next_state.get("layouts", []) if item.get("id") != layout_id]
    if len(next_state["layouts"]) == before:
        raise KeyError(layout_id)
    if next_state.get("activeLayoutId") == layout_id:
        next_state["activeLayoutId"] = "default-aegis"
    return next_state
