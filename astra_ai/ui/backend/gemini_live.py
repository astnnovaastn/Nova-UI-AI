"""Gemini Live session used by Astra's browser voice transport."""

from __future__ import annotations

import asyncio
import logging
import os
import threading
import uuid
from pathlib import Path
from typing import Any, Awaitable, Callable, Optional

from google import genai
from google.genai import types

from astra_ai.core.aegis_live_context import build_aegis_live_instruction
from astra_ai.memory.conversation_persistence import append_single_message
from astra_ai.memory.live_memory import LiveMemoryManager


LOGGER = logging.getLogger("AegisServer.GeminiLive")

# Gemini 3.1 Flash Live is the newer native audio-to-audio Live model. Google
# lists it on the Gemini API Free Tier; unlike 2.5 Live, incremental text must
# be sent through send_realtime_input rather than send_client_content.
LIVE_MODEL = "gemini-3.1-flash-live-preview"
INPUT_SAMPLE_RATE = 16_000
OUTPUT_SAMPLE_RATE = 24_000
VOICE_NAME = "Puck"


def _vad_int(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        return max(minimum, min(maximum, int(os.getenv(name, str(default)))))
    except (TypeError, ValueError):
        return default


# Short, explicit end-of-speech settings keep Live turns responsive while
# retaining enough padding to avoid cutting off normal word endings.
VAD_SILENCE_DURATION_MS = _vad_int("GEMINI_VAD_SILENCE_MS", 300, 120, 1200)
VAD_PREFIX_PADDING_MS = _vad_int("GEMINI_VAD_PREFIX_MS", 120, 40, 500)

MEMORY_TOOL_DECLARATIONS = [
    {
        "name": "save_memory",
        "description": (
            "Silently save one durable personal fact explicitly revealed by the user. "
            "Use for identity, demographics, stable preferences, relationships, projects, "
            "goals, milestones, wishes, or stable notes. Never save credentials, passwords, "
            "API keys, payment data, temporary commands, searches, weather, or reminders. "
            "Store concise values in English while preserving names and proper nouns."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {"type": "STRING", "enum": [
                    "identity", "demographics", "preferences", "projects", "goals",
                    "milestones", "relationships", "wishes", "notes",
                ]},
                "key": {"type": "STRING", "description": "Short snake_case fact key."},
                "value": {"type": "STRING", "description": "Concise durable fact value."},
            },
            "required": ["category", "key", "value"],
        },
    },
    {
        "name": "forget_memory",
        "description": (
            "Forget one specific saved fact only when the user explicitly requests it. "
            "Do not call for broad requests such as forget everything; ask which fact first."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {"type": "STRING", "enum": [
                    "identity", "demographics", "preferences", "projects", "goals",
                    "milestones", "relationships", "wishes", "notes",
                ]},
                "key": {"type": "STRING", "description": "Exact snake_case fact key."},
            },
            "required": ["category", "key"],
        },
    },
    {
        "name": "recall_conversations",
        "description": (
            "Search older saved user/assistant transcripts when the user asks what was said, "
            "discussed, or decided in a previous conversation and recent context is insufficient."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Specific topic or detail to recall."},
                "limit": {"type": "INTEGER", "description": "Maximum matches from 1 to 5."},
            },
            "required": ["query"],
        },
    },
]

MEMORY_EVENT_TOOL_DECLARATIONS = [
    {
        "name": "save_memory_event",
        "description": (
            "Create or update a durable memory event when the user asks you to remember a rule, "
            "routine, instruction, habit, boundary, or other information that does not fit a fact category. "
            "Invent a concise snake_case event_type when needed. Never store secrets."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "event_type": {"type": "STRING", "description": "Concise snake_case type, such as speaking_rule or routine."},
                "key": {"type": "STRING", "description": "Stable snake_case key for this event."},
                "content": {"type": "STRING", "description": "The durable instruction or information to remember."},
                "attributes": {"type": "OBJECT", "description": "Optional small structured details."},
                "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
            },
            "required": ["event_type", "key", "content"],
        },
    },
    {
        "name": "forget_memory_event",
        "description": "Delete one specific memory event only after the user explicitly asks you to forget it.",
        "parameters": {
            "type": "OBJECT",
            "properties": {"event_id": {"type": "STRING", "description": "The exact event id returned when it was saved."}},
            "required": ["event_id"],
        },
    },
    {
        "name": "recall_memory",
        "description": "Search flexible memory events when a saved rule, routine, or custom remembered detail is relevant.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING"},
                "limit": {"type": "INTEGER", "description": "Maximum matches from 1 to 5."},
            },
            "required": ["query"],
        },
    },
]

