import { describe, expect, it } from "vitest";
import { blockedWords, normalizeAddress } from "../src/browser-address";
import { buildScene, plainExcerpt, type ResearchReport } from "../src/research-to-run";
import { citationSections, traceLines, tracePhase, traceQueries, traceSources, type TraceEvent } from "../src/research-trace";

let seq = 0;
const event = (kind: string, rest: Partial<TraceEvent> = {}): TraceEvent => ({ seq: ++seq, at: 1000 + seq * 5, kind, status: "done", ...rest });
const words = (reason: string) => (reason ? `waiting: ${reason}` : "");
const pending: ResearchReport = { research_id: "abc", query: "Tides", phase: "collecting_sources", completeness: "pending", report: "", sources: [] };

describe("the trace", () => {
  it("lists each source once, in the order it was found", () => {
    const sources = traceSources([
      event("source", { url: "https://a.example/1", title: "A", excerpt: "words" }),
      event("source", { url: "https://b.example/2", title: "B" }),
      event("source", { url: "https://a.example/1", title: "A again" }),
    ]);
    expect(sources.map((source) => [source.url, source.title])).toEqual([["https://a.example/1", "A again"], ["https://b.example/2", "B"]]);
  });
  it("ignores addresses that are not web pages", () => {
    expect(traceSources([event("source", { url: "javascript:alert(1)", title: "X" }), event("source", { url: "file:///x" })])).toEqual([]);
  });
  it("records a failed page read as failed, not as read", () => {
    const list = [event("source", { url: "https://a.example/", title: "A" }), event("read", { url: "https://a.example/", status: "running" })];
    expect(traceSources(list)[0]!.state).toBe("reading");
    expect(traceSources([...list, event("read", { url: "https://a.example/", status: "failed" })])[0]!.state).toBe("failed");
  });
  it("shows each search by its latest state", () => {
    expect(traceQueries([event("search", { query: "tides", status: "running" }), event("search", { query: "tides", count: 3 })])).toEqual([{ query: "tides", status: "done", count: 3 }]);
    expect(traceQueries([event("search", { query: "moon", status: "failed", reason: "provider_quota" })])[0]).toEqual({ query: "moon", status: "failed", reason: "provider_quota" });
  });
  it("reports the latest phase", () => {
    expect(tracePhase([event("phase", { phase: "collecting_sources" }), event("search", { query: "x" }), event("phase", { phase: "preparing_report" })])).toBe("preparing_report");
    expect(tracePhase([])).toBeUndefined();
  });
});

describe("what the steps say", () => {
  const run = [
    event("phase", { phase: "collecting_sources", status: "running" }),
    event("search", { query: "tides", status: "running" }),
    event("search", { query: "tides", count: 2 }),
    event("source", { url: "https://a.example/", title: "A" }),
    event("source", { url: "https://b.example/", title: "B" }),
    event("phase", { phase: "comparing_evidence", status: "running" }),
    event("phase", { phase: "preparing_report", status: "running" }),
    event("writer", { provider: "groq" }),
    event("plan", { sections: ["One", "Two", "Three"] }),
    event("section", { index: 1, total: 3, heading: "One" }),
  ];
  it("tells the run in order, from recorded events only", () => {
    expect(traceLines(run, true, words).map((line) => line.text)).toEqual([
      "Searched: tides",
      "Found 2 sources",
      "Comparing the evidence",
      "Writing the report",
      "Writing with Groq",
      "Planned 3 sections",
      "Wrote section 1 of 3",
    ]);
  });
  it("only the last line is going on, and only while the run is live", () => {
    expect(traceLines(run, true, words).filter((line) => line.live).map((line) => line.text)).toEqual(["Wrote section 1 of 3"]);
    expect(traceLines(run, false, words).some((line) => line.live)).toBe(false);
  });
  it("a wait is never shown as work going on", () => {
    const lines = traceLines([...run, event("waiting", { reason: "gemini_service_unavailable", status: "queued" })], true, words);
    expect(lines.at(-1)).toMatchObject({ icon: "time", text: "waiting: gemini_service_unavailable" });
    expect(lines.at(-1)!.live).toBeUndefined();
  });
  it("says why the writing stopped", () => {
    const lines = traceLines([...run, event("writer_failed", { reason: "context_limit", status: "failed" }), event("phase", { phase: "failed", status: "failed" })], false, words);
    expect(lines.at(-1)).toMatchObject({ icon: "stopped", text: "The evidence was too large for the backup writer" });
  });
  it("counts pages that could not be opened", () => {
    const lines = traceLines([event("read", { url: "https://a.example/" }), event("read", { url: "https://b.example/", status: "failed" })], false, words);
    expect(lines[0]).toMatchObject({ text: "Read 1 page in full", detail: "1 couldn't be opened" });
  });
  it("keeps a long run readable", () => {
    const long = Array.from({ length: 40 }, (_, index) => event("section", { index, total: 40, heading: "S" }));
    const lines = traceLines(long, false, words);
    expect(lines).toHaveLength(14);
    expect(lines[0]!.text).toBe("27 earlier steps");
  });
  it("tells saved evidence apart from a fresh search", () => {
    const lines = traceLines([event("search", { query: "sky", reused: 3 }), event("source", { url: "https://a.example/", reused: true }), event("source", { url: "https://b.example/" })], false, words);
    expect(lines.map((line) => line.text)).toEqual(["Used saved research for: sky", "Reused 1 saved source", "Found 1 source"]);
  });
  it("a run retrying on one limit is one wait", () => {
    const lines = traceLines([event("waiting", { reason: "quota" }), event("phase", { phase: "other" }), event("waiting", { reason: "quota" }), event("waiting", { reason: "quota" })], true, words);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.detail).toMatch(/^3 tries/);
    expect(lines[0]!.live).toBeUndefined();
  });
  it("has nothing to say without events", () => {
    expect(traceLines([], true, words)).toEqual([]);
  });
});

