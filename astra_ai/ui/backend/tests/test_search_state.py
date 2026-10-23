from pathlib import Path

from search_state import (
    apply_search_widget_command,
    delete_history_entry,
    default_search_widget_state,
    find_history_matches,
    restore_history_entry,
    sanitize_search_answer,
)


def test_repeated_legacy_markers_are_removed():
    assert sanitize_search_answer(
        "SEARCH_RESULT: SEARCH RESULT\n\nDirect Answer\nA clean answer"
    ) == "Direct Answer\nA clean answer"


def test_latest_started_search_wins(tmp_path: Path):
    state = default_search_widget_state()
    state = apply_search_widget_command(
        state,
        {"command": "set_loading", "request_id": "first", "query": "first", "loading": True},
        tmp_path,
    )
    state = apply_search_widget_command(
        state,
        {"command": "set_loading", "request_id": "second", "query": "second", "loading": True},
        tmp_path,
    )
    state = apply_search_widget_command(
        state,
        {"command": "show_results", "request_id": "first", "query": "first", "answer": "old", "loading": False},
        tmp_path,
    )
    assert state["current"]["request_id"] == "second"
    assert state["current"]["query"] == "second"
    assert state["current"]["loading"] is True

    state = apply_search_widget_command(
        state,
        {
            "command": "show_results",
            "request_id": "second",
            "query": "second",
            "answer": "SEARCH_RESULT: SEARCH RESULT\nDirect Answer\nnew",
            "loading": False,
        },
        tmp_path,
    )
    assert state["current"]["answer"] == "Direct Answer\nnew"
    assert state["current"]["loading"] is False


def test_deleting_history_keeps_history_view(tmp_path: Path):
    state = default_search_widget_state()
    state["history"] = [{"request_id": "saved-1", "query": "Astra"}]
    state["current"]["view_mode"] = "current"
    updated = delete_history_entry(state, tmp_path, "saved-1")
    assert updated["history"] == []
    assert updated["current"]["view_mode"] == "history"


def test_history_matches_topic_and_restores_exact_saved_record(tmp_path: Path):
    state = default_search_widget_state()
    state["history"] = [
        {"request_id": "older", "query": "Gemini audio", "answer": "older answer"},
        {"request_id": "newer", "query": "Gemini audio", "answer": "newer answer"},
    ]
    matches = find_history_matches(state, tmp_path, "gemini audio")
    assert [item["request_id"] for item in matches] == ["older", "newer"]
    restored = restore_history_entry(state, tmp_path, "newer")
    assert restored["current"]["request_id"] == "newer"
    assert restored["current"]["answer"] == "newer answer"
