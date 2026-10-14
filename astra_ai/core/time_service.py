"""Authoritative UTC observations, monotonic durations and scoped timelines."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import os
import re
import time
import uuid

DEFAULT_ZONE = 'Europe/Madrid'


def configured_timezone():
    value = os.getenv('NOVA_USER_TIMEZONE', DEFAULT_ZONE)
    try:
        ZoneInfo(value)
        return value
    except (ValueError, ZoneInfoNotFoundError):
        return DEFAULT_ZONE


class TimeService:
    def __init__(self, manager, wall=None, monotonic=None):
        self.manager = manager
        self.wall = wall or (lambda: datetime.now(timezone.utc))
        self.monotonic = monotonic or time.monotonic
        self.started = self.wall()
        self.tick = self.monotonic()
        self.runtime_id = uuid.uuid4().hex
        self.path = manager.memory_path.parent / 'memory-runtime' / 'time.json'
        self.segments = {}

    def zone(self, profile_id='', project_id=''):
        from astra_ai.memory.category_policy import matches_scope, lifecycle
        data = self.manager.read_snapshot()
        candidates = sorted([r for r in data.get('records', {}).values() if r.get('category_policy', r.get('category')) == 'timezone_preferences'], key=lambda r: r.get('updated', ''), reverse=True)
        for record in candidates:
            if record.get('category_policy', record.get('category')) != 'timezone_preferences' or not matches_scope(record, profile_id, project_id) or lifecycle(record, data['_meta']) != 'active':
                continue
            value = record.get('value')
            if isinstance(value, dict):
                value = value.get('timezone') or value.get('zone')
            if isinstance(value, str):
                try:
                    ZoneInfo(value)
                    return value
                except (ValueError, ZoneInfoNotFoundError):
                    pass
        return configured_timezone()

    def observe(self, kind, session_id='', profile_id='', project_id='', operation_id=''):
        from astra_ai.memory.shared_memory import read, atomic, stable
        if kind not in {'runtime_start', 'runtime_stop', 'conversation_start', 'interaction', 'reconnect', 'conversation_end', 'task_start', 'task_end'}:
            return {'status': 'rejected', 'reason': 'invalid_time_event'}
        with self.manager._lock:
            data = read(self.path, {'events': [], 'runtime': {}})
            identity = stable(kind, session_id, profile_id, project_id, operation_id or uuid.uuid4().hex)
            old = next((e for e in data['events'] if e['id'] == identity), None)
            if old:
                return {'status': 'duplicate', 'event': old}
            observed = self.wall().astimezone(timezone.utc).isoformat()
            event = {'id': identity, 'kind': kind, 'session_id': session_id, 'profile_id': profile_id, 'project_id': project_id, 'timestamp': observed, 'runtime_id': self.runtime_id}
            key = (session_id, profile_id, project_id)
            if kind == 'conversation_start':
                self.segments.setdefault(key, self.monotonic())
            if kind == 'conversation_end' and key in self.segments:
                event['active_seconds'] = max(0, self.monotonic() - self.segments.pop(key))
            if kind == 'runtime_start':
                previous = data.get('runtime', {})
                if previous.get('state') == 'running' and previous.get('id') != self.runtime_id:
                    data['interrupted_runtime'] = {'runtime_id': previous.get('id'), 'last_observed_at': previous.get('last_observed_at'), 'stop_time': None, 'reason': 'process_interrupted'}
                data['runtime'] = {'id': self.runtime_id, 'state': 'running', 'started': observed}
            data.setdefault('runtime', {}).update(last_observed_at=observed)
            if kind == 'runtime_stop':
                data['runtime'].update(state='stopped', stopped=observed)
                event['active_seconds'] = max(0, self.monotonic() - self.tick)
            # Private conversations may use the clock without retaining a timeline.
            if not self.manager.privacy_settings().get('private_session'):
                data['events'].append(event)
                atomic(self.path, data)
            return {'status': 'saved', 'event': event}

    def action(self, action='now', *, session_id='', profile_id='', project_id='', text='', at='', start='', end='', offset=0, limit=30):
        from astra_ai.memory.shared_memory import read
        zone_name = self.zone(profile_id, project_id)
        zone = ZoneInfo(zone_name)
        observed = self.wall().astimezone(timezone.utc)
        base = {'status': 'ok', 'observed_at': observed.isoformat(), 'timezone': zone_name, 'runtime_id': self.runtime_id}
        if action in {'now', 'status'}:
            local = observed.astimezone(zone)
            data = read(self.path, {}) if self.path.exists() else {}
            key = (session_id, profile_id, project_id)
            events = [e for e in data.get('events', []) if e.get('session_id') == session_id and e.get('profile_id', '') == profile_id and e.get('project_id', '') == project_id]
            first = next((e for e in events if e['kind'] == 'conversation_start'), None)
            last = next((e for e in reversed(events) if e['kind'] == 'interaction'), None)
            return {**base, 'utc': observed.isoformat(), 'local': local.isoformat(), 'conversation_day': (local - timedelta(hours=4)).date().isoformat(), 'day_boundary_hour': 4, 'runtime_active_seconds': max(0, self.monotonic() - self.tick), 'conversation_started_at': first.get('timestamp') if first else None, 'last_interaction_at': last.get('timestamp') if last else None, 'conversation_active_seconds': max(0, self.monotonic() - self.segments[key]) if key in self.segments else None, 'interrupted_runtime': data.get('interrupted_runtime'), 'event_ids': [e['id'] for e in events[-5:]]}
        if action == 'timeline':
            with self.manager._lock:
                events = read(self.path, {'events': []})['events']
            events = [e for e in events if e.get('profile_id', '') == profile_id and e.get('project_id', '') == project_id and (not session_id or e.get('session_id') == session_id)]
            offset = max(0, int(offset)); limit = max(1, min(100, int(limit)))
            return {**base, 'events': events[offset:offset + limit], 'total': len(events), 'next_offset': offset + limit if offset + limit < len(events) else None}
        if action == 'duration':
            try:
                a, b = self._instant(start), self._instant(end) if end else observed
                seconds = (b - a).total_seconds()
                if seconds < 0:
                    raise ValueError()
                return {**base, 'seconds': seconds, 'start': a.isoformat(), 'end': b.isoformat(), 'meaning': 'elapsed_wall_time_not_work_performed'}
            except (ValueError, TypeError):
                return {**base, 'status': 'needs_clarification', 'reason': 'aware_ordered_dates_required'}
        if action == 'resolve':
            try:
                anchor = self._instant(at).astimezone(zone) if at else observed.astimezone(zone)
            except (TypeError, ValueError):
                return {**base, 'status': 'needs_clarification', 'reason': 'ambiguous_anchor'}
            value = str(text).strip().casefold()
            shifts = {'today': 0, 'hoy': 0, 'yesterday': -1, 'ayer': -1, 'tomorrow': 1, 'mañana': 1}
            target = None
            if value in shifts:
                target = anchor.date() + timedelta(days=shifts[value])
            else:
                match = re.fullmatch(r'last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)', value)
                if match:
                    weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].index(match[1])
                    target = anchor.date() - timedelta(days=(anchor.weekday() - weekday) % 7 or 7)
                else:
                    match = re.fullmatch(r'(\d{1,4}) days? ago', value)
                    if match:
                        target = anchor.date() - timedelta(days=int(match[1]))
            if target is None:
                return {**base, 'status': 'needs_clarification', 'reason': 'ambiguous_time_reference'}
            a = datetime.combine(target, datetime.min.time(), zone)
            b = datetime.combine(target + timedelta(days=1), datetime.min.time(), zone)
            return {**base, 'date': target.isoformat(), 'since': a.astimezone(timezone.utc).isoformat(), 'until': b.astimezone(timezone.utc).isoformat(), 'until_exclusive': True, 'anchored_at': anchor.isoformat()}
        return {**base, 'status': 'rejected', 'reason': 'invalid_time_action'}

    @staticmethod
    def _instant(value):
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            raise ValueError('timezone_required')
        return parsed.astimezone(timezone.utc)
