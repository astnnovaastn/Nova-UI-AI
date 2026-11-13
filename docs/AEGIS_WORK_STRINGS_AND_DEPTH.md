# AEGIS Work: semantic strings, construction hand, model cap and Deep depth

Added 2026-11-09 for `UI Design/AEGIS_Claude_Research_Strings_Animation_Master_Prompt.md`. See `AEGIS_WORK_ARCHITECTURE.md` for the run itself.

## File map

| Part | Where |
|---|---|
| Relation contract (types, endpoint rules, ids) | `astra_ai/core/work/relations.py` |
| Recording relations, model cap, sectioned Deep writing | `astra_ai/core/work/orchestrator.py` (`_relate`, `_admit`, `_write_sections`) |
| Cap enforcement inside fallbacks | `astra_ai/core/work/providers.py` (`ModelRouter.call(admit=...)`) |
| Deep budget (12 calls, 200k tokens) | `astra_ai/core/work/catalog.py` |
| Backend tests | `astra_ai/ui/backend/tests/test_work_relations.py` |
| Relations → strands | `work-canvas/src/relations.ts` |
| Strand rendering | `work-canvas/src/StrandEdge.svelte` (registered by a patch in `scripts/sync-upstream.mjs`) |
| Strand inspector | `work-canvas/src/StrandPanel.svelte` |
| Status dots | `work-canvas/src/status.ts`, `StatusDot.svelte` |
| Layout policies | `work-canvas/src/layout-policy.ts` |
| Construction hand | `work-canvas/src/construction.svelte.ts`, `HandOverlay.svelte` |
| Host wiring | `work-canvas/src/AegisWorkHost.svelte` |
| Unit tests | `work-canvas/tests/semantic-strings.test.ts` |
| Live end-to-end test | `frontend/tests/work-strings.live.cjs` (spends real quota) |
| Playback test on a saved run, no spend | `frontend/tests/work-replay.e2e.cjs "<library search>"` |
| Left-to-right composition | `work-canvas/src/semantic-layout.ts` |
| Routing strings around cards | `work-canvas/src/route.ts` (used by `StrandEdge.svelte`) |
| Layout unit tests | `work-canvas/tests/spatial-layout.test.ts` |
| Layout and connection test on a saved run, no spend | `frontend/tests/work-layout.e2e.cjs "<library search>" <folder> [--drag]` |

No new dependencies. elkjs stays out.

## Semantic strings

Every string a new run draws is a relation the backend recorded in `RunState.relations`. Each relation has an id, a type, two object references, a label, a status, the `event_seq` of the trace event that created it, and an optional source ID and URL. The same action recorded twice is one relation. Malformed relations are logged and dropped, never drawn.

| Type | From → to | Recorded when |
|---|---|---|
| `plans` | request → agent:lead | The plan is made |
| `assigns` | agent:lead → agent:role | A worker gets a task |
| `searches` | agent → query:n | A web search finishes; a failed search is `failed` |
| `found` | query:n → source:S# | A found source is kept as evidence |
| `reads` | agent → source:S# | A thin page is opened in full; `failed` if it could not be |
| `evidence` | source:S# → agent:analysis | Findings are extracted from the source |
| `verifies` | agent:analysis → agent:verification | Claims are checked; `contested` if any were |
| `delivers` | agent:role → agent:lead | A finished worker's results go to the lead |
| `cites` | source:S# → report | The report cites the source; `verified` or `contested` from the verdicts |
| `writes` | agent:lead → report | The report is published |
| `supports`, `relates` | source → map node, map node → map node | The knowledge map is built |

The canvas resolves each reference to the card that shows it:

- The request and its queries go to the request card.
- A source goes to its lane, or to the sources list if it has no lane.
- An agent goes to its card.
- The report goes to the paper.
- A map node goes to its own card.

A relation whose two ends land on one card, or whose end has no card, isn't drawn, but the inspector keeps it. Up to three relations between two cards are drawn as three parallel strands that share their ends and part in the middle. Beyond three, strands group by type and carry a truthful count, such as "5 searches". Only one strand per bundle carries a label.

Clicking a strand, or pressing Enter on it, opens the inspector and outlines its two cards. The inspector shows what each relation means, its status, the event number that recorded it, and a button to open its source.

Look: thin neutral strings, green only when active or verified, amber dashed when contested, red dotted when failed. The only glow is a small meniscus and a pin of light where a string meets a card. Active strings carry fine travelling light, which stops under reduced motion.

Older runs, saved before relations existed, keep their previous lines and placement.

## Status dots

