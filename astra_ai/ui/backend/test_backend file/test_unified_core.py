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
    from astra_ai.core.aegis_ai import GeminiLiveSession as CoreSession
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
        from astra_ai.core.aegis_ai import CURRENT_OPERATION
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


def test_late_research_tool_retains_question_without_reusing_general_authorisation(tmp_path):
    async def scenario():
        session=make_session(tmp_path,[])
        session.research_focus={'research_id':'pixel','thread_id':'research-pixel'}
        await session._pin_research()
        question='Compare low-light photos and portrait cameras.'
        session.working.begin(question,'camera-turn');session._input_parts=[question]
        session._detach_turn()
        frozen=session._operation_context()
        assert frozen['user_text']=='' and frozen['research_user_text']==question
        assert frozen['research_id']=='pixel'
        session.research_focus={'research_id':'another','thread_id':'research-another'}
        await session._pin_research()
        assert session._operation_context()['research_user_text']==''
        assert frozen['research_user_text']==question and frozen['research_id']=='pixel'
        session.research_focus={};await session._pin_research()
        assert session._operation_context()['research_user_text']==''
    asyncio.run(scenario())

@pytest.mark.parametrize('utterance',[
    'Can you search the web about OpenAI new models and what they can do?',
    'Can you open my notes widget and put in all the search information about OpenAI?',
])
def test_october_14_requests_keep_priority_over_late_development_results(utterance):
    from astra_ai.core.aegis_live_context import WorkingContext
    from astra_ai.core.aegis_live_context import AEGIS_LIVE_PERSONA
    working=WorkingContext();working.begin('Test the camera code','old-development')
    working.begin(utterance,'current-request')
    working.result('research_action',{'query':'camera code'},{'status':'completed','research_id':'old-result'},'old-development')
    assert working.snapshot()['latest_request']==utterance
    assert working.snapshot()['turn_id']=='current-request'
    assert 'Never guess what the user is coding' in AEGIS_LIVE_PERSONA


class ConversationProvider:
    def __init__(self,session):
        self.session=session;self.calls=[];self.events=asyncio.Queue()
    async def send_client_content(self,**kwargs):self.calls.append(kwargs)
    async def send_realtime_input(self,**kwargs):self.calls.append(kwargs)
    async def receive(self):
        while True:
            event=await self.events.get()
            if event is None:self.session._closed=True;return
            yield event
    async def push(self,**kwargs):
        fields={'interrupted':False,'turn_complete':False,'input_transcription':None,'output_transcription':None,'model_turn':None}
        audio=kwargs.pop('audio',None)
        for name in ('input_transcription','output_transcription'):
            if name in kwargs:kwargs[name]=SimpleNamespace(text=kwargs[name])
        fields.update(kwargs)
        await self.events.put(SimpleNamespace(data=audio,tool_call=None,server_content=SimpleNamespace(**fields)))
        await asyncio.sleep(.005)


def prepare_spoken_reply(session):
    session.working.reply('Close calendar','The calendar widget is closed.','old-calendar')
    session._turn_id='current-egon';session._input_parts=['Tell me about Egon and its German roots']
    session._output_parts=['The name Egon comes from German roots and historically refers to the edge of a sword.']
    session._audio_started=True;session._response_pending=True
    return session.audio_generation


def test_empty_noise_resumes_current_reply_not_old_calendar_and_never_reexecutes_tools(tmp_path,monkeypatch):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.02)
    async def scenario():
        events=[];calls=[]
        async def operation(name,args):calls.append(name);return {'status':'completed'}
        session=make_session(tmp_path,events,operation_executor=operation)
        provider=ConversationProvider(session);session._session=provider
        generation=prepare_spoken_reply(session)
        await session.begin_audio(generation,True)
        assert session._turn_id!='current-egon' and session._input_parts==[]
        receive=asyncio.create_task(session._receive_loop())
        await provider.push(interrupted=True)
        await provider.push(turn_complete=True)
        await session.end_audio(96)
        await session._recovery_task
        resumes=[c for c in provider.calls if c.get('turn_complete')]
        assert len(resumes)==1
        continuation=resumes[0]['turns'].parts[0].text
        assert 'Egon' in continuation and 'German roots' in continuation and 'calendar' not in continuation
        assert session._turn_id=='current-egon' and session._request_id==''
        assert any(e['type']=='live_interruption_recovered' and e['continuing'] for e in events)
        result=await session._execute_memory_tool(SimpleNamespace(id='must-not-repeat',name='notes_action',args={'action':'save'}))
        assert result.response['reason']=='continuation_has_no_new_authorization' and calls==[]
        # The explicit continuation can preempt a provider's response to noise.
        await provider.push(interrupted=True)
        await provider.push(turn_complete=True)
        assert session._turn_id=='current-egon' and session._output_parts[0].startswith('The name Egon')
        await provider.push(output_transcription='It is a traditional given name.',audio=b'continued speech')
        await provider.push(turn_complete=True)
        await provider.events.put(None);await receive
        rows=list(session.memory_manager._messages())
        assert len(rows)==2 and rows[0]['content']=='Tell me about Egon and its German roots'
        assert rows[1]['content'].endswith('It is a traditional given name.')
        assert all('Application continuation' not in r['content'] for r in rows)
        assert session.working.snapshot()['recent_exchanges'][-1]['assistant'].endswith('It is a traditional given name.')
    asyncio.run(scenario())


