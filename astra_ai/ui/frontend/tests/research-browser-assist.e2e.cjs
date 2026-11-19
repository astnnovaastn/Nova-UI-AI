const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { _electron: electron, expect } = require("@playwright/test");

const frontend = path.resolve(__dirname, "..");
const dist = path.join(frontend, "dist");
const report = {
  status: "ok", kind: "research", research_id: "chat-fixture", research_session_id: "chat-fixture",
  research_revision: "fixture-rev", display_title: "Browser research fixture", query: "Browser research fixture",
  report: "# A saved report\n\nHere is saved evidence.", completeness: "complete", phase: "complete",
  publication_state: "ready", sources: [{id:"S1", title:"Fixture source", url:"https://example.com/evidence"}], images: [], media: [], image_items: [], attachments: [],
};
const calls = [];
const note = {
  id: "saved-note", title: "Saved browser handoff", preview: "Fixture note.", revision: "note-v1",
  pinned: false, trashed: false, editable: true, created_at: String(Date.now()), modified_at: String(Date.now()), path: "saved-note.md",
};
const themes = [
  { id: "dark", name: "Dark", tokens: { bg: "#282c34", fg: "#9cdef2", panel: "#111111", border: "#355a66", accent: "#e06c75" } },
  { id: "paper", name: "Paper", tokens: { bg: "#faf8f5", fg: "#3b3836", panel: "#ffffff", border: "#d5d0c8", accent: "#c5ac4a" } },
];
let defaultThemeId = "dark";
let keySaved = false;
let preferences = { user_name: "Local test profile", honorific: "sir", calendar_accounts: "auto" };
const writer = {
  provider: "gemini", switching: false, voice_model: "Fixture voice",
  providers: [{ id: "gemini", active: true, configured: true, model: "Fixture writer", tokens_used: 4500, token_limit: 10000 }],
};
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    let result = {};
    if (pathname === "/api/themes") result = { success: true, data: { builtins: themes, custom: [], defaultThemeId } };
    else if (pathname === "/api/themes/default") {
      defaultThemeId = data.themeId;
      result = { success: true, data: { theme: themes.find(theme => theme.id === defaultThemeId) } };
    } else if (pathname === "/api/settings/preferences") {
      if (req.method === "POST") preferences = data;
      result = preferences;
    } else if (pathname === "/api/settings/research-provider") result = writer;
    else if (pathname === "/api/settings/status") result = { research_writer: writer, env_keys_set: { gemini: keySaved, groq: true }, models: {} };
    else if (pathname === "/api/settings/keys" && req.method === "POST") {
      keySaved = data.key_name === "GEMINI_API_KEY" && data.key_value === "local-test-value";
      result = { success: keySaved };
    }
    else if (pathname === "/api/sync/presence") result = { windows: [{ client_id: "fixture-client", label: "Desktop window", context: { view: "research" } }] };
    else if (pathname === "/api/devices") result = { devices: [], pairing_enabled: false };
    else if (pathname === "/api/workspace/v21/notes") {
      let response = { kind: "error", error: "unavailable" };
      if (data.call?.kind === "list" || data.call?.kind === "backlinks") {
        response = { kind: "page", items: data.call.kind === "list" && !data.call.query?.trashed ? [note] : [], next: null };
      } else if (data.call?.kind === "get" && data.call.id === note.id) {
        response = { kind: "record", record: { summary: note, markdown: "# Saved browser handoff\n\nFixture note." } };
      }
      result = { profile: data.expectedProfile, response };
    } else if (pathname.endsWith("/document")) result = report;
    else if (pathname.endsWith("/conversation")) result = { messages: [] };
    else if (pathname === "/api/work/skills") result = { skills: [{
      name: "deep-search", title: "Deep Search", description: "Research and verify evidence",
      category: "research", source: "builtin", origin: "", enabled: true, version: "1", triggers: [],
    }] };
    else if (pathname === "/api/work/skills/deep-search") result = { text: "Check sources", skill: { body: "Check sources" } };
    else if (pathname === "/api/work/connections") result = { connections: [{
      id: "fixture-search", title: "Search provider", kind: "search", status: "connected",
      enabled: true, toggle: true, capabilities: ["Search"], scope: "Host",
    }] };
    else if (pathname === "/api/work/network") result = { proxy: { mode: "off" } };
    else if (pathname === "/api/work/google") result = { configured: false, connected: false, services: [] };
    else if (pathname === "/api/work/repositories") result = { repositories: [] };
    else if (pathname.endsWith("/selections")) {
      calls.push(["attach", data]);
      result = { id: "live-card", page_id: report.research_id, kind: "selection", ...data };
    } else if (pathname === "/api/work/runs" && req.method === "POST") {
      calls.push(["handoff", data]);
      result = { status: "accepted" };
    } else if (pathname === "/api/research") result = { items: [], total: 0 };
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
    return;
  }
  const file = path.resolve(dist, "." + (pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm" };
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});


