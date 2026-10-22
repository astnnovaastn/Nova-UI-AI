import hashlib
from datetime import datetime, timezone

import pytest

from astra_ai.core.background_budget import BackgroundBudget, BudgetPaused
from astra_ai.memory.shared_memory import atomic


def test_model_quota_does_not_block_another_model_or_erase_the_original_wait(tmp_path):
    budget = BackgroundBudget(tmp_path / 'budget.json', min_interval=0)
    budget.provider_model = 'gemini-3.8-flash'
    until = 4_000_000_000
    budget.provider_pause(until, 'gemini_daily_quota', 'private-key', 'gemini-3.8-flash')
    with pytest.raises(BudgetPaused, match='gemini_daily_quota'):
        with budget.lease(10, provider_key='private-key'):
            pytest.fail('A blocked model must never get a writing lease')
    with budget.lease(100, provider_key='private-key', provider_model='gemini-3.6-flash') as reservation:
        reservation.settle(70)
    restarted = BackgroundBudget(budget.path, min_interval=0)
    assert restarted.snapshot('private-key', 'gemini-3.8-flash')['next_attempt'] == until
    available = restarted.snapshot('private-key', 'gemini-3.6-flash')
    assert available['pause_reason'] != 'gemini_daily_quota'
    assert (available['requests'], available['tokens']) == (1, 70)
    assert 'private-key' not in budget.path.read_text()


def test_short_pause_and_shared_pacing_do_not_inherit_another_models_daily_wait(tmp_path, monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr('astra_ai.core.background_budget.time.time', lambda: clock[0])
    budget = BackgroundBudget(tmp_path / 'budget.json', min_interval=15)
    budget.provider_pause(5000, 'gemini_daily_quota', 'key', 'model-a')
    with budget.lease(10, provider_key='key', provider_model='model-b'):
        pass
    with pytest.raises(BudgetPaused, match='background_request_interval'):
        with budget.lease(10, provider_key='key', provider_model='model-c'):
            pass
    budget.provider_pause(1065, 'gemini_rate_limit', 'key', 'model-b')
    assert budget.snapshot('key', 'model-a')['next_attempt'] == 5000
    assert budget.snapshot('key', 'model-b')['next_attempt'] == 1065
    clock[0] = 1066
    with budget.lease(10, provider_key='key', provider_model='model-b'):
        pass
    assert budget.snapshot()['requests'] == 2


def test_legacy_pause_binding_backs_up_and_preserves_usage_and_allowances(tmp_path):
    budget = BackgroundBudget(tmp_path / 'budget.json', min_interval=0)
    marker = hashlib.sha256(b'key').hexdigest()
    original = {'day': datetime.now(timezone.utc).date().isoformat(), 'requests': 48, 'tokens': 561531,
                'next_attempt': 4_000_000_000, 'pause_reason': 'gemini_daily_quota', 'provider_marker': marker,
                'provider_pauses': {marker: {'until': 4_000_000_000, 'reason': 'gemini_daily_quota'}},
                'research_allowances': {'report': {'extra_requests': 1, 'used': 0}}}
    atomic(budget.path, original)
    assert budget.scope_legacy_provider_pause('key', 'gemini-3.8-flash')
    assert not budget.scope_legacy_provider_pause('key', 'gemini-3.6-flash')
    result = budget.snapshot('key', 'gemini-3.6-flash')
    assert result['next_attempt'] == 0 and result['pause_reason'] == ''
    assert (result['requests'], result['tokens']) == (48, 561531)
    assert result['research_allowances'] == original['research_allowances']
    assert budget.path.with_suffix('.before-model-quota.bak').exists()
    assert budget.snapshot('key', 'gemini-3.8-flash')['next_attempt'] == original['next_attempt']


@pytest.mark.parametrize('code',[500,502,503,504])
def test_rejected_writes_release_unused_tokens_but_uncertain_timeouts_remain_reserved(tmp_path,code):
    from astra_ai.core.research_model import GeminiResearchModel,ResearchModelUnavailable
    class Failure(Exception):
        pass
    failure=Failure();failure.code=code
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):raise failure
        def close(self):pass
    budget=BackgroundBudget(tmp_path/'budget.json',min_interval=0)
    model=GeminiResearchModel(lambda:'key',budget,lambda:'gemini-3.6-flash',Client)
    with pytest.raises(ResearchModelUnavailable):model._structured_once('Write',{'query':'Subject'}, {},1000,'key','gemini-3.6-flash')
    usage=budget.snapshot()
    assert usage['requests']==1
    assert (usage['tokens']==0)==(code!=504)


def test_checkpoint_repair_output_bound_is_not_silently_doubled(tmp_path):
    from types import SimpleNamespace
    from astra_ai.core.research_model import GeminiResearchModel
    calls=[]
    class Client:
        def __init__(self,**kwargs):self.models=self
        def generate_content(self,**kwargs):
            calls.append(kwargs['config'].max_output_tokens)
            return SimpleNamespace(text='{}',usage_metadata=SimpleNamespace(total_token_count=20))
        def close(self):pass
    model=GeminiResearchModel(lambda:'key',BackgroundBudget(tmp_path/'budget.json',min_interval=0),lambda:'gemini-3.5-flash-lite',Client)
    model._structured_once('Repair',{'original_brief':'Subject','previous_draft':{}},{'type':'object'},6000,'key','gemini-3.5-flash-lite')
    model._structured_once('Legacy full report',{'mode':'detailed'},{'type':'object'},6000,'key','gemini-3.5-flash-lite')
    assert calls==[6000,12000]
