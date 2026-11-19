import type { SearchAction, SearchContext, SearchResult } from "$shared/ipc/bindings";
import { sameSearch } from "$features/search/lib/search-model";
import { withShortcut } from "$shared/lib/search-shortcuts";
import { browserTabs, suggest } from "../browser-tabs.svelte";
import { browserSettings } from "../browser-settings.svelte";
import { displayEntry, engineName, ENGINES, resolveEntry } from "../search-engines";

type SearchState = Omit<SearchContext, "request_id">;
let session: { owner: SearchState; tab: number; current: SearchContext | null; results: SearchResult[] } | null = null;

function isCurrent(context: SearchContext) {
  return session && session.tab === browserTabs.current?.id && !browserTabs.current.url && browserTabs.page === null &&
    session.owner.session_id === context?.session_id && session.owner.window_id === context.window_id &&
    session.owner.space_id === context.space_id && session.owner.profile_id === context.profile_id;
}

function search(query: string): SearchResult[] {
  const entered = query.trim();
  if (!entered) return [];
  const resolved = resolveEntry(query, browserTabs.engine, browserTabs.shortcuts);
  const rows: SearchResult[] = [];
  const done = new Set<string>();
  if (resolved) {
    rows.push({
      kind: resolved.search ? "search" : "url",
      title: resolved.destination && resolved.search ? withShortcut(query, "", browserTabs.shortcuts).trim() : entered,
      detail: resolved.search ? resolved.destination || engineName(browserTabs.engine) : resolved.url,
      icon: null,
      action: { type: "OpenUrl", url: resolved.url },
    });
    done.add(resolved.url);
  }
  const words = entered.toLowerCase();
  for (const tab of browserTabs.tabs.filter(tab => tab.url && !done.has(tab.url) && (tab.title + " " + tab.url).toLowerCase().includes(words)).slice(0, 3)) {
    rows.push({ kind: "tab", title: tab.title || tab.url, detail: tab.url, icon: null, action: { type: "ActivateTab", id: String(tab.id) } });
    done.add(tab.url);
  }
  if (browserSettings.value.history) {
    for (const visit of suggest(browserTabs.history, entered, 18).filter(visit => !done.has(visit.url))) {
      const title = ENGINES.map(engine => displayEntry(visit.url, { id: engine.id })).find(text => text !== visit.url);
      rows.push({ kind: title ? "search_history" : "history", title: title || visit.title || visit.url, detail: visit.url, icon: null, action: { type: "OpenUrl", url: visit.url } });
      done.add(visit.url);
    }
  }
  return rows;
}

export function newTabSearchCommand(command: string, args: Record<string, unknown>): unknown {
  if (command === "newtab_search_context") {
    const tab = browserTabs.current;
    if (!tab || tab.url || tab.id !== Number(args.tabId) || browserTabs.page !== null) return null;
    const owner = { window_id: "aegis-window", session_id: crypto.randomUUID(), profile_id: "aegis-local", space_id: "aegis-space" };
    session = { owner, tab: tab.id, results: [], current: null };
    return { ...owner, request_id: "" };
  }
  const context = args.context as SearchContext;
  if (!session || !isCurrent(context)) return command === "newtab_run" ? { operation_id: null, accepted: false } : false;
  const state = session;
  switch (command) {
    case "newtab_search": {
      if (typeof args.query !== "string" || args.query.length > 2048 || typeof context.request_id !== "string") return false;
      const query = args.query;
      state.current = context;
      state.results = search(query);
      queueMicrotask(() => {
        if (session !== state || !sameSearch(state.current, context)) return;
        window.dispatchEvent(new CustomEvent("zephium:search", {
          detail: { query, context, pending: false, completion: null, results: state.results },
        }));
      });
      return true;
    }
    case "newtab_cancel":
      if (!sameSearch(state.current, context)) return false;
      state.current = null;
      state.results = [];
      return true;
    case "newtab_run": {
      const action = args.action as SearchAction;
      if (!sameSearch(state.current, context) || !action) return { operation_id: null, accepted: false };
      const matched = state.results.some(({ action: row }) =>
        action.type === "OpenUrl" && row.type === "OpenUrl" ? row.url === action.url :
        action.type === "ActivateTab" && row.type === "ActivateTab" && row.id === action.id,
      );
      let accepted = false;
      if (matched && action.type === "OpenUrl") accepted = browserTabs.go(state.tab, action.url);
      if (matched && action.type === "ActivateTab" && browserTabs.tabs.some(tab => tab.id === Number(action.id))) {
        browserTabs.show(Number(action.id));
        accepted = true;
      }
      if (accepted) session = null;
      return { operation_id: null, accepted };
    }
    default: return undefined;
  }
}
