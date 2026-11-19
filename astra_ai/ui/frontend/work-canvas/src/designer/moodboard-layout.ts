/**
 * V33 visual board composition (Designer moodboards and UI teardowns, board profile "visual").
 *
 * Why: a moodboard's picture groups stood in the helper's row at Zephium's "found" width and wrapped
 * one under another, each group two cards across, so a board of three groups was a narrow column
 * with most of the canvas empty. Here every group is one block that keeps its pictures together;
 * the composition chooses each group's grid (2 to 5 cards across, only counts Zephium's Picks
 * actually draws: balanced rows, never 4 + 1) and the board's width, then packs the blocks
 * bottom-left in reading order. Choices come from a fixed card model (count, card size, title,
 * picture proportions), never from measured heights, so a measurement cannot flip the grid and the
 * layout cannot oscillate; the final heights are the blocks' own (measured) heights, so nothing
 * overlaps. Deterministic: the same blocks always give the same board. No model positions anything.
 */

export type VisualBlock = {
  id: string;
  kind: string;
  emphasis?: string;
  group?: string;
  width: { min: number; ideal: number; max: number };
  height: (width: number) => number;
  /** A picks block's item count. */
  count?: number;
  /** A picks block's typical picture proportion (width / height), when known. */
  aspect?: number;
};
export type VisualRect = { x: number; y: number; width: number; height: number };
export type VisualBoard = { width: number; height: number; at: Record<string, VisualRect> };

