"""Owner-only, configured repository reads. No shell, subprocess or edit endpoint."""
import asyncio
from fastapi import HTTPException,Request
from fastapi.responses import JSONResponse
from astra_ai.core.work.repository_inputs import RepositoryInputs,RepositoryError

def install(app,*,owner_only,orchestrator):
    async def call(request,method,*args):
        owner_only(request)
        try:return JSONResponse(await asyncio.to_thread(method,*args),headers={'Cache-Control':'no-store'})
        except RepositoryError as error:raise HTTPException(422,str(error).replace('_',' ')) from None
        except (OSError,ValueError):raise HTTPException(422,'Source could not be read') from None

    def service():return RepositoryInputs(orchestrator().settings)

    @app.get('/api/work/repositories')
    async def repositories(request:Request):return await call(request,service().list)

    @app.get('/api/work/repositories/{name}/files')
    async def files(name:str,request:Request):return await call(request,service().files,name)

    @app.get('/api/work/repositories/{name}/source')
    async def source(name:str,request:Request,path:str,start:int=1,end:int=120):
        return await call(request,service().read,name,path,start,end)

