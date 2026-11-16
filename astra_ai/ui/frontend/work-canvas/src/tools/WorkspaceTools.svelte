<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import {BitsConfig} from 'bits-ui';
 let portal=$state<HTMLElement>();
 import NotesView from '$features/tools/components/previews/NotesView.svelte';
 import TasksView from '$features/tools/components/previews/TasksView.svelte';
 import NotesPage from '$features/notes/components/NotesPage.svelte';
 import TasksPage from '$features/tasks/components/TasksPage.svelte';
 import {toolSession,editTool} from '$session/tool-drafts.svelte';
 import {toolContext,surface} from './context.svelte';
 import {noteSession} from '$domain/notes';
 import {taskSession} from '$domain/resources';
 import {captureNativeActivation} from '../native/core';
 let {kind,onclose}:{kind:'notes'|'tasks';onclose:()=>void;onlegacy?:()=>void}=$props();
 const profile='aegis-owner';
 const viewState=untrack(()=>toolSession(profile,kind));
 $effect(()=>{
  const host=toolContext.page?'page':'sidebar';
  if(kind==='notes'){
   const note=untrack(()=>noteSession(profile,host))!;const id=note.note?.id,save=note.saveState;
   const timer=setTimeout(()=>window.dispatchEvent(new CustomEvent('aegisWidgetSemanticState',{detail:{widget:'notes',state:{active_tab:id?'editor':'list',selected_note_id:id||null,reviewed_note_id:id||null,draft:note.markdown.slice(0,600),dirty:save!=='saved',save_state:save,ai_workspace:{visible:false}}}})),120);
   return()=>clearTimeout(timer);
  }
  const tasks=untrack(()=>taskSession(profile,host)),selected=tasks.selectedId;
  const timer=setTimeout(()=>window.dispatchEvent(new CustomEvent('aegisWidgetSemanticState',{detail:{widget:'task',state:{selected_task_id:selected,view:host,task_count:tasks.rows.length}}})),120);
  return()=>clearTimeout(timer);
 });
 function close(){if(!toolContext.page)onclose();}
 onMount(()=>()=>{toolContext.page=null;});
</script>
<div class="tool-portals" bind:this={portal}></div>
{#if portal}<BitsConfig defaultPortalTo={portal}>
<div class="tools" class:full={!!toolContext.page} onclickcapture={captureNativeActivation} onkeydowncapture={captureNativeActivation}>
 {#if toolContext.page==='notes'}<NotesPage {profile} onclose={()=>surface.close()}/>
 {:else if toolContext.page==='tasks'}<TasksPage/>
 {:else if kind==='notes'}<NotesView {profile} tool="notes" state={viewState} edit={patch=>editTool(viewState,patch)} onclose={close}/>
 {:else}<TasksView {profile} tool="tasks" state={viewState} edit={patch=>editTool(viewState,patch)} onclose={close}/>{/if}
</div>
</BitsConfig>{/if}
<style>.tool-portals{position:fixed;inset:0;z-index:1800;pointer-events:none}.tool-portals :global(>*){pointer-events:auto}.tools{border-radius:12px;overflow:hidden;background:var(--aegis-shell-raised);height:100%;min-height:0;display:flex;flex-direction:column;color:var(--color-text);font-family:var(--font-sans)}.tools.full{height:auto;box-sizing:border-box;position:fixed;inset:60px 24px 84px 80px;background:var(--color-page);border:1px solid var(--color-border);border-radius:16px;padding:16px;z-index:1700;box-shadow:var(--shadow-float)}@media(max-width:640px){.tools.full{inset:48px 8px 74px;padding:8px}}</style>
