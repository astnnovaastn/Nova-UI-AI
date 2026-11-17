/*
 * Founder workflows (Market Map, Pricing Research, Investor List), the three AEGIS research
 * modes (Quick, Deep, Structured / Knowledge Map) and a stress run. Every company, fund,
 * person, price and figure is invented, on the reserved `.example` domain.
 */
import type { WorkflowFixture } from "../types";
import { page, results } from "../web";
import { create, fact, fetch, finish, hr, hs, part, say, search, skill, turn } from "./kit";

/* ───────── Market Map ───────── */
const companies = [
  { name: "Berthly", host: "berthly.example", segment: "Booking", founded: "2019", raised: "62000000", round: "Series B" },
  { name: "Dockside", host: "dockside.example", segment: "Booking", founded: "2021", raised: "14000000", round: "Series A" },
  { name: "TideOps", host: "tideops.example", segment: "Operations", founded: "2018", raised: "31000000", round: "Series B" },
  { name: "Mooring IQ", host: "mooringiq.example", segment: "Operations", founded: "2022", raised: "4000000", round: "Seed" },
  { name: "Ballast Pay", host: "ballastpay.example", segment: "Billing", founded: "2023", raised: "2500000", round: "Seed" },
];
page("https://maritime-map.example/2026", "Marina software market map 2026 (sample)", companies.map((c) => `${c.name}: ${c.segment}, ${c.round}`));
page("https://funding-news.example/marina-software", "Marina software funding (sample)", companies.map((c) => `${c.name} raised $${Number(c.raised) / 1e6}M (${c.round})`));
results("marina software companies funding", ["https://maritime-map.example/2026", "https://funding-news.example/marina-software"]);
results("marina software market segments", ["https://maritime-map.example/2026"]);

export const marketMap: WorkflowFixture = {
  id: "market-map",
  title: "Market Map",
  persona: "founder",
  skill: "market-map",
  origin: "zephium",
  prompt: "Map the market for marina management software",
  examples: ["Map the market for marina management software", "Market map: harbour operations tools"],
  needs: ["web"],
  aegisMode: "structured",
  fidelity: "Follows market-map: Players and Segments research parts placing nothing; the map is a diagram with a layer per segment and a node per company (kind external, vendor its host), then a facts sheet sorted by raised and a reply.",
  turns: [
    say(
      "Players and segments, in parallel",
      skill("market-map"),
      part({ key: "players", title: "Players", helper: "research", goal: "Companies with host, founding year, raised and last round", turns: [turn("Searching", hs("marina software companies funding")), turn("Reading", hr("https://maritime-map.example/2026"), hr("https://funding-news.example/marina-software"))], finish: { summary: "5 companies", digest: "Berthly, Dockside, TideOps, Mooring IQ, Ballast Pay with rounds." } }),
      part({ key: "segments", title: "Segments", helper: "research", goal: "How the market divides", turns: [turn("Searching", hs("marina software market segments"))], finish: { summary: "3 segments", digest: "Booking, Operations, Billing." } }),
    ),
    say(
      "Drawing the map",
      create(
        "diagram",
        "Marina software, by segment",
        {
          layers: [
            { id: "booking", name: "Booking" },
            { id: "operations", name: "Operations" },
            { id: "billing", name: "Billing" },
          ],
          nodes: companies.map((c) => ({ id: c.host.split(".")[0], name: c.name, kind: "external", layer: c.segment.toLowerCase(), vendor: c.host, note: `${c.round} · $${Number(c.raised) / 1e6}M` })),
          edges: [],
        },
        ["https://maritime-map.example/2026", "https://funding-news.example/marina-software"],
      ),
      create(
        "sheet",
        "Companies",
        {
          columns: [
            { label: "Company", kind: "entity" },
            { label: "Segment", kind: "tag" },
            { label: "Founded", kind: "number" },
            { label: "Raised", kind: "money", currency: "USD", best: "max" },
            { label: "Last round", kind: "tag" },
          ],
          rows: [...companies].sort((a, b) => Number(b.raised) - Number(a.raised)).map((c) => ({ cells: [c.name, c.segment, c.founded, c.raised, c.round], entity: { logo_host: c.host } })),
        },
        ["https://funding-news.example/marina-software"],
      ),
    ),
    say("Done", finish({ headline: "Three segments; crowded in booking, open in billing", text: "Only **Ballast Pay** works on billing, with a seed round." }, "Map and facts are on the canvas.", ["https://maritime-map.example/2026"])),
  ],
};

