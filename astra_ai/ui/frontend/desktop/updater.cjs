/**
 * V35 AEGIS updater: GitHub Releases of the (private) AEGIS repository → signed metadata → verified components.
 *
 * - Source: https://api.github.com/repos/<owner>/<repo>/releases with a read-only token the person enters on this
 *   computer (Settings → About). The token is encrypted with Windows' per-user protection (Electron safeStorage)
 *   and never leaves this computer or goes into a release. AEGIS_UPDATE_FEED replaces the API base for tests.
 * - Channels: stable (x.y.z), beta (x.y.z-beta.n and stable), dev (everything). Drafts are never offered.
 * - Trust: aegis-release.json must verify against release-public-key.pem (Ed25519); every downloaded component must
 *   match its signed SHA-512; the extracted app must match its manifest (release-install.cjs). Nothing else runs.
 * - Checks: 90 s after start, then every 6 hours, or when asked; at most one automatic check per hour; offline is quiet.
 * - Install: the person's data folder is backed up (small state files), the new version is extracted beside the
 *   current one, current.json switches, and AEGIS restarts. The previous version stays for rollback.
 * - It never shows a dialog by itself: the page reads `status()` and shows a quiet notice.
 */
const fs = require("node:fs");
const path = require("node:path");
const release = require("./release-install.cjs");
const installation = require("./installed.cjs");

const HOUR = 3600e3;
const CHANNELS = ["stable", "beta", "dev"];

