"""Durable bounded jobs over registered application tools; no code execution."""
import asyncio, copy, json, uuid, time, hashlib, re
from pathlib import Path
from astra_ai.memory.shared_memory import atomic, read, StorageLock, now, safe

READS={"memory_context_action","time_action","transcript_action_read","read_ui_context","read_standing_rules","recall_memory","recall_conversations","get_system_status","read_notes_context","read_search_context","read_calendar_context","read_image_context","recall_search_memory","list_tracked_files","read_file","file_status","search_web"}
def readonly(action):
    return action['name']=='research_action' and action.get('arguments',{}).get('action') in {'run','get','list','read'} or action['name']=='category_action' and action.get('arguments',{}).get('action') in {'list','resolve'} or action['name']=='capability_action' and action.get('arguments',{}).get('action') in {'list','get','status'} or action["name"]=="transcript_action" and action.get("arguments",{}).get("action") in {"sessions","list","get","history"} or action["name"] in READS or action["name"]=="memory_action" and action.get("arguments",{}).get("action") in {"list","get","history","search","list_forgotten","search_forgotten"}

PROTECTED_ARGUMENTS={'profile_id','project_id','scope','guest','client_id','session_id','confirm','confirmation_quote','version','approved','decision','api_key','token','credentials'}

def result_value(result, pointer):
    """RFC 6901 lookup over returned JSON data, never executable expressions."""
    if not isinstance(pointer,str) or len(pointer)>500 or (pointer and not pointer.startswith('/')):
        raise ValueError('invalid_result_pointer')
    value=result
    for part in pointer.split('/')[1:] if pointer else []:
        if re.search(r'~(?![01])',part):raise ValueError('invalid_result_pointer')
        part=part.replace('~1','/').replace('~0','~')
        if isinstance(value,dict) and part in value:value=value[part]
        elif isinstance(value,list) and re.fullmatch(r'0|[1-9][0-9]*',part) and int(part)<len(value):value=value[int(part)]
        else:raise ValueError('missing_result_reference')
    if len(json.dumps(value,ensure_ascii=False))>8000:raise ValueError('result_reference_too_large_use_artifact_id')
    return copy.deepcopy(value)

