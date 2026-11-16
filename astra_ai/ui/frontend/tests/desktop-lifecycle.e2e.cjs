// The resource lifecycle in the real app: hidden source pages are frozen, then released, and
// come back when shown; a page with typed text is never released; a minimized window idles.
// Waits are shortened tenfold (AEGIS_LIFECYCLE_SCALE), so 30 s of idling takes 3 s here.
// Uses a saved research (no model spend), its own app profile, and a few real websites.
// Usage: node tests/desktop-lifecycle.e2e.cjs ["<library search>"]
const { openSourceFromControl } = require("./source-browser-control.cjs");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const [search = "offshore wind"] = process.argv.slice(2);
const SCALE = 0.1;
const results = [];
const check = (name, ok, detail = "") => {
  results.push(!!ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 320) + ")" : ""}`);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(probe, timeout = 30000, step = 300) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await probe().catch(() => undefined);
    if (value) return value;
    if (Date.now() > end) return value;
    await wait(step);
  }
}

(async () => {
  const frontend = path.resolve(__dirname, "..");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-lifecycle-"));
  const app = await electron.launch({
    args: [path.join(frontend, "desktop", "main.cjs")],
    cwd: frontend,
    timeout: 60000,
    env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile, AEGIS_LIFECYCLE_SCALE: String(SCALE), AEGIS_RESOURCE_MODE: "normal", AEGIS_DESKTOP_DEBUG: "1" },
  });
  const page = await app.firstWindow();
  // Why panes came and went, printed only if something fails.
  const trail = [];
  app.process().stderr.on("data", (chunk) => String(chunk).split(/\r?\n/).filter((line) => line.startsWith("[aegis]")).forEach((line) => trail.push(line)));
  page.on("framenavigated", (frame) => frame === page.mainFrame() && trail.push("[page] navigated to " + frame.url().slice(0, 60)));
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

  const state = () => app.evaluate(() => globalThis.aegisDesktopDiagnostics());
  /** One pane's record, found by a piece of its address. */
  const pane = async (part) => (await state()).panes.find((row) => row.url.includes(part));
  const pages = () => app.evaluate(({ webContents }) => webContents.getAllWebContents().length - 1);
  const inPane = (part, script) =>
    app.evaluate(({ BrowserWindow }, { part, script }) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
      const view = win.contentView.children.find((child) => child.webContents.getURL().includes(part));
      return view ? view.webContents.executeJavaScript(script, true) : "no page";
    }, { part, script });

  await page.waitForURL("http://127.0.0.1:5173/**", { timeout: 120000 });
  await page.evaluate(() => { try { sessionStorage.setItem("nova-current-workspace", "research"); } catch {} });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await wait(3000);
  console.log(`web app served by: ${(await state()).uiMode}`);
  check("No timer runs while there are no source pages", (await state()).lifecycle.resources.length === 0);

  const open = async (url, part) => {
    await openSourceFromControl(page, url);
    return until(async () => { const row = await pane(part); return row && row.live && row; }, 30000);
  };
  const loaded = (part) =>
    until(() => app.evaluate(({ BrowserWindow }, part) => {
      const view = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").contentView.children.find((child) => child.webContents.getURL().includes(part));
      return Boolean(view) && !view.webContents.isLoading();
    }, part), 40000);

  // Whether a hidden page really slows down and a frozen one really stops is measured without
  // this harness (tests/desktop-throttle-probe.cjs): Playwright makes every page believe it is
  // focused, which switches both off. Here the manager's decisions are checked.

  // P1 is plain and the oldest. P2 is a page the person has typed into: it must survive everything.
  await open("https://example.org/", "example.org");
  await loaded("example.org");
  check("A shown page is active", (await pane("example.org")).state === "active");
  await open("https://en.wikipedia.org/wiki/Offshore_wind_power", "Offshore_wind_power");
  await loaded("Offshore_wind_power");
  await wait(500);
  check("A covered page goes to the background at once", (await pane("example.org")).state === "background");
  const typed = await inPane("Offshore_wind_power", `(() => { const box = document.querySelector('input[name="search"]'); if (!box) return false; box.value = "typed by the person"; return true; })()`);
  check("(setup) text typed into the second page", typed === true);
  await inPane("Offshore_wind_power", "window.scrollTo(0, 1400); 1");
  await open("https://en.wikipedia.org/wiki/Wind_turbine", "Wind_turbine");
  await loaded("Wind_turbine");
  await inPane("Wind_turbine", "window.scrollTo(0, 2200); 1");
  await open("https://developer.mozilla.org/en-US/docs/Web/HTML", "developer.mozilla.org");
  await loaded("developer.mozilla.org");
  check("Four windows, four live pages to begin with", (await pages()) === 4, await pages());

  // Idle: hidden pages are frozen (30 s, here 3 s).
  const frozen = await until(async () => { const rows = (await state()).panes.filter((row) => !row.visible); return rows.length === 3 && rows.every((row) => row.state === "suspended" && row.frozen) && rows; }, 15000);
  check("Hidden pages are suspended after the idle wait", frozen, JSON.stringify((await state()).panes.map((row) => [row.url.slice(8, 34), row.state])));
  check("The page on show is left alone", (await pane("developer.mozilla.org")).state === "active");

  // Long idle: beyond the warm set of the two most recent hidden pages, a page is released
  // (5 min, here 30 s). The oldest, example.org, is the only one outside the warm set.
  const cold = await until(async () => { const row = await pane("example.org"); return row && !row.live && row.state === "hibernated" && row; }, 60000, 1000);
  check("After a long idle the page outside the warm set is released", cold, JSON.stringify((await state()).panes.map((row) => [row.url.slice(8, 34), row.state, row.live])));
  if (!cold) console.log(trail.slice(-18).join("\n"));
  check("Releasing it ended its process", (await pages()) === 3, await pages());
  check("The warm set stays resident, frozen", ["Offshore_wind_power", "Wind_turbine"].every((part) => true) && (await state()).panes.filter((row) => row.live && row.state === "suspended").length === 2);
  check("The window of a released page is still there", (await page.locator(".browser-layer .pane").count()) === 4);

  // A fifth window: four resident pages, which is the ceiling, so nothing is forced out. The
  // typed-in page is now outside the warm set and its idle time is long past, but it is not safe
  // to release, so it stays.
  await open("https://en.wikipedia.org/wiki/Tidal_power", "Tidal_power");
  await loaded("Tidal_power");
  await wait(5 * 60 * 1000 * SCALE + 12000);
  const kept = await pane("Offshore_wind_power");
  check("A page with typed text is never released, however long it idles", kept.live && kept.state !== "hibernated", JSON.stringify(kept));

  // A sixth window puts the app over its ceiling: the least recently used hidden page that is
  // safe to release goes at once. The typed-in page is passed over; Wind turbine goes.
  await open("https://en.wikipedia.org/wiki/Wave_power", "Wave_power");
  await loaded("Wave_power");
  const forced = await until(async () => { const row = await pane("Wind_turbine"); return row && !row.live && row.state === "hibernated" && row; }, 20000);
  check("Over the ceiling, the oldest safe hidden page is released at once", forced, JSON.stringify((await state()).panes.map((row) => [row.url.slice(8, 34), row.state, row.live])));
  check("...and the typed-in page is passed over again", (await pane("Offshore_wind_power")).live === true);
  check("Six windows, four live pages", (await pages()) === 4 && (await page.locator(".browser-layer .pane").count()) === 6, await pages());
  // Bringing a released page back.
  await openSourceFromControl(page, "https://en.wikipedia.org/wiki/Wind_turbine");
  const back = await until(async () => { const row = await pane("Wind_turbine"); return row && row.live && row.state === "active" && row; }, 30000);
  check("Showing a released page restores it at the same address", back, JSON.stringify(await pane("Wind_turbine")));
  await loaded("Wind_turbine");
  const scroll = await until(async () => { const y = await inPane("Wind_turbine", "window.scrollY"); return y > 1500 && y; }, 8000);
  check("...and at the place it was scrolled to", scroll, await inPane("Wind_turbine", "window.scrollY"));

  // Bringing a frozen page back: instant, with everything as it was.
  await openSourceFromControl(page, "https://en.wikipedia.org/wiki/Offshore_wind_power");
  const woke = await until(async () => { const row = await pane("Offshore_wind_power"); return row && row.state === "active" && !row.frozen && row; }, 15000);
  check("Showing a suspended page wakes it", woke, JSON.stringify(await pane("Offshore_wind_power")));
  check("...with the typed text still there", (await inPane("Offshore_wind_power", `document.querySelector('input[name="search"]').value`)) === "typed by the person");
  check("...and still scrolled where it was", (await inPane("Offshore_wind_power", "window.scrollY")) > 1000, await inPane("Offshore_wind_power", "window.scrollY"));

  // Minimizing the app: nothing is on show, so the page that was showing idles too.
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").minimize());
  const asleep = await until(async () => { const row = await pane("Offshore_wind_power"); return row && row.state === "suspended" && row; }, 15000);
  check("Minimizing the app suspends the page that was showing", asleep, JSON.stringify(await pane("Offshore_wind_power")));
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").restore());
  const awake = await until(async () => { const row = await pane("Offshore_wind_power"); return row && row.state === "active" && !row.frozen && row; }, 15000);
  check("Restoring the app wakes it", awake, JSON.stringify(await pane("Offshore_wind_power")));
  check("The research is still open after all of it", (await page.locator(".svelte-flow__node").count()) > 3);

  while (await page.locator('.pane button[aria-label="Close pane"]').count()) {
    await page.locator('.pane button[aria-label="Close pane"]').last().click({ force: true });
    await wait(400);
  }
  check("Closing every window leaves no page and no timer", (await pages()) === 0 && (await state()).lifecycle.resources.length === 0, await pages());
  check("No page errors", !errors.length, errors.join(" | "));

  const passed = results.filter(Boolean).length;
  if (passed !== results.length) console.log("\n" + trail.join("\n"));
  console.log(`\n${passed}/${results.length} passed.`);
  await app.close();
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(passed === results.length ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
