// Opens a saved run in the Zephium design, photographs it, then opens one result card in the
// centre (Lift + ObjectCentre) and photographs that. Read-only: nothing is moved or saved.
// Usage: node tests/work-zephium-open.e2e.cjs "<library search>" "<card text>" <output folder> [prefix]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, cardText, out = "work-shots", prefix = ""] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).nth(Number(process.env.ROW || 0)).click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(4000);
  const name = (n) => path.join(out, `${prefix}${n}.png`);
  await page.screenshot({ path: name("canvas") });
  const nodes = await page.$$eval(".svelte-flow__node", (rows) =>
    rows.map((n) => {
      const r = n.getBoundingClientRect();
      return { id: n.getAttribute("data-id"), text: (n.innerText || "").replace(/\s+/g, " ").slice(0, 70), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }),
  );
  // Overlaps between cards, in screen pixels (a card inside another's box counts).
  const overlaps = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (w > 4 && h > 4) overlaps.push(`${a.id} × ${b.id}`);
    }
  fs.writeFileSync(path.join(out, `${prefix}nodes.json`), JSON.stringify({ nodes, overlaps }, null, 1));
  let opened = "not tried";
  if (cardText) {
    const card = page.locator(".svelte-flow__node").filter({ hasText: cardText }).first();
    if (await card.count()) {
      await card.dblclick({ position: { x: 20, y: 12 } });
      await page.waitForTimeout(1200);
      const lift = await page.locator(".lift-body").count();
      opened = lift ? "opened in the centre" : "no centre view appeared";
      await page.screenshot({ path: name("opened") });
    } else opened = "card not found";
  }
  console.log(nodes.length, "nodes;", overlaps.length, "overlaps;", "open:", opened, ";", errors.length ? "errors: " + errors.join(" | ") : "no page errors");
  await browser.close();
})();