WIDGET_TOOL_DECLARATIONS = [
    {
        "name": "get_system_status",
        "description": "Return compact authoritative backend, Gemini, memory, and connected-widget status. Use this when an operation may have failed or the user asks what is working.",
        "parameters": {"type": "OBJECT", "properties": {"scope": {"type": "STRING"}}},
    },
    {
        "name": "read_notes_context",
        "description": "Read the current Notes draft, selected note, or compact Notes state for a Notes-related request.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "note_id": {"type": "STRING"}, "query": {"type": "STRING"},
                "include_all": {"type": "BOOLEAN"},
            },
        },
    },
    {
        "name": "read_search_context",
        "description": "Read the Search widget's currently displayed answer/results and compact search history. Use this before explaining what is visible or restoring a prior result.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING"},
                "include_history": {"type": "BOOLEAN"},
            },
        },
    },
    {
        "name": "read_calendar_context",
        "description": "Read authoritative Calendar UI state, visible events, selected date, current view, filters, dialogs, and calendar visibility. Use this for contextual references such as 'this event' before editing or moving it.",
        "parameters": {"type": "OBJECT", "properties": {"event_id": {"type": "STRING"}, "query": {"type": "STRING"}, "include_events": {"type": "BOOLEAN"}}},
    },
    {
        "name": "read_image_context",
        "description": "Read the authoritative Image Widget state, including its open view, prompt, generation status, selected image, and saved gallery metadata. Use this before resolving references such as 'this image', 'the last image', or an image number.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "image_id": {"type": "STRING"},
                "image_number": {"type": "INTEGER"},
                "query": {"type": "STRING"},
                "include_gallery": {"type": "BOOLEAN"},
            },
        },
    },
    {
        "name": "notes_action",
        "description": "Authoritatively control Notes. Use read_notes_context before context-sensitive edits. append_to_active_note targets the note currently reviewed or edited. Use direct paste_into_draft to transfer Search text into Notes. delete_note and clear_all_notes require confirm=true. Wait for the returned status before reporting success.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {"type": "STRING"}, "note_id": {"type": "STRING"},
                "query": {"type": "STRING"}, "content": {"type": "STRING"},
                "category": {"type": "STRING"}, "summary_type": {"type": "STRING"},
                "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                "confirm": {"type": "BOOLEAN"},
            },
            "required": ["action"],
        },
    },
]

