import {conversationSnapshot} from './conversation';
type Notice = {id:string; research_id:string; clientId:string; sessionId:string};
const pending = new Map<string,Notice>(), seen = new Set<string>();
function flush() {
 const state = conversationSnapshot();
 for (const [id,notice] of pending) {
  if (notice.clientId !== state.clientId || notice.sessionId !== state.sessionId || state.guest) pending.delete(id);
 }
 if (state.state !== 'idle' || state.textBusy || state.sessionSwitching || !state.connected || state.guest) return;
 const first = pending.values().next().value;
 if (!first) return;
 pending.delete(first.id);
 window.dispatchEvent(new CustomEvent('nova-operation-notice',{detail:{id:first.id,research_id:first.research_id}}));
}
export function requestedResearchReady(jobId:string,researchId:string) {
 const state = conversationSnapshot(), key = `${state.clientId}:${state.sessionId}:${jobId}`;
 if (state.guest || seen.has(key)) return;
 seen.add(key); pending.set(jobId,{id:jobId,research_id:researchId,clientId:state.clientId,sessionId:state.sessionId});
 while (seen.size > 128) seen.delete(seen.values().next().value!);
 flush();
}
window.addEventListener('nova-conversation',flush);
