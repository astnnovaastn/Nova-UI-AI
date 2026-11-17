/*
 * AEGIS Agent Execution Lab — from events to the canvas.
 *
 * The canvas is never told where to draw anything. This file replays the events into the
 * records Zephium's frame subscribes to (WorkExecutionFact: steps, parts, inputs, artifacts;
 * WorkEnvironmentSnapshot: the request and object elements), in the same wire format the
 * Work Layout Lab's scene builder uses (fixtures/scene.ts). Zephium's own pipeline then lays
 * it out: environmentStages → placeRun → boardLayout. Replaying the same events gives the
 * same canvas, and replaying runs no tool.
 */
import type {
  WorkArtifactV1,
  WorkEnvironmentSnapshot,
  WorkExecutionFact,
  WorkPageV1,
  WorkRuntimeProjection,
  WorkStepFact,
} from "$shared/ipc/bindings";
import type { BoardScene } from "$features/work/tests/board-fixtures";
import { registerFrame } from "../media";
import type { PlanTask } from "./engine";
import { hostOf } from "./web";
import type { AgentEvent, WorkflowFixture } from "./types";

const PROFILE = "01J8Z7V6Q5N4M3K2H1G0F9E8D7";
const T0 = 1_790_620_000_000;
const LIMITS = { model_tokens: 1_000_000, cost_micro_usd: 3_000_000, operations: 256, timeout_seconds: 1800, max_workers: 4 };

const hueOf = (text: string) => {
  let hue = 0;
  for (const char of text) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return hue;
};

type Args = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" ? value : "");

/** The Zephium step kind a tool call is recorded as. */
function stepKind(tool: string, args: Args, folder: string): Record<string, unknown> | null {
  switch (tool) {
    case "web_search":
      return { kind: "search", query: str(args.query) };
    case "web_fetch":
    case "read":
      return { kind: "read", url: str(args.url) };
    case "browse": {
      const start = str(args.start);
      return { kind: "read", url: start.startsWith("https://") ? start : `https://${start}/`, goal: str(args.goal) };
    }
    case "glob":
      return { kind: "search_files", path: folder, query: str(args.pattern), glob: str(args.pattern), regex: false };
    case "grep":
      return { kind: "search_files", path: folder, query: str(args.pattern), glob: args.glob ? str(args.glob) : null, regex: true };
    case "read_file":
      return { kind: "read_file", path: `${folder}/${str(args.path)}`, offset: (args.offset as number) ?? 1, limit: (args.limit as number) ?? 400 };
    case "git_changes":
      return { kind: "list", path: folder, depth: 1 };
    case "describe_project":
      return { kind: "list", path: str(args.path) || folder, depth: 3 };
    case "python_tests":
      return { kind: "run_command", cwd: folder, command: `python -m unittest ${(args.tests as string[] ?? []).join(" ")}`, timeout_secs: 15, decision: true };
    case "connection":
      return { kind: "call", call: { service: str(args.service), tool: str(args.tool), verb: str(args.verb), ...(args.target ? { target: str(args.target) } : {}) } };
    default:
      return null;
  }
}

export type Projected = { scene: BoardScene; status: "running" | "waiting" | "completed" | "cancelled" };

