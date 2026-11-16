"""V21 adapters: existing records remain canonical; upstream UI uses typed calls."""
from __future__ import annotations
from contextlib import nullcontext
import hashlib
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
from astra_ai.memory.shared_memory import atomic

def now():
    return datetime.now(timezone.utc).isoformat()

def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

class NotesLibrary:
    def __init__(self, directory, lock=None, changed=None):
        self.path = Path(directory) / "notes_state.json"
        self.lock = lock or threading.RLock()
        self.changed = changed or (lambda data: None)

    def read(self):
        if not self.path.exists():
            return {"notes": [], "summaries": []}
        data = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(data.get("notes"), list) or not isinstance(data.get("summaries", []), list):
            raise ValueError("Invalid Notes store; original file preserved")
        return data

    def save(self, data):
        atomic(self.path, data)
        self.changed(data)

    @staticmethod
    def summary(note):
        body = str(note.get("content", ""))
        lines = body.splitlines()
        title = str(note.get("title") or (lines[0].lstrip("# ").strip() if lines else "Untitled note"))
        def stamp(key):
            try: return str(int(datetime.fromisoformat(note[key].replace("Z", "+00:00")).timestamp()*1000))
            except (KeyError, ValueError): return "0"
        return {"id":note["id"],"revision":digest(body),"title":title,"preview":" ".join(lines[1:])[:300],
                "pinned":bool(note.get("pinned")),"trashed":bool(note.get("deleted_at")),
                "editable":len(body.encode("utf-8")) <= 4_000_000,"created_at":stamp("created_at"),
                "modified_at":stamp("updated_at"),"path":note.get("file_path",note["id"]+".md")}

    def call(self, call):
        with self.lock:
            data = self.read()
            notes = data["notes"]
            kind = call.get("kind")
            note = next((n for n in notes if n["id"] == call.get("id")), None)
            record = lambda n: {"summary":self.summary(n),"markdown":n.get("content","")}
            requests = data.setdefault("v21_requests", {})
            request = call.get("request_id")
            fingerprint = digest(json.dumps(call, sort_keys=True))
            if request and request in requests:
                prior = requests[request]
                return prior["response"] if prior["fingerprint"] == fingerprint else {"kind":"error","error":"invalid"}
            if kind == "list":
                q = call.get("query", {})
                search = str(q.get("search", "")).casefold()
                found = [n for n in notes if bool(n.get("deleted_at")) == bool(q.get("trashed"))
                         and search in (str(n.get("title",""))+" "+str(n.get("content",""))).casefold()]
                found.sort(key=lambda n:(bool(n.get("pinned")),n.get("updated_at",""),n["id"]),reverse=True)
                offset = max(0,int(q.get("after") or 0)); limit = min(100,max(1,int(q.get("limit",100))))
                return {"kind":"page","items":[self.summary(n) for n in found[offset:offset+limit]],
                        "next":str(offset+limit) if offset+limit<len(found) else None}
            if kind in {"resolve","backlinks"}:
                if kind == "backlinks":
                    if not note:return {"kind":"error","error":"not_found"}
                    title=self.summary(note)["title"]
                    return {"kind":"page","items":[self.summary(n) for n in notes if not n.get("deleted_at") and ("[["+title+"]]") in n.get("content","")],"next":None}
                return {"kind":"targets","items":[{"target":t,"note":next((self.summary(n) for n in notes if not n.get("deleted_at") and self.summary(n)["title"].casefold()==t.casefold()),None)} for t in call.get("targets",[])[:100]]}
            if kind == "create":
                body=call.get("markdown","")
                if not isinstance(body,str) or len(body.encode("utf-8"))>4_000_000:return {"kind":"error","error":"too_large"}
                note={"id":uuid.uuid4().hex,"content":body,"created_at":now(),"updated_at":now(),"category":""}
                if isinstance(call.get('provenance'),dict):note['work_provenance']=call['provenance']
                notes.append(note)
                response={"kind":"applied","request_id":request,"summary":self.summary(note)}
            elif not note:
                return {"kind":"error","error":"not_found"}
            elif kind == "get":
                return {"kind":"record","record":record(note)}
            elif kind == "write":
                if note.get("deleted_at"):return {"kind":"error","error":"read_only"}
                body=call.get("markdown")
                if not isinstance(body,str) or len(body.encode("utf-8"))>4_000_000:return {"kind":"error","error":"too_large"}
                if call.get("base_revision") != digest(note.get("content","")):
                    return {"kind":"conflict","current":record(note)}
                old_first=str(note.get("content","")).splitlines()[:1]
                new_first=body.splitlines()[:1]
                if note.get("title") and old_first!=new_first:
                    note["title"]=(new_first[0].lstrip("# ").strip() if new_first else "Untitled note")
                note["content"]=body;note["updated_at"]=now()
                response={"kind":"applied","request_id":request,"summary":self.summary(note)}
            elif kind == "set_pinned":
                note["pinned"]=bool(call.get("pinned"));response={"kind":"done"}
            elif kind == "trash":
                note["deleted_at"]=now();response={"kind":"done"}
            elif kind == "restore":
                note.pop("deleted_at",None);response={"kind":"done"}
            elif kind == "delete":
                if not note.get("deleted_at"):return {"kind":"error","error":"invalid"}
                notes.remove(note);response={"kind":"done"}
            else:return {"kind":"error","error":"unavailable"}
            if request:
                if len(requests)>=10000:return {"kind":"error","error":"capacity"}
                requests[request]={"fingerprint":fingerprint,"response":response}
            self.save(data)
            return response

    def sync(self, folder):
        """Opt-in, bounded file bridge. A conflict never overwrites either side."""
        folder=Path(folder).resolve(strict=True)
        if not folder.is_dir():raise ValueError("Notes folder unavailable")
        with self.lock:
            data=self.read();links=data.setdefault("v21_files",{});conflicts=[];changed=0
            # Only files explicitly enrolled by this bridge are touched.
            for note in data["notes"][:1000]:
                if note.get("deleted_at"):continue
                filename=note["id"]+".md"
                if Path(filename).name!=filename:raise ValueError("Invalid note identity")
                path=folder/filename
                if path.is_symlink() or path.resolve().parent!=folder:raise ValueError("Unsafe note file")
                body=note.get("content","");local=digest(body);link=links.get(note["id"],{})
                if path.exists():
                    if path.stat().st_size>4_000_000:conflicts.append(note["id"]);continue
                    external=path.read_text(encoding="utf-8");remote=digest(external)
                    if not link and remote!=local:conflicts.append(note["id"]);continue
                    base=link.get("hash")
                    if base and remote!=base and local!=base and remote!=local:
                        conflicts.append(note["id"]);continue
                    if base and remote!=base and local==base:
                        note["content"]=external;note["updated_at"]=now();local=remote;changed+=1
                else:
                    # An external deletion is a conflict, not permission to erase a note.
                    if link:conflicts.append(note["id"]);continue
                    remote=None
                if remote!=local:
                    temp=folder/(filename+".aegis-tmp")
                    if temp.exists():raise ValueError("Unsettled note file write")
                    with temp.open("x",encoding="utf-8",newline="") as out:out.write(note["content"])
                    temp.replace(path);changed+=1
                links[note["id"]]={"hash":local,"folder":str(folder)}
            self.save(data)
            return {"changed":changed,"conflicts":conflicts,"count":len(links)}

