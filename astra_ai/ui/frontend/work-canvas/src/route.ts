/**
 * Strings that would cut through a card go around it instead: along the free band over the
 * cards, down the gutter beside the card they reach, and in at its port, with rounded corners.
 * Everything here is in canvas (flow) coordinates, the same space the cards and ports live in,
 * so routes hold at every zoom and follow cards as they move.
 */
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** Room kept around a card, and the caption band over it. */
export const CLEAR = 6;
export const CAPTION_BAND = 30;
/** How far beside a port the string turns. */
export const TURN = 22;
/** How far into a corridor a shared trunk stands from the cards it serves. */
export const TRUNK = 56;
const RADIUS = 26;

const grown = (rect: Rect): Rect => ({
  x: rect.x - CLEAR,
  y: rect.y - CLEAR - CAPTION_BAND,
  width: rect.width + CLEAR * 2,
  height: rect.height + CLEAR * 2 + CAPTION_BAND,
});

/** Whether the straight segment a→b (horizontal or vertical) touches any card. */
export function segmentHits(a: Point, b: Point, obstacles: readonly Rect[]): boolean {
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const y2 = Math.max(a.y, b.y);
  return obstacles.some((raw) => {
    const r = grown(raw);
    return x1 < r.x + r.width && x2 > r.x && y1 < r.y + r.height && y2 > r.y;
  });
}

/** Whether a cubic curve passes through any card, sampled along its length. */
export function curveHits(p0: Point, p1: Point, p2: Point, p3: Point, obstacles: readonly Rect[], samples = 28): boolean {
  if (!obstacles.length) return false;
  for (let i = 2; i < samples - 1; i++) {
    const t = i / samples;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    if (obstacles.some((raw) => {
      const r = grown(raw);
      return x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height;
    })) return true;
  }
  return false;
}

/**
 * A route from a right-hand port to a left-hand port that stays clear of every card, or null when
 * none is needed or none is found (the caller keeps its curve). `lane` spreads parallel strands.
 */
export function routeAround(s: Point, t: Point, obstacles: readonly Rect[], lane = 0, options: { merge?: boolean } = {}): Point[] | null {
  // A string that runs backwards, right to left, leaves its card, finds a free corridor and
  // comes back to the other card's port, instead of cutting across everything between.
  const backwards = t.x - s.x < TURN * 3;
  // Room for a trunk on each side, never more than a third of the way across.
  const reach = backwards ? TURN : Math.min(TRUNK, (t.x - s.x) / 3);
  const x1 = s.x + reach + lane;
  const x2 = t.x - reach + lane;
  const last = (y: number) => [{ x: x2, y }, { x: x2, y: t.y }, t];
  // A short hop branches off a trunk beside its target: straight along the source's height, then
  // along the trunk and into the card. Strings fanning out from one card share that trunk.
  // A long hop merges first, beside its own column, and crosses in one shared corridor.
  if (!backwards && !options.merge && !segmentHits(s, { x: x2, y: s.y }, obstacles) && !segmentHits({ x: x2, y: s.y }, { x: x2, y: t.y }, obstacles))
    return [s, ...last(s.y)];
  // Otherwise the nearest free corridor: over or under the cards in the way.
  const ys = new Set<number>([t.y]);
  for (const raw of obstacles) {
    const r = grown(raw);
    ys.add(r.y - 4 + lane);
    ys.add(r.y + r.height + 4 + lane);
  }
  // The corridor nearest the target first: strings into one card then share it, as one trunk,
  // instead of each taking its own line across the canvas.
  // Merging strings choose by their target alone, so all of them meet in the same corridor.
  const cost = (y: number) => Math.abs(y - t.y) * 3 + (options.merge ? 0 : Math.abs(y - s.y));
  const corridors = [...ys].sort((a, b) => cost(a) - cost(b) || a - b);
  // Where it turns: beside its ports first; when a card stands in that gutter, further into the
  // corridor (never past the middle), so a clear corridor is not given up for a blocked gutter.
  const middle = (s.x + t.x) / 2;
  const turns1 = backwards ? [x1] : [x1, x1 + reach, x1 + reach * 2].filter((x, i) => !i || x < middle);
  const turns2 = backwards ? [x2] : [x2, x2 - reach, x2 - reach * 2].filter((x, i) => !i || x > middle);
  for (const y of corridors) {
    for (const a of turns1) {
      if (segmentHits({ x: a, y: s.y }, { x: a, y }, obstacles) || (a !== x1 && segmentHits({ x: x1, y: s.y }, { x: a, y: s.y }, obstacles))) continue;
      for (const b of turns2) {
        if (segmentHits({ x: a, y }, { x: b, y }, obstacles)) continue;
        if (segmentHits({ x: b, y }, { x: b, y: t.y }, obstacles) || (b !== x2 && segmentHits({ x: b, y: t.y }, { x: x2, y: t.y }, obstacles))) continue;
        return [s, { x: a, y: s.y }, { x: a, y }, { x: b, y }, { x: b, y: t.y }, t];
      }
    }
  }
  return null;
}

