import {describe,it,expect} from 'vitest';
import {createRoutePlanner,type LogicalEdge} from '../src/routing-plan';
import {routeResearchCorridorFan} from '../src/research-routing';
import {readFileSync} from 'node:fs';
const card=(id:string,x:number,y:number)=>({id,position:{x,y},width:120,height:80});
describe('shared routing service',()=>{
  it('keeps a 50-card parallel workflow with branching and convergence fully connected',()=>{
    const plan=createRoutePlanner();
    const nodes=Array.from({length:50},(_,i)=>card(String(i),Math.floor(i/10)*350,(i%10)*150));
    const edges:LogicalEdge[]=nodes.slice(0,40).map((n,i)=>({id:'track'+i,source:n.id,target:String(i+10)}));
    edges[0]!.fan='out';edges[30]!.fan='in';
    for(let row=1;row<10;row++){
      edges.push({id:'branch'+row,source:'0',target:String(10+row),fan:'out'});
      edges.push({id:'merge'+row,source:String(30+row),target:'40',fan:'in'});
    }
    const first=plan({revision:1,nodes,edges});
    expect(first.paths).toHaveLength(edges.length);
    expect(first.paths.every(([,p])=>p.geometry)).toBe(true);
    expect(first.segments.filter(s=>s.members.length>1).length).toBeGreaterThanOrEqual(2);
    const settled=plan({revision:2,nodes,edges});
    expect(settled.computed).toBe(0);
    expect(settled.paths).toEqual(first.paths);
  });
  it.each([5,15,30,50])('caches %i nodes without changing relation identities',count=>{
    const plan=createRoutePlanner();
    const nodes=Array.from({length:count},(_,i)=>card(String(i),i*200,0));
    const edges=nodes.slice(1).map((n,i)=>({id:'edge'+i,source:String(i),target:n.id}));
    const first=plan({revision:1,nodes,edges});
    expect(first.paths.map(([id])=>id).sort()).toEqual(edges.map(e=>e.id).sort());
    expect(first.paths.every(([,p])=>p.geometry)).toBe(true);
    const next=plan({revision:2,nodes,edges});
    expect(next.computed).toBe(0);expect(next.reused).toBe(edges.length);
    expect(next.paths).toEqual(first.paths);
  });
  it('invalidates a crossed corridor when an unrelated obstacle moves, retaining distant routes',()=>{
    const plan=createRoutePlanner();
    const nodes=[card('a',0,0),card('b',600,0),card('wall',280,280),card('c',0,800),card('d',600,800)];
    const edges=[{id:'ab',source:'a',target:'b'},{id:'cd',source:'c',target:'d'}];
    const before=plan({revision:1,nodes,edges});
    const after=plan({revision:2,nodes:nodes.map(n=>n.id==='wall'?card('wall',280,0):n),edges});
    expect(after.computed).toBe(1);expect(after.reused).toBe(1);
    expect(after.paths[0]![1].geometry?.d).not.toBe(before.paths[0]![1].geometry?.d);
    expect(after.paths[1]![1]).toBe(before.paths[1]![1]);
  });
  it('routes a common trunk around a blocked fan while preserving every branch',()=>{
    const hub={x:0,y:100,width:120,height:80};
    const leaves=Array.from({length:3},(_,i)=>({id:'leaf'+i,rect:{x:650,y:i*150,width:120,height:80}}));
    const fan=routeResearchCorridorFan(hub,leaves,[{x:250,y:40,width:130,height:230}],'out');
    expect(fan?.branches.size).toBe(3);
    expect(fan?.trunk).toContain('C');
    for(const [,path] of fan!.branches)expect(path.s).toEqual({x:120,y:140});
  });
  it('retains a real direct dependency in the route plan',()=>{
    const nodes=[card('a',0,0),card('b',250,0),card('c',500,0)];
    const edges:LogicalEdge[]=[{id:'ab',source:'a',target:'b'},{id:'bc',source:'b',target:'c'},{id:'ac',source:'a',target:'c'}];
    expect(createRoutePlanner()({revision:1,nodes,edges}).paths.map(([id])=>id)).toContain('ac');
  });
  it('sync installs the routing provider and uses unmodified upstream Skill artwork',()=>{
    const canvas=readFileSync(new URL('../upstream/src/features/work/components/WorkCanvas.svelte',import.meta.url),'utf8');
    expect(canvas).toContain('setContext(routingContext, () => routing)');
    const original=readFileSync(new URL('../../../zephium-source/frame/src/features/work/components/run/InputMark.svelte',import.meta.url),'utf8').replaceAll('\r\n','\n');
    expect(readFileSync(new URL('../upstream/src/features/work/components/run/InputMark.svelte',import.meta.url),'utf8').replaceAll('\r\n','\n')).toBe(original);
  });
});
