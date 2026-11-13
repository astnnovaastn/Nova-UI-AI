# Reference screenshots mapped to source

Reference images are in `astra_ai/ui/frontend/UI Design/`, plus upstream `.github/assets/work.webp`.

## Source of the demo content

Searching the whole upstream repository for "founder trip", "staybook", "flightfinder" and "Two helpers on" returns **zero matches**. The San Francisco trip is demo content, not application code or a fixture. The components drawing it are real. The cards and prices themselves will not appear in AEGIS, which will show real research data.

## Reference images

| File | Shows |
|---|---|
| `Screenshot 2026-11-05 121724.png` | Stage 1: the request, with memory and skill inputs |
| `Screenshot 2026-11-05 121744.png` | Stage 2: helpers working, with questions and live pages |
| `Screenshot 2026-11-05 121807.png` | Stage 3: results, with stays and flights |
| `Screenshot 2026-11-05 121824.png` | Stage 4: the written plan |
| `Screenshot 2026-11-05 120813.png` | The real app, dark, with a usage notice |
| `Screenshot 2026-11-05 122000.png` | The real app, dark, thinking |

## Feature map

Status: **proven** ran in the proof of concept; **source found** located but not yet run; **adapter** needs AEGIS data; **not found** absent from upstream.

| Visual feature | Upstream source | Status |
|---|---|---|
| Dotted grid | `WorkCanvas.svelte:994` (`Background`, gap 20, size 1.5) | Proven |
| Pan and zoom | `WorkCanvas.svelte`, `lib/camera-follow` | Proven |
| Zoom percentage | `CanvasControls.svelte:84` | Proven |
| Connector curves | `WorkEdge.svelte` | Proven |
| Dashed live connector | `WorkEdge.svelte`, `AgentMark.svelte` | Proven with a saved report |
| Agent marker on the line | `AgentMark.svelte`, `shared/ui/presence` | Proven with a saved report |
| Request text and Show all | `cards/RequestText.svelte`, `ObjectiveCard.svelte` | Proven |
| Memory and Skill inputs | `run/InputMark.svelte`, `environmentInputs` | Source found, adapter |
| Helper lanes | `run/PartRow.svelte`, `environmentParts` | Proven, one lane per source |
| Website card frame | `run/PageFace.svelte`, `cards/PageCard.svelte` | Proven without the picture |
| Website screenshot inside the card | `pageFrameUrl`, native capture | Decision needed |
| Working and Done labels | `run/PartRow.svelte` | Proven |
| Source rows | `environmentSources`, `SourcesRail.svelte` | Proven |
| "The answer is on its way…" | Run projection | Proven |
| Answer block | `cards/AnswerCard.svelte`, `board/Document.svelte` | Proven for the opening section |
| Picture cards | `board/Gallery.svelte`, `board/EntityCard.svelte` | Proven with report images |
| Comparison table | `board/Comparison.svelte`, `compare/Compare.svelte` | Source found, needs structured data |
| Flight and plan cards | `objects/FlightCard.svelte`, `objects/PlanCalendar.svelte` | Source found, needs structured data |
| Charts and diagrams | `board/Chart.svelte`, `board/Diagram.svelte` | Source found, needs structured data |
| Make tasks button | `board/MakeTasks.svelte` | Source found, adapter |
| Floating composer | `bar/WorkBar.svelte` | Proven (text field and submit) |
| Composer tools (hand, blocks, tasks, +) | `bar/BarTool.svelte`, host snippets at `WorkEnvironmentWorkspace.svelte:2449` | Source found |
| Activity pill | `AgentLine.svelte` | Source found, adapter. The proof of concept used a placeholder |
| Stop in the pill | `AgentLine.svelte` | Source found, adapter |
| Follow button | `WorkCanvas.svelte` (`followAgent`) | Source found |
| Title menu | `top/WorksMenu.svelte` | Source found, adapter |
| Tasks counter on the right | Host and `TasksPanel.svelte` | Source found, adapter |
| Item opened in the centre | `Lift.svelte` | Source found, not yet run |
| Left icon rail | `features/sidebar`, browser shell | **Browser coupling**. An AEGIS rail replaces it |
| Site tiles on the rail | Browser essentials | **Excluded**, browser feature |
| Zephium name, logo | Not licensed | **Excluded**, AEGIS branding is used |
| Glass window and sky behind it | Native material and `shared/sky` | Not planned: AEGIS runs in a browser window |
| Usage notice | Zephium account | **Excluded**, no such service |

## Structured results need real data

Stays, flights, comparison tables and plans appear in the references because that run produced structured results. AEGIS reports are currently written as Markdown. Showing them as tables, comparisons or charts requires one of the following:

1. Parsing tables and lists already in the Markdown, which is reliable only for content that is already structured.
2. Asking the writing model for structured results as well, which is an additive backend change and uses more quota.

The master prompt forbids invented data, so these blocks will appear only when real data supports them.
