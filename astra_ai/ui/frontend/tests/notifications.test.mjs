import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import ts from 'typescript';
function fixture(){
 let now=0,next=0;const timers=new Map(),listeners=new Map(),storage=new Map();
 class Element{children=[];parent=null;id='';className='';hover=false;textContent='';handlers={};classList={add:(c)=>{this.className+=' '+c;}};append(...children){for(const c of children){c.parent=this;this.children.push(c);}}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}setAttribute(k,v){this[k]=v;}addEventListener(k,f){this.handlers[k]=f;}matches(){return this.hover;}contains(e){return e===this||this.children.some(c=>c.contains(e));}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}focus(){document.activeElement=this;}}
 const body=new Element(),find=(root,id)=>root.id===id?root:root.children.map(c=>find(c,id)).find(Boolean);
 body.classList.contains=(name)=>body.className.split(' ').includes(name);
 const document={body,activeElement:null,createElement:()=>new Element(),getElementById:id=>find(body,id),addEventListener:(k,f)=>listeners.set(k,f)};
 const sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const timeout=(f,ms=0)=>{timers.set(++next,{f,at:now+ms});return next;};
 let cues=0;
 class AudioContext {state='running';sampleRate=8000;currentTime=0;destination={};resume(){return Promise.resolve();}createOscillator(){return {frequency:{},connect(){},start(){},stop(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
 const sandbox={AudioContext,exports:{},document,sessionStorage,localStorage:sessionStorage,performance:{now:()=>now},setTimeout:timeout,clearTimeout:id=>timers.delete(id),CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail;}}};
 sandbox.window={setTimeout:timeout,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k),dispatchEvent:e=>{if(e.type==='nova-local-audio-reference')cues++;return listeners.get(e.type)?.(e);}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/notifications.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,sandbox);
 function advance(ms){const end=now+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].f();}now=end;}
 return {api:sandbox.exports,document,advance,body,unlock:()=>listeners.get('pointerdown')(),cues:()=>cues};
}
test('notices play sound once without creating popup DOM or delaying work',()=>{const f=fixture();f.unlock();f.api.notify({id:'one',title:'Done'});assert.equal(f.cues(),1);assert.equal(f.document.getElementById('aegis-work-notice'),undefined);f.api.notify({id:'one',title:'Updated'});assert.equal(f.cues(),1);f.api.notify({id:'two',title:'Next'});assert.equal(f.cues(),2);f.advance(10000);assert.equal(f.document.getElementById('aegis-work-notice'),undefined);});
test('silent and historical notices do not play a backlog; sound preference is respected',()=>{const f=fixture();f.unlock();f.api.notify({id:'quiet',title:'Quiet',silent:true});f.api.notify({id:'old',title:'Old',inboxOnly:true});assert.equal(f.cues(),0);});
test('dismissed notices remain in scoped inbox and cannot cross a guest boundary',()=>{const f=fixture();f.api.noticeScope('owner');f.api.notify({id:'approval',title:'Review action'});f.advance(3200);f.api.showNotificationHistory();let inbox=f.document.getElementById('nova-notification-inbox');assert.ok(inbox.children.some(c=>c.textContent==='Review action'));f.api.noticeScope('guest');assert.equal(f.document.getElementById('nova-notification-inbox'),undefined);f.api.noticeScope('owner');f.api.showNotificationHistory();inbox=f.document.getElementById('nova-notification-inbox');assert.ok(inbox.children.some(c=>c.textContent==='Review action'));});

test('initial snapshots populate inbox without popping up a backlog',()=>{const f=fixture();f.api.noticeScope('owner');f.api.notify({id:'old',title:'Old result',inboxOnly:true});assert.equal(f.document.getElementById('aegis-work-notice'),undefined);f.api.showNotificationHistory();assert.ok(f.document.getElementById('nova-notification-inbox').children.some(c=>c.textContent==='Old result'));});

test('research completion sounds once in Research without a popup, including duplicate readiness events',()=>{
 const f=fixture();f.unlock();f.body.classList.add('research-workspace-open');
 f.api.notify({id:'ready-event',title:'Research ready',kind:'research',target:{research_id:'report-one'}});
 f.api.notify({id:'task-event',title:'Research ready',kind:'research',target:{research_id:'report-one'}});
 assert.equal(f.document.getElementById('aegis-work-notice'),undefined);assert.equal(f.cues(),1);
 f.api.notify({id:'another-report',title:'Second ready',kind:'research',target:{research_id:'report-two'}});assert.equal(f.cues(),2);
});

test('owner confirmation is nonblocking and synthetic model clicks cannot approve',async()=>{const f=fixture();let done=false;const result=f.api.confirmOwner('Delete fixture','fixture','revision').then(value=>{done=true;return value;});const dialog=f.body.children.find(c=>c.className==='nova-owner-confirmation');assert.equal(dialog.open,true);dialog.children.at(-1).children[1].onclick({isTrusted:false});await Promise.resolve();assert.equal(done,false);f.api.notify({id:'progress',title:'Other work continues'});f.advance(3200);assert.equal(done,false);dialog.children.at(-1).children[1].onclick({isTrusted:true});assert.equal(await result,true);});
test('a scope change cancels pending owner confirmation',async()=>{const f=fixture();f.api.noticeScope('owner');const result=f.api.confirmOwner('Delete fixture','fixture','revision');f.api.noticeScope('guest');assert.equal(await result,false);assert.ok(!f.body.children.some(c=>c.className==='nova-owner-confirmation'));});

test('notification history has no persistent microphone-adjacent launcher',()=>{const f=fixture();assert.equal(f.document.getElementById('nova-notification-button'),undefined);});
