import {indexRoutingNodes,routeResearchStrand,routeResearchCorridorFan,routeEnvelope,type RoutingNode} from './research-routing';
import {CardIndex,intersects,stamp,sector,distance,type Hop} from './relay-graph';
import type {Rect,Point} from './route';
export type LogicalEdge={id:string;source:string;target:string;fan?:'in'|'out';summaryOnly?:boolean;detailOnly?:boolean;control?:boolean};
export type Geometry=NonNullable<ReturnType<typeof routeResearchStrand>>;
export type RoutedEdge={geometry:Geometry|null;trunk:null;relays:string[];segments:string[];hops:Hop[];fallback:boolean};
export type VisualSegment=Hop&{members:string[];startJunction?:boolean;endJunction?:boolean};
export type RoutingInput={revision:number;nodes:RoutingNode[];edges:LogicalEdge[]};
export type RoutingOutput={revision:number;paths:[string,RoutedEdge][];segments:VisualSegment[];duration:number;computed:number;reused:number};
type Cache={key:string;route:RoutedEdge;bounds:Rect};
const union=(a:Rect,b:Rect,pad=0):Rect=>{const x=Math.min(a.x,b.x)-pad,y=Math.min(a.y,b.y)-pad;return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x+pad,height:Math.max(a.y+a.height,b.y+b.height)-y+pad};};
function ends(d:string):[Point,Point]{
 let p={x:0,y:0},first=p;for(const c of d.match(/[MLCQHV][^MLCQHV]*/g)||[]){const n=(c.slice(1).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]).map(Number);p=c[0]==='H'?{x:n[0],y:p.y}:c[0]==='V'?{x:p.x,y:n[0]}:{x:n.at(-2)!,y:n.at(-1)!};if(c[0]==='M')first=p;}return [first,p];
}

