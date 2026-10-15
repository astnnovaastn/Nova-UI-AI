import {useCallback,useEffect,useRef,useState} from "react";
import MemoryGlobe from "./MemoryGlobe";
import {conversationSnapshot} from "../../../conversation";
import type {GlobeEngine,SelectionInfo} from "./globeEngine";
import type {GraphData,RawMemoryFile,RawRecord} from "./memoryTypes";

export default function MemoryGlobeHost({active,libraryOpen,onSelection,onRecords}:{active:boolean;libraryOpen?:boolean;onSelection?:(selection:SelectionInfo|null)=>void;onRecords?:(records:GraphData)=>void}){
 const [connection,setConnection]=useState(()=>conversationSnapshot()),[data,setData]=useState<GraphData|null>(null),[dataScope,setDataScope]=useState(""),[error,setError]=useState(""),[detail,setDetail]=useState<RawRecord|null>(null),[detailError,setDetailError]=useState(""),[detailLoading,setDetailLoading]=useState(false),[undo,setUndo]=useState<{id:string;revision?:number}|null>(null),[actionError,setActionError]=useState("");
 const scopeKey=connection.clientId+":"+connection.guest;
 const engine=useRef<GlobeEngine|null>(null),cache=useRef<GraphData|null>(null),revision=useRef(""),refresh=useRef<()=>void>(()=>{}),selected=useRef<string|null>(null),activity=useRef(new Map<string,number>()),pendingRecall=useRef<{ids:string[];until:number}[]>([]);
 const queuedCommands=useRef<Record<string,any>[]>([]),applyCommand=useRef<(v:Record<string,any>)=>void>(()=>{});
 const recordsCallback=useRef(onRecords),selectionCallback=useRef(onSelection);recordsCallback.current=onRecords;selectionCallback.current=onSelection;
 useEffect(()=>{const sync=()=>{const next=conversationSnapshot();setConnection(old=>old.clientId===next.clientId&&old.connected===next.connected&&old.guest===next.guest?old:next);};window.addEventListener("nova-conversation",sync);return()=>window.removeEventListener("nova-conversation",sync);},[]);
 const select=useCallback((selection:SelectionInfo|null)=>{selected.current=selection?.id||null;setDetail(null);setDetailError("");selectionCallback.current?.(selection);if(!selection||selection.type!=="memory"){setDetailLoading(false);return;}setDetailLoading(true);const id=selection.id,snapshot=conversationSnapshot(),client=snapshot.clientId,guest=snapshot.guest;fetch(`/api/memory/globe/record/${encodeURIComponent(id)}`,{headers:{"X-Nova-Client":client}}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(result=>{if(selected.current===id&&conversationSnapshot().clientId===client&&conversationSnapshot().guest===guest)setDetail(result.record);}).catch(()=>{if(selected.current===id&&conversationSnapshot().clientId===client&&conversationSnapshot().guest===guest)setDetailError("Full memory is unavailable. Reconnect and select it again.");}).finally(()=>{if(selected.current===id)setDetailLoading(false);});},[]);
 useEffect(()=>{
  engine.current=null;queuedCommands.current=[];cache.current=null;revision.current="";activity.current.clear();pendingRecall.current=[];setData(null);setDataScope(scopeKey);setError("");setDetail(null);setUndo(null);setActionError("");selected.current=null;
  if(!connection.connected||!connection.clientId)return;
  const abort=new AbortController(),worker=new Worker(new URL("./adapter.worker.ts",import.meta.url),{type:"module"});let generation=0,timer:ReturnType<typeof setTimeout>,settle:ReturnType<typeof setTimeout>,busy=false,again=false;
  const headers={"X-Nova-Client":connection.clientId};
  const flushRecall=()=>{if(!engine.current)return;const known=new Set(cache.current?.memories.map(m=>m.id)||[]);pendingRecall.current=pendingRecall.current.filter(item=>{if(item.until<Date.now())return false;const ready=item.ids.filter(id=>known.has(id));if(ready.length)engine.current?.recall(ready);item.ids=item.ids.filter(id=>!known.has(id));return item.ids.length>0;});};
  const request=async(path:string)=>{const r=await fetch(path,{headers,signal:abort.signal});if(!r.ok)throw Error("Memory connection unavailable");return r.json();};
  worker.onmessage=({data:result})=>{
   if(result.generation!==generation||abort.signal.aborted)return;
   if(result.error){setError(result.error);return;}
   const graph:GraphData=result.graph,previous=cache.current;cache.current=graph;recordsCallback.current?.(graph);setError("");setDataScope(scopeKey);
   if(previous&&engine.current){const before=new Map(previous.memories.map(m=>[m.id,m]));const present=new Set(graph.memories.map(m=>m.id));const removed=previous.memories.some(m=>!present.has(m.id));const changed=graph.memories.some(m=>before.has(m.id)&&JSON.stringify(before.get(m.id))!==JSON.stringify(m));const additions=graph.memories.filter(m=>!before.has(m.id));
    if(!removed&&!changed&&additions.length){additions.forEach(m=>engine.current?.addMemory(m));clearTimeout(settle);settle=setTimeout(()=>{if(!abort.signal.aborted)setData(cache.current);},1800);}
    else {clearTimeout(settle);setData(graph);}
   }else setData(graph);
   flushRecall();
  };
  worker.onerror=()=>setError("Memory graph preparation unavailable");
  const load=async()=>{
   if(busy){again=true;return;}busy=true;const version=++generation;
   try{let raw:RawMemoryFile={},cursor="",rev="";
    for(let attempts=0;;){const result=await request(`/api/memory/globe?limit=1000${cursor?"&cursor="+encodeURIComponent(cursor):""}`);
     if(result.status==="stale"){if(++attempts>3)throw Error("Memory changed while loading; retry shortly");raw={};cursor="";rev="";continue;}
     if(rev&&rev!==result.revision)throw Error("Memory revision changed");rev=result.revision;
     for(const section of ["facts","events","activity_history"] as const){const target=raw[section]??={};for(const[cid,group]of Object.entries(result.raw[section]||{}))target[cid]={...target[cid],...group as Record<string,RawRecord>};}
     for(const section of ["visual_topics","category_definitions","relationships_v3","catalog_relationships","entity_graph","conflicts","pending_approvals"] as const)(raw as Record<string,unknown>)[section]=result.raw[section];
     cursor=result.next_cursor||"";if(!cursor)break;
    }
    if(!abort.signal.aborted){revision.current=rev;worker.postMessage({generation:version,raw});}
   }catch(cause){if(!abort.signal.aborted)setError(cause instanceof Error?cause.message:"Memory unavailable");}
   finally{busy=false;if(again&&!abort.signal.aborted){again=false;timer=setTimeout(load,160);}}
  };
  const changed=(event:Event)=>{const next=(event as CustomEvent).detail?.revision;if(next&&next===revision.current)return;clearTimeout(timer);timer=setTimeout(load,120);};
  const signal=(event:Event)=>{const value=(event as CustomEvent).detail||{};if(value.phase==="clear"){activity.current.clear();pendingRecall.current=[];return;}const key=value.operation_id||value.request_id||value.operation||"current",sequence=Number(value.sequence||0);if((activity.current.get(key)??-1)>=sequence)return;activity.current.set(key,sequence);while(activity.current.size>128)activity.current.delete(activity.current.keys().next().value!);
   if(value.phase==="retrieval_results"){pendingRecall.current.push({ids:[...new Set<string>((value.record_ids||[]).filter((id:unknown)=>typeof id==="string"))],until:Date.now()+5000});pendingRecall.current=pendingRecall.current.slice(-32);flushRecall();}
   if(value.phase==="committed"){clearTimeout(timer);timer=setTimeout(load,100);}
  };
  refresh.current=load;load();window.addEventListener("nova-memory-globe-changed",changed);window.addEventListener("nova-memory-changed",changed);window.addEventListener("nova-memory-activity",signal);window.addEventListener("online",changed);
  return()=>{abort.abort();worker.terminate();clearTimeout(timer);clearTimeout(settle);engine.current=null;for(const name of ["nova-memory-globe-changed","nova-memory-changed","online"])window.removeEventListener(name,changed);window.removeEventListener("nova-memory-activity",signal);};
 },[connection.clientId,connection.connected,connection.guest]);
 useEffect(()=>{
  const resolve=(id:string)=>{if(id?.startsWith("category:"))return "cat:"+id.slice(9);if(cache.current?.entities.some(e=>e.id===id))return "ent:"+id;return id;};
  const choose=(event:Event)=>(()=>{const id=resolve((event as CustomEvent).detail?.id)||null;if(!id)return engine.current?.select(null);let target=id;while(target.includes('#')&&!cache.current?.layout?.nodes.some(n=>n.id===target))target=target.slice(0,target.lastIndexOf('#'));engine.current?.select(target);})();
  const command=(event:Event)=>{
   const v=(event as CustomEvent).detail||{};if(["rail","session","filter","day"].includes(v.action))return;
   let result:{status:string;reason?:string};
   if(!engine.current){if(queuedCommands.current.length<20){queuedCommands.current.push(v);return;}result={status:"waiting_for_ui",reason:"Memory globe is loading"};}
   else if(v.action==="open")result={status:"completed"};
   else if(v.action==="search"){engine.current.search(v.query||"");result={status:"completed"};}
   else result=engine.current.view({...v,id:v.action==="category"?"cat:"+v.category:resolve(v.record_id||v.focus_id),ids:v.record_ids});
   if(v.request_id)window.dispatchEvent(new CustomEvent("nova-memory-view-result",{detail:{request_id:v.request_id,command:v.action,...result}}));
  };
  applyCommand.current=v=>command(new CustomEvent("nova-memory-view-action",{detail:v}));
  window.addEventListener("nova-memory-globe-select",choose);window.addEventListener("nova-memory-view-action",command);
  return()=>{window.removeEventListener("nova-memory-globe-select",choose);window.removeEventListener("nova-memory-view-action",command);};
 },[]);

 const recordAction=useCallback(async(action:string,id:string,value?:unknown,expectedRevision?:number)=>{
  const snapshot=conversationSnapshot();const response=await fetch(`/api/memory/globe/record/${encodeURIComponent(id)}/action`,{method:"POST",headers:{"X-Nova-Client":snapshot.clientId,"Content-Type":"application/json"},body:JSON.stringify({action,value,expected_revision:expectedRevision,operation_id:crypto.randomUUID()})});const result=await response.json();
  if(!response.ok||!["updated","saved","forgotten","restored"].includes(result.status))throw Error(result.status==="conflict"?"Memory changed. Select it again before editing.":"The change could not be saved.");
  if(conversationSnapshot().clientId!==snapshot.clientId||conversationSnapshot().guest!==snapshot.guest)return;
  if(action==="forget"){setUndo({id,revision:result.revision});engine.current?.clearSelection(true);}else if(action==="restore")setUndo(null);
  else if(selected.current===id)select({id,type:"memory"} as SelectionInfo);
  refresh.current();window.dispatchEvent(new CustomEvent("nova-memory-changed",{detail:{record_id:id,action}}));
 },[select]);
 const ready=useCallback((value:GlobeEngine|null)=>{engine.current=value;if(!value)return;const commands=queuedCommands.current.splice(0);for(const command of commands)applyCommand.current(command);const known=new Set(cache.current?.memories.map(m=>m.id)||[]);for(const item of pendingRecall.current)if(item.until>Date.now())value.recall(item.ids.filter(id=>known.has(id)));pendingRecall.current=pendingRecall.current.filter(item=>{item.ids=item.ids.filter(id=>!known.has(id));return item.ids.length>0&&item.until>Date.now();});},[]);
 return <div className="memory-globe-host">
  {active&&connection.connected&&dataScope===scopeKey&&data&&<MemoryGlobe hideDetails={libraryOpen} data={data} onReady={ready} onSelection={select} onAction={recordAction} detail={detail} detailLoading={detailLoading} detailError={detailError} theme="obsidian" ambient={false} options={{flows:false,idlePulses:false,maxMemories:Infinity}} style={{background:"var(--widget-surface)",color:"var(--widget-text,#eee)"}}/>}
  {active&&!data&&!error&&<div className="memory-network-notice">{connection.connected?"Loading memory globe…":"Connecting to memory…"}</div>}
  {undo&&dataScope===scopeKey&&connection.connected&&<div className="memory-globe-undo" role="status">Memory forgotten. <button onClick={()=>recordAction("restore",undo.id,undefined,undo.revision).catch(()=>setActionError("Restoration is unavailable. Retry when connected."))}>Restore</button></div>}
  {actionError&&<p role="alert">{actionError}</p>}
  {error&&<div className="memory-network-notice" role="alert">{error} <button onClick={()=>refresh.current()}>Retry</button></div>}
 </div>;
}
