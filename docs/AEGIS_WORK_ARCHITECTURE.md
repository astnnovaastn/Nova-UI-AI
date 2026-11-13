# AEGIS Work: architecture

A work run adds a lead and specialist workers on top of the existing research store. The Reader, Edit, Sources, Media, Library and conversation aren't replaced: a run publishes an ordinary research report, so they all work as before.

## Path of a run

```
Composer or card
  → POST /api/work/runs                  reserves a research entry; run id = research id
  → durable job queue, action work_run   survives restarts; Stop, Tasks and Retry work
  → WorkOrchestrator                     stages below, checkpointed one by one
  → ResearchArtifacts.save + publish     the normal report
Canvas reads GET /api/research/{id}/trace?after=N and GET /api/work/runs/{id}
```

| Stage | Who | What it records |
|---|---|---|
| `plan` | Lead | Request received, intent, mode, plan, assignments, or one question |
| `discover` | Worker A, plus the search tool | Queries, each source, quality scores, pages read |
| `analyze` | Worker B, up to 3 parallel branches | Findings with source IDs; the knowledge map for structured runs |
| `verify` | Worker C | A verdict per claim, and gaps |
| `fill_gaps` | Worker A's search tool and Worker B, Deep only | One bounded extra round |
| `write` | Lead | Result, citation check, one repair if needed |
| `publish` | No model | Images, media, report |

## Which models run

| Mode | Workers | Model calls in a normal run |
|---|---|---|
| Direct | None | Lead plans and writes |
| Quick | Discovery only, when the web is needed | Lead, Worker A, lead |
| Deep | All three | Lead, A, B per branch, C, B again for gaps, lead |
| Structured | Discovery if needed, analysis, verification | As Deep, plus the map, with no gap round |

A workflow card sets the mode. For a typed prompt, the lead picks the smallest mode that does the job. Workers can't start other workers or spend outside the run's budget.

## Files

| Part | Where |
|---|---|
| Typed contracts and answer schemas | `astra_ai/core/work/contracts.py` |
| Slots, adapters, rate window, circuit breaker, retries, fallback | `astra_ai/core/work/providers.py` |
| The 20 workflows and budgets | `astra_ai/core/work/catalog.py` |
| Durable run files (`state/work/runs/<id>.json`) and daily count | `astra_ai/core/work/store.py` |
| Lead and workers | `astra_ai/core/work/orchestrator.py` |
| Routes | `astra_ai/ui/backend/api/work.py` |
| Canvas: agent cards, map cards, Open panel | `work-canvas/src/AgentCard.svelte`, `BlueprintCard.svelte`, `MapGroupCard.svelte`, `NodePanel.svelte` |
| Canvas: run data and map layout | `work-canvas/src/work-run.ts`, `knowledge-map.ts` |
| Upstream patches, recorded with reasons | `work-canvas/scripts/sync-upstream.mjs`, `upstream/MANIFEST.json` |

Small changes to existing files: `action_jobs.py` (allows `work_run` 600 seconds), `server.py` (wiring), `api/research.py` (Retry understands work runs), `workspace_gateway.py` (paired windows can reach `/api/work`), `ResearchWorkspace.tsx` and `WorkCanvasHost.tsx` (bridge).

## Rules it keeps

- **Citations:** a worker's unknown source ID is dropped. A report citing unknown sources gets one repair, then any remaining unknown markers are removed and counted in the log. A report with no citations despite having evidence publishes as partial.
- **Untrusted text:** every model is told that retrieved and pasted text is data, not instructions. This reduces prompt injection but can't rule it out. Workers have no tools that act on anything: they only return JSON.
- **Events:** only observable actions are recorded. The lead's one-sentence public summary is the only model prose in the log, besides worker summaries. Model reasoning isn't requested or stored.
- **Secrets:** text passes through the existing `safe()` redaction. Provider errors carry only a kind, such as `http_503`.
- **Canvas view:** Remove and Choose write only `canvas_view` on the research entry. Reports, sources and citations aren't touched. Permanent deletion stays in the Library.

## The four node actions

| Action | Request | Agent | Map node | Source lane | Paper |
|---|---|---|---|---|---|
| Open | What it did, made, sources, steps | Its assignment, report and steps | Its summary and cited sources | Source window | Reader |
| Ask | Conversation, naming the card | Same | Same | Same | Same |
| Choose | Marked; used by the next message or task | Same | Same | Same | Same |
| Remove | Hidden after confirming; restorable from Report views | Same | Same | Same | Same |

Keyboard, on a focused card: O, A, C, Delete. Selecting several cards shows a bar with Ask, Choose and Remove.

Ask goes through the existing Gemini Live conversation. The message carries the card's ID, the run ID and the descriptive text the page already shows. The bubble shows only the question and the card's name.

## Layout

The request and source lanes come from Zephium's own stage layout. AEGIS adds Discovery over the lanes, the other specialists to their right, then the lead and the paper. A knowledge map sits under them. It uses `knowledge-map.ts`, a small deterministic layered layout: groups by how they connect, cards ordered to reduce crossings. Unit tests check that nothing overlaps.

elkjs stays out. It would add about 0.9 MB and an EPL-2.0 dependency, and AEGIS needs real cards with toolbars rather than a drawn diagram.

## Older research

Research without a run record draws as it always did, with no agent cards. Its cards still have Open, Ask, Choose and Remove. Nothing is invented for it.

Voice- and classic-screen-started research still uses the older `/api/research` path. If no lead model is configured, the canvas falls back to that path too.
