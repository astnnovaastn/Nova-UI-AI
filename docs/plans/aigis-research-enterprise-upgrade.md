# Aigis Research Enterprise Upgrade

Approved implementation plan. Gemini is primary; Groq is a research-writing fallback, never a conversation or voice replacement.

## Product invariants

- Retain the configured Gemini 3.5 Flash-Lite model and separate Gemini Live connection.
- Eligible fallback: provider quotas, rate limits, recoverable outages and timeouts. Never bypass local budgets, safety, authorization or privacy.
- Private evidence requires conversation-scoped permission before Groq processing.
- Preserve research-history appearance, themes, session/page routing, citations, originals, drafts and collaborative editing.
- Publish complete prepared research; preserve existing content during extensions.
- Normally three or four relevant illustrations, maximum six.
- Restore typed research-chat replies with text and interruptible Gemini audio.
- Sequential fallback is default. Cooperative processing is explicit, bounded and disabled by default.

## Milestone 1: Baseline and organization

Inventory routes, imports, launchers, runtime stores, media and tests. Group research persistence, providers, orchestration and presentation into cohesive modules. Separate backend source, tests, scripts, configuration and runtime state through centralized paths and compatibility entrypoints. Consolidate duplicate helpers without creating giant files. Record the history-panel baseline.

Gate: import/startup smoke tests, unchanged routes and existing regressions. Risk: relative imports and path assumptions.

## Milestone 2: Authoritative folder storage

Use a private state root with research/catalog.json and research/conversations/<session-id>/pages/<page-id> containing page, publication, evidence, media, extensions, operations and draft JSON. Store assets separately, retain explicit references to specialized collaboration/synchronization databases. Use versioned UTF-8 JSON, stable IDs and transactional staging with durable commit intent and recovery.

Add a repository boundary before replacing monolithic access. Preserve source ordering, revisions, checkpoints, tombstones and deep links. Verify a pre-migration snapshot before cutover; migrate explicit runtime paths. Backups live separately, with seven daily recovery points and one protected migration snapshot. Deduplicate unchanged assets, classify abandoned temporary files before cleanup, and never apply backup expiry to original content or user revisions. Implement reverse conversion preserving post-migration writes.

Gate: inventories/hashes agree, existing documents and attachments open, crash/lock/disk-full/concurrency/restore/retention/rollback tests pass. Depends on milestone 1.

## Milestone 3: Providers

Centralize typed task/request/result/failure/capability contracts. Gemini first; discover and validate Groq GPT-OSS 120B and 20B candidates. Cache discovery by credential configuration, coordinate shared credential pacing and preserve manual OpenAI selection. Support dedicated research credentials. Track private provenance and per-conversation consent.

Persist at most four outbound attempts per logical stage and one additional schema/content repair per operation within existing allowances. Honor retry headers, circuit breakers and single-writer concurrency. Reject late output, preserve checkpoints and usage counters; never splice partial provider output. Account-wide quota exhaustion must not trigger ineffective model hopping.

Gate: healthy Gemini causes zero Groq calls; deterministic tests cover all recoverable/nonrecoverable failures, capabilities, consent, restarts and accounting. Depends on milestones 1–2.

## Milestone 4: Research intelligence

Understand, plan, retrieve, normalize, extract, evaluate, synthesize, validate, construct and persist. Keep search independent of writing providers and Quick/Deep credentials separate. Reuse matching saved findings, search only missing/current evidence, preserve source provenance and stable citation IDs. Check topic coverage, distinguish claims/analysis/uncertainty and compare contradictory evidence. Maintain substantial connected Detailed prose using bounded section requests where needed. Select relevant images with attribution and no empty failed boxes. Citation identity checks are not proof of factual truth.

Gate: actual UI query and follow-up have substantial text, valid citations and relevant images; cached expansion uses zero provider calls; fallback repeats no completed collection. Depends on milestones 2–3.

## Milestone 5: Publication

