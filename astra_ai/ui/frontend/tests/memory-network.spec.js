import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
test('Live network grows from committed records and supports navigation',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let records=Array.from({length:180},(_,i)=>({id:`r${i}`,category:['user_identity','personal_preferences','task_project_tracking','meta_memory'][i%4],key:`fixture_${i}`,value:`Test memory ${i}`,revision:1,kind:'fact',effective_lifecycle:'active'}));
 const categories=['user_identity','personal_preferences','task_project_tracking','meta_memory'];
 let links=[{id:'link1',from:'r0',to:'r1',type:'supports',evidence:'Fixture user connected these memories'}];
 await page.addInitScript(()=>{window.WebSocket=class{static OPEN=1;constructor(){this.readyState=1;setTimeout(()=>this.onopen?.(),0);}send(){}addEventListener(){}removeEventListener(){}close(){}};});
 await page.route('**/api/memory/**',route=>{const url=new URL(route.request().url());let data;
 if(url.pathname.endsWith('/categories'))data={categories:categories.map(category=>({category,title:category.replaceAll('_',' '),counts:{active:records.filter(r=>r.category===category).length,pending:0,forgotten:0}}))};
 else if(url.pathname.endsWith('/graph')){const found=records.filter(r=>r.effective_lifecycle==='active');data={status:'ok',nodes:found,edges:links,revision:String(found.length),total:found.length};}
 else if(url.pathname.endsWith('/records')){const found=records.filter(r=>!url.searchParams.get('category')||r.category===url.searchParams.get('category'));const offset=Number(url.searchParams.get('offset')||0);data={matches:found.slice(offset,offset+Number(url.searchParams.get('limit')||20)),total:found.length};}
 else{const body=route.request().postDataJSON()||{};data=body.action==='list_links'?{links,total:links.length}:body.action==='list_pending'?{proposals:[]}:body.action==='list_conflicts'?{conflicts:[]}:body.action==='get'?{record:records.find(r=>r.id===body.record_id)}:{status:'ok'};}
 return route.fulfill({json:data});});
 await page.goto('/');await page.locator('#btn-menu').click();await page.locator('#btn-settings').click();await page.locator('#btn-memory-workspace').click();
 const canvas=page.locator('.memory-network-canvas');await expect(canvas).toHaveAttribute('data-node-count','180');await expect(canvas).toHaveAttribute('data-link-count','1');
 await expect(page.getByText('Your memory universe')).toHaveCount(0);await expect(page.getByRole('region',{name:'Connected memory engine'})).toBeHidden();
 await canvas.focus();await canvas.press('+');await expect.poll(async()=>Number(await canvas.getAttribute('data-zoom'))).toBeGreaterThan(1);
 await canvas.press('ArrowRight');const rotation=Number(await canvas.getAttribute('data-rotation'));await canvas.press('ArrowRight');await expect.poll(async()=>Number(await canvas.getAttribute('data-rotation'))).toBeGreaterThan(rotation);
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.55);await page.mouse.up();await page.mouse.wheel(0,-200);await expect.poll(async()=>Number(await canvas.getAttribute('data-zoom'))).toBeGreaterThan(1.1);
 records.push({id:'new-record',category:'task_project_tracking',key:'new_fixture',value:'newly committed fixture',revision:1,kind:'fact',effective_lifecycle:'active'});links.push({id:'new-link',from:'r2',to:'new-record',type:'related_to',evidence:'User supplied project context'});
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nova-memory-changed')));await expect(canvas).toHaveAttribute('data-node-count','181');await expect(canvas).toHaveAttribute('data-link-count','2');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nova-ai-state',{detail:{state:'speaking'}})));await expect(canvas).toHaveAttribute('data-ai-state','speaking');await expect.poll(async()=>Number(await canvas.getAttribute('data-signal-count'))).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Open memory library'}).click();await page.getByRole('navigation',{name:'Memory categories'}).getByRole('button',{name:/task project tracking/i}).click();await expect(canvas).toHaveAttribute('data-node-count','46');
 await page.getByRole('button',{name:'Back to categories'}).click();await page.getByRole('button',{name:'Close memory inspector'}).click();await page.getByRole('button',{name:'Reset network view'}).click();await expect.poll(async()=>Math.abs(Number(await canvas.getAttribute('data-zoom'))-Number(await canvas.getAttribute('data-fit')))).toBeLessThan(.001);
 await canvas.press('Enter');await expect(page.getByRole('dialog',{name:'Selected memory'})).toBeVisible();await page.screenshot({path:info.outputPath('memory-compact-network.png')});await page.getByRole('button',{name:'Close selected memory'}).click();
 await page.getByRole('button',{name:'Pause network motion'}).click();await expect(canvas).toHaveAttribute('data-signal-count','0');await page.screenshot({path:info.outputPath('memory-network.png')});
 await page.getByRole('button',{name:'Return to dashboard'}).click();await expect(canvas).toBeHidden();await expect(page.getByRole('button',{name:'Notes',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
