/**
 * Where a source page is shown.
 *
 * AEGIS Web has only the page it runs in, so a source goes in a sandboxed iframe and a site
 * that forbids framing cannot be shown live. AEGIS Desktop has a native webview per pane: the
 * site loads as a top-level document, exactly as in a browser, so framing rules do not apply
 * and nothing is stripped or proxied.
 *
 * This file is the only place that knows which of the two is running. Components ask the host;
 * they never call the desktop runtime themselves.
 */
export type PaneRect = { x: number; y: number; width: number; height: number };

export type BrowserHostEvent = { id: number } & (
  | { kind: "load"; loading: boolean; url: string }
  | { kind: "title"; title: string }
  | { kind: "history"; back: boolean; forward: boolean }
  /** The person clicked into the page. */
  | { kind: "focus" }
  /** The page asked for a new window; the workspace decides whether to open a pane. */
  /** The page tried to go to an address that is not a public website. */
  | { kind: "blocked"; url: string }
  /** The page offered a file. A source pane saves nothing; a browser tab reports its download's progress. */
  | { kind: "download"; url: string; filename?: string; state?: string; received?: number; total?: number }
  /** V30: a link in a browser tab asked for a new tab. */
  | { kind: "open-tab"; url: string; background?: boolean }
  /** A browser shortcut (Ctrl+T, W, L) pressed while a tab's page had the keyboard. */
  | { kind: "shortcut"; key: string; shift?: boolean }
  /** V31: requests the blocker cancelled on this tab's current page so far. */
  | { kind: "blocked-count"; count: number }
  /** V32: the window caption came out (pointer near the top-right corner) or went quiet. */
  | { kind: "caption"; shown: boolean; height: number; duration?: number }
  | { kind: "favicon"; url: string; rgba?: string }
  /** Where the desktop's resource manager has the page: active, background, suspended (frozen) or hibernated (released). */
  | { kind: "state"; state: string }
  | { kind: "media"; available: boolean; playing: boolean; muted: boolean; audible: boolean }
  /** The page could not be loaded: no connection, unknown name, bad certificate and so on. */
  | { kind: "failed"; code: number; description: string; url: string }
);

export interface ResearchBrowserHost {
  /** "native": a real browser view per pane. "frame": an iframe, where the site permits it. */
  readonly kind: "native" | "frame";
  /** Opens a source in pane `id`, or sends that pane to it. `rect` is in page pixels. */
  openSource(id: number, url: string, rect: PaneRect): Promise<void>;
  navigate(id: number, url: string): Promise<void>;
  goBack(id: number): Promise<void>;
  goForward(id: number): Promise<void>;
  reload(id: number): Promise<void>;
  /** Closes the pane and releases its page. */
  close(id: number): Promise<void>;
  /** A native view is not part of the page, so it is told where the pane is. */
  setBounds(id: number, rect: PaneRect): Promise<void>;
  /** A native view always paints above the page, so it is hidden whenever something covers it. */
  setVisible(id: number, visible: boolean): Promise<void>;
  /** V30: a browser tab (the person's own session, downloads, permission questions). Desktop only. */
  openTab(id: number, url: string, rect: PaneRect): Promise<void>;
  stop(id: number): Promise<void>;
  setPageZoom?(percent: number): Promise<void>;
  media?(id: number, action: "play" | "pause" | "mute" | "unmute"): Promise<void>;
  downloads(): Promise<DownloadRow[]>;
  showDownload(id: number): Promise<void>;
  /** V31 privacy: real counts from the desktop's request filter. */
  blockerStatus(id?: number | null): Promise<BlockerStatus | null>;
  blockerSet(enabled: boolean): Promise<BlockerStatus | null>;
  blockerAllow(host: string, allowed: boolean): Promise<BlockerStatus | null>;
  permissions(): Promise<PermissionRow[]>;
  resetPermissions(origin?: string): Promise<PermissionRow[]>;
  clearData(what: { cookies?: boolean; cache?: boolean }): Promise<void>;
  /** The fallback for anything the pane cannot do: the person's own browser. */
  openExternal(url: string): Promise<void>;
  subscribe(listener: (event: BrowserHostEvent) => void): () => void;
}

export type DownloadRow = { id: number; tab: number | null; url: string; filename: string; state: string; received: number; total: number };

export type BlockerStatus = { enabled: boolean; today: number; sinceStart: number; tab: number; allowed: string[]; topHosts: { host: string; count: number }[]; rules: number | null; started: boolean };
export type PermissionRow = { origin: string } & Record<string, boolean | string>;

type DesktopRuntime = { invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> };
type DesktopWindow = Window & {
  /** AEGIS Desktop (Electron): set by its preload, in the main window's top frame only. */
  aegisDesktop?: DesktopRuntime;
  /** The same commands under a Tauri shell (see src-tauri). */
  __TAURI_INTERNALS__?: DesktopRuntime;
  __aegisBrowserEvent?: (event: BrowserHostEvent) => void;
};

const done = Promise.resolve();

