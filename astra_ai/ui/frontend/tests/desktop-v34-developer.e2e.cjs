// V34 AEGIS Desktop: the Developer launcher's real inputs, in the real Electron app with its own profile.
// Choose file / Choose folder / Select repository go through the desktop's own (stubbed) native dialog on a
// temporary project; the grant is written; the chosen path is placed in the request; connected projects are
// offered again without asking; Zephium's own "Choose folder" command is answered (no longer "not available").
// Then, with LIVE=1, one real Explain Code run on the temporary project (Flash Lite, no paid search) checks
// that the chosen file is the one read and its code card carries the file's real lines.
// Usage: node tests/desktop-v34-developer.e2e.cjs [output folder]      (LIVE=1 to add the one live run)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { _electron: electron } = require("@playwright/test");

const [out = "v34-desktop-shots"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(probe, timeout = 30000, step = 300) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await Promise.resolve().then(probe).catch(() => undefined);
    if (value) return value;
    if (Date.now() > end) return value;
    await wait(step);
  }
}
const frontend = path.resolve(__dirname, "..");
const root = path.resolve(frontend, "..", "..", "..");
const grantsFile = path.join(root, "state", "work", "authorized_folders.json");
const grantsBefore = fs.existsSync(grantsFile) ? fs.readFileSync(grantsFile, "utf8") : null;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v34-"));

// A temporary project: the V33 fixture plus a nested backend/ai_model.py.
const project = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v34-proj-")), "v34 sample project");
fs.cpSync(path.join(root, "astra_ai", "ui", "backend", "tests", "fixtures", "v33_repo"), project, { recursive: true });
fs.mkdirSync(path.join(project, "backend"), { recursive: true });
const MODEL = [
  '"""Conversation memory for the assistant model."""',
  "import json",
  "",
  "MAX_TURNS = 8",
  "",
  "",
  "class Memory:",
  '    """Keeps the last MAX_TURNS turns and saves them as JSON."""',
  "",
  "    def __init__(self, path):",
  "        self.path = path",
  "        self.turns = []",
  "",
  "    def remember(self, role, text):",
  "        self.turns.append({'role': role, 'text': text})",
  "        self.turns = self.turns[-MAX_TURNS:]",
  "",
  "    def save(self):",
  "        with open(self.path, 'w', encoding='utf-8') as out:",
  "            json.dump(self.turns, out)",
  "",
  "    def recall(self, role=None):",
  "        return [t['text'] for t in self.turns if role is None or t['role'] == role]",
].join("\n") + "\n";
const modelFile = path.join(project, "backend", "ai_model.py");
fs.writeFileSync(modelFile, MODEL);

async function launch() {
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend, timeout: 60000, env: { ...process.env, AEGIS_DESKTOP_USER_DATA: profile } });
  const page = await app.firstWindow();
  await until(() => page.evaluate(() => location.href.startsWith("http")), 60000);
  await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
  return { app, page };
}
async function shot(page, name) {
  await page.screenshot({ path: path.resolve(out, name + ".png") }).catch(() => {});
}
const stubDialog = (app, picked) => app.evaluate(({ dialog }, chosen) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosen] });
  dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
}, picked);
const composer = (page) => page.locator(".aegis-work-stage textarea").first().inputValue();
const grantFor = (folder) => (JSON.parse(fs.readFileSync(grantsFile, "utf8")).folders || []).find((row) => path.resolve(row.path).toLowerCase() === fs.realpathSync.native(folder).toLowerCase());

async function startScreen(page) {
  await page.click('.aegis-work-stage button[aria-label="New research"]').catch(() => {});
  await until(() => page.locator("#work-start-title").count(), 15000);
  // The launcher is enabled once the page is connected to the backend.
  return until(() => page.locator(".aegis-work-stage .flow:not([disabled])").count(), 60000);
}
async function pickFlow(page, name) {
  await page.locator(".aegis-work-stage .roles button", { hasText: /^Developer$/ }).first().click().catch(() => {});
  await page.locator(".aegis-work-stage .flow").filter({ hasText: name }).first().click();
  await until(() => page.locator(".aegis-work-stage footer .ask").count(), 5000);
}