/** The route as one smooth path: straight runs joined by rounded corners. Also its middle, for a label. */
export function roundedPath(points: readonly Point[], radius = RADIUS, canRound?: (a: Point, b: Point, c: Point) => boolean,
  segment = (_start: Point, end: Point) => ` L ${end.x},${end.y}`,
  cubicCorners = false,
): { d: string; mid: Point } {
  const pts = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y) > 0.5);
  let d = `M ${pts[0]!.x},${pts[0]!.y}`;
  let at = pts[0]!;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const c = pts[i + 1]!;
    const before = Math.hypot(b.x - a.x, b.y - a.y);
    const after = Math.hypot(c.x - b.x, c.y - b.y);
    let r = Math.min(radius, before / 2, after / 2);
    const offset = (point: Point, length: number) =>
      ({ x: b.x + (point.x - b.x) * r / length, y: b.y + (point.y - b.y) * r / length });
    let entry = offset(a, before), exit = offset(c, after);
    while (cubicCorners && canRound && r > 1 && !canRound(entry, b, exit)) {
      r /= 2;
      entry = offset(a, before);
      exit = offset(c, after);
    }
    if (!canRound || canRound(entry, b, exit)) {
      const corner = cubicCorners
        ? ` C ${(entry.x + 2 * b.x) / 3},${(entry.y + 2 * b.y) / 3} ${(exit.x + 2 * b.x) / 3},${(exit.y + 2 * b.y) / 3} ${exit.x},${exit.y}`
        : ` Q ${b.x},${b.y} ${exit.x},${exit.y}`;
      d += segment(at, entry) + corner;
      at = exit;
    } else {
      d += segment(at, b);
      at = b;
    }
  }
  const end = pts.at(-1)!;
  d += segment(at, end);
  // The middle of the longest run carries the label.
  let best = { x: (pts[0]!.x + end.x) / 2, y: (pts[0]!.y + end.y) / 2 };
  let longest = -1;
  for (let i = 1; i < pts.length; i++) {
    const length = Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    if (length > longest) [longest, best] = [length, { x: (pts[i]!.x + pts[i - 1]!.x) / 2, y: (pts[i]!.y + pts[i - 1]!.y) / 2 }];
  }
  return { d, mid: best };
}

/**
 * The same route drawn as one flowing string: straight runs along each corridor, joined by
 * S-curves that leave and arrive horizontally, so a detour reads as a soft bend, never an elbow.
 */
export function smoothPath(points: readonly Point[]): { d: string; mid: Point } {
  const pts = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y) > 0.5);
  // The horizontal runs; the vertical steps between them become the bends.
  const runs: { x1: number; x2: number; y: number }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (Math.abs(a.y - b.y) < 0.5) runs.push({ x1: a.x, x2: b.x, y: a.y });
  }
  if (runs.length < 2) return roundedPath(points);
  const room = runs.map((run) => Math.abs(run.x2 - run.x1));
  let d = `M ${runs[0]!.x1},${runs[0]!.y}`;
  for (let i = 0; i < runs.length - 1; i++) {
    const a = runs[i]!;
    const b = runs[i + 1]!;
    const x = a.x2;
    const dy = Math.abs(b.y - a.y);
    const dirA = Math.sign(a.x2 - a.x1) || 1;
    const dirB = Math.sign(b.x2 - b.x1) || dirA;
    // End runs may give all their length to a bend; inner runs share theirs between two bends.
    const before = i === 0 ? room[i]! : room[i]! / 2;
    const after = i + 1 === runs.length - 1 ? room[i + 1]! : room[i + 1]! / 2;
    const w = Math.max(4, Math.min(dy * 0.55 + 18, 120, before, after));
    d += ` L ${x - dirA * w},${a.y} C ${x},${a.y} ${x},${b.y} ${x + dirB * w},${b.y}`;
  }
  const last = runs.at(-1)!;
  d += ` L ${last.x2},${last.y}`;
  let best = { x: (runs[0]!.x1 + last.x2) / 2, y: (runs[0]!.y + last.y) / 2 };
  let longest = -1;
  for (const [i, run] of runs.entries()) if (room[i]! > longest) [longest, best] = [room[i]!, { x: (run.x1 + run.x2) / 2, y: run.y }];
  return { d, mid: best };
}

