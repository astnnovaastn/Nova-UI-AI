"""Durable, scoped operation notices. The model chooses significance, not this store."""
import time,copy
from astra_ai.memory.shared_memory import read,atomic,StorageLock,stable,now,safe
from astra_ai.memory.category_policy import matches_scope

def scoped(row,context):
    return not context.get('guest') and (row.get('profile_id',''),row.get('project_id',''))==(context.get('profile_id',''),context.get('project_id',''))

class Notices:
    def __init__(self,path):self.path=path;self.lock=StorageLock(path.with_suffix('.lock'))
    def load(self):return read(self.path,{'items':{}})
    def enqueue(self,kind,target,version,details,context):
        if context.get('guest'):return None
        identifier=stable('notice',kind,target,version,context.get('profile_id',''),context.get('project_id',''))
        with self.lock:
            data=self.load()
            if identifier in data['items']:return identifier
            data['items'][identifier]={'id':identifier,'kind':kind,'target':target,'version':str(version),'details':safe(str(details))[:4000],'created':now(),'state':'pending','session_id':context.get('session_id',''),'profile_id':context.get('profile_id',''),'project_id':context.get('project_id','')};atomic(self.path,data)
        return identifier
    def listing(self,context):
        with self.lock:items=self.load()['items']
        return [copy.deepcopy(r) for r in items.values() if scoped(r,context)]
    def get(self,identifier,context):return next((r for r in self.listing(context) if r['id']==identifier),None)
    def change(self,identifier,context,state,**fields):
        with self.lock:
            data=self.load();item=data['items'].get(identifier)
            if not item or not scoped(item,context):return {'status':'not_found'}
            if item['state'] in {'delivered','dismissed'}:return {'status':'duplicate'}
            item.update(state=state,updated=now(),**fields);atomic(self.path,data)
        return {'status':'ok','notice':copy.deepcopy(item)}
    def acknowledge(self,identifier,context):
        item=self.get(identifier,context)
        if not item or item['state']!='offered' or item.get('offered_to')!=context.get('client_id'):return {'status':'rejected','reason':'notice_not_offered'}
        return self.change(identifier,context,'delivered',delivered_at=now())
