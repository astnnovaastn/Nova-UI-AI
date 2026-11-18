"""Connections: what AEGIS Work can reach, its real status, and what the person allowed.

Each connection is an adapter with a status read from the server's own configuration (a key is
present, a slot is configured, a proxy is set). Keys and tokens never leave the server: only
`configured` is reported. Turning a connection off is honoured by the code that uses it (search
providers in video discovery and web search). Connections this hosted build cannot offer (local
folders, Git, MCP servers, signed-in accounts) are listed as unavailable with the reason, never as a
working button. Every change is written to an append-only audit log.
"""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path

SEARCH = {
    'tavily': ('Tavily', ('TAVILY_API_KEY', 'DEEP_RESEARCH_API_KEY'), ['web search (Deep)', 'YouTube video search']),
    'serpapi': ('SerpAPI', ('SERPAPI_KEY', 'QUICK_SEARCH_API_KEY'), ['web search (Quick)', 'YouTube video search']),
    'exa': ('Exa', ('EXA_API_KEY',), ['YouTube video search']),
}
# Free, keyless sources the agents may search (V29 `web.search.free`, see free_search.py). Each is on
# by default and can be turned off; SearXNG only counts as configured when SEARXNG_URL is set.
FREE_SEARCH = {
    'wikipedia': ('Wikipedia', ['encyclopedia search']),
    'wikidata': ('Wikidata', ['entity search']),
    'arxiv': ('arXiv', ['paper search']),
    'openalex': ('OpenAlex', ['paper search']),
    'crossref': ('Crossref', ['paper metadata search']),
    'semantic_scholar': ('Semantic Scholar', ['paper search']),
    'github': ('GitHub repository search', ['public repository search (GITHUB_TOKEN optional)']),
    'hn_algolia': ('Hacker News (Algolia)', ['story search']),
    'are_na': ('Are.na', ['image and block search for moodboards']),
    'wikimedia_commons': ('Wikimedia Commons', ['free-licence image search']),
    'openverse': ('Openverse', ['openly licensed image search']),
    'searxng': ('SearXNG (self-hosted)', ['general web search']),
    'wikidata_official': ('Official websites (Wikidata)', ['official website of a named company, product or project']),
    'direct': ('Direct page reads', ['official pages named by you or the lead, read by the agent browser where robots.txt allows']),
    'brave': ('Brave Search API', ['general web search (needs BRAVE_SEARCH_API_KEY; official API, free tier)']),
    'google_cse': ('Google Programmable Search', ['general web search (needs GOOGLE_CSE_KEY and GOOGLE_CSE_ID; official API)']),
    'site_pages': ('Site search pages', ['public site search pages read by the agent browser, where robots.txt allows']),
}
UNAVAILABLE = {
    'folders': ('Unrestricted local folders', 'Only host-configured repositories are readable through Repository context; other folders are unavailable.'),
    'git': ('Git and GitHub', 'Needs a confined command runner, which this build does not have.'),
    'mcp': ('MCP servers', 'No MCP client is installed in this build; nothing is connected.'),
    'accounts': ('Other accounts (Slack and others)', 'No connector is installed for these accounts. Google Calendar and Gmail have a separate optional connection.'),
}


class Connections:
    def __init__(self, root, settings, router=None, proxy=None):
        self.path = Path(root) / 'work' / 'connections.json'
        self.audit = Path(root) / 'work' / 'connections-audit.jsonl'
        self.settings = settings
        self.router = router
        self.proxy = proxy
        self.lock = threading.Lock()

    def _state(self):
        try:
            return json.loads(self.path.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return {'disabled': []}

    def enabled(self, name):
        return name not in set(self._state().get('disabled', []))

    def list(self):
        disabled = set(self._state().get('disabled', []))
        rows = []
        for name, (title, keys, can) in SEARCH.items():
            configured = any(self.settings(key) for key in keys)
            rows.append({'id': name, 'title': title, 'kind': 'search', 'configured': configured, 'enabled': name not in disabled,
                         'status': ('connected' if name not in disabled else 'off') if configured else 'not_configured',
                         'capabilities': can, 'toggle': configured, 'scope': 'Public web only; read-only.'})
        for name, (title, can) in FREE_SEARCH.items():
            configured = {'searxng': lambda: bool(self.settings('SEARXNG_URL')), 'brave': lambda: bool(self.settings('BRAVE_SEARCH_API_KEY')),
                          'google_cse': lambda: bool(self.settings('GOOGLE_CSE_KEY') and self.settings('GOOGLE_CSE_ID'))}.get(name, lambda: True)()
            rows.append({'id': name, 'title': title, 'kind': 'search', 'configured': configured, 'enabled': name not in disabled,
                         'status': ('connected' if name not in disabled else 'off') if configured else 'not_configured',
                         'capabilities': can, 'toggle': configured, 'cost': 'free', 'keyless': name not in ('brave', 'google_cse'),
                         'scope': 'Public web only; read-only; free and keyless.'})
        if self.router is not None:
            names = {'lead': 'AEGIS lead', 'worker_a': 'Discovery', 'worker_b': 'Analysis', 'worker_c': 'Verification', 'worker_d': 'Second analysis', 'worker_e': 'Writer'}
            for row in self.router.status():
                configured = bool(row.get('configured'))
                rows.append({'id': 'model:' + row['slot'], 'title': f"{row['provider'].upper() if row['provider'] == 'nvidia' else row['provider'].capitalize()} · {row['model']}" if configured else f"{names.get(row['slot'], row['slot'])} slot (not set)",
                             'kind': 'model', 'configured': configured, 'enabled': configured,
                             'status': ('failing' if row.get('circuit') == 'open' else 'connected') if configured else 'not_configured',
                             'capabilities': [names.get(row['slot'], row['slot'])], 'toggle': False, 'scope': 'Set in the server configuration; keys stay on the server.'})
        if self.proxy is not None:
            proxy = self.proxy.public()
            last = proxy.get('last_test') or {}
            rows.append({'id': 'proxy', 'title': 'Proxy', 'kind': 'network', 'configured': proxy['mode'] != 'off', 'enabled': proxy['mode'] != 'off',
                         'status': 'off' if proxy['mode'] == 'off' else ('connected' if last.get('ok') else 'untested' if not last else 'failing'),
                         'capabilities': ['Source Reader requests'], 'toggle': False, 'scope': proxy['not_applied_to']})
        for name, (title, reason) in UNAVAILABLE.items():
            rows.append({'id': name, 'title': title, 'kind': 'unavailable', 'configured': False, 'enabled': False, 'status': 'unavailable',
                         'capabilities': [], 'toggle': False, 'scope': reason})
        return rows

    def set_enabled(self, name, enabled):
        if name not in SEARCH and name not in FREE_SEARCH:
            raise ValueError('not_toggleable')
        with self.lock:
            state = self._state()
            disabled = set(state.get('disabled', []))
            (disabled.discard if enabled else disabled.add)(name)
            state['disabled'] = sorted(disabled)
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(state), encoding='utf-8')
            with self.audit.open('a', encoding='utf-8') as out:
                out.write(json.dumps({'at': round(time.time(), 3), 'action': 'enable' if enabled else 'disable', 'connection': name}) + '\n')
        return next(row for row in self.list() if row['id'] == name)


# The server installs its Connections here, so code that reaches a provider can honour the person's choice.
ACTIVE: Connections | None = None


def allowed(name):
    """Whether a search provider may be used: True unless the person turned it off."""
    return ACTIVE is None or ACTIVE.enabled(name)
