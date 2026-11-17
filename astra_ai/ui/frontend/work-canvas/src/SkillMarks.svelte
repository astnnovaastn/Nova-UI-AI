<script lang="ts">
  import InputMark from "$features/work/components/run/InputMark.svelte";
  import type { CanvasItem } from "$features/work/lib/canvas-model";
  import { branch, roundedPath } from "$features/work/lib/run/lines";

  import type { LoadedSkill } from "./work-run";

  let { skills }: { skills: readonly LoadedSkill[] } = $props();
  const connections = $derived(branch({x:56, y:(skills.length * 48 - 12) / 2}, 28, skills.map((_, index) => ({x:0, y:index * 48 + 18}))).map(points => roundedPath(points)));
  let selected = $state<LoadedSkill>();
  let details: HTMLDivElement;
  let left = $state(0);
  let top = $state(0);

  function inspect(skill: LoadedSkill, event: MouseEvent) {
    event.stopPropagation();
    if (details.matches(":popover-open") && selected?.name === skill.name) {
      details.hidePopover();
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    left = Math.max(10, Math.min(rect.left, window.innerWidth - 290));
    top = Math.max(10, Math.min(rect.bottom + 8, window.innerHeight - 244));
    selected = skill;
    details.showPopover();
  }
</script>

<div class="skill-marks" aria-label="Loaded Skills" style:--skill-height={Math.max(36, skills.length * 48 - 12) + "px"}>
  <svg class="skill-strings" viewBox={"0 0 56 " + Math.max(36, skills.length * 48 - 12)} aria-hidden="true">
    {#each connections as d}<path {d} />{/each}
  </svg>
  {#each skills as skill (skill.name)}
    <button type="button" class="skill nodrag nopan" data-skill-id={skill.name}
      title={skill.title} aria-label={skill.title + " Skill"} aria-haspopup="dialog"
      onclick={(event) => inspect(skill, event)}>
      <InputMark item={{ input: { kind: "skill", label: skill.title, lit: true } } as CanvasItem} />
    </button>
  {/each}
</div>
<div class="skill-details" bind:this={details} popover="auto" role="dialog" aria-label={selected?.title ?? "Skill"}
  style:left={left + "px"} style:top={top + "px"}>
  {#if selected}
    <header><strong>{selected.title}</strong><span>{selected.status === "loaded" ? "Loaded" : "Recorded"}</span></header>
    {#if selected.description}<p>{selected.description}</p>{/if}
    <p>{selected.chosen === "workflow" ? "Selected with the workflow." : selected.chosen === "matched" ? "Matched to the research request." : "Recorded for this run."}</p>
    {#if selected.workflow}<p>Workflow <strong>{selected.workflow.replaceAll("-", " ")}</strong></p>{/if}
    {#if selected.tools?.length}<p>Tools <strong>{selected.tools.map((tool) => tool.replaceAll("_", " ")).join(", ")}</strong></p>{/if}
  {/if}
</div>

<style>
  .skill-marks { position: absolute; inset-inline-end: calc(100% + 56px); inset-block-start: 36px; transform: translateY(-50%); display: grid; grid-auto-rows: 36px; gap: 12px; width: 200px; height: var(--skill-height); }
  .skill { display: block; width: 200px; height: 36px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
  .skill:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 3px; border-radius: var(--radius-inset); }
  .skill-strings { position: absolute; left: 100%; top: 0; width: 56px; height: var(--skill-height); overflow: visible; pointer-events: none; }
  .skill-strings path { fill: none; stroke: var(--color-border); stroke-width: 1.2; stroke-linecap: round; }
  .skill-details { position: fixed; inset: auto; margin: 0; width: min(270px, calc(100vw - 20px)); box-sizing: border-box; padding: 12px; border: 1px solid #464950; border-radius: 10px; background: #252629; color: #e7e7ea; }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  header span { color: #b0c8b7; font-size: 11px; }
  p { color: #c3c4ca; font-size: 12px; line-height: 1.4; margin: 8px 0 0; }
</style>
