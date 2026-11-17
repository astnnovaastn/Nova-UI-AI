/*
 * AEGIS Agent Execution Lab — shared types.
 *
 * Three vocabularies meet here and are kept apart on purpose:
 *   - Zephium's own records (WorkStepKindV1, WorkPartFactV1, WorkInputFactV1, WorkArtifactV1),
 *     which the lab projects into Zephium's wire format so the genuine canvas can draw them;
 *   - the AEGIS-proposed execution event (`AgentEvent`), one shape for the simulator and for a
 *     later live mode;
 *   - the fixture script (`Script`), which is what a deterministic fixture says the model
 *     "decided". It stands in for model output and is never presented as real model output.
 */
import type { WorkArtifactV1 } from "$shared/ipc/bindings";

export type Data = WorkArtifactV1["data"];
export type Helper = "browser" | "research" | "computer" | "connection";
export type Persona =
  | "developer"
  | "designer"
  | "marketing"
  | "manager"
  | "student"
  | "office"
  | "founder"
  | "research";

/** Whose contract a thing follows. */
export type Origin = "zephium" | "aegis" | "lab";

/* ───────────── fixture scripts: what the (simulated) model asked for ───────────── */

export type Sources = string[]; // page URLs, file paths or record names the object rests on

export type LeadCall =
  | { tool: "load_skill"; name: string }
  | { tool: "web_search"; query: string; freshness?: "day" | "week" | "month" | "year" }
  | { tool: "web_fetch"; url: string }
  | { tool: "start_part"; part: PartScript }
  | {
      tool: "create";
      kind: string;
      title: string;
      data: Record<string, unknown>;
      sources?: Sources;
      part?: string;
      id?: string;
      after?: string[];
      /** The script's other branch: the model makes this only when nothing it depends on was declined. */
      unlessDeclined?: boolean;
    }
  | { tool: "revise"; target: string; data: Record<string, unknown>; sources?: Sources }
  | { tool: "read_canvas" }
  | { tool: "ask"; question: string; options: string[]; answer: string }
  | { tool: "ask_folder"; why: string; folder?: string }
  | { tool: "describe_project"; path: string }
  | { tool: "search_notes"; query: string }
  | { tool: "list_tasks" }
  | { tool: "day_sources" }
  | { tool: "list_tabs" }
  | { tool: "recall"; query: string }
  | { tool: "remember"; fact: string }
  | {
      tool: "finish";
      reply: Record<string, unknown>;
      sources?: Sources;
      say: string;
      followups?: string[];
      title?: string;
      /** The reply when a step this run depends on was declined. */
      declined?: Record<string, unknown>;
    };

export type HelperCall =
  | { tool: "web_search"; query: string }
  | { tool: "read"; url: string }
  | { tool: "browse"; start: string; goal: string; mine?: boolean; view?: boolean; records?: string[] }
  | { tool: "glob"; pattern: string }
  | { tool: "grep"; pattern: string; glob?: string }
  | { tool: "read_file"; path: string; offset?: number; limit?: number }
  | { tool: "edit"; path: string; old: string; new: string }
  | { tool: "write"; path: string; text: string }
  | { tool: "python_tests"; tests: string[] }
  | { tool: "git_changes"; paths: string[]; operation: "diff" | "status" | "check" }
  | { tool: "bash"; command: string }
  | { tool: "describe_project"; path: string }
  | { tool: "connection"; service: string; tool_name: string; verb: string; target?: string };

export type PartScript = {
  /** Stable id for the fixture; the run gives the part its own id. */
  key: string;
  title: string;
  helper: Helper;
  goal: string;
  brief?: string;
  /** A site's bare host, or a connection's name. */
  service?: string;
  /** For a part about the person's own app: the run asks how to reach it, once. */
  asks?: {
    question: string;
    options: string[];
    answer: string;
    purpose: "entry" | "connection" | "context" | "confirm" | "question";
    /** Parts started together share one entry question (hands.rs EntryDesk): the same key answers all. */
    shared?: string;
  };
  turns: { say: string; calls: HelperCall[] }[];
  /** The part's one compact object (picks or a small sheet), placed at the end of its row. */
  create?: { kind: "picks" | "sheet"; title: string; data: Record<string, unknown>; sources?: Sources };
  finish: { summary: string; digest: string; found?: boolean };
};

export type Turn = { say: string; calls: LeadCall[] };

export type WorkflowFixture = {
  id: string;
  title: string;
  persona: Persona;
  /** The built-in skill the workflow starts with (Zephium's grant.skill), if any. */
  skill?: string;
  /** Zephium: the workflow exists in frame/src/features/work/lib/start/workflows.ts. AEGIS: only in core/work/catalog.py. */
  origin: "zephium" | "aegis";
  prompt: string;
  examples: string[];
  /** What the person attached: inputs drawn left of the request. */
  attached?: { kind: "notes" | "tabs" | "files" | "work" | "memory"; label: string; count?: number }[];
  folder?: string;
  /** Tools this fixture needs, so the permission panel can explain a refusal. */
  needs: Permission[];
  turns: Turn[];
  /** Short note on how faithful the fixture is to the skill and the source. */
  fidelity: string;
  /** The AEGIS workflow's stage pipeline today (catalog.py mode), for comparison. */
  aegisMode?: "direct" | "quick" | "deep" | "structured";
  stress?: boolean;
};

/* ───────────── permissions and model roles the person controls ───────────── */

export type Permission = "web" | "browser" | "session" | "folder_read" | "file_write" | "tests" | "commands" | "connections" | "personal";

export type Role = "lead" | "page" | "light";

/* ───────────── the AEGIS-proposed execution event ───────────── */

export type EventKind =
  | "run_created"
  | "prompt_received"
  | "input_attached"
  | "skill_loaded"
  | "model_turn"
  | "plan_created"
  | "task_queued"
  | "task_started"
  | "task_waiting"
  | "tool_called"
  | "tool_completed"
  | "tool_refused"
  | "source_collected"
  | "approval_requested"
  | "user_approved"
  | "user_declined"
  | "artifact_created"
  | "artifact_refused"
  | "task_completed"
  | "task_failed"
  | "run_completed"
  | "run_stopped";

export type AgentEvent = {
  seq: number;
  id: string;
  /** Simulated milliseconds since the run began. The clock stands still while the person decides. */
  t: number;
  kind: EventKind;
  /** "lead", a part id, "app" (Rust admitting or refusing) or "person". */
  actor: string;
  turn?: number;
  part?: string;
  step?: string;
  /** The event that caused this one (a tool call's turn, a result's call). */
  cause?: string;
  label: string;
  detail?: string;
  data?: Record<string, unknown>;
  /** The Zephium record this event mirrors, or why it has none. */
  zephium: string;
  /** Rust handler that would own it in Zephium. */
  handler?: string;
  origin: Origin;
  /** Set on tool events: the tool's registry id. */
  tool?: string;
  /** Set on approval events: the decision key the person answers. */
  decision?: string;
  /** Simulated duration of the operation this event closes. */
  ms?: number;
  error?: string;
};

export type Decisions = Record<string, "approve" | "decline">;

export type SimOptions = {
  permissions: Record<Permission, boolean>;
  models: Record<Role, string>;
  /** Which approvals the person has answered, by decision key. */
  decisions: Decisions;
  /** Stop when an approval has no decision yet (interactive), or approve by default (auto). */
  interactive: boolean;
};

export type SimResult = {
  events: AgentEvent[];
  /** Waiting on this decision key; events stop there. */
  waiting?: string;
  /** How often a tool handler actually ran while producing these events. */
  handlerCalls: number;
};
