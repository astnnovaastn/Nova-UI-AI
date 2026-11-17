import { describe, expect, it } from "vitest";
import { parseObject } from "../src/objects/registry";
import { buildScene } from "../src/research-to-run";
import { mapWire, paragraphs, reportReply, wireOf } from "../src/zephium-wire";

const object = (value: Record<string, unknown>) => parseObject({ id: "o1", title: "T", revision: 1, sources: [], ...value })!;

describe("AEGIS objects as Zephium artifact data", () => {
  it("code keeps its language and text", () => {
    expect(wireOf(object({ kind: "code", language: "python", body: "print(1)" }))).toEqual({ kind: "code", language: "python", text: "print(1)", notes: [] });
  });

  it("a table becomes a sheet with typed columns and plain cells", () => {
    const wire = wireOf(object({ kind: "table", columns: ["**Name**", "Price"], columnKinds: ["entity", "money"], rows: [["`A`", "4"]] }));
    expect(wire).toMatchObject({ kind: "sheet", columns: [{ label: "Name", kind: "entity" }, { label: "Price", kind: "money" }], rows: [{ cells: ["A", "4"] }] });
  });

  it("a comparison with recommendations becomes picks", () => {
    const wire = wireOf(object({ kind: "comparison", recommendations: [{ id: "p", title: "Pick", recommended: true, facts: [{ label: "Price", value: "$4" }] }] }));
    expect(wire).toMatchObject({ kind: "picks", facet: "article", items: [{ name: "Pick", recommended: true, facts: [{ label: "Price", value: "$4", kind: "text" }] }] });
  });

  it("a diagram keeps nodes, layers and edges", () => {
    const wire = wireOf(object({ kind: "diagram", nodes: [{ id: "a", label: "API", group: "web" }, { id: "b", label: "DB", group: "data" }], edges: [{ id: "e", source: "a", target: "b", label: "writes" }] }));
    expect(wire).toMatchObject({ kind: "diagram", layers: [{ id: "web" }, { id: "data" }], nodes: [{ id: "a", name: "API", layer: "web" }, { id: "b", name: "DB" }], edges: [{ from: "a", to: "b", label: "writes" }] });
  });

  it("a checklist is a todo list and a decision a questions list", () => {
    expect(wireOf(object({ kind: "checklist", entries: [{ id: "1", label: "Do it", done: true }] }))).toEqual({ kind: "list", style: "todo", items: [{ title: "Do it", done: true }] });
    expect(wireOf(object({ kind: "decision", entries: [{ id: "1", label: "Which?" }] }))).toMatchObject({ kind: "list", style: "questions" });
  });

  it("a timeline is a plan of steps", () => {
    expect(wireOf(object({ kind: "timeline", entries: [{ id: "1", label: "Standup", when: "09:30", stepKind: "event" }] }))).toMatchObject({ kind: "plan", steps: [{ title: "Standup", kind: "event", when: "09:30" }] });
  });

  it("a diff keeps its hunks", () => {
    const wire = wireOf(object({ kind: "diff", body: "@@ -1,2 +1,2 @@\n a\n-b\n+c" }));
    expect(wire).toMatchObject({ kind: "diff", hunks: [{ old_start: 1, new_start: 1, lines: [{ op: "ctx", text: "a" }, { op: "del", text: "b" }, { op: "add", text: "c" }] }] });
  });

  it("an object with no Zephium shape is not drawn", () => {
    expect(wireOf(object({ kind: "source" }))).toBeNull();
    expect(wireOf(object({ kind: "image" }))).toBeNull();
  });

  it("a knowledge map is one diagram", () => {
    expect(mapWire({ title: "M", groups: [{ id: "g", title: "Group" }], nodes: [{ id: "n", title: "Node", kind: "x", group: "g", summary: "s", source_ids: [] }], edges: [] })).toMatchObject({ kind: "diagram", layers: [{ id: "g", name: "Group" }], nodes: [{ id: "n", name: "Node", layer: "g", note: "s" }] });
  });

  it("the report reads as paragraphs and a reply from its own opening", () => {
    expect(paragraphs("# Title\n\nText one.\n\n---\n\n![x](y)\n\n## Part\n\nMore.")).toEqual(["## Title", "Text one.", "## Part", "More."]);
    expect(reportReply("Title", "# Title\n\nThe answer is here [S1].\n\n## More")).toMatchObject({ kind: "reply", headline: "Title", text: "The answer is here ." });
  });
});

describe("the Zephium design's scene", () => {
  const report = { research_id: "r1", query: "Explain the code", report: "# Done\n\nThe summary.", phase: "completed", sources: [{ id: "S1", title: "Doc", url: "https://example.org/a" }] };
  const objects = [object({ id: "c1", kind: "code", language: "ts", body: "x()", sources: [{ id: "S1", title: "Doc", url: "https://example.org/a" }] }), object({ id: "r", kind: "report", body: "dup" })];

  it("places the reply, the report and each object as Zephium artifacts, one of each", () => {
    const scene = buildScene(report, "", [], () => "", null, { objects, map: null, skills: [] });
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.artifacts.map((artifact) => artifact.data.kind)).toEqual(["evidence_collection", "reply", "document", "code"]);
    const code = run.artifacts.find((artifact) => artifact.data.kind === "code")!;
    expect(code.evidence).toEqual([{ extraction_id: `${run.id}-search`, source_id: 1 }]);
    const referenced = scene.snapshot.elements.map((element) => (element.reference as { artifact?: string }).artifact);
    for (const artifact of run.artifacts.filter((entry) => entry.data.kind !== "evidence_collection")) expect(referenced).toContain(artifact.id);
  });

  it("the AEGIS design is unchanged: no results are added", () => {
    const scene = buildScene(report, "", [], () => "", null, null);
    const run = [...scene.objectives.values()][0]!.executions[0]!;
    expect(run.artifacts.map((artifact) => artifact.data.kind)).toEqual(["evidence_collection"]);
  });
});
