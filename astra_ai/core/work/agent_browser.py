"""AgentBrowser: how AEGIS agents read the public web themselves (V29).

A small, synchronous, thread-safe page reader for agents (call it from asyncio with `to_thread`).
It never opens a visible pane and never uses the person's cookies or sessions. Rules it keeps:

- Public http(s) addresses only, checked after DNS and again on every redirect (network.py rules).
- Without a proxy it connects to the very address that was checked (Host header and TLS SNI carry
  the name), so a second DNS answer cannot reach a private host (closes the DNS-rebinding gap).
  Behind a configured proxy the proxy resolves names itself; a literal private address or a local
  name is still refused, but a public name that the proxy resolves to a private address is a
  residual risk owned by whoever configured that proxy (the same rule as network._get).
- robots.txt is read per host (cached) and obeyed for the honest agent `AegisAgentBrowser/1.0`.
- One request per second per host, and a page cap per instance (24 by default).
- On CAPTCHA, consent or login walls, 401/403/429: stop and report `blocked`. Never solved, retried
  around, rotated, or done with someone's signed-in session; the host stays blocked for this instance.
- Page text is untrusted data (`untrusted: True`), never instructions.

Every action is appended to `self.log` so the orchestrator can trace what the browser did.
Screenshots and JavaScript rendering need a desktop host: `register_renderer(callable)` lets the
Electron host provide them later; without one, `capture_screenshot` reports it is unavailable.
"""
from __future__ import annotations

import re
import threading
import time
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser

from astra_ai.core.work.network import MAX_PAGE_BYTES, ProxySettings, _local_name

USER_AGENT = 'AegisAgentBrowser/1.0 (+local)'
ROBOTS_AGENT = 'AegisAgentBrowser'
TEXT_CHARS = 60_000
MAX_TABLES = 5
MAX_TABLE_ROWS = 40
MAX_IMAGES = 40
MAX_LINKS = 300
RATE_SECONDS = 1.0
ROBOTS_TTL = 3600
ROBOTS_RETRY_TTL = 120
PAGE_SECONDS = 25
REDIRECTS = 5

# Structural markers of challenge pages. Plain words like "captcha" are not used: an article about
# CAPTCHAs is not a wall.
CHALLENGE_MARKERS = (
    ('captcha', re.compile(r'class=["\'][^"\']*g-recaptcha|google\.com/recaptcha/|hcaptcha\.com/1/api|challenges\.cloudflare\.com/turnstile'
                           r'|/cdn-cgi/challenge-platform|cf-chl-|cf_chl_|captcha-delivery\.com|px-captcha|id=["\']captcha-container'
                           r'|<title>\s*(just a moment\.\.\.|attention required!|verify you are human|are you a robot|security check)', re.I)),
    ('consent_wall', re.compile(r'consent\.(google|youtube)\.com|<title>\s*before you continue|id=["\']sp_message_container'
                                r'|class=["\'][^"\']*fc-consent-root', re.I)),
)
LOGIN_PATH = re.compile(r'/(login|signin|sign-in|sign_in|auth/login|accounts/login|session/new)(\b|/|$)', re.I)

_STATE = threading.Lock()
_HOST_NEXT: dict[str, float] = {}
_ROBOTS: dict[tuple[str, str], tuple[float, object]] = {}
_RENDERER = None


def _desktop_renderer():
    """The AEGIS Desktop host's renderer while the desktop app is connected (V29), else None."""
    try:
        from .agent_browser_host import renderer
        return renderer()
    except Exception:
        return None


def register_renderer(renderer):
    """Install a desktop host renderer: `renderer(action, url) -> dict`.

    action 'render' returns {'html': str} for a page whose server HTML had no text; action
    'screenshot' returns {'available': True, 'png_base64': ..., ...}. None uninstalls it.
    """
    global _RENDERER
    _RENDERER = renderer


def _reset_shared_state():
    """Tests only: forget robots answers and host turn times."""
    with _STATE:
        _HOST_NEXT.clear()
        _ROBOTS.clear()


class _Stop(Exception):
    def __init__(self, status, reason):
        super().__init__(reason)
        self.status = status
        self.reason = reason


def _default_resolve(url):
    from astra_ai.core.research.frame_policy import public_address
    return public_address(url)


