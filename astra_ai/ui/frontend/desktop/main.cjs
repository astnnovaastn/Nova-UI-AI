/**
 * AEGIS Desktop: the existing AEGIS web app in its own window, plus native source browser panes.
 *
 * The window first shows a small bundled start page. That page asks this process to make sure
 * the AEGIS workspace is running (starting the local services if configured), and the window
 * then goes to it. From there on:
 *
 *  - the workspace page may call only the browser-pane commands, and only from the configured
 *    workspace origin's top frame;
 *  - each source opens in its own WebContentsView: a real top-level browser document, so a site
 *    that forbids framing still loads, with no header stripped and nothing proxied;
 *  - a pane is untrusted: no preload, no Node, its own cookie store, public web addresses only,
 *    and every permission request, download and new window refused;
 *  - a pane nobody is looking at is frozen, and later released, by the resource lifecycle
 *    manager (resources.cjs). Its address and scroll position are kept, and it comes back when shown.
 *
 * Run: electron desktop/main.cjs            (npm run desktop)
 *      electron desktop/main.cjs --install-shortcuts
 */
const { app, BrowserWindow, WebContentsView, Menu, ipcMain, session, shell, dialog, nativeImage, screen, systemPreferences, safeStorage } = require("electron");
const { browserAssist } = require("./browser-assist.cjs");
const { workDev } = require("./work-dev.cjs");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const { workspaceUrl, publicPage, isLoopback } = require("./addresses.cjs");
const services = require("./services.cjs");
const { decide: captionDecide } = require("./caption.cjs");
const installation = require("./installed.cjs");
const { updater: makeUpdater } = require("./updater.cjs");
const uiServer = require("./ui-server.cjs");
const { ResourceManager } = require("./resources.cjs");
const { NoteFiles } = require('./note-files.cjs');
const agentBrowser = require("./agent-browser.cjs");
const { userTabs } = require("./user-tabs.cjs");
const { blocker: makeBlocker } = require("./blocker.cjs");

const APP_ID = "ai.aegis.desktop";
const FRONTEND = path.resolve(__dirname, "..");
const ICON = path.join(__dirname, "icons", "icon.ico");
const SHELL_PAGE = path.join(__dirname, "shell", "index.html");
const SHELL_URL = pathToFileURL(SHELL_PAGE).href;
const PANE_PARTITION = "persist:aegis-browser";
/** Windows the workspace may have open. How many hold a live page is the lifecycle manager's decision. */
const MAX_PANES = 8;
/** V30: the person's own browser tabs (user-tabs.cjs), counted apart from source panes. */
const MAX_TABS = 16;
/** What the AEGIS workspace itself may ask Chromium for (voice, camera widget, copy and paste). */
const WORKSPACE_PERMISSIONS = new Set(["media", "clipboard-read", "clipboard-sanitized-write", "fullscreen", "notifications"]);
const RESOURCE_MODES = new Set(["auto", "saving", "normal", "performance"]);

app.setName("AEGIS");
app.setAppUserModelId(APP_ID);
// Tests and profiling run a second copy beside the person's own, with its own settings and site data.
if (process.env.AEGIS_DESKTOP_USER_DATA) app.setPath("userData", path.resolve(process.env.AEGIS_DESKTOP_USER_DATA));

let mainWindow = null;
let workspaceOrigin = "";
/** This app started the backend, so it stops it on exit. */
let startedServices = false;
/** The built web app, served from this process. Null when a dev server is in use. */
let ownServer = null;
let uiMode = "";
/** id -> { id, kind: "source" | "tab", view | null, bounds, visible, url, title, scrollY, frozen } */
const panes = new Map();
/** The hidden agent browser the backend may use for background reading (agent-browser.cjs). Never a pane. */
let agentHost = null;

// ---------------------------------------------------------------- settings

const configPath = () => path.join(app.getPath("userData"), "desktop.json");

/** Running from the source tree, the project is four folders up; nothing is baked in. */
function defaultProjectRoot() {
  const root = path.resolve(__dirname, "..", "..", "..", "..");
  return fs.existsSync(path.join(root, "start_nova_ai.ps1")) ? root : "";
}

function loadConfig() {
  const defaults = { uiUrl: "http://127.0.0.1:5173/", projectRoot: defaultProjectRoot(), autoStart: true, stopOnExit: true, resourceMode: "auto" };
  try {
    const saved = JSON.parse(fs.readFileSync(configPath(), "utf8"));
    return {
      uiUrl: typeof saved.uiUrl === "string" ? saved.uiUrl : defaults.uiUrl,
      projectRoot: typeof saved.projectRoot === "string" ? saved.projectRoot : defaults.projectRoot,
      autoStart: saved.autoStart !== false,
      stopOnExit: saved.stopOnExit !== false,
      resourceMode: RESOURCE_MODES.has(saved.resourceMode) ? saved.resourceMode : "auto",
    };
  } catch {
    return defaults;
  }
}

/** Only addresses and switches are stored. Model keys and backend credentials stay in the backend's .env. */
function saveConfig(input) {
  const config = {
    uiUrl: workspaceUrl(input?.uiUrl).href,
    projectRoot: String(input?.projectRoot ?? "").trim().replace(/^"|"$/g, ""),
    autoStart: input?.autoStart !== false,
    stopOnExit: input?.stopOnExit !== false,
    resourceMode: RESOURCE_MODES.has(input?.resourceMode) ? input.resourceMode : loadConfig().resourceMode,
  };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2));
  return config;
}

// ---------------------------------------------------------------- start-up

/**
 * Makes sure the workspace answers, then sends the window to it.
 *
 * Something already serving the workspace address (a dev server someone started) is used as it
 * is. Otherwise the backend is started if needed, and the built web app is served from this
 * process. Only if there is no current build does the launcher start the dev server too.
 */
