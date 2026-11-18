"""Typed contracts for a work run, plus the JSON schemas models must answer with.

A run is saved as plain JSON, so each contract converts with `asdict` and back with `load`.
Schemas use the strict subset every provider accepts: all properties required, no extras.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from typing import Any

MODES = ('direct', 'quick', 'deep', 'structured')
ROLES = ('discovery', 'analysis', 'verification')
#: worker_d is a second analyst that runs analysis branches in parallel; worker_e writes Deep Research sections.
SLOTS = ('lead', 'worker_a', 'worker_b', 'worker_c', 'worker_d', 'worker_e')
ROLE_SLOT = {'discovery': 'worker_a', 'analysis': 'worker_b', 'verification': 'worker_c', 'synthesis': 'worker_e', 'lead': 'lead'}


def load(kind, data):
    """Builds a contract from saved JSON, ignoring fields a later version removed."""
    names = {item.name for item in fields(kind)}
    return kind(**{key: value for key, value in (data or {}).items() if key in names})


@dataclass
class WorkRequest:
    query: str
    workflow: str = ''
    mode: str = ''
    #: Canvas nodes the person chose for this task: id, kind, title, url and summary only.
    chosen: list = field(default_factory=list)
    #: The research those nodes belong to; its saved sources may seed this run's evidence.
    from_research: str = ''


@dataclass
class RunBudget:
    model_calls: int = 6
    tokens: int = 40000
    searches: int = 3
    sources: int = 6
    workers: int = 1
    deadline_seconds: int = 300
    concurrency: int = 2
    #: Tokens kept back so workers cannot leave the lead without room to finish.
    lead_reserve: int = 8000
    #: The lead's adaptive card pass (AEGIS_WORK_ADAPTIVE_CARDS): its own bounded room, so a short run
    #: (a day plan, a weekly status) can still place its cards. Spent only when the pass runs.
    card_tokens: int = 0
    card_calls: int = 0


@dataclass
class TaskPlan:
    title: str = ''
    acknowledgement: str = ''
    intent: str = ''
    constraints: list = field(default_factory=list)
    mode: str = 'quick'
    clarification: str = ''
    clarification_options: list = field(default_factory=list)
    needs_web: bool = True
    queries: list = field(default_factory=list)
    sections: list = field(default_factory=list)
    assignments: list = field(default_factory=list)
    reasoning_summary: str = ''


@dataclass
class AgentAssignment:
    agent: str
    role: str
    task: str
    provider: str = ''
    model: str = ''
    state: str = 'assigned'


@dataclass
class AgentResult:
    agent: str
    role: str
    state: str
    summary: str = ''
    provider: str = ''
    model: str = ''
    tokens: int = 0
    seconds: float = 0
    failure: str = ''
    data: dict = field(default_factory=dict)


@dataclass
class EvidenceRecord:
    """One retrieved source. `id` is its stable citation marker and never changes during a run."""
    id: str
    url: str
    title: str
    domain: str
    retrieved_at: str
    query: str = ''
    provider: str = ''
    excerpt: str = ''
    relevance: int = 0
    credibility: int = 0
    assessment: str = ''
    fetched: bool = False
    # V30 provenance, the same for every retrieval route (browser read, open API, keyed search, paid search, files).
    # All optional, so records saved before V30 load unchanged.
    source_type: str = ''
    canonical_url: str = ''
    discovered_by: str = ''
    agent: str = ''
    task: str = ''
    published: str = ''
    media: list = field(default_factory=list)
    verification: str = ''


@dataclass
class Artifact:
    id: str
    kind: str
    title: str
    research_id: str = ''
    revision: str = ''
    data: dict = field(default_factory=dict)


@dataclass
class ResearchEvent:
    """What the canvas reads. Saved through the research trace, which adds `seq` and `at`."""
    kind: str
    phase: str = ''
    status: str = 'done'
    detail: dict[str, Any] = field(default_factory=dict)


@dataclass
class RunState:
    run_id: str
    research_id: str
    schema_version: int = 1
    task_graph: dict = field(default_factory=dict)
    canvas_objects: list = field(default_factory=list)
    card_state: dict = field(default_factory=dict)
    coverage: dict = field(default_factory=dict)
    state: str = 'queued'
    stage: str = ''
    request: dict = field(default_factory=dict)
    budget: dict = field(default_factory=dict)
    plan: dict = field(default_factory=dict)
    skill_snapshots: list | None = None
    assignments: list = field(default_factory=list)
    results: dict = field(default_factory=dict)
    evidence: list = field(default_factory=list)
    artifacts: list = field(default_factory=list)
    #: Typed relationships between the run's real objects; see relations.py.
    relations: list = field(default_factory=list)
    done: dict = field(default_factory=dict)
    usage: dict = field(default_factory=dict)
    failure: str = ''
    created: float = 0
    updated: float = 0


def as_dict(contract):
    return asdict(contract)


def _object(properties):
    return {'type': 'object', 'additionalProperties': False, 'required': list(properties), 'properties': properties}


TEXT = {'type': 'string'}
TEXTS = {'type': 'array', 'items': TEXT}
SOURCE_IDS = {'type': 'array', 'items': TEXT}

LEAD_PLAN = _object({
    'title': TEXT,
    'acknowledgement': TEXT,
    'intent': TEXT,
    'constraints': TEXTS,
    'mode': {'type': 'string', 'enum': list(MODES)},
    'clarification': TEXT,
    'clarification_options': TEXTS,
    'needs_web': {'type': 'boolean'},
    'queries': TEXTS,
    'sections': TEXTS,
    'assignments': {'type': 'array', 'items': _object({
        'role': {'type': 'string', 'enum': list(ROLES)},
        'task': TEXT,
    })},
    'reasoning_summary': TEXT,
})

#: V30: a Work lead also names the official pages it already knows (product, docs, pricing, papers), which the
#: agent browser reads directly before any search, the way Zephium's lead calls web_fetch on a known URL.
WORK_PLAN = _object({**LEAD_PLAN['properties'], 'urls': TEXTS})

SOURCE_ASSESSMENT = _object({
    'ranked': {'type': 'array', 'items': _object({
        'id': TEXT,
        'relevance': {'type': 'integer'},
        'credibility': {'type': 'integer'},
        'reason': TEXT,
    })},
    'follow_up_queries': TEXTS,
    'summary': TEXT,
})

ANALYSIS = _object({
    'findings': {'type': 'array', 'items': _object({'claim': TEXT, 'source_ids': SOURCE_IDS, 'confidence': {'type': 'string', 'enum': ['high', 'medium', 'low']}})},
    'comparison': TEXT,
    'open_questions': TEXTS,
    'summary': TEXT,
})

VERIFICATION = _object({
    'checks': {'type': 'array', 'items': _object({'finding': {'type': 'integer'}, 'verdict': {'type': 'string', 'enum': ['supported', 'contested', 'unsupported']}, 'note': TEXT, 'source_ids': SOURCE_IDS})},
    'gaps': {'type': 'array', 'items': _object({'question': TEXT, 'query': TEXT})},
    'summary': TEXT,
})

KNOWLEDGE_MAP = _object({
    'title': TEXT,
    'groups': {'type': 'array', 'items': _object({'id': TEXT, 'title': TEXT})},
    'nodes': {'type': 'array', 'items': _object({
        'id': TEXT,
        'title': TEXT,
        'kind': {'type': 'string', 'enum': ['service', 'concept', 'data', 'actor', 'process', 'decision', 'risk']},
        'group': TEXT,
        'summary': TEXT,
        'source_ids': SOURCE_IDS,
    })},
    'edges': {'type': 'array', 'items': _object({'from': TEXT, 'to': TEXT, 'label': TEXT})},
    'summary': TEXT,
})

REPORT = _object({'title': TEXT, 'report': TEXT, 'summary': TEXT})

#: Deep Research writes its body a few sections at a time, so no single answer has to hold it all.
REPORT_SECTIONS = _object({'sections': {'type': 'array', 'items': _object({'heading': TEXT, 'markdown': TEXT, 'summary': TEXT})}})

#: The parts of a Deep report written once the body exists: they summarise what the sections found.
REPORT_FRAME = _object({
    'title': TEXT,
    'executive_summary': TEXT,
    'key_findings': TEXTS,
    'contradictions': TEXT,
    'limitations': TEXT,
    'conclusions': TEXT,
    'summary': TEXT,
})
