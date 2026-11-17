// Isolated desktop profiling. All research writes are intercepted; never submits research.
const { _electron: electron }=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict');
const frontend=path.resolve(__dirname,'..'),out=process.argv[2],mode=process.argv[3]||'saved';
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const app=await electron.launch({args:[path.join(frontend,'desktop/main.cjs')],cwd:frontend,timeout:60000,env:{...process.env,AEGIS_DESKTOP_USER_DATA:fs.mkdtempSync(path.join(os.tmpdir(),'aegis-relays-'))}});
 try{
  const page=await app.firstWindow();page.setDefaultTimeout(20000);
  await page.waitForURL('http://127.0.0.1:5173/**',{timeout:120000});
  const errors=[],writes=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{window.routingSamples=[];window.addEventListener('aegis-routing-measured',e=>window.routingSamples.push(e.detail));sessionStorage.setItem('nova-current-workspace','research');});
  const count=Number(mode)||0;
  const sources=Array.from({length:Math.max(0,count-2)},(_,i)=>({id:'S'+i,title:'Evidence source '+i,url:`https://source-${i}.test/page`,content:'Evidence summary retained for this source. Independent page, existing preview fallback.'}));
  const assignments=Array.from({length:Math.max(0,count-10)},(_,i)=>({agent:'fixture_'+i,role:'role_'+i,task:'Analyze existing fixture evidence '+i,provider:'fixture',model:'fixture',state:'done'}));
  const relations=assignments.slice(1).map((a,i)=>({id:'link'+i,source:'agent:'+assignments[i].role,target:'agent:'+a.role,type:'delivers',status:'complete',label:'Evidence handoff',event_seq:i,at:0,evidence_id:'',url:'',note:'',detail:{}}));
  const work={run_id:'relay-fixture',research_id:'relay-fixture',state:'done',stage:'finished',failure:'',request:{query:'Relay fixture '+count,mode:'deep'},plan:{title:'Fixture plan',mode:'deep',reasoning_summary:'Existing evidence analysis.'},assignments,results:Object.fromEntries(assignments.map(a=>[a.role,{...a,summary:'Recorded fixture finding. This card represents an existing result.',tokens:200,seconds:1,failure:''}])),evidence:[],artifacts:[],usage:{},relations};
  await page.route(/\/api\/(research|work\/runs)(?:\/|\?|$)/,async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(req.method()!=='GET'){writes.push({path:p,method:req.method()});return route.fulfill({json:{status:'ok',layout:req.postDataJSON()?.layout??req.postDataJSON()??{}}});}
   if(!count)return route.continue();
   if(p==='/api/research')return route.fulfill({json:{status:'ok',total:1,items:[{research_id:'relay-fixture',display_title:`Relay fixture ${count}`,query:`Relay fixture ${count}`,phase:'complete',completeness:'complete'}],removed:[]}});
   if(p==='/api/research/relay-fixture/document')return route.fulfill({json:{status:'ok',research_id:'relay-fixture',query:`Relay fixture ${count}`,display_title:`Relay fixture ${count}`,phase:'complete',completeness:'complete',mode:'detailed',report:'# Relay performance\n\nExisting fixture evidence [S0].',sources}});
   if(p==='/api/work/runs/relay-fixture')return route.fulfill({json:{status:'ok',run:work,view:{chosen:[],hidden:[]}}});
   if(p.endsWith('/layout'))return route.fulfill({json:{status:'ok',layout:{schema_version:1,revision:0,strategy:'research',automatic:false,positions:{},sizes:{},groups:[],constraints:{}}}});
   return route.fulfill({json:{status:'ok',items:[],events:[],previews:[],pages:[],sources:[],messages:[]}});
  });
  await page.reload();await page.locator('.aegis-work-stage').waitFor();
  await page.getByRole('button',{name:'Research library',exact:true}).click();
  await page.locator('#research-history-panel input[type="search"]').fill(count?'Relay fixture':'NVIDIA');
  const row=page.locator('#research-history-panel .rh-row').first();await row.waitFor();const title=await row.innerText();await row.click();
  if(await page.locator('#research-history-panel').isVisible())await page.keyboard.press('Escape');
  await page.locator('.svelte-flow__node').first().waitFor();await page.waitForTimeout(2500);
  await page.screenshot({path:path.join(out,'canvas.png')});
  const geometry=await page.locator('.svelte-flow__node').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.id,title:n.textContent.slice(0,100),style:n.getAttribute('style')})));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const samples=[];
  for(let trial=0;trial<3;trial++){
   await page.evaluate(()=>{window.profileGeneration=(window.profileGeneration||0)+1;const generation=window.profileGeneration;window.frames=[];window.longTasks=[];window.activeProfile=true;let last=performance.now();const tick=t=>{if(generation!==window.profileGeneration)return;window.frames.push(t-last);last=t;if(window.activeProfile)requestAnimationFrame(tick);};requestAnimationFrame(tick);window.observer=new PerformanceObserver(l=>window.longTasks.push(...l.getEntries().map(e=>e.duration)));window.observer.observe({type:'longtask'});});
   const before=await cdp.send('Performance.getMetrics'),routesBefore=await page.evaluate(()=>window.routingSamples.length);
   const events=[];const receive=({value})=>events.push(...value);cdp.on('Tracing.dataCollected',receive);
   await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});
   const box=await page.locator('.svelte-flow__pane').first().boundingBox();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.75);
   for(let i=0;i<24;i++){await page.mouse.wheel(i<12?18:-18,i<12?8:-8);await page.waitForTimeout(25);}
   await page.keyboard.down('Control');await page.mouse.wheel(0,-50);await page.waitForTimeout(180);await page.mouse.wheel(0,50);await page.keyboard.up('Control');await page.waitForTimeout(500);
   const panRoutes=await page.evaluate(()=>window.routingSamples.length)-routesBefore;
   const drag=await page.locator('.svelte-flow__node .work-drag-handle').evaluateAll(handles=>{
    const connected=new Set([...document.querySelectorAll('[data-relay-segment]')].flatMap(e=>[e.getAttribute('data-source'),e.getAttribute('data-target')]));
    for(const handle of handles){const r=handle.getBoundingClientRect(),x=r.x+Math.min(30,r.width/2),y=r.y+r.height/2;
     if(!connected.has(handle.closest('.svelte-flow__node').dataset.id))continue;
     if(x<180||y<100||x>innerWidth-240||y>innerHeight-180)continue;
     if(handle.contains(document.elementFromPoint(x,y)))return {x,y,id:handle.closest('.svelte-flow__node').dataset.id};
    }return null;
   });
   let dragged=false;
   if(drag){
    const beforePosition=await page.locator('[data-id="'+drag.id+'"]').first().evaluate(e=>e.style.transform);
    await page.mouse.move(drag.x,drag.y);await page.mouse.down();await page.mouse.move(drag.x+55,drag.y+20,{steps:20});
    dragged=(await page.locator('[data-id="'+drag.id+'"]').first().evaluate(e=>e.style.transform))!==beforePosition;
    await page.mouse.move(drag.x,drag.y,{steps:20});await page.mouse.up();
   }
   await page.waitForTimeout(650);
   const endTrace=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');await endTrace;cdp.off('Tracing.dataCollected',receive);
   const after=await cdp.send('Performance.getMetrics');
   const frames=await page.evaluate(()=>{window.activeProfile=false;window.observer.disconnect();const a=window.frames.slice(1).sort((a,b)=>a-b);return {count:a.length,p95:a[Math.floor(a.length*.95)],longTasks:window.longTasks,routing:window.routingSamples.at(-1)};});
   const delta={};for(const name of ['ScriptDuration','LayoutDuration','RecalcStyleDuration','TaskDuration'])delta[name]=(after.metrics.find(m=>m.name===name)?.value||0)-(before.metrics.find(m=>m.name===name)?.value||0);
   delta.paintMs=events.filter(e=>e.name==='Paint'&&e.ph==='X').reduce((sum,e)=>sum+(e.dur||0)/1000,0);
   samples.push({...frames,panRoutes,dragged,delta});
  }
  const resources=await app.evaluate(({app,webContents})=>({views:webContents.getAllWebContents().length,processes:app.getAppMetrics().map(m=>({type:m.type,cpu:m.cpu.percentCPUUsage,memoryKiB:m.memory.workingSetSize})),panes:globalThis.aegisDesktopDiagnostics().panes.length}));
  const inspection={tested:false};
  const point=await page.locator('[data-relay-segment]').evaluateAll(elements=>{
    for(const element of elements){if(element.getAttribute('data-members').split(' ').length<2)continue;
      const path=element.querySelector('.hit'),p=path.getPointAtLength(path.getTotalLength()/2),screen=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());
      if(screen.x>180&&screen.x<innerWidth-380&&screen.y>120&&screen.y<innerHeight-140&&document.elementFromPoint(screen.x,screen.y)===path)return {x:screen.x,y:screen.y};
    }return null;
  });
  if(point){
    await page.mouse.click(point.x,point.y);const choices=page.getByRole('complementary',{name:'Shared connections'});await choices.waitFor();
    inspection.members=await choices.locator('.relay-choice').count();await choices.locator('.relay-choice').first().click();
    await page.getByRole('complementary',{name:'Connection details'}).waitFor();
    inspection.highlighted=await page.locator('.relay-string.selected').count();inspection.tested=true;assert(inspection.members>1);assert(inspection.highlighted>0);
    await page.screenshot({path:path.join(out,'connection-inspection.png')});await page.getByRole('button',{name:'Close connection details'}).click();
    assert.equal(await page.locator('.relay-string.selected').count(),0);
  }
  const routes=await page.locator('[data-relay-segment]').evaluateAll(es=>es.map(e=>({id:e.getAttribute('data-relay-segment'),source:e.getAttribute('data-source'),target:e.getAttribute('data-target'),members:e.getAttribute('data-members')})));
  const result={title,mode,nodes:geometry.length,geometry,samples,resources,inspection,errors,routes,interceptedWrites:writes};fs.writeFileSync(path.join(out,'profile.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({title,nodes:geometry.length,samples,panes:resources.panes,errors}));assert.equal(resources.panes,0);assert.deepEqual(errors,[]);
 }finally{await app.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
