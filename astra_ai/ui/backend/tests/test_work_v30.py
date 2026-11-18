"""V30 zero-API tests: complete Work deliverables, relevance-ranked free retrieval, direct primary sources,
and one evidence shape. No model, search or network API is called (fixtures from the V29 router tests).
They prove the execution path, not what a real model writes; live runs are recorded separately."""
import json

from astra_ai.core.work import deliverables, source_ranking as sr
from astra_ai.core.work.contracts import EvidenceRecord
from astra_ai.core.work.v29_tasks import COMPOSE_SCHEMA

from test_work_v29_router import WorkAdapter, compose_answer, free_web, run, zobjects  # noqa: F401  (free_web is an autouse fixture)


def full_campaign():
    weeks = [{'when': f'Week {w}', 'title': f'Week {w} step {i}', 'detail': 'Owner: marketing lead', 'kind': 'milestone' if (w, i) == (4, 2) else 'task'}
             for w in range(1, 5) for i in (1, 2)]
    sheet = lambda cols, n: json.dumps({'columns': [{'label': c, 'kind': 'text'} for c in cols], 'rows': [{'cells': [f'{c} {r}' for c in cols]} for r in range(n)]})
    return {'reply': {'headline': 'AEGIS Desktop launch', 'text': 'Four weeks from teaser to launch.', 'points': ['Launch day is week 4']},
            'objects': [
                {'kind': 'document', 'title': 'Campaign brief', 'part': '', 'data_json': json.dumps({'paragraphs': [
                    '## Objective', 'Reach 5,000 sign-ups.', '## Audience segments', 'Designers; developers.', '## Positioning and key messages', 'One canvas.',
                    '## Channels', 'LinkedIn, X, email.', '## Risks and dependencies', 'Build readiness.']})},
                {'kind': 'plan', 'title': 'Four-week timeline', 'part': '', 'data_json': json.dumps({'steps': weeks})},
                {'kind': 'sheet', 'title': 'Content schedule', 'part': '', 'data_json': sheet(['Week', 'Channel', 'Format', 'Topic', 'Owner'], 8)},
                {'kind': 'sheet', 'title': 'Success metrics', 'part': '', 'data_json': sheet(['Metric', 'Target', 'How measured', 'Review week'], 4)},
                {'kind': 'draft', 'title': 'Draft posts', 'part': '', 'data_json': json.dumps({'destination': 'linkedin', 'body': 'AEGIS Desktop is here.'})},
                {'kind': 'draft', 'title': 'Draft posts', 'part': '', 'data_json': json.dumps({'destination': 'x', 'body': 'Meet AEGIS Desktop.'})},
                {'kind': 'list', 'title': 'Responsibilities', 'part': '', 'data_json': json.dumps({'style': 'todo', 'items': [{'title': f'Task {i}', 'due': 'Week 2'} for i in range(4)]})},
            ]}


class RepairingAdapter(WorkAdapter):
    """First compose is the thin V29 campaign; the repair call returns the complete deliverables."""
    def answer(self, schema, payload):
        if schema is COMPOSE_SCHEMA:
            self.compose_payloads.append(payload)
            return compose_answer('campaign-plan', payload) if len(self.compose_payloads) == 1 else full_campaign()
        return super().answer(schema, payload)


def run_with(adapter_cls, tmp_path, workflow, query, plan=None):
    import test_work_v29_router as base
    original = base.WorkAdapter
    base.WorkAdapter = lambda wf, **kw: adapter_cls(wf, plan=plan, **kw) if plan else adapter_cls(wf, **kw)
    try:
        return run(tmp_path, workflow, query)
    finally:
        base.WorkAdapter = original


# Complete deliverables

