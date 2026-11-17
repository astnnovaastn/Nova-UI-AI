<script lang="ts">
 import {onMount,getContext} from 'svelte';
 import Lift from '$features/work/components/Lift.svelte';
 import LiftHeader from '$features/work/components/LiftHeader.svelte';
 import AdaptivePresentation from './AdaptivePresentation.svelte';
 import ObjectCentre from '$features/work/components/objects/ObjectCentre.svelte';
 import Button from '$shared/ui/Button';
 import {objectIcon,objectLabel} from '$features/work/lib/object-kind';
 import LegacyWorkspaceObject from './LegacyWorkspaceObject.svelte';
 import {openWorkspaceObject} from './open-object';
 import {resultActions,resultActionsKey,type ResultActions} from './result-actions.svelte';
 import RequestActivity from './RequestActivity.svelte';
 import MetricPanels from './MetricPanels.svelte';
 import {zephiumObject} from './zephium-object';
 import {parseObject,safeUrl,type WorkspaceObject as ObjectData} from './registry';
 import {workApi} from '../work-panels.svelte';
 let {onask,onsource}:{onask?:(object:ObjectData)=>void;onsource?:(url:string,title:string,event:MouseEvent)=>void}=$props();
 let object=$state<ObjectData|null>(null),origin=$state<DOMRect|null>(null),bounds=$state(new DOMRect(0,0,window.innerWidth,window.innerHeight)),notice=$state(''),saving=$state(false);
 let activation:MouseEvent|undefined;
 const resources=getContext<ResultActions|undefined>(resultActionsKey)||resultActions;
 let savedNote=$state('');
 const drawn=$derived(object?zephiumObject(object):null);
 const wide=$derived(!!object&&(['diagram','knowledge-graph','table','comparison','calendar','chart'].includes(object.kind)||object.planMode==='schedule'));
 const label=$derived(object?({answer:'Answer',report:'Report',document:'Document',diagram:'Diagram','knowledge-graph':'Diagram',comparison:'Comparison',calendar:'Plan',timeline:'Plan',chart:'Chart'}[object.kind]||(drawn?objectLabel(drawn.kind):object.kind)):'Result');
 const icon=$derived(objectIcon(drawn?.kind||'document'));
 let tasksMade=$state(false);
 const plan=$derived(object&&['calendar','timeline'].includes(object.kind));
 const primary=$derived(plan?{label:tasksMade?'Open in Tasks':'Make tasks',disabled:saving,onclick:()=>tasksMade?resources.open('tasks'):save('task')}:object&&!object.requestActivity&&!['diagram','knowledge-graph','image','video','audio'].includes(object.kind)?{label:savedNote?'Open note':'Save as note',disabled:saving,onclick:()=>savedNote?resources.open('notes',savedNote):save('note')}:undefined);
 async function save(action:'note'|'task'){if(!object||saving)return;saving=true;try{const r=await resources.save(object,action);if(r.kind==='error')throw Error('Save failed');if(action==='task'){if(r.kind!=='tasks_created')throw Error('Could not create tasks');tasksMade=true;}else savedNote=r.summary?.id||r.note?.id||'';notice=action==='note'?'Saved to Notes':'Saved to Tasks';}catch(e){notice=String(e);}finally{saving=false;}}
 function ask(subject?:string){if(object)onask?.(subject?{...object,title:subject}:object);object=null;}
 function link(url:string){const allowed=safeUrl(url);if(allowed&&activation?.isTrusted)onsource?.(allowed,object?.title||'',activation);}
 onMount(()=>{const resize=()=>bounds=new DOMRect(0,0,window.innerWidth,window.innerHeight);const open=(event:Event)=>{const value=parseObject((event as CustomEvent).detail?.object);if(value){object=value;notice='';savedNote='';tasksMade=false;origin=document.querySelector(`[data-card-id="object:${CSS.escape(value.id)}"]`)?.getBoundingClientRect()??null;resize();}};const activated=(event:Event)=>{const d=(event as CustomEvent).detail;const o=parseObject(d?.object);if(o)openWorkspaceObject(o,d.activation);};window.addEventListener('aegis-adaptive-open',activated);window.addEventListener('aegis-object-open',open);window.addEventListener('resize',resize);return()=>{window.removeEventListener('aegis-adaptive-open',activated);window.removeEventListener('aegis-object-open',open);window.removeEventListener('resize',resize);};});
</script>
{#if object}<Lift {origin} {bounds} title={object.title} preferred={{width:wide?1600:760,height:window.innerHeight-96}} onclose={()=>object=null}>
 {#if !object.requestActivity}<LiftHeader kind={label} {icon} meta={object.sources.length?`${object.sources.length} source${object.sources.length===1?'':'s'}`:''} {primary}>
  {#snippet actions()}{#if onask}<Button size="compact" onclick={()=>ask()}>Ask about this</Button>{/if}{/snippet}
 </LiftHeader>{/if}
 <div class="body v25-content" onclickcapture={event=>activation=event}>{#if object.contract_version===26}<AdaptivePresentation {object} focused actions={{link,ask:onask?subject=>ask(subject):undefined}}/>{:else if object.requestActivity}<RequestActivity {object} focused onmade={id=>window.dispatchEvent(new CustomEvent("aegis-request-result",{detail:{id}}))}/>{:else if object.metricPanels?.length}<MetricPanels {object}/>{:else if drawn}<ObjectCentre object={drawn} actions={{link,ask:onask?subject=>ask(subject):undefined}}/>{:else}<LegacyWorkspaceObject {object} focused/>{/if}</div>
 {#if notice}<p role="status">{notice}</p>{/if}
 {#if object.sources.length}<div class="sources">{#each object.sources as source}{#if source.url&&onsource}<button onclick={event=>{onsource?.(source.url!,source.title,event);}}>{source.title}</button>{:else}<span>{source.title}</span>{/if}{/each}</div>{/if}
</Lift>{/if}
<style>.body :global(.plan){--text-body:16px;--text-page-title:18px;--text-caption:13px;--text-label:14px;--text-object-title:24px;--text-title:28px;--node:34px}.body :global(.plan .detail){line-height:1.5}.body :global(.plan h4){line-height:1.35}.body :global(.plan>div.calendar){inline-size:min(100%,1132px)}.body :global(.request){--text-body:15px;--text-label:14px;--text-page-title:18px}.body :global(.photo.region .badge){inset-inline-start:12px;inset-block-start:10px;min-inline-size:140px;block-size:40px;box-sizing:border-box;justify-content:center}:global(.lift:has(.v25-content) .content){scrollbar-width:none}:global(.lift:has(.v25-content) .content::-webkit-scrollbar){display:none}.body :global(.sheet){--text-body:15px;--text-label:13px;--text-object-title:22px}.body:has(:global(.centre.diagram)){min-height:280px}.body{padding-top:20px}.body :global(.picks){--card-widest:320px!important;--text-label:16px;--text-page-title:18px;--text-caption:14px;--text-object-title:24px}.sources{display:flex;flex-wrap:wrap;gap:12px;padding-top:24px;font-size:12px;color:var(--color-muted)}.sources button{font:inherit;color:inherit;border:0;background:var(--color-control);border-radius:8px;padding:6px 10px}p{font-size:12px;color:var(--color-muted)}.body :global(.pick h4){line-height:1.4}.body :global(.pick .subtitle),.body :global(.pick .why){line-height:1.5}.body :global(.pick .facts){line-height:1.5}.body :global(.pick .body){padding:20px 22px;gap:14px}</style>
