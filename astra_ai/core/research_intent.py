"""Conservative research admission and scoped, local evidence retrieval.

No model or provider calls: quoted passages and model arguments cannot grant
permission. The caller supplies the frozen user turn and application context.
"""
import re
import unicodedata
import time
from .search_intent import is_explicit_search_request, user_utterance_only


def collection_action(name, arguments):
    action = arguments.get('action', '')
    return (name == 'search_web' and action not in {'read', 'get', 'status'}
            or name == 'search_widget_action' and action == 'run'
            or name == 'research_action' and action in {'request', 'run'}
            or name == 'research_artifact_action' and action in {'continue', 'expand', 'more_sources', 'more_media'})


def research_permission(context):
    if context.get('continuation'):
        return False
    # Set by the HTTP New research/Expand actions or the durable job executor,
    # never accepted from a model's function arguments.
    return bool(context.get('requested_research') or context.get('job_id')
                or is_explicit_search_request(context.get('user_text') or context.get('research_user_text', '')))


_GENERIC = set('a an the and or to of in on at for with from by as is are was were it its this that these those their them they you your me my i we our can could would will do does did know anything something tell explain please about search research investigate information details detail report reports findings evidence question questions model models initiatives initiative learning artificial intelligence ai latest current today yesterday week month now new more also use using have has had'.split())


def subject_terms(text):
    text = unicodedata.normalize('NFKC', user_utterance_only(text)).casefold()
    text = re.sub(r'\bdeep\s+mind\b', 'deepmind', text)
    text = re.sub(r'\brobots?\b|\brobotic\b', 'robotics', text)
    text = re.sub(r'\bplanning\b', 'plan', text)
    return set(re.findall(r'[^\W_]{3,}', text, re.U)) - _GENERIC


def fresh_request(text):
    return bool(re.search(r'\b(latest|today|current|now|recent|updated|fresh|news|price|release)\b', text, re.I))


def observe_search_offer(store, context, text, reply=''):
    """Remember an actual assistant offer, never treat that offer as consent."""
    from .research_learning import scope
    from astra_ai.memory.shared_memory import safe
    key = (scope(context), context.get('session_id', ''), context.get('research_id', ''))
    with store.lock:
        proposals = getattr(store, '_search_proposals', {})
        if not reply:
            if not re.fullmatch(r'(?:yes(?: please)?|go ahead|do it)[.! ]*', text.strip(), re.I):
                proposals.pop(key, None)
        elif (context.get('session_id') and context.get('turn_id') and text.strip() and safe(text) == text
                and not is_explicit_search_request(text)
                and re.search(r'\b(?:can|could|shall|would you|want|like)\b[^.!?]{0,160}\b(?:search|research|look up)\b', reply, re.I)):
            proposals[key] = {'query': text[:12000], 'turn_id': context['turn_id'], 'until': time.time()+180}
        store._search_proposals = {k:p for k,p in list(proposals.items())[-200:] if p['until'] > time.time()}


def saved_findings(store, query, context, *, force_page=False):
    """Retrieve passages, with their real IDs/dates, across the permitted archive.

    All subject terms must occur in the saved evidence. In particular, matching
    only OpenAI cannot satisfy an OpenAI AND robotics question. Older findings
    remain useful but never constitute verification of today's facts.
    """
    from .research_learning import scope
    wanted = subject_terms(query)
    selected = context.get('research_id', '')
    with store.lock:
        data = store.snapshot()
        candidates = []
        for identifier, item in data.get('artifacts', {}).items():
            if scope(item) != scope(context) or identifier in data.get('removed', {}):
                continue
            if store.get(identifier, context).get('status') != 'ok':
                continue
            if item.get('kind', 'research') != 'research' or item.get('completeness') != 'complete':
                continue
            if data.get('requests', {}).get(identifier, {}).get('publication_state') == 'preparing':
                continue
            sources = store.source_catalog(item)
            extensions = data.get('extensions', {}).get(identifier, [])
            body = item.get('report', '') + '\n\n' + '\n\n'.join(e.get('report', '') for e in extensions)
            content = item.get('query', '') + ' ' + body + ' ' + ' '.join(s.get('content', '') for s in sources)
            terms = subject_terms(content)
            if not (force_page and identifier == selected) and (not wanted or not wanted <= terms):
                continue
            # Prefer the displayed report, then the closest subject and newest
            # result. Do not simply return the first title containing one word.
            title_terms = subject_terms(item.get('query', ''))
            score = (identifier == selected, len(wanted & title_terms) / max(1, len(title_terms)), item.get('created_epoch', 0))
            candidates.append((score, identifier, item, body, sources))
        candidates.sort(key=lambda row: row[0], reverse=True)
        items = []
        for _, identifier, item, body, sources in candidates[:3]:
            paragraphs = re.split(r'\n\s*\n', body)
            ranked = sorted(enumerate(paragraphs), key=lambda row: len(subject_terms(row[1]) & wanted), reverse=True)
            chosen = sorted(ranked[:6], key=lambda row: row[0])
            passage = '\n\n'.join(p for _, p in chosen)[:10000]
            refs = {int(n) for n in re.findall(r'\bS(\d+)\b', passage)}
            items.append({'research_id': identifier, 'research_revision': item['revision'], 'query': item['query'],
                          'retrieved_at': item.get('created', ''), 'passage': passage,
                          'sources': [{'citation_id': 'S'+str(i+1), **{k: s.get(k, '') for k in ('title', 'url', 'retrieved_at')}}
                                      for i, s in enumerate(sources) if i+1 in refs]})
    return {'status': 'completed' if items else 'confirmation_required', 'operation': 'read_saved_findings',
            'cached': True, 'provider_calls': 0, 'items': items,
            'summary': ('Answer briefly from these saved passages. Citation IDs are local to each report. State their dates and gaps; do not claim fresh verification or start another search.' if items else
                        'No external research has started. Answer from your knowledge if sufficient; otherwise ask whether the user wants a web search. Do not retry another research tool without their explicit request.')}


