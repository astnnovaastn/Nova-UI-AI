"""Persistent extensible taxonomy; category policies remain server-owned templates."""
import copy
from dataclasses import asdict, replace
from .category_policy import POLICIES, matches_scope

VERSION=3
PALETTE={'blue':'#5b8def','gray_blue':'#8b95a7','red':'#d9544f','green':'#6fcf7f','violet':'#9b6bff','pink':'#ffb3c1','deep_red':'#8f1d2c','deep_violet':'#5a3aa8','orange':'#ffb3c1','deep_blue':'#8b95a7','yellow':'#6fcf7f','highlight':'#DCD7CE'}
FAMILIES=('blue','gray_blue','red','green','violet','pink','deep_red','deep_violet')
COMPATIBLE_FAMILIES=FAMILIES+('orange','deep_blue','yellow')

def registry(memory):
    from .shared_memory import stable
    rows=memory.setdefault('category_registry',{})
    for i,(cid,policy) in enumerate(POLICIES.items()):
        rows.setdefault(cid,{'id':cid,'label':policy.title,'description':policy.content,'parent_id':None,'aliases':[],'policy_template':cid,'profile_id':'','project_id':'','state':'active','revision':1,'builtin':True,'color_family':('blue' if cid=='user_identity' else 'orange' if cid=='session_themes' else ('blue','violet','red','orange')[i%4]),'provenance':[{'kind':'builtin_policy'}],'history':[]})
    return rows

def source_visible(memory,row,profile_id='',project_id=''):
    from .category_policy import lifecycle
    if row.get('builtin'):return True
    refs=[ref.get('record_id') for ref in row.get('provenance',[]) if ref.get('record_id')]
    if not refs:return True
    def available(record):
        return bool(record) and matches_scope(record,profile_id,project_id) and not record.get('private') and not record.get('private_session') and not record.get('attributes',{}).get('private_session') and lifecycle(record,memory['_meta']) in {'active','history'}
    return any(available(memory.get('records',{}).get(rid)) for rid in refs) or any(r.get('category')==row['id'] and available(r) for r in memory.get('records',{}).values())

def catalog(memory,profile_id='',project_id='',include_inactive=False):
    return {cid:r for cid,r in registry(memory).items() if matches_scope(r,profile_id,project_id) and source_visible(memory,r,profile_id,project_id) and (include_inactive or r['state']=='active')}

def resolve(memory,value,profile_id='',project_id='',include_inactive=False):
    from .shared_memory import normal
    rows=registry(memory);item=rows.get(str(value))
    if not item:
        candidates=[r for r in catalog(memory,profile_id,project_id,True).values() if normal(value) in {normal(r['label']),*(normal(a) for a in r.get('aliases',[]))}]
        if len(candidates)!=1:return None
        item=candidates[0]
    seen=set()
    while item and item.get('state')=='merged':
        if item['id'] in seen:return None
        seen.add(item['id']);item=rows.get(item.get('merged_into'))
    if not item or not matches_scope(item,profile_id,project_id) or not source_visible(memory,item,profile_id,project_id) or (not include_inactive and item['state']!='active'):return None
    return item

def policy(memory,cid,profile_id='',project_id=''):
    row=resolve(memory,cid,profile_id,project_id)
    if not row:return None
    base=POLICIES.get(row['policy_template'])
    return replace(base,category=row['id'],title=row['label'],content=row.get('description') or base.content) if base else None

def category_ids(memory,value,profile_id='',project_id='',descendants=False):
    row=resolve(memory,value,profile_id,project_id,True)
    if not row:return set()
    rows=catalog(memory,profile_id,project_id,True);ids={row['id']};adjacency={}
    for cid,r in rows.items():
        if r.get('merged_into'):adjacency.setdefault(r['merged_into'],[]).append(cid)
        if descendants and r.get('parent_id'):adjacency.setdefault(r['parent_id'],[]).append(cid)
    pending=[row['id']]
    while pending:
        current=pending.pop()
        for cid in adjacency.get(current,[]):
            if cid not in ids:ids.add(cid);pending.append(cid)
    return ids

def palette(row):
    from .shared_memory import stable
    family=row.get('color_family','blue');base=PALETTE[family];other=base
    blend=8+int(stable(row['id'])[:4],16)%9
    return {'family':family,'base':base,'blend_with':other,'blend_percent':blend,'mix_space':'oklch','color':f'color-mix(in oklch, {base} {100-blend}%, {other})','highlight':PALETTE['highlight']}

