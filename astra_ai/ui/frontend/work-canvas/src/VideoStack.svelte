<script lang="ts">
 // Zephium's licensed Media poster, composed as an AEGIS collection.
 import {onMount,tick,untrack} from 'svelte';
 import Media from '$features/work/components/objects/Media.svelte';
 import type {CollectedVideo} from './collections';
 let {videos,id,runId}:{videos:CollectedVideo[];id:string;runId:string}=$props();
 let anchor:HTMLDivElement;let fan=$state<HTMLDivElement>();
 let startFrame=0;
 let expanded=$state(false),ready=$state(false),rect=$state(new DOMRect()),bounds=$state(new DOMRect(0,0,innerWidth,innerHeight));
 let closeTimer:ReturnType<typeof setTimeout>;
 let timer:ReturnType<typeof setTimeout>,activation:MouseEvent|undefined;
 const poster=(v:CollectedVideo)=>({id:v.id,kind:'media' as const,state:'ready' as const,media:'video' as const,url:v.url,title:v.title,channel:v.channel,poster:{src:v.thumbnail}});
 const cardWidth=$derived(Math.min(rect.width||404,Math.max(180,bounds.width-24)));
 const gap=16;
 const right=$derived(bounds.right-12-rect.left),left=$derived(rect.right-bounds.left-12);
 const reverse=$derived(right<cardWidth*2+gap&&left>right);
 const fanWidth=$derived(Math.max(cardWidth,Math.min(bounds.width-24,reverse?left:right,videos.length*(cardWidth+gap)-gap)));
 const x=$derived(Math.max(bounds.left+12,Math.min(bounds.right-12-fanWidth,reverse?rect.right-fanWidth:rect.left)));
 const y=$derived(Math.max(bounds.top+12,Math.min(rect.top,bounds.bottom-cardWidth*9/16-100)));
 function portal(node:HTMLElement){const root=anchor?.closest('.aegis-work-root')||document.body;root.append(node);return {destroy(){node.remove();}};}
 function measure(){if(!anchor?.isConnected){collapse();return;}rect=anchor.getBoundingClientRect();bounds=anchor.closest('.svelte-flow')?.getBoundingClientRect()||new DOMRect(0,0,innerWidth,innerHeight);}
 function hold(){clearTimeout(timer);}
 function leave(){hold();timer=setTimeout(()=>{if(!fan?.contains(document.activeElement))collapse();},200);}
 async function expand(focus=false){if(videos.length<2)return;clearTimeout(closeTimer);hold();measure();expanded=true;await tick();cancelAnimationFrame(startFrame);startFrame=requestAnimationFrame(()=>ready=true);if(focus)fan?.querySelector<HTMLButtonElement>('.screen')?.focus({preventScroll:true});}
 function collapse(restore=false){cancelAnimationFrame(startFrame);hold();ready=false;clearTimeout(closeTimer);closeTimer=setTimeout(()=>expanded=false,matchMedia('(prefers-reduced-motion: reduce)').matches?0:280);if(restore)anchor?.querySelector<HTMLButtonElement>('.expand')?.focus({preventScroll:true});}
 function play(video:CollectedVideo,event?:Event){
  if(!video||!event?.isTrusted)return;
  hold();clearTimeout(closeTimer);expanded=false;ready=false;
  window.dispatchEvent(new CustomEvent('aegis-open-source-window',{detail:{url:video.url,title:video.title,sourceId:video.id,control:'video-stack',activation:event}}));
 }
 function keys(event:KeyboardEvent){if(event.key==='Escape'&&expanded){event.preventDefault();event.stopPropagation();collapse(true);}}
 function scroll(event:WheelEvent){if(event.ctrlKey||event.deltaX||!fan||fan.scrollWidth<=fan.clientWidth)return;event.preventDefault();fan.scrollLeft+=(reverse?-1:1)*event.deltaY;}
 $effect(()=>{void runId;untrack(()=>{hold();clearTimeout(closeTimer);expanded=false;ready=false;});});
 onMount(()=>{let frame=0;const schedule=()=>{if(expanded&&!frame)frame=requestAnimationFrame(()=>{frame=0;measure();});};
 const resize=new ResizeObserver(schedule);resize.observe(anchor);const observer=new MutationObserver(schedule);for(const el of [anchor.closest('.svelte-flow__viewport'),anchor.closest('.svelte-flow__node')])if(el)observer.observe(el,{attributes:true,attributeFilter:['style']});window.addEventListener('resize',schedule);
 const open=(event:Event)=>{const d=(event as CustomEvent).detail;if(d?.id===id)play(videos[0],d.activation);};window.addEventListener('aegis-video-open',open);
 return()=>{hold();clearTimeout(closeTimer);cancelAnimationFrame(startFrame);cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('aegis-video-open',open);};});
