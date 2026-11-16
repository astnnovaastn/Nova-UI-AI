<script lang="ts">
  import type {EdgeProps} from '@xyflow/svelte';
  import type {VisualSegment} from './routing-plan';
  import type {RelayMember} from './routing-service';
  import {construction} from './construction.svelte';
  let {data}:EdgeProps=$props();
  const segment=$derived(data!.segment as VisualSegment);
  const members=$derived(data!.members as RelayMember[]);
  const selected=$derived(!!data!.highlighted);
  const active=$derived(members.some(m=>m.strand.status==='active'));
  const pending=$derived(members.every(m=>construction.pendingEdge(m.id)));
  const description=$derived(members.length===1?members[0]!.strand.label+' connection':members.length+' connections share this section');
  function inspect(event:Event){event.stopPropagation();window.dispatchEvent(new CustomEvent('aegis-relay-select',{detail:{members}}));}
</script>
{#if !pending}
  <g class="relay-string" class:active class:selected data-relay-segment={segment.id}
    data-source={segment.source} data-target={segment.target} data-members={members.map(m=>m.id).join(' ')}>
    <path class="line" d={segment.geometry.d} pathLength="1" />
    <circle cx={segment.geometry.s.x} cy={segment.geometry.s.y} r="3" />
    <circle cx={segment.geometry.t.x} cy={segment.geometry.t.y} r="3" />
    <path class="hit" d={segment.geometry.d} role="button" tabindex="0" aria-label={description}
      onclick={inspect} onkeydown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(e);}}}><title>{description}</title></path>
  </g>
{/if}
<style>
 .relay-string { --ink:#9299a4; }
 .line { fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;opacity:.85;vector-effect:non-scaling-stroke;pointer-events:none; }
 circle { fill:var(--ink);stroke:var(--color-canvas);stroke-width:1;pointer-events:none; }
 .active { --ink:#a7cdb9; }
 .active .line { stroke-width:1.8;opacity:1;animation:reveal 650ms ease-out; }
 .selected { --ink:#d5e2eb; }
 .selected .line { stroke-width:2;opacity:1; }
 .hit { fill:none;stroke:transparent;stroke-width:14;vector-effect:non-scaling-stroke;pointer-events:stroke;cursor:pointer;outline:none; }
 .hit:focus-visible {stroke:color-mix(in oklab,var(--color-text) 15%,transparent);}
 @keyframes reveal {from{stroke-dasharray:1 1;stroke-dashoffset:1;}to{stroke-dasharray:1 1;stroke-dashoffset:0;}}
 @media(prefers-reduced-motion:reduce){.active .line{animation:none;}}
</style>
