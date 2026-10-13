import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
test('Acknowledged category navigation, conversations and contained Settings',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('#btn-menu').click();await page.locator('#btn-settings').click();
 await expect(page.locator('#settings-container .settings-panel')).toBeVisible();
 const containment=await page.evaluate(()=>{const p=document.querySelector('#settings-panel-inner'),b=p.querySelector('.settings-body'),h=p.querySelector('.settings-header');const before=h.getBoundingClientRect().top;b.scrollTop=b.scrollHeight;return {scroll:b.scrollTop,headerStable:Math.abs(before-h.getBoundingClientRect().top)<1,clipped:getComputedStyle(p).overflow==='hidden',bodyContained:b.getBoundingClientRect().bottom<=p.getBoundingClientRect().bottom+1};});
 expect(containment.scroll).toBeGreaterThan(0);expect(containment.headerStable&&containment.clipped&&containment.bodyContained).toBe(true);
 await page.locator('#btn-memory-workspace').click();
 const canvas=page.locator('.memory-network-canvas');await expect(canvas).toBeVisible();
 await page.evaluate(()=>{window.__memoryAck=[];window.addEventListener('nova-memory-view-result',e=>window.__memoryAck.push(e.detail));window.dispatchEvent(new CustomEvent('nova-memory-view-action',{detail:{action:'category',category:'long_term_goals',request_id:'ui-navigation-check'}}));});
 await expect.poll(()=>page.evaluate(()=>window.__memoryAck.find(r=>r.request_id==='ui-navigation-check')?.status)).toBe('completed');
 await expect.poll(async()=>Number(await canvas.getAttribute('data-zoom'))).toBeGreaterThan(1.5);
 await expect(page.getByRole('button',{name:'Browse conversations'})).toHaveCount(0);
 await page.getByRole('button',{name:'Close memory inspector'}).click();
 if(!await page.getByRole('button',{name:'History',exact:true}).isVisible())await page.getByRole('button',{name:'Toggle conversation panel'}).click();
 await page.getByRole('button',{name:'History',exact:true}).click();await expect(page.getByRole('textbox',{name:'Search conversations'})).toBeVisible();
 expect(errors).toEqual([]);
});
