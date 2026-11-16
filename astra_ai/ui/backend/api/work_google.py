"""Explicit, owner-only Google reads. OAuth callback uses one-time state and PKCE."""
import asyncio
import logging
from fastapi import HTTPException, Request
from fastapi.responses import HTMLResponse
from astra_ai.core.work.google_accounts import GoogleAccounts, AccountError


class OAuthAccessFilter(logging.Filter):
    """The authorization code and state must not appear in standard Uvicorn access logs."""
    def filter(self, record):
        if isinstance(record.args, tuple):
            record.args=tuple(value.split('?',1)[0]+'?[redacted]' if isinstance(value,str) and value.startswith('/api/work/google/callback?') else value for value in record.args)
        return True


def install(app, *, context_for, owner_only, orchestrator):
    logger=logging.getLogger('uvicorn.access')
    if not any(isinstance(f,OAuthAccessFilter) for f in logger.filters):logger.addFilter(OAuthAccessFilter())
    accounts = None

    def service():
        nonlocal accounts
        if accounts is None:
            work = orchestrator()
            accounts = GoogleAccounts(work.store.root, work.settings)
        return accounts

    def owner(request):
        owner_only(request)
        context = context_for(request)
        if context.get('guest'):
            raise HTTPException(403, 'Owner account required')
        return context

    async def call(method, *args):
        try:
            return await asyncio.to_thread(method, *args)
        except AccountError as error:
            raise HTTPException(409, str(error).replace('_', ' ')) from None

    @app.get('/api/work/google')
    async def status(request: Request):
        context = owner(request)
        return await call(service().status, context)

    @app.post('/api/work/google/connect')
    async def connect(request: Request):
        context = owner(request)
        body = await request.json()
        return await call(service().begin, context, body.get('services') if isinstance(body, dict) else None)

    @app.get('/api/work/google/callback')
    async def callback(state: str = '', code: str = ''):
        # No credentials, account content, URL parameters or provider errors are reflected in HTML.
        try:
            await asyncio.to_thread(service().complete, state, code)
            text, status = 'Google connected. Return to AEGIS and refresh Connections.', 200
        except AccountError:
            text, status = 'Authorization was cancelled, expired or unsuccessful. Return to AEGIS and try again.', 400
        return HTMLResponse('<!doctype html><title>AEGIS Connections</title><p>'+text+'</p>',
                            status_code=status, headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
                            'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"})

    @app.delete('/api/work/google')
    async def disconnect(request: Request):
        context = owner(request)
        return await call(service().disconnect, context)

    @app.get('/api/work/google/messages')
    async def messages(request: Request, query: str = '', limit: int = 10):
        context = owner(request)
        result = await call(service().messages, context, query, limit)
        from fastapi.responses import JSONResponse
        return JSONResponse(result, headers={'Cache-Control':'no-store'})

    @app.get('/api/work/google/events')
    async def events(request: Request, start: str, end: str, limit: int = 50):
        context = owner(request)
        result = await call(service().events, context, start, end, limit)
        from fastapi.responses import JSONResponse
        return JSONResponse(result, headers={'Cache-Control':'no-store'})

