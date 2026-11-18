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
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    let result = {};
    if (pathname.endsWith("/document")) result = report;
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
    } else if (pathname === "/api/research") result = { reports: [], total: 0 };
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
    });
    await page.goto(url + "?fixture=1#research=chat-fixture");
    await page.getByRole("button",{name:"Research library",exact:true}).waitFor();
    await page.locator(".aegis-work-stage .shell").waitFor();
    await checkLibraryDrawers(page, app);
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
