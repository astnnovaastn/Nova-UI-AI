<script lang="ts">
 import type {WorkspaceObject} from './registry';
 import {planLayout} from '../designer/planner';
 import {store} from '../store.svelte';
 let {object,detail='full',focused=false}:{object:WorkspaceObject;detail?:'compact'|'summary'|'full';focused?:boolean}=$props();
 let active=$state('');
 let tablePage=$state(0);
 $effect(()=>{const id=object.id,revision=object.revision;tablePage=0;});
 const graph=$derived.by(()=>{
  if(!['diagram','knowledge-graph'].includes(object.kind)||!object.nodes?.length)return null;
  return planLayout({nodes:object.nodes.map(n=>({id:n.id,title:n.label,type:'concept',x:0,y:0,width:170,height:72,group:n.group})),edges:object.edges||[],strategy:'dependency-explorer',width:900,height:400,viewport:{x:0,y:0,zoom:1}});
 });
 const extent=$derived(graph?{w:Math.max(...Object.values(graph.geometry.positions).map(p=>p.x+180)),h:Math.max(...Object.values(graph.geometry.positions).map(p=>p.y+90))}:{w:1,h:1});
 const max=$derived(Math.max(1,...(object.entries||[]).map(e=>Math.abs(e.value||0))));
 const markdown=$derived(object.body&&store.actions?.renderMarkdown?store.actions.renderMarkdown(object.body):null);
 function inspect(){window.dispatchEvent(new CustomEvent('aegis-object-open',{detail:{object}}));}
