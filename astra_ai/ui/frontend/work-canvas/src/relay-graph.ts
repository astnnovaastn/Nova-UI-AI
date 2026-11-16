import {clearDragStrand, routeEnvelope, type PortSide} from './research-routing';
import type {Point, Rect} from './route';
export const center=(r:Rect):Point=>({x:r.x+r.width/2,y:r.y+r.height/2});
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export const intersects=(a:Rect,b:Rect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export const stamp=(r:Rect|undefined)=>r?`${r.x},${r.y},${r.width},${r.height}`:'';
export const gap=(a:Rect,b:Rect)=>Math.hypot(Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width),Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height));
const envelope=(a:Rect,b:Rect,pad=160):Rect=>{const x=Math.min(a.x,b.x)-pad,y=Math.min(a.y,b.y)-pad;return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x+pad,height:Math.max(a.y+a.height,b.y+b.height)-y+pad};};

/** A scene-level grid, reused for candidate neighborhoods and curve collision queries. */
export class CardIndex {
  private cells=new Map<string,Set<string>>();
  constructor(readonly cards:Map<string,Rect>,private cell=320){
    for(const [id,r] of cards)for(const key of this.keys(r)){const ids=this.cells.get(key)??new Set<string>();ids.add(id);this.cells.set(key,ids);}
  }
  private *keys(r:Rect){for(let x=Math.floor(r.x/this.cell);x<=Math.floor((r.x+r.width)/this.cell);x++)for(let y=Math.floor(r.y/this.cell);y<=Math.floor((r.y+r.height)/this.cell);y++)yield x+','+y;}
  query(r:Rect){const ids=new Set<string>();for(const key of this.keys(r))for(const id of this.cells.get(key)??[])if(intersects(r,this.cards.get(id)!))ids.add(id);return [...ids];}
  nearest(r:Rect,eligible:Set<string>){
    // Traverse occupied cells in distance order; each card is considered once, not once per edge.
    const cells=[...this.cells].sort(([a],[b])=>{const rect=(k:string)=>{const [x,y]=k.split(',').map(Number);return {x:x!*this.cell,y:y!*this.cell,width:this.cell,height:this.cell};};return gap(r,rect(a))-gap(r,rect(b));});
    const seen=new Set<string>();const result:string[]=[];
    for(const [,ids] of cells)for(const id of ids)if(eligible.has(id)&&!seen.has(id)){seen.add(id);result.push(id);}
    return result.sort((a,b)=>gap(r,this.cards.get(a)!)-gap(r,this.cards.get(b)!)||a.localeCompare(b));
  }
}
export type Hop={id:string;source:string;target:string;geometry:NonNullable<ReturnType<typeof clearDragStrand>>;bounds:Rect;length:number;travel:number;sector:number};
export const sector=(a:Rect,b:Rect)=>{const p=center(a),q=center(b);return (Math.round(Math.atan2(q.y-p.y,q.x-p.x)/(Math.PI/4))+8)%8;};

function cuts(a:Point,b:Point,r:Rect){
  let lo=0,hi=1;for(const [p,d,min,max] of [[a.x,b.x-a.x,r.x-8,r.x+r.width+8],[a.y,b.y-a.y,r.y-8,r.y+r.height+8]]){
    if(!d){if(p!<=min!||p!>=max!)return false;continue;}
    const t1=(min!-p!)/d!,t2=(max!-p!)/d!;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>=hi)return false;
  }return lo<hi;
}
export function makeHop(source:string,target:string,index:CardIndex,exclude:Set<string>=new Set()):Hop|null{
  const a=index.cards.get(source)!,b=index.cards.get(target)!;
  if(!a||!b||intersects(a,b))return null;
  const p=center(a),q=center(b),dx=q.x-p.x,dy=q.y-p.y;
  const side:PortSide=Math.abs(dx)/(a.width+b.width)>=Math.abs(dy)/(a.height+b.height)?(dx>=0?'right':'left'):(dy>=0?'bottom':'top');
  const opposite={right:'left',left:'right',top:'bottom',bottom:'top'} as const;
  const blockers=index.query(envelope(a,b)).filter(id=>id!==source&&id!==target&&!exclude.has(id)).map(id=>index.cards.get(id)!);
  // A direct local hop may not bypass a card sitting between its endpoints.
  if(blockers.some(r=>cuts(p,q,r)))return null;
  const offset=source.localeCompare(target)<0?-3:3;
  const geometry=clearDragStrand(a,b,blockers,side,opposite[side],offset,offset);
  if(!geometry)return null;
  return {id:JSON.stringify([source,target,geometry.from,geometry.to]),source,target,geometry,bounds:routeEnvelope(geometry.d),length:distance(geometry.s,geometry.t),travel:distance(p,q),sector:sector(a,b)};
}

