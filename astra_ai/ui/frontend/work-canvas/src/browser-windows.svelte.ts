/** The workspace browser's windows, by research, for this page's session. */
import { normalizeAddress } from "./browser-address";

export type BrowserWindowState = {
  id: number;
  researchId: string;
  sourceUrl: string;
  sourceId?: string;
  control: string;
  /** The addresses this window itself opened; a framed site's own links can't be seen from here. */
  history: string[];
  index: number;
  /** Title of the source that originally opened this window. */
  title: string;
  minimized: boolean;
  /** Raises the window: the highest stands in front. */
  order: number;
  /** Which load of the page this is; going up reloads it. */
  load: number;
  /** How many windows were open when this one opened, so a new one doesn't hide the last. */
  cascade: number;
  /** AEGIS Desktop only: what the pane's own browser view is showing, links followed included. */
  live?: LivePage;
};

export type LivePage = {
  url: string;
  title: string;
  loading: boolean;
  back: boolean;
  forward: boolean;
  /** Where the address this window was sent to ended up, after the site's own redirects. */
  landed: string;
  favicon: string;
};

/** The address a window shows: the source it was opened for while still on that page, else wherever it went. */
export function addressOf(entry: BrowserWindowState): string {
  const asked = entry.history[entry.index] ?? "";
  const live = entry.live;
  return !live?.url || live.url === live.landed ? asked : live.url;
}

/** Each window holds a live page. */
const MAX_WINDOWS = 8;

export class BrowserWindows {
  all = $state.raw<BrowserWindowState[]>([]);
  researchId = $state("");
  #next = 1;
  #order = 1;
  #activation: Event | undefined;
  #dormant = new Map<string, BrowserWindowState>();

  get shown() {
    return this.all.filter((entry) => entry.researchId === this.researchId);
  }

  /** Upstream canvas callbacks carry IDs. Scope their activation to the originating DOM event. */
  capture(event: Event) {
    if (!event.isTrusted) return;
    if (event instanceof KeyboardEvent && !["o", "enter", " "].includes(event.key.toLowerCase())) return;
    this.#activation = event;

  }

  selectResearch(id: string) {
    if (id === this.researchId) return;
    for (const entry of this.all) {
      const key = JSON.stringify([entry.researchId, entry.sourceUrl]);
      this.#dormant.delete(key);
      this.#dormant.set(key, entry);
      this.#log("close", entry);
    }
    while (this.#dormant.size > 64) this.#dormant.delete(this.#dormant.keys().next().value!);
    this.all = [];
    this.researchId = id;
  }

  #log(action: "open" | "close", entry: BrowserWindowState) {
    if (import.meta.env.DEV) console.debug("[AEGIS source browser]", {
      action, control: entry.control, sourceId: entry.sourceId, paneId: entry.id,
      site: new URL(entry.sourceUrl).origin, at: new Date().toISOString(),
    });
  }

  #change(id: number, change: Partial<BrowserWindowState>) {
    this.all = this.all.map((entry) => (entry.id === id ? { ...entry, ...change } : entry));
  }

  /** Opens a source, or brings forward the window already showing it. */
  open(address: string, title = "", control = "canvas", sourceId?: string, activation = this.#activation) {
    if (!this.researchId || !activation?.isTrusted || activation.eventPhase === Event.NONE || activation !== this.#activation) return;
    const url = normalizeAddress(address, location.host);
    if (!url) return;
    const existing = this.shown.find((entry) => entry.sourceUrl === url);
    if (existing) {
      this.#change(existing.id, { minimized: false, order: ++this.#order });
      return existing.id;
    }
    const open = this.shown;
    if (open.length >= MAX_WINDOWS) this.close([...open].sort((a, b) => a.order - b.order)[0]!.id);
    const id = this.#next++;
    const previous = this.#dormant.get(JSON.stringify([this.researchId, url]));
    const entry = { id, researchId: this.researchId, sourceUrl: url, sourceId, control, history: [url], index: 0,
      title: title || previous?.title || "", minimized: false, order: ++this.#order, load: 0, cascade: open.length };
    this.all = [...this.all, entry];
    this.#log("open", entry);
    return id;
  }

  close(id: number) {
    const entry = this.all.find((row) => row.id === id);
    if (!entry) return;
    this.all = this.all.filter((row) => row.id !== id);
    this.#log("close", entry);
  }

  raise(id: number) {
    if (this.all.find((entry) => entry.id === id)?.order === this.#order) return;
    this.#change(id, { order: ++this.#order });
  }

  minimize(id: number, minimized: boolean) {
    this.#change(id, { minimized, ...(minimized ? {} : { order: ++this.#order }) });
  }

  /** The address bar: a new address drops anything ahead of the current one, as in any browser. */
  navigate(id: number, url: string) {
    const entry = this.all.find((row) => row.id === id);
    if (!entry) return;
    if (entry.history[entry.index] === url) {
      this.reload(id);
      return;
    }
    const history = [...entry.history.slice(0, entry.index + 1), url];
    this.#change(id, { history, index: history.length - 1 });
  }

  step(id: number, by: -1 | 1) {
    const entry = this.all.find((row) => row.id === id);
    if (!entry) return;
    const index = entry.index + by;
    if (index >= 0 && index < entry.history.length) this.#change(id, { index });
  }

  reload(id: number) {
    const entry = this.all.find((row) => row.id === id);
    if (entry) this.#change(id, { load: entry.load + 1 });
  }

  /** AEGIS Desktop: the pane's browser view reported where it is or what it is doing. */
  report(id: number, change: Partial<LivePage>) {
    const entry = this.all.find((row) => row.id === id);
    if (!entry) return;
    const live = { url: "", title: "", loading: false, back: false, forward: false, landed: "", favicon: "", ...entry.live, ...change };
    // The first page to finish loading is where the asked-for address led.
    if (!live.landed && change.loading === false && live.url) live.landed = live.url;
    this.#change(id, { live });
  }

  /** AEGIS Desktop: the address bar sent the pane somewhere new, which becomes what it was asked for. */
  sent(id: number, url: string) {
    const entry = this.all.find((row) => row.id === id);
    if (!entry) return;
    const history = [...entry.history.slice(0, entry.index + 1), url];
    this.#change(id, { history, index: history.length - 1, live: entry.live && { ...entry.live, landed: "" } });
  }
}

export const browser = new BrowserWindows();
