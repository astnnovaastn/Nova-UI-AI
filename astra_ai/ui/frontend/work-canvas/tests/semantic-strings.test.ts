import { describe, expect, it } from "vitest";
import { MEANING, combinedStatus, relationsOf, strandLinks, validRelation, type Relation } from "../src/relations";
import { agentStatus, mapNodeStatus, reportStatus } from "../src/status";
import { layoutPolicy, mapPlacement, LEGACY_GAPS } from "../src/layout-policy";
import { alongString, plan, travelMs } from "../src/construction.svelte";

let seq = 0;
const rel = (type: Relation["type"], source: string, target: string, extra: Partial<Relation> = {}): Relation => ({
  id: `rel-${++seq}`,
  type,
  source,
  target,
  label: "",
  status: "complete",
  event_seq: seq,
  at: 0,
  evidence_id: "",
  url: "",
  note: "",
  detail: {},
  ...extra,
});

/** Cards: request, two source lanes, the analysis agent, the lead and the paper. */
const CARDS: Record<string, string> = {
  request: "req",
  "query:1": "req",
  "query:2": "req",
  "agent:lead": "worker:lead",
  "agent:analysis": "worker:worker_b",
  "source:S1": "lane-1",
  "source:S2": "lane-2",
  report: "paper:1",
};
const resolve = (ref: string) => CARDS[ref] ?? null;

describe("relations", () => {
  it("accepts only typed relations with the right kinds of endpoint", () => {
    expect(validRelation(rel("found", "query:1", "source:S1"))).toBe(true);
    expect(validRelation(rel("found", "source:S1", "query:1"))).toBe(false);
    expect(validRelation(rel("cites", "source:S1", "agent:lead"))).toBe(false);
    expect(validRelation({ ...rel("found", "query:1", "source:S1"), status: "done" })).toBe(false);
    expect(validRelation({ ...rel("found", "query:1", "source:S1"), type: "decor" })).toBe(false);
    const good = rel("plans", "request", "agent:lead");
    expect(relationsOf({ relations: [good, good, { junk: true }] })).toEqual([good]);
    expect(relationsOf(null)).toEqual([]);
  });

  it("draws one, two and three strings for one, two and three real relations", () => {
    for (const count of [1, 2, 3]) {
      const rows = Array.from({ length: count }, (_, index) => rel(index === 0 ? "evidence" : index === 1 ? "cites" : "supports", "source:S1", index === 0 ? "agent:analysis" : index === 1 ? "report" : "map:x"));
      // All three resolve between the same two cards here.
      const { links } = strandLinks(rows, (ref) => (ref === "source:S1" ? "lane-1" : "worker:worker_b"));
      expect(links).toHaveLength(count);
      expect(links.map((link) => link.strand.index)).toEqual(Array.from({ length: count }, (_, index) => index));
      expect(links.every((link) => link.strand.of === count && link.strand.relations.length === 1)).toBe(true);
      expect(links.filter((link) => link.strand.labelled)).toHaveLength(1);
    }
  });

  it("never draws a string for a relation without two distinct cards, and keeps it for inspection", () => {
    const plans = rel("plans", "request", "agent:lead");
    const found = rel("found", "query:1", "source:S1");
    const searchToRequestCard = rel("searches", "agent:lead", "query:1");
    const missing = rel("cites", "source:S9", "report");
    const sameCard = rel("relates", "map:a", "map:b");
    const { links, unplaced } = strandLinks([plans, found, missing, sameCard], (ref) => (ref.startsWith("map:") ? "map-card" : resolve(ref)));
    expect(links.map((link) => [link.source, link.target])).toEqual([["req", "worker:lead"], ["req", "lane-1"]]);
    expect(unplaced).toEqual([missing, sameCard]);
    // A search between the same two cards as the plan, the other way round, is a parallel strand.
    const both = strandLinks([plans, searchToRequestCard], resolve).links;
    expect(both).toHaveLength(2);
    expect(both.every((link) => link.source === "req" && link.target === "worker:lead")).toBe(true);
  });

  it("groups more than three relations by type with a truthful count instead of capping them", () => {
    const rows = [
      rel("plans", "request", "agent:lead"),
      ...[1, 2, 3, 4, 5].map(() => rel("searches", "agent:lead", "query:1")),
    ];
    const { links } = strandLinks(rows, resolve);
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.strand.label).sort()).toEqual(["5 searches", MEANING.plans].sort());
    expect(links.reduce((sum, link) => sum + link.strand.relations.length, 0)).toBe(6);
  });

  it("never shows a failed or contested relation as finished or verified", () => {
    expect(combinedStatus([rel("cites", "source:S1", "report", { status: "verified" }), rel("cites", "source:S2", "report", { status: "failed" })])).toBe("failed");
    expect(combinedStatus([rel("cites", "source:S1", "report", { status: "verified" }), rel("cites", "source:S2", "report", { status: "contested" })])).toBe("contested");
    const { links } = strandLinks([rel("searches", "agent:lead", "query:1", { status: "active" })], (ref) => (ref === "agent:lead" ? "a" : "b"));
    expect(links[0]!.live).toBe(true);
  });
});

