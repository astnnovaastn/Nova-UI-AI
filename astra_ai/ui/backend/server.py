#!/usr/bin/env python3
"""
AEGIS Server - WebSocket-based AI Backend
============================================

A FastAPI server that connects the frontend UI to Aegis AI through WebSockets.
Handles real-time voice transcription, AI processing, and audio response generation.

Server runs on: ws://localhost:8340/ws/voice
REST API: http://localhost:8340/api/*

Features:
- Real-time WebSocket communication with frontend
- Aegis AI integration for intelligent responses
- Text-to-Speech audio generation
- Memory system integration
- Task spawning and execution
- Status updates and state management
"""

import os
import json
import asyncio
import base64
import io
import logging
import subprocess
import threading
import queue
import time
import uuid
import sys
import importlib.metadata
from copy import deepcopy
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from collections import deque
from pathlib import Path
from typing import Optional, Dict, Any, List, Set, Tuple
from datetime import datetime
from contextlib import asynccontextmanager

# Establish package access before importing backend adapters, which now share
# the clock service. Standalone server.py starts with only its own directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

# Load environment variables from .env file
from dotenv import dotenv_values, load_dotenv

ROOT_ENV_FILE = Path(__file__).parent.parent.parent.parent / '.env'
LEGACY_ENV_FILE = Path(__file__).parent.parent.parent / '.env'

# Prefer the root project .env and allow it to override inherited shell state.
load_dotenv(ROOT_ENV_FILE, override=True)
from astra_ai.ui.backend.runtime_paths import runtime_paths
runtime_paths.initialize()

# The Google SDK inspects both names even when an explicit key is passed and
# otherwise emits an ambiguous-precedence warning.  Canonicalize Gemini auth
# once; legacy image/TTS helpers below also accept GEMINI_API_KEY.
_canonical_gemini_key = str(
    os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
).strip()
if _canonical_gemini_key:
    os.environ["GEMINI_API_KEY"] = _canonical_gemini_key
    os.environ.pop("GOOGLE_API_KEY", None)

# FastAPI & WebSocket
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ElevenLabs Text-to-Speech
import requests
import re
import yaml
from PIL import Image

# Image Backup Manager
from image_backup_manager import ImageBackupManager
from search_state import (
    apply_search_widget_command,
    build_frontend_payload,
    delete_history_entry,
    default_search_widget_state,
    find_history_matches,
    get_history_preview,
    load_search_widget_state,
    resolve_history_request_id,
    restore_history_entry,
    restore_latest_entry,
    sanitize_search_answer,
    save_search_widget_state,
)
from news_state import (
    archive_history_entry as archive_news_history_entry,
    apply_news_widget_command,
    build_frontend_payload as build_news_frontend_payload,
    default_news_widget_state,
    delete_history_entry as delete_news_history_entry,
    find_history_matches as find_news_history_matches,
    get_history_preview as get_news_history_preview,
    load_news_widget_state,
    restore_history_entry as restore_news_history_entry,
    restore_latest_entry as restore_latest_news_entry,
    save_news_widget_state,
)
from news_layout_state import (
    create_layout as create_news_layout,
    delete_layout as delete_news_layout,
    get_active_layout as get_active_news_layout,
    load_layout_state,
    save_layout_state,
    set_active_layout as set_active_news_layout,
    update_layout as update_news_layout,
)
from notes_state import (
    add_note,
    add_summary,
    clear_notes,
    delete_note as delete_saved_note,
    delete_summary,
    find_matching_note,
    load_notes_state,
    prepare_notes_state_dir,
    update_note,
)
from weather_runtime import WeatherRuntimeService
from weather_radar import radar_manifest_service
from widget_connection_runtime import WidgetConnectionRuntime
from context_preprocessor import ContextPreprocessor
from theme_state import ThemeStateError, ThemeStore, list_custom_fonts
from calendar_backend import calendar_router, calendar_store, reminder_loop
from task_backend import task_orchestrator, task_router, task_store, task_webhook_router

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from gemini_live import GeminiLiveSession, LIVE_MODEL, MEMORY_TOOL_DECLARATIONS, MEMORY_EVENT_TOOL_DECLARATIONS, WIDGET_TOOL_DECLARATIONS, ACTION_TOOL_DECLARATIONS, execute_shared_memory_tool
from astra_ai.ui.backend.aegis_runtime import MODEL_STATUS, TEXT_PREFERRED, TEXT_FALLBACK, mark_model, unavailable, UI_CONTEXTS, CHAT_SESSIONS, set_ui, ui_context, context_text, activity
from astra_ai.core.time_service import configured_timezone
from astra_ai.memory.live_memory import LiveMemoryManager

try:
    from astra_ai.services.weather_service import WeatherService
except ImportError:
    from services.weather_service import WeatherService

try:
    from astra_ai.core.search_intent import (
        extract_search_query,
        format_search_display_subtopic,
        format_search_display_topic,
        is_explicit_search_request,
        parse_search_request,
    )
except ImportError:
    from astra_ai.core.search_intent import (
        extract_search_query,
        format_search_display_subtopic,
        format_search_display_topic,
        is_explicit_search_request,
        parse_search_request,
    )

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(runtime_paths.logs/"aegis_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("AegisServer")

# ============================================================================
# GLOBAL STATE & CONFIGURATION
# ============================================================================

class ServerConfig:
    """Server configuration"""
    HOST = os.getenv("ASTRA_HOST", "127.0.0.1")
    PORT = 8340
    WS_ENDPOINT = "/ws/voice"
    MAX_CONNECTIONS = 10
    TTS_ENABLED = True
    MEMORY_ENABLED = True
    VOICE_MULTIPLIER = 2.0


IMAGE_CONFIG_PATH = Path(__file__).parent / "config.yaml"


def _first_real_api_key(*candidates: Optional[str]) -> str:
    for candidate in candidates:
        cleaned = (candidate or "").strip()
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if "your" in lowered and "key" in lowered:
            continue
        if lowered in {"changeme", "replace-me", "replace_with_real_key"}:
            continue
        return cleaned
    return ""


def _get_env_value(*names: str) -> str:
    file_values: List[str] = []
    for env_file in (ROOT_ENV_FILE, LEGACY_ENV_FILE):
        if not env_file.exists():
            continue
        try:
            env_map = dotenv_values(env_file)
        except Exception:
            continue
        for name in names:
            file_values.append(env_map.get(name))

    env_values = [os.getenv(name) for name in names]
    return _first_real_api_key(*file_values, *env_values)


def _get_groq_api_key() -> str:
    legacy_values: List[Optional[str]] = []
    if LEGACY_ENV_FILE.exists():
        try:
            legacy_env = dotenv_values(LEGACY_ENV_FILE)
            legacy_values.extend(
                [
                    legacy_env.get("GROQ_STT_API_KEY"),
                    legacy_env.get("GROQ_API_KEY"),
                ]
            )
        except Exception:
            pass

    return _first_real_api_key(
        *legacy_values,
        _get_env_value("GROQ_STT_API_KEY", "GROQ_API_KEY"),
    )


def _get_notes_openai_api_key() -> str:
    return _first_real_api_key(
        os.getenv("NOTES_WIDGET_OPENAI_API_KEY"),
        os.getenv("OPENAI_API_KEY"),
    )


def _get_notes_openai_model() -> str:
    model = (os.getenv("NOTES_WIDGET_OPENAI_MODEL") or os.getenv("OPENAI_NOTES_MODEL") or "gpt-4o").strip()
    return model or "gpt-4o"


def _get_notes_openrouter_api_key() -> str:
    return _first_real_api_key(
        os.getenv("NOTES_WIDGET_OPENROUTER_API_KEY"),
        os.getenv("OPENROUTER_API_KEY"),
        os.getenv("openrouter_api_key"),
    )


def _get_notes_openrouter_model() -> str:
    model = (
        os.getenv("NOTES_WIDGET_OPENROUTER_MODEL")
        or os.getenv("OPENROUTER_NOTES_MODEL")
        or "openai/gpt-4o-mini"
    ).strip()
    return model or "openai/gpt-4o-mini"


def _get_notes_groq_api_key() -> str:
    return _first_real_api_key(
        os.getenv("NOTES_WIDGET_GROQ_API_KEY"),
        _get_groq_api_key(),
    )


def _get_notes_groq_model() -> str:
    model = (
        os.getenv("NOTES_WIDGET_GROQ_MODEL")
        or os.getenv("GROQ_NOTES_MODEL")
        or "llama-3.3-70b-versatile"
    ).strip()
    return model or "llama-3.3-70b-versatile"


def _get_notes_ai_provider_chain() -> List[Dict[str, Any]]:
    providers: List[Dict[str, Any]] = []

    openai_key = _get_notes_openai_api_key()
    if openai_key:
        providers.append(
            {
                "name": "openai",
                "model": _get_notes_openai_model(),
                "url": "https://api.openai.com/v1/chat/completions",
                "headers": {
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
            }
        )

    openrouter_key = _get_notes_openrouter_api_key()
    if openrouter_key:
        providers.append(
            {
                "name": "openrouter",
                "model": _get_notes_openrouter_model(),
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "headers": {
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://aegis-ai.local",
                    "X-Title": "AEGIS AI Notes",
                },
            }
        )

    groq_key = _get_notes_groq_api_key()
    if groq_key:
        providers.append(
            {
                "name": "groq",
                "model": _get_notes_groq_model(),
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "headers": {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
            }
        )

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        providers.append({
            "name": "gemini",
            "model": os.getenv("GEMINI_TEXT_MODEL", "gemini-2.5-flash"),
            "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            "headers": {"Authorization": f"Bearer {gemini_key}", "Content-Type": "application/json"},
        })
    return providers


def _get_notes_ai_provider_status() -> Dict[str, Any]:
    return {
        "configured": {
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "openai": bool(_get_notes_openai_api_key()),
            "openrouter": bool(_get_notes_openrouter_api_key()),
            "groq": bool(_get_notes_groq_api_key()),
        },
        "order": [provider["name"] for provider in _get_notes_ai_provider_chain()],
    }


def _safe_json_loads(raw_text: str) -> Dict[str, Any]:
    try:
        data = json.loads(raw_text or "{}")
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {
        "assistant_response": (raw_text or "").strip(),
        "updated_note": "",
        "summary_text": (raw_text or "").strip(),
        "title": "",
    }


def _load_weather_service() -> WeatherService:
    return WeatherService()


DEFAULT_WEATHER_FALLBACK_LOCATION = "Milan, IT"
IPINFO_LOCATION_URL = "https://ipinfo.io/json"


def _parse_weather_widget_response(response_text: str) -> Optional[Dict[str, Any]]:
    raw = str(response_text or "").strip()
    if not raw.startswith("WEATHER_DISPLAY_SHOW:"):
        return None

    try:
        header, weather_section = raw.split("|WEATHER_DATA:", 1)
        location = header.replace("WEATHER_DISPLAY_SHOW:", "", 1).strip() or DEFAULT_WEATHER_FALLBACK_LOCATION
        weather_data = json.loads(weather_section.strip())
        if not isinstance(weather_data, dict):
            return None
        return {
            "location": location,
            "weather_data": weather_data,
        }
    except Exception as exc:
        logger.error("[WEATHER] Failed to parse weather widget response: %s", exc)
        return None


def _build_weather_spoken_summary(location: str, weather_data: Dict[str, Any]) -> str:
    condition = str(weather_data.get("condition") or "current conditions").strip()
    temperature = weather_data.get("temperature")
    feels_like = weather_data.get("feelsLike")
    humidity = weather_data.get("humidity")
    wind_speed = weather_data.get("windSpeed")
    wind_direction = str(weather_data.get("windDirection") or "").strip()

    parts = [f"Here's the weather for {location}."]
    if temperature not in {None, "", "--"}:
        parts.append(f"It's {temperature} degrees Celsius")
        if feels_like not in {None, "", "--"}:
            parts[-1] += f", feeling like {feels_like}."
        else:
            parts[-1] += "."
    if condition:
        parts.append(f"Conditions are {condition.lower()}.")
    if humidity not in {None, "", "--"}:
        parts.append(f"Humidity is {humidity} percent.")
    if wind_speed not in {None, "", "--"}:
        wind_text = f"Winds are around {wind_speed} kilometers per hour"
        if wind_direction and wind_direction != "--":
            wind_text += f" from the {wind_direction}"
        parts.append(f"{wind_text}.")
    return " ".join(parts)


def _is_where_am_i_request(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    return bool(
        re.search(
            r"\b(where am i|what(?:'s| is) my location|what city am i in|which city am i in|where are we)\b",
            lowered,
        )
    )


def _is_local_weather_request(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    has_weather_language = bool(
        re.search(r"\b(weather|temperature|forecast|rain|snow|humidity|wind|sunrise|sunset)\b", lowered)
    )
    refers_to_current_place = bool(
        re.search(r"\b(here|my location|this place|current location|where i am|around me)\b", lowered)
    )
    return has_weather_language and refers_to_current_place


def _build_location_spoken_summary(location_snapshot: Dict[str, Any]) -> str:
    label = str(location_snapshot.get("label") or "").strip()
    latitude = location_snapshot.get("latitude")
    longitude = location_snapshot.get("longitude")
    if label:
        return f"Your current server-detected location is {label}."
    if latitude is not None and longitude is not None:
        return f"Your current server-detected location is latitude {latitude:.4f} and longitude {longitude:.4f}."
    return f"I do not have a detected location yet, so I will use {DEFAULT_WEATHER_FALLBACK_LOCATION} as the weather default."


def _get_current_location_query() -> Tuple[str, Dict[str, Any]]:
    snapshot = state.get_client_location()
    weather_query = str(snapshot.get("weather_query") or "").strip()
    label = str(snapshot.get("label") or "").strip()
    if weather_query:
        return weather_query, snapshot
    if label:
        return label, snapshot
    return DEFAULT_WEATHER_FALLBACK_LOCATION, snapshot


async def generate_notes_ai_completion(
    *,
    mode: str,
    note_content: str,
    instruction: str,
    note_id: str = "",
    category: str = "",
    conversation: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    provider_chain = _get_notes_ai_provider_chain()
    if not provider_chain:
        raise HTTPException(
            status_code=503,
            detail=(
                "Notes AI is not configured. Set a notes AI provider key in .env "
                "(OPENAI_API_KEY, NOTES_WIDGET_OPENAI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY) "
                "and restart the server."
            ),
        )

    cleaned_mode = (mode or "chat").strip().lower()
    cleaned_note = (note_content or "").strip()
    cleaned_instruction = (instruction or "").strip()
    cleaned_category = (category or "").strip()
    cleaned_note_id = (note_id or "").strip()
    recent_turns = conversation[-8:] if isinstance(conversation, list) else []

    mode_guidance = {
        "summary": "Summarize the supplied note clearly. Return a concise assistant response and a clean summary_text.",
        "improve": "Improve the supplied note for clarity, grammar, and structure. Return the full improved note in updated_note.",
        "chat": "Answer the user's request using only the supplied note context. If the user asks to rewrite or expand the note, provide the proposed full rewritten note in updated_note.",
    }.get(cleaned_mode, "Answer the user's request using the supplied note context.")

    system_prompt = (
        "You are Astra Notes AI, a dedicated GPT-4o assistant that works only inside the Notes widget. "
        "You must operate only on the note context supplied to you. "
        "Always return strict JSON with the keys: assistant_response, updated_note, summary_text, title. "
        "If a field does not apply, return an empty string for it. "
        "Do not include markdown fences or any text outside the JSON object. "
        f"{mode_guidance}"
    )

    user_payload = {
        "mode": cleaned_mode,
        "instruction": cleaned_instruction,
        "note_id": cleaned_note_id,
        "category": cleaned_category,
        "note_content": cleaned_note,
        "conversation": [
            {
                "role": str(turn.get("role") or "user"),
                "content": str(turn.get("content") or "").strip(),
            }
            for turn in recent_turns
            if str(turn.get("content") or "").strip()
        ],
    }

    payload_template = {
        "temperature": 0.35,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
    }

    loop = asyncio.get_event_loop()
    provider_errors: List[str] = []

    for provider in provider_chain:
        provider_name = str(provider.get("name") or "unknown")
        provider_model = str(provider.get("model") or "").strip()
        payload = {
            **payload_template,
            "model": provider_model,
        }

        def make_request(active_provider=provider, active_payload=payload):
            return requests.post(
                str(active_provider["url"]),
                headers=active_provider["headers"],
                json=active_payload,
                timeout=60,
            )

        try:
            response = await loop.run_in_executor(None, make_request)
        except Exception as exc:
            logger.error("[NOTES AI] %s request exception: %s", provider_name.upper(), exc)
            provider_errors.append(f"{provider_name}: request error")
            continue

        if response.status_code != 200:
            error_text = response.text[:600] if response.text else "No response body"
            lowered_error = error_text.lower()
            logger.error("[NOTES AI] %s error %s: %s", provider_name.upper(), response.status_code, error_text)

            if response.status_code == 401 or "invalid_api_key" in lowered_error or "incorrect api key" in lowered_error:
                provider_errors.append(f"{provider_name}: invalid API key")
            elif response.status_code == 429:
                provider_errors.append(f"{provider_name}: rate limit reached")
            else:
                provider_errors.append(f"{provider_name}: HTTP {response.status_code}")
            continue

        result = response.json()
        content = (
            result.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        parsed = _safe_json_loads(content)
        assistant_response = str(parsed.get("assistant_response") or "").strip()
        updated_note = str(parsed.get("updated_note") or "").strip()
        summary_text = str(parsed.get("summary_text") or "").strip()
        title = str(parsed.get("title") or "").strip()

        if not assistant_response and summary_text:
            assistant_response = summary_text
        if cleaned_mode == "improve" and not updated_note:
            updated_note = assistant_response

        return {
            "success": True,
            "mode": cleaned_mode,
            "provider": provider_name,
            "model": provider_model,
            "assistant_response": assistant_response,
            "updated_note": updated_note,
            "summary_text": summary_text or assistant_response,
            "title": title,
        }

    detail = "Notes AI request failed across all configured providers."
    if provider_errors:
        detail = f"{detail} {'; '.join(provider_errors)}"
    raise HTTPException(status_code=502, detail=detail)


def load_image_generation_config() -> Dict[str, Any]:
    """Read widget image generation settings from backend config.yaml and environment."""
    config = {
        "provider": "google",
        "model": "gemini-2.5-flash-image",
        "fallback_model": "",
        "enabled": True,
        "api_key": "",
        "pollinations_api_key": "",
        "allow_pollinations_fallback": True,
    }

    try:
        if IMAGE_CONFIG_PATH.exists():
            with open(IMAGE_CONFIG_PATH, "r", encoding="utf-8") as f:
                raw_config = yaml.safe_load(f) or {}
        else:
            raw_config = {}

        ai_section = raw_config.get("ai", {})
        providers = ai_section.get("providers", {})
        google_provider = providers.get("google", {}) or {}
        widgets = raw_config.get("widgets", {})
        image_widget = widgets.get("image_generation", {}) or {}

        config["provider"] = image_widget.get("provider", config["provider"]).lower()
        config["model"] = image_widget.get("model", google_provider.get("model", config["model"]))
        config["fallback_model"] = image_widget.get("fallback_model", google_provider.get("fallback_model", config["fallback_model"]))
        config["enabled"] = image_widget.get("enabled", True)
        config["allow_pollinations_fallback"] = bool(
            image_widget.get(
                "allow_pollinations_fallback",
                image_widget.get("allow_free_pollinations_fallback", True),
            )
        )
        config["api_key"] = _first_real_api_key(
            image_widget.get("api_key"),
            google_provider.get("api_key"),
            os.getenv("GOOGLE_GENERATIVE_AI_API_KEY"),
            os.getenv("LLM_API_KEY"),
            os.getenv("GEMINI_API_KEY"),
            os.getenv("GOOGLE_API_KEY"),
            os.getenv("google_api_key"),
            os.getenv("GOOGLE_APIKEY"),
        )
        config["pollinations_api_key"] = _first_real_api_key(
            image_widget.get("pollinations_api_key"),
            os.getenv("POLLINATIONS_API_KEY"),
            os.getenv("pollinations_api_key"),
        )
    except Exception as e:
        logger.warning(f"[IMAGE CONFIG] Failed to load image generation config: {e}")

    return config


def _format_image_output(image_payload: Any) -> str:
    if not image_payload:
        raise ValueError("Empty image data returned from provider")

    if isinstance(image_payload, str):
        payload = image_payload.strip()
    else:
        payload = str(image_payload).strip()

    if payload.startswith("data:image/"):
        return payload
    if payload.startswith("http://") or payload.startswith("https://"):
        return payload

    # Assume base64 image string and return PNG data URI.
    return f"data:image/png;base64,{payload}"


def _detect_image_key_type(api_key: str) -> str:
    cleaned = (api_key or "").strip()
    if not cleaned:
        return "missing"
    if cleaned.startswith("AIza"):
        return "google_gemini_api"
    if cleaned.startswith("AQ."):
        return "vertex_express"
    return "unknown"


class ImageGenerationFailure(Exception):
    def __init__(
        self,
        message: str,
        *,
        provider: str,
        model: str = "",
        error_code: str = "IMAGE_GENERATION_FAILED",
        status_code: int = 500,
        retry_after_seconds: Optional[int] = None,
        action_required: Optional[str] = None,
    ):
        super().__init__(message)
        self.provider = provider
        self.model = model
        self.error_code = error_code
        self.status_code = status_code
        self.retry_after_seconds = retry_after_seconds
        self.action_required = action_required


def _image_error_detail(error: ImageGenerationFailure) -> Dict[str, Any]:
    detail = {
        "success": False,
        "provider": error.provider,
        "model": error.model,
        "error_code": error.error_code,
        "message": str(error),
    }
    if error.retry_after_seconds is not None:
        detail["retry_after_seconds"] = error.retry_after_seconds
    if error.action_required:
        detail["action_required"] = error.action_required
    return detail


def _generate_image_rest(prompt: str, model: str, api_key: str) -> str:
    """
    FREE FALLBACK: Uses Pollinations.ai to generate images for free
    Downloads the image and returns it as a base64 data URL to avoid CORS issues
    """
    keyed_pollinations = bool((api_key or "").strip().startswith(("sk_", "pk_")))
    logger.info(
        f"[IMAGE] Using {'keyed' if keyed_pollinations else 'free'} Pollinations API for prompt: {prompt[:50]}..."
    )

    # Clean the prompt for a URL
    encoded_prompt = requests.utils.quote(prompt)

    if keyed_pollinations:
        image_url = (
            f"https://gen.pollinations.ai/image/{encoded_prompt}"
            f"?model=flux&width=1024&height=1024&enhance=false&key={requests.utils.quote(api_key)}"
        )
    else:
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=1024&height=1024&nologo=true&seed={int(time.time())}"
        )

    try:
        logger.info(f"[IMAGE] Downloading image from Pollinations...")
        max_retries = 6
        for attempt in range(1, max_retries + 1):
            response = requests.get(image_url, timeout=60)

            if response.status_code == 200:
                image_data = response.content
                base64_data = base64.b64encode(image_data).decode('utf-8')
                content_type = response.headers.get('content-type', 'image/jpeg')
                data_url = f"data:{content_type};base64,{base64_data}"
                logger.info(f"[IMAGE] Successfully downloaded and encoded image ({len(image_data)} bytes)")
                return data_url

            if response.status_code == 402 and attempt < max_retries:
                wait_schedule = [1, 2, 4, 8, 12]
                wait_seconds = wait_schedule[min(attempt - 1, len(wait_schedule) - 1)]
                logger.warning(f"[IMAGE] Pollinations rate limit (402). Retrying in {wait_seconds}s (attempt {attempt}/{max_retries})...")
                time.sleep(wait_seconds)
                continue

            if response.status_code == 402:
                queue_message = "Pollinations queue is full for this IP."
                try:
                    payload = response.json()
                    queue_message = payload.get("error") or queue_message
                except Exception:
                    pass
                logger.error(f"[IMAGE] Pollinations returned status 402: {queue_message}")
                raise ImageGenerationFailure(
                    queue_message,
                    provider="pollinations",
                    model="pollinations-free",
                    error_code="QUEUE_FULL_FOR_IP",
                    status_code=503,
                    retry_after_seconds=15,
                    action_required="Wait for the active Pollinations request on this IP to finish, then retry.",
                )

            logger.error(f"[IMAGE] Pollinations returned status {response.status_code}")
            raise ImageGenerationFailure(
                f"Pollinations API returned {response.status_code}",
                provider="pollinations",
                model="pollinations-free",
                error_code="PROVIDER_FAILED",
                status_code=502,
            )

        raise ImageGenerationFailure(
            "Pollinations queue is full for this IP.",
            provider="pollinations",
            model="pollinations-free",
            error_code="QUEUE_FULL_FOR_IP",
            status_code=503,
            retry_after_seconds=15,
            action_required="Wait for the active Pollinations request on this IP to finish, then retry.",
        )
    except Exception as e:
        logger.error(f"[IMAGE] Failed to download image from Pollinations: {e}")
        raise e


def _enhance_prompt_with_gemini(prompt: str, api_key: str) -> str:
    cleaned_key = (api_key or "").strip()
    if not cleaned_key or _detect_image_key_type(cleaned_key) != "google_gemini_api":
        return prompt

    try:
        from google import genai
    except ImportError:
        return prompt

    saved_env = {
        name: os.environ.get(name)
        for name in ("GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY")
    }
    try:
        os.environ["GOOGLE_API_KEY"] = cleaned_key
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("GOOGLE_GENERATIVE_AI_API_KEY", None)

        client = genai.Client(api_key=cleaned_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "Rewrite this as one concise, vivid image-generation prompt. Return only the prompt text.",
                prompt,
            ],
        )
        enhanced = (getattr(response, "text", "") or "").strip()
        if enhanced:
            logger.info(f"[IMAGE] Gemini enhanced prompt for Pollinations: {enhanced[:120]}")
            return enhanced
        return prompt
    except Exception as e:
        logger.warning(f"[IMAGE] Gemini prompt enhancement failed: {e}")
        return prompt
    finally:
        for name, value in saved_env.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value


def _reverse_prompt_image_with_gemini(instruction: str, image_bytes: bytes, mime_type: str, api_key: str) -> str:
    cleaned_key = (api_key or "").strip()
    if not cleaned_key or _detect_image_key_type(cleaned_key) != "google_gemini_api":
        raise ImageGenerationFailure(
            "Gemini image analysis is not configured.",
            provider="google_gemini_api",
            model="gemini-2.5-flash",
            error_code="GEMINI_IMAGE_ANALYSIS_UNAVAILABLE",
            status_code=503,
            action_required="Add a valid Gemini API key for image recreation.",
        )

    try:
        from google import genai
    except ImportError as exc:
        raise ImageGenerationFailure(
            "Gemini image analysis support is not installed on the server.",
            provider="google_gemini_api",
            model="gemini-2.5-flash",
            error_code="GEMINI_SDK_MISSING",
            status_code=500,
        ) from exc

    saved_env = {
        name: os.environ.get(name)
        for name in ("GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY")
    }
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    retry_wait_schedule = [1, 2]

    try:
        os.environ["GOOGLE_API_KEY"] = cleaned_key
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("GOOGLE_GENERATIVE_AI_API_KEY", None)

        client = genai.Client(api_key=cleaned_key)
        base_image = Image.open(io.BytesIO(image_bytes)).copy()
        prompt_instructions = (
            "You are an expert reverse-prompt engineer. Analyze the uploaded image in extreme detail and "
            "generate one optimized image-generation prompt that can recreate or faithfully remix it. "
            "Respect the user's instruction while preserving the visual truth of the uploaded image. "
            "Describe objects, colors, lighting, background, composition, style, mood, textures, and "
            "visible text. Return only the final prompt text."
        )
        last_error: Optional[Exception] = None

        for model_name in models_to_try:
            for attempt in range(1, len(retry_wait_schedule) + 2):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            prompt_instructions,
                            f"User instruction: {instruction}",
                            base_image.copy(),
                        ],
                    )
                    recreated_prompt = (getattr(response, "text", "") or "").strip()
                    if not recreated_prompt:
                        raise ImageGenerationFailure(
                            "Gemini returned an empty recreation prompt.",
                            provider="google_gemini_api",
                            model=model_name,
                            error_code="EMPTY_RECREATION_PROMPT",
                            status_code=502,
                        )
                    logger.info("[IMAGE] Gemini recreation prompt for Pollinations (%s): %s", model_name, recreated_prompt[:180])
                    return recreated_prompt
                except ImageGenerationFailure:
                    raise
                except Exception as exc:
                    last_error = exc
                    error_text = str(exc)
                    is_transient = "503" in error_text or "UNAVAILABLE" in error_text or "high demand" in error_text.lower()
                    if is_transient and attempt <= len(retry_wait_schedule):
                        wait_seconds = retry_wait_schedule[attempt - 1]
                        logger.warning(
                            "[IMAGE] Gemini reverse prompt transient failure on %s (attempt %s). Retrying in %ss: %s",
                            model_name,
                            attempt,
                            wait_seconds,
                            exc,
                        )
                        time.sleep(wait_seconds)
                        continue
                    logger.warning(
                        "[IMAGE] Gemini reverse prompt failed on %s (attempt %s): %s",
                        model_name,
                        attempt,
                        exc,
                    )
                    break

        raise ImageGenerationFailure(
            f"Gemini image analysis failed: {last_error}",
            provider="google_gemini_api",
            model=models_to_try[-1],
            error_code="GEMINI_IMAGE_ANALYSIS_FAILED",
            status_code=503 if last_error and ("503" in str(last_error) or "UNAVAILABLE" in str(last_error)) else 502,
            retry_after_seconds=15 if last_error and ("503" in str(last_error) or "UNAVAILABLE" in str(last_error)) else None,
            action_required="Retry in a few moments if Gemini is under temporary demand spikes." if last_error and ("503" in str(last_error) or "UNAVAILABLE" in str(last_error)) else None,
        )
    except ImageGenerationFailure:
        raise
    except Exception as exc:
        logger.warning("[IMAGE] Gemini reverse prompt failed: %s", exc)
        raise ImageGenerationFailure(
            f"Gemini image analysis failed: {exc}",
            provider="google_gemini_api",
            model="gemini-2.5-flash",
            error_code="GEMINI_IMAGE_ANALYSIS_FAILED",
            status_code=502,
        ) from exc
    finally:
        for name, value in saved_env.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value


def _gallery_images() -> List[Dict[str, Any]]:
    return state.image_backup.get_index().get("images", [])


def _current_selected_image() -> Optional[Dict[str, Any]]:
    selected_id = state.image_widget_context.get("selected_image_id")
    selected_number = state.image_widget_context.get("selected_image_number")
    images = _gallery_images()
    if selected_id:
        for image in images:
            if image.get("id") == selected_id:
                return image
    if selected_number:
        for image in images:
            if int(image.get("display_number", 0) or 0) == int(selected_number):
                return image
    return None


def _find_images_by_query(query: str) -> List[Dict[str, Any]]:
    lowered = (query or "").strip().lower()
    if not lowered:
        return []
    matches = []
    for image in _gallery_images():
        prompt = (image.get("prompt") or "").lower()
        image_id = (image.get("id") or "").lower()
        if lowered in prompt or lowered in image_id:
            matches.append(image)
    return matches


def _image_label(image: Dict[str, Any]) -> str:
    prompt = (image.get("prompt") or "").strip() or "Untitled image"
    if len(prompt) > 68:
        prompt = f"{prompt[:65]}..."
    created_at = image.get("created_at") or image.get("timestamp") or ""
    when = ""
    if created_at:
        try:
            when = datetime.fromisoformat(created_at.replace("Z", "+00:00")).strftime("%b %d, %Y %H:%M")
        except Exception:
            when = created_at
    return f"image #{image.get('display_number')}{f' ({when})' if when else ''} - {prompt}"


def _describe_image(image: Dict[str, Any]) -> str:
    prompt = (image.get("prompt") or "").strip() or "Untitled image"
    created_at = image.get("created_at") or image.get("timestamp") or "unknown time"
    provider = image.get("provider") or "unknown provider"
    model = image.get("model") or ""
    model_text = f" using {model}" if model else ""
    return (
        f"Showing image number {image.get('display_number')}. "
        f"It was created on {created_at} with {provider}{model_text}. "
        f"The prompt was: {prompt}"
    )


def _send_widget_control(
    websocket: WebSocket,
    *,
    widget: str = "image",
    command: str,
    request_id: Optional[str] = None,
    prompt: Optional[str] = None,
    image_number: Optional[int] = None,
    image_id: Optional[str] = None,
    query: Optional[str] = None,
    fit_mode: Optional[str] = None,
    extra_payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    message = {
        "type": "widget_control",
        "widget": widget,
        "command": command,
        "request_id": request_id or f"server-{widget}-{uuid.uuid4().hex}",
        "source": "server_direct",
    }
    if prompt:
        message["prompt"] = prompt
    if image_number:
        message["image_number"] = image_number
    if image_id:
        message["image_id"] = image_id
    if query:
        message["query"] = query
    if fit_mode:
        message["fit_mode"] = fit_mode
    if extra_payload:
        message.update(extra_payload)
    return message


async def _resolve_image_widget_request(websocket: WebSocket, user_text: str) -> Optional[str]:
    lowered = (user_text or "").strip().lower()
    if not lowered:
        return None

    if not re.search(r"\b(image|images|gallery|picture|photo)\b", lowered):
        return None

    images = _gallery_images()
    image_count = len(images)
    if re.search(r"\b(scroll down|scroll up|scroll to|top of|bottom of|go back|back to gallery|back to create)\b", lowered):
        if "scroll down" in lowered:
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="scroll_gallery_down"))
            return "I've scrolled the image gallery down."
        if "scroll up" in lowered:
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="scroll_gallery_up"))
            return "I've scrolled the image gallery up."
        if re.search(r"\b(top|beginning)\b", lowered):
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="scroll_gallery_top"))
            return "I've moved to the top of the image gallery."
        if re.search(r"\b(bottom|end)\b", lowered):
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="scroll_gallery_bottom"))
            return "I've moved to the bottom of the image gallery."
        if "back to gallery" in lowered or ("go back" in lowered and "gallery" in lowered):
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="back_to_gallery"))
            return "I've returned to the image gallery."
        if "back to create" in lowered or (("go back" in lowered or "return" in lowered) and re.search(r"\b(create|generator|prompt)\b", lowered)):
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="back_to_create"))
            return "I've returned to the image generator."

    if re.search(r"\b(open|show|display|view)\b", lowered) and "gallery" in lowered:
        await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="show_gallery"))
        return f"I've opened your image gallery with {image_count} saved images."

    number_match = re.search(r"\b(?:image|picture|photo)\s*(?:number|#)?\s*(\d{1,3})\b", lowered)
    requested_number = int(number_match.group(1)) if number_match else None
    if requested_number is None:
        word_numbers = {
            "one": 1, "first": 1,
            "two": 2, "second": 2,
            "three": 3, "third": 3,
            "four": 4, "fourth": 4,
            "five": 5, "fifth": 5,
            "six": 6, "sixth": 6,
            "seven": 7, "seventh": 7,
            "eight": 8, "eighth": 8,
            "nine": 9, "ninth": 9,
            "ten": 10, "tenth": 10,
        }
        for label, value in word_numbers.items():
            if re.search(rf"\b(?:image|picture|photo)\s+(?:number\s+)?{label}\b", lowered):
                requested_number = value
                break
    if requested_number and re.search(r"\b(open|show|display|view|tell me about|what is|what was|when was)\b", lowered):
        match = next((image for image in images if int(image.get("display_number", 0) or 0) == requested_number), None)
        if not match:
            return f"I couldn't find image number {requested_number}. Your gallery currently has {image_count} saved images."
        await ws_manager.send_to_client(
            websocket,
            _send_widget_control(
                websocket,
                command="open_gallery_image",
                image_number=requested_number,
                image_id=match.get("id"),
            ),
        )
        if re.search(r"\b(tell me about|what is|what was|when was|information about)\b", lowered):
            return _describe_image(match)
        return f"I've opened image number {requested_number}."

    if re.search(r"\b(this image|current image|selected image)\b", lowered):
        selected = _current_selected_image()
        if not selected:
            return "I don't have a currently selected image yet. Ask me to open an image by number or subject first."
        if re.search(r"\b(tell me about|what is|what was|when was|information about)\b", lowered):
            await ws_manager.send_to_client(
                websocket,
                _send_widget_control(
                    websocket,
                    command="open_gallery_image",
                    image_number=selected.get("display_number"),
                    image_id=selected.get("id"),
                ),
            )
            return _describe_image(selected)

    subject_match = None
    subject_patterns = [
        r"\b(?:open|show|display|view|tell me about|information about)\s+(?:the\s+)?(?:image|picture|photo)\s+(?:of|about|for)\s+(.+)$",
        r"\b(?:open|show|display|view|tell me about|information about)\s+(?:the\s+)?(.+?)\s+(?:image|picture|photo)\b",
    ]
    for pattern in subject_patterns:
        candidate = re.search(pattern, user_text, re.IGNORECASE)
        if candidate:
            subject_match = candidate.group(1).strip(" .,!?:;")
            subject_match = re.sub(
                r"\s+(?:in|inside|on|from)\s+(?:the\s+)?(?:image\s+widget|widget|gallery)\s*$",
                "",
                subject_match,
                flags=re.IGNORECASE,
            ).strip(" .,!?:;")
            break
    if subject_match:
        matches = _find_images_by_query(subject_match)
        if not matches:
            return f'I could not find a saved image matching "{subject_match}".'
        if len(matches) > 1:
            listed = "; ".join(_image_label(image) for image in matches[:5])
            extra = f" There are {len(matches) - 5} more matches." if len(matches) > 5 else ""
            await ws_manager.send_to_client(websocket, _send_widget_control(websocket, command="show_gallery"))
            return f'I found multiple matches for "{subject_match}": {listed}.{extra} Tell me which image number to open.'
        match = matches[0]
        await ws_manager.send_to_client(
            websocket,
            _send_widget_control(
                websocket,
                command="open_gallery_image",
                image_number=match.get("display_number"),
                image_id=match.get("id"),
                query=subject_match,
            ),
        )
        if re.search(r"\b(tell me about|information about)\b", lowered):
            return _describe_image(match)
        return f'I found and opened {_image_label(match)}.'

    if re.search(r"\b(how many|how much)\b", lowered) and "image" in lowered:
        return f"You currently have {image_count} saved images in the gallery."

    return None


async def _resolve_search_widget_request(websocket: WebSocket, user_text: str) -> Optional[str]:
    if not is_explicit_search_request(user_text):
        return None

    query = extract_search_query(user_text)
    if not query:
        return None

    _, search_options = parse_search_request(user_text)
    loading_message = _send_widget_control(
        websocket,
        widget="search",
        command="set_loading",
        query=query,
        extra_payload={
            "loading": True,
            "search_type": search_options.get("target_site") or "web",
            "original_transcript": user_text,
        },
    )
    state.update_search_widget_context(loading_message)
    await ws_manager.send_to_client(websocket, loading_message)
    return None


async def _resolve_task_widget_request(websocket: WebSocket, user_text: str) -> Optional[str]:
    """Persist explicit task delegation before legacy Aegis reminder parsing can consume it."""
    cleaned = re.sub(r"\s+", " ", str(user_text or "")).strip()
    lowered = cleaned.lower()
    explicit = bool(
        re.search(r"\b(?:create|add|make|schedule|start)\s+(?:a\s+)?(?:new\s+)?task\b", lowered)
        or re.search(r"\bremind me to\b", lowered)
        or re.search(r"\baegis[, ]+(?:please\s+)?(?:work on|research|do|handle|prepare|build|fix)\b", lowered)
    )
    if not explicit:
        return None

    kind = "research" if re.search(r"\b(research|investigate|compare|study)\b", lowered) else (
        "action" if re.search(r"\b(clean|tidy|delete|move|archive|send|publish|update|fix|build)\b", lowered) else "prompt"
    )
    trigger: Dict[str, Any] = {"kind": "manual", "timezone": configured_timezone(), "enabled": True}
    schedule_match = re.search(
        r"\b(hourly|daily|weekly|every\s+(?:day|week|hour|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d{1,2}:\d{2})?|weekdays\s+at\s+\d{1,2}:\d{2})\b",
        lowered,
    )
    event_match = re.search(r"\bafter\s+(\d{1,5})\s+(messages?|sessions?|app events?)\b", lowered)
    if schedule_match:
        trigger = {"kind": "schedule", "schedule": schedule_match.group(1), "timezone": configured_timezone(), "enabled": True}
    elif event_match:
        event_name = "messages" if event_match.group(2).startswith("message") else "sessions" if event_match.group(2).startswith("session") else "app_events"
        trigger = {"kind": "event", "event_name": event_name, "every_count": int(event_match.group(1)), "timezone": configured_timezone(), "enabled": True}

    title = re.sub(
        r"^(?:aegis[, ]+)?(?:please\s+)?(?:(?:create|add|make|schedule|start)\s+(?:a\s+)?(?:new\s+)?task(?:\s+to|\s+for)?|remind me to|work on|do|handle)\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip(" .,:;-")
    title = re.split(r"\b(?:hourly|daily|weekly|every|weekdays|after\s+\d+)\b", title, maxsplit=1, flags=re.IGNORECASE)[0].strip(" .,:;-")
    title = (title or cleaned)[:240]
    correlation_id = f"voice-{uuid.uuid4()}"
    task = task_store.create_task(
        "local",
        {
            "title": title,
            "instruction": cleaned,
            "kind": kind,
            "priority": "normal",
            "tags": ["Aegis"],
            "project": "",
            "due_at": None,
            "timezone": configured_timezone(),
            "trigger": trigger,
            "checklist": [],
            "dependency_ids": [],
            "metadata": {"original_transcript": cleaned},
            "lifecycle": "active",
        },
        source="voice",
        correlation_id=correlation_id,
    )
    should_run = trigger["kind"] == "manual" and not lowered.startswith("remind me")
    if should_run:
        task_store.create_run("local", task["id"], "high" if kind == "action" else "low")
        task_orchestrator.wake()
    await ws_manager.send_to_client(
        websocket,
        _send_widget_control(
            websocket,
            widget="task",
            command="open",
            request_id=correlation_id,
            extra_payload={"task_id": task["id"], "source": "aegis-task"},
        ),
    )
    timing = " and added it to Aegis's queue" if should_run else ""
    return f"I created the task “{title}”{timing}. You can follow it in the Tasks command center."


def generate_image_with_google(prompt: str, model: str, fallback_model: str, api_key: str) -> str:
    """
    Generate an image using the Google Gemini Imagen API.

    Primary path  : google-genai SDK v2  (google.genai)
    Fallback path : Imagen REST endpoint (generativelanguage.googleapis.com)
    """
    if not api_key:
        logger.info("[IMAGE] No Google API key found; using free Pollinations fallback.")

    logger.info(f"[IMAGE] Generating image – model: {model}")

    # FORCE FREE PATH: Bypass the broken Google SDK and use our free Pollinations function
    try:
        return _generate_image_rest(prompt, model, api_key)
    except Exception as e:
        logger.error(f"Free generation failed: {e}")
        raise e


class AegisAIProcess:
    """Manager for Aegis AI subprocess communication"""
    def __init__(self, aegis_ai_script_path: str, event_loop: Optional[asyncio.AbstractEventLoop] = None):
        self.script_path = aegis_ai_script_path
        self.event_loop = event_loop
        self.process: Optional[subprocess.Popen] = None
        self.output_queue: queue.Queue = queue.Queue()
        self.reader_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.initialization_complete = False
        self.startup_timeout = 60  # seconds - Aegis AI takes time to initialize all modules
        self._turn_lock = asyncio.Lock()
        
    async def start(self):
        """Start Aegis AI in a subprocess"""
        try:
            logger.info(f"[AEGIS-AI] Starting subprocess: {self.script_path}")
            
            workspace_root = Path(__file__).resolve().parents[3]
            package_root = workspace_root / "astra_ai"
            
            candidate_pythons = [
                package_root / '.venv' / 'Scripts' / 'python.exe',
                package_root / '.venv_311' / 'Scripts' / 'python.exe',
                package_root / '.venv-1' / 'Scripts' / 'python.exe',
                package_root / 'venv' / 'Scripts' / 'python.exe',
            ]
            python_exe = next((str(p) for p in candidate_pythons if p.exists()), None)
            
            if not python_exe:
                logger.error(f"[AEGIS-AI] Python executable not found in any configured venv")
                return False
            
            logger.info(f"[AEGIS-AI] Using Python: {python_exe}")
            
            env = os.environ.copy()
            env["PYTHONPATH"] = str(workspace_root)
            env["PYTHONIOENCODING"] = "utf-8"
            env["PYTHONUTF8"] = "1"
            
            # Spawn Aegis AI process - merge stderr into stdout
            self.process = subprocess.Popen(
                [python_exe, self.script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                bufsize=1,
                cwd=str(package_root),
                env=env,
            )
            
            self.is_running = True
            logger.info(f"[AEGIS-AI] Process started with PID {self.process.pid}")
            
            # Start reader thread to capture output
            self.reader_thread = threading.Thread(target=self._read_process_output, daemon=True)
            self.reader_thread.start()
            logger.info(f"[AEGIS-AI] Reader thread started")
            
            # Wait for initialization - read until the Aegis AI subprocess is ready for stdin
            start_time = time.time()
            found_ready = False
            
            while not found_ready and (time.time() - start_time) < self.startup_timeout:
                try:
                    # Try to get output from the queue
                    output = self.output_queue.get(timeout=1.0)
                    logger.info(f"[AEGIS-BOOT] {output}")
                    
                    # Check for readiness indicators from Aegis AI
                    if (
                        "Listening" in output or
                        "> " in output or
                        "Server mode active - reading from stdin" in output or
                        "Available commands:" in output or
                        "Conversation persistence layer initialized successfully" in output
                    ):
                        found_ready = True
                        logger.info(f"[AEGIS-AI] [OK] Aegis AI Ready and listening")
                
                except queue.Empty:
                    logger.debug(f"[AEGIS-AI] Waiting for output...")
                    continue
            
            if not found_ready:
                logger.error(f"[AEGIS-AI] Timeout - never detected Aegis AI readiness")
                self.stop()
                return False
            
            self.initialization_complete = True
            return True
        
        except Exception as e:
            logger.error(f"[AEGIS-AI] Failed to start: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _read_process_output(self):
        """Background thread: read stdout from aegis_ai process"""
        try:
            if not self.process or not self.process.stdout:
                return
            
            widget_command_buffer = ""
            in_widget_command = False
            
            for line in iter(self.process.stdout.readline, ''):
                if line:
                    clean_line = line.rstrip('\n')
                    
                    # ===== DETECT WIDGET COMMANDS =====
                    if "[WIDGET_COMMAND_START]" in clean_line:
                        in_widget_command = True
                        widget_command_buffer = ""
                        logger.info("[WIDGET] Widget command detected - starting buffer")
                        continue
                    
                    if "[WIDGET_COMMAND_END]" in clean_line:
                        if in_widget_command and widget_command_buffer.strip():
                            try:
                                widget_cmd = json.loads(widget_command_buffer.strip())
                                payload = widget_cmd.get("payload", {}) or {}
                                frontend_cmd = {
                                    "type": "widget_control",
                                    "widget": widget_cmd.get("widget"),
                                    "command": widget_cmd.get("command") or widget_cmd.get("action", "open"),
                                    "request_id": widget_cmd.get("request_id") or f"widget-{uuid.uuid4().hex}",
                                    "source": widget_cmd.get("source", "aegis_ai"),
                                }
                                merged_payload = {**payload}
                                for key, value in widget_cmd.items():
                                    if key not in {"type", "widget", "command", "action", "request_id", "source", "payload"}:
                                        merged_payload[key] = value
                                frontend_cmd.update(merged_payload)
                                if frontend_cmd.get("widget") == "search":
                                    search_command = str(frontend_cmd.get("command") or "").strip().lower()
                                    if (
                                        state.current_transcript_source == "search_widget"
                                        and state.current_transcript_request_id
                                        and search_command in {"set_loading", "show_results"}
                                    ):
                                        frontend_cmd["request_id"] = state.current_transcript_request_id
                                    if search_command == "restore_latest":
                                        restored = state.restore_latest_search_request()
                                        snapshot = build_frontend_payload(restored)
                                        if snapshot:
                                            frontend_cmd = snapshot
                                    elif search_command == "restore_search_result":
                                        restore_id = str(frontend_cmd.get("request_id_to_restore") or frontend_cmd.get("target_request_id") or "").strip()
                                        if not restore_id:
                                            restore_query = str(frontend_cmd.get("query") or "").strip()
                                            if restore_query:
                                                restore_id = str(state.resolve_search_request_id(restore_query) or "").strip()
                                        if restore_id:
                                            restored = state.restore_search_request(restore_id)
                                            snapshot = build_frontend_payload(restored)
                                            if snapshot:
                                                frontend_cmd = snapshot
                                    elif search_command == "delete_search_result":
                                        delete_id = str(frontend_cmd.get("request_id_to_delete") or frontend_cmd.get("target_request_id") or "").strip()
                                        if not delete_id:
                                            delete_query = str(frontend_cmd.get("query") or "").strip()
                                            if delete_query:
                                                delete_id = str(state.resolve_search_request_id(delete_query) or "").strip()
                                        if delete_id:
                                            updated = state.delete_search_request(delete_id)
                                            snapshot = build_frontend_payload(updated)
                                            if snapshot:
                                                frontend_cmd = snapshot
                                            else:
                                                frontend_cmd = {
                                                    "type": "widget_control",
                                                    "widget": "search",
                                                    "command": "show_history" if state.get_search_history_preview() else "clear_current",
                                                    "source": "server_state",
                                                    "history_preview": state.get_search_history_preview(),
                                                    "view_mode": "history" if state.get_search_history_preview() else "current",
                                                }
                                    elif search_command in {"show_history", "show_current", "clear_current", "set_loading", "show_results", "close", "hide", "dismiss", "open", "show", "activate"}:
                                        updated = state.update_search_widget_context(frontend_cmd)
                                        if (
                                            search_command == "show_results"
                                            and str(updated.get("current", {}).get("request_id") or "")
                                            != str(frontend_cmd.get("request_id") or "")
                                        ):
                                            logger.info("[SEARCH] Dropping stale Aegis result %s", frontend_cmd.get("request_id"))
                                            frontend_cmd = None
                                        snapshot = build_frontend_payload(updated)
                                        if frontend_cmd is not None and search_command in {"show_history", "show_current", "clear_current"} and snapshot:
                                            frontend_cmd = snapshot
                                logger.info(f"[WIDGET] Relaying command: {frontend_cmd}")
                                if frontend_cmd is None:
                                    pass
                                elif self.event_loop and self.event_loop.is_running():
                                    asyncio.run_coroutine_threadsafe(
                                        _execute_aegis_widget_envelope(frontend_cmd),
                                        self.event_loop
                                    )
                                else:
                                    logger.error("[WIDGET] Cannot relay command: server event loop unavailable")
                            except json.JSONDecodeError as e:
                                logger.error(f"[WIDGET] Failed to parse widget command JSON: {e}")
                            except Exception as e:
                                logger.error(f"[WIDGET] Error broadcasting widget command: {e}")
                        in_widget_command = False
                        widget_command_buffer = ""
                        continue
                    
                    if in_widget_command:
                        widget_command_buffer += clean_line + "\n"
                        continue
                    
                    # ===== REGULAR OUTPUT =====
                    self.output_queue.put(clean_line)
                    try:
                        wire_message = json.loads(clean_line)
                    except (json.JSONDecodeError, TypeError):
                        wire_message = None
                    if isinstance(wire_message, dict) and wire_message.get("type") == "aegis_response":
                        logger.info(
                            "[RAW-SUBPROCESS] Aegis response queued id=%s chars=%s depth=%s",
                            str(wire_message.get("request_id") or ""),
                            len(str(wire_message.get("text") or "")),
                            self.output_queue.qsize(),
                        )
                    else:
                        logger.debug("[RAW-SUBPROCESS] Non-protocol output queued depth=%s", self.output_queue.qsize())
        
        except Exception as e:
            logger.error(f"[AEGIS-AI] Error reading output: {e}")
            import traceback
            logger.error(traceback.format_exc())
        finally:
            logger.info(f"[AEGIS-AI] Process output reader ended")
            self.is_running = False
    
    async def send_message(
        self,
        user_input: str,
        timeout: float = 30.0,
        *,
        request_id: str = "",
        widget_context: Optional[Dict[str, Any]] = None,
        source: str = "server",
        skip_widget_planner: bool = False,
        search_already_completed: bool = False,
    ) -> Optional[str]:
        """
        Send message to Aegis AI via stdin and wait for response.
        Falls back to reading from nova_ai_memory.json if subprocess response fails.
        
        Returns: The COMPLETE AI response text (everything Aegis AI says)
        """
        if not self.process or not self.process.stdin:
            logger.error(f"[AEGIS-AI] Process not running")
            return None
        
        turn_id = request_id or f"aegis-{uuid.uuid4().hex}"
        envelope = {
            "type": "aegis_turn", "protocol_version": 1, "request_id": turn_id,
            "user_text": user_input, "widget_context": widget_context or {},
            "source": source, "skip_widget_planner": bool(skip_widget_planner),
            "search_already_completed": bool(search_already_completed),
        }
        try:
            async with self._turn_lock:
                logger.info(
                    "[AEGIS-AI] Sending turn id=%s source=%s text_chars=%s context_bytes=%s",
                    turn_id, source, len(user_input),
                    len(json.dumps(widget_context or {}, ensure_ascii=False).encode("utf-8")),
                )
                self.process.stdin.write(json.dumps(envelope, ensure_ascii=False, separators=(",", ":")) + '\n')
                self.process.stdin.flush()
                logger.info("[AEGIS-AI] Turn sent; waiting for correlated response")
                start_time = time.time()
                while time.time() - start_time < timeout:
                    try:
                        line = self.output_queue.get(timeout=1.0)
                        if not line or not line.strip():
                            continue
                        cleaned_line = line.strip()
                        try:
                            response_envelope = json.loads(cleaned_line)
                        except (json.JSONDecodeError, TypeError):
                            response_envelope = None
                        if isinstance(response_envelope, dict) and response_envelope.get("type") == "aegis_response":
                            if str(response_envelope.get("request_id") or "") != turn_id:
                                logger.debug("[AEGIS-AI] Ignoring response for another turn")
                                continue
                            response_text = str(response_envelope.get("text") or "").strip()
                            logger.info("[AEGIS-AI] Response captured id=%s chars=%s", turn_id, len(response_text))
                            return response_text

                        # Compatibility with older Aegis processes during a rolling restart.
                        if cleaned_line.startswith(">"):
                            cleaned_line = cleaned_line[1:].strip()
                        if cleaned_line.startswith("Aegis: "):
                            response_text = cleaned_line.replace("Aegis: ", "").strip()
                            logger.info("[AEGIS-AI] Legacy response captured id=%s chars=%s", turn_id, len(response_text))
                            return response_text
                        elif cleaned_line.startswith("Aegis AI: "):
                            response_text = cleaned_line.replace("Aegis AI: ", "").strip()
                            return response_text
                        else:
                            continue
                    except queue.Empty:
                        continue
                    except Exception as e:
                        logger.debug(f"[AEGIS-AI] Error in response loop: {e}")
                        continue

                logger.warning("[AEGIS-AI] Timeout waiting for correlated response id=%s", turn_id)
                # Never speak an unrelated previous response. A timed-out turn
                # has no trustworthy correlated fallback.
                return None
        
        except Exception as e:
            logger.error(f"[AEGIS-AI] Error sending message: {e}")
            return None
    
    async def _get_response_from_memory(self, user_input: str) -> Optional[str]:
        """
        Fallback: Read the last AI response from nova_ai_memory.json.
        This ensures we get the complete AI response even if subprocess capture fails.
        """
        try:
            # Try multiple possible memory file paths
            possible_paths = [
                Path("Date/nova_ai_memory.json"),
                Path("d:/Astra_ai/Date/nova_ai_memory.json"),
                Path("./Date/nova_ai_memory.json"),
                Path(os.path.expandvars("${USERPROFILE}/Astra_ai/Date/nova_ai_memory.json")) if "${USERPROFILE}" in os.environ else None,
            ]
            
            memory_file = None
            for path in possible_paths:
                if path and path.exists():
                    memory_file = path
                    logger.info(f"[MEMORY-FALLBACK] Found memory file at: {memory_file}")
                    break
            
            if not memory_file:
                logger.warning(f"[MEMORY-FALLBACK] nova_ai_memory.json not found in any expected location")
                return None
            
            with open(memory_file, 'r', encoding='utf-8') as f:
                memory_data = json.load(f)
            
            # Get the last assistant response from conversation history
            conversation = memory_data.get("conversation", [])
            
            # Find the last assistant message after the user input
            last_assistant_response = None
            for i in range(len(conversation) - 1, -1, -1):
                msg = conversation[i]
                if msg.get("role") == "assistant":
                    last_assistant_response = msg.get("content", "")
                    break
            
            if last_assistant_response:
                logger.info(f"[MEMORY-FALLBACK] <<<<<<<<<< RESPONSE FROM MEMORY <<<<<<<<<< {last_assistant_response}")
                return last_assistant_response
            else:
                logger.warning("[MEMORY-FALLBACK] No assistant response found in memory")
                return None
        
        except Exception as e:
            logger.error(f"[MEMORY-FALLBACK] Error reading from memory: {e}")
            return None
    
    def stop(self):
        """Stop the Aegis AI process"""
        if self.process:
            try:
                logger.info(f"[AEGIS-AI] Stopping process (PID {self.process.pid})...")
                self.process.stdin.close() if self.process.stdin else None
                self.process.terminate()
                
                # Wait for graceful shutdown
                try:
                    self.process.wait(timeout=5)
                    logger.info(f"[AEGIS-AI] Process terminated gracefully")
                except subprocess.TimeoutExpired:
                    logger.warning(f"[AEGIS-AI] Force killing process...")
                    self.process.kill()
                    self.process.wait()
            
            except Exception as e:
                logger.error(f"[AEGIS-AI] Error stopping process: {e}")
        
        self.is_running = False
        self.process = None


class ServerState:
    """Global server state"""
    def __init__(self):
        workspace_root = Path(__file__).resolve().parents[3]
        package_root = Path(__file__).resolve().parents[2]
        self.aegis_ai: Optional[AegisAIProcess] = None
        self.aegis_ai_lock = asyncio.Lock()
        self.event_loop: Optional[asyncio.AbstractEventLoop] = None
        self.gemini_api_key = str(os.getenv("GEMINI_API_KEY") or "").strip()
        self.live_sessions: Dict[WebSocket, GeminiLiveSession] = {}
        self.live_providers: Dict[WebSocket, str] = {}
        self.live_retries: Dict[WebSocket, int] = {}
        self.active_connections: Set[WebSocket] = set()
        self.is_processing = False
        self.current_user_session = "default"
        self.current_client_id: Optional[str] = None
        self.current_transcript_request_id = ""
        self.current_transcript_source = ""
        self.widget_connections = WidgetConnectionRuntime()
        self.widget_turn_actions: Dict[str, Dict[str, Optional[Dict[str, Any]]]] = {}
        self.processed_transcripts: Set[str] = set()
        self.task_counter = 0
        self.image_generation_lock = threading.Lock()
        self.memory_monitor_task: Optional[asyncio.Task] = None
        self.memory_file = package_root / "Date" / "nova_ai_memory.json"
        self.live_memory = LiveMemoryManager(
            memory_path=package_root / "memory" / "long_term.json",
            transcript_path=self.memory_file,
            aegis_source=workspace_root / "Aegis-MK37-main" / "memory" / "long_term.json",
            legacy_transcript_path=workspace_root / "Date" / "nova_ai_memory.json",
        )
        self.memory_stats: Dict[str, Any] = {}
        self.start_time = time.time()  # Track when server started for uptime calculation
        self.backend_dir = Path(__file__).parent
        self.search_state_dir = runtime_paths.widget("search")
        self.news_state_dir = runtime_paths.widget("news")
        self.context_preprocessor = ContextPreprocessor(runtime_paths.cache/"context")
        self.weather_runtime = WeatherRuntimeService(
            backend_dir=self.backend_dir,
            weather_service_factory=_load_weather_service,
            logger=logger,
            fallback_location=DEFAULT_WEATHER_FALLBACK_LOCATION,
            ipinfo_url=IPINFO_LOCATION_URL,
        )
        self.weather_state_dir = self.weather_runtime.state_dir
        self.weather_location_snapshot_file = self.weather_runtime.location_snapshot_file
        self.weather_history_file = self.weather_runtime.weather_history_file
        self.notes_state_dir = prepare_notes_state_dir(
            runtime_paths.widget("notes"),
            legacy_dirs=[self.backend_dir / "notes_widget_data"],
        )
        self.search_state_lock = threading.Lock()
        self.news_state_lock = threading.Lock()
        self.news_layout_lock = threading.Lock()
        self.notes_state_lock = threading.Lock()
        self.location_refresh_task: Optional[asyncio.Task] = None
        self.image_widget_context: Dict[str, Any] = {
            "current_view": "create",
            "selected_image_id": None,
            "selected_image_number": None,
            "selected_prompt": None,
            "last_gallery_query": None,
            "recent_results": deque(maxlen=12),
        }
        self.search_widget_context: Dict[str, Any] = load_search_widget_state(self.search_state_dir)
        self.news_widget_context: Dict[str, Any] = load_news_widget_state(self.news_state_dir)
        self.news_layout_context: Dict[str, Any] = load_layout_state(self.news_state_dir)
        notes_state = load_notes_state(self.notes_state_dir)
        self.notes_data: List[Dict[str, Any]] = notes_state.get("notes", [])
        self.notes_summaries: List[Dict[str, Any]] = notes_state.get("summaries", [])
        
        # Initialize image backup manager
        self.image_backup = ImageBackupManager(runtime_paths.generated)

    def begin_widget_turn(self, client_id: str) -> None:
        self.widget_turn_actions[client_id] = {}

    def register_widget_action(self, client_id: str, request_id: str) -> None:
        if client_id:
            self.widget_turn_actions.setdefault(client_id, {})[request_id] = None

    def resolve_widget_action(self, client_id: str, request_id: str, result: Dict[str, Any]) -> None:
        if client_id and request_id in self.widget_turn_actions.get(client_id, {}):
            self.widget_turn_actions[client_id][request_id] = dict(result)

    async def await_widget_turn(self, client_id: str, timeout: float = 2.5) -> List[Dict[str, Any]]:
        # Give stdout-relayed commands one event-loop cycle to register, then
        # briefly wait for real frontend/backend completion results.
        await asyncio.sleep(0.08)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            actions = self.widget_turn_actions.get(client_id, {})
            if actions and all(result is not None for result in actions.values()):
                break
            if not actions:
                break
            await asyncio.sleep(0.04)
        return [result for result in self.widget_turn_actions.pop(client_id, {}).values() if result]

    async def await_widget_action(self, client_id: str, request_id: str, timeout: float = 3.0) -> Optional[Dict[str, Any]]:
        """Wait for exactly one correlated frontend result.

        A widget connection snapshot and a widget command can complete close
        together; waiting on the whole per-client map can therefore return the
        wrong result. This method isolates one request ID and removes only it.
        """
        if not client_id or not request_id:
            return None
        await asyncio.sleep(0.05)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            result = self.widget_turn_actions.get(client_id, {}).get(request_id)
            if result is not None:
                self.widget_turn_actions.get(client_id, {}).pop(request_id, None)
                return dict(result)
            await asyncio.sleep(0.04)
        self.widget_turn_actions.get(client_id, {}).pop(request_id, None)
        return None

    def _default_client_location_snapshot(self) -> Dict[str, Any]:
        return self.weather_runtime.default_location_snapshot()

    def _load_client_location_snapshot_from_disk(self) -> None:
        return None

    def _save_client_location_snapshot(self) -> None:
        return None

    def _fetch_ipinfo_location_snapshot(self) -> Dict[str, Any]:
        return self.weather_runtime._fetch_ipinfo_location_snapshot()

    def refresh_client_location_snapshot(self) -> Dict[str, Any]:
        return self.weather_runtime.refresh_client_location_snapshot(force=False)

    def update_client_location(
        self,
        *,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        label: str = "",
    ) -> Dict[str, Any]:
        return self.weather_runtime.update_client_location(
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            label=label,
        )

    def merge_client_location_label(self, label: str) -> Dict[str, Any]:
        return self.weather_runtime.merge_client_location_label(label)

    def get_client_location(self) -> Dict[str, Any]:
        return self.weather_runtime.get_client_location()

    async def refresh_client_location_snapshot_async(self) -> Dict[str, Any]:
        return await self.weather_runtime.refresh_client_location_snapshot_async(force=False)

    async def _location_refresh_loop(self) -> None:
        await self.weather_runtime.location_refresh_loop()

    def get_weather_history(self, *, date: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        return self.weather_runtime.get_weather_history(date=date, limit=limit)

    def record_widget_result(self, message: Dict[str, Any]) -> None:
        widget = message.get("widget")
        if widget == "search":
            command = str(message.get("command") or "").strip().lower()
            return

        if widget != "image":
            return
        current_view = message.get("current_view")
        if isinstance(current_view, str) and current_view:
            self.image_widget_context["current_view"] = current_view
        if message.get("selected_image_id"):
            self.image_widget_context["selected_image_id"] = message.get("selected_image_id")
        if message.get("selected_image_number"):
            self.image_widget_context["selected_image_number"] = message.get("selected_image_number")
        if message.get("selected_prompt"):
            self.image_widget_context["selected_prompt"] = message.get("selected_prompt")
        if message.get("query") is not None:
            self.image_widget_context["last_gallery_query"] = message.get("query")

        snapshot = {
            "command": message.get("command"),
            "status": message.get("status"),
            "detail": message.get("detail"),
            "selected_image_id": message.get("selected_image_id"),
            "selected_image_number": message.get("selected_image_number"),
            "selected_prompt": message.get("selected_prompt"),
            "provider": message.get("provider"),
            "model": message.get("model"),
            "created_at": message.get("created_at"),
            "current_view": self.image_widget_context["current_view"],
            "query": message.get("query"),
            "match_count": message.get("match_count"),
        }
        self.image_widget_context["recent_results"].append(snapshot)

    def update_search_widget_context(self, message: Dict[str, Any]) -> Dict[str, Any]:
        with self.search_state_lock:
            self.search_widget_context = apply_search_widget_command(
                self.search_widget_context or default_search_widget_state(),
                message,
                self.search_state_dir,
            )
            save_search_widget_state(self.search_state_dir, self.search_widget_context)
            return self.search_widget_context

    def _save_search_widget_state(self) -> None:
        with self.search_state_lock:
            save_search_widget_state(self.search_state_dir, self.search_widget_context)

    def build_search_widget_snapshot(self) -> Optional[Dict[str, Any]]:
        with self.search_state_lock:
            return build_frontend_payload(self.search_widget_context)

    def get_search_history_preview(self) -> List[Dict[str, Any]]:
        with self.search_state_lock:
            return get_history_preview(self.search_widget_context)

    def restore_search_request(self, request_id: str) -> Dict[str, Any]:
        with self.search_state_lock:
            self.search_widget_context = restore_history_entry(self.search_widget_context, self.search_state_dir, request_id)
            save_search_widget_state(self.search_state_dir, self.search_widget_context)
            return self.search_widget_context

    def restore_latest_search_request(self) -> Dict[str, Any]:
        with self.search_state_lock:
            self.search_widget_context = restore_latest_entry(self.search_widget_context, self.search_state_dir)
            save_search_widget_state(self.search_state_dir, self.search_widget_context)
            return self.search_widget_context

    def find_search_requests(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        with self.search_state_lock:
            return find_history_matches(self.search_widget_context, self.search_state_dir, query, limit=limit)

    def resolve_search_request_id(self, query: str) -> Optional[str]:
        with self.search_state_lock:
            return resolve_history_request_id(self.search_widget_context, self.search_state_dir, query)

    def delete_search_request(self, request_id: str) -> Dict[str, Any]:
        with self.search_state_lock:
            self.search_widget_context = delete_history_entry(self.search_widget_context, self.search_state_dir, request_id)
            save_search_widget_state(self.search_state_dir, self.search_widget_context)
            return self.search_widget_context

    def update_news_widget_context(self, message: Dict[str, Any]) -> Dict[str, Any]:
        with self.news_state_lock:
            self.news_widget_context = apply_news_widget_command(self.news_widget_context, message, self.news_state_dir)
            save_news_widget_state(self.news_state_dir, self.news_widget_context)
            return self.news_widget_context

    def get_news_history_preview(self) -> List[Dict[str, Any]]:
        with self.news_state_lock:
            return get_news_history_preview(self.news_widget_context)

    def restore_news_request(self, request_id: str) -> Dict[str, Any]:
        with self.news_state_lock:
            self.news_widget_context = restore_news_history_entry(self.news_widget_context, self.news_state_dir, request_id)
            save_news_widget_state(self.news_state_dir, self.news_widget_context)
            return self.news_widget_context

    def restore_latest_news_request(self) -> Dict[str, Any]:
        with self.news_state_lock:
            self.news_widget_context = restore_latest_news_entry(self.news_widget_context, self.news_state_dir)
            save_news_widget_state(self.news_state_dir, self.news_widget_context)
            return self.news_widget_context

    def find_news_requests(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        with self.news_state_lock:
            return find_news_history_matches(self.news_widget_context, self.news_state_dir, query, limit)

    def delete_news_request(self, request_id: str) -> Dict[str, Any]:
        with self.news_state_lock:
            self.news_widget_context = delete_news_history_entry(self.news_widget_context, self.news_state_dir, request_id)
            save_news_widget_state(self.news_state_dir, self.news_widget_context)
            return self.news_widget_context

    def archive_news_request(self, request_id: str) -> Dict[str, Any]:
        with self.news_state_lock:
            self.news_widget_context = archive_news_history_entry(self.news_widget_context, self.news_state_dir, request_id)
            save_news_widget_state(self.news_state_dir, self.news_widget_context)
            return self.news_widget_context

    def get_news_layouts(self) -> Dict[str, Any]:
        with self.news_layout_lock:
            return deepcopy(self.news_layout_context)

    def get_active_news_layout(self) -> Dict[str, Any]:
        with self.news_layout_lock:
            return get_active_news_layout(self.news_layout_context)

    def create_news_layout(self, layout: Dict[str, Any]) -> Dict[str, Any]:
        with self.news_layout_lock:
            self.news_layout_context = create_news_layout(self.news_layout_context, layout)
            save_layout_state(self.news_state_dir, self.news_layout_context)
            return deepcopy(self.news_layout_context)

    def update_news_layout(self, layout_id: str, layout: Dict[str, Any]) -> Dict[str, Any]:
        with self.news_layout_lock:
            self.news_layout_context = update_news_layout(self.news_layout_context, layout_id, layout)
            save_layout_state(self.news_state_dir, self.news_layout_context)
            return deepcopy(self.news_layout_context)

    def activate_news_layout(self, layout_id: str) -> Dict[str, Any]:
        with self.news_layout_lock:
            self.news_layout_context = set_active_news_layout(self.news_layout_context, layout_id)
            save_layout_state(self.news_state_dir, self.news_layout_context)
            return deepcopy(self.news_layout_context)

    def delete_news_layout(self, layout_id: str) -> Dict[str, Any]:
        with self.news_layout_lock:
            self.news_layout_context = delete_news_layout(self.news_layout_context, layout_id)
            save_layout_state(self.news_state_dir, self.news_layout_context)
            return deepcopy(self.news_layout_context)

    def get_notes_state(self) -> Dict[str, Any]:
        with self.notes_state_lock:
            return {
                "notes": list(self.notes_data),
                "summaries": list(self.notes_summaries),
            }

    def add_note(self, content: str, category: str = "") -> Dict[str, Any]:
        with self.notes_state_lock:
            note = add_note(self.notes_state_dir, self.notes_data, self.notes_summaries, content, category)
            self.notes_data = load_notes_state(self.notes_state_dir).get("notes", [])
            return note

    def update_note(self, note_id: str, content: str, category: str = "") -> Dict[str, Any]:
        with self.notes_state_lock:
            note = update_note(self.notes_state_dir, self.notes_data, self.notes_summaries, note_id, content, category)
            self.notes_data = load_notes_state(self.notes_state_dir).get("notes", [])
            return note

    def delete_note(self, note_id: str) -> List[Dict[str, Any]]:
        with self.notes_state_lock:
            self.notes_data = delete_saved_note(self.notes_state_dir, self.notes_data, self.notes_summaries, note_id)
            return list(self.notes_data)

    def clear_all_notes(self) -> None:
        with self.notes_state_lock:
            clear_notes(self.notes_state_dir, self.notes_summaries)
            refreshed = load_notes_state(self.notes_state_dir)
            self.notes_data = refreshed.get("notes", [])
            self.notes_summaries = refreshed.get("summaries", [])

    def add_summary(self, content: str, summary_type: str = "single-note", tags: Optional[List[str]] = None) -> Dict[str, Any]:
        with self.notes_state_lock:
            summary = add_summary(self.notes_state_dir, self.notes_data, self.notes_summaries, content, summary_type, tags)
            self.notes_summaries = load_notes_state(self.notes_state_dir).get("summaries", [])
            return summary

    def delete_summary(self, summary_id: str) -> List[Dict[str, Any]]:
        with self.notes_state_lock:
            self.notes_summaries = delete_summary(self.notes_state_dir, self.notes_data, self.notes_summaries, summary_id)
            return list(self.notes_summaries)

    def find_note(self, query: str) -> Optional[Dict[str, Any]]:
        with self.notes_state_lock:
            return find_matching_note(self.notes_data, query)

    def find_notes(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        lowered = str(query or "").strip().lower()
        with self.notes_state_lock:
            matches = []
            for note in self.notes_data:
                haystack = " ".join([
                    str(note.get("id") or ""),
                    str(note.get("content") or ""),
                    str(note.get("category") or ""),
                ]).lower()
                if lowered and lowered in haystack:
                    matches.append(note)
                if len(matches) >= max(1, min(int(limit), 25)):
                    break
            return matches

    def get_note_by_id(self, note_id: str) -> Optional[Dict[str, Any]]:
        cleaned_note_id = str(note_id or "").strip()
        if not cleaned_note_id:
            return None
        with self.notes_state_lock:
            for note in self.notes_data:
                if str(note.get("id") or "") == cleaned_note_id:
                    return dict(note)
        return None

    async def initialize(self):
        """Initialize server components"""
        logger.info("[INIT] Starting AEGIS Server...")
        try:
            self.memory_stats = await asyncio.to_thread(self.live_memory.ensure_ready)
            await asyncio.to_thread(self.live_memory.prepare_category_engine,dry_run=False)
            logger.info(
                "[MEMORY] Ready schema=%s facts=%s aegis_migrated=%s transcripts_migrated=%s",
                self.memory_stats.get("schema_version"),
                self.memory_stats.get("fact_count"),
                self.memory_stats.get("aegis_migrated"),
                self.memory_stats.get("transcripts_migrated"),
            )
        except Exception:
            logger.exception("[MEMORY] Long-term memory initialization failed")
        try:
            location_snapshot = await self.weather_runtime.initialize()
            logger.info(
                "[LOCATION] Cached startup location: %s",
                location_snapshot.get("label") or location_snapshot.get("weather_query") or DEFAULT_WEATHER_FALLBACK_LOCATION,
            )
            self.location_refresh_task = asyncio.create_task(self._location_refresh_loop())
        except Exception as exc:
            logger.warning("[LOCATION] Startup location refresh failed: %s", exc)

        notes_ai_status = _get_notes_ai_provider_status()
        configured_providers = notes_ai_status.get("configured", {})
        provider_order = notes_ai_status.get("order", [])
        logger.info(
            "[NOTES AI] Provider availability: openai=%s openrouter=%s groq=%s",
            configured_providers.get("openai", False),
            configured_providers.get("openrouter", False),
            configured_providers.get("groq", False),
        )
        if provider_order:
            logger.info(
                "[NOTES AI] Provider order: %s",
                " -> ".join(provider_order),
            )
            logger.info(
                "[NOTES AI] Primary model: %s",
                (
                    _get_notes_openai_model()
                    if provider_order[0] == "openai"
                    else _get_notes_openrouter_model()
                    if provider_order[0] == "openrouter"
                    else _get_notes_groq_model()
                ),
            )
        else:
            logger.warning(
                "[NOTES AI] Notes AI not configured. Set OPENAI_API_KEY, NOTES_WIDGET_OPENAI_API_KEY, "
                "OPENROUTER_API_KEY, or GROQ_API_KEY in .env."
            )
        
        # Gemini Live is the default conversational provider.  The legacy Aegis
        # subprocess is started lazily only if Gemini fails or a legacy-only
        # feature explicitly needs it.
        self.event_loop = asyncio.get_running_loop()
        logger.info(
            "[GEMINI-LIVE] Default model=%s configured=%s",
            LIVE_MODEL,
            bool(self.gemini_api_key),
        )

    async def ensure_aegis_ai(self) -> bool:
        """Start the legacy Aegis process on demand for fallback operations."""
        if self.aegis_ai and self.aegis_ai.is_running:
            return True
        async with self.aegis_ai_lock:
            if self.aegis_ai and self.aegis_ai.is_running:
                return True
            try:
                project_root = Path(__file__).resolve().parents[3]
                aegis_ai_path = project_root / "astra_ai" / "core" / "aegis_ai.py"
                logger.info("[AEGIS-AI] Starting lazy fallback: %s", aegis_ai_path)
                candidate = AegisAIProcess(str(aegis_ai_path), self.event_loop)
                if await candidate.start():
                    self.aegis_ai = candidate
                    logger.info("[AEGIS-AI] Legacy fallback ready")
                    return True
                candidate.stop()
            except Exception:
                logger.exception("[AEGIS-AI] Failed to initialize legacy fallback")
            self.aegis_ai = None
            return False

    async def close_live_session(self, websocket: WebSocket) -> None:
        session = self.live_sessions.pop(websocket, None)
        self.live_providers.pop(websocket, None)
        self.live_retries.pop(websocket, None)
        if session:
            await session.close()

    async def shutdown(self):
        """Cleanup server resources"""
        logger.info("[SHUTDOWN] Stopping AEGIS Server...")
        await presence_worker.close()

        for websocket in list(self.live_sessions):
            await self.close_live_session(websocket)

        if self.location_refresh_task:
            self.location_refresh_task.cancel()
            try:
                await self.location_refresh_task
            except asyncio.CancelledError:
                pass
            self.location_refresh_task = None
        
        # Stop Aegis AI process
        if self.aegis_ai:
            self.aegis_ai.stop()


# Initialize global state
state = ServerState()


# ---------------------------------------------------------------------------
# Gemini-owned search and file operations
# ---------------------------------------------------------------------------

FILE_MAX_BYTES = 2 * 1024 * 1024
SEARCH_MEMORY_MAX_RECORDS = 100


def _json_store(path: Path, default: Any) -> Any:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value
    except (OSError, ValueError, TypeError):
        return default


def _write_json_store(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def _search_memory_path() -> Path:
    return Path(__file__).resolve().parents[2] / "memory" / "search_memory.json"


def _file_registry_path() -> Path:
    return Path(__file__).resolve().parents[2] / "memory" / "file_registry.json"


def _record_application_memory(category: str, event_type: str, source_ref: str, content: Any, attributes: Optional[Dict[str, Any]] = None):
    """Verified application results are dated events, never assertions about the user."""
    key=event_type+"_"+uuid.uuid5(uuid.NAMESPACE_URL,str(source_ref)).hex[:16]
    try:
        return state.live_memory.save_event(event_type,key,content,attributes or {},category=category,source="application",capture_source="verified_application_event",evidence="Verified application result: "+str(source_ref),correction=True,operation_id="",session_id=state.current_user_session)
    except Exception:
        logger.exception("Application memory could not be persisted")
        return {"status":"failed","reason":"memory_storage_unavailable"}

def _save_search_record(query: str, summary: str, results: Any, record_id: Optional[str] = None) -> Dict[str, Any]:
    path = _search_memory_path()
    records = _json_store(path, [])
    if not isinstance(records, list):
        records = []
    record = {
        "id": record_id or f"search-{uuid.uuid4().hex}",
        "query": str(query).strip()[:500],
        "summary": str(summary).strip()[:8000],
        "results": results if isinstance(results, list) else [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    records = [item for item in records if isinstance(item, dict) and item.get("id") != record["id"]]
    records.append(record)
    _write_json_store(path, records[-SEARCH_MEMORY_MAX_RECORDS:])
    return record


_research_services = {}
background_model=None
research_model=None
research_provider_settings=None
async def _synthesize_research(query,sources):
    if research_model is None:return ''
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    context=CURRENT_OPERATION.get() or {}
    identifier=context.get('model_research_id') or context.get('research_id')
    options={}
    if identifier and not query.startswith(('[QUICK]\n','[DOCUMENTARY]\n')):
        artifacts,_=get_research_services()
        metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
        if metadata.get('status')=='ok':
            extension_operation=context.get('operation_id','') if query.startswith(('Continue this same research','Original report subject:')) else ''
            async def checkpoint(value):
                value['last_provider']=getattr(research_model,'effective_provider',getattr(research_model,'provider','gemini'))
                if extension_operation:
                    latest=await asyncio.to_thread(artifacts.request_state,identifier,context)
                    await asyncio.to_thread(artifacts.request_state,identifier,context,extension_compositions={**latest.get('extension_compositions',{}),extension_operation:value})
                else:await asyncio.to_thread(artifacts.request_state,identifier,context,synthesis_checkpoint=value)
                from astra_ai.core.background_budget import BudgetPaused
                raise BudgetPaused(time.time()+1,'research_section_saved')
            options={'state':metadata.get('extension_compositions',{}).get(extension_operation,{}) if extension_operation else metadata.get('synthesis_checkpoint',{}),'checkpoint':checkpoint}
    from astra_ai.core.research.providers import EVIDENCE_POLICY
    permission=False;decision=None;private=False;progress=None
    if identifier:
        artifacts,_=get_research_services()
        from astra_ai.core.research_sessions import root_id
        root=root_id(artifacts.snapshot(),identifier)
        decision=artifacts.request_state(root,context).get('groq_private_allowed')
        permission=decision is True
        private=bool(artifacts.snapshot().get('attachments',{}).get(identifier))
        def progress(provider,model):artifacts.request_state(identifier,context,writing_provider=provider,writing_model=model)
    policy=EVIDENCE_POLICY.set({'allow_private':permission,'private_decision':decision,'private':private,'progress':progress})
    try:
        return await research_model.report(query.removeprefix('[DOCUMENTARY]\n'),sources,kind='documentary' if query.startswith('[DOCUMENTARY]\n') else 'research',**options)
    finally:EVIDENCE_POLICY.reset(policy)

async def _complete_research(report,query,sources):
    if research_model is None:
        from astra_ai.core.background_model import ModelUnavailable
        raise ModelUnavailable('Gemini research is not configured')
    return await research_model.complete_report(report,query,sources)


def get_research_services():
    from astra_ai.core.research_learning import ResearchArtifacts, ResearchSearch
    path=runtime_paths.research
    key=str(path.resolve())
    if key not in _research_services:
        artifacts=ResearchArtifacts(path,legacy_path=state.live_memory.memory_path.parent/'research_artifacts'/'reports.json')
        _research_services[key]=(artifacts,ResearchSearch(artifacts,_get_env_value,synthesize=_synthesize_research,illustrate=True,complete=_complete_research,read_evidence=True,prepare_media=True))
    return _research_services[key]

async def _aegis_search_web(arguments):
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    context=CURRENT_OPERATION.get() or {}
    if not context.get('client_id') and not context.get('background'):return {'status':'rejected','reason':'connected_search_context_required'}
    artifacts,service=get_research_services()
    if str(arguments.get('action','')).startswith('document_'):
        from astra_ai.ui.backend.document_api import run_document_job
        result=await run_document_job(artifacts,service,research_model,learning_service.cpu,arguments,context)
        if context.get('client_id'):
            await ws_manager.send_to_client_id(context['client_id'],{'type':'research_refresh','research_id':arguments.get('research_id')})
        if result.get('status')=='completed' and arguments.get('action')=='document_compose':
            notice_id=await asyncio.to_thread(notice_store.enqueue,'research',result['research_id'],result['research_revision'],{'title':'Document ready: '+result['display_title']},context)
            await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_ready','notice_id':notice_id,'research_id':result['research_id'],'research_revision':result['research_revision'],'query':result['display_title']})
        return result
    if arguments.get('action')=='media':
        return await service.enrich_media(str(arguments.get('research_id','')),context,str(arguments.get('research_revision','')))
    model_context=CURRENT_OPERATION.set({**context,'model_research_id':context.get('research_id') or arguments.get('research_id','')})
    try:result=await service.search(arguments,context,context.get('operation_id',''))
    finally:CURRENT_OPERATION.reset(model_context)
    if result.get('revision_repair'):
        await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_refresh','research_id':result['research_id']})
        return result
    if result.get('image_enrichment'):
        await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_refresh','research_id':result['research_id']})
    if result.get('status')=='completed' and result.get('research_id'):
        child=await asyncio.to_thread(artifacts.request_state,result['research_id'],context)
        parent_id=child.get('document_parent_id')
        if parent_id:
            with artifacts.lock:
                parent=artifacts.request_state(parent_id,context)
                if parent.get('status')=='ok':
                    cards=parent.get('research_cards',[])
                    if not any(c['id']==result['research_id'] for c in cards):artifacts.request_state(parent_id,context,research_cards=[*cards,{'id':result['research_id'],'title':child.get('display_title',result.get('query','Research')),'revision':result['research_revision']}])
            await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_refresh','research_id':parent_id})
    if result.get('status')=='completed' and not result.get('image_enrichment') and result.get('research_id') and learning_service and not context.get('guest'):
        item=await asyncio.to_thread(artifacts.get,result['research_id'],context,result['research_revision'])
        if item['status']=='ok':
            indexed=await asyncio.to_thread(learning_service.import_artifact,item['artifact'],context)
            result['knowledge_index_status']=indexed.get('status')
    if result.get('status')=='completed' and not result.get('image_enrichment') and not result.get('no_more') and result.get('research_id') and artifacts.get(result['research_id'],context).get('status')=='ok' and context.get('client_id') and (arguments.get('mode')=='detailed' or context.get('requested_research')):
        metadata=await asyncio.to_thread(artifacts.request_state,result['research_id'],context)
        title=metadata.get('display_title') or result['query'][:90]
        notice_id=await asyncio.to_thread(notice_store.enqueue,'research',result['research_id'],result.get('media_revision') or result.get('extension_revision') or result['research_revision'],{'title':'Research ready: '+title},context)
        from astra_ai.core.research_sessions import publication_info
        publication=publication_info(artifacts.snapshot(),result['research_id'])
        await ws_manager.send_to_client_id(context['client_id'],{'type':'research_ready','notice_id':notice_id,'research_id':result['research_id'],'research_revision':result['research_revision'],'query':title,**publication})
    return result


def _gemini_search_web(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Run a scoped conversational search through the active configured providers.

    The API key is read only on the backend. Results are normalized and saved
    to the same bounded search-memory store used by the memory tools.
    """
    query = str(arguments.get("query") or "").strip()
    if not query:
        return {"status": "failed", "error": "Search query is required.", "provider": "firecrawl"}
    key = _get_env_value("FIRECRAWL_API_KEY")
    if not key:
        return {"status": "failed", "query": query, "error": "FIRECRAWL_API_KEY is not configured.", "provider": "firecrawl"}
    try:
        max_results = max(1, min(int(arguments.get("max_results") or 5), 10))
    except (TypeError, ValueError):
        max_results = 5
    try:
        response = requests.post(
            "https://api.firecrawl.dev/v1/search",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"query": query, "limit": max_results, "scrapeOptions": {"formats": ["markdown"]}},
            timeout=25,
        )
        response.raise_for_status()
        payload = response.json() if response.content else {}
        raw_results = payload.get("data") if isinstance(payload, dict) else []
        if not isinstance(raw_results, list):
            raw_results = []
        results = []
        for item in raw_results[:max_results]:
            if not isinstance(item, dict):
                continue
            results.append({
                "title": str(item.get("title") or "")[:300],
                "url": str(item.get("url") or item.get("link") or "")[:1200],
                "description": str(item.get("description") or item.get("snippet") or "")[:1200],
                "content": str(item.get("markdown") or item.get("content") or "")[:4000],
                "source": "firecrawl",
            })
        summary = str(payload.get("answer") or payload.get("description") or "").strip()[:8000] if isinstance(payload, dict) else ""
        saved = _save_search_record(query, summary, results)
        return {"status": "completed", "query": query, "summary": summary, "answer": summary,
                "results": results, "record_id": saved["id"], "provider": "firecrawl"}
    except Exception as exc:
        logger.warning("[GEMINI SEARCH] Firecrawl request failed: %s", exc)
        return {"status": "failed", "query": query, "error": str(exc)[:500], "provider": "firecrawl"}


def _gemini_search_memory(arguments: Dict[str, Any]) -> Dict[str, Any]:
    query = str(arguments.get("query") or "").strip().casefold()
    records = _json_store(_search_memory_path(), [])
    if not isinstance(records, list):
        records = []
    matches = [item for item in records if not query or query in json.dumps(item, ensure_ascii=False).casefold()]
    return {"status": "completed", "matches": matches[-max(1, min(int(arguments.get("limit") or 5), 10)): ]}


def _gemini_save_search_memory(arguments: Dict[str, Any]) -> Dict[str, Any]:
    record = _save_search_record(arguments.get("query", ""), arguments.get("summary", ""), arguments.get("results", []))
    return {"status": "completed", "record": record}


def _gemini_update_search_memory(arguments: Dict[str, Any]) -> Dict[str, Any]:
    record_id = str(arguments.get("record_id") or "").strip()
    records = _json_store(_search_memory_path(), [])
    for item in records if isinstance(records, list) else []:
        if isinstance(item, dict) and item.get("id") == record_id:
            if "summary" in arguments:
                item["summary"] = str(arguments.get("summary") or "")[:8000]
            if isinstance(arguments.get("results"), list):
                item["results"] = arguments["results"]
            item["updated_at"] = datetime.now().isoformat()
            _write_json_store(_search_memory_path(), records)
            return {"status": "completed", "record": item}
    return {"status": "failed", "error": "Search record not found."}


def _gemini_delete_search_memory(arguments: Dict[str, Any]) -> Dict[str, Any]:
    if not bool(arguments.get("confirm")):
        return {"status": "confirmation_required"}
    record_id = str(arguments.get("record_id") or "").strip()
    records = _json_store(_search_memory_path(), [])
    kept = [item for item in records if not isinstance(item, dict) or item.get("id") != record_id]
    if len(kept) == len(records):
        return {"status": "failed", "error": "Search record not found."}
    _write_json_store(_search_memory_path(), kept)
    return {"status": "completed", "deleted_record_id": record_id}


def _safe_file_path(raw_path: str) -> Path:
    candidate = Path(str(raw_path or "").strip()).expanduser()
    if not candidate.is_absolute():
        raise ValueError("An absolute file path is required.")
    resolved = candidate.resolve()
    blocked = [Path(os.environ.get("WINDIR", r"C:\Windows")).resolve(), Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")).resolve()]
    if any(resolved == root or root in resolved.parents for root in blocked):
        raise PermissionError("Protected operating-system paths are not allowed.")
    return resolved


def _registry() -> Dict[str, Any]:
    value = _json_store(_file_registry_path(), {})
    return value if isinstance(value, dict) else {}


def _track_file(path: Path, operation: str) -> Dict[str, Any]:
    records = _registry()
    key = str(path)
    stat = path.stat() if path.exists() else None
    record = records.get(key, {"path": key, "created_at": datetime.now().isoformat(), "operations": []})
    record["exists"] = bool(stat)
    record["size"] = stat.st_size if stat else 0
    record["updated_at"] = datetime.now().isoformat()
    record.setdefault("operations", []).append({"operation": operation, "at": record["updated_at"]})
    record["operations"] = record["operations"][-50:]
    records[key] = record
    _write_json_store(_file_registry_path(), records)
    return record


def _gemini_file_action(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if name == "list_tracked_files":
            query = str(arguments.get("query") or "").casefold()
            values = list(_registry().values())
            return {"status": "completed", "files": [item for item in values if not query or query in str(item.get("path", "")).casefold()]}
        path = _safe_file_path(arguments.get("path", ""))
        if name == "file_status":
            return {"status": "completed", "file": _track_file(path, "status")}
        if name == "read_file":
            if not path.exists():
                return {"status": "failed", "error": "File does not exist."}
            if path.stat().st_size > FILE_MAX_BYTES:
                return {"status": "failed", "error": "File exceeds the 2 MiB limit."}
            return {"status": "completed", "path": str(path), "content": path.read_text(encoding="utf-8")}
        if name == "delete_file":
            if not bool(arguments.get("confirm")):
                return {"status": "confirmation_required", "path": str(path)}
            if not path.exists():
                return {"status": "failed", "error": "File does not exist."}
            path.unlink()
            return {"status": "completed", "file": _track_file(path, "delete")}
        if name == "move_file":
            if not bool(arguments.get("confirm")):
                return {"status": "confirmation_required", "path": str(path)}
            destination = _safe_file_path(arguments.get("destination", ""))
            if not path.exists():
                return {"status": "failed", "error": "File does not exist."}
            if destination.exists():
                return {"status": "failed", "error": "Destination already exists."}
            destination.parent.mkdir(parents=True, exist_ok=True)
            path.replace(destination)
            return {"status": "completed", "file": _track_file(destination, "move"), "previous_path": str(path)}
        if name == "create_file":
            if path.exists() and not bool(arguments.get("overwrite")):
                return {"status": "failed", "error": "File exists; set overwrite=true."}
            if path.exists() and not bool(arguments.get("confirm")):
                return {"status": "confirmation_required", "path": str(path)}
            content = str(arguments.get("content") or "")
            if len(content.encode("utf-8")) > FILE_MAX_BYTES:
                return {"status": "failed", "error": "Content exceeds the 2 MiB limit."}
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            return {"status": "completed", "file": _track_file(path, "create")}
        if name in {"edit_file", "append_file"}:
            if not path.exists():
                return {"status": "failed", "error": "File does not exist."}
            current = path.read_text(encoding="utf-8")
            if name == "append_file":
                updated = current + str(arguments.get("content") or "")
            elif arguments.get("old_text") is not None:
                old = str(arguments.get("old_text") or "")
                if old not in current:
                    return {"status": "failed", "error": "old_text was not found."}
                updated = current.replace(old, str(arguments.get("new_text") or ""), 1)
            else:
                updated = str(arguments.get("content") or "")
            if len(updated.encode("utf-8")) > FILE_MAX_BYTES:
                return {"status": "failed", "error": "Updated file exceeds the 2 MiB limit."}
            if name == "edit_file" and arguments.get("old_text") is None and not bool(arguments.get("confirm")):
                return {"status": "confirmation_required", "path": str(path)}
            path.write_text(updated, encoding="utf-8")
            return {"status": "completed", "file": _track_file(path, name)}
        return {"status": "failed", "error": "Unsupported file operation."}
    except Exception as exc:
        return {"status": "failed", "error": str(exc)[:500]}


def _compact_note(note: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not isinstance(note, dict):
        return None
    return {
        "id": str(note.get("id") or ""),
        "content": str(note.get("content") or "")[:4000],
        "category": str(note.get("category") or "")[:120],
        "created_at": str(note.get("created_at") or ""),
        "updated_at": str(note.get("updated_at") or ""),
    }


async def _gemini_system_status(client_id: str) -> Dict[str, Any]:
    context = state.widget_connections.context_payload_for(client_id)
    connected = list((context.get("connected_widgets") or {}).keys()) if context else []
    return {
        "status": "ok",
        "backend": "healthy",
        "gemini_live": True,
        "memory": state.live_memory.stats(),
        "connected_widgets": connected,
        "notes_connected": "notes" in connected,
        "calendar_connected": "calendar" in connected,
        "legacy_aegis_running": bool(state.aegis_ai and state.aegis_ai.is_running),
    }


async def _gemini_read_notes_context(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if client_id and not state.widget_connections.is_connected(client_id, "notes"):
        connected = await _gemini_frontend_notes_action(
            client_id, "snapshot", {}, f"gemini-notes-connect-{uuid.uuid4().hex}"
        )
        if str(connected.get("status") or "").lower() in {"failed", "unavailable"}:
            return {"status": "failed", "error": "Notes connection was not acknowledged by the UI."}
    context = state.widget_connections.context_payload_for(client_id)
    notes_context = ((context.get("connected_widgets") or {}).get("notes") or {}).get("state") or {}
    note_id = str(arguments.get("note_id") or notes_context.get("reviewed_note_id") or notes_context.get("selected_note_id") or "").strip()
    query = str(arguments.get("query") or "").strip()
    selected = state.get_note_by_id(note_id) if note_id else None
    if selected is None and query:
        selected = state.find_note(query)
    all_notes = bool(arguments.get("include_all"))
    notes = state.get_notes_state().get("notes", [])
    payload = {
        "status": "ok",
        "notes_connected": "notes" in ((context.get("connected_widgets") or {}) if context else {}),
        "active_tab": str(notes_context.get("active_tab") or "view"),
        "draft": str(notes_context.get("draft") or "")[:4000],
        "category": str(notes_context.get("category") or "")[:120],
        "dirty": bool(notes_context.get("dirty")),
        "reviewed_note_id": str(notes_context.get("reviewed_note_id") or ""),
        "selected_note": _compact_note(selected),
    }
    if all_notes:
        payload["notes"] = [_compact_note(note) for note in notes[-10:]]
    return payload


async def _gemini_read_search_context(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Return the authoritative state already persisted by the Search widget."""
    context = state.search_widget_context or {}
    connection_context = state.widget_connections.context_payload_for(client_id) if client_id else {}
    search_context = ((connection_context.get("connected_widgets") or {}).get("search") or {}).get("state") or {}
    current = dict(context.get("current") or {})
    query = str(arguments.get("query") or "").strip().lower()
    if query and query not in str(current.get("query") or "").lower():
        matches = state.find_search_requests(query, limit=5)
    else:
        matches = []
    payload: Dict[str, Any] = {
        "status": "ok",
        "search_connected": bool(client_id and state.widget_connections.is_connected(client_id, "search")),
        "active_tab": str(search_context.get("active_tab") or search_context.get("view_mode") or current.get("view_mode") or "current"),
        "current_query": str(search_context.get("query") or current.get("query") or ""),
        "current": current,
    }
    if bool(arguments.get("include_history", True)):
        payload["history"] = state.get_search_history_preview()
    if matches:
        payload["matches"] = matches
    return payload


def _compact_calendar_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Keep Calendar context useful to Gemini without shipping full rows."""
    return {key: event.get(key) for key in (
        "id", "series_id", "title", "start", "end", "start_at", "end_at", "start_date", "end_date",
        "all_day", "calendar_id", "timezone", "location", "description", "notes", "tags", "importance",
        "recurrence", "reminders", "version",
    ) if key in event}


async def _gemini_calendar_connection(client_id: str) -> Dict[str, Any]:
    if not client_id:
        return {"status": "unavailable", "error": "no_connected_client"}
    if state.widget_connections.is_connected(client_id, "calendar"):
        return {"status": "completed", "already_connected": True}
    request_id = f"gemini-calendar-connect-{uuid.uuid4().hex}"
    try:
        connection = state.widget_connections.connect(client_id, "calendar")
        state.register_widget_action(client_id, request_id)
        await ws_manager.send_to_client_id(client_id, {
            "type": "widget_connection", "widget": "calendar", "status": "connected",
            "request_id": request_id, "connection_id": connection["connection_id"],
            "request_snapshot": True, "source": "gemini_live", "detail": "Gemini connected to Calendar.",
        })
        result = await state.await_widget_action(client_id, request_id, timeout=3.0)
        if not result or str(result.get("status") or "").lower() == "failed":
            state.widget_connections.disconnect(client_id, "calendar")
            return {"status": "failed", "error": "Calendar connection was not acknowledged by the UI."}
        return {"status": "completed", "connection": result}
    except Exception as exc:
        state.widget_connections.disconnect(client_id, "calendar")
        return {"status": "failed", "error": f"Calendar connection failed: {exc}"}


async def _gemini_read_calendar_context(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    connection = await _gemini_calendar_connection(client_id)
    if connection.get("status") in {"failed", "unavailable"}:
        return connection
    context = state.widget_connections.context_payload_for(client_id) if client_id else {}
    calendar_context = ((context.get("connected_widgets") or {}).get("calendar") or {}).get("state") or {}
    query = str(arguments.get("query") or "").strip()
    event_id = str(arguments.get("event_id") or "").strip()
    try:
        events = await asyncio.to_thread(calendar_store.list_events, None, None, query, ())
    except Exception as exc:
        return {"status": "failed", "error": f"Calendar data read failed: {exc}", "ui_state": calendar_context}
    if event_id:
        events = [event for event in events if str(event.get("id")) == event_id or str(event.get("series_id")) == event_id]
    return {
        "status": "completed", "calendar_connected": True, "ui_state": calendar_context,
        "events": [_compact_calendar_event(event) for event in events[:100]],
        "matches": len(events),
    }


async def _gemini_image_connection(client_id: str) -> Dict[str, Any]:
    """Connect Gemini observation to the Image Widget using the shared protocol."""
    if not client_id:
        return {"status": "unavailable", "error": "no_connected_client"}
    if state.widget_connections.is_connected(client_id, "image"):
        return {"status": "completed", "already_connected": True}
    request_id = f"gemini-image-connect-{uuid.uuid4().hex}"
    try:
        connection = state.widget_connections.connect(client_id, "image")
        state.register_widget_action(client_id, request_id)
        await ws_manager.send_to_client_id(client_id, {
            "type": "widget_connection", "widget": "image", "status": "connected",
            "request_id": request_id, "connection_id": connection["connection_id"],
            "request_snapshot": True, "source": "gemini_live",
            "detail": "Aegis connected to the Image Widget.",
        })
        result = await state.await_widget_action(client_id, request_id, timeout=3.0)
        if not result or str(result.get("status") or "").lower() == "failed":
            state.widget_connections.disconnect(client_id, "image")
            return {"status": "failed", "error": "Image Widget connection was not acknowledged by the UI."}
        return {"status": "completed", "connection": result}
    except Exception as exc:
        state.widget_connections.disconnect(client_id, "image")
        return {"status": "failed", "error": f"Image Widget connection failed: {exc}"}


def _compact_image_metadata(image: Dict[str, Any]) -> Dict[str, Any]:
    """Return gallery metadata safe and small enough for live model context."""
    result = {key: image.get(key) for key in (
        "id", "display_number", "prompt", "created_at", "timestamp", "provider",
        "model", "mime_type", "status", "kind", "file_size",
    ) if image.get(key) is not None}
    image_id = str(result.get("id") or "")
    if image_id:
        result["file_url"] = f"/api/images/backup/file/{image_id}"
    return result


async def _gemini_read_image_context(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    connection = await _gemini_image_connection(client_id)
    if connection.get("status") in {"failed", "unavailable"}:
        return connection
    context = state.widget_connections.context_payload_for(client_id) if client_id else {}
    widget_state = ((context.get("connected_widgets") or {}).get("image") or {}).get("state") or {}
    images = _gallery_images()
    image_id = str(arguments.get("image_id") or "").strip()
    image_number = arguments.get("image_number")
    query = str(arguments.get("query") or "").strip().lower()
    matches = images
    if image_id:
        matches = [image for image in images if str(image.get("id")) == image_id]
    elif image_number is not None:
        try:
            number = int(image_number)
            matches = [image for image in images if int(image.get("display_number", 0) or 0) == number]
        except (TypeError, ValueError):
            matches = []
    elif query:
        matches = _find_images_by_query(query)
    include_gallery = bool(arguments.get("include_gallery", True))
    return {
        "status": "completed",
        "image_connected": True,
        "ui_state": widget_state,
        "current_context": {
            key: (list(value) if isinstance(value, deque) else value)
            for key, value in state.image_widget_context.items()
        },
        "gallery_count": len(images),
        "gallery": [_compact_image_metadata(image) for image in images[:100]] if include_gallery else [],
        "matches": [_compact_image_metadata(image) for image in matches[:20]],
    }


async def _gemini_image_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "open_widget": "open", "close_widget": "close", "show": "open",
        "connect_widget": "connect", "disconnect_widget": "disconnect",
        "gallery": "show_gallery", "open_gallery": "show_gallery",
        "select_image": "open_gallery_image", "show_image": "open_gallery_image",
        "delete_image": "delete_saved_image", "delete_saved": "delete_saved_image",
        "latest": "select_latest", "regenerate": "regenerate_last",
    }
    action = aliases.get(action, action)
    if action == "connect":
        return await _gemini_image_connection(client_id)
    if action == "disconnect":
        if not client_id:
            return {"status": "unavailable", "error": "no_connected_client"}
        request_id = str(arguments.get("request_id") or f"gemini-image-disconnect-{uuid.uuid4().hex}")
        state.widget_connections.disconnect(client_id, "image")
        state.register_widget_action(client_id, request_id)
        await ws_manager.send_to_client_id(client_id, {
            "type": "widget_connection", "widget": "image", "status": "disconnected",
            "request_id": request_id, "detail": "Aegis disconnected from the Image Widget.",
        })
        result = await state.await_widget_action(client_id, request_id, timeout=3.0)
        if not result:
            return {"status": "failed", "operation_id": request_id, "error": "Image Widget disconnect was not acknowledged by the UI."}
        return {"status": result.get("status", "failed"), "operation_id": request_id, "result": result}
    allowed = {
        "open", "close", "focus", "focus_prompt", "set_prompt", "append_prompt", "clear_prompt",
        "generate", "regenerate_last", "show_gallery", "close_gallery", "open_gallery_image",
        "search_gallery", "select_latest", "scroll_gallery_to_number", "scroll_gallery_up",
        "scroll_gallery_down", "scroll_gallery_top", "scroll_gallery_bottom", "back_to_gallery",
        "back_to_create", "set_fit_mode", "delete_saved_image", "refresh_gallery", "get_state",
        "read_context",
    }
    if action not in allowed:
        return {"status": "failed", "error": f"Unsupported Image Widget action: {action or 'missing'}"}
    request_id = str(arguments.get("request_id") or f"gemini-image-{uuid.uuid4().hex}")
    if action in {"get_state", "read_context"}:
        return await _gemini_read_image_context(client_id, arguments)
    if action == "delete_saved_image" and not bool(arguments.get("confirm")):
        context = await _gemini_read_image_context(client_id, arguments)
        matches = context.get("matches") or []
        return {
            "status": "confirmation_required", "operation_id": request_id,
            "matches": matches[:10],
            "error": "confirm=true is required before deleting a saved image.",
        }
    connection = await _gemini_image_connection(client_id)
    if action not in {"close", "close_gallery"} and connection.get("status") in {"failed", "unavailable"}:
        return {**connection, "operation_id": request_id}
    if not client_id:
        return {"status": "unavailable", "operation_id": request_id, "error": "no_connected_client"}

    # Resolve user-friendly gallery references to stable IDs before sending a
    # destructive or display command to the browser.
    outgoing = dict(arguments)
    if action in {"open_gallery_image", "delete_saved_image"}:
        matches = _gallery_images()
        image_id = str(outgoing.get("image_id") or "").strip()
        image_number = outgoing.get("image_number")
        query = str(outgoing.get("query") or "").strip()
        if image_id:
            matches = [image for image in matches if str(image.get("id")) == image_id]
        elif image_number is not None:
            try:
                matches = [image for image in matches if int(image.get("display_number", 0) or 0) == int(image_number)]
            except (TypeError, ValueError):
                matches = []
        elif query:
            matches = _find_images_by_query(query)
        if len(matches) > 1 and action == "delete_saved_image":
            return {"status": "ambiguous", "operation_id": request_id, "matches": [_compact_image_metadata(item) for item in matches[:10]], "error": "Multiple saved images match; provide image_id or image_number."}
        if not matches and action in {"open_gallery_image", "delete_saved_image"}:
            return {"status": "failed", "operation_id": request_id, "error": "Saved image was not found."}
        if matches:
            outgoing["image_id"] = matches[0].get("id")
            outgoing["image_number"] = matches[0].get("display_number")

    state.register_widget_action(client_id, request_id)
    payload: Dict[str, Any] = {
        "type": "widget_control", "widget": "image", "command": action, "action": action,
        "request_id": request_id, "source": "gemini_live", "execution": "frontend",
    }
    for key, value in outgoing.items():
        if key not in {"action", "request_id", "confirm"}:
            payload[key] = value
    logger.info("[WIDGET CMD][request_id=%s] Python -> frontend image command=%s", request_id, action)
    await ws_manager.send_to_client_id(client_id, payload)
    result = await state.await_widget_action(client_id, request_id, timeout=60.0 if action in {"generate", "regenerate_last"} else 8.0)
    if not result:
        return {"status": "failed", "operation_id": request_id, "error": "Image Widget did not acknowledge the action before timeout."}
    if action in {"close", "close_gallery"} and str(result.get("status") or "").lower() == "completed":
        if action == "close":
            state.widget_connections.disconnect(client_id, "image")
    return {"status": result.get("status", "failed"), "operation_id": request_id, "result": result, "error": result.get("error")}


async def _gemini_calendar_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {"go_today": "today", "month_view": "set_view", "week_view": "set_view", "year_view": "set_view", "agenda_view": "set_view", "open_widget": "open", "close_widget": "close"}
    view_aliases = {"month_view": "month", "week_view": "week", "year_view": "year", "agenda_view": "agenda"}
    if action in view_aliases:
        arguments = {**arguments, "view": view_aliases[action]}
    action = aliases.get(action, action)
    allowed = {"open", "show", "focus", "close", "minimize", "today", "go_to_today", "navigate", "previous", "next", "set_view", "view", "go_to_date", "select_date", "search", "search_events", "list_events", "get_state", "read_context", "new_event", "open_new_event", "create_event", "update_event", "move_event", "reschedule_event", "delete_event", "quick_add", "sync", "open_filters", "close_filters", "clear_filters", "set_filter", "set_filters", "set_calendar_visibility", "open_settings", "close_settings", "apply_smart_view", "save_smart_view", "find_free_time", "save_template", "apply_template", "open_dialog"}
    if action not in allowed:
        return {"status": "failed", "error": f"Unsupported Calendar action: {action or 'missing'}"}
    request_id = str(arguments.get("request_id") or f"gemini-calendar-{uuid.uuid4().hex}")
    logger.info("[WIDGET CMD][request_id=%s] Gemini -> Calendar action=%s args=%s", request_id, action, {key: value for key, value in arguments.items() if key not in {"api_key", "token", "password"}})
    if action in {"get_state", "read_context", "list_events"}:
        return await _gemini_read_calendar_context(client_id, arguments)
    if action == "delete_event" and not bool(arguments.get("confirm")):
        context = await _gemini_read_calendar_context(client_id, {"event_id": arguments.get("event_id")})
        return {"status": "confirmation_required", "operation_id": request_id, "event": (context.get("events") or [None])[0], "error": "confirm=true is required before deleting an event."}
    connection = await _gemini_calendar_connection(client_id)
    if action not in {"close", "minimize"} and connection.get("status") in {"failed", "unavailable"}:
        return {**connection, "operation_id": request_id}
    if not client_id:
        return {"status": "unavailable", "operation_id": request_id, "error": "no_connected_client"}
    state.register_widget_action(client_id, request_id)
    payload: Dict[str, Any] = {"type": "widget_control", "widget": "calendar", "command": action, "action": action, "request_id": request_id, "source": "gemini_live", "execution": "frontend"}
    reserved = {"action", "request_id"}
    for key, value in arguments.items():
        if key not in reserved:
            payload[key] = value
    await ws_manager.send_to_client_id(client_id, payload)
    logger.info("[WIDGET CMD][request_id=%s] Python -> frontend calendar command=%s", request_id, action)
    result = await state.await_widget_action(client_id, request_id, timeout=8.0)
    if not result:
        return {"status": "failed", "operation_id": request_id, "error": "Calendar frontend did not acknowledge the action before timeout."}
    if action in {"close", "minimize"} and str(result.get("status") or "").lower() == "completed":
        state.widget_connections.disconnect(client_id, "calendar")
    return {"status": result.get("status", "failed"), "operation_id": request_id, "result": result, "error": result.get("error")}


async def _gemini_frontend_notes_action(client_id: str, action: str, arguments: Dict[str, Any], request_id: str) -> Dict[str, Any]:
    if not client_id:
        return {"status": "unavailable", "reason": "no_connected_client", "operation_id": request_id}

    # A Notes command is also the user's request to make Notes available to
    # Gemini. Establish the observation connection first; otherwise an open
    # command could succeed visually while the backend still reports the
    # widget as disconnected.
    if action not in {"close", "disconnect"} and not state.widget_connections.is_connected(client_id, "notes"):
        connection_request = f"gemini-notes-connect-{uuid.uuid4().hex}"
        try:
            connection = state.widget_connections.connect(client_id, "notes")
            state.register_widget_action(client_id, connection_request)
            await ws_manager.send_to_client_id(client_id, {
                "type": "widget_connection", "widget": "notes", "status": "connected",
                "request_id": connection_request, "connection_id": connection["connection_id"],
                "request_snapshot": True, "source": "gemini_live",
                "detail": "Gemini connected to Notes.",
            })
            connection_result = await state.await_widget_action(client_id, connection_request, timeout=3.0)
            if not connection_result or str(connection_result.get("status") or "").lower() == "failed":
                state.widget_connections.disconnect(client_id, "notes")
                return {"status": "failed", "operation_id": request_id, "error": "Notes connection was not acknowledged by the UI."}
        except Exception as exc:
            state.widget_connections.disconnect(client_id, "notes")
            return {"status": "failed", "operation_id": request_id, "error": f"Notes connection failed: {exc}"}

    state.register_widget_action(client_id, request_id)
    payload = {
        "type": "widget_control", "widget": "notes", "command": action,
        "request_id": request_id, "source": "gemini_live", "execution": "frontend",
    }
    for key in ("prompt", "query", "category", "note_id", "content"):
        if key in arguments:
            payload[key] = arguments[key]
    await ws_manager.send_to_client_id(client_id, payload)
    result = await state.await_widget_action(client_id, request_id, timeout=3.0)
    if not result:
        return {"status": "failed", "operation_id": request_id, "error": "Frontend did not acknowledge the Notes action before timeout."}
    result["operation_id"] = request_id
    result["status"] = str(result.get("status") or "failed")
    return result


async def _gemini_search_widget_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_")
    action = {
        "open_widget": "open",
        "close_widget": "close",
        "display_results": "show_results",
        "show_search_results": "show_results",
        "history": "show_history",
        "restore": "restore_latest",
        "find_saved_search": "find_history",
        "show_saved_search": "restore_search_result",
        "delete_history": "delete_search_result",
    }.get(action, action)
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    operation_context=CURRENT_OPERATION.get() or {}
    request_id = str(operation_context.get('request_id') or f"gemini-search-widget-{uuid.uuid4().hex}")
    if not client_id:
        return {"status": "unavailable", "operation_id": request_id, "error": "no_connected_client"}
    if action not in {"connect", "disconnect", "open", "close", "set_query", "run", "find_history", "show_results", "show_history", "show_current", "restore_latest", "restore_search_result", "delete_search_result", "clear_current"}:
        return {"status": "failed", "operation_id": request_id, "error": f"Unsupported Search action: {action}"}
    if action not in {"disconnect", "close"} and not state.widget_connections.is_connected(client_id, "search"):
        connection_request = f"gemini-search-connect-{uuid.uuid4().hex}"
        connection = state.widget_connections.connect(client_id, "search")
        state.register_widget_action(client_id, connection_request)
        await ws_manager.send_to_client_id(client_id, {
            "type": "widget_connection", "widget": "search", "status": "connected",
            "request_id": connection_request, "connection_id": connection["connection_id"],
            "request_snapshot": True, "source": "gemini_live", "detail": "Aegis connected to Search.",
        })
        connection_result = await state.await_widget_action(client_id, connection_request, timeout=3.0)
        if not connection_result or str(connection_result.get("status") or "").lower() == "failed":
            state.widget_connections.disconnect(client_id, "search")
            return {"status": "failed", "operation_id": request_id, "error": "Search connection was not acknowledged by the UI."}
    if action == "find_history":
        matches = state.find_search_requests(str(arguments.get("query") or ""), limit=8)
        state.register_widget_action(client_id, request_id)
        await ws_manager.send_to_client_id(client_id, {
            "type": "widget_control", "widget": "search", "command": "show_history",
            "request_id": request_id, "source": "gemini_live",
            "history_preview": state.get_search_history_preview(), "view_mode": "history",
        })
        result = await state.await_widget_action(client_id, request_id, timeout=5.0)
        if not result:
            return {"status": "failed", "operation_id": request_id, "error": "Search history view was not acknowledged."}
        return {"status": "completed", "operation_id": request_id, "action": action, "matches": matches, "history": state.get_search_history_preview()}

    if action in {"restore_search_result", "delete_search_result"}:
        target_id = str(arguments.get("request_id") or "").strip()
        if not target_id:
            target_id = state.resolve_search_request_id(str(arguments.get("query") or "")) or ""
        if not target_id:
            return {"status": "failed", "operation_id": request_id, "error": "No matching saved search was found."}
        if action == "delete_search_result" and not bool(arguments.get("confirm")):
            return {"status": "confirmation_required", "operation_id": request_id, "request_id_to_delete": target_id}
        try:
            if action == "restore_search_result":
                updated = state.restore_search_request(target_id)
                frontend_payload = build_frontend_payload(updated) or {}
            else:
                updated = state.delete_search_request(target_id)
                frontend_payload = {
                    "type": "widget_control", "widget": "search", "command": "show_history",
                    "source": "gemini_live", "view_mode": "history",
                    "history_preview": state.get_search_history_preview(),
                }
        except KeyError:
            return {"status": "failed", "operation_id": request_id, "error": "Saved search record was not found."}
        state.register_widget_action(client_id, request_id)
        frontend_payload.update({"request_id": request_id, "source": "gemini_live"})
        await ws_manager.send_to_client_id(client_id, frontend_payload)
        result = await state.await_widget_action(client_id, request_id, timeout=5.0)
        if not result:
            return {"status": "failed", "operation_id": request_id, "error": "Search widget did not acknowledge the history action."}
        return {"status": "completed", "operation_id": request_id, "action": action, "request_id": target_id, "current": updated.get("current", {}), "history": state.get_search_history_preview()}

    if action == 'run' or action=='show_results' and arguments.get('research_id'):
        if action=='run':
            loading={'type':'widget_control','widget':'search','command':'set_loading','request_id':request_id,'query':arguments.get('query',''),'loading':True,'source':'research_artifact'}
            state.update_search_widget_context(loading)
            if arguments.get('mode','detailed')=='quick':await ws_manager.send_to_client_id(client_id,loading)
            result=await _aegis_search_web({**arguments,'mode':arguments.get('mode','detailed')})
        else:
            artifacts,_=get_research_services()
            fetched=await asyncio.to_thread(artifacts.get,str(arguments['research_id']),operation_context,str(arguments.get('research_revision','')))
            result=artifacts.brief(fetched['artifact']) if fetched['status']=='ok' else fetched
        if not result.get('research_id'):
            failure={'type':'widget_control','widget':'search','command':'show_results','request_id':request_id,'query':arguments.get('query',''),'loading':False,'error':result.get('reason','Research unavailable'),'answer':'','results':[]}
            state.update_search_widget_context(failure);await ws_manager.send_to_client_id(client_id,failure)
            return result
        from astra_ai.core.aegis_ai import CURRENT_OPERATION
        artifacts,_=get_research_services()
        artifact=artifacts.get(result['research_id'],CURRENT_OPERATION.get() or {})['artifact']
        if artifact['mode']=='detailed':
            return {**result,'ui_status':'available_in_research_workspace','destination':'research'}
        payload={'type':'widget_control','widget':'search','command':'show_results','request_id':request_id,
                 'query':artifact['query'],'display_topic':artifact['query'],'answer':artifact['report'],
                 'results':result['results'],'research_id':artifact['id'],'research_revision':artifact['revision'],
                 'loading':False,'source':'research_artifact','completeness':result['completeness'],'error':''}
        state.update_search_widget_context(payload)
        state.register_widget_action(client_id,request_id)
        await ws_manager.send_to_client_id(client_id,payload)
        ack=await state.await_widget_action(client_id,request_id,timeout=5)
        return {**result,'ui_status':(ack or {}).get('status','unacknowledged')}
    state.register_widget_action(client_id, request_id)
    payload = {"type": "widget_control", "widget": "search", "command": action,
               "request_id": request_id, "source": "gemini_live", "execution": "frontend"}
    for key in ("query", "answer", "results"):
        if key in arguments:
            payload[key] = arguments[key]
    await ws_manager.send_to_client_id(client_id, payload)
    result = await state.await_widget_action(client_id, request_id, timeout=5.0)
    if not result:
        return {"status": "failed", "operation_id": request_id, "error": "Search widget did not acknowledge the action."}
    result["operation_id"] = request_id
    if action == "disconnect" and str(result.get("status") or "").lower() == "completed":
        state.widget_connections.disconnect(client_id, "search")
    return result


async def _gemini_search_history_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_")
    mapped = {
        "show": "find_history",
        "find": "find_history",
        "restore": "restore_search_result",
        "delete": "delete_search_result",
        "history": "find_history",
    }.get(action, action)
    if mapped not in {"find_history", "restore_search_result", "delete_search_result"}:
        return {"status": "failed", "error": f"Unsupported Search history action: {action}"}
    result = await _gemini_search_widget_action(client_id, {
        **arguments,
        "action": mapped,
    })
    if mapped == "find_history" and result.get("status") == "completed":
        matches = result.get("matches") or []
        if len(matches) == 1:
            result["selection_required"] = False
            result["single_match"] = matches[0]
        elif len(matches) > 1:
            result["selection_required"] = True
            result["selection_reason"] = "multiple_matches"
        else:
            result["selection_required"] = False
    return result


async def _gemini_ui_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_")
    mapping = {
        "mute_microphone": "mute", "pause_listening": "mute",
        "unmute_microphone": "unmute", "resume_listening": "unmute",
    }
    if action in {'discover','snapshot','invoke','workspace'}:
        if not client_id:return {'status':'failed','reason':'connected_ui_required'}
        request_id='ui-'+uuid.uuid4().hex
        permitted={'action','control_id','interaction','value','expected_revision','offset','limit','query','workspace','research_id'}
        payload={k:v for k,v in arguments.items() if k in permitted}
        state.register_widget_action(client_id,request_id)
        await ws_manager.send_to_client_id(client_id,{'type':'application_control','request_id':request_id,**payload})
        result=await state.await_widget_action(client_id,request_id,timeout=5.0)
        return {**(result or {'status':'unconfirmed','reason':'UI did not confirm. Inspect current state before retrying.'}),'operation_id':request_id}
    command = mapping.get(action)
    request_id = f"gemini-ui-{uuid.uuid4().hex}"
    if not command:
        return {"status": "failed", "operation_id": request_id, "error": f"Unsupported UI action: {action}"}
    if not client_id:
        return {"status": "failed", "operation_id": request_id, "error": "No connected UI client."}
    state.register_widget_action(client_id, request_id)
    await ws_manager.send_to_client_id(client_id, {
        "type": "widget_control", "widget": "ui", "command": command,
        "request_id": request_id, "source": "gemini_live",
    })
    result = await state.await_widget_action(client_id, request_id, timeout=3.0)
    if not result:
        return {"status": "failed", "operation_id": request_id, "error": "UI did not acknowledge the microphone action."}
    result = dict(result)
    result["operation_id"] = request_id
    return result


async def _gemini_notes_action(client_id: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = str(arguments.get("action") or "").strip().lower().replace("-", "_")
    action = {
        "open_widget": "open",
        "close_widget": "close",
        "display_note": "show_note",
        "show_matching_note": "show_note",
        "view_note": "show_note",
        "edit_note": "open_note",
        "review": "review_note",
        "review_current": "review_note",
        "edit_review": "edit_reviewed_note",
        "paste_search_result": "paste_into_draft",
    }.get(action, action)
    request_id = f"gemini-notes-{uuid.uuid4().hex}"

    async def refresh_notes_ui(command: str = "show_view", **payload: Any) -> Dict[str, Any]:
        if client_id:
            state.register_widget_action(client_id, request_id)
            await ws_manager.send_to_client_id(client_id, {
                "type": "widget_control", "widget": "notes", "command": command,
                "request_id": request_id, "source": "gemini_live", "execution":"frontend", **payload,
            })
            return await state.await_widget_action(client_id, request_id, timeout=5.0) or {
                "status": "failed", "error": "Notes widget did not acknowledge the refresh."
            }
        return {"status": "unavailable", "error": "no_connected_client"}
    if action == 'import_research':
        from astra_ai.core.aegis_ai import CURRENT_OPERATION
        context=CURRENT_OPERATION.get() or {}
        if not context.get('client_id') or context.get('guest'):return {'status':'rejected','reason':'owner_connection_required'}
        artifacts,_=get_research_services()
        result=await asyncio.to_thread(artifacts.import_note,str(arguments.get('research_id','')),str(arguments.get('research_revision','')),context,context.get('operation_id',''),state)
        if result.get('verified'):
            ui=await refresh_notes_ui('review_note',note_id=result['note_id'])
            result['ui_status']=ui.get('status','unacknowledged')
        return result
    frontend_actions = {
        "connect", "disconnect", "open", "close", "show_view", "review_note", "clear_review", "edit_reviewed_note", "show_note", "show_add", "show_ai_summaries", "open_ai_chat",
        "set_draft", "append_draft", "clear_draft", "save_note", "open_note",
        "improve_note", "apply_ai_update", "copy_draft", "copy_note",
        "paste_into_draft", "export_txt", "export_json", "import_notes", "snapshot",
        "refresh_state",
    }
    if action in frontend_actions:
        if action in {"set_draft", "append_draft", "paste_into_draft"}:
            arguments = {**arguments, "prompt": arguments.get("content", arguments.get("prompt", ""))}
        result = await _gemini_frontend_notes_action(client_id, action, arguments, request_id)
        if action == "disconnect" and str(result.get("status") or "").lower() == "completed":
            state.widget_connections.disconnect(client_id, "notes")
        return result

    if action == "append_to_active_note":
        content = str(arguments.get("content") or arguments.get("prompt") or "").strip()
        if client_id and not state.widget_connections.is_connected(client_id, "notes"):
            connected = await _gemini_frontend_notes_action(client_id, "snapshot", {}, f"gemini-notes-connect-{uuid.uuid4().hex}")
            if str(connected.get("status") or "").lower() in {"failed", "unavailable"}:
                return {"status": "failed", "operation_id": request_id, "error": "Notes connection was not acknowledged by the UI."}
        context = state.widget_connections.context_payload_for(client_id) if client_id else {}
        notes_context = ((context.get("connected_widgets") or {}).get("notes") or {}).get("state") or {}
        note_id = str(arguments.get("note_id") or notes_context.get("reviewed_note_id") or notes_context.get("selected_note_id") or "").strip()
        note = state.get_note_by_id(note_id) if note_id else None
        if not note:
            return {"status": "failed", "operation_id": request_id, "error": "No reviewed or edited note is active."}
        if not content:
            return {"status": "failed", "operation_id": request_id, "error": "Content to append is required."}
        updated_note = state.update_note(note_id, f"{note.get('content', '').rstrip()}\n\n{content}", category=str(note.get("category") or ""))
        ui_result = await refresh_notes_ui("open_note", query=updated_note.get("content", "")[:160], note_id=note_id)
        return {"status": "completed", "operation_id": request_id, "note": _compact_note(updated_note), "ui_refresh_status": ui_result.get("status"), "ui_result": ui_result}
    if action == "delete_note":
        note_id = str(arguments.get("note_id") or "").strip()
        matches = [state.get_note_by_id(note_id)] if note_id and state.get_note_by_id(note_id) else state.find_notes(str(arguments.get("query") or ""))
        matches = [item for item in matches if item]
        if not matches:
            return {"status": "failed", "operation_id": request_id, "error": "No matching note was found."}
        if len(matches) > 1 and not note_id:
            return {"status": "selection_required", "operation_id": request_id, "matches": [_compact_note(item) for item in matches], "error": "Multiple notes match; provide a note_id."}
        if not bool(arguments.get("confirm")):
            return {"status": "confirmation_required", "operation_id": request_id, "note": _compact_note(matches[0]), "note_id": str(matches[0].get("id") or "")}
    if action == "clear_all_notes" and not bool(arguments.get("confirm")):
        return {"status": "confirmation_required", "operation_id": request_id, "action": action}
    if client_id and not state.widget_connections.is_connected(client_id, "notes"):
        connected = await _gemini_frontend_notes_action(
            client_id, "snapshot", {}, f"gemini-notes-connect-{uuid.uuid4().hex}"
        )
        if str(connected.get("status") or "").lower() in {"failed", "unavailable"}:
            return {"status": "failed", "operation_id": request_id, "error": "Notes connection was not acknowledged by the UI."}
    try:
        if action in {"list_notes", "read_note"}:
            query = str(arguments.get("query") or "").strip()
            note = state.get_note_by_id(str(arguments.get("note_id") or "").strip()) if arguments.get("note_id") else None
            if note is None and query:
                note = state.find_note(query)
            notes = state.get_notes_state().get("notes", [])
            return {"status": "completed", "operation_id": request_id, "notes": [_compact_note(note)] if note else [_compact_note(item) for item in notes[-10:]]}
        if action == "create_note":
            content = str(arguments.get("content") or "").strip()
            if not content:
                return {"status": "failed", "operation_id": request_id, "error": "Note content is required."}
            note = state.add_note(content, category=str(arguments.get("category") or ""))
            ui_result = await refresh_notes_ui("open_note", query=content[:160])
            return {"status": "completed", "operation_id": request_id, "note": _compact_note(note), "ui_refresh_status": ui_result.get("status"), "ui_result": ui_result}
        if action == "update_note":
            note_id = str(arguments.get("note_id") or "").strip()
            content = str(arguments.get("content") or "").strip()
            if not note_id or not content:
                return {"status": "failed", "operation_id": request_id, "error": "note_id and content are required."}
            note = state.update_note(note_id, content, category=str(arguments.get("category") or ""))
            ui_result = await refresh_notes_ui("open_note", query=content[:160])
            return {"status": "completed", "operation_id": request_id, "note": _compact_note(note), "ui_refresh_status": ui_result.get("status"), "ui_result": ui_result}
        if action == "save_summary":
            content = str(arguments.get("content") or "").strip()
            if not content:
                return {"status": "failed", "operation_id": request_id, "error": "Summary content is required."}
            summary = state.add_summary(content, summary_type=str(arguments.get("summary_type") or "single-note"), tags=arguments.get("tags") or [])
            return {"status": "completed", "operation_id": request_id, "summary": summary}
        if action == "delete_note":
            note_id = str(arguments.get("note_id") or "").strip()
            if not note_id and arguments.get("query"):
                match = state.find_note(str(arguments["query"]))
                note_id = str((match or {}).get("id") or "")
            if not note_id:
                return {"status": "failed", "operation_id": request_id, "error": "Note not found."}
            state.delete_note(note_id)
            ui_result = await refresh_notes_ui("refresh_state")
            return {"status": "completed", "operation_id": request_id, "deleted_note_id": note_id, "ui_refresh_status": ui_result.get("status"), "ui_result": ui_result}
        if action == "clear_all_notes":
            state.clear_all_notes()
            ui_result = await refresh_notes_ui("refresh_state")
            return {"status": "completed", "operation_id": request_id, "cleared": True, "ui_refresh_status": ui_result.get("status"), "ui_result": ui_result}
        return {"status": "rejected", "reason":"unsupported_notes_action", "operation_id": request_id, "error": f"Unsupported Notes action: {action}"}
    except KeyError as exc:
        return {"status": "failed", "operation_id": request_id, "error": f"Note not found: {exc.args[0] if exc.args else ''}"}
    except Exception as exc:
        logger.exception("[GEMINI NOTES] Action failed: %s", action)
        return {"status": "failed", "operation_id": request_id, "error": str(exc) or type(exc).__name__}


# ============================================================================
# WEBSOCKET MANAGER
# ============================================================================

class WebSocketManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.connections: List[WebSocket] = []
        self.client_ids: Dict[WebSocket, str] = {}
        self.send_locks: Dict[WebSocket, asyncio.Lock] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.connections.append(websocket)
        self.send_locks[websocket] = asyncio.Lock()
        client_id = f"client-{uuid.uuid4().hex}"
        self.client_ids[websocket] = client_id
        state.active_connections.add(websocket)
        logger.info(f"[OK] Client connected. Active connections: {len(self.connections)}")
        
        # Send welcome message
        await self.send_to_client(websocket, {
            "type": "status",
            "state": "idle",
            "message": "Connected to AEGIS Server",
            "client_id": client_id,
            "widget_protocol_version": 2,
        })
        # Search content rehydrates through /api/search/state when the widget is opened.
        # Do not auto-open the search widget on client reconnect or page reload.
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        client_id = self.client_ids.pop(websocket, None)
        service=globals().get('workspace_service')
        if client_id and service and service.hub:
            service.hub.remove(client_id);service.end_audio_lock(client_id)
        self.send_locks.pop(websocket, None)
        if client_id:
            getattr(self,'globe_revisions',{}).pop(client_id,None)
            UI_CONTEXTS.pop(client_id,None)
            CHAT_SESSIONS.pop(client_id,None)
            state.widget_connections.disconnect_client(client_id)
        if websocket in self.connections:
            self.connections.remove(websocket)
        state.active_connections.discard(websocket)
        logger.info(f"[DISCONNECT] Client disconnected. Active connections: {len(self.connections)}")

    def client_id(self, websocket: WebSocket) -> str:
        return self.client_ids.get(websocket, "")

    def websocket_for(self, client_id: str) -> Optional[WebSocket]:
        return next((socket for socket, value in self.client_ids.items() if value == client_id), None)

    async def send_to_client_id(self, client_id: str, message: Dict[str, Any]) -> None:
        websocket = self.websocket_for(client_id)
        if websocket is not None:
            await self.send_to_client(websocket, message)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Send message to all connected clients"""
        msg_type = message.get("type", "unknown")
        num_clients = len(self.connections)
        
        if msg_type == "response_audio":
            audio_size = len(message.get("audio", ""))
            print(f"[BROADCAST-AUDIO] Sending audio ({audio_size} chars) to {num_clients} client(s)", flush=True)
        
        for i, connection in enumerate(self.connections):
            try:
                await self.send_to_client(connection, message)
                if msg_type == "response_audio":
                    print(f"[BROADCAST-AUDIO] Sent to client {i+1}/{num_clients}", flush=True)
            except Exception as e:
                print(f"[BROADCAST-ERROR] Failed to send {msg_type} to client {i+1}: {e}", flush=True)
                logger.error(f"Failed to send {msg_type} to client: {e}")
    
    async def send_to_client(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to specific client"""
        if websocket not in self.connections:
            return
        try:
            lock = self.send_locks.setdefault(websocket, asyncio.Lock())
            async with lock:
                service=globals().get('workspace_service')
                if service:message=service.cards(self.client_id(websocket),message)
                await websocket.send_json(message)
            service=globals().get('workspace_service')
            if service:await service.mirror(self.client_id(websocket),message)
        except Exception as e:
            logger.error(f"Failed to send message to client: {e}")

    async def send_bytes_to_client(self, websocket: WebSocket, payload: bytes) -> None:
        """Send one binary audio frame without interleaving JSON frames."""
        if websocket not in self.connections:
            return
        service=globals().get('workspace_service')
        if service:
            live=state.live_sessions.get(websocket);generation=getattr(live,'_voice_lease_generation',None)
            if not service.store().owns_voice(self.client_id(websocket),generation) or generation is None:return
            payload=b'NVA1'+int(generation).to_bytes(4,'little')+payload
        try:
            lock = self.send_locks.setdefault(websocket, asyncio.Lock())
            async with lock:
                await websocket.send_bytes(payload)
        except Exception as exc:
            logger.error("Failed to send live audio to client: %s", exc)


ws_manager = WebSocketManager()


def _frontend_widget_message(message: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in message.items() if key != "execution"}


async def _broadcast_widget_connection(
    widget: str,
    status: str,
    *,
    request_id: str = "",
    detail: str = "",
) -> None:
    await ws_manager.broadcast({
        "type": "widget_control",
        "widget": widget,
        "command": "connection",
        "request_id": request_id or f"connection-{uuid.uuid4().hex}",
        "source": "aegis_ai",
        "status": status,
        "detail": detail,
    })


def _task_payload_from_aegis(arguments: Dict[str, Any]) -> Dict[str, Any]:
    trigger_kind = str(arguments.get("trigger") or "manual").strip().lower()
    if trigger_kind not in {"manual", "schedule", "event"}:
        trigger_kind = "manual"
    trigger: Dict[str, Any] = {
        "kind": trigger_kind,
        "timezone": str(arguments.get("timezone") or configured_timezone()),
        "enabled": True,
    }
    if trigger_kind == "schedule":
        trigger["schedule"] = str(arguments.get("schedule") or "").strip()
    if trigger_kind == "event":
        trigger["event_name"] = str(arguments.get("event_name") or "app_events").strip()
        if arguments.get("every_count") is not None:
            trigger["every_count"] = int(arguments["every_count"])
    kind = str(arguments.get("kind") or "prompt").strip().lower()
    if kind not in {"prompt", "research", "action"}:
        kind = "prompt"
    priority = str(arguments.get("priority") or "normal").strip().lower()
    if priority not in {"low", "normal", "high", "urgent"}:
        priority = "normal"
    checklist = arguments.get("checklist") if isinstance(arguments.get("checklist"), list) else []
    return {
        "title": str(arguments.get("title") or "Aegis task").strip()[:240],
        "instruction": str(arguments.get("instruction") or arguments.get("title") or "Aegis task").strip()[:20000],
        "kind": kind,
        "priority": priority,
        "tags": ["Aegis"],
        "project": str(arguments.get("project") or "").strip()[:120],
        "due_at": arguments.get("due_at"),
        "timezone": str(arguments.get("timezone") or configured_timezone()),
        "trigger": trigger,
        "checklist": [str(item).strip()[:500] for item in checklist if str(item).strip()][:100],
        "dependency_ids": [],
        "metadata": {"created_by": "aegis_semantic_planner"},
        "lifecycle": "active",
    }


NEWS_IMAGE_CACHE: Dict[str, Dict[str, Any]] = {}
NEWS_IMAGE_CACHE_LOCK = threading.Lock()


def _canonical_news_url(value: str) -> str:
    try:
        parsed = urlparse(str(value or "").strip())
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            return ""
        query = urlencode([(key, item) for key, item in parse_qsl(parsed.query, keep_blank_values=True) if not key.lower().startswith(("utm_", "fbclid", "gclid"))])
        return urlunparse((parsed.scheme, parsed.netloc.lower(), parsed.path.rstrip("/"), "", query, ""))
    except Exception:
        return ""


def _clean_news_excerpt(value: Any) -> str:
    raw = re.sub(r"\s+", " ", str(value or "")).strip()
    raw = re.sub(r"(?:\s*[.…]{3,}\s*)$", "", raw).strip()
    if not raw:
        return ""
    sentence = re.match(r"^(.+?[.!?])(?:\s|$)", raw)
    return sentence.group(1).strip() if sentence else raw.rstrip(". ") + "."


def _select_news_media(candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Choose the best legitimate source asset without upscaling thumbnails."""
    usable: List[Dict[str, Any]] = []
    for candidate in candidates:
        url = _canonical_news_url(str(candidate.get("url") or ""))
        if not url:
            continue
        width = max(0, int(candidate.get("width") or 0))
        height = max(0, int(candidate.get("height") or 0))
        source = str(candidate.get("source") or "unknown")
        quality = width * height + (1_000_000 if source != "provider_thumbnail" else 0)
        usable.append({**candidate, "url": url, "width": width, "height": height, "_quality": quality})
    if not usable:
        return {}
    best = max(usable, key=lambda item: item["_quality"])
    ratio = (best["width"] / best["height"]) if best["width"] and best["height"] else 0
    return {
        "url": best["url"], "width": best["width"], "height": best["height"],
        "aspectRatio": ratio, "source": best.get("source", "unknown"),
        "variants": [{"url": item["url"], "width": item["width"], "height": item["height"]} for item in usable],
    }


def _article_image_metadata(url: str) -> Dict[str, Any]:
    canonical = _canonical_news_url(url)
    if not canonical:
        return {}
    with NEWS_IMAGE_CACHE_LOCK:
        cached = NEWS_IMAGE_CACHE.get(canonical)
        if cached and time.time() - cached.get("cached_at", 0) < 3600:
            return dict(cached)
    try:
        response = requests.get(canonical, headers={"User-Agent": "Mozilla/5.0 AstraNews/1.0"}, timeout=7)
        response.raise_for_status()
        markup = response.text[:1_000_000]
        def meta(*names: str) -> str:
            for name in names:
                match = re.search(rf'<meta[^>]+(?:property|name)=["\']{re.escape(name)}["\'][^>]+content=["\']([^"\']+)', markup, re.I)
                if not match:
                    match = re.search(rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(name)}["\']', markup, re.I)
                if match:
                    return match.group(1).strip()
            return ""
        image = meta("og:image:secure_url", "og:image", "twitter:image:src", "twitter:image")
        width = int(meta("og:image:width") or 0) if (meta("og:image:width") or "").isdigit() else 0
        height = int(meta("og:image:height") or 0) if (meta("og:image:height") or "").isdigit() else 0
        payload = {"url": image, "width": width, "height": height, "source": "article_metadata", "cached_at": time.time()} if _canonical_news_url(image) else {}
    except Exception:
        payload = {}
    with NEWS_IMAGE_CACHE_LOCK:
        NEWS_IMAGE_CACHE[canonical] = dict(payload, cached_at=time.time())
    return payload


async def _enrich_news_images(results: List[Dict[str, Any]], limit: int = 8) -> None:
    for result in results[:limit]:
        metadata = await asyncio.to_thread(_article_image_metadata, str(result.get("link") or ""))
        candidates = [candidate for candidate in (metadata, {"url": result.get("thumbnail") or "", "width": 0, "height": 0, "source": "provider_thumbnail"}) if candidate.get("url")]
        media = _select_news_media(candidates)
        if media:
            result["image"] = media
            result["image_candidates"] = candidates


def _news_topic_label(query: str) -> str:
    """Return a compact query-derived label for the deterministic briefing fallback."""
    compact = re.sub(r"\s+", " ", str(query or "").strip())
    return compact[:72].rstrip(" .,:;-") or "this story"


def _fallback_news_sections(query: str, evidence: List[Dict[str, Any]], source_ids: List[str]) -> List[Dict[str, Any]]:
    """Produce a source-grounded editorial fallback without provider snippets as one-line cards."""
    topic = _news_topic_label(query)
    excerpts = [str(story.get("summary") or "").strip() for story in evidence if str(story.get("summary") or "").strip()]
    lead = excerpts[0] if excerpts else f"Current reporting is centered on {topic}."
    developments = " ".join(excerpts[1:5]).strip()
    sections = [
        {"id": "current-picture", "title": f"{topic}: the current picture", "body": lead, "sourceIds": source_ids[:3]},
        {"id": "reported-developments", "title": f"Developments around {topic}", "body": developments or lead, "sourceIds": source_ids[:6]},
        {"id": "signals-and-implications", "title": f"Signals and implications for {topic}", "body": f"The coverage currently spans {len(source_ids)} distinct publishers. Review the linked reports for their individual timing, findings, and open questions.", "sourceIds": source_ids},
        {"id": "next-signals", "title": f"What could change the picture for {topic}", "body": "Further official statements, follow-up reporting, and independently confirmed details will determine whether the current picture holds or changes.", "sourceIds": source_ids},
    ]
    return [section for section in sections if re.search(r"[A-Za-z0-9]", str(section.get("body") or ""))]


async def _synthesize_news_sections(query: str, primary: Dict[str, Any], stories: List[Dict[str, Any]], layout_manifest: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Use an existing server-side LLM, when configured, to structure source evidence into editorial sections.

    The request intentionally sends excerpts and source identifiers only.  A malformed,
    unavailable, or unsupported provider result simply leaves the deterministic fallback
    in place, so News never fails after successful retrieval.
    """
    providers = _get_notes_ai_provider_chain()
    if not providers:
        return None
    source_by_id = {str(source.get("id") or ""): source for story in stories for source in (story.get("sources") or [])}
    evidence = []
    for story in stories[:12]:
        source = (story.get("sources") or [{}])[0]
        evidence.append({
            "id": str(source.get("id") or story.get("id") or ""),
            "publisher": str(source.get("name") or "News source"),
            "headline": str(story.get("headline") or ""),
            "excerpt": str(story.get("summary") or ""),
        })
    requested_sections = min(12, max(3, int(((layout_manifest or {}).get("dynamicSections") or {}).get("count") or 4)))
    requested_items = list(((layout_manifest or {}).get("dynamicSections") or {}).get("items") or [])[:requested_sections]
    payload = {
        "query": query,
        "instructions": (
            f"Create up to {requested_sections} concise, query-specific editorial sections from only the supplied evidence. "
            "Each title must be meaningful for this query, not a fixed template. Each body must use complete original sentences, "
            "avoid repeating another section, avoid ellipses, and cite sourceIds that support it. Do not invent facts. "
            "Return JSON only: {sections:[{id,title,body,sourceIds}], insight:{text,sourceId}|null}."
        ),
        "layoutRequirements": requested_items,
        "evidence": evidence,
    }
    request_template = {
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You are a careful news editor. Obey the supplied evidence and return strict JSON only."},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
    }
    for provider in providers:
        request_payload = {**request_template, "model": str(provider.get("model") or "")}
        try:
            response = await asyncio.to_thread(requests.post, str(provider["url"]), headers=provider["headers"], json=request_payload, timeout=15)
            if response.status_code != 200:
                continue
            content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
            candidate = json.loads(str(content).strip().removeprefix("```json").removesuffix("```").strip())
        except Exception:
            continue
        raw_sections = candidate.get("sections") if isinstance(candidate, dict) else None
        sections: List[Dict[str, Any]] = []
        seen_bodies: Set[str] = set()
        for index, section in enumerate(raw_sections if isinstance(raw_sections, list) else []):
            title = str((section or {}).get("title") or "").strip()
            body = str((section or {}).get("body") or "").strip()
            fingerprint = re.sub(r"\W+", "", body.casefold())
            if not title or len(body) < 60 or not fingerprint or fingerprint in seen_bodies:
                continue
            source_ids = [str(item) for item in ((section or {}).get("sourceIds") or []) if str(item) in source_by_id]
            if not source_ids:
                continue
            seen_bodies.add(fingerprint)
            sections.append({"id": str((section or {}).get("id") or f"section-{index + 1}"), "title": title[:100], "body": body[:5000], "sourceIds": source_ids})
        if not sections:
            continue
        insight = candidate.get("insight") if isinstance(candidate, dict) else None
        normalized_insight = None
        if isinstance(insight, dict):
            source_id = str(insight.get("sourceId") or "")
            insight_text = str(insight.get("text") or "").strip()
            if source_id in source_by_id and len(insight_text) >= 30:
                normalized_insight = {"text": insight_text[:700], "sourceId": source_id, "publisher": source_by_id[source_id].get("name") or "News source"}
        return {"briefingSections": sections, "insight": normalized_insight, "synthesisProvider": str(provider.get("name") or "")}
    return None


def _build_news_briefing(query: str, results: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    """Create a provider-grounded News response without inventing facts or metadata."""
    seen: Set[Tuple[str, str]] = set()
    stories: List[Dict[str, Any]] = []
    for index, result in enumerate(results):
        headline = str(result.get("title") or "").strip()
        link = str(result.get("link") or "").strip()
        publisher = str(result.get("source_name") or result.get("domain") or "News source").strip()
        link = _canonical_news_url(link)
        key = (re.sub(r"\W+", "", headline.casefold()), link.casefold())
        if not headline or not link or key in seen:
            continue
        seen.add(key)
        story = {
            "id": str(result.get("id") or index), "headline": headline,
            "summary": _clean_news_excerpt(result.get("snippet")),
            "publishedAt": str(result.get("publishedAt") or result.get("date") or "").strip(),
            "category": str(result.get("category") or "").strip(),
            "imageUrl": str((result.get("image") or {}).get("url") or result.get("thumbnail") or "").strip(), "imageAlt": headline,
            "image": result.get("image") or {},
            "isTopStory": not stories,
            "sources": [{"id": str(result.get("id") or index), "name": publisher, "url": link, "headline": headline, "publishedAt": str(result.get("date") or "").strip()}],
        }
        stories.append(story)

    if not stories:
        return None, []
    primary = dict(stories[0])
    unique_sources: List[Dict[str, Any]] = []
    seen_sources: Set[str] = set()
    for story in stories:
        for source in story["sources"]:
            source_key = (source["url"] or source["name"]).casefold()
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                unique_sources.append(source)
    # Search providers occasionally return an ellipsis-only placeholder. It
    # is retrieval metadata, not evidence, and must never become prose.
    evidence = [story for story in stories if re.search(r"[A-Za-z0-9]", str(story.get("summary") or ""))]
    paragraphs = [f"Current coverage of {query} is led by {primary['headline'].rstrip('.')}." ]
    if re.search(r"[A-Za-z0-9]", str(primary.get("summary") or "")):
        paragraphs.append(primary["summary"])
    developments = [story["summary"] for story in evidence[1:7] if story.get("summary")]
    if developments:
        paragraphs.append("Available reporting points to several related developments: " + " ".join(developments))
    primary["body"] = "\n\n".join(paragraphs)
    source_ids = [source["id"] for source in unique_sources]
    primary["briefingSections"] = _fallback_news_sections(query, evidence, source_ids)
    primary["keyPoints"] = [
        {"title": story["headline"], "description": story["summary"] or f"Additional reporting from {story['sources'][0]['name']}.", "iconType": story.get("category") or "news"}
        for story in evidence[1:5]
    ]
    if len(evidence) > 1:
        primary["whyItMatters"] = f"This briefing combines {len(unique_sources)} distinct source{'s' if len(unique_sources) != 1 else ''} covering {query}. Review the linked coverage for each publisher's full reporting and any updates."
    primary["sources"] = unique_sources
    primary["sourceCoverage"] = [{**source, "sectionIds": source_ids} for source in unique_sources]
    primary["media"] = [
        {**story.get("image", {}), "id": f"media-{story['id']}", "storyId": story["id"], "alt": story["headline"], "caption": story["sources"][0]["name"], "relatedSectionId": primary["briefingSections"][min(index, len(primary["briefingSections"]) - 1)]["id"] if primary["briefingSections"] else "primary-media", "qualityScore": int((story.get("image") or {}).get("width") or 0) * int((story.get("image") or {}).get("height") or 0)}
        for index, story in enumerate(stories) if (story.get("image") or {}).get("url")
    ]
    planned_urls: Set[str] = set()
    def claim(items: List[Dict[str, Any]], count: int, slot: str) -> List[Dict[str, Any]]:
        claimed: List[Dict[str, Any]] = []
        for item in sorted(items, key=lambda value: int(value.get("qualityScore") or 0), reverse=True):
            url = str(item.get("url") or "")
            width, height = int(item.get("width") or 0), int(item.get("height") or 0)
            if not url or url in planned_urls or (width and width < 480) or (height and height < 270):
                continue
            planned_urls.add(url)
            claimed.append({**item, "recommendedSlot": slot})
            if len(claimed) >= count:
                break
        return claimed
    primary["mediaPlan"] = {
        "heroMedia": claim(primary["media"], 2, "hero"),
        "supportingMedia": claim(primary["media"], 2, "supporting"),
        "quoteMedia": [],
        "relatedCoverageMedia": claim(primary["media"], 5, "related"),
    }
    # Explicit aliases make the editorial roles available to integrations that
    # should not need to understand the internal mediaPlan naming.
    primary["featuredImageSet"] = primary["mediaPlan"]["heroMedia"]
    primary["featuredMedia"] = primary["mediaPlan"]["heroMedia"]
    primary["supportingImages"] = primary["mediaPlan"]["supportingMedia"]
    primary["relatedCoverageImages"] = primary["mediaPlan"]["relatedCoverageMedia"]
    def media_band(item: Dict[str, Any]) -> str:
        ratio = float(item.get("aspectRatio") or 0)
        if not ratio and item.get("width") and item.get("height"):
            ratio = float(item["width"]) / float(item["height"])
        if ratio < .8:
            return "portrait"
        if ratio <= 1.15:
            return "square"
        if ratio <= 1.8:
            return "landscape"
        return "wide"
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for item in primary["media"]:
        groups.setdefault(f"primary-media:{media_band(item)}", []).append(item)
    primary["mediaGroups"] = [{"id": group_id, "kind": "primary-story", "sectionId": "primary-media", "items": items} for group_id, items in groups.items()]
    primary["research_state"] = {"source_urls": [source["url"] for source in unique_sources], "source_fingerprints": [f"{story['headline']}|{story['sources'][0]['name']}" for story in stories], "last_fetched_at": datetime.now().isoformat()}
    return primary, stories


async def _run_serp_widget(
    widget: str,
    arguments: Dict[str, Any],
    request_id: str,
    client_id: str = "",
) -> None:
    async def deliver(payload: Dict[str, Any]) -> None:
        if client_id:
            await ws_manager.send_to_client_id(client_id, payload)
        else:
            await ws_manager.broadcast(payload)

    query = str(arguments.get("query") or "").strip()
    if not query:
        raise ValueError("A search query is required.")
    try:
        max_results = max(8, min(int(arguments.get("max_results") or 20), 50))
    except (TypeError, ValueError):
        max_results = 20
    loading_payload = {
        "type": "widget_control",
        "widget": widget,
        "command": "set_loading",
        "request_id": request_id,
        "source": "aegis_ai",
        "query": query,
        "display_topic": query,
        "display_subtopic": "Live web",
        "search_type": "web",
        "loading": True,
        "error": "",
        "original_transcript": query,
    }
    if widget == "news" and arguments.get("continuation"):
        loading_payload.update({"continuation": True, "expanding": True, "research_id": str(arguments.get("research_id") or "")})
    if widget == "search":
        state.update_search_widget_context(loading_payload)
    elif widget == "news":
        loading_payload["display_subtopic"] = "Live news"
        state.update_news_widget_context(loading_payload)
    await deliver(loading_payload)

    async def finish_news(*, primary_story: Optional[Dict[str, Any]] = None,
                          stories: Optional[List[Dict[str, Any]]] = None,
                          error: str = "", no_results: bool = False) -> None:
        """Persist and deliver every terminal News state for this request.

        A News request must never clear loading without either a renderable
        primary story or a visible terminal explanation.
        """
        payload = {
            "type": "widget_control", "widget": "news", "command": "show_news",
            "request_id": request_id, "source": "aegis_ai", "query": query,
            "display_topic": query, "display_subtopic": "Live news",
            "primary_story": primary_story, "related_stories": stories or [],
            "full_search_results": stories or [], "generated_at": datetime.now().isoformat(),
            "loading": False, "error": error, "no_results": no_results,
        }
        if arguments.get("continuation"):
            # The continuation request has a fresh transport id, but it must
            # mutate the saved briefing that the user explicitly expanded.
            payload["continuation"] = True
            payload["research_id"] = str(arguments.get("research_id") or "")
        elif primary_story:
            payload["research_id"] = str(primary_story.get("research_id") or request_id)
        updated = state.update_news_widget_context(payload)
        if str(updated.get("current", {}).get("request_id") or "") != request_id:
            logger.info("[NEWS] Dropping stale terminal result %s", request_id)
            return
        if primary_story and not error:
            await asyncio.to_thread(_record_application_memory,"news_weather_history","news_result",request_id,{"query":query,"headline":str(primary_story.get("headline") or "")[:500],"summary":str(primary_story.get("body") or "")[:2000],"retrieved_at":payload["generated_at"]},{"request_id":request_id})
        await deliver(payload)

    key = _get_env_value("SERPAPI_KEY")
    if not key:
        if widget == "news":
            await finish_news(error="Live news retrieval is not configured. Please contact an administrator and try again.")
            return
        raise RuntimeError("SERPAPI_KEY is not configured.")

    def fetch() -> Dict[str, Any]:
        params: Dict[str, Any] = {"engine": "google", "q": query, "api_key": key, "num": max_results}
        if widget == "news":
            params["tbm"] = "nws"
        response = requests.get("https://serpapi.com/search.json", params=params, timeout=20)
        response.raise_for_status()
        return response.json()

    try:
        data = await asyncio.to_thread(fetch)
    except Exception as exc:
        if widget == "news":
            logger.warning("[NEWS] Retrieval failed for %s: %s", request_id, exc)
            await finish_news(error="Unable to retrieve live coverage right now. Please try again.")
            return
        raise
    source_items = data.get("news_results" if widget == "news" else "organic_results", []) or []
    results = []
    for item in source_items[:max_results]:
        link = str(item.get("link") or "").strip()
        domain = urlparse(link).netloc.removeprefix("www.") if link else ""
        results.append({
            "id": str(item.get("position") or len(results) + 1),
            "title": item.get("title") or "",
            "link": link,
            "snippet": item.get("snippet") or "",
            "source": item.get("source") or domain,
            "source_name": item.get("source") or domain,
            "domain": domain,
            "date": item.get("date") or "",
            "thumbnail": item.get("thumbnail") or "",
            "publishedAt": item.get("date") or "",
            "category": item.get("category") or item.get("section") or "",
        })
    if widget == "news":
        if arguments.get("continuation"):
            previous = dict(state.news_widget_context.get("current") or {})
            seen_urls = set((previous.get("research_state") or {}).get("source_urls") or [])
            results = [item for item in results if _canonical_news_url(str(item.get("link") or "")) not in seen_urls]
        await _enrich_news_images(results)
        primary_story, stories = _build_news_briefing(query, results)
        if primary_story:
            layout_manifest = arguments.get("layout_manifest") if isinstance(arguments.get("layout_manifest"), dict) else None
            primary_story["layoutManifest"] = layout_manifest or {}
            synthesized = await _synthesize_news_sections(query, primary_story, stories, layout_manifest)
            if synthesized:
                primary_story.update(synthesized)
                primary_story["media"] = [
                    {**item, "relatedSectionId": item.get("relatedSectionId") or synthesized["briefingSections"][min(index, len(synthesized["briefingSections"]) - 1)]["id"]}
                    for index, item in enumerate(primary_story.get("media") or [])
                ]
        if arguments.get("continuation") and primary_story:
            previous = dict(state.news_widget_context.get("current") or {})
            existing = dict(previous.get("primary_story") or {})
            if existing:
                added = primary_story.get("body") or ""
                existing["body"] = "\n\n".join(part for part in (existing.get("body"), "Additional coverage", added) if part)
                existing["sources"] = list(existing.get("sources") or []) + [source for source in primary_story.get("sources") or [] if source.get("url") not in {item.get("url") for item in existing.get("sources") or []}]
                existing["keyPoints"] = list(existing.get("keyPoints") or []) + list(primary_story.get("keyPoints") or [])
                existing_sections = list(existing.get("briefingSections") or [])
                known_section_bodies = {str(section.get("body") or "") for section in existing_sections if isinstance(section, dict)}
                existing["briefingSections"] = existing_sections + [section for section in primary_story.get("briefingSections") or [] if str(section.get("body") or "") not in known_section_bodies]
                existing_media = list(existing.get("media") or [])
                existing_urls = {str(item.get("url") or "") for item in existing_media if isinstance(item, dict)}
                existing["media"] = existing_media + [item for item in primary_story.get("media") or [] if str(item.get("url") or "") not in existing_urls]
                if primary_story.get("mediaPlan"):
                    existing["mediaPlan"] = primary_story["mediaPlan"]
                existing["research_state"] = primary_story.get("research_state") or existing.get("research_state")
                primary_story = existing
                stories = list(previous.get("full_search_results") or []) + stories
        if not primary_story or not str(primary_story.get("headline") or "").strip():
            await finish_news(
                error="No reliable current coverage was found for this query. Try another topic.",
                no_results=True,
            )
            return
        await finish_news(primary_story=primary_story, stories=stories)
        return

    answer_box = data.get("answer_box") or {}
    answer = str(answer_box.get("answer") or answer_box.get("snippet") or "").strip()
    if not answer:
        answer = " ".join(item.get("snippet", "") for item in results[:3] if item.get("snippet")).strip()
    answer = sanitize_search_answer(answer)
    payload = {
        "type": "widget_control",
        "widget": "search",
        "command": "show_results",
        "request_id": request_id,
        "source": "aegis_ai",
        "query": query,
        "display_topic": query,
        "display_subtopic": "Live web",
        "answer": answer,
        "results": results,
        "search_type": "web",
        "loading": False,
        "original_transcript": query,
    }
    updated = state.update_search_widget_context(payload)
    if str(updated.get("current", {}).get("request_id") or "") != request_id:
        logger.info("[SEARCH] Dropping stale direct result %s", request_id)
        return
    await asyncio.to_thread(_record_application_memory,"search_external_info","research_result",request_id,{"query":query,"summary":answer[:2000],"retrieved_at":datetime.now().isoformat()},{"request_id":request_id,"urls":[str(item.get("link") or item.get("url") or "")[:500] for item in results[:5]]})
    await deliver(payload)


async def _execute_aegis_widget_envelope(message: Dict[str, Any]) -> None:
    """Execute a validated Aegis action in the authoritative backend or UI."""
    widget = str(message.get("widget") or "").strip().lower()
    command = str(message.get("command") or "").strip().lower()
    execution = str(message.get("execution") or "frontend").strip().lower()
    request_id = str(message.get("request_id") or f"widget-{uuid.uuid4().hex}")
    client_id = str(message.get("client_id") or state.current_client_id or "").strip()
    arguments = {
        key: value for key, value in message.items()
        if key not in {"type", "widget", "command", "request_id", "source", "execution", "client_id"}
    }
    state.register_widget_action(client_id, request_id)

    async def send(message_payload: Dict[str, Any]) -> None:
        if client_id:
            await ws_manager.send_to_client_id(client_id, message_payload)
        else:
            await ws_manager.broadcast(message_payload)

    if widget != "ui" and command == "connect":
        try:
            connection = state.widget_connections.connect(client_id, widget)
        except Exception as exc:
            await send({
                "type": "widget_connection", "widget": widget, "status": "failed",
                "request_id": request_id, "detail": str(exc),
            })
            return
        await send({
            "type": "widget_connection", "widget": widget, "status": "connected",
            "request_id": request_id, "connection_id": connection["connection_id"],
            "state_revision": connection["revision"], "request_snapshot": True,
        "detail": f"Aegis is connected to {widget}",
        })
        return

    if widget != "ui" and command == "disconnect":
        state.widget_connections.disconnect(client_id, widget)
        await send({
            "type": "widget_connection", "widget": widget, "status": "disconnected",
            "request_id": request_id, "detail": f"Aegis disconnected from {widget}",
        })
        return

    if command == "connection":
        await send(_frontend_widget_message(message))
        return
    if widget == "calendar" and command in {"read_context", "get_state", "list_events"}:
        result = await _gemini_read_calendar_context(client_id, arguments)
        await send({
            "type": "widget_action_result", "widget": "calendar", "command": command,
            "request_id": request_id, "status": "completed" if result.get("status") == "completed" else "failed",
            "detail": result.get("error") or "Calendar state read.", "data": result,
        })
        return
    if execution == "frontend":
        await send(_frontend_widget_message(message))
        return

    await send({
        "type": "widget_action_status", "widget": widget, "command": command,
        "request_id": request_id, "status": "working", "detail": f"Aegis is running {command}",
    })
    try:
        result_detail = f"{widget}.{command} completed"
        if widget == "notes" and command == "save_note":
            content = str(arguments.get("content") or arguments.get("prompt") or "").strip()
            if not content:
                raise ValueError("Note content is required.")
            note = state.add_note(content, category=str(arguments.get("category") or ""))
            result_detail = f"Saved note {note['id']}"
        elif widget == "notes" and command == "delete_note":
            note_id = str(arguments.get("note_id") or "").strip()
            if not note_id and arguments.get("query"):
                match = state.find_note(str(arguments["query"]))
                note_id = str((match or {}).get("id") or "")
            if not note_id:
                raise KeyError("Note not found")
            state.delete_note(note_id)
            result_detail = "Deleted the confirmed note"
        elif widget == "notes" and command == "clear_all_notes":
            state.clear_all_notes()
            result_detail = "Cleared all confirmed notes"
        elif widget == "task" and command == "create":
            payload = _task_payload_from_aegis(arguments)
            created = await asyncio.to_thread(
                task_store.create_task,
                "local",
                payload,
                source="aegis",
                correlation_id=request_id,
            )
            if payload["trigger"]["kind"] == "manual" and bool(arguments.get("run_now", True)):
                await asyncio.to_thread(
                    task_store.create_run,
                    "local",
                    created["id"],
                    "high" if payload["kind"] == "action" else "low",
                )
                task_orchestrator.wake()
            await send({
                "type": "widget_control", "widget": "task", "command": "open",
                "request_id": request_id, "source": "aegis_ai", "task_id": created["id"],
            })
            result_detail = f"Created durable task {created['id']}"
        elif widget == "task" and command == "list":
            tasks = await asyncio.to_thread(task_store.list_tasks, "local", limit=100)
            await send({
                "type": "widget_control", "widget": "task", "command": "open",
                "request_id": request_id, "source": "aegis_ai", "task_count": len(tasks),
            })
            result_detail = f"Loaded {len(tasks)} tasks"
        elif widget == "task" and command == "run":
            task_id = str(arguments.get("task_id") or "").strip()
            task = await asyncio.to_thread(task_store.get_task, "local", task_id)
            run = await asyncio.to_thread(
                task_store.create_run, "local", task_id,
                "high" if task.get("kind") == "action" else "low",
            )
            task_orchestrator.wake()
            result_detail = f"Queued run {run['id']}"
        elif widget == "task" and command in {"pause", "resume", "cancel"}:
            run_id = str(arguments.get("run_id") or "").strip()
            target = {"pause": "pausing", "resume": "queued", "cancel": "cancelled"}[command]
            run = await asyncio.to_thread(
                task_store.transition_run, "local", run_id, target,
                message=f"Aegis requested {command}",
            )
            if command == "resume":
                task_orchestrator.wake()
            result_detail = f"Run {run['id']} is {run['status']}"
        elif widget == "task" and command == "retry":
            run = await asyncio.to_thread(task_store.retry_run, "local", str(arguments.get("run_id") or ""))
            task_orchestrator.wake()
            result_detail = f"Retry queued as {run['id']}"
        elif widget == "task" and command in {"update", "complete"}:
            task_id = str(arguments.get("task_id") or "").strip()
            patch = dict(arguments.get("patch") or {}) if isinstance(arguments.get("patch"), dict) else {}
            if command == "complete":
                patch["lifecycle"] = "completed"
            task = await asyncio.to_thread(task_store.update_task, "local", task_id, patch, None)
            result_detail = f"Updated task {task['id']}"
        elif widget == "task" and command == "delete":
            deleted = await asyncio.to_thread(task_store.delete_task, "local", str(arguments.get("task_id") or ""))
            result_detail = f"Deleted task {deleted['deleted_id']}"
        elif widget == "task" and command in {"approve", "reject"}:
            approval = await asyncio.to_thread(
                task_store.decide_approval,
                "local",
                str(arguments.get("approval_id") or ""),
                "approved" if command == "approve" else "rejected",
                str(arguments.get("note") or ""),
            )
            task_orchestrator.wake()
            result_detail = f"Approval {approval['id']} {approval['status']}"
        elif widget in {"search", "news"} and command in {"run", "refresh_news"}:
            await _run_serp_widget(widget, arguments, request_id, client_id)
            result_detail = f"Loaded live {widget} results"
        elif widget == "weather" and command in {"run", "refresh_weather"}:
            location = str(arguments.get("location") or arguments.get("query") or "").strip()
            if not location:
                location, _ = _get_current_location_query()
            weather_service = _load_weather_service()
            weather = await asyncio.to_thread(weather_service.get_comprehensive_weather_data, location)
            if weather.get("error"):
                raise RuntimeError(str(weather["error"]))
            await send({
                "type": "widget_control", "widget": "weather", "command": "show_weather",
                "request_id": request_id, "source": "aegis_ai",
                "location": weather.get("location") or location, "weather_data": weather,
            })
            await asyncio.to_thread(_record_application_memory,"news_weather_history","weather_result",request_id,{"location":str(weather.get("location") or location),"retrieved_at":datetime.now().isoformat(),"summary":str(weather.get("description") or weather.get("condition") or "Weather retrieved")[:500]})
            result_detail = "Loaded current weather"
        elif widget == "calendar" and command in {"quick_add", "create_event"}:
            from calendar_backend.quick_add import parse_quick_add
            raw_text = str(arguments.get("text") or "").strip()
            if raw_text:
                parsed = parse_quick_add(raw_text, str(arguments.get("timezone") or configured_timezone()), None)
                draft = await asyncio.to_thread(calendar_store.save_quick_draft, raw_text, parsed, None)
                await send({
                    "type": "widget_control", "widget": "calendar", "command": "new",
                    "request_id": request_id, "source": "aegis_ai", "quick_draft": draft,
                    "requires_review": True,
                })
                result_detail = f"Prepared calendar draft {draft['id']} for review"
            else:
                payload = dict(arguments)
                payload.setdefault("calendar_id", calendar_store.preferences().get("default_calendar_id"))
                payload.setdefault("timezone", configured_timezone())
                payload.setdefault("all_day", False)
                for field in ("start", "end"):
                    if isinstance(payload.get(field), str):
                        payload[field] = datetime.fromisoformat(payload[field].replace("Z", "+00:00"))
                event = await asyncio.to_thread(calendar_store.create_event, payload)
                await send({
                    "type": "widget_control", "widget": "calendar", "command": "today",
                    "request_id": request_id, "source": "aegis_ai", "event_id": event["id"],
                })
                result_detail = f"Created calendar event {event['id']}"
        elif widget == "calendar" and command == "update_event":
            event_id = str(arguments.get("event_id") or "").strip()
            patch = dict(arguments.get("patch") or {}) if isinstance(arguments.get("patch"), dict) else {
                key: value for key, value in arguments.items() if key != "event_id"
            }
            for field in ("start", "end"):
                if isinstance(patch.get(field), str):
                    patch[field] = datetime.fromisoformat(patch[field].replace("Z", "+00:00"))
            event = await asyncio.to_thread(calendar_store.update_event, event_id, patch, None)
            result_detail = f"Updated calendar event {event['id']}"
        elif widget == "calendar" and command == "delete_event":
            event = await asyncio.to_thread(calendar_store.delete_event, str(arguments.get("event_id") or ""), None)
            result_detail = f"Deleted calendar event {event['id']}"
        else:
            raise ValueError(f"Backend action {widget}.{command} is not implemented.")

        result = {
            "type": "widget_action_status", "widget": widget, "command": command,
            "request_id": request_id, "status": "completed", "detail": result_detail,
        }
        if client_id:
            state.widget_connections.record_result(client_id, result)
        state.resolve_widget_action(client_id, request_id, result)
        await send(result)
    except Exception as exc:
        logger.error("[WIDGET] Backend action %s.%s failed: %s", widget, command, exc)
        result = {
            "type": "widget_action_status", "widget": widget, "command": command,
            "request_id": request_id, "status": "failed", "detail": str(exc),
        }
        if client_id:
            state.widget_connections.record_result(client_id, result)
        state.resolve_widget_action(client_id, request_id, result)
        await send(result)


# ============================================================================
# SPEECH CORRECTION & CLEANING
# ============================================================================

def apply_speech_corrections(text: str) -> str:
    """
    Clean and correct speech-to-text transcription errors.
    Handles common misrecognitions and typos from voice input.
    
    Returns: Cleaned and corrected text
    """
    if not text:
        return text
    
    # Common voice-to-text corrections
    corrections = {
        # AI system names
        "aegis eye": "Aegis AI",
        "aegis a.i": "Aegis AI",
        "aegis ai": "Aegis AI",
        "aegis": "AEGIS",
        
        # Common misrecognitions
        "homophones": "homophone",
        "their": "there",
        "there there": "there",
        "weather": "whether",
        "write": "right",
        "knight": "night",
        "know": "no",
        "new": "knew",
        
        # Common contractions and typos
        "dont": "don't",
        "cant": "can't",
        "wont": "won't",
        "shouldnt": "shouldn't",
        "couldnt": "couldn't",
        "hasnt": "hasn't",
        "havent": "haven't",
        "isnt": "isn't",
        "arent": "aren't",
        "wasnt": "wasn't",
        "werent": "weren't",
        "ive": "I've",
        "youve": "you've",
        "theyre": "they're",
        "were": "we're",
        "wr": "were",
        
        # Numbers and units
        "one": "1",
        "two": "2",
        "three": "3",
        "four": "4",
        "five": "5",
        "six": "6",
        "seven": "7",
        "eight": "8",
        "nine": "9",
        "zero": "0",
        
        # Commands that might be misheard
        "ok": "okay",
        "ok google": "",
        "ok alexa": "",
        "alexa": "",
        "siri": "",
        
        # Tech terms commonly mispronounced
        "python": "Python",
        "java": "Java",
        "java script": "JavaScript",
        "type script": "TypeScript",
        "react": "React",
        "angular": "Angular",
        "vue": "Vue",
        "node": "Node.js",
        "npm": "NPM",
        "yarn": "Yarn",
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "api": "API",
        "rest": "REST",
        "json": "JSON",
        "xml": "XML",
        "html": "HTML",
        "css": "CSS",
        "sql": "SQL",
        "database": "database",
        "linux": "Linux",
        "windows": "Windows",
        "mac": "macOS",
    }
    
    # Apply corrections (case-insensitive matching)
    corrected = text.lower()
    for wrong, right in corrections.items():
        corrected = corrected.replace(wrong.lower(), right.lower())
    
    # Capitalize first letter of sentence
    if corrected:
        corrected = corrected[0].upper() + corrected[1:] if len(corrected) > 1 else corrected.upper()
    
    # Clean up excessive punctuation
    corrected = corrected.replace("...", ".")
    corrected = corrected.replace("!!!!", "!")
    corrected = corrected.replace("????", "?")
    
    # Remove extra spaces
    corrected = " ".join(corrected.split())
    
    logger.debug(f"[LOG] Speech correction: '{text}' → '{corrected}'")
    return corrected


# ============================================================================
# MARKDOWN STRIPPING FOR TTS
# ============================================================================

def strip_markdown_for_tts(text: str) -> str:
    """
    Strip markdown formatting from text before sending to TTS.
    Removes: **bold**, __bold__, *italic*, _italic_, `code`, links, etc.
    Also removes overly-apologetic phrases.
    """
    if not text:
        return ""
    
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold** → bold
    text = re.sub(r'__(.+?)__', r'\1', text)      # __bold__ → bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)      # *italic* → italic
    text = re.sub(r'_(.+?)_', r'\1', text)        # _italic_ → italic
    text = re.sub(r'`(.+?)`', r'\1', text)        # `code` → code
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)  # [link](url) → link
    
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)    # ```code blocks```
    
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)  # # Header → Header
    
    # Remove list markers
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # - item → item
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # 1. item → item
    
    # Remove overly-apologetic phrases
    apologies = [
        "I apologize",
        "I'm sorry",
        "Sorry about that",
        "My bad",
        "I apologize for",
        "I'm afraid",
        "Unfortunately"
    ]
    for apology in apologies:
        text = re.sub(f'(?i){re.escape(apology)}', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    logger.debug(f"[TTS] Markdown stripped for TTS: {text[:100]}")
    return text



# ============================================================================
# ELEVENLABS TEXT-TO-SPEECH (PRIMARY - ONLY PROVIDER)
# ============================================================================


ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"


def _get_elevenlabs_voice_id() -> str:
    """Return the configured ElevenLabs voice ID or a known free fallback."""
    return (
        os.getenv("elevenlabs_voice_id") or
        os.getenv("ELEVENLABS_VOICE_ID") or
        ELEVENLABS_DEFAULT_VOICE_ID
    )


def _get_elevenlabs_voice_label(voice_id: str) -> str:
    """Label the selected ElevenLabs voice ID for logging."""
    if voice_id == ELEVENLABS_DEFAULT_VOICE_ID:
        return "default free voice"
    return voice_id


async def generate_audio_elevenlabs(text: str) -> Optional[str]:
    """
    Generate audio using ElevenLabs API and return as Base64.
    Uses the configured ElevenLabs voice ID and falls back to a free voice if needed.
    """
    if not text or not text.strip():
        print(f"[ELEVENLABS] Empty text for TTS", flush=True)
        logger.warning("[WARNING] Empty text for TTS")
        return None
    
    try:
        print(f"[ELEVENLABS-START] Starting API call...", flush=True)
        api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")
        if not api_key:
            print(f"[ELEVENLABS-ERROR] ElevenLabs API key not found", flush=True)
            logger.error("[ERROR] ElevenLabs API key not found in environment")
            return None
        print(f"[ELEVENLABS-KEY] API key found (length: {len(api_key)})", flush=True)
        
        clean_text = strip_markdown_for_tts(text)
        logger.info(f"[LOG] [TTS] ORIGINAL AI RESPONSE: '{text}'")
        logger.info(f"[LOG] [TTS] CLEANED TEXT FOR ELEVENLABS: '{clean_text}'")
        logger.info(f"[LOG] [TTS] LENGTH: {len(clean_text)} chars")
        
        voice_id = _get_elevenlabs_voice_id()
        voice_label = _get_elevenlabs_voice_label(voice_id)
        print(f"[ELEVENLABS-VOICE] Using voice ID: {voice_id} ({voice_label})", flush=True)
        
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": clean_text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        async def send_tts_request(current_voice_id: str):
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{current_voice_id}"
            print(f"[ELEVENLABS-POST] Making POST request to {url}", flush=True)
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"[ELEVENLABS-RESPONSE] Got status: {response.status_code}", flush=True)
            logger.debug(f"   Response status: {response.status_code}")
            return response
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers=headers,
            json=payload,
            timeout=30
        ))
        
        if response.status_code == 200:
            audio_bytes = response.content
            print(f"[ELEVENLABS-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] ElevenLabs returned {len(audio_bytes)} bytes of MP3 audio")
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"[ELEVENLABS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
            logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
            return audio_b64
        
        if response.status_code == 402 and voice_id != ELEVENLABS_FALLBACK_VOICE_ID:
            logger.warning("[ELEVENLABS] Paid voice blocked. Retrying with fallback free voice ID")
            fallback_voice_id = ELEVENLABS_FALLBACK_VOICE_ID
            print(f"[ELEVENLABS-FALLBACK] Retrying with free voice ID: {fallback_voice_id}", flush=True)
            response = await loop.run_in_executor(None, lambda: requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{fallback_voice_id}",
                headers=headers,
                json=payload,
                timeout=30
            ))
            if response.status_code == 200:
                audio_bytes = response.content
                print(f"[ELEVENLABS-SUCCESS] Got {len(audio_bytes)} bytes from fallback voice", flush=True)
                logger.info(f"[OK] [TTS] ElevenLabs returned {len(audio_bytes)} bytes of MP3 audio on fallback")
                audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                print(f"[ELEVENLABS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
                logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
                return audio_b64
        
        error_text = response.text[:500] if response.text else "No response text"
        print(f"[ELEVENLABS-ERROR] API error {response.status_code}: {error_text}", flush=True)
        logger.error(f"[ERROR] [TTS] ElevenLabs API error {response.status_code}")
        logger.error(f"   Response: {error_text}")
        return None
    
    except requests.exceptions.Timeout:
        print(f"[ELEVENLABS-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] ElevenLabs request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[ELEVENLABS-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[ELEVENLABS-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - Gemini TTS Fallback (Google Cloud TTS via Gemini API key)
# ============================================================================

# Gemini 2.5 Flash Preview TTS voice model
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"

# Google TTS REST API
GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
GOOGLE_TTS_VOICE = "en-US-Standard-C"
GOOGLE_TTS_LANGUAGE = "en-US"


async def generate_audio_gemini(text: str) -> Optional[str]:
    """
    Generate audio using Google Cloud Text-to-Speech API with the Gemini API key.
    Used as a fallback when ElevenLabs and Deepgram are not available.
    Uses the Google API key already configured for image generation.
    """
    if not text or not text.strip():
        print(f"[GEMINI-TTS] Empty text for TTS", flush=True)
        return None

    try:
        print(f"[GEMINI-TTS] Starting Google TTS...", flush=True)
        logger.info(f"[TTS] Using Google Cloud TTS as fallback")

        # Try to get the Google API key — same key used for image generation
        api_key = (
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY") or
            os.getenv("google_api_key") or
            os.getenv("GOOGLE_APIKEY")
        )
        if not api_key:
            print(f"[GEMINI-TTS-ERROR] GOOGLE_API_KEY not found", flush=True)
            logger.error("[ERROR] GOOGLE_API_KEY not found in environment")
            return None

        print(f"[GEMINI-TTS-KEY] API key found (length: {len(api_key)})", flush=True)

        clean_text = strip_markdown_for_tts(text)
        print(f"[GEMINI-TTS-API] Calling Google TTS API ({len(clean_text)} chars)...", flush=True)
        logger.info(f"[TTS] Calling Google Cloud TTS API ({len(clean_text)} chars)...")

        payload = {
            "input": {"text": clean_text},
            "voice": {
                "languageCode": GOOGLE_TTS_LANGUAGE,
                "name": GOOGLE_TTS_VOICE
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": 1.0,
                "pitch": 0.0,
                "volumeGainDb": 0.0
            }
        }

        loop = asyncio.get_event_loop()

        def make_request():
            print(f"[GEMINI-TTS-POST] Making POST request to Google TTS API...", flush=True)
            response = requests.post(
                f"{GOOGLE_TTS_API_URL}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            print(f"[GEMINI-TTS-RESPONSE] Got status: {response.status_code}", flush=True)
            return response

        response = await loop.run_in_executor(None, make_request)

        if response.status_code == 200:
            result = response.json()
            audio_content = result.get("audioContent", "")

            if audio_content:
                # The API returns base64 audio content directly
                audio_bytes = base64.b64decode(audio_content)
                print(f"[GEMINI-TTS-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
                logger.info(f"[OK] [TTS] Google TTS returned {len(audio_bytes)} bytes of MP3 audio")

                # Re-encode for consistency (though already base64)
                audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                print(f"[GEMINI-TTS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
                logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")

                return audio_b64
            else:
                print(f"[GEMINI-TTS-ERROR] Empty audio content in response", flush=True)
                logger.error("[ERROR] [TTS] Google TTS returned empty audio content")
                return None
        else:
            error_text = response.text[:500] if response.text else "No response text"
            print(f"[GEMINI-TTS-ERROR] API error {response.status_code}: {error_text}", flush=True)
            logger.error(f"[ERROR] [TTS] Google TTS API error {response.status_code}")
            logger.error(f"   Response: {error_text}")

            # Try Gemini 2.5 Flash Preview TTS model via OpenRouter if standard TTS fails
            logger.info("[TTS] Falling back to Gemini model via OpenRouter...")
            return await _generate_audio_gemini_model(clean_text, api_key)

    except requests.exceptions.Timeout:
        print(f"[GEMINI-TTS-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] Google TTS request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[GEMINI-TTS-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[GEMINI-TTS-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


async def _generate_audio_gemini_model(text: str, api_key: str) -> Optional[str]:
    """
    Fallback: Generate audio using Gemini 2.5 Flash Preview TTS via OpenRouter.
    This handles the case where standard Google TTS isn't available but Gemini access is.
    Uses the OpenRouter Gemini endpoint which can serve TTS-capable models.

    Returns: Base64 encoded MP3 audio or None.
    """
    try:
        clean_text = strip_markdown_for_tts(text)
        print(f"[GEMINI-MODEL] Using Gemini 2.5 Flash Preview TTS via OpenRouter...", flush=True)
        logger.info(f"[TTS] Calling Gemini 2.5 Flash Preview via OpenRouter for TTS")

        # Try OpenRouter first (most likely to have the TTS model available)
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("openrouter_api_key")

        if not openrouter_api_key:
            logger.warning("[TTS] No OpenRouter API key found for Gemini TTS model")
            return None

        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aegis-ai.local",
            "X-Title": "AEGIS AI"
        }

        payload = {
            "model": GEMINI_TTS_MODEL,
            "messages": [
                {"role": "user", "content": f"Read the following text aloud in a natural, conversational tone:\n\n{clean_text}"}
            ],
            "temperature": 0.3,
            "max_tokens": 2048,
            "stream": False
        }

        loop = asyncio.get_event_loop()

        def make_request():
            print(f"[GEMINI-MODEL-POST] Making request to OpenRouter Gemini endpoint...", flush=True)
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            print(f"[GEMINI-MODEL-RESPONSE] Got status: {response.status_code}", flush=True)
            return response

        response = await loop.run_in_executor(None, make_request)

        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            if content and len(content) > 50:
                # The response is text that we can either:
                # 1. Return as-is for the frontend to display (no TTS audio)
                # 2. Attempt to use a simple TTS conversion

                # For now, log that we got a text response but no audio
                logger.info(f"[GEMINI-MODEL] Got text response ({len(content)} chars) - no native TTS audio")
                print(f"[GEMINI-MODEL] Response: {content[:100]}...", flush=True)

                # Since we can't get actual audio from this, return None
                # The caller will fall through to pyttsx3 offline TTS
                return None
            else:
                logger.warning("[GEMINI-MODEL] Empty or too short response from Gemini model")
                return None
        else:
            error_text = response.text[:300] if response.text else "No response text"
            logger.warning(f"[GEMINI-MODEL] OpenRouter returned {response.status_code}: {error_text}")
            return None

    except Exception as e:
        logger.error(f"[GEMINI-MODEL] Error: {e}")
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - Deepgram Fallback (Primary Cloud Provider)
# ============================================================================

async def generate_audio_deepgram(text: str) -> Optional[str]:
    """
    Generate audio using Deepgram TTS API (primary cloud provider).
    More reliable than ElevenLabs free tier with good quality output.
    """
    if not text or not text.strip():
        print(f"[DEEPGRAM] Empty text for TTS", flush=True)
        return None
    
    try:
        print(f"[DEEPGRAM-START] Starting Deepgram TTS...", flush=True)
        logger.info(f"[TTS] Using Deepgram as primary provider")
        
        api_key = os.getenv("DEEPGRAM_API_KEY")
        if not api_key:
            print(f"[DEEPGRAM-ERROR] DEEPGRAM_API_KEY not found", flush=True)
            logger.error("[ERROR] DEEPGRAM_API_KEY not found in environment")
            return None
        print(f"[DEEPGRAM-KEY] API key found", flush=True)
        
        clean_text = strip_markdown_for_tts(text)
        url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3"
        
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "text/plain"
        }
        
        print(f"[DEEPGRAM-API] Calling API ({len(clean_text)} chars)...", flush=True)
        logger.info(f"[TTS] Calling Deepgram API ({len(clean_text)} chars)...")
        
        loop = asyncio.get_event_loop()
        
        def make_request():
            print(f"[DEEPGRAM-POST] Making POST request...", flush=True)
            response = requests.post(url, headers=headers, data=clean_text, timeout=30)
            print(f"[DEEPGRAM-RESPONSE] Got status: {response.status_code}", flush=True)
            return response
        
        response = await loop.run_in_executor(None, make_request)
        
        if response.status_code == 200:
            audio_bytes = response.content
            print(f"[DEEPGRAM-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] Deepgram returned {len(audio_bytes)} bytes of MP3 audio")
            
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"[DEEPGRAM-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
            logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
            
            return audio_b64
        else:
            error_text = response.text[:500] if response.text else "No response text"
            print(f"[DEEPGRAM-ERROR] API error {response.status_code}: {error_text}", flush=True)
            logger.error(f"[ERROR] [TTS] Deepgram API error {response.status_code}")
            logger.error(f"   Response: {error_text}")
            return None
    
    except requests.exceptions.Timeout:
        print(f"[DEEPGRAM-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] Deepgram request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[DEEPGRAM-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[DEEPGRAM-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - PyTTSx3 Fallback (Offline)
# ============================================================================

async def generate_audio_pyttsx3(text: str) -> Optional[str]:
    """
    Generate audio using offline pyttsx3 TTS as fallback.
    Used when ElevenLabs API quota is exceeded or unavailable.
    """
    if not text or not text.strip():
        print(f"[PYTTSX3] Empty text for TTS", flush=True)
        return None
    
    try:
        import pyttsx3
        import tempfile
        
        print(f"[PYTTSX3] Starting offline TTS fallback...", flush=True)
        logger.info(f"[TTS] [FALLBACK] Using pyttsx3 for: {text[:50]}...")
        
        # Initialize the engine
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', 150)  # Speed
        engine.setProperty('volume', 0.9)  # Volume (0-1)
        
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            # Save to temporary file
            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            
            # Read the audio file
            with open(tmp_path, 'rb') as f:
                audio_bytes = f.read()
            
            # Encode as Base64
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            print(f"[PYTTSX3] Generated {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] pyttsx3 fallback generated {len(audio_bytes)} bytes")
            
            return audio_b64
            
        finally:
            # Clean up temporary file
            try:
                os.remove(tmp_path)
            except:
                pass
                
    except ImportError:
        print(f"[PYTTSX3] pyttsx3 not installed - cannot use fallback", flush=True)
        logger.warning("[WARNING] pyttsx3 not installed - no fallback TTS available")
        return None
    except Exception as e:
        print(f"[PYTTSX3] Error: {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] pyttsx3 fallback failed: {e}")
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - WEB AUDIO API PIPELINE
# ============================================================================
"""
This module handles the audio generation pipeline that feeds the frontend's
sophisticated Web Audio API system:

Frontend Audio Pipeline (voice.ts):
  1. Receives Base64 audio from server over WebSocket
  2. Decodes Base64 → Uint8Array (binary data)
  3. Uses Web Audio API AudioContext.decodeAudioData() to convert binary → AudioBuffer
  4. Implements AudioQueue system for seamless multi-segment playback
  5. Routes audio through AnalyserNode for real-time frequency analysis
  6. Connects to main.ts/orb.ts animation loop for visual feedback
  7. As AI speaks, the Orb visuals pulse/dance to audio frequencies in real-time

Backend Responsibility:
  - Generate high-quality audio that's compatible with Web Audio API
  - Encode as Base64 for WebSocket transmission
  - Send audio metadata (format, sample rate) for proper decoding
  - Support multiple audio segments for responsive UI
"""

async def generate_audio_base64(text: str) -> Optional[str]:
    """
    Generate audio from text and return as base64 string.
    Priority chain:
      1. ElevenLabs (primary - best quality)
      2. Gemini TTS (Google Cloud TTS - fallback using same API key as image generation)
      3. Deepgram (fallback - reliable alternative)
      4. pyttsx3 (offline fallback - always available)
    """
    if not text or not text.strip():
        print(f"[AUDIO-B64] Empty text", flush=True)
        return None

    # Try ElevenLabs first
    print(f"[AUDIO-B64] Trying ElevenLabs (primary)...", flush=True)
    audio_b64 = await generate_audio_elevenlabs(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] ElevenLabs success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] ElevenLabs TTS generated audio successfully")
        return audio_b64

    # ElevenLabs failed - try Gemini TTS (Google Cloud TTS)
    print(f"[AUDIO-B64] ElevenLabs failed - trying Gemini TTS (Google Cloud fallback)...", flush=True)
    logger.warning("[FALLBACK] ElevenLabs TTS failed, attempting Gemini TTS fallback")
    audio_b64 = await generate_audio_gemini(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] Gemini TTS success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] Gemini TTS fallback generated audio successfully")
        return audio_b64

    # Gemini TTS failed - try Deepgram
    print(f"[AUDIO-B64] Gemini TTS failed - trying Deepgram (secondary fallback)...", flush=True)
    logger.warning("[FALLBACK] Gemini TTS failed, attempting Deepgram fallback")
    audio_b64 = await generate_audio_deepgram(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] Deepgram success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] Deepgram TTS fallback generated audio successfully")
        return audio_b64

    # Both cloud providers failed - try pyttsx3 (offline)
    print(f"[AUDIO-B64] All cloud providers failed - trying pyttsx3 (offline)...", flush=True)
    logger.warning("[FALLBACK] All cloud providers failed, attempting pyttsx3 fallback")
    audio_b64_pyttsx3 = await generate_audio_pyttsx3(text)

    if audio_b64_pyttsx3:
        print(f"[AUDIO-B64] [OK] pyttsx3 success! Returning {len(audio_b64_pyttsx3)} chars", flush=True)
        logger.info("[OK] pyttsx3 offline TTS fallback generated audio successfully")
        return audio_b64_pyttsx3

    # All providers failed
    print(f"[AUDIO-B64] [FAIL] All TTS providers failed - no audio", flush=True)
    logger.error("[ERROR] All TTS providers failed - no audio generated")
    return None


def _generate_tts_audio(text: str) -> Optional[bytes]:
    """
    Generate TTS audio optimized for Web Audio API.
    Returns audio bytes in PCM format compatible with AudioContext.decodeAudioData().
    """
    try:
        if not state.tts:
            return None
        
        # Queue the audio generation
        state.tts.process_message(text)
        
        # Collect audio from queue with proper buffering
        audio_data = b""
        import queue
        
        # Wait for audio to be generated
        max_iterations = 300  # ~30 seconds with 100ms waits
        iterations = 0
        
        while iterations < max_iterations:
            try:
                buffer = state.tts.audio_queue.get(timeout=0.1)
                audio_data += buffer
                state.tts.audio_queue.task_done()
                iterations = 0  # Reset on successful read
            except queue.Empty:
                iterations += 1
                # Every 10 iterations, check if speaking is done
                if iterations % 10 == 0 and not state.tts.is_speaking:
                    break
            except Exception:
                break
        
        if audio_data:
            logger.debug(f"TTS generated {len(audio_data)} bytes of audio")
            return audio_data
        else:
            logger.warning("TTS generated no audio")
            return None
    
    except Exception as e:
        logger.error(f"Error in _generate_tts_audio: {e}")
        return None


# ============================================================================
# MESSAGE HANDLER
# ============================================================================

async def handle_transcript_message(websocket: WebSocket,message: Dict[str,Any]):
    text=str(message.get('text') or '').strip()
    if not text or not message.get('isFinal'):return
    client=ws_manager.client_id(websocket);source=message.get('source','voice');rid=str(message.get('request_id') or uuid.uuid4().hex)
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}',rid):return
    if source=='news_widget':
        await ws_manager.send_to_client(websocket,{'type':'typed_transcript_status','request_id':rid,'source':source,'status':'accepted'})
        await _run_serp_widget('news',{'query':message.get('display_query') or text},rid,client)
        return
    session=state.live_sessions.get(websocket)
    if not session:
        await _start_gemini_voice(websocket,guest=speaker_recognition.status()['enabled'])
        session=state.live_sessions.get(websocket)
    if session:await session.send_text(text,request_id=rid)
    else:await ws_manager.send_to_client(websocket,{'type':'live_error','message':'Live conversation unavailable; your draft is preserved.'})


async def _legacy_handle_transcript_message(websocket: WebSocket, message: Dict[str, Any]):
    """
    Handle incoming transcript from frontend.
    Pipeline:
      1. Receive transcript from frontend (voice.ts)
      2. Clean & correct speech-to-text errors
      3. Save user input to memory
      4. Pass to Aegis AI for processing
      5. Save AI response to memory (nova_ai_memory.json)
      6. Generate audio via Cartesia TTS
      7. Send response_text + response_audio to frontend
    """
    raw_text = message.get("text", "")
    if not isinstance(raw_text, str):
        raise HTTPException(status_code=400, detail="text must be a string")
    text = raw_text.strip()
    is_final = message.get("isFinal", False)
    client_id = ws_manager.client_id(websocket)
    transcript_request_id = str(message.get("request_id") or "").strip()
    transcript_source = str(message.get("source") or "voice").strip().lower()

    async def send_typed_status(status: str, detail: str = "") -> None:
        if transcript_source not in {"search_widget", "news_widget"}:
            return
        await ws_manager.send_to_client(websocket, {
            "type": "typed_transcript_status",
            "request_id": transcript_request_id,
            "source": transcript_source,
            "status": status,
            "detail": detail,
        })
    
    if not raw_text or not is_final:
        return
    
    # Step 1: Apply speech corrections
    text = apply_speech_corrections(raw_text)
    
    if raw_text != text:
        logger.info(f"[FIX] Speech corrected: '{raw_text}' -> '{text}'")
    
    transcript_hash = hash(text)
    owns_processing_slot = False
    try:
        # Prevent overlapping requests
        if state.is_processing:
            logger.warning("[WARNING] Already processing a request, ignoring new input")
            await send_typed_status("busy", "Astra is finishing another request. Try again in a moment.")
            return

        if transcript_hash in state.processed_transcripts:
            logger.warning("[WARNING] Duplicate in-flight transcript detected, ignoring")
            await send_typed_status("busy", "This search is already being processed.")
            return
        state.processed_transcripts.add(transcript_hash)
        
        state.is_processing = True
        owns_processing_slot = True
        state.current_client_id = client_id
        state.current_transcript_request_id = transcript_request_id
        state.current_transcript_source = transcript_source
        state.begin_widget_turn(client_id)
        await send_typed_status("accepted")
        logger.info(f"\n{'='*60}")
        logger.info(f"  [VOICE PIPELINE START]")
        logger.info(f"  User Input: {text}")
        logger.info(f"{'='*60}\n")
        
        # Send thinking status immediately
        await ws_manager.send_to_client(websocket, {
            "type": "status",
            "state": "thinking",
            "message": "Processing your request..."
        })
        
        # The legacy conversation stack is initialized only when Gemini has
        # fallen back (or a legacy widget flow explicitly routes here).
        if not await state.ensure_aegis_ai():
            logger.error("[ERROR] Aegis AI process not running")
            await ws_manager.send_to_client(websocket, {
                "type": "response",
                "text": "Sorry, the AI system is not available. Please restart the server.",
                "audio": None,
                "error": True
            })
            await send_typed_status("failed", "The AI system is not available.")
            state.is_processing = False
            return

        # Aegis's semantic planner now chooses all widget and durable-task actions.
        # The legacy regex resolvers remain available for compatibility tests but
        # are intentionally not part of the live voice pipeline.
        logger.info(f"  [1/4] Preparing Aegis AI turn...")
        raw_context = state.widget_connections.context_payload_for(client_id, consume_results=True)
        if isinstance(raw_context,dict): raw_context["nova_ui"]=ui_context(client_id)
        search_already_completed = False
        response_text: Optional[str] = None
        if transcript_source in {"search_widget", "news_widget"}:
            display_query = str(message.get("display_query") or "").strip()
            if not display_query:
                display_query = extract_search_query(text) or text
            elif is_explicit_search_request(display_query):
                display_query = extract_search_query(display_query) or display_query
            widget_name = "news" if transcript_source == "news_widget" else "search"
            await _run_serp_widget(widget_name, {
                "query": display_query,
                "continuation": message.get("continuation") is True,
                "research_id": str(message.get("research_id") or ""),
                "layout_manifest": message.get("layout_manifest") if isinstance(message.get("layout_manifest"), dict) else None,
            }, transcript_request_id, client_id)
            completed = dict((state.news_widget_context if widget_name == "news" else state.search_widget_context).get("current") or {})
            completed_results = completed.get("related_stories") if widget_name == "news" else completed.get("results")
            search_already_completed = True
            answer = sanitize_search_answer(str(completed.get("answer") or (completed.get("primary_story") or {}).get("summary") or "")).strip()
            if answer:
                response_text = f"Here's what I found about {display_query}: {answer[:600]}"
            else:
                response_text = f"I searched for {display_query}, but the live sources did not return an answer."
        else:
            prepared_context = await state.context_preprocessor.prepare(
                raw_context, request_id=transcript_request_id
            ) if raw_context else None
            widget_intent = bool(re.search(
                r"\b(widget|open|close|show|hide|move|resize|connect|disconnect|search|weather|note|task|calendar|image|theme)\b",
                text,
                flags=re.IGNORECASE,
            ))
            response_text = await state.aegis_ai.send_message(
                text,
                timeout=45.0,
                request_id=transcript_request_id,
                widget_context=prepared_context.context if prepared_context else {},
                source=transcript_source,
                skip_widget_planner=not widget_intent,
                search_already_completed=search_already_completed,
            )

        if response_text and '"widget"' in response_text and '"command"' in response_text:
            logger.error("[AEGIS-AI] Suppressed raw widget-command JSON from conversational output")
            response_text = "I couldn't complete that widget request cleanly. Please try it once more."
        
        if not response_text:
            logger.error("  [FAILED] No response from Aegis AI subprocess")
            await ws_manager.send_to_client(websocket, {
                "type": "response",
                "text": "Sorry, I didn't get a response from Aegis AI. Please try again.",
                "audio": None,
                "error": True
            })
            await send_typed_status("failed", "Astra did not return a response.")
            state.is_processing = False
            return

        action_results = await state.await_widget_turn(client_id)
        if action_results:
            failures = [item for item in action_results if str(item.get("status") or "").lower() == "failed"]
            completed = [item for item in action_results if str(item.get("status") or "").lower() == "completed"]
            if failures:
                detail = str(failures[0].get("detail") or "The widget could not complete the action.").strip()
                response_text = f"{response_text.rstrip()} Executor update: {detail}"
            elif completed:
                details = [str(item.get("detail") or "").strip() for item in completed]
                details = [item for item in details if item]
                if details:
                    response_text = f"{response_text.rstrip()} Completed: {' '.join(details[:3])}"
        
        weather_widget_payload = _parse_weather_widget_response(response_text)
        if weather_widget_payload:
            await ws_manager.send_to_client(
                websocket,
                _send_widget_control(
                    websocket,
                    widget="weather",
                    command="show_weather",
                    query=str(weather_widget_payload.get("location") or ""),
                    extra_payload=weather_widget_payload,
                ),
            )
            response_text = _build_weather_spoken_summary(
                str(weather_widget_payload.get("location") or "that location"),
                weather_widget_payload.get("weather_data") or {},
            )

        logger.info(f"  [2/4] Aegis AI Response: {response_text}\n")
        
        # DISABLE MICROPHONE before starting TTS to prevent feedback loop
        logger.info(f"  [2.5/4] Disabling microphone (preventing feedback loop)...")
        await ws_manager.send_to_client(websocket, {
            "type": "mic_control",
            "action": "disable",
            "reason": "AI voice playing - prevent microphone feedback"
        })
        
        # Send response text immediately
        logger.info(f"  [3/4] Generating audio via ElevenLabs TTS...")
        logger.info(f"       Text length: {len(response_text)} chars")
        audio_b64 = await generate_audio_base64(response_text)
        
        # Step 3: Send audio once ready
        if audio_b64:
            logger.info(f"  [4/4] Audio generated ({len(audio_b64)} chars base64)")
            await ws_manager.send_to_client(websocket, {
                "type": "response_audio",
                "audio": audio_b64,
                "format": "mp3",
                "timestamp": datetime.now().isoformat()
            })
            logger.info(f"\n{'='*60}")
            logger.info(f"  [VOICE PIPELINE COMPLETE]")
            logger.info(f"  Voice: Generated and sent to frontend")
            logger.info(f"{'='*60}\n")
            
            # Estimate audio duration (rough: ~150 chars per second)
            # Add buffer to ensure audio finishes before re-enabling mic
            estimated_duration = max(2, len(response_text) / 150.0)
            logger.info(f"  Waiting for audio playback (~{estimated_duration:.1f}s)...")
            await asyncio.sleep(estimated_duration + 0.5)
            
            # RE-ENABLE MICROPHONE after audio finishes
            logger.info(f"  Audio finished - re-enabling microphone")
            await ws_manager.send_to_client(websocket, {
                "type": "mic_control",
                "action": "enable",
                "reason": "AI voice finished - microphone available"
            })
        else:
            logger.error(f"  [4/4] TTS generation FAILED - no audio")
            # Still re-enable mic even if TTS failed
            await ws_manager.send_to_client(websocket, {
                "type": "mic_control",
                "action": "enable",
                "reason": "TTS failed - re-enabling microphone"
            })
            await ws_manager.send_to_client(websocket, {
                "type": "response_audio",
                "audio": None,
                "format": "mp3",
                "timestamp": datetime.now().isoformat()
            })
        
        # Send completion status
        await asyncio.sleep(0.2)
        logger.info(f"[OK] [COMPLETE] Response pipeline finished\n")
        await ws_manager.send_to_client(websocket, {
            "type": "status",
            "state": "idle",
            "message": "Ready for next command"
        })
    
    except Exception as e:
        logger.error(f"[ERROR] Error handling transcript: {e}")
        import traceback
        traceback.print_exc()
        
        await ws_manager.send_to_client(websocket, {
            "type": "response",
            "text": f"Error processing request: {str(e)}",
            "audio": None,
            "error": True
        })
        await send_typed_status("failed", str(e))
    
    finally:
        if owns_processing_slot:
            state.processed_transcripts.discard(transcript_hash)
            if state.current_client_id == client_id:
                state.current_client_id = None
                state.current_transcript_request_id = ""
                state.current_transcript_source = ""
            state.is_processing = False


# ============================================================================
# LIFESPAN CONTEXT
# =================================================  ,, ===========================

async def memory_change_loop():
    previous=None
    while True:
        try:
            snapshot=await asyncio.to_thread(state.live_memory.notification_snapshot)
            if previous is not None:
                for rid in snapshot.keys() | previous.keys():
                    old=previous.get(rid);new=snapshot.get(rid)
                    if old!=new:
                        for socket in list(ws_manager.connections):
                            live=state.live_sessions.get(socket)
                            if live and getattr(live,'guest',False):continue
                            await ws_manager.send_to_client(socket,{"type":"memory_changed",**(new or old),"action":"removed" if new is None else "created" if old is None else "updated"})
            from astra_ai.memory.globe_projection import projection
            for socket in list(ws_manager.connections):
                client_id=ws_manager.client_id(socket);live=state.live_sessions.get(socket)
                manager=guest_memory if live and getattr(live,'guest',False) else state.live_memory
                profile=str(getattr(live,'profile_id','')) if manager is guest_memory else ''
                project=str(getattr(live,'project_id','')) if manager is guest_memory else ''
                globe=await asyncio.to_thread(projection,manager,profile,project)
                cache=getattr(ws_manager,'globe_revisions',{});old=cache.get(client_id)
                if old!=globe['revision']:
                    cache[client_id]=globe['revision'];ws_manager.globe_revisions=cache
                    await ws_manager.send_to_client(socket,{'type':'memory_globe_changed','revision':globe['revision']})
            if int(time.time())%10==0:
                for socket in list(ws_manager.connections):await check_operation_notices(socket)
            previous=snapshot
        except asyncio.CancelledError:raise
        except Exception:logger.warning("Memory change notifications temporarily unavailable")
        await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan (startup/shutdown)
    """
    # Startup
    logger.info("="*70)
    logger.info("AEGIS SERVER STARTUP")
    logger.info("="*70)
    logger.info(f"[->] Starting server on {ServerConfig.HOST}:{ServerConfig.PORT}")
    logger.info(f"[NET] WebSocket endpoint: ws://localhost:{ServerConfig.PORT}{ServerConfig.WS_ENDPOINT}")
    logger.info(f"[CONNECT] REST API: http://localhost:{ServerConfig.PORT}")
    
    await state.initialize()
    from astra_ai.memory.semantic_recall import GeminiEmbeddings,validated_mode
    await asyncio.to_thread(state.live_memory.prepare_intelligence)
    semantic_mode=await asyncio.to_thread(validated_mode,state.live_memory,lambda:state.gemini_api_key)
    try:embedding_budget=int(os.getenv('NOVA_EMBEDDING_DAILY_REQUESTS','40'))
    except ValueError:embedding_budget=40
    await asyncio.to_thread(state.live_memory.configure_semantic,GeminiEmbeddings(lambda:state.gemini_api_key),semantic_mode,embedding_budget)
    await asyncio.to_thread(state.live_memory.clock().observe,'runtime_start')
    from astra_ai.memory.Mem0_ai_organizer import AIOrganizer
    state.memory_organizer=AIOrganizer({'key_provider':_get_groq_api_key,'conversation_busy':lambda:any(s._speech_active or s._response_pending for s in state.live_sessions.values())},memory_system=state.live_memory)
    from astra_ai.core.background_budget import BackgroundBudget
    from astra_ai.core.background_model import BackgroundModel
    from astra_ai.core.research_learning import ResearchLearning
    from astra_ai.core.learned_capabilities import LearnedCapabilities
    global learning_service,capability_service,background_budget,learning_warm_task,background_model,research_model,research_provider_settings
    learned_root=Path(__file__).resolve().parents[2]/'core'/'learned'
    background_budget=BackgroundBudget(runtime_paths.usage/'background_budget.json')
    background_model=BackgroundModel(_get_groq_api_key,background_budget)
    from astra_ai.core.research_model import resume_legacy_research_waits,requested_research_budget,resume_research_budget_waits,resume_published_research,research_budget_path
    research_budget=requested_research_budget(research_budget_path(runtime_paths.usage,_get_env_value),background_budget.slot,_get_env_value)
    from astra_ai.core.research_openai import configured_research_model
    research_model=configured_research_model(_get_env_value,lambda:state.gemini_api_key,research_budget,MODEL_STATUS,TEXT_PREFERRED)
    from astra_ai.ui.backend.research_provider_settings import ResearchProviderSettings
    def install_research_writer(writer):
        global research_model
        research_model=writer
    research_provider_settings=ResearchProviderSettings(ROOT_ENV_FILE,runtime_paths.usage,_get_env_value,
        lambda:state.gemini_api_key,background_budget.slot,lambda:research_model,install_research_writer,LIVE_MODEL)
    await asyncio.to_thread(resume_legacy_research_waits,action_jobs)
    research_artifacts,_=get_research_services()
    await asyncio.to_thread(research_artifacts.snapshot)
    await asyncio.to_thread(resume_published_research,action_jobs,research_artifacts)
    await asyncio.to_thread(resume_research_budget_waits,action_jobs,research_artifacts,research_budget,provider_key=research_model.key_provider(),budget_scope=research_model.budget_scope,allow_fallback=hasattr(research_model,'fallback_key') and bool(research_model.fallback_key()))
    state.memory_organizer.background_budget=background_budget
    from astra_ai.memory.organizer_runtime import OrganizationReview, GeminiMergeReviewer
    state.memory_organizer.organization_review=OrganizationReview(state.live_memory,GeminiMergeReviewer(lambda:state.gemini_api_key,background_budget))
    learning_service=ResearchLearning(learned_root,state.live_memory,action_jobs,_background_search,background_model.summarize)
    capability_service=LearnedCapabilities(learned_root,Path(__file__).resolve().parents[3],state.live_memory,action_jobs,_dispatch_aegis_tool,background_model)
    await asyncio.to_thread(learning_service.initialize);await asyncio.to_thread(capability_service.initialize)
    event_loop=asyncio.get_running_loop()
    def learned_turn(sid,tid,profile='',project=''):
        event_loop.call_soon_threadsafe(lambda:asyncio.create_task(learning_service.observe_turn(sid,tid,profile,project)))
    state.live_memory._learning_listener=learned_turn
    action_jobs.diagnose=_diagnose_failed_job
    async def warm_isolation():
        async with capability_service.cpu:await asyncio.to_thread(capability_service.sandbox.verify)
    learning_warm_task=asyncio.create_task(warm_isolation(),name='learned-worker-isolation-check')
    await asyncio.to_thread(state.memory_organizer.start_monitoring)
    await action_jobs.start()
    speaker_warm_task=asyncio.create_task(speaker_recognition.prepare(),name="local-speaker-warmup") if speaker_recognition.status()["enabled"] else None
    # Conversation uses the existing Live session; no second text model is probed.
    memory_notification_task=asyncio.create_task(memory_change_loop(),name="nova-memory-changes")
    calendar_store.initialize()
    task_store.initialize()

    from astra_ai.core.action_jobs import TaskCoordinator
    async def current_run_state(identifier):
        return (await asyncio.to_thread(task_store.get_run,'local',identifier))['status']
    coordinator=TaskCoordinator(action_jobs,background_model,ALL_AEGIS_TOOLS,
        busy=lambda:any(s._speech_active or s._response_pending for s in state.live_sessions.values()),run_state=current_run_state)
    async def execute_aegis_task(task: Dict[str, Any], emit):
        # Bind the saved owner task to a current matching connection, without
        # starting the standalone legacy model, speech stack or memory writer.
        metadata=dict(task.get('metadata') or {})
        for socket in ws_manager.connections:
            live=state.live_sessions.get(socket)
            if getattr(live,'guest',False):continue
            if (getattr(live,'profile_id',''),getattr(live,'project_id',''))==(metadata.get('profile_id',''),metadata.get('project_id','')):
                client=ws_manager.client_id(socket)
                metadata.update(client_id=client,session_id=getattr(live,'session_id',CHAT_SESSIONS.get(client,'')));break
        return await coordinator.run({**task,'metadata':metadata},emit)

    task_orchestrator.set_executor(execute_aegis_task)
    await task_orchestrator.start()
    calendar_reminder_task = asyncio.create_task(reminder_loop(), name="astra-calendar-reminders")
    
    try:
        await asyncio.to_thread(state.live_memory.save_fact,"system_awareness","backend_initialized","Backend initialized successfully",source="application",capture_source="verified_application_event",evidence="Verified startup completed",correction=True)
    except Exception:logger.exception("Runtime memory observation unavailable; backend remains usable")
    logger.info("[TASK] Server ready to accept connections")
    logger.info("="*70)
    
    await workspace_service.start()
    yield
    await collaboration_service.stop()
    await workspace_service.stop()
    
    # Shutdown
    await asyncio.to_thread(state.live_memory.clock().observe,'runtime_stop')
    await asyncio.to_thread(state.memory_organizer.stop_monitoring)
    if speaker_warm_task and not speaker_warm_task.done():
        speaker_warm_task.cancel()
        try:await speaker_warm_task
        except asyncio.CancelledError:pass
    state.live_memory._learning_listener=None
    if learning_warm_task:
        await asyncio.gather(learning_warm_task,return_exceptions=True)
    await action_jobs.stop()
    logger.info("="*70)
    logger.info("AEGIS SERVER SHUTDOWN")
    logger.info("="*70)
    memory_notification_task.cancel()
    try:await memory_notification_task
    except asyncio.CancelledError:pass
    try:await asyncio.to_thread(state.live_memory.flush)
    except Exception:logger.exception("Memory flush failed; pending operations preserved")
    calendar_reminder_task.cancel()
    try:
        await calendar_reminder_task
    except asyncio.CancelledError:
        pass
    await task_orchestrator.stop()
    await state.shutdown()
    logger.info("="*70)


# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="AEGIS Server",
    description="WebSocket-based AI Backend for Aegis AI",
    version="1.0.0",
    lifespan=lifespan
)

# Credentialed wildcard CORS is unsafe and invalid in browsers. Same-origin
# production requests need no CORS; these defaults only support local Vite use.
_allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ASTRA_ALLOWED_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type", "Idempotency-Key", "If-Match",
        "X-Astra-Webhook-Token", "X-Astra-Webhook-Timestamp", "X-Astra-Webhook-Nonce",
    ],
)

app.include_router(calendar_router)
app.include_router(task_router)
app.include_router(task_webhook_router)

theme_store = ThemeStore(runtime_paths.widget("theme"))
from astra_ai.ui.backend.workspace_api import WorkspaceService
workspace_service=WorkspaceService(app,ws_manager,state,UI_CONTEXTS,CHAT_SESSIONS,get_research_services,lambda request:_learning_context(request),theme_store)
from astra_ai.ui.backend.collaboration import CollaborationService
collaboration_service=CollaborationService(app,workspace_service)


def theme_response(data: Any = None, error: Optional[str] = None) -> Dict[str, Any]:
    return {"success": error is None, "data": data, "error": error}


def raise_theme_error(exc: Exception) -> None:
    if isinstance(exc, ThemeStateError):
        raise HTTPException(status_code=exc.status_code, detail=theme_response(error=str(exc))) from exc
    logger.exception("Theme API failure")
    raise HTTPException(status_code=500, detail=theme_response(error="theme storage operation failed")) from exc


@app.get("/api/themes/startup")
async def startup_theme():
    try:
        return theme_response(theme_store.startup())
    except Exception as exc:
        raise_theme_error(exc)


@app.get("/api/themes")
async def list_themes():
    try:
        return theme_response(theme_store.list())
    except Exception as exc:
        raise_theme_error(exc)


@app.post("/api/themes")
async def create_theme(payload: Dict[str, Any]):
    try:
        return theme_response(theme_store.create(payload))
    except Exception as exc:
        raise_theme_error(exc)


@app.put("/api/themes/default")
async def set_default_theme(payload: Dict[str, Any]):
    try:
        return theme_response({"defaultThemeId": theme_store.set_default(str(payload.get("themeId", "")))})
    except Exception as exc:
        raise_theme_error(exc)


@app.post("/api/themes/import")
async def import_themes(payload: Dict[str, Any]):
    try:
        return theme_response(theme_store.import_items(payload))
    except Exception as exc:
        raise_theme_error(exc)


@app.get("/api/themes/export")
async def export_themes():
    try:
        return theme_response(theme_store.export_all())
    except Exception as exc:
        raise_theme_error(exc)


@app.get("/api/fonts/custom")
async def custom_theme_fonts():
    try:
        return theme_response(list_custom_fonts(Path(__file__).resolve().parent.parent / "frontend"))
    except Exception as exc:
        raise_theme_error(exc)


@app.get("/api/themes/{theme_id}/export")
async def export_theme(theme_id: str):
    try:
        return theme_response(theme_store.get(theme_id))
    except Exception as exc:
        raise_theme_error(exc)


@app.post("/api/themes/{theme_id}/duplicate")
async def duplicate_theme(theme_id: str, payload: Optional[Dict[str, Any]] = None):
    try:
        return theme_response(theme_store.duplicate(theme_id, (payload or {}).get("name")))
    except Exception as exc:
        raise_theme_error(exc)


@app.put("/api/themes/{theme_id}")
async def update_theme(theme_id: str, payload: Dict[str, Any]):
    try:
        return theme_response(theme_store.update(theme_id, payload))
    except Exception as exc:
        raise_theme_error(exc)


@app.delete("/api/themes/{theme_id}")
async def delete_theme(theme_id: str, replacement: Optional[str] = None):
    try:
        theme_store.delete(theme_id, replacement)
        return theme_response({"deletedThemeId": theme_id})
    except Exception as exc:
        raise_theme_error(exc)

# Note: Frontend is served by Vite dev server on port 5173
# In production, frontend would be built to /dist and served separately
# Backend only provides WebSocket API at /ws/voice
# Mounting StaticFiles at "/" would interfere with WebSocket connections,
# so we don't mount static files here in dev mode


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

async def _activate_legacy_voice(
    websocket: WebSocket,
    *,
    reason: str,
    replay_text: str = "",
    gemini_audio_started: bool = False,
) -> None:
    """Switch one client to the legacy stack for the rest of its mic session."""
    failed_session = state.live_sessions.pop(websocket, None)
    state.live_providers[websocket] = "legacy"
    if failed_session:
        asyncio.create_task(failed_session.close())

    await ws_manager.send_to_client(websocket, {
        "type": "live_status",
        "provider": "legacy",
        "state": "connecting",
        "fallback": True,
        "reason": reason,
    })
    ready = await state.ensure_aegis_ai()
    await ws_manager.send_to_client(websocket, {
        "type": "live_status",
        "provider": "legacy",
        "state": "listening" if ready else "error",
        "fallback": True,
        "reason": reason,
    })
    if ready and replay_text.strip() and not gemini_audio_started:
        await handle_transcript_message(websocket, {
            "type": "transcript",
            "text": replay_text.strip(),
            "isFinal": True,
            "source": "gemini_fallback",
        })


async def _memory_view_action(client_id,arguments):
    from astra_ai.memory.globe_projection import projection
    from astra_ai.memory.category_registry import resolve
    import math
    socket=ws_manager.websocket_for(client_id)
    if socket is None:return {'status':'waiting_for_ui'}
    live=state.live_sessions.get(socket)
    if live and live.guest:return {'status':'rejected','reason':'owner_view_required'}
    profile=str(getattr(live,'profile_id',''));project=str(getattr(live,'project_id',''));args=dict(arguments)
    allowed={'open','category','session','inspect','search','filter','focus','zoom','pan','rotate','highlight','reset','rail','entity','day','topic','expand','pause_rotation','resume_rotation'}
    if args.get('action') not in allowed:return {'status':'rejected','reason':'unsupported_view_action'}
    for field in ('x','y','zoom','yaw','pitch'):
        if field in args:
            try:args[field]=float(args[field])
            except (TypeError,ValueError):return {'status':'rejected','reason':'invalid_coordinate'}
            if not math.isfinite(args[field]):return {'status':'rejected','reason':'invalid_coordinate'}
    if args.get('rail') and args['rail'] not in {'conversation','library','sessions','approvals','tasks'}:return {'status':'rejected','reason':'invalid_rail'}
    args.setdefault('guided',True)
    if getattr(live,'_internal_notice',False):args['guided']=True
    snap=await asyncio.to_thread(projection,state.live_memory,profile,project)
    if args.get('category'):
        category=await asyncio.to_thread(lambda:resolve(state.live_memory.load(),args['category'],profile,project,True))
        topic=next((t for t in snap['raw']['visual_topics'] if t['id']==args['category']),None)
        if not category and not topic:return {'status':'not_found','reason':'category_unavailable'}
        args['category']=(category or topic)['id']
    known=set(snap['records'])|{'cat:'+t['id'] for t in snap['raw']['visual_topics']}|{'cat:'+cid for cid in snap['raw']['category_definitions']}|{'ent:'+eid for eid in snap['raw']['entity_graph']['entities']}
    def normalize(identifier):
        if identifier.startswith('category:'):return 'cat:'+identifier[9:]
        if identifier in snap['raw']['entity_graph']['entities']:return 'ent:'+identifier
        return identifier
    for field in ('record_id','focus_id'):
        if args.get(field):
            args[field]=normalize(str(args[field]))
            if args[field] not in known:return {'status':'not_found','reason':'target_unavailable'}
    if args.get('record_ids'):
        if not isinstance(args['record_ids'],list) or len(args['record_ids'])>100 or any(not isinstance(i,str) or normalize(i) not in known for i in args['record_ids']):return {'status':'rejected','reason':'invalid_highlight_ids'}
        args['record_ids']=[normalize(i) for i in args['record_ids']]
    if args.get('query') and args['action'] in {'inspect','focus'} and not (args.get('record_id') or args.get('focus_id')):
        matches=[r for r in snap['records'].values() if str(args['query']).casefold() in (str(r.get('key',''))+' '+str(r.get('value',''))).casefold()][:6]
        if len(matches)!=1:return {'status':'ambiguous' if matches else 'not_found','matches':[{'id':r['id'],'label':r.get('key')} for r in matches]}
        args['record_id']=matches[0]['id']
    request_id=uuid.uuid4().hex;state.register_widget_action(client_id,request_id)
    await ws_manager.send_to_client_id(client_id,{'type':'memory_view_action','request_id':request_id,**args})
    return await state.await_widget_action(client_id,request_id,timeout=5) or {'status':'failed','reason':'memory_view_not_acknowledged'}

from astra_ai.ui.backend.speaker_recognition import SpeakerRecognition
from astra_ai.memory.shared_memory import SharedMemory
speaker_recognition=SpeakerRecognition(runtime_paths.system/"speaker_profile.json")
guest_memory=SharedMemory(memory_path=runtime_paths.system/"guest-memory"/"long_term.json",transcript_path=runtime_paths.system/"guest-memory"/"conversation.json")
speaker_buffers={}
async def _finish_speaker_audio(websocket):
    pcm=bytes(speaker_buffers.pop(websocket,b""))
    if not pcm:return
    result=await speaker_recognition.classify(pcm) if len(pcm)>=32000 else {"state":"uncertain","reason":"speech_too_short"}
    guest=result["state"]!="matched" or not result.get("owner",False)
    speaker_profile=(result.get("profile_id") or "") if result["state"]=="matched" and guest else ""
    live=state.live_sessions.get(websocket)
    expected_profile=("speaker-"+speaker_profile) if speaker_profile else "guest-"+ws_manager.client_id(websocket)
    if live and (live.guest!=guest or guest and live.profile_id!=expected_profile):await _start_gemini_voice(websocket,guest=guest,speaker_profile=speaker_profile)
    await ws_manager.send_to_client(websocket,{"type":"speaker_status",**result,"guest":guest})
    live=state.live_sessions.get(websocket)
    if live:
        await live.begin_audio();await live.send_audio(pcm)

@app.get("/api/voice/profile")
async def voice_profile_status():return await asyncio.to_thread(speaker_recognition.status)
@app.post("/api/voice/profile")
async def voice_profile_setting(payload:Dict[str,Any]):
    result=await asyncio.to_thread(speaker_recognition.setting,payload.get("enabled"),payload.get("delete") is True,str(payload.get("profile_id") or ""))
    for websocket in list(state.live_sessions):
        await ws_manager.send_to_client(websocket,{"type":"live_interrupted"})
        await _start_gemini_voice(websocket,guest=result["enabled"])
    return result
@app.post("/api/voice/prepare")
async def voice_profile_prepare():return await speaker_recognition.prepare()
@app.post("/api/voice/enroll")
async def voice_profile_enroll(payload:Dict[str,Any]):return await speaker_recognition.enroll(payload.get("samples"),str(payload.get("profile_id") or ""),str(payload.get("name") or ""))
@app.post("/api/conversations")
async def conversation_operation(payload:Dict[str,Any]):
    args=dict(payload);action=args.pop("action","list")
    try:return await asyncio.to_thread(state.live_memory.session_action,action,**args)
    except (TypeError,ValueError):raise HTTPException(422,"Invalid conversation request")
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"Conversation storage unavailable; retry without losing your draft."})

_destructive_confirmations={}

def _destructive_revision(name,arguments,context):
    from astra_ai.memory.shared_memory import stable,canonical
    target=str(arguments.get('note_id') or arguments.get('record_id') or arguments.get('event_id') or arguments.get('id') or arguments.get('path') or '')
    if name=='research_artifact_action':
        artifacts,_=get_research_services();snapshot=artifacts.deletion_preview_many(arguments['research_ids'],context) if arguments.get('research_ids') else artifacts.deletion_preview(str(arguments.get('research_id','')),context)
    elif name=='notes_action':snapshot=state.get_note_by_id(target) if target else state.get_notes_state()
    elif name in {'memory_action','transcript_action','delete_memory','delete_search_memory'}:snapshot=state.live_memory.load().get('_meta',{})
    else:snapshot={'ui':state.widget_connections.context_payload_for(context.get('client_id','')).get('connected_widgets',{}),'target':target}
    return stable(name,canonical(arguments),canonical(snapshot),context.get('profile_id',''),context.get('project_id',''),context.get('session_id',''))

async def _confirm_destructive(name,arguments,context):
    action=str(arguments.get('action',''));destructive=bool(re.search(r'(^|_)(delete|forget|erase|reset|purge|clear_all|clear_draft|discard)(_|$)',action) or name in {'delete_file','delete_memory','delete_search_memory'})
    if not destructive:return None
    if context.get('guest') or context.get('background') or not context.get('client_id'):return {'status':'rejected','reason':'attributed_owner_confirmation_required'}
    revision=await asyncio.to_thread(_destructive_revision,name,arguments,context);key=(context['client_id'],revision)
    entry=_destructive_confirmations.get(key)
    if entry and time.monotonic()-entry['created']<120:
        if entry['state']=='approved':
            if entry.get('used_by') not in {None,context.get('operation_id')}:return {'status':'rejected','reason':'confirmation_already_consumed'}
            entry['used_by']=context.get('operation_id');return None
        return {'status':'rejected' if entry['state']=='rejected' else 'waiting_for_ui','reason':'user_rejected' if entry['state']=='rejected' else 'Owner confirmation is pending; no data changed.'}
    request_id='confirm-'+uuid.uuid4().hex
    _destructive_confirmations[key]={'created':time.monotonic(),'state':'waiting','request_id':request_id}
    if len(_destructive_confirmations)>200:
        for old in list(_destructive_confirmations)[:50]:_destructive_confirmations.pop(old,None)
    state.register_widget_action(context['client_id'],request_id)
    await ws_manager.send_to_client_id(context['client_id'],{'type':'application_confirmation','request_id':request_id,'revision':revision,'title':'Remove research from history? You can restore it later.' if name=='research_artifact_action' else name+': '+action,'target':str(arguments.get('target_title') or arguments.get('research_id') or arguments.get('note_id') or arguments.get('record_id') or arguments.get('event_id') or arguments.get('id') or arguments.get('path') or 'selected content')})
    result=await state.await_widget_action(context['client_id'],request_id,timeout=5)
    if result and result.get('confirmed') and await asyncio.to_thread(_destructive_revision,name,arguments,context)==revision:
        _destructive_confirmations[key].update(state='approved',used_by=context.get('operation_id'));return None
    return {'status':'waiting_for_ui','reason':'Owner confirmation is required; no data changed.'}

async def _dispatch_aegis_tool(name,arguments,context,operation_id):
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    window=workspace_service.store().windows.get(context.get('client_id',''),{})
    if window.get('device_id','local')!='local' and name not in {'search_web','research_artifact_action','research_action','recall_memory','recall_conversations','save_memory','save_memory_event','memory_action','time_action','transcript_action'}:
        return {'status':'rejected','reason':'host_only_operation'}
    token=CURRENT_OPERATION.set({**context,'operation_id':operation_id})
    try:return await _dispatch_scoped_aegis_tool(name,arguments,context,operation_id)
    finally:CURRENT_OPERATION.reset(token)

async def _dispatch_scoped_aegis_tool(name,arguments,context,operation_id):
    client_id=context.get("client_id","");sid=context.get("session_id","")
    names={d["name"] for d in ALL_AEGIS_TOOLS}
    if name not in names:return {"status":"rejected","reason":"unregistered_tool"}
    from astra_ai.core.research_intent import admission, collection_action
    from astra_ai.core.search_intent import is_explicit_search_request
    research_actions=arguments.get('actions',[]) if name=='run_action_batch' else [{'name':name,'arguments':arguments}]
    collections=[a for a in research_actions if isinstance(a,dict) and collection_action(a.get('name'),a.get('arguments',{}))]
    if name=='run_action_batch' and any(a.get('name')=='run_action_batch' for a in research_actions if isinstance(a,dict)):
        return {'status':'rejected','reason':'nested_action_batches_not_supported'}
    if len(collections)>1:
        return {'status':'rejected','reason':'combine_research_subjects_in_one_request','summary':'Use one research operation for this user request; do not submit parallel paraphrases.'}
    if collections:
        jobs=globals().get('action_jobs')
        previous=await asyncio.to_thread(jobs.operation,operation_id,context) if jobs and not context.get('job_id') else None
        if previous:
            steps=previous.get('actions',[])
            outcome=(steps[-1].get('result') or {}) if steps else {}
            return {**(outcome if previous.get('state') in {'completed','failed','canceled'} else {'status':previous.get('state','queued')}),'job_id':previous['id'],'duplicate':True}
        artifacts,_=get_research_services()
        candidate=collections[0]
        decision=await asyncio.to_thread(admission,artifacts,candidate['name'],candidate.get('arguments',{}),context)
        if decision and decision.get('status')=='saved_extension_authorized':
            context={**context,'requested_research':True,'research_saved_only':True}
        elif decision and decision.get('status')=='authorized_once':
            approved=decision['confirmed_query']
            context={**context,'requested_research':True,'authorization_quote':context.get('user_text',''),'user_text':approved,'research_user_text':approved}
            if name=='run_action_batch':
                arguments={**arguments,'actions':[{**a,'arguments':{**a.get('arguments',{}),'query':approved,'detail':approved}} if a is candidate else a for a in research_actions]}
            else:arguments={**arguments,'query':approved,'detail':approved}
        elif decision:return decision
        if not context.get('job_id'):context={**context,'dedupe_research_turn':True}
        if not context.get('job_id') and is_explicit_search_request(context.get('user_text','')):
            # Keep every requested subject and freshness requirement. Model
            # keyword suggestions must not replace the user's actual brief.
            brief=context['user_text']
            if name=='run_action_batch':arguments={**arguments,'actions':[{**a,'arguments':{**a.get('arguments',{}),'query':brief,'detail':brief}} if a is candidate else a for a in research_actions]}
            else:arguments={**arguments,'query':brief,'detail':brief}
    if name=='search_web' and not arguments.get('action') or name=='search_widget_action' and arguments.get('action')=='run':
        from astra_ai.core.research_topics import conversational_mode
        arguments={**arguments,'mode':conversational_mode(arguments,context)}
    if context.get("guest") and name not in {d["name"] for d in MEMORY_TOOL_DECLARATIONS+MEMORY_EVENT_TOOL_DECLARATIONS} | {"search_web","get_system_status"}:
        return {"status":"rejected","reason":"Guest context cannot access owner widgets or private UI."}
    selected_document=False
    if context.get('research_id'):
        selected_artifacts,_=get_research_services()
        selected_document=selected_artifacts.get(context['research_id'],context).get('artifact',{}).get('kind')=='documentary'
    research_detail=str(context.get('user_text') or context.get('research_user_text') or arguments.get('query') or '').strip()
    if not selected_document and (name=='search_web' and not arguments.get('action') or name=='search_widget_action' and arguments.get('action')=='run' or name=='research_action' and arguments.get('action')=='request') and not context.get('job_id') and context.get('research_id') and research_followup(research_detail):
        receipt=await continue_research(context['research_id'],context,operation_id,detail=research_detail)
        if receipt.get('job_id'):
            return await _research_collection_receipt(receipt,context)
        return receipt
    if (name in {'search_web','notes_action'} or name=='search_widget_action' and arguments.get('action')=='run') and not context.get('job_id') and action_jobs.task:
        actions=[{'name':name,'arguments':{k:v for k,v in arguments.items() if k!='save_to_notes'}}]
        reserved=None;queue_operation_id=operation_id
        if name=='search_web' and not arguments.get('action') and not arguments.get('research_id'):
            artifacts,_=get_research_services()
            conversational=arguments.get('mode','quick')=='quick' and not context.get('requested_research') and not selected_document
            reserved=await asyncio.to_thread(artifacts.conversation_search,str(arguments.get('query','')),context,str(arguments.get('topic',''))) if conversational else await asyncio.to_thread(artifacts.reserve,str(arguments.get('query','')),arguments.get('mode','quick'),context,operation_id)
            if reserved.get('status')!='ok':return reserved
            await asyncio.to_thread(artifacts.link_turn,reserved['id'],{**context,'referenced_research_id':reserved['id']})
            if conversational:
                from astra_ai.memory.shared_memory import stable,normal
                queue_operation_id=stable('quick-turn',reserved['id'],normal(arguments.get('query','')),int(time.time()//300))
            else:queue_operation_id=reserved['operation_id']
            if reserved.get('followup'):
                actions[0]['arguments']={'action':'topic_followup','research_id':reserved['id'],'query':arguments['query'],'mode':'quick'}
            else:actions[0]['arguments']={k:v for k,v in actions[0]['arguments'].items() if k!='query'}|{'research_id':reserved['id']}
            if selected_document:await asyncio.to_thread(artifacts.request_state,reserved['id'],context,document_parent_id=context['research_id'])
            context={**context,'requested_research':True}
        if name=='search_web' and arguments.get('save_to_notes') is True:
            actions.append({'name':'notes_action','arguments':{'action':'import_research'},'depends_on':[0],
                            'result_refs':{'research_id':{'action_index':0,'result_path':'/research_id'},'research_revision':{'action_index':0,'result_path':'/research_revision'}}})
        submitted=await asyncio.to_thread(action_jobs.submit,actions,{**context,'research_origin_operation_id':operation_id},queue_operation_id,str(arguments.get('query') or arguments.get('action') or name)[:180])
        if submitted.get('status') not in {'queued','duplicate'}:return submitted
        jid=submitted['job_id']
        if reserved:await asyncio.to_thread(artifacts.request_state,reserved['id'],context,job_id=jid)
        deadline=time.monotonic()+90
        while time.monotonic()<deadline:
            snapshot=await asyncio.to_thread(action_jobs.list,jid,context)
            job=snapshot.get('job',{});steps=job.get('actions') or [{}];step=steps[-1]
            if job.get('state') in {'completed','failed','canceled'}:
                failed=next((a for a in steps if a.get('state') in {'failed','uncertain','canceled'}),None)
                outcome=(failed or step).get('result') or {'status':job['state']}
                return {**outcome,'job_id':jid}
            if job.get('paused') or job.get('state') in {'waiting_for_retry','waiting_for_ui'}:return {'status':job.get('state'),'job_id':jid,**({'research_id':reserved['id'],'thread_id':reserved['thread_id']} if reserved else {}),'reason':'Work continues in the durable task queue.'}
            await asyncio.sleep(.1)
        return {'status':'running','job_id':jid,**({'research_id':reserved['id'],'thread_id':reserved['thread_id']} if reserved else {}),'reason':'Inspect the existing task; do not submit it again.'}
    if name=='research_artifact_action' and arguments.get('action')=='delete':
        artifacts,_=get_research_services()
        ids=arguments.get('research_ids') or ([arguments['research_id']] if arguments.get('research_id') else [])
        preview=await asyncio.to_thread(artifacts.deletion_preview_many,ids,context)
        if preview['status']!='ok':return preview
        if arguments.get('revision') and arguments['revision']!=preview['revision']:return {'status':'conflict','reason':'research_changed_review_removal'}
        arguments={**arguments,'research_ids':ids,'revision':preview['revision'],'target_title':preview['title']}
    confirmation=await _confirm_destructive(name,arguments,{**context,'operation_id':operation_id})
    if confirmation:return confirmation
    if name=="run_action_batch":return await asyncio.to_thread(action_jobs.submit,arguments.get("actions"),context,operation_id,arguments.get("goal", ""))
    if name=="job_action":
        action=arguments.get("action","list")
        jid=arguments.get("job_id","")
        if action=="cancel":
            if (await asyncio.to_thread(action_jobs.list,jid,context)).get('status')!='ok':return {'status':'not_found'}
            return await asyncio.to_thread(action_jobs.cancel,jid)
        return await asyncio.to_thread(action_jobs.list,jid if action=="get" else "",context)
    if name=="memory_view_action":return await _memory_view_action(client_id,arguments)
    if name in {'notice_action','presence_action'}:return await dispatch_notice(name,arguments,context)
    if name=='approve_memory' or name=='memory_action' and arguments.get('action') in {'approve','reject'}:
        return await get_library_service().decision('memory:'+str(arguments.get('approval_id','')),{'decision':'approved' if arguments.get('approved') is True or arguments.get('action')=='approve' else 'rejected','version':arguments.get('version'),'confirmation_quote':arguments.get('confirmation_quote')},context,voice=True)
    if name=='research_artifact_action':
        artifacts,service=get_research_services()
        if arguments.get('action')=='find_history':return await asyncio.to_thread(artifacts.find_history,str(arguments.get('query','')),context)
        if arguments.get('action')=='delete':
            result=await asyncio.to_thread(artifacts.remove_many,arguments['research_ids'],context,arguments['revision'],operation_id)
            if result.get('status')=='completed':await ws_manager.send_to_client_id(client_id,{'type':'research_refresh','removed_research_ids':arguments['research_ids']})
            return result
        identifier=str(arguments.get('research_id') or context.get('research_id',''))
        await asyncio.to_thread(artifacts.link_turn,identifier,{**context,'referenced_research_id':identifier})
        action=arguments.get('action')
        if action in {'create_documentary','read_attachment','preview_document','apply_document','preview_pdf'}:
            from astra_ai.ui.backend.document_api import document_tool
            return await document_tool(artifacts,context,arguments,operation_id,action_jobs)
        if arguments.get('action') in {'expand','continue','more_media','more_sources'}:
            action=arguments.get('action');view='media' if action=='more_media' else 'sources' if action=='more_sources' else ''
            receipt=await continue_research(identifier,context,operation_id,view=view,detail=str(arguments.get('detail') or context.get('user_text') or context.get('research_user_text',''))[:2000],page_action=str(arguments.get('page_action','')))
            return await _research_collection_receipt(receipt,context) if receipt.get('job_id') else receipt
        if arguments.get('action')=='reader':return await asyncio.to_thread(artifacts.reader,identifier,context,str(arguments.get('research_revision','')),arguments.get('offset',0),arguments.get('limit',12000))
        return await asyncio.to_thread(artifacts.page,identifier,context,str(arguments.get('research_revision','')),arguments.get('offset',0),arguments.get('limit',12000))
    if name=="library_action":
        library=get_library_service();view=arguments.get('view','memories');action=arguments.get('action','list')
        if view=='memories':
            from astra_ai.memory import library as memory_library
            if context.get('guest'):return {'status':'rejected','reason':'owner_library_unavailable'}
            profile=context.get('profile_id','');project=context.get('project_id','')
            if action=='categories':return await asyncio.to_thread(memory_library.categories,state.live_memory,profile,project,arguments.get('query',''),arguments.get('offset',0),arguments.get('limit',30))
            if action=='list':return await asyncio.to_thread(memory_library.page,state.live_memory,profile,project,arguments.get('category_id',''),arguments.get('query',''),arguments.get('status') or 'all',arguments.get('offset',0),arguments.get('limit',20))
            if action=='get':
                rows,records,members,revision=await asyncio.to_thread(memory_library.snapshot,state.live_memory,profile,project)
                record=records.get(arguments.get('id',''))
                return {'status':'ok','record':record,'revision':revision} if record else {'status':'not_found'}
            if action=='open':return await _memory_view_action(client_id,{'action':'category' if arguments.get('category_id') else 'rail','rail':'library',**({'category':arguments['category_id']} if arguments.get('category_id') else {})})
            return {'status':'rejected','reason':'invalid_memory_library_action'}
        if view not in {'approvals','tasks'}:return {'status':'rejected','reason':'invalid_library_view'}
        if action=='list':return await asyncio.to_thread(library.listing,view,context,arguments.get('status',''),arguments.get('query',''),arguments.get('offset',0),arguments.get('limit',20))
        if action=='get':return await asyncio.to_thread(library.detail,view,arguments.get('id',''),context)
        if action=='decision':return await library.decision(arguments.get('id',''),arguments,context,voice=True)
        if action in {'pause','resume','retry','cancel'}:return await library.control(arguments.get('id',''),action,context)
        if action=='open':return await _memory_view_action(client_id,{'action':'rail','rail':view})
        return {'status':'rejected','reason':'invalid_library_action'}
    if name=="get_system_status":return await health_check()
    if name in {'research_action','capability_action'}:
        if not learning_service or not capability_service:return {'status':'failed','reason':'learning_initializing'}
        from astra_ai.core.learning_declarations import dispatch
        return await dispatch(name,arguments,context,operation_id,learning_service,capability_service)
    if name=='open_website':return await _open_requested_website(arguments,context,operation_id)
    memory=name in {d["name"] for d in MEMORY_TOOL_DECLARATIONS+MEMORY_EVENT_TOOL_DECLARATIONS}
    refs={"operation_id":operation_id,"session_id":sid,"turn_id":context.get("turn_id",""),"sequence":1,"job_id":context.get("job_id","")}
    if memory:await ws_manager.send_to_client_id(client_id,activity(name,arguments,**refs))
    if name=="search_web":await ws_manager.send_to_client_id(client_id,{"type":"research_status","phase":"searching","message":"Searching current information…"})
    try:
        if memory:
            result=await execute_shared_memory_tool(guest_memory if context.get("guest") else state.live_memory,name,arguments,context.get("user_text",""),sid,operation_id,context.get("profile_id",""),context.get("project_id",""),context.get("turn_id",""),source="gemini_text")
        else:result=await _dispatch_registered_operation(client_id,name,arguments)
    except Exception:
        logger.exception("Registered Aegis action failed: %s",name)
        result={"status":"failed","reason":"action_unavailable"}
    if memory:await ws_manager.send_to_client_id(client_id,activity(name,arguments,result,**{**refs,"sequence":2}))
    if name=="search_web":await ws_manager.send_to_client_id(client_id,{"type":"research_status","phase":"completed" if result.get("status")=="completed" else "waiting" if result.get("status") in {"waiting_for_quota","waiting_for_retry","running","queued"} else "failed","sources":result.get("results",[])})
    return result

learning_service=None
capability_service=None
background_budget=None
learning_warm_task=None

async def _background_search(query):
    # Use the already configured search connector. Background learning never
    # silently spends conversation-model quota or substitutes another provider.
    if not _get_env_value('SERPAPI_KEY'):return {'status':'failed','reason':'search_connector_not_configured'}
    if background_budget:
        from astra_ai.core.background_budget import BudgetPaused
        state_budget=await asyncio.to_thread(background_budget.snapshot)
        if time.time()<state_budget.get('next_search',0):raise BudgetPaused(state_budget['next_search'],'search_pacing')
        def reserve():
            with background_budget.lock:
                data=background_budget.snapshot();today=datetime.now().date().isoformat()
                if data.get('search_day')!=today:data.update(search_day=today,search_requests=0)
                if data.get('search_requests',0)>=12:raise BudgetPaused((int(time.time())//86400+1)*86400,'background_search_daily_budget')
                data.update(search_requests=data.get('search_requests',0)+1,next_search=time.time()+65)
                from astra_ai.memory.shared_memory import atomic
                atomic(background_budget.path,data)
        await asyncio.to_thread(reserve)
    from astra_ai.core.aegis_ai import CURRENT_OPERATION
    context=CURRENT_OPERATION.get() or {}
    artifacts,service=get_research_services()
    from astra_ai.memory.shared_memory import stable
    scoped={**context,'background':True}
    from astra_ai.core.research_learning import ResearchSearch
    learner_search=ResearchSearch(artifacts,_get_env_value,synthesize=background_model.report if background_model else None)
    learner_search.network=service.network
    result=await learner_search.search({'query':query,'mode':'quick','max_results':4},scoped,str(context.get('operation_id',''))+':question:'+stable(query))
    if result.get('research_id'):
        full=await asyncio.to_thread(artifacts.get,result['research_id'],scoped,result['research_revision'])
        if full['status']=='ok':result={**result,'results':full['artifact']['sources']}
    return result

async def _diagnose_failed_job(jid,index,action,result,context):
    # Authentication, provider limits and external availability require account
    # recovery, not generated code or another research/repair task.
    if action['name']=='search_web' or result.get('http_status') in {401,402,403,429,432,433}:return
    if learning_service:await learning_service.diagnose(jid,index,action,result,context)
    if not capability_service or context.get('guest') or context.get('background') or action['name'] in {'research_action','capability_action'}:return
    # One bounded repair-development task. It does not replay the failed action.
    action_jobs.submit([{'name':'capability_action','arguments':{'action':'develop','purpose':'Resolve failure in '+action['name']+': '+str(result.get('reason','tool failure'))[:120],'failed_job':jid}}],{**context,'background':True,'repair_for':jid,'repair_index':index},'repair-development:'+jid+':'+str(index))

async def _open_requested_website(arguments,context,operation_id):
    import webbrowser
    from urllib.parse import urlsplit
    from astra_ai.memory.shared_memory import read,atomic,stable,StorageLock
    url=str(arguments.get('url','')).strip();parsed=urlsplit(url)
    user_text=str(context.get('user_text','')).casefold()
    if context.get('background') or not re.search(r'\b(open|visit|show|browse|abre|abrir|muestra)\b',user_text):return {'status':'rejected','reason':'requested_navigation_required'}
    if parsed.scheme not in {'https','http'} or not parsed.hostname or parsed.username or parsed.password or len(url)>2000:return {'status':'rejected','reason':'invalid_website_url'}
    host=parsed.hostname.casefold() if parsed.hostname else '';brand=host.removeprefix('www.').split('.')[0]
    if host not in user_text and url.casefold() not in user_text and not re.search(r'\b'+re.escape(brand)+r'\b',user_text):return {'status':'rejected','reason':'website_target_not_in_user_request'}
    if parsed.hostname.lower() in {'localhost','127.0.0.1','::1'}:return {'status':'rejected','reason':'local_service_navigation_not_available_to_learned_tools'}
    path=runtime_paths.system/'browser_operations.json';lock=StorageLock(path.with_suffix('.lock'));key=stable(context.get('session_id',''),operation_id)
    def launch():
        with lock:
            data=read(path,{'operations':{}})
            if key in data['operations']:return data['operations'][key].get('result',{'status':'uncertain','reason':'browser_launch_needs_inspection'})
            data['operations'][key]={'state':'starting','created':datetime.now().isoformat()};atomic(path,data)
            accepted=webbrowser.open(url,new=2)
            result={'status':'completed' if accepted else 'failed','launch_accepted':bool(accepted),'page_loaded':'unverified'}
            data['operations'][key].update(state='completed' if accepted else 'failed',result=result);atomic(path,data)
            return result
    return await asyncio.to_thread(launch)

from astra_ai.ui.backend.action_jobs import ActionJobs
ALL_AEGIS_TOOLS=list({d["name"]:d for d in MEMORY_TOOL_DECLARATIONS+MEMORY_EVENT_TOOL_DECLARATIONS+WIDGET_TOOL_DECLARATIONS+ACTION_TOOL_DECLARATIONS}.values())
async def _reconcile_job_action(action,context):
    from astra_ai.memory.shared_memory import stable,read
    if action["name"] in {"save_memory","save_memory_event","set_standing_rule"}:
        operations=await asyncio.to_thread(lambda:state.live_memory.load().get("_meta",{}).get("operations",{}))
        return operations.get(stable(context.get("session_id",""),action["operation_id"]),{}).get("result")
    if action["name"]=="transcript_action":
        operations=await asyncio.to_thread(lambda:read(state.live_memory.transcript_path,{}).get("transcript_operations",{}))
        return operations.get(action["operation_id"])
    if action['name']=='notes_action':
        args=action.get('resolved_arguments',action.get('arguments',{}))
        if args.get('action')=='import_research':
            artifacts,_=get_research_services()
            result=await asyncio.to_thread(artifacts.import_note,args.get('research_id',''),args.get('research_revision',''),context,action['operation_id'],state)
            return result if result.get('verified') else None
    return None

async def _notify_job_progress(client_id,event):
    task_scope=event.get('scope',{})
    phase=event.get('state')
    if phase in {'running','completed','failed','canceled'} and not task_scope.get('guest'):
        try:await asyncio.to_thread(state.live_memory.clock().observe,'task_start' if phase=='running' else 'task_end',task_scope.get('session_id',''),task_scope.get('profile_id',''),task_scope.get('project_id',''),str(event.get('job_id',''))+':'+str(phase))
        except Exception:pass
    socket=ws_manager.websocket_for(client_id)
    if socket is None:return
    live=state.live_sessions.get(socket);scope=event.pop('scope',{})
    current=(str(getattr(live,'profile_id','')),str(getattr(live,'project_id','')),bool(getattr(live,'guest',False)))
    expected=(scope.get('profile_id',''),scope.get('project_id',''),bool(scope.get('guest')))
    if current!=expected:return
    if event.get('state') in {'completed','failed','waiting_for_retry'}:
        if (not scope.get('background') and not scope.get('requested_research')) or event.get('state')=='failed':
            await asyncio.to_thread(notice_store.enqueue,'job','job:'+str(event.get('job_id')),event.get('state'),event,scope)
    if scope.get('session_id')!=(getattr(live,'session_id',None) or CHAT_SESSIONS.get(client_id,'')):event.pop('notification',None);event.pop('research_id',None)
    await ws_manager.send_to_client_id(client_id,event)

action_jobs=ActionJobs(runtime_paths.system/"action_jobs.json",_dispatch_aegis_tool,_notify_job_progress,lambda client_id:ws_manager.websocket_for(client_id) is not None,[d["name"] for d in ALL_AEGIS_TOOLS],reconcile=_reconcile_job_action)

async def _connected_live_reply(message):
    if not state.gemini_api_key:raise HTTPException(503,'Configure GEMINI_API_KEY in Settings.')
    client=str(message.get('client_id') or '')
    socket=ws_manager.websocket_for(client)
    if socket is None:raise HTTPException(403,'A current local UI connection is required.')
    sid=CHAT_SESSIONS.get(client,'')
    if message.get('session_id') and sid and message['session_id']!=sid:raise HTTPException(409,'Conversation changed; refresh before sending.')
    session=state.live_sessions.get(socket)
    if not session:
        await _start_gemini_voice(socket,guest=speaker_recognition.status()['enabled'])
        session=state.live_sessions.get(socket)
    if not session:raise HTTPException(503,'Live conversation unavailable; draft preserved.')
    rid=str(message.get('operation_id') or message.get('request_id') or uuid.uuid4().hex)
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}',rid):raise HTTPException(400,'Invalid request identifier.')
    text=str(message.get('text') or '').strip()
    if not text or len(text)>8000:raise HTTPException(400,'A message of 1 to 8000 characters is required.')
    result=await session.text_reply(text,rid)
    return {'type':'complete','request_id':rid,'response':result['output_text'],'session_id':session.session_id,
            'model':session.model,'provider':'gemini_live','memory_status':result.get('memory_status','pending'),'audio_via':'websocket'}


@app.post('/api/chat/stream')
async def streaming_chat(message:Dict[str,Any],request:Request):
    # Compatibility adapter: audio/transcripts come from the same Live session.
    if request.headers.get('X-Nova-Client'):message={**message,'client_id':request.headers['X-Nova-Client']}
    async def events():
        try:yield json.dumps(await _connected_live_reply(message),ensure_ascii=False)+'\n'
        except HTTPException as exc:yield json.dumps({'type':'error','message':exc.detail,'request_id':message.get('operation_id')})+'\n'
    return StreamingResponse(events(),media_type='application/x-ndjson',headers={'Cache-Control':'no-store'})

@app.get("/api/jobs")
async def list_action_jobs(request:Request,job_id:str=""):
    return await asyncio.to_thread(action_jobs.list,job_id,_learning_context(request))

@app.post("/api/jobs")
async def create_action_job(request:Request,payload:Dict[str,Any]):
    context={**_learning_context(request),"user_text":str(payload.get("user_text","")),"turn_id":str(payload.get("turn_id",""))}
    return await asyncio.to_thread(action_jobs.submit,payload.get("actions"),context,str(payload.get("operation_id") or uuid.uuid4().hex))

@app.post("/api/jobs/{job_id}/cancel")
async def cancel_action_job(job_id:str,request:Request):
    context=_learning_context(request)
    if (await asyncio.to_thread(action_jobs.list,job_id,context)).get("status")!="ok":raise HTTPException(404,"Task is unavailable")
    return await asyncio.to_thread(action_jobs.cancel,job_id)

async def _dispatch_registered_operation(client_id: str, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name == "read_ui_context":
        from astra_ai.core.aegis_ai import CURRENT_OPERATION
        return {**ui_context(client_id,[d["name"] for d in MEMORY_TOOL_DECLARATIONS + MEMORY_EVENT_TOOL_DECLARATIONS + WIDGET_TOOL_DECLARATIONS + ACTION_TOOL_DECLARATIONS]),'recent_operations':await asyncio.to_thread(action_jobs.recent_references,CURRENT_OPERATION.get() or {})}
    if name == "calendar_create_event":
        normalized = dict(arguments)
        normalized["action"] = "create_event"
        if normalized.get("reminder_minutes") is not None and not isinstance(normalized["reminder_minutes"], list):
            normalized["reminder_minutes"] = [normalized["reminder_minutes"]]
        return await _gemini_calendar_action(client_id, normalized)
    if name == "read_notes_context":
        return await _gemini_read_notes_context(client_id, arguments)
    if name == "read_search_context":
        return await _gemini_read_search_context(client_id, arguments)
    if name == "read_calendar_context":
        return await _gemini_read_calendar_context(client_id, arguments)
    if name == "read_image_context":
        return await _gemini_read_image_context(client_id, arguments)
    if name == "calendar_action":
        return await _gemini_calendar_action(client_id, arguments)
    if name == "image_action":
        return await _gemini_image_action(client_id, arguments)
    if name == "notes_action":
        return await _gemini_notes_action(client_id, arguments)
    if name == "ui_action":
        return await _gemini_ui_action(client_id, arguments)
    if name == "search_web":
        return await _aegis_search_web(arguments)
    if name == "search_widget_action":
        return await _gemini_search_widget_action(client_id, arguments)
    if name == "search_history_action":
        return await _gemini_search_history_action(client_id, arguments)
    if name == "recall_search_memory":
        return await asyncio.to_thread(_gemini_search_memory, arguments)
    if name == "save_search_memory":
        return await asyncio.to_thread(_gemini_save_search_memory, arguments)
    if name == "update_search_memory":
        return await asyncio.to_thread(_gemini_update_search_memory, arguments)
    if name == "delete_search_memory":
        return await asyncio.to_thread(_gemini_delete_search_memory, arguments)
    if name in {"create_file", "read_file", "edit_file", "append_file", "list_tracked_files", "delete_file", "move_file", "file_status"}:
        return await asyncio.to_thread(_gemini_file_action, name, arguments)
    return {"status": "failed", "error": f"Unsupported operation: {name}"}

async def _start_gemini_voice(websocket: WebSocket, *, reset_retry: bool = True, guest: bool = False, speaker_profile: str = "") -> bool:
    """Start a fresh Gemini session; fall back cleanly on any hard failure."""
    previous = state.live_sessions.pop(websocket, None)
    if previous:
        await previous.close(end_logical=False)
    state.live_providers[websocket] = "gemini_live"
    if reset_retry:
        state.live_retries[websocket] = 0
    await ws_manager.send_to_client(websocket, {
        "type": "live_status",
        "provider": "gemini_live",
        "state": "connecting",
        "model": LIVE_MODEL,
    })

    async def hard_failure(detail: str, audio_started: bool, input_text: str) -> None:
        logger.error("[GEMINI-LIVE] Hard failure: %s", detail)
        failed = state.live_sessions.pop(websocket, None)
        if failed:
            await failed.close(end_logical=False)
        if any(word in str(detail).lower() for word in ("quota", "api key", "api_key", "unauth", "permission", "401", "403", "429", "invalid argument")):
            if websocket in ws_manager.connections:
                await ws_manager.send_to_client(websocket, {
                    "type": "live_status", "provider": "gemini_live", "state": "error",
                    "retryable": False,
                    "reason": "Gemini rejected the session. Check your API key, provider quota and model access in Settings.",
                })
            return
        if state.live_retries.get(websocket, 0) < 1:
            state.live_retries[websocket] = state.live_retries.get(websocket, 0) + 1
            await ws_manager.send_to_client(websocket, {
                "type": "live_status", "provider": "gemini_live", "state": "reconnecting",
                "retryable": True, "reason": "Retrying Gemini Live once after an audio session error.",
            })
            await _start_gemini_voice(websocket, reset_retry=False, guest=guest, speaker_profile=speaker_profile)
            return
        state.live_providers[websocket] = "gemini_live"
        await ws_manager.send_to_client(websocket, {
            "type": "live_status", "provider": "gemini_live", "state": "error",
            "retryable": True, "reason": "Gemini Live audio session failed; restart the microphone.",
        })

    client_id = ws_manager.client_id(websocket)

    async def operation_executor(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        from astra_ai.core.aegis_ai import CURRENT_OPERATION
        live=state.live_sessions.get(websocket)
        captured=CURRENT_OPERATION.get()
        ctx={"client_id":client_id,"session_id":getattr(live,"session_id",CHAT_SESSIONS.get(client_id,"")),"turn_id":getattr(live,"_turn_id",""),"user_text":" ".join(getattr(live,"_input_parts",[])),"guest":bool(getattr(live,"guest",False)),"profile_id":getattr(live,"profile_id",""),"project_id":getattr(live,"project_id",""),**{k:v for k,v in getattr(live,"_turn_focus",{}).items() if k in {"research_id","thread_id"}}}
        if captured:ctx={**ctx,**captured,"client_id":client_id}
        return await _dispatch_aegis_tool(name,arguments,ctx,str(captured.get("operation_id") or uuid.uuid4().hex) if captured else uuid.uuid4().hex)

    async def status_provider() -> Dict[str, Any]:
        return await _gemini_system_status(client_id)

    from astra_ai.core.aegis_ai import AegisCore
    session = AegisCore(guest_memory if guest else state.live_memory).live_session(
        api_key=state.gemini_api_key,
        memory_file=guest_memory.transcript_path if guest else state.memory_file,
        send_json=lambda message: ws_manager.send_to_client(websocket, {**{k:v for k,v in getattr(state.live_sessions.get(websocket),"_turn_focus",{}).items() if k in {"research_id","thread_id"}},**message}),
        send_bytes=lambda payload: ws_manager.send_bytes_to_client(websocket, payload),
        on_failure=hard_failure,
        client_id=client_id,
        operation_executor=operation_executor,
        status_provider=status_provider,
    )
    session.guest=guest
    session.research_focus_provider=lambda:_live_research_focus(session,client_id)
    focused=ui_context(client_id).get('snapshot',{})
    if not guest and focused.get('view')=='research' and focused.get('research_id'):
        thread=await _research_thread(str(focused['research_id']),{'profile_id':session.profile_id,'project_id':session.project_id})
        if thread.get('status')=='ok':session.research_focus=thread
    session._speaker_context=("Confirmed enrolled additional speaker; separate memories, no owner context." if speaker_profile else "Unconfirmed guest; no access to owner memories.") if guest else "Main account user context, connected to the existing owner memories and standing rules. Main user is a role, not the person’s name; identity details come from saved memory."
    if guest:session.profile_id=("speaker-"+speaker_profile) if speaker_profile else "guest-"+client_id
    session.session_id=("guest-" if guest else "")+CHAT_SESSIONS.get(client_id,session.session_id)
    target_channel=(getattr(session,'research_focus',{}) or {}).get('thread_id') or session.session_id
    if previous and previous._resumption_channel()==target_channel and (previous.guest,previous.profile_id,previous.project_id,previous.session_id)==(session.guest,session.profile_id,session.project_id,session.session_id):
        session._resume_handle=previous._resume_handle
        session._resume_model=previous._resume_model
        session.model=previous.model
    state.live_sessions[websocket] = session
    try:
        await session.start()
        return True
    except Exception as exc:
        detail = str(exc)
        quota_exhausted = "quota" in detail.lower() or "1011" in detail
        if quota_exhausted:
            logger.error("[GEMINI-LIVE] Initial connection rejected because the Gemini API quota is exhausted.")
        else:
            logger.exception("[GEMINI-LIVE] Initial connection failed")
        state.live_sessions.pop(websocket, None)
        await session.close()
        if quota_exhausted:
            if websocket in ws_manager.connections:
                await ws_manager.send_to_client(websocket, {
                    "type": "live_status", "provider": "gemini_live", "state": "error",
                    "retryable": False,
                    "reason": "Gemini rejected the session. Check your API key, provider quota and model access in Settings.",
                })
            return False
        # Absorb one transient DNS/TCP reset without requiring the user to
        # toggle the microphone repeatedly. Never retry a disconnected client.
        if websocket in ws_manager.connections and state.live_retries.get(websocket, 0) < 1:
            state.live_retries[websocket] = state.live_retries.get(websocket, 0) + 1
            await ws_manager.send_to_client(websocket, {
                "type": "live_status", "provider": "gemini_live", "state": "reconnecting",
                "retryable": True, "reason": "Gemini Live connection was interrupted; retrying once.",
            })
            await asyncio.sleep(1.0)
            if websocket in ws_manager.connections:
                return await _start_gemini_voice(websocket, reset_retry=False, guest=guest, speaker_profile=speaker_profile)
            return False
        await ws_manager.send_to_client(websocket, {
            "type": "live_status", "provider": "gemini_live", "state": "error",
            "retryable": True, "reason": "Gemini Live could not connect; restart the microphone.",
        })
        return False

@app.websocket(ServerConfig.WS_ENDPOINT)
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time AI voice communication.
    
    Message Protocol:
    - Client → Server:
        {
            "type": "transcript",
            "text": "user message",
            "isFinal": true
        }
    
    - Server → Client (Audio Pipeline):
        1. {"type": "status", "state": "thinking"}
        2. {"type": "response_text", "text": "AI response"}
        3. {"type": "response_audio", "audio": "base64_audio", "format": "pcm", "sampleRate": 48000}
        4. {"type": "status", "state": "idle"}
    
    The audio (step 3) is decoded by the frontend's Web Audio API pipeline:
    - AudioContext.decodeAudioData() converts Base64 → AudioBuffer
    - AnalyserNode extracts real-time frequency data
    - Audio queuing system handles multiple segments seamlessly
    - Frequency data drives the visual Orb animation in orb.ts
    """
    origin=websocket.headers.get('origin')
    if origin and origin not in _allowed_origins:
        await websocket.close(code=1008);return
    await ws_manager.connect(websocket)
    
    try:
        while True:
            frame = await websocket.receive()
            if frame.get("type") == "websocket.disconnect":
                break
            binary = frame.get("bytes")
            if binary is not None:
                if len(binary)<8 or binary[:4]!=b'NVA1' or not workspace_service.store().owns_voice(ws_manager.client_id(websocket),int.from_bytes(binary[4:8],'little')):continue
                binary=binary[8:]
                session = state.live_sessions.get(websocket)
                if state.live_providers.get(websocket) == "gemini_live" and session:
                    # Raw PCM remains the only active Live media input. Vision
                    # frames are intentionally disabled until re-enabled.
                    if binary.startswith(b"ASTR") and len(binary) > 5:
                        logger.info("Dropping disabled vision media frame")
                    else:
                        if mic_states.get(ws_manager.client_id(websocket),True):continue
                        if websocket in speaker_buffers:
                            speaker_buffers[websocket].extend(binary)
                            if len(speaker_buffers[websocket])>=64000:await _finish_speaker_audio(websocket)
                        else:await session.send_audio(binary)
                continue
            data = frame.get("text")
            if not data:
                continue
            
            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")
                
                logger.debug(f"📨 WebSocket message: {msg_type}")
                client=ws_manager.client_id(websocket)
                device=websocket.headers.get('x-nova-paired-device','local')
                if await workspace_service.handle(client,message,device):continue
                
                # Route message based on type
                if msg_type == "conversation_attach":
                    sid=str(message.get("session_id") or "")
                    if re.fullmatch(r"[a-zA-Z0-9_-]{1,128}",sid):
                        CHAT_SESSIONS[ws_manager.client_id(websocket)]=sid
                        live=state.live_sessions.get(websocket)
                        job_scope={'profile_id':getattr(live,'profile_id',''),'project_id':getattr(live,'project_id',''),'guest':bool(getattr(live,'guest',False)) or bool(speaker_recognition.status()['enabled'])}
                        await action_jobs.attach(ws_manager.client_id(websocket),sid,job_scope)
                        await ws_manager.send_to_client(websocket,{"type":"jobs_snapshot",**await asyncio.to_thread(action_jobs.list,"",job_scope)})
                elif msg_type == "conversation_switch":
                    sid=str(message.get("session_id") or "")
                    result=await asyncio.to_thread(state.live_memory.session_action,"resume",session_id=sid)
                    if result.get("status")=="ok":
                        CHAT_SESSIONS[ws_manager.client_id(websocket)]=sid
                        if state.live_sessions.get(websocket):await _start_gemini_voice(websocket,guest=speaker_recognition.status()["enabled"])
                    await ws_manager.send_to_client(websocket,{"type":"conversation_switched",**result})
                elif msg_type == "live_speech_start":
                    if not workspace_service.store().owns_voice(ws_manager.client_id(websocket)):continue
                    if speaker_recognition.status()["enabled"]:speaker_buffers[websocket]=bytearray()
                    else:
                        live=state.live_sessions.get(websocket)
                        if live:
                            client=ws_manager.client_id(websocket)
                            focus=await _live_research_focus(live,client,hydrate=False)
                            if live._resumption_channel()!=(focus.get('thread_id') or live.session_id):
                                await _start_gemini_voice(websocket,guest=bool(live.guest))
                                live=state.live_sessions.get(websocket)
                        if live and await workspace_service.begin_audio(ws_manager.client_id(websocket),live):
                            live._voice_lease_generation=workspace_service.store().voice['generation']
                            await live.begin_audio(str(message.get('generation') or '')[:80],message.get('has_checkpoint') is True)
                            workspace_service.audio_locks[ws_manager.client_id(websocket)]['turn']=live._turn_id
                elif msg_type == "live_speech_end":
                    if not workspace_service.store().owns_voice(ws_manager.client_id(websocket)):continue
                    if websocket in speaker_buffers:await _finish_speaker_audio(websocket)
                    live=state.live_sessions.get(websocket)
                    if live:await live.end_audio(message.get('speech_ms'))
                elif msg_type == "live_text_suspend":
                    workspace_service.cancel_turns(ws_manager.client_id(websocket))
                    live=state.live_sessions.get(websocket)
                    if live:
                        live._cancel_recovery(clear=True)
                        live._text_suspended=True;live._turn_interrupted=True;live._await_new_input=True
                        live._input_parts.clear();live._output_parts.clear()
                        await ws_manager.send_to_client(websocket,{"type":"live_interrupted","generation":live.audio_generation})
                elif msg_type == "live_text_resume":
                    live=state.live_sessions.get(websocket)
                    if live:
                        live._text_suspended=False
                        live._memory_profile=await asyncio.to_thread(live.memory_manager.format_response_context,session_id=live.session_id,profile_id=live.profile_id,project_id=live.project_id)
                        if not live.guest:await live.refresh_ui(ui_context(ws_manager.client_id(websocket)))
                        if live.model==LIVE_MODEL:
                            from google.genai import types as live_types
                            await live._session.send_client_content(turns=live_types.Content(role="user",parts=[live_types.Part(text="Updated applicable standing rules and memory for subsequent turns, not a new request:\n"+live._memory_profile)]),turn_complete=False)
                elif msg_type == "ui_context":
                    changed=set_ui(ws_manager.client_id(websocket),message.get("snapshot",{}))
                    workspace_service.store().touch(ws_manager.client_id(websocket),UI_CONTEXTS.get(ws_manager.client_id(websocket),{}))
                    live=state.live_sessions.get(websocket)
                    if not live or not live.guest:
                        snapshot=ui_context(ws_manager.client_id(websocket)).get('snapshot',{})
                        focus=await _live_research_focus(live,ws_manager.client_id(websocket),snapshot,hydrate=False)
                        if live:live.research_focus=focus
                        await ws_manager.send_to_client(websocket,{'type':'research_focus_ack','research_id':focus.get('research_id',''),'selection_revision':snapshot.get('selection_revision',0),'thread_id':focus.get('thread_id','')})
                    if changed and live and not live.guest and not live._audio_started and not live._input_parts:
                        if not live.guest:await live.refresh_ui(ui_context(ws_manager.client_id(websocket)))
                elif msg_type == "live_start":
                    if not message.get('muted',False) and not workspace_service.store().owns_voice(client):
                        await ws_manager.send_to_client(websocket,{'type':'workspace_voice_result','granted':False,'owner':workspace_service.store().voice});continue
                    mic_states[ws_manager.client_id(websocket)]=bool(message.get("muted",False))
                    sid=str(message.get("session_id") or "")
                    if re.fullmatch(r"[a-zA-Z0-9_-]{1,128}",sid): CHAT_SESSIONS[ws_manager.client_id(websocket)]=sid
                    await _start_gemini_voice(websocket,guest=speaker_recognition.status()["enabled"])
                elif msg_type == "mic_state":
                    client=ws_manager.client_id(websocket);mic_states[client]=bool(message.get('muted',True))
                    if not mic_states[client] and not workspace_service.store().owns_voice(client):
                        mic_states[client]=True
                        await ws_manager.send_to_client(websocket,{'type':'workspace_voice_result','granted':False,'owner':workspace_service.store().voice})
                    if mic_states[client]:workspace_service.store().release_voice(client)
                    live=state.live_sessions.get(websocket)
                    if live:
                        live.working.muted=mic_states[client]
                        if mic_states[client]:
                            live._voice_lease_generation=None;workspace_service.end_audio_lock(client);await live.end_audio()
                elif msg_type == "presence_frame":
                    asyncio.create_task(handle_presence_frame(websocket,message))
                elif msg_type == "presence_status":
                    client=ws_manager.client_id(websocket)
                    if message.get('state') in {'off','denied','unavailable','error'}:
                        await release_presence(client)
                elif msg_type == "notice_delivered":
                    client=ws_manager.client_id(websocket);live=state.live_sessions.get(websocket)
                    if live and not live.guest:
                        c={'client_id':client,'profile_id':live.profile_id,'project_id':live.project_id}
                        await asyncio.to_thread(notice_store.acknowledge,str(message.get('notice_id','')),c)
                        await release_presence(client,websocket)
                elif msg_type == "live_stop":
                    workspace_service.store().release_voice(ws_manager.client_id(websocket));workspace_service.end_audio_lock(ws_manager.client_id(websocket))
                    await state.close_live_session(websocket)
                    await ws_manager.send_to_client(websocket, {
                        "type": "live_status", "provider": "none", "state": "idle"
                    })
                elif msg_type == "live_text":
                    text = str(message.get("text") or "").strip()
                    source = str(message.get("source") or "typed_input").strip().lower()
                    if not text:
                        continue
                    session = state.live_sessions.get(websocket)
                    if state.live_providers.get(websocket) != "gemini_live" or not session:
                        await _start_gemini_voice(websocket,guest=speaker_recognition.status()["enabled"])
                        session = state.live_sessions.get(websocket)
                    if not session:
                        await ws_manager.send_to_client(websocket,{'type':'live_error','message':'Live conversation could not start. Your draft is preserved.'})
                    else:
                        rid=str(message.get('request_id') or uuid.uuid4().hex)
                        if not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}',rid):
                            await ws_manager.send_to_client(websocket,{'type':'live_error','message':'Invalid request identifier.'})
                            continue
                        if source=='search_widget':text='Search in the Search widget for '+str(message.get('display_query') or text)
                        snapshot=ui_context(ws_manager.client_id(websocket)).get('snapshot',{})
                        current_id=str(snapshot.get('research_id') or '') if snapshot.get('view')=='research' else ''
                        if str(message.get('research_id') or '') != current_id or ('selection_revision' in message and message['selection_revision']!=snapshot.get('selection_revision',0)):
                            await ws_manager.send_to_client(websocket,{'type':'live_error','message':'Research focus changed. Your message was not submitted; select the report and retry.'})
                            continue
                        client=ws_manager.client_id(websocket)
                        focus=await _live_research_focus(session,client,snapshot)
                        target_channel=focus.get('thread_id') or session.session_id
                        if session._resumption_channel()!=target_channel:
                            await _start_gemini_voice(websocket,guest=bool(session.guest))
                            session=state.live_sessions.get(websocket)
                            if not session:continue
                            focus=await _live_research_focus(session,client,snapshot)
                        workspace_service.submit(client,session,text,rid,focus)
                        accepted={'status':'accepted'}
                        if source=='search_widget':await ws_manager.send_to_client(websocket,{'type':'typed_transcript_status','request_id':rid,'source':source,'status':'accepted' if accepted.get('status') in {'accepted','duplicate'} else 'failed'})
                elif msg_type == "transcript":
                    await handle_transcript_message(websocket, message)
                elif msg_type == "widget_connection_request":
                    widget = str(message.get("widget") or "").strip().lower()
                    action = str(message.get("action") or "connect").strip().lower()
                    await _execute_aegis_widget_envelope({
                        "type": "widget_control",
                        "widget": widget,
                        "command": action,
                        "execution": "backend",
                        "request_id": str(message.get("request_id") or f"connection-{uuid.uuid4().hex}"),
                        "client_id": ws_manager.client_id(websocket),
                        "source": "user_ui",
                    })
                elif msg_type == "widget_telemetry":
                    try:
                        record = state.widget_connections.ingest(ws_manager.client_id(websocket), message)
                        await ws_manager.send_to_client(websocket, {
                            "type": "widget_telemetry_ack",
                            "widget": message.get("widget"),
                            "event_id": message.get("event_id"),
                            "state_revision": record.get("revision"),
                            "status": "accepted",
                        })
                    except (ValueError, PermissionError) as exc:
                        await ws_manager.send_to_client(websocket, {
                            "type": "widget_telemetry_ack",
                            "widget": message.get("widget"),
                            "event_id": message.get("event_id"),
                            "status": "rejected",
                            "detail": str(exc),
                        })
                elif msg_type == "widget_action_result" and message.get("widget")=="application_confirmation":
                    client=ws_manager.client_id(websocket)
                    for key,entry in _destructive_confirmations.items():
                        if key[0]==client and entry['request_id']==message.get('request_id') and key[1]==message.get('revision') and entry['state']=='waiting':
                            entry['state']='approved' if message.get('confirmed') is True else 'rejected'
                    state.resolve_widget_action(client,str(message.get('request_id') or ''),message)
                elif msg_type == "widget_action_result" and message.get("widget") in {"memory","application"}:
                    state.resolve_widget_action(ws_manager.client_id(websocket),str(message.get("request_id") or ""),message)
                elif msg_type == "widget_action_result":
                    logger.info(
                        "[WIDGET] Frontend result: %s %s [%s] %s",
                        message.get("widget"),
                        message.get("command"),
                        message.get("status"),
                        message.get("detail", ""),
                    )
                    state.record_widget_result(message)
                    state.widget_connections.record_result(ws_manager.client_id(websocket), message)
                    if str(message.get("status") or "").lower() in {"completed", "failed", "unconfirmed"}:
                        state.resolve_widget_action(
                            ws_manager.client_id(websocket),
                            str(message.get("request_id") or ""),
                            message,
                        )
                    if (
                        str(message.get("status") or "").lower() == "failed"
                        and str(message.get("command") or "").lower() != "connection"
                    ):
                        await ws_manager.send_to_client(websocket, {
                            "type": "widget_action_status",
                            "widget": message.get("widget"),
                            "command": message.get("command"),
                            "request_id": message.get("request_id"),
                            "status": "failed",
                            "detail": str(message.get("detail") or "Widget action failed"),
                        })
                    await ws_manager.send_to_client(websocket, {
                        "type": "widget_action_ack",
                        "widget": message.get("widget"),
                        "command": message.get("command"),
                        "request_id": message.get("request_id"),
                        "status": message.get("status"),
                    })
                elif msg_type == "ping":
                    await ws_manager.send_to_client(websocket, {"type": "pong"})
                else:
                    logger.warning(f"[WARNING] Unknown message type: {msg_type}")
            
            except json.JSONDecodeError as e:
                logger.error(f"[ERROR] Invalid JSON: {e}")
                await ws_manager.send_to_client(websocket, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[ERROR] WebSocket error: {e}")
    finally:
        speaker_buffers.pop(websocket,None)
        await state.close_live_session(websocket)
        await release_presence(ws_manager.client_id(websocket))
        mic_states.pop(ws_manager.client_id(websocket),None)
        ws_manager.disconnect(websocket)


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    # Liveness cannot depend on scanning or locking an authoritative disk store.
    # A slow statistics read must not cause recovery to terminate a healthy writer.
    memory_status = getattr(state,'health_memory_status',{'status':'warming'})
    task=getattr(state,'health_memory_task',None)
    if task is None or task.done() and time.monotonic()-getattr(state,'health_memory_at',0)>30:
        async def refresh_memory_status():
            try:state.health_memory_status=await asyncio.to_thread(state.live_memory.stats)
            except Exception:pass
            finally:state.health_memory_at=time.monotonic()
        state.health_memory_task=asyncio.create_task(refresh_memory_status())
    return {
        "status": "healthy",
        "conversation_core": "astra_ai.core.aegis_ai",
        "typed_provider": "gemini_live",
        "default_voice_provider": "gemini_live",
        "gemini_live_model": MODEL_STATUS["voice"].get("effective") or LIVE_MODEL,
        "models": MODEL_STATUS,
        "research_writer": {"provider":getattr(research_model,'provider',None),"model":research_model.model_provider() if research_model else None},
        "gemini_live_configured": bool(state.gemini_api_key),
        "gemini_live_sessions": len(state.live_sessions),
        "runtime": {"python": sys.version.split()[0], "google_genai": importlib.metadata.version("google-genai")},
        "memory": memory_status,
        "aegis_ai_running": state.aegis_ai.is_running if state.aegis_ai else False,
        "aegis_ai_initialized": bool(state.aegis_ai and state.aegis_ai.initialization_complete),
        "context_compactor": state.context_preprocessor.health(),
        "active_connections": len(ws_manager.connections),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/runtime/shutdown")
async def supervised_shutdown(request: Request):
    token = os.environ.get("NOVA_RUNTIME_TOKEN")
    if not token or request.headers.get("x-nova-runtime-token") != token:
        raise HTTPException(status_code=403, detail="Supervisor authentication required")
    await state.shutdown()
    asyncio.get_running_loop().call_later(.2, lambda: os._exit(0))
    return {"status": "stopping"}


@app.post("/api/restart")
async def request_supervised_restart():
    import httpx
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.post("http://127.0.0.1:8341/api/runtime/restart", headers={"X-Nova-Runtime-Token": os.environ.get("NOVA_RUNTIME_TOKEN", "")})
        return JSONResponse(status_code=response.status_code, content=response.json())
    except Exception:
        return JSONResponse(status_code=503, content={"error": "Runtime supervisor unavailable. Start Nova using start_nova_ai.ps1."})


@app.get("/api/status")
async def get_status():
    """Get current server status"""
    return {
        "processing": state.is_processing,
        "connections": len(ws_manager.connections),
        "conversation_core": "astra_ai.core.aegis_ai",
        "typed_provider": "gemini_live",
        "default_voice_provider": "gemini_live",
        "gemini_live_model": LIVE_MODEL,
        "gemini_live_sessions": len(state.live_sessions),
        "runtime": {"python": sys.version.split()[0], "google_genai": importlib.metadata.version("google-genai")},
        "memory": state.live_memory.stats(),
        "aegis_ai_running": state.aegis_ai.is_running if state.aegis_ai else False,
        "session_id": state.current_user_session,
        "timestamp": datetime.now().isoformat()
    }


@app.post('/api/chat')
async def chat_rest(message:Dict[str,Any]):
    if not isinstance(message.get('text'),str) or not message['text'].strip():raise HTTPException(400,'Empty message')
    return await _connected_live_reply(message)


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe a browser-recorded utterance through the server-side Groq key."""
    api_key = _get_groq_api_key()
    if not api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "GROQ_API_KEY is not configured for speech transcription."}
        )

    audio_bytes = await audio.read()
    if not audio_bytes:
        return JSONResponse(status_code=400, content={"error": "Uploaded audio is empty."})

    filename = audio.filename or "utterance.webm"
    content_type = audio.content_type or "audio/webm"

    try:
        response = await asyncio.to_thread(
            requests.post,
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (filename, audio_bytes, content_type)},
            data={
                "model": "whisper-large-v3-turbo",
                "response_format": "verbose_json",
                "temperature": "0",
            },
            timeout=45,
        )

        if response.status_code != 200:
            logger.error("[STT] Groq transcription request failed with HTTP %s", response.status_code)
            status_code = response.status_code if response.status_code in (400, 401, 413, 429) else 502
            return JSONResponse(
                status_code=status_code,
                content={"error": f"Speech transcription provider returned HTTP {response.status_code}."}
            )

        result = response.json()
        segments = result.get("segments") or []
        no_speech_values = [
            segment.get("no_speech_prob")
            for segment in segments
            if isinstance(segment, dict) and isinstance(segment.get("no_speech_prob"), (int, float))
        ]
        transcript = (result.get("text") or "").strip()
        no_speech_prob = max(no_speech_values) if no_speech_values else None

        logger.info("[STT] Transcribed utterance (%s bytes, %s chars)", len(audio_bytes), len(transcript))
        return {"text": transcript, "no_speech_prob": no_speech_prob}
    except requests.exceptions.Timeout:
        logger.error("[STT] Groq transcription request timed out")
        return JSONResponse(status_code=504, content={"error": "Speech transcription timed out."})
    except Exception as e:
        logger.error("[STT] Speech transcription failed: %s", e)
        return JSONResponse(status_code=500, content={"error": "Speech transcription failed."})


@app.post("/api/test/tts")
async def test_tts(data: Dict[str, Any]):
    """
    TEST ENDPOINT: Test the complete TTS pipeline
    Useful for debugging audio generation issues
    
    Request: {"text": "Hello, this is a test"}
    Response: {"audio": "base64_string", "success": true, "format": "mp3"}
    """
    text = data.get("text", "Hello, this is AEGIS. Testing the text to speech pipeline.").strip()
    
    logger.info(f"\n{'='*70}")
    logger.info("🧪 [TEST] Starting TTS pipeline test")
    logger.info(f"{'='*70}")
    logger.info(f"[LOG] Input text: {text[:100]}")
    
    try:
        # Step 1: Clean markdown
        cleaned = strip_markdown_for_tts(text)
        logger.info(f"[OK] Step 1 - Markdown stripped: {cleaned[:100]}")
        
        # Step 2: Call ElevenLabs
        logger.info(f"[TTS] Step 2 - Calling ElevenLabs API...")
        audio_b64 = await generate_audio_elevenlabs(cleaned)
        
        if not audio_b64:
            logger.error("[ERROR] Step 2 - ElevenLabs failed to generate audio")
            return {
                "success": False,
                "error": "ElevenLabs API failed",
                "debug_info": "Check backend logs for details"
            }
        
        logger.info(f"[OK] Step 2 - Audio generated: {len(audio_b64)} chars base64")
        logger.info(f"[OUTPUT] Step 3 - Audio ready for Web Audio API decoding")
        logger.info(f"   Format: MP3 (ElevenLabs)")
        logger.info(f"   Encoding: Base64")
        logger.info(f"   Frontend will: AudioContext.decodeAudioData(buffer)")
        logger.info(f"   Then: Play via AnalyserNode → Orb animation sync")
        logger.info(f"{'='*70}\n")
        
        return {
            "success": True,
            "audio": audio_b64,
            "format": "mp3",
            "size_bytes": len(audio_b64),
            "message": "Audio generated successfully - can be played by frontend Web Audio API",
            "next_steps": [
                "1. Frontend receives this Base64 audio",
                "2. AudioContext.decodeAudioData(buffer) decodes MP3",
                "3. AudioBufferSourceNode queues decoded audio",
                "4. AnalyserNode extracts frequency data in real-time",
                "5. Orb animation syncs with audio frequencies"
            ]
        }
    
    except Exception as e:
        logger.error(f"[ERROR] TTS test failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "debug_info": "Check backend logs for full traceback"
        }


@app.post("/api/test/full-pipeline")
async def test_full_pipeline(data: Dict[str, Any]):
    """
    TEST ENDPOINT: Test the complete user → Aegis AI → TTS → Audio pipeline
    Simulates the full voice interaction without Web Speech API
    """
    user_text = data.get("text", "Hello Aegis").strip()
    
    logger.info(f"\n{'='*70}")
    logger.info("🧪 [TEST] Starting full pipeline test")
    logger.info(f"{'='*70}")
    logger.info(f"[INPUT] [SIMULATE USER] Speaking: {user_text}")
    
    try:
        # Step 1: Simulate speech correction
        logger.info(f"[FIX] Step 1 - Applying speech corrections...")
        corrected = apply_speech_corrections(user_text)
        if user_text != corrected:
            logger.info(f"   Corrected: '{user_text}' → '{corrected}'")
        else:
            logger.info(f"   No corrections needed")
        
        # Step 2: Send to Aegis AI subprocess
        if not state.aegis_ai or not state.aegis_ai.is_running:
            return {
                "success": False,
                "error": "Aegis AI not initialized",
                "step": 2
            }
        
        logger.info(f"[AI] Step 2 - Sending to Aegis AI subprocess...")
        ai_response = await state.aegis_ai.send_message(corrected, timeout=30.0)
        
        if not ai_response:
            logger.error("   No response from Aegis AI")
            return {
                "success": False,
                "error": "No response from Aegis AI",
                "step": 2
            }
        
        logger.info(f"   Got response: {ai_response[:100]}...")
        
        # Step 3: Generate audio
        logger.info(f"[TTS] Step 3 - Generating audio via ElevenLabs...")
        audio_b64 = await generate_audio_base64(ai_response)
        
        if not audio_b64:
            logger.warning("[WARNING]  Audio generation failed, continuing with text only")
            has_audio = False
        else:
            logger.info(f"   Audio generated: {len(audio_b64)} chars base64")
            has_audio = True
        
        logger.info(f"{'='*70}\n")
        
        return {
            "success": True,
            "user_input": user_text,
            "corrected_input": corrected,
            "ai_response": ai_response,
            "audio": audio_b64 if has_audio else None,
            "has_audio": has_audio,
            "format": "mp3" if has_audio else None,
            "message": "Full pipeline test complete"
        }
    
    except Exception as e:
        logger.error(f"[ERROR] Full pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "debug_info": "Check backend logs for full traceback"
        }


@app.get("/api/memory/migration/preview")
async def preview_memory_migration():
    try:
        return await asyncio.to_thread(state.live_memory.preview_migration)
    except Exception:
        raise HTTPException(status_code=503, detail="Memory source unreadable; existing data preserved")


@app.post("/api/memory/store")
async def store_memory(data: Dict[str, Any]):
    import hashlib
    value=data.get("content",data.get("value",""))
    key=str(data.get("key") or "memory_"+hashlib.sha256(str(value).encode()).hexdigest()[:16])
    metadata={"source":"human","evidence":str(data.get("evidence") or value),"session_id":str(data.get("session_id") or state.current_user_session),"operation_id":str(data.get("operation_id") or ""),"approved":data.get("approved") is True,"confidence":data.get("confidence",1),**{k:data[k] for k in ("profile_id","project_id","scope","valid_from","valid_until","explicit_preference","inferred","evidence_refs") if k in data}}
    try:
        if data.get("type","fact") in {"event","memory_event"} or data.get("event_type"):
            return await asyncio.to_thread(state.live_memory.save_event,str(data.get("event_type") or "custom_memory"),key,value,data.get("attributes"),data.get("tags"),category=str(data.get("category") or "meta_memory"),**metadata)
        return await asyncio.to_thread(state.live_memory.save_fact,str(data.get("category") or "notes"),key,value,**metadata)
    except (ValueError,TypeError):
        raise HTTPException(status_code=422, detail="Invalid memory proposal")
    except Exception:
        logger.exception("Memory write failed")
        return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable","retryable":True})


@app.get("/api/memory/recall")
async def recall_memory(query: str, limit: int = 5, category: Optional[str] = None, event_type: Optional[str] = None, source: Optional[str] = None, session_id: Optional[str] = None, since: Optional[str] = None, until: Optional[str] = None, kind: Optional[str] = None, profile_id: str = "", project_id: str = "", scope: Optional[str] = None, lifecycle: str = "active"):
    try:
        result=await asyncio.to_thread(state.live_memory.recall_memory,query,limit,category=category,event_type=event_type,source=source,session_id=session_id,since=since,until=until,kind=kind,profile_id=profile_id,project_id=project_id,scope=scope,lifecycle=lifecycle)
        return {**result,"memories":result.get("matches",[]),"count":len(result.get("matches",[]))}
    except Exception:
        logger.exception("Memory recall failed")
        return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable","memories":[],"count":0})


_presentation_path=runtime_paths.system/"memory_presentation.json"
_presentation_lock=threading.RLock()

@app.get("/api/memory/presentation")
async def memory_presentation(renderer:str=""):
    from astra_ai.memory.shared_memory import read
    try:
        data=await asyncio.to_thread(read,_presentation_path,{"positions":{}})
        return data.get("layouts",{}).get(renderer,{"positions":{}}) if renderer else data
    except Exception:raise HTTPException(503,"Saved layout could not be read; it was preserved.")

@app.post("/api/memory/presentation")
async def save_memory_presentation(payload:Dict[str,Any]):
    import math
    from astra_ai.memory.shared_memory import atomic,read
    positions=payload.get("positions",{})
    if not isinstance(positions,dict) or len(positions)>10000:raise HTTPException(422,"Invalid positions")
    checked={}
    for rid,p in positions.items():
        if not isinstance(rid,str) or len(rid)>128 or not isinstance(p,dict):raise HTTPException(422,"Invalid position")
        try:point={k:float(p[k]) for k in ("x","y","z")}
        except (ValueError,TypeError,KeyError):raise HTTPException(422,"Invalid coordinates")
        if any(not math.isfinite(v) or abs(v)>1000 for v in point.values()):raise HTTPException(422,"Coordinates out of range")
        checked[rid]=point
    def save():
        with _presentation_lock:
            current=read(_presentation_path,{"positions":{}})
            renderer=str(payload.get("renderer",""))
            if renderer and not re.fullmatch(r"[a-z0-9_]{1,40}",renderer):raise ValueError("Invalid renderer")
            target=current.setdefault("layouts",{}).setdefault(renderer,{"positions":{}}) if renderer else current
            if payload.get("reset"):target["positions"]={}
            target.setdefault("positions",{}).update(checked)
            atomic(_presentation_path,current)
            return {"status":"saved","positions":checked}
    try:return await asyncio.to_thread(save)
    except Exception:raise HTTPException(503,"Layout could not be saved; memory relationships were not changed.")

@app.get("/api/memory/conversations")
async def memory_conversations(session_id:str="",limit:int=20,offset:int=0,profile_id:str="",project_id:str=""):
    return await asyncio.to_thread(state.live_memory.transcript_action,"list" if session_id else "sessions",session_id=session_id,limit=limit,offset=offset,profile_id=profile_id,project_id=project_id)

@app.post("/api/memory/transcript")
async def memory_transcript(payload:Dict[str,Any]):
    args=dict(payload);action=args.pop("action","get")
    try:return await asyncio.to_thread(state.live_memory.transcript_action,action,**args)
    except (ValueError,TypeError):raise HTTPException(422,"Invalid transcript action")
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"transcript_storage_unavailable"})

@app.get("/api/memory/rules")
async def memory_standing_rules(profile_id:str="",project_id:str="",session_id:str="",limit:int=100,offset:int=0):
    return await asyncio.to_thread(state.live_memory.standing_rules,profile_id=profile_id,project_id=project_id,session_id=session_id,limit=limit,offset=offset)


@app.get("/api/memory/organizer")
async def memory_organizer_status():
    organizer=getattr(state,"memory_organizer",None)
    return await asyncio.to_thread(organizer.get_workflow_status) if organizer else {"status":"unavailable"}

@app.post("/api/memory/organizer")
async def memory_organizer_control(payload:Dict[str,Any]):
    organizer=getattr(state,"memory_organizer",None)
    if not organizer:return {"status":"unavailable"}
    action=payload.get("action")
    if action=="pause":organizer.pause_processing()
    elif action=="resume":organizer.resume_processing()
    elif action=="cancel":return await asyncio.to_thread(organizer.cancel,str(payload.get("job_id","")))
    elif action=="organize":return await asyncio.to_thread(organizer.start_memory_organization_cycle)
    else:raise HTTPException(status_code=422,detail="Unknown organizer action")
    return await asyncio.to_thread(organizer.get_workflow_status)

@app.post("/api/memory/history-import")
async def memory_history_import(payload:Dict[str,Any]):
    from astra_ai.memory.history_import import preview,commit
    try:
        if payload.get("action")=="commit":return await asyncio.to_thread(commit,state.live_memory,payload.get("content"),payload.get("fingerprint"),str(payload.get("profile_id", "")),str(payload.get("project_id", "")))
        return await asyncio.to_thread(preview,payload.get("content"))
    except (ValueError,TypeError,json.JSONDecodeError) as exc:raise HTTPException(status_code=422,detail=str(exc))

@app.post("/api/memory/graph/action")
async def memory_entity_action(payload:Dict[str,Any]):
    from astra_ai.memory.entity_graph import manage
    return await asyncio.to_thread(manage,state.live_memory,str(payload.get("action","get")),str(payload.get("target_id","")),str(payload.get("profile_id","")),str(payload.get("project_id","")),label=payload.get("label"),into_id=payload.get("into_id"))

@app.get("/api/memory/graph/hidden")
async def memory_graph_hidden(profile_id:str="",project_id:str=""):
    from astra_ai.memory.category_policy import matches_scope
    return {"groups":[{"id":e['id'],"label":e['label']} for e in state.live_memory.load().get("entity_graph",{}).get("entities",{}).values() if e.get("state")=="forgotten" and matches_scope(e,profile_id,project_id)]}

@app.get("/api/memory/graph/proposals")
async def memory_graph_proposals(profile_id:str="",project_id:str=""):
    from astra_ai.memory.category_policy import matches_scope
    def proposals():
        m=state.live_memory.load();g=m.get("entity_graph",{});entities=g.get("entities",{})
        return {"status":"ok","proposals":[p for p in g.get("suggestions",{}).values() if p.get("state")=="pending" and all(e in entities and matches_scope(entities[e],profile_id,project_id) for e in (p['from'],p['to']))]}
    return await asyncio.to_thread(proposals)

def globe_connection(request):
    client_id=request.headers.get("X-Nova-Client", "")
    socket=ws_manager.websocket_for(client_id)
    paired=request.headers.get('x-nova-paired-device')
    if paired and workspace_service.store().windows.get(client_id,{}).get('device_id')!=paired:raise HTTPException(403,'Connection belongs to another device')
    if socket is None:raise HTTPException(403,"A connected local user session is required")
    if "profile_id" in request.query_params or "project_id" in request.query_params:raise HTTPException(403,"Memory scope is resolved by the server")
    live=state.live_sessions.get(socket)
    if live and getattr(live,"guest",False):return guest_memory,str(getattr(live,"profile_id","")),str(getattr(live,"project_id",""))
    return state.live_memory,str(getattr(live,"profile_id","")),str(getattr(live,"project_id",""))

@app.get('/api/memory/context/status')
async def memory_context_status(request:Request):
    manager,profile,project=globe_connection(request)
    client=request.headers.get('X-Nova-Client','')
    live=state.live_sessions.get(ws_manager.websocket_for(client))
    sid=getattr(live,'session_id',CHAT_SESSIONS.get(client,''))
    result=await asyncio.to_thread(manager.memory_context_action,'status')
    result['time']=await asyncio.to_thread(manager.time_action,'status',session_id=sid,profile_id=profile,project_id=project)
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,'Memory session changed')
    return result

@app.get("/api/memory/globe")
async def memory_globe(request:Request,cursor:str="",limit:int=500):
    from astra_ai.memory.globe_projection import page
    manager,profile,project=globe_connection(request)
    try:result=await asyncio.to_thread(page,manager,profile,project,cursor,limit)
    except ValueError:raise HTTPException(422,"Invalid globe request")
    except Exception:raise HTTPException(503,"Memory globe temporarily unavailable")
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
    return result

def _learning_context(request):
    manager,profile,project=globe_connection(request)
    if manager is not state.live_memory:raise HTTPException(403,"Learned tools require the owner context")
    client=request.headers.get('X-Nova-Client','');socket=ws_manager.websocket_for(client);live=state.live_sessions.get(socket)
    return {'client_id':client,'profile_id':profile,'project_id':project,'session_id':getattr(live,'session_id',CHAT_SESSIONS.get(client,''))}

@app.get('/api/learning/status')
async def learning_status(request:Request):
    context=_learning_context(request)
    if not capability_service or not learning_service:return {'status':'initializing'}
    return {'status':'ok','search_connector':{'provider':'serpapi','configured':bool(_get_env_value('SERPAPI_KEY')),'detailed_provider':'tavily','detailed_configured':bool(_get_env_value('TAVILY_API_KEY'))},'capabilities':await asyncio.to_thread(capability_service.status),'research':await asyncio.to_thread(learning_service.listing,context),'budget':await asyncio.to_thread(background_budget.snapshot)}

@app.post('/api/learning/action')
async def learning_action(request:Request,payload:Dict[str,Any]):
    context=_learning_context(request);context['user_text']=str(payload.get('user_text',''))
    if not learning_service or not capability_service:raise HTTPException(503,'Learning is initializing')
    from astra_ai.core.learning_declarations import dispatch
    result=await dispatch(payload.get('tool','research_action'),payload,context,str(payload.get('operation_id') or uuid.uuid4().hex),learning_service,capability_service)
    if _learning_context(request).get('session_id')!=context.get('session_id'):raise HTTPException(403,'User context changed; reload')
    return result

@app.get('/api/learning/reviews')
async def learning_reviews(request:Request):
    context=_learning_context(request)
    if not capability_service:return {'status':'initializing','items':[]}
    def items():
        data=capability_service.load()
        from astra_ai.memory.category_policy import matches_scope
        rows=[dict(r) for section in ('tools','repairs') for r in data[section].values() if matches_scope(r,context['profile_id'],context['project_id']) and r['state'] not in {'active','applied','rolled_back'}]
        for item in rows:
            if 'code' in item:item['preview']=capability_service._path(item['code']).read_text(encoding='utf-8')[:32000]
            if 'replacement' in item:
                import difflib
                before=capability_service._path(item['backup']).read_text(encoding='utf-8');after=capability_service._path(item['replacement']).read_text(encoding='utf-8')
                item['preview']=''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile=item['target'],tofile=item['target']))[:32000]
        return {'status':'ok','items':rows[-30:]}
    return await asyncio.to_thread(items)

@app.post('/api/learning/approve')
async def learning_approve(request:Request,payload:Dict[str,Any]):
    context=_learning_context(request)
    if not capability_service:raise HTTPException(503,'Learning is initializing')
    result=await asyncio.to_thread(capability_service.approve,str(payload.get('id','')),str(payload.get('expected_hash','')),context)
    if result.get('status')=='approved':
        item=capability_service.get(str(payload.get('id','')),context)['item']
        if 'target' in item:result['deployment']=await capability_service.apply_repair(item['id'],context)
        else:result['activation']=await capability_service.validate(item['id'],context)
    return result

@app.post("/api/memory/categories/action")
async def memory_category_action(request:Request,payload:Dict[str,Any]):
    manager,profile,project=globe_connection(request)
    args={k:v for k,v in payload.items() if k not in {'action','profile_id','project_id','operation_id'}}
    try:result=await asyncio.to_thread(manager.category_action,payload.get('action','list'),**args,profile_id=profile,project_id=project,operation_id=str(payload.get('operation_id','')))
    except (ValueError,TypeError):raise HTTPException(422,"Invalid category action")
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
    return result

@app.get("/api/memory/globe/history")
async def memory_globe_history(request:Request,day:str="",session_id:str="",query:str="",limit:int=20,offset:int=0):
    from astra_ai.memory.daily_history import history
    manager,profile,project=globe_connection(request)
    result=await asyncio.to_thread(history,manager,profile,project,day,session_id,query,limit,offset)
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
    return result


@app.post("/api/memory/globe/record/{record_id}/action")
async def memory_globe_action(record_id:str,payload:Dict[str,Any],request:Request):
    from astra_ai.memory.globe_actions import execute
    manager,profile,project=globe_connection(request)
    def apply():
        if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
        return execute(manager,record_id,payload,profile,project)
    try:result=await asyncio.to_thread(apply)
    except (ValueError,TypeError):raise HTTPException(422,"Invalid memory action")
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
    return result


@app.get("/api/memory/globe/record/{record_id}")
async def memory_globe_record(record_id:str,request:Request):
    from astra_ai.memory.globe_projection import detail
    manager,profile,project=globe_connection(request)
    try:result=await asyncio.to_thread(detail,manager,record_id,profile,project)
    except Exception:raise HTTPException(503,"Memory detail temporarily unavailable")
    if globe_connection(request)!=(manager,profile,project):raise HTTPException(403,"Memory session changed; reload")
    if not result['record']:raise HTTPException(404,"Memory is unavailable")
    return result

@app.get("/api/memory/graph")
async def memory_graph(category: str = "", profile_id: str = "", project_id: str = "", limit: int = 500, offset: int = 0, version: int = 1, focus: str = "", level: str = "overview", revision: str = "", timezone_name: str = "", sample: str = ""):
    if version==2:
        from astra_ai.memory.entity_graph import snapshot
        try:return await asyncio.to_thread(snapshot,state.live_memory,category=category,profile_id=profile_id,project_id=project_id,limit=limit,offset=offset,focus=focus,level=level,revision=revision,sample=sample,timezone_name=timezone_name or os.getenv("NOVA_USER_TIMEZONE","Europe/Madrid"))
        except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"graph_unavailable"})
    try:return await asyncio.to_thread(state.live_memory.graph_snapshot,category=category,profile_id=profile_id,project_id=project_id,limit=limit,offset=offset)
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.post("/api/memory/graph/edges")
async def memory_visible_graph_edges(payload:Dict[str,Any]):
    from astra_ai.memory.entity_graph import snapshot
    ids=payload.get('node_ids');revision=payload.get('revision')
    if not isinstance(ids,list) or len(ids)>1000 or any(not isinstance(i,str) or len(i)>160 for i in ids) or not isinstance(revision,str):
        raise HTTPException(422,"Expected at most 1000 visible node IDs and graph revision")
    try:
        result=await asyncio.to_thread(snapshot,state.live_memory,profile_id=str(payload.get('profile_id','')),project_id=str(payload.get('project_id','')),timezone_name=str(payload.get('timezone_name') or os.getenv('NOVA_USER_TIMEZONE','Europe/Madrid')),level='detail',node_ids=ids,revision=revision)
        return {'status':result['status'],'revision':result['revision'],'edges':result.get('edges',[])}
    except Exception:return JSONResponse(status_code=503,content={'status':'failed','reason':'graph_unavailable'})

@app.get("/api/memory/graph/conversation")
async def memory_graph_conversation(session_id: str, profile_id: str = "", project_id: str = "", limit: int = 20, offset: int = 0, turn_id: str = ""):
    try:return await asyncio.to_thread(state.live_memory.graph_session_details,session_id,profile_id=profile_id,project_id=project_id,limit=limit,offset=offset,turn_id=turn_id)
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.get("/api/memory/categories")
async def memory_categories(request:Request):
    manager,profile,project=globe_connection(request)
    try:return await asyncio.to_thread(manager.category_catalog,profile,project)
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.get("/api/memory/records")
async def memory_records(category: str = "", lifecycle: str = "all", query: str = "", limit: int = 20, offset: int = 0, profile_id: str = "", project_id: str = "", scope: Optional[str] = None, session_id: str = "", source: str = "", kind: str = "", event_type: str = "", since: str = "", until: str = ""):
    try:return await asyncio.to_thread(state.live_memory.list_records,limit,offset,category=category,lifecycle=lifecycle,query=query,profile_id=profile_id,project_id=project_id,scope=scope,session_id=session_id,source=source,kind=kind,event_type=event_type,since=since,until=until)
    except (ValueError,TypeError):raise HTTPException(status_code=422,detail="Invalid memory filters")
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.post("/api/session/end")
async def end_memory_session(data: Dict[str, Any]):
    try:return await asyncio.to_thread(state.live_memory.end_session,str(data.get("session_id") or state.current_user_session))
    except Exception:return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.get("/api/memory/forgotten")
async def forgotten_memories(query: str = "", limit: int = 20):
    try:
        return await asyncio.to_thread(state.live_memory.memory_action,"search_forgotten" if query.strip() else "list_forgotten",query=query,limit=limit)
    except Exception:
        logger.exception("Forgotten memory access failed")
        return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.post("/api/memory/action")
async def manage_memory(data: Dict[str, Any]):
    action=str(data.get("action",""));args={k:v for k,v in data.items() if k!="action"}
    if action in {"create_fact","create_event","update"}:
        args["metadata"]={"source":"human","evidence":str(data.get("evidence") or data.get("value","")),"session_id":str(data.get("session_id","")),**{k:data[k] for k in ("profile_id","project_id","scope","valid_from","valid_until","explicit_preference","inferred","evidence_refs") if k in data}}
    try:
        return await asyncio.to_thread(state.live_memory.memory_action,action,**args)
    except (TypeError,ValueError):
        raise HTTPException(status_code=422,detail="Invalid memory action")
    except Exception:
        logger.exception("Memory management failed")
        return JSONResponse(status_code=503,content={"status":"failed","reason":"memory_storage_unavailable"})

@app.get("/api/memory/pending")
async def pending_memories():
    memory=await asyncio.to_thread(state.live_memory.load)
    return {"status":"ok","proposals":list(memory.get("pending_approvals",{}).values())}


@app.post("/api/memory/approve")
async def approve_memory(data: Dict[str, Any]):
    if not isinstance(data.get("approved"),bool) or not data.get("approval_id"):
        raise HTTPException(status_code=422,detail="Specific approval_id and boolean approved required")
    return await asyncio.to_thread(state.live_memory.approve,str(data["approval_id"]),data["approved"])


@app.post("/api/session/new")
async def create_new_session(data: Dict[str, Any]):
    """Create a new conversation session"""
    session_id = data.get("session_id", f"session_{int(datetime.now().timestamp())}")
    state.current_user_session = session_id
    
    return {
        "session_id": session_id,
        "status": "created",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/logs")
async def get_logs(lines: int = 100):
    """Get recent server logs"""
    try:
        with open(runtime_paths.logs/"aegis_server.log", "r") as f:
            log_lines = f.readlines()[-lines:]
        return {
            "logs": log_lines,
            "count": len(log_lines),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "logs": [],
            "timestamp": datetime.now().isoformat()
        }


@app.post("/api/generate-image")
async def generate_image_endpoint(data: Dict[str, Any]):
    """Generate an image using the documented widget flow: Gemini prompt enhancement + Pollinations render."""
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    config = load_image_generation_config()
    if not config.get("enabled", True):
        raise HTTPException(status_code=503, detail="Image generation is disabled in config")
    if config.get("provider") not in {"google", "google_gemini_api", "auto"}:
        raise HTTPException(status_code=501, detail="Only Gemini-enhanced Pollinations generation is supported currently")
    if not state.image_generation_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "provider": "pollinations",
                "model": "pollinations-free",
                "error_code": "IMAGE_GENERATION_IN_PROGRESS",
                "message": "An image is already being generated.",
                "action_required": "Wait for the current image generation request to finish, then retry.",
            },
        )

    try:
        enhanced_prompt = await asyncio.to_thread(
            _enhance_prompt_with_gemini,
            prompt,
            config.get("api_key", ""),
        )
        pollinations_key = config.get("pollinations_api_key", "")
        pollinations_model = "pollinations-flux" if (pollinations_key or "").strip().startswith(("sk_", "pk_")) else "pollinations-free"
        image_uri = await asyncio.to_thread(
            _generate_image_rest,
            enhanced_prompt,
            config.get("model", "gemini-2.5-flash-image"),
            pollinations_key,
        )
        
        # Backup image after successful generation
        backup_filename = None
        try:
            backup_filename = state.image_backup.save_image_backup(
                image_uri,
                prompt,
                "pollinations"
            )
            if backup_filename:
                logger.info(f"[IMAGE] Successfully backed up image: {backup_filename}")
            else:
                logger.warning("[IMAGE] Image backup returned None (may have already been logged)")
        except Exception as backup_error:
            # Log backup errors but don't interrupt the response
            logger.error(f"[IMAGE] Image backup failed (non-blocking): {backup_error}")
        
        return {
            "success": True,
            "image": image_uri,
            "prompt": prompt,
            "provider": "pollinations",
            "model": pollinations_model,
            "backup_id": backup_filename,
            "created_at": datetime.utcnow().isoformat(),
            "enhanced_prompt": enhanced_prompt if enhanced_prompt != prompt else None,
        }
    except ImageGenerationFailure as e:
        logger.error(f"[IMAGE] Image generation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=_image_error_detail(e))
    except Exception as e:
        logger.error(f"[IMAGE] Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        state.image_generation_lock.release()


@app.post("/api/recreate-image")
async def recreate_image_endpoint(
    instruction: str = Form(...),
    image: UploadFile = File(...),
):
    """Recreate or remix an uploaded image using Gemini reverse prompting and Pollinations rendering."""
    trimmed_instruction = (instruction or "").strip()
    if not trimmed_instruction:
        raise HTTPException(status_code=400, detail="Instruction is required")

    supported_types = {"image/jpeg", "image/png", "image/webp"}
    if image.content_type not in supported_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP images are supported")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Uploaded image exceeds the 10MB limit")

    config = load_image_generation_config()
    if not config.get("enabled", True):
        raise HTTPException(status_code=503, detail="Image generation is disabled in config")
    if config.get("provider") not in {"google", "google_gemini_api", "auto"}:
        raise HTTPException(status_code=501, detail="Only Gemini-enhanced Pollinations generation is supported currently")
    if not state.image_generation_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "provider": "pollinations",
                "model": "pollinations-free",
                "error_code": "IMAGE_GENERATION_IN_PROGRESS",
                "message": "An image is already being generated.",
                "action_required": "Wait for the current image generation request to finish, then retry.",
            },
        )

    try:
        source_image_id = await asyncio.to_thread(
            state.image_backup.save_source_image,
            image_bytes,
            image.content_type,
        )
        enhanced_prompt = await asyncio.to_thread(
            _reverse_prompt_image_with_gemini,
            trimmed_instruction,
            image_bytes,
            image.content_type,
            config.get("api_key", ""),
        )
        pollinations_key = config.get("pollinations_api_key", "")
        pollinations_model = "pollinations-flux" if (pollinations_key or "").strip().startswith(("sk_", "pk_")) else "pollinations-free"
        image_uri = await asyncio.to_thread(
            _generate_image_rest,
            enhanced_prompt,
            config.get("model", "gemini-2.5-flash-image"),
            pollinations_key,
        )

        backup_filename = None
        try:
            backup_filename = state.image_backup.save_image_backup(
                image_uri,
                trimmed_instruction,
                "pollinations",
                kind="recreated",
                source_image_id=source_image_id,
            )
            if backup_filename:
                logger.info("[IMAGE] Successfully backed up recreated image: %s", backup_filename)
            else:
                logger.warning("[IMAGE] Recreated image backup returned None")
        except Exception as backup_error:
            logger.error("[IMAGE] Recreated image backup failed (non-blocking): %s", backup_error)

        return {
            "success": True,
            "image": image_uri,
            "prompt": trimmed_instruction,
            "provider": "pollinations",
            "model": pollinations_model,
            "backup_id": backup_filename,
            "created_at": datetime.utcnow().isoformat(),
            "enhanced_prompt": enhanced_prompt,
            "kind": "recreated",
            "source_image_id": source_image_id,
        }
    except ImageGenerationFailure as e:
        logger.error(f"[IMAGE] Image recreation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=_image_error_detail(e))
    except Exception as e:
        logger.error(f"[IMAGE] Image recreation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        state.image_generation_lock.release()


@app.post("/api/generate-ai-audio")
async def generate_ai_audio(data: Dict[str, Any]):
    """
    Endpoint for generating audio from AI text and broadcasting to clients.
    
    This endpoint receives AI response text and:
    1. Generates audio via ElevenLabs TTS
    2. Broadcasts audio to ALL connected WebSocket clients
    3. Frontend receives and plays audio with orb animation sync
    
    Request: {"text": "AI response here"}
    Response: {"success": true, "audio": "base64", "sent_to_clients": N}
    """
    text = data.get("text", "").strip()
    
    if not text:
        logger.warning("[WARNING]  Empty text in /api/generate-ai-audio")
        return {
            "success": False,
            "error": "Empty text",
            "audio": None,
            "sent_to_clients": 0
        }
    
    logger.info(f"\n[BROADCAST] [AUDIO-GEN] Generating audio for text")
    logger.info(f"   Text: {text[:100]}...")
    
    try:
        # Generate audio via ElevenLabs
        logger.info(f"[TTS] [TTS] Generating audio...")
        audio_b64 = await generate_audio_base64(text)
        
        if not audio_b64:
            logger.error("[ERROR] [TTS] Failed to generate audio")
            return {
                "success": False,
                "error": "Audio generation failed",
                "audio": None,
                "sent_to_clients": 0
            }
        
        logger.info(f"[OK] [TTS] Audio generated: {len(audio_b64)} chars Base64")
        
        # Broadcast to all connected WebSocket clients
        broadcast_message = {
            "type": "response_audio",
            "audio": audio_b64,
            "format": "mp3",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"[BROADCAST] Broadcasting audio to {len(ws_manager.connections)} connected clients...")
        await ws_manager.broadcast(broadcast_message)
        
        logger.info(f"[OK] [COMPLETE] Audio broadcast to {len(ws_manager.connections)} clients\n")
        
        return {
            "success": True,
            "audio": audio_b64,
            "format": "mp3",
            "sent_to_clients": len(ws_manager.connections),
            "message": "Audio generated and broadcast to all connected clients"
        }
    
    except Exception as e:
        logger.error(f"[ERROR] [WATCHER ENDPOINT] Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "audio": None,
            "sent_to_clients": 0
        }


@app.get("/api/audio/diagnostics")
async def audio_diagnostics():
    """Diagnose the audio pipeline and Aegis AI subprocess status"""
    return {
        "aegis_ai_subprocess": {
            "running": state.aegis_ai.is_running if state.aegis_ai else False,
            "initialized": state.aegis_ai.is_running if state.aegis_ai else False,
            "process_id": state.aegis_ai.process.pid if state.aegis_ai and state.aegis_ai.process else None
        },
        "tts_enabled": ServerConfig.TTS_ENABLED,
        "audio_format": {
            "codec": "mp3",
            "provider": "ElevenLabs",
            "webAudioCompatible": True
        },
        "pipeline": {
            "flow": "User Input → Aegis AI (subprocess stdin/stdout) → ElevenLabs TTS → MP3 → Base64 → WebSocket → Web Audio API",
            "decoding": "AudioContext.decodeAudioData()",
            "analysis": "AnalyserNode with real-time frequency extraction",
            "visualization": "Orb animation synced to audio frequencies"
        },
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# IMAGE BACKUP ENDPOINTS
# ============================================================================

@app.get("/api/images/backup/index")
async def get_image_backup_index():
    """Get the complete image backup index with all metadata"""
    try:
        index = state.image_backup.get_index()
        return {
            "success": True,
            "total_images": index.get("total_images", 0),
            "last_updated": index.get("last_updated"),
            "images": index.get("images", [])
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve image index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/count")
async def get_image_backup_count():
    """Get total count of backed-up images"""
    try:
        count = state.image_backup.get_images_count()
        return {
            "success": True,
            "total_images": count
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to get image count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/recent")
async def get_recent_backup_images(limit: int = 10):
    """Get most recent backed-up images with metadata"""
    try:
        if limit < 1 or limit > 100:
            limit = 10
        
        images = state.image_backup.get_recent_images(limit)
        return {
            "success": True,
            "count": len(images),
            "images": images
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve recent images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/file/{filename}")
async def get_backup_image_file(filename: str):
    """
    Download a specific backed-up image file by filename.
    
    Example: GET /api/images/backup/file/20260525_143022_a1b2c3d4.jpg
    """
    try:
        # Security: sanitize filename to prevent path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        filepath = state.image_backup.get_image_by_id(filename)
        
        if not filepath:
            raise HTTPException(status_code=404, detail=f"Image not found: {filename}")
        
        logger.info(f"[BACKUP] Serving backed-up image: {filename}")
        
        # Determine MIME type from file extension
        ext = filepath.suffix.lower()
        mime_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".bmp": "image/bmp"
        }.get(ext, "image/jpeg")
        
        return FileResponse(
            filepath,
            media_type=mime_type,
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve image file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/images/backup/file/{filename}")
async def delete_backup_image_file(filename: str):
    """Delete a saved gallery image by its stable backup ID."""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    try:
        deleted = await asyncio.to_thread(state.image_backup.delete_image, filename)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Image not found: {filename}")
        return {
            "success": True,
            "deleted_id": filename,
            "index": state.image_backup.get_index(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BACKUP] Failed to delete image file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/search")
async def search_backup_images(query: str):
    """
    Search backed-up images by prompt text (case-insensitive substring match).
    
    Example: GET /api/images/backup/search?query=landscape
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
        
        results = state.image_backup.search_by_prompt(query)
        return {
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BACKUP] Failed to search images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/provider/{provider}")
async def get_images_by_provider(provider: str):
    """
    Get all images generated by a specific provider.
    
    Example: GET /api/images/backup/provider/google
    """
    try:
        images = state.image_backup.get_images_by_provider(provider)
        return {
            "success": True,
            "provider": provider,
            "count": len(images),
            "images": images
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve images by provider: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CONFIGURATION & SERVER MANAGEMENT
# ============================================================================

@app.get("/api/config/status")
async def get_config_status():
    """
    Get current API configuration status
    Returns loaded API keys (masked for security)
    """
    try:
        def masked(value: str) -> str:
            value = str(value or "")
            return "" if not value else f"configured-…{value[-4:]}"

        # Never return raw credentials to the browser.
        api_keys = {
            "groq_api_key": masked(_get_groq_api_key()),
            "groq_api_key_status": bool(_get_groq_api_key()),
            "elevenlabs_api_key": masked(os.getenv("ELEVENLABS_API_KEY", "") or os.getenv("elevenlabs_api_key", "")),
            "elevenlabs_api_key_status": bool(os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")),
            "elevenlabs_voice_id": os.getenv("elevenlabs_voice_id", "") or os.getenv("ELEVENLABS_VOICE_ID", "MuWZEhlucXEKPv3WaubS"),
            "deepgram_api_key": masked(os.getenv("DEEPGRAM_API_KEY", "")),
            "deepgram_api_key_status": bool(os.getenv("DEEPGRAM_API_KEY")),
            "weather_api_key": masked(os.getenv("WEATHER_API_KEY", "")),
            "weather_api_key_status": bool(os.getenv("WEATHER_API_KEY")),
        }
        
        return {
            "server_running": True,
            "server_port": 8340,
            "api_keys_loaded": api_keys,
            "uptime_seconds": 0
        }
    except Exception as e:
        logger.error(f"[CONFIG] Error getting status: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/config/update")
async def update_config(config: Dict[str, Any]):
    """
    Update API configuration (API keys, voice IDs, etc.)
    Writes to .env file temporarily
    """
    try:
        env_file = ROOT_ENV_FILE
        
        if not env_file.exists():
            return JSONResponse(
                status_code=400,
                content={"error": ".env file not found"}
            )
        
        # Read existing .env
        with open(env_file, 'r') as f:
            lines = f.readlines()
        
        # Update or add new keys
        env_dict = {}
        for line in lines:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_dict[key] = value
        
        # Update with new values
        if 'groq_api_key' in config and config['groq_api_key']:
            env_dict['GROQ_API_KEY'] = config['groq_api_key']
        if 'elevenlabs_api_key' in config and config['elevenlabs_api_key']:
            env_dict['ELEVENLABS_API_KEY'] = config['elevenlabs_api_key']
        if 'elevenlabs_voice_id' in config and config['elevenlabs_voice_id']:
            env_dict['elevenlabs_voice_id'] = config['elevenlabs_voice_id']
        if 'deepgram_api_key' in config and config['deepgram_api_key']:
            env_dict['DEEPGRAM_API_KEY'] = config['deepgram_api_key']
        if 'weather_api_key' in config and config['weather_api_key']:
            env_dict['WEATHER_API_KEY'] = config['weather_api_key']
        
        # Write back to .env
        with open(env_file, 'w') as f:
            for key, value in env_dict.items():
                f.write(f"{key}={value}\n")
        
        logger.info(f"[CONFIG] Updated .env with new API keys")
        return {"success": True, "message": "Configuration updated"}
    
    except Exception as e:
        logger.error(f"[CONFIG] Error updating config: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/config/test")
async def test_config(config: Dict[str, Any]):
    """
    Test API keys before saving
    Returns status of each API key
    """
    results = {
        "groq": {"success": False, "error": None},
        "elevenlabs": {"success": False, "error": None},
        "deepgram": {"success": False, "error": None},
    }
    
    # Test Groq API
    if config.get('groq_api_key'):
        try:
            import requests as req
            response = req.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {config['groq_api_key']}"},
                json={
                    "model": "mixtral-8x7b-32768",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                },
                timeout=5
            )
            results["groq"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["groq"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["groq"]["error"] = str(e)
    
    # Test ElevenLabs API
    if config.get('elevenlabs_api_key'):
        try:
            import requests as req
            voice_id = config.get('elevenlabs_voice_id', 'pNInz6obpgDQGcFmaJgO')
            response = req.get(
                f"https://api.elevenlabs.io/v1/voices/{voice_id}",
                headers={"xi-api-key": config['elevenlabs_api_key']},
                timeout=5
            )
            results["elevenlabs"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["elevenlabs"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["elevenlabs"]["error"] = str(e)
    
    # Test Deepgram API
    if config.get('deepgram_api_key'):
        try:
            import requests as req
            response = req.get(
                "https://api.deepgram.com/v1/status",
                headers={"Authorization": f"Token {config['deepgram_api_key']}"},
                timeout=5
            )
            results["deepgram"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["deepgram"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["deepgram"]["error"] = str(e)
    
    logger.info(f"[CONFIG] Test results: {results}")
    return results


@app.post("/api/server/restart")
async def request_supervised_restart():
    import httpx
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.post("http://127.0.0.1:8341/api/runtime/restart", headers={"X-Nova-Runtime-Token": os.environ.get("NOVA_RUNTIME_TOKEN", "")})
        return JSONResponse(status_code=response.status_code, content=response.json())
    except Exception:
        return JSONResponse(status_code=503, content={"error": "Runtime supervisor unavailable. Start Nova using start_nova_ai.ps1."})


_preferences_lock = threading.RLock()
_preferences_path = runtime_paths.system/"user_preferences.json"

@app.get("/api/settings/preferences")
async def get_user_preferences():
    def read_preferences():
        with _preferences_lock:
            if not _preferences_path.exists(): return {"user_name":"","honorific":"sir","calendar_accounts":""}
            data=json.loads(_preferences_path.read_text(encoding="utf-8"))
            if not isinstance(data,dict): raise ValueError("Invalid preferences file")
            result = {k:str(data.get(k,default)) for k,default in {"user_name":"","honorific":"sir","calendar_accounts":""}.items()}
            result["honorific"] = result["honorific"].lower()
            return result
    try: return await asyncio.to_thread(read_preferences)
    except Exception: raise HTTPException(503,"Preferences could not be read. Existing data was preserved.")

@app.post("/api/settings/preferences")
async def save_user_preferences(payload:Dict[str,Any]):
    def save():
        from theme_state import _atomic_json
        with _preferences_lock:
            current={"user_name":"","honorific":"sir","calendar_accounts":""}
            if _preferences_path.exists(): current.update(json.loads(_preferences_path.read_text(encoding="utf-8")))
            for key in current:
                if key in payload:
                    if not isinstance(payload[key],str) or len(payload[key])>500: raise ValueError("Invalid preference value")
                    current[key]=payload[key].strip()
            current["honorific"] = current["honorific"].lower()
            if current["honorific"] not in {"sir","ma'am","none"}: raise ValueError("Invalid honorific")
            _atomic_json(_preferences_path,current)
            return {"status":"saved",**current}
    try:
        result=await asyncio.to_thread(save)
        scopes={row['scope']:workspace_service.context(client) for client,row in workspace_service.store().windows.items()}
        for context in scopes.values():await workspace_service.emit(context,'preferences')
        return result
    except ValueError as exc:raise HTTPException(400,str(exc))
    except Exception:raise HTTPException(503,"Preferences could not be saved. Your draft was preserved.")


@app.get("/api/settings/status")
async def get_settings_status():
    """
    Get complete system status for the settings panel
    Reports which services are actually connected and working
    """
    try:
        # Check Aegis AI subprocess connection
        aegis_ai_connected = state.aegis_ai and state.aegis_ai.is_running
        
        # Check Google Calendar connection (placeholder - return False for now)
        # TODO: Implement Google Calendar API connection check
        google_calendar_accessible = False
        
        # Check Google Mail connection (placeholder - return False for now)
        # TODO: Implement Google Mail API connection check
        google_mail_accessible = False
        
        # Check which API keys are configured in environment
        env_keys_set = {
            "openai_research": bool(_get_env_value("NOVA_RESEARCH_OPENAI_API_KEY")),
            "quick_search": bool(_get_env_value("QUICK_SEARCH_API_KEY") or _get_env_value("SERPAPI_KEY")),
            "deep_research": bool(_get_env_value("DEEP_RESEARCH_API_KEY") or _get_env_value("TAVILY_API_KEY")),
            "gemini": bool(state.gemini_api_key),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")),
            "elevenlabs_voice_id": bool(os.getenv("elevenlabs_voice_id") or os.getenv("ELEVENLABS_VOICE_ID"))
        }
        
        # Get system info
        uptime = time.time() - state.start_time
        
        return {
            "aegis_ai_connected": bool(aegis_ai_connected or state.live_sessions),
            "gemini_live_configured": bool(state.gemini_api_key),
            "models": MODEL_STATUS,
            "research_writer": await asyncio.to_thread(research_provider_settings.status) if research_provider_settings else None,
            "google_calendar_accessible": google_calendar_accessible,
            "google_mail_accessible": google_mail_accessible,
            "server_port": ServerConfig.PORT,
            "uptime_seconds": int(uptime),
            "env_keys_set": env_keys_set,
            "memory_count": sum(c["counts"]["active"] for c in (await asyncio.to_thread(state.live_memory.category_catalog))["categories"]),
            "task_count": len(ws_manager.connections) if ws_manager else 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[SETTINGS] Error getting status: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/settings/test-elevenlabs")
async def test_elevenlabs(data: Dict[str, Any]):
    """
    Test ElevenLabs API key by attempting a simple request
    """
    try:
        api_key = data.get("api_key", "").strip()
        
        if not api_key:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "error": "API key cannot be empty"}
            )
        
        # Test ElevenLabs API by getting list of voices
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("[ELEVENLABS] Test passed - API key is valid")
            return {
                "valid": True,
                "message": "ElevenLabs API key is valid"
            }
        elif response.status_code == 401:
            logger.warning("[ELEVENLABS] Test failed - Invalid API key")
            return {
                "valid": False,
                "error": "Invalid API key"
            }
        else:
            logger.warning(f"[ELEVENLABS] Test failed - HTTP {response.status_code}")
            return {
                "valid": False,
                "error": f"ElevenLabs API error: HTTP {response.status_code}"
            }
    
    except requests.exceptions.Timeout:
        logger.error("[ELEVENLABS] Test timeout")
        return {
            "valid": False,
            "error": "Request timeout - check your internet connection"
        }
    except Exception as e:
        logger.error(f"[ELEVENLABS] Test error: {e}")
        return {
            "valid": False,
            "error": str(e)
        }


@app.post("/api/settings/test-groq")
async def test_groq(data: Dict[str, Any]):
    """
    Test Groq API key by attempting a simple request
    """
    try:
        api_key = data.get("api_key", "").strip()
        
        if not api_key:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "error": "API key cannot be empty"}
            )
        
        # Test Groq API by making a simple chat completion request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": "Say 'test'"}],
            "model": "mixtral-8x7b-32768",
            "max_tokens": 10
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("[GROQ] Test passed - API key is valid")
            return {
                "valid": True,
                "message": "Groq API key is valid"
            }
        elif response.status_code == 401:
            logger.warning("[GROQ] Test failed - Invalid API key")
            return {
                "valid": False,
                "error": "Invalid API key"
            }
        else:
            logger.warning(f"[GROQ] Test failed - HTTP {response.status_code}")
            return {
                "valid": False,
                "error": f"Groq API error: HTTP {response.status_code}"
            }
    
    except requests.exceptions.Timeout:
        logger.error("[GROQ] Test timeout")
        return {
            "valid": False,
            "error": "Request timeout - check your internet connection"
        }
    except Exception as e:
        logger.error(f"[GROQ] Test error: {e}")
        return {
            "valid": False,
            "error": str(e)
        }


@app.get('/api/settings/research-provider')
async def research_provider_status(request:Request):
    _learning_context(request)
    if research_provider_settings is None:raise HTTPException(503,'Research settings are initializing.')
    return await asyncio.to_thread(research_provider_settings.status)


@app.post('/api/settings/research-provider')
async def activate_research_provider(request:Request,data:Dict[str,Any]):
    _learning_context(request)
    if research_provider_settings is None:raise HTTPException(503,'Research settings are initializing.')
    try:
        result=await research_provider_settings.activate(data.get('provider'),data.get('model'))
        if research_model.provider!='none':
            from astra_ai.core.research_model import resume_research_budget_waits
            artifacts,_=get_research_services()
            await asyncio.to_thread(resume_research_budget_waits,action_jobs,artifacts,research_model.budget,
                provider_key=research_model.key_provider(),budget_scope=research_model.budget_scope,allow_fallback=hasattr(research_model,'fallback_key') and bool(research_model.fallback_key()))
        return result
    except ValueError as exc:raise HTTPException(400,str(exc))
    except TimeoutError as exc:raise HTTPException(409,str(exc))
    except OSError:raise HTTPException(503,'Research settings could not be saved. The previous provider remains active.')


@app.post("/api/settings/keys")
async def save_api_keys(data: Dict[str, Any]):
    """
    Save API keys to environment (.env file)
    Expects: {"key_name": "GROQ_API_KEY", "key_value": "..."}
    """
    try:
        key_name = data.get("key_name", "").strip()
        key_value = data.get("key_value", "").strip()
        
        if not key_name or not key_value:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Key name and value required"}
            )

        # Normalize commonly used key names for consistent env storage
        if key_name.lower() in {"gemini_api_key", "google_api_key"}:
            key_name = "GEMINI_API_KEY"
        elif key_name.lower() == "elevenlabs_api_key":
            key_name = "ELEVENLABS_API_KEY"
        elif key_name.lower() == "groq_api_key":
            key_name = "GROQ_API_KEY"
        elif key_name.lower() == "deepgram_api_key":
            key_name = "DEEPGRAM_API_KEY"
        elif key_name.lower() == "weather_api_key":
            key_name = "WEATHER_API_KEY"
        elif key_name.lower() == "elevenlabs_voice_id":
            key_name = "elevenlabs_voice_id"
        elif key_name.lower() == "nova_research_openai_api_key":
            key_name = "NOVA_RESEARCH_OPENAI_API_KEY"
        elif key_name.lower() == "nova_research_gemini_api_key":
            key_name = "NOVA_RESEARCH_GEMINI_API_KEY"
        if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',key_name) or any(c in key_value for c in '\r\n\0'):
            return JSONResponse(status_code=400,content={"success":False,"error":"Invalid key name or value"})
        
        # Get .env file path
        env_file = ROOT_ENV_FILE
        
        if not env_file.exists():
            # Create .env if it doesn't exist
            env_file.touch()
            logger.info(f"[SETTINGS] Created new .env file: {env_file}")
        
        from astra_ai.ui.backend.research_provider_settings import write_environment
        previous_research_key=research_model.key_provider() if research_model is not None and getattr(research_model,'provider','')=='gemini' else ''
        await asyncio.to_thread(write_environment,env_file,{key_name:key_value})
        
        # Reload environment variables
        load_dotenv(env_file, override=True)
        if key_name == "GEMINI_API_KEY":
            state.gemini_api_key = key_value
            os.environ["GEMINI_API_KEY"] = key_value
            os.environ.pop("GOOGLE_API_KEY", None)
        if key_name in {'GEMINI_API_KEY','NOVA_RESEARCH_GEMINI_API_KEY'} and research_model is not None and getattr(research_model,'provider','')=='gemini':
            await asyncio.to_thread(research_model.budget.provider_changed,previous_research_key,research_model.key_provider())
            from astra_ai.core.research_model import resume_research_budget_waits
            artifacts,_=get_research_services()
            await asyncio.to_thread(resume_research_budget_waits,action_jobs,artifacts,research_model.budget,provider_key=research_model.key_provider(),budget_scope=research_model.budget_scope,allow_fallback=hasattr(research_model,'fallback_key') and bool(research_model.fallback_key()))
        
        logger.info(f"[SETTINGS] Saved {key_name} to .env")
        
        return {
            "success": True,
            "message": f"API key {key_name} saved successfully"
        }
    
    except Exception as e:
        logger.error(f"[SETTINGS] Error saving keys: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


@app.get("/api/search/state")
async def get_search_widget_state():
    return {
        "current": state.search_widget_context.get("current", {}),
        "history": state.get_search_history_preview(),
    }


@app.post("/api/search/run")
async def run_search_widget(data: Dict[str, Any], request: Request):
    """Compatibility adapter to scoped artifact research and the same widget action."""
    query=str(data.get('query') or '').strip()
    if not query:return JSONResponse(status_code=400,content={'success':False,'error':'query is required'})
    context=_learning_context(request);request_id=str(data.get('request_id') or uuid.uuid4().hex)
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,128}',request_id):raise HTTPException(422,'Invalid request identifier')
    result=await _dispatch_aegis_tool('search_widget_action',{'action':'run','query':query,'mode':data.get('mode','detailed')},{**context,'request_id':request_id,'user_text':'Search for '+query},request_id)
    success=result.get('status')=='completed'
    payload={'success':success,'research':result,'current':state.search_widget_context.get('current',{}),'history':state.get_search_history_preview()}
    return payload if success else JSONResponse(status_code=502,content={**payload,'error':result.get('reason','Research unavailable')})


@app.get("/api/search/history")
async def get_search_widget_history():
    return {"history": state.get_search_history_preview()}


@app.get("/api/search/history/match")
async def match_search_widget_history(query: str):
    cleaned_query = str(query or "").strip()
    if not cleaned_query:
        return JSONResponse(status_code=400, content={"success": False, "error": "query is required"})
    return {"success": True, "matches": state.find_search_requests(cleaned_query)}


@app.post("/api/search/history/restore")
async def restore_search_widget_history(data: Dict[str, Any]):
    request_id = str(data.get("request_id") or "").strip()
    if not request_id:
        return JSONResponse(status_code=400, content={"success": False, "error": "request_id is required"})
    try:
        restored = state.restore_search_request(request_id)
        snapshot = build_frontend_payload(restored)
        if snapshot:
            await ws_manager.broadcast(snapshot)
        return {"success": True, **(snapshot or {"current": restored.get("current", {})})}
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "Search record not found"})


@app.post("/api/search/history/restore-latest")
async def restore_latest_search_widget_history():
    try:
        restored = state.restore_latest_search_request()
        snapshot = build_frontend_payload(restored)
        if snapshot:
            await ws_manager.broadcast(snapshot)
        return {"success": True, **(snapshot or {"current": restored.get("current", {})})}
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "No saved search history found"})


@app.post("/api/search/clear-current")
async def clear_current_search_widget_result():
    updated = state.update_search_widget_context({"widget": "search", "command": "clear_current", "source": "server_api"})
    snapshot = build_frontend_payload(updated)
    if snapshot:
        await ws_manager.broadcast(snapshot)
    return {
        "success": True,
        "current": updated.get("current", {}),
        "history": state.get_search_history_preview(),
    }


@app.post("/api/search/history/delete")
async def delete_search_widget_history(data: Dict[str, Any]):
    request_id = str(data.get("request_id") or "").strip()
    if not request_id:
        return JSONResponse(status_code=400, content={"success": False, "error": "request_id is required"})
    try:
        updated = state.delete_search_request(request_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "Search record not found"})
    await ws_manager.broadcast({
        "type": "widget_control",
        "widget": "search",
        "command": "show_history",
        "source": "server_state",
        "history_preview": state.get_search_history_preview(),
        "view_mode": "history",
    })
    return {
        "success": True,
        "current": updated.get("current", {}),
        "history": state.get_search_history_preview(),
    }


@app.get("/api/news/state")
async def get_news_widget_state():
    return {"current": state.news_widget_context.get("current", {}), "history": state.get_news_history_preview()}


@app.get("/api/news/layouts")
async def get_news_widget_layouts():
    return state.get_news_layouts()


@app.post("/api/news/layouts")
async def create_news_widget_layout(data: Dict[str, Any]):
    try:
        return state.create_news_layout(data)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@app.put("/api/news/layouts/{layout_id}")
async def update_news_widget_layout(layout_id: str, data: Dict[str, Any]):
    try:
        return state.update_news_layout(layout_id, data)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "News layout not found"})
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@app.post("/api/news/layouts/{layout_id}/activate")
async def activate_news_widget_layout(layout_id: str):
    try:
        return state.activate_news_layout(layout_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "News layout not found"})


@app.delete("/api/news/layouts/{layout_id}")
async def delete_news_widget_layout(layout_id: str):
    try:
        return state.delete_news_layout(layout_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "News layout not found"})
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@app.get("/api/news/history")
async def get_news_widget_history():
    return {"history": state.get_news_history_preview()}


@app.get("/api/news/history/match")
async def match_news_widget_history(query: str):
    if not str(query or "").strip():
        return JSONResponse(status_code=400, content={"success": False, "error": "query is required"})
    return {"success": True, "matches": state.find_news_requests(query)}


@app.post("/api/news/history/restore")
async def restore_news_widget_history(data: Dict[str, Any]):
    request_id = str(data.get("request_id") or "").strip()
    if not request_id:
        return JSONResponse(status_code=400, content={"success": False, "error": "request_id is required"})
    try:
        snapshot = build_news_frontend_payload(state.restore_news_request(request_id))
        await ws_manager.broadcast(snapshot)
        return {"success": True, **snapshot}
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "News record not found"})


@app.post("/api/news/history/restore-latest")
async def restore_latest_news_widget_history():
    try:
        snapshot = build_news_frontend_payload(state.restore_latest_news_request())
        await ws_manager.broadcast(snapshot)
        return {"success": True, **snapshot}
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "No saved news history found"})


@app.post("/api/news/clear-current")
async def clear_current_news_widget_result():
    updated = state.update_news_widget_context({"widget": "news", "command": "clear_current", "source": "server_api"})
    snapshot = build_news_frontend_payload(updated)
    await ws_manager.broadcast(snapshot)
    return {"success": True, "current": updated.get("current", {}), "history": state.get_news_history_preview()}


@app.post("/api/news/history/delete")
async def delete_news_widget_history(data: Dict[str, Any]):
    request_id = str(data.get("request_id") or "").strip()
    if not request_id:
        return JSONResponse(status_code=400, content={"success": False, "error": "request_id is required"})
    mode = str(data.get("mode") or "permanent").strip().lower()
    try:
        updated = state.archive_news_request(request_id) if mode == "archive" else state.delete_news_request(request_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "News record not found"})
    await ws_manager.broadcast(build_news_frontend_payload(updated))
    return {"success": True, "current": updated.get("current", {}), "history": state.get_news_history_preview()}


@app.get("/api/notes/state")
async def get_notes_widget_state():
    return state.get_notes_state()


@app.get("/api/notes/match")
async def match_note_widget_entry(query: str):
    cleaned_query = str(query or "").strip()
    if not cleaned_query:
        return JSONResponse(status_code=400, content={"success": False, "error": "query is required"})
    note = state.find_note(cleaned_query)
    if not note:
        return JSONResponse(status_code=404, content={"success": False, "error": "Note not found"})
    return {"success": True, "note": note}


@app.post("/api/notes")
async def create_note_widget_entry(data: Dict[str, Any]):
    content = str(data.get("content") or "").strip()
    category = str(data.get("category") or "").strip()
    if not content:
        return JSONResponse(status_code=400, content={"success": False, "error": "content is required"})
    note = state.add_note(content, category=category)
    return {"success": True, "note": note, **state.get_notes_state()}


@app.put("/api/notes/{note_id}")
async def update_note_widget_entry(note_id: str, data: Dict[str, Any]):
    content = str(data.get("content") or "").strip()
    category = str(data.get("category") or "").strip()
    if not content:
        return JSONResponse(status_code=400, content={"success": False, "error": "content is required"})
    try:
        note = state.update_note(note_id, content, category=category)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "Note not found"})
    return {"success": True, "note": note, **state.get_notes_state()}


@app.delete("/api/notes/{note_id}")
async def delete_note_widget_entry(note_id: str):
    try:
        notes = state.delete_note(note_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "Note not found"})
    return {"success": True, "notes": notes, "summaries": state.get_notes_state().get("summaries", [])}


@app.post("/api/notes/clear")
async def clear_note_widget_entries():
    state.clear_all_notes()
    return {"success": True, **state.get_notes_state()}


@app.post("/api/notes/summaries")
async def create_note_widget_summary(data: Dict[str, Any]):
    content = str(data.get("content") or "").strip()
    summary_type = str(data.get("type") or "single-note").strip() or "single-note"
    tags = data.get("tags") if isinstance(data.get("tags"), list) else []
    if not content:
        return JSONResponse(status_code=400, content={"success": False, "error": "content is required"})
    summary = state.add_summary(content, summary_type=summary_type, tags=tags)
    return {"success": True, "summary": summary, **state.get_notes_state()}


@app.delete("/api/notes/summaries/{summary_id}")
async def delete_note_widget_summary(summary_id: str):
    try:
        summaries = state.delete_summary(summary_id)
    except KeyError:
        return JSONResponse(status_code=404, content={"success": False, "error": "Summary not found"})
    return {"success": True, "notes": state.get_notes_state().get("notes", []), "summaries": summaries}


@app.post("/api/notes/ai")
async def run_notes_widget_ai(data: Dict[str, Any]):
    mode = str(data.get("mode") or "chat").strip().lower() or "chat"
    note_id = str(data.get("note_id") or "").strip()
    instruction = str(data.get("instruction") or "").strip()
    draft_content = str(data.get("draft_content") or "").strip()
    category = str(data.get("category") or "").strip()
    conversation = data.get("conversation") if isinstance(data.get("conversation"), list) else []

    note = state.get_note_by_id(note_id) if note_id else None
    note_content = draft_content or str((note or {}).get("content") or "").strip()
    note_category = category or str((note or {}).get("category") or "").strip()

    if not note_content:
        return JSONResponse(status_code=400, content={"success": False, "error": "Note content is required"})

    if not instruction:
        if mode == "summary":
            instruction = "Summarize this note with key points, context, and useful follow-up details."
        elif mode == "improve":
            instruction = "Improve this note for clarity, grammar, structure, and completeness while preserving meaning."
        else:
            instruction = "Help with this note using the provided context."

    result = await generate_notes_ai_completion(
        mode=mode,
        note_content=note_content,
        instruction=instruction,
        note_id=note_id,
        category=note_category,
        conversation=conversation,
    )
    return {
        **result,
        "note_id": note_id,
        "category": note_category,
        "note_content": note_content,
    }


@app.post("/api/client/location")
async def update_client_location(data: Dict[str, Any]):
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is None or longitude is None:
        raise HTTPException(status_code=400, detail="latitude and longitude are required")

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="latitude and longitude must be numbers") from exc

    accuracy = data.get("accuracy")
    try:
        accuracy = float(accuracy) if accuracy is not None else None
    except (TypeError, ValueError):
        accuracy = None

    provided_label = str(data.get("label") or "").strip()
    snapshot = state.update_client_location(
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        label=provided_label,
    )

    resolved_label = provided_label
    try:
        if not resolved_label:
            weather_service = _load_weather_service()
            weather_data = weather_service.get_comprehensive_weather_data(f"{latitude},{longitude}")
            if "error" not in weather_data:
                resolved_label = str(weather_data.get("location") or "").strip()
                if resolved_label:
                    snapshot = state.merge_client_location_label(resolved_label)
    except Exception as exc:
        logger.warning("[LOCATION] Could not resolve live location label for %.5f, %.5f: %s", latitude, longitude, exc)

    return {
        "success": True,
        "location": snapshot,
    }


@app.get("/api/client/location")
async def get_client_location():
    return {
        "success": True,
        "location": state.get_client_location(),
    }


@app.get("/api/weather/location")
async def get_weather_location_snapshot():
    snapshot = state.get_client_location()
    return {
        "success": True,
        "location": snapshot,
        "default_weather_query": str(snapshot.get("weather_query") or DEFAULT_WEATHER_FALLBACK_LOCATION).strip() or DEFAULT_WEATHER_FALLBACK_LOCATION,
    }


@app.get("/api/weather/radar")
def get_weather_radar():
    result = radar_manifest_service.get()
    return JSONResponse(status_code=200 if result['success'] else 503, content=result)


@app.get("/api/weather/current")
def get_weather_widget_data(
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    refresh: int = 0,
):
    try:
        result = state.weather_runtime.get_current_weather(
            location=location,
            lat=lat,
            lon=lon,
            refresh=bool(refresh),
        )
        if result.get("success") is False:
            return JSONResponse(status_code=502, content=result)
        if location:
            _record_application_memory("news_weather_history","weather_result",location,{"location":location,"retrieved_at":datetime.now().isoformat(),"summary":"Weather widget loaded a current forecast"})
        return result
    except Exception as exc:
        logger.error("[WEATHER] Weather endpoint failed for %s: %s", location or f"{lat},{lon}", exc)
        return JSONResponse(status_code=502, content={"success": False, "error": str(exc)})


@app.get("/api/weather/history")
async def get_weather_history(date: Optional[str] = None, limit: int = 20):
    cleaned_date = str(date or "").strip() or None
    if cleaned_date:
        try:
            datetime.strptime(cleaned_date, "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format") from exc

    records = state.get_weather_history(date=cleaned_date, limit=max(1, min(limit, 500)))
    return {
        "success": True,
        "date": cleaned_date,
        "count": len(records),
        "records": records,
    }


@app.post("/api/search/test-display")
async def test_search_widget_display(data: Optional[Dict[str, Any]] = None):
    payload = data or {}
    query = str(payload.get("query") or "latest AI interface design trends").strip()
    request_id = f"search-test-{uuid.uuid4().hex}"
    sample_results = [
        {
            "rank": 1,
            "title": "AI Interface Design Trends for 2026",
            "snippet": "A breakdown of the strongest UI patterns shaping AI-first products, including live search panels, persistent activity widgets, and adaptive response layouts.",
            "link": "https://example.com/ai-interface-design-trends-2026",
            "source": "example.com",
            "type": "web_result",
        },
        {
            "rank": 2,
            "title": "Designing Search Experiences That Feel Instant",
            "snippet": "This article covers loading affordances, source visibility, and result-card hierarchy for conversational search experiences.",
            "link": "https://example.com/instant-search-experience",
            "source": "example.com",
            "type": "web_result",
        },
        {
            "rank": 3,
            "title": "Why Structured Search Results Improve Trust",
            "snippet": "Users trust AI answers more when they can scan ranked sources, summaries, and direct links inside a dedicated search widget.",
            "link": "https://example.com/structured-search-trust",
            "source": "example.com",
            "type": "web_result",
        },
    ]
    message = {
        "type": "widget_control",
        "widget": "search",
        "command": "show_results",
        "request_id": request_id,
        "source": "server_test",
        "original_transcript": f"test search for {query}",
        "query": query,
        "display_topic": format_search_display_topic(query),
        "display_subtopic": format_search_display_subtopic("web"),
        "search_type": "web",
        "loading": False,
        "answer": (
            f"Test search results for {query}. "
            "This payload was generated by the backend test route so the widget can be verified live in the UI."
        ),
        "results": sample_results,
        "error": None,
    }
    updated = state.update_search_widget_context(message)
    snapshot = build_frontend_payload(updated) or message
    await ws_manager.broadcast(snapshot)
    return {"success": True, "request_id": request_id, "query": query, "result_count": len(sample_results)}


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"[ERROR] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "timestamp": datetime.now().isoformat()}
    )


# ============================================================================
# MAIN
# ============================================================================


from astra_ai.ui.backend.library_api import LibraryService,install as install_library
_library_service=None
def get_library_service():
    global _library_service
    if _library_service is None or _library_service.memory is not state.live_memory:
        _library_service=LibraryService(state.live_memory,action_jobs,task_store,lambda:learning_service,lambda:capability_service,task_orchestrator.wake)
    return _library_service
install_library(app,get_library_service,_learning_context)

async def _research_collection_receipt(receipt,context):
    # Chat tools wait for their durable collection result, rather than return a
    # promise before evidence is ready. The HTTP continuation stays nonblocking.
    def collected(result):
        if result.get('results') and result.get('status') in {'queued','waiting_for_retry','waiting_for_quota'}:
            return {**result,'status':'completed','operation':'collect_followup_evidence','publication_pending':True,'report_status':result['status'],
                    'summary':'Evidence collection is complete for this question. Answer from these excerpts now, with real citations and limitations. The composed report is still pending; do not claim it has been published and do not repeat this collection.'}
        return result
    if receipt.get('results'):return collected(receipt)
    deadline=time.monotonic()+45
    while time.monotonic()<deadline:
        snapshot=await asyncio.to_thread(action_jobs.list,receipt['job_id'],context)
        if snapshot.get('status')!='ok':return receipt
        job=snapshot.get('job',{});steps=job.get('actions',[])
        outcome=(steps[0].get('result') or {}) if steps else {}
        if outcome:
            allowed=('status','reason','summary','next_attempt','results','collected_sources','evidence_available','research_revision','completeness')
            return collected({**receipt,**{key:outcome[key] for key in allowed if key in outcome}})
        if job.get('paused') or job.get('state') in {'failed','canceled','completed'}:return receipt
        await asyncio.sleep(.1)
    return {**receipt,'summary':'The follow-up is saved in this report and source collection is still running. Do not claim an answer has been published.'}

def research_followup(text):
    text=str(text).casefold()
    # Called only with the turn's frozen research context. A scoped question
    # belongs here even when it does not contain the word "more".
    return bool(text.strip()) and not re.search(r'\b(new research|new topic|different topic|start over|instead research)\b',text)

_research_continuation_locks={}

async def start_research_page(identifier,context,operation_id,query,mode=None):
    from astra_ai.core.research_sessions import reserve_page
    artifacts,_=get_research_services()
    reserved=await asyncio.to_thread(reserve_page,artifacts,identifier,context,query,operation_id,mode)
    if reserved.get('status')!='ok':return reserved
    page_context={**context,'research_id':reserved['id'],'research_session_id':reserved['research_session_id'],'research_page_request':True,'requested_research':True}
    result=action_jobs.submit([{'name':'search_web','arguments':{'research_id':reserved['id'],'mode':reserved['mode']}}],page_context,reserved['operation_id'],goal=reserved['display_title'])
    if result.get('status') in {'accepted','queued','duplicate','completed'}:
        await asyncio.to_thread(artifacts.request_state,reserved['id'],context,job_id=result.get('job_id',''))
        await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_page_created','research_id':reserved['id'],'research_session_id':reserved['research_session_id'],'parent_page_id':identifier})
    else:await asyncio.to_thread(artifacts.request_state,reserved['id'],context,phase='failed',waiting_reason=result.get('reason','job_not_admitted'))
    return {**result,'research_id':reserved['id'],'research_session_id':reserved['research_session_id'],'thread_id':reserved['thread_id'],'summary':'A new research page is saved in this conversation. Its report is not published yet.'}

async def continue_research(identifier,context,operation_id,view='',detail='',page_action=''):
    artifacts,_=get_research_services();fetched=await asyncio.to_thread(artifacts.get,identifier,context)
    if fetched['status']!='ok':return fetched
    item=fetched['artifact']
    if detail.strip() and not view and item.get('kind','research')=='research':
        from astra_ai.core.research_sessions import continuation_kind
        if continuation_kind(detail,item['query'],page_action)=='new_page':return await start_research_page(identifier,context,operation_id,detail)
    from astra_ai.core.research_topics import followup_view
    view=view or followup_view(detail)
    request_id='research-more-'+operation_id
    state.register_widget_action(context.get('client_id',''),request_id)
    reveal_saved=not detail.strip() or bool(re.fullmatch(r'(?:please )?(?:(?:show|give|tell) (?:me )?)?(?:more(?: information| details)?|expand(?: this)?(?: report| research| results)?|continue(?: this)?(?: report| research)?)[.!? ]*',detail.strip(),re.I))
    await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_continue','request_id':request_id,'research_id':identifier,'research_revision':item['revision'],'view':view,'reveal_saved':reveal_saved or view!='reader'})
    observed=await state.await_widget_action(context.get('client_id',''),request_id,timeout=5)
    if not observed:return {'status':'unconfirmed','reason':'research_view_not_acknowledged','research_id':identifier}
    if observed.get('status')!='completed':return observed
    if observed.get('revealed') and (reveal_saved or view!='reader'):return {**observed,'research_id':identifier,'research_revision':item['revision'],'provider_calls':0}
    initial_pending=item['completeness']=='pending' and view=='reader'
    if initial_pending and reveal_saved:return {'status':'waiting_for_retry','research_id':identifier,'reason':'The original report is still being prepared. Collected findings remain visible.'}
    key=(context.get('profile_id',''),context.get('project_id',''),identifier)
    async with _research_continuation_locks.setdefault(key,asyncio.Lock()):
        if context.get('dedupe_research_turn'):
            from astra_ai.core.research_intent import existing_turn
            prior=await asyncio.to_thread(existing_turn,artifacts,context)
            if prior:return prior
        # Only the same question can reuse a pending continuation. A new question
        # still belongs to this report and needs its own durable collection step.
        from astra_ai.memory.shared_memory import normal
        current=await asyncio.to_thread(artifacts.extension_state,identifier,context)
        metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
        checkpoint=metadata.get('quick_followups',{}).get(current.get('operation_id'),{})
        current_detail=checkpoint.get('query') or current.get('detail','')
        if current.get('operation_id')==operation_id and current.get('phase')=='complete':return {**artifacts.brief(item),'duplicate':True}
        if current.get('phase') in {'queued','collecting_sources','preparing_report','waiting_for_quota','waiting_for_report'} and current.get('view')==view and normal(current_detail)==normal(detail[:2000]):
            waiting=current.get('phase') in {'waiting_for_quota','waiting_for_report'}
            evidence=await asyncio.to_thread(artifacts.followup_evidence,identifier,context,current.get('operation_id',''))
            return {'status':'queued','research_id':identifier,'job_id':current.get('job_id'),'execution_stage':current.get('phase'),'collected_sources':current.get('collected_sources',0),
                    'results':evidence,
                    'reason':current.get('reason') or 'The existing continuation is still pending.',
                    'summary':'Use the supplied excerpts to answer the question now, with citations and limitations. The composed report is paused; do not merely promise future research or claim report publication.' if evidence else 'The follow-up is saved in this same report. Answer generation is paused; do not describe it as active research.' if waiting else 'The follow-up has an existing job. Its execution stage is '+current.get('phase','queued')+'.'}
        from astra_ai.core.research_topics import conversational_mode
        args={'action':'more_media' if view=='media' else 'expand','research_id':identifier,'research_revision':item['revision'],'view':view,'detail':detail[:2000],
              'mode':item.get('mode','detailed')}
        if initial_pending:args={'action':'topic_followup','research_id':identifier,'query':detail[:2000],'mode':args['mode'],'report_mode':item.get('mode','detailed')}
        await asyncio.to_thread(artifacts.extension_state,identifier,context,phase='waiting_for_report' if initial_pending else 'queued',view=view,operation_id=operation_id,detail=detail[:2000],outbound_started=False,search_checkpoint=None,collected_sources=0,reason='initial_report_pending' if initial_pending else '',origin_turn_id=context.get('turn_id',''),origin_session_id=context.get('session_id',''))
        result=action_jobs.submit([{'name':'search_web','arguments':args}],{**context,'research_id':identifier,'requested_research':True},operation_id,goal='Continue '+(item.get('display_title') or item['query'][:90]))
        if result.get('status') in {'accepted','queued','duplicate','completed'}:
            await asyncio.to_thread(artifacts.extension_state,identifier,context,job_id=result.get('job_id',''))
            await ws_manager.send_to_client_id(context.get('client_id',''),{'type':'research_refresh','research_id':identifier})
        else:await asyncio.to_thread(artifacts.extension_state,identifier,context,phase='failed',reason=result.get('reason','continuation_not_admitted'))
        return {**result,'research_id':identifier,'research_revision':item['revision'],
                **({'execution_stage':'waiting_for_report','summary':'The follow-up is queued in this report. Source collection can run; answer generation waits for the original report. Nothing has been published yet.'} if initial_pending else {})}

from astra_ai.ui.backend.api.research import install as install_research_routes
_research_thread,_live_research_focus=install_research_routes(app,context_for=_learning_context,
    artifacts_for=get_research_services,writer=lambda:research_model,learning=lambda:learning_service,
    jobs=action_jobs,collaboration=collaboration_service,state=state,manager=ws_manager,
    ui_context=ui_context,workspace=workspace_service,confirm_destructive=_confirm_destructive,
    continue_research=continue_research,start_research_page=start_research_page)

from astra_ai.ui.backend.document_api import install as install_documents
install_documents(app,get_research_services,_learning_context,lambda:action_jobs)



from astra_ai.ui.backend.notices import Notices
from astra_ai.ui.backend.presence import PresenceTracker,PresenceWorker
notice_store=Notices(Path(__file__).resolve().parents[2]/'core'/'learned'/'notices.json')
presence_worker=PresenceWorker()
mic_states={};presence_trackers={};presence_purposes={};presence_inflight=set();notice_reviewed={}
async def dispatch_notice(name,args,c):
    client=c.get('client_id','');socket=ws_manager.websocket_for(client);live=state.live_sessions.get(socket)
    if not socket or not live or live.guest:return {'status':'unavailable','reason':'owner_voice_session_required'}
    if name=='presence_action':
        if args.get('action')=='stop':
            await release_presence(client,socket);return {'status':'stopped'}
        if args.get('action')=='inspect':
            identifier=args.get('notice_id','')
            if not notice_store.get(identifier,c) or presence_purposes.get(client,{}).get('notice_id')!=identifier:return {'status':'rejected','reason':'pending_camera_purpose_required'}
            if not presence_purposes[client].get('cloud_allowed'):return {'status':'rejected','reason':'cloud_camera_consent_required'}
            if not camera_access.status()['verified']:return {'status':'unavailable','reason':'cloud_image_access_not_verified'}
            future=asyncio.get_running_loop().create_future();camera_requests[(client,identifier)]=future
            await ws_manager.send_to_client(socket,{'type':'presence_image_request','notice_id':identifier})
            try:return await asyncio.wait_for(future,8)
            except asyncio.TimeoutError:return {'status':'unavailable','reason':'camera_image_not_received'}
            finally:camera_requests.pop((client,identifier),None)
        tracker=presence_trackers.get(client)
        return {'status':'ok','available':presence_worker.available(),'presence':tracker.status() if tracker else 'unknown','reason':presence_worker.reason}
    action=args.get('action','list')
    if action=='list':return {'status':'ok','items':await asyncio.to_thread(notice_store.listing,c)}
    identifier=args.get('notice_id','');item=await asyncio.to_thread(notice_store.get,identifier,c)
    if not item:return {'status':'not_found'}
    if action=='get':return {'status':'ok','notice':item}
    if action=='defer':return await asyncio.to_thread(notice_store.change,identifier,c,'deferred',next_review=time.time()+3600,reason=str(args.get('reason',''))[:300])
    if action!='speak' or item['state'] in {'delivered','dismissed','offered'}:return {'status':'rejected','reason':'notice_not_pending'}
    tracker=presence_trackers.get(client)
    if mic_states.get(client,True) and (not tracker or tracker.status()!='present'):
        await asyncio.to_thread(notice_store.change,identifier,c,'awaiting_presence',reason=str(args.get('reason',''))[:300])
        if presence_worker.available() and client not in presence_purposes:
            presence_purposes[client]={'notice_id':identifier,'cloud_allowed':False}
            await ws_manager.send_to_client(socket,{'type':'presence_start','notice_id':identifier,'local_only':True})
        return {'status':'waiting_for_presence','detector_available':presence_worker.available()}
    if live._speech_active:return {'status':'deferred','reason':'user_speaking'}
    await asyncio.to_thread(notice_store.change,identifier,c,'offered',offered_to=client,offered_at=now())
    live._notice_gate=False;live._notice_id=identifier
    await ws_manager.send_to_client(socket,{'type':'live_notice_begin','notice_id':identifier})
    return {'status':'authorized','notice':item,'instruction':'Explain the sourced outcome naturally. Do not claim operations beyond these results.'}

async def handle_presence_frame(socket,message):
    client=ws_manager.client_id(socket);purpose=presence_purposes.get(client);live=state.live_sessions.get(socket)
    if not purpose or not live or live.guest or message.get('notice_id')!=purpose['notice_id'] or client in presence_inflight:return
    jpeg=message.get('jpeg');presence_inflight.add(client)
    try:
        purpose['cloud_allowed']=message.get('cloud_allowed') is True
        if message.get('cloud_image'):
            if not purpose['cloud_allowed'] or purpose.get('image_sent') or live._speech_active:return
            result=await camera_access.inspect(jpeg);purpose['image_sent']=result['status']=='ok'
            future=camera_requests.get((client,purpose['notice_id']))
            if future and not future.done():future.set_result(result)
            return
        async with capability_service.cpu:
            detected=await presence_worker.detect(jpeg)
        tracker=presence_trackers.setdefault(client,PresenceTracker());status=tracker.observe(detected)
        await ws_manager.send_to_client(socket,{'type':'presence_result','state':status,'reason':presence_worker.reason})
    except Exception:
        await ws_manager.send_to_client(socket,{'type':'presence_result','state':'unknown','reason':'detector_unavailable'})
    finally:presence_inflight.discard(client)

async def release_presence(client,socket=None):
    presence_purposes.pop(client,None);presence_trackers.pop(client,None)
    if socket:await ws_manager.send_to_client(socket,{'type':'presence_stop'})
    if not presence_purposes:await presence_worker.close()

async def check_operation_notices(socket):
    client=ws_manager.client_id(socket);live=state.live_sessions.get(socket)
    if live and (live.guest or getattr(live,'_tool_tasks',None) or live._speech_active or live._audio_started or live._response_pending or live._input_parts or live._text_suspended):return
    if not live and speaker_recognition.status()['enabled']:return
    c={'client_id':client,'profile_id':getattr(live,'profile_id',''),'project_id':getattr(live,'project_id',''),'session_id':getattr(live,'session_id',CHAT_SESSIONS.get(client,''))}
    # Existing approvals are discoverable even when created by a background worker.
    approvals=await asyncio.to_thread(get_library_service().approvals,c)
    current_approvals={r['id']:r for r in approvals}
    for approval in approvals:
        if approval['state']=='waiting':
            await asyncio.to_thread(notice_store.enqueue,'approval',approval['id'],approval['version'],{'title':approval['title'],'approval_id':approval['id']},c)
    works=await asyncio.to_thread(get_library_service().work,c)
    work_titles={row['id']:row['title'] for row in works}
    for work in works:
        if work['state'] in {'completed','failed','waiting_approval','waiting_input'} and (not work.get('background') or work['state']=='failed'):
            await asyncio.to_thread(notice_store.enqueue,'job' if work['source']=='job' else 'task',work['id'],work['state'] if work['source']=='job' else work['version'],{'title':work['title'],'state':work['state'],'task_id':work['id']},c)
    items=await asyncio.to_thread(notice_store.listing,c)
    await ws_manager.send_to_client(socket,{'type':'operation_notices','items':[{**{k:r.get(k) for k in ('id','kind','target','state','created','version')},'title':r.get('title') or work_titles.get(r['target']) or current_approvals.get(r['target'],{}).get('title') or 'Work update'} for r in items if r['state'] not in {'delivered','dismissed'}]})
    for item in items:
        if item['state'] in {'delivered','dismissed'}:continue
        if item['kind']=='approval':
            approval=current_approvals.get(item['target'])
            if not approval or approval['state']!='waiting' or approval['version']!=item['version']:
                await asyncio.to_thread(notice_store.change,item['id'],c,'dismissed',reason='proposal_no_longer_waiting')
                if presence_purposes.get(client,{}).get('notice_id')==item['id']:await release_presence(client,socket)
                continue
        if item['state']=='offered':continue  # uncertain delivery is inspectable, never replayed automatically
        if not live:continue # text availability does not open an unsolicited provider session
        tracker=presence_trackers.get(client)
        ready=item['state']=='awaiting_presence' and tracker and tracker.status()=='present'
        eligible=item['state']=='pending' or item['state']=='deferred' and time.time()>=item.get('next_review',float('inf')) or ready
        key=(client,item['id'],item['state'])
        if eligible and time.time()-notice_reviewed.get(key,0)>3600:
            notice_reviewed[key]=time.time()
            while len(notice_reviewed)>1000:notice_reviewed.pop(next(iter(notice_reviewed)))
            await live.review_notice(item);break

from astra_ai.ui.backend.camera_access import CameraAccess
camera_access=CameraAccess(lambda:state.gemini_api_key,lambda:background_budget)
camera_requests={}
@app.post('/api/camera/verify')
async def verify_camera(request:Request):
    _learning_context(request)
    return await camera_access.verify()
@app.post('/api/camera/inspect')
async def inspect_camera(request:Request,payload:dict):
    _learning_context(request)
    if payload.get('cloud_consent') is not True:raise HTTPException(403,'Cloud image consent required')
    return await camera_access.inspect(payload.get('jpeg'))

from astra_ai.ui.backend.research_api import register_research_api
register_research_api(app,lambda:research_model,lambda:research_provider_settings,get_research_services,_learning_context,action_jobs,runtime_paths)

if __name__ == "__main__":
    logger.info("="*70)
    logger.info("AEGIS AI BACKEND - WebSocket Server")
    logger.info("="*70)
    logger.info(f"[>] WebSocket Endpoint:  ws://localhost:{ServerConfig.PORT}{ServerConfig.WS_ENDPOINT}")
    logger.info(f"[>] REST API:            http://localhost:{ServerConfig.PORT}/api")
    logger.info("")
    logger.info("[*] ARCHITECTURE:")
    logger.info("   - Gemini Live is the default per-client conversation provider")
    logger.info("   - Gemini Live is Gemini-only; audio failures retry once and then report an error")
    logger.info("   - Widget protocols remain independent and unchanged")
    logger.info("")
    logger.info("[*] AUDIO PIPELINE:")
    logger.info("   - Browser PCM16 16 kHz -> Gemini Live")
    logger.info("   - Gemini native PCM16 24 kHz -> WebSocket binary frames")
    logger.info("   - Web Audio analyser -> existing orb animation")
    logger.info("")
    logger.info("[*] INPUT FLOW:")
    logger.info("   1. User enables the microphone or submits typed input")
    logger.info("   2. Gemini handles transcription, reasoning, and native speech")
    logger.info("   3. Audio failures retry Gemini once, then report a restartable error")
    logger.info("="*70)
    logger.info("")
    
    uvicorn.run(
        app,
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        log_level="info"
    )
