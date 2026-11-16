# Implementation and rollback

## Current delivery status

| Phase | State |
| --- | --- |
| 0 Architecture package | Eight documents, catalog and source integration record |
| 1 Simulation/compatibility | Production-canvas fixture entry, network guard, deterministic layouts and backend tests; complete workflow event replay matrix remains |
| 2 Readability/results | 404 px defaults for new source frames, semantic detail and typed focus renderer; full media/editor interactions remain |
| 3 Composition/strings | 25 families plus 17 legacy arrangements, semantic Discovery placement, virtual junctions and retained logical relationships; performance acceptance is reported separately |
| 4 Task execution | Ready-task scheduling over the validated graph, omitted unnecessary stages, durable statuses and independent-branch recovery; model-authored specialist task decomposition and concurrent task scheduling remain |
| 5 Developer capabilities | Owner-only source excerpts from host-configured repositories, line references and revision hashes; confined test runner and reviewed file edits remain unavailable |
| 6 Account workflows | Google Calendar and Gmail OAuth/read adapters, selection UI and chosen-context delivery implemented and tested offline; actual account connection requires host OAuth configuration and user consent. Sending and calendar writes remain unavailable |
| 7 Quality/release | Evidence-gap and preservation improvements, local tests and visual checks; full acceptance matrix and production rollout remain |

This is a partial implementation of the full V20 program. Do not describe all seven phases as complete.

## Checkpoints

Initial reversible file checkpoint: .backups/v20-20261116-122052. MANIFEST.txt records copied areas, including core/work, canvas source/adapters/tests, React Research components, desktop and the original canvas bundle.

The workspace is not a Git checkout, so there is no clean/dirty Git claim. Initial files were copied before editing. New files and touched sources are recorded in the delivery manifest. A separate checkpoint for each of the interleaved implementation phases was not created; that procedural gap is disclosed.

Before rollback, copy current touched files to a new dated backup. Compare hashes against the delivery manifest and do not overwrite concurrent changes. Restore only the touched original files from the initial checkpoint. Remove only explicitly listed V20 additions after review. Do not delete directories recursively or replace the whole application.

Rebuild with npm run sync and npm run build in work-canvas, then npm run build in frontend. The prior routing implementation is retained as src/legacy-routing-plan.ts for diagnosis/rollback; production uses junction-routing.ts. Reverting the routing-plan.ts export alone restores the previous routing policy, but full renderer rollback should use the checkpoint.

No model setting, credential, research-history record or Zephium reference file was changed.

Additional phase checkpoints: .backups/v20-google-20261116, .backups/v20-scheduler-20261116 and .backups/v20-repository-20261116. Each has a manifest. The initial checkpoint did not include backend test files; the two pre-existing backend tests changed during this work require manual reversal of their documented assertion/fixture changes rather than automatic restore. No checkpoint should be applied over concurrent changes without comparing hashes.
