// Acceptance checks for the AEGIS Work Layout Lab. Local only: every request that is not to the
// lab's own loopback origin is aborted and counted as a failure. No backend, no AI, no saved data.
//
//   node tests/work-layout-lab-server.cjs      (in one terminal)
//   node tests/work-layout-lab.e2e.cjs         (in another)
//
// Playwright is taken from PLAYWRIGHT_PATH when set, else from this project's node_modules.
const path = require('node:path'), fs = require('node:fs');
const load = () => { for (const name of [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core', '@playwright/test'].filter(Boolean)) { try { return require(name); } catch {} } throw new Error('Playwright not found. Set PLAYWRIGHT_PATH to a playwright-core folder.'); };
const { chromium } = load();
const origin = `http://127.0.0.1:${process.env.LAB_PORT || 5199}`;
const base = origin + '/dev/work-layout-lab/';
const shots = path.resolve(__dirname, '../work-layout-lab-verification');
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
  const open = async (entry, extra = '') => { errors = []; external = []; await page.goto(`${base}?entry=${entry}${extra}`, { waitUntil: 'load' }); await page.waitForTimeout(1600); };
  const shot = (name) => page.screenshot({ path: path.join(shots, name + '.png') });

  await open('ws-architecture');
  const entries = await page.$$eval('[data-entry]', (nodes) => nodes.map((node) => node.dataset.entry));
  check('catalogue lists every registered entry', entries.length >= 55, `${entries.length} entries`);

  // 1. Every entry renders without errors or outside requests.
  const perEntry = {};
  for (const entry of entries) {
    await open(entry);
    const stage = await page.evaluate(() => ({
      nodes: document.querySelectorAll('.svelte-flow__node').length,
      edges: document.querySelectorAll('.svelte-flow__edge').length,
      specimens: document.querySelectorAll('[data-specimen]').length,
      text: document.querySelector('[data-lab-view]')?.textContent?.trim().length ?? 0,
    }));
    perEntry[entry] = stage;
    const drew = stage.nodes > 0 || stage.specimens > 0 || stage.text > 200;
    check(`renders: ${entry}`, drew && !errors.length && !external.length, `${stage.nodes} nodes, ${stage.edges} lines, ${stage.specimens} specimens${errors.length ? ' · errors: ' + errors.slice(0, 2).join(' | ') : ''}${external.length ? ' · external: ' + external[0] : ''}`);
    if (/^(ws-|lay-|ask-|start-)/.test(entry) || ['object-picks', 'object-diagram', 'object-plan', 'object-sheet', 'object-plot', 'object-project', 'object-draft', 'object-media', 'object-page', 'object-code'].includes(entry)) await shot(entry);
  }

  // 2. Connections: the layout demonstrations draw the lines their algorithm says they should.
  check('one-to-one draws one line', perEntry['lay-one-to-one']?.edges === 1, `${perEntry['lay-one-to-one']?.edges}`);
  check('one-to-many forks to four parts', perEntry['lay-one-to-many']?.edges >= 4, `${perEntry['lay-one-to-many']?.edges}`);
  check('many-to-one merges three rows into the result', perEntry['lay-many-to-one']?.edges >= 6, `${perEntry['lay-many-to-one']?.edges}`);
  check('merge-then-fork links two columns', perEntry['lay-mixed']?.edges >= 8, `${perEntry['lay-mixed']?.edges}`);

  // 3. Pan and zoom on the genuine canvas.
  await open('ws-research');
  const transform = () => page.$eval('.svelte-flow__viewport', (node) => node.style.transform);
  const before = await transform();
  const box = await page.locator('[data-lab-view]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -400); await page.keyboard.up('Control');
  await page.waitForTimeout(500);
  const zoomed = await transform();
  check('canvas zooms', zoomed !== before, `${before} → ${zoomed}`);
  await page.keyboard.press('h');
  await page.mouse.move(box.x + 300, box.y + 700); await page.mouse.down(); await page.mouse.move(box.x + 420, box.y + 620, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(400);
  check('canvas pans', (await transform()) !== zoomed);
  await page.keyboard.press('v');

  // 4. Select a card: the inspector reports it. Drag it: it moves and its lines follow.
  // (A part row's name and pages are `nodrag` in Zephium: they open the part. An object card is the person's to move.)
  await open('lay-many-to-one');
  const node = page.locator('.svelte-flow__node').filter({ hasText: 'Three reports, one conclusion' }).first();
  const at = await node.boundingBox();
  const lineBefore = await page.$$eval('.svelte-flow__edge path', (paths) => paths.map((p) => p.getAttribute('d')).join('|'));
  await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2); await page.mouse.down(); await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2 + 110, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(600);
  const moved = await node.boundingBox();
  check('a card can be dragged', Math.abs(moved.y - at.y) > 40, `${Math.round(at.y)} → ${Math.round(moved.y)}`);
  const lineAfter = await page.$$eval('.svelte-flow__edge path', (paths) => paths.map((p) => p.getAttribute('d')).join('|'));
  check('lines follow the dragged card', lineAfter !== lineBefore);
  check('inspector shows the selection', (await page.locator('.inspector').textContent()).includes('Selected on canvas'));
  await shot('interaction-drag');

  // 5. Replay: deterministic beats, the canvas grows with them.
  await open('ws-launch', '&beat=1');
  const first = await page.locator('.svelte-flow__node').count();
  await page.getByRole('button', { name: 'Next beat' }).click(); await page.getByRole('button', { name: 'Next beat' }).click(); await page.getByRole('button', { name: 'Next beat' }).click();
  await page.waitForTimeout(700);
  const mid = await page.locator('.svelte-flow__node').count();
  await shot('replay-mid');
  await page.locator('.replay input[type=range]').evaluate((input) => { input.value = input.max; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(1200);
  const last = await page.locator('.svelte-flow__node').count();
  check('replay adds cards beat by beat', first < mid && mid < last, `${first} → ${mid} → ${last}`);
  check('replay raised no errors', !errors.length, errors.slice(0, 2).join(' | '));

  // 6. Specimens: select, resize (the object re-lays itself out), open in the centre.
  await open('object-sheet');
  const specimen = page.locator('[data-specimen]').first();
  await specimen.locator('figcaption').click({ position: { x: 60, y: 8 } });
  check('selecting a specimen fills the inspector', (await page.locator('.inspector').textContent()).includes('Selected specimen'));
  const wide = (await specimen.boundingBox()).width;
  const grip = await specimen.locator('.grip').boundingBox();
  await page.mouse.move(grip.x + 6, grip.y + grip.height / 2); await page.mouse.down(); await page.mouse.move(grip.x - 220, grip.y + grip.height / 2, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(400);
  check('a specimen can be resized', (await specimen.boundingBox()).width < wide - 80, `${Math.round(wide)} → ${Math.round((await specimen.boundingBox()).width)}`);
  await specimen.getByRole('button', { name: 'Open' }).click();
  await page.waitForTimeout(900);
  check('Open shows the object in the centre', (await page.locator('.inspector .log').textContent()).includes('Opened sheet'));
  await shot('interaction-open');
  await page.keyboard.press('Escape');

  // 7. Themes.
  await open('ws-competitors', '&theme=light');
  check('light theme applies', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light');
  await shot('theme-light');

  fs.writeFileSync(path.join(shots, 'results.json'), JSON.stringify({ ran: new Date().toISOString(), origin, passed: results.filter((r) => r.ok).length, failed: failures.length, results, perEntry }, null, 1));
  await browser.close();
  console.log(`\n${results.filter((r) => r.ok).length} passed, ${failures.length} failed. Screenshots: ${shots}`);
  process.exit(failures.length ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(2); });
