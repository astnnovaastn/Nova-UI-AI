"""Versioned public task graph. Registered handlers own execution; labels grant no tools."""
from __future__ import annotations

TASK_TYPES = {
    'discover': ('Source discovery', ('web_search', 'web_fetch'), ('source',)),
    'analyze': ('Evidence analysis', (), ('findings',)),
    'verify': ('Evidence verification', (), ('verification',)),
    'fill_gaps': ('Resolve evidence gaps', ('web_search', 'web_fetch'), ('source',)),
    'write': ('Compose the result', (), ('document',)),
    'publish': ('Publish recorded results', (), ('report',)),
    # V29 Work tasks (AEGIS_WORK_ROUTER=1). Each names the capability its handler uses; nothing else is granted.
    'read_repo': ('Read the repository', ('repo_read',), ('code',)),
    'read_account': ('Read connected accounts', ('account_read',), ('messages',)),
    'browse': ('Gather references from the web', ('free_search', 'web_read'), ('source',)),
    'run_check': ('Prepare a sandboxed check', ('sandbox',), ('test',)),
    'compose': ('Create the results', (), ('objects',)),
}

#: V29 labels per workflow for the Work tasks.
WORK_LABELS = {
    'map-a-project': {'read_repo': 'Read the project files', 'compose': 'Build the architecture map'},
    'explain-code': {'read_repo': 'Read the code', 'compose': 'Explain the code'},
    'review-a-change': {'read_repo': 'Read the changed files', 'run_check': 'Prepare the checks', 'compose': 'Review the change'},
    'fix-a-bug': {'read_repo': 'Read the failing code', 'run_check': 'Prepare the test run', 'compose': 'Draft the fix'},
    'moodboard': {'browse': 'Gather visual references', 'compose': 'Compose the boards'},
    'ui-teardown': {'browse': 'Read the interface', 'compose': 'Write the teardown'},
    'plan-my-day': {'read_account': 'Read your calendar and mail', 'compose': 'Lay out the day'},
    'inbox-triage': {'read_account': 'Read your inbox', 'compose': 'Sort and draft replies'},
    'weekly-status': {'read_account': 'Read recent messages', 'compose': 'Write the status'},
    'meeting-prep': {'read_account': 'Read the meeting', 'browse': 'Look up the people and companies', 'compose': 'Write the brief'},
    'campaign-plan': {'browse': 'Check the audience and channels', 'compose': 'Plan the campaign and drafts'},
    'learning-path': {'browse': 'Find courses and references', 'compose': 'Lay out the path'},
    'exam-prep': {'browse': 'Find the exam format', 'compose': 'Plan and write questions'},
    'competitor-landscape': {'browse': 'Read competitor pages', 'compose': 'Compare the competitors'},
    'market-map': {'browse': 'Find companies by segment', 'compose': 'Map the market'},
    'pricing-research': {'browse': 'Read pricing pages', 'compose': 'Compare the plans'},
    'investor-list': {'browse': 'Find investors and deals', 'compose': 'Shortlist investors'},
}


#: Engine v2 names each task by what it does for the workflow. Labels describe; handlers and tools stay the same.
WORKFLOW_LABELS = {
    'explain-code': {'discover': 'Read public documentation', 'analyze': 'Trace the supplied code', 'verify': 'Check the explanation against the code', 'write': 'Explain the code'},
    'map-a-project': {'discover': 'Read the repository and docs', 'analyze': 'Map modules and dependencies', 'write': 'Write the architecture guide'},
    'review-a-change': {'discover': 'Read referenced sources', 'analyze': 'Review the change', 'verify': 'Check each finding', 'write': 'Draft the review'},
    'fix-a-bug': {'discover': 'Read referenced sources', 'analyze': 'Trace the failure', 'verify': 'Check the proposed fix', 'write': 'Draft the patch'},
    'ui-teardown': {'discover': 'Collect screens and write-ups', 'analyze': 'Extract interface patterns', 'write': 'Write the teardown'},
    'moodboard': {'discover': 'Gather visual references', 'analyze': 'Group the references', 'write': 'Describe the direction'},
    'competitor-landscape': {'discover': 'Find competitors and pricing pages', 'analyze': 'Compare positioning and prices', 'verify': 'Check dated prices and claims', 'write': 'Write the landscape'},
    'campaign-plan': {'discover': 'Research audience and channels', 'analyze': 'Sequence the campaign', 'write': 'Write the plan and drafts'},
    'plan-my-day': {'analyze': 'Order the supplied events and tasks', 'write': 'Lay out the day'},
    'weekly-status': {'analyze': 'Group the supplied notes', 'write': 'Write the status'},
    'learning-path': {'discover': 'Find courses and references', 'analyze': 'Order topics by prerequisite', 'write': 'Write the weekly path'},
    'exam-prep': {'discover': 'Find the exam format', 'analyze': 'Rank what matters', 'write': 'Write the plan and questions'},
    'inbox-triage': {'analyze': 'Sort the supplied messages', 'write': 'Draft the replies'},
    'meeting-prep': {'discover': 'Research the people and companies', 'analyze': 'Pick talking points', 'write': 'Write the brief'},
    'market-map': {'discover': 'Find companies by segment', 'analyze': 'Group the market', 'write': 'Write the market map'},
    'pricing-research': {'discover': 'Read official pricing pages', 'analyze': 'Normalise plans and prices', 'verify': 'Check units, currency and dates', 'write': 'Recommend a position'},
    'investor-list': {'discover': 'Find investors and recent deals', 'analyze': 'Score fit', 'verify': 'Check each deal', 'write': 'Write the shortlist'},
}


