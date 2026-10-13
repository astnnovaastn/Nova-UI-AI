import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
globalThis.window=new EventTarget();
let state={clientId:'fixture-owner',sessionId:'fixture-session',guest:false,connected:true,state:'thinking',textBusy:false,sessionSwitching:false};
globalThis.__noticeState=()=>state;
let source=ts.transpileModule(readFileSync(new URL('./taskNotices.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
source=source.replace(/import.*from '\.\/conversation';/, 'const conversationSnapshot=globalThis.__noticeState;');
const {requestedResearchReady}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const notices=[];window.addEventListener('nova-operation-notice',e=>notices.push(e.detail));
test('requested completion waits for a conversational boundary and is deduplicated',()=>{
 requestedResearchReady('one','research-one');assert.equal(notices.length,0);
 state={...state,state:'idle'};window.dispatchEvent(new Event('nova-conversation'));assert.equal(notices.length,1);
 requestedResearchReady('one','research-one');assert.equal(notices.length,1);
});
test('pending research notices cannot cross a guest or session boundary',()=>{
 state={...state,state:'thinking'};requestedResearchReady('two','research-two');
 state={...state,guest:true,state:'idle'};window.dispatchEvent(new Event('nova-conversation'));assert.equal(notices.length,1);
 state={...state,guest:false,state:'thinking'};requestedResearchReady('three','research-three');
 state={...state,sessionId:'different',state:'idle'};window.dispatchEvent(new Event('nova-conversation'));assert.equal(notices.length,1);
});
