// The new reader and media cards on a saved run, and Fit view's reading zoom. Read-only.
// Usage: node tests/work-reader-v26.e2e.cjs "<library search>" <out folder>
const path = require("path");
const { chromium } = require("@playwright/test");
const [search, out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(5000);
  const result = {
    media: await page.locator(".svelte-flow__node figure.media").count(),
    videos: await page.locator(".svelte-flow__node figure.media.video").count(),
    images: await page.locator(".svelte-flow__node figure.media.image").count(),
    papers: await page.locator(".svelte-flow__node article.paper").count(),
  };
  await page.screenshot({ path: path.join(out, "reader-canvas.png") });
  const fit = page.locator('.zoom button').first();
  await page.locator('button[title$="(0)"]').first().click();
  await page.waitForTimeout(1200);
  result.zoomAfterFit = await page.evaluate(() => { const t = document.querySelector(".svelte-flow__viewport")?.style.transform || ""; const m = /scale\(([\d.]+)\)/.exec(t); return m ? +(+m[1]).toFixed(2) : null; });
  await page.screenshot({ path: path.join(out, "fit-view.png") });
  const paper = page.locator(".svelte-flow__node article.paper").first();
  if (await paper.count()) {
    await paper.scrollIntoViewIfNeeded().catch(() => {});
    await paper.dblclick({ position: { x: 30, y: 20 } });
    await page.waitForTimeout(1300);
    result.readerOpened = (await page.locator(".lift-body article.paper").count()) > 0;
    result.editButton = (await page.locator(".lift-actions button", { hasText: "Edit report" }).count()) > 0;
    await page.screenshot({ path: path.join(out, "reader-open.png") });
  }
  console.log(JSON.stringify({ ...result, errors }));
  await browser.close();
})();
