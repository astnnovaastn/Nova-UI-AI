/*
 * AEGIS Work Layout Lab — the six example workspaces (A–F).
 *
 * Every company, person, page, price and date below is INVENTED sample data on the
 * reserved `.example` domain. Each example follows the parts and result objects that the
 * matching Zephium skill prescribes (crates/zephium-app/skills/<name>/SKILL.md); the
 * canvas itself is laid out by Zephium's own code, not by this file.
 */
import type { Data, SceneSpec } from "./scene";

const d = (data: unknown) => data as Data;
const yes = (label: string, value: "yes" | "no" | "partial") => ({ label, value, kind: value });
const text = (label: string, value: string) => ({ label, value, kind: "text" });

/* ───────────────────────── A · Project architecture (skill: map-a-project) ───────────────────────── */
const ROOT = "/Users/sam/Code/tidewater";
export const projectArchitecture: SceneSpec = {
  name: "lab-architecture",
  request: `Map the architecture of ${ROOT}`,
  folder: ROOT,
  inputs: [
    { kind: "skill", label: "Map a project" },
    { kind: "files", label: "tidewater", count: 214 },
  ],
  parts: [
    {
      id: "architecture",
      title: "Architecture",
      helper: "computer",
      goal: "Entry points, modules, imports and external services, about 20 files",
      summary: "5 layers · 14 modules · 19 files read",
      at: 0,
      lasts: 70,
      steps: [
        { do: "find", query: "main.ts|server.ts|app.ts" },
        { do: "file", path: `${ROOT}/apps/web/src/main.ts` },
        { do: "file", path: `${ROOT}/services/api/src/server.ts` },
        { do: "file", path: `${ROOT}/services/api/src/routes/bookings.ts` },
        { do: "find", query: "import .* from '@tidewater/" },
        { do: "file", path: `${ROOT}/packages/domain/src/booking.ts` },
        { do: "command", command: "git log --oneline -15", note: "15 commits" },
      ],
    },
  ],
  made: [
    {
      id: "a-project",
      title: "tidewater",
      data: d({
        kind: "project",
        name: "tidewater",
        summary: "A harbour booking platform: a SvelteKit web app over a Fastify API with a shared domain package.",
        root: ROOT,
        stack: [
          { name: "SvelteKit", host: "svelte.dev", version: "2.20", role: "Frontend" },
          { name: "TypeScript", host: "typescriptlang.org", version: "5.8" },
          { name: "Fastify", host: "fastify.dev", version: "5.2", role: "API" },
          { name: "PostgreSQL", host: "postgresql.org", version: "17" },
          { name: "Redis", host: "redis.io", role: "Queue" },
          { name: "Vitest", role: "Tests" },
        ],
        tree: [
          { path: "apps", kind: "folder" },
          { path: "apps/web", kind: "folder", more: 61 },
          { path: "apps/admin", kind: "folder", more: 24 },
          { path: "services", kind: "folder" },
          { path: "services/api", kind: "folder", more: 48 },
          { path: "services/worker", kind: "folder", more: 17 },
          { path: "packages", kind: "folder" },
          { path: "packages/domain", kind: "folder", more: 22 },
          { path: "packages/db", kind: "folder", more: 13 },
          { path: "package.json", kind: "file" },
          { path: "pnpm-workspace.yaml", kind: "file" },
          { path: "README.md", kind: "file" },
        ],
        more: 6,
        scripts: [
          { name: "dev", command: "pnpm -r --parallel dev", source: "package.json" },
          { name: "test", command: "vitest run", source: "package.json" },
          { name: "migrate", command: "pnpm --filter db migrate", source: "package.json" },
        ],
        git: { branch: "main", changed: 3, ahead: 1, behind: 0 },
      }),
    },
    {
      id: "a-diagram",
      title: "How a booking travels through tidewater",
      data: d({
        kind: "diagram",
        layers: [
          { id: "client", name: "Client" },
          { id: "api", name: "API" },
          { id: "domain", name: "Domain" },
          { id: "data", name: "Data" },
          { id: "services", name: "Services" },
        ],
        nodes: [
          { id: "web", name: "Web app", kind: "client", layer: "client", note: "apps/web · SvelteKit", vendor: "svelte.dev" },
          { id: "admin", name: "Admin console", kind: "client", layer: "client", note: "apps/admin" },
          { id: "gateway", name: "HTTP server", kind: "gateway", layer: "api", note: "services/api/src/server.ts" },
          { id: "routes", name: "Booking routes", kind: "service", layer: "api", note: "routes/bookings.ts" },
          { id: "auth", name: "Session guard", kind: "service", layer: "api", note: "plugins/session.ts" },
          { id: "booking", name: "Booking rules", kind: "service", layer: "domain", note: "packages/domain/booking.ts" },
          { id: "pricing", name: "Pricing", kind: "service", layer: "domain", note: "packages/domain/pricing.ts" },
          { id: "tides", name: "Tide windows", kind: "service", layer: "domain", note: "packages/domain/tides.ts" },
          { id: "repo", name: "Repositories", kind: "service", layer: "data", note: "packages/db" },
          { id: "pg", name: "PostgreSQL", kind: "store", layer: "data", note: "bookings, berths, vessels", vendor: "postgresql.org" },
          { id: "queue", name: "Job queue", kind: "queue", layer: "data", note: "BullMQ on Redis", vendor: "redis.io" },
          { id: "worker", name: "Worker", kind: "worker", layer: "services", note: "services/worker" },
          { id: "mail", name: "Mail provider", kind: "external", layer: "services", note: "confirmations" },
          { id: "tideapi", name: "Tide data API", kind: "external", layer: "services", note: "hourly import" },
        ],
        edges: [
          { from: "web", to: "gateway", label: "HTTPS" },
          { from: "admin", to: "gateway", label: "HTTPS" },
          { from: "gateway", to: "auth", label: "cookie" },
          { from: "gateway", to: "routes" },
          { from: "routes", to: "booking", label: "create" },
          { from: "booking", to: "pricing" },
          { from: "booking", to: "tides" },
          { from: "booking", to: "repo", label: "save" },
          { from: "repo", to: "pg", label: "SQL" },
          { from: "booking", to: "queue", label: "enqueue" },
          { from: "queue", to: "worker", label: "consume" },
          { from: "worker", to: "mail", label: "send" },
          { from: "worker", to: "tideapi", label: "fetch" },
        ],
      }),
    },
    {
      id: "a-code",
      title: "packages/domain/src/booking.ts",
      data: d({
        kind: "code",
        language: "typescript",
        text: [
          "export async function createBooking(input: BookingInput, deps: Deps): Promise<Booking> {",
          "  const window = await deps.tides.windowFor(input.berth, input.arrival);",
          "  if (!window.fits(input.vessel.draught)) throw new BookingError(\"draught\");",
          "",
          "  const price = priceFor(input, window);",
          "  const booking = await deps.bookings.save({ ...input, price, status: \"held\" });",
          "",
          "  await deps.queue.add(\"confirm-booking\", { id: booking.id });",
          "  return booking;",
          "}",
        ].join("\n"),
        notes: [
          { from: 2, to: 3, text: "The one rule a reader would miss: a booking is refused on draught before it is ever priced." },
          { from: 8, to: 8, text: "Everything slow leaves through the queue; the request never waits on mail." },
        ],
      }),
    },
    {
      id: "a-doc",
      title: "Architecture notes",
      data: d({
        kind: "document",
        paragraphs: [
          "tidewater is a pnpm workspace with two apps, two services and two shared packages. All business rules live in packages/domain; nothing else decides what a valid booking is.",
          "## Request path",
          "A booking enters through services/api, passes the session guard, and reaches createBooking in the domain package. The domain asks the tide module for a window, prices the stay, saves through the repository and enqueues a confirmation.",
          "## Boundaries",
          "The API never imports from packages/db directly: repositories are injected. The worker shares the domain package but owns every external call (mail, tide data).",
          "## Read these first",
          "1. packages/domain/src/booking.ts\n2. services/api/src/routes/bookings.ts\n3. services/worker/src/jobs/confirm.ts",
        ],
      }),
    },
    {
      id: "a-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "A layered monolith with one rules package",
        text: "Requests enter the **Fastify API**, every decision is made in `packages/domain`, and anything slow leaves through a **Redis queue** to the worker.",
        figures: [
          { label: "Layers", value: "5" },
          { label: "Modules", value: "14" },
          { label: "Files read", value: "19" },
        ],
        points: [
          "Start with packages/domain/src/booking.ts",
          "Then services/api/src/routes/bookings.ts",
          "The worker owns every external call",
        ],
      }),
    },
  ],
};

