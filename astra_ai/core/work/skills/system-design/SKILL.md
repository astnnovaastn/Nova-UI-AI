---
name: system-design
description: Describe a software architecture and the way its components, data and dependencies fit together.
category: developer
triggers: [system design, design an architecture, design a system, software architecture, architecture of, technical architecture]
title: System design
tools: [web_search, web_fetch]
origin: Zephium 9026a1fffad74d6e201ef97fe8c02c1b01403cd2 (MPL-2.0), AEGIS execution adapter
---

<!-- Adapted from Zephium crates/zephium-app/skills/system-design/SKILL.md at 9026a1fffad74d6e201ef97fe8c02c1b01403cd2. Mozilla Public License 2.0; https://mozilla.org/MPL/2.0/. Upstream body preserved below. -->

## AEGIS execution binding
Follow the workflow below through the existing AEGIS planning, evidence, analysis and writing stages. Only use tools already permitted for this run. The upstream tool names describe intent: describe_project and computer parts mean inspect supplied project evidence or accessible public code/documentation; never claim local folder access or start a new agent outside the existing orchestrator. read_canvas means use the supplied run context. create/revise/finish mean produce or update the existing structured research output, not call unsupported tools. Represent diagrams in the existing knowledge map when requested, sheets as cited report tables, and plots only when the current output supports them. Preserve existing output schemas, citations and user requirements. For a named real system, distinguish verified architecture from a proposed design; do not invent unseen modules.

# System design

## Make it from what you know
- An architecture, a stack or a data flow is a making request: answer from your own knowledge without parts or searches. Search only for facts the design depends on that change (a current price, a limit, whether a service still exists), a few focused searches at most.

## Result
- One **diagram** of the system: every node a real component, named in at most 28 characters, with its kind; a vendor host (postgresql.org, vercel.com, cloudflare.com) whenever the node is a real product; layers for tiers (Client, Edge, App, Data, AI) when the design has them; labelled edges only for the main flow (Request, Embeds, Streams). At most 24 nodes; group small things.
- A **sheet** for the stack when it helps choose: columns Layer (text), Choice (entity, with the product's logo host on the row), Why (text, a phrase). One row per layer.
- A **plot** only for numbers worth comparing (monthly cost by stage), with a basis that says they are typical published figures when they are.
- The **reply** on top: headline naming the shape ("Edge API, queue workers, Postgres with pgvector"), text with the two or three decisions that matter, points for cautions.
- No document restating the diagram. Never sentences in sheet cells.

## Comparing providers for an existing design
- The design on the canvas is the subject; the person's own project is not, unless the request names it.
- Current prices: read each provider's own pricing page yourself with web_fetch by its plain address (https://vercel.com/pricing, https://www.hetzner.com/cloud), all in one turn; search only for a provider whose pricing page you cannot name. No parts, no lists of notes.
- Read the diagram first (read_canvas with its id). Revise it in place, keeping its title: mark the recommended provider on each node it changes (vendor and a note such as "Cloudflare Workers"). Keep node ids so the person sees what changed. Never a second diagram.
- Add one **sheet** comparing the providers: first column entity with each provider's logo host; yes_no columns for capabilities the design needs (checks, not sentences); money columns with currency for comparable prices; best set on the columns where lower or higher wins. An unknown price stays empty.
- Reply with the recommendation and the reason in one sentence each.