/* ───────── Pricing Research ───────── */
const tools = [
  { name: "Berthly", host: "berthly.example", model: "Per berth", free: "no", limit: "", entry: "4", business: "7", annual: "15", enterprise: "yes" },
  { name: "Dockside", host: "dockside.example", model: "Per berth", free: "yes", limit: "20 berths", entry: "3", business: "6", annual: "10", enterprise: "yes" },
  { name: "TideOps", host: "tideops.example", model: "Flat", free: "no", limit: "", entry: "199", business: "449", annual: "20", enterprise: "yes" },
  { name: "Mooring IQ", host: "mooringiq.example", model: "Per berth", free: "yes", limit: "10 berths", entry: "2.5", business: "", annual: "", enterprise: "no" },
];
results("marina software pricing", ["https://maritime-map.example/2026"]);
for (const tool of tools) page(`https://${tool.host}/pricing`, `Pricing — ${tool.name} (sample)`, [`${tool.model}: from $${tool.entry} a month`, `Free plan: ${tool.free}${tool.limit ? ` (${tool.limit})` : ""}`]);

export const pricingResearch: WorkflowFixture = {
  id: "pricing-research",
  title: "Pricing Research",
  persona: "founder",
  skill: "pricing-research",
  origin: "zephium",
  prompt: "How do marina management tools price? Recommend a price for ours",
  examples: ["How do marina management tools price? Recommend a price for ours", "Pricing research for marina software"],
  needs: ["web"],
  aegisMode: "deep",
  fidelity: "Follows pricing-research: one search, then each vendor's own pricing page read by the lead with web_fetch, all in one turn, no parts; a sheet, a bar_horizontal plot of entry prices (four products have one) and a recommendation.",
  turns: [
    say("Finding who sells it", skill("pricing-research"), search("marina software pricing")),
    say("Reading each pricing page", ...tools.map((tool) => fetch(`https://${tool.host}/pricing`))),
    say(
      "Comparing",
      create(
        "sheet",
        "Pricing compared",
        {
          columns: [
            { label: "Product", kind: "entity" },
            { label: "Model", kind: "tag" },
            { label: "Free plan", kind: "yes_no" },
            { label: "Free limit", kind: "text" },
            { label: "Entry", kind: "money", currency: "USD", best: "min" },
            { label: "Business", kind: "money", currency: "USD" },
            { label: "Annual discount", kind: "percent" },
          ],
          rows: tools.map((tool) => ({ cells: [tool.name, tool.model, tool.free, tool.limit, tool.entry, tool.business, tool.annual], entity: { logo_host: tool.host } })),
          note: "Per berth per month, billed monthly, read November 2026 (sample).",
        },
        tools.map((tool) => `https://${tool.host}/pricing`),
      ),
      create(
        "plot",
        "Entry price",
        {
          style: "bar_horizontal",
          x: { label: "Product", kind: "category" },
          y: { label: "USD a month", format: "money", currency: "USD" },
          series: [{ name: "Entry", points: tools.filter((tool) => tool.model === "Per berth").map((tool) => ({ x: tool.name, y: tool.entry })) }],
          headline: { label: "Median per berth", value: "$3" },
          basis: "Each vendor's own pricing page, November 2026 (sample data)",
        },
        tools.map((tool) => `https://${tool.host}/pricing`),
      ),
    ),
    say("Done", finish({ headline: "$3 per berth, free up to 15 berths", text: "Per-berth tools cluster at **$2.50–$4**; a free tier is needed to compete with Dockside.", figures: [{ label: "Median", value: "$3" }, { label: "Range", value: "$2.50–$4" }] }, "Comparison and chart are on the canvas.", tools.map((tool) => `https://${tool.host}/pricing`))),
  ],
};

/* ───────── Investor List ───────── */
page("https://deals.example/seed-maritime", "Seed rounds in maritime software (sample)", ["Harbourline Ventures led Ballast Pay seed (Mar 2026)", "Keel Capital joined Mooring IQ seed (Jan 2026)"]);
page("https://angels.example/operators", "Operator angels in logistics (sample)", ["Rae Lindqvist (ex-Berthly) backed Mooring IQ (2026)"]);
results("seed investors maritime software 2026", ["https://deals.example/seed-maritime"]);
results("angel investors marina software", ["https://angels.example/operators"]);

