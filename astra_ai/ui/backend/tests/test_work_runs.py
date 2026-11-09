"""AEGIS Work: routing, budgets, citations, checkpoints and failure honesty, with no network."""
import asyncio
import json
import time

import pytest

from astra_ai.core.research.artifacts import ResearchArtifacts
from astra_ai.core.work.catalog import WORKFLOWS, budget_for
from astra_ai.core.work.contracts import ANALYSIS, KNOWLEDGE_MAP, LEAD_PLAN, REPORT, SOURCE_ASSESSMENT, VERIFICATION, TaskPlan, WorkRequest
from astra_ai.core.work.orchestrator import WorkOrchestrator, canonical_url, choose_assignments, clean_map, strip_unknown_citations
from astra_ai.core.work.providers import ModelRouter, ProviderError, ProviderGuard, load_slots
from astra_ai.core.work.store import WorkStore

CONTEXT = {'client_id': 'c', 'profile_id': 'p', 'project_id': '', 'session_id': 's', 'job_id': 'job'}
SECRET = 'gsk_abcdefghijklmnopqrstuvwxyz0123456789'
ENV = {'NOVA_RESEARCH_PROVIDER': 'gemini', 'GEMINI_API_KEY': 'g-key', 'NOVA_RESEARCH_GEMINI_MODEL': 'gemini-test', 'GROQ_API_KEY': SECRET}


def settings(**extra):
    values = {**ENV, **extra}
    return lambda name: values.get(name, '')


class FakeAdapter:
    """Answers by schema, so a test states only what it cares about."""

    def __init__(self, plan=None, report=None, fail=None):
        self.calls = []
        self.plan = plan or {}
        self.report = report
        self.fail = fail or {}

    def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
        self.calls.append({'slot': slot.slot, 'model': slot.model, 'schema': schema, 'payload': payload, 'instruction': instruction, 'max_tokens': max_tokens})
        failure = self.fail.get(slot.slot)
        if failure:
            raise ProviderError(failure)
        return json.dumps(self.answer(schema, payload)), 100

    def answer(self, schema, payload):
        if schema is LEAD_PLAN:
            return {'title': 'Test title', 'acknowledgement': 'On it.', 'intent': 'answer it', 'constraints': [], 'mode': 'quick', 'clarification': '', 'needs_web': True,
                    'queries': ['alpha query', 'beta query'], 'sections': ['Answer'], 'assignments': [], 'reasoning_summary': 'A short answer is enough.', **self.plan}
        if schema is SOURCE_ASSESSMENT:
            return {'ranked': [{'id': row['id'], 'relevance': 4, 'credibility': 4, 'reason': 'good'} for row in payload['candidates']], 'follow_up_queries': [], 'summary': 'Good sources.'}
        if schema is ANALYSIS:
            first = payload['evidence'][0]['id'] if payload['evidence'] else 'S1'
            return {'findings': [{'claim': 'A real finding', 'source_ids': [first, 'S999'], 'confidence': 'high'}], 'comparison': 'They agree.', 'open_questions': [], 'summary': 'One finding.'}
        if schema is VERIFICATION:
            return {'checks': [{'finding': 0, 'verdict': 'supported', 'note': 'ok', 'source_ids': ['S1']}], 'gaps': [{'question': 'What is missing?', 'query': 'gap query'}], 'summary': 'Holds up.'}
        if schema is KNOWLEDGE_MAP:
            return {'title': 'Map', 'groups': [{'id': 'g1', 'title': 'Group'}], 'nodes': [{'id': 'a', 'title': 'A', 'kind': 'service', 'group': 'g1', 'summary': 'x', 'source_ids': ['S1', 'S999']}, {'id': 'b', 'title': 'B', 'kind': 'data', 'group': 'missing', 'summary': 'y', 'source_ids': []}],
                    'edges': [{'from': 'a', 'to': 'b', 'label': 'reads'}, {'from': 'a', 'to': 'ghost', 'label': 'no'}], 'summary': 'Mapped.'}
        if schema is REPORT:
            return {'title': 'R', 'report': self.report if self.report is not None else '# Result\n\nA cited claim [S1].', 'summary': 'Done.'}
        raise AssertionError('unexpected schema')