/* ───────────────────────── B · Product launch (skill: campaign-plan) ───────────────────────── */
export const productLaunch: SceneSpec = {
  name: "lab-launch",
  request: "Plan a launch campaign for Lumen Notes 2.0, a note-taking app for research teams, launching 9 March",
  inputs: [
    { kind: "skill", label: "Campaign plan" },
    { kind: "memory", label: "Audience: research leads" },
    { kind: "notes", label: "Launch notes", count: 3 },
  ],
  parts: [
    {
      id: "channels",
      title: "Channels",
      helper: "research",
      goal: "Where research teams hear about new tools",
      summary: "4 channels worth the budget",
      at: 0,
      lasts: 40,
      steps: [
        { do: "search", query: "where do research teams discover note taking tools" },
        { do: "read", url: "https://labnotes-weekly.example/how-teams-pick-tools", title: "How research teams pick their tools" },
        { do: "read", url: "https://community.researchops.example/threads/tooling-2027", title: "Tooling thread 2027 — ResearchOps community" },
      ],
    },
    {
      id: "launches",
      title: "Recent launches",
      helper: "browser",
      host: "launchboard.example",
      goal: "How three comparable products launched",
      summary: "3 launch pages read",
      at: 2,
      lasts: 44,
      steps: [
        { do: "read", url: "https://launchboard.example/posts/quillbase-3", title: "Quillbase 3 — launch day page" },
        { do: "read", url: "https://launchboard.example/posts/papertrail-teams", title: "Papertrail for Teams" },
        { do: "read", url: "https://launchboard.example/posts/margin-ai", title: "Margin AI — launch recap" },
      ],
    },
    {
      id: "video",
      title: "Reference video",
      helper: "browser",
      host: "videos.example",
      goal: "One launch video worth studying",
      summary: "1 video",
      at: 4,
      lasts: 30,
      steps: [{ do: "read", url: "https://videos.example/watch/quillbase-keynote", title: "Quillbase 3 launch keynote (12 min)" }],
    },
  ],
  made: [
    {
      id: "b-plan",
      title: "Launch plan",
      data: d({
        kind: "plan",
        checkable: true,
        steps: [
          { when: "Mon 16 Feb", date: "2027-02-16", title: "Lock the positioning line", detail: "One sentence the whole launch repeats", kind: "task" },
          { when: "Wed 18 Feb", date: "2027-02-18", title: "Record the 90-second demo", detail: "Import, cite, share: three cuts", kind: "task", cost: "$600" },
          { when: "Mon 23 Feb", date: "2027-02-23", title: "Brief 12 design partners", detail: "Ask each for one quote and one screenshot", kind: "task" },
          { when: "Mon 2 Mar", date: "2027-03-02", title: "Waitlist email #1", detail: "What changed in 2.0, to 4,200 subscribers", kind: "event" },
          { when: "Fri 6 Mar", date: "2027-03-06", title: "Press and newsletter embargo", detail: "LabNotes Weekly, ResearchOps digest", kind: "task", cost: "$1,400" },
          { when: "Mon 9 Mar", date: "2027-03-09", title: "Launch day", detail: "Launchboard post at 09:00, founders online all day", kind: "milestone" },
          { when: "Tue 10 Mar", date: "2027-03-10", title: "Community AMA", detail: "ResearchOps forum, 17:00", kind: "event" },
          { when: "Mon 16 Mar", date: "2027-03-16", title: "One-week review", detail: "Sign-ups, activation, what to repeat", kind: "milestone" },
        ],
        total: { label: "Budget", value: "$2,000" },
      }),
    },
    {
      id: "b-calendar",
      title: "March calendar",
      data: d({
        kind: "plan",
        calendar: true,
        checkable: false,
        steps: [
          { date: "2027-03-02", when: "09:00", title: "Waitlist email #1", kind: "event" },
          { date: "2027-03-04", when: "14:00", title: "Demo video review", kind: "task" },
          { date: "2027-03-06", when: "10:00", title: "Embargo lifts for press", kind: "task" },
          { date: "2027-03-09", when: "09:00", title: "Launch day", kind: "milestone" },
          { date: "2027-03-09", when: "13:00", title: "Founder livestream", kind: "event" },
          { date: "2027-03-10", when: "17:00", title: "Community AMA", kind: "event" },
          { date: "2027-03-12", when: "11:00", title: "Customer webinar", kind: "event" },
          { date: "2027-03-16", when: "10:00", title: "One-week review", kind: "milestone" },
        ],
      }),
    },
    {
      id: "b-list",
      title: "Before launch day",
      data: d({
        kind: "list",
        style: "todo",
        items: [
          { title: "Pricing page shows the 2.0 plans", detail: "Team plan still says “coming soon”", priority: "high", due: "6 Mar" },
          { title: "Demo video captioned", due: "4 Mar", done: true },
          { title: "Three partner quotes approved", detail: "Two in, one waiting on legal", due: "27 Feb" },
          { title: "Launchboard listing drafted", due: "5 Mar" },
          { title: "Support macros for import questions", due: "8 Mar" },
        ],
      }),
    },
    {
      id: "b-video",
      title: "Quillbase 3 launch keynote",
      data: d({
        kind: "media",
        medium: "video",
        url: "https://videos.example/watch/quillbase-keynote",
        title: "Quillbase 3 launch keynote",
        provider: "file",
        duration: "12:04",
      }),
    },
    {
      id: "b-email",
      title: "Launch email",
      data: d({
        kind: "draft",
        destination: "email",
        to: "waitlist@lumen-notes.example",
        subject: "Lumen Notes 2.0 is here",
        body: [
          "Hi there,",
          "",
          "Today we're shipping **Lumen Notes 2.0**. Three things changed:",
          "",
          "- **Cite as you write.** Paste a link and the source is kept with the sentence.",
          "- **Shared notebooks.** Your whole team, one place, with review built in.",
          "- **Import everything.** Bring your old notes over in a single step.",
          "",
          "It's live now for everyone on the waitlist.",
          "",
          "— The Lumen team",
        ].join("\n"),
      }),
    },
    {
      id: "b-post",
      title: "Launch post",
      data: d({
        kind: "draft",
        destination: "linkedin",
        body: "Lumen Notes 2.0 is live. Research teams told us their notes and their sources live in different places, so we put them in one. Cite as you write, review together, import everything.",
      }),
    },
    {
      id: "b-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "A three-week runway to 9 March",
        text: "Lead with the **90-second demo** and partner quotes; spend the budget on two newsletters research leads already read, not on ads.",
        figures: [
          { label: "Budget", value: "$2,000" },
          { label: "Steps", value: "8" },
          { label: "Launch", value: "9 Mar" },
        ],
        points: ["Positioning line locked by 16 Feb", "Embargo lifts 6 Mar", "Review one week after"],
      }),
    },
  ],
};

