import asyncio,json
from types import SimpleNamespace
from astra_ai.ui.backend.aegis_runtime import sanitize_ui,set_ui,UI_CONTEXTS,activity,unavailable
from astra_ai.ui.backend.gemini_live import GeminiLiveSession
from astra_ai.memory.live_memory import LiveMemoryManager

def test_ui_allowlist_and_secret_redaction():
    result=sanitize_ui({"revision":2,"view":"memory","title":"Current view","api_key":"secret","password":"secret","summary":"AIza"+"x"*32,"draft":"private", "widgets":["notes"]})
    assert result["summary"]=="[redacted]"
    assert not {"api_key","password","draft"}&result.keys()
    assert len(json.dumps(result))<=4000

def test_context_rejects_stale_revisions():
    UI_CONTEXTS.clear();assert set_ui("fixture",{"revision":2,"view":"memory"})
    assert not set_ui("fixture",{"revision":1,"view":"dashboard"})
    assert UI_CONTEXTS["fixture"]["view"]=="memory"
    assert not set_ui("fixture",{"revision":"invalid"})
    UI_CONTEXTS.clear()

def test_activity_keeps_ids_and_sources_without_content():
    event=activity("recall_memory",{}, {"matches":[{"id":"r","value":"private fact","session_id":"s"}]},operation_id="op")
    assert event["phase"]=="retrieval_results" and event["record_ids"]==["r"] and event["session_ids"]==["s"]
    assert "private fact" not in json.dumps(event)
    assert activity("save_memory",{}, {"status":"pending_approval"})["phase"]=="pending"
    assert activity("save_memory",{}, {"status":"failed"})["phase"]=="failed"
    assert activity("save_memory",{}, {"status":"saved","id":"r"})["phase"]=="committed"

def test_authentication_is_not_a_fallback_loop():
    assert not unavailable(Exception("API_KEY_INVALID 401"))
    assert unavailable(Exception("404 model not found"))
    assert unavailable(TimeoutError())

def test_receive_all_audio_parts_and_drop_canceled_generation(tmp_path):
    async def run():
        events=[];audio=[]
        async def send(message): events.append(message)
        async def binary(data): audio.append(data)
        async def fail(*args): raise AssertionError(args)
        manager=LiveMemoryManager(memory_path=tmp_path/"long.json",transcript_path=tmp_path/"chat.json");manager.ensure_ready()
        session=GeminiLiveSession(api_key="test",memory_file=tmp_path/"chat.json",memory_manager=manager,send_json=send,send_bytes=binary,on_failure=fail)
        def response(interrupted,chunks):
            return SimpleNamespace(data=chunks[0] if chunks else None,tool_call=None,server_content=SimpleNamespace(interrupted=interrupted,input_transcription=None,output_transcription=None,turn_complete=False,model_turn=SimpleNamespace(parts=[SimpleNamespace(inline_data=SimpleNamespace(data=data,mime_type="audio/pcm")) for data in chunks])))
        async def receive():
            yield response(False,[b"one",b"two"])
            yield response(True,[b"stale"])
            yield response(False,[b"late-canceled"])
            await session.begin_audio()
            fresh=response(False,[b"new"])
            fresh.server_content.input_transcription=SimpleNamespace(text="New user turn")
            yield fresh
            session._closed=True
        async def signal(**kwargs):pass
        session._session=SimpleNamespace(receive=receive,send_realtime_input=signal)
        await session._receive_loop()
        assert audio==[b"one",b"two",b"new"]
        generations=[e["generation"] for e in events if e["type"]=="live_audio_generation"]
        assert len(generations)==2 and generations[0]!=generations[1]
    asyncio.run(run())


def test_preferences_match_controls_and_preserve_unreadable_store(tmp_path,monkeypatch):
    import pytest
    from fastapi import HTTPException
    from astra_ai.ui.backend import server
    path=tmp_path/"preferences.json"
    monkeypatch.setattr(server,"_preferences_path",path)
    assert asyncio.run(server.get_user_preferences())["honorific"]=="sir"
    result=asyncio.run(server.save_user_preferences({"honorific":"ma'am","user_name":"Fixture"}))
    assert result["status"]=="saved"
    assert asyncio.run(server.get_user_preferences())["honorific"]=="ma'am"
    path.write_text("{unreadable",encoding="utf-8")
    with pytest.raises(HTTPException):
        asyncio.run(server.save_user_preferences({"honorific":"none"}))
    assert path.read_text(encoding="utf-8")=="{unreadable"