async function boot() {
  // V35: an installed AEGIS starts its own bundled backend and serves its own build; no project folder or scripts.
  if (installation.installed) return bootInstalled();
  const config = loadConfig();
  const target = workspaceUrl(config.uiUrl);
  const local = isLoopback(target.hostname);
  let ready = await services.reachable(target);
  if (ready) uiMode = "existing";
  if (!ready && local && config.autoStart && config.projectRoot) {
    const port = Number(target.port) || 80;
    const build = uiServer.buildState(FRONTEND);
    const backendUp = await services.backendHealthy();
    if (!backendUp || !build.usable) {
      // The backend learns where the agent browser's token is; it reads the file on each connection.
      await services.start(config.projectRoot, { frontend: !build.usable, env: agentHost ? { AEGIS_AGENT_BROWSER_TOKEN_FILE: agentHost.tokenFile } : {} });
      // Whatever the launcher was asked to start is stopped again on exit. A backend that was
      // already up, with a current build to serve, never reaches here and is left alone.
      startedServices = true;
    }
    if (build.usable) {
      ownServer = await uiServer.start(FRONTEND, port);
      uiMode = "built";
    } else {
      uiMode = "dev";
      console.log(`Using the dev server: ${build.reason}`);
    }
    ready = await services.waitReachable(target, 20000);
  }
  if (!ready) {
    throw new Error(
      local && !config.projectRoot
        ? "AEGIS is not running on this computer. Enter the AEGIS project folder so it can be started, or start it yourself."
        : `The AEGIS workspace at ${target.origin} is not answering.`,
    );
  }
  workspaceOrigin = target.origin;
  agentHost?.kick();
  // Not awaited: the reply to the start page would otherwise race the page being replaced.
  setImmediate(() => mainWindow?.loadURL(target.href).catch(() => mainWindow?.loadFile(SHELL_PAGE)));
  return { startedServices, uiMode };
}

/** V35: the installed app: bundled backend with the person's data folder, the built web app served here. */
async function bootInstalled() {
  const target = new URL("http://127.0.0.1:" + installation.uiPort() + "/");
  const result = await installation.startBackend(agentHost ? { AEGIS_AGENT_BROWSER_TOKEN_FILE: agentHost.tokenFile } : {});
  startedServices = Boolean(result.started);
  if (!(await services.reachable(target))) ownServer = await uiServer.start(FRONTEND, installation.uiPort());
  uiMode = "installed";
  if (!(await services.waitReachable(target, 20000))) throw new Error("AEGIS could not serve its workspace on port " + installation.uiPort() + ". Another program may be using it.");
  workspaceOrigin = target.origin;
  agentHost?.kick();
  setImmediate(() => mainWindow?.loadURL(target.href).catch(() => mainWindow?.loadFile(SHELL_PAGE)));
  updates.start();
  return { startedServices, uiMode };
}

// ---------------------------------------------------------------- resource lifecycle

/** Shrinks every wait, so tests see minutes of idling in seconds. */
const LIFECYCLE_SCALE = Number(process.env.AEGIS_LIFECYCLE_SCALE) > 0 ? Number(process.env.AEGIS_LIFECYCLE_SCALE) : 1;
let lifecycleTimer = null;

const lifecycle = new ResourceManager({
  now: () => Date.now(),
  scale: LIFECYCLE_SCALE,
  system: () => ({
    totalBytes: os.totalmem(),
    freeBytes: os.freemem(),
    override: process.env.AEGIS_RESOURCE_MODE || (loadedMode === "auto" ? "" : loadedMode),
  }),
  changed: (id, state) => notify(Number(String(id).slice(5)), { kind: "state", state }),
});
let loadedMode = "auto";

/** The rules run only while there is something to manage: an app with no panes has no timer. */
function watchResources() {
  if (panes.size && !lifecycleTimer) {
    loadedMode = loadConfig().resourceMode;
    lifecycleTimer = setInterval(() => void lifecycle.tick(), Math.max(250, 5000 * LIFECYCLE_SCALE));
  } else if (!panes.size && lifecycleTimer) {
    clearInterval(lifecycleTimer);
    lifecycleTimer = null;
  }
}

const resourceId = (id) => `pane:${id}`;

/** A pane counts as shown only if the window it lives in is. */
function windowShown() {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !mainWindow.isMinimized());
}

function syncVisibility(pane) {
  return lifecycle.setVisible(resourceId(pane.id), pane.visible && windowShown());
}

/**
 * Asked of a page before it is released: would anything be lost? Runs in the page, so the answer
 * is untrusted data and is checked before use.
 */
const RELEASE_PROBE = `(() => { try {
  // Text the person typed. Checkboxes and menus are left out: sites flip those themselves to
  // drive their own layout, which would make most pages look unsaved for ever.
  const typed = /^(text|search|email|url|tel|password|number|)$/;
  const fields = [...document.querySelectorAll("input, textarea")].filter((el) => el.tagName === "TEXTAREA" || typed.test(el.getAttribute("type") || ""));
  const dirty = fields.some((el) => (el.value || "") !== "" && (el.value || "") !== (el.defaultValue || ""));
  const editing = Boolean(document.activeElement && document.activeElement.isContentEditable);
  const playing = [...document.querySelectorAll("video, audio")].some((m) => !m.paused && !m.ended);
  const special = Boolean(document.fullscreenElement || document.pictureInPictureElement);
  return { safe: !dirty && !editing && !playing && !special, y: Math.round(window.scrollY) };
} catch { return { safe: false, y: 0 }; } })()`;

