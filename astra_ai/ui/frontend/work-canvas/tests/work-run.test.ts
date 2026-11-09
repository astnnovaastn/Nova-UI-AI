import { describe, expect, it } from "vitest";
import { CARD, layoutMap } from "../src/knowledge-map";
import { agentBranches, mapOf, type KnowledgeMap, type WorkRun } from "../src/work-run";
import { traceLines, type TraceEvent } from "../src/research-trace";
import { endedWords, wordsForWait } from "../src/waiting.svelte";
import { PERSONAS, WORKFLOWS } from "$features/work/lib/start/workflows";

const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

function sampleMap(count = 24): KnowledgeMap {
  const groups = [0, 1, 2, 3].map((n) => ({ id: `g${n}`, title: `Group ${n}` }));
  const nodes = Array.from({ length: count }, (_, n) => ({ id: `n${n}`, title: `Node ${n}`, kind: "service", group: `g${n % 4}`, summary: "s", source_ids: [] }));
  const edges = nodes.slice(1).map((node, n) => ({ from: `n${n}`, to: node.id, label: "uses" }));
  return { title: "Map", groups, nodes, edges };
}

describe("knowledge map layout", () => {
  it("never overlaps a card, keeps cards in their group box, and does not stack everything in one column", () => {
    const layout = layoutMap(sampleMap());
    expect(layout.nodes).toHaveLength(24);
    const boxes = layout.nodes.map((node) => ({ ...node, ...CARD }));
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) expect(overlap(boxes[a]!, boxes[b]!)).toBe(false);
    for (let a = 0; a < layout.groups.length; a++) for (let b = a + 1; b < layout.groups.length; b++) expect(overlap(layout.groups[a]!, layout.groups[b]!)).toBe(false);
    for (const node of layout.nodes) {
      const group = layout.groups.find((row) => row.id === node.group)!;
      expect(node.x).toBeGreaterThanOrEqual(group.x);
      expect(node.x + CARD.width).toBeLessThanOrEqual(group.x + group.width);
      expect(node.y).toBeGreaterThanOrEqual(group.y);
      expect(node.y + CARD.height).toBeLessThanOrEqual(group.y + group.height);
    }
    expect(new Set(layout.nodes.map((node) => node.x)).size).toBeGreaterThan(1);
  });

  it("survives a cycle and a node with no group, and lands the same way each time", () => {
    const map: KnowledgeMap = {
      title: "",
      groups: [{ id: "a", title: "A" }],
      nodes: [
        { id: "1", title: "1", kind: "data", group: "a", summary: "", source_ids: [] },
        { id: "2", title: "2", kind: "data", group: "a", summary: "", source_ids: [] },
        { id: "3", title: "3", kind: "data", group: "", summary: "", source_ids: [] },
      ],
      edges: [
        { from: "1", to: "2", label: "" },
        { from: "2", to: "1", label: "" },
      ],
    };
    const layout = layoutMap(map);
    expect(layout.nodes).toHaveLength(3);
    expect(layout).toEqual(layoutMap(map));
  });

  it("flows from a group to the groups it feeds", () => {
    const layout = layoutMap({
      title: "",
      groups: [{ id: "in", title: "In" }, { id: "out", title: "Out" }],
      nodes: [
        { id: "b", title: "b", kind: "data", group: "out", summary: "", source_ids: [] },
        { id: "a", title: "a", kind: "data", group: "in", summary: "", source_ids: [] },
      ],
      edges: [{ from: "a", to: "b", label: "" }],
    });
    expect(layout.groups.find((row) => row.id === "in")!.x).toBeLessThan(layout.groups.find((row) => row.id === "out")!.x);
  });
});

const run = (extra: Partial<WorkRun> = {}): WorkRun => ({
  run_id: "r", research_id: "r", state: "running", stage: "", failure: "", request: { query: "q" }, plan: { reasoning_summary: "Why." },
  assignments: [
    { agent: "worker_a", role: "discovery", task: "Find", provider: "groq", model: "m-a", state: "done" },
    { agent: "worker_c", role: "verification", task: "Check", provider: "groq", model: "m-c", state: "assigned" },
  ],
  results: {}, evidence: [], artifacts: [], usage: {}, ...extra,
});
const event = (seq: number, row: Record<string, unknown>): TraceEvent => ({ seq, at: 1000 + seq, kind: "stage", status: "done", ...row });

