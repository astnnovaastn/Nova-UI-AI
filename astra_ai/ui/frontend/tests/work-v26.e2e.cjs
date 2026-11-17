// V26 checks on saved runs. Read-only: hover, open and close only; the editor is opened and left
// without typing, so no saved report changes.
// Usage: node tests/work-v26.e2e.cjs <out folder>
const path = require("path");
const { chromium } = require("@playwright/test");
const [out] = process.argv.slice(2);
async function openRun(page, search) {
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(5000);
}
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.stack || e).slice(0, 700)));
  const result = {};

  // 1. Websites: one row per site; a stack only holds pages of one site.
  await openRun(page, "architecture");
  result.siteRows = await page.$$eval(".svelte-flow__node", (nodes) => nodes.filter((n) => /^part:/.test(n.dataset.id || "") && n.querySelector(".page")).map((n) => (n.innerText || "").split("\n")[0].trim()).slice(0, 12));
  result.stacks = await page.$$eval(".svelte-flow__node .stack-toggle", (rows) => rows.map((r) => r.textContent.trim()));
  await page.screenshot({ path: path.join(out, "v26-sites.png") });
  const stack = page.locator(".svelte-flow__node").filter({ has: page.locator(".stack-toggle") }).locator(".stack").first();
  if (await stack.count()) {
    const box = await stack.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(900);
    const pages = await page.locator(".source-stack-fan .page").evaluateAll((rows) => rows.map((row) => { const r = row.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; }));
    result.stackHosts = await page.locator(".source-stack-fan .page").evaluateAll((rows) => rows.map((row) => (row.innerText || "").split(String.fromCharCode(10))[0].trim()));
    result.stackHorizontal = pages.length > 1 && pages.every((p) => Math.abs(p.y - pages[0].y) < 6) && new Set(pages.map((p) => p.x)).size > 1;
    await page.screenshot({ path: path.join(out, "v26-stack-hover.png") });
    await page.mouse.move(5, 500);
  }

  // 2. Videos, report reader, editor. The report's one video is joined, in this browser only, by nine
  // sample entries so the collection can be checked with ten videos; nothing is saved.
  await page.route("**/api/research/*/document*", async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    try {
      const data = JSON.parse(body);
      const target = data;
      const ids = ["dQw4w9WgXcQ", "9bZkp7q19f0", "kJQP7kiw5Fk", "JGwWNGJdvx8", "OPf0YbXqDm0", "RgKAFK5djSk", "fJ9rUzIMcZQ", "hT_nvWreIhg", "CevxZvSJLk8"];
      target.media = [...(target.media ?? []), ...ids.map((id, i) => ({ id: "test-" + id, video_id: id, url: "https://www.youtube.com/watch?v=" + id, title: "Sample video " + (i + 2), channel: "Test channel", provider: "youtube" }))];
      body = JSON.stringify(data);
    } catch {}
    await route.fulfill({ response, body });
  });
  await openRun(page, "solid-state");
  const videos = page.locator(".svelte-flow__node figure.media.collection");
  result.videoCollections = await videos.count();
  result.videoLabel = (await page.locator(".collection-label").first().textContent().catch(() => "")) || "";
  if (result.videoCollections) {
    const box = await videos.first().boundingBox();
    await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
    await page.waitForTimeout(800);
    result.videoStripVisible = await page.locator(".strip").first().evaluate((s) => getComputedStyle(s).opacity === "1");
    result.videoClips = await page.locator(".strip .clip").count();
    result.clipWidthVsPrimary = await page.evaluate(() => { const f = document.querySelector(".media.collection .screen"); const c = document.querySelector(".strip .clip"); return f && c ? +(c.getBoundingClientRect().width / f.getBoundingClientRect().width).toFixed(2) : null; });
    await page.screenshot({ path: path.join(out, "v26-videos.png") });
    await page.mouse.move(5, 500);
  }
  const paper = page.locator(".svelte-flow__node article.paper").first();
  await paper.dblclick({ position: { x: 30, y: 20 } });
  await page.waitForTimeout(2500);
  result.reader = await page.locator(".report-reader").count();
  result.readerFigures = await page.locator(".report-reader figure[data-image] img").count();
  result.figureSizes = await page.$$eval(".report-reader figure[data-size]", (f) => f.map((x) => x.dataset.size));
  result.figureGallery = await page.locator(".report-reader .figure-gallery").count();
  await page.screenshot({ path: path.join(out, "v26-reader.png") });
  await page.locator(".report-reader figure[data-image]").first().scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: path.join(out, "v26-reader-figure.png") });
  await page.locator(".lift-actions button", { hasText: "Edit report" }).click();
  await page.waitForTimeout(2500);
  result.editHeader = await page.locator(".report-edit-head").count();
  result.oldTabsVisible = await page.locator('nav[aria-label="Report views"]').isVisible().catch(() => false);
  result.editorPresent = await page.locator(".research-editor").count();
  await page.screenshot({ path: path.join(out, "v26-editor.png") });
  await page.locator(".report-edit-back").click();
  await page.waitForTimeout(2500);
  result.backToReader = await page.locator(".report-reader").count();
  result.editHeaderAfterBack = await page.locator(".report-edit-head").count();
  console.log(JSON.stringify({ ...result, errors }));
  await browser.close();
})();
