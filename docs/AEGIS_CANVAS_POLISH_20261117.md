# AEGIS conversation and canvas polish — 2026-11-17

This update makes the conversation panel fit its content, adds message copying and conversation actions, and provides a jump-to-latest control. Video collection previews match the primary card width. Research helpers without sources use compact labels and open their recorded details. Report illustrations remain in the report rather than appearing twice on the canvas.

The durable canvas adapters and generated canvas bundle are included. Existing card-library and adaptive-card code was already published in the preceding commit; this update does not declare the unfinished adaptive-card release complete.

Validation:
- Canvas production build passed.
- Frontend TypeScript and production build passed.
- Canvas suite: 470 tests passed across 25 files.
- Conversation checks: four tests passed.
- Added diagnostic scripts were syntax-checked only. Live-provider scripts were not executed.

An unpublished local research-history test references removed functions and failed its harness checks. It is excluded from this update, not counted as passing. Existing build warnings about the calculator's eval, large frontend chunks, and an unused canvas CSS selector remain.

No saved research, credentials, runtime data, browser profiles, or local verification screenshots are included. The Zephium reference checkout is unchanged.

Rollback: revert this commit to return to the preceding published update; no data migration is required.
