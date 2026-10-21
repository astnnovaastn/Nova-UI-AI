import asyncio,json,threading
from datetime import datetime,timezone
from types import SimpleNamespace
import pytest
from dotenv import dotenv_values
from fastapi import HTTPException
from astra_ai.core.background_budget import BudgetPaused
from astra_ai.core.research_openai import configured_research_model
from astra_ai.core.research_model import requested_research_budget,research_budget_path
from astra_ai.memory.shared_memory import atomic
from astra_ai.ui.backend.research_provider_settings import ResearchProviderSettings,write_environment


def fixture(tmp_path):
    env=tmp_path/'.env'
    env.write_text('GEMINI_API_KEY=private-google\nNOVA_RESEARCH_OPENAI_API_KEY=private-openai\nGEMINI_LIVE_MODEL=unchanged-live\n',encoding='utf-8')
    settings=lambda name:dotenv_values(env).get(name)
    slot=threading.Lock()
    budget=requested_research_budget(research_budget_path(tmp_path,settings),slot,settings)
    state={'writer':configured_research_model(settings,lambda:settings('GEMINI_API_KEY'),budget,{},'unused'),'live':object()}
    manager=ResearchProviderSettings(env,tmp_path,settings,lambda:settings('GEMINI_API_KEY'),slot,
        lambda:state['writer'],lambda value:state.update(writer=value),'unchanged-live')
    return manager,state,env


def test_provider_switch_persists_choice_preserves_keys_usage_and_live(tmp_path):
    manager,state,env=fixture(tmp_path);original_live=state['live'];old=state['writer']
    assert old.provider=='gemini' and old.model_provider()=='gemini-3.5-flash'
    day=datetime.now(timezone.utc).date().isoformat()
    atomic(old.budget.path,{'day':day,'requests':37,'tokens':461875,'next_attempt':0})
    original=old.budget.path.read_bytes()
    result=asyncio.run(manager.activate('openai','gpt-4.1-mini'))
    assert result['provider']=='openai' and state['writer'].provider=='openai'
    assert state['writer'].budget.slot is old.budget.slot
    assert old.budget.path.read_bytes()==original and state['live'] is original_live
    assert dotenv_values(env)['GEMINI_API_KEY']=='private-google'
    assert dotenv_values(env)['NOVA_RESEARCH_OPENAI_API_KEY']=='private-openai'
    assert dotenv_values(env)['GEMINI_LIVE_MODEL']=='unchanged-live'
    assert 'private-' not in json.dumps(result)
    assert result['providers'][0]['local_limit_reached'] is True
    with pytest.raises(BudgetPaused,match='research_provider_switching'):
        with old.budget.lease(100):pytest.fail('deactivated provider must not obtain a new lease')
    restored=asyncio.run(manager.activate('gemini','gemini-3.5-flash'))
    assert restored['provider']=='gemini' and state['writer'].model_provider()=='gemini-3.5-flash'
    assert old.budget.path.read_bytes()==original


def test_deactivate_research_never_uses_a_provider_or_drops_saved_keys(tmp_path):
    manager,state,env=fixture(tmp_path)
    result=asyncio.run(manager.activate('none'))
    assert result['provider']=='none' and not any(row['active'] for row in result['providers'])
    with pytest.raises(BudgetPaused,match='research_writer_disabled'):state['writer'].structured('Answer',{}, {})
    assert not (tmp_path/'research_gemini_budget.json').exists()
    assert all(row['configured'] for row in result['providers']) and dotenv_values(env)['NOVA_RESEARCH_PROVIDER']=='none'
    assert result['chat_provider']=='gemini_live'


