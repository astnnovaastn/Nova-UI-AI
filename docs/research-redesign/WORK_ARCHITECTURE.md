# Zephium Work architecture

Upstream commit `7ccc28ff1cb102aba69ef4415fee266b8239fa0d`. Traced from source; paths are relative to `frame/src` unless noted. Parts marked *not traced* have not been read in detail.

## Runtime boundaries

| Layer | Technology | Location |
|---|---|---|
| Work interface | Svelte 5 runes, TypeScript, component-scoped CSS | `features/work` |
| Canvas engine | `@xyflow/svelte` | Used by `features/work/components/WorkCanvas.svelte` |
| State stores | Svelte runes classes | `domain/work`, `domain/work-environment` |
| Native bridge | Generated Tauri bindings | `shared/ipc/bindings.ts`, `shared/ipc/native-events.ts` |
| Agent runtime and storage | Rust | `crates/zephium-app/src/work*`, `crates/zephium-agent-*`, `crates/zephium-core/src/work` |

The Work interface is **not** written in Rust. Rust owns durable state, agents, permissions and browsing. In the traced Work code, only `bindings.ts` and `native-events.ts` touch Tauri directly.

## Component tree

```text
app/browser/WorkWorkspace.svelte              Browser shell mount (not reused)
└─ WorkEnvironmentWorkspace.svelte            3,245 lines, tied to the runtime (replaced)
   ├─ top/WorksMenu.svelte                    Title and work switcher
   ├─ AgentLine.svelte                        Floating activity pill
   ├─ WorkCanvas.svelte                       Grid, pan, zoom, selection
   │  ├─ CanvasNode.svelte                    Dispatches to cards, boards, objects
   │  ├─ AreaNode.svelte                      Grouped areas
   │  ├─ AgentMark.svelte                     Moving agent presence
   │  ├─ WorkEdge.svelte                      Connector lines
   │  ├─ CanvasControls.svelte                Zoom percentage and fit
   │  └─ SelectionBar.svelte                  Actions on selected cards
   ├─ Lift.svelte + LiftHeader.svelte         Item opened in the centre
   │  └─ lift/RequestLift, lift/SourcesLift
   ├─ pane/BrowserPane.svelte                 Native browser pane (not reused)
   └─ bar/WorkBar.svelte                      Floating composer
      └─ bar/BarTool, BlocksPanel, TasksPanel, AttachPanel, ModelPicker, VoiceView
```

## Data flow

```text
Rust runtime
  │  commands.workCall(...)  events.workChanged, events.workEnvironmentChanged
  ▼
WorkEnvironmentSession + WorkEnvironmentContext
  │  WorkEnvironmentSnapshot, WorkRuntimeProjection (executions, steps, artifacts)
  ▼
Pure projection code in features/work/lib
  │  environmentStages, environmentRequests, environmentItems, environmentBoards,
  │  environmentParts, environmentSources, environmentAgents, organizeExecution
  ▼
CanvasItem[] + CanvasLink[] + positions
  ▼
WorkCanvas props
```

The projection code is plain functions over plain data. That is what makes reuse possible: it does not care where the facts came from.

## How a run becomes a board

A `WorkExecutionFact` holds:

- `spec.request`: what the person asked
- `steps[]`: `search`, `read`, `publish`, `finish` and more, each with a status
- `artifacts[]`: published results such as `answer`, `document`, `table`, `comparison_matrix`, `evidence_collection`, `chart`, `diagram`, `code`
- `provider_evidence[]`: citations

`organizeExecution` decides which results get placed on the canvas. Lanes, source rows and result blocks are then derived from those facts.

## Activity line

`AgentLine.svelte` (1,309 lines) reads a `WorkSession`, `currentActivity` from `domain/work`, and `commands.workActivity`. Labels come from `messages/en.json`: Thinking, Searching, Reading, Checking, Recovering, Comparing, Writing, Waiting.

## Persistence

Zephium stores positions, viewport and elements in Rust through `WorkEnvironmentSession`, using revisions. `docs/agent-work-persistence.md` describes the contract. It has not been traced line by line.

## Build requirements

| Need | Detail |
|---|---|
| Node | Repository asks for 24; the proof of concept built and ran on 26.13 with the engine check off |
| Vite | `@sveltejs/vite-plugin-svelte` 7.2.0 needs Vite 8 |
| Messages | `paraglide-js compile` generates `shared/i18n` before any build |
| CSS | Tailwind 4, tokens in `styles/tokens.css`, component-scoped CSS |

## Proof of concept

Built in a temporary copy, not in AEGIS or the reference clone. Source and screenshots are in `logs/research-redesign/spike/`. Report text was not copied into `logs/`.

A saved AEGIS report (15 sources, 6 images) was turned into a `WorkExecutionFact` and drawn by upstream `BoardCanvas.svelte` (a test harness) and `WorkCanvas.svelte`, with `WorkBar.svelte` above it.

| Measure | Result |
|---|---|
| Page errors | 0 |
| Native commands reached during the checks | 0 |
| Nodes and connectors, finished report | 12 and 16 |
| Mount time on this PC | 158–184 ms, using a Vite development build |
| Zoom, pan, composer submit | All passed in Edge |
| Dark and light themes | Both rendered |
| Upstream files changed | 1 (`board-fixtures.ts`, two `export` keywords, proof of concept only) |
| Production JavaScript, all chunks | 1.28 MB gzipped, about 0.9 MB of it two lazily loaded elkjs chunks for diagrams |
| Production CSS | 54 KB gzipped |

### What the proof of concept did not test

- Live updates from a running research job. The running stage used a saved report with its status set by hand.
- The upstream `AgentLine`. The pill in the screenshots is a placeholder.
- Composer tools, opening items in `Lift`, and saving positions.
- Running inside the AEGIS page. It ran on its own page.
- Long reports. Only the opening of the answer card was checked visually.
