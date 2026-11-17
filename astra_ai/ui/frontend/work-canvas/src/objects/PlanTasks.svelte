<script lang="ts">
 import {getContext} from 'svelte';
 import {resultActions,resultActionsKey,type ResultActions} from './result-actions.svelte';
 import type {WorkspaceObject} from './registry';
 let {object}:{object:WorkspaceObject}=$props();
 const actions=getContext<ResultActions|undefined>(resultActionsKey)||resultActions;
 let busy=$state(false),made=$state(false),error=$state('');
 async function open(){if(busy)return;if(made){actions.open('tasks');return;}busy=true;error='';try{const r=await actions.save(object,'task');if(r.kind!=='tasks_created')throw Error('Could not create the plan tasks');made=true;actions.open('tasks');}catch(e){error=e instanceof Error?e.message:'Could not create tasks';}finally{busy=false;}}
</script>
<footer class="nodrag nopan"><button onclick={open} disabled={busy}>{busy?'Creating tasks…':made?'Open in Tasks':'Make tasks'}</button>{#if error}<span role="alert">{error}</span>{/if}</footer>
<style>footer{margin-top:16px;display:flex;gap:12px;align-items:center;font-size:12px}button{border:0;border-radius:8px;padding:5px 10px;font:600 12px var(--font-sans);color:var(--color-text);background:var(--color-control);cursor:pointer}button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}span{color:var(--color-muted)}</style>
