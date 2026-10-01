from pathlib import Path

from news_state import (
    apply_news_widget_command,
    archive_history_entry,
    delete_history_entry,
    default_news_widget_state,
    restore_history_entry,
)


def test_news_history_restores_the_complete_structured_briefing(tmp_path: Path):
    state = apply_news_widget_command(default_news_widget_state(), {
        "command": "set_loading", "request_id": "news-1", "query": "latest AI news", "loading": True,
    }, tmp_path)
    state = apply_news_widget_command(state, {
        "command": "show_news", "request_id": "news-1", "query": "latest AI news", "loading": False,
        "primary_story": {"id": "lead", "headline": "A real headline", "publishedAt": "2026-08-10T10:00:00Z", "sources": [{"name": "Reuters", "url": "https://example.test"}]},
        "related_stories": [{"id": "lead", "headline": "A real headline"}],
        "full_search_results": [{"id": "lead", "headline": "A real headline", "sources": [{"name": "Reuters", "url": "https://example.test"}]}],
    }, tmp_path)

    restored = restore_history_entry(state, tmp_path, "news-1")

    assert restored["current"]["primary_story"]["headline"] == "A real headline"
    assert restored["current"]["primary_story"]["sources"][0]["name"] == "Reuters"
    assert restored["current"]["related_stories"][0]["id"] == "lead"
    assert restored["current"]["full_search_results"][0]["id"] == "lead"


def test_news_state_drops_a_stale_result(tmp_path: Path):
    state = apply_news_widget_command(default_news_widget_state(), {"command": "set_loading", "request_id": "new", "loading": True}, tmp_path)
    stale = apply_news_widget_command(state, {"command": "show_news", "request_id": "old", "primary_story": {"headline": "Old"}}, tmp_path)
    assert stale == state


def test_news_history_can_archive_then_permanently_delete_a_record(tmp_path: Path):
    state = apply_news_widget_command(default_news_widget_state(), {"command": "set_loading", "request_id": "news-archive", "loading": True}, tmp_path)
    state = apply_news_widget_command(state, {"command": "show_news", "request_id": "news-archive", "loading": False, "primary_story": {"id": "lead", "headline": "Saved briefing"}}, tmp_path)
    archived = archive_history_entry(state, tmp_path, "news-archive")
    assert archived["history"] == []
    assert archived["archived_history"][0]["research_id"] == "news-archive"
    deleted = delete_history_entry(archived, tmp_path, "news-archive")
    assert deleted["archived_history"] == []


def test_news_state_preserves_a_terminal_no_results_outcome(tmp_path: Path):
    state = apply_news_widget_command(default_news_widget_state(), {
        "command": "set_loading", "request_id": "news-empty", "query": "unlikely coverage", "loading": True,
    }, tmp_path)
    completed = apply_news_widget_command(state, {
        "command": "show_news", "request_id": "news-empty", "query": "unlikely coverage",
        "loading": False, "primary_story": None, "related_stories": [],
        "full_search_results": [], "no_results": True,
    }, tmp_path)

    assert completed["current"]["loading"] is False
    assert completed["current"]["no_results"] is True
    assert completed["current"]["primary_story"] is None
    assert completed["history"] == []


def test_news_continuation_updates_its_existing_research_record(tmp_path: Path):
    state = apply_news_widget_command(default_news_widget_state(), {
        "command": "set_loading", "request_id": "first-request", "research_id": "research-1", "query": "markets", "loading": True,
    }, tmp_path)
    state = apply_news_widget_command(state, {
        "command": "show_news", "request_id": "first-request", "research_id": "research-1", "query": "markets", "loading": False,
        "primary_story": {"id": "lead", "headline": "Original briefing"},
    }, tmp_path)
    state = apply_news_widget_command(state, {
        "command": "set_loading", "request_id": "continuation-request", "research_id": "research-1", "query": "markets", "loading": True, "continuation": True,
    }, tmp_path)
    state = apply_news_widget_command(state, {
        "command": "show_news", "request_id": "continuation-request", "research_id": "research-1", "query": "markets", "loading": False, "continuation": True,
        "primary_story": {"id": "lead", "headline": "Expanded briefing"},
    }, tmp_path)

    assert len(state["history"]) == 1
    assert state["history"][0]["research_id"] == "research-1"
    assert state["history"][0]["primary_story"]["headline"] == "Expanded briefing"
