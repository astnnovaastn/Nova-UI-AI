"""One bounded text turn and one Live audio turn, using only disposable memory."""
import asyncio,json,logging,tempfile,time,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'astra_ai/ui/backend'))
logging.disable(logging.CRITICAL)
from astra_ai.ui.backend import server
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.ui.backend.chat_stream import TextChat
from astra_ai.ui.backend.gemini_live import GeminiLiveSession,execute_shared_memory_tool

async def main():
 key=server.state.gemini_api_key;report={}
 if not key:report={'status':'not_configured'}
 else:
  with tempfile.TemporaryDirectory(prefix='nova-provider-check-') as tmp:
   root=Path(tmp).resolve();assert root.is_relative_to(Path(tempfile.gettempdir()).resolve())
   memory=SharedMemory(memory_path=root/'memory.json',transcript_path=root/'history.json');memory.ensure_ready()
   async def dispatch(name,args,context,op):
    return await execute_shared_memory_tool(memory,name,args,context.get('user_text',''),'fixture',op)
   text=TextChat(memory,lambda:key,server.ALL_AEGIS_TOOLS,dispatch);start=time.perf_counter();events=[]
   async def collect():
    async for event in text.events({'text':'Temporary integration check: reply with Ready. Do not use tools.','session_id':'fixture','operation_id':'provider-text'}):events.append(event)
   try:
    await asyncio.wait_for(collect(),40);end=events[-1];report['text']={'status':end['type'],'provider_code':end.get('provider_code'),'elapsed_ms':round((time.perf_counter()-start)*1000),'memory_status':end.get('memory_status'),'response_chars':len(end.get('response',''))}
   except Exception as exc:report['text']={'status':'failed','reason':type(exc).__name__}
   if report['text'].get('provider_code')==429:report['voice']={'status':'deferred','reason':'shared_project_quota'}
   else:
    done=asyncio.Event();received=[];audio=0
    async def send_json(event):
     received.append(event)
     if event['type']=='live_turn_complete':done.set()
    async def send_bytes(payload):
     nonlocal audio
     audio+=len(payload)
    async def failed(*args):done.set()
    session=GeminiLiveSession(api_key=key,memory_file=root/'history.json',memory_manager=memory,send_json=send_json,send_bytes=send_bytes,on_failure=failed)
    start=time.perf_counter()
    try:
     await asyncio.wait_for(session.start(),28);await session.send_text('Temporary integration check: say Ready. Do not save facts.');await asyncio.wait_for(done.wait(),25)
     complete=next((e for e in received if e['type']=='live_turn_complete'),None)
     report['voice']={'status':'completed' if complete and audio else 'failed','audio_bytes':audio,'memory_status':complete.get('memory_status') if complete else None,'elapsed_ms':round((time.perf_counter()-start)*1000),'model':session.model}
    except Exception as exc:report['voice']={'status':'failed','reason':type(exc).__name__}
    finally:await session.close()
 Path('artifacts/provider-learning-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
if __name__=='__main__':asyncio.run(main())
