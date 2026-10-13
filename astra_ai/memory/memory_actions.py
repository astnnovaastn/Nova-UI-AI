"""Validated operations for the AI's user-authorized memory management."""
from .shared_memory import ALIASES, now, stable, canonical

ACTIONS = [
    'categories', 'list', 'search', 'get', 'history', 'create_fact', 'create_event', 'update',
    'rename', 'forget', 'restore', 'list_forgotten', 'search_forgotten', 'list_pending', 'approve',
    'reject', 'link', 'unlink', 'list_links', 'learn', 'list_learning',
    'delete_learning', 'list_conflicts', 'stats', 'rebuild_index', 'organization_preview', 'organize',
]

def execute(manager,action,**args):
    if action not in ACTIONS:return {'status':'rejected','reason':'unknown_memory_action','actions':ACTIONS}
    topic=manager.load().get('topic_groups',{}).get(str(args.get('record_id','')))
    if topic and action in {'get','history','forget','restore','rename'}:
        from .category_policy import matches_scope
        if not matches_scope(topic,args.get('profile_id',''),args.get('project_id','')):return {'status':'not_found'}
        if action in {'get','history'}:return {'status':'ok','record':{**topic,'key':topic['label'],'value':topic['label'],'related_ids':topic['member_ids']}}
        return manager.topic_action(action,topic_id=topic['id'],label=args.get('label',args.get('key','')),profile_id=args.get('profile_id',''),project_id=args.get('project_id',''))
    rid=str(args.get('record_id',''));limit=max(1,min(int(args.get('limit',20)),100))
    if action in {"restore","get","history"}:
        archived=manager.load().get("forgotten_records",{}).get(rid)
        if archived and archived.get("kind")=="transcript":return manager.transcript_action(action,record_id=rid,profile_id=args.get("profile_id",""),project_id=args.get("project_id",""),operation_id=args.get("operation_id",""))
    if action=='categories':return manager.category_catalog(profile_id=args.get('profile_id',''),project_id=args.get('project_id',''))
    if action=='list':return manager.list_records(**{k:v for k,v in args.items() if k in {'limit','offset','category','kind','event_type','source','session_id','profile_id','project_id','scope','lifecycle','query','since','until'}})
    if action=='search':
        return manager.recall_memory(args.get('query',''),limit,**{k:args[k] for k in ('kind','category','event_type','source','session_id','since','until','profile_id','project_id','scope','lifecycle') if args.get(k)})
    if action in {'organize','organization_preview'}:return {'status':'organized' if action=='organize' else 'preview',**manager.organize(dry_run=action=='organization_preview')}
    if action=='stats':return {'status':'ok',**manager.stats(),'actions':ACTIONS}
    if action=='create_fact':
        return manager.save_fact(args.get('category','notes'),args.get('key',''),args.get('value',''),**args.get('metadata',{}))
    if action=='create_event':
        return manager.save_event(args.get('event_type','custom_memory'),args.get('key',''),args.get('value',''),args.get('attributes'),args.get('tags'),category=args.get('category','meta_memory'),**args.get('metadata',{}))
    if action=='forget':return manager.forget(rid)
    if action=='restore':return manager.restore(rid)
    if action in {'approve','reject'}:return manager.approve(args.get('approval_id',''),action=='approve')
    if action=='link':return manager.link(rid,args.get('to_id',''),args.get('relationship_type','related_to'),args.get('evidence',''))
    if action=='learn':return manager.learn(args.get('learning_type','preference_learning'),rid,args.get('evidence',''),args.get('confidence',1),args.get('evidence_refs'))
    with manager._lock:
        m=manager.load()
        if action=='list':
            matches=list(m['records'].values())
            for field in ('kind','category','event_type','source','session_id'):
                if args.get(field):
                    wanted=ALIASES.get(args[field],args[field]) if field=='category' else args[field]
                    matches=[r for r in matches if r.get(field)==wanted]
            matches.sort(key=lambda r:r.get('updated',''),reverse=True)
            return {'status':'ok','matches':matches[:limit],'total':len(matches)}
        if action in {'get','history','update','rename'}:
            r=m['records'].get(rid)
            if not r and action in {'get','history'} and args.get('include_forgotten'):
                r=m.get('forgotten_records',{}).get(rid)
            if not r and action in {'get','history'}:
                key=str(args.get('key') or rid)
                from .category_policy import lifecycle, matches_scope
                candidates=[v for v in m['records'].values() if v.get('key')==key and (not args.get('category') or v.get('category')==ALIASES.get(args['category'],args['category'])) and lifecycle(v,m['_meta'])=='active' and matches_scope(v,args.get('profile_id',''),args.get('project_id',''),args.get('scope'))]
                if len(candidates)>1:return {'status':'ambiguous','reason':'category_or_scope_required','matches':[{'id':v['id'],'category':v['category'],'key':v['key']} for v in candidates]}
                if candidates:r=candidates[0];rid=r['id']
            if not r:return {'status':'not_found','id':rid}
            if action=='get':return {'status':'ok','record':r}
            if action=='history':return {'status':'ok','id':rid,'revision':r['revision'],'history':r.get('history',[])}
            if action=='update':
                if args.get('expected_revision') is not None and int(args['expected_revision'])!=r.get('revision',1):return {'status':'conflict','reason':'Memory changed. Refresh and review the latest revision before saving your draft.','id':rid,'revision':r.get('revision',1)}
                if r['kind']=='activity':return {'status':'rejected','reason':'historical_action_is_immutable'}
                metadata={**{k:r[k] for k in ('scope','profile_id','project_id','valid_from','valid_until','category','explicit_preference','inferred','evidence_refs') if k in r},**args.get('metadata',{}),'correction':True,'scope':r.get('scope','default'),'record_id':rid}
                metadata.pop('category',None)
                if r['kind']=='fact':return manager.save_fact(r['category'],r['key'],args.get('value',r['value']),**metadata)
                return manager.save_event(r['event_type'],r['key'],args.get('value',r['value']),args.get('attributes',r.get('attributes')),args.get('tags',r.get('tags')),category=r['category'],**metadata)
            from .shared_memory import KEY
            key=str(args.get('key','')).lower().strip()
            if not KEY.fullmatch(key):return {'status':'rejected','reason':'invalid_key'}
            if any(x['id']!=rid and x['kind']==r['kind'] and x['category']==r['category'] and x['key']==key for x in m['records'].values()):
                return {'status':'conflict','reason':'key_exists'}
            r['history'].append({k:v for k,v in r.items() if k!='history'})
            from .shared_memory import _delete_path,_set_path,_canonical_path
            for alias,target in ALIASES.items():
                if r['kind']=='fact' and target==r['category']:_delete_path(m,_canonical_path(alias,r['key']))
            r['key']=key;r['revision']+=1;r['updated']=now()
            for alias,target in ALIASES.items():
                if r['kind']=='fact' and target==r['category']:
                    _set_path(m,_canonical_path(alias,key),{'value':r['value'],'updated':r['updated'],'source':r['source'],'confidence':r['confidence']})
                    break
            manager._commit(m)
            return {'status':'updated','id':rid,'revision':r['revision']}
        if action in {'list_forgotten','search_forgotten'}:
            records=list(m['forgotten_records'].values())
            for field in ('category','event_type','source','session_id','profile_id','project_id','scope'):
                if args.get(field):records=[r for r in records if r.get(field)==(ALIASES.get(args[field],args[field]) if field=='category' else args[field])]
            if action=='search_forgotten':
                words=str(args.get('query','')).casefold().split()
                if not words:return {'status':'rejected','reason':'empty_query','matches':[]}
                records=[r for r in records if all(word in (str(r.get('key',''))+' '+str(r.get('value',''))+' '+str(r.get('event_type',''))).casefold() for word in words)]
            return {'status':'ok','matches':records[:limit],'total':len(records),'active':False}
        if action=='list_pending':
            proposals=[p for p in m['pending_approvals'].values() if not args.get('category') or p.get('record',{}).get('category')==ALIASES.get(args['category'],args['category'])]
            return {'status':'ok','proposals':proposals[:limit],'total':len(proposals)}
        if action=='list_links':
            links=[x for x in m['relationships_v3'].values() if not rid or rid in {x['from'],x['to']}]
            offset=max(0,int(args.get('offset',0)))
            return {'status':'ok','links':links[offset:offset+limit],'total':len(links),'offset':offset}
        if action=='list_learning':return {'status':'ok','learning':list(m['learning'].values())[:limit]}
        if action=='list_conflicts':return {'status':'ok','conflicts':[x for x in m['conflicts'] if not rid or x.get('record_id')==rid][:limit]}
        if action in {'unlink','delete_learning'}:
            store=m['relationships_v3' if action=='unlink' else 'learning']
            if rid not in store:return {'status':'not_found','id':rid}
            del store[rid];manager._commit(m);return {'status':'deleted','id':rid}
        if action=='rebuild_index':
            manager.index_path.unlink(missing_ok=True);conn=manager._index();conn.close()
            return {'status':'rebuilt'}