function paneMemoryMB(pane) {
  if (!pane.view) return 0;
  const pid = pane.view.webContents.getOSProcessId();
  const metric = app.getAppMetrics().find((row) => row.pid === pid);
  return metric ? Math.round((metric.memory.privateBytes ?? metric.memory.workingSetSize) / 1024) : 0;
}

function registerPane(pane) {
  const timeout = (promise, ms, fallback) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);
  lifecycle.register(resourceId(pane.id), pane.kind === "tab" ? "browser tab" : "source page", {
    // Sound the person can hear, or a page still arriving, is never cut off.
    busy: () => (!pane.view ? "" : pane.view.webContents.isCurrentlyAudible() ? "audio" : pane.view.webContents.isLoading() ? "loading"
      // V31: a tab whose download is still arriving is never released.
      : pane.kind === "tab" && tabs.downloads().some((row) => row.tab === pane.id && row.state === "progressing") ? "download" : ""),
    memoryMB: () => paneMemoryMB(pane),
    // Freezing stops the page's scripts and timers but keeps it in memory exactly as it was.
    async suspend() {
      const contents = pane.view?.webContents;
      if (!contents || contents.isDestroyed()) return false;
      try {
        if (!contents.debugger.isAttached()) contents.debugger.attach("1.3");
        await contents.debugger.sendCommand("Page.setWebLifecycleState", { state: "frozen" });
        pane.frozen = true;
        return true;
      } catch {
        return false;
      }
    },
    async resume() {
      const contents = pane.view?.webContents;
      pane.frozen = false;
      if (!contents || contents.isDestroyed()) return;
      try {
        if (contents.debugger.isAttached()) {
          await contents.debugger.sendCommand("Page.setWebLifecycleState", { state: "active" });
          contents.debugger.detach();
        }
      } catch {
        /* the page went away meanwhile */
      }
    },
    async safeToRelease() {
      const contents = pane.view?.webContents;
      if (!contents || contents.isDestroyed()) return true;
      const answer = await timeout(contents.executeJavaScript(RELEASE_PROBE, false).catch(() => null), 2000, null);
      if (!answer || answer.safe !== true) return false;
      pane.scrollY = Number.isFinite(answer.y) ? Math.max(0, Math.min(answer.y, 10_000_000)) : 0;
      return true;
    },
    async release() {
      if (!pane.view) return;
      const contents = pane.view.webContents;
      pane.url = contents.getURL() || pane.url;
      pane.title = contents.getTitle() || pane.title;
      destroyView(pane);
    },
    async revive() {
      if (pane.view || !publicPage(pane.url)) return;
      attachView(pane);
      const contents = pane.view.webContents;
      const y = pane.scrollY;
      if (y > 0) contents.once("did-finish-load", () => contents.executeJavaScript(`window.scrollTo(0, ${Number(y)})`, false).catch(() => {}));
      contents.loadURL(pane.url).catch(() => {});
    },
  });
}

// ---------------------------------------------------------------- browser panes

const originOf = (address) => {
  try {
    return new URL(address).origin;
  } catch {
    return "";
  }
};

/**
 * V33 caption reveal, adapted from Zephium's Windows caption (desktop/src/platform/windows_caption.rs).
 * The window buttons stay the real Windows caption buttons (titleBarOverlay): Snap layouts, keyboard,
 * screen readers, double-click and the resize border keep working. The overlay is transparent, so no box
 * is drawn over AEGIS's surfaces; only the symbols change. They rest quiet and come up to full contrast:
 *  - at once while the pointer is on the buttons themselves (they own those pixels, so what a click there
 *    does must be visible), and after a short dwell on the top edge near the corner (Zephium REVEAL_DWELL_MS);
 *  - held while the pointer stays in the corner band or where the Snap flyout opens under Maximize;
 *  - quiet again a moment after the pointer leaves (Zephium's 450 ms), never while the window is fullscreen.
 * The symbols fade over a few frames (setTitleBarOverlay cannot animate; this steps its colour), unless
 * the system asks for reduced motion. The workspace is told, with the fade's duration, so a web page can
 * slide out from under the band. The buttons are never removed: the window can always be closed.
 */
