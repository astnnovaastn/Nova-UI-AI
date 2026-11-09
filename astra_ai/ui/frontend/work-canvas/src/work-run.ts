/**
 * The backend's record of a work run, read for the canvas: who was assigned what, how far each got,
 * and what they reported. Every field restates the run record or a recorded event. An agent with no
 * record is simply not drawn, and nothing here guesses at progress.
 */
import type { TrailLine } from "$features/work/lib/board/trail";
import type { TraceEvent } from "./research-trace";

export type MapNode = { id: string; title: string; kind: string; group: string; summary: string; source_ids: string[] };
export type KnowledgeMap = {
  title: string;
  groups: { id: string; title: string }[];
  nodes: MapNode[];
  edges: { from: string; to: string; label: string }[];
};

export type WorkRun = {
  run_id: string;
  research_id: string;
  state: string;
  stage: string;
  failure: string;
  request: { query: string; workflow?: string; mode?: string };
  plan: { title?: string; acknowledgement?: string; intent?: string; mode?: string; clarification?: string; sections?: string[]; reasoning_summary?: string };
  assignments: { agent: string; role: string; task: string; provider: string; model: string; state: string }[];
  results: Record<string, { agent: string; role: string; state: string; summary: string; provider: string; model: string; tokens: number; seconds: number; failure: string }>;
  evidence: { id: string; url: string; title: string; domain: string; retrieved_at: string; relevance: number; credibility: number; assessment: string; query: string }[];
  artifacts: { id: string; kind: string; title: string; data: Record<string, unknown> }[];
  usage: { calls?: number; tokens?: number; searches?: number; models?: Record<string, { calls: number; tokens: number; seconds: number }> };
};

export type CanvasView = { chosen: string[]; hidden: string[] };

export type AgentBranch = {
  agent: string;
  role: string;
  title: string;
  model: string;
  provider: string;
  state: string;
  task: string;
  summary: string;
  tokens: number;
  seconds: number;
  failure: string;
  /** The model that actually answered, when a fallback stepped in. */
  fellBackFrom: string;
  /** What this agent recorded, in order. */
  activity: { key: string; text: string; detail: string; state: string }[];
};

const TITLES: Record<string, string> = { discovery: "Discovery", analysis: "Analysis", verification: "Verification", lead: "AEGIS" };
const STATE_WORDS: Record<string, string> = {
  assigned: "Assigned",
  running: "Working",
  waiting: "Waiting",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  stopped: "Stopped",
};
export const agentStateWords = (state: string) => STATE_WORDS[state] ?? state;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const count = (value: unknown) => (typeof value === "number" ? value : 0);

/** Which agent a stage or tool event belongs to. Unknown events belong to none. */
const STAGE_OWNER: Record<string, string> = {
  received: "lead",
  intent: "lead",
  classified: "lead",
  planned: "lead",
  assigned: "lead",
  question: "lead",
  search_strategy: "discovery",
  searching: "discovery",
  discovered: "discovery",
  assessed: "discovery",
  evidence: "discovery",
  analysis: "analysis",
  map: "analysis",
  verifying: "verification",
  verified: "verification",
  gaps: "discovery",
  writing: "lead",
  citations: "lead",
  finished: "lead",
};

function stageDetail(event: TraceEvent): string {
  const parts: string[] = [];
  if (text(event.detail)) parts.push(text(event.detail));
  if (event.stage === "assessed" && typeof event.kept === "number") parts.push(`Kept ${event.kept}, set aside ${count(event.rejected)}`);
  if (event.stage === "verified") parts.push(`${count(event.supported)} supported · ${count(event.contested)} contested · ${count(event.unsupported)} unsupported · ${count(event.gaps)} gaps`);
  if (event.stage === "citations") parts.push(`${count(event.cited)} of ${count(event.sources)} sources cited${count(event.removed) ? ` · ${count(event.removed)} unknown citations removed` : ""}`);
  if (event.stage === "finished") parts.push(`${count(event.calls)} model calls · ${count(event.tokens).toLocaleString("en")} tokens`);
  if (event.stage === "map" && typeof event.edges === "number") parts.push(`${count(event.groups)} groups · ${count(event.edges)} connections`);
  if (event.stage === "evidence") parts.push(`From ${count(event.domains)} sites`);
  if (Array.isArray(event.queries)) parts.push((event.queries as unknown[]).map(text).join(" · "));
  if (Array.isArray(event.gaps)) parts.push((event.gaps as unknown[]).map(text).join(" · "));
  return parts.filter(Boolean).join(" · ");
}

