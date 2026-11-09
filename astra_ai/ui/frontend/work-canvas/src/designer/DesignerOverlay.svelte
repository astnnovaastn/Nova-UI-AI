<script lang="ts">
 import type {Designer} from './coordinator';
 let {designer,version=0}:{designer:Designer;version?:number}=$props();
 const snapshot=$derived((version,designer.api.snapshot()));
 const plan=$derived((version,designer.plan));
 const cursors=$derived((version,designer.cursors));
 const preview=$derived((version,designer.phase==='preview'));
 const point=(x:number,y:number)=>({x:x*snapshot.viewport.zoom+snapshot.viewport.x,y:y*snapshot.viewport.zoom+snapshot.viewport.y});
 const groups=$derived(preview?plan?.geometry.groups??[]:designer.record.groups);
</script>
<div class="designer-overlay" aria-hidden="true">
 <svg class="preview">
  {#each cursors as cursor}
   {@const node=snapshot.nodes.find(n=>n.id===cursor.target)}
   {#if node}
    {@const p=point(node.x,node.y)}
    <rect x={p.x-3} y={p.y-3} width={node.width*snapshot.viewport.zoom+6} height={node.height*snapshot.viewport.zoom+6} rx="10" class="active-card"/>
   {/if}
  {/each}
  {#each groups as group}
   {@const p=point(group.x,group.y)}
   <rect x={p.x} y={p.y} width={group.width*snapshot.viewport.zoom} height={group.height*snapshot.viewport.zoom} rx="12" class="group"/>
   <text x={p.x+12} y={p.y+18}>{group.title}</text>
  {/each}
  {#if preview&&plan}
   {#each plan.routes as edge}
    {#if plan.geometry.positions[edge.source]&&plan.geometry.positions[edge.target]}
     {@const a=point(plan.geometry.positions[edge.source].x+plan.geometry.sizes[edge.source].width/2,plan.geometry.positions[edge.source].y+plan.geometry.sizes[edge.source].height/2)}
     {@const b=point(plan.geometry.positions[edge.target].x+plan.geometry.sizes[edge.target].width/2,plan.geometry.positions[edge.target].y+plan.geometry.sizes[edge.target].height/2)}
     <path d={"M"+a.x+","+a.y+" L"+b.x+","+b.y} class="route"/>
    {/if}
   {/each}
   {#each plan.order as id}
    {@const p=point(plan.geometry.positions[id].x,plan.geometry.positions[id].y)}
    <rect x={p.x} y={p.y} width={plan.geometry.sizes[id].width*snapshot.viewport.zoom} height={plan.geometry.sizes[id].height*snapshot.viewport.zoom} rx="9" class="target"/>
   {/each}
  {/if}
 </svg>
 {#each cursors as cursor,i}
  {@const p=point(cursor.x,cursor.y)}
  <div class="cursor" class:second={i===1} data-phase={cursor.phase} style:transform={"translate("+p.x+"px,"+p.y+"px)"}>
   <svg width="20" height="24" viewBox="0 0 20 24"><path d="M2 1L17 14L10 15L7 22Z" fill="currentColor" stroke="var(--color-canvas)" stroke-width="1.5"/></svg>
   <span>{cursor.label}</span>
  </div>
 {/each}
</div>
<style>
 .designer-overlay{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden}
 .preview{position:absolute;width:100%;height:100%;overflow:hidden}.group{fill:none;stroke:color-mix(in srgb,var(--color-text) 25%,transparent);stroke-width:1}.target{fill:color-mix(in srgb,var(--color-text) 4%,transparent);stroke:var(--color-text);stroke-dasharray:6 5}.route{fill:none;stroke:var(--color-muted);stroke-dasharray:3 5}
 .active-card{fill:none;stroke:var(--color-text);stroke-width:1.5;opacity:.65}
 text{fill:var(--color-muted);font:11px var(--font-sans)}
 .cursor{position:absolute;top:0;left:0;display:flex;align-items:flex-start;color:var(--color-text);will-change:transform}
 .cursor span{margin-top:18px;margin-left:-3px;padding:4px 7px;background:var(--color-text);color:var(--color-canvas);border-radius:4px 9px 9px 9px;font:11px var(--font-sans);white-space:nowrap;box-shadow:0 2px 8px #0002}
 .cursor.second{opacity:.8}.cursor[data-phase="grab"] svg{filter:drop-shadow(0 0 3px color-mix(in srgb,var(--color-text) 45%,transparent))}
 @media(prefers-reduced-motion:reduce){.cursor{display:none}}
</style>
