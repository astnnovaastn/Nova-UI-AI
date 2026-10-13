# Follow-up widget and vision acceptance checks

Use a separate test profile. Keep real user notes, calendar events, credentials, and tasks intact. Use clearly named temporary records and remove only those records afterward.

For each widget, verify normal, loading, empty, invalid-input, provider-error, offline, reconnect, and persisted-reload states. Repeat representative flows in Dark, Light, Forest, Ocean, Copper and Terminal. Check keyboard focus, readable labels, icons, placeholders, selection, and disabled controls. Newly opened widgets must inherit the current theme and any saved overrides.

| Widget | Functional acceptance |
| --- | --- |
| Notes | Create, edit, autosave, reopen, search, export and delete a temporary note; verify AI uses the intended note context. |
| Search | Submit a query, display sources, navigate history, restore a result, handle no results, and reject stale responses from an older query. |
| News | Generate a briefing, inspect sources, continue research, restore history, change layouts and recover from provider failure. |
| Image | Upload a supported image, preview it, analyze it, generate/edit/download output, and handle unsupported files and provider errors. |
| Weather | Resolve a location, refresh current conditions, display forecast/radar and units, and handle unavailable location or weather data. |
| Tasks | Create/edit a temporary task, validate dates and dependencies, run/pause/cancel where supported, review progress, and preserve state after reconnect. |
| Calendar | Create/edit/delete a temporary event, exercise views and recurrence, verify timezone and reminders, and preserve the event after reconnect. |
| Vision-guided actions | Confirm the AI sees the intended image or widget context; test ambiguous targets, stale context, unsupported actions, and permission failures. Confirm destructive actions retain their existing approval safeguards. |

Runtime checks: disconnect the backend during a read and an edit; verify recovery never repeats a message or mutation with uncertain delivery. Restart while widgets are open and drafts are unsaved. A provider authentication or quota failure must show guidance without a restart loop. A muted microphone must remain muted.

Record each result, browser console errors, relevant server errors without credentials, and the exact temporary record affected. Broader widget feature repairs are a separate follow-up from Theme Studio and runtime recovery.

Current repeatable checks:
- Backend regressions: `.venv\Scripts\python.exe -m pytest "astra_ai/ui/backend/test_backend file" -q --basetemp logs/pytest-followup`
- Theme controls in an isolated browser: `node scripts/test_theme_browser.cjs`
- Real runtime restart in an isolated browser: `node scripts/test_runtime_browser.cjs`
- Browser scripts currently use the installed Windows Edge executable; test themes are cleaned up and the original default is restored.

- Palette/offline browser checks: `node scripts/test_theme_palettes.cjs`
- Bounded recovery with simulated provider failures: `node scripts/test_recovery_browser.cjs`

Verified in this change: 66 backend regressions; 81 frontend unit tests; Theme Studio CRUD/import/export/undo/redo/calendar overrides; rejected default saves; all 16 palettes with all seven primary widget roots open; real backend process replacement while preserving the browser and Notes; muted recovery; provider-error classification and bounded recovery. Broader feature flows in the table above still require the follow-up pass.
