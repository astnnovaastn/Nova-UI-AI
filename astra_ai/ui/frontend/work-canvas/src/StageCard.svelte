<!--
  A container of real processing stages: the Evidence processing pipeline (modules in a row, joined
  left to right) or Collect all results (modules one above the other). Every module and number is
  from the run's own events (stage-cards.ts).
-->
<script lang="ts">
  import type { StageCardData } from "./stage-cards";

  let { item }: { id: string; item: { stages: StageCardData }; selected?: boolean } = $props();
  const data = $derived(item.stages);
</script>

<article class="stages work-drag-handle" data-kind={data.kind} aria-label={data.title}>
  <h3>{data.title}</h3>
  <ol class:column={data.kind === "compile"}>
    {#each data.modules as module, index (module.key)}
      <li data-state={module.state} data-module={module.key}>
        <strong>{module.title}</strong>
        {#each module.facts as fact}<span>{fact}</span>{/each}
        {#if data.kind === "pipeline" && index < data.modules.length - 1}<i class="next" aria-hidden="true"></i>{/if}
      </li>
    {/each}
  </ol>
</article>

<style>
  .stages {
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 12px 14px 14px;
    border-radius: 14px;
    background: color-mix(in oklab, var(--color-raised) 70%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-text);
    font-size: 12px;
    cursor: grab;
  }
  h3 {
    margin: 0;
    font-size: 13.5px;
    font-weight: 650;
  }
  ol {
    display: flex;
    flex: 1;
    gap: 22px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  ol.column {
    flex-direction: column;
    gap: 12px;
  }
  li {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-inline-size: 0;
    padding: 9px 11px;
    border-radius: 10px;
    background: var(--color-raised);
    box-shadow: 0 0 0 1px var(--color-border);
  }
  li strong {
    font-weight: 600;
  }
  li span {
    color: var(--color-muted);
    line-height: 1.4;
  }
  li[data-state="running"] {
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 60%, transparent);
  }
  li[data-state="failed"] {
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--aegis-status-failed, #f0605a) 60%, transparent);
  }
  /* The step to the next module: a short white string with its glint, as between cards. */
  .next {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 100%;
    inline-size: 22px;
    block-size: 1.3px;
    background: color-mix(in oklab, var(--color-text) 48%, transparent);
  }
  .next::after {
    content: "";
    position: absolute;
    inset-block-start: -1.6px;
    inset-inline-end: -1px;
    inline-size: 4px;
    block-size: 4px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-text) 92%, transparent);
  }
</style>
