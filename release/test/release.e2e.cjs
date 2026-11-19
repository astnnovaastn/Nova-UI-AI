// V35 end-to-end: install a signed release with the real installer, run the INSTALLED app (stock Electron + launcher,
// its own ports and a throwaway data folder), make user data, update through a mock of a private GitHub repository,
// check the data survived, roll back through the launcher, then uninstall (data kept). No model spend, no network.
// Your running AEGIS, real profile, shortcuts and Apps & features entry are not touched (-DataRoot, -NoShell).
// Usage: node release/test/release.e2e.cjs <folder with beta.1 and beta.2 builds> [out]
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawnSync, execFileSync } = require("node:child_process");
const { _electron: electron } = require(path.resolve(__dirname, "../../astra_ai/ui/frontend/node_modules/@playwright/test"));
const { startFeed } = require("./mock-github.cjs");
const release = require("../../astra_ai/ui/frontend/desktop/release-install.cjs");

const [builds, out = path.join(os.tmpdir(), "aegis-v35-release-e2e")] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(probe, timeout = 30000, step = 400) { const end = Date.now() + timeout; for (;;) { const v = await Promise.resolve().then(probe).catch(() => undefined); if (v) return v; if (Date.now() > end) return v; await wait(step); } }
const health = () => new Promise((resolve) => { const r = http.get({ host: "127.0.0.1", port: 8350, path: "/api/health", timeout: 1500 }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } }); }); r.on("error", () => resolve(null)); r.on("timeout", () => r.destroy()); });
const ps = (file, args) => spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", file, ...args], { encoding: "utf8", windowsHide: true, timeout: 900000 });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v35-"));
const root = path.join(tmp, "Programs", "AEGIS"), data = path.join(tmp, "AppData", "AEGIS");
const TOKEN = "ghp_" + "t".repeat(36), REPO = "aegis-owner/aegis";
const killInstalled = () => { const list = execFileSync("powershell.exe", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '${root.replace(/'/g, "''")}*' } | ForEach-Object { $_.ProcessId }`], { encoding: "utf8" }).split(/\s+/).filter(Boolean); for (const pid of list) spawnSync("taskkill.exe", ["/PID", pid, "/T", "/F"], { windowsHide: true }); return list.length; };

async function launch(extraEnv = {}) {
  const current = JSON.parse(fs.readFileSync(path.join(root, "current.json"), "utf8"));
  const exe = path.join(root, "runtime", "electron-" + current.electron, "electron.exe");
  const app = await electron.launch({ executablePath: exe, args: [path.join(root, "launcher")], timeout: 120000,
    env: { ...process.env, AEGIS_DATA_ROOT: data, AEGIS_UPDATE_FEED: feed.url, AEGIS_UPDATE_FIRST_CHECK_MS: "3600000", ...extraEnv } });
  const page = await app.firstWindow();
  await until(() => page.evaluate(() => location.port === "5183"), 180000, 1000);
  return { app, page };
}
const invoke = (page, command, args = {}) => page.evaluate(({ command, args }) => window.aegisDesktop.invoke(command, args), { command, args });

