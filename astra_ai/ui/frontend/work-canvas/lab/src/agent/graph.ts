/*
 * AEGIS Agent Execution Lab — the execution graph's geometry.
 *
 * One lane per actor (you and the app, the lead, then each part in the order it was
 * queued); x is the simulated clock; things that overlap in time inside one lane stack into
 * sub-rows. Every line is a recorded dependency: a turn and the calls it made, a call and
 * what it produced, a part and the lead turn that read its digest, a source and the object
 * citing it. No line is drawn for looks, and no model chooses a coordinate.
 */
import type { AgentEvent } from "./types";

export type GraphNode = {
  id: string;
  event: AgentEvent;
  /** The other event of a pair (a call's start), when the node spans time. */
  start?: AgentEvent;
  lane: string;
  shape: "bar" | "dot" | "diamond" | "square" | "flag";
  x: number;
  width: number;
  y: number;
  label: string;
  tone: "turn" | "tool" | "source" | "ask" | "object" | "part" | "fail" | "run" | "plan";
};

export type GraphEdge = { id: string; from: string; to: string; kind: "calls" | "produces" | "starts" | "reports" | "cites" | "decides" };

export type Lane = { id: string; label: string; y: number; height: number };

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; lanes: Lane[]; width: number; height: number };

const PX_PER_MS = 0.07;
const LEFT = 150;
const ROW = 22;
const LANE_PAD = 14;
const MIN_BAR = 10;

