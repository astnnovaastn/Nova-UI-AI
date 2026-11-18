// V30 checks in the real web app (AEGIS at 127.0.0.1:5173, backend running):
//  A. A saved Work result opens in the Work document viewer, not the legacy Reader/Edit/Sources/Media tabs.
//  B. A clarification opens inside the top-centre island (no side panel), folds with Escape, and a real
//     answer is accepted by the backend and resumes the run (the resumed run makes a few small model calls).
// Usage: node tests/work-v30.e2e.cjs [out] ["<library search for a saved Work run>"] ["<card text>"]
//        ANSWER=0 skips the real answer (no model spend at all).
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [out = "v30-shots", search = "four-week launch", cardText = "Four-Week Launch"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};

async function openFromLibrary(page, text) {
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(text);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(text, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1500, height: 920 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  let client = "";
  page.on("request", (request) => { client = request.headers()["x-nova-client"] || client; });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });

  // A. The Work document viewer.  (ONLY=B skips it.)
  if (process.env.ONLY !== "B") {
  await openFromLibrary(page, search);
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(1500);
  // The reply card (Zephium element ids are el-<artifact>; a Work run's reply artifact ends in -object-reply).
  const reply = page.locator('.svelte-flow__node[data-id$="-object-reply"], .svelte-flow__node[data-id$="-reply"]').first();
  const card = (await reply.count()) ? reply : page.locator(".svelte-flow__node").filter({ hasText: new RegExp(cardText, "i") }).last();
  check("A1 the saved Work run's reply card is on the canvas", await card.count());
  await card.dblclick({ position: { x: 24, y: 14 } });
  await page.waitForTimeout(1200);
  const viewer = page.locator(".lift-body[data-work-document]");
  check("A2 opening it shows the Work document viewer", await viewer.count(), await viewer.getAttribute("data-work-document").catch(() => ""));
  check("A3 the legacy Reader/Edit/Sources/Media tabs are not shown", !(await page.locator('nav[aria-label="Report views"]').isVisible().catch(() => false)));
  const label = await page.locator(".lift-body[data-work-document]").innerText().catch(() => "");
  check("A4 it is labelled as its own kind of document", /Campaign plan|Deliverable|Work document|brief|Architecture/i.test(label), label.split("\n")[0]);
  check("A5 Back to canvas is offered", await page.getByRole("button", { name: "Back to canvas" }).count());
  await page.screenshot({ path: path.join(out, "after-work-document.png") });
  await page.getByRole("button", { name: "Back to canvas" }).first().click();
  await page.waitForTimeout(500);
  check("A6 Back to canvas closes it and the canvas is still there", !(await viewer.count()) && (await page.locator(".svelte-flow__node").count()) > 0);
  }

  // B. The question island, on a run that asks before any model call (a review with no change to review).
  check("B0 the page's client id was seen", client);
  const created = await page.request.post("http://127.0.0.1:5173/api/work/runs", {
    headers: { "X-Nova-Client": client, "Content-Type": "application/json" },
    data: { query: "Review my change to the billing module", workflow: "review-a-change", mode: "quick" },
  });
  const run = await created.json().catch(() => ({}));
  const id = run.research_id || run.run?.research_id || run.id || "";
  check("B1 a run that needs input was created", created.ok() && id, JSON.stringify(run).slice(0, 200));
  let status = "";
  for (let i = 0; i < 30 && status !== "needs_input"; i++) {
    await page.waitForTimeout(1000);
    const got = await page.request.get(`http://127.0.0.1:5173/api/work/runs/${id}`, { headers: { "X-Nova-Client": client } });
    const body = await got.json().catch(() => ({}));
    status = body.state || body.run?.state || body.status || "";
  }
  check("B2 the backend paused it for a question", status === "needs_input", status);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await openFromLibrary(page, "billing module");
  const island = page.locator(".island.asking");
  await island.waitFor({ timeout: 30000 }).catch(() => {});
  check("B3 the question is inside the top-centre island", await island.count() && (await island.locator(".ask-body").innerText().catch(() => "")).length > 10);
  check("B4 no separate right-side question panel", !(await page.locator(".question-panel").count()));
  check("B5 the island is open", await page.locator(".island.asking.open").count());
  const box = await island.boundingBox();
  const viewport = page.viewportSize();
  check("B6 it is centred at the top", box && Math.abs(box.x + box.width / 2 - (await page.locator(".environment").boundingBox()).x - (await page.locator(".environment").boundingBox()).width / 2) < 40 && box.y < 120, JSON.stringify(box));
  await page.screenshot({ path: path.join(out, "after-question-island-open.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);
  check("B7 Escape folds it back into the pill (the run keeps waiting)", await page.locator(".island.asking:not(.open)").count());
  await page.screenshot({ path: path.join(out, "after-question-island-folded.png") });
  await page.locator(".island.asking .ask-head").click();
  await page.waitForTimeout(450);
  check("B8 the header opens it again", await page.locator(".island.asking.open").count());

  if (process.env.ANSWER !== "0") {
    const timings = [];
    const t0 = Date.now();
    page.on("requestfinished", (request) => { if (/\/api\/(work|research)\//.test(request.url())) timings.push(`${Date.now() - t0}ms ${request.method()} ${request.url().replace(/^.*\/api\//, "")}`); });
    const option = island.locator(".ask-body button").filter({ hasText: /paste the diff|uncommitted/i }).first();
    await (await option.count() ? option : island.locator(".ask-body button").first()).click();
    const sentAt = Date.now();
    // The question leaves the island once the backend has accepted the answer; the brief state is "Answer received · resuming".
    let closed = false, sawAck = false;
    for (let i = 0; i < 240 && !closed; i++) {
      sawAck ||= (await page.locator(".chat-pill.ack").count()) > 0;
      closed = (await page.locator(".island.asking").count()) === 0;
      if (!closed) await page.waitForTimeout(250);
    }
    sawAck ||= (await page.locator(".chat-pill.ack").count()) > 0;
    check("B9 after the backend accepts the answer the island closes (Answer received · resuming)", closed && sawAck, `${Math.round((Date.now() - sentAt) / 100) / 10} s, acknowledgement ${sawAck ? "shown" : "not seen"}`);
    await page.screenshot({ path: path.join(out, "after-question-answered.png") });
    let after = "";
    const askedAt = Date.now();
    for (let i = 0; i < 90; i++) {
      const got = await page.request.get(`http://127.0.0.1:5173/api/work/runs/${id}`, { headers: { "X-Nova-Client": client } });
      const body = await got.json().catch(() => ({}));
      after = body.state || body.run?.state || body.status || "";
      if (after && after !== "needs_input") break;
      await page.waitForTimeout(1000);
    }
    check("B10 the backend resumed the same run", after && after !== "needs_input", `${after} after ${Math.round((Date.now() - askedAt) / 1000)} s in the job queue`);
    fs.writeFileSync(path.join(out, "answer-timings.txt"), timings.join(String.fromCharCode(10)));
  }

  check("No page errors", !errors.length, errors.join(" | "));
  fs.writeFileSync(path.join(out, "work-v30-results.json"), JSON.stringify({ results, id }, null, 1));
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
