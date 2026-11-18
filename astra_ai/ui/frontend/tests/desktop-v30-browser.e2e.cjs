// V30 AEGIS Desktop browser, checked in the real Electron app with its own profile (never the person's).
// Opens tabs, searches with two engines, navigates, goes back, switches to the Work canvas and back,
// loads Google's sign-in page (nothing is typed into it), checks that tab cookies never reach the agent
// browser, and that tabs are restored lazily after a restart. Loads real public websites; no model spend.
// Usage: node tests/desktop-v30-browser.e2e.cjs [output folder]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const [out = "v30-desktop-shots"] = process.argv.slice(2);
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
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v30-"));

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
/** Waits until the tab whose address contains `part` has finished loading (its page is committed). */
const settled = (app, part, timeout = 30000) => until(() => app.evaluate(({ BrowserWindow }, part) => {
  const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
  const view = win.contentView.children.find((v) => v.webContents.getURL().includes(part));
  return Boolean(view && !view.webContents.isLoading() && view.webContents.navigationHistory.getAllEntries().some((e) => e.url.includes(part)));
}, part), timeout);
const metricsMB = (app) => app.evaluate(({ app }) => Math.round(app.getAppMetrics().reduce((sum, row) => sum + (row.memory.privateBytes ?? row.memory.workingSetSize), 0) / 1024));

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
  }).catch((error) => (console.log("screenshot failed: " + String(error).slice(0, 160)), ""));
  if (png) fs.writeFileSync(path.resolve(out, name + ".png"), Buffer.from(png.split(",")[1], "base64"));
}