def test_thin_campaign_is_repaired_into_the_full_deliverable(tmp_path):
    result, record, adapter, *_ = run_with(RepairingAdapter, tmp_path, 'campaign-plan', 'Plan a four-week launch campaign for AEGIS Desktop')
    assert result['status'] == 'completed', record.failure
    assert len(adapter.compose_payloads) == 2, 'one repair call for the missing deliverables, no more'
    kinds = [o['zkind'] for o in zobjects(record)]
    # The first pass's draft met its deliverable, so only the short ones were replaced.
    assert kinds.count('sheet') == 2 and kinds.count('draft') == 1 and 'document' in kinds
    plan = next(o for o in zobjects(record) if o['zkind'] == 'plan')
    assert len(plan['data']['steps']) == 8, 'the repaired timeline replaced the two-step one'
    assert record.results['v29']['deliverables']['missing'] == []
    report = record.results['report_text']
    for heading in ('## Campaign brief', '### Objective', '## Four-week timeline', '## Content schedule', '## Success metrics', '## Responsibilities'):
        assert heading in report, heading
    assert '| Week 4 | **Week 4 step 2** |' in report and '> We are live.' in report
    assert 'Palette' not in report and 'Not complete' not in report
    assert record.usage.get('searches', 0) == 0


def test_a_deliverable_still_missing_after_repair_is_reported_not_invented(tmp_path):
    result, record, adapter, *_ = run(tmp_path, 'campaign-plan', 'Plan a four-week launch campaign for AEGIS Desktop')
    assert result['status'] == 'completed'
    assert len(adapter.compose_payloads) == 2
    missing = {g['name'] for g in record.results['v29']['deliverables']['missing']}
    assert {'Campaign brief', 'Content schedule', 'Success metrics'} <= missing
    assert '**Not complete:**' in record.results['report_text']
    # Every object that was made is in the report, not only the reply.
    assert '## Weeks' in record.results['report_text'] and '> We are live.' in record.results['report_text']


def test_render_writes_every_object_kind():
    objects = [
        {'zkind': 'plan', 'title': 'Plan', 'data': {'steps': [{'when': 'Mon', 'title': 'Start', 'kind': 'milestone'}]}},
        {'zkind': 'sheet', 'title': 'Prices', 'data': {'columns': [{'label': 'Plan'}, {'label': 'Price'}], 'rows': [{'cells': ['Pro', '$20'], 'source': 'S1'}]}},
        {'zkind': 'picks', 'title': 'Tools', 'data': {'items': [{'name': 'Acme', 'url': 'https://acme.example/', 'facts': [{'label': 'Seats', 'value': '5'}]}]}},
        {'zkind': 'diagram', 'title': 'Map', 'data': {'nodes': [{'id': 'a', 'name': 'A'}, {'id': 'b', 'name': 'B'}], 'edges': [{'from': 'a', 'to': 'b', 'label': 'uses'}]}},
        {'zkind': 'plot', 'title': 'Chart', 'data': {'x': {'label': 'Plan'}, 'series': [{'name': 'USD', 'points': [{'x': 'Pro', 'y': 20}]}], 'basis': 'pricing pages'}},
    ]
    text = deliverables.render({'headline': 'H', 'text': 'T'}, objects, [{'id': 'S1', 'url': 'https://acme.example/pricing', 'title': 'Acme pricing'}])
    assert '| Mon | **Start** |' in text and '| Pro [S1] | $20 |' in text and '[Acme](https://acme.example/)' in text
    assert '```mermaid' in text and 'a -->|uses| b' in text and '| Pro | 20 |' in text
    assert text.index('## Plan') < text.index('## Prices') and '## Sources' in text and '[S1] [Acme pricing]' in text


# Relevance-ranked, diverse retrieval

def test_ranking_caps_reference_sites_and_prefers_official_pages():
    hits = [{'title': f'AI coding assistant {i}', 'url': f'https://en.wikipedia.org/wiki/Page_{i}', 'snippet': 'AI coding assistant', 'source': 'wikipedia'} for i in range(6)]
    hits += [{'title': 'GitHub Copilot features', 'url': 'https://github.com/features/copilot?utm_source=x', 'snippet': 'AI coding assistant', 'source': 'searxng'},
             {'title': 'Cursor pricing', 'url': 'https://www.cursor.com/pricing/', 'snippet': 'AI code editor plans', 'source': 'searxng'},
             {'title': 'Cursor pricing', 'url': 'https://cursor.com/pricing', 'snippet': 'duplicate', 'source': 'brave'}]
    chosen = sr.rank(hits, 'compare the main AI coding assistants', 'market', limit=8)
    urls = [h['canonical_url'] for h in chosen]
    assert sum('wikipedia.org' in u for u in urls) == 1, 'one reference page for a market question'
    assert urls.count('https://cursor.com/pricing') == 1 and 'https://github.com/features/copilot' in urls
    assert chosen[0]['source_type'] in ('official', 'repository')


