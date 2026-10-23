"""Owner-selected research writers; never changes Gemini Live or exposes keys."""
import asyncio,json,os,re,tempfile,time
from pathlib import Path
from datetime import datetime,timezone
from astra_ai.memory.shared_memory import StorageLock
from astra_ai.core.research_model import requested_research_budget,research_budget_path
from astra_ai.core.research_openai import configured_research_model

DEFAULT_MODELS={'gemini':'gemini-3.5-flash','openai':'gpt-4.1-mini','none':''}


def write_environment(path,updates):
    """Preserve unrelated configuration and serialize concurrent Settings saves."""
    path=Path(path)
    if any(not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',key) or not isinstance(value,str) or any(c in value for c in '\r\n\0') for key,value in updates.items()):raise ValueError('Invalid setting value')
    with StorageLock(path.with_suffix('.settings.lock')):
        content=path.read_text(encoding='utf-8') if path.exists() else ''
        for key,value in updates.items():
            encoded=value if re.fullmatch(r'[A-Za-z0-9_./:+-]*',value) else json.dumps(value,ensure_ascii=False)
            pattern=r'(?m)^'+re.escape(key)+r'=.*$'
            content=re.sub(pattern,lambda _:key+'='+encoded,content) if re.search(pattern,content) else content.rstrip()+'\n'+key+'='+encoded+'\n'
        handle,name=tempfile.mkstemp(prefix='.settings-',suffix='.tmp',dir=path.parent)
        try:
            with os.fdopen(handle,'w',encoding='utf-8',newline='') as output:output.write(content);output.flush();os.fsync(output.fileno())
            for attempt in range(6):
                try:os.replace(name,path);break
                except PermissionError:
                    if attempt==5:raise
                    time.sleep(.05*(attempt+1))
        finally:
            if os.path.exists(name):os.unlink(name)
        os.environ.update(updates)


class ResearchProviderSettings:
    def __init__(self,env_path,memory_dir,settings,gemini_key,slot,current,install,live_model):
        self.env_path=Path(env_path);self.memory_dir=Path(memory_dir);self.settings=settings;self.gemini_key=gemini_key
        self.slot=slot;self.current=current;self.install=install;self.live_model=live_model
        self.lock=asyncio.Lock();self.switching=False

    def model(self,provider):
        key='NOVA_RESEARCH_GEMINI_MODEL' if provider=='gemini' else 'NOVA_RESEARCH_OPENAI_MODEL'
        return self.settings(key) or (self.settings('GEMINI_TEXT_MODEL') if provider=='gemini' else '') or DEFAULT_MODELS[provider]

    def key(self,provider):
        return (self.settings('NOVA_RESEARCH_GEMINI_API_KEY') or self.gemini_key()) if provider=='gemini' else self.settings('NOVA_RESEARCH_OPENAI_API_KEY')

    def status(self):
        active=self.current();today=datetime.now(timezone.utc).date().isoformat();rows=[]
        for provider in ('gemini','openai'):
            settings=lambda name:self.settings(name) if name!='NOVA_RESEARCH_PROVIDER' else provider
            budget=requested_research_budget(research_budget_path(self.memory_dir,settings),self.slot,settings)
            key=self.key(provider)
            snapshot=budget.snapshot(provider_key=key or '');same_day=snapshot.get('day')==today
            requests=snapshot.get('requests',0) if same_day else 0;tokens=snapshot.get('tokens',0) if same_day else 0
            selected=bool(active and active.provider==provider)
            rows.append({'id':provider,'configured':bool(key),'active':selected,'model':self.model(provider),
                'credential_source':'research' if provider=='openai' or self.settings('NOVA_RESEARCH_GEMINI_API_KEY') else 'shared_live',
                'effective_model':getattr(active,'effective_model','') if selected else '',
                'requests_used':requests,'request_limit':budget.daily_requests,'tokens_used':tokens,'token_limit':budget.daily_tokens,
                'local_limit_reached':requests>=budget.daily_requests or tokens>=budget.daily_tokens,
                'next_attempt':snapshot.get('next_attempt',0),'pause_reason':snapshot.get('pause_reason','')})
        return {'provider':getattr(active,'provider','none'),'default_provider':'gemini','switching':self.switching,
            'providers':rows,'chat_provider':'gemini_live','voice_model':self.live_model,
            'fallback':active.status() if hasattr(active,'status') else {'enabled':False,'configured':False}}

    async def activate(self,provider,model=None,extra=None):
        extra=extra or {}
        if set(extra)-{'NOVA_RESEARCH_GROQ_FALLBACK','NOVA_RESEARCH_GROQ_COOPERATIVE','NOVA_RESEARCH_GROQ_MODELS'}:raise ValueError('Invalid research configuration')
        if provider not in DEFAULT_MODELS:raise ValueError('Choose Gemini, OpenAI, or deactivate research writing.')
        chosen=(model if model is not None else self.model(provider)) if provider!='none' else ''
        if provider!='none' and (not isinstance(chosen,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{1,100}',chosen)):raise ValueError('Enter a valid model ID.')
        key=self.key(provider) if provider!='none' else True
        if not key:raise ValueError('Save a '+('Gemini' if provider=='gemini' else 'OpenAI')+' API key before activating it.')
        async with self.lock:
            old=self.current();self.switching=True;acquired=False;installed=False
            if old:old.budget.suspension_reason='research_provider_switching'
            try:
                # Existing accepted requests settle once. No new old-provider lease
                # can start after suspension, and no switch acknowledgement precedes draining.
                deadline=time.monotonic()+220
                while not self.slot.acquire(False):
                    if time.monotonic()>=deadline:raise TimeoutError('The current research write is still finishing. Try switching again shortly.')
                    await asyncio.sleep(.05)
                acquired=True
                if old and old.provider=='gemini':
                    await asyncio.to_thread(old.budget.scope_legacy_provider_pause,old.key_provider(),old.model_provider())
                updates={'NOVA_RESEARCH_PROVIDER':provider,**extra}
                if provider!='none':updates['NOVA_RESEARCH_GEMINI_MODEL' if provider=='gemini' else 'NOVA_RESEARCH_OPENAI_MODEL']=chosen
                settings=lambda name:updates.get(name,self.settings(name))
                budget=requested_research_budget(research_budget_path(self.memory_dir,settings),self.slot,settings)
                writer=configured_research_model(settings,self.gemini_key,budget,{},DEFAULT_MODELS['gemini'])
                save=asyncio.create_task(asyncio.to_thread(write_environment,self.env_path,updates))
                try:await asyncio.shield(save)
                except asyncio.CancelledError:
                    await save
                    self.install(writer);installed=True
                    raise
                self.install(writer);installed=True
            finally:
                if acquired:self.slot.release()
                if old and not installed:old.budget.suspension_reason=''
                self.switching=False
            return await asyncio.to_thread(self.status)
