export const designerPatches = [
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Expose real geometry to the provider-free AEGIS designer without synthesizing pointer events.",
    "find": "  type CanvasApi = {",
    "replace": "\n  // AEGIS designer uses the real graph state. Camera state is never shared.\n  let designerAnimating = $state(false);\n  const designer: import(\"../../../../../src/designer/types\").CanvasDesignerApi = {\n    snapshot() {\n      return {\n        nodes: nodes.filter(n => isItemNode(n) || isAreaNode(n)).map(n => {\n          const data = n.data as CanvasItem & {node?: {group?: string};branch?: {role?:string}};\n          const pos = absolutePosition(n, nodes);\n          return {id:n.id, ...pos, width:n.width ?? 280, height:n.height ?? 160,\n            type:data.type ?? \"group\", title:data.title ?? n.id, parentId:n.parentId,\n            group:data.node?.group ? \"mapgroup:\"+data.node.group : data.area ?? undefined,\n            role:data.branch?.role, selected:!!n.selected, dragging:!!n.dragging,\n            editing:!!host?.querySelector('.svelte-flow__node[data-id=\"'+CSS.escape(n.id)+'\"] [contenteditable=\"true\"]:focus'),\n            container:isAreaNode(n) || data.type === (\"mapgroup\" as string)};\n        }),\n        edges: scene.links.map(e => ({id:e.id,source:e.source,target:e.target})),\n        viewport:{...viewport}, width:canvasWidth,height:canvasHeight\n      };\n    },\n    setAnimating(value) { designerAnimating = value; },\n    setGeometry(geometry, provisional = false) {\n      nodes = nodes.map(n => {\n        const pos=geometry.positions[n.id], size=geometry.sizes[n.id];\n        if(!pos || n.dragging)return n;\n        const parent=n.parentId ? geometry.positions[n.parentId] ?? absolutePosition(nodes.find(p=>p.id===n.parentId)!,nodes) : null;\n        return {...n,position:parent?{x:pos.x-parent.x,y:pos.y-parent.y}:{...pos},\n          ...(size?{width:size.width,height:size.height}:{}),\n          class:classes(n).filter(c=>c!==GLIDE).join(\" \"),\n          draggable:!geometry.constraints[n.id]?.pinned};\n      });\n      publishedPositions = positionKey(nodes);\n      if (!provisional) publishView();\n    },\n    screenPoint(x,y) { return {x:x*viewport.zoom+viewport.x,y:y*viewport.zoom+viewport.y}; },\n    follow(id) { center(id); },\n  };\n\n  type CanvasApi = {\n    designer: import(\"../../../../../src/designer/types\").CanvasDesignerApi;"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Return the controlled geometry API to the host.",
    "find": "    expose?.({\n      screenRect,",
    "replace": "    expose?.({\n      designer,\n      screenRect,"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Suppress persisted view callbacks during provisional animation.",
    "find": "    if (resizing) return;\n    const elements = nodes.filter(isItemNode);",
    "replace": "    if (resizing || designerAnimating) return;\n    const elements = nodes.filter(isItemNode);"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Do not let lane projections interrupt an active arrangement.",
    "find": "      if (!ready) return [];\n      arrival.see(next);",
    "replace": "      if (!ready) return [];\n      if (designerAnimating) return nodes;\n      arrival.see(next);"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Let manual interaction cancel designer movement before the drag.",
    "find": "    expose,\n  }: {",
    "replace": "    expose,\n    onmanual,\n  }: {"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Typed cancellation hook for AEGIS.",
    "find": "    expose?: (api: CanvasApi) => void;",
    "replace": "    expose?: (api: CanvasApi) => void;\n    onmanual?: (kind: 'drag' | 'resize' | 'camera') => void;"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "User resize wins over arrangement.",
    "find": "  setContext(canvasResize, (active: boolean) => (resizing = active));",
    "replace": "  setContext(canvasResize, (active: boolean) => { if(active)onmanual?.('resize'); resizing = active; });"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "User camera remains independent of designer Follow.",
    "find": "      onmovestart={(event) => {\n        if (!event) return;",
    "replace": "      onmovestart={(event) => {\n        if (!event) return;\n        onmanual?.('camera');"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Cancel automation when the user takes a card.",
    "find": "      onnodedragstart={() => {\n        following = false;",
    "replace": "      onnodedragstart={() => {\n        onmanual?.('drag');\n        following = false;"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Avoid double CSS interpolation while requestAnimationFrame owns positions.",
    "find": "  class=\"work-canvas\"\n",
    "replace": "  class=\"work-canvas\"\n  class:designing={designerAnimating}\n"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "The actual node follows the designer scheduler exactly.",
    "find": "<style>\n",
    "replace": "<style>\n  .work-canvas.designing :global(.svelte-flow__node) { transition: none !important; }\n"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Accessible pin and size-lock actions for actual AEGIS canvas cards.",
    "find": "      >{#if areas?.list.length}<select",
    "replace": "      ><button type=\"button\" onclick={() => action(id, \"pin\")}>Pin / unpin</button><button type=\"button\" onclick={() => action(id, \"lock-size\")}>Lock / unlock size</button><button type=\"button\" onclick={() => action(id, \"release-position\")}>Release position</button>{#if areas?.list.length}<select"
  },
  {
    "file": "features/work/lib/canvas-model.ts",
    "why": "Carry designer constraints through the actual node model.",
    "find": "export type CanvasItem = {\n  id: string;",
    "replace": "export type CanvasItem = {\n  designer?: boolean;\n  positionPinned?: boolean;\n  sizeLocked?: boolean;\n  manualPosition?: boolean;\n  id: string;"
  },
  {
    "file": "features/work/lib/canvas-model.ts",
    "why": "Refresh node protection when the saved layout changes.",
    "find": "        node.data.title === item.title &&",
    "replace": "        node.data.positionPinned === item.positionPinned &&\n        node.data.sizeLocked === item.sizeLocked &&\n        node.data.manualPosition === item.manualPosition &&\n        node.data.title === item.title &&"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Expose safe real resizing on designer-enabled cards while respecting locks.",
    "find": "  isVisible={selected && !laid}",
    "replace": "  isVisible={selected && !data.sizeLocked && ((!laid) || (data.designer && ![\"mapgroup\",\"head\",\"trail\",\"input\"].includes(type)))}"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Show the actual protection state in node actions.",
    "find": ">Pin / unpin</button>",
    "replace": ">{data.positionPinned ? \"Unpin\" : \"Pin position\"}</button>"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Show the actual size-lock state.",
    "find": ">Lock / unlock size</button>",
    "replace": ">{data.sizeLocked ? \"Unlock size\" : \"Lock size\"}</button>"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Designer Follow preserves zoom and pans gently only when its target leaves the available canvas.",
    "find": "    follow(id) { center(id); },",
    "replace": "    follow(id) {\n      const node=nodeFor(id); if(!node)return;\n      const p=absolutePosition(node,nodes), z=viewport.zoom;\n      const x=p.x*z+viewport.x,y=p.y*z+viewport.y;\n      const dx=x<32?32-x:x+(node.width??280)*z>canvasWidth-32?canvasWidth-32-x-(node.width??280)*z:0;\n      const dy=y<fitTopInset?fitTopInset-y:y+(node.height??160)*z>canvasHeight-fitBottomInset?canvasHeight-fitBottomInset-y-(node.height??160)*z:0;\n      if(dx||dy)viewport={...viewport,x:viewport.x+dx*.12,y:viewport.y+dy*.12};\n    },"
  },
  {
    "file": "features/work/components/WorkEdge.svelte",
    "why": "Use live handle coordinates after layout moves or resizes so connectors stay attached.",
    "find": "    if (still(da) && still(db)) return route.points;",
    "replace": "    const handlesMatch = Math.abs(sourceX-a.x-route.from.x)<.5 && Math.abs(sourceY-a.y-route.from.y)<.5 && Math.abs(targetX-b.x-route.to.x)<.5 && Math.abs(targetY-b.y-route.to.y)<.5;\n    if (!handlesMatch) return elbow({x:sourceX,y:sourceY},{x:targetX,y:targetY});\n    if (still(da) && still(db)) return route.points;"
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "  import Popover from \"../board/Popover.svelte\";\n",
    "replace": "",
    "why": "Expand source rows inside their existing measured card."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "  const shown = $derived(rows.slice(0, SOURCE_ROWS));",
    "replace": "  const shown = $derived(sheet === \"all\" ? rows : rows.slice(0, SOURCE_ROWS));",
    "why": "Show the full saved list inline."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "board?.measure(item.id, width, false, height)",
    "replace": "board?.measure(item.id, width, sheet === \"all\", height)",
    "why": "Report expansion height through the existing measurement hook."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": ">{m.work_sources_all({ count: rows.length })}<Icon",
    "replace": ">{sheet === \"all\" ? \"Show less\" : m.work_sources_all({ count: rows.length })}<Icon",
    "why": "Provide accessible inline collapse."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "{#if sheet}<Popover",
    "replace": "{#if sheet && sheet !== \"all\"}<section",
    "why": "Keep auxiliary source lists inline too."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "            side=\"below\"\n            width={440}\n            onclose={() => (sheet = null)}\n",
    "replace": "",
    "why": "Remove popup geometry and close handlers."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "            label={sheet === \"missed\"",
    "replace": "            aria-label={sheet === \"missed\"",
    "why": "Name inline source details."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "</Popover>{/if}",
    "replace": "</section>{/if}",
    "why": "End inline source details."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "{#each shown as row (row.key)}<li>",
    "replace": "{#each shown as row, index (row.key)}<li class:revealed={index >= SOURCE_ROWS} style:--reveal-delay={(Math.min(12, index - SOURCE_ROWS) * 24) + \"ms\"}>",
    "why": "Subtle bounded stagger for newly revealed rows."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "    max-block-size: 360px;\n    margin: -6px;\n    overflow-y: auto;\n    overscroll-behavior: contain;",
    "replace": "    margin: 8px 0 0;\n    inline-size: 100%;",
    "why": "Avoid nested scrolling in expanded sources."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "<style>\n",
    "replace": "<style>\n  .more > section { flex-basis: 100%; }\n  .revealed { animation: source-reveal 240ms var(--ease-out) both; animation-delay:var(--reveal-delay,0ms); }\n  @keyframes source-reveal { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }\n  @media(prefers-reduced-motion:reduce) { .revealed { animation:none; } }\n",
    "why": "Respect reduced motion for source reveals."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "    const ready = valid;\n    const placed = initialView?.positions ?? {};",
    "replace": "    const ready = valid;\n    const arranging = designerAnimating;\n    const placed = initialView?.positions ?? {};",
    "why": "Reconcile arrivals deferred during motion once the coordinator releases geometry."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "      if (designerAnimating) return nodes;",
    "replace": "      if (arranging) return nodes;",
    "why": "Track animation state outside untrack so arriving nodes cannot become stranded."
  },
  {
    "file": "features/work/lib/canvas-model.ts",
    "find": "        JSON.stringify(node.data.sources) === JSON.stringify(item.sources) &&",
    "replace": "        JSON.stringify(node.data.drawn) === JSON.stringify(item.drawn) &&\n        JSON.stringify(node.data.sources) === JSON.stringify(item.sources) &&",
    "why": "Sources update even when row count and measured height remain unchanged."
  },
  {
    "file": "features/work/components/cards/SourcesCard.svelte",
    "find": "    const width = item.size?.width ?? 0;",
    "replace": "    const width = item.size?.width ?? 0;\n    void sheet;",
    "why": "Remeasure expansion and collapse even if outer dimensions were cached."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "    screenPoint(x,y) { return {x:x*viewport.zoom+viewport.x,y:y*viewport.zoom+viewport.y}; },",
    "replace": "    focus(id) { centreRequest(id); },\n    screenPoint(x,y) { return {x:x*viewport.zoom+viewport.x,y:y*viewport.zoom+viewport.y}; },",
    "why": "Explicit Focus on Active Work uses the current zoom and existing camera glide."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "            type:data.type ?? \"group\", title:data.title ?? n.id, parentId:n.parentId,",
    "replace": "            type:data.object?.kind ?? data.type ?? \"group\", title:data.title ?? n.id, parentId:n.parentId,",
    "why": "Use existing typed rich-object kinds for content-aware packing without inventing integrations."
  }
];