def test_ranking_keeps_a_site_to_two_pages_and_direct_pages_first():
    hits = [{'title': f'Docs {i}', 'url': f'https://docs.example.org/p{i}', 'snippet': 'react server components', 'source': 'searxng'} for i in range(5)]
    hits.append({'title': '', 'url': 'https://react.dev/reference/rsc/server-components', 'snippet': '', 'source': 'direct', 'direct': True})
    chosen = sr.rank(hits, 'react server components', 'technical', limit=8)
    assert chosen[0]['url'].startswith('https://react.dev/') and sum('docs.example.org' in h['url'] for h in chosen) == 2


def test_canonical_urls_and_source_types():
    assert sr.canonical('http://en.m.wikipedia.org/wiki/X#top') == 'https://en.wikipedia.org/wiki/X'
    assert sr.canonical('https://www.example.com/a/?utm_medium=e&id=3') == 'https://example.com/a?id=3'
    assert sr.source_type('https://arxiv.org/abs/1') == 'paper' and sr.source_type('https://docs.python.org/3/') == 'docs'
    assert sr.source_type('https://github.com/a/b') == 'repository' and sr.source_type('https://acme.com/pricing') == 'official'
    assert sr.topic('Compare the main AI coding assistants', 'market') == 'market' and sr.topic('arxiv papers on robotics') == 'academic'


def test_named_official_pages_are_read_before_search_with_provenance(tmp_path, free_web):
    urls = ['https://cursor.com/pricing', 'https://github.com/features/copilot']
    result, record, *_ = run_with(WorkAdapter, tmp_path, 'competitor-landscape', 'Compare the main AI coding assistants', plan={'urls': urls})
    assert result['status'] == 'completed', record.failure
    assert free_web['read'][:2] == urls, 'the lead-named primary sources are read first'
    assert record.plan['urls'] == urls
    evidence = {e['url']: e for e in record.evidence}
    for url in urls:
        row = evidence[url]
        assert row['provider'] == 'direct' and row['verification'] == 'read' and row['agent'] == 'worker_a'
        assert row['source_type'] in ('official', 'repository') and row['canonical_url']
    assert record.results['v29']['discovery']['coverage']['sites'] >= 2
    assert record.usage.get('searches', 0) == 0


def test_evidence_saved_before_v30_still_loads():
    old = {'id': 'S1', 'url': 'https://a.example/', 'title': 'A', 'domain': 'a.example', 'retrieved_at': '2026-11-01', 'provider': 'tavily', 'fetched': True}
    record = EvidenceRecord(**old)
    assert record.source_type == '' and record.media == []


class FailingRepairAdapter(WorkAdapter):
    """The first compose works (thin); the repair call meets a provider outage."""
    def answer(self, schema, payload):
        if schema is COMPOSE_SCHEMA:
            self.compose_payloads.append(payload)
            if len(self.compose_payloads) > 1:
                from astra_ai.core.work.providers import ProviderError
                raise ProviderError('rate_limited')
            return compose_answer('campaign-plan', payload)
        return super().answer(schema, payload)


def test_an_outage_during_the_repair_keeps_the_first_pass(tmp_path):
    result, record, adapter, *_ = run_with(FailingRepairAdapter, tmp_path, 'campaign-plan', 'Plan a four-week launch campaign for AEGIS Desktop')
    assert result['status'] == 'completed', record.failure
    kinds = [o['zkind'] for o in zobjects(record)]
    assert {'plan', 'draft', 'list'} <= set(kinds), 'the composed objects survive a failed repair'
    assert 'could not be composed' not in record.results['report_text']
    assert any(t.get('tool') == 'compose.repair' and t.get('status') == 'failed' for t in record.results['v29'].get('tools', []))


