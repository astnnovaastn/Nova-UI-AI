import { describe, expect, it } from "vitest";
import { CAPTION, ROWS, overlaps, rankAgents, semanticLayout, type SemanticInput } from "../src/semantic-layout";
import { classicRelations } from "../src/classic-relations";
import { routeAround } from "../src/route";
import { layoutPolicy } from "../src/layout-policy";

const gaps = layoutPolicy({ mode: "deep", workers: 2, sources: 6 }).gaps;
const card = (id: string, height = 238, width = 348) => ({ id, width, height });
const run = (sources: number, workers: { id: string; rank?: number }[] = [], papers = 1): SemanticInput => ({
  request: { id: "request", x: 0, y: 0, width: 320, height: 90 },
  under: [card("steps", 600, 340)],
  sources: Array.from({ length: sources }, (_, i) => card(`s${i + 1}`)),
  sourceList: card("list", 246, 560),
  workers: workers.map((w) => ({ ...card(w.id, 176, 300), rank: w.rank })),
  lead: card("lead", 176, 300),
  papers: Array.from({ length: papers }, (_, i) => card(`paper${i}`, 960, 760)),
  map: null,
  gaps,
});
const columnsOf = (positions: Record<string, { x: number }>, ids: string[]) => {
  const xs = new Map<number, string[]>();
  for (const id of ids) xs.set(positions[id]!.x, [...(xs.get(positions[id]!.x) ?? []), id]);
  return [...xs.entries()].sort((a, b) => a[0] - b[0]).map(([, list]) => list);
};

describe("stages from dependencies", () => {
  it("ranks workers by the longest chain of forward relations, ignoring control relations that point back", () => {
    const links = [
      { source: "s1", target: "analysis", types: ["evidence"] },
      { source: "analysis", target: "verification", types: ["verifies"] },
      { source: "verification", target: "lead", types: ["delivers"] },
      { source: "lead", target: "analysis", types: ["assigns"] },
      { source: "discovery", target: "request", types: ["searches"] },
    ];
    const ranks = rankAgents(links, new Set(["s1"]), ["analysis", "verification", "discovery"]);
    expect(ranks.get("analysis")).toBe(2);
    expect(ranks.get("verification")).toBe(3);
    expect(ranks.has("discovery")).toBe(false);
  });

  it("puts each rank in its own stage, left to right, and the report always last", () => {
    const { positions } = semanticLayout(run(3, [{ id: "analysis", rank: 2 }, { id: "verification", rank: 3 }]));
    expect(positions["s1"]!.x).toBeLessThan(positions["analysis"]!.x);
    expect(positions["analysis"]!.x).toBeLessThan(positions["verification"]!.x);
    expect(positions["verification"]!.x).toBeLessThan(positions["lead"]!.x);
    expect(positions["lead"]!.x).toBeLessThan(positions["paper0"]!.x);
  });

  it("puts follow-up outputs to the right of the report, each in its own stage", () => {
    const { positions } = semanticLayout(run(2, [], 3));
    expect(positions["paper0"]!.x).toBeLessThan(positions["paper1"]!.x);
    expect(positions["paper1"]!.x).toBeLessThan(positions["paper2"]!.x);
  });
});

describe("one to four visible cards a stage", () => {
  it.each([1, 2, 3, 4, 6, 9])("%i sources: columns of at most four, no padding cards", (n) => {
    const input = run(n);
    const { positions } = semanticLayout(input);
    const columns = columnsOf(positions, input.sources.map((s) => s.id));
    expect(columns.every((c) => c.length <= ROWS)).toBe(true);
    expect(columns.flat()).toHaveLength(n);
    expect(columns).toHaveLength(Math.ceil(n / ROWS));
  });

  it("centres a lone card on the shared midline, and balances two around it", () => {
    const { positions } = semanticLayout(run(2, [{ id: "a", rank: 2 }, { id: "b", rank: 2 }]));
    const mid = (id: string, h: number) => positions[id]!.y + h / 2;
    const midline = mid("paper0", 960);
    expect(Math.abs(mid("lead", 176) - midline)).toBeLessThanOrEqual(1);
    expect(mid("a", 176)).toBeLessThan(midline);
    expect(mid("b", 176)).toBeGreaterThan(midline);
    expect(Math.abs((mid("a", 176) + mid("b", 176)) / 2 - midline)).toBeLessThanOrEqual(1);
  });

  it("keeps a wide corridor between stages and a calm gap between cards, with nothing overlapping", () => {
    const input = run(6, [{ id: "analysis", rank: 2 }]);
    const { positions } = semanticLayout(input);
    const boxes = [input.request, ...input.under, ...input.sources, input.sourceList!, ...input.workers, input.lead!, ...input.papers].map((b) => {
      const captioned = /^s\d/.test(b.id);
      return { id: b.id, x: positions[b.id]!.x, y: positions[b.id]!.y - (captioned ? CAPTION : 0), width: b.width, height: b.height + (captioned ? CAPTION : 0) };
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!), `${boxes[i]!.id} × ${boxes[j]!.id}`).toBe(false);
    // Analysis stands a full stage corridor right of the last source column.
    const lastSourceRight = Math.max(...input.sources.map((s) => positions[s.id]!.x + s.width));
    expect(positions["analysis"]!.x - lastSourceRight).toBe(160);
    expect(positions["s2"]!.y - (positions["s1"]!.y + 238)).toBe(100);
    expect(positions["s5"]!.x - (positions["s1"]!.x + 348)).toBe(100);
  });

  it("hangs the full source list under its column without pulling the midline down", () => {
    const withList = semanticLayout(run(3));
    const without = semanticLayout({ ...run(3), sourceList: null });
    expect(withList.positions["s1"]).toEqual(without.positions["s1"]);
    expect(withList.positions["list"]!.y).toBeGreaterThan(withList.positions["s3"]!.y + 238);
  });
});

describe("follow-ups", () => {
  it("scope each request's strings to its own search and report, with distinct ids", () => {
    const paper = { markdown: "A [S1]", sources: [{ id: "S1", url: "https://a.example/1" }] };
    const first = classicRelations(paper, []);
    const second = classicRelations(paper, [], { query: "query:2", report: "report:p2", prefix: "2." });
    expect(second.relations.map((r) => r.source)).toContain("query:2");
    expect(second.relations.map((r) => r.target)).toContain("report:p2");
    expect(second.urls.get("2.S1")).toBe("https://a.example/1");
    const ids = new Set([...first.relations, ...second.relations].map((r) => r.id));
    expect(ids.size).toBe(first.relations.length + second.relations.length);
  });
});

describe("shared trunks", () => {
  it("strings fanning out from one card share one trunk beside their target column", () => {
    const s = { x: 320, y: 45 };
    const targets = [100, 400, 700, 1000].map((y) => ({ x: 600, y }));
    const routes = targets.map((t) => routeAround(s, t, [])!);
    const trunks = new Set(routes.map((r) => r.at(-2)!.x));
    expect(trunks.size).toBe(1);
  });

  it("long strings into one card merge into the same corridor", () => {
    const t = { x: 2000, y: 500 };
    const sources = [100, 300, 700].map((y) => ({ x: 400, y }));
    const blocker = { x: 1200, y: 420, width: 300, height: 176 };
    const corridors = sources.map((s) => routeAround(s, t, [blocker], 0, { merge: true })!).map((r) => r[2]!.y);
    expect(new Set(corridors).size).toBe(1);
  });
});