/** Zephium's Picks card: at most 248 wide, 16 apart; a 4:3 photo over 118 px of words (measured in V33); a 48 px title. */
export const CARD = { widest: 248, gap: 16, body: 118, title: 48, frame: 4 / 3 } as const;
export const VISUAL = { gap: 32, aspect: 1.6, reach: 2600, combos: 729, most: 5 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A picks set's width at `across` cards. */
export const setWidth = (across: number) => across * CARD.widest + (across - 1) * CARD.gap;

/**
 * The card counts across that Zephium's Picks draws for `count` items: it spreads them over balanced
 * rows (`ceil(count / ceil(count / fits))`), so only those counts are real choices.
 */
export function acrossChoices(count: number): number[] {
  if (count <= 1) return [1];
  const out: number[] = [];
  for (let fits = 2; fits <= Math.min(VISUAL.most, count); fits++) {
    const rows = Math.ceil(count / fits);
    const across = Math.ceil(count / rows);
    // A last row of one card (3 + 3 + 1) leaves a hole in the group: not offered when another grid fits.
    if (count > 3 && count % across === 1) continue;
    if (!out.includes(across)) out.push(across);
  }
  return out.length ? out : [Math.min(VISUAL.most, count)];
}

/** A picks set's height in the card model: its title, its rows of photo and words. */
export function modelHeight(count: number, across: number, aspect = CARD.frame): number {
  const rows = Math.ceil(count / Math.max(1, across));
  const photo = CARD.widest / clamp(aspect, 0.75, 1.8);
  return CARD.title + rows * (photo + CARD.body) + (rows - 1) * CARD.gap;
}

type Option = { width: number; model: number };

/** The widths a block may stand at, each with its modelled height. */
function options(block: VisualBlock): Option[] {
  if (block.kind === "picks" && block.count) {
    // A set of very wide pictures would stretch past the board's reach; the model keeps it in.
    return acrossChoices(block.count)
      .map((across) => ({ width: setWidth(across), model: modelHeight(block.count!, across, block.aspect) }))
      .filter((option) => option.width <= VISUAL.reach);
  }
  const width = Math.round(clamp(block.width.ideal, block.width.min, Math.min(block.width.max, VISUAL.reach)));
  return [{ width, model: Math.max(1, block.height(width)) }];
}

/** Bottom-left packing in reading order at a board width: each block where it stands highest, then leftmost. */
function pack(sizes: readonly { width: number; height: number }[], board: number): VisualRect[] {
  const placed: VisualRect[] = [];
  for (const size of sizes) {
    let best: VisualRect | null = null;
    const starts = [0, ...placed.map((rect) => rect.x + rect.width + VISUAL.gap)].filter((x) => x + size.width <= board + 0.5);
    for (const x of starts.length ? starts : [0]) {
      let y = 0;
      for (const rect of placed)
        if (x < rect.x + rect.width + VISUAL.gap && rect.x < x + size.width + VISUAL.gap) y = Math.max(y, rect.y + rect.height + VISUAL.gap);
      if (!best || y < best.y - 0.5 || (Math.abs(y - best.y) <= 0.5 && x < best.x)) best = { x, y, width: size.width, height: size.height };
    }
    placed.push(best!);
  }
  return placed;
}

const extent = (rects: readonly VisualRect[]) => ({
  width: Math.max(...rects.map((rect) => rect.x + rect.width)),
  height: Math.max(...rects.map((rect) => rect.y + rect.height)),
});

/** How far a packed board is from a screen-shaped, filled board (lower is better). */
export function boardScore(rects: readonly VisualRect[]): number {
  const { width, height } = extent(rects);
  const used = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  const empty = 1 - used / Math.max(1, width * height);
  return Math.abs(Math.log(width / Math.max(1, height) / VISUAL.aspect)) + 2 * empty;
}

/** Board widths worth trying: every run of consecutive blocks side by side, within reach. */
function boardWidths(widths: readonly number[]): number[] {
  const widest = Math.max(...widths);
  const out = new Set<number>([widest]);
  for (let start = 0; start < widths.length; start++) {
    let sum = -VISUAL.gap;
    for (let end = start; end < widths.length; end++) {
      sum += widths[end]! + VISUAL.gap;
      if (sum > VISUAL.reach) break;
      if (sum >= widest) out.add(sum);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** The order blocks are read in: the screenshot, the tables and lists, then the picture groups, as given. */
const RANK: Record<string, number> = { media: 0, sheet: 1, list: 2, document: 3, picks: 4 };

export function visualLayout(blocks: readonly VisualBlock[]): VisualBoard | null {
  if (!blocks.length) return null;
  const laid = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => (RANK[a.block.kind] ?? 3) - (RANK[b.block.kind] ?? 3) || a.index - b.index)
    .map((entry) => entry.block);
  const choices = laid.map(options);
  if (choices.some((list) => !list.length)) return null;
  // Every combination of grids when there are few; otherwise each group's own best shape.
  const total = choices.reduce((product, list) => product * list.length, 1);
  const combos: Option[][] = [];
  if (total <= VISUAL.combos) {
    const walk = (at: number, chosen: Option[]) => {
      if (at === choices.length) return void combos.push(chosen);
      for (const option of choices[at]!) walk(at + 1, [...chosen, option]);
    };
    walk(0, []);
  } else
    combos.push(choices.map((list) => [...list].sort((a, b) => Math.abs(Math.log(a.width / a.model / 1.4)) - Math.abs(Math.log(b.width / b.model / 1.4)))[0]!));
  let best: { combo: Option[]; board: number; score: number } | null = null;
  for (const combo of combos) {
    const sizes = combo.map((option) => ({ width: option.width, height: option.model }));
    for (const board of boardWidths(sizes.map((size) => size.width))) {
      const score = boardScore(pack(sizes, board));
      if (!best || score < best.score - 1e-6) best = { combo, board, score };
    }
  }
  if (!best) return null;
  // Placed with the blocks' own heights (measured once drawn), at the chosen widths and board.
  const sizes = laid.map((block, index) => {
    const width = best!.combo[index]!.width;
    return { width, height: Math.max(1, Math.ceil(block.height(width))) };
  });
  const rects = pack(sizes, best.board);
  const at: Record<string, VisualRect> = {};
  laid.forEach((block, index) => (at[block.id] = rects[index]!));
  const { width, height } = extent(rects);
  return { width, height, at };
}

/** Geometry measures for tests and the V33 report: area used and how much of the board is empty. */
export function boardMetrics(board: VisualBoard) {
  const rects = Object.values(board.at);
  const used = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  return {
    width: board.width,
    height: board.height,
    aspect: +(board.width / Math.max(1, board.height)).toFixed(2),
    empty: +(1 - used / Math.max(1, board.width * board.height)).toFixed(3),
  };
}