let feed;
(async () => {
  try {
    const b1 = path.join(builds, "beta.1"), b2 = path.join(builds, "beta.2");
    // ---- 1. install beta.1 with the real installer
    const setup = path.join(tmp, "setup1");
    fs.mkdirSync(setup);
    execFileSync(path.join(process.env.SystemRoot, "System32", "tar.exe"), ["-xf", path.join(b1, "AEGIS-Setup-0.35.0-beta.1.zip"), "-C", setup]);
    let started = Date.now();
    const installed = ps(path.join(setup, "installer", "Install-AEGIS.ps1"), ["-InstallRoot", root, "-DataRoot", data, "-NoShell", "-NoLaunch", "-Quiet"]);
    check("1a the installer finishes", installed.status === 0, (installed.stdout + installed.stderr).trim().split(/\r?\n/).slice(-3).join(" | "));
    check("1b it verified the release signature first", /Release signature verified: AEGIS 0\.35\.0-beta\.1/.test(installed.stdout));
    const cur1 = release.readJson(path.join(root, "current.json"), {});
    check("1c current.json names beta.1", cur1.version === "0.35.0-beta.1", JSON.stringify(cur1));
    check("1d install took (s)", true, Math.round((Date.now() - started) / 1000));
    check("1e the program folder holds no user data", !fs.existsSync(path.join(root, "versions", cur1.version, "app", "state")) && !fs.existsSync(path.join(root, "versions", cur1.version, "app", ".env")));
    const exe = path.join(root, "runtime", "electron-" + cur1.electron, "electron.exe");
    const original = path.resolve(__dirname, "../../astra_ai/ui/frontend/node_modules/electron/dist/electron.exe");
    check("1f electron.exe is the unmodified stock binary", release.sha512File(exe) === release.sha512File(original));

    // ---- 2. run the installed app
    feed = await startFeed({ repo: REPO, token: TOKEN, releases: [{ dir: b1, version: "0.35.0-beta.1" }] });
    started = Date.now();
    let { app, page } = await launch();
    const h1 = await until(health, 180000, 1000);
    check("2a the installed backend starts on its own port", h1?.status === "healthy" && h1.version === "0.35.0-beta.1", JSON.stringify(h1 && { v: h1.version, s: h1.status }));
    check("2b cold start to a healthy backend (s)", true, Math.round((Date.now() - started) / 1000));
    const s1 = await invoke(page, "update_status");
    check("2c About reports the installed version and the local-test build", s1.installed && s1.version === "0.35.0-beta.1" && s1.build?.local_test === true, JSON.stringify({ v: s1.version, ch: s1.channel, inst: s1.installed }));
    check("2d the data folder is outside the program folder", fs.existsSync(path.join(data, "data", "state")) && !data.startsWith(root));
    // User data of several kinds: a backend record, a folder grant through the real dialog path, browser storage.
    fs.mkdirSync(path.join(data, "data", "state", "research", "v35-marker"), { recursive: true });
    fs.writeFileSync(path.join(data, "data", "state", "research", "v35-marker", "note.json"), JSON.stringify({ kept: "research before the update" }));
    const project = path.join(tmp, "my project"); fs.mkdirSync(project); fs.writeFileSync(path.join(project, "main.py"), "print('hi')\n");
    await app.evaluate(({ dialog }, folder) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] }); }, project);
    const grant = await invoke(page, "dev_folder_select", {});
    check("2e a folder grant is written into the data folder", grant && fs.existsSync(path.join(data, "data", "state", "work", "authorized_folders.json")), JSON.stringify(grant?.id));
    await page.evaluate(() => localStorage.setItem("aegis-v35-marker", "browser storage before the update"));

    // ---- 3. updates from the private repository mock
    let s = await invoke(page, "update_configure", { repo: REPO, channel: "beta", token: "ghp_" + "w".repeat(36) });
    s = await invoke(page, "update_check");
    check("3a a wrong token is reported, nothing offered", s.state === "error" && /token|not found/i.test(s.error) && !s.available, s.error);
    s = await invoke(page, "update_configure", { token: TOKEN });
    check("3b the token is stored encrypted, never as text", s.tokenSet && !fs.readFileSync(path.join(data, "update-token.bin")).includes(Buffer.from(TOKEN)));
    s = await invoke(page, "update_check");
    check("3c with only beta.1 published: up to date", s.state === "current", s.state + " " + s.error);
    feed.close();
    feed = await startFeed({ repo: REPO, token: TOKEN, releases: [{ dir: b2, version: "0.35.0-beta.2" }, { dir: b1, version: "0.35.0-beta.1" }], port: Number(new URL(feed.url).port) });
    s = await invoke(page, "update_check");
    check("3d beta.2 is offered with its notes", s.state === "available" && s.available?.version === "0.35.0-beta.2" && /Test update/.test(s.available.notes), JSON.stringify(s.available && { v: s.available.version, c: s.available.components }));
    check("3e only the app component needs downloading", JSON.stringify(s.available?.components) === '["app"]', s.available?.download);
    await invoke(page, "update_download");
    s = await until(async () => { const x = await invoke(page, "update_status"); return ["ready", "available"].includes(x.state) ? x : null; }, 300000, 500);
    check("3f the download verified and is ready", s?.state === "ready", s?.error || s?.state);
    check("3g only the app zip was downloaded", feed.seen.downloads.filter((n) => n.endsWith(".zip")).join(",") === "aegis-app-0.35.0-beta.2.zip", feed.seen.downloads.join(","));
    await page.screenshot({ path: path.join(out, "v35-update-ready.png") }).catch(() => {});
    // ---- 4. install and restart
    const closed = new Promise((r) => app.process().once("exit", r));
    await invoke(page, "update_install");
    await Promise.race([closed, wait(60000)]);
    const h2 = await until(async () => { const h = await health(); return h?.version === "0.35.0-beta.2" ? h : null; }, 240000, 1500);
    check("4a AEGIS restarted itself on beta.2", h2?.version === "0.35.0-beta.2", JSON.stringify(h2 && h2.version));
    const cur2 = release.readJson(path.join(root, "current.json"), {});
    check("4b beta.1 is kept for rollback", cur2.version === "0.35.0-beta.2" && cur2.previous === "0.35.0-beta.1" && fs.existsSync(path.join(root, "versions", "0.35.0-beta.1")), JSON.stringify(cur2));
    check("4c a pre-update backup of the data was made", fs.readdirSync(path.join(data, "data", "backups")).some((n) => n.startsWith("pre-0.35.0-beta.2")));
    killInstalled();
    await until(async () => !(await health()), 30000, 500);
    ({ app, page } = await launch());
    await until(health, 180000, 1000);
    check("4d after the update: the research record is intact", JSON.parse(fs.readFileSync(path.join(data, "data", "state", "research", "v35-marker", "note.json"), "utf8")).kept === "research before the update");
    check("4e after the update: the folder grant is intact", (await invoke(page, "dev_folders")).some((g) => g.id === grant.id));
    check("4f after the update: browser storage is intact", (await page.evaluate(() => localStorage.getItem("aegis-v35-marker"))) === "browser storage before the update");
    const s2 = await invoke(page, "update_status");
    check("4g after the update: settings and token kept, version shown", s2.version === "0.35.0-beta.2" && s2.repo === REPO && s2.tokenSet, JSON.stringify({ v: s2.version, repo: s2.repo, token: s2.tokenSet }));
    await app.close().catch(() => {});
    killInstalled();
    await until(async () => !(await health()), 30000, 500);

    // ---- 5. a broken version falls back to the previous one
    const main2 = path.join(root, "versions", "0.35.0-beta.2", "app", "astra_ai", "ui", "frontend", "desktop", "main.cjs");
    fs.renameSync(main2, main2 + ".off");
    ({ app, page } = await launch());
    const h3 = await until(health, 180000, 1000);
    check("5a a missing current version starts the previous one", h3?.version === "0.35.0-beta.1", JSON.stringify(h3 && h3.version));
    await app.close().catch(() => {}); killInstalled();
    fs.renameSync(main2 + ".off", main2);
    await until(async () => !(await health()), 30000, 500);

    // ---- 6. tampering is refused
    const raw = fs.readFileSync(path.join(b2, "aegis-release.json")), sig = fs.readFileSync(path.join(b2, "aegis-release.json.sig"), "utf8");
    let refused = false;
    try { release.verifyMetadata(Buffer.from(raw.toString().replace("beta.2", "beta.3")), sig); } catch { refused = true; }
    check("6a edited release metadata fails its signature", refused);
    const meta = release.verifyMetadata(raw, sig);
    const bad = path.join(tmp, "bad.zip"); fs.copyFileSync(path.join(b2, meta.components.app.asset), bad); fs.appendFileSync(bad, "x");
    refused = false; try { release.verifyAsset(bad, meta.components.app); } catch { refused = true; }
    check("6b a changed component fails its checksum", refused);

    // ---- 7. uninstall keeps the data
    fs.copyFileSync(path.resolve(__dirname, "../installer/Uninstall-AEGIS.ps1"), path.join(root, "Uninstall-AEGIS.ps1"));
    const un = ps(path.join(root, "Uninstall-AEGIS.ps1"), ["-Quiet", "-NoShell", "-DataRoot", data]);
    check("7a uninstall removes the program", un.status === 0 && !fs.existsSync(root), (un.stderr || "").slice(0, 200));
    check("7b uninstall keeps the data", fs.existsSync(path.join(data, "data", "state", "research", "v35-marker", "note.json")));
  } catch (error) {
    check("run finished", false, error.stack || error);
  } finally {
    killInstalled();
    feed?.close();
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 1));
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed   (test folder ${tmp})`);
    process.exit(failed ? 1 : 0);
  }
})();
