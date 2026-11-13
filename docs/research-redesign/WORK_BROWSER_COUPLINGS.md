# Work browser and native couplings

Each dependency is classified as **not needed**, **replace with AEGIS adapter**, or **requires explicit approval**. Counts come from the traced import graph; see `WORK_FILE_INVENTORY.md`.

The core set (canvas, composer, lift and board projection) calls 43 generated native commands. The full workspace calls 135.

| Upstream dependency | What it does | Classification | AEGIS replacement |
|---|---|---|---|
| `shared/ipc/bindings.ts` | Generated Tauri commands | Replace with AEGIS adapter | Same exports, backed by FastAPI |
| `shared/ipc/native-events.ts` | Events from Rust | Replace with AEGIS adapter | Backed by the existing `/ws/voice` messages |
| `workCall`, `workOperation`, `workOperationStatus` | Run and canvas commands | Replace with AEGIS adapter | `/api/research`, `/api/jobs` |
| `workActivity` | Current activity | Replace with AEGIS adapter | Recorded research phases |
| `events.workChanged`, `events.workEnvironmentChanged` | Live updates | Replace with AEGIS adapter | `job_progress`, `research_status`, `research_ready`, `research_refresh` |
| Canvas layout saving | Stored in Rust | Replace with AEGIS adapter | Per-window `sessionStorage` first; a backend route needs approval |
| `domain/resources` media URLs | Privileged local media route | Replace with AEGIS adapter | `/api/research/{id}/images/{image}`, fetched with the client header |
| `noteCall`, `domain/notes` | Notes | Replace with AEGIS adapter | `/api/notes` |
| `resourceCall`, `features/tasks` | Tasks and owned objects | Replace with AEGIS adapter | AEGIS tasks API, or hide in the first version |
| `voiceStart`, `voiceStop`, `domain/voice` | Native dictation | Replace with AEGIS adapter | AEGIS Gemini Live microphone flow |
| `keymap*`, `domain/keymap`, `runCommand` | Native shortcuts | Replace with AEGIS adapter | Small in-page version |
| `browserOpenUrl` | Opens a link | Replace with AEGIS adapter | AEGIS source reader, or a new browser tab |
| `domain/favicons` | 32×32 icons from Rust | Replace with AEGIS adapter | Favicon URLs saved with each source |
| Page frames (`pageFrameUrl`) | Screenshots of pages an agent browsed | **Requires explicit approval** | See below |
| `workHuman*`, `domain/work-human` | Handing a live page to the person | Not needed | AEGIS does not drive live pages |
| `pane/BrowserPane`, `pane/TakeoverPane`, `workPane*` | Native page beside the canvas | Not needed | AEGIS source reader in a panel |
| `domain/tabs`, `OpenTabsChip`, `WorkTabPicker` | Browser tabs | Not needed | Removed |
| `domain/surface`, `domain/layout`, `app/browser` | Browser shell | Not needed | AEGIS host |
| `domain/account`, `account*` | Zephium account and billing | Not needed | AEGIS has no such service |
| `workModels*`, `ModelPicker`, provider keys | Choosing a model | Not needed | AEGIS settings stay in charge |
| `workConnections*`, MCP | External connections | Not needed | Out of scope |
| `workPickFolder`, `workAdmitFolder`, `work_computer` | Local folder and command access | Not needed | Would widen AEGIS permissions |
| `WindowControls`, `fullscreen.svelte.ts` | Native window | Not needed | Not reachable from the AEGIS host |
| Rust crates | Agent runtime | Not needed | AEGIS Python backend keeps this role |

## Decision needed: website preview cards

In Zephium, the website cards show real screenshots because its agent browses pages in native webviews. AEGIS fetches page text over HTTP and has no such screenshots, so those cards were empty in the proof of concept.

| Option | Result | Cost |
|---|---|---|
| A. Fill the card with the source's saved image, plus title and excerpt | Real data, no new service, not a page screenshot | One upstream card needs a small adapter |
| B. Capture real screenshots with a headless browser on the backend | Closest match to the reference | New backend service, more privacy and security review |

Option A is recommended first. Option B is backend infrastructure, so it requires approval under the master prompt.

## Decision needed: live helper branches

AEGIS can fan out to four subquestions, but stored sources do not record which subquestion found them. Lanes can already be drawn per source, as in the proof of concept. Lanes per subquestion would need a small additive backend change, which also requires approval.
