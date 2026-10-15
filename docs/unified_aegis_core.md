# Unified Aegis core and conversation delivery

Implementation date: 15 October 2026. Desktop scope; mobile work remains paused.

## Runtime ownership

| Module | Responsibility |
|---|---|
| `astra_ai/core/aegis_ai.py` | Import-safe public core and compatibility facade. |
| `astra_ai/core/gemini_session.py` | Canonical provider configuration, tool declarations, Live turns, text input, output transcription and asynchronous tools. |
| `astra_ai/core/runtime_context.py` | Shared capability descriptions, bounded UI context and activity events. |
| `astra_ai/core/working_context.py` | Latest request and a bounded set of actual operation references; no hidden reasoning transcript. |
| `astra_ai/core/action_jobs.py` | Existing durable executor, concurrency, dependencies, reconciliation and safe result references. |
| `astra_ai/core/task_coordination.py` | Operational-plan adapter from existing saved tasks into that executor. |
| `astra_ai/core/research_artifacts.py` | Immutable scoped reports, configured connectors, report pages and verified Notes import. |
| `astra_ai/core/research_learning.py` | Existing research queue, Markdown documents and external-knowledge index. |
| `astra_ai/memory/organizer_runtime.py` | Incremental Groq organization through the existing background budget. |
| `astra_ai/memory/organization_review.py` | Revision-bound Gemini review of ambiguous content merges. |
| `astra_ai/ui/backend/server.py` | Browser connections, transport, current-user scope resolution and validated UI delivery. |

Backend `gemini_live`, `aegis_runtime` and `action_jobs` imports alias the same
core modules; they do not start competing engines. The former standalone entry
point is preserved byte-for-byte in `legacy_aegis_ai.py`, loaded only for explicit
legacy callers or command-line execution. `teastai.py` is not activated.
The old `TextChat` class remains available to compatibility callers and its
tests, but the desktop server no longer instantiates or probes it. HTTP chat and
ordinary transcript endpoints adapt to the connected Live session. News widget
lookup retains its structured connector flow without starting the legacy AI.

## Conversation and audio

- Connect on the first typed or microphone interaction. Typing while muted does
  not request microphone permission. Both inputs use Gemini Live and output
  speech plus a readable transcript.
- Keep the logical session separate from microphone state and widget navigation.
  Reconnecting an already used page restores the conversation even while muted.
- A completed turn freezes its request ID, transcripts, generation and UTC
  timestamp before any persistence await. Generation completion and history
  completion are separate events. Late storage acknowledgements cannot erase new
  microphone input.
- Provider reception continues while tools and memory persistence run. Current
  verified Live 3.8 declarations use `NON_BLOCKING`, with tool results scheduled
  `WHEN_IDLE`; the existing 3.1 fallback retains its compatible transport.
- Presentation transitions do not reset native capture or VAD. Existing bounded
  pre-roll and waveform-based echo discrimination remain. There is no blanket
  post-playback suppression window.
- Typed Send interrupts playback and provider generation without canceling the
  underlying job. Cancellation packets for the old spoken answer preserve the
  newly typed request. Completed retained request IDs reconcile after restart
  without repeating generation or writes.
- Autoplay refusal leaves the transcript visible and offers **Enable Aegis audio**.
  Explicit interruption, session end and task cancellation remain distinct.

The prompt prioritizes the newest request and actual task artifacts. Older
development topics and assistant guesses cannot become standing instructions.
Supplemental query context no longer injects unrelated base history. A deferred
cache refresh does not send an old completed topic into a new utterance.

## Durable operations and research

`run_action_batch` accepts `goal`, dependencies and `result_refs`. Each reference
maps a target argument to `{action_index, result_path}` using RFC 6901 JSON
pointers. Sources must be earlier completed actions; the resolver evaluates no
code. Scope, identity, credentials, consent and approval bindings are rejected.
Large values must use artifact handles. Original actions remain available for
idempotency checks; resolved arguments are journaled for uncertain-write recovery.

For the common workflow, standalone `search_web(save_to_notes=true)` expands into
search followed by `notes_action(import_research)` with result references. Both
steps live in the same existing durable job. A retry, mute, acknowledgment or
provider turn boundary cannot strand the authorized Notes step. Batch callers
instead supply those two explicit actions. Completed work never repeats.

