import {indexRoutingNodes,routeResearchStrand,routeEnvelope,type RoutingNode} from './research-routing';
import {CardIndex,makeHop,relayChain,intersects,stamp,sector,center,distance,type Hop} from './relay-graph';
import type {Rect} from './route';
export type LogicalEdge={id:string;source:string;target:string;fan?:'in'|'out';summaryOnly?:boolean;detailOnly?:boolean;control?:boolean};
export type Geometry=NonNullable<ReturnType<typeof routeResearchStrand>>;
export type RoutedEdge={geometry:Geometry|null;trunk:null;relays:string[];segments:string[];hops:Hop[];fallback:boolean};
export type VisualSegment=Hop&{members:string[]};
export type RoutingInput={revision:number;nodes:RoutingNode[];edges:LogicalEdge[]};
export type RoutingOutput={revision:number;paths:[string,RoutedEdge][];segments:VisualSegment[];duration:number;computed:number;reused:number};
type HopCache={signature:string;bounds:Rect;hop:Hop|null};
type RouteCache={route:RoutedEdge;signature:string;neighborhood:string;envelope:Rect|null};
const union=(rects:Rect[]):Rect|null=>{if(!rects.length)return null;const x=Math.min(...rects.map(r=>r.x)),y=Math.min(...rects.map(r=>r.y));return {x,y,width:Math.max(...rects.map(r=>r.x+r.width))-x,height:Math.max(...rects.map(r=>r.y+r.height))-y};};
const score=(hops:Hop[])=>({longest:Math.max(0,...hops.map(h=>h.length)),travel:hops.reduce((sum,h)=>sum+h.travel,0)});

