"""Work engine v2 (AEGIS V24): adaptive agent allocation behind AEGIS_WORK_ENGINE, with no network."""
import asyncio

import pytest

from astra_ai.core.work import allocation
from astra_ai.core.work.catalog import WORKFLOWS
from astra_ai.core.work.contracts import LEAD_PLAN, REPORT_SECTIONS, REPORT_FRAME, VERIFICATION
from astra_ai.core.work.providers import load_slots

from test_work_runs import CONTEXT, FakeAdapter, build, events, start

SIX = {
    'NOVA_RESEARCH_PROVIDER': 'gemini', 'GEMINI_API_KEY': 'g-key', 'GROQ_API_KEY': 'q-key', 'NVIDIA_API_KEY': 'n-key',
    'NOVA_RESEARCH_GEMINI_MODEL': 'gemini-lead',
    'AEGIS_WORK_WORKER_A_PROVIDER': 'groq', 'AEGIS_WORK_WORKER_A_MODEL': 'small',
    'AEGIS_WORK_WORKER_B_PROVIDER': 'groq', 'AEGIS_WORK_WORKER_B_MODEL': 'big',
    'AEGIS_WORK_WORKER_C_PROVIDER': 'nvidia', 'AEGIS_WORK_WORKER_C_MODEL': 'nv-ultra',
    'AEGIS_WORK_WORKER_D_PROVIDER': 'nvidia', 'AEGIS_WORK_WORKER_D_MODEL': 'nv-vl',
    'AEGIS_WORK_WORKER_E_PROVIDER': 'gemini', 'AEGIS_WORK_WORKER_E_MODEL': 'gemini-writer',
}
SLOTS = load_slots(lambda name: SIX.get(name, ''))


def env(**extra):
    values = {**SIX, **extra}
    return lambda name: values.get(name, '')


def plan_for(mode, sections=('Answer',), needs_web=True):
    return {'mode': mode, 'sections': list(sections), 'needs_web': needs_web}


# The allocation itself: pure, no calls.

def test_engine_flag_defaults_to_v1_and_rejects_unknown_values():
    assert allocation.engine(lambda _n: '') == 'v1'
    assert allocation.engine(env(AEGIS_WORK_ENGINE='V2')) == 'v2'
    assert allocation.engine(env(AEGIS_WORK_ENGINE='six')) == 'v1'


def test_simple_code_explanation_uses_one_model_for_its_one_role():
    found = allocation.allocate('Explain what this Python function does: def f(x): return x*2', 'structured', 'explain-code',
                                plan_for('structured', needs_web=False), SLOTS, env())
    assert found.complexity == 'simple'
    assert [row['role'] for row in found.roles] == ['analysis']
    assert found.distinct_models == 2  # the lead plus one worker
    assert not found.second_analyst and found.writer == 'lead'


def test_medium_review_gets_a_reviewer_and_one_verification_step():
    found = allocation.allocate('Review this code change and identify possible bugs', 'quick', 'review-a-change',
                                plan_for('quick', needs_web=False), SLOTS, env())
    assert [row['role'] for row in found.roles] == ['analysis', 'verification']
    assert found.distinct_models <= 3


def test_complex_architecture_request_gets_specialists_but_not_all_six_by_default():
    query = 'Map an entire application architecture end-to-end, explain its modules and create an implementation plan with trade-offs'
    found = allocation.allocate(query, 'deep', 'deep-research', plan_for('deep', ['A', 'B', 'C', 'D', 'E', 'F']), SLOTS, env())
    assert found.complexity == 'complex'
    assert [row['role'] for row in found.roles] == ['discovery', 'analysis', 'verification']
    assert found.second_analyst and found.writer == 'synthesis'
    assert found.max_active_workers == allocation.DEFAULT_ACTIVE_WORKERS == 2


def test_one_active_worker_setting_removes_the_parallel_second_analyst():
    query = 'Compare every option end-to-end in a comprehensive, detailed architecture review'
    found = allocation.allocate(query, 'deep', 'deep-research', plan_for('deep', list('ABCDEF')), SLOTS, env(AEGIS_WORK_MAX_ACTIVE_WORKERS='1'))
    assert not found.second_analyst
    assert any(row['role'] == 'second analyst' for row in found.skipped)


def test_simple_deep_request_does_not_add_a_second_analyst_or_writer():
    found = allocation.allocate('What is a heat pump?', 'deep', '', plan_for('deep', ['Basics']), SLOTS, env())
    assert found.complexity != 'complex'
    assert not found.second_analyst and found.writer == 'lead'
    assert 'verification' not in [row['role'] for row in found.roles]


def test_direct_answers_use_no_workers():
    found = allocation.allocate('Plan my day: focus at 9, sync at 10', 'direct', 'plan-my-day', plan_for('direct', needs_web=False), SLOTS, env())
    assert found.roles == [] and found.distinct_models == 1


def test_a_review_that_also_wants_the_web_keeps_its_verification_within_budget():
    found = allocation.allocate('Review this change against the library docs', 'quick', 'review-a-change', plan_for('quick'), SLOTS, env(), budget_workers=2)
    assert [row['role'] for row in found.roles] == ['analysis', 'verification']
    assert any(row['role'] == 'discovery' for row in found.skipped)


def test_simple_work_reuses_one_worker_model_for_two_roles():
    found = allocation.allocate('Briefly summarize the change and check it', 'quick', 'review-a-change', plan_for('quick', needs_web=False), SLOTS, env())
    assert len({row['slot'] for row in found.roles}) == 1


