<script lang="ts">
 import {onMount,setContext} from 'svelte';
 import AdaptiveGallery from './AdaptiveGallery.svelte';
 import {adaptiveFixture} from './adaptive';
 import DesignCatalog from './DesignCatalog.svelte';
 import {CATALOG,catalogFixture} from './catalog';
 import {presentationFixture} from './presentations';
 import {learningFixture,questions} from './learning';
 import ClarificationPanel from '../ClarificationPanel.svelte';
 import {resultActionsKey} from '../objects/result-actions.svelte';
 import BrowserWindow from '../BrowserWindow.svelte';
 import {browser} from '../browser-windows.svelte';
 import {openWorkspaceObject} from '../objects/open-object';
 import type {WorkspaceObject} from '../objects/registry';
 let screen=$state(new DOMRect(16,88,innerWidth-32,innerHeight-112));
 let saved=$state<WorkspaceObject|null>(null),savedKind=$state('');
 setContext(resultActionsKey,{save:async(object:WorkspaceObject,action:string)=>{saved=object;message='Simulation: '+(action==='task'?'draft tasks':'note')+' stored in memory only';return action==='task'?{kind:'tasks_created',items:object.entries||[]}:{kind:'created',summary:{id:'fixture-note'}};},open:(kind:string)=>savedKind=kind});
 const panel=new URLSearchParams(location.search).get('panel');
 const example=new URLSearchParams(location.search).get('example')||'anchor';
 let catalogOpen=$state(false);
 let cardFamily=$state(new URLSearchParams(location.search).get('card')||'answer'),cardPreset=$state(new URLSearchParams(location.search).get('preset')||''),cardCount=$state(Number(new URLSearchParams(location.search).get('items'))||8);
 const referenceSet=['editorial','market','campaign','activity'].includes(panel||'');
 const learning=panel==='learning',clarifying=panel==='questions';
 let answers=$state<string[]>([]);
 const pending=$derived(questions[answers.length]);
 const question=$derived(pending?{kind:'question' as const,step:pending.id,part:null,state:'open' as const,prompt:pending.question,options:pending.options,answer:null}:null);
 onMount(()=>{browser.selectResearch('local-fixture');return()=>browser.selectResearch('');});
 function source(url:string,title:string,event:Event,sourceId?:string){browser.open(url,title,'fixture-source',sourceId,event);}
 function sourceEvent(event:Event){const d=(event as CustomEvent).detail;if(d?.activation?.isTrusted)source(d.url,d.title,d.activation,d.sourceId);}

 import WorkCanvas from '$features/work/components/WorkCanvas.svelte';
 import {FAMILIES,isFamily,type FamilyId} from '../designer/families';
 import {referenceFixture} from './references';
 import {workspaceFixture} from './workspaces';
 import ObjectFocus from '../objects/ObjectFocus.svelte';
 import GoogleConnections from '../GoogleConnections.svelte';
 import {fakeGoogleApi} from './google';
 import SourceStackFixture from './SourceStackFixture.svelte';
 import type {CanvasDesignerApi} from '../designer/types';
 import {pointerTool,setPointerTool} from '$features/work/lib/pointer-tool.svelte';
 const query=new URLSearchParams(location.search);
 let family=$state<FamilyId>(isFamily(query.get('aegisFixture')||'')?query.get('aegisFixture') as FamilyId:'mixed-result');
 let count=$state(Math.max(2,Math.min(100,Number(query.get('count'))||8))),api:CanvasDesignerApi|undefined;
 let message=$state('Local simulation · no AI, search or account calls');
 const references=query.get('panel')==='references';
 let videoCount=$state(Number(query.get('videos'))||3);
 const fixture=$derived.by(()=>{
  if(panel==='adaptive')return adaptiveFixture(cardFamily,cardPreset,cardCount);
  if(panel==='catalog')return catalogFixture(example);
  if(referenceSet)return presentationFixture(panel!);
  if(learning)return learningFixture();
  if(clarifying){const exchange=questions.slice(0,Math.min(questions.length,answers.length+1)).map((q,i)=>({kind:'ask',question:q.question,answer:answers[i]||null}));const item={id:'investor-prompt',type:'request',kind:'request',title:'Find investors for OpenAI and NVIDIA',status:pending?'waiting':'complete',detail:'',expanded:true,orders:true,designer:true,turns:{local:[],exchange},aegisSkills:[{name:'investor-list',title:'Investor list',status:'loaded',description:'Simulation skill metadata; no agent has run.'}],size:{width:560,height:460}};return {items:[item],objects:[],links:[],plan:{geometry:{positions:{'investor-prompt':{x:350,y:450}},sizes:{'investor-prompt':item.size},constraints:{}}}};}
  return references?referenceFixture(videoCount):workspaceFixture(family,count);
 });
 const bounds=$derived.by(()=>{const entries=Object.entries(fixture.plan.geometry.positions),x=Math.min(...entries.map(([,p])=>p.x)),y=Math.min(...entries.map(([,p])=>p.y));return {x:clarifying?x-260:x,y,width:Math.max(...entries.map(([id,p])=>p.x+fixture.plan.geometry.sizes[id].width))-x};});
 function open(id:string){const item=fixture.items.find(o=>o.id===id);if(item?.aegisObject)openWorkspaceObject(item.aegisObject);}
