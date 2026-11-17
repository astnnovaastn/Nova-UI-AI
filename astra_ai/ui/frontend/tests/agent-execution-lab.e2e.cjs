// Acceptance checks for the AEGIS Agent Execution Lab. Local only: any request that is not to the
// lab's own loopback origin is aborted and counted as a failure. No backend, no AI, no saved data.
//
//   node tests/work-layout-lab-server.cjs        (serves both labs)
//   node tests/agent-execution-lab.e2e.cjs
//
// Playwright is taken from PLAYWRIGHT_PATH when set, else from this project's node_modules.
const path = require('node:path'), fs = require('node:fs');
const load = () => { for (const name of [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core', '@playwright/test'].filter(Boolean)) { try { return require(name); } catch {} } throw new Error('Playwright not found. Set PLAYWRIGHT_PATH to a playwright-core folder.'); };
const { chromium } = load();
const origin = `http://127.0.0.1:${process.env.LAB_PORT || 5199}`;
const base = origin + '/dev/agent-execution-lab/';
const shots = path.resolve(__dirname, '../agent-execution-lab-verification');
fs.mkdirSync(shots, { recursive: true });
const results = [], failures = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); if (!ok) failures.push(`${name} ${detail}`); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`); };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.LAB_CHANNEL || 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  let errors = [], external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 240)); });
  await page.route('**/*', (route) => { const url = route.request().url(); if (url.startsWith(origin) || /^(data|blob):/.test(url)) return route.continue(); external.push(url.slice(0, 160)); return route.abort(); });
  const lab = () => page.evaluate(() => window.__agentLab);
  const open = async (query = '') => { errors = []; external = []; await page.goto(base + query, { waitUntil: 'load' }); await page.waitForTimeout(700); };
  const toEnd = async () => { await page.click('[data-action=end]'); await page.waitForTimeout(1600); return lab(); };
  const shot = (name) => page.screenshot({ path: path.join(shots, name + '.png') });
  const kinds = (events, kind) => events.filter((event) => event.kind === kind);
  const made = (events) => kinds(events, 'artifact_created').map((event) => event.data.kind);

  // 1–2. The lab opens on its own route and links to the Work Layout Lab, and back.
  await open('?auto=1');
  check('Agent Execution Lab opens at /dev/agent-execution-lab/', (await page.title()) === 'AEGIS Agent Execution Lab');
  const back = await page.getAttribute('[data-nav=layout]', 'href');
  check('links to the Work Layout Lab', back === '/dev/work-layout-lab/');
  await page.goto(origin + '/dev/work-layout-lab/', { waitUntil: 'load' }); await page.waitForTimeout(900);
  check('Work Layout Lab still opens and links here', (await page.title()) === 'AEGIS Work Layout Lab' && (await page.getAttribute('[data-nav=agent]', 'href')) === '/dev/agent-execution-lab/');

  // 3. Every workflow runs to its end: no errors, nothing outside the origin, objects on the canvas.
  await open('?auto=1');
  const ids = await page.$$eval('[data-control=workflow] option', (options) => options.map((option) => option.value));
  check('21 simulations listed (17 Zephium workflows, 3 AEGIS modes, 1 stress run)', ids.length === 21, `${ids.length}`);
  const signatures = new Map();
  const runs = {};
  for (const id of ids) {
    await open(`?auto=1&workflow=${id}`);
    const started = Date.now();
    const state = await toEnd();
    const elapsed = Date.now() - started;
    const nodes = await page.$$eval('.svelte-flow__node', (all) => all.length);
    const last = state.events.at(-1);
    runs[id] = state.events;
    signatures.set(id, [...new Set(made(state.events))].sort().join(','));
    check(`${id}: finishes, draws, no errors, no outside requests`, last?.kind === 'run_completed' && last.data?.status === 'completed' && nodes > 2 && !errors.length && !external.length, `${state.events.length} events · ${nodes} canvas items · ${made(state.events).length} objects${errors.length ? ' · ' + errors[0] : ''}${external.length ? ' · ' + external[0] : ''}`);
    if (id === 'stress') check('stress run renders 16 parts in under 6 s', elapsed < 6000, `${elapsed} ms`);
  }
  await shot('workflow-stress');
  check('workflows produce different compositions', new Set(signatures.values()).size >= 14, `${new Set(signatures.values()).size} distinct object sets`);

  // 4–7. Source references, prompt routing, skills, structured plan.
  await open('?auto=1');
  await page.fill('[data-control=prompt]', 'Map the architecture of my repository');
  await page.click('[data-action=submit]');
  await page.waitForTimeout(400);
  const routed = await page.textContent('[data-route]');
  check('a typed prompt is routed by Zephium\'s own workflowOf', /workflowOf/.test(routed) && (await lab()).fixture === 'map-a-project', routed.slice(0, 120));
  const typed = await toEnd();
  check('typed prompt (no grant.skill): the lead loads the skill itself', kinds(typed.events, 'skill_loaded').some((event) => event.actor === 'lead' && event.data.name === 'map-a-project'));
  check('skill is drawn as an input beside the request (genuine InputMark)', await page.locator('[data-lab-view]').getByText('Map a project', { exact: false }).count() > 0);
  await page.click('[data-tab=events]');
  await page.click('[data-events] tbody tr:has-text("skill_loaded")');
  const skillPanel = await page.textContent('[data-inspector]');
  check('Skill inspector: why, tools, definition and body', /Why it was selected/.test(skillPanel) && /describe_project/.test(skillPanel) && (await page.locator('[data-skill-body]').count()) === 1);
  await page.click('[data-events] tbody tr:has-text("tool_completed")');
  const toolPanel = await page.textContent('[data-inspector]');
  check('tool inspector: input schema, output, handler and source file', /Input schema/.test(toolPanel) && /Backend handler/.test(toolPanel) && /crates\/zephium-app/.test(toolPanel) && /Zephium source/.test(toolPanel));
  await page.click('[data-tab=plan]');
  const planRows = await page.$$eval('[data-plan] tbody tr', (rows) => rows.map((row) => row.textContent));
  check('structured plan (AEGIS IR) is visible with dependencies and statuses', planRows.length >= 4 && planRows.some((row) => /part:architecture/.test(row)) && planRows.every((row) => /done/.test(row)), `${planRows.length} tasks`);
  await shot('plan-map-a-project');

  // 9–10. Parallel parts and dependencies.
  const stress = runs.stress;
  let running = 0, peak = 0;
  for (const event of stress) { if (event.kind === 'task_started') peak = Math.max(peak, ++running); if (event.kind === 'task_completed' || event.kind === 'task_failed') running = Math.max(0, running - 1); }
  check('parts run in parallel, at most four at once (PARALLEL_PARTS)', peak === 4, `peak ${peak}`);
  check('sixteen parts start; the seventeenth is refused (MAX_WORK_PARTS)', kinds(stress, 'task_queued').length === 16 && kinds(stress, 'tool_refused').some((event) => /at most 16 parts/.test(event.detail)));
  await open('?auto=1&workflow=deep-research&tab=graph'); await toEnd();
  const graph = await page.evaluate(() => ({ edges: [...document.querySelectorAll('[data-edge]')].map((edge) => edge.dataset.edge), nodes: document.querySelectorAll('[data-node]').length }));
  check('execution graph draws recorded dependencies only', graph.nodes > 20 && ['calls', 'starts', 'reports', 'cites', 'produces'].every((kind) => graph.edges.includes(kind)), `${graph.nodes} nodes · ${graph.edges.length} edges`);
  await page.click('button.fit'); await page.waitForTimeout(300);
  await shot('graph-deep-research');
  const verify = runs['deep-research'].find((event) => event.kind === 'task_queued' && event.data.title === 'Verify');
  const firstWave = runs['deep-research'].filter((event) => event.kind === 'task_completed' && event.t <= verify.t);
  check('verification part starts only after the three research parts report', firstWave.length === 3);

  // 11–15. Website reading, documents, charts, code and diagrams through the existing renderers.
  const teardown = runs['ui-teardown'];
  check('website reads create cited source records and page frames', kinds(teardown, 'source_collected').length === 7 && kinds(teardown, 'tool_completed').filter((event) => event.tool === 'read').length === 7);
  check('page text addressed to the agent stays data', teardown.some((event) => event.data?.result?.untrusted && /not followed/.test(event.detail)) && !made(teardown).includes('picks'));
  check('document operations create document objects', made(runs['deep-research']).includes('document') && made(runs['knowledge-map']).includes('document'));
  check('chart operations use the Plot renderer', kinds(runs['pricing-research'], 'artifact_created').some((event) => event.data.kind === 'plot' && /leadView/.test(event.data.renderer)));
  check('code and diagram use the existing renderers', ['code', 'diagram'].every((kind) => kinds(runs['explain-code'], 'artifact_created').some((event) => event.data.kind === kind && /board adapter/.test(event.data.renderer))));
  check('a project object comes from describe_project, not the model', kinds(runs['map-a-project'], 'artifact_created').some((event) => event.data.kind === 'project' && event.cause && runs['map-a-project'].find((other) => other.id === event.cause)?.tool === 'describe_project'));
  check('unsupported output is refused with a diagnostic, not drawn as text', kinds(runs['campaign-plan'], 'artifact_refused').some((event) => /kind is one of/.test(event.detail)) && !made(runs['campaign-plan']).includes('kanban'));

  // 17–18. Pause, step, replay — and replay repeats nothing.
  await open('?workflow=competitor-landscape&speed=140');
  await page.click('[data-action=start]'); await page.waitForTimeout(900);
  await page.click('[data-action=pause]');
  const paused = (await lab()).cursor; await page.waitForTimeout(700);
  check('pause holds the run', (await lab()).cursor === paused && paused > 0, `at ${paused}`);
  await page.click('[data-action=step]');
  check('step advances exactly one event', (await lab()).cursor === paused + 1);
  const finished = await toEnd();
  const before = finished.handlersEver;
  await page.waitForTimeout(400);
  check('finished run is saved in the lab\'s own memory', (await lab()).saved >= 1);
  await page.click('[data-action=replay]'); await page.waitForTimeout(400);
  check('replay is labelled', (await page.locator('[data-replaying]').count()) === 1);
  await page.click('[data-action=end]'); await page.waitForTimeout(600);
  const after = await lab();
  check('replay runs no tool handler (no external action can repeat)', after.handlersEver === before && after.cursor === finished.events.length, `handlers ${before} → ${after.handlersEver}`);

  // Approvals: pause, approve, decline.
  await open('?workflow=fix-a-bug&speed=40');
  await page.click('[data-action=start]');
  await page.waitForSelector('[data-approval=file]', { timeout: 15000 });
  const held = await lab();
  check('a file change waits for approval', held.waiting && held.events.at(-1).kind === 'approval_requested');
  await shot('approval-fix-a-bug');
  await page.click('[data-decide=approve]');
  await page.waitForFunction(() => window.__agentLab.events.at(-1)?.kind === 'run_completed' && window.__agentLab.cursor === window.__agentLab.events.length, null, { timeout: 20000 });
  const approved = await lab();
  const tests = kinds(approved.events, 'tool_completed').filter((event) => event.tool === 'python_tests');
  check('approved: the edit is applied and success is claimed only after the tests pass', /3 passed/.test(tests.at(-1)?.detail) && made(approved.events).includes('diff') && /fraction/.test(kinds(approved.events, 'artifact_created').at(-1).data.title));
  await open('?workflow=fix-a-bug&speed=40');
  await page.click('[data-action=start]');
  await page.waitForSelector('[data-approval=file]', { timeout: 15000 });
  await page.click('[data-decide=decline]');
  await page.waitForFunction(() => window.__agentLab.events.at(-1)?.kind === 'run_completed' && window.__agentLab.cursor === window.__agentLab.events.length, null, { timeout: 20000 });
  const declined = await lab();
  const reply = kinds(declined.events, 'artifact_created').at(-1).data;
  check('declined: nothing is written, the tests still fail and the reply says so', !made(declined.events).includes('diff') && !made(declined.events).includes('draft') && /not applied/.test(reply.title) && /1 failed/.test(kinds(declined.events, 'tool_completed').filter((event) => event.tool === 'python_tests').at(-1).detail));
  await open('?workflow=plan-my-day&speed=40');
  await page.click('[data-action=start]');
  await page.waitForSelector('[data-approval]', { timeout: 15000 });
  const firstAsk = (await lab()).events.at(-1);
  check('personal data is asked for first (context question)', firstAsk.data.purpose === 'context');
  await page.click('[data-decide=approve]');
  await page.waitForSelector('[data-approval=connection]', { timeout: 15000 });
  await page.click('[data-decide=approve]');
  await page.waitForSelector('[data-approval=entry]', { timeout: 15000 });
  await page.click('[data-decide=approve]');
  await page.waitForFunction(() => window.__agentLab.events.at(-1)?.kind === 'run_completed' && window.__agentLab.cursor === window.__agentLab.events.length, null, { timeout: 20000 });
  const day = await lab();
  check('Gmail and Slack started together share one entry question', kinds(day.events, 'approval_requested').filter((event) => event.data.purpose === 'entry').length === 1);

  // Permissions and capability checks.
  await open('?auto=1&workflow=quick-research');
  await page.click('[data-permission=web]');
  const offline = await toEnd();
  check('with the web turned off, searches and reads are refused and no object claims them', kinds(offline.events, 'tool_refused').length >= 3 && !made(offline.events).includes('sheet'));
  await open('?auto=1&workflow=map-a-project');
  await page.selectOption('select[aria-label="lead model"]', 'lab:no-tools');
  const refused = await toEnd();
  check('a lead model without tool calling is refused before anything runs', refused.events.at(-1).kind === 'run_stopped' && refused.handlerCalls === 0);
  await open('?auto=1&workflow=fix-a-bug');
  const noFolder = await (async () => { await page.click('[data-permission=folder_read]'); return toEnd(); })();
  check('without the folder, the computer part ends with need allow_folder', kinds(noFolder.events, 'task_failed').some((event) => event.data.need?.kind === 'allow_folder'));

  // Views.
  await open('?auto=1&workflow=map-a-project&tab=tools');
  check('tool registry lists every tool, bash marked unavailable', (await page.$$('[data-tools] tbody tr')).length >= 22 && /unavailable/.test(await page.textContent('[data-tools] tbody tr:has-text("bash")')));
  await page.click('[data-tab=providers]');
  check('provider matrix shows the configured models and no key', /gpt-oss-120b/.test(await page.textContent('[data-providers]')) && !/sk-|AIza|nvapi-|gsk_/.test(await page.content()));
  await open('?auto=1&workflow=learning-path'); await toEnd();
  await shot('canvas-learning-path');
  check('no request ever left the page in these checks', !external.length);

  fs.writeFileSync(path.join(shots, 'results.json'), JSON.stringify({ at: new Date().toISOString(), passed: results.filter((r) => r.ok).length, failed: failures.length, results }, null, 2));
  console.log(`\n${results.length - failures.length} passed, ${failures.length} failed`);
  await browser.close();
  process.exit(failures.length ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(2); });