def test_missing_worker_slots_fall_back_to_the_lead_without_inventing_models():
    lead_only = {'lead': SLOTS['lead']}
    found = allocation.allocate('Review this change', 'quick', 'review-a-change', plan_for('quick', needs_web=False), lead_only, env())
    assert {row['slot'] for row in found.roles} == {'lead'} and found.distinct_models == 1


@pytest.mark.parametrize('workflow', sorted(WORKFLOWS))
def test_every_workflow_allocates_within_its_budget(workflow):
    spec = WORKFLOWS[workflow]
    found = allocation.allocate('A request for ' + workflow, spec.mode, workflow, plan_for(spec.mode, needs_web=spec.needs_web), SLOTS, env())
    assert len(found.roles) <= 3
    assert found.distinct_models <= 6
    assert all(row['slot'] in SLOTS for row in found.roles)
    if spec.mode == 'direct':
        assert found.roles == []


# Full runs through the orchestrator with fake providers.

def test_v1_runs_are_unchanged_when_the_flag_is_off(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts)
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    assert run.request['engine'] == 'v1' and 'allocation' not in run.plan
    assert [call['slot'] for call in adapter.calls] == ['lead', 'worker_a', 'lead']


def test_v2_records_its_allocation_and_why(tmp_path):
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_ENGINE': 'v2'})
    identifier = start(service, artifacts)
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    run = service.store.get(identifier)
    assert run.request['engine'] == 'v2' and run.plan['engine'] == 'v2'
    assert [row['role'] for row in run.plan['allocation']['roles']] == ['discovery']
    allocated = [row for row in events(artifacts, identifier, 'stage') if row.get('stage') == 'allocated']
    assert allocated and allocated[0]['complexity'] == 'simple'


def test_v2_deep_run_of_a_simple_question_skips_the_extra_workers(tmp_path):
    adapter = FakeAdapter(plan={'mode': 'deep', 'sections': ['Basics', 'Uses'], 'queries': ['q1', 'q2']})
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_ENGINE': 'v2'})
    identifier = start(service, artifacts, 'What is a heat pump?', mode='deep', storage='detailed')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    run = service.store.get(identifier)
    assert [row['role'] for row in run.assignments] == ['discovery', 'analysis']
    assert not any(call['schema'] is VERIFICATION for call in adapter.calls)
    assert [node['id'] for node in run.task_graph['nodes']] == ['discover', 'analyze', 'write', 'publish']


def test_v2_task_labels_follow_the_workflow(tmp_path):
    adapter = FakeAdapter(plan={'needs_web': False})
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_ENGINE': 'v2'})
    identifier = start(service, artifacts, 'Review this change: - a\n+ b', workflow='review-a-change')
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    labels = {node['id']: node['label'] for node in service.store.get(identifier).task_graph['nodes']}
    assert labels['analyze'] == 'Review the change' and labels['verify'] == 'Check each finding'


def test_engine_choice_survives_a_settings_change_between_attempts(tmp_path):
    values = {'AEGIS_WORK_ENGINE': 'v2'}
    adapter = FakeAdapter()
    service, artifacts, _ = build(tmp_path, adapter, env=values)
    identifier = start(service, artifacts)
    service.settings = lambda name: {'AEGIS_WORK_ENGINE': 'v1'}.get(name, '')
    asyncio.run(service.run(identifier, CONTEXT))
    assert service.store.get(identifier).request['engine'] == 'v2'


# One event schema for simulated and live runs.

def test_live_trace_projects_onto_the_lab_event_schema(tmp_path):
    import json
    from astra_ai.core.work.agent_events import EVENT_KINDS, project
    adapter = FakeAdapter(plan={'mode': 'deep', 'sections': ['Basics', 'Uses'], 'queries': ['q1', 'q2']})
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_ENGINE': 'v2'})
    identifier = start(service, artifacts, 'What is a heat pump?', mode='deep', storage='detailed')
    asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    out = project(artifacts.trace.read(identifier, 0), service.store.public(run)['request'])
    kinds = [row['kind'] for row in out]
    assert set(kinds) <= set(EVENT_KINDS)
    # The trace settles the publish task just after the finish stage; the projection keeps that order.
    assert kinds[:2] == ['run_created', 'prompt_received'] and 'run_completed' in kinds[-2:]
    assert out[0]['data']['engine'] == 'v2'
    assert [row['seq'] for row in out] == list(range(1, len(out) + 1))
    assert all(row['origin'] == 'aegis' and row['t'] >= 0 for row in out)
    allocated = [row for row in out if row['kind'] == 'plan_created' and 'complexity' in row.get('data', {})]
    assert allocated and allocated[0]['data']['writer'] == 'lead'
    calls = {row['id'] for row in out if row['kind'] == 'tool_called'}
    done = [row for row in out if row['kind'] == 'tool_completed' and row.get('tool') == 'web_search']
    assert done and all(row['cause'] in calls for row in done)
    assert kinds.count('source_collected') >= 2
    assert 'g-key' not in json.dumps(out) and 'q-key' not in json.dumps(out)


def test_projection_of_an_old_trace_without_engine_says_v1():
    from astra_ai.core.work.agent_events import project
    rows = [{'seq': 1, 'at': 10.0, 'kind': 'stage', 'status': 'done', 'stage': 'received', 'label': 'Request received'},
            {'seq': 2, 'at': 10.5, 'kind': 'relation', 'status': 'done'},
            {'seq': 3, 'at': 11.0, 'kind': 'stage', 'status': 'done', 'stage': 'finished', 'label': 'Run complete'}]
    out = project(rows, {'query': 'Old run'})
    assert [row['kind'] for row in out] == ['run_created', 'prompt_received', 'run_completed']
    assert out[0]['data']['engine'] == 'v1' and out[-1]['t'] == 1000
