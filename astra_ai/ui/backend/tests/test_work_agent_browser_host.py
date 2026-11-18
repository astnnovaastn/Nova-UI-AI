"""The desktop renderer registry, with a fake WebSocket. No Electron, no network."""
import asyncio
import json
import threading
import time
from types import SimpleNamespace

import pytest

from astra_ai.core.work import agent_browser_host as hostmod
from astra_ai.core.work.agent_browser_host import AgentBrowserHost, RendererError
from astra_ai.ui.backend.api.work_agent_browser import local_host_socket

TOKEN = 'k' * 43


class FakeSocket:
    """Frames the host sends are recorded; frames it receives come from a queue the test fills."""

    def __init__(self, loop):
        self.loop = loop
        self.inbox = asyncio.Queue()
        self.sent = []
        self.closed = None
        self.on_send = None

    async def receive_text(self):
        item = await self.inbox.get()
        if item is None:
            raise RuntimeError('disconnected')
        return item

    async def send_text(self, text):
        message = json.loads(text)
        self.sent.append(message)
        if self.on_send:
            self.on_send(message)

    async def close(self, code=1000):
        self.closed = code
        self.inbox.put_nowait(None)

    def push(self, message):
        self.loop.call_soon_threadsafe(self.inbox.put_nowait, message if isinstance(message, str) or message is None else json.dumps(message))


class Server:
    """An event loop on its own thread, like uvicorn's, serving fake sockets."""

    def __init__(self, host):
        self.host = host
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self.loop.run_forever, daemon=True)
        self.thread.start()

    def connect(self, hello=None):
        socket = FakeSocket(self.loop)
        task = asyncio.run_coroutine_threadsafe(self.host.serve(socket), self.loop)
        socket.push(hello if hello is not None else {'type': 'hello', 'token': TOKEN})
        return socket, task

    def stop(self):
        self.loop.call_soon_threadsafe(self.loop.stop)
        self.thread.join(2)


def wait_for(probe, timeout=2.0):
    end = time.time() + timeout
    while time.time() < end:
        if probe():
            return True
        time.sleep(0.01)
    return False


@pytest.fixture
def server():
    created = []

    def make(**options):
        host = AgentBrowserHost(tokens=lambda: [TOKEN], **options)
        created.append(Server(host))
        return created[-1]

    yield make
    for item in created:
        item.stop()


def answer_with(socket, reply):
    """The fake desktop host answers each request with reply(request)."""
    socket.on_send = lambda message: socket.push(reply(message)) if 'id' in message else None


def test_no_renderer_until_an_authenticated_host_connects(server):
    srv = server()
    assert srv.host.renderer() is None
    assert srv.host.status() == {'connected': False}
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    assert socket.sent[0] == {'type': 'ready'}
    assert callable(srv.host.renderer())
    socket.push(None)
    assert wait_for(lambda: not srv.host.connected())
    assert srv.host.renderer() is None


@pytest.mark.parametrize('hello', [{'type': 'hello', 'token': 'wrong' * 10}, {'type': 'hello'}, {'type': 'hello', 'token': TOKEN[:-1]}, {'token': TOKEN}, 'not json'])
def test_bad_or_missing_token_is_refused(server, hello):
    srv = server()
    socket, task = srv.connect(hello)
    task.result(2)
    assert socket.closed == 1008
    assert socket.sent == []
    assert srv.host.status() == {'connected': False}


def test_silent_client_is_dropped_after_the_hello_timeout(server):
    srv = server(hello_timeout=0.1)
    socket = FakeSocket(srv.loop)
    asyncio.run_coroutine_threadsafe(srv.host.serve(socket), srv.loop).result(2)
    assert socket.closed == 1008


