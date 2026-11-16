<script lang="ts">
  // The original Zephium PartRow owns page geometry, transforms and PageFace rendering (MPL-2.0).
  import PartRow from "$features/work/components/run/PartRow.svelte";
  import { PART } from "$features/work/lib/run/part-size";
  import type { CanvasItem } from "$features/work/lib/canvas-model";
  import { onMount, untrack } from "svelte";
  type Page = { id: string; title: string; url: string; frame?: string | null; live?: boolean };
  let { anchor, bounds, pages, title, onopen, onhold, onleave, onclose, focusFirst, closing }: {
    anchor: HTMLElement; bounds: DOMRect; pages: readonly Page[]; title: string;
    onopen: (page: Page, event: MouseEvent) => void; onhold: () => void;
    onleave: () => void; onclose: () => void; focusFirst: boolean; closing: boolean;
  } = $props();
  let rect = $state.raw<DOMRect>(untrack(() => anchor.getBoundingClientRect()));
  let ready = $state(false);
  let layer: HTMLDivElement;
  const windowWidth = untrack(() => anchor.offsetWidth || PART.window);
  const frameHeight = windowWidth * 10 / 16;
  const scale = $derived(rect.width / windowWidth);
  const gap = $derived(16 * scale);
  const right = $derived(bounds.right - rect.left);
  const left = $derived(rect.right - bounds.left);
  const reverse = $derived(right < rect.width * 2 + gap && left > right);
  const width = $derived(Math.max(1, Math.min(bounds.width, reverse ? left : right, rect.width * pages.length + (pages.length - 1) * gap)));
  const x = $derived(Math.max(bounds.left,Math.min(bounds.right-width,reverse ? rect.right - width : rect.left)));
  const expanded = $derived(ready && !closing);
  const fullWidth = $derived(pages.length * (windowWidth + 16) - 16);
  const item = $derived({ id: "source-stack-presentation", type: "part", aegisSourceWidth:windowWidth, part: {
    title, shape: "pages", state: "complete", pages: [...pages].reverse().map(page => ({...page, frame: page.frame ?? null})),
  }} as unknown as CanvasItem);
  onMount(() => {
    let frame = 0;
    const stack = anchor.closest<HTMLElement>(".stack");
    const oldVisibility = stack?.style.visibility ?? "";
    if (stack) stack.style.visibility = "hidden";
    const follow = () => {
      frame = 0;
      const next = anchor.getBoundingClientRect();
      if (!anchor.isConnected || next.right < bounds.left || next.left > bounds.right || next.bottom < bounds.top || next.top > bounds.bottom) { onclose(); return; }
      if (rect.x !== next.x || rect.y !== next.y || rect.width !== next.width || rect.height !== next.height) rect = next;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(follow); };
    const observer = new MutationObserver(schedule);
    const viewport = anchor.closest(".svelte-flow__viewport");
    const node = anchor.closest(".svelte-flow__node");
    if (viewport) observer.observe(viewport, {attributes:true, attributeFilter:["style"]});
    if (node) observer.observe(node, {attributes:true, attributeFilter:["style"]});
    const resize = new ResizeObserver(schedule);
    resize.observe(anchor);
    window.addEventListener("resize", schedule);
    let start = requestAnimationFrame(() => { start = requestAnimationFrame(() => {
      ready = true;
      if (focusFirst) layer.querySelector<HTMLButtonElement>(".page")?.focus({preventScroll:true});
    }); });
    return () => { cancelAnimationFrame(start); cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); window.removeEventListener("resize", schedule); if (stack) stack.style.visibility = oldVisibility; };
  });
  function scroll(event: WheelEvent) {
    if (event.ctrlKey || event.deltaX || layer.scrollWidth <= layer.clientWidth) return;
    event.preventDefault(); layer.scrollLeft += (reverse ? -1 : 1) * event.deltaY;
  }
  function keys(event: KeyboardEvent) {
    if (event.key === "Escape" && layer?.contains(event.target as Node)) { event.preventDefault(); event.stopPropagation(); onclose(); }
  }
</script>
<svelte:window onkeydown={keys} />
<div class="source-stack-fan nodrag nopan nowheel" role="group" aria-label={title} bind:this={layer}
  style:left={x + "px"} style:top={rect.top + "px"} style:width={width + "px"}
  style:height={(PART.bar + frameHeight + 12) * scale + 12 + "px"} style:--scale={scale}
  class:reverse class:closing onpointerenter={onhold} onpointerleave={onleave}
  onfocusin={onhold} onfocusout={onleave} onwheel={scroll}>
  <div class="scroll-extent" style:width={fullWidth * scale + "px"}>
    <div class="upstream-stack" style:width={windowWidth + "px"}>
      <PartRow {item} selected={false} reverseFan={reverse} fanState={expanded ? "open" : "closed"} onlist={() => {}}
        onopen={(id, event) => { const page = pages.find(page => page.id === id); if (page && event) onopen(page, event); }} />
    </div>
  </div>
</div>
<style>
  .source-stack-fan { position: fixed; z-index: 34; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; pointer-events: auto; }
  .scroll-extent { position: relative; height: 100%; }
  .upstream-stack { position: absolute; top: 0; left: 0; transform: scale(var(--scale)); transform-origin: top left; }
  .reverse { direction: rtl; }
  .reverse .upstream-stack { direction: ltr; left: auto; right: 0; transform-origin: top right; }
</style>