class FakeSearch:
    prepare_media = False

    def __init__(self, rows=None, error=None):
        self.network = asyncio.Semaphore(4)
        self.queries = []
        self.rows = rows
        self.error = error

    def _request(self, query, mode, count, depth='advanced'):
        self.queries.append(query)
        if self.error:
            return [], self.error
        if self.rows is not None:
            return self.rows, None
        slug = query.replace(' ', '-')
        return [{'title': 'Page ' + slug, 'url': 'https://' + slug + '.example.com/a', 'content': 'A long useful passage about ' + query + '. ' * 80, 'retrieved_at': '2026-11-06T00:00:00+00:00', 'provider': 'tavily'}], None


class FakeJobs:
    def __init__(self):
        self.state = 'running'

    def list(self, job, context):
        return {'status': 'ok', 'job': {'state': self.state}}


def build(tmp_path, adapter, search=None, jobs=None, env=None):
    artifacts = ResearchArtifacts(tmp_path / 'research')
    search = search or FakeSearch()
    router = ModelRouter(settings(**(env or {})), adapters={'gemini': adapter, 'groq': adapter, 'openai': adapter}, sleep=lambda _: None)
    service = WorkOrchestrator(WorkStore(tmp_path), router, lambda: (artifacts, search), jobs or FakeJobs(), settings(**(env or {})))
    return service, artifacts, search


def start(service, artifacts, query='What is alpha?', workflow='', mode='', storage='quick'):
    reserved = artifacts.reserve(query, storage, CONTEXT, 'op-' + query)
    service.create(reserved['id'], WorkRequest(query, workflow, mode), CONTEXT)
    return reserved['id']


def events(artifacts, identifier, kind=None):
    rows = artifacts.trace.read(identifier, 0)
    return [row for row in rows if not kind or row['kind'] == kind]