def test_render_round_trip_and_untrusted_result_is_cleaned(server):
    srv = server()
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    answer_with(socket, lambda m: {'id': m['id'], 'ok': True, 'result': {
        'final_url': 'https://en.wikipedia.org/wiki/Brutalism', 'title': 'Brutalism', 'text': 'x' * 70000, 'secret': 'dropped',
        'links': [{'href': 'javascript:alert(1)', 'text': 'bad'}, {'href': 'https://a.example/', 'text': 'A' * 900}] + [{'href': f'https://a.example/{i}', 'text': ''} for i in range(300)],
        'images': [{'src': 'file:///C:/x.png', 'alt': ''}, {'src': 'https://a.example/i.png', 'alt': 7}],
    }})
    result = srv.host.renderer()('render', 'https://en.wikipedia.org/wiki/Brutalism')
    request = socket.sent[1]
    assert request['action'] == 'render' and request['url'] == 'https://en.wikipedia.org/wiki/Brutalism' and isinstance(request['id'], int)
    assert set(result) == {'final_url', 'title', 'text', 'links', 'images'}
    assert len(result['text']) == 60000
    assert len(result['links']) == 200 and result['links'][0] == {'href': 'https://a.example/', 'text': 'A' * 300}
    assert result['images'] == [{'src': 'https://a.example/i.png', 'alt': ''}]


def test_blocked_walls_and_screenshots_pass_through_in_their_shape(server):
    srv = server()
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    answer_with(socket, lambda m: {'id': m['id'], 'ok': True, 'result': {'blocked': True, 'reason': 'captcha', 'final_url': 'http://127.0.0.1/', 'text': 'ignored'}} if m['action'] == 'render'
                else {'id': m['id'], 'ok': True, 'result': {'png_base64': 'iVBORw0KGgo=', 'width': 1280, 'height': 900}})
    call = srv.host.renderer()
    assert call('render', 'https://example.com/') == {'blocked': True, 'reason': 'captcha', 'final_url': ''}
    assert call('screenshot', 'https://example.com/') == {'png_base64': 'iVBORw0KGgo=', 'width': 1280, 'height': 900}


@pytest.mark.parametrize('result', [None, {'png_base64': 'not base64!', 'width': 10, 'height': 10}, {'png_base64': 'AAAA', 'width': True, 'height': 10}, {'png_base64': 'AAAA', 'width': 0, 'height': 10}])
def test_malformed_screenshot_is_rejected(server, result):
    srv = server()
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    answer_with(socket, lambda m: {'id': m['id'], 'ok': True, 'result': result})
    with pytest.raises(RendererError, match='bad_result'):
        srv.host.call('screenshot', 'https://example.com/')


def test_host_error_codes_and_bad_requests(server):
    srv = server()
    with pytest.raises(RendererError, match='host_disconnected'):
        srv.host.call('render', 'https://example.com/')
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    answer_with(socket, lambda m: {'id': m['id'], 'ok': False, 'error': 'load_timeout'})
    with pytest.raises(RendererError, match='load_timeout'):
        srv.host.call('render', 'https://example.com/')
    for action, url in [('click', 'https://example.com/'), ('render', 'file:///C:/x'), ('render', 'https://u:p@example.com/'), ('render', 'https://' + 'a' * 5000)]:
        with pytest.raises(RendererError):
            srv.host.call(action, url)
    assert len(socket.sent) == 2


def test_timeout_when_the_host_never_answers(server):
    srv = server(timeout=0.3)
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    started = time.time()
    with pytest.raises(RendererError, match='timeout'):
        srv.host.call('render', 'https://example.com/')
    assert time.time() - started < 2
    assert srv.host._pending == {}


def test_disconnect_fails_requests_in_flight(server):
    srv = server()
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    socket.on_send = lambda message: socket.push(None) if 'id' in message else None
    with pytest.raises(RendererError, match='host_disconnected'):
        srv.host.call('render', 'https://example.com/')
    assert srv.host.renderer() is None


