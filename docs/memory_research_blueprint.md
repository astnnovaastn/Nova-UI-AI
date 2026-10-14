# Aegis memory and time engineering blueprint

Research reviewed: 2026-10-14. This document precedes implementation. Public
documentation describes interfaces and behavior, not proprietary model internals.
Vendor benchmarks are not measurements of Nova. The proposed architecture is an
application memory system; it does not retrain Gemini or reproduce a human brain.

## Evidence classification

- **Documented**: an official project describes this behavior or interface.
- **Research**: an authored scientific study or review describes its findings.
- **Vendor claim**: a supplier reports a benefit not independently verified here.
- **Nova design**: the engineering decision below, to be evaluated locally.

Every comparison is documented unless explicitly marked otherwise. Versions,
availability, quotas and product behavior may change; record the review date.
No external instruction becomes an application permission or user preference.

## Comparative research

### ChatGPT
Source: https://help.openai.com/en/articles/8590148-memory-in-chatgpt

Documented: saved information and original chat history are separate. Remembered
information can be corrected, prioritized or forgotten through supported controls.
Adopt: explicit corrections, inspectable provenance, and separately enforced
forgetting. Limitation: public product behavior does not expose its ranking code.

### Codex
Source: https://learn.chatgpt.com/docs/customization/memories

Documented: useful eligible prior chats become local memory files in background
passes; active chats and low remaining quota affect eligibility.
Adopt: consolidate completed work, preserve sources and skip budget-starved runs.
Limitation: coding workflow lessons differ from personal conversational facts.

### Gemini Apps
Source: https://support.google.com/gemini/answer/16598469

Documented: personalization may reference prior chats; the documented feature is
distinct from Live chats. Adopt: relevant personalization with visible corrections.
Limitation: matching website tone requires evaluating prompts, model path and
voice policy, not assuming an API includes the website's memory service.

### Gemini Live
Source: https://ai.google.dev/gemini-api/docs/live-api/session-management

Documented: compression bounds context and resumption handles support reconnects.
Adopt: retain current resumable handles, handle GoAway, keep logical sessions
independent of transport lifetime. Limitation: resumption may fail or expire;
rebuild bounded application context without replaying completed actions.

### Claude
Source: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool

Documented: memory operations are client-side and storage belongs to the caller.
Adopt: validate reads and writes through Nova's shared service, never direct paths.
Limitation: model-proposed operations require server scope and lifecycle checks.

### Claude Code
Source: https://code.claude.com/docs/en/memory

Documented: explicit project instructions differ from accumulated automatic notes.
Adopt: distinguish user rules, sourced observations and procedural learning.
Limitation: large instruction files consume context and do not ensure adherence.

### OpenAI Agents SDK
Source: https://developers.openai.com/cookbook/examples/agents_sdk/building_reliable_agents_memory_compaction

Documented: active compaction carries working state; reusable workflow memory
serves future runs. Adopt: preserve reviewed outputs and reusable lessons separately.
Limitation: a generated workflow memory is not an authoritative investigation fact.

### Mem0
Source: https://github.com/mem0ai/mem0/blob/main/docs/core-concepts/how-it-works.mdx

Documented: extraction differs from retrieval; semantic, keyword, entity and time
signals complement one another. Explicit updates/deletes differ from extraction.
Adopt: source-backed atomic records and hybrid ranking. Limitation: managed and
open-source capabilities differ; similarity does not prove factual equivalence.

### Zep / Graphiti
Source: https://help.getzep.com/graphiti/getting-started/welcome

Documented: temporal graphs change incrementally as episodes arrive.
Adopt: evidenced relationships and validity periods. Limitation: adopting temporal
semantics does not require adding Neo4j or migrating Nova to another service.

### Letta
Source: https://docs.letta.com/v1-sdk/memory/memory-blocks

Documented: bounded core blocks are always available and may be read-only.
Adopt: a small active brief and protected instructions. Limitation: the linked
version describes a particular SDK; copying it would introduce another runtime.

### LangGraph
Source: https://docs.langchain.com/oss/python/langgraph/add-memory

Documented: checkpointed thread state differs from cross-session stored memory.
Adopt: logical conversation state and scoped durable recall. Limitation: Nova
already has durable jobs; a second executor would complicate recovery.

### LlamaIndex
Source: https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/memory/

Documented: token-bounded recent history can feed prioritized long-term blocks.
Adopt: complete context entries, explicit budgets and source-linked episode blocks.
Limitation: truncation must not silently cut a correction or rule in half.

### AutoGen
Source: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/memory.html

Documented: a memory interface adds, queries and updates model context.
Adopt: one retrieval interface shared by text and voice. Limitation: chronological
list examples are not evidence of scalable retrieval performance.

### CrewAI
Source: https://docs.crewai.com/en/concepts/memory

