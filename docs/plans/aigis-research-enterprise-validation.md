# Aigis Research Enterprise Upgrade — engineering and validation report

Implemented against baseline `8379205` on the existing delivery branch. The approved scope is in [the implementation plan](aigis-research-enterprise-upgrade.md).

## Architecture and confirmed causes

The application already had independent web retrieval, durable research jobs, section checkpoints, prepared publications, session/page routing, one central composer, revisioned synchronization and Yjs editing. Those systems remain in use. Model fallback does not replace retrieval or start a second research job.

Real UI testing identified additional causes of incomplete or misleading results:

- Generic writing instructions could match unrelated archived research. Reuse now compares the subject and coherent evidence passages, including saved retrieval checkpoints. Incompatible inherited evidence is discarded before composition.
- Retrying a partially completed fallback stage could revisit a rejected model and exhaust the stage allowance. Durable attempts now remember the rejected candidate, retain completed sections and resume the next eligible candidate.
- A health check awaited memory statistics. A slow store could look like a dead backend and interrupt writing. Health is now immediate, statistics refresh in a coalesced background task, and research storage is warmed before readiness.
- Folder recovery invalidated the cache even when no transaction needed recovery. Repeated real-history reads improved from approximately 20 seconds to 0.047–0.078 seconds after correction.
- Source illustration downloads failed TLS verification with the bundled runtime's default trust configuration. Downloads now explicitly use the maintained CA bundle while retaining certificate/hostname validation, public-IP checks, pinned connections, redirect limits and response-size limits.
- Typed turns did not consistently establish playback lease generations before an initial microphone utterance. Typed submission now unlocks playback during the Send gesture and claims an available lease without starting microphone capture.
- An expanded selection preview could exceed fixed composer clearance, and a global circular-button rule collapsed its preview. The composer occupies a real layout region; the preview has scoped dimensions and styling.
- Comparison headings containing “vs.” could be truncated. Published Reader headings now derive from the saved report heading without changing sidebar titles or user drafts.
- A transport reconnect could reject an old history response without requesting a new one. The existing window now reconciles history under its new connection while preserving its report and navigation. No history-panel styling changed.
- Resumed fallback progress could briefly label a skipped primary provider as active. Progress now reports only providers actually selected for an outbound attempt; durable attempt receipts retain the complete provenance.

## Provider integration and limits

Gemini remains primary with the configured `gemini-3.5-flash-lite`. Gemini Live chat/voice configuration is retained. Manual OpenAI selection remains supported and is never automatically activated.

`research/providers.py` centralizes model discovery, structured output and citation-ID validation, capability checks, durable attempt receipts, provider cooldowns, bounded circuit breaking and sequential fallback. Initial eligible Groq candidates are `openai/gpt-oss-120b` and `openai/gpt-oss-20b`. Discovery is cached by credential configuration. Dedicated research credentials take precedence over an explicitly configured shared Groq credential. Shared-credential traffic uses the same pacing gate as background services.

Fallback applies to research writing and researched extensions. Ordinary conversation, selected-passage explanations and voice remain Gemini-powered. Provider quotas, rate limits, timeouts, recoverable outages and invalid generated structure/citation IDs are eligible. Safety refusals, invalid requests, authorization failures, private-evidence restrictions and local allowance exhaustion are not bypassed.

Each logical stage retains at most four outbound attempts across restarts. Explicit content/schema repair is limited to one per operation. Partial provider sentences are never spliced together. Completed retrieval and valid section checkpoints survive fallback. One background writer remains active. Existing Gemini/OpenAI usage counters and global limits were not reset or increased.

Private evidence requires conversation-scoped permission before Groq processing. The UI offers Allow for this conversation, Wait for Gemini and revocation. Permission is checked server-side; missing/denied consent pauses safely. Cost ceilings are optional; when configured without usable pricing, the system reports that limitation instead of inventing an estimate.

Cooperative Groq processing is opt-in and disabled by default. It uses bounded section roles through the existing checkpoint pipeline, without circular agent conversations. No live comparative quality benefit is claimed for this optional mode.

