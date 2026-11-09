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
const RADIUS = 18;

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
export function routeAround(s: Point, t: Point, obstacles: readonly Rect[], lane = 0): Point[] | null {
  if (t.x - s.x < TURN * 3) return null;
  const x1 = s.x + TURN + lane;
  const x2 = t.x - TURN + lane;
  const last = (y: number) => [{ x: x2, y }, { x: x2, y: t.y }, t];
  // Straight along the source's own height, then down the gutter beside the target.
  if (!segmentHits(s, { x: x2, y: s.y }, obstacles) && !segmentHits({ x: x2, y: s.y }, { x: x2, y: t.y }, obstacles))
    return [s, ...last(s.y)];
  // Otherwise the nearest free corridor: over or under the cards in the way.
  const ys = new Set<number>([t.y]);
  for (const raw of obstacles) {
    const r = grown(raw);
    ys.add(r.y - 4 + lane);
    ys.add(r.y + r.height + 4 + lane);
  }
  const corridors = [...ys].sort((a, b) => Math.abs(a - s.y) + Math.abs(a - t.y) - (Math.abs(b - s.y) + Math.abs(b - t.y)));
  for (const y of corridors) {
    if (segmentHits({ x: x1, y: s.y }, { x: x1, y }, obstacles)) continue;
    if (segmentHits({ x: x1, y }, { x: x2, y }, obstacles)) continue;
    if (segmentHits({ x: x2, y }, { x: x2, y: t.y }, obstacles)) continue;
    return [s, { x: x1, y: s.y }, { x: x1, y }, ...last(y)];
  }
  return null;
}

/** The route as one smooth path: straight runs joined by rounded corners. Also its middle, for a label. */
export function roundedPath(points: readonly Point[]): { d: string; mid: Point } {
  const pts = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y) > 0.5);
  let d = `M ${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const c = pts[i + 1]!;
    const r = Math.min(RADIUS, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    const inX = b.x - Math.sign(b.x - a.x) * r;
    const inY = b.y - Math.sign(b.y - a.y) * r;
    const outX = b.x + Math.sign(c.x - b.x) * r;
    const outY = b.y + Math.sign(c.y - b.y) * r;
    d += ` L ${inX},${inY} Q ${b.x},${b.y} ${outX},${outY}`;
  }
  const end = pts.at(-1)!;
  d += ` L ${end.x},${end.y}`;
  // The middle of the longest run carries the label.
  let best = { x: (pts[0]!.x + end.x) / 2, y: (pts[0]!.y + end.y) / 2 };
  let longest = -1;
  for (let i = 1; i < pts.length; i++) {
    const length = Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    if (length > longest) [longest, best] = [length, { x: (pts[i]!.x + pts[i - 1]!.x) / 2, y: (pts[i]!.y + pts[i - 1]!.y) / 2 }];
  }
  return { d, mid: best };
}
