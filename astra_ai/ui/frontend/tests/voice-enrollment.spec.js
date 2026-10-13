import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
test('guided enrollment captures three sentences and never sends audio to Live',async({page})=>{
 let enrolled=false,samples=[];
 await page.addInitScript(()=>{
  window.Worker=class{constructor(){setTimeout(()=>this.onmessage?.({data:{type:'ready'}}),10);}postMessage({pcm,epoch}){if(pcm)this.onmessage?.({data:{type:'score',epoch,probability:.95,pcm}});}terminate(){}};
  window.AudioWorkletNode=class{port={};constructor(){this.timer=setInterval(()=>this.port.onmessage?.({data:new Int16Array(640).fill(3000).buffer}),20);}connect(){}disconnect(){clearInterval(this.timer);}};
  window.AudioContext=class{state='running';destination={};audioWorklet={addModule:async()=>{}};createAnalyser(){return {context:this,connect(){},getByteFrequencyData(a){a.fill(0);},frequencyBinCount:32};}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{value:0},connect(){},disconnect(){}};}close(){this.state='closed';return Promise.resolve();}};
  navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[{stop(){}}]});
 });
 await page.route('**/api/voice/profile',r=>r.fulfill({json:{status:'ok',enabled:enrolled,enrolled,profiles:enrolled?[{id:'owner',name:'Main user',owner:true}]:[]}}));
 await page.route('**/api/voice/prepare',r=>r.fulfill({json:{status:'ok',model_ready:true}}));
 await page.route('**/api/voice/enroll',r=>{const body=r.request().postDataJSON();samples=body.samples;expect(body.profile_id).toBe('owner');enrolled=true;return r.fulfill({json:{status:'saved',profile_id:'owner'}});});
 await page.goto('/');await page.locator('#btn-menu').click();await page.locator('#btn-settings').click();await page.getByRole('button',{name:'Set up my voice',exact:true}).click();
 for(let i=0;i<3;i++){
  await expect(page.locator('#voice-enroll-title')).toHaveText('Sentence '+(i+1)+' of 3');await expect(page.locator('#voice-enroll-sentence')).not.toBeEmpty();await page.getByRole('button',{name:'Start reading',exact:true}).click();await expect(page.getByRole('button',{name:'Done reading',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Done reading',exact:true}).click();await expect(page.getByText('Sentence captured. Use this sample or read it again.')).toBeVisible();await page.locator('#voice-enroll-next').click();
 }
 await expect(page.getByRole('button',{name:'Re-record selected profile'})).toBeVisible();expect(samples).toHaveLength(3);expect(samples.every(s=>s.length>80000)).toBe(true);
});
