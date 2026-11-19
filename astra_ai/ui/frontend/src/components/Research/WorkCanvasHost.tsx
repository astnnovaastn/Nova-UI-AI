/**
 * Mounts the Research canvas (the Svelte build in /work-canvas) from React.
 * The canvas lives directly under <body>, outside .research-workspace, so neither
 * app's stylesheets reach into the other. Rollback: the "classic" surface setting.
 */
import { useEffect, useRef, useState } from "react";
import { conversationSnapshot } from "../../conversation";
import type { CanvasPanel, CanvasRailPanel } from "../../../work-canvas/src/canvas-panels";

const SURFACE_KEY = "nova-research-surface";
export type ResearchSurface = "canvas" | "classic";

export function researchSurface(): ResearchSurface {
  try {
    const asked = new URLSearchParams(location.search).get("research");
    if (asked === "classic" || asked === "canvas") return asked;
    return localStorage.getItem(SURFACE_KEY) === "classic" ? "classic" : "canvas";
  } catch {
    return "canvas";
  }
}

export function saveResearchSurface(surface: ResearchSurface) {
  try {
    localStorage.setItem(SURFACE_KEY, surface);
  } catch {
    // Without storage the choice lasts only for this page.
  }
}

export type CanvasBridgeState = {
  replyActive?: boolean;
  report: unknown;
  trace: unknown[];
  workSources: unknown[];
  run?: unknown;
  view: {chosen: string[]; hidden: string[]};
  jobId: string;
  jobs: unknown[];
  connected: boolean;
  guest: boolean;
  busy: boolean;
  muted: boolean;
  voiceState: string;
  status: string;
  loading: boolean;
  depth: string;
  panel: CanvasPanel;
  error: string;
};

export type CanvasBridgeActions = {
  prompt(text: string): Promise<boolean> | void;
  stopReply(): void;
  stopJob(jobId: string): void;
  retry(): void;
  microphone(): void;
  openView(view: string): void;
  openSource(url: string): void;
  openPanel(panel: CanvasRailPanel): void;
  newEntry(kind: "research" | "chat" | "documentary"): void;
  attach(): void;
  setDepth(mode: "quick" | "detailed"): void;
  navigate(view: "dashboard" | "memory"): void;
  settings(): void;
  restart(): void;
  repair(): void;
  useClassic(): void;
  imageHeaders(): Record<string, string>;
  renderMarkdown(text: string): string;
  /** The editor's saved HTML, through the same sanitizer the Reader uses. */
  renderHtml?(html: string): string;
  checkFrame(url: string, signal?: AbortSignal): Promise<{embeddable: boolean | null; reason: string}>;
  addWorkSource(url: string, title: string, meta?: Record<string, unknown>): Promise<{duplicate: boolean; title: string} | void>;
  startWork(text: string, options?: {workflow?: string; chosen?: unknown[]; fromResearch?: string}): void;
  askNodes(question: string, nodes: {id: string; kind: string; title: string; url?: string; summary: string}[], runId: string): Promise<boolean> | void;
  answerRun(text: string): void | Promise<void>;
  saveCanvasView(view: {chosen: string[]; hidden: string[]}): void;
  getCanvasLayout(page: string): Promise<import('../../../work-canvas/src/designer/types').LayoutRecord>;
  saveCanvasLayout(page: string, payload: import('../../../work-canvas/src/designer/types').LayoutSave): Promise<import('../../../work-canvas/src/designer/types').LayoutRecord>;
};

type CanvasHandle = {
  update(next: Record<string, unknown>): void;
  setActions(actions: CanvasBridgeActions): void;
  destroy(): void;
};

/** Follows the AEGIS theme: the canvas goes light when the app's background is light. */
function appTheme(): "dark" | "light" {
  const mode = document.documentElement.dataset.appearanceMode;
  if (mode === "dark" || mode === "light") return mode;
  const probe = document.createElement("span");
  probe.style.color = "var(--bg)";
  probe.hidden = true;
  document.body.append(probe);
  const match = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  if (!match || match.length < 3) return "dark";
  const [r, g, b] = match.map(Number) as [number, number, number];
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "light" : "dark";
}

