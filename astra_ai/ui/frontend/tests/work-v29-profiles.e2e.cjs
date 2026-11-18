// V29 board profiles and typed Zephium objects, drawn on a saved run. The run's record is changed in
// this browser only (no model, no backend write, no live run): its canvas_objects become V29 `zephium`
// objects and its plan gets a route, so the canvas's real renderers and board layout are checked.
// Picture addresses are a test host answered in the browser (one candidate fails on purpose).
// Usage: node tests/work-v29-profiles.e2e.cjs <out folder> ["<library search>"]
// Needs the backend (8340) and the ui server (5173, serving dist/) running.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { chromium } = require("@playwright/test");
const [out = ".", search = "Daily Schedule"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

// A solid-colour PNG, so pictures load without the network.
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function png(w, h, [r, g, b]) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => [r, g, b][i % 3])]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(Array(h).fill(row)))), chunk("IEND", Buffer.alloc(0))]);
}
const COLOURS = { warm: [196, 120, 82], stone: [150, 146, 138], ink: [40, 44, 52], sand: [222, 205, 170], moss: [96, 120, 80], rust: [160, 70, 40] };
const IMG = "https://img.v29-test.invalid/";

const z = (id, zkind, title, data, extra = {}) => ({ id, kind: "zephium", zkind, title, revision: 1, task_id: "compose", status: "complete", sources: [], data, ...extra });
const pick = (name, colours, extra = {}) => ({ name, subtitle: "Studio reference", url: "https://example.org/" + name.toLowerCase().replace(/\W+/g, "-"), image_candidates: colours.map((c) => IMG + c + ".png"), tags: ["grain", "serif"], why: "Warm, tactile and calm.", recommended: false, facts: [], ...extra });

const SCENARIOS = {
  moodboard: {
    route: { intent: "moodboard", capabilities: ["browse"], outputs: ["picks", "reply"], board: "visual", report: false, needs_web: true, paid_allowed: false },
    objects: [
      z("v29-mood-reply", "reply", "Direction", { headline: "Warm brutalism", text: "Concrete, grain and a serif with character.", figures: [], points: [{ label: "Palette", text: "Clay, stone, ink" }, { label: "Type", text: "High-contrast serif" }, { label: "Avoid", text: "Glossy gradients" }] }),
      z("v29-mood-picks-a", "picks", "Are.na — warm brutalism", { facet: "other", items: [pick("Concrete stair", ["missing", "warm"], { recommended: true }), pick("Grain poster", ["stone"]), pick("Ink type", ["ink"])] }, { part: "worker_a" }),
      z("v29-mood-picks-b", "picks", "Open sources — texture", { facet: "other", items: [pick("Sand wall", ["sand"]), pick("Moss tile", ["moss"]), pick("Rust plate", ["rust"])] }, { part: "worker_b" }),
    ],
  },
  "map-a-project": {
    route: { intent: "map_project", capabilities: ["files"], outputs: ["project", "diagram"], board: "technical", report: false, needs_web: false, paid_allowed: false },
    objects: [
      z("v29-tech-list", "list", "Next steps", { style: "todo", items: [{ title: "Add a test for pricing" }, { title: "Document the queue" }] }),
      z("v29-tech-code", "code", "booking.ts", { language: "typescript", text: "export function book() {\n  return 1;\n}", notes: [{ from: 1, to: 1, text: "Entry point" }] }),
      z("v29-tech-diagram", "diagram", "How a booking travels", { layers: [{ id: "api", name: "API" }, { id: "data", name: "Data" }], nodes: [{ id: "web", name: "Web app", kind: "client" }, { id: "api", name: "API", kind: "service", layer: "api" }, { id: "pg", name: "PostgreSQL", kind: "store", layer: "data" }], edges: [{ from: "web", to: "api" }, { from: "api", to: "pg", label: "SQL" }] }),
      z("v29-tech-project", "project", "tidewater", { name: "tidewater", summary: "A harbour booking platform.", root: "/code/tidewater", stack: [{ name: "SvelteKit", host: "svelte.dev", role: "Frontend" }, { name: "PostgreSQL", host: "postgresql.org" }], tree: [{ path: "apps", kind: "folder" }, { path: "apps/web", kind: "folder", more: 61 }, { path: "package.json", kind: "file" }], scripts: [{ name: "test", command: "vitest run", source: "package.json" }] }),
    ],
  },
  "plan-my-day": {
    route: { intent: "plan_day", capabilities: [], outputs: ["plan", "list"], board: "schedule", report: false, needs_web: false, paid_allowed: false },
    objects: [
      z("v29-day-list", "list", "Bring", { style: "todo", items: [{ title: "Laptop charger" }, { title: "Dentist card" }] }),
      z("v29-day-plan", "plan", "Tomorrow", { checkable: true, calendar: false, steps: [{ when: "07:00", title: "Wake up", kind: "task" }, { when: "09:00", title: "Dentist", kind: "event", place: "Clinic" }, { when: "11:00", title: "Budget report", kind: "task" }] }),
      z("v29-day-draft", "draft", "Note to the clinic", { destination: "email", to: "clinic@example.org", subject: "Tomorrow 9:00", body: "Confirming my appointment." }),
    ],
  },
};

