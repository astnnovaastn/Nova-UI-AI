import threading
import time

from astra_ai.core.research.artifacts import ResearchArtifacts
from astra_ai.core.research.source_previews import SourcePreviews, source_catalog, source_token
from astra_ai.core.research_history import update


OWNER = {'profile_id': 'profile', 'project_id': 'project', 'session_id': 'session'}
OTHER = {**OWNER, 'project_id': 'other'}


def save(artifacts, title, url):
    return artifacts.save(title, 'quick', '# Test\n\nClaim [S1].', [
        {'title': title, 'url': url, 'retrieved_at': '2026-11-15', 'content': 'Public finding'},
    ], [], OWNER, title)


def test_source_catalog_uses_the_run_scope_and_authorizes_live_sources(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research.json')
    url = 'https://example.org/saved'
    report = save(artifacts, 'Saved', url)
    assert source_catalog(artifacts, report['id'], OWNER) == {source_token(url): url}
    assert source_catalog(artifacts, report['id'], OTHER) is None
    assert source_catalog(artifacts, report['id'], {**OWNER, 'guest': True}) is None

    pending = artifacts.reserve('A live run', 'quick', OWNER, 'live-run')['id']
    artifact_url = 'https://example.org/discovery'
    artifacts.trace.record(pending, 'source', context=OWNER, url=artifact_url)
    assert source_catalog(artifacts, pending, OWNER) == {source_token(artifact_url): artifact_url}
    assert source_catalog(artifacts, pending, OTHER) is None


def test_visible_capture_is_deduplicated_and_archived_history_fills_in_background(tmp_path):
    artifacts = ResearchArtifacts(tmp_path / 'research.json')
    current = 'https://example.org/current'
    archived = 'https://example.org/archived'
    older = save(artifacts, 'Earlier', archived)
    update(artifacts, older['id'], OWNER, archived=True)
    report = save(artifacts, 'Today', current)
    catalog = source_catalog(artifacts, report['id'], OWNER)
    gate = threading.Event()
    started = threading.Event()
    calls = []

    def capture(url):
        calls.append(url)
        started.set()
        assert gate.wait(5)
        return b'fixture thumbnail'

    service = SourcePreviews(tmp_path / 'webpage-thumbnails', capture)
    try:
        assert service.request(artifacts, OWNER, catalog)[source_token(current)]['status'] == 'pending'
        assert started.wait(5)
        for _ in range(4):
            service.request(artifacts, OWNER, catalog)
        gate.set()
        deadline = time.monotonic() + 5
        while not service.read(OWNER, archived) and time.monotonic() < deadline:
            time.sleep(.02)
        assert calls == [current, archived]
        assert service.request(artifacts, OWNER, catalog)[source_token(current)]['status'] == 'ready'
        assert service.read(OWNER, archived) == b'fixture thumbnail'
        assert service.read(OTHER, archived) is None
        assert artifacts.get(older['id'], OWNER)['artifact']['revision'] == older['revision']
    finally:
        gate.set()
        service.close()

    restarted = SourcePreviews(tmp_path / 'webpage-thumbnails', capture)
    try:
        assert restarted.request(artifacts, OWNER, catalog)[source_token(current)]['status'] == 'ready'
        assert restarted.read(OWNER, archived)
        assert calls == [current, archived]
    finally:
        restarted.close()
