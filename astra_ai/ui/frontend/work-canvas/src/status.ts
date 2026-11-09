/**
 * The one meaning of a status dot, used by every card that has one. A dot says how far the thing
 * has got, never what kind of thing it is.
 *
 *   queued    gray ring        not started
 *   running   blue, pulsing    working or reading now
 *   waiting   amber ring+dot   waiting on a limit or on the person; needs review
 *   complete  green            finished
 *   failed    red square       failed or blocked; never shown green
 *
 * Each also differs in shape, so colour is never the only cue, and each has a spoken label.
 */
export type NodeStatus = "queued" | "running" | "waiting" | "complete" | "failed";

export const STATUS_LABEL: Record<NodeStatus, string> = {
  queued: "Not started",
  running: "Working",
  waiting: "Waiting or needs review",
  complete: "Complete",
  failed: "Failed or blocked",
};

/** An agent's recorded state, as a dot. */
export function agentStatus(state: string): NodeStatus {
  switch (state) {
    case "running":
      return "running";
    case "waiting":
      return "waiting";
    case "done":
      return "complete";
    case "failed":
    case "stopped":
      return "failed";
    default:
      return "queued";
  }
}

/**
 * A map node's dot: complete when a source supports it, waiting (needs review) when it cites none,
 * failed when every source it relies on was contested by verification.
 */
export function mapNodeStatus(sourceIds: readonly string[], contested: ReadonlySet<string> = new Set()): NodeStatus {
  if (!sourceIds.length) return "waiting";
  return sourceIds.every((id) => contested.has(id)) ? "failed" : "complete";
}

/** A report's dot, from the run state the canvas already reads. */
export function reportStatus(runState: string, partial = false): NodeStatus {
  if (runState === "failed" || runState === "cancelled") return "failed";
  if (runState === "running") return "running";
  if (runState === "waiting") return "waiting";
  return partial ? "waiting" : "complete";
}
