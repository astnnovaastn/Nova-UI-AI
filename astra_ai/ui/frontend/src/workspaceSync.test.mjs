import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(){
 const listeners={},events=[],themes=[],sent=[],storage=new Map();let receive,open,close;
 const context={exports:{},require:name=>name==='./notifications'?{setSoundArbiter(){}}:name==='./conversation'?{conversationSnapshot:()=>({sessionId:'chat'}),uiSnapshot:()=>({research_id:'page'}),conversationMessage(){},conversationResearch(){}}:{applyTheme:theme=>themes.push(theme.id)},
  crypto:{randomUUID:()=> 'window-identity'},sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},Date,Map,Number,Math,String,Promise,setTimeout(){},setInterval(){},
  document:{visibilityState:'visible',addEventListener(){}},window:{addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},Event:class{constructor(type){this.type=type;}}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./workspaceSync.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 context.exports.startWorkspaceSync({send:value=>sent.push(value),onMessage:fn=>receive=fn,onOpen:fn=>open=fn,onClose:fn=>close=fn});
 open();receive({type:'status',client_id:'transport'});
 return {api:context.exports,events,themes,sent,receive,close};
}

test('observer registration never starts an AI session or microphone',()=>{
 const h=harness();assert.deepEqual(h.sent.map(m=>m.type),['workspace_hello']);assert.equal(h.api.ownsVoice(),false);
});

test('out-of-order resource updates are retained while duplicates are ignored',()=>{
 const h=harness();
 for(const [sequence,entity_id] of [[2,'second'],[1,'first'],[1,'first']])h.receive({type:'workspace_event',sequence,resource:'research',entity_id,data:{}});
 assert.deepEqual(h.events.filter(e=>e.type==='nova-research-refresh').map(e=>e.detail.research_id),['second','first']);
});

test('bootstrap applies current theme after older journal events and replays missed updates',()=>{
 const h=harness();h.receive({type:'workspace_bootstrap',boot_id:'boot',sequence:2,events:[{sequence:1,resource:'theme',data:{theme:{id:'old'}}}],theme:{id:'current'}});
 assert.deepEqual(h.themes,['old','current']);
 h.receive({type:'workspace_heartbeat_ack',events:[{sequence:3,resource:'research',entity_id:'missed',data:{}}]});
 assert.equal(h.events.at(-1).detail.research_id,'missed');
});

test('connection loss fences an existing voice lease without restarting it',()=>{
 const h=harness();h.receive({type:'workspace_voice_result',granted:true,owner:{client_id:'transport',generation:1}});assert.equal(h.api.ownsVoice(),true);
 h.close();assert.equal(h.api.ownsVoice(),false);assert.equal(h.events.at(-1).type,'nova-voice-lease-lost');assert.equal(h.sent.length,1);
});
