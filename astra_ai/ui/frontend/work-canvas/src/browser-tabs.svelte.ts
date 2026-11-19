/**
 * The person's browser tabs in AEGIS Desktop (V30, extended in V31). AEGIS Work is always reachable (the
 * rail's Work button and each tab's "Back to Work"); the tabs are real web pages in native views on the
 * person's own session (desktop/user-tabs.cjs).
 *
 * A tab's lifecycle is its own: it never belongs to a research source card, and closing a run or a card
 * never closes a tab. Only the shown tab has a live view; the rest are created when first shown (lazy)
 * and are frozen and later released by the desktop's resource manager when hidden. Its navigation
 * history lives in its native view; only its address and title are saved, with the tab that was shown.
 *
 * V31 adds: an empty tab is the AEGIS new tab page; tabs can be reordered; closed tabs can be reopened
 * (Ctrl+Shift+T); a visit history feeds the address suggestions (Settings can turn it off); a page opened
 * from a research source window remembers where it came from; counts of blocked requests per tab; and a
 * running focus round can hold back listed sites.
 */
import { browserHost, type BrowserHostEvent, type PaneRect } from "./browser-host";
import { browserSettings } from "./browser-settings.svelte";
import { focus } from "./focus.svelte";
import { DEFAULT_ENGINE, resolveEntry, DEFAULT_SHORTCUTS, parseShortcuts, type EngineSetting } from "./search-engines";
import { store } from "./store.svelte";
import { samePage } from "./work-handoff";
import { normalizeAddress } from "./browser-address";

export type BrowserTab = {
  id: number;
  url: string;
  title: string;
  favicon: string;
  /** V32: the icon as 32 px RGBA (base64), for Zephium's tab rows. */
  icon?: string;
  media?: { available: boolean; playing: boolean; muted: boolean; audible: boolean };
  loading: boolean;
  back: boolean;
  forward: boolean;
  error: string;
  /** A native view exists for it (it has been shown at least once since the app started). */
  opened: boolean;
  download: string;
  /** Requests the blocker cancelled on the current page. */
  blocked: number;
  /** Where the tab came from, when a source window opened it: "Back to <title>". */
  from: { kind: "source"; title: string; researchId?: string } | null;
  /** The site a running focus round holds back on this tab, or null. */
  held: string | null;
  /** V33: kept at the top of the list, without a close control (Zephium's pinned tabs). Saved. */
  pinned?: boolean;
};
export type Visit = { url: string; title: string; at: number; count: number };

const TABS_KEY = "aegis-browser-tabs-v1";
const ENGINE_KEY = "aegis-search-engine-v1";
const SHORTCUTS_KEY = "aegis-browser-search-shortcuts-v1";
const KEPT_KEY = "aegis-browser-kept-v1";
const HISTORY_KEY = "aegis-browser-history-v1";
const CLOSED_KEY = "aegis-browser-closed-v1";
const HISTORY_LIMIT = 1500;
/** Tab ids sit far above source pane ids, so the two never meet in the desktop's one id space. */
const FIRST_ID = 100_000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window or storage blocked: nothing is restored */
  }
}

const blank = (id: number, url = "", title = ""): BrowserTab => ({
  id, url, title, favicon: "", loading: false, back: false, forward: false, error: "", opened: false, download: "", blocked: 0, from: null, held: null,
});

/** A page worth remembering in history: an ordinary http(s) page, not a results page with a long query of its own. */
const remembered = (url: string) => /^https?:\/\//.test(url);

