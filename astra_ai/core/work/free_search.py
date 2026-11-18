"""Free search adapters (V29 `web.search.free`): official open APIs, keyless, cost 'free'.

Each adapter has a 10 s timeout, an honest User-Agent, its own minimum interval between calls, and
never raises: a failure gives an empty list and an entry in `last_errors()` (and in the browser's
log when one is passed). The person can turn any adapter off in Connections; `connections.allowed`
is honoured. Results are untrusted data. Search-engine result pages (Google, Bing, DuckDuckGo, Brave,
Mojeek) are never scraped: their robots.txt disallows /search for agents (checked 2026-11-18). General web
search comes from the official Brave Search and Google Programmable Search APIs when their keys are set,
or from the person's own SearXNG. CAPTCHAs or logins are never bypassed. Keys are never logged.
"""
from __future__ import annotations

import html
import json
import os
import re
import threading
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, quote_plus, urlsplit

from astra_ai.core.work.connections import allowed

USER_AGENT = 'AegisAgentBrowser/1.0 (+local; free search adapters)'
TIMEOUT = 10
MAX_WAIT = 8.0

# Minimum seconds between two calls to the same adapter (their published guidance where there is one).
INTERVALS = {'wikipedia': 0.2, 'wikidata': 0.2, 'arxiv': 3.0, 'openalex': 0.2, 'crossref': 0.5, 'semantic_scholar': 1.1,
             'github': 6.0, 'hn_algolia': 0.3, 'are_na': 1.0, 'searxng': 1.0, 'wikimedia_commons': 0.2, 'openverse': 1.0,
             'wikidata_official': 0.3, 'brave': 1.1, 'google_cse': 0.5}

_LOCK = threading.Lock()
_NEXT: dict[str, float] = {}
_ERRORS: dict[str, dict] = {}


class Hits(list):
    """A list of hits that also says why it may be empty (`status`, `reason`)."""
    def __init__(self, items=(), status='ok', reason=''):
        super().__init__(items)
        self.status = status
        self.reason = reason


def last_errors():
    """{adapter: {'reason', 'at'}} for the most recent failure of each adapter."""
    with _LOCK:
        return {name: dict(row) for name, row in _ERRORS.items()}


def _reset_state():
    with _LOCK:
        _NEXT.clear()
        _ERRORS.clear()


def _http(url, params=None, headers=None):
    """GET -> (status, text). Replaced in tests."""
    import requests
    response = requests.get(url, params=params, headers=headers, timeout=TIMEOUT)
    return response.status_code, response.text


def _strip(value, limit=400):
    value = re.sub(r'<[^>]+>', ' ', str(value or ''))
    return re.sub(r'\s+', ' ', html.unescape(value)).strip()[:limit]


def _hit(title, url, snippet, source, image=None, **extra):
    row = {'title': _strip(title, 300), 'url': url, 'snippet': _strip(snippet), 'source': source}
    if image:
        row['image'] = image
    row.update({key: value for key, value in extra.items() if value})
    return row


def _https(url):
    return isinstance(url, str) and urlsplit(url).scheme in {'http', 'https'}


# -- adapters: each (query, limit, **options) -> list of hits; may raise, `_run` catches -------------

def _get_json(url, params, headers=None):
    status, text = _http(url, params, {'User-Agent': USER_AGENT, 'Accept': 'application/json', **(headers or {})})
    if status >= 400:
        raise RuntimeError('http_' + str(status))
    return json.loads(text)


def wikipedia(query, limit, lang='en', **_):
    lang = lang if re.fullmatch(r'[a-z]{2,3}(-[a-z]+)?', str(lang)) else 'en'
    data = _get_json(f'https://{lang}.wikipedia.org/w/api.php', {'action': 'query', 'list': 'search', 'srsearch': query, 'srlimit': limit,
                                                               'srprop': 'snippet', 'format': 'json', 'utf8': 1})
    return [_hit(row['title'], f'https://{lang}.wikipedia.org/wiki/' + quote(row['title'].replace(' ', '_')), row.get('snippet', ''), 'wikipedia')
            for row in data.get('query', {}).get('search', [])]


