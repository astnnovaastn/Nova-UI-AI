const {chromium,expect}=require('@playwright/test'),fs=require('fs'),path=require('path');
const catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../core/work/card_catalog.json'),'utf8'));
(async()=>{fs.mkdirSync('v26-verification',{recursive:true});const b=await chromium.launch({channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:1600,height:1050}}),errors=[],visited=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto('http://127.0.0.1:5194/v20-simulation.html?aegisFixture=mixed-result&panel=adaptive');
 await p.locator('.adaptive-gallery').waitFor();
 for(const family of catalog.families){
  await p.getByLabel('Family',{exact:true}).selectOption(family.id);
  for(const preset of family.presets.filter(p=>p.available)){
   await p.getByLabel('Presentation',{exact:true}).selectOption(preset.id);
   await expect(p.locator('.adaptive').first()).toHaveAttribute('data-preset',preset.id);
   await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   expect(await p.locator('.adaptive').first().innerText()).toContain('Revision 1');
   visited.push(preset.id);
  }
  await p.getByLabel('Presentation',{exact:true}).selectOption(family.presets[0].id);
  await p.screenshot({path:'v26-verification/'+family.id+'.png'});
  console.log('Verified '+family.id+' '+visited.length);
 }
 await p.getByLabel('Family',{exact:true}).selectOption('table');await p.getByLabel('Data size',{exact:true}).selectOption('100');
 await expect(p.getByRole('button',{name:'Open all 100',exact:true})).toBeVisible();await p.getByRole('button',{name:'Open all 100',exact:true}).click();
 await expect(p.locator('.lift .adaptive')).toBeVisible();await p.locator('.lift').getByRole('button',{name:'Next',exact:true}).click();await expect(p.locator('.lift footer').last()).toContainText('51–100');
 await p.keyboard.press('Escape');await expect(p.locator('.lift')).toHaveCount(0);
 await p.getByLabel('Family',{exact:true}).selectOption('answer');await p.getByLabel('Presentation',{exact:true}).selectOption('answer.bespoke.9');
 await p.locator('.tabs').getByRole('button',{name:'evidence',exact:true}).click();await expect(p.locator('.adaptive').first()).toHaveAttribute('data-tab','evidence');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'v26-verification/narrow.png'});
 expect(errors).toEqual([]);fs.writeFileSync('v26-verification/browser-results.json',JSON.stringify({visited:visited.length,unique:new Set(visited).size,errors,pagination:true,tabs:true,narrow:true},null,2));
 console.log('PASS '+visited.length+' adaptive presentations');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