describe("the live scene", () => {
  const live = [event("search", { query: "tides", status: "running", phase: "collecting_sources" }), event("source", { url: "https://a.example/page", title: "Saved title", excerpt: "Real words" })];
  it("draws sources as the backend reports them, before the report exists", () => {
    const scene = buildScene(pending, "", live, words);
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.steps?.filter((step) => step.kind.kind === "search").map((step) => step.status)).toEqual(["running"]);
    expect(run.steps?.filter((step) => step.kind.kind === "read").map((step) => (step.kind as { url: string }).url)).toEqual(["https://a.example/page"]);
    expect(scene.previews.get("https://a.example/page")?.excerpt).toBe("Real words");
    expect(scene.papers).toEqual([]);
  });
  it("draws no source that was not reported", () => {
    const run = [...buildScene(pending, "", [], words).objectives.values()][0]!.executions[0]!;
    expect(run.steps?.some((step) => step.kind.kind === "read")).toBe(false);
  });
  it("a failed page read shows as failed", () => {
    const scene = buildScene(pending, "", [...live, event("read", { url: "https://a.example/page", status: "failed" })], words);
    const read = [...scene.objectives.values()][0]!.executions[0]!.steps?.find((step) => step.kind.kind === "read");
    expect(read?.status).toBe("failed");
  });
  it("a trace never finishes a run the report has not finished", () => {
    const scene = buildScene(pending, "", [...live, event("phase", { phase: "complete" })], words);
    expect(scene.state).toBe("running");
    expect(scene.papers).toEqual([]);
  });
  it("a saved report keeps its source list, and tells where each is cited", () => {
    const report: ResearchReport = { ...pending, phase: "complete", completeness: "complete", report: "# T\n\n## Costs\nA claim [S1].\n\n## Risk\nMore [S1, S2].", sources: [{ id: "S1", title: "One", url: "https://one.example/" }, { id: "S2", title: "Two", url: "https://two.example/" }] };
    const info = buildScene(report, "", live, words).sourceInfo;
    expect(info.get("https://one.example/")?.citations).toEqual([{ section: "Costs", count: 1 }, { section: "Risk", count: 1 }]);
    expect(info.get("https://one.example/")?.evidence).toBe(true);
    expect(info.has("https://a.example/page")).toBe(false);
  });
  it("a source only seen in the trace offers no saved copy", () => {
    expect(buildScene(pending, "", live, words).sourceInfo.get("https://a.example/page")?.evidence).toBe(false);
  });
});

describe("excerpts", () => {
  it("drops a link cut off by the end of a saved excerpt", () => {
    expect(plainExcerpt("Skip to content [My services](https://www.example.com/es/mis-serv")).toBe("Skip to content My services");
  });
});

describe("citation sections", () => {
  it("counts each mention under its heading", () => {
    expect(citationSections("## A\nx [S1] y [S1; S2]\n## B\nz [S2]", "S1")).toEqual([{ section: "A", count: 2 }]);
  });
  it("does not confuse S1 with S12", () => {
    expect(citationSections("## A\nx [S12]", "S1")).toEqual([]);
  });
  it("says nothing for a source with no id", () => {
    expect(citationSections("## A\nx [S1]", undefined)).toEqual([]);
  });
});

describe("the browser's address guard", () => {
  it("accepts public web addresses and bare names", () => {
    expect(normalizeAddress("https://en.wikipedia.org/wiki/Tide")).toBe("https://en.wikipedia.org/wiki/Tide");
    expect(normalizeAddress("example.com")).toBe("https://example.com/");
  });
  it.each(["javascript:alert(1)", "data:text/html,<script>1</script>", "file:///c:/secret", "blob:https://x/y", "chrome://settings", "ftp://example.com/"])("refuses %s", (address) => {
    expect(normalizeAddress(address)).toBeNull();
  });
  it.each(["http://localhost:8340/api/research", "http://127.0.0.1:5173/", "http://10.1.2.3/", "http://192.168.1.1/", "http://172.16.0.9/", "http://169.254.169.254/", "http://[::1]/", "http://printer.local/", "http://intranet/"])("refuses the private address %s", (address) => {
    expect(normalizeAddress(address)).toBeNull();
  });
  it("never opens the app itself, which a framed page must not share an origin with", () => {
    expect(normalizeAddress("https://aegis.example/settings", "aegis.example")).toBeNull();
    expect(normalizeAddress("https://aegis.example:8443/", "aegis.example:8443")).toBeNull();
  });
  it("refuses addresses carrying a login", () => {
    expect(normalizeAddress("https://www.example.com:8080/")).toBeNull();
    expect(normalizeAddress("https://host.local./")).toBeNull();
    expect(normalizeAddress("https://user:pass@example.com/")).toBeNull();
  });
  it("refuses text that is not an address", () => {
    expect(normalizeAddress("two words")).toBeNull();
    expect(normalizeAddress("")).toBeNull();
  });
  it("explains a refusal in plain words", () => {
    expect(blockedWords("x_frame_options")).toMatch(/doesn't allow/);
    expect(blockedWords("non_public_address")).toMatch(/public websites/);
  });
});
