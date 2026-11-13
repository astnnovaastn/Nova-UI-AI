# How Zephium Work is organized

Read from the cloned source in `astra_ai/ui/zephium-source` (commit `7ccc28ff1`). This covers what happens
from the moment the person sends a prompt to the finished canvas: which box comes first, what the AI
is given, how it splits the work, and how each workflow (Developer, Designer, Marketing, Manager,
Student, Office, Founder) builds its result.

Main source files:

| What | Where |
|---|---|
| Workflows on the start screen | `frame/src/features/work/lib/start/workflows.ts`, `components/start/WorkStart.svelte` |
| Workflow titles and requests | `frame/messages/en.json` (`work_flow_*`) |
| Skills (how each workflow is done) | `crates/zephium-app/skills/<name>/SKILL.md`, loaded by `src/work_lead/skills.rs` |
| The lead agent (the main AI) | `crates/zephium-app/src/work_lead/mod.rs`, `lead.rs`, `prompt.rs` |
| Helpers (sub-agents) | `src/work_lead/parts.rs`, `hands.rs`, `route.rs` |
| Memory | `src/work_personal/mod.rs` (`digest`) |
| Canvas layout of a run | `frame/src/features/work/lib/run/layout.ts`, `columns.ts`, `lines.ts` |
| Marks and animation | `components/run/RunMark.svelte`, `AgentMark.svelte`, `presence/PartAgent.svelte`, `presence/PartMark.svelte`, `lib/arrival.ts`, `lib/camera-follow.ts` |

---

## 1. The big picture

```
 Start screen ──► Composer ──► App checks (folders, sites) ──► Inputs gathered ──► Lead AI
 (persona,        (request      "Read <folder>?"                memory, skill,      plans and
  workflow tile)   text)                                        history, tabs...    splits work
                                                                                        │
             ┌──────────────────────────────────────────────────────────────────────────┘
             ▼
     Parts run in parallel (max 4)  ──►  each part's finds on its row  ──►  Lead composes the result
     browser / research / computer /                                       reply on top + objects
     connection helpers                                                     (plan, list, sheet,
                                                                            picks, diagram, diff,
                                                                            draft...)  + Sources under
```

The rules behind it:
- **The AI only proposes; the app decides.** Every tool call is checked in Rust before it runs.
- **The model doesn't write the layout.** It says what it does (parts, objects) and the frame
  places everything by fixed rules.
- **The canvas is the answer.** The AI's text outside tool calls only shows as a one-line status
  ("thinking", "searching"). Every answer goes into objects.
- **One object per purpose.** A follow-up revises the existing object instead of adding a copy.

---

## 2. The start screen (before anything is sent)

1. **Persona tabs:** Developer, Designer, Marketing, Manager, Student, Office, Founder. The selected
   tab is the person's own choice, otherwise the persona of their most recent workflow, otherwise
   Developer.
2. **"For you" row:** up to 3 workflows taken from the person's latest works (`recentWorkflows`),
   most recent first. A past request is matched to a workflow by its opening words or a keyword
   pattern (`known`).
3. **Workflow tiles** for the chosen persona. Each tile has a title, one line, a small drawing of
   its result's shape (`flow`, `map`, `review`, `diff`, `screens`, `board`, `day`, `status`,
   `weeks`, `exam`, `inbox`, `people`, `market`, `bars`, `investors`) and a colour.
4. **Picking a tile** writes the workflow's request into the ask bar ("Map the architecture of …")
   and asks its one question:
   - `folder`: a "Choose folder" button. The chosen path is added to the end of the request.
   - `text`: a typed answer ("Make a moodboard for …").
   - `none`: it's ready to send ("Plan my day").
5. The tile also records **which skill** it belongs to (`grant.skill`), so the lead starts with
   that skill already loaded.

---

## 3. What happens when the prompt is sent (in order)

From `work_lead/mod.rs` → `lead.rs`.

