// SUPERSEDED by desktop-v32-browser.e2e.cjs (V32 replaced the tab strip with the Zephium sidebar).
// V31 AEGIS Desktop browser, in the real Electron app with its own profile (never the person's). Follows the
// V31 brief's §29 flow: new tab page, URL, one Google search, another engine, second tab, Work and back,
// a research source's "Open in browser" into an AEGIS tab and back to the same canvas, minimize and restore,
// restart with tabs, settings and sign-in cookies kept, Focus and Today, real tracker blocking, and no
// unexpected windows. Loads real public websites; no model spend, no sign-in typed anywhere.
// Usage: node tests/desktop-v31-browser.e2e.cjs [output folder] ["<library search for a saved research run>"]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");
const { openSourceFromControl } = require("./source-browser-control.cjs");

const [out = "v31-desktop-shots", search = "offshore wind"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
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
const frontend = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v31-"));

async function launch() {
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000, env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  const page = await app.firstWindow();
  await until(() => page.evaluate(() => location.href.startsWith("http")), 60000);
  await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  return { app, page };
}
const diagnostics = (app) => app.evaluate(() => globalThis.aegisDesktopDiagnostics());
const tabPanes = async (app) => (await diagnostics(app)).panes.filter((pane) => pane.kind === "tab");
const sourcePanes = async (app) => (await diagnostics(app)).panes.filter((pane) => pane.kind === "source");
const visibleWindows = (app) => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((w) => w.isVisible()).length);
const focused = (page) => until(() => page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Address or search"), 4000);
const settled = (app, part, timeout = 30000) => until(() => app.evaluate(({ BrowserWindow }, part) => {
  const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
  const view = win.contentView.children.find((v) => v.webContents.getURL().includes(part));
  return Boolean(view && !view.webContents.isLoading());
}, part), timeout);
const cpu = (app) => app.evaluate(({ app }) => app.getAppMetrics().reduce((sum, m) => sum + m.cpu.percentCPUUsage, 0));
const memory = (app) => app.evaluate(({ app }) => Math.round(app.getAppMetrics().reduce((sum, m) => sum + (m.memory.privateBytes ?? m.memory.workingSetSize), 0) / 1024));

async function shot(app, name) {
  const png = await app.evaluate(async ({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
    const size = win.getContentBounds();
    const base = (await win.webContents.capturePage()).toDataURL();
    const layers = [];
    for (const view of win.contentView.children) if (view.getVisible()) layers.push({ bounds: view.getBounds(), data: (await view.webContents.capturePage()).toDataURL() });
    const helper = new BrowserWindow({ show: false, width: 200, height: 200 });
    await helper.loadURL("about:blank");
    const composed = await helper.webContents.executeJavaScript(`(async () => {
      const W = ${size.width}, H = ${size.height}, BASE = ${JSON.stringify(base)}, LAYERS = ${JSON.stringify(layers)};
      const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
      const g = canvas.getContext("2d");
      const load = (src) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = src; });
      g.drawImage(await load(BASE), 0, 0, W, H);
      for (const layer of LAYERS) g.drawImage(await load(layer.data), layer.bounds.x, layer.bounds.y, layer.bounds.width, layer.bounds.height);
      return canvas.toDataURL("image/png");
    })()`);
    helper.destroy();
    return composed;
  }).catch(() => "");
  if (png) fs.writeFileSync(path.resolve(out, name + ".png"), Buffer.from(png.split(",")[1], "base64"));
}

(async () => {
  let { app, page } = await launch();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  let client = "";
  page.on("request", (request) => { client = request.headers()["x-nova-client"] || client; });

  // Open a saved research canvas first: the Work session the browser must leave untouched.
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await wait(1500);
  const title = await page.locator(".canvas-top .title span").first().innerText();
  const camera = await page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform ?? "");
  check("0 a saved research canvas is open", title, title);
  check("0b Windows' own window buttons are kept (title bar overlay)", await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMaximizable()));
  check("0c the rail has AEGIS Work and Browser buttons", (await page.locator('.rail button[aria-label="AEGIS Work"]').count()) === 1 && (await page.locator('.rail button[aria-label="Browser"]').count()) === 1);

  // 1–2. New tab page.
  await page.locator("button.new-tab").first().click();
  await until(() => page.locator(".browser.shown .newtab").count(), 5000);
  check("1 + opens the AEGIS new tab page", await page.locator(".browser.shown .newtab").count());
  check("2 its search field has the keyboard", await focused(page));
  await until(() => page.locator(".newtab canvas").count(), 8000);
  check("2b the sky is drawn (Zephium's sky print)", await page.locator(".newtab canvas").count(), JSON.stringify(await page.evaluate(() => { const n = document.querySelector(".newtab"); return { w: n?.clientWidth, h: n?.clientHeight, page: !!n?.querySelector(".page"), sky: !!n?.querySelector(".sky"), settings: localStorage.getItem("aegis-browser-settings-v1") }; })));
  const mark = await page.locator(".newtab").getByRole("img", { name: "AEGIS", exact: true }).isVisible();
  const when = await page.locator(".newtab .when").innerText().catch(() => "");
  check("2c the AEGIS name, the time and the date", mark && /\d/.test(when) && new RegExp(new Date().toLocaleDateString(undefined, { weekday: "long" }), "i").test(when), when);
  const field = await page.locator(".newtab .notch-field").boundingBox();
  const env = await page.locator(".environment").boundingBox();
  check("2d the field floats at the top centre", field && env && Math.abs(field.x + field.width / 2 - (env.x + env.width / 2)) < 4 && field.y - env.y < 70, JSON.stringify(field));
  check("2e profile and settings sit in round controls", (await page.locator('.newtab .round[aria-label="Browser profile"]').count()) && (await page.locator('.newtab .round[aria-label="Browser settings"]').count()));
  check("2f no tab page exists until something is opened", (await tabPanes(app)).length === 0);
  await wait(800);
  await shot(app, "v31-new-tab");

  // 3. A URL.
  await page.keyboard.type("en.wikipedia.org/wiki/Cloud");
  await page.keyboard.press("Enter");
  const wiki = await until(async () => (await tabPanes(app)).find((p) => p.url.includes("wikipedia.org/wiki/Cloud") && p.visible), 30000);
  check("3 an address opens that page", wiki, wiki?.url);
  await settled(app, "wikipedia.org/wiki/Cloud");

  // 4. One Google search (repeated automated searches trigger Google's check page).
  await page.locator(".browser.shown .bar input[aria-label='Address or search']").click();
  await page.keyboard.type("cumulus cloud formation");
  await page.keyboard.press("Enter");
  const google = await until(async () => (await tabPanes(app)).find((p) => /google\.[a-z.]+\/(search|sorry)/.test(p.url)), 30000);
  check("4 a search opens Google's results page", google, google?.url);
  await wait(1500);
  await shot(app, "v31-google-results");

  // 5. Another engine from the field's own menu.
  await page.locator(".browser.shown .bar .engine").click();
  await page.locator(".browser.shown .bar .menu button", { hasText: "DuckDuckGo" }).click();
  await page.keyboard.type("stratus clouds");
  await page.keyboard.press("Enter");
  const ddg = await until(async () => (await tabPanes(app)).find((p) => p.url.startsWith("https://duckduckgo.com/")), 30000);
  check("5 the engine menu switches the search engine", ddg, ddg?.url);

  // 6–7. A second tab and switching.
  await page.locator(".browser.shown .strip .add").click();
  check("6 the strip's round + opens a second (new) tab", (await page.locator(".browser.shown .strip .tab").count()) === 2 && (await page.locator(".browser.shown .newtab").count()) === 1);
  check("6b its field has the keyboard", await focused(page));
  await page.keyboard.type("www.theverge.com");
  await page.keyboard.press("Enter");
  const verge = await until(async () => (await tabPanes(app)).find((p) => p.url.includes("theverge.com") && p.visible), 30000);
  check("6c the second tab opens its own page", verge, verge?.url);
  await settled(app, "theverge.com", 45000);
  await wait(3000);
  await page.locator(".browser.shown .strip .tab .pick").first().click();
  const switched = await until(async () => { const rows = await tabPanes(app); const visible = rows.filter((p) => p.visible); return visible.length === 1 && visible[0].url.includes("duckduckgo") && visible[0]; }, 8000);
  check("7 switching tabs shows only that tab's page", switched, switched?.url);

  // 21. Real tracker blocking (counted from requests the desktop cancelled).
  const status = await page.evaluate(() => window.aegisDesktop.invoke("blocker_status", {}));
  check("21 the blocker cancelled real requests", status.started && status.today > 0, JSON.stringify({ today: status.today, top: status.topHosts.slice(0, 4) }));
  await page.locator(".browser.shown .strip .tab .pick").nth(1).click();
  await until(() => page.locator(".browser.shown .shield span").innerText().then((t) => Number(t) > 0), 8000);
  check("21b The Verge's shield shows its blocked count", Number(await page.locator(".browser.shown .shield span").innerText()) > 0, await page.locator(".browser.shown .shield span").innerText());
  await shot(app, "v31-website-tab");

  // 8–9. Work and back.
  await page.locator('.rail button[aria-label="AEGIS Work"]').click();
  await wait(400);
  check("8 the rail's Work button brings back the same canvas", !(await page.locator(".browser.shown").count()) && (await page.locator(".canvas-top .title span").first().innerText()) === title);
  check("8b its viewport is unchanged", (await page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform ?? "")) === camera);
  check("8c no tab page stays drawn over Work", !(await tabPanes(app)).some((p) => p.visible));
  await page.locator('.rail button[aria-label="Browser"]').click();
  check("9 the Browser button returns to the last tab", await until(async () => (await tabPanes(app)).find((p) => p.visible && p.url.includes("theverge")), 6000));
  await page.locator('.rail button[aria-label="AEGIS Work"]').click();

  // 10–13. Open in browser from a research source window.
  await openSourceFromControl(page, "https://www.ipcc.ch/", "IPCC");
  await page.waitForSelector('[data-mode="native-live"]', { timeout: 20000 });
  await until(async () => (await sourcePanes(app)).find((p) => /ipcc\.ch/.test(p.url)), 40000);
  await wait(1500);
  const openButton = page.locator(".pane button", { hasText: /browser/i }).first();
  await until(() => openButton.isEnabled(), 15000);
  const tabsBefore = (await tabPanes(app)).length;
  await openButton.click();
  const opened = await until(async () => (await tabPanes(app)).find((p) => /ipcc\.ch/.test(p.url) && p.visible), 30000);
  check("10–12 Open in browser opens an AEGIS tab, not an external browser", opened && (await tabPanes(app)).length === tabsBefore + 1 && (await visibleWindows(app)) === 1, opened?.url);
  check("12b the source window is hidden behind the browser", !(await sourcePanes(app)).some((p) => p.visible));
  check("12c the tab offers the way back to the research", (await page.locator(".browser.shown .back-work").count()) === 1, await page.locator(".browser.shown .back-work").innerText().catch(() => ""));
  await shot(app, "v31-open-in-browser");
  await page.locator(".browser.shown .back-work").click();
  await wait(500);
  check("13 Back returns to the same research canvas with its source window", (await page.locator(".canvas-top .title span").first().innerText()) === title && (await sourcePanes(app)).some((p) => p.visible));

  // 20. Focus and Today.
  await page.locator('.rail button[aria-label="Browser"]').click();
  await page.locator(".browser.shown .strip .add").click();
  await until(() => page.locator(".newtab .foot").count(), 5000);
  const due = await until(() => page.locator(".newtab .foot button", { hasText: /Due today|Tasks unavailable/ }).innerText().catch(() => ""), 8000);
  const real = await page.evaluate(async (client) => {
    const day = new Date(); const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const response = await fetch("/api/workspace/v21/tasks", { headers: { "X-Nova-Client": client } }).catch(() => null);
    if (!response?.ok) return null;
    const rows = (await response.json()).items || [];
    return rows.filter((r) => r.status !== "done" && String(r.dueDate || "").slice(0, 10) === key).length;
  }, client);
  // Either the same count as the Tasks API, or (when the API fails) an honest "unavailable", never a number.
  check("20 Today matches the Tasks API", real !== null ? new RegExp(`Due today\\s*${real}\\b`).test(due || "") : /Tasks unavailable/.test(due || ""), `${due} (API: ${real === null ? "failed" : real})`);
  await page.locator(".newtab .foot button", { hasText: /Focus/ }).click();
  await page.locator(".card[aria-label='Focus'] .start").click();
  check("20b Focus starts a round from the new tab", await until(() => page.locator(".newtab .foot button", { hasText: "Focusing" }).count(), 3000));
  await shot(app, "v31-focus");
  await page.locator(".card[aria-label='Focus'] .close").click();

  // Settings that must survive a restart: an engine choice and a wallpaper.
  await page.locator('.newtab .round[aria-label="Browser settings"]').click();
  await page.locator(".sheet nav button", { hasText: "Appearance" }).click();
  await page.locator(".sheet .choices button", { hasText: "Plain colour" }).click();
  check("18a settings change the new tab for real", (await page.locator(".newtab .page").getAttribute("style"))?.includes("background"));
  check("18a2 the chosen option shows as chosen", await until(() => page.locator(".sheet .choices button", { hasText: "Plain colour" }).getAttribute("aria-checked").then((v) => v === "true"), 3000));
  await shot(app, "v31-settings");
  await page.locator(".sheet nav .done").click();

  // 14–15. Minimize and restore.
  const cpuVisible = await cpu(app);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].minimize());
  await wait(4000);
  const cpuMin = await cpu(app);
  const hidden = await tabPanes(app);
  check("14 minimized: no tab page is shown", !hidden.some((p) => p.visible && p.state === "active"), JSON.stringify(hidden.map((p) => p.state)));
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].restore());
  await wait(1200);
  check("15 restored: the app answers and keeps its tabs", (await page.locator(".browser.shown .strip .tab").count()) >= 4, `cpu ${cpuVisible.toFixed(1)}% visible → ${cpuMin.toFixed(1)}% minimized`);
  const userCookies = await app.evaluate(async ({ session }) => (await session.fromPartition("persist:aegis-user").cookies.get({})).length);
  const memBefore = await memory(app);
  check("No page errors", !errors.length, errors.join(" | "));
  check("22 no unexpected windows appeared", (await visibleWindows(app)) === 1);
  await app.close();

  // 16–19. Restart.
  ({ app, page } = await launch());
  const restored = await until(() => page.locator('.rail button[aria-label="Browser"]').getAttribute("title"), 10000);
  check("16–17 tabs are restored after a restart", /\(\d+ tabs\)/.test(restored || ""), restored);
  check("17b restored tabs load nothing until shown", (await tabPanes(app)).length === 0);
  await page.locator('.rail button[aria-label="Browser"]').click();
  const back = await until(async () => (await tabPanes(app)).find((p) => p.visible), 30000);
  check("17c the last shown tab comes back first", back || (await page.locator(".browser.shown .newtab").count()), back?.url ?? "new tab");
  await page.locator(".browser.shown .strip .add").click();
  check("18 settings and the engine are kept", (await page.locator(".newtab .page").getAttribute("style"))?.includes("background") && /DuckDuckGo/.test(await page.locator(".newtab input").getAttribute("placeholder")));
  const kept = await app.evaluate(async ({ session }) => (await session.fromPartition("persist:aegis-user").cookies.get({})).length);
  check("19 the browser profile's cookies survive the restart", kept > 0 && kept >= userCookies * 0.5, `${userCookies} before, ${kept} after`);
  check("22b still one window", (await visibleWindows(app)) === 1);
  const memAfter = await memory(app);
  await app.close();

  fs.writeFileSync(path.join(out, "desktop-v31-results.json"), JSON.stringify({ results, cpu: { visible: cpuVisible, minimized: cpuMin }, memoryMB: { before: memBefore, afterRestart: memAfter } }, null, 1));
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
