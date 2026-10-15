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