/** One worker-owned, incremental visual graph. Generator batches are cancellable. */
export function createRoutePlanner(){
 let previous=new Map<string,Rect>(),hopCache=new Map<string,HopCache>(),routeCache=new Map<string,RouteCache>();
 function* start(input:RoutingInput):Generator<void,RoutingOutput>{
  const begun=performance.now(),scene=indexRoutingNodes(input.nodes),cards=scene.cards;
  const changed:Rect[]=[];for(const id of new Set([...previous.keys(),...cards.keys()]))if(stamp(previous.get(id))!==stamp(cards.get(id))){if(previous.has(id))changed.push(previous.get(id)!);if(cards.has(id))changed.push(cards.get(id)!);}
  const index=new CardIndex(cards),eligible=new Set(input.nodes.filter(n=>{
   const data=n.data as {type?:string;part?:{stack?:{index?:number}}}|undefined;
   return !n.hidden&&cards.has(n.id)&&!['area','agent','mapgroup','input','ask'].includes(data?.type??n.type??'')&&!data?.part?.stack?.index;
  }).map(n=>n.id));
  const graph=new Map<string,Hop[]>(),nextHops=new Map<string,HopCache>();
  const exclusions=(a:string,b:string)=>{const set=new Set<string>();for(const id of [a,b])for(let p=scene.byId.get(id)?.parentId;p;p=scene.byId.get(p)?.parentId)set.add(p);return set;};
  const localHop=(a:string,b:string)=>{
   const key=JSON.stringify([a,b]),signature=stamp(cards.get(a))+'|'+stamp(cards.get(b));const old=hopCache.get(key);
   if(old&&old.signature===signature&&!changed.some(r=>intersects(r,old.bounds))){nextHops.set(key,old);return old.hop;}
   const hop=makeHop(a,b,index,exclusions(a,b));
   const bounds=union([cards.get(a)!,cards.get(b)!])!;bounds.x-=160;bounds.y-=160;bounds.width+=320;bounds.height+=320;
   nextHops.set(key,{signature,bounds,hop});return hop;
  };
  for(const id of [...eligible].sort()){
   const bins=Array(8).fill(0),list:Hop[]=[];
   for(const candidate of index.nearest(cards.get(id)!,eligible)){
    if(candidate===id)continue;const octant=sector(cards.get(id)!,cards.get(candidate)!);if(bins[octant]>=2)continue;
    const hop=localHop(id,candidate);if(hop){list.push(hop);bins[octant]++;}
   }
   graph.set(id,list);yield;
  }
  const neighborhood=(ids:string[],target:string,fallback=false)=>ids.map(id=>id+':'+(graph.get(id)??[]).filter(h=>fallback||distance(center(cards.get(h.target)!),center(cards.get(target)!))<distance(center(cards.get(id)!),center(cards.get(target)!))).map(h=>h.id+':'+h.geometry.d).join('|')).join(';');
  const edges=[...input.edges].sort((a,b)=>a.id.localeCompare(b.id)),paths:[string,RoutedEdge][]=[],nextRoutes=new Map<string,RouteCache>(),occupied:Hop[]=[];
  let computed=0,reused=0;
  for(const edge of edges){
   if(edge.summaryOnly)continue;
   const a=scene.bounds.get(edge.source),b=scene.bounds.get(edge.target);if(!a||!b)continue;
   const signature=JSON.stringify([edge.source,edge.target,stamp(a),stamp(b)]),old=routeCache.get(edge.id);
   const oldIds=old?[edge.source,...old.route.relays,edge.target]:[];
   let route:RoutedEdge;
   if(old&&old.signature===signature&&old.neighborhood===neighborhood(oldIds,edge.target,old.route.fallback)&&old.envelope&&!changed.some(r=>intersects(old.envelope!,r))){route=old.route;reused++;}
   else{
    computed++;
    let hops=eligible.has(edge.source)&&eligible.has(edge.target)?relayChain(edge.source,edge.target,graph,cards,occupied):null;
    let fallback=false;
    if(hops&&old&&!old.route.fallback){
     // A still-clear old hop may fall outside the two nearest candidates after
     // an arrival. Validate it directly before applying the 15% stability rule.
     const kept=old.route.hops.map(h=>eligible.has(h.source)&&eligible.has(h.target)?localHop(h.source,h.target):null);
     if(kept.length&&kept.every((h):h is Hop=>!!h)){
      const next=score(hops),before=score(kept),budget=2*distance(center(a),center(b));
      if(before.travel<=budget&&next.longest>before.longest*.85&&next.travel>before.travel*.85)hops=kept;
     }
    }
    if(!hops){
     fallback=true;const holders=exclusions(edge.source,edge.target);
     const geometry=routeResearchStrand(a,b,[...cards].filter(([id])=>id!==edge.source&&id!==edge.target&&!holders.has(id)).map(([,r])=>r));
     if(geometry)hops=[{id:JSON.stringify([edge.source,edge.target,geometry.from,geometry.to,'fallback']),source:edge.source,target:edge.target,geometry,bounds:routeEnvelope(geometry.d),length:distance(geometry.s,geometry.t),travel:distance(center(a),center(b)),sector:sector(a,b)}];
    }
    const all=hops??[];
    route={geometry:all.length?{...all[0]!.geometry,t:all.at(-1)!.geometry.t,to:all.at(-1)!.geometry.to,d:all.map(h=>h.geometry.d).join(' ')}:null,trunk:null,relays:all.slice(0,-1).map(h=>h.target),segments:all.map(h=>h.id),hops:all,fallback};
   }
   paths.push([edge.id,route]);occupied.push(...route.hops);
   nextRoutes.set(edge.id,{route,signature,neighborhood:neighborhood([edge.source,...route.relays,edge.target],edge.target,route.fallback),envelope:union(route.hops.map(h=>h.bounds))});yield;
  }
  const segments=new Map<string,VisualSegment>();
  for(const [id,route] of paths)for(const hop of route.hops){const existing=segments.get(hop.id);if(existing)existing.members.push(id);else segments.set(hop.id,{...hop,members:[id]});}
  previous=cards;hopCache=nextHops;routeCache=nextRoutes;
  return {revision:input.revision,paths,segments:[...segments.values()],duration:performance.now()-begun,computed,reused};
 }
 const plan=(input:RoutingInput)=>{const batch=start(input);let next=batch.next();while(!next.done)next=batch.next();return next.value;};
 plan.start=start;return plan;
}
