/*
 * AEGIS Work Layout Lab — the component registry.
 *
 * One entry per thing the Zephium Work source can put on, or around, its canvas. Every
 * source path was read in the reference clone (astra_ai/ui/zephium-source, commit
 * 9026a1f); nothing here is inferred from screenshots or marketing material. The
 * inspector and the audit documents are both written from this file.
 */
import type { ObjectKind } from "$features/work/lib/board/types";

export const CATEGORIES = [
  "Workspaces",
  "Layouts",
  "Research",
  "Documents",
  "Developer",
  "Designer",
  "Marketing",
  "Manager",
  "Student",
  "Office",
  "Founder",
  "Media",
  "Connected Services",
  "AI Execution",
  "Diagrams",
  "Canvas",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Group =
  | "workspace"
  | "layout"
  | "object"
  | "block"
  | "card"
  | "run"
  | "ask"
  | "canvas"
  | "start";

export const GROUP_LABEL: Record<Group, string> = {
  workspace: "Example workspace",
  layout: "Layout demonstration",
  object: "Canvas object",
  block: "Legacy board block",
  card: "Canvas card",
  run: "Run element",
  ask: "Ask card",
  canvas: "Canvas system",
  start: "Start screen",
};

export type Strategy = "Direct reuse" | "Logic reuse" | "React port" | "Backend adapter" | "Reference only";
export type AegisClass =
  | "Already implemented in AEGIS"
  | "Implemented but visually different"
  | "Implemented but missing interactions"
  | "Available in Zephium and reusable"
  | "Available but requires React porting"
  | "Requires backend integration"
  | "Not present in the accessible source"
  | "Not suitable for AEGIS";

export type Stage =
  | { kind: "objects"; kinds: ObjectKind[] }
  | { kind: "scene"; scene: string }
  | { kind: "asks" }
  | { kind: "start" };

export type Entry = {
  id: string;
  name: string;
  group: Group;
  categories: Category[];
  /** The type name the source uses. */
  internal: string;
  /** Paths under astra_ai/ui/zephium-source/. */
  source: string[];
  renderer: string;
  schema: string;
  size: string;
  interactions: string[];
  backend: string;
  /** Does it draw in the lab without any backend? */
  local: "Yes" | "Partly" | "No";
  mock: string;
  strategy: Strategy;
  react: string;
  aegis: AegisClass;
  aegisNote: string;
  stage: Stage;
  note?: string;
};

const W = "frame/src/features/work/";
const w = (...paths: string[]) => paths.map((path) => W + path);
const SVELTE = "Svelte 5 component. AEGIS already mounts Zephium Svelte beside React (work-canvas bundle), so it is hosted, not ported.";
const HOSTED = "Hosted as Svelte through the existing work-canvas bundle; a React rewrite is not needed.";

type ObjectSpec = Omit<Entry, "group" | "stage" | "renderer" | "local" | "mock" | "strategy" | "react" | "source"> & {
  kind: ObjectKind;
  file: string;
  more?: string[];
  strategy?: Strategy;
};
const object = (spec: ObjectSpec): Entry => {
  const { kind, file, more = [], ...rest } = spec;
  return {
    ...rest,
    group: "object",
    source: [...w(`components/objects/${file}`, ...more), W + "lib/board/types.ts", W + "lib/board/object-size.ts"],
    renderer: `components/objects/ObjectView.svelte → ${file} (lazy chunk per kind)`,
    local: "Yes",
    mock: "Yes — Zephium's own fixtures (tests/object-fixtures.ts)",
    strategy: spec.strategy ?? "Direct reuse",
    react: SVELTE,
    stage: { kind: "objects", kinds: [kind] },
  };
};

const OBJECTS: Entry[] = [
  object({
    id: "object-reply",
    kind: "reply",
    file: "Reply.svelte",
    name: "Reply",
    categories: ["Research", "AI Execution", "Documents"],
    internal: `ObjectView { kind: "reply" } · wire WorkArtifactDataV1 "reply"`,
    schema: "headline: string; text: string (≤480 chars, **bold** and `code` only); figures: {label, value, note?}[]; points: string[]; more?: DocumentNodeView[]",
    size: "Width 480–680 (ideal 640). Height from line counts: headline 31/line, text 23/line, figures +70, points 30 each.",
    interactions: ["Open (reads on in the centre)", "Pending placeholder while its run works"],
    backend: "None to draw. Produced by the lead's publish step: one per request, placed on top of the result.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS maps its `answer` kind to this renderer (objects/zephium-object.ts) but never fills `points`; figures come only from numeric entries.",
  }),
  object({
    id: "object-picks",
    kind: "picks",
    file: "Picks.svelte",
    more: ["components/objects/PickCard.svelte", "components/objects/FlightCard.svelte", "components/objects/Stars.svelte"],
    name: "Picks",
    categories: ["Research", "Designer", "Student", "Founder", "Marketing", "Media"],
    internal: `ObjectView { kind: "picks" } · 15 facets: stay, flight, product, place, restaurant, job, course, video, repo, service, company, person, event, article, other`,
    schema: "facet; items: { name, subtitle?, picture? | logo?, url?, price?: {display, was?}, facts: {label, value, kind: text|yes|no|partial|rating}[], rating?, why?, tags[], recommended, chosen?, route?, when?, duration?, from?: PickFrom }[]",
    size: "≤5 items stand in one row at 208 px each; more wrap 4 across (232 pictured / 272 plain). Flights are a 440–640 list. Height 148 plain or picture×0.75 + 132.",
    interactions: ["Choose / unchoose a pick", "Compare (lays the set out as a sheet)", "Open a pick's page", "Open in the centre", "Ask about a pick"],
    backend: "Pictures come from the native media store (zephium-media://); logos from the native favicon cache. Choosing writes a user decision to the run.",
    aegis: "Available in Zephium and reusable",
    aegisNote: "AEGIS has no picks-like kind. This is the photo-led card set behind moodboards, learning paths, investor lists and shopping results.",
    note: "The single most visible Zephium object AEGIS is missing.",
  }),
  object({
    id: "object-plan",
    kind: "plan",
    file: "Plan.svelte",
    more: ["components/objects/PlanCalendar.svelte", "lib/board/plan-calendar.ts", "lib/board/plan-ics.ts", "components/board/MakeTasks.svelte"],
    name: "Plan (timeline and calendar)",
    categories: ["Manager", "Student", "Marketing", "Office", "Research"],
    internal: `ObjectView { kind: "plan" } · step kinds: travel, stay, event, task, milestone, note`,
    schema: "steps: { when?, date? (YYYY-MM-DD), title, detail?, kind, cost?, place?, pick?, done? }[]; total?: {label, value}; checkable: boolean; calendar?: boolean",
    size: "Timeline 440–760 (ideal 640), 56 px per step. With dated steps it becomes a calendar at a fixed width (calendarWidth) and a height from its week rows.",
    interactions: ["Tick a checkable step", "Month previous / next (calendar)", "Add to Calendar (exports .ics)", "Make tasks (creates draft tasks)", "Open in the centre"],
    backend: "ICS export calls the native `work_save_calendar` command. Make tasks writes to the Tasks resource. Drawing needs nothing.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS `timeline` and `calendar` use this renderer (V22). Step kind is always `milestone`; cost, place, pick thumbnails and totals are never supplied.",
  }),
  object({
    id: "object-list",
    kind: "list",
    file: "List.svelte",
    more: ["components/objects/Checklist.svelte"],
    name: "List",
    categories: ["Manager", "Office", "Developer", "Designer", "Student", "Connected Services"],
    internal: `ObjectView { kind: "list" } · styles: todo, messages, reading, requirements, questions`,
    schema: "style; items: { title, detail?, due?, priority?: 'high', done?, from?: { host?, app?, who?, when?, quote?, url? } }[]",
    size: "400–640 (ideal 560); questions style 584–920 as cards 280 wide. Rows 40 / 56 with detail / 76 with a source.",
    interactions: ["Tick an item", "Open an item's origin (message, issue, page)", "Open in the centre"],
    backend: "None to draw. `from.host` marks use the favicon cache.",
    aegis: "Implemented but missing interactions",
    aegisNote: "AEGIS `checklist`, `task` and `decision` map here with title/detail/done only. The `from` provenance row (app, who, when, quote, link) and the messages / reading / requirements styles are unused.",
  }),
  object({
    id: "object-sheet",
    kind: "sheet",
    file: "Sheet.svelte",
    more: ["components/objects/TableBlock.svelte", "components/objects/YesNo.svelte", "lib/board/versus.ts", "lib/board/rating.ts", "components/objects/sheet.ts"],
    name: "Sheet (table and comparison)",
    categories: ["Research", "Founder", "Marketing", "Designer", "Documents"],
    internal: `ObjectView { kind: "sheet" } · column kinds: text, number, money, percent, date, duration, yes_no, rating, link, entity, tag`,
    schema: "columns: { label, kind, unit?, currency?, best?: max|min }[]; rows: { cells: string[], entity?: { picture? | logo? }, sources? }[]; note?",
    size: "Width is the sum of its column kinds' widths (entity 208, text 168, money 112 …), capped at 1120. A few named things compared become a facing “versus” layout: 192 + 212 per row.",
    interactions: ["Reveal hidden columns when narrow", "Best value highlighted per column", "Open in the centre", "Edit cells (only on a sheet the person owns: TableBlock)"],
    backend: "None to draw. Editing writes through the owned-object store.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS `table` and `comparison` use this renderer and pass column kinds through. Entity pictures/logos and per-row sources are not supplied.",
  }),
  object({
    id: "object-plot",
    kind: "plot",
    file: "Plot.svelte",
    more: ["components/board/Chart.svelte"],
    name: "Plot (chart)",
    categories: ["Research", "Founder", "Marketing", "Diagrams"],
    internal: `ObjectView { kind: "plot" } · wire styles: bar, bar_horizontal, bar_stacked, bar_grouped, line, area, area_stacked, donut, radial, radar, range`,
    schema: "spec: ChartSpec { kind: bars|stacked|line|area|donut|radial|radar|range, series: { name, points: { x, y, display? }[] }[], headline?, basis?, horizontal? } (shared/ui/data/Chart)",
    size: "360–680 (ideal 520); height 300 plus 40 for a title and 56 for a headline.",
    interactions: ["Hover a mark for its exact value", "Open in the centre (shows the values table)"],
    backend: "None. Values are decimal strings on the wire so the renderer never rounds them.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS `chart` reaches this renderer with bars, line and area only. Donut, radial, radar, range, stacked and grouped styles exist in Zephium and are unused.",
  }),
  object({
    id: "object-diagram",
    kind: "diagram",
    file: "Diagram.svelte",
    more: ["components/board/Diagram.svelte", "components/board/Popover.svelte", "lib/diagram.ts", "lib/diagram-rows.ts", "lib/diagram-route.ts", "lib/diagram-labels.ts", "lib/diagram-worker.ts", "lib/diagram-icons.ts"],
    name: "Diagram (architecture, flow, market map)",
    categories: ["Developer", "Founder", "Diagrams", "Research"],
    internal: `ObjectView { kind: "diagram" } · node kinds: client, edge, gateway, service, worker, model, store, queue, cache, storage, external, other`,
    schema: "diagram: { nodes: { id, name, kind, vendor?, note?, layer? }[]; edges: { from, to, label? }[]; layers: { id, name }[] }",
    size: "Stands at its own drawn width (never scaled to the result), up to 2400 px; the run grows to the right to hold it. Height is the laid-out bounds + 80.",
    interactions: ["Select a node (popover with its note and its flows)", "Related flows emphasised", "Ask about a node", "Open in the centre"],
    backend: "None, but the settled layout runs ELK (elkjs, layered algorithm) in a web worker. Without it only the provisional row layout is drawn.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS `diagram` and `knowledge-graph` use this renderer, but production stubs elkjs out (vite.config.ts `noElk`, licence EPL-2.0), so AEGIS shows the provisional layout. The lab loads elkjs, so here you see the settled one.",
    strategy: "Direct reuse",
  }),
  object({
    id: "object-code",
    kind: "code",
    file: "Code.svelte",
    more: ["components/board/Code.svelte"],
    name: "Code excerpt",
    categories: ["Developer"],
    internal: `ObjectView { kind: "code" }`,
    schema: "language: string (one of CODE_LANGUAGES); text: string; notes: { from, to, text }[]; path?; start?",
    size: "460–720 (ideal 600); 80 + 20 px per line, 16 lines before it opens.",
    interactions: ["Line-range notes beside the code", "Open in the centre", "Copy"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS `code` and `test` use this renderer; line-range notes are never supplied.",
  }),
  object({
    id: "object-diff",
    kind: "diff",
    file: "Diff.svelte",
    name: "Diff (proposed change)",
    categories: ["Developer"],
    internal: `ObjectView { kind: "diff" }`,
    schema: "path; language; summary; hunks: { oldStart, newStart, lines: { op: ctx|add|del, text }[] }[]",
    size: "520–860 (ideal 680); 72 + 20 px per line up to 40 lines.",
    interactions: ["Open in the centre", "Read like a review (old and new line numbers)"],
    backend: "None to draw. In Zephium the change itself is applied by the computer helper only after the person approves it.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS parses unified diffs into this renderer's hunks; applying a change remains out of scope in AEGIS.",
  }),
  object({
    id: "object-document",
    kind: "document",
    file: "Document.svelte",
    more: ["components/board/Document.svelte", "components/board/Prose.svelte"],
    name: "Document",
    categories: ["Documents", "Research"],
    internal: `ObjectView { kind: "document" }`,
    schema: "content: { kind: 'document', paragraphs: string[] (Markdown subset), formatted?: NoteDocument }",
    size: "360–560 (ideal 480); 320 tall on the canvas, the whole text in the centre.",
    interactions: ["Open in the centre (full reading surface)", "Save as note"],
    backend: "Save as note writes through the Notes resource.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS `document`, `report` and `note` render here; the long report itself still opens in the AEGIS Reader.",
  }),
  object({
    id: "object-draft",
    kind: "draft",
    file: "Draft.svelte",
    more: ["lib/draft-send.ts"],
    name: "Draft message",
    categories: ["Office", "Marketing", "Developer", "Connected Services"],
    internal: `ObjectView { kind: "draft" } · destinations: slack, email, linkedin, x, github, message`,
    schema: "destination; to?; subject?; body (Markdown subset, ≤4000); targetUrl?; author?; send?: draft|sending|sent; note?; review?: comment|approve|request_changes",
    size: "420–600 (ideal 520); 120 + 22 px per body line.",
    interactions: ["Edit the words in place", "Send (always held for Confirm)", "GitHub review state: comment / approve / request changes"],
    backend: "Send starts a page task on the destination site and is held by the app's Confirm. Each destination is drawn in that service's shape.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS always maps to destination `message`, so the Slack, email, LinkedIn, X and GitHub shapes are never seen. Sending is not implemented in AEGIS.",
  }),
  object({
    id: "object-media",
    kind: "media",
    file: "Media.svelte",
    more: ["components/objects/PlayMark.svelte", "lib/link-media.ts"],
    name: "Media (image, video, audio)",
    categories: ["Media", "Student", "Designer"],
    internal: `ObjectView { kind: "media" } · media: image | video | audio · provider: youtube | vimeo | file`,
    schema: "media; url; picture?; provider?; poster?; duration?; startSecs?; channel?",
    size: "Image/video 480–720 (ideal 560) at 16:9 plus a caption; audio 320–480 × 72.",
    interactions: ["Play in place (YouTube/Vimeo embed, or a file)", "Open the source page", "Open in the centre"],
    backend: "Images and posters must be admitted by the native media store. Playing an embed loads the provider's player (network).",
    aegis: "Implemented but missing interactions",
    aegisNote: "AEGIS `image`, `video`, `audio` map here with the URL only: no provider, poster, duration or channel, so videos do not play in place.",
    note: "In the lab, playing is not attempted: the lab blocks every external request.",
  }),
  object({
    id: "object-page",
    kind: "page",
    file: "Page.svelte",
    more: ["components/run/PageFace.svelte", "lib/frame-thumbs.ts"],
    name: "Page (browser card)",
    categories: ["Research", "Media", "Designer"],
    internal: `ObjectView { kind: "page" } · canvas item type "page"`,
    schema: "url; title; frame?: string (captured frame address); icon?; live?: boolean",
    size: "320–360 (ideal 336) × width·238/336: a small browser window with its title bar.",
    interactions: ["Open the page in the browser pane", "Live indicator while an agent is on it", "Honest fallback when the capture failed"],
    backend: "The frame is a screenshot captured by Zephium's native browser engine and served from zephium-media://frame/…. AEGIS has no such capture for arbitrary pages.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS source cards use PageFace through a patch that adds a saved favicon and excerpt (preview-provider). True page frames need a capture service.",
    note: "Frames in the lab are generated placeholders, labelled as simulated.",
  }),
  object({
    id: "object-note",
    kind: "note",
    file: "Note.svelte",
    name: "Note",
    categories: ["Documents"],
    internal: `ObjectView { kind: "note" } · canvas resource element`,
    schema: "markdown: string (the note's file contents)",
    size: "280–480 (ideal 360); 48 + 22 px per line.",
    interactions: ["Edit in place (Tiptap editor)", "Open in the centre"],
    backend: "Reads and writes through the Notes resource (zephium-notes crate).",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS hosts Zephium's Notes tools (V21/V22) over its own notes API.",
  }),
  object({
    id: "object-file",
    kind: "file",
    file: "File.svelte",
    name: "File",
    categories: ["Documents", "Developer"],
    internal: `ObjectView { kind: "file" } · file: image | pdf | text | code | other`,
    schema: "name; path?; file; kindLabel?; size?; picture?; lines?; language?",
    size: "240–360 (ideal 280) × 220.",
    interactions: ["Open (WorkFileInspector)", "Reveal in the file manager"],
    backend: "Needs native file access: previews, PDF first pages and system icons come from the desktop host.",
    aegis: "Requires backend integration",
    aegisNote: "AEGIS has no local-file object. Repository excerpts (V20) are the nearest thing and arrive as code.",
  }),
  object({
    id: "object-folder",
    kind: "folder",
    file: "Folder.svelte",
    more: ["components/cards/FolderCard.svelte"],
    name: "Folder",
    categories: ["Developer", "Documents"],
    internal: `ObjectView { kind: "folder" } · reference { kind: "folder", path, name }`,
    schema: "name; path?; count; entries: { name, folder, picture? }[]",
    size: "240–320 (ideal 280) × 180.",
    interactions: ["Open", "Grants a run started here permission to read the folder"],
    backend: "A folder on the canvas is a capability grant admitted by the native app.",
    aegis: "Requires backend integration",
    aegisNote: "No equivalent in AEGIS: there is no folder grant model in a hosted web app.",
  }),
  object({
    id: "object-project",
    kind: "project",
    file: "Project.svelte",
    more: ["components/objects/project.ts", "lib/project-work.ts"],
    name: "Project map",
    categories: ["Developer"],
    internal: `ObjectView { kind: "project" } · produced by the lead tool describe_project`,
    schema: "name; summary; root; stack: { name, host?, version?, role? }[]; tree: ProjectEntry[] (depth ≤3); more?; scripts: { name, command, source? }[]; git?: { branch?, changed, ahead?, behind? }",
    size: "Fixed pieces side by side: folder 296, stack 232, tree 272, scripts 320, 40 apart.",
    interactions: ["Show the whole tree", "Open in the centre", "Stack marks from known hosts"],
    backend: "Rust reads the granted folder exactly (work_lead/project.rs); the model does not write this object.",
    aegis: "Requires backend integration",
    aegisNote: "AEGIS has no project object. Its configured repository inputs could feed one: the data is a manifest read, not AI output.",
    note: "A high-value Developer card: file tree, stack and scripts in one object.",
  }),
  object({
    id: "object-subject",
    kind: "subject",
    file: "Subject.svelte",
    more: ["components/cards/SubjectCard.svelte", "lib/subject-detail.ts"],
    name: "Subject (pull request, issue, thread)",
    categories: ["Developer", "Office", "Connected Services"],
    internal: `ObjectView { kind: "subject" } · tones: active, done, waiting, blocked, closed`,
    schema: "noun; reference?; heading; status?: { label, tone }; people: { role, name }[]; facts: { label, value }[]; labels: string[]; summary?; url",
    size: "440–640 (ideal 560); height from heading and summary lines plus rows for people, facts and labels.",
    interactions: ["Open its page", "Open in the centre", "Ask about it"],
    backend: "Filled from a connection (GitHub, Linear, mail) or a signed-in page read.",
    aegis: "Available in Zephium and reusable",
    aegisNote: "AEGIS has no subject kind. With Google and repository connections already present, an email or PR could be drawn this way.",
  }),
];

const scene = (id: string): Stage => ({ kind: "scene", scene: id });

const WORKSPACES: Entry[] = [
  {
    id: "ws-architecture",
    name: "A · Project architecture",
    group: "workspace",
    categories: ["Workspaces", "Developer", "Diagrams"],
    internal: "skill map-a-project",
    source: ["crates/zephium-app/skills/map-a-project/SKILL.md", "crates/zephium-app/src/work_lead/project.rs", W + "lib/run/layout.ts"],
    renderer: "WorkCanvas + placeRun; objects: project, diagram, code, document, reply",
    schema: "Lab fixture lab/src/fixtures/examples.ts → projectArchitecture",
    size: "One run lane. The diagram spans, so the result grows to its drawn width.",
    interactions: ["Replay", "Select, drag, resize", "Open any object", "Select a diagram node"],
    backend: "In Zephium: a granted folder, describe_project and one computer part.",
    local: "Yes",
    mock: "Invented project “tidewater”",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Requires backend integration",
    aegisNote: "AEGIS can draw the diagram, code and document today; the project map and folder reading need a repository adapter.",
    stage: scene("projectArchitecture"),
    note: "The skill itself places the project map, one diagram and the reply (“no sheet, no document”). The code excerpt and the notes document are added here because the brief asked for a technical explanation and a final document; both are objects Zephium supports.",
  },
  {
    id: "ws-launch",
    name: "B · Product launch",
    group: "workspace",
    categories: ["Workspaces", "Marketing", "Office"],
    internal: "skill campaign-plan",
    source: ["crates/zephium-app/skills/campaign-plan/SKILL.md", W + "lib/run/layout.ts"],
    renderer: "WorkCanvas; three parallel parts with page frames; objects: plan, plan (calendar), list, media, draft ×2, reply",
    schema: "examples.ts → productLaunch",
    size: "Three rows in one column; result packed by boardLayout.",
    interactions: ["Replay", "Tick checklist items", "Turn the calendar's months", "Open the draft"],
    backend: "In Zephium: research and browser parts; drafts are sent only through Confirm.",
    local: "Yes",
    mock: "Invented product “Lumen Notes”",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Available in Zephium and reusable",
    aegisNote: "Every object here except the service-shaped drafts already has an AEGIS kind.",
    stage: scene("productLaunch"),
    note: "The skill itself places one plan, up to three drafts and the reply. The calendar, the checklist and the video are added for the brief; all are objects Zephium supports. The video does not play: the lab is sealed from the network.",
  },
  {
    id: "ws-competitors",
    name: "C · Competitor landscape",
    group: "workspace",
    categories: ["Workspaces", "Marketing", "Founder", "Research"],
    internal: "skill competitor-landscape",
    source: ["crates/zephium-app/skills/competitor-landscape/SKILL.md"],
    renderer: "WorkCanvas; parts Players + Pitch; objects: picks, sheet, plot, list, document, reply",
    schema: "examples.ts → competitorLandscape",
    size: "Two rows; a wide sheet with typed columns.",
    interactions: ["Replay", "Choose a pick", "Reveal sheet columns", "Open the report"],
    backend: "In Zephium: two research parts, report only.",
    local: "Yes",
    mock: "Four invented competitors on .example",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Available in Zephium and reusable",
    aegisNote: "AEGIS lacks picks (the product cards); sheet, plot, list and document exist.",
    stage: scene("competitorLandscape"),
    note: "The skill itself places one sheet, one list (“How they pitch”) and the reply, and says “no picks, no chart unless the person asks; no document”. The product cards, price chart and report are added for the brief.",
  },
  {
    id: "ws-teardown",
    name: "D · UI teardown",
    group: "workspace",
    categories: ["Workspaces", "Designer"],
    internal: "skill ui-teardown",
    source: ["crates/zephium-app/skills/ui-teardown/SKILL.md", W + "components/run/PartRow.svelte", W + "components/run/PageFace.svelte"],
    renderer: "WorkCanvas; one browser part per product whose real pages stand on the canvas as the screens; objects: list, sheet, document, reply",
    schema: "examples.ts → uiTeardown",
    size: "Three rows of four page frames each.",
    interactions: ["Replay", "Open a page frame", "Open the list's origins"],
    backend: "In Zephium: the native browser captures each page's frame.",
    local: "Partly",
    mock: "Page frames are generated placeholders",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Requires backend integration",
    aegisNote: "Needs real page captures. Annotated screenshots do not exist in Zephium either: there is no annotation object in the source.",
    stage: scene("uiTeardown"),
    note: "The skill itself places one list (“Worth taking”), a sheet when several products are compared, and the reply; the real page frames are the screens. The report is added for the brief. An “annotated interface” does not exist in the source: there is no annotation object.",
  },
  {
    id: "ws-day",
    name: "E · Daily planning",
    group: "workspace",
    categories: ["Workspaces", "Manager", "Office", "Connected Services"],
    internal: "skill plan-my-day",
    source: ["crates/zephium-app/skills/plan-my-day/SKILL.md", W + "lib/parts/connection.ts", W + "components/parts/ConnectionPart.svelte"],
    renderer: "WorkCanvas; four connection parts in parallel; objects: plan, list, plan (calendar), reply",
    schema: "examples.ts → dailyPlanning",
    size: "Four short rows, then the day's plan beside its checklist.",
    interactions: ["Replay", "Tick tasks", "Make tasks", "Open an item's origin"],
    backend: "In Zephium: day_sources asks once where the day lives, then one part per connected app.",
    local: "Yes",
    mock: "Invented calendar, mail and chat items; not your data",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Requires backend integration",
    aegisNote: "AEGIS has read-only Google Calendar and Gmail (V20). The `from` provenance rows are the missing piece on the list.",
    stage: scene("dailyPlanning"),
    note: "The skill itself places a plan for the rest of today, a to-do list with each item’s origin, and the reply. The week calendar is added for the brief. Every item is invented: nothing here is read from your accounts.",
  },
  {
    id: "ws-research",
    name: "F · Deep research",
    group: "workspace",
    categories: ["Workspaces", "Research"],
    internal: "skill research",
    source: ["crates/zephium-app/skills/research/SKILL.md", W + "lib/run/columns.ts", W + "lib/run/sources.ts"],
    renderer: "WorkCanvas; three research parts in column 0, a verification part in column 1; objects: sheet, plot, plan, list (questions), document, reply",
    schema: "examples.ts → deepResearch",
    size: "Two columns of work, then the result.",
    interactions: ["Replay", "Open source frames", "Open the report"],
    backend: "In Zephium: research helpers return cited digests; the lead composes the result.",
    local: "Yes",
    mock: "Invented sources and sample figures",
    strategy: "Direct reuse",
    react: HOSTED,
    aegis: "Implemented but visually different",
    aegisNote: "This is AEGIS's home ground. Zephium has no separate AI Plan card, stage cards or source stacks: those are AEGIS additions.",
    stage: scene("deepResearch"),
    note: "The research skill picks objects by the shape of what was found (sheet, plot, list, picks) plus the reply. The document is added for the brief’s “final reader”. A separate AI Plan card, verification card and evidence card are AEGIS designs, not Zephium objects: here verification is simply a later part in its own column.",
  },
  ...(
    [
      ["saasScene", "Zephium · SaaS architecture", "An answer with a 13-part diagram, two tables, a chart, a checklist and a brief (legacy board blocks).", ["Developer", "Diagrams"]],
      ["tripScene", "Zephium · YC trip", "Stays with pictures, flights, a checklist, cited pages and one that would not open.", ["Research", "Media"]],
      ["jobsScene", "Zephium · Job search", "A comparison of roles drawn from several sources.", ["Research"]],
      ["rustScene", "Zephium · Rust question", "A short knowledge answer with code.", ["Developer"]],
      ["dinnerScene", "Zephium · Dinner plan", "A small everyday request with entities.", ["Research"]],
      ["runningScene", "Zephium · Run in progress", "A run caught while it is still working.", ["AI Execution"]],
      ["fixDone", "Zephium · Fix a bug (done)", "GitHub and Code parts, a diff and a reply.", ["Developer", "Connected Services"]],
      ["fixWorking", "Zephium · Fix a bug (working)", "The same run mid-way, waiting on a Confirm.", ["Developer", "AI Execution"]],
      ["fourHelpers", "Zephium · Four helpers at work", "Connection, computer, browser and research helpers running at once.", ["AI Execution"]],
      ["searchDone", "Zephium · Search fallback", "A part that failed on a site, then a web search and two pages opened.", ["Research", "AI Execution"]],
      ["leadTrip", "Zephium · Lead trip", "A lead run with inputs, four parts and new-style objects.", ["Research", "AI Execution"]],
      ["askingTrip", "Zephium · Trip waiting on you", "The same trip held on a Confirm and a site question.", ["AI Execution"]],
    ] as const
  ).map(
    ([id, name, what, categories]): Entry => ({
      id: `zs-${id}`,
      name,
      group: "workspace",
      categories: ["Workspaces", ...(categories as readonly Category[])],
      internal: "Zephium test scene",
      source: [W + "tests/board-fixtures.ts", W + "tests/parts-look.ts", W + "tests/lead-look.ts", W + "tests/presence-look.ts"],
      renderer: "WorkCanvas, exactly as Zephium's own component tests mount it (tests/BoardCanvas.svelte)",
      schema: "BoardScene { snapshot, objectives, pictures, pages }",
      size: "Laid out by placeRun.",
      interactions: ["Select, drag, resize", "Open", "Selection bar"],
      backend: "None: the fixture is the recorded run.",
      local: "Yes",
      mock: "Zephium's own fixture, unchanged",
      strategy: "Direct reuse",
      react: HOSTED,
      aegis: "Available in Zephium and reusable",
      aegisNote: what,
      stage: scene(id),
      note: what,
    }),
  ),
];

const layout = (id: string, sceneId: string, name: string, what: string, source: string[]): Entry => ({
  id,
  name,
  group: "layout",
  categories: ["Layouts", "Canvas"],
  internal: "placeRun (shared algorithm, not a template)",
  source: [W + "lib/run/layout.ts", W + "lib/run/lines.ts", W + "lib/run/columns.ts", ...source],
  renderer: "WorkCanvas + WorkEdge",
  schema: "RunInputs { request, inputs?, rows: { part, found[], feeds, phase?, after? }[], head?, board, sources? } → RunPlace { rects, lines, box }",
  size: "Constants RUN: request 320, fork 96, rowGap 48, feed 96, found gap 24, wrap at 1080, air 6, grid 8.",
  interactions: ["Drag a card: its lines follow", "Replay to watch the lines appear"],
  backend: "None: pure functions of the run's facts.",
  local: "Yes",
  mock: "Synthetic parts built for the demonstration",
  strategy: "Logic reuse",
  react: "Pure TypeScript with no framework imports: reusable as-is from React, Svelte or tests.",
  aegis: "Implemented but visually different",
  aegisNote: "AEGIS replaced this with its own semantic-layout.ts, routing-service.ts and StrandEdge (S-curves, shared trunks). Zephium's version is orthogonal with rounded elbows.",
  stage: scene(sceneId),
  note: what,
});

const LAYOUTS: Entry[] = [
  layout("lay-one-to-one", "demoOneToOne", "1 · One to one", "No parts: the answer stands one fork-width past the request's words, joined by a single line.", []),
  layout("lay-one-to-many", "demoOneToMany", "2 · One to many (fork)", "The request's line forks to the head of every row; the trunk stands halfway (branch()).", []),
  layout("lay-many-to-one", "demoManyToOne", "3 · Many to one (merge)", "Every row of the last column merges on a collector into the result's headline (merge()).", []),
  layout("lay-parallel", "demoParallel", "4 · Parallel tracks", "Parts whose time spans overlap share a column; each keeps a row and its finds run along it.", []),
  layout("lay-grouped", "demoGrouped", "5 · Grouped sources", "A row's finds wrap under themselves past 1080 px so the result stays in view; Sources stand under the result.", [W + "lib/run/sources.ts", W + "components/cards/SourcesCard.svelte"]),
  layout("lay-sequential", "demoSequential", "6 · Sequential chain", "A new column begins only with work that started after everything in the last one had ended (columnsOf()).", []),
  layout("lay-mixed", "demoMixed", "7 · Merge then fork", "Each column's work merges on the spine and forks on into the next; only the last column reaches the result.", []),
  layout("lay-branches", "demoBranches", "8 · Several result objects", "The result is a board: boardLayout packs objects into rows by emphasis, group and width.", [W + "lib/board/layout.ts"]),
  {
    ...layout("lay-nested", "projectArchitecture", "9 · Nested diagram", "A diagram is a second layout inside one object: tiers from its layers, flows routed orthogonally, settled by ELK.", [W + "lib/diagram.ts", W + "lib/diagram-worker.ts"]),
    categories: ["Layouts", "Diagrams"],
  },
];

const inScene = (
  id: string,
  name: string,
  group: Group,
  categories: Category[],
  internal: string,
  source: string[],
  sceneId: string,
  rest: Partial<Entry> & Pick<Entry, "schema" | "size" | "interactions" | "backend" | "aegis" | "aegisNote">,
): Entry => ({
  id,
  name,
  group,
  categories,
  internal,
  source,
  renderer: source[0]!.replace(W, ""),
  local: "Yes",
  mock: "Shown inside a workspace scene",
  strategy: "Direct reuse",
  react: SVELTE,
  stage: scene(sceneId),
  ...rest,
});

const RUN: Entry[] = [
  inScene("run-request", "Request (user prompt)", "card", ["Research", "AI Execution", "Canvas"], `CanvasItem type "request" / "objective"`, w("components/cards/ObjectiveCard.svelte", "components/cards/RequestText.svelte", "components/lift/RequestLift.svelte", "lib/project-environment-thread.ts"), "deepResearch", {
    schema: "title (the person's words), when, expanded, turns: { local reads, exchange }",
    size: "320 wide (RUN.request); height from its text. Lines leave from where its first line of words ends.",
    interactions: ["Show all (expands the words)", "Open (RequestLift: the whole request, its questions and answers)"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS draws the user prompt with this card.",
  }),
  inScene("run-part", "Part row (helper lane)", "run", ["AI Execution", "Research", "Connected Services"], `CanvasItem type "part" · PartView · helpers: browser, research, computer, connection`, w("components/run/PartRow.svelte", "components/presence/PartMark.svelte", "components/presence/PartAgent.svelte", "lib/run/parts.ts", "lib/run/part-size.ts", "components/parts/ComputerPart.svelte", "components/parts/ConnectionPart.svelte"), "fourHelpers", {
    schema: "PartView { title, helper, service, goal, state: planned|running|waiting|done|failed|stopped, summary, pages[], need? }",
    size: "A row: name 12 px under the row's top, mark at the left, finds along the row.",
    interactions: ["Open (SourcesLift: the pages and files the part used)", "Need button when blocked (sign in, allow, retry)"],
    backend: "The lead's start_part tool; state arrives as run facts.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS worker cards use `branch`/`worker:` items rather than Zephium parts, with its own stage cards and status dots.",
  }),
  inScene("run-page", "Page frame on a row", "run", ["Research", "Media", "Designer"], `CanvasItem type "page" · PartPage`, w("components/run/PageFace.svelte", "components/cards/PageCard.svelte", "lib/frame-thumbs.ts", "lib/run/site.ts"), "uiTeardown", {
    schema: "page: { url, host, frame, live, human?, account?, tab? }",
    size: "336 × 238 browser window (page-size constants in lib/run/part-size.ts).",
    interactions: ["Open in the browser pane", "Live while the agent is on it", "Needs-you overlay when a site asks for a person"],
    backend: "Native page capture (zephium-media://frame).",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS source frames are 404 px and carry a saved excerpt; AEGIS also groups them into source stacks, which Zephium does not have.",
  }),
  inScene("run-input", "Input mark (memory, skill, notes, tabs, files)", "run", ["AI Execution"], `CanvasItem type "input" · kinds: memory, skill, history, notes, tabs, files, connection, work`, w("components/run/InputMark.svelte", "lib/project-environment.ts"), "productLaunch", {
    schema: "input: { kind, label, folder?, count?, lit?, element? }",
    size: "200 wide column, 48 left of the request; marks 8 px apart, merged into the request by merge().",
    interactions: ["Open the thing it stands for"],
    backend: "Run facts: WorkInputFactV1.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS keeps this adapter for loaded Skill marks.",
  }),
  inScene("run-sources", "Sources card", "card", ["Research"], `CanvasItem type "sources" · RunSources`, w("components/cards/SourcesCard.svelte", "components/lift/SourcesLift.svelte", "components/SourcesRail.svelte", "lib/run/sources.ts", "lib/run/provenance.ts"), "tripScene", {
    schema: "drawn: RunSources (pages and files cited, and what could not be opened); unread[]",
    size: "Under the result, 40 px below it; six rows before it opens (SOURCE_ROWS).",
    interactions: ["Open (SourcesLift)", "Open one source in the pane"],
    backend: "Citations from the provider's search record.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS patched SourcesCard to expand rows in place and added its own Sources gallery and stacks.",
  }),
  inScene("run-mark", "Run mark and status", "run", ["AI Execution"], `RunMark · WorkActivityV1`, w("components/run/RunMark.svelte", "components/AgentLine.svelte", "components/AgentMark.svelte", "lib/agent-steps.ts", "lib/run-timeline.ts", "lib/arrival.ts", "lib/camera-follow.ts"), "runningScene", {
    schema: "status: running | waiting | done | stopped; activity: Planning → Delegating → Searching/Reading → Comparing → Verifying → ProducingArtifact → Finishing",
    size: "A small mark beside the request; the island (AgentLine) floats over the canvas.",
    interactions: ["Agents in this run (island menu)", "Stop"],
    backend: "Live run projection from Rust.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS shows status with its own StatusDot and the hand overlay.",
  }),
  inScene("run-trail", "Trail (what the run did)", "block", ["AI Execution", "Developer"], `Block-like item type "trail" · TrailLine`, w("components/board/Trail.svelte", "lib/board/trail.ts", "lib/local-steps.ts", "components/local/CommandRecord.svelte", "components/local/CommandReview.svelte"), "fixDone", {
    schema: "trail: TrailLine[] (searches, reads, file reads, commands, edits)",
    size: "A narrow process column of one-line entries.",
    interactions: ["Open a command's recorded output", "Review a proposed edit"],
    backend: "Command and file evidence recorded by the computer helper.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS embeds Trail inside its merged AI PLAN card (V8).",
  }),
  inScene("run-needs", "Needs you", "run", ["AI Execution", "Connected Services"], `PartNeed · kinds: sign_in, check, allow_site, choose_folder, allow_folder, use_connection, connect, retry`, w("components/run/NeedsYou.svelte", "lib/run/need.ts", "lib/run/needs.ts", "components/pane/TakeoverPane.svelte"), "searchDone", {
    schema: "need: { kind, host?, connection?, path?, reason? }",
    size: "One sentence and one button over the page or under the part's name.",
    interactions: ["Sign in / allow / retry / choose folder"],
    backend: "Each button starts a native flow (pane takeover, folder picker, connection setup).",
    aegis: "Requires backend integration",
    aegisNote: "AEGIS has no takeover pane; blocked sources fall back to the Source Reader.",
  }),
];

const BLOCKS: Entry[] = [
  inScene("block-prose", "Prose (answer text)", "block", ["Research", "Documents"], `Block { kind: "prose" } from artifact "answer"`, w("components/board/Prose.svelte", "components/cards/AnswerCard.svelte", "lib/board/adapter.ts", "lib/board/text.ts"), "saasScene", {
    schema: "blocks: DocumentNodeView[]; cites: Record<blockId, sourceKeys[]>",
    size: "Hero; keeps its reading measure and may take an aside.",
    interactions: ["Open in place", "Source chips"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "Legacy path; new runs publish a `reply` object instead.",
  }),
  inScene("block-table", "Table / Chart / Checklist / Document blocks", "block", ["Documents", "Research"], `Block kinds: table, chart, checklist, document, timeline, stat, callout`, w("components/board/BlockHost.svelte", "components/board/Table.svelte", "components/board/Chart.svelte", "components/board/Checklist.svelte", "components/board/Document.svelte", "components/board/Timeline.svelte", "components/board/Stat.svelte", "components/board/Callout.svelte", "lib/board/adapter.ts", "lib/board/layout.ts"), "saasScene", {
    schema: "Block union in lib/board/types.ts; each has emphasis (hero | primary | supporting), group, sources, state",
    size: "Packed by boardLayout: a board 640–1120 wide, 24 px gaps; supporting blocks up to three across.",
    interactions: ["Open a block in place (it takes the board's width)", "Make tasks from a checklist", "Chart values table"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "These are the pre-object renderers. boardOf() in adapter.ts derives them from old artifact kinds (answer, table, chart, checklist, document, comparison_matrix, findings).",
  }),
  inScene("block-gallery", "Gallery and entity cards", "block", ["Research", "Media"], `Block { kind: "gallery" | "entity" } · 11 entity facets`, w("components/board/Gallery.svelte", "components/board/EntityCard.svelte", "components/cards/SubjectPicture.svelte", "lib/board/entities.ts", "components/compare/Compare.svelte", "components/WorkSubjectInspector.svelte"), "tripScene", {
    schema: "entities: Entity[] { key, facet, name, descriptor?, image?, homepage?, price?, time?, facts[], chosen? }; compare?: Matrix",
    size: "Cards 216 wide (300 without a picture), six before it counts the rest.",
    interactions: ["Choose", "Open the entity", "Compare"],
    backend: "Pictures from the native media store.",
    aegis: "Available in Zephium and reusable",
    aegisNote: "Superseded in Zephium by the picks object; useful as a reference for how subjects merge across artifacts.",
  }),
  inScene("block-comparison", "Comparison matrix", "block", ["Research", "Founder", "Marketing"], `Block { kind: "comparison" } from artifact "comparison_matrix"`, w("components/board/Comparison.svelte", "components/cards/CompareCard.svelte", "lib/compare.ts", "lib/board/tabular.ts"), "jobsScene", {
    schema: "subjects[], criteria[], cells[subject][criterion], notes?",
    size: "A primary block; wide when it has many subjects.",
    interactions: ["Open in place"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS comparisons go through the newer sheet renderer.",
  }),
];

const ASKS: Entry[] = [
  {
    id: "ask-cards",
    name: "Ask cards (confirm, question, sign-in, folder, context)",
    group: "ask",
    categories: ["AI Execution", "Connected Services", "Office"],
    internal: "Ask union · step kinds ask, confirm · purposes entry, context, folder, address",
    source: w("components/asks/AskCard.svelte", "components/asks/AskShell.svelte", "components/asks/ConfirmCard.svelte", "components/asks/QuestionCard.svelte", "components/asks/SignInCard.svelte", "components/asks/ConnectionCard.svelte", "components/asks/ContextCard.svelte", "components/asks/EntryCard.svelte", "components/asks/FolderCard.svelte", "components/asks/AddressCard.svelte", "components/asks/AskReceipt.svelte", "components/asks/asks.ts", "components/asks/actions.ts", "tests/ask-fixtures.ts"),
    renderer: "components/asks/AskCard.svelte chooses the card from the ask's kind",
    schema: "asksOf(execution, pages) → Ask[] { kind, state: open | settled, step, … }; AskActions { confirm, answer }",
    size: "360 on the canvas, 440 in the island; a pill when zoomed out.",
    interactions: ["Confirm / decline", "Choose an option", "Type an answer", "Allow always", "Receipt once settled"],
    backend: "Every answer goes back to the run through Rust; Confirm text is Rust's own reading of the page, never the model's words.",
    local: "Yes",
    mock: "Zephium's ask fixtures; the buttons answer locally and are labelled simulated",
    strategy: "Direct reuse",
    react: SVELTE,
    aegis: "Requires backend integration",
    aegisNote: "AEGIS has no approval-request cards on the canvas. This is the pattern to follow if account writes are ever enabled.",
    stage: { kind: "asks" },
  },
];

const CANVAS: Entry[] = [
  inScene("canvas-work", "WorkCanvas (pan, zoom, select, drag)", "canvas", ["Canvas"], "WorkCanvas · @xyflow/svelte 1.6", w("components/WorkCanvas.svelte", "components/CanvasNode.svelte", "components/CanvasControls.svelte", "lib/canvas-model.ts", "lib/pointer-tool.svelte.ts", "lib/camera-follow.ts", "lib/free-space.ts"), "saasScene", {
    schema: "props: items: CanvasItem[]; links: CanvasLink[]; areas; initialView { positions, sizes, viewport? }; home; board: BoardActions; callbacks on…",
    size: "Zoom 0.2–2. Cards are virtualised from 24 items. Everything sits on an 8 px grid.",
    interactions: ["Pan (hand tool, H) and marquee select (V)", "Zoom, Fit (0)", "Drag", "Resize (NodeResizer)", "Escape clears the selection", "Camera follows a live run by panning only"],
    backend: "None; saving the view calls onviewchange.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "This is the canvas AEGIS Research runs on, with 11 durable patches (designer geometry, pin and size-lock actions).",
  }),
  inScene("canvas-edge", "WorkEdge (lines)", "canvas", ["Canvas", "Layouts"], "WorkEdge · CanvasLink · RunLine", w("components/WorkEdge.svelte", "components/CanvasFlowHandle.svelte", "lib/run/lines.ts", "lib/canvas-model.ts"), "demoMixed", {
    schema: "CanvasLink { id, source, target, kind, points?, from, to, laid }; relation kinds: supports, uses, depends_on, same_as, contradicts",
    size: "Orthogonal polylines with 12 px rounded elbows; lines stop 6 px short of what they join.",
    interactions: ["Lines follow a dragged card (offset from where the run laid them)", "No ports to wire by hand: lines are derived, never drawn by the person"],
    backend: "None.",
    aegis: "Implemented but visually different",
    aegisNote: "AEGIS draws StrandEdge/RelayEdge S-curves from backend relations instead.",
  }),
  inScene("canvas-select", "Selection bar and areas (groups)", "canvas", ["Canvas", "Layouts"], "SelectionBar · AreaNode · Arrangement: grid, row, stack, tidy", w("components/SelectionBar.svelte", "components/AreaNode.svelte", "lib/selection.ts", "lib/arrange.ts"), "tripScene", {
    schema: "arrange(placed, how) → Map<id, Point>; alignTo(placed, left | top | center); CanvasArea { id, title }",
    size: "Arrangement gaps come from lib/arrange.ts (grid, row, column, pack, distribute).",
    interactions: ["Arrange: grid, row, stack, tidy", "Align: left, top, centre", "Group into an area", "Ask about the selection", "Remove"],
    backend: "Areas and removals are saved to the work's canvas snapshot.",
    aegis: "Implemented but missing interactions",
    aegisNote: "AEGIS removed its Auto Arrange UI; Zephium's selection bar (arrange, align, areas) is present in the bundle and could be re-enabled.",
    note: "Select two or more cards with the marquee to see the bar. Pin and lock are AEGIS additions, not Zephium features.",
  }),
  inScene("canvas-lift", "Lift and opened object view", "canvas", ["Canvas", "Documents"], "Lift · LiftHeader · ObjectCentre", w("components/Lift.svelte", "components/LiftHeader.svelte", "components/objects/ObjectCentre.svelte", "components/objects/centre.ts", "components/lift/LiftSection.svelte", "components/lift/LiftRow.svelte"), "competitorLandscape", {
    schema: "Lift props: origin, source, bounds, preferred { width, height }, hug, title, onclose",
    size: "Grows out of its card to the size its kind reads at, inside the canvas bounds.",
    interactions: ["Open (double-click or Open on the card's bar)", "Escape or click outside to close", "Ask about this"],
    backend: "None.",
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS focused objects use the original Lift, LiftHeader and ObjectCentre (V22).",
  }),
];

const START: Entry[] = [
  {
    id: "start-screen",
    name: "Start screen (personas and workflow tiles)",
    group: "start",
    categories: ["Canvas", "AI Execution", "Developer", "Designer", "Marketing", "Manager", "Student", "Office", "Founder"],
    internal: "WorkStart · PERSONAS (7) · WORKFLOWS (17) · 17 vignette shapes",
    source: w("components/start/WorkStart.svelte", "components/start/Vignette.svelte", "lib/start/workflows.ts", "components/bar/WorkBar.svelte", "tests/StartStage.svelte").concat(["frame/messages/en.json", "crates/zephium-app/skills/"]),
    renderer: "tests/StartStage.svelte (WorkStart over the canvas, WorkBar docked)",
    schema: "Workflow { skill, persona, shape, hue, input: none | text | folder, reads: string[], title, line, request, ask, known: RegExp }",
    size: "Fills the empty canvas; tiles in a grid per persona.",
    interactions: ["Switch persona", "Pick a workflow (writes its request into the ask bar)", "“For you” row from recent works"],
    backend: "Picking a tile only fills the composer and records the skill; sending needs the lead runtime.",
    local: "Yes",
    mock: "Three recent works from Zephium's own test",
    strategy: "Direct reuse",
    react: SVELTE,
    aegis: "Already implemented in AEGIS",
    aegisNote: "AEGIS mounts WorkStart with its own catalogue (adds the Research persona).",
    stage: { kind: "start" },
  },
];

export const ENTRIES: Entry[] = [...WORKSPACES, ...LAYOUTS, ...OBJECTS, ...RUN, ...BLOCKS, ...ASKS, ...CANVAS, ...START];

/** Things the brief asked about that the accessible source does not contain. */
export const MISSING: { name: string; why: string }[] = [
  { name: "Kanban board", why: "No board object in Work. Zephium's task board lives in the Tasks feature (features/tasks/TaskBoard.svelte), not on the canvas." },
  { name: "Terminal card", why: "Commands appear as one-line Trail entries with a recorded-output view (CommandRecord), not as a terminal object." },
  { name: "Test results card", why: "No test object; a test run is a command record plus a count in the reply." },
  { name: "Dependency graph / module diagram as its own type", why: "One diagram object serves architecture, flow and market map; the model chooses nodes, edges and layers." },
  { name: "Annotated screenshot", why: "No annotation layer. UI teardown uses the real page frames as its screens." },
  { name: "Moodboard layout", why: "Not a layout: a moodboard is each part's picks object." },
  { name: "Knowledge map / mind map", why: "Not in Zephium. AEGIS's knowledge map (knowledge-map.ts) is its own." },
  { name: "PDF preview object", why: "Only the file object's first-page picture, which needs the native host." },
  { name: "Email / Slack message card", why: "Drawn as a subject or a list item with a `from` row, and as a draft; there is no inbox object." },
  { name: "Research plan card, verification card, gap-analysis card", why: "Zephium shows process as part rows and the Trail; the AI PLAN, stage and coverage cards are AEGIS's." },
  { name: "Pin and lock", why: "Added by AEGIS patches to CanvasNode; not in Zephium." },
  { name: "Context / three-dot menu on cards", why: "Cards have a toolbar (Open, Ask, Choose, area, Remove), not a menu. WorkRowMenu belongs to the works list." },
  { name: "Named layout presets per workflow", why: "There are none: every workflow uses placeRun + boardLayout. The start-screen vignettes are illustrations only." },
];
