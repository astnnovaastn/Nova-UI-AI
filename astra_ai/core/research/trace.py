"""What a research run actually did, as an append-only log for the live canvas.

One file per research, kept apart from the research store: every store write takes a backup,
which is too slow for per-source events. Only observable actions are recorded (searches, sources,
phases, writing stages), never model reasoning. Tracing must never affect research, so a failure
here is logged and swallowed.
"""
import json
import logging
import re
import threading
import time
from pathlib import Path

from astra_ai.memory.shared_memory import safe

logger = logging.getLogger('research.trace')
MAX_EVENTS = 2000
MAX_TEXT = 600
TERMINAL = {'complete', 'failed'}


def clean(value):
    """Redacts credentials and bounds text. Keys are fixed by this module's callers."""
    if isinstance(value, str):
        return safe(value)[:MAX_TEXT]
    if isinstance(value, (bool, int, float)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        return [clean(item) for item in list(value)[:20]]
    if isinstance(value, dict):
        return {str(key)[:40]: clean(item) for key, item in list(value.items())[:20]}
    return clean(str(value))


class ResearchTrace:
    def __init__(self, root):
        self.root = Path(root) / 'traces'
        self.lock = threading.Lock()
        self.counts = {}
        # Told about each new event so the live connection can hint the page; optional.
        self.listener = None

    def _file(self, identifier):
        # Identifiers are generated hex digests; anything else never reaches the file system.
        return self.root / (identifier + '.jsonl') if re.fullmatch(r'[A-Za-z0-9_-]{1,80}', str(identifier)) else None

    def record(self, identifier, kind, phase='', status='done', context=None, **payload):
        try:
            path = self._file(identifier)
            if not path:
                return None
            with self.lock:
                count = self.counts.get(identifier)
                if count is None:
                    count = sum(1 for _ in open(path, encoding='utf-8')) if path.exists() else 0
                if count >= MAX_EVENTS:
                    return None
                event = {'seq': count + 1, 'at': time.time(), 'kind': kind, 'phase': phase, 'status': status, **clean(payload)}
                path.parent.mkdir(parents=True, exist_ok=True)
                with open(path, 'a', encoding='utf-8') as handle:
                    handle.write(json.dumps(event, ensure_ascii=False) + '\n')
                self.counts[identifier] = count + 1
            if self.listener and context:
                self.listener(context, identifier, event)
            return event
        except Exception:
            logger.warning('research_trace_failed kind=%s', kind, exc_info=True)
            return None

    def read(self, identifier, after=0):
        path = self._file(identifier)
        if not path or not path.exists():
            return []
        events = []
        with open(path, encoding='utf-8') as handle:
            for line in handle:
                try:
                    event = json.loads(line)
                except ValueError:
                    continue  # A line still being written; it is read next time.
                if event.get('seq', 0) > after:
                    events.append(event)
        return events

    def request_changes(self, identifier, context, item, updates):
        """Turns a change to a research's saved state into events, so no path can forget to report."""
        phase = updates.get('phase')
        if phase and phase != item.get('phase'):
            self.record(identifier, 'phase', phase, 'failed' if phase == 'failed' else 'done' if phase in TERMINAL else 'running', context)
        reason = updates.get('waiting_reason')
        if reason and reason != item.get('waiting_reason'):
            self.record(identifier, 'waiting', updates.get('phase') or item.get('phase', ''), 'failed' if phase == 'failed' else 'queued', context, reason=reason, next_attempt=updates.get('next_attempt'))
        provider = updates.get('writing_provider')
        if provider and (provider, updates.get('writing_model')) != (item.get('writing_provider'), item.get('writing_model')):
            self.record(identifier, 'writer', 'preparing_report', 'running', context, provider=provider, model=updates.get('writing_model', ''))
        if updates.get('synthesis_failure_kind'):
            self.record(identifier, 'writer_failed', 'preparing_report', 'failed', context, reason=updates['synthesis_failure_kind'])
        checkpoint = updates.get('synthesis_checkpoint')
        if isinstance(checkpoint, dict):
            old = item.get('synthesis_checkpoint') or {}
            sections = (checkpoint.get('plan') or {}).get('sections') or []
            if sections and not old.get('plan'):
                self.record(identifier, 'plan', 'preparing_report', 'done', context, sections=[row.get('heading', '') for row in sections if isinstance(row, dict)])
            parts = len(checkpoint.get('parts') or [])
            for index in range(len(old.get('parts') or []), min(parts, len(sections))):
                self.record(identifier, 'section', 'preparing_report', 'done', context, index=index + 1, total=len(sections), heading=sections[index].get('heading', ''))