type CanvasModule = {
  mountCanvas(target: HTMLElement, portal: HTMLElement): CanvasHandle;
  mountAskEmpty(target: HTMLElement, context: boolean): { destroy(): void };
  openUnifiedSettings(section?: string): void;
  setWorkspaceHeaders?(value: () => Record<string, string>): void;
};

let loaded: Promise<CanvasModule> | null = null;
function loadCanvas() {
  if (!loaded) {
    if (!document.querySelector("link[data-aegis-work-canvas]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/work-canvas/aegis-work.css";
      link.dataset.aegisWorkCanvas = "";
      document.head.append(link);
    }
    // A public build, not part of this bundle.
    const url = "/work-canvas/aegis-work.js";
    loaded = import(/* @vite-ignore */ url);
    loaded.catch(() => {
      loaded = null;
    });
  }
  return loaded;
}

export async function openUnifiedSettings(section?: string) {
  const module = await loadCanvas();
  module.setWorkspaceHeaders?.(() => ({ "X-Nova-Client": conversationSnapshot().clientId }));
  module.openUnifiedSettings(section);
}

export function ZephiumAskEmpty({ context }: { context: boolean }) {
  const node = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const target = node.current;
    let active = true;
    let handle: { destroy(): void } | undefined;
    void loadCanvas().then(module => {
      if (active && target) handle = module.mountAskEmpty(target, context);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; handle?.destroy(); };
  }, [context]);
  return <div ref={node} className="aegis-work-root research-ask-native research-ask-native-empty">
    {failed && <p>{context ? "Ask a question about this research." : "Open a report to ask about its findings."}</p>}
  </div>;
}

export function WorkCanvasHost({
  visible,
  state,
  actions,
  onFailed,
}: {
  visible: boolean;
  state: CanvasBridgeState;
  actions: CanvasBridgeActions;
  onFailed: (message: string) => void;
}) {
  const handle = useRef<CanvasHandle | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const portal = useRef<HTMLDivElement | null>(null);
  const latest = useRef(actions);
  latest.current = actions;
  const failed = useRef(onFailed);
  failed.current = onFailed;
  const [theme, setTheme] = useState(appTheme);
  const [ready, setReady] = useState(false);
  const [wanted, setWanted] = useState(visible);
  useEffect(() => {
    if (visible) setWanted(true);
  }, [visible]);

  useEffect(() => {
    if (!wanted) return;
    let gone = false;
    const root = document.createElement("div");
    root.className = "aegis-work-root aegis-work-stage";
    root.dataset.material = "aegis";
    const pop = document.createElement("div");
    pop.className = "aegis-work-root aegis-work-portal";
    pop.dataset.material = "aegis";
    document.body.append(root, pop);
    stage.current = root;
    portal.current = pop;
    // Every call reads the current closure, so the canvas never holds stale React state.
    const stable = new Proxy({} as CanvasBridgeActions, {
      get: (_target, key) => (...args: unknown[]) => (latest.current as any)[key](...args),
    });
    loadCanvas()
      .then((module) => {
        if (gone) return;
        const canvas = module.mountCanvas(root, pop);
        // V31: the browser's Today figure reads real tasks with the current workspace session.
        module.setWorkspaceHeaders?.(() => ({ "X-Nova-Client": conversationSnapshot().clientId }));
        canvas.setActions(stable);
        handle.current = canvas;
        setReady(true);
      })
      .catch(() => {
        if (!gone) failed.current("The Research canvas could not load. Using the classic view.");
      });
    return () => {
      gone = true;
      handle.current?.destroy();
      handle.current = null;
      root.remove();
      pop.remove();
      stage.current = null;
      portal.current = null;
      setReady(false);
    };
  }, [wanted]);

  useEffect(() => {
    if (stage.current) stage.current.hidden = !visible;
    if (portal.current) portal.current.hidden = !visible;
  }, [visible, ready]);

  useEffect(() => {
    const follow = () => setTheme(appTheme());
    window.addEventListener("themechange", follow);
    return () => window.removeEventListener("themechange", follow);
  }, []);

  useEffect(() => {
    if (ready) handle.current?.update({ ...state, theme });
  });

  return null;
}
