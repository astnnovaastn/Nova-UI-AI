"""V33 zero-API tests for the Designer workflows: a UI teardown is a measured inspection of the interface
(component inventory, accessibility findings, screenshot), never a generic article; the moodboard keeps its
picture boards. No model, search or network is called (fake adapters and the recorded free web)."""
import base64
import json
import sys
from pathlib import Path

from astra_ai.core.work import deliverables, router, ui_teardown
from astra_ai.core.work.v29_tasks import COMPOSE_SCHEMA

from test_work_v29_router import WorkAdapter, compose_answer, free_web, zobjects  # noqa: F401  (free_web is an autouse fixture)
from test_work_v30 import run_with

SAMPLE = (Path(__file__).parent / 'fixtures' / 'v33_checkout.html').read_text(encoding='utf-8')
PNG = base64.b64encode(b'\x89PNG\r\n\x1a\n' + b'\0' * 64).decode()


class TeardownAdapter(WorkAdapter):
    """The lead's part of a teardown: observations, UX findings, recommendations and a comparison row, citing the page."""

    def answer(self, schema, payload):
        if schema is not COMPOSE_SCHEMA:
            return super().answer(schema, payload)
        self.compose_payloads.append(payload)
        inspected = payload['material'].get('ui_inspection') or [{}]
        ref = inspected[0].get('ref', '')
        lst = lambda title, style, items: {'kind': 'list', 'title': title, 'part': '', 'data_json': json.dumps({'style': style, 'items': [{'title': t, 'ref': ref} for t in items]})}
        return {'reply': {'headline': 'Checkout teardown', 'text': 'One clear primary action; labels and zoom fail.', 'points': ['Pay now is the only primary action']},
                'objects': [lst('Design observations', 'requirements', ['Single column form', 'Blue primary button', 'Card groups the summary']),
                            lst('UX findings', 'requirements', ['Promo field competes with payment', 'Email has no label', 'Errors shown in red only']),
                            lst('Recommendations', 'todo', ['Label every field', 'Allow zoom', 'Add alt text to the logo']),
                            {'kind': 'sheet', 'title': 'Comparison', 'part': '', 'data_json': json.dumps({'columns': [{'label': 'Interface', 'kind': 'entity'}, {'label': 'Primary action', 'kind': 'text'}],
                                                                                                       'rows': [{'cells': ['Checkout', 'Pay now'], 'ref': ref}]})}]}


def test_inspection_counts_components_and_finds_accessibility_issues():
    found = ui_teardown.inspect(SAMPLE, 'https://shop.example/checkout')
    components = {c['name']: c['count'] for c in found['components']}
    assert components['Button'] == 2 and components['Text field'] == 3 and components['Image'] == 3 and components['Select'] == 1
    titles = [f['title'] for f in found['accessibility']]
    for expected in ('Image without alt text', 'Form field without a label', 'Button without an accessible name', 'Page language not declared',
                     'Zoom is disabled', 'Heading level skipped', 'Low text contrast', 'Vague link text'):
        assert expected in titles, expected
    contrast = next(f for f in found['accessibility'] if f['title'] == 'Low text contrast')
    assert '#9a9a9a on #ffffff' in contrast['detail']
    assert found['structure']['actions'] == ['Pay now'] and found['structure']['landmarks'] == ['header', 'nav', 'footer']
    assert '#0b57d0' in found['palette'] and found['fonts'] == ['Inter']
    # The labelled field is not reported; a placeholder is said not to be a label.
    labels = [f['detail'] for f in found['accessibility'] if f['title'] == 'Form field without a label']
    assert not any('#name' in d for d in labels) and any('placeholder "Email" is not a label' in d for d in labels)


def test_contrast_ratio_matches_wcag():
    assert round(ui_teardown.contrast((0, 0, 0), (255, 255, 255)), 1) == 21.0
    assert ui_teardown.contrast((154, 154, 154), (255, 255, 255)) < 4.5


def test_a_vague_teardown_asks_for_the_interface_instead_of_searching():
    assert router.route('Do a UI teardown of the checkout page', 'ui-teardown').question
    assert router.route('Tear down the pricing pages of Linear and Notion', 'ui-teardown').question is None
    assert router.route('Tear down https://shop.example/checkout', 'ui-teardown').question is None
    assert router.route('Tear down this:\n```html\n<html><body><button>Go</button></body></html>\n```', 'ui-teardown').question is None


