const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {NoteFiles}=require('../desktop/note-files.cjs');
test('optional Markdown sync keeps external and internal conflicts intact',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'aegis-notes-test-'));
 try{const folder=path.join(root,'markdown');await fs.mkdir(folder);const bridge=new NoteFiles(path.join(root,'state.json'));
 assert.equal((await bridge.sync([])).enabled,false);await bridge.select(folder);
 const note={id:'one',revision:'base',markdown:'# Original'};
 assert.equal((await bridge.sync([note])).written,1);
 await fs.writeFile(path.join(folder,'one.md'),'# External');
 const result=await bridge.sync([note]);assert.equal(result.updates[0].markdown,'# External');
 const conflict=await bridge.sync([{...note,markdown:'# Local'}]);assert.equal(conflict.conflicts.length,1);
 assert.equal(await fs.readFile(path.join(folder,'one.md'),'utf8'),'# External');
 await assert.rejects(bridge.sync([{...note,id:'../escape'}]),/Invalid note/);
 await bridge.disable();assert.equal((await bridge.sync([])).enabled,false);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
