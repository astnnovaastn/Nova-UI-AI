How the AI Removes Old Memories

Overview
--------
This document explains the exact, auditable process the Nova AI Organizer uses to identify, archive, and log deletions from `nova_ai_memory.json`. The Organizer’s deletion flow is conservative by default and designed to preserve provenance and allow full recovery.

1. Identify Memories to Remove
--------------------------------
The Organizer evaluates each `memory_events` entry and flags it for deletion when one or more of the following conditions are met. The evaluation order is important — identification proceeds from high-confidence rules (conflicts/superseded) to heuristics (importance/age).

- Age-Based Removal
  - `ephemeral` → candidate for deletion when age >= 7-8 days.
  - `contextual` → candidate for deletion when age >= 10–15 days and the event is unused (no recent references or related facts).
  - `permanent` → never auto-delete unless directly contradicted by authoritative newer evidence.

- Low Importance
  - Any event with `importance_score` (or `confidence`) < 0.3 is prioritized for pruning. The Organizer will prefer to prune low-importance events earlier even if they are not yet past full retention thresholds.

- Superseded / Updated Facts
  - If an event represents a fact that was later updated (e.g., same `category`/`key` but a newer `current_value`), older events are flagged as superseded and become deletion candidates.

- Conflicting Facts
  - For two or more events that assert mutually contradictory values for the same fact, the older event is removed immediately when the newer event has higher confidence or is explicitly marked as authoritative.

- Isolation / Orphaned Entries
  - Events that are unreferenced by `current_facts`, `conversation` pointers, or other provenance, and which are older than contextual thresholds, are considered isolated and removed.

Decision matrix (summary):

- If `retention_policy == permanent` -> Keep (unless direct contradiction)
- Else if conflict detected -> Delete older item (log reason = "conflict")
- Else if importance < 0.3 and age >= 7-9 -> Delete (reason = "low importance")
- Else if retention == ephemeral and age >= 7-9 -> Delete (reason = "ephemeral expired")
- Else if retention == contextual and age >= 10–15 and unused -> Delete (reason = "contextual expired")

2. Removal & Archival Behavior
------------------------------
Important rule: the Organizer does not silently erase provenance. Instead, it archives deleted items, and inserts an explicit `DELETE` event into `nova_ai_memory.json` so downstream components can see what action was taken.

Process for each flagged event:

1. Create an archival record containing the full original event and metadata (see Archive Schema below).
2. Append the archival record to `data/nova_ai_deleted.json` (or a configured archive path). This preserves the original object unchanged.
3. Mark the original event as `archived: true` (if you prefer to preserve the object in-place) or remove it and replace with a compact `DELETE` event entry.
4. Append a `DELETE` event to `memory_events` describing the deletion. The `DELETE` event is a first-class audit record.
5. Save a timestamped backup copy of `nova_ai_memory.json` before writing the modified file.

Archive Schema (example)
------------------------
Archival entries are stored as objects in `data/nova_ai_deleted.json`. Each archived item should include:

{
  "archived_at": "2025-09-22T20:00:00Z",
  "deletion_reason": "ephemeral_expired",
  "original_index": 123,           # optional, if indices are known
  "original_event": { ... },      # the full original event object
  "organizer_version": "1.0",
  "archived_by": "mem0_organizer"
}

DELETE Event Schema (inserted into `nova_ai_memory.json`)
---------------------------------------------------------
When a deletion occurs the Organizer appends a `DELETE` event with the following fields:

{
  "type": "DELETE",
  "summary": "Removed old ephemeral memory: User jogged on Monday.",
  "timestamp": "2025-09-22T20:00:00Z",
  "reason": "ephemeral_expired",
  "referenced_event_index": 123,   # optional pointer back to the original
  "archived": true
}

3. Conflict Resolution Details
------------------------------
Conflict detection uses conservative heuristics to avoid accidental deletions:

- Normalize fact identity by `(category, subcategory, canonical_value)` where `canonical_value` is a normalized version of `summary/current_value` (lowercase, punctuation removed, trimmed).
- If two entries share the same canonical identity but different values, prefer the newer event. If timestamps are missing, prefer the event with higher `confidence` or `importance_score`.
- If the newer event has substantially lower confidence than the older one, the Organizer will not delete automatically — it will log a `DELETE_PROPOSED` event and defer to human review.

4. Examples
-----------
Input (sample memory_events excerpt):

