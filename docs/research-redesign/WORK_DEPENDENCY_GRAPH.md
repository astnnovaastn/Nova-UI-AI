# Work dependency graph

Generated from a static import trace of upstream commit `7ccc28ff1cb102aba69ef4415fee266b8239fa0d`, starting at `WorkEnvironmentWorkspace.svelte`. Numbers on arrows count imports between modules; links with fewer than 3 imports are hidden. File-level detail is in `WORK_FILE_INVENTORY.md`.

| Set | Files | Lines | Native commands |
|---|---:|---:|---:|
| Full workspace | 462 | 92,500 | 135 |
| Core: canvas, composer, lift, board projection | 308 | 62,433 | 43 |

External packages, with the number of importing files: @hugeicons/core-free-icons (211), svelte (130), @hugeicons/svelte (22), @tiptap/core (11), @tiptap/pm (11), @xyflow/svelte (10), bits-ui (7), @tauri-apps/api (4), elkjs (2), marked (2), @tiptap/extension-document (1), @tiptap/extension-paragraph (1), @tiptap/extension-text (1), @tiptap/extension-heading (1), @tiptap/extension-bold (1), @tiptap/extension-italic (1), @tiptap/extension-strike (1), @tiptap/extension-code (1), @tiptap/extension-blockquote (1), @tiptap/extension-bullet-list (1), @tiptap/extension-ordered-list (1), @tiptap/extension-list-item (1), @tiptap/extension-code-block (1), @tiptap/extension-horizontal-rule (1), @tiptap/extension-hard-break (1).

## Imports between modules

```mermaid
flowchart TD
  domain_native_browser["domain/native-browser"]
  domain_other["domain/other"]
  domain_work_["domain/work*"]
  features_notes["features/notes"]
  features_tasks["features/tasks"]
  session["session"]
  shared_ipc["shared/ipc"]
  shared_lib["shared/lib"]
  shared_platform_ts["shared/platform.ts"]
  shared_ui["shared/ui"]
  work_lib["work/lib"]
  work_ui["work/ui"]
  work_ui_bar["work/ui/bar"]
  work_ui_board["work/ui/board"]
  work_ui_cards["work/ui/cards"]
  work_ui_objects["work/ui/objects"]
  work_ui_other["work/ui/other"]
  work_ui -->|78| work_lib
  work_ui_other -->|49| work_lib
  work_ui_board -->|45| work_lib
  work_ui_objects -->|44| work_lib
  work_ui_cards -->|42| work_lib
  work_ui_other -->|41| shared_ui
  domain_other -->|39| shared_ipc
  work_lib -->|34| shared_ipc
  work_ui -->|32| shared_ui
  work_ui_bar -->|31| shared_ui
  features_tasks -->|31| shared_ui
  work_ui_cards -->|25| shared_ui
  work_ui_objects -->|25| shared_ui
  work_lib -->|22| shared_ui
  work_ui_board -->|22| shared_ui
  work_ui -->|18| work_ui_other
  features_tasks -->|18| domain_other
  domain_other -->|16| shared_lib
  work_ui -->|16| work_ui_cards
  work_ui_other -->|14| work_ui_cards
  domain_work_ -->|13| shared_ipc
  features_notes -->|13| shared_ui
  work_ui_other -->|13| shared_ipc
  work_lib -->|12| domain_other
  features_tasks -->|12| shared_lib
  domain_work_ -->|11| shared_lib
  work_ui_bar -->|11| domain_other
  work_ui -->|10| work_ui_bar
  domain_native_browser -->|10| shared_ipc
  work_ui_bar -->|9| work_lib
  work_ui_bar -->|9| shared_ipc
  work_ui -->|8| shared_ipc
  features_notes -->|8| domain_other
  work_ui -->|7| shared_lib
  work_ui -->|5| domain_work_
  work_ui -->|5| domain_other
  domain_native_browser -->|5| shared_lib
  work_ui_other -->|5| domain_work_
  work_ui -->|4| domain_native_browser
  domain_other -->|4| shared_platform_ts
  shared_ui -->|4| shared_lib
  work_lib -->|4| domain_work_
  features_notes -->|4| shared_lib
  work_ui -->|4| work_ui_board
  work_ui_board -->|4| work_ui_cards
  work_ui -->|3| session
  work_ui -->|3| work_ui_objects
  session -->|3| shared_ipc
  domain_native_browser -->|3| domain_other
  work_ui_bar -->|3| shared_lib
  work_ui_other -->|3| domain_native_browser
  work_ui_other -->|3| domain_other
  work_ui_cards -->|3| domain_other
  work_ui_objects -->|3| work_ui_board
```

## Zephium at runtime

```mermaid
flowchart LR
  Rust["Rust runtime"] -->|workChanged, workEnvironmentChanged| Session["WorkEnvironmentSession and Context"]
  Session -->|workCall| Rust
  Session --> Projection["features/work/lib projection"]
  Projection --> Canvas["WorkCanvas"]
  Canvas --> Host["WorkEnvironmentWorkspace"]
  Bar["WorkBar"] --> Host
  Host -->|workCall| Rust
  Line["AgentLine"] -->|workActivity| Rust
```

## Proposed AEGIS runtime

```mermaid
flowchart LR
  FastAPI["FastAPI research API"] -->|document, sources, media| Adapter["AEGIS adapter"]
  Socket["/ws/voice events"] -->|job_progress, research_status, research_ready| Adapter
  Adapter -->|WorkExecutionFact| Projection["Upstream projection"]
  Projection --> Canvas["Upstream WorkCanvas"]
  Canvas --> Host["AegisWorkHost"]
  Bar["Upstream WorkBar"] --> Host
  Host -->|onPrompt, onStop, onSourceOpen| React["React WorkCanvasHost"]
  React -->|POST /api/research, live_text| FastAPI
  React --> Panels["Existing Reader, Edit, Sources, Media"]
```
