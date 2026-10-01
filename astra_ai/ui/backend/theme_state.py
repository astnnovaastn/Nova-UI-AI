from __future__ import annotations

import json
import os
import re
import threading
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


SCHEMA_VERSION = 2
MAX_CUSTOM_THEMES = 100
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
UUID_RE = re.compile(r"^[0-9a-f]{32}$")
FONT_EXTENSIONS = {".woff", ".woff2", ".ttf", ".otf"}
ORB_PRESETS = {"default", "apollo-notype", "apollo", "blade", "chalkboard-ligatures", "chalkboard-notype", "chalkboard", "cyborg-focus", "cyborg", "interstellar", "matrix", "navy-disrupted", "navy-notype", "navy", "nord", "red", "tron-disrupted", "tron-fulltype", "tron-notype", "tron-typeleft", "tron"}

BUILTIN_THEMES: Dict[str, Dict[str, Any]] = {
    "dark": {"bg": "#282c34", "fg": "#9cdef2", "panel": "#111111", "border": "#355a66", "accent": "#e06c75"},
    "light": {"bg": "#f0ebe3", "fg": "#5a5248", "panel": "#faf6f0", "border": "#d4cdc2", "accent": "#c47d5a"},
    "midnight": {"bg": "#0d1117", "fg": "#c9d1d9", "panel": "#161b22", "border": "#30363d", "accent": "#f85149"},
    "paper": {"bg": "#faf8f5", "fg": "#3b3836", "panel": "#ffffff", "border": "#d5d0c8", "accent": "#c5ac4a"},
    "cyberpunk": {"bg": "#0a0a0f", "fg": "#0ff0fc", "panel": "#12101a", "border": "#9b30ff", "accent": "#e040fb"},
    "retrowave": {"bg": "#1a1a2e", "fg": "#e94560", "panel": "#16213e", "border": "#533483", "accent": "#e94560"},
    "forest": {"bg": "#1b2a1b", "fg": "#a8d5a2", "panel": "#142414", "border": "#3d6b3d", "accent": "#7cb871"},
    "ocean": {"bg": "#0b1a2c", "fg": "#64d2ff", "panel": "#091422", "border": "#1e5074", "accent": "#4facfe"},
    "ume": {"bg": "#2b1b2e", "fg": "#f5c2e7", "panel": "#1e1420", "border": "#6c4675", "accent": "#f5a0c0"},
    "copper": {"bg": "#1c1410", "fg": "#e8c39e", "panel": "#140f0a", "border": "#7a5533", "accent": "#d4764e"},
    "terminal": {"bg": "#000000", "fg": "#00ff41", "panel": "#0a0a0a", "border": "#003b00", "accent": "#00ff41"},
    "organs": {"bg": "#0a0406", "fg": "#efe1c8", "panel": "#15080a", "border": "#3a1519", "accent": "#c83240"},
    "lavender": {"bg": "#f3eef8", "fg": "#3d3551", "panel": "#faf7ff", "border": "#cec3de", "accent": "#9b6dcc"},
    "gpt": {"bg": "#212121", "fg": "#ececec", "panel": "#171717", "border": "#424242", "accent": "#949494"},
    "claude": {"bg": "#262624", "fg": "#f5f4f0", "panel": "#30302e", "border": "#4a4a47", "accent": "#c6613f"},
    "cute": {"bg": "#fff0f5", "fg": "#d4608a", "panel": "#fff8fa", "border": "#f0c0d0", "accent": "#ff6b9d"},
}

DEFAULT_EXTRAS = {
    "font": "mono", "density": "comfortable", "uiScale": 100, "spacing": 1,
    "radius": 12, "borderWidth": 1, "borderStyle": "solid", "panelOpacity": 0.94,
    "blur": 18, "shadow": 0.45, "glow": 0.35, "motion": "full",
    "pattern": "none", "patternColor": "", "patternIntensity": 0.4, "patternSize": 1, "frosted": True,
}
BUILTIN_EFFECTS = {
    "dark": ("none", "", .4, 1, False), "light": ("dots", "", .4, 1, False), "midnight": ("rain", "#ffffff", .5, 1, False),
    "paper": ("dots", "", .4, 1, False), "cyberpunk": ("synapse", "", .4, 1, False), "retrowave": ("embers", "", .4, 1, False),
    "forest": ("petals", "", .4, 1, False), "ocean": ("constellations", "", .4, 1, False), "terminal": ("perlin-flow", "", .8, 1, False),
    "organs": ("rain", "#451616", .65, 1, False), "ume": ("petals", "#f5a0c0", .4, 1, False), "cute": ("sparkles", "#ff8cb8", .4, 1, False),
    "copper": ("none", "", .4, 1, False), "lavender": ("none", "", .4, 1, True), "gpt": ("none", "", .4, 1, False), "claude": ("none", "", .4, 1, False),
}
SUPPORTED_WIDGET_IDS = {"search", "news", "weather", "task", "notes", "image", "calculator", "tictactoe", "chat"}


