"""One scoped read surface over existing memory, task and learning services."""
import asyncio, copy, json, time
from fastapi import HTTPException, Request
from astra_ai.memory import library
from astra_ai.memory.shared_memory import canonical, stable, now, atomic
from astra_ai.memory.category_policy import matches_scope

class LibraryService:
    def __init__(self,memory,jobs,tasks,learning,capabilities,wake):
        self.memory=memory;self.jobs=jobs;self.tasks=tasks;self.learning=learning;self.capabilities=capabilities;self.wake=wake;self.explanations={}
    def _scope(self,row,c):return not c.get('guest') and (row.get('profile_id',''),row.get('project_id',''))==(c.get('profile_id',''),c.get('project_id',''))
    def approvals(self,c):
        items=library.memory_approvals(self.memory,c.get('profile_id',''),c.get('project_id',''))
        self.tasks._ensure()
        with self.tasks.connection() as db:
            rows=db.execute("SELECT a.*,t.metadata AS task_metadata FROM task_approvals a JOIN tasks t ON t.id=a.task_id WHERE a.owner_id=?",('local',)).fetchall()
        for raw in rows:
            r=dict(raw);meta=json.loads(r.pop('task_metadata') or '{}')
            if not self._scope(meta,c):continue
            r['details']=json.loads(r.get('details') or '{}')
            items.append({'id':'task:'+r['id'],'source':'task','source_id':r['id'],'title':r['action'],'state':'waiting' if r['status']=='pending' else r['status'],'created':r['created_at'],'decided':r['decided_at'],'version':stable(canonical(r)),'details':r})
        caps=self.capabilities()
        if caps:
            with caps.lock:data=caps.load()
            for section in ('tools','repairs'):
                for r in data[section].values():
                    if not self._scope(r,c) or r.get('risk') not in {'high','critical'}:continue
                    state='rejected' if r['state']=='rejected' else 'approved' if r.get('approved_hash') else 'waiting' if r['state']=='waiting_for_approval' else None
                    if state is None:continue
                    items.append({'id':'learning:'+r['id'],'source':'learning','source_id':r['id'],'title':r.get('name') or r.get('function') or 'Learned helper','state':state,'created':r.get('created'),'decided':r.get('approved_at') or r.get('rejected_at'),'version':r.get('new_hash') or r.get('hash'),'details':copy.deepcopy(r)})
        return items
    def work(self,c):
        result=[]
        with self.jobs.lock:jobs=self.jobs.load()['jobs']
        for r in jobs.values():
            if (r['context'].get('profile_id',''),r['context'].get('project_id',''))!=(c.get('profile_id',''),c.get('project_id','')) or r['context'].get('guest'):continue
            commands=[a['name'].replace('_',' ') for a in r['actions']]
            controls=['cancel'] if r['state'] not in {'completed','canceled','failed'} else ['retry'] if r['state']=='failed' else []
            controls+=['resume'] if r.get('paused') and r['state'] not in {'completed','failed','canceled'} else ['pause'] if r['state'] in {'running','queued','waiting_for_retry','waiting_for_ui'} else []
            result.append({'id':'job:'+r['id'],'source':'job','source_id':r['id'],'background':bool(r['context'].get('background')),'title':r.get('title') or ', '.join(commands[:3]),'state':'paused' if r.get('paused') and r['state'] not in {'completed','failed','canceled'} else r['state'],'created':r['created'],'updated':r['updated'],'version':str(r.get('sequence',0)),'controls':controls,'details':{k:copy.deepcopy(v) for k,v in r.items() if k!='context'}})
        self.tasks._ensure()
        with self.tasks.connection() as db:rows=db.execute("SELECT r.id,t.metadata FROM task_runs r JOIN tasks t ON t.id=r.task_id WHERE r.owner_id=?",('local',)).fetchall()
        for row in rows:
            if not self._scope(json.loads(row['metadata'] or '{}'),c):continue
            r=self.tasks.get_run('local',row['id']);state=r['status'];controls=['pause','cancel'] if state in {'queued','running'} else ['resume','cancel'] if state in {'paused','interrupted','waiting_input'} else ['retry'] if state=='failed' else []
            task=self.tasks.get_task('local',r['task_id'])
            result.append({'id':'run:'+r['id'],'source':'run','source_id':r['id'],'title':task['title'],'state':{'succeeded':'completed','cancelled':'canceled'}.get(state,state),'created':r['created_at'],'updated':r['updated_at'],'version':r['updated_at'],'controls':controls,'details':r})
        return result
    def listing(self,view,c,status='',query='',offset=0,limit=30):
        rows=self.approvals(c) if view=='approvals' else self.work(c)
        counts={s:sum(r['state']==s for r in rows) for s in {r['state'] for r in rows}}
        rows=[r for r in rows if (not status or status=='all' or r['state']==status) and (not query or query.casefold() in r['title'].casefold())]
        rows.sort(key=lambda r:(r.get('created') or '',r['id']),reverse=True);offset=max(0,int(offset));limit=max(1,min(100,int(limit)))
        return {'status':'ok','items':[{k:v for k,v in r.items() if k!='details'} for r in rows[offset:offset+limit]],'total':len(rows),'counts':counts,'offset':offset,'limit':limit}
    def detail(self,view,identifier,c,explain=True):
        item=next((r for r in (self.approvals(c) if view=='approvals' else self.work(c)) if r['id']==identifier),None)
        if not item:return {'status':'not_found'}
        if view=='approvals' and explain:
            self.explanations[(c['client_id'],identifier)]=(item['version'],time.time())
            while len(self.explanations)>1000:self.explanations.pop(next(iter(self.explanations)))
            if item['source']=='learning':
                caps=self.capabilities();r=item['details']
                if r.get('replacement'):
                    import difflib
                    item['preview']=''.join(difflib.unified_diff(caps._path(r['backup']).read_text(encoding='utf-8').splitlines(True),caps._path(r['replacement']).read_text(encoding='utf-8').splitlines(True)))[:32000]
                elif r.get('code'):item['preview']=caps._path(r['code']).read_text(encoding='utf-8')[:32000]
        return {'status':'ok','item':item}
    async def decision(self,identifier,payload,c,voice=False):
        explained=self.explanations.get((c['client_id'],identifier))
        result=await asyncio.to_thread(self.detail,'approvals',identifier,c,False)
        if result['status']!='ok':return result
        r=result['item'];approved=payload.get('decision')=='approved'
        if payload.get('decision') not in {'approved','rejected'}:return {'status':'rejected','reason':'invalid_decision'}
        if r['state']!='waiting' or payload.get('version')!=r['version']:return {'status':'conflict','reason':'approval_changed'}
        if voice:
            quote=str(payload.get('confirmation_quote','')).strip()
            if not explained or explained[0]!=r['version'] or time.time()-explained[1]>600 or not c.get('turn_id') or not quote or quote.casefold()!=str(c.get('user_text','')).strip().casefold():return {'status':'rejected','reason':'contextual_user_confirmation_required'}
        if r['source']=='memory':return await asyncio.to_thread(library.decide,self.memory,r['source_id'],approved,r['version'],c.get('profile_id',''),c.get('project_id',''))
        if r['source']=='task':
            result=await asyncio.to_thread(self.tasks.decide_approval,'local',r['source_id'],'approved' if approved else 'rejected',str(payload.get('note',''))[:1000]);self.wake();return {'status':'approved' if approved else 'rejected','item':result}
        caps=self.capabilities()
        if not approved:
            def reject():
                with caps.lock:
                    data=caps.load();item=data['tools'].get(r['source_id']) or data['repairs'].get(r['source_id'])
                    if not item or (item.get('new_hash') or item.get('hash'))!=r['version']:return {'status':'conflict'}
                    item.update(state='rejected',rejected_at=now());data['audit'].append({'id':item['id'],'event':'human_rejected','hash':r['version'],'at':now()});atomic(caps.path,data)
                return {'status':'rejected'}
            return await asyncio.to_thread(reject)
        result=await asyncio.to_thread(caps.approve,r['source_id'],r['version'],c)
        if result['status']=='approved':result['activation']=await (caps.apply_repair(r['source_id'],c) if 'target' in r['details'] else caps.validate(r['source_id'],c))
        return result
    async def control(self,identifier,command,c):
        found=await asyncio.to_thread(self.detail,'tasks',identifier,c)
        if found['status']!='ok':return found
        item=found['item']
        if command not in item['controls']:return {'status':'rejected','reason':'unsupported_state_transition'}
        if item['source']=='job':
            if command in {'pause','resume'}:return await asyncio.to_thread(self.jobs.control_job,item['source_id'],command=='pause')
            return await asyncio.to_thread(self.jobs.cancel if command=='cancel' else self.jobs.retry,item['source_id'])
        if command=='retry':result=await asyncio.to_thread(self.tasks.retry_run,'local',item['source_id'])
        else:result=await asyncio.to_thread(self.tasks.transition_run,'local',item['source_id'],{'pause':'pausing','resume':'queued','cancel':'cancelled'}[command],message='Memory library requested '+command)
        self.wake();return {'status':'ok','result':result}

