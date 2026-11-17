/*
 * AEGIS Agent Execution Lab — the deterministic execution simulator.
 *
 * A fixture says what the (simulated) model asked for, turn by turn. This engine does what
 * Zephium's Rust does with such a request: it admits or refuses every call, runs the
 * admitted ones against local mock handlers, starts parts under the four-slot limit, holds
 * anything that needs the person, validates every object, and records each settled thing as
 * an ordered event. The rules it applies are cited at each step; the clock is simulated.
 *
 * The model is never called. A fixture's turns are recorded decisions, not live output.
 */
import { leadObject, ownedView } from "$features/work/lib/board/objects";
import type { WorkArtifactV1 } from "$shared/ipc/bindings";
import { capabilityFaults, modelOf } from "./providers";
import { REQUIRED, LEAD_KINDS, PART_KINDS, toolOf } from "./tools";
import { describeProject, edit, gitChanges, glob, grep, pythonTests, readFile, ROOT, SampleRepo } from "./repo";
import { forRequest, skillLabel, skillOf } from "./skills";
import { hostOf, pageAt, search } from "./web";
import type {
  AgentEvent,
  EventKind,
  HelperCall,
  LeadCall,
  PartScript,
  Permission,
  Role,
  SimOptions,
  SimResult,
  WorkflowFixture,
} from "./types";

/** parts.rs PARALLEL_PARTS and core parts.rs MAX_WORK_PARTS. */
export const PARALLEL_PARTS = 4;
export const MAX_WORK_PARTS = 16;
/** lead.rs LEAD_SEARCHES / LEAD_READS; parts.rs PART_SEARCHES. */
/** Kinds the frame still draws through the board adapter's blocks (lib/board/adapter.ts → legacyView). */
const BLOCK_KINDS = ["diagram", "code", "document"];
const LEAD_SEARCHES = 4;
const LEAD_READS = 8;
const PART_SEARCHES = 4;

const MS: Record<string, number> = {
  lead_turn: 1600,
  helper_turn: 900,
  web_search: 900,
  web_fetch: 1500,
  read: 1500,
  browse: 4200,
  glob: 120,
  grep: 140,
  read_file: 80,
  edit: 60,
  write: 60,
  python_tests: 1800,
  git_changes: 200,
  bash: 20,
  describe_project: 420,
  connection: 700,
  create: 120,
  revise: 120,
  personal: 260,
  load_skill: 10,
  read_canvas: 30,
  finish: 120,
};

const RULE = {
  folder: "helper.rs session(): \"No folder is granted in this run.\"",
  web: "lab permission: public web reads are off (in Zephium the grant always allows public reads; a private run only changes whose storage pages use)",
  session: "hands.rs enter_sites: working in the person's session needs their entry answer",
};

type Draft = Omit<AgentEvent, "seq">;

/** Every tool handler run on this page, by any simulation. A replay must not move it. */
let handlersEver = 0;
export const handlerTotal = () => handlersEver;

type Placed = { artifact: string; kind: string; title: string; part?: string; sources: string[] };

