"""Research pages share one conversation, never the Live transport session."""
import re
from .research_learning import scope
from astra_ai.memory.shared_memory import read,atomic,stable,normal


def root_id(data,identifier):
    row=data.get('requests',{}).get(identifier) or data.get('artifacts',{}).get(identifier,{})
    return row.get('research_session_id') or identifier


def pages(store,identifier,context):
    with store.lock:
        found=store.get(identifier,context)
        if found['status']!='ok':return found
        data=store.snapshot();root=root_id(data,identifier)
        if store.get(root,context)['status']!='ok':return {'status':'not_found'}
        rows={**data.get('artifacts',{}),**data.get('requests',{})}
        items=[{'research_id':key,'title':row.get('display_title') or row['query'][:90],
                'phase':row.get('phase','complete'),'created':row['created']}
               for key,row in rows.items() if root_id(data,key)==root and scope(row)==scope(context) and key not in data.get('removed',{})]
        items.sort(key=lambda row:(row['created'],row['research_id']))
        items.sort(key=lambda row:row['research_id']!=root)
        return {'status':'ok','research_session_id':root,'thread_id':'research-'+root,'pages':items}


def reserve_page(store,identifier,context,query,operation_id,mode=None):
    with store.lock:
        found=store.get(identifier,context)
        if found['status']!='ok':return found
        if found['artifact'].get('kind','research')!='research' or context.get('guest'):return {'status':'rejected','reason':'research_pages_require_owner_research'}
        data=store.snapshot();root=root_id(data,identifier)
        operation=stable('research-page',root,operation_id)
        # Page collection must not be redirected back into the current report.
        child_context={**context,'research_page_request':True,'research_session_id':root}
        reserved=store.reserve(query,mode or found['artifact']['mode'],child_context,operation)
        if reserved['status']!='ok':return reserved
        key=reserved['id']
        store.request_state(key,context,research_session_id=root,thread_id='research-'+root)
        return {**reserved,'research_session_id':root,'thread_id':'research-'+root}


def continuation_kind(query,subject,hint=''):
    """Explicit enrichment stays in place; another requested subject gets a page."""
    text=normal(query)
    if re.search(r'\b(new conversation|new session)\b',text):return 'new_session'
    if re.search(r'\b(not (?:a )?new page|(?:this|the) (?:current|same) page|same report)\b',text):return 'extend'
    if re.search(r'\b(new|another|separate) (?:research )?page\b',text):return 'new_page'
    if hint in {'new_page','extend'}:return hint
    if re.search(r'\b(more (?:information|details?|about)|expand|continue|explain (?:this|that|more)|add .*?(?:this|same) report|same (?:topic|subject|phones|devices|report)|its|their|these|those)\b',text):return 'extend'
    generic={'research','search','about','please','could','would','information','details','model','models','google','the','and','what','with','that','this','from','have','does','into','more','tell','find','new','latest','current','compare','comparison'}
    terms=lambda value:set(re.findall(r'[a-z0-9]{3,}',normal(value)))-generic
    wanted=terms(query);known=terms(subject)
    if wanted and wanted & known:return 'extend'
    return 'new_page' if re.search(r'\b(research|search|investigate|find information|tell me about)\b',text) else 'extend'


def publication_info(data,identifier):
    metadata=data.get('requests',{}).get(identifier,{})
    item=data.get('artifacts',{}).get(identifier,{})
    revision=stable(item.get('revision',''),*[e.get('revision','') for e in data.get('extensions',{}).get(identifier,[])],metadata.get('selected_images',[]),data.get('media',{}).get(identifier,{}))
    return {'research_session_id':root_id(data,identifier),'publication_revision':revision,
            'publication_state':metadata.get('publication_state','published' if item.get('report') and item.get('completeness')!='pending' else 'preparing'),
            'update_sequence':metadata.get('update_sequence',0)}
