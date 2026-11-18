"""The optional desktop renderer for background agent browsing (V29 AgentBrowser).

AEGIS Desktop keeps a hidden, sandboxed Electron browser (`desktop/agent-browser.cjs`) that can
render JavaScript-heavy pages and take screenshots. It is not reachable from here: Electron opens
an outbound WebSocket to `/api/work/agent-browser/host` on loopback and authenticates with a
random token it writes at start-up (see `token_file`). This module holds that one connection and
turns it into a plain synchronous callable for `agent_browser.register_renderer`:

    call = renderer()            # None while no desktop host is connected
    call('render', url)      ->  {final_url, title, text, links, images} or {blocked, reason, final_url}
    call('screenshot', url)  ->  {png_base64, width, height}

A failed request raises `RendererError` (timeout, busy, disconnected, or the host's error code).
Everything the host returns came from a web page: it is re-checked and capped here, and it stays
untrusted data for whoever uses it.

Protocol (JSON text frames):
    host -> backend   {"type": "hello", "token": "..."}           first frame, within 5 s
    backend -> host   {"type": "ready"}
    backend -> host   {"id": 7, "action": "render", "url": "https://..."}
    host -> backend   {"id": 7, "ok": true, "result": {...}}  |  {"id": 7, "ok": false, "error": "code"}
"""
import asyncio
import concurrent.futures
import hmac
import ipaddress
import itertools
import json
import logging
import os
import re
import threading
from pathlib import Path
from urllib.parse import urlsplit

logger = logging.getLogger(__name__)

TIMEOUT = 20.0
MAX_CONCURRENT = 2
HELLO_TIMEOUT = 5.0
MIN_TOKEN = 32
MAX_URL = 4096
ACTIONS = frozenset({'render', 'screenshot'})
LIMITS = {'title': 1000, 'text': 60000, 'links': 200, 'images': 40, 'href': 2048, 'link_text': 300, 'alt': 300, 'reason': 120, 'png': 12 * 1024 * 1024}
_BASE64 = re.compile(r'^[A-Za-z0-9+/]*={0,2}$')


class RendererError(RuntimeError):
    """The desktop renderer could not answer. The message is a short code, never page content."""


def token_file():
    """Where AEGIS Desktop writes its token: the path it hands the launcher, else its default userData."""
    named = os.environ.get('AEGIS_AGENT_BROWSER_TOKEN_FILE', '').strip()
    if named:
        return Path(named)
    base = os.environ.get('APPDATA') or str(Path.home() / '.config')
    return Path(base) / 'AEGIS' / 'agent-browser.token'


def expected_tokens():
    """Read on every connection, so a desktop app restarted with a new token is accepted without restarting this server."""
    tokens = [os.environ.get('AEGIS_AGENT_BROWSER_TOKEN', '').strip()]
    try:
        tokens.append(token_file().read_text(encoding='utf8').strip())
    except OSError:
        pass
    return [token for token in tokens if len(token) >= MIN_TOKEN]


def token_valid(candidate, tokens):
    if not isinstance(candidate, str) or not candidate:
        return False
    given = candidate.encode('utf8', 'replace')
    # Every token is compared, in constant time, whatever matched first.
    matched = False
    for token in tokens:
        matched |= hmac.compare_digest(given, token.encode('utf8'))
    return matched


def _public_http(url):
    if not isinstance(url, str) or not url or len(url) > MAX_URL:
        return False
    try:
        parts = urlsplit(url)
    except ValueError:
        return False
    if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password:
        return False
    host = parts.hostname.rstrip('.').lower()
    if host == 'localhost' or host.endswith(('.localhost', '.local', '.internal')) or '.' not in host and ':' not in host:
        return False
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return True  # a name; the renderer checks what it resolves to
    return address.is_global


def _text(value, limit):
    return value[:limit] if isinstance(value, str) else ''


def _clean(action, result):
    """Only the expected fields, with the expected types and sizes, leave this module."""
    if not isinstance(result, dict):
        raise RendererError('bad_result')
    if action == 'screenshot':
        data, width, height = result.get('png_base64'), result.get('width'), result.get('height')
        if not isinstance(data, str) or not data or len(data) > LIMITS['png'] or not _BASE64.match(data):
            raise RendererError('bad_result')
        if not all(isinstance(n, int) and not isinstance(n, bool) and 0 < n <= 20000 for n in (width, height)):
            raise RendererError('bad_result')
        return {'png_base64': data, 'width': width, 'height': height}
    final_url = result.get('final_url')
    final_url = final_url if _public_http(final_url) else ''
    if result.get('blocked'):
        return {'blocked': True, 'reason': _text(result.get('reason'), LIMITS['reason']) or 'blocked', 'final_url': final_url}
    links = []
    for row in result.get('links') if isinstance(result.get('links'), list) else []:
        if len(links) >= LIMITS['links']:
            break
        if isinstance(row, dict) and _public_http(row.get('href')) and len(row['href']) <= LIMITS['href']:
            links.append({'href': row['href'], 'text': _text(row.get('text'), LIMITS['link_text'])})
    images = []
    for row in result.get('images') if isinstance(result.get('images'), list) else []:
        if len(images) >= LIMITS['images']:
            break
        if isinstance(row, dict) and _public_http(row.get('src')) and len(row['src']) <= LIMITS['href']:
            images.append({'src': row['src'], 'alt': _text(row.get('alt'), LIMITS['alt'])})
    return {
        'final_url': final_url,
        'title': _text(result.get('title'), LIMITS['title']),
        'text': _text(result.get('text'), LIMITS['text']),
        'links': links,
        'images': images,
    }