Prepare full answer, citations, sources, illustrations, media and editor representation before atomically publishing completion. New pages expose no premature results; extensions preserve published material. Assets reach bounded terminal outcomes. Reuse one revisioned event coordinator and polling fallback; reconcile reconnects, missing events and delayed responses while preserving dirty drafts and window navigation.

Gate: no refresh required, no duplicate or stranded publication under restart/lost-event/duplicate-submit tests. Depends on milestones 2–4.

## Milestone 6: Reader and composer

Reserve actual composer height with explicit toolbar/content/composer regions. Preserve one central composer and New research/Ask Aegis routing. Keep arrow-only navigation only for multi-page conversations. Improve reading width, headings, tables, captions, image/text layouts and complete bibliography. Keep source actions internal and article-focused. Unify skeleton/reveal behavior, respect reduced motion and user scrolling. Preserve the history-panel appearance.

Gate: final sources remain clickable with expanded composer, selection and side panel at desktop/narrow/zoom/theme variants. Depends on milestone 5.

## Milestone 7: Selection

Use a narrow Selection card inside the composer upper-left. Keep full text separately from question. Capture headings/paragraphs/lists/tables, exclude citation UI/URLs/controls, preserve selection across focus changes, position collision-aware toolbar and support keyboard/Escape/focus restoration. Validate scope/page/source/revision and a 64,000-character limit. Clear pending cards after accepted send, preserve on failure, retain submitted cards in history and unsent cards only locally. Ordinary explanations remain Gemini; explicit researched additions can use fallback.

Gate: formatting/table/source selection, inspect/remove, failed-send, stale-revision, page-change and keyboard tests. Depends on milestones 5–6.

## Milestone 8: Attachments, streaming and voice

Resolve typed-turn playback ownership without requiring prior microphone speech, unlock playback on Send, keep microphone capture separately controlled and preserve interruption/Stop/single-owner audio. Never steal another window's lease. Validate supported uploads/paste/drop, preserve file identity/status and route image understanding only to capable Gemini paths. Bound context, sanitize streamed messages, preserve drafts and mark interrupted output accurately.

Gate: typed reply speaks before microphone utterance, interruption works, two windows produce one audio response; test reconnect, late frames, cancellation, ownership conflicts, uploads and context isolation. Depends on milestones 6–7.

## Milestone 9: Optional orchestration and evaluation

Explicit opt-in cooperative Detailed processing only after Gemini is unavailable. Bound analysis/planning and drafting to two planned passes plus one final synthesis, subject to normal budgets and attempts. Sequential remains default. Evaluate coverage/source comparison using defined criteria, expose privacy-safe success/fallback/latency/validation/usage summaries and optional supported cost ceilings. Unknown costs remain unknown.

Gate: cooperative work never runs implicitly and is disabled if evaluation shows no benefit. Depends on sequential reliability and prior milestones.

## Interfaces and security

Retain existing routes/deep links; extend provider settings with fallback/models/capabilities/health/privacy state, operation status with stage/provider/failure/retry/consent, selections with stable references and typed turns with server-resolved playback ownership. Add host-only model discovery and storage diagnostics.

All calls/secrets stay backend-only. Validate ownership, paths, uploads and tools. Treat external text as untrusted evidence. Logs contain structured IDs/categories/usage, not keys or private prompts. Preserve existing budgets, idempotency, concurrency, originals, undo and acknowledged exports. No decorative emojis in generated research/status.

## Delivery gates

Run backend/frontend regressions, TypeScript/build, actual UI Detailed report/follow-up, provider failure injection, four tabs, citations/images/exports/selections/attachments/voice, two-window synchronization, keyboard/focus/reduced-motion/zoom, migration/restoration/rollback and history visual comparison. Install after gates pass and push public source to the existing branch, excluding all credentials/private/runtime data.

Completion report must identify architecture, confirmed root causes, exact changes, migration/backup verification, retained Gemini configuration, real versus mocked Groq tests, fallback/budget/privacy behavior, UI/voice fixes, test outcomes and remaining blockers. Never label queued or quota-blocked work completed.
