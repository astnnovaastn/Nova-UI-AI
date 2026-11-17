// Opens a saved research run from the Library (no model or search spend) and reports its canvas
// geometry: every card, its caption, and where every string starts and ends against the cards.
// Usage: node tests/work-layout.inspect.cjs "<library search>" <output folder> [zoom percentages...]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search = "heat pump", out = "work-layout-shots", ...zooms] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 300)));
  let client = "";
  let runId = "";
  page.on("request", (r) => {
    client = r.headers()["x-nova-client"] || client;
    runId = r.url().match(/\/api\/work\/runs\/([0-9a-f]{32})/)?.[1] || runId;
  });
  await page.goto("http://127.0.0.1:5173/" + (process.env.FRESH ? "?aegis-fresh-layout" : ""), { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 15000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 }).catch((e) => { console.log(errors.join(" || ")); throw e; });
  await page.waitForTimeout(3000);
  const geometry = () =>
    page.evaluate(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const nodes = [...document.querySelectorAll(".svelte-flow__node")].map((n) => ({
        id: n.getAttribute("data-id"),
        cls: n.className.replace(/svelte-[\w-]+/g, "").trim().slice(0, 80),
        box: box(n),
        first: n.firstElementChild ? box(n.firstElementChild) : null,
        text: n.innerText.split("\n").slice(0, 2).join(" | ").slice(0, 70),
      }));
      const edges = [...document.querySelectorAll(".svelte-flow__edge")].map((e) => {
        const p = e.querySelector("path");
        const len = p.getTotalLength();
        const ctm = p.getScreenCTM();
        const at = (l) => { const q = p.getPointAtLength(l); return { x: Math.round(q.x * ctm.a + q.y * ctm.c + ctm.e), y: Math.round(q.x * ctm.b + q.y * ctm.d + ctm.f) }; };
        return { id: e.getAttribute("data-id"), source: e.getAttribute("data-source") || "", target: e.getAttribute("data-target") || "", start: at(0), end: at(len) };
      });
      const zoom = document.querySelector(".svelte-flow__viewport")?.style.transform;
      return { nodes, edges, zoom };
    });
  const layout = runId ? await page.evaluate(async ({ runId, client }) => (await fetch(`/api/work/runs/${runId}/layout`, { headers: { "X-Nova-Client": client } })).json(), { runId, client }) : null;
  console.log("run", runId, "saved layout revision", layout?.layout?.revision, "positions", Object.keys(layout?.layout?.positions ?? {}).length);
  const g = await geometry();
  fs.writeFileSync(path.join(out, "geometry.json"), JSON.stringify(g, null, 1));
  await page.screenshot({ path: path.join(out, "open.png") });
  console.log("zoom", g.zoom, "nodes", g.nodes.length, "edges", g.edges.length, "errors", errors.length, [...new Set(errors)].join(" || ").slice(0, 900));
  for (const z of zooms) {
    await page.evaluate((z) => window.dispatchEvent(new CustomEvent("aegis-test-zoom", { detail: +z / 100 })), z);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, `zoom-${z}.png`) });
    fs.writeFileSync(path.join(out, `geometry-${z}.json`), JSON.stringify(await geometry(), null, 1));
  }
  await browser.close();
})();
