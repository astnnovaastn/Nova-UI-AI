<!--
  One semantic string between two cards: the relations in it came from the run record (relations.ts).
  A thin curve meets each card at a circular port.
  Parallel strands share their ends and part in the middle, so each stays visible. Status sets tone
  and dash, never the relation's type. Clicking a strand opens what it means and what made it.
-->
<script lang="ts" module>
  import type { StrandData } from "./relations";
  export type StrandSelect = { id: string; source: string; target: string; strand: StrandData };

  /**
   * One colour per kind of card, so a string's two ends say what they join: the request and its
   * searches, a source, each agent by role, the image and video collections, the report.
   */
  export const TONES = {
    request: "#ef5a83",
    source: "#3cb4ee",
    discovery: "#4cc985",
    analysis: "#9d82f2",
    verification: "#e6aa3e",
    synthesis: "#cf84ee",
    lead: "#8c84f7",
    images: "#f08a4e",
    videos: "#ee5468",
    report: "#40d29c",
    map: "#5ea2f2",
    card: "#98a2b3",
  } as const;
  export function toneOf(id: string, data: unknown): string {
    const item = (data ?? {}) as { type?: string; branch?: { role?: string; agent?: string }; collection?: { kind?: string } };
    if (item.type === "collection") return item.collection?.kind === "videos" ? TONES.videos : TONES.images;
    if (item.type === "paper") return TONES.report;
    if (item.type === "blueprint" || item.type === "mapgroup") return TONES.map;
    if (item.type === "agentcard") {
      const role = item.branch?.role ?? (item.branch?.agent === "lead" ? "lead" : "");
      return (TONES as Record<string, string>)[role] ?? TONES.lead;
    }
    if (item.type === "part") return id.endsWith(":search") ? TONES.request : TONES.source;
    if (item.type === "request" || item.type === "objective" || item.type === "trail") return TONES.request;
    return TONES.card;
  }
</script>

