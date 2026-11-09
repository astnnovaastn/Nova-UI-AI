/**
 * Strings are data. Each one the canvas draws stands for relations the backend recorded in the run
 * (astra_ai/core/work/relations.py): a typed join between two real objects, the event that made it,
 * and how far it holds. Nothing here invents a relation, and nothing is drawn for appearance.
 */

export type RelationStatus = "active" | "complete" | "verified" | "contested" | "failed";
export type RelationType =
  | "plans" | "assigns" | "searches" | "found" | "reads" | "evidence" | "verifies"
  | "delivers" | "cites" | "writes" | "supports" | "relates" | "models";

export type Relation = {
  id: string;
  type: RelationType;
  source: string;
  target: string;
  label: string;
  status: RelationStatus;
  event_seq: number;
  at: number;
  evidence_id: string;
  url: string;
  note: string;
  detail: Record<string, unknown>;
};

/** relation type -> (source kinds, target kinds), the same contract the backend enforces. */
const ENDPOINTS: Record<RelationType, [readonly string[], readonly string[]]> = {
  plans: [["request"], ["agent"]],
  assigns: [["agent"], ["agent"]],
  searches: [["agent"], ["query"]],
  found: [["query"], ["source"]],
  reads: [["agent"], ["source"]],
  evidence: [["source"], ["agent"]],
  verifies: [["agent"], ["agent"]],
  delivers: [["agent"], ["agent"]],
  cites: [["source"], ["report"]],
  writes: [["agent"], ["report"]],
  supports: [["source"], ["map"]],
  relates: [["map"], ["map"]],
  models: [["agent"], ["map"]],
};
const STATUSES = new Set<RelationStatus>(["active", "complete", "verified", "contested", "failed"]);

/** What each type means, for the inspector and screen readers. */
export const MEANING: Record<RelationType, string> = {
  plans: "The request was planned by AEGIS",
  assigns: "AEGIS assigned this agent a task",
  searches: "This agent ran a web search",
  found: "The search found this source",
  reads: "This agent opened the source page",
  evidence: "Findings were extracted from this source",
  verifies: "The findings were independently checked",
  delivers: "This agent delivered its results to AEGIS",
  cites: "The report cites this source",
  writes: "AEGIS wrote the report",
  supports: "This source supports the map node",
  relates: "These map nodes are related",
  models: "This agent built the map node",
};

const PLURAL: Partial<Record<RelationType, string>> = {
  searches: "searches",
  found: "sources",
  reads: "pages read",
  evidence: "evidence links",
  cites: "citations",
  supports: "sources",
};

export const kindOf = (ref: string) => ref.split(":", 1)[0];

/** A relation the canvas may trust: known type and status, endpoints of the right kinds. */
export function validRelation(value: unknown): value is Relation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Relation>;
  if (typeof row.id !== "string" || typeof row.source !== "string" || typeof row.target !== "string") return false;
  const rule = ENDPOINTS[row.type as RelationType];
  if (!rule || !STATUSES.has(row.status as RelationStatus) || row.source === row.target) return false;
  return rule[0].includes(kindOf(row.source)) && rule[1].includes(kindOf(row.target));
}

export function relationsOf(run: { relations?: unknown } | null | undefined): Relation[] {
  const rows = Array.isArray(run?.relations) ? run.relations : [];
  const seen = new Set<string>();
  return rows.filter((row): row is Relation => validRelation(row) && !seen.has(row.id) && !!seen.add(row.id));
}

/** One drawn string: the relations it carries, its place among its parallel strands, and its look. */
export type StrandData = {
  relations: Relation[];
  /** 0-based position among the strings joining the same two cards, and how many there are. */
  index: number;
  of: number;
  status: RelationStatus;
  label: string;
  /** Only one string of a parallel set carries a label, so labels stay sparse. */
  labelled: boolean;
};

export type StrandLink = {
  id: string;
  source: string;
  target: string;
  kind: "flow";
  label?: string;
  live?: boolean;
  strand: StrandData;
};

/** The worst state wins: a failure is never shown as finished, and nothing contested looks verified. */
const RANK: RelationStatus[] = ["failed", "contested", "active", "complete", "verified"];
export function combinedStatus(rows: readonly Relation[]): RelationStatus {
  return RANK.find((status) => rows.some((row) => row.status === status)) ?? "complete";
}

export function strandLabel(rows: readonly Relation[]): string {
  if (rows.length === 1) return rows[0]!.label || MEANING[rows[0]!.type];
  const types = new Set(rows.map((row) => row.type));
  if (types.size === 1) {
    const type = rows[0]!.type;
    return `${rows.length} ${PLURAL[type] ?? "items"}`;
  }
  return `${rows.length} items`;
}

/** Past this many relations between two cards, strings group by type and carry a truthful count. */
export const MAX_STRANDS = 3;

/**
 * The strings to draw. `resolve` turns an object reference into the card that shows it, or null when
 * no card shows it. A relation whose ends land on one card, or on none, is not drawn; it stays in
 * `unplaced` for the inspector. Relations between the same two cards become parallel strands, one per
 * relation up to MAX_STRANDS; beyond that, one strand per relation type, each with its count.
 */
export function strandLinks(
  relations: readonly Relation[],
  resolve: (ref: string) => string | null,
): { links: StrandLink[]; unplaced: Relation[] } {
  const groups = new Map<string, { source: string; target: string; rows: Relation[] }>();
  const unplaced: Relation[] = [];
  for (const row of relations) {
    const source = resolve(row.source);
    const target = resolve(row.target);
    if (!source || !target || source === target) {
      unplaced.push(row);
      continue;
    }
    // Both directions between two cards are one bundle, drawn the way it was first made.
    const key = [source, target].sort().join("\u0000");
    const group = groups.get(key) ?? { source, target, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  const links: StrandLink[] = [];
  for (const { source, target, rows } of groups.values()) {
    let bundles: Relation[][];
    if (rows.length <= MAX_STRANDS) bundles = rows.map((row) => [row]);
    else {
      const byType = new Map<string, Relation[]>();
      for (const row of rows) byType.set(row.type, [...(byType.get(row.type) ?? []), row]);
      bundles = [...byType.values()];
      if (bundles.length > MAX_STRANDS) bundles = [...bundles.slice(0, MAX_STRANDS - 1), bundles.slice(MAX_STRANDS - 1).flat()];
    }
    const middle = Math.floor((bundles.length - 1) / 2);
    bundles.forEach((bundle, index) => {
      const status = combinedStatus(bundle);
      links.push({
        id: `strand:${bundle.map((row) => row.id).sort().join("+")}`.slice(0, 180),
        source,
        target,
        kind: "flow",
        ...(status === "active" ? { live: true } : {}),
        strand: {
          relations: bundle,
          index,
          of: bundles.length,
          status,
          label: strandLabel(bundle),
          labelled: index === middle,
        },
      });
    });
  }
  return { links, unplaced };
}

/** A plain sentence for a strand: what joins the two cards, for its accessible name. */
export function describeStrand(strand: StrandData, from: string, to: string): string {
  const what = strand.relations.length === 1 ? MEANING[strand.relations[0]!.type] : strand.label;
  return `${what}: ${from} to ${to}. ${STATUS_WORDS[strand.status]}.`;
}

export const STATUS_WORDS: Record<RelationStatus, string> = {
  active: "In progress",
  complete: "Complete",
  verified: "Verified",
  contested: "Contested or needs review",
  failed: "Failed",
};
