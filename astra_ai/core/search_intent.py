from __future__ import annotations

import re
from typing import Dict, Tuple


SEARCH_VERBS = r"(?:research|investigate|search(?:\s+the\s+web)?(?:\s+for)?|web\s+search(?:\s+for)?|look\s+up|look\s+for|browse(?:\s+the\s+web)?(?:\s+for)?|find\s+(?:information|details|results|sources)\s+(?:on|about|for))"

_CONNECTED_WIDGET_CONTEXT_RE = re.compile(
    r"\s*\[CONNECTED_WIDGET_CONTEXT\].*?\[/CONNECTED_WIDGET_CONTEXT\]\s*",
    re.IGNORECASE | re.DOTALL,
)


def user_utterance_only(text: str) -> str:
    """Return user-authored text without model-only connected-widget context."""
    return _CONNECTED_WIDGET_CONTEXT_RE.sub(" ", str(text or "")).strip()


def is_explicit_search_request(text: str) -> bool:
    message = user_utterance_only(text)
    # A company name, quoted command, capability question or negation is not
    # permission to spend a search/writing request. Accept an actual imperative
    # (including polite requests), not an arbitrary occurrence of "research".
    message = re.sub(r'"[^"\n]*"|“[^”\n]*”|`[^`\n]*`', ' ', message)
    if re.search(r"\b(?:do not|don't|dont|never|stop|without|no need to)\s+(?:\w+\s+){0,2}(?:search|research|browse|investigate|look up)\b", message, re.I):
        return False
    prefix = r"(?:please\s+|(?:can|could|would|will)\s+you\s+(?:please\s+)?|(?:i\s+)?(?:want|need|would like)\s+(?:you\s+)?to\s+|(?:okay|ok|yes|now|then|also)[, ]+)*"
    match = re.search(rf"(?:^|[.!?;]\s*|\band\s+){prefix}{SEARCH_VERBS}\b", message, re.I)
    return bool(match and message[match.end():].strip(' .,!?:;'))


def extract_search_query(text: str) -> str:
    message = user_utterance_only(text)
    patterns = [
        rf"\b{SEARCH_VERBS}\s+(.+)$",
        r"\bwhat do you know about\s+(.+)$",
        r"\btell me about\s+(.+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return match.group(1).strip(" .,!?:;")
    return message


def parse_search_request(text: str) -> Tuple[str, Dict[str, str]]:
    query = extract_search_query(text)
    options: Dict[str, str] = {"target_site": "web"}
    lowered = str(text or "").lower()
    if "youtube" in lowered:
        options["target_site"] = "youtube"
    elif "news" in lowered:
        options["target_site"] = "news"
    elif "wikipedia" in lowered or "wiki" in lowered:
        options["target_site"] = "wikipedia"
    return query, options


def format_search_display_topic(query: str) -> str:
    cleaned = str(query or "").strip()
    return cleaned if cleaned else "Search"


def format_search_display_subtopic(search_type: str) -> str:
    kind = str(search_type or "web").strip().lower()
    mapping = {
        "web": "Web",
        "news": "News",
        "youtube": "YouTube",
        "wikipedia": "Wikipedia",
    }
    return mapping.get(kind, kind.title() or "Web")
