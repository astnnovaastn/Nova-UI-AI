"""V28 zero-API checks for the lead's adaptive card step (`_compose_cards`, AEGIS_WORK_ADAPTIVE_CARDS).

No model or search API is called: a fake lead answers the card command schema with what a lead would
place for each workflow. These tests prove the execution path (admission, validation, storage, distinct
objects per workflow); they do not prove a real model chooses these cards. Live behaviour is separate.
"""
import asyncio
import json

from astra_ai.core.work import card_objects

from test_work_runs import CONTEXT, FakeAdapter, build, start


def command(family, preset, payload, object_id):
    return {'op': 'create', 'command_id': 'c-' + object_id, 'object_id': object_id, 'expected_revision': 0,
            'family': family, 'preset': preset, 'state': 'complete', 'payload_json': json.dumps(payload)}


S1 = [{'id': 'S1'}]
CARDS = {
    'plan-my-day': [command('calendar', 'calendar.1.reading', {'title': 'Today', 'sources': [], 'entries': [
        {'id': 'e1', 'label': 'Standup', 'date': '2026-11-18', 'when': '09:30'},
        {'id': 'e2', 'label': 'Draft due', 'date': '2026-11-18', 'when': '14:00'}]}, 'today')],
    'competitor-landscape': [
        command('comparison', 'comparison.1.reading', {'title': 'Pricing compared', 'sources': S1, 'columns': ['Product', 'Entry price'],
                                                         'rows': [['Alpha', '$4'], ['Beta', '$6']], 'row_ids': ['alpha', 'beta']}, 'pricing'),
        command('chart', 'chart.1.reading', {'title': 'Entry price', 'sources': S1, 'chartKind': 'bars',
                                               'entries': [{'id': 'a', 'label': 'Alpha', 'value': 4, 'unit': 'USD'}, {'id': 'b', 'label': 'Beta', 'value': 6, 'unit': 'USD'}]}, 'price-chart')],
    'review-a-change': [command('diff', 'diff.1.reading', {'title': 'Round once', 'sources': [], 'language': 'python',
                                                             'body': '@@ -1,2 +1,2 @@\n a\n-b\n+c'}, 'patch')],
    'moodboard': [command('recommendation', 'recommendation.1.reading', {'title': 'References', 'sources': S1, 'recommendations': [
        {'id': 'r1', 'title': 'Calm transit board', 'recommended': True, 'facts': [{'id': 'f1', 'label': 'Palette', 'value': 'Blue and sand'}]},
        {'id': 'r2', 'title': 'Night mode map', 'recommended': False, 'facts': []}]}, 'refs')],
    'campaign-plan': [
        command('timeline', 'timeline.1.reading', {'title': 'Four weeks', 'sources': [], 'entries': [
            {'id': 'w1', 'label': 'Week 1: teaser'}, {'id': 'w2', 'label': 'Week 2: launch'}]}, 'weeks'),
        command('draft', 'draft.1.reading', {'title': 'Launch post', 'sources': [], 'body': 'We are live.'}, 'post')],
    'inbox-triage': [command('draft', 'draft.1.reading', {'title': 'Reply to Ana', 'sources': [], 'body': 'Sending the deck Friday.'}, 'reply')],
}
EXPECTED = {
    'plan-my-day': {'calendar'}, 'competitor-landscape': {'comparison', 'chart'}, 'review-a-change': {'diff'},
    'moodboard': {'comparison'}, 'campaign-plan': {'timeline', 'draft'}, 'inbox-triage': {'draft'},
}


class CardAdapter(FakeAdapter):
    def __init__(self, workflow, **kwargs):
        super().__init__(**kwargs)
        self.workflow = workflow
        self.card_calls = 0

    def answer(self, schema, payload):
        if schema is card_objects.COMMAND_SCHEMA:
            self.card_calls += 1
            # Placed once, at publication; the analysis pass places nothing.
            return {'commands': CARDS[self.workflow] if payload.get('phase') == 'publication' else []}
        return super().answer(schema, payload)


