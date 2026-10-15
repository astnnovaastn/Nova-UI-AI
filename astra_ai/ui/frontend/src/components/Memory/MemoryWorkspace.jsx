import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import MemoryLibrary from './MemoryLibrary.jsx';
import MemoryConversation from './MemoryConversation.jsx';
import MemorySessions from './MemorySessions.jsx';
import MemoryRuntimeStatus from './MemoryRuntimeStatus.jsx';
import {updateUiContext,conversationSnapshot} from '../../conversation';
import './MemoryWorkspace.css';
import {memoryIsOpen,rememberMemoryOpen} from './memory-globe/memoryView';
const MemoryGlobeHost=React.lazy(()=>import('./memory-globe/MemoryGlobeHost'));
export default function initMemoryWorkspace(){
 if(document.getElementById('memory-workspace-root'))return;
 const host=document.createElement('div');host.id='memory-workspace-root';document.body.append(host);createRoot(host).render(<MemoryWorkspace/>);
}
function Glyph({name}){const paths={exit:'M14 4H5v16h9 M10 12h11 M17 8l4 4-4 4',library:'M5 5h5v5H5z M14 5h5v5h-5z M5 14h5v5H5z M14 14h5v5h-5z',close:'M6 6l12 12 M18 6L6 18'};return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function MemoryWorkspace(){
 const [open,setOpen]=useState(memoryIsOpen),[inspector,setInspector]=useState(false),[guest,setGuest]=useState(()=>conversationSnapshot().guest),[selection,setSelection]=useState(null),[filter,setFilter]=useState(''),[searchQuery,setSearchQuery]=useState(''),[railMode,setRailMode]=useState('library'),[sessionId,setSessionId]=useState(''),[scope,setScope]=useState({profile_id:'',project_id:''});
 const [libraryScope,setLibraryScope]=useState(()=>conversationSnapshot().clientId+':'+conversationSnapshot().guest);
 const [chatRail,setChatRail]=useState(()=>{try{return localStorage.getItem('nova-memory-chat-spherical')==='open';}catch{return false;}});
 const toggleChat=()=>{setInspector(false);setChatRail(v=>{try{localStorage.setItem('nova-memory-chat-spherical',v?'collapsed':'open');}catch{}return !v;});};
 const choose=useCallback(value=>{setSelection(value);window.dispatchEvent(new CustomEvent('nova-memory-globe-select',{detail:{id:value.node?.kind==='category'?'cat:'+value.node.category:value.node?.id||value.record?.id}}));},[]);
 const selected=useCallback(value=>{setSelection(value?{node:{id:value.id,kind:value.type,category:value.category,label:value.title}}:null);},[]);
 const scoped=useCallback(next=>setScope(current=>current.profile_id===next.profile_id&&current.project_id===next.project_id?current:next),[]);
 const committed=useCallback(detail=>window.dispatchEvent(new CustomEvent('nova-memory-changed',{detail})),[]);
 useEffect(()=>{const work=e=>{setOpen(true);setInspector(false);setChatRail(true);window.dispatchEvent(new CustomEvent('nova-conversation-mode',{detail:{mode:'work',...e.detail}}));},show=()=>setOpen(true),dashboard=()=>setOpen(false),sync=()=>{const snap=conversationSnapshot(),next=snap.guest;setLibraryScope(snap.clientId+':'+next);setGuest(next);if(next){setInspector(false);setSelection(null);}};window.addEventListener('nova-open-work',work);window.addEventListener('nova-open-memory',show);window.addEventListener('nova-open-dashboard',dashboard);window.addEventListener('nova-conversation',sync);return()=>{window.removeEventListener('nova-open-work',work);window.removeEventListener('nova-open-memory',show);window.removeEventListener('nova-open-dashboard',dashboard);window.removeEventListener('nova-conversation',sync);};},[]);
 useEffect(()=>{rememberMemoryOpen(open);document.body.classList.toggle('memory-workspace-open',open);return()=>document.body.classList.remove('memory-workspace-open');},[open]);
 useEffect(()=>{updateUiContext({view:open?'memory':'dashboard',category:selection?.node?.category||filter,selected_id:selection?.node?.id||'',selected_kind:selection?.node?.kind||'',title:selection?.node?.label||'',summary:'',filters:scope});},[open,selection,filter,scope]);
 useEffect(()=>{const handler=event=>{const command=event.detail;setOpen(true);if(command.action==='open'){return;}else if(command.action==='day'){setChatRail(true);window.dispatchEvent(new CustomEvent('nova-conversation-mode',{detail:{mode:'history',day:command.query}}));}else if(command.action==='rail'){setInspector(!guest&&['library','approvals','tasks'].includes(command.rail));setRailMode('library');if(['conversation','sessions'].includes(command.rail)){setChatRail(true);window.dispatchEvent(new CustomEvent('nova-conversation-mode',{detail:{mode:command.rail==='sessions'?'history':'chat'}}));}}else if(command.action==='session'){setSessionId(command.session_id||'');setInspector(false);setChatRail(true);window.dispatchEvent(new CustomEvent('nova-conversation-mode',{detail:{mode:'history',session_id:command.session_id}}));}else if(command.action==='filter'){setFilter(command.category||'');setInspector(!guest);}else if(command.action==='search'){setSearchQuery(command.query||'');return;}else return;if(command.request_id)window.dispatchEvent(new CustomEvent('nova-memory-view-result',{detail:{request_id:command.request_id,command:command.action,status:'completed'}}));};window.addEventListener('nova-memory-view-action',handler);return()=>window.removeEventListener('nova-memory-view-action',handler);},[guest]);
 return <section className="memory-workspace" hidden={!open} aria-label="Memory workspace">
 <MemoryRuntimeStatus active={open}/>
 <React.Suspense fallback={<div className="memory-network-notice">Loading globe…</div>}><MemoryGlobeHost libraryOpen={inspector} active={open} onSelection={selected}/></React.Suspense>
 <nav className="memory-space-tools" aria-label="Memory navigation"><button type="button" aria-label="Return to dashboard" title="Return to dashboard" onClick={()=>setOpen(false)}><Glyph name="exit"/></button>{!guest&&<button type="button" aria-label="Open memory library" title="Memory library" aria-expanded={inspector} onClick={()=>{setRailMode('library');setInspector(!inspector);}}><Glyph name="library"/></button>}</nav>
 {!guest&&<aside className="memory-inspector" hidden={!inspector} aria-label="Memory inspector">{railMode==='sessions'&&<button className="memory-library-close memory-icon-button" aria-label="Close memory inspector" onClick={()=>setInspector(false)}><Glyph name="close"/></button>}{railMode==='sessions'?<MemorySessions active={open&&inspector} sessionId={sessionId} scope={scope} onSession={setSessionId} onCommitted={committed}/>:<MemoryLibrary onClose={()=>setInspector(false)} key={libraryScope} externalQuery={searchQuery} active={open&&inspector} selection={selection?.node?.kind==='category'?selection:null} onScope={scoped} onInspect={choose} onCategory={id=>{setFilter(id);window.dispatchEvent(new CustomEvent('nova-memory-globe-select',{detail:{id:'cat:'+id}}));}}/>}</aside>}
 <MemoryConversation active={open} rail={chatRail&&!inspector} onToggle={toggleChat}/>
 </section>;
}