</script>
<svelte:window onkeydown={keys}/>
<div role="group" aria-label="Video collection" class="video-stack work-drag-handle" data-video-stack={id} bind:this={anchor} onpointerenter={event=>{if(event.pointerType!=='touch')void expand();}} onpointerleave={leave} onfocusin={hold} onfocusout={leave}>
 {#if videos.length>1}<div class="back two" aria-hidden="true"></div><div class="back one" aria-hidden="true"></div>{/if}
 <div class="lead" class:concealed={expanded} onclickcapture={event=>activation=event}><Media object={poster(videos[0])} actions={{link:()=>play(videos[0],activation)}}/></div>
 {#if videos.length>1}<button class="expand nodrag nopan" aria-expanded={expanded} onclick={()=>expanded?collapse():expand(true)}>{videos.length} videos <span aria-hidden="true">↗</span></button>{/if}
</div>
{#if expanded}<div use:portal>
 <div class="video-fan nodrag nopan nowheel" role="group" aria-label="Videos in this stack" bind:this={fan} class:reverse style:left={x+'px'} style:top={y+'px'} style:width={fanWidth+'px'} style:height={cardWidth*9/16+100+'px'} onpointerenter={hold} onpointerleave={leave} onfocusin={hold} onfocusout={leave} onwheel={scroll}>
  <div class="extent" style:width={videos.length*(cardWidth+gap)-gap+'px'}>
   {#each videos as video,i (video.id)}<div class="fan-card" style:width={cardWidth+'px'} style:transform={'translateX('+(reverse?-1:1)*(ready?i*(cardWidth+gap):i*7)+'px)'} style:z-index={videos.length-i} onclickcapture={event=>activation=event}><Media object={poster(video)} actions={{link:()=>play(video,activation)}}/></div>{/each}
  </div>
 </div>
</div>{/if}
<style>
 .video-stack{position:relative;width:100%;color:var(--color-text)}.lead{position:relative;z-index:3}.concealed{visibility:hidden}.back{position:absolute;inset:0 0 48px;background:var(--color-raised);border:1px solid var(--color-border);border-radius:14px;pointer-events:none}.one{transform:translate(7px,-5px);z-index:2}.two{transform:translate(14px,-10px);z-index:1}.expand{display:flex;gap:10px;align-items:center;margin-top:9px;padding:5px 10px;border:0;border-radius:20px;background:var(--color-control);color:var(--color-muted);font:12px var(--font-sans);cursor:pointer;position:relative;z-index:4}.expand:focus-visible{outline:2px solid var(--color-ring);outline-offset:3px}.video-fan{position:fixed;z-index:35;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;pointer-events:auto}.extent{position:relative;height:100%}.fan-card{position:absolute;left:0;top:0;transition:transform 280ms cubic-bezier(.2,.7,.2,1);border-radius:14px;background:var(--color-canvas);padding-bottom:5px}.reverse{direction:rtl}.reverse .fan-card{direction:ltr;left:auto;right:0}@media(prefers-reduced-motion:reduce){.fan-card{transition:none}}
</style>
