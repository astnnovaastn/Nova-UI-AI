<script lang="ts">
  import { onMount } from "svelte";
  import { useSvelteFlow, useViewport, Panel } from "@xyflow/svelte";
  import { duration, reducedMotion } from "$shared/lib/motion";
  import * as m from "$shared/i18n/messages";
  let {
    bottomInset = 0,
    onfit,
  }: {
    bottomInset?: number;
    /** The person asked for the whole picture: a run in progress may follow again. */
    onfit?: () => void;
  } = $props();
  const flow = useSvelteFlow();
  const viewport = useViewport();
  const percent = $derived(Math.round(viewport.current.zoom * 100));
  /** A mark inside the flow: the level itself is drawn in the canvas's edge slot. */
  let anchor = $state<HTMLElement>();
  /** The edge slot the workspace keeps for the level, when there is one. */
  let slot = $state<HTMLElement | null>(null);
  onMount(() => {
    const find = () => {
      for (let at = anchor?.parentElement; at; at = at.parentElement) {
        const found = at.querySelector<HTMLElement>("[data-work-zoom-slot]");
        if (found) return found;
      }
      return null;
    };
    slot = find();
    if (slot) return;
    // The slot can arrive a frame after the canvas.
    const frame = requestAnimationFrame(() => (slot = find()));
    return () => cancelAnimationFrame(frame);
  });
  /** Draws the level in the edge slot. */
  function into(node: HTMLElement, target: HTMLElement) {
    // One element moves, so Svelte's removal of the block still finds it.
    target.append(node);
    return { destroy: () => node.remove() };
  }
  /** The canvas the pointer last pressed in, so a key reaches it while nothing else has focus. */
  let engaged = false;
  const travel = (name: "fast" | "slow") => (reducedMotion() ? 0 : duration(name));
  /**
   * AEGIS V35 Fit view: frames the content that is really there (shown, measured nodes), in the part of the pane
   * that is really visible (side panels such as the Lift or the conversation are found by hit-testing the pane's
   * edges), centred, with padding. The zoom follows the content: between the canvas's minimum and 100%, never a
   * fixed value. Only a run larger than the minimum zoom can hold opens at its start, so nothing important is cut.
   */
  const PAD = 32, TOP = 80, MIN = 0.2, MAX = 1;
  function covered(pane: DOMRect, side: "left" | "right") {
    const flowEl = anchor?.closest(".svelte-flow");
    let most = 0;
    for (const f of [0.3, 0.5, 0.7]) {
      const y = pane.top + pane.height * f;
      let d = 0;
      for (; d < pane.width * 0.6; d += 16) {
        const x = side === "left" ? pane.left + d + 2 : pane.right - d - 2;
        const hit = document.elementFromPoint(x, y);
        if (!hit || flowEl?.contains(hit)) break;
      }
      most = Math.max(most, d);
    }
    return most;
  }
  function fit() {
    onfit?.();
    const pane = anchor?.closest(".svelte-flow")?.getBoundingClientRect();
    const nodes = flow.getNodes().filter((n) => !n.hidden && (n.measured?.width ?? n.width ?? 0) > 1 && (n.measured?.height ?? n.height ?? 0) > 1);
    if (!pane || !nodes.length) {
      void flow.fitView({ duration: travel("slow"), padding: 0.12, maxZoom: MAX });
      return;
    }
    const box = flow.getNodesBounds(nodes);
    const left = covered(pane, "left") + PAD, right = covered(pane, "right") + PAD;
    const top = TOP, bottom = (bottomInset > 0 ? bottomInset : 0) + PAD;
    const roomW = Math.max(120, pane.width - left - right), roomH = Math.max(120, pane.height - top - bottom);
    const want = Math.min(roomW / Math.max(1, box.width), roomH / Math.max(1, box.height));
    const zoom = Math.max(MIN, Math.min(MAX, want));
    const fitsW = box.width * zoom <= roomW + 1, fitsH = box.height * zoom <= roomH + 1;
    const x = fitsW ? left + (roomW - box.width * zoom) / 2 - box.x * zoom : left - box.x * zoom;
    const y = fitsH ? top + (roomH - box.height * zoom) / 2 - box.y * zoom : top - box.y * zoom;
    void flow.setViewport({ x, y, zoom }, { duration: travel("slow") });
  }
  function unusedFit() {
    void flow.fitView({
      duration: travel("slow"),
      padding:
        bottomInset > 0
          ? { top: "110px", bottom: `${bottomInset + 32}px`, left: "40px", right: "40px" }
          : 0.2,
    });
  }
  /** 0 fits the view and 1 shows it at actual size, while the canvas holds the keyboard. */
  function keys(event: KeyboardEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key !== "0" && event.key !== "1") return;
    const canvas = anchor?.closest(".svelte-flow");
    const active = document.activeElement;
    const inside = !!active && !!canvas?.contains(active);
    if (!inside && !(engaged && (!active || active === document.body))) return;
    if ((event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]"))
      return;
    event.preventDefault();
    if (event.key === "0") fit();
    else void flow.setZoom(1, { duration: travel("slow") });
  }
</script>

<svelte:window
  onpointerdowncapture={(event) =>
    (engaged = !!anchor?.closest(".svelte-flow")?.contains(event.target as Node))}
  onkeydown={keys}
/>

<span class="anchor" hidden bind:this={anchor}></span>
{#snippet capsule()}
  <div class="zoom" role="group" aria-label={m.work_canvas_controls()}>
    <button
      type="button"
      class="level"
      aria-label={m.work_fit()}
      title={`${m.work_fit()} (0)`}
      onclick={fit}>{percent}%</button
    >
  </div>
{/snippet}
{#if slot}<div class="docked-host" use:into={slot}>{@render capsule()}</div>
{:else}<Panel position="bottom-right">{@render capsule()}</Panel>{/if}

<style>
  .docked-host {
    display: flex;
  }

  /* A reading more than a control: the level, quiet at the canvas's edge,
     and a click fits the view to it. */
  .zoom {
    display: inline-flex;
    align-items: center;
  }

  .level {
    min-inline-size: 48px;
    block-size: 28px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius-capsule);
    background: transparent;
    color: var(--color-muted);
    font: inherit;
    font-size: var(--text-label);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    cursor: default;
    transition:
      background-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }

  .level:hover {
    background: var(--color-fill-hover);
    color: var(--color-text);
  }

  .level:active {
    background: var(--color-fill-active);
  }

  .level:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: -2px;
  }
</style>