def test_quick_run_uses_one_worker_and_publishes_to_the_existing_report(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, search = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['status'] == 'completed'
    slots = [call['slot'] for call in adapter.calls]
    assert slots == ['lead', 'worker_a', 'lead']
    saved = artifacts.get(identifier, CONTEXT)['artifact']
    assert saved['phase'] == 'complete' and '[S1]' in saved['report'] and len(saved['sources']) == 2
    run = service.store.get(identifier)
    assert run.state == 'completed' and run.usage['calls'] == 3 and run.usage['tokens'] == 300
    assert [row['role'] for row in run.assignments] == ['discovery']
    assert {row['stage'] for row in events(artifacts, identifier, 'stage')} >= {'received', 'intent', 'classified', 'planned', 'assigned', 'search_strategy', 'discovered', 'assessed', 'evidence', 'writing', 'citations', 'finished'}


def test_direct_answer_uses_only_the_lead_and_says_it_has_no_sources(tmp_path):
    adapter = FakeAdapter(plan={'mode': 'direct', 'needs_web': False}, report='# Hello\n\nJust an answer.')
    service, artifacts, search = build(tmp_path, adapter)
    identifier = start(service, artifacts, 'Say hello')
    asyncio.run(service.run(identifier, CONTEXT))
    assert [call['slot'] for call in adapter.calls] == ['lead', 'lead'] and not search.queries
    assert 'No sources were retrieved' in artifacts.get(identifier, CONTEXT)['artifact']['report']


def test_detailed_work_keeps_requested_depth_and_full_report_with_one_model(tmp_path):
    sections = [
        ('Mechanisms', 'The operating mechanism and its boundary conditions are explained by the first source [S1].'),
        ('Comparison', 'The second source compares the observed behavior across the two environments [S2].'),
        ('Limitations', 'The measurements cover the documented scenarios, so their conclusions have limited scope [S1, S2].'),
    ]
    detailed = '# Detailed results\n\n' + '\n\n'.join(
        '## ' + title + '\n\n' + ((sentence + ' ') * 32).strip() for title, sentence in sections
    )

    class DepthAdapter(FakeAdapter):
        def answer(self, schema, payload):
            if schema is REPORT and len(payload['sections']) == 3:
                return {'title': 'Detailed results', 'report': detailed, 'summary': 'Complete.'}
            return super().answer(schema, payload)

    for mode, storage, headings in [('deep', 'detailed', [title for title, _ in sections]), ('quick', 'quick', ['Answer'])]:
        adapter = DepthAdapter(plan={'mode': 'quick', 'sections': headings, 'queries': ['q one', 'q two', 'q three', 'q four', 'q five', 'q six']})
        service, artifacts, search = build(tmp_path / mode, adapter)
        identifier = start(service, artifacts, 'Compare operating conditions', mode=mode, storage=storage)
        assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
        run = service.store.get(identifier)
        saved = artifacts.get(identifier, CONTEXT)['artifact']
        assert adapter.calls[0]['payload']['required_mode'] == run.plan['mode'] == mode
        assert run.usage['tokens'] <= run.budget['tokens']
        if mode == 'deep':
            assert [call['slot'] for call in adapter.calls] == ['lead', 'lead']
            assert adapter.calls[-1]['max_tokens'] == 10000
            assert len(search.queries) == 5 and len(saved['sources']) == 5
            assert saved['report'] == detailed == run.results['report_text']
            assert len(saved['report'].split()) > 1200
            assert not run.assignments
        else:
            assert len(adapter.calls) == 3
            assert adapter.calls[-1]['max_tokens'] == 2000
            assert len(saved['report'].split()) < 50


def test_detailed_output_limit_recovery_keeps_the_requested_scope(tmp_path):
    class LimitedAdapter(FakeAdapter):
        def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
            result = super().complete(slot, instruction, payload, schema, max_tokens, timeout)
            if schema is REPORT and sum(call['schema'] is REPORT for call in self.calls) == 1:
                raise ProviderError('output_limit')
            return result

    adapter = LimitedAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_LEAD_FALLBACK': 'none'})
    identifier = start(service, artifacts, 'Compare operating conditions', mode='deep', storage='detailed')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    writes = [call for call in adapter.calls if call['schema'] is REPORT]
    assert len(writes) == 2
    assert writes[1]['payload'] == writes[0]['payload']
    assert 'Complete every material section' in writes[1]['instruction']
    assert 'under 800 words' not in writes[1]['instruction']


def test_structured_run_saves_a_clean_map(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts, 'Map a system', 'knowledge-map', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    graph = next(row['data'] for row in run.artifacts if row['kind'] == 'knowledge_map')
    assert [node['id'] for node in graph['nodes']] == ['a', 'b']
    assert graph['nodes'][0]['source_ids'] == ['S1'] and graph['nodes'][1]['group'] == ''
    assert graph['edges'] == [{'from': 'a', 'to': 'b', 'label': 'reads'}]


def test_invented_citations_are_repaired_then_removed(tmp_path):
    adapter = FakeAdapter(report='# R\n\nClaim [S1, S42]. Other [S77].')
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    report = artifacts.get(identifier, CONTEXT)['artifact']['report']
    assert '[S1]' in report and 'S42' not in report and 'S77' not in report
    assert sum(call['schema'] is REPORT for call in adapter.calls) == 2


def test_lead_failure_falls_back_only_to_the_configured_slot_and_failure_is_honest(tmp_path):
    adapter = FakeAdapter(fail={'lead': 'http_503'})
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    assert {'lead', 'worker_b'} <= {call['slot'] for call in adapter.calls}

    alone = FakeAdapter(fail={'lead': 'http_503'})
    service, artifacts, _ = build(tmp_path / 'b', alone, env={'AEGIS_WORK_LEAD_FALLBACK': 'none'})
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result == {'status': 'failed', 'reason': 'work_model_http_503', 'research_id': identifier}
    assert artifacts.request_state(identifier, CONTEXT)['phase'] == 'failed'
    assert {call['slot'] for call in alone.calls} == {'lead'}
    assert artifacts.get(identifier, CONTEXT)['artifact']['report'] == ''


def test_unscored_sources_fill_a_thin_selection_but_scored_rubbish_does_not(tmp_path):
    class Partial(FakeAdapter):
        def answer(self, schema, payload):
            if schema is SOURCE_ASSESSMENT:
                rows = payload['candidates']
                return {'ranked': [{'id': rows[0]['id'], 'relevance': 5, 'credibility': 5, 'reason': 'best'}, {'id': rows[1]['id'], 'relevance': 0, 'credibility': 1, 'reason': 'off topic'}], 'follow_up_queries': [], 'summary': 'Few.'}
            return super().answer(schema, payload)
    rows = [{'title': 'P' + str(n), 'url': 'https://site' + str(n) + '.example.com/', 'content': 'text ' * 300, 'retrieved_at': 'x'} for n in range(6)]
    service, artifacts, _ = build(tmp_path, Partial(), FakeSearch(rows=rows))
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    urls = [row['url'] for row in artifacts.get(identifier, CONTEXT)['artifact']['sources']]
    assert urls[0] == rows[0]['url'] and rows[1]['url'] not in urls and len(urls) == 3


def test_a_worker_failure_is_recorded_and_the_lead_still_writes(tmp_path):
    adapter = FakeAdapter(fail={'worker_a': 'authentication'})
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_WORKER_A_FALLBACK': 'none'})
    identifier = start(service, artifacts)
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    assessed = [row for row in events(artifacts, identifier, 'stage') if row['stage'] == 'assessed']
    assert assessed[-1]['status'] == 'failed'


def test_resume_does_not_repeat_finished_stages(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, search = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    original = adapter.answer

    def failing(schema, payload):
        if schema is REPORT:
            raise ProviderError('authentication')
        return original(schema, payload)
    adapter.answer = failing
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'failed'
    assert service.store.get(identifier).done == {'plan': True, 'discover': True, 'analyze': True, 'verify': True, 'fill_gaps': True}
    before = len(adapter.calls)
    searched = len(search.queries)
    adapter.answer = original
    artifacts.request_state(identifier, CONTEXT, phase='queued', waiting_reason='')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    assert [call['schema'] is REPORT for call in adapter.calls[before:]] == [True] and len(search.queries) == searched


def test_cancel_stops_the_run_without_publishing(tmp_path):
    jobs = FakeJobs()
    jobs.state = 'canceled'
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, jobs=jobs)
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['reason'] == 'research_canceled' and not adapter.calls
    assert service.store.get(identifier).state == 'cancelled'
    assert artifacts.request_state(identifier, CONTEXT)['waiting_reason'] == 'research_canceled'


def test_a_stopped_run_can_be_retried_from_its_checkpoint(tmp_path):
    jobs = FakeJobs()
    adapter = FakeAdapter()
    service, artifacts, search = build(tmp_path, adapter, jobs=jobs)
    identifier = start(service, artifacts)
    original = adapter.answer

    def stop_at_writing(schema, payload):
        if schema is SOURCE_ASSESSMENT:
            jobs.state = 'canceled'
        return original(schema, payload)
    adapter.answer = stop_at_writing
    assert asyncio.run(service.run(identifier, CONTEXT))['reason'] == 'research_canceled'
    assert service.store.get(identifier).state == 'cancelled'
    searched = len(search.queries)
    jobs.state = 'running'
    adapter.answer = original
    artifacts.request_state(identifier, CONTEXT, phase='queued', waiting_reason='')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    assert service.store.get(identifier).state == 'completed'
    assert artifacts.get(identifier, CONTEXT)['artifact']['phase'] == 'complete'
    # Finished stages are not paid for twice, and a finished run does not run again.
    assert len(search.queries) >= searched
    before = len(adapter.calls)
    assert asyncio.run(service.run(identifier, CONTEXT))['state'] == 'completed'
    assert len(adapter.calls) == before


def test_time_limit_stops_a_run_honestly_and_retry_gets_a_fresh_allowance(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts, 'Deep question', 'deep-research', storage='detailed')
    run = service.store.get(identifier)
    run.usage = {'active_seconds': 99999}
    service.store.save(run)
    assert asyncio.run(service.run(identifier, CONTEXT))['reason'] == 'work_deadline'
    assert artifacts.request_state(identifier, CONTEXT)['waiting_reason'] == 'work_deadline' and not adapter.calls
    artifacts.request_state(identifier, CONTEXT, phase='queued', waiting_reason='')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'


def test_rate_limit_pauses_when_no_model_can_answer(tmp_path):
    adapter = FakeAdapter(fail={'lead': 'rate_limit', 'worker_b': 'rate_limit'})
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['status'] == 'waiting_for_quota' and result['next_attempt'] > time.time()
    assert artifacts.request_state(identifier, CONTEXT)['phase'] == 'waiting_for_quota'


def test_daily_limit_pauses_before_spending(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_DAILY_TOKENS': '10'})
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['reason'] == 'work_daily_limit' and not adapter.calls


def test_search_failure_with_no_sources_is_a_real_failure(tmp_path):
    adapter = FakeAdapter()
    search = FakeSearch(error={'provider': 'tavily', 'reason': 'provider_authentication_required'})
    service, artifacts, _ = build(tmp_path, adapter, search)
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['status'] == 'failed' and result['reason'] == 'search_provider_authentication_required'


def test_clarification_waits_and_the_answer_continues(tmp_path):
    adapter = FakeAdapter(plan={'clarification': 'Which year?'})
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['needs_input'] and artifacts.request_state(identifier, CONTEXT)['waiting_reason'] == 'work_needs_input'
    assert asyncio.run(service.answer(identifier, CONTEXT, '2026'))['status'] == 'accepted'
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'


def test_no_key_appears_in_a_run_record_event_or_public_view(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    saved = json.dumps(service.store.get(identifier).__dict__) + json.dumps(events(artifacts, identifier)) + json.dumps(service.status())
    assert SECRET not in saved and 'g-key' not in saved


def test_slots_reuse_shared_keys_and_prefer_slot_keys():
    slots = load_slots(settings(AEGIS_WORK_WORKER_B_API_KEY='own-key', AEGIS_WORK_WORKER_B_MODEL='custom/model'))
    assert slots['lead'].provider == 'gemini' and slots['lead'].model == 'gemini-test' and slots['lead'].fallback == 'worker_b'
    assert slots['worker_a'].key == SECRET and slots['worker_b'].key == 'own-key' and slots['worker_b'].model == 'custom/model'
    assert set(load_slots(lambda name: {'NOVA_RESEARCH_PROVIDER': 'none'}.get(name, ''))) == set()


def test_router_prefers_the_role_slot_and_avoids_an_open_circuit():
    router = ModelRouter(settings(), adapters={'gemini': FakeAdapter(), 'groq': FakeAdapter()})
    assert router.route('verification').slot == 'worker_c'
    for _ in range(3):
        router.guard.settle(router.slots()['worker_c'], False)
    assert router.route('verification').slot == 'worker_b'


def test_guard_window_waits_then_reports_the_limit():
    moments = [0.0]
    guard = ProviderGuard(clock=lambda: moments[0], sleep=lambda seconds: moments.__setitem__(0, moments[0] + seconds))
    slot = load_slots(settings())['worker_a']
    guard.reserve(slot, 7000)
    with pytest.raises(ProviderError) as refused:
        guard.reserve(slot, 7000, patience=5)
    assert refused.value.kind == 'rate_limit'
    guard.reserve(slot, 7000, patience=70)
    assert moments[0] >= 60


def test_assignments_scale_with_the_mode():
    plan = TaskPlan(intent='x', needs_web=True)
    assert choose_assignments('direct', plan, budget_for('direct')) == []
    assert [role for role, _ in choose_assignments('quick', plan, budget_for('quick'))] == ['discovery']
    assert choose_assignments('deep', plan, budget_for('deep')) == []
    assert [role for role, _ in choose_assignments('structured', TaskPlan(intent='x', needs_web=False), budget_for('structured'))] == ['analysis', 'verification']


def test_every_card_workflow_has_a_known_mode_and_budget():
    assert len(WORKFLOWS) == 20
    personas = {row.persona for row in WORKFLOWS.values()}
    assert personas == {'developer', 'designer', 'marketing', 'manager', 'student', 'office', 'founder', 'research'}
    assert {row.mode for row in WORKFLOWS.values()} <= {'direct', 'quick', 'deep', 'structured'}
    assert budget_for('deep', lambda name: '30' if name == 'AEGIS_WORK_DEEP_SOURCES' else '').sources == 30
    assert budget_for('deep', lambda name: '900' if name == 'AEGIS_WORK_DEEP_SOURCES' else '').sources == 40


def test_helpers():
    assert canonical_url('https://WWW.Example.com/a/?utm_source=x&b=1#top') == 'https://example.com/a?b=1'
    assert strip_unknown_citations('x [S1, S9] y [S9] z', {'S1'}) == 'x [S1] y  z'
    assert clean_map({'groups': [], 'nodes': [{'id': 'a'}, {'id': 'a'}], 'edges': [{'from': 'a', 'to': 'a'}]}, set())['edges'] == []
