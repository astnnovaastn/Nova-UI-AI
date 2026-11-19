// V35: Fit view and saved views in AEGIS Desktop (own profile, no model spend).
// Fit view frames every shown card inside the visible part of the pane, centred, at a zoom that follows the content
// (not a fixed 58%); with a side panel open it frames beside the panel; a session reopened after a restart opens
// where it was left. Usage: node tests/desktop-v35-canvas.e2e.cjs <research id> [out]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const [id, out = path.join(os.tmpdir(), "aegis-v35-canvas")] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(probe, timeout = 30000, step = 300) { const end = Date.now() + timeout; for (;;) { const v = await Promise.resolve().then(probe).catch(() => undefined); if (v) return v; if (Date.now() > end) return v; await wait(step); } }
const frontend = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v35-canvas-"));

async function open() {
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  const page = await app.firstWindow();
  await until(() => page.evaluate(() => location.href.startsWith("http")), 60000);
  await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  await wait(2500);
  await page.evaluate((research_id) => window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id } })), id);
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await wait(2500);
  return { app, page };
}
/** Where the cards are on screen and which part of the pane is visible (not under a panel). */
const frame = (page) => page.evaluate(() => {
  const pane = document.querySelector(".aegis-work-stage .svelte-flow").getBoundingClientRect();
  const nodes = [...document.querySelectorAll(".aegis-work-stage .svelte-flow__node")].filter((n) => n.offsetWidth > 1 && n.offsetHeight > 1 && getComputedStyle(n).visibility !== "hidden").map((n) => n.getBoundingClientRect());
  const box = { left: Math.min(...nodes.map((r) => r.left)), top: Math.min(...nodes.map((r) => r.top)), right: Math.max(...nodes.map((r) => r.right)), bottom: Math.max(...nodes.map((r) => r.bottom)) };
  const panel = document.querySelector("[data-dev-workspace].open")?.getBoundingClientRect();
  const zoom = Number((document.querySelector(".svelte-flow__viewport")?.style.transform.match(/scale\(([\d.]+)\)/) || [])[1]);
  return { pane: { left: pane.left, top: pane.top, right: pane.right, bottom: pane.bottom }, box, panel: panel ? { left: panel.left, bottom: panel.bottom } : null, zoom, transform: document.querySelector(".svelte-flow__viewport")?.style.transform };
});
const fit = async (page) => { await page.locator('.aegis-work-stage button[aria-label="Fit view"]').click(); await wait(1400); return frame(page); };

(async () => {
  let app, page;
  try {
    ({ app, page } = await open());
    // Pan far away first, so the fit has real work to do.
    await page.evaluate(() => { const v = document.querySelector(".svelte-flow__pane"); v?.dispatchEvent(new WheelEvent("wheel", { deltaX: 2400, deltaY: 1600, bubbles: true })); });
    await wait(600);
    const f = await fit(page);
    const tol = 6;
    check("1a after Fit view every card is inside the pane", f.box.left >= f.pane.left - tol && f.box.right <= f.pane.right + tol && f.box.top >= f.pane.top - tol && f.box.bottom <= f.pane.bottom + tol, JSON.stringify({ box: f.box, pane: f.pane }));
    const leftGap = f.box.left - f.pane.left, rightGap = f.pane.right - f.box.right;
    check("1b the content is centred horizontally", Math.abs(leftGap - rightGap) < 60 || f.zoom >= 0.999, `left ${Math.round(leftGap)} right ${Math.round(rightGap)} zoom ${f.zoom}`);
    check("1c the zoom follows the content (not a fixed 58%)", f.zoom > 0 && Math.abs(f.zoom - 0.58) > 0.005, String(f.zoom));
    await page.screenshot({ path: path.join(out, "v35-fit.png") });
    // A side panel: the developer workspace bar opened (on runs that have one).
    if (await page.locator("[data-dev-workspace] .bar").count()) {
      await page.locator("[data-dev-workspace] .bar").click();
      await wait(500);
      const g = await fit(page);
      check("2a with a panel open, Fit view frames beside it", g.panel && (g.box.right <= g.panel.left + tol || g.box.top >= g.panel.bottom - tol), JSON.stringify({ box: g.box, panel: g.panel }));
      await page.screenshot({ path: path.join(out, "v35-fit-panel.png") });
      await page.locator("[data-dev-workspace] .bar").click();
    }
    await fit(page);
    // Pan to a chosen view; it must come back after AEGIS restarts.
    await page.evaluate(() => { const v = document.querySelector(".svelte-flow__pane"); v?.dispatchEvent(new WheelEvent("wheel", { deltaX: 300, deltaY: 200, bubbles: true })); });
    await wait(1200);
    const saved = (await frame(page)).transform;
    await page.locator(".aegis-work-stage .svelte-flow__pane").click({ position: { x: 5, y: 300 } }).catch(() => {});
    await wait(500);
    check("3a a click on the canvas does not re-fit or move the view", (await frame(page)).transform === saved, (await frame(page)).transform + " vs " + saved);
    await app.close();
    ({ app, page } = await open());
    const back = (await frame(page)).transform;
    check("3b after restarting AEGIS the session opens where it was left", back === saved, back + " vs " + saved);
  } catch (error) {
    check("run finished", false, error.stack || error);
  } finally {
    await app?.close().catch(() => {});
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 1));
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
