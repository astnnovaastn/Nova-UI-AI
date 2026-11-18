// MPL-2.0. AEGIS spatial composition for Zephium's result board. The reference checkout stays untouched.
//
// Why: Zephium's board is one reading column. Its width is capped at 1120 and every result needs at
// least 640, so two results never stand side by side, and a sheet, diagram, plan or picks ("hero")
// always takes a row of its own. A run with many results therefore became one long vertical column.
//
// What changes: with three or more results (and none opened in place), the board is composed in
// columns instead: one to four, whichever gives the most screen-shaped board, each result dropped
// into the column that ends highest, wide pictures (diagrams, project maps) and wide tables spanning
// columns. Reading order is Zephium's own (hero, primary, supporting; a group's members together),
// heights come from Zephium's own measurement, nothing overlaps. One or two results, or an opened
// block, keep Zephium's original rows exactly.
const COMPOSE = `

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
`;

export const compositionPatches = [
  {
    file: "features/work/lib/board/layout.ts",
    find: "export function boardLayout(\n  blocks: readonly LayoutBlock[],\n  { open, pinned = new Set() }",
    replace: "function rowLayout(\n  blocks: readonly LayoutBlock[],\n  { open, pinned = new Set() }",
    why: "Keep Zephium's rows for one or two results and for an opened block.",
  },
  {
    file: "features/work/lib/board/layout.ts",
    find: "  return { width, height: Math.max(0, y - BOARD.row), at };\n}",
    replace: "  return { width, height: Math.max(0, y - BOARD.row), at };\n}" + COMPOSE,
    why: "Compose a board with several results in balanced columns instead of one long column.",
  },
  {
    file: "features/work/lib/project-environment-board.ts",
    find: "export type StageOptions = {\n",
    replace: "export type StageOptions = {\n  /** AEGIS V29: the workflow's board profile (route.board); none or \"research\" keeps today's board. */\n  board?: string;\n",
    why: "Carry the workflow's board profile to the result board.",
  },
  {
    file: "features/work/lib/project-environment-board.ts",
    find: "        open ? { open } : {},\n      );",
    replace: "        { ...(open ? { open } : {}), ...(options.board ? { profile: options.board } : {}) },\n      );",
    why: "Lay out a run's results by its workflow's board profile.",
  },
  {
    file: "features/work/components/run/PartRow.svelte",
    find: '    fanState,\n    reverseFan = false,\n  }: {\n    fanState?: "closed" | "open";\n    reverseFan?: boolean;',
    replace: '    fanState,\n    reverseFan = false,\n    fanDown = false,\n  }: {\n    fanState?: "closed" | "open";\n    reverseFan?: boolean;\n    /** AEGIS: the fanned windows stand one under another, straight down, instead of along the row. */\n    fanDown?: boolean;',
    why: "Let a source stack open straight down on hover.",
  },
  {
    file: "features/work/components/run/PartRow.svelte",
    find: "  const fanOf = (index: number) => `translate(${(reverseFan ? -1 : 1) * index * (windowWidth + 16)}px, 0)`;",
    replace: "  const fanOf = (index: number) => fanDown ? `translate(0, ${index * ((windowWidth * 10) / 16 + PART.bar + 16)}px)` : `translate(${(reverseFan ? -1 : 1) * index * (windowWidth + 16)}px, 0)`;",
    why: "Fan windows downward when asked.",
  },
  {
    file: "features/work/components/CanvasControls.svelte",
    find: "  function fit() {\n    onfit?.();\n    void flow.fitView({",
    replace: [
      "  /** AEGIS: Fit view never goes below a reading zoom; a run too large to fit opens at its start instead. */",
      "  const READABLE = 0.58;",
      "  function fit() {",
      "    onfit?.();",
      "    const nodes = flow.getNodes();",
      "    const pane = anchor?.closest(\".svelte-flow\")?.getBoundingClientRect();",
      "    if (nodes.length && pane) {",
      "      const box = flow.getNodesBounds(nodes);",
      "      const top = bottomInset > 0 ? 110 : 40;",
      "      const bottom = bottomInset > 0 ? bottomInset + 32 : 40;",
      "      const zoom = Math.min((pane.width - 80) / Math.max(1, box.width), (pane.height - top - bottom) / Math.max(1, box.height));",
      "      if (zoom < READABLE) {",
      "        void flow.setViewport({ x: 40 - box.x * READABLE, y: top - box.y * READABLE, zoom: READABLE }, { duration: travel(\"slow\") });",
      "        return;",
      "      }",
      "    }",
      "    void flow.fitView({",
    ].join("\n"),
    why: "Fit view stops at a readable 58% and starts from the run's beginning when everything cannot fit.",
  },
];