const CAPTION = {
  height: 36,
  /** Windows' three caption buttons are 46 DIP wide each. */
  buttons: 138,
  corner: 220,
  edge: 10,
  hold: 78,
  /** How far round Maximize the Snap layouts flyout can open (Zephium within_snap_reach). */
  snap: 220,
  dwell: 220,
  linger: 450,
  fade: 180,
  /** Symbols per surface tone: "page" is a web page under the corner, whose colour AEGIS can't know (quiet
   *  grey reads on light and dark sites); out, the page has stepped down and the symbols stand on the chrome. */
  tones: {
    dark: { shown: "#e8e9ec", quiet: "#34363c" },
    light: { shown: "#1d1e21", quiet: "#d3d5da" },
    page: { shown: "#e8e9ec", quiet: "#9aa0a6" },
    "page-light": { shown: "#1d1e21", quiet: "#9aa0a6" },
  },
};
const captionState = { shown: false, enabled: false, tone: "dark", level: 0, suppressed: false };
const hexRgb = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const rgbHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const reducedMotion = () => {
  try { return Boolean(systemPreferences.getAnimationSettings().prefersReducedMotion); } catch { return false; }
};
/** What the workspace may tell the caption: the tone of the surface under the corner. */
const captionCommands = {
  caption_surface({ tone }) {
    if (!Object.hasOwn(CAPTION.tones, tone)) throw new Error("Unknown tone.");
    if (captionState.tone !== tone) { captionState.tone = tone; captionPaint?.(); }
    return { tone };
  },
};
let captionPaint = null;
function captionReveal(win) {
  captionState.enabled = true;
  let shown = false, level = 0, fading = null, away = 0, armed = 0, poll = null, last = Date.now();
  const paint = () => {
    if (win.isDestroyed()) return;
    const tone = CAPTION.tones[captionState.tone];
    const from = hexRgb(tone.quiet), to = hexRgb(tone.shown);
    try { win.setTitleBarOverlay({ color: "#00000000", symbolColor: rgbHex(from.map((v, i) => v + (to[i] - v) * level)), height: CAPTION.height }); } catch {}
    captionState.level = level;
  };
  captionPaint = paint;
  const set = (next) => {
    if (next === shown || win.isDestroyed()) return;
    shown = next;
    captionState.shown = next;
    const duration = reducedMotion() ? 0 : CAPTION.fade;
    notify(0, { kind: "caption", shown: next, height: CAPTION.height, duration });
    clearTimeout(fading);
    const start = Date.now(), origin = level, target = next ? 1 : 0;
    const step = () => {
      const t = duration ? Math.min(1, (Date.now() - start) / duration) : 1;
      level = origin + (target - origin) * (1 - (1 - t) ** 3);
      paint();
      if (t < 1) fading = setTimeout(step, 16);
    };
    step();
  };
  const tick = () => {
    poll = null;
    if (win.isDestroyed()) return;
    // Dwell and linger are measured in real time: the poll's pace changes with where the pointer is.
    const now = Date.now(), elapsed = Math.min(250, now - last);
    last = now;
    const fullscreen = win.isFullScreen();
    captionState.suppressed = fullscreen;
    const { x, y } = screen.getCursorScreenPoint();
    const box = win.getContentBounds();
    const fromRight = box.x + box.width - x, fromTop = y - box.y;
    const inside = fromRight >= 0 && fromRight <= box.width && fromTop >= 0 && fromTop <= box.height;
    // V35: the decision is caption.cjs (unit-tested); no focus requirement, a real approach zone.
    const next = captionDecide({ shown, armed, away }, { inside, fromRight, fromTop, elapsed, fullscreen, visible: win.isVisible() && !win.isMinimized() });
    armed = next.armed; away = next.away;
    set(next.shown);
    poll = setTimeout(tick, next.delay);
  };
  paint();
  tick();
  win.on("closed", () => { clearTimeout(poll); clearTimeout(fading); captionPaint = null; });
}

/** Tells the workspace what a pane did. Data only, and only while the workspace is the page shown. */
function notify(id, event) {
  const contents = mainWindow?.webContents;
  if (!contents || contents.isDestroyed() || originOf(contents.getURL()) !== workspaceOrigin) return;
  const payload = JSON.stringify({ ...event, id });
  contents.mainFrame.executeJavaScript(`window.__aegisBrowserEvent&&window.__aegisBrowserEvent(${payload})`).catch(() => {});
}

/** The person's browser tabs: their own signed-in session, downloads and permission questions. */
const tabs = userTabs({
  session,
  dialog,
  window: () => mainWindow,
  publicPage,
  tabOf: (contents) => {
    for (const [id, pane] of panes) if (pane.kind === "tab" && pane.view?.webContents === contents) return id;
    return null;
  },
  notify: (id, event) => notify(id, event),
  downloads: () => app.getPath("downloads"),
  appName: app.getName(),
});

/** V31: advert and tracker blocking on the tab session only, made the first time a tab opens. */
let protection = null;
function ensureProtection() {
  if (protection) return protection;
  protection = makeBlocker({
    store: tabs.session(),
    settingsFile: path.join(app.getPath("userData"), "blocker.json"),
    tabOf: (contentsId) => {
      for (const [id, pane] of panes) {
        if (pane.kind !== "tab" || pane.view?.webContents.id !== contentsId) continue;
        let host = "";
        try { host = new URL(pane.view.webContents.getURL()).hostname; } catch { /* not loaded yet */ }
        return { id, host };
      }
      return null;
    },
    notify: (() => {
      // A page can block hundreds of requests; the workspace hears at most every 400 ms per tab.
      const last = new Map();
      return (id, count) => {
        const now = Date.now();
        if (now - (last.get(id) || 0) < 400) return;
        last.set(id, now);
        notify(id, { kind: "blocked-count", count });
      };
    })(),
  });
  return protection;
}

function paneSession() {
  const store = session.fromPartition(PANE_PARTITION);
  if (store.__aegisReady) return store;
  store.__aegisReady = true;
  // An ordinary browser identity, without the app's own name in it.
  store.setUserAgent(store.getUserAgent().replace(/ Electron\/\S+/, "").replace(new RegExp(` ${app.getName()}/\\S+`, "i"), "").replace(/ aegis-frontend\/\S+/, ""));
  // Camera, microphone, location, notifications and the rest: refused, without asking.
  store.setPermissionRequestHandler((_contents, _permission, answer) => answer(false));
  store.setPermissionCheckHandler(() => false);
  store.setDevicePermissionHandler(() => false);
  // Nothing is saved to disk from a source page.
  store.on("will-download", (event, item, contents) => {
    event.preventDefault();
    for (const [id, pane] of panes) if (pane.view?.webContents === contents) notify(id, { kind: "download", url: item.getURL() });
  });
  return store;
}

