<script lang="ts">
 import RequestLift from '$features/work/components/lift/RequestLift.svelte';
 import type {WorkspaceObject} from './registry';
 let {object,focused=false,onmade}:{object:WorkspaceObject;focused?:boolean;onmade?:(id:string)=>void}=$props();
 const activity=$derived(object.requestActivity!);
 const trail=$derived(activity.steps.map(s=>({key:s.id,icon:s.kind,text:s.title,detail:s.detail,live:s.kind==='live'})));
</script>
{#if focused}
 <RequestLift request={object.title} {trail} runs={[]} made={activity.made} onsource={()=>{}} onmade={id=>onmade?.(id)} publicMeta={`${activity.state} · ${activity.steps.length} steps`} publicSteps={activity.steps.map(s=>({key:s.id,what:s.title,where:s.detail,glyph:s.kind==='live'?'said':s.kind,live:s.kind==='live'}))}/>
{:else}
 <section class="activity" aria-label={object.title}><p>Request · {activity.state}</p><h2>{object.title}</h2><span>{activity.steps.length} recorded steps · {activity.made.length} results</span><button class="nodrag nopan" onclick={()=>window.dispatchEvent(new CustomEvent('aegis-object-open',{detail:{object}}))}>What it did</button></section>
{/if}
<style>.activity{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:0;color:var(--color-text);font-family:var(--font-sans)}h2{font-size:24px;line-height:1.3;margin:0}p,span{font-size:14px;color:var(--color-muted);margin:0}button{font:600 13px var(--font-sans);padding:7px 12px;border:0;border-radius:12px;background:var(--color-control);color:var(--color-text);cursor:pointer}button:focus-visible{outline:2px solid var(--color-ring);outline-offset:3px}</style>
