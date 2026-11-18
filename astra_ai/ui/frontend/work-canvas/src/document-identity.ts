/**
 * V30: what a Work run's written result is, so it opens as that thing (a campaign plan, a meeting
 * brief, an architecture document) in the Work document viewer, never in the legacy research tabs.
 * They share one renderer (ReportReader); the identity decides the label, the icon word and whether
 * research-only views (sources, media) are offered.
 */

export type DocumentKind =
  | "research-report"
  | "campaign-plan"
  | "architecture-document"
  | "meeting-brief"
  | "marketing-deliverable"
  | "learning-document"
  | "work-document";

export type DocumentIdentity = { kind: DocumentKind; label: string; research: boolean };

const BY_WORKFLOW: Record<string, DocumentKind> = {
  "quick-research": "research-report",
  "deep-research": "research-report",
  "knowledge-map": "research-report",
  "campaign-plan": "campaign-plan",
  "map-a-project": "architecture-document",
  "explain-code": "architecture-document",
  "review-a-change": "architecture-document",
  "fix-a-bug": "architecture-document",
  "meeting-prep": "meeting-brief",
  "weekly-status": "meeting-brief",
  "inbox-triage": "meeting-brief",
  "plan-my-day": "meeting-brief",
  "competitor-landscape": "marketing-deliverable",
  "market-map": "marketing-deliverable",
  "pricing-research": "marketing-deliverable",
  "investor-list": "marketing-deliverable",
  "ui-teardown": "marketing-deliverable",
  moodboard: "marketing-deliverable",
  "learning-path": "learning-document",
  "exam-prep": "learning-document",
};

const LABELS: Record<DocumentKind, string> = {
  "research-report": "Research report",
  "campaign-plan": "Campaign plan",
  "architecture-document": "Architecture document",
  "meeting-brief": "Meeting brief",
  "marketing-deliverable": "Deliverable",
  "learning-document": "Learning document",
  "work-document": "Work document",
};

type RunLike = { request?: { workflow?: string; router?: string }; plan?: { route?: { research?: boolean } | null } } | null | undefined;

/** The identity of a run's document. A run with no Work route (a classic or research run) is a research report. */
export function documentIdentity(run: RunLike): DocumentIdentity {
  const workflow = run?.request?.workflow ?? "";
  const route = run?.plan?.route ?? null;
  const kind: DocumentKind = BY_WORKFLOW[workflow] ?? (!run || !route || route.research ? "research-report" : "work-document");
  return { kind, label: LABELS[kind], research: kind === "research-report" };
}
