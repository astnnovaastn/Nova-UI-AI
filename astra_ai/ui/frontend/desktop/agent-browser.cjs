/**
 * The agent browser: a hidden, sandboxed renderer the AEGIS backend may use to read JavaScript-heavy
 * public pages and take screenshots for background research (V29 AgentBrowser, optional renderer).
 *
 *  - Never shown. Each page lives in a hidden offscreen BrowserWindow that is not part of the
 *    workspace window, the panes map or the resource manager. At most two exist; an idle one is
 *    closed after a minute.
 *  - Never the person's browser: an in-memory session of its own (not persist:aegis-browser), so no
 *    sign-ins or cookies of theirs, no preload, no Node, sandboxed, context-isolated.
 *  - Public web only: the same address rule as source panes, plus every request (subresources and
 *    frames included) is checked after DNS and cancelled if a name resolves to this computer or a
 *    private network. Permissions, downloads, new windows, webviews and page dialogs are refused.
 *  - Reads only. A fixed extraction script runs in an isolated world; what it returns came from a
 *    web page and is capped here and re-checked by the backend as untrusted data.
 *  - Stops at walls. A CAPTCHA, bot check, consent wall, 403 or 429 is reported as blocked and
 *    never solved or worked around.
 *
 * The backend cannot reach this process. This process opens an outbound WebSocket to the backend
 * on loopback and proves itself with a random token written to a user-only file at start-up.
 *
 * Plain helpers (address checks, wall detection, the connection) are exported for
 * tests/desktop-agent-browser.test.cjs and need no Electron.
 */
const crypto = require("node:crypto");
const dns = require("node:dns");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { privateHost, publicPage } = require("./addresses.cjs");

const MAX_CONTENTS = 2;
const IDLE_CLOSE_MS = 60 * 1000;
const LOAD_TIMEOUT_MS = 15 * 1000;
const SETTLE_MS = 1500;
const QUEUE_WAIT_MS = 15 * 1000;
const EXTRACT_TIMEOUT_MS = 4000;
const MAX_SHOT_WIDTH = 1600;
const MAX_SHOT_BASE64 = 12 * 1024 * 1024;
const DNS_CACHE_MS = 30 * 1000;
const ISOLATED_WORLD = 1729;
const HOST_URL = "ws://127.0.0.1:" + (process.env.AEGIS_BACKEND_PORT || 8340) + "/api/work/agent-browser/host";
const TOKEN_FILE = "agent-browser.token";
const ACTIONS = new Set(["render", "screenshot"]);
const LIMITS = { title: 1000, text: 60000, links: 200, images: 40, href: 2048, linkText: 300, alt: 300 };

// ---------------------------------------------------------------- plain helpers

function failure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

/** A resolved address a page must never reach: this computer, private and special-use networks. */
function privateAddress(ip) {
  const address = String(ip).replace(/^\[|\]$/g, "").replace(/%.*$/, "").toLowerCase();
  const family = net.isIP(address);
  if (!family) return true;
  if (privateHost(address)) return true;
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    // Shared address space (carrier NAT) and benchmarking networks.
    return (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19));
  }
  // Documentation and NAT64 prefixes, which can hide an IPv4 address.
  return address.startsWith("2001:db8:") || address.startsWith("64:ff9b:");
}

/** Whether every address a host name resolves to is public. Results are cached briefly. */
function makeResolver({ lookup = (host) => dns.promises.lookup(host, { all: true, verbatim: true }), now = () => Date.now() } = {}) {
  const cache = new Map();
  return async function publicHost(hostname) {
    const host = String(hostname).replace(/\.$/, "").replace(/^\[|\]$/g, "").toLowerCase();
    if (!host || privateHost(host)) return false;
    if (net.isIP(host)) return !privateAddress(host);
    const known = cache.get(host);
    if (known && known.until > now()) return known.ok;
    let ok = false;
    try {
      const rows = await lookup(host);
      ok = Array.isArray(rows) && rows.length > 0 && rows.every((row) => !privateAddress(row.address));
    } catch {
      ok = false;
    }
    if (cache.size > 500) cache.clear();
    cache.set(host, { ok, until: now() + DNS_CACHE_MS });
    return ok;
  };
}

