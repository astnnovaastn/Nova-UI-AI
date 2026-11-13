# AEGIS Work — Autonomous Canvas Designer
Implementation and local validation, 6 November 2026.

## Installed behavior

The existing Svelte/XYFlow graph now has a provider-free Auto Arrange control. It uses a dedicated Web Worker and the existing React bridge. It does not call research, search, Gemini, Groq or Tavily.

Existing canvases are unchanged until explicitly arranged or manually moved. Newly accepted Work research marks its initiating window for incremental arrangement. Other windows receive committed geometry only; they retain their navigation and viewport.

All 17 named strategies are implemented and exercised with deterministic fixtures: horizontal pipeline, vertical timeline, milestone groups, branching tree, top-down hierarchy, dependency graph, agent swimlanes, evidence clusters, grouped subgraphs, question radial, synthesis hub, comparison columns, matrix, gallery, editorial, cause-and-effect and converging agents. Strategies requiring absent metadata explain why they are unavailable. Auto scores compatible candidates for collisions, crossings, area and displacement. These are geometric heuristics, not model-generated judgments about research quality.

Preview is isolated from saved geometry. Large moves and regrouping require Apply. One animation coordinator moves the real nodes and their connectors. One or two labeled cursors approach and remain attached to their target cards. Pause, Resume, Stop, optional Follow, reduced motion and one-operation Undo are supported. Stop returns to the preceding committed geometry. Pin, size-lock and manual-position protection are available through existing node controls and the popover.

Locked or overlapping constraints produce explanations rather than silent displacement. Parent/child translation preserves relative coordinates. Map containers expand around known members. Presentation group outlines do not create evidence relationships.

## Interfaces and persistence

- GET/PUT `/api/work/runs/{identifier}/layout`: scoped layout metadata, independent revision, operation identity, geometry, groups, constraints and one previous arrangement.
- PUT requires `expected_revision` and `operation_id`; duplicate requests are idempotent, stale revisions return 409, removed records reject writes.
- Input validation bounds payload size, node/group counts, IDs, coordinates and dimensions; rejects NaN, infinity, invalid types and invalid group references.
- Commits use the existing repository lock and transaction writer. No alternate report store was introduced.
- A successful commit emits `canvas_layout`. Clients reconcile scoped updates with a 2.5-second visible-window polling fallback.
- Conflicting saves offer Refresh and replan. Transport failures retain an explicitly unsaved preview with Retry/Cancel.
- Cancellation and disposal invalidate late worker replies and acknowledgements. Deferred resize saves retain their original page owner.
- The layout worker has a stable bundle path across updates, bounded planning timeout and retry recovery.
- Existing chosen/hidden state remains compatible. Report prose, citations, media catalogues and provider configuration are not rewritten.

## Source changes

Paths below are relative to this checkout.

New:
- `astra_ai/core/work/canvas_layout.py`
- `astra_ai/ui/backend/tests/test_canvas_layout.py`
- `astra_ai/ui/frontend/work-canvas/src/designer/types.ts`
- `astra_ai/ui/frontend/work-canvas/src/designer/planner.ts`
- `astra_ai/ui/frontend/work-canvas/src/designer/planner.worker.ts`
- `astra_ai/ui/frontend/work-canvas/src/designer/coordinator.ts`
- `astra_ai/ui/frontend/work-canvas/src/designer/ArrangeControl.svelte`
- `astra_ai/ui/frontend/work-canvas/src/designer/DesignerOverlay.svelte`
- `astra_ai/ui/frontend/work-canvas/tests/designer.test.ts`
- `astra_ai/ui/frontend/work-canvas/scripts/designer-patches.mjs`

Integration:
- `astra_ai/ui/backend/api/work.py`, `astra_ai/ui/backend/server.py`
- `astra_ai/ui/frontend/src/workspaceSync.ts`
- `astra_ai/ui/frontend/src/components/Research/WorkCanvasHost.tsx`
- `astra_ai/ui/frontend/src/components/Research/ResearchWorkspace.tsx`
- `astra_ai/ui/frontend/work-canvas/src/AegisWorkHost.svelte`
- `astra_ai/ui/frontend/work-canvas/src/store.svelte.ts`
- `astra_ai/ui/frontend/work-canvas/vite.config.ts`
- `astra_ai/ui/frontend/work-canvas/scripts/sync-upstream.mjs`

Upstream adaptations are reproduced through synchronization patches for WorkCanvas.svelte, CanvasNode.svelte, WorkEdge.svelte and canvas-model.ts. The sync command copied 362 pinned source files, with 14 adapted files and 83 total integration patches. It regenerated upstream/MANIFEST.json. The Zephium reference source was not edited. Existing MPL notices remain in the built bundle.

Generated assets are installed under frontend/public/work-canvas; the React production build is under frontend/dist. The backend supervisor was restarted and verified healthy on port 8340.

