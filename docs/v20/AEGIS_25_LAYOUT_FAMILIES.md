# The 25 adaptive layout families

Each package is a deterministic composition family, a screen concept and an interaction specification. The current implementation shares production renderers and preserves saved geometry. These are not 25 color themes.

## 01 — Focused answer

Read a supported answer.

**Composition:** Supporting inputs in a compact column; a prominent answer in the adjacent reading column.

**Interaction:** Open answer; contextual Ask; inspect recorded sources.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** focused-answer at 5, 20, 50 and 100 objects. Workflows: quick-research,meeting-prep.

[Overview](../../astra_ai/ui/frontend/v20-verification/focused-answer-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/focused-answer-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/focused-answer-focus.png)

## 02 — Parallel investigation

Follow independent work.

**Composition:** Independent task roles form horizontal lanes. Lane length follows measured card bounds.

**Interaction:** Select a task lane; inspect status/output. Task-scoped execution retry is not yet exposed by this renderer.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** parallel-investigation at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/parallel-investigation-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/parallel-investigation-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/parallel-investigation-focus.png)

## 03 — Branching research

Explore related questions.

**Composition:** Dependency ranks form columns. Branch groups are vertically balanced around their parent level.

**Interaction:** Select a topic and follow its logical edges. Topic collapse is a future object action.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** branching-research at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/branching-research-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/branching-research-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/branching-research-focus.png)

## 04 — Evidence convergence

Trace evidence into conclusions.

**Composition:** Evidence is packed in up to three columns; conclusions sit at the convergence side.

**Interaction:** Select evidence or conclusion; inspect original edge memberships.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** evidence-convergence at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/evidence-convergence-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/evidence-convergence-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/evidence-convergence-focus.png)

## 05 — Architecture atlas

Explore a system and its modules.

**Composition:** Dependency depth forms horizontal subsystem bands; nested component objects render local graphs.

**Interaction:** Open the architecture object; select a component to emphasize its immediate connections.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** architecture-atlas at 5, 20, 50 and 100 objects. Workflows: map-a-project.

[Overview](../../astra_ai/ui/frontend/v20-verification/architecture-atlas-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/architecture-atlas-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/architecture-atlas-focus.png)

## 06 — Dependency explorer

Trace dependencies and cycles.

**Composition:** Directed dependency ranks form columns. Subject cycles remain representable inside diagram objects.

**Interaction:** Select a dependency node; retain original edge direction and saved canvas position.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** dependency-explorer at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/dependency-explorer-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/dependency-explorer-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/dependency-explorer-focus.png)

## 07 — Source collections

Inspect related pages.

**Composition:** Meaningful group IDs create compact two-column page collections. Source record identity is retained.

**Interaction:** Use the existing hover/keyboard/touch source stack and intentional page-open controller.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** source-collections at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/source-collections-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/source-collections-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/source-collections-focus.png)

## 08 — Comparison desk

Compare like-for-like evidence.

**Composition:** Comparable groups form columns, with typed comparison objects aligning attributes within each column.

**Interaction:** Read aligned comparison rows; Open for readability. Per-cell provenance is not yet implemented.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** comparison-desk at 5, 20, 50 and 100 objects. Workflows: pricing-research,investor-list.

[Overview](../../astra_ai/ui/frontend/v20-verification/comparison-desk-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/comparison-desk-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/comparison-desk-focus.png)

## 09 — Timeline and milestones

Follow dated work.

**Composition:** Real timestamps determine the time-axis position. Undated objects occupy a separate column.

**Interaction:** Read timestamped entries and open their details. Date writes require a future registered capability.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** timeline-milestones at 5, 20, 50 and 100 objects. Workflows: campaign-plan,learning-path.

[Overview](../../astra_ai/ui/frontend/v20-verification/timeline-milestones-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/timeline-milestones-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/timeline-milestones-focus.png)

## 10 — Execution board

See progress and blockers.

**Composition:** Recorded task statuses form Ready, Working, Blocked and Complete columns.

**Interaction:** Inspect actual status; dragging changes presentation, not execution.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** execution-board at 5, 20, 50 and 100 objects. Workflows: weekly-status.

[Overview](../../astra_ai/ui/frontend/v20-verification/execution-board-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/execution-board-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/execution-board-focus.png)

## 11 — Daily schedule

Resolve priorities and time conflicts.

**Composition:** Calendar timestamps share a time scale; unscheduled objects remain in an adjacent column.

**Interaction:** Inspect dated and undated entries. Calendar conflict editing and save remain unavailable.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** daily-schedule at 5, 20, 50 and 100 objects. Workflows: plan-my-day.

[Overview](../../astra_ai/ui/frontend/v20-verification/daily-schedule-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/daily-schedule-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/daily-schedule-focus.png)

## 12 — Research publication

Read findings with their evidence.

**Composition:** A reading column holds reports; evidence and supporting objects occupy a compact side rail.

**Interaction:** Open the report in the existing Reader; retain full persisted body and citations.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** research-publication at 5, 20, 50 and 100 objects. Workflows: deep-research.

[Overview](../../astra_ai/ui/frontend/v20-verification/research-publication-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/research-publication-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/research-publication-focus.png)

## 13 — Visual moodboard

Choose a visual direction.

**Composition:** Visual references form a measured grid, with differing card sizes retained.

