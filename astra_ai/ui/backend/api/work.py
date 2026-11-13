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
        chosen_mode = WORKFLOWS[workflow].mode if workflow else mode
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

    # Skills (V7 4): the person's skill library. Only the owner changes it; pages and models never do.

    def _skills():
        service = orchestrator()
        registry = getattr(service, 'skills', None)
        if registry is None:
            raise HTTPException(503, 'Skills are unavailable')
        return registry

    def _skill_error(error):
        words = {'name': 'Use 1-40 lowercase letters, digits or dashes for the name.', 'description': 'Give a one-line description of at most 200 characters.',
                 'empty': 'The skill needs instructions.', 'too_large': 'The skill is larger than 16 KB.', 'no_frontmatter': 'The skill must start with a --- header.',
                 'too_many': 'You have the maximum number of skills.', 'not_found': 'No such skill.'}
        return HTTPException(422 if str(error) != 'not_found' else 404, words.get(str(error), 'Invalid skill'))

    @app.get('/api/work/skills')
    async def list_skills(request: Request):
        context_for(request)
        registry = _skills()
        return {'status': 'ok', 'skills': [skill.public() for skill in (await asyncio.to_thread(registry.all)).values()]}

    @app.get('/api/work/skills/{name}')
    async def read_skill(name: str, request: Request):
        context_for(request)
        skill = await asyncio.to_thread(_skills().get, name)
        if not skill:
            raise HTTPException(404, 'No such skill')
        from astra_ai.core.work.skills import render
        return {'status': 'ok', 'skill': skill.public(with_body=True), 'text': render(skill)}

    @app.put('/api/work/skills/{name}')
    async def save_skill(name: str, request: Request):
        owner(request)
        from astra_ai.core.work.skills import SkillError, parse
        body = await request.json()
        text = str(body.get('text', ''))
        try:
            if parse(text, 'user').name != name:
                raise HTTPException(422, 'The name in the header must match the skill being saved.')
            skill = await asyncio.to_thread(_skills().save, text)
        except SkillError as error:
            raise _skill_error(error) from None
        return {'status': 'ok', 'skill': skill.public(with_body=True)}

    @app.post('/api/work/skills/{name}/duplicate')
    async def duplicate_skill(name: str, request: Request):
        owner(request)
        from astra_ai.core.work.skills import SkillError
        body = await request.json()
        try:
            skill = await asyncio.to_thread(_skills().duplicate, name, str(body.get('name', '')))
        except SkillError as error:
            raise _skill_error(error) from None
        return {'status': 'ok', 'skill': skill.public()}

    @app.post('/api/work/skills/{name}/enabled')
    async def enable_skill(name: str, request: Request):
        owner(request)
        from astra_ai.core.work.skills import SkillError
        body = await request.json()
        try:
            await asyncio.to_thread(_skills().set_enabled, name, bool(body.get('enabled')))
        except SkillError as error:
            raise _skill_error(error) from None
        return {'status': 'ok', 'skill': (await asyncio.to_thread(_skills().get, name)).public()}

    @app.delete('/api/work/skills/{name}')
    async def delete_skill(name: str, request: Request):
        owner(request)
        from astra_ai.core.work.skills import SkillError
        try:
            await asyncio.to_thread(_skills().delete, name)
        except SkillError as error:
            raise _skill_error(error) from None
        return {'status': 'ok'}

    # Connections (V7 5): real status from the server's configuration; keys never leave it.

    @app.get('/api/work/connections')
    async def list_connections(request: Request):
        context_for(request)
        service = orchestrator()
        return {'status': 'ok', 'connections': await asyncio.to_thread(service.connections.list)}

    @app.post('/api/work/connections/{name}/enabled')
    async def enable_connection(name: str, request: Request):
        owner(request)
        body = await request.json()
        try:
            row = await asyncio.to_thread(orchestrator().connections.set_enabled, name, bool(body.get('enabled')))
        except ValueError:
            raise HTTPException(422, 'This connection cannot be turned on or off here.') from None
        return {'status': 'ok', 'connection': row}

    # The source browser's network (V7 6.5) and its Source Reader (V7 6.2 B).

    @app.get('/api/work/network')
    async def read_network(request: Request):
        context_for(request)
        return {'status': 'ok', 'proxy': await asyncio.to_thread(orchestrator().proxy.public)}

    @app.put('/api/work/network')
    async def save_network(request: Request):
        owner_only(request)
        from astra_ai.core.work.network import NetworkError
        body = await request.json()
        try:
            proxy = await asyncio.to_thread(orchestrator().proxy.save, body if isinstance(body, dict) else {})
        except NetworkError as error:
            raise HTTPException(422, {'mode': 'Choose off, HTTP, HTTPS or SOCKS5.', 'host': 'Enter the proxy host name or IP address.', 'port': 'Enter a port from 1 to 65535.',
                                      'username': 'The user name cannot contain : @ or /.'}.get(str(error), 'Invalid proxy settings')) from None
        return {'status': 'ok', 'proxy': proxy}

    @app.post('/api/work/network/test')
    async def test_network(request: Request):
        owner_only(request)
        from astra_ai.core.work.network import test_proxy
        return {'status': 'ok', 'result': await asyncio.to_thread(test_proxy, orchestrator().proxy)}

    @app.get('/api/work/reader')
    async def source_reader(request: Request, url: str = ''):
        context = context_for(request)
        if context.get('guest'):
            raise HTTPException(403, 'Owner research required')
        from astra_ai.core.work.network import NetworkError, reader_page
        try:
            return await asyncio.to_thread(reader_page, url, orchestrator().proxy)
        except NetworkError as error:
            return JSONResponse({'status': 'unavailable', 'reason': str(error)}, status_code=200)
        except Exception as error:
            return JSONResponse({'status': 'unavailable', 'reason': type(error).__name__}, status_code=200)
