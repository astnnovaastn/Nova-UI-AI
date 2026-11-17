// The sent request shows at once. The start request is intercepted in the browser and never
// reaches the backend (no run, no model call): it is held, then refused, so the placeholder's
// appearance and its removal on failure are both observed.
const path = require("path");
const { chromium } = require("@playwright/test");
const [out] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  let intercepted = 0;
  await page.route("**/api/work/runs", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    intercepted++;
    await new Promise((r) => setTimeout(r, 2500));
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Test: start refused" }) });
  });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.waitForTimeout(2500);
  // A fresh canvas: the composer starts new work.
  const box = page.locator(".bar-dock textarea").first();
  await box.fill("Compare three note-taking apps for students");
  const t0 = Date.now();
  await box.press("Enter");
  let shownAfter = null;
  try { await page.locator(".svelte-flow__node", { hasText: "Compare three note-taking apps" }).first().waitFor({ timeout: 2000 }); shownAfter = Date.now() - t0; } catch {}
  await page.screenshot({ path: path.join(out, "instant-send.png") });
  await page.waitForTimeout(3500);
  const stillShown = await page.locator(".svelte-flow__node", { hasText: "Compare three note-taking apps" }).count();
  console.log(JSON.stringify({ intercepted, requestCardAfterMs: shownAfter, placeholderRemovedAfterFailure: stillShown === 0 }));
  await browser.close();
})();
