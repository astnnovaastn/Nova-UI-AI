import { describe, expect, it } from "vitest";
import { zephiumParts, type ZephiumRun } from "../src/research-to-run";

const run: ZephiumRun = {
  plan: { mode: "deep" },
  assignments: [
    { agent: "worker_a", role: "discovery", task: "Find the sources", state: "done" },
    { agent: "worker_b", role: "analysis", task: "Compare findings", state: "done" },
    { agent: "worker_c", role: "verification", task: "Check claims", state: "done" },
  ],
  usage: {
    parts: {
      lead: { title: "AEGIS", helper: "lead", began: 1, ended: 200, calls: 3, tokens: 9000, searches: 0, model: "gemini:lead" },
      worker_c: { title: "Fact check", helper: "research", began: 60, ended: 90, calls: 1, tokens: 900, searches: 0, model: "nvidia:ultra" },
      worker_a: { title: "Sources", helper: "research", began: 5, ended: 20, calls: 1, tokens: 500, searches: 4, model: "groq:small" },
      worker_b: { title: "Analysis", helper: "research", began: 30, ended: 50, calls: 1, tokens: 700, searches: 0, model: "groq:big" },
      worker_d: { title: "Second analysis", helper: "research", began: 31, ended: 48, calls: 1, tokens: 600, searches: 0, model: "nvidia:vl" },
      worker_e: { title: "Writer", helper: "research", began: 100, ended: 160, calls: 3, tokens: 12000, searches: 0, model: "gemini:flash" },
    },
  },
};

describe("Zephium design: a run's parts", () => {
  it("one part per helper model, oldest first, the lead left out as the run itself", () => {
    const parts = zephiumParts(run, false, 18);
    expect(parts.map((part) => part.title)).toEqual(["Sources", "Analysis", "Second analysis", "Fact check", "Writer"]);
    expect(parts.every((part) => part.state === "done" && part.helper === "research")).toBe(true);
  });

  it("carries when each part worked, so parallel parts share a column", () => {
    const parts = zephiumParts(run, false, 18);
    const analysis = parts.find((part) => part.title === "Analysis")!;
    const second = parts.find((part) => part.title === "Second analysis")!;
    expect(Number(analysis.started_ms)).toBeLessThan(Number(second.ended_ms));
    expect(Number(second.started_ms)).toBeLessThan(Number(analysis.ended_ms));
    expect(parts[0]!.summary).toBe("18 sources");
    expect(parts.at(-1)!.summary).toBe("3 calls · flash");
  });

  it("a live run shows assigned parts that have not started as planned", () => {
    const parts = zephiumParts({ assignments: [{ agent: "worker_b", role: "analysis", state: "assigned" }], usage: { parts: {} } }, true, 0);
    expect(parts[0]!.state).toBe("planned");
    expect(parts[0]!.started_ms).toBeUndefined();
  });
});
