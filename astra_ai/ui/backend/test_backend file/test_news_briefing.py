from server import _build_news_briefing, _select_news_media


def test_news_briefing_normalizes_provider_articles_into_a_renderable_response():
    primary, stories = _build_news_briefing("latest NVIDIA news", [
        {
            "id": "1", "title": "NVIDIA announces a provider-backed update",
            "link": "https://example.test/nvidia", "snippet": "The primary provider summary.",
            "source_name": "Reuters", "publishedAt": "2026-08-11T09:00:00Z",
            "thumbnail": "https://example.test/nvidia.jpg", "category": "Technology",
        },
        {
            "id": "2", "title": "Industry coverage adds context",
            "link": "https://example.test/context", "snippet": "A supporting provider summary.",
            "source_name": "AP", "publishedAt": "2026-08-11T08:30:00Z",
        },
    ])

    assert primary is not None
    assert primary["headline"].startswith("NVIDIA")
    assert primary["imageUrl"] == "https://example.test/nvidia.jpg"
    assert primary["body"]
    assert len(primary["sources"]) == 2
    assert len(stories) == 2


def test_news_briefing_returns_no_renderable_story_for_invalid_articles():
    primary, stories = _build_news_briefing("unknown topic", [{"title": "No URL"}, {"link": "https://example.test"}])

    assert primary is None
    assert stories == []


def test_news_briefing_never_uses_clipped_provider_snippets_as_answer_paragraphs():
    primary, _ = _build_news_briefing("OpenAI news", [{
        "id": "1", "title": "OpenAI announces a product update",
        "link": "https://example.test/openai", "snippet": "OpenAI announced a product update with...",
        "source_name": "Reuters",
    }])

    assert primary is not None
    assert "..." not in primary["body"]
    assert primary["body"].endswith(".")
    assert primary["briefingSections"][0]["body"].endswith(".")


def test_news_briefing_discards_snippets_that_contain_only_ellipsis():
    primary, _ = _build_news_briefing("OpenAI news", [{
        "id": "1", "title": "OpenAI update", "link": "https://example.test/openai", "snippet": "...", "source_name": "Reuters",
    }])

    assert primary is not None
    assert "\n\n...\n\n" not in primary["body"]


def test_news_media_selection_prefers_the_largest_relevant_publisher_asset():
    media = _select_news_media([
        {"url": "https://example.test/thumb.jpg", "width": 300, "height": 180, "source": "provider_thumbnail"},
        {"url": "https://example.test/og.jpg", "width": 1920, "height": 1080, "source": "article_metadata"},
    ])

    assert media["url"] == "https://example.test/og.jpg"
    assert media["width"] == 1920
    assert media["height"] == 1080
    assert media["aspectRatio"] == 1920 / 1080


def test_news_briefing_returns_distinct_source_coverage_and_grouped_media():
    primary, stories = _build_news_briefing("technology news", [
        {"id": "1", "title": "Primary story", "link": "https://one.test/story", "snippet": "A complete first sentence.", "source_name": "Reuters", "image": {"url": "https://one.test/one.jpg", "width": 1800, "height": 1000}},
        {"id": "2", "title": "Supporting report", "link": "https://two.test/story", "snippet": "A complete second sentence.", "source_name": "AP", "image": {"url": "https://two.test/two.jpg", "width": 1000, "height": 1600}},
    ])

    assert primary is not None
    assert len(primary["sourceCoverage"]) == 2
    assert primary["sourceCoverage"] != stories
    assert primary["mediaGroups"][0]["items"][0]["relatedSectionId"] == "primary-media"


def test_news_briefing_returns_an_editorial_media_plan_with_nonduplicated_slots():
    primary, _ = _build_news_briefing("technology news", [
        {"id": "1", "title": "Primary story", "link": "https://one.test/story", "snippet": "A complete first sentence.", "source_name": "Reuters", "image": {"url": "https://one.test/one.jpg", "width": 1800, "height": 1000}},
        {"id": "2", "title": "Supporting report", "link": "https://two.test/story", "snippet": "A complete second sentence.", "source_name": "AP", "image": {"url": "https://two.test/two.jpg", "width": 1200, "height": 900}},
        {"id": "3", "title": "Related report", "link": "https://three.test/story", "snippet": "A complete third sentence.", "source_name": "BBC", "image": {"url": "https://three.test/three.jpg", "width": 1000, "height": 1000}},
    ])

    assert primary is not None
    plan = primary["mediaPlan"]
    assert plan["heroMedia"]
    assert plan["supportingMedia"]
    planned_urls = [item["url"] for values in plan.values() for item in values if isinstance(values, list)]
    assert len(planned_urls) == len(set(planned_urls))
    assert {section["title"] for section in primary["briefingSections"]} >= {"Market Context", "Latest Developments", "Analysis", "Why It Matters", "What To Watch Next"}
