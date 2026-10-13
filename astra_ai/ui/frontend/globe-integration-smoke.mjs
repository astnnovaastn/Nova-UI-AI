import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'chrome'});
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===1440?900:844},hasTouch:width===390}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(1200);await page.evaluate(()=>window.dispatchEvent(new Event('nova-open-memory')));
 await page.waitForFunction(()=>Number(document.querySelector('.memory-globe-host canvas')?.dataset.globeMemories)>0,{timeout:45000});await page.waitForTimeout(1500);
 const info=await page.locator('.memory-globe-host canvas').evaluate(el=>({memories:Number(el.dataset.globeMemories),links:Number(el.dataset.globeLinks),background:getComputedStyle(el.parentElement).backgroundColor,stats:el.parentElement.querySelector(".memory-globe-stats")?.textContent}));
 await page.screenshot({path:`supplied-memory-globe-${width}.png`});
 console.log(JSON.stringify({width,...info,oldCanvases:await page.locator('.memory-network-canvas').count(),errors}));if(!info.memories||errors.length)process.exitCode=1;
 await page.close();
}
await browser.close();
