/**
 * AEGIS launcher (V35). The Start Menu shortcut runs the stock, unmodified electron.exe with this folder:
 *   <install>\runtime\electron-<ver>\electron.exe "<install>\launcher"
 * so no new executable is ever created (Smart App Control trusts the stock Electron by its known hash).
 *
 * It reads <install>\current.json, points the app at that version's folder and loads its desktop main.
 * If that version cannot be loaded, it falls back to `previous` once and records why. It never downloads
 * or changes anything itself; updates are installed by the running app (desktop/updater.cjs).
 */
const fs = require("node:fs");
const path = require("node:path");
const { app, dialog } = require("electron");

const install = path.resolve(__dirname, "..");
const read = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const current = read(path.join(install, "current.json"), {});
const data = process.env.AEGIS_DATA_ROOT || path.join(app.getPath("appData"), "AEGIS");

// The person's data lives outside the program folder; Electron's profile (browser sessions) in %APPDATA%\AEGIS.
app.setName("AEGIS");
app.setPath("userData", data);

function entryFor(version) {
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(String(version || ""))) return null;
  const main = path.join(install, "versions", version, "app", "astra_ai", "ui", "frontend", "desktop", "main.cjs");
  return fs.existsSync(main) ? main : null;
}

function start(version, fallback) {
  const main = entryFor(version);
  if (!main) throw new Error("AEGIS " + (version || "(none)") + " is not installed correctly.");
  process.env.AEGIS_INSTALL_ROOT = install;
  process.env.AEGIS_APP_VERSION = version;
  process.env.AEGIS_DATA_ROOT = data;
  if (fallback) process.env.AEGIS_FELL_BACK_FROM = fallback;
  require(main);
}

try {
  start(current.version);
} catch (error) {
  const note = path.join(data, "launcher-error.log");
  try { fs.mkdirSync(data, { recursive: true }); fs.appendFileSync(note, new Date().toISOString() + " " + (error.stack || error) + "\n"); } catch {}
  if (current.previous && current.previous !== current.version && entryFor(current.previous)) {
    start(current.previous, current.version);
  } else {
    app.whenReady().then(() => {
      dialog.showErrorBox("AEGIS could not start", String(error.message || error) + "\n\nReinstall AEGIS from its installer. Your data in " + data + " is untouched.");
      app.quit();
    });
  }
}
