# Aegis memory upgrade: delivery and measured limits

Validated on 2026-10-14, desktop Windows, with the existing providers and dependency
installation. Mobile, the dashboard orb, and the supplied globe design were left
unchanged. [Research blueprint](memory_research_blueprint.md) records 22 primary-source
comparisons, human-memory research, limitations, and the engineering decisions.

## Delivered paths

- SharedMemory remains the authority for facts, events, transcripts, corrections,
  unlimited registry categories, lifecycle, privacy, and forgetting.
- FTS v2 synchronizes changed and removed rows transactionally. Category aliases,
  entities, and supported topic membership enrich searchable terms. The index can
  be rebuilt after corruption without changing original records.
- Hybrid retrieval combines keyword ranking, independent Gemini vectors, and weaker
  evidenced relationship expansion. Scope and source revision are checked again
  after provider waits. Similarity never creates a factual relationship.
- Attributed transcript hits expand into the requested exchange and bounded nearby
  messages. A small expansion limit retains the requested exchange first.
- Complete, source-labelled context entries replace sliced supplemental JSON. The
  default is a conservative 4,000-token upper bound estimated from UTF-8 bytes;
  metadata and overflow discovery consume part of that budget. Applicable standing
  rules have priority and explicit overflow instructions.
- Text prepares context before generation. Voice maintains a small active context,
  warms local retrieval from finalized input, and exposes explicit scoped recall
  when supporting personal-history context is absent. Ordinary utterances do not
  spend query-embedding budget automatically.
- Native Live handles are private, scoped, expire locally, and never enter public
  status or model memory. GoAway reconnects occur between turns. An explicitly
  expired handle permits one fresh same-model connection with bounded application
  context; completed operations and audio are not replayed.
- One time service supplies UTC observations, IANA presentation, Madrid defaults,
  the established 4 AM conversation day, monotonic active durations, and interrupted
  intervals with an unknown stop time after a crash. Calendar/task defaults use the
  shared timezone configuration without rewriting existing stored timestamps.
- The existing organizer performs resumable embedding backfill and quiet exact-
  duplicate fact demotion. New summaries carry source IDs/revisions and original
  quotes. Corrections invalidate old summaries; dormancy and forgetting suppress
  derived copies. Automatic demotion does not erase originals.
- Memory displays a small scoped recall-mode/date indicator. Opening it preserves
  conversation state; no new decorative globe operations were added.

## Rollout and operating controls

New installations start in **shadow** semantic mode. The current installation has
passed a small public-data project-access/quality/latency gate and is enabled. The
ignored local gate matches the current key fingerprint, model, dimensions, measured
improvement, latency ceiling, and a seven-day freshness window. It is not a claim
of general retrieval accuracy. Changed projects and malformed/expired gates return
to shadow mode. No key, fingerprint, or personal memory is committed with this code.

`gemini-embedding-2` uses text-only, normalized 768-dimensional vectors. Each record
has its own vector; queries and documents use the documented input formats. The
standard embedContent endpoint is used; the paid asynchronous Batch API is absent.
Model identifiers are checked when reading cached vectors; a different model must
be validated separately, with a separate disposable index before rollout.

The application cap is 40 embedding requests/day and 160,000 characters/day, with
10 requests reserved for queries and one background record per 65-second interval.
This is an application ceiling, not a statement of the project's provider quota.
Provider delays, missing access, busy slots, and quota exhaustion retain local
recall. Privacy filtering occurs before uploads; private/local-only records,
credentials, denied consent, and forgotten sources are ineligible. Records over
12,000 characters currently stay available locally rather than being truncated
and embedded. Large-record chunking is a later extension.

The organizer was resumed by the user's delegated choice. Its 210 completed jobs
remained completed. Manual background pause remains independent from microphone
mute. Groq quota pauses retain their own state; Google backfill still observes its
separate limits. No competing executor, provider substitution, billing activation,
or legacy writer was introduced.

Rollback controls:

| Control | Effect |
|---|---|
| `NOVA_SEMANTIC_MODE=off` | Local recall only; keeps original storage |
| `NOVA_SEMANTIC_MODE=shadow` | Compare semantic candidates without returning them |
| `NOVA_CONTEXT_BUNDLE=0` | Existing context formatting compatibility path |
| `NOVA_AUTOMATIC_DORMANCY=0` | Stop automatic duplicate demotion |
| `NOVA_EMBEDDING_DAILY_REQUESTS` | Bounded application embedding ceiling |
| Existing background pause | Pause user-directed organizer work |

## Verification of existing data

Authoritative memory, transcript, and forgotten stores were backed up before the
additive intelligence marker was committed. A read-only audit compared the live
stores with those backups and printed counts only:

| Evidence | Result |
|---|---|
| Original records | 716 IDs preserved |
| Original values | 715 current values unchanged; one subsequent live revision retains its original value in history |
| Original backed-up messages | 2,000 preserved with ID, speaker, content, time, session, and turn |
| Forgotten records | All three suppression records unchanged |

Conversation archives were not re-imported. New live messages, categories, and
supported organization may continue to arrive while the application is running.

## Tests

Final backend regression run: **533 passed, one skipped**. The skipped check is an
existing optional environment case. Frontend: **98 passed**. Supplied globe suite:
**39 passed**. TypeScript and the production build pass. The build retains existing
calculator-eval and large-bundle warnings; these were not introduced by this phase.

