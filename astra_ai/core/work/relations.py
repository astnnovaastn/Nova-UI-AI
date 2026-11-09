"""Typed relationships between the real objects of a work run.

Every string the canvas draws is one of these. A relation names two objects by reference, says
what joins them, which recorded event created it, and how far it holds. Nothing here is drawn
for appearance: a relation exists only because the run did the thing it describes.

Object references:
  request             the person's request
  agent:<role>        lead, discovery, analysis or verification
  query:<n>           the n-th web search of the run (1-based, in the order it was run)
  source:<S#>         an evidence record, by its stable citation ID
  map:<node id>       a knowledge-map node
  report              the published report
"""
from __future__ import annotations

import hashlib
import re
import time
from dataclasses import dataclass, field

#: Status of the relation itself, not of either endpoint.
STATUSES = ('active', 'complete', 'verified', 'contested', 'failed')

#: relation type -> (allowed source kinds, allowed target kinds, short label)
TYPES = {
    'plans': ({'request'}, {'agent'}, 'Plan'),
    'assigns': ({'agent'}, {'agent'}, 'Task'),
    'searches': ({'agent'}, {'query'}, 'Search'),
    'found': ({'query'}, {'source'}, 'Source'),
    'reads': ({'agent'}, {'source'}, 'Read'),
    'evidence': ({'source'}, {'agent'}, 'Evidence'),
    'verifies': ({'agent'}, {'agent'}, 'Verification'),
    'delivers': ({'agent'}, {'agent'}, 'Findings'),
    'cites': ({'source'}, {'report'}, 'Citation'),
    'writes': ({'agent'}, {'report'}, 'Report'),
    'supports': ({'source'}, {'map'}, 'Evidence'),
    'relates': ({'map'}, {'map'}, ''),
    'models': ({'agent'}, {'map'}, 'Model'),
}
REF = re.compile(r'^(request|report|agent:(lead|discovery|analysis|verification)|query:\d{1,3}|source:S\d{1,3}|map:[^\s]{1,80})$')


class RelationError(ValueError):
    pass


def kind_of(ref):
    return ref.split(':', 1)[0]


@dataclass
class Relation:
    id: str
    type: str
    source: str
    target: str
    label: str = ''
    status: str = 'complete'
    #: The trace event that recorded the action this relation describes.
    event_seq: int = 0
    at: float = 0
    #: Evidence the relation rests on: a source ID and its URL, when there is one.
    evidence_id: str = ''
    url: str = ''
    note: str = ''
    detail: dict = field(default_factory=dict)


def relation_id(kind, source, target, key=''):
    digest = hashlib.sha1('|'.join((kind, source, target, key)).encode('utf-8')).hexdigest()[:12]
    return 'rel-' + digest


def validate(kind, source, target, status='complete'):
    """Raises when a relation would join the wrong kinds of object or a malformed reference."""
    if kind not in TYPES:
        raise RelationError('unknown_type')
    if status not in STATUSES:
        raise RelationError('unknown_status')
    for ref in (source, target):
        if not REF.match(ref):
            raise RelationError('invalid_reference')
    if source == target:
        raise RelationError('self_relation')
    sources, targets, _ = TYPES[kind]
    if kind_of(source) not in sources or kind_of(target) not in targets:
        raise RelationError('invalid_endpoints')


def make(kind, source, target, *, key='', label=None, status='complete', event_seq=0, evidence_id='', url='', note='', detail=None):
    validate(kind, source, target, status)
    return Relation(
        id=relation_id(kind, source, target, key),
        type=kind, source=source, target=target,
        label=(TYPES[kind][2] if label is None else str(label))[:40],
        status=status, event_seq=int(event_seq or 0), at=time.time(),
        evidence_id=evidence_id, url=str(url)[:500], note=str(note)[:300], detail=dict(detail or {}),
    )


def upsert(rows, relation):
    """Adds a relation, or updates the one with the same identity. Returns the stored row."""
    from .contracts import as_dict
    data = as_dict(relation)
    for index, row in enumerate(rows):
        if row.get('id') == relation.id:
            # The first event that created it stays its provenance.
            data['event_seq'] = row.get('event_seq') or data['event_seq']
            data['at'] = row.get('at') or data['at']
            rows[index] = data
            return data
    rows.append(data)
    return data
