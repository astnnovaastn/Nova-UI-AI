// The construction hand on a saved run, with no model or search spend: reopen from the Library,
// check nothing replays by itself, then press Replay build and watch the hand place and connect.
// Usage: node tests/work-replay.e2e.cjs "<library search text>" <output folder>
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search = "solid-state", out = "work-replay-shots"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 240) + ")" : ""}`);
};

/** Records, as they happen, whether the hand showed and whether a card was held back for it. */
function watch() {
  window.__seen = { hand: 0, pending: 0, drawing: 0 };
  new MutationObserver(() => {
    if (document.querySelector(".hand.visible")) window.__seen.hand++;
    if ([...document.querySelectorAll("style")].some((s) => s.textContent.includes("opacity:0!important"))) window.__seen.pending++;
    if (document.querySelector('g.strand path.strand-line[stroke-dasharray="1"]')) window.__seen.drawing++;
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  for (const reduced of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(reduced ? { reducedMotion: "reduce" } : {}) });
    await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
    await context.addInitScript(watch);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
    await page.click('.aegis-work-stage button[aria-label="Research library"]');
    await page.locator('#research-history-panel input[type="search"]').fill(search);
    await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 15000 });
    if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
    await page.waitForSelector("g.strand", { timeout: 40000 });
    await page.waitForTimeout(2000);
    const label = reduced ? "[reduced motion] " : "";
    const opened = await page.evaluate(() => ({ ...window.__seen }));
    check(label + "Opening a saved run replays nothing", opened.hand === 0 && opened.pending === 0, JSON.stringify(opened));
    const strands = await page.locator("g.strand").count();
    await page.evaluate(() => (window.__seen = { hand: 0, pending: 0, drawing: 0 }));
    await page.getByRole("button", { name: "Replay build" }).click();
    // Let the hand reach its first string (short runs place a few cards first), then take over.
    if (reduced) await page.waitForTimeout(1500);
    else await page.waitForFunction(() => window.__seen.drawing > 0, null, { timeout: 8000 }).catch(() => {});
    if (!reduced) await page.screenshot({ path: path.join(out, "replay-mid.png") });
    const busy = await page.locator(".construction-controls .count").count();
    if (!reduced) {
      // Taking over ends the playback at once.
      const box = await page.locator(".canvas-card").boundingBox();
      await page.mouse.click(box.x + 20, box.y + box.height - 120);
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => [...document.querySelectorAll("style")].some((s) => s.textContent.includes("opacity:0!important")));
      check("Clicking the canvas ends the playback at once", busy > 0 && !after && !(await page.locator(".hand.visible").count()), `busy=${busy}`);
    }
    const seen = await page.evaluate(() => ({ ...window.__seen }));
    if (reduced) check(label + "Replay shows everything with no hand", seen.hand === 0 && seen.pending === 0, JSON.stringify(seen));
    else {
      check("Replay: the hand appears", seen.hand > 0, JSON.stringify(seen));
      check("Replay: cards wait for the hand", seen.pending > 0);
      check("Replay: strings are drawn along their length", seen.drawing > 0);
    }
    await page.waitForTimeout(1000);
    check(label + "Every string is back after playback", (await page.locator("g.strand").count()) === strands, `${await page.locator("g.strand").count()} of ${strands}`);
    check(label + "No page errors", !errors.length, errors.join(" | "));
    await context.close();
  }
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed.`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
