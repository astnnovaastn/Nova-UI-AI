<!-- The box around one group of a knowledge map, drawn behind its cards. -->
<script lang="ts">
  let { item }: { item: { title: string } } = $props();
</script>

<div class="group work-drag-handle">
  {#if item.title}<span>{item.title}</span>{/if}
</div>

<style>
  .group {
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 12px 22px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--color-text) 3%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-muted);
    font-size: 12.5px;
    font-weight: 600;
  }
</style>
