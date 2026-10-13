"""Reversible transcript revisions over current and archived authoritative history."""
import copy
from .shared_memory import atomic,read,now,safe
from .category_policy import matches_scope
def recover(manager):
    with manager._lock:
        journal=manager.transcript_path.with_name("transcript-management.pending.json")
        if journal.exists():
            data=read(journal,{})
            if not isinstance(data.get("transcript"),dict) or not isinstance(data.get("forgotten"),dict):raise ValueError("Invalid transcript journal; preserved")
            atomic(manager.forgotten_path,data["forgotten"]);atomic(manager.transcript_path,data["transcript"]);journal.unlink()

def effective(manager,messages):
    recover(manager)
    overrides=read(manager.transcript_path,{}).get("message_overrides",{})
    for item in messages:
        change=overrides.get(item.get("id"),{})
        if change.get("lifecycle")=="forgotten":continue
        yield {**item,**{k:v for k,v in change.items() if k!="lifecycle"}}
def execute(manager,action,record_id="",content="",session_id="",limit=20,offset=0,expected_revision=None,operation_id="",profile_id="",project_id=""):
    with manager._lock:
        recover(manager)
        raw=[r for r in manager._raw_messages() if matches_scope(r,profile_id,project_id)];t=read(manager.transcript_path,{"conversation":[]})
        overrides=t.setdefault("message_overrides",{});forgotten=read(manager.forgotten_path,{"schema_version":3,"records":{}})
        if action=="sessions":
            sessions={}
            for message in effective(manager,raw):
                sid=message.get("session_id") or "legacy-history"
                row=sessions.setdefault(sid,{"session_id":sid,"count":0,"created":message.get("timestamp",""),"updated":message.get("timestamp","")})
                row["count"]+=1;row["updated"]=max(row["updated"],message.get("timestamp",""))
            rows=sorted(sessions.values(),key=lambda x:x["updated"],reverse=True)
            return {"status":"ok","sessions":rows[max(0,int(offset)):max(0,int(offset))+min(50,max(1,int(limit)))],"total":len(rows)}
        if action=="list":
            rows=[m for m in effective(manager,raw) if not session_id or (m.get("session_id") or "legacy-history")==session_id]
            return {"status":"ok","messages":rows[max(0,int(offset)):max(0,int(offset))+min(50,max(1,int(limit)))],"total":len(rows)}
        original=next((m for m in raw if m.get("id")==record_id),None)
        if not original:return {"status":"not_found","id":record_id}
        current={**original,**overrides.get(record_id,{})};revision=current.get("revision",1)
        if action in {"get","history"}:return {"status":"ok","record":current}
        if action not in {"update","forget","restore"}:return {"status":"rejected","reason":"invalid_transcript_action"}
        if expected_revision is not None and int(expected_revision)!=revision:return {"status":"rejected","reason":"revision_conflict","revision":revision}
        if operation_id and t.get("transcript_operations",{}).get(operation_id):return t["transcript_operations"][operation_id]
        manager.prepare_rules()
        if action=="update":
            if not isinstance(content,str) or not 0<len(content)<=8000 or safe(content)!=content:return {"status":"rejected","reason":"invalid_or_sensitive_content"}
            if current.get("lifecycle")=="forgotten":return {"status":"rejected","reason":"restore_before_editing"}
            changed={**current,"content":content,"revision":revision+1,"updated":now(),"history":current.get("history",[])+[{k:v for k,v in current.items() if k!="history"}]}
            overrides[record_id]=changed;status="updated"
        elif action=="forget":
            if current.get("lifecycle")=="forgotten":return {"status":"already_forgotten","id":record_id}
            forgotten["records"][record_id]={"id":record_id,"kind":"transcript","category":"session_themes","key":"transcript_"+record_id[:40],"value":current["content"],"source":"conversation","session_id":original.get("session_id",""),"turn_id":original.get("turn_id",""),"revision":revision,"history":current.get("history",[]),"forgotten_at":now(),"transcript_record":current,"profile_id":original.get("profile_id",""),"project_id":original.get("project_id",""),"scope":original.get("scope","default")}
            overrides[record_id]={**current,"lifecycle":"forgotten"};status="forgotten"
        else:
            archived=forgotten["records"].get(record_id)
            if not archived or archived.get("kind")!="transcript":return {"status":"not_found","id":record_id}
            overrides[record_id]={**archived["transcript_record"],"lifecycle":"active","restored_at":now()}
            del forgotten["records"][record_id];status="restored"
        result={"status":status,"id":record_id,"session_id":original.get("session_id",""),"revision":overrides[record_id].get("revision",revision)}
        if operation_id:t.setdefault("transcript_operations",{})[operation_id]=result
        journal=manager.transcript_path.with_name("transcript-management.pending.json")
        atomic(journal,{"transcript":t,"forgotten":forgotten})
        recover(manager)
        return result
