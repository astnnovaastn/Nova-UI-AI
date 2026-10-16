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
- A live detailed-research submission reused saved evidence and entered a genuine daily-budget wait with a retry time, reader skeleton and accessible Sources. Submission did not display a started/progress toast.

## Runtime behavior and limits

Research identities, original briefs and initiating-turn references are stored before durable execution. Large briefs are replaced with handles in job arguments. Collected evidence is checkpointed before synthesis; quota pauses return to the scheduler rather than holding a worker or repeating searches. Research-ready notices use one durable scoped identity for reconnect deduplication.

Reader retrieval serves complete Markdown blocks with a 20,000-character page ceiling. Pathological single blocks exceeding the ceiling receive an explicit export notice; the original content remains available in exports. Additional saved pages spend no search/model requests. Expansion uses preserved evidence and appends a separate revision. Requests requiring fresh evidence can use the existing search tools to produce a new scoped report; automatic freshness classification remains conservative.

Images are drawn only from existing result metadata or image references in retrieved content with attributable source ownership. Unsuitable/unavailable images are omitted. Image IDs use the existing public-address/DNS-pinned redirect transport, raster MIME/size/dimension checks and serialized decoding. No image-search request is added.

One Gemini Live transport remains active across workspace/report selection. Focus updates and frozen turn metadata route both voice and text to the selected research thread. The preferred Live model accepts focus context updates; the older fallback model does not support the same mid-session context-injection path and has not been requalified for research voice focus.

## Remaining manual checks

Physical microphone attribution, audible acknowledgement/completion cues, acoustic echo behavior, native YouTube volume changes during real conversation and audible volume restoration require a hardware session. Restricted embeds/autoplay failures retain observed error states; publisher-specific outcomes depend on YouTube availability. Source images were validated with real raster fixtures; provider-specific image availability varies.

The production build retains the pre-existing Calculator eval and large-chunk warnings. Private reports, memories, credentials, recordings, generated bundles and runtime data are excluded from source delivery. Authoritative live stores were backed up before metadata changes.