/* ───────────────────────── C · Competitor landscape (skill: competitor-landscape) ───────────────────────── */
const rivals = [
  { name: "Quillbase", host: "quillbase.example", line: "The research notebook that cites itself", for: "Academic labs", from: "$8", free: "yes", ai: "yes", collab: "yes", offline: "no", raised: "$42M" },
  { name: "Papertrail", host: "papertrail.example", line: "Every decision, with its evidence", for: "Product research", from: "$12", free: "no", ai: "partial", collab: "yes", offline: "no", raised: "$18M" },
  { name: "Margin", host: "margin.example", line: "Read, mark, remember", for: "Solo researchers", from: "$5", free: "yes", ai: "no", collab: "no", offline: "yes", raised: "$6M" },
  { name: "Fieldbook", host: "fieldbook.example", line: "Field notes for teams on the move", for: "UX research", from: "$15", free: "partial", ai: "yes", collab: "yes", offline: "yes", raised: "$27M" },
];
export const competitorLandscape: SceneSpec = {
  name: "lab-competitors",
  request: "Map the competitors of Lumen Notes, a note-taking app for research teams",
  inputs: [{ kind: "skill", label: "Competitor landscape" }],
  parts: [
    {
      id: "players",
      title: "Players",
      helper: "research",
      goal: "Who competes, their funding and audience",
      summary: "4 direct competitors",
      at: 0,
      lasts: 50,
      steps: [
        { do: "search", query: "research note taking apps for teams 2027" },
        { do: "read", url: "https://toolindex.example/categories/research-notes", title: "Research notes — tool index" },
        { do: "read", url: "https://fundingwire.example/sectors/knowledge-tools", title: "Knowledge tools: funding rounds" },
      ],
    },
    {
      id: "pitch",
      title: "Pitch",
      helper: "research",
      goal: "Each competitor's hero headline and pricing",
      summary: "4 home pages, 4 pricing pages",
      at: 1,
      lasts: 55,
      steps: rivals.flatMap((rival) => [
        { do: "read" as const, url: `https://${rival.host}/`, title: `${rival.name} — ${rival.line}` },
      ]),
    },
  ],
  made: [
    {
      id: "c-picks",
      title: "The four that compete directly",
      data: d({
        kind: "picks",
        facet: "company",
        items: rivals.map((rival, index) => ({
          name: rival.name,
          subtitle: rival.for,
          logo_host: rival.host,
          url: `https://${rival.host}/`,
          price: { display: `${rival.from} / seat` },
          facts: [text("Raised", rival.raised), yes("Free plan", rival.free as "yes"), yes("AI", rival.ai as "yes")],
          why: rival.line,
          tags: [],
          recommended: index === 0,
        })),
      }),
    },
    {
      id: "c-sheet",
      title: "Landscape",
      data: d({
        kind: "sheet",
        columns: [
          { label: "Company", kind: "entity" },
          { label: "Positioning", kind: "text" },
          { label: "For", kind: "tag" },
          { label: "Starts at", kind: "money", currency: "USD", best: "min" },
          { label: "Free plan", kind: "yes_no" },
          { label: "AI", kind: "yes_no" },
          { label: "Collaboration", kind: "yes_no" },
          { label: "Offline", kind: "yes_no" },
        ],
        rows: rivals.map((rival) => ({
          cells: [rival.name, rival.line, rival.for, rival.from.replace("$", ""), rival.free, rival.ai, rival.collab, rival.offline],
          entity: { logo_host: rival.host },
        })),
        note: "Prices are per seat per month, billed annually. Sample data.",
      }),
    },
    {
      id: "c-plot",
      title: "Entry price per seat",
      data: d({
        kind: "plot",
        style: "bar",
        x: { label: "Product", kind: "category" },
        y: { label: "USD per seat / month", format: "money", currency: "USD" },
        series: [{ name: "Entry price", points: rivals.map((rival) => ({ x: rival.name, y: rival.from.replace("$", "") })) }],
        headline: { label: "Median entry price", value: "$10" },
        basis: "Each vendor's own pricing page (sample data)",
      }),
    },
    {
      id: "c-list",
      title: "How they pitch",
      data: d({
        kind: "list",
        style: "reading",
        items: rivals.map((rival) => ({
          title: `“${rival.line}”`,
          detail: `${rival.name} · aimed at ${rival.for.toLowerCase()}`,
          from: { host: rival.host, url: `https://${rival.host}/` },
        })),
      }),
    },
    {
      id: "c-doc",
      title: "Landscape report",
      data: d({
        kind: "document",
        paragraphs: [
          "Four products compete directly for research teams' notes. All four sell per seat; two offer a real free plan.",
          "## Where they crowd",
          "Collaboration and AI summaries are now table stakes: three of four ship both. Positioning has converged on “notes with evidence”.",
          "## The opening",
          "Only Margin and Fieldbook work offline, and neither targets academic labs. A product that cites as you write and works offline has that corner to itself.",
          "## What we could not confirm",
          "Fieldbook's enterprise pricing is not public; its free tier limits were read from a third-party index.",
        ],
      }),
    },
    {
      id: "c-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "Four rivals, one open corner: offline for labs",
        text: "Everyone sells **collaboration and AI**. Nobody serving academic labs works **offline**, and prices cluster at $8–15 a seat.",
        figures: [
          { label: "Direct rivals", value: "4" },
          { label: "Median entry", value: "$10" },
          { label: "With free plan", value: "2" },
        ],
        points: [],
      }),
    },
  ],
};

