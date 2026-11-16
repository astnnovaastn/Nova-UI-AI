// AEGIS adapters applied to the synced copy. The Zephium reference clone remains untouched.
export const v17Patches = [
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'Shared visual relay renderer, separate from the logical connection renderer.',
    find: '  import StrandEdge from "../../../../../src/StrandEdge.svelte";',
    replace: '  import RelayEdge from "../../../../../src/RelayEdge.svelte";\n  import StrandEdge from "../../../../../src/StrandEdge.svelte";'
  },
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'Logical dependencies drive layout; local relay segments drive rendering and culling.',
    find: '  const edgeTypes = { work: WorkEdge, strand: StrandEdge };',
    replace: '  const edgeTypes = { work: WorkEdge, strand: StrandEdge, relay: RelayEdge };\n  const renderedEdges = $derived.by(() => { void routing; return router.renderEdges(edges) as Edge[]; });'
  },
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'Render each shared local segment once instead of painting each logical long wire.',
    find: '      {edges}\n      {nodeTypes}',
    replace: '      edges={renderedEdges}\n      {nodeTypes}'
  },
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'Promote only the moving card, not every screenshot into a composited layer.',
    find: '.svelte-flow__viewport[data-held] .svelte-flow__node)',
    replace: '.svelte-flow__viewport[data-held] .svelte-flow__node.dragging)'
  },
  {
    file: 'features/work/lib/workspace/layers.ts',
    why: 'Do not force layout or trigger subtree measurement observers after gestures.',
    find: '    const probe = document.createElement("div");\n    probe.setAttribute("aria-hidden", "true");\n    probe.style.position = "absolute";\n    probe.style.inlineSize = "0";\n    probe.style.blockSize = "0";\n    viewport.append(probe);\n    void viewport.offsetHeight;\n    probe.remove();',
    replace: '    // Transform promotion is released by letGo; no forced layout probe is needed.'
  },
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'One stable routing scene shared by every edge; camera transforms are not routing inputs.',
    find: '  import StrandEdge from "../../../../../src/StrandEdge.svelte";',
    replace: '  import StrandEdge from "../../../../../src/StrandEdge.svelte";\n  import { routingContext, createRoutingService } from "../../../../../src/routing-service";\n  import { onDestroy } from "svelte";'
  },
  {
    file: 'features/work/components/WorkCanvas.svelte',
    why: 'Keep the router alive across node store updates and dispose it with this canvas.',
    find: '  let nodes = $state.raw<WorkNode[]>([]);',
    replace: '  let nodes = $state.raw<WorkNode[]>([]);\n  const router = createRoutingService();\n  const routing = $derived(router.update(nodes, edges));\n  setContext(routingContext, () => routing);\n  onDestroy(() => router.destroy());'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Reuse upstream PartRow itself in the bounded AEGIS overlay, including its transforms and PageFace.',
    find: '    onwait,\n  }: {',
    replace: '    onwait,\n    fanState,\n    reverseFan = false,\n  }: {\n    fanState?: "closed" | "open";\n    reverseFan?: boolean;'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Retain upstream stack geometry while allowing expansion into available space on the left.',
    find: '`translate(${index * PART.behindX}px, ${index * PART.behindY}px)`',
    replace: '`translate(${(reverseFan ? -1 : 1) * index * PART.behindX}px, ${index * PART.behindY}px)`'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Use the same fan spacing for the mirrored direction in a narrow viewport.',
    find: '`translate(${index * (PART.window + 16)}px, 0)`',
    replace: '`translate(${(reverseFan ? -1 : 1) * index * (PART.window + 16)}px, 0)`'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Preserve the original trusted page activation through the existing browser controller.',
    find: '    onopen: (page: string) => void;',
    replace: '    onopen: (page: string, event?: MouseEvent) => void;'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Show every page in the scrollable overlay rather than dropping sources after the third.',
    find: '  const shown = $derived(ordered.slice(0, PART.shown));',
    replace: '  const shown = $derived(fanState ? ordered : ordered.slice(0, PART.shown));'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Control the original fan transition for keyboard, touch and graceful close; keep base stack still beneath it.',
    find: '      class:holding={!!waiting?.human}',
    replace: '      class:holding={!!waiting?.human || !!part.stack}\n      class:presented={!!fanState}\n      data-expanded={fanState === "open"}'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Positive paint order for stacks larger than three.',
    find: '    style:z-index={PART.shown - index}',
    replace: '    style:z-index={shown.length - index}\n    data-source-url={page.url}'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Forward this page click, not a synthesized event.',
    find: '      else onopen(page.id);',
    replace: '      else onopen(page.id, event);'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'Use the original expanded transform for controlled activation as well as hover.',
    find: '  .fans:hover .page {',
    replace: '  .fans:not(.presented):hover .page,\n  .presented[data-expanded="true"] .page {'
  },
  {
    file: 'features/work/components/run/PartRow.svelte',
    why: 'The overlay supplies bounds; original page geometry and styling stay in PartRow.',
    find: '<style>\n',
    replace: '<style>\n  .part:has(.presented) .label, .presented .count { display: none; }\n  .part .stack.presented { inset-inline-start: 0 !important; }\n  .presented .page { transition-duration: 280ms; }\n  @media (prefers-reduced-motion: reduce) { .presented .page { transition: none; } }\n'
  },
];
