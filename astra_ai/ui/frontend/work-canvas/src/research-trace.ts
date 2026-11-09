/**
 * The backend's record of a run, read for the canvas: what was searched, which sources came back,
 * and how far the writing got. Everything here restates an event the backend recorded; a stage
 * with no event is simply not shown. There is no model reasoning in these events.
 */
import type { TrailLine } from "$features/work/lib/board/trail";
import { stageLine } from "./work-run";

export type TraceEvent = {
  seq: number;
  at: number;
  kind: string;
  phase?: string;
  status?: string;
  [detail: string]: unknown;
};

export type TracedSource = {
  url: string;
  title: string;
  content: string;
  retrieved_at: string;
  state: "found" | "reading" | "read" | "failed";
};

export type TracedQuery = { query: string; status: "running" | "done" | "failed"; count?: number; reason?: string };

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Each source once, in the order the backend found it. Later events only update its state. */
export function traceSources(events: readonly TraceEvent[]): TracedSource[] {
  const found = new Map<string, TracedSource>();
  for (const event of events) {
    const url = text(event.url);
    if (!/^https?:\/\//i.test(url)) continue;
    if (event.kind === "source") {
      const known = found.get(url);
      found.set(url, {
        url,
        title: text(event.title) || known?.title || url,
        content: text(event.excerpt) || known?.content || "",
        retrieved_at: text(event.retrieved_at) || known?.retrieved_at || "",
        state: known?.state ?? "found",
      });
    } else if (event.kind === "read") {
      const known = found.get(url);
      const state = event.status === "failed" ? "failed" : event.status === "running" ? "reading" : "read";
      found.set(url, known ? { ...known, state } : { url, title: text(event.title) || url, content: "", retrieved_at: "", state });
    }
  }
  return [...found.values()];
}

/** Each search once, by its latest state. */
export function traceQueries(events: readonly TraceEvent[]): TracedQuery[] {
  const found = new Map<string, TracedQuery>();
  for (const event of events) {
    if (event.kind !== "search") continue;
    const query = text(event.query);
    if (!query) continue;
    found.set(query, {
      query,
      status: event.status === "failed" ? "failed" : event.status === "running" ? "running" : "done",
      ...(typeof event.count === "number" ? { count: event.count } : {}),
      ...(event.reason ? { reason: text(event.reason) } : {}),
    });
  }
  return [...found.values()];
}

/** The latest stage the run recorded as under way, if it is still under way. */
export function tracePhase(events: readonly TraceEvent[]): string | undefined {
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index]!;
    if (event.kind === "phase") return event.phase;
  }
  return undefined;
}

const WRITER_FAILED: Record<string, string> = {
  context_limit: "The evidence was too large for the backup writer",
  insufficient_depth: "The backup writer's report was too short to publish",
  output_limit: "The writer ran out of room before finishing",
  invalid_response: "The writer returned an unusable answer",
  incomplete_section: "A section came back incomplete",
  repair_limit: "The report still needed fixing after its repair attempts",
  attempt_limit: "The writer used all of its attempts",
};
const PHASE_WORDS: Record<string, [string, TrailLine["icon"]]> = {
  comparing_evidence: ["Comparing the evidence", "knowledge"],
  preparing_report: ["Writing the report", "file"],
  preparing_images: ["Preparing images", "page"],
  preparing_layout: ["Laying out the report", "file"],
};
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const WRITERS: Record<string, string> = { gemini: "Gemini", groq: "Groq", openai: "OpenAI" };
/** The trail stays readable on a long run; the full record stays on the backend. */
const MAX_LINES = 14;

