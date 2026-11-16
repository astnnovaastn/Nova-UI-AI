"""Explicitly approved commands in a container and reviewed, revision-checked edits.

No shell runs on the host. Only selected text files enter the isolated copy.
"""
from __future__ import annotations
import hashlib, json, os, re, shutil, subprocess, threading, time, uuid
from pathlib import Path
from astra_ai.memory.shared_memory import atomic
from .repository_inputs import RepositoryInputs

def sha(data): return hashlib.sha256(data).hexdigest()

class IsolatedWorkspace:
    def __init__(self, root, settings):
        self.root=Path(root)/'isolated-work';self.settings=settings;self.repositories=RepositoryInputs(settings);self.lock=threading.RLock();self.instance=uuid.uuid4().hex
    def availability(self):
        docker=shutil.which('docker');image=self.settings('AEGIS_WORK_SANDBOX_IMAGE') or ''
        if not docker:return {'available':False,'reason':'Install and start Docker to enable isolated commands.'}
        if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_./:@-]{0,240}',image):return {'available':False,'reason':'Configure AEGIS_WORK_SANDBOX_IMAGE with a trusted, locally installed image.'}
        try:
            result=subprocess.run([docker,'image','inspect','--format','{{.Id}}',image],capture_output=True,text=True,timeout=8,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
            image_id=result.stdout.strip()
            if result.returncode or not re.fullmatch(r'sha256:[a-f0-9]{64}',image_id):raise ValueError()
        except (OSError,subprocess.SubprocessError,ValueError):return {'available':False,'reason':'The configured image or Docker engine is unavailable. Nothing was executed.'}
        return {'available':True,'image':image_id}
    def directory(self,owner,id):
        if not re.fullmatch(r'[a-f0-9]{32}',id):raise ValueError('Invalid execution identity')
        result=(self.root/sha(str(owner).encode())[:32]/id).resolve()
        return Path('\\\\?\\'+str(result)) if os.name=='nt' and not str(result).startswith('\\\\?\\') else result
    def get(self,owner,id):
        with self.lock:
            record=json.loads((self.directory(owner,id)/'record.json').read_text(encoding='utf-8'))
            if record['status']=='running' and record.get('worker')!=self.instance:
                record['status']='interrupted';record['cleanup_required']='aegis-work-'+id
                self.save(owner,record)
            return record
    def save(self,owner,record):atomic(self.directory(owner,record['id'])/'record.json',record)
    def source(self,repo,relative):
        root=self.repositories.root(repo)
        if not self.repositories.allowed(relative) or Path(relative).is_absolute():raise ValueError('File is not allowed')
        candidate=root/relative
        for part in [candidate,*candidate.parents]:
            if part==root:break
            if part.is_symlink() or part.is_junction():raise ValueError('Linked paths are not allowed')
        if not candidate.resolve().is_relative_to(root):raise ValueError('File leaves the authorized repository')
        raw=candidate.read_bytes()
        if len(raw)>512000 or b'\0' in raw:raise ValueError('Choose a smaller text file')
        raw.decode('utf-8');return candidate,raw
    def propose(self,owner,payload):
        repo=payload.get('repository');files=payload.get('files');argv=payload.get('argv');edits=payload.get('edits',{})
        if not isinstance(files,list) or not 1<=len(files)<=100 or len(set(files))!=len(files):raise ValueError('Select 1–100 unique text files')
        if not isinstance(argv,list) or not 1<=len(argv)<=40 or argv[0] not in {'python','python3','pytest','node','npm','npx'} or any(not isinstance(a,str) or len(a)>2000 or '\0' in a for a in argv):raise ValueError('Provide a Python, Node or test command as an argument list')
        if not isinstance(edits,dict) or not set(edits)<=set(files) or any(not isinstance(v,str) or len(v.encode())>512000 for v in edits.values()):raise ValueError('Edits must refer to selected text files')
        snapshot={};size=0
        for name in files:
            _,raw=self.source(repo,name);size+=len(raw)
            if size>5_000_000:raise ValueError('Selected files exceed 5 MB')
            snapshot[name]={'hash':sha(raw),'before':raw.decode('utf-8'),'after':edits.get(name,raw.decode('utf-8'))}
        record={'id':uuid.uuid4().hex,'repository':repo,'argv':argv,'files':snapshot,'status':'awaiting_approval','output':'','exit_code':None,'image':self.availability().get('image')}
        record['approval']=sha(json.dumps(record,sort_keys=True).encode());self.save(owner,record);return record
    def execute(self,owner,id,approval):
        with self.lock:
            record=self.get(owner,id)
            if record['status']!='awaiting_approval' or approval!=record['approval']:raise ValueError('Proposal changed or was already decided')
            available=self.availability()
            if not available['available']:return {**record,'blocked':available['reason']}
            if record.get('image')!=available['image']:raise ValueError('Container image changed. Review a new proposal.')
            for name,entry in record['files'].items():
                if sha(self.source(record['repository'],name)[1])!=entry['hash']:raise ValueError('Source changed. Create a new proposal.')
            stage=self.directory(owner,id)/'files';stage.mkdir(parents=True,exist_ok=False)
            for name,entry in record['files'].items():
                dest=stage/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(entry['after'],encoding='utf-8',newline='')
            record['status']='running';record['worker']=self.instance;record['image']=available['image'];self.save(owner,record)
        docker=shutil.which('docker');container='aegis-work-'+id;log=self.directory(owner,id)/'output.txt';flags={'creationflags':getattr(subprocess,'CREATE_NO_WINDOW',0)}
        mount=str(stage).removeprefix('\\\\?\\');started=time.monotonic()
        command=[docker,'run','--rm','--name',container,'--pull=never','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=128','--memory=512m','--cpus=1','--tmpfs','/tmp:rw,noexec,nosuid,size=64m','--mount',f'type=bind,source={mount},target=/workspace','--workdir','/workspace','--entrypoint',record['argv'][0],available['image'],*record['argv'][1:]]
        try:
            with log.open('wb') as out:
                process=subprocess.Popen(command,stdout=out,stderr=subprocess.STDOUT,**flags);deadline=time.monotonic()+60
                while process.poll() is None:
                    if time.monotonic()>deadline or log.stat().st_size>1_000_000 or self.get(owner,id)['status']=='cancelled':
                        subprocess.run([docker,'rm','-f',container],capture_output=True,timeout=10,**flags);process.kill();process.wait();record['status']='cancelled' if self.get(owner,id)['status']=='cancelled' else 'limit_reached';break
                    time.sleep(.1)
                record['exit_code']=process.returncode
                if record['status']=='running':record['status']='completed' if process.returncode==0 else 'failed'
        except (OSError,subprocess.SubprocessError) as e:
            record['status']='failed';record['error']=type(e).__name__
        finally:
            try:subprocess.run([docker,'rm','-f',container],capture_output=True,timeout=10,**flags)
            except (OSError,subprocess.SubprocessError):record['cleanup_required']=container
        record['output']=log.read_bytes()[:1_000_000].decode('utf-8',errors='replace') if log.exists() else ''
        record['elapsed_ms']=round((time.monotonic()-started)*1000)
        with self.lock:
            if self.get(owner,id)['status']=='cancelled':record['status']='cancelled'
            self.save(owner,record)
        return record
    def cancel(self,owner,id):
        with self.lock:
            record=self.get(owner,id)
            if record['status'] in {'awaiting_approval','running'}:record['status']='cancelled';self.save(owner,record)
            return record
    def apply(self,owner,id,approval):
        with self.lock:
            record=self.get(owner,id)
            if record['approval']!=approval or record['status'] not in {'completed','failed'}:raise ValueError('A completed command and current approval are required')
            changes=[(name,e) for name,e in record['files'].items() if e['before']!=e['after']]
            targets=[]
            for name,entry in changes:
                target,raw=self.source(record['repository'],name)
                if sha(raw)!=entry['hash']:raise ValueError('Source changed; no edits applied')
                targets.append((target,entry))
            # Apply the reviewed proposal only; arbitrary container output is never imported.
            staged=[];written=[]
            try:
                for target,entry in targets:
                    temp=target.with_name(target.name+'.aegis-'+id+'.tmp')
                    with temp.open('x',encoding='utf-8',newline='') as out:out.write(entry['after'])
                    staged.append((temp,target,entry))
                for temp,target,entry in staged:
                    if sha(target.read_bytes())!=entry['hash']:raise ValueError('Source changed while applying; earlier writes rolled back')
                    temp.replace(target);written.append((target,entry))
            except Exception:
                for target,entry in reversed(written):
                    if sha(target.read_bytes())==sha(entry['after'].encode()):target.write_text(entry['before'],encoding='utf-8',newline='')
                raise
            finally:
                for temp,_,_ in staged:temp.unlink(missing_ok=True)
            record['status']='applied';self.save(owner,record);return record
