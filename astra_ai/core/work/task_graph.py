"""Versioned public task graph. Registered handlers own execution; labels grant no tools."""
from __future__ import annotations

TASK_TYPES = {
    'discover': ('Source discovery', ('web_search', 'web_fetch'), ('source',)),
    'analyze': ('Evidence analysis', (), ('findings',)),
    'verify': ('Evidence verification', (), ('verification',)),
    'fill_gaps': ('Resolve evidence gaps', ('web_search', 'web_fetch'), ('source',)),
    'write': ('Compose the result', (), ('document',)),
    'publish': ('Publish recorded results', (), ('report',)),
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
    for kind in kinds:
        title, capabilities, outputs = TASK_TYPES[kind]
        nodes.append(dict(id=kind, type=kind, label=title, depends_on=[nodes[-1]['id']] if nodes else [],
                          inputs=[nodes[-1]['id']] if nodes else ['request'], output_kinds=list(outputs),
                          capabilities=list(capabilities), status='queued',
                          acceptance='Recorded output exists; failures remain explicit.'))
    return validate(dict(version=2, workflow=workflow, nodes=nodes,
                         requirements=list(dict.fromkeys(str(s).strip() for s in plan.get('sections', []) if str(s).strip())),
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
