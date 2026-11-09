import { describe, expect, it } from "vitest";
import { endedWords } from "../src/waiting.svelte";
import { activityFor, buildScene, plainExcerpt, reportTitle, researchSteps, runState, type ResearchReport } from "../src/research-to-run";
import { followupSections, imagesFor, paperSites, splitCitations } from "../src/paper";

const source = (n: number) => ({ id: `S${n}`, title: `Source ${n}`, url: `https://site${n}.example/page`, content: `Evidence ${n}. `.repeat(40), favicon: "https://site.example/i.png" });
const finished: ResearchReport = {
  research_id: "a".repeat(32),
  query: "How do tides form?",
  display_title: "Tides",
  phase: "complete",
  completeness: "complete",
  report: "Tides come from gravity [S1, S2].\n\n## Table\n\n| Body | Pull |\n|---|---|\n| Moon | Strong |\n| Sun | Weaker |\n",
  sources: [source(1), source(2), source(3)],
  image_items: [{ id: "I1", caption: "Moon", source_id: "S2", publication: "site2.example" }],
};

describe("run state comes only from the backend's phase", () => {
  it.each([
    ["queued", "running"],
    ["collecting_sources", "running"],
    ["comparing_evidence", "running"],
    ["preparing_report", "running"],
    ["waiting_for_quota", "waiting"],
    ["failed", "failed"],
    ["cancelled", "cancelled"],
    ["complete", "completed"],
  ])("%s means %s", (phase, expected) => {
    expect(runState({ ...finished, phase, completeness: phase === "complete" ? "complete" : "pending" })).toBe(expected);
  });
  it("a run the person stopped is cancelled, not failed", () => {
    expect(runState({ ...finished, phase: "failed", completeness: "failed", waiting_reason: "research_canceled" })).toBe("cancelled");
    expect(runState({ ...finished, phase: "failed", completeness: "failed", waiting_reason: "provider_quota" })).toBe("failed");
  });
  it("maps phases to the pill's activity, and gives none when nothing is happening", () => {
    expect(activityFor("collecting_sources")).toBe("searching");
    expect(activityFor("comparing_evidence")).toBe("comparing");
    expect(activityFor("preparing_report")).toBe("producing_artifact");
    expect(activityFor("waiting_for_quota")).toBe("paused");
    expect(activityFor("complete")).toBeUndefined();
  });
});

describe("the scene holds only real data", () => {
  it("a finished report is a paper of its own words, with its sources, and no live signal", () => {
    const scene = buildScene(finished);
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.status).toBe("completed");
    expect(run.artifacts.map((artifact) => artifact.data.kind)).toEqual(["evidence_collection"]);
    expect(scene.papers).toHaveLength(1);
    expect(scene.papers[0]!.markdown).toBe(finished.report);
    expect(scene.papers[0]!.run).toBe(run.id);
    expect(scene.papers[0]!.label).toBe("Research report");
    expect(scene.signals).toEqual([]);
    expect(scene.steps).toEqual([]);
  });
  it("only finished writing becomes a paper", () => {
    expect(buildScene({ ...finished, phase: "preparing_report", completeness: "pending" }).papers).toEqual([]);
    expect(buildScene({ ...finished, phase: "failed", completeness: "failed" }).papers).toEqual([]);
    expect(buildScene({ ...finished, report: "   " }).papers).toEqual([]);
  });
  it("a partial report says so, with the recorded reason", () => {
    const [paper] = buildScene({ ...finished, completeness: "partial", failures: [{ reason: "provider_quota" }] }).papers;
    expect(paper!.label).toBe("Partial report");
    expect(paper!.note).toContain("provider quota");
  });
  it("older saved evidence is labelled as evidence, not as a report", () => {
    expect(buildScene({ ...finished, legacy_evidence: true }).papers[0]!.label).toBe("Saved evidence");
  });
  it("follow-up blocks become one run and one paper per section", () => {
    const scene = buildScene({
      ...finished,
      extensions: {
        blocks: [
          { id: "b1", text: "First.", section_id: "a", section_title: "Costs" },
          { id: "b2", text: "Second.", section_id: "a", section_title: "Costs" },
          { id: "b3", text: "Third.", section_id: "b", section_title: "Noise" },
          { id: "b4", text: "   ", section_id: "c", section_title: "Empty" },
        ],
      },
    });
    expect(scene.papers.map((paper) => paper.title)).toEqual([expect.any(String), "Costs", "Noise"]);
    expect(scene.papers[1]!.markdown).toBe("First.\n\nSecond.");
    expect([...scene.objectives.values()][0]!.executions).toHaveLength(3);
  });
  it("a run in progress invents no sources or results", () => {
    const scene = buildScene({ ...finished, phase: "collecting_sources", completeness: "pending", report: "", sources: [], image_items: [] });
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.status).toBe("running");
    expect(run.artifacts).toEqual([]);
    expect(run.steps?.some((step) => step.kind.kind === "read")).toBe(false);
    expect(scene.signals[0]?.activity).toBe("searching");
  });
  it("a failed run says so", () => {
    const scene = buildScene({ ...finished, phase: "failed", completeness: "failed", report: "", sources: [], failures: [{ reason: "provider_quota" }] });
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.status).toBe("failed");
    expect(run.steps?.[0]?.status).toBe("failed");
  });
  it("every source gets a card preview with its real title and excerpt", () => {
    const { previews } = buildScene(finished);
    expect(previews.get(source(3).url)?.title).toBe("Source 3");
    expect(previews.get(source(3).url)?.excerpt).toContain("Evidence 3");
  });
  it("an image goes to the source it came from, once", () => {
    const { frameIds } = buildScene(finished);
    expect([...frameIds.values()]).toEqual(["I1"]);
  });
});

