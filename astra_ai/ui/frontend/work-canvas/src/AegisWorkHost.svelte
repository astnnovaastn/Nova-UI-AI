<!--
  Replaces Zephium's WorkEnvironmentWorkspace.svelte for AEGIS. The canvas, projection, bar,
  tools and activity line are upstream; this host adapts upstream's own wiring (see
  features/work/components/WorkEnvironmentWorkspace.svelte and tests/BoardCanvas.svelte,
  both MPL-2.0) to AEGIS research data. This file is therefore also MPL-2.0.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import {Designer} from "./designer/coordinator";
  import {reflowExpanded} from "./designer/reflow";
  import DesignerOverlay from "./designer/DesignerOverlay.svelte";
  import type {CanvasDesignerApi,LayoutRecord} from "./designer/types";
  import { SvelteMap } from "svelte/reactivity";
  import { BitsConfig, Popover } from "bits-ui";
  import { provideLeadLook } from "$shared/ui/presence";
  import Icon from "$shared/ui/Icon";
  import {
    ArrowDown01Icon,
    CheckListIcon,
    Cursor01Icon,
    HandIcon,
    PlusSignIcon,
    ShapeCollectionIcon,
  } from "@hugeicons/core-free-icons";
  import WorkCanvas from "$features/work/components/WorkCanvas.svelte";
  import WorkBar from "$features/work/components/bar/WorkBar.svelte";
  import BarTool from "$features/work/components/bar/BarTool.svelte";
  import AgentLine from "$features/work/components/AgentLine.svelte";
  import { composerEdge, composerHole } from "$features/work/lib/composer-hole";
  import { pointerTool, setPointerTool } from "$features/work/lib/pointer-tool.svelte";
  import {
    environmentAgents,
    environmentBoards,
    environmentInputs,
    environmentItems,
    environmentParts,
    environmentSources,
    environmentView,
  } from "$features/work/lib/project-environment";
  import {
    environmentStages,
    fetchedPictures,
    measurer,
    ownPlaces,
  } from "$features/work/lib/project-environment-board";
  import { environmentRequests, requestDress, runFolders } from "$features/work/lib/project-environment-thread";
  import { defaultSize, type CanvasLink, type CanvasView } from "$features/work/lib/canvas-model";
  import type { BoardActions } from "$features/work/lib/canvas-context";
  import { exchangeOf } from "$features/work/components/asks/asks";
  import Rail from "./Rail.svelte";
  import { buildScene, reportTitle, type CanvasScene } from "./research-to-run";
  import { aegisSession, asWorkSession } from "./session.svelte";
  import { store } from "./store.svelte";
  import { setCanvasPictures } from "./media";
  import { ACTIVE_JOBS, endedWords, setWaitingReason, wordsForWait } from "./waiting.svelte";
  import { pictureUrl } from "./report-images";
  import BrowserWindow from "./BrowserWindow.svelte";
  import { browser } from "./browser-windows.svelte";
  import type { PaperData } from "./paper";
  import WorkStart from "$features/work/components/start/WorkStart.svelte";
  import { installPreviewProvider, savedDataProvider } from "./preview-provider";
  import NodePanel, { type Opened } from "./NodePanel.svelte";
  import { CARD, layoutMap } from "./knowledge-map";
  import { agentBranches, mapOf, type AgentBranch, type MapNode } from "./work-run";
  import { relationsOf, strandLinks, type StrandData } from "./relations";
  import { LEGACY_GAPS, layoutPolicy } from "./layout-policy";
  import { construction } from "./construction.svelte";
  import HandOverlay from "./HandOverlay.svelte";
  import StrandPanel from "./StrandPanel.svelte";
  import { keptPositions, retrievalOrder, semanticLayout, type Box } from "./semantic-layout";
  import { PART, partLead } from "$features/work/lib/run/part-size";

  let { portal }: { portal: HTMLElement } = $props();

  const state = $derived(store.state);
  const actions = $derived(store.actions);
  const report = $derived(state.report);

  let value = $state("");
  let canvasApi = $state.raw<CanvasDesignerApi | null>(null);
  let designer = $state.raw<Designer | null>(null);
  let designerVersion = $state(0);
  let storedLayout = $state.raw<{page:string;record:LayoutRecord}|null>(null);
  const layoutRecord = $derived(storedLayout && storedLayout.page === report?.research_id ? storedLayout.record : null);
  $effect(() => {
    const page = report?.research_id, api = canvasApi;
    if (!page || !api) return;
    return untrack(() => {
      if (!actions) return;
      // A relation-aware run lays itself out; the organizer only keeps what the person moves.
      const current = new Designer(api, actions, page, () => untrack(() => designerVersion++),
        record => { storedLayout = {page,record}; }, () => !relationRun);
      designer = current;
      return () => { current.dispose(); if(designer===current)designer=null; };
    });
  });
  $effect(() => { if(!state.connected)untrack(()=>{if(designer && ['moving','paused','planning'].includes(designer.phase))designer.stop();}); });

  let tool = $state<"views" | "tasks" | "new" | null>(null);
  let cardHost = $state<HTMLElement>();
  let composerSurface = $state<HTMLElement>();
  let dockHeight = $state(64);
  let barDock = $state<HTMLElement>();
  /** The workflow card whose request still leads the composer, for the backend to run. */
  let skill = $state<string | null>(null);
  /** The start screen's two suggestions: it reads them from earlier works, so these seed it. */
  const SUGGESTED = [
    { requests: ["Explain how this code works:"], touched_ms: "2" },
    { requests: ["Map the architecture of"], touched_ms: "1" },
  ];

  // The words for a wait or a stop, from the recorded reason, for the run's steps to say.
  const reasonWords = $derived(
    report?.phase === "failed" ? endedWords(report.waiting_reason ?? "", "failed") : wordsForWait(report?.waiting_reason ?? ""),
  );
  $effect(() => setWaitingReason(report?.waiting_reason ?? ""));
  const scene = $derived<CanvasScene | null>(report ? buildScene(report, reasonWords, state.trace, wordsForWait) : null);
  provideLeadLook(() => report?.research_id ?? "aegis");

  $effect(() => {
    const current=designer, status=scene?.state, title=report?.query ?? '';
    if(current && status)untrack(()=>current.observeRun(status,title));
  });

  let picturesReady = $state(0);
  $effect(() => {
    const current = scene;
    if (!current) return;
    installPreviewProvider(savedDataProvider(current.previews));
    const id = current.name;
    void (async () => {
      const frames = new Map<string, string>();
      await Promise.all(
        [...current.frameIds].map(async ([step, image]) => {
          const url = await pictureUrl(id, image);
          if (url) frames.set(step, url);
        }),
      );
      if (store.state.report?.research_id !== id) return;
      setCanvasPictures({ pictures: new Map(), frames });
      picturesReady++;
    })();
  });

  const measured = new SvelteMap<string, number>();
  const expandedSources = new SvelteMap<string,{width:number;height:number}>();
  $effect(()=>{void report?.research_id;untrack(()=>expandedSources.clear());});
  let open = $state<string | null>(null);

  $effect(() => {
    aegisSession.update(
      scene ? ([...scene.objectives.values()][0] ?? null) : null,
      scene?.signals ?? [],
      scene?.pages ?? [],
    );
  });

  const recorded = () => scene?.pages ?? [];
  const stages = $derived(
    scene
      ? environmentStages(scene.snapshot, scene.objectives, {
          recorded,
          pictures: new Map(),
          fetched: fetchedPictures(scene.snapshot, new Map()),
          measured,
          open,
          exchange: exchangeOf,
        })
      : [],
  );
  const requests = $derived(environmentRequests(stages));
  const own = $derived(scene ? environmentView(scene.snapshot) : null);
  const agents = $derived(scene ? environmentAgents(scene.snapshot, scene.objectives, () => scene?.signals.at(-1)?.activity, stages) : { items: [], positions: {} });
  const folders = $derived(runFolders(stages));
  const dress = $derived(requestDress(stages));
  const baseItems = $derived(scene ? environmentItems(scene.snapshot, [], [], scene.objectives, new Map()) : []);
  /** The list's own rows and padding, allowing for long search words and details to wrap. */
  const stepsHeight = (lines: readonly { text: string; detail?: string }[]) =>
    24 + lines.reduce((sum, line) => sum + 6 + 20 * Math.ceil(Math.max(1, line.text.length) / 40) + (line.detail ? 18 * Math.ceil(line.detail.length / 48) : 0), 0);
  /** Each paper stands right of its run, in one column, so a long sheet never covers another. */
  const PAPER = { width: 760, height: 960 };
  // Page cards read their saved images when drawn, so they are drawn again once those arrive.
  const partItems = $derived.by(() => {
    void picturesReady;
    return scene ? environmentParts(scene.objectives, stages, recorded) : [];
  });
  // The run's actual cards. Its lane box also reserves room for a result column, which the paper replaces.
  const rightOf = (stage: (typeof stages)[number]) =>
    Math.max(
      stage.place.x + stage.place.width,
      ...stage.column.parts.map((id) => {
        const part = partItems.find((item) => item.id === id);
        return (stage.targets[id]?.x ?? 0) + (part ? defaultSize(part).width : 0);
      }),
    );

  /** Before its paper arrives, a run's lane also holds its source list and waiting line: everything stands right of those. */
  const clearOf = (stage: (typeof stages)[number]) =>
    scene?.papers.length
      ? rightOf(stage)
      : Math.max(rightOf(stage), ...Object.values(stage.lane.rects as Record<string, { x: number; width: number }>).map((rect) => rect.x + rect.width));

  /** The workers beside the sources they read, converging on the lead, as the record shows them. */
  const AGENT = { width: 300, height: 176 };
  const branches = $derived(agentBranches(state.run, state.trace));
  /**
   * A run that records its relations draws only those as strings, and lays out by its mode's policy.
   * Older runs, saved before relations existed, keep their lines and placement exactly as they were.
   */
  const relations = $derived(relationsOf(state.run as { relations?: unknown } | null));
  const relationRun = $derived.by(() => {
    const run = state.run as { relations?: unknown; state?: string } | null | undefined;
    if (!run || !Array.isArray(run.relations)) return false;
    return run.relations.length > 0 || ["queued", "running", "waiting", "needs_input"].includes(run.state ?? "");
  });
  const policy = $derived(
    relationRun
      ? layoutPolicy({
          mode: state.run?.plan?.mode,
          workers: state.run?.assignments?.length ?? 0,
          sources: state.run?.evidence?.length ?? 0,
        })
      : null,
  );
  const gaps = $derived(policy?.gaps ?? LEGACY_GAPS);
  const agentPlan = $derived.by(() => {
    const placed: { agent: AgentBranch; x: number; y: number }[] = [];
    const first = stages[0];
    if (!first || !branches.length) return placed;
    // A live run's steps list stands under its lanes; a policy run's agents clear it too.
    const steps = policy && scene?.steps.length ? first.place.x + Math.max(first.place.width, 340) : -Infinity;
    const start = Math.max(...stages.map(clearOf), steps) + gaps.column;
    const middle = first.place.y + first.place.height / 2;
    const discovery = branches.find((row) => row.role === "discovery");
    const lead = branches.find((row) => row.role === "lead");
    const specialists = branches.filter((row) => row !== discovery && row !== lead);
    // Discovery stands over the lanes it found.
    const top = Math.min(first.place.y, ...first.column.parts.map((id) => first.targets[id]?.y ?? first.place.y));
    if (discovery) placed.push({ agent: discovery, x: first.targets[first.column.parts[0] ?? ""]?.x ?? first.place.x + first.place.width + gaps.column, y: top - AGENT.height - (policy?.discoveryLift ?? 56) });
    specialists.forEach((agent, index) => {
      placed.push({ agent, x: start, y: middle - (specialists.length * (AGENT.height + gaps.row) - gaps.row) / 2 + index * (AGENT.height + gaps.row) });
    });
    if (lead) placed.push({ agent: lead, x: start + (specialists.length ? AGENT.width + gaps.paper : 0), y: middle - AGENT.height / 2 });
    return placed;
  });
  const agentItems = $derived(
    agentPlan.map(({ agent }) => ({
      id: `worker:${agent.agent}`,
      type: "agentcard",
      kind: agent.title,
      title: agent.title,
      detail: agent.summary,
      status: "",
      size: AGENT,
      branch: agent,
    })) as unknown as typeof baseItems,
  );
  const agentRight = $derived(agentPlan.length ? Math.max(...agentPlan.map((row) => row.x + AGENT.width)) : -Infinity);

  /** A knowledge map stands right of the lanes, under the agents and the paper, as real cards in groups. */
  const knowledge = $derived(mapOf(state.run));
  const mapPlan = $derived.by(() => {
    const first = stages[0];
    if (!knowledge || !first) return null;
    const left = Math.max(...stages.map(clearOf)) + gaps.column;
    const floor = Math.max(
      first.place.y + first.place.height,
      ...agentPlan.map((row) => row.y + AGENT.height),
      ...paperPlan.map((row) => row.y + PAPER.height),
    );
    const layout = layoutMap(knowledge);
    if (policy) {
      // Structured runs: the map goes beside the run or under it, whichever fits the screen better.
      const origin = Math.min(first.place.x, ...agentPlan.map((row) => row.x));
      const top = Math.min(first.place.y, ...agentPlan.map((row) => row.y), ...paperPlan.map((row) => row.y));
      const right = Math.max(first.place.x + first.place.width, agentRight, ...paperPlan.map((row) => row.x + PAPER.width));
      const mapBox = { width: Math.max(0, ...layout.groups.map((g) => g.x + g.width), ...layout.nodes.map((n) => n.x + CARD.width)), height: Math.max(0, ...layout.groups.map((g) => g.y + g.height), ...layout.nodes.map((n) => n.y + CARD.height)) };
      const placement = layoutPolicy({
        mode: state.run?.plan?.mode, workers: state.run?.assignments?.length ?? 0, sources: state.run?.evidence?.length ?? 0,
        run: { width: right - origin, height: floor - top }, map: mapBox,
        view: { width: cardHost?.clientWidth ?? 0, height: cardHost?.clientHeight ?? 0 },
      }).map;
      if (placement === "right") return { layout, x: right + gaps.map, y: top, place: placement, box: mapBox };
      return { layout, x: left, y: floor + gaps.map, place: placement, box: mapBox };
    }
    return { layout, x: left, y: floor + 90, place: "below" as const, box: null };
  });
  const mapItems = $derived(
    mapPlan
      ? ([
          ...mapPlan.layout.groups.map((group) => ({
            id: `mapgroup:${group.id}`,
            type: "mapgroup",
            kind: "Group",
            title: group.title,
            detail: "",
            status: "",
            size: { width: group.width, height: group.height },
          })),
          ...mapPlan.layout.nodes.map((node) => ({
            id: `map:${node.id}`,
            type: "blueprint",
            kind: node.kind,
            title: node.title,
            detail: node.summary,
            status: "",
            size: CARD,
            node,
          })),
        ] as unknown as typeof baseItems)
      : [],
  );
  const mapLinks = $derived<CanvasLink[]>(
    mapPlan
      ? [
          ...(knowledge?.edges ?? []).map((edge) => ({
            id: `map-link:${edge.from}:${edge.to}`,
            source: `map:${edge.from}`,
            target: `map:${edge.to}`,
            kind: "flow" as const,
            ...(edge.label ? { label: edge.label } : {}),
          })),
        ]
      : [],
  );

  const paperPlan = $derived.by(() => {
    const placed: { paper: PaperData; x: number; y: number; stage: (typeof stages)[number] }[] = [];
    if (!scene?.papers.length) return placed;
    const column = Math.max(...stages.map(rightOf), agentRight) + gaps.paper;
    let next = -Infinity;
    for (const paper of scene.papers) {
      const stage = stages.find((entry) => entry.executions.includes(paper.run));
      if (!stage) continue;
      const box = stage.lane.box as { y: number } | undefined;
      const y = Math.max(next, Math.min(stage.place.y, box?.y ?? stage.place.y));
      placed.push({ paper, x: column, y, stage });
      next = y + PAPER.height + 48;
    }
    return placed;
  });
  const paperItems = $derived(
    paperPlan.map(({ paper }) => ({
      id: `paper:${paper.id}`,
      type: "paper",
      kind: paper.label,
      title: paper.title,
      detail: "",
      status: "",
      size: PAPER,
      paper,
    })) as unknown as typeof baseItems,
  );
  const paperLinks = $derived<CanvasLink[]>(
    paperPlan.flatMap(({ paper, stage }) =>
      (agentPlan.some((row) => row.agent.role === "lead") ? ["worker:lead"] : stage.column.parts.length ? stage.column.parts : [stage.card]).map((source) => ({
        id: `paper-link:${paper.id}:${source}`.slice(0, 180),
        source,
        target: `paper:${paper.id}`,
        kind: "flow" as const,
      })),
    ),
  );
  /** Request to discovery, the lanes to the specialists, and every branch into the lead. */
  const agentLinks = $derived.by<CanvasLink[]>(() => {
    const first = stages[0];
    if (!first || !agentPlan.length) return [];
    const has = (role: string) => agentPlan.some((row) => row.agent.role === role);
    const specialists = agentPlan.filter((row) => !["discovery", "lead"].includes(row.agent.role));
    const line = (source: string, target: string, working = false): CanvasLink => ({ id: `agent-link:${source}:${target}`.slice(0, 180), source, target, kind: "flow", ...(working ? { live: true } : {}) });
    const lanes = first.column.parts.length ? first.column.parts : [first.card];
    const links: CanvasLink[] = [];
    if (has("discovery")) links.push(line(first.card, "worker:worker_a", agentPlan.some((row) => row.agent.role === "discovery" && row.agent.state === "running")));
    const feeds = specialists.length ? specialists.map((row) => `worker:${row.agent.agent}`) : has("lead") ? ["worker:lead"] : [];
    const analysis = specialists.find((row) => row.agent.role === "analysis");
    for (const lane of lanes) {
      // Sources feed analysis; verification reads them too, so without analysis they feed it directly.
      for (const target of analysis ? [`worker:${analysis.agent.agent}`] : feeds) links.push(line(lane, target));
    }
    if (has("lead")) for (const row of specialists) links.push(line(`worker:${row.agent.agent}`, "worker:lead", row.agent.state === "running"));
    return links;
  });
  const trailItem = $derived.by(() => {
    const first = stages[0];
    if (!scene?.steps.length || !first) return null;
    return {
      id: `steps:${first.card}`,
      type: "trail",
      kind: "Research steps",
      title: "Research steps",
      detail: "",
      status: "",
      active: scene.state === "running",
      trail: scene.steps,
      size: { width: Math.max(first.place.width, 340), height: stepsHeight(scene.steps) },
    } as unknown as (typeof baseItems)[number];
  });
  /**
   * A relation-aware run's source card is only its windows: its caption stands above it, so the
   * card's box is what is drawn and every string meets the card's own border.
   */
  const slim = <T extends (typeof baseItems)[number]>(item: T): T => {
    const part = (item as unknown as { part?: { shape?: string } }).part;
    if (!relationRun || item.type !== "part" || !part || part.shape === "label") return item;
    const size = defaultSize(item);
    const width = Math.round(size.width - partLead - (part.shape === "pages" ? PART.badge : 0));
    return width >= 120 ? { ...item, size: { width, height: Math.max(80, Math.round(size.height)) } } : item;
  };
  /** Sizes the person set. In a relation-aware run, the organizer's own sizes give way to the cards'. */
  const keptSizes = $derived.by<Record<string, { width: number; height: number }>>(() => {
    const record = layoutRecord;
    if (!record) return {};
    if (!relationRun || !record.automatic) return record.sizes;
    return Object.fromEntries(Object.entries(record.sizes).filter(([id]) => record.constraints[id]?.manual || record.constraints[id]?.lockedSize || record.constraints[id]?.pinned));
  });
  const ORDERS = new Set(["objective", "request", "part", "paper", "agentcard", "blueprint", "sources"]);
  const view = $derived(state.view ?? { chosen: [], hidden: [] });
  const chosen = $derived(new Set(view.chosen));
  const hidden = $derived(new Set(view.hidden));
  const items = $derived.by(() => {
    void picturesReady;
    if (!scene) return [];
    const all = [
      ...mapItems,
      ...paperItems,
      ...agentItems,
      ...(trailItem ? [trailItem] : []),
      ...[...baseItems.filter((item) => !folders.has(item.id)), ...requests.items].map((item) =>
        dress.get(item.id) ? { ...item, ...dress.get(item.id) } : item,
      ),
      ...environmentBoards(stages),
      ...partItems,
      ...environmentInputs(stages),
      ...environmentSources(stages),
      ...agents.items,
    ];
    // Ask, Choose and Remove act on this view of the run, so run-drawn cards can take them.
    return all
      .filter((item) => !hidden.has(item.id))
      .map(slim)
      .map(item => ({...item, designer:true,
        positionPinned:!!layoutRecord?.constraints[item.id]?.pinned,
        sizeLocked:!!layoutRecord?.constraints[item.id]?.lockedSize,
        manualPosition:!!layoutRecord?.constraints[item.id]?.manual,
        ...(keptSizes[item.id] && item.type !== "sources"?{size:keptSizes[item.id]}:{})}))
      .map((item) => (ORDERS.has(item.type ?? "") ? { ...item, orders: true, ...(chosen.has(item.id) ? { decision: "Chosen for your next instruction" } : {}) } : item));
  });
  /**
   * Where a relation-aware run's cards stand: request, searches and steps; sources in the order
   * they were retrieved; the workers and AEGIS; the report; the map. Pure arithmetic over the
   * record (see semantic-layout.ts), so it costs no model call and a reload lands it identically.
   */
  const composed = (placed: Record<string, { x: number; y: number }>): Record<string, { x: number; y: number }> => {
    const first = stages[0];
    if (!first || stages.length !== 1) return {};
    const shown = new Map(items.map((item) => [item.id, item]));
    const box = (id: string): Box | null => {
      const item = shown.get(id);
      if (!item) return null;
      const size = (item as { size?: { width: number; height: number } }).size ?? defaultSize(item);
      return { id, width: Math.round(size.width), height: Math.round(size.height) };
    };
    const start = placed[first.card];
    const request = box(first.card);
    if (!start || !request) return {};
    const parts = items.filter((item) => item.type === "part") as unknown as { id: string; part?: { shape?: string; pages?: readonly { url: string }[] } }[];
    const evidence = new Map((state.run?.evidence ?? []).map((row, index) => [row.url, index]));
    const lanes = retrievalOrder(
      parts.filter((item) => item.part?.shape === "pages"),
      (item) => Math.min(...(item.part?.pages ?? []).map((page) => evidence.get(page.url) ?? Infinity)),
    );
    const discovery = agentPlan.find((row) => row.agent.role === "discovery");
    const specialists = agentPlan.filter((row) => !["discovery", "lead"].includes(row.agent.role));
    const present = (list: readonly (Box | null)[]) => list.filter((row): row is Box => !!row);
    const layout = semanticLayout({
      request: { ...request, ...start },
      under: present([
        ...(discovery ? [box(`worker:${discovery.agent.agent}`)] : []),
        ...parts.filter((item) => item.part?.shape !== "pages").map((item) => box(item.id)),
        ...(trailItem ? [box(trailItem.id)] : []),
      ]),
      sources: present(lanes.map((item) => box(item.id))),
      sourceList: box(items.find((item) => item.type === "sources")?.id ?? ""),
      workers: present(specialists.map((row) => box(`worker:${row.agent.agent}`))),
      lead: box("worker:lead"),
      papers: present(paperPlan.map(({ paper }) => box(`paper:${paper.id}`))),
      map: mapPlan?.box ? { ...mapPlan.box, place: mapPlan.place } : null,
      gaps,
    });
    const next: Record<string, { x: number; y: number }> = { ...layout.positions };
    if (mapPlan && layout.map) {
      for (const group of mapPlan.layout.groups) next[`mapgroup:${group.id}`] = { x: layout.map.x + group.x, y: layout.map.y + group.y };
      for (const node of mapPlan.layout.nodes) next[`map:${node.id}`] = { x: layout.map.x + node.x, y: layout.map.y + node.y };
    }
    // A working agent's mark stands at the source it reads: it moves with that source.
    for (const [id, at] of Object.entries(agents.positions)) {
      let nearest: string | null = null;
      let distance = Infinity;
      for (const lane of lanes) {
        const was = placed[lane.id];
        if (!was || !next[lane.id]) continue;
        const d = Math.hypot(at.x - was.x, at.y - was.y);
        if (d < distance) [nearest, distance] = [lane.id, d];
      }
      if (nearest) next[id] = { x: at.x + next[nearest].x - placed[nearest].x, y: at.y + next[nearest].y - placed[nearest].y };
    }
    return next;
  };
  const positions = $derived.by(() => {
    if (!scene || !own) return {};
    const placed = {
      ...ownPlaces(
        own.positions,
        { ...Object.fromEntries(baseItems.map((item) => [item.id, defaultSize(item)])), ...own.sizes },
        stages,
        baseItems.flatMap((item) => (item.type === "objective" || folders.has(item.id) ? [] : [item.id])),
      ),
      ...requests.positions,
      ...agents.positions,
      ...Object.fromEntries(paperPlan.map(({ paper, x, y }) => [`paper:${paper.id}`, { x, y }])),
      ...(trailItem && stages[0] ? { [trailItem.id]: { x: stages[0].place.x, y: stages[0].place.y + stages[0].place.height + 20 } } : {}),
      ...Object.fromEntries(agentPlan.map(({ agent, x, y }) => [`worker:${agent.agent}`, { x, y }])),
      ...(mapPlan
        ? Object.fromEntries([
            ...mapPlan.layout.groups.map((group) => [`mapgroup:${group.id}`, { x: mapPlan.x + group.x, y: mapPlan.y + group.y }]),
            ...mapPlan.layout.nodes.map((node) => [`map:${node.id}`, { x: mapPlan.x + node.x, y: mapPlan.y + node.y }]),
          ])
        : {}),
    };
    if (relationRun) Object.assign(placed, composed(placed));
    Object.assign(placed, relationRun ? keptPositions(layoutRecord) : (layoutRecord?.positions ?? {}));
    if(!expandedSources.size)return placed;
    return reflowExpanded(items.map(item=>({
      id:item.id,type:item.type ?? '',title:item.title ?? item.id,
      ...(placed[item.id] ?? {x:0,y:0}),...defaultSize(item),
      constraint:layoutRecord?.constraints[item.id],
      group:(item as unknown as {node?:{group?:string}}).node?.group ? "mapgroup:"+(item as unknown as {node:{group:string}}).node.group : undefined,
      container:item.type === "mapgroup",
    })),expandedSources).positions;
  });
  /**
   * The organizer applies a saved record to the cards directly when it loads or saves one. In a
   * relation-aware run, whatever that record placed for itself, rather than for the person, goes
   * back to the run's own composition; cards the person moved, pinned or resized stay.
   */
  $effect(() => {
    const api = canvasApi;
    const record = layoutRecord;
    if (!api || !record || !relationRun) return;
    untrack(() => {
      const kept = keptPositions(record);
      const ids = Object.keys(record.positions).filter((id) => !(id in kept) && positions[id]);
      const resized = Object.keys(record.sizes).filter((id) => !keptSizes[id]);
      if (!ids.length && !resized.length) return;
      const sizes = Object.fromEntries(
        items
          .filter((item) => resized.includes(item.id))
          .map((item) => [item.id, (item as { size?: { width: number; height: number } }).size ?? defaultSize(item)]),
      );
      api.setGeometry({ positions: Object.fromEntries(ids.map((id) => [id, positions[id]!])), sizes, constraints: record.constraints, groups: record.groups }, true);
    });
  });
  /**
   * While a run this canvas watched grows (or finishes), a card its composition moves travels
   * there frame by frame, so its strings stay on it all the way. Opening a saved run moves nothing.
   */
  let settled: { page: string; at: Record<string, { x: number; y: number }>; watched: boolean } = { page: "", at: {}, watched: false };
  let settleFrame = 0;
  $effect(() => {
    const next = positions;
    const api = canvasApi;
    const page = report?.research_id ?? "";
    const watching = live && relationRun;
    untrack(() => {
      const before = settled.page === page ? settled : { page, at: {}, watched: false };
      settled = { page, at: { ...next }, watched: before.watched || watching };
      if (!api || !relationRun || !settled.watched || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const moved = Object.keys(next).filter((id) => {
        const from = before.at[id];
        return from && (Math.abs(from.x - next[id]!.x) > 1 || Math.abs(from.y - next[id]!.y) > 1);
      });
      if (!moved.length) return;
      cancelAnimationFrame(settleFrame);
      const begun = performance.now();
      const constraints = layoutRecord?.constraints ?? {};
      const step = (now: number) => {
        const t = Math.min(1, (now - begun) / 480);
        const k = 1 - Math.pow(1 - t, 3);
        const at = Object.fromEntries(
          moved.map((id) => {
            const from = before.at[id]!;
            const to = next[id]!;
            return [id, { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k }];
          }),
        );
        api.setGeometry({ positions: at, sizes: {}, constraints, groups: layoutRecord?.groups ?? [] }, true);
        if (t < 1) settleFrame = requestAnimationFrame(step);
      };
      settleFrame = requestAnimationFrame(step);
    });
  });
  $effect(() => () => cancelAnimationFrame(settleFrame));
  /**
   * The strings of a relation-aware run: each backend relation resolved to the card that shows each
   * end. A relation with no card at one end, or both ends on one card, is kept for the inspector.
   */
  const strands = $derived.by(() => {
    const first = stages[0];
    if (!relationRun || !first) return { links: [], unplaced: [] };
    const present = new Set(items.map((item) => item.id));
    const run = state.run;
    const agentOf = new Map((run?.assignments ?? []).map((row) => [row.role, row.agent]));
    const urlOf = new Map((run?.evidence ?? []).map((row) => [row.id, row.url]));
    const laneOf = new Map<string, string>();
    for (const item of partItems as unknown as { id: string; part?: { pages?: readonly { url: string }[] } }[])
      for (const page of item.part?.pages ?? []) if (!laneOf.has(page.url)) laneOf.set(page.url, item.id);
    const sourcesCard = items.find((item) => item.type === "sources")?.id ?? null;
    const paper = paperPlan[0] ? `paper:${paperPlan[0].paper.id}` : null;
    const resolve = (ref: string) => {
      const [kind, rest = ""] = ref.split(/:(.*)/s);
      let id: string | null = null;
      if (ref === "request" || kind === "query") id = first.card;
      else if (kind === "agent") id = rest === "lead" ? "worker:lead" : agentOf.get(rest) ? `worker:${agentOf.get(rest)}` : null;
      else if (kind === "source") {
        const url = urlOf.get(rest);
        id = (url && laneOf.get(url)) || sourcesCard;
      } else if (ref === "report") id = paper;
      else if (kind === "map") id = `map:${rest}`;
      return id && present.has(id) ? id : null;
    };
    return strandLinks(relations, resolve);
  });
  /** What the canvas draws: a relation-aware run only its relations (and threads between requests). */
  const canvasLinks = $derived(
    (relationRun
      ? [...requests.links.filter((link) => link.kind !== "flow"), ...(strands.links as unknown as CanvasLink[])]
      : [...requests.links, ...paperLinks, ...agentLinks, ...mapLinks]
    ).filter((link) => !hidden.has(link.source) && !hidden.has(link.target)),
  );

  // The construction hand: plays back what a live run adds, from the moment this canvas opened.
  $effect(() => {
    const id = report?.research_id;
    if (!id || state.run === undefined) return;
    const isLive = live;
    untrack(() => construction.open(id, isLive && relationRun, [...items.map((item) => item.id), ...canvasLinks.map((link) => link.id)]));
  });
  const arrivals = () => ({
    nodes: items.map((item) => ({ id: item.id, x: positions[item.id]?.x ?? 0, y: positions[item.id]?.y ?? 0, label: (item.title || item.kind || "card").slice(0, 40) })),
    edges: (strands.links as { id: string; source: string; target: string; strand: StrandData }[]).map((link) => ({ id: link.id, source: link.source, target: link.target, label: link.strand.label })),
  });
  $effect(() => {
    const next = arrivals();
    untrack(() => construction.observe(next.nodes, next.edges));
  });
  $effect(() => {
    const api = canvasApi;
    construction.attach(
      api
        ? {
            rect: (id) => api.snapshot().nodes.find((node) => node.id === id) ?? null,
            screen: (point) => api.screenPoint(point.x, point.y),
            follow: (id) => api.follow(id),
          }
        : null,
    );
  });
  let selectedStrand = $state<{ id: string; source: string; target: string; strand: StrandData } | null>(null);
  /** Cards waiting for the hand are not shown yet; the one it is placing grows in. */
  const constructionCss = $derived.by(() => {
    void construction.version;
    const rule = (id: string, body: string) => `.svelte-flow__node[data-id="${CSS.escape(id)}"]${body}`;
    const css: string[] = [];
    for (const item of items) {
      if (construction.pendingNode(item.id)) css.push(rule(item.id, "{opacity:0!important;pointer-events:none!important}"));
      else if (construction.revealingNode(item.id)) css.push(rule(item.id, ">*{animation:aegis-construct-in 380ms cubic-bezier(.2,.8,.2,1) both}"));
    }
    if (selectedStrand) for (const id of [selectedStrand.source, selectedStrand.target]) css.push(rule(id, "{outline:1.5px solid color-mix(in oklab,var(--aegis-strand-green,#3fdc84) 75%,transparent);outline-offset:3px;border-radius:12px}"));
    return css.length ? `<style>${css.join("")}@keyframes aegis-construct-in{from{opacity:0;transform:scale(.96)}}@media (prefers-reduced-motion:reduce){.svelte-flow__node>*{animation:none!important}}</style>` : "";
  });
  $effect(() => {
    const select = (event: Event) => (selectedStrand = (event as CustomEvent).detail);
    window.addEventListener("aegis-strand-select", select);
    return () => window.removeEventListener("aegis-strand-select", select);
  });
  $effect(() => {
    void report?.research_id;
    untrack(() => (selectedStrand = null));
  });
  const replayBuild = () => {
    const next = arrivals();
    construction.replay(next.nodes, next.edges);
  };

  /** A finished report opens on its run and first paper; a live one holds the run and its workers. */
  const homeView = $derived.by(() => {
    const first = paperPlan[0];
    const stage = first?.stage ?? stages.at(-1);
    if (!stage) return undefined;
    if (relationRun) {
      // The whole composition, request to report, as it is laid out.
      const placedCards = items.flatMap((item) => {
        const at = positions[item.id];
        if (!at || ["agent", "mapgroup", "blueprint"].includes(item.type as string)) return [];
        const size = (item as { size?: { width: number } }).size ?? defaultSize(item);
        return [{ x: at.x, y: at.y, right: at.x + size.width }];
      });
      if (placedCards.length) {
        const x = Math.min(...placedCards.map((row) => row.x));
        return { x, y: Math.min(...placedCards.map((row) => row.y)) - 40, width: Math.max(...placedCards.map((row) => row.right)) - x };
      }
    }
    const box = stage.lane.box as { x: number; y: number; width?: number } | undefined;
    if (!first && !agentPlan.length) return box;
    const x = Math.min(stage.place.x, box?.x ?? stage.place.x);
    const top = Math.min(stage.place.y, first?.y ?? Infinity, ...agentPlan.map((row) => row.y));
    const right = first ? first.x + PAPER.width : agentRight;
    return { x, y: top, width: right - x };
  });
  /** When a run finishes while open, the camera steps back once to show what it made. */
  let camera = $state(0);
  let lastState = "";
  $effect(() => {
    const now = scene?.state ?? "";
    const id = scene?.name;
    if (!designer && id && now === "completed" && (lastState === "running" || lastState === "waiting")) {
      try {
        sessionStorage.removeItem(viewKey(id));
      } catch {
        // Without session storage there was no saved camera to clear.
      }
      camera++;
    }
    lastState = now;
  });

  // The last camera per report, for this browser tab.
  function viewKey(id: string) {
    return `aegis-canvas-view:${id}`;
  }
  const savedViewport = (id: string) => {
    try {
      return JSON.parse(sessionStorage.getItem(viewKey(id)) ?? "null")?.viewport ?? undefined;
    } catch {
      return undefined;
    }
  };
  let resizingBefore: ReturnType<CanvasDesignerApi["snapshot"]> | null = null;
  const saveView = (view: CanvasView) => {
    if(resizingBefore && designer) {
      const ids=resizingBefore.nodes.filter(n=>view.sizes[n.id]&&(view.sizes[n.id].width!==n.width||view.sizes[n.id].height!==n.height)).map(n=>n.id);
      resizingBefore=null;
      if(ids.length){const owner=designer;queueMicrotask(()=>void owner.moved(ids));}
    }
    untrack(() => designerVersion++);
    const id = report?.research_id;
    if (!id) return;
    try {
      sessionStorage.setItem(viewKey(id), JSON.stringify({ viewport: view.viewport }));
    } catch {
      // A full session store only loses the saved camera.
    }
  };
  const board: BoardActions = {
    measure: (id,width,isOpen,height) => {
      // Expansion belongs to this window; committed positions remain untouched.
      measurer(measured)(id,width,false,height);
      if(id.startsWith('sources:')) {
        if(isOpen)expandedSources.set(id,{width,height});
        else expandedSources.delete(id);
      }
    },
    toggle: (id) => (open = open === id ? null : id),
    ask: (name) => actions?.prompt(name),
    choose: () => {},
    evidence: (reference) => {
      const url = (reference as { url?: string }).url;
      if (url) openSourceWindow(url);
      else actions?.openView("sources");
    },
    entity: () => actions?.openView("reader"),
    command: () => {},
    page: (url) => openSourceWindow(url),
    note: () => undefined,
  };

  let opened = $state<Opened | null>(null);
  /** The nodes the next message is about, and what that message does with them. */
  let asking = $state<string[]>([]);
  let pendingRemoval = $state<string[]>([]);

  type LooseItem = { id: string; type?: string; title?: string; detail?: string; page?: { url?: string }; branch?: AgentBranch; node?: MapNode; part?: { pages?: readonly { id: string; url: string }[] } };
  const itemOf = (id: string) => items.find((entry) => entry.id === id) as LooseItem | undefined;
  const urlOf = (item: LooseItem | undefined) => item?.page?.url ?? item?.part?.pages?.[0]?.url ?? "";

  /** What may travel with a question or a new task: descriptive fields only. */
  function describe(id: string) {
    const item = itemOf(id);
    const url = urlOf(item);
    const info = url ? scene?.sourceInfo.get(url) : undefined;
    return {
      id,
      kind: item?.type ?? "node",
      title: item?.title || info?.title || id,
      ...(url ? { url } : {}),
      summary: item?.branch?.summary || item?.node?.summary || info?.excerpt || item?.detail || "",
    };
  }

  function openItem(id: string) {
    const item = itemOf(id);
    if (!item) return;
    if (item.type === "agentcard" && item.branch) opened = { kind: "agent", id, agent: item.branch };
    else if (item.type === "blueprint" && item.node) opened = { kind: "map", id, node: item.node };
    else if (item.type === "objective" || item.type === "request") opened = { kind: "request", id, title: report?.query ?? item.title ?? "" };
    else if (urlOf(item)) openSourceWindow(urlOf(item));
    else if (item.type === "trail") return;
    else actions?.openView("reader");
  }

  /** The run behind the Open panel: what it did, what it made, every step. */
  const runFacts = $derived(scene ? ([...scene.objectives.values()][0]?.executions ?? []) : []);
  const madeRows = $derived([
    ...(scene?.papers ?? []).map((paper) => ({ id: `paper:${paper.id}`, title: paper.title, kind: "document" as const })),
    ...(knowledge ? [{ id: "map", title: knowledge.title || "Knowledge map", kind: "diagram" as const }] : []),
  ]);

  function saveChoices(next: { chosen: string[]; hidden: string[] }) {
    actions?.saveCanvasView(next);
  }

  function toggleChoice(ids: string[]) {
    const all = ids.every((id) => chosen.has(id));
    const next = all ? view.chosen.filter((id) => !ids.includes(id)) : [...new Set([...view.chosen, ...ids])];
    saveChoices({ chosen: next, hidden: view.hidden });
  }

  function startAsk(ids: string[]) {
    asking = ids;
    barDock?.querySelector("textarea")?.focus();
  }

  function confirmRemove() {
    const ids = pendingRemoval;
    pendingRemoval = [];
    saveChoices({ chosen: view.chosen.filter((id) => !ids.includes(id)), hidden: [...new Set([...view.hidden, ...ids])] });
    asking = asking.filter((id) => !ids.includes(id));
  }

  /** What removing these cards leaves behind, in plain words. */
  const removalNote = $derived.by(() => {
    if (!pendingRemoval.length) return "";
    const links = [...requests.links, ...paperLinks, ...agentLinks, ...mapLinks];
    const connected = links.filter((link) => pendingRemoval.includes(link.source) !== pendingRemoval.includes(link.target)).length;
    return connected ? `${connected} ${connected === 1 ? "line" : "lines"} to other cards will go with ${pendingRemoval.length === 1 ? "it" : "them"}.` : "";
  });

  function nodeOrder(id: string, action: string | undefined) {
    if (action === "pin" || action === "lock-size" || action === "release-position") { void designer?.constraint([id], action === "pin" ? "pinned" : action === "lock-size" ? "lockedSize" : "manual"); return true; }
    if (action === "ask") startAsk([id]);
    else if (action === "choose" || action === "unchoose") toggleChoice([id]);
    else if (action === "remove") pendingRemoval = [id];
    else return false;
    return true;
  }

  /** The focused card's orders, for the keyboard: O, A, C and Delete, as the toolbar offers them. */
  function focusedCard(event: KeyboardEvent) {
    const node = (event.target as HTMLElement | null)?.closest?.<HTMLElement>(".svelte-flow__node");
    const id = node?.dataset.id;
    if (!id || !(itemOf(id) as { orders?: boolean } | undefined)?.orders) return false;
    const key = event.key.toLowerCase();
    if (key === "o") openItem(id);
    else if (key === "a") startAsk([id]);
    else if (key === "c") toggleChoice([id]);
    else if (key === "delete") pendingRemoval = [id];
    else return false;
    event.preventDefault();
    return true;
  }

  /** A lane's website card: the row names a page by id, and the page knows its address. */
  function openPage(id: string, page: string) {
    const item = items.find((entry) => entry.id === id) as { part?: { pages?: readonly { id: string; url: string }[] } } | undefined;
    const url = item?.part?.pages?.find((entry) => entry.id === page)?.url;
    if (url) openSourceWindow(url);
    else actions?.openView("sources");
  }

  /** Web sources open in the workspace browser; anything else, such as an attached file, in its own view. */
  function openSourceWindow(url: string, title = "") {
    if (/^https?:\/\//i.test(url)) browser.open(url, title || (scene?.sourceInfo.get(url)?.title ?? ""));
    else actions?.openSource(url);
  }

  /** Whether the next task carries the chosen cards, or the message is a question about them. */
  let useChosenIn = $state<"ask" | "task">("ask");

  function send() {
    const text = value.trim();
    if (!text) return;
    const about = asking.length ? asking : view.chosen;
    if (state.run?.state === "needs_input") actions?.answerRun(text);
    else if (about.length && useChosenIn === "task") actions?.startWork(text, { chosen: about.map(describe), fromResearch: report?.research_id ?? "" });
    else if (about.length && report) actions?.askNodes(text, about.map(describe), state.run?.run_id ?? report.research_id);
    else if (!report) actions?.startWork(text, { workflow: skill ?? "" });
    else actions?.prompt(text);
    value = "";
    asking = [];
    useChosenIn = "ask";
  }

  // The notch: Zephium's own calculation, cutting the canvas to the composer's shape.
  $effect(() => {
    const card = cardHost;
    const sheet = composerSurface;
    if (!card || !sheet) return;
    const cut = () => {
      const area = card.getBoundingClientRect();
      const bar = sheet.getBoundingClientRect();
      if (!bar.width || !area.width) return;
      const style = getComputedStyle(sheet);
      const radius = parseFloat(style.borderTopLeftRadius) || 0;
      const flare = parseFloat(style.getPropertyValue("--flare")) || 0;
      const reach = { width: area.width, height: Math.min(area.height, bar.bottom - area.top) };
      const place = { left: bar.left - area.left, top: bar.top - area.top, width: bar.width };
      const edge = sheet.querySelector<SVGSVGElement>(".edge");
      if (edge) {
        edge.setAttribute("viewBox", `${place.left} ${place.top} ${bar.width} ${bar.height}`);
        const d = composerEdge(reach, place, radius, flare);
        for (const path of edge.querySelectorAll("path")) path.setAttribute("d", d);
      }
      card.style.clipPath = composerHole(reach, place, radius, flare);
    };
    const observer = new ResizeObserver(cut);
    observer.observe(card);
    observer.observe(sheet);
    observer.observe(sheet.parentElement ?? sheet);
    window.addEventListener("resize", cut);
    cut();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", cut);
      card.style.clipPath = "";
    };
  });

  // H and V switch the pointer tool, as the bar's hint says.
  function keydown(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.body.classList.contains("research-canvas-panel-open")) return;
    if (focusedCard(event)) return;
    if (event.key === "h" || event.key === "H") setPointerTool("hand");
    if (event.key === "v" || event.key === "V") setPointerTool("select");
  }

  const activeJobs = $derived(state.jobs.filter((job) => ACTIVE_JOBS.has(job.state)));
  const live = $derived(scene?.state === "running" || scene?.state === "waiting");
  const question = $derived.by(() => {
    if (state.run?.state !== "needs_input") return "";
    const event = [...state.trace].reverse().find((row) => row.kind === "stage" && row.stage === "question");
    return typeof event?.question === "string" ? event.question : "";
  });
  const ended = $derived(scene?.state === "failed" || scene?.state === "cancelled");
  let retrying = $state(false);
  const chatLabel = $derived(
    state.voiceState === "thinking" ? "Thinking" : state.voiceState === "speaking" ? "Speaking" : state.voiceState === "listening" && !state.muted ? "Listening" : "",
  );
  const disabled = $derived(!state.connected || state.guest);
  const placeholder = $derived(
    state.guest
      ? "Research needs the main user"
      : !state.connected
        ? "Connecting to AEGIS…"
        : state.run?.state === "needs_input"
          ? "Answer AEGIS…"
          : asking.length
            ? "Ask AEGIS about this…"
            : view.chosen.length && useChosenIn === "task"
              ? "Describe the new task…"
              : view.chosen.length
                ? "Ask AEGIS about what you chose…"
                : "What do you want to do?",
  );
  const title = $derived(report ? reportTitle(report) : "New research");
  const VIEWS = ["reader", "edit", "sources", "media"] as const;

  // Source windows stand over the canvas, below its title row and above the composer.
  let windowBounds = $state.raw<DOMRect>(new DOMRect(72, 56, 1200, 700));
  $effect(() => {
    const card = cardHost;
    const dock = composerSurface;
    if (!card || !dock) return;
    const fit = () => {
      const area = card.getBoundingClientRect();
      const bar = dock.getBoundingClientRect();
      if (!area.width) return;
      const top = area.top + 48;
      windowBounds = new DOMRect(area.left + 8, top, Math.max(240, area.width - 16), Math.max(200, bar.top - 8 - top));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(card);
    observer.observe(dock);
    window.addEventListener("resize", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  });
  $effect(() => {
    browser.researchId = report?.research_id ?? "";
  });
  const windows = $derived(browser.all.filter((entry) => entry.researchId === (report?.research_id ?? "")));
  const minimized = $derived(windows.filter((entry) => entry.minimized));
  const addedUrls = $derived(new Set((state.workSources ?? []).map((row) => row.url)));
  /** Puts the windows in the portal root, so they also stand over an open report. */
  function inPortal(node: HTMLElement) {
    portal.append(node);
    return { destroy: () => node.remove() };
  }
  const nameOf = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };
  void untrack(() => portal);
</script>

<svelte:window
  onkeydown={keydown}
  onaegis-open-source-window={(event: Event) => {
    const detail = (event as CustomEvent<{ url: string; title?: string }>).detail;
    openSourceWindow(detail.url, detail.title);
  }}
/>

{#if opened}
  <div class="lift-layer" use:inPortal>
    <NodePanel
      {opened}
      bounds={windowBounds}
      trail={scene?.steps ?? []}
      runs={runFacts}
      made={madeRows}
      run={state.run}
      onsource={(url) => {
        opened = null;
        openSourceWindow(url);
      }}
      onmade={(id) => {
        opened = null;
        if (id.startsWith("paper:")) actions?.openView("reader");
      }}
      onclose={() => (opened = null)}
    />
  </div>
{/if}

{#if pendingRemoval.length}
  <div class="confirm-layer" use:inPortal>
    <div class="confirm" role="alertdialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-words">
      <h2 id="remove-title">Remove {pendingRemoval.length === 1 ? "this card" : `${pendingRemoval.length} cards`} from the canvas?</h2>
      <p id="remove-words">
        The research, its sources and its citations stay saved. {removalNote} You can bring removed cards back from Report views. To delete research for good, use the Research library.
      </p>
      <div class="confirm-actions">
        <!-- svelte-ignore a11y_autofocus -->
        <button type="button" autofocus onclick={() => (pendingRemoval = [])}>Keep</button>
        <button type="button" class="danger" onclick={confirmRemove}>Remove from canvas</button>
      </div>
    </div>
  </div>
{/if}

<div class="browser-layer" style="pointer-events: none" use:inPortal>
  {#each windows as entry (entry.id)}
    <BrowserWindow
      {entry}
      bounds={windowBounds}
      info={scene?.sourceInfo.get(entry.history[entry.index] ?? "")}
      added={addedUrls.has(entry.history[entry.index] ?? "") || (scene?.sourceInfo.get(entry.history[entry.index] ?? "")?.evidence ?? false)}
    />
  {/each}
</div>

<BitsConfig defaultPortalTo={portal}>
  <div class="shell" data-state={scene?.state ?? "empty"} data-panel={state.panel}>
    <Rail />
    <div class="environment">
      <div class="canvas-card" class:strings={relationRun} bind:this={cardHost}>
        {#if scene && state.run !== undefined}
          {#key `${scene.name}:${camera}`}
            <WorkCanvas
              {items}
              expose={(api) => { canvasApi = api.designer; }}
              onmanual={(kind) => { designer?.manual(kind); if(kind==="resize")resizingBefore=canvasApi?.snapshot()??null; }}
              onmoved={(ids) => void designer?.moved(ids)}
              onselectionchange={() => untrack(() => designerVersion++)}
              links={canvasLinks}
              pictures={new Map()}
              authoritative={new Set()}
              initialView={{
                positions,
                sizes: {...own?.sizes,...keptSizes},
                ...(savedViewport(scene.name) ? { viewport: savedViewport(scene.name) } : {}),
              }}
              home={homeView}
              fitBottomInset={dockHeight + 12}
              fitTopInset={56}
              {board}
              work={(objective: string) => scene?.objectives.get(objective)}
              oninspect={() => {}}
              onopen={openItem}
              onopenlink={(href: string) => openSourceWindow(href)}
              onevidence={(_id: string, reference: { url?: string }) =>
                reference.url ? openSourceWindow(reference.url) : actions?.openView("sources")}
              onaction={(id: string, action?: string) => {
                if (nodeOrder(id, action)) return;
                if (action?.startsWith("page:")) openPage(id, action.slice(5));
                else if (action !== "expand-request") openItem(id);
              }}
              onselectionaction={(action: string, ids: string[]) => {
                const orderable = ids.filter((id) => (itemOf(id) as { orders?: boolean } | undefined)?.orders);
                if (action === "ask") startAsk(orderable);
                else if (action === "choose") toggleChoice(orderable);
                else if (action === "remove") pendingRemoval = orderable;
              }}
              onviewchange={saveView}
            />
          {/key}
          {#if designer}<DesignerOverlay {designer} version={designerVersion}/>{/if}
          {#if relationRun}<HandOverlay onreplay={replayBuild} />{/if}
          {#if selectedStrand}
            <StrandPanel
              strand={selectedStrand.strand}
              from={itemOf(selectedStrand.source)?.title ?? selectedStrand.source}
              to={itemOf(selectedStrand.target)?.title ?? selectedStrand.target}
              onclose={() => (selectedStrand = null)}
              onsource={(url) => openSourceWindow(url)}
            />
          {/if}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- generated from escaped card IDs only -->
          {@html constructionCss}
        {:else}
          <div class="start-ground" aria-hidden="true"></div>
          {#if scene}
            <div class="welcome"><p role="status">Opening research…</p></div>
          {:else if state.loading}
            <div class="welcome"><p role="status">Opening research…</p></div>
          {:else}
            <WorkStart bind:value field={barDock} works={SUGGESTED} profile="aegis" {disabled} inset={dockHeight + 8} onskill={(next: string | null) => (skill = next)} />
          {/if}
        {/if}
        {#if minimized.length}
          <div class="minimized" style:--dock="{dockHeight}px" aria-label="Minimized source windows">
            {#each minimized as entry (entry.id)}
              <button type="button" onclick={() => browser.minimize(entry.id, false)}>{nameOf(entry.history[entry.index] ?? "")}</button>
            {/each}
          </div>
        {/if}
        <div class="edge-scrim top" aria-hidden="true"></div>
        <div class="edge-scrim bottom" style:--dock="{dockHeight}px" aria-hidden="true"></div>
        <div class="canvas-top">
          <button
            type="button"
            class="title"
            aria-label="{title}. Open research library"
            aria-expanded={state.panel === "history"}
            onclick={() => actions?.openPanel("history")}
          >
            <span>{title}</span>
            <Icon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
          </button>
          <span class="canvas-top-gap"></span>
          <div class="island" class:gone={!live && !ended && !chatLabel && !state.status}>
            {#if live}
              <AgentLine session={asWorkSession()} agents={agents.items} />
            {:else if ended && retrying}
              <div class="chat-pill" role="status">Retrying…</div>
            {:else if ended}
              <div class="chat-pill ended" role="status">
                <span>{endedWords(report?.waiting_reason ?? "", scene?.state ?? "")}</span>
                <button
                  type="button"
                  onclick={() => {
                    retrying = true;
                    setTimeout(() => (retrying = false), 35000);
                    actions?.retry();
                  }}>Retry</button
                >
              </div>
            {:else if chatLabel || state.status}
              <div class="chat-pill" role="status">{state.status || chatLabel}</div>
            {/if}
          </div>
          <div class="zoom-slot" data-work-zoom-slot></div>
        </div>
      </div>
      {#if question}
        <div class="question" style:--dock="{dockHeight}px" role="status"><strong>AEGIS asks</strong>{question}</div>
      {/if}
      {#if asking.length || view.chosen.length}
        <div class="context-row" style:--dock="{dockHeight}px" role="group" aria-label="Cards this message is about">
          {#if asking.length}
            <span class="context-chip">Asking about {asking.length === 1 ? describe(asking[0]!).title : `${asking.length} cards`}</span>
            <button type="button" aria-label="Stop asking about these cards" onclick={() => (asking = [])}>Clear</button>
          {:else}
            <span class="context-chip">{view.chosen.length} chosen</span>
            <button type="button" aria-pressed={useChosenIn === "ask"} onclick={() => (useChosenIn = "ask")}>Ask about them</button>
            <button type="button" aria-pressed={useChosenIn === "task"} onclick={() => (useChosenIn = "task")}>Use in a new task</button>
            <button type="button" onclick={() => saveChoices({ chosen: [], hidden: view.hidden })}>Clear</button>
          {/if}
        </div>
      {/if}
      <div class="bar-dock" bind:this={barDock} bind:clientHeight={dockHeight}>
        <WorkBar
          bind:surface={composerSurface}
          bind:value
          {placeholder}
          {disabled}
          busy={state.busy}
          tools={barTools}
          onsubmit={send}
          ondictate={() => actions?.microphone()}
          listening={!state.muted}
        />
      </div>
    </div>
  </div>
</BitsConfig>

{#snippet barTools()}
  {@const hand = pointerTool() === "hand"}
  <BarTool
    icon={hand ? HandIcon : Cursor01Icon}
    label={hand ? "Hand" : "Select"}
    keys={[hand ? "H" : "V"]}
    also={{ label: hand ? "Select" : "Hand", keys: [hand ? "V" : "H"] }}
    onclick={() => setPointerTool(hand ? "select" : "hand")}
  />
  <span class="tool-rule" aria-hidden="true"></span>
  <BarTool
    icon={ShapeCollectionIcon}
    label="Report views"
    disabled={!report}
    open={tool === "views"}
    onopenchange={(next: boolean) => (tool = next ? "views" : null)}
    content={viewsPanel}
  />
  <BarTool
    icon={CheckListIcon}
    label="Research tasks"
    open={tool === "tasks"}
    onopenchange={(next: boolean) => (tool = next ? "tasks" : null)}
    content={tasksPanel}
  />
  <BarTool
    icon={PlusSignIcon}
    label="New or attach"
    open={tool === "new"}
    onopenchange={(next: boolean) => (tool = next ? "new" : null)}
    content={newPanel}
  />
{/snippet}

{#snippet viewsPanel()}
  <div class="tool-panel">
    {#each VIEWS as view (view)}
      <button
        type="button"
        onclick={() => {
          tool = null;
          actions?.openView(view);
        }}>{view[0]!.toUpperCase() + view.slice(1)}</button
      >
    {/each}
    {#if hidden.size}
      <button
        type="button"
        onclick={() => {
          tool = null;
          saveChoices({ chosen: state.view?.chosen ?? [], hidden: [] });
        }}>Show {hidden.size} removed {hidden.size === 1 ? "card" : "cards"}</button
      >
    {/if}
  </div>
{/snippet}

{#snippet tasksPanel()}
  <div class="tool-panel">
    <span class="tool-label">Research tasks</span>
    {#if !state.jobs.length}<span class="tool-empty">No research tasks yet.</span>{/if}
    {#each state.jobs.slice(0, 8) as job (job.id)}
      <div class="task">
        <span class="task-words"><span>{job.title || "Research"}</span><small>{job.state.replace(/_/g, " ")}{job.total ? ` · ${job.completed ?? 0} of ${job.total}` : ""}</small></span>
        {#if ACTIVE_JOBS.has(job.state)}
          <button type="button" onclick={() => actions?.stopJob(job.id)}>Stop</button>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet newPanel()}
  <div class="tool-panel composer-menu">
    <button type="button" onclick={() => { tool = null; actions?.newEntry("research"); }}>New research</button>
    <button type="button" onclick={() => { tool = null; actions?.newEntry("chat"); }}>New chat</button>
    <button type="button" onclick={() => { tool = null; actions?.newEntry("documentary"); }}>New document</button>
    <button type="button" onclick={() => { tool = null; actions?.attach(); }}>Attach files</button>
    <span class="tool-label">Research depth</span>
    <button type="button" aria-pressed={state.depth === "quick"} onclick={() => actions?.setDepth("quick")}>Quick</button>
    <button type="button" aria-pressed={state.depth === "detailed"} onclick={() => actions?.setDepth("detailed")}>Detailed</button>
  </div>
{/snippet}

{#if activeJobs.length}
  <button
    type="button"
    class="tasks-chip"
    class:beside={state.panel === "conversation"}
    aria-label="{activeJobs.length} research tasks running"
    onclick={() => (tool = "tasks")}
  >
    <strong>{activeJobs.length}</strong><span>{activeJobs.length === 1 ? "Task" : "Tasks"}</span>
  </button>
{/if}

<style>
  .lift-layer :global(*) {
    pointer-events: auto;
  }

  .confirm-layer {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 38%);
    pointer-events: auto;
  }

  .confirm {
    inline-size: min(440px, calc(100vw - 32px));
    padding: 20px;
    border-radius: 14px;
    background: var(--color-float);
    box-shadow: var(--shadow-popover);
    color: var(--color-text);
    font-family: var(--font-sans);
  }

  .confirm h2 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
  }

  .confirm p {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-body);
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-block-start: 16px;
  }

  .confirm-actions button,
  .context-row button {
    padding: 6px 12px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-text);
    font-size: var(--text-label);
    cursor: pointer;
  }

  .confirm-actions button:focus-visible,
  .context-row button:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 1px;
  }

  .confirm-actions .danger {
    background: var(--color-danger);
    color: #fff;
  }

  .question,
  .context-row {
    position: absolute;
    inset-block-end: calc(var(--dock, 64px) + 14px);
    inset-inline-start: 50%;
    z-index: 31;
    max-inline-size: min(620px, calc(100% - 32px));
    translate: -50% 0;
    color: var(--color-text);
    font-size: var(--text-label);
  }

  .question {
    display: flex;
    flex-direction: column;
    gap: 4px;
    inline-size: max-content;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--color-float);
    box-shadow: var(--shadow-popover);
    font-size: var(--text-body);
    line-height: 1.45;
  }

  .question strong {
    color: var(--color-muted);
    font-size: var(--text-label);
    font-weight: 600;
  }

  .context-row {
    display: flex;
    align-items: center;
    gap: 6px;
    inline-size: max-content;
    padding: 5px 6px 5px 12px;
    border-radius: 999px;
    background: var(--color-float);
    box-shadow: var(--shadow-popover);
  }

  .context-row button[aria-pressed="true"] {
    background: var(--color-text);
    color: var(--color-canvas);
  }

  .context-chip {
    overflow: hidden;
    max-inline-size: 280px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The outer shell: the rail and the composer's notch stand on this one ground. */
  .shell {
    position: absolute;
    inset: 0;
    display: flex;
    background: var(--aegis-shell);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    pointer-events: auto;
  }

  .environment {
    position: relative;
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    transition: margin var(--motion-base) var(--ease-out);
  }

  /* The Library and Conversation stand beside the canvas, which keeps the rest of the room. */
  @media (min-width: 900px) {
    .shell[data-panel="history"] .environment {
      margin-inline-start: 328px;
    }

    .shell[data-panel="conversation"] .environment {
      margin-inline-end: 388px;
    }

    .tasks-chip.beside {
      inset-inline-end: 410px;
    }
  }

  :global(.browser-layer .pane) {
    pointer-events: auto;
  }

  .minimized {
    position: absolute;
    inset-block-end: calc(var(--dock, 64px) + 12px);
    inset-inline-start: 12px;
    z-index: 6;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-inline-size: calc(100% - 24px);
  }

  .minimized button {
    padding: 5px 12px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-float);
    color: var(--color-text);
    font-size: var(--text-label);
    cursor: pointer;
  }

  .minimized button:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 1px;
  }

  .start-ground {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(color-mix(in srgb, var(--color-text) 16%, transparent) 1px, transparent 1.2px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  /* The grid's column stays the card's width, so the tabs scroll instead of widening the panel. */
  .canvas-card :global(.start) {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }

  .canvas-card :global(.start .flows) {
    grid-template-columns: repeat(auto-fit, minmax(170px, 212px));
  }

  /* 8px off the window's top and right, its foot sitting on the bar's fillets. */
  .canvas-card {
    position: absolute;
    inset: 8px 8px 8px 0;
    overflow: hidden;
    border-radius: 14px;
    background: var(--color-canvas);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  .canvas-card :global(.work-canvas) {
    isolation: isolate;
  }

  /*
   * A relation-aware run: a source's name stands directly above its card, on the card's left
   * edge, in the band the layout reserves for it; the card's windows start at the node's edge,
   * so strings meet the card itself. Older runs keep their side column.
   */
  .canvas-card.strings :global(.part:not(.label-only) .label) {
    inset-block-start: auto;
    inset-block-end: calc(100% + 7px);
    /* The whole strip is the card's grab handle: the windows themselves never drag. */
    inline-size: calc(100% - 76px);
    min-block-size: 22px;
    justify-content: center;
    cursor: grab;
  }
  .canvas-card.strings :global(.svelte-flow__node.dragging .part:not(.label-only) .label) {
    cursor: grabbing;
  }
  .canvas-card.strings :global(.part:not(.label-only) .label .name) {
    align-self: flex-start;
    max-inline-size: 100%;
    cursor: pointer;
  }
  .canvas-card.strings :global(.part:not(.label-only) .label .name) {
    align-items: center;
    padding: 0;
    min-inline-size: 0;
  }
  .canvas-card.strings :global(.part:not(.label-only) .label strong) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--text-body);
  }
  .canvas-card.strings :global(.part:not(.label-only) .label .summary) {
    display: none;
  }
  .canvas-card.strings :global(.part .stack),
  .canvas-card.strings :global(.part .slot) {
    inset-inline-start: 0 !important;
  }
  /* A CSS glide would leave strings behind their cards: these runs move cards frame by frame. */
  .canvas-card.strings :global(.svelte-flow__node.board-block),
  .canvas-card.strings :global(.svelte-flow__node.settling) {
    transition: none !important;
  }

  .edge-scrim {
    position: absolute;
    inset-inline: 0;
    z-index: 4;
    block-size: 72px;
    pointer-events: none;
  }

  .edge-scrim.top {
    inset-block-start: 0;
    background: linear-gradient(
      to bottom,
      var(--color-canvas) 0 34px,
      color-mix(in srgb, var(--color-canvas) 62%, transparent) 46px,
      color-mix(in srgb, var(--color-canvas) 20%, transparent) 60px,
      transparent 72px
    );
  }

  .edge-scrim.bottom {
    inset-block-end: 0;
    block-size: calc(var(--dock, 64px) + 40px);
    background: linear-gradient(
      to top,
      var(--color-canvas) 0 calc(var(--dock, 64px) * 0.5),
      color-mix(in srgb, var(--color-canvas) 62%, transparent) calc(var(--dock, 64px) + 8px),
      color-mix(in srgb, var(--color-canvas) 20%, transparent) calc(var(--dock, 64px) + 24px),
      transparent calc(var(--dock, 64px) + 40px)
    );
  }

  .canvas-top {
    position: absolute;
    inset-block-start: 12px;
    inset-inline: 12px 16px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 16px;
    min-inline-size: 0;
    pointer-events: none;
  }

  .canvas-top-gap {
    flex: 1;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    max-inline-size: min(360px, 34vw);
    min-block-size: 32px;
    padding: 4px 8px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--color-text);
    font-size: 15px;
    font-weight: 550;
    pointer-events: auto;
    cursor: pointer;
  }

  .title:hover {
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
  }

  .title:focus-visible {
    outline: 2px solid currentcolor;
  }

  .title span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .island {
    position: absolute;
    inset-block-start: -2px;
    inset-inline-start: 50%;
    inline-size: max-content;
    min-inline-size: 240px;
    max-inline-size: min(520px, calc(100% - 560px));
    translate: -50% 0;
    pointer-events: auto;
    transition:
      opacity var(--motion-base) var(--ease-out),
      visibility var(--motion-base);
  }

  .island.gone {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .chat-pill {
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--color-float);
    box-shadow: var(--shadow-popover);
    color: var(--color-text);
    font-size: var(--text-body);
    text-align: center;
  }

  .chat-pill.ended {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding-block: 6px;
    padding-inline-end: 6px;
  }

  .chat-pill.ended button {
    padding: 5px 12px;
    border: 0;
    border-radius: 999px;
    background: var(--color-text);
    color: var(--color-canvas);
    font-size: var(--text-label);
    cursor: pointer;
  }

  .chat-pill.ended button:focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 2px;
  }

  .zoom-slot {
    display: flex;
    flex: none;
    pointer-events: auto;
  }

  .welcome {
    position: absolute;
    inset: 34% 24px auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
    text-align: center;
  }

  .welcome h1 {
    margin: 0;
    color: var(--color-text);
    font-size: 26px;
    font-weight: 550;
    letter-spacing: -0.01em;
  }

  .welcome p {
    max-inline-size: 460px;
    margin: 0;
    color: var(--color-muted);
    line-height: 1.5;
  }

  .bar-dock {
    position: absolute;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: 30;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .bar-dock :global(.surface) {
    --fill: var(--aegis-shell);
  }

  .bar-dock :global(.mic[data-listening="true"]) {
    background: color-mix(in srgb, var(--color-text) 14%, transparent);
    color: var(--color-text);
  }

  .tool-rule {
    flex: none;
    inline-size: 1px;
    block-size: 18px;
    margin-inline: 4px;
    background: var(--color-border);
  }

  .tool-panel {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-inline-size: 220px;
    max-inline-size: 340px;
    padding: 6px;
    color: var(--color-text);
  }

  :global([data-theme="dark"] .work-popover:has(.composer-menu)) {
    background: color-mix(in srgb, #17181b 96%, var(--color-float));
    border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
    border-radius: var(--radius-menu);
    box-shadow: 0 10px 30px rgb(0 0 0 / 32%);
    padding: 4px;
  }

  .composer-menu {
    min-inline-size: 0;
    max-inline-size: none;
  }

  .tool-panel.composer-menu > button:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: -2px;
  }

  .composer-menu .tool-label {
    margin-block-start: 4px;
    border-block-start: 1px solid var(--color-border);
  }

  .tool-panel > button,
  .task button {
    padding: 8px 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font-size: var(--text-body);
    text-align: start;
    cursor: pointer;
  }

  .tool-panel > button:hover,
  .tool-panel > button:focus-visible,
  .task button:hover,
  .task button:focus-visible {
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    outline: none;
  }

  .tool-panel > button[aria-pressed="true"] {
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
  }

  .tool-label {
    padding: 8px 10px 2px;
    color: var(--color-muted);
    font-size: var(--text-label);
  }

  .tool-empty {
    padding: 8px 10px;
    color: var(--color-muted);
  }

  .task {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 4px 4px 10px;
  }

  .task-words {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  .task-words span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-words small {
    color: var(--color-muted);
    font-size: var(--text-label);
  }

  .tasks-chip {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 22px;
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: var(--color-float);
    color: var(--color-text);
    font-size: var(--text-label);
    pointer-events: auto;
    cursor: pointer;
    translate: 0 -50%;
  }

  .tasks-chip strong {
    font-size: 16px;
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    .island {
      transition: none;
    }
  }

  .bar-dock :global(textarea::placeholder) {
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .shell {
      --aegis-rail-width: 52px;
    }

    .canvas-card :global(.start) {
      place-items: start center;
      padding-inline: 12px;
    }

    .title {
      max-inline-size: 42vw;
      font-size: 14px;
    }

    .island {
      inset-block-start: 40px;
      min-inline-size: 0;
      max-inline-size: calc(100% - 24px);
    }
  }
</style>
