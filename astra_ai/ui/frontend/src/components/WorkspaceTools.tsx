import React,{useEffect,useRef,useState} from 'react';
import './WorkspaceTools.css';
import {conversationSnapshot} from '../conversation';

export default function WorkspaceTools({kind,onClose,onLegacy,command}:{kind:'notes'|'tasks';onClose:()=>void;onLegacy?:()=>void;command?:Record<string,unknown>|null}) {
 const target=useRef<HTMLDivElement>(null),callbacks=useRef({onClose,onLegacy});callbacks.current={onClose,onLegacy};
 const commandRef=useRef(command);commandRef.current=command;const handleRef=useRef<{command?:(v:Record<string,unknown>)=>Promise<void>}|null>(null);
 useEffect(()=>{if(command)void handleRef.current?.command?.(command);},[command]);
 const [session,setSession]=useState(()=>conversationSnapshot());
 useEffect(()=>{const update=()=>setSession(conversationSnapshot());window.addEventListener('nova-conversation',update);return()=>window.removeEventListener('nova-conversation',update);},[]);
 const [error,setError]=useState(''),[theme,setTheme]=useState<'dark'|'light'>(()=>localStorage.getItem('aegis-tools-theme')==='light'?'light':'dark');
 useEffect(()=>{let dead=false,handle:{destroy:()=>void}|undefined;
  if(session.guest||!session.connected)return;
  if(!document.querySelector('link[data-aegis-work-canvas]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/work-canvas/aegis-work.css';link.dataset.aegisWorkCanvas='';document.head.append(link);}
  const url='/work-canvas/aegis-work.js';
  void import(/* @vite-ignore */url).then(async module=>{if(dead||!target.current)return;const mounted=await module.mountWorkspaceTools(target.current,{kind,headers:()=>({'X-Nova-Client':conversationSnapshot().clientId}),onclose:()=>callbacks.current.onClose(),onlegacy:()=>callbacks.current.onLegacy?.()});if(dead)mounted.destroy();else {handle=mounted;handleRef.current=mounted;if(commandRef.current)void mounted.command?.(commandRef.current);}}).catch(e=>setError(String(e)));
  return()=>{dead=true;handleRef.current=null;handle?.destroy();};
 },[kind,session.clientId,session.guest,session.connected]);
 return <aside data-aegis-widget={kind==='tasks'?'task':'notes'} className="aegis-tools-sidebar" aria-label={kind==='notes'?'Notes panel':'Tasks panel'}>
  <button className="aegis-tools-theme" onClick={()=>setTheme(old=>{const next=old==='dark'?'light':'dark';localStorage.setItem('aegis-tools-theme',next);return next;})} aria-label="Switch panel theme">{theme==='dark'?'Light':'Dark'}</button>
  {error?<p role="alert">{error} <button onClick={onClose}>Close</button></p>:null}
  {session.guest||!session.connected?<p role="status">{session.guest?'Notes and Tasks are available in the owner workspace.':'Connecting to your workspace…'} <button onClick={onClose}>Close</button></p>:null}
  <div ref={target} className="aegis-work-root aegis-tools-mount" data-theme={theme}/>
 </aside>;
}
