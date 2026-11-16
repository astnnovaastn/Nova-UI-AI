const {chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:5187/v20-simulation.html?aegisFixture=mixed-result&count=5');
 await page.waitForLoadState('networkidle');
 await page.waitForTimeout(1500);
 const out=path.resolve(__dirname,'../v20-verification');fs.mkdirSync(out,{recursive:true});
 await page.screenshot({path:path.join(out,'first-render.png')});
 console.log(JSON.stringify({errors,nodes:await page.locator('.svelte-flow__node').count(),text:(await page.locator('body').innerText()).slice(0,3000),buttons:await page.getByRole('button').allTextContents()}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
