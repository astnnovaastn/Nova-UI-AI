"""AEGIS Work: persisted relations, the four-model cap and comprehensive Deep reports. No network."""
import asyncio
import json
import re

import pytest

from astra_ai.core.work import relations as rel
from astra_ai.core.work.contracts import REPORT_FRAME, REPORT_SECTIONS
from astra_ai.core.work.providers import ProviderError

from test_work_runs import CONTEXT, ENV, SECRET, FakeAdapter, FakeSearch, build, events, start

FOUR = {
    'AEGIS_WORK_WORKER_A_MODEL': 'model-a',
    'AEGIS_WORK_WORKER_B_MODEL': 'model-b',
    'AEGIS_WORK_WORKER_C_MODEL': 'model-c',
}


def check_relations(run, artifacts, identifier):
    """Every stored relation is valid, unique, and points at a real recorded event."""
    seqs = {row['seq'] for row in events(artifacts, identifier)}
    ids = [row['id'] for row in run.relations]
    assert len(ids) == len(set(ids))
    for row in run.relations:
        rel.validate(row['type'], row['source'], row['target'], row['status'])
        assert row['event_seq'] in seqs, row
    return {(row['type'], row['source'], row['target']) for row in run.relations}


# Relations

def test_relation_contract_rejects_wrong_endpoints():
    rel.validate('found', 'query:1', 'source:S2')
    for args in [('found', 'source:S1', 'query:1'), ('cites', 'source:S1', 'agent:lead'), ('nope', 'request', 'report'),
                 ('plans', 'request', 'request'), ('found', 'query:x', 'source:S1')]:
        with pytest.raises(rel.RelationError):
            rel.validate(*args)
    with pytest.raises(rel.RelationError):
        rel.validate('found', 'query:1', 'source:S1', 'done')


def test_same_action_twice_is_one_relation_and_keeps_its_first_event():
    rows = []
    first = rel.make('found', 'query:1', 'source:S1', event_seq=4)
    rel.upsert(rows, first)
    rel.upsert(rows, rel.make('found', 'query:1', 'source:S1', event_seq=9, status='verified'))
    assert len(rows) == 1 and rows[0]['event_seq'] == 4 and rows[0]['status'] == 'verified'
    rel.upsert(rows, rel.make('reads', 'agent:discovery', 'source:S1'))
    assert len(rows) == 2


def test_quick_run_records_the_relations_it_actually_made(tmp_path):
    service, artifacts, _ = build(tmp_path, FakeAdapter())
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    found = check_relations(run, artifacts, identifier)
    assert ('plans', 'request', 'agent:lead') in found
    assert ('assigns', 'agent:lead', 'agent:discovery') in found
    assert {('searches', 'agent:discovery', 'query:1'), ('searches', 'agent:discovery', 'query:2')} <= found
    assert {('found', 'query:1', 'source:S1'), ('found', 'query:2', 'source:S2')} <= found
    assert ('delivers', 'agent:discovery', 'agent:lead') in found
    # Only S1 is cited, so only S1 is joined to the report.
    assert ('cites', 'source:S1', 'report') in found and ('cites', 'source:S2', 'report') not in found
    # Nothing exists for work that did not happen.
    assert not any(kind in {'evidence', 'verifies', 'supports'} for kind, _, _ in found)
    public = service.store.public(run)
    assert public['relations'] == run.relations
    assert len(events(artifacts, identifier, 'relation')) == len(run.relations)


