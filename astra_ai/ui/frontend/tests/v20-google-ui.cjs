const {chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:5187/v20-simulation.html?aegisFixture=priority-inbox&count=5&panel=google');
 await page.getByRole('button',{name:'Read up to 10 messages'}).click();
 await page.getByRole('button',{name:'Use in next task'}).click();
 await page.getByText('Fixture selected: Fixture: review the design',{exact:true}).waitFor();
 await page.screenshot({path:path.resolve(__dirname,'../v20-verification/google-messages-fixture.png')});
 await page.getByRole('button',{name:'Read calendar events'}).click();
 await page.getByRole('button',{name:'Use in next task'}).click();
 await page.getByText('Fixture selected: Fixture: design review',{exact:true}).waitFor();
 await page.screenshot({path:path.resolve(__dirname,'../v20-verification/google-calendar-fixture.png')});
 await page.getByRole('button',{name:'Disconnect',exact:true}).click();
 await page.getByRole('button',{name:'Connect Google',exact:true}).click();
 const link=page.getByRole('link',{name:'Continue with Google in your browser'});
 if(!(await link.getAttribute('href')).startsWith('https://accounts.google.com/'))throw Error('Wrong consent URL');
 if(page.context().pages().length!==1)throw Error('Unsolicited window');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.resolve(__dirname,'../v20-verification/google-ui-results.json'),JSON.stringify({fixture:true,realAccountConnected:false,checks:['message selection','calendar selection','disconnect','fresh consent link','zero unsolicited windows'],errors},null,2));
 await browser.close();
 console.log('Google fixture UI: five interaction checks passed; no account connection or network call.');
})().catch(e=>{console.error(e);process.exit(1)});

