// Measures AEGIS Desktop: start-up time, memory by process and CPU, through a fixed set of
// scenarios on a saved research (no model spend). Runs a separate copy of the app with its own
// profile, so it can run beside an open AEGIS window. Loads a few real websites.
// Usage: node tests/desktop-profile.cjs <label> [output folder] ["<library search>"]
//   env PROFILE_HOLD_MS: how long five windows are left alone before the "settled" sample (default 75000)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { _electron: electron } = require("@playwright/test");

const [label = "run", out = "desktop-profile", search = "offshore wind"] = process.argv.slice(2);
const HOLD = Number(process.env.PROFILE_HOLD_MS) || 75000;
const SITES = [
  "https://en.wikipedia.org/wiki/Offshore_wind_power",
  "https://deepmind.google/",
  "https://github.com/zephium-browser/Zephium",
  "https://www.bbc.com/news",
  "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
];
fs.mkdirSync(out, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const mb = (kb) => Math.round(kb / 1024);

/** The services outside Electron: backend, its supervisor and whatever serves the web app. */
function serviceProcesses() {
  const script = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'nova_runtime\\.py|backend[\\\\/]server\\.py|ui[\\\\/]frontend[\\\\/]node_modules[\\\\/]vite[\\\\/]bin[\\\\/]vite\\.js' } | ForEach-Object { $p = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process -Filter "IDProcess=$($_.ProcessId)"; [pscustomobject]@{ cmd = $_.CommandLine; ws = $_.WorkingSetSize; priv = $p.PrivateBytes; cpu = $p.PercentProcessorTime } } | ConvertTo-Json -Compress`;
  let rows = [];
  try {
    const text = execFileSync("powershell.exe", ["-NoProfile", "-Command", script], { encoding: "utf8" }).trim();
    rows = text ? [].concat(JSON.parse(text)) : [];
  } catch {
    /* services not readable */
  }
  const kinds = { "backend server": /backend[\\/]server\.py/, "backend supervisor": /nova_runtime\.py/, "vite dev server": /ui[\\/]frontend[\\/]node_modules[\\/]vite[\\/]bin[\\/]vite\.js/ };
  const result = {};
  for (const [kind, pattern] of Object.entries(kinds)) {
    const mine = rows.filter((row) => pattern.test(row.cmd));
    if (mine.length) result[kind] = { workingSetMB: Math.round(mine.reduce((sum, row) => sum + Number(row.ws), 0) / 1048576), privateMB: Math.round(mine.reduce((sum, row) => sum + Number(row.priv || 0), 0) / 1048576), cpu: mine.reduce((sum, row) => sum + Number(row.cpu || 0), 0) };
  }
  return result;
}

(async () => {
  const frontend = path.resolve(__dirname, "..");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-profile-"));
  const samples = [];
  const started = Date.now();
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000, env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  const page = await app.firstWindow();

  /** Memory now, and CPU averaged over `seconds`, by kind of process. */
  async function sample(name, seconds = 10) {
    await app.evaluate(({ app }) => void app.getAppMetrics());
    await wait(seconds * 1000);
    const { metrics, panes } = await app.evaluate(({ app, BrowserWindow, webContents }) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS");
      const paneIds = new Set(win.contentView.children.map((view) => view.webContents.getOSProcessId()));
      const mainRenderer = win.webContents.getOSProcessId();
      return {
        metrics: app.getAppMetrics().map((m) => ({
          kind: m.type === "Browser" ? "main" : m.type === "GPU" ? "gpu" : m.type === "Tab" ? (m.pid === mainRenderer ? "workspace renderer" : paneIds.has(m.pid) ? "source page" : "other renderer") : `utility ${m.serviceName || m.name || ""}`.trim(),
          workingSetKB: m.memory.workingSetSize,
          privateKB: m.memory.privateBytes ?? 0,
          cpu: m.cpu.percentCPUUsage,
        })),
        panes: { views: win.contentView.children.length, visible: win.contentView.children.filter((view) => view.getVisible()).length, pages: webContents.getAllWebContents().length - 1 },
      };
    });
    const groups = {};
    for (const m of metrics) {
      const group = (groups[m.kind] ??= { count: 0, workingSetMB: 0, privateMB: 0, cpu: 0 });
      group.count++;
      group.workingSetMB += mb(m.workingSetKB);
      group.privateMB += mb(m.privateKB);
      group.cpu = Math.round((group.cpu + m.cpu) * 10) / 10;
    }
    const services = serviceProcesses();
    const sum = (rows, key) => Object.values(rows).reduce((total, row) => total + row[key], 0);
    const row = {
      name,
      electron: { privateMB: sum(groups, "privateMB"), workingSetMB: sum(groups, "workingSetMB"), cpu: Math.round(sum(groups, "cpu") * 10) / 10, processes: metrics.length },
      services: { privateMB: sum(services, "privateMB"), workingSetMB: sum(services, "workingSetMB"), cpu: sum(services, "cpu") },
      panes,
      groups,
      serviceGroups: services,
    };
    row.totalPrivateMB = row.electron.privateMB + row.services.privateMB;
    samples.push(row);
    console.log(`${name.padEnd(46)} electron ${String(row.electron.privateMB).padStart(5)} MB  cpu ${String(row.electron.cpu).padStart(5)}%  procs ${String(row.electron.processes).padStart(2)}  | services ${String(row.services.privateMB).padStart(4)} MB cpu ${row.services.cpu}%  | total ${row.totalPrivateMB} MB  | pages ${panes.pages} (shown ${panes.visible})`);
    return row;
  }

  // Start-up.
  for (let i = 0; i < 600 && !/^https?:\/\/127\.0\.0\.1:5173\//.test(page.url()); i++) await wait(250);
  const toWorkspace = Date.now() - started;
  await page.waitForSelector("#orb-canvas, .aegis-work-stage", { timeout: 60000 });
  await page.waitForLoadState("load");
  const toUsable = Date.now() - started;
  const requests = await page.evaluate(() => performance.getEntriesByType("resource").length);
  console.log(`start-up: workspace address after ${toWorkspace} ms, page loaded after ${toUsable} ms, ${requests} requests`);

  await wait(15000);
  await sample("1 idle, home screen", 20);

  await page.evaluate(() => { try { sessionStorage.setItem("nova-current-workspace", "research"); } catch {} });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await wait(12000);
  await sample("2 Research workspace, saved research open", 20);

  const open = (url) => require("./source-browser-control.cjs").openSourceFromControl(page, url);
  const settle = async () => {
    for (let i = 0; i < 60; i++) {
      const busy = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.getTitle() === "AEGIS").contentView.children.some((view) => view.webContents.isLoading()));
      if (!busy) break;
      await wait(500);
    }
    await wait(4000);
  };
  await open(SITES[0]);
  await settle();
  await sample("4 one live website");

  for (const site of SITES.slice(1)) {
    await open(site);
    await settle();
  }
  await sample("5a five source windows, just opened");
  await wait(HOLD);
  await sample(`5b five source windows, left alone ${Math.round(HOLD / 1000)} s`);

  const closeAll = async () => {
    while (await page.locator('.pane button[aria-label="Close pane"]').count()) {
      await page.locator('.pane button[aria-label="Close pane"]').last().click();
      await wait(350);
    }
  };
  await closeAll();
  await wait(6000);
  await sample("7 all source windows closed");

  for (let cycle = 0; cycle < 8; cycle++) {
    await open(SITES[cycle % 2]);
    await settle();
    await closeAll();
  }
  await wait(8000);
  await sample("8 after 8 more open/close cycles");

  const report = { label, when: new Date().toISOString(), startup: { toWorkspaceMs: toWorkspace, toLoadedMs: toUsable, requests }, machine: { ramGB: Math.round(os.totalmem() / 2 ** 30), cpus: os.cpus().length }, samples };
  const file = path.resolve(out, `${label}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\nsaved ${file}`);
  await app.close();
  fs.rmSync(profile, { recursive: true, force: true });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
