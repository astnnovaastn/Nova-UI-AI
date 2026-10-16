import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function harness(){let resolve;const storage=new Map([['nova-conversation-session','current']]);const context={exports:{},crypto:{randomUUID:()=> 'id'},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},window:{dispatchEvent(){}},CustomEvent:class{},Event:class{},fetch:()=>new Promise(r=>resolve=d=>r({ok:true,json:async()=>d}))};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./conversation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return {api:context.exports,resolve:d=>resolve(d)};}
test('late history hydration retains a newly submitted turn and streaming reply',async()=>{const h=harness(),pending=h.api.conversationLoad('current');h.api.conversationMessage('user','New question','sending','new-user');h.api.conversationMessage('assistant','New answer','streaming','new-ai');h.resolve({status:'ok',messages:[{id:'old',role:'user',content:'Old topic'}]});await pending;assert.deepEqual(Array.from(h.api.conversationSnapshot().messages,m=>m.id),['old','new-user','new-ai']);});
test('different session hydration does not mix previous session messages',async()=>{const h=harness(),pending=h.api.conversationLoad('other');h.api.conversationMessage('user','Old draft','sending','old-user');h.resolve({status:'ok',messages:[{id:'other',role:'user',content:'Selected chat'}]});await pending;assert.deepEqual(Array.from(h.api.conversationSnapshot().messages,m=>m.id),['other']);});

test('notice polling and reconnect do not replay an existing backlog',()=>{const h=harness(),seen=new Set(),items=Array.from({length:300},(_,i)=>({id:'notice'+i,kind:'job',target:'job:'+i}));assert.equal(h.api.newNoticeIds(items,seen).length,128);assert.equal(h.api.newNoticeIds(items,seen).length,0);assert.equal(h.api.newNoticeIds([...items,{id:'new',kind:'approval',target:'memory:review'}],seen).length,1);assert.equal(seen.size,128);const target=h.api.notificationTarget({kind:'approval',target:'memory:review'});assert.equal(target.view,'approvals');assert.equal(target.id,'memory:review');});


function liveControlHarness(){
 const source=readFileSync(new URL('./main.ts',import.meta.url),'utf8');
 const start=source.indexOf("  else if(type==='live_continuation_failed')"),end=source.indexOf('  else if (type === "live_error")',start);
 assert.ok(start>0&&end>start);
 const messages=[{id:'reply:old',text:'Old reply',status:'streaming'},{id:'reply:new',text:'Current reply',status:'streaming'}];
 const calls={stop:0,resume:0,finish:0,discard:0};
 const ctx={audioGeneration:'new-generation',canceledGeneration:'',heldGeneration:'',pendingInterruptionGeneration:'',
  assistantMessageId:'reply:new',assistantTranscript:'Current reply',isAudioPlaying:true,isMuted:false,
  audioPlayer:{stop(){calls.stop++;},resumeHeldPcm(){calls.resume++;return true;},finishPcmTurn(){calls.finish++;},discardHeldPcm(){calls.discard++;}},
  conversationSnapshot:()=>({sessionId:'current',messages,textBusy:false}),conversationMessage:(role,text,status,id)=>{const old=messages.find(m=>m.id===id);if(old)Object.assign(old,{text,status});else messages.push({id,text,status});},
  conversationState(){},transition(){},window:{dispatchEvent(){}},CustomEvent:class{}};
 vm.runInNewContext('function handle(msg){const type=msg.type;'+source.slice(start,end).replace('else if','if')+'}',ctx);
 return {ctx,calls,messages};
}
test('late interruption acknowledgement cannot stop the next reply or erase its transcript',()=>{
 const {ctx,calls,messages}=liveControlHarness();ctx.handle({type:'live_interrupted',generation:'old-generation',turn_id:'old',session_id:'current',duplicate:true});
 assert.equal(calls.stop,0);assert.equal(ctx.assistantTranscript,'Current reply');assert.equal(ctx.isAudioPlaying,true);
 assert.equal(messages.find(m=>m.id==='reply:old').status,'interrupted');assert.equal(messages.find(m=>m.id==='reply:new').status,'streaming');
});
test('silent recovery consumes its checkpoint once and ignores stale or other-session recovery',()=>{
 const {ctx,calls}=liveControlHarness();ctx.heldGeneration=ctx.pendingInterruptionGeneration='old-generation';
 const event={type:'live_interruption_recovered',generation:'old-generation',next_generation:'resumed-generation',turn_id:'old',session_id:'current',output_text:'Current topic',continuing:false};
 ctx.handle({...event,session_id:'other'});assert.equal(calls.resume,0);
 ctx.handle(event);assert.equal(calls.resume,1);assert.equal(calls.finish,1);assert.equal(ctx.audioGeneration,'resumed-generation');
 ctx.handle(event);assert.equal(calls.resume,1);
});
test('failed automatic continuation drains held playback and cannot finish a newer generation',()=>{
 const {ctx,calls}=liveControlHarness();ctx.handle({type:'live_continuation_failed',session_id:'current',generation:'old-generation'});assert.equal(calls.finish,0);
 ctx.handle({type:'live_continuation_failed',session_id:'current',generation:'new-generation'});assert.equal(calls.finish,1);
});

test('research histories stay separate from main chat and late answers retain their report',()=>{
 const h=harness();h.api.conversationMessage('user','Main conversation','completed','main');
 h.api.updateUiContext({view:'research',research_id:'first'});h.api.requestConversation('First report follow-up','first-turn');
 h.api.updateUiContext({view:'research',research_id:'second'});h.api.requestConversation('Second report follow-up','second-turn');
 h.api.conversationMessage('assistant','Late first answer','completed','reply:first-turn');
 h.api.conversationMessage('assistant','Second answer','completed','reply:second-turn');
 assert.equal(h.api.conversationResearch('first')[0].text,'Late first answer');
 assert.equal(h.api.conversationResearch('second')[0].text,'Second answer');
 assert.deepEqual(Array.from(h.api.conversationSnapshot().messages,m=>m.id),['main']);
});
test('canonical research hydration deduplicates optimistic turn IDs without assigning main messages',()=>{
 const h=harness();h.api.conversationMessage('user','Question','completed','turn','report');
 h.api.conversationResearch('report',[{id:'canonical-hash',turn_id:'turn',role:'user',content:'Question'}]);
 assert.equal(h.api.conversationResearch('report').length,1);
 h.api.conversationState({clientId:'new-owner'});assert.equal(h.api.conversationResearch('report').length,0);
});