ACTION_TOOL_DECLARATIONS = [
    {
        "name": "calendar_create_event",
        "description": "Create one persisted Calendar event. Use this for requests such as 'create an event'. Supply human-level title/start/end; start and end may be ISO or natural-language datetimes, and timezone/calendar are optional. The server resolves the calendar and normalizes the request. Wait for the returned event ID before telling the user it was created.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {"type": "STRING"}, "start": {"type": "STRING"}, "end": {"type": "STRING"},
                "timezone": {"type": "STRING"}, "calendar": {"type": "STRING"}, "calendar_id": {"type": "STRING"},
                "all_day": {"type": "BOOLEAN"}, "importance": {"type": "STRING"}, "location": {"type": "STRING"},
                "notes": {"type": "STRING"}, "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                "recurrence": {"type": "STRING"}, "reminder_minutes": {"type": "INTEGER"},
            },
            "required": ["title", "start", "end"],
        },
    },
    {
        "name": "calendar_action",
        "description": "Control the Calendar widget through semantic operations that mirror the human UI: open/close/focus, navigate and select dates, set week/month/year/agenda view, read/search/create/update/move/delete events, quick-add, sync, filters, calendar visibility, and settings. Use stable event_id values when available. Deletion requires confirm=true. Wait for the authoritative frontend acknowledgement before reporting success.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {"type": "STRING"}, "event_id": {"type": "STRING"}, "date": {"type": "STRING"},
                "target_date": {"type": "STRING"}, "view": {"type": "STRING"}, "direction": {"type": "INTEGER"},
                "query": {"type": "STRING"}, "text": {"type": "STRING"}, "calendar_id": {"type": "STRING"},
                "calendar_ids": {"type": "ARRAY", "items": {"type": "STRING"}}, "importance": {"type": "STRING"},
                "smart_view_id": {"type": "STRING"}, "template_id": {"type": "STRING"}, "name": {"type": "STRING"}, "dialog": {"type": "STRING"},
                "event": {"type": "OBJECT"}, "patch": {"type": "OBJECT"}, "confirm": {"type": "BOOLEAN"},
                "preserve_time": {"type": "BOOLEAN"}, "request_id": {"type": "STRING"}
            },
            "required": ["action"],
        },
    },
    {
        "name": "image_action",
        "description": "Control the Image Widget using semantic operations shared with the human UI. Explicitly connect or disconnect Aegis first when requested, then open, close, focus_prompt, set_prompt, append_prompt, clear_prompt, generate, regenerate_last, show_gallery, open_gallery_image, search_gallery, select_latest, scroll_gallery_up/down/top/bottom, back_to_gallery, back_to_create, set_fit_mode, and delete_saved_image. Use image_id or visible image_number for gallery operations; resolve ambiguous names before destructive actions. Wait for the authoritative frontend acknowledgement and real generation result before reporting success.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {"type": "STRING"},
                "prompt": {"type": "STRING"},
                "image_id": {"type": "STRING"},
                "image_number": {"type": "INTEGER"},
                "query": {"type": "STRING"},
                "fit_mode": {"type": "STRING"},
                "confirm": {"type": "BOOLEAN"},
                "request_id": {"type": "STRING"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "search_web",
        "description": "Search the web for concise conversational research using the server's private Firecrawl search key. Use this for small or focused questions. Do not open the Search widget unless the user wants a large visible research result set.",
        "parameters": {
            "type": "OBJECT",
            "properties": {"query": {"type": "STRING"}, "max_results": {"type": "INTEGER"}},
            "required": ["query"],
        },
    },
    {
        "name": "search_widget_action",
        "description": "Connect to and control the Search widget for large visible research results. Use find_history to locate saved searches, restore_search_result to display an existing record without searching again, and delete_search_result only with confirm=true. Actions include open, set_query, run, show_results, show_history, show_current, restore_latest, restore_search_result, delete_search_result, clear_current, close, and disconnect. Wait for the authoritative widget result before reporting success.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {"type": "STRING"}, "query": {"type": "STRING"},
                "request_id": {"type": "STRING"}, "confirm": {"type": "BOOLEAN"},
                "max_results": {"type": "INTEGER"},
                "answer": {"type": "STRING"}, "results": {"type": "ARRAY", "items": {"type": "OBJECT"}},
            },
            "required": ["action"],
        },
    },
    {
        "name": "search_history_action",
        "description": "Manage persisted Search-widget history. Use find first. If exactly one result matches, report it and request confirmation before delete. If multiple results match, return candidates and wait for an exact request_id. restore displays the saved result without performing a new web search.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {"type": "STRING", "description": "find, restore, delete, or show_history"},
                "query": {"type": "STRING"},
                "request_id": {"type": "STRING"},
                "confirm": {"type": "BOOLEAN"},
            },
            "required": ["action"],
        },
    },
    {
        "name": "ui_action",
        "description": "Control the Astra UI through an authoritative command. Use mute_microphone, unmute_microphone, pause_listening, or resume_listening when the user requests it. Wait for completion before confirming.",
        "parameters": {
            "type": "OBJECT",
            "properties": {"action": {"type": "STRING"}},
            "required": ["action"],
        },
    },
    {
        "name": "recall_search_memory",
        "description": "Recall saved Firecrawl research records when a previous search is relevant.",
        "parameters": {"type": "OBJECT", "properties": {"query": {"type": "STRING"}, "limit": {"type": "INTEGER"}}, "required": ["query"]},
    },
    {
        "name": "save_search_memory",
        "description": "Persist a useful Firecrawl research result for later recall. Save only after a meaningful search.",
            "parameters": {"type": "OBJECT", "properties": {"query": {"type": "STRING"}, "summary": {"type": "STRING"}, "results": {"type": "ARRAY", "items": {"type": "OBJECT"}}}, "required": ["query", "summary", "results"]},
    },
    {
        "name": "update_search_memory",
        "description": "Update one saved search record by its exact id.",
        "parameters": {"type": "OBJECT", "properties": {"record_id": {"type": "STRING"}, "summary": {"type": "STRING"}, "results": {"type": "ARRAY", "items": {"type": "OBJECT"}}}, "required": ["record_id"]},
    },
    {
        "name": "delete_search_memory",
        "description": "Delete one saved search record only after the user explicitly asks.",
        "parameters": {"type": "OBJECT", "properties": {"record_id": {"type": "STRING"}, "confirm": {"type": "BOOLEAN"}}, "required": ["record_id"]},
    },
    {
        "name": "create_file",
        "description": "Create a text or bounded binary file at an explicit path and register it. Overwrite requires confirm=true.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}, "content": {"type": "STRING"}, "encoding": {"type": "STRING"}, "overwrite": {"type": "BOOLEAN"}, "confirm": {"type": "BOOLEAN"}}, "required": ["path", "content"]},
    },
    {
        "name": "read_file",
        "description": "Read a tracked or explicitly requested file within the permitted user path policy.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}}, "required": ["path"]},
    },
    {
        "name": "edit_file",
        "description": "Edit a file. Use old_text/new_text for a precise replacement or content for a full replacement. Overwrite requires confirm=true.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}, "old_text": {"type": "STRING"}, "new_text": {"type": "STRING"}, "content": {"type": "STRING"}, "confirm": {"type": "BOOLEAN"}}, "required": ["path"]},
    },
    {
        "name": "append_file",
        "description": "Append text to a tracked or explicitly requested file.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}, "content": {"type": "STRING"}}, "required": ["path", "content"]},
    },
    {
        "name": "list_tracked_files",
        "description": "List files Aegis has created or registered.",
        "parameters": {"type": "OBJECT", "properties": {"query": {"type": "STRING"}}},
    },
    {
        "name": "delete_file",
        "description": "Delete a tracked file only after explicit user request and confirm=true.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}, "confirm": {"type": "BOOLEAN"}}, "required": ["path"]},
    },
    {
        "name": "move_file",
        "description": "Move a tracked file to a new explicit path; requires confirm=true because the path changes.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}, "destination": {"type": "STRING"}, "confirm": {"type": "BOOLEAN"}}, "required": ["path", "destination"]},
    },
    {
        "name": "file_status",
        "description": "Check whether a tracked file exists and return its metadata.",
        "parameters": {"type": "OBJECT", "properties": {"path": {"type": "STRING"}}, "required": ["path"]},
    },
]

