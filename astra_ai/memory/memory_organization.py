"""One organized on-disk representation; the service exposes a compatibility view."""
from collections import defaultdict
from .shared_memory import canonical, normal, stable, now, ALIASES

SECTIONS=('facts','events','activity_history')
def inflate(data):
    data=dict(data);records=dict(data.get('records',{}))
    for section in SECTIONS:
        for group in data.get(section,{}).values():
            if not isinstance(group,dict):raise ValueError('Invalid organized memory group')
            for rid,record in group.items():
                if rid in records and records[rid]!=record:raise ValueError('Conflicting duplicate memory ID')
                records[rid]=record
        data.pop(section,None)
    data['records']=records
    return data

def encode(data):
    groups={name:{} for name in SECTIONS}
    for rid,r in sorted(data.get('records',{}).items(),key=lambda item:(item[1].get('category',''),item[1].get('event_type',''),item[1].get('key',''),item[0])):
        name='facts' if r['kind']=='fact' else 'activity_history' if r['kind']=='activity' else 'events'
        group=r['category'] if name=='facts' else r.get('event_type','legacy_event')
        groups[name].setdefault(group,{})[rid]=r
    keys=('category_registry','research_index','capability_index','category_definitions','relationships_v3','learning','conflicts','pending_approvals','approval_history','catalog_relationships','organization_history','topic_groups','entity_graph','_meta')
    clean={**groups,**{key:data[key] for key in keys if key in data}}
    clean.setdefault('_meta',{})['layout']='organized_v1'
    return clean

def organize(manager,dry_run=False):
    with manager._lock:
        data=manager.load();before=len(data['records']);catalog=data.setdefault('category_definitions',{})
        from .shared_memory import read
        originals=read(manager.transcript_path,{}).get('memory_events',[])
        original_map={str(event.get('key') or event.get('event_id') or stable(canonical(event))):event for event in originals if isinstance(event,dict)}
        activities=0
        for record in data['records'].values():
            original=original_map.get(record['key'])
            if record['kind']=='event' and record.get('event_type')=='legacy_event' and original and original.get('type') in {'ADD','UPDATE','DELETE','REINFORCE','MERGE'}:
                action=original['type'].lower()
                record['kind']='activity';record['event_type']='memory_'+action;record['action']=action
                record['source_timestamp']=original.get('timestamp','')
                record['attributes']={**record.get('attributes',{}),'legacy_category':original.get('category'),'provenance':original.get('provenance',{})}
                if original.get('timestamp'):record['created']=record['updated']=original['timestamp']
                activities+=1
        catalog_ids=set();moved=0;merged=0;remap={};groups={}
        for rid,r in list(data['records'].items()):
            if r['kind']=='fact' and r['key'] in {'description','enhancement_focus','contextual_considerations'} and r.get('evidence')=='legacy migration':
                definition=catalog.setdefault(r['category'],{})
                definition[r['key']]=r['value'];definition.setdefault('source_record_ids',[]).append(rid)
                catalog_ids.add(rid);del data['records'][rid];moved+=1
                continue
            # Only exact scoped duplicates are merged. Differing keys, values,
            # evidence dates or categories remain separate.
            signature=(r['kind'],r['category'],r.get('event_type',''),r['key'],normal(canonical(r['value'])),canonical(r.get('attributes',{})),r.get('scope','default'))
            if r['kind']!='fact':signature+= (r.get('source_timestamp',r.get('created','')),)
            if signature not in groups:groups[signature]=rid;continue
            winner=groups[signature];target=data['records'][winner]
            target.setdefault('merged_from',[]).append(rid)
            target.setdefault('source_history',[]).append({k:v for k,v in r.items() if k!='history'})
            history=target.setdefault('history',[])
            for revision in r.get('history',[]):
                if revision not in history:history.append(revision)
            target['revision']=max(target['revision'],r['revision'])
            remap[rid]=winner;del data['records'][rid];merged+=1
        def reference(value):
            if isinstance(value,list):return [reference(x) for x in value]
            if isinstance(value,dict):return {k:reference(v) for k,v in value.items()}
            if isinstance(value,str):return remap.get(value,value)
            return value
        for key in ('relationships_v3','learning','conflicts','pending_approvals'):
            data[key]=reference(data.get(key,{} if key!='conflicts' else []))
        orphaned=[]
        for lid,link in list(data.get('relationships_v3',{}).items()):
            if link['from'] in catalog_ids or link['to'] in catalog_ids:
                orphaned.append(link);del data['relationships_v3'][lid]
        data.setdefault('catalog_relationships',[]).extend(orphaned)
        report={'before_records':before,'after_records':len(data['records']),'category_metadata_moved':moved,'historical_actions_organized':activities,'duplicates_merged':merged,'references_updated':len(remap),'dry_run':dry_run}
        if not dry_run:
            manager._backup(manager.transcript_path,'pre_organization')
            manager._backup(manager.memory_path,'pre_organization')
            manager._backup(manager.forgotten_path,'pre_organization')
            data.setdefault('organization_history',[]).append({**report,'timestamp':now()})
            manager._commit(data)
            transcript=read(manager.transcript_path,{})
            obsolete=('memory_engine','fact_history','memory_categories','category_relationships','behavioral_adaptation','memory_events')
            for key in obsolete:transcript.pop(key,None)
            from .shared_memory import atomic
            atomic(manager.transcript_path,transcript)
        return report