export const investorList: WorkflowFixture = {
  id: "investor-list",
  title: "Investor List",
  persona: "founder",
  skill: "investor-list",
  origin: "zephium",
  prompt: "Find investors for our marina billing startup",
  examples: ["Find investors for our marina billing startup", "Investor list for our seed round"],
  needs: ["web"],
  aegisMode: "deep",
  fidelity: "Follows investor-list: one question for the missing stage, Funds and Angels research parts placing nothing; one picks object of the best fits with the strongest recommended.",
  turns: [
    say("Asking the stage", skill("investor-list"), { tool: "ask", question: "Which round are you raising?", options: ["Pre-seed", "Seed", "Series A"], answer: "Seed" }),
    say(
      "Funds and angels, in parallel",
      part({ key: "funds", title: "Funds", helper: "research", goal: "Funds leading seed rounds in maritime software", turns: [turn("Searching", hs("seed investors maritime software 2026")), turn("Reading", hr("https://deals.example/seed-maritime"))], finish: { summary: "2 funds", digest: "Harbourline led Ballast Pay seed; Keel joined Mooring IQ seed." } }),
      part({ key: "angels", title: "Angels", helper: "research", goal: "Operator angels", turns: [turn("Searching", hs("angel investors marina software")), turn("Reading", hr("https://angels.example/operators"))], finish: { summary: "1 angel", digest: "Rae Lindqvist, ex-Berthly." } }),
    ),
    say(
      "Choosing the fits",
      create(
        "picks",
        "Investors who fit",
        {
          facet: "company",
          items: [
            { name: "Harbourline Ventures", subtitle: "Seed fund", logo_host: "harbourline.example", url: "https://deals.example/seed-maritime", facts: [fact("Relevant deal", "Led Ballast Pay seed, 2026")], why: "Already backs maritime billing", recommended: true },
            { name: "Keel Capital", subtitle: "Seed fund", logo_host: "keel.example", url: "https://deals.example/seed-maritime", facts: [fact("Relevant deal", "Mooring IQ seed, 2026")], why: "Active in marina operations" },
            { name: "Rae Lindqvist", subtitle: "Angel, ex-Berthly", url: "https://angels.example/operators", facts: [fact("Relevant deal", "Mooring IQ, 2026")], why: "Knows the buyers" },
          ],
        },
        ["https://deals.example/seed-maritime", "https://angels.example/operators"],
      ),
    ),
    say("Done", finish({ headline: "3 fits; start with Harbourline", text: "Harbourline led the only billing seed in the space." }, "Shortlist is on the canvas.", ["https://deals.example/seed-maritime"])),
  ],
};

/* ───────── AEGIS research modes ───────── */
page("https://harbour-tech.example/tide-windows", "Tide windows in booking software (sample)", ["Berthly and TideOps check tide windows before confirming", "Dockside does not"]);
page("https://berthly.example/docs/tides", "Berthly docs — tide windows (sample)", ["Bookings are refused when draught exceeds the window"]);
results("booking platforms that check tide windows", ["https://harbour-tech.example/tide-windows"]);
results("berthly tide window docs", ["https://berthly.example/docs/tides"]);

export const quickResearch: WorkflowFixture = {
  id: "quick-research",
  title: "Quick Research",
  persona: "research",
  skill: "research",
  origin: "aegis",
  prompt: "Which harbour booking platforms check tide windows?",
  examples: ["Which harbour booking platforms check tide windows?", "Quick research: do marina tools support tide windows?"],
  needs: ["web"],
  aegisMode: "quick",
  fidelity: "AEGIS workflow (catalog.py quick-research), simulated on Zephium's research skill: two focused searches and one primary page read by the lead, a small sheet and a cited reply. Zephium has no quick/deep mode switch; the skill sizes the work.",
  turns: [
    say("Two focused searches", skill("research"), search("booking platforms that check tide windows"), search("berthly tide window docs")),
    say("Reading the primary source", fetch("https://berthly.example/docs/tides")),
    say(
      "Answering",
      create("sheet", "Tide-window support", { columns: [{ label: "Platform", kind: "entity" }, { label: "Checks tide windows", kind: "yes_no" }], rows: [{ cells: ["Berthly", "yes"], entity: { logo_host: "berthly.example" } }, { cells: ["TideOps", "yes"], entity: { logo_host: "tideops.example" } }, { cells: ["Dockside", "no"], entity: { logo_host: "dockside.example" } }] }, ["https://harbour-tech.example/tide-windows", "https://berthly.example/docs/tides"]),
    ),
    say("Done", finish({ headline: "Berthly and TideOps do; Dockside does not", text: "Berthly refuses a booking when the vessel's draught exceeds the window (its docs)." }, "Answer and table are on the canvas.", ["https://berthly.example/docs/tides"])),
  ],
};

