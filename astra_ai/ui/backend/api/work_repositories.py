"""Owner-only repository access: configured repositories and folders the person chose in AEGIS Desktop.

Reads (inventory, tree, source, dependencies, bounded context, the real git change) never execute project
code. The only write is a reviewed edit to a folder whose grant allows saving, after the person approves
that exact change (dev_edits.py). No shell endpoint; tests run only in the isolated workspace.
"""
import asyncio
from pathlib import Path
from fastapi import HTTPException,Request
from fastapi.responses import JSONResponse
from astra_ai.core.work.repository_inputs import RepositoryInputs,RepositoryError
from astra_ai.core.work import authorized_folders
from astra_ai.core.work.repo_index import git_changes

OWNER='owner'

def install(app,*,owner_only,orchestrator):
    async def call(request,method,*args):
        owner_only(request)
        try:return JSONResponse(await asyncio.to_thread(method,*args),headers={'Cache-Control':'no-store'})
        except RepositoryError as error:raise HTTPException(422,str(error).replace('_',' ')) from None
        except (OSError,ValueError) as error:
            reason=str(error) if isinstance(error,ValueError) and str(error).replace('_','').isalpha() else 'Source could not be read'
            raise HTTPException(422,reason.replace('_',' ')) from None

    def service():return RepositoryInputs(orchestrator().settings)
    def edits():
        from astra_ai.core.work.dev_edits import ReviewedEdits
        repos=service();store=getattr(orchestrator(),'store',None)
        state=Path(store.root).parent if store is not None and getattr(store,'root',None) else repos.grants_file.parent
        return ReviewedEdits(state,repos)

    @app.get('/api/work/repositories')
    async def repositories(request:Request):return await call(request,service().list)

    @app.get('/api/work/repositories/{name}/files')
    async def files(name:str,request:Request):return await call(request,service().files,name)

    @app.get('/api/work/repositories/{name}/source')
    async def source(name:str,request:Request,path:str,start:int=1,end:int=120):
        return await call(request,service().read,name,path,start,end)

    # V33 developer access

    @app.get('/api/work/repositories/{name}/tree')
    async def tree(name:str,request:Request):
        def build():
            index=service().index(name);scan=index.scan()
            return {'repository':name,'tree':index.tree(),'files':len(scan.files),'skipped':dict(sorted(scan.skipped.items())),
                    'ignored':scan.ignored_dirs[:30],'truncated':scan.truncated,'errors':scan.errors[:20]}
        return await call(request,build)

    @app.get('/api/work/repositories/{name}/dependencies')
    async def dependencies(name:str,request:Request):
        def build():
            index=service().index(name);deps=index.dependencies()
            return {'repository':name,**index.modules(),'stats':deps['stats'],'files':deps['files'],
                    'most_imported':sorted(((p,len(v)) for p,v in deps['importers'].items()),key=lambda kv:(-kv[1],kv[0]))[:15]}
        return await call(request,build)

    @app.get('/api/work/repositories/{name}/context')
    async def context(name:str,request:Request,q:str='',path:str='',budget:int=16000):
        return await call(request,lambda:service().index(name).select_context(q[:400],[path] if path else [],max(1000,min(budget,24000))))

    @app.get('/api/work/repositories/{name}/changes')
    async def changes(name:str,request:Request,base:str='',head:str='',staged:bool=False):
        return await call(request,lambda:{'repository':name,**git_changes(service().root(name),base=base,head=head,staged=staged)})

    @app.get('/api/work/repositories/{name}/text')
    async def text(name:str,request:Request,path:str):
        """A whole file for editing, only in a folder whose grant allows saving approved changes."""
        def load():
            target,raw=edits()._target(name,path)
            import hashlib
            return {'repository':name,'path':path,'text':raw.decode('utf-8'),'sha256':hashlib.sha256(raw).hexdigest()}
        return await call(request,load)

    @app.post('/api/work/repositories/{name}/edits')
    async def propose(name:str,request:Request):
        body=await request.json()
        return await call(request,edits().propose,OWNER,name,str(body.get('path','')),body.get('text'),str(body.get('base_sha','')),str(body.get('reason','')))

    @app.post('/api/work/repositories/{name}/edits/{edit_id}/{action}')
    async def decide(name:str,edit_id:str,action:str,request:Request):
        body=await request.json() if action=='save' else {}
        if action=='save':return await call(request,edits().apply,OWNER,edit_id,str(body.get('approval','')))
        if action=='discard':return await call(request,edits().discard,OWNER,edit_id)
        raise HTTPException(404,'Unknown action')

    @app.delete('/api/work/repositories/{name}/grant')
    async def revoke(name:str,request:Request):
        # Removing access is always allowed; adding it happens only in the desktop dialog.
        return await call(request,lambda:{'revoked':authorized_folders.revoke(service().grants_file,name)})
