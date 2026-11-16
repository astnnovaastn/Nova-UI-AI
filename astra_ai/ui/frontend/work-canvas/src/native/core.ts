/**
 * Stands in for Tauri's `invoke`. Zephium's generated bindings call this unchanged.
 * AEGIS has no Rust runtime: research goes through the React host and FastAPI, so
 * only harmless cache and shortcut queries are answered here. Anything else fails
 * loudly rather than pretending a native effect happened.
 */
import {workspaceHeaders} from './host-session';
const answers: Record<string, unknown> = {
  favicon_probe: true,
  work_release_memory: true,
  keymap_entries: [],
};

const missing = new Set<string>();
let activation:Event|undefined;
export function captureNativeActivation(event:Event){if(event.isTrusted){activation=event;queueMicrotask(()=>{if(activation===event)activation=undefined;});}}
export const missingCommands = (): string[] => [...missing];

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if(command==='browser_open_url'){
    const url=new URL(String(args?.url));
    if(!activation?.isTrusted||!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Choose a valid page to open.');
    window.dispatchEvent(new CustomEvent('aegis-open-source-window',{detail:{url:url.href,activation}}));
    return undefined as T;
  }
  if(command==='resource_call'){
    const response=await fetch('/api/workspace/v22/resources',{method:'POST',credentials:'same-origin',headers:workspaceHeaders(),body:JSON.stringify(args)});
    if(!response.ok)throw Error('Task request failed');
    const reply=await response.json();const r=reply.response;
    if(r.kind==='applied')window.dispatchEvent(new CustomEvent('zephium:resource-changed',{detail:{profile:reply.profile,kind:'task',id:r.record.id,revision:r.record.revision}}));
    if(r.kind==='task_list_applied')window.dispatchEvent(new CustomEvent('zephium:task-lists-changed',{detail:{profile:reply.profile}}));
    return reply;
  }
  if(command==='work_save_calendar'){
    if(typeof args?.text!=='string'||!args.text.startsWith('BEGIN:VCALENDAR'))throw Error('Invalid calendar');
    const url=URL.createObjectURL(new Blob([args.text],{type:'text/calendar;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=String(args.name||'calendar.ics').replace(/[\\/]/g,'-');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true as T;
  }
  if (command === 'note_call') {
    const call=args?.call as {kind?:string;id?:string}|undefined;
    if(call?.kind==='reveal'&&!call.id){
      const desktop=(window as any).aegisDesktop;
      if(!desktop)return {profile:args?.expectedProfile,response:{kind:'error',error:'unavailable'}} as T;
      if(!await desktop.invoke('notes_folder_select'))return {profile:args?.expectedProfile,response:{kind:'done'}} as T;
      const batch=await fetch('/api/workspace/v21/notes/export',{headers:workspaceHeaders()}).then(r=>r.json());
      const result=await desktop.invoke('notes_folder_sync',{notes:batch.items});
      for(const update of result.updates||[])await invoke('note_call',{...args,call:{kind:'write',request_id:crypto.randomUUID(),...update}});
      return {profile:args?.expectedProfile,response:{kind:result.conflicts?.length?'error':'done',...(result.conflicts?.length?{error:'conflict'}:{})}} as T;
    }
    if(call?.kind==='reveal'&&call.id){
      const reply=await invoke<any>('note_call',{...args,call:{kind:'get',id:call.id}});
      if(reply.response.kind!=='record')return reply;
      const blob=new Blob([reply.response.record.markdown],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');anchor.href=url;anchor.download=call.id+'.md';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      return {profile:args?.expectedProfile,response:{kind:'done'}} as T;
    }
    const response = await fetch('/api/workspace/v21/notes', {method:'POST', credentials:'same-origin',
      headers:workspaceHeaders(), body:JSON.stringify(args)});
    if (!response.ok) throw new Error('Notes request failed');
    return response.json();
  }
  if (command in answers) return answers[command] as T;
  missing.add(command);
  throw new Error(`"${command}" is not available in AEGIS Research.`);
}
