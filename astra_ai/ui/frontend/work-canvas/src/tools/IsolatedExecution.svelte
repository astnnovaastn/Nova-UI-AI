<script lang="ts">
 import {onMount} from 'svelte';
 import {workspaceHeaders} from '../native/host-session';
 import CommandReview from '$features/work/components/local/CommandReview.svelte';
 import CommandRecord from '$features/work/components/local/CommandRecord.svelte';
 let edits=$state('{}');
 let status=$state<any>(null),record=$state<any>(null),repository=$state(''),files=$state(''),argv=$state('["python", "-m", "pytest"]'),error=$state(''),busy=$state(false);
 async function api(path='',body?:unknown){const r=await fetch('/api/workspace/v21/execution'+path,{method:body?'POST':'GET',headers:workspaceHeaders(),...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();if(!r.ok)throw Error(value.detail||'Request failed');return value;}
 onMount(()=>{void api().then(async value=>{status=value;repository=value.repositories[0]?.id||'';const id=sessionStorage.getItem('aegis-work-execution');if(id)record=await api('/'+id);}).catch(e=>error=String(e));});
 const step=$derived(record?{kind:{kind:'run_command',cwd:record.repository,command:record.argv.map((v:string)=>JSON.stringify(v)).join(' ')},local:{policy:{scope:'once',reason:'project_execution',root:record.repository}}} as any:null);
 const result=$derived(record?{command:{cwd:record.repository,command:record.argv.join(' '),text:record.output,exit:record.exit_code,signal:null,elapsed_ms:record.elapsed_ms||0,truncated:record.status==='limit_reached',bytes:new TextEncoder().encode(record.output).length}} as any:null);
 async function propose(){busy=true;try{record=await api('',{repository,files:files.split('\n').map(s=>s.trim()).filter(Boolean),argv:JSON.parse(argv),edits:JSON.parse(edits)});sessionStorage.setItem('aegis-work-execution',record.id);error='';}catch(e){error=String(e);}finally{busy=false;}}
 async function apply(){busy=true;try{record=await api('/'+record.id+'/apply',{approval:record.approval});}catch(e){error=String(e);}finally{busy=false;}}
 async function decide(approve:boolean){busy=true;try{record=await api('/'+record.id+'/'+(approve?'run':'cancel'),{approval:record.approval});error=record.blocked||'';}catch(e){error=String(e);}finally{busy=false;}}
</script>
<section class="execution">
 <h3>Isolated workspace</h3><p>Only selected files are copied. Commands have no network access and cannot change your repository.</p>
 {#if status&&!status.available}<p role="status">{status.reason}</p>{/if}
 {#if error}<p role="alert">{error}</p>{/if}
 <form onsubmit={e=>{e.preventDefault();void propose();}}>
  <label>Authorized repository<select bind:value={repository}>{#each status?.repositories||[] as r}<option value={r.id}>{r.title}</option>{/each}</select></label>
  <label>Files to copy · one relative path per line<textarea rows="3" bind:value={files} required></textarea></label>
  <label>Command arguments<input bind:value={argv} required/></label>
  <details><summary>Propose file changes</summary><label>JSON map: selected relative path → replacement text<textarea rows="4" bind:value={edits}></textarea></label></details>
  <button disabled={busy||!repository}>Review command</button>
 </form>
 {#if record&&step}
  {#each Object.entries(record.files) as [path,entry]}{#if (entry as any).before!==(entry as any).after}<details open><summary>{path} · proposed replacement</summary><pre>{(entry as any).before}</pre><hr/><pre>{(entry as any).after}</pre></details>{/if}{/each}
  {#if record.status==='awaiting_approval'}<CommandReview {step} disabled={busy||!status?.available} ondecision={decide}/>
  {:else}<strong>{record.status}</strong><CommandRecord record={result}/>{#if ['completed','failed'].includes(record.status)&&Object.values(record.files).some((e:any)=>e.before!==e.after)}<button disabled={busy} onclick={apply}>Apply reviewed changes to repository</button>{/if}{/if}
  {#if busy}<button onclick={()=>void api('/'+record.id+'/cancel',{}).catch(e=>error=String(e))}>Cancel execution</button>{/if}
  {#if record.cleanup_required}<p role="alert">Execution was interrupted. Check and remove the isolated container {record.cleanup_required} before retrying.</p>{/if}
 {/if}
</section>
<style>.execution{padding:16px;overflow:auto;display:grid;gap:14px;min-height:0}h3,p{margin:0}p{font-size:12px;line-height:1.5;color:var(--color-muted)}form,label{display:grid;gap:8px}form{gap:14px}input,textarea,select,button{font:13px var(--font-sans);color:var(--color-text);background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:9px;max-width:100%;box-sizing:border-box}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 var(--font-mono)}button{cursor:pointer}button:disabled{opacity:.5}</style>
