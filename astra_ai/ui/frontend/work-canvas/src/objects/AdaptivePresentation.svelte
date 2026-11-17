<script lang="ts">
 import ObjectView from '$features/work/components/objects/ObjectView.svelte';
 import ObjectCentre from '$features/work/components/objects/ObjectCentre.svelte';
 import MetricPanels from './MetricPanels.svelte';
 import {zephiumObject} from './zephium-object';
 import {admittedPreset} from './adaptive-catalog';
 import {safeUrl,type WorkspaceObject} from './registry';
 let {object,focused=false,actions}:{object:WorkspaceObject;focused?:boolean;actions:{open?:()=>void;link?:(url:string)=>void;ask?:(subject:string)=>void}}=$props();
 const preset=$derived(admittedPreset(object.family||'',object.preset||''));
 const treatment=$derived(preset?.treatment||'reading');
 const layout=$derived(preset?.arrangement||0);
 const recipe=$derived('recipe' in (preset||{})?(preset as any).recipe:'');
 const mode=$derived('mode' in (preset||{})?(preset as any).mode:'');
 let page=$state(0),selected=$state(''),tab=$state('content');
 const textFamily=$derived(['answer','report','document','note','draft'].includes(object.kind));
 const sections=$derived((object.body||'').split(/\n(?=##? )/).filter(Boolean).map((body,i)=>({id:'section-'+i,title:body.match(/^#{1,3}\s+([^\n]+)/)?.[1]||'Section '+(i+1),body:body.replace(/^#{1,3}[^\n]*\n?/,''),revision:object.revision,status:object.status,kind:'document' as const,sources:[]})));
 const pageSize=$derived(focused?50:treatment==='overview'?4:8);
 const media=$derived(object.media?.length?object.media:object.url&&['image','video','source'].includes(object.kind)?[{id:object.id,url:object.url,kind:object.kind,title:object.title}]:[]);
 const count=$derived(Math.max(object.nodes?.length||0,object.entries?.length||0,object.rows?.length||0,object.recommendations?.length||0,media.length));
 const pageCount=$derived(Math.max(1,Math.ceil(count/pageSize)));
 const effectivePage=$derived(Math.min(page,pageCount-1));
 const start=$derived(effectivePage*pageSize);
 const projected=$derived({...object,
  entries:object.entries?.slice(start,start+pageSize),rows:object.rows?.slice(start,start+pageSize),
  nodes:object.nodes?.slice(start,start+pageSize),edges:object.edges?.filter(e=>object.nodes?.slice(start,start+pageSize).some(n=>n.id===e.source)&&object.nodes?.slice(start,start+pageSize).some(n=>n.id===e.target)),
  recommendations:object.recommendations?.slice(start,start+pageSize),
  ...(object.kind==='chart'?{chartKind:layout===2?'line' as const:layout===3?'area' as const:object.chartKind||'bars' as const,orientation:layout===1?'vertical' as const:object.orientation}:{}),
  ...(object.kind==='diagram'&&layout===1?{diagramDirection:'down' as const}:{})});
 const drawn=$derived(zephiumObject(projected));
 const visibleMedia=$derived(media.slice(start,start+pageSize));
 const blocks=$derived(object.blocks||[]);
 const figures=$derived(blocks.filter(b=>b.kind==='figure'));
 const prose=$derived(blocks.filter(b=>b.kind!=='figure'&&b.kind!=='image'));
 const inspected=$derived(object.provenance?.filter(p=>!selected||p.path.includes(selected))||[]);
 function link(url:string){if(safeUrl(url))actions.link?.(url);}
</script>
<article class="adaptive" data-preset={object.preset} data-layout={layout} data-treatment={treatment} data-recipe={recipe} data-mode={mode} data-tab={tab} class:focused aria-label={object.title}>
 <header><span>{object.status==='partial'?'In progress':object.status==='needs-review'?'Needs review':'Recorded result'}</span><span>Revision {object.revision}</span></header>
 {#if mode==='tabs'}<nav class="tabs nodrag" aria-label="Result sections">{#each ['content','evidence','media','figures'] as name}<button aria-pressed={tab===name} onclick={()=>tab=name}>{name}</button>{/each}</nav>{/if}
 {#if recipe==='reading-index'&&textFamily}<nav class="reading-index nodrag" aria-label="Section index">{#each sections as section}<button onclick={()=>document.getElementById(object.id+'-'+section.id)?.scrollIntoView({block:'nearest',behavior:'instant'})}>{section.title}</button>{/each}</nav>{/if}
 <div class="composition">
  <section class="primary" aria-label="Result content">
   {#if ['image','video','source'].includes(object.kind)}<h2>{object.title}</h2>{/if}
   {#if mode==='sections'&&textFamily}<h2>{object.title}</h2><div class="reading-sections">{#each sections as section,i(section.id)}<section id={object.id+'-'+section.id}>{#if ['accordion-dossier','question-led'].includes(recipe)}<details class="nodrag" open={i===0}><summary>{section.title}</summary><ObjectView object={zephiumObject(section)!} {actions}/></details>{:else}{#if recipe==='numbered-sequence'}<span class="step-number">{i+1}</span>{/if}<ObjectView object={zephiumObject(section)!} {actions}/>{/if}</section>{/each}</div>
   {:else if object.metricPanels?.length}<MetricPanels {object}/>{:else if drawn&&!['image','video','source'].includes(object.kind)}
    {#if focused}<ObjectCentre object={drawn} {actions}/>{:else}<ObjectView object={drawn} {actions}/>{/if}
   {:else if !media.length}<h2>{object.title}</h2><p>Content is still being prepared.</p>{/if}
   {#each prose as block(block.id)}
    {#if block.kind==='heading'}<h3>{block.text}</h3>{:else if block.kind==='quote'}<blockquote>{block.text}</blockquote>{:else if block.kind==='bullets'}<ul>{#each block.items||[] as item}<li>{item}</li>{/each}</ul>{:else}<p>{block.text}</p>{/if}
   {/each}
  </section>
  {#if figures.length}<section class="figures" aria-label="Key figures">{#each figures as figure(figure.id)}<div><strong>{figure.value??'Unknown'}</strong><span>{figure.label}</span>{#if figure.text}<small>{figure.text}</small>{/if}</div>{/each}</section>{/if}
  {#if visibleMedia.length||blocks.some(b=>b.kind==='image')}<section class="media" aria-label="Referenced media">
   {#each visibleMedia as item(item.id)}<button class="media-item nodrag" onclick={()=>link(item.url)} aria-label={'Open '+(item.title||object.title)}>
    {#if item.kind==='image'||item.thumbnail}<img src={safeUrl(item.thumbnail||item.url)} alt={item.caption||item.title||''} loading="lazy"/>{:else}<span class="media-symbol" aria-hidden="true">{item.kind==='video'?'▶':'↗'}</span>{/if}
    <strong>{item.title||object.title}</strong>{#if item.caption}<span>{item.caption}</span>{/if}
   </button>{/each}
   {#each blocks.filter(b=>b.kind==='image') as block(block.id)}{#if safeUrl(block.url)}<figure><img src={block.url} alt={block.text||''} loading="lazy"/><figcaption>{block.text}</figcaption></figure>{/if}{/each}
  </section>{/if}
  {#if object.sources.length||object.provenance?.length}<aside class="evidence" aria-label="Evidence and provenance">
   {#if treatment==='evidence'||focused}<h3>Evidence</h3>{#each object.sources as source(source.id)}<button class="nodrag" onclick={()=>source.url&&link(source.url)} disabled={!source.url}>{source.id} · {source.title}</button>{/each}
    {#each inspected as reference}<details class="nodrag"><summary>{reference.basis} · {reference.path}</summary><p>{reference.source_ids.join(', ')||'No external source claimed'}</p>{#if reference.calculation}<p>{reference.calculation}</p>{/if}</details>{/each}
   {:else}<span>{object.sources.length} recorded sources</span>{/if}
  </aside>{/if}
 </div>
 {#if (treatment==='inspection'||mode==='inspection')&&(object.nodes?.length||object.entries?.length)}<details class="inspector nodrag" open={mode==='inspection'}><summary>Inspect an item</summary><label>Item<select bind:value={selected}><option value="">All items</option>{#each object.nodes||object.entries||[] as item(item.id)}<option value={item.id}>{item.label}</option>{/each}</select></label>{#each (object.nodes||object.entries||[]).filter(i=>i.id===selected) as item}<h3>{item.label}</h3><p>{item.detail||'No additional detail recorded.'}</p><button onclick={()=>actions.ask?.(item.label)}>Ask about this item</button>{/each}</details>{/if}
 {#if object.edges?.length&&projected.edges?.length!==object.edges.length}<p class="relationship-note">{object.edges.length-projected.edges!.length} relationships include items outside this page. All {object.edges.length} relationships remain in the recorded object.</p>{/if}
 {#if count>pageSize}<footer class="nodrag"><span>{start+1}–{Math.min(start+pageSize,count)} of {count}</span>{#if focused}<button disabled={effectivePage===0} onclick={()=>page=Math.max(0,effectivePage-1)}>Previous</button><button disabled={effectivePage>=pageCount-1} onclick={()=>page=effectivePage+1}>Next</button>{:else}<button onclick={()=>actions.open?.()}>Open all {count}</button>{/if}</footer>{/if}
</article>
<style>
 .adaptive{font:15px/1.55 var(--font-sans);color:var(--color-text);width:100%;box-sizing:border-box}.adaptive>header{display:flex;justify-content:space-between;color:var(--color-muted);font-size:11px;margin-bottom:12px}.composition{display:grid;gap:20px;grid-template-columns:minmax(0,1fr);grid-template-areas:'primary' 'figures' 'media' 'evidence'}.primary{grid-area:primary;min-width:0}.figures{grid-area:figures;display:flex;flex-wrap:wrap;gap:24px}.figures div{display:flex;flex-direction:column}.figures strong{font-size:28px;line-height:1.2}.figures span,.figures small{color:var(--color-muted);font-size:12px}.media{grid-area:media;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}.media-item{display:flex;flex-direction:column;gap:8px;text-align:start;padding:0;overflow:hidden;background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px}.media-item strong,.media-item>span:not(.media-symbol){padding:0 12px 12px}.media-symbol{display:grid;place-items:center;font-size:32px;min-height:140px;width:100%;background:var(--color-control)}img{width:100%;max-height:300px;object-fit:contain}.evidence{grid-area:evidence;min-width:0;font-size:12px;color:var(--color-muted)}.evidence button{display:block;text-align:start;margin:8px 0;max-width:100%;overflow-wrap:anywhere}h2{font-size:24px;line-height:1.25;margin:0 0 16px}h3{font-size:16px;margin:16px 0 8px}p{max-width:72ch;margin:8px 0}blockquote{margin:16px 0;border-left:2px solid var(--color-border);padding-left:16px}figure{margin:0}button,select{font:inherit;color:inherit;background:var(--color-control);border:1px solid var(--color-border);border-radius:8px;padding:6px 10px;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--color-ring);outline-offset:3px}footer{display:flex;align-items:center;gap:12px;padding-top:16px;font-size:12px;color:var(--color-muted)}footer span{margin-right:auto}.inspector{padding-top:16px}summary{cursor:pointer}.inspector label{display:flex;gap:16px;margin:16px 0}details p{overflow-wrap:anywhere}
 .adaptive[data-layout='1'] .composition{grid-template-columns:minmax(0,2fr) minmax(180px,1fr);grid-template-areas:'primary figures' 'primary media' 'primary evidence'}
 .adaptive[data-layout='2'] .composition{grid-template-areas:'figures' 'primary' 'evidence' 'media'}
 .adaptive[data-layout='3'] .composition{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:'media media' 'primary figures' 'primary evidence'}
 .adaptive[data-layout='4'] .composition{grid-template-columns:minmax(180px,1fr) minmax(0,2fr);grid-template-areas:'figures primary' 'evidence primary' 'media primary'}
 .adaptive[data-treatment='overview']:not(.focused) .primary{max-height:280px;overflow:hidden}.adaptive[data-treatment='evidence'] .evidence{border-top:1px solid var(--color-border);padding-top:12px}.primary :global(.page){min-height:0!important}.primary :global(.sheet){max-width:100%}.adaptive:not(.focused) :global(*){scrollbar-width:none}.adaptive:not(.focused) .primary{overflow:hidden}.adaptive :global(.centre){padding:0}
 @media(max-width:700px){.adaptive .composition{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'primary' 'figures' 'media' 'evidence'!important}.media{grid-template-columns:1fr}}
 .tabs,.reading-index{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.tabs button{text-transform:capitalize}.tabs [aria-pressed=true]{background:var(--color-surface);border-color:var(--color-text)}.reading-sections{display:grid;gap:24px}.step-number{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--color-control);margin-bottom:12px}.relationship-note{font-size:12px;color:var(--color-muted)}
 .adaptive[data-recipe='reading-rail'] .composition{grid-template-columns:minmax(0,3fr) minmax(160px,1fr);grid-template-areas:'primary evidence' 'figures evidence' 'media evidence'}
 .adaptive[data-recipe='evidence-ledger'] .composition{grid-template-columns:minmax(120px,1fr) minmax(0,3fr) minmax(120px,1fr);grid-template-areas:'evidence primary figures' 'evidence media figures'}
 .adaptive[data-recipe='summary-hero'] .composition{grid-template-areas:'figures' 'primary' 'media' 'evidence';grid-template-columns:1fr}.adaptive[data-recipe='summary-hero'] .figures{padding:20px 0;border-bottom:1px solid var(--color-border)}
 .adaptive[data-recipe='media-study'] .composition{grid-template-columns:minmax(0,3fr) minmax(0,2fr);grid-template-areas:'media primary' 'media figures' 'evidence evidence'}
 .adaptive[data-recipe='item-inspector'] .composition{grid-template-columns:minmax(0,2fr) minmax(180px,1fr);grid-template-areas:'primary media' 'evidence figures'}
 .adaptive[data-recipe='section-spread'] .reading-sections,.adaptive[data-recipe='finding-grid'] .reading-sections{grid-template-columns:repeat(2,minmax(0,1fr))}.adaptive[data-recipe='finding-grid'] .reading-sections>section{background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:16px}
 .adaptive[data-recipe='numbered-sequence'] .reading-sections>section{border-left:1px solid var(--color-border);padding-left:20px}.adaptive[data-recipe='accordion-dossier'] .reading-sections>section{border-bottom:1px solid var(--color-border);padding-bottom:12px}
 .adaptive[data-mode='tabs'] .composition{display:block}.adaptive[data-mode='tabs'][data-tab='content'] .composition>:not(.primary),.adaptive[data-mode='tabs'][data-tab='evidence'] .composition>:not(.evidence),.adaptive[data-mode='tabs'][data-tab='media'] .composition>:not(.media),.adaptive[data-mode='tabs'][data-tab='figures'] .composition>:not(.figures){display:none}
 .adaptive[data-recipe='comparison-spread'] .composition{grid-template-columns:minmax(120px,1fr) minmax(0,3fr) minmax(160px,1fr);grid-template-areas:'figures primary evidence' 'media media evidence'}
 .adaptive[data-recipe='stacked-exhibits'] .composition{grid-template-columns:1fr;grid-template-areas:'media' 'primary' 'figures' 'evidence'}.adaptive[data-recipe='stacked-exhibits'] .media{grid-template-columns:1fr}
 .adaptive[data-recipe='reading-index'] .reading-index{border-bottom:1px solid var(--color-border);padding-bottom:16px}.adaptive[data-recipe='question-led'] summary{font-size:18px;font-weight:600;margin-bottom:12px}
 .adaptive[data-recipe='metrics-first'] .composition{grid-template-columns:minmax(160px,1fr) minmax(0,3fr);grid-template-areas:'figures primary' 'figures media' 'evidence evidence'}.adaptive[data-recipe='metrics-first'] .figures{flex-direction:column}.adaptive[data-recipe='metrics-first'] .figures strong{font-size:36px}
 .adaptive[data-recipe='two-column-brief'] .reading-sections{display:block;columns:2;column-gap:32px}.adaptive[data-recipe='two-column-brief'] .reading-sections>section{break-inside:avoid;margin-bottom:24px}
 .adaptive[data-recipe='source-first'] .composition{grid-template-columns:1fr;grid-template-areas:'evidence' 'primary' 'figures' 'media'}.adaptive[data-recipe='source-first'] .evidence{border-bottom:1px solid var(--color-border);padding-bottom:16px}
 .adaptive[data-recipe='media-contact-sheet'] .composition{grid-template-columns:1fr;grid-template-areas:'media' 'figures' 'primary' 'evidence'}.adaptive[data-recipe='media-contact-sheet'] .media{grid-template-columns:repeat(3,minmax(0,1fr))}.adaptive[data-recipe='media-contact-sheet'] img{max-height:140px}
 .adaptive[data-recipe='decision-dossier'] .primary{border:1px solid var(--color-border);border-radius:16px;padding:20px}.adaptive[data-recipe='focused-exhibit'] .composition{grid-template-columns:1fr;grid-template-areas:'primary' 'media' 'figures' 'evidence'}
</style>
