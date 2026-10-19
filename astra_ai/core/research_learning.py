"""Sourced research over the existing durable queue, outside text/audio processing."""
import asyncio,copy,json,os,re,time,uuid
from pathlib import Path
from datetime import datetime,timedelta,timezone
from urllib.parse import urlsplit
from astra_ai.memory.shared_memory import read,atomic,StorageLock,stable,normal,safe,now,SENSITIVE
from astra_ai.memory.category_policy import matches_scope,lifecycle
from .background_budget import BudgetPaused

class ResearchLearning:
    def __init__(self,root,memory,jobs,search,summarize=None):
        self.root=Path(root).resolve();self.memory=memory;self.jobs=jobs;self.search=search;self.summarize=summarize;self.path=self.root/'research'/'index.json';self.lock=StorageLock(self.root/'research'/'index.lock');self.cpu=asyncio.Semaphore(1);self.loop=None;self.paused=False
    def load(self):return read(self.path,{'notes':{},'metadata':{'paused':False}})
    def initialize(self):
        with self.lock:
            data=self.load();self.paused=data.get('metadata',{}).get('paused',False)
            for note in data['notes'].values():
                if note['state']=='running':note['state']='queued'
            atomic(self.path,data)
    def request(self,query,context,operation_id='',requested=True,refresh=False,source_refs=None,subquestions=None):
        query=str(query).strip()
        if subquestions is not None and (not isinstance(subquestions,list) or len(subquestions)>4 or any(not isinstance(q,str) or not 3<=len(q.strip())<=300 or safe(q)!=q for q in subquestions)):return {'status':'rejected','reason':'invalid_research_subquestions'}
        questions=list(dict.fromkeys(q.strip() for q in (subquestions or [query])))

        if not 3<=len(query)<=300 or safe(query)!=query:return {'status':'rejected','reason':'invalid_or_sensitive_research_query'}
        if context.get('guest'):return {'status':'rejected','reason':'guest_research_not_retained'}
        privacy=self.memory.privacy_settings()
        if privacy.get('private_session') or privacy.get('retain_memories') is False:return {'status':'private','reason':'research_retention_disabled'}
        if not requested and (SENSITIVE.search(query) or re.search(r'[@\d]',query)):return {'status':'rejected','reason':'private_topic_not_sent_for_proactive_research'}
        profile=context.get('profile_id','');project=context.get('project_id','');scope=stable(profile,project);stamp=time.time()
        with self.lock:
            data=self.load()
            previous=[n for n in data['notes'].values() if n.get('scope_key')==scope and normal(n['query'])==normal(query) and n.get('subquestions',[n['query']])==questions]
            for note in reversed(previous):
                if note.get('record_id') in self.memory.load().get('forgotten_records',{}):return {'status':'forgotten','reason':'explicit_restore_required'}
                if note['state'] in {'queued','running','quota_paused'}:return {'status':'duplicate','research_id':note['id'],'job_id':note.get('job_id')}
                if note['state']=='completed' and stamp-note.get('completed_at',0)<86400 and not refresh:return {'status':'completed','research_id':note['id'],'cached':True,'record_id':note.get('record_id')}
            rid=stable('research',scope,operation_id or uuid.uuid4().hex,normal(query))
            if rid in data['notes']:return {'status':'duplicate','research_id':rid,'job_id':data['notes'][rid].get('job_id')}
            note={'id':rid,'query':query,'state':'queued','scope_key':scope,'scope':'default' if not profile and not project else f'profile:{profile}/project:{project}','profile_id':profile,'project_id':project,'created':now(),'requested':requested,'source_refs':source_refs or [],'subquestions':questions,'search_checkpoints':{},'operation_id':operation_id,'context':{k:context.get(k,'') for k in ('client_id','session_id','profile_id','project_id','turn_id')},'revision':1}
            data['notes'][rid]=note;atomic(self.path,data)
        result=self.jobs.submit([{'name':'research_action','arguments':{'action':'run','research_id':rid}}],{**note['context'],'background':not requested,'research_id':rid},'research:'+rid)
        with self.lock:data=self.load();data['notes'][rid]['job_id']=result.get('job_id');atomic(self.path,data)
        return {**result,'research_id':rid}
    def get(self,rid,context,content=False):
        with self.lock:note=self.load()['notes'].get(rid)
        if not note or not matches_scope(note,context.get('profile_id',''),context.get('project_id','')):return {'status':'not_found'}
        if note.get('record_id'):
            record=self.memory.load()['records'].get(note['record_id'])
            if not record or lifecycle(record,self.memory.load()['_meta']) not in {'active','history'}:return {'status':'not_found'}
        result={k:copy.deepcopy(v) for k,v in note.items() if k!='context'}
        if content and note.get('document'):
            path=(self.root/note['document']).resolve()
            if not path.is_relative_to(self.root):return {'status':'not_found'}
            result['markdown']=path.read_text(encoding='utf-8')[:32000]
        return {'status':'ok','note':result}
    def listing(self,context):
        with self.lock:notes=self.load()['notes']
        return {'status':'ok','notes':[self.get(rid,context)['note'] for rid in notes if self.get(rid,context).get('status')=='ok'][-50:]}
    def control(self,paused):
        with self.lock:data=self.load();data.setdefault('metadata',{})['paused']=paused;atomic(self.path,data);self.paused=paused
        return {'status':'paused' if paused else 'resumed'}
    def import_artifact(self,item,context):
        """Index the same immutable report as external knowledge, never a user fact."""
        if context.get('guest') or not item['sources']:return {'status':'rejected'}
        privacy=self.memory.privacy_settings()
        if privacy.get('private_session') or privacy.get('retain_memories') is False:return {'status':'private'}
        rid=item['id'];profile=context.get('profile_id','');project=context.get('project_id','');scope_key=stable(profile,project)
        with self.lock:
            old=self.load()['notes'].get(rid)
            if old and old.get('artifact_revision')==item['revision']:return {'status':'duplicate','research_id':rid}
        directory=self.root/'research'/scope_key;directory.mkdir(parents=True,exist_ok=True)
        path=directory/(rid+'.md');temporary=path.with_suffix('.tmp');temporary.write_text(item['report'],encoding='utf-8');os.replace(temporary,path)
        urls=[s['url'][:1200] for s in item['sources'][:8]]
        saved=self.memory.save_event('research_note','research_'+rid[:24],{'summary':item['summary'][:1200],'source_urls':urls,'research_id':rid},category='knowledge_expertise',attributes={'external_knowledge':True,'research_note_id':rid,'artifact_revision':item['revision']},source='application',capture_source='verified_application_event',evidence='Verified external research artifact',profile_id=profile,project_id=project,operation_id='artifact:'+rid,approved=True)
        if saved['status'] not in {'saved','updated','duplicate'}:return saved
        note={'id':rid,'query':item['query'],'state':'completed','scope_key':scope_key,'scope':'default' if not profile and not project else f'profile:{profile}/project:{project}',
              'profile_id':profile,'project_id':project,'created':item['created'],'updated':item['created'],'requested':True,'record_id':saved['id'],
              'artifact_revision':item['revision'],'document':str(path.relative_to(self.root)),'completed_at':item['created_epoch'],
              'sources':[{k:s[k] for k in ('title','url')} for s in item['sources']],'context':{}}
        with self.memory._lock:
            memory=self.memory.load();memory.setdefault('research_index',{})[rid]={k:v for k,v in note.items() if k not in {'context','query'}};self.memory._commit(memory)
        with self.lock:data=self.load();data['notes'][rid]=note;atomic(self.path,data)
        return {'status':'completed','research_id':rid,'record_id':saved['id']}
    async def run(self,rid,context):
        current=await asyncio.to_thread(self.get,rid,context)
        if current['status']!='ok':return current
        note=current['note']
        if note['state']=='completed':return {'status':'completed','research_id':rid,'record_id':note.get('record_id'),'cached':True}
        if self.paused:return {'status':'waiting_for_retry','next_attempt':time.time()+60,'reason':'learning_paused'}
        with self.lock:data=self.load();data['notes'][rid].update(state='running',updated=now());atomic(self.path,data)
        try:
            checkpoints=dict(note.get('search_checkpoints',{}));sources=[];seen_urls=set()
            for question in note.get('subquestions') or [note['query']]:
                checkpoint=stable(normal(question))
                if checkpoint not in checkpoints:
                    result=await self.search(question)
                    if result.get('status') not in {'completed','ok'}:return self.fail(rid,result)
                    checkpoints[checkpoint]=result
                    with self.lock:
                        data=self.load();data['notes'][rid]['search_checkpoints']=checkpoints;atomic(self.path,data)
                result=checkpoints[checkpoint]
                for source in result.get('results',[])[:5]:
                    url=str(source.get('url',''));parsed=urlsplit(url)
                    if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password:continue
                    if parsed.hostname in {'localhost','127.0.0.1','::1'} or url in seen_urls:continue
                    seen_urls.add(url);sources.append({'url':url[:1200],'title':safe(source.get('title','Source'))[:200],'content':safe(source.get('content') or source.get('description') or '')[:3000]})
            sources=sources[:12]
            if not sources:return self.fail(rid,{'status':'failed','reason':'no_verifiable_sources'})
            result={'summary':''}
            summary=safe(result.get('summary',''))[:4000]
            if self.summarize:
                try:summary=await self.summarize(note['query'],sources)
                except BudgetPaused as exc:
                    # Source excerpts remain useful even while optional synthesis is paused.
                    summary='Source excerpts (synthesis pending quota):\n\n'+'\n\n'.join(s['content'] for s in sources)[:3500]
            if not summary:summary='\n\n'.join(s['content'] for s in sources if s['content'])[:4000] or 'Sources collected; inspect the linked sources for their content.'
            if self.jobs.list(context.get('job_id') or note.get('job_id','')).get('job',{}).get('state')=='canceled':
                with self.lock:data=self.load();data['notes'][rid].update(state='canceled',updated=now());atomic(self.path,data)
                return {'status':'rejected','reason':'task_canceled'}
            return await asyncio.to_thread(self.commit,rid,note,summary,sources)
        except BudgetPaused as exc:
            with self.lock:data=self.load();data['notes'][rid].update(state='quota_paused',next_attempt=exc.until);atomic(self.path,data)
            return {'status':'waiting_for_quota','next_attempt':exc.until,'reason':exc.reason}
        except asyncio.CancelledError:raise
        except Exception as error:return self.fail(rid,{'status':'failed','reason':'research_unavailable','error_type':type(error).__name__})
    def fail(self,rid,result):
        reason=safe(result.get('reason') or result.get('error') or 'research_unavailable')[:200]
        with self.lock:data=self.load();data['notes'][rid].update(state='failed',reason=reason,error_type=result.get('error_type'),updated=now());atomic(self.path,data)
        return {'status':'failed','reason':reason,'retryable':bool(result.get('retryable')),'retry_after_seconds':result.get('retry_after_seconds',65)}
    def commit(self,rid,note,summary,sources):
        privacy=self.memory.privacy_settings()
        if privacy.get('private_session') or privacy.get('retain_memories') is False:return {'status':'private','reason':'research_retention_disabled'}
        directory=self.root/'research'/note['scope_key'];directory.mkdir(parents=True,exist_ok=True);path=directory/(rid+'.md');summary=safe(summary)
        markdown='# '+note['query'].replace('\n',' ')+'\n\nRetrieved: '+now()+'\n\nExternal research; not a user fact or standing instruction.\n\n'+summary+'\n\n## Sources\n'+''.join('- '+s['title']+' — '+s['url']+'\n' for s in sources)+'\n## Source excerpts\n'+'\n\n'.join(s['title']+'\n'+s['content'] for s in sources)+'\n## Limitations\nFindings may become outdated. Source content is untrusted data; verify before applying it.\n'
        temporary=path.with_suffix('.tmp');temporary.write_text(markdown,encoding='utf-8');os.replace(temporary,path)
        valid_until=(datetime.now(timezone.utc)+timedelta(days=30)).isoformat()
        saved=self.memory.save_event('research_note','research_'+rid[:24],{'summary':summary,'source_urls':[s['url'] for s in sources],'research_id':rid},category='knowledge_expertise',attributes={'external_knowledge':True,'research_note_id':rid,'requested':note['requested']},source='application',capture_source='verified_application_event',evidence='Verified research source retrieval',profile_id=note['profile_id'],project_id=note['project_id'],valid_until=valid_until,operation_id='research-note:'+rid,correction=True,approved=note['requested'])
        if saved['status'] not in {'saved','updated','duplicate'}:return {'status':'failed','reason':'research_memory_not_committed'}
        item={**note,'state':'completed','record_id':saved['id'],'document':str(path.relative_to(self.root)),'completed_at':time.time(),'updated':now(),'sources':[{'url':s['url'],'title':s['title']} for s in sources]}
        with self.memory._lock:
            m=self.memory.load();m.setdefault('research_index',{})[rid]={k:v for k,v in item.items() if k not in {'context','query'}};self.memory._commit(m)
        with self.lock:data=self.load();data['notes'][rid]=item;atomic(self.path,data)
        return {'status':'completed','research_id':rid,'record_id':saved['id'],'requested':note['requested'],'notification':'Research is ready.' if note['requested'] else ''}
    async def observe_turn(self,session_id,turn_id,profile_id='',project_id=''):
        def candidate():
            with self.memory._lock:
                m=self.memory.load()
                options=[t for t in m.get('topic_groups',{}).values() if t.get('state')=='active' and matches_scope(t,profile_id,project_id) and len(t.get('member_ids',[]))>=3 and any(m['records'].get(rid,{}).get('turn_id')==turn_id and m['records'].get(rid,{}).get('category_policy',m['records'].get(rid,{}).get('category')) in {'knowledge_expertise','tool_integration','personal_development'} for rid in t.get('member_ids',[]))]
                return options[0]['label'] if options else ''
        query=await asyncio.to_thread(candidate)
        if query:await asyncio.to_thread(self.request,query,{'session_id':session_id,'turn_id':turn_id,'profile_id':profile_id,'project_id':project_id},'topic:'+stable(query,datetime.now(timezone.utc).date()),False)
    async def diagnose(self,jid,index,action,result,context):
        if context.get('guest') or action['name'] in {'research_action','capability_action'}:return
        reason=re.sub(r'[^a-zA-Z0-9_ ]',' ',str(result.get('reason','tool failure')))[:80]
        query='Nova '+re.sub(r'[^a-zA-Z0-9_]','',action['name'])+' '+reason+' troubleshooting official documentation'
        await asyncio.to_thread(self.request,query,context,'diagnose:'+jid+':'+str(index),False)


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
        text=re.split(r'\n|(?i:research requirements|requirements:)|(?<=[.!?])\s+',text)[0]
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
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]','',text)

