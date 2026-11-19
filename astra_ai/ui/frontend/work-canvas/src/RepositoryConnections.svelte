<script lang="ts">
 /*
  * Repository context (V33: developer access). Folders configured by the host, plus what the person opens
  * here with AEGIS Desktop's own dialog (Open folder, Open file, Select repository). A file tree (ignore
  * rules applied), selected lines, the real git change, imports, and, only where the person allowed saving,
  * an edit reviewed as a diff and saved after they press Save. Nothing here runs project code.
  */
 import {onMount} from 'svelte';
 import {workApi} from './work-panels.svelte';
 import {desktopWork} from './browser-host';
 import type {AccountInput} from './GoogleConnections.svelte';
 let {onAttach}:{onAttach?:(input:AccountInput)=>void}=$props();
 type Root={id:string;title:string;source?:string;write?:boolean;files?:string[]};
 type Node={name:string;path:string;kind:'folder'|'file';children?:Node[];more?:number};
 type FileChange={path:string;status:string;added:number;removed:number};
 let roots=$state<Root[]>([]),root=$state(''),paths=$state<string[]>([]),file=$state('');
 let start=$state(1),end=$state(80),error=$state(''),busy=$state(false),more=$state(false),notice=$state('');
 let excerpt=$state<(AccountInput&{sha256:string;start:number;end:number;total_lines:number})|null>(null);
 let tree=$state<{tree:Node;files:number;skipped:Record<string,number>;ignored:string[];truncated:boolean}|null>(null);
 let changes=$state<{available:boolean;reason?:string;kind?:string;branch?:string;head?:string;diff?:string;files?:FileChange[];untracked?:string[]}|null>(null);
 let deps=$state<{modules:{id:string;files:number}[];edges:{from:string;to:string;count:number}[];external:[string,number][];most_imported:[string,number][]}|null>(null);
 let editing=$state<{path:string;text:string;sha256:string}|null>(null),proposal=$state<{id:string;diff:string;approval:string;status:string}|null>(null);
 const current=$derived(roots.find(r=>r.id===root));
 async function load(){try{roots=(await workApi<{repositories:Root[]}>('/api/work/repositories')).repositories;}catch(e){error=(e as Error).message;}}
 onMount(load);
 function reset(){excerpt=null;paths=[];file='';tree=null;changes=null;deps=null;editing=null;proposal=null;notice='';}
 async function list(){
  busy=true;error='';reset();
  try{
   const base='/api/work/repositories/'+encodeURIComponent(root);
   const [data,shape]=await Promise.all([workApi<{files:string[];truncated:boolean}>(base+'/files'),workApi<NonNullable<typeof tree>>(base+'/tree')]);
   paths=data.files;more=data.truncated;tree=shape;
  }catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function read(){
  busy=true;error='';excerpt=null;
  try{excerpt=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/source?'+new URLSearchParams({path:file,start:String(start),end:String(end)}));}
  catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function choose(kind:'folder'|'file'|'repository'){
  error='';notice='';
  try{
   const granted=kind==='file'?await desktopWork.selectFile():await desktopWork.selectFolder(kind==='repository'?{write:true,title:'Select a repository for AEGIS Work'}:{});
   if(!granted)return;
   await load();root=granted.id;await list();
   if(granted.file){file=granted.file;await read();}
   notice=granted.write?'AEGIS can read this folder and save changes you approve.':'AEGIS can read '+(granted.file?'this file':'this folder')+'. Nothing is saved there.';
  }catch(e){error=(e as Error).message;}
 }
 async function revoke(){
  if(!current||current.source!=='authorized')return;
  try{await workApi('/api/work/repositories/'+encodeURIComponent(current.id)+'/grant',{method:'DELETE'});root='';reset();await load();notice='Removed. AEGIS can no longer read that folder.';}catch(e){error=(e as Error).message;}
 }
 async function showChanges(){
  busy=true;error='';
  try{changes=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/changes');}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function showDeps(){
  busy=true;error='';
  try{deps=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/dependencies');}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function edit(){
  busy=true;error='';proposal=null;
  try{editing=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/text?'+new URLSearchParams({path:file}));}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function review(){
  if(!editing)return;busy=true;error='';
  try{proposal=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/edits',{method:'POST',body:JSON.stringify({path:editing.path,text:editing.text,base_sha:editing.sha256})});}catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function save(){
  if(!proposal)return;busy=true;error='';
  try{proposal=await workApi('/api/work/repositories/'+encodeURIComponent(root)+'/edits/'+proposal.id+'/save',{method:'POST',body:JSON.stringify({approval:proposal.approval})});editing=null;notice='Saved '+file+'.';await read();}
  catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 const useChange=()=>changes?.diff&&onAttach?.({id:'change:'+root+':'+(changes.head||''),kind:'diff',title:(current?.title||root)+' change',url:'',summary:changes.diff.slice(0,20000)} as AccountInput);
</script>
<section aria-label="Repository context">
 <h3>Repository context</h3>
 <p>Read code from folders allowed by this host or opened here. Tests run only in the isolated sandbox, after you approve them.</p>
 {#if desktopWork.available}
  <div class="row" data-developer-access>
   <button type="button" onclick={()=>choose('folder')}>Open folder</button>
   <button type="button" onclick={()=>choose('file')}>Open file</button>
   <button type="button" onclick={()=>choose('repository')}>Select repository</button>
  </div>
 {/if}
 {#if notice}<p role="status" class="notice">{notice}</p>{/if}
 {#if error}<p role="alert">{error}</p>{/if}
 {#if !roots.length}<p>No repository configured{desktopWork.available?' or opened':''}.</p>
 {:else}
  <label>Repository<select bind:value={root} onchange={list}><option value="" disabled>Choose a repository</option>{#each roots as item}<option value={item.id}>{item.title}{item.source==='authorized'?(item.files?' (file)':' (opened)'):''}</option>{/each}</select></label>
  {#if current}
   <div class="row">
    <button type="button" disabled={busy} onclick={showChanges}>Changes</button>
    <button type="button" disabled={busy} onclick={showDeps}>Imports</button>
    {#if current.source==='authorized'}<button type="button" onclick={revoke}>Remove from AEGIS</button>{/if}
   </div>
  {/if}
  {#if tree}
   <p data-tree-count>{tree.files} files{tree.truncated?' (limit reached)':''}{tree.ignored.length?' · ignored: '+tree.ignored.slice(0,4).join(', ')+(tree.ignored.length>4?'…':''):''}</p>
   {#snippet branch(node:Node)}
    {#if node.kind==='folder'}
     <details open={!node.path}><summary>{node.name}/</summary><ul>{#each node.children??[] as child (child.path)}<li>{@render branch(child)}</li>{/each}{#if node.more}<li class="more">{node.more} more</li>{/if}</ul></details>
    {:else}
     <button type="button" class="leaf" class:on={file===node.path} onclick={()=>{file=node.path;excerpt=null;editing=null;proposal=null;void read();}}>{node.name}</button>
    {/if}
   {/snippet}
   <div class="tree" aria-label="File tree">{@render branch(tree.tree)}</div>
  {/if}
  {#if paths.length}
   <label>Source file<select bind:value={file} onchange={()=>excerpt=null}><option value="" disabled>Choose a source file</option>{#each paths as path}<option value={path}>{path}</option>{/each}</select></label>
   {#if more}<p>Showing the first 1,000 eligible files. A smaller configured folder provides a focused inventory.</p>{/if}
   <div class="range"><label>First line<input type="number" min="1" bind:value={start}/></label><label>Last line<input type="number" min={start} max={start+199} bind:value={end}/></label></div>
   <button disabled={busy||!file} onclick={read}>Read selected lines</button>
  {/if}
 {/if}
 {#if excerpt}
  <p>{excerpt.title} · lines {excerpt.start}–{excerpt.end} of {excerpt.total_lines}</p>
  <pre data-excerpt>{excerpt.summary}</pre>
  <p>Revision {excerpt.sha256.slice(0,12)}</p>
  <div class="row">
   <button onclick={()=>onAttach?.({...excerpt,url:'',summary:'File: '+excerpt.title+'; SHA-256: '+excerpt.sha256+'\n'+excerpt.summary})}>Use excerpt in next task</button>
   {#if current?.write}<button disabled={busy} onclick={edit}>Edit file</button>{/if}
  </div>
 {/if}
 {#if editing}
  <label>Edit {editing.path}<textarea rows="12" bind:value={editing.text} spellcheck="false"></textarea></label>
  <button disabled={busy} onclick={review}>Review change</button>
 {/if}
 {#if proposal}
  <pre class="diff" data-proposal={proposal.status}>{proposal.diff}</pre>
  {#if proposal.status==='awaiting_approval'}<button class="primary" disabled={busy} onclick={save}>Save this change</button>{:else}<p role="status">Saved.</p>{/if}
 {/if}
 {#if changes}
  {#if changes.available}
   <p data-changes>{changes.branch} @ {changes.head} · {changes.files?.length?changes.files.length+' changed files':'no changes against HEAD'}{changes.untracked?.length?' · '+changes.untracked.length+' untracked':''}</p>
   {#if changes.files?.length}<ul class="files">{#each changes.files as row}<li>{row.path} <span>+{row.added} −{row.removed}</span></li>{/each}</ul>
   <pre class="diff">{changes.diff}</pre><button onclick={useChange}>Use change in next task</button>{/if}
  {:else}<p role="status">No git change: {changes.reason}</p>{/if}
 {/if}
 {#if deps}
  <p>{deps.modules.length} modules · {deps.edges.length} import links · packages: {deps.external.slice(0,6).map(([n])=>n).join(', ')||'none'}</p>
  <ul class="files">{#each deps.most_imported.slice(0,6) as [path,count]}<li>{path} <span>imported by {count}</span></li>{/each}</ul>
 {/if}
</section>
<style>section{display:grid;gap:9px;padding:12px 0;border-block-end:1px solid var(--color-border)}h3,p{margin:0}h3{font-size:14px}p,label{font-size:12px;color:var(--color-muted)}label{display:grid;gap:4px}.range,.row{display:flex;gap:8px;flex-wrap:wrap}.range label{min-width:0;flex:1}input,select,button,textarea{min-width:0;max-width:100%;box-sizing:border-box;border:1px solid var(--color-border);border-radius:7px;background:var(--color-canvas);color:inherit;padding:6px;font:inherit}textarea{font:11px/1.5 monospace;resize:vertical}button{cursor:pointer}button.primary{border-color:var(--color-text)}pre{font:11px/1.5 monospace;white-space:pre;max-height:260px;overflow:auto;background:var(--color-canvas);padding:8px}.tree{max-height:240px;overflow:auto;font-size:12px}.tree ul{list-style:none;margin:0;padding-left:12px}.tree summary{cursor:pointer;color:var(--color-muted)}.leaf{border:0;background:none;padding:1px 2px;font-size:12px;text-align:left}.leaf.on{text-decoration:underline}.more{color:var(--color-muted)}.files{margin:0;padding-left:16px;font-size:12px}.files span{color:var(--color-muted)}.notice{color:inherit}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--color-ring,var(--color-text));outline-offset:2px}</style>
