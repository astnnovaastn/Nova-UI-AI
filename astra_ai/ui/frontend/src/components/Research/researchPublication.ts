export function publicationPending(report: any) {
  return !!report && report.kind !== "documentary" && report.kind !== "chat" &&
    (report.publication_state === "preparing" || ["pending", "failed"].includes(report.completeness));
}

export function acceptPublication(current: any, incoming: any) {
  return !!current && current.research_id === incoming.research_id &&
    (!current.research_session_id || !incoming.research_session_id || current.research_session_id === incoming.research_session_id) &&
    (incoming.update_sequence ?? 0) >= (current.update_sequence ?? 0);
}

export function mergePublication(current:any,incoming:any,startedDraftRevision:string,dirty:boolean) {
  if(!acceptPublication(current,incoming))return current;
  return dirty || (current.draft?.revision || "")!==startedDraftRevision ? {...incoming,draft:current.draft} : incoming;
}

export function publicationWorking(report: any) {
  const stages = ["queued", "collecting_sources", "comparing_evidence", "preparing_report", "preparing_images", "preparing_layout", "waiting_for_quota", "waiting_for_report"];
  return !!report && (stages.includes(report.phase) || stages.includes(report.extension_activity?.phase) || ["pending", "running"].includes(report.media_status));
}

export function revealDuration(characters: number) {
  return Math.min(4000, Math.max(2000, characters / 5));
}
