"""V29 typed canvas objects in Zephium's artifact schemas.

The shapes follow zephium-app/src/work_lead/schema.rs (MPL-2.0): the 13 kinds a lead may
create, plus `project` and `page`, which AEGIS builds itself from what it read. A model never
supplies a URL or a picture directly: picks and list items name a gathered reference (`ref`),
and the URL and images are filled in here from what the tools actually recorded.
"""
from __future__ import annotations

import re
from urllib.parse import urlsplit

KINDS = ('reply', 'picks', 'plan', 'list', 'sheet', 'plot', 'diagram', 'code', 'diff', 'document',
         'draft', 'media', 'subject', 'project', 'page')
MODEL_KINDS = KINDS[:13]
FACETS = ('stay', 'flight', 'product', 'place', 'restaurant', 'job', 'course', 'video', 'repo', 'service',
          'company', 'person', 'event', 'article', 'other')
COLUMN_KINDS = ('text', 'number', 'money', 'percent', 'date', 'duration', 'yes_no', 'rating', 'link', 'entity', 'tag')
PLOT_STYLES = ('bar', 'bar_horizontal', 'bar_stacked', 'bar_grouped', 'line', 'area', 'area_stacked',
               'donut', 'radial', 'radar', 'range')
NODE_KINDS = ('client', 'edge', 'gateway', 'service', 'worker', 'model', 'store', 'queue', 'cache',
              'storage', 'external', 'other')
STEP_KINDS = ('travel', 'stay', 'event', 'task', 'milestone', 'note')
LIST_STYLES = ('todo', 'messages', 'reading', 'requirements', 'questions')
DESTINATIONS = ('slack', 'email', 'linkedin', 'x', 'github', 'message')
TONES = ('active', 'done', 'waiting', 'blocked', 'closed')
LANGUAGES = ('text', 'python', 'typescript', 'javascript', 'tsx', 'jsx', 'svelte', 'rust', 'go', 'java', 'c', 'cpp',
             'csharp', 'css', 'html', 'json', 'yaml', 'toml', 'sql', 'shell', 'markdown', 'diff')

#: Every model-written object is described to the lead with these shapes.
SHAPES = {
    'reply': '{headline, text, figures?:[{label,value,note?}], points?:[text]}',
    'picks': '{facet: one of ' + '/'.join(FACETS) + ', items:[{ref?: a gathered reference id like I3 or S2, name, subtitle?, why?, tags?:[<=3 words], recommended?: bool, facts?:[{label,value,kind:text|yes|no|partial|rating}], price?:{display}, when?, duration?}]}',
    'plan': '{steps:[{when?, date?: YYYY-MM-DD, title, detail?, kind: ' + '/'.join(STEP_KINDS) + ', cost?, place?}], total?:{label,value}, checkable?: bool, calendar?: bool}',
    'list': '{style: ' + '/'.join(LIST_STYLES) + ', items:[{title, detail?, due?, done?: bool, priority?: "high", from?:{app?, who?, when?, quote?}, ref?}]}',
    'sheet': '{columns:[{label, kind: ' + '/'.join(COLUMN_KINDS) + ', unit?, currency?, best?: max|min}], rows:[{cells:[string|number|bool|null], ref?}], note?}',
    'plot': '{style: ' + '/'.join(PLOT_STYLES) + ', x:{label?, kind: category|time|linear}, y:{label?, unit?, format: number|money|duration|percent|bytes, currency?}, series:[{name, points:[{x, y}]}], basis: where the numbers come from}',
    'diagram': '{nodes:[{id, name, kind: ' + '/'.join(NODE_KINDS) + ', note?, layer?}], edges:[{from, to, label?}], layers?:[{id, name}]}',
    'code': '{language, text, notes?:[{from: line, to: line, text}]}',
    'diff': '{path, language, summary, hunks:[{old_start, new_start, lines:[{op: ctx|add|del, text}]}]}',
    'document': '{paragraphs:[markdown paragraph; headings as "## Heading"]}',
    'draft': '{destination: ' + '/'.join(DESTINATIONS) + ', to?, subject?, body}',
    'media': '{medium: image|video|audio, ref: a gathered reference id, title?}',
    'subject': '{noun, title, ref?, state?:{label, tone: ' + '/'.join(TONES) + '}, people?:[{label,value}], facts?:[{label,value}], labels?:[text], summary?}',
}


