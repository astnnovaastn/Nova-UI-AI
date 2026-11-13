/**
 * Turns an AEGIS research report into the plain run facts Zephium's board is drawn from.
 * Everything here comes from the report the backend returned. Nothing is invented: when
 * the backend has not said something, the fact is left out.
 */
import type {
  WorkArtifactDataV1,
  WorkArtifactV1,
  WorkEnvironmentElement,
  WorkEnvironmentSnapshot,
  WorkExecutionFact,
  WorkPageV1,
  WorkRuntimeProjection,
  WorkSignalV1,
  WorkStepFact,
} from "$shared/ipc/bindings";
import { organizeExecution } from "$features/work/lib/organize";
import type { TrailLine } from "$features/work/lib/board/trail";
import { followupSections, type PaperData } from "./paper";
import { citationSections, traceLines, tracePhase, traceQueries, traceSources, type TraceEvent } from "./research-trace";
import type { SitePreview } from "./preview-provider";

export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  content?: string;
  retrieved_at?: string;
  favicon?: string;
  attachment_id?: string;
};
export type ResearchImage = {
  id: string;
  caption?: string;
  source_id?: string;
  publication?: string;
  placement_text?: string;
  content_hash?: string;
};
export type ResearchVideo = {
  id?: string;
  video_id?: string;
  title?: string;
  url: string;
  channel?: string;
  thumbnail?: string;
  provider?: string;
  published_at?: string;
};
export type ResearchReport = {
  research_id: string;
  research_revision?: string;
  kind?: string;
  query: string;
  display_title?: string;
  report?: string;
  phase?: string;
  completeness?: string;
  waiting_reason?: string;
  sources?: ResearchSource[];
  linked_sources?: ResearchSource[];
  image_sources?: ResearchSource[];
  evidence_collection?: boolean;
  legacy_evidence?: boolean;
  image_items?: ResearchImage[];
  /** Videos the backend's video search found, or the report itself links (see artifacts.media). */
  media?: ResearchVideo[];
  media_status?: string;
  media_failures?: { reason?: string }[];
  mode?: string;
  failures?: { reason?: string }[];
  extensions?: { blocks?: { id: string; text: string; section_id?: string; section_title?: string }[]; report?: string };
  extension_activity?: { phase?: string; reason?: string; collected_sources?: number };
};

const PROFILE = "01J8Z7V6Q5N4M3K2H1G0F9E8D7";
const LIMITS = { model_tokens: 0, cost_micro_usd: 0, operations: 64, timeout_seconds: 0, max_workers: 4 };
/** Lanes on the canvas; every source stays reachable through the source list and Sources. */
const MAX_LANES = 6;

/** What a source window can say about its page. */
export type SourceInfo = {
  url: string;
  title: string;
  favicon?: string;
  excerpt: string;
  retrieved_at: string;
  citations: { section: string; count: number }[];
  /** The saved copy can be read in the existing source view. */
  evidence: boolean;
};

export type RunState = "running" | "waiting" | "completed" | "failed" | "cancelled";

const RUNNING = new Set(["queued", "collecting_sources", "comparing_evidence", "preparing_report", "preparing_images", "preparing_layout", "extending"]);
const WAITING = new Set(["waiting_for_quota", "waiting_for_report", "waiting_for_retry"]);

const live0 = (state: RunState) => state === "running" || state === "waiting";

/** What the backend's recorded phase means for the run. */
export function runState(report: ResearchReport): RunState {
  const phase = report.phase ?? "";
  // The backend records a stopped run as failed, with the reason research_canceled.
  if (phase === "failed") return /cancel/.test(report.waiting_reason ?? "") ? "cancelled" : "failed";
  if (phase === "cancelled" || phase === "canceled") return "cancelled";
  if (WAITING.has(phase)) return "waiting";
  if (RUNNING.has(phase)) return "running";
  if (report.completeness === "pending") return "running";
  return "completed";
}