describe("status dots", () => {
  it("maps recorded states to one documented meaning and never shows failure as green", () => {
    expect(["assigned", "running", "waiting", "done", "failed", "stopped", "skipped"].map(agentStatus)).toEqual(["queued", "running", "waiting", "complete", "failed", "failed", "queued"]);
    expect(mapNodeStatus([])).toBe("waiting");
    expect(mapNodeStatus(["S1"], new Set(["S1"]))).toBe("failed");
    expect(mapNodeStatus(["S1", "S2"], new Set(["S1"]))).toBe("complete");
    expect(reportStatus("completed", true)).toBe("waiting");
    expect(reportStatus("failed")).toBe("failed");
  });
});

describe("layout policies", () => {
  it("is deterministic and compact for Quick, roomier for Deep and Structured", () => {
    const quick = layoutPolicy({ mode: "quick", workers: 1, sources: 3 });
    const deep = layoutPolicy({ mode: "deep", workers: 0, sources: 14 });
    expect(quick).toEqual(layoutPolicy({ mode: "quick", workers: 1, sources: 3 }));
    expect(quick.gaps.column).toBeLessThan(deep.gaps.column);
    expect(quick.gaps.column).toBeLessThan(LEGACY_GAPS.column);
    expect(layoutPolicy({ mode: "nonsense", workers: 0, sources: 0 }).mode).toBe("quick");
  });

  it("puts a knowledge map where the whole canvas best fits the screen", () => {
    const wide = { width: 1600, height: 900 };
    // A short, wide run with a tall map: beside it fits a wide screen better.
    expect(mapPlacement({ width: 1800, height: 700 }, { width: 900, height: 1100 }, wide, 84)).toBe("right");
    // A wide map under a run keeps the canvas close to the screen's shape.
    expect(mapPlacement({ width: 2000, height: 900 }, { width: 1900, height: 500 }, wide, 84)).toBe("below");
    const structured = layoutPolicy({ mode: "structured", workers: 3, sources: 8, run: { width: 1800, height: 700 }, map: { width: 900, height: 1100 }, view: wide });
    expect(structured.map).toBe("right");
    expect(layoutPolicy({ mode: "deep", workers: 0, sources: 8, run: { width: 1800, height: 700 }, map: { width: 900, height: 1100 } }).map).toBe("below");
  });
});

describe("construction playback", () => {
  it("places cards left to right and draws each string only after both its cards", () => {
    const steps = plan(
      [
        { id: "paper", x: 900, y: 0, label: "Report" },
        { id: "lane", x: 300, y: 0, label: "Source" },
      ],
      [
        { id: "e1", source: "lane", target: "paper", label: "Citation" },
        { id: "e0", source: "req", target: "lane", label: "Source" },
        { id: "ghost", source: "lane", target: "nowhere", label: "x" },
      ],
      new Set(["req"]),
    );
    expect(steps.map((step) => step.id)).toEqual(["lane", "e0", "paper", "e1"]);
  });

  it("times trips by distance, within bounds, faster at higher speed", () => {
    const near = travelMs({ x: 0, y: 0 }, { x: 10, y: 0 });
    const far = travelMs({ x: 0, y: 0 }, { x: 5000, y: 0 });
    expect(near).toBeGreaterThanOrEqual(240);
    expect(far).toBeLessThanOrEqual(720);
    expect(near).toBeLessThan(far);
    expect(travelMs({ x: 0, y: 0 }, { x: 400, y: 0 }, 2)).toBeLessThan(travelMs({ x: 0, y: 0 }, { x: 400, y: 0 }, 1));
  });

  it("follows the string from port to port", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 400, y: 200 };
    expect(alongString(from, to, 0)).toEqual(from);
    expect(alongString(from, to, 1)).toEqual(to);
    const middle = alongString(from, to, 0.5);
    expect(middle.x).toBeCloseTo(200);
    expect(middle.y).toBeCloseTo(100);
  });
});