**Interaction:** Open supplied image; retain its reference and caption. Compare sources on the canvas.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** visual-moodboard at 5, 20, 50 and 100 objects. Workflows: moodboard.

[Overview](../../astra_ai/ui/frontend/v20-verification/visual-moodboard-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/visual-moodboard-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/visual-moodboard-focus.png)

## 14 — Annotated UI teardown

Inspect findings in context.

**Composition:** Screenshot references occupy one column; findings and recommendations occupy the adjacent rail.

**Interaction:** Open screenshot and finding; region-linked annotation editing remains future work.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** ui-teardown at 5, 20, 50 and 100 objects. Workflows: ui-teardown.

[Overview](../../astra_ai/ui/frontend/v20-verification/ui-teardown-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/ui-teardown-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/ui-teardown-focus.png)

## 15 — Debugging workbench

Follow reproduction, fix and validation.

**Composition:** Reproduction, code and proposed changes follow dependency order; test/log output gets a separate row.

**Interaction:** Read code/diff/logs; a proposed patch is not an executed change.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** debugging-workbench at 5, 20, 50 and 100 objects. Workflows: fix-a-bug.

[Overview](../../astra_ai/ui/frontend/v20-verification/debugging-workbench-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/debugging-workbench-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/debugging-workbench-focus.png)

## 16 — Decision workspace

Compare choices and assumptions.

**Composition:** A leading decision anchors an options column, centered around the starting question.

**Interaction:** Read decision criteria and evidence. Recalculating weighted decisions remains future work.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** decision-workspace at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/decision-workspace-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/decision-workspace-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/decision-workspace-focus.png)

## 17 — Knowledge constellation

Explore supported relationships.

**Composition:** Stable concept groups form compact local clusters with their own measured size.

**Interaction:** Open the concept diagram and select a node to emphasize its immediate edges.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** knowledge-constellation at 5, 20, 50 and 100 objects. Workflows: knowledge-map.

[Overview](../../astra_ai/ui/frontend/v20-verification/knowledge-constellation-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/knowledge-constellation-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/knowledge-constellation-focus.png)

## 18 — Document production

Review sections and revisions.

**Composition:** Editorial roles or object kinds determine columns for drafts, reviews and final output.

**Interaction:** Read drafts and notes. Revision comparison/comment resolution remain future work.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** document-production at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/document-production-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/document-production-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/document-production-focus.png)

## 19 — Market landscape

Explore evidence-backed segments.

**Composition:** Recorded classification groups form horizontal market bands. No unsourced numeric axes are created.

**Interaction:** Inspect classification and comparison evidence; no invented company data.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** market-landscape at 5, 20, 50 and 100 objects. Workflows: market-map,competitor-landscape.

[Overview](../../astra_ai/ui/frontend/v20-verification/market-landscape-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/market-landscape-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/market-landscape-focus.png)

## 20 — Mixed-result workspace

Read coordinated result types.

**Composition:** One primary answer sits above a locally packed set of compatible result objects.

**Interaction:** Open a section independently while keeping the surrounding canvas unchanged.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** mixed-result at 5, 20, 50 and 100 objects. Workflows: exam-prep.

[Overview](../../astra_ai/ui/frontend/v20-verification/mixed-result-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/mixed-result-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/mixed-result-focus.png)

## 21 — Claim and contradiction review

Inspect support, conflict and gaps.

**Composition:** Supplied supporting/conflicting/unresolved groups form distinct review columns.

**Interaction:** Read agreement, contradiction and gaps; contextual Ask uses the selected object.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** claim-review at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/claim-review-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/claim-review-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/claim-review-focus.png)

## 22 — Code walkthrough

Read code with its explanation.

**Composition:** Code is the primary reading column; explanations and diagrams occupy the adjacent rail.

**Interaction:** Read source code and linked explanation. Symbol-to-file navigation requires repository access.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** code-walkthrough at 5, 20, 50 and 100 objects. Workflows: explain-code.

[Overview](../../astra_ai/ui/frontend/v20-verification/code-walkthrough-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/code-walkthrough-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/code-walkthrough-focus.png)

## 23 — Change-review studio

Review changed lines and findings.

**Composition:** Diff is primary; findings and validation objects occupy the review rail.

**Interaction:** Read changed lines and findings; executed validation requires a real runner.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** change-review at 5, 20, 50 and 100 objects. Workflows: review-a-change.

[Overview](../../astra_ai/ui/frontend/v20-verification/change-review-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/change-review-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/change-review-focus.png)

## 24 — Priority inbox

Review messages, actions and drafts.

**Composition:** Message/context objects occupy the list column; draft documents occupy the detail column.

**Interaction:** Review supplied message and draft; no sending or account mutation is simulated.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** priority-inbox at 5, 20, 50 and 100 objects. Workflows: inbox-triage.

[Overview](../../astra_ai/ui/frontend/v20-verification/priority-inbox-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/priority-inbox-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/priority-inbox-focus.png)

## 25 — Trip and budget planner

Compare options and an itinerary.

**Composition:** Options and comparisons form a compact three-column area; itinerary/report sits beside them.

**Interaction:** Read supplied/fixture options, itinerary and totals. No bookings or live travel data are invented.

**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.

**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.

**Fixtures:** trip-budget at 5, 20, 50 and 100 objects. Workflows: selected explicitly or by compatible output structure.

[Overview](../../astra_ai/ui/frontend/v20-verification/trip-budget-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/trip-budget-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/trip-budget-focus.png)