/** `startedSkill`: the workflow skill the run starts with (grant.skill); null when it starts from a typed request. */
export function simulate(fx: WorkflowFixture, opts: SimOptions, request = fx.prompt, started: string | null = fx.skill ?? null): SimResult {
  const startedSkill = started ?? undefined;
  const drafts: Draft[] = [];
  let counter = 0;
  let handlerCalls = 0;
  let waitingAt = Infinity;
  let waiting: string | undefined;
  const sources = new Map<string, string>(); // url / path / record → s-key
  const placed = new Map<string, Placed>(); // fixture object id → artifact
  const loadedSkills = new Set<string>();
  const declined = new Set<string>();
  const repo = new SampleRepo();
  const slots = Array.from({ length: PARALLEL_PARTS }, () => 0);
  let partsStarted = 0;
  let leadSearches = 0;
  let leadReads = 0;
  let asked = new Set<string>();
  const run = `run-${fx.id}`;

  const emit = (event: Omit<Draft, "id">): Draft => {
    const full = { ...event, id: `${run}-e${++counter}` } as Draft;
    drafts.push(full);
    return full;
  };
  const allowed = (permission: Permission | null) => !permission || opts.permissions[permission];
  const cite = (ref: string) => {
    if (!sources.has(ref)) sources.set(ref, `s${sources.size + 1}`);
    return sources.get(ref)!;
  };
  /** An approval: answered from `decisions`, or the run waits here. Returns the answer. */
  const decide = (key: string, t: number): "approve" | "decline" => {
    const answer = opts.decisions[key];
    if (answer) return answer;
    if (opts.interactive && t < waitingAt) {
      waitingAt = t;
      waiting = key;
    }
    return "approve";
  };

  /* ───────── admission ───────── */
  emit({
    t: 0,
    kind: "run_created",
    actor: "app",
    label: "Run admitted",
    detail: `${fx.title} · ${fx.origin === "zephium" ? "Zephium workflow" : "AEGIS workflow"}`,
    data: {
      grant: { lead: opts.models.lead, skill: startedSkill ?? null, folders: fx.folder ? [fx.folder] : [], private: false },
      limits: { model_tokens: 1_000_000, cost_micro_usd: 3_000_000, operations: 256, timeout_seconds: 1800, max_workers: 4 },
    },
    zephium: "WorkRuntimeIntent::BeginAgent → store admits → WorkReply::AgentAdmitted (frame/src/domain/work/work-model.ts AGENT_GRANT / AGENT_LIMITS)",
    handler: "work_lead/mod.rs WorkLeadService::run",
    origin: "zephium",
  });
  const prompt = emit({
    t: 0,
    kind: "prompt_received",
    actor: "person",
    label: "Request",
    detail: request,
    data: { request, skills: offeredSkills(request, startedSkill) },
    zephium: "The objective; mod.rs context_text() puts it first in the lead's conversation as \"Request: …\" with the time",
    handler: "work_lead/mod.rs context_text",
    origin: "zephium",
  });
  const faults = capabilityFaults(opts.models, fx.needs.includes("browser") || fx.needs.includes("connections"));
  if (faults.length) {
    emit({
      t: 10,
      kind: "run_stopped",
      actor: "app",
      cause: prompt.id,
      label: "Run refused: model capability",
      detail: faults.join(" "),
      zephium: "No record: the run never starts. Zephium's catalogue only offers tool-capable models for the lead (work_models.rs); the lab refuses up front instead.",
      origin: "lab",
      error: faults[0],
    });
    return finalize();
  }

  /* ───────── inputs, then the started skill (lead.rs drive loads it before the first turn) ───────── */
  let t = 20;
  for (const input of fx.attached ?? []) {
    emit({ t, kind: "input_attached", actor: "person", label: input.label, data: { ...input }, zephium: "WorkRuntimeUpdate::Input (WorkInputFactV1, drawn left of the request)", handler: "mod.rs inputs()", origin: "zephium" });
  }
  if (fx.folder) {
    emit({ t, kind: "input_attached", actor: "person", label: fx.folder.split("/").at(-1)!, data: { kind: "files", label: fx.folder.split("/").at(-1), count: 1, path: fx.folder }, zephium: "WorkRuntimeUpdate::Input { kind: files } for the granted folder", handler: "mod.rs inputs()", origin: "zephium" });
  }
  if (startedSkill) loadSkill(startedSkill, t, "started", prompt.id);

  /* ───────── the lead's turns ───────── */
  let finished = false;
  for (const [index, turn] of fx.turns.entries()) {
    if (t >= waitingAt) break;
    const model = modelOf(opts.models.lead)!;
    const said = emit({
      t: t + MS.lead_turn!,
      kind: "model_turn",
      actor: "lead",
      turn: index + 1,
      label: `Lead turn ${index + 1}`,
      detail: turn.say,
      ms: MS.lead_turn,
      data: { model: model.label, provider: model.provider, role: "lead", calls: turn.calls.map((call) => call.tool), simulated: true },
      zephium: "WorkStepKindV1::Turn (settled with usage; note = the status line the model wrote)",
      handler: "lead.rs Lead::drive → call.rs call()",
      origin: "zephium",
    });
    t += MS.lead_turn!;
    if (index === 0) planEvent(t, said.id);
    // lead.rs execute: every call of a turn runs together; finish runs last.
    const ends: number[] = [];
    let turnFailed = false;
    const finish = turn.calls.find((call) => call.tool === "finish");
    for (const call of turn.calls) {
      if (call.tool === "finish") continue;
      const result = leadCall(call, t, index + 1, said.id);
      ends.push(result.end);
      if (result.failed) turnFailed = true;
    }
    t = Math.max(t, ...ends);
    if (finish && finish.tool === "finish" && t < waitingAt) {
      finished = doFinish(finish, t, index + 1, said.id, turnFailed);
      t += MS.finish!;
      if (finished) break;
    }
  }
  if (!finished && t < waitingAt) {
    emit({
      t,
      kind: "run_completed",
      actor: "lead",
      label: "Run closed with what it had",
      detail: "The script ended without an admitted finish. lead.rs close() would publish a reply saying what is there and why it stopped.",
      data: { status: "closed" },
      zephium: "lead.rs Lead::close(Stall) → reply + Finish step; \"A run never dies with nothing to show\"",
      handler: "lead.rs Lead::close",
      origin: "zephium",
    });
  }
  return finalize();

  /* ───────── helpers (closures over the run) ───────── */

  function finalize(): SimResult {
    handlersEver += handlerCalls;
    const ordered = drafts
      .map((draft, index) => ({ draft, index }))
      .filter(({ draft }) => draft.t <= waitingAt)
      .sort((a, b) => a.draft.t - b.draft.t || a.index - b.index)
      .map(({ draft }, seq) => ({ ...draft, seq: seq + 1 }) as AgentEvent);
    // A waiting run shows everything up to the held step, then stops.
    if (waiting !== undefined) {
      const at = ordered.findIndex((event) => event.decision === waiting && event.kind === "approval_requested");
      return { events: ordered.slice(0, at + 1), waiting, handlerCalls };
    }
    return { events: ordered, handlerCalls };
  }

  function loadSkill(name: string, at: number, how: "started" | "loaded", cause?: string) {
    const skill = skillOf(name);
    if (!skill || loadedSkills.has(name)) return !!skill;
    loadedSkills.add(name);
    emit({
      t: at,
      kind: "skill_loaded",
      actor: how === "started" ? "app" : "lead",
      label: `Skill: ${skillLabel(name)}`,
      detail: skill.description,
      cause,
      data: {
        name,
        why:
          how === "started"
            ? `The person started from the ${skillLabel(name)} workflow: grant.skill names it and lead.rs drive() loads it before the first turn.`
            : "The lead called load_skill: its prompt lists every offered skill by name and one-line description, and the model picked this one.",
        tools: skill.tools,
        role: skill.role ?? null,
        path: skill.path,
        owner: skill.owner,
        bytes: skill.body.length,
      },
      zephium: "WorkRuntimeUpdate::Input { kind: skill, label, reference: name } (first load only), drawn as the skill's mark beside the request",
      handler: "lead.rs Lead::load_skill",
      origin: "zephium",
    });
    return true;
  }

  function planEvent(at: number, cause: string) {
    const tasks = planOf(fx);
    emit({
      t: at,
      kind: "plan_created",
      actor: "lead",
      cause,
      label: "Plan (AEGIS IR)",
      detail: `${tasks.length} tasks derived from the lead's calls`,
      data: { version: 1, tasks },
      zephium: "None. Zephium keeps no plan record: its plan is the tool calls of each turn (start_part, create, finish). This event is the AEGIS intermediate representation derived from them.",
      origin: "aegis",
    });
  }

  type Outcome = { end: number; failed?: boolean };

  function refuse(at: number, actor: string, tool: string, error: string, rule: string, cause?: string, turn?: number, part?: string): Outcome {
    emit({ t: at, kind: "tool_refused", actor, tool, turn, part, cause, label: `Refused: ${tool}`, detail: error, error, zephium: `Tool result with is_error = true. ${rule}`, handler: "lead.rs Lead::execute", origin: rule.startsWith("lab permission") ? "lab" : "zephium" });
    return { end: at + 10, failed: true };
  }

  function toolPair(at: number, actor: string, tool: string, label: string, args: Record<string, unknown>, ms: number, result: { ok: boolean; output: unknown; note?: string }, extra: Partial<Draft> = {}) {
    handlerCalls++;
    const step = `${run}-s${counter + 1}`;
    const def = toolOf(tool);
    const called = emit({
      t: at,
      kind: "tool_called",
      actor,
      tool,
      step,
      label,
      data: { arguments: args },
      zephium: `WorkRuntimeUpdate::BeginStep (status running) · ${def?.record ?? "step"}`,
      handler: def?.handler,
      origin: "zephium",
      ...extra,
    });
    const done = emit({
      t: at + ms,
      kind: "tool_completed",
      actor,
      tool,
      step,
      cause: called.id,
      label: result.ok ? `${label} ✓` : `${label} — failed`,
      detail: result.note,
      ms,
      data: { arguments: args, result: result.output },
      zephium: `WorkRuntimeUpdate::SettleStep (status ${result.ok ? "succeeded" : "failed"})`,
      handler: def?.handler,
      origin: "zephium",
      ...(result.ok ? {} : { error: result.note ?? "failed" }),
      ...(extra.turn ? { turn: extra.turn } : {}),
      ...(extra.part ? { part: extra.part } : {}),
    });
    return { called, done, end: at + ms };
  }

  function readPage(url: string, at: number, actor: string, tool: "web_fetch" | "read", extra: Partial<Draft>) {
    const found = pageAt(url);
    const ok = !!found && !found.down && !found.signedIn;
    const pair = toolPair(at, actor, tool, `Read ${hostOf(url)}`, { url }, MS[tool]!, {
      ok,
      output: ok ? { title: found!.title, facts: found!.facts, ...(found!.records ? { records: found!.records } : {}), ...(found!.injection ? { untrusted: found!.injection } : {}) } : null,
      note: !found ? "The site did not answer (need retry, reason no_answer)" : found.down ? "The site showed an error (need retry, reason site_error)" : found.signedIn ? "The page asked to sign in (need sign_in)" : found.injection ? "Page text contained an instruction to the agent; it stays data and is not followed" : found.title,
    }, { ...extra, data: { arguments: { url }, page_title: found?.title } });
    if (ok) {
      const key = cite(url);
      emit({ t: pair.end, kind: "source_collected", actor, cause: pair.done.id, step: pair.called.step, label: `${key} · ${hostOf(url)}`, detail: found!.title, data: { key, url, title: found!.title, facts: found!.facts }, zephium: "LeadRun::cite → a source key the model names in `sources`; the page frame and evidence stay with the Read step", handler: "run.rs LeadRun::cite", origin: "zephium", ...(extra.part ? { part: extra.part } : {}) });
    }
    return pair.end;
  }

  function webSearch(query: string, at: number, actor: string, extra: Partial<Draft>) {
    const hits = search(query);
    const pair = toolPair(at, actor, "web_search", `Search “${query}”`, { query }, MS.web_search!, { ok: true, output: hits.map((hit) => ({ ...hit, key: cite(hit.url) })), note: `${hits.length} results` }, extra);
    return pair.end;
  }

  function leadCall(call: LeadCall, at: number, turn: number, cause: string): Outcome {
    const extra = { turn, cause } as Partial<Draft>;
    switch (call.tool) {
      case "load_skill": {
        handlerCalls++;
        const known = loadSkill(call.name, at + MS.load_skill!, "loaded", cause);
        if (!known) return refuse(at, "lead", "load_skill", `No skill named ${call.name}`, "lead.rs Lead::load_skill lists the known names", cause, turn);
        return { end: at + MS.load_skill! };
      }
      case "web_search":
        if (!allowed("web")) return refuse(at, "lead", "web_search", "Web search is off for this run.", RULE.web, cause, turn);
        if (++leadSearches > LEAD_SEARCHES) return refuse(at, "lead", "web_search", "You have searched enough for this request: read the best pages your searches already listed.", "lead.rs LEAD_SEARCHES = 4", cause, turn);
        return { end: webSearch(call.query, at, "lead", extra) };
      case "web_fetch":
        if (!allowed("web")) return refuse(at, "lead", "web_fetch", "Page reads are off for this run.", RULE.web, cause, turn);
        if (++leadReads > LEAD_READS) return refuse(at, "lead", "web_fetch", "You have read enough pages yourself for this request.", "lead.rs LEAD_READS = 8", cause, turn);
        return { end: readPage(call.url, at, "lead", "web_fetch", extra) };
      case "start_part":
        return startPart(call.part, at, turn, cause);
      case "create":
        // The fixture's other branch: after a declined step the model would not make this object.
        if (call.unlessDeclined && declined.size) return { end: at };
        return create(call, at, "lead", turn, cause);
      case "revise": {
        const target = placed.get(call.target);
        if (!target) return refuse(at, "lead", "revise", "id names no object on this canvas", "lead.rs Lead::revise", cause, turn);
        return create({ tool: "create", kind: target.kind, title: target.title, data: call.data, sources: call.sources, id: call.target }, at, "lead", turn, cause, target.artifact);
      }
      case "read_canvas":
        handlerCalls++;
        emit({ t: at + MS.read_canvas!, kind: "tool_completed", actor: "lead", tool: "read_canvas", turn, cause, label: "Read the canvas", data: { objects: [...placed.values()].map((each) => ({ id: each.artifact, kind: each.kind, title: each.title })) }, zephium: "No step: a read of the projection (objects.rs view)", handler: "objects.rs view()", origin: "zephium" });
        return { end: at + MS.read_canvas! };
      case "ask": {
        const key = `${fx.id}:ask:${call.question}`;
        emit({ t: at, kind: "approval_requested", actor: "lead", turn, cause, decision: key, label: "Question for you", detail: call.question, data: { purpose: "question", options: call.options, answer: call.answer }, zephium: "WorkStepKindV1::Ask { purpose: question } (running); the deadline stands still", handler: "run.rs LeadRun::ask_with", origin: "zephium" });
        const answer = decide(key, at);
        if (answer === "decline") {
          emit({ t: at, kind: "user_declined", actor: "person", decision: key, label: "No answer", detail: "The run stops the way a person's Stop does", zephium: "Ask settled cancelled: \"No answer: the run stopped while waiting\"", origin: "zephium" });
          emit({ t: at + 1, kind: "run_stopped", actor: "app", label: "Run stopped", detail: "No answer to the lead's question", zephium: "WorkExecutionStatus::Cancelled", origin: "zephium" });
          waitingAt = Math.min(waitingAt, at + 1);
          return { end: at + 1, failed: true };
        }
        emit({ t: at, kind: "user_approved", actor: "person", decision: key, label: `Answered: ${call.answer}`, data: { answer: call.answer }, zephium: "WorkRuntimeIntent::AnswerStep → Ask { answer }", origin: "zephium" });
        return { end: at + 20 };
      }
      case "ask_folder":
        handlerCalls++;
        return { end: at + 10 };
      case "describe_project": {
        if (!allowed("folder_read") || !fx.folder) return refuse(at, "lead", "describe_project", "No folder is granted in this run.", RULE.folder, cause, turn);
        const data = describeProject(repo);
        const pair = toolPair(at, "lead", "describe_project", `Describe ${call.path.split("/").at(-1)}`, { path: call.path }, MS.describe_project!, { ok: true, output: { stack: data.stack.length, tree: data.tree.length, scripts: data.scripts.length } }, extra);
        cite(call.path);
        return publish("project", data.name, data as Record<string, unknown>, [call.path], pair.end, "lead", turn, pair.done.id, "project");
      }
      case "search_notes":
      case "list_tasks":
      case "day_sources":
      case "list_tabs":
      case "recall":
      case "remember": {
        if (!allowed("personal")) return refuse(at, "lead", call.tool, "The person said no to their notes, history and tabs for this work.", "lab permission (mirrors the Context question being declined)", cause, turn);
        let start = at;
        const key = `${fx.id}:context`;
        if (!asked.has(key) && call.tool !== "remember") {
          asked.add(key);
          emit({ t: at, kind: "approval_requested", actor: "app", turn, decision: key, label: "May the run read your notes and tasks?", detail: "Asked once per work", data: { purpose: "context", options: ["Allow", "Not now"] }, zephium: "WorkStepKindV1::Ask { purpose: context }", handler: "work_personal/tools.rs", origin: "zephium" });
          const answer = decide(key, at);
          emit({ t: at, kind: answer === "approve" ? "user_approved" : "user_declined", actor: "person", decision: key, label: answer === "approve" ? "Allowed" : "Not now", zephium: "AnswerStep", origin: "zephium" });
          if (answer === "decline") {
            declined.add(key);
            return refuse(at + 5, "lead", call.tool, "The person said not now.", "work_personal/tools.rs: a declined Context question answers with that refusal", cause, turn);
          }
          start = at + 5;
        }
        const output = PERSONAL[call.tool]?.(call as never) ?? { ok: true };
        const pair = toolPair(start, "lead", call.tool, PERSONAL_LABEL[call.tool] ?? call.tool, call as never, MS.personal!, { ok: true, output }, extra);
        if (call.tool === "search_notes" || call.tool === "list_tasks" || call.tool === "list_tabs") {
          const kind = call.tool === "list_tabs" ? "tabs" : "notes";
          emit({ t: pair.end, kind: "input_attached", actor: "lead", cause: pair.done.id, label: call.tool === "list_tasks" ? "Your tasks" : call.tool === "list_tabs" ? "Open tabs" : "Notes", data: { kind, label: call.tool === "list_tasks" ? "Your tasks" : call.tool === "list_tabs" ? "Open tabs" : "Notes", count: 3 }, zephium: "WorkRuntimeUpdate::Input (what the run pulled in)", origin: "zephium" });
          cite(`personal:${call.tool}`);
        }
        return { end: pair.end };
      }
      default:
        return refuse(at, "lead", (call as { tool: string }).tool, `${(call as { tool: string }).tool} is not a tool`, "lead.rs Lead::execute: an unknown name", cause, turn);
    }
  }

  /** objects.rs propose + honest + publish, for the lead or a part. */
  function create(call: Extract<LeadCall, { tool: "create" }>, at: number, actor: string, turn: number, cause: string, revises?: string, part?: string): Outcome {
    const helper = actor !== "lead";
    if (helper && !PART_KINDS.includes(call.kind))
      return refuse(at, actor, "create", "A part places at most one compact object, picks or a small sheet, and hands every other fact to the lead in finish's digest", "lead.rs Lead::create (helper)", cause, turn, part);
    if (!helper && !LEAD_KINDS.includes(call.kind)) {
      const words = call.kind === "project" ? "A project object comes from describe_project, which reads the folder exactly" : `kind is one of ${LEAD_KINDS.join(", ")}`;
      return refused(call, at, actor, words, "schema.rs KINDS / lead.rs create", turn, cause);
    }
    const title = call.title.trim();
    if (!title || [...title].length > 60 || title.includes("\n")) return refused(call, at, actor, `title is ${[...title].length} characters; it is one line of 1 to 60`, "objects.rs propose (MAX_TITLE_CHARS)", turn, cause);
    const missing = (REQUIRED[call.kind] ?? []).filter((field) => call.data[field] === undefined || call.data[field] === "");
    if (missing.length) return refused(call, at, actor, `${call.kind}: ${missing.join(", ")} is required`, "schema.rs mismatch()", turn, cause);
    if (helper && call.kind === "sheet") {
      const rows = (call.data.rows as unknown[]).length;
      const columns = (call.data.columns as unknown[]).length;
      if (rows > 12 || columns > 6) return refused(call, at, actor, `A part's sheet is small: it has ${rows} rows and ${columns} columns; the limit is 12 rows and 6 columns`, "lead.rs PART_SHEET_ROWS / PART_SHEET_COLUMNS", turn, cause);
    }
    const keys: string[] = [];
    for (const ref of call.sources ?? []) {
      const key = sources.get(ref);
      if (!key) return refused(call, at, actor, `sources: ${ref} is not a source of this run; use the keys search, reads and parts returned`, "objects.rs propose (sources)", turn, cause);
      keys.push(key);
    }
    if (!keys.length && linksIn(call.data)) return refused(call, at, actor, `${call.kind}: pictures and links must come from sources; list the keys they came from in sources`, "objects.rs propose (claims_observed_links)", turn, cause);
    return publish(call.kind, title, call.data, call.sources ?? [], at + MS.create!, actor, turn, cause, call.id ?? `${call.kind}-${placed.size + 1}`, revises, part);
  }

  function refused(call: { kind: string; title: string }, at: number, actor: string, words: string, rule: string, turn: number, cause: string): Outcome {
    emit({ t: at + MS.create!, kind: "artifact_refused", actor, turn, cause, label: `Refused ${call.kind}: ${call.title}`, detail: words, error: words, data: { kind: call.kind, title: call.title }, zephium: `Tool result is_error: the model reads the fault and corrects it. ${rule}`, handler: "objects.rs propose", origin: "zephium" });
    return { end: at + MS.create!, failed: true };
  }

  function publish(kind: string, title: string, data: Record<string, unknown>, refs: string[], at: number, actor: string, turn: number | undefined, cause: string, key: string, revises?: string, part?: string): Outcome {
    const artifact = revises ? `${revises}-v${counter}` : `${run}-${key}`;
    const wire = { kind, ...data } as unknown as WorkArtifactV1["data"];
    // Zephium picks a renderer by one of two paths (lib/board/objects.ts): the lead's own kinds
    // (NEW_KINDS) go through leadView; diagram, code and document are still drawn through the
    // board adapter's blocks (legacyView). Anything else has no renderer and is not drawn.
    const asLead = leadObject({ data: wire } as WorkArtifactV1);
    const view = asLead ? ownedView(artifact, title, wire) : BLOCK_KINDS.includes(kind) ? { kind } : null;
    if (!view) {
      emit({ t: at, kind: "artifact_refused", actor, turn, cause, label: `No renderer for ${kind}`, detail: `Zephium has no renderer for this ${kind}: nothing is drawn in its place.`, error: "no_renderer", data: { kind, title }, zephium: "features/work/lib/board/objects.ts runObjects → leadView or the board adapter (renderer selection)", origin: "zephium" });
      return { end: at, failed: true };
    }
    const renderer = asLead ? `leadView → ObjectView kind ${view.kind}` : `board adapter block → legacyView → ObjectView kind ${kind}`;
    const keys = refs.map((ref) => sources.get(ref)!).filter(Boolean);
    placed.set(key, { artifact, kind, title, ...(part ? { part } : {}), sources: keys });
    emit({
      t: at,
      kind: "artifact_created",
      actor,
      turn,
      cause,
      ...(part ? { part } : {}),
      label: `${revises ? "Updated" : "Placed"} ${kind}: ${title}`,
      data: { artifact, kind, title, sources: keys, wire, renderer, ...(revises ? { revises } : {}), ...(part ? { part } : {}) },
      zephium: "WorkStepKindV1::Publish { artifacts } + WorkArtifactV1 (validated by WorkArtifactV1::validate); the frame draws it with ObjectView",
      handler: "objects.rs publish",
      origin: "zephium",
    });
    return { end: at };
  }

  function startPart(script: PartScript, at: number, turn: number, cause: string): Outcome {
    if (partsStarted >= MAX_WORK_PARTS) return refuse(at, "lead", "start_part", `A run holds at most ${MAX_WORK_PARTS} parts; finish the work with the parts you have`, "parts.rs Lead::part (MAX_WORK_PARTS)", cause, turn);
    if ([...script.title].length > 24) return refuse(at, "lead", "start_part", "title is one line of at most 24 characters: Stay, Flights, Entry", "parts.rs spec()", cause, turn);
    partsStarted++;
    const part = `${run}-part-${script.key}`;
    const helperRole: Role = script.helper === "research" ? "light" : script.helper === "computer" ? "lead" : "page";
    const model = modelOf(opts.models[helperRole])!;
    const base = { part, actor: part };
    emit({ t: at, kind: "task_queued", ...base, turn, cause, label: `Part ${script.title}`, detail: script.goal, data: { title: script.title, helper: script.helper, goal: script.goal, brief: script.brief ?? "", service: script.service ?? null, state: "planned" }, zephium: "WorkRuntimeUpdate::Part (WorkPartFactV1 state planned)", handler: "parts.rs Lead::part", origin: "zephium" });
    // A slot frees as a part ends: the four-at-once semaphore (parts.rs PARALLEL_PARTS).
    const slot = slots.indexOf(Math.min(...slots));
    let now = Math.max(at, slots[slot]!) + 5;
    let need: Record<string, unknown> | undefined;
    if (script.asks) {
      const key = script.asks.shared ? `${fx.id}:${script.asks.shared}` : `${fx.id}:${script.key}:${script.asks.purpose}`;
      const first = !asked.has(key);
      if (first) {
        asked.add(key);
        emit({ t: now, kind: "task_waiting", ...base, label: `${script.title} waits for you`, data: { state: "waiting" }, zephium: "WorkPartFactV1 state waiting", origin: "zephium" });
        emit({ t: now, kind: "approval_requested", ...base, decision: key, label: script.asks.question, data: { purpose: script.asks.purpose, options: script.asks.options, answer: script.asks.answer }, zephium: `WorkStepKindV1::Ask { purpose: ${script.asks.purpose} }`, handler: script.asks.purpose === "entry" ? "hands.rs enter_sites (one question for parts started together)" : "parts.rs route() → route.rs question()", origin: "zephium" });
      }
      const answer = decide(key, now);
      if (first) emit({ t: now, kind: answer === "approve" ? "user_approved" : "user_declined", actor: "person", part, decision: key, label: answer === "approve" ? script.asks.answer : "Not now", zephium: "WorkRuntimeIntent::AnswerStep", origin: "zephium" });
      if (answer === "decline") {
        declined.add(key);
        need = script.asks.purpose === "entry" ? { kind: "allow_site", host: script.service ?? "" } : { kind: "use_connection", connection: script.service ?? script.title };
      }
    }
    if (!need && script.helper === "computer" && (!allowed("folder_read") || !fx.folder)) need = { kind: "allow_folder", path: fx.folder ?? ROOT };
    if (need) {
      emit({ t: now + 5, kind: "task_failed", ...base, label: `${script.title} could not do its job`, detail: `Needs ${String(need.kind).replace(/_/gu, " ")}`, data: { state: "failed", need, summary: "" }, zephium: "WorkPartFactV1 { state: failed, need } — the fix sits on the part's row", handler: "parts.rs settle_need", origin: "zephium" });
      slots[slot] = now + 5;
      return { end: now + 5, failed: true };
    }
    emit({ t: now, kind: "task_started", ...base, label: `${script.title} running`, data: { state: "running", model: model.label, role: helperRole, slot: slot + 1 }, zephium: "WorkPartFactV1 state running (started_ms)", handler: `parts.rs helper() · ${script.helper} kit`, origin: "zephium" });
    let searches = 0;
    let partDeclined = false;
    let anyOk = false;
    let lastCause: string | undefined;
    for (const [index, helperTurn] of script.turns.entries()) {
      const said = emit({ t: now + MS.helper_turn!, kind: "model_turn", ...base, turn: index + 1, label: `${script.title} turn ${index + 1}`, detail: helperTurn.say, ms: MS.helper_turn, data: { model: model.label, role: helperRole, calls: helperTurn.calls.map((call) => call.tool), simulated: true }, zephium: "WorkStepKindV1::Turn { part }", handler: "parts.rs helper loop → call.rs call()", origin: "zephium" });
      now += MS.helper_turn!;
      const ends: number[] = [now];
      for (const call of helperTurn.calls) {
        const result = helperCall(call, now, part, script, said.id, () => ++searches);
        if (result.declined) partDeclined = true;
        if (!result.failed) anyOk = true;
        ends.push(result.end);
      }
      now = Math.max(...ends);
      lastCause = said.id;
    }
    if (script.create) {
      const made = create({ tool: "create", kind: script.create.kind, title: script.create.title, data: script.create.data, sources: script.create.sources, id: `${script.key}-${script.create.kind}` }, now, part, script.turns.length, lastCause ?? cause, undefined, part);
      now = made.end;
    }
    // helper.rs objects(): the files the part changed, as exact diffs on its row.
    if (script.helper === "computer") {
      for (const change of gitChanges(repo, Object.keys(repo.files))) {
        const name = change.path.split("/").at(-1)!;
        publish("diff", `Change to ${name}`, { path: change.path, language: change.path.endsWith(".py") ? "python" : "typescript", summary: "The change the person approved", hunks: change.hunks }, [], now + 10, part, undefined, lastCause ?? cause, `diff-${name}`, undefined, part);
        now += 10;
      }
    }
    const found = (script.finish.found ?? true) && anyOk;
    const summary = partDeclined ? declinedSummary(script) : found ? script.finish.summary : script.finish.summary || "Nothing usable";
    emit({
      t: now + 10,
      kind: found ? "task_completed" : "task_failed",
      ...base,
      label: `${script.title}: ${summary}`,
      detail: partDeclined ? `${script.finish.digest}\nA change was declined: nothing was written for it, and the tests were not claimed to pass.` : script.finish.digest,
      data: { state: found ? "done" : "failed", summary, digest: script.finish.digest, ...(found ? {} : { need: { kind: "retry", reason: "couldnt_read" } }) },
      zephium: `WorkPartFactV1 state ${found ? "done" : "failed"} (ended_ms, summary); the digest returns to the lead as start_part's result`,
      handler: "parts.rs Lead::part → finish",
      origin: "zephium",
    });
    slots[slot] = now + 10;
    return { end: now + 10, failed: !found };
  }

  function declinedSummary(script: PartScript) {
    return script.helper === "computer" ? "Change declined · not written" : "Declined";
  }

  function helperCall(call: HelperCall, at: number, part: string, script: PartScript, cause: string, searched: () => number): Outcome & { declined?: boolean } {
    const extra = { part, cause } as Partial<Draft>;
    const actor = part;
    const kitOk = toolOf(call.tool)?.scopes.includes(script.helper as never) || (call.tool === "describe_project" && script.helper === "computer");
    if (!kitOk) return refuse(at, actor, call.tool, `${call.tool} is not a tool here`, "parts.rs step_request / the helper's kit", cause, undefined, part);
    switch (call.tool) {
      case "web_search":
        if (!allowed("web")) return refuse(at, actor, "web_search", "Web search is off for this run.", RULE.web, cause, undefined, part);
        if (searched() > PART_SEARCHES) return refuse(at, actor, "web_search", "This part has searched enough; report what it has.", "parts.rs PART_SEARCHES = 4", cause, undefined, part);
        return { end: webSearch(call.query, at, actor, extra) };
      case "read":
        if (!allowed("web")) return refuse(at, actor, "read", "Page reads are off for this run.", RULE.web, cause, undefined, part);
        return { end: readPage(call.url, at, actor, "read", extra), failed: !pageAt(call.url) || !!pageAt(call.url)?.down };
      case "browse": {
        if (!allowed("browser")) return refuse(at, actor, "browse", "The agent browser is off for this run.", "lab permission (mirrors BROWSER_DOWN: \"Pages cannot open in this request now\")", cause, undefined, part);
        if (call.mine && !allowed("session")) return refuse(at, actor, "browse", "Working in your own session is off; the part ends with need allow_site.", RULE.session, cause, undefined, part);
        const url = call.start.startsWith("https://") ? call.start : `https://${call.start}/`;
        const found = pageAt(url);
        const pair = toolPair(at, actor, "browse", `Browse ${hostOf(url)}`, { start: call.start, goal: call.goal, mine: !!call.mine, view: !!call.view }, MS.browse!, {
          ok: !!found && !found.down,
          output: found ? { title: found.title, records: found.records ?? [], facts: found.facts } : null,
          note: found ? `${found.records?.length ?? 0} records${call.mine ? " · in your session" : ""}` : "The site did not answer",
        }, { ...extra, data: { arguments: { start: call.start, goal: call.goal }, page_title: found?.title } });
        if (found) {
          const key = cite(url);
          for (const record of found.records ?? []) cite(`record:${record.name}`);
          emit({ t: pair.end, kind: "source_collected", actor, part, cause: pair.done.id, step: pair.called.step, label: `${key} · ${hostOf(url)}`, detail: found.title, data: { key, url, title: found.title, records: found.records?.length ?? 0 }, zephium: "Records become native rows with r-keys (records.rs); the part's picks are built from them (parts.rs place_found)", handler: "hands.rs records()", origin: "zephium" });
        }
        return { end: pair.end, failed: !found };
      }
      case "glob":
      case "grep":
      case "read_file":
      case "git_changes":
      case "describe_project": {
        if (!allowed("folder_read")) return refuse(at, actor, call.tool, "No folder is granted in this run.", RULE.folder, cause, undefined, part);
        if (call.tool === "glob") {
          const paths = glob(repo, call.pattern);
          return { end: toolPair(at, actor, "glob", `Find ${call.pattern}`, { pattern: call.pattern }, MS.glob!, { ok: true, output: paths, note: `${paths.length} files` }, extra).end };
        }
        if (call.tool === "grep") {
          const lines = grep(repo, call.pattern, call.glob);
          return { end: toolPair(at, actor, "grep", `Search files for ${call.pattern}`, { pattern: call.pattern, ...(call.glob ? { glob: call.glob } : {}), output: "lines" }, MS.grep!, { ok: true, output: lines, note: `${lines.length} lines` }, extra).end };
        }
        if (call.tool === "read_file") {
          const read = readFile(repo, call.path, call.offset, call.limit);
          const pair = toolPair(at, actor, "read_file", `Read ${call.path}`, { path: call.path, ...(call.offset ? { offset: call.offset } : {}), ...(call.limit ? { limit: call.limit } : {}) }, MS.read_file!, { ok: !!read, output: read?.text ?? null, note: read ? `${read.lines} lines` : "Not in a granted folder" }, extra);
          if (read) cite(call.path);
          return { end: pair.end, failed: !read };
        }
        if (call.tool === "git_changes") {
          const changes = gitChanges(repo, call.paths);
          return { end: toolPair(at, actor, "git_changes", `git_changes ${call.operation}`, { paths: call.paths, operation: call.operation }, MS.git_changes!, { ok: true, output: changes, note: changes.length ? `${changes.length} changed` : "No working-tree changes" }, extra).end };
        }
        const data = describeProject(repo);
        const pair = toolPair(at, actor, "describe_project", "Describe the project", { path: call.path }, MS.describe_project!, { ok: true, output: { stack: data.stack.length } }, extra);
        cite(call.path);
        publish("project", data.name, data as Record<string, unknown>, [call.path], pair.end, actor, undefined, pair.done.id, "project", undefined, part);
        return { end: pair.end };
      }
      case "edit":
      case "write": {
        if (!allowed("file_write")) return refuse(at, actor, call.tool, "Changing files is off for this run.", "lab permission (Zephium always asks the person per change; here the person has refused all changes)", cause, undefined, part);
        const key = `${fx.id}:${script.key}:${call.tool}:${call.path}`;
        const step = `${run}-s${counter + 1}`;
        const called = emit({ t: at, kind: "tool_called", actor, part, tool: call.tool, step, cause, label: `Propose a change to ${call.path}`, data: { arguments: call.tool === "edit" ? { path: call.path, old: call.old, new: call.new } : { path: call.path, text: call.text } }, zephium: `WorkStepKindV1::${call.tool === "edit" ? "EditFile" : "WriteFile"} { decision: None } (running)`, handler: "work_computer/tools.rs → ComputerHost::decision", origin: "zephium" });
        emit({ t: at, kind: "approval_requested", actor, part, decision: key, step, cause: called.id, label: `Approve the change to ${call.path}?`, data: { purpose: "file", old: call.tool === "edit" ? call.old : "", new: call.tool === "edit" ? call.new : call.text }, zephium: "The step waits for WorkRuntimeIntent::ApproveStep; the deadline stands still", handler: "run.rs LeadRun::decision", origin: "zephium" });
        const answer = decide(key, at);
        if (answer === "decline") {
          emit({ t: at, kind: "user_declined", actor: "person", part, decision: key, label: "Change declined", zephium: "ApproveStep { approve: false } → decision false", origin: "zephium" });
          emit({ t: at + MS.edit!, kind: "tool_completed", actor, part, tool: call.tool, step, cause: called.id, label: `Change to ${call.path} declined`, error: "declined", data: { result: "Declined: nothing was written" }, zephium: "EditFile { decision: false }; settled cancelled", origin: "zephium" });
          declined.add(key);
          return { end: at + MS.edit!, declined: true };
        }
        emit({ t: at, kind: "user_approved", actor: "person", part, decision: key, label: "Change approved", zephium: "ApproveStep { approve: true } → decision true", origin: "zephium" });
        handlerCalls++;
        const applied = call.tool === "edit" ? edit(repo, call.path, call.old, call.new) : ((repo.files[repo.rel(call.path)] = call.text), { ok: true as const, hunks: [] });
        emit({ t: at + MS.edit!, kind: "tool_completed", actor, part, tool: call.tool, step, cause: called.id, label: applied.ok ? `Changed ${call.path}` : `Change refused`, ...(applied.ok ? {} : { error: applied.error }), data: { result: applied.ok ? applied.hunks : applied.error }, zephium: "EditFile { decision: true }; settled succeeded; the change lands in the lab's in-memory copy only", handler: "work_computer/tools.rs edit", origin: "zephium" });
        return { end: at + MS.edit!, failed: !applied.ok };
      }
      case "python_tests": {
        if (!allowed("tests")) return refuse(at, actor, "python_tests", "Running tests is off for this run.", "lab permission (mirrors an unqualified host: python_tests is macOS-only in the source)", cause, undefined, part);
        const outcome = pythonTests(repo, call.tests);
        // The runner ran either way: a failing test is a settled step whose output says so.
        const pair = toolPair(at, actor, "python_tests", `Run ${call.tests.join(", ")}`, { tests: call.tests }, MS.python_tests!, { ok: true, output: outcome.output, note: outcome.passed ? "3 passed (simulated runner)" : "1 failed of 3 (simulated runner)" }, extra);
        return { end: pair.end, failed: false };
      }
      case "bash":
        return refuse(at, actor, "bash", "Currently unavailable: commands require an OS-enforced runner to confine file and network access. Use read, glob and grep.", "work_computer/tools.rs SHELL_DESCRIPTION", cause, undefined, part);
      case "connection": {
        if (!allowed("connections")) return refuse(at, actor, "connection", "Connections are off for this run.", "lab permission (mirrors the person answering \"Not now\" to the way question)", cause, undefined, part);
        const output = CONNECTION[call.target ?? ""] ?? { count: 0 };
        const pair = toolPair(at, actor, "connection", `${call.service} · ${call.verb}${call.target ? ` ${call.target}` : ""}`, { service: call.service, tool: call.tool_name, verb: call.verb, ...(call.target ? { target: call.target } : {}) }, MS.connection!, { ok: true, output }, extra);
        cite(`call:${call.service}:${call.target ?? call.verb}`);
        return { end: pair.end };
      }
    }
  }

  function doFinish(call: Extract<LeadCall, { tool: "finish" }>, at: number, turn: number, cause: string, turnFailed: boolean): boolean {
    if (turnFailed) {
      emit({ t: at, kind: "tool_refused", actor: "lead", tool: "finish", turn, cause, label: "Not finished", detail: "Not finished: a call in this turn failed; correct it first.", error: "turn_failed", zephium: "lead.rs execute: finish is refused when another call of the same turn failed", handler: "lead.rs Lead::execute", origin: "zephium" });
      return false;
    }
    const reply = declined.size && call.declined ? call.declined : call.reply;
    const made = create({ tool: "create", kind: "reply", title: String(reply.headline ?? "Answer").slice(0, 60), data: reply, sources: declined.size && call.declined ? [] : call.sources, id: "reply" }, at, "lead", turn, cause);
    if (made.failed) {
      emit({ t: at + 5, kind: "tool_refused", actor: "lead", tool: "finish", turn, cause, label: "Not finished", detail: "Not finished: make the reply first (kind reply: a headline and one to three sentences that answer the request), then finish.", error: "no_reply", zephium: "lead.rs Lead::finish", origin: "zephium" });
      return false;
    }
    emit({
      t: at + MS.finish!,
      kind: "run_completed",
      actor: "lead",
      turn,
      cause,
      label: "Finished",
      detail: call.say,
      data: { followups: call.followups ?? [], title: call.title ?? null, status: "completed" },
      zephium: "WorkStepKindV1::Finish { followups, title } (note = say) → attempt settles succeeded",
      handler: "lead.rs Lead::finish → mod.rs conclude / settle_owned",
      origin: "zephium",
    });
    return true;
  }
}