/** Whether a request from an agent page may go out, before DNS: scheme and literal host only. */
function requestScheme(address) {
  let url;
  try {
    url = new URL(address);
  } catch {
    return "deny";
  }
  if (url.protocol === "data:" || url.protocol === "blob:" || url.protocol === "about:") return "allow";
  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) return "deny";
  if (url.username || url.password || !url.hostname || privateHost(url.hostname)) return "deny";
  return "resolve";
}

const CAPTCHA_FRAME = /(google\.com|recaptcha\.net)\/recaptcha|hcaptcha\.com|challenges\.cloudflare\.com|arkoselabs\.com|funcaptcha\.com|captcha-delivery\.com|geo\.captcha/i;
const CHALLENGE_TITLE = /^(just a moment|attention required|access denied|are you a robot|verify you are human|security check|one more step)\b/i;
const CHALLENGE_TEXT = /unusual traffic|are you a (robot|human)|verify (that )?you are (a )?human|checking (if the site connection is secure|your browser)|enable javascript and cookies to continue|press (&|and) hold|complete the security check/i;
const CONSENT_HOST = /^consent\.(google|youtube)\.[a-z.]+$|^(www\.)?consent\./i;
const CONSENT_TEXT = /before you continue|we value your privacy|accept all cookies|cookie(s)? (settings|preferences)|your privacy choices/i;

/**
 * Why a rendered page is a wall rather than content, or "". The probe comes from the page, so only
 * its shape is trusted. A real article with a cookie banner or an invisible reCAPTCHA on a form is
 * not a wall: text-based markers only count on short pages.
 */
function wallReason({ status = 0, finalUrl = "", title = "", text = "", frames = [], challenge = false } = {}) {
  if (status === 403 || status === 429) return `http_${status}`;
  const body = String(text || "");
  const short = body.trim().length < 2500;
  const host = (() => {
    try {
      return new URL(finalUrl).hostname;
    } catch {
      return "";
    }
  })();
  if (challenge && short) return "captcha";
  if (short && (Array.isArray(frames) ? frames : []).some((src) => CAPTCHA_FRAME.test(String(src)))) return "captcha";
  if (CHALLENGE_TITLE.test(String(title).trim())) return "bot_check";
  if (short && CHALLENGE_TEXT.test(body.slice(0, 4000))) return "bot_check";
  if (CONSENT_HOST.test(host)) return "consent_wall";
  if (body.trim().length < 1200 && CONSENT_TEXT.test(body)) return "consent_wall";
  return "";
}

/** The fixed, read-only extraction script. Runs in an isolated world, so the page cannot tamper with the DOM methods it uses. */
const EXTRACT_SCRIPT = `(() => {
  const clean = (value, limit) => String(value || "").replace(/[ \\t]+/g, " ").replace(/\\n{3,}/g, "\\n\\n").trim().slice(0, limit);
  const body = document.body;
  const main = document.querySelector("main, article, [role=main]");
  const mainText = main ? main.innerText || "" : "";
  const bodyText = body ? body.innerText || "" : "";
  const text = mainText.trim().length >= 500 ? mainText : bodyText;
  const links = [];
  const seen = new Set();
  for (const a of document.querySelectorAll("a[href]")) {
    if (links.length >= ${LIMITS.links}) break;
    const href = a.href;
    if (!/^https?:/i.test(href) || href.length > ${LIMITS.href} || seen.has(href)) continue;
    seen.add(href);
    links.push({ href, text: clean(a.innerText || a.textContent, ${LIMITS.linkText}) });
  }
  const images = [];
  for (const img of document.querySelectorAll("img")) {
    if (images.length >= ${LIMITS.images}) break;
    const src = img.currentSrc || img.src;
    if (!/^https?:/i.test(src) || src.length > ${LIMITS.href}) continue;
    images.push({ src, alt: clean(img.alt, ${LIMITS.alt}) });
  }
  const frames = [...document.querySelectorAll("iframe")].map((frame) => String(frame.src || "").slice(0, 300)).filter(Boolean).slice(0, 30);
  const challenge = Boolean(document.querySelector("#challenge-form, #challenge-running, #cf-challenge-running, .cf-challenge, .cf-turnstile, #captcha-container, .g-recaptcha:not([data-size=invisible]), .h-captcha"));
  return { title: clean(document.title, ${LIMITS.title}), text: clean(text, ${LIMITS.text}), links, images, frames, challenge };
})()`;