def test_switch_waits_for_existing_call_and_blocks_new_old_provider_leases(tmp_path):
    manager,state,env=fixture(tmp_path);old=state['writer']
    async def run():
        manager.slot.acquire()
        task=asyncio.create_task(manager.activate('openai','gpt-4.1-mini'))
        try:
            await asyncio.sleep(.02)
            assert manager.switching and state['writer'] is old and not task.done()
            with pytest.raises(BudgetPaused,match='research_provider_switching'):
                with old.budget.lease(100):pytest.fail('must not start another old-provider request')
        finally:manager.slot.release()
        await task
        assert state['writer'].provider=='openai' and not manager.switching and not manager.slot.locked()
    asyncio.run(run())


def test_canceled_switch_does_not_strand_shared_model_slot(tmp_path):
    manager,state,env=fixture(tmp_path);old=state['writer']
    async def run():
        manager.slot.acquire()
        task=asyncio.create_task(manager.activate('openai','gpt-4.1-mini'))
        try:
            await asyncio.sleep(.01);task.cancel()
            with pytest.raises(asyncio.CancelledError):await task
            assert state['writer'] is old and old.budget.suspension_reason=='' and not manager.switching
        finally:manager.slot.release()
        assert manager.slot.acquire(False);manager.slot.release()
    asyncio.run(run())


def test_failed_persistence_keeps_previous_writer_and_connection(tmp_path,monkeypatch):
    import astra_ai.ui.backend.research_provider_settings as module
    manager,state,env=fixture(tmp_path);old=state['writer'];before=env.read_bytes()
    monkeypatch.setattr(module,'write_environment',lambda *args:(_ for _ in ()).throw(OSError('storage unavailable')))
    with pytest.raises(OSError):asyncio.run(manager.activate('openai','gpt-4.1-mini'))
    assert state['writer'] is old and env.read_bytes()==before
    assert not manager.slot.locked() and old.budget.suspension_reason==''


@pytest.mark.parametrize('provider,model',[('other','model'),('gemini','https://unsafe.test/model'),('openai','bad\nsetting=value')])
def test_invalid_provider_or_model_cannot_modify_settings(tmp_path,provider,model):
    manager,state,env=fixture(tmp_path);before=env.read_bytes()
    with pytest.raises(ValueError):asyncio.run(manager.activate(provider,model))
    assert env.read_bytes()==before and state['writer'].provider=='gemini'


def test_missing_key_cannot_activate_provider_and_saving_key_does_not_activate(tmp_path):
    manager,state,env=fixture(tmp_path)
    write_environment(env,{'NOVA_RESEARCH_OPENAI_API_KEY':''})
    with pytest.raises(ValueError,match='Save an? OpenAI'):asyncio.run(manager.activate('openai'))
    write_environment(env,{'NOVA_RESEARCH_OPENAI_API_KEY':'new-private-openai'})
    assert manager.status()['provider']=='gemini'
    assert manager.status()['providers'][1]['configured'] is True


def test_environment_writes_preserve_comments_and_reject_injected_lines(tmp_path):
    env=tmp_path/'.env';env.write_text('# retained\nGEMINI_API_KEY=old\nOTHER="two words"\n')
    write_environment(env,{'GEMINI_API_KEY':'new-private','NOVA_RESEARCH_PROVIDER':'gemini'})
    assert '# retained' in env.read_text() and dotenv_values(env)['OTHER']=='two words'
    with pytest.raises(ValueError):write_environment(env,{'GEMINI_API_KEY':'bad\nOTHER=replaced'})
    assert dotenv_values(env)['OTHER']=='two words'


def test_provider_routes_require_owner_session(tmp_path,monkeypatch):
    import server
    manager,state,env=fixture(tmp_path)
    monkeypatch.setattr(server,'research_provider_settings',manager)
    def denied(request):raise HTTPException(403,'Owner required')
    monkeypatch.setattr(server,'_learning_context',denied)
    with pytest.raises(HTTPException) as error:asyncio.run(server.activate_research_provider(object(),{'provider':'openai'}))
    assert error.value.status_code==403 and state['writer'].provider=='gemini'
    with pytest.raises(HTTPException):asyncio.run(server.research_provider_status(object()))
