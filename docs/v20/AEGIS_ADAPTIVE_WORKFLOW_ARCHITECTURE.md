# Adaptive workflow architecture

## Implemented contracts

New Work runs carry schema_version 2. Old records default to version 1. Fields are additive: task_graph, canvas_objects and coverage. WorkStore exposes public metadata; existing IDs, reports, event identities, model settings and credentials remain unchanged.

task_graph.py compiles the admitted plan and actual assigned roles into registered existing handlers: discover, analyze, verify, fill_gaps, write and publish. Validation rejects duplicate IDs, missing dependencies, cycles, unknown handlers and capabilities different from the registered handler. Ordinary direct answers can omit discovery and specialist stages. Completed stages remain durable and retries skip them. One planning agent remains the default.

New runs execute ready nodes from the validated graph, rather than iterating a fixed stage order. An independent branch can complete after a recoverable provider failure; retry skips successful nodes. Scheduling is deliberately serial at the task level because existing handlers share run state; their existing bounded worker concurrency remains. Specialist task decomposition, task-level parallel scheduling, model-specific verified capability records and generalized artifact revision execution remain unfinished.

## Data ownership

- Task plan: version, workflow, requirements, admitted tasks and frozen Skill identities.
- Task: stable ID, registered type, input/dependency references, expected output, capability list, public label/status and acceptance text.
- Artifact: approved kind, stable ID, revision, producing task, content and evidence references.
- Relation: original backend relationship, never synthesized by proximity.
- Presentation: existing per-run positions, sizes, constraints, groups and viewport.
- Route projection: original edge membership plus virtual trunks and segment bounds.

Subject diagrams may contain cycles. Scheduling graphs must be DAGs. Inert result objects never execute model-generated HTML or JavaScript. Reports use the existing trusted Reader Markdown sanitizer; fixtures use text.

## Capability evolution

Existing public research handlers and Skill execution remain operational. Owner-only repository inputs read bounded source excerpts from host-configured roots; they never execute or edit code. Google Calendar and Gmail use owner-scoped OAuth grants, encrypted tokens and explicit item selection. Selected excerpts/events/message summaries reach the existing planning and writing payloads. The model cannot browse arbitrary files or account records. Test execution, reviewed edits and external writes remain unavailable. A proposed diff is a readable artifact, not an executed edit.

No account writes, calendar writes, messages, research runs or provider requests were used to verify this release. Presentation preferences currently use per-run arrangement strategy and constraints; cross-run preference editing is not implemented.
