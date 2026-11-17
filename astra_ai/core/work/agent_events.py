"""One execution-event schema for simulated and live Work runs (AEGIS V24).

The Agent Execution Lab's simulator emits `AgentEvent`s (`work-canvas/lab/src/agent/types.ts`). A live
run records research-trace events (`orchestrator._emit`). This module projects the second onto the
first, so both modes can be shown, compared and replayed by the same views. It is a read-only
projection: no event is created here, nothing is invented, and relations stay lines, not events.
"""
from __future__ import annotations

EVENT_KINDS = (
    'run_created', 'prompt_received', 'input_attached', 'skill_loaded', 'model_turn', 'plan_created',
    'task_queued', 'task_started', 'task_waiting', 'tool_called', 'tool_completed', 'tool_refused',
    'source_collected', 'approval_requested', 'user_approved', 'user_declined', 'artifact_created',
    'artifact_refused', 'task_completed', 'task_failed', 'run_completed', 'run_stopped',
)
#: Worker slot an AEGIS role runs on, for the event's actor.
ROLE_ACTOR = {'discovery': 'worker_a', 'analysis': 'worker_b', 'verification': 'worker_c', 'synthesis': 'worker_e'}
AGENT_STATES = {'assigned': 'task_queued', 'running': 'task_started', 'done': 'task_completed', 'failed': 'task_failed', 'skipped': 'task_failed'}
TEXT = 400


def _text(value, limit=TEXT):
    return str(value or '')[:limit]


def project(rows, request=None):
    """Trace rows (as `ResearchTrace.read` returns them) → AgentEvents, in order."""
    out = []
    first = None
    open_tools = {}
    request = request or {}

    def add(kind, actor, label, row, **extra):
        nonlocal first
        at = float(row.get('at') or 0)
        if first is None:
            first = at
        event = {
            'seq': len(out) + 1, 'id': 'e' + str(len(out) + 1), 't': int(round((at - first) * 1000)) if at else 0,
            'kind': kind, 'actor': actor, 'label': _text(label, 200), 'origin': 'aegis',
            'zephium': extra.pop('zephium', ''), 'trace_seq': row.get('seq', 0),
        }
        event.update({key: value for key, value in extra.items() if value not in (None, '', {}, [])})
        out.append(event)
        return event

    for row in rows or []:
        kind, status = row.get('kind'), row.get('status', 'done')
        if kind == 'stage':
            stage = row.get('stage', '')
            if stage == 'received':
                add('run_created', 'app', 'Run admitted', row, zephium='BeginAgent admitted',
                    data={'workflow': request.get('workflow', ''), 'engine': request.get('engine', 'v1')})
                add('prompt_received', 'person', _text(request.get('query', 'Request'), 200), row, zephium='objective in context_text')
            elif stage == 'skill':
                add('skill_loaded', 'lead', row.get('label', ''), row, zephium='WorkRuntimeUpdate::Input', data={'skill': row.get('skill', ''), 'version': row.get('version', '')})
            elif stage in ('planned', 'allocated'):
                data = {key: row[key] for key in ('sections', 'complexity', 'signals', 'skipped', 'second_analyst', 'writer', 'max_active_workers') if key in row}
                add('plan_created', 'lead', row.get('label', ''), row, detail=_text(row.get('detail', '')), data=data, zephium='none: AEGIS plan IR')
            elif stage == 'question':
                add('approval_requested', 'lead', row.get('question', row.get('label', '')), row, zephium='Ask', decision='clarification', data={'options': row.get('options', [])})
            elif stage == 'finished':
                add('run_completed', 'lead', row.get('label', 'Run complete'), row, zephium='Finish step',
                    data={key: row[key] for key in ('tokens', 'calls', 'sources', 'workers') if key in row})
            elif status == 'running':
                add('model_turn', row.get('agent', 'lead') if row.get('agent') else 'lead', row.get('label', stage), row, step=stage, zephium='Turn step (status line)')
        elif kind == 'agent':
            mapped = AGENT_STATES.get(row.get('state', ''))
            if mapped:
                role = row.get('role', '')
                add(mapped, ROLE_ACTOR.get(role, row.get('agent', role)), (role or 'worker').capitalize() + ' ' + row.get('state', ''), row,
                    part=row.get('agent', ''), zephium='WorkRuntimeUpdate::Part', detail=_text(row.get('task', '') or row.get('summary', '')),
                    data={key: row[key] for key in ('provider', 'model', 'role') if row.get(key)}, error=row.get('failure', ''))
        elif kind == 'task':
            mapped = {'done': 'task_completed', 'failed': 'task_failed'}.get(status)
            if mapped:
                add(mapped, 'app', 'Task ' + row.get('task_id', ''), row, step=row.get('task_id', ''), zephium='none: AEGIS task graph', error=row.get('reason', ''))
        elif kind in ('search', 'read', 'images'):
            tool = {'search': 'web_search', 'read': 'web_fetch', 'images': 'image_discovery'}[kind]
            key = (tool, row.get('query') or row.get('url') or '')
            if status == 'running':
                open_tools[key] = add('tool_called', 'worker_a' if kind != 'images' else 'app', (row.get('query') or row.get('title') or row.get('url') or tool), row,
                                      tool=tool, zephium='BeginStep')['id']
            else:
                add('tool_completed', 'worker_a' if kind != 'images' else 'app', (row.get('query') or row.get('title') or tool), row, tool=tool,
                    cause=open_tools.pop(key, ''), zephium='SettleStep', error=row.get('reason', '') if status == 'failed' else '',
                    data={key2: row[key2] for key2 in ('count',) if key2 in row})
        elif kind == 'source':
            add('source_collected', 'worker_a', row.get('title') or row.get('url', ''), row, zephium='LeadRun::cite',
                data={'url': row.get('url', ''), 'query': row.get('query', '')})
        elif kind == 'canvas_object':
            accepted = row.get('status') == 'accepted' or status == 'accepted'
            add('artifact_created' if accepted else 'artifact_refused', 'lead', row.get('object_id', ''), row, zephium='Publish step + artifact' if accepted else 'propose fault',
                data={'object_id': row.get('object_id', ''), 'revision': row.get('revision', 0)})
    return out
