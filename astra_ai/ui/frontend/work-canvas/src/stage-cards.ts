/**
 * The two containers of the lower track and the convergence, from what the run recorded:
 *
 *   Evidence processing pipeline: source processing → deduplication → evidence ranking →
 *   citation builder → saved to the library, left to right;
 *   Collect all results: what was gathered (findings, images, videos) and the final compilation.
 *
 * A module appears only when the run recorded that work (a stage event with its own numbers), so a
 * Quick run shows fewer modules than a Deep one and nothing is drawn for work that did not happen.
 */
import type { TraceEvent } from "./research-trace";

export const PIPELINE_ID = "pipeline:evidence";
export const COMPILE_ID = "compile:results";

export type StageModule = { key: string; title: string; facts: string[]; state: "done" | "running" | "failed" };
export type StageCardData = { kind: "pipeline" | "compile"; title: string; modules: StageModule[] };

type Stage = TraceEvent & { stage?: string; count?: number };
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const stateOf = (event: Stage): StageModule["state"] => (event.status === "running" ? "running" : event.status === "failed" ? "failed" : "done");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

/** The last event of a stage, which says how it ended. */
function last(trace: readonly TraceEvent[], stage: string): Stage | undefined {
  for (let i = trace.length - 1; i >= 0; i--) {
    const event = trace[i] as Stage;
    if (event.kind === "stage" && event.stage === stage) return event;
  }
  return undefined;
}

export function evidencePipeline(trace: readonly TraceEvent[], run: { state?: string } | null | undefined): StageCardData | null {
  const modules: StageModule[] = [];
  const evidence = last(trace, "evidence");
  if (evidence)
    modules.push({
      key: "processing",
      title: "Source processing",
      facts: [`${plural(num(evidence.count), "page")} fetched and cleaned`, ...(num(evidence.domains) ? [`from ${plural(num(evidence.domains), "site")}`] : [])],
      state: stateOf(evidence),
    });
  const discovered = last(trace, "discovered");
  if (discovered && discovered.duplicates !== undefined)
    modules.push({ key: "dedup", title: "Deduplication", facts: [`${plural(num(discovered.duplicates), "duplicate")} removed`, `${plural(num(discovered.count), "unique source")}`], state: stateOf(discovered) });
  const assessed = last(trace, "assessed");
  if (assessed)
    modules.push({
      key: "ranking",
      title: "Evidence ranking",
      facts: assessed.status === "failed" ? ["Could not rank; search order kept"] : [`${num(assessed.kept)} kept for relevance and credibility`, `${num(assessed.rejected)} set aside`],
      state: stateOf(assessed),
    });
  const citations = last(trace, "citations");
  if (citations)
    modules.push({
      key: "citations",
      title: "Citation builder",
      facts: citations.status === "running" ? ["Fixing the citations"] : [`${num(citations.cited)} of ${plural(num(citations.sources), "source")} cited`, ...(num(citations.removed) ? [`${plural(num(citations.removed), "unsupported citation")} removed`] : [])],
      state: stateOf(citations),
    });
  if (run?.state === "completed" || run?.state === "partial")
    modules.push({ key: "library", title: "Knowledge update", facts: ["Report and evidence saved to your Research library"], state: "done" });
  return modules.length ? { kind: "pipeline", title: "Evidence processing pipeline", modules } : null;
}

export function collectResults(
  trace: readonly TraceEvent[],
  run: { state?: string } | null | undefined,
  media: { images: number; videos: number },
): StageCardData | null {
  const analysis = last(trace, "analysis");
  const verified = last(trace, "verified");
  const quality = last(trace, "quality");
  const writing = last(trace, "writing") ?? last(trace, "drafting");
  const done = run?.state === "completed" || run?.state === "partial";
  if (!writing && !quality && !done) return null;
  const gathered: string[] = [];
  if (analysis && analysis.status !== "running" && num(analysis.count)) gathered.push(plural(num(analysis.count), "finding"));
  if (verified) gathered.push(`${num(verified.supported)} claims supported${num(verified.contested) ? `, ${num(verified.contested)} contested` : ""}`);
  if (media.images) gathered.push(plural(media.images, "image"));
  if (media.videos) gathered.push(plural(media.videos, "video"));
  const modules: StageModule[] = [];
  if (gathered.length) modules.push({ key: "collected", title: "Collected results and media", facts: gathered, state: "done" });
  modules.push({
    key: "compile",
    title: "Final compilation",
    facts: quality
      ? [`${num(quality.sections_written)} of ${plural(num(quality.sections_planned), "section")} written`, `${num(quality.words).toLocaleString("en")} words`, ...(done ? ["Published to the Reader"] : [])]
      : [done ? "Published to the Reader" : "Writing the report"],
    state: done ? "done" : "running",
  });
  return { kind: "compile", title: "Collect all results", modules };
}

/** The card's size: a pipeline's modules stand in a row; the results modules one above the other. */
export function stageCardSize(data: StageCardData): { width: number; height: number } {
  if (data.kind === "pipeline") return { width: 28 + data.modules.length * 196 + (data.modules.length - 1) * 22, height: 176 };
  return { width: 280, height: 56 + data.modules.reduce((sum, module) => sum + 46 + module.facts.length * 19, 0) + (data.modules.length - 1) * 12 + 14 };
}
