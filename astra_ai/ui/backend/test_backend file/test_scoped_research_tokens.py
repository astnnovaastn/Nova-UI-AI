from datetime import datetime,timezone
import pytest
from astra_ai.core.background_budget import BackgroundBudget,BudgetPaused,scoped_tokens_remaining
from astra_ai.memory.shared_memory import atomic


def grant(budget,used=0,extra=40000):
    day=datetime.now(timezone.utc).date().isoformat()
    atomic(budget.path,{'day':day,'requests':28,'tokens':budget.daily_tokens-1000,'next_attempt':0,
        'research_token_allowances':{'memory':{'day':day,'extra_tokens':extra,'used':used}}})


def test_token_grant_is_scoped_and_only_charges_incremental_usage(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant(budget)
    for scope in ('','unrelated'):
        with pytest.raises(BudgetPaused,match='background_daily_budget'):
            with budget.lease(2000,scope):pass
    with budget.lease(3000,'memory') as reservation:reservation.settle(2000)
    state=budget.snapshot()
    assert state['tokens']==401000 and state['requests']==29
    assert state['research_token_allowances']['memory']['used']==1000
    with budget.lease(5000,'memory') as reservation:reservation.settle(3000)
    state=budget.snapshot()
    assert state['tokens']==404000 and state['requests']==30
    assert state['research_token_allowances']['memory']['used']==4000
    with pytest.raises(BudgetPaused):
        with budget.lease(36001,'memory'):pass


def test_rejected_request_refunds_only_estimated_tokens_not_request_count(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant(budget)
    with budget.lease(3000,'memory') as reservation:reservation.settle(0)
    state=budget.snapshot()
    assert state['tokens']==399000 and state['requests']==29
    assert state['research_token_allowances']['memory']['used']==0
    with pytest.raises(TimeoutError):
        with budget.lease(3000,'memory'):raise TimeoutError()
    state=budget.snapshot()
    assert state['tokens']==402000 and state['research_token_allowances']['memory']['used']==2000


@pytest.mark.parametrize('bad',[None,{}, {'day':'1900-01-01','extra_tokens':40000,'used':0},
    {'extra_tokens':40001,'used':0},{'extra_tokens':True,'used':0},{'extra_tokens':40000,'used':-1}])
def test_invalid_or_expired_token_grants_never_expand_budget(tmp_path,bad):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant(budget);data=budget.snapshot()
    if isinstance(bad,dict):bad.setdefault('day',data['day'])
    data['research_token_allowances']['memory']=bad;atomic(budget.path,data)
    assert scoped_tokens_remaining(data,'memory',data['day'])==0
    with pytest.raises(BudgetPaused):
        with budget.lease(2000,'memory'):pass


def test_token_grant_does_not_override_request_cap_or_provider_pause(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant(budget);data=budget.snapshot();data['requests']=40;atomic(budget.path,data)
    with pytest.raises(BudgetPaused,match='background_daily_budget'):
        with budget.lease(2000,'memory'):pass
    data['requests']=28;data.update(next_attempt=9999999999,pause_reason='gemini_daily_quota');atomic(budget.path,data)
    with pytest.raises(BudgetPaused,match='gemini_daily_quota'):
        with budget.lease(2000,'memory'):pass
    assert budget.snapshot()['research_token_allowances']['memory']['used']==0


def test_token_grant_expires_at_day_rollover(tmp_path):
    budget=BackgroundBudget(tmp_path/'budget.json',daily_tokens=400000,min_interval=0)
    grant(budget);data=budget.snapshot();data['day']='1900-01-01';atomic(budget.path,data)
    with budget.lease(100,'memory'):pass
    assert 'research_token_allowances' not in budget.snapshot()
    assert budget.snapshot()['tokens']==100