def wikidata(query, limit, lang='en', **_):
    data = _get_json('https://www.wikidata.org/w/api.php', {'action': 'wbsearchentities', 'search': query, 'language': lang, 'limit': limit,
                                                           'type': 'item', 'format': 'json'})
    return [_hit(row.get('label') or row['id'], row.get('concepturi') or f'https://www.wikidata.org/wiki/{row["id"]}', row.get('description', ''), 'wikidata')
            for row in data.get('search', [])]


def arxiv(query, limit, **_):
    status, text = _http('https://export.arxiv.org/api/query', {'search_query': 'all:' + query, 'start': 0, 'max_results': limit},
                         {'User-Agent': USER_AGENT, 'Accept': 'application/atom+xml'})
    if status >= 400:
        raise RuntimeError('http_' + str(status))
    ns = {'a': 'http://www.w3.org/2005/Atom'}
    hits = []
    for entry in ET.fromstring(text.encode('utf-8') if isinstance(text, str) else text).findall('a:entry', ns):
        link = next((node.get('href') for node in entry.findall('a:link', ns) if node.get('rel') == 'alternate'), None) or entry.findtext('a:id', '', ns)
        published = (entry.findtext('a:published', '', ns) or '')[:10]
        hits.append(_hit(entry.findtext('a:title', '', ns), link.replace('http://', 'https://', 1), entry.findtext('a:summary', '', ns), 'arxiv', published=published))
    return hits


def openalex(query, limit, **_):
    data = _get_json('https://api.openalex.org/works', {'search': query, 'per-page': limit})
    hits = []
    for row in data.get('results', []):
        index = row.get('abstract_inverted_index') or {}
        words = sorted(((pos, word) for word, positions in index.items() for pos in positions))
        abstract = ' '.join(word for _, word in words)
        url = row.get('doi') or ((row.get('primary_location') or {}).get('landing_page_url')) or row.get('id')
        hits.append(_hit(row.get('display_name') or row.get('title'), url, abstract or str(row.get('publication_year') or ''), 'openalex',
                         published=str(row.get('publication_year') or '')))
    return hits


def crossref(query, limit, **_):
    data = _get_json('https://api.crossref.org/works', {'query': query, 'rows': limit, 'select': 'title,URL,DOI,container-title,published,abstract'})
    hits = []
    for row in data.get('message', {}).get('items', []):
        parts = ((row.get('published') or {}).get('date-parts') or [[None]])[0]
        venue = (row.get('container-title') or [''])[0]
        hits.append(_hit((row.get('title') or [''])[0], row.get('URL') or f'https://doi.org/{row.get("DOI")}', row.get('abstract') or venue, 'crossref',
                         published=str(parts[0] or '')))
    return hits


def semantic_scholar(query, limit, **_):
    data = _get_json('https://api.semanticscholar.org/graph/v1/paper/search', {'query': query, 'limit': limit, 'fields': 'title,url,abstract,year,venue'})
    return [_hit(row.get('title'), row.get('url') or f'https://www.semanticscholar.org/paper/{row.get("paperId")}', row.get('abstract') or row.get('venue') or '',
                 'semantic_scholar', published=str(row.get('year') or '')) for row in data.get('data') or []]


def github(query, limit, **_):
    headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    token = os.environ.get('GITHUB_TOKEN', '').strip()
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = _get_json('https://api.github.com/search/repositories', {'q': query, 'per_page': limit}, headers)
    return [_hit(row.get('full_name'), row.get('html_url'), row.get('description') or '', 'github', image=(row.get('owner') or {}).get('avatar_url'),
                 stars=row.get('stargazers_count')) for row in data.get('items', [])]


