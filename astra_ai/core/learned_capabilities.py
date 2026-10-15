"""Versioned learned tools and reversible pure-function repairs behind verified OS isolation."""
import ast,asyncio,copy,hashlib,json,os,time,uuid,sys
from pathlib import Path
from astra_ai.memory.shared_memory import read,atomic,StorageLock,safe,stable,now
from astra_ai.memory.category_policy import matches_scope
from .sandbox_worker import SandboxWorker,IsolationUnavailable
from .background_budget import BudgetPaused
from .background_model import ModelUnavailable

SAFE_CAPABILITIES={'open_website','get_system_status','read_file','file_status','recall_memory','recall_conversations','search_web'}
# Keep canonical core modules protected as well as their transport aliases.
PROTECTED={'server.py','gemini_live.py','gemini_session.py','aegis_ai.py','aegis_live_context.py','research_learning.py','organizer_runtime.py','legacy_aegis_ai.py','aegis_runtime.py','runtime_context.py','task_coordination.py','organization_review.py','research_artifacts.py','chat_stream.py','action_jobs.py','sandbox_worker.py','learned_capabilities.py','background_budget.py','background_model.py','shared_memory.py','category_policy.py','category_registry.py','persistent_rules.py'}
FORBIDDEN={'exec','eval','compile','open','__import__','globals','locals','vars','getattr','setattr','delattr','breakpoint'}

def validate_code(code):
    if not isinstance(code,str) or not 10<=len(code)<=32000 or safe(code)!=code:raise ValueError('Invalid or sensitive code')
    tree=ast.parse(code)
    if not any(isinstance(n,ast.FunctionDef) and n.name=='run' and len(n.args.args)==1 and not n.decorator_list for n in tree.body):raise ValueError('A pure run(input) function is required')
    for n in ast.walk(tree):
        if isinstance(n,(ast.Import,ast.ImportFrom)):
            names=[a.name for a in n.names] if isinstance(n,ast.Import) else [n.module or '']
            if any(name not in {'json','math','datetime','re','urllib.parse'} for name in names):raise ValueError('Import requires a broker capability')
            if isinstance(n,ast.ImportFrom) and n.level:raise ValueError('Relative imports unavailable')
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='input':raise ValueError('Interactive input is unavailable')
        if isinstance(n,ast.Name) and (n.id in FORBIDDEN or n.id.startswith('__')):raise ValueError('Dynamic execution or file access unavailable')
        if isinstance(n,ast.Attribute) and n.attr.startswith('__'):raise ValueError('Runtime introspection unavailable')
        if isinstance(n,(ast.ClassDef,ast.AsyncFunctionDef,ast.Global,ast.Nonlocal)):raise ValueError('Only pure synchronous functions are supported')
    return tree

