// Lists every drawn string of a saved run: its ends, relation types and route extent. No model or search spend.
// Usage: node tests/work-strands-dump.e2e.cjs "<library search>" <run id>
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, runId] = process.argv.slice(2);
const runFile = path.join(__dirname, "../../../../state/work/runs", runId + ".json");
const run = fs.existsSync(runFile) ? JSON.parse(fs.readFileSync(runFile, "utf8")) : { relations: [] };
const typeOf = Object.fromEntries(run.relations.map((r) => [r.id, r.type]));

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForTimeout(4500);
  const rows = await page.$$eval("g.strand", (gs) =>
    gs.map((g) => {
      const p = g.querySelector("path.strand-line");
      const box = p.getBBox();
      return { s: g.dataset.source, t: g.dataset.target, ids: (g.dataset.relations || "").split(" "), d: p.getAttribute("d"), box: [box.x, box.y, box.width, box.height].map(Math.round), back: g.classList.contains("back") };
    }),
  );
  const short = (id) => id.replace(/^part:[0-9a-f]+-request:/, "part:").replace(/^[0-9a-f]{32}-request$/, "request").replace(/^paper:.*/, "paper").replace(/^steps:.*/, "steps");
  for (const r of rows) {
    const types = [...new Set(r.ids.map((id) => typeOf[id] || id.split("-")[0]))].join("+");
    const curves = (r.d.match(/C/g) || []).length;
    console.log(`${short(r.s)} -> ${short(r.t)} [${types}] ${r.back ? "BACK " : ""}box=${r.box.join(",")} curves=${curves} lines=${(r.d.match(/L/g) || []).length}`);
  }
  console.log(rows.length, "strings");
  await browser.close();
})();