def validate(graph):
    if not isinstance(graph, dict) or graph.get('version') != 2:
        raise ValueError('unsupported_task_graph')
    nodes = graph.get('nodes')
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 100:
        raise ValueError('invalid_task_count')
    ids = set()
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get('id'), str) or not node['id'] or node['id'] in ids:
            raise ValueError('invalid_task_identity')
        ids.add(node['id'])
        if node.get('type') not in TASK_TYPES:
            raise ValueError('unsupported_task_type')
        required = set(TASK_TYPES[node['type']][1])
        capabilities=node.get('capabilities')
        if not isinstance(capabilities,list) or any(not isinstance(c,str) for c in capabilities) or set(capabilities) != required:
            raise ValueError('invalid_task_capabilities')
        if not isinstance(node.get('depends_on'),list) or any(not isinstance(dep,str) for dep in node['depends_on']):
            raise ValueError('invalid_task_dependencies')
    done = set()
    while len(done) < len(nodes):
        available = [n for n in nodes if n['id'] not in done and isinstance(n.get('depends_on'), list)
                     and set(n['depends_on']) <= done]
        if not available:
            raise ValueError('cyclic_or_missing_task_dependency')
        done.update(n['id'] for n in available)
    return graph


def compile_plan(plan, workflow='', skills=()):
    """Compile the admitted lead plan into existing registered execution capabilities."""
    from .router import tasks_for
    work = tasks_for(plan.get('route'))
    if work:
        return compile_work(plan, work, workflow, skills)
    mode = plan.get('mode', 'quick')
    roles = {row.get('role') for row in plan.get('assignments', []) if isinstance(row, dict)}
    kinds = []
    if plan.get('needs_web', True):
        kinds.append('discover')
    if 'analysis' in roles or mode in ('deep', 'structured'):
        kinds.append('analyze')
    if 'verification' in roles:
        kinds.append('verify')
        if plan.get('needs_web', True):
            kinds.append('fill_gaps')
    kinds += ['write', 'publish']
    nodes = []
    labels = WORKFLOW_LABELS.get(workflow, {}) if plan.get('engine') == 'v2' else {}
    for kind in kinds:
        title, capabilities, outputs = TASK_TYPES[kind]
        title = labels.get(kind, title)
        nodes.append(dict(id=kind, type=kind, label=title, depends_on=[nodes[-1]['id']] if nodes else [],
                          inputs=[nodes[-1]['id']] if nodes else ['request'], output_kinds=list(outputs),
                          capabilities=list(capabilities), status='queued',
                          acceptance='Recorded output exists; failures remain explicit.'))
    return validate(dict(version=2, workflow=workflow, nodes=nodes,
                         requirements=list(dict.fromkeys(str(s).strip() for s in plan.get('sections', []) if str(s).strip())),
                         skills=[dict(name=s.get('name'), version=s.get('version')) for s in skills], planning_agents=1))


def compile_work(plan, kinds, workflow='', skills=()):
    """A routed Work graph: gather tasks run independently, compose waits for all of them."""
    labels = WORK_LABELS.get(workflow, {})
    gather = [k for k in kinds if k not in ('compose', 'write', 'publish')]
    nodes = []
    for kind in kinds:
        title, capabilities, outputs = TASK_TYPES[kind]
        depends = [] if kind in gather else (gather if kind == 'compose' else [nodes[-1]['id']])
        nodes.append(dict(id=kind, type=kind, label=labels.get(kind, title), depends_on=list(depends),
                          inputs=list(depends) or ['request'], output_kinds=list(outputs),
                          capabilities=list(capabilities), status='queued',
                          acceptance='Recorded output exists; failures remain explicit.'))
    return validate(dict(version=2, workflow=workflow, nodes=nodes, requirements=[], router='v29',
                         skills=[dict(name=s.get('name'), version=s.get('version')) for s in skills], planning_agents=1))


def ready(graph, completed):
    validate(graph)
    if isinstance(completed,dict):
        completed={key for key,value in completed.items() if value}
    return [n for n in graph['nodes'] if n['id'] not in completed and set(n['depends_on']) <= set(completed)]


def set_status(graph, name, status):
    for node in graph.get('nodes', []):
        if node['id'] == name:
            node['status'] = status


def coverage(plan, evidence, report):
    """Conservative coverage diagnostics; matching is evidence, never a quality verdict."""
    import re
    result = []
    for heading in dict.fromkeys(plan.get('sections', [])):
        words = set(re.findall(r'\w{4,}', str(heading).lower()))
        sources = [r['id'] for r in evidence if words and any(w in (' '.join(str(r.get(k, '')) for k in ('title', 'excerpt', 'query'))).lower() for w in words)]
        headings = re.findall(r'^#{1,6}\s+(.+)$', report, re.M)
        present = any(str(heading).lower().strip() == h.lower().strip() for h in headings)
        result.append(dict(requirement=str(heading), source_ids=sources, section_present=present,
                           status='needs_review' if not sources or not present else 'mapped'))
    return dict(requirements=result, complete=all(r['status']=='mapped' for r in result),
                method='heading-and-evidence mapping; not semantic verification')
