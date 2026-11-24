import {
  work_line_comparing, work_line_paused, work_line_searching, work_line_thinking, work_line_writing,
} from "$shared/i18n/messages";
import type { IslandPhase } from "./QuestionIsland.svelte";
import { activityFor } from "./research-to-run";
import { wordsForWait } from "./waiting.svelte";

export type IslandTraceEvent = {
  seq: number;
  kind: string;
  phase?: string;
  status?: string;
  [field: string]: unknown;
};

export type ResearchIslandInput = {
  run?: { state: string } | null;
  report?: { phase?: string; waiting_reason?: string } | null;
  /** Full ordered trace scoped to the selected run. */
  trace?: readonly IslandTraceEvent[];
  /** Last existing trace sequence captured before a retry, when known. */
  afterSeq?: number;
  /** The host's current run is active (also supports older reports without a WorkRun). */
  active?: boolean;
  /** Set during the current run's terminal notice. Leave off when reopening history. */
  showOutcome?: boolean;
  questionPending?: boolean;
  answer?: "sending" | "received";
  voiceState?: string;
  microphoneOn?: boolean;
  /** A current, actionable review the host has chosen to surface. */
  approvalPending?: boolean;
};

type Display = { phase: IslandPhase; label?: string; detail?: string };

const stageActivity = new Map<string, IslandPhase>([
  ["intent", "planning"],
  ["searching", "searching"],
  ["analysis", "analyzing"],
  ["map", "mapping"],
  ["verifying", "verifying"],
  ["gaps", "filling-gaps"],
  ["writing", "writing"],
  ["drafting", "writing"],
  ["citations", "citations"],
  ["image", "creating-image"],
  ["repository", "reading-repo"],
  ["accounts", "reading-accounts"],
  ["browse", "gathering"],
  ["sandbox", "testing"],
  ["draft", "checking-draft"],
  ["compose", "composing"],
]);

const reportActivity = new Map<string, IslandPhase>([
  ["queued", "queued"],
  ["collecting_sources", "gathering"],
  ["comparing_evidence", "analyzing"],
  ["preparing_report", "writing"],
  ["writing", "writing"],
  ["preparing_images", "finding-images"],
  ["preparing_layout", "publishing"],
  ["extending", "filling-gaps"],
]);

// Reuse the phase signals and public wording that drove the previous Work headline.
const reportLabels: Partial<Record<NonNullable<ReturnType<typeof activityFor>>, () => string>> = {
  planning: work_line_thinking,
  searching: work_line_searching,
  comparing: work_line_comparing,
  producing_artifact: work_line_writing,
};

function reportedActivity(phase: string): Display | undefined {
  const visual = reportActivity.get(phase);
  if (!visual) return undefined;
  const activity = activityFor(phase);
  return { phase: visual, label: activity ? reportLabels[activity]?.() : undefined };
}

function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function stageDetail(event: IslandTraceEvent): string | undefined {
  if (event.stage === "drafting" && nonnegative(event.done) && nonnegative(event.total) && event.total > 0 && event.done <= event.total) {
    return event.done + " of " + event.total + " sections drafted";
  }
  if (event.stage === "verifying" && nonnegative(event.count) && event.count > 0) {
    return event.count + (event.count === 1 ? " claim to check" : " claims to check");
  }
  if (event.stage === "draft" && event.which === "before") return "Original copy";
  if (event.stage === "draft" && event.which === "after") return "Proposed patch";
}

function waitDisplay(phase: string, reason: string): Display {
  const label = wordsForWait(reason) || work_line_paused();
  if (reason === "groq_private_consent_required") return { phase: "awaiting-approval", label };
  if (reason === "work_continuing") return { phase: "queued", label };
  if (/^(work_provider_unavailable|gemini_service_unavailable|groq_service_unavailable|openai_service_unavailable)$/.test(reason)) return { phase: "waiting", label };
  if (phase === "waiting_for_quota" || /^(work_daily_limit|work_rate_limited|search_provider_quota|provider_quota|background_quota_paused)$/.test(reason)) {
    return { phase: "waiting-capacity", label };
  }
  return { phase: "waiting", label };
}

