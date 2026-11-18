// The lead's adaptive cards, drawn on a saved run. The cards are added to the run's record in this
// browser only (no model, no backend write), so the canvas's real renderers and layout are checked.
// Usage: node tests/work-v28-cards.e2e.cjs "<library search>" <out folder>
const path = require("path");
const { chromium } = require("@playwright/test");
const [search, out] = process.argv.slice(2);
const card = (id, kind, extra) => ({ id, kind, title: extra.title, revision: 1, status: "complete", task_id: "citations", contract_version: 26, family: extra.family ?? kind, preset: `${extra.family ?? kind}.1.reading`, sources: [], ...extra });
const CARDS = [
  card("today", "calendar", { title: "Tomorrow", entries: [{ id: "e1", label: "Wake up and get ready", when: "07:00", date: "2026-11-19" }, { id: "e2", label: "Dentist", when: "09:00", date: "2026-11-19", place: "Clinic" }, { id: "e3", label: "Finish the budget report", when: "11:00", date: "2026-11-19" }] }),
  card("weeks", "timeline", { title: "Launch campaign", entries: [{ id: "w1", label: "Week 1 · teaser", detail: "Short clips on two channels" }, { id: "w2", label: "Week 2 · launch", detail: "Press and partner posts" }, { id: "w3", label: "Week 3 · follow-up", detail: "Case studies" }] }),
  card("chart", "chart", { title: "Planned hours", chartKind: "bars", entries: [{ id: "a", label: "Budget report", value: 3, unit: "h" }, { id: "b", label: "Meetings", value: 2, unit: "h" }, { id: "c", label: "Errands", value: 1, unit: "h" }] }),
  card("picks", "comparison", { family: "recommendation", title: "Focus options", recommendations: [{ id: "r1", title: "Deep work block", recommended: true, why: "Before noon", facts: [{ id: "f1", label: "Length", value: "2 h" }] }, { id: "r2", title: "Split sessions", recommended: false, facts: [{ id: "f2", label: "Length", value: "4 × 30 min" }] }] }),
  card("patch", "diff", { title: "Reminder script", language: "python", body: "@@ -1,2 +1,2 @@\n def remind():\n-    at = '9:30'\n+    at = '9:00'" }),
  card("note", "draft", { title: "Message to the clinic", body: "Hello, confirming my 9:00 appointment tomorrow." }),
];
(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  await page.route(/\/api\/work\/runs\/[0-9a-f]{32}$/, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    let body = await response.text();
    try { const data = JSON.parse(body); if (data.run) { data.run.canvas_objects = [...(data.run.canvas_objects || []).filter((o) => o.kind === "report"), ...CARDS]; body = JSON.stringify(data); } } catch {}
    await route.fulfill({ response, body });
  });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(5000);
  const result = {
    plan: await page.locator(".svelte-flow__node .plan").count(),
    plot: await page.locator(".svelte-flow__node .plot, .svelte-flow__node svg[class*=chart], .svelte-flow__node .chart").count(),
    picks: await page.locator(".svelte-flow__node .pick").count(),
    diff: await page.locator(".svelte-flow__node .diff").count(),
    draft: await page.locator(".svelte-flow__node .draft").count(),
    nodes: await page.$$eval(".svelte-flow__node", (n) => n.map((x) => x.dataset.id).filter((id) => /object-/.test(id))),
  };
  await page.screenshot({ path: path.join(out, "v28-cards.png") });
  console.log(JSON.stringify({ ...result, errors }));
  await browser.close();
})();