| Dot | Meaning |
|---|---|
| Gray ring | Not started |
| Blue, pulsing | Working or reading |
| Amber ring with a dot | Waiting, or needs review |
| Green | Complete |
| Red square | Failed or blocked; never shown green |

Agent and map cards use these dots. A map node citing no source shows amber.

## Spatial layout (added 2026-11-09, `AEGIS_Claude_Spatial_Layout_Connection_Fix.md`)

A relation-aware run arranges itself, left to right, with no model call:

1. **The request**, with its search lists and its research steps under it.
2. **The sources it opened**, in the order they were retrieved (by their first evidence record, S1, S2, …), down a column of three and then on to the next column. This order is never a ranking. The list of every retrieved source sits under them.
3. **The workers** that read the sources, then **AEGIS** on the top band. The request's line to AEGIS runs above the sources, never through them.
4. **The report**, with the knowledge map beside or under the run (see Layout policies).

The same record always gives the same places. A new source only adds a slot after the last one, so cards already placed stay put; only the columns to its right step over when a new column opens. While a run you are watching grows, those cards travel there frame by frame, with their strings attached.

**Captions:** a source's name stands directly above its card, on the card's left edge, in a band the layout reserves. The status ("Done") stays at the card's top right. The node's box is now exactly the card, because the caption no longer sits in a hidden 168 px column on the left. So every string meets the card's own border. Work runs saved before relations existed keep their side caption.

**Moving a source card:** grab its caption strip. The name itself opens the source list, and the windows open pages, as before. A moved card is saved as the person's and survives a reload. (Saving a move used to fail with "Invalid node constraint" whenever the saved record named a card that was no longer on the canvas. The organizer now drops those before saving.)

**Routing:** a string whose curve would pass through another card or caption follows the free band over the cards instead, then the gutter beside the card it reaches, with rounded corners. The route is computed in canvas coordinates from where the cards are now, so it holds at every zoom and follows a dragged card.

**Auto Arrange is gone:** the button, its settings popover, Preview, Arrange now and the mode choice. The organizer still exists, only to save what the person moves, pins or resizes, and it no longer arranges a relation-aware run by itself.

**Saved arrangements:**

- A record the person arranged keeps every position.
- From a record the automatic organizer wrote, only what the person moved, pinned or resized is kept, and the rest follows the composition. This is why the three Deep runs from 2026-11-09 now open composed instead of scattered.
- Work runs saved before relations existed are untouched. Classic reports are composed (see below).

Known limits: a string that runs right to left, such as AEGIS reading a source that has no card of its own and so lands on the Sources list, keeps a plain curve and can cross cards. Only single-request canvases are composed; a canvas with follow-up requests keeps the previous placement.

## Spatial architecture V4 (2026-11-09)

**Stages:** request (its searches and steps under it, follow-up requests below it) → sources → each worker rank → AEGIS → report → each follow-up report.

- A worker's stage comes from the run's dependencies: the longest chain of forward relations (`found`, `evidence`, `verifies`, `delivers`, `supports`) that reaches it from the request. This is `rankAgents` in `semantic-layout.ts`.
- Control relations that point back (assigns, reads, searches) don't set stages.
- A worker with no relations yet stands where its role puts it: analysis at stage 2, verification at stage 3.

**Visible density:**

- At most four cards or stacks per column.
- A fifth starts another column of the same stage, about half a stage corridor further right.
- No column is padded with cards to fill it.
- Source cards are site stacks: the canvas already groups a site's pages into one card. It still shows at most six sites, with the rest in the Sources list.

**Midline:**

- Every stage is centred on one shared midline, the middle of the tallest column.
- A lone card (AEGIS, a single analysis) sits level with its neighbours' middle.
- Two or three cards spread above and below it as balanced branches.
- The request column stays top left.
- The full Sources list hangs under the first source column, outside the centring, so it never pulls the midline down.

**Spacing:** clear space between card edges, in canvas units at 100%.

| Mode | Between stages | Before the report | Between cards |
|---|---|---|---|
| Quick | 150 | 170 | 56 |
| Deep / Structured | 176 | 200 | 64 |

Busy runs (more than 8 sources or 2 workers) get 24 more between stages and 8 more between cards.

**Strings:**

- Every string takes a trunk-and-branch route.
- A short hop runs along its source's height to a trunk 56 units in front of its target column, then branches into the card. Strings fanning out from one card share that trunk.
- A string crossing more than one corridor merges first, beside its own column, then crosses in the corridor chosen by its target alone, so all strings into one card share it.
- Corners are rounded at radius 26.
- Strings carry no words. A selected string shows its label, and the inspector still lists every relation.
- Strings that run against the reading order (AEGIS assigning, reading, searching) are drawn at 45% opacity.

