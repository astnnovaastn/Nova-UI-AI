/** Everything the React host tells the canvas, and what the canvas can ask of it. */
import type { ResearchReport } from "./research-to-run";
import type { TraceEvent } from "./research-trace";
import type { CanvasView, WorkRun } from "./work-run";
import type {LayoutRecord,LayoutSave} from "./designer/types";

export type ResearchJob = { id: string; title?: string; state: string; completed?: number; total?: number; step?: string };

export type CanvasActions = {
  /** Sends a prompt: starts research, or follows up when a report is open. */
  prompt(text: string): void;
  stopJob(jobId: string): void;
  /** Asks the backend to run a failed research again. */
  retry(): void;
  microphone(): void;
  /** Opens the real report: Reader, Edit, Sources or Media. */
  openView(view: string): void;
  openSource(url: string): void;
  /** Asks the backend's video search for more videos on the open research (a real search request). */
  findVideos?(): void;
  openPanel(panel: "history" | "conversation"): void;
  newEntry(kind: "research" | "chat" | "documentary"): void;
  attach(): void;
  setDepth(mode: "quick" | "detailed"): void;
  navigate(view: "dashboard" | "memory"): void;
  settings(): void;
  restart(): void;
  repair(): void;
  useClassic(): void;
  imageHeaders(): Record<string, string>;
  /** The Reader's sanitizer: report Markdown to safe HTML. */
  renderMarkdown(text: string): string;
  /** Whether a public page allows being shown here. Only a verdict comes back, never the page. */
  checkFrame(url: string, signal?: AbortSignal): Promise<{ embeddable: boolean | null; reason: string }>;
  /** Saves a reference to this page on the open research. */
  addWorkSource(url: string, title: string): Promise<void>;
  /** Starts a work run: the lead plans it and assigns only the workers it needs. */
  startWork(text: string, options?: { workflow?: string; chosen?: unknown[]; fromResearch?: string }): void;
  /** Asks AEGIS about canvas cards; the reply appears in the conversation. */
  askNodes(question: string, nodes: { id: string; kind: string; title: string; url?: string; summary: string }[], runId: string): void;
  /** Answers the question the lead asked before starting. */
  answerRun(text: string): void;
  /** Saves which cards are chosen and removed. Saved research is never touched. */
  saveCanvasView(view: CanvasView): void;
  getCanvasLayout(page: string): Promise<LayoutRecord>;
  saveCanvasLayout(page: string, payload: LayoutSave): Promise<LayoutRecord>;
};

export type CanvasState = {
  report: ResearchReport | null;
  /** The backend's record of the open research, in order. */
  trace: readonly TraceEvent[];
  /** Addresses the person added from the workspace browser. */
  workSources: readonly { url: string }[];
  /** The work run behind the open report. Older research has none (null), and draws as it always did. Undefined until asked. */
  run: WorkRun | null | undefined;
  view: CanvasView;
  /** The running job behind the open report, when there is one. */
  jobId: string;
  jobs: ResearchJob[];
  connected: boolean;
  guest: boolean;
  busy: boolean;
  muted: boolean;
  /** What the voice and chat session is doing: idle, listening, thinking, speaking. */
  voiceState: string;
  status: string;
  loading: boolean;
  depth: "quick" | "detailed";
  theme: "dark" | "light";
  panel: string;
  error: string;
};

class CanvasStore {
  state = $state.raw<CanvasState>({
    report: null,
    trace: [],
    workSources: [],
    run: undefined,
    view: { chosen: [], hidden: [] },
    jobId: "",
    jobs: [],
    connected: false,
    guest: false,
    busy: false,
    muted: true,
    voiceState: "idle",
    status: "",
    loading: false,
    depth: "detailed",
    theme: "dark",
    panel: "",
    error: "",
  });
  actions = $state.raw<CanvasActions | null>(null);
}

export const store = new CanvasStore();
