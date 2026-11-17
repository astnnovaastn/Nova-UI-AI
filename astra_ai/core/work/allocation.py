"""Adaptive agent allocation for Work engine v2 (AEGIS V24).

An available model is not an agent. An agent is a role with a task, context and tools; several roles
may run on one model, one after another. For each request this module chooses the smallest set of
roles the work needs and the models that serve them, and says why, so the choice can be shown and
tested. It never calls a model and never adds a tool: it only narrows what the staged pipeline runs.

Engine v1 (the default) keeps `orchestrator.choose_assignments` and its fixed Deep policy
(second analyst on worker_d, writer on worker_e). `AEGIS_WORK_ENGINE=v2` switches a new run to this.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field, replace

from .providers import PROVIDER_CAPABILITIES

ENGINES = ('v1', 'v2')
#: Conservative default for model workers active at once; the lead is not counted.
DEFAULT_ACTIVE_WORKERS = 2
MAX_ACTIVE_WORKERS = 4

#: Workflows whose result is a claim someone will act on: an independent check is part of the job.
VERIFY_ALWAYS = {'review-a-change', 'fix-a-bug', 'pricing-research', 'investor-list', 'competitor-landscape', 'deep-research'}
#: Workflows that turn supplied material into a result; analysis of the material is the work itself.
ANALYSE_SUPPLIED = {'explain-code', 'review-a-change', 'fix-a-bug', 'weekly-status', 'inbox-triage', 'plan-my-day'}
#: Workflows whose deliverable is long-form writing in several sections.
LONG_FORM = {'deep-research', 'ui-teardown', 'learning-path', 'pricing-research', 'competitor-landscape', 'investor-list'}

COMPLEX_WORDS = re.compile(r'\b(compare|versus|vs\.?|architecture|end[- ]to[- ]end|entire|comprehensive|in[- ]depth|thorough|detailed|across|every|all of|roadmap|implementation plan|trade-?offs?)\b', re.I)
SIMPLE_WORDS = re.compile(r'\b(what is|what does|explain (this|what)|define|summari[sz]e|tl;?dr|quick(ly)?|briefly|one line)\b', re.I)


@dataclass
class RoleChoice:
    role: str
    slot: str
    provider: str
    model: str
    reason: str


@dataclass
class Allocation:
    engine: str = 'v2'
    complexity: str = 'simple'
    score: int = 0
    signals: list = field(default_factory=list)
    roles: list = field(default_factory=list)
    #: A second analyst takes alternate evidence batches only when this is true.
    second_analyst: bool = False
    #: 'lead' or 'synthesis': who writes the body of a long report.
    writer: str = 'lead'
    max_active_workers: int = DEFAULT_ACTIVE_WORKERS
    distinct_models: int = 1
    skipped: list = field(default_factory=list)

    def slot_for(self, role):
        return next((row['slot'] for row in self.roles if row['role'] == role), '')

    def has(self, role):
        return any(row['role'] == role for row in self.roles)


def engine(settings):
    value = str(settings('AEGIS_WORK_ENGINE') or 'v1').strip().lower()
    return value if value in ENGINES else 'v1'


def active_workers(settings):
    try:
        wanted = int(settings('AEGIS_WORK_MAX_ACTIVE_WORKERS') or DEFAULT_ACTIVE_WORKERS)
    except ValueError:
        wanted = DEFAULT_ACTIVE_WORKERS
    return max(1, min(MAX_ACTIVE_WORKERS, wanted))


def assess(query, mode, workflow='', sections=(), chosen=(), needs_web=True):
    """Complexity from the request itself. Returns (level, score, signals); signals explain the score."""
    score, signals = 0, []
    text = query or ''
    words = len(re.findall(r'\w+', text))
    if mode == 'deep':
        score += 3; signals.append('deep mode')
    elif mode == 'structured':
        # A workflow's fixed mode says what shape the result has, not how hard the request is.
        score += 1 if workflow else 2; signals.append('structured mode')
    elif mode == 'direct':
        score -= 2; signals.append('direct answer')
    if words > 60:
        score += 2; signals.append('long request (' + str(words) + ' words)')
    elif words > 25:
        score += 1; signals.append('detailed request')
    complex_hits = sorted({m.group(0).lower() for m in COMPLEX_WORDS.finditer(text)})
    if complex_hits:
        score += min(3, len(complex_hits)); signals.append('asks for ' + ', '.join(complex_hits[:3]))
    if SIMPLE_WORDS.search(text):
        score -= 1; signals.append('asks for a short explanation')
    if len(sections) >= 6:
        score += 1; signals.append(str(len(sections)) + ' planned sections')
    if len(chosen) >= 3:
        score += 1; signals.append(str(len(chosen)) + ' chosen inputs')
    if workflow in VERIFY_ALWAYS:
        signals.append(workflow + ' needs an independent check')
    if not needs_web:
        signals.append('no web needed')
    level = 'complex' if score >= 5 else 'medium' if score >= 2 else 'simple'
    return level, score, signals


def budget_for_workflow(budget, mode, workflow):
    """A quick workflow whose result must be checked gets room for exactly one verification step."""
    if mode == 'quick' and workflow in VERIFY_ALWAYS and budget.workers < 2:
        return replace(budget, workers=2, model_calls=budget.model_calls + 2, tokens=budget.tokens + 16000)
    return budget


def _usable(slots, guard=None):
    return {name: slot for name, slot in slots.items() if guard is None or guard.available(slot)}


def _pick(slots, preferred, reuse, need_context=0):
    """The preferred slot when present; else a model already in use; else the lead. Context is a floor."""
    def fits(slot):
        return PROVIDER_CAPABILITIES.get(slot.provider, {}).get('context_tokens', 0) >= need_context
    for name in preferred:
        slot = slots.get(name)
        if slot and fits(slot):
            return slot
    for name in reuse:
        slot = slots.get(name)
        if slot and fits(slot):
            return slot
    return slots.get('lead')


def allocate(query, mode, workflow='', plan=None, slots=None, settings=lambda _n: '', budget_workers=3, guard=None, chosen=()):
    """The smallest set of roles and models for this request. Pure: no calls, no side effects."""
    plan = plan or {}
    slots = _usable(slots or {}, guard) or (slots or {})
    sections = plan.get('sections', []) or []
    needs_web = bool(plan.get('needs_web', True)) and mode != 'direct'
    level, score, signals = assess(query, mode, workflow, sections, chosen or plan.get('chosen', ()), needs_web)
    out = Allocation(complexity=level, score=score, signals=signals, max_active_workers=active_workers(settings))
    wanted = []
    if mode != 'direct':
        if needs_web:
            wanted.append(('discovery', 'retrieve and screen sources'))
        if mode in ('deep', 'structured') or workflow in ANALYSE_SUPPLIED and mode != 'direct':
            wanted.append(('analysis', 'extract findings from the evidence' if needs_web else 'read the supplied material'))
        elif level != 'simple' and needs_web:
            wanted.append(('analysis', 'medium request: compare the evidence before writing'))
        if workflow in VERIFY_ALWAYS or (mode == 'deep' and level == 'complex'):
            if any(role == 'analysis' for role, _ in wanted):
                wanted.append(('verification', 'workflow requires an independent check' if workflow in VERIFY_ALWAYS else 'complex deep request'))
    if mode == 'direct':
        out.skipped.append({'role': 'workers', 'reason': 'direct answer: the lead answers alone'})
    limit = max(0, min(budget_workers, 3))
    if len(wanted) > limit and workflow in ANALYSE_SUPPLIED and workflow in VERIFY_ALWAYS:
        # Work on supplied material: checking it matters more than searching around it.
        dropped = [row for row in wanted if row[0] == 'discovery']
        wanted = [row for row in wanted if row[0] != 'discovery']
        out.skipped += [{'role': 'discovery', 'reason': 'supplied material comes first; the budget leaves no room to search'} for _ in dropped]
    if len(wanted) > limit:
        for role, _ in wanted[limit:]:
            out.skipped.append({'role': role, 'reason': 'mode budget allows ' + str(limit) + ' worker roles'})
        wanted = wanted[:limit]
    # One model may serve several roles. Simple work stays on as few models as possible.
    in_use = ['lead']
    preferred = {
        'discovery': ['worker_a'],
        'analysis': ['worker_b'],
        'verification': ['worker_c', 'worker_d'],
    }
    for role, reason in wanted:
        if level == 'simple':
            order = [name for name in in_use if name != 'lead'] + preferred[role]
        else:
            order = preferred[role]
        slot = _pick(slots, order, in_use, need_context=100000 if role == 'analysis' and mode == 'deep' else 0)
        if not slot:
            out.skipped.append({'role': role, 'reason': 'no configured model'})
            continue
        if slot.slot not in in_use:
            in_use.append(slot.slot)
        out.roles.append(asdict(RoleChoice(role, slot.slot, slot.provider, slot.model, reason)))
    has_analysis = out.has('analysis')
    second = slots.get('worker_d')
    first = slots.get(out.slot_for('analysis')) if has_analysis else None
    if (has_analysis and mode == 'deep' and level == 'complex' and out.max_active_workers >= 2
            and second and first and second.model != first.model):
        out.second_analyst = True
        if 'worker_d' not in in_use:
            in_use.append('worker_d')
    elif has_analysis and mode == 'deep':
        out.skipped.append({'role': 'second analyst', 'reason': 'not a complex deep request' if level != 'complex' else 'one active worker allowed or no distinct second model'})
    writer = slots.get('worker_e')
    if mode == 'deep' and (workflow in LONG_FORM or level == 'complex') and writer and len(sections) >= 5:
        out.writer = 'synthesis'
        if 'worker_e' not in in_use:
            in_use.append('worker_e')
    elif mode == 'deep':
        out.skipped.append({'role': 'writer', 'reason': 'the lead writes: fewer than five sections or no writer model'})
    out.distinct_models = len({(slots[name].provider, slots[name].model) for name in in_use if name in slots}) or 1
    return out


def as_assignments(allocation, plan_assignments, intent):
    """The orchestrator's assignment rows: (role, task). The lead's own task wording wins when given."""
    asked = {row.get('role'): row.get('task') for row in plan_assignments or [] if isinstance(row, dict) and row.get('task')}
    fallback = {
        'discovery': 'Find and screen sources for: ' + intent,
        'analysis': 'Extract findings and compare the evidence for: ' + intent,
        'verification': 'Independently check the findings and name any gaps.',
    }
    return [(row['role'], (asked.get(row['role']) or fallback[row['role']])[:300]) for row in allocation.roles]
