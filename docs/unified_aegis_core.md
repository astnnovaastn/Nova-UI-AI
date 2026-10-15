# Unified Aegis core and conversation delivery

Implementation date: 15 October 2026. Desktop scope; mobile work remains paused.

## Runtime ownership

| Module | Responsibility |
|---|---|
| `astra_ai/core/aegis_ai.py` | Canonical Gemini Live provider, declarations, turns, input/output, import-safe public core and compatibility facade. |
| `astra_ai/core/aegis_live_context.py` | Shared prompt, runtime capability metadata, UI context and bounded per-conversation working references. |
| `astra_ai/core/action_jobs.py` | Existing durable queue, operational planning, dependencies, reconciliation and completed-result references. |
| `astra_ai/core/research_learning.py` | Configured research connectors, immutable scoped reports, Markdown knowledge and verified Notes transfer. |
| `astra_ai/memory/organizer_runtime.py` | Incremental Groq proposals and source-backed Gemini organization review using the shared budget. |
| `astra_ai/ui/backend/server.py` | Browser connections, audio transport, current-user scope resolution and validated UI delivery. |

Six overlapping implementation modules were consolidated into these existing
owners on 15 October. Their imports and tests were migrated, and their retired
source files removed from the live installation. Backend compatibility import
names remain small aliases for established callers. UI components and tests
remain in their existing component/test directories; temporary validation
artifacts are ignored and never shipped as production code.

Backend `gemini_live`, `aegis_runtime` and `action_jobs` imports alias their
canonical core modules; they do not start competing engines. The former standalone entry
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

## Desktop work and organization follow-up

The conversation panel has Chat, History and Tasks tabs. Tasks contains separate
Tasks, Learning and Approvals views with remembered filters and reading position.
It reads the same authoritative stores as the library. Progress percentages are
shown only when actual completed and total steps are recorded. Status changes
refresh quietly; they do not reload the message log. Approval decisions use the
same revision-bound service as the library and retain recorded timestamps.

A scoped notification opens its exact originating task or approval. A quiet
synthesized two-tone chime plays for a new notice after browser audio activation;
unchanged polling, reconnects and the initial backlog do not replay sounds.
Sound can be turned off independently of microphone mute and assistant playback.
No proprietary notification audio asset is copied. A direct Memory launcher sits
above Theme; the existing Settings entry remains available.

Session themes are presented by month, then week and day using Madrid's 4 AM
conversation boundary. Large months use week patches in the globe; all original
dots and timestamps remain. Counts and record pages use the same period resolver.
Category strands curve according to real endpoint geometry, without invented
links. Singleton observation relays that merely repeat a fact's label are omitted
from rendering while their source records remain stored and inspectable.

Palette version 4 restores actual yellow, orange and deep blue rather than aliases
for other colors. The supplied eight bases remain; eleven stable families derive
bounded perceptual shades. Only untouched builtin defaults are redistributed;
explicit family choices and category history remain. Stores are backed up before
this additive metadata migration.

Paraphrase collections require a source-backed model review; word spelling is
not the grouping rule. Review reads complete bounded passages, checks revisions
again after model latency, and keeps every original value and ID. Existing local
record vectors can supply candidate neighbors without another embedding request.
Model work remains sequential within the existing background budget. An exhausted
budget leaves work inspectable and queued; this rollout does not reset quotas.

On reconnect, bounded research/note handles are restored from completed durable
steps belonging to the same logical conversation and scope. Full reports and
unrelated conversation history are not inserted into the working state.
