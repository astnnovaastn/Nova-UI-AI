/**
 * V31 Today: what is due today and overdue, from the AEGIS Tasks store (GET /api/workspace/v21/tasks, the
 * same records the Tasks panel edits). No count is ever made up: until the tasks are read, the figure says
 * nothing; if they cannot be read, it says so. Counted like Zephium's taskCounts: open tasks only.
 */
import { workspaceHeaders } from "./native/host-session";
import { localDayKey } from "./focus.svelte";

export type TaskRow = { id: string; status?: string; dueDate?: string | null; trashed?: boolean };
export type DueCounts = { today: number; overdue: number };

/** Counts for the local day `day` (YYYY-MM-DD). Done tasks never count. */
export function dueCounts(rows: readonly TaskRow[], day: string): DueCounts {
  let today = 0, overdue = 0;
  for (const row of rows) {
    if (row.status === "done" || row.trashed || !row.dueDate) continue;
    const due = String(row.dueDate).slice(0, 10);
    if (due === day) today += 1;
    else if (due < day) overdue += 1;
  }
  return { today, overdue };
}

class Today {
  counts = $state<DueCounts | null>(null);
  failed = $state(false);
  private reading: Promise<void> | null = null;

  /** Reads the tasks once; callers re-read when the new tab opens and once a minute while it shows. */
  read(): Promise<void> {
    if (this.reading) return this.reading;
    this.reading = fetch("/api/workspace/v21/tasks", { headers: workspaceHeaders(), credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { items?: TaskRow[] };
        this.counts = dueCounts(body.items ?? [], localDayKey(new Date()));
        this.failed = false;
      })
      .catch(() => {
        this.failed = true;
      })
      .finally(() => {
        this.reading = null;
      });
    return this.reading;
  }
}

export const today = new Today();

// V33: one task list everywhere. A change made on the Tasks page, or in Work's Tasks panel
// (both go through the same resource route) re-reads the counts, so the sidebar tray and the new tab's
// "Due today" follow at once instead of at the next minute. Re-reads are coalesced.
let pending: ReturnType<typeof setTimeout> | undefined;
const changed = () => {
  if (today.counts === null && !today.failed) return;
  clearTimeout(pending);
  pending = setTimeout(() => void today.read(), 250);
};
if (typeof window !== "undefined") {
  for (const name of ["zephium:resource-changed", "zephium:task-lists-changed"]) window.addEventListener(name, changed);
}

/** Opens the existing Tasks panel (widgets.tsx listens for this). */
export function openTasks() {
  window.dispatchEvent(new CustomEvent("aegis-open-tools", { detail: { kind: "tasks" } }));
}
