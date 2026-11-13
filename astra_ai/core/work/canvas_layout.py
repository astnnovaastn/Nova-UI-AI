"""Provider-free, revisioned canvas metadata. Never reads or modifies report prose."""
import copy
import hashlib
import json
import math
import re

STRATEGIES = {'auto','pipeline','timeline','milestones','tree','hierarchy','dependency','swimlanes','evidence','subgraphs','radial','hub','comparison','matrix','gallery','editorial','cause','converging'}
MAX_NODES = 1000


class LayoutError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message
        super().__init__(message)


def empty():
    return dict(schema_version=1, revision=0, strategy='auto', automatic=False, operation_id='',
                positions={}, sizes={}, groups=[], constraints={}, previous=None)


def _id(value):
    if not isinstance(value, str) or not 1 <= len(value) <= 200 or any(ord(c)<32 for c in value):
        raise LayoutError(422, 'Invalid canvas identifier')
    return value


def _number(value, low, high):
    if isinstance(value, bool) or not isinstance(value, (int,float)) or not math.isfinite(value) or not low <= value <= high:
        raise LayoutError(422, 'Invalid canvas geometry')
    return round(value, 3)


def validate(value):
    if not isinstance(value, dict):
        raise LayoutError(422, 'Invalid canvas layout')
    result = {}
    for name, fields, low, high in [('positions', ('x','y'), -1000000,1000000), ('sizes', ('width','height'), 16,50000)]:
        rows=value.get(name,{})
        if not isinstance(rows,dict) or len(rows)>MAX_NODES:raise LayoutError(422,'Canvas is too large')
        result[name]={_id(key):{f:_number(row.get(f),low,high) for f in fields} for key,row in rows.items() if isinstance(row,dict)}
        if len(result[name])!=len(rows):raise LayoutError(422,'Invalid geometry record')
    if set(result['positions']) != set(result['sizes']):raise LayoutError(422,'Position and size identifiers must match')
    constraints=value.get('constraints',{})
    if not isinstance(constraints,dict) or len(constraints)>MAX_NODES:raise LayoutError(422,'Invalid constraints')
    result['constraints']={}
    for key,row in constraints.items():
        if key not in result['positions'] or not isinstance(row,dict) or any(k not in {'pinned','manual','lockedSize'} or not isinstance(v,bool) for k,v in row.items()):
            raise LayoutError(422,'Invalid node constraint')
        result['constraints'][key]=row.copy()
    groups=value.get('groups',[])
    if not isinstance(groups,list) or len(groups)>MAX_NODES:raise LayoutError(422,'Invalid groups')
    result['groups']=[]
    seen=set()
    for g in groups:
        if not isinstance(g,dict):raise LayoutError(422,'Invalid group')
        ident=_id(g.get('id'))
        if ident in seen:raise LayoutError(422,'Duplicate group')
        seen.add(ident)
        members=g.get('members',[])
        if not isinstance(members,list) or len(members)>MAX_NODES or any(not isinstance(m,str) or m not in result['positions'] for m in members):raise LayoutError(422,'Invalid group members')
        title=g.get('title','')
        if not isinstance(title,str) or len(title)>200:raise LayoutError(422,'Invalid group title')
        result['groups'].append(dict(id=ident,title=title,members=list(dict.fromkeys(members)),
            **{f:_number(g.get(f),-1000000,1000000) for f in ('x','y')},
            **{f:_number(g.get(f),16,1000000) for f in ('width','height')}))
    strategy=value.get('strategy','auto')
    if not isinstance(strategy,str) or strategy not in STRATEGIES or not isinstance(value.get('automatic',False),bool):raise LayoutError(422,'Invalid layout preference')
    return dict(**result,strategy=strategy,automatic=value.get('automatic',False))


class CanvasLayouts:
    def __init__(self, artifacts):
        self.artifacts=artifacts

    def _visible(self, data, identifier, context):
        from astra_ai.core.research.artifacts import scope
        from astra_ai.core.research_sessions import root_id
        row=data.get('requests',{}).get(identifier) or data.get('artifacts',{}).get(identifier)
        if not row or scope(row)!=scope(context) or identifier in data.get('removed',{}) or root_id(data,identifier) in data.get('removed',{}):
            raise LayoutError(404,'Research unavailable')
        return row

    def get(self, identifier, context):
        with self.artifacts.lock:
            data=self.artifacts.snapshot()
            row=self._visible(data,identifier,context)
            return copy.deepcopy(row.get('canvas_layout') or empty())

    def put(self, identifier, context, body):
        if context.get('guest') or context.get('background'):raise LayoutError(403,'Only the owner can arrange this canvas')
        if not isinstance(body,dict):raise LayoutError(422,'Invalid request')
        revision=body.get('expected_revision')
        operation=body.get('operation_id','')
        if type(revision) is not int or revision<0 or not isinstance(operation,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{8,100}',operation):
            raise LayoutError(422,'A revision and operation identity are required')
        if not isinstance(body.get('undo',False),bool):raise LayoutError(422,'Invalid Undo flag')
        if body.get('before') is not None and not isinstance(body['before'],dict):raise LayoutError(422,'Invalid previous geometry')
        proposal=validate(body.get('layout',{}))
        digest=hashlib.sha256(json.dumps({'layout':proposal,'undo':body.get('undo',False)},sort_keys=True).encode()).hexdigest()
        with self.artifacts.lock:
            data=self.artifacts.read({})
            row=self._visible(data,identifier,context)
            current=row.get('canvas_layout') or empty()
            receipts=row.get('canvas_layout_operations',[])
            receipt=next((r for r in receipts if r['id']==operation),None)
            if receipt:
                if receipt['digest']!=digest:raise LayoutError(409,'Operation was already used for another layout')
                return copy.deepcopy(current)
            if current['revision']!=revision:raise LayoutError(409,'Canvas changed in another window. Refresh the preview.')
            if body.get('undo'):
                if not current.get('previous'):raise LayoutError(409,'No saved arrangement to undo')
                proposal={**current['previous'],'strategy':current['strategy'],'automatic':current['automatic']}
            previous={key:copy.deepcopy(current[key]) for key in ('positions','sizes','groups','constraints')}
            # The first commit carries the real pre-arrangement snapshot for Undo.
            if not current['revision'] and body.get('before'):
                before=validate({**body['before'],'strategy':'auto','automatic':False})
                previous={key:before[key] for key in previous}
            record=dict(**proposal,schema_version=1,revision=revision+1,operation_id=operation,previous=previous)
            self.artifacts.backup_metadata()
            row['canvas_layout']=record
            row['canvas_layout_operations']=(receipts+[dict(id=operation,digest=digest)])[-100:]
            self.artifacts.write(data)
            return copy.deepcopy(record)

TEMPLATE_KINDS = {'request','plan','search','source','pipeline','discovery','analysis','verification','agent','images','videos','results','report','steps','map','group','other'}
TEMPLATE_PORTS = {'left','right','top','bottom'}
