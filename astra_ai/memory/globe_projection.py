"""Read-only, lifecycle-aware projection for the supplied Canvas globe."""
import base64, copy, json, time
from .shared_memory import stable, canonical, normal, safe
from .category_policy import lifecycle, matches_scope, POLICIES, instant


def visible(record, meta, profile_id='', project_id=''):
    if not matches_scope(record, profile_id, project_id):return False
    if record.get('attributes',{}).get('private_session') or record.get('private') or record.get('private_session') or record.get('consent') in {'denied','revoked','private','none'}:return False
    try:
        start=instant(record.get('valid_from'));until=instant(record.get('valid_until'))
        if until and until.timestamp()<=time.time() or start and start.timestamp()>time.time():return False
    except (ValueError,TypeError):return False
    return lifecycle(record, meta) in {'active','history'}


def projection(manager, profile_id='', project_id=''):
    with manager._lock:
        signature=manager._signature();key=(signature,profile_id,project_id);cached=getattr(manager,'_globe_projection_cache',None)
        if cached and cached[0]==key and time.time()<cached[1]:return cached[2]
        m=manager.load();records={rid:copy.deepcopy(r) for rid,r in m['records'].items() if visible(r,m['_meta'],profile_id,project_id)}
        hidden=[normal(str(r.get('value',''))) for r in m.get('forgotten_records',{}).values() if len(str(r.get('value','')).strip())>=4]
        for msg in manager._messages():
            if msg.get('role') not in {'user','assistant'} or not visible({**msg,'category':'session_themes','kind':'activity'},m['_meta'],profile_id,project_id):continue
            if msg.get('private') or msg.get('private_session') or msg.get('interrupted') or msg.get('completed') is False or msg.get('status') in {'partial','interrupted','pending','streaming'} or msg.get('state') in {'partial','interrupted'}:continue
            if msg.get('consent') in {'denied','revoked','private','none'} or any(text in normal(msg.get('content','')) for text in hidden):continue
            rid=msg.get('id');date=msg.get('timestamp','')
            if not rid or rid in records:continue
            records[rid]={'id':rid,'kind':'activity','category':'session_themes','key':f"{msg['role']} message · {date[:10] if isinstance(date,str) else 'undated'}",'content':safe(msg.get('content','')),'created':date,'updated':msg.get('updated',date),'revision':msg.get('revision',1),'source':'conversation','session_id':msg.get('session_id','legacy-history'),'turn_id':msg.get('turn_id',''),'profile_id':msg.get('profile_id',''),'project_id':msg.get('project_id',''),'attributes':{'original_date':date,'speaker':msg['role'],'transcript':True},'provenance':copy.deepcopy(msg.get('provenance',{})),'history':copy.deepcopy(msg.get('history',[]))}
        from .daily_history import conversation_day
        for record in records.values():
            if record.get('category')=='session_themes':record.setdefault('attributes',{})['conversation_day']=conversation_day(record.get('attributes',{}).get('original_date') or record.get('created'))
        ids=set(records);g=m.get('entity_graph',{});entities={};aliases={}
        for section in ('entities','observations','patterns'):
            for eid,e in sorted(g.get(section,{}).items()):
                members=sorted(set(e.get('member_ids',[]))&ids)
                if e.get('state')!='active' or not members or not visible(e,m['_meta'],profile_id,project_id):continue
                redundant=(section=='observations' or e.get('entity_type')=='concept') and len(members)==1 and normal(e.get('label','')) in {normal(records[members[0]].get('key','').replace('_',' ')),normal(str(records[members[0]].get('value','')))}
                if redundant:aliases[eid]=members[0]
                else:entities[eid]={**copy.deepcopy(e),'member_ids':members}
        for eid,e in sorted(m.get('topic_groups',{}).items()):
            members=sorted(set(e.get('member_ids',[]))&ids)
            if e.get('state')=='active' and members and visible(e,m['_meta'],profile_id,project_id):entities[eid]={**copy.deepcopy(e),'member_ids':members}
        relationships={rid:copy.deepcopy(r) for rid,r in sorted(m.get('relationships_v3',{}).items()) if r.get('from') in ids and r.get('to') in ids}
        connections={}
        for rid,r in sorted(g.get('connections',{}).items()):
            if r.get('state')!='active' or not all(r.get(k) in entities or r.get(k) in aliases for k in ('from','to')):continue
            projected={**copy.deepcopy(r),'from':aliases.get(r['from'],r['from']),'to':aliases.get(r['to'],r['to'])}
            if projected['from']!=projected['to']:connections[rid]=projected
        from .category_registry import catalog,palette,resolve
        category_rows=catalog(m,profile_id,project_id,True);members_by_category={}
        for cid,row in category_rows.items():
            target=(resolve(m,cid,profile_id,project_id,True) or row)['id']
            members_by_category.setdefault(target,set()).update(set(row.get('member_ids',[]))&ids)
        for rid,record in records.items():
            cid=record['category'];row=category_rows.get(cid)
            if row and row.get('state')=='merged':members_by_category.setdefault(resolve(m,cid,profile_id,project_id,True)['id'],set()).add(rid)
        defs={cid:{'description':row.get('description',''),'label':row['label'],'parent_id':row.get('parent_id'),'revision':row['revision'],'palette':palette(row),'state':row['state'],'merged_into':row.get('merged_into'),'member_ids':sorted(members_by_category.get(cid,set())),'source_record_ids':[rid for rid in m.get('category_definitions',{}).get(cid,{}).get('source_record_ids',[]) if rid in ids]} for cid,row in category_rows.items()}
        raw={'facts':{},'events':{},'activity_history':{},'category_definitions':defs,'relationships_v3':relationships,'catalog_relationships':[copy.deepcopy(r) for r in m.get('catalog_relationships',[]) if all(c in defs for c in r.get('categories',[]))],'entity_graph':{'entities':entities,'connections':connections},'conflicts':[copy.deepcopy(c) for c in m.get('conflicts',[]) if c.get('record_id') in ids],'pending_approvals':{pid:copy.deepcopy(p) for pid,p in m.get('pending_approvals',{}).items() if p.get('record',{}).get('id') in ids}}
        for rid,r in sorted(records.items()):
            section={'event':'events','activity':'activity_history'}.get(r.get('kind'),'facts');raw[section].setdefault(r['category'],{})[rid]=r
        from .globe_topics import topics
        raw['visual_topics']=topics(records,{tid:t for tid,t in m.get('topic_groups',{}).items() if matches_scope(t,profile_id,project_id) and not t.get('private') and not t.get('private_session') and t.get('consent') not in {'denied','revoked','private','none'}})
        from .category_registry import FAMILIES
        for topic in raw['visual_topics']:
            topic['palette']=palette({'id':topic['id'],'color_family':FAMILIES[int(stable(topic['id'])[:4],16)%len(FAMILIES)]})
        revision=stable('globe-2',profile_id,project_id,canonical(raw))
        result={'revision':revision,'raw':raw,'records':records}
        until=time.time()+1
        for record in m['records'].values():
            try:
                expiry=instant(record.get('valid_until'))
                if expiry and expiry.timestamp()>time.time():until=min(until,expiry.timestamp())
            except (ValueError,TypeError):pass
        manager._globe_projection_cache=(key,until,result)
        return result