</script>
<article class="workspace-object work-drag-handle" class:focused data-kind={object.kind} data-detail={detail}>
 <header><span class="kind">{object.kind.replaceAll('-',' ')}</span><span class="state">{object.status}</span></header>
 <h2>{object.title}</h2>
 <div class="content nowheel nodrag">
 {#if ['image','video','source'].includes(object.kind)}
  {#if object.kind==='image'&&object.url}<img src={object.url} alt={object.caption||object.title} loading="lazy" decoding="async" referrerpolicy="no-referrer" />
  {:else}<div class="media-empty">{object.caption||'Open the original source to view its content.'}</div>{/if}
 {:else if object.kind==='audio'}
  <p>{object.caption||'Audio source'}</p>
 {:else if ['code','diff','test'].includes(object.kind)}
  <pre class:diff={object.kind==='diff'}><code>{object.body||'No recorded output.'}</code></pre>
 {:else if ['table','comparison'].includes(object.kind)}
  <table><thead><tr>{#each object.columns||[] as column}<th>{column}</th>{/each}</tr></thead><tbody>{#each (object.rows||[]).slice(tablePage*50,(tablePage+1)*50) as row}<tr>{#each row as cell}<td>{cell||'Not recorded'}</td>{/each}</tr>{/each}</tbody></table>
  {#if (object.rows?.length||0)>50}<nav aria-label="Table pages"><button disabled={tablePage===0} onclick={()=>tablePage--}>Previous rows</button><span>Page {tablePage+1} of {Math.ceil(object.rows!.length/50)}</span><button disabled={(tablePage+1)*50>=object.rows!.length} onclick={()=>tablePage++}>Next rows</button></nav>{/if}
 {:else if object.kind==='chart'}
  <div class="chart">{#each object.entries||[] as entry}<div><span>{entry.label}</span><strong>{entry.value??'—'} {entry.unit||''}</strong><meter min="0" max={max} value={Math.abs(entry.value||0)} aria-label={entry.label}></meter></div>{/each}</div>
 {:else if ['timeline','calendar','checklist','decision'].includes(object.kind)}
  <ol class:timeline={object.kind==='timeline'||object.kind==='calendar'}>{#each object.entries||[] as entry}<li><span class="dot" aria-hidden="true">{entry.done?'✓':''}</span><div><strong>{entry.label}</strong>{#if entry.start!==undefined}<time>{new Date(entry.start*60000).toLocaleString()}</time>{/if}<p>{entry.detail||''}</p></div></li>{/each}</ol>
 {:else if graph}
  <svg class="diagram" viewBox={`-20 -20 ${extent.w+40} ${extent.h+40}`} role="img" aria-label={object.title}>
   {#each object.edges||[] as edge}
    {@const a=graph.geometry.positions[edge.source]}{@const b=graph.geometry.positions[edge.target]}
    <g opacity={!active||active===edge.source||active===edge.target?1:.18}><path d={`M ${a.x+170} ${a.y+36} C ${a.x+210} ${a.y+36} ${b.x-40} ${b.y+36} ${b.x} ${b.y+36}`}/><title>{edge.label||'Recorded relationship'}</title></g>
   {/each}
   {#each object.nodes||[] as node}
    {@const p=graph.geometry.positions[node.id]}
    <g transform={`translate(${p.x},${p.y})`} role="button" tabindex="0" aria-label={node.label} onclick={()=>active=active===node.id?'':node.id} onkeydown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();active=active===node.id?'':node.id;}}} class:active={active===node.id}>
     <rect width="170" height="72" rx="12"/><foreignObject x="12" y="12" width="146" height="48"><div class="diagram-label">{node.label}</div></foreignObject><title>{node.detail||node.label}</title>
    </g>
   {/each}
  </svg>
 {:else}<div class="prose">{#if markdown}{@html markdown}{:else}{object.body||object.caption||'Waiting for recorded content.'}{/if}</div>{/if}
 </div>
 <footer class="nodrag"><span>{object.sources.length?`${object.sources.length} sources`:'Recorded result'} · Revision {object.revision}</span>{#if !focused}<button onclick={inspect}>Open <span aria-hidden="true">↗</span></button>{/if}</footer>
</article>
<style>
 .workspace-object{box-sizing:border-box;width:100%;height:100%;display:flex;flex-direction:column;padding:20px 22px;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface);color:var(--color-text);font-family:var(--font-sans);overflow:hidden}
 header,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--color-muted);flex:none}.kind{text-transform:capitalize}.state{font-size:10px}h2{font-size:23px;line-height:1.2;letter-spacing:-.025em;margin:16px 0;font-weight:650}.content{min-height:0;flex:1;overflow:auto;scrollbar-width:thin}.prose{font-size:15px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;max-width:74ch}footer{padding-top:16px}button{border:1px solid var(--color-border);background:var(--color-float);color:var(--color-text);border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--color-text);outline-offset:3px}img{width:100%;height:100%;object-fit:contain;border-radius:10px}.media-empty{display:grid;place-items:center;height:100%;min-height:120px;color:var(--color-muted);font-size:14px;background:var(--color-canvas);padding:16px;box-sizing:border-box;border-radius:10px}
 table{border-collapse:collapse;width:100%;font-size:13px;text-align:left}th,td{padding:12px;border-bottom:1px solid var(--color-border);vertical-align:top}th{color:var(--color-muted);font-weight:500}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,monospace;margin:0;padding:14px;background:var(--color-canvas);border-radius:10px}.diff{color:#aad1bc}ol{list-style:none;padding:0;margin:0}li{display:flex;gap:14px;padding:0 0 20px;font-size:14px}li strong{font-weight:550}li p,time{display:block;font-size:12px;line-height:1.5;color:var(--color-muted);margin:6px 0 0}.dot{width:10px;height:10px;flex:none;border:1px solid var(--color-muted);border-radius:50%;margin-top:4px}.timeline li{position:relative}.timeline li:not(:last-child):before{content:'';position:absolute;left:5px;top:17px;bottom:2px;width:1px;background:var(--color-border)}.chart>div{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:20px;font-size:13px}meter{width:100%;height:10px;grid-column:1/-1;accent-color:#a7cdb9}.diagram{width:100%;height:100%;min-height:180px}.diagram path{fill:none;stroke:#9299a4;stroke-width:1.6}.diagram rect{fill:var(--color-float);stroke:var(--color-border)}.diagram g.active rect,.diagram g:focus-visible rect{stroke:var(--color-text)}.diagram-label{font:13px/1.4 var(--font-sans);color:var(--color-text)}[data-detail=compact] .prose,[data-detail=compact] pre{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}[data-detail=compact] h2{font-size:27px}[data-detail=summary] .prose{display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}.focused{border:0;min-height:400px;max-height:80dvh}.focused .content{overflow:auto}.focused .prose{font-size:16px}
[data-detail=compact] footer{visibility:hidden}[data-detail=compact]:not([data-kind=image]):not([data-kind=source]) .content{visibility:hidden}footer button{min-height:36px;min-width:44px}.focused button{min-height:44px}</style>