class AgentBrowserHost:
    """At most one authenticated desktop host; the newest one replaces an older connection."""

    def __init__(self, *, timeout=TIMEOUT, max_concurrent=MAX_CONCURRENT, tokens=expected_tokens, hello_timeout=HELLO_TIMEOUT):
        self.timeout = float(timeout)
        self.hello_timeout = float(hello_timeout)
        self._tokens = tokens
        self._lock = threading.Lock()
        self._slots = threading.BoundedSemaphore(max_concurrent)
        self._ids = itertools.count(1)
        self._socket = None
        self._loop = None
        self._pending = {}

    # ------------------------------------------------------------ state

    def connected(self):
        with self._lock:
            return self._socket is not None

    def status(self):
        return {'connected': self.connected()}

    def renderer(self):
        """The callable to hand to `agent_browser.register_renderer`, or None while no host is connected."""
        return self.call if self.connected() else None

    # ------------------------------------------------------------ the socket side

    async def serve(self, websocket):
        """Runs one accepted WebSocket until it closes. Rejects it unless the first frame carries the token."""
        try:
            hello = json.loads(await asyncio.wait_for(websocket.receive_text(), self.hello_timeout))
        except Exception:
            await self._close(websocket, 1008)
            return
        if not isinstance(hello, dict) or hello.get('type') != 'hello' or not token_valid(hello.get('token'), self._tokens()):
            logger.warning('[AGENT BROWSER] Refused a desktop renderer without a valid token')
            await self._close(websocket, 1008)
            return
        with self._lock:
            previous, self._socket, self._loop = self._socket, websocket, asyncio.get_running_loop()
        if previous is not None:
            self._fail_pending('host_replaced')
            await self._close(previous, 1000)
        logger.info('[AGENT BROWSER] Desktop renderer connected')
        try:
            await websocket.send_text(json.dumps({'type': 'ready'}))
            while True:
                try:
                    message = json.loads(await websocket.receive_text())
                except (ValueError, TypeError):
                    continue
                if isinstance(message, dict):
                    future = self._pending.get(message.get('id'))
                    if future is not None and not future.done():
                        future.set_result(message)
        except Exception:
            pass
        finally:
            with self._lock:
                current = self._socket is websocket
                if current:
                    self._socket = None
                    self._loop = None
            if current:
                self._fail_pending('host_disconnected')
                logger.info('[AGENT BROWSER] Desktop renderer disconnected')

    def _fail_pending(self, reason):
        for future in list(self._pending.values()):
            if not future.done():
                future.set_exception(RendererError(reason))

    @staticmethod
    async def _close(websocket, code):
        try:
            await websocket.close(code=code)
        except Exception:
            pass

    async def _request(self, websocket, action, url):
        request_id = next(self._ids)
        future = asyncio.get_running_loop().create_future()
        self._pending[request_id] = future
        try:
            await websocket.send_text(json.dumps({'id': request_id, 'action': action, 'url': url}))
            return await asyncio.wait_for(future, self.timeout)
        except asyncio.TimeoutError:
            raise RendererError('timeout') from None
        finally:
            self._pending.pop(request_id, None)

    # ------------------------------------------------------------ the caller side

    def call(self, action, url):
        """Synchronous; call it from a worker thread (asyncio.to_thread), never from the server's event loop."""
        if action not in ACTIONS:
            raise RendererError('unknown_action')
        if not _public_http(url):
            raise RendererError('bad_url')
        if not self._slots.acquire(timeout=self.timeout):
            raise RendererError('busy')
        try:
            with self._lock:
                websocket, loop = self._socket, self._loop
            if websocket is None or loop is None:
                raise RendererError('host_disconnected')
            try:
                running = asyncio.get_running_loop()
            except RuntimeError:
                running = None
            if running is loop:
                raise RendererError('called_on_event_loop')
            pending = asyncio.run_coroutine_threadsafe(self._request(websocket, action, url), loop)
            try:
                reply = pending.result(self.timeout + 2)
            except concurrent.futures.TimeoutError:
                pending.cancel()
                raise RendererError('timeout') from None
        finally:
            self._slots.release()
        if not isinstance(reply, dict):
            raise RendererError('bad_result')
        if reply.get('ok') is not True:
            error = reply.get('error')
            raise RendererError(error[:120] if isinstance(error, str) and error else 'renderer_failed')
        return _clean(action, reply.get('result'))


HOST = AgentBrowserHost()


def renderer():
    return HOST.renderer()


def status():
    return HOST.status()