class ObjectFault(ValueError):
    pass


def _text(value, limit, required=False, name='text'):
    if value is None or value == '':
        if required:
            raise ObjectFault('missing_' + name)
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        value = str(value)
    if not isinstance(value, str):
        raise ObjectFault('invalid_' + name)
    value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', value).strip()
    if required and not value:
        raise ObjectFault('missing_' + name)
    return value[:limit] or None


def _one(value, options, default=None, name='value'):
    if value in options:
        return value
    if default is not None:
        return default
    raise ObjectFault('invalid_' + name)


def safe_url(value):
    if not isinstance(value, str) or len(value) > 2000:
        return None
    try:
        parts = urlsplit(value.strip())
    except ValueError:
        return None
    if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password:
        return None
    return value.strip()


def _clean(row):
    return {k: v for k, v in row.items() if v not in (None, [], {}, '')}


def _labelled(rows, limit):
    out = []
    for row in (rows or [])[:limit]:
        if isinstance(row, dict):
            label, value = _text(row.get('label'), 60), _text(row.get('value'), 200)
            if label and value:
                out.append({'label': label, 'value': value})
    return out


class References:
    """What the tools recorded: S-ids for pages and sources, I-ids for images, R-ids for files."""

    def __init__(self, rows=()):
        self.rows = {}
        for row in rows:
            if isinstance(row, dict) and row.get('id'):
                self.rows[str(row['id'])] = row

    def get(self, ref):
        return self.rows.get(str(ref or '').strip())

    def source_ids(self, refs):
        return [r for r in refs if r in self.rows and str(r).startswith('S')]


def _picks(data, refs):
    items = []
    for raw in (data.get('items') or [])[:24]:
        if not isinstance(raw, dict):
            continue
        name = _text(raw.get('name'), 120)
        if not name:
            continue
        found = refs.get(raw.get('ref'))
        item = {'name': name, 'subtitle': _text(raw.get('subtitle'), 120), 'why': _text(raw.get('why'), 240),
                'when': _text(raw.get('when'), 60), 'duration': _text(raw.get('duration'), 40)}
        tags = [t for t in (_text(tag, 24) for tag in (raw.get('tags') or [])[:3]) if t]
        if tags:
            item['tags'] = tags
        if raw.get('recommended') is True:
            item['recommended'] = True
        facts = []
        for fact in (raw.get('facts') or [])[:8]:
            if isinstance(fact, dict) and _text(fact.get('label'), 40) and _text(fact.get('value'), 120):
                facts.append({'label': _text(fact['label'], 40), 'value': _text(fact['value'], 120),
                              'kind': _one(fact.get('kind'), ('text', 'yes', 'no', 'partial', 'rating'), 'text')})
        if facts:
            item['facts'] = facts
        price = raw.get('price')
        if isinstance(price, dict) and _text(price.get('display'), 40):
            item['price'] = {'display': _text(price['display'], 40)}
        if found:
            url = safe_url(found.get('page') or found.get('url'))
            if url:
                item['url'] = url
            pictures = [u for u in (safe_url(p) for p in (found.get('images') or [found.get('image')])) if u][:3]
            if pictures:
                item['image_candidates'] = pictures
            if found.get('maker') and not item.get('subtitle'):
                item['subtitle'] = _text(found['maker'], 120)
            item['source'] = found['id']
        items.append(_clean(item))
    if not items:
        raise ObjectFault('empty_picks')
    if not any(i.get('recommended') for i in items):
        items[0]['recommended'] = True
    return {'facet': _one(data.get('facet'), FACETS, 'other'), 'items': items}


