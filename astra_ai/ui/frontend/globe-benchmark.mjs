import {chromium} from '@playwright/test';import {writeFileSync,mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===1440?900:844}});await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(1100);
 for(const count of ['real',5000,20000]){
  const result=await page.evaluate(async({count})=>{
   const {GlobeEngine}=await import('/src/components/Memory/memory-globe/globeEngine.ts');const {buildGraph}=await import('/src/components/Memory/memory-globe/memoryAdapter.ts');const {generateDemoGraph}=await import('/tests/memory-globe/demoGraph.ts');
   let graph;if(count==='real'){const {conversationSnapshot}=await import('/src/conversation.ts'),raw={};let cursor='';do{const r=await fetch('/api/memory/globe?limit=1000'+(cursor?'&cursor='+encodeURIComponent(cursor):''),{headers:{'X-Nova-Client':conversationSnapshot().clientId}}),p=await r.json();if(!r.ok)throw Error('Benchmark data unavailable');for(const sec of ['facts','events','activity_history']){raw[sec]??={};for(const[c,g]of Object.entries(p.raw[sec]))raw[sec][c]={...raw[sec][c],...g};}for(const sec of ['visual_topics','category_definitions','entity_graph','relationships_v3','catalog_relationships','pending_approvals','conflicts'])raw[sec]=p.raw[sec];cursor=p.next_cursor||'';}while(cursor);graph=buildGraph(raw);}else graph=generateDemoGraph(count,7);
   const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;background:#30302e;z-index:999999';document.body.append(canvas);const engine=new GlobeEngine(canvas,{ambient:false,flows:false,maxMemories:Infinity}),start=performance.now();engine.setData(graph);const loadMs=performance.now()-start;
   await new Promise(r=>setTimeout(r,2000));const durations=[];await new Promise(resolve=>{let last=performance.now(),begin=last;const sample=t=>{durations.push(t-last);last=t;if(t-begin<4000)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});
   const interactionStart=performance.now();canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,clientX:100,clientY:100}));canvas.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:150,clientY:130}));canvas.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,clientX:150,clientY:130}));await new Promise(r=>requestAnimationFrame(r));const inputMs=performance.now()-interactionStart;
   const sorted=durations.slice(2).sort((a,b)=>a-b),average=sorted.reduce((a,b)=>a+b,0)/sorted.length;
   const category=engine.nodes.filter(n=>n.kind==='category').sort((a,b)=>b.adj.length-a.adj.length)[0];engine.select(category.id);engine.zt=8;
   await new Promise(r=>setTimeout(r,1500));const focused=[];await new Promise(resolve=>{let last=performance.now(),begin=last;const sample=t=>{focused.push(t-last);last=t;if(t-begin<2500)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});
   const focusFrames=focused.slice(2).sort((a,b)=>a-b),focusAverage=focusFrames.reduce((a,b)=>a+b,0)/focusFrames.length;
   const focusInput=performance.now();canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,clientX:150,clientY:150}));await new Promise(r=>requestAnimationFrame(r));const focusedInputMs=performance.now()-focusInput;
   const result={fixture:count,records:graph.memories.length,loadMs:+loadMs.toFixed(1),fps:+(1000/average).toFixed(1),p95FrameMs:+sorted[Math.floor(sorted.length*.95)].toFixed(1),inputMs:+inputMs.toFixed(1),quality:engine.lod,focusedFps:+(1000/focusAverage).toFixed(1),focusedP95FrameMs:+focusFrames[Math.floor(focusFrames.length*.95)].toFixed(1),focusedInputMs:+focusedInputMs.toFixed(1)};engine.destroy();canvas.remove();return result;
  },{count});results.push({width,...result});console.log(JSON.stringify(results.at(-1)));
 }
 await page.close();
}
await browser.close();mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/memory-globe-benchmark.json',JSON.stringify({environment:'Headless Chrome on this Windows host; no physical low-end laptop or phone certification',results},null,2));
