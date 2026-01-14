# Memory System Upgrade Specification

Goal
----
Design a pragmatic, testable upgrade to the existing Astra/Nova memory subsystem that:
- fixes degradation and integrity issues seen in long-running sessions,
- unifies vector, persistent (SQLite), and file-backed memories,
- provides self-awareness (health, confidence, gaps), and
- ships with a migration, testing, and rollout plan.

Why now
--------
The repo already contains multiple memory implementations (JSON-backed `memory_manager.py`,
`SuperMemoryDatabase` / `SuperMemorySystem`, vector memory with FAISS, and `EnhancedMemorySystem`).
These overlap but lack a clear integration, tests, and migration path. This spec produces a single
upgrade plan that re-uses existing components where safe and prescribes minimal, low-risk changes.

Contract (API + data shapes)
---------------------------
- Memory input: (user_message: str, ai_response: str, context: Optional[dict]) -> Dict[result]
- Memory storage record (canonical):
  - id: str
  - timestamp: ISO8601 str
  - user_message: str
  - ai_response: str
  - importance: float (0.0-1.0)
  - topics: list[str]
  - source: str
  - tags: list[str]

- Public methods (minimal surface area):
  - store_exchange(user_message, ai_response, metadata) -> id
  - search(query, limit=10) -> List[records]
  - recent(limit=20) -> List[records]
  - get_status() -> {healthy: bool, metrics: {...}}

Design decisions
----------------
- Canonical storage: keep lightweight sqlite DB (`super_memory.db`) as primary persistent store.
- Semantic search / similarity: keep FAISS / SentenceTransformer vector store as an index layer linked
  to sqlite by integer id. Persist metadata in sqlite; persist vectors to disk for fast rebuild.
- Use existing `SuperMemoryDatabase` class as basis; harden connection handling and add health checks.
- Retain JSON managers (`memory_manager.py`) as graceful legacy fallback and adapter.
- Continuous processing: use `ContinuousMemoryProcessor` from `enhanced_memory_system.py` as a background
  worker, but wire it to the canonical storage APIs (not internal JSON files).

Migration plan
--------------
1. Add an adapter `adapters/json_to_supermemory.py` that reads existing JSON files (`astra_ai/memory/*.json`)
   and imports exchanges into `super_memory.db` with id mapping (log mapping file).
2. Run adapter locally to create `super_memory.db` and keep JSON as read-only fallback.
3. Switch runtime to use `UnifiedMemoryIntegration` which will prefer the SuperMemorySystem and vector index.

Testing & Quality gates
-----------------------
- Unit tests:
  - `tests/test_supermemory_db.py` (add/ retrieve/ search/ concurrency)
  - `tests/test_vector_memory.py` (mock SentenceTransformer; add/search semantics)
- Integration tests:
  - `tests/integration_memory_end_to_end.py` uses a temp sqlite file, adds exchanges, verifies search and
    that `UnifiedMemoryIntegration.process_conversation` updates status.
- CI gates: lint, unit tests, integration tests. Aim for small, fast tests.

Monitoring & Metrics
--------------------
- Memory health report (exposed as method `get_status()`):
  - DB connection status, last write timestamp, total records, avg insert latency
  - Vector index size and last rebuild time
  - Confidence metrics (fraction of records with importance > 0.7)
- Add periodic checkpoint logs and optionally a small `health.json` in `data/` for external supervisors.

Implementation roadmap (phases)
------------------------------
Phase 0 — Spec + tests (this PR)
- Add this spec to `docs/` (done).
- Add unit test scaffolding and a small test for `SuperMemoryDatabase`.

Phase 1 — Stabilize canonical store (2–3 days)
- Harden `SuperMemoryDatabase` (reconnect logic, retry/backoff, proper commits, migrations).
- Add `get_status()` API and health logging.

Phase 2 — Adapter + migration (1–2 days)
- Implement `adapters/json_to_supermemory.py` and run locally.
- Add a small CLI `scripts/import_json_memories.py` that runs the adapter and outputs mapping.

Phase 3 — Integration & continuous processing (3–4 days)
- Wire `ContinuousMemoryProcessor` to use canonical APIs.
- Ensure `UnifiedMemoryIntegration` prefers enhanced components but falls back to JSON adapter if needed.
- Add feature flag / config toggle to switch between legacy and new memory systems at runtime.

Phase 4 — Tests, docs, rollout (1–2 days)
- Add integration tests, update README, provide migration instructions in `docs/`.

Low-risk immediate improvements (proactive)
-----------------------------------------
- Add a small unit test for `SuperMemoryDatabase.add_exchange` and `get_recent_exchanges`.
- Add `data/` folder to repo root (if missing) and ensure file permissions allow atomic writes.
- Add `memory_requirements.txt` (if new Python libs are used: sentence-transformers, faiss-cpu) and update
  top-level `requirements.txt` accordingly.

Files to change (recommended)
-----------------------------
- `astra_ai/memory/super_memory_db.py` — harden and export `SuperMemoryDatabase.get_status()` and connection helpers.
- `astra_ai/memory/vector_memory.py` — ensure model loading is optional and add a fallback for CPU-only
  or mocked operation during tests.
- `astra_ai/memory/unified_memory_integration.py` — add config option to prefer canonical store and call health APIs.
- Add tests under `tests/`.

Next steps (concrete)
---------------------
1. If you want, I will: add the initial test `tests/test_supermemory_db.py` and a small hardening change to
   `astra_ai/memory/super_memory_db.py` to expose `get_status()` and safe reconnect. (choose: proceed or review first)
2. Or I can implement the JSON-to-sqlite adapter and run a local migration dry-run.

Requirements coverage
---------------------
- /specify memory_system_upgrade -> Done: created this specification and mapped it to repo components.

Appendix: assumptions
---------------------
- The project runs on Python 3.10+ (some files reference 3.12/3.14 pyc but code is backwards compatible).
- FAISS and sentence-transformers are optional; vector features can be toggled off for minimal rollout.
