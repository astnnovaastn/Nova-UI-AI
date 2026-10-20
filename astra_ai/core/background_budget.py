"""Shared durable pacing for background work; no provider keys are stored here."""
import contextlib, threading, time
from datetime import datetime,timezone
from pathlib import Path
from astra_ai.memory.shared_memory import read,atomic,StorageLock

class BudgetPaused(Exception):
    def __init__(self,until,reason):self.until=until;self.reason=reason;super().__init__(reason)

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
    @contextlib.contextmanager
    def lease(self,tokens=4000):
        if not self.slot.acquire(False):raise BudgetPaused(time.time()+5,'background_model_busy')
        try:
            with self.lock:
                data=read(self.path,{});day=datetime.now(timezone.utc).date().isoformat()
                if data.get('day')!=day:data={'day':day,'requests':0,'tokens':0,'next_attempt':data.get('next_attempt',0)}
                current=time.time()
                if current<data.get('next_attempt',0):raise BudgetPaused(data['next_attempt'],'background_quota_paused')
                if data.get('requests',0)>=self.daily_requests or data.get('tokens',0)+tokens>self.daily_tokens:
                    midnight=(int(current)//86400+1)*86400;raise BudgetPaused(midnight,'background_daily_budget')
                data.update(requests=data.get('requests',0)+1,tokens=data.get('tokens',0)+tokens,next_attempt=current+self.min_interval);atomic(self.path,data)
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
