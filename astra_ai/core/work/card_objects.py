"""Validated create/read/revise operations. No tools, URLs or code execute here.

Adapted from Zephium work_lead/objects.rs create/read/revise contracts (MPL-2.0).
Stable AEGIS object IDs retain immutable revisions and optimistic concurrency.
"""
from copy import deepcopy
import hashlib
import json
import math
import re
from urllib.parse import urlsplit
from .card_catalog import FAMILIES, PRESETS, find, read

MAX_BYTES = 1024 * 1024
COLLECTION_LIMIT = 10000
FIELDS = {'title','body','caption','language','url','columns','rows','columnKinds','entries','nodes','edges',
          'sources','recommendations','recommendationKind','planTotal','planMode','chartKind','orientation',
          'diagramDirection','metricPanels','media','blocks','series','provenance','row_ids','groups'}
COLLECTIONS = {'entries','nodes','edges','recommendations','media','blocks','series','groups'}
URL_FIELDS = {'url','image','src'}
STATES = {'partial','complete','needs-review'}


class CardFault(ValueError):
    def __init__(self, code, path='', detail=''):
        self.code, self.path, self.detail = code, path, detail
        super().__init__(f'{code}: {path} {detail}'.strip())

def fault(code, path='', detail=''):
    raise CardFault(code, path, detail)

def _url(value, path):
    if not isinstance(value, str): fault('invalid_url', path)
    try:
        u = urlsplit(value)
        if u.scheme not in {'https','http'} or not u.hostname or u.username or u.password: fault('invalid_url', path)
    except ValueError: fault('invalid_url', path)

def _walk(value, path='', depth=0):
    if depth > 16: fault('nesting_limit', path)
    if isinstance(value, float) and not math.isfinite(value): fault('nonfinite_number', path)
    if isinstance(value, dict):
        for k,v in value.items():
            if k in {'html','script','javascript','component','css','onClick'}: fault('executable_content', path+'/'+k)
            if k in URL_FIELDS and v: _url(v,path+'/'+k)
            _walk(v,path+'/'+k,depth+1)
    elif isinstance(value, list):
        if len(value)>COLLECTION_LIMIT: fault('collection_limit',path,'Split into linked objects; nothing was truncated.')
        for i,v in enumerate(value): _walk(v,f'{path}/{i}',depth+1)
    elif value is not None and not isinstance(value,(str,bool,int,float)): fault('invalid_value',path)

def _ids(items, path):
    ids=[]
    for i,item in enumerate(items):
        if not isinstance(item,dict) or not isinstance(item.get('id'),str) or not item['id']: fault('missing_item_id',f'{path}/{i}')
        ids.append(item['id'])
    if len(ids)!=len(set(ids)): fault('duplicate_item_id',path)
    return set(ids)

def validate(payload, family, preset, state, evidence):
    if family not in FAMILIES: fault('unknown_family','family')
    spec=PRESETS.get(preset)
    if not spec or spec['family']!=family or not spec['available']: fault('unavailable_preset','preset')
    if state not in STATES: fault('invalid_state','state')
    if not isinstance(payload,dict): fault('invalid_payload')
    if set(payload)-FIELDS: fault('unknown_fields',detail=','.join(sorted(set(payload)-FIELDS)))
    if len(json.dumps(payload,ensure_ascii=False,allow_nan=False).encode())>MAX_BYTES: fault('object_size_limit')
    _walk(payload)
    if not isinstance(payload.get('title'),str) or not payload['title'].strip(): fault('missing_title','title')
    for key in ('body','caption','language','url'):
        if key in payload and not isinstance(payload[key],str): fault('invalid_text',key)
    for key in COLLECTIONS:
        if key in payload:
            if not isinstance(payload[key],list): fault('invalid_collection',key)
            _ids(payload[key],key)
    source_ids={e['id'] for e in evidence}
    for source in payload.get('sources',[]):
        if not isinstance(source,dict) or source.get('id') not in source_ids: fault('unknown_evidence','sources')
    if not isinstance(payload.get('sources',[]),list): fault('invalid_sources','sources')
    for ref in payload.get('provenance',[]):
        if not isinstance(ref,dict) or ref.get('basis') not in {'sourced','supplied','calculated','proposal','unknown'}: fault('invalid_provenance','provenance')
        if not isinstance(ref.get('path'),str) or not ref['path'].startswith('/'): fault('invalid_provenance_path','provenance')
        if not isinstance(ref.get('source_ids',[]),list) or not set(ref.get('source_ids',[]))<=source_ids: fault('unknown_evidence','provenance')
        if ref['basis']=='sourced' and not ref.get('source_ids'): fault('missing_evidence','provenance')
        if ref['basis']=='calculated' and not ref.get('calculation'): fault('missing_calculation','provenance')
        cursor=payload
        try:
            for part in ref['path'].split('/')[1:]: cursor=cursor[int(part)] if isinstance(cursor,list) else cursor[part.replace('~1','/').replace('~0','~')]
        except (KeyError,IndexError,ValueError,TypeError): fault('unresolved_provenance_path',ref['path'])
    for key,options in {'chartKind':{'bars','line','area'},'orientation':{'horizontal','vertical'},'diagramDirection':{'right','down'},'planMode':{'calendar','schedule'}}.items():
        if key in payload and payload[key] not in options: fault('invalid_choice',key)
    if 'rows' in payload:
        cols=payload.get('columns')
        if not isinstance(cols,list) or not cols or not all(isinstance(c,str) for c in cols): fault('invalid_columns','columns')
        rows=payload['rows']
        if not isinstance(rows,list) or any(not isinstance(r,list) or len(r)!=len(cols) for r in rows): fault('invalid_rows','rows')
        row_ids=payload.get('row_ids',[])
        if len(row_ids)!=len(rows) or not all(isinstance(r,str) and r for r in row_ids) or len(set(row_ids))!=len(row_ids): fault('invalid_row_ids','row_ids')
    node_ids={n['id'] for n in payload.get('nodes',[])}
    for edge in payload.get('edges',[]):
        if edge.get('source') not in node_ids or edge.get('target') not in node_ids: fault('unresolved_edge','edges')
    if family=='category-map' and payload.get('edges'): fault('category_map_has_edges','edges','Use a connected diagram for relationships.')
    for e in payload.get('entries',[]):
        if 'value' in e and e['value'] is not None and (isinstance(e['value'],bool) or not isinstance(e['value'],(int,float))): fault('invalid_number','entries')
        if e.get('date'):
            from datetime import date
            try: date.fromisoformat(e['date'])
            except (ValueError,TypeError): fault('invalid_date','entries')
    for b in payload.get('blocks',[]):
        if b.get('kind') not in {'paragraph','heading','quote','bullets','figure','image'}: fault('invalid_block_kind','blocks')
    if family=='test' and state=='complete': fault('execution_record_required','state','Model-authored test output is a proposal or needs review.')
    if state=='complete':
        for field in FAMILIES[family]['required']:
            if field=='media' and payload.get('url'): continue
            if not payload.get(field): fault('missing_required_content',field)
    for field in spec.get('requires',[]):
        if not payload.get(field): fault('incompatible_preset',field)
    # Source display metadata is resolved by the application, never invented by the model.
    result=deepcopy(payload)
    lookup={e['id']:e for e in evidence}
    result['sources']=[{k:lookup[s['id']].get(k,'') for k in ('id','title','url')} for s in payload.get('sources',[])]
    return result

