"""V30: what a finished Work result must contain, a check against it, and the full written document.

V29 composed every Work run in one lead call that was told to make each kind "at most twice, only
when the material supports them", and `_write_work` published the reply alone. A four-week campaign
plan came out as a headline, two sentences and four one-line weeks. Here each workflow names its
deliverables (an object kind, a minimum size, and what it must cover), `missing()` lists the ones a
composition did not meet, and `render()` writes every object into the document the Report opens.

Minimums are floors for a useful result, never targets to pad: the instruction says to stop at what
the material and the request support, and a deliverable the material cannot support is reported as
a gap rather than invented.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Deliverable:
    name: str
    kind: str
    #: Items (plan steps, list items, sheet rows, drafts, document headings) the object needs.
    minimum: int
    covers: str
    #: Extra objects of this kind the workflow may create (drafts for several channels, two sheets).
    up_to: int = 1


def D(name, kind, minimum, covers, up_to=1):
    return Deliverable(name, kind, minimum, covers, up_to)


DELIVERABLES = {
    'campaign-plan': (
        D('Campaign brief', 'document', 5, 'sections "## Objective", "## Audience segments", "## Positioning and key messages", '
          '"## Channels", "## Risks and dependencies"; each a real paragraph or bullets specific to this product'),
        D('Four-week timeline', 'plan', 8, 'at least two dated or "Week N" steps per week with the task, the owner role and the deliverable; '
          'mark launch day and review points as kind "milestone"'),
        D('Content schedule', 'sheet', 8, 'columns Week, Channel, Format, Topic or hook, Owner; one row per planned post or asset'),
        D('Success metrics', 'sheet', 4, 'columns Metric, Target, How it is measured, Review week; targets are proposals, say so in note'),
        D('Draft posts', 'draft', 1, 'ready-to-edit launch copy, one draft per main channel (for example LinkedIn, X, email)', up_to=4),
        D('Responsibilities', 'list', 4, 'style todo: who owns what (roles, not invented names) with due weeks'),
    ),
    'competitor-landscape': (
        D('Competitors', 'picks', 3, 'facet company; one item per competitor with ref, why it matters and 3-5 facts', up_to=1),
        D('Comparison', 'sheet', 3, 'one row per competitor with ref; columns for the attributes the request is about (features, pricing basis, audience)'),
        D('Analysis', 'document', 3, 'sections "## Positioning", "## Where each is strong or weak", "## Gaps and opportunities", citing references like [S2]'),
    ),
    'market-map': (
        D('Market map', 'diagram', 5, 'segments as layers and companies as nodes; edges only for relations the material shows'),
        D('Companies', 'sheet', 5, 'one row per company with ref: segment, what it does, stage or size if stated'),
        D('Observations', 'document', 2, 'sections "## Segments" and "## Gaps", citing references'),
    ),
    'pricing-research': (
        D('Pricing', 'sheet', 3, 'one row per plan with ref: product, plan, price as displayed, billing basis; unknown stays empty'),
        D('Recommendation', 'document', 2, 'sections "## What the prices show" and "## Recommendation"'),
    ),
    'investor-list': (
        D('Investors', 'picks', 4, 'facet company; fit, stage and recent deals as facts, each item with ref'),
        D('Shortlist', 'sheet', 4, 'investor, focus, stage, check size if stated, ref'),
    ),
    'plan-my-day': (
        D('Schedule', 'plan', 4, 'the day in time order with times; meetings from the material, focus blocks proposed'),
        D('Tasks', 'list', 3, 'style todo with priority'),
    ),
    'meeting-prep': (
        D('Agenda', 'list', 3, 'style todo: agenda items with time boxes'),
        D('Brief', 'document', 3, 'sections "## Context", "## What to decide", "## Open questions"'),
        D('Action items', 'list', 2, 'style todo: follow-ups with owner roles', up_to=2),
    ),
    'weekly-status': (
        D('Status report', 'document', 3, 'sections "## Done", "## In progress", "## Risks and asks"'),
        D('Next steps', 'list', 3, 'style todo'),
    ),
    'learning-path': (
        D('Path', 'plan', 5, 'sequenced steps with durations'),
        D('Materials', 'picks', 3, 'facet course or article, each with ref'),
    ),
    'exam-prep': (
        D('Study plan', 'plan', 5, 'dated or "Day N" sessions'),
        D('Topics', 'list', 5, 'style requirements'),
        D('Notes', 'document', 3, 'one section per main topic'),
    ),
    'inbox-triage': (
        D('Triage', 'list', 3, 'style messages with from'),
        D('Replies', 'draft', 1, 'drafts for messages that need an answer', up_to=4),
    ),
    # V33: the screenshot, component inventory and accessibility findings are measured (v29_tasks._teardown_objects);
    # the lead writes what only reading the interface can give, each item about these pages.
    'ui-teardown': (
        D('Design observations', 'list', 3, 'style requirements: layout, visual hierarchy, typography, colour and spacing of the inspected interfaces'
          ' (material.ui_inspection gives their structure, palette and fonts), each item with its page ref'),
        D('UX findings', 'list', 3, 'style requirements: what helps or blocks the task here (primary action, forms, navigation, errors),'
          ' each with its page ref; priority "high" on the ones that block'),
        D('Recommendations', 'list', 3, 'style todo: concrete changes to these interfaces, highest impact first, including fixes for the measured accessibility findings'),
        D('Comparison', 'sheet', 1, 'one row per inspected interface with ref: primary action, navigation, forms, accessibility issues counted, standout pattern'),
    ),
    'moodboard': (
        # The lead makes up to two boards; the helper boards built from each image search fill the rest (v29_tasks._helper_boards).
        D('Boards', 'picks', 2, 'image items with refs that have has_image', up_to=2),
    ),
    'map-a-project': (
        D('Architecture notes', 'document', 3, 'sections "## Layers", "## Main flows", "## Entry points", only from the files read'),
    ),
    'review-a-change': (
        D('Findings', 'list', 1, 'style requirements: each finding with the file and line it is about'),
    ),
    'fix-a-bug': (
        D('Diagnosis', 'list', 1, 'style requirements: cause, evidence line, proposed change'),
    ),
    'explain-code': (
        D('Explanation', 'code', 1, 'the code with notes on the important lines'),
    ),
}
GENERAL = (D('Document', 'document', 3, 'a complete answer with "## " sections'),)


def for_workflow(workflow, outputs=()):
    """Deliverables for this workflow, limited to the kinds the route allows."""
    allowed = set(outputs or ())
    rows = DELIVERABLES.get(workflow or '', GENERAL)
    return tuple(d for d in rows if not allowed or d.kind in allowed)


def size(obj):
    """How many items an object holds, in the unit its deliverable counts."""
    data = obj.get('data') or {}
    kind = obj.get('zkind')
    if kind == 'plan':
        return len(data.get('steps') or [])
    if kind in ('list', 'picks'):
        return len(data.get('items') or [])
    if kind == 'sheet':
        return len(data.get('rows') or [])
    if kind == 'diagram':
        return len(data.get('nodes') or [])
    if kind == 'document':
        paragraphs = data.get('paragraphs') or []
        headings = sum(1 for p in paragraphs if str(p).lstrip().startswith('#'))
        return headings or (1 if paragraphs else 0)
    if kind in ('draft', 'code', 'diff', 'media', 'subject'):
        return 1
    if kind == 'plot':
        return sum(len(s.get('points') or []) for s in data.get('series') or [])
    return 0


def missing(deliverables, objects):
    """Deliverables the objects do not meet: [{name, kind, minimum, found, covers, index}].

    Each object meets at most one deliverable. `index` is the position in `objects` of the thin
    object standing in for it (None when there was none), so a repaired one can replace it."""
    used, gaps = set(), []
    for item in deliverables:
        best = None
        for index, obj in enumerate(objects):
            if index in used or obj.get('zkind') != item.kind:
                continue
            if best is None or size(obj) > size(objects[best]):
                best = index
        found = size(objects[best]) if best is not None else 0
        if best is not None:
            used.add(best)
        if best is not None and found >= item.minimum:
            continue
        gaps.append({'name': item.name, 'kind': item.kind, 'minimum': item.minimum, 'found': found, 'covers': item.covers, 'index': best})
    return gaps


def limits(deliverables):
    """Most objects of each kind a composition may keep."""
    out = {}
    for item in deliverables:
        out[item.kind] = out.get(item.kind, 0) + item.up_to
    return out


def instruction(deliverables):
    lines = [f'- {d.name}: kind "{d.kind}", at least {d.minimum} {"items" if d.kind != "document" else "sections"}'
             + (f', up to {d.up_to} objects' if d.up_to > 1 else '') + f'. Covers: {d.covers}.' for d in deliverables]
    return ('Create every deliverable below as its own object, titled with its name. The minimums are what a usable result needs,'
            ' not a target to pad: write specific content for this request, and when the material cannot support a deliverable,'
            ' create it with what is known and say what is missing in it rather than inventing facts.\n' + '\n'.join(lines))


# -- the written document ---------------------------------------------------------------------

def _cell(value):
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'Yes' if value else 'No'
    return str(value).replace('|', '\\|').replace('\n', ' ')


def _cite(row, numbers):
    source = row.get('source') if isinstance(row, dict) else None
    return f' [{source}]' if source and source in numbers else ''


def render_object(obj, numbers=()):
    """Markdown for one object, under its title."""
    kind, data, title = obj.get('zkind'), obj.get('data') or {}, obj.get('title') or ''
    out = ['## ' + title] if title else []
    if kind == 'document':
        paragraphs = [str(p) for p in data.get('paragraphs') or []]
        # The document's own top heading repeats the title; its sections sit one level below it.
        out += ['', *[('#' + p if p.lstrip().startswith('## ') else p) for p in paragraphs]]
    elif kind == 'plan':
        rows = data.get('steps') or []
        out += ['', '| When | Step | Detail |', '|---|---|---|']
        for step in rows:
            when = step.get('date') or step.get('when') or ''
            name = ('**' + step['title'] + '**') if step.get('kind') == 'milestone' else step['title']
            detail = ' · '.join(filter(None, [step.get('detail'), step.get('place'), step.get('cost')]))
            out.append(f'| {_cell(when)} | {_cell(name)} | {_cell(detail)} |')
        if data.get('total'):
            out += ['', f"{data['total']['label']}: {data['total']['value']}"]
    elif kind == 'list':
        out.append('')
        for item in data.get('items') or []:
            box = ('[x] ' if item.get('done') else '[ ] ') if data.get('style') == 'todo' else ''
            mark = ' *(high priority)*' if item.get('priority') == 'high' else ''
            due = f" — due {item['due']}" if item.get('due') else ''
            frm = item.get('from') or {}
            who = f" — from {frm.get('who')}" if frm.get('who') else ''
            out.append(f"- {box}**{item['title']}**{due}{who}{mark}{_cite(item, numbers)}" + (f": {item['detail']}" if item.get('detail') else ''))
    elif kind == 'sheet':
        columns = data.get('columns') or []
        out += ['', '| ' + ' | '.join(_cell(c['label'] + (f" ({c['unit']})" if c.get('unit') else '')) for c in columns) + ' |',
                '|' + '---|' * len(columns)]
        for row in data.get('rows') or []:
            cells = [_cell(c) for c in row.get('cells') or []]
            if cells and _cite(row, numbers):
                cells[0] += _cite(row, numbers)
            out.append('| ' + ' | '.join(cells) + ' |')
        if data.get('note'):
            out += ['', '*' + data['note'] + '*']
    elif kind == 'draft':
        head = ' · '.join(filter(None, [data.get('destination', '').capitalize(), ('to ' + data['to']) if data.get('to') else '', data.get('subject')]))
        out += ['', f'*{head}*' if head else '', '']
        out += ['> ' + line if line else '>' for line in str(data.get('body', '')).split('\n')]
    elif kind == 'picks':
        out.append('')
        for item in data.get('items') or []:
            facts = '; '.join(f"{f['label']}: {f['value']}" for f in item.get('facts') or [])
            link = f"[{item['name']}]({item['url']})" if item.get('url') else item['name']
            extra = ' — '.join(filter(None, [item.get('subtitle'), item.get('why'), facts, (item.get('price') or {}).get('display')]))
            star = ' ★' if item.get('recommended') else ''
            out.append(f'- **{link}**{star}{_cite(item, numbers)}' + (f': {extra}' if extra else ''))
    elif kind == 'plot':
        series = data.get('series') or []
        xs = list(dict.fromkeys(str(p.get('x')) for s in series for p in s.get('points') or []))
        out += ['', '| ' + _cell((data.get('x') or {}).get('label') or '') + ' | ' + ' | '.join(_cell(s.get('name')) for s in series) + ' |',
                '|' + '---|' * (len(series) + 1)]
        for x in xs:
            values = [next((p.get('y') for p in s.get('points') or [] if str(p.get('x')) == x), None) for s in series]
            out.append(f'| {_cell(x)} | ' + ' | '.join(_cell(v) for v in values) + ' |')
        if data.get('basis'):
            out += ['', '*Basis: ' + str(data['basis']) + '*']
    elif kind == 'diagram':
        names = {n['id']: n.get('name') or n['id'] for n in data.get('nodes') or []}
        out += ['', '```mermaid', 'flowchart LR']
        for node_id, name in names.items():
            safe_id = ''.join(ch if ch.isalnum() else '_' for ch in node_id) or 'n'
            out.append(f'  {safe_id}["{str(name).replace(chr(34), chr(39))}"]')
        for edge in data.get('edges') or []:
            a = ''.join(ch if ch.isalnum() else '_' for ch in str(edge.get('from')))
            b = ''.join(ch if ch.isalnum() else '_' for ch in str(edge.get('to')))
            label = str(edge.get('label') or '').replace('|', '/').replace('"', "'")
            out.append(f'  {a} -->|{label}| {b}' if label else f'  {a} --> {b}')
        out.append('```')
    elif kind in ('code', 'diff'):
        language = data.get('language') or ''
        if kind == 'diff':
            body = '\n'.join(('+' if l['op'] == 'add' else '-' if l['op'] == 'del' else ' ') + l['text'] for h in data.get('hunks') or [] for l in h.get('lines') or [])
            language = 'diff'
        else:
            body = data.get('text') or ''
        # V34: a grounded excerpt names its file; its notes are excerpt positions, shown as file line numbers.
        offset = (data.get('start') or 1) - 1 if kind == 'code' else 0
        out += [''] + ([f"`{data['path']}`"] if kind == 'code' and data.get('path') else []) + ['```' + language, body, '```']
        for note in data.get('notes') or []:
            a, b = (note.get('from') or 0) + offset, (note.get('to') or 0) + offset
            out.append(f"- Line {a}: {note.get('text')}" if a == b else f"- Lines {a}–{b}: {note.get('text')}")
    elif kind == 'media':
        url = data.get('url') or ''
        out += ['', f"![{_cell(data.get('title') or title)}]({url})" if url else '']
    elif kind == 'subject':
        out += ['', data.get('summary') or '']
        out += [f"- {f['label']}: {f['value']}" for f in (data.get('facts') or []) + (data.get('people') or [])]
    elif kind == 'project':
        out += ['', data.get('summary') or '', '', f"Root: `{data.get('root', '')}`"]
    else:
        return []
    return [line for line in out if line is not None]


#: The order a reader meets results in: the written brief first, then plans, tables, lists and drafts.
ORDER = {'media': -1, 'document': 0, 'subject': 1, 'project': 1, 'plan': 2, 'sheet': 3, 'plot': 4, 'picks': 5, 'diagram': 6,
         'list': 7, 'draft': 8, 'code': 9, 'diff': 9}


def render(reply, objects, evidence=()):
    """The Work report: the reply, then every object in reading order, then the sources it cites."""
    numbers = {e.get('id') for e in evidence or [] if e.get('id')}
    lines = ['# ' + (reply.get('headline') or 'Result'), '', reply.get('text', '')]
    if reply.get('figures'):
        lines += [''] + [f"- **{f['label']}:** {f['value']}" + (f" ({f['note']})" if f.get('note') else '') for f in reply['figures']]
    if reply.get('points'):
        lines += [''] + ['- ' + p for p in reply['points']]
    for obj in sorted((o for o in objects if o.get('zkind') != 'reply'), key=lambda o: ORDER.get(o.get('zkind'), 11)):
        block = render_object(obj, numbers)
        if block:
            lines += [''] + block
    cited = [e for e in evidence or [] if e.get('url')]
    if cited:
        lines += ['', '## Sources', ''] + [f"- [{e['id']}] [{e.get('title') or e['url']}]({e['url']})" + (f" — {e['provider']}" if e.get('provider') else '') for e in cited]
    return '\n'.join(lines).strip()
