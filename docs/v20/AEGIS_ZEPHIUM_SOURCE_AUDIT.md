# AEGIS V20 — source audit

Implementation record, 16 November 2026. This is also the Work Architecture Audit; do not maintain a second divergent audit.

The application remains a React shell, directly mounted Svelte canvas, and Python Work service. The reference clone is not an implementation target.

| Source | Responsibility | Integration |
| --- | --- | --- |
| Zephium board/types.ts, board/objects.ts | Typed content, revisions and owned views | Approved inert object contracts in objects/registry.ts and workspace_objects.py |
| board/layout.ts | Content-sensitive sizing and composition | Existing AEGIS planner extended with designer/families.ts |
| run/layout.ts, run/columns.ts | Execution order and parallel columns | Dependency ranks and task-role lanes; no fixed four-row recipe |
| run/lines.ts | Branch and merge geometry | Existing cubic router with empty-corridor junctions |
| PartRow.svelte, PageFace.svelte | Real page frames and source stacks | Existing durable sync process plus scripts/v20-patches.mjs |
| InputMark.svelte | Compact loaded Skill marks | Existing AEGIS adapter retained |
| work_lead/lead.rs, skills.rs, registry.rs | Tool-driven execution and loaded Skills | Python execution contracts; Rust runtime not imported |
| work_lead/objects.rs | Structured output validation | Inert approved object registry and public revision metadata |

Pinned source: [9026a1fffad74d6e201ef97fe8c02c1b01403cd2](https://github.com/zephium-browser/Zephium/tree/9026a1fffad74d6e201ef97fe8c02c1b01403cd2).
The supplied audit compared upstream 7dcd872, 15 commits ahead. This implementation does not assert that it is today's latest commit. No upstream update was needed for these adapters.

MPL notices remain in work-canvas/NOTICE.md and the emitted NOTICE.txt and LICENSE-MPL-2.0.txt. work-canvas/upstream/MANIFEST.json records copied/adapted modules. Run npm run sync from work-canvas to reproduce adaptations. Do not hand-edit the reference clone.

No new layout dependency was introduced. [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html) remains a design reference, not a bundled dependency.

Connections now expose optional Google Calendar/Gmail reads and configured repository excerpts. Unrestricted folders, command execution, other account services and MCP remain unavailable. Upstream UI is not evidence that those tools work in AEGIS.