export function layoutGraph(events: readonly AgentEvent[]): Graph {
  const laneOf = (event: AgentEvent) => (event.actor === "person" || event.actor === "app" ? "you" : event.actor);
  const order: string[] = ["you", "lead"];
  const titles = new Map<string, string>([
    ["you", "You · app"],
    ["lead", "Lead"],
  ]);
  for (const event of events)
    if (event.kind === "task_queued" && !order.includes(event.actor)) {
      order.push(event.actor);
      titles.set(event.actor, `Part · ${(event.data as { title: string }).title}`);
    }

  const started = new Map<string, AgentEvent>();
  const raw: Omit<GraphNode, "y">[] = [];
  const x = (t: number) => LEFT + t * PX_PER_MS;
  for (const event of events) {
    if (event.kind === "tool_called") {
      started.set(event.step ?? event.id, event);
      continue;
    }
    const lane = laneOf(event);
    const base = { id: event.id, event, lane, label: event.label };
    switch (event.kind) {
      case "tool_completed": {
        const start = event.step ? started.get(event.step) : undefined;
        const from = start?.t ?? event.t - (event.ms ?? 100);
        raw.push({ ...base, ...(start ? { start } : {}), shape: "bar", x: x(from), width: Math.max(MIN_BAR, (event.t - from) * PX_PER_MS), tone: event.error ? "fail" : "tool" });
        break;
      }
      case "model_turn":
        raw.push({ ...base, shape: "bar", x: x(event.t - (event.ms ?? 0)), width: Math.max(MIN_BAR, (event.ms ?? 0) * PX_PER_MS), tone: "turn" });
        break;
      case "source_collected":
        raw.push({ ...base, shape: "dot", x: x(event.t), width: 10, tone: "source" });
        break;
      case "approval_requested":
      case "user_approved":
      case "user_declined":
        raw.push({ ...base, lane: event.kind === "approval_requested" ? "you" : "you", shape: "diamond", x: x(event.t) + (event.kind === "approval_requested" ? 0 : 6), width: 12, tone: event.kind === "user_declined" ? "fail" : "ask" });
        break;
      case "artifact_created":
      case "artifact_refused":
        raw.push({ ...base, shape: "square", x: x(event.t), width: 12, tone: event.kind === "artifact_refused" ? "fail" : "object" });
        break;
      case "tool_refused":
        raw.push({ ...base, shape: "bar", x: x(event.t), width: MIN_BAR, tone: "fail" });
        break;
      case "task_queued":
      case "task_started":
      case "task_waiting":
      case "task_completed":
      case "task_failed":
        raw.push({ ...base, shape: "flag", x: x(event.t), width: 8, tone: event.kind === "task_failed" ? "fail" : "part" });
        break;
      case "plan_created":
        raw.push({ ...base, shape: "square", x: x(event.t), width: 12, tone: "plan" });
        break;
      case "skill_loaded":
      case "input_attached":
      case "prompt_received":
      case "run_created":
      case "run_completed":
      case "run_stopped":
        raw.push({ ...base, shape: "dot", x: x(event.t), width: 10, tone: event.kind === "run_stopped" ? "fail" : "run" });
        break;
    }
  }

  // Stack overlapping intervals inside a lane into sub-rows (greedy, in time order).
  const rowsOf = new Map<string, number[]>();
  const rowFor = new Map<string, number>();
  for (const node of [...raw].sort((a, b) => a.x - b.x)) {
    const ends = rowsOf.get(node.lane) ?? [];
    let row = ends.findIndex((end) => end + 4 <= node.x);
    if (row < 0) {
      row = ends.length;
      ends.push(0);
    }
    // An object's label is drawn beside it, so it takes room in its row too.
    ends[row] = node.x + (node.shape === "square" ? 18 + Math.min(34, node.label.length) * 6 : node.width);
    rowsOf.set(node.lane, ends);
    rowFor.set(node.id, row);
  }
  const lanes: Lane[] = [];
  // Below the stage's floating toolbar.
  let y = 64;
  for (const id of order) {
    const rows = Math.max(1, rowsOf.get(id)?.length ?? 1);
    lanes.push({ id, label: titles.get(id) ?? id, y, height: rows * ROW + LANE_PAD * 2 });
    y += rows * ROW + LANE_PAD * 2 + 6;
  }
  const laneY = new Map(lanes.map((lane) => [lane.id, lane.y]));
  const nodes: GraphNode[] = raw
    .filter((node) => laneY.has(node.lane))
    .map((node) => ({ ...node, y: laneY.get(node.lane)! + LANE_PAD + rowFor.get(node.id)! * ROW + ROW / 2 }));

  // Recorded dependencies only.
  const byEvent = new Map(nodes.map((node) => [node.event.id, node]));
  const startToNode = new Map(nodes.filter((node) => node.start).map((node) => [node.start!.id, node]));
  const target = (id?: string) => (id ? (byEvent.get(id) ?? startToNode.get(id)) : undefined);
  const edges: GraphEdge[] = [];
  const add = (from: GraphNode | undefined, to: GraphNode | undefined, kind: GraphEdge["kind"]) => {
    if (from && to && from.id !== to.id) edges.push({ id: `${from.id}>${to.id}:${kind}`, from: from.id, to: to.id, kind });
  };
  const leadTurns = nodes.filter((node) => node.event.kind === "model_turn" && node.lane === "lead");
  const sourceByKey = new Map<string, GraphNode>();
  for (const node of nodes) if (node.event.kind === "source_collected") sourceByKey.set((node.event.data as { key: string }).key, node);
  for (const node of nodes) {
    const event = node.event;
    // A call's completion points at its own start: what caused the call is the start's cause.
    const cause = node.start ? (node.start.cause ?? event.cause) : event.cause;
    if (event.kind === "tool_completed" || event.kind === "tool_refused") add(target(cause), node, "calls");
    if (event.kind === "source_collected" || event.kind === "artifact_created" || event.kind === "artifact_refused") add(target(cause), node, "produces");
    if (event.kind === "task_queued") add(target(cause), node, "starts");
    if (event.kind === "user_approved" || event.kind === "user_declined") {
      const asked = nodes.find((each) => each.event.kind === "approval_requested" && each.event.decision === event.decision);
      add(asked, node, "decides");
    }
    if (event.kind === "task_completed" || event.kind === "task_failed") {
      const next = leadTurns.find((turn) => turn.event.t - (turn.event.ms ?? 0) >= event.t);
      add(node, next, "reports");
    }
    if (event.kind === "artifact_created") for (const key of (event.data as { sources?: string[] }).sources ?? []) add(sourceByKey.get(key), node, "cites");
  }
  const width = Math.max(900, ...nodes.map((node) => node.x + node.width + 220));
  return { nodes, edges, lanes, width, height: y + 12 };
}

/** A smooth string between two nodes: out to the right, into the left. */
export function edgePath(from: GraphNode, to: GraphNode): string {
  const x1 = from.x + from.width;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;
  const bend = Math.max(24, Math.abs(x2 - x1) * 0.45);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}
