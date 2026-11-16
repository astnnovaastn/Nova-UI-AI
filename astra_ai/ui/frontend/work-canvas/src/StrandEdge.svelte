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
  import { useNodes, type EdgeProps } from "@xyflow/svelte";
  import { indexRoutingNodes } from "./research-routing";
  import { routingContext, type RoutingSnapshot } from "./routing-service";
  import { canvasArrival } from "$features/work/lib/canvas-context";
  import { describeStrand, type StrandData as Data } from "./relations";
  import { construction } from "./construction.svelte";

  let { id, source, target, sourceX, sourceY, data, selected }: EdgeProps = $props();
  const strand = $derived(data?.strand as Data);
  const arrival = getContext<((id: string) => unknown) | undefined>(canvasArrival);
  const nodes = useNodes();
  const sharedRouter=getContext<(()=>RoutingSnapshot)|undefined>(routingContext);
  const snapshot=$derived(sharedRouter?.());
  const scene=$derived(snapshot?.scene??indexRoutingNodes(nodes.current));
  const fromRect=$derived(scene.bounds.get(source));
  const toRect=$derived(scene.bounds.get(target));
  const lane = $derived(strand.index - (strand.of - 1) / 2);
  const focused = $derived(selected || scene.byId.get(source)?.selected || scene.byId.get(target)?.selected);
  const dormant = $derived((!!strand.control || !!strand.detailOnly) && !focused);
  const routed = $derived(!strand.summaryOnly && !dormant ? snapshot?.get(id) : null);
  const geometry = $derived(routed?.geometry ?? null);
  const visibleTrunk = $derived(routed?.trunk ?? null);
  const visibleFan = false;
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
