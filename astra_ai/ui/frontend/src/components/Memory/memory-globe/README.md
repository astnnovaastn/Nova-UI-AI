# Nova integration

The supplied production globe is mounted in Settings → System Info → Memory. Nova uses the shared four-color category palette, scoped real-data snapshots, full detail retrieval, disabled idle pulses, and the existing conversation and library rails. See `docs/supplied_memory_globe_integration.md` at the repository root for the applied patches. The package documentation below describes its original standalone defaults.

# Memory Globe

A self-organizing 3D globe that shows everything the AI remembers about the user: dots are memories,
hubs are categories, strings are the reasons memories connect. No dependencies except React for the wrapper.

## Files
| File | Purpose |
|---|---|
| `globeEngine.ts` | The renderer and interaction engine (canvas 2D, no UI or framework code) |
| `memoryAdapter.ts` | Turns the backend memory JSON into a graph and decides where memories connect |
| `memoryTypes.ts` | Types for the raw memory schema and the graph model |
| `MemoryGlobe.tsx` | React component: canvas, hover label, click detail panel, stats line |
| `index.ts` | Public exports |
| `dev/demoGraph.ts` | Synthetic data for testing density. Not for production |

## Use
```tsx
import { MemoryGlobe, buildGraph } from "./memory-globe";

const data = buildGraph(rawLongTermJson);           // your backend schema
<div style={{ height: "100vh" }}>
  <MemoryGlobe data={data} onReady={(engine) => { globeRef.current = engine; }} />
</div>
```

## Live API (on the engine from `onReady`)
- `setData(graph)`: full rebuild. Layout is deterministic: same data gives the same globe.
- `addMemory(rawRecord)`: a new dot appears in its category and connects to the most related memories; light travels along the new strings.
- `recall(ids)`: lights the strings from category hubs to the memories the AI just used. Call this when the AI recalls.
- `select(id)`, `clearSelection()`, `search(text)`.

## How connections are decided
| Kind | Source |
|---|---|
| category | memory belongs to a category hub |
| entity | `entity_graph.entities[].member_ids` (relay nodes inside the globe) |
| explicit | `relationships_v3`, `category_definitions.source_record_ids` |
| catalog | `catalog_relationships` (category to category; also decides which categories sit near each other) |
| session | records sharing a `session_id`, chained by time |
| semantic | TF-IDF cosine on label and text; cross-category preferred; capped per node |

`conflicts` and `pending_approvals` give a memory an amber ring ("Needs review").

## Options
- `theme`: `"obsidian"` (default: black, fine grey wires, pink dots) or `"glass"`.
- `ambient`: faint decorative dust inside the globe. It is not data. Default is off for obsidian.
- Categories with more than 70 memories are split into period patches so one category never swallows the globe.
- It lowers quality automatically on slow machines and respects `prefers-reduced-motion`.

## Privacy
The memory JSON is personal data. Fetch it only for the signed-in user, never log record text,
and note that hover shows labels only; full text appears only in the panel after a click.

## Type check
`tsc --strict --noEmit` passes for the engine, adapter, types and dev data. The React wrapper needs `@types/react`.

## Category colours (obsidian theme)
- Each category gets a colour family from `FAMILY_RULES` in `globeEngine.ts` (similar names share a colour, e.g. user data and user preferences are both blue). Unmatched categories get a stable colour from their id.
- Hubs are gray while a category is empty and take the category colour once it holds a memory. A memory with no text is gray.
- Light pulses travelling along strings take the colour of the category they deliver into.
