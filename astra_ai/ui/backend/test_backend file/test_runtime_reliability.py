import asyncio
import importlib.util
from pathlib import Path
from unittest.mock import AsyncMock
import httpx

spec = importlib.util.spec_from_file_location('nova_runtime_test', Path(__file__).resolve().parents[4] / 'scripts/nova_runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)

def test_restart_requests_join_and_startup_failure_is_reported(monkeypatch):
    async def run():
        gate = asyncio.Event()
        async def launch(): await gate.wait()
        monkeypatch.setattr(runtime, 'lock', asyncio.Lock())
        monkeypatch.setattr(runtime, 'worker', None)
        monkeypatch.setattr(runtime, 'stop_child', AsyncMock())
        monkeypatch.setattr(runtime, 'launch', launch)
        first = await runtime.request_restart()
        second = await runtime.request_restart()
        assert first['operationId'] == second['operationId']
        gate.set(); await runtime.worker
        assert runtime.operation['state'] == 'ready'
        monkeypatch.setattr(runtime, 'launch', AsyncMock(side_effect=RuntimeError('test startup failed')))
        await runtime.request_restart(); await runtime.worker
        assert runtime.operation['state'] == 'failed'
        assert runtime.operation['error'] == 'test startup failed'
    asyncio.run(run())

def test_healthy_recovery_does_not_restart(monkeypatch):
    monkeypatch.setattr(runtime, 'healthy', AsyncMock(return_value=True))
    assert asyncio.run(runtime.request_recovery())['action'] == 'reconnect'

def test_controller_rejects_foreign_origin_and_missing_control_header(monkeypatch):
    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=runtime.app), base_url='http://127.0.0.1:8341') as client:
            assert (await client.post('/api/runtime/restart')).status_code == 403
            assert (await client.post('/api/runtime/restart', headers={'Origin':'https://example.com','X-Nova-Control':'1'})).status_code == 403
    asyncio.run(run())
