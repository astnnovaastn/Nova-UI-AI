# Growing memory and background learning

Implemented 2026-10-12. The supplied future globe is deliberately pending; this phase preserves the current Canvas visualization and prepares category palette metadata.

## Authoritative memory and category registry

`category_registry.py` adds a schema-3-compatible registry to the authoritative shared JSON store. Startup backs up memory, transcripts and forgotten records before additive seeding. Original 27 category IDs and enum interfaces remain. New roots and arbitrarily nested descendants have stable IDs, labels, aliases, parents, scopes, provenance, revisions, lifecycle state, inherited server-owned policy templates, memberships and color families. Creating categories never broadens consent, capture sources, privacy, expiry or permissions. A child cannot change its parent policy template. Scoped name collisions, cycles and stale revisions are rejected. Renaming, retiring and merging retain original record IDs and stored classifications; retrieval follows redirects and descendant memberships. Forgotten-only source collections are suppressed until restored.

`SharedMemory.category_action` is shared by text, voice, organizer and `POST /api/memory/categories/action`. Actions: list, resolve, create, update, merge, retire, restore. The endpoint resolves scope from the registered local connection through `X-Nova-Client`; caller-supplied profile/project values do not grant access. Pagination bounds responses, rather than limiting stored categories. SQLite is a rebuildable index and includes category labels, aliases and ancestor names. Semantic links and behavioral patterns keep their existing evidence requirements. The organizer proposes new source-supported collections without replacing the old memory class bodies or reactivating legacy writers.

Palette metadata uses blue #4C83B7, violet #916CB0, red #BA6068, orange #C58D3D, and highlight #DCD7CE. Stable ID hashes select controlled 8–25% OKLCH blends between paired families. Existing theme-aware text and connection labels remain available. The replacement renderer can consume the palette with its panel contrast rules; the current renderer's visual palette remains unchanged. Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix

## Existing durable executor

`ActionJobs` remains the sole executor for requested work, recovery, research and capability development. Twenty jobs are admitted at a time, with up to four lightweight operations and one conflicting write/UI operation. Dependencies, operation IDs, acknowledgements, attempts, results, delays and recovery state survive restart. Completed operations remain completed. Microphone mute is independent of task cancellation. Scope-filtered job inspection, reconnect attachment and cancellation prevent owner/guest disclosure.

Read-only transient failures retry up to three total attempts with bounded backoff/provider delay. Interrupted or transient writes become uncertain and require reconciliation before any repeat. Quota waits do not consume attempts. A tested routine repair may allow one further attempt; recovery must actually execute the originally requested operation before reporting success. An ordinary acknowledgement does not cancel a job. Failed dependencies remain inspectable.

## Research and model budgets

`ResearchLearning` uses the existing job queue and configured Firecrawl connector. It caches by normalized topic, scope and 24-hour freshness; forgotten research is suppressed. Requested research emits a brief notice at an idle conversational boundary. Proactive learning uses eligible recent supported topics or redacted failures and stays quiet.

Markdown documents, source excerpts, retrieval dates, links and limitations live under `astra_ai/core/learned/research/<scope>/`; the shared JSON service indexes their records. Relevant indexed recall reaches the same bounded formatter used by text and voice. External research is explicitly marked as external knowledge, never a user fact or standing rule. Private sessions, disabled retention and guest contexts do not create retained research.

Groq openai/gpt-oss-20b handles background analysis, optional synthesis and learned helpers; Gemini remains conversational. Organization and learning share one model slot, conservative 65-second spacing, 40 requests/day and 80,000 estimated tokens/day. Groq remaining/reset headers and Retry-After extend pauses. Search has a separate conservative 12/day, 65-second budget and requires the existing connector key. Missing configuration leaves work inspectable rather than activating billing or selecting another provider. Project-level Gemini quota failures do not trigger model/key switching. Documentation: https://console.groq.com/docs/rate-limits and https://ai.google.dev/gemini-api/docs/rate-limits

## Learned capabilities and tested repair

`astra_ai/core/learned/` holds versioned tools, fixture tests, source manifests, audit entries, staged repairs and rollback copies. `capability_action` provides bounded list/get/status, queued learn/repair, validation and invocation. Gemini discovers capabilities on demand; neither the tool archive nor the full memory archive is uploaded to its prompt.

Windows execution uses a genuine AppContainer token with zero capabilities, no inherited secrets, no network or child processes, a 256 MiB memory limit, a 10% CPU hard cap and a 15-second wall limit. The host verifies these boundaries with a temporary private canary and controlled network listener. Interpreter files and ACL grants are confined to a disposable temporary copy. Profiles are deleted after each run; the installed Python runtime is not changed. Other hosts or failed probes retain drafts and disable execution. Static restrictions are additional checks, not the isolation boundary.

Tools run pure JSON computations inside isolation and request only declared broker operations. The broker applies existing application permissions and original task authorization. File capabilities require authorization from the original requested file operation; critical broker targets must match the originally authorized arguments. Broker results redact credential fields. Research/downloaded text cannot grant permissions. A failed generated draft receives at most one model correction after pacing permits it; original expected fixture results cannot be changed to make a broken draft pass. Successful developments are cached across restart. Results and uncertain invocations are journaled; invocation IDs never silently repeat side effects. Critical capabilities need exact-version human approval and current operation authorization.

Automatic source repair is intentionally narrow: an existing pure synchronous single-argument Python helper, bounded source, an eligible target, trusted literal regression fixtures from existing repository tests, a reproduced failing case, all replacement cases passing in isolation, stable artifact/target hashes, and verified rollback. Replacements cannot access module globals or arbitrary object methods. Loaded function references receive the verified implementation after the atomic file write; rollback restores both source and the loaded function. Unsupported targets remain staged. The infrastructure does not automatically rewrite arbitrary application code. Changes to permissions, security, credentials, destructive operations, migrations, dependencies or validation require human review. New learned knowledge and tools do not retrain Gemini model weights.

Review uses the existing Memory conversation task panel: Tasks and learning. Scoped `/api/learning/status`, `/action`, `/reviews`, and `/approve` reuse the local user model. Critical changes show a bounded code/diff preview and exact-hash approval. Learning pause stops research and development; organizer pause remains its existing control. No new globe menus or provider/billing flows were added.

## Validation

Temporary fixtures cover more than 127 categories, nested policies, aliases, merges, scope, cycles, revisions, forget/restore, original values, sourced recall, restarts, transient retry, offline/muted work, uncertain writes, 20-job operation limits, cancellation, unsafe code, missing OS isolation, critical approval, reproducible fixes and rollback.

`scripts/validate_growing_memory.py` measures the temporary 20-job workload, event-loop latency, resource use and actual native AppContainer tool/repair execution. Results are saved to `artifacts/growing-memory-validation.json`; these are measured on this host, not a guarantee for older hardware. No real provider requests or user-memory mutations occur during that validation. Preservation hashes are recorded before live additive startup and compared afterward. Browser checks exercise desktop/mobile, the task review panel, current globe controls, history and shared panel themes. See `artifacts/growing-memory-validation-summary.json` for final test and preservation counts.

Mobile polish is deferred at the user's request; remaining checks prioritize desktop.

## Isolation review resolution

Automatic approval review rejected a verification variant that would grant access to an installed shared interpreter. The final implementation uses temporary copies and disposable profiles; verification was approved and passed with no persistent interpreter ACL changes.