describe("why a run ended", () => {
  it("names the real cause, and never blames search when writing failed", () => {
    expect(endedWords("synthesis_unavailable", "failed")).toBe("The report couldn't be written");
    expect(endedWords("research_canceled", "cancelled")).toBe("Research stopped");
    expect(endedWords("something_new", "failed")).toBe("Research didn't finish");
  });
});

describe("report title", () => {
  it("prefers the full heading over a cut-off saved title", () => {
    expect(reportTitle({ ...finished, display_title: "OpenAI in 2026: Company Overview, AI Model Compars", report: "# OpenAI in 2026: Company Overview, AI Model Comparison\n\nText" })).toBe("OpenAI in 2026: Company Overview, AI Model Comparison");
  });
  it("keeps the saved title when the heading is about something else", () => {
    expect(reportTitle({ ...finished, display_title: "Tides", report: "# Unrelated heading\n\nText" })).toBe("Tides");
  });
});

describe("research steps", () => {
  const steps = (phase: string, sources = 0, reason = "") => {
    const report = { ...finished, phase, completeness: "pending" };
    return researchSteps(report, runState(report), sources, reason);
  };
  it("names the phase going on, and only the phases before it", () => {
    expect(steps("comparing_evidence", 7).map((line) => [line.text, !!line.live])).toEqual([
      ["Searching the web", false],
      ["Found 7 sources", false],
      ["Comparing the evidence", true],
    ]);
  });
  it("counts no sources while the search is still going", () => {
    expect(steps("collecting_sources", 0).map((line) => line.text)).toEqual(["Searching the web"]);
  });
  it("a wait claims no finished phases, only the recorded reason", () => {
    expect(steps("waiting_for_retry", 0, "Waiting for the AI service").map((line) => line.text)).toEqual(["Waiting for the AI service"]);
    expect(steps("waiting_for_retry", 3, "Waiting for quota").map((line) => line.text)).toEqual(["Found 3 sources", "Waiting for quota"]);
  });
  it("a finished or stopped run has no steps to report", () => {
    expect(researchSteps(finished, "completed", 9, "")).toEqual([]);
    expect(researchSteps(finished, "cancelled", 9, "")).toEqual([]);
  });
  it("a failed run says why", () => {
    const report = { ...finished, phase: "failed", completeness: "failed" };
    expect(researchSteps(report, "failed", 0, "The report couldn't be written").map((line) => line.text)).toEqual(["The report couldn't be written"]);
  });
});

describe("the paper", () => {
  const sources = [
    { id: "S1", title: "One", url: "https://www.one.example/a" },
    { id: "S2", title: "Two", url: "https://two.example/b" },
    { id: "S3", title: "File", url: "attachment://x" },
  ];
  it("turns citation markers into their sources and keeps the words", () => {
    expect(splitCitations("Gravity [S1, S2] pulls.", sources)).toEqual(["Gravity ", [sources[0], sources[1]], " pulls."]);
  });
  it("leaves a marker that names no real source as written", () => {
    expect(splitCitations("See [S9] and [S3].", sources)).toEqual(["See [S9] and [S3]."]);
  });
  it("places an image where its anchor text falls, once", () => {
    const placed = new Set<string>();
    const images = [{ id: "I1", placement_text: "The core distinction lies in the reservoir" }];
    expect(imagesFor("Other words.", images, placed)).toEqual([]);
    expect(imagesFor("The core distinction lies in the reservoir [S1] of heat.", images, placed)).toEqual(images);
    expect(imagesFor("The core distinction lies in the reservoir.", images, placed)).toEqual([]);
  });
  it("places an image without anchor text where its source is cited", () => {
    expect(imagesFor("As shown [S2].", [{ id: "I2", source_id: "S2" }], new Set()).map((image) => image.id)).toEqual(["I2"]);
  });
  it("lists each website once, and only real web addresses", () => {
    expect(paperSites([...sources, { title: "Again", url: "https://one.example/c" }]).map((site) => site.host)).toEqual(["one.example", "two.example"]);
  });
  it("groups follow-up blocks by section and skips empty ones", () => {
    expect(followupSections([{ id: "x", text: "Only.", section_title: "" }, { id: "y", text: " " }])).toEqual([{ id: "x", title: "Follow-up research", text: "Only." }]);
  });
});

describe("text helpers", () => {
  it("makes clean excerpts", () => {
    expect(plainExcerpt("# Title\n\n![pic](a.png) Some [linked](http://x) **text**.")).toBe("Title Some linked text.");
    expect(plainExcerpt("word ".repeat(100), 20).endsWith("…")).toBe(true);
  });
});
