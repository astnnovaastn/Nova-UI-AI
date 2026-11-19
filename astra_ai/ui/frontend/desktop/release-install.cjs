/**
 * V35: verifying and installing an AEGIS release. Used by the first-time installer (release/installer/install.cjs,
 * run by the stock electron.exe as Node) and by the in-app updater (updater.cjs). Plain Node, no packages.
 *
 * Trust: every release has aegis-release.json signed with the AEGIS release key (Ed25519). The public key is
 * release-public-key.pem beside this file. Nothing is extracted or run unless the signature verifies, every
 * component's SHA-512 matches the signed metadata, and every extracted app file matches the app manifest.
 * Smart App Control: no executable is created or modified. Electron and Python are the stock runtimes, extracted
 * unchanged; the app is JavaScript and Python source.
 */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const KEY = path.join(__dirname, "release-public-key.pem");
const VERSION = /^\d+\.\d+\.\d+(-(beta|dev)\.\d+)?$/;
const ID = /^[a-z0-9][a-z0-9.-]{2,80}$/;

function verifyMetadata(raw, signature, publicKeyPem) {
  publicKeyPem ||= fs.readFileSync(KEY, "utf8");
  const ok = crypto.verify(null, Buffer.from(raw), crypto.createPublicKey(publicKeyPem), Buffer.from(String(signature).trim(), "base64"));
  if (!ok) throw new Error("The release signature does not match the AEGIS release key. Nothing was installed.");
  const meta = JSON.parse(Buffer.from(raw).toString("utf8"));
  if (meta.schema !== 1 || meta.product !== "AEGIS" || !VERSION.test(meta.version)) throw new Error("This is not an AEGIS release.");
  for (const name of ["electron", "python", "packages", "app"]) {
    const c = meta.components?.[name];
    if (!c || !ID.test(c.id) || !/^[\w.-]+\.zip$/.test(c.asset) || !/^[a-f0-9]{128}$/.test(c.sha512)) throw new Error("The release metadata is incomplete (" + name + ").");
  }
  return meta;
}

function sha512File(file) {
  const hash = crypto.createHash("sha512");
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.alloc(4 << 20);
  try { for (let n; (n = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0;) hash.update(buffer.subarray(0, n)); } finally { fs.closeSync(fd); }
  return hash.digest("hex");
}
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function verifyAsset(file, component) {
  const stat = fs.statSync(file);
  if (component.size && stat.size !== component.size) throw new Error(component.asset + " has the wrong size; download it again.");
  if (sha512File(file) !== component.sha512) throw new Error(component.asset + " does not match its signed checksum. Nothing was installed.");
}

/** tar.exe ships with Windows 10/11 and reads zip files. The destination must not exist yet. */
function extract(zip, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const result = spawnSync(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe"), ["-xf", zip, "-C", dest], { windowsHide: true, encoding: "utf8" });
  if (result.status !== 0) throw new Error("Could not extract " + path.basename(zip) + ": " + (result.stderr || result.error || "").toString().slice(0, 300));
}

function verifyTree(dir, manifestFile) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  for (const [rel, digest] of Object.entries(manifest.files || {})) {
    const file = path.join(dir, ...rel.split("/"));
    if (!file.startsWith(dir) || !fs.existsSync(file) || sha256(file) !== digest) throw new Error("Extracted file " + rel + " does not match the release manifest.");
  }
  return Object.keys(manifest.files || {}).length;
}

function signedBy(file) {
  const ps = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const r = spawnSync(ps, ["-NoProfile", "-NonInteractive", "-Command", `$s=Get-AuthenticodeSignature -LiteralPath '${file.replace(/'/g, "''")}'; "$($s.Status)|$($s.SignerCertificate.Subject)"`], { encoding: "utf8", windowsHide: true });
  const [status, subject = ""] = String(r.stdout || "").trim().split("|");
  return { status, subject };
}

const atomicJson = (file, value) => { const tmp = file + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(value, null, 1)); fs.renameSync(tmp, file); };
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };

/**
 * Installs a verified release from a folder holding its assets (an extracted Setup bundle or the updater's downloads).
 * Shared runtimes and package sets are kept by id, so an update that only changes the app extracts only the app.
 * Returns {version, previous, extracted:[...]}. Never touches the person's data folder.
 */
