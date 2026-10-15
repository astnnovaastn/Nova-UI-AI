import React,{useEffect,useState} from 'react';
import LearningReview from './LearningReview.jsx';

const terminal=new Set(['completed','failed','canceled']);
export default function ConversationWork({chat}){
 const [open,setOpen]=useState(false),[items,setItems]=useState([]),[detail,setDetail]=useState(null),[error,setError]=useState('');
 const scope=chat.clientId+':'+chat.sessionId+':'+chat.guest;
 useEffect(()=>{setItems([]);setDetail(null);setError('');},[scope]);
 useEffect(()=>{
  if(!chat.connected||chat.guest)return;
  let stopped=false,timer,refreshSequence=0;
  const controller=new AbortController();
  async function refresh(){const sequence=++refreshSequence;try{
   const r=await fetch('/api/memory/library/tasks?limit=100',{headers:{'X-Nova-Client':chat.clientId},signal:controller.signal});
   if(!r.ok)throw Error('Task status is unavailable.');const d=await r.json();
   if(!stopped&&sequence===refreshSequence){setItems(d.items||[]);setError('');}
  }catch(e){if(!stopped&&sequence===refreshSequence&&e.name!=='AbortError')setError(e.message);}}
  const changed=()=>{clearTimeout(timer);timer=setTimeout(refresh,200);};
  refresh();const interval=setInterval(refresh,15000);
  window.addEventListener('nova-library-changed',changed);
  return()=>{stopped=true;controller.abort();clearTimeout(timer);clearInterval(interval);window.removeEventListener('nova-library-changed',changed);};
 },[scope,chat.connected]);
 async function inspect(item){try{
  const r=await fetch('/api/memory/library/tasks/'+encodeURIComponent(item.id),{headers:{'X-Nova-Client':chat.clientId}});
  if(!r.ok)throw Error('Task details are unavailable.');setDetail((await r.json()).item);setError('');
 }catch(e){setError(e.message);}}
 async function control(item,action){try{
  const r=await fetch('/api/memory/library/tasks/'+encodeURIComponent(item.id)+'/action',{method:'POST',headers:{'X-Nova-Client':chat.clientId,'Content-Type':'application/json'},body:JSON.stringify({action})});
  const d=await r.json();if(!r.ok||['failed','rejected'].includes(d.status))throw Error(d.reason||'Task could not be changed.');
  window.dispatchEvent(new Event('nova-library-changed'));setDetail(null);
 }catch(e){setError(e.message);}}
 const active=items.filter(i=>!terminal.has(i.state));
 return <details className="memory-jobs" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Tasks and learning · {active.length} active</summary>
  {error&&<p role="status">{error}</p>}
  {items.slice(0,20).map(item=><article className="memory-work-row" key={item.id}>
   <button onClick={()=>inspect(item)}><strong>{item.title}</strong><span>{item.state.replaceAll('_',' ')}</span></button>
   {item.controls?.map(action=><button className="memory-work-control" key={action} onClick={()=>control(item,action)}>{action}</button>)}
  </article>)}
  {!items.length&&!error&&<p className="memory-work-empty">Requested work appears here with its actual progress.</p>}
  {detail&&<section className="memory-work-detail"><header><strong>{detail.title}</strong><button aria-label="Close task details" onClick={()=>setDetail(null)}>×</button></header>
   <p>{detail.state.replaceAll('_',' ')}</p>
   {detail.details?.actions?.map((step,i)=><div key={i}><strong>{i+1}. {step.name.replaceAll('_',' ')}</strong><p>{step.state.replaceAll('_',' ')}{step.attempts?' · attempt '+step.attempts:''}</p>{step.result?.reason&&<p>{step.result.reason}</p>}{step.result?.note_id&&<p>Note saved and verified.</p>}{step.result?.results?.map((source,j)=><a key={j} href={source.url} target="_blank" rel="noopener noreferrer">{source.title||'Source'} ↗</a>)}</div>)}
  </section>}
  <LearningReview active={open}/>
 </details>;
}
