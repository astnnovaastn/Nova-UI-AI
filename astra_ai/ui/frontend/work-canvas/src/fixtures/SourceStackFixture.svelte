<script lang="ts">
 import {onMount} from 'svelte';
 import PartRow from '$features/work/components/run/PartRow.svelte';
 import SourceStackOverlay from '../SourceStackOverlay.svelte';
 import {installPreviewProvider,savedDataProvider} from '../preview-provider';
 const query=new URLSearchParams(location.search);
 const count=Math.max(1,Math.min(10,Number(query.get('pages'))||3));
 const width=Number(query.get('sourceWidth'))===336?336:404;
 const pages=Array.from({length:count},(_,i)=>({id:'fixture-page-'+(i+1),title:'Fixture page '+(i+1)+' · Source inspection',url:'https://example.org/fixture/'+(i+1),frame:i===count-1?null:'/fixtures/v20/reference.png'}));
 const item={id:'fixture-stack',type:'part',aegisSourceWidth:width,part:{title:'Supplied reference pages',shape:'pages',state:'complete',pages:[...pages].reverse(),...(count>1?{stack:{id:'fixture-stack',count,open:false}}:{})}};
 let anchor=$state<HTMLElement|null>(null),bounds=$state<DOMRect|null>(null),focusFirst=$state(false),closing=$state(false),opened=$state('No source selected'),timer:ReturnType<typeof setTimeout>;
 function hold(){clearTimeout(timer);closing=false;}
 function leave(){clearTimeout(timer);timer=setTimeout(close,180);}
 function close(){closing=true;timer=setTimeout(()=>{anchor=null;closing=false;},280);}
 onMount(()=>{
  installPreviewProvider(savedDataProvider(new Map(pages.map(p=>[p.url,{title:p.title,excerpt:'Synthetic source metadata for readability and interaction checks. The image is a supplied design reference, not a website capture.',retrieval:'fixture'}]))));
  const gesture=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.id!==item.id)return;if(d.kind==='leave'){leave();return;}hold();anchor=d.anchor;bounds=new DOMRect(0,0,innerWidth,innerHeight);focusFirst=d.kind==='toggle';};
  window.addEventListener('aegis-source-stack',gesture);
  return()=>{window.removeEventListener('aegis-source-stack',gesture);clearTimeout(timer);installPreviewProvider(savedDataProvider(new Map()));};
 });
</script>
<div class="source-fixture">
 <p>Production source components · {width}px · synthetic records</p>
 <div style:width={width+170+'px'} style:height={width*10/16+80+'px'}><PartRow item={item as any} selected={false} onopen={id=>opened=pages.find(p=>p.id===id)?.url||''} onlist={()=>{}}/></div>
 <output>{opened}</output>
</div>
{#if anchor&&bounds}<SourceStackOverlay {anchor} {bounds} {pages} title="Fixture source stack" {focusFirst} {closing} onhold={hold} onleave={leave} onclose={close} onopen={page=>opened=page.url}/>{/if}
<style>.source-fixture{position:absolute;inset:110px auto auto 50px;z-index:10;background:var(--color-canvas);padding:20px 20px 50px;border:1px solid var(--color-border);border-radius:14px}.source-fixture p{font:12px var(--font-sans);color:var(--color-muted);margin:0 0 20px}.source-fixture output{position:absolute;bottom:15px;left:20px;font:12px var(--font-sans)}</style>

