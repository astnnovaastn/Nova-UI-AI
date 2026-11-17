<script lang="ts">
 import {onMount,getContext} from 'svelte';
 import {routingContext,type RoutingSnapshot} from '../routing-service';
 const routing=getContext<(()=>RoutingSnapshot)|undefined>(routingContext);
 import AdaptivePresentation from './AdaptivePresentation.svelte';
 import ObjectView from '$features/work/components/objects/ObjectView.svelte';
 import LegacyWorkspaceObject from './LegacyWorkspaceObject.svelte';
 import RequestActivity from './RequestActivity.svelte';
 import PlanTasks from './PlanTasks.svelte';
 import {openWorkspaceObject} from './open-object';
 import MetricPanels from './MetricPanels.svelte';
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
 const open=()=>openWorkspaceObject(object,activation);
 let notice=$state('');
 let activation:MouseEvent|undefined;
 function link(url:string){const allowed=safeUrl(url);if(allowed&&activation?.isTrusted)window.dispatchEvent(new CustomEvent('aegis-open-source-window',{detail:{url:allowed,title:object.title,activation}}));}
 async function saveNote(action='note'){
  notice='Saving…';
  try {const result=await workApi('/api/workspace/v21/from-result',{method:'POST',body:JSON.stringify({action,object})});if(result.kind==='error')throw Error('Could not save result');notice=action==='note'?'Saved to Notes':'Saved to Tasks';}
  catch(e){notice=e instanceof Error?e.message:'Could not save note';}
 }
</script>
{#if drawn||object.contract_version===26}
 <section class="result work-drag-handle" class:focused data-kind={object.kind} data-detail={detail} aria-label={object.title}>
  <div class="surface" use:contentGeometry onclickcapture={event=>activation=event}>{#if object.contract_version===26}<AdaptivePresentation {object} {focused} actions={{open,link,ask:subject=>window.dispatchEvent(new CustomEvent('aegis-object-ask',{detail:{object,subject}}))}}/>{:else if object.requestActivity}<RequestActivity {object}/>{:else if object.metricPanels?.length}<MetricPanels {object}/>{:else}<ObjectView object={drawn} centre={focused} actions={{open,link,ask:subject=>window.dispatchEvent(new CustomEvent("aegis-object-ask",{detail:{object,subject}}))}}/>{/if}{#if ['timeline','calendar'].includes(object.kind)&&object.entries?.length}<PlanTasks {object}/>{/if}</div>
  {#if notice}<p role="status" class="notice">{notice}</p>{/if}
 </section>
{:else}<LegacyWorkspaceObject {object} {detail} {focused}/>{/if}
<style>.result .surface :global(.photo.region .badge){inset-inline-start:12px;inset-block-start:10px;min-inline-size:140px;block-size:40px;box-sizing:border-box;justify-content:center}.result .surface :global(.plan>div.calendar){inline-size:100%}
 .result{position:relative;box-sizing:border-box;width:100%;height:100%;color:var(--color-text);font-family:var(--font-sans);min-width:0}
 .surface{width:100%;max-height:100%;overflow:hidden;box-sizing:border-box}
 .result:not(.focused) .surface>:global(section),.result:not(.focused) .surface>:global(article){box-sizing:border-box}
 .focused{height:auto;min-height:200px}.focused .surface{height:auto;max-height:none;overflow:visible}
 .result .surface :global(.picks){--card-widest:320px!important;--text-label:16px;--text-page-title:18px;--text-caption:14px;--text-object-title:24px}.result .surface :global(.picks .set){grid-template-columns:repeat(var(--across),minmax(0,320px))}
 .result[data-kind=table] .surface :global(.sheet){padding:20px 22px 16px;border-radius:22px;--text-body:15px;--text-label:13px;--text-object-title:22px}
 .notice{font-size:12px;color:var(--color-muted)}
 .result:not(.focused) .surface :global(:is(.paper,.plot,.plan,.list)){background:transparent;box-shadow:none;border:0;border-radius:0;padding:0}
 .result:not(.focused) .surface :global(.page){padding:0;min-block-size:0!important;max-block-size:100%!important}
 .result:not(.focused) .surface :global(*){scrollbar-width:none}
 .result:not(.focused) .surface :global(*::-webkit-scrollbar){display:none}
 .result:not(.focused) .surface :global(:is(.scroll,.table-wrap,.content,.page,pre)){overflow:hidden}
 .result[data-kind=answer] .surface{padding:0}
 .result[data-detail=compact]:not(.focused) .surface{max-height:160px;overflow:hidden}
 .result[data-kind=diagram] .surface,.result[data-kind=knowledge-graph] .surface{max-height:none!important;overflow:visible!important}
 :global(.svelte-flow__node:has(.popover)){z-index:1001!important}
.result .surface :global(.pick h4){line-height:1.4}.result .surface :global(.pick .subtitle),.result .surface :global(.pick .why){line-height:1.5}.result .surface :global(.pick .facts){line-height:1.5}.result .surface :global(.pick .body){padding:20px 22px;gap:14px}</style>