function rectOf(input) {
  const numbers = [input?.x, input?.y, input?.width, input?.height].map(Number);
  if (!numbers.every(Number.isFinite)) throw new Error("Bad pane position.");
  const [x, y, width, height] = numbers;
  return { x: Math.round(x), y: Math.round(y), width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
}

function idOf(input) {
  const id = Number(input);
  if (!Number.isInteger(id) || id < 0) throw new Error("Bad pane.");
  return id;
}

function paneOf(input) {
  const pane = panes.get(idOf(input));
  if (!pane) throw new Error("That browser pane is closed.");
  return pane;
}

function pageOf(input) {
  const page = publicPage(input);
  if (!page) throw new Error("non_public_address");
  return page;
}

function history(id, contents) {
  const list = contents.navigationHistory;
  notify(id, { kind: "history", back: list.canGoBack(), forward: list.canGoForward() });
}

/** Gives a pane its live page. All panes share one browser session, so nothing is set up twice. */
let tabZoomPercent = 100;

function attachView(pane) {
  const id = pane.id;
  const view = new WebContentsView({
    webPreferences: {
      session: pane.kind === "tab" ? tabs.session() : paneSession(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
      // Chromium's own saving for a page that is not shown: timers and animation slow at once.
      backgroundThrottling: true,
      // No preload: a website gets no bridge to AEGIS of any kind.
    },
  });
  const contents = view.webContents;
  view.setBackgroundColor("#ffffff");
  // V33: a tab's page wears the Browse panel's corners (Zephium --content-radius matches its native view's radius).
  if (pane.kind === "tab" && typeof view.setBorderRadius === "function") view.setBorderRadius(12);
  view.setBounds(pane.bounds);
  view.setVisible(pane.visible);

  // A source pane opens nothing. A tab opens links as new tabs and sign-in popups as real popups (user-tabs.cjs).
  if (pane.kind === "tab") {
    contents.on("did-finish-load", () => contents.setZoomFactor(tabZoomPercent / 100));
    ensureProtection();
    const sendMedia = () => notify(id, {
      kind: "media", available: Boolean(pane.mediaAvailable), playing: Boolean(pane.mediaPlaying),
      audible: contents.isCurrentlyAudible(), muted: contents.isAudioMuted(),
    });
    pane.sendMedia = sendMedia;
    contents.on("media-started-playing", () => { pane.mediaAvailable = true; pane.mediaPlaying = true; sendMedia(); });
    contents.on("media-paused", () => { pane.mediaPlaying = false; sendMedia(); });
    contents.on("audio-state-changed", sendMedia);
    contents.on("did-start-navigation", (details) => {
      if (!details.isMainFrame || details.isSameDocument) return;
      protection?.resetTab(id);
      pane.mediaAvailable = false;
      pane.mediaPlaying = false;
      sendMedia();
    });
    contents.setWindowOpenHandler(tabs.windowOpen(id));
    contents.on("did-create-window", (child) => tabs.guardPopup(child, id));
    // A focused page gets the keys, so the browser's own shortcuts are passed back to the workspace.
    contents.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown" || !(input.control || input.meta) || input.alt) return;
      const key = String(input.key || "").toLowerCase();
      const tabKey = ["t", "w", "l", "tab", "h", "j", "e", ","].includes(key);
      const toolsKey = input.shift && ["k", "f", "o"].includes(key);
      if (tabKey || toolsKey) {
        event.preventDefault();
        notify(id, { kind: "shortcut", key, shift: Boolean(input.shift) });
      }
    });
  } else {
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
  }
  // The page itself may only go to public websites. Its frames load what any browser would.
  const guard = (event, url) => {
    if (publicPage(url)) return;
    event.preventDefault();
    notify(id, { kind: "blocked", url });
  };
  contents.on("will-navigate", guard);
  contents.on("will-redirect", (event, url, _inPage, isMainFrame) => {
    if (isMainFrame) guard(event, url);
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());

  const where = () => contents.getURL();
  contents.on("did-start-loading", () => {
    assist.invalidate(id);
    notify(id, { kind: "load", loading: true, url: where() });
  });
  contents.on("did-stop-loading", () => {
    notify(id, { kind: "load", loading: false, url: where() });
    history(id, contents);
  });
  contents.on("did-navigate", (_event, url) => {
    pane.url = url;
    notify(id, { kind: "load", loading: contents.isLoading(), url });
    history(id, contents);
  });
  contents.on("did-navigate-in-page", (_event, url, isMainFrame) => {
    if (!isMainFrame) return;
    assist.invalidate(id);
    pane.url = url;
    notify(id, { kind: "load", loading: contents.isLoading(), url });
    history(id, contents);
  });
  contents.on("page-title-updated", (_event, title) => {
    pane.title = title;
    notify(id, { kind: "title", title });
  });
  contents.on("page-favicon-updated", (_event, icons) => {
    const icon = icons.find((address) => address.startsWith("https://"));
    if (!icon) return;
    notify(id, { kind: "favicon", url: icon });
    // V32: Zephium's tab rows draw a 32 px RGBA raster. Fetched through the page's own session.
    void contents.session.fetch(icon).then((reply) => (reply.ok ? reply.arrayBuffer() : null)).then((bytes) => {
      if (!bytes || bytes.byteLength > 512 * 1024 || contents.isDestroyed()) return;
      const picture = nativeImage.createFromBuffer(Buffer.from(bytes));
      if (picture.isEmpty()) return;
      const bitmap = picture.resize({ width: 32, height: 32, quality: "best" }).toBitmap();
      if (bitmap.length !== 32 * 32 * 4) return;
      for (let at = 0; at < bitmap.length; at += 4) { const blue = bitmap[at]; bitmap[at] = bitmap[at + 2]; bitmap[at + 2] = blue; }
      notify(id, { kind: "favicon", url: icon, rgba: bitmap.toString("base64") });
    }).catch(() => {});
  });
  contents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    // -3 is a load the page or the person abandoned, not a failure.
    if (isMainFrame && code !== -3) notify(id, { kind: "failed", code, description, url });
  });
  contents.on("render-process-gone", () => notify(id, { kind: "failed", code: 0, description: "The page stopped working.", url: where() }));
  contents.on("focus", () => {
    lifecycle.touch(resourceId(id));
    notify(id, { kind: "focus" });
  });

  mainWindow.contentView.addChildView(view);
  pane.view = view;
  pane.frozen = false;
}

