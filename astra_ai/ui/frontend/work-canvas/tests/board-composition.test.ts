import { describe, expect, it } from "vitest";
import { boardLayout, type LayoutBlock } from "$features/work/lib/board/layout";

type E = LayoutBlock["emphasis"];
const block = (id: string, kind: string, emphasis: E, width: [number, number, number], height = 300): LayoutBlock => ({
  id, kind, emphasis, width: { min: width[0], ideal: width[1], max: width[2] }, height: () => height,
});
const sheet = (id: string, ideal = 640) => block(id, "sheet", "hero", [Math.min(ideal, 480), ideal, ideal], 320);
const plot = (id: string) => block(id, "plot", "primary", [360, 520, 680], 300);
const doc = (id: string) => block(id, "document", "supporting", [480, 640, 680], 900);

function check(blocks: LayoutBlock[]) {
  const layout = boardLayout(blocks);
  const rects = Object.entries(layout.at);
  expect(rects).toHaveLength(blocks.length);
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const [, a] = rects[i]!, [, b] = rects[j]!;
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(apart, `${rects[i]![0]} overlaps ${rects[j]![0]}`).toBe(true);
    }
  const columns = new Set(rects.map(([, rect]) => rect.x)).size;
  return { layout, columns };
}

describe("AEGIS composition of a Zephium board", () => {
  it("one or two results keep Zephium's rows", () => {
    const { layout } = check([sheet("a"), sheet("b")]);
    expect(layout.at.b!.y).toBeGreaterThan(layout.at.a!.y);
  });

  it("five equal cards stand in columns, not one column", () => {
    const { layout, columns } = check(["a", "b", "c", "d", "e"].map((id) => sheet(id)));
    expect(columns).toBeGreaterThan(1);
    expect(layout.height).toBeLessThan(5 * 320);
  });

  it("ten comparison tables and twelve charts fill rows", () => {
    expect(check(Array.from({ length: 10 }, (_, i) => sheet(`t${i}`))).columns).toBeGreaterThanOrEqual(2);
    expect(check(Array.from({ length: 12 }, (_, i) => plot(`p${i}`))).columns).toBeGreaterThanOrEqual(3);
  });

  it("a wide table spans columns at its own width instead of being squeezed", () => {
    const { layout } = check([sheet("wide", 1040), plot("a"), plot("b"), plot("c")]);
    expect(layout.at.wide!.width).toBeGreaterThanOrEqual(1040);
  });

  it("a long report with supporting cards, and thirty mixed results, never overlap", () => {
    check([doc("report"), sheet("s1"), plot("p1"), plot("p2"), block("l", "list", "supporting", [400, 560, 640], 260)]);
    const mixed = Array.from({ length: 30 }, (_, i) => (i % 3 === 0 ? sheet(`s${i}`, 600 + (i % 4) * 160) : i % 3 === 1 ? plot(`p${i}`) : doc(`d${i}`)));
    const { layout, columns } = check(mixed);
    expect(columns).toBeGreaterThanOrEqual(3);
    // Screen-shaped, not a tower: wider than a third of its height.
    expect(layout.width * 3).toBeGreaterThan(layout.height);
  });

  it("a diagram takes the width it draws", () => {
    const { layout } = check([block("map", "diagram", "hero", [640, 1800, 2400], 600), sheet("a"), sheet("b")]);
    expect(layout.at.map!.width).toBeGreaterThanOrEqual(1400);
  });

  it("an opened block keeps Zephium's rows", () => {
    const blocks = ["a", "b", "c"].map((id) => sheet(id));
    const layout = boardLayout(blocks, { open: "b" });
    expect(new Set(Object.values(layout.at).map((rect) => rect.x)).size).toBe(1);
  });
});
