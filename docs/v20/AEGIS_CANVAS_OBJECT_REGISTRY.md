# Canvas object registry

The renderer accepts these approved kinds: answer, document, report, note, draft, code, diff, test, image, video, audio, table, comparison, chart, timeline, calendar, checklist, decision, diagram, knowledge-graph, task and source.

Each object has ID, kind, title, revision, status, optional producing task and source references. Content is inert. Public URLs accept only HTTP(S), without credentials. Unknown kinds receive an informational fallback. Raw script/component names are never evaluated. Long report bodies are preserved.

| Family | Initial dimensions | Presentation and interaction |
| --- | --- | --- |
| Writing | 620 × 480 | Readable prose, source count, Open, contextual Ask |
| Code/diff/table | 620 × 380 | Scrollable code or aligned table; proposed changes remain labeled |
| Image/source/video | 404 × 312 | Contained image or honest missing/live-content fallback |
| Diagram/knowledge graph | 920 × 420 | Dependency layout; keyboard-selectable nodes and related-edge emphasis |
| Planning and other | 380 × 320 | Timeline/checklist rows, chart values, recorded status |

Semantic detail thresholds use hysteresis: compact below .42, summary inside .48–.77, full above .83. Geometry does not change with detail. Focus uses a native dialog with Escape, focus containment and close action.

CanvasNode renders the new objects through a durable sync patch. The existing report and subject-map renderers remain authoritative; extracted code, comparisons and checklists supplement them rather than duplicating the report.

Current limitations: video/audio objects show references rather than native media players; calendar objects are readable event lists, not a calendar-editing integration. Provenance metadata is visible, but a dedicated per-cell citation inspector and revision comparison panel are future work. Source fixtures are explicitly missing-preview examples; they do not fabricate webpage captures.

Tables retain all rows, columns and cell text; the renderer pages 50 rows at a time. Unknown result kinds show an inert informational card. Focused objects can open recorded source URLs through the existing trusted-activation browser controller. Google events can be selected as input, but no calendar writes are implemented.
