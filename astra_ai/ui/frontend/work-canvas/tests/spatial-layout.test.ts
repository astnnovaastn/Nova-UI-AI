import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CAPTION, ROWS, keptPositions, overlaps, retrievalOrder, semanticLayout, type SemanticInput } from "../src/semantic-layout";
import { curveHits, roundedPath, routeAround, segmentHits } from "../src/route";
import { strandLinks, type Relation } from "../src/relations";
import { layoutPolicy } from "../src/layout-policy";

const gaps = layoutPolicy({ mode: "deep", workers: 2, sources: 12 }).gaps;
const browser = (id: string) => ({ id, width: 348, height: 238 });

function deepRun(sources = 12): SemanticInput {
  return {
    request: { id: "request", x: 0, y: 0, width: 320, height: 90 },
    under: [{ id: "search", width: 320, height: 107 }, { id: "steps", width: 340, height: 590 }],
    sources: Array.from({ length: sources }, (_, i) => browser(`source:${i + 1}`)),
    sourceList: { id: "sources", width: 560, height: 246 },
    workers: [{ id: "worker:analysis", width: 300, height: 176 }, { id: "worker:verification", width: 300, height: 176 }],
    lead: { id: "worker:lead", width: 300, height: 176 },
    papers: [{ id: "paper", width: 760, height: 960 }],
    map: null,
    gaps,
  };
}

/** Every placed box, with the caption band above each source counted as part of it. */
function boxes(input: SemanticInput, positions: Record<string, { x: number; y: number }>) {
  const all = [input.request, ...input.under, ...input.sources, ...(input.sourceList ? [input.sourceList] : []), ...input.workers, ...(input.lead ? [input.lead] : []), ...input.papers];
  const captioned = new Set(input.sources.map((s) => s.id));
  return all.map((b) => {
    const at = positions[b.id]!;
    return captioned.has(b.id) ? { id: b.id, x: at.x, y: at.y - CAPTION, width: b.width, height: b.height + CAPTION } : { id: b.id, ...at, width: b.width, height: b.height };
  });
}

describe("semantic layout", () => {
  it("keeps twelve sources in retrieval order, down each column and then on to the next", () => {
    // Cards arrive in any order; the evidence index (S1, S2, …) decides.
    const shuffled = [5, 1, 12, 3, 8, 2, 11, 4, 7, 10, 6, 9].map((n) => ({ id: `source:${n}`, first: n - 1 }));
    const ordered = retrievalOrder(shuffled, (card) => card.first);
    expect(ordered.map((card) => card.id)).toEqual(Array.from({ length: 12 }, (_, i) => `source:${i + 1}`));
    const input = deepRun(12);
    const { positions } = semanticLayout(input);
    const cols = [...new Set(input.sources.map((s) => positions[s.id]!.x))];
    expect(cols).toHaveLength(12 / ROWS);
    for (let i = 1; i < 12; i++) {
      const a = positions[`source:${i}`]!;
      const b = positions[`source:${i + 1}`]!;
      if (i % ROWS) expect(b.x === a.x && b.y > a.y).toBe(true);
      else expect(b.x).toBeGreaterThan(a.x);
    }
  });

  it("puts sources without a retrieval record after the others, in the order the canvas listed them", () => {
    const ordered = retrievalOrder([{ id: "a", n: Infinity }, { id: "b", n: 2 }, { id: "c", n: Infinity }, { id: "d", n: 0 }], (c) => c.n);
    expect(ordered.map((c) => c.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("reads left to right: request, sources, workers, AEGIS, report", () => {
    const input = deepRun(6);
    const { positions } = semanticLayout(input);
    const right = (id: string, width: number) => positions[id]!.x + width;
    const lastSource = Math.max(...input.sources.map((s) => right(s.id, s.width)));
    expect(Math.min(...input.sources.map((s) => positions[s.id]!.x))).toBeGreaterThan(right("steps", 340));
    expect(positions["worker:analysis"]!.x).toBeGreaterThan(lastSource);
    expect(positions["worker:lead"]!.x).toBeGreaterThan(right("worker:analysis", 300));
    expect(positions["paper"]!.x).toBeGreaterThan(right("worker:lead", 300));
  });

  it("never overlaps mixed-size cards or their captions, and leaves no large empty gaps", () => {
    const input: SemanticInput = {
      ...deepRun(0),
      sources: [browser("browser"), { id: "image", width: 300, height: 400 }, { id: "checklist", width: 420, height: 160 }, { id: "doc", width: 260, height: 520 }, browser("b2")],
      workers: [{ id: "analysis", width: 300, height: 176 }],
    };
    const { positions, box } = semanticLayout(input);
    const placed = boxes(input, positions);
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i]!, placed[j]!), `${placed[i]!.id} × ${placed[j]!.id}`).toBe(false);
    // Horizontally, consecutive zones are never further apart than a column gap plus the room where strings converge.
    const xs = [...new Set(placed.map((p) => p.x))].sort((a, b) => a - b);
    const ends = (x: number) => Math.max(...placed.filter((p) => p.x === x).map((p) => p.x + p.width));
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - ends(xs[i - 1]!)).toBeLessThanOrEqual(gaps.column + 56 + gaps.paper);
    // The run is wider than tall, not one tall column.
    expect(box.width).toBeGreaterThan(box.height);
  });

  it("is deterministic, and a new source never moves the ones already placed", () => {
    const a = semanticLayout(deepRun(7)).positions;
    expect(semanticLayout(deepRun(7)).positions).toEqual(a);
    const b = semanticLayout(deepRun(8)).positions;
    for (let i = 1; i <= 7; i++) expect(b[`source:${i}`]).toEqual(a[`source:${i}`]);
    expect(b["request"]).toEqual(a["request"]);
  });

  it("starts from where the request already stands", () => {
    const input = { ...deepRun(3), request: { id: "request", x: 400, y: -120, width: 320, height: 90 } };
    const { positions } = semanticLayout(input);
    expect(positions["request"]).toEqual({ x: 400, y: -120 });
    expect(positions["worker:lead"]!.y).toBe(-120);
  });

  it("keeps the band between the request and AEGIS free of sources", () => {
    const input = deepRun(6);
    const { positions } = semanticLayout(input);
    const spine = Math.max(input.request.height, input.lead!.height) / 2;
    for (const s of input.sources) expect(positions[s.id]!.y - CAPTION).toBeGreaterThan(spine);
  });

  it("places the knowledge map beside or under the run, as the policy chose", () => {
    const right = semanticLayout({ ...deepRun(3), map: { width: 900, height: 600, place: "right" } });
    expect(right.map!.x).toBeGreaterThanOrEqual(right.positions["paper"]!.x + 760);
    const below = semanticLayout({ ...deepRun(3), map: { width: 900, height: 600, place: "below" } });
    expect(below.map!.y).toBeGreaterThanOrEqual(below.positions["paper"]!.y + 960);
  });
});

