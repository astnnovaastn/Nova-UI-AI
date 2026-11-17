<script lang="ts">
  /*
   * AEGIS Agent Execution Lab — the shell.
   * Left: workflow, request, models, skills, permissions, run controls.
   * Centre: Zephium's genuine canvas fed by the run's events, and the debugger views.
   * Right: the inspector for whatever event or node is selected.
   * Everything runs locally from fixtures: no model, no provider, no network.
   */
  import type { CanvasItem } from "$features/work/lib/canvas-model";
  import LabCanvas from "../stages/LabCanvas.svelte";
  import { ENTRIES } from "../registry";
  import ExecGraph from "./ExecGraph.svelte";
  import { EVENT_KINDS, handlerTotal, planOf, simulate } from "./engine";
  import { layoutGraph } from "./graph";
  import { planStatus, projectScene, relationsOf } from "./project";
  import { AEGIS_ERRORS, capabilityFaults, DEFAULT_MODELS, MODEL_ERRORS, MODELS, modelOf, ROLES, ZEPHIUM_PROVIDERS } from "./providers";
  import { aegisSelect, forRequest, skillOf, ZEPHIUM_SKILLS } from "./skills";
  import { LEAD_TOOL_ORDER, TOOLS, toolOf } from "./tools";
  import type { AgentEvent, Decisions, Permission, Role, SimResult } from "./types";
  import { FIXTURES, PERSONA_LABEL, route, ZEPHIUM_WORKFLOWS, type Route } from "./workflows";

  const query = new URLSearchParams(location.search);
  const PERMISSIONS: { id: Permission; label: string; note: string }[] = [
    { id: "web", label: "Public web (search, read)", note: "web_search, web_fetch, read" },
    { id: "browser", label: "Agent browser (page tasks)", note: "browse" },
    { id: "session", label: "Your signed-in sessions", note: "browse with mine" },
    { id: "folder_read", label: "Read the granted folder", note: "glob, grep, read, describe_project" },
    { id: "file_write", label: "Propose file changes", note: "edit, write — always approved one by one" },
    { id: "tests", label: "Run tests", note: "python_tests (qualified macOS only in the source)" },
    { id: "commands", label: "Shell commands", note: "bash — unavailable in the source whatever you choose" },
    { id: "connections", label: "Connections (gh, MCP)", note: "connection helper" },
    { id: "personal", label: "Notes, tasks, tabs, memory", note: "personal tools" },
  ];

  let fixture = $state(FIXTURES.find((each) => each.id === query.get("workflow")) ?? FIXTURES[1]!);
  let request = $state(fixture.prompt);
  let routed = $state<Route | null>(null);
  let permissions = $state<Record<Permission, boolean>>(Object.fromEntries(PERMISSIONS.map((p) => [p.id, true])) as Record<Permission, boolean>);
  let models = $state<Record<Role, string>>({ ...DEFAULT_MODELS });
  let started = $state<string>(fixture.skill ?? "");
  let interactive = $state(query.get("auto") !== "1");
  let decisions = $state<Decisions>({});
  let sim = $state<SimResult | null>(null);
  let cursor = $state(0);
  let playing = $state(false);
  let replaying = $state(false);
  let speed = $state(Number(query.get("speed")) || 140);
  let tab = $state<"canvas" | "graph" | "events" | "plan" | "tools" | "providers">((query.get("tab") as never) || "canvas");
  let selected = $state<AgentEvent | null>(null);
  let runId = $state(0);
  let saved = $state<{ id: number; title: string; request: string; events: AgentEvent[]; at: string; decisions: Decisions; handlerCalls: number }[]>([]);
  let replayHandlerCalls = $state(0);
  let graphView = $state<ExecGraph>();

  const events = $derived(sim?.events ?? []);
  const shown = $derived(events.slice(0, cursor));
  const done = $derived(!!sim && cursor >= events.length);
  const waitingEvent = $derived(sim?.waiting && done ? events.at(-1) : undefined);
  const finished = $derived(shown.some((event) => event.kind === "run_completed" || event.kind === "run_stopped"));
  const projected = $derived(projectScene(fixture, events, cursor, request, !!waitingEvent));
  const whole = $derived.by(() => {
    void runId;
    const full = simulate(fixture, { permissions, models, decisions: {}, interactive: false }, request, started || null);
    return projectScene(fixture, full.events, full.events.length, request).scene;
  });
  const graph = $derived(layoutGraph(shown));
  const tasks = $derived(planStatus(planOf(fixture), shown));
  const relations = $derived(relationsOf(shown));
  const skillsNow = $derived(forRequest(request, started || null));
  const aegisSkills = $derived(aegisSelect(request, fixture.id));
  const faults = $derived(capabilityFaults(models, fixture.needs.includes("browser") || fixture.needs.includes("connections")));
  const missing = $derived(fixture.needs.filter((need) => !permissions[need]));
  const covered = ZEPHIUM_WORKFLOWS.filter((flow) => FIXTURES.some((each) => each.skill === flow.skill)).length;

  function reset(keepDecisions = false) {
    playing = false;
    replaying = false;
    sim = null;
    cursor = 0;
    selected = null;
    if (!keepDecisions) decisions = {};
    runId++;
  }
  function choose(id: string) {
    fixture = FIXTURES.find((each) => each.id === id)!;
    request = fixture.prompt;
    started = fixture.skill ?? "";
    routed = null;
    reset();
  }
  function submit() {
    routed = route(request);
    if (routed.fixture.id !== fixture.id) {
      const typed = request;
      fixture = routed.fixture;
      request = typed;
      started = "";
    } else started = "";
    reset();
    start();
  }
  function run() {
    sim = simulate(fixture, { permissions, models, decisions, interactive }, request, started || null);
  }
  function start() {
    replaying = false;
    if (!sim) run();
    playing = true;
  }
  function step() {
    replaying = false;
    if (!sim) run();
    playing = false;
    if (cursor < events.length) cursor++;
  }
  function toEnd() {
    if (!sim) run();
    playing = false;
    cursor = events.length;
  }
  function decide(answer: "approve" | "decline") {
    if (!sim?.waiting) return;
    decisions = { ...decisions, [sim.waiting]: answer };
    const at = cursor;
    run();
    cursor = Math.min(at, events.length);
    playing = true;
  }
  /** Replay reads the recorded events again. No tool handler runs, so nothing is repeated. */
  function replay() {
    const last = saved[0];
    if (!sim && !last) return;
    if (!sim && last) sim = { events: last.events, handlerCalls: last.handlerCalls };
    replaying = true;
    replayHandlerCalls = 0;
    cursor = 0;
    playing = true;
  }

  $effect(() => {
    if (!playing || !sim) return;
    const timer = setInterval(() => {
      if (cursor >= events.length) {
        playing = false;
        return;
      }
      cursor++;
    }, speed);
    return () => clearInterval(timer);
  });
  // A finished run is saved in the lab's own memory (never to disk, never to AEGIS).
  $effect(() => {
    if (!sim || replaying || !finished || cursor < events.length || sim.waiting) return;
    const id = runId;
    if (saved.some((run) => run.id === id)) return;
    saved = [{ id, title: fixture.title, request, events: [...events], at: new Date().toLocaleTimeString(), decisions: { ...decisions }, handlerCalls: sim.handlerCalls }, ...saved].slice(0, 8);
  });
  $effect(() => {
    if (playing && tab === "graph") graphView?.resume();
  });
  // For the lab's own acceptance checks (tests/agent-execution-lab.e2e.cjs): read-only facts.
  $effect(() => {
    (window as unknown as { __agentLab: unknown }).__agentLab = {
      fixture: fixture.id,
      events: $state.snapshot(events),
      cursor,
      waiting: sim?.waiting ?? null,
      handlerCalls: sim?.handlerCalls ?? 0,
      handlersEver: handlerTotal(),
      replaying,
      saved: saved.length,
    };
  });
  $effect(() => {
    const url = new URL(location.href);
    url.searchParams.set("workflow", fixture.id);
    history.replaceState(null, "", url);
  });

  function exportRun() {
    const run = saved[0];
    if (!run) return;
    const blob = new Blob([JSON.stringify({ format: "aegis-agent-events/1", simulated: true, workflow: fixture.id, request: run.request, decisions: run.decisions, events: run.events }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `agent-run-${fixture.id}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function pickFromCanvas(items: CanvasItem[]) {
    const item = items[0];
    if (!item) return;
    const hit = shown.findLast((event) => (event.kind === "artifact_created" && item.id.includes((event.data as { artifact: string }).artifact)) || (event.part && item.id.includes(event.part) && event.kind.startsWith("task_")));
    if (hit) selected = hit;
  }
  const actorLabel = (actor: string) => {
    if (actor === "lead") return "Lead agent";
    if (actor === "person") return "You";
    if (actor === "app") return "The app (Rust admission)";
    const queued = events.find((event) => event.kind === "task_queued" && event.actor === actor);
    return queued ? `Part ${(queued.data as { title: string }).title} (${(queued.data as { helper: string }).helper} helper)` : actor;
  };
  const roleOf = (actor: string): Role | null => {
    if (actor === "lead") return "lead";
    const queued = events.find((event) => event.kind === "task_queued" && event.actor === actor);
    const helper = (queued?.data as { helper?: string } | undefined)?.helper;
    return helper === "research" ? "light" : helper === "computer" ? "lead" : helper ? "page" : null;
  };
  const json = (value: unknown) => {
    const text = JSON.stringify(value, (_, each) => (typeof each === "string" && each.length > 400 ? `${each.slice(0, 400)}…` : each), 1);
    return text && text.length > 4000 ? `${text.slice(0, 4000)}\n…` : text;
  };
  const registryFor = (kind: string) => ENTRIES.find((entry) => entry.id === `object-${kind}`);
  const ORIGIN = { zephium: "Zephium source", aegis: "AEGIS proposal", lab: "Lab simulation" } as const;
  const ms = (t: number) => `${(t / 1000).toFixed(2)} s`;
  const personas = Object.entries(Object.groupBy(FIXTURES, (each) => each.persona)) as [keyof typeof PERSONA_LABEL, typeof FIXTURES][];
</script>

<div class="lab">
  <aside class="rail scrolls">
    <header>
      <strong>AEGIS Agent Execution Lab</strong>
      <span>Zephium Work agent · commit 9026a1f · development only</span>
      <a class="nav" href="/dev/work-layout-lab/" data-nav="layout">← Work Layout Lab</a>
    </header>

    <section>
      <h3>Workflow</h3>
      <select aria-label="Workflow" value={fixture.id} onchange={(event) => choose(event.currentTarget.value)} data-control="workflow">
        {#each personas as [persona, list] (persona)}
          <optgroup label={PERSONA_LABEL[persona]}>
            {#each list as each (each.id)}<option value={each.id}>{each.title}{each.origin === "aegis" && !each.stress ? " (AEGIS)" : ""}</option>{/each}
          </optgroup>
        {/each}
      </select>
      <p class="small">{covered} of {ZEPHIUM_WORKFLOWS.length} Zephium start-screen workflows have a simulation; three more are AEGIS research modes.</p>
    </section>

    <section>
      <h3>Request · “What should we get done?”</h3>
      <textarea aria-label="Request" rows="3" bind:value={request} data-control="prompt"></textarea>
      <div class="row">
        <button type="button" class="primary" onclick={submit} data-action="submit">Submit request</button>
      </div>
      <div class="chips">
        {#each fixture.examples as example (example)}<button type="button" class="chip-button" onclick={() => (request = example)}>{example}</button>{/each}
      </div>
      {#if routed}<p class="small route" data-route>{routed.how}</p>{/if}
    </section>

    <section>
      <h3>Run controls</h3>
      <div class="row wrap">
        <button type="button" class="primary" onclick={start} data-action="start" disabled={playing}>{sim ? "Resume" : "Start simulation"}</button>
        <button type="button" onclick={() => (playing = false)} data-action="pause">Pause</button>
        <button type="button" onclick={step} data-action="step">Step</button>
        <button type="button" onclick={toEnd} data-action="end">To end</button>
        <button type="button" onclick={replay} data-action="replay" disabled={!saved.length && !finished}>Replay</button>
        <button type="button" onclick={() => reset()} data-action="reset">Reset</button>
      </div>
      <label class="line">Speed
        <select bind:value={speed} aria-label="Speed">
          <option value={40}>Fast</option>
          <option value={140}>Normal</option>
          <option value={420}>Slow</option>
        </select>
      </label>
      <label class="line"><input type="checkbox" bind:checked={interactive} onchange={() => reset()} /> Pause for my approvals</label>
      <p class="small">Mode: <b>Simulation</b> (deterministic fixture). <span class="off">Live execution: not enabled</span> — it needs the AEGIS backend and your explicit go-ahead; see the integration roadmap.</p>
    </section>

    <section>
      <h3>Models (simulated)</h3>
      {#each ROLES as role (role.id)}
        <label class="stack">
          <span>{role.id} — <i>{role.zephium.split(":")[0]}</i></span>
          <select aria-label={`${role.id} model`} bind:value={models[role.id]} onchange={() => reset()}>
            {#each MODELS as model (model.id)}<option value={model.id}>{model.label}{model.owner === "lab" ? "" : ` · ${model.provider}`}</option>{/each}
          </select>
        </label>
      {/each}
      {#if faults.length}<p class="warn" data-faults>{faults.join(" ")}</p>{/if}
      <p class="small">Names from the AEGIS configuration (no keys read). No call is made.</p>
    </section>

    <section>
      <h3>Skills</h3>
      <label class="stack">
        <span>Start the run from a workflow skill (grant.skill)</span>
        <select aria-label="Starting skill" bind:value={started} onchange={() => reset()} data-control="skill">
          <option value="">None — the lead loads one itself</option>
          {#each ZEPHIUM_SKILLS as each (each.name)}<option value={each.name}>{each.name}</option>{/each}
        </select>
      </label>
      <p class="small">Offered to the lead for this request: {skillsNow.offered.length} of {ZEPHIUM_SKILLS.length} (skills.rs for_request).{#if skillsNow.withheld.length} Withheld: {skillsNow.withheld.map((row) => row.skill.name).join(", ")}.{/if}</p>
    </section>

    <section>
      <h3>Tool permissions</h3>
      {#each PERMISSIONS as permission (permission.id)}
        <label class="line" title={permission.note}>
          <input type="checkbox" bind:checked={permissions[permission.id]} onchange={() => reset()} data-permission={permission.id} />
          {permission.label}
        </label>
      {/each}
      {#if missing.length}<p class="warn">This workflow uses {missing.join(", ")}: expect refusals and parts that end with a fix on their row.</p>{/if}
    </section>
  </aside>

  <main class="stage">
    <div class="bar">
      <div class="title">
        <strong>{fixture.title}</strong>
        <span class="chip real">Genuine Zephium canvas</span>
        <span class="chip sim">Simulated run · invented data</span>
        <span class="chip off">No AI · no network</span>
        {#if replaying}<span class="chip warn-chip" data-replaying>Replay · no tool runs</span>{/if}
      </div>
      <nav class="tabs" aria-label="Views">
        {#each [["canvas", "Canvas"], ["graph", "Execution graph"], ["events", "Events"], ["plan", "Plan"], ["tools", "Tools"], ["providers", "Providers"]] as [id, label] (id)}
          <button type="button" class:on={tab === id} onclick={() => (tab = id as typeof tab)} data-tab={id}>{label}</button>
        {/each}
      </nav>
    </div>

    <div class="view" data-lab-view>
      {#if tab === "canvas"}
        {#if sim && cursor > 0}
          {#key `${fixture.id}:${runId}`}
            <LabCanvas scene={projected.scene} full={whole} onselect={pickFromCanvas} />
          {/key}
        {:else}
          <div class="empty" data-empty>
            <p><b>{fixture.title}</b> — {fixture.fidelity}</p>
            <p>Press <b>Start simulation</b> or <b>Submit request</b>. The canvas fills from the run's events, drawn by Zephium's own components.</p>
          </div>
        {/if}
      {:else if tab === "graph"}
        <ExecGraph bind:this={graphView} {graph} selected={selected?.id} onselect={(event) => (selected = event)} />
        <button type="button" class="fit" onclick={() => graphView?.fit()}>Fit</button>
      {:else if tab === "events"}
        <div class="scroll-pane">
          <table class="events" data-events>
            <thead><tr><th>#</th><th>Time</th><th>Event</th><th>Actor</th><th>What</th><th>Contract</th></tr></thead>
            <tbody>
              {#each shown as event (event.id)}
                <tr class:on={selected?.id === event.id} class:fail={!!event.error} onclick={() => (selected = event)} data-seq={event.seq}>
                  <td>{event.seq}</td><td>{ms(event.t)}</td><td><code>{event.kind}</code></td><td>{actorLabel(event.actor)}</td><td>{event.label}</td><td><span class="origin {event.origin}">{ORIGIN[event.origin]}</span></td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if !shown.length}<p class="none pad">No events yet.</p>{/if}
        </div>
      {:else if tab === "plan"}
        <div class="scroll-pane pad">
          <p class="note">AEGIS intermediate representation, derived from the lead's calls. <b>Zephium keeps no plan record</b>: its plan is the tool calls of each turn. The engine validates each task's tools against the registry and runs only what is supported; the canvas places results with Zephium's own geometry.</p>
          <table class="events" data-plan>
            <thead><tr><th>Task</th><th>Type</th><th>Depends on</th><th>Tools</th><th>Outputs</th><th>Verification</th><th>Status</th></tr></thead>
            <tbody>
              {#each tasks as task (task.id)}
                <tr class="status-{task.status}"><td><b>{task.title}</b><br /><code>{task.id}</code></td><td>{task.type}</td><td>{task.depends_on.join(", ") || "—"}</td><td>{task.tools.join(", ")}</td><td>{task.outputs.join(", ")}{#if task.artifacts.length}<br /><small>{task.artifacts.length} placed</small>{/if}</td><td class="small">{task.verification}</td><td><span class="status">{task.status}</span></td></tr>
              {/each}
            </tbody>
          </table>
          <h4>Relations recorded so far (AEGIS relations.py types) · {relations.length}</h4>
          <p class="small">{Object.entries(Object.groupBy(relations, (row) => row.type)).map(([type, rows]) => `${type} ${rows?.length}`).join(" · ") || "None yet."}</p>
        </div>
      {:else if tab === "tools"}
        <div class="scroll-pane pad">
          <p class="note">Every tool in the source, with what admits it. The lead's ten tools in prompt.rs order: {LEAD_TOOL_ORDER.join(", ")}.</p>
          <table class="events" data-tools>
            <thead><tr><th>Tool</th><th>Offered to</th><th>Permission · approval</th><th>Record</th><th>Object</th><th>Availability</th><th>AEGIS today</th></tr></thead>
            <tbody>
              {#each TOOLS as tool (tool.id)}
                <tr><td><code>{tool.id}</code><br /><small>{tool.summary}</small></td><td>{tool.scopes.join(", ")}</td><td>{tool.permission ?? "—"}<br /><small>{tool.approval ?? "No approval"}</small></td><td class="small">{tool.record}</td><td class="small">{tool.creates ?? "—"}</td><td><span class="status {tool.availability}">{tool.availability}</span>{#if tool.availabilityNote}<br /><small>{tool.availabilityNote}</small>{/if}</td><td class="small">{tool.aegis}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="scroll-pane pad" data-providers>
          <h4>Configured AEGIS models (names only)</h4>
          <table class="events">
            <thead><tr><th>Model</th><th>Slot</th><th>Context</th><th>Tools</th><th>Vision</th><th>Structured</th><th>Note</th></tr></thead>
            <tbody>
              {#each MODELS as model (model.id)}
                <tr><td><b>{model.label}</b><br /><code>{model.id}</code></td><td class="small">{model.slot ?? (model.owner === "lab" ? "Lab only" : "—")}</td><td>{model.context.toLocaleString()}</td><td>{model.supports.tools ? "yes" : "no"}</td><td>{model.supports.vision ? "yes" : "no"}</td><td>{model.supports.structured ? "yes" : "no"}</td><td class="small">{model.note}</td></tr>
              {/each}
            </tbody>
          </table>
          <h4>Zephium provider kinds (model.rs)</h4>
          <p class="small">{ZEPHIUM_PROVIDERS.map((p) => `${p.id} (${p.wire})`).join(" · ")}</p>
          <h4>Roles</h4>
          <ul class="small">{#each ROLES as role (role.id)}<li><b>{role.id}</b> — Zephium: {role.zephium}. AEGIS: {role.aegis}.</li>{/each}</ul>
          <h4>Errors and limits</h4>
          <table class="events"><thead><tr><th>Zephium (call.rs)</th><th>Handling</th></tr></thead><tbody>{#each MODEL_ERRORS as row (row.error)}<tr><td><code>{row.error}</code></td><td class="small">{row.handling}</td></tr>{/each}</tbody></table>
          <table class="events"><thead><tr><th>AEGIS (providers.py)</th><th>Handling</th></tr></thead><tbody>{#each AEGIS_ERRORS as row (row.error)}<tr><td><code>{row.error}</code></td><td class="small">{row.handling}</td></tr>{/each}</tbody></table>
        </div>
      {/if}
    </div>

    <div class="replay">
      <button type="button" onclick={() => ((playing = false), (cursor = Math.max(0, cursor - 1)))} aria-label="Previous event">◀</button>
      <button type="button" class="play" onclick={() => (playing ? (playing = false) : start())}>{playing ? "Pause" : sim ? "Play" : "Start"}</button>
      <button type="button" onclick={step} aria-label="Next event">▶</button>
      <input type="range" min="0" max={events.length} value={cursor} aria-label="Event position" oninput={(event) => ((playing = false), (cursor = Number(event.currentTarget.value)))} />
      <span class="beat" data-cursor={cursor} data-total={events.length}>
        <b>{cursor}/{events.length}</b>
        {shown.at(-1)?.label ?? "Not started"}
        {#if shown.at(-1)?.detail}<i>{shown.at(-1)?.detail}</i>{/if}
      </span>
    </div>

    {#if waitingEvent}
      {@const data = (waitingEvent.data ?? {}) as { purpose?: string; options?: string[]; answer?: string; old?: string; new?: string }}
      <div class="approval" data-approval={data.purpose}>
        <b>The run is waiting for you</b>
        <p>{waitingEvent.label}</p>
        {#if data.purpose === "file"}
          <pre class="diff"><span class="del">- {data.old}</span>
<span class="add">+ {data.new}</span></pre>
        {/if}
        <p class="small">{waitingEvent.zephium}. Nothing continues on this branch until you decide; the deadline stands still.</p>
        <div class="row">
          <button type="button" class="primary" onclick={() => decide("approve")} data-decide="approve">{data.purpose === "question" ? `Answer “${data.answer}”` : data.purpose === "file" ? "Approve change" : (data.answer ?? "Allow")}</button>
          <button type="button" onclick={() => decide("decline")} data-decide="decline">{data.purpose === "file" ? "Decline" : data.purpose === "question" ? "Don't answer" : "Not now"}</button>
        </div>
      </div>
    {/if}
  </main>

  <aside class="inspector scrolls" data-inspector>
    {#if selected}
      {@const event = selected}
      {@const tool = event.tool ? toolOf(event.tool) : undefined}
      {@const role = roleOf(event.actor)}
      {@const artifactKind = event.kind === "artifact_created" ? (event.data as { kind: string }).kind : undefined}
      {@const registry = artifactKind ? registryFor(artifactKind) : undefined}
      <div class="head">
        <h2>{event.label}</h2>
        <button type="button" class="close" onclick={() => (selected = null)} aria-label="Close">×</button>
      </div>
      <p><span class="origin {event.origin}" data-origin={event.origin}>{ORIGIN[event.origin]}</span></p>
      <dl>
        <dt>Node type</dt><dd><code>{event.kind}</code> · event {event.seq} of {events.length}</dd>
        <dt>Execution ID</dt><dd><code>run-{fixture.id}</code> · <code>{event.id}</code>{#if event.step} · step <code>{event.step}</code>{/if}</dd>
        <dt>Agent</dt><dd>{actorLabel(event.actor)}{#if event.turn} · turn {event.turn}{/if}</dd>
        {#if role}<dt>Model (simulated)</dt><dd>{modelOf(models[role])?.label} · role {role}</dd>{/if}
        <dt>Skill</dt><dd>{shown.filter((each) => each.kind === "skill_loaded").map((each) => (each.data as { name: string }).name).join(", ") || "None loaded yet"}</dd>
        {#if event.detail}<dt>Detail</dt><dd class="pre">{event.detail}</dd>{/if}
        <dt>Status</dt><dd>{event.error ? `Failed: ${event.error}` : event.kind}</dd>
        <dt>Timing</dt><dd>at {ms(event.t)}{#if event.ms} · took {ms(event.ms)}{/if} (simulated clock)</dd>
        <dt>Zephium record</dt><dd class="small">{event.zephium}</dd>
        {#if event.handler}<dt>Backend handler</dt><dd><code class="wrap">{event.handler}</code></dd>{/if}
        {#if event.cause}<dt>Depends on</dt><dd>{#each events.filter((each) => each.id === event.cause) as cause (cause.id)}<button type="button" class="link" onclick={() => (selected = cause)}>{cause.seq}. {cause.label}</button>{/each}</dd>{/if}
        {#if events.some((each) => each.cause === event.id)}<dt>Led to</dt><dd>{#each events.filter((each) => each.cause === event.id).slice(0, 12) as next (next.id)}<button type="button" class="link" onclick={() => (selected = next)}>{next.seq}. {next.label}</button>{/each}</dd>{/if}
      </dl>
      {#if tool}
        <h4>Tool · {tool.id}</h4>
        <dl>
          <dt>Input schema</dt><dd><code class="wrap">required: {tool.schema.required.join(", ") || "none"}</code><ul class="small">{#each Object.entries(tool.schema.properties) as [key, value] (key)}<li><code>{key}</code>: {value}</li>{/each}</ul></dd>
          <dt>Output</dt><dd class="small">{tool.output}</dd>
          <dt>Source</dt><dd><code class="wrap">{tool.source}</code></dd>
          <dt>Permission · approval</dt><dd class="small">{tool.permission ?? "none"} · {tool.approval ?? "no approval"}</dd>
          <dt>Errors</dt><dd class="small">{tool.errors}</dd>
          <dt>Availability in the source</dt><dd><span class="status {tool.availability}">{tool.availability}</span> {tool.availabilityNote ?? ""}</dd>
          <dt>AEGIS today</dt><dd class="small">{tool.aegis}</dd>
        </dl>
      {/if}
      {#if event.kind === "skill_loaded"}
        {@const data = event.data as { name: string; why: string; tools: string[]; role: string | null; path: string; owner: string }}
        {@const skill = skillOf(data.name)}
        <h4>Skill · {data.name}</h4>
        <dl>
          <dt>Why it was selected</dt><dd>{data.why}</dd>
          <dt>Tools it lists</dt><dd>{data.tools.join(", ") || "none"} <span class="small">(advisory, never a grant: skills.rs)</span></dd>
          <dt>Model requirement</dt><dd>{data.role ?? "none — the lead's own model"}</dd>
          <dt>Definition</dt><dd><code class="wrap">{data.path}</code></dd>
          <dt>Related tasks</dt><dd class="small">{tasks.filter((task) => task.type !== "load_skill").map((task) => task.title).join(" · ")}</dd>
          <dt>Produced results</dt><dd class="small">{shown.filter((each) => each.kind === "artifact_created").map((each) => (each.data as { kind: string }).kind).join(", ") || "none yet"}</dd>
        </dl>
        {#if skill}<pre class="body" data-skill-body>{skill.body}</pre>{/if}
      {/if}
      {#if registry}
        <h4>Renderer (from the Work Layout Lab registry)</h4>
        <dl>
          <dt>Component</dt><dd>{registry.renderer}</dd>
          <dt>Schema</dt><dd><code class="wrap">{registry.schema}</code></dd>
          <dt>Status in AEGIS</dt><dd><b>{registry.aegis}</b><br /><span class="small">{registry.aegisNote}</span></dd>
          <dt>See it alone</dt><dd><a href={`/dev/work-layout-lab/?entry=${registry.id}`} data-nav="registry">{registry.name} in the Work Layout Lab</a></dd>
        </dl>
      {/if}
      {#if event.data}
        <h4>Recorded data</h4>
        <pre>{json(event.data)}</pre>
      {/if}
    {:else}
      <h2>{fixture.title}</h2>
      <p class="group">{PERSONA_LABEL[fixture.persona]} · {fixture.origin === "zephium" ? "Zephium workflow" : "AEGIS workflow"}{fixture.skill ? ` · skill ${fixture.skill}` : ""}</p>
      <p class="note">{fixture.fidelity}</p>
      <dl>
        <dt>How the request reached it</dt>
        <dd>{routed?.how ?? (started ? `Started from the workflow: grant.skill = ${started}; the lead begins with it loaded (lead.rs drive).` : "Chosen in the lab's workflow list.")}</dd>
        <dt>Zephium: skills offered to the lead</dt>
        <dd class="small">{skillsNow.offered.length} offered. {#each skillsNow.withheld as row (row.skill.name)}<br /><b>{row.skill.name}</b> withheld: {row.why}{/each}</dd>
        <dt>AEGIS today: skills chosen before planning</dt>
        <dd class="small">{aegisSkills.map((row) => `${row.skill.name} (${row.how}${row.hits.length ? `: “${row.hits.join("”, “")}”` : ""})`).join(" · ") || "none"} — skills.py select_many</dd>
        <dt>AEGIS today: this workflow's pipeline</dt>
        <dd class="small">{fixture.aegisMode ? `catalog.py mode “${fixture.aegisMode}”: plan → discover → analyze → verify → fill gaps → write → publish (stages by mode), one report, then canvas objects projected from it` : "No AEGIS workflow"}</dd>
        <dt>This run</dt>
        <dd data-counters>{events.length} events · {shown.filter((e) => e.kind === "task_queued").length} parts · {shown.filter((e) => e.kind === "artifact_created").length} objects · {shown.filter((e) => e.kind === "source_collected").length} sources · {relations.length} relations
          <br />Tool handlers run: <b data-handlers>{replaying ? 0 : (sim?.handlerCalls ?? 0)}</b>{#if replaying} (replay reads recorded events; <b data-replay-handlers>{replayHandlerCalls}</b> handlers run){/if}</dd>
      </dl>
      <h4>Saved runs (this tab only)</h4>
      {#if saved.length}
        <ul class="log">{#each saved as run (run.id)}<li data-saved>{run.at} · {run.title} · {run.events.length} events</li>{/each}</ul>
        <button type="button" onclick={exportRun}>Export the last run as JSON</button>
      {:else}<p class="none">A finished run is kept here, in memory only.</p>{/if}
      <h4>Event kinds</h4>
      <ul class="kinds">{#each EVENT_KINDS as row (row.kind)}<li><code>{row.kind}</code> <span>{row.zephium}</span></li>{/each}</ul>
      <p class="small">Select a card on the canvas, a node in the graph or a row in Events to inspect it.</p>
    {/if}
  </aside>
</div>

<style>
  .lab {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: 292px minmax(0, 1fr) 360px;
    background: var(--color-chrome);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 12.5px;
  }
  .rail,
  .inspector {
    overflow-y: auto;
    min-block-size: 0;
    padding: 12px 14px 32px;
    line-height: 1.45;
  }
  .rail header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-block-end: 6px;
  }
  .rail header strong {
    font-size: 13.5px;
  }
  .rail header span,
  .small,
  .group,
  .none {
    color: var(--color-muted);
    font-size: 11px;
  }
  .nav {
    margin-block-start: 6px;
    color: #6aa3ff;
    font-size: 11.5px;
    text-decoration: none;
  }
  section {
    padding-block: 8px;
    border-block-start: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  }
  h3,
  h4,
  dt {
    margin: 4px 0 5px;
    color: var(--color-muted);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h4 {
    margin-block-start: 14px;
  }
  select,
  textarea {
    inline-size: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: 7px;
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
    color: var(--color-text);
    font: inherit;
  }
  textarea {
    resize: vertical;
  }
  option,
  optgroup {
    background: var(--color-chrome);
  }
  .row {
    display: flex;
    gap: 6px;
    margin-block: 6px;
  }
  .wrap {
    flex-wrap: wrap;
  }
  button {
    padding: 4px 10px;
    border: 0;
    border-radius: 7px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-text) 16%, transparent);
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .primary {
    background: color-mix(in srgb, #6aa3ff 38%, transparent);
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .chip-button {
    padding: 3px 8px;
    background: transparent;
    color: var(--color-muted);
    font-size: 11px;
    text-align: start;
  }
  .route {
    padding: 6px 8px;
    border-radius: 7px;
    background: color-mix(in srgb, #6aa3ff 12%, transparent);
  }
  .line {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-block: 2px;
    font-size: 12px;
  }
  .line select {
    inline-size: auto;
    margin-inline-start: auto;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-block-end: 6px;
    font-size: 11.5px;
  }
  .stack i {
    color: var(--color-muted);
    font-style: normal;
  }
  .warn {
    margin: 6px 0 0;
    padding: 6px 8px;
    border-radius: 7px;
    background: color-mix(in srgb, #e5534b 18%, transparent);
    font-size: 11.5px;
  }
  .off {
    color: #e0a53a;
  }
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    padding-block-start: 8px;
  }
  .bar {
    position: absolute;
    inset-block-start: 16px;
    inset-inline: 12px;
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    pointer-events: none;
  }
  .title,
  .tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--color-chrome) 90%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-text) 8%, transparent);
    pointer-events: auto;
  }
  .title strong {
    margin-inline-end: 4px;
    font-size: 13px;
    white-space: nowrap;
  }
  .chip {
    padding: 2px 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-muted);
    font-size: 10.5px;
    white-space: nowrap;
  }
  .chip.real {
    background: color-mix(in srgb, #3fb37f 22%, transparent);
    color: var(--color-text);
  }
  .warn-chip {
    background: color-mix(in srgb, #e0a53a 30%, transparent);
    color: var(--color-text);
  }
  .tabs button {
    padding: 3px 9px;
    background: transparent;
    color: var(--color-muted);
  }
  .tabs button.on {
    background: color-mix(in srgb, var(--color-text) 14%, transparent);
    color: var(--color-text);
    font-weight: 600;
  }
  .view {
    position: relative;
    flex: 1;
    overflow: hidden;
    min-block-size: 0;
    border-radius: 12px 12px 0 0;
    background: var(--color-canvas);
  }
  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-inline-size: 640px;
    margin: auto;
    padding: 80px 32px;
    color: var(--color-muted);
    line-height: 1.6;
  }
  .empty b {
    color: var(--color-text);
  }
  .fit {
    position: absolute;
    inset-block-start: 70px;
    inset-inline-end: 14px;
  }
  .scroll-pane {
    position: absolute;
    inset: 0;
    overflow: auto;
    padding-block-start: 64px;
  }
  .pad {
    padding-inline: 16px;
    padding-block-end: 24px;
  }
  .events {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
  }
  .events th {
    position: sticky;
    inset-block-start: 0;
    padding: 6px 8px;
    background: var(--color-canvas);
    color: var(--color-muted);
    font-weight: 600;
    text-align: start;
  }
  .events td {
    padding: 5px 8px;
    border-block-start: 1px solid color-mix(in srgb, var(--color-text) 7%, transparent);
    vertical-align: top;
  }
  .events tr {
    cursor: pointer;
  }
  .events tr.on td {
    background: color-mix(in srgb, #6aa3ff 16%, transparent);
  }
  .events tr.fail td:nth-child(3) {
    color: #e5534b;
  }
  .note {
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: color-mix(in srgb, #6aa3ff 13%, transparent);
    font-size: 12px;
  }
  .status {
    padding: 1px 6px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    font-size: 10.5px;
  }
  .status-done .status,
  .status.available {
    background: color-mix(in srgb, #3fb37f 28%, transparent);
  }
  .status-running .status,
  .status-waiting .status,
  .status.limited {
    background: color-mix(in srgb, #e0a53a 30%, transparent);
  }
  .status-failed .status,
  .status.unavailable {
    background: color-mix(in srgb, #e5534b 30%, transparent);
  }
  .origin {
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 10.5px;
    white-space: nowrap;
  }
  .origin.zephium {
    background: color-mix(in srgb, #3fb37f 26%, transparent);
  }
  .origin.aegis {
    background: color-mix(in srgb, #6aa3ff 30%, transparent);
  }
  .origin.lab {
    background: color-mix(in srgb, #e0a53a 30%, transparent);
  }
  .replay {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--color-chrome);
  }
  .replay .play {
    min-inline-size: 64px;
    background: color-mix(in srgb, #6aa3ff 34%, transparent);
    font-weight: 600;
  }
  .replay input {
    flex: 0 0 200px;
  }
  .beat {
    overflow: hidden;
    min-inline-size: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .beat b {
    margin-inline-end: 6px;
    font-variant-numeric: tabular-nums;
  }
  .beat i {
    margin-inline-start: 6px;
    color: var(--color-muted);
    font-style: normal;
  }
  .approval {
    position: absolute;
    inset-block-end: 64px;
    inset-inline-start: 50%;
    z-index: 40;
    inline-size: min(520px, 90%);
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--color-chrome);
    box-shadow:
      0 0 0 1px color-mix(in srgb, #e0a53a 60%, transparent),
      0 12px 40px rgba(0, 0, 0, 0.45);
    transform: translateX(-50%);
  }
  .approval p {
    margin: 6px 0;
  }
  .diff .del {
    color: #e5534b;
  }
  .diff .add {
    color: #3fb37f;
  }
  .inspector .head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 8px;
  }
  .inspector h2 {
    margin: 0;
    font-size: 15px;
  }
  .close {
    padding: 0 8px;
    font-size: 16px;
  }
  dl {
    margin: 0;
  }
  dt {
    margin-block-start: 10px;
  }
  dd {
    margin: 0;
  }
  dd ul {
    margin: 3px 0 0;
    padding-inline-start: 16px;
  }
  .pre {
    white-space: pre-wrap;
  }
  .link {
    display: block;
    margin-block: 2px;
    padding: 2px 6px;
    background: transparent;
    color: #6aa3ff;
    text-align: start;
  }
  code,
  pre {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
  }
  .wrap,
  code.wrap {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  pre {
    overflow: auto;
    max-block-size: 320px;
    margin: 0;
    padding: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    white-space: pre-wrap;
  }
  pre.body {
    max-block-size: 280px;
  }
  .log,
  .kinds {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .log li,
  .kinds li {
    padding: 2px 0;
    font-size: 11.5px;
  }
  .kinds span {
    color: var(--color-muted);
  }
  a {
    color: #6aa3ff;
  }
</style>