def read_canvas(run, ids=None):
    objects=run.canvas_objects
    if ids is not None: objects=[o for o in objects if o['id'] in ids]
    return deepcopy(objects)

def apply(run, command):
    """Pure run-state transaction. The caller must persist before emitting events."""
    if not isinstance(command,dict): fault('invalid_command')
    if set(command)-{'op','command_id','object_id','expected_revision','family','preset','state','payload'}: fault('unknown_command_fields')
    op=command.get('op'); cid=command.get('command_id'); oid=command.get('object_id')
    if op not in {'create','revise'}: fault('invalid_operation')
    if not all(isinstance(i,str) and re.fullmatch(r'[A-Za-z0-9_.:-]{1,160}',i) for i in (cid,oid)): fault('invalid_identity')
    fingerprint=hashlib.sha256(json.dumps(command,sort_keys=True,allow_nan=False).encode()).hexdigest()
    state=deepcopy(getattr(run,'card_state',{}) or {})
    receipts=state.setdefault('receipts',{})
    if cid in receipts:
        if receipts[cid]['fingerprint']!=fingerprint: fault('command_id_reused')
        return dict(receipts[cid]['result'],replayed=True)
    current=next((o for o in run.canvas_objects if o['id']==oid),None)
    if op=='create' and current: fault('object_exists','object_id')
    if op=='revise' and not current: fault('object_missing','object_id')
    expected=command.get('expected_revision')
    if type(expected) is not int or expected!=(current['revision'] if current else 0): fault('stale_revision','expected_revision',str(current['revision'] if current else 0))
    payload=validate(command.get('payload'),command.get('family'),command.get('preset'),command.get('state'),run.evidence)
    revision=expected+1
    obj=dict(payload,id=oid,kind=FAMILIES[command['family']]['kind'],revision=revision,contract_version=26,
             family=command['family'],preset=command['preset'],status=command['state'],task_id=run.stage or 'write')
    if current and current.get('user_edited'):
        state.setdefault('proposals',{})[cid]=obj
        result=dict(status='review-required',object_id=oid,revision=expected)
    else:
        history=state.setdefault('history',{}).setdefault(oid,[])
        if current and not history: history.append(deepcopy(current))
        history.append(deepcopy(obj))
        run.canvas_objects=[o for o in run.canvas_objects if o['id']!=oid]+[obj]
        result=dict(status='accepted',object_id=oid,revision=revision)
    receipts[cid]=dict(fingerprint=fingerprint,result=result)
    run.card_state=state
    return result

def merge_projection(existing, projected):
    """Publication never discards already accepted typed objects."""
    ids={o['id'] for o in existing}
    return existing+[o for o in projected if o['id'] not in ids]

COMMAND_SCHEMA={'type':'object','additionalProperties':False,'required':['commands'],'properties':{'commands':{
    'type':'array','items':{'type':'object','additionalProperties':False,
    'required':['op','command_id','object_id','expected_revision','family','preset','state','payload_json'],
    'properties':{'op':{'type':'string','enum':['create','revise']},'command_id':{'type':'string'},'object_id':{'type':'string'},
      'expected_revision':{'type':'integer'},'family':{'type':'string','enum':list(FAMILIES)},'preset':{'type':'string'},
      'state':{'type':'string','enum':sorted(STATES)},'payload_json':{'type':'string'}}}}}}
