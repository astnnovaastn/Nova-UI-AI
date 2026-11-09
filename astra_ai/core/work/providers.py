"""Model slots, provider adapters and the guard around every model call.

Keys are read on the server when a call is made. They never enter a run record, an event, a log
line or an exception message: failures carry only a kind such as `http_503` or `rate_limit`.
Fallback goes only to the slot named in AEGIS_WORK_<SLOT>_FALLBACK (or its documented default).
"""
from __future__ import annotations

import hashlib
import json
import logging
import threading
import time
from collections import deque
from dataclasses import dataclass

import requests

from astra_ai.core.research.providers import validate_schema
from astra_ai.core.background_model import ModelUnavailable
from .contracts import ROLE_SLOT, SLOTS

log = logging.getLogger('work.providers')

DEFAULT_MODELS = {
    'worker_a': 'openai/gpt-oss-20b',
    'worker_b': 'openai/gpt-oss-120b',
    'worker_c': 'qwen/qwen3.8-27b',
}
PROVIDER_KEYS = {
    'gemini': ('NOVA_RESEARCH_GEMINI_API_KEY', 'GEMINI_API_KEY'),
    'groq': ('NOVA_RESEARCH_GROQ_API_KEY', 'GROQ_API_KEY'),
    'openai': ('NOVA_RESEARCH_OPENAI_API_KEY', 'OPENAI_API_KEY'),
}
#: What each provider's models can do, as far as AEGIS relies on it. Discovery confirms availability.
PROVIDER_CAPABILITIES = {
    'gemini': {'context_tokens': 1000000, 'output_tokens': 16000, 'structured': True, 'tokens_per_minute': 0},
    'groq': {'context_tokens': 131072, 'output_tokens': 8000, 'structured': True, 'tokens_per_minute': 7200},
    'openai': {'context_tokens': 400000, 'output_tokens': 16000, 'structured': True, 'tokens_per_minute': 0},
}
RETRYABLE = {'rate_limit', 'timeout', 'transport', 'http_408', 'http_500', 'http_502', 'http_503', 'http_504'}
BREAKER_FAILURES = 3
BREAKER_SECONDS = 90


class ProviderError(Exception):
    def __init__(self, kind, retry_after=0.0):
        super().__init__(kind)
        self.kind = kind
        self.retry_after = retry_after


class WorkPaused(Exception):
    """Every usable model is limited for longer than a run should hold its job slot."""
    def __init__(self, until, reason):
        super().__init__(reason)
        self.until = until
        self.reason = reason


class BudgetExhausted(Exception):
    def __init__(self, what):
        super().__init__(what)
        self.what = what


@dataclass(frozen=True)
class ModelSlot:
    slot: str
    provider: str
    model: str
    key: str
    fallback: str = ''
    tokens_per_minute: int = 0
    price_per_million: float | None = None

    @property
    def key_marker(self):
        return hashlib.sha256(self.key.encode()).hexdigest()[:16]


def _number(text, default):
    try:
        return float(text)
    except (TypeError, ValueError):
        return default


def load_slots(settings):
    """The configured slots. A slot without a usable provider and key is simply absent."""
    found = {}
    for slot in SLOTS:
        prefix = 'AEGIS_WORK_' + slot.upper() + '_'
        provider = (settings(prefix + 'PROVIDER') or '').strip().lower()
        if slot == 'lead' and not provider:
            provider = (settings('NOVA_RESEARCH_PROVIDER') or 'gemini').strip().lower()
        elif not provider and any(settings(name) for name in PROVIDER_KEYS['groq']):
            provider = 'groq'
        if provider not in PROVIDER_KEYS:
            continue
        key = settings(prefix + 'API_KEY') or next((settings(name) for name in PROVIDER_KEYS[provider] if settings(name)), '')
        if not key:
            continue
        model = (settings(prefix + 'MODEL') or '').strip()
        if not model:
            if slot == 'lead':
                research = 'NOVA_RESEARCH_GEMINI_MODEL' if provider == 'gemini' else 'NOVA_RESEARCH_OPENAI_MODEL' if provider == 'openai' else ''
                model = (settings(research) if research else '') or (settings('GEMINI_TEXT_MODEL') if provider == 'gemini' else '') or DEFAULT_MODELS['worker_b']
            else:
                model = DEFAULT_MODELS[slot] if provider == 'groq' else ''
        if not model:
            continue
        fallback = (settings(prefix + 'FALLBACK') or ('worker_b' if slot == 'lead' else 'lead')).strip().lower()
        limit = _number(settings(prefix + 'TOKENS_PER_MINUTE'), PROVIDER_CAPABILITIES[provider]['tokens_per_minute'])
        price = _number(settings(prefix + 'PRICE_PER_MILLION'), None)
        found[slot] = ModelSlot(slot, provider, model, key, '' if fallback == 'none' else fallback, int(limit), price)
    return found


