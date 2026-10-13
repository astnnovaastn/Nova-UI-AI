"""Low-rate local person presence; no identification or authorization claims."""
import asyncio,json,os,time
from pathlib import Path

class PresenceTracker:
    def __init__(self):self.positive=0;self.negative=0;self.state='unknown';self.updated=0
    def observe(self,detected):
        self.updated=time.time()
        if detected is None:self.state='unknown';self.positive=self.negative=0
        elif detected:
            self.positive+=1;self.negative=0
            if self.positive>=2:self.state='present'
        else:
            self.negative+=1;self.positive=0
            if self.negative>=3:self.state='absent'
        return self.state
    def status(self):return self.state if time.time()-self.updated<5 else 'unknown'

class PresenceWorker:
    def __init__(self):
        root=Path(__file__).resolve().parents[3];self.python=Path(os.environ.get('NOVA_PRESENCE_PYTHON') or root/'.venv_presence'/'Scripts'/'python.exe');self.process=None;self.limits=None;self.lock=asyncio.Lock();self.last=0;self.reason='not_started'
    def available(self):return self.python.is_file()
    async def detect(self,jpeg):
        if not self.available():self.reason='optional_detector_not_installed';return None
        if not isinstance(jpeg,str) or len(jpeg)>140000:return None
        async with self.lock:
            if time.monotonic()-self.last<1:return None
            self.last=time.monotonic()
            try:
                if self.process is None or self.process.returncode is not None:
                    env={k:v for k,v in os.environ.items() if k.upper() in {'SYSTEMROOT','WINDIR','TEMP','TMP'}};env.update(PYTHONNOUSERSITE='1',OMP_NUM_THREADS='1',OPENBLAS_NUM_THREADS='1')
                    self.process=await asyncio.create_subprocess_exec(str(self.python),'-I',str(Path(__file__).with_name('presence_worker.py')),stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.DEVNULL,env=env)
                    from .presence_limits import Limits
                    self.limits=Limits(self.process.pid)
                    ready=json.loads(await asyncio.wait_for(self.process.stdout.readline(),5))
                    if ready.get('status')!='ready':raise RuntimeError('Presence worker unavailable')
                self.process.stdin.write((json.dumps({'jpeg':jpeg})+'\n').encode());await self.process.stdin.drain()
                response=await asyncio.wait_for(self.process.stdout.readline(),2);value=json.loads(response)
                self.reason='ready';return value.get('detected') if isinstance(value.get('detected'),bool) else None
            except Exception:
                self.reason='detector_unavailable';await self.close();return None
    async def close(self):
        if self.process:
            if self.process.returncode is None:self.process.kill()
            await self.process.wait();self.process=None
        if self.limits:self.limits.close();self.limits=None
