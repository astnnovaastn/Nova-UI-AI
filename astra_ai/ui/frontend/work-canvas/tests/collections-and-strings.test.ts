import { describe, expect, it } from "vitest";
import { IMAGES_ID, VIDEOS_ID, collectionRelations, collectionSize, imageCollection, videoCollection } from "../src/collections";
import { strandLinks, type Relation } from "../src/relations";
import { facingCurve, passThrough, routeAround, smoothPath } from "../src/route";
import { ease, glide, travelMs } from "../src/construction.svelte";
import { semanticLayout } from "../src/semantic-layout";
import type { ResearchReport } from "../src/research-to-run";

const report = (extra: Partial<ResearchReport> = {}): ResearchReport => ({
  research_id: "r1",
  query: "grid batteries",
  sources: [
    { id: "S1", title: "One", url: "https://www.one.example/a" },
    { id: "S2", title: "Two", url: "https://two.example/b" },
  ],
  image_items: [
    { id: "i1", source_id: "S1", caption: "A plant", content_hash: "h1" },
    { id: "i2", source_id: "S2", caption: "A chart", content_hash: "h2" },
    { id: "i3", source_id: "S2", caption: "Same picture again", content_hash: "h2" },
  ],
  ...extra,
});

describe("Images collection", () => {
  it("holds the report's own images once each, with the page each came from", () => {
    const data = imageCollection(report())!;
    expect(data.images.map((row) => [row.id, row.host])).toEqual([["i1", "one.example"], ["i2", "two.example"]]);
    expect(imageCollection(report({ image_items: [] }))).toBeNull();
  });

  it("joins each image to its source page and the collection to the report", () => {
    const rows = collectionRelations(imageCollection(report()), null, { query: "search:1", report: "report" });
    expect(rows.map((row) => [row.type, row.source, row.target])).toEqual([
      ["illustrates", "url:https://www.one.example/a", IMAGES_ID],
      ["illustrates", "url:https://two.example/b", IMAGES_ID],
      ["includes", IMAGES_ID, "report"],
    ]);
    expect(rows.every((row) => row.detail.derived === true)).toBe(true);
  });
});

describe("Videos collection", () => {
  const media = [
    { url: "https://www.youtube.com/watch?v=s8qnzJn0j5I", title: "How it works", provider: "tavily" },
    { url: "https://youtu.be/s8qnzJn0j5I", title: "Duplicate" },
    { url: "https://example.org/not-a-video" },
  ];

  it("keeps real YouTube videos once each, with YouTube's own still when none was given", () => {
    const data = videoCollection(report({ media, media_status: "complete" }))!;
    expect(data.state).toBe("ready");
    expect(data.videos).toHaveLength(1);
    expect(data.videos[0]!.thumbnail).toBe("https://i.ytimg.com/vi/s8qnzJn0j5I/hqdefault.jpg");
  });

  it("shows a failed search honestly and hides a search that never ran or found nothing", () => {
    const failed = videoCollection(report({ media: [], media_status: "partial", media_failures: [{ reason: "video_provider_quota" }] }))!;
    expect(failed.state).toBe("unavailable");
    expect(failed.note).toMatch(/quota/);
    const rows = collectionRelations(null, failed, { query: "search:1", report: "report" });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("failed");
    expect(videoCollection(report({ media: [], media_status: "complete" }))).toBeNull();
    expect(videoCollection(report({ media: [], media_status: "idle" }))).toBeNull();
    expect(videoCollection(report({ media: [], media_status: "running" }))!.state).toBe("searching");
  });

  it("joins the search to every video found, and the videos to the report", () => {
    const rows = collectionRelations(null, videoCollection(report({ media, media_status: "complete" })), { query: "search:1", report: "report" });
    expect(rows.map((row) => [row.type, row.source, row.target, row.status])).toEqual([
      ["collects", "search:1", VIDEOS_ID, "complete"],
      ["includes", VIDEOS_ID, "report", "complete"],
    ]);
  });

  it("sizes each sheet from what it holds", () => {
    const images = collectionSize(imageCollection(report())!);
    const videos = collectionSize(videoCollection(report({ media, media_status: "complete" }))!);
    expect(images.width).toBe(380);
    expect(images.height).toBeGreaterThan(200);
    expect(videos.height).toBeGreaterThan(150);
  });
});

const rel = (id: string, type: Relation["type"], source: string, target: string): Relation => ({
  id, type, source, target, label: "", status: "complete", event_seq: 1, at: 0, evidence_id: "", url: "", note: "", detail: {},
});

describe("Strings point the way the work flows", () => {
  it("draws an assigned worker that delivered back from the worker to AEGIS", () => {
    const { links } = strandLinks([rel("a", "assigns", "agent:lead", "agent:w"), rel("d", "delivers", "agent:w", "agent:lead")], (ref) => ref);
    expect(links.every((link) => link.source === "agent:w" && link.target === "agent:lead")).toBe(true);
    expect(links.find((link) => link.strand.relations[0]!.id === "a")!.strand.control).toBe(true);
    expect(links.find((link) => link.strand.relations[0]!.id === "d")!.strand.control).toBeUndefined();
  });

  it("keeps research relations and the plan as drawn; only assigning is control", () => {
    const { links } = strandLinks([rel("f", "found", "query:1", "source:S1"), rel("p", "plans", "request", "agent:lead")], (ref) => ref);
    expect(links.find((link) => link.id.includes("f"))!.strand.control).toBeUndefined();
    expect(links.find((link) => link.id.includes("p"))!.strand.control).toBeUndefined();
  });
});