describe("saved arrangements", () => {
  const record = (automatic: boolean) => ({
    automatic,
    positions: { a: { x: 1, y: 2 }, b: { x: 3, y: 4 }, c: { x: 5, y: 6 } },
    constraints: { a: { manual: true }, b: { pinned: true }, c: {} },
  });
  it("keeps everything a person arranged", () => {
    expect(keptPositions(record(false))).toEqual(record(false).positions);
  });
  it("keeps only what the person moved or pinned from what the automatic organizer saved", () => {
    expect(keptPositions(record(true))).toEqual({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } });
  });
  it("has nothing to keep without a record", () => {
    expect(keptPositions(null)).toEqual({});
  });
});

describe("routing around cards", () => {
  const card = { x: 200, y: 100, width: 200, height: 200 };
  it("leaves a clear curve alone", () => {
    expect(curveHits({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 500, y: 0 }, { x: 600, y: 0 }, [card])).toBe(false);
  });
  it("sees a curve through a card, and its caption band", () => {
    expect(curveHits({ x: 0, y: 200 }, { x: 200, y: 200 }, { x: 400, y: 200 }, { x: 600, y: 200 }, [card])).toBe(true);
    expect(curveHits({ x: 0, y: 85 }, { x: 200, y: 85 }, { x: 400, y: 85 }, { x: 600, y: 85 }, [card])).toBe(true);
  });
  it("routes over or under a card, never through it, and ends at the target port", () => {
    const route = routeAround({ x: 0, y: 200 }, { x: 600, y: 200 }, [card])!;
    expect(route).not.toBeNull();
    for (let i = 1; i < route.length; i++) expect(segmentHits(route[i - 1]!, route[i]!, [card])).toBe(false);
    expect(route[0]).toEqual({ x: 0, y: 200 });
    expect(route.at(-1)).toEqual({ x: 600, y: 200 });
    expect(roundedPath(route).d.endsWith("L 600,200")).toBe(true);
  });
  it("reaches a card in a second column down the gutter beside it", () => {
    const first = { x: 200, y: 150, width: 200, height: 200 };
    const route = routeAround({ x: 0, y: 40 }, { x: 600, y: 300 }, [first])!;
    expect(route.map((p) => p.y)).toContain(40);
    expect(route.at(-2)!.x).toBeGreaterThan(first.x + first.width);
  });
  it("keeps parallel strands apart", () => {
    const a = routeAround({ x: 0, y: 200 }, { x: 600, y: 200 }, [card], -5)!;
    const b = routeAround({ x: 0, y: 200 }, { x: 600, y: 200 }, [card], 5)!;
    expect(a[1]!.x).not.toBe(b[1]!.x);
  });
});

describe("strands stand for relations", () => {
  const rel = (n: number, type: Relation["type"] = "cites"): Relation => ({
    id: `r${n}`, type, source: "source:S1", target: "report", label: type, status: "complete", event_seq: n, detail: {},
  } as unknown as Relation);
  it.each([1, 2, 3])("%i relations between two cards draw %i strands", (count) => {
    const types: Relation["type"][] = ["cites", "evidence", "found"];
    const { links } = strandLinks(Array.from({ length: count }, (_, i) => rel(i + 1, types[i])), (ref) => (ref === "report" ? "paper" : "lane"));
    expect(links).toHaveLength(count);
  });
});

describe("the Research canvas", () => {
  const host = readFileSync(new URL("../src/AegisWorkHost.svelte", import.meta.url), "utf8");
  it("offers no Auto Arrange control or settings", () => {
    expect(host).not.toMatch(/ArrangeControl/);
  });
  it("lays out without asking a model", () => {
    for (const file of ["../src/semantic-layout.ts", "../src/route.ts"]) expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(/fetch\(|XMLHttpRequest|\/api\//);
  });
});