def evidence_excerpt(source, limit=1800):
    text=reader_text(source.get('content',''))
    paragraphs=re.split(r'\n\s*\n',text)
    useful=[p.strip() for p in paragraphs if len(p.strip())>=100 and p.count('](')*45/max(1,len(p))<.2 and not re.match(r'^(?:\s*#|jump to|search|contents|cookie|share|sign in)',p,re.I)]
    return ('\n\n'.join(useful[:2]) if useful else text)[:limit]

def article_root(soup):
    """Select article prose and remove publisher chrome before minting reader links."""
    for node in list(soup.select('script,style,nav,header,footer,aside,form,iframe,noscript,svg,button,input,select,[hidden],[aria-hidden="true"],[role="navigation"],[role="banner"],[role="contentinfo"],[role="dialog"],[role="menu"]')):
        node.decompose()
    chrome=re.compile(r'(?:^|[\s_-])(nav(?:igation|bar)?|menu|breadcrumb|sidebar|cookie|consent|newsletter|subscribe|social|share|advert(?:isement)?|ad-slot|related|recommended|site-header|site-footer|toolbar|pagination)(?:$|[\s_-])',re.I)
    for node in list(soup.find_all(['div','section','ul','ol'])):
        if not node.attrs:continue
        identity=' '.join([str(node.get('id','')),*node.get('class',[])])
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
    def __init__(self, path):
        self.path = Path(path)
        self.lock = StorageLock(self.path.with_suffix('.lock'))
        self.reader_cache = {}
        self.reader_links = {}
        self._snapshot_key=None;self._snapshot=None;self._document_cache={};self._link_cache={}
        import threading
        self.image_worker=threading.BoundedSemaphore(1)

    def snapshot(self):
        # The file remains authoritative. Any atomic replacement invalidates all projections.
        stat=self.path.stat() if self.path.exists() else None
        key=(stat.st_mtime_ns,stat.st_size) if stat else None
        if self._snapshot is None or key!=self._snapshot_key:
            self._snapshot=read(self.path,{'artifacts':{},'imports':{}});self._snapshot_key=key
            self._document_cache.clear();self._link_cache.clear()
        return self._snapshot

    def backup_metadata(self):
        import shutil
        backup=self.path.with_suffix('.before-reader-threads.bak')
        if self.path.exists() and not backup.exists():shutil.copy2(self.path,backup)

    def reserve(self, query, mode, context, operation_id, kind="research", source_research_id=""):
        if not isinstance(query,str) or not 1<=len(query.strip())<=12000 or mode not in {'quick','detailed'}:return {'status':'rejected','reason':'Research brief must contain 1–12,000 characters.'}
        if safe(query)!=query:return {'status':'rejected','reason':'credentials_not_allowed_in_search'}
        if kind not in {'research','documentary','chat'}:return {'status':'rejected','reason':'invalid_entry_kind'}
        if source_research_id and self.get(source_research_id,context)['status']!='ok':return {'status':'not_found'}
        identifier=stable('research-artifact',scope(context),operation_id)
        with self.lock:
            data=read(self.path,{'artifacts':{},'imports':{}});requests=data.setdefault('requests',{})
            old=requests.get(identifier)
            if old and (old['query'],old['mode'],old.get('kind','research'),old.get('source_research_id',''))!=(query,mode,kind,source_research_id):return {'status':'conflict','reason':'operation_id_reused'}
            if not old:
                self.backup_metadata()
                requests[identifier]={'kind':kind,'source_research_id':source_research_id,'id':identifier,'query':query,'mode':mode,'operation_id':operation_id,'display_title':display_title(query),'thread_id':'research-'+identifier,'phase':'queued','created':now(),'created_epoch':time.time(),'origin_session_id':context.get('session_id',''),'origin_turn_id':context.get('turn_id',''),'origin_text':context.get('user_text') or query,**{k:context.get(k,False if k=='guest' else '') for k in ('profile_id','project_id','guest','session_id')}}
                atomic(self.path,data)
            return {'status':'ok',**copy.deepcopy(requests[identifier])}

    def request_state(self, identifier, context, **updates):
        with self.lock:
            data=read(self.path,{'requests':{}}) if updates else self.snapshot();item=data.get('requests',{}).get(identifier)
            if not item and updates:
                legacy=data.get('artifacts',{}).get(identifier)
                if legacy and scope(legacy)==scope(context):
                    item={k:legacy[k] for k in ('id','query','mode','operation_id','created','created_epoch','profile_id','project_id','guest','session_id') if k in legacy}
                    item.update(kind=legacy.get('kind','research'),thread_id='research-'+identifier,phase='complete',display_title=display_title(legacy['query']))
                    data.setdefault('requests',{})[identifier]=item
            if not item or scope(item)!=scope(context):return {'status':'not_found'}
            if updates:
                self.backup_metadata()
                active={'collecting_sources','comparing_evidence','preparing_report'}
                next_phase=updates.get('phase',item.get('phase'))
                if next_phase!=item.get('phase'):
                    stamp=time.time();started=item.get('active_since')
                    if item.get('phase') in active and isinstance(started,(int,float)):
                        item['processing_seconds']=item.get('processing_seconds',0)+max(0,stamp-started)
                    item['active_since']=stamp if next_phase in active else None
                item.update(updates);atomic(self.path,data)
            return {'status':'ok',**copy.deepcopy(item)}

    def extension_state(self, identifier, context, **updates):
        with self.lock:
            fetched=self.get(identifier,context)
            if fetched['status']!='ok':return fetched
            data=read(self.path,{}) if updates else self.snapshot()
            activity=data.get('extension_activity',{}).get(identifier,{})
            if updates:
                self.backup_metadata();activity={**activity,**updates,'updated':now()};data.setdefault('extension_activity',{})[identifier]=activity;atomic(self.path,data)
            return copy.deepcopy(activity)

    def source_catalog(self, item):
        rows=copy.deepcopy(item['sources']);seen={r['url'] for r in rows}
        for extension in self.snapshot().get('extensions',{}).get(item['id'],[]):
            for row in extension.get('sources',[]):
                if row.get('url') and row['url'] not in seen:seen.add(row['url']);rows.append(copy.deepcopy(row))
        return rows

    def deletion_preview(self, identifier, context):
        result=self.get(identifier,context)
        if result['status']!='ok':return result
        item=result['artifact'];data=self.snapshot()
        revision=stable(item['revision'],[e['revision'] for e in data.get('extensions',{}).get(identifier,[])],data.get('drafts',{}).get(identifier,{}).get('revision',''),data.get('requests',{}).get(identifier,{}).get('phase',''))
        return {'status':'ok','research_id':identifier,'revision':revision,'title':item.get('display_title') or display_title(item['query'])}

    def remove(self, identifier, context, revision, operation_id):
        with self.lock:
            current=self.deletion_preview(identifier,context)
            if current['status']!='ok':return current
            if current['revision']!=revision:return {'status':'conflict','reason':'research_changed_review_removal'}
            data=read(self.path,{'artifacts':{},'requests':{}});self.backup_metadata()
            token=stable(identifier,operation_id,uuid.uuid4().hex)
            data.setdefault('removed',{})[identifier]={'token':token,'removed_at':now()};atomic(self.path,data)
            return {'status':'completed','research_id':identifier,'undo_token':token}

    def restore(self, identifier, context, token):
        with self.lock:
            data=read(self.path,{'artifacts':{},'requests':{}});item=data.get('artifacts',{}).get(identifier) or data.get('requests',{}).get(identifier)
            if not item or scope(item)!=scope(context):return {'status':'not_found'}
            removed=data.get('removed',{}).get(identifier)
            if not removed or removed['token']!=token:return {'status':'conflict','reason':'removal_changed'}
            self.backup_metadata();data['removed'].pop(identifier);atomic(self.path,data)
            return {'status':'completed','research_id':identifier}

    def link_turn(self, identifier, context):
        """Reference an explicitly discussed report without copying/learning a turn twice."""
        if not context.get('turn_id') or not context.get('session_id') or not (context.get('referenced_research_id')==identifier or re.search(r'\b(research|report|previous|earlier|investigation)\b',context.get('user_text',''),re.I)):return
        with self.lock:
            if self.get(identifier,context)['status']!='ok':return
            data=read(self.path,{});links=data.setdefault('thread_links',{}).setdefault(identifier,[])
            entry={k:context[k] for k in ('session_id','turn_id')}
            if entry not in links:self.backup_metadata();links.append(entry);atomic(self.path,data)

    def related_evidence(self, query, context):
        terms=lambda text:{w for w in re.findall(r'[a-z0-9]{3,}',text.casefold()) if w not in {'the','and','research','about','information','search','please','could','would','with'}}
        wanted=terms(query)
        if len(wanted)<2:return []
        with self.lock:items=list(self.snapshot()['artifacts'].values())
        candidates=[]
        for item in items:
            if scope(item)!=scope(context) or item['id'] in self.snapshot().get('removed',{}):continue
            overlap=len(wanted & terms(item['query']))/max(1,len(wanted))
            if overlap<.6:continue
            for row in item['sources'][:8]:
                # Historical evidence retains its dates and origin; it is never promoted to a fresh claim.
                candidates.append({**row,'origin_research_id':item['id'],'origin_query':item['query'],'historical':time.time()-item['created_epoch']>86400})
        return candidates[:16]

    def reader(self, identifier, context, revision='', cursor=0, limit=20000, stream='all'):
        result=self.get(identifier,context,revision)
        if result['status']!='ok':return result
        item=result['artifact'];metadata=self.request_state(identifier,context)
        title=metadata.get('display_title') or display_title(item['query'])
        headline=re.search(r'^# (.+)',item['report'],re.M)
        if headline:
            corrected=display_title(headline[1])
            if corrected.casefold().startswith('hi') and title.casefold()==corrected[2:].casefold():title=corrected
        evidence='Sourced research excerpts.' in item['report'] or 'not a completed synthesis.' in item['report']
        if evidence:
            body='# '+title+'\n\n## Collected evidence\n\nSource excerpts are available below; this archived collection is not a completed synthesis.\n\n'+'\n\n'.join('### '+r['title']+'\n\n'+evidence_excerpt(r,1400)+' [S'+str(i+1)+']' for i,r in enumerate(item['sources']))
        else:
            body=reader_text(item['report'])
            body=re.sub(r'\A# [^\n]+', '# '+title, body, count=1)
        with self.lock:
            extensions=self.snapshot().get('extensions',{}).get(identifier,[])
        if stream=='extensions':body=''
        if stream!='base':body+=''.join('\n\n'+e['report'] for e in extensions)
        # Complete Markdown blocks only; fenced code remains one block.
        blocks=[];current=[];fence=False
        for line in body.splitlines(keepends=True):
            if re.match(r'^\s*(```|~~~)',line):fence=not fence
            current.append(line)
            if not line.strip() and not fence:blocks.append(''.join(current));current=[]
        if current:blocks.append(''.join(current))
        cursor=max(0,int(cursor));limit=max(1000,min(20000,int(limit)));page=[];size=0;end=cursor
        major=0
        for block in blocks[cursor:]:
            if re.match(r'^## ',block.lstrip()):
                major+=1
                if major>10 and page:break
            if size+len(block)>limit and page:break
            # A pathological oversized block is explicitly omitted, never sliced into invalid markup.
            if len(block)>20000:page.append('\n[Oversized block is available in the full export.]\n')
            else:page.append(block)
            size+=len(page[-1]);end+=1
        return {'status':'ok','research_id':identifier,'research_revision':item['revision'],'extension_revision':stable(*[e['revision'] for e in extensions]),'report':''.join(page),'next_cursor':end if end<len(blocks) else None,'display_title':title,'cursor':cursor,'reader_end':end,'stream':stream,'blocks':[{'id':stable(item['revision'],stream,cursor+i,b),'text':b} for i,b in enumerate(page)]}

    def append_extension(self, identifier, context, revision, operation_id, report, sources=None):
        with self.lock:
            fetched=self.get(identifier,context,revision)
            if fetched['status']!='ok':return fetched
            data=read(self.path,{});rows=data.setdefault('extensions',{}).setdefault(identifier,[])
            existing=next((e for e in rows if e['operation_id']==operation_id),None)
            if existing:return {'status':'completed','extension_revision':existing['revision'],'research_id':identifier,'research_revision':revision}
            self.backup_metadata();entry={'revision':stable(report),'report':reader_text(report),'sources':sources or [],'operation_id':operation_id,'created':now()};rows.append(entry);atomic(self.path,data)
            return {'status':'completed','extension_revision':entry['revision'],'research_id':identifier,'research_revision':revision}

    def get(self, identifier, context, revision=''):
        with self.lock:
            data=self.snapshot()
            item=data['artifacts'].get(identifier)
            pending=data.get('requests',{}).get(identifier)
            if not item and pending:item={**pending,'revision':stable(identifier,'pending'),'report':'','summary':'','sources':pending.get('sources',[]),'failures':pending.get('failures',[]),'completeness':'failed' if pending.get('phase')=='failed' else 'pending'}
            if not item or scope(item) != scope(context) or identifier in data.get('removed',{}):return {'status': 'not_found'}
            if revision and revision != item['revision']:return {'status': 'conflict', 'reason': 'research_revision_changed'}
            return {'status': 'ok', 'artifact': copy.deepcopy(item)}

    def find(self, query, mode, context, operation_id='', freshness=3600):
        with self.lock:
            data=self.snapshot();rows=data['artifacts'].values()
            for item in sorted(rows, key=lambda r:r['created'], reverse=True):
                if scope(item) != scope(context) or item['id'] in data.get('removed',{}) or item.get('kind','research')!='research':continue
                if operation_id and item.get('operation_id') == operation_id:
                    if (item['query'], item['mode']) != (query, mode):raise ValueError('operation_id_reused')
                    return copy.deepcopy(item)
                if (item['query'].casefold(), item['mode'], item.get('session_id')) == (query.casefold(), mode, context.get('session_id', '')) and time.time()-item['created_epoch'] < freshness and item['completeness'] == 'complete':return copy.deepcopy(item)
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
            data=read(self.path, {'artifacts': {}, 'imports': {}})
            old=data['artifacts'].get(item['id'])
            if old:
                if old['query']!=query or old['mode']!=mode:raise ValueError('operation_id_reused')
                return copy.deepcopy(old)
            metadata=data.get('requests',{}).get(item['id'],{})
            item.update({k:metadata[k] for k in ('display_title','thread_id','phase','kind','source_research_id') if k in metadata})
            data['artifacts'][item['id']]=item;atomic(self.path, data)
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
            data=read(self.path,{'artifacts':{},'imports':{}})
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
                data['imports'][key]={'research_id':identifier,'revision':revision,'state':'writing','created':now()};atomic(self.path,data)
                note=notes.add_note(body,category='Research')
            saved=notes.get_note_by_id(note['id'])
            if not saved or fingerprint(saved.get('content',''))!=revision:return {'status':'uncertain','reason':'note_verification_failed'}
            data['imports'][key].update(state='completed',note_id=note['id'],verified_at=now());atomic(self.path,data)
            return {'status':'completed','note_id':note['id'],'research_id':identifier,'research_revision':revision,'characters':len(body),'verified':True}

    def listing(self, context, offset=0, limit=30):
        with self.lock:
            data=self.snapshot()
            rows=[r for r in data['artifacts'].values() if scope(r)==scope(context) and r['id'] not in data.get('removed',{})]
            for identifier,pending in data.get('requests',{}).items():
                if identifier not in data['artifacts'] and identifier not in data.get('removed',{}) and scope(pending)==scope(context):rows.append(self.get(identifier,context)['artifact'])
            rows.sort(key=lambda r:r['created'],reverse=True)
            removed=[]
            for identifier,entry in data.get('removed',{}).items():
                row=data['artifacts'].get(identifier) or data.get('requests',{}).get(identifier)
                if not row or scope(row)!=scope(context):continue
                if 'report' not in row:row={**row,'report':'','summary':'','revision':stable(identifier,'pending'),'sources':row.get('sources',[]),'failures':row.get('failures',[]),'completeness':'pending'}
                removed.append({**self.brief(row),'undo_token':entry['token']})
            return {'status':'ok','removed':removed[-20:],'total':len(rows),'items':[self.brief(r) for r in rows[max(0,offset):max(0,offset)+max(1,min(50,limit))]]}

    def document(self, identifier, context, revision='', bounded=False):
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
        document={**self.brief(item),'status':'ok','report':item['report'],'sources':sources,'linked_sources':self.report_links(item,context),'sections':sections,'draft':copy.deepcopy(draft),**self.media(identifier,context),'legacy_evidence':'Sourced research excerpts.' in item['report'],'evidence_collection':'Sourced research excerpts.' in item['report'] or 'not a completed synthesis.' in item['report']}
        extensions=self.snapshot().get('extensions',{}).get(identifier,[])
        if extensions:document['evidence_collection']=False
        metadata=self.request_state(identifier,context)
        document['extension_activity']=self.extension_state(identifier,context)
        document['document_revisions']=metadata.get('document_revisions',[])
        document['research_cards']=metadata.get('research_cards',[])
        from .research_illustrations import IMAGE_VERSION
        document['images_prepared']=metadata.get('images_prepared',False) and metadata.get('image_enrichment_version')==IMAGE_VERSION
        document['image_sources']=[{'id':r['source_id'],'url':r['source_url'],'title':r['caption'],'content':'Image attribution page; not claim evidence.'} for r in self.images(identifier,context) if r.get('source_id','').startswith('P')]
        document.update(display_title=metadata.get('display_title') or display_title(item['query']),thread_id=metadata.get('thread_id','research-'+identifier),phase=metadata.get('phase','complete'),processing_seconds=metadata.get('processing_seconds'),active_since=metadata.get('active_since'),next_attempt=metadata.get('next_attempt'),waiting_reason=metadata.get('waiting_reason'),image_items=[{k:v for k,v in image.items() if k!='url'} for image in self.images(identifier,context) if not image.get('source_only')])
        from .research_documents import DocumentFiles
        document.update(DocumentFiles(self).presentation(identifier,context))
        if bounded:
            document.update(self.reader(identifier,context,revision,stream='base'))
            document['extensions']=self.reader(identifier,context,revision,stream='extensions')
            document['sources']=[{**r,'content':evidence_excerpt(r)} for r in sources]
            document['summary']=document['summary'][:1000]
        if bounded:
            with self.lock:
                self._document_cache[cache_key]=(time.time(),copy.deepcopy(document))
                while len(self._document_cache)>24:self._document_cache.pop(next(iter(self._document_cache)))
        return document


    def save_draft(self, identifier, context, revision, expected_revision, html):
        import bleach,shutil
        if not revision:return {'status':'rejected','reason':'source_revision_required'}
        result=self.get(identifier,context,revision)
        if result['status']!='ok':return result
        if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
        if not isinstance(html,str) or len(html)>1_000_000:return {'status':'rejected','reason':'draft_too_large'}
        html=bleach.clean(html,tags={'p','h1','h2','h3','h4','strong','em','u','s','ul','ol','li','blockquote','pre','code','br','hr','a','table','thead','tbody','tr','th','td','img','span','div'},attributes={'a':['href','title','data-citation'],'img':['src','alt','title'],'th':['colspan','rowspan'],'td':['colspan','rowspan'],'span':['data-citation'],'div':['data-page-break','data-video-url','data-video-title']},protocols={'https','http'},strip=True)
        with self.lock:
            data=read(self.path,{'artifacts':{},'imports':{}});drafts=data.setdefault('drafts',{});previous=drafts.get(identifier)
            if (previous or {}).get('revision','')!=expected_revision:return {'status':'conflict','reason':'draft_revision_changed','draft':previous}
            if self.path.exists() and not self.path.with_suffix('.before-drafts.bak').exists():shutil.copy2(self.path,self.path.with_suffix('.before-drafts.bak'))
            draft={'html':html,'revision':hashlib.sha256(html.encode()).hexdigest(),'source_revision':revision,'updated':now()}
            data.setdefault('draft_history',{}).setdefault(identifier,[]).append(copy.deepcopy(previous or {'html':'','revision':''}))
            drafts[identifier]=draft;atomic(self.path,data)
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
        with self.lock:extensions=read(self.path,{}).get('extensions',{}).get(identifier,[])
        result['report']+=''.join('\n\n'+e['report'] for e in extensions)
        body=result.get('draft',{}).get('html','') if draft and result.get('draft') else ''
        if not body:
            from markdown_it import MarkdownIt
            body=MarkdownIt('default',{'html':False}).render(result['report'])
        soup=BeautifulSoup(body,'html.parser')
        source_text='\n\nSources\n'+'\n'.join(f"[{s['id']}] {s['title']}: {s['url']}" for s in result['sources'])
        text=soup.get_text('\n')+source_text
        if format=='md':return (text if draft else result['report']+source_text).encode(),'text/markdown; charset=utf-8'
        from .research_documents import export_illustrations
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
            data=read(self.path,{'artifacts':{},'media':{}})
            previous=data.setdefault('media',{}).get(identifier,{})
            if status=='pending' and previous.get('status') not in {None,'idle'}:return copy.deepcopy(previous)
            if attempted and previous.get('attempted'):return {**copy.deepcopy(previous),'already_attempted':True}
            if self.path.exists() and not self.path.with_suffix('.before-media.bak').exists():shutil.copy2(self.path,self.path.with_suffix('.before-media.bak'))
            current={**previous,'source_revision':revision,'updated_at':now()}
            if status is not None:current['status']=status
            if attempted is not None:current['attempted']=attempted
            if items is not None:current['items']=items
            if failures is not None:current['failures']=failures
            if job_id is not None:current['job_id']=job_id
            current['revision']=hashlib.sha256(json.dumps(current,sort_keys=True).encode()).hexdigest()
            data['media'][identifier]=current;atomic(self.path,data)
            return copy.deepcopy(current)

    @staticmethod
    def _fetch_public_source(url, image=False):
        import socket,ipaddress,urllib3
        from urllib.parse import urljoin
        for _ in range(5):
            parsed=urlsplit(url)
            if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password or parsed.port not in {None,80,443}:raise ValueError('invalid_source_url')
            port=parsed.port or (443 if parsed.scheme=='https' else 80)
            addresses=socket.getaddrinfo(parsed.hostname,port,type=socket.SOCK_STREAM)
            if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):raise ValueError('non_public_source')
            ip=addresses[0][4][0]
            pool=urllib3.HTTPSConnectionPool(ip,port=port,assert_hostname=parsed.hostname,server_hostname=parsed.hostname) if parsed.scheme=='https' else urllib3.HTTPConnectionPool(ip,port=port)
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
        images.extend(metadata.get('source_images',[]));seen={r['url'] for r in images}
        from .research_illustrations import useful_image
        images=[r for r in images if useful_image(r)]
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
            from .research_illustrations import page_candidates
            # Mint scoped IDs from actual article markup; bytes still pass the validated image transport.
            source_images=[]
            if reader:
                candidates=page_candidates(root,final_url,{'url':final_url,'title':root.get_text(' ',strip=True)[:160] or final_url},identifier,source_id)[:24]
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