def estimate_tokens(*values):
    """Deliberately generous, so limits are met before the provider enforces them."""
    return sum(len(json.dumps(value, ensure_ascii=False).encode('utf-8')) for value in values) // 3 + 64


class OpenAICompatibleAdapter:
    """Groq and OpenAI. Both take chat completions with a strict JSON schema."""
    BASE = {'groq': 'https://api.groq.com/openai/v1', 'openai': 'https://api.openai.com/v1'}

    def __init__(self, transport=requests):
        self.transport = transport

    def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
        body = {
            'model': slot.model,
            'messages': [
                {'role': 'system', 'content': instruction},
                {'role': 'user', 'content': json.dumps(payload, ensure_ascii=False)},
            ],
            'response_format': {'type': 'json_schema', 'json_schema': {'name': 'work_answer', 'strict': True, 'schema': schema}},
            'max_completion_tokens': max_tokens,
        }
        if slot.model.startswith('openai/gpt-oss'):
            body['reasoning_effort'] = 'low'
        try:
            response = self.transport.post(self.BASE[slot.provider] + '/chat/completions', headers={'Authorization': 'Bearer ' + slot.key}, json=body, timeout=(10, timeout), allow_redirects=False)
        except requests.Timeout:
            raise ProviderError('timeout') from None
        except requests.RequestException:
            raise ProviderError('transport') from None
        _raise_for_status(response)
        try:
            data = response.json()
            choice = data['choices'][0]
            if choice.get('finish_reason') == 'length':
                raise ProviderError('output_limit')
            message = choice['message']
            if message.get('refusal'):
                raise ProviderError('refused')
            return message.get('content') or '', int(data.get('usage', {}).get('total_tokens') or 0)
        except (ValueError, KeyError, IndexError, TypeError):
            raise ProviderError('invalid_response') from None


class GeminiAdapter:
    BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

    def __init__(self, transport=requests):
        self.transport = transport

    def complete(self, slot, instruction, payload, schema, max_tokens, timeout):
        config = {'responseMimeType': 'application/json', 'responseJsonSchema': schema, 'maxOutputTokens': max_tokens}
        if '2.5' in slot.model:
            config['thinkingConfig'] = {'thinkingBudget': 0}
        elif slot.model.startswith('gemini-3') or slot.model == 'gemini-flash-latest':
            config['thinkingConfig'] = {'thinkingLevel': 'low'}
        body = {
            'systemInstruction': {'parts': [{'text': instruction}]},
            'contents': [{'role': 'user', 'parts': [{'text': json.dumps(payload, ensure_ascii=False)}]}],
            'generationConfig': config,
        }
        try:
            response = self.transport.post(self.BASE + slot.model + ':generateContent', headers={'x-goog-api-key': slot.key}, json=body, timeout=(10, timeout), allow_redirects=False)
        except requests.Timeout:
            raise ProviderError('timeout') from None
        except requests.RequestException:
            raise ProviderError('transport') from None
        _raise_for_status(response)
        try:
            data = response.json()
            candidates = data.get('candidates') or []
            if not candidates:
                raise ProviderError('refused')
            finish = candidates[0].get('finishReason', '')
            if finish == 'MAX_TOKENS':
                raise ProviderError('output_limit')
            if finish in {'SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'}:
                raise ProviderError('refused')
            text = ''.join(part.get('text', '') for part in candidates[0]['content']['parts'])
            return text, int(data.get('usageMetadata', {}).get('totalTokenCount') or 0)
        except (ValueError, KeyError, IndexError, TypeError):
            raise ProviderError('invalid_response') from None


def _raise_for_status(response):
    code = response.status_code
    if code == 200:
        return
    if code == 429:
        raise ProviderError('rate_limit', _number(response.headers.get('retry-after'), 20))
    if code in {401, 403}:
        raise ProviderError('authentication')
    if code == 404:
        raise ProviderError('model_unavailable')
    if code == 400:
        raise ProviderError('invalid_request')
    raise ProviderError('http_' + str(code))