export function traceLines(events: readonly TraceEvent[], live: boolean, waitWords: (reason: string) => string): TrailLine[] {
  if (!events.length) return [];
  const started = events[0]!.at;
  const after = (event: TraceEvent) => clock(Math.max(0, event.at - started));
  const lines: TrailLine[] = [];
  const queries = new Map<string, number>();
  const stages = new Map<string, number>();
  // A work run reports its own stages, which say more than the phases they pass through.
  const workRun = events.some((event) => event.kind === "stage");
  let sourcesAt = -1;
  let sources = 0;
  let savedAt = -1;
  let saved = 0;
  let readsAt = -1;
  let reads = 0;
  let unread = 0;
  let waits = 0;
  for (const event of events) {
    switch (event.kind) {
      case "search": {
        const query = text(event.query);
        const line: TrailLine = {
          key: `search-${query}`,
          icon: event.status === "failed" ? "stopped" : "search",
          text: event.status === "failed" ? `Search failed: ${query}` : typeof event.reused === "number" ? `Used saved research for: ${query}` : `Searched: ${query}`,
          ...(typeof event.count === "number" ? { detail: `${event.count} results · ${after(event)}` } : event.status === "failed" ? { detail: text(event.reason).replace(/_/g, " ") } : {}),
        };
        if (event.status === "running") line.icon = "live";
        const at = queries.get(query);
        if (at === undefined) {
          queries.set(query, lines.length);
          lines.push(line);
        } else lines[at] = line;
        break;
      }
      case "source":
        if (event.reused) {
          saved++;
          if (savedAt < 0) {
            savedAt = lines.length;
            lines.push({ key: "saved", icon: "page", text: "" });
          }
          break;
        }
        sources++;
        // A work run's Discovered stage already says how many it found.
        if (sourcesAt < 0 && !workRun) {
          sourcesAt = lines.length;
          lines.push({ key: "sources", icon: "page", text: "" });
        }
        break;
      case "read":
        if (event.status === "running") break;
        if (event.status === "failed") unread++;
        else reads++;
        if (readsAt < 0) {
          readsAt = lines.length;
          lines.push({ key: "reads", icon: "page", text: "" });
        }
        break;
      case "stage": {
        // A stage reports twice, starting and finished: the line keeps its place and updates.
        const line = stageLine(event, after(event));
        const at = stages.get(line.key);
        if (at === undefined) {
          stages.set(line.key, lines.length);
          lines.push(line);
        } else lines[at] = line;
        break;
      }
      case "phase": {
        const words = workRun ? undefined : PHASE_WORDS[event.phase ?? ""];
        if (words) lines.push({ key: `phase-${event.seq}`, icon: words[1], text: words[0], detail: after(event) });
        else if (event.phase === "complete") lines.push({ key: `phase-${event.seq}`, icon: "knowledge", text: "Report published", detail: after(event) });
        else if (event.phase === "failed" && workRun) lines.push({ key: `phase-${event.seq}`, icon: "stopped", text: "The run stopped", detail: after(event) });
        break;
      }
      case "images":
        if (event.status === "done") lines.push({ key: `images-${event.seq}`, icon: "page", text: event.count === 1 ? "Found 1 usable image" : `Found ${event.count ?? 0} usable images` });
        break;
      case "plan": {
        const headings = Array.isArray(event.sections) ? (event.sections as unknown[]).map(text).filter(Boolean) : [];
        lines.push({ key: `plan-${event.seq}`, icon: "file", text: `Planned ${headings.length} sections`, detail: headings.join(" · ") });
        break;
      }
      case "section":
        lines.push({ key: `section-${event.seq}`, icon: "file", text: `Wrote section ${event.index} of ${event.total}`, detail: text(event.heading) });
        break;
      case "writer":
        if (!workRun) lines.push({ key: `writer-${event.seq}`, icon: "knowledge", text: `Writing with ${WRITERS[text(event.provider)] ?? text(event.provider)}` });
        break;
      case "waiting": {
        const reason = text(event.reason);
        if (/cancel/.test(reason) || reason === "synthesis_unavailable" || reason === "work_needs_input") break;
        const words = waitWords(reason) || "Waiting to continue";
        // A run retrying on one limit is one wait, however long it lasts.
        const previous = lines.at(-1);
        if (previous?.icon === "time" && previous.text === words) {
          waits++;
          lines[lines.length - 1] = { ...previous, detail: `${waits} tries · ${after(event)}` };
        } else {
          waits = 1;
          lines.push({ key: `waiting-${event.seq}`, icon: "time", text: words, detail: after(event) });
        }
        break;
      }
      case "writer_failed":
        lines.push({ key: `failed-${event.seq}`, icon: "stopped", text: WRITER_FAILED[text(event.reason)] ?? "The report couldn't be written", detail: after(event) });
        break;
      case "source_added":
        lines.push({ key: `added-${event.seq}`, icon: "page", text: `You added ${text(event.title) || text(event.url)}` });
        break;
    }
  }
  if (sourcesAt >= 0 && !workRun) lines[sourcesAt] = { key: "sources", icon: "page", text: sources === 1 ? "Found 1 source" : `Found ${sources} sources` };
  if (savedAt >= 0) lines[savedAt] = { key: "saved", icon: "page", text: saved === 1 ? "Reused 1 saved source" : `Reused ${saved} saved sources` };
  if (readsAt >= 0) lines[readsAt] = { key: "reads", icon: "page", text: `Read ${reads} ${reads === 1 ? "page" : "pages"} in full`, ...(unread ? { detail: `${unread} couldn't be opened` } : {}) };
  // Only the last line can be going on now, and only while the backend says the run is live.
  const last = lines.at(-1);
  if (live && last && last.icon !== "time" && last.icon !== "stopped") lines[lines.length - 1] = { ...last, icon: "live", live: true };
  if (lines.length <= MAX_LINES) return lines;
  const hidden = lines.length - MAX_LINES + 1;
  return [{ key: "earlier", icon: "time", text: `${hidden} earlier steps` }, ...lines.slice(-MAX_LINES + 1)];
}

/** Where a report cites a source: the section headings and how many times, from the report's own markers. */
export function citationSections(markdown: string, id: string | undefined): { section: string; count: number }[] {
  if (!markdown || !id) return [];
  const sections: { section: string; count: number }[] = [];
  let heading = "Introduction";
  for (const line of markdown.split(/\r?\n/)) {
    const titled = line.match(/^#{1,4}\s+(.+)/);
    if (titled) {
      heading = titled[1]!.replace(/[*_`]/g, "").trim();
      continue;
    }
    let count = 0;
    for (const marker of line.matchAll(/\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g)) count += marker[1]!.split(/\s*[,;]\s*/).filter((name) => name === id).length;
    if (!count) continue;
    const row = sections.find((entry) => entry.section === heading);
    if (row) row.count += count;
    else sections.push({ section: heading, count });
  }
  return sections;
}