## Authoritative storage and organization

Research now uses `state/research/catalog.json` and `state/research/conversations/<session-id>/pages/<page-id>/`. Readable, versioned JSON separates page metadata, publication, evidence, media, extensions, operations, activity, drafts and revisions. Conversation assets have their own directory. Specialized synchronization, selection and collaborative-editing SQLite stores remain authoritative and are referenced rather than duplicated as competing document stores.

`FolderResearchStore` uses staged, flushed, hash-checked transactions with durable intent and catalog-last commits. Startup recovers interrupted commits. Windows long paths are supported. Backups occupy a separate research backup location: seven daily manifests with deduplicated compressed content, plus a protected pre-upgrade migration snapshot. Reverse export includes post-migration writes and assets. Runtime reverse export includes specialized stores and usage records.

Migration was exercised against a private copy of the actual 35,586,558-byte legacy store before live cutover: 75 published artifacts, 105 request records and a union of 106 page IDs. It produced 592 JSON files, including 75 evidence files, in approximately 18 seconds. Reconstructed records and rollback content matched the originals. The live cutover verified all 75 original publications unchanged. History metadata added by the existing application is retained. No original user draft or publication was rewritten.

`RuntimePaths` organizes new writes under research, system/usage, widgets, media/generated, cache, logs and backups. SQL migration uses SQLite backup snapshots. Legacy originals remain deliberately preserved for recovery; this release does not indiscriminately delete old temporary files. The server entrypoint remains compatible. Research HTTP routes and persistence/provider modules are separated; 49 existing backend test files moved to `backend/tests` with updated discovery.

## Reader, selection and conversation behavior

Reader/Edit/Sources/Media retain the existing prepared-publication boundary, revisioned updates, polling fallback and brief finished-content reveal. Initial reports show processing skeletons until complete; extensions keep existing content readable. Reconnects retrieve committed state. Existing dirty editor drafts are preserved.

The central composer is in an explicit layout region, so its selection card and multiline input do not cover the final sources. The narrow selection card is inside the upper-left composer area, with a shortened preview, full-passage inspection and removal. The full context remains separate from the editable question. Accepted sends clear the pending card; failed sends retain it. Submitted context cards remain in conversation history.

Source IDs and inline deduplication are preserved, with a complete unique bibliography. Image limits respect explicit user requests; normally three or four illustrations, never more than six. Surplus old image IDs remain addressable for existing drafts. Relevant source-attributed Markdown image URLs can be reused from saved evidence before making another paid image search. Failed assets do not leave empty boxes. A source-illustration refresh action reuses the existing idempotent enrichment job.

Research-history CSS, history item components and panel rendering were not redesigned. Existing controls were used to rename the successful diagnostic report and archive two unsuccessful test attempts; those records remain recoverable.

## Automated validation

- Backend regression run: **984 passed, one existing skip**. Reader-title, page and content-organization tests also passed independently (44 tests). An initial title-test fixture omitted required source metadata; the fixture was corrected before final validation.
- Frontend research/conversation/publication/provider/voice/synchronization regressions: **68 passed**.
- TypeScript: passed.
- Production build: passed. Existing Calculator `eval` and large-chunk warnings remain.
- Folder-store tests cover migration, originals/assets, rollback, corrupt intent, interrupted transaction recovery, cache stability, concurrent writes, disk failure, backup restoration and retention.
- Router tests use deterministic mocked providers for quota/timeout/outage, discovery failure, unsupported capabilities, malformed output, refusals, missing credentials, denied consent, candidate continuation, repair/attempt limits, shared pacing and cost ceilings.
- Runtime tests cover consent scope, typed playback generation, checkpoint-preserving retry and nonblocking health checks.

Mocked provider failures are not live quota tests. A structurally valid source ID is not proof that every numerical claim is true.

## Real UI and provider verification

The test was submitted using the ordinary UI New research flow at Detailed depth. Its subject was air-source versus ground-source heat pumps, with explicit requirements for substantial technical sections, a comparison table, citations and three or four technical images.