def hn_algolia(query, limit, **_):
    data = _get_json('https://hn.algolia.com/api/v1/search', {'query': query, 'hitsPerPage': limit, 'tags': 'story'})
    hits = []
    for row in data.get('hits', []):
        discussion = f'https://news.ycombinator.com/item?id={row.get("objectID")}'
        hits.append(_hit(row.get('title') or row.get('story_title'), row.get('url') or discussion,
                         f'{row.get("points") or 0} points, {row.get("num_comments") or 0} comments', 'hn_algolia', discussion=discussion))
    return hits


def are_na(query, limit, **_):
    # Are.na may answer keyless clients with 403 (edge protection) or 401; ARENA_TOKEN, when set, is sent and never logged.
    token = os.environ.get('ARENA_TOKEN', '').strip()
    data = _get_json('https://api.are.na/v2/search/blocks', {'q': query, 'per': limit}, {'Authorization': 'Bearer ' + token} if token else None)
    hits = []
    for row in data.get('blocks', []):
        image = row.get('image') or {}
        src = (image.get('display') or {}).get('url') or (image.get('large') or {}).get('url') or (image.get('original') or {}).get('url')
        source = (row.get('source') or {}).get('url')
        hits.append(_hit(row.get('title') or row.get('generated_title') or 'Are.na block', f'https://www.are.na/block/{row.get("id")}',
                         row.get('description') or row.get('content') or '', 'are.na', image=src if _https(src) else None,
                         origin=source if _https(source) else None))
    return hits


def searxng(query, limit, **_):
    base = os.environ.get('SEARXNG_URL', '').strip().rstrip('/')
    if not base:
        return []
    data = _get_json(base + '/search', {'q': query, 'format': 'json'})
    return [_hit(row.get('title'), row.get('url'), row.get('content', ''), 'searxng', image=row.get('img_src') if _https(row.get('img_src')) else None)
            for row in data.get('results', [])[:limit] if _https(row.get('url'))]


def wikimedia_commons(query, limit, **_):
    data = _get_json('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'generator': 'search', 'gsrsearch': query + ' filetype:bitmap', 'gsrnamespace': 6,
                                                                'gsrlimit': limit, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 800,
                                                                'format': 'json'})
    pages = sorted((data.get('query') or {}).get('pages', {}).values(), key=lambda page: page.get('index', 0))
    hits = []
    for page in pages:
        info = (page.get('imageinfo') or [{}])[0]
        meta = info.get('extmetadata') or {}
        src = info.get('thumburl') or info.get('url')
        hits.append(_hit(page.get('title', '').removeprefix('File:'), info.get('descriptionurl') or f'https://commons.wikimedia.org/wiki/{quote(page.get("title", ""))}',
                         (meta.get('ImageDescription') or {}).get('value', ''), 'wikimedia_commons', image=src if _https(src) else None,
                         license=(meta.get('LicenseShortName') or {}).get('value'), author=_strip((meta.get('Artist') or {}).get('value', ''), 200)))
    return hits


def openverse(query, limit, **_):
    data = _get_json('https://api.openverse.org/v1/images/', {'q': query, 'page_size': min(limit, 20)})
    hits = []
    for row in data.get('results', []):
        src = row.get('url') or row.get('thumbnail')
        license_ = ' '.join(filter(None, [str(row.get('license') or '').upper(), str(row.get('license_version') or '')]))
        hits.append(_hit(row.get('title') or 'Untitled', row.get('foreign_landing_url') or src, ' · '.join(filter(None, [row.get('creator'), license_])),
                         'openverse', image=src if _https(src) else None, license=license_, author=row.get('creator')))
    return hits