def _default_fetch(url, ip, proxies, headers, limit=MAX_PAGE_BYTES):
    """One GET, no redirects followed. Returns {'status', 'headers' (lower-case), 'body', 'truncated'}."""
    started = time.monotonic()
    if ip and not proxies:
        import certifi
        import urllib3
        parts = urlsplit(url)
        port = parts.port or (443 if parts.scheme == 'https' else 80)
        pool = (urllib3.HTTPSConnectionPool(ip, port=port, assert_hostname=parts.hostname, server_hostname=parts.hostname,
                                            cert_reqs='CERT_REQUIRED', ca_certs=certifi.where())
                if parts.scheme == 'https' else urllib3.HTTPConnectionPool(ip, port=port))
        target = (parts.path or '/') + ('?' + parts.query if parts.query else '')
        response = pool.request('GET', target, timeout=urllib3.Timeout(connect=6, read=15), redirect=False, retries=False,
                                preload_content=False, headers={**headers, 'Host': parts.netloc})
        try:
            body, truncated = b'', False
            for chunk in response.stream(65536):
                body += chunk
                if len(body) > limit or time.monotonic() - started > PAGE_SECONDS:
                    truncated = True
                    break
            return {'status': response.status, 'headers': {k.lower(): v for k, v in response.headers.items()}, 'body': body[:limit], 'truncated': truncated}
        finally:
            response.release_conn()
            response.close()
            pool.close()
    import requests
    response = requests.get(url, proxies=proxies, timeout=(6, 15), allow_redirects=False, stream=True, headers=headers)
    try:
        body, truncated = b'', False
        for chunk in response.iter_content(65536):
            body += chunk
            if len(body) > limit or time.monotonic() - started > PAGE_SECONDS:
                truncated = True
                break
        return {'status': response.status_code, 'headers': {k.lower(): v for k, v in response.headers.items()}, 'body': body[:limit], 'truncated': truncated}
    finally:
        response.close()


def _site(url):
    return (urlsplit(url).hostname or '').lower().removeprefix('www.')


def _clean(value, limit=300):
    return re.sub(r'\s+', ' ', str(value or '')).strip()[:limit]


