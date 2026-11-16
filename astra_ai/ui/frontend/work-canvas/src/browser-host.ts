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
  /** The page offered a file; nothing was saved. */
  | { kind: "download"; url: string }
  | { kind: "favicon"; url: string }
  /** Where the desktop's resource manager has the page: active, background, suspended (frozen) or hibernated (released). */
  | { kind: "state"; state: string }
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
  /** The fallback for anything the pane cannot do: the person's own browser. */
  openExternal(url: string): Promise<void>;
  subscribe(listener: (event: BrowserHostEvent) => void): () => void;
}

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
  async openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  },
  subscribe: () => () => {},
};

function desktopHost(runtime: DesktopRuntime): ResearchBrowserHost {
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
  return runtime && typeof runtime.invoke === "function" ? desktopHost(runtime) : webHost;
}

export const browserHost: ResearchBrowserHost = detect();
