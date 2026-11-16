// The original views use their own sessions; this adapter owns only navigation.
export const toolContext=$state<{page:'notes'|'tasks'|null;source:{url:string;title:string}|null}>({page:null,source:null});
export const surface={open:async(kind:string)=>{if(kind==='notes'||kind==='tasks'){toolContext.page=kind;window.dispatchEvent(new CustomEvent('aegis-tools-page',{detail:{kind}}));}},close:async()=>{toolContext.page=null;window.dispatchEvent(new CustomEvent('aegis-tools-page',{detail:{kind:null}}));}};
export const tabs={profile:()=>({id:'aegis-owner'}),activeTab:()=>toolContext.source};