/** The iframe pane drives itself from the window store; nothing native exists to be told. */
const webHost: ResearchBrowserHost = {
  kind: "frame",
  openSource: () => done,
  navigate: () => done,
  goBack: () => done,
  goForward: () => done,
  reload: () => done,
  close: () => done,
  setBounds: () => done,
  setVisible: () => done,
  openTab: () => done,
  stop: () => done,
  downloads: async () => [],
  showDownload: () => done,
  blockerStatus: async () => null,
  blockerSet: async () => null,
  blockerAllow: async () => null,
  permissions: async () => [],
  resetPermissions: async () => [],
  clearData: () => done,
  async openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  },
  subscribe: () => () => {},
};

function desktopHost(runtime: DesktopRuntime, pageZoom: boolean): ResearchBrowserHost {
  const listeners = new Set<(event: BrowserHostEvent) => void>();
  // The desktop shell reports what a pane did by calling this with plain data.
  (window as DesktopWindow).__aegisBrowserEvent = (event) => {
    if (!event || typeof event.id !== "number" || typeof event.kind !== "string") return;
    for (const listener of listeners) listener(event);
  };
  const call = (command: string, args: Record<string, unknown>) => runtime.invoke<void>(command, args);
  /** Moving and hiding are sent many times a second; a late answer for a closed pane is not an error. */
  const quiet = (command: string, args: Record<string, unknown>) => call(command, args).catch(() => {});
  return {
    kind: "native",
    openSource: (id, url, rect) => call("browser_open", { id, url, rect }),
    navigate: (id, url) => call("browser_navigate", { id, url }),
    goBack: (id) => call("browser_back", { id }),
    goForward: (id) => call("browser_forward", { id }),
    reload: (id) => call("browser_reload", { id }),
    close: (id) => quiet("browser_close", { id }),
    setBounds: (id, rect) => quiet("browser_bounds", { id, rect }),
    setVisible: (id, visible) => quiet("browser_show", { id, visible }),
    openTab: (id, url, rect) => call("tab_open", { id, url, rect }),
    stop: (id) => quiet("browser_stop", { id }),
    media: pageZoom ? (id, action) => call("tab_media", { id, action }) : undefined,
    setPageZoom: pageZoom ? (percent) => call("tab_zoom", { percent }) : undefined,
    downloads: () => runtime.invoke<DownloadRow[]>("tab_downloads", {}),
    showDownload: (id) => quiet("download_show", { id }),
    blockerStatus: (id) => runtime.invoke<BlockerStatus>("blocker_status", id == null ? {} : { id }).catch(() => null),
    blockerSet: (enabled) => runtime.invoke<BlockerStatus>("blocker_set", { enabled }),
    blockerAllow: (host, allowed) => runtime.invoke<BlockerStatus>("blocker_allow", { host, allowed }),
    permissions: () => runtime.invoke<PermissionRow[]>("permissions_list", {}),
    resetPermissions: (origin) => runtime.invoke<PermissionRow[]>("permissions_reset", origin ? { origin } : {}),
    clearData: (what) => runtime.invoke<void>("tab_clear_data", what),
    openExternal: (url) => call("open_external", { url }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function detect(): ResearchBrowserHost {
  const page = typeof window === "undefined" ? undefined : (window as DesktopWindow);
  const runtime = page?.aegisDesktop ?? page?.__TAURI_INTERNALS__;
  return runtime && typeof runtime.invoke === "function" ? desktopHost(runtime, Boolean(page?.aegisDesktop)) : webHost;
}

export const browserHost: ResearchBrowserHost = detect();

/** V33: a folder or file the person chose in the desktop's own dialog (desktop/work-dev.cjs). */
export type GrantedFolder = { id: string; title: string; path: string; write: boolean; files?: string[]; file?: string };
export type PageMeta = { url: string; title: string; description: string; site: string; image: string; canonical: string; kind: string; channel: string };

/**
 * V33 desktop-only requests for AEGIS Work: native Open Folder / Open File, the page metadata Add to Work
 * keeps, and pausing a source window's player before its page opens in a tab. AEGIS Web has none of them.
 */
export const desktopWork = (() => {
  const page = typeof window === "undefined" ? undefined : (window as DesktopWindow);
  const runtime = page?.aegisDesktop;
  const available = Boolean(runtime && typeof runtime.invoke === "function");
  const call = <T,>(command: string, args: Record<string, unknown> = {}) => (available ? runtime!.invoke<T>(command, args) : Promise.reject(new Error("Folder access needs AEGIS Desktop.")));
  return {
    available,
    selectFolder: (options: { write?: boolean; title?: string } = {}) => call<GrantedFolder | null>("dev_folder_select", options),
    selectFile: () => call<GrantedFolder | null>("dev_file_select"),
    folders: () => (available ? call<GrantedFolder[]>("dev_folders") : Promise.resolve([] as GrantedFolder[])),
    revoke: (id: string) => call<GrantedFolder[]>("dev_folder_revoke", { id }),
    pageMeta: (id: number) => (available ? call<PageMeta | null>("tab_page_meta", { id }).catch(() => null) : Promise.resolve(null)),
    mediaHandoff: (id: number) => (available ? call<{ time: number | null; playing: boolean; count: number }>("media_handoff", { id }).catch(() => ({ time: null, playing: false, count: 0 })) : Promise.resolve({ time: null, playing: false, count: 0 })),
  };
})();
