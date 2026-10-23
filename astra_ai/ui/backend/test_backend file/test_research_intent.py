import ast
import asyncio
import time
from pathlib import Path
from types import SimpleNamespace

import pytest

from astra_ai.core.search_intent import is_explicit_search_request
from astra_ai.core.research_intent import admission, saved_findings, existing_turn
from astra_ai.core.research_learning import ResearchArtifacts, ResearchSearch, reader_text
from astra_ai.memory.shared_memory import atomic
from astra_ai.core.selection_text import matches_selection

CTX = {'profile_id': 'owner', 'project_id': 'work', 'session_id': 'conversation', 'turn_id': 'one'}
SOURCE = {'url': 'https://example.com/robotics', 'title': 'Google robotics',
          'content': 'Google DeepMind robotics uses Gemini to interpret observations and plan robot actions.', 'retrieved_at': '2026-09-23'}


@pytest.mark.parametrize('text', [
    'Do you know anything about Google Robotics?', 'What is Google DeepMind?',
    'Tell me about Google robotics.', 'Why did you research this three times?',
    'I told you to research it yesterday.', 'Can you search the web?',
    'Do not research it.', "Don't search for Google robotics.",
    'Can you explain research methods?', 'What does "research Google robotics" mean?',
    'I need to know about Google robotics.',
])
def test_questions_and_quoted_commands_do_not_authorize_collection(text):
    assert not is_explicit_search_request(text)


@pytest.mark.parametrize('text', [
    'Research Google robotics.', 'Please search for Google robotics.',
    'Could you research Google DeepMind?', 'Yes, research Google robotics.',
    'I want you to search for current robotics news.',
    'Explain this. Then research the missing specifications.',
    'Look up the latest robotics models.',
])
def test_explicit_user_requests_are_authorized(text):
    assert is_explicit_search_request(text)


def saved(store, query='Google DeepMind robotics', context=CTX, operation='original'):
    return store.save(query, 'detailed', '# Google robotics\n\nGoogle DeepMind robotics uses Gemini for planning. [S1]', [SOURCE], [], context, operation)


@pytest.mark.parametrize('name,args', [
    ('search_web', {'query': 'Google robotics'}),
    ('search_web', {'action': 'expand', 'research_id': 'not-permission'}),
    ('research_action', {'action': 'request', 'query': 'Google robotics'}),
    ('search_widget_action', {'action': 'run', 'query': 'Google robotics'}),
    ('research_artifact_action', {'action': 'continue', 'detail': 'Search Google robotics'}),
])
def test_model_arguments_cannot_authorize_search(tmp_path, name, args):
    store = ResearchArtifacts(tmp_path/'reports.json')
    result = admission(store, name, args, {**CTX, 'user_text': 'Do you know about Google robotics?'})
    assert result['status'] == 'confirmation_required' and result['provider_calls'] == 0
    assert not store.snapshot().get('requests')