/** Incremental visual projection. Junctions never become workflow/card dependencies. */
export function createRoutePlanner(){
 let previous=new Map<string,Rect>(),cache=new Map<string,Cache>();
 const fans=new Map<string,{key:string;fan:ReturnType<typeof routeResearchCorridorFan>;bounds:Rect}>();
 function* start(input:RoutingInput):Generator<void,RoutingOutput>{
  const begun=performance.now(),scene=indexRoutingNodes(input.nodes),cards=scene.cards,index=new CardIndex(cards);
  const changed:Rect[]=[];for(const id of new Set([...previous.keys(),...cards.keys()]))if(stamp(previous.get(id))!==stamp(cards.get(id))){if(previous.has(id))changed.push(previous.get(id)!);if(cards.has(id))changed.push(cards.get(id)!);}
  const edges=input.edges.filter(e=>!e.summaryOnly&&scene.bounds.has(e.source)&&scene.bounds.has(e.target)).sort((a,b)=>a.id.localeCompare(b.id));
  const paths=new Map<string,RoutedEdge>(),segments=new Map<string,VisualSegment>(),nextCache=new Map<string,Cache>();let computed=0,reused=0;
  const holders=(ids:string[])=>{const out=new Set(ids);for(const id of ids)for(let p=scene.byId.get(id)?.parentId;p;p=scene.byId.get(p)?.parentId)out.add(p);return out;};
  const hop=(edge:LogicalEdge,g:Geometry,id=edge.id):Hop=>({id,source:edge.source,target:edge.target,geometry:g,bounds:routeEnvelope(g.d),length:distance(g.s,g.t),travel:distance(g.s,g.t),sector:sector(scene.bounds.get(edge.source)!,scene.bounds.get(edge.target)!)});
  for(const edge of edges){
   const a=scene.bounds.get(edge.source)!,b=scene.bounds.get(edge.target)!,key=JSON.stringify([edge.source,edge.target,stamp(a),stamp(b)]),old=cache.get(edge.id);
   let route:RoutedEdge,bounds:Rect;
   if(old&&old.key===key&&!changed.some(r=>intersects(r,old.bounds))){route=old.route;bounds=old.bounds;reused++;}
   else{
    computed++;const excluded=holders([edge.source,edge.target]),search=union(a,b,320);
    let geometry=routeResearchStrand(a,b,index.query(search).filter(id=>!excluded.has(id)).map(id=>cards.get(id)!));
    if(geometry){const r=routeEnvelope(geometry.d);if(r.x<search.x||r.y<search.y||r.x+r.width>search.x+search.width||r.y+r.height>search.y+search.height)geometry=routeResearchStrand(a,b,[...cards].filter(([id])=>!excluded.has(id)).map(([,r])=>r));}
    const hops=geometry?[hop(edge,geometry)]:[];
    route={geometry,trunk:null,relays:[],segments:hops.map(h=>h.id),hops,fallback:!geometry};bounds=geometry?union(search,routeEnvelope(geometry.d)):search;
   }
   paths.set(edge.id,route);nextCache.set(edge.id,{key,route,bounds});yield;
  }
  const assigned=new Set<string>(),usedFans=new Set<string>();
  for(const direction of ['out','in'] as const){
   const groups=new Map<string,LogicalEdge[]>();for(const edge of edges){if(assigned.has(edge.id)||!paths.get(edge.id)?.geometry)continue;const id=direction==='out'?edge.source:edge.target;groups.set(id,[...(groups.get(id)||[]),edge]);}
   for(const [hubId,members] of groups){
    if(members.length<2)continue;const hub=scene.bounds.get(hubId)!,fanId=direction+':'+hubId;
    const leaves=members.map(e=>({id:e.id,rect:scene.bounds.get(direction==='out'?e.target:e.source)!}));
    const key=JSON.stringify([stamp(hub),leaves.map(l=>[l.id,stamp(l.rect)])]);
    const excluded=holders([hubId,...members.map(e=>direction==='out'?e.target:e.source)]);
    const old=fans.get(fanId);usedFans.add(fanId);
    let fan:ReturnType<typeof routeResearchCorridorFan>;
    if(old&&old.key===key&&!changed.some(r=>intersects(r,old.bounds)))fan=old.fan;
    else{fan=routeResearchCorridorFan(hub,leaves,[...cards].filter(([id])=>!excluded.has(id)).map(([,r])=>r),direction);let bounds=leaves.reduce((r,l)=>union(r,l.rect,0),hub);if(fan){bounds=union(bounds,routeEnvelope(fan.trunk));for(const g of fan.branches.values())bounds=union(bounds,routeEnvelope(g.d));}fans.set(fanId,{key,fan,bounds:union(bounds,bounds,320)});}
    if(!fan)continue;
    const carried=members.filter(e=>fan!.branches.has(e.id)),first=carried[0],branch=fan.branches.get(first.id)!;
    const [s,t]=ends(fan.trunk),join=direction==='out'?t:s;
    const trunkId=`junction:${fanId}:${carried.map(e=>e.id).join('|')}`;
    const trunkGeometry={...branch,s,t,d:fan.trunk,mid:{x:(s.x+t.x)/2,y:(s.y+t.y)/2}};
    segments.set(trunkId,{...hop(first,trunkGeometry,trunkId),members:carried.map(e=>e.id),startJunction:direction==='in',endJunction:direction==='out'});
    for(const edge of carried){
     const raw=fan.branches.get(edge.id)!,g={...raw,s:direction==='out'?join:raw.s,t:direction==='in'?join:raw.t};
     const h=hop(edge,g,`branch:${edge.id}`);segments.set(h.id,{...h,members:[edge.id],startJunction:direction==='out',endJunction:direction==='in'});
     const shared=segments.get(trunkId)!,hops=direction==='out'?[shared,h]:[h,shared];
     paths.set(edge.id,{geometry:{...raw,d:hops.map(h=>h.geometry.d).join(' ')},trunk:null,relays:[],segments:hops.map(h=>h.id),hops,fallback:false});assigned.add(edge.id);
    }yield;
   }
  }
  for(const [id,route] of paths)if(!assigned.has(id))for(const h of route.hops){const key=JSON.stringify([h.source,h.target,h.geometry.d]);const shared=segments.get(key);if(shared)shared.members.push(id);else segments.set(key,{...h,id:key,members:[id]});route.segments=[key];}
  for(const key of fans.keys())if(!usedFans.has(key))fans.delete(key);
  previous=cards;cache=nextCache;
  return {revision:input.revision,paths:[...paths],segments:[...segments.values()],duration:performance.now()-begun,computed,reused};
 }
 const plan=(input:RoutingInput)=>{const batch=start(input);let next=batch.next();while(!next.done)next=batch.next();return next.value;};plan.start=start;return plan;
}
