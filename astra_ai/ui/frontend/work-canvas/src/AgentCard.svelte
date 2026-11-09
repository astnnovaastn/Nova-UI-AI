<!-- One worker or the lead on the canvas, showing only what the backend recorded for it. -->
<script lang="ts">
  import { agentStateWords, type AgentBranch } from "./work-run";
  import StatusDot from "./StatusDot.svelte";
  import { agentStatus } from "./status";

  let { item }: { id: string; item: { branch: AgentBranch }; selected?: boolean } = $props();
  const agent = $derived(item.branch);
  const latest = $derived(agent.activity.at(-1));
  const facts = $derived(
    [agent.tokens ? `${agent.tokens.toLocaleString("en")} tokens` : "", agent.seconds ? `${agent.seconds.toFixed(1)}s` : ""].filter(Boolean).join(" · "),
  );
</script>

<article class="agent work-drag-handle" data-state={agent.state} data-agent={agent.agent}>
  <header>
    <StatusDot status={agentStatus(agent.state)} label={agentStateWords(agent.state)} />
    <strong>{agent.title}</strong>
    <span class="state">{agentStateWords(agent.state)}</span>
  </header>
  {#if agent.model}<p class="model">{agent.model}{#if agent.fellBackFrom} · stepped in for {agent.fellBackFrom.replace("_", " ")}{/if}</p>{/if}
  <p class="task">{agent.summary || agent.task || latest?.text || ""}</p>
  {#if agent.failure && agent.state === "failed"}<p class="failure">{agent.failure.replace(/_/g, " ")}</p>
  {:else if latest && agent.state === "running"}<p class="now">{latest.text}</p>{/if}
  {#if facts}<footer>{facts}</footer>{/if}
</article>

<style>
  .agent {
    display: flex;
    flex-direction: column;
    gap: 5px;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 12px 14px;
    overflow: hidden;
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-text);
    font-size: 12.5px;
    line-height: 1.4;
  }

  header {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  strong {
    flex: 1;
    min-inline-size: 0;
    font-size: 13.5px;
    font-weight: 600;
  }


  .state {
    color: var(--color-muted);
    font-size: 11.5px;
  }


  [data-state="running"] {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent, #6aa8ff) 55%, transparent);
  }


  [data-state="failed"] .state,
  .failure {
    background-color: transparent;
    color: var(--color-danger);
  }


  p {
    margin: 0;
  }

  .model,
  footer {
    color: var(--color-faint);
    font-size: 11px;
  }

  .task {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-label-secondary, var(--color-muted));
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .now {
    overflow: hidden;
    color: var(--color-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  footer {
    margin-block-start: auto;
    font-variant-numeric: tabular-nums;
  }

  @keyframes pulse {
    50% {
      opacity: 0.35;
    }
  }

</style>