/** What the lead's prompt would offer for this request: skills.rs for_request. */
function offeredSkills(request: string, started?: string) {
  const { offered, withheld } = forRequest(request, started);
  return { offered: offered.map((skill) => skill.name), withheld: withheld.map((row) => ({ name: row.skill.name, why: row.why })) };
}

function linksIn(data: unknown): boolean {
  if (Array.isArray(data)) return data.some(linksIn);
  if (data && typeof data === "object")
    return Object.entries(data).some(([key, value]) => (["url", "image_candidates", "image", "poster", "target_url"].includes(key) && !!value && (typeof value === "string" || Array.isArray(value)) && (Array.isArray(value) ? value.length > 0 : true)) || linksIn(value));
  return false;
}

/* ───────── personal tools' simulated answers (invented) ───────── */
const PERSONAL: Record<string, (call: never) => unknown> = {
  search_notes: () => [
    { title: "1:1 with Priya — notes", changed: "Mon", passage: "Wants the pricing page copy before Thursday." },
    { title: "Q1 goals", changed: "last week", passage: "Ship checkout v2; cut support tickets 20%." },
  ],
  list_tasks: () => [
    { title: "Send board deck to Ana", when: "overdue", due: "yesterday", priority: "high" },
    { title: "Review checkout v2 copy", when: "today", due: "17:00" },
    { title: "Book dentist", when: "upcoming" },
  ],
  day_sources: () => ({ parts: ["Calendar (connection)", "Gmail (website)", "Slack (website)"], tasks: true }),
  list_tabs: () => [{ title: "Checkout v2 — Linear", site: "linear.app" }],
  recall: () => ["Prefers mornings for deep work", "Ana leads design"],
  remember: () => ({ kept: true }),
};
const PERSONAL_LABEL: Record<string, string> = {
  search_notes: "Search your notes",
  list_tasks: "List your tasks",
  day_sources: "Where your day lives",
  list_tabs: "Your open tabs",
  recall: "Recall what you said before",
  remember: "Remember a fact",
};