Documented: relevance, recency and importance contribute to ranking; scopes and
consolidation organize records. Adopt: inspectable ranking reasons and bounded
background organization. Limitation: near-identical wording may be a genuine
repeated event; Nova deduplicates attributed sources, not merely vector distance.

### Agno
Source: https://docs.agno.com/memory/overview

Documented: user facts, session history and application state serve distinct roles.
Adopt: separate scope, attribution and operational state. Limitation: a caller's
user_id parameter alone is not authentication in Nova's connected-user model.

### Haystack
Source: https://docs.haystack.deepset.ai/docs/mem0memorytools

Documented: retrieval/writer tools can receive scope from authoritative agent state.
Adopt: server-supplied scope and explicit evidence. Limitation: do not inject a
vendor's suggested unconditional tool call into every low-latency voice turn.

### Microsoft Agent Framework
Source: https://learn.microsoft.com/en-us/agent-framework/concepts/agents/conversations/context-providers

Documented: providers prepare context before a run and persist state afterward.
Adopt: one before-response context boundary and separately batched consolidation.
Limitation: file memory must not expose arbitrary filesystem access to Gemini.

### Obsidian
Source: https://github.com/obsidianmd/obsidian-help/blob/master/en/Plugins/Graph%20view.md

Documented: graph edges represent explicit note links; local graphs bound depth.
Adopt: readable source notes and neighborhoods. Limitation: an attractive graph
does not create durable recall or establish causal relationships.

### Basic Memory
Source: https://docs.basicmemory.com/concepts/knowledge-format

Documented: readable Markdown holds categorized observations and typed relations.
Adopt: exported research with source links and dates. Limitation: this phase keeps
Nova's JSON authority; Markdown research is not a competing personal fact writer.

### Supermemory
Source: https://supermemory.ai/blog/memory-graph-relationship-semantics/

Documented: replacement, extension and inference require different treatment.
Adopt: preserve superseded values and keep uncertain inference visible.
Limitation: vendor performance claims must not be presented as measured Nova speed.

### Cognee
Source: https://docs.cognee.ai/

Documented: documents and conversations become searchable graph memory.
Adopt: link episodes, concepts and source records. Limitation: extracted concepts
must not silently become user facts or unreviewed behavior rules.

### Qwen-Agent
Source: https://github.com/QwenLM/Qwen-Agent

Documented: the framework integrates conversation, retrieval and tools.
Adopt: capability discovery rather than injecting the entire tool archive.
Limitation: application persistence differs from changing a model's weights.

## Human memory: useful abstractions and limits

Research review: https://pmc.ncbi.nlm.nih.gov/articles/PMC5881171/
Evaluation: https://arxiv.org/abs/2410.10813
Long-conversation scenarios: https://arxiv.org/abs/2402.17753

Working memory holds limited currently useful information. Nova's equivalent is a
bounded active brief: topic, referents, goal, constraints and unresolved questions.
Episodic memory motivates attributed dated exchanges, not a bag of detached words.
Semantic memory motivates reusable facts with evidence and validity periods.
Procedural memory motivates verified workflow lessons, not unrestricted code.
Consolidation motivates summaries and organization outside the audio path.
Retrieval cues motivate keyword, semantic, entity and temporal search together.
Interference motivates preserving contradictions and choosing current supported
values rather than blending incompatible statements.
Forgetting motivates reversible reduced prominence; it does not justify erasing
the original evidence or silently reviving user-forgotten information.
These are Nova design analogies, not claims of biological equivalence.

## Active-code inventory

SharedMemory owns JSON facts/events and attributed transcript archives. Its
category, standing-rule and organization mixins are active. SQLite is disposable.
GeminiLiveSession supplies native audio context and tools. Text uses the same
shared service through the server. AIOrganizer/OrganizerRuntime remains the
background analyzer; durable_jobs and learned runtime remain task authorities.
Category registry, policies, library membership and history are retained.
AdvancedMemoryRetrieval and historical standalone memory servers are not wired
into native Live retrieval. Keep compatibility adapters, disable legacy writers,
and delete implementations only after their import/caller audit is conclusive.

## Data contracts and ownership

Authority: current records, correction history, original transcripts, tombstones,
category policies and existing job stores. Derived: FTS rows, vectors, query cache,
episode summaries and ranking metadata. Derived data always names its source IDs.
Each eligible recall item carries ID, revision, speaker/source, timestamp, scope,
validity, retrieval method and provenance. A timestamp marked unknown stays unknown.
Pending approvals are not facts. External knowledge is not a personal preference.
Quoted historical instructions cannot grant permissions.

## Retrieval pipeline

