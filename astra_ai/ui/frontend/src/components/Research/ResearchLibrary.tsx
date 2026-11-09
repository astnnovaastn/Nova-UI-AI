/**
 * The Research Library beside the canvas: every saved entry, searchable, by recency, active or
 * archived. Rows reuse ResearchHistoryItem and its real rename, archive and delete actions.
 * The backend has no search route, so the whole list is loaded and searched here.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { historyActivity, ResearchHistoryItem } from "./ResearchHistoryItem";
import { RecentlyRemovedResearch } from "./RecentlyRemovedResearch";
import "./ResearchLibrary.css";

const PAGE = 50;
const SHOWN = 30;

export type LibraryRow = {
  research_id: string;
  kind?: string;
  query?: string;
  display_title?: string;
  history_title?: string;
  summary?: string;
  phase?: string;
  completeness?: string;
  retrieved_at?: string;
  results?: unknown[];
  followup_count?: number;
  archived?: boolean;
};

const whenOf = (row: LibraryRow) => {
  const time = Date.parse(row.retrieved_at || "");
  return Number.isNaN(time) ? 0 : time;
};

export function libraryGroup(time: number, now: number): string {
  if (!time) return "Older";
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const start = day.getTime();
  if (time >= start) return "Today";
  if (time >= start - 86400000) return "Yesterday";
  if (time >= start - 6 * 86400000) return "This week";
  if (time >= start - 29 * 86400000) return "This month";
  return "Older";
}

export function libraryMatches(row: LibraryRow, search: string): boolean {
  const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = [row.history_title, row.display_title, row.query, row.summary].join(" ").toLocaleLowerCase();
  return words.every((word) => text.includes(word));
}

/** Only what the saved record says: its kind, how it ended, and what it gathered. */
export function libraryMeta(row: LibraryRow): string {
  const activity = historyActivity(row);
  const parts: string[] = [];
  if (row.kind === "chat") parts.push("Chat");
  if (row.kind === "documentary") parts.push("Document");
  if (activity.stateLabel) parts.push(activity.stateLabel);
  else if (row.phase === "failed") parts.push("Didn't finish");
  else if (row.completeness === "partial") parts.push("Partial");
  const sources = row.results?.length || 0;
  if (sources) parts.push(sources === 1 ? "1 source" : sources + " sources");
  if (row.followup_count) parts.push(row.followup_count === 1 ? "1 follow-up" : row.followup_count + " follow-ups");
  const time = whenOf(row);
  if (time) parts.push(new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  return parts.join(" · ");
}

export function ResearchLibrary({
  api,
  activeId,
  revision,
  deleting,
  selecting,
  selected,
  setSelecting,
  setSelected,
  onRemoveSelected,
  onPick,
  onWarm,
  onDelete,
  onClose,
  children,
}: {
  api: (path: string, init?: RequestInit) => Promise<any>;
  activeId: string;
  /** Goes up whenever the saved list may have changed. */
  revision: number;
  deleting: string;
  selecting: boolean;
  selected: Set<string>;
  setSelecting: (value: boolean) => void;
  setSelected: (value: Set<string>) => void;
  onRemoveSelected: () => void;
  onPick: (id: string) => void;
  onWarm: (id: string) => void;
  onDelete: (row: LibraryRow) => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [archived, setArchived] = useState(false);
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [removed, setRemoved] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(SHOWN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [again, setAgain] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const ask = ++latest.current;
    setLoading(true);
    (async () => {
      const all: LibraryRow[] = [];
      let total = 0;
      let last: any = null;
      do {
        last = await api("?offset=" + all.length + "&limit=" + PAGE + "&archived=" + archived);
        total = last.total || 0;
        all.push(...(last.items || []));
      } while (all.length < total && (last.items || []).length);
      if (ask !== latest.current) return;
      setRows(all);
      setRemoved(last.removed || []);
      setError("");
    })()
      .catch((e) => {
        if (ask === latest.current) setError(e.message || "The library could not be loaded.");
      })
      .finally(() => {
        if (ask === latest.current) setLoading(false);
      });
  }, [archived, revision, again]);

  const found = useMemo(
    () => rows.filter((row) => libraryMatches(row, search)).sort((a, b) => whenOf(b) - whenOf(a)),
    [rows, search],
  );
  const groups = useMemo(() => {
    const now = Date.now();
    const list: { name: string; rows: LibraryRow[] }[] = [];
    for (const row of found.slice(0, shown)) {
      const name = libraryGroup(whenOf(row), now);
      const group = list.find((entry) => entry.name === name);
      if (group) group.rows.push(row);
      else list.push({ name, rows: [row] });
    }
    return list;
  }, [found, shown]);
  const everyShown = found.length > 0 && found.slice(0, shown).every((row) => selected.has(row.research_id));

  function view(next: boolean) {
    setArchived(next);
    setShown(SHOWN);
    setSelected(new Set());
    setSelecting(false);
  }

  return (
    <aside className="research-library" id="research-history-panel" aria-label="Research library">
      <header className="rl-head">
        <h2>Library</h2>
        <button
          className="rl-text-button"
          aria-pressed={selecting}
          disabled={!!deleting || !rows.length}
          onClick={() => {
            setSelecting(!selecting);
            setSelected(new Set());
          }}
        >
          {selecting ? "Done" : "Select"}
        </button>
        <button className="rl-close" aria-label="Close library" title="Close (Esc)" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="rl-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input
          type="search"
          value={search}
          placeholder="Search research"
          aria-label="Search research"
          onChange={(e) => {
            setSearch(e.target.value);
            setShown(SHOWN);
          }}
        />
      </div>
      <div className="rl-tabs" role="group" aria-label="Which research to show">
        <button aria-pressed={!archived} onClick={() => view(false)}>Active</button>
        <button aria-pressed={archived} onClick={() => view(true)}>Archived</button>
      </div>
      {selecting && (
        <div className="rl-selection" aria-label="Selection controls">
          <span role="status">{selected.size} selected</span>
          <button
            className="rl-text-button"
            disabled={!!deleting}
            onClick={() => setSelected(everyShown ? new Set() : new Set(found.slice(0, shown).map((row) => row.research_id)))}
          >
            {everyShown ? "Clear" : "Select all shown"}
          </button>
          <button className="rl-text-button rl-danger" aria-busy={!!deleting} disabled={!selected.size || !!deleting} onClick={onRemoveSelected}>
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
      <div className="rl-list">
        {error && (
          <p className="rl-empty" role="alert">
            {error}{" "}
            <button className="rl-text-button" onClick={() => setAgain((n) => n + 1)}>Try again</button>
          </p>
        )}
        {!error && !found.length && (
          <p className="rl-empty" role="status">
            {loading ? "Loading…" : search.trim() ? "Nothing matches that search." : archived ? "Nothing archived." : "No saved research yet."}
          </p>
        )}
        {groups.map((group) => (
          <section key={group.name} aria-label={group.name}>
            <h3>{group.name}</h3>
            {group.rows.map((row) => (
              <ResearchHistoryItem
                key={row.research_id}
                item={row}
                meta={libraryMeta(row)}
                active={activeId === row.research_id}
                selecting={selecting}
                checked={selected.has(row.research_id)}
                disabled={!!deleting}
                onPick={() => onPick(row.research_id)}
                onWarm={() => onWarm(row.research_id)}
                onToggle={() => {
                  const next = new Set(selected);
                  if (next.has(row.research_id)) next.delete(row.research_id);
                  else next.add(row.research_id);
                  setSelected(next);
                }}
                onUpdate={async (value: any) => {
                  const result = await api("/" + row.research_id + "/history", { method: "PATCH", body: JSON.stringify(value) });
                  if (result.status !== "completed") throw Error(result.reason || "Could not update research.");
                  // Confirmed by the server, so the row changes now; the reload follows, since saving takes a moment.
                  setRows((old) =>
                    typeof value.archived === "boolean"
                      ? old.filter((entry) => entry.research_id !== row.research_id)
                      : old.map((entry) => (entry.research_id === row.research_id ? { ...entry, history_title: value.title } : entry)),
                  );
                  setAgain((n) => n + 1);
                }}
                onDelete={() => onDelete(row)}
              />
            ))}
          </section>
        ))}
        {found.length > shown && (
          <button className="rl-more" onClick={() => setShown((n) => n + SHOWN)}>
            Show more ({found.length - shown})
          </button>
        )}
        {!!removed.length && (
          <RecentlyRemovedResearch
            items={removed}
            onRestore={async (item: any) => {
              const result = await api("/" + item.research_id + "/restore", { method: "POST", body: JSON.stringify({ undo_token: item.undo_token }) });
              if (result.status !== "completed" && result.status !== "ok") throw Error(result.reason || "Research could not be restored.");
              setAgain((n) => n + 1);
            }}
          />
        )}
        {children}
      </div>
    </aside>
  );
}