class ProviderGuard:
    """Shared by all runs: a per-key token window, a circuit breaker and measured latency."""

    def __init__(self, clock=time.monotonic, sleep=time.sleep):
        self.lock = threading.Lock()
        self.clock = clock
        self.sleep = sleep
        self.windows = {}
        self.failures = {}
        self.open_until = {}
        self.latency = {}

    def _id(self, slot):
        # Groq's token limit is per model on a key (read from its x-ratelimit headers), so the
        # window is too. A circuit follows the model, whichever slot uses it.
        return slot.provider + ':' + slot.key_marker + ':' + slot.model, slot.provider + ':' + slot.model

    def available(self, slot):
        with self.lock:
            return self.open_until.get(self._id(slot)[1], 0) <= self.clock()

    def reserve(self, slot, tokens, patience=25.0):
        """Waits briefly for room in the provider's token window, then reports the limit."""
        if not slot.tokens_per_minute:
            return None
        quota = self._id(slot)[0]
        deadline = self.clock() + patience
        while True:
            with self.lock:
                now = self.clock()
                window = self.windows.setdefault(quota, deque())
                while window and now - window[0][0] >= 60:
                    window.popleft()
                used = sum(row[1] for row in window)
                if not window or used + tokens <= slot.tokens_per_minute:
                    row = [now, tokens]
                    window.append(row)
                    return row
                wait = 60 - (now - window[0][0])
            if self.clock() + wait > deadline:
                raise ProviderError('rate_limit', wait)
            self.sleep(min(wait, 2.0))

    def spent(self, row, tokens):
        """Replaces a reservation's estimate with what the provider reports it used."""
        if row is not None and tokens:
            with self.lock:
                row[1] = tokens

    def settle(self, slot, ok, seconds=0.0):
        identity = self._id(slot)[1]
        with self.lock:
            if ok:
                self.failures[identity] = 0
                self.open_until.pop(identity, None)
                previous = self.latency.get(identity)
                self.latency[identity] = seconds if previous is None else previous * 0.7 + seconds * 0.3
                return
            self.failures[identity] = self.failures.get(identity, 0) + 1
            if self.failures[identity] >= BREAKER_FAILURES:
                self.open_until[identity] = self.clock() + BREAKER_SECONDS

    def status(self, slot):
        identity = self._id(slot)[1]
        with self.lock:
            until = self.open_until.get(identity, 0)
            return {
                'circuit': 'open' if until > self.clock() else 'closed',
                'failures': self.failures.get(identity, 0),
                'latency_seconds': round(self.latency[identity], 1) if identity in self.latency else None,
            }