describe("String shapes", () => {
  it("a direct string leaves and enters its ports horizontally", () => {
    const curve = facingCurve({ x: 0, y: 0 }, { x: 400, y: 200 });
    expect(curve.controls[0].y).toBe(0);
    expect(curve.controls[1].y).toBe(200);
    expect(curve.d.startsWith("M 0,0 C")).toBe(true);
    expect(curve.mid).toEqual({ x: 200, y: 100 });
  });

  it("a detour bends in S-curves, never in elbows, and ends on its port", () => {
    const blocker = { x: 200, y: 150, width: 200, height: 100 };
    const route = routeAround({ x: 0, y: 200 }, { x: 600, y: 200 }, [blocker])!;
    const path = smoothPath(route);
    expect(path.d).not.toMatch(/ Q /);
    expect((path.d.match(/ C /g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(path.d.endsWith("L 600,200")).toBe(true);
  });

  it("finds a clear corridor even when the gutter beside a port is blocked", () => {
    // A card stands in the gutter right of the source, reaching down past the corridor.
    const gutter = { x: 40, y: 260, width: 30, height: 400 };
    const wall = { x: 200, y: 0, width: 200, height: 600 };
    const route = routeAround({ x: 0, y: 200 }, { x: 700, y: 650 }, [gutter, wall], 0, { merge: true });
    expect(route).not.toBeNull();
    expect(route!.some((point) => point.y > 600)).toBe(true);
  });
});

describe("The hand moves slowly and smoothly", () => {
  it("eases with no jolt at either end", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5);
    // Speed is zero at both ends: tiny steps there.
    expect(ease(0.01)).toBeLessThan(0.0001);
    expect(1 - ease(0.99)).toBeLessThan(0.0001);
  });

  it("glides along a gentle bow that starts and ends exactly on its points", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 400, y: 0 };
    expect(glide(from, to, 0)).toEqual(from);
    expect(glide(from, to, 1).x).toBeCloseTo(400);
    expect(glide(from, to, 1).y).toBeCloseTo(0);
    expect(Math.abs(glide(from, to, 0.5).y)).toBeGreaterThan(10);
    expect(Math.abs(glide(from, to, 0.5).y)).toBeLessThanOrEqual(46);
  });

  it("takes longer trips than before, but never a crawl", () => {
    expect(travelMs({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeGreaterThanOrEqual(460);
    expect(travelMs({ x: 0, y: 0 }, { x: 9000, y: 0 })).toBe(1250);
  });
});

describe("Collections in the layout", () => {
  const gaps = { column: 150, row: 56, paper: 170, map: 110 };
  it("stand as their own column after AEGIS and before the report, one above the other", () => {
    const layout = semanticLayout({
      request: { id: "request", x: 0, y: 0, width: 300, height: 120 },
      under: [],
      sources: [{ id: "s1", width: 240, height: 200 }],
      workers: [],
      lead: { id: "lead", width: 300, height: 176 },
      collections: [{ id: IMAGES_ID, width: 380, height: 300 }, { id: VIDEOS_ID, width: 380, height: 200 }],
      papers: [{ id: "paper", width: 760, height: 960 }],
      gaps,
    });
    const at = layout.positions;
    expect(at[IMAGES_ID]!.x).toBe(at.lead!.x + 300 + 160);
    expect(at[VIDEOS_ID]!.x).toBe(at[IMAGES_ID]!.x);
    expect(at[VIDEOS_ID]!.y).toBe(at[IMAGES_ID]!.y + 300 + 160);
    expect(at.paper!.x).toBe(at[IMAGES_ID]!.x + 380 + 160);
  });
});

describe("Far strings cross the columns between through their gaps", () => {
  it("goes over or under a card in its way, never through it", () => {
    const card = { x: 300, y: 150, width: 200, height: 100 };
    const path = passThrough({ x: 0, y: 200 }, { x: 800, y: 200 }, [card])!;
    expect(path.through).toEqual([]);
    expect(path.d).not.toContain("300,200 L 500,200");
    expect(path.d.endsWith("800,200")).toBe(true);
  });

  it("uses the gap between two cards when the line would hit one", () => {
    const upper = { x: 300, y: 0, width: 200, height: 100 };
    const lower = { x: 300, y: 400, width: 200, height: 100 };
    const path = passThrough({ x: 0, y: 300 }, { x: 800, y: 300 }, [upper, lower])!;
    // Between the cards: under the upper one (100 + 6) and over the lower one's caption band (400 - 30 - 6).
    const y = Number(/L 500,([\d.]+)/.exec(path.d)![1]);
    expect(y).toBeGreaterThan(106);
    expect(y).toBeLessThan(364);
  });

  it("passes through a card only when the caller says the data really goes through it", () => {
    const card = { x: 300, y: 150, width: 200, height: 100 };
    const path = passThrough({ x: 0, y: 100 }, { x: 800, y: 300 }, [card], 0, { viaCards: true })!;
    expect(path.through).toEqual([card]);
    expect(path.d).toContain("300,200 L 500,200");
  });
});
