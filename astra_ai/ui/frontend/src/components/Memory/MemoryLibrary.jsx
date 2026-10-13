import React,{useCallback,useEffect,useRef,useState} from 'react';
import Glyph from './MemoryGlyph.jsx';
import {conversationSnapshot} from '../../conversation';
const label=value=>String(value||'').replaceAll('_',' ');
const display=value=>typeof value==='string'?value:JSON.stringify(value,null,2);
async function request(path,options={}){const response=await fetch(path,{...options,headers:{...options.headers,'X-Nova-Client':conversationSnapshot().clientId}}),data=await response.json().catch(()=>({}));if(!response.ok||data.status==='failed')throw new Error(data.reason||data.detail||'Memory connection unavailable.');return data;}
const action=(name,args,signal)=>request('/api/memory/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:name,...args}),signal});

export default function MemoryLibrary({active,selection,onInspect,onScope,onCategory,externalQuery=''}){
 const [catalog,setCatalog]=useState([]),[category,setCategory]=useState(''),[query,setQuery]=useState(''),[state,setState]=useState('all'),[advanced,setAdvanced]=useState(false),[profile,setProfile]=useState(''),[project,setProject]=useState('');
 const [records,setRecords]=useState([]),[pending,setPending]=useState([]),[offset,setOffset]=useState(0),[total,setTotal]=useState(0),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [creating,setCreating]=useState(false),[newKey,setNewKey]=useState(''),[newValue,setNewValue]=useState('');
 useEffect(()=>{const handler=e=>{setQuery(String(e.detail?.query||''));setOffset(0);};window.addEventListener('nova-memory-library-query',handler);return()=>window.removeEventListener('nova-memory-library-query',handler);},[]);
 useEffect(()=>{setQuery(externalQuery);setOffset(0);},[externalQuery]);
 const generation=useRef(0),refresh=useRef(null),creationDrafts=useRef(new Map());
 useEffect(()=>{if(selection?.node?.kind==='category')chooseCategory(selection.category);},[selection]);
 useEffect(()=>{const timer=setTimeout(()=>onScope({profile_id:profile,project_id:project}),200);return()=>clearTimeout(timer);},[profile,project,onScope]);
 const load=useCallback(async signal=>{
  const epoch=++generation.current;setLoading(true);
  try{const tasks=[request('/api/memory/categories',{signal})];
   if(category){const filters=new URLSearchParams({category,lifecycle:state,query,profile_id:profile,project_id:project,offset:String(offset),limit:'12'});tasks.push(request(`/api/memory/records?${filters}`,{signal}),action('list_pending',{category,limit:100},signal));}
   const [catalog,page,proposals]=await Promise.all(tasks);if(signal?.aborted||epoch!==generation.current)return;
   setCatalog(catalog.categories||[]);setRecords(page?.matches||[]);setTotal(page?.total||0);setPending(proposals?.proposals||[]);setError('');
  }catch(cause){if(cause.name!=='AbortError'&&epoch===generation.current)setError(cause.message);}finally{if(epoch===generation.current)setLoading(false);}
 },[category,state,query,profile,project,offset]);
 refresh.current=load;
 useEffect(()=>{if(!active)return;setLoading(true);const controller=new AbortController();let timer=setTimeout(()=>load(controller.signal),120);const changed=()=>{clearTimeout(timer);timer=setTimeout(()=>load(controller.signal),150);};window.addEventListener('nova-memory-changed',changed);return()=>{controller.abort();++generation.current;clearTimeout(timer);window.removeEventListener('nova-memory-changed',changed);};},[active,load]);
 const chooseCategory=next=>{if(category)creationDrafts.current.set(category,{key:newKey,value:newValue});const saved=creationDrafts.current.get(next);setNewKey(saved?.key||'');setNewValue(saved?.value||'');setCategory(next);setQuery('');setOffset(0);setCreating(false);setMessage('');onCategory(next);};
 async function perform(name,args){if(busy)return;setBusy(true);setError('');try{const result=await action(name,args);if(['failed','conflict','not_found','private'].includes(result.status)||(result.status==='rejected'&&name!=='reject'))throw new Error(result.reason||result.status);setMessage(result.status==='pending_approval'?'Awaiting approval':label(result.status));window.dispatchEvent(new CustomEvent('nova-memory-changed',{detail:{record_id:result.id,action:name}}));await refresh.current();return result;}catch(cause){setError(cause.message);}finally{setBusy(false);}}
 const policy=catalog.find(c=>c.category===category);
 return <section className="memory-library" aria-label="Memory library">
  <header className="memory-library-heading"><div>{category&&<button className="memory-icon-button" aria-label="Back to categories" onClick={()=>chooseCategory('')}><Glyph name="back"/></button>}<h2>{category?policy?.title||label(category):'Memory library'}</h2></div><div><button className="memory-icon-button" aria-label="Refresh" title="Refresh" disabled={loading} onClick={()=>load()}><Glyph name="refresh"/></button>{category&&<button className="memory-icon-button" aria-label="New memory" title="New memory" onClick={()=>setCreating(!creating)}><Glyph name="plus"/></button>}</div></header>
  <div className="memory-library-search"><input aria-label="Search memories" placeholder={category?'Search this category':'Find a category'} value={query} onChange={e=>{setQuery(e.target.value);setOffset(0);}}/>{category&&<button className="memory-icon-button" aria-label="Memory filters" title="Filters" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}><Glyph name="filter"/></button>}</div>
  {error&&<div className="memory-alert" role="alert">{error}<button onClick={()=>load()}>Retry</button></div>}{message&&<p className="memory-feedback" role="status">{message}</p>}
  <div className="memory-library-content">
  {category&&advanced&&<div className="memory-library-filters"><select aria-label="Memory lifecycle" value={state} onChange={e=>{setState(e.target.value);setOffset(0);}}>{['all','active','expired','history','tentative','scheduled','forgotten'].map(value=><option key={value} value={value}>{label(value)}</option>)}</select><input aria-label="Memory profile scope" placeholder="Profile scope" value={profile} onChange={e=>{setProfile(e.target.value);setOffset(0);}}/><input aria-label="Memory project scope" placeholder="Project scope" value={project} onChange={e=>{setProject(e.target.value);setOffset(0);}}/></div>}
  {creating&&category&&<form className="memory-create" onSubmit={async e=>{e.preventDefault();const result=await perform('create_fact',{category,key:newKey,value:newValue,profile_id:profile,project_id:project});if(result&&['saved','updated','duplicate'].includes(result.status)){setCreating(false);setNewKey('');setNewValue('');}}}><input required aria-label="New memory key" placeholder="Memory name (snake_case)" pattern="[a-z][a-z0-9_]{0,63}" value={newKey} onChange={e=>setNewKey(e.target.value)}/><textarea required aria-label="New memory value" placeholder="What should Aegis remember?" value={newValue} onChange={e=>setNewValue(e.target.value)}/><button disabled={busy}>Save memory</button></form>}
  <div className="memory-library-items">
   {!category?<nav className="memory-category-list" aria-label="Memory categories">{catalog.filter(c=>!query||c.title.toLowerCase().includes(query.toLowerCase())).map(c=><button key={c.category} onClick={()=>chooseCategory(c.category)}><span className="memory-category-mark" aria-hidden="true">◌</span><span>{c.title}</span><small>{c.counts.active}</small>{c.counts.pending>0&&<i title={`${c.counts.pending} pending proposals`} aria-label={`${c.counts.pending} pending proposals`}/> }<span aria-hidden="true">›</span></button>)}</nav>:<div className="memory-library-records">
    <p className="memory-library-count">{total} {total===1?'memory':'memories'}{state!=='all'?` · ${label(state)}`:''}</p>
    {!loading&&!records.length&&<p className="memory-empty">No memories match this view.</p>}
    {records.map(record=><button disabled={loading} className="memory-record-row" key={record.id} onClick={()=>onInspect({node:{...record,label:label(record.key)},record,category:record.category})}><span className="memory-record-mark" aria-hidden="true"/><span><strong>{label(record.key)}</strong><span className="memory-record-preview">{display(record.value)}</span><small>{record.effective_lifecycle} · revision {record.revision}</small></span><span aria-hidden="true">›</span></button>)}
    {pending.length>0&&<section className="memory-pending" aria-label="Pending memory proposals"><h3>Awaiting approval</h3>{pending.map(p=><article key={p.id}><p>{display(p.record?.value||p.relationship)}</p><small>{label(p.reason)}</small><div><button disabled={busy} onClick={()=>perform('approve',{approval_id:p.id})}>Approve</button><button disabled={busy} onClick={()=>perform('reject',{approval_id:p.id})}>Reject</button></div></article>)}</section>}
   </div>}
   {loading&&<p className="memory-feedback" role="status">Loading…</p>}
  </div></div>
  {category&&total>12&&<footer className="memory-pagination"><button aria-label="Previous memories" disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-12))}><Glyph name="back"/></button><span>{offset+1}–{Math.min(offset+12,total)} of {total}</span><button aria-label="Next memories" disabled={offset+12>=total} onClick={()=>setOffset(offset+12)}>›</button></footer>}
 </section>;
}
