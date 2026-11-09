import {describe,it,expect,vi,afterEach} from 'vitest';
import {planLayout,overlap} from '../src/designer/planner';
import {packedRows,freeRectangle} from '../src/designer/packing';
import {reflowExpanded} from '../src/designer/reflow';
import {Designer,geometryOf} from '../src/designer/coordinator';
import {emptyRecord,type LayoutInput} from '../src/designer/types';

function graph(count=12):LayoutInput {
 const nodes=[{id:'question',type:'request',title:'Research question',x:0,y:0,width:320,height:130},
 ...Array.from({length:count},(_,i)=>({id:'source:'+i,type:'part',title:'Evidence '+i,x:400,y:i*300,width:320,height:210+(i%3)*30})),
 {id:'report',type:'paper',title:'Finished report',x:1400,y:0,width:760,height:960}];
 return {nodes,edges:nodes.slice(1,-1).flatMap(n=>[{id:'q:'+n.id,source:'question',target:n.id},{id:'r:'+n.id,source:n.id,target:'report'}]),viewport:{x:0,y:0,zoom:1},width:1440,height:900,strategy:'auto'};
}
function bounds(p:ReturnType<typeof planLayout>) {
 const rects=Object.keys(p.geometry.positions).map(id=>({...p.geometry.positions[id],...p.geometry.sizes[id]}));
 const width=Math.max(...rects.map(r=>r.x+r.width))-Math.min(...rects.map(r=>r.x));
 const height=Math.max(...rects.map(r=>r.y+r.height))-Math.min(...rects.map(r=>r.y));
 return {rects,width,height,area:width*height};
}
describe('compact spatial composition',()=>{
 for(const count of [5,12,30])it(count+' real-source-shaped cards stay compact and readable',()=>{
  const input=graph(count),p=planLayout(input),b=bounds(p);
  expect(p.warnings).toEqual([]);
  b.rects.forEach((r,i)=>b.rects.slice(i+1).forEach(s=>expect(overlap(r,s)).toBe(false)));
  expect(b.height/b.width).toBeLessThan(2.5);
  expect(b.width/b.height).toBeLessThan(4);
  expect(b.area).toBeLessThan(input.nodes.reduce((sum,n)=>sum+n.width*n.height,0)*3);
  expect(p.geometry.sizes.report.width).toBeGreaterThanOrEqual(560);
  console.log(count+' sources:',p.strategy,Math.round(b.width)+'×'+Math.round(b.height));
 });
 it('selects semantically suitable diagrams from compatible recorded groups',()=>{
  const input=graph(5);input.topic='Compare two architectures';
  input.nodes.forEach((n,i)=>n.group=i%2?'A':'B');
  expect(['comparison','matrix']).toContain(planLayout(input).strategy);
  input.topic='Architecture of a service';expect(['tree','dependency','hierarchy']).toContain(planLayout(input).strategy);
 });
 it('zoom and window width never change saved composition',()=>{
  const input=graph();expect(planLayout({...input,width:390,viewport:{x:200,y:-300,zoom:.3}}).geometry).toEqual(planLayout(input).geometry);
 });
 it('small rows do not inherit a large document height',()=>{
  const p=packedRows([{width:600,height:900},{width:300,height:150},{width:300,height:150},{width:300,height:150}],2);
  expect(p[2].y).toBe(932);expect(p[3].x).toBe(332);
 });
 it('collision escape uses both axes instead of a long vertical chain',()=>{
  const target=freeRectangle({x:0,y:400,width:300,height:200},[{x:0,y:0,width:300,height:1000}]);
  expect(target.x).not.toBe(0);expect(target.y).toBe(400);
 });
 it('an arriving source anchors existing geometry and stays near its related question',()=>{
  const input=graph(5),first=planLayout(input);
  input.nodes=input.nodes.map(n=>({...n,...first.geometry.positions[n.id],...first.geometry.sizes[n.id]}));
  input.nodes.push({id:'arrival',type:'part',title:'New evidence',x:20000,y:20000,width:320,height:240});
  input.edges.push({id:'arrival-edge',source:'question',target:'arrival'});
  const next=planLayout({...input,incremental:true,known:Object.keys(first.geometry.positions)});
  for(const n of input.nodes.slice(0,-1))expect(next.geometry.positions[n.id]).toEqual(first.geometry.positions[n.id]);
  expect(Math.hypot(next.geometry.positions.arrival.x-next.geometry.positions.question.x,next.geometry.positions.arrival.y-next.geometry.positions.question.y)).toBeLessThan(2000);
 });
 it('inline growth reflows nearby cards without altering saved inputs or pins',()=>{
  const nodes=[{id:'sources',type:'sources',title:'Sources',x:0,y:0,width:560,height:200},{id:'next',type:'part',title:'Next',x:0,y:240,width:300,height:200},{id:'pin',type:'paper',title:'Pinned',x:1000,y:0,width:500,height:700,constraint:{pinned:true}}];
  const original=structuredClone(nodes),p=reflowExpanded(nodes,new Map([['sources',{width:560,height:650}]]));
  expect(nodes).toEqual(original);expect(p.positions.pin).toEqual({x:1000,y:0});
  expect(overlap({...p.positions.sources,...p.sizes.sources},{...p.positions.next,...p.sizes.next})).toBe(false);
 });
});

