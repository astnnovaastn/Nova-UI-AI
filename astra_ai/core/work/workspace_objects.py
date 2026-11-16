"""Inert canvas objects projected from recorded output; no extra provider calls."""
import re
from urllib.parse import urlsplit

KINDS = {'answer','document','report','note','draft','code','diff','test','image','video','audio','table','comparison','chart','timeline','calendar','checklist','decision','diagram','knowledge-graph','task','source'}


def validate(value):
    if not isinstance(value, dict) or value.get('kind') not in KINDS or not isinstance(value.get('id'), str) or not value['id']:
        raise ValueError('invalid_canvas_object')
    if not isinstance(value.get('title'), str) or not value['title']:
        raise ValueError('missing_object_title')
    if not isinstance(value.get('revision'), int) or isinstance(value['revision'], bool) or value['revision'] < 1:
        raise ValueError('invalid_object_revision')
    for key in ('url',):
        if value.get(key):
            url = urlsplit(value[key])
            if url.scheme not in ('http', 'https') or not url.hostname or url.username or url.password:
                raise ValueError('invalid_object_url')
    for key,options in [('orientation',{'horizontal','vertical'}),('chartKind',{'bars','line','area'})]:
        if key in value and value[key] not in options:raise ValueError('invalid_'+key)
    if 'columnKinds' in value:
        if not isinstance(value['columnKinds'],list) or any(k not in {'text','number','money','percent','date','duration','yes_no','rating','link','entity','tag'} for k in value['columnKinds']):raise ValueError('invalid_column_kinds')
    allowed = {'orientation','chartKind','columnKinds','id','kind','title','revision','task_id','status','body','language','url','caption','columns','rows','entries','nodes','edges','sources'}
    return {k:v for k,v in value.items() if k in allowed}


def project(run, report):
    sources = [dict(id=e['id'],title=e.get('title',e['id']),url=e.get('url','')) for e in run.evidence]
    title = re.search(r'^# (.+)', report, re.M)
    common = dict(revision=1,task_id='write',status='recorded',sources=sources)
    objects = [dict(id='result',kind='report',title=title.group(1) if title else run.plan.get('title') or 'Result',body=report,**common)]
    for i, block in enumerate(re.finditer(r'```([\w+-]*)\n([\s\S]*?)```', report)):
        language,body=block.groups()
        objects.append(dict(id=f'code-{i}',kind='diff' if language=='diff' else 'code',title='Proposed change' if language=='diff' else 'Code reference',language=language,body=body,**common))
    lines=report.splitlines();i=0;table=0
    while i+1<len(lines):
        if '|' in lines[i] and re.fullmatch(r'[\s|:\-]+',lines[i+1]) and '-' in lines[i+1]:
            cells=lambda row:[c.strip() for c in row.strip().strip('|').split('|')]
            columns=cells(lines[i]);rows=[];i+=2
            while i<len(lines) and '|' in lines[i] and lines[i].strip():rows.append(cells(lines[i]));i+=1
            objects.append(dict(id=f'table-{table}',kind='comparison',title='Evidence comparison',columns=columns,rows=rows,**common));table+=1
        else:i+=1
    entries=[dict(id=f'item-{i}',label=label,done=mark.lower()=='x') for i,(mark,label) in enumerate(re.findall(r'^\s*[-*] \[([ xX])\] (.+)$',report,re.M))]
    if entries:objects.append(dict(id='checklist',kind='checklist',title='Next actions',entries=entries,**common))
    for artifact in run.artifacts:
        if artifact.get('kind')=='knowledge_map':
            data=artifact.get('data',{})
            objects.append(dict(id='knowledge-map',kind='diagram',title=data.get('title') or 'Knowledge map',
                nodes=[dict(id=n['id'],label=n.get('title',''),detail=n.get('summary',''),group=n.get('group','')) for n in data.get('nodes',[])],
                edges=[dict(id=f'map-{i}',source=e['from'],target=e['to'],label=e.get('label','')) for i,e in enumerate(data.get('edges',[]))],**common))
    return [validate(o) for o in objects]


def coverage_object(coverage, evidence):
    return validate(dict(id='coverage-review',kind='checklist',title='Coverage review',revision=1,task_id='publish',
        status='mapped' if coverage.get('complete') else 'needs_review',caption=coverage.get('method',''),
        entries=[dict(id=f'requirement-{i}',label=row['requirement'],detail=(
            ('Section present' if row['section_present'] else 'Section missing')+' · '+
            ('Evidence: '+', '.join(row['source_ids']) if row['source_ids'] else 'No matching evidence recorded')+
            '. Mapping does not establish substantive completeness.')) for i,row in enumerate(coverage.get('requirements',[]))],
        sources=[dict(id=e['id'],title=e.get('title',e['id']),url=e.get('url','')) for e in evidence]))
