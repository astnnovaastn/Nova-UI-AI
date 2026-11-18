"""The desktop renderer's connection point. Loopback only, token-authenticated, no browser origins."""
from fastapi import Request, WebSocket

from astra_ai.core.work import agent_browser_host

LOOPBACK = frozenset({'127.0.0.1', '::1'})
# A request that passed through a proxy or tunnel is not "this computer", whatever address it arrives from.
FORWARDED = ('forwarded', 'x-forwarded-for', 'x-real-ip', 'x-nova-paired-device')


def local_host_socket(websocket):
    """Only a program on this computer, not a web page: loopback peer, no Origin, no proxy headers."""
    client = getattr(websocket, 'client', None)
    if client is None or client.host not in LOOPBACK:
        return False
    headers = websocket.headers
    return not headers.get('origin') and not any(headers.get(name) for name in FORWARDED)


def install(app, *, owner_only, host=None):
    host = host or agent_browser_host.HOST

    @app.get('/api/work/agent-browser/status')
    async def agent_browser_status(request: Request):
        owner_only(request)
        return host.status()

    @app.websocket('/api/work/agent-browser/host')
    async def agent_browser_host_socket(websocket: WebSocket):
        if not local_host_socket(websocket):
            await websocket.close(code=1008)
            return
        await websocket.accept()
        await host.serve(websocket)
