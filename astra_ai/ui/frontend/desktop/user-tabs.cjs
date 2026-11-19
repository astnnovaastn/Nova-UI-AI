/**
 * V30: the person's own browser tabs, as opposed to research source panes and the agent browser.
 *
 * Three browser contexts, three sessions, nothing shared between them:
 *  - user tabs        persist:aegis-user     signed-in sites live here (Google and the rest), kept across restarts;
 *  - source panes     persist:aegis-browser  research sources the workspace opens; no permissions, no downloads;
 *  - agent browser    in-memory partition    background reading by AEGIS agents (agent-browser.cjs); never these cookies.
 *
 * A user tab behaves like an ordinary browser tab: any public website, sign-in pages exactly as the
 * site serves them (nothing injected, nothing read), links that open a new tab become a new AEGIS tab,
 * a sign-in popup (OAuth) opens as a real popup window so `window.opener` keeps working, downloads go
 * through a save dialog into Downloads and are listed, and a site asking for the camera, microphone,
 * location or notifications gets an explicit question, remembered for that site until the app closes.
 *
 * Signing into Gmail here does not let AEGIS agents read Gmail: they use the separate read-only OAuth
 * connection (google_accounts.py) and their own isolated session.
 */
const path = require("node:path");

const USER_PARTITION = "persist:aegis-user";
/** Asked for, once per site per run of the app. */
const ASK = { media: "use your camera or microphone", geolocation: "know your location", notifications: "show notifications", "clipboard-read": "read your clipboard", midi: "use MIDI devices", "idle-detection": "know when you are idle" };
/** Allowed without a question, as every browser does. */
const ALWAYS = new Set(["fullscreen", "clipboard-sanitized-write", "pointerLock", "window-management"]);

function plainUserAgent(store, appName) {
  return store.getUserAgent().replace(/ Electron\/\S+/, "").replace(new RegExp(` ${appName}/\\S+`, "i"), "").replace(/ aegis-frontend\/\S+/, "");
}

/**
 * @param {object} deps
 * @param {import('electron').session} deps.session
 * @param {import('electron').dialog} deps.dialog
 * @param {() => import('electron').BrowserWindow | null} deps.window
 * @param {(url: string) => URL | null} deps.publicPage
 * @param {(contents: import('electron').WebContents) => number | null} deps.tabOf  the tab id of a page, or null
 * @param {(id: number, event: object) => void} deps.notify
 * @param {() => string} deps.downloads  the Downloads folder
 * @param {string} deps.appName
 */
