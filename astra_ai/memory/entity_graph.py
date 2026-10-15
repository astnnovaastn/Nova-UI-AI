"""Evidence-backed graph projection. JSON is authoritative; geometry is not meaning."""
import copy, json, re
from datetime import datetime
from zoneinfo import ZoneInfo
from .shared_memory import stable, normal, now, safe, canonical
from .category_policy import lifecycle, matches_scope
from .memory_graph import _conversations

VERSION = 'entity-graph-1'
ENTITY_TYPES = {'person','organization','project','concept'}

def migrate(manager):
    with manager._lock:
        m=manager.load()
        if m['_meta'].get('entity_graph_version')==VERSION and all(k in m.get('entity_graph',{}) for k in ('observations','patterns')):return
        for path in (manager.memory_path,manager.transcript_path,manager.forgotten_path,manager.memory_path.parent.parent/'ui'/'backend'/'memory_presentation.json'):manager._backup(path,'before_entity_graph')
        m.setdefault('entity_graph',{'entities':{},'connections':{},'suggestions':{},'processed':{}})
        m['entity_graph'].setdefault('observations',{});m['entity_graph'].setdefault('patterns',{})
        m['_meta']['entity_graph_version']=VERSION
        manager._commit(m)

def active_entities(m, profile_id='', project_id=''):
    active={rid for rid,r in m['records'].items() if lifecycle(r,m['_meta'])=='active' and matches_scope(r,profile_id,project_id)}
    return {eid:{**e,'member_ids':[r for r in e.get('member_ids',[]) if r in active]} for eid,e in m.get('entity_graph',{}).get('entities',{}).items() if e.get('state')=='active' and matches_scope(e,profile_id,project_id) and any(r in active for r in e.get('member_ids',[]))}

def local_organize(manager):
    """Existing accepted records can form source groups without another model call."""
    migrate(manager)
    with manager._lock:
        m=manager.load();g=m['entity_graph'];changed=False;covered={rid for e in g['entities'].values() for rid in e.get('member_ids',[])}
        for r in m['records'].values():
            if lifecycle(r,m['_meta'])!='active':continue
            typ='project' if r['category']=='task_project_tracking' else 'person' if r['category']=='user_identity' and r['key']=='name' else 'concept'
            label=str(r['value'])[:80] if typ=='person' else r['key'].replace('_',' ')
            identity=stable('entity',typ,normal(label),r.get('profile_id',''),r.get('project_id',''),r['id'])
            if r['id'] in covered:
                for e in g['entities'].values():
                    if e.get('member_ids')==[r['id']] and any(ref.get('record_id')==r['id'] for ref in e.get('evidence_refs',[])) and e.get('label')!=safe(label):
                        e.setdefault('history',[]).append({k:copy.deepcopy(v) for k,v in e.items() if k!='history'});e['label']=safe(label);e['revision']+=1;e['updated']=now();changed=True
                continue
            if identity in g['entities']:continue
            g['entities'][identity]={'id':identity,'kind':'entity','entity_type':typ,'label':safe(label),'category':r['category'],'member_ids':[r['id']],'aliases':[],'profile_id':r.get('profile_id',''),'project_id':r.get('project_id',''),'state':'active','revision':1,'created':r['created'],'updated':now(),'evidence_refs':[{'record_id':r['id'],'revision':r['revision']}],'history':[]}
            changed=True
        if changed:manager._commit(m)
        return {'status':'updated' if changed else 'duplicate'}