def test_pasted_html_teardown_is_measured_and_never_searches(tmp_path, free_web):
    query = 'Tear down this checkout:\n```html\n' + SAMPLE + '\n```'
    result, record, adapter, *_ = run_with(TeardownAdapter, tmp_path, 'ui-teardown', query)
    assert result['status'] == 'completed', record.failure
    assert free_web['search'] == [] and free_web['read'] == [] and free_web['images'] == [], 'pasted HTML is inspected, nothing searched'
    objects = {o['title']: o for o in zobjects(record)}
    inventory = objects['Component inventory']
    assert inventory['zkind'] == 'sheet' and ['Button', '2'] in [r['cells'] for r in inventory['data']['rows']]
    access = objects['Accessibility findings']
    assert access['zkind'] == 'list' and any(i['title'] == 'Zoom is disabled' and i.get('priority') == 'high' for i in access['data']['items'])
    for name in ('Design observations', 'UX findings', 'Recommendations', 'Comparison'):
        assert name in objects, name
    assert record.results['v29']['deliverables']['missing'] == []
    sent = adapter.compose_payloads[0]
    assert sent['material']['ui_inspection'][0]['components']['Text field'] == 3
    assert 'sheet: Component inventory' in sent['already_built'] and 'media' not in sent['outputs_to_create']
    report = record.results['report_text']
    assert '## Component inventory' in report and '## Accessibility findings' in report and '## UX findings' in report
    assert record.usage.get('searches', 0) == 0


def test_teardown_instruction_is_about_the_interface_not_a_moodboard(tmp_path, free_web):
    query = 'Tear down this:\n```html\n' + SAMPLE + '\n```'
    _, record, adapter, *_ = run_with(TeardownAdapter, tmp_path, 'ui-teardown', query)
    compose = [c for c in adapter.calls if c['schema'] is COMPOSE_SCHEMA][0]['instruction']
    assert 'UI teardown of the interfaces in material.ui_inspection' in compose
    assert 'Palette, Type, Texture' not in compose and 'two or three picks objects' not in compose


def test_moodboard_instruction_keeps_its_visual_points(tmp_path, free_web):
    _, record, adapter, *_ = run_with(WorkAdapter, tmp_path, 'moodboard', 'Make a moodboard for warm brutalist editorial')
    compose = [c for c in adapter.calls if c['schema'] is COMPOSE_SCHEMA][0]['instruction']
    assert 'Palette, Type, Texture, Composition, Avoid' in compose and 'UI teardown' not in compose
    assert [o['zkind'] for o in zobjects(record)].count('picks') >= 2


def test_a_read_page_is_inspected_and_its_screenshot_saved(tmp_path, free_web, monkeypatch):
    browser = sys.modules['astra_ai.core.work.agent_browser'].AgentBrowser
    checkout = 'https://shop.example/checkout'
    read_other_page = browser.read

    def read(self, url):
        if url != checkout:
            return read_other_page(self, url)
        free_web['read'].append(url)
        return {'status': 'ok', 'text': 'Checkout page ' * 40, 'title': 'Fixture Store — Checkout',
                'html': SAMPLE, 'images': [], 'links': [], 'final_url': url}

    monkeypatch.setattr(browser, 'read', read)
    monkeypatch.setattr(browser, 'capture_screenshot',
                        lambda self: {'available': True, 'png_base64': PNG, 'width': 1280, 'height': 800},
                        raising=False)
    result, record, *_ = run_with(TeardownAdapter, tmp_path, 'ui-teardown', 'Tear down ' + checkout)
    assert result['status'] == 'completed', record.failure
    assert free_web['read'][0] == 'https://shop.example/checkout'
    shot = next(o for o in zobjects(record) if o['zkind'] == 'media')
    assert shot['data']['url'] == '/api/work/runs/' + record.research_id + '/shots/1.png'
    saved = Path(tmp_path).rglob('shots/' + record.run_id + '/1.png')
    assert any(p.read_bytes().startswith(b'\x89PNG') for p in saved)
    inventory = next(o for o in zobjects(record) if o['title'] == 'Component inventory')
    assert inventory['data']['rows'][0].get('source', '').startswith('S'), 'the inventory cites the page it measured'
    assert '![' in record.results['report_text'] and '/shots/1.png' in record.results['report_text']


def test_a_page_without_a_renderer_says_the_screenshot_is_unavailable(tmp_path, free_web):
    browser = sys.modules['astra_ai.core.work.agent_browser'].AgentBrowser
    browser.read = lambda self, url: {'status': 'ok', 'text': 'Checkout ' * 40, 'html': SAMPLE, 'images': [], 'links': []}
    try:
        result, record, *_ = run_with(TeardownAdapter, tmp_path, 'ui-teardown', 'Tear down https://shop.example/checkout')
    finally:
        del browser.read
    assert result['status'] == 'completed'
    tools = record.results['v29']['tools']
    assert any(t['tool'] == 'ui.screenshot' and t['status'] == 'unavailable' for t in tools)
    assert not any(o['zkind'] == 'media' for o in zobjects(record))


def test_render_writes_media_first():
    text = deliverables.render({'headline': 'T', 'text': 'x'}, [
        {'zkind': 'list', 'title': 'L', 'data': {'items': [{'title': 'a'}]}},
        {'zkind': 'media', 'title': 'Screenshot: Shop', 'data': {'medium': 'image', 'url': '/api/work/runs/x/shots/1.png'}}])
    assert text.index('## Screenshot: Shop') < text.index('## L') and '![Screenshot: Shop](/api/work/runs/x/shots/1.png)' in text