class ModelRouter:
    """Chooses a slot for a role and makes guarded, retried, validated calls."""

    def __init__(self, settings, guard=None, adapters=None, sleep=time.sleep):
        self.settings = settings
        self.guard = guard or ProviderGuard()
        compatible = OpenAICompatibleAdapter()
        self.adapters = adapters or {'groq': compatible, 'openai': compatible, 'gemini': GeminiAdapter()}
        self.sleep = sleep

    def slots(self):
        return load_slots(self.settings)

    def route(self, role):
        """The role's own slot when healthy, else any other healthy worker, else the lead."""
        slots = self.slots()
        wanted = ROLE_SLOT.get(role, role)
        order = [wanted, *[name for name in ('worker_b', 'worker_c', 'worker_a') if name != wanted], 'lead']
        for name in order:
            slot = slots.get(name)
            if slot and self.guard.available(slot):
                return slot
        return slots.get(wanted) or slots.get('lead')

    def call(self, slot, instruction, payload, schema, max_tokens=1600, timeout=150, attempts=3, admit=None):
        """Returns (result, record). `record` holds what was actually spent, for the run's usage.

        `admit(slot)` is the run's model cap: it says whether this slot's model may be used, and
        reserves it when it may. A slot it refuses is passed over for its fallback, then for any
        slot whose model the run already uses, so a fallback never adds a model past the cap.
        """
        tried = []
        current = slot
        slots = self.slots()
        pause = 0.0
        last = ProviderError('not_configured')
        capped = False
        while True:
            if not current or current.slot in tried:
                if not capped or admit is None:
                    break
                # The chain ran into the cap: finish on a model the run has already admitted.
                current = next((row for name in ('lead', 'worker_b', 'worker_c', 'worker_a') if (row := slots.get(name)) and row.slot not in tried and self.guard.available(row) and admit(row, False)), None)
                capped = False
                if not current:
                    last = ProviderError('model_cap')
                    break
            if admit is not None and not admit(current, True):
                tried.append(current.slot)
                capped = True
                log.info('work_model_cap slot=%s', current.slot)
                current = slots.get(current.fallback)
                continue
            tried.append(current.slot)
            try:
                result, record = self._attempts(current, instruction, payload, schema, max_tokens, timeout, attempts)
                record['fell_back_from'] = tried[0] if len(tried) > 1 else ''
                return result, record
            except ProviderError as error:
                last = error
                if error.kind == 'rate_limit':
                    pause = max(pause, error.retry_after or 20)
                log.warning('work_model_failed slot=%s provider=%s kind=%s', current.slot, current.provider, error.kind)
                current = slots.get(current.fallback)
        if pause and last.kind in RETRYABLE:
            raise WorkPaused(time.time() + max(pause, 5), 'work_rate_limited')
        raise last

    def _attempts(self, slot, instruction, payload, schema, max_tokens, timeout, attempts):
        if not self.guard.available(slot):
            raise ProviderError('circuit_open')
        capability = PROVIDER_CAPABILITIES[slot.provider]
        max_tokens = min(max_tokens, capability['output_tokens'])
        estimate = estimate_tokens(instruction, payload, schema) + max_tokens
        if estimate > capability['context_tokens']:
            raise ProviderError('context_limit')
        adapter = self.adapters[slot.provider]
        tokens_spent = 0
        for attempt in range(attempts):
            if attempt:
                self.sleep(min(20, (2 ** attempt) if not error.retry_after else error.retry_after))
            started = time.monotonic()
            try:
                reservation = self.guard.reserve(slot, estimate)
                text, used = adapter.complete(slot, instruction, payload, schema, max_tokens, timeout)
                self.guard.spent(reservation, used)
                tokens_spent += used
                result = json.loads(text)
                if not isinstance(result, dict):
                    raise ProviderError('invalid_response')
                try:
                    validate_schema(result, schema)
                except ModelUnavailable:
                    raise ProviderError('invalid_response') from None
                seconds = time.monotonic() - started
                self.guard.settle(slot, True, seconds)
                return result, {'slot': slot.slot, 'provider': slot.provider, 'model': slot.model, 'tokens': tokens_spent or estimate, 'measured': bool(tokens_spent), 'seconds': round(seconds, 1), 'attempts': attempt + 1}
            except ValueError:
                error = ProviderError('invalid_response')
            except ProviderError as failure:
                error = failure
            self.guard.settle(slot, False)
            retry = error.kind in RETRYABLE or error.kind in {'invalid_response', 'invalid_request'}
            if not retry or attempt == attempts - 1 or error.retry_after > 20:
                raise error
        raise error

    def status(self):
        rows = []
        slots = self.slots()
        for name in SLOTS:
            slot = slots.get(name)
            rows.append({'slot': name, 'configured': bool(slot), **({'provider': slot.provider, 'model': slot.model, 'fallback': slot.fallback, **self.guard.status(slot), 'key_source': 'slot' if self.settings('AEGIS_WORK_' + name.upper() + '_API_KEY') else 'shared'} if slot else {})})
        return rows

    def discover(self):
        """Asks each configured provider which of its slot's models exist. Reports no keys."""
        report = []
        for slot in self.slots().values():
            try:
                if slot.provider == 'gemini':
                    response = requests.get(GeminiAdapter.BASE.rstrip('/') + '/' + slot.model, headers={'x-goog-api-key': slot.key}, timeout=(5, 15), allow_redirects=False)
                else:
                    response = requests.get(OpenAICompatibleAdapter.BASE[slot.provider] + '/models/' + slot.model, headers={'Authorization': 'Bearer ' + slot.key}, timeout=(5, 15), allow_redirects=False)
                report.append({'slot': slot.slot, 'provider': slot.provider, 'model': slot.model, 'available': response.status_code == 200, 'http_status': response.status_code})
            except requests.RequestException:
                report.append({'slot': slot.slot, 'provider': slot.provider, 'model': slot.model, 'available': False, 'reason': 'connection_failed'})
        return report
