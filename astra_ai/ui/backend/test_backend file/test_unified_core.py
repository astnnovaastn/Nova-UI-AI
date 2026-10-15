"""Regression coverage for shared Live turns and durable workflow inputs."""
import asyncio
import threading
from types import SimpleNamespace
from pathlib import Path
import pytest
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.ui.backend.gemini_live import GeminiLiveSession


def make_session(tmp_path, sent, **kwargs):
    manager = SharedMemory(memory_path=tmp_path/'long.json', transcript_path=tmp_path/'chat.json')
    manager.ensure_ready()
    async def send_json(message):sent.append(message)
    async def noop(*args):pass
    return GeminiLiveSession(api_key='fixture', memory_file=manager.transcript_path,
                             memory_manager=manager,send_json=send_json,send_bytes=noop,
                             on_failure=noop,**kwargs)


def test_completed_turn_cannot_clear_a_new_utterance(tmp_path, monkeypatch):
    async def scenario():
        sent=[];session=make_session(tmp_path,sent)
        entered=threading.Event();release=threading.Event()
        original=session.memory_manager.append_turn
        def slow(*args,**kwargs):
            entered.set();release.wait(3);return original(*args,**kwargs)
        monkeypatch.setattr(session.memory_manager,'append_turn',slow)
        session._input_parts=['First request'];session._output_parts=['First response']
        old_turn=session._turn_id
        task=asyncio.create_task(session._complete_turn())
        try:
            assert await asyncio.to_thread(entered.wait,2)
            session._input_parts.append('Next request starts immediately')
            session._speech_active=True;session._has_new_audio=True
        finally:release.set()
        await task
        assert session._input_parts==['Next request starts immediately']
        assert session._speech_active and session._has_new_audio and session._turn_id!=old_turn
        assert any(e['type']=='live_generation_complete' for e in sent)
        messages=list(session.memory_manager._messages())
        assert [m['content'] for m in messages]==['First request','First response']
    asyncio.run(scenario())


def test_core_is_import_safe_and_backend_is_compatibility_adapter():
    from astra_ai.core.aegis_ai import AegisCore
    from astra_ai.core.gemini_session import GeminiLiveSession as CoreSession
    assert CoreSession is GeminiLiveSession
    assert AegisCore.__module__.startswith('astra_ai.core')


def test_typed_request_id_is_deduplicated(tmp_path):
    async def scenario():
        sent=[];session=make_session(tmp_path,sent)
        calls=[]
        async def realtime(**kwargs):calls.append(kwargs)
        async def client_content(**kwargs):
            if kwargs.get('turn_complete'):calls.append({'text':kwargs['turns'].parts[0].text})
        session._session=SimpleNamespace(send_realtime_input=realtime,send_client_content=client_content)
        result=await session.send_text('Hello',request_id='typed-one')
        again=await session.send_text('Hello',request_id='typed-one')
        assert result['status']=='accepted' and again['status']=='duplicate'
        assert sum(c.get('text')=='Hello' for c in calls)==1
    asyncio.run(scenario())


def test_typed_interruption_preserves_new_message_and_spoken_reply(tmp_path):
    async def scenario():
        events=[];session=make_session(tmp_path,events);audio=[]
        async def binary(data):audio.append(data)
        session.send_bytes=binary
        async def noop(**kwargs):pass
        def response(interrupted=False,complete=False,output=None,data=None):
            return SimpleNamespace(data=data,tool_call=None,server_content=SimpleNamespace(interrupted=interrupted,turn_complete=complete,input_transcription=None,output_transcription=SimpleNamespace(text=output) if output else None,model_turn=None))
        async def receive():
            yield response(interrupted=True)
            yield response(complete=True)
            yield response(output='The current report is ready.',data=b'new speech')
            yield response(complete=True)
            session._closed=True
        session._session=SimpleNamespace(receive=receive,send_client_content=noop,send_realtime_input=noop)
        session._audio_started=True;session._output_parts=['Old answer']
        await session.send_text('Put that research in Notes','typed-interruption')
        await session._receive_loop()
        complete=[e for e in events if e['type']=='live_turn_complete']
        assert len(complete)==1 and complete[0]['input_text']=='Put that research in Notes'
        assert complete[0]['output_text']=='The current report is ready.'
        assert audio==[b'new speech']
    asyncio.run(scenario())


def test_completed_typed_message_is_not_replayed_after_restart(tmp_path):
    async def scenario():
        sent=[];session=make_session(tmp_path,sent)
        session.memory_manager.append_turn('A completed request','Verified result',session.session_id,'persisted-request')
        async def forbidden(**kwargs):raise AssertionError('Completed request replayed')
        session._session=SimpleNamespace(send_client_content=forbidden,send_realtime_input=forbidden)
        result=await session.send_text('A completed request','persisted-request')
        assert result['status']=='duplicate'
        assert sent[-1]['reconciled']
        assert (await session.send_text('Different request','persisted-request'))['status']=='rejected'
    asyncio.run(scenario())

def test_tool_latency_does_not_block_the_next_provider_transcript(tmp_path):
    async def scenario():
        from astra_ai.core.gemini_session import CURRENT_OPERATION
        events=[];entered=asyncio.Event();release=asyncio.Event();captured=[]
        async def operation(name,args):
            captured.append(dict(CURRENT_OPERATION.get()));entered.set();await release.wait()
            assert CURRENT_OPERATION.get()==captured[0]
            return {'status':'completed','note_id':'verified-note'}
        session=make_session(tmp_path,events,operation_executor=operation)
        session._input_parts=['Put that research in Notes'];session._has_new_audio=True
        call=SimpleNamespace(id='slow-notes',name='notes_action',args={'action':'import_research'})
        async def receive():
            yield SimpleNamespace(server_content=None,tool_call=SimpleNamespace(function_calls=[call]),data=None)
            await asyncio.wait_for(entered.wait(),1)
            yield SimpleNamespace(data=None,tool_call=None,server_content=SimpleNamespace(interrupted=False,turn_complete=False,input_transcription=SimpleNamespace(text='Now answer this new question'),output_transcription=None,model_turn=None))
            assert any(e.get('text')=='Now answer this new question' for e in events)
            session._closed=True
        session._session=SimpleNamespace(receive=receive)
        await asyncio.wait_for(session._receive_loop(),2)
        release.set();await asyncio.gather(*list(session._tool_tasks))
        assert captured[0]['user_text']=='Put that research in Notes'
        assert captured[0]['operation_id']=='slow-notes'
    asyncio.run(scenario())

@pytest.mark.parametrize('utterance',[
    'Can you search the web about OpenAI new models and what they can do?',
    'Can you open my notes widget and put in all the search information about OpenAI?',
])
def test_october_14_requests_keep_priority_over_late_development_results(utterance):
    from astra_ai.core.working_context import WorkingContext
    from astra_ai.core.aegis_live_context import AEGIS_LIVE_PERSONA
    working=WorkingContext();working.begin('Test the camera code','old-development')
    working.begin(utterance,'current-request')
    working.result('research_action',{'query':'camera code'},{'status':'completed','research_id':'old-result'},'old-development')
    assert working.snapshot()['latest_request']==utterance
    assert working.snapshot()['turn_id']=='current-request'
    assert 'Never guess what the user is coding' in AEGIS_LIVE_PERSONA