Quick lookup uses configured `SERPAPI_KEY`. Detailed retrieval uses
`TAVILY_API_KEY` and Tavily advanced search. Firecrawl is not a fallback. Up to
four deduplicated subquestions use at most four network slots. No paid Batch API,
billing activation, key rotation or automatic provider substitution is added.
Tavily's documented authentication and advanced-search contract is described in
the [official endpoint reference](https://docs.tavily.com/documentation/api-reference/endpoint/search).

Reports have immutable IDs, SHA-256 revisions, dated sources, completeness and
explicit failures. Live receives a bounded summary and handles. Full source
content is retained behind scoped report pages; report-size limits are explicitly
marked partial. Failed searches without sources do not become reports. Search
exceptions disclose exception types, not credential-bearing URLs. Authentication
failures stop repeat requests until the configured key changes; provider failures
do not trigger generated code repairs.

`research_artifact_action` and `GET /api/research/{id}` return bounded pages.
HTTP scope comes from the current connection and rejects supplied profile/project
IDs. Full reports also enter the existing Markdown research directory and shared
external-knowledge index, rather than becoming personal facts or instructions.

Notes import journals intent before writing, creates a new note, compares the
persisted body hash with the artifact revision and records its result. Ambiguous
crash outcomes reconcile rather than repeat writes. An edited imported note
produces a conflict. Opening the result uses Review Notes so an unsaved editing
draft is preserved. UI acknowledgement is reported separately from persistence.

The Search widget and history use the same artifact. Long reports render in
explicit 20,000-character portions; copying/importing still uses the full stored
report. Partial evidence stays readable with limitations.

## Organization and library consistency

Frequent words and fixed keyword dictionaries no longer generate root-level
collections. Only saved source-backed groups and registry memberships enter the
projection. Existing records, classifications, category IDs, timestamps and facts
are preserved. Category growth remains unlimited and category lists paginated.

Groq may propose memberships in existing categories and compatible merge
candidates. Proposals include actual source quotes and record IDs. Existing
category membership is preferred to a new family. Topic updates reuse an
existing stable group rather than creating a fresh group for every membership
combination.

Ambiguous category merges use a persisted queue keyed by scope, content and
revisions. Gemini reviews bounded complete passages; overly large or incomplete
candidates remain unresolved. Similar words alone are insufficient. Cross-scope,
private, stale, incompatible-policy and builtin-source merges are rejected.
Review rechecks evidence after model latency, backs up authoritative stores before
its first additive change, and calls the existing reversible category operation.
There is no new human-approval flood or background executor. The existing shared
model lease serializes Groq work and Gemini review; active Live conversation has
priority. Quota exhaustion remains inspectable and does not authorize substitution.

Library counts/pages/globe retain the existing scoped membership resolver.
`library_action` now covers category discovery, record pages, full details and
navigation as well as existing approval/task operations. Camera guidance still
uses validated IDs and frontend acknowledgements.

## Desktop presentation

- Conversation task disclosure reads the authoritative library task/run stores,
  including work started outside the batch tool. Rows show actual states and
  supported controls; details expose recorded attempts, results and sources.
- Job progress uses sequence checks; late duplicate events cannot regress state.
- History has its own day header, back control, search and secondary Madrid/4 AM
  information. History remains mounted across Chat/History changes, with stored
  reading positions. Browsing does not activate a conversation.
- Chat follows new messages only when already near the bottom. Task progress
  cannot pull a reader away from earlier text. Scrollbar tracks match the surface.
- Dashboard orb and supplied globe renderer, colors and layout are unchanged by
  this phase; removing synthetic word collections changes only real grouping data.

## Validation and limits

Backend, frontend, TypeScript, build and measured desktop results are recorded in
`unified_aegis_validation.md`. Synthetic timing tests verify capture continuity at
0/50/100/250 ms offsets; they do not measure physical microphone recognition.
The existing speaker, camera and presence systems remain separate. Physical
camera validation is still outstanding on this camera-less computer.

Runtime memory, learned research, journals, credentials and generated artifacts
remain excluded from Git. Rollback consists of restoring the previous source
revision and retaining compatibility imports; authoritative memory is never
replaced by an older code checkout.
