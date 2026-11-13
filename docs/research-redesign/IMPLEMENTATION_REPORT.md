# Research canvas: implementation report

Date: 5 November 2026. Upstream commit: `7ccc28ff1cb102aba69ef4415fee266b8239fa0d`.

## What was built

The AEGIS Research screen now runs on Zephium Work's actual source code, connected to the real AEGIS research backend. The original screen stays available as a rollback.

| Part | Where |
|---|---|
| Copied Zephium source | `astra_ai/ui/frontend/work-canvas/upstream/` |
| AEGIS adapter and host | `astra_ai/ui/frontend/work-canvas/src/` |
| Built bundle served to the app | `astra_ai/ui/frontend/public/work-canvas/` |
| React connection | `astra_ai/ui/frontend/src/components/Research/WorkCanvasHost.tsx` |

Commands and rollback steps are in `astra_ai/ui/frontend/work-canvas/README.md`.

## Source reuse

| Measure | Count |
|---|---|
| Upstream files copied | 344 (about 67,000 lines) |
| Unchanged | 340 |
| Adapted | 4 (13 recorded patches, plus one message string) |
| Backend source files changed | 0 |
| Rust added | None |

Adapted files, with each change and its reason recorded in `upstream/MANIFEST.json`:

- `WorkCanvas.svelte`: keeps the Svelte Flow credit visible.
- `run/PageFace.svelte`: adds the replaceable preview provider, so cards show the saved image, title and excerpt.
- `AgentLine.svelte`: a paused run states the reason AEGIS recorded.
- `bar/WorkBar.svelte`: the microphone calls AEGIS's Gemini Live voice.

Reused Zephium features include the canvas, dotted grid, connectors, lanes, agent marker, cards, source rows, zoom control, the activity pill and the `composerHole` calculation that cuts the curved notch.

Tauri was replaced underneath, so the generated `bindings.ts` is unchanged. elkjs was left out because AEGIS produces no diagrams, which also cut about 0.9 MB of download.

Built size: 416 KB of gzipped JavaScript across all chunks, with 216 KB loaded first, and 268 KB of gzipped CSS including the Inter font. It loads only when Research opens.

## Test results

| Check | Command | Before | After |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | Passed | Passed |
| Production build | `npx vite build` | Passed | Passed |
| Backend | `python -m pytest` with a temporary `NOVA_STATE_DIR` | 984 passed, 1 skipped | 984 passed, 1 skipped |
| Frontend unit tests | `node --test` | 165 of 174 | 165 of 174, the same 9 failures |
| Canvas unit tests | `npm test` in `work-canvas` | None | 35 of 35 |
| Real-app UI checks | `node tests/research-canvas.e2e.cjs` | None | 60 of 60 in Edge, 3 of them simulated and labelled |

The 9 frontend failures were already there before this work and are listed in `AEGIS_BASELINE.md`. Their causes have not been investigated.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Left rail outside the canvas, rounded shell | Met | UI check, screenshots |
| Dashboard, Memory, Research in the rail; old top controls gone | Met | UI checks |
| Curved composer, icon order, placeholder, microphone on the right | Met against the Zephium screenshots | UI checks, screenshots |
| Composer starts a real research request | Met | Real jobs created through `POST /api/research` |
| Pill and statuses reflect real work | Met | Real runs showed Thinking, Searching, Comparing, Writing, real waiting reasons and failure |
| A real run completes on the canvas | **Not verified** | See below |
| Source cards show real saved data | Met | Excerpts and favicons; images where a source has one |
| Nodes, connectors, pan, zoom | Met | UI checks |
| Saved reports open and render fully | Met | Reader reached the Sources section; 900 px scroll |
| Existing features and data intact | Met | Regression results above, classic screen check |
| Responsive and keyboard | Met, with limits below | 390 px screenshots, keyboard checks |
| No browser migration or Rust rewrite | Met | |
| Visual comparison evidence | **Partly met** | Compared with the Zephium screenshots only |

## Known limits

**No real run finished during testing.** Three real attempts were made on 5 November (two new runs and one retry). All three stopped at the writing stage: Gemini returned HTTP 503, and Groq's output was often rejected with `invalid_citations`. Starting, live stages, waiting, failure, Stop and Retry were all seen on real runs. The change from running to finished was only tested with a simulated response, in which a saved report was made to look unfinished and then restored. Opening reports that finished earlier was tested for real.

**Primary mockup not compared.** The AEGIS mockup that the Phase 2 specification names as the primary reference is not in `UI Design`. Only the Zephium screenshots were compared, by eye, not pixel by pixel.

**Sources appear when the report publishes.** During a run, the canvas shows the request, the real stage and "The answer is on its way…". The backend deliberately hides sources until publication, per the research plan's "no premature results" rule, so lanes do not grow live as in the reference. Showing collected sources earlier would need a small additive backend change and a decision to relax that rule.

**One lane per website, not per subquestion.** AEGIS does not record which subquestion found which source.

**No page screenshots.** Website cards use saved data, as requested. The provider can be replaced later.

**Hotel, flight and plan cards need structured data.** AEGIS reports are Markdown. Real Markdown tables become table cards, and images become picture cards. Nothing is invented.

**Other reported limits:**

- Multi-page research shows the open page on the canvas; other pages are reached from the Reader's page arrows.
- Saved camera position lasts for the browser tab, and dragged card positions are not saved.
- Follow-up research sections are drawn from the data shape, but no saved report with follow-ups was checked visually on the final build.
- Screen-reader use was not tested with a real screen reader.
- Voice was checked only as far as the button calling AEGIS's microphone event. Real speech was not tested.
- Windows and Edge only. Linux and other browsers were not tested.

## Found along the way, not changed

- **Stuck job:** a "Ballon d'Or" research job has been retrying since October against a SerpAPI quota limit (HTTP 429). It appears in the Tasks count. It can be stopped from the Tasks panel.
- **Gemini outage during testing:** the writing model returned HTTP 503 repeatedly on 5 November.
- **Research can loop without retrying:** in `core/research/providers.py`, once a stage has used the fallback, Gemini is no longer tried for it. If both Groq models have also been rejected, the job keeps rescheduling under the label `gemini_service_unavailable` and sends nothing. One test run did this for about 20 minutes until it was stopped.
- **Event replay on load:** every new window replays about 376 past research events. Before this work, that could send up to about 378 list requests in seconds, on either screen. `ResearchWorkspace.tsx` now merges them into one refresh (2 or 3 per load, measured). The replay itself, in `workspaceSync.ts`, is unchanged.
- **Theme events:** each page load writes a theme event to the sync log, and the log keeps growing.
- **Cut-off titles:** the backend's saved display titles can stop mid-word. The canvas uses the report's own heading when it matches.
