import React,{useEffect,useRef,useState} from 'react';
import {conversationSnapshot} from '../../conversation';

export default function MemoryRuntimeStatus({active}){
 const [status,setStatus]=useState(null);
 const scopeRef=useRef('');
 useEffect(()=>{
  if(!active)return;
  const controller=new AbortController();let timer,loading=false;
  const refresh=async()=>{
   const snapshot=conversationSnapshot(),client=snapshot.clientId,key=client+':'+snapshot.guest;if(!client||loading)return;loading=true;
   try{const response=await fetch('/api/memory/context/status',{headers:{'X-Nova-Client':client},signal:controller.signal});
    if(response.ok){const value=await response.json();const current=conversationSnapshot();if(current.clientId+':'+current.guest===key&&!controller.signal.aborted)setStatus(value);}
   }catch{}finally{loading=false;}
  };
  const scoped=()=>{const current=conversationSnapshot(),key=current.clientId+':'+current.guest;if(scopeRef.current!==key){scopeRef.current=key;setStatus(null);void refresh();}};
  void refresh();timer=setInterval(refresh,15000);window.addEventListener('nova-conversation',scoped);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('nova-conversation',scoped);};
 },[active]);
 if(!active||!status)return null;
 const mode=status.semantic?.mode||'off';
 const label=mode==='enabled'?'Semantic recall':mode==='shadow'?'Recall evaluation':'Local recall';
 let date='';try{date=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',timeZone:status.time?.timezone||'Europe/Madrid'}).format(new Date(status.time.observed_at));}catch{}
 return <div className="memory-runtime-status" aria-label="Memory runtime status" title={`${status.time?.timezone||'Europe/Madrid'} · ${status.semantic?.indexed||0} indexed sources${status.semantic?.error?' · semantic lookup paused; local recall available':''}`}><span className="memory-runtime-dot"/>{label}{date&&<span> · {date}</span>}</div>;
}