def apply_proposals(manager, proposals, sources, operation_id):
    """Only quoted USER evidence and existing accessible records can support proposals."""
    if not isinstance(proposals,dict):return {'status':'rejected','reason':'invalid_proposals'}
    migrate(manager)
    with manager._lock:
        m=manager.load();g=m['entity_graph']
        if operation_id in g['processed']:return {'status':'duplicate'}
        accessible={r['id']:r for r in m['records'].values() if lifecycle(r,m['_meta'])=='active'}
        messages={s['id']:s for s in sources if s.get('role')=='user' and not s.get('private')}
        def evidence(p,profile,project):
            refs=[]
            for ref in p.get('evidence',[])[:30]:
                s=messages.get(ref.get('message_id'));quote=ref.get('quote','')
                if s and isinstance(quote,str) and len(quote.strip())>=4 and normal(quote) in normal(s.get('content','')) and matches_scope(s,profile,project):refs.append({'message_id':s['id'],'turn_id':s.get('turn_id',''),'session_id':s.get('session_id',''),'quote':safe(quote[:800])})
            return refs
        mapping={};saved=0;pending=0
        for p in proposals.get('entities',[])[:80]:
            if not isinstance(p,dict):continue
            members=[accessible[r] for r in p.get('member_ids',[]) if r in accessible]
            if not members:continue
            profile=members[0].get('profile_id','');project=members[0].get('project_id','')
            if any(not matches_scope(r,profile,project) for r in members):continue
            refs=evidence(p,profile,project);label=str(p.get('label','')).strip()[:80];typ=p.get('entity_type')
            if not refs or not label or safe(label)!=label or typ not in ENTITY_TYPES:continue
            # Evidence must name the entity. Prevent invented labels becoming user facts.
            if not any(normal(label) in normal(ref['quote']) for ref in refs):continue
            scope=stable(profile,project);eid=stable('entity',typ,normal(label),scope,*sorted(r['id'] for r in members))
            existing_matches=[e for e in g['entities'].values() if e.get('entity_type')==typ and normal(e.get('label',''))==normal(label) and (e.get('profile_id',''),e.get('project_id',''))==(profile,project) and set(e.get('member_ids',[]))&{r['id'] for r in members}]
            if len(existing_matches)==1:eid=existing_matches[0]['id']
            existing=g['entities'].get(eid)
            if existing and existing.get('state')!='active':continue
            if not existing:
                existing={'id':eid,'kind':'entity','label':label,'entity_type':typ,'category':members[0]['category'],'member_ids':[],'aliases':[],'evidence_refs':[],'revision':0,'history':[],'state':'active','created':now(),'profile_id':profile,'project_id':project};g['entities'][eid]=existing
            before=copy.deepcopy(existing)
            existing['member_ids']=sorted(set(existing['member_ids'])|{r['id'] for r in members})
            aliases=[a for a in p.get('aliases',[]) if isinstance(a,str) and len(a)<=80 and safe(a)==a and any(normal(a) in normal(ref['quote']) for ref in refs)]
            existing['aliases']=sorted(set(existing['aliases'])|set(aliases))
            for ref in refs:
                if ref not in existing['evidence_refs']:existing['evidence_refs'].append(ref)
            if existing!=before:existing['history'].append({k:v for k,v in before.items() if k!='history'});existing['revision']+=1;existing['updated']=now();saved+=1
            mapping[p.get('id',label)]=eid
        for p in proposals.get('relationships',[])[:100]:
            if not isinstance(p,dict):continue
            a=mapping.get(p.get('from'),p.get('from'));b=mapping.get(p.get('to'),p.get('to'));left=g['entities'].get(a);right=g['entities'].get(b)
            if not left or not right or a==b or (left.get('profile_id',''),left.get('project_id',''))!=(right.get('profile_id',''),right.get('project_id','')):continue
            refs=evidence(p,left.get('profile_id',''),left.get('project_id',''));typ=p.get('type','related_to')
            if left.get('state')!='active' or right.get('state')!='active':continue
            if typ not in {'related_to','supports','enables','conflicts','caused_by','implies'} or not refs:continue
            lid=stable('entity-link',a,b,typ)
            supported=any(re.search(re.escape(normal(left['label']))+r'.{0,100}\b(?:works? with|belongs? to|part of|collaborates? with|connected to|related to|uses?|includes?|manages?)\b.{0,100}'+re.escape(normal(right['label'])),normal(ref['quote'])) for ref in refs)
            # Conservative direct associations. Stronger logical claims require review.
            verbs={'supports':r'\bsupports?\b','enables':r'\benables?\b','conflicts':r'\bconflicts? with\b','caused_by':r'\b(?:is |was )?caused by\b','implies':r'\bimplies?\b'}
            if typ in verbs:supported=any(re.search(re.escape(normal(left['label']))+r'.{0,40}'+verbs[typ]+r'.{0,40}'+re.escape(normal(right['label'])),normal(ref['quote'])) for ref in refs)
            uncertain=any(re.search(r"\b(?:not|never|maybe|might|perhaps|fictional|imagine|suppose|someone said|article says|they said|he said|she said)\b",normal(messages.get(ref['message_id'],{}).get('content',''))) for ref in refs)
            target=g['connections'] if supported and not uncertain else g['suggestions']
            link={'id':lid,'from':a,'to':b,'type':typ,'family':'entity','evidence_refs':refs,'revision':1,'state':'active' if target is g['connections'] else 'pending','updated':now()}
            if lid not in target:target[lid]=link;saved+=target is g['connections'];pending+=target is g['suggestions']
            else:
                old=target[lid]
                additions=[r for r in refs if r not in old['evidence_refs']]
                if additions:old.setdefault('history',[]).append({'revision':old['revision'],'evidence_refs':copy.deepcopy(old['evidence_refs'])});old['evidence_refs'].extend(additions);old['revision']+=1;old['updated']=now()
        for section in ('observations','topics','patterns'):
            for p in proposals.get(section,[])[:40]:
                if not isinstance(p,dict):continue
                member_ids=p.get('member_ids',[p.get('record_id')]);members=[accessible[r] for r in member_ids if r in accessible]
                if not members:continue
                profile=members[0].get('profile_id','');project=members[0].get('project_id','')
                if any((r.get('profile_id',''),r.get('project_id',''))!=(profile,project) for r in members):continue
                refs=evidence(p,profile,project);label=str(p.get('label','')).strip()[:80]
                if not refs or not label or safe(label)!=label or not any(normal(label) in normal(r['quote']) for r in refs):continue
                identity=stable(section,normal(label),profile,project,*sorted(r['id'] for r in members));target=m.setdefault('topic_groups',{}) if section=='topics' else g[section]
                if section=='topics':
                    existing=next((t for t in target.values() if normal(t.get('label',''))==normal(label) and (t.get('profile_id',''),t.get('project_id',''))==(profile,project) and t.get('state')=='active'),None)
                    if existing:identity=existing['id'];members=list({r['id']:r for r in [*members,*[accessible[rid] for rid in existing.get('member_ids',[]) if rid in accessible]]}.values())
                old=target.get(identity)
                if old and old.get('state')=='forgotten':continue
                merged=list(old.get('evidence_refs',[])) if old else []
                for ref in refs:
                    if ref not in merged:merged.append(ref)
                completed=_conversations(manager,m,profile,project) if section=='patterns' else {}
                valid=[r for r in merged if (r.get('session_id'),r.get('turn_id')) in completed]
                repeated=len({(r.get('session_id'),r.get('turn_id')) for r in valid})>=3 and len({r.get('session_id') for r in valid})>=2
                state='active' if section!='patterns' or repeated else 'pending'
                if old and old['evidence_refs']==merged:continue
                item={'id':identity,'kind':'topic' if section=='topics' else 'observation' if section=='observations' else 'pattern','label':label,'category':members[0]['category'],'member_ids':sorted(r['id'] for r in members),'record_id':members[0]['id'],'profile_id':profile,'project_id':project,'evidence_refs':merged,'state':state,'revision':old.get('revision',0)+1 if old else 1,'created':old.get('created',now()) if old else now(),'updated':now(),'history':list(old.get('history',[]))+[{k:v for k,v in old.items() if k!='history'}] if old else []}
                target[identity]=item;saved+=state=='active';pending+=state=='pending'
        for proposed in proposals.get('memberships',[])[:20]:
            from .category_registry import resolve
            members=[accessible[rid] for rid in proposed.get('member_ids',[]) if rid in accessible]
            if not members:continue
            profile=members[0].get('profile_id','');project=members[0].get('project_id','')
            if any((r.get('profile_id',''),r.get('project_id',''))!=(profile,project) for r in members):continue
            category=resolve(m,proposed.get('category_id',''),profile,project)
            if not category or not evidence(proposed,profile,project):continue
            result=manager.category_action('update',category_id=category['id'],expected_revision=category['revision'],source_refs=[{'record_id':r['id']} for r in members],profile_id=profile,project_id=project,operation_id=operation_id+':membership:'+category['id'])
            saved+=result.get('status')=='updated'
        for proposed in proposals.get('categories',[])[:10]:
            if not isinstance(proposed,dict):continue
            members=[accessible[r] for r in proposed.get('member_ids',[]) if r in accessible]
            if not members:continue
            profile=members[0].get('profile_id','');project=members[0].get('project_id','')
            if any(not matches_scope(r,profile,project) for r in members):continue
            refs=evidence(proposed,profile,project);label=str(proposed.get('label','')).strip()
            if not refs or not any(normal(label) in normal(r['quote']) for r in refs):continue
            result=manager.category_action('create',label=label,parent_id=proposed.get('parent_id') or None,policy_template=proposed.get('policy_template') or 'meta_memory',profile_id=profile,project_id=project,source_refs=[{'record_id':r['id']} for r in members],evidence='Supported user passages',operation_id=operation_id+':category:'+stable(label))
            if result.get('status') in {'created','duplicate'}:saved+=result.get('status')=='created'
        # Category operations commit through the same lock. Retain their registry/ledger
        # when the entity proposal batch commits its independent graph changes.
        latest=manager.load();m['category_registry']=latest.get('category_registry',{});m['_meta']['category_operations']=latest['_meta'].get('category_operations',{})
        g['processed'][operation_id]={'timestamp':now(),'saved':saved,'pending':pending}
        manager._commit(m)
        return {'status':'saved','saved':saved,'pending':pending}

