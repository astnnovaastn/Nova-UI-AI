import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
function component(file){const source=fs.readFileSync(new URL('../src/components/Research/'+file,import.meta.url),'utf8');const exports={};const context={exports,require:name=>name.endsWith('.css')?{}:require(name)};vm.createContext(context);vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,context);return {exports,source};}
const history=component('ResearchHistoryItem.tsx');const removed=component('RecentlyRemovedResearch.tsx');
test('spinner follows real activity and stops for terminal or paused states',()=>{
 for(const phase of ['queued','collecting_sources','comparing_evidence','preparing_report','running'])assert.equal(history.exports.historyActivity({phase}).pending,true,phase);
 for(const phase of ['complete','completed','failed','draft','cancelled'])assert.equal(history.exports.historyActivity({phase,completeness:'pending'}).pending,false,phase);
 for(const phase of ['waiting_for_quota','waiting_for_report','paused']){const result=history.exports.historyActivity({phase});assert.equal(result.pending,false);assert.equal(result.waiting,true);}
 assert.equal(history.exports.historyActivity({completeness:'pending'}).pending,true);
});
test('removed entries expose full titles, restore actions, and bounded show more',()=>{
 const items=Array.from({length:8},(_,i)=>({research_id:String(i),display_title:'Full readable research title '+i}));
 const html=renderToStaticMarkup(React.createElement(removed.exports.RecentlyRemovedResearch,{items,onRestore:async()=>{}}));
 assert.ok(html.includes('Full readable research title 7'));
 assert.equal((html.match(/class="rh-removed-entry"/g)||[]).length,5);
 assert.ok(html.includes('Show more ('));assert.ok(html.includes('Restore Full readable research title 7'));
});
test('restore prevents double submission, reports failures and permits retry',async()=>{
 const tree=ts.createSourceFile('removed.tsx',removed.source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let fn;
 function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='restore')fn=n.getText(tree);ts.forEachChild(n,visit);}visit(tree);
 let resolve;let calls=0;const state={busy:'',error:''};const ctx={inFlight:{current:false},setRestoring:v=>state.busy=v,setError:v=>state.error=v,onRestore:()=>{calls++;return new Promise(r=>resolve=r);}};
 vm.createContext(ctx);vm.runInContext(ts.transpileModule(fn,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,ctx);
 const first=ctx.restore({research_id:'one'});await ctx.restore({research_id:'two'});assert.equal(calls,1);assert.equal(state.busy,'one');resolve();await first;assert.equal(state.busy,'');
 ctx.onRestore=async()=>{throw Error('Try again');};await ctx.restore({research_id:'one'});assert.equal(state.error,'Try again');assert.equal(ctx.inFlight.current,false);
});