**Follow-ups:**

- A classic canvas with follow-up requests is composed too: requests stacked in the first column, sources by request then retrieval, and each report in its own column.
- Each request's strings go to its own sources and its own report (`query:N`, `report:<paper id>`, source keys prefixed `N.`).
- A Work run's follow-ups record no relations of their own yet, so those canvases keep their placement.

**First view:** fits the whole composition, down to 29%.

**Tests:** `tests/staged-layout.test.ts`, and the V4 checks in `frontend/tests/work-layout.e2e.cjs` (at most four per column, wide corridors, no words on strings).

## Graph layout, classic reports and source stacks (2026-11-09, `AEGIS_Claude_Intelligent_Research_Graph_Layout.md`)

**Which canvases are composed:** every single-request canvas whose strings can be read from a record:

- Work runs, from `run.relations`.
- Classic research reports (no Work run), from the report itself, in `src/classic-relations.ts`:
  - `found`: the request found each source the report lists, and each page the run opened.
  - `cites`: only sources the report's text names with `[S#]`.

  Nothing else is drawn, because a classic report records no agents or evidence links. The inspector says where the string came from: "Read from the report's own source list and citations."

Canvases with follow-up requests, and Work runs saved before relations existed, keep the previous placement.

**Why not ELK:** the layers are semantic (request, sources, workers, AEGIS, report), and relations resolve onto shared cards. A query and a request are the same card, for example, so a generic layered engine sees cycles and orders cards by graph shape instead of retrieval order. The layered placement here is about 150 lines, deterministic, and adds no 1.4 MB dependency. Crossings are reduced by the zones, by keeping the request-to-AEGIS line on its own band, and by routing.

**Measured sizes:** the steps list, request card, sources list and worker cards are laid out at the height they are really drawn, measured in canvas units and only ever growing, so the layout settles.

**No overlaps, ever:** after saved places are applied, a collision pass (`clearOverlaps`) steps any card that is not the person's down its column until it is clear. Cards the person placed never move.

**Source stacks** (`src/stacks.ts`): the canvas already groups the pages a run opened on one site into one card. Its caption now shows "4 pages":

- Clicking it opens the stack into one card per page, in the order they were opened.
- The first card keeps the stack's id, so saved places and strings carry over.
- Each page card has its own strings, and clicking its window opens that page.
- "Stack pages" closes it again.
- Presentation only: pages keep their ids, URLs and citations, nothing is duplicated, and pages past 12 stay behind the last card.
- Which stacks are open is remembered per research in this browser.
- Hover no longer fans a stack's windows over its neighbours.

**Strings:**

- They anchor to the card's own border, not to the canvas's handle centre, which sits about 3 units outside it.
- Strings that run right to left take a route around their own cards and everything between.
- Strings into the same card choose the corridor nearest that card, so they share one trunk.

**Bundle ids:** a bundle's id is its relation ids when they fit in the canvas's 128-character limit, and otherwise a stable digest. The old code cut ids at 180 characters, so the canvas silently dropped any bundle between 129 and 180 characters.

**First view:** the run's first view fits the whole composition, down to 35% (it was 50%, which cut the request off the left of wide runs).

**Read-only check:** `?aegis-fresh-layout` in the URL shows a run as composed, ignoring its saved arrangement, and saves nothing.

**Rollback:**

1. In `scripts/sync-upstream.mjs`, remove the last four patches: the `stack` field, the stack toggle, no hover fan, and the 35% first view. Run `node scripts/sync-upstream.mjs`.
2. In `AegisWorkHost.svelte`, set `classicRun` to `false`. Classic reports then fall back to their previous lines and placement.
3. Run `npm run build`.

The new modules have no other callers.

## Layout policies

The policy is picked from the recorded mode, with no model call:

- **Quick:** tight spacing.
- **Deep:** roomier spacing. Source lanes stay capped at six, with the rest in the sources list, so the canvas never becomes one tall column.
- **Structured:** roomier spacing, and the knowledge map goes beside the run or below it, whichever keeps the whole canvas closest to the screen's shape.

Spacing widens slightly when a run has many sources or workers. A saved arrangement always wins over the policy. Older runs keep their old spacing, so nothing is rearranged when it is opened.

## Construction hand

The hand plays back what a live run adds after the canvas opened:

1. Cards come left to right, and each is followed by the strings that join it to cards already placed.
2. A card stays hidden until the hand reaches it. The hand presses and the card grows in.
3. The hand draws each string along its curve, from port to port.

Pacing and limits:

