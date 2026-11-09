<!-- One node of a knowledge map or blueprint: a real canvas card, with the node toolbar. -->
<script lang="ts">
  import type { MapNode } from "./work-run";
  import StatusDot from "./StatusDot.svelte";
  import { mapNodeStatus } from "./status";

  let { item }: { id: string; item: { node: MapNode }; selected?: boolean } = $props();
  const node = $derived(item.node);
  const KINDS: Record<string, string> = { service: "Service", concept: "Concept", data: "Data", actor: "Actor", process: "Process", decision: "Decision", risk: "Risk" };
</script>

<article class="blueprint work-drag-handle" data-kind={node.kind} aria-label={node.title}>
  <header>
    <span class="kind"><StatusDot status={mapNodeStatus(node.source_ids)} label={node.source_ids.length ? "Supported by sources" : "No source cited: needs review"} /> {KINDS[node.kind] ?? node.kind}</span>
    {#if node.source_ids.length}<span class="cites" title="Sources cited">{node.source_ids.join(", ")}</span>{/if}
  </header>
  <strong>{node.title}</strong>
  <p>{node.summary}</p>
</article>

<style>
  .blueprint {
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 10px 12px;
    overflow: hidden;
    border-radius: 10px;
    background: var(--color-float);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-text);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: var(--color-muted);
    font-size: 10.5px;
    letter-spacing: 0.02em;
  }

  .cites {
    overflow: hidden;
    color: var(--color-faint);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--color-label-secondary, var(--color-muted));
    font-size: 11.5px;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  [data-kind="risk"] .kind {
    color: var(--color-danger);
  }
</style>
