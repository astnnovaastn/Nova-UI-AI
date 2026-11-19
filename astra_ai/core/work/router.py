"""V29 capability router: what a request actually needs before any tool runs.

AEGIS used to run every workflow as research (`catalog.Workflow.needs_web` defaulted to True and
deep mode always searched). Under `AEGIS_WORK_ROUTER=1` each workflow names the capabilities it may
use and the objects it should produce. Paid search (`web.research_api`) and paid media enrichment
are allowed only for the research workflows; everything else works from supplied material, the
configured repositories, read-only accounts and free, permitted web retrieval.

The router is deterministic. The lead's plan may narrow what it allows, never widen it.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field

from .contracts import RunBudget

CAPABILITIES = {
    'reason': 'model reasoning',
    'supplied': 'chosen canvas items and pasted text',
    'web.read': 'AgentBrowser page reading (free, public pages)',
    'web.search.free': 'free search adapters (Wikipedia, arXiv, OpenAlex, GitHub, Are.na, ...)',
    'web.images.free': 'free image references (Are.na, Wikimedia Commons, Openverse)',
    'web.research_api': 'paid research search (Tavily/Exa/SerpAPI)',
    'media.video': 'paid video/media enrichment',
    'files.repo_read': 'configured repositories, read-only',
    'code.sandbox': 'isolated command execution with approval',
    'account.gmail': 'connected Gmail, read-only',
    'account.calendar': 'connected Calendar, read-only',
    'canvas.create': 'typed canvas objects',
}
PAID = frozenset({'web.research_api', 'media.video'})
BOARDS = ('technical', 'visual', 'matrix', 'timeline', 'schedule', 'messages', 'research')


@dataclass(frozen=True)
class Spec:
    intent: str
    capabilities: tuple
    outputs: tuple
    board: str
    report: bool = False
    research: bool = False
    #: Material without which the work cannot honestly start: asked for, never searched for.
    requires: str = ''


C = ('reason', 'canvas.create')
SPECS = {
    # Developer
    'explain-code': Spec('explain', C + ('supplied', 'files.repo_read', 'web.read'), ('reply', 'code', 'document', 'diagram'), 'technical', requires='code'),
    'map-a-project': Spec('map', C + ('supplied', 'files.repo_read'), ('project', 'diagram', 'document', 'reply'), 'technical', requires='repository'),
    'review-a-change': Spec('review', C + ('supplied', 'files.repo_read', 'code.sandbox'), ('list', 'diff', 'draft', 'reply'), 'technical', requires='change'),
    'fix-a-bug': Spec('modify', C + ('supplied', 'files.repo_read', 'code.sandbox'), ('list', 'diff', 'code', 'reply'), 'technical', requires='failure'),
    # Designer
    'moodboard': Spec('create', C + ('supplied', 'web.images.free', 'web.search.free', 'web.read'), ('picks', 'reply'), 'visual'),
    # V33: a teardown needs the interface (a URL, pasted HTML or a named product); it adds a measured screenshot.
    'ui-teardown': Spec('review', C + ('supplied', 'web.read', 'web.search.free', 'web.images.free'), ('media', 'sheet', 'list', 'picks', 'reply'), 'visual', requires='interface'),
    # Marketing
    'competitor-landscape': Spec('compare', C + ('supplied', 'web.search.free', 'web.read'), ('picks', 'sheet', 'plot', 'document', 'reply'), 'matrix'),
    'campaign-plan': Spec('plan', C + ('supplied', 'web.search.free'), ('document', 'plan', 'sheet', 'list', 'draft', 'reply'), 'timeline'),
    # Manager
    'plan-my-day': Spec('plan', C + ('supplied', 'account.calendar', 'account.gmail'), ('plan', 'list', 'reply'), 'schedule'),
    'weekly-status': Spec('create', C + ('supplied', 'account.gmail'), ('document', 'list', 'subject', 'reply'), 'schedule'),
    # Student
    'learning-path': Spec('plan', C + ('supplied', 'web.search.free', 'web.read'), ('plan', 'picks', 'list', 'reply'), 'timeline'),
    'exam-prep': Spec('plan', C + ('supplied', 'web.search.free'), ('plan', 'list', 'document', 'reply'), 'timeline'),
    # Office
    'inbox-triage': Spec('triage', C + ('supplied', 'account.gmail'), ('list', 'draft', 'reply'), 'messages'),
    'meeting-prep': Spec('plan', C + ('supplied', 'account.calendar', 'account.gmail', 'web.search.free', 'web.read'), ('subject', 'list', 'document', 'reply'), 'messages'),
    # Founder
    'market-map': Spec('compare', C + ('supplied', 'web.search.free', 'web.read'), ('diagram', 'picks', 'sheet', 'document', 'reply'), 'matrix'),
    'pricing-research': Spec('compare', C + ('supplied', 'web.search.free', 'web.read'), ('sheet', 'plot', 'document', 'reply'), 'matrix'),
    'investor-list': Spec('compare', C + ('supplied', 'web.search.free', 'web.read'), ('picks', 'sheet', 'reply'), 'matrix'),
    # Research: the existing pipeline, unchanged
    'quick-research': Spec('research', C + ('supplied', 'web.research_api', 'web.read'), ('reply',), 'research', True, True),
    'deep-research': Spec('research', C + ('supplied', 'web.research_api', 'web.read', 'media.video'), ('reply',), 'research', True, True),
    'knowledge-map': Spec('research', C + ('supplied', 'web.research_api', 'web.read'), ('reply',), 'research', True, True),
}
GENERAL = Spec('create', C + ('supplied', 'web.search.free', 'web.read'), ('reply', 'document'), 'technical', report=True)
RESEARCH_WORDS = re.compile(r'\b(research|investigate|sources?|cite|citations?|literature|deep dive)\b', re.I)

#: Work runs: few model calls, no paid search, room for one composition pass and gathered pages.
WORK_BUDGET = RunBudget(model_calls=6, tokens=90000, searches=0, sources=24, workers=0, deadline_seconds=600,
                        concurrency=2, lead_reserve=30000, card_tokens=0, card_calls=0)


def enabled(settings):
    return str(settings('AEGIS_WORK_ROUTER') or '').strip() == '1'


def spec_for(workflow, query='', mode=''):
    if workflow in SPECS:
        return SPECS[workflow]
    # A free-form request in a research mode, or one that asks for research, keeps the research path.
    if mode in ('quick', 'deep', 'structured') and (mode == 'deep' or RESEARCH_WORDS.search(query or '')):
        return Spec('research', C + ('supplied', 'web.research_api', 'web.read'), ('reply',), 'research', True, True)
    return GENERAL


def _has_code(text):
    return bool(re.search(r'```|^diff --git|^@@ -\d|^\s*(def|class|function|const|import|from)\s', text or '', re.M))


def _has_interface(text):
    """A UI teardown can start from an address, pasted HTML, or a named product (a capitalised name after the first word)."""
    if re.search(r'https?://|www\.|<html|<body|<div|```html', text or '', re.I):
        return True
    words = re.findall(r"[A-Za-z][\w'.-]*", (text or '').splitlines()[0] if text else '')
    return any(w[0].isupper() and w.upper() != w for w in words[1:]) or any(w.isupper() and len(w) > 1 and w not in ('UI', 'UX', 'CSS', 'HTML', 'API', 'URL') for w in words[1:])


def _has_failure(text):
    return bool(re.search(r'(Traceback|AssertionError|FAILED|Error:|failing test|test fails|\bfailed\b)', text or '', re.I))


def missing_input(spec, query, chosen, repositories):
    """A question for what the work cannot start without, with real options. None when it can start."""
    supplied = ' '.join(str(row.get('summary', '')) + ' ' + str(row.get('title', '')) for row in chosen or [])
    text = (query or '') + '\n' + supplied
    kinds = {row.get('kind') for row in chosen or []}
    # V33: with a repository, "the uncommitted changes", a commit or a branch range is read from git itself.
    git_change = bool(repositories) and bool(re.search(r'\b(uncommitted|working tree|staged|commit\s+[0-9a-f]{7,40}|branch|pull request|PR\b|\w+\.\.\.?\w+|my changes|local changes)', text, re.I))
    # V35: a .patch / .diff file the person chose or named is the change.
    git_change = git_change or bool(re.search(r'\.(patch|diff)\b', text, re.I))
    if spec.requires == 'change' and not (_has_code(text) or kinds & {'code', 'diff'} or git_change):
        return {'question': 'Which change should I review? Paste the diff, or pick the files on the canvas.',
                'options': ['I will paste the diff', 'Review the uncommitted changes in a repository'] }
    if spec.requires == 'failure' and not (_has_failure(text) or _has_code(text) or kinds & {'code', 'test'}):
        return {'question': 'Which test is failing? Paste the failure output or the test name.',
                'options': ['I will paste the failure output', 'Run the test suite and find it']}
    if spec.requires == 'repository' and not repositories and not kinds & {'code'}:
        return {'question': 'No repository is configured for AEGIS to read. Which project should I map?',
                'options': ['Configure AEGIS_WORK_REPOSITORIES', 'I will paste the file tree']}
    if spec.requires == 'repository' and len(repositories) > 1:
        named = [name for name in repositories if name.lower() in (query or '').lower()]
        if not named:
            return {'question': 'Which repository should I map?', 'options': list(repositories)[:4]}
    if spec.requires == 'interface' and not _has_interface(text) and not kinds & {'page', 'source', 'link', 'image', 'screenshot', 'html'}:
        return {'question': 'Which interface should I tear down? Paste its address or its HTML, or name the product.',
                'options': ['I will paste the address', 'I will paste the HTML']}
    if spec.requires == 'code' and not (_has_code(text) or kinds & {'code'}) and not repositories:
        return {'question': 'Which code should I explain? Paste it or pick the file.', 'options': ['I will paste the code']}
    return None


@dataclass
class Route:
    workflow: str
    intent: str
    capabilities: list
    outputs: list
    board: str
    report: bool
    research: bool
    needs_web: bool
    paid_allowed: bool
    question: dict | None = None
    narrowed: list = field(default_factory=list)


def route(query, workflow='', mode='', chosen=(), repositories=()):
    spec = spec_for(workflow, query, mode)
    caps = list(dict.fromkeys(spec.capabilities))
    return Route(workflow=workflow or '', intent=spec.intent, capabilities=caps, outputs=list(spec.outputs),
                 board=spec.board, report=spec.report, research=spec.research,
                 needs_web=spec.research, paid_allowed=bool(PAID & set(caps)),
                 question=None if spec.research else missing_input(spec, query, chosen, list(repositories)))


def narrow(found: Route, lead_plan) -> Route:
    """The lead may drop web use (needs_web false) but can never add a capability."""
    if not found.research and lead_plan is not None and getattr(lead_plan, 'needs_web', True) is False:
        # A visual deliverable always needs its references; elsewhere the lead may decline the web.
        if found.board != 'visual':
            dropped = [c for c in found.capabilities if c.startswith('web.')]
            found.capabilities = [c for c in found.capabilities if c not in dropped]
            found.narrowed = dropped
    return found


def as_record(found: Route):
    return asdict(found)


def tasks_for(found: dict):
    """Gather tasks a routed Work run needs, in order. Research routes return None (legacy graph)."""
    if not found or found.get('research'):
        return None
    caps = set(found.get('capabilities', []))
    kinds = []
    if 'files.repo_read' in caps:
        kinds.append('read_repo')
    if caps & {'account.gmail', 'account.calendar'}:
        kinds.append('read_account')
    if caps & {'web.search.free', 'web.read', 'web.images.free'}:
        kinds.append('browse')
    if 'code.sandbox' in caps:
        kinds.append('run_check')
    return kinds + ['compose', 'write', 'publish']