def install(app,get_service,context):
    def service():
        value=get_service()
        if value is None:raise HTTPException(503,'Library is initializing')
        return value
    @app.get('/api/memory/library/categories')
    async def categories(request:Request,query:str='',offset:int=0,limit:int=50,state:str='all'):
        c=context(request);return await asyncio.to_thread(library.categories,service().memory,c['profile_id'],c['project_id'],query,offset,limit,state)
    @app.get('/api/memory/library/records')
    async def records(request:Request,category:str='',query:str='',state:str='all',offset:int=0,limit:int=20):
        c=context(request);return await asyncio.to_thread(library.page,service().memory,c['profile_id'],c['project_id'],category,query,state,offset,limit)
    @app.get('/api/memory/library/records/{identifier}')
    async def record(identifier:str,request:Request,state:str='all'):
        c=context(request);rows,records,members,revision=await asyncio.to_thread(library.snapshot,service().memory,c['profile_id'],c['project_id'],state)
        r=records.get(identifier)
        if not r:raise HTTPException(404,'Memory unavailable')
        return {'status':'ok','record':r,'revision':revision}
    @app.post('/api/memory/library/records/{identifier}/action')
    async def record_action(identifier:str,request:Request,payload:dict):
        from astra_ai.memory.globe_actions import execute
        c=context(request);return await asyncio.to_thread(execute,service().memory,identifier,payload,c['profile_id'],c['project_id'])
    @app.post('/api/memory/library/records/create')
    async def create(request:Request,payload:dict):
        c=context(request);return await asyncio.to_thread(service().memory.memory_action,'create_fact',category=str(payload.get('category','')),key=str(payload.get('key','')),value=payload.get('value'),metadata={'source':'human','evidence':str(payload.get('value','')),'profile_id':c['profile_id'],'project_id':c['project_id'],'session_id':c['session_id']})
    @app.get('/api/memory/library/{view}')
    async def listing(view:str,request:Request,status:str='',query:str='',offset:int=0,limit:int=30):
        if view not in {'approvals','tasks'}:raise HTTPException(404)
        return await asyncio.to_thread(service().listing,view,context(request),status,query,offset,limit)
    @app.get('/api/memory/library/{view}/{identifier}')
    async def detail(view:str,identifier:str,request:Request):
        if view not in {'approvals','tasks'}:raise HTTPException(404)
        return await asyncio.to_thread(service().detail,view,identifier,context(request))
    @app.post('/api/memory/library/approvals/{identifier}/decision')
    async def decision(identifier:str,request:Request,payload:dict):return await service().decision(identifier,payload,context(request))
    @app.post('/api/memory/library/tasks/{identifier}/action')
    async def control(identifier:str,request:Request,payload:dict):return await service().control(identifier,payload.get('action'),context(request))