const str = (value, limit) => (typeof value === "string" ? value.slice(0, limit) : "");
const httpUrl = (value) => typeof value === "string" && value.length <= LIMITS.href && /^https?:\/\//i.test(value);

/** The page's answer, reduced to the agreed shape and sizes. */
function pageResult(raw, finalUrl) {
  const data = raw && typeof raw === "object" ? raw : {};
  const links = (Array.isArray(data.links) ? data.links : []).filter((row) => row && httpUrl(row.href)).slice(0, LIMITS.links).map((row) => ({ href: row.href, text: str(row.text, LIMITS.linkText) }));
  const images = (Array.isArray(data.images) ? data.images : []).filter((row) => row && httpUrl(row.src)).slice(0, LIMITS.images).map((row) => ({ src: row.src, alt: str(row.alt, LIMITS.alt) }));
  return { final_url: finalUrl, title: str(data.title, LIMITS.title), text: str(data.text, LIMITS.text), links, images };
}

/** A request from the backend, or null if it is not one. */
function parseRequest(raw) {
  let message;
  try {
    message = JSON.parse(String(raw));
  } catch {
    return null;
  }
  if (!message || typeof message !== "object" || !Number.isSafeInteger(message.id)) return null;
  if (!ACTIONS.has(message.action) || typeof message.url !== "string" || message.url.length > 4096) return null;
  return { id: message.id, action: message.action, url: message.url };
}

/** Only a short error code ever goes back, never a message that might carry page content. */
function errorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z][a-z0-9_]{0,60}$/.test(code) ? code : "renderer_failed";
}

// ---------------------------------------------------------------- the connection to the backend

/**
 * Keeps an outbound WebSocket to the backend open, reconnecting with backoff. The first frame
 * carries the token; requests are answered only after the backend says "ready".
 */
class HostLink {
  constructor({ url = HOST_URL, token, handle, WebSocketImpl = globalThis.WebSocket, minDelay = 1000, maxDelay = 30000, timers = { set: setTimeout, clear: clearTimeout }, log = () => {} }) {
    if (!token || !handle || !WebSocketImpl) throw new Error("HostLink needs a token, a handler and WebSocket.");
    Object.assign(this, { url, token, handle, WebSocketImpl, minDelay, maxDelay, timers, log });
    this.delay = minDelay;
    this.socket = null;
    this.ready = false;
    this.stopped = true;
    this.timer = null;
  }

  start() {
    this.stopped = false;
    if (!this.socket && !this.timer) this.connect();
    return this;
  }

  /** Try now (the backend was just started), instead of waiting out the backoff. */
  kick() {
    if (this.stopped || this.socket) return;
    if (this.timer) this.timers.clear(this.timer);
    this.timer = null;
    this.delay = this.minDelay;
    this.connect();
  }

  stop() {
    this.stopped = true;
    if (this.timer) this.timers.clear(this.timer);
    this.timer = null;
    const socket = this.socket;
    this.socket = null;
    this.ready = false;
    try {
      socket?.close();
    } catch {
      /* already closed */
    }
  }