type Label={at:string;path:Hop[];visited:Set<string>;longest:number;travel:number;bends:number;crossings:number};
const compare=(a:Label,b:Label)=>a.longest-b.longest||a.travel-b.travel||a.bends-b.bends||a.crossings-b.crossings||a.path.map(h=>h.target).join().localeCompare(b.path.map(h=>h.target).join());
const crosses=(a:Hop,b:Hop)=>{
  if([a.source,a.target].some(id=>id===b.source||id===b.target))return false;
  const turn=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const p=a.geometry.s,q=a.geometry.t,r=b.geometry.s,s=b.geometry.t;
  return turn(p,q,r)*turn(p,q,s)<0&&turn(r,s,p)*turn(r,s,q)<0;
};
/** Complete-chain search with a travel budget. Relays are never processing dependencies. */
export function relayChain(source:string,target:string,graph:Map<string,Hop[]>,cards:Map<string,Rect>,occupied:Hop[]):Hop[]|null{
  const goal=center(cards.get(target)!),origin=center(cards.get(source)!);const budget=2*distance(origin,goal);
  const neighbors=graph.get(source)??[];
  const closest=neighbors.filter(h=>distance(center(cards.get(h.target)!),goal)<distance(origin,goal)).sort((a,b)=>a.length-b.length||a.target.localeCompare(b.target))[0];
  if(closest?.target===target)return [closest];
  for(const progressOnly of [true,false]){
    const queue:Label[]=[{at:source,path:[],visited:new Set([source]),longest:0,travel:0,bends:0,crossings:0}];const labels=new Map<string,Label[]>();let work=0;
    while(queue.length&&work++<12000){
      queue.sort(compare);const current=queue.shift()!;if(current.at===target)return current.path;
      for(const hop of graph.get(current.at)??[]){
        if(current.visited.has(hop.target)||current.travel+hop.travel>budget+.01)continue;
        if(progressOnly&&distance(center(cards.get(hop.target)!),goal)>=distance(center(cards.get(current.at)!),goal)-.01)continue;
        const next:Label={at:hop.target,path:[...current.path,hop],visited:new Set([...current.visited,hop.target]),longest:Math.max(current.longest,hop.length),travel:current.travel+hop.travel,bends:current.bends+(current.path.length&&current.path.at(-1)!.sector!==hop.sector?1:0),crossings:current.crossings+occupied.filter(old=>crosses(hop,old)).length};
        const old=labels.get(next.at)??[];
        if(old.some(l=>l.longest<=next.longest&&l.travel<=next.travel&&l.bends<=next.bends&&l.crossings<=next.crossings&&[...l.visited].every(id=>next.visited.has(id))))continue;
        const retained=old.filter(l=>!(next.longest<=l.longest&&next.travel<=l.travel&&next.bends<=l.bends&&next.crossings<=l.crossings&&[...next.visited].every(id=>l.visited.has(id))));
        retained.push(next);retained.sort(compare);if(retained.indexOf(next)>=16)continue;labels.set(next.at,retained.slice(0,16));queue.push(next);
      }
    }
  }return null;
}
