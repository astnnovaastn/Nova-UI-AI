"""V30: choosing which discovered pages to read, so free retrieval is relevant and not mostly Wikipedia.

V29's general web search was Wikipedia plus Hacker News (SearXNG was unset), merged round-robin and
read in arrival order. Here every hit gets:

- a canonical URL (scheme, `www.`, mobile Wikipedia, tracking parameters, fragments and trailing
  slashes normalised) so the same page is never read twice;
- a source type (official, docs, repository, paper, reference, news, forum, other);
- a score: query relevance, plus a preference for the source types the topic needs (official
  pages and docs for technical and market topics, papers for academic ones), plus freshness when
  the topic is about something current;
- a diversity pass: at most `per_domain` pages per site, and reference sites (Wikipedia, Wikidata)
  at most `reference_cap` unless the topic is a general definition.

These are preferences, not quotas: a relevant page is never dropped to make room for an unrelated
one, and an empty slot stays empty.
"""
from __future__ import annotations

import re
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKING = re.compile(r'^(utm_|fbclid$|gclid$|mc_|ref$|ref_src$|igshid$|si$|spm$)', re.I)
REFERENCE = {'wikipedia.org', 'wikidata.org', 'wikimedia.org', 'britannica.com'}
REPOSITORY = {'github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'huggingface.co', 'pypi.org', 'npmjs.com', 'crates.io'}
PAPER = {'arxiv.org', 'doi.org', 'openalex.org', 'semanticscholar.org', 'acm.org', 'ieee.org', 'nature.com', 'sciencedirect.com',
         'springer.com', 'ncbi.nlm.nih.gov', 'pubmed.ncbi.nlm.nih.gov', 'biorxiv.org', 'medrxiv.org', 'openreview.net', 'aclanthology.org'}
NEWS = {'reuters.com', 'apnews.com', 'bbc.co.uk', 'bbc.com', 'theverge.com', 'techcrunch.com', 'arstechnica.com', 'wired.com',
        'ft.com', 'bloomberg.com', 'wsj.com', 'nytimes.com', 'theguardian.com', 'cnbc.com', 'venturebeat.com', 'zdnet.com'}
FORUM = {'news.ycombinator.com', 'reddit.com', 'stackoverflow.com', 'stackexchange.com', 'medium.com', 'dev.to', 'quora.com'}
DOCS_PATH = re.compile(r'(^|\.)(docs|developer|developers|dev|api|learn|support|help)\.|/(docs?|documentation|guide|guides|reference|api|manual|changelog|release-notes|releases)(/|$)', re.I)
OFFICIAL_PATH = re.compile(r'/(pricing|plans|features|product|products|about|enterprise|compare|solutions)(/|$)', re.I)

#: How much each source type is worth for each kind of topic.
PREFERENCE = {
    'technical': {'docs': 3.0, 'official': 2.5, 'repository': 2.5, 'paper': 1.0, 'news': 0.8, 'forum': 0.6, 'reference': 0.4, 'other': 1.0},
    'market':    {'official': 3.0, 'docs': 1.5, 'news': 2.0, 'repository': 0.8, 'paper': 0.6, 'forum': 0.6, 'reference': 0.4, 'other': 1.2},
    'academic':  {'paper': 3.0, 'docs': 1.0, 'official': 1.0, 'repository': 1.2, 'reference': 0.8, 'news': 0.5, 'forum': 0.3, 'other': 0.8},
    'general':   {'official': 1.5, 'reference': 1.5, 'docs': 1.2, 'news': 1.2, 'paper': 1.0, 'repository': 0.8, 'forum': 0.6, 'other': 1.0},
    'visual':    {'other': 1.5, 'official': 1.2, 'reference': 0.8, 'docs': 0.6, 'news': 1.0, 'paper': 0.4, 'repository': 0.3, 'forum': 0.5},
}
TOPIC_SIGNALS = (
    ('academic', r'\b(paper|papers|study|studies|journal|arxiv|doi|peer[- ]review|meta-analysis|literature|thesis|clinical|trial)\b'),
    ('technical', r'\b(code|coding|api|sdk|library|framework|repo|repository|github|developer|devtools?|programming|python|javascript|typescript|rust|react|'
                  r'cli|open[- ]source|llm|model|inference|kubernetes|database|architecture|assistant|copilot|ide)\b'),
    ('market', r'\b(market|competitor|competitors|competition|pricing|price|prices|plans?|vendors?|companies|startups?|investors?|funding|revenue|'
               r'customers?|landscape|alternatives|compare|comparison|campaign|launch|brand)\b'),
    ('visual', r'\b(moodboard|mood board|visual|typography|poster|palette|aesthetic|editorial|brutalis[mt]|photography|illustration)\b'),
)
CURRENT = re.compile(r'\b(latest|current|today|this year|recent|new|20\d\d|now|release|released|announced)\b', re.I)
STOP = set('a an the of for and or to in on with by from at is are be how what which who why vs versus best top main about into my our your'.split())


def registrable(host):
    """The site a host belongs to (good enough for diversity: last two labels, three for co.uk-style)."""
    host = (host or '').lower().strip('.').removeprefix('www.').removeprefix('m.')
    parts = host.split('.')
    if len(parts) >= 3 and len(parts[-1]) == 2 and parts[-2] in {'co', 'com', 'ac', 'org', 'gov', 'net', 'edu'}:
        return '.'.join(parts[-3:])
    return '.'.join(parts[-2:])


def canonical(url):
    """One spelling per page: https, no www/mobile prefix, no tracking parameters, fragment or trailing slash."""
    try:
        parts = urlsplit(str(url or '').strip())
    except ValueError:
        return ''
    if parts.scheme not in ('http', 'https') or not parts.hostname:
        return ''
    host = parts.hostname.lower()
    host = re.sub(r'^(www\d?|m|mobile)\.', '', host)
    host = re.sub(r'^([a-z]{2,3})\.m\.wikipedia\.org$', r'\1.wikipedia.org', host)
    if parts.port and parts.port not in (80, 443):
        host += ':' + str(parts.port)
    query = urlencode([(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if not TRACKING.match(k)])
    path = re.sub(r'/+$', '', parts.path) or ''
    return urlunsplit(('https', host, path, query, ''))


def source_type(url, provider=''):
    parts = urlsplit(url or '')
    host = (parts.hostname or '').lower()
    site = registrable(host)
    # The page's own address decides; the adapter that found it only breaks a tie (HN links to vendor blogs, GitHub hosts product pages).
    provider = (provider or '').lower()
    if provider in {'arxiv', 'openalex', 'crossref', 'semantic_scholar'} or site in PAPER or host in PAPER:
        return 'paper'
    if site in REFERENCE:
        return 'reference'
    if site == 'github.com' and re.match(r'^/(features|pricing|enterprise|team|about|solutions|copilot)(/|$)', parts.path):
        return 'official'
    if site in REPOSITORY:
        return 'repository'
    if host in FORUM or site in FORUM:
        return 'forum'
    if site in NEWS:
        return 'news'
    if DOCS_PATH.search(host + parts.path):
        return 'docs'
    if provider in {'official', 'wikidata_official', 'direct'} or OFFICIAL_PATH.search(parts.path) or parts.path in ('', '/'):
        return 'official'
    return 'other'


def topic(query, intent=''):
    """technical / market / academic / visual / general, from the workflow intent and the words of the request."""
    intent = (intent or '').lower()
    if intent in PREFERENCE:
        return intent
    text = str(query or '')
    for name, pattern in TOPIC_SIGNALS:
        if re.search(pattern, text, re.I):
            return name
    return {'compare': 'market', 'review': 'technical', 'explain': 'technical', 'map': 'technical', 'modify': 'technical'}.get(intent, 'general')


def _words(text):
    return {w for w in re.findall(r'[a-z0-9][a-z0-9+#.-]{1,}', str(text or '').lower()) if w not in STOP}


def relevance(hit, query):
    """0..1: how many of the request's words the title and snippet carry (title counts double)."""
    wanted = _words(query)
    if not wanted:
        return 0.5
    title, snippet = _words(hit.get('title')), _words(hit.get('snippet'))
    host = _words((urlsplit(hit.get('url') or '').hostname or '').replace('.', ' '))
    score = sum(2 if w in title else 1 if w in snippet or w in host else 0 for w in wanted)
    return min(1.0, score / (2 * len(wanted)))


def _year(value):
    match = re.search(r'(19|20)\d\d', str(value or ''))
    return int(match.group(0)) if match else None


def score(hit, query, kind):
    stype = hit.get('source_type') or source_type(hit.get('url'), hit.get('source'))
    value = 1.0 + 3.0 * relevance(hit, query)
    value *= PREFERENCE.get(kind, PREFERENCE['general']).get(stype, 1.0)
    if hit.get('direct'):
        # A page the person supplied or the lead named as the primary source is read first.
        value += 6.0
    year = _year(hit.get('published'))
    if year and CURRENT.search(query or ''):
        value += max(0.0, 1.0 - 0.4 * max(0, datetime.now().year - year))
    if not hit.get('snippet') and not hit.get('direct'):
        value *= 0.85
    return round(value, 4)


def rank(hits, query, kind='general', limit=8, per_domain=2, reference_cap=None):
    """The hits worth reading, best first, each page once, no site more than `per_domain` times."""
    if reference_cap is None:
        reference_cap = 2 if kind == 'general' else 1
    seen, rows = set(), []
    for hit in hits or []:
        url = canonical(hit.get('url'))
        if not url or url in seen:
            continue
        seen.add(url)
        row = {**hit, 'canonical_url': url, 'source_type': hit.get('source_type') or source_type(hit.get('url'), hit.get('source'))}
        row['score'] = score(row, query, kind)
        rows.append(row)
    rows.sort(key=lambda r: -r['score'])
    out, per_site, references = [], {}, 0
    for row in rows:
        site = registrable(urlsplit(row['canonical_url']).hostname)
        if per_site.get(site, 0) >= per_domain and not row.get('direct'):
            continue
        if row['source_type'] == 'reference' and not row.get('direct'):
            if references >= reference_cap:
                continue
            references += 1
        per_site[site] = per_site.get(site, 0) + 1
        out.append(row)
        if len(out) >= limit:
            break
    return out


def coverage(rows):
    """What a set of chosen sources covers: {source_type: count, 'sites': n}. Recorded with the run."""
    out = {}
    for row in rows:
        out[row.get('source_type', 'other')] = out.get(row.get('source_type', 'other'), 0) + 1
    out['sites'] = len({registrable(urlsplit(r.get('canonical_url') or r.get('url') or '').hostname) for r in rows})
    return out