/* ───────────────────────── D · UI teardown (skill: ui-teardown) ───────────────────────── */
const product = (id: string, name: string, host: string, at: number) => ({
  id,
  title: name,
  helper: "browser" as const,
  host,
  goal: `${name}: home, pricing, sign-up and the product itself`,
  summary: "4 screens",
  at,
  lasts: 60,
  steps: [
    { do: "read" as const, url: `https://${host}/`, title: `${name} — home` },
    { do: "read" as const, url: `https://${host}/pricing`, title: `${name} — pricing` },
    { do: "read" as const, url: `https://${host}/signup`, title: `${name} — create your account` },
    { do: "read" as const, url: `https://${host}/app`, title: `${name} — workspace` },
  ],
});
export const uiTeardown: SceneSpec = {
  name: "lab-teardown",
  request: "Tear down the interface of Quillbase, Papertrail and Fieldbook",
  inputs: [{ kind: "skill", label: "UI teardown" }],
  parts: [
    product("quillbase", "Quillbase", "quillbase.example", 0),
    product("papertrail", "Papertrail", "papertrail.example", 1),
    product("fieldbook", "Fieldbook", "fieldbook.example", 2),
  ],
  made: [
    {
      id: "d-list",
      title: "Worth taking",
      data: d({
        kind: "list",
        style: "requirements",
        items: [
          { title: "One primary action per screen", detail: "Quillbase's home has a single filled button; everything else is a quiet link.", from: { host: "quillbase.example", url: "https://quillbase.example/" } },
          { title: "Pricing as a sentence, not a grid", detail: "Papertrail states its one price in the hero and hides the comparison behind a link.", from: { host: "papertrail.example", url: "https://papertrail.example/pricing" } },
          { title: "Sign-up asks for the email only", detail: "Fieldbook defers name, team and password until after the first note.", from: { host: "fieldbook.example", url: "https://fieldbook.example/signup" } },
          { title: "Empty state that teaches", detail: "Quillbase's blank workspace is a real sample notebook you can edit.", from: { host: "quillbase.example", url: "https://quillbase.example/app" } },
          { title: "Dense tables, generous line height", detail: "Papertrail fits 14 rows per screen and still reads calmly.", from: { host: "papertrail.example", url: "https://papertrail.example/app" } },
          { title: "Source chips beside the sentence", detail: "Fieldbook keeps provenance inline instead of in a footnote list.", from: { host: "fieldbook.example", url: "https://fieldbook.example/app" } },
        ],
      }),
    },
    {
      id: "d-sheet",
      title: "Patterns compared",
      data: d({
        kind: "sheet",
        columns: [
          { label: "Product", kind: "entity" },
          { label: "Pricing model", kind: "tag" },
          { label: "Free trial", kind: "yes_no" },
          { label: "Social sign-in", kind: "yes_no" },
          { label: "Dark mode", kind: "yes_no" },
          { label: "Command palette", kind: "yes_no" },
          { label: "Onboarding steps", kind: "number", best: "min" },
        ],
        rows: [
          { cells: ["Quillbase", "Per seat", "yes", "yes", "yes", "yes", "3"], entity: { logo_host: "quillbase.example" } },
          { cells: ["Papertrail", "Flat", "no", "yes", "partial", "no", "5"], entity: { logo_host: "papertrail.example" } },
          { cells: ["Fieldbook", "Per seat", "yes", "no", "yes", "yes", "1"], entity: { logo_host: "fieldbook.example" } },
        ],
      }),
    },
    {
      id: "d-doc",
      title: "Design report",
      data: d({
        kind: "document",
        paragraphs: [
          "Three research-notes products, twelve screens. The strongest moves are about restraint: one action, one price, one field.",
          "## Recommendations",
          "1. Cut the home page to a single primary action.\n2. Move the plan comparison behind a link.\n3. Ask for the email only; defer the rest until after the first note.",
          "## What to avoid",
          "Papertrail's five-step onboarding loses the thread before the product appears. Fieldbook's light theme drops below comfortable contrast in its secondary text.",
        ],
      }),
    },
    {
      id: "d-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "Restraint is the shared design stance",
        text: "All three win where they show **less**: one action on the home page, one price in the hero, one field at sign-up.",
        figures: [
          { label: "Products", value: "3" },
          { label: "Screens read", value: "12" },
          { label: "Moves worth taking", value: "6" },
        ],
        points: [],
      }),
    },
  ],
};

