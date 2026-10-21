"""Shared durable pacing for background work; no provider keys are stored here."""
import contextlib, hashlib, threading, time
from datetime import datetime,timezone
from pathlib import Path
from astra_ai.memory.shared_memory import read,atomic,StorageLock

class BudgetPaused(Exception):
    def __init__(self,until,reason):self.until=until;self.reason=reason;super().__init__(reason)

def scoped_requests_remaining(data,scope_id,day):
    """A trusted, day-bound allowance never grants requests to another report."""
    allowances=data.get('research_allowances',{})
    grant=allowances.get(scope_id,{}) if scope_id and isinstance(allowances,dict) else {}
    if not isinstance(grant,dict) or data.get('day')!=day or grant.get('day')!=day:return 0
    extra,used=grant.get('extra_requests'),grant.get('used')
    if type(extra) is not int or type(used) is not int or not 0<=used<=extra<=3:return 0
    return extra-used

class TokenReservation:
    """Settle one estimate against provider usage; never refund uncertain requests."""
    def __init__(self,budget,day,tokens):self.budget=budget;self.day=day;self.tokens=tokens;self.settled=False
    def settle(self,actual_tokens):
        if type(actual_tokens) is not int or actual_tokens<0:return
        with self.budget.lock:
            if self.settled:return
            self.settled=True;data=read(self.budget.path,{})
            if data.get('day')!=self.day:return
            data['tokens']=max(0,data.get('tokens',0)-self.tokens+actual_tokens)
            data['settled_requests']=data.get('settled_requests',0)+1
            data['settled_tokens']=data.get('settled_tokens',0)+actual_tokens
            atomic(self.budget.path,data)

class BackgroundBudget:
    def __init__(self,path,daily_requests=40,daily_tokens=80000,min_interval=65):
        self.path=Path(path);self.lock=StorageLock(self.path.with_suffix('.lock'));self.slot=threading.Lock();self.daily_requests=daily_requests;self.daily_tokens=daily_tokens;self.min_interval=min_interval
    def snapshot(self):
        with self.lock:return read(self.path,{'day':'','requests':0,'tokens':0,'next_attempt':0})
    def defer_model(self,model,provider_key,until):
        with self.lock:
            data=read(self.path,{})
            marker=hashlib.sha256(provider_key.encode()).hexdigest()
            if data.get('provider_marker',marker)!=marker:return
            data.setdefault('model_backoffs',{})[model]={'provider':marker,'until':until}
            atomic(self.path,data)
    def model_deferred(self,model,provider_key):
        item=self.snapshot().get('model_backoffs',{}).get(model,{})
        return item.get('provider')==hashlib.sha256(provider_key.encode()).hexdigest() and item.get('until',0)>time.time()
    def provider_changed(self,previous_key,new_key):
        """A replacement credential may have different quota; usage counters never reset."""
        if not previous_key or not new_key or previous_key==new_key:return False
        with self.lock:
            data=read(self.path,{})
            if str(data.get('pause_reason','')).startswith('gemini_'):
                history=data.get('provider_pause_history',[])
                history.append({'provider':hashlib.sha256(previous_key.encode()).hexdigest(),
                    'until':data.get('next_attempt',0),'reason':data['pause_reason'],'replaced_at':time.time()})
                data.update(provider_pause_history=history[-8:],next_attempt=0,pause_reason='')
            data['provider_marker']=hashlib.sha256(new_key.encode()).hexdigest()
            atomic(self.path,data)
        return True
    def provider_pause(self,until,reason,provider_key=None):
        with self.lock:
            data=read(self.path,{})
            if provider_key:
                marker=hashlib.sha256(provider_key.encode()).hexdigest()
                if data.get('provider_marker',marker)!=marker:return
                data['provider_marker']=marker
            data.update(next_attempt=max(data.get('next_attempt',0),until),pause_reason=reason)
            atomic(self.path,data)
    @contextlib.contextmanager
    def lease(self,tokens=4000,scope_id=''):
        if not self.slot.acquire(False):raise BudgetPaused(time.time()+5,'background_model_busy')
        try:
            with self.lock:
                data=read(self.path,{});day=datetime.now(timezone.utc).date().isoformat()
                if data.get('day')!=day:data={'day':day,'requests':0,'tokens':0,**{k:data[k] for k in ('next_attempt','pause_reason','provider_marker','provider_pause_history','model_backoffs') if k in data}}
                current=time.time()
                if current<data.get('next_attempt',0):raise BudgetPaused(data['next_attempt'],data.get('pause_reason') or 'background_quota_paused')
                needs_extra=data.get('requests',0)>=self.daily_requests
                if (needs_extra and not scoped_requests_remaining(data,scope_id,day)) or data.get('tokens',0)+tokens>self.daily_tokens:
                    midnight=(int(current)//86400+1)*86400;raise BudgetPaused(midnight,'background_daily_budget')
                if needs_extra:data['research_allowances'][scope_id]['used']+=1
                data.update(requests=data.get('requests',0)+1,tokens=data.get('tokens',0)+tokens,next_attempt=current+self.min_interval,pause_reason='');atomic(self.path,data)
            yield TokenReservation(self,day,tokens)
        finally:self.slot.release()
    def response(self,response):
        with self.lock:
            data=read(self.path,{})
            if response.status_code==429:
                try:delay=max(65,min(86400,float(response.headers.get('retry-after','180'))))
                except (ValueError,TypeError):delay=180
                data['next_attempt']=max(data.get('next_attempt',0),time.time()+delay);data['pause_reason']='provider_rate_limit'
            for kind in ('requests','tokens'):
                value=response.headers.get('x-ratelimit-remaining-'+kind)
                if value is not None:
                    try:data['provider_remaining_'+kind]=max(0,int(value))
                    except ValueError:continue
                    if data['provider_remaining_'+kind]==0:
                        reset=response.headers.get('x-ratelimit-reset-'+kind,'65s');import re
                        parts=re.findall(r'(\d+(?:\.\d+)?)(ms|s|m|h|d)',str(reset));delay=sum(float(n)*{'ms':.001,'s':1,'m':60,'h':3600,'d':86400}[unit] for n,unit in parts) if parts else 65
                        data['next_attempt']=max(data.get('next_attempt',0),time.time()+max(1,delay))
            atomic(self.path,data)
