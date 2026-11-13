/**
 * The composition of a research run, left to right, in stages that follow what the run recorded:
 *
 *   request (with its searches and steps under it) → sources → analysis → verification →
 *   AEGIS → report → follow-up outputs.
 *
 * Stages come from the run's dependencies (see `rankAgents`), not from a fixed template: a stage
 * holds as many cards as the run made, one to four to a column, and a fifth starts another column
 * of the same stage. Every stage is centred on one shared midline, so a stage of one card sits
 * level with the middle of its neighbours, and two or three spread into upper and lower branches.
 * Stages are separated by wide corridors that the strings run through.
 *
 * It is deterministic: the same record always lands the same way, so a reload never moves
 * anything. No model is asked.
 */
import { RESEARCH_GRID_STEP } from "./layout-policy";

export type Box = { id: string; width: number; height: number };
export type SourceRow = Box & { companions?: readonly Box[] };
export type Point = { x: number; y: number };
export type SemanticInput = {
  /** The request card and where it already stands: everything is laid out from it. */
  request: Box & Point;
  /** Cards that hang under the request: search lists, the discovery worker, the steps. */
  under: readonly Box[];
  /**
   * The AI PLAN: a tall card in its own column right after the request, top-aligned with it, with the
   * run's one Sources collection (and the worker that gathered it) directly under it.
   */
  plan?: (Box & { below: readonly Box[] }) | null;
  /** Opened sources (or source stacks), already in retrieval order. Each carries a caption above it. */
  sources: readonly SourceRow[];
  /** The list of every retrieved source, under the first column of sources. */
  sourceList?: Box | null;
  /** Workers that read the sources, each with the stage its dependencies put it in (2 = right after the sources). */
  workers: readonly (Box & { rank?: number })[];
  lead?: Box | null;
  /**
   * The Images and Videos sheets: their own stage after AEGIS and before the report, one above the
   * other, centred on the midline like every other stage.
   */
  collections?: readonly Box[];
  /**
   * The lower track: the Evidence processing pipeline, one wide container under the main track,
   * starting under the first sources and level with the Sources collection that feeds it.
   */
  pipeline?: Box | null;
  /** Collect all results: the stage where the tracks converge, just before the report. */
  compile?: Box | null;
  /** The report first, then any follow-up outputs, each a stage of its own to the right. */
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
/** Visible cards or stacks per column: a stage with more continues in a further column. */
export const ROWS = 4;

type CardRow = SourceRow & { caption: boolean };
type Column = { cards: CardRow[]; gap: number; rowGap: number };

export const WEBSITE_GAP = 5 * RESEARCH_GRID_STEP;
const requestPlanGap = 12 * RESEARCH_GRID_STEP;
const sourceListGap = 13 * RESEARCH_GRID_STEP;
const stageGap = 8 * RESEARCH_GRID_STEP;

export function semanticLayout(input: SemanticInput): SemanticLayout {
  const { request, gaps } = input;
  const positions: Record<string, Point> = {};
  const x0 = request.x;
  const y0 = request.y;

  // The request column stands at the top left, its searches and steps under it.
  positions[request.id] = { x: x0, y: y0 };
  let y = y0 + request.height + gaps.row;
  let width = request.width;
  let bottom = y0 + request.height;
  for (const card of input.under) {
    positions[card.id] = { x: x0, y };
    y += card.height + gaps.row;
    width = Math.max(width, card.width);
    bottom = Math.max(bottom, positions[card.id]!.y + card.height);
  }

  // Each stage, split into columns of at most ROWS cards. `gap` is the corridor before it.
  const stages: Column[][] = [];
  const chunk = (cards: readonly CardRow[], before: number, websites = false) => {
    const columns: Column[] = [];
    for (let i = 0; i < cards.length; i += ROWS)
      columns.push({ cards: cards.slice(i, i + ROWS), gap: i && websites ? WEBSITE_GAP : before,
        rowGap: websites ? WEBSITE_GAP - CAPTION : stageGap });
    if (columns.length) stages.push(columns);
  };
  chunk(input.sources.map((card) => ({ ...card, caption: true })), input.plan ? gaps.column : stageGap, true);
  // The full list of retrieved sources hangs under the first column of sources (placed after the
  // stages are centred, so a long list never pulls the midline down), or is the stage itself.
  const hangList = input.sourceList && stages[0] ? input.sourceList : null;
  if (input.sourceList && !hangList) chunk([{ ...input.sourceList, caption: false }], sourceListGap);
  const ranks = [...new Set(input.workers.map((card) => card.rank ?? 2))].sort((a, b) => a - b);
  for (const rank of ranks) chunk(input.workers.filter((card) => (card.rank ?? 2) === rank).map((card) => ({ ...card, caption: false })), stageGap);
  if (input.lead) chunk([{ ...input.lead, caption: false }], stageGap);
  const collections = input.collections ?? [];
  if (collections.length) chunk(collections.map((card) => ({ ...card, caption: false })), stageGap);
  if (input.compile) chunk([{ ...input.compile, caption: false }], stageGap);
  for (const paper of input.papers) chunk([{ ...paper, caption: false }], stageGap);

  const rowHeight = (row: SourceRow) => Math.max(row.height, ...(row.companions ?? []).map((page) => page.height));
  const rowWidth = (row: SourceRow) => row.width + (row.companions ?? []).reduce((width, page) => width + WEBSITE_GAP + page.width, 0);
  // One midline for every stage: the middle of the tallest column.
  const heightOf = (column: Column) =>
    column.cards.reduce((sum, card) => sum + rowHeight(card) + (card.caption ? CAPTION : 0), 0) + Math.max(0, column.cards.length - 1) * column.rowGap;
  const tallest = Math.max(0, ...stages.flat().map(heightOf));
  const middle = y0 + tallest / 2;
  let x = x0 + width;
  if (input.plan) {
    x = Math.max(x + RESEARCH_GRID_STEP, x0 + request.width + requestPlanGap);
    positions[input.plan.id] = { x, y: y0 };
    let py = y0 + input.plan.height + sourceListGap;
    let planWidth = input.plan.width;
    for (const card of input.plan.below) {
      positions[card.id] = { x, y: py };
      py += card.height + stageGap;
      planWidth = Math.max(planWidth, card.width);
      bottom = Math.max(bottom, positions[card.id]!.y + card.height);
    }
    bottom = Math.max(bottom, y0 + input.plan.height);
    x += planWidth;
  }
  let right = x;
  const trackLeft = x;
  const spans: { x1: number; x2: number; bottom: number }[] = [];
  for (const column of stages.flat()) {
    x += column.gap;
    let cy = middle - heightOf(column) / 2;
    const columnWidth = Math.max(...column.cards.map(rowWidth));
    let columnBottom = cy;
    for (const card of column.cards) {
      if (card.caption) cy += CAPTION;
      const y = Math.round(cy);
      positions[card.id] = { x, y };
      let right = x + card.width;
      for (const page of card.companions ?? []) {
        const pageX = right + WEBSITE_GAP;
        positions[page.id] = { x: pageX, y };
        right = pageX + page.width;
      }
      const height = rowHeight(card);
      columnBottom = y + height;
      cy += height + column.rowGap;
    }
    bottom = Math.max(bottom, columnBottom);
    spans.push({ x1: x, x2: x + columnWidth, bottom: columnBottom });
    x += columnWidth;
    right = x;
  }

  if (input.pipeline) {
    // Under every column it runs beneath, and never above the Sources collection that feeds it.
    const px = spans[0]?.x1 ?? trackLeft + gaps.column;
    const under = spans.filter((span) => span.x1 < px + input.pipeline!.width + gaps.column / 2 && span.x2 > px);
    const feeder = input.plan?.below[0];
    const py = Math.max(Math.max(y0, ...under.map((span) => span.bottom)) + stageGap,
      feeder ? positions[feeder.id]!.y : y0);
    positions[input.pipeline.id] = { x: px, y: py };
    bottom = Math.max(bottom, py + input.pipeline.height);
    right = Math.max(right, px + input.pipeline.width);
  }

  if (hangList) {
    const column = stages[0]![0]!;
    const last = column.cards.at(-1)!;
    const y = positions[last.id]!.y + rowHeight(last) + sourceListGap;
    positions[hangList.id] = { x: positions[column.cards[0]!.id]!.x, y };
    bottom = Math.max(bottom, y + hangList.height);
  }

  let map: Point | null = null;
  if (input.map) {
    const firstStage = stages[0]?.[0]?.cards[0];
    const left = firstStage ? positions[firstStage.id]!.x : x0;
    map = input.map.place === "right" ? { x: right + gaps.map, y: y0 } : { x: left, y: bottom + gaps.map };
    right = Math.max(right, map.x + input.map.width);
    bottom = Math.max(bottom, map.y + input.map.height);
  }
  return { positions, map, box: { x: x0, y: y0, width: right - x0, height: bottom - y0 } };
}

/**
 * The stage of each worker from the run's own dependencies: the longest chain of forward
 * relations that reaches it from the request (sources are stage 1). Control relations that point
 * back (a worker searching through the request, AEGIS assigning or reading) do not set stages.
 * AEGIS and the report always come after every worker.
 */
export const FORWARD = new Set(["found", "evidence", "verifies", "delivers", "supports"]);
export function rankAgents(
  links: readonly { source: string; target: string; types: readonly string[] }[],
  sources: ReadonlySet<string>,
  workers: readonly string[],
): Map<string, number> {
  const rank = new Map<string, number>();
  for (const id of sources) rank.set(id, 1);
  const edges = links.filter((link) => link.types.some((type) => FORWARD.has(type)) && workers.includes(link.target) && link.source !== link.target);
  // Longest path by relaxation; a cycle is cut after as many rounds as there are workers.
  for (let round = 0; round <= workers.length; round++) {
    let changed = false;
    for (const edge of edges) {
      const from = rank.get(edge.source);
      if (from === undefined) continue;
      if ((rank.get(edge.target) ?? 0) < from + 1) {
        rank.set(edge.target, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return new Map(workers.filter((id) => rank.has(id)).map((id) => [id, Math.min(rank.get(id)!, 2 + workers.length)]));
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

export type Placed = Box & Point & { caption?: boolean };

/**
 * Clears overlaps without moving what must stay: cards in `fixed` (placed by the person, or saved
 * as theirs) never move; every other card, in reading order, steps down below whatever it would
 * cover until it is clear, keeping its column. A caption's band counts as part of its card.
 */
export function clearOverlaps(cards: readonly Placed[], fixed: ReadonlySet<string>, gap = 32): Record<string, Point> {
  const area = (card: Placed) => (card.caption ? { ...card, y: card.y - CAPTION, height: card.height + CAPTION } : card);
  const settled: Placed[] = cards.filter((card) => fixed.has(card.id));
  const moved: Record<string, Point> = {};
  const free = cards.filter((card) => !fixed.has(card.id)).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const card of free) {
    const next = { ...card };
    for (let guard = 0; guard < 200; guard++) {
      const hit = settled.find((other) => overlaps(area(next), area(other), gap / 2));
      if (!hit) break;
      const below = area(hit).y + area(hit).height + gap;
      next.y = below + (next.caption ? CAPTION : 0);
    }
    settled.push(next);
    if (next.y !== card.y) moved[card.id] = { x: next.x, y: next.y };
  }
  return moved;
}
