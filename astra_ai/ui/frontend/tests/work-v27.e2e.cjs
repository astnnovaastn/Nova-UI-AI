// V27 checks on saved runs. Read-only: opens, hovers and copies only; nothing is moved or saved.
// Usage: node tests/work-v27.e2e.cjs <out folder>
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
  await page.waitForTimeout(4500);
}
const boxes = (page, selector) => page.$$eval(selector, (rows) => rows.map((n) => { const r = n.getBoundingClientRect(); return { id: n.getAttribute("data-id"), x: r.x, y: r.y, w: r.width, h: r.height, text: (n.innerText || "").replace(/\s+/g, " ").slice(0, 50) }; }));
const overlap = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 2;
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 }, permissions: ["clipboard-read", "clipboard-write"] });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const result = {};
  await openRun(page, "architecture");
  // Skills and connections: their rows, at three zoom levels, never overlap.
  for (const [label, steps] of [["fit", 0], ["in", 4], ["out", -3]]) {
    if (steps) {
      const pane = await page.locator(".svelte-flow__pane").boundingBox();
      await page.mouse.move(pane.x + 300, pane.y + 140);
      await page.keyboard.down("Control");
      for (let i = 0; i < Math.abs(steps); i++) { await page.mouse.wheel(0, steps > 0 ? -120 : 120); await page.waitForTimeout(150); }
      await page.keyboard.up("Control");
      await page.waitForTimeout(500);
    }
    const inputs = await boxes(page, '.svelte-flow__node[data-id^="input:"]');
    const labels = await page.$$eval('.svelte-flow__node[data-id^="input:"] *', (els) => els.filter((e) => e.children.length === 0 && (e.textContent || "").trim()).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: e.textContent.trim() }; }));
    let clashes = 0;
    for (let i = 0; i < inputs.length; i++) for (let j = i + 1; j < inputs.length; j++) if (overlap(inputs[i], inputs[j])) clashes++;
    let textClashes = 0;
    for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlap(labels[i], labels[j])) textClashes++;
    result[`inputs_${label}`] = { rows: inputs.map((r) => r.text), clashes, textClashes };
    if (label === "in") await page.screenshot({ path: path.join(out, "v27-skills.png") });
  }
  await openRun(page, "architecture");
  // Helper nodes: compact boxes that end near their words.
  const helpers = await boxes(page, '.svelte-flow__node[data-id*=":part-worker_"]');
  result.helpers = helpers.map((h) => ({ text: h.text, w: Math.round(h.w), h: Math.round(h.h) }));
  const node = page.locator('.svelte-flow__node[data-id*=":part-worker_"]').first();
  if (await node.count()) {
    const before = await page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform);
    await node.dblclick({ position: { x: 20, y: 10 } });
    await page.waitForTimeout(900);
    result.helperDetailOpened = (await page.locator(".lift-layer").count()) > 0;
    result.viewportUnchanged = before === (await page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform));
    await page.screenshot({ path: path.join(out, "v27-helper-detail.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
  // Report images are inside the report, not loose on the canvas.
  result.looseImageCards = await page.locator(".svelte-flow__node figure.media.image").count();
  // Conversation panel.
  await page.click('button[aria-label="Research conversation"]');
  await page.waitForTimeout(1200);
  const panel = page.locator("#research-conversation-panel");
  result.panel = await panel.evaluate((el) => { const r = el.getBoundingClientRect(); const chat = el.querySelector(".research-chat"); return { w: Math.round(r.width), h: Math.round(r.height), messages: el.querySelectorAll(".research-chat article").length, emptyBelow: chat ? Math.round(chat.getBoundingClientRect().bottom - (chat.lastElementChild?.getBoundingClientRect().bottom ?? chat.getBoundingClientRect().top)) : null }; });
  const firstMessage = panel.locator(".research-chat article").first();
  if (await firstMessage.count()) {
    await firstMessage.hover();
    await page.waitForTimeout(250);
    await firstMessage.locator(".chat-tool").click();
    await page.waitForTimeout(200);
    result.copyLabel = await firstMessage.locator(".chat-tool").textContent();
  }
  await panel.locator(".chat-menu-button").click();
  await page.waitForTimeout(200);
  result.menuItems = await panel.locator('[role="menuitem"]').allTextContents();
  await page.screenshot({ path: path.join(out, "v27-conversation.png") });
  await page.keyboard.press("Escape");
  console.log(JSON.stringify({ ...result, errors }));
  await browser.close();
})();
