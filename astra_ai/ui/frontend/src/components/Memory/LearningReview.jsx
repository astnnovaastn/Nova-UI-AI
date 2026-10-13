import React, {useEffect, useState, useRef} from 'react';
import {conversationSnapshot} from '../../conversation';
const contextKey = s => `${s.clientId}:${s.sessionId}:${s.guest}:${s.connected}`;
export default function LearningReview({active}) {
 const [connection, setConnection] = useState(conversationSnapshot);
 const [status, setStatus] = useState(null), [items, setItems] = useState([]);
 const [error, setError] = useState(''), [revision, setRevision] = useState(0), [busy, setBusy] = useState('');
 useEffect(() => {
  const changed = () => setConnection(conversationSnapshot());
  window.addEventListener('nova-conversation', changed);
  return () => window.removeEventListener('nova-conversation', changed);
 }, []);
 const key = contextKey(connection), warmRetries = useRef(0);
 useEffect(() => {warmRetries.current=0;},[key]);
 useEffect(() => {
  setItems([]); setStatus(null); setError(''); setBusy('');
  if (!active || connection.guest || !connection.connected) return;
  let warmTimer;
  const controller = new AbortController(), headers = {'X-Nova-Client':connection.clientId};
  Promise.all([fetch('/api/learning/status',{headers,signal:controller.signal}), fetch('/api/learning/reviews',{headers,signal:controller.signal})])
   .then(async replies => {
    if (replies.some(r => !r.ok)) throw Error();
    const [state, reviews] = await Promise.all(replies.map(r => r.json()));
    if (!controller.signal.aborted && contextKey(conversationSnapshot()) === key) {
     setStatus(state); setItems(reviews.items || []); setError('');
     if(!state.capabilities?.isolation?.verified && state.capabilities?.isolation?.reason === 'Isolation has not been verified' && warmRetries.current++ < 8) warmTimer=setTimeout(()=>setRevision(v=>v+1),1500);
    }
   }).catch(e => {if(e.name !== 'AbortError' && contextKey(conversationSnapshot()) === key) setError('Learning status is unavailable.');});
  return () => {controller.abort();clearTimeout(warmTimer);};
 }, [active, key, revision]);
 async function act(action, item) {
  const current = conversationSnapshot();
  if (contextKey(current) !== key || current.guest || !current.connected) return;
  setBusy(item?.id || action); setError('');
  try {
   const path = action === 'approve' ? '/api/learning/approve' : '/api/learning/action';
   const payload = action === 'approve' ? {id:item.id,expected_hash:item.new_hash || item.hash} : {action,tool:'research_action'};
   const r = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Nova-Client':current.clientId},body:JSON.stringify(payload)});
   const d = await r.json();
   if (!r.ok || ['failed','rejected','conflict'].includes(d.status)) throw Error();
   if (contextKey(conversationSnapshot()) === key) setRevision(v => v+1);
  } catch {if(contextKey(conversationSnapshot()) === key) setError('The change could not be applied. Refresh and review its current state.');}
  finally {if(contextKey(conversationSnapshot()) === key) setBusy('');}
 }
 if (!active || connection.guest || !connection.connected) return null;
 return <section className="memory-learning-review">
  <h4>Background learning</h4>
  <p>{status?.capabilities?.isolation?.verified ? 'Isolated tools are available.' : 'Tool execution waits for verified isolation.'}</p>
  <small>Research remains sourced. Muting the microphone does not stop requested work.</small>
  <div><button disabled={!!busy} onClick={()=>act('pause')}>Pause learning</button><button disabled={!!busy} onClick={()=>act('resume')}>Resume learning</button><button onClick={()=>setRevision(v=>v+1)}>Refresh</button></div>
  {error && <p role="alert">{error}</p>}
  {items.map(item => <details key={item.id}><summary>{item.name || item.function || 'Learned helper'} · {item.state.replaceAll('_',' ')}</summary>
   <p>{item.description || item.target}</p><small>{item.risk === 'high' ? 'Critical change: human review required.' : 'Routine change: isolated tests required.'}</small>
   <pre>{item.preview || 'No code preview available.'}</pre>
   {item.risk === 'high' && <button disabled={!!busy || !item.preview} onClick={()=>act('approve',item)}>Approve this version</button>}
  </details>)}
 </section>;
}