/** Ends the pane's page and its process. The pane itself, and where it was, remain. */
function destroyView(pane) {
  const view = pane.view;
  if (!view) return;
  pane.view = null;
  pane.frozen = false;
  const contents = view.webContents;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (!contents.isDestroyed() && contents.isFocused()) mainWindow.webContents.focus();
    mainWindow.contentView.removeChildView(view);
  }
  if (!contents.isDestroyed()) {
    try {
      if (contents.debugger.isAttached()) contents.debugger.detach();
    } catch {
      /* already detached */
    }
    contents.close();
  }
}

function createPane(id, bounds, url, kind = "source") {
  // Browse shows a tab explicitly after checking that it is still selected.
  const pane = { id, kind, view: null, bounds, visible: kind !== "tab", url, title: "", scrollY: 0, frozen: false };
  panes.set(id, pane);
  attachView(pane);
  registerPane(pane);
  watchResources();
  void syncVisibility(pane);
  return pane;
}

/** AEGIS_DESKTOP_DEBUG=1 prints why panes come and go. */
const trace = process.env.AEGIS_DESKTOP_DEBUG === "1" ? (...words) => console.error("[aegis]", ...words) : () => {};

function closePane(id, why = "asked") {
  const pane = panes.get(id);
  if (!pane) return;
  trace("close pane", id, why, pane.url);
  panes.delete(id);
  assist.invalidate(id);
  lifecycle.unregister(resourceId(id));
  destroyView(pane);
  watchResources();
}

function countOf(kind) {
  let count = 0;
  for (const pane of panes.values()) if (pane.kind === kind) count += 1;
  return count;
}

function closeAllPanes(why = "asked") {
  for (const id of [...panes.keys()]) closePane(id, why);
}

/** A pane the person acts on must have its page, even if it had been released. */
async function live(pane) {
  lifecycle.touch(resourceId(pane.id));
  if (!pane.view) {
    // Shown or not, it is wanted now.
    await lifecycle.setVisible(resourceId(pane.id), true);
    await syncVisibility(pane);
  }
  if (!pane.view) throw new Error("That browser pane is closed.");
  return pane.view.webContents;
}

// ---------------------------------------------------------------- commands

/** What the bundled start page may ask for. */
const shellCommands = {
  desktop_config: () => loadConfig(),
  desktop_save_config: ({ config }) => saveConfig(config),
  desktop_boot: () => boot(),
};

