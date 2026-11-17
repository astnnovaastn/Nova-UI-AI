// Real video discovery from the canvas's Videos sheet. Spends ONE video search (SerpAPI, then Tavily/Exa
// when SerpAPI is out of quota) on a saved run whose earlier video search failed.
// Usage: node tests/work-videos.live.cjs "<library search>" <output folder>
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, out = "work-videos-shots"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};

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
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(3500);

  const sheet = page.locator('[data-collection="videos"]');
  check("The Videos sheet is on the canvas", (await sheet.count()) === 1);
  const before = await sheet.getAttribute("data-state");
  console.log("state before:", before, "|", (await sheet.locator(".meta").innerText()).trim());
  const node = page.locator('.svelte-flow__node[data-id="collection:videos"]');
  const zoomTo = async () => {
    const b = await node.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.down("Control");
      await page.mouse.wheel(0, -120);
      await page.keyboard.up("Control");
      await page.waitForTimeout(150);
      const c = await node.boundingBox();
      await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    }
    await page.waitForTimeout(500);
  };
  await zoomTo();
  await page.screenshot({ path: path.join(out, "videos-before.png") });

  if (before !== "ready") {
    await sheet.locator("button.find").click();
    // The search runs as a backend job; the report reloads when it ends.
    const end = Date.now() + 120000;
    while (Date.now() < end && (await sheet.getAttribute("data-state")) !== "ready") {
      await page.waitForTimeout(2000);
      if (Date.now() % 10 < 1) console.log("waiting…");
    }
  }
  const state = await sheet.getAttribute("data-state");
  const videos = await sheet.locator("button.video").count();
  check("Real videos arrived on the sheet", state === "ready" && videos > 0, `${state}, ${videos} videos`);
  const rows = await sheet.locator("button.video").evaluateAll((els) => els.map((el) => ({ title: el.title, img: el.querySelector("img")?.src })));
  console.log(JSON.stringify(rows, null, 1));
  check("Every video has a YouTube thumbnail", rows.length && rows.every((row) => /^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\//.test(row.img || "")));
  check("The sheet names the provider that found them", /via (YouTube search|Tavily|Exa)/.test(await sheet.innerText()), (await sheet.locator(".via").innerText().catch(() => "")));
  const strands = await page.$$eval('g.strand[data-target="collection:videos"], g.strand[data-source="collection:videos"]', (gs) => gs.map((g) => `${g.dataset.source} -> ${g.dataset.target} ${g.dataset.status}`));
  check("Videos are joined to the search and to the report", strands.some((s) => s.includes("-> collection:videos complete")) && strands.some((s) => s.startsWith("collection:videos -> paper:")), strands.join(" | "));
  await zoomTo();
  await page.screenshot({ path: path.join(out, "videos-after.png") });
  // Opening a video goes to the Media view with that video.
  await sheet.locator("button.video").first().click();
  await page.waitForTimeout(1500);
  check("Clicking a video opens it in Media", (await page.locator(".research-media:not([hidden]) .research-video").count()) > 0);
  await page.screenshot({ path: path.join(out, "videos-media.png") });
  check("No page errors", !errors.length, errors.join(" | "));
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed.`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
