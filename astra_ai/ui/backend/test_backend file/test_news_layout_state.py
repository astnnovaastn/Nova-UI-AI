from pathlib import Path

from news_layout_state import (
    create_layout,
    default_layout_state,
    delete_layout,
    get_active_layout,
    set_active_layout,
    update_layout,
    load_layout_state,
)


def layout(layout_id: str, name: str = 'Editorial'):
    return {
        'id': layout_id, 'name': name, 'schemaVersion': 1,
        'grid': {'columns': 12, 'gap': 14},
        'blocks': [{'id': 'headline', 'kind': 'headline', 'binding': 'headline', 'layout': {'desktop': {'x': 0, 'y': 0, 'w': 12, 'minRows': 2}}}],
    }


def test_layouts_create_update_activate_and_preserve_a_default(tmp_path: Path):
    state = default_layout_state()
    state = create_layout(state, layout('custom-1'))
    state = update_layout(state, 'custom-1', {**layout('custom-1', 'Research'), 'updatedAt': 'ignored'})
    state = set_active_layout(state, 'custom-1')

    assert get_active_layout(state)['name'] == 'Research'
    assert state['activeLayoutId'] == 'custom-1'
    assert len(state['layouts']) == 2


def test_deleting_the_active_layout_recovers_to_default(tmp_path: Path):
    state = create_layout(default_layout_state(), layout('custom-1'))
    state = set_active_layout(state, 'custom-1')
    state = delete_layout(state, 'custom-1')

    assert state['activeLayoutId'] == 'default-aegis'
    assert get_active_layout(state)['id'] == 'default-aegis'


def test_v1_layouts_migrate_to_the_current_schema_without_losing_blocks(tmp_path: Path):
    data_dir = tmp_path / 'layouts'
    data_dir.mkdir()
    (data_dir / 'news_layouts.json').write_text(
        '{"schemaVersion": 1, "activeLayoutId": "legacy", "layouts": ['
        '{"id":"legacy","name":"Legacy","schemaVersion":1,"grid":{"columns":12,"gap":14},'
        '"blocks":[{"id":"headline","kind":"headline","binding":"headline",'
        '"layout":{"desktop":{"x":0,"y":0,"w":12,"minRows":2}}}]}]}',
        encoding='utf-8',
    )

    state = load_layout_state(data_dir)

    assert state['activeLayoutId'] == 'legacy'
    assert state['layouts'][1]['schemaVersion'] == 2
    assert state['layouts'][1]['blocks'][0]['label'] == 'Headline'