def test_board_pictures_ask_for_card_sized_wikimedia_thumbnails():
    from astra_ai.core.work.v29_tasks import card_picture
    assert card_picture('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/A.jpg/960px-A.jpg?x=1') == 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/A.jpg/500px-A.jpg?x=1'
    assert card_picture('https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/A.jpg/330px-A.jpg').endswith('/330px-A.jpg')
    assert card_picture('https://live.staticflickr.com/1/2_b.jpg') == 'https://live.staticflickr.com/1/2_b.jpg'


# Every routed Work workflow, simulated end to end (fake lead, recorded free web): each deliverable is built,
# kept, written into the report and leaves no gap. Research workflows keep the legacy pipeline (tested elsewhere).

def _items(kind, n, ref):
    if kind == 'plan':
        return {'steps': [{'when': 'Week ' + str(i // 2 + 1), 'title': 'Step ' + str(i + 1), 'kind': 'task', 'detail': 'Owner role does it'} for i in range(n)]}
    if kind == 'list':
        return {'style': 'todo', 'items': [{'title': 'Item ' + str(i + 1), 'ref': ref} for i in range(n)]}
    if kind == 'sheet':
        return {'columns': [{'label': 'Name', 'kind': 'entity'}, {'label': 'Value', 'kind': 'text'}], 'rows': [{'cells': ['Row ' + str(i + 1), 'v'], 'ref': ref} for i in range(n)]}
    if kind == 'picks':
        return {'facet': 'company', 'items': [{'name': 'Pick ' + str(i + 1), 'ref': ref, 'why': 'Fits'} for i in range(n)]}
    if kind == 'document':
        return {'paragraphs': [p for i in range(n) for p in ('## Section ' + str(i + 1), 'Text.')]}
    if kind == 'diagram':
        return {'nodes': [{'id': 'n' + str(i), 'name': 'Node ' + str(i), 'kind': 'service'} for i in range(n)], 'edges': []}
    if kind == 'draft':
        return {'destination': 'email', 'body': 'Hello.'}
    if kind == 'code':
        return {'language': 'python', 'text': 'x = 1', 'notes': [{'from': 1, 'to': 1, 'text': 'one'}]}
    return {}


class DeliveringAdapter(WorkAdapter):
    """A lead that makes exactly the workflow's deliverables at their minimum size, citing the first reference."""

    def answer(self, schema, payload):
        if schema is not COMPOSE_SCHEMA:
            return super().answer(schema, payload)
        self.compose_payloads.append(payload)
        refs = [r['id'] for r in payload['material']['references']]
        ref = refs[0] if refs else None
        allowed = set(payload['outputs_to_create'])
        objects = [{'kind': d.kind, 'title': d.name, 'part': '', 'data_json': json.dumps(_items(d.kind, d.minimum, ref))}
                   for d in deliverables.for_workflow(payload['workflow'], tuple(allowed)) if d.kind in allowed]
        return {'reply': {'headline': 'Done', 'text': 'Made.', 'points': ['A point']}, 'objects': objects}


QUERIES = {
    'campaign-plan': 'Plan a four-week launch campaign for AEGIS Desktop',
    'competitor-landscape': 'Compare Linear, Jira and Asana',
    'plan-my-day': 'Plan my day: standup 9:30, report due at 17:00',
    'weekly-status': 'Write my weekly status: shipped the router; in progress tabs; risk Docker',
    'inbox-triage': 'Triage my inbox',
    'meeting-prep': 'Prepare me for the quarterly review with the product team',
    'market-map': 'Map the AI coding assistant market: Cursor, Copilot, Devin',
    'pricing-research': 'Research pricing of Notion, Coda and Airtable',
    'investor-list': 'List seed investors for a SaaS design tool',
    'learning-path': 'A learning path for TypeScript',
    'exam-prep': 'Prepare me for my calculus exam in five days',
}


import pytest  # noqa: E402


@pytest.mark.parametrize('workflow', sorted(QUERIES))
def test_every_routed_workflow_builds_and_reports_its_deliverables(tmp_path, free_web, workflow):
    result, record, adapter, *_ = run_with(DeliveringAdapter, tmp_path, workflow, QUERIES[workflow])
    assert result['status'] == 'completed', (workflow, record.failure)
    spec = router.SPECS[workflow]
    required = deliverables.for_workflow(workflow, [k for k in spec.outputs if k != 'reply'])
    titles = [o['title'] for o in zobjects(record)]
    for d in required:
        assert d.name in titles, (workflow, d.name)
        assert '## ' + d.name in record.results['report_text'], (workflow, d.name)
    assert record.results['v29']['deliverables']['missing'] == [], workflow
    assert record.usage.get('searches', 0) == 0, 'no paid search outside research'
    assert record.plan['route']['board'] == spec.board