def test_completed_generation_recovers_buffered_playback_without_another_model_request(tmp_path,monkeypatch):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.01)
    async def scenario():
        events=[];session=make_session(tmp_path,events)
        generation=prepare_spoken_reply(session);frozen=session._detach_turn()
        await session._complete_turn(frozen)
        before=list(session.memory_manager._messages())
        provider=ConversationProvider(session);session._session=provider
        await session.begin_audio(generation,True);await session.end_audio(96)
        await session._recovery_task
        assert not any(c.get('turn_complete') for c in provider.calls)
        assert events[-1]['type']=='live_interruption_recovered' and not events[-1]['continuing']
        assert list(session.memory_manager._messages())==before
        assert not session._response_pending
        await session.close(end_logical=False)
    asyncio.run(scenario())


@pytest.mark.parametrize('delay,word',[(0,'stop'),(.05,'no'),(.1,'wait'),(.25,'sí')])
def test_real_words_cancel_noise_recovery_even_when_interruption_ack_is_late(tmp_path,monkeypatch,delay,word):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.35)
    async def scenario():
        events=[];session=make_session(tmp_path,events);provider=ConversationProvider(session);session._session=provider
        generation=prepare_spoken_reply(session);await session.begin_audio(generation,True)
        receive=asyncio.create_task(session._receive_loop());await session.end_audio(96)
        recovery=session._recovery_task
        await asyncio.sleep(delay)
        await provider.push(input_transcription=word)
        await provider.push(interrupted=True)
        await provider.push(turn_complete=True)
        await provider.push(output_transcription='I heard your current request.')
        await provider.push(turn_complete=True)
        await asyncio.sleep(.36-delay)
        assert recovery.cancelled() or recovery.done()
        assert not any(e['type']=='live_interruption_recovered' for e in events)
        await provider.events.put(None);await receive
        complete=[e for e in events if e['type']=='live_turn_complete']
        assert len(complete)==1 and complete[0]['input_text']==word
        assert complete[0]['turn_id']!='current-egon'
        assert complete[0]['output_text']=='I heard your current request.'
    asyncio.run(scenario())


@pytest.mark.parametrize('speech_ms',[None,400,float('nan')])
def test_untranscribed_sustained_or_unknown_voice_never_auto_resumes(tmp_path,monkeypatch,speech_ms):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.01)
    async def scenario():
        events=[];session=make_session(tmp_path,events);provider=ConversationProvider(session);session._session=provider
        generation=prepare_spoken_reply(session);session._detach_turn()
        await session.begin_audio(generation,True)
        await session.end_audio(speech_ms);await session._recovery_task
        assert not any(e['type']=='live_interruption_recovered' for e in events)
        assert events[-1]['type']=='live_interruption_unresolved'
        assert not any(c.get('turn_complete') for c in provider.calls)
        await session.close(end_logical=False)
    asyncio.run(scenario())


@pytest.mark.parametrize('action',['text','cancel','new_speech','close'])
def test_new_activity_or_explicit_stop_cancels_pending_recovery(tmp_path,monkeypatch,action):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.02)
    async def scenario():
        events=[];session=make_session(tmp_path,events);provider=ConversationProvider(session);session._session=provider
        generation=prepare_spoken_reply(session);session._detach_turn()
        await session.begin_audio(generation,True);await session.end_audio(96)
        task=session._recovery_task
        if action=='text':await session.send_text('A different request','current-typed')
        elif action=='cancel':session._cancel_recovery(clear=True);session._text_suspended=True
        elif action=='new_speech':await session.begin_audio()
        else:await session.close(end_logical=False)
        await asyncio.sleep(.03)
        assert task.done() and not any(e['type']=='live_interruption_recovered' for e in events)
        if action!='close':await session.close(end_logical=False)
    asyncio.run(scenario())


def test_immediate_context_survives_mute_and_reconnect_without_old_widget_topic(tmp_path):
    import json
    events=[];session=make_session(tmp_path,events)
    prepare_spoken_reply(session);session._detach_turn()
    session.working.muted=True
    session.working.begin('What were you saying?','follow-up')
    state=session.working.snapshot()
    assert state['recent_exchanges'][-1]['turn_id']=='current-egon'
    assert 'German roots' in state['recent_exchanges'][-1]['assistant']
    assert state['latest_request']=='What were you saying?' and state['microphone_muted']
    instruction=session._config().system_instruction
    assert 'German roots' in instruction and 'Older operation references are not the current topic' in instruction
    assert session._recent_messages[-1]['content'].startswith('The name Egon')
    from astra_ai.core.aegis_live_context import WorkingContext
    reconnected=WorkingContext();reconnected.seed(session._recent_messages)
    assert reconnected.snapshot()['recent_exchanges'][-1]['assistant']==state['recent_exchanges'][-1]['assistant']
    for i in range(20):reconnected.reply('x'*5000,'reply-'+str(i)+'z'*20000,str(i))
    assert len(json.dumps(reconnected.snapshot(),ensure_ascii=False))<8000
    assert len(reconnected.exchanges)==6


