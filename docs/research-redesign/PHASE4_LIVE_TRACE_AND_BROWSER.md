# Phase 4: live research trace and source browser

Date: 5 November 2026. Upstream commit: `7ccc28ff1cb102aba69ef4415fee266b8239fa0d`.

## Live research trace

The backend now records what a run does, in one append-only file per research at `state/research/traces/<research id>.jsonl`. It is separate from the research store because every store write takes a backup, which takes about 1.5 seconds. A tracing error is logged and never affects the run.

| Event | Recorded when | Where |
|---|---|---|
| `phase`, `waiting`, `writer`, `writer_failed`, `plan`, `section` | The saved research state changes | `ResearchTrace.request_changes`, called from `artifacts.request_state` |
| `search`, `source` | Each search starts and returns; sources are reported as each search returns | `research_learning.py`, `search()` |
| `read` | A page is read in full (Quick depth only; Detailed depth uses the text the search returns) | `read_collected_evidence` |
| `images` | Image preparation starts and ends | `search()` |
| `phase: complete` | The report is published | `publish_prepared` |
| `source_added` | The person uses Add to Work | `add_work_source` |

- **Reading:** `GET /api/research/{id}/trace?after=N`. The page reads by sequence number, so reconnects, repeats and out-of-order hints all work the same way.
- **Live hint:** a `research_trace` message on the existing WebSocket says more exists. The page also polls every 3 seconds during a run.
- **Privacy:** only observable actions are recorded. Section headings are kept; section focus notes and draft text are not. Credentials are redacted and text is bounded.
- **Authority:** the saved report decides what is finished. A trace event can only prompt a fresh look at it.
- **Not recorded:** research made before this change has no trace, so its canvas shows only the sources it saved. Follow-up sections are not traced stage by stage. Model reasoning is never recorded.

## Canvas

Trace events become Zephium's own run steps, so lanes, statuses, the source list and the agent marker are the existing components. `research-trace.ts` turns events into step lines, shown with Zephium's `Trail` component. Each lane still shows one website, and at most 6 lanes are drawn; the rest stay in the Sources list.

## Source browser

`BrowserWindow.svelte` hosts Zephium's `pane/BrowserPane.svelte`. Zephium paints a native webview into the pane. A browser build has only an iframe, so that goes in the hole.

| Protection | How |
|---|---|
| The page can't reach AEGIS | Cross-origin iframe; the app, its backend and private addresses are refused on the page and again on the backend using the real DNS answer |
| Limited page powers | `sandbox` without top navigation, downloads or modals; camera, microphone, location, USB, payment and clipboard read are denied |
| No identity sent | `referrerpolicy="no-referrer"`; `credentialless` gives the page throwaway storage, without the person's cookies for that site (Chromium) |
| No proxy | The page loads straight from its own site. `GET /api/research/frame-check` returns only a verdict from the response headers and never reads the body. |

### Platform limits

- **Back and forward** cover addresses this window opened itself. Browsers do not let a page read or drive a cross-origin frame's history, so the window cannot see links followed inside the page. It says so when it notices a page has moved. Reload returns to the address shown.
- **Sites that refuse framing** (for example GitHub) show a notice with Open in browser and, for a report source, the saved copy. If a site's rules can't be read in advance, the page is tried and a hint explains a blank result.
- **Signed-in pages** appear signed out, because of `credentialless`. This is deliberate.
- **`credentialless` is Chromium only.** Other browsers ignore it, and pages there would see that browser's cookies for the site. Only Edge was tested.
- **A native desktop shell** could use an isolated webview, with real history. That is not built.

## Reused Zephium code

`BrowserPane.svelte` and its imports, including `pane-geometry`, `FavIcon`, `IconButton` and `Button`, are copied unchanged except for these recorded patches (`upstream/MANIFEST.json`):

- Showing the page depends on the phase, not a native hole
- Slot for the iframe, stacking, and a minimize control
- A further window opens stepped from the first
- Stays inside a narrow canvas
- Escape closes only the window in use

Reused under MPL-2.0; notices are in `work-canvas/NOTICE.md`. `BrowserWindow.svelte` is AEGIS code that adapts it. Messages changed: "Open in browser", "Enter a web address", "Source browser".

## Reference gap

The two screenshots this phase names, `image(20261105-171406).png` and `Screenshot 2026-11-05 181218.png`, were not found in `UI Design` or the usual folders. The window was checked against Zephium's code and the earlier screenshots, by eye.
