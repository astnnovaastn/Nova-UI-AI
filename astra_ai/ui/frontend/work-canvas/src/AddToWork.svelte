<!--
  V33: "Add to Work" for the page shown in a browser tab (work-intake.svelte.ts). It names where the page
  goes, says when the page is already there, and with no session open sends the person to the library.
-->
<script lang="ts">
  import type { BrowserTab } from "./browser-tabs.svelte";
  import { workIntake } from "./work-intake.svelte";

  let { tab }: { tab: BrowserTab | null } = $props();
  const web = $derived(Boolean(tab?.url && /^https?:\/\//.test(tab.url)));
  const destination = $derived(workIntake.destination);
  const added = $derived(Boolean(tab?.url && workIntake.isAdded(tab.url)));
  const status = $derived(tab && workIntake.status.tab === tab.id ? workIntake.status : null);
  const short = (text: string) => (text.length > 26 ? text.slice(0, 25) + "…" : text);
</script>

{#if web}
  <div class="add-work" data-added={added}>
    <button
      type="button"
      class="add"
      disabled={added || status?.kind === "adding"}
      title={destination ? `Add this page to ${destination.title}` : "Choose a Work session for this page"}
      onclick={() => workIntake.add(tab)}
    >
      {#if added}In {destination ? short(destination.title) : "this Work"}{:else if status?.kind === "adding"}Adding…{:else}Add to Work{/if}
    </button>
    {#if status && status.kind !== "idle" && status.kind !== "adding"}
      <p class="note" role="status" data-kind={status.kind}>{status.text}</p>
    {/if}
  </div>
{/if}

<style>
  .add-work {
    display: grid;
    gap: 4px;
    margin: 2px 10px 6px;
  }
  .add {
    width: 100%;
    min-height: 30px;
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.12));
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12.5px;
    text-align: left;
    padding: 5px 10px;
    cursor: pointer;
  }
  .add:hover:not(:disabled) {
    background: var(--color-control, rgba(255, 255, 255, 0.06));
  }
  .add:disabled {
    cursor: default;
    opacity: 0.75;
  }
  .add:focus-visible {
    outline: 2px solid var(--color-ring, #9cc3ff);
    outline-offset: 2px;
  }
  .note {
    margin: 0;
    font-size: 11.5px;
    color: var(--color-muted, #a3a3a8);
  }
  .note[data-kind="failed"] {
    color: var(--color-danger, #f08a8a);
  }
</style>
