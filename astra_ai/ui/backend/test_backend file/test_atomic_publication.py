import errno
import pytest
from astra_ai.memory import shared_memory as storage


@pytest.mark.parametrize('winerror',[5,32,33])
def test_transient_windows_lock_retries_same_staged_report(tmp_path,monkeypatch,winerror):
    path=tmp_path/'reports.json';storage.atomic(path,{'report':'Original'})
    replace=storage.os.replace;calls=[];delays=[]
    def locked_once(source,target):
        calls.append(source)
        if len(calls)==1:
            error=PermissionError(errno.EACCES,'File is in use');error.winerror=winerror;raise error
        replace(source,target)
    monkeypatch.setattr(storage.os,'replace',locked_once);monkeypatch.setattr(storage.time,'sleep',delays.append)
    storage.atomic(path,{'report':'Complete answer'})
    assert storage.read(path,{})=={'report':'Complete answer'}
    assert len(calls)==2 and calls[0]==calls[1] and delays==[.025]
    assert not list(tmp_path.glob('*.tmp'))


def test_persistent_lock_preserves_original_and_fails_after_bounded_retry(tmp_path,monkeypatch):
    path=tmp_path/'reports.json';storage.atomic(path,{'report':'Original'})
    calls=[]
    def locked(source,target):
        calls.append(source);error=PermissionError(errno.EACCES,'File is in use');error.winerror=32;raise error
    monkeypatch.setattr(storage.os,'replace',locked);monkeypatch.setattr(storage.time,'sleep',lambda _:None)
    with pytest.raises(PermissionError):storage.atomic(path,{'report':'New answer'})
    assert len(calls)==7 and storage.read(path,{})=={'report':'Original'}
    assert not list(tmp_path.glob('*.tmp'))


def test_real_permission_denial_is_not_retried(tmp_path,monkeypatch):
    calls=[]
    def denied(*args):calls.append(args);raise PermissionError(errno.EACCES,'Denied')
    monkeypatch.setattr(storage.os,'replace',denied)
    with pytest.raises(PermissionError):storage.atomic(tmp_path/'reports.json',{})
    assert len(calls)==1