class ActionJobs:
    def __init__(self,path,executor,notify,online,allowed,reconcile=None,diagnose=None):
        self.path=Path(path);self.lock=StorageLock(self.path.with_suffix(".lock"))
        self.reconcile=reconcile;self.diagnose=diagnose;self.paused=False;self.workers={};self.max_active=20;self.max_operations=4
        self.executor=executor;self.notify=notify;self.online=online;self.allowed=set(allowed)-{"run_action_batch","job_action"}
        self.task=None;self.error=None;self._snapshot_cache=None
    def load(self):return read(self.path,{"jobs":{}})
    def recent_references(self,context):
        """Restore bounded actual results for this logical conversation only."""
        if context.get('guest') or not context.get('session_id'):return []
        with self.lock:jobs=self.load()['jobs'].values()
        results=[]
        for job in sorted(jobs,key=lambda row:row.get('created','')):
            if any(job['context'].get(k,'')!=context.get(k,'') for k in ('session_id','profile_id','project_id')) or job['context'].get('guest'):continue
            for step in job['actions']:
                result=step.get('result') or {}
                if step['state']!='completed' or not any(result.get(k) for k in ('research_id','note_id')):continue
                args=step.get('resolved_arguments',step.get('arguments',{}))
                results.append({'tool':step['name'],'turn_id':job['context'].get('turn_id',''),'status':result.get('status'),'query':safe(str(result.get('query') or args.get('query','')))[:200],'job_id':job['id'],**{k:result[k] for k in ('research_id','research_revision','note_id') if result.get(k)}})
        return results[-8:]
    def operation(self,operation_id,context):
        with self.lock:
            return next((copy.deepcopy(j) for j in self.load()['jobs'].values() if j.get('operation_id')==operation_id and (j['context'].get('profile_id',''),j['context'].get('project_id',''),bool(j['context'].get('guest')))==(context.get('profile_id',''),context.get('project_id',''),bool(context.get('guest')))),None)
    def write(self,data):atomic(self.path,data)
    async def start(self):
        def recover():
            with self.lock:
                data=self.load();self.paused=data.get("metadata",{}).get("paused",False)
                for job in data["jobs"].values():
                    for action in job["actions"]:
                        if action["state"]=="running":
                            action["state"]="queued" if readonly(action) else "uncertain"
                            if not readonly(action):action["result"]={"status":"uncertain","reason":"Inspect the operation before retrying; delivery may have completed."}
                    if job["state"]=="running":job["state"]="queued"
                self.write(data)
        try:await asyncio.to_thread(recover)
        except Exception:
            self.error="Job storage is unavailable. Existing data is preserved; repair storage and restart to resume."
            return
        if self.reconcile:
            data=await asyncio.to_thread(self.load)
            for job in data["jobs"].values():
                for index,action in enumerate(job["actions"]):
                    if action["state"]=="uncertain":
                        result=await self.reconcile(action,job["context"])
                        if result:await self.set_action(job["id"],index,"completed",result)
        self.task=asyncio.create_task(self.loop(),name="aegis-action-jobs")
    async def stop(self):
        for worker in list(self.workers.values()):worker.cancel()
        if self.workers:await asyncio.gather(*self.workers.values(),return_exceptions=True)
        self.workers.clear()
        if self.task:
            self.task.cancel()
            try:await self.task
            except asyncio.CancelledError:pass
    def submit(self,actions,context,operation_id="",goal=""):
        if self.error:return {"status":"failed","reason":self.error}
        if not isinstance(actions,list) or not 1<=len(actions)<=100:return {"status":"rejected","reason":"between_1_and_100_actions_required"}
        validated=[]
        for i,a in enumerate(actions):
            if not isinstance(a,dict) or a.get("name") not in self.allowed or not isinstance(a.get("arguments",{}),dict):return {"status":"rejected","reason":"unregistered_action"}
            if a['name']=='search_web' and a.get('arguments',{}).get('save_to_notes') is True:return {'status':'rejected','reason':'batch_requires_explicit_notes_import_with_result_refs'}
            if safe(json.dumps(a,ensure_ascii=False))!=json.dumps(a,ensure_ascii=False):return {"status":"rejected","reason":"credentials_not_allowed_in_jobs"}
            deps=a.get("depends_on",[])
            if not isinstance(deps,list) or any(not isinstance(d,int) or d<0 or d>=i for d in deps):return {"status":"rejected","reason":"dependencies_must_reference_earlier_actions"}
            if len(json.dumps(a))>20000:return {"status":"rejected","reason":"action_too_large"}
            refs=a.get('result_refs',{})
            if not isinstance(refs,dict) or len(refs)>20:return {'status':'rejected','reason':'invalid_result_refs'}
            for argument,ref in refs.items():
                if not isinstance(argument,str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,63}',argument) or argument in PROTECTED_ARGUMENTS or not isinstance(ref,dict):return {'status':'rejected','reason':'invalid_result_binding'}
                source=ref.get('action_index');pointer=ref.get('result_path')
                if type(source) is not int or not 0<=source<i or not isinstance(pointer,str) or len(pointer)>500 or (pointer and not pointer.startswith('/')):return {'status':'rejected','reason':'invalid_result_reference'}
                deps=list(set(deps)|{source})
            validated.append({**copy.deepcopy(a),"depends_on":sorted(deps),"state":"queued","operation_id":f"{operation_id or uuid.uuid4().hex}:{i}","result":None,"attempts":0,"next_attempt":0,"acknowledged":False,"repair_used":False})
        with self.lock:
            data=self.load()
            old=next((j for j in data["jobs"].values() if operation_id and j.get("operation_id")==operation_id and (j["context"].get("profile_id",""),j["context"].get("project_id",""),bool(j["context"].get("guest")))==(context.get("profile_id",""),context.get("project_id",""),bool(context.get("guest")))),None)
            if old:
                original=[{k:v for k,v in a.get('original_action',a).items() if k in {'name','arguments','depends_on','result_refs'}} for a in old['actions']]
                incoming=[{k:v for k,v in a.items() if k in {'name','arguments','depends_on','result_refs'}} for a in validated]
                if original!=incoming:return {'status':'rejected','reason':'operation_id_reused_with_different_actions'}
                return {"status":"duplicate","job_id":old["id"],"state":old["state"]}
            jid=uuid.uuid4().hex
            data["jobs"][jid]={"id":jid,"operation_id":operation_id,"title":safe(str(goal))[:240],"state":"queued","created":now(),"updated":now(),"context":{**context,"user_text":safe(context.get("user_text",""))},"actions":validated,"sequence":0}
            self.write(data)
            return {"status":"queued","job_id":jid,"count":len(validated)}
    def list(self,job_id="",context=None):
        if self.error:return {"status":"failed","reason":self.error}
        with self.lock:
            jobs=self.load()["jobs"]
            if context is not None:jobs={jid:j for jid,j in jobs.items() if (j['context'].get('profile_id',''),j['context'].get('project_id',''),bool(j['context'].get('guest')))==(context.get('profile_id',''),context.get('project_id',''),bool(context.get('guest')))}
            if job_id:return {"status":"ok","job":jobs[job_id]} if job_id in jobs else {"status":"not_found"}
            return {"status":"ok","jobs":[{k:v for k,v in j.items() if k not in {"context","actions"}}|{"completed":sum(a["state"]=="completed" for a in j["actions"]),"total":len(j["actions"])} for j in sorted(jobs.values(),key=lambda j:j["created"],reverse=True)[:100]]}
    def cancel(self,jid):
        with self.lock:
            data=self.load();j=data["jobs"].get(jid)
            if not j:return {"status":"not_found"}
            if j["state"] in {"completed","failed"}:return {"status":"completed","job_id":jid,"state":j["state"]}
            j["state"]="canceled"
            for a in j["actions"]:
                if a["state"] in {"queued","waiting_for_ui"}:a["state"]="canceled"
            j["updated"]=now();self.write(data)
            return {"status":"canceled","job_id":jid}
    async def attach(self,client_id,session_id,context=None):
        def update():
            with self.lock:
                data=self.load()
                for j in data["jobs"].values():
                    same_scope=context is None or (j['context'].get('profile_id',''),j['context'].get('project_id',''),bool(j['context'].get('guest')))==(context.get('profile_id',''),context.get('project_id',''),bool(context.get('guest')))
                    if same_scope and j["context"].get("session_id")==session_id:
                        j["context"]["client_id"]=client_id
                        for a in j["actions"]:
                            if a["state"]=="waiting_for_ui":a["next_attempt"]=0
                self.write(data)
        await asyncio.to_thread(update)
    def snapshot(self):
        with self.lock:
            signature=(self.path.stat().st_mtime_ns,self.path.stat().st_size) if self.path.exists() else None
            if self._snapshot_cache and self._snapshot_cache[0]==signature:return copy.deepcopy(self._snapshot_cache[1])
            jobs=[j for j in self.load()['jobs'].values() if j['state'] in {'queued','running','waiting_for_ui','waiting_for_retry'}]
            jobs.sort(key=lambda j:(bool(j.get('context',{}).get('background')),j['created']))
            self._snapshot_cache=(signature,jobs);return copy.deepcopy(jobs)
    def pause(self):
        with self.lock:data=self.load();data.setdefault('metadata',{})['paused']=True;self.write(data);self.paused=True
        return {'status':'paused'}
    def resume(self):
        with self.lock:data=self.load();data.setdefault('metadata',{})['paused']=False;self.write(data);self.paused=False
        return {'status':'resumed'}
    def control_job(self,jid,paused):
        with self.lock:
            data=self.load();job=data['jobs'].get(jid)
            if not job:return {'status':'not_found'}
            if job['state'] in {'completed','failed','canceled'}:return {'status':'rejected','reason':'terminal_job'}
            job['paused']=bool(paused);job['updated']=now();self.write(data)
        return {'status':'paused' if paused else 'resumed','job_id':jid}
    def retry(self,jid,repair_id='',validated=False):
        with self.lock:
            data=self.load();job=data['jobs'].get(jid)
            if not job:return {'status':'not_found'}
            changed=False
            for a in job['actions']:
                if a['state'] not in {'failed','exhausted'}:continue
                if repair_id and (not validated or a.get('repair_used')):return {'status':'rejected','reason':'validated_unused_repair_required'}
                if not readonly(a) and not repair_id:return {'status':'rejected','reason':'reconcile_side_effect_before_retry'}
                a.update(state='queued',next_attempt=0,attempts=0,repair_used=bool(repair_id) or a.get('repair_used',False),repair_id=repair_id);changed=True
            if changed:job['state']='queued';self.write(data)
            return {'status':'queued' if changed else 'unchanged','job_id':jid}
    def install_recovery(self,jid,index,tool_id):
        # Trusted activation controller only; this operation is not a Gemini tool.
        with self.lock:
            data=self.load();job=data['jobs'].get(jid)
            if not job or job['state']=='canceled' or not 0<=index<len(job['actions']):return {'status':'not_found'}
            action=job['actions'][index]
            if action['state']!='failed' or action.get('repair_used') or action.get('result',{}).get('status')=='uncertain':return {'status':'rejected','reason':'confirmed_unused_recovery_required'}
            original=copy.deepcopy(action);action.update(original_action=original,name='capability_action',arguments={'action':'invoke','tool_id':tool_id,'arguments':original.get('arguments',{})},state='queued',repair_used=True,attempts=0,next_attempt=0,operation_id=original['operation_id']+':repair',result=None);job['state']='queued';self.write(data)
            return {'status':'queued','job_id':jid}
    async def loop(self):
        while True:
            try:
                for key,worker in list(self.workers.items()):
                    if worker.done():
                        try:worker.result()
                        except asyncio.CancelledError:pass
                        except Exception:self.error='A task worker failed; stored operations are preserved.'
                        self.workers.pop(key,None)
                jobs=await asyncio.to_thread(self.snapshot)
                active=[j for j in jobs if j['state'] in {'queued','running','waiting_for_ui','waiting_for_retry'}][:self.max_active]
                write_running=any(not readonly(a) for j in active for i,a in enumerate(j['actions']) if (j['id'],i) in self.workers)
                if not self.paused:
                    # Round-robin across admitted jobs, then fill spare slots from one job.
                    candidates=[]
                    for job in active:
                        if job.get('paused'):continue
                        eligible=[(i,a) for i,a in enumerate(job['actions']) if a['state'] in {'queued','waiting_for_ui','waiting_for_retry'} and a.get('next_attempt',0)<=time.time() and all(job['actions'][d]['state']=='completed' for d in a['depends_on'])]
                        for rank,(i,a) in enumerate(eligible):candidates.append((rank,job,i,a))
                    candidates.sort(key=lambda x:(x[0],x[1]['created']))
                    for _,job,i,a in candidates:
                        if len(self.workers)>=self.max_operations:break
                        key=(job['id'],i)
                        if key in self.workers or (write_running and not readonly(a)):continue
                        if not readonly(a):write_running=True
                        self.workers[key]=asyncio.create_task(self.execute(job,i,a),name='aegis-job-operation')
                for job in active:
                    if job['state']=='queued' or all(a['state'] in {'completed','failed','uncertain','canceled'} for a in job['actions']):await self.finalize(job['id'])
            except asyncio.CancelledError:raise
            except Exception:self.error='Task storage is unavailable; existing data is preserved.';return
            await asyncio.sleep(.15)
    async def execute(self,job,index,action):
        # Resolve against the latest durable predecessor results, not a scheduler snapshot.
        action=copy.deepcopy(action)
        try:
            if action.get('result_refs'):
                latest=await asyncio.to_thread(self.list,job['id'],job['context'])
                for argument,ref in action['result_refs'].items():
                    source=latest['job']['actions'][ref['action_index']]
                    if source['state']!='completed':raise ValueError('dependency_not_completed')
                    action.setdefault('arguments',{})[argument]=result_value(source['result'],ref['result_path'])
        except (KeyError,ValueError,TypeError) as error:
            await self.set_action(job['id'],index,'failed',{'status':'failed','reason':str(error)})
            await self.finalize(job['id']);return
        context={**job["context"],"job_id":job["id"],"authorized_capabilities":[action.get("original_action",action)["name"]],"authorized_operations":{action.get("original_action",action)["name"]:action.get("original_action",action).get("arguments",{})}}
        ui=action["name"] not in READS and action["name"] not in {"research_action","capability_action","category_action","transcript_action","memory_action","save_memory","save_memory_event","propose_memories","set_standing_rule","save_memory_relationship","learn_memory","forget_memory","forget_memory_event","search_web","save_search_memory","update_search_memory","delete_search_memory","create_file","edit_file","append_file","delete_file","move_file"}
        if action["name"].startswith("read_") and action["name"] not in {"read_ui_context","read_standing_rules","read_file"}:ui=True
        if ui and not self.online(context.get("client_id","")):
            await self.set_action(job["id"],index,"waiting_for_ui",None,next_attempt=time.time()+1);return
        started=await self.set_action(job["id"],index,"running",None,attempts=action.get("attempts",0)+1,resolved_arguments=action.get('arguments',{}))
        if not started:return
        try:
            # One checkpointed writing stage may use two bounded 180-second model attempts.
            # Ordinary operations retain their existing responsive deadline.
            timeout=600 if action["name"]=='search_web' and context.get('requested_research') else 60
            result=await asyncio.wait_for(self.executor(action["name"],action.get("arguments",{}),context,action["operation_id"]),timeout=timeout)
        except asyncio.CancelledError:raise
        except Exception as exc:result={"status":"failed","reason":type(exc).__name__,"retryable":isinstance(exc,(TimeoutError,ConnectionError))}
        if not isinstance(result,dict):result={'status':'failed','reason':'invalid_tool_result'}
        if action.get('repair_used') and action.get('original_action') and action['original_action']['name'] not in result.get('executed_names',[]):result={'status':'failed','reason':'repair_did_not_perform_original_operation'}
        status=result.get('status');failed=status in {'failed','error','rejected','uncertain','unconfirmed','not_found','conflict','exhausted','validation_failed'}
        transient=bool(result.get('retryable') or result.get('http_status') in {429,502,503,504} or result.get('reason') in {'TimeoutError','ConnectionError'})
        attempts=action.get('attempts',0)+1;extra={}
        if status in {'waiting_for_quota','waiting_for_retry'}:state='waiting_for_retry';extra.update(next_attempt=max(time.time()+1,float(result.get('next_attempt',time.time()+65))),attempts=action.get('attempts',0))
        elif status=='waiting_for_ui':state='waiting_for_ui';extra['next_attempt']=time.time()+1
        elif failed and transient and readonly(action) and attempts < (1 if action.get('repair_used') else 3):
            delay=result.get('retry_after_seconds',result.get('retry_after',min(60,2**attempts)))
            try:delay=max(0,min(3600,float(delay)))
            except (ValueError,TypeError):delay=30
            state='waiting_for_retry';extra['next_attempt']=time.time()+delay
        else:state='uncertain' if status in {'uncertain','unconfirmed'} or failed and transient and not readonly(action) else 'failed' if failed else 'completed';extra['acknowledged']=not failed
        await self.set_action(job['id'],index,state,result,**extra)
        await self.finalize(job['id'])
        if state=='failed' and self.diagnose and status not in {'rejected','conflict'}:
            try:await self.diagnose(job['id'],index,action,result,context)
            except Exception:pass
    async def set_action(self,jid,index,state,result,**extra):
        def update():
            with self.lock:
                data=self.load();job=data["jobs"][jid]
                if job["state"]=="canceled":
                    if state!="running":job["actions"][index]["late_result"]=result;self.write(data)
                    return None
                job["actions"][index].update(state=state,result=result,**extra);job["sequence"]+=1;job["updated"]=now()
                self.write(data)
                return {"type":"job_progress","job_id":jid,"sequence":job["sequence"],"state":job["state"],"title":job.get("title") or ", ".join(a["name"].replace("_"," ") for a in job["actions"][:3]),"step":job["actions"][index]["name"].replace("_"," "),"action_index":index,"action_state":state,"completed":sum(a["state"]=="completed" for a in job["actions"]),"total":len(job["actions"]),"client_id":job["context"].get("client_id",""),"scope":{k:job["context"].get(k,"" if k!="guest" else False) for k in ("profile_id","project_id","guest","session_id","background","requested_research")}}
        event=await asyncio.to_thread(update)
        if event and result and result.get('notification'):event['notification']=result['notification'];event['research_id']=result.get('research_id','')
        if event:
            try:await self.notify(event.pop("client_id"),event)
            except Exception:pass
        return event is not None
    async def finalize(self,jid):
        def update():
            with self.lock:
                data=self.load();j=data["jobs"][jid]
                if j["state"]=="canceled":return None
                previous=j["state"]
                states=[a["state"] for a in j["actions"]]
                pending=any(s in {"queued","running","waiting_for_ui","waiting_for_retry"} for s in states)
                # Failed dependencies cannot run their dependents.
                for a in j["actions"]:
                    if a["state"]=="queued" and any(j["actions"][d]["state"] in {"failed","uncertain","canceled"} for d in a["depends_on"]):a["state"]="failed";a["result"]={"status":"failed","reason":"dependency_failed"}
                states=[a["state"] for a in j["actions"]]
                j["state"]="waiting_for_ui" if "waiting_for_ui" in states else "waiting_for_retry" if "waiting_for_retry" in states else "running" if any(s in {"queued","running"} for s in states) else "failed" if any(s in {"failed","uncertain"} for s in states) else "completed"
                self.write(data)
                if previous!=j["state"]:
                    j["sequence"]+=1;self.write(data)
                    return {"type":"job_progress","job_id":jid,"state":j["state"],"sequence":j["sequence"],"completed":sum(a["state"]=="completed" for a in j["actions"]),"total":len(j["actions"]),"client_id":j["context"].get("client_id",""),"scope":{k:j["context"].get(k,"" if k!="guest" else False) for k in ("profile_id","project_id","guest","session_id","background","requested_research")}}
        event=await asyncio.to_thread(update)
        if event:
            try:await self.notify(event.pop("client_id"),event)
            except Exception:pass


