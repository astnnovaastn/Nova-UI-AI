/**
 * The Research Library beside the canvas: every saved entry, searchable, by recency. Rows reuse ResearchHistoryItem and its real rename, archive and delete actions.
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

export type LibraryPage = { items: LibraryRow[]; removed?: any[]; total: number };

const whenOf = (row: LibraryRow) => {
  const time = Date.parse(row.retrieved_at || "");
  return Number.isNaN(time) ? 0 : time;
};

const timelineScales = ["Day", "Week", "Month"] as const;
type TimelineScale = typeof timelineScales[number];
const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const monthDate = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

function startOfWeek(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

export function libraryGroup(time: number, now: number, scale: TimelineScale = "Day"): string {
  if (!time) return "Undated";
  const date = new Date(time);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (scale === "Month") {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      ? "This month" : monthDate.format(date);
  }
  if (scale === "Week") {
    const monday = startOfWeek(date);
    if (+monday === +startOfWeek(today)) return "This week";
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return shortDate.format(monday) + " – " + fullDate.format(sunday);
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (+date === +today) return "Today";
  if (+date === +yesterday) return "Yesterday";
  return fullDate.format(date);
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
  visible,
  firstPage,
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
}: {
  api: (path: string, init?: RequestInit) => Promise<any>;
  activeId: string;
  visible: boolean;
  firstPage?: LibraryPage;
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
}) {
  const [loadedRows, setRows] = useState<LibraryRow[]>();
  const [loadedRemoved, setRemoved] = useState<any[]>();
  const rows = loadedRows ?? firstPage?.items ?? [];
  const removed = loadedRemoved ?? firstPage?.removed ?? [];
  const [scale, setScale] = useState<TimelineScale>("Day");
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(SHOWN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [again, setAgain] = useState(0);
  const completed = useRef<{ revision: number; again: number } | undefined>(undefined);
  const usedPage = useRef<LibraryPage | undefined>(undefined);
  const lastAttempt = useRef(0);

  useEffect(() => {
    if (!visible || (completed.current?.revision === revision && completed.current.again === again)) return;
    const controller = new AbortController();
    const seed = lastAttempt.current === again && usedPage.current !== firstPage ? firstPage : undefined;
    usedPage.current = firstPage;
    lastAttempt.current = again;
    setLoading(true);
    setError("");
    (async () => {
      const read = (offset: number): Promise<LibraryPage> => api(
        "?offset=" + offset + "&limit=" + PAGE + "&archived=false",
        { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) },
      );
      let page = seed ?? await read(0);
      if (controller.signal.aborted) return;
      const all = new Map(page.items.map(row => [row.research_id, row]));
      let offset = page.items.length;
      setRemoved(page.removed || []);
      if (!completed.current) setRows([...all.values()]);
      while (offset < page.total && page.items.length) {
        page = await read(offset);
        if (controller.signal.aborted) return;
        offset += page.items.length;
        for (const row of page.items) all.set(row.research_id, row);
        if (!completed.current) setRows([...all.values()]);
      }
      setRows([...all.values()]);
      completed.current = { revision, again };
    })()
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message || "The library could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, visible, firstPage, revision, again]);

  const found = useMemo(
    () => rows.filter((row) => libraryMatches(row, search)).sort((a, b) => whenOf(b) - whenOf(a)),
    [rows, search],
  );
  const groups = useMemo(() => {
    const now = Date.now();
    const list: { name: string; rows: LibraryRow[] }[] = [];
    for (const row of found.slice(0, shown)) {
      const name = libraryGroup(whenOf(row), now, scale);
      const group = list[list.length - 1];
      if (group?.name === name) group.rows.push(row);
      else list.push({ name, rows: [row] });
    }
    return list;
  }, [found, shown, scale]);
  const everyShown = found.length > 0 && found.slice(0, shown).every((row) => selected.has(row.research_id));

  return (
    <aside className="research-library" id="research-history-panel" aria-label="Research library"
      hidden={!visible} style={visible ? undefined : { display: "none" }}>
      <header className="rl-head">
        <h2>Timeline</h2>
        <div className="rl-scale" role="group" aria-label="Group timeline by">
          {timelineScales.map((option) => (
            <button key={option} type="button" aria-pressed={scale === option} onClick={() => {
              setScale(option);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}>{option}</button>
          ))}
        </div>
        <button className="rl-close" aria-label="Close library" title="Close (Esc)" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="rl-toolbar">
        <div className="rl-search">
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
      <div className="rl-list" ref={listRef}>
        {error && (
          <p className="rl-empty" role="alert">
            {error}{" "}
            <button className="rl-text-button" onClick={() => setAgain((n) => n + 1)}>Try again</button>
          </p>
        )}
        {!error && !found.length && (
          <p className="rl-empty" role="status">
            {loading ? "Loading…" : search.trim() ? "Nothing matches that search." : "No saved research yet."}
          </p>
        )}
        {groups.map((group) => (
          <section className="rl-period" key={group.name} aria-label={group.name}>
            <h3>
              <svg className="rl-curve" viewBox="0 0 24 40" preserveAspectRatio="none" aria-hidden="true">
                <path d="M22.5 0 C22.5 10 11.5 9 11.5 20" />
                <path d="M11.5 20 C11.5 31 22.5 30 22.5 40" />
              </svg>
              {group.name}
            </h3>
            {group.rows.map((row) => (
              <ResearchHistoryItem
                key={row.research_id}
                item={row}
                timeline
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
                      ? (old ?? rows).filter((entry) => entry.research_id !== row.research_id)
                      : (old ?? rows).map((entry) => (entry.research_id === row.research_id ? { ...entry, history_title: value.title } : entry)),
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
            inline
            items={removed}
            onRestore={async (item: any) => {
              const result = await api("/" + item.research_id + "/restore", { method: "POST", body: JSON.stringify({ undo_token: item.undo_token }) });
              if (result.status !== "completed" && result.status !== "ok") throw Error(result.reason || "Research could not be restored.");
              setAgain((n) => n + 1);
            }}
          />
        )}
      </div>
    </aside>
  );
}
