"""Durable work runs, one JSON file each, and the shared daily token count.

The report, its sources and the Reader stay in the research store. A run holds how the report came
to be: the plan, assignments, worker results, evidence records and spend.
"""
from __future__ import annotations

import re
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from astra_ai.memory.shared_memory import atomic, read

from .contracts import RunState, as_dict, load

PUBLIC_FIELDS = ('run_id', 'research_id', 'state', 'stage', 'plan', 'assignments', 'artifacts', 'relations', 'usage', 'failure', 'created', 'updated')


class WorkStore:
    def __init__(self, root):
        self.root = Path(root) / 'work'
        self.lock = threading.RLock()

    def _path(self, run_id):
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', str(run_id)):
            raise ValueError('invalid_run_id')
        return self.root / 'runs' / (run_id + '.json')

    def create(self, run):
        with self.lock:
            path = self._path(run.run_id)
            existing = read(path, None)
            if existing:
                return load(RunState, existing)
            run.created = run.updated = time.time()
            path.parent.mkdir(parents=True, exist_ok=True)
            atomic(path, as_dict(run))
            return run

    def get(self, run_id):
        with self.lock:
            data = read(self._path(run_id), None)
        return load(RunState, data) if data else None

    def save(self, run):
        with self.lock:
            run.updated = time.time()
            atomic(self._path(run.run_id), as_dict(run))

    def public(self, run):
        """What the page may read. Full worker data and evidence text stay on the server."""
        data = as_dict(run)
        row = {key: data[key] for key in PUBLIC_FIELDS}
        row['request'] = {key: data['request'].get(key) for key in ('query', 'workflow', 'mode')}
        row['evidence'] = [{key: item.get(key) for key in ('id', 'url', 'title', 'domain', 'retrieved_at', 'relevance', 'credibility', 'assessment', 'fetched', 'query')} for item in data['evidence']]
        row['results'] = {name: {key: value.get(key) for key in ('agent', 'role', 'state', 'summary', 'provider', 'model', 'tokens', 'seconds', 'failure')} for name, value in data['results'].items() if isinstance(value, dict) and value.get('agent')}
        return row

    def spend_today(self, tokens=0):
        """Adds to today's count and returns the total. Measured tokens only ever add up."""
        path = self.root / 'usage.json'
        day = datetime.now(timezone.utc).date().isoformat()
        with self.lock:
            data = read(path, {})
            if data.get('day') != day:
                data = {'day': day, 'tokens': 0}
            if tokens:
                data['tokens'] += int(tokens)
                path.parent.mkdir(parents=True, exist_ok=True)
                atomic(path, data)
            return data['tokens']