class TaskPresentation:
    """Board status is metadata, never an invented automation execution result."""
    def __init__(self,store):self.store=store
    @staticmethod
    def validate_fields(v):
        if v.get('status') not in {None,'open','active','blocked','done'}:raise ValueError('Invalid task status')
        if v.get('priority') not in {None,'none','low','medium','high'}:raise ValueError('Invalid priority')
        for key,limit in [('list',200),('sortKey',200)]:
            if v.get(key) is not None and (not isinstance(v[key],str) or len(v[key])>limit):raise ValueError('Invalid '+key)
        context=v.get('context')
        if context is not None:
            from urllib.parse import urlsplit
            if not isinstance(context,dict) or not isinstance(context.get('url'),str) or len(context['url'])>4000:raise ValueError('Invalid context')
            url=urlsplit(context['url'])
            if url.scheme not in {'http','https'} or not url.hostname or url.username or url.password:raise ValueError('Invalid context URL')
        for key,format in [('dueDate','%Y-%m-%d'),('dueTime','%H:%M'),('deadline','%Y-%m-%d')]:
            if v.get(key) is not None:
                try:
                    parsed=datetime.strptime(v[key],format)
                    if parsed.strftime(format)!=v[key]:raise ValueError()
                except (ValueError,TypeError):raise ValueError('Invalid '+key)
        if v.get('duration') is not None and (type(v['duration']) is not int or not 1<=v['duration']<=525600):raise ValueError('Invalid duration')
        steps=v.get('steps',[])
        if not isinstance(steps,list) or len(steps)>100 or any(not isinstance(s,dict) or not isinstance(s.get('id'),str) or not 1<=len(s['id'])<=100 or not isinstance(s.get('title'),str) or not 1<=len(s['title'])<=500 or not isinstance(s.get('completed'),bool) for s in steps):raise ValueError('Invalid subtasks')
        if len({s['id'] for s in steps})!=len(steps):raise ValueError('Duplicate subtask identity')
    def rows(self,owner,trash=False):
        from astra_ai.ui.backend.task_backend.store import decode
        self.store._ensure()
        with self.store.connection() as conn:
            rows=conn.execute("SELECT * FROM tasks WHERE owner_id=? AND (deleted_at IS NOT NULL)=? ORDER BY updated_at DESC",(owner,int(trash))).fetchall()
            return [self.project(decode(row)) for row in rows]
    @staticmethod
    def project(t):
        m=t.get("metadata",{});v=m.get("v21",{})
        def milliseconds(value):
            if not value:return None
            try:return str(int(datetime.fromisoformat(str(value).replace('Z','+00:00')).timestamp()*1000))
            except (ValueError,TypeError):return str(value) if str(value).isdigit() else None
        due=t.get("due_at") or ""
        if due:
            try: due=datetime.fromisoformat(due.replace('Z','+00:00')).astimezone(ZoneInfo(t.get('timezone') or 'UTC')).isoformat()
            except (ValueError,KeyError): pass
        steps=v.get('steps') or [{'id':'legacy-'+str(i),'title':text,'completed':False} for i,text in enumerate(t.get('checklist',[]))]
        return {"id":t["id"],"revision":str(t["version"]),"title":t["title"],"description":t["instruction"],
                "createdAt":milliseconds(t["created_at"]),"updatedAt":milliseconds(t["updated_at"]),"pinned":v.get("pinned",False),
                "status":v.get("status") or ("done" if t["lifecycle"]=="completed" else "open"),
                "assignee":"user","origin":"agent" if t.get('source') not in {None,'manual'} else "user","dueDate":v.get("dueDate",due[:10] or None),"dueTime":v.get("dueTime",due[11:16] or None),
                "deadline":v.get("deadline",due[:10] or None),"duration":v.get("duration"),"context":v.get("context"),"sortKey":v.get("sortKey"),
                "work":m.get("work"),"pending":False,"list":v.get("list",t.get("project") or None),"inbox":v.get("inbox",not bool(v.get("list",t.get("project")))),
                "priority":v.get("priority") or {"normal":"none","urgent":"high"}.get(t["priority"],t["priority"]),
                "steps":steps,"stepCount":len(steps),"stepDone":sum(bool(s.get("completed")) for s in steps),
                "completedAt":milliseconds(v.get("completedAt")),"automation":not m.get("manual_task",False),"deleted":bool(t.get("deleted_at"))}
    def create(self,owner,input,key):
        from astra_ai.core.time_service import configured_timezone
        title=str(input.get("title","")).strip()[:240]
        if not title:raise ValueError("Task title required")
        self.validate_fields(input)
        data={"title":title,"instruction":str(input.get("description") or title),"kind":"action","lifecycle":"draft",
              "priority":"normal","timezone":configured_timezone(),"trigger":{"kind":"manual","enabled":False},
              "metadata":{"manual_task":True,"v21":{k:input.get(k) for k in ("dueDate","dueTime","duration","context","list","priority","inbox","deadline","steps","pinned","status") if k in input} }}
        if isinstance(input.get('provenance'),dict):data['metadata']['work_provenance']=input['provenance']
        return self.project(self.store.create_task(owner,data,idempotency_key=key))
    def change(self,owner,id,patch,revision,_conn=None):
        from astra_ai.ui.backend.task_backend.store import utc_now,decode
        self.store._ensure()
        with self.store._lock,(nullcontext(_conn) if _conn is not None else self.store.connection()) as conn:
            row=decode(conn.execute("SELECT * FROM tasks WHERE id=? AND owner_id=?",(id,owner)).fetchone())
            if not row:raise KeyError(id)
            if str(row["version"])!=str(revision):raise ValueError("Task changed; reload before saving")
            meta=row["metadata"];v=meta.setdefault("v21",{})
            for key in ("status","sortKey","dueDate","dueTime","priority","pinned","list","steps","context","duration","deadline","inbox"):
                if key in patch:v[key]=patch[key]
            self.validate_fields(v)
            if patch.get('status')=='done':v['completedAt']=utc_now()
            elif 'status' in patch:v.pop('completedAt',None)
            title=str(patch.get("title",row["title"])).strip()[:240]
            if not title:raise ValueError("Task title required")
            if "deleted" in patch:row["deleted_at"]=utc_now() if patch["deleted"] else None
            conn.execute("UPDATE tasks SET title=?,instruction=?,metadata=?,deleted_at=?,updated_at=?,version=version+1 WHERE id=? AND owner_id=?",
                         (title,str(patch.get("description",row["instruction"])),json.dumps(meta),row["deleted_at"],utc_now(),id,owner))
            self.store._event(conn,owner,id,"task.presentation","Task updated")
            return self.project(decode(conn.execute("SELECT * FROM tasks WHERE id=? AND owner_id=?",(id,owner)).fetchone()))