def wikidata_official(query, limit, lang='en', **_):
    """The official website (Wikidata property P856) of the companies, products or projects a query names."""
    found = _get_json('https://www.wikidata.org/w/api.php', {'action': 'wbsearchentities', 'search': query, 'language': lang,
                                                             'limit': min(limit, 7), 'type': 'item', 'format': 'json'})
    labels = {row['id']: row.get('label') or row.get('match', {}).get('text') for row in found.get('search', []) if row.get('id')}
    ids = [qid for qid in labels if re.fullmatch(r'Q\d+', str(qid))]
    if not ids:
        return []
    data = _get_json('https://www.wikidata.org/w/api.php', {'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': 'claims|labels|descriptions',
                                                            'languages': lang, 'format': 'json'})
    hits = []
    for qid in ids:
        entity = (data.get('entities') or {}).get(qid) or {}
        for claim in (entity.get('claims') or {}).get('P856', [])[:1]:
            url = (((claim.get('mainsnak') or {}).get('datavalue') or {}).get('value'))
            if _https(url):
                label = ((entity.get('labels') or {}).get(lang) or {}).get('value') or labels.get(qid) or qid
                about = ((entity.get('descriptions') or {}).get(lang) or {}).get('value', '')
                hits.append(_hit(label + ' (official site)', url.replace('http://', 'https://', 1), about, 'wikidata_official', entity=qid))
    return hits


def brave(query, limit, **_):
    """Brave Search API (official; free tier). Only with BRAVE_SEARCH_API_KEY."""
    key = os.environ.get('BRAVE_SEARCH_API_KEY', '').strip()
    if not key:
        return []
    data = _get_json('https://api.search.brave.com/res/v1/web/search', {'q': query, 'count': min(limit, 20)}, {'X-Subscription-Token': key})
    return [_hit(row.get('title'), row.get('url'), row.get('description', ''), 'brave', published=row.get('page_age') or row.get('age'))
            for row in ((data.get('web') or {}).get('results') or []) if _https(row.get('url'))]


def google_cse(query, limit, **_):
    """Google Programmable Search JSON API (official). Only with GOOGLE_CSE_KEY and GOOGLE_CSE_ID."""
    key, cx = os.environ.get('GOOGLE_CSE_KEY', '').strip(), os.environ.get('GOOGLE_CSE_ID', '').strip()
    if not (key and cx):
        return []
    data = _get_json('https://www.googleapis.com/customsearch/v1', {'key': key, 'cx': cx, 'q': query, 'num': min(limit, 10)})
    return [_hit(row.get('title'), row.get('link'), row.get('snippet', ''), 'google_cse') for row in data.get('items') or [] if _https(row.get('link'))]


ADAPTERS = {'wikipedia': wikipedia, 'wikidata': wikidata, 'arxiv': arxiv, 'openalex': openalex, 'crossref': crossref,
            'semantic_scholar': semantic_scholar, 'github': github, 'hn_algolia': hn_algolia, 'are_na': are_na, 'searxng': searxng,
            'wikimedia_commons': wikimedia_commons, 'openverse': openverse,
            'wikidata_official': wikidata_official, 'brave': brave, 'google_cse': google_cse}
#: General web search, in preference order; each runs only when configured (keys or SEARXNG_URL).
WEB = ('searxng', 'brave', 'google_cse')
KEYED = {'searxng': ('SEARXNG_URL',), 'brave': ('BRAVE_SEARCH_API_KEY',), 'google_cse': ('GOOGLE_CSE_KEY', 'GOOGLE_CSE_ID')}
KINDS = {'web': WEB + ('wikidata_official', 'wikipedia', 'hn_algolia'), 'general': WEB + ('wikipedia', 'wikidata_official', 'hn_algolia'),
         'code': ('github', 'wikipedia'), 'dev': ('github', 'wikipedia'),
         'technical': WEB + ('github', 'wikidata_official', 'hn_algolia', 'arxiv', 'wikipedia'),
         'market': WEB + ('wikidata_official', 'hn_algolia', 'wikipedia'),
         'academic': ('arxiv', 'openalex', 'semantic_scholar', 'crossref'),
         'visual': ('are_na', 'wikimedia_commons', 'openverse'), 'images': ('are_na', 'wikimedia_commons', 'openverse'),
         'entity': ('wikidata', 'wikipedia'), 'news': ('hn_algolia', 'searxng')}
SITE_TEMPLATES = {'mdn': 'https://developer.mozilla.org/en-US/search?q={query}', 'python_docs': 'https://docs.python.org/3/search.html?q={query}',
                  'dribbble': 'https://dribbble.com/search/{query}', 'behance': 'https://www.behance.net/search/projects?search={query}'}