def balanced_order(nodes):
    """Keep navigable hubs, then round-robin dates and memory categories."""
    mapping={n['id']:n for n in nodes};hubs=[];buckets={}
    for n in sorted(nodes,key=lambda n:n['id']):
        if n['kind'] in {'anchor','topic'}:hubs.append(n);continue
        group=n.get('category','other')
        if n['kind'] in {'day','session','turn'}:
            parent=mapping.get(n.get('parent_id'),{});day=n['id'] if n['kind']=='day' else n.get('parent_id','undated') if n['kind']=='session' else parent.get('parent_id','undated');group='date:'+day
        buckets.setdefault(group,[]).append(n)
    order=sorted(hubs,key=lambda n:({'anchor':0,'topic':1,'day':2,'entity':3,'session':4}.get(n['kind'],5),n['id']))
    for values in buckets.values():values.sort(key=lambda n:({'day':0,'entity':0,'session':1,'turn':2}.get(n['kind'],3),n['id']))
    groups=sorted(buckets)
    for i in range(max((len(v) for v in buckets.values()),default=0)):
        order.extend(buckets[k][i] for k in groups if i<len(buckets[k]))
    return order

def snapshot(manager, *, profile_id='',project_id='',category='',focus='',level='overview',timezone_name='Europe/Madrid',limit=500,offset=0,revision='',sample='',node_ids=None):
    with manager._lock:
        m=manager.load();entities=active_entities(m,profile_id,project_id);nodes=list(entities.values());edges=[]
        records={rid:r for rid,r in m['records'].items() if (lifecycle(r,m['_meta'])=='active' or r.get('event_type')=='historical_trace' and lifecycle(r,m['_meta'])=='history') and matches_scope(r,profile_id,project_id)}
        for link in m.get('entity_graph',{}).get('connections',{}).values():
            if link.get('state')=='active' and link['from'] in entities and link['to'] in entities:edges.append(link)
        for t in m.get('topic_groups',{}).values():
            members=[r for r in t.get('member_ids',[]) if r in records]
            if t.get('state')=='active' and members and matches_scope(t,profile_id,project_id):nodes.append({**t,'kind':'topic','member_ids':members,'count':len(members)})
        pairs=_conversations(manager,m,profile_id,project_id)
        try:zone=ZoneInfo(timezone_name)
        except Exception:zone=ZoneInfo('UTC')
        days={};sessions={};turns={}
        for (sid,tid),pair in pairs.items():
            stamp=pair['user'].get('timestamp','')
            try:day=datetime.fromisoformat(stamp.replace('Z','+00:00')).astimezone(zone).date().isoformat()
            except (ValueError,TypeError):day='Undated'
            did='day:'+day;seid=stable('graph-session',sid);turnid=stable('graph-turn',sid,tid)
            days.setdefault(did,{'id':did,'kind':'day','label':day,'category':'session_themes','parent_id':'anchor:conversations','created':stamp,'count':0,'revision':1});days[did]['count']+=1
            sessions.setdefault(seid,{'id':seid,'kind':'session','label':'Conversation · '+day,'category':'session_themes','session_id':sid,'parent_id':did,'created':stamp,'count':0,'revision':1});sessions[seid]['count']+=1
            turns[turnid]={'id':turnid,'kind':'turn','label':safe(pair['user']['content'][:70]),'category':'session_themes','session_id':sid,'turn_id':tid,'message_ids':[pair['user']['id'],pair['assistant']['id']],'created':stamp,'revision':1,'parent_id':seid}
            for a,b in [('anchor:conversations',did),(did,seid),(seid,turnid)]:edges.append({'id':stable('route',a,b),'from':a,'to':b,'family':'memory','type':'conversation_route','visual_only':True,'revision':1})
        families={}
        for e in entities.values():
            fid='family:'+e['category'];family=families.setdefault(fid,{'id':fid,'kind':'topic','label':e['category'].replace('_',' '),'category':e['category'],'count':0,'member_ids':[],'revision':1})
            family['count']+=1;family['member_ids'].extend(e['member_ids']);e['parent_id']=fid
            edges.append({'id':stable('family-route',fid,e['id']),'from':fid,'to':e['id'],'family':'memory','type':'category_membership','visual_only':True,'revision':1})
        for rid,r in records.items():
            if r.get('event_type')!='historical_trace':continue
            fid='family:'+r['category'];family=families.setdefault(fid,{'id':fid,'kind':'topic','label':r['category'].replace('_',' '),'category':r['category'],'count':0,'member_ids':[],'revision':1})
            family['count']+=1;family['member_ids'].append(rid)
        nodes.extend(families.values())
        nodes.append({'id':'anchor:conversations','kind':'anchor','category':'conversations','label':'Conversations','count':len(pairs),'revision':1})
        nodes.extend(days.values())
        if level!='overview' or focus:
            nodes.extend(sessions.values());nodes.extend(turns.values())
            for section in ('observations','patterns'):
                for item in m.get('entity_graph',{}).get(section,{}).values():
                    if item.get('state')=='active' and matches_scope(item,profile_id,project_id) and any(r in records for r in item.get('member_ids',[])):
                        nodes.append(item)
                        for rid in item.get('member_ids',[]):
                            if rid in records:edges.append({'id':stable('derived',item['id'],rid),'from':item['id'],'to':rid,'family':'pattern' if section=='patterns' else 'memory','type':section,'visual_only':True,'revision':item['revision']})
            parents={rid:e['id'] for e in entities.values() for rid in e['member_ids']}
            nodes.extend({**r,'label':r['key'].replace('_',' '),'parent_id':parents.get(r['id'],'family:'+r['category'])} for r in records.values())
            for e in entities.values():
                for rid in e['member_ids']:edges.append({'id':stable('member',e['id'],rid),'from':e['id'],'to':rid,'family':'memory','type':'entity_observation','visual_only':True,'revision':1})
            for t in nodes:
                if t['kind']=='topic':
                    for rid in t.get('member_ids',[]):edges.append({'id':stable('topic',t['id'],rid),'from':t['id'],'to':rid,'family':'pattern','type':'topic_membership','visual_only':True,'revision':1})
                if t.get('session_id') and t['kind'] not in {'session','turn'}:edges.append({'id':stable('source',t['id']),'from':t['id'],'to':stable('graph-session',t['session_id']),'family':'memory','type':'source_session','visual_only':True,'revision':1})
            edges.extend({**l,'family':'pattern'} for l in m['relationships_v3'].values())
        ids={n['id'] for n in nodes};edges={e['id']:e for e in edges if e['from'] in ids and e['to'] in ids}
        rev=stable(manager._signature(),timezone_name,profile_id,project_id)
        if revision and revision!=rev:return {'status':'stale','revision':rev,'nodes':[],'edges':[]}
        if node_ids is not None:
            requested=set(node_ids);nodes=[n for n in nodes if n['id'] in requested]
        if focus:
            selected={focus};front={focus}
            for _ in range(2):
                nextids={e['to'] if e['from'] in front else e['from'] for e in edges.values() if e['from'] in front or e['to'] in front};selected|=nextids;front=nextids
            nodes=[n for n in nodes if n['id'] in selected]
        if category:nodes=[n for n in nodes if n.get('category')==category]
        if sample=='balanced':nodes=balanced_order(nodes)
        else:nodes.sort(key=lambda n:({'anchor':0,'day':1,'topic':2,'entity':3,'session':4,'turn':5}.get(n['kind'],6),n['id']))
        total=len(nodes);page=nodes if node_ids is not None else nodes[max(0,offset):max(0,offset)+min(1000,max(1,limit))];pageids={n['id'] for n in page}
        direct={}
        for n in nodes:
            if n.get('parent_id'):direct.setdefault(n['parent_id'],[]).append(n['id'])
        page=[{**n,'loaded_count':sum(i in pageids for i in direct.get(n['id'],[])),'unloaded_count':sum(i not in pageids for i in direct.get(n['id'],[]))} if n['id'] in direct else n for n in page]
        return {'status':'ok','version':2,'revision':rev,'nodes':page,'edges':[e for e in edges.values() if e['from'] in pageids and e['to'] in pageids],'total':total,'offset':offset,'limit':limit,'counts':{'entities':len(entities),'days':len(days),'sessions':len(sessions),'turns':len(pairs)}}



