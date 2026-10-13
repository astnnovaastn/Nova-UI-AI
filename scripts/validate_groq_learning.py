"""One bounded Groq learning request, sharing the application's background budget."""
import asyncio,json,logging,tempfile,sys,time
from pathlib import Path
repo=Path(__file__).resolve().parents[1];sys.path[:0]=[str(repo),str(repo/'astra_ai/ui/backend')];logging.disable(logging.CRITICAL)
from astra_ai.ui.backend import server
from astra_ai.core.background_model import BackgroundModel
from astra_ai.core.background_budget import BackgroundBudget
from astra_ai.core.learned_capabilities import LearnedCapabilities
from astra_ai.memory.shared_memory import SharedMemory
async def main():
 with tempfile.TemporaryDirectory(prefix='nova-groq-learning-check-') as tmp:
  root=Path(tmp).resolve();assert root.is_relative_to(Path(tempfile.gettempdir()).resolve())
  m=SharedMemory(memory_path=root/'memory.json',transcript_path=root/'history.json');m.ensure_ready()
  budget=BackgroundBudget(repo/'astra_ai/memory/background_budget.json');model=BackgroundModel(lambda:server._get_env_value('GROQ_API_KEY'),budget)
  async def broker(*args):raise RuntimeError('Pure fixture has no broker actions')
  caps=LearnedCapabilities(root/'learned',root,m,None,broker,model=model);caps.initialize();start=time.perf_counter()
  result=await caps.learn('Create a pure helper that adds one to a JSON number, returns only that number and has no broker capabilities.',{})
  report={'status':result['status'],'reason':result.get('reason'),'elapsed_ms':round((time.perf_counter()-start)*1000),'model':model.model}
  if result.get('tool_id'):
   item=caps.get(result['tool_id'],{})['item'];report['diagnostics']=item.get('diagnostics')
  if result.get('status')=='activated':
   examples=caps.get(result['tool_id'],{})['item']['input_examples'];value=examples[0];invoked=await caps.invoke(result['tool_id'],value,{},'fixture-real-groq');report['isolated_invocation']=invoked['status'];report['source_example_available']=True
  Path('artifacts/groq-learning-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
if __name__=='__main__':asyncio.run(main())
