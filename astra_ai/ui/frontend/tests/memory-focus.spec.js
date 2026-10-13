import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
test('Floating memory expands, preserves rejected drafts and inspects conversations',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let revision=1,value='Cobalt fixture',fail=true,sessionOnly=false;
 const fact=()=>({id:'fixture',kind:'fact',category:'task_project_tracking',key:'fixture_project',label:'fixture project',value,revision,source:'human',evidence:'User supplied fixture',history:[]});
 const session={id:'session',kind:'session',category:'session_themes',label:'Conversation',session_id:'s',turn_count:1};
 await page.addInitScript(()=>{window.WebSocket=class{static OPEN=1;constructor(){this.readyState=1;window.__fixtureSocket=this;setTimeout(()=>this.onopen?.(),0);}send(){}addEventListener(){}removeEventListener(){}close(){this.readyState=3;this.onclose?.();}};});
 await page.route('**/api/memory/**',async route=>{
  const url=new URL(route.request().url());let data;
  if(url.pathname.endsWith('/categories'))data={categories:[{category:'task_project_tracking',title:'Projects',counts:{active:1}},{category:'session_themes',title:'Sessions',counts:{active:0}}]};
  else if(url.pathname.endsWith('/graph/conversation'))data={status:'ok',total:1,turns:[{turn_id:'t',messages:[{id:'u',role:'user',timestamp:'2026-10-07T10:00:00Z',content:'Completed fixture question'},{id:'a',role:'assistant',timestamp:'2026-10-07T10:00:01Z',content:'Completed fixture response'}]}]};
  else if(url.pathname.endsWith('/graph'))data={status:'ok',revision:String(revision),nodes:sessionOnly?[session]:[fact()],edges:[],total:1};
  else{const body=route.request().postDataJSON()||{};
   if(body.action==='get')data={status:'ok',record:fact()};
   else if(body.action==='list_links')data={links:[]};
   else if(body.action==='update'){
    if(fail){fail=false;return route.fulfill({status:503,json:{status:'failed',reason:'simulated_disk_failure'}});}
    if(body.expected_revision!==revision)data={status:'conflict',reason:'Memory changed. Review latest before saving.'};
    else{value=body.value;revision++;data={status:'updated',revision};}
   }else data={status:'ok'};
  }return route.fulfill({json:data});
 });
 await page.goto('/');await page.locator('#btn-menu').click();await page.locator('#btn-settings').click();await page.locator('#btn-memory-workspace').click();
 const canvas=page.locator('.memory-network-canvas');await expect(canvas).toHaveAttribute('data-node-count','1');await canvas.press('Enter');
 const panel=page.getByRole('dialog',{name:'Selected memory'});await expect(panel).toContainText('Cobalt fixture');
 await expect(panel.getByRole('button',{name:'Expand memory'})).toHaveCount(0);await page.screenshot({path:info.outputPath('memory-compact-card.png')});
 value='Cobalt fixture '+('Detailed context for this fixture. '.repeat(40));revision++;await page.evaluate(()=>window.dispatchEvent(new Event('nova-memory-changed')));
 await panel.getByRole('button',{name:'Expand memory'}).click();await expect(panel).toHaveClass(/memory-focus-expanded/);await expect(panel).toHaveAttribute('aria-modal','false');
 const box=await panel.boundingBox();expect(box.width).toBeLessThanOrEqual(460);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height-70);await page.screenshot({path:info.outputPath('memory-expanded-card.png')});
 await panel.getByRole('button',{name:'Collapse',exact:true}).click();await expect(panel).toHaveClass(/memory-focus-floating/);
 await panel.getByRole('button',{name:'Evidence',exact:true}).click();await expect(panel).toContainText('User supplied fixture');
 await panel.getByRole('button',{name:'Overview',exact:true}).click();await panel.getByRole('button',{name:'Edit',exact:true}).click();
 await panel.getByLabel('Edit selected memory value').fill('Revised fixture');await panel.getByRole('button',{name:'Save changes'}).click();await expect(panel.getByRole('alert')).toContainText('simulated_disk_failure');
 revision++;await panel.getByRole('button',{name:'Save changes'}).click();await expect(panel.getByRole('alert')).toContainText('Memory changed');
 await expect(panel.getByLabel('Edit selected memory value')).toHaveValue('Revised fixture');await panel.getByRole('button',{name:'Review latest memory'}).click();
 await expect(panel).toContainText('Revision 3');await panel.getByRole('button',{name:'Save changes'}).click();await expect(panel.getByLabel('Edit selected memory value')).toHaveCount(0);await expect(panel).toContainText('Revised fixture');
 await page.screenshot({path:info.outputPath('memory-full-details.png')});await panel.getByRole('button',{name:'Close selected memory'}).click();
 sessionOnly=true;revision++;await page.evaluate(()=>window.dispatchEvent(new Event('nova-memory-changed')));await expect.poll(()=>canvas.getAttribute('data-node-count')).toBe('1');
 await expect.poll(async()=>{await canvas.press('Enter');return panel.innerText();}).toContain('Completed fixture response');await expect(panel).toContainText('1 completed turn');
 await panel.getByRole('button',{name:'Close selected memory'}).click();await page.getByRole('button',{name:'Pause network motion'}).click();await expect(canvas).toHaveAttribute('data-motion','paused');
 const rotation=await canvas.getAttribute('data-rotation');await page.waitForTimeout(250);expect(await canvas.getAttribute('data-rotation')).toBe(rotation);
 await page.evaluate(()=>window.__fixtureSocket.close());await expect(page.locator('#status-text')).toHaveText('reconnecting…');await expect(page.locator('#status-text')).toHaveText('Click the microphone button to start talking');expect(errors).toEqual([]);
});
