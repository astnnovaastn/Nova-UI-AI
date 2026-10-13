"""Logical conversations independent of transport connections."""
import re,uuid
from .shared_memory import read,atomic,now,safe
from .category_policy import matches_scope

def action(manager,action,session_id="",title="",query="",offset=0,limit=20,profile_id="",project_id=""):
 with manager._lock:
  manager.prepare_conversations();t=read(manager.transcript_path,{"conversation":[]});meta=t.setdefault("sessions",{})
  rows={}
  for message in manager._messages(t):
   if not matches_scope(message,profile_id,project_id):continue
   sid=message.get("session_id") or "legacy-history";r=rows.setdefault(sid,{"session_id":sid,"title":"","created":message.get("timestamp",""),"updated":"","count":0,"preview":"","profile_id":message.get("profile_id",""),"project_id":message.get("project_id","")})
   r["count"]+=1;r["updated"]=max(r["updated"],message.get("timestamp",""))
   if message.get("role")=="user" and not r["title"]:r["title"]=safe(message.get("content",""))[:70];r["preview"]=r["title"]
  for sid,r in meta.items():
   if matches_scope(r,profile_id,project_id):
    derived=rows.get(sid,{"session_id":sid,"count":0,"preview":""});rows[sid]={**derived,**r,"updated":max(derived.get("updated",""),r.get("updated",""))}
    if r.get("title")=="New conversation" and derived.get("title"):rows[sid]["title"]=derived["title"]
  if action=="list":
   result=sorted([r for r in rows.values() if query.lower() in (r.get("title","")+r.get("preview","")).lower()],key=lambda r:r.get("updated",r.get("created","")),reverse=True)
   return {"status":"ok","sessions":result[max(0,offset):max(0,offset)+min(50,max(1,limit))],"total":len(result)}
  if action=="create":session_id=uuid.uuid4().hex;rows[session_id]={"session_id":session_id,"title":"New conversation","created":now(),"updated":now(),"profile_id":profile_id,"project_id":project_id,"count":0}
  elif not re.fullmatch(r"[\w-]{1,128}",session_id) or session_id not in rows:return {"status":"not_found","reason":"conversation_not_found"}
  if action=="rename":
   if not isinstance(title,str) or not 1<=len(title.strip())<=100 or safe(title)!=title:return {"status":"rejected","reason":"invalid_title"}
   rows[session_id]["title"]=title.strip()
  if action not in {"create","rename","activate","resume","get"}:return {"status":"rejected","reason":"invalid_session_action"}
  row=rows[session_id];meta[session_id]={k:v for k,v in row.items() if k not in {"count","preview"}};atomic(manager.transcript_path,t)
  messages=[m for m in manager._messages(t) if (m.get("session_id") or "legacy-history")==session_id and matches_scope(m,profile_id,project_id)]
  return {"status":"ok","session_id":session_id,"session":row,"messages":messages[-100:]}

def context(manager,session_id,profile_id="",project_id="",budget=12000):
 messages=[m for m in manager._messages() if (m.get("session_id") or "legacy-history")==session_id and matches_scope(m,profile_id,project_id)]
 selected=[];size=0
 for m in reversed(messages):
  content=str(m.get("content",""));remaining=budget-size
  if remaining<=0:break
  if len(content)>remaining:content=content[:remaining]
  selected.append({**m,"content":content});size+=len(content)
 return list(reversed(selected))