def test_explicit_speech_boundaries_resume_without_transcription(tmp_path):
 async def run():
  events=[];audio=[];signals=[]
  async def send(m):events.append(m)
  async def binary(b):audio.append(b)
  async def failure(*args):raise AssertionError(args)
  manager=LiveMemoryManager(memory_path=tmp_path/'long.json',transcript_path=tmp_path/'chat.json');manager.ensure_ready()
  session=GeminiLiveSession(api_key='fixture',memory_file=tmp_path/'chat.json',memory_manager=manager,send_json=send,send_bytes=binary,on_failure=failure)
  async def signal(**kwargs):signals.append(kwargs)
  def response(interrupted,data,complete=False):return SimpleNamespace(data=None,tool_call=None,server_content=SimpleNamespace(interrupted=interrupted,input_transcription=None,output_transcription=None,turn_complete=complete,model_turn=SimpleNamespace(parts=[SimpleNamespace(inline_data=SimpleNamespace(data=data,mime_type='audio/pcm'))])))
  async def receive():
   yield response(False,b'first')
   await session.begin_audio();await session.end_audio();await session.end_audio()
   yield response(True,b'canceled',True)
   yield response(False,b'new reply without delayed transcription')
   session._closed=True
  session._session=SimpleNamespace(receive=receive,send_realtime_input=signal)
  assert session._config().realtime_input_config.automatic_activity_detection.disabled is True
  await session._receive_loop()
  assert audio==[b'first',b'new reply without delayed transcription']
  assert [list(s)[0] for s in signals]==['activity_start','activity_end']
  assert not any(e['type']=='live_turn_complete' for e in events)
 asyncio.run(run())


def test_unsolicited_transcription_without_confirmed_speech_is_not_a_user_turn(tmp_path):
 async def run():
  events=[]
  async def send(m):events.append(m)
  async def binary(b):pass
  async def failure(*args):raise AssertionError(args)
  async def signal(**kwargs):pass
  manager=LiveMemoryManager(memory_path=tmp_path/'long.json',transcript_path=tmp_path/'chat.json');manager.ensure_ready()
  session=GeminiLiveSession(api_key='fixture',memory_file=tmp_path/'chat.json',memory_manager=manager,send_json=send,send_bytes=binary,on_failure=failure)
  def response(text):return SimpleNamespace(data=None,tool_call=None,server_content=SimpleNamespace(interrupted=False,input_transcription=SimpleNamespace(text=text),output_transcription=None,turn_complete=False,model_turn=None))
  async def receive():
   yield response('Unsolicited foreign transcript')
   await session.begin_audio()
   yield response('Real confirmed speech')
   session._closed=True
  session._session=SimpleNamespace(receive=receive,send_realtime_input=signal)
  await session._receive_loop()
  assert [e['text'] for e in events if e['type']=='live_input_transcript']==['Real confirmed speech']
 asyncio.run(run())


def test_separate_canceled_completion_preserves_new_speech(tmp_path):
 async def run():
  events=[]
  async def send(m):events.append(m)
  async def binary(b):pass
  async def failure(*args):raise AssertionError(args)
  async def signal(**kwargs):pass
  manager=LiveMemoryManager(memory_path=tmp_path/'long.json',transcript_path=tmp_path/'chat.json');manager.ensure_ready()
  session=GeminiLiveSession(api_key='fixture',memory_file=tmp_path/'chat.json',memory_manager=manager,send_json=send,send_bytes=binary,on_failure=failure)
  def response(interrupted=False,complete=False,text=None,output=None):
   return SimpleNamespace(data=None,tool_call=None,server_content=SimpleNamespace(interrupted=interrupted,turn_complete=complete,input_transcription=SimpleNamespace(text=text) if text else None,output_transcription=SimpleNamespace(text=output) if output else None,model_turn=None))
  async def receive():
   session._audio_started=True
   await session.begin_audio();await session.end_audio()
   yield response(interrupted=True)
   yield response(complete=True)
   assert session._has_new_audio
   yield response(text='What is my name?')
   yield response(output='Your test name is Fixture.')
   yield response(complete=True)
   session._closed=True
  session._session=SimpleNamespace(receive=receive,send_realtime_input=signal)
  await session._receive_loop()
  completions=[e for e in events if e['type']=='live_turn_complete']
  assert len(completions)==1 and completions[0]['input_text']=='What is my name?'
  assert [m['content'] for m in json.loads(manager.transcript_path.read_text())['conversation']]==['What is my name?','Your test name is Fixture.']
 asyncio.run(run())
