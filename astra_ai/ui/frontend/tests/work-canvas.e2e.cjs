// End-to-end checks of AEGIS Work against the real running app.
// Usage: node tests/work-canvas.e2e.cjs <output folder> [--live "subject"] [--open "saved run title"]
// --live starts one real structured run from the Knowledge Map card, which spends search and model quota.
const path = require("path");
const fs = require("fs");
const { chromium } = require("@playwright/test");

const out = process.argv[2] || "work-canvas-shots";
const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : "");
const live = flag("--live");
const savedRun = flag("--open");
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 200) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 200) + ")" : ""}`);
};
const until = async (test, timeout = 10000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return !!(await test());
};
const CARDS = {
  Developer: ["Explain code", "Map a project", "Review a change", "Fix a failing test"],
  Designer: ["UI teardown", "Moodboard"],
  Marketing: ["Competitor landscape", "Campaign plan"],
  Manager: ["Plan my day", "Weekly status"],
  Student: ["Learning path", "Exam prep"],
  Office: ["Inbox triage", "Meeting prep"],
  Founder: ["Market map", "Pricing research", "Investor list"],
  Research: ["Quick Research", "Deep Research", "Structured Research & Knowledge Map"],
};

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  const secrets = [];
  let client = "";
  let runId = "";
  page.on("request", (r) => {
    client = r.headers()["x-nova-client"] || client;
    runId = r.url().match(/\/api\/work\/runs\/([0-9a-f]{32})/)?.[1] || runId;
  });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  page.on("crash", () => errors.push("PAGE CRASHED"));
  page.on("response", async (r) => {
    if (!/\/api\/(work|settings\/work)/.test(r.url())) return;
    try {
      const body = await r.text();
      if (/gsk_[A-Za-z0-9]{8}|AIza[0-9A-Za-z_-]{8}|sk-[A-Za-z0-9]{12}|api_key/i.test(body)) secrets.push(r.url());
    } catch {}
  });
  const shot = (name) => page.screenshot({ path: path.join(out, name + ".png") });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector(".bar-dock textarea")?.disabled, null, { timeout: 30000 }).catch(() => {});

  const start = page.locator(".aegis-work-stage .start");
  if (await start.count()) {
    check("Start screen keeps its heading", /What should we get done\?/.test(await page.locator("#work-start-title").innerText()));
    const textarea = page.locator(".bar-dock textarea");
    for (const [tab, cards] of Object.entries(CARDS)) {
      await page.locator(".aegis-work-stage .roles").getByRole("radio", { name: tab, exact: true }).or(page.locator(".aegis-work-stage .roles").getByRole("tab", { name: tab, exact: true })).or(page.locator(".aegis-work-stage .roles").getByRole("button", { name: tab, exact: true })).first().click();
      await page.waitForTimeout(150);
      const titles = await page.locator(".aegis-work-stage .flow .title").allInnerTexts();
      check(`${tab}: its cards`, JSON.stringify(titles) === JSON.stringify(cards), titles.join(", "));
      for (const card of cards) {
        await page.locator(".aegis-work-stage .flow").filter({ hasText: card }).first().click();
        const typed = await textarea.inputValue();
        const hint = await page.locator(".aegis-work-stage footer .ask").innerText().catch(() => "");
        check(`${tab} / ${card}: fills the composer and asks for its input`, typed.trim().length > 3 && hint.length > 3, typed.trim().slice(0, 50));
      }
      if (tab === "Research") await shot("01-research-tab");
      await textarea.fill("");
    }
    check("Research tab stands next to Founder", (await page.locator(".aegis-work-stage .roles").innerText()).replace(/\s+/g, " ").includes("Founder Research"));
    check("Research cards have distinct artwork", (await page.locator(".aegis-work-stage .flow svg").evaluateAll((rows) => new Set(rows.map((row) => row.innerHTML)).size)) === 3);
  } else {
    check("Start screen is showing", false, "A report was already open");
  }

  /** Pairs of cards whose boxes cross. A map group holds its own cards, and markers float over the lanes. */
  const overlaps = () =>
    page.locator(".svelte-flow__node").evaluateAll((nodes) => {
      const boxes = nodes
        .filter((node) => !node.classList.contains("svelte-flow__node-agent") && !(node.dataset.id || "").startsWith("mapgroup:") && node.getBoundingClientRect().width > 0)
        .map((node) => ({ id: node.dataset.id, rect: node.getBoundingClientRect() }));
      const hits = [];
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) {
          const p = boxes[a].rect, q = boxes[b].rect;
          if (p.left < q.right - 1 && q.left < p.right - 1 && p.top < q.bottom - 1 && q.top < p.bottom - 1) hits.push(boxes[a].id + " / " + boxes[b].id);
        }
      return hits;
    });

  if (live) {
    await page.locator(".aegis-work-stage .roles").getByText("Research", { exact: true }).click();
    await page.locator(".aegis-work-stage .flow").filter({ hasText: "Knowledge Map" }).click();
    const textarea = page.locator(".bar-dock textarea");
    await textarea.fill((await textarea.inputValue()) + live);
    await textarea.press("Enter");
    const started = Date.now();
    await page.waitForSelector(".svelte-flow__node", { timeout: 60000 });
    check("The request appears on the canvas at once", true, `${Date.now() - started} ms`);
    let snaps = 0;
    const seen = new Set();
    const liveOverlaps = new Set();
    const done = await until(async () => {
      for (const state of await page.locator("article[data-agent]").evaluateAll((rows) => rows.map((row) => row.dataset.agent + ":" + row.dataset.state))) seen.add(state);
      for (const hit of await overlaps()) liveOverlaps.add(hit);
      const elapsed = Date.now() - started;
      if (snaps < 4 && elapsed > 6000 * (snaps + 1)) {
        await shot(`02-live-${snaps}`);
        snaps++;
      }
      return (await page.locator("[data-paper]").count()) > 0;
    }, 15 * 60000);
    check("A real structured run finishes with a paper on the canvas", done, `${Math.round((Date.now() - started) / 1000)} s`);
    check("The camera steps back when the run finishes", await until(async () => /^(50|[5-9][0-9])%/.test((await page.locator(".zoom-slot").innerText().catch(() => "")).trim()), 5000), await page.locator(".zoom-slot").innerText().catch(() => ""));
    console.log("agent states seen:", [...seen].join(" "));
    check("Workers were seen working live", [...seen].some((row) => row.endsWith(":running")), [...seen].join(" "));
    check("No two cards overlapped at any point while it ran", liveOverlaps.size === 0, [...liveOverlaps].slice(0, 3).join(" | "));
    await page.waitForTimeout(3500);
    await shot("03-finished");
  } else if (savedRun) {
    await page.click('.aegis-work-stage button[aria-label="Research library"]');
    await page.locator('#research-history-panel input[type="search"]').fill(savedRun);
    await page.locator("#research-history-panel .rh-row").filter({ hasText: savedRun }).first().click({ timeout: 15000 });
    await page.waitForSelector(".svelte-flow__node", { timeout: 30000 });
    if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
    await page.waitForTimeout(3500);
  }

  if (live || savedRun) {
    // An earlier test run may have left choices on this run: start from a clean view.
    await until(() => runId, 8000);
    await page.evaluate(async ({ runId, client }) => {
      await fetch(`/api/work/runs/${runId}/view`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Nova-Client": client }, body: JSON.stringify({ chosen: [], hidden: [] }) });
    }, { runId, client });
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
    await page.waitForTimeout(3500);
    await shot("04-graph");
    const agents = await page.locator("article[data-agent]").count();
    check("Agent branches are drawn", agents >= 2, `${agents} agents`);
    const maps = await page.locator(".blueprint").count();
    console.log("map cards:", maps);
    const overlap = await overlaps();
    check("No two cards overlap", overlap.length === 0, overlap.slice(0, 3).join(" | "));

    // The four node actions, on the request card.
    const request = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_a]") }).first();
    await request.hover();
    const bar = page.locator('[role="toolbar"][aria-label="Discovery"]');
    check("Hovering a card shows its toolbar", await until(() => bar.isVisible(), 3000));
    const words = (await bar.innerText()).replace(/\s+/g, " ");
    check("The toolbar offers Open, Ask, Choose and Remove", ["Open", "Ask", "Choose", "Remove"].every((word) => words.includes(word)), words);
    await shot("05-toolbar");

    await bar.getByRole("button", { name: "Open" }).click();
    const lift = page.locator(".lift-layer");
    check("Open shows the agent's own record", await until(() => lift.getByText("Assigned", { exact: true }).isVisible(), 4000));
    await shot("06-agent-open");
    await page.keyboard.press("Escape");
    await until(async () => !(await lift.count()), 3000);

    // Only the selected card's toolbar shows, so the visible one is the request's.
    await page.locator(".svelte-flow__pane").click({ position: { x: 700, y: 20 } });
    await page.waitForTimeout(500);
    await page.mouse.move(700, 30);
    const reqNode = page.locator('.svelte-flow__node[data-id$="-request"]:not([data-id^="steps"]):not([data-id^="sources"]):not([data-id^="part"])').first();
    await reqNode.click({ position: { x: 20, y: 10 } });
    const reqBar = page.locator('[role="toolbar"]:visible', { hasText: "Remove" }).first();
    await until(() => reqBar.isVisible(), 3000);
    await reqBar.getByRole("button", { name: "Open" }).click();
    check("Open on the request shows What it did", await until(() => lift.getByText("What it did").isVisible(), 4000));
    check("It shows Step by step activity", await lift.getByText("Step by step", { exact: true }).isVisible());
    await shot("07-request-open");
    await lift.getByText("Step by step", { exact: true }).click();
    await page.waitForTimeout(300);
    await shot("08-request-steps");
    await page.keyboard.press("Escape");
    await until(async () => !(await lift.count()), 3000);

    // Choose: visible, and still there after a reload.
    await page.locator(".svelte-flow__pane").click({ position: { x: 700, y: 20 } });
    await page.waitForTimeout(400);
    await request.hover();
    await until(() => bar.isVisible(), 3000);
    await bar.getByRole("button", { name: "Choose" }).click();
    check("Choose marks the card", await until(() => request.locator(".decision").isVisible(), 4000));
    check("Choose shows in the composer's row", await until(() => page.locator(".context-row").isVisible(), 2000));
    await shot("09-chosen");
    await page.waitForTimeout(2500);

    // Remove: asks first, then hides only this card.
    const id = await request.getAttribute("data-id");
    await request.hover();
    await until(() => bar.isVisible(), 3000);
    await bar.getByRole("button", { name: "Remove" }).click();
    const dialog = page.locator(".confirm");
    check("Remove asks first and says research stays saved", await until(() => dialog.isVisible(), 2000) && /stay saved/.test(await dialog.innerText()));
    await shot("10-remove-confirm");
    await dialog.getByRole("button", { name: "Keep" }).click();
    check("Keep leaves the card", (await page.locator(`.svelte-flow__node[data-id="${id}"]`).count()) === 1);
    await request.hover();
    await until(() => bar.isVisible(), 3000);
    await bar.getByRole("button", { name: "Remove" }).click();
    await dialog.getByRole("button", { name: "Remove from canvas" }).click();
    check("Remove takes the card off the canvas", await until(async () => (await page.locator(`.svelte-flow__node[data-id="${id}"]`).count()) === 0, 4000));
    await page.waitForTimeout(2500);

    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
    await page.waitForTimeout(3500);
    check("Removal lasts after a reload", (await page.locator(`.svelte-flow__node[data-id="${id}"]`).count()) === 0);
    check("The saved report is still there after a removal", (await page.locator("[data-paper]").count()) > 0);
    await page.locator('.bar-dock button[aria-label="Report views"]').click();
    await page.getByRole("button", { name: /Show 1 removed card/ }).click();
    check("A removed card can be brought back", await until(async () => (await page.locator(`.svelte-flow__node[data-id="${id}"]`).count()) === 1, 4000));
    check("Removing a chosen card also un-chooses it", !(await page.locator(".context-row").count()));
    const panToCard = async (card) => {
      const box = await card.boundingBox();
      if (!box || box.x > 240) return;
      await page.mouse.move(800, 40);
      await page.mouse.down();
      await page.mouse.move(800 + (300 - box.x), 40, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(400);
    };
    const chooseAgain = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_a]") }).first();
    await panToCard(chooseAgain);
    await chooseAgain.hover();
    await until(() => bar.isVisible(), 3000);
    await bar.getByRole("button", { name: "Choose" }).click();
    await until(() => page.locator(".context-row").isVisible(), 3000);
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
    check("Choose lasts after a reload", await until(() => page.locator(".context-row").isVisible(), 10000));
    await page.locator(".context-row").getByRole("button", { name: "Clear" }).click();
    await until(async () => !(await page.locator(".context-row").count()), 2000);

    // Ask: names the card, and the reply arrives in the conversation.
    const again = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_a]") }).first();
    await panToCard(again);
    await again.hover();
    await until(() => bar.isVisible(), 3000);
    await bar.getByRole("button", { name: "Ask" }).click();
    check("Ask names the card in the composer", await until(() => page.locator(".context-chip").filter({ hasText: "Asking about" }).isVisible(), 2000));
    check("Ask moves the focus to the composer", await page.locator(".bar-dock textarea").evaluate((el) => el === document.activeElement));
    await page.locator(".bar-dock textarea").fill("In one sentence, what did this worker do?");
    await shot("11-ask");
    await page.locator(".bar-dock textarea").press("Enter");
    const panel = page.locator("[data-canvas-panel=conversation]").first();
    const replied = await until(async () => /In one sentence, what did this worker do\?/.test(await page.locator('article[data-speaker="user"]').last().innerText().catch(() => "")), 8000);
    check("Ask sends the question to the conversation", replied);
    check("The conversation panel is open", (await panel.count()) > 0);
    const conversation = page.locator("article[data-speaker]");
    const answered = await until(async () => (await page.locator('article[data-speaker]:not([data-speaker="user"])').count()) > 0 && !/^\s*$/.test(await conversation.last().innerText()), 45000);
    check("AEGIS replies to the question in the conversation", answered, (await conversation.last().innerText().catch(() => "")).slice(0, 120));
    check("The question bubble names the card without its details", /About Discovery/.test(await page.locator('article[data-speaker="user"]').last().innerText()) && !/canvas node/.test(await page.locator('article[data-speaker="user"]').last().innerText()));
    await shot("12-ask-reply");
    if (await page.locator(".research-canvas-close").count()) await page.locator(".research-canvas-close").first().click().catch(() => {});

    // A source lane opens its real page in a window; a paper opens the existing Reader.
    if (await page.locator('.research-conversation-close, [aria-label="Close conversation"]').count()) await page.locator('.research-conversation-close, [aria-label="Close conversation"]').first().click().catch(() => {});
    const lane = page.locator('.svelte-flow__node[data-id^="part:"]').nth(1);
    await panToCard(lane);
    await lane.locator(".svelte-flow__node-toolbar").count();
    await lane.hover();
    const laneBar = page.locator('[role="toolbar"]', { has: page.getByRole("button", { name: "Remove" }) }).first();
    if (await until(() => laneBar.isVisible(), 3000)) {
      await laneBar.getByRole("button", { name: "Open" }).click();
      check("Open on a source lane opens a source window", await until(() => page.locator(".browser-layer .pane").isVisible(), 6000));
      await page.waitForTimeout(1500);
      await shot("13-source-window");
      await page.locator('.browser-layer .pane button[aria-label*="Close"]').first().click().catch(() => {});
    } else check("A source lane has the toolbar", false);
    await page.waitForTimeout(400);

    // Keyboard: the same orders from a focused card, and a selected group.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const focused = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_c]") }).first();
    await focused.focus();
    await page.keyboard.press("o");
    check("O opens the focused card", await until(() => lift.getByText("Assigned", { exact: true }).isVisible(), 4000));
    await page.keyboard.press("Escape");
    await until(async () => !(await lift.count()), 3000);
    await focused.focus();
    await page.keyboard.press("Delete");
    check("Delete asks before removing the focused card", await until(() => dialog.isVisible(), 2000));
    await page.keyboard.press("Escape").catch(() => {});
    await dialog.getByRole("button", { name: "Keep" }).click().catch(() => {});
    await focused.focus();
    await page.keyboard.press("c");
    check("C chooses the focused card", await until(() => focused.locator(".decision").isVisible(), 4000));
    await page.keyboard.press("c");
    await until(async () => !(await focused.locator(".decision").count()), 3000);

    // A group: selecting two cards offers Ask, Choose and Remove together.
    await page.locator(".svelte-flow__pane").click({ position: { x: 700, y: 20 } });
    const first = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_b]") }).first();
    const second = page.locator(".svelte-flow__node", { has: page.locator("article[data-agent=worker_c]") }).first();
    await first.click({ position: { x: 40, y: 20 } });
    await second.click({ position: { x: 40, y: 20 }, modifiers: ["Shift"] });
    const groupBar = page.locator(".selection-bar");
    check("Selecting two cards shows the group bar", await until(() => groupBar.isVisible(), 3000));
    if (await groupBar.isVisible()) {
      await shot("14-group");
      await groupBar.getByRole("button", { name: "Choose" }).click();
      check("Choose works on a group", await until(async () => /2 chosen/.test(await page.locator(".context-row").innerText().catch(() => "")), 4000));
      await page.locator(".context-row").getByRole("button", { name: "Clear" }).click();
    }

    // The saved report is untouched: the paper opens the existing Reader, Edit, Sources and Media.
    await page.locator(".svelte-flow__pane").click({ position: { x: 700, y: 20 } });
    const expand = page.locator("[data-paper] .expand");
    if (await expand.isVisible()) {
      await expand.click();
      check("Expand opens the existing Reader", await until(async () => (await page.locator(".research-canvas-close").count()) > 0, 6000));
      await page.waitForTimeout(600);
      await shot("15-reader");
      await page.locator(".research-canvas-close").first().click().catch(() => {});
    }
  }

  check("No uncaught page errors", errors.length === 0, errors.join(" | "));
  check("No secret reached the page from the Work routes", secrets.length === 0, secrets.join(" "));
  const failed = results.filter((row) => !row.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed.`);
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
