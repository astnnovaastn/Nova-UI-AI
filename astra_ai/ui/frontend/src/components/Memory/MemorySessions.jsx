import DailyHistory from './DailyHistory.jsx';
export default function MemorySessions({active,sessionId,onCommitted}){return active?<DailyHistory targetSession={sessionId} onCommitted={onCommitted} editable/>:null;}
