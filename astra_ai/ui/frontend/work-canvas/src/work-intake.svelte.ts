/**
 * V33 Add to Work from a page browsed in AEGIS (a browser tab), as the source windows already could.
 *
 * The page goes to the Work session open on the canvas, as a reference: its address, title, the page's own
 * short metadata (description, preview image, canonical address, site) and where it came from
 * ("browser_tab"). The canvas then shows it among that session's pages (research-to-run, work-source lanes).
 * The same page twice is one reference (pageKey). With no session open, Work opens on the Research library,
 * the existing way to choose a destination; the page is added to the session the person opens there, and
 * no new session is ever created for it.
 */
import { browserTabs, type BrowserTab } from "./browser-tabs.svelte";
import { desktopWork } from "./browser-host";
import { store } from "./store.svelte";
import { samePage } from "./work-handoff";
import { youtubeVideoId } from "./video-player";

export type IntakeStatus = "idle" | "adding" | "added" | "already" | "choose" | "failed";
type Pending = { url: string; title: string; tab: number; at: number };
const PENDING_FOR = 3 * 60_000;

class WorkIntake {
  status = $state<{ tab: number; kind: IntakeStatus; text: string }>({ tab: -1, kind: "idle", text: "" });
  pending = $state<Pending | null>(null);

  /** Where Add to Work puts a page: the open session, or none. */
  get destination(): { id: string; title: string } | null {
    const report = store.state.report;
    return report?.research_id ? { id: report.research_id, title: report.display_title || report.query || "this Work" } : null;
  }

  isAdded(url: string): boolean {
    return (store.state.workSources ?? []).some((row) => samePage(row.url, url));
  }

  async add(tab: BrowserTab | null) {
    if (!tab?.url || !/^https?:\/\//.test(tab.url) || this.status.kind === "adding") return;
    const destination = this.destination;
    if (!destination) {
      // The existing destination flow: Work, with the Research library open to choose a session.
      this.pending = { url: tab.url, title: tab.title, tab: tab.id, at: Date.now() };
      this.status = { tab: tab.id, kind: "choose", text: "Choose the Work session in the library; this page is added to it." };
      browserTabs.show("work");
      if (store.state.panel !== "history") store.actions?.openPanel("history");
      return;
    }
    await this.send(tab.id, tab.url, tab.title, destination.title);
  }

  private async send(tabId: number, url: string, title: string, where: string) {
    if (this.isAdded(url)) {
      this.status = { tab: tabId, kind: "already", text: `Already in ${where}.` };
      return;
    }
    this.status = { tab: tabId, kind: "adding", text: "Adding…" };
    try {
      const meta = await desktopWork.pageMeta(tabId);
      const address = meta?.url && samePage(meta.url, url) ? meta.url : url;
      const added = await store.actions?.addWorkSource(address, meta?.title || title, {
        provenance: youtubeVideoId(address) ? "video" : "browser_tab",
        ...(meta?.description ? { description: meta.description } : {}),
        ...(meta?.site ? { site: meta.site } : {}),
        ...(meta?.image ? { image: meta.image } : {}),
        ...(meta?.canonical ? { canonical: meta.canonical } : {}),
        ...(meta?.kind ? { kind: meta.kind } : {}),
        ...(meta?.channel ? { channel: meta.channel } : {}),
      });
      if (!added && !this.isAdded(address)) throw new Error(store.state.error || "The page could not be added.");
      this.status = { tab: tabId, kind: added && added.duplicate ? "already" : "added", text: added && added.duplicate ? `Already in ${where}.` : `Added to ${where}.` };
    } catch (error) {
      this.status = { tab: tabId, kind: "failed", text: error instanceof Error ? error.message : "The page could not be added." };
    }
  }

  /** A session was opened after Add to Work asked for one: the page goes there. */
  private resume() {
    const waiting = this.pending;
    const destination = this.destination;
    if (!waiting || !destination || store.state.loading) return;
    this.pending = null;
    if (Date.now() - waiting.at > PENDING_FOR) {
      this.status = { tab: waiting.tab, kind: "idle", text: "" };
      return;
    }
    void this.send(waiting.tab, waiting.url, waiting.title, destination.title);
  }

  cancel() {
    this.pending = null;
    this.status = { tab: -1, kind: "idle", text: "" };
  }

  constructor() {
    if (typeof window === "undefined") return;
    $effect.root(() => {
      $effect(() => {
        void store.state.report?.research_id;
        void store.state.loading;
        if (this.pending) queueMicrotask(() => this.resume());
      });
    });
  }
}

export const workIntake = new WorkIntake();
if (typeof window !== "undefined") (window as unknown as { __aegisWorkIntake?: WorkIntake }).__aegisWorkIntake = workIntake;
