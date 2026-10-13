"""Runtime dispatch for learned services, shared by text, voice and durable jobs."""
import asyncio,time,json
async def dispatch(name,args,context,operation_id,research,capabilities):
    action=args.get('action','list')
    if action in {'run','develop','develop_repair'} and not context.get('job_id'):return {'status':'rejected','reason':'durable_worker_context_required'}
    if name=='research_action':
        if action=='request':return await asyncio.to_thread(research.request,args.get('query',''),context,operation_id,True,bool(args.get('refresh')))
        if action=='run':return await research.run(args.get('research_id',''),context)
        if action=='list':return await asyncio.to_thread(research.listing,context)
        if action in {'get','read'}:return await asyncio.to_thread(research.get,args.get('research_id',''),context,action=='read')
        if action in {'pause','resume'}:
            await asyncio.to_thread(capabilities.control,action=='pause')
            return await asyncio.to_thread(research.control,action=='pause')
    if name=='capability_action':
        if action=='status':return await asyncio.to_thread(capabilities.status)
        if action=='list':return await asyncio.to_thread(capabilities.listing,context,args.get('offset',0),args.get('limit',20))
        if action=='get':return await asyncio.to_thread(capabilities.get,args.get('tool_id',''),context)
        if action=='invoke':
            value=args.get('arguments',{})
            if 'input_json' in args:
                if not isinstance(args['input_json'],str) or len(args['input_json'])>16000:return {'status':'rejected','reason':'invalid_tool_input'}
                try:value=json.loads(args['input_json'])
                except ValueError:return {'status':'rejected','reason':'invalid_tool_input'}
            return await capabilities.invoke(args.get('tool_id',''),value,context,operation_id)
        if action=='validate':return await capabilities.validate(args.get('tool_id',''),context)
        if action=='learn':return await asyncio.to_thread(capabilities.jobs.submit,[{'name':'capability_action','arguments':{'action':'develop','purpose':args.get('purpose',''),'failed_job':args.get('failed_job','')}}],context,operation_id)
        if action=='repair':return await asyncio.to_thread(capabilities.jobs.submit,[{'name':'capability_action','arguments':{'action':'develop_repair','purpose':args.get('purpose',''),'failed_job':args.get('failed_job','')}}],context,operation_id)
        if action=='develop_repair':return await capabilities.develop_repair(args.get('purpose',''),context,args.get('failed_job',''))
        if action=='develop':
            if context.get('repair_for'):
                repaired=await capabilities.develop_repair(args.get('purpose',''),context,args.get('failed_job',''))
                if repaired.get('status') in {'waiting_for_quota','waiting_for_retry'}:return repaired
                if repaired.get('status')=='applied':
                    return await asyncio.to_thread(capabilities.jobs.retry,context['repair_for'],repaired['repair_id'],True)
            result=await capabilities.learn(args.get('purpose',''),context,args.get('failed_job',''))
            if result.get('status')=='activated' and context.get('repair_for') and 'repair_index' in context:
                item=capabilities.get(result['tool_id'],context).get('item',{})
                original=capabilities.jobs.list(context['repair_for']).get('job',{}).get('actions',[])
                index=context['repair_index']
                if index<len(original) and original[index]['name'] in item.get('capabilities',[]):capabilities.jobs.install_recovery(context['repair_for'],index,result['tool_id'])
            return result
    return {'status':'rejected','reason':'unknown_learning_action'}