def test_at_most_two_requests_at_once(server):
    srv = server(timeout=1.5)
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)
    held = []
    socket.on_send = lambda message: held.append(message) if 'id' in message else None
    outcomes = []

    def worker():
        try:
            outcomes.append(srv.host.call('render', 'https://example.com/'))
        except RendererError as error:
            outcomes.append(str(error))

    threads = [threading.Thread(target=worker) for _ in range(3)]
    for thread in threads:
        thread.start()
    assert wait_for(lambda: len(held) == 2)
    time.sleep(0.2)
    assert len(held) == 2  # the third waits for a free slot
    for message in held[:2]:
        socket.push({'id': message['id'], 'ok': True, 'result': {'final_url': 'https://example.com/', 'title': 't', 'text': '', 'links': [], 'images': []}})
    assert wait_for(lambda: len(held) == 3)
    socket.push({'id': held[2]['id'], 'ok': True, 'result': {'final_url': 'https://example.com/', 'title': 't', 'text': '', 'links': [], 'images': []}})
    for thread in threads:
        thread.join(3)
    assert len(outcomes) == 3 and all(isinstance(item, dict) for item in outcomes)


def test_newest_authenticated_host_replaces_the_old_one(server):
    srv = server()
    first, _ = srv.connect()
    assert wait_for(srv.host.connected)
    second, _ = srv.connect()
    assert wait_for(lambda: first.closed == 1000)
    assert srv.host.connected()
    answer_with(second, lambda m: {'id': m['id'], 'ok': True, 'result': {'final_url': 'https://example.com/', 'title': 'second', 'text': '', 'links': [], 'images': []}})
    assert srv.host.call('render', 'https://example.com/')['title'] == 'second'


def test_calling_on_the_event_loop_is_refused(server):
    srv = server()
    socket, _ = srv.connect()
    assert wait_for(srv.host.connected)

    async def inside():
        return srv.host.call('render', 'https://example.com/')

    with pytest.raises(RendererError, match='called_on_event_loop'):
        asyncio.run_coroutine_threadsafe(inside(), srv.loop).result(2)


def test_tokens_come_from_env_and_file(tmp_path, monkeypatch):
    file = tmp_path / 'agent-browser.token'
    file.write_text('f' * 43 + '\n', encoding='utf8')
    monkeypatch.setenv('AEGIS_AGENT_BROWSER_TOKEN_FILE', str(file))
    monkeypatch.setenv('AEGIS_AGENT_BROWSER_TOKEN', 'short')
    assert hostmod.expected_tokens() == ['f' * 43]
    monkeypatch.setenv('AEGIS_AGENT_BROWSER_TOKEN', 'e' * 40)
    assert hostmod.expected_tokens() == ['e' * 40, 'f' * 43]
    assert hostmod.token_valid('f' * 43, hostmod.expected_tokens())
    assert not hostmod.token_valid('', hostmod.expected_tokens())
    assert not hostmod.token_valid(None, hostmod.expected_tokens())
    monkeypatch.delenv('AEGIS_AGENT_BROWSER_TOKEN_FILE')
    monkeypatch.setenv('APPDATA', str(tmp_path))
    assert hostmod.token_file() == tmp_path / 'AEGIS' / 'agent-browser.token'


def _ws(host, headers=None):
    return SimpleNamespace(client=SimpleNamespace(host=host) if host else None, headers=headers or {})


def test_host_socket_is_loopback_only_and_not_for_web_pages():
    assert local_host_socket(_ws('127.0.0.1'))
    assert local_host_socket(_ws('::1'))
    assert not local_host_socket(_ws('192.168.1.20'))
    assert not local_host_socket(_ws(None))
    assert not local_host_socket(_ws('127.0.0.1', {'origin': 'http://127.0.0.1:5173'}))
    assert not local_host_socket(_ws('127.0.0.1', {'x-forwarded-for': '203.0.113.9'}))
    assert not local_host_socket(_ws('127.0.0.1', {'x-nova-paired-device': '1'}))
