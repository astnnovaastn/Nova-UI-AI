"""Owner-only adapter for the original Zephium Notes and Tasks interfaces."""
import json
from fastapi import HTTPException, Request
from astra_ai.ui.backend.v21_workspace import NotesLibrary, TaskPresentation, digest


def install(app, *, state, task_store, owner_only, task_owner, isolated=None):
    def changed(data):
        state.notes_data = data['notes']
        state.notes_summaries = data.get('summaries', [])
    notes = NotesLibrary(state.notes_state_dir, state.notes_state_lock, changed)
    tasks = TaskPresentation(task_store)
    from astra_ai.ui.backend.v22_task_resources import TaskResources
    resources = TaskResources(tasks)

    def authorize(request):
        owner_only(request)
        return task_owner(request)

    @app.get('/api/workspace/v21/execution')
    def execution_status(request: Request):
        authorize(request)
        if isolated is None: return {'available':False,'reason':'Isolated execution is not configured.','repositories':[]}
        return {**isolated.availability(),**{'repositories':isolated.repositories.list()['repositories']}}

    @app.post('/api/workspace/v21/execution')
    def execution_propose(request: Request, payload: dict):
        owner=authorize(request)
        if isolated is None:raise HTTPException(503,'Isolated execution unavailable')
        try:return isolated.propose(owner,payload)
        except (ValueError,OSError) as e:raise HTTPException(422,str(e))

    @app.post('/api/workspace/v21/execution/{id}/{action}')
    def execution_decide(id: str, action: str, request: Request, payload: dict):
        owner=authorize(request)
        if isolated is None:raise HTTPException(503,'Isolated execution unavailable')
        try:
            if action=='run':return isolated.execute(owner,id,payload.get('approval'))
            if action=='cancel':return isolated.cancel(owner,id)
            if action=='apply':return isolated.apply(owner,id,payload.get('approval'))
            raise ValueError('Unknown action')
        except (ValueError,OSError) as e:raise HTTPException(409,str(e))

    @app.get('/api/workspace/v21/execution/{id}')
    def execution_record(id: str, request: Request):
        owner=authorize(request)
        if isolated is None:raise HTTPException(503,'Isolated execution unavailable')
        try:return isolated.get(owner,id)
        except (ValueError,OSError):raise HTTPException(404,'Execution record not found')

    @app.post('/api/workspace/v21/notes')
    def note_call(request: Request, payload: dict):
        authorize(request)
        call = payload.get('call')
        if not isinstance(call, dict): raise HTTPException(422, 'A typed Notes call is required')
        if call.get('kind') in {'create', 'write'} and not isinstance(call.get('request_id'), str):
            raise HTTPException(422, 'A stable request ID is required')
        try: response = notes.call(call)
        except (ValueError, TypeError): raise HTTPException(409, 'Notes could not be read safely; existing data was preserved')
        return {'profile': payload.get('expectedProfile'), 'response': response}

    @app.post('/api/workspace/v22/resources')
    def resource_call(request: Request, payload: dict):
        owner=authorize(request)
        call=payload.get('call')
        if not isinstance(call,dict):raise HTTPException(422,'Typed resource call required')
        return {'profile':payload.get('expectedProfile'),'response':resources.call(owner,call)}

    @app.get('/api/workspace/v21/tasks')
    def task_list(request: Request, trash: bool = False):
        return {'items': tasks.rows(authorize(request), trash)}

    @app.get('/api/workspace/v21/notes/export')
    def note_export(request: Request):
        authorize(request)
        with notes.lock:
            return {'items':[{'id':n['id'],'revision':notes.summary(n)['revision'],'markdown':n.get('content','')}
                for n in notes.read()['notes'] if not n.get('deleted_at')][:1000]}

    @app.post('/api/workspace/v21/tasks')
    def task_create(request: Request, payload: dict):
        owner = authorize(request)
        key = payload.get('request_id')
        if not isinstance(key, str) or not 1 <= len(key) <= 200: raise HTTPException(422, 'Stable request ID required')
        try: return tasks.create(owner, payload, 'v21:' + key)
        except ValueError as e: raise HTTPException(422, str(e))

    @app.patch('/api/workspace/v21/tasks/{id}')
    def task_change(id: str, request: Request, payload: dict):
        owner = authorize(request)
        try: return tasks.change(owner, id, payload, payload.get('revision'))
        except KeyError: raise HTTPException(404, 'Task not found')
        except ValueError as e: raise HTTPException(409, str(e))

    @app.post('/api/workspace/v21/from-result')
    def from_result(request: Request, payload: dict):
        owner = authorize(request)
        obj = payload.get('object', {})
        if not isinstance(obj, dict) or not obj.get('id') or not obj.get('title'): raise HTTPException(422, 'Result identity required')
        # Explicit click saves public output only. It never starts a task or agent.
        body = '# ' + str(obj['title']) + '\n\n' + str(obj.get('body') or obj.get('caption') or '')
        structured = {k:obj[k] for k in ('columns','rows','entries','nodes','edges','url','language','recommendations','recommendationKind','planTotal') if obj.get(k)}
        if structured:
            body += '\n\n```json\n' + json.dumps(structured, ensure_ascii=False, indent=2) + '\n```'
        for source in obj.get('sources', [])[:100]:
            if isinstance(source, dict): body += '\n\n' + str(source.get('title', '')) + ' ' + str(source.get('url', ''))
        # Object IDs can be reused in separate runs. Include the saved public
        # content so a different result never aliases an earlier note or task.
        key = digest(str(owner) + ':' + str(obj.get('run_id', '')) + ':' + str(obj['id']) + ':' + str(obj.get('revision', 1)) + ':' + body)
        provenance = {k:obj[k] for k in ('id','revision','task_id','run_id','kind','sources') if k in obj}
        if payload.get('action') == 'note':
            return notes.call({'kind':'create','request_id':'result:'+key,'markdown':body,'provenance':provenance})
        if payload.get('action') == 'task' and obj.get('kind') in {'calendar','timeline'} and obj.get('entries'):
            # An explicit Make tasks click creates drafts, never scheduled executions.
            from datetime import date,datetime,timezone
            drafts=[]
            for index,entry in enumerate(obj['entries'][:100]):
                if not isinstance(entry,dict) or not str(entry.get('label','')).strip():raise HTTPException(422,'Every plan task needs a title')
                due=entry.get('date')
                if not due and isinstance(entry.get('start'),(int,float)) and abs(entry['start'])<1e11:
                    try:due=datetime.fromtimestamp(entry['start']*60,timezone.utc).date().isoformat()
                    except (ValueError,OverflowError,OSError):raise HTTPException(422,'Invalid plan timestamp')
                if due:
                    try:date.fromisoformat(due)
                    except (ValueError,TypeError):raise HTTPException(422,'Invalid plan date')
                drafts.append({'title':entry['label'],'description':str(entry.get('detail') or ''),'dueDate':due,'provenance':{**provenance,'entry':index}})
            rows=[tasks.create(owner,draft,'result:'+key+':'+str(index)) for index,draft in enumerate(drafts)]
            return {'kind':'tasks_created','items':rows}
        if payload.get('action') == 'task':
            return tasks.create(owner, {'title':obj['title'],'description':body,'provenance':provenance}, 'result:'+key)
        raise HTTPException(422, 'Unknown result action')

    return notes, tasks
