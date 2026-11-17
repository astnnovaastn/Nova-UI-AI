/**
 * AEGIS results → Zephium artifact wire data (WorkArtifactV1.data), the same records the Agent
 * Execution Lab publishes (lab/src/agent/workflows/*). With these, Zephium's own pipeline
 * (environmentStages → placeRun → boardLayout) places and sizes a run's results, exactly as in
 * the labs, instead of AEGIS's own column beside the run.
 *
 * Every field comes from the validated object (`objects/registry.ts` parseObject) or the saved
 * report. Nothing is invented: a field the object does not carry is left out, and an object with
 * no Zephium shape (a bare source) returns null and is not drawn as a result.
 */
import type { WorkspaceObject } from "./objects/registry";
import type { KnowledgeMap } from "./work-run";

export type Wire = { kind: string } & Record<string, unknown>;

const SHEET_KINDS = new Set(["text", "number", "money", "percent", "date", "duration", "yes_no", "rating", "link", "entity", "tag"]);

/** A unified diff as Zephium's hunks; file headers are metadata, not changed lines. */
function hunks(body: string) {
  const out: { old_start: number; new_start: number; lines: { op: "add" | "del" | "ctx"; text: string }[] }[] = [];
  let current: (typeof out)[number] | undefined;
  const unified = /^@@ -\d+/m.test(body);
  for (const line of body.split("\n")) {
    const header = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (header) {
      current = { old_start: Number(header[1]), new_start: Number(header[2]), lines: [] };
      out.push(current);
      continue;
    }
    if (line.startsWith("diff --git ") || line.startsWith("\\ No newline")) continue;
    if (!current && (line.startsWith("--- ") || line.startsWith("+++ "))) continue;
    if (!current) {
      if (unified) continue;
      current = { old_start: 1, new_start: 1, lines: [] };
      out.push(current);
    }
    if (unified && !/^[ +\-]/.test(line)) continue;
    current.lines.push({ op: line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : "ctx", text: /^[ +\-]/.test(line) ? line.slice(1) : line });
  }
  return out;
}