  connect() {
    this.timer = null;
    let socket;
    try {
      socket = new this.WebSocketImpl(this.url);
    } catch {
      return this.retry();
    }
    this.socket = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "hello", token: this.token }));
    socket.onmessage = (event) => this.message(socket, event.data);
    socket.onerror = () => {};
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.ready) this.log("agent browser: backend connection closed");
      this.ready = false;
      this.retry();
    };
  }

  retry() {
    if (this.stopped || this.timer) return;
    this.timer = this.timers.set(() => this.connect(), this.delay);
    this.delay = Math.min(this.maxDelay, this.delay * 2);
  }

  message(socket, data) {
    if (typeof data !== "string") return;
    if (!this.ready) {
      try {
        if (JSON.parse(data)?.type === "ready") {
          this.ready = true;
          this.delay = this.minDelay;
          this.log("agent browser: connected to the backend");
        }
      } catch {
        /* not for us */
      }
      return;
    }
    const request = parseRequest(data);
    if (!request) return;
    const reply = (body) => {
      if (this.socket !== socket) return;
      try {
        socket.send(JSON.stringify({ id: request.id, ...body }));
      } catch {
        /* closed meanwhile */
      }
    };
    Promise.resolve()
      .then(() => this.handle(request.action, request.url))
      .then((result) => reply({ ok: true, result }), (error) => reply({ ok: false, error: errorCode(error) }));
  }
}

/** A fresh token, written where only this user can read it, for the backend to check. */
function writeToken(userData, token = crypto.randomBytes(32).toString("base64url")) {
  const file = path.join(userData, TOKEN_FILE);
  fs.mkdirSync(userData, { recursive: true });
  // %APPDATA% is private to the user on Windows; the mode covers other systems.
  fs.writeFileSync(file, token, { encoding: "utf8", mode: 0o600 });
  return { token, file };
}