/** The canvas after the first `upto` events. */
export function projectScene(fx: WorkflowFixture, events: readonly AgentEvent[], upto: number, request: string, waiting = false): Projected {
  const shown = events.slice(0, upto);
  const id = `agent-${fx.id}`;
  const work = `${id}-work`;
  const folder = fx.folder ?? "/lab/sample";
  const steps: WorkStepFact[] = [];
  const pages: WorkPageV1[] = [];
  const artifacts: WorkArtifactV1[] = [];
  const elements: { id: string; area: null; reference: Record<string, unknown> }[] = [
    { id: `${id}-request`, area: null, reference: { kind: "objective", objective: work } },
  ];
  const parts = new Map<string, Record<string, unknown>>();
  const inputs: Record<string, unknown>[] = [];
  const open = new Map<string, WorkStepFact>();
  let finished: AgentEvent | undefined;
  let stopped = false;

  for (const event of shown) {
    const base = { id: event.step ?? event.id, turn: event.turn ?? 1, ...(event.part ? { part: event.part } : {}) };
    switch (event.kind) {
      case "input_attached": {
        const data = event.data as { kind: string; label: string; count?: number };
        inputs.push({ kind: data.kind, label: data.label, ...(data.count ? { count: data.count } : {}) });
        break;
      }
      case "skill_loaded":
        inputs.push({ kind: "skill", label: event.label.replace(/^Skill: /u, ""), reference: (event.data as { name: string }).name });
        break;
      case "model_turn":
        steps.push({ ...base, id: event.id, kind: { kind: "turn" }, status: "succeeded", note: event.detail } as unknown as WorkStepFact);
        break;
      case "task_queued":
      case "task_started":
      case "task_waiting":
      case "task_completed":
      case "task_failed": {
        const data = event.data as Record<string, unknown>;
        const prior = parts.get(event.part!) ?? {};
        const state = str(data.state) || (event.kind === "task_waiting" ? "waiting" : "running");
        const next: Record<string, unknown> = {
          ...prior,
          id: event.part,
          ...(data.title ? { title: data.title } : {}),
          ...(data.helper ? { helper: data.helper } : {}),
          ...(data.goal ? { goal: data.goal } : {}),
          ...(data.service ? { service: String(data.service).includes(".") ? { host: data.service } : { connection: data.service } } : {}),
          state,
        };
        if (state === "running" || state === "waiting") next.started_ms ??= String(T0 + event.t);
        if (["done", "failed", "stopped"].includes(state)) {
          next.started_ms ??= String(T0 + event.t - 1);
          next.ended_ms = String(T0 + event.t);
          if (data.summary) next.summary = String(data.summary).slice(0, 78);
          if (data.need) next.need = data.need;
        }
        if (state !== "failed" && state !== "waiting") delete next.need;
        parts.set(event.part!, next);
        break;
      }
      case "tool_called": {
        const args = ((event.data as { arguments?: Args })?.arguments ?? {}) as Args;
        if (event.tool === "edit" || event.tool === "write") {
          const step = { ...base, kind: event.tool === "edit" ? { kind: "edit_file", path: `${folder}/${str(args.path)}`, old: str(args.old), new: str(args.new) } : { kind: "write_file", path: `${folder}/${str(args.path)}`, content: str(args.text) }, status: "running" } as unknown as WorkStepFact;
          open.set(event.step!, step);
          steps.push(step);
          break;
        }
        const kind = stepKind(event.tool ?? "", args, folder);
        if (!kind) break;
        const step = { ...base, kind, status: "running" } as unknown as WorkStepFact;
        const title = str((event.data as Args)?.page_title);
        if (kind.kind === "read" && title) (step as unknown as Args).local = { page_title: title };
        open.set(event.step!, step);
        steps.push(step);
        break;
      }
      case "tool_completed": {
        const step = event.step ? open.get(event.step) : undefined;
        if (!step) break;
        const raw = step as unknown as Args;
        raw.status = event.error ? (event.error === "declined" ? "cancelled" : "failed") : "succeeded";
        if (event.detail) raw.note = event.detail;
        const kind = raw.kind as Args;
        if (kind.kind === "edit_file" || kind.kind === "write_file") kind.decision = event.error !== "declined";
        if (kind.kind === "read" && !event.error) {
          const url = str(kind.url);
          const title = str((raw.local as Args | undefined)?.page_title) || hostOf(url);
          registerFrame("attempt", raw.id as string, { title, host: hostOf(url), hue: hueOf(hostOf(url)) });
          pages.push({ execution: id, attempt: "attempt", step: raw.id, url, live: false, frame: { generation: 1, width: 1280, height: 800 }, ...(raw.part ? { part: raw.part } : {}), title } as unknown as WorkPageV1);
        }
        if (kind.kind === "call") {
          const result = (event.data as { result?: Args })?.result ?? {};
          Object.assign(kind.call as Args, { ...(result.title ? { title: result.title } : {}), ...(result.count ? { count: result.count } : {}), ...(result.url ? { url: result.url } : {}) });
        }
        open.delete(event.step!);
        break;
      }
      case "approval_requested": {
        if (event.step) break; // a file decision lives on its edit step
        const data = event.data as { purpose: string; options: string[] };
        const step = { ...base, id: `${event.id}-ask`, kind: { kind: "ask", prompt: event.label, options: data.options ?? [], purpose: data.purpose === "file" ? "confirm" : data.purpose }, status: "running" } as unknown as WorkStepFact;
        open.set(event.decision!, step);
        steps.push(step);
        break;
      }
      case "user_approved":
      case "user_declined": {
        const step = event.decision ? open.get(event.decision) : undefined;
        if (!step) break;
        const raw = step as unknown as Args;
        (raw.kind as Args).answer = event.kind === "user_approved" ? str((event.data as Args)?.answer) || event.label : "Not now";
        raw.status = "succeeded";
        open.delete(event.decision!);
        break;
      }
      case "artifact_created": {
        const data = event.data as { artifact: string; kind: string; title: string; wire: WorkArtifactV1["data"]; revises?: string; part?: string };
        artifacts.push({
          version: 1,
          id: data.artifact,
          execution: id,
          node: "agent",
          attempt: "attempt",
          output: data.title,
          title: data.kind === "reply" ? "" : data.title,
          data: data.wire,
          evidence: [],
          review: "mechanical",
          presentation: "automatic",
          ...(data.part ? { part: data.part } : {}),
          ...(data.revises ? { revises: data.revises } : {}),
        } as unknown as WorkArtifactV1);
        steps.push({ ...base, id: `${event.id}-publish`, kind: { kind: "publish" }, status: "succeeded", artifacts: [data.artifact], note: `${data.revises ? "Updated" : "Placed"} the ${data.kind}` } as unknown as WorkStepFact);
        if (!data.revises) elements.push({ id: `el-${data.artifact}`, area: null, reference: { kind: "artifact", objective: work, execution: id, artifact: data.artifact } });
        break;
      }
      case "run_completed":
        finished = event;
        steps.push({ ...base, id: event.id, kind: { kind: "finish", ...((event.data as Args)?.followups ? { followups: (event.data as Args).followups } : {}) }, status: "succeeded", note: event.detail } as unknown as WorkStepFact);
        break;
      case "run_stopped":
        stopped = true;
        break;
      default:
        break;
    }
  }

  const status: Projected["status"] = finished ? "completed" : stopped ? "cancelled" : waiting ? "waiting" : "running";
  const run = {
    id,
    approved_revision: "1",
    status: finished ? "completed" : stopped ? "cancelled" : "running",
    attempts: [],
    authorization: "user_directed_agent",
    spec: {
      plan_revision: "1",
      request,
      limits: LIMITS,
      nodes: [
        {
          node: "agent",
          parent: null,
          capability: { kind: "agent", grant: { ...(fx.folder ? { folders: [fx.folder] } : {}), lead: { provider: "compatible", wire: "chat_completions", model: "simulated" }, ...(fx.skill ? { skill: fx.skill } : {}) } },
          limits: LIMITS,
        },
      ],
    },
    artifacts,
    provider_evidence: [],
    user_artifacts: [],
    steps,
    parts: [...parts.values()].filter((part) => part.title),
    ...(inputs.length ? { inputs } : {}),
  } as unknown as WorkExecutionFact;

  const projection = {
    version: 1,
    interrupted: [],
    executions: [run],
    work: {
      schema_version: 2,
      profile: PROFILE,
      id: work,
      revision: "1",
      lifecycle: "active",
      objective: request,
      objective_revision: "1",
      context_revision: "1",
      objective_author: "user",
      questions: [],
      status: finished ? "plan_ready" : "running",
      plan: null,
    },
  } as unknown as WorkRuntimeProjection;

  const snapshot = {
    version: 1,
    profile: PROFILE,
    id: `${id}-canvas`,
    space: "space",
    title: fx.title,
    revision: "1",
    lifecycle: "active",
    areas: [],
    view: { revision: "1", x: 0, y: 0, zoom_milli: 1000, placements: [] },
    elements,
  } as unknown as WorkEnvironmentSnapshot;

  return { scene: { name: id, snapshot, objectives: new Map([[work, projection]]), pictures: new Map(), pages }, status };
}