/* ───────────────────────── E · Daily planning (skill: plan-my-day) ───────────────────────── */
const app = (id: string, title: string, connection: string, at: number, summary: string, query: string) => ({
  id,
  title,
  helper: "connection" as const,
  connection,
  goal: `Today in ${title}`,
  summary,
  at,
  lasts: 18,
  steps: [{ do: "search" as const, query }],
});
export const dailyPlanning: SceneSpec = {
  name: "lab-day",
  request: "Plan my day",
  inputs: [
    { kind: "skill", label: "Plan my day" },
    { kind: "memory", label: "Deep work before noon" },
    { kind: "connection", label: "Calendar, Mail, Chat", count: 3 },
  ],
  parts: [
    app("calendar", "Calendar", "calendar", 0, "4 meetings", "events today"),
    app("mail", "Mail", "mail", 0, "3 need replies", "unread since yesterday"),
    app("chat", "Chat", "chat", 1, "2 mentions", "mentions and direct messages today"),
    app("tracker", "Tracker", "tracker", 1, "5 assigned", "issues assigned to me, due this week"),
  ],
  made: [
    {
      id: "e-plan",
      title: "Today",
      data: d({
        kind: "plan",
        checkable: true,
        steps: [
          { when: "08:30–10:00", title: "Focus: finish the import spec", detail: "Due Thursday; the longest free block of the day", kind: "task" },
          { when: "10:00–10:30", title: "Stand-up", detail: "Platform team", kind: "event", place: "Room 4" },
          { when: "10:30–11:30", title: "Focus: review Noor's pull request", detail: "Blocking the release branch", kind: "task" },
          { when: "11:30–12:15", title: "1:1 with Amara", kind: "event" },
          { when: "13:30–14:30", title: "Design review: shared notebooks", kind: "event", place: "Video call" },
          { when: "14:30–15:30", title: "Replies: 3 emails, 2 mentions", kind: "task" },
          { when: "16:00–16:30", title: "Launch sync", detail: "Bring the pricing page status", kind: "event" },
          { when: "16:30–17:30", title: "Focus: tracker triage", kind: "task" },
        ],
        total: { label: "Meetings", value: "4 · 2h 45m" },
      }),
    },
    {
      id: "e-list",
      title: "To do today",
      data: d({
        kind: "list",
        style: "todo",
        items: [
          { title: "Review Noor's pull request", detail: "Import pipeline: retries", priority: "high", due: "Today", from: { app: "Tracker", who: "Noor", when: "09:12", url: "https://tracker.example/pr/412" } },
          { title: "Reply to Dana about the partner quote", priority: "high", due: "Today", from: { app: "Mail", who: "Dana Okafor", when: "Yesterday", quote: "Can you confirm the wording by Tuesday?" } },
          { title: "Send the import spec for review", due: "Thu", from: { app: "Tracker", who: "You", url: "https://tracker.example/LUM-88" } },
          { title: "Answer Idris in #launch", from: { app: "Chat", who: "Idris", when: "08:47", quote: "Is the pricing page ready for Friday?" } },
          { title: "Approve the expense report", due: "Fri", from: { app: "Mail", who: "Finance" } },
        ],
      }),
    },
    {
      id: "e-calendar",
      title: "This week",
      data: d({
        kind: "plan",
        calendar: true,
        checkable: false,
        steps: [
          { date: "2027-03-01", when: "10:00", title: "Stand-up", kind: "event" },
          { date: "2027-03-01", when: "13:30", title: "Design review", kind: "event" },
          { date: "2027-03-01", when: "16:00", title: "Launch sync", kind: "event" },
          { date: "2027-03-02", when: "09:00", title: "Waitlist email goes out", kind: "milestone" },
          { date: "2027-03-03", when: "11:00", title: "Partner call", kind: "event" },
          { date: "2027-03-04", when: "17:00", title: "Import spec due", kind: "task" },
          { date: "2027-03-05", when: "15:00", title: "Release branch cut", kind: "milestone" },
        ],
      }),
    },
    {
      id: "e-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "4 meetings, 5 things to do",
        text: "Your mornings are free until 10:00, so the **import spec** goes first. Two replies cannot wait past today.",
        figures: [
          { label: "Meetings", value: "4" },
          { label: "Focus time", value: "3h 30m" },
          { label: "Urgent", value: "2" },
        ],
        points: [],
      }),
    },
  ],
};

