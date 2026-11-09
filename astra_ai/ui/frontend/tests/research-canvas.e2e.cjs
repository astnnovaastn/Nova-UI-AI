// End-to-end checks of the Research canvas against the real running AEGIS app.
// Usage: node tests/research-canvas.e2e.cjs <output folder> ["saved report title"] [--live "prompt"]
// --live starts one real research run, which uses search and writing quota.
const path = require("path");
const fs = require("fs");
const { chromium } = require("@playwright/test");

const out = process.argv[2] || "research-canvas-shots";
const reportName = process.argv[3] || "Heat Pumps";
const liveAt = process.argv.indexOf("--live");
const livePrompt = liveAt > 0 ? process.argv[liveAt + 1] : "";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 180) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 180) + ")" : ""}`);
};

async function openApp(browser, viewport, init) {
  const context = await browser.newContext({ viewport, permissions: [] });
  await context.addInitScript(init || (() => sessionStorage.setItem("nova-current-workspace", "research")));
  const page = await context.newPage();
  page.errorsSeen = [];
  page.on("pageerror", (e) => page.errorsSeen.push(String(e).slice(0, 240)));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  return { context, page };
}
const openReport = async (page, name) => {
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(name);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: name }).first().click({ timeout: 10000 });
  await page.waitForSelector(".svelte-flow__node", { timeout: 30000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForTimeout(3500);
};
/** Waits for a condition rather than a fixed time: saving takes a moment, as the store backs itself up first. */
const until = async (test, timeout = 10000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return !!(await test());
};
const shot = (page, name) => page.screenshot({ path: path.join(out, name + ".png") });

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const { context, page } = await openApp(browser, { width: 1440, height: 900 });
  const apiTotal = { active: -1, client: "" };
  page.on("response", async (r) => {
    if (!/\/api\/research\?/.test(r.url()) || !/archived=false/.test(r.url())) return;
    apiTotal.client = r.request().headers()["x-nova-client"] || apiTotal.client;
    try {
      apiTotal.active = (await r.json()).total;
    } catch {}
  });
  await page.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector(".bar-dock textarea")?.disabled, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "01-empty-dark-1440");

  // Feature A: the New Research landing screen
  check("Landing title", (await page.locator(".start h2").textContent()) === "What should we get done?");
  check("Landing subtitle", (await page.locator(".start header p").textContent()) === "Start from a workflow, or ask for anything below.");
  const chips = await page.locator(".start .recent").allTextContents();
  check("Quick suggestions", chips.map((c) => c.trim()).join("|") === "Explain code|Map a project", chips.join("|"));
  const WORKFLOWS = {
    Developer: ["Explain code", "Map a project", "Review a change", "Fix a failing test"],
    Designer: ["UI teardown", "Moodboard"],
    Marketing: ["Competitor landscape", "Campaign plan"],
    Manager: ["Plan my day", "Weekly status"],
    Student: ["Learning path", "Exam prep"],
    Office: ["Inbox triage", "Meeting prep"],
    Founder: ["Market map", "Pricing research", "Investor list"],
  };
  for (const [tab, cards] of Object.entries(WORKFLOWS)) {
    await page.locator(".start").getByText(tab, { exact: true }).first().click();
    await page.waitForTimeout(220);
    const titles = await page.locator(".start .flow .title").allTextContents();
    check(`Landing tab ${tab} has the right cards`, titles.join("|") === cards.join("|"), titles.join("|"));
  }
  check("No workflow claims to read an app Research cannot", (await page.locator(".start .reads, .start .marks").count()) === 0);
  await page.locator(".start").getByText("Office", { exact: true }).first().click();
  await page.waitForTimeout(220);
  await page.locator(".start .flow").filter({ hasText: "Inbox triage" }).click();
  await page.waitForTimeout(300);
  check("A connected-account workflow fills an editable prompt", (await page.locator(".bar-dock textarea").inputValue()).startsWith("Triage these emails:"));
  check("It states the limitation instead of pretending", /can't read your mail/.test((await page.locator(".start footer").textContent()) || ""));
  check("It does not start by itself", (await page.locator(".svelte-flow__node").count()) === 0);
  await page.locator(".start").getByText("Developer", { exact: true }).first().click();
  await page.waitForTimeout(220);
  await page.locator(".start .flow").filter({ hasText: "Map a project" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  check("Workflow cards work from the keyboard", (await page.locator(".bar-dock textarea").inputValue()).startsWith("Map the architecture of"));
  check("Choosing a card focuses the composer", await page.evaluate(() => document.activeElement?.tagName === "TEXTAREA"));
  check("It says folders cannot be opened", /can't open folders/.test((await page.locator(".start footer").textContent()) || ""));
  await shot(page, "01b-landing-picked");
  await page.locator(".bar-dock textarea").fill("");
  await page.waitForTimeout(200);

  // Shell
  const rail = await page.locator(".aegis-work-stage .rail").boundingBox();
  const card = await page.locator(".aegis-work-stage .canvas-card").boundingBox();
  check("Rail sits outside the canvas", rail && card && rail.x + rail.width <= card.x + 1, `rail ends ${rail?.x + rail?.width}, canvas starts ${card?.x}`);
  for (const hidden of [".nova-workspaces", "#controls", "#app-brand"]) check(`Old top control hidden: ${hidden}`, !(await page.locator(hidden).first().isVisible()));
  for (const label of ["Dashboard", "Memory", "Research", "Settings"]) check(`Rail has ${label}`, await page.locator(`.aegis-work-stage .rail [aria-label="${label}"]`).count());

  // Composer geometry and control order
  const clip = await page.locator(".canvas-card").evaluate((e) => e.style.clipPath);
  check("Canvas is cut to the composer's curved outline", /^path\(/.test(clip) && clip.includes("C"), clip.slice(0, 60));
  check("Composer outline drawn", (await page.locator(".bar-dock .edge path.line").getAttribute("d"))?.includes("C"));
  const labels = await page.locator(".bar-dock .tools-inner button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  check("Control order: hand, shapes, tasks, plus", labels.join("|") === "Hand|Report views|Research tasks|New or attach", labels.join("|"));
  check("Placeholder", (await page.locator(".bar-dock textarea").getAttribute("placeholder")) === "What do you want to do?");
  const micBox = await page.locator(".bar-dock .mic").boundingBox();
  const fieldBox = await page.locator(".bar-dock textarea").boundingBox();
  check("Microphone is right of the input", micBox && fieldBox && micBox.x >= fieldBox.x + fieldBox.width - 1);

  // Real wiring of the remaining controls
  await page.evaluate(() => {
    window.__micAsked = 0;
    window.addEventListener("nova-chat-microphone", () => window.__micAsked++, { capture: true });
  });
  await page.click(".bar-dock .mic");
  await page.waitForTimeout(300);
  check("Microphone button calls AEGIS voice", (await page.evaluate(() => window.__micAsked)) === 1);
  await page.waitForTimeout(600);
  if (await page.locator(".bar-dock .mic[data-listening=true]").count()) await page.click(".bar-dock .mic");
  await page.waitForTimeout(400);
  await page.click(".canvas-top .title");
  await page.waitForTimeout(300);
  check("Title dropdown opens the Research Library", await page.locator("#research-history-panel").isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.locator('.aegis-work-stage .rail [aria-label="Settings"]').click();
  await page.waitForTimeout(500);
  check("Settings opens from the rail", await page.locator("#settings-container.open").count());
  await page.locator("#settings-backdrop").click({ position: { x: 5, y: 5 }, force: true });
  await page.waitForTimeout(600);
  if (await page.locator("#settings-container.open").count()) await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.click('.bar-dock button[aria-label="New or attach"]');
  await page.waitForTimeout(300);
  const chooser = page.waitForEvent("filechooser", { timeout: 4000 }).catch(() => null);
  await page.locator(".tool-panel").getByRole("button", { name: "Attach files" }).click();
  check("Attach opens the file picker", await chooser);
  await page.waitForTimeout(300);

  // Tool panels
  await page.click('.bar-dock button[aria-label="Hand"]');
  check("Hand tool switches to Select", await page.locator('.bar-dock button[aria-label="Select"]').count());
  await page.click('.bar-dock button[aria-label="Select"]');
  await page.click('.bar-dock button[aria-label="Research tasks"]');
  await page.waitForTimeout(300);
  check("Tasks panel opens", await page.locator(".tool-panel").isVisible());
  await shot(page, "02-tasks-panel");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.click('.bar-dock button[aria-label="New or attach"]');
  await page.waitForTimeout(300);
  check("New and attach panel opens", await page.locator(".tool-panel").getByText("Attach files").isVisible());
  await page.locator(".tool-panel").getByRole("button", { name: "Quick" }).click();
  await page.waitForTimeout(250);
  check("Depth changes", (await page.locator(".tool-panel").getByRole("button", { name: "Quick" }).getAttribute("aria-pressed")) === "true");
  await page.locator(".tool-panel").getByRole("button", { name: "Detailed" }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // Saved report on the canvas
  await openReport(page, reportName);
  await shot(page, "03-report-dark-1440");
  const nodes = await page.locator(".svelte-flow__node").count();
  check("Saved report draws nodes and connectors", nodes >= 3 && (await page.locator(".svelte-flow__edge").count()) >= 2, `${nodes} nodes`);
  check("Title shows the report", ((await page.locator(".canvas-top .title span").first().textContent()) || "").length > 3);
  const blank = await page.locator(".view .face").evaluateAll((els) => els.filter((e) => !(e.textContent || "").trim()).length);
  check("No website card is blank", blank === 0, `${await page.locator(".view").count()} cards`);
  const overlaps = await page.locator(".svelte-flow__node").evaluateAll((els) => {
    const boxes = els.map((e) => e.getBoundingClientRect()).filter((b) => b.width > 30 && b.height > 30);
    let count = 0;
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 8 && y > 8) count++;
      }
    return count;
  });
  check("Cards do not overlap", overlaps === 0, `${overlaps} overlapping pairs`);

  // Pan and zoom
  const transform = () => page.locator(".svelte-flow__viewport").evaluate((e) => e.style.transform);
  const before = await transform();
  await page.mouse.move(760, 460);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -300);
  await page.keyboard.up("Control");
  await page.waitForTimeout(400);
  const zoomed = await transform();
  check("Zoom works", before !== zoomed);
  // Over open canvas: the wheel over a paper scrolls the paper instead.
  const openGround = await page.evaluate(() => {
    for (let y = 70; y < 860; y += 40)
      for (let x = 120; x < 1400; x += 40) if (document.elementFromPoint(x, y)?.closest(".svelte-flow__pane") && !document.elementFromPoint(x, y)?.closest(".svelte-flow__node")) return { x, y };
    return { x: 700, y: 70 };
  });
  await page.mouse.move(openGround.x, openGround.y);
  await page.mouse.wheel(250, 200);
  await page.waitForTimeout(400);
  check("Pan works", zoomed !== (await transform()));
  await page.mouse.move(760, 460);
  const credit = page.locator(".svelte-flow__attribution");
  check("Svelte Flow credit stays visible", (await credit.count()) > 0 && (await credit.isVisible()));
  check("Zoom percentage shown", /%/.test((await page.locator("[data-work-zoom-slot]").textContent()) || ""));

  // Reader, opened from the composer's views control
  await page.click('.bar-dock button[aria-label="Report views"]');
  await page.waitForTimeout(250);
  await page.locator(".tool-panel").getByRole("button", { name: "Reader" }).click();
  await page.waitForTimeout(1200);
  const reader = page.locator(".research-reader").first();
  check("Reader opens", await reader.isVisible());
  const length = await reader.evaluate((e) => e.textContent.length);
  check("Report text renders through to its Sources section", length > 800 && (await page.locator(".research-sources-heading").first().isVisible()), `${length} characters`);
  await reader.hover();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(900);
  const scrolled = await reader.evaluate((e) => e.scrollTop);
  check("Reader scrolls", scrolled > 0, `${scrolled}px`);
  await shot(page, "04-reader");
  const tabs = page.locator(".research-document-tools nav button");
  for (const name of ["Edit", "Sources", "Media"]) {
    const tab = tabs.filter({ hasText: name });
    if (await tab.isDisabled()) {
      check(`${name} tab`, false, "disabled");
      continue;
    }
    await tab.click();
    await page.waitForTimeout(name === "Edit" ? 2500 : 800);
    const visible = await page.locator(name === "Edit" ? ".research-edit-pane" : name === "Sources" ? ".research-sources" : ".research-media").first().isVisible();
    check(`${name} tab opens`, visible);
    await shot(page, "05-" + name.toLowerCase());
  }
  check("Edit has a working editor", (await page.locator('.research-edit-pane [contenteditable="true"]').count()) > 0 || (await page.locator(".research-edit-pane").textContent()).length > 0);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  check("Escape returns to the canvas", !(await page.locator(".research-document").isVisible()));

  // Opening a website card opens that source in the real reader
  await page.locator("[data-work-zoom-slot] button").first().click();
  await page.waitForTimeout(900);
  const lane = page.locator(".svelte-flow__node .window").first();
  if (await lane.count()) {
    const box = await lane.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1500);
    check("Clicking a website card opens a source window", await until(async () => (await page.locator(".browser-layer .pane").count()) === 1));
    await page.locator(".browser-layer .about-action").click();
    const article = await page
      .waitForFunction(() => (document.querySelector(".research-source-article")?.textContent || "").length > 300 && !document.querySelector(".research-source-article [class*=skeleton]"), null, { timeout: 25000 })
      .then(() => true)
      .catch(() => false);
    check("View evidence opens the saved source in the existing view", article);
    await shot(page, "06-source-from-card");
    await page.locator('.browser-layer .pane button[aria-label="Close pane"]').first().click();
    await page.waitForTimeout(300);
    await page.locator(".research-canvas-close").click();
    await page.waitForTimeout(300);
  } else check("Website card present", false, "none found");

  // Feature E: the finished report as a paper on the canvas
  await page.locator(".research-document").waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  await openReport(page, reportName);
  const paper = page.locator("[data-paper]").first();
  check("A finished report is a paper on the canvas", await paper.isVisible());
  const paperWords = (await paper.locator(".text").textContent()) || "";
  check("The paper holds the report's real words", paperWords.length > 800, `${paperWords.length} characters`);
  check("The paper has a title and headings", (await paper.locator("h2").first().textContent()).length > 3 && (await paper.locator(".text h2, .text h3").count()) > 0);
  check("The paper shows real citations as sources", (await paper.locator(".cite").count()) > 0 && !/\[S\d+/.test(paperWords), `${await paper.locator(".cite").count()} citations`);
  const figures = await paper.locator("figure img").evaluateAll((all) => all.filter((img) => img.complete && img.naturalWidth > 0).length);
  check("The paper shows its saved images inline", figures > 0, `${figures} images`);
  check("The paper carries no outside images or scripts", (await paper.locator('img[src^="http"], script, iframe').count()) === 0);
  check("The paper is connected to its run", (await page.locator('.svelte-flow__edge[data-id^="paper-link"], .svelte-flow__edge').count()) >= 2);
  const sheet = paper.locator(".sheet");
  await sheet.hover();
  const camera = await page.locator(".svelte-flow__viewport").evaluate((e) => e.style.transform);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(400);
  check("The paper scrolls in place without moving the canvas", (await sheet.evaluate((e) => e.scrollTop)) > 0 && camera === (await page.locator(".svelte-flow__viewport").evaluate((e) => e.style.transform)));
  const heldAt = await paper.boundingBox();
  const grip = await paper.locator("header").boundingBox();
  await page.mouse.move(grip.x + 120, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + 170, grip.y + 60, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  const movedTo = await paper.boundingBox();
  check("The paper can be moved", Math.abs(movedTo.x - heldAt.x) > 20 && Math.abs(movedTo.y - heldAt.y) > 20);
  await paper.locator(".cite").first().click();
  check("A citation opens its source window", await until(async () => (await page.locator(".browser-layer .pane").count()) === 1));
  await page.locator('.browser-layer .pane button[aria-label="Close pane"]').first().click();
  await page.waitForTimeout(400);
  await paper.locator(".expand").click();
  await page.waitForTimeout(1000);
  check("Expand opens the existing Reader", await page.locator(".research-reader").first().isVisible());
  const reading = (await page.locator(".research-reader").first().textContent()) || "";
  check("Paper and Reader show the same report", reading.includes(paperWords.slice(0, 60).replace(/\s+$/, "")));
  const views = await page.locator(".research-document-tools nav button").allTextContents();
  check("Reader, Edit, Sources and Media are all there", ["Reader", "Edit", "Sources", "Media"].every((v) => views.includes(v)), views.join("|"));
  const jump = page.locator(".research-jump-bottom");
  if (await jump.count()) {
    const at = await jump.boundingBox();
    check("The go-to-end button sits at the foot of the Reader", at.y > 500, `y ${at.y}`);
  }
  await shot(page, "06b-paper-expanded");
  check("A clear way back to the canvas", /Back to canvas/.test((await page.locator(".research-canvas-close").textContent()) || ""));
  await page.locator(".research-canvas-close").click();
  await page.waitForTimeout(400);
  check("Back returns to the graph", !(await page.locator(".research-document").isVisible()) && (await paper.isVisible()));
  await paper.locator(".all").click();
  await page.waitForTimeout(800);
  check("The paper's sources open the Sources view", await page.locator(".research-sources").first().isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const papers = await page.locator("[data-paper]").count();
  await shot(page, "06c-paper-canvas");

  // Feature C: the conversation beside the canvas
  await page.click('.aegis-work-stage button[aria-label="Research conversation"]');
  await page.waitForTimeout(500);
  const talk = page.locator("#research-conversation-panel");
  check("Conversation opens beside the canvas", await talk.isVisible());
  const talkBox = await talk.boundingBox();
  const canvasBox = await page.locator(".canvas-card").boundingBox();
  const composerBox = await page.locator(".bar-dock .surface").boundingBox();
  check("It does not cover the canvas or composer", canvasBox.x + canvasBox.width <= talkBox.x + 1 && composerBox.x + composerBox.width <= talkBox.x + 1);
  const spoken = await talk.locator(".research-chat article").evaluateAll((all) => all.map((a) => a.dataset.speaker));
  check("Saved messages appear, speakers told apart", spoken.length >= 1 && spoken.includes("user"), spoken.join(","));
  const you = talk.locator('article[data-speaker="user"]').first();
  check("Messages are labelled by speaker", (await you.locator("small").textContent()) === "You");
  await shot(page, "07-conversation");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("Conversation collapses, and the canvas takes the room back", !(await talk.isVisible()) && (await page.locator(".canvas-card").boundingBox()).width > canvasBox.width + 200);

  // Feature B: the Research Library. Changes happen only on an entry this test makes.
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  const library = page.locator("#research-history-panel");
  await until(async () => (await library.locator(".rh-row").count()) > 0, 20000);
  const libraryBox = await library.boundingBox();
  const beside = await page.locator(".canvas-card").boundingBox();
  check("Library stands outside the canvas", libraryBox.x + libraryBox.width <= beside.x + 1);
  check("Library groups research by recency", (await library.locator(".rl-list h3").count()) >= 1, (await library.locator(".rl-list h3").allTextContents()).join("|"));
  const search = library.locator('input[type="search"]');
  await search.fill(reportName);
  await until(async () => (await library.locator(".rh-row").count()) > 0);
  const matches = await library.locator(".rh-row").count();
  check("Search narrows the list", matches >= 1 && matches < 10, `${matches} rows`);
  await search.fill("zzzz no such research zzzz");
  await page.waitForTimeout(250);
  check("Search says when nothing matches", /Nothing matches/.test(await library.textContent()));
  await search.fill("");
  await until(async () => (await library.locator(".rh-row").count()) > 5);
  while (await library.locator(".rl-more").count()) await library.locator(".rl-more").click();
  const rowCount = await library.locator(".rh-row").count();
  check("Every saved record is listed, none dropped", rowCount === apiTotal.active, `${rowCount} rows, API says ${apiTotal.active}`);
  await shot(page, "07b-library");
  // A throwaway entry with its own unique name, so no step can ever match saved research.
  const NAME = `E2E library check ${["amber", "birch", "cedar", "delta", "ember", "fjord", "grove", "harbor"][Date.now() % 8]} ${["lake", "moss", "north", "orchid", "pine", "quartz", "river", "stone"][Math.floor(Date.now() / 1000) % 8]}`;
  const RENAMED = `${NAME} renamed`;
  page.on("response", async (r) => {
    if (r.request().method() !== "PATCH") return;
    console.log("      PATCH", r.status(), (await r.text().catch(() => "")).slice(0, 160));
  });
  const created = await page.evaluate(async ([name, client]) => {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Nova-Client": client },
      body: JSON.stringify({ kind: "documentary", query: name, operation_id: crypto.randomUUID() }),
    });
    return { status: response.status, body: await response.json() };
  }, [NAME, apiTotal.client]);
  check("Test entry created", created.body.status === "completed", JSON.stringify(created).slice(0, 160));
  const rowNamed = (text) => library.locator(".rh-item").filter({ hasText: text });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await search.fill(NAME);
  check("The new entry is listed", await until(async () => (await rowNamed(NAME).count()) === 1, 20000));
  await rowNamed(NAME).hover();
  await rowNamed(NAME).locator(".rh-dots").click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await library.locator(".rh-rename input").fill(RENAMED.slice(0, 78));
  await library.locator(".rh-rename button[type=submit]").click();
  check("Rename saves", await until(async () => (await rowNamed("renamed").count()) === 1), (await library.locator(".rh-error").allTextContents()).join(" "));
  const named = rowNamed(NAME);
  await named.hover();
  await named.locator(".rh-dots").click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  check("Archive moves it out of Active", await until(async () => (await rowNamed(NAME).count()) === 0));
  await library.locator(".rl-tabs button", { hasText: "Archived" }).click();
  check("It appears under Archived", await until(async () => (await rowNamed(NAME).count()) === 1));
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.waitForTimeout(1200);
  await library.locator(".rl-tabs button", { hasText: "Archived" }).click();
  await search.fill(NAME);
  check("Archive survives a reload", await until(async () => (await rowNamed(NAME).count()) === 1));
  await rowNamed(NAME).hover();
  await rowNamed(NAME).locator(".rh-dots").click();
  await page.getByRole("menuitem", { name: "Unarchive" }).click();
  await until(async () => (await rowNamed(NAME).count()) === 0);
  await library.locator(".rl-tabs button", { hasText: "Active" }).click();
  check("Restore brings it back to Active", await until(async () => (await rowNamed(NAME).count()) === 1));
  await rowNamed(NAME).hover();
  await rowNamed(NAME).locator(".rh-dots").click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const asked = await page.waitForSelector(".nova-owner-confirmation[open]", { timeout: 8000 }).catch(() => null);
  await shot(page, "07c-delete-confirmation");
  check("Delete asks first", !!asked);
  if (asked) {
    const askedBox = await asked.boundingBox();
    const onTop = await page.evaluate(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return !hit?.closest(".aegis-work-stage");
    }, [askedBox.x + askedBox.width / 2, askedBox.y + askedBox.height / 2]);
    check("The confirmation shows above the canvas", onTop);
    await shot(page, "07c-delete-confirmation");
    console.log("      confirmation:", (await asked.textContent()).replace(/\s+/g, " ").slice(0, 160));
    await page.locator(".nova-owner-confirmation[open] button").filter({ hasText: /confirm|delete|remove|yes|approve|allow/i }).first().click();
    check("Delete removes only the chosen entry", await until(async () => (await library.locator(".rh-row").filter({ hasText: NAME }).count()) === 0));
    await search.fill("");
    await page.waitForTimeout(300);
    check("Other research is still there", (await library.locator(".rh-row").count()) >= 20);
    const gone = library.locator(".rh-removed, [class*=removed]");
    check("A removed entry can be restored from the list", /restore/i.test((await gone.first().textContent().catch(() => "")) || ""));
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // Keyboard
  await page.waitForTimeout(250);
  await page.keyboard.press("h");
  check("H selects the hand tool", await page.locator('.bar-dock button[aria-label="Hand"]').count());
  await page.keyboard.press("v");
  check("V selects the pointer", await page.locator('.bar-dock button[aria-label="Select"]').count());
  await page.keyboard.press("h");
  await page.locator(".bar-dock textarea").focus();
  await page.keyboard.type("hv");
  check("Typing letters in the composer does not switch tools", (await page.locator(".bar-dock textarea").inputValue()) === "hv");
  await page.locator(".bar-dock textarea").fill("");
  await page.locator(".rail").locator('[aria-label="Memory"]').focus();
  check("Rail buttons take keyboard focus", await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Memory"));

  // Rail navigation
  await page.locator('.aegis-work-stage .rail [aria-label="Memory"]').click();
  await page.waitForTimeout(1200);
  check("Memory opens from the rail", await page.locator(".memory-workspace").isVisible());
  check("Canvas hidden on Memory", !(await page.locator(".aegis-work-stage").isVisible()));
  await page.evaluate(() => window.dispatchEvent(new Event("nova-open-research")));
  await page.waitForTimeout(800);
  check("Canvas returns on Research", await page.locator(".aegis-work-stage").isVisible());
  await page.locator('.aegis-work-stage .rail [aria-label="Dashboard"]').click();
  await page.waitForTimeout(800);
  check("Dashboard opens from the rail", await page.locator("#orb-canvas").isVisible() && !(await page.locator(".aegis-work-stage").isVisible()));
  check("Top controls are back on Dashboard", await page.locator("#controls").isVisible());
  await shot(page, "08-dashboard-after");

  // CSS isolation: the canvas stylesheet must not change anything on the Dashboard.
  const snapshot = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#widget-overlay *, #controls *, #app-brand *")].map((e) => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height, s.fontSize, s.fontFamily, s.color, s.backgroundColor, s.borderRadius].join("|");
      }),
    );
  const withCss = await snapshot();
  await page.evaluate(() => document.querySelector("link[data-aegis-work-canvas]")?.remove());
  await page.waitForTimeout(400);
  const withoutCss = await snapshot();
  const changed = withCss.filter((row, i) => row !== withoutCss[i]).length;
  check("Canvas CSS changes nothing outside the canvas", changed === 0 && withCss.length > 5, `${changed} of ${withCss.length} elements`);
  check("No page errors in this session", page.errorsSeen.length === 0, page.errorsSeen.join(" ; "));
  await context.close();

  // Light theme, driven by the AEGIS theme variable
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(3500);
    const light = await p
      .waitForFunction(
        () => {
          document.documentElement.style.setProperty("--bg", "#f4f4f6");
          window.dispatchEvent(new Event("themechange"));
          return document.querySelector(".aegis-work-stage")?.dataset.theme === "light";
        },
        null,
        { timeout: 8000, polling: 400 },
      )
      .then(() => true)
      .catch(() => false);
    check("Light theme follows AEGIS", light);
    await openReport(p, reportName);
    await shot(p, "09-report-light-1440");
    await c.close();
  }

  // Narrow window
  {
    const { context: c, page: p } = await openApp(browser, { width: 390, height: 780 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(1500);
    await shot(p, "10-empty-390");
    const bar = await p.locator(".bar-dock .surface").boundingBox();
    check("Composer fits a narrow window", bar && bar.x >= 0 && bar.x + bar.width <= 390, `${bar?.x}..${bar && bar.x + bar.width}`);
    const flowBoxes = await p.locator(".start .flow").evaluateAll((all) => all.map((e) => e.getBoundingClientRect()).map((b) => [Math.round(b.left), Math.round(b.right), Math.round(b.width)]));
    check("Landing cards fit a narrow window", flowBoxes.length > 0 && flowBoxes.every(([l, r, w]) => l >= 52 && r <= 390 && w > 120), JSON.stringify(flowBoxes));
    check("Landing tab names stay readable in a narrow window", await p.locator(".start .segment .text").evaluateAll((all) => all.every((e) => e.scrollWidth <= e.clientWidth + 1)));
    check("Every landing tab can be reached", await p.locator(".start").getByText("Founder", { exact: true }).first().evaluate((e) => {
      e.scrollIntoView({ inline: "center", block: "nearest" });
      const b = e.getBoundingClientRect();
      return b.left >= 52 && b.right <= 392;
    }));
    await p.click('.aegis-work-stage button[aria-label="Research library"]');
    await p.waitForTimeout(800);
    const libraryNarrow = await p.locator("#research-history-panel").boundingBox();
    check("Library fits a narrow window", libraryNarrow.x >= 52 && libraryNarrow.x + libraryNarrow.width <= 390);
    await shot(p, "10b-library-390");
    await p.keyboard.press("Escape");
    await openReport(p, reportName);
    await shot(p, "11-report-390");
    await c.close();
  }

  // Rollback
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.locator('.aegis-work-stage .rail [aria-label="More"]').click();
    await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Classic Research view" }).click();
    await p.waitForTimeout(800);
    check("Classic screen available as rollback", (await p.locator(".research-outline").isVisible()) && (await p.locator(".research-assistant").isVisible()) && !(await p.locator(".aegis-work-stage").isVisible()));
    check("Classic composer back", await p.locator(".research-central-composer form, .research-central-composer textarea").first().isVisible());
    check("Classic top navigation back", await p.locator(".nova-workspaces").isVisible());
    await p.screenshot({ path: path.join(out, "12-classic.png") });
    await p.locator(".research-canvas-switch").click();
    await p.waitForTimeout(800);
    check("Canvas view restores from classic", await p.locator(".aegis-work-stage").isVisible());
    await c.close();
  }

  // A SIMULATED transition: the saved report's response is altered to look unfinished, then
  // restored. It proves the canvas reacts to publication, not that a real run completed.
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    let unfinished = true;
    let reportId = "";
    await p.route("**/api/research/*/document*", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      reportId = body.research_id || reportId;
      if (unfinished)
        Object.assign(body, { phase: "preparing_report", completeness: "pending", publication_state: "preparing", report: "", sources: [], image_items: [], image_sources: [], linked_sources: [], extensions: { report: "", blocks: [] } });
      await route.fulfill({ response, json: body });
    });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(2500);
    await p.click('.aegis-work-stage button[aria-label="Research library"]');
    await p.locator("#research-history-panel .rh-row").filter({ hasText: reportName }).first().click({ timeout: 10000 });
    await p.waitForSelector('.shell[data-state="running"]', { timeout: 20000 });
    await p.waitForTimeout(800);
    const pill = await p.locator(".island .agent-line").first().textContent();
    check("Simulated: unfinished report shows Writing", /Writing/.test(pill || ""), (pill || "").trim().slice(0, 40));
    const stepLines = await p.locator('.trail[aria-label="Research steps"] li').allTextContents();
    check("Simulated: steps list what has happened, and what is going on", stepLines.at(-1)?.includes("Writing the report") && stepLines.some((l) => l.includes("Searching the web")), stepLines.join(" | "));
    check("Simulated: no paper before the report is finished", (await p.locator("[data-paper]").count()) === 0);
    await shot(p, "13-simulated-running");
    unfinished = false;
    await p.evaluate((id) => window.dispatchEvent(new CustomEvent("nova-research-refresh", { detail: { research_id: id } })), reportId);
    const done = await p.waitForSelector('.shell[data-state="completed"]', { timeout: 20000 }).then(() => true).catch(() => false);
    await p.waitForTimeout(3500);
    const nodes = await p.locator(".svelte-flow__node").count();
    check("Simulated: canvas fills in when the report publishes", done && nodes >= 5, `${nodes} nodes`);
    check("Simulated: the paper appears when the report publishes", (await p.locator("[data-paper]").count()) >= 1);
    check("Simulated: the steps go once it is finished", (await p.locator('.trail[aria-label="Research steps"]').count()) === 0);
    await shot(p, "14-simulated-published");
    check("Simulated: no page errors", p.errorsSeen.length === 0, p.errorsSeen.join(" ; "));
    await p.unrouteAll({ behavior: "ignoreErrors" });
    await c.close();
  }

  // SIMULATED conversation text, to test citations, links and hostile content on a saved reply.
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.route("**/api/research/*/conversation*", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      const list = body.messages || body.turns || body.items;
      const reply = Array.isArray(list) ? [...list].reverse().find((m) => m.role !== "user") : null;
      if (reply) {
        const key = "text" in reply ? "text" : "content";
        reply[key] = "**Bold** claim [S1]. See [a link](https://example.com/page).\\n\\n<img src=x onerror=\"window.__xss=1\"><script>window.__xss=2</script>";
        reply[key] = reply[key].replace(/\\n/g, "\n");
      }
      await route.fulfill({ response, json: body });
    });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(2500);
    await openReport(p, reportName);
    await p.click('.aegis-work-stage button[aria-label="Research conversation"]');
    await p.waitForTimeout(800);
    const text = p.locator("#research-conversation-panel .research-chat-text").last();
    if (await text.count()) {
      check("Simulated: Aegis replies render Markdown", (await text.locator("strong").count()) === 1);
      check("Simulated: links stay links", (await text.locator('a[href="https://example.com/page"]').count()) === 1);
      check("Simulated: hostile content is removed", (await p.evaluate(() => window.__xss)) === undefined && (await text.locator("img, script").count()) === 0);
      const cite = text.locator(".research-chat-cite");
      check("Simulated: citations become buttons", (await cite.count()) === 1);
      if (await cite.count()) {
        await cite.click();
        await p.waitForTimeout(1200);
        check("Simulated: a citation opens its source", await p.locator(".research-document").isVisible());
      }
    } else check("Simulated: conversation has an Aegis reply to test", false, "no reply rendered");
    check("Simulated: no page errors", p.errorsSeen.length === 0, p.errorsSeen.join(" ; "));
    await p.unrouteAll({ behavior: "ignoreErrors" });
    await c.close();
  }

  // The workspace browser, on real websites. Add to Work uses only this test's own failed entry.
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(2500);
    await openReport(p, reportName);
    const panes = p.locator(".browser-layer .pane");
    const frames = p.locator(".browser-layer iframe");
    const card = await p.locator(".svelte-flow__node .window").first().boundingBox();
    await p.mouse.click(card.x + card.width / 2, card.y + card.height / 2);
    check("A source opens its real address in a window on the canvas", await until(async () => (await frames.count()) === 1 && /^https:/.test(await frames.first().getAttribute("src")), 20000), await frames.first().getAttribute("src").catch(() => ""));
    const first = panes.first();
    const canvas = await p.locator(".canvas-card").boundingBox();
    const start = await first.boundingBox();
    check("The window stands inside the canvas, clear of the composer", start.x >= canvas.x && start.x + start.width <= canvas.x + canvas.width && start.y + start.height <= (await p.locator(".bar-dock .surface").boundingBox()).y);
    const attributes = await frames.first().evaluate((f) => ({ sandbox: f.sandbox.value, referrer: f.getAttribute("referrerpolicy"), credentialless: f.credentialless, allow: f.getAttribute("allow") }));
    check("The page is sandboxed: no top navigation or downloads", !/allow-top-navigation|allow-downloads|allow-modals/.test(attributes.sandbox) && /allow-scripts/.test(attributes.sandbox), attributes.sandbox);
    check("The page gets no referrer, cookies or device access", attributes.referrer === "no-referrer" && attributes.credentialless === true && /camera 'none'/.test(attributes.allow) && /microphone 'none'/.test(attributes.allow));
    const about = (await p.locator(".browser-layer .about").first().textContent()) || "";
    check("The window gives the source's title and retrieval date", /Retrieved /.test(about), about.slice(0, 90));
    await p.locator(".browser-layer .about-title").first().click();
    await p.waitForTimeout(200);
    check("Its details give the address and saved excerpt", /https?:\/\//.test(await p.locator(".browser-layer .about-more").first().textContent()) && /Saved excerpt/.test(await p.locator(".browser-layer .about-more").first().textContent()));
    await p.locator(".browser-layer .about-title").first().click();
    // Move and resize
    const head = await first.locator("header.head").boundingBox();
    await p.mouse.move(head.x + 20, head.y + head.height / 2);
    await p.mouse.down();
    await p.mouse.move(head.x - 40, head.y + 40, { steps: 6 });
    await p.mouse.up();
    await p.waitForTimeout(200);
    const moved = await first.boundingBox();
    check("Dragging its bar moves the window", Math.abs(moved.x - start.x) > 20 && Math.abs(moved.y - start.y) > 5, `${start.x},${start.y} -> ${moved.x},${moved.y}`);
    const grip = await first.locator(".grip-se").boundingBox();
    await p.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await p.mouse.down();
    await p.mouse.move(grip.x - 240, grip.y - 160, { steps: 6 });
    await p.mouse.up();
    await p.waitForTimeout(200);
    const resized = await first.boundingBox();
    check("Its corner resizes it", resized.width < moved.width - 100 && resized.height < moved.height - 80, `${moved.width}x${moved.height} -> ${resized.width}x${resized.height}`);
    // A second window, stacking
    await p.locator("[data-paper] .cite").nth(2).evaluate((e) => e.click());
    check("A second source opens a second window", await until(async () => (await panes.count()) === 2, 15000));
    const zOf = (locator) => locator.evaluate((e) => Number(getComputedStyle(e).zIndex));
    check("The newest window stands in front", (await zOf(panes.nth(1))) > (await zOf(first)));
    await first.locator("header.head").click({ position: { x: 14, y: 20 } });
    await p.waitForTimeout(150);
    check("Touching a window brings it forward", (await zOf(first)) > (await zOf(panes.nth(1))));
    await p.screenshot({ path: path.join(out, "30-browser-windows.png") });
    await first.locator('button[aria-label="Minimize"]').click();
    await p.waitForTimeout(200);
    check("Minimize hides a window and leaves a way back", !(await first.isVisible()) && (await p.locator(".minimized button").count()) === 1);
    await p.locator(".minimized button").click();
    await p.waitForTimeout(200);
    check("Restore brings it back", await first.isVisible());
    // Canvas still usable beside the windows
    await panes.nth(1).locator('button[aria-label="Close pane"]').click();
    await p.waitForTimeout(200);
    check("Close removes only that window", (await panes.count()) === 1);
    // Navigation, on real sites
    const pageRequests = [];
    p.on("request", (r) => { if (/(^|[.])(wikipedia|wikimedia)[.]org$/.test(new URL(r.url()).hostname)) pageRequests.push({ type: r.resourceType(), url: r.url(), headers: r.headers() }); });
    const address = first.locator("input[data-zephium-address]");
    const go = async (where) => {
      await address.click();
      await address.fill(where);
      await p.keyboard.press("Enter");
    };
    const sourceAddress = await frames.first().getAttribute("src");
    await go("en.wikipedia.org/wiki/Tide");
    check("The address bar opens a real site", await until(async () => (await frames.first().getAttribute("src").catch(() => "")) === "https://en.wikipedia.org/wiki/Tide", 15000));
    let remote = null;
    const reached = await until(async () => {
      remote = p.frames().find((f) => f.url().startsWith("https://en.wikipedia.org/wiki/Tide")) || null;
      return !!remote && /Tide/.test(await remote.title().catch(() => ""));
    }, 20000);
    check("The framed page really loaded", reached);
    if (remote) {
      const seen = await remote.evaluate(() => {
        const out = { cookie: document.cookie, referrer: document.referrer, keys: Object.keys(localStorage).length, parentReadable: false };
        try {
          out.parentReadable = !!window.parent.location.href;
        } catch {}
        try {
          out.parentReadable = out.parentReadable || !!window.parent.document;
        } catch {}
        return out;
      });
      check("The page can't read AEGIS or its storage", !seen.parentReadable && seen.keys === 0 && !seen.referrer, JSON.stringify(seen));
    } else check("The page can't read AEGIS or its storage", false, "frame not found");
    const toSite = pageRequests.find((r) => r.type === "document");
    check("The site gets no referrer or cookies with the page request", !!toSite && !toSite.headers.referer && !toSite.headers.cookie, toSite ? JSON.stringify(Object.keys(toSite.headers)).slice(0, 120) : "no page request");
    check("No AEGIS credentials or address reach the site", pageRequests.length > 0 && pageRequests.every(({ headers }) => !headers["x-nova-client"] && !headers["x-nova-control"] && !headers.authorization && !/127[.]0[.]0[.]1|localhost/.test(headers.referer || "") && !/127[.]0[.]0[.]1|localhost/.test(headers.origin || "")), JSON.stringify(pageRequests.find(({ headers }) => headers["x-nova-client"] || headers.authorization || /127[.]0[.]0[.]1|localhost/.test((headers.referer || "") + (headers.origin || "")))?.headers || {}).slice(0, 170));
    const back = first.locator('button[aria-label="Back"]');
    const forward = first.locator('button[aria-label="Forward"]');
    check("Back is available after going somewhere", await back.isEnabled());
    await back.click();
    check("Back returns to the earlier address", await until(async () => (await frames.first().getAttribute("src").catch(() => "")) === sourceAddress, 15000));
    await forward.click();
    check("Forward goes on again", await until(async () => (await frames.first().getAttribute("src").catch(() => "")) === "https://en.wikipedia.org/wiki/Tide", 15000));
    const before = await frames.first().elementHandle();
    await first.locator('button[aria-label="Reload"]').click();
    check("Reload loads the page again", await until(async () => {
      const now = await frames.first().elementHandle().catch(() => null);
      return now && !(await before.evaluate((e) => e.isConnected).catch(() => false));
    }, 15000));
    const popup = p.waitForEvent("popup", { timeout: 8000 }).catch(() => null);
    await first.locator("header.head").getByRole("button", { name: "Open in browser" }).click();
    const opened = await popup;
    check("Open in browser opens the same address outside AEGIS", opened && opened.url().startsWith("https://en.wikipedia.org/wiki/Tide"), opened ? opened.url() : "no popup");
    if (opened) await opened.close();
    // A site that refuses
    await go("github.com");
    check("A site that refuses framing shows a clear notice, not a broken frame", await until(async () => /doesn't allow being shown/.test((await first.textContent()) || ""), 20000) && (await frames.count()) === 0);
    check("The notice offers Open in browser", await first.locator(".notice button.primary").isVisible());
    await p.screenshot({ path: path.join(out, "31-browser-blocked.png") });
    // Addresses that must never open
    for (const bad of ["http://127.0.0.1:8340/api/research", "http://localhost:5173/", "http://169.254.169.254/latest/meta-data/", "javascript:alert(1)", "file:///c:/windows/win.ini"]) {
      await go(bad);
      await p.waitForTimeout(250);
      check(`Refused: ${bad}`, (await frames.count()) === 0 && /can't be opened here/.test((await first.textContent()) || ""));
    }
    await first.locator('button[aria-label="Close pane"]').click();
    await p.waitForTimeout(200);
    // Existing views still work, and offer the window
    await p.locator("[data-paper] .all").first().click();
    await p.waitForTimeout(900);
    await p.locator(".research-sources a, .research-sources button").filter({ hasNotText: /^$/ }).first().click().catch(() => {});
    const inWorkspace = p.locator(".research-source-workspace");
    if (await until(async () => (await inWorkspace.count()) > 0, 8000)) {
      await inWorkspace.first().click();
      check("The source view opens the same page in a window", await until(async () => (await panes.count()) === 1, 10000));
      const hit = await panes.first().boundingBox();
      check("The window stands over the open report", await p.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest(".browser-layer"), [hit.x + hit.width / 2, hit.y + 20]));
      await panes.first().locator('button[aria-label="Close pane"]').click();
    } else check("The source view offers Open in workspace", false, "no button");
    check("Browser windows: no page errors", p.errorsSeen.length === 0, p.errorsSeen.join(" ; "));
    await c.close();
  }

  // Add to Work and a large run, on this test's own failed entry, never on saved research.
  {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(2500);
    const OWN = "How do solar panels";
    await p.click('.aegis-work-stage button[aria-label="Research library"]');
    await p.locator('#research-history-panel input[type="search"]').fill(OWN);
    const row = p.locator("#research-history-panel .rh-row").filter({ hasText: OWN }).first();
    if (await until(async () => (await row.count()) === 1, 15000)) {
      // SIMULATED: 300 sources through the trace route, for this test only.
      let simulate = true;
      await p.route("**/api/research/*/trace*", async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        if (simulate && /after=0/.test(route.request().url()))
          body.events = [
            { seq: 1, at: 1000, kind: "search", phase: "collecting_sources", status: "done", query: "solar panels", count: 300 },
            ...Array.from({ length: 300 }, (_, i) => ({ seq: i + 2, at: 1001 + i, kind: "source", phase: "collecting_sources", status: "done", url: `https://site${i}.example/page`, title: `Source ${i}`, excerpt: "Words" })),
          ];
        await route.fulfill({ response, json: body });
      });
      const began = Date.now();
      await row.click();
      await p.waitForSelector('.trail[aria-label="Research steps"]', { timeout: 30000 });
      const took = Date.now() - began;
      await p.keyboard.press("Escape");
      await p.waitForTimeout(2500);
      const nodes = await p.locator(".svelte-flow__node").count();
      check("Simulated: 300 sources stay manageable on the canvas", nodes <= 40, `${nodes} nodes, opened in ${took}ms`);
      check("Simulated: they are all counted", /Found 300 sources/.test((await p.locator('.trail[aria-label="Research steps"]').textContent()) || ""));
      const camera = () => p.locator(".svelte-flow__viewport").evaluate((e) => e.style.transform);
      const seen = await camera();
      await p.mouse.move(800, 400);
      await p.mouse.wheel(200, 100);
      await p.waitForTimeout(300);
      check("Simulated: panning stays responsive", seen !== (await camera()));
      await p.screenshot({ path: path.join(out, "32-large-run.png") });
      simulate = false;
      await p.unrouteAll({ behavior: "ignoreErrors" });
      // Real Add to Work, then a reload.
      const lane = p.locator(".svelte-flow__node .window").first();
      if (await lane.count()) {
        await p.locator("[data-work-zoom-slot] button").first().click().catch(() => {});
        await p.waitForTimeout(500);
      }
      const added = `https://en.wikipedia.org/wiki/Tide?run=${Date.now()}`;
      await p.evaluate((added) => window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: { url: added, title: "Tide" } })), added);
      const pane = p.locator(".browser-layer .pane").first();
      await pane.waitFor({ timeout: 10000 });
      const add = pane.getByRole("button", { name: "Add to Work" });
      const answer = p.waitForResponse((r) => /work-sources/.test(r.url()), { timeout: 15000 });
      await add.click();
      const sent = await answer;
      const saved = await sent.json();
      check("Add to Work saves a reference: address and title, no page content", sent.status() === 200 && saved.source?.url === added && !("content" in saved.source), JSON.stringify(saved.source || saved).slice(0, 140));
      check("The window then says it is in this Work", await until(async () => /In this Work/.test((await pane.textContent()) || ""), 8000));
      await p.reload({ waitUntil: "load" });
      await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
      await p.waitForTimeout(2500);
      await p.click('.aegis-work-stage button[aria-label="Research library"]');
      await p.locator('#research-history-panel input[type="search"]').fill(OWN);
      await p.locator("#research-history-panel .rh-row").filter({ hasText: OWN }).first().click({ timeout: 15000 });
      await p.waitForSelector(".canvas-top", { timeout: 20000 });
      await p.waitForTimeout(2500);
      await p.keyboard.press("Escape");
      await p.evaluate((added) => window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: { url: added, title: "Tide" } })), added);
      check("It is still in this Work after a reload", await until(async () => /In this Work/.test((await p.locator(".browser-layer .pane").first().textContent().catch(() => "")) || ""), 10000));
      check("Reopened research shows what was added", /You added Tide/.test((await p.locator('.trail[aria-label="Research steps"]').textContent().catch(() => "")) || ""));
    } else check("Own test entry available for Add to Work", false, "not found");
    check("Add to Work: no page errors", p.errorsSeen.length === 0, p.errorsSeen.join(" ; "));
    await p.unrouteAll({ behavior: "ignoreErrors" });
    await c.close();
  }

  // Real research run, only when asked for
  if (livePrompt) {
    const { context: c, page: p } = await openApp(browser, { width: 1440, height: 900 });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForFunction(() => !document.querySelector(".bar-dock textarea")?.disabled, null, { timeout: 30000 });
    await p.locator('.aegis-work-stage .rail [aria-label="New research"]').click();
    await p.waitForTimeout(600);
    if (process.argv.includes("--quick")) {
      await p.click('.bar-dock button[aria-label="New or attach"]');
      await p.waitForTimeout(250);
      await p.locator(".tool-panel").getByRole("button", { name: "Quick" }).click();
      await p.keyboard.press("Escape");
      await p.waitForTimeout(200);
    }
    const posted = p.waitForResponse((r) => r.url().endsWith("/api/research") && r.request().method() === "POST", { timeout: 20000 });
    await p.locator(".bar-dock textarea").fill(livePrompt);
    await p.keyboard.press("Enter");
    const response = await posted;
    const body = await response.json();
    check("Composer starts a real research job", ["accepted", "queued"].includes(body.status) && !!body.job_id, `${body.status} ${body.job_id || ""}`);
    const seen = new Set();
    const started = Date.now();
    let finished = false;
    let shotRun = 0;
    let sourcesWhileRunning = 0;
    let stepsWhileRunning = 0;
    let doneTooEarly = false;
    const liveLines = [];
    await p.waitForTimeout(800);
    while (Date.now() - started < 300000) {
      const state = await p.evaluate(() => ({
        title: document.querySelector(".canvas-top .title span")?.textContent,
        pill: document.querySelector(".island .agent-line, .island .chat-pill")?.textContent?.trim().slice(0, 60) || "",
        nodes: document.querySelectorAll(".svelte-flow__node").length,
        state: document.querySelector(".aegis-work-stage .shell")?.dataset.state,
        steps: [...document.querySelectorAll('.trail[aria-label="Research steps"] li')].map((li) => li.textContent.trim()),
        lanes: document.querySelectorAll(".svelte-flow__node .window, .svelte-flow__node .face").length,
        paper: document.querySelectorAll("[data-paper]").length,
      }));
      if (state.state === "running" || state.state === "waiting") {
        sourcesWhileRunning = Math.max(sourcesWhileRunning, state.lanes);
        stepsWhileRunning = Math.max(stepsWhileRunning, state.steps.length);
        if (state.paper) doneTooEarly = true;
        for (const line of state.steps) if (!liveLines.includes(line)) { liveLines.push(line); console.log("      step:", line.slice(0, 110)); }
      }
      const key = `${state.state} | ${state.pill} | ${state.nodes} nodes`;
      if (!seen.has(key)) {
        seen.add(key);
        console.log("      live:", key);
        if (state.nodes && shotRun < 5) await p.screenshot({ path: path.join(out, `20-live-${++shotRun}.png`) });
      }
      if (state.state === "completed" || state.state === "failed") {
        finished = state.state;
        break;
      }
      await p.waitForTimeout(2000);
    }
    check("Canvas followed the real run to its end", finished === "completed", `ended: ${finished}; ${[...seen].length} distinct states`);
    check("Real run: steps appeared while it was running", stepsWhileRunning >= 2, liveLines.slice(0, 6).join(" ; "));
    check("Real run: named its real search", liveLines.some((line) => /^(Searched|Used saved research for):/.test(line)), liveLines[0] || "");
    check("Real run: sources appeared before any report", sourcesWhileRunning >= 1 && liveLines.some((line) => /^(Found|Reused) \d+ .*source/.test(line)), `${sourcesWhileRunning} cards`);
    check("Real run: no paper before the backend finished", !doneTooEarly);
    check("Pill showed real activity during the run", [...seen].some((k) => /Search|Compar|Writ|Think|Read/i.test(k)), [...seen].slice(0, 6).join(" ; "));
    await p.waitForTimeout(4000);
    await p.screenshot({ path: path.join(out, "21-live-finished.png") });
    const after = await p.locator('.trail[aria-label="Research steps"] li').allTextContents();
    await p.reload({ waitUntil: "load" });
    await p.waitForSelector(".aegis-work-stage .shell", { timeout: 30000 });
    await p.waitForTimeout(2500);
    await p.click('.aegis-work-stage button[aria-label="Research library"]');
    await p.locator('#research-history-panel input[type="search"]').fill(livePrompt.slice(0, 18));
    await p.locator("#research-history-panel .rh-row").first().click({ timeout: 20000 });
    await p.waitForTimeout(4000);
    const reopened = await p.locator('.trail[aria-label="Research steps"] li').allTextContents();
    void after;
    check("Reopening the research shows how it went, to the same end", reopened.length >= 2 && (finished !== "completed" || reopened.some((line) => /Report published/.test(line))), reopened.join(" ; ").slice(0, 170));
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(out, "21b-live-reopened.png") });
    if (finished === "completed") {
      check("A real finished run becomes a paper", (await p.locator("[data-paper]").count()) >= 1);
      const before = await p.locator("#research-conversation-panel .research-chat article").count();
      await p.locator(".bar-dock textarea").fill("In one sentence, what is the main finding of this report?");
      await p.keyboard.press("Enter");
      await p.waitForTimeout(1000);
      check("A follow-up opens the conversation", await p.locator("#research-conversation-panel").isVisible());
      const replied = await p
        .waitForFunction((n) => document.querySelectorAll('#research-conversation-panel .research-chat article[data-speaker]:not([data-speaker="user"])').length > 0 && document.querySelectorAll("#research-conversation-panel .research-chat article").length >= n + 2, before, { timeout: 120000 })
        .then(() => true)
        .catch(() => false);
      check("The same saved conversation continues with a real reply", replied);
      await p.screenshot({ path: path.join(out, "22-live-followup.png") });
    }
    check("No page errors during the run", p.errorsSeen.length === 0, p.errorsSeen.join(" ; "));
    await c.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 1));
  console.log(`\n${results.length - failed.length} of ${results.length} passed`);
  if (failed.length) console.log("Failed:\n" + failed.map((f) => " - " + f.name + (f.detail ? " (" + f.detail + ")" : "")).join("\n"));
})().catch((e) => {
  console.error("CRASH", String(e).slice(0, 900));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} passed before the crash`);
  process.exit(1);
});
