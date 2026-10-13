"""Bound the trusted image decoder process with a Windows Job Object."""
import ctypes as c
from ctypes import wintypes as w
import os

class Limits:
    def __init__(self,pid):
        if os.name!='nt':raise RuntimeError('Presence resource limits unavailable')
        kernel=c.WinDLL('kernel32',use_last_error=True)
        def bind(name,result,args):
            f=getattr(kernel,name);f.restype=result;f.argtypes=args;return f
        self.close_handle=bind('CloseHandle',w.BOOL,[w.HANDLE]);self.handle=bind('CreateJobObjectW',w.HANDLE,[c.c_void_p,w.LPCWSTR])(None,None)
        class Basic(c.Structure):_fields_=[('ProcessTime',c.c_longlong),('JobTime',c.c_longlong),('Flags',w.DWORD),('Min',c.c_size_t),('Max',c.c_size_t),('Active',w.DWORD),('Affinity',c.c_size_t),('Priority',w.DWORD),('Scheduling',w.DWORD)]
        class IO(c.Structure):_fields_=[(name,c.c_ulonglong) for name in ('ReadOps','WriteOps','OtherOps','ReadBytes','WriteBytes','OtherBytes')]
        class Extended(c.Structure):_fields_=[('Basic',Basic),('IO',IO),('ProcessMemory',c.c_size_t),('JobMemory',c.c_size_t),('PeakProcess',c.c_size_t),('PeakJob',c.c_size_t)]
        class Cpu(c.Structure):_fields_=[('Flags',w.DWORD),('Rate',w.DWORD)]
        limit=Extended();limit.Basic.Flags=0x2000|0x100|0x8;limit.Basic.Active=2;limit.ProcessMemory=256*1024*1024 # venv launcher plus its Python decoder
        cpu=Cpu(1|4,1000)
        set_info=bind('SetInformationJobObject',w.BOOL,[w.HANDLE,c.c_int,c.c_void_p,w.DWORD]);process=bind('OpenProcess',w.HANDLE,[w.DWORD,w.BOOL,w.DWORD])(0x101,False,pid)
        try:
            if not self.handle or not process or not set_info(self.handle,9,c.byref(limit),c.sizeof(limit)) or not set_info(self.handle,15,c.byref(cpu),c.sizeof(cpu)) or not bind('AssignProcessToJobObject',w.BOOL,[w.HANDLE,w.HANDLE])(self.handle,process):raise RuntimeError('Presence resource limits unavailable')
        except Exception:self.close();raise
        finally:
            if process:self.close_handle(process)
    def close(self):
        if self.handle:self.close_handle(self.handle);self.handle=None