JsonSender = Callable[[dict], Awaitable[None]]
BytesSender = Callable[[bytes], Awaitable[None]]
FailureHandler = Callable[[str, bool, str], Awaitable[None]]
OperationExecutor = Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]]
StatusProvider = Callable[[], Awaitable[dict[str, Any]]]

_memory_write_lock = threading.Lock()


def _append_turn(memory_file: Path, session_id: str, user_text: str, assistant_text: str) -> None:
    with _memory_write_lock:
        if user_text:
            append_single_message("user", user_text, session_id=session_id, memory_path=str(memory_file))
        if assistant_text:
            append_single_message("assistant", assistant_text, session_id=session_id, memory_path=str(memory_file))


class GeminiLiveSession:
    """Own one server-to-server Gemini Live connection for one browser."""

    def __init__(
        self,
        *,
        api_key: str,
        memory_file: Path,
        memory_manager: LiveMemoryManager,
        send_json: JsonSender,
        send_bytes: BytesSender,
        on_failure: FailureHandler,
        client_id: str = "",
        operation_executor: Optional[OperationExecutor] = None,
        status_provider: Optional[StatusProvider] = None,
    ) -> None:
        self.api_key = api_key.strip()
        self.memory_file = memory_file
        self.memory_manager = memory_manager
        self.send_json = send_json
        self.send_bytes = send_bytes
        self.on_failure = on_failure
        self.client_id = client_id
        self.operation_executor = operation_executor
        self.status_provider = status_provider
        self.session_id = f"gemini-live-{uuid.uuid4().hex}"
        self._client: Optional[genai.Client] = None
        self._connect_context = None
        self._session = None
        self._receive_task: Optional[asyncio.Task] = None
        self._closed = False
        self._audio_started = False
        self._input_parts: list[str] = []
        self._output_parts: list[str] = []

    @property
    def connected(self) -> bool:
        return self._session is not None and not self._closed

    def _config(self) -> types.LiveConnectConfig:
        instruction = build_aegis_live_instruction(
            self.memory_file,
            long_term_profile=self.memory_manager.format_for_prompt(),
        )
        return types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            input_audio_transcription={},
            output_audio_transcription={},
            system_instruction=instruction,
            realtime_input_config=types.RealtimeInputConfig(
                automatic_activity_detection=types.AutomaticActivityDetection(
                    start_of_speech_sensitivity="START_SENSITIVITY_HIGH",
                    end_of_speech_sensitivity="END_SENSITIVITY_HIGH",
                    prefix_padding_ms=VAD_PREFIX_PADDING_MS,
                    silence_duration_ms=VAD_SILENCE_DURATION_MS,
                ),
                activity_handling="START_OF_ACTIVITY_INTERRUPTS",
                turn_coverage="TURN_INCLUDES_ONLY_ACTIVITY",
            ),
        tools=[types.Tool(function_declarations=(
            MEMORY_TOOL_DECLARATIONS
            + MEMORY_EVENT_TOOL_DECLARATIONS
            + WIDGET_TOOL_DECLARATIONS
            + ACTION_TOOL_DECLARATIONS
        ))],
            session_resumption=types.SessionResumptionConfig(),
            context_window_compression=types.ContextWindowCompressionConfig(
                trigger_tokens=25_000,
                sliding_window=types.SlidingWindow(target_tokens=12_000),
            ),
            thinking_config=types.ThinkingConfig(thinking_level="low"),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
                )
            ),
        )

    async def start(self) -> None:
        if self.connected:
            return
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        self._closed = False
        self._client = genai.Client(
            api_key=self.api_key,
            http_options={"api_version": "v1beta"},
        )
        self._connect_context = self._client.aio.live.connect(
            model=LIVE_MODEL,
            config=self._config(),
        )
        self._session = await self._connect_context.__aenter__()
        self._receive_task = asyncio.create_task(
            self._receive_loop(), name=f"gemini-live-recv-{self.session_id}"
        )
        await self.send_json({
            "type": "live_status",
            "provider": "gemini_live",
            "state": "listening",
            "model": LIVE_MODEL,
            "voice": VOICE_NAME,
            "input_sample_rate": INPUT_SAMPLE_RATE,
            "output_sample_rate": OUTPUT_SAMPLE_RATE,
            "vad_silence_ms": VAD_SILENCE_DURATION_MS,
            "vad_prefix_ms": VAD_PREFIX_PADDING_MS,
        })

    async def send_audio(self, pcm: bytes) -> None:
        if not self.connected or not pcm:
            return
        if not isinstance(pcm, (bytes, bytearray)) or len(pcm) % 2 or len(pcm) > 256_000:
            LOGGER.warning("Dropping invalid Gemini PCM frame: type=%s bytes=%s", type(pcm).__name__, len(pcm) if pcm else 0)
            return
        await self._session.send_realtime_input(
            audio=types.Blob(data=bytes(pcm), mime_type=f"audio/pcm;rate={INPUT_SAMPLE_RATE}")
        )

    async def send_video(self, frame: bytes, *, channel: str = "camera", mime_type: str = "image/jpeg") -> None:
        """Forward one bounded JPEG frame to Gemini Live.

        The model receives both camera and screen frames through the same
        realtime video channel; the channel is included in the session event
        for diagnostics and UI status, while Gemini receives the image bytes.
        """
        if not self.connected or not frame:
            return
        if not isinstance(frame, (bytes, bytearray)) or len(frame) > 1_500_000:
            LOGGER.warning("Dropping invalid Gemini video frame: channel=%s bytes=%s", channel, len(frame) if frame else 0)
            return
        await self._session.send_realtime_input(
            video=types.Blob(data=bytes(frame), mime_type=mime_type or "image/jpeg")
        )

    async def send_text(self, text: str) -> None:
        if not self.connected:
            raise RuntimeError("Gemini Live session is not connected")
        cleaned = text.strip()
        if not cleaned:
            return
        self._input_parts = [cleaned]
        await self.send_json({
            "type": "live_input_transcript", "text": cleaned, "final": True
        })
        # Gemini 3.1 Flash Live accepts mid-session text through realtime
        # input. send_client_content is reserved for initial history on this
        # model and causes a 1007 invalid-argument close for live turns.
        await self._session.send_realtime_input(text=cleaned)

    async def _receive_loop(self) -> None:
        try:
            while not self._closed and self._session is not None:
                async for response in self._session.receive():
                    if self._closed:
                        return
                    if response.data:
                        self._audio_started = True
                        await self.send_bytes(bytes(response.data))

                    server_content = response.server_content
                    if server_content:
                        input_tx = server_content.input_transcription
                        if input_tx and input_tx.text:
                            text = input_tx.text.strip()
                            if text:
                                self._input_parts.append(text)
                                await self.send_json({
                                    "type": "live_input_transcript", "text": text, "final": False
                                })

                        output_tx = server_content.output_transcription
                        if output_tx and output_tx.text:
                            text = output_tx.text.strip()
                            if text:
                                self._output_parts.append(text)
                                await self.send_json({
                                    "type": "live_output_transcript", "text": text, "final": False
                                })

                        if server_content.interrupted:
                            await self.send_json({"type": "live_interrupted"})

                        if server_content.turn_complete:
                            await self._complete_turn()

                    if response.tool_call:
                        function_responses = []
                        for call in response.tool_call.function_calls or []:
                            function_responses.append(await self._execute_memory_tool(call))
                        if function_responses:
                            await self._session.send_tool_response(
                                function_responses=function_responses
                            )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            if not self._closed:
                LOGGER.exception("Gemini Live receive loop failed")
                # Run fallback outside this receive task.  Fallback closes the
                # failed session, which would otherwise cancel itself before
                # the legacy provider finished starting.
                asyncio.create_task(
                    self.on_failure(
                        str(exc), self._audio_started, " ".join(self._input_parts).strip()
                    ),
                    name=f"gemini-live-fallback-{self.session_id}",
                )

    async def _execute_memory_tool(self, call) -> types.FunctionResponse:
        name = str(call.name or "")
        arguments = dict(call.args or {})
        try:
            if name == "save_memory":
                result = await asyncio.to_thread(
                    self.memory_manager.save_fact,
                    arguments.get("category", ""),
                    arguments.get("key", ""),
                    arguments.get("value", ""),
                )
            elif name == "forget_memory":
                result = await asyncio.to_thread(
                    self.memory_manager.forget_fact,
                    arguments.get("category", ""),
                    arguments.get("key", ""),
                )
            elif name == "recall_conversations":
                result = await asyncio.to_thread(
                    self.memory_manager.recall_conversations,
                    arguments.get("query", ""),
                    arguments.get("limit", 5),
                )
            elif name == "save_memory_event":
                result = await asyncio.to_thread(
                    self.memory_manager.save_event,
                    arguments.get("event_type", ""), arguments.get("key", ""),
                    arguments.get("content", ""), arguments.get("attributes"), arguments.get("tags"),
                )
            elif name == "forget_memory_event":
                result = await asyncio.to_thread(self.memory_manager.forget_event, arguments.get("event_id", ""))
            elif name == "recall_memory":
                result = await asyncio.to_thread(
                    self.memory_manager.recall_memory, arguments.get("query", ""), arguments.get("limit", 5)
                )
            elif name == "get_system_status":
                result = await self.status_provider() if self.status_provider else {
                    "status": "unavailable", "reason": "status_provider_unavailable"
                }
            elif name in {"read_notes_context", "read_search_context", "read_calendar_context", "read_image_context", "notes_action"} or name in {item["name"] for item in ACTION_TOOL_DECLARATIONS}:
                result = await self.operation_executor(name, arguments) if self.operation_executor else {
                    "status": "unavailable", "reason": "widget_operation_unavailable"
                }
            else:
                result = {"status": "rejected", "reason": "unknown_tool"}
        except Exception as exc:
            LOGGER.exception("Memory tool failed: %s", name)
            result = {"status": "error", "reason": type(exc).__name__}
        return types.FunctionResponse(
            id=call.id,
            name=name,
            response=result,
        )

    async def _complete_turn(self) -> None:
        user_text = " ".join(self._input_parts).strip()
        assistant_text = " ".join(self._output_parts).strip()
        if user_text or assistant_text:
            try:
                await asyncio.to_thread(
                    _append_turn, self.memory_file, self.session_id, user_text, assistant_text
                )
            except Exception:
                # Transcript history is useful bookkeeping, but it must never
                # disconnect a healthy real-time voice session or activate the
                # legacy provider. Durable facts are stored independently.
                LOGGER.exception("Could not persist completed Gemini Live transcript")
        await self.send_json({
            "type": "live_turn_complete",
            "input_text": user_text,
            "output_text": assistant_text,
        })
        self._input_parts.clear()
        self._output_parts.clear()
        self._audio_started = False

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        receive_task = self._receive_task
        self._receive_task = None
        if receive_task and receive_task is not asyncio.current_task():
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass
        context = self._connect_context
        self._connect_context = None
        self._session = None
        if context is not None:
            try:
                await context.__aexit__(None, None, None)
            except Exception:
                LOGGER.debug("Gemini Live close failed", exc_info=True)