The new deterministic memory evaluation comprises 200 scenarios: 20 families with
10 variants each. These vary evidence, identifiers, dates, sessions, scopes, and
expected outcomes. Fixture embeddings isolate routing/ranking behavior and are
not scored as measurements of Google's model. Additional cases cover cache
invalidation, budget exhaustion, provider protocol, forget during a provider wait,
summary correction/suppression, temporal rejection, current versus historical
sessions, source scoping, restart intervals, completed-job preservation, and expired
provider handles. Compatibility tools also override model-supplied profile/project
IDs with connection identity, validate direct targets, and filter private records
even when semantic mode is off. A damaged semantic cache reports a sanitized error
and leaves startup/local recall available; it can be discarded separately from
authoritative storage. Existing suites cover category growth, entity evidence, approvals,
research/capabilities, task recovery, audio capture/playback, and lifecycle behavior.

### Capability coverage

| Capability | Implementation and deterministic coverage |
|---|---|
| Capture | Existing shared writes; capture scenarios preserve original IDs/value |
| Attribution | Transcript exchange expansion; paired speaker scenarios |
| Classification | Existing registry/policy tests; no hard category-count limit |
| Deduplication | Existing save/recovery tests; dated repetitions remain distinct |
| Entity resolution | Existing entity_graph alias and evidence tests |
| Linking | Existing evidence validation; hybrid one-hop retrieval |
| Keyword recall | FTS tests and ten keyword scenarios |
| Semantic recall | Ten fixture paraphrase scenarios plus the public provider check |
| Temporal filtering | Ten bounded timestamp scenarios and invalid-filter rejection |
| Episode expansion | Paired attribution and small-limit exchange retention |
| Diverse ranking | Duplicate-fact suppression with distinct repeated events retained |
| Provenance inspection | Ten source/revision scenarios and scoped tools |
| Contradiction detection | Existing conflict and evidence validation tests |
| Correction | Ten revision/history scenarios and stale-cache suppression |
| Versioning | Existing revisions plus indexed-summary invalidation |
| Consolidation | Exact duplicate protection; existing organizer queue |
| Summarization | Required source quotes, revisions, searchable derived summaries |
| Prioritization | Relevant category selection and standing-rule-first context |
| Dormancy | Ten protected-source cases and duplicate demotion |
| Restoration | Ten reversible-dormancy cases; forgotten data cannot auto-return |
| Explicit forgetting | Ten suppression cases; in-flight embedding results discarded |
| Commitment tracking | Existing durable jobs, approval and restart tests |
| Capability recall | Existing learned-capability/shared research integration tests |
| Budget-aware context | Whole-entry packing, overflow and no automatic embedding calls |

### Public Google access and quality check

Four independent, public synthetic records were indexed. Four corresponding
paraphrase queries yielded keyword top-1 **1/4** and semantic top-1 **4/4**. Measured
retrieval latencies were **486.81, 425.66, 394.06, and 381.79 ms**. The existing key
could access the selected model. No private memory was sent during that check.
This very small check permits cautious local rollout; it is not a benchmark of
the user's full memory archive, and coverage grows gradually under the cap.

## Local retrieval measurements

`scripts/benchmark_memory_recall.py` uses temporary copies, no provider calls, and
perf_counter with tracemalloc enabled. Allocation tracking adds overhead. The
baseline swaps in the previous FTS implementation while retaining current context
code: it is an **index comparison**, not a historical end-to-end conversation
baseline. The populated case includes current facts/recent transcripts; it does
not copy the JSONL conversation archives into its temporary fixture.

| Dataset | Warm candidate p50 / p95 | Context candidate p50 / p95 | After one save, old index / candidate | Python allocation peak |
|---|---|---|---|---|
| 2,000 synthetic | 13.30 / 14.47 ms | 94.45 / 176.57 ms | 381.22 / 386.14 ms | 11.89 MiB |
| 5,000 synthetic | 39.92 / 44.47 ms | 162.85 / 366.92 ms | 1,267.63 / 898.05 ms | 29.68 MiB |
| 20,000 synthetic | 100.09 / 113.77 ms | 359.33 / 1,052.55 ms | 5,737.96 / 3,118.73 ms | 117.23 MiB |
| Populated local copy | 23.29 / 27.84 ms | 120.60 / 324.90 ms | 1,331.74 / 1,016.00 ms | 30.51 MiB |

Every candidate post-save synchronization changed **one** row, removed zero rows,
and reported **rebuilt=false**. Authority/signature scanning still scales with
dataset size; the 20,000-record post-write path remains expensive and is a clear
future optimization target. Small-data warm indexing did not universally improve.
Python allocation peaks are not process RSS, and CPU utilization was not measured.

## Running desktop observations

The supervisor/backend health check succeeded after deployment. Memory remained
populated during conversation and background organization. An actual text request
returned the current date/time and **Europe/Madrid**, with the new source/time
context supplied before generation. The library loaded its paginated categories
and collections; the semantic status advanced as backfill completed records.

Existing canvas instrumentation at approximately 2,994 memories / 6,323 connections
reported **60.0 FPS** and **8.00 ms** drawing cost in an overview observation. These
are a desktop snapshot, not guaranteed sustained performance on other computers.
No claim is made about older hardware, mobile, physical microphone response time,
or time to first audio. Native voice recovery, mute, capture and playback were
exercised through deterministic fixtures. A live human voice quality evaluation
and broader real-provider retrieval evaluation remain useful follow-up checks.

## Cleanup audit

The static inventory scanned 475 Python modules, found 72 reachable via conservative
backend import resolution, and recorded seven existing parse failures outside the
new paths. Dynamic imports and compatibility entry points prevent declaring every
unreached module obsolete. No original implementation was deleted without evidence;
compatibility adapters stay available and legacy writers remain disabled.

Research and runtime artifacts, credentials, private memory, recordings, indexes,
resumption handles, and validation snapshots are excluded from the Git delivery.
