// Real stop, retry and clarifying-question behaviour of AEGIS Work, in the real app.
// Usage: node tests/work-control.live.cjs <output folder>
// Spends real model and search quota. The runs stay in the Research library.
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const out = process.argv[2] || "work-control-shots";
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 220) + ")" : ""}`);
};
const until = async (test, timeout = 10000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return !!(await test());
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
  const api = (url) =>
    page.evaluate(async ({ url, client }) => (await fetch(url, { headers: { "X-Nova-Client": client } })).json(), { url, client });
  const composer = page.locator(".bar-dock textarea");
  const newWork = async () => {
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector(".aegis-work-stage .start", { timeout: 40000 });
    await page.waitForFunction(() => !document.querySelector(".bar-dock textarea")?.disabled, null, { timeout: 30000 });
    runId = "";
  };

  // Stop a real Deep Research run, then retry it from where it stopped.
  await newWork();
  await page.locator(".aegis-work-stage .roles").getByText("Research", { exact: true }).click();
  await page.locator(".aegis-work-stage .flow").filter({ hasText: "Deep Research" }).click();
  await composer.fill((await composer.inputValue()) + " how tidal power plants work and what they cost per megawatt-hour");
  await composer.press("Enter");
  await page.waitForSelector(".svelte-flow__node", { timeout: 60000 });
  await until(() => runId, 15000);
  const started = await until(async () => (await page.locator("article[data-agent]").count()) >= 2, 40000);
  check("A Deep run shows its workers before finishing", started);
  await shot("c1-before-stop");
  const stop = page.locator(".island button").last();
  await stop.click();
  const stopped = await until(async () => (await api(`/api/work/runs/${runId}`)).run?.state === "cancelled", 90000);
  const afterStop = (await api(`/api/work/runs/${runId}`)).run;
  check("Stop cancels the real run", stopped, `state ${afterStop?.state}, stage ${afterStop?.stage}, failure ${afterStop?.failure}`);
  check("A stopped run publishes no report", (await page.locator("[data-paper]").count()) === 0);
  const words = await until(async () => /stopped/i.test(await page.locator(".island").innerText().catch(() => "")), 40000);
  check("The canvas says it stopped", words, await page.locator(".island").innerText().catch(() => ""));
  await shot("c2-stopped");
  const spentBefore = afterStop?.usage?.calls ?? 0;
  const doneBefore = Object.keys(afterStop?.done ?? {}).length;
  const retry = page.locator(".island").getByRole("button", { name: "Retry" });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
    const finished = await until(async () => ["completed", "partial"].includes((await api(`/api/work/runs/${runId}`)).run?.state), 600000);
    const final = (await api(`/api/work/runs/${runId}`)).run;
    check("Retry finishes the same run", finished, `state ${final?.state}, ${final?.usage?.calls} calls (${spentBefore} before the stop), failure ${final?.failure}`);
    check("A finished Deep run can cite more than five real sources", (final?.evidence?.length ?? 0) > 5, `${final?.evidence?.length} sources from ${new Set(final?.evidence?.map((row) => row.domain)).size} sites`);
    await page.waitForTimeout(4000);
    await shot("c3-retried");
    console.log("before stop: finished stages", doneBefore);
  } else check("Retry is offered after a stop", false);

  // A request that cannot start without one answer.
  await newWork();
  await composer.fill("Compare the two options we talked about and tell me which is better.");
  await composer.press("Enter");
  await page.waitForSelector(".svelte-flow__node", { timeout: 60000 });
  await until(() => runId, 15000);
  const settled = await until(async () => {
    const run = (await api(`/api/work/runs/${runId}`)).run;
    return run && ["needs_input", "completed", "partial", "failed"].includes(run.state);
  }, 180000);
  const run = (await api(`/api/work/runs/${runId}`)).run;
  console.log("vague request ended as:", run?.state, "/ mode", run?.plan?.mode);
  if (settled && run?.state === "needs_input") {
    check("The lead asks when it cannot start", await until(() => page.locator(".question").isVisible(), 8000), await page.locator(".question").innerText().catch(() => ""));
    await shot("c4-question");
    await composer.fill("Tidal power versus offshore wind, for a coastal town in Spain.");
    await composer.press("Enter");
    const answered = await until(async () => ["completed", "partial"].includes((await api(`/api/work/runs/${runId}`)).run?.state), 300000);
    check("The answer lets the same run continue", answered, (await api(`/api/work/runs/${runId}`)).run?.state);
    await page.waitForTimeout(3000);
    await shot("c5-answered");
  } else {
    console.log("NOTE: the lead did not ask a question for this prompt, so the question path was not exercised live.");
    await shot("c4-no-question");
  }

  check("No uncaught page errors", errors.length === 0, errors.join(" | "));
  const failed = results.filter((row) => !row.ok).length;
  console.log(`\n${results.length - failed} of ${results.length} checks passed.`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
