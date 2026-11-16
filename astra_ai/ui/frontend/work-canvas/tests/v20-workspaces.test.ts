import {describe,it,expect} from 'vitest';
import {FAMILIES,selectFamily} from '../src/designer/families';
import {workspaceFixture} from '../src/fixtures/workspaces';
import {planLayout,overlap} from '../src/designer/planner';
import {parseObject,objectItems} from '../src/objects/registry';
import {createRoutePlanner} from '../src/junction-routing';
describe('V20 adaptive compositions',()=>{
 for(const [family] of FAMILIES)for(const count of [5,20,50,100])it(`${family}: ${count} objects, deterministic and collision free`,()=>{
  const {input,plan}=workspaceFixture(family,count);expect(plan).toEqual(planLayout(input));expect(plan.routes).toEqual(input.edges);
  const rects=input.nodes.map(n=>({...plan.geometry.positions[n.id],...plan.geometry.sizes[n.id]}));rects.forEach((r,i)=>rects.slice(i+1).forEach(s=>expect(overlap(r,s)).toBe(false)));
  input.nodes[0].constraint={manual:true};input.nodes[0].x=-420;input.nodes[0].y=260;
  expect(planLayout(input).geometry.positions[input.nodes[0].id]).toEqual({x:-420,y:260});
 });
 it('uses recorded workflow and retains previous family',()=>{const {input}=workspaceFixture('mixed-result');expect(selectFamily({...input,workflow:'pricing-research'})).toBe('comparison-desk');expect(selectFamily({...input,workflow:'pricing-research',previousFamily:'code-walkthrough'})).toBe('code-walkthrough');});
 it('rejects executable types and unsafe media addresses',()=>{expect(parseObject({id:'bad',kind:'script',title:'Run this'})).toBeNull();expect(parseObject({id:'x',kind:'image',title:'Image',url:'javascript:alert(1)'})?.url).toBeUndefined();});
 it('keeps unknown results inspectable without executing their content',()=>{const [item]=objectItems([{id:'future',kind:'new-result',title:'Future result',body:'<script>bad()</script>'}]);expect(item.aegisObject.status).toBe('unsupported');expect(item.aegisObject.body).not.toContain('<script>');});
 it('preserves complete tables while presentation pages their rows',()=>{const columns=Array.from({length:30},(_,i)=>'Column '+i),rows=Array.from({length:250},()=>columns.map(()=>'x'.repeat(5000)));const parsed=parseObject({id:'table',kind:'table',title:'Full table',columns,rows});expect(parsed?.columns).toHaveLength(30);expect(parsed?.rows).toHaveLength(250);expect(parsed?.rows?.[249][29]).toHaveLength(5000);});
 it('keeps equal dates on the same time coordinate rather than shifting their time to avoid collisions',()=>{
  const {input}=workspaceFixture('daily-schedule',5);
  input.nodes=input.nodes.slice(0,3).map(n=>({...n,group:'same',start:100,end:160}));
  input.edges=[];
  const plan=planLayout(input),places=Object.values(plan.geometry.positions);
  expect(new Set(places.map(p=>p.y)).size).toBe(1);
  expect(new Set(places.map(p=>p.x)).size).toBe(3);
 });
});
describe('retired V20 virtual junction fallback regression',()=>{
 const node=(id:string,x:number,y:number)=>({id,position:{x,y},width:180,height:120});
 it('never turns an intervening card into a processing or visual hop',()=>{
  const edges=[{id:'real',source:'a',target:'z'}],nodes=[node('a',0,0),node('unrelated',300,0),node('z',700,0)];
  const result=createRoutePlanner()({revision:1,nodes,edges});expect(result.paths[0][1].relays).toEqual([]);expect(result.paths[0][1].hops.every(h=>h.source==='a'&&h.target==='z')).toBe(true);expect(result.paths[0][1].geometry).not.toBeNull();
 });
 it.each(['out','in'])('shares %s trunks with continuous geometry and original membership',direction=>{
  const nodes=[node('a',0,160),node('b',620,0),node('c',620,320)];
  const edges=['b','c'].map(id=>({id,source:direction==='out'?'a':id,target:direction==='out'?id:'a'}));
  if(direction==='in')nodes.forEach(n=>n.position.x=620-n.position.x);
  const result=createRoutePlanner()({revision:1,nodes,edges});expect(result.segments.some(s=>s.members.length===2)).toBe(true);
  for(const [,route] of result.paths){expect(route.relays).toEqual([]);expect(route.hops[0].geometry.t).toEqual(route.hops[1].geometry.s);}
 });
 it('reuses unaffected routes without touching saved geometry',()=>{const nodes=[node('a',0,0),node('b',600,0)],edges=[{id:'ab',source:'a',target:'b'}],before=JSON.stringify(nodes),planner=createRoutePlanner();planner({revision:1,nodes,edges});expect(planner({revision:2,nodes,edges}).computed).toBe(0);expect(JSON.stringify(nodes)).toBe(before);});
});
