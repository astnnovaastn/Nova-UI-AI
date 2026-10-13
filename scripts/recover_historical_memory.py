"""Preview or merge local legacy backups using the authoritative shared service."""
import argparse,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.historical_recovery import discover,recover
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--commit',action='store_true');parser.add_argument('--report',type=Path);args=parser.parse_args()
manager=SharedMemory(memory_path=root/'astra_ai/memory/long_term.json',transcript_path=root/'astra_ai/Date/nova_ai_memory.json')
report=recover(manager,discover(root),commit=args.commit)
if args.report:
    from astra_ai.memory.shared_memory import atomic
    atomic(args.report,report)
print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
print(json.dumps({'files':len(report['files']),'malformed':[x['path'] for x in report['files'] if x.get('status')=='malformed']},indent=2))
