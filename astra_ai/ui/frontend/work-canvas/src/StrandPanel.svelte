<!-- What a selected string means: each relation it carries, the recorded event that made it, and its evidence. -->
<script lang="ts">
  import { MEANING, STATUS_WORDS, type StrandData } from "./relations";

  let { strand, from, to, onclose, onsource }: { strand: StrandData; from: string; to: string; onclose: () => void; onsource: (url: string) => void } = $props();
  const when = (seconds: number) => (seconds ? new Date(seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "");
  const count = (detail: Record<string, unknown>) =>
    Object.entries(detail)
      .filter(([, value]) => typeof value === "number" || typeof value === "string")
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(" · ");
</script>

<aside class="strand-panel" aria-label="Connection details" data-construction-control>
  <header>
    <div>
      <p class="kicker">{strand.relations.length === 1 ? "Connection" : `${strand.relations.length} connections`} · {STATUS_WORDS[strand.status]}</p>
      <h3>{from} <span aria-hidden="true">→</span><span class="sr-only">to</span> {to}</h3>
    </div>
    <button type="button" onclick={onclose} aria-label="Close connection details">×</button>
  </header>
  <ol>
    {#each strand.relations as row (row.id)}
      <li data-status={row.status}>
        <strong>{row.label || row.type}</strong>
        <span class="state">{STATUS_WORDS[row.status]}</span>
        <p>{MEANING[row.type]}{row.note ? ": " + row.note : ""}</p>
        <p class="meta">
          {row.source} → {row.target}{row.event_seq ? ` · recorded by event #${row.event_seq}` : ""}{row.at ? ` at ${when(row.at)}` : ""}
          {#if count(row.detail)}<br />{count(row.detail)}{/if}
        </p>
        {#if row.url}
          <button type="button" class="source" onclick={() => onsource(row.url)}>{row.evidence_id ? row.evidence_id + " · " : ""}Open source</button>
        {/if}
      </li>
    {/each}
  </ol>
</aside>

<style>
  .strand-panel {
    position: absolute;
    inset-block-start: 56px;
    inset-inline-end: 12px;
    z-index: 6;
    inline-size: min(340px, calc(100% - 24px));
    max-block-size: calc(100% - 140px);
    overflow: auto;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: inset 0 0 0 1px var(--color-border), 0 12px 32px rgb(0 0 0 / 28%);
    color: var(--color-text);
    font: 12.5px/1.45 var(--font-sans, Inter, sans-serif);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  h3 {
    margin: 2px 0 0;
    font-size: 13.5px;
    font-weight: 600;
  }

  .kicker,
  .meta,
  .state {
    color: var(--color-muted);
    font-size: 11px;
  }

  .kicker {
    margin: 0;
  }

  header button {
    border: 0;
    background: none;
    color: var(--color-muted);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  ol {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 8px 0;
    border-block-start: 1px solid var(--color-border);
  }

  li strong {
    margin-inline-end: 6px;
  }

  li[data-status="failed"] .state {
    color: var(--aegis-status-failed, #f0605a);
  }

  li[data-status="contested"] .state {
    color: var(--aegis-status-waiting, #e2a336);
  }

  li[data-status="verified"] .state,
  li[data-status="active"] .state {
    color: var(--aegis-strand-green, #3fdc84);
  }

  p {
    margin: 3px 0 0;
    overflow-wrap: anywhere;
  }

  .source {
    margin-block-start: 6px;
    padding: 3px 9px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-text) 9%, transparent);
    color: var(--color-text);
    font: inherit;
    font-size: 11.5px;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 1px;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
