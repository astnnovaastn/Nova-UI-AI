// V35: measures the INSTALLED AEGIS (throwaway install + data folder, its own ports): install size, cold start,
// idle memory and CPU per process kind, and the memory one browser tab adds. No model spend; one public page load.
// Usage: node release/test/perf.cjs <AEGIS-Setup-x.zip> [out.json]
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawnSync, execFileSync } = require("node:child_process");
const { _electron: electron } = require(path.resolve(__dirname, "../../astra_ai/ui/frontend/node_modules/@playwright/test"));

const [setupZip, outFile = path.join(os.tmpdir(), "aegis-v35-perf.json")] = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v35-perf-"));
const root = path.join(tmp, "Programs", "AEGIS"), data = path.join(tmp, "AppData", "AEGIS");
const health = () => new Promise((resolve) => { const r = http.get({ host: "127.0.0.1", port: 8350, path: "/api/health", timeout: 1500 }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } }); }); r.on("error", () => resolve(null)); r.on("timeout", () => r.destroy()); });
const dirSize = (dir) => { let n = 0; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); n += e.isDirectory() ? dirSize(p) : fs.statSync(p).size; } return n; };
const MB = (b) => Math.round(b / 1048576);

/** Working set and CPU seconds of every process running from the install folder, grouped by kind. */
function sample() {
  const ps = `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '${root.replace(/'/g, "''")}*' } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { '{0}|{1}|{2}|{3}' -f $_.Name, $p.WorkingSet64, $p.TotalProcessorTime.TotalSeconds, ($_.CommandLine -replace '.*--type=([a-z-]+).*','$1') } }`;
  const rows = execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean).map((l) => { const [name, ws, cpu, type] = l.split("|"); return { name, ws: Number(ws), cpu: Number(cpu), type: name === "python.exe" ? "python" : /^[a-z-]+$/.test(type) && type !== name ? type : "main" }; });
  const groups = {};
  for (const r of rows) { const g = (groups[r.type] ||= { count: 0, mb: 0, cpu: 0 }); g.count++; g.mb += r.ws / 1048576; g.cpu += r.cpu; }
  for (const g of Object.values(groups)) { g.mb = Math.round(g.mb); g.cpu = Math.round(g.cpu * 100) / 100; }
  return { totalMb: Math.round(rows.reduce((n, r) => n + r.ws, 0) / 1048576), cpuSeconds: Math.round(rows.reduce((n, r) => n + r.cpu, 0) * 100) / 100, groups };
}

(async () => {
  const result = { machine: { cpus: os.cpus().length, cpu: os.cpus()[0].model, ramGb: Math.round(os.totalmem() / 1073741824) } };
  const setup = path.join(tmp, "setup"); fs.mkdirSync(setup);
  execFileSync(path.join(process.env.SystemRoot, "System32", "tar.exe"), ["-xf", setupZip, "-C", setup]);
  let t = Date.now();
  const inst = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(setup, "installer", "Install-AEGIS.ps1"), "-InstallRoot", root, "-DataRoot", data, "-NoShell", "-NoLaunch", "-Quiet"], { encoding: "utf8" });
  result.install = { seconds: Math.round((Date.now() - t) / 100) / 10, ok: inst.status === 0, sizeOnDiskMb: MB(dirSize(root)), setupZipMb: MB(fs.statSync(setupZip).size) };
  const current = JSON.parse(fs.readFileSync(path.join(root, "current.json"), "utf8"));
  t = Date.now();
  const app = await electron.launch({ executablePath: path.join(root, "runtime", "electron-" + current.electron, "electron.exe"), args: [path.join(root, "launcher")], timeout: 120000, env: { ...process.env, AEGIS_DATA_ROOT: data, AEGIS_UPDATE_FIRST_CHECK_MS: "3600000" } });
  const page = await app.firstWindow();
  result.start = { firstWindowMs: Date.now() - t };
  for (;;) { if ((await health())?.status === "healthy") break; await wait(250); }
  result.start.backendHealthyMs = Date.now() - t;
  await page.waitForSelector(".aegis-work-stage", { timeout: 120000 }).catch(() => {});
  result.start.workspaceReadyMs = Date.now() - t;
  await wait(30000);
  const idle1 = sample(); await wait(20000); const idle2 = sample();
  result.idle = { ...idle2, cpuPercentOver20s: Math.round(((idle2.cpuSeconds - idle1.cpuSeconds) / 20 / result.machine.cpus) * 1000) / 10 };
  // One browser tab with a light public page.
  await page.evaluate(() => window.__aegisBrowserTabs?.newTab("https://en.wikipedia.org/wiki/Windows_10"));
  await wait(12000);
  const tab = sample();
  result.oneTab = { totalMb: tab.totalMb, addedMb: tab.totalMb - idle2.totalMb, groups: tab.groups };
  await app.close().catch(() => {});
  const left = execFileSync("powershell.exe", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '${root.replace(/'/g, "''")}*' } | ForEach-Object { $_.ProcessId }`], { encoding: "utf8" }).split(/\s+/).filter(Boolean);
  for (const pid of left) spawnSync("taskkill.exe", ["/PID", pid, "/T", "/F"]);
  result.shutdown = { processesLeftAfterClose: left.length };
  fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
  console.log(JSON.stringify(result, null, 1));
  fs.rmSync(tmp, { recursive: true, force: true });
})();