def _plan(data, refs):
    steps = []
    for raw in (data.get('steps') or [])[:40]:
        if not isinstance(raw, dict) or not _text(raw.get('title'), 120):
            continue
        date = raw.get('date') if isinstance(raw.get('date'), str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', raw.get('date')) else None
        steps.append(_clean({'when': _text(raw.get('when'), 40), 'date': date, 'title': _text(raw['title'], 120),
                             'detail': _text(raw.get('detail'), 400), 'kind': _one(raw.get('kind'), STEP_KINDS, 'task'),
                             'cost': _text(raw.get('cost'), 40), 'place': _text(raw.get('place'), 80)}))
    if not steps:
        raise ObjectFault('empty_plan')
    # A calendar needs dated steps; undated weeks or phases read as a timeline instead.
    dated = sum(1 for step in steps if step.get('date'))
    out = {'steps': steps, 'checkable': bool(data.get('checkable')), 'calendar': bool(data.get('calendar')) and dated >= max(1, len(steps) // 2)}
    total = data.get('total')
    if isinstance(total, dict) and _text(total.get('label'), 40) and _text(total.get('value'), 40):
        out['total'] = {'label': _text(total['label'], 40), 'value': _text(total['value'], 40)}
    return out


def _list(data, refs):
    items = []
    for raw in (data.get('items') or [])[:40]:
        if not isinstance(raw, dict) or not _text(raw.get('title'), 160):
            continue
        item = {'title': _text(raw['title'], 160), 'detail': _text(raw.get('detail'), 400), 'due': _text(raw.get('due'), 40)}
        if raw.get('done') is True:
            item['done'] = True
        if raw.get('priority') == 'high':
            item['priority'] = 'high'
        found = refs.get(raw.get('ref'))
        frm = raw.get('from') if isinstance(raw.get('from'), dict) else {}
        frm = _clean({'app': _text(frm.get('app'), 30), 'who': _text(frm.get('who'), 80), 'when': _text(frm.get('when'), 40),
                      'quote': _text(frm.get('quote'), 240)})
        if found:
            item['source'] = found['id']
            if found.get('url') and safe_url(found['url']):
                frm['url'] = found['url']
        if frm:
            item['from'] = frm
        items.append(_clean(item))
    if not items:
        raise ObjectFault('empty_list')
    return {'style': _one(data.get('style'), LIST_STYLES, 'todo'), 'items': items}


def _sheet(data, refs):
    columns = []
    for raw in (data.get('columns') or [])[:12]:
        if isinstance(raw, dict) and _text(raw.get('label'), 40):
            columns.append(_clean({'label': _text(raw['label'], 40), 'kind': _one(raw.get('kind'), COLUMN_KINDS, 'text'),
                                   'unit': _text(raw.get('unit'), 12), 'currency': _text(raw.get('currency'), 3),
                                   'best': raw.get('best') if raw.get('best') in ('max', 'min') else None}))
    if not columns:
        raise ObjectFault('empty_sheet')
    rows = []
    for raw in (data.get('rows') or [])[:60]:
        cells = raw.get('cells') if isinstance(raw, dict) else raw
        if not isinstance(cells, list):
            continue
        cells = [c if isinstance(c, (int, float, bool)) or c is None else str(c)[:200] for c in cells[:len(columns)]]
        cells += [None] * (len(columns) - len(cells))
        row = {'cells': cells}
        found = refs.get(raw.get('ref')) if isinstance(raw, dict) else None
        if found:
            row['source'] = found['id']
        rows.append(row)
    if not rows:
        raise ObjectFault('empty_sheet')
    out = {'columns': columns, 'rows': rows}
    if _text(data.get('note'), 300):
        out['note'] = _text(data['note'], 300)
    return out


def _plot(data, refs):
    series = []
    for raw in (data.get('series') or [])[:6]:
        if not isinstance(raw, dict) or not _text(raw.get('name'), 40):
            continue
        points = []
        for p in (raw.get('points') or [])[:60]:
            if isinstance(p, dict) and p.get('x') is not None:
                y = p.get('y')
                points.append({'x': p['x'] if isinstance(p['x'], (int, float)) else str(p['x'])[:40],
                               'y': y if isinstance(y, (int, float)) and not isinstance(y, bool) else None})
        if points:
            series.append({'name': _text(raw['name'], 40), 'points': points})
    if not series:
        raise ObjectFault('empty_plot')
    x = data.get('x') if isinstance(data.get('x'), dict) else {}
    y = data.get('y') if isinstance(data.get('y'), dict) else {}
    return {'style': _one(data.get('style'), PLOT_STYLES, 'bar'),
            'x': _clean({'label': _text(x.get('label'), 40), 'kind': _one(x.get('kind'), ('category', 'time', 'linear'), 'category')}),
            'y': _clean({'label': _text(y.get('label'), 40), 'unit': _text(y.get('unit'), 12),
                         'format': _one(y.get('format'), ('number', 'money', 'duration', 'percent', 'bytes'), 'number'),
                         'currency': _text(y.get('currency'), 3)}),
            'series': series, 'basis': _text(data.get('basis'), 200) or 'From the gathered sources.'}


def _diagram(data, refs):
    nodes, ids = [], set()
    for raw in (data.get('nodes') or [])[:40]:
        if not isinstance(raw, dict):
            continue
        nid, name = _text(raw.get('id'), 60), _text(raw.get('name'), 60)
        if not nid or not name or nid in ids:
            continue
        ids.add(nid)
        nodes.append(_clean({'id': nid, 'name': name, 'kind': _one(raw.get('kind'), NODE_KINDS, 'other'),
                             'note': _text(raw.get('note'), 160), 'layer': _text(raw.get('layer'), 40)}))
    if not nodes:
        raise ObjectFault('empty_diagram')
    edges, seen = [], set()
    for raw in (data.get('edges') or [])[:80]:
        if isinstance(raw, dict) and raw.get('from') in ids and raw.get('to') in ids and raw['from'] != raw['to']:
            key = (raw['from'], raw['to'])
            if key not in seen:
                seen.add(key)
                edges.append(_clean({'from': raw['from'], 'to': raw['to'], 'label': _text(raw.get('label'), 30)}))
    used = {n.get('layer') for n in nodes}
    layers = [{'id': _text(l.get('id'), 40), 'name': _text(l.get('name'), 40)} for l in (data.get('layers') or [])[:8]
              if isinstance(l, dict) and _text(l.get('id'), 40) in used and _text(l.get('name'), 40)]
    return {'nodes': nodes, 'edges': edges, **({'layers': layers} if layers else {})}


def _language(value):
    value = str(value or 'text').lower()
    return {'py': 'python', 'ts': 'typescript', 'js': 'javascript', 'sh': 'shell', 'bash': 'shell', 'md': 'markdown'}.get(value, value if value in LANGUAGES else 'text')


def _code(data, refs):
    text = data.get('text')
    if not isinstance(text, str) or not text.strip():
        raise ObjectFault('empty_code')
    notes = []
    for raw in (data.get('notes') or [])[:12]:
        if isinstance(raw, dict) and isinstance(raw.get('from'), int) and isinstance(raw.get('to'), int) and _text(raw.get('text'), 160):
            notes.append({'from': max(1, raw['from']), 'to': max(raw['from'], raw['to']), 'text': _text(raw['text'], 160)})
    return {'language': _language(data.get('language')), 'text': text[:20000], 'notes': notes}


def _diff(data, refs):
    hunks = []
    for raw in (data.get('hunks') or [])[:12]:
        if not isinstance(raw, dict):
            continue
        lines = [{'op': _one(l.get('op'), ('ctx', 'add', 'del'), 'ctx'), 'text': str(l.get('text', ''))[:400]}
                 for l in (raw.get('lines') or [])[:200] if isinstance(l, dict)]
        if lines:
            hunks.append({'old_start': max(0, int(raw.get('old_start') or 0)), 'new_start': max(0, int(raw.get('new_start') or 0)), 'lines': lines})
    if not hunks:
        raise ObjectFault('empty_diff')
    return {'path': _text(data.get('path'), 200) or 'change', 'language': _language(data.get('language')),
            'summary': _text(data.get('summary'), 240) or 'Proposed change', 'hunks': hunks}


def _document(data, refs):
    paragraphs = [p.strip()[:4000] for p in (data.get('paragraphs') or []) if isinstance(p, str) and p.strip()][:128]
    if not paragraphs:
        raise ObjectFault('empty_document')
    return {'paragraphs': paragraphs}


def _draft(data, refs):
    return _clean({'destination': _one(data.get('destination'), DESTINATIONS, 'message'), 'to': _text(data.get('to'), 120),
                   'subject': _text(data.get('subject'), 160), 'body': _text(data.get('body'), 4000, True, 'body')})


def _media(data, refs):
    found = refs.get(data.get('ref'))
    url = safe_url((found or {}).get('url') or (found or {}).get('image'))
    if not url:
        raise ObjectFault('media_without_recorded_url')
    medium = _one(data.get('medium'), ('image', 'video', 'audio'), 'image')
    return _clean({'medium': medium, 'url': url, 'title': _text(data.get('title') or (found or {}).get('title'), 120),
                   'provider': 'youtube' if 'youtube.com' in url or 'youtu.be' in url else 'file'})


def _subject(data, refs):
    found = refs.get(data.get('ref'))
    url = safe_url((found or {}).get('url')) or ''
    state = data.get('state') if isinstance(data.get('state'), dict) else None
    return _clean({'noun': _text(data.get('noun'), 30, True, 'noun'), 'title': _text(data.get('title'), 120, True, 'title'),
                   'reference': _text(data.get('reference'), 40), 'url': url,
                   'state': {'label': _text(state.get('label'), 30) or 'Open', 'tone': _one(state.get('tone'), TONES, 'active')} if state else None,
                   'people': _labelled(data.get('people'), 8), 'facts': _labelled(data.get('facts'), 10),
                   'labels': [t for t in (_text(x, 24) for x in (data.get('labels') or [])[:6]) if t],
                   'summary': _text(data.get('summary'), 400)}) | {'url': url}


def _reply(data, refs):
    figures = []
    for raw in (data.get('figures') or [])[:6]:
        if isinstance(raw, dict) and _text(raw.get('label'), 40) and _text(raw.get('value'), 40):
            figures.append(_clean({'label': _text(raw['label'], 40), 'value': _text(raw['value'], 40), 'note': _text(raw.get('note'), 80)}))
    points = [p for p in (_text(x, 300) for x in (data.get('points') or [])[:8]) if p]
    return {'headline': _text(data.get('headline'), 120, True, 'headline'), 'text': _text(data.get('text'), 600, True, 'text'),
            'figures': figures, 'points': points}


BUILDERS = {'reply': _reply, 'picks': _picks, 'plan': _plan, 'list': _list, 'sheet': _sheet, 'plot': _plot,
            'diagram': _diagram, 'code': _code, 'diff': _diff, 'document': _document, 'draft': _draft,
            'media': _media, 'subject': _subject}


def build(zkind, data, refs: References):
    if zkind not in BUILDERS:
        raise ObjectFault('unsupported_kind')
    if not isinstance(data, dict):
        raise ObjectFault('invalid_data')
    return BUILDERS[zkind](data, refs)


def canvas_object(oid, zkind, title, data, sources=(), part='', revision=1, task='compose'):
    """The record stored in run.canvas_objects and read by the canvas (`kind: 'zephium'`)."""
    if zkind not in KINDS:
        raise ObjectFault('unsupported_kind')
    return _clean({'id': oid, 'kind': 'zephium', 'zkind': zkind, 'title': (str(title or zkind).strip() or zkind)[:120],
                   'revision': revision, 'task_id': task, 'status': 'recorded', 'data': data,
                   'sources': list(sources), 'part': part or None})