const CONNECTION: Record<string, unknown> = {
  "harbor/shop#42": { title: "Read discount as a percentage", state: "open", author: "dana-k", files: 2, checks: "1 failing", comments: 3, url: "https://github.example/harbor/shop/pull/42" },
  "my issues": { count: 4, items: ["HS-12 Checkout v2 copy", "HS-15 Refund flow", "HS-18 Tax for NL", "HS-21 Flaky cart test"] },
  "merged this week": { count: 5 },
  today: { count: 4, items: ["09:30 Standup", "11:00 Design review", "14:00 Acme renewal", "16:30 1:1 Priya"] },
  next: { title: "Acme renewal", count: 2 },
};

/* ───────── the AEGIS-proposed plan IR, derived from a fixture's calls ───────── */

export type PlanTask = {
  id: string;
  type: "load_skill" | "browse" | "research" | "compute" | "connect" | "compose" | "deliver" | "ask" | "read" | "describe";
  title: string;
  depends_on: string[];
  capabilities: string[];
  tools: string[];
  outputs: string[];
  verification: string;
  status: "queued" | "running" | "waiting" | "done" | "failed" | "skipped";
  artifacts: string[];
};

export function planOf(fx: WorkflowFixture): PlanTask[] {
  const tasks: PlanTask[] = [];
  const partsBy: Record<string, string[]> = {}; // page/path → part task id
  const earlier: string[] = [];
  for (const turn of fx.turns) {
    const thisTurn: string[] = [];
    for (const call of turn.calls) {
      if (call.tool === "load_skill")
        tasks.push({ id: `skill:${call.name}`, type: "load_skill", title: `Load ${skillLabel(call.name)}`, depends_on: [], capabilities: [], tools: ["load_skill"], outputs: ["instructions"], verification: "The skill is offered (skills.rs for_request)", status: "queued", artifacts: [] });
      if (call.tool === "start_part") {
        const script = call.part;
        const id = `part:${script.key}`;
        const tools = [...new Set(script.turns.flatMap((each) => each.calls.map((c) => c.tool)))];
        for (const each of script.turns.flatMap((t) => t.calls)) {
          const ref = "url" in each ? each.url : "path" in each ? each.path : "start" in each ? (each.start.startsWith("https://") ? each.start : `https://${each.start}/`) : undefined;
          if (ref) (partsBy[ref] ??= []).push(id);
        }
        tasks.push({
          id,
          type: script.helper === "browser" ? "browse" : script.helper === "research" ? "research" : script.helper === "computer" ? "compute" : "connect",
          title: script.title,
          depends_on: script.helper === "computer" && earlier.length ? [...earlier] : [],
          capabilities: [script.helper],
          tools,
          outputs: [script.create?.kind ?? "digest", ...(script.helper === "computer" && tools.includes("edit") ? ["diff"] : [])],
          verification: script.helper === "computer" && tools.includes("python_tests") ? "Only claim fixed when python_tests passes (a pass is recorded, never asserted)" : "finish.found true with cited sources; a part that found nothing says so",
          status: "queued",
          artifacts: [],
        });
        thisTurn.push(id);
      }
      if (call.tool === "describe_project") tasks.push({ id: "describe", type: "describe", title: "Read the project", depends_on: [], capabilities: ["folder_read"], tools: ["describe_project"], outputs: ["project"], verification: "Read exactly from manifests (project.rs); never written by the model", status: "queued", artifacts: [] });
      if (call.tool === "ask") tasks.push({ id: `ask:${tasks.length}`, type: "ask", title: call.question, depends_on: [], capabilities: [], tools: ["ask"], outputs: ["answer"], verification: "The person answered", status: "queued", artifacts: [] });
      if (call.tool === "create") {
        const deps = [...new Set([...(call.sources ?? []).flatMap((ref) => partsBy[ref] ?? []), ...(call.after ?? []).map((key) => `part:${key}`)])];
        tasks.push({ id: `object:${call.id ?? call.kind}`, type: "compose", title: `${call.kind}: ${call.title}`, depends_on: deps.length ? deps : earlier.filter((id) => id.startsWith("part:")), capabilities: [], tools: ["create"], outputs: [call.kind], verification: "objects.rs propose (schema, sources of this run, honesty) before publish", status: "queued", artifacts: [] });
      }
      if (call.tool === "finish")
        tasks.push({ id: "finish", type: "deliver", title: "Reply and finish", depends_on: tasks.filter((task) => task.type === "compose" || task.type === "describe").map((task) => task.id), capabilities: [], tools: ["finish"], outputs: ["reply"], verification: "A reply exists; no failed call in the same turn (lead.rs finish)", status: "queued", artifacts: [] });
    }
    earlier.push(...thisTurn);
  }
  return tasks;
}

