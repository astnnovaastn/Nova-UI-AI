# Architecture decision gate

Status: **Option A approved by the owner on 5 November 2026 and built.** See `IMPLEMENTATION_REPORT.md` for what shipped. The plan below is kept as the record of the decision; where the build differs, the report is correct.

## Options, with evidence

| | A. Svelte island in React | B. Isolated app in an iframe | C. React port |
|---|---|---|---|
| Upstream code reused | Core set of 308 files, 62,433 lines, nearly unchanged | Same | Logic only; about 130 Svelte components rewritten |
| Proven | Canvas and composer ran outside native code with 0 errors | Not tried | Not tried |
| CSS isolation | **Must be solved.** Unscoped CSS changed 27% of AEGIS elements | Automatic | Automatic |
| Sharing with AEGIS | Direct | Message passing for voice, theme, popups and sessions | Direct |
| Future upstream updates | Practical | Practical | Very hard |
| Fidelity to the reference | High | High | Depends on the rewrite |
| Extra build | A second Vite 8 build | A second Vite 8 build | None |

## Recommendation: Option A

Mount Zephium's canvas as a Svelte island, built separately with Vite 8 and loaded only when Research opens. AEGIS's Vite 6 build stays as it is.

**Fallback:** if CSS scoping cannot be solved cleanly in the first Stage 2 step, switch to Option B. The bridge code is the same either way.

## Rust decision

No Rust for this work. The Work interface runs without it, AEGIS's Python backend already does the research, and Rust is not installed here. A Tauri desktop app remains a separate product decision. Zephium's Rust would not be the reason to choose it.

## Layout

```text
astra_ai/ui/frontend/
├─ work-canvas/                    New package with its own Vite 8 build
│  ├─ upstream/                    Copied MPL-2.0 files, original structure, LICENSE
│  ├─ adapter/
│  │  ├─ bindings.ts               Replaces $shared/ipc/bindings
│  │  ├─ native-events.ts          Replaces $shared/ipc/native-events
│  │  ├─ research-to-run.ts        AEGIS report to WorkExecutionFact
│  │  └─ media.ts                  Authenticated report images
│  └─ AegisWorkHost.svelte         Replaces WorkEnvironmentWorkspace.svelte
└─ src/components/Research/
   └─ WorkCanvasHost.tsx           React mount, behind an on/off setting
```

## React-to-Work contract

```ts
type WorkHostProps = {
  report: Report | null;
  phase: string;
  theme: "dark" | "light";
  onPrompt(text: string): void;       // POST /api/research or a follow-up
  onStop(): void;                     // Job cancel
  onSourceOpen(sourceId: string): void; // Existing source reader
  onNodeSelect(id: string | null): void;
  onViewChange(view: CanvasView): void;
  onActivity(label: string): void;
  onError(message: string): void;
};
```

## Source reuse plan

Detail per file is in `WORK_FILE_INVENTORY.md`. All upstream files are MPL-2.0.

| Upstream path | Destination | Method | Browser coupling | Validation |
|---|---|---|---|---|
| `features/work/components/WorkCanvas.svelte`, `CanvasNode`, `WorkEdge`, `AreaNode`, `AgentMark`, `CanvasControls`, `SelectionBar` | `upstream/` | Direct copy | None | Pan, zoom, selection |
| `features/work/components/cards`, `board`, `objects`, `run`, `lift`, `presence` | `upstream/` | Direct copy | Page frames, favicons | Card rendering, including failures |
| `features/work/lib/**` | `upstream/` | Direct copy | None in the projection code | Upstream unit tests |
| `features/work/components/bar/WorkBar`, `BarTool`, `BlocksPanel`, `AttachPanel` | `upstream/` | Direct copy | Voice, keymap through adapter | Submit, stop, focus |
| `features/work/components/Lift`, `LiftHeader` | `upstream/` | Direct copy | None | Open, Escape, focus return |
| `features/work/components/AgentLine.svelte` | `upstream/` | Adapter | `WorkSession` | Real phases, stop |
| `domain/work`, `domain/work-context` | `upstream/` | Adapter where needed | Native commands | Upstream tests |
| `shared/ui/**`, `shared/lib/**`, `styles/**` | `upstream/` | Direct copy, scoped CSS | None | Themes, reduced motion |
| `shared/ipc/bindings.ts` | `adapter/bindings.ts` | Replace, keeping types | Tauri | Unknown commands fail loudly |
| `shared/ipc/native-events.ts` | `adapter/native-events.ts` | Replace | Tauri | Live updates |
| `features/work/components/WorkEnvironmentWorkspace.svelte` | `AegisWorkHost.svelte` | New, using its structure | Heavy | Full flow |
| `pane/*`, `domain/tabs`, `domain/account`, `ModelPicker`, connections | Not copied | Excluded | Heavy | Build has no such imports |

`features/notes` and `features/tasks` are decided during copying: replaced through the adapter if the note and task cards are kept, or left out in the first version.

## AEGIS data mapping

| AEGIS | Work fact |
|---|---|
| `query` | `spec.request` |
| `phase` | Run status and activity label |
| `sources[]` | `read` steps, citations, `evidence_collection` |
| `report` | `answer` artifact |
| `image_items[]` | Picture subjects |
| `media` | Media cards |
| `extensions.blocks[]` | Further runs on the same canvas |
| `pages[]` | Runs on the same canvas |
| `research_id` | Work and canvas ID |
| `failures[]`, `waiting_reason` | Failed or waiting steps, shown truthfully |

## Activity pill mapping

| AEGIS phase | Pill text |
|---|---|
| `queued` | Waiting |
| `collecting_sources` | Searching |
| `comparing_evidence` | Comparing |
| `preparing_report` | Writing |
| `preparing_layout` | Preparing a result |
| `waiting_for_quota` | Waiting, with the real reason |
| `complete` | Done |
| `failed` | Failed, with Retry |

## Risks

| Risk | Measured | Plan |
|---|---|---|
| CSS clash | 26.9–27.5% of AEGIS elements changed by unscoped CSS, worst case | Do not load `browser.css`. Prefix the rest at build time under one root class, then measure again. Target: 0 changed outside Research |
| Bundle size | 1.28 MB gzipped JavaScript, about 0.9 MB of it elkjs | Load on opening Research. Leave out diagrams at first |
| Popups portal to `body` | Not measured | Portal into the scoped root; test Bits UI menus |
| Two UI frameworks | About 54 KB gzipped CSS, Svelte runtime | Accepted for Option A |
| Long reports in one card | Not tested | Keep the AEGIS reader in a panel; answer card shows the opening |
| Voice-control protocol | Not tested | Keep `data-aegis-widget="research"` and existing controls reachable |
| Upstream test harness used directly | Proof of concept only | Production gets its own host; tests stay out of the bundle |

## Build order after approval

1. CSS scoping test, the go or no-go for Option A.
2. Copy the core set and record it. Mount the empty canvas behind a setting.
3. Open saved research, with real sources and images.
4. Composer sends real prompts, the pill follows real phases, stop works.
5. Reader, Edit, Sources, Media, attachments and history in panels, reusing the current React code.
6. Save positions and viewport; AEGIS rail, Memory and Dashboard; themes.
7. Screenshot comparison, accessibility, performance, regression tests.
8. Make the canvas the default only after all of that passes.

The current Research screen stays available behind the setting until the owner decides otherwise.
