/**
 * The relations of a classic research report (one made without an AEGIS Work run), read from
 * what the report itself stores, never guessed:
 *
 * - `found`: the research found a source. Every page the run opened, and every source the report
 *   lists, came from its searches, so each has a string from the request.
 * - `cites`: the report cites a source. Only sources the report's text names with a [S#] marker.
 *
 * Nothing else is drawn: a classic report records no agents, evidence links or verdicts.
 */
import type { Relation } from "./relations";

export type ClassicPaper = { markdown: string; sources: readonly { id?: string; url: string; title?: string }[] };
export type ClassicPage = { url: string };

const MARKER = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g;
const NOTE = "Read from the report's own source list and citations.";

const relation = (type: "found" | "cites", source: string, target: string, url: string, label: string): Relation => ({
  id: `classic:${type}:${source}:${target}`,
  type,
  source,
  target,
  label,
  status: "complete",
  event_seq: 0,
  at: 0,
  evidence_id: "",
  url,
  note: NOTE,
  detail: {},
});

/** Relations, and the URL each source reference stands for. */
export function classicRelations(
  paper: ClassicPaper | null,
  pages: readonly ClassicPage[],
  /** On a canvas with follow-ups: this request's search, its report, and a prefix for its source numbers. */
  scope: { query?: string; report?: string; prefix?: string } = {},
): { relations: Relation[]; urls: Map<string, string> } {
  const query = scope.query ?? "query:1";
  const report = scope.report ?? "report";
  const prefix = scope.prefix ?? "";
  const urls = new Map<string, string>();
  const relations: Relation[] = [];
  const keyOf = new Map<string, string>();
  const add = (url: string, key: string) => {
    if (!/^https?:\/\//i.test(url) || keyOf.has(url)) return;
    keyOf.set(url, key);
    urls.set(key, url);
    relations.push(relation("found", query, `source:${key}`, url, "Source"));
  };
  for (const [index, source] of (paper?.sources ?? []).entries()) add(source.url, prefix + (source.id || `S${index + 1}`));
  for (const [index, page] of pages.entries()) add(page.url, `${prefix}P${index + 1}`);
  if (paper) {
    const cited = new Set<string>();
    for (const match of paper.markdown.matchAll(MARKER)) for (const id of match[1]!.split(/\s*[,;]\s*/)) cited.add(id);
    const done = new Set<string>();
    for (const [index, source] of paper.sources.entries()) {
      // A source listed twice under two numbers is one source: its citation goes to the first.
      const key = keyOf.get(source.url);
      if (!key || done.has(key) || !cited.has(source.id || `S${index + 1}`)) continue;
      done.add(key);
      relations.push(relation("cites", `source:${key}`, report, source.url, "Citation"));
    }
  }
  return { relations, urls };
}