(async () => {
  let app;
  let client = "";
  const errors = [];
  try {
    ({ app, page: globalThis.page } = await launch());
    const page = globalThis.page;
    page.on("pageerror", (error) => errors.push(String(error.message || error)));
    page.on("request", (request) => { client = request.headers()["x-nova-client"] || client; });
    check("0 the start screen opens", await startScreen(page));

    // ---- 1. Explain code: workflow-specific prompt and the file / folder choices.
    await pickFlow(page, "Explain code");
    const ask = await page.locator(".aegis-work-stage footer .ask").innerText();
    check("1a Explain code asks for code, a file or a connected project", /Paste code, choose a file or select a connected project/.test(ask), ask);
    check("1b the old \"Research can't open folders\" text is gone", !(await page.locator(".aegis-work-stage").innerText()).includes("can't open folders"));
    const picks = await page.locator("[data-dev-pick]").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-dev-pick")));
    check("1c Explain offers Choose file, Choose folder and Paste code", picks.join(",") === "file,folder,paste", picks.join(","));
    await shot(page, "v34-explain-launcher");

    // ---- 2. Choose file: one file is granted and its path goes into the request.
    await stubDialog(app, modelFile);
    await page.locator('[data-dev-pick="file"]').click();
    const withFile = await until(async () => ((await composer(page)).includes("ai_model.py") ? composer(page) : ""), 10000);
    check("2a the chosen file's path is placed in the request", withFile && withFile.startsWith("Explain how this code works:") && withFile.includes("ai_model.py"), withFile);
    const fileGrant = grantFor(path.dirname(modelFile));
    check("2b only that file is granted (its folder is not opened)", fileGrant && JSON.stringify(fileGrant.only) === JSON.stringify(["ai_model.py"]) && fileGrant.via === "desktop_dialog", JSON.stringify(fileGrant));

    // ---- 3. Map a project: Choose folder grants the folder; the connected project is then offered again.
    await pickFlow(page, "Map a project");
    const mapAsk = await page.locator(".aegis-work-stage footer .ask").innerText();
    check("3a Map asks for a folder or repository", /Choose a folder or connect a repository/.test(mapAsk), mapAsk);
    await stubDialog(app, project);
    await page.locator('[data-dev-pick="folder"]').click();
    const withFolder = await until(async () => ((await composer(page)).includes("v34 sample project") ? composer(page) : ""), 10000);
    check("3b the chosen folder's path is placed in the request", withFolder && withFolder.startsWith("Map the architecture of"), withFolder);
    const folderGrant = grantFor(project);
    check("3c the folder grant is written by the desktop, read only", folderGrant && folderGrant.write === false && !folderGrant.only, JSON.stringify(folderGrant));
    // V35: temporary folders (this test's project lives in %TEMP%) are not offered to ordinary users...
    await wait(800);
    const hidden = await page.locator("[data-dev-existing] option").allInnerTexts();
    check("3d temporary/test folders are not offered in the normal picker", !hidden.some((t) => /v34 sample project/.test(t)), hidden.join(" | "));
    check("3e no fixture names appear as buttons", (await page.locator("[data-dev-grant]").count()) === 0);
    // ...and are with developer tools switched on.
    await page.evaluate(() => localStorage.setItem("aegis-dev-tools", "1"));
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
    await startScreen(page);
    await pickFlow(page, "Map a project");
    const options = await until(async () => { const n = await page.locator("[data-dev-existing] option").allInnerTexts(); return n.some((t) => /v34 sample project/.test(t)) ? n : null; }, 10000);
    check("3f with developer tools on, connected projects are offered in one menu", Boolean(options), (options || []).join(" | "));

    // ---- 4. Reusing a connection does not open the dialog.
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => { throw new Error("the dialog must not open"); }; });
    const value = await page.locator("[data-dev-existing] option").filter({ hasText: "v34 sample project" }).first().getAttribute("value");
    await page.locator("[data-dev-existing]").selectOption(value);
    check("4a Continue with existing project fills the request from the saved grant", (await composer(page)).includes("v34 sample project"));
    await page.evaluate(() => localStorage.removeItem("aegis-dev-tools"));

    // ---- 5. Review / Fix choices and Zephium's own folder command.
    await pickFlow(page, "Review a change");
    check("5a Review asks for a diff, commit, PR or local change", /Select a Git diff, commit, pull request or local change/.test(await page.locator(".aegis-work-stage footer .ask").innerText()));
    await pickFlow(page, "Fix a failing test");
    check("5b Fix asks for a project and the failing test", /Choose a project and provide the failing test or error output/.test(await page.locator(".aegis-work-stage footer .ask").innerText()));
    check("5c Fix offers Connect repository (saving asked separately) and Paste code", (await page.locator("[data-dev-pick]").evaluateAll((r) => r.map((x) => x.getAttribute("data-dev-pick")))).join(",") === "repository,paste");
    check("5e the repository button reads Connect repository", (await page.locator('[data-dev-pick="repository"]').innerText()).trim() === "Connect repository");
    await shot(page, "v34-fix-launcher");
    const missing = await page.evaluate(() => (window.__aegisMissingCommands?.() ?? []).filter((c) => /folder/.test(c)));
    check("5d no folder command is missing in AEGIS", missing.length === 0, missing.join(","));

    // ---- 6 (LIVE=1). Limited live validation: the four workflows on the temporary project, at most CAP model calls.
    if (process.env.LIVE === "1") {
      const CAP = Number(process.env.LIVE_CAP || 12);
      const ledger = { cap_calls: CAP, model: "lead (configured)", paid_search_allowed: false, runs: [] };
      // LIVE_SPENT carries calls already spent in an earlier part of the same validation.
      const spent = () => Number(process.env.LIVE_SPENT || 0) + ledger.runs.reduce((n, r) => n + (r.calls || 0), 0);
      const only = process.env.LIVE_ONLY || "";
      const api = (url, init = {}) => page.evaluate(async ({ url, init, client }) => {
        const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", "X-Nova-Client": client, ...(init.headers || {}) } });
        return { status: r.status, body: await r.json().catch(() => null) };
      }, { url, init, client });
      const finish = (id) => until(async () => {
        const got = await api("/api/work/runs/" + id);
        const run = got.body?.run;
        return run && ["completed", "failed", "cancelled"].includes(run.state) || run?.plan?.clarification && run.state === "needs_input" ? run : null;
      }, 300000, 2500);
      const record = (name, run) => {
        const row = { workflow: name, id: run?.research_id, state: run?.state, failure: run?.failure || "", calls: run?.usage?.calls || 0,
          tokens: run?.usage?.tokens || 0, paid_searches: run?.usage?.searches || 0, models: run?.usage?.models || {},
          read: (run?.developer?.read || []).map((r) => r.path), scope: run?.developer?.scope,
          objects: (run?.canvas_objects || []).map((o) => o.zkind), draft: run?.developer?.draft ? { status: run.developer.draft.status, files: run.developer.draft.files.map((f) => f.path),
            before: run.developer.draft.runs?.before?.exit_code, after: run.developer.draft.runs?.after?.exit_code } : null };
        ledger.runs.push(row);
        fs.writeFileSync(path.resolve(out, "live-ledger.json"), JSON.stringify(ledger, null, 1));
        fs.writeFileSync(path.resolve(out, "live-" + name + ".json"), JSON.stringify(run, null, 1));
        return row;
      };
      const start = async (query, workflow) => {
        if (spent() >= CAP - 2) { check("budget: skipped " + workflow, true, `spent ${spent()} of ${CAP}`); return null; }
        const made = await api("/api/work/runs", { method: "POST", body: JSON.stringify({ query, workflow, operation_id: crypto.randomUUID() }) });
        return made.body?.research_id ? finish(made.body.research_id) : null;
      };

      // 6a. Explain Code from the launcher, on the chosen file.
      if (!only || only === "explain") {
      await pickFlow(page, "Explain code");
      const area = page.locator(".aegis-work-stage textarea").first();
      await area.fill("Explain how this code works: " + modelFile + " - how does Memory keep and save turns?");
      const created = page.waitForResponse((r) => r.url().endsWith("/api/work/runs") && r.request().method() === "POST", { timeout: 30000 });
      await area.press("Enter");
      const explain = await finish((await (await created).json()).research_id);
      const ex = record("explain-code", explain);
      check("6a Explain finished", explain?.state === "completed", ex.state + " " + ex.failure);
      check("6b the granted file was the one read (not the AEGIS repo)", explain?.developer?.scope?.files?.[0] === "ai_model.py" && ex.read.includes("ai_model.py") && !ex.read.some((p) => /orchestrator|v29_tasks/.test(p)), JSON.stringify(explain?.developer?.scope));
      const code = (explain?.canvas_objects || []).find((o) => o.zkind === "code");
      const real = MODEL.split("\n");
      const shown = (code?.data?.text || "").split("\n");
      const first = code?.data?.start || 1;
      check("6c the code card shows the file's real lines", code && code.data.grounded && shown.every((line, i) => line === real[first - 1 + i]), (code?.data?.text || "").slice(0, 100));
      const notes = code?.data?.notes || [];
      check("6d every annotation lies on real shown lines", notes.length > 0 && notes.every((n) => n.from >= 1 && n.to <= shown.length && n.from <= n.to), JSON.stringify(notes.map((n) => [n.from + first - 1, n.to + first - 1, n.text.slice(0, 40)])).slice(0, 260));
      check("6e Explain used no paid search and stayed small", ex.paid_searches === 0 && ex.calls <= 4, `${ex.calls} calls, ${ex.tokens} tokens`);
      await until(() => page.locator(".svelte-flow__node").count(), 20000);
      await wait(2500);
      await shot(page, "v34-live-explain-canvas");

      }
      // 6f. Map a Project on the folder grant.
      if (!only || only === "map") {
      const map = await start("Map the architecture of " + project, "map-a-project");
      if (map) {
        const mp = record("map-a-project", map);
        const diagram = (map.canvas_objects || []).find((o) => o.zkind === "diagram");
        check("6f Map reads the chosen project and draws real modules", map.state === "completed" && map.developer?.scope?.title === "v34 sample project" && diagram && diagram.data.nodes.every((n) => /^(app|calc|web|backend|tests|notes|\(root\))/.test(n.id)), JSON.stringify(diagram?.data?.nodes?.map((n) => n.id)).slice(0, 200));
        check("6g Map: no paid search", mp.paid_searches === 0, `${mp.calls} calls`);
      }

      }
      // 6h. Review a Change: the real uncommitted git change.
      if (!only || only === "review") {
      var git = (...args) => execFileSync("git", ["-C", project, "-c", "user.name=AEGIS Test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" });
      git("init", "-q", "-b", "main"); git("add", "-A"); git("commit", "-q", "-m", "Initial");
      const fmt = path.join(project, "calc", "format.py");
      fs.writeFileSync(fmt, fs.readFileSync(fmt, "utf8").replace(/return (.*)$/m, "return str($1)[:3]"));
      const review = await start("Review the uncommitted changes in " + project, "review-a-change");
      if (review) {
        const rv = record("review-a-change", review);
        const diff = (review.canvas_objects || []).find((o) => o.zkind === "diff" && o.data.path === "calc/format.py");
        check("6h Review shows the real git hunk", review.state === "completed" && diff && JSON.stringify(diff.data.hunks).includes("[:3]"), rv.objects.join(","));
      }
      git("checkout", "--", "calc/format.py");
      }

      // 6i. Fix a Failing Test: Select repository (saving allowed), reproduce, draft, re-run, approve in the panel, roll back.
      await startScreen(page);
      await pickFlow(page, "Fix a failing test");
      await stubDialog(app, project);
      await page.locator('[data-dev-pick="repository"]').click();
      await until(async () => (await composer(page)).includes("v34 sample project"), 10000);
      check("6i Select repository grants saving after the second question", grantFor(project)?.write === true, JSON.stringify(grantFor(project)));
      const coreFile = path.join(project, "calc", "core.py");
      const before = fs.readFileSync(coreFile, "utf8");
      const fix = await start("Fix the failing test: " + project + " tests/test_core.py::test_divide fails with AssertionError: assert 18 == 2", "fix-a-bug");
      if (fix) {
        const fx = record("fix-a-bug", fix);
        const draft = fix.developer?.draft;
        check("6j the failure was reproduced in the sandbox", draft?.runs?.before?.exit_code === 1, JSON.stringify(fx.draft));
        check("6k the patched draft was re-run for real", typeof draft?.runs?.after?.exit_code === "number" && draft.runs.after.environment?.network === "none", JSON.stringify(fx.draft));
        check("6l nothing in the project changed before approval", fs.readFileSync(coreFile, "utf8") === before);
        const reply = (fix.canvas_objects || []).find((o) => o.zkind === "reply");
        check("6m the reply states the real re-run result", /patched draft (passes|still fails)/.test(reply?.data?.text || ""), (reply?.data?.text || "").slice(0, 160));
        // The panel on the canvas: review, approve, apply; then roll back.
        await page.evaluate((research_id) => window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id } })), fix.research_id);
        const bar = await until(async () => { const t = await page.locator("[data-dev-workspace] .bar").innerText(); return /Code draft/.test(t) ? t : ""; }, 30000);
        check("6n the developer workspace bar shows the draft", bar, bar);
        await page.locator("[data-dev-workspace] .bar").click();
        await until(() => page.locator("[data-draft-file]").count(), 10000);
        await shot(page, "v34-draft-review");
        await page.locator("[data-dev-workspace] [role=tab]", { hasText: "Sandbox runs" }).click();
        await until(() => page.locator("[data-terminal]").count(), 5000);
        check("6o the terminal view shows the real command, directory and exit code", /python -m pytest/.test(await page.locator("[data-terminal]").first().innerText()) && /\/workspace/.test(await page.locator("[data-terminal]").first().innerText()));
        await shot(page, "v34-draft-terminal");
        if (draft?.files?.length && draft.runs?.after?.exit_code === 0) {
          await page.locator("[data-dev-workspace] [role=tab]", { hasText: "Changes" }).click();
          const apply = page.locator("[data-dev-apply]");
          check("6p Apply stays disabled until the person confirms the review", await apply.isDisabled());
          await page.locator("[data-dev-workspace] input[type=checkbox]").check();
          await apply.click();
          const applied = await until(() => fs.readFileSync(coreFile, "utf8") !== before, 15000);
          check("6q Approve and apply writes the reviewed patch to the project", applied && fs.readFileSync(coreFile, "utf8").includes("a / b"));
          await page.locator("[data-dev-rollback]").click();
          check("6r Roll back restores the original file", await until(() => fs.readFileSync(coreFile, "utf8") === before, 15000));
        } else check("6p-r approval flow (skipped: the model's patch did not pass)", true, JSON.stringify(fx.draft));
      }
      check("6z live budget respected", spent() <= CAP, `${spent()} calls of ${CAP}; tokens ${ledger.runs.reduce((n, r) => n + r.tokens, 0)}`);
    }
    check("no page errors", errors.length === 0, errors.join(" ; "));
  } catch (error) {
    check("run finished", false, error.stack || error);
  } finally {
    // The person's own grants are put back exactly as they were.
    if (grantsBefore === null) fs.rmSync(grantsFile, { force: true });
    else fs.writeFileSync(grantsFile, grantsBefore);
    await app?.close().catch(() => {});
    fs.writeFileSync(path.resolve(out, "results.json"), JSON.stringify(results, null, 1));
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