def test_continuation_provider_failure_keeps_session_open_without_retry_or_false_success(tmp_path,monkeypatch):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.01)
    async def scenario():
        events=[];session=make_session(tmp_path,events);provider=ConversationProvider(session);session._session=provider
        generation=prepare_spoken_reply(session);await session.begin_audio(generation,True)
        session._interruption['settled'].set()
        async def unavailable(**kwargs):
            if kwargs.get('turn_complete'):raise RuntimeError('429 quota exhausted')
        provider.send_client_content=unavailable
        await session.end_audio(96);await session._recovery_task
        assert events[-1]['type']=='live_continuation_failed'
        assert session.connected and not session._response_pending and session._await_new_input
        assert not any(e['type']=='live_generation_complete' for e in events)
        assert not list(session.memory_manager._messages())
        await session.close(end_logical=False)
    asyncio.run(scenario())


def test_completed_playback_recovery_suppresses_provider_reply_to_empty_activity(tmp_path,monkeypatch):
    from astra_ai.core import aegis_ai
    monkeypatch.setattr(aegis_ai,'EMPTY_INTERRUPTION_GRACE_SECONDS',.01)
    async def scenario():
        events=[];session=make_session(tmp_path,events);audio=[]
        async def binary(data):audio.append(data)
        session.send_bytes=binary
        generation=prepare_spoken_reply(session);frozen=session._detach_turn()
        await session._complete_turn(frozen)
        before=len(list(session.memory_manager._messages()))
        provider=ConversationProvider(session);session._session=provider
        await session.begin_audio(generation,True);await session.end_audio(96);await session._recovery_task
        receive=asyncio.create_task(session._receive_loop())
        await provider.push(output_transcription='Unrelated reply to noise',audio=b'must not play')
        await provider.push(turn_complete=True)
        await provider.events.put(None);await receive
        assert audio==[] and len(list(session.memory_manager._messages()))==before
        assert not any(e.get('text')=='Unrelated reply to noise' for e in events)
    asyncio.run(scenario())


def test_research_reply_pins_thread_before_report_switch(tmp_path):
    async def scenario():
        sent=[];session=make_session(tmp_path,sent)
        session.research_focus={'research_id':'first','thread_id':'research-first','messages':[]}
        await session._pin_research()
        session._input_parts=['First report follow-up'];session._output_parts=['First report answer']
        frozen=session._detach_turn()
        session.research_focus={'research_id':'second','thread_id':'research-second','messages':[]}
        await session._pin_research()
        session._speech_active=True
        await session._complete_turn(frozen)
        rows=list(session.memory_manager._messages())
        assert {r['session_id'] for r in rows}=={'research-first'}
        assert next(e for e in sent if e['type']=='live_generation_complete')['research_id']=='first'
        assert session._turn_focus['research_id']=='second'
    asyncio.run(scenario())


def test_shared_ui_context_preserves_research_focus_without_inventing_views():
    from astra_ai.core.aegis_live_context import sanitize_ui
    snapshot=sanitize_ui({'view':'research','research_id':'report','research_revision':'revision','thread_id':'research-report','revision':5})
    assert snapshot['view']=='research' and snapshot['research_id']=='report' and snapshot['thread_id']=='research-report'
    assert sanitize_ui({'view':'arbitrary'})['view']=='dashboard'
    assert sanitize_ui({'selection_revision':9,'recent_research_id':'report'})['selection_revision']==9
    assert sanitize_ui({'selection_revision':True}).get('selection_revision',0)==0


def test_turn_resolves_current_server_focus_before_freezing(tmp_path):
    async def scenario():
        sent=[];session=make_session(tmp_path,sent)
        selected={'research_id':'fresh','thread_id':'research-fresh','messages':[]}
        async def resolve():return dict(selected)
        session.research_focus_provider=resolve
        session.research_focus={'research_id':'stale','thread_id':'research-stale'}
        await session._pin_research()
        session._input_parts=['Question about the open report'];session._output_parts=['Its answer']
        frozen=session._detach_turn()
        selected.update(research_id='next',thread_id='research-next')
        await session._pin_research();await session._complete_turn(frozen)
        assert {r['session_id'] for r in session.memory_manager._messages()}=={'research-fresh'}
        assert session._turn_focus['research_id']=='next'
    asyncio.run(scenario())


def test_leaving_research_restores_main_context_without_restarting_live(tmp_path):
    async def scenario():
        session=make_session(tmp_path,[])
        session.memory_manager.append_turn('Main topic','Main answer',session.session_id,'main-turn')
        session.research_focus={'research_id':'report','thread_id':'research-report','messages':[]}
        await session._pin_research();session.working.begin('Report question','research-turn')
        session.research_focus={};await session._pin_research()
        assert not session._turn_focus
        assert session.working.snapshot()['recent_exchanges'][-1]['user']=='Main topic'
        assert not session.working.latest_request
    asyncio.run(scenario())