def page(manager, profile_id='', project_id='', cursor='', limit=500):
    snap=projection(manager,profile_id,project_id);start=0
    if cursor:
        try:
            rev,start,scope=json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
            if rev!=snap['revision'] or scope!=stable(profile_id,project_id):return {'status':'stale','revision':snap['revision'],'next_cursor':None,'total':len(snap['records']),'raw':None}
            if not isinstance(start,int) or start<0:raise ValueError()
        except (ValueError,TypeError,UnicodeError):raise ValueError('Invalid globe cursor') from None
    rows=list(snap['records'].items());end=min(len(rows),start+max(1,min(int(limit),1000)));chosen=dict(rows[start:end]);raw=copy.deepcopy(snap['raw'])
    for section in ('facts','events','activity_history'):raw[section]={cid:{rid:r for rid,r in group.items() if rid in chosen} for cid,group in raw[section].items()}
    next_cursor=base64.urlsafe_b64encode(json.dumps([snap['revision'],end,stable(profile_id,project_id)]).encode()).decode() if end<len(rows) else None
    return {'status':'ok','revision':snap['revision'],'next_cursor':next_cursor,'total':len(rows),'raw':raw}


def detail(manager, record_id, profile_id='', project_id=''):
    snap=projection(manager,profile_id,project_id);record=snap['records'].get(record_id)
    return {'status':'ok' if record else 'not_found','revision':snap['revision'],'record':record}