function installRelease({ meta, assets, root, log = () => {} }) {
  const step = (text) => log(text);
  fs.mkdirSync(root, { recursive: true });
  const c = meta.components;
  const asset = (name) => path.join(assets, c[name].asset);
  for (const name of ["electron", "python", "packages", "app"]) {
    const target = targetOf(root, meta, name);
    if (name !== "app" && fs.existsSync(path.join(target, ".complete"))) continue;
    step("Verifying " + c[name].asset);
    verifyAsset(asset(name), c[name]);
  }
  const extracted = [];
  const place = (name, then) => {
    const target = targetOf(root, meta, name);
    if (fs.existsSync(path.join(target, ".complete"))) return;
    const staging = target + ".partial-" + process.pid;
    fs.rmSync(staging, { recursive: true, force: true });
    step("Extracting " + name);
    extract(asset(name), staging);
    then?.(staging);
    fs.writeFileSync(path.join(staging, ".complete"), new Date().toISOString());
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(staging, target);
    extracted.push(name);
  };
  place("electron", (dir) => { if (!fs.existsSync(path.join(dir, "electron.exe"))) throw new Error("The Electron runtime is incomplete."); });
  place("python", (dir) => {
    const exe = path.join(dir, "python.exe");
    if (!fs.existsSync(exe)) throw new Error("The Python runtime is incomplete.");
    const sig = signedBy(exe);
    if (sig.status !== "Valid") throw new Error("python.exe in this release is not validly signed (" + sig.status + "). Nothing was installed.");
  });
  // The packages are a venv over the shared runtime: python -m venv creates only the stock launcher copies.
  const env = targetOf(root, meta, "packages");
  if (!fs.existsSync(path.join(env, ".complete"))) {
    const staging = env + ".partial-" + process.pid;
    fs.rmSync(staging, { recursive: true, force: true });
    step("Preparing the Python environment");
    const py = path.join(targetOf(root, meta, "python"), "python.exe");
    const made = spawnSync(py, ["-m", "venv", "--without-pip", staging], { windowsHide: true, encoding: "utf8" });
    if (made.status !== 0) throw new Error("Could not create the Python environment: " + String(made.stderr || "").slice(0, 300));
    extract(asset("packages"), path.join(staging, "Lib", "site-packages"));
    fs.writeFileSync(path.join(staging, ".complete"), new Date().toISOString());
    fs.rmSync(env, { recursive: true, force: true });
    fs.renameSync(staging, env);
    extracted.push("packages");
  }
  // The app: a fresh folder per version, checked file by file against its manifest.
  const versionDir = path.join(root, "versions", meta.version);
  const staging = versionDir + ".partial-" + process.pid;
  fs.rmSync(staging, { recursive: true, force: true });
  step("Extracting AEGIS " + meta.version);
  extract(asset("app"), path.join(staging, "app"));
  const files = verifyTree(path.join(staging, "app"), path.join(staging, "app", "manifest.json"));
  atomicJson(path.join(staging, "components.json"), { version: meta.version, channel: meta.channel, electron: c.electron, python: c.python, packages: c.packages, app: c.app, installed_at: new Date().toISOString() });
  fs.rmSync(versionDir, { recursive: true, force: true });
  fs.renameSync(staging, versionDir);
  extracted.push("app(" + files + " files)");
  // The launcher is tiny and stable; it is refreshed from the release so a fix to it can ship too.
  const launcherSrc = path.join(versionDir, "app", "release", "launcher");
  if (fs.existsSync(launcherSrc)) {
    fs.mkdirSync(path.join(root, "launcher"), { recursive: true });
    for (const name of fs.readdirSync(launcherSrc)) fs.copyFileSync(path.join(launcherSrc, name), path.join(root, "launcher", name));
  }
  const now = readJson(path.join(root, "current.json"), {});
  const previous = now.version && now.version !== meta.version ? now.version : now.previous || null;
  atomicJson(path.join(root, "current.json"), { version: meta.version, previous, channel: meta.channel, electron: c.electron.id, switched_at: new Date().toISOString() });
  prune(root, meta.version, previous);
  return { version: meta.version, previous, extracted };
}

function targetOf(root, meta, name) {
  const c = meta.components[name];
  if (name === "electron") return path.join(root, "runtime", "electron-" + c.id);
  if (name === "python") return path.join(root, "runtime", "python-" + c.id);
  if (name === "packages") return path.join(root, "python-env", c.id);
  return path.join(root, "versions", meta.version, "app");
}

