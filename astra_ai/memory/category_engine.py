"""Category behavior shared by every memory adapter and AI path."""
import copy, hashlib, json, re
from datetime import datetime, timezone
from .category_policy import POLICY_VERSION, POLICIES, defaults, lifecycle, matches_scope, instant

class CategoryEngine:
    def category_catalog(self,profile_id="",project_id=""):
        with self._lock:
            m=self.load(); result=[]
            from .category_registry import catalog,policy as category_policy,palette,resolve
            rows=catalog(m,profile_id,project_id,True);counts_by_category={}
            redirects={cid:(resolve(m,cid,profile_id,project_id,True) or row)['id'] for cid,row in rows.items()}
            def count(record,state):
                if not matches_scope(record,profile_id,project_id):return
                cid=redirects.get(record.get('category'),record.get('category'))
                bucket=counts_by_category.setdefault(cid,{key:0 for key in ('active','expired','forgotten','pending','history','tentative','scheduled')})
                bucket[state]=bucket.get(state,0)+1
            for record in m['records'].values():count(record,lifecycle(record,m['_meta']))
            for record in m.get('forgotten_records',{}).values():count(record,'forgotten')
            for proposal in m.get('pending_approvals',{}).values():count(proposal.get('record',{}),'pending')
            for category,row in rows.items():
                policy=category_policy(m,category,profile_id,project_id) or POLICIES[row['policy_template']]
                counts=counts_by_category.get(category,{key:0 for key in ('active','expired','forgotten','pending','history','tentative','scheduled')})
                result.append({**policy.public(),**row,'palette':palette(row),'counts':counts})
            return {'status':'ok','categories':result,'policy_version':POLICY_VERSION,'revision':m['_meta'].get('last_updated','')}

    def list_records(self, limit=20, offset=0, **filters):
        from .shared_memory import ALIASES, canonical
        limit=max(1,min(int(limit),100));offset=max(0,int(offset))
        with self._lock:
            m=self.load();wanted=filters.get('lifecycle')
            from .category_registry import category_ids
            selected_categories=category_ids(m,ALIASES.get(filters.get('category'),filters.get('category')),filters.get('profile_id',''),filters.get('project_id',''),filters.get('descendants',False)) if filters.get('category') else None
            records=list(m.get('forgotten_records',{}).values()) if wanted=='forgotten' else list(m['records'].values())
            result=[]
            for r in records:
                state=lifecycle(r,m['_meta'])
                if wanted and wanted!='all' and state!=wanted:continue
                if selected_categories is not None and r.get('category') not in selected_categories:continue
                if any(filters.get(k) and r.get(k)!=filters[k] for k in ('kind','event_type','source','session_id','profile_id','project_id','scope')):continue
                if filters.get('query') and not all(w in canonical(r).casefold() for w in str(filters['query']).casefold().split()):continue
                try:
                    when=instant(r.get('updated'))
                    if filters.get('since') and (not when or when<instant(filters['since'])):continue
                    if filters.get('until') and (not when or when>instant(filters['until'])):continue
                except ValueError:raise ValueError('Invalid date filter')
                result.append({**r,'effective_lifecycle':state})
            result.sort(key=lambda r:r.get('updated',''),reverse=True)
            return {'status':'ok','matches':result[offset:offset+limit],'total':len(result),'offset':offset,'limit':limit}

    def prepare_category_engine(self,dry_run=True):
        from .shared_memory import stable
        with self._lock:
            m=self.load();report={'records':len(m['records']),'forgotten':len(m.get('forgotten_records',{})), 'links':len(m.get('relationships_v3',{})), 'policy_version':POLICY_VERSION}
            if dry_run:return {'status':'preview',**report}
            if m['_meta'].get('category_policy_version')==POLICY_VERSION:return {'status':'ready',**report}
            for p in (self.memory_path,self.transcript_path,self.forgotten_path):self._backup(p,'pre_category_engine')
            for r in list(m['records'].values())+list(m.get('forgotten_records',{}).values()):
                # Existing runtime claims cannot be promoted to verified current information.
                if r.get('category')=='system_awareness':r.setdefault('lifecycle','expired')
                defaults(r)
                if r.get('inferred'):
                    valid=[v for v in r.get('evidence_refs',[]) if m['_meta'].get('completed_turns',{}).get(stable(v.get('session_id'),v.get('turn_id')))]
                    r['pattern_active']=len(valid)>=3 and len({v['session_id'] for v in valid})>=2
            for item in m.get('learning',{}).values():
                if item.get('type') in {'new_pattern','context_learning'}:
                    refs=item.get('evidence_refs',[]);valid=[r for r in refs if m['_meta'].get('completed_turns',{}).get(stable(r.get('session_id'),r.get('turn_id')))]
                    item['previous_active']=item.get('active',False);item['active']=len(valid)>=3 and len({r['session_id'] for r in valid})>=2
            m['_meta']['category_policy_version']=POLICY_VERSION
            m['_meta']['category_migration']=report
            self._commit(m)
            return {'status':'ready',**report}

    def privacy_settings(self):
        from .shared_memory import read
        signature=self._signature()
        cached=getattr(self,'_privacy_cache',None)
        if cached and cached[0]==signature:return cached[1].copy()
        settings=read(self.transcript_path,{}).get('privacy_settings',{}).copy()
        m=self.read_snapshot()
        for r in sorted(m['records'].values(),key=lambda r:r.get('updated','')):
            if r.get('category')!='data_privacy' or lifecycle(r,m['_meta'])!='active':continue
            key=r.get('key');value=r.get('value')
            if key in {'retain_memories','retain_conversations','private_session'} and isinstance(value,bool):settings[key]=value
        self._privacy_cache=(signature,settings.copy())
        return settings
    def end_session(self,session_id):
        from .shared_memory import now
        if not session_id:return {'status':'rejected','reason':'session_id_required'}
        with self._lock:
            m=self.load();m['_meta'].setdefault('closed_sessions',{})[session_id]=now();self._commit(m)
            return {'status':'saved','session_id':session_id}

    def context_records(self,query='',profile_id='',project_id='',session_id='',scope=None):
        m=self.read_snapshot();records=m['records']
        dormant=m['_meta'].get('recall_dormancy',{})
        eligible={rid:r for rid,r in records.items() if dormant.get(rid,{}).get('state')!='dormant' and lifecycle(r,m['_meta'])=='active' and matches_scope(r,profile_id,project_id,scope) and (r.get('category_policy',r.get('category'))!='current_state' or not r.get('session_id') or r.get('session_id')==session_id)}
        priorities={'user_instructions':0,'communication_boundaries':0,'contextual_rules':0,'personal_preferences':1,'response_adaptation':1,'user_identity':1,'data_privacy':1,'task_project_tracking':2,'current_state':2}
        hits=set()
        if query:
            hits={r['id'] for r in self._keyword_recall(query,20,profile_id=profile_id,project_id=project_id,scope=scope)['matches'] if r['id'] in eligible}
        linked=set()
        for link in m.get('relationships_v3',{}).values():
            if link.get('evidence') and (link['from'] in hits or link['to'] in hits):linked.update({link['from'],link['to']}&eligible.keys())
        graph=m.get('entity_graph',{});entities=graph.get('entities',{})
        for link in graph.get('connections',{}).values():
            if link.get('state')!='active' or not link.get('evidence_refs'):continue
            a=entities.get(link['from'],{});b=entities.get(link['to'],{})
            if a.get('state')!='active' or b.get('state')!='active':continue
            left=set(a.get('member_ids',[]))&eligible.keys();right=set(b.get('member_ids',[]))&eligible.keys()
            if left&hits:linked.update(sorted(right)[:10])
            if right&hits:linked.update(sorted(left)[:10])
            if len(linked)>=40:break
        chosen=[r for rid,r in eligible.items() if (not r.get('attributes',{}).get('external_knowledge') or rid in hits or rid in linked) and (not query or rid in hits or rid in linked or r.get('category_policy',r['category']) in priorities)]
        # Relevant events must not be crowded out by a large unrelated profile.
        rules={'user_instructions','communication_boundaries','contextual_rules'}
        def role(r):return 'rule' if r.get('category_policy',r['category']) in rules else 'relevant' if r['id'] in hits or r['id'] in linked else 'base'
        learned={item['record_id'] for item in m.get('learning',{}).values() if item.get('active')}
        chosen.sort(key=lambda r:r.get('updated',''),reverse=True)
        chosen.sort(key=lambda r:({'rule':0,'relevant':1,'base':2}[role(r)],r['id'] not in hits,priorities.get(r.get('category_policy',r['category']),3),r['id'] not in learned,-len(r.get('evidence_refs',[]))))
        return [{**r,'_context_role':role(r)} for r in chosen[:100]]

    def commit_proposals(self,proposals,*,evidence,session_id='',turn_id='',source='legacy',profile_id='',project_id='',operation_id=''):
        if not isinstance(proposals,list) or len(proposals)>27:return {'status':'rejected','reason':'invalid_proposals'}
        results=[]
        for i,p in enumerate(proposals):
            if not isinstance(p,dict):results.append({'status':'rejected','reason':'invalid_proposal'});continue
            metadata={k:p[k] for k in ('valid_from','valid_until','explicit_preference','inferred','evidence_refs','confidence') if k in p}
            metadata.update(evidence=evidence,require_evidence=True,session_id=session_id,turn_id=turn_id,source=source,profile_id=profile_id,project_id=project_id,operation_id=f'{operation_id or turn_id}:proposal:{i}' if operation_id or turn_id else '')
            try:
                results.append(self.propose(p.get('kind','fact'),p.get('category',''),p.get('key',''),p.get('value',''),**metadata,**({'event_type':p.get('event_type','custom_memory'),'attributes':p.get('attributes',{})} if p.get('kind')=='event' else {})))
            except (OSError,ValueError):results.append({'status':'failed','reason':'memory_storage_unavailable'})
        return {'status':'ok','results':results}

    def observe_completed_turn(self,user_text,session_id,turn_id):
        from .shared_memory import stable, now
        meta={'source':'application','capture_source':'verified_application_event','session_id':session_id,'turn_id':turn_id,'scope':'session:'+session_id,'correction':True,'evidence':'Completed conversation turn '+turn_id}
        m=self.load();rid=stable('fact','conversation_analytics','session_activity','session:'+session_id)
        old=m['records'].get(rid,{}).get('value',{})
        self.save_fact('conversation_analytics','session_activity',{'completed_turn_count':old.get('completed_turn_count',0)+1,'first_turn_at':old.get('first_turn_at',now()),'last_turn_at':now()},**meta)
        if re.match(r'(?i)^\s*(hello|hi|hey|hola|buenos días|buenas tardes)\b',str(user_text)):
            self.save_fact('greeting_patterns','session_greeting',{'last_greeting_at':now(),'turn_id':turn_id},**meta)

    def graph_snapshot(self,**filters):
        from .memory_graph import graph_snapshot
        return graph_snapshot(self,**filters)

    def graph_session_details(self,session_id,**filters):
        from .memory_graph import session_details
        return session_details(self,session_id,**filters)

    def notification_snapshot(self):
        m=self.load()
        result={rid:{'record_id':rid,'category':r['category'],'revision':r.get('revision',1),'lifecycle':lifecycle(r,m['_meta'])} for rid,r in {**m['records'],**m.get('forgotten_records',{})}.items()}
        for pid,p in m.get('pending_approvals',{}).items():
            result['pending:'+pid]={'record_id':p.get('record',{}).get('id',''),'category':p.get('record',{}).get('category','meta_memory'),'revision':0,'lifecycle':'pending'}
        for section in ('entities','connections','suggestions'):
            for eid,e in m.get('entity_graph',{}).get(section,{}).items():
                result['graph:'+eid]={'record_id':eid,'category':e.get('category','meta_memory'),'revision':e.get('revision',1),'lifecycle':e.get('state','active'),'graph_version':2,'family':section}
        result['transcripts']={'record_id':'','category':'session_themes','revision':hashlib.sha256(repr(self._signature()).encode()).hexdigest()[:20],'lifecycle':'history'}
        return result
