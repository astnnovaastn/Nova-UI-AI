import React,{useRef,useState} from 'react';
import './ResearchHistoryItem.css';
function RemovedIcon({name}:{name:'history'|'restore'|'chevron'}) {
 const paths={history:'M3 5v5h5M3 10a9 9 0 1 1 2.6 8.4M12 7v5l3 2',restore:'M3 4v6h6M3 10a9 9 0 1 1 2.6 8.4',chevron:'m7 10 5 5 5-5'};
 return <svg className={name==='chevron'?'rh-removed-chevron':undefined} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
export function RecentlyRemovedResearch({items,onRestore}: {items:any[];onRestore:(item:any)=>Promise<void>}) {
 const [limit,setLimit]=useState(5),[restoring,setRestoring]=useState(''),[error,setError]=useState('');
 const inFlight=useRef(false);
 async function restore(item:any){if(inFlight.current)return;inFlight.current=true;setRestoring(item.research_id);setError('');try{await onRestore(item);}catch(e:any){setError(e.message || 'Could not restore research. Try again.');}finally{inFlight.current=false;setRestoring('');}}
 return <details className="rh-removed" onToggle={e=>{if(!e.currentTarget.open)setLimit(5);}}>
   <summary><RemovedIcon name="history"/><span>Recently removed</span><span className="rh-removed-count">{items.length}</span><RemovedIcon name="chevron"/></summary>
   <p className="rh-removed-hint">Restore to your history.</p>
   {error&&<p className="rh-error" role="alert">{error}</p>}
   <div className="rh-removed-list">{[...items].reverse().slice(0,limit).map(item=><div className="rh-removed-entry" key={item.research_id}>
     <p title={item.history_title||item.display_title||item.query||'Untitled research'}>{item.history_title||item.display_title||item.query||'Untitled research'}</p>
     <button type="button" disabled={!!restoring} aria-label={(restoring===item.research_id?'Restoring ':'Restore ')+(item.history_title||item.display_title||item.query||'Untitled research')} title={restoring===item.research_id?'Restoring…':'Restore research'} aria-busy={restoring===item.research_id} onClick={()=>void restore(item)}>{restoring===item.research_id?<span className="rh-spinner" aria-hidden="true"/>:<RemovedIcon name="restore"/>}</button>
   </div>)}</div>
   {items.length>limit&&<button type="button" className="rh-removed-more" onClick={()=>setLimit(v=>v+5)}><span>Show more ({items.length-limit})</span><RemovedIcon name="chevron"/></button>}
   <span className="rh-sr" role="status">{restoring?'Restoring research…':''}</span>
 </details>;
}
