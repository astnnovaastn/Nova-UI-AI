# Live Memory Explorer validation — 2026-10-13

## Delivered behavior
The authoritative shared service now supplies one paginated library for memories, approvals and tasks. Category counts and pages use one scoped membership resolver, including descendants, merged aliases and explicit memberships. Registry storage has no 127-category limit. Sourced content collections are read-only, separately labeled, and paginated without the former 100-collection cutoff; the globe retains a bounded collection projection.

Approval details show the proposed content, actual reason, optional supporting evidence and consequences. Empty technical metadata and repeated titles are omitted. Exact-version buttons delegate to existing stores; voice decisions require a previously explained version and an attributed current confirmation. Memory approval decisions retain additive history with original recorded dates only. Forgotten relationship endpoints suppress old decision details.

The library heading itself switches views. Each view retains its filters, selection and scroll. Refresh and close are aligned. Waiting indicators use a restrained yellow halo and three small green dots, disabled under reduced motion. The waiting clock changes locally each second without polling storage each second. Background polls and revision events apply quietly without replacing existing content with a loading screen.

## Engine patches
The supplied Canvas design remains. Worker preparation includes spherical layout and the link index. Small populated patches sit outward; automatic rotation is slower; focus and wheel zoom complete through 350 ms elapsed-time transitions. Wheel zoom follows the pointer. Greetings use one collection, while larger collections use compact five-day presentation batches and up to 180 members per patch. Original records, speaker dates and conversation history are unchanged. A small dated patch focuses its contents; the core hub retains the entire category.

The latest user-supplied palette supersedes the earlier six colors: blue #5b8def, gray-blue #8b95a7, red #d9544f, green #6fcf7f, purple #9b6bff, pink #ffb3c1, deep red #8f1d2c and deep violet #5a3aa8. Legacy family identifiers remain compatible; category IDs and history are preserved. Stable bounded OKLCH shades adjust to the shared panel surface.

Zoomed selection omits unrelated background dots/strands and offscreen selected strands from drawing, while keeping every record and adjacency available. Connections in the contextual card are collapsed until opened. Camera preferences and the Memory page survive reload. The dashboard orb remains unchanged.

## Live behavior and learning
A shared subscription runs from UI startup, with Canvas mounted only while Memory is visible. Actual committed IDs and returned recall IDs drive formation and traveling signals. AI view operations validate IDs and coordinates, acknowledge after mounting/application, and yield to recent pointer interaction. Research fan-out supports at most four deduplicated subquestions, checkpointed searches, one synthesis and existing budget/queue limits.

Microphone mute ends capture/user activity, retaining provider session and AI playback. Pending notices persist and delivery requires an actual client acknowledgement. Stale approvals are dismissed before offering speech. Internal notice events cannot authorize memory writes or their own approvals. Text notices remain available without creating unsolicited provider sessions.

The optional camera decoder runs in the approved separate .venv_presence with OpenCV 4.13.0.92 and NumPy 2.2.6, at most one bounded frame/second. A Windows Job Object caps memory at 256 MiB per process and CPU at 10%; two process slots accommodate the venv launcher and decoder. Credentials are omitted from its environment. Resource-limit failure disables detection. Consecutive-frame results are presence, absence or unknown, never identity. Browser camera use shares one stream and releases automatically acquired leases. Optional Gemini images require explicit UI consent and verification on the already selected model with a small synthetic probe, plus bounded quotas; no continuous provider uploads.

## Validation
- Store preservation audit retained all 701 original record IDs and values, all 2,000 backed-up recent transcript IDs/contents, and three forgotten record values. Runtime backups and captures remain local.
- 303 backend regressions passed, including temporary-data category growth, scope rejection, memberships, stale and voice approvals, restart-safe research checkpoints, mic activity/output separation, notice restrictions, quota handling, missing detector and the actual isolated decoder with blank fixtures.
- 95 existing frontend regressions and 39 globe/adapter/palette tests passed.
- TypeScript and production build passed. Existing warnings concern Calculator eval, dashboard bundle size and deprecated backend lifespan hooks.
- Populated desktop checks verified category counts/full details, retained library during focus, approval/menu behavior, aligned controls and Memory persistence on reload. No live approval was decided during UI inspection.
- Latest observed live snapshot: 2,884 records and 6,086 connections. Earlier 2,873-record snapshot retained 3,132 real dots/hubs/relays, with an observed 4.90 ms frame drawing cost.
- Development-only fixtures contain no private data or provider calls. Earlier checkpoint: 5,000 records prepared in 326.5 ms, overview drawing median 6.6 ms / p95 9.3 ms, measured callback pacing 8.4 FPS; focus completed in 393.9 ms. A 20,000-record fixture prepared in 1,586 ms with drawing median 13.2 ms / p95 23.9 ms and callback pacing 6.7 FPS. In-app browser pacing varied sharply between visible/hidden surfaces, so these measurements do not prove 60 FPS, final older-hardware performance or mobile performance. The larger-fixture FPS target remains unverified after final grouping/palette polish.

## Outstanding physical checks
This computer has no camera: real hardware detection, permission revocation and a full physical presence-to-speech cycle remain outstanding. Optional cloud-camera capability is verified only through its explicit runtime UI flow; automated tests use mocks. Mobile remains paused. Provider quota behavior is tested with fixtures, not by exhausting real keys. No private memory, recordings, credentials or runtime artifacts are included in the Git commit.
