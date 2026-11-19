import { describe, expect, it } from "vitest";
import { originalAddress, pageKey, samePage, youtubeWatch } from "../src/work-handoff";

describe("V33 Open in browser address", () => {
  it("opens a video in any YouTube form as its watch page, at the second it was playing", () => {
    expect(originalAddress({ live: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1" }, 83.6)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=83s");
    expect(originalAddress({ asked: "https://youtu.be/dQw4w9WgXcQ?t=42" })).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s");
    expect(youtubeWatch("https://m.youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
  it("unwraps a consent page to where it was going and keeps a page reference", () => {
    const consent = "https://consent.youtube.com/m?continue=" + encodeURIComponent("https://www.youtube.com/watch?v=dQw4w9WgXcQ") + "&gl=GB";
    expect(originalAddress({ live: consent })).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(originalAddress({ live: "https://example.org/report.pdf#page=3" })).toBe("https://example.org/report.pdf#page=3");
    expect(originalAddress({ live: "https://en.wikipedia.org/wiki/Tide#Physics" })).toBe("https://en.wikipedia.org/wiki/Tide#Physics");
  });
  it("prefers where the window is now, then the source it was opened for, then the saved record", () => {
    expect(originalAddress({ live: "", asked: "https://a.example/x", recorded: "https://b.example/y" })).toBe("https://a.example/x");
    expect(originalAddress({ live: "javascript:alert(1)", asked: "", recorded: "https://b.example/y" })).toBe("https://b.example/y");
    expect(originalAddress({})).toBeNull();
  });
});

describe("V33 page identity", () => {
  it("is one page across tracking, fragments, www and trailing slashes", () => {
    expect(pageKey("https://www.Example.com/a/?utm_source=x&b=2#top")).toBe(pageKey("https://example.com/a?b=2"));
    expect(samePage("https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe(true);
    expect(samePage("https://example.com/a?page=2", "https://example.com/a?page=3")).toBe(false);
  });
});

import { buildScene, type ResearchReport } from "../src/research-to-run";

describe("V33 Add to Work on the canvas", () => {
  const report: ResearchReport = {
    research_id: "r-v33-add", query: "How tides work", report: "# Tides\n\nThe moon pulls the sea [S1].", phase: "complete", completeness: "complete",
    sources: [{ id: "S1", title: "Tide", url: "https://en.wikipedia.org/wiki/Tide", content: "Tides are the rise and fall." }],
    linked_sources: [
      { id: "W1", title: "NOAA tides", url: "https://oceanservice.noaa.gov/education/tutorial_tides/", reference_kind: "work_source", provenance: "browser_tab", description: "What causes tides." },
      { id: "W2", title: "Tide again", url: "https://en.wikipedia.org/wiki/Tide/", reference_kind: "work_source" },
    ],
  };
  it("an added page stands with the run's pages, marked as the person's, once", () => {
    const scene = buildScene(report);
    const run = [...scene.objectives.values()][0]!.executions[0]! as unknown as { steps: { id: string; kind: { kind: string; url?: string }; note?: string }[] };
    const reads = run.steps.filter((step) => step.kind.kind === "read");
    expect(reads.map((step) => step.kind.url)).toEqual(["https://en.wikipedia.org/wiki/Tide", "https://oceanservice.noaa.gov/education/tutorial_tides/"]);
    expect(reads[1]!.note).toBe("Added from your browser");
    expect(scene.previews.get("https://oceanservice.noaa.gov/education/tutorial_tides/")?.excerpt).toBe("What causes tides.");
  });
});