1. Resolve scope from the active connection, not model-supplied profile IDs.
2. Anchor temporal hints to the original utterance and user's timezone.
3. Query incremental FTS and eligible locally stored embedding vectors.
4. Fuse rankings; prioritize exact entities without suppressing paraphrases.
5. Expand only supported relationships and bounded neighboring exchanges.
6. Recheck source revision, lifecycle and access before returning context.
7. Pack complete entries into the supplemental token budget; report overflow.
8. Emit actual returned source IDs to existing globe activity notifications.

## Embeddings and budget

Source: https://ai.google.dev/gemini-api/docs/embeddings
Pricing: https://ai.google.dev/gemini-api/docs/pricing
Limits: https://ai.google.dev/gemini-api/docs/rate-limits

Use text-only gemini-embedding-2 and 768 dimensions. Each independent record gets
its own normalized vector. Never mix model spaces. Use standard embedding calls,
not the paid asynchronous Batch API. Verify access before enabling provider work.
Private/local-only records, credentials and forgotten sources never leave Nova.
Cache model/content/scope hashes. Index only changed chunks and prioritize new
sources. One uncached query request per recall; local retrieval remains available.
Project budgets and Retry-After pause background work. No key rotation, provider
substitution, billing activation or hidden quota increase. Start in shadow mode.

## Context and speaking

Prepare text context before generation. Native voice keeps an active brief and
uses memory_context_action before unsupported personal/history answers. Ordinary
greetings do not require semantic calls. Do not claim interception of hidden
reasoning. Cancel stale prefetches; never start a response from a context update.
Use complete serialized entries, with a default 4,000-token supplemental budget.
Retain explicit standing-rule overflow discovery. Speak naturally and briefly,
expand on request, and provide fuller text when useful without a second model
request after every spoken answer. Describe only verified task outcomes.

## Time service

UTC instants are authoritative; IANA timezone is a presentation/calendar property.
Use Europe/Madrid by default and retain the 4 AM conversation-day boundary. Runtime
and active-segment duration use a monotonic clock. Calendar intervals use aware
wall time. Provider reconnect, mic mute and conversation end are different events.
Persist start/end/interaction/reconnect events with IDs and source references.
After a crash, last observation bounds an interruption; it is not an invented stop.
Resolve yesterday, last Friday and relative durations from the original utterance.
Ambiguous language returns a clarification requirement. No continuous model polling.

## Quiet organization

The existing organizer may propose source-linked summaries, ranking adjustments
and reversible dormancy. Validate dispositions against the current record revision.
Protect rules, pins, current projects and unresolved commitments. Age is a candidate
filter, never enough evidence to demote. Preserve original records and audit reasons.
Explicit forgetting remains a tombstone; automatic organization cannot restore it.
Background pause and cancellation retain existing semantics and job limits.

## Interfaces

- memory_context_action: retrieve, episode, timeline, provenance, status.
- time_action: now, status, resolve, timeline, duration.
- maintenance: sourced summary, reversible dormancy and explicit restoration.
- Status contains mode, coverage, clock freshness and sanitized measured timings.
Connection scope overrides tool arguments. Results acknowledge committed state only.

## Capability acceptance matrix

Capture/attribution: originals, speakers and dates survive restarts and deduplication.
Classification/entities/linking: registered policy and evidence govern all changes.
Keyword/semantic recall: exact names and paraphrases retrieve the expected sources.
Temporal filtering/episodes: dates and associated replies remain inspectable.
Diversity/provenance: repeated candidates do not crowd out distinct supported facts.
Contradiction/correction/versioning: newest supported value governs current answers;
historical questions can still retrieve the older value with its validity interval.
Consolidation/summaries: no original content or source IDs are replaced.
Prioritization/dormancy/restore: low-value sources remain recoverable and protected
sources remain active. Explicit forgetting suppresses every derived copy.
Commitments/capabilities: reuse existing stores; completed work cannot execute again.
Budgeted context: complete entries and overflow metadata replace sliced JSON.

## Rollout and measurements

Stages: baseline -> incremental retrieval -> clock/continuity -> live context ->
quiet consolidation -> UI/status and verified cleanup -> production validation.
Back up authority before additive writes. Rollback disables each new path without
losing originals. A fresh index rebuild is recovery, not routine per-turn work.
Run at least 200 deterministic scenarios patterned after LongMemEval dimensions
and LoCoMo long conversations, including paraphrases, corrections, time, privacy,
forgotten sources, attribution, dependencies and abstention.
Measure current-size and larger synthetic workloads: accuracy, warm/cold p50/p95,
first audio, CPU/RAM, context size, provider usage and UI interaction. Fixture
performance and provider availability are reported separately. No older-hardware
or physical microphone claims follow from mocks. Keep semantic retrieval shadowed
until the quality/latency gate passes. UI updates at completed milestones. Mobile
remains paused and the orb/globe design stays unchanged.