def available(name):
    """Configured here and not turned off by the person."""
    if name in KEYED and not all(os.environ.get(key, '').strip() for key in KEYED[name]):
        return False
    return name in ADAPTERS and allowed(name)


def _record(name, reason, browser=None, url='', ms=0):
    with _LOCK:
        _ERRORS[name] = {'reason': reason, 'at': round(time.time(), 3)}
    if browser is not None:
        browser.log.append({'action': 'search', 'url': url, 'status': 'error', 'bytes': 0, 'ms': ms, 'reason': f'{name}: {reason}', 'at': round(time.time(), 3)})


def _turn(name):
    """Reserve this adapter's next slot; False when the wait would be too long."""
    with _LOCK:
        now = time.monotonic()
        turn = max(_NEXT.get(name, 0.0), now)
        if turn - now > MAX_WAIT:
            return False
        _NEXT[name] = turn + INTERVALS.get(name, 1.0)
    if turn > now:
        time.sleep(turn - now)
    return True


def _run(name, query, limit, browser=None, **options):
    """One adapter call that never raises."""
    if name not in ADAPTERS:
        _record(name, 'unknown_adapter', browser)
        return []
    if not available(name):
        _record(name, 'disabled' if name in ADAPTERS and not allowed(name) else 'not_configured', browser)
        return []
    if not _turn(name):
        _record(name, 'rate_limited', browser)
        return []
    started = time.monotonic()
    try:
        hits = [row for row in ADAPTERS[name](query, limit, **options) if _https(row.get('url'))][:limit]
    except Exception as error:  # Never the message: it could carry a request URL or a header.
        reason = str(error) if re.fullmatch(r'http_\d{3}', str(error)) else type(error).__name__
        _record(name, reason, browser, name, round((time.monotonic() - started) * 1000))
        return []
    if browser is not None:
        browser.log.append({'action': 'search', 'url': name, 'status': 'ok', 'bytes': len(hits), 'ms': round((time.monotonic() - started) * 1000),
                            'reason': '', 'at': round(time.time(), 3)})
    return hits


def _adapters_for(kinds):
    names = []
    for kind in kinds:
        for name in (KINDS.get(kind) or ((kind,) if kind in ADAPTERS else ())):
            if name not in names:
                names.append(name)
    return names


def _merge(lists, limit):
    """Round-robin across adapters, de-duplicated by URL."""
    out, seen = [], set()
    for depth in range(max((len(rows) for rows in lists), default=0)):
        for rows in lists:
            if depth < len(rows) and rows[depth]['url'] not in seen:
                seen.add(rows[depth]['url'])
                out.append(rows[depth])
                if len(out) >= limit:
                    return out
    return out


def _parallel(names, query, limit, browser=None, **options):
    if not names:
        return []
    with ThreadPoolExecutor(max_workers=min(4, len(names))) as pool:
        return list(pool.map(lambda name: _run(name, query, limit, browser, **options), names))


def search(query, kinds=('web',), limit=8, browser=None, **options):
    """Hits [{title, url, snippet, source, image?}] from the free adapters for these kinds (or adapter names)."""
    query = str(query or '').strip()[:300]
    if not query:
        return []
    if isinstance(kinds, str):
        kinds = (kinds,)
    names = [name for name in _adapters_for(kinds) if name not in KEYED or available(name)]
    return _merge(_parallel(names, query, limit, browser, **options), limit)


def images(query, limit=24, browser=None):
    """Image hits for moodboards: Are.na first, then Wikimedia Commons, then Openverse. Every hit has `image`."""
    query = str(query or '').strip()[:300]
    out, seen = [], set()
    if not query:
        return out
    for name in ('are_na', 'wikimedia_commons', 'openverse'):
        for row in _run(name, query, limit, browser):
            if row.get('image') and row['image'] not in seen:
                seen.add(row['image'])
                out.append(row)
                if len(out) >= limit:
                    return out
    return out