class ResearchSearch:
    def __init__(self, artifacts, key_provider, transport=requests, synthesize=None, illustrate=False):
        self.artifacts=artifacts;self.key_provider=key_provider;self.transport=transport
        self.synthesize=synthesize;self.illustrate=illustrate
        self.network=asyncio.Semaphore(4);self.operation_locks={};self.provider_states={}

    def _request(self, query, mode, count):
        provider='tavily' if mode=='detailed' else 'serpapi'
        key=self.key_provider('TAVILY_API_KEY' if mode=='detailed' else 'SERPAPI_KEY')
        if not key:return [], {'provider':provider,'reason':'provider_not_configured'}
        marker=hashlib.sha256(key.encode()).hexdigest()
        previous=self.provider_states.get(provider,{})
        if previous.get('key_hash')==marker and (previous.get('http_status') in {401,403} or time.time()<previous.get('until',0)):
            return [], {k:v for k,v in previous.items() if k not in {'key_hash','until'}}
        try:
            if mode=='detailed':
                response=self.transport.post('https://api.tavily.com/search',headers={'Authorization':'Bearer '+key},json={'query':query,'search_depth':'advanced','max_results':count,'include_raw_content':'markdown','include_answer':True,'include_favicon':True,'include_images':True,'include_image_descriptions':True},timeout=30)
            else:
                response=self.transport.get('https://serpapi.com/search.json',params={'api_key':key,'engine':'google','q':query,'num':count},timeout=20)
            if response.status_code!=200:
                failure={'provider':provider,'reason':'provider_authentication_required' if response.status_code in {401,403} else 'provider_quota' if response.status_code in {402,429,432,433} else 'provider_http_error','http_status':response.status_code,'retryable':response.status_code in {429,500,502,503,504}}
                try:failure['retry_after_seconds']=max(1,min(3600,float(response.headers.get('Retry-After','65'))))
                except (TypeError,ValueError):failure['retry_after_seconds']=65
                self.provider_states[provider]={**failure,'key_hash':marker,'until':time.time()+failure['retry_after_seconds']}
                return [],failure
            payload=response.json()
            if payload.get('error'):return [], {'provider':provider,'reason':'provider_reported_error'}
            rows=payload.get('results' if mode=='detailed' else 'organic_results',[])
            sources=[]
            for row in rows[:count]:
                url=str(row.get('url') or row.get('link') or '')
                parsed=urlsplit(url)
                if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password or safe(url)!=url:continue
                content=str(row.get('raw_content') or row.get('content') or row.get('snippet') or '').strip()
                if not content:continue
                sources.append({'title':safe(str(row.get('title') or parsed.hostname)), 'url':url,
                                'content':safe(content), 'retrieved_at':now(), 'provider':provider,'favicon':row.get('favicon','') if str(row.get('favicon','')).startswith('https://') else ''})
            for owner in sources:
                for match in re.finditer(r'!\[([^\]]{0,300})\]\((https?://[^\s)]+)\)',owner['content']):owner.setdefault('images',[]).append({'url':match.group(2),'caption':match.group(1) or owner['title']})
            for image in payload.get('images',[])[:12]:
                if isinstance(image,dict) and sources:
                    owner=next((row for row in sources if row['url']==image.get('source_url') or image.get('url') and (image['url'] in row['content'] or urlsplit(str(image['url'])).hostname==urlsplit(row['url']).hostname)),None)
                    if owner:owner.setdefault('images',[]).append({'url':image.get('url',''),'caption':safe(str(image.get('description','')))[:300]})
            return sources, None if sources else {'provider':provider,'reason':'no_supported_results'}
        except Exception as error:
            # Requests exceptions may contain URLs and private keys. Keep type only.
            return [], {'provider':provider,'reason':type(error).__name__,'retryable':True}

    def _video_request(self, query, exclude=()):
        key=self.key_provider('SERPAPI_KEY')
        if not key:return [],{'reason':'video_provider_not_configured'}
        try:
            response=self.transport.get('https://serpapi.com/search.json',params={'api_key':key,'engine':'youtube','search_query':query},timeout=20)
            if response.status_code!=200:return [],{'reason':'video_provider_quota' if response.status_code in {402,429,432,433} else 'video_provider_unavailable'}
            payload=response.json()
            if payload.get('error'):return [],{'reason':'video_provider_reported_error'}
            videos=[];seen=set(exclude)
            for row in payload.get('video_results',[])[:20]:
                video=ResearchArtifacts.video_id(str(row.get('link','')))
                if not video or video in seen:continue
                # Only actual video results, never channels/playlists or synthetic URLs.
                seen.add(video)
                thumb=row.get('thumbnail',{});thumb=thumb.get('static','') if isinstance(thumb,dict) else thumb
                videos.append({'id':'V'+video,'video_id':video,'title':safe(str(row.get('title','Video'))),'url':'https://www.youtube.com/watch?v='+video,'channel':safe(str((row.get('channel') or {}).get('name',''))),'thumbnail':thumb if str(thumb).startswith('https://') else '', 'published_at':safe(str(row.get('published_date',''))),'retrieved_at':now(),'content':safe(str(row.get('description',''))),'discovery_only':True})
                if len(videos)==5:break
            return videos,None if videos else {'reason':'no_relevant_videos_returned'}
        except Exception as error:return [],{'reason':'video_'+type(error).__name__}

    async def enrich_media(self, identifier, context, revision=''):
        lock=self.operation_locks.setdefault(stable('media',scope(context),identifier),asyncio.Lock())
        async with lock:
            fetched=await asyncio.to_thread(self.artifacts.get,identifier,context,revision)
            if fetched['status']!='ok':return fetched
            if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
            item=fetched['artifact'];existing=await asyncio.to_thread(self.artifacts.media,identifier,context)
            if existing['media_status'] in {'complete','partial','unavailable'}:return {'status':'completed',**existing,'research_id':identifier,'research_revision':item['revision'],'query':item['query'],'results':[]}
            claim=await asyncio.to_thread(self.artifacts.media_state,identifier,context,item['revision'],status='running',attempted=True)
            if claim.get('already_attempted'):
                # After a crash, the outbound request is uncertain: do not spend again.
                await asyncio.to_thread(self.artifacts.media_state,identifier,context,item['revision'],status='unavailable',failures=[{'reason':'video_request_interrupted_no_automatic_retry'}])
            elif len(existing['media'])>=3 or item['mode']!='detailed':
                await asyncio.to_thread(self.artifacts.media_state,identifier,context,item['revision'],status='complete',items=[])
            else:
                async with self.network:rows,error=await asyncio.to_thread(self._video_request,item['query'])
                present={r['video_id'] for r in existing['media']}
                rows=[r for r in rows if r['video_id'] not in present][:max(0,5-len(present))]
                await asyncio.to_thread(self.artifacts.media_state,identifier,context,item['revision'],status='partial' if error else 'complete',items=rows,failures=[error] if error else [])
            final=await asyncio.to_thread(self.artifacts.media,identifier,context)
            return {'status':'completed',**final,'research_id':identifier,'research_revision':item['revision'],'query':item['query'],'results':[]}

    async def more_media(self, arguments, context, operation_id):
        identifier=str(arguments.get('research_id',''));revision=str(arguments.get('research_revision',''))
        async with self.operation_locks.setdefault(stable('more-media',scope(context),identifier,operation_id),asyncio.Lock()):
            fetched=await asyncio.to_thread(self.artifacts.get,identifier,context,revision)
            if fetched['status']!='ok':return fetched
            item=fetched['artifact'];state=await asyncio.to_thread(self.artifacts.extension_state,identifier,context)
            if state.get('operation_id')==operation_id and state.get('outbound_started'):
                if state.get('phase')=='complete':return {**self.artifacts.brief(item),'added_media':state.get('added',0),'no_more':not state.get('added')}
                return {'status':'unconfirmed','reason':'video_request_interrupted_no_automatic_repeat','research_id':identifier}
            existing=await asyncio.to_thread(self.artifacts.media,identifier,context)
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='collecting_sources',view='media',operation_id=operation_id,outbound_started=True)
            async with self.network:rows,error=await asyncio.to_thread(self._video_request,display_title(item['query']),[r['video_id'] for r in existing['media']])
            if error and error.get('reason')=='no_relevant_videos_returned':error=None
            seen={r['video_id'] for r in existing['media']};rows=[r for r in rows if r['video_id'] not in seen]
            # The provider's returned results are authoritative; never invent extra videos.
            with self.artifacts.lock:saved=copy.deepcopy(self.artifacts.snapshot().get('media',{}).get(identifier,{}).get('items',[]))
            if rows:await asyncio.to_thread(self.artifacts.media_state,identifier,context,item['revision'],status='complete',items=[*saved,*rows])
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed' if error else 'complete',view='media',operation_id=operation_id,added=len(rows),reason=error.get('reason') if error else 'no_more_videos' if not rows else '',outbound_started=True)
            return {**self.artifacts.brief(item),'status':'failed' if error else 'completed','reason':error.get('reason') if error else '', 'added_media':len(rows),'media_revision':self.artifacts.media(identifier,context).get('media_revision'),'no_more':not rows}

    async def expand_report(self, arguments, context, operation_id):
        identifier=str(arguments.get('research_id',''));revision=str(arguments.get('research_revision',''))
        async with self.operation_locks.setdefault(stable('expand',scope(context),identifier,operation_id),asyncio.Lock()):
            fetched=await asyncio.to_thread(self.artifacts.get,identifier,context,revision)
            if fetched['status']!='ok':return fetched
            item=fetched['artifact'];activity=await asyncio.to_thread(self.artifacts.extension_state,identifier,context)
            with self.artifacts.lock:
                entries=self.artifacts.snapshot().get('extensions',{}).get(identifier,[])
                existing=next((e for e in entries if e['operation_id']==operation_id),None)
            if existing:return {**self.artifacts.brief(item),'extension_revision':existing['revision']}
            detail=str(arguments.get('detail',''))[:2000];view=arguments.get('view','reader')
            sources=await asyncio.to_thread(self.artifacts.source_catalog,item);additional=[]
            # Only an explicit need for fresher or absent evidence spends another retrieval request.
            fresh=bool(re.search(r'\b(latest|today|current|recent|updated|new sources|fresh)\b',detail,re.I))
            terms=set(re.findall(r'[a-z]{4,}',detail.casefold()))-{'more','details','information','please','about','sources','report','research','continue','expand','additional','give','provide','want','would','could'}
            evidence=' '.join([item['query'],*[r.get('content','')[:4000] for r in sources]]).casefold()
            missing=len(terms)>=3 and sum(t not in evidence for t in terms)>len(terms)*.65
            checkpoint=activity.get('search_checkpoint') if activity.get('operation_id')==operation_id else None
            if checkpoint is not None:additional=checkpoint
            elif fresh or missing or view=='sources':
                if activity.get('operation_id')==operation_id and activity.get('outbound_started'):return {'status':'unconfirmed','reason':'reconcile_extension_search_before_retry','research_id':identifier}
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='collecting_sources',view=view,operation_id=operation_id,outbound_started=True,search_checkpoint=None)
                query=(display_title(item['query'])+' '+detail)[:600]
                async with self.network:rows,error=await asyncio.to_thread(self._request,query,'detailed',8)
                if error:
                    await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed',reason=error['reason'])
                    return {'status':'failed','reason':error['reason'],'research_id':identifier}
                seen={r['url'] for r in sources};additional=[r for r in rows if r['url'] not in seen]
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,search_checkpoint=additional)
            sources=[*sources,*additional]
            if view=='sources':
                result=await asyncio.to_thread(self.artifacts.append_extension,identifier,context,revision,operation_id,'',additional)
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='complete',view=view,operation_id=operation_id,added=len(additional),reason='no_more_sources' if not additional else '')
                return {**self.artifacts.brief(item),**result,'no_more':not additional,'added_sources':len(additional)}
            if not self.synthesize:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='preparing_report',view=view,operation_id=operation_id)
            try:report=await self.synthesize(('[DOCUMENTARY]\n' if item.get('kind')=='documentary' else '')+'Continue this same research with additional supported detail. Do not repeat the existing overview or already composed findings. Original subject: '+item['query']+'\nRequested detail: '+detail+'\nAlready composed: '+item['report'][:4000]+'\nPrior extensions: '+' '.join(e['report'][:1000] for e in entries[-3:]),sources)
            except BudgetPaused as exc:
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='waiting_for_quota',view=view,operation_id=operation_id,reason=exc.reason)
                return {'status':'waiting_for_quota','next_attempt':max(time.time()+5,exc.until),'reason':exc.reason,'research_id':identifier}
            except Exception:
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed',reason='extension_unavailable')
                return {'status':'failed','reason':'extension_unavailable','research_id':identifier}
            if not report:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            result=await asyncio.to_thread(self.artifacts.append_extension,identifier,context,revision,operation_id,report,additional)
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='complete',view=view,operation_id=operation_id)
            return {**self.artifacts.brief(item),**result}

    async def search(self, arguments, context, operation_id=''):
        if arguments.get('action')=='images':
            identifier=str(arguments.get('research_id',''));found=await asyncio.to_thread(self.artifacts.get,identifier,context)
            if found['status']!='ok':return found
            from .research_illustrations import prepare_images,place_images
            async with self.operation_locks.setdefault(stable('illustrate',scope(context),identifier),asyncio.Lock()):
                rows=await prepare_images(self,identifier,context,self.artifacts.source_catalog(found['artifact']),display_title(found['artifact']['query']))
                await asyncio.to_thread(self.artifacts.request_state,identifier,context,selected_images=place_images(rows,found['artifact']['report']) if found['artifact']['report'] else rows)
            return {**self.artifacts.brief(found['artifact']),'image_enrichment':True}
        if arguments.get('action')=='expand':return await self.expand_report(arguments,context,operation_id)
        if arguments.get('action')=='more_media':return await self.more_media(arguments,context,operation_id)
        pending=None
        if arguments.get('research_id'):
            pending=await asyncio.to_thread(self.artifacts.request_state,str(arguments['research_id']),context)
            if pending['status']!='ok':return pending
            operation_id=pending['operation_id'];query=pending['query'];mode=pending['mode']
        else:query=str(arguments.get('query') or '').strip();mode=arguments.get('mode','quick')
        if not 1<=len(query)<=12000 or mode not in {'quick','detailed'}:return {'status':'rejected','reason':'Research brief must contain 1–12,000 characters.'}
        if safe(query)!=query:return {'status':'rejected','reason':'credentials_not_allowed_in_search'}
        questions=arguments.get('subquestions',[])
        if not isinstance(questions,list) or len(questions)>4 or any(not isinstance(q,str) or not 1<=len(q.strip())<=600 or safe(q)!=q for q in questions):return {'status':'rejected','reason':'invalid_research_fanout'}
        if mode=='quick' and questions:return {'status':'rejected','reason':'fanout_requires_detailed_mode'}
        key=stable(scope(context),operation_id or query,mode)
        async with self.operation_locks.setdefault(key,asyncio.Lock()):
            try:cached=await asyncio.to_thread(self.artifacts.find,query,mode,context,operation_id)
            except ValueError:return {'status':'conflict','reason':'operation_id_reused'}
            if cached:return self.artifacts.brief(cached)
            pending=await asyncio.to_thread(self.artifacts.reserve,query,mode,context,operation_id or key)
            if pending['status']!='ok':return pending
            identifier=pending['id']
            def checkpoint(**values):return self.artifacts.request_state(identifier,context,**values)
            sources=pending.get('sources',[]);failures=pending.get('failures',[])
            if not sources:
                await asyncio.to_thread(checkpoint,phase='collecting_sources')
                count=max(1,min(10,int(arguments.get('max_results') or (8 if mode=='detailed' else 5))))
                # Long instructions remain in the brief. Provider queries are bounded subjects.
                base=query if len(query)<=600 else display_title(query)
                searches=list(dict.fromkeys([base,*questions]))
                async def fetch(question):
                    async with self.network:return question,await asyncio.to_thread(self._request,question,mode,count)
                reused=await asyncio.to_thread(self.artifacts.related_evidence,query,context)
                # Always refresh time-sensitive requests; unchanged fresh evidence can satisfy an identical subject.
                fresh=[r for r in reused if not r['historical']]
                exact=any(normal(r.get('origin_query',''))==normal(query) for r in fresh) and not re.search(r'\b(latest|today|current|now|recent|price|release|news)\b',query,re.I)
                results=[] if exact and fresh else await asyncio.gather(*(fetch(q) for q in searches));urls=set();sources=[];failures=[]
                for row in reused:
                    if row['url'] not in urls:urls.add(row['url']);sources.append(row)
                for question,(rows,error) in results:
                    if error:failures.append({'query':question,**error})
                    for row in rows:
                        if row['url'] not in urls:urls.add(row['url']);sources.append(row)
                        else:sources[next(i for i,r in enumerate(sources) if r['url']==row['url'])]=row
                if not sources:
                    first=failures[0] if failures else {'reason':'no_supported_results'}
                    await asyncio.to_thread(checkpoint,phase='failed',failures=failures)
                    return {'status':'failed','reason':first['reason'],'retryable':bool(first.get('retryable')),'retry_after_seconds':first.get('retry_after_seconds',65),'query':query,'results':[],'failures':failures,'completeness':'unavailable'}
                await asyncio.to_thread(checkpoint,phase='comparing_evidence',sources=sources,failures=failures)
            from .research_illustrations import prepare_images,place_images
            illustrations=await prepare_images(self,identifier,context,sources,display_title(query)) if self.illustrate else []
            if self.synthesize:
                await asyncio.to_thread(checkpoint,phase='preparing_report')
                try:report=await self.synthesize(('[QUICK]\n' if mode=='quick' else '')+query,sources)
                except BudgetPaused as exc:
                    until=max(time.time()+5,exc.until)
                    await asyncio.to_thread(checkpoint,phase='waiting_for_quota',next_attempt=until,waiting_reason=exc.reason)
                    return {'status':'waiting_for_quota','reason':exc.reason,'next_attempt':until,'research_id':identifier,'research_revision':stable(identifier,'pending'),'query':query,'results':[]}
                except asyncio.CancelledError:raise
                except Exception:
                    await asyncio.to_thread(checkpoint,phase='failed',waiting_reason='synthesis_unavailable')
                    return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
                if not report:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            else:
                report='# '+display_title(query)+'\n\n'+('These are source excerpts, not a completed synthesis.\n\n' if mode=='detailed' else '')+'\n\n'.join('### '+r['title']+'\n\n'+reader_text(r.get('content',''))[:(500000 if mode=='detailed' else 1200)]+' [S'+str(i+1)+']' for i,r in enumerate(sources))+'\n\n## Limitations\nSearch excerpts may be incomplete; consult the supporting sources.'
            await asyncio.to_thread(self.artifacts.request_state,identifier,context,selected_images=place_images(illustrations,report))
            title=display_title(re.search(r'^# (.+)',report,re.M).group(1)) if re.search(r'^# (.+)',report,re.M) else display_title(query)
            await asyncio.to_thread(checkpoint,display_title=title,phase='complete',next_attempt=None)
            item=await asyncio.to_thread(self.artifacts.save,query,mode,report,sources,failures,context,operation_id or key)
            return self.artifacts.brief(item)
