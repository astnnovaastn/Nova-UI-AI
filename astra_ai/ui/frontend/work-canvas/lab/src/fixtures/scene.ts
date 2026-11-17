/*
 * AEGIS Work Layout Lab — deterministic scene builder.
 *
 * Builds runs in Zephium's own wire format (WorkExecutionFact / WorkEnvironmentSnapshot),
 * following the patterns of the reference fixtures
 *   frame/src/features/work/tests/board-fixtures.ts  (run, scene)
 *   frame/src/features/work/tests/parts-look.ts      (parts, steps)
 *   frame/src/features/work/tests/lead-look.ts       (lead run, inputs, publish steps)
 * Those files are MPL-2.0 (c) Zephium contributors; this file is a derived fixture
 * helper and is offered under the same licence. Everything a scene holds is local,
 * invented sample data. Nothing is fetched and no model is called.
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

export type Data = WorkArtifactV1["data"];
type Helper = "browser" | "research" | "computer" | "connection";

export type StepSpec =
  | { do: "read"; url: string; title: string; note?: string; failed?: boolean }
  | { do: "search"; query: string }
  | { do: "file"; path: string }
  | { do: "find"; query: string }
  | { do: "command"; command: string; note?: string; failed?: boolean };

export type PartSpec = {
  id: string;
  title: string;
  helper: Helper;
  /** A site's host (browser, research) or an installed connection's name. */
  host?: string;
  connection?: string;
  goal: string;
  summary?: string;
  /** Seconds after the run began; parts whose spans overlap stand in one column. */
  at: number;
  lasts: number;
  steps: StepSpec[];
};

export type MadeSpec = { id: string; title: string; data: Data; part?: string };
export type InputSpec = {
  kind: "memory" | "skill" | "history" | "notes" | "tabs" | "files" | "connection" | "work";
  label: string;
  count?: number;
};
export type SceneSpec = {
  name: string;
  request: string;
  /** A granted folder, for computer parts. */
  folder?: string;
  inputs?: InputSpec[];
  parts: PartSpec[];
  made: MadeSpec[];
};

/** One beat of a replay: what just happened, in the lab's words. */
export type Beat = { label: string; detail?: string };

const PROFILE = "01J8Z7V6Q5N4M3K2H1G0F9E8D7";
const T0 = 1_790_620_000_000;
const LIMITS = {
  model_tokens: 400_000,
  cost_micro_usd: 2_000_000,
  operations: 96,
  timeout_seconds: 1800,
  max_workers: 4,
};

type Event =
  | { kind: "request" }
  | { kind: "inputs" }
  | { kind: "start"; parts: string[] }
  | { kind: "step"; part: string; index: number }
  | { kind: "done"; part: string }
  | { kind: "made"; index: number }
  | { kind: "finish" };

/** Parts grouped the way Zephium's `columnsOf` will group them: by overlapping time. */
function waves(parts: readonly PartSpec[]): PartSpec[][] {
  const sorted = [...parts].sort((a, b) => a.at - b.at);
  const out: PartSpec[][] = [];
  let end = -Infinity;
  for (const part of sorted) {
    if (!out.length || part.at >= end) {
      out.push([part]);
      end = part.at + part.lasts;
    } else {
      out.at(-1)!.push(part);
      end = Math.max(end, part.at + part.lasts);
    }
  }
  return out;
}

function eventsOf(spec: SceneSpec): Event[] {
  const events: Event[] = [{ kind: "request" }];
  if (spec.inputs?.length) events.push({ kind: "inputs" });
  for (const wave of waves(spec.parts)) {
    events.push({ kind: "start", parts: wave.map((part) => part.id) });
    const most = Math.max(...wave.map((part) => part.steps.length));
    for (let index = 0; index < most; index++)
      for (const part of wave)
        if (index < part.steps.length) events.push({ kind: "step", part: part.id, index });
    for (const part of wave) events.push({ kind: "done", part: part.id });
  }
  spec.made.forEach((_, index) => events.push({ kind: "made", index }));
  events.push({ kind: "finish" });
  return events;
}

const hueOf = (text: string) => {
  let hue = 0;
  for (const char of text) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return hue;
};
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return url;
  }
};

/** What each replay beat says, in order. */
export function beatsOf(spec: SceneSpec): Beat[] {
  const part = (id: string) => spec.parts.find((entry) => entry.id === id)!;
  return eventsOf(spec).map((event): Beat => {
    switch (event.kind) {
      case "request":
        return { label: "Request sent", detail: spec.request };
      case "inputs":
        return {
          label: "Inputs gathered",
          detail: spec.inputs!.map((input) => input.label).join(" · "),
        };
      case "start":
        return {
          label: event.parts.length > 1 ? "Parts start in parallel" : "Part starts",
          detail: event.parts.map((id) => part(id).title).join(" · "),
        };
      case "step": {
        const step = part(event.part).steps[event.index]!;
        const said =
          step.do === "read"
            ? `reads ${hostOf(step.url)}`
            : step.do === "search"
              ? `searches “${step.query}”`
              : step.do === "file"
                ? `opens ${step.path.split("/").at(-1)}`
                : step.do === "find"
                  ? `searches files for “${step.query}”`
                  : `runs ${step.command}`;
        return { label: `${part(event.part).title} ${said}` };
      }
      case "done":
        return { label: `${part(event.part).title} reports`, detail: part(event.part).summary };
      case "made": {
        const made = spec.made[event.index]!;
        return { label: `Object placed: ${made.data.kind}`, detail: made.title };
      }
      case "finish":
        return { label: "Run finished" };
    }
  });
}

/**
 * The scene after its first `upto` beats. With every beat it is the finished run; with
 * fewer, a run caught mid-way, exactly as the canvas would hold it then.
 */
