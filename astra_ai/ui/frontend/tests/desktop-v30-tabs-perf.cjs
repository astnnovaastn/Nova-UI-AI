// V30 browser-tab resource check: opens three real tabs, returns to the Work canvas, and measures the
// whole app (every child process) while the desktop's resource manager freezes and releases the hidden
// tabs. Waits are shortened with AEGIS_LIFECYCLE_SCALE so minutes of idling take seconds.
// Usage: node tests/desktop-v30-tabs-perf.cjs [out.json]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const out = process.argv[2] || "v30-tabs-perf.json";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const frontend = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v30-perf-"));

(async () => {
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000,
    env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile, AEGIS_LIFECYCLE_SCALE: "0.02" } });
  const page = await app.firstWindow();
  for (let i = 0; i < 200 && !(await page.evaluate(() => location.href.startsWith("http")).catch(() => false)); i++) await wait(300);
  await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("button.new-tab", { timeout: 60000 });
  const sample = async (label) => {
    const row = await app.evaluate(({ app }) => {
      const metrics = app.getAppMetrics();
      return { processes: metrics.length, mb: Math.round(metrics.reduce((sum, m) => sum + (m.memory.privateBytes ?? m.memory.workingSetSize), 0) / 1024),
               cpu: Math.round(metrics.reduce((sum, m) => sum + m.cpu.percentCPUUsage, 0)) };
    });
    const panes = (await app.evaluate(() => globalThis.aegisDesktopDiagnostics())).panes.filter((p) => p.kind === "tab").map((p) => ({ live: p.live, frozen: p.frozen, state: p.state }));
    return { label, ...row, tabs: panes };
  };
  const rows = [await sample("workspace only")];
  for (const [index, address] of ["en.wikipedia.org/wiki/Robotics", "arxiv.org", "developer.mozilla.org/en-US/"].entries()) {
    await (index === 0 ? page.locator("button.new-tab").first() : page.locator(".browser.shown button.add")).click();
    for (let i = 0; i < 20 && !(await page.evaluate(() => document.activeElement?.classList.contains("address"))); i++) await wait(100);
    await page.keyboard.type(address);
    await page.keyboard.press("Enter");
    await wait(6000);
  }
  rows.push(await sample("three tabs loaded, last one shown"));
  await page.locator(".browser.shown .tab.work").click();
  await wait(2000);
  rows.push(await sample("back on the Work canvas (tabs hidden)"));
  await wait(20000);
  rows.push(await sample("hidden ~20 s (scaled: ~17 min idle)"));
  await page.locator("button.new-tab.tabs").click();
  await wait(5000);
  rows.push(await sample("one tab shown again"));
  await app.close();
  fs.rmSync(profile, { recursive: true, force: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 1));
  for (const row of rows) console.log(`${row.label.padEnd(42)} ${String(row.mb).padStart(5)} MB  ${row.processes} processes  tabs: ${row.tabs.map((t) => (t.live ? (t.frozen ? "frozen" : "live") : "released")).join(", ") || "-"}`);
})();
