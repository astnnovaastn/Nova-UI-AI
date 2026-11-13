import { describe, expect, it } from "vitest";
import { planCard, planCardSize } from "../src/plan-card";
import { collectResults, evidencePipeline, stageCardSize } from "../src/stage-cards";
import { semanticLayout } from "../src/semantic-layout";

const stage = (seq: number, name: string, extra: Record<string, unknown> = {}, status = "done") => ({ seq, at: seq, kind: "stage", stage: name, status, ...extra });
const run = (state: string) => ({
  state,
  plan: { intent: "Explain grid batteries", mode: "deep", reasoning_summary: "Several angles, then a cross-check.", skill: { name: "deep-research", title: "Deep research", version: "62dc4ac04186" } },
  assignments: [
    { role: "discovery", model: "openai/gpt-oss-20b", state: "done" },
    { role: "analysis", model: "openai/gpt-oss-120b", state: "running" },
  ],
});
const trail = [
  { key: "a", icon: "search" as const, text: "Searched: grid battery cost", detail: "8 results" },
  { key: "b", icon: "page" as const, text: "Found 16 sources" },
];

describe("AI PLAN: one planning and activity card", () => {
  it("holds the plan and the existing activity timeline together", () => {
    const data = planCard("r1", run("running"), trail, true)!;
    expect(data.heading).toBe("AI PLAN");
    expect(data.objective).toBe("Explain grid batteries");
    expect(data.agents.map((agent) => [agent.role, agent.model])).toEqual([["Discovery", "gpt-oss-20b"], ["Analysis", "gpt-oss-120b"]]);
    expect(data.trail).toEqual(trail);
    expect(data.skill).toEqual({ title: "Deep research", version: "62dc4ac04186" });
  });

  it("research made without a plan shows its activity, and invents no plan or agents", () => {
    const data = planCard("r1", null, trail, false, "how heat pumps work")!;
    expect(data.heading).toBe("Research activity");
    expect(data.objective).toBe("how heat pumps work");
    expect(data.agents).toEqual([]);
    expect(data.strategy).toBe("");
    expect(planCard("r1", null, [], false)).toBeNull();
  });

  it("grows with its activity", () => {
    const short = planCardSize(planCard("r1", run("running"), trail, true)!);
    const long = planCardSize(planCard("r1", run("running"), [...trail, ...trail.map((line, i) => ({ ...line, key: "x" + i }))], true)!);
    expect(long.height).toBeGreaterThan(short.height);
  });
});

describe("Evidence pipeline and results, from recorded stages only", () => {
  const trace = [
    stage(1, "discovered", { count: 16, duplicates: 3 }),
    stage(2, "assessed", { kept: 7, rejected: 9 }),
    stage(3, "evidence", { count: 6, domains: 5 }),
    stage(4, "analysis", { count: 14 }),
    stage(5, "verified", { supported: 9, contested: 1 }),
    stage(6, "writing", {}, "running"),
    stage(7, "citations", { cited: 5, sources: 6, removed: 1 }),
    stage(8, "quality", { sections_written: 8, sections_planned: 8, words: 3200 }),
  ];

  it("lists the pipeline's stages left to right with the run's own numbers", () => {
    const data = evidencePipeline(trace, { state: "completed" })!;
    expect(data.modules.map((module) => module.key)).toEqual(["processing", "dedup", "ranking", "citations", "library"]);
    expect(data.modules[1]!.facts[0]).toBe("3 duplicates removed");
    expect(data.modules[3]!.facts).toEqual(["5 of 6 sources cited", "1 unsupported citation removed"]);
  });

  it("a run that did less shows fewer modules, and one that did nothing shows no pipeline", () => {
    expect(evidencePipeline([stage(1, "evidence", { count: 2, domains: 2 })], { state: "running" })!.modules.map((m) => m.key)).toEqual(["processing"]);
    expect(evidencePipeline([], { state: "running" })).toBeNull();
    expect(collectResults([], { state: "running" }, { images: 0, videos: 0 })).toBeNull();
  });

  it("collects what was gathered and compiles it", () => {
    const data = collectResults(trace, { state: "completed" }, { images: 6, videos: 5 })!;
    expect(data.modules[0]!.facts).toEqual(["14 findings", "9 claims supported, 1 contested", "6 images", "5 videos"]);
    expect(data.modules[1]!.facts).toEqual(["8 of 8 sections written", "3,200 words", "Published to the Reader"]);
  });
});

describe("Two tracks that converge", () => {
  it("spaces the prompt, plan and Sources while keeping the pipeline under the main track", () => {
    const pipeline = stageCardSize(evidencePipeline([stage(1, "evidence", { count: 2, domains: 2 }), stage(2, "assessed", { kept: 2, rejected: 1 })], { state: "completed" })!);
    const at = semanticLayout({
      request: { id: "request", x: 0, y: 0, width: 320, height: 120 },
      under: [],
      plan: { id: "plan", width: 340, height: 400, below: [{ id: "sources", width: 300, height: 160 }] },
      sources: [{ id: "s1", width: 240, height: 200 }, { id: "s2", width: 240, height: 200 }],
      workers: [{ id: "analysis", width: 300, height: 176, rank: 2 }],
      lead: { id: "lead", width: 300, height: 176 },
      pipeline: { id: "pipeline", ...pipeline },
      compile: { id: "compile", width: 280, height: 220 },
      papers: [{ id: "paper", width: 760, height: 960 }],
      gaps: { column: 150, row: 56, paper: 170, map: 110 },
    }).positions;
    expect(at.plan!.x - 320).toBe(240);
    expect(at.plan!.y).toBe(0);
    expect(at.sources!.x).toBe(at.plan!.x);
    expect(at.s1!.x - (at.plan!.x + 340)).toBe(150);
    expect(at.sources!.y - (at.plan!.y + 400)).toBe(260);
    // The pipeline can move down to clear the main track without moving Sources.
    expect(at.pipeline!.x).toBe(at.s1!.x);
    expect(at.pipeline!.y).toBeGreaterThan(at.s2!.y + 200);
    expect(at.pipeline!.y).toBeGreaterThan(at.analysis!.y + 176);
    expect(at.pipeline!.y).toBeGreaterThanOrEqual(at.sources!.y);
    // Convergence: results just before the report, at the far right.
    expect(at.compile!.x).toBeGreaterThan(at.lead!.x + 300);
    expect(at.paper!.x).toBeGreaterThan(at.compile!.x + 280);
  });
});
