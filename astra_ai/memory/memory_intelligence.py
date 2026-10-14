"""Source-backed context, hybrid retrieval, episodes and reversible maintenance."""
import copy
import json
import re
import time
from .category_policy import lifecycle, matches_scope, instant


def evidence_text(record):
    from .shared_memory import canonical
    value = record.get('content') if record.get('kind') == 'conversation' else record.get('value')
    return value if isinstance(value, str) else canonical(value)


def pack_entries(entries, max_tokens=4000):
    """Whole JSON entries; UTF-8 byte ceiling is a conservative token upper bound."""
    budget = max(0, min(int(max_tokens), 12000))
    included = []; used = 2; overflow = []
    for entry in entries:
        encoded = json.dumps(entry, ensure_ascii=False, separators=(',', ':'))
        cost = len(encoded.encode('utf-8')) + 1
        if used + cost <= budget:
            included.append(entry); used += cost
        else:
            overflow.append(entry.get('id', ''))
    return {'entries': included, 'overflow_ids': overflow, 'complete': not overflow, 'token_upper_bound': used, 'budget_tokens': budget}


class MemoryIntelligence:
    def live_resumption(self, action, session_id, profile_id, project_id, model, handle=''):
        from .shared_memory import read, atomic, stable, now
        path = self.memory_path.parent / 'memory-runtime' / 'resumption.json'
        key = stable(session_id, profile_id, project_id, model)
        with self._lock:
            data = read(path, {'sessions': {}})
            if action == 'get':
                item = data['sessions'].get(key, {})
                created = instant(item.get('updated'))
                if created and time.time() - created.timestamp() < 7200:
                    return item.get('handle')
                return None
            if action == 'clear':data['sessions'].pop(key, None)
            elif action == 'save' and isinstance(handle, str) and 0 < len(handle) < 12000:
                if self.privacy_settings().get('private_session'):return None
                data['sessions'][key] = {'handle': handle, 'updated': now()}
            else:return None
            # Opaque tokens stay out of status, logs, exports and committed files.
            data['sessions'] = dict(list(data['sessions'].items())[-100:])
            atomic(path, data)
            return None

    def relevant_categories(self, query, limit=30, profile_id='', project_id=''):
        from .category_registry import catalog
        data = self.load(); rows = catalog(data, profile_id, project_id)
        tokens = set(re.findall(r'\w+', str(query).casefold()))
        relevant = {r.get('category') for r in self._keyword_recall(query, 30, profile_id=profile_id, project_id=project_id, lifecycle='all').get('matches', [])}
        def score(row):
            words = set(re.findall(r'\w+', ' '.join([row['label'], *row.get('aliases', [])]).casefold()))
            return len(words & tokens) * 3 + (8 if row['id'] in relevant else 0)
        ranked = sorted(rows.values(), key=lambda row: (-score(row), row['id']))
        return [{'id': r['id'], 'label': r['label'], 'policy_template': r['policy_template']} for r in ranked[:max(1, min(100, int(limit)))]]

    def consolidate_recall(self):
        """Quiet exact-duplicate demotion, through the existing organizer only."""
        import os
        if os.getenv('NOVA_AUTOMATIC_DORMANCY','1') != '1':
            return {'status': 'disabled'}
        if time.time() < getattr(self, '_next_consolidation', 0):
            return {'status': 'paused'}
        self._next_consolidation = time.time() + 65
        from .shared_memory import canonical
        data = self.load(); seen = {}; count = 0
        for record in sorted(data['records'].values(), key=lambda r: r.get('updated', ''), reverse=True):
            if record.get('kind') != 'fact' or lifecycle(record, data['_meta']) != 'active' or data['_meta'].get('recall_dormancy', {}).get(record['id'], {}).get('state') == 'dormant':
                continue
            marker = canonical([record.get(k, '') for k in ('scope', 'profile_id', 'project_id', 'category', 'key')] + [record.get('value')])
            other = seen.get(marker)
            if other:
                result = self.maintenance_action('dormant', record_id=record['id'], revision=record.get('revision', 1), related_id=other, reason='duplicate', profile_id=record.get('profile_id', ''), project_id=record.get('project_id', ''))
                count += result.get('status') == 'saved'
            else:
                seen[marker] = record['id']
            if count >= 4:break
        return {'status': 'ok', 'count': count}

    def prepare_intelligence(self):
        with self._lock:
            data = self.load()
            if data['_meta'].get('intelligence_version') == 1:
                return {'status': 'ready'}
            for path in (self.memory_path, self.transcript_path, self.forgotten_path):
                self._backup(path, 'pre_intelligence_v1')
            data['_meta']['intelligence_version'] = 1
            self._commit(data)
            return {'status': 'prepared'}

    def clock(self):
        if not getattr(self, '_clock_service', None):
            from astra_ai.core.time_service import TimeService
            self._clock_service = TimeService(self)
        return self._clock_service

    def time_action(self, action='now', **args):
        return self.clock().action(action, **args)

    def configure_semantic(self, provider=None, mode='shadow', daily_requests=40):
        from .semantic_recall import SemanticRecall
        self.semantic = SemanticRecall(self, provider, mode, daily_requests)
        return self.semantic.status()

    def _eligible_sources(self, **filters):
        from .retrieval_index import indexed_sources
        from .category_registry import category_ids
        data = self.read_snapshot()
        categories = category_ids(data, filters['category'], filters.get('profile_id', ''), filters.get('project_id', ''), True) if filters.get('category') else None
        dormant = data['_meta'].get('recall_dormancy', {})
        results = []
        sources = indexed_sources(self)
        if filters.get('candidate_ids') is not None:
            cache = getattr(self, '_source_lookup', None)
            signature = self._signature()
            if not cache or cache[0] != signature:
                cache = (signature, {r['id']: r for r in sources}); self._source_lookup = cache
            sources = [cache[1][rid] for rid in filters['candidate_ids'] if rid in cache[1]]
        for record in sources:
            if not matches_scope(record, filters.get('profile_id', ''), filters.get('project_id', ''), filters.get('scope')):
                continue
            attributes = record.get('attributes', {})
            if any(record.get(k) for k in ('private','private_session','inaccessible','forgotten_at')) or attributes.get('private') or attributes.get('private_session') or record.get('consent') in {'none','denied','revoked','private'}:
                continue
            if filters.get('kind') and record.get('kind') != filters['kind']:
                continue
            if filters.get('conversation_session_id') and record.get('kind') == 'conversation' and record.get('session_id') != filters['conversation_session_id']:
                continue
            if record.get('scope', '').startswith('session:') and record.get('session_id') != filters.get('session_id'):
                continue
            if categories is not None and record.get('category') not in categories:
                continue
            if record.get('kind') != 'conversation':
                state = lifecycle(record, data['_meta'])
                if state not in {'active', 'history'}:
                    continue
                source_ids = record.get('source_ids', [record['id']])
                if any(dormant.get(rid, {}).get('state') == 'dormant' for rid in source_ids) and not filters.get('include_dormant'):
                    continue
            when = instant(record.get('timestamp') or record.get('valid_from') or record.get('created'))
            if filters.get('since') and (not when or when < instant(filters['since'])):
                continue
            if filters.get('until') and (not when or when >= instant(filters['until'])):
                continue
            results.append(record)
        return results

    def retrieve_context(self, query='', limit=8, use_semantic=True, **filters):
        started = time.monotonic()
        query = str(query).strip()
        if not query or len(query) > 8000:
            return {'status': 'rejected', 'reason': 'query_required', 'matches': []}
        try:
            invalid_time = any(filters.get(k) and instant(filters[k]) is None for k in ('since', 'until'))
        except (TypeError, ValueError):
            invalid_time = True
        if invalid_time:
            return {'status': 'rejected', 'reason': 'invalid_time_filter', 'matches': []}
        lexical_args = {k: v for k, v in filters.items() if k not in {'include_dormant', 'until', 'since', 'session_id', 'conversation_session_id'}}
        if filters.get('conversation_session_id'):lexical_args['session_id'] = filters['conversation_session_id']
        lexical_args['lifecycle'] = 'all'
        lexical = self._keyword_recall(query, 100, **lexical_args).get('matches', [])
        semantic = getattr(self, 'semantic', None)
        local_only = not (use_semantic and semantic and semantic.provider and semantic.mode != 'off')
        if local_only:
            candidate_ids = {r['id'] for r in lexical}
            for relationship in self.read_snapshot().get('relationships_v3', {}).values():
                if relationship.get('evidence') and (relationship.get('from') in candidate_ids or relationship.get('to') in candidate_ids):
                    candidate_ids.update([relationship.get('from'), relationship.get('to')])
            filters['candidate_ids'] = candidate_ids
        sources = self._eligible_sources(**filters)
        by_id = {r['id']: r for r in sources}
        lexical = [r for r in lexical if r['id'] in by_id]
        scores = {}; methods = {}
        for rank, record in enumerate(lexical):
            rid = record['id']; scores[rid] = 1 / (60 + rank); methods[rid] = ['keyword']
        scope_key = json.dumps([filters.get(k, '') for k in ('profile_id', 'project_id', 'scope')])
        semantic_hits = semantic.search(query, sources, scope_key=scope_key) if semantic and use_semantic else []
        if semantic:
            semantic.shadow_comparisons += bool(semantic_hits)
        if semantic and semantic.mode == 'enabled':
            for rank, (rid, similarity) in enumerate(semantic_hits):
                scores[rid] = scores.get(rid, 0) + 1 / (60 + rank)
                methods.setdefault(rid, []).append('semantic')
        # One-hop evidenced relationships only, with weaker rank than direct hits.
        data = self.read_snapshot()
        direct = set(scores)
        for relationship in data.get('relationships_v3', {}).values():
            if not relationship.get('evidence'):
                continue
            for source, target in [(relationship.get('from'), relationship.get('to')), (relationship.get('to'), relationship.get('from'))]:
                if source in direct and target in by_id:
                    scores[target] = max(scores.get(target, 0), scores[source] * .35)
                    methods.setdefault(target, []).append('relationship')
        results = []; seen = set()
        for rid in sorted(scores, key=lambda k: (-scores[k], k)):
            record = by_id[rid]
            # Repeated events retain distinct dates/sessions; duplicate current
            # facts do not displace diverse evidence in a bounded context.
            marker = (evidence_text(record), record.get('role'), record.get('session_id') if record.get('kind') == 'conversation' else record.get('key'), record.get('timestamp') if record.get('kind') == 'conversation' else '', record.get('category'))
            if marker in seen:
                continue
            seen.add(marker)
            results.append({**record, 'retrieval_method': list(dict.fromkeys(methods[rid])), 'retrieval_score': round(scores[rid], 6), 'source_ids': record.get('source_ids', [rid])})
            if len(results) >= max(1, min(int(limit), 40)):
                break
        # Recheck authority after any provider wait; stale edit/forget cannot leak.
        current = {r['id']: r for r in self._eligible_sources(**filters)}
        from .shared_memory import canonical
        results = [r for r in results if r['id'] in current and canonical(by_id[r['id']]) == canonical(current[r['id']])]
        timing = round((time.monotonic() - started) * 1000, 2)
        self._recall_metrics = {'last_ms': timing, 'returned': len(results), 'semantic_mode': semantic.mode if semantic else 'off'}
        return {'status': 'ok', 'matches': results, 'source_ids': list(dict.fromkeys(sid for r in results for sid in r['source_ids'])), 'revision': self.read_snapshot()['_meta'].get('last_updated'), 'complete': len(results) < min(int(limit), 40), 'retrieval_ms': timing, 'semantic_mode': semantic.mode if semantic else 'off'}

    def episode(self, record_id, limit=8, **filters):
        eligible = {r['id']: r for r in self._eligible_sources(include_dormant=True, **filters)}
        hit = eligible.get(record_id)
        if not hit or hit.get('kind') != 'conversation':
            return {'status': 'not_found'}
        candidates = [r for r in eligible.values() if r.get('kind') == 'conversation' and r.get('session_id') == hit.get('session_id')]
        candidates.sort(key=lambda r: (r.get('timestamp', ''), r['id']))
        same_turn = [r for r in candidates if hit.get('turn_id') and r.get('turn_id') == hit['turn_id']]
        index = next(i for i, r in enumerate(candidates) if r['id'] == record_id)
        neighboring = candidates[max(0, index - 2):index + 3]
        selected = {r['id']: r for r in [hit, *same_turn, *neighboring]}
        # Keep the requested exchange before spending room on neighbors.
        prioritized = {r['id']: r for r in [hit, *same_turn, *neighboring]}
        bounded = list(prioritized.values())[:max(2, min(int(limit), 12))]
        messages = sorted(bounded, key=lambda r: (r.get('timestamp', ''), 0 if r.get('role') == 'user' else 1, r['id']))
        return {'status': 'ok', 'session_id': hit.get('session_id'), 'turn_id': hit.get('turn_id'), 'messages': messages, 'source_ids': [r['id'] for r in messages], 'complete': len(selected) <= len(messages), 'revision': self.read_snapshot()['_meta'].get('last_updated')}

    def memory_context_action(self, action='retrieve', **args):
        if action == 'status':
            semantic = getattr(self, 'semantic', None)
            return {'status': 'ok', 'index': getattr(self, '_index_stats', {}), 'semantic': semantic.status() if semantic else {'mode': 'off'}, 'measurements': getattr(self, '_recall_metrics', {})}
        if action == 'retrieve':
            query = args.pop('query', '')
            return self.retrieve_context(query, **args)
        if action == 'episode':
            rid = args.pop('record_id', '')
            return self.episode(rid, **args)
        if action == 'provenance':
            rid = args.pop('record_id', '')
            record = next((r for r in self._eligible_sources(include_dormant=True, **args) if r['id'] == rid), None)
            if not record:
                return {'status': 'not_found'}
            return {'status': 'ok', 'record': record, 'source_ids': [rid], 'revision': record.get('revision', 1), 'timestamp': record.get('timestamp') or record.get('created'), 'history': record.get('history', [])}
        if action == 'timeline':
            records = self._eligible_sources(include_dormant=True, **args)
            records.sort(key=lambda r: (r.get('timestamp') or r.get('created') or '', r['id']))
            return {'status': 'ok', 'records': records[:40], 'source_ids': [r['id'] for r in records[:40]], 'complete': len(records) <= 40}
        return {'status': 'rejected', 'reason': 'invalid_context_action'}

    def response_bundle(self, query='', max_tokens=4000, **context):
        from .shared_memory import safe
        rules = self.standing_rules(**context)
        entries = [{'id': r['id'], 'kind': 'user_rule', 'revision': r.get('revision', 1), 'scope': r.get('scope'), 'text': safe(str(r['value']))} for r in rules['records']]
        records = self.context_records(query=query, **context)
        for r in records:
            if any(e['id'] == r['id'] for e in entries):
                continue
            entries.append({'id': r['id'], 'kind': 'research' if r.get('attributes', {}).get('external_knowledge') else r['kind'], 'category': r['category'], 'revision': r.get('revision', 1), 'timestamp': r.get('created'), 'valid_from': r.get('valid_from'), 'valid_until': r.get('valid_until'), 'text': safe(evidence_text(r))})
        if query:
            # Automatic context refresh stays local, including ordinary greetings.
            # A model-requested recall may use one semantic query when needed.
            recall = self.retrieve_context(query, limit=6, use_semantic=False, **context)
            for r in recall.get('matches', []):
                if any(e['id'] == r['id'] for e in entries):
                    continue
                entries.append({'id': r['id'], 'kind': r['kind'], 'speaker': r.get('role'), 'timestamp': r.get('timestamp') or r.get('created'), 'revision': r.get('revision', 1), 'text': safe(evidence_text(r)), 'retrieval_method': r.get('retrieval_method')})
        packed = pack_entries(entries, max_tokens)
        packed.update(revision=self.read_snapshot()['_meta'].get('last_updated'), standing_rule_total=rules['total'], time=self.time_action('now', **{k: v for k, v in context.items() if k in {'session_id', 'profile_id', 'project_id'}}))
        # Budget includes provenance/overflow/clock metadata, not just text.
        packed['overflow_count'] = len(packed['overflow_ids'])
        packed['overflow_ids'] = packed['overflow_ids'][:20]
        ceiling = max(512, int(max_tokens)-500)
        while packed['entries'] and len(json.dumps(packed, ensure_ascii=False, separators=(',', ':')).encode('utf-8')) > ceiling:
            removed = packed['entries'].pop()
            packed['overflow_count'] += 1
            if len(packed['overflow_ids']) < 20:packed['overflow_ids'].append(removed['id'])
            packed['complete'] = False
        packed['token_upper_bound'] = len(json.dumps(packed, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))
        self._working_context = {'source_ids': [e['id'] for e in packed['entries']], 'revision': packed['revision']}
        return packed

    def maintenance_action(self, action, *, record_id='', revision=None, reason='', related_id='', summary='', evidence=None, profile_id='', project_id=''):
        from .shared_memory import now, stable, canonical
        with self._lock:
            data = self.load()
            record = data['records'].get(record_id)
            if not record or not matches_scope(record, profile_id, project_id):
                return {'status': 'not_found'}
            if revision != record.get('revision', 1):
                return {'status': 'rejected', 'reason': 'stale_revision'}
            if action == 'summary':
                if not summary or len(summary) > 2000 or not evidence or not all(isinstance(q, str) and q and q in evidence_text(record) for q in evidence):
                    return {'status': 'rejected', 'reason': 'source_quotes_required'}
                self.prepare_intelligence(); data = self.load()
                sid = stable('summary', record_id, revision, summary)
                data['_meta'].setdefault('episodic_summaries', {})[sid] = {'id': sid, 'summary': summary, 'source_ids': [record_id], 'source_revision': revision, 'quotes': evidence, 'created': now(), 'kind': 'derived_summary_not_fact'}
                self._commit(data)
                return {'status': 'saved', 'id': sid}
            protected = record.get('category_policy', record.get('category')) in {'user_instructions', 'communication_boundaries', 'contextual_rules', 'user_identity', 'task_project_tracking', 'long_term_goals'} or record.get('pinned') or record.get('attributes', {}).get('pinned') or record.get('attributes', {}).get('unresolved')
            if action == 'dormant':
                other = data['records'].get(related_id)
                supported = reason == 'duplicate' and record.get('kind') == 'fact' and other and other.get('kind') == 'fact' and other['id'] != record_id and matches_scope(other, profile_id, project_id) and lifecycle(other, data['_meta']) == 'active' and canonical(record.get('value')) == canonical(other.get('value')) and all(record.get(k, '') == other.get(k, '') for k in ('scope', 'profile_id', 'project_id', 'category', 'key'))
                if protected or not supported:
                    return {'status': 'rejected', 'reason': 'protected_or_unsupported_disposition'}
            elif action != 'restore':
                return {'status': 'rejected', 'reason': 'invalid_maintenance_action'}
            self.prepare_intelligence(); data = self.load()
            item = data['_meta'].setdefault('recall_dormancy', {}).setdefault(record_id, {'history': []})
            item.update(state='dormant' if action == 'dormant' else 'active', reason=reason, related_id=related_id, revision=revision)
            item['history'].append({'action': action, 'reason': reason, 'timestamp': now(), 'revision': revision})
            self._commit(data)
            return {'status': 'saved', 'id': record_id, 'state': item['state']}
