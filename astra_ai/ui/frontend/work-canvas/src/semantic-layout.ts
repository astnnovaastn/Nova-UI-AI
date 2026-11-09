/**
 * The composition of a relation-aware research run, left to right, from what the run recorded:
 *
 *   1. the request, with its search lists and its steps under it;
 *   2. the sources it opened, in the order they were retrieved, top to bottom and then on to the
 *      next column, each with its caption in a reserved band above it;
 *   3. the workers that read them, and AEGIS (the lead) on the top band;
 *   4. the report, with the knowledge map beside or under the whole run.
 *
 * It is deterministic: the same cards in the same order always land in the same places, so a
 * reload never moves anything. A new source only ever adds a slot after the last one, so
 * cards already placed keep their place; only the columns to its right step over when a new
 * column of sources opens. No model is asked: order comes from the run's own record.
 */
export type Box = { id: string; width: number; height: number };
export type Point = { x: number; y: number };
export type SemanticInput = {
  /** The request card and where it already stands: everything is laid out from it. */
  request: Box & Point;
  /** Cards that hang under the request: search lists, the discovery worker, the steps. */
  under: readonly Box[];
  /** Opened sources, already in retrieval order. Each carries a caption above it. */
  sources: readonly Box[];
  /** The list of every retrieved source, under the opened ones. */
  sourceList?: Box | null;
  /** Workers that read the sources (analysis, verification), in their recorded order. */
  workers: readonly Box[];
  lead?: Box | null;
  papers: readonly Box[];
  /** The knowledge map's whole extent, if the run has one. */
  map?: { width: number; height: number; place: "right" | "below" } | null;
  gaps: { column: number; row: number; paper: number; map: number };
};
export type SemanticLayout = {
  positions: Record<string, Point>;
  /** Where the map's top-left goes. */
  map: Point | null;
  box: { x: number; y: number; width: number; height: number };
};

/** The caption band reserved above every source card. */
export const CAPTION = 30;
/** Sources per column before the next column starts: about one report tall. */
export const ROWS = 3;
/** Extra room where many strings converge on one card, so their curves stay readable. */
const CONVERGE = 56;

export function semanticLayout(input: SemanticInput): SemanticLayout {
  const { request, gaps } = input;
  const positions: Record<string, Point> = {};
  const x0 = request.x;
  const y0 = request.y;
  positions[request.id] = { x: x0, y: y0 };
  let bottom = y0 + request.height;
  let right = x0 + request.width;

  // 1. Under the request.
  let y = y0 + request.height + gaps.row;
  let columnWidth = request.width;
  for (const card of input.under) {
    positions[card.id] = { x: x0, y };
    y += card.height + gaps.row;
    columnWidth = Math.max(columnWidth, card.width);
    bottom = Math.max(bottom, positions[card.id].y + card.height);
  }
  right = Math.max(right, x0 + columnWidth);

  // The top band carries the request's line to AEGIS over the sources, never through them.
  const band = input.lead ? Math.max(request.height, input.lead.height) / 2 + 48 : 0;
  const top = y0 + band + CAPTION;

  // 2. Sources in retrieval order, column by column.
  let x = x0 + columnWidth + gaps.column + (input.sources.length ? CONVERGE : 0);
  let gridBottom = top - CAPTION;
  const zoneLeft = x;
  for (let start = 0; start < input.sources.length; start += ROWS) {
    const column = input.sources.slice(start, start + ROWS);
    let cy = top;
    const width = Math.max(...column.map((card) => card.width));
    for (const card of column) {
      positions[card.id] = { x, y: cy };
      cy += card.height + gaps.row + CAPTION;
      gridBottom = Math.max(gridBottom, positions[card.id].y + card.height);
    }
    x += width + gaps.column;
  }
  if (input.sourceList) {
    const listY = input.sources.length ? gridBottom + gaps.row : top;
    positions[input.sourceList.id] = { x: zoneLeft, y: listY };
    gridBottom = listY + input.sourceList.height;
    x = Math.max(x, zoneLeft + input.sourceList.width + gaps.column);
  }
  bottom = Math.max(bottom, gridBottom);
  right = Math.max(right, x - gaps.column);

  // 3. Workers, then AEGIS on the top band.
  x = right + gaps.column + CONVERGE;
  if (input.workers.length) {
    let wy = top;
    const width = Math.max(...input.workers.map((card) => card.width));
    for (const card of input.workers) {
      positions[card.id] = { x, y: wy };
      wy += card.height + gaps.row;
      bottom = Math.max(bottom, wy - gaps.row);
    }
    right = x + width;
    x = right + gaps.column;
  }
  if (input.lead) {
    positions[input.lead.id] = { x, y: y0 };
    right = x + input.lead.width;
    bottom = Math.max(bottom, y0 + input.lead.height);
    x = right + gaps.paper;
  }

  // 4. The report.
  let py = y0;
  for (const paper of input.papers) {
    positions[paper.id] = { x, y: py };
    py += paper.height + 48;
    right = Math.max(right, x + paper.width);
    bottom = Math.max(bottom, py - 48);
  }

  let map: Point | null = null;
  if (input.map) {
    map = input.map.place === "right" ? { x: right + gaps.map, y: y0 } : { x: zoneLeft, y: bottom + gaps.map };
    right = Math.max(right, map.x + input.map.width);
    bottom = Math.max(bottom, map.y + input.map.height);
  }
  return { positions, map, box: { x: x0, y: y0, width: right - x0, height: bottom - y0 } };
}

/**
 * Sources in the order the run retrieved them: by the first evidence record (S1, S2, …) each
 * card shows, then by the order the canvas listed them. Never by quality.
 */
export function retrievalOrder<T extends { id: string }>(cards: readonly T[], firstIndex: (card: T) => number): T[] {
  return cards
    .map((card, index) => ({ card, index, first: firstIndex(card) }))
    .sort((a, b) => (Number.isFinite(a.first) ? a.first : Infinity) - (Number.isFinite(b.first) ? b.first : Infinity) || a.index - b.index)
    .map((row) => row.card);
}

/**
 * The saved arrangement this layout respects. A record the automatic organizer wrote keeps only
 * what the person placed or pinned; a record the person arranged themselves keeps everything.
 */
export function keptPositions(
  record: { automatic?: boolean; positions: Record<string, Point>; constraints: Record<string, { manual?: boolean; pinned?: boolean } | undefined> } | null,
): Record<string, Point> {
  if (!record) return {};
  if (!record.automatic) return record.positions;
  return Object.fromEntries(
    Object.entries(record.positions).filter(([id]) => record.constraints[id]?.manual || record.constraints[id]?.pinned),
  );
}

/** Two boxes overlap, with an allowance between them. */
export function overlaps(a: Box & Point, b: Box & Point, pad = 0) {
  return a.x < b.x + b.width + pad && a.x + a.width + pad > b.x && a.y < b.y + b.height + pad && a.y + a.height + pad > b.y;
}
