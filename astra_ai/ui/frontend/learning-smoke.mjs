import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'chrome'}),report=[];
for(const width of (process.argv.includes('--desktop')?[1440]:[1440,390])){
 const page=await browser.newPage({viewport:{width,height:width===1440?900:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(1100);await page.evaluate(()=>window.dispatchEvent(new Event('nova-open-memory')));
 await page.waitForSelector('.memory-globe-canvas');
 if(await page.locator('.memory-conversation').isHidden())await page.getByRole('button',{name:'Toggle conversation panel',exact:true}).click();
 const statusPromise=page.waitForResponse(r=>r.url().includes('/api/learning/status'));
 await page.locator('.memory-jobs > summary').click();const statusResponse=await statusPromise,status=await statusResponse.json();if(!statusResponse.ok()||status.status!=='ok')throw Error('Live learning status unavailable');
 await page.getByText('Isolated tools are available.',{exact:true}).waitFor();
 const unauthorized=await page.request.get('http://127.0.0.1:8340/api/learning/status',{headers:{'X-Nova-Client':'unknown-fixture'}});if(unauthorized.status()!==403)throw Error('Unknown connection accepted');
 await page.route('**/api/learning/reviews',route=>route.fulfill({json:{status:'ok',items:[{id:'fixture-tool',name:'Fixture critical helper',state:'waiting_for_approval',risk:'high',hash:'fixture-exact-hash',preview:'def run(value): return value'}]}}));
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByText('Fixture critical helper · waiting for approval',{exact:true}).click();
 await page.route('**/api/learning/approve',async route=>{const data=route.request().postDataJSON();if(data.id!=='fixture-tool'||data.expected_hash!=='fixture-exact-hash')throw Error('Approval hash mismatch');await route.fulfill({json:{status:'approved'}});});
 await page.getByRole('button',{name:'Approve this version',exact:true}).click();await page.waitForTimeout(150);
 await page.screenshot({path:`growing-memory-learning-${width}.png`});
 await page.evaluate(async()=>{const entry=performance.getEntriesByType('resource').find(e=>e.name.includes('/src/conversation.ts'));const {conversationState}=await import(entry.name);conversationState({guest:true});});await page.waitForTimeout(80);if(await page.locator('.memory-learning-review').count())throw Error('Owner reviews persisted in guest mode');
 report.push({width,liveIsolation:status.capabilities.isolation.verified,unknownConnectionRejected:true,exactVersionReview:true,guestReviewHidden:true,errors});if(errors.length)throw Error('Browser errors');await page.close();
}
await browser.close();console.log(JSON.stringify(report));
