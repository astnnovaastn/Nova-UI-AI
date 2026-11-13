# AEGIS Work V7: adaptive canvas, Skills, Connections and the source browser

Implemented on 2026-11-11 against V7 ("Adaptive Research Canvas · Real Node/Edge Semantics ·
Zephium Skills & Connections · Embedded Source Browser"). This file is the final report V7 §10 asks
for.

## 1. Runtime (what AEGIS actually is)

AEGIS runs as a **hosted web app**: a Vite/React frontend on :5173, with the Svelte Work canvas built
into it, and a Python/FastAPI backend on :8340 under a supervisor. Only the Tauri CLI is installed as a
dev dependency. There is **no Tauri or Electron host and no native WebView**, so the source browser
uses V7 Target B: a live iframe when a site allows framing, and an honest Source Reader when it
doesn't. Nothing was migrated to Rust.

## 2. Files changed in AEGIS, and why

| File | Change |
|---|---|
| `astra_ai/core/work/skills.py` (new) | Skill registry in Zephium's `SKILL.md` format: parse/render, built-ins, user skills, enable/disable, duplicate, delete, append-only audit log, selection by workflow or trigger words, version hash. |
| `astra_ai/core/work/skills/*/SKILL.md` (new, 10) | Built-in skill bodies adapted from Zephium skills (MPL-2.0; each file says so). |
| `astra_ai/core/work/connections.py` (new) | Connection adapters with real status from server configuration (search providers, the six model slots, the proxy), plus unavailable ones with reasons. On/off switches for search providers, audit log, `allowed()` gate. |
| `astra_ai/core/work/network.py` (new) | Manual proxy (off/HTTP/HTTPS/SOCKS5, credentials kept server-side), a real proxy test, and the SSRF-guarded Source Reader. |
| `astra_ai/core/work/orchestrator.py` | Planning selects a skill, gives its instructions to the lead, records `plan.skill` (name, version, source, how chosen), emits a `skill` stage, and feeds the skill to workers and the writer. A resumed run restores its skill. Also records Zephium-style `usage.parts` timing (from the earlier experiment). |
| `astra_ai/core/research_learning.py` | Video search honours the Connections on/off switches. |
| `astra_ai/ui/backend/api/work.py` | Routes: `/api/work/skills…`, `/api/work/connections…`, `/api/work/network` (+`/test`), `/api/work/reader`. |
| `astra_ai/ui/backend/server.py` | Attaches the skill registry, proxy and connections to the Work orchestrator. |
| `requirements.txt` | `PySocks==1.7.1`, for SOCKS5. |
| `work-canvas/src/plan-card.ts`, `PlanCard.svelte` (new) | The AI PLAN card: goal, mode, a step checklist from real stage events, assigned models, strategy, skill. |
| `work-canvas/src/semantic-layout.ts` | A plan column right after the request, top-aligned with it, with the Sources collection and Discovery under the plan. |
| `work-canvas/src/AegisWorkHost.svelte` | Plan item and layout input. Relation resolution: plans → AI PLAN, assigns from AI PLAN, found sources come from the Sources collection. Skills and Connections panels. AEGIS layout is the default again; Zephium layout is the optional comparison. |
| `work-canvas/src/relations.ts` | Only `assigns` counts as control (hidden until a card is selected). Plans and searches are now short, local, visible strings. |
| `work-canvas/src/route.ts`, `StrandEdge.svelte` | A far string crosses a column through its **gaps**, never through an unrelated card (V7 §3.1). Passing through a card is only an explicit option. White strings with glowing joints are kept. |
| `work-canvas/src/Rail.svelte`, `SkillsPanel.svelte`, `ConnectionsPanel.svelte`, `work-panels.svelte.ts` (new) | Skills and Connections icons in the left rail, with docked panels. |
| `work-canvas/src/BrowserWindow.svelte` | Modes: `iframe-live`, `source-reader` and `unavailable`. A Source Reader switch on live pages. No default "Open in browser"; an external link appears only inside an unavailable pane. |
| `work-canvas/scripts/sync-upstream.mjs` | Patches: BrowserPane's Open-in-browser button only when a handler is given; register `plancard`; redraw nodes when AEGIS's own data (plan, collection, branch) changes. |
| `src/components/Research/ResearchWorkspace.tsx` | Follow-up reads continue while a run finishes, even with the live stream connected, so final relations arrive without a reload. |

## 3. Zephium sources inspected and reused (local clone `astra_ai/ui/zephium-source`, commit `7ccc28ff1`, MPL-2.0)

| Zephium source | Use in AEGIS | How |
|---|---|---|
| `crates/zephium-app/src/work_lead/skills.rs` | `skills.py` | Clean-room Python implementation of the same `SKILL.md` format and rules (user skill overrides a built-in, triggers, limits). No Rust copied. |
| `crates/zephium-app/skills/{research,competitor-landscape,market-map,pricing-research,learning-path,investor-list,ui-teardown,exam-prep,meeting-prep}/SKILL.md` | `astra_ai/core/work/skills/*/SKILL.md` | Adapted (Modifications under MPL-2.0, attributed in each file): Zephium's tools and canvas objects became AEGIS report sections and tables. |
| `frame/src/features/work/components/pane/BrowserPane.svelte` | Source browser chrome | Already reused via `sync-upstream.mjs` (MPL-2.0), now with one more patch. |
| `frame/src/features/work/lib/canvas-model.ts` | Node updates | Patched to compare AEGIS's fields. |
| `crates/zephium-app/src/work_lead/route.rs`, `work_personal` | Connections | Read for behaviour (connection status, ask before using). Not copied: AEGIS has no MCP client, folders or signed-in accounts, so those are shown as unavailable. |
| Zephium's AI-service backend (AGPL) | — | Not used. |

## 4. Architecture

```
React ResearchWorkspace ── store.actions (headers, openView, openSource, findVideos) ──┐
   │ report, trace, run                                                              │
   ▼                                                                                 ▼
Svelte Work canvas (AegisWorkHost) ── fetch /api/work/* with X-Nova-Client ──► FastAPI api/work.py
   ├─ AI PLAN card ◄── run.plan + trace stages                                       ├─ SkillRegistry  (state/work/skills, audit)
   ├─ strings ◄── run.relations (+ report-derived images/videos)                     ├─ Connections    (state/work/connections.json, audit)
   ├─ Skills / Connections panels ──────────────────────────────────────────────────►├─ ProxySettings  (state/work/network.json, password never returned)
   └─ BrowserWindow ── iframe-live (the person's own browser network)                └─ reader_page ── public-only fetch (+proxy) ── sanitized HTML
                    └─ source-reader ◄── /api/work/reader ─────────────────────────────┘
Orchestrator: SkillRegistry.select → lead plan (skill instructions) → workers/writer → run.plan.skill
```

## 5. Layout and string rules

- **Order:** User Prompt (top-left; the activity steps under it) → **AI PLAN** (its own column, tall,
  top-aligned) with the **one Sources collection** and the Discovery worker directly under it → source
  pages (at most four per column; a fifth starts the next tier) → analysis → verification → AEGIS →
  Images and Videos (their own column) → the report. Stages are centred on a shared midline.
- **Captions** sit above their cards. Saved manual and pinned positions always win; reopening a run
  restores them and moves nothing.
- **Strings** are white (green while active, amber when contested, red dotted when failed), with a
  glowing meniscus at each end. Between neighbouring columns a string is one S-curve. Further away it
  crosses each column through the nearest gap and **never through a card the data doesn't pass**.
  Cards in one column join down the column. Assign strings show when one of their cards is selected.
  Every string is a recorded relation; Images and Videos strings come from the saved report's images
  and video search.

## 6. Skills and Connections

- **Skills:** 20 built-ins (each workflow, 10 with fuller adapted bodies), plus the person's own.
  - In the panel: search, read the instructions and their origin, turn on or off, duplicate a
    built-in to edit, create, edit and delete your own. Built-ins can't be deleted.
  - A skill changes instructions only; it never adds a model, tool or permission. Only the person
    edits skills, and every change is audited.
  - A run records the skill name, version, source and how it was chosen. The panel and the AI PLAN
    card show it.
- **Connections:**
  - Search providers (Tavily, SerpAPI, Exa): real configured status, with on/off switches that video
    search obeys.
  - The six model slots: read-only, set on the server, and the panel shows when a slot is failing.
  - The proxy.
  - Local folders, Git, MCP servers and signed-in accounts: shown as unavailable with the reason.
    This build has no runner, MCP client or desktop host.
  - Nothing in this build can send, post or delete. No key ever reaches the page.

## 7. Source browser and proxy

| Case | What happens |
|---|---|
| Site allows framing | Live page in a sandboxed, credentialless iframe, inside the movable and resizable Zephium pane, with back, forward and reload over the window's own history. A "Source Reader" button is always offered. |
| Site refuses framing (X-Frame-Options or CSP frame-ancestors) | The backend fetches the page once and shows clean, sanitized text and links in a frame that can run no scripts. A banner says "Source Reader … This is not the live site". |
| Reader also fails | An honest message, "Read the saved copy" when evidence exists, and only then "Open the original site in a new tab". |
| Proxy | Off, HTTP, HTTPS or SOCKS5 (remote DNS by default), with optional credentials. It applies to the Source Reader and the proxy test. **Live iframe pages use the person's own browser network**, and the panel says so. The test makes a real request to `https://www.gstatic.com/generate_204` and stores the outcome. |
| Security | Targets must be public (no loopback, private or metadata addresses, file:, javascript: or data:), with redirects re-checked. Page content is data and is sanitized. The password is never returned. |

**Not available on this runtime:** native WebView pages, signed-in browsing sessions, proxying of the
live iframe. These need a desktop host (Tauri or Wry, as Zephium uses). That is future work.

## 8. Tests (2026-11-11)

| Suite | Result |
|---|---|
| Backend Work, research, video and media tests (`pytest -k "work or research or video or media"`) | 497 passed, 1 skipped |
| New `test_work_skills_connections.py` | 11 passed (skills format, audit, selection, run records its skill, connections never show keys, toggles obeyed, proxy validation and real test, reader SSRF refusal and sanitizing) |
| Canvas unit tests (`vitest`) | 237 passed |
| `tests/work-v7.e2e.cjs` on the saved offshore-wind run, with local HTTP (18080) and SOCKS5 (18081) test proxies | 28/28 |
| Layout regression `work-layout.e2e.cjs` (Grid-Scale, solid-state, Quick, heat pump, offshore wind) | 26/26, 20/20, 20/20, 20/20, 20/20 |
| Hand replay `work-replay.e2e.cjs` | 11/11 |
| Live Quick Research run 3 (`work-strings.live.cjs`) | 19/24. Four failures are Deep-only checks; the fifth was a test that didn't know report-derived Images and Videos strings, since fixed in the test. Cards stay put and strings match after reload. |

The V7 e2e checks cover A01, A08, A10, A14–A17, A19, A20 and A23.

## 9. Remaining work

- A desktop host (Tauri) for native WebView pages, signed-in sessions and proxying live pages (A18).
- MCP, folder and Git connections need a confined runner and an MCP client with approval flows.
- The plan card does not yet show plan revisions during gap rounds as separate entries.
- ELK-style measured layout for very large runs (50+ nodes) has not been evaluated; the current
  deterministic staged layout was tested up to the Deep runs above.

---

# V8 layout correction (2026-11-11)

Reference: `astra_ai/ui/frontend/UI Design/download.svg` (Prompt → AI PLAN → web tasks → Analysis →
Verify → Final report, with Sources under the plan feeding an Evidence pipeline on a lower track).

## What changed

| File | Change |
|---|---|
| `work-canvas/src/plan-card.ts`, `PlanCard.svelte` | The separate AI PLAN checklist is gone. There is **one** planning and activity card: the AI PLAN heading, research objective, execution strategy (with the skill), assigned agents, and the existing activity timeline (Zephium's own `Trail` component, same recorded lines) inside it. Research made without a plan shows the same card titled "Research activity", with no invented plan or agents. |
| `work-canvas/src/stage-cards.ts`, `StageCard.svelte` (new) | **Evidence processing pipeline** (Source processing → Deduplication → Evidence ranking → Citation builder → Knowledge update) and **Collect all results** (Collected results and media; Final compilation). Each module appears only when the run recorded that stage, with the run's own numbers. |
| `work-canvas/src/semantic-layout.ts` | The pipeline is a lower track: it starts under the first source column, under every column it runs beneath, level with the Sources card. Collect all results is its own stage just before the report. |
| `work-canvas/src/AegisWorkHost.svelte` | No separate timeline card on a composed canvas. Relations: found sources branch from the AI PLAN; Discovery delivers to the plan; citations run Sources → pipeline; pipeline → Collect all results → report; AEGIS's writing and the Images and Videos collections go into Collect all results. |
| `work-canvas/src/relations.ts` | Relation types `processes`, `compiles`, `publishes` (derived from recorded stages, marked `detail.derived`). |
| `work-canvas/scripts/sync-upstream.mjs` | Registers `stagecard`; nodes redraw when `stages` data changes. |
| `tests/work-v7.e2e.cjs`, `tests/work-strings.live.cjs`, `work-canvas/tests/plan-card.test.ts` | V8 checks. |

## Not added, because the backend does no such work

A second parallel verification node, a separate Gap Analysis card, a "User prompt answer check" card,
and "Knowledge base search / integration". The run has one verification pass, and its gap round and
quality check are shown as lines in the activity timeline. V8 says not to add stages that don't
correspond to real work.

## Tests

- Canvas unit tests: 241 passed.
- `work-v7.e2e.cjs` (32 checks, including V8 acceptance items 1–5, 10, 12, 13, 15 and 18): 32/32 on the
  Quick run, the medium Grid-Scale run, the Deep offshore-wind run and a newly created Quick run.
- Layout regression on five saved canvases: all pass. Hand replay: 11/11.