## Backup and preservation

Before persistent geometry changes, a checkpoint ZIP and SHA-256 manifest were created at:
`state/backups/autonomous-canvas-20261106/checkpoint.zip`
`state/backups/autonomous-canvas-20261106/manifest.json`

All 826 archived entries were verified. Initial Windows long-path copy trouble was handled by the verified archive rather than dropping files.

The final checkpoint comparison found research-state changes limited to additive canvas layout metadata/operation receipts and their catalogue hashes/sequence. Work execution records did not change. Existing research report content and assets remained unchanged.

The history UI and stylesheet remain unchanged. The ResearchWorkspace.tsx diff is limited to layout GET/PUT bridge methods and a storage-safe initiating-window marker on already accepted Work submissions. No history rendering or controller redesign was performed.

## Automated validation

- Canvas suite: **135 passed**, including 32 designer tests.
- Backend layout, Work, shared workspace, session-page and folder-store regressions: **60 passed**.
- React TypeScript and production build: passed.
- Standalone designer/worker TypeScript: passed.
- Svelte canvas production build: passed.
- Upstream synchronization patches: applied successfully.

Designer coverage includes all 17 distinct deterministic arrangements, cyclic/disconnected graphs, mixed sizes, constraints, parent/child protection, preview isolation, Pause/Resume/Stop, reduced motion, failed-save idempotency, stale-revision replanning, disposed-page acknowledgements and deterministic incremental-arrival fixtures.

Backend coverage includes owner scope, malformed JSON/geometry, idempotency, stale revisions, concurrent writers, Undo, removal/restoration and a route test whose orchestrator factory throws if a layout action tries to instantiate research.

The older React extracted-function tests have **seven inherited failures**, reproduced against the pre-change source checkpoint: five history harness failures (missing current dependencies), one saved-selection harness missing setCanvasPanel, and an outdated progress-label expectation (Working versus Collecting evidence). They are not reported as passing. Related conversation, voice-session and WebSocket tests passed.

Existing build warnings remain: Calculator eval, large React chunks, unused welcome CSS, runtime AEGIS logo asset resolution, AskCard static/dynamic import overlap and the Starlette/AnyIO deprecation.

## Real UI validation

Used saved reports only; no new research was submitted.

- NVIDIA report: preview, two-cursor movement, actual geometry changes, reload persistence, Pause, Stop rollback, Undo, pin/unpin, lock/unlock, manual card resize and resize persistence.
- Two windows on the same report: four of five nodes moved, both windows matched saved geometry, and the receiving window retained its viewport.
- Separate windows/pages remained independent.
- Browser-rendering knowledge map: 21 actual graph nodes, required preview, real map/agent-card movement, container adjustment and Undo restoring the original geometry.
- Source-heavy Tidal Power report: 18 saved sources, 15 canvas nodes, evidence-cluster preview, Apply and Undo restoring the original geometry. Internal source cards still opened in the source browser.
- Reader and Sources opened; Media showed its existing video-discovery quota state without triggering another search. Edit was opened without editing content.
- Keyboard Escape closed Auto Arrange and restored focus to its trigger.
- Responsive checks at 390 × 844 and 1440 × 900. Fixed the popover clipping behind the navigation rail; at 390 px it occupies x=72..358 and remains fully visible.
- Dark-theme controls and existing composer clearance inspected.

## Measured performance

- Auto planning for a synthetic 250-node mixed graph: **110 ms** in the isolated test run (earlier run: 103 ms).
- Real 21-node map animation: **229 frame intervals**, mean **23.8 ms**, 95th percentile **33.4 ms**, in the local in-app browser while testing.

- Real 15-node source-heavy animation: **263 frame intervals**, mean **18.8 ms**, 95th percentile **33.3 ms**.

These measurements are machine/session-specific, not a universal frame-rate guarantee. Planning is off the main thread. Animation is time-based, large schedules are bounded, and reduced motion avoids cursor travel. Frame interval diagnostics stay local; they are not transmitted.

## Limits and recovery

No provider budgets changed. Automatic live research integration was exercised through deterministic node-arrival fixtures, not a new paid generation. Physical microphone/audio, every export format, all themes, 1920-pixel width and every possible 1,000-node browser rendering workload were not exhaustively retested. Existing voice ownership and export implementations were retained.

The planner reports unsatisfiable protected layouts. It cannot manufacture semantic categories absent from the saved graph. Layout presentation groups are visual only.

For a failed save, use Retry or Cancel; for a revision conflict, use Refresh and replan. For a saved arrangement, Undo commits the previous geometry only against the current revision. Reopening a saved page does not replay its old animation.

No source was pushed or published. This live checkout has no usable root Git worktree, so delivery is local with a verified checkpoint rather than an invented commit.
