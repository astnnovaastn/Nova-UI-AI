"""Evidence-based topic membership; not semantic relationships."""
import copy
from .shared_memory import normal,stable,now,safe
from .category_policy import POLICIES,matches_scope,lifecycle

def action(manager,action,topic_id="",label="",category="",member_ids=None,merge_id="",profile_id="",project_id="",**unused):
 if member_ids is not None and (not isinstance(member_ids,list) or any(not isinstance(r,str) for r in member_ids)):return {"status":"rejected","reason":"invalid_members"}
 with manager._lock:
  manager.prepare_conversations();m=manager.load();topics=m.setdefault("topic_groups",{});members=list(dict.fromkeys(member_ids or []))
  if action=="list":return {"status":"ok","topics":[t for t in topics.values() if t.get("state")=="active" and matches_scope(t,profile_id,project_id)]}
  if label and safe(str(label))!=str(label):return {"status":"rejected","reason":"credentials_not_allowed"}
  if action in {"create","update","membership"}:
   if action=="create" and (not __import__('astra_ai.memory.category_registry',fromlist=['resolve']).resolve(m,category,profile_id,project_id) or not 1<=len(str(label).strip())<=80):return {"status":"rejected","reason":"invalid_topic"}
   if not members:return {"status":"rejected","reason":"evidenced_members_required"}
   records=[m["records"].get(rid) for rid in members]
   if any(not r or lifecycle(r,m["_meta"])!="active" or not matches_scope(r,profile_id,project_id) for r in records):return {"status":"rejected","reason":"invalid_or_inaccessible_member"}
   if action=="create":
    topic_id=stable("topic",normal(label),category,profile_id,project_id)
    if topic_id in topics and topics[topic_id].get("state")!="active":return {"status":"rejected","reason":"restore_forgotten_topic_explicitly"}
    if topic_id in topics and set(members)<=set(topics[topic_id]["member_ids"]):return {"status":"duplicate","record_id":topic_id,"topic":topics[topic_id]}
    topics.setdefault(topic_id,{"id":topic_id,"kind":"topic","label":label.strip(),"category":category,"profile_id":profile_id,"project_id":project_id,"member_ids":[],"state":"active","created":now(),"revision":0,"history":[]})
  topic=topics.get(topic_id)
  if not topic or not matches_scope(topic,profile_id,project_id):return {"status":"not_found"}
  previous={k:copy.deepcopy(v) for k,v in topic.items() if k!="history"}
  if action=="restore":topic["state"]="active"
  elif action=="forget":topic["state"]="forgotten"
  elif action=="rename":
   if not 1<=len(str(label).strip())<=80:return {"status":"rejected","reason":"invalid_label"}
   topic["label"]=str(label).strip()
  elif action=="merge":
   other=topics.get(merge_id)
   if not other or other["id"]==topic_id or not matches_scope(other,profile_id,project_id):return {"status":"rejected","reason":"invalid_merge"}
   members=list(dict.fromkeys(topic["member_ids"]+other["member_ids"]));other["history"].append({k:copy.deepcopy(v) for k,v in other.items() if k!="history"});other["revision"]+=1;other["updated"]=now();other["state"]="superseded";other["merged_into"]=topic_id
  elif action not in {"create","update","membership"}:return {"status":"rejected","reason":"invalid_action"}
  topic["history"].append(previous)
  if members:topic["member_ids"]=list(dict.fromkeys(topic["member_ids"]+members))
  topic["evidence_refs"]=[{"record_id":rid,"revision":m["records"][rid].get("revision",1)} for rid in topic["member_ids"] if rid in m["records"]]
  topic["revision"]+=1;topic["updated"]=now();manager._commit(m)
  return {"status":"saved" if action=="create" else "updated","record_id":topic_id,"topic":topic}

def organize(manager,session_id,profile_id="",project_id=""):
 # Stable project/event labels provide conservative groups without extra model calls.
 m=manager.load();groups={}
 for r in m["records"].values():
  if r.get("session_id")!=session_id or lifecycle(r,m["_meta"])!="active" or not matches_scope(r,profile_id,project_id):continue
  label=r.get("attributes",{}).get("topic") or r.get("event_type") or (r.get("key") if r.get("category")=="task_project_tracking" else None)
  if isinstance(label,str) and len(label.strip())>=3:groups.setdefault((r["category"],label[:80]),[]).append(r["id"])
 for (category,label),ids in groups.items():action(manager,"create",category=category,label=label,member_ids=ids,profile_id=profile_id,project_id=project_id)