- Gemini generated real output but failed the detailed coverage target after bounded repair. The router continued through Groq using the saved evidence and checkpoint pipeline.
- Three completed sections contained 5,725, 6,206 and 6,253 characters: **18,184 characters** before surrounding report structure.
- The finished Reader appeared without manual refresh. It contained substantial connected prose, tables, **11 bibliography sources**, related media and **four loaded illustrations** after the source-image transport correction.
- A second request from Ask Aegis researched demand-controlled defrost, resistance backup heat and variable-speed performance. A **3,795-character addition** completed in the **same session and page**, with no extra history entry.
- An observer window received submitted conversation and publication updates while retaining its own Sources tab.
- Real Groq model discovery returned both configured candidates. Recorded successful calls include GPT-OSS 120B and GPT-OSS 20B; rejected and interrupted attempts remain in the private attempt journal. No successful result is fabricated for an interrupted attempt.
- A real selected-passage question requested two sentences using displayed findings only. Gemini returned the contextual answer, retained the submitted Selection card and completed audio playback without an initial microphone utterance. Playback completion was observed in application diagnostics; physical speaker audibility was not independently measured.
- Two real windows concurrently inserted separate editor paragraphs. Both appeared in the shared document. Undo in window A removed only A's paragraph; window B's remained. B's undo then removed its own paragraph. The test text was removed and the document saved.
- Markdown export was downloaded through the UI and contained 23,808 characters including the follow-up. Reader, Edit, Sources and Media opened. One internal source host did not supply a full article; the source reader correctly retained its saved excerpt rather than fabricating content. Native YouTube playback itself was not exercised.
- At a 640-pixel viewport, the composer stayed within the viewport without horizontal overflow. The viewport override was reset. Desktop source-footer clearance, long-report scrolling and the four-image layout were inspected visually.
- After final installation, a fresh UI window automatically restored the history and reopened the saved full report with four loaded images and no error banner. The development frontend was restarted once to clear its stale module graph. The working report was left in a new tab because an older in-app-browser tab retained its connection-error page.

## Remaining limits and operational notes

Provider quotas and existing application allowances still apply. The system now identifies the affected stage and preserves checkpoints; it does not promise unlimited free generation. Citation checks verify stored identities and associations, not automatic semantic proof of all claims. Optional cooperative processing has deterministic tests but no claimed live quality comparison. Existing draft content is preserved when publication images change, so a previously seeded draft can retain a different image arrangement. Paired-computer access stays disabled. Existing build/deprecation warnings remain as noted above.

Only public source, tests, configuration examples and this documentation belong in the delivery commit. Credentials, private research, usage receipts, device tokens, local validation screenshots, databases and exported documents remain outside Git.

## Changed interfaces and source map

- Research domain: `astra_ai/core/research/{artifacts,storage,providers,quota}.py`, with compatibility exports through `research_learning.py`.
- Composition/retrieval/presentation: `research_composition.py`, `research_model.py`, `research_openai.py`, `research_documents.py`, `research_history.py`, `research_illustrations.py`.
- Budget/discovery coordination: `background_budget.py`, `background_model.py`.
- Backend: `api/research.py`, `research_api.py`, `research_provider_settings.py`, `runtime_paths.py`, `server.py`, widget/media/workspace path consumers.
- API additions: secure research-provider discovery/diagnostic configuration, per-conversation fallback consent, checkpoint-preserving retry. Existing research document/page routes remain compatible.
- Frontend: `ResearchWorkspace.tsx`, `ChatComposer.tsx`, `SelectionContext.tsx` and CSS, `settings.ts`, `voice.ts`, `main.ts`, `Theme/theme.js`.
- Operations: `.env.example`, `.gitignore`, `pytest.ini`, `scripts/nova_runtime.py`, regression discovery, relocated tests and enterprise regression suites.

The Git commit contains the exact file manifest and rename history; no private runtime inventory is embedded here.
