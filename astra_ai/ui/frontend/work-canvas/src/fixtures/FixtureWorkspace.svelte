<script lang="ts">
 import WorkCanvas from '$features/work/components/WorkCanvas.svelte';
 import {FAMILIES,isFamily,type FamilyId} from '../designer/families';
 import {workspaceFixture} from './workspaces';
 import ObjectFocus from '../objects/ObjectFocus.svelte';
 import GoogleConnections from '../GoogleConnections.svelte';
 import {fakeGoogleApi} from './google';
 import SourceStackFixture from './SourceStackFixture.svelte';
 import type {CanvasDesignerApi} from '../designer/types';
 import {pointerTool,setPointerTool} from '$features/work/lib/pointer-tool.svelte';
 const query=new URLSearchParams(location.search);
 let family=$state<FamilyId>(isFamily(query.get('aegisFixture')||'')?query.get('aegisFixture') as FamilyId:'mixed-result');
 let count=$state(Math.max(2,Math.min(100,Number(query.get('count'))||8))),api:CanvasDesignerApi|undefined;
 let message=$state('Local simulation · no AI, search or account calls');
 const fixture=$derived(workspaceFixture(family,count));
 const bounds=$derived.by(()=>{const entries=Object.entries(fixture.plan.geometry.positions),x=Math.min(...entries.map(([,p])=>p.x)),y=Math.min(...entries.map(([,p])=>p.y));return {x,y,width:Math.max(...entries.map(([id,p])=>p.x+fixture.plan.geometry.sizes[id].width))-x};});
 function open(id:string){const item=fixture.items.find(o=>o.id===id);if(item)window.dispatchEvent(new CustomEvent('aegis-object-open',{detail:{object:item.aegisObject}}));}
</script>
<div class="fixture-workspace" data-v20-fixture={family}>
 <header><div><strong>AEGIS Work</strong><span>{message}</span></div><button aria-pressed={pointerTool()==='select'} onclick={()=>setPointerTool(pointerTool()==='select'?'hand':'select')}>Select / move cards</button><label>Design<select bind:value={family}>{#each FAMILIES as [id,label]}<option value={id}>{label}</option>{/each}</select></label><label>Objects<select bind:value={count}>{#each [5,8,20,50,100] as n}<option value={n}>{n}</option>{/each}</select></label><button onclick={()=>{if(api)api.setGeometry(fixture.plan.geometry);}}>Reset fixture</button></header>
 <div class="canvas">{#key family+':'+count}<WorkCanvas items={fixture.items as any} links={fixture.links as any} authoritative={new Set()} initialView={{positions:fixture.plan.geometry.positions,sizes:fixture.plan.geometry.sizes}} home={bounds} oninspect={()=>{}} onopen={open} onaction={open} onselectionaction={(action,ids)=>{if(action==='ask')message='Simulation: a contextual question would include '+ids.length+' selected objects.';else if(action==='remove')message='Simulation: selection retained for repeatable tests.';else message='Selected '+ids.length+' objects for the next instruction.';}} expose={exposed=>{api=exposed.designer;}}/>{/key}</div>
 <ObjectFocus onask={object=>message='Simulation: ask about '+object.title}/>
 {#if query.get('panel')==='stack'}<SourceStackFixture />{/if}
 {#if query.get('panel')==='google'}<aside class="fixture-account"><strong>Simulated account · no Google connection</strong><GoogleConnections api={fakeGoogleApi} onAttach={item=>message='Fixture selected: '+item.title}/></aside>{/if}
</div>
<style>.fixture-workspace{position:fixed;inset:0;background:var(--color-canvas);color:var(--color-text);font-family:var(--font-sans);display:flex;flex-direction:column}header{display:flex;gap:16px;align-items:center;padding:16px 24px;border-bottom:1px solid var(--color-border);z-index:5;background:var(--color-canvas)}header>div{margin-right:auto;display:flex;flex-direction:column;gap:5px}strong{font-size:16px}span,label{font-size:11px;color:var(--color-muted)}label{display:flex;flex-direction:column;gap:5px}select,button{background:var(--color-surface);color:var(--color-text);border:1px solid var(--color-border);padding:9px 12px;border-radius:9px;font:12px var(--font-sans)}button{cursor:pointer}.canvas{flex:1;min-height:0;position:relative}:global(.fixture-workspace .svelte-flow){background:var(--color-canvas)}@media(max-width:700px){header{padding:10px;gap:8px;flex-wrap:wrap}header>div{width:100%}select{max-width:210px}}.fixture-account{position:absolute;right:24px;top:100px;bottom:24px;width:340px;max-width:calc(100vw - 48px);padding:20px;overflow:auto;background:var(--color-raised);border:1px solid var(--color-border);border-radius:16px;z-index:10}</style>