describe("agent branches", () => {
  it("shows only what the record holds, and nothing for older research", () => {
    expect(agentBranches(null, [])).toEqual([]);
    const rows = agentBranches(run(), [event(1, { stage: "planned", label: "Plan created" })]);
    expect(rows.map((row) => row.role)).toEqual(["discovery", "verification", "lead"]);
    expect(rows[1]).toMatchObject({ state: "assigned", tokens: 0, summary: "" });
  });

  it("files searches under discovery, and reports a failure with its reason", () => {
    const rows = agentBranches(
      run({ results: { discovery: { agent: "worker_a", role: "discovery", state: "failed", summary: "", provider: "groq", model: "m-a", tokens: 12, seconds: 2, failure: "no_supported_results" } } }),
      [event(1, { kind: "search", query: "tides", status: "failed", reason: "provider_quota" }), event(2, { kind: "search", query: "moon", count: 5 })],
    );
    expect(rows[0]).toMatchObject({ state: "failed", failure: "no_supported_results", tokens: 12 });
    expect(rows[0]!.activity.map((row) => row.state)).toEqual(["failed", "done"]);
    expect(rows[0]!.activity[1]!.detail).toBe("5 results");
  });

  it("does not show an agent working on a run that ended or is waiting for the person", () => {
    const planned = [event(1, { stage: "planned", label: "Plan created" })];
    expect(agentBranches(run({ state: "cancelled" }), planned).map((row) => row.state)).toEqual(["done", "stopped", "stopped"]);
    expect(agentBranches(run({ state: "needs_input" }), planned).at(-1)!.state).toBe("waiting");
    expect(agentBranches(run({ state: "running" }), planned).at(-1)!.state).toBe("running");
  });

  it("names a model that stepped in for another", () => {
    const rows = agentBranches(run(), [event(1, { kind: "agent", agent: "worker_a", state: "done", model: "lead-model", fell_back: "worker_a" })]);
    expect(rows[0]).toMatchObject({ fellBackFrom: "worker_a" });
  });

  it("reads a map only from a saved artifact", () => {
    expect(mapOf(run())).toBeNull();
    const map = sampleMap(2);
    expect(mapOf(run({ artifacts: [{ id: "x", kind: "knowledge_map", title: "M", data: map as never }] }))).toEqual(map);
  });
});

describe("run steps", () => {
  it("updates a stage in place, and only the last line is live", () => {
    const lines = traceLines(
      [event(1, { stage: "intent", label: "Understanding", status: "running" }), event(2, { stage: "classified", label: "Chose Quick Research" }), event(3, { stage: "intent", label: "Understood" })],
      true,
      () => "",
    );
    expect(lines.map((line) => line.text)).toEqual(["Understood", "Chose Quick Research"]);
    expect(lines.filter((line) => line.live)).toHaveLength(1);
    expect(lines.at(-1)!.live).toBe(true);
  });

  it("never reports a finished stage that has no event", () => {
    const lines = traceLines([event(1, { stage: "received", label: "Request received" })], false, () => "");
    expect(lines).toHaveLength(1);
  });

  it("words a work failure honestly", () => {
    expect(endedWords("work_model_http_503", "failed")).toBe("The AI services couldn't finish this");
    expect(endedWords("work_budget_exhausted", "failed")).toBe("The run reached its budget");
    expect(wordsForWait("work_needs_input")).toBe("AEGIS has a question");
  });
});

describe("the eight categories", () => {
  it("has every category, with Research next to Founder and its three cards", () => {
    expect(PERSONAS.map((row) => row.id)).toEqual(["developer", "designer", "marketing", "manager", "student", "office", "founder", "research"]);
    expect(WORKFLOWS.filter((row) => row.persona === "research").map((row) => row.title())).toEqual(["Quick Research", "Deep Research", "Structured Research & Knowledge Map"]);
    const counts = Object.fromEntries(PERSONAS.map((row) => [row.id, WORKFLOWS.filter((flow) => flow.persona === row.id).length]));
    expect(counts).toEqual({ developer: 4, designer: 2, marketing: 2, manager: 2, student: 2, office: 2, founder: 3, research: 3 });
    expect(new Set(WORKFLOWS.filter((row) => row.persona === "research").map((row) => row.shape)).size).toBe(3);
  });
});
