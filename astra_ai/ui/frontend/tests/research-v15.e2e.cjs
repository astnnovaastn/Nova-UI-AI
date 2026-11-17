// Run against the real Electron app and disposable fixture responses; no saved research is changed.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { _electron: electron, chromium } = require("@playwright/test");

const frontend = path.resolve(__dirname, "..");
const output = process.argv[2];
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v15-"));
const fixture = (id, count) => ({
  id, title: "Preview checks · " + id, count,
  sources: Array.from({ length: count }, (_, index) => ({
    id: "S" + (index + 1), title: ["Offshore wind power", "Wind turbine", "Wind farm"][index] ?? "Source page " + (index + 1),
    url: "https://en.wikipedia.org/wiki/" + (["Offshore_wind_power", "Wind_turbine", "Wind_farm"][index] ?? "Wind_power#" + (index + 1)),
    content: "Saved evidence from a public source.",
    retrieved_at: "2026-11-15T08:00:00Z",
  })),
});
const items = [fixture("one", 1), fixture("two", 2), fixture("three", 3), fixture("four", 4), fixture("ten", 10), fixture("twenty", 21)];
const pricing = { name: "pricing-research", title: "Pricing Research", description: "Compare current official prices.", chosen: "workflow", workflow: "pricing-research", status: "loaded", tools: ["web_search"] };
const architecture = { name: "system-design", title: "System Design", description: "Explain the system components and their dependencies.", category: "developer", chosen: "matched", status: "loaded" };
const mapping = { name: "map-a-project", title: "Map a Project", description: "Map project components and their relationships.", category: "developer", chosen: "matched", status: "loaded" };

async function until(test, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise((done) => setTimeout(done, 150));
  }
  return false;
}

async function fixtures(page, thumbnail) {
  await page.route(/\/api\/(?:research|work\/runs)(?:\/|\?|$)/, async (route) => {
    const { pathname } = new URL(route.request().url());
    const respond = (data) => route.fulfill({ json: data });
    const match = /^\/api\/(?:research|work\/runs)\/fixture-([a-z]+)(\/.*)?$/.exec(pathname);
    if (pathname === "/api/research" && route.request().method() === "GET") {
      return respond({ status: "ok", total: items.length, removed: [], items: items.map(({ id, title }) => ({
        research_id: "fixture-" + id, display_title: title, history_title: title, query: title, results: [],
        completeness: "complete", phase: "complete", retrieved_at: "2026-11-15T08:00:00Z",
      })) });
    }
    if (!match) return route.continue();
    const run = items.find((item) => item.id === match[1]);
    if (!run) return route.continue();
    const id = "fixture-" + run.id;
    const kind = match[2] || "";
    if (kind === "/document" || !kind && !pathname.includes("/work/")) {
      return respond({ status: "ok", research_id: id, research_revision: "fixture-rev", kind: "research", query: run.title,
        display_title: run.title, phase: "complete", completeness: "complete", mode: "detailed",
        report: "# Source preview checks\n\nA source remains independently selectable [S1].", sources: run.sources,
      });
    }
    if (kind === "/trace") {
      const skills = run.id === "three" ? [pricing] : run.id === "two" ? [mapping, architecture] : run.id === "ten" ? [mapping, architecture, pricing] : [];
      return respond({ status: "ok", research_id: id, events: skills.map((skill_fact, index) => ({
        kind: "skill", skill_fact, seq: index + 1, at: 0,
      })), work_sources: [] });
    }
    if (kind === "/source-previews") {
      return respond({ status: "ok", previews: run.sources.map(({ url }, index) => ({
        url, id: String(index), status: thumbnail && index === 0 ? "ready" : "unavailable", captured_at: 1794744000,
      })) });
    }
    if (kind === "/source-previews/0" && thumbnail) {
      return route.fulfill({ status: 200, contentType: "image/png", body: thumbnail });
    }
    if (pathname.includes("/work/") && !kind) return respond({ status: "ok", run: null, view: { chosen: [], hidden: [] } });
    if (kind === "/layout") return respond({ status: "ok", layout: {
      schema_version: 1, revision: 0, strategy: "research", automatic: false, operation_id: "",
      positions: {}, sizes: {}, groups: [], constraints: {}, previous: null,
    } });
    return respond({ status: "ok", items: [], pages: [], messages: [], events: [], sources: [] });
  });
}

