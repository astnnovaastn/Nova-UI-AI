import type { Emphasis } from "./types";
import { visualLayout } from "../../../../../../src/designer/moodboard-layout";

export type Rect = { x: number; y: number; width: number; height: number };
/** A block as the layout sees it: how wide it may stand, how tall it is at a width. */
export type LayoutBlock = {
  id: string;
  kind: string;
  emphasis: Emphasis;
  group?: string;
  width: { min: number; ideal: number; max: number };
  height: (width: number) => number;
  /** AEGIS V33: a picks block's item count and typical picture proportion, for the visual board. */
  count?: number;
  aspect?: number;
};
export type BoardLayout = { width: number; height: number; at: Record<string, Rect> };

/**
 * A result is 640–1120 wide, so at 100% it reads whole in the view it opens
 * in; a picture that reads to the right (a diagram, a map) takes the room it
 * draws, up to `reach`, and the run grows to the right for it.
 */
export const BOARD = { min: 640, max: 1120, reach: 2400, gap: 24, row: 24 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Hero blocks lead, the prose and the other primary blocks follow, the
 * supporting blocks trail; a group's members stand together where its first
 * member stood.
 */
function reading(blocks: readonly LayoutBlock[]): LayoutBlock[] {
  const tier = (block: LayoutBlock) =>
    block.emphasis === "hero" ? 0 : block.emphasis === "primary" ? 1 : 2;
  const ordered = [...blocks].sort((a, b) => tier(a) - tier(b));
  const out: LayoutBlock[] = [];
  for (const block of ordered) {
    if (out.includes(block)) continue;
    out.push(block);
    if (block.group)
      for (const mate of ordered)
        if (mate !== block && mate.group === block.group && !out.includes(mate)) out.push(mate);
  }
  return out;
}

/** A hero spans the board; prose leading keeps its measure and may take an aside. */
const spans = (block: LayoutBlock) => block.emphasis === "hero" && block.kind !== "prose";

/** Rows at a board width: what may stand beside what, and nothing wider than the board. */
function pack(blocks: readonly LayoutBlock[], width: number, open?: string): LayoutBlock[][] {
  const rows: LayoutBlock[][] = [];
  let row: LayoutBlock[] = [];
  const flush = () => {
    if (row.length) rows.push(row);
    row = [];
  };
  const min = (block: LayoutBlock) => Math.min(block.width.min, width);
  for (const block of blocks) {
    const alone = spans(block) || block.id === open || min(block) > (width - BOARD.gap) / 2;
    if (alone) {
      flush();
      rows.push([block]);
      continue;
    }
    const supporting = block.emphasis === "supporting";
    const cap = supporting ? 3 : 2;
    const head = row[0];
    // A primary block left alone in its row takes the supporting blocks that fit beside it.
    const joins =
      supporting &&
      row.length >= 1 &&
      row.every((entry) => entry.emphasis === "supporting" || entry === head) &&
      head?.emphasis === "primary";
    const fits =
      !!head &&
      ((head.emphasis === "supporting") === supporting || joins) &&
      row.length < cap &&
      row.reduce((sum, entry) => sum + min(entry) + BOARD.gap, 0) + min(block) <= width &&
      // A group starts its own row and keeps it to itself.
      (block.group ?? "") === (head.group ?? "");
    if (!fits) flush();
    row.push(block);
  }
  flush();
  return rows;
}

/** Widths in a row: each its ideal, shrunk toward its least or grown toward its most to fit. */
function widths(row: readonly LayoutBlock[], width: number): number[] {
  const room = width - BOARD.gap * (row.length - 1);
  const least = row.map((block) => Math.min(block.width.min, room));
  const most = row.map((block, index) => Math.max(least[index]!, Math.min(block.width.max, room)));
  const out = row.map((block, index) => clamp(block.width.ideal, least[index]!, most[index]!));
  let sum = out.reduce((total, value) => total + value, 0);
  if (sum > room) {
    const slack = out.reduce((total, value, index) => total + value - least[index]!, 0);
    const cut = Math.min(1, (sum - room) / Math.max(1, slack));
    out.forEach((value, index) => (out[index] = value - (value - least[index]!) * cut));
  } else if (row.length > 1 && sum < room) {
    const slack = out.reduce((total, value, index) => total + most[index]! - value, 0);
    const give = Math.min(1, (room - sum) / Math.max(1, slack));
    out.forEach((value, index) => (out[index] = value + (most[index]! - value) * give));
  }
  const floored = out.map(Math.floor);
  sum = floored.reduce((total, value) => total + value, 0);
  // Rounding never pushes a row past the board.
  if (sum > room) floored[floored.length - 1]! -= sum - room;
  return floored;
}

/**
 * A board laid out for its content: a width between 640 and 1120 that its
 * widest row asks for (wider only for a spanning picture that draws wider), rows top to bottom, nothing overlapping. An open block
 * takes a row of its own at the board's width; a pinned block is the person's
 * and takes no room.
 */
function rowLayout(
  blocks: readonly LayoutBlock[],
  { open, pinned = new Set() }: { open?: string; pinned?: ReadonlySet<string> } = {},
): BoardLayout {
  const laid = reading(blocks.filter((block) => !pinned.has(block.id)));
  if (!laid.length) return { width: BOARD.min, height: 0, at: {} };
  const wide = Math.max(0, ...laid.map((block) => (spans(block) ? block.width.ideal : 0)));
  const cap = clamp(wide, BOARD.max, BOARD.reach);
  const asked = pack(laid, cap).reduce((need, row) => {
    const ideal = row.reduce(
      (sum, block, index) => sum + Math.min(block.width.ideal, cap) + (index ? BOARD.gap : 0),
      0,
    );
    return Math.max(need, ideal);
  }, 0);
  const width = Math.round(clamp(asked, BOARD.min, cap));
  const at: Record<string, Rect> = {};
  let y = 0;
  for (const row of pack(laid, width, open)) {
    // An open block takes the board's width; a spanning one its own row, at the width it draws at and no more.
    const whole = row.length === 1 && (row[0]!.id === open || spans(row[0]!));
    const sizes = whole
      ? [row[0]!.id === open ? width : Math.min(width, row[0]!.width.max)]
      : widths(row, width);
    const heights = row.map((block, index) => Math.max(1, Math.ceil(block.height(sizes[index]!))));
    // A row's blocks share its height, so their surfaces end together.
    const tallest = Math.max(...heights);
    let x = 0;
    row.forEach((block, index) => {
      const w = sizes[index]!;
      at[block.id] = { x, y, width: w, height: tallest };
      x += w + BOARD.gap;
    });
    y += tallest + BOARD.row;
  }
  return { width, height: Math.max(0, y - BOARD.row), at };
}

/**
 * AEGIS composition: a board with several results stands in balanced columns, not one long column.
 * Each result keeps its own height (Zephium's measurement at its width); the column count is the one
 * whose board is closest to a screen's proportions.
 */
export const COMPOSE = { columns: 4, gap: 32, column: 680, aspect: 1.6 } as const;

const WIDE_KINDS = new Set(["diagram", "project"]);

/**
 * AEGIS V29 board profiles: the workflow's board (route.board) picks how its results stand. Each is
 * columns, the kinds that lead, the kinds that span columns and a reading order by kind. Geometry
 * stays deterministic: no model positions anything. "research" (and no profile) is today's board.
 */
export type BoardProfile = "technical" | "visual" | "matrix" | "timeline" | "schedule" | "messages" | "research";
type ProfileRule = { columns: readonly [number, number]; hero: readonly string[]; wide: readonly string[]; order: readonly string[] };
export const BOARD_PROFILES: Record<Exclude<BoardProfile, "research">, ProfileRule> = {
  technical: { columns: [2, 3], hero: ["project", "diagram"], wide: ["diagram", "diff"], order: ["project", "diagram", "code", "diff", "list", "reply"] },
  visual: { columns: [3, 4], hero: ["picks"], wide: ["picks"], order: ["reply", "picks"] },
  matrix: { columns: [2, 3], hero: ["sheet", "diagram"], wide: ["sheet"], order: ["sheet", "plot", "picks", "reply"] },
  timeline: { columns: [2, 2], hero: ["plan"], wide: ["plan"], order: ["plan", "list", "draft", "reply"] },
  schedule: { columns: [2, 2], hero: ["plan"], wide: ["plan"], order: ["reply", "plan", "list"] },
  messages: { columns: [2, 3], hero: ["list"], wide: [], order: ["list", "draft", "subject"] },
};

function composed(laid: readonly LayoutBlock[], columns: number, column: number, wideKinds: ReadonlySet<string> = WIDE_KINDS): BoardLayout {
  const gap = COMPOSE.gap;
  const tops = Array.from({ length: columns }, () => 0);
  const at: Record<string, Rect> = {};
  for (const block of laid) {
    // A picture that reads to the right, or anything whose own width is well over a column (a wide
    // table, a row of picks), takes the columns it reads at; anything else, what it needs.
    const wide = wideKinds.has(block.kind) || block.width.ideal > column * 1.3;
    const need = wide ? Math.min(block.width.ideal, BOARD.reach) : block.width.min;
    const span = clamp(Math.ceil((need + gap) / (column + gap)), 1, columns);
    const room = span * column + (span - 1) * gap;
    // Wider than every column together (a large diagram): a row of its own at the width it draws.
    if (wide && need > room) {
      const top = Math.max(...tops);
      const width = Math.floor(Math.min(need, Math.max(block.width.max, need)));
      const height = Math.max(1, Math.ceil(block.height(width)));
      at[block.id] = { x: 0, y: top, width, height };
      tops.fill(top + height + gap);
      continue;
    }
    const width = Math.floor(Math.min(room, Math.max(block.width.max, Math.min(room, block.width.ideal))));
    let start = 0;
    let top = Infinity;
    for (let index = 0; index + span <= columns; index++) {
      const here = Math.max(...tops.slice(index, index + span));
      if (here < top - 0.5) [start, top] = [index, here];
    }
    const height = Math.max(1, Math.ceil(block.height(width)));
    at[block.id] = { x: start * (column + gap), y: top, width, height };
    for (let index = start; index < start + span; index++) tops[index] = top + height + gap;
  }
  const used = Object.values(at);
  const width = Math.max(...used.map((rect) => rect.x + rect.width));
  const height = Math.max(...used.map((rect) => rect.y + rect.height));
  return { width, height, at };
}

export function boardLayout(
  blocks: readonly LayoutBlock[],
  options: { open?: string; pinned?: ReadonlySet<string>; profile?: string } = {},
): BoardLayout {
  const pinned = options.pinned ?? new Set<string>();
  const read = reading(blocks.filter((block) => !pinned.has(block.id)));
  const rule = options.profile && options.profile !== "research" ? BOARD_PROFILES[options.profile as Exclude<BoardProfile, "research">] : undefined;
  // AEGIS V33: a visual board packs its picture groups across the canvas (moodboard-layout.ts).
  if (options.profile === "visual" && !options.open && read.length >= 1) {
    const board = visualLayout(read);
    if (board) return board;
  }
  if (rule && !options.open && read.length >= 2) return profiled(read, rule) ?? rowLayout(blocks, options);
  if (options.open || read.length < 3) return rowLayout(blocks, options);
  // The run's written report stands right after the hero results, before pictures and supporting
  // cards: it is what the person came for. Otherwise Zephium's reading order is kept.
  const tier = (block: LayoutBlock) => (block.emphasis === "hero" ? 0 : block.kind === "document" ? 1 : block.emphasis === "primary" ? 2 : 3);
  const laid = read.map((block, index) => ({ block, index })).sort((a, b) => tier(a.block) - tier(b.block) || a.index - b.index).map((entry) => entry.block);
  // A column reads like one of Zephium's results: the typical result's own width, 640 to 760.
  const ideals = laid.map((block) => Math.min(block.width.ideal, BOARD.max)).sort((a, b) => a - b);
  const column = clamp(ideals[Math.floor(ideals.length / 2)] ?? COMPOSE.column, BOARD.min, 760);
  let best: BoardLayout | null = null;
  let score = Infinity;
  for (let columns = 1; columns <= Math.min(COMPOSE.columns, laid.length); columns++) {
    const board = composed(laid, columns, column);
    const off = Math.abs(Math.log(board.width / Math.max(1, board.height) / COMPOSE.aspect));
    if (off < score - 0.01) [best, score] = [board, off];
  }
  return best ?? rowLayout(blocks, options);
}

/** A profiled board: the profile's reading order and lead kinds, its column range, its wide kinds. */
function profiled(read: readonly LayoutBlock[], rule: ProfileRule): BoardLayout | null {
  const rank = (block: LayoutBlock) => {
    const at = rule.order.indexOf(block.kind);
    return at < 0 ? rule.order.length : at;
  };
  const lead = (block: LayoutBlock) => (rule.hero.includes(block.kind) ? 0 : block.emphasis === "hero" ? 1 : block.kind === "document" ? 2 : 3);
  const laid = read
    .map((block, index) => ({ block, index }))
    .sort((a, b) => rank(a.block) - rank(b.block) || lead(a.block) - lead(b.block) || a.index - b.index)
    .map((entry) => entry.block);
  const ideals = laid.map((block) => Math.min(block.width.ideal, BOARD.max)).sort((a, b) => a - b);
  const column = clamp(ideals[Math.floor(ideals.length / 2)] ?? COMPOSE.column, BOARD.min, 760);
  const wide = new Set(rule.wide);
  const [least, most] = rule.columns;
  let best: BoardLayout | null = null;
  let score = Infinity;
  for (let columns = Math.min(least, laid.length); columns <= Math.min(most, Math.max(least, laid.length)); columns++) {
    const board = composed(laid, columns, column, wide);
    const off = Math.abs(Math.log(board.width / Math.max(1, board.height) / COMPOSE.aspect));
    if (off < score - 0.01) [best, score] = [board, off];
  }
  return best;
}