/** Markdown → the document's paragraphs, headings kept as `## ` lines the way the lab writes them. */
export function paragraphs(markdown: string, limit = 400): string[] {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !/^!\[[^\]]*\]\([^)]*\)$/.test(block) && !/^([-*_])\1{2,}$/.test(block))
    .map((block) => (/^#{1,6}\s/.test(block) ? `## ${block.replace(/^#{1,6}\s+/, "")}` : block))
    .slice(0, limit);
}

/** A table cell as text: a sheet draws its cells plainly, so Markdown emphasis and code marks go. */
const plain = (cell: string) => cell.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/`([^`]+)`/g, "$1").trim();

const STEP_KINDS =new Set(["travel", "stay", "event", "task", "milestone", "note"]);

function whenOf(entry: NonNullable<WorkspaceObject["entries"]>[number]) {
  if (entry.when) return entry.when;
  if (entry.date) return entry.date;
  if (entry.start !== undefined && Math.abs(entry.start) < 1e11) return new Date(entry.start * 60000).toLocaleString();
  return "";
}

/** The Zephium record for one AEGIS object, or null when Zephium has no shape for it. */
export function wireOf(o: WorkspaceObject): Wire | null {
  if (o.kind === "comparison" && o.recommendations?.length)
    return {
      kind: "picks",
      facet: o.recommendationKind ?? "article",
      items: o.recommendations.map((pick) => ({
        name: pick.title,
        ...(pick.subtitle ? { subtitle: pick.subtitle } : {}),
        ...(pick.url ? { url: pick.url } : {}),
        facts: pick.facts.map((fact) => ({ label: fact.label, value: fact.value, kind: "text" })),
        ...(pick.why ? { why: pick.why } : {}),
        recommended: pick.recommended,
        tags: [],
      })),
    };
  switch (o.kind) {
    case "answer":
      return {
        kind: "reply",
        headline: o.title,
        text: o.body || o.caption || "",
        figures: (o.entries ?? []).filter((entry) => entry.value !== undefined).map((entry) => ({ label: entry.label, value: `${entry.value}${entry.unit ? ` ${entry.unit}` : ""}` })),
        points: [],
      };
    case "document":
    case "report":
    case "note":
      return { kind: "document", paragraphs: paragraphs(o.body || o.caption || "") };
    case "code":
    case "test":
      return { kind: "code", language: o.language || "text", text: o.body || "", notes: [] };
    case "diff":
      return { kind: "diff", path: o.title, language: o.language || "text", summary: o.caption || "", hunks: hunks(o.body || "") };
    case "table":
    case "comparison":
      return {
        kind: "sheet",
        columns: (o.columns ?? []).map((label, index) => {
          const kind = o.columnKinds?.[index] ?? (o.kind === "comparison" && index === 0 ? "entity" : "text");
          return { label: plain(label), kind: SHEET_KINDS.has(kind) ? kind : "text" };
        }),
        rows: (o.rows ?? []).map((cells) => ({ cells: cells.map(plain) })),
        ...(o.caption ? { note: o.caption } : {}),
      };
    case "chart": {
      const series = o.series?.length
        ? o.series.map((row) => ({ name: row.name, points: row.points.map((point) => ({ x: point.x, y: point.y === null ? null : String(point.y) })) }))
        : [{ name: o.title, points: (o.entries ?? []).map((entry) => ({ x: entry.label, y: entry.value === undefined ? null : String(entry.value) })) }];
      const unit = o.series?.[0]?.unit || o.entries?.find((entry) => entry.unit)?.unit || "";
      const style = o.chartKind === "line" ? "line" : o.chartKind === "area" ? "area" : o.orientation === "vertical" ? "bar" : "bar_horizontal";
      return { kind: "plot", style, x: { kind: "category" }, y: { format: "number", ...(unit ? { unit } : {}) }, series, basis: o.caption || "From the run's sources" };
    }
    case "diagram":
    case "knowledge-graph": {
      const groups = [...new Set((o.nodes ?? []).map((node) => node.group).filter((group): group is string => !!group))];
      return {
        kind: "diagram",
        layers: groups.map((id) => ({ id, name: id })),
        nodes: (o.nodes ?? []).map((node) => ({
          id: node.id,
          name: node.label,
          kind: node.nodeKind || "component",
          ...(node.group ? { layer: node.group } : {}),
          ...(node.vendor ? { vendor: node.vendor } : {}),
          ...(node.detail ? { note: node.detail } : {}),
        })),
        edges: (o.edges ?? []).map((edge) => ({ from: edge.source, to: edge.target, ...(edge.label ? { label: edge.label } : {}) })),
      };
    }
    case "checklist":
    case "decision":
    case "task":
      return {
        kind: "list",
        style: o.kind === "decision" ? "questions" : "todo",
        items: (o.entries ?? []).map((entry) => ({ title: entry.label, ...(entry.detail ? { detail: entry.detail } : {}), ...(entry.done ? { done: true } : {}) })),
      };
    case "timeline":
    case "calendar":
      return {
        kind: "plan",
        checkable: false,
        ...(o.kind === "calendar" && o.planMode !== "schedule" ? { calendar: true } : {}),
        ...(o.planTotal ? { total: o.planTotal } : {}),
        steps: (o.entries ?? []).map((entry) => ({
          title: entry.label,
          kind: entry.stepKind && STEP_KINDS.has(entry.stepKind) ? entry.stepKind : "milestone",
          ...(whenOf(entry) ? { when: whenOf(entry) } : {}),
          ...(entry.date ? { date: entry.date } : {}),
          ...(entry.detail ? { detail: entry.detail } : {}),
          ...(entry.cost ? { cost: entry.cost } : {}),
          ...(entry.place ? { place: entry.place } : {}),
        })),
      };
    case "image":
    case "video":
    case "audio":
      return o.url ? { kind: "media", medium: o.kind, url: o.url } : null;
    case "draft":
      return { kind: "draft", destination: "message", body: o.body || "" };
    default:
      return null;
  }
}

/** A run's knowledge map as one Zephium diagram: a layer per group, a node per subject. */
export function mapWire(map: KnowledgeMap): Wire | null {
  if (!map.nodes.length) return null;
  const titles = new Map(map.groups.map((group) => [group.id, group.title]));
  return {
    kind: "diagram",
    layers: map.groups.map((group) => ({ id: group.id, name: group.title })),
    nodes: map.nodes.map((node) => ({
      id: node.id,
      name: node.title,
      kind: "component",
      ...(titles.has(node.group) ? { layer: node.group } : {}),
      ...(node.summary ? { note: node.summary } : {}),
    })),
    edges: map.edges.map((edge) => ({ from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}) })),
  };
}

/** The finished report's reply: its title and the opening of its summary, as the report says them. */
export function reportReply(title: string, markdown: string): Wire | null {
  const body = paragraphs(markdown).filter((block) => !block.startsWith("## ") && !/^[-*\d]/.test(block) && !block.startsWith("|"));
  const text = (body[0] ?? "").replace(/\[(?:S|T)?\d+(?:,\s*(?:S|T)?\d+)*\]/g, "").replace(/\s+/g, " ").trim();
  if (!title && !text) return null;
  return { kind: "reply", headline: title.slice(0, 120), text: text.length > 360 ? `${text.slice(0, 357).replace(/\s+\S*$/, "")}…` : text, figures: [], points: [] };
}
