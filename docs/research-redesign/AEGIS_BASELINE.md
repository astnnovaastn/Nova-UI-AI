# AEGIS baseline before the Research redesign

Captured 5 November 2026, before any Research Workspace code changed.

## Stack

| Area | Current state |
|---|---|
| Frontend | Vite 6, React 19, TypeScript, plain CSS, in `astra_ai/ui/frontend` |
| Backend | FastAPI on port 8340, supervised by `scripts/nova_runtime.py` on port 8341 |
| Research UI | `src/components/Research/ResearchWorkspace.tsx` (4,729 lines) and `ResearchWorkspace.css` (2,151 lines) |
| Research API | `astra_ai/ui/backend/api/research.py`, `research_api.py`, `document_api.py`, `collaboration.py` |
| Research logic | `astra_ai/core/research_learning.py`, `research_model.py`, `research/artifacts.py`, `research/providers.py`, `research/storage.py` |
| Durable jobs | `astra_ai/core/action_jobs.py` |
| Storage | `state/research/catalog.json` and `state/research/conversations/<session>/pages/<page>/` |
| Rollback | No `.git` in this working copy. The owner keeps the GitHub copy current. |

## Test results

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` (in `astra_ai/ui/frontend`) | Passed |
| Production build | `npx vite build --outDir <temporary folder>` | Passed, with the existing large-chunk warning |
| Frontend unit tests | `node --test` over all 25 `*.test.mjs` files | 174 tests: 165 passed, **9 failed** |
| Backend tests | `python -m pytest` with `NOVA_STATE_DIR` pointed at a temporary folder | 984 passed, 1 skipped, 5 deprecation warnings |

### Frontend failures that already existed

These fail before any redesign work, so they are not caused by it. Their causes have not been investigated.

- a late history request cannot overwrite a newer response
- a removed saved selection clears cleanly while an unknown entry remains retryable
- failed listing shows an error and releases the loading state
- failed restore keeps recovery feedback and releases its busy state
- hover pauses remaining time, queued notices follow, duplicates do not replay
- notice enters for three seconds, exits, and never cancels work
- removing the last entry on a later page returns to the last available page
- successful restore submits the recovery token and refreshes the saved list
- working timer and skeleton reflect real processing, never a quota pause

**Gate for later work:** the backend must stay at 984 or more passing, and the frontend must not fail any test outside this list.

## Baseline screenshots

Saved in `logs/research-redesign/baseline/`, which is ignored by Git because the screens show private research titles:

- `baseline-dashboard-1440.png`
- `baseline-research-1440.png`
- `baseline-research-390.png`
- `baseline-memory-1440.png`

## Research flows to preserve

| Flow | Current implementation |
|---|---|
| Start research | `POST /api/research`, then a durable `search_web` job |
| Open report | `GET /api/research/{id}/document` |
| History | `GET /api/research`, `PATCH .../history`, delete, restore, archive |
| Reader | `ReportContent`, with `/reader` pages and citations |
| Edit | `DraftEditor`, using Tiptap and Yjs over `/ws/collaboration` |
| Sources | `report.sources`, `GET .../sources/{id}?view=reader` |
| Media | `GET` and `POST .../media`, `Video` |
| Attachments | `DocumentAttachments.tsx`, `document_api.py` |
| Conversation | Gemini Live `live_text` over `/ws/voice`, `GET .../conversation` |
| Follow-ups and pages | `POST .../expand`, `POST .../pages` |
| Export | `GET .../export` as Markdown, HTML, PDF and DOCX |
| Selection context | `SelectionContext.tsx`, sent through `ui_context` |
| Private fallback consent | `POST .../fallback-consent` |

## Constraints found

- `tests/research.test.mjs` and `tests/research-history.test.mjs` extract named functions from `ResearchWorkspace.tsx` by parsing that file. Moving those functions breaks the tests.
- Report images need the `X-Nova-Client` header, so a plain `<img src>` cannot load them.
- Tabs are hidden rather than unmounted, which keeps the editor and reading position alive.
- The AI controls the interface through `aegisWidgetProtocol.ts` and `data-aegis-widget="research"`. This protocol must be checked before any control is renamed.
- Recorded research phases: `collecting_sources`, `comparing_evidence`, `preparing_report`, `preparing_layout`, `waiting_for_quota`, `waiting_for_report`, `complete`, `failed`.
