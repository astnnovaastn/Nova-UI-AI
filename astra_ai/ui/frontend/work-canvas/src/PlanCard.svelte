<!--
  AI PLAN: the research's one planning and activity card. The plan the AEGIS lead made (objective,
  execution strategy, assigned agents) stands above the existing activity timeline, which is
  Zephium's own Trail component showing the same recorded lines as before. Nothing is estimated.
-->
<script lang="ts">
  import Trail from "$features/work/components/board/Trail.svelte";
  import type { PlanCardData } from "./plan-card";

  let { item }: { id: string; item: { plan: PlanCardData }; selected?: boolean } = $props();
  const plan = $derived(item.plan);
  const trailItem = $derived({ id: "plan-activity", type: "trail", kind: "Research activity", title: "Research activity", detail: "", status: "", trail: plan.trail, active: plan.live });
  const STATE: Record<string, string> = { done: "Done", running: "Working", assigned: "Assigned", failed: "Failed", skipped: "Skipped", waiting: "Waiting" };
</script>

<article class="plan work-drag-handle" aria-label={plan.heading} data-live={plan.live}>
  <header>
    <span class="title">{plan.heading}</span>
    {#if plan.mode}<span class="chip">{plan.mode}</span>{/if}
  </header>
  {#if plan.objective}
    <section>
      <h4>Research objective</h4>
      <p class="objective">{plan.objective}</p>
    </section>
  {/if}
  {#if plan.strategy || plan.skill}
    <section class="strategy">
      <h4>Execution strategy</h4>
      {#if plan.strategy}<p>{plan.strategy}</p>{/if}
      {#if plan.skill}<p class="skill">Skill: {plan.skill.title}{plan.skill.version ? ` · v${plan.skill.version}` : ""}</p>{/if}
    </section>
  {/if}
  {#if plan.agents.length}
    <section>
      <h4>Assigned agents</h4>
      <ul class="agents">
        {#each plan.agents as agent (agent.role)}
          <li><span class="role">{agent.role}</span><span class="model">{agent.model}</span><span class="state">{STATE[agent.state] ?? agent.state}</span></li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if plan.trail.length}
    <section class="activity">
      <h4>{plan.live ? "Live research activity" : "Research activity"}</h4>
      <Trail item={trailItem as never} />
    </section>
  {/if}
</article>

<style>
  .plan {
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 14px 16px 16px;
    overflow: hidden;
    border-radius: 14px;
    background: var(--color-raised);
    box-shadow: 0 0 0 1px var(--color-border), var(--shadow-float);
    color: var(--color-text);
    font-size: 12.5px;
    cursor: grab;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .chip {
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-muted);
    font-size: 11px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  p {
    margin: 0;
    line-height: 1.45;
  }
  .objective {
    font-size: 13px;
  }
  h4 {
    margin: 0;
    color: var(--color-muted);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .strategy p {
    color: var(--color-muted);
  }
  .strategy .skill {
    color: var(--color-text);
    font-size: 11.5px;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .agents li {
    display: flex;
    gap: 8px;
    font-size: 12px;
  }
  .role {
    flex: 0 0 84px;
  }
  .model {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    color: var(--color-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .state {
    color: var(--color-muted);
    font-size: 11px;
  }
  /* The timeline sits inside the card: it keeps its own lines and gives up its own frame. */
  .activity :global(.trail) {
    padding: 0;
    border-radius: 0;
    background: none;
    box-shadow: none;
  }
</style>
