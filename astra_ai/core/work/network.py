"""The source browser's network: an optional manual proxy, and the Source Reader.

Proxy: off, or a manual HTTP, HTTPS or SOCKS5 proxy with optional credentials. It applies to what the
AEGIS backend itself fetches for the browser (the Source Reader and its proxy test), and it says so.
A live page in the browser pane loads in the person's own browser, which the backend cannot route:
that is reported plainly, never claimed. The password is stored server-side only and is never
returned. Targets must be public web addresses (no loopback, private or metadata ranges), so the
reader and the proxy test cannot probe the local network; the proxy endpoint itself may be local.

Source Reader: a page fetched once, server-side, with redirects re-checked, read to clean text and
links. Page content is data, sanitized; it is never instructions and never runs.
"""
from __future__ import annotations

import ipaddress
import json
import re
import threading
import time
from pathlib import Path
from urllib.parse import urljoin, urlsplit

MODES = ('off', 'http', 'https', 'socks5')
HOST = re.compile(r'(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*', re.I)
# A connectivity-check page: tiny, public, no content. (www.example.com resets connections on some networks.)
TEST_URL = 'https://www.gstatic.com/generate_204'
MAX_PAGE_BYTES = 3_000_000
READER_CHARS = 120_000


class NetworkError(ValueError):
    pass


class ProxySettings:
    def __init__(self, root):
        self.path = Path(root) / 'work' / 'network.json'
        self.lock = threading.Lock()

    def _read(self):
        try:
            return json.loads(self.path.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return {'mode': 'off'}

    def public(self):
        """The settings as the frontend may see them: never the password."""
        data = self._read()
        return {'mode': data.get('mode', 'off'), 'host': data.get('host', ''), 'port': data.get('port') or None,
                'username': data.get('username', ''), 'has_password': bool(data.get('password')),
                'remote_dns': bool(data.get('remote_dns', True)), 'last_test': data.get('last_test'),
                'applies_to': ['Source Reader', 'Proxy test'],
                'not_applied_to': 'Live pages in the browser pane load in your own browser, which uses its own network settings.'}

    def save(self, body):
        mode = str(body.get('mode', 'off'))
        if mode not in MODES:
            raise NetworkError('mode')
        current = self._read()
        if mode == 'off':
            data = {'mode': 'off'}
        else:
            host = str(body.get('host', '')).strip().strip('[]')
            try:
                ipaddress.ip_address(host)
            except ValueError:
                if not HOST.fullmatch(host):
                    raise NetworkError('host') from None
            try:
                port = int(body.get('port'))
            except (TypeError, ValueError):
                raise NetworkError('port') from None
            if not 0 < port < 65536:
                raise NetworkError('port')
            username = str(body.get('username', ''))[:200]
            if any(c in username for c in ':@/\r\n'):
                raise NetworkError('username')
            password = body.get('password')
            if password is None:  # Unchanged: keep the stored one for the same proxy.
                password = current.get('password', '') if current.get('host') == host and current.get('username') == username else ''
            password = str(password)[:500]
            data = {'mode': mode, 'host': host, 'port': port, 'username': username, 'password': password,
                    'remote_dns': bool(body.get('remote_dns', True))}
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(data), encoding='utf-8')
        return self.public()

    def proxies(self):
        """requests' proxies mapping, or None when off."""
        data = self._read()
        if data.get('mode', 'off') == 'off':
            return None
        from urllib.parse import quote
        auth = ''
        if data.get('username'):
            auth = quote(data['username'], safe='') + (':' + quote(data.get('password', ''), safe='') if data.get('password') else '') + '@'
        host = data['host'] if ':' not in data['host'] else '[' + data['host'] + ']'
        scheme = {'http': 'http', 'https': 'https', 'socks5': 'socks5h' if data.get('remote_dns', True) else 'socks5'}[data['mode']]
        url = f'{scheme}://{auth}{host}:{data["port"]}'
        return {'http': url, 'https': url}

    def record_test(self, outcome):
        with self.lock:
            data = self._read()
            data['last_test'] = outcome
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(data), encoding='utf-8')


def public_target(url):
    """Raises NetworkError unless the address is a plain public http(s) address."""
    from astra_ai.core.research.frame_policy import public_address
    try:
        public_address(url)
    except ValueError as error:
        raise NetworkError(str(error)) from None
    except OSError:
        raise NetworkError('unresolvable') from None


