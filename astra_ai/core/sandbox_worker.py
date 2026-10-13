"""Fail-closed OS-isolated Python workers. No credentials, network, or child processes."""
import json,os,sys,tempfile,subprocess,time,threading,uuid,shutil
from pathlib import Path

RUNNER = r"""
import json,pathlib
root=pathlib.Path(__file__).parent
job=json.loads((root/'input.json').read_text(encoding='utf-8'))
try:
    namespace={};exec(compile(job['code'],'<learned-tool>','exec'),namespace)
    result=namespace['run'](job['input'])
    output={'status':'ok','result':result}
except BaseException as error:output={'status':'failed','reason':type(error).__name__}
(root/'output.json').write_text(json.dumps(output,ensure_ascii=False),encoding='utf-8')
"""
class IsolationUnavailable(Exception):pass
class SandboxWorker:
    def __init__(self):self.lock=threading.Lock();self.verified=False;self.error='Isolation has not been verified';self.backend='windows_appcontainer' if os.name=='nt' else 'unavailable';self._configured=False
    def status(self):return {'backend':self.backend,'verified':self.verified,'reason':self.error,'memory_limit_mb':256,'wall_timeout_seconds':15,'network':'denied' if self.verified else 'unverified','credentials':'not_inherited'}
    def run(self,code,payload,timeout=15):
        if not self.verified:raise IsolationUnavailable(self.error)
        with self.lock:return self._run(code,payload,timeout)
    def verify(self):
        with self.lock:
            try:
                if os.name!='nt':raise IsolationUnavailable('No supported OS isolation backend on this host')
                import socket
                with tempfile.TemporaryDirectory(prefix='nova-isolation-probe-') as outside:
                    canary=Path(outside)/'private.txt';canary.write_text('fake boundary canary',encoding='utf-8')
                    with socket.socket() as listener:
                        listener.bind(('127.0.0.1',0));listener.listen();port=listener.getsockname()[1]
                        code="import os,socket,ctypes,subprocess,sys\nfrom ctypes import wintypes as w\ndef run(args):\n    kernel=ctypes.WinDLL('kernel32',use_last_error=True);adv=ctypes.WinDLL('advapi32',use_last_error=True)\n    kernel.GetCurrentProcess.restype=w.HANDLE\n    adv.OpenProcessToken.argtypes=[w.HANDLE,w.DWORD,ctypes.POINTER(w.HANDLE)];adv.OpenProcessToken.restype=w.BOOL\n    adv.GetTokenInformation.argtypes=[w.HANDLE,ctypes.c_int,ctypes.c_void_p,w.DWORD,ctypes.POINTER(w.DWORD)];adv.GetTokenInformation.restype=w.BOOL\n    token=w.HANDLE();flag=w.DWORD();size=w.DWORD();is_container=False;no_caps=False\n    if adv.OpenProcessToken(kernel.GetCurrentProcess(),8,ctypes.byref(token)):\n        if adv.GetTokenInformation(token,29,ctypes.byref(flag),ctypes.sizeof(flag),ctypes.byref(size)):is_container=flag.value==1\n        adv.GetTokenInformation(token,30,None,0,ctypes.byref(size));buffer=ctypes.create_string_buffer(size.value)\n        if adv.GetTokenInformation(token,30,buffer,size,ctypes.byref(size)):no_caps=w.DWORD.from_buffer(buffer).value==0\n        kernel.CloseHandle.argtypes=[w.HANDLE];kernel.CloseHandle(token)\n    file_blocked=False;network_blocked=False;child_blocked=False\n    try:open(args['path']).read()\n    except PermissionError:file_blocked=True\n    sock=socket.socket();sock.settimeout(3)\n    try:sock.connect(('127.0.0.1',args['port']))\n    except (PermissionError,TimeoutError):network_blocked=True\n    except OSError as e:network_blocked=getattr(e,'winerror',None)==10013\n    finally:sock.close()\n    try:subprocess.run([sys.executable,'-I','-S','-c','pass'],timeout=1,capture_output=True)\n    except OSError:child_blocked=True\n    return {'file_blocked':file_blocked,'network_blocked':network_blocked,'child_blocked':child_blocked,'appcontainer':is_container,'no_capabilities':no_caps,'no_secrets':not any('KEY' in k or 'TOKEN' in k or 'SECRET' in k for k in os.environ)}\n"
                        result=self._run(code,{'path':str(canary),'port':port},10)
                        listener.settimeout(.1)
                        try:
                            connection,_=listener.accept();connection.close();raise IsolationUnavailable('Worker reached the network listener')
                        except TimeoutError:pass
                        if not all(result.get('result',{}).get(k) is True for k in ('file_blocked','network_blocked','child_blocked','appcontainer','no_capabilities','no_secrets')):raise IsolationUnavailable('OS isolation boundary self-test failed: '+json.dumps(result))
                self.verified=True;self.error='';return self.status()
            except Exception as error:self.verified=False;self.error='OS isolation unavailable: '+(str(error) if isinstance(error,IsolationUnavailable) else type(error).__name__);return self.status()
    def _run(self,code,payload,timeout):
        if os.name!='nt':raise IsolationUnavailable('OS isolation unavailable')
        if len(code.encode())>64000 or len(json.dumps(payload).encode())>64000:raise ValueError('Worker input too large')
        with tempfile.TemporaryDirectory(prefix='nova-isolated-tool-') as folder:
            root=Path(folder);(root/'runner.py').write_text(RUNNER,encoding='utf-8');(root/'input.json').write_text(json.dumps({'code':code,'input':payload}),encoding='utf-8')
            self._copy_runtime(root/'runtime');self._windows(root,max(.1,min(float(timeout),15)))
            output=root/'output.json'
            if not output.exists():return {'status':'failed','reason':'isolated_worker_no_result'}
            if output.stat().st_size>128000:return {'status':'failed','reason':'worker_output_too_large'}
            return json.loads(output.read_text(encoding='utf-8'))
    def _copy_runtime(self,target):
        # Copy only interpreter binaries and the standard library into disposable
        # scratch space. Never change ACLs on the installed Python runtime.
        source=Path(sys.base_prefix);target.mkdir()
        for name in ('python.exe','python3.dll','python'+str(sys.version_info.major)+str(sys.version_info.minor)+'.dll','vcruntime140.dll','vcruntime140_1.dll'):
            path=source/name
            if path.exists():shutil.copy2(path,target/name)
        shutil.copytree(source/'DLLs',target/'DLLs',ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
        shutil.copytree(source/'Lib',target/'Lib',ignore=shutil.ignore_patterns('site-packages','__pycache__','test','tests','idlelib','tkinter','turtledemo','ensurepip','venv','*.pyc'))
        (target/('python'+str(sys.version_info.major)+str(sys.version_info.minor)+'._pth')).write_text('Lib\nDLLs\n.\n',encoding='utf-8')
    def _windows(self,root,timeout):
        import ctypes as c
        from ctypes import wintypes as w
        kernel=c.WinDLL('kernel32',use_last_error=True);userenv=c.WinDLL('userenv',use_last_error=True);advapi=c.WinDLL('advapi32',use_last_error=True)
        class Startup(c.Structure):
            _fields_=[('cb',w.DWORD),('lpReserved',w.LPWSTR),('lpDesktop',w.LPWSTR),('lpTitle',w.LPWSTR),('dwX',w.DWORD),('dwY',w.DWORD),('dwXSize',w.DWORD),('dwYSize',w.DWORD),('dwXCountChars',w.DWORD),('dwYCountChars',w.DWORD),('dwFillAttribute',w.DWORD),('dwFlags',w.DWORD),('wShowWindow',w.WORD),('cbReserved2',w.WORD),('lpReserved2',c.c_void_p),('hStdInput',w.HANDLE),('hStdOutput',w.HANDLE),('hStdError',w.HANDLE)]
        class StartupEx(c.Structure):_fields_=[('StartupInfo',Startup),('lpAttributeList',c.c_void_p)]
        class SecurityCapabilities(c.Structure):_fields_=[('AppContainerSid',c.c_void_p),('Capabilities',c.c_void_p),('CapabilityCount',w.DWORD),('Reserved',w.DWORD)]
        class Process(c.Structure):_fields_=[('hProcess',w.HANDLE),('hThread',w.HANDLE),('dwProcessId',w.DWORD),('dwThreadId',w.DWORD)]
        class BasicLimits(c.Structure):_fields_=[('PerProcessUserTimeLimit',c.c_longlong),('PerJobUserTimeLimit',c.c_longlong),('LimitFlags',w.DWORD),('MinimumWorkingSetSize',c.c_size_t),('MaximumWorkingSetSize',c.c_size_t),('ActiveProcessLimit',w.DWORD),('Affinity',c.c_size_t),('PriorityClass',w.DWORD),('SchedulingClass',w.DWORD)]
        class IoCounters(c.Structure):_fields_=[(k,c.c_ulonglong) for k in ('ReadOperationCount','WriteOperationCount','OtherOperationCount','ReadTransferCount','WriteTransferCount','OtherTransferCount')]
        class CpuLimit(c.Structure):_fields_=[('ControlFlags',w.DWORD),('CpuRate',w.DWORD)]
        class Limits(c.Structure):_fields_=[('BasicLimitInformation',BasicLimits),('IoInfo',IoCounters),('ProcessMemoryLimit',c.c_size_t),('JobMemoryLimit',c.c_size_t),('PeakProcessMemoryUsed',c.c_size_t),('PeakJobMemoryUsed',c.c_size_t)]
        def bind(lib,name,restype,args):fn=getattr(lib,name);fn.restype=restype;fn.argtypes=args;return fn
        create_profile=bind(userenv,'CreateAppContainerProfile',c.c_long,[w.LPCWSTR,w.LPCWSTR,w.LPCWSTR,c.c_void_p,w.DWORD,c.POINTER(c.c_void_p)])
        derive=bind(userenv,'DeriveAppContainerSidFromAppContainerName',c.c_long,[w.LPCWSTR,c.POINTER(c.c_void_p)])
        sid=c.c_void_p();profile='NovaAegisTest_'+uuid.uuid4().hex
        outcome=create_profile(profile,profile,'Isolated learned tool worker',None,0,c.byref(sid))
        if outcome!=0 and derive(profile,c.byref(sid))!=0:raise IsolationUnavailable('AppContainer profile unavailable')
        convert=bind(advapi,'ConvertSidToStringSidW',w.BOOL,[c.c_void_p,c.POINTER(w.LPWSTR)]);text=w.LPWSTR()
        if not convert(sid,c.byref(text)):raise IsolationUnavailable('AppContainer SID unavailable')
        sid_text=text.value;bind(kernel,'LocalFree',c.c_void_p,[c.c_void_p])(c.cast(text,c.c_void_p))
        runtime=root/'runtime';python=runtime/'python.exe'
        try:
            for folder,access in ((root,'M'),):
                result=subprocess.run(['icacls',str(folder),'/grant','*'+sid_text+':(OI)(CI)'+access,'/T','/Q'],capture_output=True,timeout=15,creationflags=0x08000000)
                if result.returncode:raise IsolationUnavailable('Worker directory ACL unavailable')
            size=c.c_size_t();init=bind(kernel,'InitializeProcThreadAttributeList',w.BOOL,[c.c_void_p,w.DWORD,w.DWORD,c.POINTER(c.c_size_t)])
            init(None,1,0,c.byref(size));buffer=c.create_string_buffer(size.value)
            if not init(buffer,1,0,c.byref(size)):raise IsolationUnavailable('Process attributes unavailable')
            info=StartupEx();info.StartupInfo.cb=c.sizeof(info);info.lpAttributeList=c.cast(buffer,c.c_void_p);caps=SecurityCapabilities(sid,None,0,0)
            update=bind(kernel,'UpdateProcThreadAttribute',w.BOOL,[c.c_void_p,w.DWORD,c.c_size_t,c.c_void_p,c.c_size_t,c.c_void_p,c.c_void_p])
            if not update(info.lpAttributeList,0,0x20009,c.byref(caps),c.sizeof(caps),None,None):raise IsolationUnavailable('AppContainer process attributes unavailable')
            job=bind(kernel,'CreateJobObjectW',w.HANDLE,[c.c_void_p,w.LPCWSTR])(None,None)
            close=bind(kernel,'CloseHandle',w.BOOL,[w.HANDLE]);terminate=bind(kernel,'TerminateProcess',w.BOOL,[w.HANDLE,w.UINT]);process=Process()
            limits=Limits();limits.BasicLimitInformation.LimitFlags=0x2000|0x100|0x8;limits.BasicLimitInformation.ActiveProcessLimit=1;limits.ProcessMemoryLimit=256*1024*1024
            set_info=bind(kernel,'SetInformationJobObject',w.BOOL,[w.HANDLE,c.c_int,c.c_void_p,w.DWORD])
            if not job or not set_info(job,9,c.byref(limits),c.sizeof(limits)):raise IsolationUnavailable('Worker resource limits unavailable')
            cpu=CpuLimit(5,1000)
            if not set_info(job,15,c.byref(cpu),c.sizeof(cpu)):
                close(job);raise IsolationUnavailable('Worker CPU limit unavailable')
            systemroot=os.environ.get('SYSTEMROOT',r'C:\Windows')
            values={'SYSTEMROOT':systemroot,'WINDIR':systemroot,'SYSTEMDRIVE':Path(systemroot).drive,'COMSPEC':str(Path(systemroot)/'System32'/'cmd.exe'),'TEMP':str(root),'TMP':str(root),'USERPROFILE':str(root),'LOCALAPPDATA':str(root),'APPDATA':str(root),'PATH':str(runtime)+';'+str(Path(systemroot)/'System32')}
            environment=c.create_unicode_buffer('\0'.join(k+'='+v for k,v in sorted(values.items()))+'\0\0')

            command=c.create_unicode_buffer('"'+str(python)+'" -I -S "'+str(root/'runner.py')+'"')
            create=bind(kernel,'CreateProcessW',w.BOOL,[w.LPCWSTR,w.LPWSTR,c.c_void_p,c.c_void_p,w.BOOL,w.DWORD,c.c_void_p,w.LPCWSTR,c.c_void_p,c.POINTER(Process)])
            try:
                if not create(str(python),command,None,None,False,0x00080000|0x08000000|0x400|0x4,environment,str(root),c.byref(info),c.byref(process)):raise IsolationUnavailable('AppContainer launch failed '+str(c.get_last_error()))
                assign=bind(kernel,'AssignProcessToJobObject',w.BOOL,[w.HANDLE,w.HANDLE])
                if not assign(job,process.hProcess):terminate(process.hProcess,1);raise IsolationUnavailable('Worker job assignment failed')
                bind(kernel,'ResumeThread',w.DWORD,[w.HANDLE])(process.hThread)
                waited=bind(kernel,'WaitForSingleObject',w.DWORD,[w.HANDLE,w.DWORD])(process.hProcess,int(timeout*1000))
                if waited!=0:terminate(process.hProcess,1);raise TimeoutError('Isolated worker exceeded time limit')
                exit_code=w.DWORD();bind(kernel,'GetExitCodeProcess',w.BOOL,[w.HANDLE,c.POINTER(w.DWORD)])(process.hProcess,c.byref(exit_code))
                if exit_code.value:raise IsolationUnavailable('Worker exit code '+str(exit_code.value))
            finally:
                if process.hThread:close(process.hThread)
                if process.hProcess:close(process.hProcess)
                if job:close(job)
                bind(kernel,'DeleteProcThreadAttributeList',None,[c.c_void_p])(info.lpAttributeList)
        finally:
            bind(advapi,'FreeSid',c.c_void_p,[c.c_void_p])(sid)
            bind(userenv,'DeleteAppContainerProfile',c.c_long,[w.LPCWSTR])(profile)
