<!--
  The construction hand and its controls. The hand is drawn, not a pointer: it issues no events and
  takes no input. The controls appear only while there is something to play.
-->
<script lang="ts">
  import { construction, SPEEDS } from "./construction.svelte";

  let { onreplay }: { onreplay?: () => void } = $props();
  const hand = $derived(construction.hand);
  const busy = $derived(construction.busy);
  const waiting = $derived(construction.waiting);
</script>

<div class="hand-layer" aria-hidden="true" data-page={(void construction.version, construction.stats.page)} data-active={(void construction.version, construction.stats.active)} data-played={(void construction.version, construction.stats.played)} data-immediate={(void construction.version, construction.stats.immediate)} data-reason={(void construction.version, construction.stats.reason)}>
  <div class="hand" class:visible={hand.visible} class:pressing={hand.pressing} style:transform="translate({hand.x}px, {hand.y}px)">
    <span class="press"></span>
    <svg width="22" height="26" viewBox="0 0 22 26">
      <path d="M3 2 L18.5 15.2 L11.3 16.1 L8 23.4 Z" fill="var(--color-text)" stroke="var(--color-canvas, #000)" stroke-width="1.4" stroke-linejoin="round" />
    </svg>
    {#if hand.label}<span class="caption">{hand.label}</span>{/if}
  </div>
</div>

{#if busy || onreplay}
  <div class="construction-controls" data-construction-control role="toolbar" aria-label="Canvas construction">
    {#if busy}
      <span class="count" aria-live="polite">{waiting ? `Building · ${waiting} to place` : "Building"}</span>
      <button type="button" onclick={() => construction.togglePause()}>{construction.paused ? "Resume" : "Pause"}</button>
      <button type="button" onclick={() => construction.finish()}>Skip</button>
    {:else if onreplay}
      <button type="button" onclick={onreplay} title="Play the construction of this canvas again">Replay build</button>
    {/if}
    <label>
      <span class="sr-only">Construction speed</span>
      <select value={construction.speed} onchange={(event) => construction.setSpeed(Number((event.currentTarget as HTMLSelectElement).value))}>
        {#each SPEEDS as speed}<option value={speed}>{speed}×</option>{/each}
      </select>
    </label>
  </div>
{/if}

<style>
  .hand-layer {
    position: absolute;
    inset: 0;
    z-index: 4;
    overflow: hidden;
    pointer-events: none;
  }

  .hand {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: flex;
    align-items: flex-start;
    opacity: 0;
    transition: opacity 220ms ease;
    will-change: transform;
    filter: drop-shadow(0 3px 6px rgb(0 0 0 / 35%));
  }

  .hand.visible {
    opacity: 1;
  }

  .hand svg {
    position: relative;
    transition: transform 140ms ease;
  }

  .hand.pressing svg {
    transform: scale(0.88) translate(1px, 1px);
  }

  /* A small ring of light where the hand presses: the only glow it makes. */
  .press {
    position: absolute;
    inset-block-start: -6px;
    inset-inline-start: -6px;
    inline-size: 16px;
    block-size: 16px;
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 80%, transparent);
    opacity: 0;
    transform: scale(0.4);
    transition: opacity 160ms ease, transform 220ms ease;
  }

  .hand.pressing .press {
    opacity: 1;
    transform: scale(1);
  }

  .caption {
    margin-block-start: 20px;
    margin-inline-start: -2px;
    padding: 3px 8px;
    border-radius: 4px 9px 9px;
    background: var(--color-text);
    color: var(--color-canvas, #000);
    font: 500 11px var(--font-sans, Inter, sans-serif);
    white-space: nowrap;
    max-inline-size: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .construction-controls {
    position: absolute;
    inset-block-start: 60px;
    inset-inline-end: 12px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px 4px 10px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-surface) 92%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-muted);
    font: 11.5px var(--font-sans, Inter, sans-serif);
  }

  .construction-controls button,
  .construction-controls select {
    border: 0;
    border-radius: 999px;
    padding: 3px 9px;
    background: color-mix(in oklab, var(--color-text) 8%, transparent);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }

  .construction-controls button:focus-visible,
  .construction-controls select:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 1px;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .hand {
      display: none;
    }
  }
</style>