/** The activity word the real pill shows, taken from the recorded phase. */
export function activityFor(phase: string | undefined): WorkSignalV1["activity"] | undefined {
  switch (phase) {
    case "queued":
      return "planning";
    case "collecting_sources":
    case "extending":
      return "searching";
    case "comparing_evidence":
      return "comparing";
    case "preparing_report":
    case "preparing_images":
    case "preparing_layout":
      return "producing_artifact";
    case "waiting_for_quota":
    case "waiting_for_report":
    case "waiting_for_retry":
      return "paused";
    default:
      return undefined;
  }
}

export function plainExcerpt(text: string | undefined, limit = 220): string {
  if (!text) return "";
  const clean = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // A link cut off by the end of a saved excerpt.
    .replace(/\[([^\]]*)\]\([^)]*$/, "$1")
    .replace(/^[#>*\-\s|]+/gm, "")
    .replace(/[*_`|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= limit) return clean;
  return clean.slice(0, limit).replace(/\s+\S*$/, "") + "…";
}

/** The report's own heading has the full name; the saved display title may be cut short. */
export function reportTitle(report: ResearchReport): string {
  const heading = report.report?.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim();
  const saved = report.display_title || report.query;
  return heading && heading.toLowerCase().startsWith(saved.slice(0, 20).toLowerCase()) ? heading : saved;
}

type Citation = { url: string; title: string };

function artifact(execution: string, id: string, title: string, data: WorkArtifactDataV1, evidence: number[] = []): WorkArtifactV1 {
  return {
    version: 1,
    id,
    execution,
    node: "agent",
    attempt: "attempt",
    output: title,
    title,
    data,
    evidence: evidence.map((source_id) => ({ extraction_id: `${execution}-search`, source_id })),
    review: "mechanical",
    presentation: "automatic",
  } as WorkArtifactV1;
}

function execution(
  id: string,
  request: string,
  status: WorkExecutionFact["status"],
  steps: WorkStepFact[],
  artifacts: WorkArtifactV1[],
  citations: Citation[],
  live: boolean,
): WorkExecutionFact {
  return {
    id,
    approved_revision: "1",
    status,
    attempts: live ? [{ id: "attempt", node: "agent", status: "running" }] : [],
    spec: {
      plan_revision: "1",
      request,
      limits: LIMITS,
      nodes: [{ node: "agent", parent: null, capability: { kind: "agent" }, limits: LIMITS }],
    },
    artifacts,
    provider_evidence: citations.length
      ? [
          {
            id: `${id}-search`,
            node: "agent",
            attempt: "attempt",
            evidence: {
              version: 1,
              provider: "aegis",
              model: "aegis",
              response_model: "aegis",
              response_id: id,
              search_call_id: id,
              answer: "",
              citations: citations.map((cite) => ({ ...cite, start_index: 0, end_index: 1 })),
              actual_input_tokens: 0,
              actual_output_tokens: 0,
            },
          },
        ]
      : [],
    user_artifacts: [],
    steps,
  } as unknown as WorkExecutionFact;
}

function statusOf(state: RunState): WorkExecutionFact["status"] {
  return state === "running" || state === "waiting" ? "running" : state;
}

export type CanvasScene = {
  name: string;
  snapshot: WorkEnvironmentSnapshot;
  objectives: Map<string, WorkRuntimeProjection>;
  pages: WorkPageV1[];
  /** Finished writing, each set as a paper on the canvas. */
  papers: PaperData[];
  /** What the run has reported so far, while it goes. */
  steps: TrailLine[];
  /** By address, for the source windows. */
  sourceInfo: Map<string, SourceInfo>;
  previews: Map<string, SitePreview>;
  /** Read step to report image id, for the page cards. */
  frameIds: Map<string, string>;
  state: RunState;
  signals: WorkSignalV1[];
  profile: string;
};

const STEP_WORDS: [string, string, TrailLine["icon"]][] = [
  ["collecting_sources", "Searching the web", "search"],
  ["comparing_evidence", "Comparing the evidence", "knowledge"],
  ["preparing_report", "Writing the report", "file"],
  ["preparing_images", "Preparing images", "page"],
  ["preparing_layout", "Laying out the report", "file"],
];

/**
 * The run so far, from what the backend recorded: its phases run in this order, so a later
 * phase means the earlier ones ended. A wait can come from any phase, so it claims none of them.
 */
export function researchSteps(report: ResearchReport, state: RunState, sourceCount: number, reason: string): TrailLine[] {
  if (state === "completed" || state === "cancelled") return [];
  const found: TrailLine | null = sourceCount
    ? { key: "found", icon: "search", text: `Found ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}` }
    : null;
  if (state === "failed" || state === "waiting") {
    return [
      ...(found ? [found] : []),
      { key: "state", icon: state === "failed" ? "stopped" : "time", text: reason || (state === "failed" ? "The run stopped" : "Waiting to continue") },
    ];
  }
  const at = STEP_WORDS.findIndex(([phase]) => phase === report.phase);
  if (at < 0) return [{ key: "queued", icon: "live", text: "Getting started", live: true }];
  const lines: TrailLine[] = [];
  STEP_WORDS.slice(0, at + 1).forEach(([phase, text, icon], index) => {
    lines.push(index === at ? { key: phase, icon: "live", text, live: true } : { key: phase, icon, text });
    if (phase === "collecting_sources" && index < at && found) lines.push(found);
  });
  return lines;
}

/**
 * What Zephium's own run layout needs from a Work run: one part per helper (each model at its purpose)
 * with when it worked, so overlapping work stands in one column, and what the run drew on.
 */
export type ZephiumRun = {
  plan?: { mode?: string; workflow?: string };
  assignments?: { agent: string; role: string; task?: string; state?: string; model?: string }[];
  results?: Record<string, { summary?: string; state?: string } | unknown>;
  usage?: { parts?: Record<string, { title: string; helper: string; began: number; ended: number; calls: number; tokens: number; searches: number; model: string }> };
  evidence?: unknown[];
  state?: string;
};

const PART_ROLE: Record<string, string> = { worker_a: "discovery", worker_b: "analysis", worker_c: "verification", worker_d: "analysis", worker_e: "synthesis" };
const PART_GOALS: Record<string, string> = {
  worker_a: "Search and screen the sources",
  worker_b: "Extract and compare the findings",
  worker_c: "Check the claims against the sources",
  worker_d: "Analyse the other half of the sources",
  worker_e: "Write the report's sections",
};

/** The run's parts, oldest first, as Zephium records them. The lead is the run itself, not a part. */
export function zephiumParts(run: ZephiumRun, live: boolean, sourceCount: number) {
  const parts = Object.entries(run.usage?.parts ?? {}).filter(([slot]) => slot !== "lead");
  const assigned = run.assignments ?? [];
  // Assigned workers that have not called a model yet still stand, planned or running.
  for (const row of assigned) if (!parts.some(([slot]) => slot === row.agent)) parts.push([row.agent, { title: row.role, helper: "research", began: 0, ended: 0, calls: 0, tokens: 0, searches: 0, model: row.model ?? "" }]);
  parts.sort((a, b) => (a[1].began || Infinity) - (b[1].began || Infinity));
  return parts.map(([slot, row]) => {
    const assignment = assigned.find((entry) => entry.agent === slot);
    const result = (run.results ?? {})[PART_ROLE[slot] ?? ""] as { summary?: string; state?: string } | undefined;
    const settled = !live || (assignment?.state && ["done", "failed", "skipped"].includes(assignment.state));
    const state = !row.began ? (live ? "planned" : assignment?.state === "failed" ? "failed" : "done") : assignment?.state === "failed" || result?.state === "failed" ? "failed" : settled ? "done" : "running";
    const summary =
      slot === "worker_a" ? `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}` : row.calls ? `${row.calls} ${row.calls === 1 ? "call" : "calls"} · ${row.model.split(":").pop()}` : "";
    return {
      id: `part-${slot}`,
      title: row.title.charAt(0).toUpperCase() + row.title.slice(1),
      helper: "research" as const,
      goal: assignment?.task || PART_GOALS[slot] || row.title,
      state,
      ...(row.began ? { started_ms: String(Math.round(row.began * 1000)) } : {}),
      ...(row.ended && state !== "running" ? { ended_ms: String(Math.round(row.ended * 1000)) } : {}),
      ...(summary ? { summary } : {}),
    };
  });
}

export function buildScene(report: ResearchReport, reason = "", trace: readonly TraceEvent[] = [], waitWords: (reason: string) => string = () => "", zephium: ZephiumRun | null = null): CanvasScene {
  const name = report.research_id;
  const state = runState(report);
  // Sources the report holds, or while it is being written, those the backend has reported finding.
  const traced = traceSources(trace);
  const saved = (report.sources ?? []).filter((source) => /^https?:\/\//i.test(source.url));
  const sources: ResearchSource[] = saved.length
    ? saved
    : state === "completed"
      ? []
      : traced.map((source, index) => ({ id: `T${index + 1}`, title: source.title, url: source.url, content: source.content, retrieved_at: source.retrieved_at }));
  const tracedByUrl = new Map(traced.map((source) => [source.url, source]));
  const queries = traceQueries(trace);
  const phaseNow = live0(state) ? (tracePhase(trace) ?? report.phase) : report.phase;
  const images = report.image_items ?? [];
  const live = state === "running" || state === "waiting";
  const runId = `run-${name.slice(0, 24)}`;
  const citations = sources.map((source) => ({ url: source.url, title: source.title }));

  // Sources with a saved image come first, so the lanes show them when there are many.
  const hostOf = (value: string | undefined) => {
    try {
      return new URL(value ?? "").hostname.replace(/^www\./, "");
    } catch {
      return (value ?? "").replace(/^www\./, "");
    }
  };
  const imageFor = new Map<string, ResearchImage>();
  const usedImages = new Set<string>();
  for (const source of sources) {
    const image = images.find((entry) => entry.source_id === source.id && !usedImages.has(entry.id));
    if (image) {
      imageFor.set(source.id, image);
      usedImages.add(image.id);
    }
  }
  for (const source of sources) {
    if (imageFor.has(source.id)) continue;
    const image = images.find((entry) => !usedImages.has(entry.id) && entry.publication && hostOf(entry.publication) === hostOf(source.url));
    if (image) {
      imageFor.set(source.id, image);
      usedImages.add(image.id);
    }
  }
  const lanes = [...sources].sort((a, b) => Number(imageFor.has(b.id)) - Number(imageFor.has(a.id))).slice(0, MAX_LANES);

  const steps: WorkStepFact[] = [];
  const searching = live && phaseNow === "collecting_sources" && !sources.length;
  (queries.length ? queries : [{ query: report.query, status: searching ? "running" : state === "failed" && !sources.length ? "failed" : "done", reason: "" }]).forEach((search, index) => {
    steps.push({
      id: `${runId}-search-${index}`,
      turn: 1,
      kind: { kind: "search", query: search.query },
      ...(zephium ? { part: "part-worker_a" } : {}),
      status: search.status === "running" && live ? "running" : search.status === "failed" ? "failed" : "succeeded",
      ...(sources.length && index === 0 ? { artifacts: [`${runId}-sources`], evidence: `${runId}-search` } : {}),
      ...(search.reason ? { note: search.reason.replace(/_/g, " ") } : report.failures?.length && index === 0 ? { note: report.failures.map((f) => String(f.reason ?? "").replace(/_/g, " ")).join(" · ") } : {}),
    } as unknown as WorkStepFact);
  });

  const previews = new Map<string, SitePreview>();
  const frameIds = new Map<string, string>();
  for (const source of sources) {
    previews.set(source.url, {
      title: source.title,
      ...(plainExcerpt(source.content) ? { excerpt: plainExcerpt(source.content) } : {}),
      ...(source.favicon?.startsWith("https://") ? { favicon: source.favicon } : {}),
    });
  }
  lanes.forEach((source, index) => {
    const step = `${runId}-read-${index}`;
    steps.push({
      id: step,
      turn: 2,
      kind: { kind: "read", url: source.url },
      ...(zephium ? { part: "part-worker_a" } : {}),
      status: tracedByUrl.get(source.url)?.state === "failed" ? "failed" : tracedByUrl.get(source.url)?.state === "reading" && live ? "running" : "succeeded",
      ...(tracedByUrl.get(source.url)?.state === "failed" ? { note: "This page couldn't be opened" } : {}),
      local: { page_title: source.title },
    } as unknown as WorkStepFact);
    const image = imageFor.get(source.id);
    if (image) frameIds.set(step, image.id);
  });

  const artifacts: WorkArtifactV1[] = [];
  if (sources.length)
    artifacts.push(
      artifact(
        runId,
        `${runId}-sources`,
        "Sources",
        {
          kind: "evidence_collection",
          summary: "",
          entries: sources.map((source, index) => ({ evidence: index, title: source.title, role: "source" })),
        } as unknown as WorkArtifactDataV1,
        sources.map((_, index) => index + 1),
      ),
    );
  if (!live)
    steps.push({ id: `${runId}-publish`, turn: 3, kind: { kind: "publish" }, status: state === "failed" ? "failed" : "succeeded" } as unknown as WorkStepFact, {
      id: `${runId}-finish`,
      turn: 4,
      kind: { kind: "finish" },
      status: state === "failed" ? "failed" : "succeeded",
    } as unknown as WorkStepFact);

  const runs = [execution(runId, report.query, statusOf(state), steps, artifacts, citations, live)];
  if (zephium) {
    // Zephium's own structure: the run's parts in rows by time, and what it drew on left of the request.
    const first = runs[0] as unknown as { parts: unknown[]; inputs: unknown[] };
    first.parts = zephiumParts(zephium, live, sources.length);
    const flow = zephium.plan?.workflow || (zephium.plan?.mode === "deep" ? "Deep Research" : zephium.plan?.mode === "quick" ? "Quick Research" : "Research");
    first.inputs = [
      { kind: "skill", label: flow, reference: (zephium.plan?.mode ?? "research").toLowerCase() },
      ...(Object.keys(zephium.usage?.parts ?? {}).length ? [{ kind: "connection", label: `${new Set(Object.values(zephium.usage?.parts ?? {}).map((row) => row.model).filter(Boolean)).size} AI models` }] : []),
    ];
  }

  const allSources = [...(report.sources ?? []), ...(report.linked_sources ?? []), ...(report.image_sources ?? [])];
  const papers: PaperData[] = [];
  if (state === "completed" && report.report?.trim())
    papers.push({
      id: `${name}-paper`,
      run: runId,
      researchId: name,
      title: reportTitle(report),
      markdown: report.report,
      label: report.evidence_collection || report.legacy_evidence ? "Saved evidence" : report.completeness === "partial" ? "Partial report" : "Research report",
      ...(report.completeness === "partial" && report.failures?.length
        ? { note: `Partial result: ${report.failures.map((failure) => String(failure.reason ?? "").replace(/_/g, " ")).join(" · ")}` }
        : {}),
      sources: allSources,
      images,
    });

  // Follow-up research sections are later runs on the same canvas, one per section, each with its paper.
  for (const section of followupSections(report.extensions?.blocks ?? [])) {
    const id = `run-x-${section.id}`.slice(0, 60);
    runs.push(
      execution(
        id,
        section.title,
        "completed",
        [
          { id: `${id}-publish`, turn: 1, kind: { kind: "publish" }, status: "succeeded" } as unknown as WorkStepFact,
          { id: `${id}-finish`, turn: 2, kind: { kind: "finish" }, status: "succeeded" } as unknown as WorkStepFact,
        ],
        [],
        [],
        false,
      ),
    );
    papers.push({
      id: `${id}-paper`,
      run: id,
      researchId: name,
      title: section.title,
      markdown: section.text,
      label: "Follow-up research",
      sources: allSources,
      images: [],
    });
  }

  const workId = `${name}-work`;
  const owner = "aegis";
  const projection = {
    version: 1,
    interrupted: [],
    executions: runs,
    owners: live ? [{ execution: runId, owner }] : [],
    work: {
      schema_version: 2,
      profile: PROFILE,
      id: workId,
      revision: "1",
      lifecycle: "active",
      objective: report.query,
      objective_revision: "1",
      context_revision: "1",
      objective_author: "user",
      questions: [],
      status: "plan_ready",
      plan: null,
    },
  } as unknown as WorkRuntimeProjection;

  const elements: WorkEnvironmentElement[] = [
    { id: `${name}-request`, area: null, reference: { kind: "objective", objective: workId } } as unknown as WorkEnvironmentElement,
  ];
  let snapshot = {
    version: 1,
    profile: PROFILE,
    id: `${name}-canvas`,
    space: "research",
    title: report.display_title || report.query,
    revision: "1",
    lifecycle: "active",
    areas: [],
    view: { revision: "1", x: 0, y: 0, zoom_milli: 1000, placements: [] },
    elements,
  } as unknown as WorkEnvironmentSnapshot;
  let count = 0;
  for (const run of runs) {
    const plan = organizeExecution(projection, run, { x: 0, y: 0 }, snapshot);
    for (const add of plan.adds) elements.push({ id: `${name}-${count++}`, area: null, reference: add.reference } as unknown as WorkEnvironmentElement);
    snapshot = { ...snapshot, elements: [...elements] } as WorkEnvironmentSnapshot;
  }

  const pages: WorkPageV1[] = [...frameIds.keys()].map(
    (step) =>
      ({
        execution: runId,
        attempt: "attempt",
        step,
        url: (steps.find((entry) => entry.id === step)?.kind as { url: string }).url,
        live: false,
        frame: { generation: 1, width: 1280, height: 800 },
      }) as WorkPageV1,
  );

  const activity = activityFor(phaseNow);
  const sourceInfo = new Map<string, SourceInfo>();
  const reportText = [report.report ?? "", ...(report.extensions?.blocks ?? []).map((block) => block.text)].join("\n\n");
  for (const source of [...sources, ...allSources]) {
    if (sourceInfo.has(source.url)) continue;
    sourceInfo.set(source.url, {
      url: source.url,
      title: source.title,
      favicon: source.favicon,
      excerpt: plainExcerpt(source.content, 420),
      retrieved_at: source.retrieved_at ?? "",
      citations: citationSections(reportText, saved.includes(source) || allSources.includes(source) ? source.id : undefined),
      evidence: saved.length > 0 && allSources.includes(source),
    });
  }
  const signals: WorkSignalV1[] =
    live && activity
      ? [
          {
            version: 1,
            profile: PROFILE,
            work: workId,
            execution: runId,
            attempt: "attempt",
            node: "agent",
            owner,
            basis_revision: "1",
            activity,
          } as unknown as WorkSignalV1,
        ]
      : [];

  return {
    name,
    snapshot,
    objectives: new Map([[workId, projection]]),
    pages,
    papers,
    steps: trace.length ? traceLines(trace, live, waitWords) : researchSteps(report, state, sources.length, reason),
    sourceInfo,
    previews,
    frameIds,
    state,
    signals,
    profile: PROFILE,
  };
}