def test_structured_run_relates_evidence_verification_and_the_map(tmp_path):
    service, artifacts, _ = build(tmp_path, FakeAdapter())
    identifier = start(service, artifacts, 'Map a system', 'knowledge-map', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    found = check_relations(run, artifacts, identifier)
    assert ('evidence', 'source:S1', 'agent:analysis') in found
    assert ('verifies', 'agent:analysis', 'agent:verification') in found
    assert ('supports', 'source:S1', 'map:a') in found
    relates = [row for row in run.relations if row['type'] == 'relates']
    assert [(row['source'], row['target'], row['label']) for row in relates] == [('map:a', 'map:b', 'reads')]
    verifies = next(row for row in run.relations if row['type'] == 'verifies')
    assert verifies['status'] == 'verified' and verifies['detail']['supported'] == 1
    cite = next(row for row in run.relations if row['type'] == 'cites')
    assert cite['status'] == 'verified' and cite['url'].startswith('https://')


def test_a_failed_search_is_a_failed_relation_not_a_finished_one(tmp_path):
    search = FakeSearch(error={'reason': 'provider_down', 'retryable': False})
    service, artifacts, _ = build(tmp_path, FakeAdapter(), search=search)
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    searches = [row for row in run.relations if row['type'] == 'searches']
    assert searches and all(row['status'] == 'failed' for row in searches)
    assert not [row for row in run.relations if row['type'] in {'found', 'cites'}]


# The model cap

def test_structured_run_with_four_slots_uses_at_most_four_models(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env=FOUR)
    identifier = start(service, artifacts, 'Map a system', 'knowledge-map', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    used = {call['model'] for call in adapter.calls}
    assert used == {'gemini-test', 'model-a', 'model-b', 'model-c'}
    assert len(run.usage['distinct_models']) == 4 and len(run.usage['models']) == 4


def test_a_lower_cap_routes_extra_roles_to_models_already_in_use(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env={**FOUR, 'AEGIS_WORK_MAX_MODELS': '2'})
    identifier = start(service, artifacts, 'Map a system', 'knowledge-map', storage='detailed')
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['status'] == 'completed'
    assert len({call['model'] for call in adapter.calls}) == 2
    assert len(service.store.get(identifier).usage['distinct_models']) == 2


def test_cap_values_above_four_are_still_four(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env={**FOUR, 'AEGIS_WORK_MAX_MODELS': '7'})
    identifier = start(service, artifacts, 'Map a system', 'knowledge-map', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    assert len(service.store.get(identifier).usage['distinct_models']) <= 4


def test_a_fallback_that_would_exceed_the_cap_fails_honestly(tmp_path):
    adapter = FakeAdapter(fail={'lead': 'http_500'})
    service, artifacts, _ = build(tmp_path, adapter, env={**FOUR, 'AEGIS_WORK_MAX_MODELS': '1'})
    identifier = start(service, artifacts)
    result = asyncio.run(service.run(identifier, CONTEXT))
    assert result['status'] == 'failed' and result['reason'] == 'work_model_model_cap'
    # The lead was tried; its fallback, a second model, never was.
    assert {call['slot'] for call in adapter.calls} == {'lead'}


def test_failed_attempts_count_toward_the_cap(tmp_path):
    adapter = FakeAdapter(fail={'lead': 'http_500'})
    service, artifacts, _ = build(tmp_path, adapter, env=FOUR)
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    used = service.store.get(identifier).usage['distinct_models']
    assert used[0] == 'gemini:gemini-test' and len(used) <= 4


# Deep Research depth

TWELVE = [
    {'title': 'Source ' + str(n) + ' on battery storage', 'url': 'https://site' + str(n) + '.example.org/article',
     'content': ('Grid battery storage costs and lifetimes, measured in study ' + str(n) + '. ') * 30,
     'retrieved_at': '2026-11-06T00:00:00+00:00', 'provider': 'tavily'}
    for n in range(1, 13)
]
BODY = ['Costs', 'Lifetimes', 'Grid integration', 'Safety', 'Policy']


class SectionAdapter(FakeAdapter):
    """Writes each requested section with a real citation from the evidence it was given."""

    def __init__(self, **kwargs):
        super().__init__(plan={'mode': 'deep', 'sections': ['Introduction', *BODY, 'Limitations', 'Conclusion'], 'queries': ['q1', 'q2', 'q3']}, **kwargs)

    def answer(self, schema, payload):
        if schema is REPORT_SECTIONS:
            given = [row['id'] for row in payload['evidence']]
            assert given, 'a section must receive evidence'
            return {'sections': [
                {'heading': heading, 'summary': heading + ' established.',
                 'markdown': '## ' + heading + '\n\n### Detail\n\n' + ' '.join('Paragraph about ' + heading.lower() + ' backed by evidence [' + name + '].' for name in given[:3]) * 20 + ' A made-up claim [S99].'}
                for heading in payload['write_sections']]}
        if schema is REPORT_FRAME:
            return {'title': 'Grid battery storage', 'executive_summary': 'Storage is getting cheaper [S1].', 'key_findings': ['Costs fell [S1].', 'Lifetimes vary [S2].'],
                    'contradictions': 'Sources disagree on lifetime [S2].', 'limitations': 'Mostly secondary sources.', 'conclusions': 'Worth deploying [S3].', 'summary': 'Done.'}
        return super().answer(schema, payload)


def deep_run(tmp_path, adapter, monkeypatch=None):
    service, artifacts, search = build(tmp_path, adapter, search=FakeSearch(rows=[dict(row) for row in TWELVE]))
    identifier = start(service, artifacts, 'Grid battery storage in depth', 'deep-research', storage='detailed')
    return service, artifacts, identifier


def test_deep_report_is_complete_sectioned_cited_and_lists_every_source(tmp_path):
    adapter = SectionAdapter()
    service, artifacts, identifier = deep_run(tmp_path, adapter)
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    run = service.store.get(identifier)
    saved = artifacts.get(identifier, CONTEXT)['artifact']
    report = saved['report']
    # The Reader gets exactly what was written: nothing is cut between the run and the store.
    assert report == run.results['report_text'] and saved['completeness'] == 'complete'
    headings = re.findall(r'^## (.+)$', report, re.M)
    assert headings[:4] == ['Contents', 'Executive summary', 'Key findings', 'Scope and methodology']
    assert headings[4:9] == BODY
    assert headings[9:] == ['Contradictions and open questions', 'Limitations', 'Conclusions', 'Bibliography']
    # Bookend headings from the plan are written once, by the frame, not as body sections.
    assert report.count('## Limitations') == 1 and 'Introduction' not in headings
    # All twelve retrieved sources stay listed, with whether each was cited.
    bibliography = report.split('## Bibliography', 1)[1]
    assert len(re.findall(r'^- \*\*S\d+\*\*', bibliography, re.M)) == 12 == len(saved['sources'])
    assert '*cited*' in bibliography
    assert 'S99' not in report
    # One model, several bounded calls: plan, three section batches, the frame.
    sections = [call for call in adapter.calls if call['schema'] is REPORT_SECTIONS]
    assert [call['payload']['write_sections'] for call in sections] == [BODY[0:2], BODY[2:4], BODY[4:5]]
    assert all(call['max_tokens'] <= 9000 for call in sections)
    assert len({call['model'] for call in adapter.calls}) == 1
    quality = [row for row in events(artifacts, identifier, 'stage') if row['stage'] == 'quality'][-1]
    assert quality['sections_written'] == quality['sections_planned'] == 5 and quality['unresolved_citations'] == 0
    assert len(report.split()) > 2000
    cited = {row['source'] for row in run.relations if row['type'] == 'cites'}
    assert {'source:S1', 'source:S2', 'source:S3'} <= cited
    assert all(row['source'] == 'agent:lead' for row in run.relations if row['type'] == 'searches')


def test_deep_writing_resumes_after_a_pause_without_rewriting_finished_sections(tmp_path):
    class PausingAdapter(SectionAdapter):
        def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
            if schema is REPORT_SECTIONS and sum(call['schema'] is REPORT_SECTIONS for call in self.calls) == 1 and not getattr(self, 'paused', False):
                self.paused = True
                self.calls.append({'slot': slot.slot, 'model': slot.model, 'schema': None, 'payload': payload, 'instruction': '', 'max_tokens': 0})
                raise ProviderError('rate_limit', 30)
            return super().complete(slot, instruction, payload, schema, max_tokens, timeout)

    adapter = PausingAdapter()
    service, artifacts, identifier = deep_run(tmp_path, adapter)
    env = {'AEGIS_WORK_LEAD_FALLBACK': 'none'}
    service.router.settings = service.settings = (lambda values: (lambda name: values.get(name, '')))({**ENV, **env})
    first = asyncio.run(service.run(identifier, CONTEXT))
    assert first['status'] == 'waiting_for_quota'
    assert len(service.store.get(identifier).results['draft']['sections']) == 2
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    written = [call['payload']['write_sections'] for call in adapter.calls if call['schema'] is REPORT_SECTIONS]
    assert written == [BODY[0:2], BODY[2:4], BODY[4:5]]


def test_a_section_too_long_for_one_answer_is_written_alone(tmp_path):
    class SplitAdapter(SectionAdapter):
        def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
            result = super().complete(slot, instruction, payload, schema, max_tokens, timeout)
            if schema is REPORT_SECTIONS and len(payload['write_sections']) > 1:
                raise ProviderError('output_limit')
            return result

    adapter = SplitAdapter()
    service, artifacts, identifier = deep_run(tmp_path, adapter)
    service.router.settings = lambda name: {'AEGIS_WORK_LEAD_FALLBACK': 'none'}.get(name) or ENV.get(name, '')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    report = artifacts.get(identifier, CONTEXT)['artifact']['report']
    assert re.findall(r'^## (.+)$', report, re.M)[4:9] == BODY


def test_a_page_that_could_not_be_opened_stays_listed_and_says_so(tmp_path, monkeypatch):
    rows = [dict(row) for row in TWELVE]
    rows[0]['content'] = 'Too short.'
    service, artifacts, _ = build(tmp_path, SectionAdapter(), search=FakeSearch(rows=rows))
    monkeypatch.setattr(artifacts, '_fetch_public_source', lambda url: (_ for _ in ()).throw(OSError('blocked')))
    identifier = start(service, artifacts, 'Grid battery storage in depth', 'deep-research', storage='detailed')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    run = service.store.get(identifier)
    report = artifacts.get(identifier, CONTEXT)['artifact']['report']
    assert 'full page could not be opened' in report
    reads = [row for row in run.relations if row['type'] == 'reads']
    assert [row['status'] for row in reads] == ['failed']
    assert '1 could not be opened' in report


def test_deep_run_with_thin_outline_keeps_the_single_answer_path(tmp_path):
    adapter = FakeAdapter(plan={'mode': 'deep', 'sections': ['Answer', 'Limitations']})
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts, 'Small question', mode='deep', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    assert not any(call['schema'] is REPORT_SECTIONS for call in adapter.calls)


def test_no_key_appears_in_relations_or_events(tmp_path):
    service, artifacts, _ = build(tmp_path, SectionAdapter(), search=FakeSearch(rows=[dict(row) for row in TWELVE]))
    identifier = start(service, artifacts, 'Grid battery storage in depth', 'deep-research', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    text = json.dumps(run.relations) + json.dumps(events(artifacts, identifier)) + json.dumps(service.store.public(run))
    assert SECRET not in text and 'g-key' not in text
