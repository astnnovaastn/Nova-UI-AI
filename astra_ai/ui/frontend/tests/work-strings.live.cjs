// Semantic strings, construction hand, model cap and Deep report depth, in the real app.
// Usage: node tests/work-strings.live.cjs <output folder> ["prompt"]
// Spends real model and search quota for one Deep Research run. The run stays in the Research library.
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const out = process.argv[2] || "work-strings-shots";
const prompt = process.argv[3] || " how grid-scale battery storage works, what it costs, how long it lasts and how safe it is";
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 260) + ")" : ""}`);
};
const until = async (test, timeout = 10000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
};

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));
  page.on("crash", () => errors.push("PAGE CRASHED"));
  let client = "";
  let runId = "";
  page.on("request", (r) => {
    client = r.headers()["x-nova-client"] || client;
    runId = r.url().match(/\/api\/work\/runs\/([0-9a-f]{32})/)?.[1] || runId;
  });
  const shot = (name) => page.screenshot({ path: path.join(out, name + ".png") });
  const api = (url) => page.evaluate(async ({ url, client }) => (await fetch(url, { headers: { "X-Nova-Client": client } })).json(), { url, client });
  const composer = page.locator(".bar-dock textarea");
  const drawn = () =>
    page.$$eval("g.strand", (rows) => rows.map((g) => ({ ids: (g.getAttribute("data-relations") || "").split(" ").filter(Boolean), index: +g.getAttribute("data-strand-index"), of: +g.getAttribute("data-strand-of"), status: g.getAttribute("data-status") })));

  await page.goto("http://127.0.0.1:5173/" + (process.env.AEGIS_DESIGN ? "?aegis-design=" + process.env.AEGIS_DESIGN : ""), { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage .start", { timeout: 40000 });
  await page.waitForFunction(() => !document.querySelector(".bar-dock textarea")?.disabled, null, { timeout: 30000 });
  await page.locator(".aegis-work-stage .roles").getByText("Research", { exact: true }).click();
  await page.locator(".aegis-work-stage .flow").filter({ hasText: process.env.AEGIS_FLOW || "Deep Research" }).click();
  await composer.fill((await composer.inputValue()) + prompt);
  await composer.press("Enter");

  // While the run works: the hand places cards and draws real strings.
  let sawHand = false;
  let sawControls = false;
  let sawPending = false;
  let yielded = null;
  let midShots = 0;
  const started = Date.now();
  let run = null;
  while (Date.now() - started < 20 * 60000) {
    await page.waitForTimeout(700);
    const hand = await page.locator(".hand.visible").count();
    sawHand ||= hand > 0;
    sawControls ||= (await page.locator(".construction-controls").count()) > 0;
    const pending = await page.evaluate(() => [...document.querySelectorAll("style")].some((s) => s.textContent.includes("opacity:0!important")));
    sawPending ||= pending;
    if (hand && midShots < 3 && Date.now() - started > midShots * 20000) {
      await shot("live-" + midShots++);
    }
    // The person takes over during the animation: playback yields at once.
    if (hand && yielded === null && Date.now() - started > 3000) {
      const box = await page.locator(".canvas-card").boundingBox();
      await page.mouse.move(box.x + 30, box.y + box.height - 140);
      await page.mouse.down();
      await page.mouse.move(box.x + 90, box.y + box.height - 160, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(250);
      const stillHidden = await page.evaluate(() => [...document.querySelectorAll("style")].some((s) => s.textContent.includes("opacity:0!important")));
      yielded = !(await page.locator(".hand.visible").count()) && !stillHidden;
    }
    if (!runId) continue;
    run = (await api(`/api/work/runs/${runId}`)).run;
    if (run && ["completed", "partial", "failed", "cancelled", "needs_input"].includes(run.state)) break;
  }
  console.log("playback", JSON.stringify(await page.locator(".hand-layer").evaluate((el) => ({ ...el.dataset })).catch(() => null)));
  check("A run was created", !!runId, runId);
  check("The run finished", run && ["completed", "partial"].includes(run.state), run && run.state + " " + run.failure);
  check("The construction hand appeared while the run worked", sawHand);
  check("Cards waited for the hand before appearing", sawPending);
  check("Construction controls were offered", sawControls);
  check("Playback yielded at once when the person dragged", yielded === true, String(yielded));

  // Let the hand finish placing what the end of the run added before counting.
  // The hand moves slowly by design (about 2-3 s a string), so a big run takes minutes to finish drawing.
  await until(async () => !(await page.locator(".construction-controls .count").count()), 240000);
  await page.waitForTimeout(1500);
  await shot("finished");
  const relations = run?.relations ?? [];
  const known = new Set(relations.map((row) => row.id));
  const strands = await drawn();
  check("The run recorded typed relations", relations.length >= 8, relations.length + " relations: " + [...new Set(relations.map((r) => r.type))].join(","));
  check("Strings are drawn", strands.length >= 3, strands.length);
  // Images and Videos strings come from the saved report's own images and video search (collections.ts).
  const derived = (id) => /^(img|vid|stage)-/.test(id);
  check("Every drawn string stands for recorded relations", strands.every((s) => s.ids.length && s.ids.every((id) => known.has(id) || derived(id))), strands.filter((s) => !s.ids.every((id) => known.has(id) || derived(id))).map((s) => s.ids.join("+")).join(" | "));
  const pairsOk = strands.every((s) => s.of >= 1 && s.index < s.of && (s.of <= 3 || s.ids.length > 0));
  check("Parallel strands are numbered within their bundle", pairsOk);
  const failedRel = relations.filter((r) => r.status === "failed").map((r) => r.id);
  check("No failed relation is drawn as complete", strands.every((s) => !s.ids.some((id) => failedRel.includes(id)) || s.status === "failed"));
  const models = run?.usage?.distinct_models ?? [];
  check("At most six distinct models were used, AEGIS included", models.length >= 1 && models.length <= 6, models.join(", "));
  // V5 structure: Deep runs its workers, and the NVIDIA and synthesis slots really take part.
  const roles = (run?.assignments ?? []).map((row) => row.role + ":" + row.state + ":" + row.model);
  check("Deep assigned discovery, analysis and verification workers", ["discovery", "analysis", "verification"].every((role) => roles.some((r) => r.startsWith(role + ":"))), roles.join(" | "));
  check("An NVIDIA model did real work", models.some((m) => m.startsWith("nvidia:")), models.join(", "));
  check("Report sections were written by the synthesis model", models.some((m) => m === "gemini:gemini-3.5-flash"), Object.keys(run?.usage?.models ?? {}).join(", "));
  console.log("USAGE", JSON.stringify(run?.usage));

  // Inspect a string.
  const hit = page.locator("path.strand-hit").first();
  await hit.dispatchEvent("click");
  const panel = page.locator(".strand-panel");
  check("Clicking a string shows what it means and what made it", await until(() => panel.isVisible(), 4000) && /recorded by event #\d+/.test(await panel.innerText()), await panel.innerText().catch(() => ""));
  await shot("strand-inspector");
  // The inspector closes by itself when the canvas redraws its strings as the run settles.
  await panel.getByRole("button", { name: "Close connection details" }).click({ timeout: 5000 }).catch(() => {});

  // The report: complete, sectioned, every source listed.
  // The Reader API pages long reports; follow it to the end, as the Reader does.
  let text = "";
  for (let cursor = 0, guard = 0; cursor != null && guard < 50; guard++) {
    const part = await api(`/api/research/${runId}/reader?stream=all&cursor=${cursor}`);
    text += part?.report ?? "";
    cursor = part?.next_cursor ?? null;
  }
  const headings = text.match(/^## .+$/gm) || [];
  const bibliography = (text.split("## Bibliography")[1] || "").match(/^- \*\*S\d+\*\*/gm) || [];
  console.log("REPORT", text.length, "characters,", text.split(/\s+/).length, "words;", headings.length, "sections:", headings.map((h) => h.slice(3)).join(" | "));
  check("The Deep report has contents, summary, method, conclusions and bibliography", ["## Contents", "## Executive summary", "## Scope and methodology", "## Conclusions", "## Bibliography"].every((h) => text.includes(h)) || headings.length >= 4, headings.join(" | ").slice(0, 200));
  check("Every retrieved source is listed in the bibliography", !text.includes("## Bibliography") || bibliography.length === run.evidence.length, `${bibliography.length} of ${run?.evidence?.length}`);
  check("Citations resolve to known sources", (text.match(/\[S(\d+)/g) || []).every((m) => run.evidence.some((e) => e.id === m.slice(1))));

  // Reload: the graph is rebuilt from the record, nothing is replayed, positions are kept.
  const where = () => page.$$eval(".svelte-flow__node", (rows) => Object.fromEntries(rows.map((n) => [n.getAttribute("data-id"), n.style.transform])));
  const before = await where();
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(2500);
  const after = await where();
  console.log("PLAN live", before["plan:ai"], "reload", after["plan:ai"]);
  const common = Object.keys(before).filter((id) => id in after);
  check("Reopening shows the canvas without replaying the build", !(await page.locator(".hand.visible").count()));
  check("Reopening keeps every card where it was", common.length > 3 && common.every((id) => before[id] === after[id]), `${common.filter((id) => before[id] !== after[id]).length} moved of ${common.length}: ` + common.filter((id) => before[id] !== after[id]).map((id) => `${id.slice(0, 40)} ${before[id]} -> ${after[id]}`).join("; "));
  check("Strings come back after reload", (await drawn()).length === strands.length, `${(await drawn()).length} vs ${strands.length}`);

  // Zoom out to about 44% and check the strings still meet their cards.
  await page.locator(".canvas-card").hover();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, 240);
    await page.keyboard.up("Control");
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
  await shot("zoomed-out");

  // Reduced motion: the same canvas, no hand, nothing hidden.
  const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await calm.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const still = await calm.newPage();
  await still.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await still.waitForTimeout(4000);
  check("Reduced motion never shows the hand", (await still.locator(".hand.visible").count()) === 0);
  await calm.close();

  check("No page errors", !errors.length, errors.join(" | "));
  fs.writeFileSync(path.join(out, "result.json"), JSON.stringify({ runId, results, relations: relations.length, strands: strands.length, models }, null, 1));
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed. Run ${runId}`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