for (const [key, title] of [
  ["regulation", "Shore-power rules for marinas (sample)"],
  ["cost", "Shore-power installation costs (sample)"],
  ["adoption", "Shore-power adoption survey (sample)"],
  ["check", "Independent review of shore-power figures (sample)"],
] as const)
  page(`https://shore-power.example/${key}`, title, [`${title}: invented sample findings`, "2024: 18%", "2025: 26%", "2026: 34%"]);
results("shore power marina regulation", ["https://shore-power.example/regulation"]);
results("shore power installation cost marina", ["https://shore-power.example/cost"]);
results("shore power adoption marinas", ["https://shore-power.example/adoption"]);

export const deepResearch: WorkflowFixture = {
  id: "deep-research",
  title: "Deep Research",
  persona: "research",
  skill: "research",
  origin: "aegis",
  prompt: "Deep research: should a small marina invest in shore power?",
  examples: ["Deep research: should a small marina invest in shore power?"],
  needs: ["web"],
  aegisMode: "deep",
  fidelity: "AEGIS workflow (deep-research): three research parts by angle, then a verification part that depends on them (AEGIS's verify stage; Zephium's skill has no separate verifier, so this part is an AEGIS proposal), then a report document, a sheet, a chart and open questions.",
  turns: [
    say(
      "Three angles in parallel",
      skill("research"),
      part({ key: "rules", title: "Rules", helper: "research", goal: "Regulation and grants", turns: [turn("Searching", hs("shore power marina regulation")), turn("Reading", hr("https://shore-power.example/regulation"))], finish: { summary: "Rules found", digest: "Grants cover 30% in the sample region." } }),
      part({ key: "cost", title: "Cost", helper: "research", goal: "Installation and running cost", turns: [turn("Searching", hs("shore power installation cost marina")), turn("Reading", hr("https://shore-power.example/cost"))], finish: { summary: "Cost range", digest: "Per-berth cost range (sample)." } }),
      part({ key: "adoption", title: "Adoption", helper: "research", goal: "How many marinas have it", turns: [turn("Searching", hs("shore power adoption marinas")), turn("Reading", hr("https://shore-power.example/adoption"))], finish: { summary: "3 years of data", digest: "18% → 26% → 34% (sample)." } }),
    ),
    say("Checking the figures", part({ key: "verify", title: "Verify", helper: "research", goal: "Cross-check the adoption figures against an independent review", turns: [turn("Reading the independent review", hr("https://shore-power.example/check"))], finish: { summary: "Figures agree", digest: "Independent review agrees within 2 points." } })),
    say(
      "Writing the report",
      create("document", "Shore power for a small marina", { paragraphs: ["Sample report built from invented sources.", "## Rules", "Grants cover part of the cost.", "## Cost", "Per-berth installation dominates.", "## Adoption", "Adoption roughly doubled in two years.", "## What we could not establish", "Running cost per season for a marina under 50 berths."] }, ["https://shore-power.example/regulation", "https://shore-power.example/cost", "https://shore-power.example/adoption"]),
      create("plot", "Marinas with shore power", { style: "line", x: { label: "Year", kind: "category" }, y: { label: "Share", format: "percent" }, series: [{ name: "Adoption", points: [{ x: "2024", y: "18" }, { x: "2025", y: "26" }, { x: "2026", y: "34" }] }], basis: "Adoption survey and independent review (sample data)" }, ["https://shore-power.example/adoption", "https://shore-power.example/check"]),
      create("list", "Open questions", { style: "questions", items: [{ title: "What does a season of shore power cost a 40-berth marina?", detail: "No source states it." }] }),
    ),
    say("Done", finish({ headline: "Yes, if the grant applies", text: "Adoption rose from **18% to 34%** in two years; grants change the payback most.", figures: [{ label: "Adoption 2026", value: "34%" }] }, "Report, chart and questions are on the canvas.", ["https://shore-power.example/adoption"])),
  ],
};

