import { describe, expect, it } from "vitest";
import { boardLayout, type LayoutBlock } from "$features/work/lib/board/layout";
import { objectHeight, objectWidth } from "$features/work/lib/board/object-size";
import type { ObjectView } from "$features/work/lib/board/types";
import { sheetCellsAsText } from "../src/zephium-wire";
import { acrossChoices, boardMetrics, modelHeight, setWidth, visualLayout, type VisualBlock } from "../src/designer/moodboard-layout";

const NAMES = ["Architectural Brutalism", "Editorial and Typographic Form", "Brutalist Poster", "Color and Texture", "Design References"];

/** A picks group as the board sees it: Zephium's own width range, and (unless given) the card model's height. */
function group(id: string, count: number, height?: (width: number) => number): LayoutBlock {
  const view = { kind: "picks", id, title: id, facet: "other", items: Array.from({ length: count }, (_, i) => ({ name: "p" + i, tags: [], facts: [] })) } as unknown as ObjectView;
  return {
    id,
    kind: "picks",
    emphasis: "hero",
    count,
    width: objectWidth(view),
    height: height ?? ((width) => objectHeight(view, width)),
  };
}

/** A board of `total` pictures in two to five named groups, as the fixtures make. */
function moodboard(total: number) {
  const groups = total <= 5 ? 2 : total <= 10 ? 3 : total <= 20 ? 4 : 5;
  return Array.from({ length: groups }, (_, g) => group(NAMES[g]!, Math.floor(total / groups) + (g < total % groups ? 1 : 0)));
}

function apart(at: Record<string, { x: number; y: number; width: number; height: number }>) {
  const rects = Object.entries(at);
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const [, a] = rects[i]!, [, b] = rects[j]!;
      const ok = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(ok, `${rects[i]![0]} overlaps ${rects[j]![0]}`).toBe(true);
    }
}

describe("V33 visual board", () => {
  it("offers only the card counts Zephium's Picks draws (balanced rows, never 4 + 1)", () => {
    expect(acrossChoices(1)).toEqual([1]);
    expect(acrossChoices(2)).toEqual([2]);
    expect(acrossChoices(5)).toEqual([3, 5]);
    expect(acrossChoices(8)).toEqual([2, 3, 4]);
    expect(acrossChoices(10)).toEqual([2, 4, 5]);
    // Picks computes its own count from the width it is given: the widths chosen here give these counts.
    for (const across of [2, 3, 4, 5]) expect(Math.floor((setWidth(across) + 16) / (220 + 16))).toBe(across);
  });

  for (const total of [5, 10, 20, 40]) {
    it(`${total} pictures: groups kept whole, side by side, no overlaps, a screen-shaped board`, () => {
      const blocks = moodboard(total);
      const board = boardLayout(blocks, { profile: "visual" });
      apart(board.at);
      expect(Object.keys(board.at).sort()).toEqual(blocks.map((b) => b.id).sort());
      const metrics = boardMetrics(board);
      const lefts = new Set(Object.values(board.at).map((rect) => rect.x));
      // Two or more groups stand side by side: the board is no longer one vertical column.
      expect(lefts.size).toBeGreaterThanOrEqual(2);
      expect(metrics.aspect).toBeGreaterThan(0.8);
      expect(metrics.empty).toBeLessThan(0.3);
      // Every group stands at a real Picks width: 2 to 5 cards of at most 248 px (never shrunk).
      for (const rect of Object.values(board.at)) expect([2, 3, 4, 5].map(setWidth)).toContain(rect.width);
    });
  }

  it("is deterministic and does not flip its grid when the cards measure themselves", () => {
    const first = boardLayout(moodboard(20), { profile: "visual" });
    expect(boardLayout(moodboard(20), { profile: "visual" })).toEqual(first);
    // Measured heights 20% taller than estimated: the same widths and columns, only taller.
    const measured = moodboard(20).map((b) => ({ ...b, height: (w: number) => b.height(w) * 1.2 }));
    const after = boardLayout(measured, { profile: "visual" });
    for (const id of Object.keys(first.at)) expect(after.at[id]!.width).toBe(first.at[id]!.width);
    apart(after.at);
  });

  it("keeps reading order: the screenshot and tables lead a UI teardown, picture groups follow", () => {
    const shot: VisualBlock = { id: "shot", kind: "media", width: { min: 480, ideal: 560, max: 720 }, height: (w) => Math.round(w * 0.5625) + 40 };
    const sheet: VisualBlock = { id: "sheet", kind: "sheet", width: { min: 480, ideal: 520, max: 520 }, height: () => 260 };
    const pages = group("pages", 2) as VisualBlock;
    const board = visualLayout([pages, sheet, shot])!;
    apart(board.at);
    expect(board.at.shot!.y).toBe(0);
    expect(board.at.shot!.x).toBe(0);
    expect(board.at.pages!.y + board.at.pages!.x).toBeGreaterThan(0);
  });

  it("a portrait-heavy group is modelled taller than a landscape one", () => {
    expect(modelHeight(6, 3, 0.75)).toBeGreaterThan(modelHeight(6, 3, 1.5));
  });

  it("other profiles keep their layout (only 'visual' changes)", () => {
    const blocks = moodboard(10);
    const plain = (profile?: string) => JSON.stringify(boardLayout(blocks, profile ? { profile } : {}));
    for (const profile of ["matrix", "technical", "timeline", "schedule", "messages", "research"])
      expect(plain(profile)).not.toEqual(JSON.stringify(boardLayout(blocks, { profile: "visual" })));
    // An opened block keeps Zephium's rows on a visual board too.
    const opened = boardLayout(blocks, { profile: "visual", open: blocks[0]!.id });
    expect(opened.at[blocks[0]!.id]!.x).toBe(0);
  });

  it("draws the engine's number, boolean and empty sheet cells as text (they crashed the canvas)", () => {
    const wire = sheetCellsAsText({ columns: [{ label: "Plan", kind: "entity" }, { label: "Price", kind: "money" }, { label: "SSO", kind: "yes_no" }], rows: [{ cells: ["Pro", 10, false] }, { cells: ["Team", null, true], source: "S2" }] }) as unknown as { kind: string; rows: { cells: string[]; source?: string }[] };
    expect(wire.kind).toBe("sheet");
    expect(wire.rows.map((row) => row.cells)).toEqual([["Pro", "10", "No"], ["Team", "", "Yes"]]);
    expect(wire.rows[1]!.source).toBe("S2");
  });
});
