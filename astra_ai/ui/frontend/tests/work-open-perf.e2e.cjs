// Main-thread cost of opening a saved run: long tasks from the click until the canvas settles.
// Usage: node tests/work-open-perf.e2e.cjs "<library search>"
const { chromium } = require("@playwright/test");
const [search] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("nova-current-workspace", "research");
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ at: Math.round(e.startTime), ms: Math.round(e.duration) }))).observe({ type: "longtask", buffered: true });
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => { const l = window.__long; window.__long = []; return { count: l.length, ms: l.reduce((a, b) => a + b.ms, 0) }; });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  const t0 = Date.now();
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  const shown = Date.now() - t0;
  await page.waitForTimeout(5000);
  const open = await page.evaluate(() => { const l = window.__long; return { count: l.length, ms: l.reduce((a, b) => a + b.ms, 0), worst: Math.max(0, ...l.map((e) => e.ms)) }; });
  console.log(JSON.stringify({ search, appStartLongTaskMs: before.ms, firstCardsAfterMs: shown, openLongTasks: open.count, openLongTaskMs: open.ms, worstTaskMs: open.worst }));
  await browser.close();
})();
