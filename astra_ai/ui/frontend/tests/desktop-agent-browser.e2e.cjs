// The agent browser in real Electron, end to end: a test backend (only the agent-browser routes)
// asks the hidden renderer for real public pages over the authenticated loopback WebSocket.
// Loads a real website (Wikipedia). Never captures the screen; screenshots come from capturePage().
// Usage: node tests/desktop-agent-browser.e2e.cjs
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const { _electron: electron } = require("@playwright/test");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(probe, timeout = 30000, step = 250) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await probe().catch(() => undefined);
    if (value) return value;
    if (Date.now() > end) return value;
    await wait(step);
  }
}
const getJson = (port, route) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, path: route, timeout: 60000 }, (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => {
          try {
            resolve({ status: response.statusCode, body: JSON.parse(body) });
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
const ask = (port, action, url) => getJson(port, `/test/ask?action=${action}&url=${encodeURIComponent(url)}`).then((reply) => reply.body);

(async () => {
  const frontend = path.resolve(__dirname, "..");
  const project = path.resolve(frontend, "..", "..", "..");
  const python = [path.join(project, ".venv", "Scripts", "python.exe"), path.join(project, ".venv", "bin", "python")].find((file) => fs.existsSync(file)) || "python";
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-agent-"));
  const port = 18000 + Math.floor(Math.random() * 2000);
  const tokenFile = path.join(profile, "agent-browser.token");
  const backend = spawn(python, [path.join(__dirname, "agent-browser-host-server.py"), String(port)], { cwd: project, env: { ...process.env, AEGIS_AGENT_BROWSER_TOKEN_FILE: tokenFile, AEGIS_AGENT_BROWSER_TOKEN: "" }, stdio: ["ignore", "inherit", "inherit"] });
  let app;
  try {
    check("The test backend answers", await until(() => getJson(port, "/api/work/agent-browser/status").then((r) => r.status === 200), 20000));
    check("Before the desktop connects, status says not connected", (await getJson(port, "/api/work/agent-browser/status")).body.connected === false);

    app = await electron.launch({ args: [path.join(__dirname, "agent-browser-harness.cjs")], cwd: frontend, timeout: 60000, env: { ...process.env, AGENT_USER_DATA: profile, AGENT_HOST_URL: `ws://127.0.0.1:${port}/api/work/agent-browser/host` } });
    check("The token file was written", await until(async () => fs.existsSync(tokenFile) && fs.readFileSync(tokenFile, "utf8").length >= 43, 10000));
    check("The desktop renderer connects with its token", await until(() => getJson(port, "/api/work/agent-browser/status").then((r) => r.body.connected === true), 20000));

    // Watch every window for the whole run: none may ever be shown.
    await app.evaluate(({ BrowserWindow, app: electronApp }) => {
      globalThis.everShown = [];
      const watch = (win) => win.on("show", () => globalThis.everShown.push(win.getTitle()));
      BrowserWindow.getAllWindows().forEach(watch);
      electronApp.on("browser-window-created", (_event, win) => watch(win));
      globalThis.visibleSeen = 0;
      globalThis.maxWindows = 0;
      globalThis.sampler = setInterval(() => {
        const all = BrowserWindow.getAllWindows();
        globalThis.maxWindows = Math.max(globalThis.maxWindows, all.length);
        if (all.some((w) => !w.isDestroyed() && w.isVisible())) globalThis.visibleSeen += 1;
      }, 50);
    });

    const page = "https://en.wikipedia.org/wiki/Brutalist_architecture";
    const render = await ask(port, "render", page);
    const result = render.result || {};
    check("Render of a public page returns text through the backend", render.ok && /brutalis/i.test(result.text || "") && (result.text || "").length > 2000, render.ok ? `${(result.text || "").length} chars, title "${result.title}"` : render.error);
    check("Render returns the final address, links and images", render.ok && /^https:\/\/en\.wikipedia\.org\//.test(result.final_url) && result.links.length > 20 && result.links.length <= 200 && result.images.length <= 40, render.ok ? `${result.links.length} links, ${result.images.length} images` : "");

    const shot = await ask(port, "screenshot", page);
    const png = shot.ok ? Buffer.from(shot.result.png_base64, "base64") : Buffer.alloc(0);
    check("Screenshot comes from capturePage as a PNG no wider than 1600", shot.ok && png.subarray(1, 4).toString() === "PNG" && shot.result.width <= 1600 && shot.result.height > 100, shot.ok ? `${shot.result.width}x${shot.result.height}, ${png.length} bytes` : shot.error);
    if (shot.ok) fs.writeFileSync(path.join(profile, "agent-shot.png"), png);

    const local = await ask(port, "render", "http://127.0.0.1:8340/api/health");
    check("A loopback address is refused", !local.ok, local.error);
    const rebinding = await ask(port, "render", "http://localtest.me/");
    check("A public name that resolves to this computer is refused after DNS", !rebinding.ok && /blocked_address|non_public/.test(rebinding.error), rebinding.error);
    const fileUrl = await ask(port, "render", "file:///C:/Windows/win.ini");
    check("A file address is refused", !fileUrl.ok, fileUrl.error);

    const many = await Promise.all(["https://en.wikipedia.org/wiki/Concrete", "https://en.wikipedia.org/wiki/Le_Corbusier", "https://en.wikipedia.org/wiki/Barbican_Estate"].map((url) => ask(port, "render", url)));
    check("Three requests at once all complete", many.every((reply) => reply.ok && reply.result.text.length > 500), many.map((reply) => (reply.ok ? reply.result.title : reply.error)).join(" | "));
    check("Never more than two agent pages at once", (await app.evaluate(() => globalThis.agentHost.renderer.count())) <= 2 && (await app.evaluate(() => globalThis.maxWindows)) <= 2, `max windows ${await app.evaluate(() => globalThis.maxWindows)}`);

    // Dialog dismissal is not checked here: Playwright's own CDP session answers page dialogs too.
    const partitions = await app.evaluate(() => globalThis.agentHost.renderer.windows().map((w) => w.webContents.session.isPersistent()));
    check("Agent pages use a non-persistent session", partitions.length > 0 && partitions.every((persistent) => persistent === false), JSON.stringify(partitions));

    const shown = await app.evaluate(() => ({ events: globalThis.everShown, samples: globalThis.visibleSeen }));
    check("No agent window was ever shown", shown.events.length === 0 && shown.samples === 0, JSON.stringify(shown));

    await app.evaluate(() => globalThis.agentHost.shutdown());
    check("Shutdown closes every agent window", (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 0);
    check("Shutdown disconnects from the backend", await until(() => getJson(port, "/api/work/agent-browser/status").then((r) => r.body.connected === false), 10000));
    const after = await ask(port, "render", page).catch(() => ({ ok: false }));
    check("After shutdown the backend has no renderer", !after.ok);
  } catch (error) {
    check("The run finished", false, error && error.stack);
  } finally {
    await app?.close().catch(() => {});
    backend.kill();
  }
  const failed = results.filter((row) => !row.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