/** History entries matching what is typed, best first: title or address contains every word. */
export function suggest(history: readonly Visit[], typed: string, limit = 6): Visit[] {
  const words = typed.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return history
    .filter((visit) => {
      const text = (visit.title + " " + visit.url.replace(/^https?:\/\/(www\.)?/, "")).toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .sort((a, b) => b.count - a.count || b.at - a.at)
    .slice(0, limit);
}

class BrowserTabs {
  readonly available = browserHost.kind === "native";
  tabs = $state<BrowserTab[]>([]);
  /** "work" is the canvas; otherwise a tab id. */
  active = $state<"work" | number>("work");
  engine = $state<EngineSetting>(read(ENGINE_KEY, DEFAULT_ENGINE));
  shortcutPreference = $state(read<string>(SHORTCUTS_KEY, ""));
  shortcuts = $derived(parseShortcuts(this.shortcutPreference) ?? DEFAULT_SHORTCUTS);
  history = $state<Visit[]>(read<Visit[]>(HISTORY_KEY, []).filter((v) => v && typeof v.url === "string").slice(0, HISTORY_LIMIT));
  closed = $state<{ url: string; title: string }[]>(read<{ url: string; title: string }[]>(CLOSED_KEY, []).slice(0, 10));
  kept = $state<{ url: string; title: string }[]>(read<{ url: string; title: string }[]>(KEPT_KEY, [])
    .filter(row => typeof row?.url === "string" && normalizeAddress(row.url) && typeof row.title === "string").slice(0, 64));
  /** The tab shown before Work was, so the browser comes back to it. */
  lastTab = $state<number | null>(null);
  /** Where the page area is, in page pixels; set by the browser surface. */
  rect: PaneRect | null = null;
  /** A menu or suggestion list is open over the page: the native view hides, since it paints above everything. */
  overlay = $state(false);
  shelfOpen = $state(false);
  /** V32: the window caption is out; a web page steps down by its height meanwhile (V33: over `duration` ms). */
  caption = $state({ shown: false, height: 36, duration: 0 });
  /** V32: a full page shown in Browse instead of the tab (Zephium surface pages). */
  page = $state<"tasks" | "time" | "notes" | "history" | "downloads" | "bookmarks" | null>(null);
  /** A tab that wants its address field focused (a new, empty tab). */
  focusAddress = $state(0);
  /** The tab whose address field the next focus request is for (used once). */
  focusFor = $state<number | null>(null);
  /** The rectangle a page opened from a source window grows from (V31 transition), cleared once used. */
  origin = $state<DOMRect | null>(null);
  private next = FIRST_ID;
  private recent: number[] = [];
  private covered = false;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (!this.available) return;
    const saved = read<{ tabs?: { url: string; title: string }[]; active?: number } | { url: string; title: string }[]>(TABS_KEY, []);
    // V30 saved a bare list; V31 saves { tabs, active }.
    const rows = Array.isArray(saved) ? saved : saved.tabs ?? [];
    if (browserSettings.value.restoreTabs) {
      for (const row of rows.slice(0, 16)) if (typeof row?.url === "string" && row.url) this.tabs.push({ ...blank(this.next++, row.url, String(row.title ?? "")), pinned: (row as { pinned?: boolean }).pinned === true });
      this.keepPinnedFirst();
      const index = Array.isArray(saved) ? -1 : Number(saved.active ?? -1);
      this.lastTab = this.tabs[index]?.id ?? this.tabs.at(-1)?.id ?? null;
    }
    this.unsubscribe = browserHost.subscribe((event) => this.onEvent(event));
  }

  get current(): BrowserTab | null {
    return typeof this.active === "number" ? (this.tabs.find((tab) => tab.id === this.active) ?? null) : null;
  }

  private save() {
    const kept = this.tabs.filter((tab) => tab.url);
    const shown = typeof this.active === "number" ? this.active : this.lastTab;
    write(TABS_KEY, { tabs: kept.map((tab) => ({ url: tab.url, title: tab.title, ...(tab.pinned ? { pinned: true } : {}) })), active: Math.max(-1, kept.findIndex((tab) => tab.id === shown)) });
  }

  keep(id: number) {
    const tab = this.tabs.find(row => row.id === id);
    if (!tab?.url || !normalizeAddress(tab.url) || this.kept.length >= 64 || this.kept.some(row => samePage(row.url, tab.url))) return;
    this.kept = [...this.kept, { url: tab.url, title: tab.title || tab.url }];
    write(KEPT_KEY, this.kept);
  }

  forgetKept(url: string) {
    this.kept = this.kept.filter(row => row.url !== url);
    write(KEPT_KEY, this.kept);
  }

  openAddress(url: string) {
    if (!normalizeAddress(url)) return;
    const tab = this.tabs.find(row => samePage(row.url, url));
    if (tab) {
      this.page = null;
      this.show(tab.id);
    } else if (this.tabs.length < 16) {
      this.page = null;
      this.newTab(url);
    }
  }

  setEngine(setting: EngineSetting) {
    this.engine = setting;
    write(ENGINE_KEY, setting);
  }

  setShortcuts(value: string) {
    if (value !== "" && !parseShortcuts(value)) return false;
    try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(value)); }
    catch { return false; }
    this.shortcutPreference = value;
    return true;
  }

  /** A new tab: the AEGIS new tab page with its field focused; or straight to `url`. */
  newTab(url = "", background = false): BrowserTab | null {
    if (!this.available || this.tabs.length >= 16) return null;
    const tab = blank(this.next++, url);
    const at = typeof this.active === "number" ? this.tabs.findIndex((row) => row.id === this.active) + 1 : this.tabs.length;
    this.tabs.splice(at > 0 ? at : this.tabs.length, 0, tab);
    if (!background) this.show(tab.id);
    this.save();
    return tab;
  }

  /** "Open in browser" from a research source window: a tab on that page, remembering the Work session it came from. */
  openFromSource(url: string, { title = "", rect = null, researchId = "" }: { title?: string; rect?: DOMRect | null; researchId?: string } = {}) {
    // V33: the tab already on that page (same page, any address form) is focused, never opened twice.
    const existing = this.tabs.find((tab) => tab.url === url) ?? this.tabs.find((tab) => samePage(tab.url, url));
    if (existing) {
      if (!existing.from || researchId) existing.from = { kind: "source", title: title || existing.from?.title || "Research", researchId: researchId || existing.from?.researchId };
      this.origin = rect;
      this.show(existing.id);
      return existing;
    }
    const tab = this.newTab(url, true);
    if (!tab) return null;
    const live = this.tabs.find((row) => row.id === tab.id)!;
    live.from = { kind: "source", title: title || "Research", ...(researchId ? { researchId } : {}) };
    this.origin = rect;
    this.show(tab.id);
    return live;
  }

  /** Shows a tab (or the Work canvas). Only the shown tab's view is visible. */
  show(target: "work" | number) {
    const before = this.active;
    this.active = target;
    if (typeof before === "number" && before !== target) {
      this.lastTab = before;
      void browserHost.setVisible(before, false);
    }
    if (typeof target === "number") {
      this.lastTab = target;
      this.recent = [target, ...this.recent.filter(id => id !== target)];
      if (!this.current?.url && this.page === null) {
        this.focusFor = target;
        this.focusAddress += 1;
      }
      void this.attach(target);
    }
    this.save();
  }

  /**
   * V33 "Back to research": the Work canvas, on the session the page came from. The canvas keeps its
   * camera and selection while a tab is shown; only when another session was opened meanwhile is the
   * original one opened again (a saved session is reopened, never re-run).
   */
  returnToWork(id: number | null = typeof this.active === "number" ? this.active : null) {
    const tab = this.tabs.find((row) => row.id === id);
    this.page = null;
    this.show("work");
    const research = tab?.from?.researchId;
    if (research && store.state.report?.research_id !== research && typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id: research } }));
  }

  /** Back to the browser from Work: the tab shown last, or a new tab. */
  resume() {
    const tab = this.tabs.find((row) => row.id === this.lastTab) ?? this.tabs.at(-1);
    if (tab) this.show(tab.id);
    else this.newTab();
  }

  /** The shown tab's view goes where the page area is; it is created there the first time. */
  async attach(id = this.active) {
    if (typeof id !== "number" || !this.rect) return;
    const tab = this.tabs.find((row) => row.id === id);
    if (!tab || !tab.url || tab.held) return;
    if (!tab.opened) {
      tab.opened = true;
      try {
        await browserHost.openTab(tab.id, tab.url, this.rect);
      } catch (error) {
        tab.opened = false;
        tab.error = error instanceof Error ? error.message : "This page could not be opened.";
        return;
      }
    } else {
      await browserHost.setBounds(tab.id, this.rect);
    }
    if (!this.tabs.some(row => row.id === id)) {
      await browserHost.close(id);
      return;
    }
    await browserHost.setVisible(tab.id, this.active === id && !tab.held && !this.covered && this.page === null && Boolean(this.rect));
  }

  setRect(rect: PaneRect | null) {
    this.rect = rect;
    if (typeof this.active === "number" && rect) void browserHost.setBounds(this.active, rect);
  }

  /** Hides the shown tab's native view, for anything drawn over the page (a menu, a dialog). */
  cover(covered: boolean) {
    this.covered = covered;
    if (typeof this.active === "number" && this.current?.opened) void browserHost.setVisible(this.active, !covered);
  }

  /** What the person typed in the address bar: an address, or a search with their engine. */
  go(id: number, input: string): boolean {
    const tab = this.tabs.find((row) => row.id === id);
    const entry = resolveEntry(input, this.engine, this.shortcuts);
    if (!tab || !entry) return false;
    tab.error = "";
    if (tab.url) {
      try { if (new URL(tab.url).origin !== new URL(entry.url).origin) { tab.favicon = ""; tab.icon = undefined; } }
      catch { tab.favicon = ""; tab.icon = undefined; }
    }
    tab.url = entry.url;
    tab.loading = true;
    tab.held = focus.holds(entry.url, browserSettings.value.focus.sites, browserSettings.value.focus.holdSites);
    if (tab.held) {
      tab.loading = false;
      if (tab.opened) void browserHost.setVisible(id, false);
    } else if (tab.opened) void browserHost.navigate(id, entry.url).catch((error) => (tab.error = error instanceof Error ? error.message : "This page could not be opened."));
    else void this.attach(id);
    this.save();
    return true;
  }

  /** "Open anyway" on a site a focus round held back: let it through for the rest of the round. */
  release(id: number) {
    const tab = this.tabs.find((row) => row.id === id);
    if (!tab?.held) return;
    focus.allow(tab.held);
    tab.held = null;
    if (tab.opened) void browserHost.navigate(id, tab.url).then(() => browserHost.setVisible(id, this.active === id));
    else void this.attach(id);
  }

  back(id: number) { void browserHost.goBack(id); }
  forward(id: number) { void browserHost.goForward(id); }
  reload(id: number) { void browserHost.reload(id); }
  stop(id: number) { void browserHost.stop(id); }

  cycle(reverse = false) {
    if (this.tabs.length < 2) return;
    const index = this.tabs.findIndex(row => row.id === this.active);
    const next = this.tabs[(index + (reverse ? -1 : 1) + this.tabs.length) % this.tabs.length];
    if (next) {
      this.page = null;
      this.show(next.id);
    }
  }

  close(id: number) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    const [tab] = this.tabs.splice(index, 1);
    if (tab?.url) {
      this.closed = [{ url: tab.url, title: tab.title }, ...this.closed].slice(0, 10);
      write(CLOSED_KEY, this.closed);
    }
    if (tab?.opened) void browserHost.close(id);
    this.recent = this.recent.filter(key => key !== id);
    if (this.lastTab === id) this.lastTab = null;
    if (this.active === id) {
      const mode = browserSettings.value.afterClose;
      // Match Zephium's successor policy and prefer another ordinary tab over a pinned item.
      const ordinary = this.tabs.filter(row => !row.pinned);
      const choices = !tab?.pinned && ordinary.length ? ordinary : this.tabs;
      const position = index - (choices === ordinary ? this.tabs.length - ordinary.length : 0);
      const preferred = mode === "recent" ? this.recent.find(key => choices.some(row => row.id === key)) : undefined;
      const slot = Math.max(0, Math.min(choices.length - 1, position - (mode === "previous" ? 1 : 0)));
      const next = preferred ?? choices[slot]?.id;
      if (next !== undefined) this.show(next);
      else { this.page = null; this.newTab(); }
    }
    this.save();
  }

  /** Reopens the most recently closed tab (Ctrl+Shift+T), or a given one from the list. */
  reopen(index = 0) {
    const row = this.closed[index];
    if (!row) return;
    const tab = this.newTab(row.url, true);
    if (tab) {
      this.closed = this.closed.filter((_, i) => i !== index);
      write(CLOSED_KEY, this.closed);
      this.page = null;
      const live = this.tabs.find((r) => r.id === tab.id)!;
      live.title = row.title;
      this.show(tab.id);
    }
  }

  /** Moves a tab to another place in the strip. */
  move(id: number, to: number) {
    const from = this.tabs.findIndex((tab) => tab.id === id);
    if (from < 0) return;
    const [tab] = this.tabs.splice(from, 1);
    this.tabs.splice(Math.max(0, Math.min(to, this.tabs.length)), 0, tab!);
    // A tab dropped among the pinned ones is pinned there; one dragged out of them is not.
    // On the boundary between the two groups a tab keeps what it was.
    const at = this.tabs.findIndex((row) => row.id === id);
    const moved = this.tabs[at]!, prev = this.tabs[at - 1], next = this.tabs[at + 1];
    moved.pinned = prev?.pinned ? Boolean(next?.pinned) || Boolean(moved.pinned) : Boolean(next?.pinned);
    this.keepPinnedFirst();
    this.save();
  }

  /** V33: pins a tab (it goes to the end of the pinned ones) or unpins it (it leads the others). */
  setPinned(id: number, pinned: boolean) {
    const tab = this.tabs.find((row) => row.id === id);
    if (!tab || Boolean(tab.pinned) === pinned) return;
    tab.pinned = pinned;
    // The groups keep their order, so a newly pinned tab ends the pinned ones and an unpinned one leads the rest.
    this.tabs = [...this.tabs.filter((row) => row.pinned), ...this.tabs.filter((row) => !row.pinned)];
    this.save();
  }

  /** Pinned tabs lead the list, each group keeping its own order. */
  private keepPinnedFirst() {
    if (this.tabs.some((tab, index) => tab.pinned && index > 0 && !this.tabs[index - 1]!.pinned)) this.tabs = [...this.tabs.filter((tab) => tab.pinned), ...this.tabs.filter((tab) => !tab.pinned)];
  }

  private remember(url: string, title: string) {
    if (!browserSettings.value.history || !remembered(url)) return;
    const found = this.history.find((visit) => visit.url === url);
    const visit: Visit = { url, title: title || found?.title || "", at: Date.now(), count: (found?.count ?? 0) + 1 };
    this.history = [visit, ...this.history.filter((row) => row.url !== url)].slice(0, HISTORY_LIMIT);
    write(HISTORY_KEY, this.history);
  }

  clearHistory() {
    this.history = [];
    this.closed = [];
    write(HISTORY_KEY, []);
    write(CLOSED_KEY, []);
  }

  private onEvent(event: BrowserHostEvent) {
    if (event.kind === "caption") {
      this.caption = { shown: event.shown, height: event.height, duration: Math.max(0, Math.min(400, Number(event.duration) || 0)) };
      return;
    }
    const tab = this.tabs.find((row) => row.id === event.id);
    if (!tab) return;
    switch (event.kind) {
      case "load":
        tab.loading = event.loading;
        if (event.url && tab.url !== event.url) {
          try { if (new URL(event.url).origin !== new URL(tab.url).origin) { tab.favicon = ""; tab.icon = undefined; } } catch { /* blank tab */ }
          tab.url = event.url;
        }
        if (!event.loading) {
          this.save();
          this.remember(tab.url, tab.title);
          // A link followed inside a page can lead to a held-back site too.
          const held = focus.holds(tab.url, browserSettings.value.focus.sites, browserSettings.value.focus.holdSites);
          if (held && !tab.held) {
            tab.held = held;
            void browserHost.setVisible(tab.id, false);
          }
        }
        break;
      case "title":
        tab.title = event.title;
        this.save();
        if (this.history[0]?.url === tab.url) this.remember(tab.url, event.title);
        break;
      case "media":
        tab.media = { available: event.available, playing: event.playing, muted: event.muted, audible: event.audible };
        break;
      case "favicon":
        tab.favicon = event.url;
        if (event.rgba) tab.icon = event.rgba;
        break;
      case "history":
        tab.back = event.back;
        tab.forward = event.forward;
        break;
      case "failed":
        tab.loading = false;
        tab.error = event.description || "This page could not be loaded.";
        break;
      case "blocked":
        tab.error = "This address can't be opened in a browser tab. Only public websites open here.";
        break;
      case "open-tab":
        this.newTab(event.url, Boolean(event.background));
        break;
      case "shortcut":
        if (event.key === "t" && event.shift) this.reopen();
        else if (event.key === "t") this.newTab();
        else if (event.key === "w") this.close(tab.id);
        else if (event.key === "l") { this.focusFor = event.id; this.focusAddress += 1; }
        else if (event.key === "tab") this.cycle(Boolean(event.shift));
        else window.dispatchEvent(new CustomEvent("aegis-browser-tools-key", { detail: { key: event.key, shift: event.shift } }));
        break;
      case "blocked-count":
        tab.blocked = event.count;
        break;
      case "download":
        tab.download = event.filename ? `${event.filename}: ${event.state === "completed" ? "saved" : event.state === "cancelled" ? "cancelled" : event.state === "interrupted" ? "interrupted" : "downloading"}` : "";
        break;
    }
  }

  dispose() {
    this.unsubscribe?.();
  }
}

export const browserTabs = new BrowserTabs();
// Read by the desktop end-to-end tests (AEGIS's own page; tabs never see it).
if (typeof window !== "undefined") (window as unknown as { __aegisBrowserTabs?: BrowserTabs }).__aegisBrowserTabs = browserTabs;