async function select(page, name) {
  const side = page.locator("#research-history-panel");
  if (!(await side.isVisible())) await page.getByRole("button", { name: "Research library", exact: true }).click();
  const row = side.locator(".rh-row").filter({ hasText: "Preview checks · " + name }).first();
  const control = row.locator('button').first();
  if (await control.count()) await control.press("Enter");
  else await row.click();
  await page.waitForFunction((title) => document.querySelector(".canvas-top .title")?.textContent?.includes(title), "Preview checks · " + name);
  if (await side.isVisible()) await page.keyboard.press("Escape");
  await page.locator(".svelte-flow__node").first().waitFor({ state: "attached", timeout: 30000 });
}

const camera = (page) => page.locator(".svelte-flow__viewport").first().getAttribute("style");

async function main() {
  const capture = spawnSync(process.execPath, ["source-preview-capture.cjs"], { cwd: frontend,
    input: JSON.stringify({ url: items[0].sources[0].url }) + "\n", encoding: "utf8", timeout: 30000 });
  const encoded = JSON.parse(capture.stdout?.trim() || "{}").png;
  const thumbnail = encoded ? Buffer.from(encoded, "base64") : null;
  if (output) fs.mkdirSync(output, { recursive: true });
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000,
    env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  try {
    const page = await app.firstWindow();
    page.setDefaultTimeout(15000);
    await page.waitForURL("http://127.0.0.1:5173/**", { timeout: 120000 });
    page.on("pageerror", (error) => console.error("Workspace error:", error.stack));
    await fixtures(page, thumbnail);
    await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
    await page.addInitScript(() => {
      window.routingSamples = [];
      window.addEventListener('aegis-routing-measured', event => window.routingSamples.push(event.detail));
    });
    await page.reload();
    await page.locator(".aegis-work-stage").waitFor({ timeout: 30000 });
    const paneCount = () => app.evaluate(() => globalThis.aegisDesktopDiagnostics().panes.length);
    const sample = () => app.evaluate(({ app, webContents }) => {
      const metrics = app.getAppMetrics();
      return { views: webContents.getAllWebContents().length, rendererProcesses: metrics.filter((entry) => entry.type === "Tab").length,
        workingSetKiB: metrics.reduce((size, entry) => size + entry.memory.workingSetSize, 0),
        cpuPercent: Number(metrics.reduce((cpu, entry) => cpu + entry.cpu.percentCPUUsage, 0).toFixed(2)) };
    });
    const photo = async (name) => { if (output) await page.screenshot({ path: path.join(output, name + ".png") }); };
    await select(page, "one");
    if (thumbnail) await page.locator(".website-thumb").first().waitFor();
    assert.equal(await paneCount(), 0);
    assert.equal(await page.locator(".stack-toggle").count(), 0);
    console.log("PASS single page, genuine capture available:", Boolean(thumbnail));

    await select(page, "two");
    assert.equal(await page.locator('.skill-marks .skill').count(), 2);
    await photo("6-two-loaded-skills");
    // Readable artwork capture at the actual canvas size, using the real zoom/pan controls.
    await page.locator('.skill-marks .skill').first().focus();
    await page.keyboard.press('1');await page.waitForTimeout(450);
    const marks=await page.locator('.skill-marks').boundingBox();
    const area=await page.locator('.aegis-work-stage').boundingBox();
    await page.mouse.move(area.x+area.width/2,area.y+area.height-140);
    await page.mouse.wheel(marks.x-220,marks.y-220);await page.waitForTimeout(350);
    await photo('6-skills-actual-size');
    await page.getByRole('button',{name:/Fit/}).first().click();await page.waitForTimeout(450);
    await page.getByRole("button", {name:/Show all 2 pages/}).hover();
    await page.locator('.source-stack-fan .page').nth(1).waitFor();
    await page.mouse.move(5, 5);
    await page.locator('.source-stack-fan').waitFor({state:'hidden'});
    await select(page, "four");
    assert.equal(await page.locator('.skill-marks .skill').count(), 0);
    await page.getByRole("button", {name:/Show all 4 pages/}).hover();
    await page.locator('.source-stack-fan .page').nth(3).waitFor();
    await page.mouse.move(5, 5);
    await page.locator('.source-stack-fan').waitFor({state:'hidden'});

    await select(page, "three");
    const three = page.getByRole("button", { name: /Show all 3 pages/ });
    await three.waitFor();
    const prior = await camera(page);
    await three.hover();
    const fan = page.locator(".source-stack-fan");
    await fan.waitFor();
    assert.equal(await fan.locator("button.page").count(), 3);
    await fan.locator("button.page").nth(1).hover();
    assert.equal(await paneCount(), 0);
    assert.equal(await camera(page), prior);
    const lead = await fan.locator('button.page').first().boundingBox();
    const positions = await fan.locator('button.page').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().x));
    assert(lead && positions[1] !== positions[0], 'pages must actually fan from their common origin');
    await photo("5-source-stack-expanded");
    await fan.locator("button.page").nth(1).click();
    assert(await until(async () => (await paneCount()) === 1));
    const url = await app.evaluate(() => globalThis.aegisDesktopDiagnostics().panes[0].url);
    assert.match(url, /Wind_turbine/);
    try { await select(page, "one"); }
    catch (error) {
      await photo("switch-diagnostic");
      console.error("Switch state:", await page.locator(".canvas-top .title").textContent().catch(() => ""), await paneCount());
      throw error;
    }
    assert(await until(async () => (await paneCount()) === 0));
    await select(page, "three");
    assert.equal(await paneCount(), 0);
    console.log("PASS hover, second source, switch away and reopen without restoring panes");

    const pricingBadge = page.locator('[data-skill-id="pricing-research"]');
    await pricingBadge.click();
    assert.match(await page.getByRole("dialog", { name: "Pricing Research" }).innerText(), /Compare current official prices/);
    await photo("6-loaded-skill");
    await page.keyboard.press("Escape");

    await select(page, "ten");
    const ten = page.getByRole("button", { name: /Show all 10 pages/ });
    await ten.focus();
    await page.keyboard.press("Enter");
    await fan.waitFor();
    assert.equal(await fan.locator("button.page").count(), 10);
    const sizes = await fan.evaluate((element) => [element.scrollWidth, element.clientWidth]);
    assert(sizes[0] > sizes[1]);
    await page.keyboard.press("Escape");
    await fan.waitFor({ state: "hidden" });
    assert.equal(await page.locator('[data-skill-id="system-design"]').count(), 1);
    assert.equal(await page.locator('.skill-marks .skill').count(), 3);
    await photo("6-three-loaded-skills");
    assert.equal(await paneCount(), 0);
    // Place the stack near the right boundary through a real canvas pan.
    const anchorBox = await ten.boundingBox();
    const canvasBox = await page.locator('.aegis-work-stage').boundingBox();
    await page.mouse.move(canvasBox.x+canvasBox.width/2,canvasBox.y+canvasBox.height-130);
    await page.mouse.wheel(anchorBox.x-(canvasBox.x+canvasBox.width-240),0);
    await page.waitForTimeout(400);
    await ten.hover();await fan.waitFor();await page.waitForTimeout(320);
    assert.match(await fan.getAttribute('class'),/reverse/);
    const reversePages=await fan.locator('button.page').evaluateAll(elements=>elements.slice(0,2).map(e=>({x:e.getBoundingClientRect().x,text:e.textContent})));
    assert(reversePages[1].x<reversePages[0].x,'stack near the right edge must slide left');
    assert(reversePages[0].text.includes('Source page 10'),'lead page must retain its identity');
    await photo('5-source-stack-reversed');
    await page.keyboard.press('Escape');await fan.waitFor({state:'hidden'});

    await select(page, "twenty");
    const twenty = page.getByRole("button", { name: /Show all 21 pages/ });
    await twenty.waitFor();
    const idle = await sample();
    await twenty.hover();
    await fan.waitFor();
    assert.equal(await fan.locator("button.page").count(), 21);
    await page.waitForTimeout(400);
    const spread = await sample();
    assert.equal(await paneCount(), 0);
    assert.equal(idle.views, spread.views);
    assert.equal(idle.rendererProcesses, spread.rendererProcesses);
    await fan.locator("button.page").first().click();
    assert(await until(async () => (await paneCount()) === 1));
    const opened = await sample();
    await page.locator('.pane button[aria-label="Close pane"]').first().click();
    assert(await until(async () => (await paneCount()) === 0));
    const closed = await sample();
    console.log(JSON.stringify({ idle, spread, opened, closed }));
    if(output)fs.writeFileSync(path.join(output,'resources.json'),JSON.stringify({idle,spread,opened,closed},null,2));
    // Camera gestures must only transform existing geometry, not start another routing pass.
    await page.waitForTimeout(800);
    const routingBefore = await page.evaluate(() => window.routingSamples.length);
    const viewportBefore = await camera(page);
    await page.evaluate(() => {
      window.gestureFrames=[];window.gestureLongTasks=[];window.gestureActive=true;
      let last=performance.now();
      const frame = now => {window.gestureFrames.push(now-last);last=now;if(window.gestureActive)requestAnimationFrame(frame);};
      requestAnimationFrame(frame);
      window.gestureObserver=new PerformanceObserver(list=>window.gestureLongTasks.push(...list.getEntries().map(e=>e.duration)));
      window.gestureObserver.observe({type:'longtask',buffered:false});
    });
    const stage = await page.locator('.svelte-flow__pane').first().boundingBox();
    await page.mouse.move(stage.x+stage.width/2,stage.y+stage.height/2);
    for(let i=0;i<12;i++){await page.mouse.wheel(i<6?24:-24, i<6?16:-16);await page.waitForTimeout(30);}
    await page.keyboard.down('Control');await page.mouse.wheel(0,-60);await page.keyboard.up('Control');
    await page.waitForTimeout(400);
    const performanceResult = await page.evaluate(() => {
      window.gestureActive=false;window.gestureObserver.disconnect();
      const frames=window.gestureFrames.slice(1).sort((a,b)=>a-b);
      return {frames:frames.length,frameP95:frames[Math.floor(frames.length*.95)],longTasks:window.gestureLongTasks,routingAfter:window.routingSamples.length,routing:window.routingSamples.at(-1)};
    });
    assert.equal(performanceResult.routingAfter,routingBefore,'pan/zoom must not reroute');
    assert.notEqual(await camera(page),viewportBefore,'camera gesture must actually change viewport');
    console.log('PASS camera routing isolation',JSON.stringify(performanceResult));
    if(output)fs.writeFileSync(path.join(output,'gestures.json'),JSON.stringify(performanceResult,null,2));
  } finally {
    await app.close();
  }

  const browser = await chromium.launch({ channel: "msedge" });
  try {
    const touch = await browser.newContext({ hasTouch: true, viewport: { width: 880, height: 700 }, reducedMotion: "reduce" });
    await touch.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
    const page = await touch.newPage();
    await fixtures(page, null);
    await page.goto("http://127.0.0.1:5173/");
    await select(page, "three");
    const toggle = page.getByRole("button", { name: /Show all 3 pages/ });
    await toggle.tap();
    const fan = page.locator(".source-stack-fan");
    await fan.waitFor();
    assert.equal(await page.locator(".browser-layer .pane").count(), 0);
    assert.equal(await fan.locator("button.page").nth(1).evaluate((element) => getComputedStyle(element).animationName), "none");
    await fan.locator("button.page").nth(1).tap();
    await page.locator(".browser-layer .pane").waitFor();
    console.log("PASS touch, reduced motion, narrow viewport and unavailable previews");
  } finally {
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
