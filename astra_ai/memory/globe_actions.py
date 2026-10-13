"""Scoped globe edits delegate to existing validated, reversible storage operations."""
from .globe_projection import detail
from .category_policy import matches_scope

def execute(manager,record_id,payload,profile_id='',project_id=''):
    action=payload.get('action')
    if action not in {'update','forget','restore'}:return {'status':'rejected','reason':'invalid_action'}
    with manager._lock:
        if action=='restore':
            record=manager.load().get('forgotten_records',{}).get(record_id)
            if not record or not matches_scope(record,profile_id,project_id):return {'status':'not_found'}
            original=record.get('transcript_record',record)
            if original.get('private') or original.get('private_session') or original.get('attributes',{}).get('private_session') or original.get('consent') in {'denied','revoked','private','none'}:return {'status':'not_found'}
        else:record=detail(manager,record_id,profile_id,project_id).get("record")
        if not record:return {'status':'not_found'}
        expected=payload.get('expected_revision')
        if expected is not None and int(expected)!=record.get('revision',1):return {'status':'conflict','reason':'revision_conflict'}
        args={'record_id':record_id,'expected_revision':expected,'operation_id':str(payload.get('operation_id','')),'profile_id':profile_id,'project_id':project_id}
        if record.get('attributes',{}).get('transcript') or record.get('kind')=='transcript':
            return manager.transcript_action(action,content=payload.get('value',''),**args)
        if action=='update':args.update(value=payload.get('value'),metadata={'source':'human','evidence':str(payload.get('value',''))})
        return manager.memory_action(action,**args)