/** One event kind's meaning, for the legend. */
export const EVENT_KINDS: { kind: EventKind; zephium: string }[] = [
  { kind: "run_created", zephium: "BeginAgent admitted" },
  { kind: "prompt_received", zephium: "objective in context_text" },
  { kind: "input_attached", zephium: "Update::Input" },
  { kind: "skill_loaded", zephium: "Input { kind: skill }" },
  { kind: "model_turn", zephium: "Step Turn" },
  { kind: "plan_created", zephium: "none (AEGIS IR)" },
  { kind: "task_queued", zephium: "Part planned" },
  { kind: "task_started", zephium: "Part running" },
  { kind: "task_waiting", zephium: "Part waiting" },
  { kind: "tool_called", zephium: "BeginStep" },
  { kind: "tool_completed", zephium: "SettleStep" },
  { kind: "tool_refused", zephium: "tool result is_error" },
  { kind: "source_collected", zephium: "LeadRun::cite" },
  { kind: "approval_requested", zephium: "Ask / Confirm / file decision" },
  { kind: "user_approved", zephium: "AnswerStep / ApproveStep" },
  { kind: "user_declined", zephium: "ApproveStep false" },
  { kind: "artifact_created", zephium: "Step Publish + artifact" },
  { kind: "artifact_refused", zephium: "propose fault" },
  { kind: "task_completed", zephium: "Part done" },
  { kind: "task_failed", zephium: "Part failed + need" },
  { kind: "run_completed", zephium: "Step Finish" },
  { kind: "run_stopped", zephium: "Cancelled / refused" },
];