def existing_turn(store, context):
    """One accepted collection per frozen user turn, independent of tool IDs."""
    from .research_learning import scope
    turn, session = context.get('turn_id'), context.get('session_id')
    if not turn or not session:
        return None
    with store.lock:
        data = store.snapshot()
        for identifier, row in data.get('requests', {}).items():
            if (scope(row) == scope(context) and identifier not in data.get('removed', {})
                    and row.get('kind', 'research') == 'research'
                    and row.get('origin_turn_id') == turn and row.get('origin_session_id') == session):
                return {'status': 'completed' if row.get('phase') == 'complete' else 'queued',
                        'research_id': identifier, 'job_id': row.get('job_id'), 'duplicate': True,
                        'summary': 'This user turn already has a research operation. Inspect that report/job; do not create another one.'}
        for identifier, operations in data.get('extension_operations', {}).items():
            if identifier in data.get('removed', {}) or scope(data.get('artifacts', {}).get(identifier, {})) != scope(context):
                continue
            for row in operations.values():
                if row.get('origin_turn_id') == turn and row.get('origin_session_id') == session:
                    return {'status': 'completed' if row.get('phase') == 'complete' else 'queued',
                            'research_id': identifier, 'job_id': row.get('job_id'), 'duplicate': True,
                            'summary': 'The same turn already has a saved continuation. Inspect it rather than collecting again.'}


def admission(store, name, arguments, context):
    if not collection_action(name, arguments):
        return None
    text = user_utterance_only(context.get('user_text') or context.get('research_user_text', ''))
    saved_action = (name == 'search_web' and arguments.get('action', '') in {'', 'expand'} or name == 'research_artifact_action' and arguments.get('action') in {'continue', 'expand'} or name == 'research_action' and arguments.get('action') == 'request')
    if (saved_action and not context.get('job_id') and context.get('research_id') and not research_permission(context)
            and re.search(r'^(?:please\s+)?(?:expand\s+(?:this|the|my)\s+(?:report|research)|add\s+(?:more\s+)?(?:detail|details|information|an?\s+explanation)\b.*\b(?:report|page)|extend\s+(?:this|the|my)\s+(?:report|page))', text, re.I)):
        duplicate = existing_turn(store, context)
        if duplicate:return duplicate
        item = store.get(context['research_id'], context).get('artifact', {})
        if item.get('completeness') == 'complete':return {'status': 'saved_extension_authorized'}
        return {'status': 'waiting_for_retry', 'reason': 'initial_report_pending', 'provider_calls': 0, 'summary': 'The original report is still preparing. No additional search has started.'}
    if not research_permission(context):
        from .research_learning import scope
        key = (scope(context), context.get('session_id', ''), context.get('research_id', ''))
        # A short-lived proposal permits a normal "yes" reply, but only for
        # this conversation/page and the original user-authored subject. It is
        # deliberately lost on restart; an old approval must not revive itself.
        with store.lock:
            proposals = getattr(store, '_search_proposals', {})
            proposals = {k: p for k, p in proposals.items() if p['until'] > time.time()}
            proposal = proposals.get(key)
            if proposal and re.fullmatch(r'(?:yes(?: please)?|go ahead|do it)[.! ]*', text, re.I) and proposal['turn_id'] != context.get('turn_id'):
                proposals.pop(key, None); store._search_proposals = proposals
                return {'status': 'authorized_once', 'confirmed_query': proposal['query']}
            if re.fullmatch(r'(?:no(?: thanks)?|cancel|stop|never mind)[.! ]*', text, re.I):
                proposals.pop(key, None)
            elif text and context.get('session_id') and context.get('turn_id') and not re.fullmatch(r'(?:yes(?: please)?|go ahead|do it)[.! ]*', text, re.I):
                # Refresh only on a genuine question, never an internal event or
                # model-generated query. Bounded state contains no credentials.
                from astra_ai.memory.shared_memory import safe
                if safe(text) == text and not re.search(r"\b(?:do not|don't|never|stop|cancel)\b", text, re.I):
                    proposals[key] = {'query': text[:12000], 'turn_id': context['turn_id'], 'until': time.time()+180}
            store._search_proposals = dict(list(proposals.items())[-200:])
        result = saved_findings(store, text, context, force_page=bool(context.get('research_id')))
        if result['items']:
            with store.lock:
                store._search_proposals.pop(key, None)
        return result
    if not context.get('job_id'):
        duplicate = existing_turn(store, context)
        if duplicate:
            return duplicate
        query = str(context.get('user_text') or arguments.get('query') or '')
        # An explicit refresh must actually retrieve fresh evidence. A new,
        # partially covered subject must not be silently treated as complete.
        if not context.get('requested_research') and not fresh_request(query):
            result = saved_findings(store, query, context)
            if result['items']:
                return result
    return None
