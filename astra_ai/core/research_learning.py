"""Sourced research over the existing durable queue, outside text/audio processing."""
import asyncio,copy,json,os,re,time,uuid
from pathlib import Path
from datetime import datetime,timedelta,timezone
from urllib.parse import urlsplit
from astra_ai.memory.shared_memory import read,atomic,StorageLock,stable,normal,safe,now,SENSITIVE
from astra_ai.memory.category_policy import matches_scope,lifecycle
from .background_budget import BudgetPaused, WRITER_PACING_REASONS

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


from .research.artifacts import scope, display_title, reader_text, evidence_excerpt, article_root, ResearchArtifacts

class ResearchSearch:
    def __init__(self, artifacts, key_provider, transport=requests, synthesize=None, illustrate=False, complete=None, read_evidence=False, prepare_media=False):
        self.artifacts=artifacts;self.key_provider=key_provider;self.transport=transport
        self.synthesize=synthesize;self.illustrate=illustrate;self.complete=complete;self.read_evidence=read_evidence;self.prepare_media=prepare_media
        self.network=asyncio.Semaphore(4);self.operation_locks={};self.provider_states={}

    async def extension_writer_failure(self,exc,identifier,context,operation_id,view='reader'):
        from .research_model import ResearchModelUnavailable
        if not isinstance(exc,ResearchModelUnavailable):return None
        activity=await asyncio.to_thread(self.artifacts.extension_operation,identifier,context,operation_id)
        attempts=activity.get('writer_service_attempts',0)+1
        retry=attempts<3;until=time.time()+30
        reason=getattr(exc,'provider','gemini')+'_service_unavailable' if getattr(exc,'provider','gemini') in {'gemini','groq','openai'} else 'gemini_service_unavailable'
        await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='waiting_for_quota' if retry else 'failed',view=view,operation_id=operation_id,reason=reason,next_attempt=until if retry else None,writer_service_attempts=attempts)
        return {'status':'waiting_for_retry' if retry else 'failed','reason':reason,'next_attempt':until,'research_id':identifier}

    async def read_collected_evidence(self,identifier,context,sources):
        found=await asyncio.to_thread(self.artifacts.get,identifier,context)
        if found.get('status')!='ok':return sources
        catalog=await asyncio.to_thread(self.artifacts.source_catalog,found['artifact'])
        ids={row['url']:'S'+str(i+1) for i,row in enumerate(catalog)}
        async def read_page(row):
            try:
                async with self.network:
                    body,mime=await asyncio.to_thread(self.artifacts.source_bytes,identifier,context,ids[row['url']],False)
                if mime.startswith('text/plain'):
                    text=reader_text(safe(body.decode('utf-8',errors='replace')))[:12000]
                    if len(text)>len(row.get('content',''))+100:return {**row,'search_excerpt':row.get('content',''),'content':text}
            except Exception:pass
            return row
        candidates=[row for row in sources if not self.artifacts.video_id(row['url']) and len(row.get('content',''))<12000][:3]
        enriched=await asyncio.gather(*(read_page(row) for row in candidates))
        by_url={row['url']:row for row in enriched}
        return [by_url.get(row['url'],row) for row in sources]

    def _request(self, query, mode, count, retrieval_depth='advanced'):
        from .research_topics import search_key,search_subject
        provider='tavily' if mode=='detailed' else 'serpapi'
        key=search_key(self.key_provider,mode)
        if not key:return [], {'provider':provider,'reason':'provider_not_configured'}
        marker=hashlib.sha256(key.encode()).hexdigest()
        previous=self.provider_states.get(provider,{})
        if previous.get('key_hash')==marker and (previous.get('http_status') in {401,403} or time.time()<previous.get('until',0)):
            return [], {k:v for k,v in previous.items() if k not in {'key_hash','until'}}
        try:
            if mode=='detailed':
                response=self.transport.post('https://api.tavily.com/search',headers={'Authorization':'Bearer '+key},json={'query':query,'search_depth':'basic' if retrieval_depth=='basic' else 'advanced','max_results':count,'chunks_per_source':3,'auto_parameters':False,'include_raw_content':'markdown','include_answer':False,'include_favicon':True,'include_images':True,'include_image_descriptions':True},timeout=30)
            else:
                response=self.transport.get('https://serpapi.com/search.json',params={'api_key':key,'engine':'google','q':search_subject(query),'num':count},timeout=20)
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
        from .research_topics import search_key
        key=search_key(self.key_provider,'quick')
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
            item=fetched['artifact'];activity=await asyncio.to_thread(self.artifacts.extension_operation,identifier,context,operation_id)
            with self.artifacts.lock:
                entries=self.artifacts.snapshot().get('extensions',{}).get(identifier,[])
                existing=next((e for e in entries if e['operation_id']==operation_id),None)
            if existing:return {**self.artifacts.brief(item),'extension_revision':existing['revision']}
            detail=str(arguments.get('detail',''))[:2000];view=arguments.get('view','reader')
            sources=await asyncio.to_thread(self.artifacts.source_catalog,item);additional=[]
            # Only an explicit need for fresher or absent evidence spends another retrieval request.
            fresh=bool(re.search(r'\b(latest|today|current|recent|updated|new sources|fresh)\b',detail,re.I))
            terms=set(re.findall(r'[a-z]{4,}',detail.casefold()))-{'more','details','information','please','about','sources','report','research','continue','expand','additional','give','provide','want','would','could','explain','append','substantial','connected','explanation','citations','evidence','already','saved','same','page','first','search','only','important','detail','missing','using','with','this','that','what','have','them','their','these','those'}
            # The reader and later source passages may already cover the question.
            # Presentation instructions must not count as missing factual evidence.
            # A question or generated explanation is not proof that supporting
            # evidence was collected. Check the actual saved source passages.
            evidence=' '.join(r.get('content','')[:12000] for r in sources).casefold()
            missing=len(terms)>=3 and sum(t not in evidence for t in terms)>len(terms)*.65
            checkpoint=activity.get('search_checkpoint') if activity.get('operation_id')==operation_id else None
            if checkpoint is not None:additional=checkpoint
            elif (fresh or missing or view=='sources') and not context.get('research_saved_only'):
                if activity.get('operation_id')==operation_id and activity.get('outbound_started'):return {'status':'unconfirmed','reason':'reconcile_extension_search_before_retry','research_id':identifier}
                depth='advanced' if view=='sources' or re.search(r'\b(comprehensive|extensive|in.depth|full report|exhaustive)\b',detail,re.I) else 'basic'
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='collecting_sources',view=view,operation_id=operation_id,outbound_started=True,search_checkpoint=None,retrieval_depth=depth)
                query=(display_title(item['query'])+' '+detail)[:600]
                search_mode=arguments.get('mode') if arguments.get('mode') in {'quick','detailed'} else item.get('mode','detailed')
                async with self.network:rows,error=await asyncio.to_thread(self._request,query,search_mode,8,depth)
                if error:
                    retry=bool(error.get('retryable'));until=time.time()+error.get('retry_after_seconds',65)
                    await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='waiting_for_quota' if retry else 'failed',operation_id=operation_id,view=view,reason='search_'+error['reason'],outbound_started=False,next_attempt=until if retry else None)
                    return {'status':'waiting_for_quota' if retry else 'failed','reason':'search_'+error['reason'],'next_attempt':until,'research_id':identifier}
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
                checkpointed=exc.reason=='research_section_saved';pacing=exc.reason in WRITER_PACING_REASONS
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='preparing_report' if checkpointed or pacing else 'waiting_for_quota',view=view,operation_id=operation_id,reason='' if checkpointed else exc.reason,next_attempt=exc.until)
                return {'status':'waiting_for_retry' if checkpointed or pacing else 'waiting_for_quota','next_attempt':max(time.time()+1,exc.until),'reason':exc.reason,'research_id':identifier,
                        **({'summary':'The saved addition is waiting briefly for the writing slot or pacing interval, not a daily allowance. It will resume automatically; do not claim a provider quota was reached.'} if pacing else {})}
            except Exception as exc:
                failure=await self.extension_writer_failure(exc,identifier,context,operation_id,view)
                if failure:return failure
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed',reason='extension_unavailable')
                return {'status':'failed','reason':'extension_unavailable','research_id':identifier}
            if not report:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            result=await asyncio.to_thread(self.artifacts.append_extension,identifier,context,revision,operation_id,report,additional,detail)
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='complete',view=view,operation_id=operation_id)
            return {**self.artifacts.brief(item),**result}

    async def quick_followup(self, arguments, context, operation_id):
        identifier=str(arguments.get('research_id',''));query=str(arguments.get('query','')).strip()
        if not 1<=len(query)<=12000 or safe(query)!=query:return {'status':'rejected','reason':'invalid_search_brief'}
        async with self.operation_locks.setdefault(stable('quick-topic',scope(context),identifier),asyncio.Lock()):
            found=await asyncio.to_thread(self.artifacts.get,identifier,context)
            if found['status']!='ok':return found
            item=found['artifact'];metadata=await asyncio.to_thread(self.artifacts.request_state,identifier,context)
            async def answer_result(summary):
                catalog=await asyncio.to_thread(self.artifacts.source_catalog,item)
                ids={int(number) for group in re.findall(r'\[(S\d+(?:\s*[,;]\s*S\d+)*)\]',summary) for number in re.findall(r'S(\d+)',group)}
                results=[{'id':'S'+str(i+1),**{key:row.get(key,'') for key in ('title','url','retrieved_at')}} for i,row in enumerate(catalog) if i+1 in ids]
                return {**self.artifacts.brief(item),'summary':summary[:4000],'results':results}
            selected=context.get('research_id')==identifier and item.get('kind') not in {'chat','documentary'}
            if not selected and (item.get('mode')!='quick' or not metadata.get('conversation_topic')):return {'status':'rejected','reason':'conversation_topic_required'}
            if item.get('completeness')=='failed':return {'status':'failed','reason':'topic_initial_report_failed','research_id':identifier}
            operations=metadata.get('quick_followups',{});checkpoint=operations.get(operation_id,{})
            if normal(item['query'])==normal(query) and time.time()-item['created_epoch']<300:return {**self.artifacts.brief(item),'duplicate':True}
            for previous in operations.values():
                if previous.get('state')=='complete' and normal(previous.get('query',''))==normal(query):
                    try:recent=time.time()-datetime.fromisoformat(previous['created']).timestamp()<300
                    except (ValueError,KeyError):recent=False
                    if recent:return {**await answer_result(previous.get('summary','')),'duplicate':True}
            if checkpoint.get('query') and checkpoint['query']!=query:return {'status':'conflict','reason':'operation_id_reused'}
            if checkpoint.get('state')=='complete':return {**await answer_result(checkpoint.get('summary','')),'duplicate':True}
            sources=checkpoint.get('sources')
            if sources is None:
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='collecting_sources',view='reader',operation_id=operation_id)
                provider_query=(display_title(item['query'])+': '+query)[:600]
                async with self.network:rows,error=await asyncio.to_thread(self._request,provider_query,'quick',5)
                if error:
                    await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed',view='reader',reason=error['reason'])
                    return {'status':'failed',**error,'research_id':identifier}
                sources=rows;operations[operation_id]={'query':query,'provider_query':provider_query,'sources':rows,'state':'preparing_report'}
                await asyncio.to_thread(self.artifacts.request_state,identifier,context,quick_followups=operations)
            # Evidence has its own durable receipt before model work. Source-only
            # entries keep citation IDs stable without publishing unfinished prose.
            await asyncio.to_thread(self.artifacts.append_extension,identifier,context,item['revision'],operation_id+':sources','',sources)
            if self.read_evidence and not operations[operation_id].get('pages_checked'):
                sources=await self.read_collected_evidence(identifier,context,sources)
                operations[operation_id].update(sources=sources,pages_checked=True)
                await asyncio.to_thread(self.artifacts.request_state,identifier,context,quick_followups=operations)
            if item.get('completeness')=='pending':
                # Collection is useful even while the original synthesis is paused.
                # Save it once and expose the evidence; never label it a finished answer.
                def checkpoint_pending():
                    with self.artifacts.lock:
                        current=self.artifacts.request_state(identifier,context)
                        # A follow-up has its own durable source receipt above.
                        # Mutating evidence underneath an in-flight composition
                        # invalidates its signature and discards saved sections.
                        writing=current.get('phase')=='preparing_report' or bool(current.get('synthesis_checkpoint',{}).get('signature'))
                        if not writing:
                            merged=list(current.get('sources',[]));seen={row['url'] for row in merged}
                            for row in sources:
                                if row['url'] not in seen:merged.append(row);seen.add(row['url'])
                            self.artifacts.request_state(identifier,context,sources=merged)
                        activity=self.artifacts.extension_state(identifier,context)
                        if activity.get('operation_id') in {None,operation_id}:
                            self.artifacts.extension_state(identifier,context,phase='waiting_for_report',view='reader',operation_id=operation_id,reason='initial_report_pending',collected_sources=len(sources))
                await asyncio.to_thread(checkpoint_pending)
                evidence=await asyncio.to_thread(self.artifacts.followup_evidence,identifier,context,operation_id)
                return {'status':'waiting_for_retry','reason':'topic_initial_report_pending','next_attempt':time.time()+15,'research_id':identifier,'collected_sources':len(sources),'evidence_available':True,'results':evidence,
                        'summary':'Sources are saved in this report. Give a concise supported conversational answer from these excerpts now, with citations and limitations. Do not merely promise future research. The composed report is still waiting; do not claim it is published.'}
            catalog=await asyncio.to_thread(self.artifacts.source_catalog,item);urls={row['url'] for row in catalog}
            richer={row['url']:row for row in sources}
            catalog=[richer.get(row['url'],row) for row in catalog]
            for row in sources:
                if row['url'] not in urls:catalog.append(row);urls.add(row['url'])
            with self.artifacts.lock:
                saved=next((row for row in self.artifacts.snapshot().get('extensions',{}).get(identifier,[]) if row['operation_id']==operation_id),None)
            if saved:return {**await answer_result(saved['report']),'duplicate':True}
            if not self.synthesize:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='preparing_report',view='reader',operation_id=operation_id)
            composition_mode=arguments.get('report_mode') or item.get('mode','quick')
            try:report=await self.synthesize(('[QUICK]\n' if composition_mode=='quick' else '')+'Original report subject: '+item['query']+'\nFollow-up question: '+query,catalog)
            except BudgetPaused as exc:
                pacing=exc.reason in WRITER_PACING_REASONS or exc.reason=='research_section_saved'
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='preparing_report' if pacing else 'waiting_for_quota',view='reader',reason=exc.reason,next_attempt=exc.until)
                return {'status':'waiting_for_retry' if pacing else 'waiting_for_quota','reason':exc.reason,'next_attempt':exc.until,'research_id':identifier,'results':await asyncio.to_thread(self.artifacts.followup_evidence,identifier,context,operation_id),
                        'summary':'Follow-up evidence is saved. Answer from the supplied evidence and cite it. Report writing will resume from its checkpoint after a short writing-slot or pacing wait; no daily quota was reached.' if pacing else 'Follow-up evidence is saved. Answer the question conversationally from the supplied excerpts and cite them. Report writing is paused for the reported allowance or provider limit; do not claim active research.'}
            except asyncio.CancelledError:raise
            except Exception as exc:
                failure=await self.extension_writer_failure(exc,identifier,context,operation_id)
                if failure:return failure
                await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='failed',view='reader',reason='synthesis_unavailable')
                return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            result=await asyncio.to_thread(self.artifacts.append_extension,identifier,context,item['revision'],operation_id,report,sources,query)
            if result['status']!='completed':return result
            operations[operation_id]={'query':query,'state':'complete','summary':report[:4000],'created':now()}
            await asyncio.to_thread(self.artifacts.request_state,identifier,context,quick_followups=operations)
            await asyncio.to_thread(self.artifacts.extension_state,identifier,context,phase='complete',view='reader',next_attempt=None,reason='')
            await asyncio.to_thread(self.artifacts.link_turn,identifier,{**context,'referenced_research_id':identifier})
            return {**await answer_result(report),**result,'topic_followup':True}

    async def search(self, arguments, context, operation_id=''):
        # Queued tool batches carry the turn's frozen report identity too. Route
        # before topic allocation, including a mistakenly supplied child ID.
        from .research_topics import new_research_request,conversational_mode
        parent_id=context.get('research_id')
        if parent_id and not context.get('research_page_request') and not context.get('guest') and arguments.get('action','') in {'','topic_followup'} and not new_research_request(context.get('user_text') or context.get('research_user_text','')):
            parent=await asyncio.to_thread(self.artifacts.get,parent_id,context)
            if parent.get('status')=='ok' and parent['artifact'].get('kind') not in {'chat','documentary'}:
                query=str(context.get('user_text') or context.get('research_user_text') or arguments.get('query') or '').strip()
                if not query and arguments.get('research_id') and arguments['research_id']!=parent_id:
                    child=await asyncio.to_thread(self.artifacts.request_state,str(arguments['research_id']),context)
                    if child.get('status')=='ok':query=str(child.get('query') or '').strip()
                if query:
                    await asyncio.to_thread(self.artifacts.link_turn,parent_id,{**context,'referenced_research_id':parent_id})
                    mode=conversational_mode(arguments,context)
                    if mode=='detailed' and parent['artifact'].get('completeness')!='pending':return await self.expand_report({'research_id':parent_id,'research_revision':parent['artifact']['revision'],'detail':query,'mode':mode,'view':'reader'},context,operation_id)
                    return await self.quick_followup({'research_id':parent_id,'query':query,'report_mode':parent['artifact'].get('mode','quick')},context,operation_id)
        if arguments.get('action')=='topic_followup':return await self.quick_followup(arguments,context,operation_id)
        if arguments.get('action')=='repair':
            identifier=str(arguments.get('research_id',''));found=await asyncio.to_thread(self.artifacts.get,identifier,context)
            if found['status']!='ok':return found
            item=found['artifact']
            with self.artifacts.lock:
                if any(r['operation_id']==operation_id for r in self.artifacts.snapshot().get('report_history',{}).get(identifier,[])):return {**self.artifacts.brief(item),'revision_repair':True}
            if item['revision']!=str(arguments.get('research_revision','')):return {'status':'conflict','reason':'research_revision_changed'}
            if not self.synthesize:return {'status':'failed','reason':'synthesis_unavailable'}
            checkpoint=self.artifacts.request_state(identifier,context).get('completion_checkpoint',{})
            if checkpoint.get('revision')!=item['revision']:checkpoint={}
            try:
                sources=self.artifacts.source_catalog(item)
                composition=self.artifacts.request_state(identifier,context).get('synthesis_checkpoint',{})
                if len(composition.get('parts',[]))==3 and not composition.get('coverage_checked'):
                    report=await self.synthesize(item['query'],item['sources'])
                else:report=await self.complete(checkpoint.get('report') or item['report'],item['query'],sources) if self.complete else await self.synthesize(item['query']+'\nFinish every requested topic, including recommendations and limitations, within a concise complete report. End with a complete conclusion; do not leave any section or sentence unfinished.',sources)
            except BudgetPaused as exc:return {'status':'waiting_for_retry' if exc.reason=='research_section_saved' or exc.reason in WRITER_PACING_REASONS else 'waiting_for_quota','next_attempt':max(time.time()+1,exc.until),'reason':exc.reason,'research_id':identifier}
            except Exception as exc:
                from .research_model import IncompleteResearchAnswer
                if not isinstance(exc,IncompleteResearchAnswer):raise
                count=checkpoint.get('attempts',0)+1
                if count>=3 or len(exc.report)>22000:raise
                await asyncio.to_thread(self.artifacts.request_state,identifier,context,completion_checkpoint={'revision':item['revision'],'operation_id':operation_id,'report':exc.report,'attempts':count})
                return {'status':'waiting_for_retry','reason':'research_completion_pending','next_attempt':time.time()+15,'research_id':identifier}
            result=await asyncio.to_thread(self.artifacts.revise_report,identifier,context,item['revision'],report,operation_id)
            return {**result,'revision_repair':True}
        if arguments.get('action')=='images':
            identifier=str(arguments.get('research_id',''));found=await asyncio.to_thread(self.artifacts.get,identifier,context)
            if found['status']!='ok':return found
            if found['artifact'].get('completeness')!='complete':return {'status':'waiting_for_retry','reason':'research_completion_pending','research_id':identifier,'next_attempt':time.time()+15}
            from .research_illustrations import prepare_images,place_images
            async with self.operation_locks.setdefault(stable('illustrate',scope(context),identifier),asyncio.Lock()):
                rows=await prepare_images(self,identifier,context,self.artifacts.source_catalog(found['artifact']),display_title(found['artifact']['query']))
                await asyncio.to_thread(self.artifacts.request_state,identifier,context,selected_images=place_images(rows,found['artifact']['report'],found['artifact']['query']) if found['artifact']['report'] else rows)
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
        if mode=='quick' and not arguments.get('research_id') and context.get('job_id') and not context.get('requested_research'):
            topic=await asyncio.to_thread(self.artifacts.conversation_search,query,context,str(arguments.get('topic','')))
            if topic['status']!='ok':return topic
            if topic.get('followup'):return await self.quick_followup({'research_id':topic['id'],'query':query},context,operation_id)
            pending=topic;operation_id=topic['operation_id']
        if not isinstance(questions,list) or len(questions)>4 or any(not isinstance(q,str) or not 1<=len(q.strip())<=600 or safe(q)!=q for q in questions):return {'status':'rejected','reason':'invalid_research_fanout'}
        if mode=='quick' and questions:return {'status':'rejected','reason':'fanout_requires_detailed_mode'}
        key=stable(scope(context),operation_id or query,mode)
        if pending is None:
            pending=await asyncio.to_thread(self.artifacts.reserve,query,mode,context,operation_id or key)
            if pending['status']!='ok':return pending
        operation_id=pending['operation_id'];query=pending['query'];mode=pending['mode']
        key=stable(scope(context),operation_id,mode)
        async with self.operation_locks.setdefault(key,asyncio.Lock()):
            try:cached=await asyncio.to_thread(self.artifacts.find,query,mode,context,operation_id)
            except ValueError:return {'status':'conflict','reason':'operation_id_reused'}
            if cached:
                if self.artifacts.request_state(cached['id'],context).get('publication_state')=='preparing':
                    if self.prepare_media:await self.enrich_media(cached['id'],context,cached['revision'])
                    return await asyncio.to_thread(self.artifacts.publish_prepared,cached['id'],context)
                return self.artifacts.brief(cached)
            identifier=pending['id']
            def checkpoint(**values):return self.artifacts.request_state(identifier,context,**values)
            sources=pending.get('sources',[]);failures=pending.get('failures',[])
            if sources and all(row.get('origin_query') for row in sources):
                eligible=await asyncio.to_thread(self.artifacts.related_evidence,query,context)
                eligible_urls={row['url'] for row in eligible}
                if not any(row['url'] in eligible_urls for row in sources):
                    await asyncio.to_thread(checkpoint,rejected_evidence_count=len(sources),sources=[],synthesis_checkpoint={},selected_images=[],images_prepared=False)
                    sources=[]
            if not sources:
                await asyncio.to_thread(checkpoint,phase='collecting_sources')
                count=max(1,min(20 if mode=='detailed' else 10,int(arguments.get('max_results') or (12 if mode=='detailed' else 5))))
                # Long instructions remain in the brief. Provider queries are bounded subjects.
                base=query if len(query)<=600 else display_title(query)
                searches=list(dict.fromkeys([base,*questions]))
                async def fetch(question):
                    async with self.network:return question,await asyncio.to_thread(self._request,question,mode,count)
                reused=await asyncio.to_thread(self.artifacts.related_evidence,query,context)
                # Always refresh time-sensitive requests; unchanged fresh evidence can satisfy an identical subject.
                fresh=[r for r in reused if not r['historical']]
                from .research_intent import subject_terms, fresh_request
                from .research_topics import search_subject
                wanted=subject_terms(search_subject(query))
                coverage=bool(wanted) and wanted<=subject_terms(' '.join(r.get('title','')+' '+r.get('content','') for r in reused))
                exact=any(normal(r.get('origin_query',''))==normal(query) for r in fresh)
                reuse_only=not questions and not fresh_request(query) and (coverage or exact and fresh)
                results=[] if reuse_only else await asyncio.gather(*(fetch(q) for q in searches));urls=set();sources=[];failures=[]
                for row in reused:
                    if row['url'] not in urls:urls.add(row['url']);sources.append(row)
                for question,(rows,error) in results:
                    if error:failures.append({'query':question,**error})
                    for row in rows:
                        if row['url'] not in urls:urls.add(row['url']);sources.append(row)
                        else:sources[next(i for i,r in enumerate(sources) if r['url']==row['url'])]=row
                if not sources:
                    first=failures[0] if failures else {'reason':'no_supported_results'}
                    retry=bool(first.get('retryable'));until=time.time()+first.get('retry_after_seconds',65)
                    await asyncio.to_thread(checkpoint,phase='waiting_for_quota' if retry else 'failed',waiting_reason='search_'+first['reason'],next_attempt=until if retry else None,failures=failures)
                    return {'status':'waiting_for_quota' if retry else 'failed','reason':first['reason'],'next_attempt':until,'research_id':identifier,'retryable':retry,'retry_after_seconds':first.get('retry_after_seconds',65),'query':query,'results':[],'failures':failures,'completeness':'unavailable'}
                await asyncio.to_thread(checkpoint,phase='comparing_evidence',sources=sources,failures=failures)
            if mode=='quick' and self.read_evidence and not pending.get('source_pages_checked'):
                sources=await self.read_collected_evidence(identifier,context,sources)
                await asyncio.to_thread(checkpoint,sources=sources,source_pages_checked=True)
            from .research_illustrations import prepare_images,place_images
            illustrations=await prepare_images(self,identifier,context,sources,display_title(query)) if self.illustrate else []
            if self.synthesize:
                await asyncio.to_thread(checkpoint,phase='preparing_report')
                try:report=await self.synthesize(('[QUICK]\n' if mode=='quick' else '')+query,sources)
                except BudgetPaused as exc:
                    ready=exc.reason=='research_section_saved';pacing=exc.reason in WRITER_PACING_REASONS;until=max(time.time()+(1 if ready else 5),exc.until)
                    await asyncio.to_thread(checkpoint,phase='preparing_report' if ready or pacing else 'waiting_for_quota',next_attempt=until,waiting_reason='' if ready else exc.reason)
                    return {'status':'waiting_for_retry' if ready or pacing else 'waiting_for_quota','reason':exc.reason,'next_attempt':until,'research_id':identifier,'research_revision':stable(identifier,'pending'),'query':query,'results':[]}
                except asyncio.CancelledError:raise
                except Exception as exc:
                    from .research_model import ResearchModelUnavailable
                    if isinstance(exc,ResearchModelUnavailable):
                        metadata=await asyncio.to_thread(self.artifacts.request_state,identifier,context)
                        saved=metadata.get('synthesis_checkpoint',{})
                        stage=str(context.get('job_id',''))+':'+('plan' if not saved.get('plan') else str(len(saved.get('parts',[]))))
                        previous=metadata.get('synthesis_failures',{})
                        attempts=(previous.get('attempts',0) if previous.get('stage')==stage else 0)+1
                        retry=attempts<3;until=time.time()+30
                        kind=getattr(exc,'failure_kind','unavailable')
                        if kind not in {'http_404','http_408','http_500','http_502','http_503','http_504','timeout'}:kind='unavailable'
                        reason=getattr(exc,'provider','gemini')+'_service_unavailable' if getattr(exc,'provider','gemini') in {'gemini','groq','openai'} else 'gemini_service_unavailable'
                        await asyncio.to_thread(checkpoint,phase='waiting_for_quota' if retry else 'failed',waiting_reason=reason,next_attempt=until if retry else None,synthesis_failures={'stage':stage,'attempts':attempts,'kind':kind})
                        return {'status':'waiting_for_retry' if retry else 'failed','reason':reason,'next_attempt':until,'research_id':identifier}
                    failure_kind={
                        'Gemini answer reached its output limit before completion':'output_limit',
                        'OpenAI answer reached its output limit before completion':'output_limit',
                        'Research section is incomplete or unverifiable':'incomplete_section',
                        'Research coverage review is unverifiable':'incomplete_review',
                        'Research remainder is incomplete or unverifiable':'incomplete_remainder',
                        'Invalid research remainder':'invalid_response',
                        'Gemini returned an invalid research answer':'invalid_response',
                        'Research needs review after its bounded repair':'repair_limit',
                        'Research writing reached its bounded stage attempts':'attempt_limit',
                        'Research context exceeds the available fallback capacity':'context_limit',
                        'Detailed fallback research has insufficient depth':'insufficient_depth',
                    }.get(str(exc),'unavailable')
                    import logging
                    logging.getLogger('research.workflow').warning('research_synthesis_failed category=%s reason=%s',type(exc).__name__,failure_kind)
                    await asyncio.to_thread(checkpoint,phase='failed',waiting_reason='synthesis_unavailable',synthesis_failure_kind=failure_kind)
                    return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
                if not report:return {'status':'failed','reason':'synthesis_unavailable','research_id':identifier}
            else:
                report='# '+display_title(query)+'\n\n'+('These are source excerpts, not a completed synthesis.\n\n' if mode=='detailed' else '')+'\n\n'.join('### '+r['title']+'\n\n'+reader_text(r.get('content',''))[:(500000 if mode=='detailed' else 1200)]+' [S'+str(i+1)+']' for i,r in enumerate(sources))+'\n\n## Limitations\nSearch excerpts may be incomplete; consult the supporting sources.'
            await asyncio.to_thread(self.artifacts.request_state,identifier,context,selected_images=place_images(illustrations,report,query))
            title=display_title(re.search(r'^# (.+)',report,re.M).group(1)) if re.search(r'^# (.+)',report,re.M) else display_title(query)
            await asyncio.to_thread(checkpoint,display_title=title)
            await asyncio.to_thread(checkpoint,phase='preparing_layout',publication_state='preparing')
            item=await asyncio.to_thread(self.artifacts.save,query,mode,report,sources,failures,{**context,'prepare_publication':True},operation_id or key)
            if self.prepare_media:await self.enrich_media(item['id'],context,item['revision'])
            return await asyncio.to_thread(self.artifacts.publish_prepared,item['id'],context)