class LearnedCapabilities:
    def __init__(self,root,repo,memory,jobs,broker,model=None,sandbox=None):
        self.root=Path(root).resolve();self.repo=Path(repo).resolve();self.memory=memory;self.jobs=jobs;self.broker=broker;self.model=model;self.sandbox=sandbox or SandboxWorker();self.validation_seal=uuid.uuid4().hex;self.path=self.root/'capabilities.json';self.lock=StorageLock(self.root/'capabilities.lock');self.cpu=asyncio.Semaphore(1)
    def load(self):return read(self.path,{'tools':{},'repairs':{},'invocations':{},'audit':[]})
    def initialize(self):
        with self.lock:
            data=self.load()
            for item in data['repairs'].values():
                if item['state']=='applying':
                    target=(self.repo/item['target']).resolve();original=self._path(item['backup'])
                    if target.is_relative_to(self.repo) and target.exists() and original.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item.get('new_hash'):
                        self._replace(target,original.read_bytes());item['state']='rolled_back';item['reason']='interrupted_deployment'
            atomic(self.path,data)
    def status(self):return {'status':'ok','isolation':self.sandbox.status(),'tools':len(self.load()['tools']),'automatic_activation':self.sandbox.verified}
    def listing(self,context,offset=0,limit=20):
        with self.lock:items=[{k:v for k,v in t.items() if k not in {'code','tests'}} for t in self.load()['tools'].values() if matches_scope(t,context.get('profile_id',''),context.get('project_id',''))]
        return {'status':'ok','tools':items[max(0,int(offset)):max(0,int(offset))+min(50,max(1,int(limit)))],'total':len(items),'isolation':self.sandbox.status()}
    def get(self,tool_id,context):
        with self.lock:item=self.load()['tools'].get(tool_id) or self.load()['repairs'].get(tool_id)
        if not item or not matches_scope(item,context.get('profile_id',''),context.get('project_id','')):return {'status':'not_found'}
        item=copy.deepcopy(item)
        if item.get('tests') and isinstance(item['tests'],str):item['input_examples']=[case['input'] for case in read(self._path(item['tests']),{}).get('cases',[])[:3]]
        return {'status':'ok','item':item}
    def stage(self,name,description,code,tests,capabilities,context,source_refs=None):
        validate_code(code)
        if not isinstance(tests,list) or not 1<=len(tests)<=12 or any(not isinstance(t,dict) or set(t)!={'input','expected'} or len(json.dumps(t))>16000 for t in tests):return {'status':'rejected','reason':'input_expected_test_fixtures_required'}
        if safe(json.dumps(tests,ensure_ascii=False))!=json.dumps(tests,ensure_ascii=False):return {'status':'rejected','reason':'sensitive_test_fixtures'}
        if not isinstance(capabilities,list) or any(not isinstance(c,str) for c in capabilities):return {'status':'rejected','reason':'invalid_capabilities'}
        if context.get('guest'):return {'status':'rejected','reason':'guest_cannot_create_tools'}
        tool_id=stable('learned_tool',name,context.get('profile_id',''),context.get('project_id',''));digest=hashlib.sha256(code.encode()).hexdigest()
        with self.lock:
            data=self.load();previous=data['tools'].get(tool_id)
            if previous and previous['hash']==digest:return {'status':'duplicate','tool_id':tool_id,'state':previous['state']}
            version=previous.get('version',0)+1 if previous else 1;directory=(self.root/'tools'/tool_id/str(version)).resolve()
            if not directory.is_relative_to(self.root):raise ValueError('Invalid learned tool directory')
            directory.mkdir(parents=True,exist_ok=True)
            path=directory/'tool.py';path.write_text(code,encoding='utf-8');atomic(directory/'tests.json',{'cases':tests})
            item={'id':tool_id,'name':safe(str(name))[:100],'description':safe(str(description))[:500],'hash':digest,'code':str(path.relative_to(self.root)),'tests':str((directory/'tests.json').relative_to(self.root)),'capabilities':list(dict.fromkeys(capabilities)),'profile_id':context.get('profile_id',''),'project_id':context.get('project_id',''),'state':'pending_validation','risk':'routine' if set(capabilities)<=SAFE_CAPABILITIES else 'high','created':now(),'version':version,'source_refs':source_refs or [],'history':(previous.get('history',[])+[{k:v for k,v in previous.items() if k!='history'}]) if previous else []}
            data['tools'][tool_id]=item;data['audit'].append({'id':tool_id,'event':'staged','at':now(),'hash':digest});atomic(self.path,data)
        return {'status':'staged','tool_id':tool_id,'state':item['state'],'risk':item['risk']}
    def _path(self,relative):
        path=(self.root/relative).resolve()
        if not path.is_relative_to(self.root):raise ValueError('Invalid learned artifact path')
        return path
    async def validate(self,tool_id,context):
        result=await asyncio.to_thread(self.get,tool_id,context)
        if result['status']!='ok':return result
        tool=result['item'];code=self._path(tool['code']).read_text(encoding='utf-8')
        if hashlib.sha256(code.encode()).hexdigest()!=tool['hash']:return {'status':'rejected','reason':'artifact_changed'}
        validate_code(code)
        async with self.cpu:
            if not self.sandbox.verified:await asyncio.to_thread(self.sandbox.verify)
            if not self.sandbox.verified:return {'status':'staged','tool_id':tool_id,'reason':'OS_isolation_unavailable','isolation':self.sandbox.status()}
            cases=read(self._path(tool['tests']),{})['cases']
            for index,case in enumerate(cases):
                actual=await asyncio.to_thread(self.sandbox.run,code,case['input'])
                if actual.get('status')!='ok' or actual.get('result')!=case['expected']:
                    return self._tool_state(tool_id,'validation_failed',reason='isolated_test_failed',diagnostics={'failing_case':index,'actual_status':actual.get('status'),'error_type':actual.get('reason'),'expected_type':type(case['expected']).__name__,'actual_type':type(actual.get('result')).__name__})
        state='active' if tool['risk']=='routine' or tool.get('approved_hash')==tool['hash'] else 'waiting_for_approval'
        return self._tool_state(tool_id,state,validated_hash=tool['hash'],validated_at=now())
    def _tool_state(self,tool_id,state,**metadata):
        with self.lock:
            data=self.load();tool=data['tools'][tool_id];tool.update(state=state,**metadata);data['audit'].append({'id':tool_id,'event':state,'at':now(),'hash':tool['hash']});atomic(self.path,data)
        with self.memory._lock:
            m=self.memory.load();m.setdefault('capability_index',{})[tool_id]={k:v for k,v in tool.items() if k not in {'history','tests','code'}};self.memory._commit(m)
        return {'status':'activated' if state=='active' else state,'tool_id':tool_id,**metadata}
    async def invoke(self,tool_id,arguments,context,operation_id):
        result=await asyncio.to_thread(self.get,tool_id,context)
        if result['status']!='ok':return result
        tool=result['item']
        if tool['state']!='active' or tool.get('validated_hash')!=tool['hash'] or not self.sandbox.verified:return {'status':'rejected','reason':'tool_not_verified_active'}
        signature=stable(tool_id,tool['version'],json.dumps(arguments,sort_keys=True),context.get('profile_id',''),context.get('project_id',''));key=stable(operation_id,context.get('session_id',''),tool_id)
        with self.lock:
            data=self.load();prior=data['invocations'].get(key)
            if prior:
                if prior['signature']!=signature:return {'status':'rejected','reason':'operation_id_reused'}
                return prior.get('result',{'status':'uncertain','reason':'inspect_before_retrying'})
            data['invocations'][key]={'signature':signature,'state':'running','created':now()};atomic(self.path,data)
        code=self._path(tool['code']).read_text(encoding='utf-8')
        if hashlib.sha256(code.encode()).hexdigest()!=tool['hash']:return {'status':'rejected','reason':'artifact_changed'}
        async with self.cpu:output=await asyncio.to_thread(self.sandbox.run,code,arguments)
        if output['status']!='ok':return self._invocation(key,{'status':'failed','reason':'isolated_tool_failed'})
        value=output.get('result');actions=value.get('actions',[]) if isinstance(value,dict) else []
        if actions and (context.get('background') or not context.get('user_text')):return self._invocation(key,{'status':'rejected','reason':'requested_task_required_for_actions'})
        if not isinstance(actions,list) or len(actions)>10:return self._invocation(key,{'status':'rejected','reason':'invalid_broker_actions'})
        results=[]
        for i,action in enumerate(actions):
            if isinstance(action,dict) and action.get('name') in {'read_file','file_status'} and action.get('name') not in context.get('authorized_capabilities',[]):return self._invocation(key,{'status':'rejected','reason':'filesystem_task_authorization_required'})
            if isinstance(action,dict) and action.get('name') not in SAFE_CAPABILITIES and action.get('arguments',{})!=context.get('authorized_operations',{}).get(action.get('name')):return self._invocation(key,{'status':'rejected','reason':'critical_target_changed'})
            if isinstance(action,dict) and action.get('name') in {'read_file','file_status'} and action.get('arguments',{})!=context.get('authorized_operations',{}).get(action.get('name')):return self._invocation(key,{'status':'rejected','reason':'filesystem_target_changed'})
            if isinstance(action,dict) and action.get('name') not in SAFE_CAPABILITIES and action.get('name') not in context.get('authorized_capabilities',[]):return self._invocation(key,{'status':'rejected','reason':'critical_operation_needs_current_authorization'})
            if not isinstance(action,dict) or action.get('name') not in tool['capabilities'] or not isinstance(action.get('arguments',{}),dict):return self._invocation(key,{'status':'rejected','reason':'undeclared_broker_capability'})
            answer=await self.broker(action['name'],action.get('arguments',{}),context,operation_id+':broker:'+str(i))
            def redacted(value):
                from astra_ai.memory.shared_memory import _SECRET_KEY_RE
                if isinstance(value,dict):return {k:('[REDACTED]' if _SECRET_KEY_RE.search(str(k)) else redacted(v)) for k,v in value.items()}
                if isinstance(value,list):return [redacted(v) for v in value]
                return safe(value) if isinstance(value,str) else value
            answer=redacted(answer);results.append(answer)
            if answer.get('status') in {'failed','error','rejected','uncertain','not_found'}:return self._invocation(key,{'status':'failed','reason':'broker_operation_failed','results':results})
        return self._invocation(key,{'status':'completed','tool_id':tool_id,'result':value,'broker_results':results,'executed_names':[a['name'] for a in actions]})
    def _invocation(self,key,result):
        with self.lock:data=self.load();data['invocations'][key].update(state=result['status'],result=result,updated=now());atomic(self.path,data)
        return result
    def control(self,paused):
        with self.lock:
            data=self.load();data.setdefault('metadata',{})['paused']=bool(paused);atomic(self.path,data)
        return {'status':'paused' if paused else 'resumed'}
    def learning_context(self,purpose,context,failed_job=''):
        details={'sources':[],'verified_capabilities':[]}
        privacy=self.memory.privacy_settings()
        if not privacy.get('private_session') and privacy.get('retain_memories') is not False:
            result=self.memory.recall_memory(safe(purpose)[:300],limit=4,profile_id=context.get('profile_id',''),project_id=context.get('project_id',''))
            for record in result.get('matches',[]):
                details['sources'].append({'id':record.get('id'),'kind':'external_research' if record.get('attributes',{}).get('external_knowledge') else 'memory','value':safe(json.dumps(record.get('value'),ensure_ascii=False))[:600],'source_refs':record.get('source_refs',[])[:3],'revision':record.get('revision',1)})
        for item in self.listing(context)['tools']:
            if item.get('state')=='active':details['verified_capabilities'].append({'id':item['id'],'name':item['name'],'description':item['description'][:150]})
            if len(details['verified_capabilities'])>=5:break
        if failed_job and self.jobs:
            job=self.jobs.list(failed_job,context).get('job',{})
            details['previous_failures']=[{'operation_id':a.get('operation_id'),'name':a['name'],'state':a['state'],'reason':safe((a.get('result') or {}).get('reason',''))[:150],'arguments':safe(json.dumps(a.get('arguments',{})))[:600]} for a in job.get('actions',[]) if a['state'] in {'failed','uncertain'}][:3]
        return details
    async def learn(self,purpose,context,failed_job=''):
        if self.load().get('metadata',{}).get('paused'):return {'status':'waiting_for_retry','next_attempt':time.time()+60,'reason':'learning_paused'}
        if not self.model:return {'status':'staged','reason':'background_model_unavailable'}
        development=stable('development',purpose,context.get('profile_id',''),context.get('project_id',''),failed_job)
        with self.lock:prior=copy.deepcopy(self.load().get('developments',{}).get(development,{}))
        correction={}
        if prior.get('tool_id'):
            previous=(await asyncio.to_thread(self.get,prior['tool_id'],context)).get('item',{})
            if previous.get('state')=='active':return {'status':'activated','tool_id':prior['tool_id'],'cached':True}
            if previous.get('state') in {'pending_validation','waiting_for_approval'}:return await self.validate(prior['tool_id'],context)
            if previous.get('state')=='validation_failed':
                if prior.get('attempts',0)>=2:return {'status':'validation_failed','tool_id':prior['tool_id'],'reason':'tested_development_exhausted'}
                correction={'code':self._path(previous['code']).read_text(encoding='utf-8')[:12000],'fixtures':read(self._path(previous['tests']),{}).get('cases',[])[:8],'diagnostics':previous.get('diagnostics',{})}
        schema={'type':'object','additionalProperties':False,'properties':{'name':{'type':'string'},'description':{'type':'string'},'code':{'type':'string'},'tests':{'type':'array','items':{'type':'object','additionalProperties':False,'properties':{'input_json':{'type':'string'},'expected_json':{'type':'string'}},'required':['input_json','expected_json']}},'capabilities':{'type':'array','items':{'type':'string'}}},'required':['name','description','code','tests','capabilities']}
        try:
            proposal=await asyncio.to_thread(self.model.structured,'Create a small pure Python run(input) helper and meaningful JSON input/expected fixtures. The worker cannot access files, secrets, network or processes. To perform a requested operation return a dictionary containing actions with name and arguments; only declared broker capabilities may be used. Do not import anything except json, math, re, datetime or urllib.parse. Each expected_json must exactly match the JSON returned by run(input); do not use exception descriptions or intentionally raising fixtures. A narrow helper needs only one or two meaningful passing examples. If a prior draft failed, fix its recorded diagnostics once.',{'purpose':safe(purpose)[:1200],'broker_capabilities':sorted(SAFE_CAPABILITIES),'sourced_context':await asyncio.to_thread(self.learning_context,purpose,context,failed_job),'prior_failed_draft':correction},schema,2200)
            cases=[{'input':json.loads(c['input_json']),'expected':json.loads(c['expected_json'])} for c in proposal['tests']]
            if correction:
                original_cases=correction['fixtures']
                if any(json.dumps(old['input'],sort_keys=True)==json.dumps(new['input'],sort_keys=True) and old['expected']!=new['expected'] for old in original_cases for new in cases):return {'status':'rejected','reason':'repair_cannot_change_original_expected_results'}
                cases=original_cases+[case for case in cases if case not in original_cases]
            staged=await asyncio.to_thread(self.stage,proposal['name'],proposal['description'],proposal['code'],cases,proposal['capabilities'],context,[{'failed_job':failed_job}] if failed_job else [])
            if staged.get('tool_id'):
                with self.lock:
                    data=self.load();data.setdefault('developments',{})[development]={'tool_id':staged['tool_id'],'attempts':prior.get('attempts',0)+1,'updated':now()};atomic(self.path,data)
                validated=await self.validate(staged['tool_id'],context)
                if validated.get('status')=='validation_failed' and prior.get('attempts',0)<1:return {'status':'waiting_for_retry','next_attempt':time.time()+65,'reason':'one_tested_correction_pending','tool_id':staged['tool_id']}
                return validated
            return staged
        except BudgetPaused as paused:return {'status':'waiting_for_quota','next_attempt':paused.until,'reason':paused.reason}
        except ModelUnavailable:return {'status':'staged','reason':'background_model_unavailable'}
        except (ValueError,KeyError,TypeError,SyntaxError) as exc:return {'status':'rejected','reason':'invalid_learned_tool_proposal','validation_error':safe(str(exc))[:160]}
    def repair_candidates(self,purpose):
        # Inspect bounded application source, never secrets, configuration or archives.
        words=set(__import__('re').findall(r'[a-z]{4,}',str(purpose).lower()));items=[]
        from .repair_regressions import cases_for
        for path in (self.repo/'astra_ai'/'ui').rglob('*.py'):
            if path.name in PROTECTED or any(part in {'node_modules','dist','tests','test_backend file'} for part in path.parts) or path.stat().st_size>500000:continue
            try:source=path.read_text(encoding='utf-8');tree=ast.parse(source)
            except (OSError,SyntaxError,UnicodeError):continue
            for fn in tree.body:
                if not isinstance(fn,ast.FunctionDef) or fn.decorator_list or len(fn.args.args)!=1 or fn.args.defaults or fn.args.vararg or fn.args.kwarg:continue
                fragment=ast.get_source_segment(source,fn)
                if len(fragment)>3000 or not words.intersection(set(__import__('re').findall(r'[a-z]{4,}',(path.stem+' '+fn.name+' '+(ast.get_docstring(fn) or '')).lower()))):continue
                try:self._pure_repair(fragment,fn.name)
                except ValueError:continue
                fixtures=cases_for(self.repo,path,fn.name)
                if fixtures:items.append({'target':str(path.relative_to(self.repo)),'function':fn.name,'source':fragment,'trusted_cases':fixtures[:8]})
                if len(items)>=4:return items
        return items
    def _pure_repair(self,code,name):
        validate_code(code.replace('def '+name+'(','def run(',1))
        tree=ast.parse(code);fn=tree.body[0]
        if not isinstance(fn,ast.FunctionDef) or len(fn.args.args)!=1 or fn.args.defaults or fn.args.vararg or fn.args.kwarg or fn.args.kwonlyargs or fn.decorator_list:raise ValueError('Pure single-argument function required')
        local={name,*[a.arg for a in fn.args.args]}
        for node in ast.walk(fn):
            if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Store):local.add(node.id)
            if isinstance(node,(ast.Import,ast.ImportFrom)):local.update(a.asname or a.name.split('.')[0] for a in node.names)
        allowed={'len','str','int','float','bool','list','dict','tuple','set','sorted','sum','min','max','abs','round','range','enumerate','zip','any','all','isinstance','ValueError','TypeError','KeyError','Exception'}
        attributes={'get','items','values','keys','copy','strip','lstrip','rstrip','lower','upper','casefold','replace','split','join','startswith','endswith','append','extend','count','index','sort','reverse','update','setdefault','pop','isoformat','fromisoformat','sqrt','ceil','floor','loads','dumps'}
        if any(isinstance(n,ast.Name) and isinstance(n.ctx,ast.Load) and n.id not in local|allowed for n in ast.walk(fn)):raise ValueError('Module-global access requires review')
        if any(isinstance(n,ast.Attribute) and n.attr not in attributes for n in ast.walk(fn)):raise ValueError('Non-pure method requires review')
        return fn
    async def develop_repair(self,purpose,context,failed_job=''):
        if self.load().get('metadata',{}).get('paused'):return {'status':'waiting_for_retry','next_attempt':time.time()+60,'reason':'learning_paused'}
        candidates=await asyncio.to_thread(self.repair_candidates,purpose)
        if not candidates or not self.model:return {'status':'staged','reason':'no_eligible_reproducible_target'}
        schema={'type':'object','additionalProperties':False,'properties':{'target':{'type':'string'},'function':{'type':'string'},'replacement':{'type':'string'},'input_json':{'type':'string'},'expected_json':{'type':'string'}},'required':['target','function','replacement','input_json','expected_json']}
        try:
            proposal=await asyncio.to_thread(self.model.structured,'Diagnose only these supplied pure functions and trusted cases. Propose one minimal single-function fix with one reproducible JSON failing input and expected output. Preserve the signature. Never change permissions, tests, credentials or validation. Return empty strings when no supported fix exists.',{'failure':safe(purpose)[:1000],'candidates':candidates,'sourced_context':await asyncio.to_thread(self.learning_context,purpose,context,failed_job)},schema,2000)
            if not any(c['target']==proposal['target'] and c['function']==proposal['function'] for c in candidates):return {'status':'staged','reason':'no_supported_fix'}
            staged=await asyncio.to_thread(self.stage_repair,proposal['target'],proposal['function'],proposal['replacement'],[{'input':json.loads(proposal['input_json']),'expected':json.loads(proposal['expected_json'])}],context,failed_job)
            if staged.get('repair_id'):return await self.apply_repair(staged['repair_id'],context)
            return staged
        except BudgetPaused as paused:return {'status':'waiting_for_quota','next_attempt':paused.until,'reason':paused.reason}
        except ModelUnavailable:return {'status':'staged','reason':'background_model_unavailable'}
        except (ValueError,KeyError,TypeError):return {'status':'rejected','reason':'invalid_repair_proposal'}
    def _runtime_replace(self,target,code):
        module='.'.join(target.relative_to(self.repo).with_suffix('').parts);loaded=sys.modules.get(module)
        if not loaded:return
        namespace={};exec(compile(code,'<validated-routine-repair>','exec'),namespace)
        for name,value in namespace.items():
            existing=getattr(loaded,name,None)
            if callable(value) and hasattr(value,'__code__') and hasattr(existing,'__code__'):existing.__code__=value.__code__
    def stage_repair(self,target,function_name,new_function,tests,context,failed_job=''):
        path=(self.repo/target).resolve()
        if not path.is_relative_to(self.repo) or not path.exists() or path.suffix!='.py':return {'status':'rejected','reason':'invalid_repair_target'}
        if not isinstance(tests,list) or not 1<=len(tests)<=12 or any(not isinstance(t,dict) or set(t)!={'input','expected'} or len(json.dumps(t))>16000 for t in tests) or safe(json.dumps(tests,ensure_ascii=False))!=json.dumps(tests,ensure_ascii=False):return {'status':'rejected','reason':'invalid_repair_fixtures'}
        old=path.read_text(encoding='utf-8');tree=ast.parse(old);function=next((n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==function_name),None)
        if not function or function.decorator_list:return {'status':'rejected','reason':'pure_top_level_function_required'}
        replacement=ast.parse(new_function)
        if len(replacement.body)!=1 or not isinstance(replacement.body[0],ast.FunctionDef) or replacement.body[0].name!=function_name:return {'status':'rejected','reason':'function_only_patch_required'}
        old_function='\n'.join(old.splitlines()[function.lineno-1:function.end_lineno])
        renamed_old=old_function.replace('def '+function_name+'(','def run(',1);renamed_new=new_function.replace('def '+function_name+'(','def run(',1)
        try:self._pure_repair(old_function,function_name);self._pure_repair(new_function,function_name)
        except ValueError:return {'status':'rejected','reason':'repair_requires_nonroutine_review'}
        risk='high' if path.name in PROTECTED or any(word in function_name.lower() for word in ('auth','secret','permission','delete','migrat','security','validat','sandbox','approve')) or not path.is_relative_to(self.repo/'astra_ai'/'ui') else 'routine'
        rid=stable('repair',target,function_name,new_function);directory=self.root/'repairs'/rid;directory.mkdir(parents=True,exist_ok=True)
        lines=old.splitlines(keepends=True);updated=''.join(lines[:function.lineno-1])+new_function.rstrip()+'\n'+''.join(lines[function.end_lineno:]);backup=directory/'original.py';backup.write_bytes(path.read_bytes());(directory/'replacement.py').write_text(updated,encoding='utf-8')
        item={'id':rid,'target':str(path.relative_to(self.repo)),'function':function_name,'old_hash':hashlib.sha256(path.read_bytes()).hexdigest(),'new_hash':hashlib.sha256((directory/'replacement.py').read_bytes()).hexdigest(),'backup':str(backup.relative_to(self.root)),'replacement':str((directory/'replacement.py').relative_to(self.root)),'old_function':renamed_old,'new_function':renamed_new,'tests':tests,'state':'staged','risk':risk,'failed_job':failed_job,'created':now(),'profile_id':context.get('profile_id',''),'project_id':context.get('project_id','')}
        with self.lock:data=self.load();data['repairs'][rid]=item;atomic(self.path,data)
        return {'status':'staged','repair_id':rid,'risk':risk}
    async def apply_repair(self,rid,context):
        result=await asyncio.to_thread(self.get,rid,context)
        if result['status']!='ok':return result
        repair=result['item']
        if repair.get('state')=='applied':return {'status':'duplicate','repair_id':rid}
        if repair['risk']=='high' and repair.get('approved_hash')!=repair['new_hash']:return {'status':'waiting_for_approval','repair_id':rid}
        from .repair_regressions import cases_for
        trusted=await asyncio.to_thread(cases_for,self.repo,self.repo/repair['target'],repair['function'])
        if not trusted:return {'status':'staged','reason':'trusted_regressions_required','repair_id':rid}
        if not isinstance(repair['tests'],list) or not repair['tests']:return {'status':'rejected','reason':'regression_fixtures_required'}
        async with self.cpu:
            if not self.sandbox.verified:await asyncio.to_thread(self.sandbox.verify)
            if not self.sandbox.verified:return {'status':'staged','reason':'OS_isolation_unavailable','repair_id':rid}
            reproduced=False
            for case in trusted+repair['tests']:
                old=await asyncio.to_thread(self.sandbox.run,repair['old_function'],case['input']);new=await asyncio.to_thread(self.sandbox.run,repair['new_function'],case['input'])
                reproduced|=old.get('status')!='ok' or old.get('result')!=case['expected']
                if new.get('status')!='ok' or new.get('result')!=case['expected']:return {'status':'rejected','reason':'repair_regression_failed'}
            if not reproduced:return {'status':'rejected','reason':'no_reproduced_failure'}
        target=(self.repo/repair['target']).resolve()
        if hashlib.sha256(self._path(repair['backup']).read_bytes()).hexdigest()!=repair['old_hash']:return {'status':'rejected','reason':'rollback_artifact_changed'}
        if not target.is_relative_to(self.repo) or hashlib.sha256(target.read_bytes()).hexdigest()!=repair['old_hash']:return {'status':'conflict','reason':'repair_target_changed'}
        with self.lock:data=self.load();data['repairs'][rid].update(state='applying',validated_at=now());atomic(self.path,data)
        try:
            self._replace(target,self._path(repair['replacement']).read_bytes())
            if hashlib.sha256(target.read_bytes()).hexdigest()!=repair['new_hash']:raise OSError('Repair verification failed')
            self._runtime_replace(target,repair['new_function'].replace('def run(','def '+repair['function']+'(',1))
            with self.lock:data=self.load();data['repairs'][rid]['state']='applied';data['audit'].append({'id':rid,'event':'applied','at':now()});atomic(self.path,data)
            return {'status':'applied','repair_id':rid,'validated':True,'regression_count':len(trusted)+len(repair['tests'])}
        except Exception:
            self._replace(target,self._path(repair['backup']).read_bytes())
            self._runtime_replace(target,repair['old_function'].replace('def run(','def '+repair['function']+'(',1))
            with self.lock:data=self.load();data['repairs'][rid]['state']='rolled_back';atomic(self.path,data)
            return {'status':'failed','reason':'repair_rolled_back'}
    def rollback(self,rid,context):
        result=self.get(rid,context)
        if result['status']!='ok':return result
        repair=result['item'];target=(self.repo/repair['target']).resolve()
        if not target.is_relative_to(self.repo) or hashlib.sha256(target.read_bytes()).hexdigest()!=repair['new_hash']:return {'status':'conflict','reason':'repair_target_changed'}
        self._replace(target,self._path(repair['backup']).read_bytes())
        self._runtime_replace(target,repair['old_function'].replace('def run(','def '+repair['function']+'(',1))
        with self.lock:data=self.load();data['repairs'][rid]['state']='rolled_back';atomic(self.path,data)
        return {'status':'rolled_back','repair_id':rid}
    def approve(self,item_id,expected_hash,context):
        # Called only from the human HTTP review endpoint, never a model tool.
        with self.lock:
            data=self.load();item=data['tools'].get(item_id) or data['repairs'].get(item_id)
            if not item or not matches_scope(item,context.get('profile_id',''),context.get('project_id','')):return {'status':'not_found'}
            if expected_hash!=item.get('new_hash',item.get('hash')):return {'status':'conflict','reason':'artifact_changed'}
            item['approved_hash']=expected_hash;item['approved_at']=now();data['audit'].append({'id':item_id,'event':'human_approved','hash':expected_hash,'at':now()});atomic(self.path,data)
            return {'status':'approved','id':item_id}
    def _replace(self,path,content):
        temporary=path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp');temporary.write_bytes(content);os.replace(temporary,path)
