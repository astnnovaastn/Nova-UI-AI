// V25 visual checks on a saved run: the source stack fans straight down on hover, and the
// conversation panel's size. Read-only: hover and open only; nothing is dragged or saved.
// Usage: node tests/work-v25-visual.e2e.cjs "<library search>" <out folder>
const path = require("path");
const fs = require("fs");
const { chromium } = require("@playwright/test");
const [search, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
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
  await page.waitForTimeout(3500);
  const stack = page.locator(".svelte-flow__node .stack").first();
  const result = { stacks: await page.locator(".svelte-flow__node .stack").count() };
  if (result.stacks) {
    const box = await stack.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(900);
    const fanned = (await page.locator(".source-stack-fan").count()) ? page.locator(".source-stack-fan .page") : stack.locator(".page");
    result.overlay = (await page.locator(".source-stack-fan").count()) > 0;
    const pages = await fanned.evaluateAll((rows) => rows.map((row) => { const r = row.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; }));
    result.fan = pages;
    result.straightDown = pages.length > 1 && pages.every((p) => Math.abs(p.x - pages[0].x) < 4) && pages.slice(1).every((p, i) => p.y > pages[i].y);
    await page.screenshot({ path: path.join(out, "stack-hover.png") });
    await page.mouse.move(5, 500);
  }
  // Scrollbars: any element on the page that draws a visible scrollbar.
  result.visibleScrollbars = await page.evaluate(() => [...document.querySelectorAll("*")].filter((el) => {
    const s = getComputedStyle(el);
    const scrolls = (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(s.overflowY)) || (el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(s.overflowX));
    return scrolls && (el.offsetWidth - el.clientWidth > 1 || el.offsetHeight - el.clientHeight > 1) && s.scrollbarWidth !== "none";
  }).length);
  console.log(JSON.stringify({ ...result, fan: undefined, fanCount: result.fan?.length, errors }));
  await browser.close();
})();