/* ───────────────────────── F · Deep research (skill: research) ───────────────────────── */
export const deepResearch: SceneSpec = {
  name: "lab-research",
  request: "How do solid-state batteries compare with lithium-ion for electric cars, and when will they reach mass production?",
  inputs: [
    { kind: "skill", label: "Research" },
    { kind: "history", label: "Earlier: EV range research" },
  ],
  parts: [
    {
      id: "chemistry",
      title: "Chemistry",
      helper: "research",
      goal: "Energy density, charging and safety against lithium-ion",
      summary: "6 cited facts",
      at: 0,
      lasts: 45,
      steps: [
        { do: "search", query: "solid-state battery energy density vs lithium-ion" },
        { do: "read", url: "https://batteryjournal.example/reviews/solid-electrolytes", title: "Solid electrolytes: a 2027 review" },
        { do: "read", url: "https://energylab.example/briefs/cell-safety", title: "Cell safety brief — thermal runaway compared" },
      ],
    },
    {
      id: "makers",
      title: "Manufacturers",
      helper: "research",
      goal: "Who is building them and their stated timelines",
      summary: "5 programmes",
      at: 1,
      lasts: 50,
      steps: [
        { do: "search", query: "solid-state battery pilot line production timeline" },
        { do: "read", url: "https://autowire.example/news/pilot-lines", title: "Pilot lines announced this year" },
        { do: "read", url: "https://cellmakers.example/roadmap", title: "Cell makers' public roadmap" },
        { do: "read", url: "https://paywalled.example/report", title: "Industry outlook", failed: true, note: "The page asked for a subscription" },
      ],
    },
    {
      id: "cost",
      title: "Cost",
      helper: "research",
      goal: "Cost per kWh today and projected",
      summary: "3 estimates",
      at: 2,
      lasts: 40,
      steps: [
        { do: "search", query: "solid-state battery cost per kWh projection" },
        { do: "read", url: "https://energystats.example/data/cell-costs", title: "Cell costs per kWh, 2020–2035" },
      ],
    },
    {
      id: "verify",
      title: "Verification",
      helper: "research",
      goal: "Check the two timeline claims that disagree",
      summary: "1 claim corrected",
      at: 60,
      lasts: 25,
      steps: [
        { do: "read", url: "https://cellmakers.example/press/2027-update", title: "Press update: revised pilot schedule" },
        { do: "read", url: "https://standards.example/ev/cell-testing", title: "Cell testing standard — status" },
      ],
    },
  ],
  made: [
    {
      id: "f-sheet",
      title: "Side by side",
      data: d({
        kind: "sheet",
        columns: [
          { label: "Measure", kind: "text" },
          { label: "Lithium-ion", kind: "text" },
          { label: "Solid-state", kind: "text" },
        ],
        rows: [
          { cells: ["Energy density", "250–300 Wh/kg", "350–450 Wh/kg (lab cells)"] },
          { cells: ["Fast charge to 80%", "20–30 min", "10–15 min (claimed)"] },
          { cells: ["Thermal runaway risk", "Present", "Much lower"] },
          { cells: ["Cycle life", "1,500–3,000", "Still being proven"] },
          { cells: ["Cost per kWh", "~$115", "~$400 at pilot scale"] },
        ],
        note: "Sample figures for layout only; not a current market reading.",
      }),
    },
    {
      id: "f-plot",
      title: "Projected cost per kWh",
      data: d({
        kind: "plot",
        style: "line",
        x: { label: "Year", kind: "category" },
        y: { label: "USD per kWh", format: "money", currency: "USD" },
        series: [
          { name: "Lithium-ion", points: [{ x: "2025", y: "118" }, { x: "2027", y: "108" }, { x: "2029", y: "98" }, { x: "2031", y: "90" }, { x: "2033", y: "84" }] },
          { name: "Solid-state", points: [{ x: "2025", y: "520" }, { x: "2027", y: "400" }, { x: "2029", y: "260" }, { x: "2031", y: "170" }, { x: "2033", y: "120" }] },
        ],
        basis: "Projection from one cost dataset (sample data)",
      }),
    },
    {
      id: "f-plan",
      title: "Road to mass production",
      data: d({
        kind: "plan",
        checkable: false,
        steps: [
          { when: "2025", title: "Lab cells pass 1,000 cycles", kind: "milestone" },
          { when: "2027", title: "First pilot lines running", detail: "Low-volume sample cells to carmakers", kind: "event" },
          { when: "2028", title: "Vehicle validation", detail: "Winter testing and crash certification", kind: "task" },
          { when: "2029–2030", title: "Limited production in premium models", kind: "milestone" },
          { when: "After 2032", title: "Cost parity and mass-market volume", detail: "The claim sources disagree on most", kind: "note" },
        ],
      }),
    },
    {
      id: "f-list",
      title: "What is still uncertain",
      data: d({
        kind: "list",
        style: "questions",
        items: [
          { title: "Do lab cycle-life results survive at pack scale?", detail: "No source reports a full pack beyond 800 cycles." },
          { title: "Whose timeline is right?", detail: "One maker says 2028, an industry roadmap says 2030; the newer press update supports 2030." },
          { title: "Will cost fall as projected?", detail: "The projection rests on a single dataset." },
        ],
      }),
    },
    {
      id: "f-doc",
      title: "Research report",
      data: d({
        kind: "document",
        paragraphs: [
          "Solid-state cells replace the liquid electrolyte with a solid one. In the lab that brings higher energy density, faster charging and a much lower fire risk.",
          "## What the evidence supports",
          "Energy density and safety gains are reported consistently across the sources read. Fast-charging figures are manufacturer claims and were not independently tested in what was found.",
          "## Timeline",
          "Pilot lines exist; volume production does not. The most defensible reading is limited premium-model production around 2029–2030, with mass-market volume later.",
          "## Gaps",
          "One industry outlook could not be opened (subscription required). Cost projections rest on a single dataset.",
        ],
      }),
    },
    {
      id: "f-reply",
      title: "",
      data: d({
        kind: "reply",
        headline: "Better on paper, about five years from volume",
        text: "Solid-state cells promise **~40% more energy** and far lower fire risk, but they cost roughly **3× more** today and remain at pilot scale.",
        figures: [
          { label: "Energy density", value: "+40%", note: "lab cells" },
          { label: "Cost today", value: "~3×" },
          { label: "Volume production", value: "2029–30" },
        ],
        points: ["Safety and density gains are well supported", "Charging speed is a maker's claim", "Timelines disagree; the later one is better sourced"],
      }),
    },
  ],
};

