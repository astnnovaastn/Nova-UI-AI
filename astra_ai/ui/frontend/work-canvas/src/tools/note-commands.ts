import {notes} from './sessions.svelte';
import {invoke} from '../native/core';
const handled=new Set<string>();
export async function runNoteCommand(c:Record<string,any>){
 const key=String(c.request_id||c.issuedAt||'')+':'+c.command;if(handled.has(key))return;handled.add(key);
 const result=(status:string,detail:string)=>window.dispatchEvent(new CustomEvent('aegisWidgetActionResult',{detail:{widget:'notes',command:c.command,request_id:c.request_id,status,detail,note_id:notes.note?.id}}));
 try{
  await notes.start();const kind=c.command;
  if(['open','show_view','refresh_state','clear_review'].includes(kind)){await notes.reload();if(kind==='show_view')await notes.close();}
  else if(['show_add','set_draft'].includes(kind)){if(!await notes.create(c.prompt||''))throw Error('Resolve the open note first.');}
  else if(['show_note','open_note','review_note','edit_reviewed_note'].includes(kind)){
   let id=c.note_id;if(!id&&c.query){const r=await invoke<any>('note_call',{expectedProfile:'aegis-owner',call:{kind:'list',query:{search:c.query,trashed:false,after:null,limit:2}}});if(r.response.items?.length===1)id=r.response.items[0].id;}
   if(!id)throw Error('Choose one matching note.');if(!await notes.requestOpen(id))throw Error('Note could not be opened.');
  } else if(kind==='save_note'){if(c.prompt&&!await notes.create(c.prompt))throw Error('Could not create the note.');if(!await notes.flush())throw Error('The note was not saved.');}
  else if(kind==='clear_draft'){if(notes.note)notes.edit('');}
  else if(kind==='append_draft'){if(!notes.note)await notes.create();notes.edit(notes.markdown+'\n'+(c.prompt||''));}
  else if(kind==='delete_note'){if(!c.note_id)throw Error('A note identity is required.');await notes.moveToTrash(c.note_id);}
  else if(['copy_note','copy_draft'].includes(kind)){await navigator.clipboard.writeText(notes.markdown);}
  else throw Error('This retired Notes command is unavailable. Use the Work composer with an attached note.');
  result('completed','Notes updated.');
 }catch(e){result('failed',e instanceof Error?e.message:String(e));}
}