let current = null;
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.stack || e).slice(0, 500)));
  const pictureRequests = [];
  await page.route(IMG + "**", async (route) => {
    const name = route.request().url().slice(IMG.length).replace(/\.png$/, "");
    pictureRequests.push({ name, referer: route.request().headers()["referer"] || "" });
    if (!COLOURS[name]) return route.fulfill({ status: 404, body: "" });
    await route.fulfill({ status: 200, contentType: "image/png", body: png(64, 48, COLOURS[name]) });
  });
  await page.route(/\/api\/work\/runs\/[0-9a-f]{32}$/, async (route) => {
    if (route.request().method() !== "GET" || !current) return route.continue();
    const response = await route.fetch();
    let body = await response.text();
    try {
      const data = JSON.parse(body);
      if (data.run) {
        data.run.canvas_objects = current.objects;
        data.run.plan = { ...(data.run.plan || {}), route: current.route };
        body = JSON.stringify(data);
      }
    } catch {}
    await route.fulfill({ response, body });
  });
  async function openRun() {
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
    await page.click('.aegis-work-stage button[aria-label="Research library"]');
    await page.locator('#research-history-panel input[type="search"]').fill(search);
    await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
    if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
    await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
    await page.waitForTimeout(5000);
  }
  const results = {};
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    current = scenario;
    await openRun();
    const nodes = await page.$$eval(".svelte-flow__node", (all) =>
      all.map((n) => { const r = n.getBoundingClientRect(); return { id: n.dataset.id || "", x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }),
    );
    const board = nodes.filter((n) => /-object-v29-/.test(n.id)).map((n) => ({ ...n, kind: n.id.replace(/^.*-object-v29-[a-z]+-/, "") }));
    const lefts = [];
    for (const n of board) if (!lefts.some((x) => Math.abs(x - n.x) < 8)) lefts.push(n.x);
    const order = [...board].sort((a, b) => a.y - b.y || a.x - b.x).map((n) => n.kind);
    // Scroll each picture into view so lazy pictures load, then count the loaded ones.
    const imgs = page.locator(".svelte-flow__node .pick .photo.remote img");
    const imgCount = await imgs.count();
    const attrs = imgCount ? await imgs.first().evaluate((i) => ({ loading: i.getAttribute("loading"), referrerpolicy: i.getAttribute("referrerpolicy") })) : null;
    await page.waitForTimeout(1500);
    const loaded = await imgs.evaluateAll((all) => all.filter((i) => i.complete && i.naturalWidth > 0).length);
    results[name] = {
      board: scenario.route.board,
      reportCards: nodes.filter((n) => /-report$/.test(n.id)).length,
      replyHead: nodes.some((n) => /-object-v29-[a-z]+-reply$/.test(n.id)),
      boardObjects: board.length,
      columns: lefts.length,
      order,
      pickImgs: imgCount,
      pickImgsLoaded: loaded,
      imgAttrs: attrs,
    };
    await page.screenshot({ path: path.join(out, `v29-${name}.png`) });
  }
  const checks = {
    moodboardPicksHaveImg: results.moodboard.pickImgs > 0,
    moodboardLazyNoReferrer: results.moodboard.imgAttrs?.loading === "lazy" && results.moodboard.imgAttrs?.referrerpolicy === "no-referrer",
    noReportCardWhenReportFalse: Object.values(results).every((r) => r.reportCards === 0),
    technicalOrderProjectFirst: results["map-a-project"].order[0] === "project",
    scheduleOrderPlanBeforeList: results["plan-my-day"].order.indexOf("plan") < results["plan-my-day"].order.indexOf("list"),
    profilesDiffer: new Set(Object.values(results).map((r) => `${r.columns}|${r.order.join(",")}`)).size === Object.keys(results).length,
    failedCandidateFellBack: pictureRequests.some((r) => r.name === "missing") && pictureRequests.some((r) => r.name === "warm"),
    noReferrerSent: pictureRequests.every((r) => !r.referer),
  };
  const passed = Object.values(checks).every(Boolean) && !errors.length;
  console.log(JSON.stringify({ passed, checks, results, pictureRequests: pictureRequests.length, errors }, null, 1));
  await browser.close();
  process.exit(passed ? 0 : 1);
})();