SIGNALS = (('code', r'\b(code|api|library|framework|sdk|repo|github|bug|python|javascript|typescript|rust|react|npm|pip|cli)\b'),
           ('academic', r'\b(paper|study|studies|research|journal|arxiv|doi|peer[- ]review|meta-analysis|citation|thesis)\b'),
           ('visual', r'\b(moodboard|mood board|visual|image|images|photo|typography|poster|palette|aesthetic|brutalis[mt]|editorial|design reference)\b'))


def plan_sources(intent, query=''):
    """Adapter names for a topic, only those available now.

    V30: the topic comes from source_ranking.topic (technical / market / academic / visual / general).
    General web search (SearXNG, Brave, Google Programmable Search) leads whenever it is configured;
    Wikipedia is one source among several, never the only one for a technical or market question."""
    from astra_ai.core.work.source_ranking import topic
    intent = str(intent or '').lower().strip()
    intent = {'dev': 'technical', 'code': 'technical', 'engineering': 'technical', 'research': 'academic', 'science': 'academic',
              'design': 'visual', 'moodboard': 'visual', 'image': 'visual', 'images': 'visual',
              'compare': 'market', 'review': 'technical', 'explain': 'technical', 'map': 'technical'}.get(intent, intent)
    kind = topic(query, intent if intent in ('technical', 'market', 'academic', 'visual', 'general') else '')
    names = {'technical': KINDS['technical'], 'market': KINDS['market'],
             'academic': ('arxiv', 'openalex', 'semantic_scholar', 'crossref', 'wikipedia'),
             'visual': ('are_na', 'wikimedia_commons', 'openverse')}.get(kind, KINDS['general'])
    return [name for name in names if available(name)]


def site_search(url_template, query, browser=None, limit=12):
    """Read an allowed site's own search page through AgentBrowser (robots, walls and limits apply).

    `url_template` is a SITE_TEMPLATES name or an http(s) template with `{query}`. Returns Hits of the
    page's same-site links; empty with `reason` when refused or blocked."""
    template = SITE_TEMPLATES.get(url_template, url_template)
    if not isinstance(template, str) or '{query}' not in template or urlsplit(template).scheme not in {'http', 'https'}:
        return Hits(status='refused', reason='bad_template')
    if not allowed('site_pages'):
        return Hits(status='refused', reason='disabled')
    if browser is None:
        from astra_ai.core.work.agent_browser import AgentBrowser
        browser = AgentBrowser()
    url = template.replace('{query}', quote_plus(str(query or '').strip()[:200]))
    page = browser.read(url)
    if page.get('status') != 'ok':
        return Hits(status=page.get('status', 'error'), reason=page.get('reason', ''))
    source = _strip(page.get('site'), 100)
    rows = [_hit(link['text'] or link['href'], link['href'], '', source) for link in page.get('links', [])
            if link.get('same_site') and link.get('text') and link['href'].rstrip('/') != url.rstrip('/')]
    return Hits(rows[:limit])


def try_site_images(site, query, browser=None, limit=24):
    """Public search-page images from a design site (Dribbble, Behance), only where robots.txt allows.

    On a refusal or wall it returns an empty Hits with `reason` and never retries around it."""
    template = SITE_TEMPLATES.get(str(site).lower())
    if str(site).lower() not in {'dribbble', 'behance'} or not template:
        return Hits(status='refused', reason='unknown_site')
    if not allowed('site_pages'):
        return Hits(status='refused', reason='disabled')
    if browser is None:
        from astra_ai.core.work.agent_browser import AgentBrowser
        browser = AgentBrowser()
    url = template.replace('{query}', quote_plus(str(query or '').strip()[:200]))
    page = browser.read(url)
    if page.get('status') != 'ok':
        return Hits(status=page.get('status', 'error'), reason=page.get('reason', ''))
    rows = [_hit(image['alt'] or page.get('title') or site, page['final_url'], image['alt'], str(site).lower(), image=image['src'])
            for image in page.get('images', []) if image.get('src')]
    return Hits(rows[:limit])
