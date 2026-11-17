// Starts one real AEGIS Work run through the real app's connection and prints what the backend did.
// Usage: node tests/work-run.live.cjs "<prompt>" [workflow] [mode]
// This spends real search and model quota, and the run stays in the Research library.
const { chromium } = require("@playwright/test");

const [prompt, workflow = "", mode = ""] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  let client = "";
  page.on("crash", () => console.log("PAGE CRASHED at", new Date().toISOString()));
  page.on("pageerror", (error) => console.log("PAGE ERROR", String(error).slice(0, 300)));
  page.on("request", (r) => {
    client = r.headers()["x-nova-client"] || client;
  });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  for (let i = 0; i < 60 && !client; i++) await page.waitForTimeout(500);
  const call = (path, init = {}) =>
    page.evaluate(
      async ({ path, init, client }) => {
        const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", "X-Nova-Client": client } });
        return { status: r.status, body: await r.json().catch(() => null) };
      },
      { path, init, client },
    );
  console.log("slots", JSON.stringify((await call("/api/settings/work-models?check=true")).body));
  const made = await call("/api/work/runs", { method: "POST", body: JSON.stringify({ query: prompt, workflow, mode, operation_id: crypto.randomUUID() }) });
  console.log("created", made.status, JSON.stringify(made.body));
  const id = made.body?.research_id;
  if (!id) process.exit(1);
  let after = 0;
  const started = Date.now();
  for (;;) {
    const trace = await call(`/api/research/${id}/trace?after=${after}`);
    for (const event of trace.body?.events ?? []) {
      after = Math.max(after, event.seq);
      const { seq, at, ...rest } = event;
      if (rest.kind === "source") console.log(`  source ${rest.title} ${rest.url}`);
      else console.log(`${((at * 1000 - started) / 1000).toFixed(0).padStart(4)}s ${JSON.stringify(rest).slice(0, 330)}`);
    }
    const run = (await call(`/api/work/runs/${id}`)).body?.run;
    if (run && ["completed", "partial", "failed", "cancelled", "needs_input"].includes(run.state)) {
      console.log("RUN", run.state, run.failure, JSON.stringify(run.usage));
      console.log("ASSIGNMENTS", JSON.stringify(run.assignments.map((row) => [row.role, row.model, row.state])));
      console.log("SOURCES", run.evidence.length, new Set(run.evidence.map((row) => row.domain)).size, "domains");
      if (run.state !== "failed") {
        const text = (await call(`/api/research/${id}/reader?stream=all`)).body?.report ?? "";
        console.log("REPORT", text.length, "characters; citations:", (text.match(/\[S\d+/g) || []).length);
        console.log(text.slice(0, 900));
      }
      break;
    }
    if (Date.now() - started > 25 * 60000) {
      console.log("TIMED OUT WAITING");
      break;
    }
    await page.waitForTimeout(2500);
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
