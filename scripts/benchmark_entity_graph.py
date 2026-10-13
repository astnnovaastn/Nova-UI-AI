"""Disposable 10,000-record benchmark; never touches user stores."""
import tempfile,time,copy,json
from pathlib import Path
from astra_ai.memory.shared_memory import SharedMemory
from astra_ai.memory.entity_graph import snapshot,local_organize
with tempfile.TemporaryDirectory(prefix='nova-graph-benchmark-') as folder:
    m=SharedMemory(memory_path=Path(folder)/'memory.json',transcript_path=Path(folder)/'history.json');m.ensure_ready();m.save_fact('notes','seed','benchmark information')
    data=m.load();seed=next(iter(data['records'].values()));data['records']={f'fixture-{i}':{**copy.deepcopy(seed),'id':f'fixture-{i}','key':f'fixture {i}','value':f'benchmark searchable detail {i}'} for i in range(10000)};m._commit(data)
    start=time.perf_counter();local_organize(m);organization=(time.perf_counter()-start)*1000
    m.recall_memory('searchable');times=[]
    for _ in range(20):
        start=time.perf_counter();m.recall_memory('searchable',5);times.append((time.perf_counter()-start)*1000)
    start=time.perf_counter();g=snapshot(m,limit=1000);projection=(time.perf_counter()-start)*1000
    print(json.dumps({'records':10000,'recall_ms_mean':sum(times)/len(times),'recall_ms_max':max(times),'projection_ms':projection,'overview_page':len(g['nodes']),'total':g['total'],'organization_ms':organization}))
