"""Public Mem0-compatible API; all active paths use one JSON memory service."""
from pathlib import Path
import re
from .shared_memory import SharedMemory, ALIASES, CATEGORIES, read
from .category_policy import lifecycle, matches_scope
from .memory_types import MemoryCategory, ConflictType, RelationshipType, AdaptiveLearningType

class NovaMemoryAI(SharedMemory):
    def __init__(self,storage_file=None,**kwargs):
        root=Path(__file__).resolve().parents[1]
        transcript=Path(storage_file) if storage_file else root/'Date/nova_ai_memory.json'
        memory=kwargs.pop('memory_path', root/'memory/long_term.json' if storage_file is None else (transcript.parent.parent/'memory/long_term.json' if transcript.parent.name=='Date' else transcript.parent/'long_term.json'))
        super().__init__(memory_path=memory,transcript_path=transcript,**kwargs)
        self.storage_file=str(transcript);self.session_id='legacy-default';self.ensure_ready()
    @property
    def data(self):
        data=self.load()
        with self._lock: transcript=read(self.transcript_path,{})
        categories={category:{} for category in CATEGORIES}
        for record in data.get('records',{}).values():
            if record['kind']=='fact' and lifecycle(record,data['_meta'])=='active' and matches_scope(record):categories[record['category']][record['key']]={'value':record['value'],'timestamp':record['updated'],'source':record['source'],'confidence':record['confidence']}
        return {**transcript,'memory_categories':categories,'memory_events':[r for r in data.get('records',{}).values() if r['kind']=='event'],'user':categories['user_identity'],'fact_history':{r['id']:r['history'] for r in data.get('records',{}).values()},'category_relationships':data.get('relationships_v3',{})}
    def set_category(self,category,values):
        results=[]
        for key,value in values.items():
            key=re.sub('[^a-z0-9_]','_',str(key).lower())
            results.append(self.save_fact(category,key,value.get('value',value) if isinstance(value,dict) else value,evidence='Explicit application context update',source='legacy'))
        return results
    def save_memory(self):return self.flush()
    def load_memory(self):return self.data
    def process_conversation(self,user_message,ai_response,session_id=None,turn_id=None):
        if not str(ai_response).strip():return {"status":"interrupted","count":0,"memory_operations":0}
        result=self.append_turn(user_message,ai_response,session_id or self.session_id,turn_id)
        return {**result,'memory_operations':result.get('count',0)}
    def get_memory_context(self,query='',**context):
        profile=self.format_response_context(query=query,session_id=self.session_id,**context)
        return {'memory_context':profile,'session_context':profile,'relevant_memories':self.recall_memory(query)['matches'] if query else [],'user_profile':self.get_user_profile(),'memory_available':True}
    def get_user_profile(self):
        identity={};budget=3000
        for r in self.load()['records'].values():
            if r['kind']!='fact' or r['category']!='user_identity' or lifecycle(r,self.load()['_meta'])!='active' or not matches_scope(r):continue
            size=len(str(r['value']))
            if size<=budget:identity[r['key']]=r['value'];budget-=size
        return {'user_info':identity,'memory_context':self.format_response_context(),'facts':identity}
    def get_user_context(self,context_type='general'):return self.get_memory_context('' if context_type=='general' else context_type)
    def get_comprehensive_user_profile(self):return self.get_user_profile()
    def query_memory(self,query):return self.recall_memory(query)
    def retrieve_memory_by_category(self,category,subcategory=None):return self.data['memory_categories'].get(ALIASES.get(category,category),{})
    def get_memory_stats(self):return self.stats()
    def get_current_session_context(self):return {'session_id':self.session_id,'memory_context':self.format_response_context()}
    def get_session_info(self):return {'is_first_time':not bool(self.data.get('conversation')),'total_sessions':len(self.data.get('sessions',{})),'current_session':self.session_id}
    def get_user_identity_description(self):return self.format_response_context(query='name identity')
    def get_today_organizer_summary(self):return {'status':'ok','summary':self.format_response_context(query='project task')}
    def end_session(self,session_id=None):
        result=super().end_session(session_id or self.session_id);self.flush();return result
    def get_fact_history(self,key):return [r['history'] for r in self.load()['records'].values() if r['key']==key]

AegisMemoryAI=NovaMemoryAI
class AdvancedMemoryAgent:
    def __init__(self,storage_file=None,**kwargs):self.memory_system=NovaMemoryAI(storage_file,**kwargs)
    def __getattr__(self,name):return getattr(self.memory_system,name)
    def get_conversation_context(self):return self.memory_system.get_current_session_context()

__all__=['AdvancedMemoryAgent','NovaMemoryAI','AegisMemoryAI','MemoryCategory','ConflictType','RelationshipType','AdaptiveLearningType']

def create_memory_agent(storage_file=None,**kwargs):return AdvancedMemoryAgent(storage_file,**kwargs)
