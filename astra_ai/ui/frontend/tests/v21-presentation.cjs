const {chromium}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:5191/v20-simulation.html?aegisFixture=architecture-atlas&count=5');
 await page.locator('[data-kind=diagram]').first().waitFor();
 await page.getByRole('button',{name:'Select / move cards'}).click();
 const node=page.locator('.svelte-flow__node').filter({has:page.locator('[data-kind=diagram]')}).first();
 await node.click({position:{x:10,y:10},force:true});
 await page.waitForTimeout(200);
 const styles=await page.locator('[data-kind=diagram]').first().evaluate(e=>{const s=getComputedStyle(e);return {font:s.fontFamily,token:s.getPropertyValue('--font-sans'),mono:s.getPropertyValue('--font-mono')};});
 console.log(styles);
 await page.locator('.svelte-flow__node-toolbar').getByRole('button',{name:'Open',exact:true}).click();
 await page.locator('dialog[open]').waitFor();await page.screenshot({path:path.resolve(__dirname,'../v21-verification/diagram-focused.png')});
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