describe('live completion lifecycle',()=>{
 afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
 async function setup(initiator=true) {
  vi.useFakeTimers();const session=new Map(initiator?[['aegis-layout-initiator:page','1']]:[]);
  vi.stubGlobal('window',{addEventListener(){},removeEventListener(){},setInterval, setTimeout});
  vi.stubGlobal('document',{hidden:false,addEventListener(){},removeEventListener(){}});
  vi.stubGlobal('sessionStorage',{getItem:(k:string)=>session.get(k),removeItem:(k:string)=>session.delete(k)});
  vi.stubGlobal('matchMedia',()=>({matches:true}));
  vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  const requests:any[]=[];
  vi.stubGlobal('Worker',class{onmessage:any;onerror:any;terminate(){}postMessage(data:any){requests.push(data);this.onmessage({data:{id:data.id,plan:planLayout(data.input)}});}});
  let snap=graph(5),revision=0;
  const api={snapshot:()=>snap,setGeometry:vi.fn(g=>{snap={...snap,nodes:snap.nodes.map(n=>({...n,...g.positions[n.id],...g.sizes[n.id]}))}}),setAnimating:vi.fn(),screenPoint:(x:number,y:number)=>({x,y}),follow:vi.fn()};
  let record=emptyRecord();
  const actions={getCanvasLayout:vi.fn(async()=>record),saveCanvasLayout:vi.fn(async(_page,payload)=>record={...emptyRecord(),...payload.layout,revision:++revision,previous:payload.before})};
  const d=new Designer(api,actions,'page',()=>{},()=>{});
  await Promise.resolve();await Promise.resolve();
  return {d,api,actions,requests,session};
 }
 it('runs local incremental work then exactly one full completion pass',async()=>{
  const {d,actions,requests,session}=await setup();
  d.observeRun('running','Tidal research');await vi.advanceTimersByTimeAsync(950);
  expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(1);expect(requests[0].input.incremental).toBe(true);
  d.observeRun('completed');await vi.advanceTimersByTimeAsync(950);
  expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(2);expect(requests[1].input.incremental).toBe(false);
  expect(session.has('aegis-layout-initiator:page')).toBe(false);
  d.observeRun('completed');await vi.advanceTimersByTimeAsync(5000);
  expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(2);d.dispose();
 });
 it('opening completed research never arranges it, including stale initiator markers',async()=>{
  const {d,requests}=await setup();d.observeRun('completed');await vi.advanceTimersByTimeAsync(6000);
  expect(requests).toHaveLength(0);d.dispose();
 });
 it('Stop cancels queued automation rather than restarting at completion',async()=>{
  const {d,requests,session}=await setup();
  d.observeRun('running');d.stop();d.observeRun('completed');await vi.advanceTimersByTimeAsync(6000);
  expect(requests).toHaveLength(0);expect(session.has('aegis-layout-initiator:page')).toBe(false);d.dispose();
 });
 it('other windows never schedule autonomous work',async()=>{
  const {d,requests}=await setup(false);d.observeRun('running');d.observeRun('completed');await vi.advanceTimersByTimeAsync(6000);
  expect(requests).toHaveLength(0);d.dispose();
 });
 it('releases a manually positioned pin while preserving the independent size lock',async()=>{
  const {d,api,actions}=await setup(false);
  const id=api.snapshot().nodes[0].id;
  await d.moved([id]);
  await d.constraint([id],'pinned');
  await d.constraint([id],'lockedSize');
  expect(actions.saveCanvasLayout.mock.lastCall?.[1].layout.constraints[id]).toMatchObject({manual:true,pinned:true,lockedSize:true});
  await d.constraint([id],'manual');
  expect(actions.saveCanvasLayout.mock.lastCall?.[1].layout.constraints[id]).toMatchObject({manual:false,pinned:false,lockedSize:true});
  d.dispose();
 });
 it('Skip commits the real planned geometry once while Stop rolls it back',async()=>{
  const {d,api,actions}=await setup(false);vi.stubGlobal('matchMedia',()=>({matches:false}));
  d.arrange(true);const target=d.plan!.geometry;d.apply();
  expect(d.phase).toBe('moving');d.skip();await Promise.resolve();await Promise.resolve();
  expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(1);expect(geometryOf(api.snapshot()).positions).toEqual(target.positions);
  d.arrange(true);d.apply();d.stop();expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(1);d.dispose();
 });
 it('large schedules batch without accelerating the individual drag',async()=>{
  const {d,api}=await setup(false);vi.stubGlobal('matchMedia',()=>({matches:false}));api.snapshot=()=>graph(30);
  d.arrange(true);d.apply();const jobs=(d as any).jobs as {start:number;duration:number}[];
  expect(Math.min(...jobs.map(j=>j.duration))).toBeGreaterThanOrEqual(1000);
  expect(Math.max(...jobs.map(j=>j.start+j.duration))).toBeLessThan(15000);
  d.dispose();
 });
});
