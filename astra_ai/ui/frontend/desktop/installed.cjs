/**
 * V35: AEGIS installed from a release (release/installer) rather than run from the source tree.
 *
 * The launcher (release/launcher/main.cjs) sets AEGIS_INSTALL_ROOT, AEGIS_APP_VERSION and AEGIS_DATA_ROOT.
 * Layout:
 *   <install>\current.json                     {version, previous}
 *   <install>\versions\<ver>\app\...           this program (replaced by updates)
 *   <install>\versions\<ver>\components.json   which runtime / packages this version uses
 *   <install>\runtime\electron-<id>\           stock Electron, unmodified
 *   <install>\runtime\python-<id>\             signed CPython runtime, unmodified
 *   <install>\python-env\<packages id>\        a venv over that runtime with the bundled site-packages
 *   %APPDATA%\AEGIS\                           Electron profile (browser sessions, settings)
 *   %APPDATA%\AEGIS\data\state, data\.env      the person's AEGIS data and keys — never inside <install>
 * The backend runs from the venv's python with NOVA_STATE_DIR / AEGIS_ENV_FILE pointing at the data folder.
 */
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = process.env.AEGIS_INSTALL_ROOT || "";
const installed = Boolean(root && fs.existsSync(path.join(root, "current.json")));
const version = process.env.AEGIS_APP_VERSION || "";
// The installed app's own ports, so it can run beside a development copy (which keeps 5173 / 8340 / 8341).
const PORTS = { ui: 5183, backend: 8350, runtime: 8351 };
if (installed) {
  // Folder grants are the person's data: the desktop writes them where the installed backend reads them.
  process.env.AEGIS_WORK_AUTHORIZED_FOLDERS_FILE ||= path.join(process.env.AEGIS_DATA_ROOT || "", "data", "state", "work", "authorized_folders.json");
  process.env.AEGIS_UI_PORT ||= String(PORTS.ui);
  process.env.AEGIS_BACKEND_PORT ||= String(PORTS.backend);
  process.env.AEGIS_RUNTIME_PORT ||= String(PORTS.runtime);
}
const read = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };

function paths() {
  const data = process.env.AEGIS_DATA_ROOT || "";
  const app = path.resolve(__dirname, "..", "..", "..", "..");
  const components = read(path.join(app, "..", "components.json"), {});
  const env = components.packages ? path.join(root, "python-env", components.packages.id) : "";
  return {
    root, data, app, components,
    state: path.join(data, "data", "state"),
    envFile: path.join(data, "data", ".env"),
    python: env ? path.join(env, "Scripts", "python.exe") : "",
    runtime: path.join(app, "scripts", "nova_runtime.py"),
    logs: path.join(data, "data", "state", "logs"),
  };
}

function health(timeout = 1500) {
  return new Promise((resolve) => {
    const request = http.get({ host: "127.0.0.1", port: Number(process.env.AEGIS_BACKEND_PORT || 8340), path: "/api/health", timeout }, (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => { try { resolve(response.statusCode === 200 ? JSON.parse(body) : null); } catch { resolve(null); } });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(null));
  });
}

let child = null;

/** Starts this version's backend (or adopts one this same version left running). Returns why it could not. */
async function startBackend(extraEnv = {}) {
  const p = paths();
  const running = await health();
  if (running?.status === "healthy") {
    if (running.version === version) return { adopted: true };
    throw new Error(running.version === "dev" || !running.version
      ? "A development copy of AEGIS is running on this computer. Close it (and its backend) before starting the installed AEGIS."
      : `AEGIS ${running.version} is still running. Close it before starting ${version}.`);
  }
  if (!p.python || !fs.existsSync(p.python)) throw new Error("AEGIS's Python environment is missing. Reinstall AEGIS from its installer; your data is untouched.");
  fs.mkdirSync(p.logs, { recursive: true });
  if (!fs.existsSync(p.envFile)) fs.writeFileSync(p.envFile, "# AEGIS settings and model keys for this computer. Edited from AEGIS Settings.\n");
  const out = fs.openSync(path.join(p.logs, "desktop-runtime.log"), "a");
  child = spawn(p.python, ["-s", p.runtime], {
    cwd: p.app, windowsHide: true, stdio: ["ignore", out, out],
    env: { ...process.env, ...extraEnv, NOVA_STATE_DIR: p.state, AEGIS_ENV_FILE: p.envFile, AEGIS_APP_VERSION: version,
      AEGIS_WORK_AUTHORIZED_FOLDERS_FILE: path.join(p.state, "work", "authorized_folders.json"),
      PYTHONNOUSERSITE: "1", PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" },
  });
  child.once("exit", () => { child = null; });
  const until = Date.now() + 180000;
  while (Date.now() < until) {
    const now = await health();
    if (now?.status === "healthy" && now.version === version) return { started: true };
    if (!child) throw new Error("AEGIS's backend stopped while starting. See " + path.join(p.logs, "desktop-runtime.log"));
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("AEGIS's backend did not become ready within 3 minutes.");
}

/** Stops the supervisor and its backend child (process tree), only if this app started them. */
function stopBackend() {
  if (!child) return;
  try { spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, timeout: 10000 }); } catch {}
  child = null;
}

const uiPort = () => Number(process.env.AEGIS_UI_PORT || 5173);
module.exports = { installed, version, paths, health, startBackend, stopBackend, uiPort };