# Paid search: optional and capped

def test_paid_search_has_a_hard_cap_for_every_mode():
    from astra_ai.core.work.catalog import budget_for, paid_search_cap
    env = lambda values: (lambda name: values.get(name, ''))
    assert paid_search_cap(env({})) is None
    assert budget_for('deep', env({'AEGIS_PAID_SEARCH_MAX_PER_RUN': '2'})).searches == 2
    assert budget_for('quick', env({'AEGIS_PAID_SEARCH_MAX_PER_RUN': '0'})).searches == 0
    # $0.02 at $0.008 a call buys two calls; the smaller of the two caps wins.
    assert budget_for('deep', env({'AEGIS_PAID_SEARCH_MAX_USD_PER_RUN': '0.02', 'AEGIS_PAID_SEARCH_MAX_PER_RUN': '5'})).searches == 2
    assert budget_for('deep', env({'AEGIS_PAID_SEARCH_MAX_PER_RUN': 'lots'})).searches == budget_for('deep').searches


def test_free_first_research_skips_the_paid_call_when_free_evidence_is_enough(tmp_path, free_web, monkeypatch):
    import sys
    from test_work_runs import CONTEXT, FakeAdapter, FakeSearch, build, start
    import asyncio
    free = sys.modules['astra_ai.core.work.free_search']
    hits = [{'title': f'Robot arm kinematics part {i}', 'url': f'https://kinematics-site{i}.org/arm', 'snippet': 'robot arm kinematics ' * 10, 'source': 'searxng'} for i in range(6)]
    free.search = lambda query, kinds=('web',), limit=8, browser=None: [dict(h) for h in hits]
    paid = FakeSearch()
    service, artifacts, _ = build(tmp_path, FakeAdapter(), paid, env={'AEGIS_RESEARCH_FREE_FIRST': '1'})
    identifier = start(service, artifacts, 'robot arm kinematics', mode='quick')
    result = asyncio.run(service.run(identifier, CONTEXT))
    record = service.store.get(identifier)
    assert result['status'] == 'completed', record.failure
    assert paid.queries == [], 'no paid search call when free sources answered every query'
    assert record.usage.get('searches', 0) == 0 and record.usage.get('free_searches', 0) >= 1
    assert all(e['provider'].startswith('free:') for e in record.evidence)


def test_free_first_falls_back_to_paid_search_when_free_evidence_is_thin(tmp_path, free_web):
    from test_work_runs import CONTEXT, FakeAdapter, FakeSearch, build, start
    import asyncio
    paid = FakeSearch()
    service, artifacts, _ = build(tmp_path, FakeAdapter(), paid, env={'AEGIS_RESEARCH_FREE_FIRST': '1', 'AEGIS_PAID_SEARCH_MAX_PER_RUN': '1'})
    identifier = start(service, artifacts, 'robot arm kinematics', mode='quick')
    asyncio.run(service.run(identifier, CONTEXT))
    record = service.store.get(identifier)
    assert len(paid.queries) == 1, 'one paid call, the cap, because the free adapters found one page'
    assert record.usage.get('searches', 0) == 1


def test_a_comparison_lists_the_things_it_names_for_official_site_lookup():
    from types import SimpleNamespace
    from astra_ai.core.work.v29_tasks import WorkTasks
    task = WorkTasks.__new__(WorkTasks)
    task.request = SimpleNamespace(query='Map the market for AI agent observability tools: LangSmith, Langfuse, Arize Phoenix and Helicone.')
    assert task._named_things() == ['LangSmith', 'Langfuse', 'Arize Phoenix', 'Helicone']
    task.request = SimpleNamespace(query='Compare Notion vs Obsidian')
    assert task._named_things() == ['Notion', 'Obsidian']
    task.request = SimpleNamespace(query='Compare the main AI coding assistants')
    assert task._named_things() == [], 'nothing named, nothing looked up'
