const {chromium}=require('@playwright/test');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:960},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const url=(count,width=404)=>'http://127.0.0.1:5187/v20-simulation.html?aegisFixture=source-collections&count=5&panel=stack&pages='+count+'&sourceWidth='+width;
 const out=path.resolve(__dirname,'../v20-verification');
 for(const width of [336,404]){
  await page.goto(url(1,width));
  await page.locator('.source-fixture .page').waitFor();
  await page.screenshot({path:path.join(out,'source-width-'+width+'.png')});
  const box=await page.locator('.source-fixture .page').boundingBox();
  if(Math.abs(box.width-width)>1)throw Error('Wrong frame width '+box.width);
 }
 for(const count of [3,10]){
  await page.goto(url(count));
  const anchor=page.locator('.source-fixture .page').first();
  const before=await anchor.boundingBox();
  await page.mouse.move(before.x+before.width/2,before.y+before.height/2);
  const fan=page.locator('.source-stack-fan');
  await fan.waitFor();await page.waitForTimeout(350);
  if(await fan.locator('.page').count()!==count)throw Error('Lost source pages');
  await fan.locator('.page').nth(1).click();
  await page.locator('output').filter({hasText:'https://example.org/fixture/2'}).waitFor();
  const after=await anchor.boundingBox();
  if(before.x!==after.x||before.y!==after.y)throw Error('Stack moved');
  await page.screenshot({path:path.join(out,'source-stack-'+count+'.png')});
  await page.mouse.move(1300,900);await page.waitForTimeout(650);
  await fan.waitFor({state:'detached'});
  await page.getByRole('button',{name:'Show all '+count+' pages from Supplied reference pages',exact:true}).focus();
  await page.keyboard.press('Enter');await fan.waitFor();await page.waitForTimeout(350);
  await page.keyboard.press('Escape');await fan.waitFor({state:'detached'});
 }
 await page.setViewportSize({width:520,height:820});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(url(10));await page.getByRole('button',{name:'Show all 10 pages from Supplied reference pages',exact:true}).tap();
 await page.locator('.source-stack-fan').waitFor();await page.waitForTimeout(350);
 const fan=await page.locator('.source-stack-fan').boundingBox();
 if(fan.x<0||fan.x+fan.width>521)throw Error('Fan outside visible workspace');
 await page.screenshot({path:path.join(out,'source-stack-narrow-reduced.png')});
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'source-stack-results.json'),JSON.stringify({fixture:true,counts:[1,3,10],widths:[336,404],pageTwoCorrect:true,anchorStable:true,keyboard:true,reducedMotion:true,narrow:true,errors},null,2));
 await browser.close();console.log('Source stack checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});

