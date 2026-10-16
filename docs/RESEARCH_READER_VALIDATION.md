# Research reader delivery — 2026-10-16

The existing Research workspace now uses the document width with modest padding, measured citation previews, compact SVG controls, source-backed image transport, separate research conversations and bounded composed reader pages. Existing report bytes and revisions remain unchanged; expansions are separate immutable entries and drafts retain their own optimistic revisions.

## Validation

- Backend: full regression suite, 620 passed and one skipped. Fixtures cover scoped reservations, 12,000-character briefs, quota checkpoints and restart recovery, bounded reader blocks, legacy presentation, image decoding limits, versioned extensions, report-turn references and pinned late replies.
- Frontend: 132 tests passed; TypeScript and production build passed. The existing globe suite passed all 46 checks.
- Populated browser review at 1280×720, 1536×864 and 1920×1080. Reader widths measured approximately 722, 918 and 1302 pixels, with 28–36 pixel content padding and a composer capped at 640 pixels.
- Keyboard citation preview measured 332×226 pixels, placed 10 pixels below its trigger without overlap. Escape restores trigger focus; source close restored the originating citation and reader scroll position (1080 pixels in the checked report).
- An actual muted-microphone typed Live follow-up correctly identified the selected public research topic. Switching to another report showed an empty independent conversation; returning restored the two saved messages.
- A live AI ui_action request opened Sources and produced an acknowledged reply matching the observed rendered Sources tab.
- Internal article rendering exposed validated follow-on links inside the document pane. Export fixtures produced real PDF, DOCX, HTML and Markdown output with source links.
- A live detailed-research submission reused saved evidence and entered a genuine daily-budget wait with a retry time and accessible collected findings. Skeletons are restricted to active empty-result processing. Submission did not display a started/progress toast.

## Runtime behavior and limits

Research identities, original briefs and initiating-turn references are stored before durable execution. Large briefs are replaced with handles in job arguments. Collected evidence is checkpointed before synthesis; quota pauses return to the scheduler rather than holding a worker or repeating searches. Research-ready notices use one durable scoped identity for reconnect deduplication.

Reader retrieval serves complete Markdown blocks with a 20,000-character page ceiling. Pathological single blocks exceeding the ceiling receive an explicit export notice; the original content remains available in exports. Additional saved pages spend no search/model requests. Expansion uses preserved evidence and appends a separate revision. Follow-ups stay attached to the selected report. Requests needing fresh or missing evidence append a scoped extension with stable source IDs; automatic freshness classification remains conservative.

Images are drawn only from existing result metadata or image references in retrieved content with attributable source ownership. Unsuitable/unavailable images are omitted. Image IDs use the existing public-address/DNS-pinned redirect transport, raster MIME/size/dimension checks and serialized decoding. No image-search request is added.

One Gemini Live transport remains active across workspace/report selection. Focus updates and frozen turn metadata route both voice and text to the selected research thread. The preferred Live model accepts focus context updates; the older fallback model does not support the same mid-session context-injection path and has not been requalified for research voice focus.

## Remaining manual checks

Physical microphone attribution, audible acknowledgement/completion cues, acoustic echo behavior, native YouTube volume changes during real conversation and audible volume restoration require a hardware session. Restricted embeds/autoplay failures retain observed error states; publisher-specific outcomes depend on YouTube availability. Source images were validated with real raster fixtures; provider-specific image availability varies.

The production build retains the pre-existing Calculator eval and large-chunk warnings. Private reports, memories, credentials, recordings, generated bundles and runtime data are excluded from source delivery. Authoritative live stores were backed up before metadata changes.


## Follow-up: loading indicators must reveal findings

Pending research now renders collected source passages directly in Reader. Full-page skeleton lines appear only during active processing, after a short initial delay, and disappear as soon as sources are available. A live saved pending report displayed eight findings with zero skeleton regions. The main view no longer displays internal budget identifiers or the retry date; a compact Summary pending state has an optional explanation.

A Working MM:SS counter uses persisted processing segments. Quota pauses freeze the counter and retries resume it without counting the paused interval. Legacy records with unknown timings do not invent elapsed durations. Targeted validation: 36 backend checks, 10 frontend research checks, TypeScript and production build passed.


## Follow-up: history speed, Media stability, and same-report continuations

History document requests now run independently of conversation hydration. A scoped, bounded frontend cache preloads recent history and deduplicates pending requests. Backend snapshots and bounded document projections invalidate on authoritative file replacement. Profiling against the 6.8 MB report store reduced warm in-process document projection time from approximately 693 ms to 0.9 ms (cold approximately 347 ms). These are backend timings, not a promise about network or first-page startup latency.

YouTube receives its own child mount inside a stable React host. Player teardown, pausing and unavailable-player errors are contained per video. Malformed media rows are ignored and video IDs deduplicated. The deployed browser rendered five cached honeybee videos after Show more, preserved the report while switching Reader/Sources/Media, and produced no console errors. The previously affected AI-race report also displayed its two collected videos alongside its honest discovery warning.

Article selection removes semantic publisher chrome, navigation-heavy containers and unmarked block-link menus before sanitization and scoped link IDs. Live review confirmed the ASU bee article retained Overview, Distance, Direction and the article paragraphs without How to Play/Play Game/Menu links. The Memeburn funding source retained its article sections and references without the site News/Crypto/Tech/About navigation. Archived evidence remains untouched.

A shared continuation path probes the rendered report first. Cached reader pages, sources and videos reveal without model/search requests. Further synthesis or explicit source/video retrieval appends under the same research identity, preserving drafts and original report revisions. Per-report admission guards prevent concurrent duplicate retrieval; checkpointed source searches survive quota retries. Progress lines append within the target view while existing content remains readable. An uncertain outbound request is not repeated automatically.

Each history row now has an options menu with Remove research. The existing trusted owner dialog confirms the exact revision; recoverable tombstones retain the archived report and conversation. Undo removal and Recently removed restore the record. Browser verification opened and cancelled the confirmation; no user reports were deleted. Fixture tests verify removal, restoration, stale revisions and cross-scope rejection.

Validation: full backend suite 629 passed, one skipped; subsequent extraction/continuation checks 44 passed. Frontend suite 135 passed, including stale-player cleanup. TypeScript and production build passed after final UI refinements. Live stores and prior code were backed up before deployment, and backend health passed afterward. Hardware microphone, audible sound cues, and native playback/volume restoration during an audible conversation remain manual checks.
