// Opens a saved run from the Library and counts its drawn strings by relation type. No model or search spend.
// Usage: node tests/work-strands-by-type.e2e.cjs "<library search>" <run id>
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, runId] = process.argv.slice(2);
const run = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../../state/work/runs", runId + ".json"), "utf8"));
const typeOf = Object.fromEntries(run.relations.map((r) => [r.id, r.type]));

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForTimeout(4000);
  const strands = await page.$$eval("g.strand", (rows) => rows.map((g) => (g.getAttribute("data-relations") || "").split(" ").filter(Boolean)));
  const counts = {};
  for (const ids of strands) {
    const types = [...new Set(ids.map((id) => typeOf[id] || "unknown"))].join("+");
    counts[types] = (counts[types] || 0) + 1;
  }
  console.log("strings", strands.length, JSON.stringify(counts));
  await browser.close();
})();
