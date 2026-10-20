import React,{useRef,useState} from 'react';
import './ResearchHistoryItem.css';
export function RecentlyRemovedResearch({items,onRestore}: {items:any[];onRestore:(item:any)=>Promise<void>}) {
 const [limit,setLimit]=useState(5),[restoring,setRestoring]=useState(''),[error,setError]=useState('');
 const inFlight=useRef(false);
 async function restore(item:any){if(inFlight.current)return;inFlight.current=true;setRestoring(item.research_id);setError('');try{await onRestore(item);}catch(e:any){setError(e.message || 'Could not restore research. Try again.');}finally{inFlight.current=false;setRestoring('');}}
 return <details className="rh-removed" onToggle={e=>{if(!e.currentTarget.open)setLimit(5);}}>
   <summary><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 5v5h5M4 10a8 8 0 1 1 1 8M12 8v5l3 2"/></svg><span>Recently removed</span><span className="rh-removed-count">{items.length}</span><span className="rh-removed-chevron" aria-hidden="true">⌄</span></summary>
   <p className="rh-removed-hint">Your latest removed research. Restore an entry to bring it back.</p>
   {error&&<p className="rh-error" role="alert">{error}</p>}
   <div className="rh-removed-list">{[...items].reverse().slice(0,limit).map(item=><div className="rh-removed-entry" key={item.research_id}>
     <p>{item.history_title||item.display_title||item.query||'Untitled research'}</p>
     <button disabled={!!restoring} aria-label={'Restore '+(item.history_title||item.display_title||item.query)} onClick={()=>void restore(item)}>{restoring===item.research_id?<><span className="rh-spinner" aria-hidden="true"/>Restoring…</>:<><span aria-hidden="true">↶</span>Restore</>}</button>
   </div>)}</div>
   {items.length>limit&&<button className="rh-removed-more" onClick={()=>setLimit(v=>v+5)}>Show more ({items.length-limit})</button>}
   <span className="rh-sr" role="status">{restoring?'Restoring research…':''}</span>
 </details>;
}