class AgentBrowser:
    def __init__(self, settings: ProxySettings | None = None, max_pages=24, fetch=None, resolve=None, renderer=None,
                 sleep=time.sleep, now=time.monotonic):
        self.settings = settings
        self.max_pages = max_pages
        self.pages = 0
        self.log: list[dict] = []
        self._fetch = fetch or _default_fetch
        self._resolve = resolve or _default_resolve
        self._renderer = renderer
        self._sleep = sleep
        self._now = now
        self._lock = threading.RLock()
        self._page = None
        self._blocked: dict[str, str] = {}
        self.closed = False

    # -- plumbing -----------------------------------------------------------------------------

    def _record(self, action, url, status, bytes_=0, ms=0, reason=''):
        self.log.append({'action': action, 'url': url, 'status': status, 'bytes': bytes_, 'ms': ms, 'reason': reason, 'at': round(time.time(), 3)})

    def _proxies(self):
        try:
            return self.settings.proxies() if self.settings else None
        except Exception:
            return None

    def _check(self, url, proxies):
        """The checked IP to connect to, or None when a proxy resolves the name. Raises _Stop when refused."""
        parts = urlsplit(url)
        if parts.scheme not in {'http', 'https'} or not parts.hostname:
            raise _Stop('refused', 'invalid_address')
        try:
            return self._resolve(url)
        except ValueError as error:
            raise _Stop('refused', str(error) or 'non_public_address') from None
        except OSError:
            host = parts.hostname.lower()
            if proxies and not _local_name(host) and not parts.username and parts.port in {None, 80, 443}:
                return None  # The proxy resolves it (residual risk documented above).
            raise _Stop('refused', 'unresolvable') from None

    def _wait_turn(self, host):
        with _STATE:
            now = self._now()
            turn = max(_HOST_NEXT.get(host, 0.0), now)
            _HOST_NEXT[host] = turn + RATE_SECONDS
        if turn > now:
            self._sleep(turn - now)

    def _get(self, action, url, ip, proxies, limit=MAX_PAGE_BYTES):
        self._wait_turn((urlsplit(url).hostname or '').lower())
        headers = {'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.3',
                   'Accept-Language': 'en;q=0.9,*;q=0.5', 'Accept-Encoding': 'gzip, deflate'}
        started = time.monotonic()
        try:
            response = self._fetch(url, ip, proxies, headers, limit) if self._fetch is _default_fetch else self._fetch(url, ip, proxies, headers)
        except Exception as error:  # Messages may hold proxy credentials: only the type is kept.
            self._record(action, url, 'error', 0, round((time.monotonic() - started) * 1000), type(error).__name__)
            raise _Stop('error', type(error).__name__) from None
        response.setdefault('headers', {})
        response['headers'] = {str(k).lower(): v for k, v in response['headers'].items()}
        response.setdefault('body', b'')
        self._record(action, url, response['status'], len(response['body']), round((time.monotonic() - started) * 1000))
        return response

    def _robots(self, url, proxies):
        parts = urlsplit(url)
        key = (parts.scheme, parts.netloc.lower())
        with _STATE:
            cached = _ROBOTS.get(key)
        if cached and time.time() < cached[0]:
            rules = cached[1]
        else:
            rules, ttl = self._load_robots(f'{parts.scheme}://{parts.netloc}/robots.txt', proxies)
            with _STATE:
                _ROBOTS[key] = (time.time() + ttl, rules)
        if rules == 'allow':
            return ''
        if rules == 'unreachable':
            return 'robots_unreachable'
        return '' if rules.can_fetch(ROBOTS_AGENT, url) else 'robots_disallowed'

    def _load_robots(self, robots_url, proxies):
        """RFC 9309: 4xx means no rules; 5xx, 429 or unreachable means do not crawl (retried later)."""
        current = robots_url
        try:
            for _ in range(REDIRECTS + 1):
                ip = self._check(current, proxies)
                response = self._get('robots', current, ip, proxies, limit=500_000)
                status = response['status']
                if status in {301, 302, 303, 307, 308} and response['headers'].get('location'):
                    current = urljoin(current, response['headers']['location'])
                    continue
                if status == 429 or status >= 500:
                    return 'unreachable', ROBOTS_RETRY_TTL
                if status >= 400:
                    return 'allow', ROBOTS_TTL
                parser = RobotFileParser()
                parser.parse(response['body'].decode('utf-8', errors='replace').splitlines())
                return parser, ROBOTS_TTL
        except _Stop:
            pass
        return 'unreachable', ROBOTS_RETRY_TTL

    @staticmethod
    def _wall(response, url):
        status = response['status']
        if status == 401:
            return 'login_required'
        if status in {403, 429}:
            return 'http_' + str(status)
        head = response['body'][:200_000].decode('utf-8', errors='replace')
        for reason, pattern in CHALLENGE_MARKERS:
            if pattern.search(head):
                return reason
        return ''

    # -- public API ---------------------------------------------------------------------------

    def navigate(self, url):
        """Fetch a public page. Returns PageResult {url, final_url, status, http_status, title, site, reason}."""
        with self._lock:
            result = {'url': url, 'final_url': url, 'status': 'refused', 'http_status': None, 'title': '', 'site': _site(url), 'reason': ''}
            if self.closed:
                result['reason'] = 'closed'
                return result
            if self.pages >= self.max_pages:
                result['reason'] = 'page_cap'
                self._record('navigate', url, 'refused', reason='page_cap')
                return result
            self._page = None
            proxies = self._proxies()
            current = url
            counted = False
            try:
                for _ in range(REDIRECTS + 1):
                    parts = urlsplit(current)
                    host = (parts.hostname or '').lower()
                    if host in self._blocked:
                        raise _Stop('blocked', self._blocked[host])
                    if host.startswith('consent.'):
                        raise _Stop('blocked', 'consent_wall')
                    if LOGIN_PATH.search(parts.path or '') and current != url:
                        raise _Stop('blocked', 'login_required')
                    ip = self._check(current, proxies)
                    refusal = self._robots(current, proxies)
                    if refusal:
                        raise _Stop('refused', refusal)
                    if not counted:
                        self.pages += 1
                        counted = True
                    response = self._get('navigate', current, ip, proxies)
                    if response['status'] in {301, 302, 303, 307, 308} and response['headers'].get('location'):
                        current = urljoin(current, response['headers']['location'])
                        continue
                    break
                else:
                    raise _Stop('refused', 'too_many_redirects')
                result['final_url'] = current
                result['site'] = _site(current)
                result['http_status'] = response['status']
                wall = self._wall(response, current)
                if wall:
                    self._blocked[(urlsplit(current).hostname or '').lower()] = wall
                    raise _Stop('blocked', wall)
                if response['status'] >= 400:
                    raise _Stop('error', 'http_' + str(response['status']))
                kind = str(response['headers'].get('content-type', '')).lower()
                if kind and 'html' not in kind and 'text/plain' not in kind:
                    raise _Stop('error', 'not_a_page')
                self._page = {'url': url, 'final_url': current, 'kind': kind, 'body': response['body'], 'truncated': bool(response.get('truncated')),
                              'retrieved_at': round(time.time())}
                result['status'] = 'ok'
                result['title'] = self._title()
                return result
            except _Stop as stop:
                result['status'] = stop.status
                result['reason'] = stop.reason
                result['final_url'] = current
                if stop.status in {'blocked', 'refused'}:
                    self._record('navigate', current, stop.status, reason=stop.reason)
                return result

    def _soup(self, html=None):
        from bs4 import BeautifulSoup
        if html is not None:
            return BeautifulSoup(html, 'html.parser')
        match = re.search(r'charset=([\w-]+)', self._page['kind'])
        return BeautifulSoup(self._page['body'], 'html.parser', from_encoding=match.group(1) if match else None)

    def _title(self):
        if 'text/plain' in self._page['kind']:
            return _site(self._page['final_url'])
        soup = self._soup()
        og = soup.find('meta', attrs={'property': 'og:title'})
        return _clean((soup.title.get_text(' ', strip=True) if soup.title else '') or (og.get('content') if og else '') or _site(self._page['final_url']))

    def read_page(self):
        """PageContent of the current page; text and everything else is untrusted data."""
        with self._lock:
            if not self._page:
                return {'status': 'error', 'reason': 'no_page', 'untrusted': True}
            page = self._page
            final = page['final_url']
            base = {'url': page['url'], 'final_url': final, 'site': _site(final), 'retrieved_at': page['retrieved_at'], 'untrusted': True,
                    'truncated': page['truncated'], 'rendered': False}
            if 'text/plain' in page['kind']:
                text = page['body'].decode('utf-8', errors='replace')
                return {**base, 'status': 'ok', 'title': _site(final), 'text': text[:TEXT_CHARS], 'headings': [], 'tables': [], 'links': [], 'images': [],
                        'meta': {}}
            content = self._extract(self._soup(), final)
            renderer = self._renderer or _RENDERER or _desktop_renderer()
            if not content['text'] and renderer:
                try:
                    rendered = renderer('render', final) or {}
                    if rendered.get('html'):
                        content = self._extract(self._soup(str(rendered['html'])), final)
                        base['rendered'] = True
                        self._record('render', final, 'ok', len(str(rendered['html'])))
                    elif rendered.get('text'):
                        # The desktop host returns extracted text, links and images rather than HTML.
                        content = {**content, 'title': _clean(rendered.get('title') or content.get('title', ''), 300),
                                   'text': str(rendered['text'])[:TEXT_CHARS],
                                   'links': [{'href': l.get('href'), 'text': _clean(l.get('text', ''), 200), 'same_site': _site(l.get('href') or '') == _site(final)}
                                             for l in rendered.get('links', [])[:300] if isinstance(l, dict) and str(l.get('href', '')).startswith(('http://', 'https://'))],
                                   'images': [{'src': i.get('src'), 'alt': _clean(i.get('alt', ''), 200)} for i in rendered.get('images', [])[:40]
                                              if isinstance(i, dict) and str(i.get('src', '')).startswith(('http://', 'https://'))]}
                        base['rendered'] = True
                        self._record('render', final, 'ok', len(content['text']))
                except Exception as error:
                    self._record('render', final, 'error', reason=type(error).__name__)
            return {**base, 'status': 'ok', **content}

    @staticmethod
    def _extract(soup, final):
        def meta(*names):
            for name in names:
                tag = soup.find('meta', attrs={'property': name}) or soup.find('meta', attrs={'name': name}) or soup.find('meta', attrs={'itemprop': name})
                if tag and tag.get('content'):
                    return _clean(tag['content'], 1000)
            return ''

        canonical = soup.find('link', rel=lambda value: value and 'canonical' in (value if isinstance(value, list) else [value]))
        og_image = meta('og:image', 'og:image:url', 'twitter:image')
        published = meta('article:published_time', 'datePublished', 'citation_publication_date', 'citation_date', 'dc.date', 'DC.date', 'date', 'pubdate')
        if not published:
            stamp = soup.find('time', attrs={'datetime': True})
            published = _clean(stamp['datetime'], 100) if stamp else ''
        info = {'description': meta('description', 'og:description', 'twitter:description'),
                'canonical': urljoin(final, canonical['href']) if canonical and canonical.get('href') else '',
                'og:title': meta('og:title'), 'og:image': urljoin(final, og_image) if og_image else '', 'og:site_name': meta('og:site_name'),
                'published': published}
        title = _clean((soup.title.get_text(' ', strip=True) if soup.title else '') or info['og:title'] or _site(final))
        host = (urlsplit(final).hostname or '').lower().removeprefix('www.')
        links, seen = [], set()
        for anchor in soup.find_all('a', href=True):
            href = urljoin(final, anchor['href'].strip()).split('#')[0]
            if urlsplit(href).scheme not in {'http', 'https'} or href in seen:
                continue
            seen.add(href)
            links.append({'href': href, 'text': _clean(anchor.get_text(' ', strip=True) or anchor.get('title') or anchor.get('aria-label'), 200),
                          'same_site': (urlsplit(href).hostname or '').lower().removeprefix('www.') == host})
            if len(links) >= MAX_LINKS:
                break
        images, seen = [], set()
        for image in soup.find_all('img'):
            src = image.get('src') or image.get('data-src') or ''
            if (not src or src.startswith('data:')) and image.get('srcset'):
                src = image['srcset'].split(',')[0].strip().split(' ')[0]
            if not src or src.startswith('data:'):
                continue
            src = urljoin(final, src.strip())
            if urlsplit(src).scheme not in {'http', 'https'} or src in seen:
                continue
            seen.add(src)
            images.append({'src': src, 'alt': _clean(image.get('alt'), 300)})
            if len(images) >= MAX_IMAGES:
                break
        for tag in soup(['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'form', 'button', 'input', 'select', 'textarea',
                         'nav', 'footer', 'header', 'aside']):
            tag.decompose()
        main = soup.find('article') or soup.find('main') or soup.find(attrs={'role': 'main'}) or soup.body or soup
        headings = [{'level': int(tag.name[1]), 'text': _clean(tag.get_text(' ', strip=True))} for tag in main.find_all(['h1', 'h2', 'h3', 'h4'])]
        headings = [row for row in headings if row['text']][:80]
        tables = []
        for table in main.find_all('table'):
            rows = [[_clean(cell.get_text(' ', strip=True)) for cell in row.find_all(['th', 'td'])][:20] for row in table.find_all('tr')]
            rows = [row for row in rows if any(row)][:MAX_TABLE_ROWS]
            if rows:
                tables.append(rows)
            if len(tables) >= MAX_TABLES:
                break
        for tag in main.find_all('br'):
            tag.replace_with('\n')
        for tag in main.find_all(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'section', 'blockquote', 'pre', 'dd', 'dt', 'figcaption', 'table']):
            tag.insert_before('\n')
            tag.insert_after('\n')
        lines = (re.sub(r'[ \t\r\f\v\xa0]+', ' ', line).strip() for line in main.get_text().split('\n'))
        text = '\n'.join(line for line in lines if line)[:TEXT_CHARS]
        return {'title': title, 'text': text, 'headings': headings, 'tables': tables, 'links': links, 'images': images, 'meta': info}

    def extract_links(self):
        """Links of the current page: [{href, text, same_site}]."""
        page = self.read_page()
        return page.get('links', [])

    def read(self, url):
        """navigate + read_page. On refusal or block, the navigate result is returned as is."""
        with self._lock:
            result = self.navigate(url)
            if result['status'] != 'ok':
                return {**result, 'untrusted': True}
            return self.read_page()

    def search(self, query, adapter=None, limit=8):
        """Free search adapters only (see free_search). `adapter` is an adapter name or a kind."""
        from astra_ai.core.work import free_search
        return free_search.search(query, kinds=(adapter or 'web',), limit=limit, browser=self)

    def capture_screenshot(self):
        renderer = self._renderer or _RENDERER or _desktop_renderer()
        if not renderer:
            return {'available': False, 'reason': 'needs_desktop_host'}
        with self._lock:
            if not self._page:
                return {'available': False, 'reason': 'no_page'}
            final = self._page['final_url']
        try:
            shot = renderer('screenshot', final) or {}
        except Exception as error:
            self._record('screenshot', final, 'error', reason=type(error).__name__)
            return {'available': False, 'reason': 'renderer_failed'}
        self._record('screenshot', final, 'ok' if shot.get('available', True) else 'unavailable')
        return {'available': True, **shot, 'url': final, 'untrusted': True}

    def close(self):
        with self._lock:
            self.closed = True
            self._page = None
