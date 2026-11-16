---
name: map-a-project
description: Map a named project's modules, evidence-backed dependencies, and useful starting points.
category: developer
triggers: [map a project, map the project, map the architecture, map the codebase, map the repository, map its modules]
title: Map a project
tools: [web_search, web_fetch]
origin: Zephium 9026a1fffad74d6e201ef97fe8c02c1b01403cd2 (MPL-2.0), AEGIS execution adapter
---

<!-- Adapted from Zephium crates/zephium-app/skills/map-a-project/SKILL.md at 9026a1fffad74d6e201ef97fe8c02c1b01403cd2. Mozilla Public License 2.0; https://mozilla.org/MPL/2.0/. Upstream body preserved below. -->

## AEGIS execution binding
Follow the workflow below through the existing AEGIS planning, evidence, analysis and writing stages. Only use tools already permitted for this run. The upstream tool names describe intent: describe_project and computer parts mean inspect supplied project evidence or accessible public code/documentation; never claim local folder access or start a new agent outside the existing orchestrator. read_canvas means use the supplied run context. create/revise/finish mean produce or update the existing structured research output, not call unsupported tools. Represent diagrams in the existing knowledge map when requested, sheets as cited report tables, and plots only when the current output supports them. Preserve existing output schemas, citations and user requirements. For a named real system, distinguish verified architecture from a proposed design; do not invent unseen modules.

# Map a project

## Read (in one turn)
- describe_project on the folder: its project object (stack, structure, scripts, git state) is the first half of the map.
- One computer part, **Architecture**, in the same folder. Its brief: find the entry points (main, the server's routes, the app's root component, the CLI's commands), the modules or packages and which of them import which, and the external services the code calls (databases, queues, third-party APIs, found in config and client setup). Return each module with its path and one line on its job, each dependency between modules, and each external service with its host. It reads only and stops after about twenty files.

## Result
- The **project** object from describe_project, as it is.
- One **diagram**, left to right from where a request enters to where data lands: layers for the tiers the code really has (Client, API, Domain, Data, Services), nodes for its modules named as the code names them, kind service for code, store and queue for storage, external for third-party APIs with their vendor host (stripe.com, postgresql.org) so their logos show. Edges for the main flow only, labelled with what passes. At most twenty nodes: group small modules.
- The **reply**: a headline naming the shape ("A SvelteKit app over a Rust API and Postgres"), text naming the two or three files to read first and why, points for what stands out (a missing test suite, a module everything depends on, a stale dependency) only when the reading showed it.
- No sheet restating the stack the project object already shows; no document.

## Follow-ups
- "Explain X" goes to explain-code; "fix", "failing tests" to fix-a-bug; "review my changes" to review-a-change.
