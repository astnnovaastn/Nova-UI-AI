import { describe, expect, it } from "vitest";
import { expandStacks, isStack, stackOf } from "../src/stacks";
import { classicRelations } from "../src/classic-relations";
import { strandId, strandLinks, validRelation } from "../src/relations";
import { CAPTION, WEBSITE_GAP, clearOverlaps, overlaps, semanticLayout, type Placed, type SemanticInput } from "../src/semantic-layout";
import { routeAround, segmentHits } from "../src/route";
import { layoutPolicy } from "../src/layout-policy";

const page = (n: number, host = "nvidia.com") => ({ id: `page-${n}`, url: `https://${host}/p/${n}` });
const part = (id: string, pages: { id: string; url: string }[]) => ({ id, type: "part", title: id, part: { title: id, shape: "pages", pages } });

describe("source stacks", () => {
  const stack = part("part:nvidia", [page(1, "investor.nvidia.com"), page(2, "developer.nvidia.com"), page(3), page(4)]);
  const single = part("part:aibusiness", [page(5, "aibusiness.com")]);

  it("marks a site's several pages as one closed stack with its count", () => {
    const [a, b] = expandStacks([stack, single], new Set());
    expect(a!.part!.stack).toEqual({ id: "part:nvidia", count: 4, open: false });
    expect(b!.part!.stack).toBeUndefined();
    expect(isStack(single)).toBe(false);
  });

  it("opens into one card per page, in order, the first keeping the stack's id", () => {
    const cards = expandStacks([stack, single], new Set(["part:nvidia"]));
    expect(cards.map((c) => c.id)).toEqual(["part:nvidia", "part:nvidia::p2", "part:nvidia::p3", "part:nvidia::p4", "part:aibusiness"]);
    expect(cards.slice(0, 4).map((c) => c.part!.pages[0]!.url)).toEqual(stack.part.pages.map((p) => p.url));
    expect(cards[1]!.part!.title).toBe("developer.nvidia.com");
    expect(cards.slice(0, 4).every((c) => c.part!.stack!.open && c.part!.stack!.id === "part:nvidia")).toBe(true);
    expect(stackOf(cards[2]!.id)).toBe("part:nvidia");
  });

  it("loses no page and duplicates none, open or closed", () => {
    for (const open of [new Set<string>(), new Set(["part:nvidia"])]) {
      const urls = expandStacks([stack, single], open).flatMap((c) => c.part!.pages.map((p) => p.url));
      expect(new Set(urls).size).toBe(urls.length);
      expect(urls.sort()).toEqual([...stack.part.pages, ...single.part.pages].map((p) => p.url).sort());
    }
  });

  it("gives opened page cards ids the canvas keeps (128 characters at most), however long the page ids", () => {
    const longPart = part(`part:${"a".repeat(40)}-request:example`, [0, 1, 2].map((n) => ({ id: `page:${"x".repeat(120)}${n}`, url: `https://example.org/${n}` })));
    const cards = expandStacks([longPart], new Set([longPart.id]));
    expect(cards.every((c) => c.id.length <= 128)).toBe(true);
    expect(new Set(cards.map((c) => c.id)).size).toBe(3);
  });

  it("opens every page in a long stack as an individual card", () => {
    const big = part("part:big", Array.from({ length: 30 }, (_, i) => page(i + 1)));
    const cards = expandStacks([big], new Set(["part:big"]));
    expect(cards).toHaveLength(30);
    expect(cards.map((card) => card.part.pages)).toEqual(big.part.pages.map((page) => [page]));
  });
});

describe("a classic report's strings", () => {
  const paper = {
    markdown: "Cosmos and GR00T [S3]. Isaac [S2, S3]. Elsewhere [S5]. Unknown [S9].",
    sources: [
      { id: "S1", url: "https://www.nvidia.com/robotics/" },
      { id: "S2", url: "https://developer.nvidia.com/isaac" },
      { id: "S3", url: "https://investor.nvidia.com/news" },
      { id: "S4", url: "https://www.nvidia.com/humanoid/" },
      { id: "S5", url: "https://aibusiness.com/robotics" },
    ],
  };

  it("finds every listed source, and cites only what the text cites", () => {
    const { relations, urls } = classicRelations(paper, []);
    expect(relations.filter((r) => r.type === "found")).toHaveLength(5);
    expect(relations.filter((r) => r.type === "cites").map((r) => r.source).sort()).toEqual(["source:S2", "source:S3", "source:S5"]);
    expect(urls.get("S3")).toBe("https://investor.nvidia.com/news");
    expect(relations.every(validRelation)).toBe(true);
  });

  it("adds pages the run opened that the report does not list, and never a source twice", () => {
    const { relations } = classicRelations(paper, [{ url: "https://aibusiness.com/robotics" }, { url: "https://example.org/extra" }]);
    expect(relations.filter((r) => r.type === "found")).toHaveLength(6);
    expect(relations.some((r) => r.url === "https://example.org/extra" && r.type === "found")).toBe(true);
    expect(relations.some((r) => r.url === "https://example.org/extra" && r.type === "cites")).toBe(false);
  });

  it("draws nothing without a report or pages", () => {
    expect(classicRelations(null, []).relations).toEqual([]);
  });

  it("aggregates a closed stack's strings and gives each opened page its own", () => {
    const { relations, urls } = classicRelations(paper, []);
    const nvidia = (url: string) => /nvidia/.test(url);
    const closed = strandLinks(relations, (ref) => (ref.startsWith("query") ? "request" : ref === "report" ? "paper" : nvidia(urls.get(ref.slice(7))!) ? "stack" : "aibusiness"));
    expect(closed.links.filter((l) => l.target === "stack")).toHaveLength(1);
    expect(closed.links.find((l) => l.target === "stack")!.strand.label).toBe("4 sources");
    const open = strandLinks(relations, (ref) => (ref.startsWith("query") ? "request" : ref === "report" ? "paper" : `card:${urls.get(ref.slice(7))}`));
    expect(open.links.filter((l) => l.source === "request")).toHaveLength(5);
    expect(open.links.filter((l) => l.target === "paper")).toHaveLength(3);
  });
});

