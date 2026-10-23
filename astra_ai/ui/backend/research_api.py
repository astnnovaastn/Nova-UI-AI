"""Research orchestration controls, separate from the legacy server entrypoint."""
import asyncio
import time
import re
from fastapi import HTTPException, Request
from astra_ai.core.research.providers import ProviderRegistry, ResearchRouter
from astra_ai.core.research_learning import scope
from astra_ai.core.research_sessions import root_id


def register_research_api(app, writer, settings, artifacts, context, jobs, paths):
    def owner(request):
        ctx=context(request)
        if ctx.get('guest') or request.headers.get('x-nova-paired-device'):
            raise HTTPException(403,'Research administration is available on the host only.')
        return ctx

    @app.get('/api/settings/research-fallback')
    async def fallback_status(request:Request):
        owner(request);model=writer()
        return model.status() if isinstance(model,ResearchRouter) else {'enabled':False,'configured':False,'models':[],'effective_provider':getattr(model,'provider','none'),'cooperative_enabled':False}

    @app.post('/api/settings/research-fallback')
    async def configure_fallback(request:Request):
        owner(request);body=await request.json()
        if type(body.get('enabled')) is not bool:raise HTTPException(422,'Choose whether research fallback is enabled.')
        updates={'NOVA_RESEARCH_GROQ_FALLBACK':'1' if body['enabled'] else '0'}
        if 'cooperative' in body:
            if type(body['cooperative']) is not bool:raise HTTPException(422,'Choose whether cooperative research is enabled.')
            updates['NOVA_RESEARCH_GROQ_COOPERATIVE']='1' if body['cooperative'] else '0'
        if 'models' in body:
            from astra_ai.core.research.providers import PRODUCTION_MODELS
            models=body['models']
            if not isinstance(models,list) or not 1<=len(models)<=2 or any(not isinstance(m,str) or m not in PRODUCTION_MODELS for m in models) or len(set(models))!=len(models):raise HTTPException(422,'Choose distinct supported research models.')
            updates['NOVA_RESEARCH_GROQ_MODELS']=','.join(models)
        current=writer()
        await settings().activate(current.provider,current.model_provider() if current.provider!='none' else None,extra=updates)
        return await fallback_status(request)

    @app.get('/api/settings/research-models')
    async def discover(request:Request,refresh:bool=False):
        owner(request);service=settings();key=service.settings('NOVA_RESEARCH_GROQ_API_KEY') or service.settings('GROQ_API_KEY')
        if not key:raise HTTPException(409,'Save a Groq research credential first.')
        model=writer();registry=model.registry if isinstance(model,ResearchRouter) else ProviderRegistry(paths.usage/'research-models.json')
        try:return {'models':await asyncio.to_thread(registry.models,key,refresh)}
        except Exception:raise HTTPException(503,'Groq model discovery is unavailable; check the saved credential and connection.') from None

    @app.post('/api/settings/research-fallback/test')
    async def writing_test(request:Request):
        owner(request);model=writer();body=await request.json()
        if not isinstance(model,ResearchRouter) or not model.status()['enabled']:raise HTTPException(409,'Enable Gemini research with Groq backup first.')
        operation=body.get('operation_id')
        if not isinstance(operation,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{8,128}',operation):raise HTTPException(422,'A stable writing-test operation ID is required.')
        return await asyncio.to_thread(model.verify_fallback,operation)

    @app.post('/api/research/{identifier}/fallback-consent')
    async def consent(identifier:str,request:Request):
        ctx=owner(request);body=await request.json()
        if type(body.get('allow')) is not bool:raise HTTPException(422,'Choose whether private evidence may be sent to Groq.')
        store,_=artifacts();found=await asyncio.to_thread(store.get,identifier,ctx)
        if found.get('status')!='ok':raise HTTPException(404,'Research unavailable')
        root=root_id(store.snapshot(),identifier)
        await asyncio.to_thread(store.request_state,root,ctx,groq_private_allowed=body['allow'])
        # Only consent-paused operations in this authorized conversation are woken.
        with jobs.lock:
            data=jobs.load();changed=False;catalog=store.snapshot()
            for job in data.get('jobs',{}).values():
                if scope(job.get('context',{}))!=scope(ctx):continue
                for action in job.get('actions',[]):
                    result=action.get('result') or {};target=result.get('research_id') or action.get('arguments',{}).get('research_id')
                    if target and root_id(catalog,target)==root and result.get('reason')=='groq_private_consent_required':
                        action['next_attempt']=time.time()+1;changed=True
            if changed:jobs.write(data)
        return {'status':'saved','research_session_id':root,'allow_private':body['allow']}

    @app.get('/api/settings/research-storage')
    async def storage_status(request:Request):
        owner(request);store,_=artifacts();data=await asyncio.to_thread(store.snapshot)
        return {'provider_metrics':writer().journal.summary() if isinstance(writer(),ResearchRouter) else {},'layout':'folders' if store.repository else 'legacy','schema_version':1,
                'pages':len(data.get('requests',{})),'publications':len(data.get('artifacts',{})),
                'drafts':len(data.get('drafts',{})),'backup_policy':{'daily':7,'migration':1}}
