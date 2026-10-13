"""Read-only graph projections of authoritative memory and retained transcripts."""
import hashlib, json, time
from .category_policy import lifecycle, matches_scope, instant


def _conversations(manager, memory, profile_id='', project_id=''):
    from .shared_memory import normal, stable
    hidden=[normal(str(r.get('value',''))) for r in memory.get('forgotten_records',{}).values() if len(str(r.get('value','')).strip())>=4]
    connection=manager._index()
    try:
        rows=connection.execute("SELECT payload FROM recall WHERE json_extract(payload,'$.kind')='conversation' ORDER BY json_extract(payload,'$.timestamp'), rowid")
        turns={}; legacy={}
        for row in rows:
            message=json.loads(row[0])
            if message.get('private') or message.get('private_session') or message.get('interrupted') or message.get('completed') is False or message.get('state') in {'partial','interrupted'} or not matches_scope(message,profile_id,project_id):continue
            if any(v in normal(message.get('content','')) for v in hidden):continue
            sid=message.get('session_id') or 'legacy-history'
            turn=message.get('turn_id')
            if turn:
                key=(sid,turn)
                turns.setdefault(key,{})[message.get('role')]=message
            elif message.get('role')=='user':legacy[sid]=message
            elif message.get('role')=='assistant' and sid in legacy:
                user=legacy.pop(sid);key=(sid,'legacy:'+stable(user['id'],message['id']))
                turns[key]={'user':user,'assistant':message}
        return {key:value for key,value in turns.items() if value.get('user',{}).get('content') and value.get('assistant',{}).get('content')}
    finally:connection.close()


def graph_snapshot(manager, *, category='', profile_id='', project_id='', limit=500, offset=0):
    from .shared_memory import stable, canonical
    limit=max(1,min(int(limit),1000));offset=max(0,int(offset))
    with manager._lock:
        signature=manager._signature();cache_key=(signature,category,profile_id,project_id)
        cached=getattr(manager,'_graph_cache',None)
        if cached and cached[0]==cache_key and time.monotonic()-cached[1]<5 and time.time()<cached[3]:
            snapshot=cached[2]
        else:
            memory=manager.load();nodes=[];record_ids=set()
            for rid,record in memory['records'].items():
                if lifecycle(record,memory['_meta'])!='active' or not matches_scope(record,profile_id,project_id):continue
                if category and record['category']!=category:continue
                record_ids.add(rid)
                nodes.append({'id':rid,'kind':record['kind'],'category':record['category'],'key':record['key'],'label':record['key'].replace('_',' '),'created':record.get('created',''),'updated':record.get('updated',''),'revision':record.get('revision',1),'session_id':record.get('session_id',''),'profile_id':record.get('profile_id',''),'project_id':record.get('project_id','')})
            pairs=_conversations(manager,memory,profile_id,project_id) if not category or category=='session_themes' else {}
            sessions={}
            for (sid,turn),pair in pairs.items():
                group=sessions.setdefault(sid,{'id':stable('graph-session',sid),'kind':'session','category':'session_themes','session_id':sid,'key':'conversation','label':'Conversation','turn_count':0,'created':pair['user'].get('timestamp',''),'updated':pair['assistant'].get('timestamp',''),'revision':0})
                group['turn_count']+=1;group['revision']+=1
                group['created']=min(group['created'],pair['user'].get('timestamp') or group['created']);group['updated']=max(group['updated'],pair['assistant'].get('timestamp') or group['updated'])
            from .shared_memory import read
            metadata=read(manager.transcript_path,{}).get('sessions',{})
            for sid,node in sessions.items():node['label']=metadata.get(sid,{}).get('title') or 'Conversation · '+node['created'][:10]
            nodes.extend(sessions.values())
            for topic in memory.get("topic_groups",{}).values():
                if topic.get("state")=="active" and matches_scope(topic,profile_id,project_id) and (not category or topic["category"]==category):
                    members=[rid for rid in topic["member_ids"] if rid in record_ids]
                    if members:nodes.append({**topic,"key":topic["label"],"member_ids":members})
            edges=[{k:link.get(k,'') for k in ('id','from','to','type')} for link in memory['relationships_v3'].values() if link['from'] in record_ids and link['to'] in record_ids]
            for node in nodes:
                if node["kind"]=="topic":
                    for rid in node["member_ids"]:edges.append({"id":stable("topic-member",node["id"],rid),"from":node["id"],"to":rid,"type":"topic_membership","visual_only":True})
                sid=node.get('session_id')
                if node['kind']!='session' and sid in sessions:
                    edges.append({'id':stable('graph-source',node['id'],sessions[sid]['id']),'from':node['id'],'to':sessions[sid]['id'],'type':'source_session','visual_only':True})
            nodes.sort(key=lambda n:n['id'])
            revision=hashlib.sha256(canonical((signature,[(n['id'],n['revision']) for n in nodes])).encode()).hexdigest()[:20]
            snapshot={'status':'ok','revision':revision,'nodes':nodes,'edges':edges,'counts':{'memories':len(record_ids),'sessions':len(sessions),'completed_turns':sum(n['turn_count'] for n in sessions.values()),'connections':sum(not e.get('visual_only') for e in edges)}}
            transitions=[instant(record.get(field)).timestamp() for record in memory['records'].values() for field in ('valid_from','valid_until') if record.get(field) and instant(record[field]).timestamp()>time.time()]
            manager._graph_cache=(cache_key,time.monotonic(),snapshot,min(transitions,default=float('inf')))
        return {**snapshot,'nodes':snapshot['nodes'][offset:offset+limit],'total':len(snapshot['nodes']),'offset':offset,'limit':limit}


def session_details(manager, session_id, *, profile_id='', project_id='', offset=0, limit=20, turn_id=''):
    from .shared_memory import safe
    with manager._lock:
        memory=manager.load();pairs=_conversations(manager,memory,profile_id,project_id)
        turns=[{'turn_id':turn,'messages':[{k:message.get(k,'') for k in ('id','role','timestamp')}|{'content':safe(message.get('content',''))} for message in (pair['user'],pair['assistant'])]} for (sid,turn),pair in pairs.items() if sid==session_id and (not turn_id or turn==turn_id)]
        return {'status':'ok','session_id':session_id,'turns':turns[max(0,int(offset)):max(0,int(offset))+max(1,min(int(limit),50))],'total':len(turns)}
