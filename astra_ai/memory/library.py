"""Scoped library projections. Counts and pages use the same membership set."""
import copy, time
from .category_registry import catalog, category_ids, resolve, palette
from .category_policy import matches_scope, lifecycle
from .globe_projection import projection
from .shared_memory import stable, canonical

def permitted(record, profile='', project=''):
    return matches_scope(record, profile, project) and not any(record.get(k) for k in ('private','private_session')) and not record.get('attributes',{}).get('private_session') and record.get('consent') not in {'none','denied','revoked','private'}

def snapshot(manager, profile='', project='', state='all'):
    with manager._lock:
        memory=manager.load(); rows=catalog(memory,profile,project,True)
        projected=projection(manager,profile,project)
        records={rid:copy.deepcopy(r) for rid,r in memory.get('forgotten_records' if state=='forgotten' else 'records',{}).items() if permitted(r,profile,project)}
        if state!='forgotten':
            for rid,r in projected['records'].items():records.setdefault(rid,copy.deepcopy(r))
        for r in records.values():r['effective_lifecycle']='forgotten' if state=='forgotten' else lifecycle(r,memory['_meta'])
        records={rid:r for rid,r in records.items() if (state=='all' and r['effective_lifecycle'] not in {'expired','forgotten'} or r['effective_lifecycle']==state)}
        direct={cid:set() for cid in rows}
        for rid,r in records.items():
            target=resolve(memory,r.get('category',''),profile,project,True)
            if target:direct.setdefault(target['id'],set()).add(rid)
        for cid,row in rows.items():
            target=resolve(memory,cid,profile,project,True)
            if target:direct.setdefault(target['id'],set()).update(set(row.get('member_ids',[]))&records.keys())
        members={cid:set().union(*(direct.get(target,set()) for target in category_ids(memory,cid,profile,project,True))) for cid in rows}
        from .globe_topics import topics
        from .category_registry import FAMILIES
        all_topics=topics(projected['records'],{tid:t for tid,t in memory.get('topic_groups',{}).items() if permitted(t,profile,project)},limit=None)
        for topic in all_topics:
            topic['palette']=palette({'id':topic['id'],'color_family':FAMILIES[int(stable(topic['id'])[:4],16)%len(FAMILIES)]})
            ids=set(topic['member_ids'])&records.keys()
            if not ids:continue
            rows[topic['id']]={'id':topic['id'],'label':topic['label'],'state':'active','revision':1,'parent_id':None,'aliases':[],'palette':topic.get('palette'),'visual_only':True}
            members[topic['id']]=ids
        revision=stable('library-v1',profile,project,state,canonical(rows),canonical(records))
        return rows,records,members,revision

def categories(manager,profile='',project='',query='',offset=0,limit=50,state='all'):
    rows,records,members,revision=snapshot(manager,profile,project,state)
    items=[{'id':cid,'category':cid,'title':r['label'],'parent_id':r.get('parent_id'),'state':r['state'],'revision':r['revision'],'palette':r.get('palette') or palette(r),'visual_only':r.get('visual_only',False),'count':len(members[cid])} for cid,r in rows.items() if r['state']!='merged' and (not query or query.casefold() in (r['label']+' '+' '.join(r.get('aliases',[]))).casefold())]
    items.sort(key=lambda r:(r['title'].casefold(),r['id']));offset=max(0,int(offset));limit=max(1,min(100,int(limit)))
    return {'status':'ok','revision':revision,'categories':items[offset:offset+limit],'total':len(items),'offset':offset,'limit':limit}

def page(manager,profile='',project='',category='',query='',state='all',offset=0,limit=20):
    rows,records,members,revision=snapshot(manager,profile,project,state)
    ids=members.get(category.split('#')[0],set()) if category else records.keys()
    result=[records[rid] for rid in ids if not query or all(w in canonical(records[rid]).casefold() for w in query.casefold().split())]
    result.sort(key=lambda r:(r.get('updated') or r.get('created') or '',r['id']),reverse=True)
    offset=max(0,int(offset));limit=max(1,min(100,int(limit)))
    return {'status':'ok','revision':revision,'matches':result[offset:offset+limit],'total':len(result),'offset':offset,'limit':limit}

def approval_token(proposal):return stable('approval-v1',canonical(proposal))

def memory_approvals(manager,profile='',project=''):
    with manager._lock:
        m=manager.load();items=[]
        for pid,p in m.get('pending_approvals',{}).items():
            r=p.get('record')
            if r is not None and not permitted(r,profile,project):continue
            if r is None:
                rel=p.get('relationship',{});ends=[m['records'].get(rel.get(k)) for k in ('from','to')]
                if not all(ends) or not all(permitted(r,profile,project) for r in ends):continue
            items.append({'id':'memory:'+pid,'source':'memory','source_id':pid,'title':(r or {}).get('key') or 'Memory relationship','state':'waiting','created':p.get('created') or (r or {}).get('created'),'decided':None,'version':approval_token(p),'details':copy.deepcopy(p)})
        for item in m.get('approval_history',{}).values():
            details=item.get('details',{});record_id=details.get('record',{}).get('id')
            rel=details.get('relationship');endpoints=[m['records'].get(rel.get(k)) for k in ('from','to')] if rel else []
            if not permitted(item,profile,project) or record_id in m.get('forgotten_records',{}):continue
            if rel and (not all(endpoints) or not all(permitted(r,profile,project) for r in endpoints)):continue
            items.append(copy.deepcopy(item))
        return items

def decide(manager,pid,approved,version,profile='',project=''):
    with manager._lock:
        candidates={r['source_id']:r for r in memory_approvals(manager,profile,project) if r['state']=='waiting'}
        item=candidates.get(pid)
        if not item:return {'status':'not_found'}
        if item['version']!=version:return {'status':'conflict','reason':'proposal_changed'}
        return manager.approve(pid,approved)