export const knowledgeMap: WorkflowFixture = {
  id: "knowledge-map",
  title: "Structured Research / Knowledge Map",
  persona: "research",
  skill: "system-design",
  origin: "aegis",
  prompt: "Explain how a marina booking system works as a knowledge map",
  examples: ["Explain how a marina booking system works as a knowledge map", "Blueprint of a harbour booking platform"],
  needs: ["web"],
  aegisMode: "structured",
  fidelity: "AEGIS workflow (knowledge-map). Zephium has no knowledge-map object: its closest is the diagram with layers, which system-design draws from the model's own knowledge with few searches. AEGIS's KNOWLEDGE_MAP groups map onto diagram layers, nodes onto nodes, edges onto edges.",
  turns: [
    say("One fact the design depends on", skill("system-design"), search("booking platforms that check tide windows")),
    say(
      "Drawing the map",
      create(
        "diagram",
        "A marina booking system",
        {
          layers: [
            { id: "client", name: "Client" },
            { id: "app", name: "App" },
            { id: "data", name: "Data" },
            { id: "ext", name: "Services" },
          ],
          nodes: [
            { id: "web", name: "Booking site", kind: "client", layer: "client" },
            { id: "api", name: "Booking API", kind: "gateway", layer: "app" },
            { id: "rules", name: "Berth rules", kind: "service", layer: "app", note: "Tide window check" },
            { id: "db", name: "Bookings DB", kind: "store", layer: "data", vendor: "postgresql.org" },
            { id: "tide", name: "Tide data", kind: "external", layer: "ext" },
            { id: "pay", name: "Payments", kind: "external", layer: "ext" },
          ],
          edges: [
            { from: "web", to: "api", label: "Request" },
            { from: "api", to: "rules" },
            { from: "rules", to: "tide", label: "Window" },
            { from: "api", to: "db", label: "Save" },
            { from: "api", to: "pay", label: "Charge" },
          ],
        },
        ["https://harbour-tech.example/tide-windows"],
      ),
      create("document", "Reading guide", { paragraphs: ["Start at the Booking API: every request passes the berth rules before it is saved.", "## The one rule", "A booking is refused when the tide window cannot fit the vessel's draught."] }, ["https://harbour-tech.example/tide-windows"]),
    ),
    say("Done", finish({ headline: "Site, API with berth rules, one database", text: "The **tide window check** is the rule everything else depends on." }, "Map and reading guide are on the canvas.", ["https://harbour-tech.example/tide-windows"])),
  ],
};

/* ───────── Stress: the most parts a run may hold ───────── */
const STRESS = Array.from({ length: 17 }, (_, index) => index + 1);
for (const index of STRESS) {
  page(`https://stress.example/a/${index}`, `Stress page A${index} (sample)`, [`Fact ${index}`]);
  page(`https://stress.example/b/${index}`, `Stress page B${index} (sample)`, [`Fact ${index}b`]);
}
export const stress: WorkflowFixture = {
  id: "stress",
  title: "Stress: 16 parts",
  persona: "research",
  origin: "aegis",
  prompt: "Stress run: compare seventeen sample vendors",
  examples: ["Stress run: compare seventeen sample vendors"],
  needs: ["web"],
  stress: true,
  fidelity: "Not a workflow: a load test. Seventeen parts are asked for; sixteen start (MAX_WORK_PARTS), at most four at once (PARALLEL_PARTS), and the seventeenth is refused with the Rust's own words.",
  turns: [
    say(
      "Seventeen parts at once",
      ...STRESS.map((index) => part({ key: `v${index}`, title: `Vendor ${index}`, helper: "research", goal: `Two pages about vendor ${index}`, turns: [turn("Reading", hr(`https://stress.example/a/${index}`), hr(`https://stress.example/b/${index}`))], finish: { summary: "2 pages", digest: `Vendor ${index} facts.` } })),
    ),
    say(
      "One table",
      create("sheet", "Vendors", { columns: [{ label: "Vendor", kind: "text" }, { label: "Fact", kind: "text" }], rows: STRESS.slice(0, 16).map((index) => ({ cells: [`Vendor ${index}`, `Fact ${index}`] })) }, STRESS.slice(0, 16).map((index) => `https://stress.example/a/${index}`)),
    ),
    say("Done", finish({ headline: "Sixteen vendors compared", text: "The seventeenth part was refused: a run holds at most sixteen." }, "Table is on the canvas.")),
  ],
};
