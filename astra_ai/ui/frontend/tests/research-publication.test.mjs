import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const text=fs.readFileSync(new URL('../src/components/Research/researchPublication.ts',import.meta.url),'utf8');
const exports={};vm.runInNewContext(ts.transpile(text,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}),{exports});
test('publication rejects stale updates, another page, and another session',()=>{
 const current={research_id:'a',research_session_id:'session',update_sequence:10};
 assert.equal(exports.acceptPublication(current,{...current,update_sequence:9}),false);
 assert.equal(exports.acceptPublication(current,{...current,research_id:'b',update_sequence:11}),false);
 assert.equal(exports.acceptPublication(current,{...current,research_session_id:'other',update_sequence:11}),false);
 assert.equal(exports.acceptPublication(current,{...current,update_sequence:11}),true);
});
test('a background refresh cannot replace a draft saved after that request started',()=>{
 const old={research_id:'page',update_sequence:10,draft:{revision:'older',html:'Older'}};
 const current={...old,draft:{revision:'newer',html:'Saved during refresh'}};
 assert.equal(exports.mergePublication(current,old,'older',false).draft.revision,'newer');
 assert.equal(exports.mergePublication(current,old,'newer',true).draft.html,'Saved during refresh');
 const next={...current,update_sequence:11,draft:{revision:'remote',html:'Remote update'}};
 assert.equal(exports.mergePublication(current,next,'newer',false).draft.revision,'remote');
});
test('pending and staged pages stay hidden while existing reports remain readable during extensions',()=>{
 assert.equal(exports.publicationPending({kind:'research',completeness:'pending'}),true);
 assert.equal(exports.publicationPending({kind:'research',completeness:'complete',publication_state:'preparing'}),true);
 assert.equal(exports.publicationPending({kind:'research',completeness:'complete',extension_activity:{phase:'preparing_report'}}),false);
 assert.equal(exports.publicationPending({kind:'documentary',completeness:'pending'}),false);
});
test('the single update coordinator covers all pending stages and stops at terminal states',()=>{
 for(const phase of ['queued','collecting_sources','preparing_report','preparing_layout','waiting_for_quota']) assert.equal(exports.publicationWorking({phase}),true);
 assert.equal(exports.publicationWorking({phase:'complete',extension_activity:{phase:'waiting_for_report'}}),true);
 assert.equal(exports.publicationWorking({phase:'complete',media_status:'running'}),true);
 assert.equal(exports.publicationWorking({phase:'complete',media_status:'unavailable',extension_activity:{phase:'failed'}}),false);
});
test('finished content reveals in the chosen two-to-four-second range',()=>{
 assert.equal(exports.revealDuration(500),2000);
 assert.equal(exports.revealDuration(15000),3000);
 assert.equal(exports.revealDuration(500000),4000);
});
