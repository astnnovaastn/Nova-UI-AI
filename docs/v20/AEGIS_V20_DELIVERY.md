# AEGIS Work V20 — implementation delivery

16 November 2026. This is a **partial implementation of the full V20 program**, with working production adapters and an offline design gallery. It is not a claim that every roadmap phase is complete.

## Delivered

- 25 deterministic layout families integrated into the existing planner, alongside 17 legacy arrangements.
- 25 design packages with overview, selection and focused-result screenshots (75 captures) from the production canvas.
- Approved typed result renderer, semantic detail thresholds, native focus dialog, keyboard-selectable diagrams, full table data with 50-row pagination and inert fallback for unknown types.
- New-run source frames at 404 px; saved dimensions and positions remain authoritative.
- Empty-corridor virtual junction routing with original relation membership, shared segments and no unrelated-card relays.
- Actual source-stack components checked at 1/3/10 pages; fixed expanded-overlay overflow when an anchor is partly outside a narrow workspace.
- Version-2 task graphs with ready-task scheduling, durable completion, independent-branch recovery and retry of unfinished work. Legacy runs retain the legacy executor.
- Report section/evidence mapping, explicit evidence-gap sections and a Coverage review object. The UI labels mapping as diagnostic, not semantic verification.
- Optional read-only Google Calendar/Gmail adapters and Connections UI. One-time OAuth state, PKCE, encrypted owner-scoped tokens and explicit context selection. Selected summaries reach planning and writing.
- Optional read-only configured repository excerpts with paths, line numbers and SHA-256 revision identifiers. Path and file limits are enforced.
- Eight architecture/design documents, auxiliary setup instructions and a changed-file hash manifest.

The React/Svelte boundary, model configuration, research history, saved arrangements and Zephium reference clone were preserved. No new research, real AI/search requests, real Google authorization, calendar writes, messages or repository execution were performed.

## Verification

| Check | Result |
| --- | --- |
| Canvas unit/integration suite | 425 passed across 18 files |
| Backend Work/layout/V20/Google/repository suites | 113 passed |
| Desktop resource and preview network guards | 14 passed |
| Canvas sync | 363 copied files, 18 adapted modules, 173 durable patches |
| Canvas production build | Passed |
| React TypeScript and production build | Passed |
| All 20 existing workflows | Fake-provider publication tests passed; persisted report text retained |
| 25 families × 5/20/50/100 objects | Deterministic, collision-free, pinned geometry and original relations retained |
| Google Connections UI | Synthetic message/event selection, disconnect, consent link and no unsolicited window passed |
| Source stacks | Page-two URL identity, anchored expansion, 1/3/10 pages, keyboard, emulated touch, narrow viewport and reduced motion passed |
| Reference clone | Clean at 9026a1fffad74d6e201ef97fe8c02c1b01403cd2 |

Existing build warnings remain: Calculator eval, large React chunks and an unused canvas CSS selector. Python reports an existing Starlette/AnyIO deprecation warning.

## Desktop performance

Repeated Electron checks on this machine used the 50-object production-canvas fixture and verified that drag changed the node position.

- Three pan/zoom passes: frame-interval p95 **16.8 ms**, zero routing passes.
- Three card-drag passes: frame-interval p95 **16.8 ms**; routing updated only as geometry changed.
- No sampled long tasks; zero native browser views throughout.
- Initial route planning: approximately 52.6 ms in the worker.
- Last incremental route calculation during drag: approximately 15.9–17 ms.
- Separate main-thread script, style, layout and total task durations are recorded for each pass in desktop-results.json.
- Renderer working set: **161.5 MB before → 253.9 MB after** the measurement sequence. Private bytes: **73.6 → 165.2 MB**. Renderer cumulative CPU: **0.63 → 3.84 seconds**. These are snapshots, not proof of a memory leak or its absence.

The requested ≤20 ms p95 target passed for this fixture. It does not establish performance for every saved run. Paint was not independently traced, and no pre-change desktop benchmark was captured in this implementation session.

The first attempted drag probe used the hand tool and was discarded. The final probe switches to Select, asserts movement and reports routing changes; only those final results are cited.

## Evidence

Under astra_ai/ui/frontend/v20-verification:

- index.html — all 25 design packages and screenshot links.
- captures.json — 75 overview/selected/focus captures and browser checks.
- desktop-results.json — repeated desktop measurements and process baselines.
- desktop-50.png — measured desktop fixture.
- source-width-336.png and source-width-404.png — controlled same-viewport width comparison using the production source renderer. This is not a claim to be an archived screenshot of the old application.
- source-stack-3.png, source-stack-10.png, source-stack-narrow-reduced.png.
- google-messages-fixture.png and google-calendar-fixture.png — explicitly simulated account data.
- source-stack-results.json and google-ui-results.json.

The local gallery can run through the existing production canvas with tests/v20-server.cjs on loopback port 5187. It blocks external providers and does not save fixture runs as research history.

## Remaining scope and activation

Google Calendar and Gmail are the first account integrations, as requested. They require the host OAuth client configuration and the user's consent before actual use. Repository inputs require explicitly configured allowed roots. See AEGIS_GOOGLE_AND_REPOSITORY_SETUP.md; no secret should be pasted into chat or frontend code.

The full V20 plan still includes unfinished work: model-authored specialist task decomposition, task-level concurrent scheduling, confined test execution and reviewed file edits, approved account writes, richer media/calendar/annotation/revision interactions, editable cross-run presentation preferences, semantic requirement coverage and the complete saved-run/archived-run acceptance matrix. These remain listed in AEGIS_IMPLEMENTATION_ROADMAP.md.

No current UI action claims that an unavailable tool has executed. A generated diff remains a proposal; a fixture result remains simulated.

## Rollback

V20_CHANGED_FILES.json records observed source changes and SHA-256 values against checkpoints. The initial checkpoint is .backups/v20-20261116-122052; additional Google, scheduler and repository checkpoints have their own manifests.

Before restoring, preserve the current touched files and compare their hashes. Restore only the listed original files whose current hashes still match this delivery, so concurrent edits are not overwritten. Review explicitly listed additions before removing them. Do not recursively replace the project.

The two pre-existing backend test files were not in the initial checkpoint. Their changes are: test_work_runs.py now expects only admitted completed task stages; test_work_relations.py supplies topic-matching evidence for its complete deep-report fixture. Reverse those test edits manually if reverting the execution changes.

After restoring source/adapters, run npm run sync and npm run build in work-canvas, then npm run build in frontend. Rebuild rather than copying individual hashed chunks. The reference clone requires no rollback because it was not modified.

