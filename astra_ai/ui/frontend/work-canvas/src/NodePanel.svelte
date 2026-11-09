<!--
  What Open shows for a request, an agent or a map node. Zephium's Lift and RequestLift hold a
  request's details (MPL-2.0); agents and map nodes use the same sections. All of it comes from the
  recorded run, so a failed run shows what it did and why it stopped, and nothing more.
-->
<script lang="ts">
  import type { WorkExecutionFact } from "$shared/ipc/bindings";
  import Lift from "$features/work/components/Lift.svelte";
  import LiftHeader from "$features/work/components/LiftHeader.svelte";
  import LiftRow from "$features/work/components/lift/LiftRow.svelte";
  import LiftSection from "$features/work/components/lift/LiftSection.svelte";
  import RequestLift from "$features/work/components/lift/RequestLift.svelte";
  import type { TrailLine } from "$features/work/lib/board/trail";
  import type { ObjectKind } from "$features/work/lib/board/types";
  import { agentStateWords, type AgentBranch, type MapNode, type WorkRun } from "./work-run";

  export type Opened =
    | { kind: "request"; id: string; title: string }
    | { kind: "agent"; id: string; agent: AgentBranch }
    | { kind: "map"; id: string; node: MapNode };

  let {
    opened,
    bounds,
    trail,
    runs,
    made,
    run,
    onsource,
    onmade,
    onclose,
  }: {
    opened: Opened;
    bounds: DOMRect;
    trail: readonly TrailLine[];
    runs: readonly WorkExecutionFact[];
    made: readonly { id: string; title: string; kind: ObjectKind }[];
    run: WorkRun | null | undefined;
    onsource: (url: string) => void;
    onmade: (id: string) => void;
    onclose: () => void;
  } = $props();

  const title = $derived(opened.kind === "request" ? opened.title : opened.kind === "agent" ? opened.agent.title : opened.node.title);
  const cited = $derived(opened.kind === "map" ? (run?.evidence ?? []).filter((row) => opened.node.source_ids.includes(row.id)) : []);
</script>

<Lift origin={null} source={opened.id} {bounds} {title} {onclose} preferred={{ width: 640, height: 640 }}>
  {#if opened.kind === "request"}
    <RequestLift request={opened.title} {trail} {runs} {made} onsource={(row) => row.url && onsource(row.url)} {onmade} />
  {:else if opened.kind === "agent"}
    {@const agent = opened.agent}
    <div class="sections">
      <LiftHeader kind={agent.role === "lead" ? "Lead" : "Specialist"} title={agent.title} meta={[agentStateWords(agent.state), agent.model, agent.tokens ? `${agent.tokens.toLocaleString("en")} tokens` : "", agent.seconds ? `${agent.seconds.toFixed(1)}s` : ""].filter(Boolean).join(" · ")} whole />
      {#if agent.task}<LiftSection title="Assigned"><p>{agent.task}</p></LiftSection>{/if}
      {#if agent.summary}<LiftSection title="Reported"><p>{agent.summary}</p></LiftSection>{/if}
      {#if agent.failure}<LiftSection title="Why it stopped"><p class="failure">{agent.failure.replace(/_/g, " ")}</p></LiftSection>{/if}
      {#if agent.activity.length}
        <LiftSection title="Step by step" count={agent.activity.length}>
          {#each agent.activity as row (row.key)}
            <LiftRow title={row.text} detail={row.detail} wrap tone={row.state === "failed" ? "failed" : row.state === "running" ? "live" : "plain"} />
          {/each}
        </LiftSection>
      {/if}
    </div>
  {:else}
    <div class="sections">
      <LiftHeader kind={opened.node.kind} title={opened.node.title} whole />
      <p>{opened.node.summary}</p>
      {#if cited.length}
        <LiftSection title="Sources" count={cited.length}>
          {#each cited as row (row.id)}
            <LiftRow title={row.title} detail={row.domain} onclick={() => onsource(row.url)} />
          {/each}
        </LiftSection>
      {:else}<p class="quiet">No source was cited for this node.</p>{/if}
    </div>
  {/if}
</Lift>

<style>
  .sections {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  p {
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-body);
    line-height: 1.5;
  }

  .failure {
    color: var(--color-danger);
  }

  .quiet {
    color: var(--color-muted);
  }
</style>