| # | Step | What it does |
|---|---|---|
| 1 | **Run admitted** | A durable execution and attempt are created. Nothing runs until that is stored. |
| 2 | **Folders asked in place** | A folder path in the request gets "Read <folder>?" before the AI starts. An allowed folder stays granted for this work's later requests. |
| 3 | **Sites trusted** | Links in the request and sites earlier requests already worked in are let in, so a follow-up doesn't ask again. |
| 4 | **Inputs placed** | Everything the run pulls in is drawn **left of the request** as small marks: attached files, open tabs, notes, connections, earlier work. |
| 5 | **Memory read** | `work_personal::digest` takes up to a fixed number of remembered facts (`- fact (kind)`). If any exist, a **"Your memory"** mark appears left of the request. |
| 6 | **Context built** (`context_text`) | The first user message, in this order: Request → Now (date/time) → a draft being sent → earlier requests in this work → blocked sites → objects already on the canvas → attachments → the person's answers so far → open tabs → private-run note → granted folders → canvas blocks → "name this work" if unnamed. |
| 7 | **Skills offered** (`skills::for_request`) | All skills, except the five that read the person's own apps (plan-my-day, today-from-my-messages, inbox-triage, meeting-prep, weekly-status). Those are only offered when the request is about their apps or day ("my inbox", "today", "Slack"). |
| 8 | **System prompt** | Block 1: the **CORE** rules (how to work, what to make, honest results, asking, safety, ending). Block 2: a **skills index** (name + one-line description of each), then the **memory** ("use it, never repeat it back"). Block 2 is cached. |
| 9 | **Workflow skill loaded** | If the person started from a tile, that skill's full body is appended: "The person started this from the X workflow… follow it". A **Skill** mark appears left of the request. Otherwise the lead may call `load_skill` itself. |
| 10 | **Lead loop** | Each turn: check cancel and budget → status *Planning* → add the person's mid-run steering → compact old messages → call the model → run that turn's tool calls together → feed back short results. It stops on `finish`, a stop, the budget, or a turn with no progress. There is no fixed turn cap. |
| 11 | **Asking** | Only when the answer changes the outcome. For a big job, one ask with options before any parts start (dates and budget for a trip). The app, not the AI, asks for site access and folders. |
| 12 | **Parts started** | `start_part` with a title (Stay, Flights, Code, Slack…), a helper type, a goal and a brief. Several in one turn run in parallel (at most 4; the rest wait). |
| 13 | **Parts report** | Each helper returns a digest (facts with source keys, ≤14 lines) and may place **one** object (picks or a small sheet) at the end of its row. A blocked part shows its fix on its own row (sign in, allow, retry). |
| 14 | **Result composed** | The lead creates the result objects from the digests, then the **reply** on top: a headline plus one to three sentences, figures and points. |
| 15 | **Finish** | `finish` publishes the reply with its sources, records, layout and the work's title. Status goes to *Finishing*, then done. |

### The helpers a part can use

| Helper | Does | Its own prompt |
|---|---|---|
| `browser` | Web pages and the person's signed-in sites: listings, prices, photos, inboxes, forms (up to the app's Confirm) | `BROWSER` |
| `research` | Searches and public pages; returns a cited digest, no prose | `RESEARCH` |
| `computer` | Granted folders: read, search, edit (the person approves), run commands, git and gh | `COMPUTER` |
| `connection` | An installed CLI or MCP server the person added | — |

Every helper also follows `HELPER`: work only toward the part's goal, report missing things
honestly, and stop as soon as it has enough.

### The status line ("thinking" animation)

The run reports one activity at a time (`WorkActivityV1`):

`Planning → Delegating → Searching / Reading / Interacting → Comparing → Verifying → ProducingArtifact → Finishing`

It can also be `Recovering`, `Paused` (window hidden), `WaitingForApproval`, `WaitingForHuman` or
`Cancelling`.