def test_archive_lookup_is_cross_day_scoped_and_requires_all_subjects(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json'); item = saved(store)
    data = store.snapshot(); data['artifacts'][item['id']]['created_epoch'] -= 30*86400; atomic(store.path, data)
    context = {**CTX, 'session_id': 'tomorrow', 'turn_id': 'next', 'user_text': 'Do you know about Google robotics?'}
    result = admission(store, 'search_web', {'query': 'Google robotics'}, context)
    assert result['provider_calls'] == 0 and result['items'][0]['research_id'] == item['id']
    assert result['items'][0]['sources'][0]['citation_id'] == 'S1'
    assert not saved_findings(store, 'OpenAI and Google robotics', context)['items']
    assert not saved_findings(store, 'Google robotics', {**context, 'project_id': 'private'})['items']
    assert store.find_history('robotics Gemini', context)['items'][0]['research_id'] == item['id']
    preview = store.deletion_preview(item['id'], CTX)
    store.remove(item['id'], CTX, preview['revision'], 'delete')
    assert not saved_findings(store, 'Google robotics', context)['items']


def test_explicit_request_reuses_saved_findings_but_fresh_request_does_not(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json'); item=saved(store)
    context = {**CTX, 'turn_id': 'next', 'user_text': 'Research Google robotics'}
    result = admission(store, 'search_web', {'query': 'Google robotics'}, context)
    assert result['provider_calls'] == 0 and result['items']
    assert admission(store, 'research_artifact_action', {'action':'continue'}, {**context,'research_id':item['id']})['provider_calls'] == 0
    assert admission(store, 'search_web', {'query': 'Google robotics today'}, {**context, 'user_text': 'Research Google robotics today'}) is None
    assert admission(store, 'search_web', {'query': 'Google robotics'}, {**context, 'user_text': 'Research Google robotics today'}) is None
    assert admission(store, 'search_web', {'query': 'Google robotics'}, {**context, 'user_text': 'Research OpenAI and Google robotics'}) is None


def test_confirmation_is_bound_to_original_question_page_and_turn(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json')
    original = {**CTX, 'user_text': 'Do you know about Google robotics?'}
    assert admission(store, 'search_web', {'query': 'Invented subject'}, original)['status'] == 'confirmation_required'
    other = {**CTX, 'turn_id': 'next', 'user_text': 'Yes', 'session_id': 'unrelated'}
    assert admission(store, 'search_web', {'query': 'Changed subject'}, other)['status'] == 'confirmation_required'
    result = admission(store, 'search_web', {'query': 'Changed subject'}, {**original, 'turn_id': 'next', 'user_text': 'Yes'})
    assert result == {'status': 'authorized_once', 'confirmed_query': original['user_text']}
    assert admission(store, 'search_web', {}, {**original, 'turn_id': 'third', 'user_text': 'Yes'})['status'] == 'confirmation_required'


def test_spoken_offer_without_tool_still_requires_and_accepts_next_confirmation(tmp_path):
    from astra_ai.core.research_intent import observe_search_offer
    store = ResearchArtifacts(tmp_path/'reports.json')
    observe_search_offer(store, CTX, 'Do you know Google robotics?', 'I can conduct a search if you would like current details. Would that be helpful?')
    result = admission(store, 'search_web', {'query': 'Altered target'}, {**CTX, 'turn_id': 'reply', 'user_text': 'Yes'})
    assert result == {'status': 'authorized_once', 'confirmed_query': 'Do you know Google robotics?'}
    observe_search_offer(store, CTX, 'Do you know Google robotics?', 'Would you like me to search?')
    observe_search_offer(store, {**CTX,'turn_id':'other'}, 'What is two plus two?')
    assert admission(store, 'search_web', {}, {**CTX, 'turn_id':'later', 'user_text':'Yes'})['status'] == 'confirmation_required'


def test_expanding_saved_report_is_not_external_search_permission(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json'); item = saved(store)
    context = {**CTX, 'turn_id': 'expand', 'research_id': item['id'], 'user_text': 'Add more details to this report'}
    assert admission(store, 'research_artifact_action', {'action': 'continue'}, context)['status'] == 'saved_extension_authorized'
    calls = []
    async def synth(*args): calls.append(args); return '## Additional details\n\nThe saved evidence covers planning. New specifications are unavailable. [S1]'
    service = ResearchSearch(store, lambda _: '', synthesize=synth)
    service._request = lambda *args: pytest.fail('Saved-only expansion must not call a search provider')
    result = asyncio.run(service.expand_report({'research_id': item['id'], 'research_revision': item['revision'], 'detail': 'Add details about current actuator specifications and torque limits'}, {**context, 'research_saved_only': True}, 'saved-extension'))
    assert result['status'] == 'completed' and len(calls) == 1


def test_repeated_tools_for_one_turn_reuse_durable_initial_and_extension(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json')
    row = store.reserve('Google robotics', 'detailed', CTX, 'first')
    assert existing_turn(store, CTX)['research_id'] == row['id']
    assert admission(store, 'research_action', {'action': 'request', 'query': 'Different paraphrase'}, {**CTX, 'user_text': 'Research Google robotics'})['duplicate']
    assert admission(store, 'search_web', {'query': 'Google robotics'}, {**CTX, 'job_id': 'accepted-job', 'requested_research': True}) is None
    item = store.save(row['query'], 'detailed', '# Robotics\n\nSupported [S1].', [SOURCE], [], CTX, 'first')
    next_turn = {**CTX, 'turn_id': 'followup'}
    store.extension_state(item['id'], next_turn, operation_id='extension', phase='queued', origin_turn_id='followup', origin_session_id=CTX['session_id'])
    restarted = ResearchArtifacts(store.path)
    assert existing_turn(restarted, next_turn)['research_id'] == item['id']


def test_paraphrased_subject_reuses_pending_job_in_same_conversation(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json')
    one = store.reserve('Google Robotics initiatives and deep learning models', 'detailed', CTX, 'one')
    two = store.reserve('Google Robotics and deep learning AI models', 'detailed', {**CTX, 'turn_id': 'two'}, 'two')
    assert one['id'] == two['id']
    other = store.reserve('Google Robotics and OpenAI models', 'detailed', CTX, 'three')
    assert other['id'] != one['id']


def test_atomic_allocation_rechecks_one_collection_per_admitted_turn(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    store = ResearchArtifacts(tmp_path/'reports.json')
    context = {**CTX, 'dedupe_research_turn': True}
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda pair: store.reserve(pair[0], 'detailed', context, pair[1]), [('Google robotics', 'one'), ('Google robot initiatives', 'two')]))
    assert results[0]['id'] == results[1]['id']
    assert len(store.snapshot()['requests']) == 1


def test_new_report_reuses_old_covering_evidence_without_retrieval(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json'); item = saved(store)
    data = store.snapshot(); data['artifacts'][item['id']]['created_epoch'] -= 30*86400; atomic(store.path, data)
    calls = []
    async def synth(*args): return '# Robotics\n\nGoogle robotics uses Gemini to plan actions. [S1]'
    service = ResearchSearch(store, lambda _: '', synthesize=synth)
    service._request = lambda *args: (calls.append(args) or ([], None))
    result = asyncio.run(service.search({'query': 'Google robotics planning', 'mode': 'detailed'}, {**CTX, 'session_id': 'next', 'turn_id': 'next'}, 'new'))
    assert result['status'] == 'completed' and calls == []
    assert store.get(result['research_id'], CTX)['artifact']['sources'][0]['historical']


def test_dispatch_guard_covers_batch_and_all_research_tools(tmp_path):
    store = ResearchArtifacts(tmp_path/'reports.json')
    path = Path(__file__).parents[1]/'server.py'
    handler = next(n for n in ast.parse(path.read_text(encoding='utf-8')).body if isinstance(n, ast.AsyncFunctionDef) and n.name == '_dispatch_scoped_aegis_tool')
    env = {'asyncio': asyncio, 'ALL_AEGIS_TOOLS': [{'name': n} for n in ['search_web', 'run_action_batch']], 'get_research_services': lambda: (store, None)}
    exec(compile(ast.Module(body=[handler], type_ignores=[]), str(path), 'exec'), env)
    arguments = {'actions': [{'name': 'search_web', 'arguments': {'query': 'Google robotics'}}]}
    result = asyncio.run(env[handler.name]('run_action_batch', arguments, {**CTX, 'user_text': 'Do you know about Google robotics?'}, 'model-call'))
    assert result['status'] == 'confirmation_required'
    arguments['actions'] *= 2
    assert asyncio.run(env[handler.name]('run_action_batch', arguments, {**CTX, 'user_text': 'Research Google robotics'}, 'model-call'))['reason'] == 'combine_research_subjects_in_one_request'


@pytest.mark.parametrize('selected,markdown', [
    ('GoogleDeepMind robotics', '**Google**DeepMind robotics [S1].'),
    ('ModelProvider\nGeminiGoogle', '| Model | Provider |\n|---|---|\n| Gemini | Google |'),
    ('Google robotics uses Gemini.', 'Google robotics [S1,S2] uses [Gemini](https://example.com).'),
    ('The robot’s plan — full width A', 'The robot\'s plan - full width Ａ'),
    ('Google robotics\nPlanning', '## Google robotics\n\n### Planning'),
])
def test_selection_survives_rendering_boundaries(selected, markdown):
    assert matches_selection(selected, markdown)


def test_selection_rejects_invented_or_spliced_passages_and_preserves_protected_content():
    assert not matches_selection('Google can teleport', '# Google\n\nGoogle robotics plans actions.')
    assert not matches_selection('Google plans', 'Google robotics plans actions.')
    assert reader_text('## 🚀 Robotics\n\nUseful ✅ prose.\n\n`🚀`\n\n> Quoted ✅ evidence.') == '##  Robotics\n\nUseful  prose.\n\n`🚀`\n\n> Quoted ✅ evidence.'


def test_selection_endpoint_checks_scope_revision_and_formatted_text(tmp_path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from astra_ai.ui.backend.workspace_api import WorkspaceService
    store = ResearchArtifacts(tmp_path/'reports.json')
    item = store.save('Robot models', 'detailed', '# Robot models\n\n| Model | Provider |\n|---|---|\n| Gemini | Google |\n\nGoogle **robotics** [S1] uses Gemini.', [SOURCE], [], CTX, 'formatted')
    app = FastAPI()
    workspace = WorkspaceService(app, SimpleNamespace(), SimpleNamespace(live_memory=SimpleNamespace(memory_path=tmp_path/'memory.json')), {}, {}, lambda: (store, None), lambda request: CTX, None)
    with TestClient(app) as client:
        endpoint = '/api/research/'+item['id']+'/selections'
        result = client.post(endpoint, json={'revision': item['revision'], 'text': 'ModelProvider\nGeminiGoogle', 'origin': {}})
        assert result.status_code == 200, result.text
        assert result.json()['page_id'] == item['id']
        assert client.post(endpoint, json={'revision': 'unavailable', 'text': 'Google robotics'}).status_code == 409
        assert client.post(endpoint, json={'revision': item['revision'], 'text': 'Invented robot model'}).status_code == 422
        workspace.request_context = lambda request: {**CTX, 'project_id': 'other'}
        assert client.post(endpoint, json={'revision': item['revision'], 'text': 'Google robotics'}).status_code == 409
