---
name: pricing-research
description: Research how competitors price a kind of product (plans, price points, free tiers) and recommend a price.
category: founder
triggers: [pricing, price, plans and pricing, how much does]
title: Pricing research
tools: [web_search, web_fetch]
origin: Zephium 9026a1fffad74d6e201ef97fe8c02c1b01403cd2 (MPL-2.0), AEGIS execution adapter
---

<!-- Adapted from Zephium crates/zephium-app/skills/pricing-research/SKILL.md at 9026a1fffad74d6e201ef97fe8c02c1b01403cd2. Mozilla Public License 2.0; https://mozilla.org/MPL/2.0/. Upstream body preserved below. -->

## AEGIS execution binding
Follow the workflow below through the existing AEGIS planning, evidence, analysis and writing stages. Only use tools already permitted for this run. The upstream tool names describe intent: describe_project and computer parts mean inspect supplied project evidence or accessible public code/documentation; never claim local folder access or start a new agent outside the existing orchestrator. read_canvas means use the supplied run context. create/revise/finish mean produce or update the existing structured research output, not call unsupported tools. Represent diagrams in the existing knowledge map when requested, sheets as cited report tables, and plots only when the current output supports them. Preserve existing output schemas, citations and user requirements. For a named real system, distinguish verified architecture from a proposed design; do not invent unseen modules.

# Pricing research

## Gather
- The competitors the request names, else the five or six that matter, found with one web_search.
- Read each one's own pricing page yourself with web_fetch by its plain address (https://linear.app/pricing), all in one turn. A page that does not show prices gets one web_search by name and nothing more (your searches are few); a product that no longer sells is left out of the sheet and named in the reply; a price from anywhere but the vendor's own page is marked as such in the sheet's note.
- No parts: a pricing page is public and reads in one call.

## Result
- One **sheet**, one row per product: Product (entity; every row's entity carries the product's logo_host), Model (tag, how the price scales: per seat, usage or flat), Free plan (yes_no), Free limit (text: "10 users", "250 issues"), Entry (money with currency, per seat per month when per seat, billed monthly), Business (money, the next plan up), Annual discount (percent), Enterprise (yes_no: a contact-sales plan). best min on Entry. A value the page does not show stays empty, never "Not shown". note is one sentence of at most 120 characters with the billing basis and the month read ("Per seat per month, billed monthly, September 2026").
- One **plot**, style bar_horizontal, of the entry price per product, with a headline of the median and a basis naming the pricing pages and the month; only when four or more products have an entry price.
- The **reply**: a headline with the recommendation ("$8 per seat, free up to 10 users"), text with the reason drawn from the sheet (where the market clusters, what the free plan must include to compete), figures for the median entry price and the range. Points only for what the sheet cannot say (what a free plan must include here, where the next price step sits), never a row restated.
- Prices exactly as the pages show them; never a remembered price.