On the canvas these become:
- **RunMark** (the run's logo mark): a lit ring while it works, a ring with a centre while it waits
  for the person, a tick when done, a rest when stopped.
- **AgentMark / PartAgent:** each helper's face at its part's top-right, with one word for what it's
  doing: *thinking, searching, reading, working, done*. Its moves glide; a finished one gives a
  small pulse ring.
- **PartMark:** the part's logo is its service: the site's favicon, the search, the Mac, or the
  connection.
- **NeedsYou:** what a site needs from the person (one sentence and one button), over its page or
  under the part's name. It's calm, and only the button is lit.

---

## 4. How the boxes are placed (the canvas layout of one run)

From `lib/run/layout.ts` and `columns.ts`. Everything sits on an 8 px grid and is laid out
**left to right in the order the work happened.**

```
 inputs   request          column 0            column 1              result
 ┌────┐   ┌─────────┐      ┌──────────┐        ┌──────────┐          ┌──────────────┐
 │mem │   │ "Plan a │──┬──►│ Part A   │──finds─┼─►Part C  │──finds──►│ reply        │
 │tabs│   │  trip…" │  │   └──────────┘        │          │          │ (headline)   │
 │file│   └─────────┘  │   ┌──────────┐        └──────────┘          │ plan / picks │
 └────┘                └──►│ Part B   │──finds───────────────────────►│ sheet ...    │
                           └──────────┘                              └──────────────┘
                                                                     ┌──────────────┐
                                                                     │ Sources      │
                                                                     └──────────────┘
```

The rules:
1. **Inputs** hang left of the request (memory, skill, history, notes, tabs, files, connection,
   work).
2. **The request** stands at the run's top-left.
3. **Columns by time:** work that overlapped in time stands in one column, and a new column starts
   only when new work began after everything in the last one had ended. So parallel work reads as
   parallel and later work stands further right.
4. **A part that follows on** from the one just before it stands under it, in the same column, and
   is joined down from it rather than forked to.
5. **Rows:** each part is a row. Its name sits 12 px under the row's top, and its helper's mark sits
   on the left.
6. **Finds along the row:** what a part found sits at the end of its row, in the order it was
   found. A long row wraps under itself (past 1080 px), so it never pushes the result off screen.
7. **The result** stands 96 px past the last column. Its reply headline lines up with the request's
   top, and tall content grows **downward**, so a tall result never moves the work.
8. **Sources** stand 40 px under the result. A run with no result keeps them under its parts.
9. **The next request's run** starts 120 px under everything this run holds. The thread reads down
   the canvas, one lane per message.

Spacing constants (`RUN`): inputs 200, request 320, gutter 48, fork 96, rowGap 48, feed 96,
found gap 24, sources 40, air 6, all in px.

### The lines between boxes

- The request's line **forks** to the head of every row in the first column. The fork's trunk
  stands halfway (`fork: 96`).
- Each column's work **merges on a spine and forks on** into the next column.
- **Only the last column reaches the result.** Earlier columns reach it through the later ones. A
  line never runs level through a column to reach earlier work.
- Lines stop 6 px short of what they join (`air`).
- Without parts, the answer stands one fork-width past the request's words, joined by a single
  line.

### Motion

- **Arrival** (`arrival.ts`): a box the run just placed rises 12 px into place as it fades in.
  Under reduced motion it only fades. A box scrolled back into view later stays still.
- **Camera follow** (`camera-follow.ts`): the view only **pans**, never zooms (zoom is the
  person's), and keeps room ahead of what it follows so the next step doesn't move the view again.
- **Free space** (`free-space.ts`): a run keeps clear of things the person placed. A drop too close
  is moved to the nearest free spot.

---

## 5. The boxes the AI can make (object kinds)

| Kind | Use |
|---|---|
| **reply** | The answer on top: a headline, 1–3 sentences, large figures, short points. One per request, published first. |
| **picks** | Things to choose between, each with a photo or logo, price and link. At most one recommended. |
| **plan** | Time-ordered steps: an itinerary, a roadmap, weeks of study. It can be a calendar. |
| **list** | Items without time order, each saying where it came from (app, who, when, quote, link). Styles include todo, messages, requirements, reading. |
| **sheet** | Real data in typed columns (money, yes/no, rating, tag). No sentences. |
| **plot** | A chart, with a basis saying where the values come from. |
| **diagram** | Nodes and edges, left to right, with vendor logos for real products. |
| **subject** | The one thing a request is about (a PR, an issue, an email), shaped like its service. |
| **code / diff** | Exact text: an excerpt, or a change in hunks. |
| **draft** | A message shaped like its destination (Slack, email, GitHub). Sending goes through the app's Confirm. |
| **document** | Only when the person asked for text. |
| **media** | An image, video or audio at its https URL (YouTube plays in place). |
| **project** | An exact reading of a granted folder (`describe_project`). |

Every object lists the source keys it rests on. Pictures and links must come from those sources,
and an object with no sources is the AI's own knowledge and may hold no pictures or links.

---

## 6. Every workflow, box by box

Each row is **parts first (left, in parallel unless noted) → result boxes (right, in the order
listed) → reply on top.** "Ask first" means one question with options before any parts start.

### Developer
| Workflow (request) | Needs | Parts (left) | Result (right) |
|---|---|---|---|
| **Explain code** ("Explain how this code works:") | folder | **Code** (computer): opens the file, follows calls one step in and out, returns line ranges. Pasted code needs no part. | **diagram** of the flow in data order (≤12 nodes) → up to 3 **code** excerpts in reading order → **reply** saying what it does and the one thing a reader would miss |
| **Map a project** ("Map the architecture of") | folder | `describe_project` + **Architecture** (computer): entry points, modules, imports, external services, ~20 files | **project** object → one **diagram** from where a request enters to where data lands, in layers (Client, API, Domain, Data, Services), ≤20 nodes → **reply** naming the shape and the 2–3 files to read first |
| **Review a change** ("Review the change in") | folder; reads GitHub | **Change** (computer, using gh or git diff; a browser part on the PR otherwise): every problem with path, line, severity and the smallest fix; runs the tests | **list** "Two things before merging" (blockers first, ≤12) → up to 3 **diff** fixes → **draft** of the review comment → **reply** with the verdict |
| **Fix a failing test** ("Fix the failing tests in") | folder | **GitHub** (issue, comments) and **Code** (reproduce, smallest edit, rerun tests). A failing test needs only Code. GitHub goes first when the issue is the only lead; both start together when the file or error is named. | one **diff** per file → **code** only when it explains the cause → **draft** PR comment → **reply** naming the cause, with tests passed and failed |

### Designer
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **UI teardown** ("Tear down the interface of") | text | One browser part per product (≤3): home, pricing, sign-up and product pages. Their real pages stand on the canvas as the screens. | **list** "Worth taking" (≤8 design moves) → **sheet** comparing products (yes/no per pattern, pricing model) when there are several → **reply** naming the product's design stance |
| **Moodboard** ("Make a moodboard for") | text; reads Are.na, Dribbble | Reference links: **References**. A direction in words: **Are.na** + **Dribbble** (or Behance), 8–10 works each. Each part places its own **picks**. | The parts' **picks** are the board, with one anchor work recommended → **reply** with Palette, Type, Texture, Composition and Avoid. No sheet or list. |

### Marketing
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **Competitor landscape** ("Map the competitors of") | text | **Players** (research): who competes, funding, audience. **Pitch** (research): each competitor's hero headline and pricing. Both report only. | **sheet** landscape (Company, Positioning, For, Starts at, Free plan, capabilities, Raised) → **list** "How they pitch" (headlines verbatim) → **reply** naming the opening |
| **Campaign plan** ("Plan a launch campaign for") | text; ask first: product, audience, date, budget | **Channels** (research), only when the audience isn't obvious | **plan** from today to a week after launch (dated steps, launch-day milestone, cost) → up to 3 **draft** launch posts (X, LinkedIn, email) → **reply** |

### Manager
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **Plan my day** ("Plan my day") | none; reads Calendar, Gmail, Slack | `day_sources` first (asks once where the day lives), then one part per app in parallel: **Calendar, Gmail, Slack, Linear, GitHub, Notion**, plus `list_tasks` | **plan** for the rest of today in time ranges (events, plus focus blocks between them) → **list** checklist (≤15, most urgent first, linked to each source) → **reply** ("4 meetings, 6 things to do") |
| **Weekly status** ("Write my weekly status from Linear, GitHub and Slack") | none; reads Linear, GitHub, Slack | **Linear**, **GitHub**, **Slack** in parallel, last 7 days, report only | **draft** status (Shipped / In progress / Blocked / Next week) → **list** "Needs attention" only when something is blocked → **reply** with counts |

### Student
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **Learning path** ("Make me a learning path for") | text | **Courses** (research), **Books** (research), **Videos** (browser on YouTube) | one **picks** per part (courses, books, videos) → **plan** of weeks (milestone per week, each pointing at its material, tickable) → **media**: the best first lecture, playing in place → **reply** |
| **Exam prep** ("Help me prepare for my exam in") | text; ask first: course, date, time per day | `search_notes` first (the person's notes), then **Syllabus** and **Past papers** (research) | **plan** of daily sessions to exam day (hardest first, mock exams 2–3 days before) → **picks** of material → **list** "Practice questions" (10 with answers) → **reply** |

### Office
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **Inbox triage** ("Triage my inbox") | none; reads Gmail | **Gmail** (browser or mail connection): unread and last 3 days, ≤40 messages, report only | **list** "Needs you" (≤15, most urgent first) → up to 3 **draft** replies → **reply** ("3 need replies today, 14 can be archived") |
| **Meeting prep** ("Prepare me for my next meeting") | none; reads Calendar, Gmail | **Calendar** first (finds the meeting and attendees), then **Mail** + **Slack** (past month's threads) + **People** (research, outside attendees only). They start together when attendees are already named. | **picks** of outside attendees → **list** "To raise" (≤7) → **reply** naming the one thing to settle |

### Founder
| Workflow | Needs | Parts | Result |
|---|---|---|---|
| **Market map** ("Map the market for") | text | **Players** + **Segments** (research). A narrow market needs only Players. | **diagram** map: a layer per segment (≤6), a logo node per company (≤24) → **sheet** of facts sorted by raised → **reply** naming the gap |
| **Pricing research** ("Research how competitors price") | text | **No parts.** One `web_search`, then each vendor's own pricing page read with `web_fetch`, all in one turn | **sheet** one row per product (model, free plan, entry, business, annual discount) → **plot** of entry prices (only when 4 or more) → **reply** recommending a price |
| **Investor list** ("Find investors for") | text; ask first: space, stage, round, location | **Funds** + **Angels** (research) | **picks** of the best 6–10 fits, the strongest recommended → **sheet** only for more than 10 → **reply** saying where to start |

### Skills with no start tile (the lead loads them itself)

`research` (a cited answer: web_fetch the known page first, else 2–4 searches; research parts for
wide topics; result shaped by what was found), `compare-and-choose`, `trip-planning`,
`system-design`, `explain-a-subject`, `job-search`, `today-from-my-messages`, and
`show-what-you-can-do`, used when the request names no task and gets one finished piece of real
work, never a list of abilities.

A person can add their own skill in `<data dir>/skills/<profile>/<name>/SKILL.md`. Its frontmatter
holds a name, a one-line description, and optional tools and model role (`lead`, `page` or
`light`). It overrides a built-in skill of the same name, and skills can be turned off in
Settings.

---

## 7. The pattern every workflow shares

1. **Ask first, only if it changes the outcome:** one question with options.
2. **Read in one turn, in parallel:** one part per place the facts live, each named for its service
   or purpose.
3. **Parts report, the lead builds:** most skills end each brief with "report in the digest and place
   nothing", so the lead builds every object from the digests. The exceptions are the ones whose
   result *is* the finds: moodboard and learning-path picks.
4. **Result boxes in a fixed order per skill:** the main object first (plan, list, sheet, diagram,
   picks), then supporting objects (diffs, drafts, code, media), then the **reply** on top.
5. **Honest gaps:** a source that couldn't be read shows its fix on its own row, and nothing on the
   canvas stands in for it.
6. **Anything outward-facing is held:** sending, posting, paying and deleting go through the app's
   Confirm, never the AI alone.
