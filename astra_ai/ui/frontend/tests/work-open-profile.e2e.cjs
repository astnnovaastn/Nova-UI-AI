// CPU profile of opening a saved run; prints the functions with the most self time.
// Usage: node tests/work-open-profile.e2e.cjs "<library search>"
const { chromium } = require("@playwright/test");
const [search] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.waitForTimeout(2500);
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(4000);
  const { profile } = await cdp.send("Profiler.stop");
  const self = new Map();
  const dt = profile.timeDeltas;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, i) => {
    const n = byId.get(id); const f = n.callFrame;
    const key = `${f.functionName || "(anon)"} ${(f.url || "").split("/").pop()}:${f.lineNumber}`;
    self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
  });
  const top = [...self.entries()].filter(([k]) => !/^\((idle|program|garbage collector|root)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 18);
  for (const [k, ms] of top) console.log(ms.toFixed(1).padStart(7), "ms ", k);
  await browser.close();
})();
