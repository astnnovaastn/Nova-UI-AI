"""Research artifact persistence and reader representations."""
import asyncio,copy,json,os,re,time,uuid
from pathlib import Path
from datetime import datetime,timedelta,timezone
from urllib.parse import urlsplit
from astra_ai.memory.shared_memory import read,atomic,StorageLock,stable,normal,safe,now,SENSITIVE
from astra_ai.memory.category_policy import matches_scope,lifecycle
from ..background_budget import BudgetPaused, WRITER_PACING_REASONS

"""Scoped immutable research and full-fidelity Notes transfer.

Provider evidence stays separate from personal facts. Tool responses contain
handles; report pages and Notes import read the same stored bytes.
"""
import asyncio
import copy
import hashlib
import re
import time
from pathlib import Path
from urllib.parse import urlsplit

import requests
from astra_ai.memory.shared_memory import StorageLock, atomic, read, stable, now, safe


def scope(context):
    return tuple(context.get(k, False if k == 'guest' else '') for k in ('profile_id', 'project_id', 'guest'))


def display_title(brief):
    """Conservative presentation metadata; never rewrite archived evidence."""
    text=str(brief).strip()
    explicit=re.search(r'(?:titled|title[ :]|called)\s*["“]([^"”]{3,160})["”]',text,re.I)
    if explicit:text=explicit.group(1)
    else:
        text=re.split(r'\n|(?i:research requirements|requirements:)|(?<![Vv][Ss]\.)(?<=[.!?])\s+',text)[0]
        text=re.sub(r'^(?:(?:hey|hi|please)\b[,! ]*|(?:can|could|would) you |(?:search|research|find|write|create|prepare|investigate) (?:for |about |information (?:on|about) |an? |exhaustive[, ]*|multimedia |research report |report (?:on|about) )*)+', '',text,flags=re.I).strip(' :,."')
    text=' '.join(text.split()) or 'Research findings'
    if len(text)>90:text=text[:87].rsplit(' ',1)[0].rstrip(',:;')+'…'
    return text[0].upper()+text[1:]

def reader_text(text):
    """Remove illegal controls and a known serialization envelope only."""
    text=re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]','',str(text))
    if text.lstrip().startswith('{'):
        try:
            wrapped=json.loads(text)
            if isinstance(wrapped,dict) and isinstance(wrapped.get('report'),str):text=wrapped['report']
        except (ValueError,TypeError):pass
    from ..text_presentation import without_decorative_emoji
    return without_decorative_emoji(re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]','',text))

def evidence_excerpt(source, limit=1800):
    text=reader_text(source.get('content',''))
    paragraphs=re.split(r'\n\s*\n',text)
    useful=[p.strip() for p in paragraphs if len(p.strip())>=100 and p.count('](')*45/max(1,len(p))<.2 and not re.match(r'^(?:\s*#|jump to|search|contents|cookie|share|sign in)',p,re.I)]
    return ('\n\n'.join(useful[:2]) if useful else text)[:limit]

def article_root(soup):
    """Select article prose and remove publisher chrome before minting reader links."""
    for node in list(soup.select('script,style,nav,header,footer,aside,form,iframe,noscript,svg,button,input,select,[hidden],[aria-hidden="true"],[role="navigation"],[role="banner"],[role="contentinfo"],[role="dialog"],[role="menu"]')):
        node.decompose()
    chrome=re.compile(r'(?:^|[\s_-])(nav(?:igation|bar)?|menu|breadcrumb|sidebar|cookie|consent|newsletter|subscribe|social|share|advert(?:isement)?|ad-slot|related|recommended|site-header|site-footer|toolbar|pagination|notification|masthead|onetrust|toc|table-of-contents)(?:$|[\s_-])',re.I)
    for node in list(soup.find_all(['div','section','ul','ol'])):
        if not node.attrs:continue
        identity=re.sub(r'([a-z])([A-Z])',r'\1-\2',' '.join([str(node.get('id','')),*node.get('class',[])]))
        if chrome.search(identity):node.decompose()
    candidates=soup.select('[itemprop="articleBody"],.entry-content,.post-content,.article-content,.article-body,.story-body')
    if not candidates:candidates=soup.find_all('article') or soup.find_all('main')
    def score(node):
        prose=sum(len(p.get_text(' ',strip=True)) for p in node.find_all(['p','td','pre']))
        links=sum(len(a.get_text(' ',strip=True)) for a in node.find_all('a'))
        return prose-links*.8
    root=max(candidates,key=score) if candidates else soup.body or soup
    # Some publishers put block paragraphs inside bare anchors instead of marking a nav.
    for anchor in list(root.find_all('a')):
        text=anchor.get_text(' ',strip=True)
        menu_label=re.fullmatch(r'(?:Introduction|How to Play|Play Game|Menu|Partner with us|Add on google|Home News)',text,re.I)
        block=anchor.find(['p','div']) or (anchor.parent.name in {'p','li'} and anchor.parent.get_text(' ',strip=True)==text)
        if menu_label and block:anchor.decompose()
    for node in list(root.find_all(['ul','ol','div','p'])):
        if not node.parent:continue
        text=node.get_text(' ',strip=True);links=node.find_all('a');linked=sum(len(a.get_text(' ',strip=True)) for a in links)
        heading=node.find_previous(['h1','h2','h3','h4'])
        bibliography=heading and re.search(r'references|bibliography|sources|further reading',heading.get_text(),re.I)
        if not bibliography and len(links)>=3 and linked/max(1,len(text))>.72 and not node.find(['p','pre','table']):node.decompose();continue
        if node.name=='p' and linked>=len(text)*.9 and re.fullmatch(r'(?:Introduction|How to Play|Play Game|Menu|Partner with us|Add on google|Home News)',text,re.I):node.decompose()
    return root