(async () => {
  let { app, page } = await launch();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  const before = await metricsMB(app);

  // 1. New tab, focused address, search with the default engine (Google).
  check("1 the canvas offers a New tab (+) button", await until(() => page.locator("button.new-tab").first().count(), 20000));
  await shot(app, "before-browser-canvas");
  await page.locator("button.new-tab").first().click();
  await until(() => page.locator(".browser.shown").count(), 5000);
  check("2 the browser surface opens with a Work tab first", (await page.locator(".browser.shown .tab.work").count()) === 1);
  check("3 the new tab's address field has the keyboard", await until(() => page.evaluate(() => document.activeElement?.classList.contains("address")), 3000));
  await page.keyboard.type("AI robotics research");
  await page.keyboard.press("Enter");
  const google = await until(async () => (await tabPanes(app)).find((pane) => /google\.[a-z.]+\/(search|sorry)|consent\.google/.test(pane.url)), 30000);
  check("4 a search opens the engine's real results page in a native tab", google, google?.url);
  if (/\/sorry\//.test(google?.url || "")) console.log("NOTE  Google answered with its unusual-traffic check (shown to the person in the tab; never solved by AEGIS).");
  check("5 the tab runs in the person's own session, not the source-pane or agent session", google?.session === "persist:aegis-user", google?.session);
  await wait(2500);
  await shot(app, "after-browser-google-search");

  // 2. A second tab with an address, then another page, then Back.
  await page.locator(".browser.shown button.add").click();
  await until(() => page.evaluate(() => document.activeElement?.classList.contains("address")), 3000);
  await page.keyboard.type("en.wikipedia.org/wiki/Robotics");
  await page.keyboard.press("Enter");
  const wiki = await until(async () => (await tabPanes(app)).find((pane) => pane.url.includes("wikipedia.org/wiki/Robotics") && pane.visible), 30000);
  check("6 an address opens that page in a new tab", wiki, wiki?.url);
  await settled(app, "wikipedia.org/wiki/Robotics");
  check("7 two tabs are open", (await page.locator(".browser.shown .tab .pick").count()) === 2);
  await page.locator(".browser.shown input.address").click();
  await page.keyboard.type("arxiv.org");
  await page.keyboard.press("Enter");
  await until(async () => (await tabPanes(app)).find((pane) => pane.url.includes("arxiv.org")), 30000);
  const enabled = await until(() => page.locator('.browser.shown button[aria-label="Back"]:not([disabled])').count(), 30000);
  if (!enabled) console.log("history", JSON.stringify(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").contentView.children.map((v) => ({ url: v.webContents.getURL(), back: v.webContents.navigationHistory.canGoBack(), entries: v.webContents.navigationHistory.getAllEntries().map((e) => e.url) })))));
  await page.locator('.browser.shown button[aria-label="Back"]').click();
  const back = await until(async () => (await tabPanes(app)).find((pane) => pane.url.includes("wikipedia.org/wiki/Robotics")), 20000);
  check("8 Back returns to the previous page", back, back?.url);
  const title = await until(() => page.locator(".browser.shown .tab.active .name").innerText().then((t) => (/robot/i.test(t) ? t : "")), 10000);
  check("9 the tab shows the page title", title, title);

  // 3. Choose DuckDuckGo and search again.
  await page.locator(".browser.shown button.engine").click();
  await page.locator('.browser.shown .engines button', { hasText: "DuckDuckGo" }).click();
  check("10 the engine choice is shown in the bar", /DuckDuckGo/.test(await page.locator(".browser.shown button.engine").innerText()));
  await page.locator(".browser.shown input.address").click();
  await page.keyboard.type("robot arm kinematics");
  await page.keyboard.press("Enter");
  const ddg = await until(async () => (await tabPanes(app)).find((pane) => pane.url.startsWith("https://duckduckgo.com/")), 30000);
  check("11 the chosen engine is used for the next search", ddg, ddg?.url);

  // 4. The Work canvas and back: views hide, the canvas is untouched.
  await page.locator(".browser.shown .tab.work").click();
  await wait(400);
  check("12 the Work tab brings the canvas back", !(await page.locator(".browser.shown").count()) && (await page.locator(".aegis-work-stage").count()));
  check("13 no tab page stays drawn over the canvas", !(await tabPanes(app)).some((pane) => pane.visible), JSON.stringify((await tabPanes(app)).map((p) => p.visible)));
  await shot(app, "after-back-to-work");
  await page.locator("button.new-tab.tabs").click();
  check("14 the tabs button returns to the tabs", await until(() => page.locator(".browser.shown").count(), 3000));

  // 5. Google sign-in page loads in a tab as Google serves it. Nothing is typed into it.
  await page.locator(".browser.shown button.add").click();
  await until(() => page.evaluate(() => document.activeElement?.classList.contains("address")), 3000);
  await page.keyboard.type("accounts.google.com");
  await page.keyboard.press("Enter");
  const signin = await until(async () => (await tabPanes(app)).find((pane) => /accounts\.google\.com/.test(pane.url) && pane.visible), 30000);
  await wait(3000);
  await settled(app, "accounts.google.com");
  const form = signin ? await app.evaluate(async ({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
    // Google redirects to its sign-in step, so the view is found by host, not by the first address.
    const view = win.contentView.children.find((v) => v.getVisible() && v.webContents.getURL().includes("accounts.google.com"));
    return view.webContents.executeJavaScript(`({ email: !!document.querySelector('input[type=email], input#identifierId, input[autocomplete=username]'), blocked: /browser or app may not be secure|couldn.t sign you in/i.test(document.body.innerText), ua: navigator.userAgent })`, true);
  }).catch((e) => ({ error: String(e) })) : null;
  check("15 Google's own sign-in page opens in a tab with its email field", form?.email, JSON.stringify(form)?.slice(0, 200));
  check("16 the tab identifies as Chromium, not Electron or AEGIS", typeof form?.ua === "string" && /Chrome\//.test(form.ua) && !/Electron|AEGIS/i.test(form.ua), form?.ua);
  check("17 Google shows no 'browser may not be secure' block on the first step", form?.email === true && form.blocked === false);
  await shot(app, "after-google-signin-page");

  // 6. Isolation: Google cookies exist in the tab session and not in the agent browser's.
  const cookies = await app.evaluate(async ({ session }) => {
    const user = await session.fromPartition("persist:aegis-user").cookies.get({ domain: "google.com" });
    const panes = await session.fromPartition("persist:aegis-browser").cookies.get({ domain: "google.com" });
    const fallback = await session.defaultSession.cookies.get({ domain: "google.com" });
    return { user: user.length, panes: panes.length, defaultSession: fallback.length };
  });
  check("18 the tab session holds its own Google cookies", cookies.user > 0, JSON.stringify(cookies));
  check("19 source panes and the app session never received them", cookies.panes === 0 && cookies.defaultSession === 0, JSON.stringify(cookies));
  check("20 no agent-browser window was opened by browsing", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((w) => w.isVisible()).length)) === 1);

  const during = await metricsMB(app);
  const tabsOpen = (await tabPanes(app)).length;
  check("21 memory measured with every child process", during > 0, `${before} MB before, ${during} MB with ${tabsOpen} tabs`);
  check("No page errors", !errors.length, errors.join(" | "));
  await app.close();

  // 7. Restart: tabs come back, but no page loads until a tab is shown (lazy).
  ({ app, page } = await launch());
  const restored = await until(() => page.locator("button.new-tab.tabs").innerText().catch(() => ""), 10000);
  check("22 tabs are restored after a restart", /[1-9] tabs?/.test(restored || ""), restored);
  check("23 restored tabs load nothing until shown", (await tabPanes(app)).length === 0, (await tabPanes(app)).length);
  await page.locator("button.new-tab.tabs").click();
  const revived = await until(async () => (await tabPanes(app)).find((pane) => pane.visible), 30000);
  check("24 showing a restored tab loads its page", revived, revived?.url);
  const after = await metricsMB(app);
  await app.close();

  fs.writeFileSync(path.join(out, "desktop-v30-results.json"), JSON.stringify({ results, memoryMB: { before, during, tabsOpen, restartOneTab: after } }, null, 1));
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed · memory ${before} → ${during} MB (${tabsOpen} tabs) · after restart with one tab ${after} MB`);
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
