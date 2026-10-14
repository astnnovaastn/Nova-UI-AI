"""Local-only baseline/candidate benchmarks; output contains no memory content."""
import argparse
import ast
import copy
import json
from pathlib import Path
import statistics
import subprocess
import sys
import tempfile
import textwrap
import time
import tracemalloc
import types

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from astra_ai.memory import shared_memory
from astra_ai.memory.shared_memory import SharedMemory, atomic


def baseline_index():
    source = subprocess.check_output(['git', 'show', '3139474:astra_ai/memory/shared_memory.py'], cwd=ROOT, text=True, encoding='utf-8')
    tree = ast.parse(source)
    owner = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == 'SharedMemory')
    node = next(node for node in owner.body if isinstance(node, ast.FunctionDef) and node.name == '_index')
    scope = dict(vars(shared_memory))
    exec(textwrap.dedent(ast.get_source_segment(source, node)), scope)
    return scope['_index']


def percentile(values):
    values = sorted(values)
    return {'p50_ms': round(statistics.median(values), 2), 'p95_ms': round(values[min(len(values)-1, int(len(values)*.95))], 2)}


def measured(call):
    started = time.perf_counter(); call()
    return (time.perf_counter()-started)*1000


def populate(manager, size):
    manager.ensure_ready(); data = manager.load()
    for i in range(size):
        rid = 'fixture-'+str(i)
        data['records'][rid] = manager._record(rid, 'fact', 'meta_memory', 'fixture_'+str(i), f'cobalt instrument {i} supports orbital project {i%17}')
    manager._commit(data)


def run_case(folder, size, old=False, snapshot=None):
    manager = SharedMemory(memory_path=folder/'memory.json', transcript_path=folder/'history.json')
    if snapshot:
        manager.ensure_ready()
        atomic(manager.memory_path, snapshot[0]); atomic(manager.transcript_path, snapshot[1])
        atomic(manager.forgotten_path, snapshot[2])
    else:
        populate(manager, size)
    if old:manager._index = types.MethodType(baseline_index(), manager)
    query = 'memory' if snapshot else 'cobalt'
    tracemalloc.start()
    cold = measured(lambda:manager.recall_memory(query))
    warm = [measured(lambda:manager.recall_memory(query)) for _ in range(15)]
    manager.save_fact('meta_memory', 'benchmark_new_item', 'cobalt new benchmark marker')
    changed = measured(lambda:manager.recall_memory(query))
    context = [measured(lambda:manager.response_bundle(query=query)) for _ in range(5)]
    _, peak = tracemalloc.get_traced_memory(); tracemalloc.stop()
    return {'cold_ms': round(cold, 2), 'warm': percentile(warm), 'after_single_save_ms': round(changed, 2), 'context': percentile(context), 'python_peak_mib': round(peak/1024**2, 2), 'index_changes': getattr(manager, '_index_stats', None)}


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--live-root', type=Path); parser.add_argument('--output', type=Path); parser.add_argument('--sizes', default='2000,5000,20000')
    args = parser.parse_args(); report = {'provider_calls': 0, 'voice_first_audio': 'not_measured_by_local_benchmark', 'baseline_scope': 'Original FTS indexing with current shared-service context; not a historical end-to-end baseline', 'instrumentation': 'perf_counter timings with tracemalloc enabled; allocation tracking adds overhead', 'cases': {}}
    (ROOT/'.validation').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='recall-', dir=ROOT/'.validation') as temporary:
        folder = Path(temporary)
        for size in map(int, args.sizes.split(',')):
            case = {}
            for old in (True, False):
                target = folder/(str(size)+('-baseline' if old else '-candidate')); target.mkdir()
                case['baseline' if old else 'candidate'] = run_case(target, size, old)
            report['cases'][str(size)] = case
        if args.live_root:
            # Read a private snapshot without modifying or uploading its sources.
            paths = [args.live_root/'astra_ai/memory/long_term.json', args.live_root/'astra_ai/Date/nova_ai_memory.json', args.live_root/'astra_ai/memory/forgets.json']
            snapshot = [json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'records': {}} for path in paths]
            report['populated'] = {}
            for old in (True, False):
                target = folder/('populated-baseline' if old else 'populated-candidate'); target.mkdir()
                report['populated']['baseline' if old else 'candidate'] = run_case(target, 0, old, snapshot)
    if args.output:args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':main()
