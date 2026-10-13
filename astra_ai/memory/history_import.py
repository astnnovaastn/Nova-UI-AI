"""Preview-first attributed legacy history import; stable IDs make retries harmless."""
import json
from .shared_memory import stable,safe,canonical,now
from datetime import datetime

def preview(content):
    if not isinstance(content,str) or len(content)>10_000_000:raise ValueError('Import must be text below 10 MB')
    try:data=json.loads(content)
    except json.JSONDecodeError:
        data=[json.loads(line) for line in content.splitlines() if line.strip()]
    if isinstance(data,dict):data=data.get('conversation',data.get('messages',[]))
    if not isinstance(data,list):raise ValueError('Expected conversation/messages array or JSONL')
    messages=[];ambiguous=[];turns={}
    for i,item in enumerate(data):
        if not isinstance(item,dict):ambiguous.append(i);continue
        role=str(item.get('role',item.get('speaker',''))).lower()
        role={'human':'user','ai':'assistant','nova':'assistant','aegis':'assistant'}.get(role,role)
        content=item.get('content',item.get('text',''));stamp=item.get('timestamp','')
        if role not in {'user','assistant'} or not isinstance(content,str) or not content.strip():ambiguous.append(i);continue
        try:
            parsed=datetime.fromisoformat(stamp.replace('Z','+00:00'))
            if parsed.tzinfo is None:raise ValueError('Missing timezone')
        except (ValueError,AttributeError):ambiguous.append(i);continue
        sid=str(item.get('session_id') or 'import-'+stamp[:10])[:128]
        if role=='user':turns[sid]=str(item.get('turn_id') or stable('import-turn',sid,stamp,content))
        turn=turns.get(sid)
        if not turn:ambiguous.append(i);continue
        mid=stable('import-message',sid,role,stamp,content)
        messages.append({'id':mid,'role':role,'content':safe(content),'timestamp':stamp,'session_id':sid,'turn_id':turn,'source':'legacy_history_import','completed':True})
    return {'status':'preview','messages':messages,'counts':{'messages':len(messages),'sessions':len({m['session_id'] for m in messages}),'ambiguous':len(ambiguous)},'ambiguous_indices':ambiguous,'fingerprint':stable(canonical(messages))}

def commit(manager,content,fingerprint,profile_id='',project_id=''):
    p=preview(content)
    if fingerprint!=p['fingerprint']:raise ValueError('Import changed after preview')
    with manager._lock:
        manager._backup(manager.memory_path,'before_history_import');manager._backup(manager.transcript_path,'before_history_import')
        messages=[{**m,'profile_id':profile_id,'project_id':project_id} for m in p['messages']]
        result=manager.append_messages(messages)
        if result.get('status')=='private':return result
        for message in messages:
            if message['role']=='user':manager.extract_user_facts(message['content'],message['session_id'],message['turn_id'],profile_id,project_id)
        listener=getattr(manager,'_turn_listener',None)
        if listener:
            for sid,tid in {(m['session_id'],m['turn_id']) for m in messages}:listener(sid,tid,profile_id,project_id)
    return {'status':'saved','counts':p['counts'],'result':result}
