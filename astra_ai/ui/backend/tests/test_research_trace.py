"""The live research trace and the workspace browser's frame check."""
import json

import pytest

from astra_ai.core.research import frame_policy
from astra_ai.core.research.frame_policy import embedding_verdict, public_address
from astra_ai.core.research.trace import ResearchTrace
from astra_ai.core.research_learning import ResearchArtifacts

CONTEXT = {'profile_id': 'p', 'project_id': 'q', 'guest': False, 'client_id': 'c'}


def test_events_are_ordered_resumable_and_survive_a_restart(tmp_path):
    trace = ResearchTrace(tmp_path)
    trace.record('abc', 'search', 'collecting_sources', 'running', query='tides')
    trace.record('abc', 'search', 'collecting_sources', 'done', query='tides', count=3)
    assert [event['seq'] for event in trace.read('abc')] == [1, 2]
    assert [event['seq'] for event in trace.read('abc', after=1)] == [2]
    again = ResearchTrace(tmp_path)
    assert again.record('abc', 'phase', 'failed', 'failed')['seq'] == 3
    assert ResearchTrace(tmp_path).read('other') == []


def test_a_half_written_line_is_skipped_not_fatal(tmp_path):
    trace = ResearchTrace(tmp_path)
    trace.record('abc', 'phase', 'queued')
    with open(trace.root / 'abc.jsonl', 'a', encoding='utf-8') as handle:
        handle.write('{"seq": 2, "kin')
    assert [event['seq'] for event in trace.read('abc')] == [1]


def test_unsafe_identifiers_never_reach_the_file_system(tmp_path):
    trace = ResearchTrace(tmp_path)
    assert trace.record('../../escape', 'phase') is None
    assert trace.read('../../escape') == []
    assert not list(tmp_path.rglob('*.jsonl'))


def test_credentials_are_redacted_and_text_is_bounded(tmp_path):
    trace = ResearchTrace(tmp_path)
    secret = 'sk-' + 'a' * 40
    event = trace.record('abc', 'search', query='use key ' + secret + ' now', note='x' * 5000)
    saved = json.dumps(trace.read('abc'))
    assert secret not in saved
    assert len(event['note']) <= 600


def test_a_tracing_failure_never_reaches_research(tmp_path):
    trace = ResearchTrace(tmp_path)
    def broken(*_):
        raise RuntimeError('socket gone')
    trace.listener = broken
    assert trace.record('abc', 'phase', context=CONTEXT) is None  # Logged and swallowed.