/** What the AEGIS workspace may ask for. */
const assist = browserAssist({ panes, publicPage, dialog, window: () => mainWindow, live });
// V33: developer folder/file access (native dialogs only) and Work <-> browser hand-offs.
const dev = workDev({ panes, publicPage, dialog, window: () => mainWindow, projectRoot: () => loadConfig().projectRoot });
// V35: updates for an installed AEGIS (a development copy reports "development" and never updates itself).
const updates = makeUpdater({ app, safeStorage, log: (line) => console.log("[update] " + line) });
const workspaceCommands = {
  ...updates.commands,
  ...assist.commands,
  ...dev.commands,
  ...captionCommands,
  async browser_open({ id, url, rect }) {
    const page = pageOf(url);
    const key = idOf(id);
    const bounds = rectOf(rect);
    let pane = panes.get(key);
    if (pane && pane.kind !== "source") throw new Error("That id is a browser tab.");
    if (!pane) {
      if (countOf("source") >= MAX_PANES) throw new Error("Too many browser panes are open.");
      pane = createPane(key, bounds, page.href);
    } else {
      pane.bounds = bounds;
      pane.view?.setBounds(bounds);
    }
    // A failed load is reported through the pane's own events, not as a failure to open it.
    (await live(pane)).loadURL(page.href).catch(() => {});
    void lifecycle.tick();
  },
  /** V30: a browser tab. Same commands as a pane after this (navigate, back, show...), its own session and rules. */
  async tab_open({ id, url, rect }) {
    const page = pageOf(url);
    const key = idOf(id);
    const bounds = rectOf(rect);
    let pane = panes.get(key);
    if (pane && pane.kind !== "tab") throw new Error("That id is a source pane.");
    if (!pane) {
      if (countOf("tab") >= MAX_TABS) throw new Error("Too many browser tabs are open.");
      pane = createPane(key, bounds, page.href, "tab");
    } else {
      pane.bounds = bounds;
      pane.view?.setBounds(bounds);
    }
    (await live(pane)).loadURL(page.href).catch(() => {});
    void lifecycle.tick();
  },
  async tab_media({ id, action }) {
    const pane = paneOf(id);
    if (pane.kind !== "tab" || !pane.view || !["play", "pause", "mute", "unmute"].includes(action)) {
      throw new Error("That tab and media action are unavailable.");
    }
    const contents = pane.view.webContents;
    if (action === "mute" || action === "unmute") {
      contents.setAudioMuted(action === "mute");
      pane.sendMedia?.();
      return;
    }
    if (action === "pause") {
      await contents.executeJavaScript('document.querySelectorAll("video,audio").forEach(item => { if (!item.paused) { item.dataset.aegisMediaPaused = ""; item.pause(); } })', true);
    } else {
      const played = await contents.executeJavaScript('(async () => { const all = [...document.querySelectorAll("video,audio")]; const held = all.filter(item => Object.hasOwn(item.dataset, "aegisMediaPaused")); const choices = held.length ? held : all.filter(item => item.currentSrc && item.paused).slice(0, 1); const results = await Promise.allSettled(choices.map(async item => { await item.play(); delete item.dataset.aegisMediaPaused; })); return results.some(result => result.status === "fulfilled"); })()', true);
      if (!played) throw new Error("No playable media was found.");
    }
  },
  tab_zoom({ percent }) {
    if (!Number.isInteger(percent) || percent < 50 || percent > 200) throw new Error("Invalid browser page zoom.");
    tabZoomPercent = percent;
    for (const pane of panes.values()) {
      if (pane.kind === "tab" && pane.view) pane.view.webContents.setZoomFactor(percent / 100);
    }
  },
  async browser_stop({ id }) {
    (await live(paneOf(id))).stop();
  },
  tab_downloads() {
    return tabs.downloads();
  },
  /** V31 privacy: real counts of cancelled requests, on/off, and sites where nothing is blocked. */
  blocker_status({ id } = {}) {
    if (!protection) return { enabled: true, today: 0, sinceStart: 0, tab: 0, allowed: [], topHosts: [], rules: null, started: false };
    return { ...protection.status(id == null ? null : idOf(id)), started: true };
  },
  blocker_set({ enabled }) {
    ensureProtection().setEnabled(enabled);
    return protection.status(null);
  },
  blocker_allow({ host, allowed }) {
    ensureProtection().allow(String(host || ""), Boolean(allowed));
    return protection.status(null);
  },
  /** Site permissions answered this run of the app, and forgetting them. */
  permissions_list() {
    return tabs.decisions();
  },
  permissions_reset({ origin } = {}) {
    tabs.forget(origin ? String(origin) : null);
    return tabs.decisions();
  },
  /**
   * Clears the person's browsing data in the tab session only. Sign-ins live in cookies, so clearing them
   * signs the person out of sites; source panes and the agent browser are untouched.
   */
  async tab_clear_data({ cookies = false, cache = true } = {}) {
    const store = tabs.session();
    if (cache) await store.clearCache();
    if (cookies) await store.clearStorageData({ storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage"] });
    return { cleared: { cache: Boolean(cache), cookies: Boolean(cookies) } };
  },
  /** Shows a finished download in its folder; only a file this app saved, never an arbitrary path. */
  download_show({ id }) {
    const row = tabs.downloads().find((entry) => entry.id === Number(id));
    if (row?.path && row.state === "completed") shell.showItemInFolder(row.path);
  },
  // Sent many times a second while a pane moves; one arriving after the pane closed is not an error.
  browser_bounds({ id, rect }) {
    const pane = panes.get(idOf(id));
    if (!pane) return;
    pane.bounds = rectOf(rect);
    pane.view?.setBounds(pane.bounds);
  },
  async browser_show({ id, visible }) {
    const pane = panes.get(idOf(id));
    if (!pane) return;
    pane.visible = Boolean(visible);
    const restoreFocus = !pane.visible && pane.view?.webContents.isFocused();
    pane.view?.setVisible(pane.visible);
    // Return the keyboard to the workspace after removing the focused native layer.
    if (restoreFocus) mainWindow.webContents.focus();
    await syncVisibility(pane);
    pane.view?.setVisible(pane.visible);
  },
  async browser_navigate({ id, url }) {
    const page = pageOf(url);
    (await live(paneOf(id))).loadURL(page.href).catch(() => {});
  },
  async browser_back({ id }) {
    const list = (await live(paneOf(id))).navigationHistory;
    if (list.canGoBack()) list.goBack();
  },
  async browser_forward({ id }) {
    const list = (await live(paneOf(id))).navigationHistory;
    if (list.canGoForward()) list.goForward();
  },
  async browser_reload({ id }) {
    (await live(paneOf(id))).reload();
  },
  browser_close({ id }) {
    closePane(idOf(id), "the workspace closed it");
  },
  browser_close_all() {
    closeAllPanes("the workspace closed all");
  },
  /** "Open in browser": hands a public web address to the person's default browser. */
  async open_external({ url }) {
    await shell.openExternal(pageOf(url).href);
  },
};

let notesFiles = null;
ipcMain.handle("aegis", async (event, command, args) => {
  const contents = mainWindow?.webContents;
  // Only the main window's top frame: never a pane, never a frame inside the workspace.
  if (!contents || event.sender !== contents || event.senderFrame !== contents.mainFrame) throw new Error("Not allowed from this page.");
  const from = event.senderFrame.url;
  if (['notes_folder_select','notes_folder_sync','notes_folder_disable'].includes(command)) {
    if (!workspaceOrigin || originOf(from)!==workspaceOrigin) throw new Error('Not allowed from this page.');
    const bridge=notesFiles ||= new NoteFiles(path.join(app.getPath('userData'),'notes-folder.json'));
    if(command==='notes_folder_select'){
      const selected=await dialog.showOpenDialog(mainWindow,{title:'Choose a Markdown folder for AEGIS Notes',properties:['openDirectory','createDirectory']});
      return selected.canceled?null:bridge.select(selected.filePaths[0]);
    }
    if(command==='notes_folder_disable'){await bridge.disable();return {enabled:false};}
    return bridge.sync(args?.notes);
  }
  if (Object.hasOwn(shellCommands, command)) {
    if (from.split(/[?#]/)[0] !== SHELL_URL) throw new Error("Not allowed from this page.");
    return shellCommands[command](args ?? {});
  }
  if (Object.hasOwn(workspaceCommands, command)) {
    if (!workspaceOrigin || originOf(from) !== workspaceOrigin) throw new Error("Not allowed from this page.");
    return workspaceCommands[command](args ?? {});
  }
  throw new Error("Unknown command.");
});

/** For the tests and the profiler, which read it from the main process. Not reachable from any page. */
globalThis.aegisDesktopDiagnostics = () => ({
  uiMode,
  startedServices,
  lifecycle: lifecycle.status(),
  permissions: tabs.decisions(),
  partitions: { tabs: tabs.partition, panes: PANE_PARTITION },
  caption: { ...captionState },
  bounds: mainWindow && !mainWindow.isDestroyed() ? mainWindow.getContentBounds() : null,
  panes: [...panes.values()].map((pane) => ({ id: pane.id, kind: pane.kind, session: pane.view ? (pane.kind === "tab" ? tabs.partition : PANE_PARTITION) : "", live: Boolean(pane.view), visible: pane.visible, frozen: pane.frozen, url: pane.view?.webContents.getURL() || pane.url, bounds: pane.bounds || null, state: lifecycle.stateOf(resourceId(pane.id)) })),
});

// ---------------------------------------------------------------- window

function allowedInWindow(address) {
  return address.split(/[?#]/)[0] === SHELL_URL || (workspaceOrigin !== "" && originOf(address) === workspaceOrigin);
}

function openOutside(address) {
  const page = publicPage(address);
  if (page) shell.openExternal(page.href).catch(() => {});
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "AEGIS",
    icon: ICON,
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#16171a",
    // V31: Windows' own minimize, maximize and close buttons (snap layouts included), drawn in AEGIS's colours
    // over a 36 px band instead of a full title bar. AEGIS_NATIVE_TITLEBAR=1 brings the system title bar back.
    ...(process.env.AEGIS_NATIVE_TITLEBAR === "1" ? {} : { titleBarStyle: "hidden", titleBarOverlay: { color: "#00000000", symbolColor: CAPTION.tones.dark.quiet, height: CAPTION.height } }),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
      // A minimized or covered window stops animating and slows its timers.
      backgroundThrottling: true,
      spellcheck: false,
    },
  });
  const contents = mainWindow.webContents;
  mainWindow.once("ready-to-show", () => mainWindow.show());
  if (process.env.AEGIS_NATIVE_TITLEBAR !== "1") captionReveal(mainWindow);
  mainWindow.on("page-title-updated", (event) => event.preventDefault());

  // The window shows the start page or the workspace; any other link leaves for the default browser.
  const guard = (event, url) => {
    if (allowedInWindow(url)) return;
    event.preventDefault();
    openOutside(url);
  };
  contents.on("will-navigate", guard);
  contents.on("will-redirect", (event, url, _inPage, isMainFrame) => {
    if (isMainFrame) guard(event, url);
  });
  contents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: "deny" };
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());
  // A reload, or a return to the start page, leaves no pane behind over the new page.
  contents.on("did-start-navigation", (details) => {
    if (details.isMainFrame && !details.isSameDocument) closeAllPanes(`the window went to ${details.url}`);
  });
  // Pane positions are sent in page pixels, so the page must not be zoomed.
  contents.on("did-finish-load", () => contents.setZoomFactor(1));
  contents.setVisualZoomLevelLimits(1, 1).catch(() => {});
  if (process.env.AEGIS_DESKTOP_DEVTOOLS === "1") contents.openDevTools({ mode: "detach" });

  // Minimized or hidden, no pane is on show: they idle, freeze and are released like any hidden pane.
  const windowChanged = () => {
    for (const pane of panes.values()) void syncVisibility(pane);
  };
  for (const name of ["minimize", "restore", "hide", "show"]) mainWindow.on(name, windowChanged);

  mainWindow.on("closed", () => {
    for (const id of [...panes.keys()]) lifecycle.unregister(resourceId(id));
    panes.clear();
    watchResources();
    mainWindow = null;
    // Its hidden windows would otherwise keep the app running.
    agentHost?.shutdown();
    agentHost = null;
    app.quit();
  });
  mainWindow.loadFile(SHELL_PAGE);
}

function workspacePermissions() {
  const allowed = (origin, permission) => workspaceOrigin !== "" && originOf(origin) === workspaceOrigin && WORKSPACE_PERMISSIONS.has(permission);
  session.defaultSession.setPermissionRequestHandler((contents, permission, answer, details) => {
    answer(allowed(details?.requestingUrl || contents?.getURL() || "", permission));
  });
  session.defaultSession.setPermissionCheckHandler((_contents, permission, origin) => allowed(origin || "", permission));
  session.defaultSession.on("will-download", (_event, item) => {
    // Reports and exports the person asks AEGIS for go to Downloads through the normal save dialog.
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath("downloads"), item.getFilename()) });
  });
}

