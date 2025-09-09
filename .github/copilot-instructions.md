
# Copilot / AI Agent Instructions — Astra_ai

This file helps an AI coding agent become productive in this repository. It focuses on the real, discoverable patterns, integration points, and developer workflows found in the codebase.

Key files & entry points
- `astra_ai/core/nova_ai.py` — primary (large) orchestrator for Nova; contains feature toggles, logging config, and many import fallbacks and mocks.
- `astra_ai/memory/` — several modules (`mem0_memory_system.py`, `nova_memory_interface.py`, `enhanced_nova_memory_interface.py`, `memory_cleanup_system.py`, `user_profile_manager.py`) where most memory logic lives. Many classes are stubbed and need implementations.
- `astra_ai/services/` — service modules (news, weather, music, vision) used by Nova via imports. Expect optional availability and try/except import patterns.
- `data/` and `astra_ai/` top-level JSON files — persistent storage used throughout (`memory.db`, `nova_ai_memory.json`, various `*.json` files).
- `requirements.txt` and `setup_python312_commands.bat` — developer environment hints.

Big-picture architecture & data flow
- Nova (core) orchestrates features and delegates to modular services under `astra_ai/services/` and memory managers under `astra_ai/memory/`.
- Memory modules are designed as a separate subsystem: ingestion (store/process_conversation), query/context generation (get_context_for_ai_response / retrieve), cleanup (memory_cleanup_system). Data is persisted to JSON or DB files in `data/`.
- External integrations (groq client, news API, Whisper, vision) are treated as optional. Code uses try/except to fallback to mocks. When adding functionality, follow this pattern: try import -> provide graceful mock or register feature-absent flag.

Project-specific conventions
- Defensive imports: many modules wrap optional dependencies in try/except and set a `<NAME> = None` or `MOCK` object. Preserve this pattern when adding new integrations.
- Logging: `nova_ai.py` configures file-only logging (writes to `alebot.log` / `alebot_detailed.log`) and suppresses console noise for specific loggers. Do not add noisy console handlers by default.
- Persistent data: prefer small JSON files under `data/` or `astra_ai/` for memory/profile data. Backups appear in `profile_backups/` — add migration scripts when changing on-disk formats.
- Stubs and TODOs: many classes and dataclasses are declared but empty. Implementations should keep public class names and APIs stable to avoid breaking other modules.

Developer workflows (discoverable)
- Install dependencies: `pip install -r requirements.txt` (use Python 3.12 where referenced by `setup_python312_commands.bat`).
- Run Nova (approx): `python astra_ai/core/nova_ai.py` (file contains `if __name__ == '__main__':` region). Some modules expect to be run as packages — use `-m` if necessary.
- Tests: repository contains `tests/` — run `pytest tests/` or `python -m pytest` to run the suite.
- Logs & debugging: check `alebot.log` and `alebot_detailed.log` in repo root for runtime traces.

Integration points & external deps
- groq client: referenced in `nova_ai.py` and `groq_package/`. Treat as optional; prefer injecting a working client (adapter pattern) rather than global imports.
- News/weather/music/vision services: located under `astra_ai/services/`. Each service may be missing; modules check availability and set `<SERVICE>_AVAILABLE` flags.
- Memory server option: memory subsystem can be exposed behind a small REST API (FastAPI/uvicorn) — a lightweight `memory_server` adapter is a recommended integration path if you need cross-process access.

How AI agents should edit this codebase
- Focus on completing concrete stubs in `astra_ai/memory/` first: these are the primary systems the project needs to be usable.
- Follow existing patterns: typing, dataclasses, enums, try/except import fallbacks, file-based JSON persistence.
- Preserve logging configuration in `astra_ai/core/nova_ai.py` and ensure new modules respect the file-only logging approach.
- When adding network endpoints or long-running services, include optional feature flags and a simple local-run command in `README.md`.

Examples to follow
- Implement memory retrieval to return simple JSON objects (see many JSON files under `data/` for shape expectations).
- Use the existing `user_profile_manager.py` dataclass shapes when updating profile storage and backups under `profile_backups/`.

If something is missing
- If a module is empty/stubbed, prefer small, test-covered implementations rather than large refactors. Add unit tests in `tests/` for each implemented behavior.

Next steps for the agent
- Suggest which stubbed classes to implement first (memory ingestion/retrieval, cleanup policies, or Nova memory interface adapter). Ask maintainers for priority if uncertain.

-- End of instructions (concise guide; add feedback or request specific implementation tasks to iterate) 

