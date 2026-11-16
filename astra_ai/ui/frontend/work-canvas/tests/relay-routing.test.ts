import {describe,it,expect} from 'vitest';
// Production policy: design and upstream sync must preserve nearby-card relay chains.
import {createRoutePlanner,type LogicalEdge} from '../src/routing-plan';
import {CardIndex,makeHop,relayChain} from '../src/relay-graph';
import type {RoutingNode} from '../src/research-routing';
const card=(id:string,x:number,y:number,width=200,height=100):RoutingNode=>({id,position:{x,y},width,height,data:{type:'agentcard'}});
const edge=(source:string,target:string,id=source+'-'+target):LogicalEdge=>({id,source,target});
const run=(nodes:RoutingNode[],edges:LogicalEdge[])=>createRoutePlanner()({revision:1,nodes,edges});
describe('nearby-card visual relays',()=>{
 it('enters Search before Discovery instead of going around Search',()=>{
  const result=run([card('plan',0,0,200,500),card('search',0,650),card('discovery',0,850)],[edge('plan','discovery')]);
  const route=result.paths[0]![1];expect(route.relays).toEqual(['search']);expect(route.fallback).toBe(false);
  expect(route.hops[0]!.geometry.t.y).toBe(650);expect(route.hops[1]!.geometry.s.y).toBe(750);
 });
 it('routes lower website rows through nearby website cards to analysis',()=>{
  const nodes=[card('nvidia',0,0),card('sequoia',350,0),card('britannica',0,250),card('data',350,250),card('qz',0,500),card('analysis',700,200)];
  const result=run(nodes,[edge('qz','analysis')]);const route=result.paths[0]![1];
  expect(route.relays).toEqual(['britannica','data']);expect(route.fallback).toBe(false);
  expect(route.hops.every(h=>h.geometry.d.includes('C'))).toBe(true);
 });
 it('uses cards near the pipeline to reach the final collection',()=>{
  const nodes=[card('pipeline',0,700,700,100),card('site',650,450),card('video',950,300),card('results',1250,120)];
  const route=run(nodes,[edge('pipeline','results')]).paths[0]![1];
  expect(route.relays).toEqual(['site','video']);expect(route.fallback).toBe(false);
 });
 it('is invariant to names, translations and reversed direction',()=>{
  const nodes=[card('x',40,30),card('y',390,30),card('z',740,30)];
  const forward=run(nodes,[edge('x','z')]).paths[0]![1],reverse=run(nodes,[edge('z','x')]).paths[0]![1];
  expect(forward.relays).toEqual(['y']);expect(reverse.relays).toEqual(['y']);
  expect(forward.hops[0]!.geometry.s.y).not.toBe(reverse.hops[1]!.geometry.t.y);
 });
 it('keeps direct neighbors and empty gaps direct',()=>{
  for(const x of [240,2500]){const route=run([card('a',0,0),card('b',x,0)],[edge('a','b')]).paths[0]![1];expect(route.relays).toEqual([]);expect(route.geometry).toBeTruthy();}
 });
 it('retains every logical dependency while merging shared sections',()=>{
  const nodes=[card('a',0,0),card('b',350,0),card('c',700,0),card('d',1050,0)];
  const edges=[edge('a','d','full'),edge('b','d','partial'),edge('a','c','other')];const original=JSON.stringify(edges);
  const result=run(nodes,edges);expect(JSON.stringify(edges)).toBe(original);
  expect(result.segments.find(s=>s.source==='b'&&s.target==='c')!.members.sort()).toEqual(['full','other','partial']);
  expect(result.paths.find(([id])=>id==='full')![1].relays).toEqual(['b','c']);
 });
 it('allows six dependencies to share one relay section without inventing relations',()=>{
  const nodes=[card('a',0,0),card('b',350,0),card('c',700,0)];
  const result=run(nodes,Array.from({length:6},(_,i)=>edge('a','c','relation'+i)));
  expect(result.segments).toHaveLength(2);expect(result.segments.every(s=>s.members.length===6)).toBe(true);
 });
 it('does not use decorations or expanded presentation pages as relays',()=>{
  const nodes=[card('a',0,0),card('overlay',350,0),card('b',700,0)];nodes[1]!.data={type:'part',part:{stack:{index:1}}};
  const result=run(nodes,[edge('a','b')]);expect(result.paths[0]![1].relays).toEqual([]);
 });
 it('leaves a completely blocked dependency inspectable',()=>{
  const result=run([card('a',0,0),card('wall',-10,-10,220,120),card('b',700,0)],[edge('a','b')]);
  expect(result.paths[0]![1].geometry).toBeNull();expect(result.segments).toEqual([]);
 });
 it('rebuilds chains when an intermediate card disappears or resizes',()=>{
  const plan=createRoutePlanner(),nodes=[card('a',0,0),card('b',350,0),card('c',700,0)],edges=[edge('a','c')];
  expect(plan({revision:1,nodes,edges}).paths[0]![1].relays).toEqual(['b']);
  expect(plan({revision:2,nodes:nodes.filter(n=>n.id!=='b'),edges}).paths[0]![1].relays).toEqual([]);
  const restored=plan({revision:3,nodes:nodes.map(n=>n.id==='b'?{...n,height:160}:n),edges});
  expect(restored.paths[0]![1].relays).toEqual(['b']);
 });
 it('cancellation does not commit a half-built scene cache',()=>{
  const plan=createRoutePlanner(),nodes=[card('a',0,0),card('b',350,0),card('c',700,0)],edges=[edge('a','c')];
  const batch=plan.start({revision:1,nodes,edges});batch.next();batch.return(undefined as never);
  const result=plan({revision:2,nodes,edges});expect(result.paths[0]![1].relays).toEqual(['b']);
 });
 it('searches past a nearer dead end to find a complete chain',()=>{
  const cards=new Map([['a',{x:0,y:0,width:100,height:100}],['dead',{x:180,y:0,width:100,height:100}],['via',{x:160,y:200,width:100,height:100}],['z',{x:420,y:200,width:100,height:100}]]);
  const index=new CardIndex(cards),hop=(a:string,b:string)=>makeHop(a,b,index)!;
  const graph=new Map([['a',[hop('a','dead'),hop('a','via')]],['dead',[]],['via',[hop('via','z')]],['z',[]]]);
  expect(relayChain('a','z',graph,cards,[])!.map(h=>h.target)).toEqual(['via','z']);
 });
 it('adopts an arriving relay that materially shortens the longest hop',()=>{
  const plan=createRoutePlanner(),edges=[edge('a','c')],nodes=[card('a',0,0),card('c',1000,0)];
  expect(plan({revision:1,nodes,edges}).paths[0]![1].relays).toEqual([]);
  expect(plan({revision:2,nodes:[...nodes,card('b',500,0)],edges}).paths[0]![1].relays).toEqual(['b']);
 });
 it('keeps a safe chain when a competing route improves it by less than 15 percent',()=>{
  const plan=createRoutePlanner(),edges=[edge('a','c')],nodes=[card('a',0,0,100,100),card('b',350,130,100,100),card('c',700,0,100,100)];
  const initial=plan({revision:1,nodes,edges}).paths[0]![1];expect(initial.relays).toEqual(['b']);
  const next=plan({revision:2,nodes:[...nodes,card('new',350,-120,100,100)],edges}).paths[0]![1];
  expect(next.relays).toEqual(['b']);
 });
 it('uses a collapsed source group but never its hidden page',()=>{
  const a=card('a',0,0),b=card('group',350,0),c=card('c',700,0),hidden={...card('page',350,0),hidden:true};
  b.data={type:'part',part:{stack:{index:0}}};
  expect(run([a,b,c,hidden],[edge('a','c')]).paths[0]![1].relays).toEqual(['group']);
 });
 it.each([15,30,50,100])('routes and reuses a %i-card graph without changing positions',count=>{
  const nodes=Array.from({length:count},(_,i)=>card('card'+i,i*280,0)),before=JSON.stringify(nodes);
  const edges=nodes.slice(0,-1).map((n,i)=>edge(n.id,nodes[Math.min(count-1,i+4)]!.id));const plan=createRoutePlanner();
  const first=plan({revision:1,nodes,edges}),second=plan({revision:2,nodes,edges});
  expect(first.paths.every(([,r])=>r.geometry)).toBe(true);expect(first.paths.some(([,r])=>r.relays.length>1)).toBe(true);
  expect(first.segments.length).toBeLessThan(edges.length*2);expect(second.computed).toBe(0);expect(JSON.stringify(nodes)).toBe(before);
 });
});