<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { useEdges, useNodes, type EdgeProps } from "@xyflow/svelte";
  import type { Rect } from "./route";
  import { cachedResearchFan, cachedResearchStrand, dragStrand, indexRoutingNodes, researchRoutingScene, routeResearchFan, routeResearchStrand, type RoutingScene } from "./research-routing";
  import { canvasArrival } from "$features/work/lib/canvas-context";
  import { describeStrand, type StrandData as Data } from "./relations";
  import { construction } from "./construction.svelte";

  let { id, source, target, sourceX, sourceY, data, selected }: EdgeProps = $props();
  const strand = $derived(data?.strand as Data);
  const arrival = getContext<((id: string) => unknown) | undefined>(canvasArrival);
  const nodes = useNodes();
  const edges = useEdges();
  const sharedScene=getContext<(()=>RoutingScene)|undefined>(researchRoutingScene);
  const scene=$derived(sharedScene?.()??indexRoutingNodes(nodes.current));
  const fromRect=$derived(scene.bounds.get(source));
  const toRect=$derived(scene.bounds.get(target));
  const lane = $derived(strand.index - (strand.of - 1) / 2);
  function portOffset(card: string, rect: Rect | undefined) {
    if (!rect) return lane * 7;
    const siblings = edges.current.filter(edge => {
      const other = edge.data?.strand as Data | undefined;
      return (edge.source === card || edge.target === card) &&
        other && !other.summaryOnly && !other.detailOnly && !other.control;
    }).map(edge => edge.id).sort();
    const index = siblings.indexOf(id);
    if (index < 0 || siblings.length < 2) return lane * 7;
    const spacing = Math.min(10, Math.min(rect.width, rect.height) / (2 * (siblings.length - 1)));
    return (index - (siblings.length - 1) / 2) * spacing;
  }
  const sourceOffset = $derived(portOffset(source, fromRect));
  const targetOffset = $derived(portOffset(target, toRect));
  const fan = $derived.by(() => {
    const direction = strand.fan;
    if (!direction || scene.moving.size || dormant) return null;
    const hubId = direction === "out" ? source : target;
    const hub = scene.cards.get(hubId);
    if (!hub) return null;
    const siblings = edges.current.filter(edge => {
      const other = edge.data?.strand as Data | undefined;
      return other?.fan === direction && (direction === "out" ? edge.source : edge.target) === hubId &&
        !construction.pendingEdge(edge.id);
    }).sort((a,b)=>a.id.localeCompare(b.id));
    const members = siblings.flatMap(edge => {
      const card = direction === "out" ? edge.target : edge.source;
      const rect = scene.cards.get(card);
      return rect ? [{ id: edge.id, rect, card }] : [];
    });
    // A link to a vertically stacked card should stay local, without breaking the fan to the right.
    const aligned = members.filter(({rect}) => direction === "out"
      ? rect.x - (hub.x + hub.width) >= 36
      : hub.x - (rect.x + rect.width) >= 36);
    const key = JSON.stringify([direction, hubId, aligned.map(member => member.id)]);
    const route = cachedResearchFan(scene, key, () => {
      const used = new Set([hubId, ...aligned.map(member => member.card)]);
      const blockers = [...scene.cards].filter(([card]) => !used.has(card)).map(([, rect]) => rect);
      return routeResearchFan(hub, aligned, blockers, direction);
    });
    const branch = route?.branches.get(id);
    return branch ? { branch, trunk: route!.branches.keys().next().value === id ? route!.trunk : null } : null;
  });
  const focused = $derived(selected || scene.byId.get(source)?.selected || scene.byId.get(target)?.selected);
  const dormant = $derived((!!strand.control || !!strand.detailOnly) && !focused);
  type Path = NonNullable<ReturnType<typeof routeResearchStrand>>;
  let settled: Path|null = null;
  let trunk: string|null = null;
  const geometry = $derived.by<Path|null>(() => {
    if (!fromRect || !toRect || strand.summaryOnly || dormant) return null;
    if (scene.moving.size) {
      if (!scene.moving.has(source) && !scene.moving.has(target)) return settled;
      // During the gesture keep attached lines responsive. Re-route around obstacles once on release.
      return dragStrand(fromRect,toRect,settled?.from??"right",settled?.to??"left",sourceOffset,targetOffset);
    }
    const shared = fan;
    trunk = shared?.trunk??null;
    if (shared) return settled=shared.branch;
    return settled=cachedResearchStrand(scene,JSON.stringify([source,target,sourceOffset,targetOffset]),()=>{
      const holders=new Set<string>();
      for(const end of [source,target])for(let parent=scene.byId.get(end)?.parentId;parent;parent=scene.byId.get(parent)?.parentId)holders.add(parent);
      const obstacles=[...scene.cards].filter(([key])=>key!==source&&key!==target&&!holders.has(key)).map(([,bounds])=>bounds);
      return routeResearchStrand(fromRect,toRect,obstacles,sourceOffset,targetOffset);
    });
  });
  const visibleFan = $derived(!scene.moving.size ? fan : null);
  const visibleTrunk=$derived(scene.moving.size
    ? (scene.moving.has(source)||scene.moving.has(target)?null:trunk)
    : visibleFan?.trunk);
  const backwards = $derived(!!geometry && geometry.t.x < geometry.s.x && geometry.from !== "bottom");
  const lit = $derived(strand.status === "active");
  const markerHint = $derived(strand.summaryOnly ? " Summarizes the connected steps; inspect connection." : " No clear route; inspect connection.");
  const name = $derived(describeStrand(strand, source, target));
  // Strings carry no words of their own; a selected one names itself.
  const label = $derived(selected ? strand.label : "");
  const labelWidth = $derived(Math.max(34, label.length * 6.1 + 18));
  /** Hidden until the construction hand draws it; then drawn in along its length. */
  const pending = $derived(construction.pendingEdge(id));
  let line = $state<SVGPathElement>();
  let drawn = false;

  function draw() {
    if (!line || drawn) return;
    drawn = true;
    if (lit || construction.instant || !construction.animating(id)) return;
    line.animate([{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
      duration: construction.drawMsFor(line.getTotalLength?.() ?? 0),
      easing: "cubic-bezier(.45,.05,.25,1)",
    });
  }
  $effect(() => {
    if (!pending) draw();
  });
  onMount(() => {
    void arrival;
  });

  function select(event: Event) {
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent<StrandSelect>("aegis-strand-select", { detail: { id, source, target, strand } }));
  }
</script>

