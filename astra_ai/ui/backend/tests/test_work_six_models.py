"""Six model slots, the NVIDIA NIM adapter and role routing (2026-11-10)."""
import json

from astra_ai.core.work.contracts import SLOTS
from astra_ai.core.work.orchestrator import MAX_MODELS
from astra_ai.core.work.providers import ModelRouter, OpenAICompatibleAdapter, load_slots

SIX = {
    'NOVA_RESEARCH_PROVIDER': 'gemini', 'GEMINI_API_KEY': 'g-key', 'GROQ_API_KEY': 'q-key', 'NVIDIA_API_KEY': 'n-key',
    'NOVA_RESEARCH_GEMINI_MODEL': 'gemini-lead',
    'AEGIS_WORK_WORKER_A_PROVIDER': 'groq', 'AEGIS_WORK_WORKER_A_MODEL': 'small',
    'AEGIS_WORK_WORKER_B_PROVIDER': 'groq', 'AEGIS_WORK_WORKER_B_MODEL': 'big',
    'AEGIS_WORK_WORKER_C_PROVIDER': 'nvidia', 'AEGIS_WORK_WORKER_C_MODEL': 'nv-ultra', 'AEGIS_WORK_WORKER_C_FALLBACK': 'worker_d',
    'AEGIS_WORK_WORKER_D_PROVIDER': 'nvidia', 'AEGIS_WORK_WORKER_D_MODEL': 'nv-vl',
    'AEGIS_WORK_WORKER_E_PROVIDER': 'gemini', 'AEGIS_WORK_WORKER_E_MODEL': 'gemini-writer',
}


def settings(env):
    return lambda name: env.get(name, '')


def test_six_slots_load_from_configuration_and_cap_is_six():
    assert MAX_MODELS == 6 and len(SLOTS) == 6
    slots = load_slots(settings(SIX))
    assert {name: (row.provider, row.model) for name, row in slots.items()} == {
        'lead': ('gemini', 'gemini-lead'), 'worker_a': ('groq', 'small'), 'worker_b': ('groq', 'big'),
        'worker_c': ('nvidia', 'nv-ultra'), 'worker_d': ('nvidia', 'nv-vl'), 'worker_e': ('gemini', 'gemini-writer'),
    }
    assert slots['worker_c'].fallback == 'worker_d'


def test_unconfigured_extra_slots_stay_absent():
    """worker_d and worker_e have no Groq default, so an old .env keeps exactly four slots."""
    env = {key: value for key, value in SIX.items() if 'WORKER_D' not in key and 'WORKER_E' not in key}
    assert 'worker_d' not in load_slots(settings(env)) and 'worker_e' not in load_slots(settings(env))


def test_nvidia_requests_use_nim_base_max_tokens_and_strict_schema():
    sent = {}

    class Response:
        status_code = 200
        headers = {}

        def json(self):
            return {'choices': [{'finish_reason': 'stop', 'message': {'content': '{"ok": true}'}}], 'usage': {'total_tokens': 9}}

    class Transport:
        def post(self, url, headers, json, timeout, allow_redirects):
            sent.update(url=url, headers=headers, body=json)
            return Response()

    slot = load_slots(settings(SIX))['worker_c']
    text, tokens = OpenAICompatibleAdapter(Transport()).complete(slot, 'sys', {'a': 1}, {'type': 'object'}, 500, 30)
    assert json.loads(text) == {'ok': True} and tokens == 9
    assert sent['url'] == 'https://integrate.api.nvidia.com/v1/chat/completions'
    assert sent['body']['max_tokens'] == 500 and 'max_completion_tokens' not in sent['body']
    assert sent['body']['response_format']['type'] == 'json_schema'
    assert sent['headers']['Authorization'] == 'Bearer n-key'


def test_routing_by_role_and_synthesis_falls_back_only_to_the_lead():
    router = ModelRouter(settings(SIX))
    assert [router.route(role).slot for role in ('discovery', 'analysis', 'verification', 'synthesis', 'lead')] == ['worker_a', 'worker_b', 'worker_c', 'worker_e', 'lead']
    for _ in range(3):
        router.guard.settle(router.slots()['worker_e'], False)
    assert router.route('synthesis').slot == 'lead'


def test_router_status_lists_six_slots_without_keys():
    rows = ModelRouter(settings(SIX)).status()
    assert [row['slot'] for row in rows] == list(SLOTS)
    assert 'n-key' not in json.dumps(rows) and 'g-key' not in json.dumps(rows)


class Recorder:
    def __init__(self):
        self.body = None

    def post(self, url, headers, json, timeout, allow_redirects):
        self.body = json

        class Response:
            status_code = 200
            headers = {}

            def json(self):
                return {'choices': [{'finish_reason': 'stop', 'message': {'content': '{}'}}], 'usage': {'total_tokens': 1}}
        return Response()


def test_nvidia_reasoning_is_off_by_default_and_a_number_is_a_reasoning_budget():
    """Left on, Nemotron spent a 2,400-token allowance on reasoning and returned no answer (2026-11-10)."""
    transport = Recorder()
    adapter = OpenAICompatibleAdapter(transport)
    adapter.complete(load_slots(settings(SIX))['worker_d'], 's', {}, {'type': 'object'}, 2000, 30)
    assert transport.body['chat_template_kwargs'] == {'enable_thinking': False} and transport.body['max_tokens'] == 2000
    adapter.complete(load_slots(settings({**SIX, 'AEGIS_WORK_WORKER_C_THINKING': '512'}))['worker_c'], 's', {}, {'type': 'object'}, 2000, 30)
    assert transport.body['nvext'] == {'max_thinking_tokens': 512} and transport.body['max_tokens'] == 2512
    assert 'chat_template_kwargs' not in transport.body
    adapter.complete(load_slots(settings(SIX))['worker_b'], 's', {}, {'type': 'object'}, 2000, 30)
    assert 'chat_template_kwargs' not in transport.body and 'nvext' not in transport.body


def test_a_chain_that_only_meets_busy_providers_pauses_instead_of_failing():
    import pytest
    from astra_ai.core.work.providers import ProviderError, WorkPaused

    class Busy:
        def complete(self, *args):
            raise ProviderError('http_503')
    router = ModelRouter(settings(SIX), adapters={name: Busy() for name in ('groq', 'gemini', 'nvidia', 'openai')}, sleep=lambda _s: None)
    with pytest.raises(WorkPaused) as paused:
        router.call(router.slots()['worker_e'], 'i', {}, {'type': 'object'})
    assert paused.value.reason == 'work_provider_unavailable'

    class Refused:
        def complete(self, *args):
            raise ProviderError('authentication')
    router = ModelRouter(settings(SIX), adapters={name: Refused() for name in ('groq', 'gemini', 'nvidia', 'openai')}, sleep=lambda _s: None)
    with pytest.raises(ProviderError):
        router.call(router.slots()['worker_e'], 'i', {}, {'type': 'object'})
