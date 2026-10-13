# Unified Nova memory

Voice, REST text and legacy Mem0 adapters share astra_ai/memory/shared_memory.py.
The full original source is restored in mem0_memory_system.py. Its public NovaMemoryAI and AdvancedMemoryAgent classes use the shared core through unified_memory_adapters.py; AegisMemoryAI is the same implementation. Previous method bodies remain under _previous_ names, and retired vector import code remains guarded from runtime execution. live_memory.py is a facade.
The original implementation is preserved in memory_unused_old/mem0_before_unification.py.

## Authoritative storage

- astra_ai/memory/long_term.json: schema 3 facts, events, approvals, relationships, conflicts and learned preferences.
- astra_ai/Date/nova_ai_memory.json: transcripts, privacy settings and session metadata.
- astra_ai/Date/conversation_archive/*.jsonl: messages beyond the current 2,000, searchable through recall.
- astra_ai/memory/recall.sqlite3: disposable FTS5 index, rebuilt from JSON when missing, changed or damaged.
- Store-adjacent backups directories and migration-archive.json preserve migration sources.
- pending-operations.json retains failed accepted writes when the disk permits journaling. If journaling also fails, the running instance retains its operation in memory; process loss during complete disk failure cannot guarantee durability.

There are no embedding/model downloads or active vector/cluster retrieval dependencies.
Atomic replacement and a shared process lock protect read-modify-write operations.
Malformed authoritative JSON fails visibly and is preserved.

## Memory policy

Completed turns are logged; private sessions and disabled retention prevent persistence.
Recognized credentials are rejected from durable facts/events and redacted from transcripts and pending transcript journals.
Clear ordinary preferences and project statements may be saved automatically. AI tools must supply user evidence; uncertain or sensitive proposals await approval.
Explicit corrections preserve earlier revisions. Retries retain their actual pending/rejected/saved state.
Relationships require existing IDs; causal claims need evidence. Inferred learning remains inactive until repeated evidence supports it.
Stored instructions and learning affect context/preferences, never code or operating permissions.

## Endpoints and tools

POST /api/memory/store returns saved, updated, duplicate, pending_approval, rejected, private or failed.
GET /api/memory/recall supports kind, category, event_type, source, session_id, since and until.
GET /api/memory/pending, POST /api/memory/approve, and GET /api/memory/migration/preview expose proposals and migration details.
Memory health appears in /api/health.
Existing Gemini tool names remain, with approval, relationship and learning tools added.
Storage and index operations run in worker threads in the live voice path.

## Validation on this PC

- 120 backend regression tests passed, including all 27 categories, four conflict types, six relationship types and five learning types.
- Consent retries, corrections, privacy, redaction, archive recall, concurrent threads/processes, failed writes, corruption and migration idempotence passed.
- 81 frontend tests and TypeScript checks passed; production build passed.
- 10,000-record indexed recall fixture: median 47.54 ms, maximum 53.66 ms across 20 warm queries. Index rebuilding is excluded from these timings.
- Migration rehearsal preserved 51 transcript messages and recovered 131 fact records and 62 events. Actual migration completed with both stores backed up.
- Real Gemini text and voice tools saved temporary custom events and recalled them in separate turns; voice produced audio. Temporary test records and turns were removed afterward.
- Existing deprecated startup-handler, calculator eval and large bundle warnings remain unrelated to this change.

Legacy diagnostic scripts that specifically require vector/cluster engines are historical tooling; they are not part of the active regression suite.
Unsupported historical structures remain recoverable in migration archives rather than being interpreted as new user facts.


## Reversible forgetting and autonomous management

Routine memory management is now enabled for this user in the persisted memory policy.
The AI can use 24 validated actions for records, events, history, renaming, links, learning, approvals, index maintenance and forgotten memory. It resolves targets by real record IDs.
Routine forgetting no longer requires the current utterance to repeat a deletion keyword; follow-up confirmations work.
Sensitive or uncertain durable information still uses the consent pipeline; this authorization does not grant unrelated filesystem or application actions.

Forgetting removes the active record and places it in astra_ai/memory/forgets.json with its history, timestamp and supporting links/learning/conflicts.
A recovery journal makes the two-file move resumable after partial write failure.
Forgotten records are excluded from the active index and can be searched/restored through memory_action.
GET /api/memory/forgotten and POST /api/memory/action expose the same behavior to UI clients.
Conversation history remains historical; forgetting a durable fact does not erase transcript evidence or migration backups.

Validation: 125 backend tests passed before the final supporting-link preservation change.
The actual AI forgot the user's Blue Lantern test fact; it is now absent from active records and present in forgets.json.
A separate real live voice test forgot and restored a temporary record, preserving its ID. Temporary test records were cleaned afterward.


## Organized layout

The authoritative long-term file now has one representation:
- facts grouped by category;
- custom events grouped by event type;
- historical memory actions in activity_history;
- category_definitions for schema descriptions, separate from user facts;
- relationships, learning, conflicts, approvals and metadata in dedicated sections.

The service reconstructs its compatibility records view in memory only; duplicate legacy root views are not written back.
81 category configuration fields were moved out of user facts and 46 historical actions were categorized.
No exact duplicate persisted records were found in this store; duplicate representations were removed without deleting unique information.
Exact future duplicates can be merged with reference updates and combined provenance/history. Distinct changes and event occurrences remain separate.
Both original stores and forgotten memory were backed up before organization. Legacy transcript memory-engine/category/event sections were removed from the active transcript; their originals remain in backups.
The AI can preview and run organization through memory_action, alongside the existing management operations.
128 backend tests pass. Real voice save/recall passed on the organized layout; the final text-provider check was blocked by the Gemini daily request quota.
