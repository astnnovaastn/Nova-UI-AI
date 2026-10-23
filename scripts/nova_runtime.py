"""Loopback-only controller; owns exactly one Nova backend process."""
import asyncio
import os
from pathlib import Path
import secrets
import subprocess
import sys
import time
import uuid

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / 'astra_ai/ui/backend/server.py'
TOKEN = secrets.token_urlsafe(32)
app = FastAPI()
child = None
operation = {'state': 'starting', 'operationId': None, 'error': None}
lock = asyncio.Lock()
worker = None
handles = []

@app.middleware('http')
async def local_control(request: Request, call_next):
    origin = request.headers.get('origin')
    if origin and origin not in {'http://127.0.0.1:5173', 'http://localhost:5173'}:
        return JSONResponse(status_code=403, content={'error': 'Local Nova origin required'})
    if request.method == 'POST' and request.headers.get('x-nova-control') != '1' and request.headers.get('x-nova-runtime-token') != TOKEN:
        return JSONResponse(status_code=403, content={'error': 'Control header required'})
    return await call_next(request)

async def healthy():
    try:
        async with httpx.AsyncClient(timeout=1) as client:
            response = await client.get('http://127.0.0.1:8340/api/health')
        return response.status_code == 200 and response.json().get('status') == 'healthy'
    except Exception:
        return False

async def stop_child():
    global child
    if child is None or child.poll() is not None:
        return
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post('http://127.0.0.1:8340/api/runtime/shutdown', headers={'X-Nova-Runtime-Token': TOKEN})
        await asyncio.to_thread(child.wait, 8)
    except Exception:
        if child.poll() is None:
            child.terminate()
            try:
                await asyncio.to_thread(child.wait, 5)
            except subprocess.TimeoutExpired:
                child.kill()
                await asyncio.to_thread(child.wait)

async def launch():
    global child
    log_root=Path(os.environ.get('NOVA_STATE_DIR') or dotenv_values(ROOT/'.env').get('NOVA_STATE_DIR') or ROOT/'state')/'logs'
    log_root.mkdir(parents=True,exist_ok=True)
    for handle in handles:
        handle.close()
    handles.clear()
    out = open(log_root / 'backend-console.log', 'ab', buffering=0)
    err = open(log_root / 'backend-errors.log', 'ab', buffering=0)
    handles.extend([out, err])
    env = {**os.environ, 'NOVA_RUNTIME_TOKEN': TOKEN, 'PYTHONUNBUFFERED': '1'}
    child = subprocess.Popen([sys.executable, str(BACKEND)], cwd=BACKEND.parent, env=env, stdout=out, stderr=err)
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        if child.poll() is not None:
            raise RuntimeError('Backend exited during startup. Check the backend logs.')
        if await healthy():
            return
        await asyncio.sleep(.25)
    raise RuntimeError('Backend did not become ready within 120 seconds. Check migration and backend logs.')

async def restart():
    async with lock:
        operation.update(state='restarting', error=None)
        try:
            await stop_child()
            await launch()
            operation.update(state='ready')
        except Exception as exc:
            operation.update(state='failed', error=str(exc))

@app.on_event('startup')
async def startup():
    global worker
    if await healthy():
        operation.update(state='failed', error='A backend is already running outside this supervisor. Stop Nova and launch it again.')
        return
    worker = asyncio.create_task(restart())

@app.on_event('shutdown')
async def shutdown():
    if worker and not worker.done():
        worker.cancel()
        await asyncio.gather(worker, return_exceptions=True)
    await stop_child()
    for handle in handles:
        handle.close()

@app.get('/api/runtime/status')
async def status():
    return {**operation, 'backendPid': child.pid if child and child.poll() is None else None, 'healthy': await healthy()}

@app.post('/api/runtime/restart', status_code=202)
async def request_restart():
    global worker
    if worker is None or worker.done():
        operation.update(state='restarting', operationId=uuid.uuid4().hex, error=None)
        worker = asyncio.create_task(restart())
    return dict(operation)

@app.post('/api/runtime/recover', status_code=202)
async def request_recovery():
    if await healthy():
        return {'state': 'ready', 'healthy': True, 'action': 'reconnect'}
    return await request_restart()

@app.post('/api/runtime/stop')
async def request_stop():
    asyncio.get_running_loop().call_later(.2, lambda: setattr(http_server, 'should_exit', True))
    return {'state': 'stopping'}

if __name__ == '__main__':
    http_server = uvicorn.Server(uvicorn.Config(app, host='127.0.0.1', port=8341, log_level='warning'))
    http_server.run()
