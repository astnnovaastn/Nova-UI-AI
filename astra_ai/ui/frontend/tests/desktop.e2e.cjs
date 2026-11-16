// AEGIS Desktop, checked in the real app: launches Electron, lets it start AEGIS, opens a saved
// research (no model spend) and drives the native source browser. Loads a few real websites.
// Usage: node tests/desktop.e2e.cjs ["<library search>"] [output folder]
const { openSourceFromControl } = require("./source-browser-control.cjs");
const fs = require("fs");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const [search = "offshore wind", out = "desktop-shots"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
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

(async () => {
  const frontend = path.resolve(__dirname, "..");
  // Its own profile, so it runs beside an open AEGIS window and leaves that window's site data alone.
  const profile = fs.mkdtempSync(path.join(require("os").tmpdir(), "aegis-e2e-"));
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000, env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  const page = await app.firstWindow();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));

  /** The native panes, as the main process sees them. */
  const panes = () =>
    app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
      return win.contentView.children.map((view) => ({
        url: view.webContents.getURL(),
        title: view.webContents.getTitle(),
        bounds: view.getBounds(),
        visible: view.getVisible(),
        loading: view.webContents.isLoading(),
      }));
    });
  /** Runs script inside pane `index`'s page, as that website would. */
  const inPane = (index, script) =>
    app.evaluate(({ BrowserWindow }, { index, script }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").contentView.children[index].webContents.executeJavaScript(script, true), { index, script });
  /** A picture of the window's own contents with the visible native panes laid over it. Reads only the app, never the screen. */
  const shot = async (name) => {
    const png = await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
      const size = win.getContentBounds();
      const base = (await win.webContents.capturePage()).toDataURL();
      const layers = [];
      for (const view of win.contentView.children) {
        if (view.getVisible()) layers.push({ bounds: view.getBounds(), data: (await view.webContents.capturePage()).toDataURL() });
      }
      const helper = new BrowserWindow({ show: false, width: 200, height: 200 });
      await helper.loadURL("about:blank");
      const out = await helper.webContents.executeJavaScript(`(async () => {
        const [W, H, BASE, LAYERS] = ${JSON.stringify([size.width, size.height, base, layers])};
        const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
        const g = canvas.getContext("2d");
        const load = (src) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = src; });
        g.drawImage(await load(BASE), 0, 0, W, H);
        for (const layer of LAYERS) g.drawImage(await load(layer.data), layer.bounds.x, layer.bounds.y, layer.bounds.width, layer.bounds.height);
        return canvas.toDataURL("image/png");
      })()`);
      helper.destroy();
      return out;
    }).catch((error) => (console.log("screenshot failed: " + String(error).slice(0, 160)), ""));
    if (png) fs.writeFileSync(path.resolve(out, name + ".png"), Buffer.from(png.split(",")[1], "base64"));
  };
  // 1. The app, its window and the workspace.
  check("T2 AEGIS Desktop launches in its own window", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 1);
  check("The window is titled AEGIS", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").getTitle())) === "AEGIS");
  check("T3 The app has its own icon file", fs.existsSync(path.join(frontend, "desktop", "icons", "icon.ico")));
  const arrived = await until(async () => /^http:\/\/127\.0\.0\.1:5173\//.test(page.url()), 240000, 500);
  check("T17 The app connects to its configured workspace (starting AEGIS if needed)", arrived, page.url());
  if (!arrived) {
    console.log("start page says: " + (await page.locator("#status").innerText().catch(() => "?")));
    await shot("0-start-failed");
    await app.close();
    process.exit(1);
  }
  await page.evaluate(() => { try { sessionStorage.setItem("nova-current-workspace", "research"); } catch {} });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  check("The desktop bridge exists in the workspace page", await page.evaluate(() => typeof window.aegisDesktop?.invoke === "function"));
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await wait(4000);
  check("T4 The Research Workspace loads saved research", (await page.locator(".svelte-flow__node").count()) > 3, await page.locator(".svelte-flow__node").count());
  const zoomOf = () => page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform ?? "");
  const camera = await zoomOf();
  check("Saved research has no browser panes", (await panes()).length === 0);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: { url: "https://example.org" } })));
  check("A synthetic open request creates no pane", (await panes()).length === 0);
  const replay = page.getByRole("button", { name: "Replay build" });
  if (await replay.isVisible()) {
    await replay.click();
    await page.getByRole("button", { name: "Skip", exact: true }).click().catch(() => {});
    check("Replay creates no browser panes", (await panes()).length === 0);
  }
  await shot("1-workspace");

  // 2. A site that refuses framing, opened natively.
  const openSource = (url, title) => openSourceFromControl(page, url, title);
  const holeRect = (index = 0) =>
    page.evaluate((index) => {
      const box = document.querySelectorAll('[data-mode="native-live"]')[index]?.getBoundingClientRect();
      return box ? { x: Math.round(box.left), y: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) } : null;
    }, index);
  const sameRect = (a, b) => a && b && ["x", "y", "width", "height"].every((key) => Math.abs(a[key] - b[key]) <= 1);

  await openSource("https://deepmind.google/", "Google DeepMind");
  await page.waitForSelector('[data-mode="native-live"]', { timeout: 20000 });
  const loaded = await until(async () => { const [pane] = await panes(); return pane && !pane.loading && /deepmind\.google/.test(pane.url) && pane; }, 45000);
  check("T6 Opening a source creates a native pane on its real URL", loaded, JSON.stringify(loaded && { url: loaded.url, title: loaded.title }));
  check("T7 deepmind.google (refuses iframes) loads as a live top-level page", loaded && (await inPane(0, "window.top === window && document.body.innerText.length")) > 200);
  check("No iframe is used for the live page", (await page.locator('[data-mode="iframe-live"]').count()) === 0);
  check("No 'doesn't allow being shown' message", (await page.locator("text=allow being shown inside other apps").count()) === 0);
  await wait(800);
  check("The native view sits exactly on the pane", sameRect((await panes())[0].bounds, await holeRect()), JSON.stringify([(await panes())[0].bounds, await holeRect()]));
  check("The pane toolbar shows the page title", /deepmind/i.test((await page.locator(".pane .identity").first().getAttribute("title")) ?? ""), await page.locator(".pane .identity").first().getAttribute("title"));
  await shot("2-deepmind-native");

  // 3. Scrolling, clicking, Back, Forward, Reload.
  check("T8 The page scrolls", (await inPane(0, "window.scrollTo(0, 900); new Promise(r => setTimeout(() => r(window.scrollY), 400))")) > 100);
  const first = (await panes())[0].url;
  const clicked = await inPane(0, `(() => { const link = [...document.querySelectorAll('a[href]')].find(a => a.origin === location.origin && a.pathname !== location.pathname && a.pathname.length > 1 && !a.target); if (!link) return ''; link.click(); return link.href; })()`);
  const moved = await until(async () => { const [pane] = await panes(); return pane.url !== first && !pane.loading && pane.url; }, 30000);
  check("T8 Clicking a link on the page navigates", moved, `${clicked} -> ${moved}`);
  const back = page.locator('.pane button[aria-label="Back"]').first();
  const forward = page.locator('.pane button[aria-label="Forward"]').first();
  check("Back becomes available after navigating", await until(async () => back.isEnabled(), 8000));
  await back.click();
  check("T9 Back returns to the first page", await until(async () => (await panes())[0].url === first, 20000), (await panes())[0].url);
  check("Forward becomes available", await until(async () => forward.isEnabled(), 8000));
  await forward.click();
  check("T9 Forward goes on again", await until(async () => (await panes())[0].url === moved, 20000), (await panes())[0].url);
  await inPane(0, "window.__marker = 1");
  await page.locator('.pane button[aria-label="Reload"]').first().click();
  check("T9 Reload loads the page afresh", await until(async () => (await inPane(0, "typeof window.__marker")) === "undefined", 20000));

  // 4. The address field.
  const address = page.locator(".pane input[data-zephium-address]").first();
  await address.click();
  await address.fill("en.wikipedia.org/wiki/Offshore_wind_power");
  await address.press("Enter");
  check("The address field navigates", await until(async () => { const [pane] = await panes(); return /wikipedia\.org\/wiki\/Offshore_wind_power/.test(pane.url) && !pane.loading; }, 30000), (await panes())[0].url);

  // 5. Untrusted page: no bridge, no local addresses, no permissions, no downloads, no windows.
  check("T15 The page has no AEGIS bridge, Node or Electron access", (await inPane(0, "[typeof window.aegisDesktop, typeof window.require, typeof window.process, typeof window.__aegisBrowserEvent].join()")) === "undefined,undefined,undefined,undefined");
  const before = (await panes())[0].url;
  await inPane(0, "location.href = 'http://127.0.0.1:8340/api/health'; 1");
  await wait(1500);
  check("The page cannot navigate to this computer's backend", (await panes())[0].url === before, (await panes())[0].url);
  check("The person is told the link was not followed", (await page.locator(".hint:has-text('only opens public websites')").count()) === 1);
  await inPane(0, "location.href = 'file:///C:/Windows/win.ini'; 1").catch(() => {});
  await wait(800);
  check("The page cannot open local files", (await panes())[0].url === before, (await panes())[0].url);
  check("Microphone is refused without a prompt", (await inPane(0, "navigator.mediaDevices.getUserMedia({audio:true}).then(() => 'granted', e => e.name)")) === "NotAllowedError");
  check("Location is refused", (await inPane(0, "new Promise(r => navigator.geolocation.getCurrentPosition(() => r('granted'), e => r('denied:' + e.code), {timeout: 4000}))")) === "denied:1");
  check("Notifications are refused", (await inPane(0, "Notification.requestPermission()")) === "denied");
  const count = (await panes()).length;
  await inPane(0, "window.open('https://example.org/popup-test', '_blank'); 1");
  await wait(1200);
  check("A page popup cannot open a source pane", (await panes()).length === count);
  check("A page cannot open an operating-system window", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 1);
  check("Cookies are kept apart from the AEGIS workspace", await app.evaluate(({ BrowserWindow }) => { const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS"); return win.contentView.children[0].webContents.session !== win.webContents.session; }));
  check("The workspace page cannot be called from a frame", (await page.evaluate(() => { const f = document.createElement("iframe"); f.srcdoc = "<p>x</p>"; document.body.append(f); const has = typeof f.contentWindow.aegisDesktop; f.remove(); return has; })) === "undefined");

  // 6. Moving and resizing.
  const head = await page.locator(".pane .head").first().boundingBox();
  const startRect = await holeRect();
  await page.mouse.move(head.x + head.width / 2 - 140, head.y + 8);
  await page.mouse.down();
  await page.mouse.move(head.x + head.width / 2 - 260, head.y + 70, { steps: 12 });
  await page.mouse.up();
  await wait(700);
  const movedRect = await holeRect();
  check("T10 Dragging the toolbar moves the pane", movedRect && startRect && (movedRect.x !== startRect.x || movedRect.y !== startRect.y), JSON.stringify([startRect, movedRect]));
  check("T10 The native view follows the move", sameRect((await panes())[0].bounds, movedRect), JSON.stringify([(await panes())[0].bounds, movedRect]));
  const paneBox = await page.locator(".pane").first().boundingBox();
  // The right edge: the grip there must stay reachable beside the native view.
  await page.mouse.move(paneBox.x + paneBox.width - 3, paneBox.y + paneBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(paneBox.x + paneBox.width - 123, paneBox.y + paneBox.height / 2, { steps: 12 });
  await page.mouse.up();
  await wait(700);
  const sized = await holeRect();
  check("T10 Dragging the edge resizes the pane", sized && sized.width < movedRect.width, JSON.stringify([movedRect, sized]));
  check("T10 The native view follows the resize", sameRect((await panes())[0].bounds, sized), JSON.stringify([(await panes())[0].bounds, sized]));
  check("T11 Opening and using a source leaves the canvas zoom and position alone", (await zoomOf()) === camera, `${camera} -> ${await zoomOf()}`);

  // 7. Several panes.
  await openSource("https://github.com/zephium-browser/Zephium", "Zephium on GitHub");
  const second = await until(async () => { const list = await panes(); const pane = list.find((p) => /github\.com/.test(p.url)); return pane && !pane.loading && list; }, 45000);
  check("T12 A second source opens in its own pane", second && second.length >= count + 1, second && second.map((p) => p.url).join(" | "));
  check("A site whose popup was requested is not opened as a window", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 1);
  await wait(900);
  const stacked = await panes();
  const hidden = stacked.filter((p) => !p.visible).length;
  check("T12 The pane in front stays live", stacked.some((p) => p.visible && /github\.com/.test(p.url)));
  check("T12 A pane behind another hides its native view instead of painting over it", hidden >= 1, JSON.stringify(stacked.map((p) => [p.url.slice(0, 40), p.visible])));
  await shot("3-two-panes");
  check("Reopening a source reuses its pane", await (async () => { const n = (await panes()).length; await openSource("https://github.com/zephium-browser/Zephium", "Zephium on GitHub"); await wait(1200); return (await panes()).length === n; })());

  // 8. Minimize, restore, close.
  await page.locator('.pane:not([style*="display: none"]) button[aria-label="Minimize"]').last().click();
  await wait(600);
  check("Minimizing hides the native view", (await panes()).filter((p) => /github\.com/.test(p.url)).every((p) => !p.visible));
  check("The composer stays reachable", await page.locator(".aegis-work-stage textarea, .aegis-work-stage [contenteditable='true']").first().isVisible().catch(() => false));
  await page.locator(".minimized button").first().dispatchEvent("click");
  check("Restoring shows the page again", await until(async () => (await panes()).filter((p) => /github\.com/.test(p.url)).some((p) => p.visible), 6000));
  const open = (await panes()).length;
  while (await page.locator('.pane button[aria-label="Close pane"]').count()) {
    await page.locator('.pane button[aria-label="Close pane"]').last().click();
    await wait(500);
  }
  check("T13 Closing panes removes their native views", (await panes()).length === 0, `${open} -> ${(await panes()).length}`);
  check("T13 Closed pages are destroyed", (await app.evaluate(({ webContents }) => webContents.getAllWebContents().length)) === 1, await app.evaluate(({ webContents }) => webContents.getAllWebContents().map((c) => c.getURL().slice(0, 50)).join(" | ")));
  check("The research is still open, untouched", (await page.locator(".svelte-flow__node").count()) > 3 && (await zoomOf()) === camera);
  await shot("4-after-close");

  check("No page errors", !errors.length, errors.join(" | "));
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed. Screenshots: ${path.resolve(out)}`);
  await app.close();
  process.exit(passed === results.length ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
