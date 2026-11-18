// V29 bounded live validation: starts ONE real routed Work run and prints what the engine did.
// Usage: node tests/work-v29.live.cjs "<prompt>" <workflow> <ledger.json>
// Spends real model quota (never paid search for Work routes). The ledger file accumulates usage
// across runs; the script refuses to start when the approved budget (38 calls / 210k tokens) is spent.
const { chromium } = require("@playwright/test");
const fs = require("fs");

const [prompt, workflow = "", ledgerPath = "v29-ledger.json"] = process.argv.slice(2);
const LIMIT = { calls: 38, tokens: 210000 };

(async () => {
  const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, "utf8")) : { runs: [], calls: 0, tokens: 0 };
  if (workflow !== "deep-research" && (ledger.calls >= LIMIT.calls || ledger.tokens >= LIMIT.tokens)) {
    console.log("BUDGET SPENT", JSON.stringify(ledger));
    process.exit(2);
  }
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  let client = "";
  page.on("request", (r) => (client = r.headers()["x-nova-client"] || client));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  for (let i = 0; i < 60 && !client; i++) await page.waitForTimeout(500);
  const call = (path, init = {}) =>
    page.evaluate(async ({ path, init, client }) => {
      const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", "X-Nova-Client": client } });
      return { status: r.status, body: await r.json().catch(() => null) };
    }, { path, init, client });
  const made = await call("/api/work/runs", { method: "POST", body: JSON.stringify({ query: prompt, workflow, mode: "", operation_id: crypto.randomUUID() }) });
  console.log("created", made.status, JSON.stringify(made.body).slice(0, 200));
  const id = made.body?.research_id;
  if (!id) process.exit(1);
  let after = 0;
  const started = Date.now();
  let run;
  for (;;) {
    const trace = await call(`/api/research/${id}/trace?after=${after}`);
    for (const event of trace.body?.events ?? []) {
      after = Math.max(after, event.seq);
      const { seq, at, ...rest } = event;
      if (["stage", "tool", "search", "canvas_object", "task"].includes(rest.kind))
        console.log(`${((at * 1000 - started) / 1000).toFixed(0).padStart(4)}s ${JSON.stringify(rest).slice(0, 260)}`);
    }
    run = (await call(`/api/work/runs/${id}`)).body?.run;
    if (run && ["completed", "partial", "failed", "cancelled", "needs_input"].includes(run.state)) break;
    if (Date.now() - started > 15 * 60000) { console.log("TIMED OUT"); break; }
    await page.waitForTimeout(2500);
  }
  const objects = (run?.canvas_objects ?? []).map((o) => (o.kind === "zephium" ? o.zkind : o.kind));
  const pics = (run?.canvas_objects ?? []).filter((o) => o.zkind === "picks").flatMap((o) => o.data.items).filter((i) => i.image_candidates?.length).length;
  const summary = {
    id, workflow, prompt, state: run?.state, failure: run?.failure, route: run?.plan?.route && { board: run.plan.route.board, caps: run.plan.route.capabilities, research: run.plan.route.research },
    calls: run?.usage?.calls ?? 0, tokens: run?.usage?.tokens ?? 0, paid_searches: run?.usage?.searches ?? 0, cost_usd: run?.usage?.cost_usd ?? null,
    models: run?.usage?.models, objects, picks_with_images: pics, seconds: Math.round((Date.now() - started) / 1000),
  };
  console.log("SUMMARY", JSON.stringify(summary, null, 1));
  ledger.runs.push(summary);
  if (workflow !== "deep-research") { ledger.calls += summary.calls; ledger.tokens += summary.tokens; }
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
