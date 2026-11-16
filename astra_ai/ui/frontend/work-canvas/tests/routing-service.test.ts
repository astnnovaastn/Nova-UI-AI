import {afterEach, describe, expect, it, vi} from 'vitest';
import {createRoutingService} from '../src/routing-service';
import {createRoutePlanner, type RoutingInput} from '../src/routing-plan';
import {indexRoutingNodes} from '../src/research-routing';

class TestWorker {
  static instance: TestWorker;
  requests: RoutingInput[] = [];
  onmessage?: (event: {data: ReturnType<ReturnType<typeof createRoutePlanner>>}) => void;
  onerror?: () => void;
  terminated = false;
  plan = createRoutePlanner();
  constructor() { TestWorker.instance = this; }
  postMessage(input: RoutingInput) { this.requests.push(input); }
  finish(index: number) { this.onmessage?.({data: this.plan(this.requests[index]!)}); }
  terminate() { this.terminated = true; }
}
const nodes = [
  {id:'a',position:{x:0,y:0},width:120,height:80},
  {id:'b',position:{x:500,y:0},width:120,height:80},
];
const edges = [{id:'ab',source:'a',target:'b',data:{strand:{index:0,of:1}}}];
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

describe('canvas routing lifecycle',()=>{
  it('ignores selection/camera store refreshes and disposes its worker',()=>{
    vi.useFakeTimers();vi.stubGlobal('Worker',TestWorker);
    const router=createRoutingService();
    router.update(nodes,edges);vi.advanceTimersByTime(20);
    const worker=TestWorker.instance;worker.finish(0);
    for(let i=0;i<10;i++)router.update(nodes.map(n=>({...n,selected:!!(i%2),position:{...n.position}})),[...edges]);
    vi.advanceTimersByTime(50);
    expect(worker.requests).toHaveLength(1);
    router.destroy();expect(worker.terminated).toBe(true);
  });
  it('attaches transparent results to measured content without rewriting saved frames',()=>{
    vi.useFakeTimers();vi.stubGlobal('Worker',TestWorker);
    const router=createRoutingService();const frame=JSON.stringify(nodes);
    router.update(nodes,edges).measureContent('a',{x:4,y:6,width:110,height:40});
    const snapshot=router.update(nodes,edges);vi.advanceTimersByTime(20);
    expect(snapshot.scene.bounds.get('a')).toEqual({x:4,y:6,width:110,height:40});
    const worker=TestWorker.instance;worker.finish(0);
    expect(worker.requests[0]!.nodes[0]!.data).toMatchObject({visualBounds:{x:4,y:6,width:110,height:40}});
    expect(snapshot.get('ab')!.geometry!.s.x).toBe(114);
    for(let i=0;i<8;i++)router.update(nodes.map(n=>({...n,selected:true})),edges);
    vi.advanceTimersByTime(50);expect(worker.requests).toHaveLength(1);
    expect(JSON.stringify(nodes)).toBe(frame);router.destroy();
  });
  it('drops stale worker results and processes only the latest queued geometry',()=>{
    vi.useFakeTimers();vi.stubGlobal('Worker',TestWorker);
    const router=createRoutingService();
    router.update(nodes,edges);vi.advanceTimersByTime(20);
    const worker=TestWorker.instance;
    router.update(nodes.map(n=>n.id==='b'?{...n,position:{x:600,y:180}}:n),edges);
    const current=router.update(nodes.map(n=>n.id==='b'?{...n,position:{x:700,y:240}}:n),edges);
    worker.finish(0);vi.advanceTimersByTime(20);
    expect(worker.requests).toHaveLength(2);
    expect(worker.requests[1]!.nodes[1]!.position.x).toBe(700);
    worker.finish(1);
    expect(current.get('ab')!.geometry!.t.x).toBe(700);
    router.destroy();
  });
  it('accounts for Skill artwork without moving or resizing the prompt',()=>{
    const scene=indexRoutingNodes([{...nodes[0]!,data:{type:'request',aegisSkills:[{},{}]}}]);
    expect(scene.bounds.get('a')).toEqual({x:0,y:0,width:120,height:80});
    expect(scene.cards.get('skill-decoration:a')).toEqual({x:-256,y:-2,width:200,height:84});
    expect(scene.bounds.has('skill-decoration:a')).toBe(false);
  });
  it('renders local shared segments with original identities and mixed statuses',()=>{
    vi.useFakeTimers();vi.stubGlobal('Worker',TestWorker);
    const router=createRoutingService();
    const cards=[nodes[0]!,{...nodes[0]!,id:'relay',position:{x:250,y:0}},nodes[1]!];
    const logical=[{...edges[0]!,data:{strand:{state:'active'}}},{...edges[0]!,id:'other',data:{strand:{state:'done'}}}];
    router.update(cards,logical);vi.advanceTimersByTime(20);TestWorker.instance.finish(0);
    const rendered=router.renderEdges(logical);
    expect(rendered.map(e=>[e.source,e.target])).toEqual([['a','relay'],['relay','b']]);
    expect(rendered[0]!.data!.members).toEqual([
      {id:'ab',source:'a',target:'b',strand:{state:'active'},relays:['relay']},
      {id:'other',source:'a',target:'b',strand:{state:'done'},relays:['relay']},
    ]);
    expect(cards[1]!.data).toBeUndefined();router.destroy();
  });
  it('does not accept a previous run result after the canvas is disposed',()=>{
    vi.useFakeTimers();vi.stubGlobal('Worker',TestWorker);
    const first=createRoutingService();first.update(nodes,edges);vi.advanceTimersByTime(20);const old=TestWorker.instance;
    first.destroy();const next=createRoutingService();const snapshot=next.update(nodes,edges);vi.advanceTimersByTime(20);
    old.finish(0);expect(snapshot.get('ab')).toBeNull();
    TestWorker.instance.finish(0);expect(snapshot.get('ab')!.geometry).toBeTruthy();next.destroy();
  });
});
