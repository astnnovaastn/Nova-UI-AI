/** Optional Markdown bridge. Only a directory chosen in Electron is writable. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
class NoteFiles {
 constructor(stateFile){this.stateFile=stateFile;this.pending=Promise.resolve();}
 async read(){try{return JSON.parse(await fs.readFile(this.stateFile,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async save(state){await fs.mkdir(path.dirname(this.stateFile),{recursive:true});const temp=this.stateFile+'.tmp';await fs.writeFile(temp,JSON.stringify(state));await fs.rename(temp,this.stateFile);}
 enqueue(action){const work=this.pending.then(action);this.pending=work.catch(()=>{});return work;}
 select(folder){return this.enqueue(async()=>{const resolved=await fs.realpath(folder);if(!(await fs.stat(resolved)).isDirectory())throw Error('Choose a folder');await this.save({folder:resolved,files:{}});return {folder:resolved};});}
 disable(){return this.enqueue(()=>fs.rm(this.stateFile,{force:true}));}
 sync(notes){return this.enqueue(()=>this.run(notes));}
 async run(notes){
  const state=await this.read();if(!state)return {enabled:false,updates:[],conflicts:[]};
  if(!Array.isArray(notes)||notes.length>1000)throw Error('The sync batch is too large');
  const root=await fs.realpath(state.folder);if(root!==state.folder)throw Error('The selected folder changed');
  const updates=[],conflicts=[];let written=0,total=0;
  for(const note of notes){
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(note.id)||typeof note.markdown!=='string')throw Error('Invalid note record');
   total+=Buffer.byteLength(note.markdown);if(total>32_000_000||Buffer.byteLength(note.markdown)>4_000_000)throw Error('Notes exceed the sync size limit');
  }
  for(const note of notes){
   const name=note.id+'.md',file=path.join(root,name),local=hash(note.markdown),base=state.files[note.id];let remote=null,text='';
   try{const info=await fs.lstat(file);if(!info.isFile()||info.isSymbolicLink()||info.size>4_000_000)throw Error('Unsafe or oversized Markdown file');text=new TextDecoder('utf-8',{fatal:true}).decode(await fs.readFile(file));remote=hash(text);}catch(e){if(e.code!=='ENOENT')throw e;}
   if(remote===local){state.files[note.id]=local;continue;}
   if(remote!==null&&(!base||(remote!==base&&local!==base))||remote===null&&base){conflicts.push({id:note.id,file:name});continue;}
   if(base&&remote!==base&&local===base){updates.push({id:note.id,base_revision:note.revision,markdown:text});continue;}
   const temp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(temp,note.markdown,{flag:'wx'});await fs.rename(temp,file);state.files[note.id]=local;written++;
  }
  await this.save(state);return {enabled:true,folder:root,written,updates,conflicts};
 }
}
module.exports={NoteFiles};