/** Keeps the current and the previous version (for rollback) and the runtimes they use; removes the rest. */
function prune(root, keep, previous) {
  const versions = path.join(root, "versions");
  const kept = new Set([keep, previous].filter(Boolean));
  const used = { electron: new Set(), python: new Set(), packages: new Set() };
  for (const v of fs.existsSync(versions) ? fs.readdirSync(versions) : []) {
    if (v.includes(".partial-")) { fs.rmSync(path.join(versions, v), { recursive: true, force: true }); continue; }
    if (!kept.has(v)) { fs.rmSync(path.join(versions, v), { recursive: true, force: true }); continue; }
    const comp = readJson(path.join(versions, v, "components.json"), {});
    for (const k of Object.keys(used)) if (comp[k]?.id) used[k].add(comp[k].id);
  }
  const sweep = (dir, prefix, ids) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) if (name.startsWith(prefix) && !ids.has(name.slice(prefix.length))) fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  };
  sweep(path.join(root, "runtime"), "electron-", used.electron);
  sweep(path.join(root, "runtime"), "python-", used.python);
  sweep(path.join(root, "python-env"), "", used.packages);
}

/** Start Menu (and optionally Desktop) shortcut: the stock electron.exe running the launcher, with the AEGIS icon. */
function shortcuts(root, { desktop = false } = {}) {
  const cur = readJson(path.join(root, "current.json"), {});
  const exe = path.join(root, "runtime", "electron-" + cur.electron, "electron.exe");
  const icon = path.join(root, "versions", cur.version, "app", "astra_ai", "ui", "frontend", "desktop", "icons", "icon.ico");
  const places = [path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", "AEGIS.lnk")];
  if (desktop) places.push(path.join(require("node:os").homedir(), "Desktop", "AEGIS.lnk"));
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const script = places.map((lnk) => `$s=(New-Object -ComObject WScript.Shell).CreateShortcut(${q(lnk)});$s.TargetPath=${q(exe)};$s.Arguments=${q('"' + path.join(root, "launcher") + '"')};$s.WorkingDirectory=${q(root)};$s.IconLocation=${q(icon + ",0")};$s.Description='AEGIS';$s.Save()`).join(";");
  const ps = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const r = spawnSync(ps, ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, encoding: "utf8" });
  if (r.status !== 0) throw new Error("Could not create the AEGIS shortcut: " + String(r.stderr).slice(0, 300));
  return places;
}

/** Apps & features entry (per user, no admin). Uninstall runs the uninstaller script the release ships. */
function register(root, meta) {
  const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AEGIS";
  const cur = readJson(path.join(root, "current.json"), {});
  const icon = path.join(root, "versions", cur.version, "app", "astra_ai", "ui", "frontend", "desktop", "icons", "icon.ico");
  const uninstaller = path.join(root, "Uninstall-AEGIS.ps1");
  const reg = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "reg.exe");
  const values = { DisplayName: "AEGIS", DisplayVersion: meta.version, Publisher: "AEGIS", InstallLocation: root, DisplayIcon: icon,
    UninstallString: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${uninstaller}"`, NoModify: "1", NoRepair: "1" };
  for (const [name, value] of Object.entries(values)) {
    const type = name.startsWith("No") ? "REG_DWORD" : "REG_SZ";
    const r = spawnSync(reg, ["add", key, "/v", name, "/t", type, "/d", value, "/f"], { windowsHide: true, encoding: "utf8" });
    if (r.status !== 0) throw new Error("Could not register AEGIS with Windows: " + String(r.stderr).slice(0, 200));
  }
}

function semverCompare(a, b) {
  const parse = (v) => { const [core, pre = ""] = String(v).split("-"); return { n: core.split(".").map(Number), pre }; };
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] > y.n[i] ? 1 : -1;
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  const [xc, xn] = x.pre.split("."), [yc, yn] = y.pre.split(".");
  if (xc !== yc) return xc > yc ? 1 : -1; // "dev" < "beta"? alphabetical: beta < dev; channels are compared within one channel
  return Number(xn) - Number(yn);
}

module.exports = { verifyMetadata, verifyAsset, sha512File, installRelease, shortcuts, register, semverCompare, extract, VERSION, readJson, atomicJson };
