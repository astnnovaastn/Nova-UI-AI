import React from 'react';
import StructuredMemory from './StructuredMemory.jsx';
const human=s=>String(s||'').replaceAll('_',' ');
const populated=v=>v!==null&&v!==undefined&&v!==''&&(!Array.isArray(v)||v.length>0)&&(!(v&&typeof v==='object'&&!Array.isArray(v))||Object.keys(v).length>0);
export function Waiting(){return <span className="memory-waiting-label">Waiting<span className="memory-waiting-dots" aria-hidden="true"><i/><i/><i/></span></span>;}
export default function ApprovalDetail({item}){
 const d=item.details||{},r=d.record||{},proposed=r.value??r.content??d.description??d.purpose??d.instruction;
 const reason=d.reason||d.details?.reason, evidence=r.evidence||d.evidence||d.details?.evidence;
 const action=r.kind==='event'?'Save this event':r.kind?'Save this memory':item.source==='task'?human(d.action):item.source==='learning'?'Activate these tested changes':'Create this relationship';
 const text=r.value??r.content;
 const scope=[r.category,d.scope].filter(Boolean).map(human).join(' · ');
 return <div className="memory-approval-content"><p className="memory-approval-action">{action}{scope&&<small>{scope}</small>}</p>
 {populated(proposed)&&<div className="memory-approval-proposal"><StructuredMemory raw={false} value={proposed}/></div>}
 {populated(reason)&&<section><h4>Why approval is needed</h4><p>{reason==='uncertain'?'This information needs your confirmation before it becomes a committed memory.':human(reason)}</p></section>}
 {populated(evidence)&&evidence!==text&&<details className="memory-detail-disclosure"><summary>Supporting context</summary><StructuredMemory raw={false} value={evidence}/></details>}
 {d.relationship&&<section><h4>Proposed connection</h4><StructuredMemory raw={false} value={d.relationship}/></section>}
 {item.preview&&<details className="memory-detail-disclosure"><summary>Review proposed code changes</summary><pre>{item.preview}</pre></details>}
 <p className="memory-approval-consequence">{item.source==='memory'?'Approval saves this version to memory. Rejection keeps it out of committed memory.':item.source==='task'?'Approval allows the waiting task to continue. Rejection cancels that task.':'Approval permits validation and activation of this exact version. Rejection leaves it inactive.'}</p>
 </div>;
}