async function checkLibraryDrawers(page, app) {
  const rail = page.getByRole("navigation", { name: "AEGIS", exact: true });
  const libraryButton = rail.getByRole("button", { name: "Research library", exact: true });
  const skillsButton = rail.getByRole("button", { name: "Skills", exact: true });
  const connectionsButton = rail.getByRole("button", { name: "Connections", exact: true });
  const conversationButton = rail.getByRole("button", { name: "Research conversation", exact: true });
  const library = page.getByRole("complementary", { name: "Research library", exact: true });
  const skills = page.getByRole("complementary", { name: "Skills", exact: true });
  const connections = page.getByRole("complementary", { name: "Connections", exact: true });
  const appearance = (drawer) => drawer.evaluate(el => {
    const style = getComputedStyle(el);
    return {
      left: style.left, top: style.top, bottom: style.bottom, width: style.width,
      background: style.backgroundColor, border: style.border, radius: style.borderRadius,
      animation: style.animationName, duration: style.animationName === "none" ? null : style.animationDuration,
    };
  });

  await libraryButton.click();
  await expect(library).toBeVisible();
  const standard = await appearance(library);
  assert.equal(standard.animation, "rl-arrive");
  await skillsButton.click();
  await expect(library).toBeHidden();
  await expect(skills).toBeVisible();
  await expect(skillsButton).toHaveAttribute("aria-expanded", "true");
  assert.deepEqual(await appearance(skills), standard);
  await expect(page.locator(".aegis-work-stage .shell")).toHaveAttribute("data-panel", "skills");
  const search = skills.getByRole("searchbox");
  await search.fill("unrelated");
  await expect(skills.getByRole("button", { name: /Deep Search/ })).toHaveCount(0);
  await search.fill("deep");
  await skills.getByRole("button", { name: /Deep Search/ }).click();
  await expect(skills.getByText("Check sources")).toBeVisible();
  await skills.getByRole("button", { name: "Close skills" }).click();
  await expect(skills).toBeHidden();
  await expect(skillsButton).toBeFocused();

  await skillsButton.click();
  await connectionsButton.click();
  await expect(skills).toBeHidden();
  await expect(connections).toBeVisible();
  assert.deepEqual(await appearance(connections), standard);
  await expect(connections.getByRole("checkbox", { name: "Search provider enabled" })).toBeChecked();
  await expect(connections.getByRole("combobox", { name: "Mode" })).toBeEnabled();
  await connections.getByRole("combobox", { name: "Mode" }).press("Escape");
  await expect(connections).toBeHidden();
  await expect(connectionsButton).toBeFocused();
  await connectionsButton.click();
  await conversationButton.click();
  await expect(connections).toBeHidden();
  await expect(page.getByRole("complementary", { name: "Research conversation" })).toBeVisible();

  const windowSize = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const original = { bounds: win.getBounds(), maximized: win.isMaximized(), minimum: win.getMinimumSize() };
    win.unmaximize();
    win.setMinimumSize(0, 0);
    win.setContentSize(620, 680);
    return original;
  });
  try {
    await expect.poll(() => page.evaluate(() => innerWidth)).toBeLessThanOrEqual(760);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await libraryButton.click();
    const narrow = await appearance(library);
    assert.equal(narrow.left, "56px");
    assert.equal(narrow.animation, "none");
    await connectionsButton.click();
    assert.deepEqual(await appearance(connections), narrow);
    await connections.getByRole("button", { name: "Close connections" }).click();
  } finally {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await app.evaluate(({ BrowserWindow }, original) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setMinimumSize(...original.minimum);
      win.setBounds(original.bounds);
      if (original.maximized) win.maximize();
    }, windowSize);
  }
  assert.deepEqual(calls, []);
  console.log("PASS Research Library, Skills and Connections drawer motion, layout, content and keyboard focus");
}