/** Each stage's latest report, newest state replacing the older one. */
function activityFor(events: readonly TraceEvent[], role: string): AgentBranch["activity"] {
  const rows = new Map<string, AgentBranch["activity"][number]>();
  for (const event of events) {
    if (event.kind === "stage" && STAGE_OWNER[text(event.stage)] === role) {
      rows.set(`stage-${text(event.stage)}`, { key: `stage-${text(event.stage)}`, text: text(event.label), detail: stageDetail(event), state: event.status ?? "done" });
    } else if (event.kind === "search" && role === "discovery") {
      rows.set(`search-${text(event.query)}`, {
        key: `search-${text(event.query)}`,
        text: `Searched: ${text(event.query)}`,
        detail: event.status === "failed" ? text(event.reason).replace(/_/g, " ") : typeof event.count === "number" ? `${event.count} results` : "",
        state: event.status ?? "done",
      });
    } else if (event.kind === "read" && role === "discovery" && event.status !== "running") {
      rows.set(`read-${text(event.url)}`, { key: `read-${text(event.url)}`, text: `${event.status === "failed" ? "Couldn't open" : "Read"} ${text(event.title) || text(event.url)}`, detail: "", state: event.status ?? "done" });
    }
  }
  return [...rows.values()];
}

/** An agent can't still be working on a run that has ended, or while it waits for the person. */
function settledState(run: WorkRun, state: string): string {
  if (state !== "running" && state !== "assigned") return state;
  if (run.state === "needs_input") return "waiting";
  return run.state === "failed" || run.state === "cancelled" ? "stopped" : state;
}

/** The specialists of a run, then the lead, as far as the record shows each. */
export function agentBranches(run: WorkRun | null | undefined, events: readonly TraceEvent[]): AgentBranch[] {
  if (!run) return [];
  const rows = run.assignments.map((row) => ({ agent: row.agent, role: row.role, task: row.task, provider: row.provider, model: row.model, state: row.state }));
  const lead = run.results.lead;
  const leadEvent = [...events].reverse().find((event) => event.kind === "agent" && event.agent === "lead");
  const planned = events.some((event) => event.kind === "stage" && event.stage === "planned");
  if (lead || planned) rows.push({ agent: "lead", role: "lead", task: run.plan.acknowledgement || run.plan.reasoning_summary || "", provider: lead?.provider ?? "", model: lead?.model ?? "", state: lead?.state ?? "running" });
  return rows.map((row) => {
    const latest = [...events].reverse().find((event) => event.kind === "agent" && event.agent === row.agent);
    const result = run.results[row.role];
    return {
      agent: row.agent,
      role: row.role,
      title: TITLES[row.role] ?? row.role,
      model: text(result?.model) || text(latest?.model) || row.model,
      provider: text(result?.provider) || text(latest?.provider) || row.provider,
      state: settledState(run, result?.state && result.state !== "running" ? result.state : text(latest?.state) || row.state),
      task: row.task,
      summary: text(result?.summary) || text(latest?.summary),
      tokens: count(result?.tokens) || count(latest?.tokens),
      seconds: count(result?.seconds) || count(latest?.seconds),
      failure: text(result?.failure) || text(latest?.failure),
      fellBackFrom: row.agent === "lead" ? text(leadEvent?.fell_back) : text(latest?.fell_back),
      activity: activityFor(events, row.role),
    };
  });
}

const ICONS: Record<string, TrailLine["icon"]> = {
  received: "steer",
  intent: "knowledge",
  classified: "knowledge",
  planned: "knowledge",
  assigned: "steer",
  question: "ask",
  search_strategy: "search",
  searching: "search",
  discovered: "page",
  assessed: "knowledge",
  evidence: "file",
  analysis: "knowledge",
  map: "file",
  verifying: "knowledge",
  verified: "knowledge",
  gaps: "search",
  writing: "file",
  citations: "knowledge",
  finished: "knowledge",
};

/** A stage event as a line of the run's steps. */
export function stageLine(event: TraceEvent, after: string): TrailLine {
  const stage = text(event.stage);
  const failed = event.status === "failed";
  const detail = stageDetail(event);
  return {
    key: `stage-${stage}`,
    icon: failed ? "stopped" : (ICONS[stage] ?? "knowledge"),
    text: text(event.label),
    detail: [detail, after].filter(Boolean).join(" · "),
  };
}

export function mapOf(run: WorkRun | null | undefined): KnowledgeMap | null {
  const row = run?.artifacts?.find((entry) => entry.kind === "knowledge_map");
  return row ? (row.data as unknown as KnowledgeMap) : null;
}