{#if !pending && geometry}
  <g class="strand" data-source={source} data-target={target} data-status={strand.status} data-relations={strand.relations.map((row) => row.id).join(" ")} data-strand-index={strand.index} data-strand-of={strand.of} class:lit class:selected class:back={backwards} class:dormant data-control={strand.control ? "" : undefined} aria-hidden="true">
    {#if visibleTrunk}<path class="strand-line strand-trunk" d={visibleTrunk} fill="none" />{/if}
    <path bind:this={line} class="strand-line" d={geometry.d} pathLength="1" stroke-dasharray={construction.animating(id) ? "1" : undefined} fill="none" />
    {#if !visibleFan || strand.fan !== "out" || visibleTrunk}<circle class="strand-port" cx={geometry.s.x} cy={geometry.s.y} r="3" />{/if}
    {#if !visibleFan || strand.fan !== "in" || visibleTrunk}<circle class="strand-port" cx={geometry.t.x} cy={geometry.t.y} r="3" />{/if}
    {#if label}
      <g class="label" transform="translate({geometry.mid.x - labelWidth / 2}, {geometry.mid.y - 10})">
        <rect width={labelWidth} height="20" rx="10" />
        <text x={labelWidth / 2} y="13.5" text-anchor="middle">{label}</text>
      </g>
    {/if}
  </g>
  <!-- A wide, invisible path takes the pointer and the keyboard. -->
  <path
    class="strand-hit"
    class:dormant
    d={geometry.d}
    fill="none"
    role="button"
    tabindex="0"
    aria-label={name}
    onclick={select}
    onkeydown={(event) => (event.key === "Enter" || event.key === " ") && select(event)}
  ><title>{name}</title></path>
{:else if !pending && fromRect && toRect && !dormant && !scene.moving.size}
  <circle class="strand-unrouted" cx={sourceX} cy={sourceY + lane * 10} r="5"
    role="button" tabindex="0" aria-label={name + markerHint}
    onclick={select} onkeydown={(event) => (event.key === "Enter" || event.key === " ") && select(event)}>
    <title>{name}{markerHint}</title>
  </circle>
{/if}

<style>
  .strand-unrouted {
    fill: var(--color-canvas);
    stroke: var(--color-text);
    stroke-dasharray: 2 2;
    cursor: pointer;
  }
  .strand-unrouted:focus-visible { stroke: var(--aegis-strand-green, #3fdc84); }

  .strand {
    --strand: color-mix(in oklab, #9299a4 85%, var(--color-text));
    pointer-events: none;
  }

  .strand.lit {
    --strand: color-mix(in oklab, #a7cdb9 80%, var(--color-text));
  }

  .strand[data-status="contested"] {
    --strand: color-mix(in oklab, var(--aegis-status-waiting, #e2a336) 52%, #9299a4);
  }

  .strand[data-status="failed"] {
    --strand: color-mix(in oklab, var(--aegis-status-failed, #f0605a) 52%, #9299a4);
  }

  .strand.dormant { opacity: 0; }
  .strand-hit.dormant { pointer-events: none; }
  .strand.back:not(.selected) { opacity: 0.75; }

  .strand-line {
    stroke: var(--strand);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    opacity: 0.85;
    transition: stroke 200ms ease, opacity 200ms ease;
  }

  .strand.lit .strand-line {
    stroke-width: 1.8;
    opacity: 1;
  }

  .strand.lit .strand-line:not(.strand-trunk) {
    animation: reveal-strand 650ms ease-out;
  }

  @keyframes reveal-strand {
    from { stroke-dasharray: 1 1; stroke-dashoffset: 1; }
    to { stroke-dasharray: 1 1; stroke-dashoffset: 0; }
  }

  .strand[data-status="contested"] .strand-line { stroke-dasharray: 6 4; }
  .strand[data-status="failed"] .strand-line { stroke-dasharray: 1.5 4; }

  .strand.selected {
    --strand: color-mix(in oklab, #d5e2eb 72%, var(--color-text));
  }

  .strand.selected .strand-line {
    stroke-width: 2;
    opacity: 1;
  }

  .strand-port {
    fill: var(--strand);
    stroke: var(--color-canvas, #0b0b0b);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .label rect {
    fill: color-mix(in oklab, var(--color-canvas, #0b0b0b) 88%, var(--color-text));
    stroke: color-mix(in oklab, var(--color-text) 18%, transparent);
    stroke-width: 1;
  }

  .label text {
    fill: color-mix(in oklab, var(--color-text) 82%, transparent);
    font: 500 10.5px var(--font-sans, Inter, sans-serif);
    letter-spacing: 0.01em;
  }

  .strand-hit {
    stroke: transparent;
    stroke-width: 14;
    pointer-events: stroke;
    cursor: pointer;
    outline: none;
  }

  .strand-hit:focus-visible {
    stroke: color-mix(in oklab, var(--color-text) 14%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .strand.lit .strand-line:not(.strand-trunk) { animation: none; }
    .strand-line { transition: none; }
  }
</style>
