"""Offline public clarification and recommendation-save integration."""
import asyncio
from test_work_runs import FakeAdapter, build, start, CONTEXT

def test_question_options_and_answer_survive_resume_and_public_projection(tmp_path):
    adapter=FakeAdapter(plan={'clarification':'Which year?', 'clarification_options':['2025','2026']})
    service,artifacts,_=build(tmp_path,adapter)
    identifier=start(service,artifacts)
    assert asyncio.run(service.run(identifier,CONTEXT))['needs_input']
    run=service.store.get(identifier)
    assert service.store.public(run)['request']['clarifications'][0]['options']==['2025','2026']
    assert asyncio.run(service.answer(identifier,CONTEXT,' '))['status']=='unchanged'
    assert asyncio.run(service.answer(identifier,CONTEXT,'2026'))['status']=='accepted'
    assert asyncio.run(service.answer(identifier,CONTEXT,'2025'))['status']=='unchanged'
    assert asyncio.run(service.run(identifier,CONTEXT))['status']=='completed'
    public=service.store.public(service.store.get(identifier))
    assert public['request']['clarifications'][0]['answer']=='2026'
    assert public['request']['answer']=='2026'
    assert any(c['payload'].get('answer_to_your_question')=='2026' for c in adapter.calls)

def test_saved_recommendation_keeps_metadata_and_why(tmp_path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from types import SimpleNamespace
    import threading
    from astra_ai.ui.backend.api.workspace_v21 import install
    from astra_ai.ui.backend.task_backend.store import TaskStore
    app=FastAPI();state=SimpleNamespace(notes_state_dir=tmp_path/'notes',notes_state_lock=threading.RLock())
    notes,_=install(app,state=state,task_store=TaskStore(tmp_path/'tasks'),owner_only=lambda _:None,task_owner=lambda _:'fixture')
    obj={'id':'reading','title':'Core readings','kind':'comparison','recommendationKind':'article','recommendations':[{'id':'b','title':'Book','why':'Read before designing memory','facts':[{'label':'Level','value':'Beginner'}]}]}
    client=TestClient(app)
    assert client.post('/api/workspace/v21/from-result',json={'action':'note','object':obj}).status_code==200
    content=notes.read()['notes'][0]['content']
    assert 'Read before designing memory' in content and 'Beginner' in content


def test_recommendations_validate_without_losing_presentation_fields():
    import pytest
    from astra_ai.core.work.workspace_objects import validate
    obj={'id':'r','kind':'comparison','title':'Read','revision':1,'recommendationKind':'article','recommendations':[{'title':'Book','url':'https://example.org','facts':[{'label':'Level','value':'Beginner'}]}],'planTotal':{'label':'Pace','value':'12 weeks'}}
    assert validate(obj)['recommendations']==obj['recommendations']
    obj['recommendations'][0]['url']='javascript:alert(1)'
    with pytest.raises(ValueError,match='invalid_recommendation_url'):validate(obj)
