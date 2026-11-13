/** The workspace browser's windows, by research, for this page's session. */
import { normalizeAddress } from "./browser-address";

export type BrowserWindowState = {
  id: number;
  researchId: string;
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
};

/** Each window holds a live page. */
const MAX_WINDOWS = 8;

class BrowserWindows {
  all = $state.raw<BrowserWindowState[]>([]);
  researchId = $state("");
  #next = 1;
  #order = 1;

  get shown() {
    return this.all.filter((entry) => entry.researchId === this.researchId);
  }

  #change(id: number, change: Partial<BrowserWindowState>) {
    this.all = this.all.map((entry) => (entry.id === id ? { ...entry, ...change } : entry));
  }

  /** Opens a source, or brings forward the window already showing it. */
  open(address: string, title = "") {
    const url = normalizeAddress(address, location.host) ?? address;
    const existing = this.shown.find((entry) => entry.history[entry.index] === url);
    if (existing) {
      this.#change(existing.id, { minimized: false, order: ++this.#order });
      return existing.id;
    }
    const open = this.shown;
    const kept = open.length >= MAX_WINDOWS ? this.all.filter((entry) => entry.id !== [...open].sort((a, b) => a.order - b.order)[0]!.id) : this.all;
    const id = this.#next++;
    this.all = [...kept, { id, researchId: this.researchId, history: [url], index: 0, title, minimized: false, order: ++this.#order, load: 0, cascade: open.length }];
    return id;
  }

  close(id: number) {
    this.all = this.all.filter((entry) => entry.id !== id);
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
}

export const browser = new BrowserWindows();
