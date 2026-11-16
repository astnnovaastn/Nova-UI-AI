"""Zephium ResourceCall contract on AEGIS's canonical task store.
No execution is started by presentation changes. Owner scope is supplied by the API.
"""
import json
import uuid
from datetime import date
from astra_ai.ui.backend.v21_workspace import digest
from astra_ai.ui.backend.task_backend.store import decode


def seconds(value):
    return str(int(value)//1000) if value is not None else None

def record(row):
    return dict(id=row['id'],revision=row['revision'],created_at=seconds(row['createdAt']),updated_at=seconds(row['updatedAt']),trashed=row['deleted'],draft=dict(title=row['title'],pinned=bool(row['pinned']),related=[],content=dict(kind='task',description=row['description'],completed=row['status']=='done',status=row['status'],assignee=row['assignee'],origin=row['origin'],due_date=row['dueDate'],due_time=row['dueTime'],context=row['context'],sort_key=row['sortKey'],work=row['work'],details=dict(list=row['list'],inbox=bool(row['inbox']),priority=row['priority'],steps=row['steps'],completed_at=seconds(row['completedAt']),deadline=row['deadline'],duration=row['duration']))))


def summary(row):
    content=record(row)['draft']['content']
    return dict(id=row['id'],revision=row['revision'],title=row['title'],pinned=bool(row['pinned']),updated_at=seconds(row['updatedAt']),**{k:content[k] for k in ('completed','due_date','due_time','status','assignee','origin','context','sort_key','work')})


def metadata(row):
    return dict(id=row['id'],list=row['list'],inbox=bool(row['inbox']),priority=row['priority'],steps=len(row['steps']),steps_done=row['stepDone'],completed_at=seconds(row['completedAt']),deadline=row['deadline'],duration=row['duration'])


def field_patch(f):
    name=f['field']
    if name in {'title','description','status','priority','steps','pinned'}:return {name:f['value']}
    if name=='schedule':return {'dueDate':f['date'],'dueTime':f['time']}
    if name=='deadline':return {'deadline':f['date']}
    if name=='duration':return {'duration':f['minutes']}
    if name=='organization':return {'list':f['list'],'inbox':f['inbox']}
    if name=='position':return {'sortKey':f['sort_key']}
    raise ValueError('invalid')


class TaskResources:
    def __init__(self,presentation):
        self.tasks=presentation
        self.store=presentation.store

    def call(self,owner,call):
        self.store._ensure()
        with self.store._lock,self.store.connection() as conn:
            conn.execute('CREATE TABLE IF NOT EXISTS workspace_resource_receipts (owner TEXT, request TEXT, fingerprint TEXT, response TEXT, PRIMARY KEY(owner,request))')
            conn.execute('CREATE TABLE IF NOT EXISTS workspace_task_lists (owner TEXT, id TEXT, title TEXT, revision INTEGER, deleted INTEGER DEFAULT 0, PRIMARY KEY(owner,id))')
        try:
            with self.store._lock:
                return self._call(owner,call)
        except KeyError:return {'kind':'error','error':'not_found'}
        except (ValueError,TypeError,AttributeError):return {'kind':'error','error':'invalid'}

    def _row(self,conn,owner,id):
        task=decode(conn.execute('SELECT * FROM tasks WHERE owner_id=? AND id=?',(owner,id)).fetchone())
        if not task:raise KeyError(id)
        return self.tasks.project(task)

    def _call(self,owner,call):
        kind=call.get('kind')
        if kind=='acknowledge':return {'kind':'acknowledged'} # Keep durable retry receipts.
        if kind=='get':
            with self.store.connection() as conn:return {'kind':'record','record':record(self._row(conn,owner,call['id']))}
        if kind in {'list_tasks','task_overview'}:
            rows=self.tasks.rows(owner)+self.tasks.rows(owner,True)
            q=call.get('query',{});today=q.get('today') or call.get('today') or date.today().isoformat()
            def member(row,view):
                if row['deleted']:return view=='trash'
                if view=='trash':return False
                if view=='completed':return row['status']=='done'
                if row['status']=='done':return False
                due=row['dueDate']
                return {'all':True,'inbox':row['inbox'],'today':bool(due and due<=today),'overdue':bool(due and due<today),'upcoming':bool(due and due>today)}.get(view,False)
            counts={v:sum(bool(member(r,v)) for r in rows) for v in ('inbox','today','overdue','upcoming','all','completed','trash')}
            with self.store.connection() as conn:
                lists=[dict(id=x['id'],title=x['title'],revision=str(x['revision']),deleted=False,count=sum(r['list']==x['id'] and not r['deleted'] and r['status']!='done' for r in rows)) for x in conn.execute('SELECT * FROM workspace_task_lists WHERE owner=? AND deleted=0 ORDER BY title,id',(owner,))]
            # Legacy project names remain visible without rewriting historical tasks.
            known={x['id'] for x in lists}
            lists += [dict(id=id,title=id,revision='0',deleted=False,count=sum(r['list']==id and not r['deleted'] for r in rows)) for id in sorted({r['list'] for r in rows if r['list'] and r['list'] not in known})]
            if kind=='task_overview':return dict(kind=kind,lists=lists,counts=counts)
            search=str(q.get('search','')).casefold()
            found=[r for r in rows if (member(r,q.get('view','all')) or (search and not r['deleted'] and q.get('view')!='trash')) and (not q.get('list') or r['list']==q['list']) and search in (r['title']+' '+r['description']).casefold()]
            offset=max(0,int(q.get('after') or 0));limit=min(100,max(1,int(q.get('limit',100))))
            page=found[offset:offset+limit]
            return dict(kind='task_page',lists=lists,counts=counts,items=[summary(r) for r in page],metadata=[metadata(r) for r in page],next=str(offset+limit) if offset+limit<len(found) else None)
        if kind!='mutate':return {'kind':'error','error':'unavailable'}
        command=call['command'];request=command['request_id'];intent=command['intent'];action=intent['kind']
        if command.get('version')!=1 or not isinstance(request,str) or not 1<=len(request)<=200:raise ValueError('invalid')
        fingerprint=digest(json.dumps(command,sort_keys=True))
        with self.store.connection() as conn:
            previous=conn.execute('SELECT * FROM workspace_resource_receipts WHERE owner=? AND request=?',(owner,request)).fetchone()
            if previous:return json.loads(previous['response']) if previous['fingerprint']==fingerprint else {'kind':'error','error':'invalid'}
        # Canonical create has its own durable idempotency, so a crash before the
        # receipt write still cannot create a duplicate task on retry.
        if action=='create':
            draft=intent['draft'];c=draft['content'];d=c.get('details') or {}
            if c.get('kind')!='task':raise ValueError('invalid')
            row=self.tasks.create(owner,dict(title=draft['title'],description=c.get('description',''),pinned=draft.get('pinned',False),status=c.get('status','open'),dueDate=c.get('due_date'),dueTime=c.get('due_time'),context=c.get('context'),**{k:d.get(k) for k in ('list','inbox','priority','deadline','duration')},steps=d.get('steps',[])),'resource:'+request)
        with self.store.connection() as conn:
            if action.endswith('task_list'):
                id=intent.get('id') or uuid.uuid4().hex
                existing=conn.execute('SELECT * FROM workspace_task_lists WHERE owner=? AND id=?',(owner,id)).fetchone()
                revision=existing['revision'] if existing else 0
                if action!='create_task_list' and str(revision)!=intent.get('expected_revision'):return {'kind':'error','error':'conflict'}
                title=str(intent.get('title') or (existing['title'] if existing else id)).strip()[:64]
                if not title:raise ValueError('invalid')
                deleted=action=='delete_task_list'
                conn.execute('INSERT OR REPLACE INTO workspace_task_lists VALUES (?,?,?,?,?)',(owner,id,title,revision+1,int(deleted)))
                if deleted:
                    for t in conn.execute('SELECT * FROM tasks WHERE owner_id=?',(owner,)).fetchall():
                        r=self.tasks.project(decode(t))
                        if r['list']==id:self.tasks.change(owner,r['id'],{'list':None,'inbox':True},r['revision'],_conn=conn)
                response=dict(kind='task_list_applied',request_id=request,list=dict(id=id,title=title,revision=str(revision+1),deleted=deleted,count=0))
            else:
                if action!='create':
                    row=self._row(conn,owner,intent['id']);patch={}
                    if action=='update_task':
                        for expected in intent.get('expect',[]):
                            if any(row.get(k)!=v for k,v in field_patch(expected).items()):return {'kind':'error','error':'conflict'}
                        for field in intent['set']:patch.update(field_patch(field))
                    elif action in {'trash','restore'}:
                        if row['revision']!=intent.get('expected_revision'):return {'kind':'error','error':'conflict'}
                        patch={'deleted':action=='trash'}
                    else:return {'kind':'error','error':'unavailable'}
                    row=self.tasks.change(owner,row['id'],patch,row['revision'],_conn=conn)
                response=dict(kind='applied',request_id=request,applied_revision=row['revision'],record=record(row))
            conn.execute('INSERT INTO workspace_resource_receipts VALUES (?,?,?,?)',(owner,request,fingerprint,json.dumps(response)))
            return response