def run_workflow(tmp_path, workflow, flag='1'):
    adapter = CardAdapter(workflow)
    service, artifacts, _ = build(tmp_path, adapter, env={'AEGIS_WORK_ADAPTIVE_CARDS': flag})
    identifier = start(service, artifacts, 'Help with this ' + workflow.replace('-', ' '), workflow=workflow)
    result = asyncio.run(service.run(identifier, CONTEXT))
    return result, service.store.get(identifier), adapter


def test_flag_off_keeps_todays_behaviour(tmp_path):
    result, run, adapter = run_workflow(tmp_path, 'plan-my-day', flag='')
    assert result['status'] == 'completed'
    assert adapter.card_calls == 0
    assert not any(o.get('contract_version') == 26 for o in run.canvas_objects)


def test_each_workflow_places_its_own_kinds_of_card(tmp_path):
    seen = {}
    for workflow, kinds in EXPECTED.items():
        result, run, adapter = run_workflow(tmp_path / workflow, workflow)
        assert result['status'] == 'completed', workflow
        assert adapter.card_calls >= 1, workflow
        placed = {o['kind'] for o in run.canvas_objects if o.get('contract_version') == 26}
        assert kinds <= placed, (workflow, placed)
        seen[workflow] = frozenset(placed)
    # Different workflows give different results, not one generic set.
    assert len(set(seen.values())) >= 5


def test_a_card_that_cites_an_unknown_source_is_refused_not_stored(tmp_path):
    bad = command('chart', 'chart.1.reading', {'title': 'Invented', 'sources': [{'id': 'S404'}], 'chartKind': 'bars',
                                                 'entries': [{'id': 'a', 'label': 'A', 'value': 1}]}, 'invented')
    CARDS['_bad'] = [bad]
    try:
        result, run, _ = run_workflow(tmp_path, '_bad')
    finally:
        CARDS.pop('_bad')
    assert result['status'] == 'completed'
    assert not any(o['id'] == 'invented' for o in run.canvas_objects)


class AskOnce(FakeAdapter):
    """Asks which market on the first plan, then plans with the answer it was given."""

    def __init__(self):
        super().__init__()
        self.plans = []

    def answer(self, schema, payload):
        from astra_ai.core.work.contracts import LEAD_PLAN
        if schema is LEAD_PLAN:
            self.plans.append(json.dumps(payload))
            if len(self.plans) == 1:
                return {**super().answer(schema, payload), 'clarification': 'Which market around Google should I map?',
                        'clarification_options': ['Search engines', 'AI / Gemini ecosystem', 'Digital advertising', 'Google Cloud']}
        return super().answer(schema, payload)


def test_a_question_pauses_the_run_and_one_answer_resumes_it(tmp_path):
    adapter = AskOnce()
    service, artifacts, _ = build(tmp_path, adapter)
    identifier = start(service, artifacts, 'Map the market for Google', workflow='market-map')
    first = asyncio.run(service.run(identifier, CONTEXT))
    run = service.store.get(identifier)
    assert first['needs_input'] and run.state == 'needs_input'
    asked = run.request['clarifications'][-1]
    assert asked['question'] == 'Which market around Google should I map?' and len(asked['options']) == 4 and not asked.get('answer')
    # Nothing past planning ran while the question was open.
    assert adapter.plans and all('Map the market' in p for p in adapter.plans)
    assert asyncio.run(service.answer(identifier, CONTEXT, 'Google Cloud'))['status'] == 'accepted'
    # A second answer to the same, now answered, question changes nothing.
    assert asyncio.run(service.answer(identifier, CONTEXT, 'Search engines'))['status'] == 'unchanged'
    assert asyncio.run(service.run(identifier, CONTEXT))['status'] == 'completed'
    run = service.store.get(identifier)
    history = run.request['clarifications']
    assert history[-1]['answer'] == 'Google Cloud' and run.state == 'completed'
    # The second plan was made knowing the answer.
    assert 'Google Cloud' in adapter.plans[-1]