class ResearchArtifacts:
    def __init__(self, path, legacy_path=None):
        from ..research.storage import FolderResearchStore
        self.repository = FolderResearchStore(path) if Path(path).suffix != '.json' else None
        self.path = self.repository.path if self.repository else Path(path)
        self.lock = self.repository.lock if self.repository else StorageLock(self.path.with_suffix('.lock'))
        if self.repository and legacy_path:self.repository.migrate(legacy_path)
        self.reader_cache = {}
        self.reader_links = {}
        self._snapshot_key=None;self._snapshot=None;self._document_cache={};self._link_cache={}
        import threading
        self.image_worker=threading.BoundedSemaphore(1)

    def read(self, default=None):
        return self.repository.load() if self.repository else read(self.path, default or {'artifacts':{},'imports':{}})

    def write(self, data):
        if self.repository:self.repository.write(data)
        else:atomic(self.path,data)
        self._snapshot_key=None

    def snapshot(self):
        # The file remains authoritative. Any atomic replacement invalidates all projections.
        stat=self.path.stat() if self.path.exists() else None
        key=self.repository.stamp() if self.repository else (stat.st_mtime_ns,stat.st_size) if stat else None
        if self._snapshot is None or key!=self._snapshot_key:
            self._snapshot=self.read({'artifacts':{},'imports':{}});self._snapshot_key=key
            self._document_cache.clear();self._link_cache.clear()
        return self._snapshot

    def backup_metadata(self):
        if self.repository:return
        import shutil
        backup=self.path.with_suffix('.before-reader-threads.bak')
        if self.path.exists() and not backup.exists():shutil.copy2(self.path,backup)

    def ensure_metadata(self,data,identifier):
        rows=data.setdefault('requests',{})
        if not rows.get(identifier,{}).get('id'):
            legacy=data.get('artifacts',{}).get(identifier,{})
            rows[identifier]={**{k:legacy[k] for k in ('id','query','mode','operation_id','created','created_epoch','profile_id','project_id','guest','session_id','research_session_id','thread_id','kind','display_title') if k in legacy},**rows.get(identifier,{})}
        return rows.setdefault(identifier,{})

    def reconcile_publication(self, context, identifier=''):
        """Repair stale labels only when a composed answer is durably published."""
        with self.lock:
            data=self.snapshot();changed=False;updates=[];aliases={}
            for key,item in data.get('artifacts',{}).items():
                if identifier and key!=identifier or scope(item)!=scope(context):continue
                if item.get('kind','research')!='research' or not item.get('sources') or not item.get('report','').strip():continue
                if data.get('requests',{}).get(key,{}).get('publication_state')=='preparing':continue
                if any(marker in item['report'] for marker in ('Sourced research excerpts.','not a completed synthesis.')):continue
                metadata=data.get('requests',{}).get(key,{})
                if metadata.get('phase') in {'queued','collecting_sources','comparing_evidence','preparing_report','waiting_for_quota','failed'}:
                    updates.append(key)
            for key,pending in data.get('requests',{}).items():
                if identifier and key!=identifier or key in data.get('artifacts',{}) or key in data.get('removed',{}) or scope(pending)!=scope(context):continue
                if pending.get('phase') not in {'queued','collecting_sources','comparing_evidence','preparing_report','waiting_for_quota'} or pending.get('kind','research')!='research':continue
                matches=[row for row in data.get('artifacts',{}).values() if row['id'] not in data.get('removed',{}) and scope(row)==scope(pending) and row.get('session_id','')==pending.get('session_id','') and row.get('completeness')=='complete' and (normal(row['query']),row['mode'])==(normal(pending['query']),pending['mode']) and abs(row.get('created_epoch',0)-pending.get('created_epoch',0))<3600 and row.get('report','').strip() and not any(marker in row['report'] for marker in ('Sourced research excerpts.','not a completed synthesis.'))]
                if matches:aliases[key]=max(matches,key=lambda row:row['created_epoch'])['id']
            if updates or aliases:
                data=self.read({})
                self.backup_metadata()
                for key in updates:
                    data['requests'][key].update(phase='complete',active_since=None,next_attempt=None,waiting_reason='')
                    data['artifacts'][key]['phase']='complete'
                for key,target in aliases.items():
                    pending=data['requests'][key]
                    pending.update(phase='complete',active_since=None,next_attempt=None,waiting_reason='',canonical_research_id=target)
                    if pending.get('origin_turn_id') and pending.get('origin_session_id'):
                        link={'session_id':pending['origin_session_id'],'turn_id':pending['origin_turn_id']}
                        links=data.setdefault('thread_links',{}).setdefault(target,[])
                        if link not in links:links.append(link)
                self.write(data);changed=True
            return changed

    def reserve(self, query, mode, context, operation_id, kind="research", source_research_id=""):
        if not isinstance(query,str) or not 1<=len(query.strip())<=12000 or mode not in {'quick','detailed'}:return {'status':'rejected','reason':'Research brief must contain 1–12,000 characters.'}
        if safe(query)!=query:return {'status':'rejected','reason':'credentials_not_allowed_in_search'}
        if kind not in {'research','documentary','chat'}:return {'status':'rejected','reason':'invalid_entry_kind'}
        if source_research_id and self.get(source_research_id,context)['status']!='ok':return {'status':'not_found'}
        identifier=stable('research-artifact',scope(context),operation_id)
        with self.lock:
            data=self.read({'artifacts':{},'imports':{}});requests=data.setdefault('requests',{})
            if kind=='research' and context.get('dedupe_research_turn') and context.get('turn_id') and context.get('session_id'):
                # Admission and allocation may race across tool invocations.
                # Recheck under the authoritative store lock before creating a row.
                prior=next((r for key,r in requests.items() if key not in data.get('removed',{}) and scope(r)==scope(context) and r.get('kind','research')=='research' and r.get('origin_turn_id')==context['turn_id'] and r.get('origin_session_id')==context['session_id']),None)
                if prior:return {'status':'ok',**copy.deepcopy(prior)}
            old=requests.get(identifier)
            if old and (old['query'],old['mode'],old.get('kind','research'),old.get('source_research_id',''))!=(query,mode,kind,source_research_id):return {'status':'conflict','reason':'operation_id_reused'}
            if not old and kind=='research':
                from ..research_intent import subject_terms, fresh_request
                for existing in sorted({**requests,**data.get('artifacts',{})}.values(),key=lambda row:row.get('created_epoch',0),reverse=True):
                    age=time.time()-existing.get('created_epoch',0)
                    if existing['id'] in data.get('removed',{}) or scope(existing)!=scope(context) or existing.get('session_id','')!=context.get('session_id',''):continue
                    equivalent=normal(existing['query'])==normal(query)
                    if not equivalent and not fresh_request(query) and not fresh_request(existing['query']):
                        wanted=subject_terms(query)
                        equivalent=len(wanted)>=2 and wanted==subject_terms(existing['query'])
                    if not equivalent or (existing['mode'],existing.get('kind','research'))!=(mode,kind):continue
                    if (existing.get('research_session_id') or existing['id'])!=(context.get('research_session_id') or existing['id']):continue
                    metadata=requests.get(existing['id'],{})
                    if metadata.get('canonical_research_id'):continue
                    cached=existing.get('completeness')=='complete' and age<3600
                    active=existing.get('completeness')!='complete' and metadata.get('phase') in {'queued','collecting_sources','comparing_evidence','preparing_report','waiting_for_quota'}
                    if cached or active:return {'status':'ok',**copy.deepcopy(metadata or existing)}
            if not old:
                self.backup_metadata()
                requests[identifier]={'kind':kind,'source_research_id':source_research_id,'id':identifier,'query':query,'mode':mode,'operation_id':operation_id,'display_title':display_title(query),'thread_id':'research-'+(context.get('research_session_id') or identifier),'research_session_id':context.get('research_session_id') or identifier,'update_sequence':1,'phase':'queued','created':now(),'created_epoch':time.time(),'origin_session_id':context.get('session_id',''),'origin_turn_id':context.get('turn_id',''),'origin_text':context.get('user_text') or query,**{k:context.get(k,False if k=='guest' else '') for k in ('profile_id','project_id','guest','session_id')}}
                self.write(data)
            return {'status':'ok',**copy.deepcopy(requests[identifier])}

    def conversation_search(self, query, context, topic=''):
        from ..research_topics import topic_identity
        if not isinstance(query,str) or not 1<=len(query.strip())<=12000 or safe(query)!=query or not isinstance(topic,str) or safe(topic)!=topic:return {'status':'rejected','reason':'invalid_search_brief'}
        key,subject=topic_identity(context,query,topic)
        with self.lock:
            data=self.snapshot();identifier=data.get('quick_topics',{}).get(key) or stable('research-artifact',scope(context),key)
            # A removed topic starts a fresh recoverable entry, never resurrecting deleted history.
            while identifier in data.get('removed',{}):
                key=stable(key,data['removed'][identifier]['token']);identifier=data.get('quick_topics',{}).get(key) or stable('research-artifact',scope(context),key)
            if identifier in data.get('requests',{}):
                row=data['requests'][identifier]
                return {'status':'ok',**copy.deepcopy(row),'followup':normal(row['query'])!=normal(query) or identifier in data.get('artifacts',{})}
            row=self.reserve(query,'quick',context,key)
            if row['status']=='ok':
                self.request_state(row['id'],context,conversation_topic=subject,topic_day=datetime.now(timezone.utc).date().isoformat())
                data=self.read({});self.backup_metadata();data.setdefault('quick_topics',{})[key]=row['id'];self.write(data)
            return row

    def request_state(self, identifier, context, **updates):
        with self.lock:
            data=self.read({'requests':{}}) if updates else self.snapshot();item=data.get('requests',{}).get(identifier)
            if not item and updates:
                legacy=data.get('artifacts',{}).get(identifier)
                if legacy and scope(legacy)==scope(context):
                    item={k:legacy[k] for k in ('id','query','mode','operation_id','created','created_epoch','profile_id','project_id','guest','session_id') if k in legacy}
                    item.update(kind=legacy.get('kind','research'),thread_id='research-'+identifier,phase='complete',display_title=display_title(legacy['query']))
                    data.setdefault('requests',{})[identifier]=item
            if not item or scope(item)!=scope(context):return {'status':'not_found'}
            if updates:
                self.backup_metadata()
                active={'collecting_sources','comparing_evidence','preparing_report','preparing_images','preparing_layout'}
                next_phase=updates.get('phase',item.get('phase'))
                if updates.get('phase') in active:
                    updates.setdefault('waiting_reason','')
                    updates.setdefault('next_attempt',None)
                if next_phase!=item.get('phase'):
                    stamp=time.time();started=item.get('active_since')
                    if item.get('phase') in active and isinstance(started,(int,float)):
                        item['processing_seconds']=item.get('processing_seconds',0)+max(0,stamp-started)
                    item['active_since']=stamp if next_phase in active else None
                item.update(updates);item['update_sequence']=item.get('update_sequence',0)+1;self.write(data)
            return {'status':'ok',**copy.deepcopy(item)}

    def extension_state(self, identifier, context, **updates):
        with self.lock:
            fetched=self.get(identifier,context)
            if fetched['status']!='ok':return fetched
            data=self.read({}) if updates else self.snapshot()
            activity=data.get('extension_activity',{}).get(identifier,{})
            if updates:
                self.backup_metadata()
                operation=updates.get('operation_id') or activity.get('operation_id','')
                journal=data.setdefault('extension_operations',{}).setdefault(identifier,{})
                previous=journal.get(operation,activity if activity.get('operation_id')==operation else {})
                activity={**previous,**updates,'updated':now()};journal[operation]=activity
                data.setdefault('extension_activity',{})[identifier]=activity
                metadata=self.ensure_metadata(data,identifier)
                metadata['update_sequence']=metadata.get('update_sequence',0)+1;self.write(data)
            return copy.deepcopy(activity)

    def extension_operation(self,identifier,context,operation_id):
        if self.get(identifier,context)['status']!='ok':return {}
        data=self.snapshot();current=data.get('extension_activity',{}).get(identifier,{})
        return copy.deepcopy(data.get('extension_operations',{}).get(identifier,{}).get(operation_id,current if current.get('operation_id')==operation_id else {}))

    def source_catalog(self, item):
        rows=copy.deepcopy(item['sources']);seen={r['url'] for r in rows}
        for extension in self.snapshot().get('extensions',{}).get(item['id'],[]):
            for row in extension.get('sources',[]):
                if row.get('url') and row['url'] not in seen:seen.add(row['url']);rows.append(copy.deepcopy(row))
        return rows

    def followup_evidence(self, identifier, context, operation_id):
        found=self.get(identifier,context)
        if found.get('status')!='ok':return []
        checkpoint=self.request_state(identifier,context).get('quick_followups',{}).get(operation_id,{})
        wanted={row['url']:row for row in checkpoint.get('sources',[])}
        return [{'id':'S'+str(i+1),'title':row['title'][:200],'url':row['url'],'content':evidence_excerpt(wanted[row['url']],1200),'retrieved_at':row.get('retrieved_at'),
                 'text_kind':'video_description' if self.video_id(row['url']) else 'source_excerpt'}
                for i,row in enumerate(self.source_catalog(found['artifact'])) if row['url'] in wanted][:5]

    def deletion_preview(self, identifier, context):
        result=self.get(identifier,context)
        if result['status']!='ok':return result
        item=result['artifact'];data=self.snapshot()
        from ..research_sessions import root_id
        members={key:row for key,row in {**data.get('artifacts',{}),**data.get('requests',{})}.items() if root_id(data,key)==identifier}
        revision=stable(item['revision'],[e['revision'] for e in data.get('extensions',{}).get(identifier,[])],data.get('drafts',{}).get(identifier,{}).get('revision',''),data.get('requests',{}).get(identifier,{}).get('phase',''),[(key,row.get('update_sequence',0),data.get('drafts',{}).get(key,{}).get('revision','')) for key,row in sorted(members.items())])
        return {'status':'ok','research_id':identifier,'revision':revision,'title':item.get('display_title') or display_title(item['query'])}

    def remove(self, identifier, context, revision, operation_id):
        if context.get('guest') or context.get('background'):return {'status':'rejected','reason':'owner_required'}
        with self.lock:
            current=self.deletion_preview(identifier,context)
            if current['status']!='ok':return current
            if current['revision']!=revision:return {'status':'conflict','reason':'research_changed_review_removal'}
            data=self.read({'artifacts':{},'requests':{}});self.backup_metadata()
            token=stable(identifier,operation_id,uuid.uuid4().hex)
            data.setdefault('removed',{})[identifier]={'token':token,'removed_at':now()};self.write(data)
            return {'status':'completed','research_id':identifier,'undo_token':token}

    def deletion_preview_many(self, identifiers, context):
        if context.get('guest') or context.get('background'):return {'status':'rejected','reason':'owner_required'}
        if not isinstance(identifiers,list) or not 1<=len(identifiers)<=50 or any(not isinstance(i,str) or not re.fullmatch('[a-f0-9]{32}',i) for i in identifiers):return {'status':'rejected','reason':'select_1_to_50_research_entries'}
        with self.lock:
            rows=[self.deletion_preview(i,context) for i in sorted(set(identifiers))]
            if any(row['status']!='ok' for row in rows):return {'status':'not_found'}
            return {'status':'ok','items':rows,'revision':stable([(row['research_id'],row['revision']) for row in rows]),'title':'Remove '+str(len(rows))+' entries: '+', '.join(row['title'] for row in rows)[:500]}

    def remove_many(self, identifiers, context, revision, operation_id):
        with self.lock:
            preview=self.deletion_preview_many(identifiers,context)
            if preview['status']!='ok':return preview
            if revision!=preview['revision']:return {'status':'conflict','reason':'research_changed_review_removal'}
            data=self.read({});self.backup_metadata();removed=[]
            for row in preview['items']:
                identifier=row['research_id'];token=stable(identifier,operation_id,uuid.uuid4().hex)
                data.setdefault('removed',{})[identifier]={'token':token,'removed_at':now()}
                removed.append({'research_id':identifier,'undo_token':token})
            self.write(data)
            return {'status':'completed','removed':removed}

    def find_history(self, query, context):
        with self.lock:
            data=self.snapshot();rows={**data.get('requests',{}),**data.get('artifacts',{})}
            from ..research_intent import saved_findings
            saved=saved_findings(self,query,context)
            identifiers={r['research_id'] for r in saved['items']}
            matches=[self.brief(self.get(identifier,context)['artifact']) for identifier,row in rows.items() if scope(row)==scope(context) and identifier not in data.get('removed',{}) and not data.get('requests',{}).get(identifier,{}).get('canonical_research_id') and (identifier in identifiers or normal(query) in normal(row.get('display_title','')+' '+row['query']))]
            return {'status':'ok','items':sorted(matches,key=lambda row:row['retrieved_at'],reverse=True)[:30],'total':len(matches)}

    def restore(self, identifier, context, token):
        with self.lock:
            data=self.read({'artifacts':{},'requests':{}});item=data.get('artifacts',{}).get(identifier) or data.get('requests',{}).get(identifier)
            if not item or scope(item)!=scope(context):return {'status':'not_found'}
            removed=data.get('removed',{}).get(identifier)
            if not removed or removed['token']!=token:return {'status':'conflict','reason':'removal_changed'}
            self.backup_metadata();data['removed'].pop(identifier);self.write(data)
            return {'status':'completed','research_id':identifier}

    def link_turn(self, identifier, context):
        """Reference an explicitly discussed report without copying/learning a turn twice."""
        if not context.get('turn_id') or not context.get('session_id') or not (context.get('referenced_research_id')==identifier or re.search(r'\b(research|report|previous|earlier|investigation)\b',context.get('user_text',''),re.I)):return
        with self.lock:
            if self.get(identifier,context)['status']!='ok':return
            data=self.read({});links=data.setdefault('thread_links',{}).setdefault(identifier,[])
            entry={k:context[k] for k in ('session_id','turn_id')}
            if entry not in links:self.backup_metadata();links.append(entry);self.write(data)

    @staticmethod
    def related_subject(query, previous):
        generic={'the','and','research','about','information','search','please','could','would','with','can','you','your','for','that','this','there','what','which','how','does','give','find','show','want','new','latest','current','more','into','from','have','has','are','will','all','need'}
        terms=lambda text:{w for w in re.findall(r'[a-z0-9]{3,}',text.casefold()) if w not in generic}
        wanted=terms(query)
        shared=wanted & terms(previous)
        return len(wanted)>=2 and len(shared)>=2 and len(shared)/len(wanted)>=.6

    def related_evidence(self, query, context):
        from ..research_intent import subject_terms
        from ..research_topics import search_subject
        subject=search_subject(query)
        wanted=subject_terms(subject)-{'versus','compare','comparison','source','sources','detail','detailed'}
        with self.lock:
            data=self.snapshot();items=list(data['artifacts'].values())
            items.extend(row for key,row in data.get('requests',{}).items() if key not in data['artifacts'] and row.get('sources'))
        candidates=[]
        for item in items:
            if scope(item)!=scope(context) or item['id'] in self.snapshot().get('removed',{}):continue
            topic_match=self.related_subject(subject,search_subject(item['query']))
            for row in self.source_catalog(item):
                # Shared writing instructions and words spread across an archive
                # cannot establish that a source covers the requested subject.
                title=row.get('title','')
                passages=re.split(r'\n\s*\n',row.get('content',''))
                covered=bool(wanted) and any(wanted<=subject_terms(title+' '+part[start:start+1800]) for part in passages for start in range(0,max(1,len(part)),1500))
                if not covered and not topic_match:continue
                if row.get('origin_query') and not self.related_subject(subject,search_subject(row['origin_query'])) and not covered:continue
                candidates.append({**row,'origin_research_id':row.get('origin_research_id') or item['id'],'origin_query':row.get('origin_query') or item['query'],'historical':bool(row.get('historical')) or time.time()-item['created_epoch']>86400})
        return candidates[:16]

    def reader(self, identifier, context, revision='', cursor=0, limit=20000, stream='all'):
        result=self.get(identifier,context,revision)
        if result['status']!='ok':return result
        item=result['artifact'];metadata=self.request_state(identifier,context)
        if item.get('kind','research')=='research' and (item.get('completeness') in {'pending','failed'} or metadata.get('publication_state')=='preparing'):
            return {'status':'ok','research_id':identifier,'research_revision':item['revision'],'report':'','blocks':[],'sections':[],'reader_end':0,'next_cursor':None,'extension_revision':'','stream':stream}
        title=metadata.get('display_title') or display_title(item['query'])
        headline=re.search(r'^# (.+)',item['report'],re.M)
        if headline:
            corrected=display_title(headline[1])
            if corrected.casefold().startswith('hi') and title.casefold()==corrected[2:].casefold():title=corrected
            elif corrected.casefold().startswith(title.casefold()+'.'):title=corrected
        evidence='Sourced research excerpts.' in item['report'] or 'not a completed synthesis.' in item['report']
        if evidence:
            body='# '+title+'\n\n## Collected evidence\n\nSource excerpts are available below; this archived collection is not a completed synthesis.\n\n'+'\n\n'.join('### '+r['title']+'\n\n'+evidence_excerpt(r,1400)+' [S'+str(i+1)+']' for i,r in enumerate(item['sources']))
        else:
            body=reader_text(item['report'])
            body=re.sub(r'\A# [^\n]+', '# '+title, body, count=1)
            first,separator,rest=body.partition('\n\n')
            if not headline and separator and 2<=len(first)<=150 and '\n' not in first and not re.match(r'^[#>|`*+\-]',first) and not first.endswith(('.', '!', '?')):
                title=display_title(first);body='# '+title+'\n\n'+rest
        with self.lock:
            extensions=self.snapshot().get('extensions',{}).get(identifier,[])
        if stream=='extensions':body=''
        boundaries=[];followups=[]
        if stream!='base':
            for i,entry in enumerate(extensions):
                if not entry['report'].strip():continue
                heading=re.search(r'^#{1,3}\s+(.+)',entry['report'],re.M)
                section={'id':stable('followup',identifier,entry.get('operation_id') or entry['revision']),
                         'title':display_title(entry.get('title') or (heading.group(1) if heading else 'Follow-up research '+str(i+1))),
                         'created':entry.get('created','')}
                boundaries.append((len(body),section));followups.append(section)
                body+='\n\n'+entry['report']
        # Complete Markdown blocks only; fenced code remains one block.
        blocks=[];current=[];fence=False
        for line in body.splitlines(keepends=True):
            if re.match(r'^\s*(```|~~~)',line):fence=not fence
            current.append(line)
            if not line.strip() and not fence:blocks.append(''.join(current));current=[]
        if current:blocks.append(''.join(current))
        cursor=max(0,int(cursor));limit=max(1000,min(20000,int(limit)));page=[];size=0;end=cursor
        for block in blocks[cursor:]:
            if size+len(block)>limit and page:break
            # A pathological oversized block is explicitly omitted, never sliced into invalid markup.
            if len(block)>20000:page.append('\n[Oversized block is available in the full export.]\n')
            else:page.append(block)
            size+=len(page[-1]);end+=1
        presented=[];position=sum(len(block) for block in blocks[:cursor])
        for i,block in enumerate(page):
            section=next((section for start,section in reversed(boundaries) if start<=position),None)
            presented.append({'id':stable(item['revision'],stream,cursor+i,block),'text':block,**({'section_id':section['id'],'section_title':section['title'],'section_created':section['created']} if section else {})})
            position+=len(blocks[cursor+i])
        return {'status':'ok','research_id':identifier,'research_revision':item['revision'],'extension_revision':stable(*[e['revision'] for e in extensions]),'report':''.join(page),'next_cursor':end if end<len(blocks) else None,'display_title':title,'cursor':cursor,'reader_end':end,'stream':stream,'blocks':presented,'sections':followups}

    def append_extension(self, identifier, context, revision, operation_id, report, sources=None, title=''):
        with self.lock:
            fetched=self.get(identifier,context,revision)
            if fetched['status']!='ok':return fetched
            data=self.read({});rows=data.setdefault('extensions',{}).setdefault(identifier,[])
            existing=next((e for e in rows if e['operation_id']==operation_id),None)
            if existing:return {'status':'completed','extension_revision':existing['revision'],'research_id':identifier,'research_revision':revision}
            self.backup_metadata();entry={'revision':stable(report),'report':reader_text(report),'sources':sources or [],'operation_id':operation_id,'created':now()}
            if title:entry['title']=display_title(title)
            rows.append(entry)
            metadata=self.ensure_metadata(data,identifier)
            metadata['update_sequence']=metadata.get('update_sequence',0)+1
            if report.strip():
                from ..research_illustrations import place_images
                metadata['selected_images']=place_images(metadata.get('validated_images') or metadata.get('selected_images',[]),fetched['artifact']['report']+'\n\n'+'\n\n'.join(e['report'] for e in rows))
                activity=data.get('extension_activity',{}).get(identifier,{})
                if activity.get('operation_id')==operation_id:activity.update(phase='complete',reason='',next_attempt=None)
                operation=data.setdefault('extension_operations',{}).setdefault(identifier,{}).setdefault(operation_id,{})
                operation.update(phase='complete',reason='',next_attempt=None,operation_id=operation_id)
            self.write(data)
            return {'status':'completed','extension_revision':entry['revision'],'research_id':identifier,'research_revision':revision}

    def get(self, identifier, context, revision=''):
        with self.lock:
            data=self.snapshot()
            item=data['artifacts'].get(identifier)
            pending=data.get('requests',{}).get(identifier)
            if not item and pending and pending.get('canonical_research_id') and scope(pending)==scope(context) and identifier not in data.get('removed',{}):return self.get(pending['canonical_research_id'],context,revision)
            if not item and pending:item={**pending,'revision':stable(identifier,'pending'),'report':'','summary':'','sources':pending.get('sources',[]),'failures':pending.get('failures',[]),'completeness':'failed' if pending.get('phase')=='failed' else 'pending'}
            from ..research_sessions import root_id
            if not item or scope(item) != scope(context) or identifier in data.get('removed',{}) or root_id(data,identifier) in data.get('removed',{}):return {'status': 'not_found'}
            if revision and revision != item['revision']:
                archived=next((r['artifact'] for r in data.get('report_history',{}).get(identifier,[]) if r['artifact']['revision']==revision),None)
                if not archived:return {'status': 'conflict', 'reason': 'research_revision_changed'}
                item=archived
            return {'status': 'ok', 'artifact': copy.deepcopy(item)}

    def revise_report(self,identifier,context,expected_revision,report,operation_id):
        """Complete a generated report without destroying its original revision or edited draft."""
        if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
        if not isinstance(report,str) or not report.strip() or len(report)>500000:return {'status':'rejected','reason':'invalid_report'}
        with self.lock:
            found=self.get(identifier,context)
            if found['status']!='ok':return found
            old=found['artifact'];data=self.read({})
            history=data.setdefault('report_history',{}).setdefault(identifier,[])
            if any(r['operation_id']==operation_id for r in history):return self.brief(old)
            if old['revision']!=expected_revision:return {'status':'conflict','reason':'research_revision_changed'}
            self.backup_metadata();report=reader_text(safe(report))
            history.append({'artifact':copy.deepcopy(old),'operation_id':operation_id,'created':now()})
            title=display_title(re.search(r'^# (.+)',report,re.M).group(1)) if re.search(r'^# (.+)',report,re.M) else old.get('display_title',display_title(old['query']))
            updated={**old,'report':report,'summary':report[:1600],'revision':hashlib.sha256(report.encode()).hexdigest(),'display_title':title,'phase':'complete'}
            data['artifacts'][identifier]=updated
            data['requests'][identifier].update(display_title=title,phase='complete',next_attempt=None,waiting_reason='')
            from ..research_illustrations import place_images,relevant_candidate
            images=data['requests'][identifier].get('validated_images') or data['requests'][identifier].get('selected_images',[])
            if old.get('kind','research')=='research':images=[row for row in images if relevant_candidate(row,old['query'])]
            data['requests'][identifier]['selected_images']=place_images(images,report)
            self.write(data)
            return self.brief(updated)

    def find(self, query, mode, context, operation_id='', freshness=3600):
        with self.lock:
            data=self.snapshot();rows=data['artifacts'].values()
            for item in sorted(rows, key=lambda r:r['created'], reverse=True):
                if scope(item) != scope(context) or item['id'] in data.get('removed',{}) or item.get('kind','research')!='research':continue
                if operation_id and item.get('operation_id') == operation_id:
                    if (item['query'], item['mode']) != (query, mode):raise ValueError('operation_id_reused')
                    return copy.deepcopy(item)
                if context.get('research_page_request'):continue
                if (normal(item['query']), item['mode'], item.get('session_id')) == (normal(query), mode, context.get('session_id', '')) and time.time()-item['created_epoch'] < freshness and item['completeness'] == 'complete':return copy.deepcopy(item)
        return None

    def save(self, query, mode, report, sources, failures, context, operation_id):
        # Explicit partial flag if the local safety bound is reached; no silent truncation.
        if len(report)>500_000:
            report=report[:500_000]+'\n\n[Local report size limit reached.]'
            failures=[*failures, {'reason': 'local_report_size_limit'}]
        report=safe(report)
        revision=hashlib.sha256(report.encode()).hexdigest()
        item={'id': stable('research-artifact', scope(context), operation_id or revision),
              'revision': revision, 'query': query, 'mode': mode, 'report': report,
              'summary': report[:1600], 'sources': sources, 'failures': failures,
              'completeness': 'partial' if failures else 'complete', 'created': now(),
              'created_epoch': time.time(), 'operation_id': operation_id,
              **{k:context.get(k, False if k=='guest' else '') for k in ('profile_id','project_id','guest','session_id')}}
        with self.lock:
            data=self.read( {'artifacts': {}, 'imports': {}})
            old=data['artifacts'].get(item['id'])
            if old:
                if old['query']!=query or old['mode']!=mode:raise ValueError('operation_id_reused')
                return copy.deepcopy(old)
            metadata=data.get('requests',{}).get(item['id'],{})
            item.update({k:metadata[k] for k in ('display_title','thread_id','kind','source_research_id','research_session_id') if k in metadata})
            # Report, prepared images and terminal state publish in one authoritative write.
            item['phase']='complete'
            if metadata:
                started=metadata.get('active_since')
                if isinstance(started,(int,float)):metadata['processing_seconds']=metadata.get('processing_seconds',0)+max(0,time.time()-started)
                metadata.update(phase='preparing_layout' if context.get('prepare_publication') else 'complete',publication_state='preparing' if context.get('prepare_publication') else 'published',active_since=None,next_attempt=None,waiting_reason='',update_sequence=metadata.get('update_sequence',0)+1)
            data['artifacts'][item['id']]=item;self.write( data)
        return copy.deepcopy(item)

    @staticmethod
    def brief(item):
        return {'status': 'waiting_for_quota' if item.get('completeness')=='pending' else 'failed' if item.get('completeness')=='failed' else 'completed' if item['sources'] or item.get('kind') in {'documentary','chat'} else 'failed', 'kind':item.get('kind','research'), 'source_research_id':item.get('source_research_id',''), 'research_id': item['id'],
                'research_revision': item['revision'], 'query': item['query'], 'summary': item['summary'],
                'results': [{k:r[k] for k in ('title','url','retrieved_at')} for r in item['sources']],
                'completeness': item['completeness'], 'failures': item['failures'],
                'characters': len(item['report']), 'retrieved_at': item['created'], 'display_title':item.get('display_title') or display_title(item['query']), 'phase':item.get('phase','complete'), 'thread_id':item.get('thread_id','research-'+item['id'])}

    def page(self, identifier, context, revision='', offset=0, limit=12000):
        result=self.get(identifier, context, revision)
        if result['status']!='ok':return result
        item=result['artifact'];offset=max(0,int(offset));limit=max(1,min(20000,int(limit)))
        return {**self.brief(item), 'status':'ok', 'content':item['report'][offset:offset+limit],
                'offset':offset, 'next_offset':offset+limit if offset+limit<len(item['report']) else None}

    def import_note(self, identifier, revision, context, operation_id, notes):
        if context.get('guest'):return {'status':'rejected','reason':'owner_notes_unavailable'}
        if not revision:return {'status':'rejected','reason':'research_revision_required'}
        # Journal intent before the write; a crash can be reconciled by the exact body hash.
        with self.lock:
            result=self.get(identifier,context,revision)
            if result['status']!='ok':return result
            item=result['artifact']
            if not item['sources']:return {'status':'rejected','reason':'no_sourced_research'}
            data=self.read({'artifacts':{},'imports':{}})
            key=stable('research-note',scope(context),operation_id or identifier)
            entry=data.setdefault('imports',{}).get(key)
            if entry and (entry['research_id'],entry['revision'])!=(identifier,revision):return {'status':'conflict','reason':'operation_id_reused'}
            body=item['report'];fingerprint=lambda text:hashlib.sha256(text.encode()).hexdigest()
            if entry and entry.get('note_id'):
                note=notes.get_note_by_id(entry['note_id'])
                if not note or fingerprint(note['content'])!=revision:return {'status':'conflict','reason':'imported_note_changed'}
                return {'status':'completed','note_id':note['id'],'verified':True,'duplicate':True,'research_id':identifier}
            if entry:
                matches=[n for n in notes.get_notes_state()['notes'] if fingerprint(n.get('content',''))==revision]
                if len(matches)!=1:return {'status':'uncertain','reason':'reconcile_note_write_before_retry'}
                note=matches[0]
            else:
                data['imports'][key]={'research_id':identifier,'revision':revision,'state':'writing','created':now()};self.write(data)
                note=notes.add_note(body,category='Research')
            saved=notes.get_note_by_id(note['id'])
            if not saved or fingerprint(saved.get('content',''))!=revision:return {'status':'uncertain','reason':'note_verification_failed'}
            data['imports'][key].update(state='completed',note_id=note['id'],verified_at=now());self.write(data)
            return {'status':'completed','note_id':note['id'],'research_id':identifier,'research_revision':revision,'characters':len(body),'verified':True}

    def listing(self, context, offset=0, limit=30):
        self.reconcile_publication(context)
        with self.lock:
            data=self.snapshot()
            rows=[r for r in data['artifacts'].values() if scope(r)==scope(context) and r['id'] not in data.get('removed',{})]
            for identifier,pending in data.get('requests',{}).items():
                if identifier not in data['artifacts'] and identifier not in data.get('removed',{}) and not pending.get('canonical_research_id') and scope(pending)==scope(context):
                    found=self.get(identifier,context)
                    if found['status']=='ok':rows.append(found['artifact'])
            rows.sort(key=lambda r:r['created'],reverse=True)
            removed=[]
            for identifier,entry in data.get('removed',{}).items():
                row=data['artifacts'].get(identifier) or data.get('requests',{}).get(identifier)
                if not row or scope(row)!=scope(context):continue
                if 'report' not in row:row={**row,'report':'','summary':'','revision':stable(identifier,'pending'),'sources':row.get('sources',[]),'failures':row.get('failures',[]),'completeness':'pending'}
                removed.append({**self.brief(row),'undo_token':entry['token']})
            from ..research_sessions import root_id
            rows=[row for row in rows if root_id(data,row['id'])==row['id']]
            removed=[row for row in removed if root_id(data,row['research_id'])==row['research_id']]
            return {'status':'ok','removed':removed[-20:],'total':len(rows),'items':[{**self.brief(r),'followup_count':sum(bool(entry.get('report','').strip()) for entry in data.get('extensions',{}).get(r['id'],[]))} for r in rows[max(0,offset):max(0,offset)+max(1,min(50,limit))]]}

    def document(self, identifier, context, revision='', bounded=False):
        self.reconcile_publication(context,identifier)
        metadata=self.request_state(identifier,context)
        if metadata.get('canonical_research_id') and self.get(metadata['canonical_research_id'],context)['status']=='ok':return {'status':'redirect','research_id':metadata['canonical_research_id']}
        with self.lock:
            self.snapshot();cache_key=(scope(context),identifier,revision,bounded)
            cached=self._document_cache.get(cache_key) if bounded else None
            if cached and time.time()-cached[0]<30:return copy.deepcopy(cached[1])
        result=self.get(identifier,context,revision)
        if result['status']!='ok':return result
        item=result['artifact']
        sources=[{**s,'id':'S'+str(i+1)} for i,s in enumerate(self.source_catalog(item))]
        sections=[{'id':'section-'+str(i),'title':line.lstrip('# ').strip()} for i,line in enumerate(item['report'].splitlines()) if re.match(r'^#{1,3} ',line)]
        with self.lock:
            draft=self.snapshot().get('drafts',{}).get(identifier)
        document={**self.brief(item),'status':'ok','report':item['report'],'sources':sources,'linked_sources':self.report_links(item,context),'sections':sections,'draft':copy.deepcopy(draft),**self.media(identifier,context),'legacy_evidence':'Sourced research excerpts.' in item['report'] or 'not a completed synthesis.' in item['report'],'evidence_collection':'Sourced research excerpts.' in item['report'] or 'not a completed synthesis.' in item['report']}
        extensions=self.snapshot().get('extensions',{}).get(identifier,[])
        if any(entry['report'].strip() for entry in extensions):document['evidence_collection']=False
        metadata=self.request_state(identifier,context)
        document['extension_activity']=self.extension_state(identifier,context)
        document['document_revisions']=metadata.get('document_revisions',[])
        document['research_cards']=metadata.get('research_cards',[])
        from ..research_illustrations import IMAGE_VERSION,place_images,report_image_limit
        document['images_prepared']=metadata.get('images_prepared',False) and metadata.get('image_enrichment_version')==IMAGE_VERSION
        document['image_sources']=[{'id':r['source_id'],'url':r['source_url'],'title':r['caption'],'content':'Image attribution page; not claim evidence.'} for r in self.images(identifier,context) if r.get('source_id','').startswith('P')]
        document.update(display_title=metadata.get('display_title') or display_title(item['query']),thread_id=metadata.get('thread_id','research-'+identifier),phase=metadata.get('phase','complete'),processing_seconds=metadata.get('processing_seconds'),active_since=metadata.get('active_since'),next_attempt=metadata.get('next_attempt'),waiting_reason=metadata.get('waiting_reason'),image_items=[{k:v for k,v in image.items() if k!='url'} for image in self.images(identifier,context) if not image.get('source_only')])
        headline=re.search(r'^# ([^\n]+)',item.get('report',''),re.M)
        if headline and item.get('kind','research')=='research':
            corrected=display_title(headline[1])
            if corrected.casefold().startswith(document['display_title'].casefold()+'.'):document['display_title']=corrected
        # Presentation only: old image IDs remain available to existing drafts.
        composed=item['report']+'\n\n'+'\n\n'.join(entry['report'] for entry in extensions)
        document['image_items']=(place_images(document['image_items'],composed,item['query']) if composed.strip() else document['image_items'][:report_image_limit(composed,item['query'])])
        from ..research_documents import DocumentFiles
        document.update(DocumentFiles(self).presentation(identifier,context))
        if bounded:
            document.update(self.reader(identifier,context,revision,limit=20000,stream='base'))
            document['extensions']=self.reader(identifier,context,revision,stream='extensions')
            document['sources']=[{**r,'content':evidence_excerpt(r)} for r in sources]
            document['summary']=document['summary'][:1000]
        from ..research_sessions import publication_info,pages
        document.update(publication_info(self.snapshot(),identifier))
        document['pages']=pages(self,identifier,context).get('pages',[])
        if item.get('kind','research')=='research' and (item.get('completeness') in {'pending','failed'} or document['publication_state']=='preparing'):
            document.update(report='',summary='',sources=[],linked_sources=[],image_items=[],image_sources=[],media=[],sections=[],extensions={'report':'','blocks':[],'sections':[],'reader_end':0,'next_cursor':None},next_cursor=None,completeness='failed' if metadata.get('phase')=='failed' else 'pending')
        if bounded:
            with self.lock:
                self._document_cache[cache_key]=(time.time(),copy.deepcopy(document))
                while len(self._document_cache)>24:self._document_cache.pop(next(iter(self._document_cache)))
        return document

    def publish_prepared(self,identifier,context):
        """The terminal publication is one write after optional assets settle."""
        with self.lock:
            found=self.get(identifier,context)
            if found['status']!='ok':return found
            data=self.read({})
            metadata=self.ensure_metadata(data,identifier)
            metadata.update(publication_state='published',phase='complete',next_attempt=None,waiting_reason='',update_sequence=metadata.get('update_sequence',0)+1)
            data['artifacts'][identifier]['phase']='complete'
            self.write(data)
            return self.brief(data['artifacts'][identifier])


    def save_draft(self, identifier, context, revision, expected_revision, html):
        import bleach,shutil
        if not revision:return {'status':'rejected','reason':'source_revision_required'}
        result=self.get(identifier,context,revision)
        if result['status']!='ok':return result
        if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
        if not isinstance(html,str) or len(html)>1_000_000:return {'status':'rejected','reason':'draft_too_large'}
        html=bleach.clean(html,tags={'p','h1','h2','h3','h4','strong','em','u','s','ul','ol','li','blockquote','pre','code','br','hr','a','table','thead','tbody','tr','th','td','img','span','div'},attributes={'a':['href','title','data-citation'],'img':['src','alt','title'],'th':['colspan','rowspan'],'td':['colspan','rowspan'],'span':['data-citation'],'div':['data-page-break','data-video-url','data-video-title','data-illustrated','data-illustrated-copy','data-composition','data-image-group']},protocols={'https','http'},strip=True)
        with self.lock:
            data=self.read({'artifacts':{},'imports':{}});drafts=data.setdefault('drafts',{});previous=drafts.get(identifier)
            if (previous or {}).get('revision','')!=expected_revision:return {'status':'conflict','reason':'draft_revision_changed','draft':previous}
            if not self.repository and self.path.exists() and not self.path.with_suffix('.before-drafts.bak').exists():shutil.copy2(self.path,self.path.with_suffix('.before-drafts.bak'))
            draft={'html':html,'revision':hashlib.sha256(html.encode()).hexdigest(),'source_revision':revision,'updated':now()}
            data.setdefault('draft_history',{}).setdefault(identifier,[]).append(copy.deepcopy(previous or {'html':'','revision':''}))
            drafts[identifier]=draft
            metadata=self.ensure_metadata(data,identifier)
            metadata['update_sequence']=metadata.get('update_sequence',0)+1;self.write(data)
        return {'status':'completed','draft':draft}

    def export(self, identifier, context, revision, format, draft=False):
        import io,html as html_module
        from bs4 import BeautifulSoup
        result=self.document(identifier,context,revision)
        if result['status']!='ok':raise ValueError(result['status'])
        if format not in {'md','html','pdf','docx'}:raise ValueError('unsupported_export')
        # Private page citations reopen through the application, which resolves owner scope.
        # Never embed a connection credential or an unusable header-only binary URL.
        result['sources']=[{**s,'url':f'http://127.0.0.1:5173/#research={identifier}&source={s["id"]}'} if s.get('attachment_id') else s for s in result['sources']]
        with self.lock:extensions=self.read({}).get('extensions',{}).get(identifier,[])
        result['report']+=''.join('\n\n'+e['report'] for e in extensions)
        body=result.get('draft',{}).get('html','') if draft and result.get('draft') else ''
        if not body:
            from markdown_it import MarkdownIt
            body=MarkdownIt('default',{'html':False}).render(result['report'])
        soup=BeautifulSoup(body,'html.parser')
        source_text='\n\nSources\n'+'\n'.join(f"[{s['id']}] {s['title']}: {s['url']}" for s in result['sources'])
        text=soup.get_text('\n')+source_text
        if format=='md':return (text if draft else result['report']+source_text).encode(),'text/markdown; charset=utf-8'
        from ..research_documents import export_illustrations
        illustrations=export_illustrations(self,identifier,context,soup,result,draft)
        title=result.get('display_title') or display_title(result['query'])
        if format=='html':
            import base64
            for image in soup.find_all('img'):
                image['src']='data:image/jpeg;base64,'+base64.b64encode(illustrations[image['data-export-image']]).decode();image['style']='max-width:260px;height:auto;object-fit:contain'
                del image['data-export-image']
            body=str(soup)
            links=''.join('<li><a href="'+html_module.escape(s['url'],quote=True)+'">['+s['id']+'] '+html_module.escape(s['title'])+'</a></li>' for s in result['sources'])
            return ('<!doctype html><meta charset="utf-8"><title>'+html_module.escape(title)+'</title><main>'+body+'<h2>Sources</h2><ol>'+links+'</ol></main>').encode(),'text/html; charset=utf-8'
        output=io.BytesIO()
        if format=='docx':
            from docx import Document
            from docx.oxml import OxmlElement
            from docx.oxml.ns import qn
            from docx.opc.constants import RELATIONSHIP_TYPE
            from docx.shared import Inches
            doc=Document();doc.core_properties.title=title
            for node in soup.find_all(['h1','h2','h3','p','li','blockquote','pre','table','img','div']):
                if node.name=='div':
                    if node.get('data-page-break'):doc.add_page_break()
                    continue
                if node.name=='img':
                    doc.add_picture(io.BytesIO(illustrations[node['data-export-image']]),width=Inches(2.6))
                    if node.get('alt'):doc.add_paragraph(node['alt'],style='Caption')
                    continue
                if node.find_parent(['li','blockquote','pre','table']):continue
                if node.name=='table':
                    rows=node.find_all('tr');width=max((len(r.find_all(['td','th'])) for r in rows),default=0)
                    if width:
                        table=doc.add_table(rows=0,cols=width);table.style='Table Grid'
                        for row in rows:
                            cells=table.add_row().cells
                            for i,cell in enumerate(row.find_all(['td','th'])):cells[i].text=cell.get_text()
                    continue
                if node.name.startswith('h'):doc.add_heading(node.get_text(),min(3,int(node.name[1])))
                else:
                    paragraph=doc.add_paragraph(style='List Bullet' if node.name=='li' else None)
                    for part in node.descendants:
                        if isinstance(part,str):
                            run=paragraph.add_run(part);parents={p.name for p in part.parents};run.bold=bool({'strong','b'}&parents);run.italic=bool({'em','i'}&parents)
            doc.add_heading('Sources',1)
            for source in result['sources']:
                paragraph=doc.add_paragraph('['+source['id']+'] ');link=OxmlElement('w:hyperlink');link.set(qn('r:id'),paragraph.part.relate_to(source['url'],RELATIONSHIP_TYPE.HYPERLINK,is_external=True));run=OxmlElement('w:r');value=OxmlElement('w:t');value.text=source['title'];run.append(value);link.append(run);paragraph._p.append(link)
            doc.save(output);return output.getvalue(),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Image as ReportImage,PageBreak
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib import colors
        styles=getSampleStyleSheet();story=[]
        font=Path('C:/Windows/Fonts/segoeui.ttf')
        if font.exists():
            if 'NovaExport' not in pdfmetrics.getRegisteredFontNames():pdfmetrics.registerFont(TTFont('NovaExport',str(font)))
            for style in styles.byName.values():style.fontName='NovaExport'
        for node in soup.find_all(['h1','h2','h3','p','li','blockquote','pre','table','img','div']):
            if node.name=='div':
                if node.get('data-page-break'):story.append(PageBreak())
                continue
            if node.name=='img':
                image=ReportImage(io.BytesIO(illustrations[node['data-export-image']]))
                scale=min(190/image.imageWidth,180/image.imageHeight,1);image.drawWidth=image.imageWidth*scale;image.drawHeight=image.imageHeight*scale;image.hAlign='LEFT';story.extend([image,Spacer(1,6)])
                if node.get('alt'):story.extend([Paragraph(html_module.escape(node['alt']),styles['BodyText']),Spacer(1,9)])
                continue
            if node.find_parent(['li','blockquote','pre','table']):continue
            if node.name=='table':
                rows=[[Paragraph(html_module.escape(c.get_text()),styles['BodyText']) for c in row.find_all(['td','th'])] for row in node.find_all('tr')]
                if rows:
                    width=max(map(len,rows));rows=[row+[Paragraph('',styles['BodyText'])]*(width-len(row)) for row in rows]
                    table=Table(rows,colWidths=[460/width]*width,repeatRows=1)
                    table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.4,colors.lightgrey),('BACKGROUND',(0,0),(-1,0),colors.whitesmoke),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.extend([table,Spacer(1,12)])
                continue
            value=node.get_text()
            if not value.strip():continue
            style=styles['Heading'+node.name[1]] if node.name in {'h1','h2','h3'} else styles['BodyText']
            story.extend([Paragraph(html_module.escape(value).replace('\\n','<br/>'),style),Spacer(1,9)])
        story.extend([Paragraph('Sources',styles['Heading2']),Spacer(1,8)])
        for source in result['sources']:story.append(Paragraph('['+source['id']+'] <link href="'+html_module.escape(source['url'],quote=True)+'">'+html_module.escape(source['title'])+'</link>',styles['BodyText']))
        SimpleDocTemplate(output,title=title).build(story)
        return output.getvalue(),'application/pdf'

    def report_links(self, item, context):
        """Only offer follow-on URLs that occur in the preserved source evidence."""
        cache_key=(scope(context),item['id'],item['revision'])
        cached=self._link_cache.get(cache_key)
        if cached and time.time()-cached[0]<1800:return copy.deepcopy(cached[1])
        pattern=r'https?://[^\s<>\)\]"\x27]+'
        evidence=set()
        for row in item['sources']:
            evidence.add(row['url'])
            evidence.update(re.findall(pattern,str(row.get('content',''))))
        from markdown_it import MarkdownIt
        from bs4 import BeautifulSoup
        parsed_report=BeautifulSoup(MarkdownIt('commonmark',{'html':False}).render(item['report']),'html.parser')
        titles={a.get('href'):a.get_text(' ',strip=True) for a in parsed_report.find_all('a',href=True)}
        found=[];seen=set();cache_scope=stable(scope(context),item['id'],item['revision'])
        for url in re.findall(pattern,item['report']):
            parsed=urlsplit(url)
            if url in seen or url not in evidence or not parsed.hostname or parsed.username or parsed.password:continue
            seen.add(url);link_id='L'+hashlib.sha256((cache_scope+url).encode()).hexdigest()[:24]
            self.reader_links[(cache_scope,link_id)]=(url,time.time())
            found.append({'id':link_id,'url':url,'title':titles.get(url) or ('Related video' if self.video_id(url) else parsed.hostname),'retrieved_at':item['created']})
            if len(found)==200:break
        self._link_cache[cache_key]=(time.time(),copy.deepcopy(found))
        return found

    @staticmethod
    def video_id(url):
        parsed=urlsplit(url);host=(parsed.hostname or '').lower()
        from urllib.parse import parse_qs
        value=parsed.path.strip('/') if host=='youtu.be' else (parse_qs(parsed.query).get('v',[''])[0] or parsed.path.rsplit('/',1)[-1]) if host=='youtube.com' or host.endswith('.youtube.com') else ''
        return value if parsed.scheme in {'http','https'} and re.fullmatch(r'[\w-]{11}',value,flags=re.ASCII) else None

    def media(self, identifier, context):
        result=self.get(identifier,context)
        if result['status']!='ok':return result
        item=result['artifact']
        with self.lock:
            saved=self.snapshot().get('media',{}).get(identifier,{})
        found={}
        for i,source in enumerate(self.source_catalog(item)):
            video=self.video_id(source.get('url',''))
            if video:found[video]={**source,'id':'S'+str(i+1),'video_id':video}
        for row in self.report_links(item,context):
            video=self.video_id(row['url'])
            if video:found.setdefault(video,{**row,'video_id':video})
        for row in saved.get('items',[]):found.setdefault(row['video_id'],row)
        return {'media':list(found.values()),'media_revision':saved.get('revision',''),
                'media_status':saved.get('status','idle'),'media_job_id':saved.get('job_id',''),'media_failures':saved.get('failures',[])}

    def media_state(self, identifier, context, revision, *, status=None, attempted=None, items=None, failures=None, job_id=None):
        import shutil
        with self.lock:
            result=self.get(identifier,context,revision)
            if result['status']!='ok':return result
            if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
            data=self.read({'artifacts':{},'media':{}})
            previous=data.setdefault('media',{}).get(identifier,{})
            if status=='pending' and previous.get('status') not in {None,'idle'}:return copy.deepcopy(previous)
            if attempted and previous.get('attempted'):return {**copy.deepcopy(previous),'already_attempted':True}
            if not self.repository and self.path.exists() and not self.path.with_suffix('.before-media.bak').exists():shutil.copy2(self.path,self.path.with_suffix('.before-media.bak'))
            current={**previous,'source_revision':revision,'updated_at':now()}
            if status is not None:current['status']=status
            if attempted is not None:current['attempted']=attempted
            if items is not None:current['items']=items
            if failures is not None:current['failures']=failures
            if job_id is not None:current['job_id']=job_id
            current['revision']=hashlib.sha256(json.dumps(current,sort_keys=True).encode()).hexdigest()
            data['media'][identifier]=current
            metadata=self.ensure_metadata(data,identifier)
            metadata['update_sequence']=metadata.get('update_sequence',0)+1;self.write(data)
            return copy.deepcopy(current)

    @staticmethod
    def _fetch_public_source(url, image=False):
        import socket,ipaddress,urllib3,certifi
        from urllib.parse import urljoin
        for _ in range(5):
            parsed=urlsplit(url)
            if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password or parsed.port not in {None,80,443}:raise ValueError('invalid_source_url')
            port=parsed.port or (443 if parsed.scheme=='https' else 80)
            addresses=socket.getaddrinfo(parsed.hostname,port,type=socket.SOCK_STREAM)
            if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):raise ValueError('non_public_source')
            ip=addresses[0][4][0]
            pool=urllib3.HTTPSConnectionPool(ip,port=port,assert_hostname=parsed.hostname,server_hostname=parsed.hostname,cert_reqs='CERT_REQUIRED',ca_certs=certifi.where()) if parsed.scheme=='https' else urllib3.HTTPConnectionPool(ip,port=port)
            target=parsed.path or '/'
            if parsed.query:target+='?'+parsed.query
            try:
                with pool.request('GET',target,timeout=urllib3.Timeout(connect=5,read=15),redirect=False,retries=False,preload_content=False,headers={'Host':parsed.netloc,'User-Agent':'NovaResearchReader/1.0','Accept':'image/webp,image/png,image/jpeg;q=0.9' if image else 'application/pdf,text/html,text/plain,text/markdown'}) as response:
                    if response.status in {301,302,303,307,308}:url=urljoin(url,response.headers.get('Location',''));continue
                    if response.status!=200:raise ValueError('source_http_error')
                    mime=response.headers.get('Content-Type','').split(';')[0].lower()
                    if mime not in ({'image/png','image/jpeg','image/webp'} if image else {'application/pdf','text/plain','text/markdown','text/html'}):raise ValueError('unsupported_document')
                    content=bytearray()
                    for chunk in response.stream(65536):
                        content.extend(chunk)
                        if len(content)>12_000_000:raise ValueError('document_too_large')
                    return bytes(content),mime,url
            finally:pool.close()
        raise ValueError('too_many_redirects')

    def images(self, identifier, context):
        fetched=self.get(identifier,context)
        if fetched['status']!='ok':return []
        metadata=self.request_state(identifier,context)
        images=list(metadata.get('selected_images',[])) if metadata.get('images_prepared') else []
        if images:
            from ..research_illustrations import report_image_limit
            limit=report_image_limit(fetched['artifact'].get('report',''),fetched['artifact'].get('query',''))
            images=[{**row,**({'source_only':True} if index>=limit else {})} for index,row in enumerate(images)]
        images.extend(metadata.get('source_images',[]));seen={r['url'] for r in images}
        ids={row['id'] for row in images}
        images.extend({**row,'source_only':True} for row in metadata.get('image_archive',[]) if row['id'] not in ids)
        from ..research_illustrations import useful_image
        images=[r for r in images if useful_image(r)]
        source_ids={row['url']:'S'+str(i+1) for i,row in enumerate(self.source_catalog(fetched['artifact']))}
        images=[{**row,'source_id':source_ids.get(row.get('source_url'),row.get('source_id',''))} for row in images]
        if metadata.get('images_prepared'):return images
        for index,source in enumerate(self.source_catalog(fetched['artifact'])):
            for row in source.get('images',[]):
                url=str(row.get('url',''));parsed=urlsplit(url)
                if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password or url in seen:continue
                seen.add(url);images.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':row.get('caption') or source['title'],'source_id':'S'+str(index+1),'publication':parsed.hostname})
                if len(images)>=64:return images
        return images

    def image_bytes(self, identifier, context, image_id):
        from PIL import Image
        import io
        image=next((r for r in self.images(identifier,context) if r['id']==image_id),None)
        if not image:raise ValueError('not_found')
        key=(stable(scope(context),identifier),'image',image_id)
        if key in self.reader_cache:return self.reader_cache[key][1]
        content,mime,_=self._fetch_public_source(image['url'],image=True)
        if len(content)>8_000_000:raise ValueError('image_too_large')
        with self.image_worker:
            with Image.open(io.BytesIO(content)) as decoded:
                if min(decoded.width,decoded.height)<160 or max(decoded.width,decoded.height)<320 or decoded.width*decoded.height>20_000_000 or getattr(decoded,'n_frames',1)>1:raise ValueError('unsuitable_image')
                decoded.verify()
        self.reader_cache[key]=(time.time(),(content,mime))
        while len(self.reader_cache)>64 or sum(len(v[1][0]) for v in self.reader_cache.values())>16_000_000:self.reader_cache.pop(next(iter(self.reader_cache)))
        return content,mime

    def source_bytes(self, identifier, context, source_id, reader=False, revision=''):
        """Public source reader; follow-on IDs are minted from actual extracted links."""
        result=self.get(identifier,context,revision)
        if result['status']!='ok':raise ValueError(result['status'])
        item=result['artifact'];cache_scope=stable(scope(context),identifier,item['revision'])
        if re.fullmatch(r'P[0-9a-f]{24}',source_id):
            image=next((r for r in self.images(identifier,context) if r.get('source_id')==source_id),None)
            if not image:raise ValueError('not_found')
            url=image['source_url']
        elif re.fullmatch(r'S[1-9][0-9]*',source_id):
            index=int(source_id[1:])-1
            catalog=self.source_catalog(item)
            if index>=len(catalog):raise ValueError('not_found')
            url=catalog[index]['url']
        elif re.fullmatch(r'L[0-9a-f]{24}',source_id):
            entry=self.reader_links.get((cache_scope,source_id))
            if not entry or time.time()-entry[1]>3600:raise ValueError('source_link_expired')
            url=entry[0]
        else:raise ValueError('invalid_source')
        key=(cache_scope,source_id,reader)
        cached=self.reader_cache.get(key)
        if cached and time.time()-cached[0]<3600:return cached[1]
        content,mime,final_url=self._fetch_public_source(url)
        if mime=='application/pdf':return content,mime
        import bleach,html
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin
        if mime=='text/markdown':
            from markdown_it import MarkdownIt
            content=MarkdownIt('commonmark',{'html':False}).render(content.decode('utf-8',errors='replace')).encode()
            mime='text/html'
        if mime=='text/html':
            soup=BeautifulSoup(content,'html.parser')
            root=article_root(soup)
            text=root.get_text('\n',strip=True)
            from ..research_illustrations import page_candidates
            # Mint scoped IDs from actual article markup; bytes still pass the validated image transport.
            source_images=[]
            if reader:
                candidates=page_candidates(root,final_url,{'url':final_url,'title':root.get_text(' ',strip=True)[:160] or final_url},identifier,source_id)[:6 if len(text)>18000 else 4]
                for row,node in candidates:
                    if node:
                        node.attrs={'data-research-image':row['id']}
                        source_images.append({**row,'source_only':True})
                if source_images:
                    with self.lock:
                        metadata=self.request_state(identifier,context)
                        old=[r for r in metadata.get('source_images',[]) if r.get('source_id')!=source_id]
                        self.request_state(identifier,context,source_images=[*source_images,*old][:96])
            links={}
            for heading in root.find_all(id=True):heading['id']='reader-'+source_id+'-'+str(heading['id'])
            for anchor in root.find_all('a'):
                original_href=anchor.get('href','')
                if original_href.startswith('#'):
                    anchor.attrs={'href':'#reader-'+source_id+'-'+original_href[1:]}
                    continue
                href=urljoin(final_url,original_href)
                if href in links.values():anchor.unwrap();continue
                parsed=urlsplit(href)
                if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password or len(links)>=200:
                    anchor.unwrap();continue
                link_id='L'+hashlib.sha256((cache_scope+href).encode()).hexdigest()[:24]
                links[link_id]=href
                self.reader_links[(cache_scope,link_id)]=(href,time.time())
                anchor.attrs={'href':'#'+link_id,'data-source-link':link_id}
            sanitized=bleach.clean(str(root),tags={'p','h1','h2','h3','h4','h5','ul','ol','li','blockquote','pre','code','br','hr','a','table','thead','tbody','tr','th','td','strong','em','b','i','sup','sub','img'},attributes={'*':['id'],'img':['data-research-image'],'a':['href','data-source-link'],'th':['colspan','rowspan'],'td':['colspan','rowspan']},protocols={'http','https'},strip=True)
        else:
            text=content.decode('utf-8',errors='replace');links={}
            sanitized=''.join('<p>'+html.escape(p).replace('\n','<br>')+'</p>' for p in text.split('\n\n'))
        answer=(json.dumps({'html':sanitized,'links':links,'url':final_url,'images':[{k:v for k,v in r.items() if k!='url'} for r in source_images] if mime=='text/html' else []}).encode(),'application/json') if reader else (text.encode(),'text/plain; charset=utf-8')
        self.reader_cache[key]=(time.time(),answer)
        while len(self.reader_cache)>64 or sum(len(v[1][0]) for v in self.reader_cache.values())>16_000_000:self.reader_cache.pop(next(iter(self.reader_cache)))
        while len(self.reader_links)>2000:self.reader_links.pop(next(iter(self.reader_links)))
        return answer
