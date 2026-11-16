<script lang="ts">
 import {onMount} from 'svelte';
 import Lift from '$features/work/components/Lift.svelte';
 import LiftHeader from '$features/work/components/LiftHeader.svelte';
 import ObjectCentre from '$features/work/components/objects/ObjectCentre.svelte';
 import Button from '$shared/ui/Button';
 import {objectIcon,objectLabel} from '$features/work/lib/object-kind';
 import LegacyWorkspaceObject from './LegacyWorkspaceObject.svelte';
 import {zephiumObject} from './zephium-object';
 import {parseObject,safeUrl,type WorkspaceObject as ObjectData} from './registry';
 import {workApi} from '../work-panels.svelte';
 let {onask,onsource}:{onask?:(object:ObjectData)=>void;onsource?:(url:string,title:string,event:MouseEvent)=>void}=$props();
 let object=$state<ObjectData|null>(null),origin=$state<DOMRect|null>(null),bounds=$state(new DOMRect(0,0,window.innerWidth,window.innerHeight)),notice=$state(''),saving=$state(false);
 let activation:MouseEvent|undefined;
 const drawn=$derived(object?zephiumObject(object):null);
 const wide=$derived(!!object&&['diagram','knowledge-graph','table','comparison','calendar','chart'].includes(object.kind));
 const label=$derived(object?({answer:'Answer',report:'Report',document:'Document',diagram:'Diagram','knowledge-graph':'Diagram',comparison:'Comparison',calendar:'Calendar',timeline:'Timeline',chart:'Chart'}[object.kind]||(drawn?objectLabel(drawn.kind):object.kind)):'Result');
 const icon=$derived(objectIcon(drawn?.kind||'document'));
 const primary=$derived(object&&!['diagram','knowledge-graph','image','video','audio'].includes(object.kind)?{label:drawn?.kind==='plan'?'Make tasks':'Save as note',disabled:saving,onclick:()=>save(drawn?.kind==='plan'?'task':'note')}:undefined);
 async function save(action:string){if(!object||saving)return;saving=true;try{const r=await workApi('/api/workspace/v21/from-result',{method:'POST',body:JSON.stringify({action,object})});if(r.kind==='error')throw Error('Save failed');notice=action==='note'?'Saved to Notes':'Saved to Tasks';}catch(e){notice=String(e);}finally{saving=false;}}
 function ask(subject?:string){if(object)onask?.(subject?{...object,title:subject}:object);object=null;}
 function link(url:string){const allowed=safeUrl(url);if(allowed&&activation?.isTrusted)onsource?.(allowed,object?.title||'',activation);}
 onMount(()=>{const resize=()=>bounds=new DOMRect(0,0,window.innerWidth,window.innerHeight);const open=(event:Event)=>{const value=parseObject((event as CustomEvent).detail?.object);if(value){object=value;notice='';origin=document.querySelector(`[data-card-id="object:${CSS.escape(value.id)}"]`)?.getBoundingClientRect()??null;resize();}};window.addEventListener('aegis-object-open',open);window.addEventListener('resize',resize);return()=>{window.removeEventListener('aegis-object-open',open);window.removeEventListener('resize',resize);};});
</script>
{#if object}<Lift {origin} {bounds} title={object.title} preferred={{width:wide?1600:760,height:window.innerHeight-96}} onclose={()=>object=null}>
 <LiftHeader kind={label} {icon} meta={object.sources.length?`${object.sources.length} source${object.sources.length===1?'':'s'}`:''} {primary}>
  {#snippet actions()}{#if onask}<Button size="compact" onclick={()=>ask()}>Ask about this</Button>{/if}{/snippet}
 </LiftHeader>
 <div class="body" onclickcapture={event=>activation=event}>{#if drawn}<ObjectCentre object={drawn} actions={{link,ask:onask?subject=>ask(subject):undefined}}/>{:else}<LegacyWorkspaceObject {object} focused/>{/if}</div>
 {#if notice}<p role="status">{notice}</p>{/if}
 {#if object.sources.length}<div class="sources">{#each object.sources as source}{#if source.url&&onsource}<button onclick={event=>{onsource?.(source.url!,source.title,event);}}>{source.title}</button>{:else}<span>{source.title}</span>{/if}{/each}</div>{/if}
</Lift>{/if}
<style>.body:has(:global(.centre.diagram)){min-height:280px}.body{padding-top:20px}.sources{display:flex;flex-wrap:wrap;gap:12px;padding-top:24px;font-size:12px;color:var(--color-muted)}.sources button{font:inherit;color:inherit;border:0;background:var(--color-control);border-radius:8px;padding:6px 10px}p{font-size:12px;color:var(--color-muted)}</style>
