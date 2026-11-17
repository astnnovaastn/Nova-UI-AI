// Panning and zooming smoothness on a saved run: frame times and long main-thread tasks while the
// camera moves. Read-only: the wheel moves the camera only; no card is dragged or saved.
// Usage: node tests/work-pan-perf.e2e.cjs "<library search>"
const { chromium } = require("@playwright/test");
const [search] = process.argv.slice(2);

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
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const w = window;
    w.__perf = { frames: [], long: [] };
    new PerformanceObserver((list) => list.getEntries().forEach((e) => w.__perf.long.push(e.duration))).observe({ type: "longtask", buffered: false });
    let last = performance.now();
    const tick = (now) => { w.__perf.frames.push(now - last); last = now; if (w.__perf.frames.length < 100000) w.__raf = requestAnimationFrame(tick); };
    w.__raf = requestAnimationFrame(tick);
  });
  const pane = await page.locator(".svelte-flow__pane").boundingBox();
  // An empty spot in the middle-left of the pane; the wheel pans, Ctrl+wheel zooms.
  await page.mouse.move(pane.x + 140, pane.y + pane.height / 2);
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(i % 20 < 10 ? 60 : -60, i % 10 < 5 ? 40 : -40); await page.waitForTimeout(16); }
  await page.keyboard.down("Control");
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, i < 8 ? -100 : 100); await page.waitForTimeout(30); }
  await page.keyboard.up("Control");
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    const f = window.__perf.frames.slice(2).sort((a, b) => a - b);
    const pick = (q) => f[Math.min(f.length - 1, Math.floor(q * f.length))];
    return { frames: f.length, p50: +pick(0.5).toFixed(1), p95: +pick(0.95).toFixed(1), worst: +f[f.length - 1].toFixed(1), over50ms: f.filter((x) => x > 50).length, longTasks: window.__perf.long.length, longTaskMs: Math.round(window.__perf.long.reduce((a, b) => a + b, 0)), nodes: document.querySelectorAll(".svelte-flow__node").length };
  });
  console.log(JSON.stringify(result));
  await browser.close();
})();
