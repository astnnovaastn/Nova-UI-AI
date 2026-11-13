/**
 * The one planning and activity card of a research: the AI PLAN (what the AEGIS lead set out to do,
 * its strategy and the agents it assigned) above the run's existing activity timeline (the same
 * lines the research always recorded). There is no second plan card and no second timeline.
 * Everything is from the run's record: a field the run did not record is left out.
 */
import type { TrailLine } from "$features/work/lib/board/trail";

export type PlanCardData = {
  researchId: string;
  /** "AI PLAN" for a planned Work run; "Research activity" for research made without a plan. */
  heading: string;
  objective: string;
  mode: string;
  skill: { title: string; version: string } | null;
  strategy: string;
  agents: { role: string; model: string; state: string }[];
  /** The activity timeline, as the research recorded it. */
  trail: TrailLine[];
  live: boolean;
};

type PlanRun = {
  state?: string;
  plan?: { intent?: string; acknowledgement?: string; title?: string; mode?: string; reasoning_summary?: string; skill?: { title?: string; name?: string; version?: string } };
  assignments?: { role: string; model: string; state: string }[];
  request?: { query?: string };
};

const MODES: Record<string, string> = { deep: "Deep Research", quick: "Quick Research", structured: "Structured", direct: "Direct answer" };
const ROLES: Record<string, string> = { discovery: "Discovery", analysis: "Analysis", verification: "Verification", synthesis: "Writer" };

export function planCard(researchId: string, run: PlanRun | null | undefined, trail: readonly TrailLine[], live: boolean, request = ""): PlanCardData | null {
  const plan = run?.plan;
  const planned = !!(plan && (plan.intent || plan.acknowledgement || plan.title));
  if (!planned && !trail.length) return null;
  return {
    researchId,
    heading: planned ? "AI PLAN" : "Research activity",
    objective: ((planned ? plan!.intent || plan!.acknowledgement || plan!.title : "") || run?.request?.query || request || "").slice(0, 400),
    mode: planned ? (MODES[plan!.mode ?? ""] ?? plan!.mode ?? "") : "",
    skill: plan?.skill?.name ? { title: plan.skill.title || plan.skill.name, version: plan.skill.version ?? "" } : null,
    strategy: (plan?.reasoning_summary ?? "").slice(0, 400),
    agents: (run?.assignments ?? []).map((row) => ({ role: ROLES[row.role] ?? row.role, model: row.model.split("/").pop() ?? row.model, state: row.state })),
    trail: [...trail],
    live,
  };
}

/** The timeline's own height: its rows and padding, allowing long lines and details to wrap. */
export const trailHeight = (lines: readonly { text: string; detail?: string }[]) =>
  24 + lines.reduce((sum, line) => sum + 6 + 20 * Math.ceil(Math.max(1, line.text.length) / 40) + (line.detail ? 18 * Math.ceil(line.detail.length / 48) : 0), 0);

/** The card's size from what it holds: tall, as the plan and the activity the run follows. */
export function planCardSize(data: PlanCardData): { width: number; height: number } {
  const lines = (text: string, per: number) => (text ? Math.ceil(text.length / per) : 0);
  const head = 50 + lines(data.objective, 44) * 19 + (data.objective ? 12 : 0);
  const strategy = data.strategy || data.skill ? 34 + lines(data.strategy, 46) * 17 + (data.skill ? 20 : 0) + 12 : 0;
  const agents = data.agents.length ? 24 + data.agents.length * 21 + 12 : 0;
  const activity = data.trail.length ? 26 + trailHeight(data.trail) : 0;
  return { width: 340, height: Math.ceil((head + strategy + agents + activity + 18) / 8) * 8 };
}
