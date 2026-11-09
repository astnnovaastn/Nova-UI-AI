"""Routes for AEGIS Work runs. Model keys stay on the server; nothing here returns them."""
import asyncio
import uuid

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from astra_ai.core.work.catalog import WORKFLOWS
from astra_ai.core.work.contracts import MODES, WorkRequest
from astra_ai.memory.shared_memory import safe

MAX_CHOSEN = 24
MAX_VIEW_IDS = 400


def _chosen(rows):
    """Only descriptive fields of a chosen node pass through, bounded and with credentials redacted."""
    if not isinstance(rows, list):
        return []
    picked = []
    for row in rows[:MAX_CHOSEN]:
        if isinstance(row, dict):
            picked.append({key: safe(str(row.get(key, '')))[:600] for key in ('id', 'kind', 'title', 'url', 'summary') if row.get(key)})
    return picked


def _view_ids(value):
    if not isinstance(value, list) or len(value) > MAX_VIEW_IDS or any(not isinstance(item, str) or len(item) > 200 for item in value):
        raise HTTPException(422, 'Invalid canvas view')
    return list(dict.fromkeys(value))


def install(app, *, context_for, artifacts_for, jobs, orchestrator, owner_only, emit=None):
    def owner(request):
        context = context_for(request)
        if context.get('guest'):
            raise HTTPException(403, 'Owner research required')
        return context

    @app.post('/api/work/runs')
    async def create_run(request: Request):
        context = owner(request)
        body = await request.json()
        query = body.get('query', '')
        workflow = str(body.get('workflow') or '')
        mode = str(body.get('mode') or '')
        if workflow and workflow not in WORKFLOWS:
            raise HTTPException(422, 'Unknown workflow')
        if mode and mode not in MODES:
            raise HTTPException(422, 'Unknown mode')
        service = orchestrator()
        if not await asyncio.to_thread(service.router.route, 'lead'):
            raise HTTPException(409, 'No lead model is configured for AEGIS Work.')
        chosen_mode = mode or (WORKFLOWS[workflow].mode if workflow else '')
        storage_mode = 'quick' if chosen_mode in {'quick', 'direct'} else 'detailed'
        operation_id = str(body.get('operation_id') or uuid.uuid4().hex)
        artifacts, _ = artifacts_for()
        reserved = await asyncio.to_thread(artifacts.reserve, query, storage_mode, context, operation_id)
        if reserved['status'] != 'ok':
            return JSONResponse(reserved, status_code=400)
        from_research = str(body.get('from_research') or '')
        if from_research and (await asyncio.to_thread(artifacts.get, from_research, context)).get('status') != 'ok':
            raise HTTPException(404, 'Research unavailable')
        request_record = WorkRequest(query, workflow, mode, _chosen(body.get('chosen')), from_research)
        await asyncio.to_thread(service.create, reserved['id'], request_record, context)
        result = jobs.submit(
            [{'name': 'work_run', 'arguments': {'research_id': reserved['id']}}],
            {**context, 'requested_research': True}, reserved['operation_id'], goal=reserved['display_title'],
        )
        if result.get('status') not in {'accepted', 'queued', 'duplicate', 'completed'}:
            await asyncio.to_thread(artifacts.request_state, reserved['id'], context, phase='failed', waiting_reason=result.get('reason', 'job_not_admitted'))
        else:
            await asyncio.to_thread(artifacts.request_state, reserved['id'], context, job_id=result.get('job_id', ''))
        return {**result, 'research_id': reserved['id'], 'run_id': reserved['id'], 'thread_id': reserved['thread_id']}

    async def _visible_run(identifier, context):
        artifacts, _ = artifacts_for()
        metadata = await asyncio.to_thread(artifacts.request_state, identifier, context)
        if metadata.get('status') != 'ok':
            raise HTTPException(404, 'Run unavailable')
        return await asyncio.to_thread(orchestrator().store.get, identifier), metadata

    @app.get('/api/work/runs/{identifier}')
    async def read_run(identifier: str, request: Request):
        context = context_for(request)
        try:
            run, metadata = await _visible_run(identifier, context)
        except ValueError:
            raise HTTPException(404, 'Run unavailable') from None
        return {
            'status': 'ok',
            'run': orchestrator().store.public(run) if run else None,
            'view': metadata.get('canvas_view') or {'chosen': [], 'hidden': []},
        }

    @app.post('/api/work/runs/{identifier}/answer')
    async def answer(identifier: str, request: Request):
        context = owner(request)
        body = await request.json()
        text = str(body.get('text', '')).strip()
        if not text:
            raise HTTPException(422, 'An answer is required')
        run, metadata = await _visible_run(identifier, context)
        if not run:
            raise HTTPException(404, 'Run unavailable')
        result = await orchestrator().answer(identifier, context, text)
        if result['status'] == 'accepted':
            submitted = jobs.submit([{'name': 'work_run', 'arguments': {'research_id': identifier}}], {**context, 'requested_research': True}, uuid.uuid4().hex, goal=metadata.get('display_title', ''))
            await asyncio.to_thread(artifacts_for()[0].request_state, identifier, context, job_id=submitted.get('job_id', ''))
        return result

    @app.put('/api/work/runs/{identifier}/view')
    async def save_view(identifier: str, request: Request):
        """What this canvas chooses and hides. It never touches a report, source or citation."""
        context = owner(request)
        body = await request.json()
        view = {'chosen': _view_ids(body.get('chosen', [])), 'hidden': _view_ids(body.get('hidden', []))}
        artifacts, _ = artifacts_for()
        saved = await asyncio.to_thread(artifacts.request_state, identifier, context, canvas_view=view)
        if saved.get('status') != 'ok':
            raise HTTPException(404, 'Run unavailable')
        return {'status': 'ok', 'view': view}

    @app.get('/api/work/runs/{identifier}/layout')
    async def read_layout(identifier: str, request: Request):
        from astra_ai.core.work.canvas_layout import CanvasLayouts, LayoutError
        try:
            return {'status': 'ok', 'layout': await asyncio.to_thread(CanvasLayouts(artifacts_for()[0]).get, identifier, context_for(request))}
        except LayoutError as error:
            raise HTTPException(error.status, error.message) from None

    @app.put('/api/work/runs/{identifier}/layout')
    async def save_layout(identifier: str, request: Request):
        from astra_ai.core.work.canvas_layout import CanvasLayouts, LayoutError
        context = owner(request)
        raw = await request.body()
        if len(raw) > 1500000:
            raise HTTPException(413, 'Layout is too large')
        try:
            body = await request.json()
            layout = await asyncio.to_thread(CanvasLayouts(artifacts_for()[0]).put, identifier, context, body)
        except ValueError:
            raise HTTPException(422, 'Invalid layout JSON') from None
        except LayoutError as error:
            raise HTTPException(error.status, error.message) from None
        if emit:
            await emit(context, 'canvas_layout', identifier, {'revision': layout['revision'], 'operation_id': layout['operation_id']})
        return {'status': 'ok', 'layout': layout}

    @app.get('/api/settings/work-models')
    async def models(request: Request, check: bool = False):
        owner_only(request)
        service = orchestrator()
        return {
            **await asyncio.to_thread(service.status),
            **({'availability': await asyncio.to_thread(service.router.discover)} if check else {}),
        }
