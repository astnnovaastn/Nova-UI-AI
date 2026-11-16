const {_electron:electron}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const front=path.resolve(__dirname,'..');
 const profile=path.join(front,'v21-verification','interactive-profile');fs.mkdirSync(profile,{recursive:true});
 fs.writeFileSync(path.join(profile,'desktop.json'),JSON.stringify({uiUrl:'http://127.0.0.1:5191/v20-simulation.html?aegisFixture=mixed-result&count=8',autoStart:false,stopOnExit:false}));
 for(let i=0;i<30;i++){try{if((await fetch('http://127.0.0.1:5191/v20-simulation.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,300));}
 const app=await electron.launch({args:[path.join(front,'desktop/main.cjs')],cwd:front,env:{...process.env,AEGIS_DESKTOP_USER_DATA:profile}});
 const page=await app.firstWindow();await page.waitForURL('**/v20-simulation.html**',{timeout:30000});
 await page.locator('[data-v20-fixture]').waitFor();await page.waitForLoadState('networkidle');
 await page.bringToFront();
 console.log(JSON.stringify({ready:true,title:await page.title(),designs:await page.locator('select').first().locator('option').count(),cards:await page.locator('.svelte-flow__node').count()}));
 app.on('close',()=>process.exit(0));
})();