</script>
<svelte:window onaegis-request-result={(event:Event)=>{const id=(event as CustomEvent).detail?.id;const object=fixture.objects.find(o=>o.id===id);if(object)window.dispatchEvent(new CustomEvent("aegis-object-open",{detail:{object}}));else message="This recorded result is not present in this fixture.";}} onclickcapture={event=>browser.capture(event)} onkeydowncapture={event=>browser.capture(event)} ondblclickcapture={event=>browser.capture(event)} onresize={()=>screen=new DOMRect(16,88,innerWidth-32,innerHeight-112)} onaegis-open-source-window={sourceEvent} onaegis-object-ask={(event:Event)=>{const {object,subject}=(event as CustomEvent).detail;message="Simulation: ask about "+(subject||object.title);}}/>
<div class="fixture-workspace" data-v20-fixture={family}>
 <header><button onclick={()=>catalogOpen=!catalogOpen} aria-expanded={catalogOpen}>Design library · {CATALOG.length}</button><div><strong>AEGIS Work</strong><span>{message}</span></div><label>Examples<select value={panel||'designs'} onchange={event=>location.href=location.pathname+'?aegisFixture=mixed-result&panel='+event.currentTarget.value}><option value="catalog">All cards and layouts</option><option value="editorial">Visual direction and image picks</option><option value="market">Market map and company table</option><option value="campaign">Campaign calendar and plan</option><option value="activity">Request activity</option><option value="designs">25 workspace designs</option><option value="adaptive">AI-adaptive card library</option><option value="references">Diagrams and video stacks</option><option value="learning">Reading, video and learning plan</option><option value="questions">Clarification conversation</option></select></label><button aria-pressed={pointerTool()==='select'} onclick={()=>setPointerTool(pointerTool()==='select'?'hand':'select')}>Select / move cards</button>{#if references}<label>Videos<select bind:value={videoCount}>{#each [1,3,10] as n}<option value={n}>{n}</option>{/each}</select></label><button onclick={()=>location.href=location.pathname+'?aegisFixture=mixed-result'}>All workspace designs</button>{:else if !learning&&!clarifying&&!referenceSet&&panel!=='catalog'&&panel!=='adaptive'}<label>Design<select bind:value={family}>{#each FAMILIES as [id,label]}<option value={id}>{label}</option>{/each}</select></label><label>Objects<select bind:value={count}>{#each [5,8,20,50,100] as n}<option value={n}>{n}</option>{/each}</select></label>{/if}<button onclick={()=>{answers=[];if(api)api.setGeometry(fixture.plan.geometry);}}>Reset fixture</button></header>
 {#if panel==='adaptive'}<AdaptiveGallery family={cardFamily} preset={cardPreset} count={cardCount} onchange={(f,p,n)=>{cardFamily=f;cardPreset=p;cardCount=n;}}/>{/if}
 {#if catalogOpen}<DesignCatalog selected={panel==='catalog'?example:''} onclose={()=>catalogOpen=false}/>{/if}
 <div class="canvas">{#key family+':'+count+':'+cardFamily+':'+cardPreset+':'+cardCount}<WorkCanvas items={fixture.items as any} links={fixture.links as any} authoritative={new Set()} initialView={{positions:fixture.plan.geometry.positions,sizes:fixture.plan.geometry.sizes}} home={bounds} oninspect={()=>{}} onopen={open} onaction={(id,action)=>{message=action==='ask'?'Simulation: ask about '+id:action==='remove'?'Simulation: removal requested for '+id:action==='choose'||action==='unchoose'?'Simulation: '+action+' '+id:'Simulation: '+action;return true;}} onselectionaction={(action,ids)=>{if(action==='ask')message='Simulation: a contextual question would include '+ids.length+' selected objects.';else if(action==='remove')message='Simulation: selection retained for repeatable tests.';else message='Selected '+ids.length+' objects for the next instruction.';}} expose={exposed=>{api=exposed.designer;}}/>{/key}</div>
 <ObjectFocus onsource={(url,title,event)=>source(url,title,event)} onask={object=>message='Simulation: ask about '+object.title}/>
 {#if clarifying&&question}<div class="fixture-question"><ClarificationPanel {question} onanswer={text=>{answers=[...answers,text];message='Simulation: answer recorded locally; no research started';}}/></div>{/if}
 {#if clarifying&&!question}<div class="fixture-complete" role="status">Both answers recorded in this local fixture. No research was started.</div>{/if}
 <div class="fixture-browsers">{#each browser.shown as entry(entry.id)}<BrowserWindow {entry} bounds={screen} info={undefined} added={false}/>{/each}</div>
 {#if savedKind&&saved}<aside class="fixture-saved"><button onclick={()=>savedKind=''}>Close</button><h2>Simulation {savedKind}</h2><p>In-memory preview only</p><h3>{saved.title}</h3>{#each saved.entries||[] as entry}<p>{entry.label}<br/>{entry.detail}</p>{/each}</aside>{/if}
 {#if query.get('panel')==='stack'}<SourceStackFixture />{/if}
 {#if query.get('panel')==='google'}<aside class="fixture-account"><strong>Simulated account · no Google connection</strong><GoogleConnections api={fakeGoogleApi} onAttach={item=>message='Fixture selected: '+item.title}/></aside>{/if}
</div>
<style>.fixture-question{position:absolute;top:100px;right:16px;z-index:40}.fixture-complete{position:absolute;right:24px;top:100px;padding:20px;background:var(--color-raised);border-radius:16px}.fixture-browsers :global(.pane){pointer-events:auto}.fixture-browsers{position:fixed;inset:0;pointer-events:none;z-index:55}.fixture-saved{position:absolute;right:24px;top:100px;bottom:24px;width:420px;max-width:90vw;overflow:auto;background:var(--color-raised);padding:24px;z-index:50;border-radius:20px}.fixture-saved p{font-size:14px}.fixture-workspace{position:fixed;inset:0;background:var(--color-canvas);color:var(--color-text);font-family:var(--font-sans);display:flex;flex-direction:column}header{display:flex;gap:16px;align-items:center;padding:16px 24px;border-bottom:1px solid var(--color-border);z-index:5;background:var(--color-canvas)}header>div{margin-right:auto;display:flex;flex-direction:column;gap:5px}strong{font-size:16px}span,label{font-size:11px;color:var(--color-muted)}label{display:flex;flex-direction:column;gap:5px}select,button{background:var(--color-surface);color:var(--color-text);border:1px solid var(--color-border);padding:9px 12px;border-radius:9px;font:12px var(--font-sans)}button{cursor:pointer}.canvas{flex:1;min-height:0;position:relative}:global(.fixture-workspace .svelte-flow){background:var(--color-canvas)}@media(max-width:700px){header{padding:10px;gap:8px;flex-wrap:wrap}header>div{width:100%}select{max-width:210px}}.fixture-account{position:absolute;right:24px;top:100px;bottom:24px;width:340px;max-width:calc(100vw - 48px);padding:20px;overflow:auto;background:var(--color-raised);border:1px solid var(--color-border);border-radius:16px;z-index:10}</style>
