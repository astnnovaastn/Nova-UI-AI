// Measures what the engine really does to a source page that is hidden, and to one that is
// frozen: how many timers and animation frames it runs each second. Run with Electron directly,
// because a test harness (Playwright) makes every page believe it is focused, which hides this.
// Opens a small window for about fifteen seconds. No network.
// Usage: node_modules/electron/dist/electron.exe tests/desktop-throttle-probe.cjs
const { app, BrowserWindow, WebContentsView } = require("electron");
const os = require("node:os");
const path = require("node:path");

app.setPath("userData", path.join(os.tmpdir(), "aegis-throttle-probe"));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PAGE = "data:text/html,<body><script>window.ticks=0;setInterval(()=>ticks++,50);window.frames=0;(function f(){frames++;requestAnimationFrame(f)})()</script>probe</body>";

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 760, height: 520, title: "AEGIS throttle probe" });
  await win.loadURL("about:blank");
  const view = new WebContentsView({ webPreferences: { sandbox: true, backgroundThrottling: true } });
  win.contentView.addChildView(view);
  view.setBounds({ x: 40, y: 40, width: 600, height: 380 });
  const contents = view.webContents;
  await contents.loadURL(PAGE);

  const read = () => Promise.race([contents.executeJavaScript("({ visibility: document.visibilityState, ticks, frames })"), wait(1500).then(() => null)]);
  const results = [];
  async function measure(name) {
    const first = await read();
    await wait(2000);
    const second = await read();
    const row = first && second ? { name, visibility: second.visibility, timers: (second.ticks - first.ticks) / 2, frames: (second.frames - first.frames) / 2 } : { name, visibility: "(no answer)", timers: 0, frames: 0 };
    results.push(row);
    console.log(`${name.padEnd(30)} ${row.visibility.padEnd(12)} timers/s ${row.timers.toFixed(1).padStart(5)}   frames/s ${row.frames.toFixed(1).padStart(5)}`);
    return row;
  }

  await wait(1000);
  const shown = await measure("shown");
  view.setVisible(false);
  await wait(500);
  const hidden = await measure("hidden (background)");
  contents.debugger.attach("1.3");
  await contents.debugger.sendCommand("Page.setWebLifecycleState", { state: "frozen" });
  await wait(500);
  const frozen = await measure("frozen (suspended)");
  await contents.debugger.sendCommand("Page.setWebLifecycleState", { state: "active" });
  contents.debugger.detach();
  view.setVisible(true);
  await wait(700);
  const back = await measure("shown again");

  const ok = shown.timers > 15 && shown.frames > 30 && hidden.visibility === "hidden" && hidden.timers <= 2 && hidden.frames === 0 && frozen.timers === 0 && frozen.frames === 0 && back.timers > 15 && back.frames > 30;
  console.log(ok ? "\nPASS  hidden pages are throttled, frozen pages stop, and both come back" : "\nFAIL");
  app.exit(ok ? 0 : 1);
});