def test_saved_state_changes_become_events_once(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research')
    pending = artifacts.reserve('How do tides form?', 'detailed', CONTEXT, 'op1')
    identifier = pending['id']
    artifacts.request_state(identifier, CONTEXT, phase='collecting_sources')
    artifacts.request_state(identifier, CONTEXT, phase='collecting_sources')
    plan = {'plan': {'title': 'T', 'sections': [{'heading': 'One'}, {'heading': 'Two'}, {'heading': 'Three'}]}, 'parts': []}
    artifacts.request_state(identifier, CONTEXT, synthesis_checkpoint=plan)
    artifacts.request_state(identifier, CONTEXT, synthesis_checkpoint={**plan, 'parts': ['written']})
    artifacts.request_state(identifier, CONTEXT, writing_provider='groq', writing_model='m')
    artifacts.request_state(identifier, CONTEXT, phase='waiting_for_quota', waiting_reason='gemini_service_unavailable')
    events = artifacts.trace.read(identifier)
    assert [event['kind'] for event in events] == ['phase', 'plan', 'section', 'writer', 'phase', 'waiting']
    assert events[1]['sections'] == ['One', 'Two', 'Three']
    assert (events[2]['index'], events[2]['total'], events[2]['heading']) == (1, 3, 'One')
    assert events[3]['provider'] == 'groq'
    assert events[5]['reason'] == 'gemini_service_unavailable'


def test_a_saved_section_adds_no_hidden_writing_to_the_trace(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research')
    identifier = artifacts.reserve('Topic here', 'detailed', CONTEXT, 'op1')['id']
    plan = {'plan': {'sections': [{'heading': 'One', 'focus': 'PRIVATE PLANNING NOTE'}]}, 'parts': ['DRAFT BODY TEXT']}
    artifacts.request_state(identifier, CONTEXT, synthesis_checkpoint=plan)
    saved = json.dumps(artifacts.trace.read(identifier))
    assert 'PRIVATE PLANNING NOTE' not in saved and 'DRAFT BODY TEXT' not in saved


def test_work_sources_are_references_saved_once(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research')
    identifier = artifacts.reserve('Topic here', 'detailed', CONTEXT, 'op1')['id']
    first = artifacts.add_work_source(identifier, CONTEXT, 'https://example.com/a', 'A page')
    second = artifacts.add_work_source(identifier, CONTEXT, 'https://example.com/a', 'Again')
    assert first['source']['id'] == second['source']['id']
    assert len(artifacts.work_sources(identifier, CONTEXT)) == 1
    assert set(first['source']) == {'id', 'url', 'title', 'retrieved_at', 'reference_kind'}
    assert [event['kind'] for event in artifacts.trace.read(identifier)][-1] == 'source_added'
    assert artifacts.add_work_source('missing', CONTEXT, 'https://example.com', '')['status'] == 'not_found'


def test_an_added_page_joins_the_report_links_without_changing_the_report(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research')
    identifier = artifacts.reserve('Topic here', 'detailed', CONTEXT, 'op1')['id']
    source = {'title': 'A source', 'url': 'https://example.org/a', 'content': 'Evidence words.', 'retrieved_at': '2026-11-05T00:00:00+00:00'}
    item = artifacts.save('Topic here', 'detailed', '# Topic\n\nA claim [S1].', [source], [], CONTEXT, 'op1')
    before = artifacts.get(identifier, CONTEXT)['artifact']
    artifacts.add_work_source(identifier, CONTEXT, 'https://example.com/added', 'Added page')
    document = artifacts.document(item['id'], CONTEXT)
    assert [row['url'] for row in document['linked_sources']] == ['https://example.com/added']
    assert [row['url'] for row in document['sources']] == ['https://example.org/a']
    after = artifacts.get(identifier, CONTEXT)['artifact']
    assert (after['report'], after['revision']) == (before['report'], before['revision'])


@pytest.mark.parametrize('headers,allowed,reason', [
    ([], True, ''),
    ([('X-Frame-Options', 'DENY')], False, 'x_frame_options'),
    ([('x-frame-options', 'SAMEORIGIN')], False, 'x_frame_options'),
    ([('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'")], False, 'frame_ancestors'),
    ([('Content-Security-Policy', "frame-ancestors 'self' https://partner.example")], False, 'frame_ancestors'),
    ([('Content-Security-Policy', 'frame-ancestors *')], True, ''),
    ([('Content-Security-Policy', 'frame-ancestors *'), ('X-Frame-Options', 'DENY')], True, ''),
    ([('Content-Security-Policy', "default-src 'self'")], True, ''),
])
def test_frame_policies_are_read_as_browsers_read_them(headers, allowed, reason):
    assert embedding_verdict(headers) == (allowed, reason)


@pytest.mark.parametrize('url', [
    'http://127.0.0.1:8340/api/research', 'http://localhost/', 'http://10.0.0.1/', 'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/', 'file:///etc/passwd', 'javascript:alert(1)',
    'http://user:pass@example.com/', 'https://example.com:8340/',
])
def test_private_and_unusual_addresses_are_refused(url):
    with pytest.raises((ValueError, OSError)):
        public_address(url)
    assert frame_policy._check(url)['embeddable'] in {False, None}


def test_a_redirect_to_a_private_address_is_refused(monkeypatch):
    calls = []
    def fake_headers(url, ip):
        calls.append(url)
        return 302, [('Location', 'http://127.0.0.1/secret')]
    monkeypatch.setattr(frame_policy, '_headers_of', fake_headers)
    monkeypatch.setattr(frame_policy, 'public_address', lambda url: (_ for _ in ()).throw(ValueError('non_public_address')) if '127.0.0.1' in url else '93.184.216.34')
    assert frame_policy._check('https://example.com/') == {'embeddable': False, 'reason': 'non_public_address'}
    assert calls == ['https://example.com/']
