<!--
  One semantic string between two cards: the relations in it came from the run record (relations.ts).
  A thin curve leaves a card's port through a small glowing junction and meets the other the same way.
  Parallel strands share their ends and part in the middle, so each stays visible. Status sets tone
  and dash, never the relation's type. Clicking a strand opens what it means and what made it.
-->
<script lang="ts" module>
  import type { StrandData } from "./relations";
  type Side = "top" | "right" | "bottom" | "left";
  const OUT: Record<Side, readonly [number, number]> = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };

  /** The curve for strand `index` of `of`: ends shared, middles spread apart by `gap`. */
  export function strandPath(sx: number, sy: number, from: Side, tx: number, ty: number, to: Side, index: number, of: number, gap = 9) {
    const [ax, ay] = OUT[from];
    const [bx, by] = OUT[to];
    const span = Math.hypot(tx - sx, ty - sy);
    // Handles reach far enough to leave a card cleanly, even when the other card stands behind it.
    const along = Math.max(48, Math.min(260, (Math.abs(tx - sx) + Math.abs(ty - sy) * 0.35) / 2));
    const spread = (index - (of - 1) / 2) * gap * Math.min(1, span / 160);
    // Perpendicular to the line between the ends.
    const nx = span ? -(ty - sy) / span : 0;
    const ny = span ? (tx - sx) / span : 0;
    const c1 = [sx + ax * along + nx * spread * 1.6, sy + ay * along + ny * spread * 1.6];
    const c2 = [tx + bx * along + nx * spread * 1.6, ty + by * along + ny * spread * 1.6];
    return {
      d: `M ${sx},${sy} C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${tx},${ty}`,
      controls: [{ x: c1[0]!, y: c1[1]! }, { x: c2[0]!, y: c2[1]! }] as const,
      // The curve's midpoint (t = 0.5 of the cubic), for the label.
      mid: { x: (sx + 3 * c1[0]! + 3 * c2[0]! + tx) / 8, y: (sy + 3 * c1[1]! + 3 * c2[1]! + ty) / 8 },
    };
  }

  /** A small meniscus where a string meets a card, opening along the port's direction. */
  export function junction(x: number, y: number, side: Side, size = 7) {
    const [dx, dy] = OUT[side];
    const px = -dy;
    const py = dx;
    const w = size;
    const h = size * 1.15;
    const tipX = x + dx * h;
    const tipY = y + dy * h;
    return `M ${x + px * w},${y + py * w} Q ${x + dx * h * 0.25 + px * w * 0.18},${y + dy * h * 0.25 + py * w * 0.18} ${tipX},${tipY} Q ${x + dx * h * 0.25 - px * w * 0.18},${y + dy * h * 0.25 - py * w * 0.18} ${x - px * w},${y - py * w} Z`;
  }

  export type StrandSelect = { id: string; source: string; target: string; strand: StrandData };
</script>