export function buildScene(spec: SceneSpec, upto = Infinity): BoardScene {
  const events = eventsOf(spec).slice(0, Math.max(1, upto));
  const id = spec.name;
  const work = `${id}-work`;
  const finished = events.some((event) => event.kind === "finish");
  const started = new Set(events.flatMap((event) => (event.kind === "start" ? event.parts : [])));
  const ended = new Set(events.flatMap((event) => (event.kind === "done" ? [event.part] : [])));
  const stepped = new Map<string, number>();
  for (const event of events)
    if (event.kind === "step") stepped.set(event.part, Math.max(stepped.get(event.part) ?? 0, event.index + 1));
  const madeCount = events.filter((event) => event.kind === "made").length;
  const withInputs = events.some((event) => event.kind === "inputs");

  const steps: WorkStepFact[] = [];
  const pages: WorkPageV1[] = [];
  for (const part of spec.parts) {
    if (!started.has(part.id)) continue;
    const shown = stepped.get(part.id) ?? 0;
    part.steps.slice(0, shown).forEach((step, index) => {
      const sid = `${part.id}-${index}`;
      const running = !ended.has(part.id) && index === shown - 1;
      const failed = "failed" in step && step.failed;
      const status: WorkStepFact["status"] = running ? "running" : failed ? "failed" : "succeeded";
      const base = { id: sid, turn: 1, status, part: part.id };
      if (step.do === "read") {
        steps.push({
          ...base,
          kind: { kind: "read", url: step.url },
          ...(step.note ? { note: step.note } : {}),
          local: { page_title: step.title },
        } as unknown as WorkStepFact);
        if (!failed) {
          registerFrame("attempt", sid, { title: step.title, host: hostOf(step.url), hue: hueOf(hostOf(step.url)) });
          pages.push({
            execution: id,
            attempt: "attempt",
            step: sid,
            url: step.url,
            live: running,
            frame: { generation: 1, width: 1280, height: 800 },
            part: part.id,
            title: step.title,
          } as WorkPageV1);
        }
      } else if (step.do === "search")
        steps.push({ ...base, kind: { kind: "search", query: step.query } } as WorkStepFact);
      else if (step.do === "file")
        steps.push({
          ...base,
          kind: { kind: "read_file", path: step.path, offset: 1, limit: 400 },
        } as WorkStepFact);
      else if (step.do === "find")
        steps.push({
          ...base,
          kind: { kind: "search_files", path: spec.folder ?? "/", query: step.query, glob: null, regex: null },
        } as WorkStepFact);
      else
        steps.push({
          ...base,
          kind: { kind: "run_command", cwd: spec.folder ?? "/", command: step.command, timeout_secs: 120, decision: true },
          ...(step.note ? { note: step.note } : {}),
        } as unknown as WorkStepFact);
    });
  }

  const made = spec.made.slice(0, madeCount);
  const artifacts = made.map(
    (entry) =>
      ({
        version: 1,
        id: entry.id,
        execution: id,
        node: "agent",
        attempt: "attempt",
        output: entry.title,
        title: entry.title,
        data: entry.data,
        evidence: [],
        review: "mechanical",
        presentation: "automatic",
        ...(entry.part ? { part: entry.part } : {}),
      }) as unknown as WorkArtifactV1,
  );
  made.forEach((entry, index) =>
    steps.push({
      id: `publish-${index}`,
      turn: 90 + index,
      kind: { kind: "publish" },
      status: "succeeded",
      artifacts: [entry.id],
    } as WorkStepFact),
  );
  if (finished)
    steps.push({ id: `${id}-finish`, turn: 99, kind: { kind: "finish" }, status: "succeeded" } as WorkStepFact);

  const run = {
    id,
    approved_revision: "1",
    status: finished ? "completed" : "running",
    attempts: [],
    spec: {
      plan_revision: "1",
      request: spec.request,
      limits: LIMITS,
      nodes: [
        {
          node: "agent",
          parent: null,
          capability: {
            kind: "agent",
            grant: {
              ...(spec.folder ? { folders: [spec.folder] } : {}),
              lead: { provider: "open_ai", wire: "open_ai_responses", model: "simulated" },
            },
          },
          limits: LIMITS,
        },
      ],
    },
    artifacts,
    provider_evidence: [],
    user_artifacts: [],
    steps,
    parts: spec.parts
      .filter((part) => started.has(part.id))
      .map((part) => ({
        id: part.id,
        title: part.title,
        helper: part.helper,
        ...(part.connection
          ? { service: { connection: part.connection } }
          : part.host
            ? { service: { host: part.host } }
            : {}),
        goal: part.goal,
        state: ended.has(part.id) ? "done" : "running",
        started_ms: String(T0 + part.at * 1000),
        ...(ended.has(part.id)
          ? { ended_ms: String(T0 + (part.at + part.lasts) * 1000), ...(part.summary ? { summary: part.summary } : {}) }
          : {}),
      })),
    ...(withInputs ? { inputs: spec.inputs } : {}),
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
      objective: spec.request,
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
    title: id,
    revision: "1",
    lifecycle: "active",
    areas: [],
    view: { revision: "1", x: 0, y: 0, zoom_milli: 1000, placements: [] },
    elements: [
      { id: `${id}-request`, area: null, reference: { kind: "objective", objective: work } },
      ...made.map((entry) => ({
        id: `el-${entry.id}`,
        area: null,
        reference: { kind: "artifact", objective: work, execution: id, artifact: entry.id },
      })),
    ],
  } as unknown as WorkEnvironmentSnapshot;

  return { name: id, snapshot, objectives: new Map([[work, projection]]), pictures: new Map(), pages };
}
