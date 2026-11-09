import {describe,it,expect,vi,afterEach} from 'vitest';
import {planLayout,STRATEGIES,overlap,eligibility} from '../src/designer/planner';
import {Designer,geometryOf,ease} from '../src/designer/coordinator';
import {emptyRecord,type LayoutInput} from '../src/designer/types';
const fixture=(count=12):LayoutInput=>({
 nodes:Array.from({length:count},(_,i)=>({id:'n'+String(i).padStart(3,'0'),title:'Card '+i,type:i===0?'request':i===count-1?'paper':i%3===0?'agentcard':'sources',role:i%3===0?'worker '+i:undefined,group:'topic '+(i%3),x:i*12,y:0,width:i===count-1?600:280,height:i===count-1?800:180})),
 edges:Array.from({length:count-1},(_,i)=>({id:'e'+i,source:'n'+String(i).padStart(3,'0'),target:'n'+String(i+1).padStart(3,'0')})),
 viewport:{x:0,y:0,zoom:1},width:1400,height:900,strategy:'auto'});
describe('real deterministic arrangements',()=>{
 for(const [strategy] of STRATEGIES)it(strategy,()=>{
  const input={...fixture(),strategy};expect(eligibility(input,strategy)).toBe('');
  const plan=planLayout(input);expect(plan).toEqual(planLayout(input));expect(plan.routes).toEqual(input.edges);
  expect(Object.keys(plan.geometry.positions)).toHaveLength(input.nodes.length);
  const rects=input.nodes.map(n=>({...plan.geometry.positions[n.id],...plan.geometry.sizes[n.id]}));
  rects.forEach((r,i)=>{expect(Object.values(r).every(Number.isFinite)).toBe(true);rects.slice(i+1).forEach(s=>expect(overlap(r,s)).toBe(false));});
 });
 it('offers 17 distinct arrangements',()=>{expect(new Set(STRATEGIES.map(([strategy])=>JSON.stringify(planLayout({...fixture(),strategy}).geometry.positions))).size).toBe(17);});
 it('anchors pins, manual moves, active editors and incremental old nodes',()=>{
  const input=fixture();input.nodes[0].constraint={pinned:true};input.nodes[1].constraint={manual:true};input.nodes[2].editing=true;
  input.nodes.forEach((n,i)=>{n.x=i*800;n.y=i*500;});
  const p=planLayout(input);for(const n of input.nodes.slice(0,3))expect(p.geometry.positions[n.id]).toEqual({x:n.x,y:n.y});
  const inc=planLayout({...input,incremental:true,known:input.nodes.slice(0,8).map(n=>n.id)});input.nodes.slice(0,8).forEach(n=>expect(inc.geometry.positions[n.id]).toEqual({x:n.x,y:n.y}));
 });
 it('handles cycles and disconnected nodes without inventing relationships',()=>{
  const input=fixture();input.edges.push({id:'cycle',source:'n003',target:'n000'});input.edges=input.edges.slice(0,5).concat(input.edges.at(-1)!);
  expect(planLayout(input).routes).toEqual(input.edges);
 });
 it('refuses invalid dimensions and unavailable semantic strategies',()=>{
  const input=fixture();input.nodes[0].width=NaN;expect(()=>planLayout(input)).toThrow();
  const sparse={...fixture(2),edges:[],strategy:'tree'};expect(()=>planLayout(sparse)).toThrow('recorded connections');
 });
 it('retains fixed overlap as an explicit warning',()=>{const input=fixture(2);input.nodes.forEach(n=>n.constraint={pinned:true});expect(planLayout(input).warnings.length).toBeGreaterThan(0);});
 it('benchmarks a large graph without network access',()=>{
  const input=fixture(250),start=performance.now();const p=planLayout(input);const ms=performance.now()-start;
  console.log('250-node Auto planner:',Math.round(ms),'ms');expect(p.order.length).toBeGreaterThan(0);expect(ms).toBeLessThan(5000);
 });
});
describe('transaction coordinator',()=>{
 afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
 function setup(){
  vi.stubGlobal('window',{addEventListener(){},removeEventListener(){},setInterval:()=>1,setTimeout:()=>1});
  vi.stubGlobal('document',{hidden:false,addEventListener(){},removeEventListener(){}});
  vi.stubGlobal('sessionStorage',{getItem:()=>null});
  vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  vi.stubGlobal('Worker',class {onmessage:any;onerror:any;postMessage(data:any){this.onmessage({data:{id:data.id,plan:planLayout(data.input)}})}terminate(){}});
  let snap=fixture(4);const api={snapshot:()=>snap,setGeometry:vi.fn(g=>{snap={...snap,nodes:snap.nodes.map(n=>({...n,...g.positions[n.id],...g.sizes[n.id]}))}}),setAnimating:vi.fn(),screenPoint:(x:number,y:number)=>({x,y}),follow:vi.fn()};
  const actions={getCanvasLayout:vi.fn(async()=>emptyRecord()),saveCanvasLayout:vi.fn(async(_page,payload)=>({...emptyRecord(),...payload.layout,revision:1,previous:payload.before}))};
  const designer=new Designer(api,actions,'saved-page',()=>{},()=>{});
  return {designer,api,actions};
 }
 it('preview never saves or moves actual nodes; Stop restores before Apply',async()=>{
  const {designer,api,actions}=setup();await Promise.resolve();await Promise.resolve();
  designer.arrange(true);expect(designer.phase).toBe('preview');expect(api.setGeometry).not.toHaveBeenCalled();expect(actions.saveCanvasLayout).not.toHaveBeenCalled();
  designer.apply();expect(designer.phase).toBe('moving');designer.pause();expect(designer.phase).toBe('paused');designer.resume();expect(designer.phase).toBe('moving');designer.stop();
  expect(designer.phase).toBe('idle');expect(actions.saveCanvasLayout).not.toHaveBeenCalled();expect(api.setGeometry).toHaveBeenCalled();designer.dispose();
 });
 it('reduced motion saves one completed geometry transaction',async()=>{
  const {designer,actions}=setup();await Promise.resolve();await Promise.resolve();vi.stubGlobal('matchMedia',()=>({matches:true}));
  designer.arrange(true);designer.apply();await Promise.resolve();await Promise.resolve();
  expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(1);expect(actions.saveCanvasLayout.mock.calls[0][0]).toBe('saved-page');expect(designer.phase).toBe('idle');designer.dispose();
 });
 it('failed saves retry the same operation and revision instead of duplicating',async()=>{
  const {designer,actions,api}=setup();await Promise.resolve();await Promise.resolve();vi.stubGlobal('matchMedia',()=>({matches:true}));
  actions.saveCanvasLayout.mockRejectedValueOnce(new Error('Offline'));
  designer.arrange(true);designer.apply();await Promise.resolve();await Promise.resolve();
  expect(designer.phase).toBe('unsaved');expect(api.setAnimating).toHaveBeenLastCalledWith(true);const first=actions.saveCanvasLayout.mock.calls[0][1];
  designer.retry();await Promise.resolve();await Promise.resolve();
  expect(actions.saveCanvasLayout.mock.calls[1][1]).toEqual(first);expect(designer.phase).toBe('idle');designer.dispose();
 });
 it('a stale revision offers replan with fresh geometry, not blind overwrite',async()=>{
  const {designer,actions}=setup();await Promise.resolve();await Promise.resolve();vi.stubGlobal('matchMedia',()=>({matches:true}));
  actions.saveCanvasLayout.mockRejectedValueOnce(new Error('Canvas changed in another window. Refresh the preview.'));
  designer.arrange(true);designer.apply();await Promise.resolve();await Promise.resolve();
  expect(designer.conflict).toBe(true);
  const latest={...emptyRecord(),...geometryOf(designer.api.snapshot()),revision:5};
  actions.getCanvasLayout.mockResolvedValueOnce(latest);await designer.replan();
  expect(designer.record.revision).toBe(5);expect(designer.phase).toBe('preview');expect(actions.saveCanvasLayout).toHaveBeenCalledTimes(1);designer.dispose();
 });
 it('late acknowledgements cannot apply to a disposed page',async()=>{
  const {designer,actions,api}=setup();await Promise.resolve();await Promise.resolve();vi.stubGlobal('matchMedia',()=>({matches:true}));
  let finish:any;actions.saveCanvasLayout.mockImplementationOnce(()=>new Promise(resolve=>finish=resolve));
  designer.arrange(true);designer.apply();designer.dispose();api.setGeometry.mockClear();
  finish({...emptyRecord(),revision:1});await Promise.resolve();await Promise.resolve();
  expect(api.setGeometry).not.toHaveBeenCalled();
 });
 it('recorded arrivals anchor existing cards and create only local planning work',async()=>{
  const {designer,actions,api}=setup();await Promise.resolve();await Promise.resolve();
  designer.record={...emptyRecord(),...geometryOf(api.snapshot()),revision:1};
  const old=api.snapshot();const incoming={...old.nodes[0],id:'arrival',x:0,y:0};
  api.snapshot=()=>({...old,nodes:[...old.nodes,incoming]});
  const plan=planLayout(designer.input(true));
  old.nodes.forEach(n=>expect(plan.geometry.positions[n.id]).toEqual({x:n.x,y:n.y}));
  expect(plan.requiresPreview).toBe(false);expect(actions.saveCanvasLayout).not.toHaveBeenCalled();designer.dispose();
 });
 it('frame easing is time based and bounded',()=>{expect(ease(0)).toBe(0);expect(ease(1)).toBe(1);expect(ease(.5)).toBe(.5);});
});

describe('container geometry',()=>{
 it('moves child trees coherently and propagates child protection without adding pins',()=>{
  const input=fixture(4);input.nodes[1].parentId=input.nodes[0].id;input.nodes[1].x=80;input.nodes[1].y=60;
  const p=planLayout({...input,strategy:'pipeline'});
  expect(p.geometry.positions.n001.x-p.geometry.positions.n000.x).toBe(80);
  expect(p.geometry.positions.n001.y-p.geometry.positions.n000.y).toBe(60);
  input.nodes[1].constraint={pinned:true};
  const fixed=planLayout({...input,strategy:'pipeline'});
  expect(fixed.geometry.positions.n000).toEqual({x:0,y:0});
  expect(fixed.geometry.positions.n001).toEqual({x:80,y:60});
  expect(fixed.geometry.constraints.n000).toBeUndefined();
 });
 it('keeps locked or pinned group contents inside their existing container',()=>{
  const input=fixture(3);input.nodes[0].container=true;input.nodes[0].constraint={lockedSize:true};
  input.nodes[1].group=input.nodes[0].id;
  const p=planLayout(input);expect(p.geometry.positions.n001).toEqual({x:12,y:0});
  expect(p.geometry.sizes.n000).toEqual({width:280,height:180});
 });
});
