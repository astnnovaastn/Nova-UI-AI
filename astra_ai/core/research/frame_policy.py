"""Whether a public page allows being shown in another site's frame.

Only the verdict leaves this module: no page content or raw headers. It is not a proxy, the page
itself loads straight from its own site in the visitor's browser, and policies are obeyed, not
bypassed. Private addresses are refused so this cannot be used to probe the local network.
"""
import ipaddress
import re
import socket
import time
from urllib.parse import urljoin, urlsplit

CACHE = {}
CACHE_SECONDS = 600
CACHE_SIZE = 256


def embedding_verdict(headers):
    """(allowed, reason). Content-Security-Policy overrides X-Frame-Options, as in browsers."""
    policies = []
    for name, value in headers:
        if name.lower() == 'content-security-policy':
            policies.append(value)
    for policy in policies:
        for directive in policy.split(';'):
            parts = directive.strip().split()
            if parts and parts[0].lower() == 'frame-ancestors':
                sources = [source.lower() for source in parts[1:]]
                if '*' in sources:
                    continue
                if any(re.fullmatch(r'(https?:)?\*?', source) and source for source in sources):
                    continue
                return False, 'frame_ancestors'
    if any('frame-ancestors' in policy.lower() for policy in policies):
        return True, ''
    for name, value in headers:
        if name.lower() == 'x-frame-options' and value.strip().lower().split(',')[0].strip() in {'deny', 'sameorigin', 'allow-from'}:
            return False, 'x_frame_options'
    return True, ''


def public_address(url):
    """Raises ValueError unless the address is a plain public web address. Returns one resolved IP."""
    parts = urlsplit(url)
    if parts.scheme not in {'http', 'https'} or not parts.hostname or parts.username or parts.password or parts.port not in {None, 80, 443}:
        raise ValueError('invalid_address')
    addresses = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == 'https' else 80), type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(row[4][0]).is_global for row in addresses):
        raise ValueError('non_public_address')
    return addresses[0][4][0]


def _headers_of(url, ip):
    import certifi
    import urllib3
    parts = urlsplit(url)
    port = parts.port or (443 if parts.scheme == 'https' else 80)
    # Connects to the address that was checked, so a second DNS answer cannot reach a private host.
    pool = (urllib3.HTTPSConnectionPool(ip, port=port, assert_hostname=parts.hostname, server_hostname=parts.hostname, cert_reqs='CERT_REQUIRED', ca_certs=certifi.where())
            if parts.scheme == 'https' else urllib3.HTTPConnectionPool(ip, port=port))
    target = (parts.path or '/') + ('?' + parts.query if parts.query else '')
    response = pool.request('GET', target, timeout=urllib3.Timeout(connect=5, read=8), redirect=False, retries=False, preload_content=False,
                            headers={'Host': parts.netloc, 'User-Agent': 'Mozilla/5.0 (compatible; AegisFrameCheck/1.0)', 'Accept': 'text/html,*/*'})
    try:
        return response.status, list(response.headers.items())  # The body is never read.
    finally:
        response.release_conn()
        response.close()


def check_frame(url):
    """{'embeddable': True, False or None, 'reason': ...}. None means it could not be told in advance."""
    cached = CACHE.get(url)
    if cached and time.time() - cached[0] < CACHE_SECONDS:
        return dict(cached[1])
    result = _check(url)
    if len(CACHE) >= CACHE_SIZE:
        CACHE.clear()
    if result.get('reason') not in {'unreachable', 'unchecked'}:
        CACHE[url] = (time.time(), dict(result))
    return result


def _check(url):
    current = url
    try:
        for _ in range(5):
            status, headers = _headers_of(current, public_address(current))
            if status in {301, 302, 303, 307, 308}:
                location = next((value for name, value in headers if name.lower() == 'location'), '')
                if not location:
                    break
                current = urljoin(current, location)
                continue
            allowed, reason = embedding_verdict(headers)
            if not allowed:
                return {'embeddable': False, 'reason': reason}
            # A refusal to a checking client says nothing about a person's browser.
            return {'embeddable': True, 'reason': ''} if status < 400 else {'embeddable': None, 'reason': 'unchecked'}
        return {'embeddable': None, 'reason': 'unchecked'}
    except ValueError as error:
        return {'embeddable': False, 'reason': str(error)}
    except Exception:
        return {'embeddable': None, 'reason': 'unreachable'}
