import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSavedNote} from './resolveSavedNote.mjs';
test('a newly persisted research note opens by ID before cache refresh',async()=>{
 const saved={id:'new-note',content:'Complete sourced report'};let refreshed=false;
 const result=await resolveSavedNote({notes:[{id:'old',content:'Unsaved draft is separate'}],noteId:'new-note',refresh:async()=>({notes:[saved]}),onRefresh:()=>{refreshed=true;},match:async()=>{throw Error('Must not substitute a different note');}});
 assert.equal(result,saved);assert.equal(refreshed,true);
});
test('missing explicit note IDs never fall through to a different matching note',async()=>{
 const result=await resolveSavedNote({notes:[],noteId:'missing',query:'similar',refresh:async()=>({notes:[]}),match:async()=>({note:{id:'wrong'}})});
 assert.equal(result,null);
});
