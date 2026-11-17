// V7 checks in the running app, on a saved Work run (no model spend; the proxy test and Source Reader
// make a few real page requests). Layout (User Prompt → AI PLAN → Sources under it), strings, Skills,
// Connections, the proxy (needs the local test proxies on 18080/18081), and the source browser.
// Usage: node tests/work-v7.e2e.cjs "<library search>" <output folder> [proxy log path]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [search, out = "work-v7-shots", proxyLog = ""] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};
const shot = (page, name) => page.screenshot({ path: path.join(out, name + ".png") });

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => { try { sessionStorage.setItem("nova-current-workspace", "research"); } catch {} });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  let client = "";
  page.on("request", (r) => (client = r.headers()["x-nova-client"] || client));
  const api = (url, method = "GET", body) =>
    page.evaluate(async ({ url, method, body, client }) => {
      const r = await fetch(url, { method, headers: { "X-Nova-Client": client, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      return { status: r.status, body: await r.json().catch(() => null) };
    }, { url, method, body, client });

  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(4500);
  await shot(page, "1-canvas");

  // Layout: User Prompt, then a tall AI PLAN, the one Sources collection under it, sources to the right.
  const boxes = await page.$$eval(".svelte-flow__node", (rows) =>
    Object.fromEntries(rows.map((n) => { const r = n.getBoundingClientRect(); return [n.dataset.id, { x: r.x, y: r.y, w: r.width, h: r.height }]; })),
  );
  const ids = Object.keys(boxes);
  const plan = boxes["plan:ai"];
  const request = ids.find((id) => /-request$/.test(id) && !id.startsWith("steps:") && !id.startsWith("part:"));
  const sources = ids.find((id) => id.endsWith(":search"));
  // Source pages: the stacks of windows (a "couldn't open" list belongs to the Sources collection).
  const stacks = await page.$$eval(".svelte-flow__node", (rows) => rows.filter((n) => n.querySelector(".part .stack")).map((n) => n.dataset.id));
  check("A01 AI PLAN card is drawn right of the User Prompt", plan && request && plan.x > boxes[request].x + boxes[request].w, `${request}`);
  check("A01 AI PLAN is tall", plan && plan.h > boxes[request].h * 1.5, plan && `${Math.round(plan.h)} vs ${Math.round(boxes[request].h)}`);
  check("V8-3 Sources stands directly under the AI PLAN", plan && sources && Math.abs(boxes[sources].x - plan.x) < 4 && boxes[sources].y > plan.y + plan.h, sources);
  const all = Object.entries(boxes).filter(([id]) => !id.startsWith("agent"));
  const overlapping = all.flatMap(([a, A], i) => all.slice(i + 1).filter(([, B]) => A.x < B.x + B.w - 2 && A.x + A.w - 2 > B.x && A.y < B.y + B.h - 2 && A.y + A.h - 2 > B.y).map(([b]) => a.slice(-16) + "×" + b.slice(-16)));
  check("V8-18 Cards never overlap", overlapping.length === 0, overlapping.join(" "));
  check("One canonical Sources collection (no second gallery)", !ids.some((id) => id.startsWith("sources:")));
  check("Source pages stand right of the plan column", stacks.length > 0 && stacks.every((id) => boxes[id].x > plan.x + plan.w), `${stacks.length} stacks`);
  const planText = await page.locator('.svelte-flow__node[data-id="plan:ai"]').innerText();
check("V8-4 One planning and activity card: AI PLAN holds the objective, agents and the activity timeline", /AI PLAN/i.test(planText) && /Research objective/i.test(planText) && /Assigned agents/i.test(planText) && /Research activity/i.test(planText) && /Run complete/i.test(planText), planText.replace(/\s+/g, " ").slice(0, 160));
  check("V8-4 No second timeline or plan card", !ids.some((id) => id.startsWith("steps:")) && (await page.locator('article[aria-label="AI PLAN"]').count()) === 1);
  const pipeline = boxes["pipeline:evidence"], compile = boxes["compile:results"];
  const paperId = ids.find((id) => id.startsWith("paper:"));
  const mainBottom = Math.max(...ids.filter((id) => id.startsWith("worker:") && boxes[id].x > plan.x + plan.w || stacks.includes(id)).map((id) => boxes[id].y + boxes[id].h));
  check("V8-10 Evidence pipeline is a separate lower track under the main track, level with Sources", pipeline && pipeline.y >= mainBottom && Math.abs(pipeline.y - boxes[sources].y) < 4 && pipeline.x > plan.x + plan.w, pipeline && `${Math.round(pipeline.y)} vs ${Math.round(mainBottom)}`);
  const pipeText = pipeline ? await page.locator('.svelte-flow__node[data-id="pipeline:evidence"]').innerText() : "";
  check("The pipeline shows the run's real stages and numbers", /Source processing/.test(pipeText) && /Citation builder/.test(pipeText) && /\d+ of \d+ sources cited/.test(pipeText), pipeText.replace(/\s+/g, " ").slice(0, 200));
  check("V8-12/13 Collect all results stands before the report, which is far right", compile && paperId && compile.x + compile.w < boxes[paperId].x && ids.every((id) => id === paperId || boxes[id].x < boxes[paperId].x));
  const links = await page.$$eval("g.strand", (gs) => gs.map((g) => g.dataset.source + ">" + g.dataset.target));
  check("Both tracks converge: pipeline → results → report", links.includes("pipeline:evidence>compile:results") && links.some((l) => l.startsWith("compile:results>paper:")) && links.some((l) => l.endsWith(">pipeline:evidence")));
  check("Source tasks branch from the AI PLAN", stacks.every((id) => links.includes("plan:ai>" + id)));

  // Strings: attached to real cards; none drawn through a card it does not join.
  const crossing = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".svelte-flow__node")].map((n) => ({ id: n.dataset.id, r: n.getBoundingClientRect() }));
    let bad = [];
    for (const g of document.querySelectorAll("g.strand:not(.dormant)")) {
      const p = g.querySelector("path.strand-line");
      const m = p.getScreenCTM();
      const len = p.getTotalLength();
      for (let l = len * 0.06; l < len * 0.94; l += Math.max(6, len / 120)) {
        const q = p.getPointAtLength(l);
        const x = q.x * m.a + q.y * m.c + m.e, y = q.x * m.b + q.y * m.d + m.f;
        const hit = cards.find((c) => c.id !== g.dataset.source && c.id !== g.dataset.target && x > c.r.x + 4 && x < c.r.right - 4 && y > c.r.y + 4 && y < c.r.bottom - 4);
        if (hit) { bad.push(`${g.dataset.source.slice(-18)}→${g.dataset.target.slice(-18)} through ${hit.id.slice(-18)}`); break; }
      }
    }
    return { bad, total: document.querySelectorAll("g.strand:not(.dormant)").length };
  });
  check("A08 No visible string is drawn through a card it does not join", crossing.bad.length === 0, `${crossing.bad.length} of ${crossing.total}: ${crossing.bad.slice(0, 3).join("; ")}`);
  const planStrings = await page.$$eval('g.strand[data-target="plan:ai"]', (gs) => gs.length);
  check("The request is joined to the AI PLAN by its planning relation", planStrings >= 1);

  // A10: clicking and dragging the canvas keeps the zoom.
  const zoomOf = () => page.evaluate(() => document.querySelector(".svelte-flow__viewport")?.style.transform.match(/scale\(([\d.]+)\)/)?.[1]);
  const before = await zoomOf();
  const pane = await page.locator(".canvas-card").boundingBox();
  // Only on empty canvas: a press on a card would move that card and save it as the person's.
  const empty = await page.evaluate(({ x, y, w, h }) => {
    for (let fy = 0.75; fy > 0.15; fy -= 0.05)
      for (let fx = 0.3; fx < 0.9; fx += 0.05) {
        const el = document.elementFromPoint(x + w * fx, y + h * fy);
        if (el?.classList.contains("svelte-flow__pane")) return { x: x + w * fx, y: y + h * fy };
      }
    return null;
  }, { x: pane.x, y: pane.y, w: pane.width, h: pane.height });
  await page.mouse.move(empty.x, empty.y);
  await page.mouse.down();
  await page.mouse.move(empty.x - 40, empty.y - 30, { steps: 5 });
  await page.mouse.up();
  await page.mouse.click(empty.x - 40, empty.y - 30);
  await page.waitForTimeout(500);
  check("A10 Click and drag keep the zoom", (await zoomOf()) === before, `${before} → ${await zoomOf()}`);

  // Skills.
  await page.click('button[aria-label="Skills"]');
  await page.waitForSelector('section[aria-label="Skills"] li', { timeout: 10000 });
  const skillCount = await page.locator('section[aria-label="Skills"] li').count();
  check("A14 Skills panel lists the skill library", skillCount >= 20, `${skillCount} skills`);
  await shot(page, "2-skills");
  await page.locator('section[aria-label="Skills"] .item', { hasText: "Deep research" }).first().click();
  await page.waitForSelector('section[aria-label="Skills"] pre', { timeout: 10000 });
  const body = await page.locator('section[aria-label="Skills"] pre').innerText();
  check("A skill's instructions can be read, with its origin", /# Deep research/.test(body) && /Zephium/.test(await page.locator('section[aria-label="Skills"] .meta').first().innerText()));
  await shot(page, "3-skill-detail");

  // Connections.
  await page.click('button[aria-label="Connections"]');
  await page.waitForSelector('section[aria-label="Connections"] li', { timeout: 10000 });
  const connections = await page.locator('section[aria-label="Connections"]').innerText();
  check("A15 Connections show real status, never a key", /Tavily/.test(connections) && /Connected|Not set up/.test(connections) && !/tvly-|nvapi-|gsk_|AIza/.test(connections));
  check("Unavailable connections say why instead of offering a dead button", /MCP servers/.test(connections) && /Unavailable/.test(connections));
  await shot(page, "4-connections");

  // A19: a manual proxy reports what really happened.
  const pickProxy = async (mode, port) => {
    await page.selectOption('section[aria-label="Connections"] select', mode);
    await page.fill('section[aria-label="Connections"] input[placeholder="127.0.0.1"]', "127.0.0.1");
    await page.fill('section[aria-label="Connections"] input[placeholder="1080"]', String(port));
    await page.click('section[aria-label="Connections"] button[type="submit"]');
    await page.waitForTimeout(600);
    await page.click('section[aria-label="Connections"] button:has-text("Test connection")');
    await page.waitForSelector('section[aria-label="Connections"] .result', { timeout: 40000 });
    await page.waitForTimeout(400);
    return page.locator('section[aria-label="Connections"] .result').innerText();
  };
  const dead = await pickProxy("socks5", 9);
  check("A19 A proxy that does not answer is reported as not working", /Not working/.test(dead), dead);
  if (proxyLog) {
    const before = fs.existsSync(proxyLog) ? fs.readFileSync(proxyLog, "utf8") : "";
    const httpResult = await pickProxy("http", 18080);
    check("A19 HTTP proxy works, and the request really went through it", /Working/.test(httpResult) && /http www\.gstatic\.com:443/.test(fs.readFileSync(proxyLog, "utf8").slice(before.length)), httpResult);
    const mid = fs.readFileSync(proxyLog, "utf8");
    const socksResult = await pickProxy("socks5", 18081);
    check("A19 SOCKS5 proxy works, and the request really went through it", /Working/.test(socksResult) && /socks5 www\.gstatic\.com:443/.test(fs.readFileSync(proxyLog, "utf8").slice(mid.length)), socksResult);
    await shot(page, "5-proxy");
    // The Source Reader goes through the active proxy too.
    const mark = fs.readFileSync(proxyLog, "utf8").length;
    const viaProxy = await api("/api/work/reader?url=" + encodeURIComponent("https://github.com/zephium-browser/Zephium"));
    check("The Source Reader uses the configured proxy", viaProxy.body?.via_proxy === true && /socks5 github\.com:443/.test(fs.readFileSync(proxyLog, "utf8").slice(mark)), JSON.stringify(viaProxy.body).slice(0, 120));
  }
  await page.selectOption('section[aria-label="Connections"] select', "off");
  await page.click('section[aria-label="Connections"] button[type="submit"]');
  await page.waitForTimeout(500);
  check("The proxy can be turned off", (await api("/api/work/network")).body?.proxy?.mode === "off");
  const secretFree = await api("/api/work/network");
  check("Proxy settings never return the password", !("password" in (secretFree.body?.proxy ?? {})));
  await page.click('section[aria-label="Connections"] button[aria-label="Close connections"]');

  // Source browser: one that allows framing, one that refuses it.
  const openSource = (url, title) => require("./source-browser-control.cjs").openSourceFromControl(page, url, title);
  await openSource("https://en.wikipedia.org/wiki/Offshore_wind_power", "Offshore wind power");
  await page.waitForSelector('[data-mode="iframe-live"], [data-mode="source-reader"]', { timeout: 30000 });
  await page.waitForTimeout(5000);
  const liveMode = await page.locator('[data-mode="iframe-live"]').count();
  check("A16 An allowed site opens live in the in-workspace browser", liveMode === 1);
  check("No default Open in browser button in the browser pane", (await page.locator("text=Open in browser").count()) === 0);
  await shot(page, "6-browser-live");
  await page.locator('.hint button:has-text("Source Reader")').first().click();
  await page.waitForSelector("iframe.reader-page", { timeout: 30000 });
  check("The person can switch an open page to the Source Reader", (await page.locator('.reader-bar:has-text("not the live site")').count()) === 1);
  await page.locator('.reader-bar button:has-text("Live page")').click();

  await openSource("https://github.com/zephium-browser/Zephium", "Zephium on GitHub");
  await page.waitForSelector('[data-mode="source-reader"]', { timeout: 30000 });
  await page.waitForSelector("iframe.reader-page", { timeout: 30000 });
  const readerBar = await page.locator('[data-mode="source-reader"]').last().innerText();
  check("A17 A site that refuses framing opens in the Source Reader, labelled as not the live site", /not the live site/.test(readerBar), readerBar);
  const readerText = await page.frameLocator("iframe.reader-page").last().locator("body").innerText();
  check("The Source Reader shows the page's own text", readerText.length > 200, readerText.slice(0, 80));
  const sandbox = await page.locator("iframe.reader-page").last().getAttribute("sandbox");
  check("A20 The reader frame cannot run scripts", sandbox !== null && !/allow-scripts/.test(sandbox), sandbox);
  await shot(page, "7-browser-reader");
  check("A23 Two windows are open together", (await page.locator("iframe.reader-page, [data-mode='iframe-live']").count()) >= 2);
  check("Browser windows leave the zoom alone", (await zoomOf()) === before);

  check("No page errors", !errors.length, errors.join(" | "));
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed.`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