/**
 * The direct string between two facing ports: a cubic that leaves the source and enters the target
 * horizontally, so strings from one port fan out from the same point and strings into one port
 * gather into it. `spread` lifts a parallel strand a little off its neighbours.
 */
export function facingCurve(s: Point, t: Point, spread = 0) {
  const k = Math.max(36, (t.x - s.x) * 0.5);
  const c1 = { x: s.x + k, y: s.y + spread };
  const c2 = { x: t.x - k, y: t.y + spread };
  return {
    d: `M ${s.x},${s.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${t.x},${t.y}`,
    controls: [c1, c2] as const,
    mid: { x: (s.x + 3 * c1.x + 3 * c2.x + t.x) / 8, y: (s.y + 3 * c1.y + 3 * c2.y + t.y) / 8 },
  };
}

/**
 * A string to a card several columns away goes through the columns in between, the way a diagram
 * line does: across each column it runs straight, either through the gap where it already is or,
 * when a card stands there, through that card from its left port to its right port (the card hides
 * that stretch). Between columns it bends in an S. It never wraps around the canvas, and strings
 * crossing the same card share its ports, so they merge into the pipeline instead of crowding it.
 * Returns null when no card stands between the two ends.
 */
export function passThrough(s: Point, t: Point, cards: readonly Rect[], lane = 0, options: { viaCards?: boolean } = {}): { d: string; mid: Point; through: Rect[] } | null {
  const between = cards.filter((r) => r.x > s.x + 8 && r.x + r.width < t.x - 8);
  if (!between.length) return null;
  // Columns: cards whose horizontal spans overlap.
  const columns: { x1: number; x2: number; cards: Rect[] }[] = [];
  for (const r of [...between].sort((a, b) => a.x - b.x)) {
    const last = columns.at(-1);
    if (last && r.x < last.x2) {
      last.cards.push(r);
      last.x2 = Math.max(last.x2, r.x + r.width);
    } else columns.push({ x1: r.x, x2: r.x + r.width, cards: [r] });
  }
  const passes: { x1: number; x2: number; y: number }[] = [];
  const through: Rect[] = [];
  let at = s;
  for (const column of columns) {
    // Where the string would be at this column if it ran straight from here to its target.
    const share = (column.x1 - at.x) / Math.max(1, t.x - at.x);
    const want = at.y + (t.y - at.y) * Math.max(0, Math.min(1, share));
    const clear = (y: number) => !column.cards.some((r) => y > r.y - CAPTION_BAND - CLEAR && y < r.y + r.height + CLEAR);
    let y: number;
    if (!options.viaCards && clear(want)) y = want + lane;
    else if (!options.viaCards) {
      // Through the nearest gap in the column (between its cards, above or below them), never through
      // a card the data does not pass: crossing a box would claim it processed what it never saw.
      const sorted = [...column.cards].sort((a, b) => a.y - b.y);
      const gaps: number[] = [sorted[0]!.y - CAPTION_BAND - CLEAR - 14, sorted.at(-1)!.y + sorted.at(-1)!.height + CLEAR + 14];
      for (let i = 1; i < sorted.length; i++) {
        const top = sorted[i - 1]!.y + sorted[i - 1]!.height + CLEAR;
        const next = sorted[i]!.y - CAPTION_BAND - CLEAR;
        if (next - top >= 10) gaps.push((top + next) / 2);
      }
      y = gaps.filter(clear).sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0] ?? want;
      y += lane;
    } else {
      const card = column.cards.reduce((best, r) => (Math.abs(r.y + r.height / 2 - want) < Math.abs(best.y + best.height / 2 - want) ? r : best));
      y = card.y + card.height / 2;
      through.push(card);
    }
    passes.push({ x1: column.x1, x2: column.x2, y });
    at = { x: column.x2, y };
  }
  const bend = (a: Point, b: Point) => {
    const k = Math.max(24, (b.x - a.x) * 0.5);
    return ` C ${a.x + k},${a.y} ${b.x - k},${b.y} ${b.x},${b.y}`;
  };
  let d = `M ${s.x},${s.y}`;
  let from = s;
  for (const pass of passes) {
    d += bend(from, { x: pass.x1, y: pass.y }) + ` L ${pass.x2},${pass.y}`;
    from = { x: pass.x2, y: pass.y };
  }
  d += bend(from, t);
  const first = passes[0]!;
  return { d, mid: { x: (s.x + first.x1) / 2, y: (s.y + first.y) / 2 }, through };
}
