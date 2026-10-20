"""Sidebar-only metadata, isolated from report generation and conversations."""
import re
from astra_ai.memory.shared_memory import read, atomic

def title_for(text):
    text=' '.join(str(text or '').split())
    text=re.sub(r'^(?:(?:please |can you |could you |I (?:want(?:ed)?|would like) to )|(?:research|search|find|write|create|prepare|investigate) (?:about |for |information on |a report on )?)+','',text,flags=re.I)
    text=re.sub(r'^comprehensive (?:buyer )?research report (?:on|about) ','',text,flags=re.I)
    text=re.split(r'(?i:\s+(?:for someone|I want you|include|verify|explain|using official|with citations)\b)|[;\n]',text)[0]
    title=' '.join(text.split()[:7]).strip(' ,.:;…')
    if len(title)>52:title=title[:52].rsplit(' ',1)[0].strip(' ,.:;…')
    title=re.sub(r'\s+(?:(?:and|or|in|on|to|for|of|the|a|an|with|its|at)\s*)+$','',title,flags=re.I)
    return title[:1].upper()+title[1:] if title else 'Research findings'

def metadata_path(store):return store.path.with_name(store.path.stem+'.history.json')

def update(store,identifier,context,title=None,archived=None):
    if context.get('guest') or context.get('background'):return {'status':'rejected','reason':'owner_required'}
    with store.lock:
        found=store.get(identifier,context)
        if found['status']!='ok':return found
        if identifier in store.snapshot().get('removed',{}):return {'status':'conflict','reason':'Restore this research first.'}
        if title is not None:
            title=' '.join(str(title).split())
            if not title or len(title)>80:return {'status':'rejected','reason':'Use a title between 1 and 80 characters.'}
        path=metadata_path(store);data=read(path,{})
        entry=data.setdefault(identifier,{})
        if title is not None:entry['title']=title
        if archived is not None:entry['archived']=bool(archived)
        atomic(path,data)
        return {'status':'completed','research_id':identifier}

def listing(store,context,offset=0,limit=30,archived=False):
    with store.lock:
        first=store.listing(context,0,50);rows=list(first['items'])
        for cursor in range(50,first['total'],50):rows.extend(store.listing(context,cursor,50)['items'])
        preferences=read(metadata_path(store),{})
        rows=[{**row,'history_title':preferences.get(row['research_id'],{}).get('title') or title_for(row.get('display_title') or row.get('query')),'archived':archived} for row in rows if bool(preferences.get(row['research_id'],{}).get('archived'))==archived]
        return {**first,'total':len(rows),'items':rows[max(0,offset):max(0,offset)+max(1,min(50,limit))]}