/** Desktop and Start Menu shortcuts carrying the AEGIS icon. */
function installShortcuts() {
  const details = {
    target: process.execPath,
    args: `"${path.join(__dirname, "main.cjs")}"`,
    cwd: path.dirname(__dirname),
    description: "AEGIS research workspace",
    icon: ICON,
    iconIndex: 0,
    appUserModelId: APP_ID,
  };
  const places = [path.join(app.getPath("desktop"), "AEGIS.lnk"), path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs", "AEGIS.lnk")];
  for (const place of places) {
    const made = shell.writeShortcutLink(place, fs.existsSync(place) ? "replace" : "create", details);
    console.log(`${made ? "Created" : "Could not create"} ${place}`);
  }
}

if (process.argv.includes("--install-shortcuts")) {
  app.whenReady().then(() => {
    installShortcuts();
    app.quit();
  });
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    workspacePermissions();
    if (process.env.AEGIS_AGENT_BROWSER !== "0") {
      try {
        agentHost = agentBrowser.start({ userData: app.getPath("userData"), log: trace });
      } catch (error) {
        console.error(`The agent browser could not start: ${error.message}`);
      }
    }
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
  app.on("will-quit", () => {
    if (lifecycleTimer) clearInterval(lifecycleTimer);
    agentHost?.shutdown();
    void ownServer?.close();
    if (installation.installed) return installation.stopBackend();
    const config = loadConfig();
    if (startedServices && config.stopOnExit && config.projectRoot) services.stop(config.projectRoot);
  });
}
