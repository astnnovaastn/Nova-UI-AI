"""Loopback-only test host for the agent browser link. Only the agent-browser routes, plus one
test route that asks the connected desktop renderer for a page, as agent_browser.py will."""
import asyncio,sys
from pathlib import Path
import uvicorn
from fastapi import FastAPI,HTTPException
root=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(root))
from astra_ai.core.work import agent_browser_host
from astra_ai.core.work.agent_browser_host import RendererError
from astra_ai.ui.backend.api.work_agent_browser import install
app=FastAPI();install(app,owner_only=lambda _:None)
@app.get('/test/ask')
async def ask(action:str,url:str):
    call=agent_browser_host.renderer()
    if call is None:raise HTTPException(503,'no renderer')
    try:return {'ok':True,'result':await asyncio.to_thread(call,action,url)}
    except RendererError as error:return {'ok':False,'error':str(error)}
if __name__=='__main__':uvicorn.run(app,host='127.0.0.1',port=int(sys.argv[1]),log_level='warning')