// ---------------------------------------------------------------- the renderer (Electron only)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createRenderer({ electron = require("electron"), resolver = makeResolver(), log = () => {} } = {}) {
  const { BrowserWindow, session } = electron;
  const partition = `agent-browser-${crypto.randomBytes(8).toString("hex")}`;
  /** Each: { win, busy, idleTimer, status, committed, navBlocked } */
  const entries = new Set();
  const queue = [];
  let store = null;
  let closed = false;

  function agentSession() {
    if (store) return store;
    // No "persist:" prefix: kept in memory only and never shared with the person's panes.
    store = session.fromPartition(partition, { cache: false });
    store.setUserAgent(store.getUserAgent().replace(/ Electron\/\S+/, "").replace(/ AEGIS\/\S+/i, "").replace(/ aegis-frontend\/\S+/, ""));
    store.setPermissionRequestHandler((_contents, _permission, answer) => answer(false));
    store.setPermissionCheckHandler(() => false);
    store.setDevicePermissionHandler(() => false);
    store.on("will-download", (event) => event.preventDefault());
    store.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
      const verdict = requestScheme(details.url);
      if (verdict === "allow") return callback({});
      if (verdict === "deny") return callback({ cancel: true });
      resolver(new URL(details.url).hostname).then(
        (ok) => callback({ cancel: !ok }),
        () => callback({ cancel: true }),
      );
    });
    return store;
  }

  function createEntry() {
    const win = new BrowserWindow({
      show: false,
      width: 1280,
      height: 900,
      title: "AEGIS agent browser",
      skipTaskbar: true,
      focusable: false,
      paintWhenInitiallyHidden: true,
      webPreferences: {
        offscreen: true,
        session: agentSession(),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: false,
        webviewTag: false,
        spellcheck: false,
        backgroundThrottling: false,
        autoplayPolicy: "document-user-activation-required",
        // No preload: a website gets no bridge to AEGIS of any kind.
      },
    });
    const entry = { win, busy: true, idleTimer: null, status: 0, committed: false, navBlocked: false };
    const contents = win.webContents;
    // It must never appear, whatever a page or a bug asks for.
    win.on("show", () => win.hide());
    win.on("page-title-updated", (event) => event.preventDefault());
    contents.setAudioMuted(true);
    contents.setFrameRate(4);
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
    const guard = (event, url) => {
      if (publicPage(url)) return;
      event.preventDefault();
      entry.navBlocked = true;
    };
    contents.on("will-navigate", guard);
    contents.on("will-redirect", (event, url, _inPage, isMainFrame) => {
      if (isMainFrame) guard(event, url);
    });
    contents.on("will-attach-webview", (event) => event.preventDefault());
    contents.on("will-prevent-unload", (event) => event.preventDefault());
    contents.on("did-navigate", (_event, url, code) => {
      if (!/^https?:/i.test(url)) return;
      entry.status = Number(code) || 0;
      entry.committed = true;
    });
    contents.on("render-process-gone", () => dispose(entry));
    // alert(), confirm() and prompt() are answered "no" at once instead of opening a dialog.
    try {
      contents.debugger.attach("1.3");
      contents.debugger.on("message", (_event, method) => {
        if (method === "Page.javascriptDialogOpening") contents.debugger.sendCommand("Page.handleJavaScriptDialog", { accept: false }).catch(() => {});
      });
      contents.debugger.sendCommand("Page.enable").catch(() => {});
    } catch {
      /* without it a dialog only blocks that one page until its load times out */
    }
    entries.add(entry);
    return entry;
  }

  function dispose(entry) {
    if (!entries.delete(entry)) return;
    clearTimeout(entry.idleTimer);
    if (!entry.win.isDestroyed()) entry.win.destroy();
    if (!entries.size && store) store.clearStorageData().catch(() => {});
  }

  function acquire() {
    if (closed) return Promise.reject(failure("renderer_closed"));
    for (const entry of entries) {
      if (!entry.busy) {
        entry.busy = true;
        clearTimeout(entry.idleTimer);
        return Promise.resolve(entry);
      }
    }
    if (entries.size < MAX_CONTENTS) return Promise.resolve(createEntry());
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, timer: setTimeout(() => (queue.splice(queue.indexOf(waiter), 1), reject(failure("busy"))), QUEUE_WAIT_MS) };
      queue.push(waiter);
    });
  }

  function release(entry) {
    if (!entries.has(entry) || entry.win.isDestroyed()) return dispose(entry);
    // Nothing keeps running between requests.
    entry.win.webContents.loadURL("about:blank").catch(() => {});
    const next = queue.shift();
    if (next) {
      clearTimeout(next.timer);
      return next.resolve(entry);
    }
    entry.busy = false;
    entry.idleTimer = setTimeout(() => dispose(entry), IDLE_CLOSE_MS);
  }

  async function load(entry, href) {
    const contents = entry.win.webContents;
    entry.status = 0;
    entry.committed = false;
    entry.navBlocked = false;
    const started = Date.now();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(failure("load_timeout")), LOAD_TIMEOUT_MS);
    });
    try {
      await Promise.race([contents.loadURL(href), timeout]);
    } catch (error) {
      if (entry.navBlocked) throw failure("navigation_blocked");
      if (error?.code === "load_timeout") {
        contents.stop();
        // A page that never finishes (ads, long polling) is read as far as it got.
        if (entry.committed) return;
        throw error;
      }
      if (error?.code === "ERR_BLOCKED_BY_CLIENT" || error?.errno === -20) throw failure("blocked_address");
      if (error?.code === "ERR_ABORTED" || error?.errno === -3) {
        // Replaced by the page's own redirect: wait for that load, inside the same deadline.
        while (contents.isLoading() && Date.now() - started < LOAD_TIMEOUT_MS) await wait(200);
        if (entry.navBlocked) throw failure("navigation_blocked");
        if (entry.committed && publicPage(contents.getURL())) return;
      }
      throw failure("load_failed");
    } finally {
      clearTimeout(timer);
    }
  }

  /** Up to 1.5 s for scripts to finish drawing the page. */
  async function settle(contents) {
    const until = Date.now() + SETTLE_MS;
    await wait(400);
    while (contents.isLoading() && Date.now() < until) await wait(150);
  }

  async function open(url) {
    const page = publicPage(url);
    if (!page) throw failure("non_public_address");
    if (!(await resolver(page.hostname))) throw failure("blocked_address");
    const entry = await acquire();
    try {
      await load(entry, page.href);
      await settle(entry.win.webContents);
      return entry;
    } catch (error) {
      release(entry);
      throw error;
    }
  }

  async function probe(entry) {
    const contents = entry.win.webContents;
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(failure("extract_timeout")), EXTRACT_TIMEOUT_MS);
    });
    try {
      return await Promise.race([contents.executeJavaScriptInIsolatedWorld(ISOLATED_WORLD, [{ code: EXTRACT_SCRIPT }], false), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function render(url) {
    const entry = await open(url);
    try {
      const finalUrl = entry.win.webContents.getURL();
      if (!publicPage(finalUrl)) throw failure("navigation_blocked");
      const raw = (await probe(entry)) || {};
      const reason = wallReason({ status: entry.status, finalUrl, title: raw.title, text: raw.text, frames: raw.frames, challenge: raw.challenge === true });
      if (reason) return { blocked: true, reason, final_url: finalUrl };
      return pageResult(raw, finalUrl);
    } finally {
      release(entry);
    }
  }

  async function screenshot(url) {
    const entry = await open(url);
    try {
      const contents = entry.win.webContents;
      if (!publicPage(contents.getURL())) throw failure("navigation_blocked");
      const raw = (await probe(entry)) || {};
      const reason = wallReason({ status: entry.status, finalUrl: contents.getURL(), title: raw.title, text: raw.text, frames: raw.frames, challenge: raw.challenge === true });
      if (reason) throw failure(`blocked_${reason}`);
      contents.invalidate();
      let image = await contents.capturePage();
      if (image.isEmpty()) throw failure("screenshot_empty");
      if (image.getSize().width > MAX_SHOT_WIDTH) image = image.resize({ width: MAX_SHOT_WIDTH, quality: "good" });
      const { width, height } = image.getSize();
      const png = image.toPNG().toString("base64");
      if (png.length > MAX_SHOT_BASE64) throw failure("screenshot_too_large");
      return { png_base64: png, width, height };
    } finally {
      release(entry);
    }
  }

  function handle(action, url) {
    if (action === "render") return render(url);
    if (action === "screenshot") return screenshot(url);
    return Promise.reject(failure("unknown_action"));
  }

  function shutdown() {
    closed = true;
    for (const waiter of queue.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.reject(failure("renderer_closed"));
    }
    for (const entry of [...entries]) dispose(entry);
  }

  return { handle, render, screenshot, shutdown, count: () => entries.size, windows: () => [...entries].map((entry) => entry.win), log };
}

/**
 * Starts the agent browser for the desktop app: token file, renderer, and the link to the backend.
 * Returns { tokenFile, kick(), shutdown() }. AEGIS_AGENT_BROWSER=0 turns it off.
 */
function start({ userData, url = HOST_URL, log = () => {} }) {
  const { token, file } = writeToken(userData);
  const renderer = createRenderer({ log });
  const link = new HostLink({ url, token, handle: renderer.handle, log }).start();
  return {
    tokenFile: file,
    renderer,
    kick: () => link.kick(),
    shutdown() {
      link.stop();
      renderer.shutdown();
    },
  };
}

module.exports = {
  HOST_URL,
  TOKEN_FILE,
  EXTRACT_SCRIPT,
  privateAddress,
  makeResolver,
  requestScheme,
  wallReason,
  pageResult,
  parseRequest,
  errorCode,
  HostLink,
  writeToken,
  createRenderer,
  start,
};
