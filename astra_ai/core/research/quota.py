"""Conservative shared Groq pacing, independent of application allowances."""
import hashlib
import time
import uuid
from datetime import datetime,timezone
from pathlib import Path
from astra_ai.memory.shared_memory import StorageLock,read,atomic
from ..background_budget import BudgetPaused


class GroqQuota:
    def __init__(self,path,minute=8000,daily=200000):
        self.path=Path(path);self.lock=StorageLock(self.path.with_suffix('.lock'));self.minute=minute;self.daily=daily

    def reserve(self,key,tokens):
        identity=hashlib.sha256(key.encode()).hexdigest();now=time.time();day=datetime.now(timezone.utc).date().isoformat()
        with self.lock:
            data=read(self.path,{});row=data.setdefault(identity,{'day':day,'tokens':0,'window':[]})
            if row['day']!=day:row.update(day=day,tokens=0,window=[])
            row['window']=[r for r in row['window'] if r['at']>now-65]
            if row['tokens']+tokens>self.daily:raise BudgetPaused((int(now)//86400+1)*86400,'groq_daily_token_limit')
            if sum(r['tokens'] for r in row['window'])+tokens>self.minute:
                raise BudgetPaused(min((r['at']+65 for r in row['window']),default=now+65),'groq_token_rate_limit')
            identifier=uuid.uuid4().hex;row['window'].append({'id':identifier,'at':now,'tokens':tokens});row['tokens']+=tokens
            atomic(self.path,data)
            return identity,identifier,day,tokens

    def settle(self,reservation,actual):
        if type(actual) is not int or actual<0:return
        identity,identifier,day,estimated=reservation
        with self.lock:
            data=read(self.path,{});row=data.get(identity,{})
            if row.get('day')!=day:return
            entry=next((r for r in row['window'] if r['id']==identifier),None)
            if entry is not None and entry.get('settled'):return
            row['tokens']=max(0,row['tokens']-estimated+actual)
            if entry is not None:entry.update(tokens=actual,settled=True)
            atomic(self.path,data)