function projectTrace(trace: readonly IslandTraceEvent[], afterSeq: number): {
  activity?: Display;
  phase: string;
  reason: string;
} {
  let phase = "";
  let reason = "";
  let stage: Display | undefined;
  let stageId: unknown;
  let task: Display | undefined;
  let imageLookup = false;
  const searches = new Set<string | number>();
  const reads = new Set<string>();

  for (const event of trace) {
    if (event.seq <= afterSeq) continue;
    if (event.status === "running" && /^waiting_for_(quota|report|retry)$/.test(phase)) {
      phase = "";
      reason = "";
    }
    if (event.kind === "phase") {
      phase = event.phase ?? "";
      reason = "";
      searches.clear();
      reads.clear();
      imageLookup = false;
      // Image work emits its stage immediately before this coarse phase.
      if (stageId !== "image" || phase !== "writing") stage = undefined;
      if (phase === "preparing_layout" || phase === "complete" || phase === "failed") task = undefined;
    } else if (event.kind === "waiting") {
      reason = typeof event.reason === "string" ? event.reason : "";
    } else if (event.kind === "task") {
      stage = undefined;
      task = undefined;
      searches.clear();
      reads.clear();
      imageLookup = false;
      if (event.status === "running") {
        if (event.task_id === "write") task = { phase: "writing" };
        if (event.task_id === "publish") task = { phase: "publishing" };
      }
    } else if (event.kind === "stage") {
      stageId = event.stage;
      const match = typeof stageId === "string" ? stageActivity.get(stageId) : undefined;
      stage = match && event.status === "running" ? { phase: match, detail: stageDetail(event) } : undefined;
      if (stageId === "discovered" || stageId === "evidence" || stageId === "finished") searches.clear();
      if (stageId === "evidence" || stageId === "finished") reads.clear();
    } else if (event.kind === "repository_file" && event.status === "running"
      && stage?.phase === "reading-repo" && typeof event.path === "string") {
      const name = event.path.split(/[\\/]/).at(-1)?.trim();
      if (name && name !== "." && name !== "..") stage = { phase: "reading-repo", detail: name };
    } else if (event.kind === "search") {
      const key = typeof event.number === "number" ? event.number : event.query;
      if (typeof key === "number" || typeof key === "string") {
        if (event.status === "running") searches.add(key);
        if (event.status === "done" || event.status === "failed") searches.delete(key);
      }
    } else if (event.kind === "read" && typeof event.url === "string") {
      if (event.status === "running") reads.add(event.url);
      if (event.status === "done" || event.status === "failed") reads.delete(event.url);
    } else if (event.kind === "images") {
      imageLookup = event.status === "running";
    }
  }

  let activity = stage ?? task;
  if (imageLookup) activity = { phase: "finding-images" };
  else if (reads.size > 0) activity = { phase: "reading" };
  else if (searches.size > 0 && stage?.phase !== "filling-gaps") activity = { phase: "searching" };
  return { activity, phase, reason };
}

/** Turn public Work events into one visual state. This function owns no timers or provider calls. */
export function projectResearchIsland({
  run, report, trace = [], afterSeq = 0, active = false, showOutcome = false, questionPending = false,
  answer, voiceState, microphoneOn = false, approvalPending = false,
}: ResearchIslandInput): Display {
  if (answer) return { phase: answer };
  if (voiceState === "speaking") return { phase: "speaking" };
  if (voiceState === "listening" && microphoneOn) return { phase: "listening" };
  if (questionPending) return { phase: "question" };


  const observed = projectTrace(trace, afterSeq);
  const phase = observed.phase || report?.phase || "";
  const reason = observed.reason || report?.waiting_reason || "";
  const state = run?.state;
  const cancelledReport = /^cancell?ed$/.test(phase) || (phase === "failed" && /^research_cancell?ed$/.test(reason));
  if (state === "queued") return { phase: "queued" };
  if (state === "cancelled" || state === "canceled" || (!state && cancelledReport)) {
    return { phase: showOutcome ? "stopped" : "idle" };
  }
  if (state === "failed" || (!state && phase === "failed")) return { phase: showOutcome ? "failed" : "idle" };
  if (approvalPending) return { phase: "awaiting-approval" };
  if (state === "partial") return { phase: showOutcome ? "partial" : "idle" };
  if (state === "completed" || (!state && phase === "complete")) return { phase: showOutcome ? "complete" : "idle" };
  if (state === "needs_input") return { phase: "waiting" };
  const waiting = /^waiting_for_(quota|report|retry)$/.test(phase);
  const recorded = reportedActivity(phase);
  const current = observed.activity ?? recorded;
  // The same analysis can have both a detailed trace stage and the established "Comparing" label.
  if (current?.phase === recorded?.phase && current && recorded?.label) {
    current.label = recorded.label;
  }
  // An unpublished scheduler pause can still have a recorded public activity.
  if (state === "waiting") return reason || waiting || !current ? waitDisplay(phase, reason) : current;
  if (state === "running" && observed.activity) return observed.activity;
  // A saved report may briefly lag behind the newly running Work attempt.
  if (waiting && (state !== "running" || observed.phase === phase)) return waitDisplay(phase, reason);
  if (state === "running" || (active && !state)) {
    return current ?? { phase: "working" };
  }
  return { phase: "idle" };
}