<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { useNodes, type EdgeProps } from "@xyflow/svelte";
  import { curveHits, roundedPath, routeAround, type Rect } from "./route";
  import { canvasArrival } from "$features/work/lib/canvas-context";
  import { describeStrand, type StrandData as Data } from "./relations";
  import { construction } from "./construction.svelte";

  let { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps = $props();
  const strand = $derived(data?.strand as Data);
  const arrival = getContext<((id: string) => unknown) | undefined>(canvasArrival);
  const nodes = useNodes();
  /** Every other card, where it stands now: a string goes around them, never through. */
  const obstacles = $derived.by<Rect[]>(() => {
    const list = nodes.current;
    const byId = new Map(list.map((node) => [node.id, node]));
    const absolute = (node: (typeof list)[number]): { x: number; y: number } => {
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      const base = parent ? absolute(parent) : { x: 0, y: 0 };
      return { x: base.x + node.position.x, y: base.y + node.position.y };
    };
    const holders = new Set<string>();
    for (const end of [source, target]) for (let at = byId.get(end); at?.parentId; at = byId.get(at.parentId)) holders.add(at.parentId);
    return list.flatMap((node) => {
      const kind = (node.data as { type?: string } | undefined)?.type;
      if (node.id === source || node.id === target || holders.has(node.id) || node.hidden || node.type === "agent" || kind === "agent" || kind === "mapgroup" || node.type === "area") return [];
      const width = node.measured?.width ?? node.width;
      const height = node.measured?.height ?? node.height;
      if (!width || !height) return [];
      return [{ ...absolute(node), width, height }];
    });
  });
  const geometry = $derived.by(() => {
    const from = `${sourcePosition}` as Side;
    const to = `${targetPosition}` as Side;
    const curve = strandPath(sourceX, sourceY, from, targetX, targetY, to, strand.index, strand.of);
    const s = { x: sourceX, y: sourceY };
    const t = { x: targetX, y: targetY };
    if (from !== "right" || to !== "left" || !curveHits(s, curve.controls[0], curve.controls[1], t, obstacles)) return curve;
    const route = routeAround(s, t, obstacles, (strand.index - (strand.of - 1) / 2) * 5);
    return route ? roundedPath(route) : curve;
  });
  const lit = $derived(strand.status === "active" || strand.status === "verified");
  const name = $derived(describeStrand(strand, source, target));
  const label = $derived(strand.labelled || selected ? strand.label : "");
  const labelWidth = $derived(Math.max(34, label.length * 6.1 + 18));
  /** Hidden until the construction hand draws it; then drawn in along its length. */
  const pending = $derived(construction.pendingEdge(id));
  let line = $state<SVGPathElement>();
  let drawn = false;

  function draw() {
    if (!line || drawn) return;
    drawn = true;
    if (construction.instant || !construction.animating(id)) return;
    line.animate([{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
      duration: construction.drawMs(),
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

{#if !pending}
  <g class="strand" data-status={strand.status} data-relations={strand.relations.map((row) => row.id).join(" ")} data-strand-index={strand.index} data-strand-of={strand.of} class:lit class:selected aria-hidden="true">
    <path bind:this={line} class="strand-line" d={geometry.d} pathLength="1" stroke-dasharray={construction.animating(id) ? "1" : undefined} fill="none" />
    {#if strand.status === "active"}<path class="strand-flow" d={geometry.d} fill="none" />{/if}
    <path class="junction" d={junction(sourceX, sourceY, `${sourcePosition}` as Side)} />
    <path class="junction" d={junction(targetX, targetY, `${targetPosition}` as Side)} />
    <circle class="glint" cx={sourceX} cy={sourceY} r="1.6" />
    <circle class="glint" cx={targetX} cy={targetY} r="1.6" />
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
    d={geometry.d}
    fill="none"
    role="button"
    tabindex="0"
    aria-label={name}
    onclick={select}
    onkeydown={(event) => (event.key === "Enter" || event.key === " ") && select(event)}
  ><title>{name}</title></path>
{/if}

<style>
  .strand {
    --strand: color-mix(in oklab, var(--color-text) 30%, transparent);
    --strand-glow: color-mix(in oklab, var(--color-text) 70%, transparent);
    pointer-events: none;
  }

  .strand[data-status="complete"] {
    --strand: color-mix(in oklab, var(--color-text) 42%, transparent);
    --strand-glow: color-mix(in oklab, var(--color-text) 85%, transparent);
  }

  .strand.lit {
    --strand: color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 70%, transparent);
    --strand-glow: var(--aegis-strand-green, #3fdc84);
  }

  .strand[data-status="contested"] {
    --strand: color-mix(in oklab, var(--aegis-status-waiting, #e2a336) 70%, transparent);
    --strand-glow: var(--aegis-status-waiting, #e2a336);
  }

  .strand[data-status="failed"] {
    --strand: color-mix(in oklab, var(--aegis-status-failed, #f0605a) 60%, transparent);
    --strand-glow: var(--aegis-status-failed, #f0605a);
  }

  .strand-line {
    stroke: var(--strand);
    stroke-width: 1.25;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    transition: stroke 200ms ease;
  }

  /* Non-colour cues: contested strands are dashed, failed strands dotted. */
  .strand[data-status="contested"] .strand-line {
    stroke-dasharray: 6 4;
  }

  .strand[data-status="failed"] .strand-line {
    stroke-dasharray: 1.5 4;
  }

  .strand.selected .strand-line {
    stroke-width: 2;
    stroke: var(--strand-glow);
  }

  /* Work moving along an active string: fine light travelling from its start. */
  .strand-flow {
    stroke: var(--strand-glow);
    stroke-width: 1.25;
    stroke-dasharray: 2 14;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    animation: strand-flow 900ms linear infinite;
    opacity: 0.9;
  }

  @keyframes strand-flow {
    to {
      stroke-dashoffset: -16;
    }
  }

  /* The only glow: a small meniscus and a pin of light where the string meets the card. */
  .junction {
    fill: var(--strand-glow);
    opacity: 0.55;
    filter: blur(0.6px);
  }

  .glint {
    fill: var(--strand-glow);
    filter: drop-shadow(0 0 2px var(--strand-glow));
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
    .strand-flow {
      animation: none;
      stroke-dasharray: none;
      opacity: 0.35;
    }
  }
</style>