"""Operational planning adapter to the existing queue, not another executor."""
import asyncio
import json
import time
from .background_budget import BudgetPaused


class TaskCoordinator:
    def __init__(self, jobs, planner, declarations, busy=lambda:False, run_state=None):
        self.jobs=jobs;self.planner=planner;self.busy=busy;self.run_state=run_state
        # The ordinary task planner has application tools, never permission decisions,
        # repair activation, shell access, or raw filesystem capabilities.
        names={'search_web','notes_action','search_widget_action','library_action','memory_view_action','calendar_action','read_notes_context','read_search_context','read_calendar_context','ui_action','get_system_status'}
        self.tools=[d for d in declarations if d['name'] in names]

    async def run(self, task, emit):
        run_id=task['execution_run_id'];meta=task.get('metadata',{})
        context={'profile_id':meta.get('profile_id',''),'project_id':meta.get('project_id',''),'session_id':meta.get('session_id',''),
                 'client_id':meta.get('client_id',''),'user_text':task['instruction'],'task_run_id':run_id}
        op='task-run:'+run_id
        job=await asyncio.to_thread(self.jobs.operation,op,context)
        if not job:
            if self.busy():return {'status':'waiting_for_retry','next_attempt':time.time()+5,'reason':'Conversation has priority.'}
            schema={'type':'object','additionalProperties':False,'properties':{'goal':{'type':'string'},'actions':{'type':'array','items':{'type':'object','additionalProperties':False,'properties':{'name':{'type':'string'},'arguments_json':{'type':'string'},'depends_on':{'type':'array','items':{'type':'integer'}}},'required':['name','arguments_json','depends_on']}}},'required':['goal','actions']}
            try:
                plan=await asyncio.to_thread(self.planner.structured,
                    'Create a short executable action graph for this authorized saved task using only the supplied registered tools. Return actual structured arguments as JSON, no code. Do not invent success or evidence. Search-to-Notes: search_web, then notes_action import_research using result_refs for /research_id and /research_revision. Put result_refs inside arguments_json under __result_refs, not a tool argument. Never overwrite an existing note without a specified target. If a necessary target is ambiguous, return no actions. Include the expected result in goal.',
                    {'instruction':task['instruction'],'capabilities':self.tools},schema,1600)
            except BudgetPaused as paused:return {'status':'waiting_for_retry','next_attempt':paused.until,'reason':paused.reason}
            except Exception:return {'status':'waiting_for_input','reason':'Task planning is unavailable; the original instruction remains saved.'}
            actions=[]
            try:
                for item in plan['actions'][:20]:
                    if item['name'] not in {d['name'] for d in self.tools}:raise ValueError()
                    args=json.loads(item['arguments_json']);refs=args.pop('__result_refs',{})
                    if item['name']=='notes_action' and args.get('action') in {'delete_note','clear_all_notes','import_notes'}:raise ValueError()
                    if item['name']=='library_action' and args.get('action') not in {'categories','open','list','get'}:raise ValueError()
                    actions.append({'name':item['name'],'arguments':args,'depends_on':item['depends_on'],'result_refs':refs})
            except (ValueError,TypeError,KeyError):return {'status':'waiting_for_input','reason':'The proposed task plan was invalid; no actions ran.'}
            if not actions:return {'status':'waiting_for_input','reason':'A necessary task target needs clarification.'}
            submitted=await asyncio.to_thread(self.jobs.submit,actions,context,op,task['title'])
            if submitted['status'] not in {'queued','duplicate'}:return {'status':'failed','reason':submitted.get('reason','task_plan_rejected')}
            job={'id':submitted['job_id']}
        jid=job['id'];await asyncio.to_thread(self.jobs.control_job,jid,False)
        sequence=-1
        try:
            while True:
                state=await self.run_state(run_id) if self.run_state else 'running'
                if state in {'pausing','paused','cancelled','canceled'}:raise asyncio.CancelledError
                result=await asyncio.to_thread(self.jobs.list,jid,context);current=result.get('job',{})
                if current.get('sequence')!=sequence:
                    sequence=current.get('sequence');completed=sum(a['state']=='completed' for a in current['actions'])
                    await emit(min(95,15+int(80*completed/len(current['actions']))),current['state'].replace('_',' '),{'job_id':jid})
                if current.get('state')=='completed':return {'status':'completed','job_id':jid,'summary':'All registered task actions completed.','results':[a['result'] for a in current['actions']]}
                if current.get('state') in {'failed','canceled'}:return {'status':current['state'],'job_id':jid,'reason':'Inspect the recorded steps and results.','results':[a['result'] for a in current['actions']]}
                await asyncio.sleep(.2)
        except asyncio.CancelledError:
            state=await self.run_state(run_id) if self.run_state else 'paused'
            if state in {'canceled','cancelled'}:await asyncio.to_thread(self.jobs.cancel,jid)
            else:await asyncio.to_thread(self.jobs.control_job,jid,True)
            raise
