/** One session state shared by dashboard and memory UI. */
export type ChatMessage = {id:string; role:string; text:string; status:string};
const messages:ChatMessage[]=[];
let loadRevision=0,messageRevision=0;
let connection={connected:false,muted:true,state:'idle',model:'',clientId:'',sessionId:(()=>{try{let id=sessionStorage.getItem('nova-conversation-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('nova-conversation-session',id);}return id;}catch{return crypto.randomUUID();}})(),status:'',textBusy:false,sessionSwitching:false,guest:false,jobs:[] as Array<{id:string;state:string;completed:number;total:number;sequence?:number;title?:string;step?:string}>,sources:[] as Array<{title:string;url:string}>};
export function conversationSnapshot(){return {messages:[...messages],...connection};}
function changed(){window.dispatchEvent(new CustomEvent('nova-conversation',{detail:conversationSnapshot()}));}
export function conversationState(update:Partial<typeof connection>){const scopeChanged=update.guest!==undefined&&update.guest!==connection.guest||update.clientId!==undefined&&update.clientId!==connection.clientId;connection={...connection,...update,...(scopeChanged?{jobs:[]}:{} )};changed();}
export function conversationMessage(role:string,text:string,status='completed',id:string=crypto.randomUUID()){
 messageRevision++;const old=messages.find(m=>m.id===id);if(old)Object.assign(old,{text,status});else messages.push({id,role,text,status});
 if(messages.length>200)messages.splice(0,messages.length-200);changed();return id;
}
export function requestConversation(text:string,id:string=crypto.randomUUID()){window.dispatchEvent(new CustomEvent('nova-chat-send',{detail:{text,request_id:id}}));}
export function requestMicrophone(){window.dispatchEvent(new Event('nova-chat-microphone'));}
let uiRevision=0;
let snapshot:Record<string,unknown>={version:1,view:'dashboard',widgets:[]};
export function uiSnapshot(){return snapshot;}
export function updateUiContext(update:Record<string,unknown>){snapshot={...snapshot,...update,version:1,revision:++uiRevision};window.dispatchEvent(new CustomEvent('nova-ui-context',{detail:snapshot}));}

export function conversationReplace(items:ChatMessage[],sessionId:string){messages.splice(0,messages.length,...items);connection.sessionId=sessionId;try{sessionStorage.setItem('nova-conversation-session',sessionId);}catch{}changed();}
export async function conversationLoad(sessionId:string){
 const request=++loadRevision,revision=messageRevision;
 const r=await fetch('/api/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get',session_id:sessionId})});const d=await r.json();
 if(!r.ok||d.status!=='ok')throw new Error(d.reason||'Conversation unavailable');
 if(request!==loadRevision)return d;
 const loaded=(d.messages||[]).map((m:any)=>({id:m.id,role:m.role,text:m.content,status:m.status||'completed'}));
 if(connection.sessionId===sessionId&&revision!==messageRevision){const ids=new Set(loaded.map((m:ChatMessage)=>m.id));loaded.push(...messages.filter(m=>!ids.has(m.id)));}
 conversationReplace(loaded,sessionId);return d;
}
export function conversationDraft(sessionId:string,value?:string){try{const key='nova-draft-'+sessionId;if(value!==undefined)sessionStorage.setItem(key,value);return sessionStorage.getItem(key)||'';}catch{return value||'';}}

export function conversationInterrupt(){for(const m of messages)if(m.status==='streaming'||m.status==='pending')m.status='interrupted';changed();}
