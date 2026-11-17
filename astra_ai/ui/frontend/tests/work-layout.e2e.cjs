// Spatial layout and connection checks on a saved research run, with no model or search spend.
// Opens the run from the Library and checks, at 25%, 50%, 100% and 150% zoom: every string ends on
// its card's visible border, source captions sit directly above their cards, no cards overlap, the
// run reads left to right, Auto Arrange is gone. Then reload stability and a drag that persists.
// Usage: node tests/work-layout.e2e.cjs "<library search>" <output folder> [--drag]
// --drag moves one card and saves it to that run's layout (then moves it back).
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const args = process.argv.slice(2);
const drag = args.includes("--drag");
// --fresh views the run as composed, ignoring (and never writing) its saved arrangement.
const fresh = args.includes("--fresh");
const zoomArg = args.find((a) => a.startsWith("--zooms="));
const ZOOMS = zoomArg ? zoomArg.slice(8).split(",").map((z) => +z / 100) : [0.29, 0.5, 0.75, 1];
const [search = "heat pump", out = "work-layout-shots"] = args.filter((a) => !a.startsWith("--"));
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + String(detail).slice(0, 300) + ")" : ""}`);
};

/** Cards, what each draws, captions and string ends, in screen pixels. */
function measure() {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.x + r.width, b: r.y + r.height };
  };
  const nodes = {};
  for (const n of document.querySelectorAll(".svelte-flow__node")) {
    if (n.classList.contains("svelte-flow__node-agent")) continue;
    const id = n.getAttribute("data-id");
    const part = n.querySelector(".part:not(.label-only)");
    const drawn = part?.querySelector(".stack, .slot");
    nodes[id] = {
      id,
      node: box(n),
      // What the person sees as the card: a source's windows, or the card itself.
      card: drawn ? box(drawn) : box(n),
      label: part ? box(part.querySelector(".label")) : null,
      kind: part ? (part.querySelector(".stack") ? "source" : "list") : (n.querySelector("[class*=paper]") ? "paper" : "card"),
    };
  }
  // Relation strings only; the thread lines between follow-up requests are not relations.
  const edges = [...document.querySelectorAll(".svelte-flow__edge")].filter((e) => e.querySelector("g.strand")).map((e) => {
    const p = e.querySelector("path.strand-line") || e.querySelector("path");
    const len = p.getTotalLength();
    const m = p.getScreenCTM();
    const at = (l) => { const q = p.getPointAtLength(l); return { x: q.x * m.a + q.y * m.c + m.e, y: q.x * m.b + q.y * m.d + m.f }; };
    const g = e.querySelector("g.strand");
    return { id: e.getAttribute("data-id"), start: at(0), end: at(len), source: g?.dataset.source, target: g?.dataset.target };
  });
  const zoom = +(document.querySelector(".svelte-flow__viewport")?.style.transform.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);
  return { nodes, edges, zoom };
}

async function zoomTo(page, target) {
  const pane = await page.locator(".canvas-card").boundingBox();
  // Zoom over empty canvas: over a report, the wheel scrolls the report instead.
  const spot = await page.evaluate(({ x, y, w, h }) => {
    for (let fy = 0.2; fy < 0.9; fy += 0.07)
      for (let fx = 0.15; fx < 0.95; fx += 0.07) {
        const el = document.elementFromPoint(x + w * fx, y + h * fy);
        if (el?.classList.contains("svelte-flow__pane")) return { x: x + w * fx, y: y + h * fy };
      }
    return { x: x + w * 0.45, y: y + h * 0.45 };
  }, { x: pane.x, y: pane.y, w: pane.width, h: pane.height });
  for (let i = 0; i < 40; i++) {
    const { zoom } = await page.evaluate(measure);
    if (Math.abs(zoom - target) / target < 0.06) return zoom;
    await page.mouse.move(spot.x, spot.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, zoom > target ? 60 : -60);
    await page.keyboard.up("Control");
    await page.waitForTimeout(90);
  }
  return (await page.evaluate(measure)).zoom;
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem("nova-current-workspace", "research"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  const modelCalls = [];
  page.on("request", (r) => /\/api\/(chat|research\/start|work\/runs$|work\/start)/.test(r.url()) && r.method() === "POST" && modelCalls.push(r.url()));
  const open = async () => {
    await page.goto("http://127.0.0.1:5173/" + (fresh ? "?aegis-fresh-layout" : ""), { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
    await page.click('.aegis-work-stage button[aria-label="Research library"]');
    await page.locator('#research-history-panel input[type="search"]').fill(search);
    await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 15000 });
    if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
    await page.waitForSelector("g.strand", { timeout: 40000 });
    await page.waitForTimeout(2500);
  };
  await open();

  check("Auto Arrange and its settings are gone", !(await page.locator(".arrange-trigger, .arrange-popover, [aria-label='Auto Arrange canvas']").count()));
  const first = await page.evaluate(measure);
  const ids = Object.keys(first.nodes);
  const sources = Object.values(first.nodes).filter((n) => n.kind === "source");
  const request = ids.find((id) => id.endsWith("-request") && !id.includes(":"));
  const paper = ids.find((id) => id.startsWith("paper:"));
  const lead = ids.find((id) => id === "worker:lead");
  const leftOf = (a, b) => first.nodes[a] && first.nodes[b] && first.nodes[a].card.r <= first.nodes[b].card.x + 1;
  // With a saved arrangement, the person's placements win over the composition: judge order only as composed.
  if (fresh) check("The run reads left to right: request, sources, AEGIS, report",
    request && paper && sources.every((s) => first.nodes[request].card.r < s.card.x && s.card.r < first.nodes[paper].card.x) && (!lead || sources.every((s) => s.card.r < first.nodes[lead].card.x)),
    `${sources.length} sources`);
  // Retrieval order runs down each column, then on to the next.
  const columns = [...new Set(sources.map((s) => Math.round(s.card.x)))].sort((a, b) => a - b);
  check("At most four visible sources or stacks per column", columns.every((x) => sources.filter((s) => Math.round(s.card.x) === x).length <= 4), columns.map((x) => sources.filter((s) => Math.round(s.card.x) === x).length).join("+"));
  // Stages stand apart by a wide corridor: clear space between successive columns of cards.
  if (fresh) {
    const cols = [];
    for (const n of Object.values(first.nodes).filter((n) => !/^map/.test(n.id)).sort((a, b) => a.card.x - b.card.x)) {
      const col = cols.find((c) => Math.abs(c.x - n.card.x) < 4);
      if (col) col.r = Math.max(col.r, n.card.r);
      else cols.push({ x: n.card.x, r: n.card.r });
    }
    const corridors = cols.slice(1).map((c, i) => (c.x - cols[i].r) / first.zoom).filter((g) => g > 0);
    check("Stages stand at least 80 units apart, the corridors between stages 130 or more", corridors.length && Math.min(...corridors) >= 80 && Math.max(...corridors) >= 130, corridors.map(Math.round).join(", "));
  }
  check("Strings carry no words until one is selected", (await page.locator("g.strand g.label").count()) === 0);

  /** Cards or captions that cover one another; a map card inside its own group is not an overlap. */
  const overlapsIn = (g) => {
    const cards = Object.values(g.nodes);
    const found = [];
    const inside = (a, b) => a.x >= b.x - 1 && a.r <= b.r + 1 && a.y >= b.y - 1 && a.b <= b.b + 1;
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i].card, b = cards[j].card;
        if (inside(a, b) || inside(b, a)) continue;
        const ay = cards[i].label ? cards[i].label.y : a.y, by = cards[j].label ? cards[j].label.y : b.y;
        if (a.x < b.r - 1 && a.r > b.x + 1 && ay < b.b - 1 && a.b > by + 1) found.push(`${cards[i].id.slice(-16)} × ${cards[j].id.slice(-16)}`);
      }
    return found;
  };
  check("No card or caption overlaps another as it opens", !overlapsIn(first).length, overlapsIn(first).slice(0, 4).join("; "));

  // A stack opens into one card per page, each with its own strings, and stacks again.
  if (await page.locator(".stack-toggle").count()) {
    const before = await page.evaluate(measure);
    const toggle = page.locator(".stack-toggle").first();
    const named = await toggle.textContent();
    await toggle.click();
    await page.waitForTimeout(1500);
    const opened = await page.evaluate(measure);
    const added = Object.keys(opened.nodes).filter((id) => !(id in before.nodes));
    check(`A stack ("${named.trim()}") opens into one card per page`, added.length >= 1 && added.length === +named.match(/\d+/)[0] - 1, `${added.length} new cards`);
    // A closed stack already draws one string per relation; opened, those reach each page's own card.
    check("Each opened page gets its own strings, and no string is lost", opened.edges.length >= before.edges.length && added.every((id) => opened.edges.some((e) => e.source === id || e.target === id)), `${before.edges.length} → ${opened.edges.length} strings`);
    check("An opened stack covers no other card", !overlapsIn(opened).length, overlapsIn(opened).slice(0, 4).join("; "));
    await page.screenshot({ path: path.join(out, "stack-open.png") });
    // Each page still opens on its own.
    const windows = () => page.locator(".browser-layer section.pane").count();
    const was = await windows();
    await page.locator(`.svelte-flow__node[data-id="${added[0]}"] .page`).first().click();
    check("An opened stack's page opens its own source window", await (async () => { for (let i = 0; i < 20; i++) { if ((await windows()) > was) return true; await page.waitForTimeout(250); } return false; })());
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("g.strand", { timeout: 40000 });
    await page.waitForTimeout(2500);
    check("An opened stack stays open after a reload", added.every((id) => page.locator(`.svelte-flow__node[data-id="${id}"]`)) && (await page.locator(`.svelte-flow__node[data-id="${added[0]}"]`).count()) === 1);
    await page.locator(".stack-toggle", { hasText: /stack pages/i }).first().click();
    await page.waitForTimeout(1500);
    const closed = await page.evaluate(measure);
    check("Stacking it again restores the cards and strings it had", Object.keys(closed.nodes).length === Object.keys(before.nodes).length && closed.edges.length === before.edges.length, `${Object.keys(closed.nodes).length} cards, ${closed.edges.length} strings`);
  }

  for (const target of ZOOMS) {
    const zoom = await zoomTo(page, target);
    await page.waitForTimeout(400);
    const pct = Math.round(target * 100);
    await page.screenshot({ path: path.join(out, `zoom-${pct}.png`) });
    const g = await page.evaluate(measure);
    const visible = (pt) => pt.x > 0 && pt.y > 0 && pt.x < 1440 && pt.y < 900;
    const tol = 2.5;
    const bad = [];
    for (const e of g.edges) {
      const s = g.nodes[e.source], t = g.nodes[e.target];
      if (!s || !t) {
        // Only a card the canvas has not drawn (outside the view) may be missing.
        if (!s && !t) bad.push(`${e.id.slice(0, 24)} has no cards`);
        continue;
      }
      // Across columns a string leaves a right edge and meets a left edge; within one column it runs
      // from a bottom edge to a top edge, or brackets out of two left edges. Each end must sit on a border.
      const onBorder = (pt, c) => {
        const inX = pt.x >= c.x - tol && pt.x <= c.r + tol;
        const inY = pt.y >= c.y - tol && pt.y <= c.b + tol;
        return (inY && (Math.abs(pt.x - c.x) <= tol || Math.abs(pt.x - c.r) <= tol)) || (inX && (Math.abs(pt.y - c.y) <= tol || Math.abs(pt.y - c.b) <= tol));
      };
      const startOk = onBorder(e.start, s.card);
      const endOk = onBorder(e.end, t.card);
      if ((!startOk && visible(e.start)) || (!endOk && visible(e.end)))
        bad.push(`${e.id.slice(0, 24)} start ${Math.round(e.start.x - s.card.r)},${Math.round(e.start.y - s.card.y)}px end ${Math.round(e.end.x - t.card.x)},${Math.round(e.end.y - t.card.y)}px`);
    }
    const checked = g.edges.filter((e) => g.nodes[e.source] && g.nodes[e.target]).length;
    check(`${pct}% (actual ${Math.round(zoom * 100)}%): every string ends on its card's border`, checked > 0 && !bad.length, `${checked} of ${g.edges.length} strings checked at both ends; ` + bad.slice(0, 4).join("; "));
    const labels = Object.values(g.nodes).filter((n) => n.label && n.kind === "source");
    const off = labels.filter((n) => !(n.label.b <= n.card.y + 0.5 && n.card.y - n.label.b < 22 * Math.max(zoom, 0.25) + 4 && Math.abs(n.label.x - n.card.x) <= 2));
    check(`${pct}%: source captions sit directly above their cards`, labels.length && !off.length, off.map((n) => n.id.slice(-20)).join(", "));
    const overlap = overlapsIn(g);
    check(`${pct}%: no card or caption overlaps another`, !overlap.length, overlap.slice(0, 4).join("; "));
  }

  // Reload: same places, nothing replayed, no organizer movement.
  const where = () => page.$$eval(".svelte-flow__node", (rows) => Object.fromEntries(rows.map((n) => [n.getAttribute("data-id"), n.style.transform])));
  const before = await where();
  const viewport = await page.evaluate(() => document.querySelector(".svelte-flow__viewport").style.transform);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("g.strand", { timeout: 40000 });
  await page.waitForTimeout(3000);
  const after = await where();
  const moved = Object.keys(before).filter((id) => id in after && before[id] !== after[id]);
  check("Reopening keeps every card where it was", !moved.length, moved.join(", "));
  check("Reopening keeps the camera", viewport === (await page.evaluate(() => document.querySelector(".svelte-flow__viewport").style.transform)));
  await page.screenshot({ path: path.join(out, "reopened.png") });

  if (drag) {
    // The person moves a card: it stays there after a reload, and nothing else moves.
    const g = await page.evaluate(measure);
    const id = Object.values(g.nodes).find((n) => n.kind === "source")?.id;
    const strip = async () => {
      const l = await page.locator(`.svelte-flow__node[data-id="${id}"] .part .label`).first().boundingBox();
      return { x: l.x + l.width - 50, y: l.y + l.height / 2 - 8 };
    };
    const hb = await strip();
    const caption = async () => page.evaluate((id) => {
      const n = document.querySelector(`.svelte-flow__node[data-id="${CSS.escape(id)}"]`);
      const l = n.querySelector(".label").getBoundingClientRect(), c = n.querySelector(".stack").getBoundingClientRect();
      return { dx: l.x - c.x, dy: c.y - l.bottom };
    }, id);
    const capBefore = await caption();
    await page.mouse.move(hb.x + 40, hb.y + 8);
    await page.mouse.down();
    await page.mouse.move(hb.x + 40, hb.y + 60, { steps: 6 });
    const capDuring = await caption();
    await page.mouse.move(hb.x + 40, hb.y + 120, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(2500);
    check("A caption travels with its card while dragged", Math.abs(capDuring.dx - capBefore.dx) < 1 && Math.abs(capDuring.dy - capBefore.dy) < 1, JSON.stringify([capBefore, capDuring]));
    const dragged = await where();
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("g.strand", { timeout: 40000 });
    await page.waitForTimeout(3000);
    const kept = await where();
    const others = Object.keys(dragged).filter((k) => k !== id && k in kept && dragged[k] !== kept[k]);
    const yOf = (t) => +(t.match(/translate\([-\d.]+px, ([-\d.]+)px\)/)?.[1] ?? 0);
    const xOf = (t) => +(t.match(/translate\(([-\d.]+)px/)?.[1] ?? 0);
    check("A dragged card stays where the person put it after reload", kept[id] === dragged[id] && kept[id] !== after[id], `opened ${after[id]}, dragged ${dragged[id]}, reloaded ${kept[id]}`);
    // Other cards move only to stay clear of it: straight down their column, never into another card.
    check("Dragging one card moves others only to keep them clear", others.every((k) => xOf(kept[k]) === xOf(dragged[k]) && yOf(kept[k]) >= yOf(dragged[k])) && !overlapsIn(await page.evaluate(measure)).length, others.join(", ") || "none moved");
    // Put it back.
    const back = await strip();
    await page.mouse.move(back.x + 40, back.y + 8);
    await page.mouse.down();
    await page.mouse.move(back.x + 40, back.y - 112, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(2500);
  }

  check("No model or research request was made", !modelCalls.length, modelCalls.join(", "));
  check("No page errors", !errors.length, errors.join(" | "));
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed.`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
