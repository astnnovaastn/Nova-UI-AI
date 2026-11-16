// Runs the production canvas with inert fixtures. No application account or provider client.
const {chromium,_electron:electron}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../v22-verification');
fs.mkdirSync(out,{recursive:true});
const front=path.resolve(__dirname,'..');
async function monitor(page){
 await page.addInitScript(()=>{
  window.v20Metrics={routes:[],frames:[],longTasks:[]};
  window.addEventListener('aegis-routing-measured',e=>window.v20Metrics.routes.push(e.detail));
  try{new PerformanceObserver(list=>window.v20Metrics.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});}catch{}
  let previous=0;function frame(now){if(previous&&window.v20Record)window.v20Metrics.frames.push(now-previous);previous=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
 });
}
async function sample(page,name,gesture){
 await page.waitForTimeout(900);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 const metricMap=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 const geometry=()=>page.locator('.svelte-flow__node').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.dataset.id,{transform:n.style.transform,width:n.offsetWidth,height:n.offsetHeight}])));
 const geometryBefore=await geometry();
 const metricsBefore=await metricMap();
 const before=await page.evaluate(()=>{window.v20Metrics.frames=[];window.v20Record=true;return {passes:window.v20Metrics.routes.length,long:window.v20Metrics.longTasks.length};});
 await gesture();
 const result=await page.evaluate(({before,name})=>{
  window.v20Record=false;const ms=[...window.v20Metrics.frames].sort((a,b)=>a-b);
  return {name,frames:ms.length,p95:ms[Math.floor(ms.length*.95)]||0,max:ms.at(-1)||0,
   routePasses:window.v20Metrics.routes.length-before.passes,
   longTasks:window.v20Metrics.longTasks.slice(before.long),heap:performance.memory?.usedJSHeapSize,
   routing:window.v20Metrics.routes.at(-1)};
 },{before,name});
 const metricsAfter=await metricMap();
 const geometryAfter=await geometry();
 result.newlyVisible=Object.keys(geometryAfter).filter(id=>!geometryBefore[id]);
 result.changedGeometry=Object.keys(geometryAfter).filter(id=>geometryBefore[id]&&JSON.stringify(geometryBefore[id])!==JSON.stringify(geometryAfter[id])).map(id=>({id,before:geometryBefore[id],after:geometryAfter[id]}));
 result.mainThread=Object.fromEntries(['ScriptDuration','LayoutDuration','RecalcStyleDuration','TaskDuration'].map(k=>[k+'Ms',1000*(metricsAfter[k]-metricsBefore[k])]));
 await cdp.detach();
 return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[],blocked=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});await monitor(page);
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'&&!u.pathname.startsWith('/api/'))return route.continue();blocked.push(u.origin+u.pathname);return route.abort();});
 await page.goto('http://127.0.0.1:5194/v20-simulation.html?aegisFixture=mixed-result&count=5');
 await page.waitForLoadState('networkidle');
 await page.locator('[data-v20-fixture]').waitFor();
 await page.getByRole('button',{name:'Select / move cards'}).click();
 const families=process.argv.includes('--quick')?[]:await page.locator('select').nth(0).locator('option').evaluateAll(options=>options.map(o=>({id:o.value,label:o.textContent})));
 const captures=process.argv.includes('--quick')?JSON.parse(fs.readFileSync(path.join(out,'captures.json'),'utf8')).captures:[];
 for(const {id,label} of families){
  await page.locator('select').nth(0).selectOption(id);
  await page.waitForTimeout(850);
  await page.screenshot({path:path.join(out,id+'-overview.png')});
  const node=page.locator('.svelte-flow__node').first();
  await node.click({position:{x:10,y:10},force:true});
  await page.waitForTimeout(120);
  await page.screenshot({path:path.join(out,id+'-selected.png')});
  // Open from the real card, then verify the native dialog and keyboard escape.
  await page.locator('.svelte-flow__node-toolbar').getByRole('button',{name:'Open',exact:true}).click();
  await page.locator('[role=dialog]').waitFor();
  await page.screenshot({path:path.join(out,id+'-focus.png')});
  await page.keyboard.press('Escape');await page.waitForTimeout(100);
  captures.push({id,label,nodes:await page.locator('.svelte-flow__node').count()});
 }
 fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify({captures,errors,blocked},null,2));
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5194/v20-simulation.html?aegisFixture=focused-answer&count=5');await page.waitForLoadState('networkidle');
 await page.locator('select').nth(0).selectOption('focused-answer');await page.waitForTimeout(500);
 await page.screenshot({path:path.join(out,'narrow-reduced-motion.png')});
 await page.setViewportSize({width:1440,height:960});
 await page.locator('select').nth(1).selectOption('50');
 await page.waitForTimeout(2000);
 const performance=[];
 for(let i=0;i<3;i++)performance.push(await sample(page,'camera-'+i,async()=>{
  await page.mouse.move(1300,850);await page.mouse.down({button:'middle'});await page.mouse.move(1000,650,{steps:35});await page.mouse.move(1300,850,{steps:35});await page.mouse.up({button:'middle'});
  await page.mouse.wheel(0,250);await page.waitForTimeout(250);await page.mouse.wheel(0,-250);await page.waitForTimeout(250);
 }));
 const safety=await page.evaluate(async()=>{try{await fetch('/api/work/runs');return false;}catch{return true;}});
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({captures,errors,blocked,safety,performance},null,2));
 await browser.close();
 if(errors.length||!safety)throw new Error('Fixture check failed: '+errors.join(';'));
 console.log(JSON.stringify({captured:captures.length*3,errors,performance}));
 if(process.argv.includes('--desktop')){
  const profile=path.join(out,'desktop-profile');fs.mkdirSync(profile,{recursive:true});
  fs.writeFileSync(path.join(profile,'desktop.json'),JSON.stringify({uiUrl:'http://127.0.0.1:5194/v20-simulation.html?aegisFixture=mixed-result&count=50',autoStart:false,stopOnExit:false}));
  const app=await electron.launch({args:[path.join(front,'desktop/main.cjs')],cwd:front,env:{...process.env,AEGIS_DESKTOP_USER_DATA:profile}});
  try{
   await app.evaluate(({session})=>session.defaultSession.webRequest.onBeforeRequest((details,answer)=>{const u=new URL(details.url);answer({cancel:!['file:','devtools:','data:'].includes(u.protocol)&&u.hostname!=='127.0.0.1'});}));
   const desk=await app.firstWindow();await monitor(desk);
   await desk.waitForURL('**/v20-simulation.html**',{timeout:30000});
   await desk.reload();await desk.waitForLoadState('networkidle');await desk.waitForTimeout(2000);
   const baseline=await app.evaluate(({app,BrowserWindow})=>({metrics:app.getAppMetrics(),nativeViews:BrowserWindow.getAllWindows().reduce((s,w)=>s+w.contentView.children.length,0)}));
   const measurements=[];
   for(let i=0;i<3;i++)measurements.push(await sample(desk,'desktop-camera-'+i,async()=>{
    await desk.mouse.move(1000,700);await desk.mouse.down({button:'middle'});await desk.mouse.move(700,500,{steps:40});await desk.mouse.move(1000,700,{steps:40});await desk.mouse.up({button:'middle'});
    await desk.mouse.wheel(0,200);await desk.waitForTimeout(300);await desk.mouse.wheel(0,-200);await desk.waitForTimeout(300);
   }));
   await desk.getByRole('button',{name:'Select / move cards'}).click();
   for(let i=0;i<3;i++)measurements.push(await sample(desk,'desktop-drag-'+i,async()=>{
    const index=await desk.locator('.svelte-flow__node').evaluateAll(nodes=>nodes.findIndex(node=>{
     const title=node.querySelector('h2,h3,.title');if(!title)return false;const box=title.getBoundingClientRect();
     return box.x>20&&box.y>160&&box.right<innerWidth-30&&box.bottom<innerHeight-100;
    }));
    if(index<0)throw new Error('No on-screen draggable card');
    const node=desk.locator('.svelte-flow__node').nth(index),title=node.locator('h2,h3,.title').first();
    const before=await node.getAttribute('style');
    const box=await title.boundingBox();
    if(!box)throw new Error('No draggable fixture card');
    await desk.mouse.move(box.x+Math.min(30,box.width/2),box.y+box.height/2);
    await desk.mouse.down();await desk.mouse.move(box.x+90,box.y+55,{steps:30});await desk.mouse.up();
    await desk.waitForTimeout(500);
    const after=await node.getAttribute('style');
    if(before===after)throw new Error('Drag did not move the node; do not report a drag performance result');
   }));
   await desk.screenshot({path:path.join(out,'desktop-50.png')});
   const system=await app.evaluate(({app,BrowserWindow})=>({metrics:app.getAppMetrics(),nativeViews:BrowserWindow.getAllWindows().reduce((s,w)=>s+w.contentView.children.length,0)}));
   const desktopResult={measurements,baseline,system,gates:{frameP95:measurements.every(m=>m.p95<=20),cameraPaths:measurements.filter(m=>m.name.includes('camera')).every(m=>m.routePasses===0&&m.changedGeometry.length===0)}};
   const serialized=JSON.stringify(desktopResult,null,2);
   fs.writeFileSync(path.join(out,'desktop-results.json'),serialized);
   fs.writeFileSync(path.join(out,'desktop-results-'+Date.now()+'.json'),serialized);
   console.log(JSON.stringify({desktop:measurements,nativeViews:system.nativeViews}));
  }finally{await app.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});