/** The plan's tasks with the status the events so far give them. */
export function planStatus(tasks: readonly PlanTask[], events: readonly AgentEvent[]): PlanTask[] {
  const out = tasks.map((task) => ({ ...task, artifacts: [] as string[] }));
  const byId = new Map(out.map((task) => [task.id, task]));
  const key = (part?: string) => (part ? `part:${part.split("-part-")[1]}` : "");
  for (const event of events) {
    if (event.kind === "skill_loaded") {
      const task = byId.get(`skill:${(event.data as { name: string }).name}`);
      if (task) task.status = "done";
    }
    if (event.part && byId.has(key(event.part))) {
      const task = byId.get(key(event.part))!;
      if (event.kind === "task_queued") task.status = "queued";
      if (event.kind === "task_started") task.status = "running";
      if (event.kind === "task_waiting" || (event.kind === "approval_requested" && event.part)) task.status = "waiting";
      if (event.kind === "user_approved") task.status = "running";
      if (event.kind === "task_completed") task.status = "done";
      if (event.kind === "task_failed") task.status = "failed";
      if (event.kind === "artifact_created") task.artifacts.push((event.data as { artifact: string }).artifact);
    }
    if (event.kind === "artifact_created" && !event.part) {
      const data = event.data as { artifact: string; kind: string };
      const task = data.kind === "reply" ? byId.get("finish") : data.kind === "project" ? byId.get("describe") : out.find((each) => each.type === "compose" && each.outputs[0] === data.kind && each.status !== "done");
      if (task) {
        task.status = "done";
        task.artifacts.push(data.artifact);
      }
    }
    if (event.kind === "artifact_refused" && !event.part) {
      const kind = (event.data as { kind?: string })?.kind;
      const task = out.find((each) => each.type === "compose" && each.outputs[0] === kind && each.status !== "done");
      if (task) task.status = "failed";
    }
    if (event.kind === "approval_requested" && !event.part) {
      const task = out.find((each) => each.type === "ask" && each.title === event.detail);
      if (task) task.status = "waiting";
    }
    if (event.kind === "user_approved" && !event.part) {
      const task = out.find((each) => each.type === "ask" && each.status === "waiting");
      if (task) task.status = "done";
    }
  }
  return out;
}

