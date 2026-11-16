<script lang="ts">
 import {onMount} from 'svelte';
 import {workApi} from './work-panels.svelte';
 import type {AccountInput} from './GoogleConnections.svelte';
 let {onAttach}:{onAttach?:(input:AccountInput)=>void}=$props();
 let roots=$state<{id:string;title:string}[]>([]),root=$state(''),paths=$state<string[]>([]),file=$state('');
 let start=$state(1),end=$state(80),error=$state(''),busy=$state(false),more=$state(false);
 let excerpt=$state<(AccountInput&{sha256:string;start:number;end:number;total_lines:number})|null>(null);
 onMount(async()=>{try{roots=(await workApi<{repositories:typeof roots}>('/api/work/repositories')).repositories;}catch(e){error=(e as Error).message;}});
 async function list(){
  busy=true;error='';excerpt=null;paths=[];file='';
  try{const data=await workApi<{files:string[];truncated:boolean}>('/api/work/repositories/'+encodeURIComponent(root)+'/files');paths=data.files;more=data.truncated;}
  catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function read(){
  busy=true;error='';excerpt=null;
  try{excerpt=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/source?'+new URLSearchParams({path:file,start:String(start),end:String(end)}));}
  catch(e){error=(e as Error).message;}finally{busy=false;}
 }
</script>
<section aria-label="Repository context">
 <h3>Repository context</h3>
 <p>Read source excerpts from folders allowed by this host. Tests and file edits are unavailable.</p>
 {#if error}<p role="alert">{error}</p>{/if}
 {#if !roots.length}<p>No repository configured.</p>
 {:else}
  <label>Repository<select bind:value={root} onchange={list}><option value="" disabled>Choose a repository</option>{#each roots as item}<option value={item.id}>{item.title}</option>{/each}</select></label>
  {#if paths.length}
   <label>Source file<select bind:value={file} onchange={()=>excerpt=null}><option value="" disabled>Choose a source file</option>{#each paths as path}<option value={path}>{path}</option>{/each}</select></label>
   {#if more}<p>Showing the first 1,000 eligible files. A smaller configured folder provides a focused inventory.</p>{/if}
   <div class="range"><label>First line<input type="number" min="1" bind:value={start}/></label><label>Last line<input type="number" min={start} max={start+199} bind:value={end}/></label></div>
   <button disabled={busy||!file} onclick={read}>Read selected lines</button>
  {/if}
 {/if}
 {#if excerpt}
  <p>{excerpt.title} · lines {excerpt.start}–{excerpt.end} of {excerpt.total_lines}</p>
  <pre>{excerpt.summary}</pre>
  <p>Revision {excerpt.sha256.slice(0,12)}</p>
  <button onclick={()=>onAttach?.({...excerpt,url:'',summary:'File: '+excerpt.title+'; SHA-256: '+excerpt.sha256+'\n'+excerpt.summary})}>Use excerpt in next task</button>
 {/if}
</section>
<style>section{display:grid;gap:9px;padding:12px 0;border-block-end:1px solid var(--color-border)}h3,p{margin:0}h3{font-size:14px}p,label{font-size:12px;color:var(--color-muted)}label{display:grid;gap:4px}.range{display:flex;gap:8px}.range label{min-width:0;flex:1}input,select,button{min-width:0;max-width:100%;box-sizing:border-box;border:1px solid var(--color-border);border-radius:7px;background:var(--color-canvas);color:inherit;padding:6px;font:inherit}button{cursor:pointer}pre{font:11px/1.5 monospace;white-space:pre;max-height:260px;overflow:auto;background:var(--color-canvas);padding:8px}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--color-text);outline-offset:2px}</style>