/** publicKeyPem is for tests only; the app always verifies against release-public-key.pem. */
function updater({ app, safeStorage, busy = () => false, log = () => {}, publicKeyPem = undefined }) {
  const dir = () => app.getPath("userData");
  const configFile = () => path.join(dir(), "update.json");
  const tokenFile = () => path.join(dir(), "update-token.bin");
  const build = release.readJson(path.join(__dirname, "build.json"), {});
  const version = installation.version || require("../package.json").version;
  let state = { state: installation.installed ? "idle" : "development", version, channel: build.channel || "dev", build, progress: null, available: null, error: "" };
  let meta = null, raw = null, signature = null, timer = null, downloaded = null;

  const config = () => ({ channel: build.channel || "beta", repo: "", auto: true, lastCheck: 0, ...release.readJson(configFile(), {}) });
  const saveConfig = (patch) => { const next = { ...config(), ...patch }; fs.mkdirSync(dir(), { recursive: true }); release.atomicJson(configFile(), next); return next; };
  const token = () => {
    try { return fs.existsSync(tokenFile()) && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(fs.readFileSync(tokenFile())) : ""; } catch { return ""; }
  };
  const api = () => (process.env.AEGIS_UPDATE_FEED || "https://api.github.com").replace(/\/$/, "");
  const headers = (accept = "application/vnd.github+json") => ({ Accept: accept, "User-Agent": "AEGIS-Updater", "X-GitHub-Api-Version": "2022-11-28", ...(token() ? { Authorization: "Bearer " + token() } : {}) });

  function publicStatus() {
    const c = config();
    return { ...state, repo: c.repo, channel: c.channel, auto: c.auto, lastCheck: c.lastCheck, tokenSet: Boolean(token()), installed: installation.installed };
  }

  function eligible(tag, channel) {
    const v = String(tag || "").replace(/^v/, "");
    if (!release.VERSION.test(v)) return false;
    if (channel === "stable") return !v.includes("-");
    if (channel === "beta") return !v.includes("-dev.");
    return true;
  }
  // Ordering across channels: a stable x.y.z is newer than x.y.z-beta.n, which is newer than x.y.z-dev.n.
  const rank = (v) => { const [core, pre = ""] = v.split("-"); return [...core.split(".").map(Number), pre ? (pre.startsWith("beta") ? 1 : 0) : 2, pre ? Number(pre.split(".")[1]) : 0]; };
  const newer = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

  async function getJson(url) {
    const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(20000) });
    if (response.status === 401 || response.status === 403) throw Object.assign(new Error("GitHub refused the update token. Check that it can read this repository's contents."), { quiet: false });
    if (response.status === 404) throw new Error("The update repository was not found. Check its name, and that the token can read it (private repositories need a token).");
    if (!response.ok) throw new Error("GitHub answered " + response.status + ".");
    return response.json();
  }
  /** A release asset through the API. Redirects (to GitHub's storage) are followed here, without the token. */
  async function asset(found, accept = "application/octet-stream") {
    let url = found.url, send = headers(accept);
    for (let hop = 0; hop < 5; hop++) {
      const response = await fetch(url, { headers: send, redirect: "manual", signal: AbortSignal.timeout(10 * 60000) });
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get("location")) {
        url = new URL(response.headers.get("location"), url).href;
        send = { Accept: accept, "User-Agent": "AEGIS-Updater" };
        continue;
      }
      if (!response.ok) throw new Error("Could not download " + found.name + " (" + response.status + ").");
      return response;
    }
    throw new Error("Too many redirects for " + found.name + ".");
  }

  async function check({ manual = false } = {}) {
    if (!installation.installed) return publicStatus();
    const c = config();
    if (!c.repo || !/^[\w.-]+\/[\w.-]+$/.test(c.repo)) { state = { ...state, state: "not_configured", error: "Choose the GitHub repository AEGIS updates from." }; return publicStatus(); }
    if (!manual && Date.now() - c.lastCheck < HOUR) return publicStatus();
    if (["downloading", "installing"].includes(state.state)) return publicStatus();
    state = { ...state, state: "checking", error: "" };
    try {
      const releases = await getJson(`${api()}/repos/${c.repo}/releases?per_page=30`);
      const candidates = releases.filter((r) => !r.draft && eligible(r.tag_name, c.channel))
        .map((r) => ({ r, v: r.tag_name.replace(/^v/, "") })).filter((x) => newer(x.v, version))
        .sort((a, b) => (newer(a.v, b.v) ? -1 : 1));
      saveConfig({ lastCheck: Date.now() });
      const best = candidates[0];
      if (!best) { state = { ...state, state: "current", available: null, checkedAt: new Date().toISOString() }; return publicStatus(); }
      const metaAsset = best.r.assets.find((a) => a.name === "aegis-release.json");
      const sigAsset = best.r.assets.find((a) => a.name === "aegis-release.json.sig");
      if (!metaAsset || !sigAsset) throw new Error("Release " + best.r.tag_name + " has no signed AEGIS metadata, so it is not offered.");
      raw = Buffer.from(await (await asset(metaAsset)).arrayBuffer());
      signature = await (await asset(sigAsset)).text();
      meta = release.verifyMetadata(raw, signature, publicKeyPem);
      if (meta.version !== best.v) throw new Error("Release " + best.r.tag_name + " carries metadata for " + meta.version + "; not offered.");
      const needed = neededComponents(meta);
      state = { ...state, state: downloaded?.version === meta.version ? "ready" : "available", checkedAt: new Date().toISOString(),
        available: { version: meta.version, channel: meta.channel, notes: meta.notes, published: best.r.published_at, url: best.r.html_url,
          download: needed.reduce((n, k) => n + (meta.components[k].size || 0), 0), components: needed } };
      return publicStatus();
    } catch (error) {
      const offline = /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|timeout|aborted/i.test(String(error.cause?.code || error.message));
      state = { ...state, state: offline ? "offline" : "error", error: offline ? "No connection to GitHub. AEGIS keeps working with this version." : error.message };
      return publicStatus();
    }
  }

  /** Components this computer does not have yet (an app-only update downloads only the app). */
  function neededComponents(m) {
    const root = installation.paths().root;
    const done = (p) => fs.existsSync(path.join(p, ".complete"));
    const c = m.components;
    return ["electron", "python", "packages", "app"].filter((k) =>
      k === "app" || !done(k === "electron" ? path.join(root, "runtime", "electron-" + c[k].id) : k === "python" ? path.join(root, "runtime", "python-" + c[k].id) : path.join(root, "python-env", c[k].id)));
  }

  async function download() {
    if (state.state !== "available" || !meta) return publicStatus();
    const c = config();
    const folder = path.join(dir(), "updates", meta.version);
    fs.mkdirSync(folder, { recursive: true });
    state = { ...state, state: "downloading", progress: { received: 0, total: state.available.download }, error: "" };
    try {
      const releaseInfo = (await getJson(`${api()}/repos/${c.repo}/releases?per_page=30`)).find((r) => r.tag_name === "v" + meta.version);
      for (const name of neededComponents(meta)) {
        const comp = meta.components[name];
        const file = path.join(folder, comp.asset);
        if (fs.existsSync(file) && fs.statSync(file).size === comp.size && release.sha512File(file) === comp.sha512) { state.progress.received += comp.size; continue; }
        const found = releaseInfo?.assets.find((a) => a.name === comp.asset);
        if (!found) throw new Error("The release is missing " + comp.asset + ".");
        const response = await asset(found);
        const tmp = file + ".part";
        const out = fs.createWriteStream(tmp);
        for await (const chunk of response.body) { out.write(chunk); state.progress.received += chunk.length; }
        await new Promise((resolve, reject) => out.end((e) => (e ? reject(e) : resolve())));
        release.verifyAsset(tmp, comp);
        fs.renameSync(tmp, file);
      }
      fs.writeFileSync(path.join(folder, "aegis-release.json"), raw);
      fs.writeFileSync(path.join(folder, "aegis-release.json.sig"), signature);
      downloaded = { version: meta.version, folder };
      state = { ...state, state: "ready", progress: null };
    } catch (error) {
      state = { ...state, state: "available", progress: null, error: "Download failed: " + error.message };
    }
    return publicStatus();
  }

  /** Backs up the small state files (records, settings, grants), not media or caches, before switching versions. */
  function backupData(target) {
    const data = path.join(installation.paths().data, "data");
    const dest = path.join(data, "backups", "pre-" + target + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
    const skip = /(^|[\\/])(media|cache|logs|backups|isolated-work|repo-index|shots|reviewed-edits)([\\/]|$)/i;
    let bytes = 0;
    const copy = (from, to) => {
      for (const entry of fs.existsSync(from) ? fs.readdirSync(from, { withFileTypes: true }) : []) {
        const a = path.join(from, entry.name), b = path.join(to, entry.name);
        if (skip.test(path.relative(data, a))) continue;
        if (entry.isDirectory()) copy(a, b);
        else if (entry.isFile()) { const size = fs.statSync(a).size; if (size > 200e6 || (bytes += size) > 2e9) continue; fs.mkdirSync(to, { recursive: true }); fs.copyFileSync(a, b); }
      }
    };
    copy(path.join(data, "state"), path.join(dest, "state"));
    if (fs.existsSync(path.join(data, ".env"))) fs.copyFileSync(path.join(data, ".env"), path.join(dest, ".env"));
    const all = fs.readdirSync(path.join(data, "backups")).filter((n) => n.startsWith("pre-")).sort();
    for (const old of all.slice(0, Math.max(0, all.length - 3))) fs.rmSync(path.join(data, "backups", old), { recursive: true, force: true });
    return { folder: dest, bytes };
  }

  async function install({ restart = true, force = false } = {}) {
    if (state.state !== "ready" || !downloaded) return publicStatus();
    if (!force && busy()) { state = { ...state, error: "A Work run is in progress. Install when it finishes, or choose Install anyway." }; return publicStatus(); }
    state = { ...state, state: "installing", error: "" };
    try {
      const backup = backupData(meta.version);
      log("update backup " + backup.folder + " " + backup.bytes);
      const result = release.installRelease({ meta: release.verifyMetadata(fs.readFileSync(path.join(downloaded.folder, "aegis-release.json")), fs.readFileSync(path.join(downloaded.folder, "aegis-release.json.sig"), "utf8"), publicKeyPem),
        assets: downloaded.folder, root: installation.paths().root, log });
      fs.rmSync(downloaded.folder, { recursive: true, force: true });
      state = { ...state, state: "installed", installedVersion: result.version };
      if (restart) setTimeout(() => { app.relaunch(); app.quit(); }, 400);
    } catch (error) {
      state = { ...state, state: "ready", error: "The update was not installed: " + error.message + " AEGIS " + version + " is unchanged." };
    }
    return publicStatus();
  }

  function setToken(value) {
    const text = String(value || "").trim();
    if (!text) { fs.rmSync(tokenFile(), { force: true }); return publicStatus(); }
    if (!/^(github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})$/.test(text)) throw new Error("That does not look like a GitHub token.");
    if (!safeStorage.isEncryptionAvailable()) throw new Error("Windows encryption is not available, so the token cannot be stored safely.");
    fs.mkdirSync(dir(), { recursive: true });
    fs.writeFileSync(tokenFile(), safeStorage.encryptString(text));
    return publicStatus();
  }

  function start() {
    if (!installation.installed || timer) return;
    setTimeout(() => void check(), Number(process.env.AEGIS_UPDATE_FIRST_CHECK_MS || 90000));
    timer = setInterval(() => void check(), 6 * HOUR);
    timer.unref?.();
  }

  const commands = {
    update_status: () => publicStatus(),
    update_check: () => check({ manual: true }),
    update_download: () => download(),
    // "Install anyway" passes force: the person chose to, even with a run in progress.
    update_install: (args) => install({ restart: args?.restart !== false, force: args?.force === true }),
    update_configure: (args = {}) => {
      const patch = {};
      if (typeof args.repo === "string") { if (args.repo && !/^[\w.-]+\/[\w.-]+$/.test(args.repo.trim())) throw new Error("Use owner/repository."); patch.repo = args.repo.trim(); }
      if (CHANNELS.includes(args.channel)) patch.channel = args.channel;
      if (typeof args.auto === "boolean") patch.auto = args.auto;
      saveConfig(patch);
      if (typeof args.token === "string") setToken(args.token);
      return publicStatus();
    },
  };
  return { commands, start, check, status: publicStatus };
}

module.exports = { updater };