def prepare(manager):
    with manager._lock:
        memory=manager.load()
        if memory['_meta'].get('category_registry_version')==VERSION:return manager.stats(memory)
        for path in (manager.memory_path,manager.transcript_path,manager.forgotten_path):manager._backup(path,'before_category_registry')
        registry(memory);memory['_meta']['category_registry_version']=VERSION
        memory['_meta']['memory_palette']={'version':3,'bases':PALETTE,'mix_space':'oklch'}
        manager._commit(memory);return manager.stats(memory)

def execute(manager,action,category_id='',label='',parent_id=None,aliases=None,policy_template='',description='',color_family='',merge_id='',expected_revision=None,profile_id='',project_id='',source_refs=None,evidence='',operation_id='',offset=0,limit=50):
    from .shared_memory import stable,normal,safe,now,canonical
    with manager._lock:
        memory=manager.load();rows=registry(memory)
        if action=='list':
            visible=catalog(memory,profile_id,project_id,True);ordered=sorted(visible.values(),key=lambda r:(r.get('parent_id') or '',normal(r['label']),r['id']))
            return {'status':'ok','categories':[{**r,'palette':palette(r)} for r in ordered[max(0,int(offset)):max(0,int(offset))+min(100,max(1,int(limit)))]],'total':len(ordered),'revision':memory['_meta'].get('last_updated','')}
        if action=='resolve':
            row=resolve(memory,category_id or label,profile_id,project_id,True)
            return {'status':'ok','category':copy.deepcopy(row)} if row else {'status':'not_found'}
        if action not in {'create','update','merge','retire','restore'}:return {'status':'rejected','reason':'invalid_category_action'}
        if manager.privacy_settings().get('private_session') or manager.privacy_settings().get('retain_memories') is False:return {'status':'private','reason':'memory_retention_disabled'}
        signature=stable(action,category_id,label,parent_id,aliases,policy_template,description,color_family,merge_id,profile_id,project_id,source_refs,evidence)
        operations=memory['_meta'].setdefault('category_operations',{})
        op=stable(profile_id,project_id,operation_id) if operation_id else ''
        if op in operations:
            previous=operations[op]
            return {**previous['result'],'status':'duplicate'} if previous['signature']==signature else {'status':'rejected','reason':'operation_id_reused'}
        if source_refs is not None and (not isinstance(source_refs,list) or len(source_refs)>100):return {'status':'rejected','reason':'invalid_source_references'}
        refs=[]
        for ref in source_refs or []:
            if not isinstance(ref,dict):return {'status':'rejected','reason':'invalid_source_reference'}
            rid=ref.get('record_id');record=memory['records'].get(rid)
            if not record or not matches_scope(record,profile_id,project_id):return {'status':'rejected','reason':'inaccessible_source'}
            from .category_policy import lifecycle
            if record.get('private') or record.get('private_session') or record.get('attributes',{}).get('private_session') or record.get('consent') in {'denied','revoked','private','none'}:return {'status':'rejected','reason':'private_source'}
            if lifecycle(record,memory['_meta']) not in {'active','history'}:return {'status':'rejected','reason':'inactive_source'}
            refs.append({'record_id':rid,'revision':record.get('revision',1)})
        if action=='create':
            label=str(label).strip()
            if not label or len(label)>128 or safe(label)!=label:return {'status':'rejected','reason':'invalid_category_label'}
            if not refs and not str(evidence).strip():return {'status':'rejected','reason':'category_source_required'}
            parent=resolve(memory,parent_id,profile_id,project_id) if parent_id else None
            if parent_id and not parent:return {'status':'rejected','reason':'inaccessible_parent'}
            template=parent['policy_template'] if parent else policy_template or 'meta_memory'
            if policy_template and parent and policy_template!=template:return {'status':'rejected','reason':'policy_cannot_be_relaxed'}
            if template not in POLICIES:return {'status':'rejected','reason':'invalid_policy_template'}
            cid='category_'+stable(profile_id,project_id,parent['id'] if parent else '',normal(label))
            if cid in rows:
                existing=rows[cid]
                if existing['state']!='active':return {'status':'rejected','reason':'explicit_category_restore_required'}
                extra=[r for r in refs if r not in existing.get('provenance',[])]
                if extra:
                    existing['history'].append({k:copy.deepcopy(v) for k,v in existing.items() if k!='history'});existing.setdefault('provenance',[]).extend(extra);existing['member_ids']=sorted(set(existing.get('member_ids',[]))|{r['record_id'] for r in extra});existing['revision']+=1;existing['updated']=now();manager._commit(memory)
                return {'status':'duplicate','category':copy.deepcopy(existing),'id':cid}
            row={'id':cid,'label':label,'description':safe(description[:500]),'parent_id':parent['id'] if parent else None,'aliases':[],'policy_template':template,'profile_id':profile_id,'project_id':project_id,'state':'active','revision':1,'builtin':False,'created':now(),'updated':now(),'history':[],'member_ids':[r['record_id'] for r in refs],'provenance':refs or [{'kind':'user_organization','evidence':safe(evidence[:1000])}],'color_family':color_family or (parent['color_family'] if parent else FAMILIES[int(stable(cid)[:4],16)%len(FAMILIES)])}
        else:
            row=rows.get(category_id)
            if not row or not matches_scope(row,profile_id,project_id):return {'status':'not_found'}
            if (profile_id or project_id) and (row.get('profile_id',''),row.get('project_id',''))!=(profile_id,project_id):return {'status':'rejected','reason':'cannot_modify_shared_family'}
            if expected_revision is not None and int(expected_revision)!=row['revision']:return {'status':'conflict','reason':'revision_conflict','revision':row['revision']}
            before=copy.deepcopy(row);row=copy.deepcopy(row)
            if action=='update':
                if row['state']!='active':return {'status':'rejected','reason':'restore_before_editing'}
                if label:
                    if len(label)>128 or safe(label)!=label:return {'status':'rejected','reason':'invalid_category_label'}
                    row['aliases']=list(dict.fromkeys(row['aliases']+[row['label']]));row['label']=label.strip()
                if parent_id is not None:
                    parent=resolve(memory,parent_id,profile_id,project_id) if parent_id else None
                    if parent_id and not parent:return {'status':'rejected','reason':'inaccessible_parent'}
                    cursor=parent;seen={row['id']}
                    while cursor:
                        if cursor['id'] in seen:return {'status':'rejected','reason':'category_cycle'}
                        seen.add(cursor['id']);cursor=rows.get(cursor.get('parent_id'))
                    if parent and parent['policy_template']!=row['policy_template']:return {'status':'rejected','reason':'incompatible_policy_template'}
                    row['parent_id']=parent['id'] if parent else None
                if policy_template and policy_template!=row['policy_template']:return {'status':'rejected','reason':'policy_cannot_be_relaxed'}
                if description:row['description']=safe(description[:500])
            elif action=='merge':
                target=resolve(memory,merge_id,profile_id,project_id)
                if not target or target['id']==row['id'] or row['builtin']:return {'status':'rejected','reason':'invalid_merge_target'}
                if target['policy_template']!=row['policy_template']:return {'status':'rejected','reason':'incompatible_policy_template'}
                if target['id'] in category_ids(memory,row['id'],profile_id,project_id,True):return {'status':'rejected','reason':'category_cycle'}
                row.update(state='merged',merged_into=target['id'])
            else:
                if row['builtin']:return {'status':'rejected','reason':'builtin_family_preserved'}
                row['state']='retired' if action=='retire' else 'active';row.pop('merged_into',None)
            if refs:
                row['member_ids']=sorted(set(row.get('member_ids',[]))|{r['record_id'] for r in refs});row['provenance']=row.get('provenance',[])+[r for r in refs if r not in row.get('provenance',[])]
            row['history'].append({k:v for k,v in before.items() if k!='history'});row['revision']+=1;row['updated']=now()
        if aliases is not None:
            if not isinstance(aliases,list) or len(aliases)>50 or any(not isinstance(a,str) or not a.strip() or len(a)>128 or safe(a)!=a for a in aliases):return {'status':'rejected','reason':'invalid_aliases'}
            row['aliases']=list(dict.fromkeys(row['aliases']+aliases))
        if color_family:row['color_family']=color_family
        if row['color_family'] not in COMPATIBLE_FAMILIES:return {'status':'rejected','reason':'invalid_color_family'}
        names={normal(row['label']),*(normal(a) for a in row['aliases'])}
        if any(other['id']!=row['id'] and other.get('state')=='active' and other.get('parent_id')==row['parent_id'] and (other.get('profile_id',''),other.get('project_id',''))==(profile_id,project_id) and names&{normal(other['label']),*(normal(a) for a in other.get('aliases',[]))} for other in rows.values()):return {'status':'conflict','reason':'category_name_collision'}
        rows[row['id']]=row;result={'status':'created' if action=='create' else 'merged' if action=='merge' else 'retired' if action=='retire' else 'restored' if action=='restore' else 'updated','id':row['id'],'category':copy.deepcopy(row)}
        if op:operations[op]={'signature':signature,'result':result}
        manager._commit(memory);return result