- A trip takes 240 to 720 ms, depending on distance and on the chosen speed (0.75× to 2×, which is remembered).
- More than ten waiting steps are batched. The hand keeps the last four cards and their strings, up to 14 steps, and the rest appear together in one fade.
- Pause, Skip and Replay sit in the top-right corner of the canvas.
- Any pointer, wheel or key input ends the playback at once, and new arrivals show instantly for 1.5 seconds afterwards.
- Reduced motion shows everything with no hand.
- A reload rebuilds the canvas from the record and replays nothing.

The hand only changes when things are shown. It never delays the backend, a save or the person.

## Four-model cap

A run uses at most four distinct models, the lead included. `AEGIS_WORK_MAX_MODELS` can lower the cap but never raise it. Retries and fallbacks count toward the cap.

Before every attempt, the router asks the run whether that model is allowed. A fallback that would add a fifth model is skipped in favour of a model the run already uses. If no such model is usable, the run fails with `work_model_model_cap`. `usage.distinct_models` lists the models a run used. Keys never leave the backend.

## Deep Research depth

**Cause of the short pages:** `_write` asked one lead answer, capped at 10,000 tokens, to hold the whole report. Persistence, serialization and the Reader didn't cut anything: the Reader renders the stored text in full.

**The fix:** a Deep run with three or more body sections and at least four sources writes its body in batches of two sections.

- Each batch gets the sources matched to its headings, with no model call, and up to 7,000 tokens per section.
- A batch that hits the output limit is rewritten one section at a time.
- One more call writes the frame: executive summary, key findings, contradictions, limitations and conclusions.
- Each finished batch is saved, so a pause or restart never pays for it twice.

The app then assembles the report:

- **Contents.**
- **Scope and methodology:** facts from the run record.
- **Bibliography:** every retrieved source, marked as cited or not cited, and noting any page that couldn't be opened.

Unknown citations are removed. A `quality` stage records sections planned and written, sources cited and retrieved, unresolved citations and word count. Missing sections mark the report partial and are named under Limitations.

## Strings, collections and video discovery (2026-11-10)

- **Strings** (`work-canvas/src/StrandEdge.svelte`, `route.ts`): between facing ports a string is one S-curve (`facingCurve`) that leaves and enters horizontally, so strings from one port fan out like branches. Only when that curve would cross a card does it take a corridor route, drawn with S-bends (`smoothPath`) instead of elbows; `routeAround` now also tries turning further into a corridor when the gutter beside a port is blocked. Cards stacked in one column join bottom-to-top, or by a bracket along their left edges when cards stand between. Each end has a port dot coloured by the card's kind (`TONES`), and the line blends between the two colours. Status still shows as dashed (contested) or dotted (failed).
- **Direction and control** (`relations.ts`): a bundle that mixes coordination with research flow points the way the work flows (a worker that delivered back is drawn worker → AEGIS). Bundles made only of `plans`, `assigns` and `searches` are `control` and stay hidden until one of their cards, or the string, is selected.
- **Sources gallery removed** in composed runs: it repeated the source stacks and the Search card. A source with no stack resolves to the Search card (`part:<request>:search`).
- **Images and Videos collections** (`collections.ts`, `CollectionCard.svelte`, type `collection`): paper sheets built from the report's own `image_items` and its saved video search (`media`). Their relations (`illustrates`, `collects`, `includes`) are derived from that saved data and marked `detail.derived`. They hang under AEGIS, in the column before the report. A finished video search with nothing found shows no sheet; a failed one shows its reason and a "Search for videos again" button (`actions.findVideos`, the existing more-media job).
- **Video discovery** (`research_learning.py`): SerpAPI YouTube search first; when it is out of quota, unavailable or unconfigured, the same query goes to Tavily and then Exa, restricted to `youtube.com`, keeping only watch pages. Each video records its `provider`. Tests are in `astra_ai/ui/backend/tests/test_video_discovery.py`.
- **Hand**: trips take 460–1250 ms (were 240–720), strings draw in 880 ms (was 520), moves use smootherstep with a slight bow (`glide`).

### Revision (same day): white strings, box-to-box routing

The user preferred the original look. Strings are white again (green while active, amber or red when in doubt), with the glowing meniscus and pin of light where they meet a card; the colour gradients and coloured dots are gone. A string to a card more than one column away now goes box to box (`passThrough` in `route.ts`, `viaCards`): in each column it crosses, it enters the nearest card's left port and leaves its right port, so far strings merge into the pipeline instead of crossing the canvas. Images and Videos are their own column (Images above Videos) between AEGIS and the report. The hand places cards column by column, top to bottom, and traces each string's real drawn path (`drawMsFor` keeps the draw and the hand in step).
