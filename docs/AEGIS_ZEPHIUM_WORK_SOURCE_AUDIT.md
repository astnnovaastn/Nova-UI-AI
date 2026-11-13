# AEGIS Zephium Work source audit

Inspected local Zephium `7ccc28ff1cb102aba69ef4415fee266b8239fa0d` and checked key files against public main and v1.0.5, `1c4846cec9a9a0ab40ed45113d69a3f3c244d279`. Paths in the first two sections are relative to Zephium.

[Verified release tree](https://github.com/zephium-browser/Zephium/tree/1c4846cec9a9a0ab40ed45113d69a3f3c244d279)

## Request, planning and execution

| Layer | Observed source |
| --- | --- |
| Composer and catalogue | `frame/src/features/work/components/start/WorkStart.svelte` feeds a chosen recipe into the composer. `frame/src/features/work/lib/start/workflows.ts` defines `PERSONAS`, `WORKFLOWS`, `workflowOf`, `recentWorkflows` and `composed`. Cards supply request templates, skill IDs and vignette shapes. A vignette is catalogue imagery, independent of execution. |
| Skills | `crates/zephium-app/src/work_lead/skills.rs` defines `Skill`, `parse`, `load` and `for_request`. Explicit starts and matching triggers admit relevant skills. `work_lead/lead.rs::load_skill` loads a skill through the lead tool boundary. |
| Lead, tools and models | `work_lead/lead.rs::drive` and `execute` run a bounded tool-call loop. `work_lead/call.rs`, `prompt.rs`, `schema.rs`, `registry.rs::tool_sets` and `helpers` separate model calls, prompt contracts and tool registration. `work_lead/route.rs::offer` and `settle` handle tool or site choices. |
| Parts, sequence and concurrency | `work_lead/parts.rs` resolves parts and routes them. `Lead::claim_part` bounds parallel admission and `claim_site` arbitrates work on shared sites. `Lead::create`, `revise` and `finish` control progressive composition. `crates/zephium-work-composition/src/durable_runtime.rs::execute_public_node_owned` is a separate durable native runtime for scoped execution. |
| Results, placement and wire identity | `work_lead/objects.rs`, `blocks.rs`, `records.rs` and `project.rs::ProjectTools` represent domain objects and typed contributions. The frontend `WorkEnvironmentWorkspace.svelte` projects live parts and opened output. Files in `frame/src/features/work/lib/board/` project positions and relationships. Preview shapes are not authoritative graph dependencies. |
| Events and persistence | `crates/zephium-app/src/work_context.rs::projection` publishes the Work context to the frame. `work_lead/run.rs` holds execution state and `records.rs` records steps. `docs/agent-work-composition.md`, `agent-work-results.md` and `agent-work-persistence.md` describe the native lifecycle. |

## Catalogue and available AEGIS tools

| Persona | Recipes | Compatible AEGIS behavior |
| --- | --- | --- |
| Developer | Explain Code, Map a Project, Review a Change, Fix a Bug | Pasted code and public repositories. Explain/map can produce typed graph objects. Local project traversal and executing patches require separately authorized tools. |
| Designer | UI Teardown, Moodboard | Read public references and use existing media and cited Reader output. |
| Marketing | Competitor Landscape, Campaign Plan | Compare public evidence or draft a campaign with milestones. |
| Manager | Plan My Day, Weekly Status | Compose from supplied commitments and notes. Preserve concrete times and owners from input. |
| Student | Learning Path, Exam Prep | Sequence lessons, select evidence and produce exercises. |
| Office | Inbox Triage, Meeting Prep | Use supplied messages or agenda and, for meeting prep, bounded public research. |
| Founder | Market Map, Pricing Research, Investor List | Produce structured market groups, sourced pricing or evidence-backed investor matches. |
| Research | AEGIS adds Quick, Deep and Structured Research | Continue using the existing source, analysis, verification, map and Reader contracts. |

## AEGIS runtime and integration

The React entry is `astra_ai/ui/frontend/src/components/Research/ResearchWorkspace.tsx`. The existing Svelte canvas starts an explicit workflow ID in `work-canvas/src/AegisWorkHost.svelte` and `upstream/src/features/work/components/start/WorkStart.svelte`. Backend `astra_ai/ui/backend/api/work.py` validates the ID and creates a Work request. `astra_ai/core/work/catalog.py` holds personas, modes and budget profiles. `skills.py::SkillRegistry.select` already supports explicit and trigger-based selection.

`orchestrator.py::_Run.go` checkpoints plan, discovery, analysis, verification, gap-filling, writing and publication. `_model` uses the existing role router and shared budget. `_search_round` and `_analyze` already execute bounded independent tasks in parallel. `contracts.py` defines `TaskPlan`, `AgentResult`, `EvidenceRecord`, `Artifact` and `ResearchEvent`. `_build_map` validates typed graph data. `relations.py` preserves evidence-backed relationship types and stable IDs. `store.py::WorkStore` persists the record and events. `work-canvas/src/work-run.ts`, `research-to-run.ts` and `relations.ts` render recorded work, and `canvas_layout.py` keeps per-run position and viewport data.

Integrate the workflow's expected deliverable into the existing plan and writer payloads, keep tool admission tied to actual capability, and let the existing map and media surfaces project supported result types. Use bounded planning and typed artifacts already supported by AEGIS. Native Rust tool sets, browsing profiles and IPC are platform-specific. There is no evidence that copying those files would expose their tools safely to this web deployment. Local-file ingestion, calendar, inbox and native browser actions remain capability gaps. Keep the running service in place, verify Python changes in a test process, and use the frontend build to test web behavior against the running app.

## Recipe-level source findings

Every upstream row below comes from the same WorkStart and workflows.ts files listed above. Selecting it inserts the localized request and the named skill ID. The input and reads fields describe possible context at start. They do not grant native tool access. Each row uses the shared lead, parts, typed results, layout and persistence described above.

| Persona | Upstream skill ID | English title | Preview | Input | Declared reads | AEGIS expected output |
| --- | --- | --- | --- | --- | --- | --- |
| Developer | explain-code | Explain code | flow | folder | - | Explain the entry point, data and control flow, and the important invariants. Cite concrete identifiers from the supplied code. |
| Developer | map-a-project | Map a project | map | folder | - | Give a reading order, an architecture overview, module responsibilities and dependency boundaries. |
| Developer | review-a-change | Review a change | review | folder | GitHub | List findings in severity order, with locations, impact, a concrete fix and a concise review comment. |
| Developer | fix-a-bug | Fix a failing test | diff | folder | - | Show the failure, the causal chain, a minimal patch and a targeted test the user can run. |
| Designer | ui-teardown | UI teardown | screens | text | - | Describe the user journeys and interface patterns, with evidence and specific design implications. |
| Designer | moodboard | Moodboard | board | text | Are.na, Dribbble | Group the visual references into a coherent direction. For each reference give its source and the visual qualities worth using. |
| Marketing | competitor-landscape | Competitor landscape | landscape | text | - | Compare companies on the same dimensions. Mark missing evidence and date any pricing. |
| Marketing | campaign-plan | Campaign plan | campaign | text | - | Lay out audience, channel, schedule, launch copy and measurable milestones. |
| Manager | plan-my-day | Plan my day | day | none | Calendar, Gmail, Slack | Build a time-ordered agenda from supplied times, priorities and constraints. Flag conflicts and unscheduled tasks. |
| Manager | weekly-status | Weekly status | status | none | Linear, GitHub, Slack | Group completed work, next steps and blockers. Preserve names and dates from the notes. |
| Student | learning-path | Learning path | weeks | text | - | Sequence topics by prerequisite, with weekly goals, exercises, resources and completion checks. |
| Student | exam-prep | Exam prep | exam | text | - | Separate sourced exam format, study priorities, practice questions and an answer key. |
| Office | inbox-triage | Inbox triage | inbox | none | Gmail | Group the supplied messages by action and urgency, with a draft reply for each that needs one. |
| Office | meeting-prep | Meeting prep | people | none | Calendar, Gmail | Distinguish supplied agenda, verified background, open questions and proposed talking points. |
| Founder | market-map | Market map | market | text | - | Show defined segments, companies and evidence, followed by gaps and unknowns. |
| Founder | pricing-research | Pricing research | bars | text | - | Compare sourced prices with currency, billing period, scope and date, followed by positioning options. |
| Founder | investor-list | Investor list | investors | text | - | Give a sourced shortlist with investment thesis, stage, fit and relevant deals. |
| Research | quick-research | Quick Research | AEGIS | Prompt | Public sources | Lead with the answer, then the essential evidence and any material caveat. |
| Research | deep-research | Deep Research | AEGIS | Prompt | Public sources | Produce a sectioned, cited report covering the full request and unresolved questions. |
| Research | knowledge-map | Structured Research & Knowledge Map | AEGIS | Prompt | Public sources | Deliver a connected map and a reading guide through its key groups and relationships. |

## Data and layout details

- The upstream Work protocol is defined in crates/zephium-ipc/src/work.rs and exported through crates/zephium-ipc/bindings/work-v1.ts. WorkRuntimeProjection, WorkArtifactV1 and WorkEvidenceLink are structured protocol data. For example, comparison matrices and findings have different artifact kinds. The workspace also renders owned browser tabs and user-attached items, so an object may originate in either execution or an explicit user action.
- frame/src/features/work/lib/project-environment-board.ts uses partShape, environmentStages and ownPlaces to assemble execution lanes from records, with measurer handling card sizes. organize.ts::pendingOrganize and organizeExecution compute placements for a run. canvas-model.ts::relationLinks and reconcileNodes project explicit relationships and retain user positions by identity.
- Zephium skill selection has two phases. skills.rs::for_request filters offered skills with request heuristics and admits the explicitly chosen skill. The lead tool load_skill reads an admitted skill by name during execution. Skills are loaded from built-ins and profile directories. Their guidance does not change connector permissions. AEGIS uses the existing one-skill selection and does not add a lead call to mimic native tool-driven skill selection.
- In AEGIS, the new per-workflow output brief is shared by the lead plan and final writer. Structured maps receive a workflow-specific brief in the existing map call. Direct runs clear proposed web searches. Explicit workflow mode also controls API reservation. Existing AEGIS map cards use work-canvas/src/knowledge-map.ts::layoutMap and AegisWorkHost.svelte placement policy. Task, mail, calendar and file cards require real typed data and authorized capabilities.

## Verification and scope

The public workflows showcase covers eight scenarios, including travel and shopping. The in-app source defines seven persona categories, with Research added by AEGIS. The examples help identify desired outcomes. Tool availability and exact recipe IDs come from the source rather than the showcase. Zephium's site links a separate AGPL backend. AEGIS's workflow implementation uses its own provider adapters and orchestration. [Workflow showcase](https://zephium.app/workflows) · [Work documentation](https://zephium.app/docs/work)

The running Work composer submitted the Explain Code recipe ID and supplied code to its usual endpoint. The request was intercepted before provider calls. The Python regression suite ran nine recipe scenarios with controlled provider and search adapters, verifying the selected mode, output brief, applicable typed map contract and direct-mode search limits. The original AEGIS service remained running. The Python workflow changes were verified in the isolated test process and are available to the service on its next normal start. Live provider output and native connectors were outside those checks.
