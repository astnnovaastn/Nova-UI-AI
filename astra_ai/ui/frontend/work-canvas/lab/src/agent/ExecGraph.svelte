<script lang="ts">
  /*
   * The execution graph: lanes by actor, x by the simulated clock, lines only where the
   * events record a dependency (graph.ts). A lab component, not a Zephium one: Zephium draws
   * the run as its canvas (the Canvas tab); this view shows the event model underneath.
   */
  import { edgePath, type Graph, type GraphNode } from "./graph";
  import type { AgentEvent } from "./types";

  let { graph, selected, onselect }: { graph: Graph; selected?: string; onselect: (event: AgentEvent) => void } = $props();

  let zoom = $state(1);
  let x = $state(0);
  let y = $state(0);
  let dragging: { x: number; y: number; ox: number; oy: number } | null = null;
  let follow = $state(true);
  let box = $state<HTMLDivElement>();

  const byId = $derived(new Map(graph.nodes.map((node) => [node.id, node])));
  const related = $derived.by(() => {
    if (!selected) return new Set<string>();
    const out = new Set<string>([selected]);
    for (const edge of graph.edges) if (edge.from === selected || edge.to === selected) out.add(edge.from).add(edge.to);
    return out;
  });

  // Keep the newest event in view while a run plays, until the person pans.
  $effect(() => {
    const last = graph.nodes.reduce((max, node) => Math.max(max, node.x + node.width), 0);
    if (!follow || !box) return;
    const room = box.clientWidth / zoom;
    x = Math.min(0, -(last - room + 160) * zoom);
  });

  function wheel(event: WheelEvent) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const rect = box!.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const next = Math.min(2.5, Math.max(0.25, zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
      x = px - ((px - x) * next) / zoom;
      y = py - ((py - y) * next) / zoom;
      zoom = next;
    } else {
      x -= event.shiftKey ? event.deltaY : event.deltaX;
      y -= event.shiftKey ? 0 : event.deltaY;
    }
    follow = false;
  }
  function down(event: PointerEvent) {
    if ((event.target as Element).closest("[data-node]")) return;
    dragging = { x: event.clientX, y: event.clientY, ox: x, oy: y };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (!dragging) return;
    x = dragging.ox + event.clientX - dragging.x;
    y = dragging.oy + event.clientY - dragging.y;
    follow = false;
  }
  const colour: Record<GraphNode["tone"], string> = {
    turn: "#8b7cf6",
    tool: "#4f9cf7",
    source: "#3fb37f",
    ask: "#e0a53a",
    object: "#e46fa8",
    part: "#9aa4b2",
    fail: "#e5534b",
    run: "#c9d1d9",
    plan: "#f0c674",
  };
  export function fit() {
    if (!box) return;
    zoom = Math.max(0.25, Math.min(1, box.clientWidth / graph.width, box.clientHeight / graph.height));
    x = 0;
    y = 0;
    follow = false;
  }
  export function resume() {
    follow = true;
  }
</script>

<div
  class="graph"
  bind:this={box}
  onwheel={wheel}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={() => (dragging = null)}
  role="application"
  aria-label="Execution graph"
  data-graph
>
  <svg width="100%" height="100%">
    <g transform={`translate(${x} ${y}) scale(${zoom})`}>
      {#each graph.lanes as lane (lane.id)}
        <rect class="lane" x="0" y={lane.y} width={graph.width} height={lane.height} rx="8" />
        <text class="lane-label" x="12" y={lane.y + 20}>{lane.label}</text>
      {/each}
      {#each graph.edges as edge (edge.id)}
        {@const from = byId.get(edge.from)}
        {@const to = byId.get(edge.to)}
        {#if from && to}
          <path class="edge {edge.kind}" class:hot={related.has(edge.from) && related.has(edge.to) && !!selected} d={edgePath(from, to)} data-edge={edge.kind} />
        {/if}
      {/each}
      {#each graph.nodes as node (node.id)}
        <g
          class="node"
          class:on={node.id === selected}
          class:dim={!!selected && !related.has(node.id)}
          data-node={node.event.kind}
          data-seq={node.event.seq}
          role="button"
          tabindex="0"
          onclick={() => onselect(node.event)}
          onkeydown={(event) => event.key === "Enter" && onselect(node.event)}
        >
          <title>{node.event.seq}. {node.label}{node.event.detail ? ` — ${node.event.detail}` : ""}</title>
          {#if node.shape === "bar"}
            <rect x={node.x} y={node.y - 7} width={node.width} height="14" rx="4" fill={colour[node.tone]} />
            {#if node.width > 70}<text class="in" x={node.x + 6} y={node.y + 4}>{node.label.slice(0, Math.floor(node.width / 6.4))}</text>{/if}
          {:else if node.shape === "dot"}
            <circle cx={node.x + 5} cy={node.y} r="5" fill={colour[node.tone]} />
          {:else if node.shape === "diamond"}
            <rect x={node.x} y={node.y - 6} width="12" height="12" transform={`rotate(45 ${node.x + 6} ${node.y})`} fill={colour[node.tone]} />
          {:else if node.shape === "square"}
            <rect x={node.x} y={node.y - 6} width="12" height="12" rx="2" fill={colour[node.tone]} />
            <text class="out" x={node.x + 16} y={node.y + 4}>{node.label.slice(0, 34)}</text>
          {:else}
            <path d={`M ${node.x} ${node.y + 8} L ${node.x} ${node.y - 8} L ${node.x + 9} ${node.y - 4} L ${node.x} ${node.y}`} fill={colour[node.tone]} stroke={colour[node.tone]} stroke-width="1.5" />
          {/if}
        </g>
      {/each}
    </g>
  </svg>
  <div class="legend">
    {#each Object.entries(colour) as [tone, fill] (tone)}<span><i style={`background:${fill}`}></i>{tone}</span>{/each}
    <span class="hint">Drag or scroll to pan · Ctrl + wheel to zoom</span>
  </div>
</div>

<style>
  .graph {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--color-canvas);
    cursor: grab;
    touch-action: none;
  }
  svg {
    display: block;
  }
  .lane {
    fill: color-mix(in srgb, var(--color-text) 3.5%, transparent);
  }
  .lane-label {
    fill: var(--color-muted);
    font-size: 11px;
    font-weight: 600;
  }
  .edge {
    fill: none;
    stroke: color-mix(in srgb, var(--color-text) 30%, transparent);
    stroke-width: 1.2;
  }
  .edge.cites {
    stroke-dasharray: 3 3;
    stroke: color-mix(in srgb, #3fb37f 45%, transparent);
  }
  .edge.reports {
    stroke: color-mix(in srgb, #9aa4b2 60%, transparent);
  }
  .edge.hot {
    stroke: #f2f4f8;
    stroke-width: 2;
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.6));
  }
  .node {
    cursor: pointer;
  }
  .node.dim {
    opacity: 0.32;
  }
  .node.on rect,
  .node.on circle,
  .node.on path {
    stroke: #fff;
    stroke-width: 2;
  }
  .in {
    fill: #0b0d12;
    font-size: 10px;
    pointer-events: none;
  }
  .out {
    fill: var(--color-text);
    font-size: 10.5px;
    pointer-events: none;
  }
  .legend {
    position: absolute;
    inset-inline: 10px;
    inset-block-end: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: var(--color-muted);
    font-size: 10.5px;
    pointer-events: none;
  }
  .legend i {
    display: inline-block;
    inline-size: 9px;
    block-size: 9px;
    margin-inline-end: 4px;
    border-radius: 2px;
  }
  .hint {
    margin-inline-start: auto;
  }
</style>
