import asyncio
import json
import pytest
from theme_state import ThemeStore, ThemeStateError

def test_default_survives_new_store_and_tracks_edits(tmp_path):
    store = ThemeStore(tmp_path)
    item = store.create({'name':'Saved theme','baseThemeId':'ocean','widgetOverrides':{'calendar':{'accent':'#ffffff'}}})
    store.set_default(item['id'])
    first = store.startup()
    assert store.startup()["revision"] == first["revision"]
    assert ThemeStore(tmp_path).startup()['theme']['id'] == item['id']
    store.update(item['id'], {'tokens':{'accent':'#aabbcc'}})
    assert store.startup()['revision'] != first['revision']
    assert store.startup()['theme']['tokens']['accent'] == '#aabbcc'

def test_import_invalid_second_theme_writes_nothing(tmp_path):
    store = ThemeStore(tmp_path)
    with pytest.raises(ThemeStateError):
        store.import_items({'themes':[{'name':'Valid','baseThemeId':'forest'}, {'name':'Invalid','tokens':{'accent':'broken'}}]})
    assert store.list()['custom'] == []

def test_missing_default_falls_back_without_crashing(tmp_path):
    store = ThemeStore(tmp_path)
    store.settings_path.write_text(json.dumps({'defaultThemeId':'missing'}))
    assert store.startup()['theme']['id'] == 'dark'
    store.settings_path.write_text('broken')
    assert store.startup()['theme']['id'] == 'dark'

def test_default_delete_requires_replacement(tmp_path):
    store = ThemeStore(tmp_path)
    item = store.create({'name':'Temporary'})
    store.set_default(item['id'])
    with pytest.raises(ThemeStateError): store.delete(item['id'])
    store.delete(item['id'], 'forest')
    assert store.startup()['defaultThemeId'] == 'forest'

def test_duplicate_has_independent_identity_and_preserves_overrides(tmp_path):
    store = ThemeStore(tmp_path)
    source = store.create({'name':'Original','widgetOverrides':{'calendar':{'surface':'#112233'}}})
    copy = store.duplicate(source['id'])
    assert copy['id'] != source['id']
    assert copy['widgetOverrides'] == source['widgetOverrides']
    store.update(copy['id'], {'name':'Renamed'})
    assert store.get(source['id'])['name'] == 'Original'


def test_non_object_settings_falls_back(tmp_path):
    store = ThemeStore(tmp_path)
    store.settings_path.write_text('[]')
    assert store.startup()['defaultThemeId'] == 'dark'
