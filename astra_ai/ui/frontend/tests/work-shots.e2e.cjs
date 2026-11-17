// Screenshots of a saved run, fitted, plus close-ups. No model or search spend.
// Usage: node tests/work-shots.e2e.cjs "<library search>" <output folder> [prefix]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, out = "work-shots", prefix = ""] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  await page.goto("http://127.0.0.1:5173/" + (process.env.AEGIS_DESIGN ? "?aegis-design=" + process.env.AEGIS_DESIGN : ""), { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(4500);
  const name = (n) => path.join(out, `${prefix}${n}.png`);
  await page.screenshot({ path: name("canvas") });
  const nodes = await page.$$eval(".svelte-flow__node", (rows) => rows.map((n) => ({ id: n.getAttribute("data-id"), cls: n.className.replace(/svelte-flow__node\s*/g, "").slice(0, 60), text: (n.innerText || "").replace(/\s+/g, " ").slice(0, 90) })));
  fs.writeFileSync(name("nodes") .replace(/\.png$/, ".json"), JSON.stringify(nodes, null, 1));
  // Close-ups: double size around the middle and the right side.
  const pane = await page.locator(".canvas-card").boundingBox();
  for (const [label, fx] of [["left", 0.3], ["middle", 0.55], ["right", 0.8]]) {
    await page.screenshot({ path: name("zoom-" + label), clip: { x: pane.x + pane.width * fx - 330, y: pane.y + 40, width: 660, height: Math.min(pane.height - 80, 760) } });
  }
  // Real close-ups: zoom the camera in over chosen cards and photograph them at that scale.
  const zoomOver = async (id, steps, file) => {
    const node = page.locator(`.svelte-flow__node[data-id="${id}"]`);
    if (!(await node.count())) return;
    await page.keyboard.press("Escape");
    for (let i = 0; i < 8; i++) {
      const b = await node.boundingBox();
      // Just left of the card: over a sheet, the wheel scrolls the sheet instead of zooming.
      const cx = b.x - 24, cy = b.y + b.height / 2;
      // Pan so the card sits in the middle, then zoom over it.
      await page.mouse.move(cx, cy);
      if (i < steps) {
        await page.keyboard.down("Control");
        await page.mouse.wheel(0, -120);
        await page.keyboard.up("Control");
        await page.waitForTimeout(160);
      }
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: name(file) });
  };
  for (const [id, steps, file] of (process.env.SHOTS || "").split(";").filter(Boolean).map((row) => row.split(","))) await zoomOver(id, +steps, file);
  console.log(nodes.length, "nodes;", errors.length ? "errors: " + errors.join(" | ") : "no page errors");
  await browser.close();
})();