describe("bundle ids", () => {
  it("fit the canvas's 128-character limit however many relations a bundle holds, and stay distinct", () => {
    const bundle = (n: number, tag = "") => Array.from({ length: n }, (_, i) => ({ id: `classic:found:query:1:source:S${i + 1}${tag}` }));
    const ids = [1, 2, 4, 9, 40].map((n) => strandId(bundle(n)));
    expect(ids.every((id) => id.length <= 128)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(strandId(bundle(9))).toBe(strandId([...bundle(9)].reverse()));
    expect(strandId(bundle(9))).not.toBe(strandId(bundle(9, "x")));
    expect(strandId([{ id: "rel-1" }])).toBe("strand:rel-1");
  });
});

describe("clearing overlaps", () => {
  it("never moves what the person placed, and steps everything else clear", () => {
    const cards: Placed[] = [
      { id: "kept", x: 0, y: 0, width: 300, height: 300 },
      { id: "new-1", x: 50, y: 100, width: 300, height: 200, caption: true },
      { id: "new-2", x: 50, y: 150, width: 300, height: 200, caption: true },
      { id: "elsewhere", x: 2000, y: 0, width: 300, height: 300 },
    ];
    const moved = clearOverlaps(cards, new Set(["kept"]), 32);
    expect(moved["kept"]).toBeUndefined();
    expect(moved["elsewhere"]).toBeUndefined();
    const at = cards.map((c) => ({ ...c, ...(moved[c.id] ?? {}) }));
    const area = (c: Placed) => (c.caption ? { ...c, y: c.y - CAPTION, height: c.height + CAPTION } : c);
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) expect(overlaps(area(at[i]!), area(at[j]!))).toBe(false);
    expect(at.find((c) => c.id === "new-1")!.x).toBe(50);
  });
});

describe("backwards strings", () => {
  it("leave their card and come back around both cards, never through them", () => {
    const source = { x: 600, y: 0, width: 300, height: 180 };
    const target = { x: 0, y: 300, width: 300, height: 180 };
    const between = { x: 320, y: 250, width: 260, height: 300 };
    const s = { x: 900, y: 90 };
    const t = { x: 0, y: 390 };
    const route = routeAround(s, t, [source, target, between])!;
    expect(route).not.toBeNull();
    for (let i = 2; i < route.length - 1; i++) expect(segmentHits(route[i - 1]!, route[i]!, [source, target, between])).toBe(false);
    expect(route[1]!.x).toBeGreaterThan(s.x);
    expect(route.at(-2)!.x).toBeLessThan(t.x);
  });
});

describe("layout invariants at 3, 12 and 30 sources", () => {
  const input = (n: number): SemanticInput => ({
    request: { id: "request", x: 0, y: 0, width: 320, height: 90 },
    under: [{ id: "steps", width: 340, height: 600 }],
    sources: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, width: i % 3 ? 348 : 362, height: i % 4 ? 238 : 300 })),
    sourceList: { id: "list", width: 560, height: 246 },
    workers: [{ id: "analysis", width: 300, height: 176 }, { id: "verification", width: 300, height: 176 }],
    lead: { id: "lead", width: 300, height: 176 },
    papers: [{ id: "paper", width: 760, height: 960 }],
    map: { width: 1200, height: 300, place: "below" },
    gaps: layoutPolicy({ mode: "deep", workers: 2, sources: n }).gaps,
  });
  it.each([3, 30])("reserves a horizontal row for %i pages before the analysis stage", (n) => {
    const spec = input(n + 1);
    const [first, ...other] = spec.sources;
    const companions = other.slice(0, n - 1);
    spec.sources = [{ ...first!, companions }, other.at(-1)!];
    const { positions } = semanticLayout(spec);
    const pages = [first!, ...companions];
    for (let index = 1; index < pages.length; index++) {
      const before = pages[index - 1]!;
      const page = pages[index]!;
      expect(positions[page.id]).toEqual({
        x: positions[before.id]!.x + before.width + WEBSITE_GAP,
        y: positions[first!.id]!.y,
      });
    }
    const last = pages.at(-1)!;
    expect(positions.analysis!.x).toBeGreaterThan(positions[last.id]!.x + last.width);
    expect(positions[other.at(-1)!.id]!.y).toBeGreaterThan(positions[first!.id]!.y + Math.max(...pages.map((page) => page.height)));
  });
  it.each([3, 12, 30])("%i sources: no overlaps, captions clear, never one tall strip", (n) => {
    const spec = input(n);
    const { positions, box } = semanticLayout(spec);
    const boxes = [spec.request, ...spec.under, ...spec.sources, spec.sourceList!, ...spec.workers, spec.lead!, ...spec.papers].map((b) => {
      const at = positions[b.id]!;
      const captioned = b.id.startsWith("s") && b.id !== "steps";
      return { id: b.id, x: at.x, y: at.y - (captioned ? CAPTION : 0), width: b.width, height: b.height + (captioned ? CAPTION : 0) };
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!), `${boxes[i]!.id} × ${boxes[j]!.id}`).toBe(false);
    expect(box.height).toBeLessThan(box.width * 1.2);
    // Ids are stable: the same input gives the same places.
    expect(semanticLayout(spec).positions).toEqual(positions);
  });
});
