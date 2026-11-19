<script lang="ts">
  /*
   * V31: the Focus card opened from the new tab's figure, after Zephium's FocusCard (frame/src/features/
   * time/components/FocusCard.svelte, MPL-2.0): start a session of rounds with or without breaks, see the
   * running phase count down, skip a phase or stop. The countdown ticks once a second only while this card
   * is open; the session itself is kept by focus.svelte.ts.
   */
  import { onMount } from "svelte";
  import { focusSpan } from "$features/newtab/lib/clock";
  import { browserSettings } from "./browser-settings.svelte";
  import { breakMinutes, focus, progress, remaining } from "./focus.svelte";

  let { onclose }: { onclose: () => void } = $props();
  let now = $state(Date.now());
  let minutes = $state(browserSettings.value.focus.minutes);
  let breaks = $state(true);
  const session = $derived(focus.session);
  const left = $derived(session ? remaining(session, now) : 0);
  const clock = $derived(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`);
  const pause = $derived(breakMinutes(minutes));
  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });
</script>

<div class="card" role="dialog" aria-label="Focus">
  <header><h2>Focus</h2><button type="button" class="close" aria-label="Close focus" onclick={onclose}>×</button></header>
  {#if session}
    <p class="phase">{session.phase === "focus" ? `Round ${session.rounds + 1}` : session.phase === "long_break" ? "Long break" : "Break"}</p>
    <p class="clock" aria-live="polite">{clock}</p>
    <div class="bar"><span style:transform={`scaleX(${progress(session, now)})`}></span></div>
    <div class="row">
      <button type="button" class="pill" onclick={() => focus.skip()}>{session.phase === "focus" ? "Finish round" : "Skip break"}</button>
      <button type="button" class="pill" onclick={() => focus.stop()}>End session</button>
    </div>
  {:else}
    <div class="lengths" role="radiogroup" aria-label="Round length">
      {#each [25, 50, 90] as length (length)}
        <button type="button" role="radio" aria-checked={minutes === length} onclick={() => (minutes = length)}>{length} min</button>
      {/each}
    </div>
    <label class="check"><input type="checkbox" bind:checked={breaks} /> Breaks ({pause.short} min, {pause.long} min after every fourth round)</label>
    <button type="button" class="start" onclick={() => focus.start(minutes, breaks)}>Start focusing</button>
  {/if}
  <p class="today">Today: {focusSpan(focus.today(now) / 60)} of {focusSpan(browserSettings.value.focus.goal)}{browserSettings.value.focus.holdSites ? ` · ${browserSettings.value.focus.sites.length} sites held back during rounds` : ""}</p>
</div>

<style>
  .card { position: absolute; z-index: 30; inset-block-end: 64px; inset-inline-start: 50%; translate: -50% 0; inline-size: min(340px, calc(100% - 32px)); padding: 16px 18px; border: 1px solid var(--color-border); border-radius: 18px; background: var(--color-raised, #222326); box-shadow: 0 16px 40px #0007; color: var(--color-text); font-family: var(--font-sans); }
  header { display: flex; align-items: center; justify-content: space-between; }
  h2 { margin: 0; font-size: 14px; }
  .close { border: 0; background: none; color: var(--color-muted); font-size: 18px; cursor: pointer; }
  .phase { margin: 12px 0 0; color: var(--color-muted); font-size: 12px; }
  .clock { margin: 2px 0 10px; font-size: 40px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .bar { block-size: 3px; border-radius: 2px; overflow: hidden; background: color-mix(in oklab, var(--color-text) 14%, transparent); }
  .bar span { display: block; block-size: 100%; transform-origin: left; background: #ff8a3d; }
  .row, .lengths { display: flex; gap: 8px; margin: 14px 0 0; }
  .pill, .lengths button { padding: 7px 14px; border: 1px solid var(--color-border); border-radius: 999px; background: none; color: var(--color-text); font: 600 12px var(--font-sans); cursor: pointer; }
  .lengths [aria-checked="true"] { background: var(--color-text); color: var(--color-raised, #222326); }
  .check { display: flex; align-items: center; gap: 8px; margin: 12px 0; font-size: 12px; color: var(--color-muted); }
  .start { inline-size: 100%; padding: 9px; border: 0; border-radius: 999px; background: #ff8a3d; color: #1b1b1b; font: 600 13px var(--font-sans); cursor: pointer; }
  .today { margin: 12px 0 0; color: var(--color-muted); font-size: 12px; }
  button:focus-visible { outline: 2px solid var(--color-text); outline-offset: 1px; }
</style>
