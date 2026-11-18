<script lang="ts">
  import type { Snippet } from "svelte";
  import { focusWorkLibraryTrigger, type WorkLibraryPanel } from "./canvas-panels";
  import { store } from "./store.svelte";

  let { panel, title, children, headerAction }: {
    panel: WorkLibraryPanel;
    title: string;
    children: Snippet;
    headerAction?: Snippet;
  } = $props();

  function close() {
    store.actions?.openPanel(panel);
    focusWorkLibraryTrigger(panel);
  }
</script>

<aside class="work-library" id={"work-" + panel + "-drawer"} aria-label={title}>
  <header class="rl-head">
    <h2>{title}</h2>
    {@render headerAction?.()}
    <button type="button" class="rl-close" aria-label={"Close " + title.toLowerCase()} title="Close (Esc)" onclick={close}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </header>
  <div class="rl-list">
    <div class="content">
      {@render children()}
    </div>
  </div>
</aside>

<style>
  .work-library {
    --r-panel: var(--color-raised);
    --r-fg: var(--color-text);
    --r-edge: color-mix(in srgb, var(--r-fg) 13%, transparent);
    line-height: 1.45;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 4px 4px;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
</style>