/** AEGIS relation types (core/work/relations.py), drawn from what the events record. */
export type Relation = { type: string; source: string; target: string; event: number; label: string };

export function relationsOf(events: readonly AgentEvent[]): Relation[] {
  const out: Relation[] = [];
  const add = (type: string, source: string, target: string, event: AgentEvent, label = "") => out.push({ type, source, target, event: event.seq, label });
  const agent = (actor: string) => (actor === "lead" ? "agent:lead" : actor.includes("-part-") ? `agent:${actor.split("-part-")[1]}` : `agent:${actor}`);
  let queries = 0;
  const query = new Map<string, string>();
  for (const event of events) {
    switch (event.kind) {
      case "plan_created":
        add("plans", "request", "agent:lead", event, "Plan");
        break;
      case "task_queued":
        add("assigns", "agent:lead", agent(event.actor), event, "Task");
        break;
      case "tool_called":
        if (event.tool === "web_search") {
          const ref = `query:${++queries}`;
          query.set(event.step!, ref);
          add("searches", agent(event.actor), ref, event, "Search");
        }
        break;
      case "tool_completed":
        if (event.tool === "web_search" && event.step && query.has(event.step))
          for (const hit of ((event.data as { result?: { key: string }[] })?.result ?? []).slice(0, 8)) add("found", query.get(event.step)!, `source:${hit.key}`, event, "Source");
        break;
      case "source_collected":
        add("reads", agent(event.actor), `source:${(event.data as { key: string }).key}`, event, "Read");
        break;
      case "artifact_created": {
        const data = event.data as { artifact: string; sources: string[] };
        add("produces", agent(event.actor), `object:${data.artifact}`, event, "Result");
        for (const key of data.sources ?? []) add("supports_object", `source:${key}`, `object:${data.artifact}`, event, "Source");
        break;
      }
      case "task_completed":
        add("delivers", agent(event.actor), "agent:lead", event, "Findings");
        break;
      default:
        break;
    }
  }
  return out;
}