def _local_name(host):
    if not host or host == 'localhost' or host.endswith(('.localhost', '.local', '.internal', '.lan', '.home.arpa')) or '.' not in host:
        return True
    try:
        return not ipaddress.ip_address(host).is_global
    except ValueError:
        return False


def _get(url, proxies, transport=None):
    """One page, following at most five redirects, each re-checked as public. Returns (final_url, response)."""
    import requests
    transport = transport or requests
    current = url
    for _ in range(6):
        try:
            public_target(current)
        except NetworkError as error:
            # Behind a proxy that resolves names itself, a public name may not resolve here; a literal
            # private address or a local name is still refused.
            host = (urlsplit(current).hostname or '').lower()
            if not (proxies and str(error) == 'unresolvable' and urlsplit(current).scheme in {'http', 'https'} and not _local_name(host)):
                raise
        response = None
        response = transport.get(current, proxies=proxies, timeout=(6, 15), allow_redirects=False, stream=True,
                                 headers={'User-Agent': 'Mozilla/5.0 (compatible; AegisSourceReader/1.0)', 'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'})
        if response.status_code in {301, 302, 303, 307, 308} and response.headers.get('location'):
            current = urljoin(current, response.headers['location'])
            response.close()
            continue
        return current, response
    raise NetworkError('too_many_redirects')


def test_proxy(settings: ProxySettings, transport=None):
    """A real request through the configured proxy to a fixed public page; the outcome is stored and returned."""
    proxies = settings.proxies()
    if not proxies:
        return {'ok': False, 'reason': 'proxy_off'}
    started = time.time()
    try:
        _, response = _get(TEST_URL, proxies, transport)
        status = response.status_code
        response.close()
        outcome = {'ok': 200 <= status < 400, 'status': status, 'ms': round((time.time() - started) * 1000), 'at': round(time.time()), 'target': TEST_URL,
                   'reason': '' if 200 <= status < 400 else 'http_' + str(status)}
    except NetworkError as error:
        outcome = {'ok': False, 'reason': str(error), 'at': round(time.time())}
    except Exception as error:  # Messages may hold the proxy address or credentials: only the type leaves.
        outcome = {'ok': False, 'reason': type(error).__name__, 'at': round(time.time())}
    settings.record_test(outcome)
    return outcome


def reader_page(url, settings: ProxySettings | None = None, transport=None):
    """The page as the Source Reader shows it: title, site, clean sanitized HTML and its links."""
    import bleach
    from bs4 import BeautifulSoup
    proxies = settings.proxies() if settings else None
    final, response = _get(url, proxies, transport)
    try:
        kind = response.headers.get('content-type', '')
        if response.status_code >= 400:
            raise NetworkError('http_' + str(response.status_code))
        if 'html' not in kind and 'text/plain' not in kind:
            raise NetworkError('not_a_page')
        body = b''
        for chunk in response.iter_content(65536):
            body += chunk
            if len(body) > MAX_PAGE_BYTES:
                break
    finally:
        response.close()
    text = body.decode(response.encoding or 'utf-8', errors='replace')
    soup = BeautifulSoup(text, 'html.parser')
    title = (soup.title.get_text(' ', strip=True) if soup.title else '') or urlsplit(final).hostname or final
    for tag in soup(['script', 'style', 'noscript', 'iframe', 'form', 'nav', 'footer', 'header', 'aside', 'svg', 'button', 'input']):
        tag.decompose()
    main = soup.find('article') or soup.find('main') or soup.body or soup
    for link in main.find_all('a', href=True):
        link['href'] = urljoin(final, link['href'])
    html = bleach.clean(str(main), tags={'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br'},
                        attributes={'a': ['href']}, protocols={'http', 'https'}, strip=True)
    html = re.sub(r'(\s*<br>\s*){3,}', '<br><br>', html)[:READER_CHARS]
    html = re.sub(r'<a href=', '<a rel="noopener noreferrer" target="_blank" href=', html)
    words = len(BeautifulSoup(html, 'html.parser').get_text(' ').split())
    return {'status': 'ok', 'url': url, 'final_url': final, 'site': (urlsplit(final).hostname or '').removeprefix('www.'),
            'title': title[:300], 'html': html, 'words': words, 'via_proxy': bool(proxies), 'retrieved_at': round(time.time())}
