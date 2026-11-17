// Inspect a real saved run without starting research or changing its card arrangement.
const { _electron: electron } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const frontend=path.resolve(__dirname,'..');
const output=process.argv[2];
async function main(){
  fs.mkdirSync(output,{recursive:true});
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'aegis-saved-smoke-'));
  const app=await electron.launch({args:[path.join(frontend,'desktop/main.cjs')],cwd:frontend,timeout:60000,env:{...process.env,AEGIS_DESKTOP_USER_DATA:profile}});
  try{
    const page=await app.firstWindow();
    await page.waitForURL('http://127.0.0.1:5173/**',{timeout:120000});
    const errors=[],writes=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route(/\/api\/(research|work\/runs)\/?(?:\?|$)/,route=>{
      if(route.request().method()==='POST'){writes.push(route.request().url());return route.abort();}
      return route.continue();
    });
    await page.evaluate(()=>sessionStorage.setItem('nova-current-workspace','research'));
    await page.reload();await page.locator('.aegis-work-stage').waitFor({timeout:40000});
    await page.getByRole('button',{name:'Research library',exact:true}).click();
    const search=page.locator('#research-history-panel input[type="search"]');
    await search.fill('DeepMind');
    const row=page.locator('#research-history-panel .rh-row').filter({hasText:/DeepMind/i}).first();
    await row.waitFor({timeout:30000});
    const title=await row.innerText();
    await row.click();
    if(await page.locator('#research-history-panel').isVisible())await page.keyboard.press('Escape');
    await page.locator('.svelte-flow__node').first().waitFor({timeout:40000});
    await page.waitForTimeout(1800);
    const camera=await page.locator('.svelte-flow__viewport').first().getAttribute('style');
    const info={title,nodes:await page.locator('.svelte-flow__node').count(),wires:await page.locator('.svelte-flow__edge').count(),skills:await page.locator('.skill-marks').innerText().catch(()=>''),panes:await app.evaluate(()=>globalThis.aegisDesktopDiagnostics().panes.length)};
    assert.equal(info.panes,0);assert(info.nodes>3);
    await page.screenshot({path:path.join(output,'saved-run.png')});
    const stacks=page.locator('.stack-toggle');
    if(await stacks.count()){
      const visible=await stacks.evaluateAll(elements=>elements.map((e,i)=>({i,r:e.getBoundingClientRect()})).filter(({r})=>r.x>150&&r.y>70&&r.right<innerWidth&&r.bottom<innerHeight-90).map(({i})=>i));
      if(visible.length){
        await stacks.nth(visible[0]).hover();await page.locator('.source-stack-fan').waitFor();await page.waitForTimeout(350);
        info.expandedPages=await page.locator('.source-stack-fan .page').count();
        await page.screenshot({path:path.join(output,'saved-stack.png')});
        assert.equal(await app.evaluate(()=>globalThis.aegisDesktopDiagnostics().panes.length),0);
        assert.equal(await page.locator('.svelte-flow__viewport').first().getAttribute('style'),camera);
      }
    }
    info.errors=errors;info.newResearchRequests=writes;
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    fs.writeFileSync(path.join(output,'saved-run.json'),JSON.stringify(info,null,2));
    console.log('PASS saved run',JSON.stringify(info));
  }finally{await app.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
