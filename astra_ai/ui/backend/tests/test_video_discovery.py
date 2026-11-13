"""Video discovery falls back from SerpAPI's YouTube search to youtube.com-only web search (2026-11-10)."""
import asyncio
from types import SimpleNamespace

import pytest

from astra_ai.core.research_learning import ResearchArtifacts, ResearchSearch

CTX = {'profile_id': 'owner', 'project_id': 'one', 'session_id': 'conversation'}


@pytest.fixture
def artifact(tmp_path):
    store = ResearchArtifacts(tmp_path / 'reports.json')
    report = store.save('Grid batteries', 'detailed', '# Grid batteries\n\nA finding [S1].\n', [{'title': 'Source', 'url': 'https://example.org/a', 'retrieved_at': '2026-11-10T10:00:00Z', 'content': 'A finding'}], [], CTX, 'op')
    return store, report


INDEX = [
    {'title': 'How grid batteries work - YouTube', 'url': 'https://www.youtube.com/watch?v=s8qnzJn0j5I', 'author': 'Engineering Explained', 'content': 'A walk through a battery plant.'},
    {'title': 'A channel', 'url': 'https://www.youtube.com/@somechannel'},
    {'title': 'A playlist', 'url': 'https://www.youtube.com/playlist?list=PL0123456789'},
    {'title': 'Same video again', 'url': 'https://youtu.be/s8qnzJn0j5I'},
    {'title': 'Storage explained', 'url': 'https://www.youtube.com/watch?v=UVAXkzCVd2s'},
]


def transport(serp_status=429, tavily=INDEX, tavily_status=200, exa=INDEX):
    calls = []

    class Transport:
        def get(self, url, **kwargs):
            calls.append(('serpapi', kwargs['params']['engine']))
            return SimpleNamespace(status_code=serp_status, json=lambda: {'video_results': []})

        def post(self, url, headers=None, json=None, timeout=None):
            name = 'tavily' if 'tavily' in url else 'exa'
            calls.append((name, json.get('include_domains') or json.get('includeDomains')))
            if name == 'tavily':
                return SimpleNamespace(status_code=tavily_status, json=lambda: {'results': tavily})
            return SimpleNamespace(status_code=200, json=lambda: {'results': exa})

    return Transport(), calls


def test_quota_on_serpapi_falls_back_to_youtube_only_index_search(artifact):
    store, r = artifact
    fake, calls = transport()
    result = asyncio.run(ResearchSearch(store, lambda key: 'fixture', fake).enrich_media(r['id'], CTX, r['revision']))
    assert [name for name, _ in calls] == ['serpapi', 'tavily']
    assert calls[1][1] == ['youtube.com']
    assert result['media_status'] == 'complete' and not result['media_failures']
    videos = result['media']
    # Only watch pages, each once; channels and playlists are not videos.
    assert [row['video_id'] for row in videos] == ['s8qnzJn0j5I', 'UVAXkzCVd2s']
    first = videos[0]
    assert first['url'] == 'https://www.youtube.com/watch?v=s8qnzJn0j5I' and first['title'] == 'How grid batteries work'
    assert first['thumbnail'] == 'https://i.ytimg.com/vi/s8qnzJn0j5I/hqdefault.jpg'
    assert first['channel'] == 'Engineering Explained' and first['provider'] == 'tavily' and first['discovery_only']
    assert store.get(r['id'], CTX)['artifact']['report'] == r['report']


def test_exa_is_tried_when_tavily_also_fails(artifact):
    store, r = artifact
    fake, calls = transport(tavily_status=432)
    result = asyncio.run(ResearchSearch(store, lambda key: 'fixture', fake).enrich_media(r['id'], CTX, r['revision']))
    assert [name for name, _ in calls] == ['serpapi', 'tavily', 'exa']
    assert {row['provider'] for row in result['media']} == {'exa'}


def test_nothing_found_anywhere_keeps_the_original_reason_and_invents_nothing(artifact):
    store, r = artifact
    fake, _ = transport(tavily=[], exa=[{'title': 'Channel only', 'url': 'https://www.youtube.com/@x'}])
    result = asyncio.run(ResearchSearch(store, lambda key: 'fixture', fake).enrich_media(r['id'], CTX, r['revision']))
    assert result['media'] == [] and result['media_status'] == 'partial'
    assert result['media_failures'][0]['reason'] == 'no_relevant_videos_returned'


def test_only_configured_providers_are_asked(artifact):
    store, r = artifact
    fake, calls = transport()
    keys = {'TAVILY_API_KEY': ''}
    asyncio.run(ResearchSearch(store, lambda key: keys.get(key, 'fixture'), fake).enrich_media(r['id'], CTX, r['revision']))
    assert [name for name, _ in calls] == ['serpapi', 'exa']
