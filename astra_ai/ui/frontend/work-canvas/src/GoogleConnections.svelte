<script lang="ts">
  import {onMount} from 'svelte';
  import {workApi} from './work-panels.svelte';
  export type AccountInput = {id:string;kind:string;title:string;url:string;summary:string};
  let {onAttach,api=workApi}: {onAttach?: (input:AccountInput)=>void;api?:typeof workApi} = $props();
  let status=$state<{configured:boolean;connected:boolean;services:string[]}|null>(null);
  let error=$state(''), busy=$state(false), authorization=$state(''), query=$state('');
  let records=$state<AccountInput[]>([]), more=$state(false), notice=$state('');
  let start=$state(new Date().toISOString().slice(0,10));
  let end=$state(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  async function refresh() {
    try {status=await api('/api/work/google');error='';}
    catch(e){error=(e as Error).message;}
  }
  onMount(refresh);
  async function connect() {
    busy=true;error='';
    try {
      const result=await api<{authorization_url:string}>('/api/work/google/connect',{method:'POST',body:JSON.stringify({services:['gmail','calendar']})});
      const url=new URL(result.authorization_url);
      if(url.origin!=='https://accounts.google.com')throw new Error('Invalid authorization destination');
      authorization=url.href;
    }catch(e){error=(e as Error).message;}finally{busy=false;}
  }
  async function disconnect() {
    busy=true;
    try {await api('/api/work/google',{method:'DELETE'});records=[];authorization='';await refresh();notice='Disconnected on this device. Existing task attachments are retained.';}
    catch(e){error=(e as Error).message;}finally{busy=false;}
  }
  async function read(service:'gmail'|'calendar') {
    busy=true;error='';notice='';records=[];
    try {
      if(service==='gmail') {
        const result=await api<{items:{id:string;subject:string;from:string;date:string;snippet:string;url:string}[];has_more:boolean}>('/api/work/google/messages?limit=10&query='+encodeURIComponent(query));
        records=result.items.map(x=>({id:'gmail:'+x.id,kind:'message',title:x.subject,url:x.url,summary:[x.from,x.date,x.snippet].join('\n').slice(0,600)}));
        more=result.has_more;
      } else {
        const params=new URLSearchParams({start:new Date(start+'T00:00:00').toISOString(),end:new Date(end+'T23:59:59').toISOString(),limit:'50'});
        const result=await api<{items:{id:string;summary?:string;start?:{date?:string;dateTime?:string};end?:{date?:string;dateTime?:string};location?:string;htmlLink?:string}[];has_more:boolean}>('/api/work/google/events?'+params);
        records=result.items.map(x=>({id:'calendar:'+x.id,kind:'calendar',title:x.summary||'Untitled event',url:x.htmlLink||'',summary:[x.start?.dateTime||x.start?.date,x.end?.dateTime||x.end?.date,x.location].filter(Boolean).join(' · ').slice(0,600)}));
        more=result.has_more;
      }
      if(!records.length)notice='No items found in this selection.';
    }catch(e){error=(e as Error).message;}finally{busy=false;}
  }
</script>
<section aria-label="Google Calendar and Gmail">
  <h3>Google Calendar & Gmail</h3>
  <p>Read selected events and message summaries. Sending and calendar changes are unavailable.</p>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if status}
    {#if !status.configured}
      <p>Not set up. The host needs a Google OAuth client before you can connect.</p>
    {:else}
      <div class="buttons">
        <button disabled={busy} onclick={connect}>{status.connected?'Change authorization':'Connect Google'}</button>
        <button disabled={busy} onclick={refresh}>Refresh status</button>
        {#if status.connected}<button disabled={busy} onclick={disconnect}>Disconnect</button>{/if}
      </div>
      {#if authorization}<a href={authorization} target="_blank" rel="noopener noreferrer">Continue with Google in your browser ↗</a>{/if}
      {#if status.connected}
        <p>Authorized: {status.services.join(', ')}. Select items below to include in your next task.</p>
        {#if status.services.includes('gmail')}
          <label>Gmail search<input bind:value={query} placeholder="is:unread" /></label>
          <button disabled={busy} onclick={()=>read('gmail')}>Read up to 10 messages</button>
        {/if}
        {#if status.services.includes('calendar')}
          <div class="dates"><label>From<input type="date" bind:value={start} /></label><label>Through<input type="date" bind:value={end} /></label></div>
          <button disabled={busy||!start||!end} onclick={()=>read('calendar')}>Read calendar events</button>
        {/if}
      {/if}
    {/if}
  {/if}
  {#if busy}<p role="status">Loading…</p>{/if}
  {#if notice}<p role="status">{notice}</p>{/if}
  {#if more}<p>More items exist. Narrow the search or date range to see others.</p>{/if}
  <ul>{#each records as item (item.id)}
    <li><strong>{item.title}</strong><p>{item.summary}</p>
      <button disabled={!onAttach} onclick={()=>{onAttach?.(item);notice='Selected for your next task. Review the attachment beside the composer.';}}>Use in next task</button>
    </li>
  {/each}</ul>
  <p class="privacy">Only the items you choose are shared with the configured AI when you send a task. Message bodies and attachments are not fetched.</p>
</section>
<style>
 section{display:grid;gap:10px;padding:12px 0;border-block:1px solid var(--color-border)}
 h3{margin:0;font-size:14px} p{margin:0;color:var(--color-muted);font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
 label{display:grid;gap:4px;font-size:12px}.dates,.buttons{display:flex;gap:8px;flex-wrap:wrap}.dates label{flex:1;min-width:0}
 input{width:100%;box-sizing:border-box;min-width:0;padding:6px;border:1px solid var(--color-border);border-radius:6px;background:transparent;color:inherit}
 button,a{font:inherit;font-size:12px;color:inherit;padding:6px 9px;border:1px solid var(--color-border);border-radius:8px;background:color-mix(in srgb,var(--color-text) 7%,transparent);cursor:pointer}
 button:disabled{opacity:.5;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--color-text);outline-offset:2px}
 ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}li{display:grid;gap:6px}strong{font-size:12px}.privacy{font-size:11px}
</style>

