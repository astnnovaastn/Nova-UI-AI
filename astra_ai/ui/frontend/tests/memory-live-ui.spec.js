import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
test('Local running memory network renders existing records',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#btn-menu').click();await page.locator('#btn-settings').click();await page.locator('#btn-memory-workspace').click();const canvas=page.locator('.memory-network-canvas');await expect.poll(async()=>Number(await canvas.getAttribute('data-node-count'))).toBeGreaterThan(0);await page.getByRole('button',{name:'Pause network motion'}).click();await page.screenshot({path:info.outputPath('live-memory-network.png')});expect(errors).toEqual([]);
});