def manage(manager,action,target_id,profile_id='',project_id='',**options):
    """Reversible graph metadata management; user records remain authoritative."""
    migrate(manager)
    with manager._lock:
        m=manager.load();g=m['entity_graph'];section=next((v for v in ('entities','connections','suggestions') if target_id in g[v]),None)
        if not section:return {'status':'not_found'}
        record=g[section][target_id]
        def allowed(e):
            if e.get('kind')=='entity':return matches_scope(e,profile_id,project_id)
            return all(i in g['entities'] and matches_scope(g['entities'][i],profile_id,project_id) for i in (e.get('from'),e.get('to')))
        if not allowed(record):return {'status':'not_found'}
        if action=='get':return {'status':'ok','record':copy.deepcopy(record)}
        before=copy.deepcopy(record)
        if action in {'forget','restore','reject'}:record['state']='active' if action=='restore' and section!='suggestions' else 'pending' if action=='restore' else 'forgotten'
        elif action=='rename' and section=='entities':
            label=str(options.get('label','')).strip()
            if not label or len(label)>80 or safe(label)!=label:return {'status':'rejected','reason':'invalid_label'}
            record['label']=label
        elif action=='approve' and section=='suggestions':
            if record.get('state')!='pending':return {'status':'rejected','reason':'proposal_not_pending'}
            record['state']='active';record['reviewed_by']='user';g['connections'][target_id]=copy.deepcopy(record);record['state']='superseded'
        elif action=='merge' and section=='entities':
            other=g['entities'].get(options.get('into_id'))
            if not other or not allowed(other) or other.get('state')!='active' or other['id']==target_id:return {'status':'rejected','reason':'invalid_merge_target'}
            if (record.get('profile_id',''),record.get('project_id',''))!=(other.get('profile_id',''),other.get('project_id','')):return {'status':'rejected','reason':'scope_mismatch'}
            other.setdefault('history',[]).append({k:copy.deepcopy(v) for k,v in other.items() if k!='history'})
            other['member_ids']=sorted(set(other['member_ids'])|set(record['member_ids']));other['aliases']=sorted(set(other.get('aliases',[]))|set(record.get('aliases',[]))|{record['label']});other['revision']+=1;other['updated']=now()
            record['state']='superseded';record['merged_into']=other['id']
            # Retain old links as history; never manufacture semantic edges.
        else:return {'status':'rejected','reason':'unsupported_graph_action'}
        record.setdefault('history',[]).append({k:v for k,v in before.items() if k!='history'});record['revision']=record.get('revision',1)+1;record['updated']=now()
        manager._commit(m)
        return {'status':'saved','record':copy.deepcopy(record)}