function userTabs({ session, dialog, window, publicPage, tabOf, notify, downloads, appName }) {
  /** origin -> permission -> boolean, for this run of the app only. */
  const decisions = new Map();
  const recent = [];
  let ready = null;

  function remembered(origin, permission) {
    return decisions.get(origin)?.get(permission);
  }

  async function ask(origin, permission) {
    const known = remembered(origin, permission);
    if (known !== undefined) return known;
    const parent = window();
    const host = (() => { try { return new URL(origin).host; } catch { return origin; } })();
    const { response } = await dialog.showMessageBox(parent ?? undefined, {
      type: "question",
      buttons: ["Allow", "Block"],
      defaultId: 1,
      cancelId: 1,
      title: "Site permission",
      message: `${host} wants to ${ASK[permission] ?? permission}.`,
      detail: "Your answer is kept for this site until AEGIS closes. AEGIS agents never get this permission.",
      noLink: true,
    });
    const allowed = response === 0;
    if (!decisions.has(origin)) decisions.set(origin, new Map());
    decisions.get(origin).set(permission, allowed);
    return allowed;
  }

  function sessionFor() {
    if (ready) return ready;
    const store = session.fromPartition(USER_PARTITION);
    ready = store;
    // Chromium's own identity. Electron and app tokens are removed so ordinary sites see the browser this is.
    const honest = store.getUserAgent();
    store.setUserAgent(plainUserAgent(store, appName));
    // V32: Google's sign-in host gets the unmodified identity, Electron token included. Google refuses
    // sign-in from embedded frameworks, and AEGIS must not hide what it is to get past that check.
    store.webRequest.onBeforeSendHeaders({ urls: ["https://accounts.google.com/*"] }, (details, done) => {
      done({ requestHeaders: { ...details.requestHeaders, "User-Agent": honest } });
    });
    store.setPermissionRequestHandler((contents, permission, answer, details) => {
      if (tabOf(contents) === null && !isPopup(contents)) return answer(false);
      if (ALWAYS.has(permission)) return answer(true);
      if (!ASK[permission]) return answer(false);
      const origin = details?.requestingUrl ? new URL(details.requestingUrl).origin : contents.getURL();
      ask(origin, permission).then(answer, () => answer(false));
    });
    store.setPermissionCheckHandler((_contents, permission, origin) => ALWAYS.has(permission) || remembered(origin, permission) === true);
    store.setDevicePermissionHandler(() => false);
    store.on("will-download", (_event, item, contents) => {
      const id = tabOf(contents);
      const row = { id: recent.length + 1, tab: id, url: item.getURL(), filename: item.getFilename(), state: "progressing", received: 0, total: item.getTotalBytes(), path: "" };
      recent.unshift(row);
      recent.splice(30);
      // The person chooses where it goes; Downloads is offered.
      item.setSaveDialogOptions({ defaultPath: path.join(downloads(), item.getFilename()) });
      const tell = () => { if (id !== null) notify(id, { kind: "download", url: row.url, filename: row.filename, state: row.state, received: row.received, total: row.total }); };
      item.on("updated", (_e, state) => { row.state = state; row.received = item.getReceivedBytes(); row.path = item.getSavePath(); tell(); });
      item.once("done", (_e, state) => { row.state = state; row.received = item.getReceivedBytes(); row.path = item.getSavePath(); tell(); });
      tell();
    });
    return store;
  }

  const popups = new Set();
  function isPopup(contents) {
    return popups.has(contents.id);
  }

  /** What a page in a user tab may open: new tabs for links, a real popup for sign-in windows. */
  function windowOpen(id) {
    return ({ url, disposition, features }) => {
      if (!publicPage(url)) return { action: "deny" };
      // A sized popup (window.open with features) is usually a sign-in or payment window that talks back to its opener.
      if (disposition === "new-window" && features) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            parent: window() ?? undefined,
            width: 520,
            height: 700,
            autoHideMenuBar: true,
            backgroundColor: "#ffffff",
            webPreferences: { session: sessionFor(), sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: false },
          },
        };
      }
      notify(id, { kind: "open-tab", url, background: disposition === "background-tab" });
      return { action: "deny" };
    };
  }

  /** A popup is held to the same rules as its tab: public pages only, its own popups become tabs of the opener. */
  function guardPopup(child, openerTab) {
    const contents = child.webContents;
    popups.add(contents.id);
    contents.once("destroyed", () => popups.delete(contents.id));
    child.setMenuBarVisibility(false);
    const guard = (event, url) => {
      if (!publicPage(url)) event.preventDefault();
    };
    contents.on("will-navigate", guard);
    contents.on("will-redirect", (event, url, _inPage, isMainFrame) => { if (isMainFrame) guard(event, url); });
    contents.on("will-attach-webview", (event) => event.preventDefault());
    contents.setWindowOpenHandler(windowOpen(openerTab));
  }

  return {
    partition: USER_PARTITION,
    session: sessionFor,
    windowOpen,
    guardPopup,
    downloads: () => recent.map((row) => ({ ...row })),
    /** For the diagnostics only: which permissions were answered. */
    decisions: () => [...decisions].map(([origin, map]) => ({ origin, ...Object.fromEntries(map) })),
    /** Forgets the answers for one site, or for all of them; the site asks again next time. */
    forget: (origin) => (origin ? decisions.delete(origin) : decisions.clear()),
  };
}

module.exports = { userTabs, USER_PARTITION };
