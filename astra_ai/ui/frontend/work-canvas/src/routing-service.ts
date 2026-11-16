import {SvelteMap} from 'svelte/reactivity';
import type {Rect} from './route';
import {indexRoutingNodes,clearDragStrand,type RoutingNode,type RoutingScene} from './research-routing';
import {CardIndex,intersects,stamp} from './relay-graph';
import {createRoutePlanner,type LogicalEdge,type RoutedEdge,type VisualSegment,type RoutingOutput,type RoutingInput} from './routing-plan';
export const routingContext=Symbol('aegis-routing-service');
type Edge={id:string;source:string;target:string;type?:string;data?:{strand?:any;[key:string]:unknown};[key:string]:unknown};
export type RelayMember={id:string;source:string;target:string;strand:any;relays:string[]};
export type RoutingSnapshot={scene:RoutingScene;get:(id:string)=>RoutedEdge|null;measureContent:(id:string,rect:Rect)=>void};

export function createRoutingService(){
 const paths=new SvelteMap<string,RoutedEdge>(),segments=new SvelteMap<string,VisualSegment>(),selection=new SvelteMap<string,string>(),epoch=new SvelteMap<string,number>();
 const contentBounds=new SvelteMap<string,Rect>();
 const measureContent=(id:string,rect:Rect)=>{if(stamp(contentBounds.get(id))!==stamp(rect))contentBounds.set(id,rect);};
 const previews=new Map<string,VisualSegment|null>();
 let scene:RoutingScene|undefined,revision=0,signature='',worker:Worker|undefined,disposed=false;
 let pending:RoutingInput|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 const fallback=createRoutePlanner(),renderCache=new Map<string,{key:string;edge:Edge}>(),stats={passes:0,computed:0,reused:0,lastMs:0};
 let currentEdges=new Map<string,Edge>(),lastInput:RoutingInput|undefined;
 const select=(event:Event)=>{const id=(event as CustomEvent).detail?.id??'';selection.set('id',id);};
 if(typeof window!=='undefined')window.addEventListener('aegis-strand-select',select);
 function accept(output:RoutingOutput){
  if(disposed||output.revision!==revision)return;
  previews.clear();
  const ids=new Set(output.paths.map(([id])=>id));for(const id of paths.keys())if(!ids.has(id))paths.delete(id);
  for(const [id,route] of output.paths){const old=paths.get(id);if(!old||old.geometry?.d!==route.geometry?.d||old.segments.join()!==route.segments.join())paths.set(id,route);}
  const present=new Set(output.segments.map(s=>s.id));for(const id of segments.keys())if(!present.has(id))segments.delete(id);
  for(const segment of output.segments){const old=segments.get(segment.id);if(!old||old.geometry.d!==segment.geometry.d||old.members.join()!==segment.members.join())segments.set(segment.id,segment);}
  stats.passes++;stats.computed+=output.computed;stats.reused+=output.reused;stats.lastMs=output.duration;
  epoch.set('revision',revision);
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('aegis-routing-measured',{detail:{...stats,revision,nodes:scene?.bounds.size,segments:segments.size,relays:output.paths.filter(([,r])=>r.relays.length).length}}));
 }
 async function inThread(input:RoutingInput){
  const batch=fallback.start(input);let next=batch.next(),slice=performance.now();
  while(!next.done){if(disposed||input.revision!==revision)return;if(performance.now()-slice>=4){await new Promise(r=>setTimeout(r,0));slice=performance.now();}next=batch.next();}
  accept(next.value);
 }
 function schedule(){
  if(timer||disposed)return;
  timer=setTimeout(()=>{timer=undefined;if(!pending)return;const input=pending;pending=undefined;lastInput=input;if(worker)worker.postMessage(input);else void inThread(input);},16);
 }
 try{if(typeof Worker!=='undefined'){worker=new Worker(new URL('./routing.worker.ts',import.meta.url),{type:'module'});worker.onmessage=e=>accept(e.data);worker.onerror=()=>{worker?.terminate();worker=undefined;if(!pending&&lastInput)pending=lastInput;schedule();};}}catch{worker=undefined;}
 return {
  update(nodes:readonly RoutingNode[],rawEdges:readonly Edge[]):RoutingSnapshot{
   const projected=nodes.map(n=>{const visual=contentBounds.get(n.id);return visual?{...n,data:{...(n.data as object),visualBounds:visual}}:n;});
   const before=scene;scene=indexRoutingNodes(projected,before);currentEdges=new Map(rawEdges.map(e=>[e.id,e]));
   const edges:LogicalEdge[]=rawEdges.flatMap(e=>e.data?.strand?[{id:e.id,source:e.source,target:e.target,fan:e.data.strand.fan,summaryOnly:e.data.strand.summaryOnly,detailOnly:e.data.strand.detailOnly,control:e.data.strand.control}]:[]);
   const nextSignature=JSON.stringify(edges);
   if(before?.bounds!==scene.bounds||before?.cards!==scene.cards||nextSignature!==signature){
    signature=nextSignature;revision++;
    const changed=[];for(const id of new Set([...(before?.cards.keys()??[]),...scene.cards.keys()]))if(stamp(before?.cards.get(id))!==stamp(scene.cards.get(id))){if(before?.cards.has(id))changed.push(before.cards.get(id)!);if(scene.cards.has(id))changed.push(scene.cards.get(id)!);}
    const index=new CardIndex(scene.cards);
    // Touch only dirty visual sections, once per geometry update. No per-edge scene scan.
    for(const [id,segment] of segments){
     if(!segment.members.some(member=>currentEdges.has(member))){previews.set(id,null);continue;}
     if(!changed.some(r=>intersects(r,segment.bounds)))continue;
     const a=scene.cards.get(segment.source),b=scene.cards.get(segment.target);
     if(!a||!b){previews.set(id,null);continue;}
     const moved=stamp(a)!==stamp(before?.cards.get(segment.source))||stamp(b)!==stamp(before?.cards.get(segment.target));
     if(!moved){previews.set(id,null);continue;}
     const x=Math.min(a.x,b.x)-160,y=Math.min(a.y,b.y)-160;
     const box={x,y,width:Math.max(a.x+a.width,b.x+b.width)-x+160,height:Math.max(a.y+a.height,b.y+b.height)-y+160};
     const obstacles=index.query(box).filter(key=>key!==segment.source&&key!==segment.target).map(key=>scene!.cards.get(key)!);
     const geometry=clearDragStrand(a,b,obstacles,segment.geometry.from,segment.geometry.to,segment.source.localeCompare(segment.target)<0?-3:3);
     previews.set(id,geometry?{...segment,geometry}:null);
    }
    pending={revision,nodes:projected.map(n=>{const data=n.data as {visualBounds?:Rect;type?:string;aegisSkills?:unknown[];part?:{stack?:{index?:number}}}|undefined;return {id:n.id,parentId:n.parentId,position:{...n.position},width:n.measured?.width??n.width,height:n.measured?.height??n.height,hidden:n.hidden,type:n.type,data:{type:data?.type,visualBounds:data?.visualBounds,aegisSkills:data?.aegisSkills?.map(()=>null),part:data?.part?.stack?{stack:{index:data.part.stack.index}}:undefined}};}),edges};schedule();
   }
   return {scene,get:id=>paths.get(id)??null,measureContent};
  },
  renderEdges(rawEdges:readonly Edge[]):Edge[]{
   void epoch.get('revision');
   const output:Edge[]=rawEdges.filter(e=>!e.data?.strand||!paths.get(e.id)?.geometry);
   const used=new Set<string>();
   for(const settled of segments.values()){
    const segment=previews.has(settled.id)?previews.get(settled.id):settled;if(!segment)continue;
    const members:RelayMember[]=segment.members.flatMap(id=>{const e=currentEdges.get(id),s=e?.data?.strand;if(!e||!s)return [];if((s.control||s.detailOnly)&&!scene?.byId.get(e.source)?.selected&&!scene?.byId.get(e.target)?.selected&&selection.get('id')!==id)return [];return [{id,source:e.source,target:e.target,strand:s,relays:paths.get(id)?.relays??[]}];});
    if(!members.length)continue;
    const id='relay:'+segment.id,selected=members.some(m=>m.id===selection.get('id'));
    const key=segment.geometry.d+JSON.stringify(members)+selected;used.add(id);
    let cached=renderCache.get(id);
    if(!cached||cached.key!==key){cached={key,edge:{id,source:segment.source,target:segment.target,type:'relay',data:{segment,members,highlighted:selected},selectable:false,focusable:false,deletable:false}};renderCache.set(id,cached);}
    output.push(cached.edge);
   }
   for(const id of renderCache.keys())if(!used.has(id))renderCache.delete(id);
   return output;
  },
  destroy(){disposed=true;if(timer)clearTimeout(timer);worker?.terminate();contentBounds.clear();paths.clear();segments.clear();renderCache.clear();if(typeof window!=='undefined')window.removeEventListener('aegis-strand-select',select);},
 };
}