async function checkNewTabSearch(page, browser, settings, artifacts, app) {
  const field = browser.locator(".newtab").getByRole("combobox", { name: "Address or search" });
  const engine = browser.getByRole("button", { name: "Search engine and shortcuts", exact: true });
  const newTab = browser.locator(".new-row");
  await expect(field).toBeVisible();
  await field.fill("https://example.com/idle-focus-fixture");
  await field.press("Enter");
  const focusFixture = () => app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find(item => item.getTitle() === "AEGIS");
    const view = win.contentView.children.find(child => child.webContents?.getURL().endsWith("/idle-focus-fixture"));
    if (!view?.getVisible()) return false;
    view.webContents.focus();
    return view.webContents.isFocused();
  });
  await expect.poll(focusFixture).toBe(true);
  const fixtureId = await page.evaluate(() => window.__aegisBrowserTabs.active);

  await newTab.click();
  await expect(field).toBeFocused();
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find(item => item.getTitle() === "AEGIS");
    return win.webContents.isFocused() && win.contentView.children
      .filter(child => child.webContents?.getURL().endsWith("/idle-focus-fixture"))
      .every(child => !child.getVisible());
  })).toBe(true);
  const idleMs = Number(process.env.AEGIS_NEW_TAB_IDLE_MS) || 4300;
  console.log("Checking New Tab after " + idleMs + " ms idle");
  await page.waitForTimeout(idleMs);
  await browser.locator(".newtab").click({ position: { x: 100, y: 190 } });
  await expect(field).not.toBeFocused();
  await engine.click();
  await expect(page.getByRole("menuitemcheckbox", { name: "Google", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await field.click();
  await page.keyboard.type("lunar landing");
  await expect(field).toHaveValue("lunar landing");
  await expect(page.getByRole("option", { name: /Lunar landing history/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Recent Search/ })).toBeVisible();
  await field.press("ArrowDown");
  await expect(page.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-browser-results.png") });
  await engine.click();
  await page.getByRole("menuitemcheckbox", { name: "Bing", exact: true }).click();
  await expect(field).toHaveValue("lunar landing");

  await engine.click();
  await page.getByRole("menuitem", { name: "Shortcuts", exact: true }).hover();
  await expect(page.getByRole("menuitem", { name: /YouTube/ })).toBeVisible();
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-new-tab-shortcuts.png") });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await engine.click();
  await page.getByRole("menuitem", { name: /Edit Shortcuts/ }).click();
  await expect(settings).toBeVisible();
  const keyword = settings.getByRole("textbox", { name: "Keyword, YouTube" });
  await keyword.fill("yt ytvideo");
  await keyword.press("Enter");
  await expect.poll(() => page.evaluate(() => {
    const stored = localStorage.getItem("aegis-browser-search-shortcuts-v1");
    return stored ? JSON.parse(JSON.parse(stored)).find(row => row.id === "youtube")?.keywords : null;
  })).toEqual(["yt", "ytvideo"]);
  await page.keyboard.press("Escape");

  await field.fill("!ytvideo lunar landing");
  await field.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__aegisBrowserTabs.current?.url)).toBe("https://www.youtube.com/results?search_query=lunar%20landing");
  await expect.poll(() => page.evaluate(() => window.__aegisBrowserTabs.engine.id)).toBe("bing");
  await browser.getByRole("button", { name: "Close Idle focus fixture", exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__aegisBrowserTabs.tabs.some(tab => tab.id === id), fixtureId)).toBe(false);

  // Closing the last regular tab keeps Browse usable and supplies a focused New Tab.
  await expect(browser.locator(".rows .tab-close")).toHaveCount(1);
  await browser.getByRole("button", { name: "Close Shortcut fixture", exact: true }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("");
  await page.keyboard.press("Control+Shift+T");
  await expect.poll(() => page.evaluate(() => window.__aegisBrowserTabs.current?.url)).toBe("https://www.youtube.com/results?search_query=lunar%20landing");
  await browser.getByRole("button", { name: "Close Shortcut fixture", exact: true }).click();
  await expect(field).toBeFocused();
  await browser.getByRole("button", { name: "Browser profile", exact: true }).click();
  const profile = page.getByRole("menu", { name: "Profile", exact: true });
  await expect(profile).toBeVisible();
  await expect(profile.getByRole("meter", { name: "Daily research tokens used" })).toHaveAttribute("aria-valuenow", "45");
  await expect(profile).not.toContainText("45%");
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-browser-profile.png") });
  await page.keyboard.press("Escape");
  await browser.getByRole("button", { name: "Browser settings", exact: true }).click();
  await expect(settings.getByRole("heading", { name: "New Tab", exact: true })).toBeVisible();
  await settings.getByRole("button", { name: "API keys", exact: true }).click();
  const gemini = settings.locator('[data-setting="keys.GEMINI_API_KEY"]');
  await gemini.getByRole("button", { name: "Add key" }).click();
  const secret = gemini.locator('input[type="password"]');
  await expect(secret).toHaveValue("");
  await secret.fill("local-test-value");
  await gemini.getByRole("button", { name: "Save", exact: true }).click();
  await expect(gemini.getByText("Set", { exact: true })).toBeVisible();
  await expect(secret).toHaveCount(0);
  await settings.getByRole("button", { name: "Voice and sound", exact: true }).click();
  await settings.getByRole("button", { name: "Honorific" }).click();
  await settings.getByRole("menuitemcheckbox", { name: "Ma’am" }).click();
  await settings.getByRole("button", { name: "Save preferences" }).click();
  await expect.poll(() => preferences.honorific).toBe("ma'am");
  await page.keyboard.press("Escape");
  console.log("PASS delayed new-tab search, engine choice, editable shortcuts, launch, close, reopen and corner controls");
}

function quietClip() {
  const samples = 4000;
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(buf.length - 8, 4);
  buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(8000, 24); buf.writeUInt32LE(16000, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) buf.writeInt16LE(Math.round(200 * Math.sin(i / 10)), 44 + i * 2);
  return buf.toString("base64");
}

async function checkBrowserNativeMedia(app, browser) {
  const read = (start = false) => app.evaluate(async ({ BrowserWindow }, start) => {
    const win = BrowserWindow.getAllWindows().find((item) => item.getTitle() === "AEGIS");
    const web = win.contentView.children.find(view => view.webContents.getURL().includes("/settings-fixture"))?.webContents;
    if (!web) return null;
    if (start) await web.executeJavaScript("document.querySelector('audio').play()", true);
    return {
      muted: web.isAudioMuted(),
      paused: await web.executeJavaScript("document.querySelector('audio').paused"),
    };
  }, start);
  await read(true);
  const media = browser.getByRole("region", { name: "Browser media" });
  await expect(media.getByRole("button", { name: "Pause media" })).toBeVisible();
  await media.getByRole("button", { name: "Mute tab", exact: true }).click();
  await expect.poll(read).toEqual({ muted: true, paused: false });
  await media.getByRole("button", { name: "Pause media", exact: true }).click();
  await expect.poll(read).toEqual({ muted: true, paused: true });
  await media.getByRole("button", { name: "Play media", exact: true }).click();
  await expect.poll(read).toEqual({ muted: true, paused: false });
  await media.getByRole("button", { name: "Pause media", exact: true }).click();
  await expect.poll(read).toEqual({ muted: true, paused: true });
}

async function checkCaptionMotion(page, browser, app) {
  const buttons = browser.locator(".corner");
  const initial = await buttons.boundingBox();
  assert(initial, "Profile and Settings are present before revealing the caption");
  const mockPointer = value => app.evaluate(({ screen, BrowserWindow }, value) => {
    globalThis.originalCursorReader ??= screen.getCursorScreenPoint;
    if (!value) {
      screen.getCursorScreenPoint = globalThis.originalCursorReader;
      return;
    }
    const win = BrowserWindow.getAllWindows().find((item) => item.getTitle() === "AEGIS");
    const box = win.getContentBounds();
    win.focus();
    screen.getCursorScreenPoint = () => ({ x: box.x + box.width - value.x, y: box.y + value.y });
  }, value);
  await mockPointer({ x: 300, y: 300 });
  const caption = () => app.evaluate(() => globalThis.aegisDesktopDiagnostics().caption);
  try {
    await expect.poll(async () => (await caption()).level).toBe(0);
    await mockPointer({ x: 25, y: 4 });
    await expect.poll(async () => (await caption()).level).toBe(1);
    assert.deepEqual(await buttons.boundingBox(), initial);
    await mockPointer({ x: 400, y: 300 });
    await expect.poll(async () => (await caption()).level).toBe(0);
    assert.deepEqual(await buttons.boundingBox(), initial);
  } finally { await mockPointer(null); }
}

async function checkBrowserSurfaces(page, app) {
  const libraryButton = page.getByRole("button", { name: "Research library", exact: true });
  const timeline = page.getByRole("complementary", { name: "Research library", exact: true });
  const browser = page.locator(".browser.shown");
  const settings = page.getByRole("dialog", { name: "AEGIS Settings" });
  const artifacts = process.env.AEGIS_UI_TEST_ARTIFACTS;
  const toolbar = page.getByRole("navigation", { name: "AEGIS", exact: true });
  await libraryButton.click();
  await expect(timeline).toBeVisible();
  await toolbar.getByRole("button", { name: "Browser", exact: true }).click();
  await expect(browser.getByRole("tablist", { name: "Browser tabs" })).toBeVisible();
  await expect(timeline).toBeHidden();
  await browser.getByRole("radio", { name: "Work", exact: true }).click();
  await expect(timeline).toBeVisible();

  await page.getByRole("button", { name: "Close library", exact: true }).click();
  await toolbar.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(settings).toBeVisible();
  await expect(browser.getByRole("tablist", { name: "Browser tabs" })).toBeHidden();
  await settings.getByRole("button", { name: "Appearance", exact: true }).click();
  const light = settings.getByRole("radio", { name: "Light", exact: true });
  const lightPreview = light.locator(".scene");
  const darkPreview = settings.getByRole("radio", { name: "Dark", exact: true }).locator(".scene");
  const toneColor = (preview) => preview.evaluate((el) => getComputedStyle(el).getPropertyValue("--seed-bg").trim());
  assert.notEqual(await toneColor(lightPreview), await toneColor(darkPreview));
  await light.click();
  await expect(light).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-appearance-mode", "light");
  await light.press("ArrowRight");
  await expect(settings.getByRole("radio", { name: "Dark", exact: true })).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-appearance-mode", "dark");
  await settings.getByRole("button", { name: "Use theme mode" }).click();
  await settings.getByRole("combobox", { name: "Theme", exact: true }).selectOption("paper");
  await expect(page.locator("html")).toHaveAttribute("data-theme-id", "paper");
  await settings.getByRole("combobox", { name: "Theme", exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-id", "dark");
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-appearance.png") });
  await settings.getByRole("combobox", { name: "Page zoom", exact: true }).selectOption("125");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("aegis-browser-settings-v1")).pageZoom)).toBe(125);
  await settings.getByRole("button", { name: "New Tab", exact: true }).click();
  await expect(settings.getByRole("switch", { name: "Show the time and date" })).toBeVisible();
  await settings.getByRole("button", { name: /Local test profile/ }).click();
  await expect(settings.getByText("Desktop window", { exact: true })).toBeVisible();
  await expect(settings.getByText("No paired devices.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();

  await app.evaluate(({ session }, clip) => {
    session.fromPartition("persist:aegis-user").protocol.handle("https", (request) => {
      const url = new URL(request.url);
      const content = url.hostname === "www.youtube.com" ? "<title>Shortcut fixture</title><main>Shortcut destination</main>"
        : url.pathname === "/idle-focus-fixture" ? "<title>Idle focus fixture</title><main>Keyboard focus fixture</main>"
        : "<title>AEGIS Browser Test</title><main>Browser fixture</main><audio loop src=\"data:audio/wav;base64," + clip + "\"></audio>";
      return new Response(content, { headers: { "Content-Type": "text/html" } });
    });
  }, quietClip());
  await toolbar.getByRole("button", { name: "Browser", exact: true }).click();
  const dragRegion = await page.locator(".canvas-top-gap").evaluate(element =>
    getComputedStyle(element).getPropertyValue("-webkit-app-region")
  );
  assert.notEqual(dragRegion, "drag", "The covered Work canvas cannot own New Tab clicks");
  await checkCaptionMotion(page, browser, app);
  await checkNewTabSearch(page, browser, settings, artifacts, app);
  const address = browser.locator("input").filter({ visible: true }).first();
  await address.fill("https://example.com/settings-fixture");
  await address.press("Enter");
  const nativeTabs = () => app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows().find((item) => item.getTitle() === "AEGIS");
    return window.contentView.children
      .filter((view) => view.webContents.getURL().includes("/settings-fixture"))
      .map((view) => ({ visible: view.getVisible(), zoom: view.webContents.getZoomFactor() }));
  });
  await expect.poll(nativeTabs).toEqual([{ visible: true, zoom: 1.25 }]);
  await checkBrowserNativeMedia(app, browser);
  const liveTab = browser.locator(".rows .tab-open").filter({ hasText: "AEGIS Browser Test" });
  await liveTab.hover();
  await page.mouse.down();
  const to = await browser.locator("[data-kept-drop]").boundingBox();
  assert(to, "Kept-site drop target is available");
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 16 });
  await page.mouse.up();
  await expect(browser.getByRole("button", { name: "Open kept tab AEGIS Browser Test" })).toBeVisible();
  await browser.getByRole("button", { name: "Browser tools", exact: true }).click();
  const shelf = browser.getByRole("menu", { name: "Browser tools" });
  await expect(shelf.getByRole("menuitem", { name: /Bookmarks/ })).toBeVisible();
  await expect.poll(nativeTabs).toEqual([{ visible: true, zoom: 1.25 }]);
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-browser-shelf.png"), animations: "disabled" });
  await shelf.getByRole("menuitem", { name: /Bookmarks/ }).click();
  await expect(browser.getByRole("heading", { name: "Bookmarks", exact: true })).toBeVisible();
  await browser.getByRole("region", { name: "Bookmarks", exact: true }).getByRole("button", { name: "Open AEGIS Browser Test", exact: true }).click();
  await expect.poll(nativeTabs).toEqual([{ visible: true, zoom: 1.25 }]);
  await page.evaluate(() => document.getElementById("btn-settings").click());
  await expect(settings).toBeVisible();
  await expect.poll(nativeTabs).toEqual([{ visible: false, zoom: 1.25 }]);
  await settings.getByRole("button", { name: /Local test profile/ }).click();
  await expect(settings.getByRole("button", { name: "Reopen AEGIS Browser Test" })).toBeVisible();
  await settings.getByRole("button", { name: "Close settings" }).click();
  await expect.poll(nativeTabs).toEqual([{ visible: true, zoom: 1.25 }]);

  await browser.getByRole("radio", { name: "Work", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("nova-open-dashboard")));
  await expect(page.locator("#app-brand")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Workspaces" }).getByRole("button", { name: "Memory", exact: true })).toBeVisible();
  await expect(page.locator("#widget-launcher-bottom").getByRole("button", { name: "Theme", exact: true })).toBeVisible();
  await expect(page.locator("#widget-launcher-bottom").getByRole("button", { name: /memory/i })).toHaveCount(0);
  await page.locator("#widget-launcher-rail").getByRole("button", { name: "Notes", exact: true }).click();
  const preview = page.getByRole("complementary", { name: "Notes panel" });
  await preview.getByText(note.title, { exact: true }).click();
  await preview.locator("button.tool-overflow").click();
  await page.getByRole("menuitem", { name: "Full mode", exact: true }).click();
  await expect(browser.getByRole("complementary", { name: "Browser sidebar" })).toBeVisible();
  await expect(browser.getByText("Fixture note.", { exact: true })).toBeVisible();
  await expect(preview).toBeHidden();
  if (artifacts) await page.screenshot({ path: path.join(artifacts, "aegis-notes-full.png") });
  await browser.getByRole("button", { name: "Close Notes" }).click();
  await expect(browser).toBeHidden();
  await expect(page.locator("#widget-launcher-rail")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id: "chat-fixture" } })));
  await expect(libraryButton).toBeVisible();
  await page.evaluate(() => {
    const tabs = window.__aegisBrowserTabs;
    const fixture = tabs.tabs.find(tab => tab.url.endsWith("/settings-fixture"));
    if (fixture) tabs.close(fixture.id);
  });
  console.log("PASS full-window Settings, native page zoom, profile history, Research isolation and Notes handoff");
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-browser-assist-"));
  fs.writeFileSync(path.join(profile, "desktop.json"), JSON.stringify({ uiUrl: url, autoStart: false, stopOnExit: false }));
  const app = await electron.launch({
    args: [path.join(frontend, "desktop/main.cjs")],
    cwd: frontend,
    env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile },
  });
  try {
    const page = await app.firstWindow();
    page.setDefaultTimeout(8000);
    page.on("pageerror", (error) => console.error("AEGIS renderer:", error.message));
    await page.waitForURL(url);
    let voice;
    await page.routeWebSocket("**/ws/voice", route => {
      voice = route;
      route.send(JSON.stringify({ type: "status", client_id: "fixture-client" }));
      route.onMessage(raw => {
        const request = JSON.parse(raw);
        if (request.type === "workspace_voice_acquire") route.send(JSON.stringify({ type: "workspace_voice_result", granted: false }));
        if (request.type === "ui_context") {
          route.send(JSON.stringify({
            type: "research_focus_ack",
            research_id: request.snapshot.research_id,
            selection_revision: request.snapshot.selection_revision,
          }));
        }
        if (request.type === "live_text") {
          calls.push(["chat", request]);
          route.send(JSON.stringify({ type: "live_text_accepted", request_id: request.request_id }));
          route.send(JSON.stringify({
            type: "live_generation_complete", research_id: report.research_id,
            request_id: request.request_id, turn_id: request.request_id,
            input_text: request.text, output_text: "Here is a response from the chat fixture. [S1]\n\n- First finding\n- Second finding\n\n```js\nconst answer = 42;\n```",
          }));
        }
      });
    });
    await page.evaluate(() => {
      sessionStorage.setItem("nova-current-workspace", "research");
      sessionStorage.setItem("nova-selected-research", "chat-fixture");
      localStorage.setItem("aegis-browser-history-v1", JSON.stringify([
        { url: "https://github.com/aegis-lunar", title: "Lunar landing history", count: 3, at: Date.now() },
        { url: "https://www.google.com/search?q=lunar+landing+history", title: "lunar landing history search - Google Search", count: 2, at: Date.now() },
      ]));
    });
    await page.goto(url + "?fixture=1#research=chat-fixture");
    await page.getByRole("button",{name:"Research library",exact:true}).waitFor();
    await expect(page.locator(".canvas-top .title")).toContainText(report.display_title, { timeout: 12000 });
    await checkLibraryDrawers(page, app);
    await checkBrowserSurfaces(page, app);
    await app.evaluate(({ session, dialog }) => {
      const browser = session.fromPartition("persist:aegis-browser");
      browser.protocol.handle("https", req => new Response(
        `<title>Fixture article</title><main><h1>Fixture article</h1><p>Visible research text.</p><form><textarea>Private draft text</textarea></form><a href="/follow-up">Read the follow-up</a><div style="height:2500px"></div></main>`,
        { headers: { "Content-Type": "text/html" } },
      ));
      globalThis.assistDecisions = [];
      globalThis.assistPrompts = [];
      dialog.showMessageBox = async (_window, options) => {
        globalThis.assistPrompts.push(options.title);
        return { response: globalThis.assistDecisions.shift() ?? 0 };
      };
    });
    await page.evaluate(() => window.aegisDesktop.invoke("browser_open", {
      id: 9001, url: "https://example.com/fixture", rect: { x: 12, y: 160, width: 300, height: 300 },
    }));
    const nativePage = (script) => app.evaluate(({ BrowserWindow }, source) => {
      const view = BrowserWindow.getAllWindows()[0].contentView.children.find(each => each.webContents.getURL().includes("example.com"));
      return view?.webContents.executeJavaScript(source);
    }, script);
    await expect.poll(() => nativePage("document.title")).toBe("Fixture article");
    await page.getByRole("button", { name: /conversation/i }).first().click();
    const ask = page.getByRole("complementary", { name: "Research conversation" });
    await expect(ask.getByRole("heading", { name: "Aegis AI" })).toBeVisible();
    await expect(ask.getByRole("textbox")).toHaveCount(0);
    const field = page.locator(".aegis-work-stage .bar-dock textarea");
    await expect(field).toBeVisible();
    const panel = await ask.boundingBox();
    assert.ok(panel.height > (await page.viewportSize())?.height * 0.9 || panel.height > 600);
    if (process.env.AEGIS_ASK_SCREENSHOT_DIR) {
      await ask.screenshot({ path: path.join(process.env.AEGIS_ASK_SCREENSHOT_DIR, "research-v30-panel.png") });
      await ask.getByRole("button", { name: "Conversation actions" }).click();
      await expect(ask.getByRole("menuitem", { name: "History" })).toBeVisible();
      await ask.screenshot({ path: path.join(process.env.AEGIS_ASK_SCREENSHOT_DIR, "research-v30-menu.png") });
      await ask.getByRole("menuitem", { name: "History" }).press("Escape");

    }
    await page.getByRole("button", { name: "Conversation actions" }).click();
    await page.getByRole("menuitem", { name: "Browser context", exact: true }).click();
    const attach = page.getByRole("button", { name: "Attach live tab" });
    await expect(attach).toBeEnabled();
    await attach.click();
    await expect(page.getByText("Tab reading cancelled.")).toBeVisible();
    assert.equal(calls.length, 0);
    await app.evaluate(() => globalThis.assistDecisions.push(1));
    await attach.click();
    await expect(page.getByText("Live tab attached. Review the attachment before sending.")).toBeVisible();
    assert.match(calls[0][1].text, /Visible research text/);
    assert.doesNotMatch(calls[0][1].text, /Private draft text/);
    await page.getByRole("button", { name: "Scroll down", exact: true }).click();
    await expect(page.getByText("Browser action declined.")).toBeVisible();
    assert.equal(await nativePage("window.scrollY"), 0);
    await app.evaluate(() => globalThis.assistDecisions.push(1));
    await page.getByRole("button", { name: "Scroll down", exact: true }).click();
    await expect.poll(() => nativePage("window.scrollY")).toBeGreaterThan(0);
    const scrollPosition = await nativePage("window.scrollY");
    const context = { id: "live-card", ...calls[0][1] };
    voice.send(JSON.stringify({
      type: "live_generation_complete", research_id: report.research_id, turn_id: "browser-fixture",
      input_text: "Scroll back up", output_text: 'I can scroll back up.\n```aegis-browser-action\n{"action":"scroll_up"}\n```',
      context_cards: [context],
    }));
    await expect(page.getByText("Review AI browser action", { exact: true })).toBeVisible();
    assert.equal(await nativePage("window.scrollY"), scrollPosition);
    await app.evaluate(() => globalThis.assistDecisions.push(1));
    await page.getByRole("button", { name: "Review AI browser action" }).click();
    await expect.poll(() => nativePage("window.scrollY")).toBe(0);
    await expect(page.getByRole("button", { name: "Review AI browser action" })).toHaveCount(0);
    await page.getByRole("button", { name: "Conversation actions" }).click();
    await expect(page.getByRole("menuitem", { name: "History" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Models" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Page styles of this site" }).click();
    await page.getByRole("button", { name: "Readable spacing" }).click();
    await expect.poll(() => nativePage("getComputedStyle(document.querySelector('p')).lineHeight")).toBe("27.2px");
    await page.getByRole("button", { name: "Reset style" }).click();
    await expect.poll(() => nativePage("getComputedStyle(document.querySelector('p')).lineHeight")).toBe("normal");
    await page.getByRole("button", { name: "Conversation actions" }).click();
    await page.getByRole("menuitem", { name: "Browser context", exact: true }).click();
    await page.getByRole("button", { name: "Take over tab" }).click();
    await expect(page.getByText("The source tab has keyboard focus.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Scroll down", exact: true })).toHaveCount(0);
    await field.fill("Explain the saved findings");
    await expect(page.locator(".aegis-work-stage .bar-dock button[type=submit]")).toBeEnabled();
    await field.press("Shift+Enter");
    await expect(field).toHaveValue("Explain the saved findings\n");
    assert.equal(calls.filter(([kind]) => kind === "chat").length, 0);
    await field.press("Enter");
    await expect.poll(() => calls.find(([kind]) => kind === "chat")?.[1]?.text).toBe("Explain the saved findings");
    await expect(ask.getByText("Here is a response from the chat fixture.", {exact: false})).toBeVisible();
    await expect(ask.getByRole("listitem").filter({hasText:"First finding"})).toBeVisible();
    await expect(ask.locator("pre code.language-js")).toHaveText("const answer = 42;");
    await expect(ask.getByRole("button", {name:"S1", exact:true})).toBeVisible();
    await expect(field).toHaveValue("");

    const thread = ask.getByRole("log");
    const emit = (index) => voice.send(JSON.stringify({
      type: "live_generation_complete", research_id: report.research_id, turn_id: "history-" + index,
      input_text: "Saved question " + index, output_text: "Saved answer " + index + " " + "Evidence from the report. ".repeat(12),
    }));
    for (let index = 0; index < 41; index++) emit(index);
    await expect(thread.getByText("Saved question 40", {exact:true})).toBeVisible();
    await expect.poll(() => thread.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(32);
    await thread.evaluate(el => { el.scrollTop = 90; el.dispatchEvent(new Event("scroll")); });
    await expect(ask.getByRole("button", {name:"Jump to latest message"})).toBeVisible();
    emit(41);
    await expect(thread.getByText("Saved question 41", {exact:true})).toBeAttached();
    await expect.poll(() => thread.evaluate(el => el.scrollTop)).toBe(90);
    await ask.getByRole("button", {name:"Conversation actions"}).click();
    await ask.getByRole("menuitem", {name:"History", exact:true}).click();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await page.getByRole("button", {name:/conversation/i}).first().click();
    await expect.poll(() => thread.evaluate(el => el.scrollTop)).toBe(90);
    await ask.getByRole("button", {name:"Jump to latest message"}).click();
    await expect.poll(() => thread.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(32);


    await page.getByRole("button", { name: "Conversation actions" }).click();
    await page.getByRole("menuitem", { name: "Continue in Work", exact: true }).click();
    await page.getByRole("textbox", { name: "Work request" }).fill("Compare the evidence in Work");
    await page.getByRole("button", { name: "Start Work run" }).click();
    await expect.poll(() => calls.find(([kind]) => kind === "handoff")?.[1]?.from_research).toBe(report.research_id);
    assert.equal(calls.find(([kind]) => kind === "handoff")[1].query, "Compare the evidence in Work");
    console.log("PASS installed Research UI: consent, live text, approval, scroll, styles, takeover, Work handoff");
  } finally {
    await app.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