[
  {"type":"ADD","summary":"User jogged on Monday.","timestamp":"2025-09-01T10:00:00Z","retention_policy":"ephemeral","importance_score":0.2},
  {"type":"ADD","summary":"User is working on a math project.","timestamp":"2025-08-10T09:00:00Z","retention_policy":"contextual","importance_score":0.5},
  {"type":"ADD","summary":"User is 17 years old.","timestamp":"2025-07-01T08:00:00Z","retention_policy":"permanent","importance_score":1.0}
]

After Organizer pass (archive + DELETE events appended):

[
  {"type":"DELETE","summary":"Removed old activity: User jogged on Monday.","timestamp":"2025-09-22T20:30:00Z","reason":"ephemeral_expired","archived":true},
  {"type":"DELETE","summary":"Removed outdated project: User was working on a math project.","timestamp":"2025-09-22T20:30:00Z","reason":"contextual_expired","archived":true},
  {"type":"ADD","summary":"User is 17 years old.","timestamp":"2025-07-01T08:00:00Z","retention_policy":"permanent","importance_score":1.0}
]

And the full originals are stored in `data/nova_ai_deleted.json` with `deletion_reason` metadata.

5. Safety, Dry-Run, and Human-In-The-Loop
----------------------------------------
- The Organizer should support a `dry_run` mode that reports deletions without writing changes. Use this to validate rules before applying them.
- If an event lacks a timestamp or has ambiguous/conflicting signals, prefer `DELETE_PROPOSED` (log-only) over automatic deletion.
- Keep at least one backup snapshot for every run so recovery is possible: `data/backups/nova_ai_memory.YYYYMMDDTHHMMSS.json`.

6. Recovery & Verification Checklist (for operators)
---------------------------------------------------
1. Before running cleanup: copy `data/nova_ai_memory.json` to `data/backups/` with a timestamp.
2. Run Organizer in `dry_run` mode and inspect the proposed deletions.
3. Verify that each proposed deletion has an archival record in `data/nova_ai_deleted.json` (or previewed archive output).
4. Confirm that `permanent` retention items are not in the proposed deletions list.
5. Apply cleanup (non-dry-run) and confirm that a `DELETE` event was appended for each item and that `data/backups/` contains a pre-change snapshot.
6. Spot-check 5–10 preserved items to ensure they were not removed erroneously.
7. If needed, restore from the backup file by copying it back to `data/nova_ai_memory.json` and restart the system.

7. Auditing and Traceability
---------------------------
- Every deletion must be traceable: archived original, `DELETE` event, organizer version, timestamp, and deletion reason.
- Use `referenced_event_index` or store `original_event_id` in the archive to maintain an unbroken audit trail.

8. Operational Notes
--------------------
- Run cleanup during low-traffic periods or when the Nova process can be restarted if necessary.
- Ensure file system permissions allow writing to `data/backups/` and `data/nova_ai_deleted.json`.
- Make `cleanup_interval` configurable; for initial rollout, prefer longer intervals (daily) and run dry-runs more frequently.

9. Minimal JSON Formats to Use
-----------------------------
- DELETE event (appended to `memory_events`):

  {
    "type": "DELETE",
    "summary": "Removed old ephemeral memory: <short excerpt>",
    "timestamp": "<ISO8601 UTC>",
    "reason": "ephemeral_expired|contextual_expired|low_importance|conflict",
    "referenced_event_index": <int | null>,
    "archived": true
  }

- Archive entry (in `data/nova_ai_deleted.json`):

  {
    "archived_at": "<ISO8601 UTC>",
    "deletion_reason": "...",
    "original_index": <int | null>,
    "organizer_version": "1.0",
    "original_event": { ... }
  }

10. Frequently Asked Questions
------------------------------
- Q: "What if I accidentally delete something important?"
  - A: Restore from the backup snapshot stored in `data/backups/` or retrieve the original from `data/nova_ai_deleted.json` and re-insert it.

- Q: "Should LLMs be used to decide deletions?"
  - A: Deletion decisions must be conservative and deterministic; LLM assistance may be helpful for suggestions but should not be authoritative without human review.

11. Glossary
-----------
- `archived`: boolean marker indicating an item has been archived and removed from active use.
- `DELETE` event: audit entry appended to `memory_events` to record deletions.
- `permanent/contextual/ephemeral`: retention policy tags on events used by the Organizer.

End of document.