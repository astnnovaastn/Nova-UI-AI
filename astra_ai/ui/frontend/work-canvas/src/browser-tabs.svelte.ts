/**
 * V30: the person's browser tabs in AEGIS Desktop. One Work tab (the canvas) is always first; the
 * others are real web pages in native views on the person's own session (desktop/user-tabs.cjs).
 *
 * A tab's lifecycle is its own: it never belongs to a research source card, and closing a run or a
 * card never closes a tab. Only the shown tab has a live view; the rest are created when first
 * shown (lazy) and are frozen and later released by the desktop's resource manager when hidden.
 * Tabs (address and title only) are restored after a restart; nothing about their pages is stored.
 */
import { browserHost, type BrowserHostEvent, type PaneRect } from "./browser-host";
import { DEFAULT_ENGINE, resolveEntry, type EngineSetting } from "./search-engines";

export type BrowserTab = {
  id: number;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  back: boolean;
  forward: boolean;
  error: string;
  /** A native view exists for it (it has been shown at least once since the app started). */
  opened: boolean;
  download: string;
};

const TABS_KEY = "aegis-browser-tabs-v1";
const ENGINE_KEY = "aegis-search-engine-v1";
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
    /* private window or storage blocked: tabs simply are not restored */
  }
}

const blank = (id: number, url = "", title = ""): BrowserTab => ({ id, url, title, favicon: "", loading: false, back: false, forward: false, error: "", opened: false, download: "" });

class BrowserTabs {
  readonly available = browserHost.kind === "native";
  tabs = $state<BrowserTab[]>([]);
  /** "work" is the canvas; otherwise a tab id. */
  active = $state<"work" | number>("work");
  engine = $state<EngineSetting>(read(ENGINE_KEY, DEFAULT_ENGINE));
  /** Where the page area is, in page pixels; set by the browser surface. */
  rect: PaneRect | null = null;
  /** A tab that wants its address field focused (a new, empty tab). */
  focusAddress = $state(0);
  private next = FIRST_ID;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (!this.available) return;
    const saved = read<{ url: string; title: string }[]>(TABS_KEY, []);
    for (const row of saved.slice(0, 16)) if (typeof row?.url === "string" && row.url) this.tabs.push(blank(this.next++, row.url, String(row.title ?? "")));
    this.unsubscribe = browserHost.subscribe((event) => this.onEvent(event));
  }

  get current(): BrowserTab | null {
    return typeof this.active === "number" ? (this.tabs.find((tab) => tab.id === this.active) ?? null) : null;
  }

  private save() {
    write(TABS_KEY, this.tabs.filter((tab) => tab.url).map((tab) => ({ url: tab.url, title: tab.title })));
  }

  setEngine(setting: EngineSetting) {
    this.engine = setting;
    write(ENGINE_KEY, setting);
  }

  /** A new tab: empty, with its address field focused; or straight to `url`. */
  newTab(url = "", background = false): BrowserTab | null {
    if (!this.available || this.tabs.length >= 16) return null;
    const tab = blank(this.next++, url);
    this.tabs.push(tab);
    if (!background) this.show(tab.id);
    if (!url && !background) this.focusAddress += 1;
    this.save();
    return tab;
  }

  /** Shows a tab (or the Work canvas). Only the shown tab's view is visible. */
  show(target: "work" | number) {
    const before = this.active;
    this.active = target;
    if (typeof before === "number" && before !== target) void browserHost.setVisible(before, false);
    if (typeof target === "number") void this.attach(target);
  }

  /** The shown tab's view goes where the page area is; it is created there the first time. */
  async attach(id = this.active) {
    if (typeof id !== "number" || !this.rect) return;
    const tab = this.tabs.find((row) => row.id === id);
    if (!tab || !tab.url) return;
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
    if (this.active === id) await browserHost.setVisible(tab.id, true);
  }

  setRect(rect: PaneRect | null) {
    this.rect = rect;
    if (typeof this.active === "number" && rect) void browserHost.setBounds(this.active, rect);
  }

  /** Hides the shown tab's native view, for anything drawn over the page (a menu, a dialog). */
  cover(covered: boolean) {
    if (typeof this.active === "number" && this.current?.opened) void browserHost.setVisible(this.active, !covered);
  }

  /** What the person typed in the address bar: an address, or a search with their engine. */
  go(id: number, input: string): boolean {
    const tab = this.tabs.find((row) => row.id === id);
    const entry = resolveEntry(input, this.engine);
    if (!tab || !entry) return false;
    tab.error = "";
    tab.url = entry.url;
    tab.loading = true;
    if (tab.opened) void browserHost.navigate(id, entry.url).catch((error) => (tab.error = error instanceof Error ? error.message : "This page could not be opened."));
    else void this.attach(id);
    this.save();
    return true;
  }

  back(id: number) { void browserHost.goBack(id); }
  forward(id: number) { void browserHost.goForward(id); }
  reload(id: number) { void browserHost.reload(id); }
  stop(id: number) { void browserHost.stop(id); }

  close(id: number) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    const [tab] = this.tabs.splice(index, 1);
    if (tab?.opened) void browserHost.close(id);
    if (this.active === id) this.show(this.tabs[index]?.id ?? this.tabs[index - 1]?.id ?? "work");
    this.save();
  }

  private onEvent(event: BrowserHostEvent) {
    const tab = this.tabs.find((row) => row.id === event.id);
    if (!tab) return;
    switch (event.kind) {
      case "load":
        tab.loading = event.loading;
        if (event.url) tab.url = event.url;
        if (!event.loading) this.save();
        break;
      case "title":
        tab.title = event.title;
        this.save();
        break;
      case "favicon":
        tab.favicon = event.url;
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
      case "shortcut":
        if (event.key === "t") this.newTab();
        else if (event.key === "w") this.close(tab.id);
        else if (event.key === "l") this.focusAddress += 1;
        break;
      case "open-tab":
        this.newTab(event.url, Boolean(event.background));
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