class ThemeStateError(ValueError):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slug(name: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return value[:64] or "custom-theme"


def builtin_documents() -> List[Dict[str, Any]]:
    documents = [
        {"schemaVersion": SCHEMA_VERSION, "id": key, "name": key.title(), "slug": key,
         "builtin": True, "tokens": {**colors, **DEFAULT_EXTRAS},
         "orb": {"mode": "sync", "preset": "default", "color": colors["accent"]},
         "widgetOverrides": {}}
        for key, colors in BUILTIN_THEMES.items()
    ]
    for document in documents:
        effect = BUILTIN_EFFECTS.get(document["id"], ("none", "", .4, 1, False))
        document["tokens"].update({"pattern": effect[0], "patternColor": effect[1], "patternIntensity": effect[2], "patternSize": effect[3], "frosted": effect[4]})
    return documents


def _atomic_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    with temp.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp, path)


def _number(value: Any, key: str, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not low <= float(value) <= high:
        raise ThemeStateError(f"{key} must be between {low} and {high}")
    return float(value)


def validate_tokens(raw: Any, base: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ThemeStateError("tokens must be an object")
    migrated = dict(raw)
    legacy_map = {"bgPattern": "pattern", "bgEffectColor": "patternColor", "bgEffectIntensity": "patternIntensity", "bgEffectSize": "patternSize"}
    for old_key, new_key in legacy_map.items():
        if old_key in migrated and new_key not in migrated:
            migrated[new_key] = migrated[old_key]
        migrated.pop(old_key, None)
    tokens = {**DEFAULT_EXTRAS, **(base or {}), **migrated}
    if tokens.get("pattern") == "flow":
        tokens["pattern"] = "perlin-flow"
    for key in ("bg", "fg", "panel", "border", "accent"):
        if not HEX_RE.fullmatch(str(tokens.get(key, ""))):
            raise ThemeStateError(f"tokens.{key} must be a six-digit hex color")
        tokens[key] = str(tokens[key]).lower()
    if tokens.get("patternColor") and not HEX_RE.fullmatch(str(tokens["patternColor"])):
        raise ThemeStateError("tokens.patternColor must be empty or a six-digit hex color")
    tokens["patternColor"] = str(tokens.get("patternColor") or "").lower()
    enums = {
        "density": {"compact", "comfortable", "spacious"},
        "borderStyle": {"solid", "dashed", "double", "none"},
        "motion": {"full", "reduced", "none"},
        "pattern": {"none", "dots", "synapse", "rain", "constellations", "perlin-flow", "petals", "sparkles", "embers"},
    }
    for key, allowed in enums.items():
        if tokens.get(key) not in allowed:
            raise ThemeStateError(f"tokens.{key} is invalid")
    if not isinstance(tokens.get("font"), str) or len(tokens["font"]) > 100:
        raise ThemeStateError("tokens.font is invalid")
    ranges = {"uiScale": (80, 140), "spacing": (0.75, 1.5), "radius": (0, 32), "borderWidth": (0, 4),
              "panelOpacity": (0.5, 1), "blur": (0, 40), "shadow": (0, 1), "glow": (0, 1), "patternIntensity": (0, 1), "patternSize": (0.2, 3)}
    for key, bounds in ranges.items():
        tokens[key] = _number(tokens.get(key), key, *bounds)
    tokens["frosted"] = bool(tokens.get("frosted"))
    advanced = tokens.get("advanced", {})
    if advanced:
        if not isinstance(advanced, dict):
            raise ThemeStateError("tokens.advanced must be an object")
        for key, value in advanced.items():
            if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", key) or not HEX_RE.fullmatch(str(value)):
                raise ThemeStateError("advanced colors are invalid")
    return tokens


def _validate_orb(value: Any, accent: str) -> Dict[str, str]:
    orb = value if isinstance(value, dict) else {}
    mode = orb.get("mode", "sync")
    if mode not in {"sync", "custom"}:
        raise ThemeStateError("orb.mode is invalid")
    color = orb.get("color", accent)
    if not HEX_RE.fullmatch(str(color)):
        raise ThemeStateError("orb.color must be a six-digit hex color")
    preset = str(orb.get("preset", "default"))
    if preset not in ORB_PRESETS:
        raise ThemeStateError("orb.preset is invalid")
    return {"mode": mode, "preset": preset, "color": color.lower()}


def _validate_overrides(value: Any) -> Dict[str, Dict[str, str]]:
    if value in (None, {}):
        return {}
    if not isinstance(value, dict) or len(value) > 40:
        raise ThemeStateError("widgetOverrides is invalid")
    result = {}
    for widget_id, settings in value.items():
        if str(widget_id) not in SUPPORTED_WIDGET_IDS or not isinstance(settings, dict):
            raise ThemeStateError("widget override id is invalid")
        result[widget_id] = {}
        for key, color in settings.items():
            if key not in {"accent", "surface", "border", "text"} or not HEX_RE.fullmatch(str(color)):
                raise ThemeStateError("widget override value is invalid")
            result[widget_id][key] = str(color).lower()
    return result


class ThemeStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.themes_dir = self.root / "themes"
        self.settings_path = self.root / "settings.json"
        self.lock = threading.RLock()
        self.root.mkdir(parents=True, exist_ok=True)
        self.themes_dir.mkdir(parents=True, exist_ok=True)
        if not self.settings_path.exists():
            _atomic_json(self.settings_path, {"schemaVersion": SCHEMA_VERSION, "defaultThemeId": "dark"})

    def _settings(self) -> Dict[str, Any]:
        try:
            data = json.loads(self.settings_path.read_text(encoding="utf-8"))
        except Exception:
            data = {"schemaVersion": SCHEMA_VERSION, "defaultThemeId": "dark"}
        return {"schemaVersion": SCHEMA_VERSION, "defaultThemeId": str(data.get("defaultThemeId", "dark"))}

    def _read_custom(self) -> tuple[List[Dict[str, Any]], List[str]]:
        themes, errors = [], []
        for path in sorted(self.themes_dir.glob("*.json")):
            try:
                item = json.loads(path.read_text(encoding="utf-8"))
                if not UUID_RE.fullmatch(path.stem) or item.get("id") != path.stem:
                    raise ThemeStateError("id does not match filename")
                themes.append(self._validate_document(item, expected_id=path.stem))
            except Exception as exc:
                errors.append(f"{path.name}: {exc}")
        return themes, errors

    def _validate_document(self, raw: Any, expected_id: Optional[str] = None, base_tokens: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not isinstance(raw, dict):
            raise ThemeStateError("theme must be an object")
        theme_id = expected_id or str(raw.get("id") or uuid.uuid4().hex)
        if not UUID_RE.fullmatch(theme_id):
            raise ThemeStateError("theme id is invalid")
        name = str(raw.get("name", "")).strip()
        if not 1 <= len(name) <= 80 or any(ord(char) < 32 for char in name):
            raise ThemeStateError("theme name must contain 1-80 printable characters")
        token_source = dict(raw.get("tokens", {}) if isinstance(raw.get("tokens"), dict) else {})
        for legacy_key in ("bgPattern", "bgEffectColor", "bgEffectIntensity", "bgEffectSize"):
            if legacy_key in raw and legacy_key not in token_source:
                token_source[legacy_key] = raw[legacy_key]
        tokens = validate_tokens(token_source, base_tokens)
        now = _now()
        base_theme_id = str(raw.get("baseThemeId") or "dark")
        base_theme_id = {"chatgpt": "gpt", "sakura": "ume"}.get(base_theme_id, base_theme_id)
        if base_theme_id not in BUILTIN_THEMES:
            raise ThemeStateError("baseThemeId must identify a built-in theme")
        return {"schemaVersion": SCHEMA_VERSION, "id": theme_id, "name": name, "slug": _slug(name), "builtin": False,
                "baseThemeId": base_theme_id,
                "createdAt": str(raw.get("createdAt") or now), "updatedAt": now, "tokens": tokens,
                "orb": _validate_orb(raw.get("orb"), tokens["accent"]),
                "widgetOverrides": _validate_overrides(raw.get("widgetOverrides"))}

    def list(self) -> Dict[str, Any]:
        with self.lock:
            custom, errors = self._read_custom()
            return {"schemaVersion": SCHEMA_VERSION, "defaultThemeId": self._settings()["defaultThemeId"],
                    "builtins": builtin_documents(), "custom": custom, "errors": errors, "maxCustomThemes": MAX_CUSTOM_THEMES}

    def get(self, theme_id: str) -> Dict[str, Any]:
        alias = {"chatgpt": "gpt", "sakura": "ume"}.get(theme_id, theme_id)
        for item in builtin_documents():
            if item["id"] == alias:
                return item
        if not UUID_RE.fullmatch(alias):
            raise ThemeStateError("theme not found", 404)
        path = self.themes_dir / f"{alias}.json"
        if not path.exists():
            raise ThemeStateError("theme not found", 404)
        return self._validate_document(json.loads(path.read_text(encoding="utf-8")), expected_id=alias)

    def create(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock:
            custom, _ = self._read_custom()
            if len(custom) >= MAX_CUSTOM_THEMES:
                raise ThemeStateError("custom theme limit reached", 409)
            try:
                requested_base = self.get(str(raw.get("baseThemeId", "dark")))
            except ThemeStateError as exc:
                raise ThemeStateError("baseThemeId must identify an existing theme") from exc
            base_id = requested_base["id"] if requested_base.get("builtin") else requested_base.get("baseThemeId", "dark")
            base = self.get(base_id)["tokens"]
            item = self._validate_document({**raw, "baseThemeId": base_id}, base_tokens=base)
            _atomic_json(self.themes_dir / f"{item['id']}.json", item)
            return item

    def update(self, theme_id: str, raw: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock:
            current = self.get(theme_id)
            if current.get("builtin"):
                raise ThemeStateError("built-in themes are immutable", 409)
            merged = deepcopy(current)
            for key in ("name", "tokens", "orb", "widgetOverrides", "baseThemeId"):
                if key in raw:
                    merged[key] = ({**merged[key], **raw[key]} if key in {"tokens", "orb"} and isinstance(raw[key], dict) else raw[key])
            item = self._validate_document(merged, expected_id=theme_id)
            item["createdAt"] = current["createdAt"]
            _atomic_json(self.themes_dir / f"{theme_id}.json", item)
            return item

    def duplicate(self, theme_id: str, name: Optional[str] = None) -> Dict[str, Any]:
        source = self.get(theme_id)
        base_theme_id = source["id"] if source.get("builtin") else source.get("baseThemeId", "dark")
        return self.create({"name": name or f"{source['name']} Copy", "baseThemeId": base_theme_id, "tokens": source["tokens"], "orb": source["orb"], "widgetOverrides": source["widgetOverrides"]})

    def set_default(self, theme_id: str) -> str:
        with self.lock:
            canonical = {"chatgpt": "gpt", "sakura": "ume"}.get(theme_id, theme_id)
            self.get(canonical)
            _atomic_json(self.settings_path, {"schemaVersion": SCHEMA_VERSION, "defaultThemeId": canonical})
            return canonical

    def delete(self, theme_id: str, replacement: Optional[str] = None) -> None:
        with self.lock:
            item = self.get(theme_id)
            if item.get("builtin"):
                raise ThemeStateError("built-in themes cannot be deleted", 409)
            if self._settings()["defaultThemeId"] == theme_id:
                if not replacement:
                    raise ThemeStateError("select a replacement default before deleting this theme", 409)
                self.set_default(replacement)
            (self.themes_dir / f"{theme_id}.json").unlink()

    def import_items(self, payload: Any) -> List[Dict[str, Any]]:
        raw_items = payload.get("themes") if isinstance(payload, dict) and isinstance(payload.get("themes"), list) else [payload]
        if not raw_items or len(raw_items) > MAX_CUSTOM_THEMES:
            raise ThemeStateError("import contains an invalid number of themes")
        created = []
        for raw in raw_items:
            if not isinstance(raw, dict):
                raise ThemeStateError("imported theme is invalid")
            normalized = deepcopy(raw)
            normalized.pop("id", None)
            normalized.pop("builtin", None)
            created.append(self.create(normalized))
        return created

    def export_all(self) -> Dict[str, Any]:
        custom, _ = self._read_custom()
        return {"schemaVersion": SCHEMA_VERSION, "themes": custom}


def list_custom_fonts(frontend_root: Path) -> List[Dict[str, str]]:
    roots = [(frontend_root / "public" / "fonts", "/fonts")]
    fonts = []
    for root, url_root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in FONT_EXTENSIONS:
                relative = path.relative_to(root).as_posix()
                fonts.append({"name": path.stem, "file": path.name, "format": path.suffix.lower().lstrip("."), "url": f"{url_root}/{relative}"})
    return sorted(fonts, key=lambda item: item["name"].lower())