/* ───────────────────────── Connection and layout demonstrations ───────────────────────── */
const reply = (id: string, headline: string, body: string) => ({
  id,
  title: "",
  data: d({ kind: "reply", headline, text: body, figures: [], points: [] }),
});
const researcher = (id: string, title: string, at: number, lasts: number, pages = 1) => ({
  id,
  title,
  helper: "research" as const,
  goal: `${title} for the demonstration`,
  summary: `${pages} page${pages === 1 ? "" : "s"}`,
  at,
  lasts,
  steps: Array.from({ length: pages }, (_, index) => ({
    do: "read" as const,
    url: `https://${id}.example/page-${index + 1}`,
    title: `${title} — page ${index + 1}`,
  })),
});

export const demoOneToOne: SceneSpec = {
  name: "demo-one-to-one",
  request: "What is 30 EUR in PLN?",
  parts: [],
  made: [reply("d1-reply", "30 EUR is about 128 PLN", "No parts were needed: the answer stands one fork-width past the request, joined by a single line.")],
};
export const demoOneToMany: SceneSpec = {
  name: "demo-one-to-many",
  request: "Compare four suppliers",
  parts: [researcher("alpha", "Alpha", 0, 30), researcher("beta", "Beta", 1, 30), researcher("gamma", "Gamma", 2, 30), researcher("delta", "Delta", 3, 30)],
  made: [],
};
export const demoManyToOne: SceneSpec = {
  name: "demo-many-to-one",
  request: "Summarise three reports",
  parts: [researcher("north", "North", 0, 30), researcher("south", "South", 1, 30), researcher("east", "East", 2, 30)],
  made: [reply("d3-reply", "Three reports, one conclusion", "Every row of the last column merges on a collector and enters the result at its headline.")],
};
export const demoParallel: SceneSpec = {
  name: "demo-parallel",
  request: "Read three sites in parallel",
  parts: [researcher("track-a", "Track A", 0, 40, 3), researcher("track-b", "Track B", 1, 40, 2), researcher("track-c", "Track C", 2, 40, 4)],
  made: [reply("d4-reply", "Three tracks, read side by side", "Parts whose time spans overlap share a column; each keeps its own row and what it found runs along that row.")],
};
export const demoGrouped: SceneSpec = {
  name: "demo-grouped",
  request: "Gather every source on one topic",
  parts: [researcher("library", "Library", 0, 60, 9)],
  made: [reply("d5-reply", "Nine pages on one row", "A row's finds wrap under themselves past 1080 px, so the result never leaves the view.")],
};
export const demoSequential: SceneSpec = {
  name: "demo-sequential",
  request: "Find, then check, then price",
  parts: [researcher("find", "Find", 0, 20, 2), researcher("check", "Check", 30, 20, 1), researcher("price", "Price", 60, 20, 2)],
  made: [reply("d6-reply", "Three steps, three columns", "A new column begins only with work that started after everything in the last one had ended.")],
};
export const demoMixed: SceneSpec = {
  name: "demo-mixed",
  request: "Two readers, then one writer",
  parts: [researcher("reader-1", "Reader one", 0, 30, 2), researcher("reader-2", "Reader two", 1, 30, 2), researcher("writer-1", "Checker", 40, 20, 1), researcher("writer-2", "Pricer", 41, 20, 1)],
  made: [reply("d7-reply", "Merge, then fork again", "Each column's work merges on the spine and forks on into the next; only the last column reaches the result.")],
};
export const demoBranches: SceneSpec = {
  name: "demo-branches",
  request: "Give me the answer, the data and the next steps",
  parts: [researcher("facts", "Facts", 0, 30, 2)],
  made: [
    {
      id: "d8-sheet",
      title: "The data",
      data: d({
        kind: "sheet",
        columns: [{ label: "Item", kind: "text" }, { label: "Value", kind: "number" }, { label: "Ready", kind: "yes_no" }],
        rows: [{ cells: ["First", "12", "yes"] }, { cells: ["Second", "7", "partial"] }, { cells: ["Third", "3", "no"] }],
      }),
    },
    {
      id: "d8-plot",
      title: "The same data, drawn",
      data: d({
        kind: "plot",
        style: "bar",
        x: { kind: "category" },
        y: { format: "number" },
        series: [{ name: "Value", points: [{ x: "First", y: "12" }, { x: "Second", y: "7" }, { x: "Third", y: "3" }] }],
        basis: "Sample values",
      }),
    },
    {
      id: "d8-list",
      title: "Next steps",
      data: d({ kind: "list", style: "todo", items: [{ title: "Confirm the second value" }, { title: "Collect the missing third" }, { title: "Share the sheet" }] }),
    },
    reply("d8-reply", "One result, several objects", "The result is a board: boardLayout packs its objects into rows by emphasis and width, under the reply."),
  ],
};
