<script lang="ts">
 import {onMount,getContext} from 'svelte';
 import {routingContext,type RoutingSnapshot} from '../routing-service';
 const routing=getContext<(()=>RoutingSnapshot)|undefined>(routingContext);
 import ObjectView from '$features/work/components/objects/ObjectView.svelte';
 import LegacyWorkspaceObject from './LegacyWorkspaceObject.svelte';
 import {zephiumObject} from './zephium-object';
 import {safeUrl,type WorkspaceObject} from './registry';
 import {workApi} from '../work-panels.svelte';
 let {object,detail='full',focused=false}:{object:WorkspaceObject;detail?:'compact'|'summary'|'full';focused?:boolean}=$props();
 function contentGeometry(surface:HTMLElement){
  if(focused||!routing)return;
  let frame=0;
  const measure=()=>{frame=0;const node=surface.closest<HTMLElement>('.svelte-flow__node');const content=surface.firstElementChild as HTMLElement|null;if(!node?.dataset.id||!content)return;
   // Unscaled offsets: camera transforms never invalidate these measurements.
   let x=0,y=0,el:HTMLElement|null=surface;while(el&&el!==node){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent as HTMLElement|null;}
   if(el!==node)return;
   const width=Math.min(node.offsetWidth-x,content.offsetWidth),height=Math.min(node.offsetHeight-y,content.offsetHeight);
   if(width>0&&height>0)routing?.().measureContent(node.dataset.id,{x,y,width,height});
  };
  const queue=()=>{frame ||= requestAnimationFrame(measure);};const observer=new ResizeObserver(queue);
  observer.observe(surface);queue();
  return {destroy(){cancelAnimationFrame(frame);observer.disconnect();}};
 }
 const drawn=$derived(zephiumObject(object));
 onMount(()=>{const save=(event:Event)=>{const d=(event as CustomEvent).detail;if(d?.id===object.id&&!focused)void saveNote(d.action);};window.addEventListener('aegis-object-save',save);return()=>window.removeEventListener('aegis-object-save',save);});
 const open=()=>window.dispatchEvent(new CustomEvent('aegis-object-open',{detail:{object}}));
 let notice=$state('');
 let activation:MouseEvent|undefined;
 function link(url:string){const allowed=safeUrl(url);if(allowed&&activation?.isTrusted)window.dispatchEvent(new CustomEvent('aegis-open-source-window',{detail:{url:allowed,title:object.title,activation}}));}
 async function saveNote(action='note'){
  notice='Saving…';
  try {const result=await workApi('/api/workspace/v21/from-result',{method:'POST',body:JSON.stringify({action,object})});if(result.kind==='error')throw Error('Could not save result');notice=action==='note'?'Saved to Notes':'Saved to Tasks';}
  catch(e){notice=e instanceof Error?e.message:'Could not save note';}
 }
</script>
{#if drawn}
 <section class="result work-drag-handle" class:focused data-kind={object.kind} data-detail={detail} aria-label={object.title}>
  {#if !focused}<div class="toolbar nodrag nopan" aria-label="Result actions">
   {#if !focused}<button onclick={open}>Open</button>{/if}
   <button onclick={()=>saveNote()}>Save as note</button><button onclick={()=>saveNote('task')}>Make task</button>
  </div>{/if}
  <div class="surface" use:contentGeometry onclickcapture={event=>activation=event}><ObjectView object={drawn} centre={focused} actions={{open,link}}/></div>
  {#if notice}<p role="status" class="notice">{notice}</p>{/if}
 </section>
{:else}<LegacyWorkspaceObject {object} {detail} {focused}/>{/if}
<style>
 .result{position:relative;box-sizing:border-box;width:100%;height:100%;color:var(--color-text);font-family:var(--font-sans);min-width:0}
 .surface{width:100%;max-height:100%;overflow:hidden;box-sizing:border-box}
 .result:not(.focused) .surface>:global(section),.result:not(.focused) .surface>:global(article){box-sizing:border-box}
 .toolbar{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:5px 8px;border-radius:16px;background:var(--color-float);box-shadow:var(--shadow-float);opacity:0;pointer-events:none;z-index:10;white-space:nowrap}
 :global(.svelte-flow__node.selected) .result:not(.focused) .toolbar{display:none}
 .result:hover .toolbar,.result:focus-within .toolbar,:global(.svelte-flow__node.selected) .toolbar{opacity:1;pointer-events:auto}
 button{border:0;background:transparent;color:var(--color-text);padding:8px 12px;min-height:36px;font:500 12px var(--font-sans);cursor:pointer;border-radius:10px}
 button:hover{background:var(--color-hover)}button:focus-visible{outline:2px solid var(--color-text);outline-offset:2px}
 .focused{height:auto;min-height:200px}.focused .surface{height:auto;max-height:none;overflow:visible}.focused .toolbar{position:static;transform:none;opacity:1;pointer-events:auto;justify-content:flex-end;background:none;box-shadow:none}
 .notice{font-size:12px;color:var(--color-muted)}
 .result:not(.focused) .surface :global(:is(.paper,.plot,.sheet,.plan,.list)){background:transparent;box-shadow:none;border:0;border-radius:0;padding:0}
 .result:not(.focused) .surface :global(.page){padding:0;min-block-size:0!important;max-block-size:100%!important}
 .result:not(.focused) .surface :global(*){scrollbar-width:none}
 .result:not(.focused) .surface :global(*::-webkit-scrollbar){display:none}
 .result:not(.focused) .surface :global(:is(.scroll,.table-wrap,.content,.page,pre)){overflow:hidden}
 [data-kind=answer] .surface{padding:0}
 [data-detail=compact]:not(.focused) .surface{max-height:160px;overflow:hidden}
 @media(pointer:coarse){.toolbar{opacity:1;pointer-events:auto}button{min-height:44px}}
</style>
