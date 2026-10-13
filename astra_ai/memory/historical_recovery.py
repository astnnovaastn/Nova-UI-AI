"""Idempotent local recovery of attributed history and historical memory snapshots."""
import copy, hashlib, json, re, os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from .shared_memory import atomic, canonical, normal, safe, stable, now, CATEGORIES, ALIASES
from .memory_organization import inflate
from .legacy_live_memory import _iter_leaves, _SECRET_KEY_RE, _SECRET_VALUE_RE

DEFINITIONS={'description','enhancement_focus','contextual_considerations','last_updated'}
RULES={'user_instructions','contextual_rules','communication_boundaries','response_adaptation'}
PARSER_VERSION=3

def timestamp(value, zone):
    parsed=datetime.fromisoformat(str(value).replace('Z','+00:00'))
    if parsed.tzinfo is None:
        a=parsed.replace(tzinfo=zone,fold=0);b=parsed.replace(tzinfo=zone,fold=1)
        if a.utcoffset()!=b.utcoffset():raise ValueError('Ambiguous local date')
        parsed=a
    return parsed.astimezone(timezone.utc).isoformat()

def clean_history(text):
    """JSONC cleanup changes syntax only; quoted URLs and strings stay intact."""
    tokens=re.compile(r'"(?:[^"\\]|\\.)*"|//[^\n]*|/\*[\s\S]*?\*/')
    def strip(match):
        value=match.group(0)
        return value if value.startswith('"') else '\n'*value.count('\n')
    clean=tokens.sub(strip,text)
    chunks=re.split(r'("(?:[^"\\]|\\.)*")',clean)
    for i in range(0,len(chunks),2):chunks[i]=re.sub(r',(?=\s*[}\]])','',chunks[i])
    return ''.join(chunks)

def parse_history(text):
    return json.loads(clean_history(text))

def signature(message,zone):
    try:return (message.get('profile_id',''),message.get('project_id',''),message.get('role'),re.sub(r'\s+',' ',safe(message.get('content',message.get('text','')))).strip(),timestamp(message.get('timestamp'),zone))
    except (ValueError,TypeError):return None


def discover(root):
    """Audit archive-shaped files throughout Nova, pruning dependencies and private/test stores."""
    root=root.resolve();found=set()
    excluded={'node_modules','dist','.git','artifacts','guest_memory','tests','test_backend file','test_backups','__pycache__'}
    active={root/'astra_ai/memory/long_term.json',root/'astra_ai/Date/nova_ai_memory.json'}
    for directory,dirs,names in os.walk(root):
        dirs[:]=[d for d in dirs if d not in excluded and not d.startswith(('.venv','test_'))]
        folder=Path(directory)
        for name in names:
            p=folder/name;low=name.lower()
            if p in active or p.suffix.lower() not in {'.json','.jsonl','.backup','.bak'}:continue
            if any(term in low for term in ('config','presentation','queue','report','forget','pending','test','manifest','package')):continue
            if low.startswith(('nova_ai_memory','long_term')) or p.suffix.lower()=='.jsonl' or any(term in low for term in ('chat_history','memory_event','mem0_storage','processed_memory','text2_memory','transcription','conversation','transcript')) or folder.name in {'organizer_summaries','Dateversation'}:found.add(p)
    return sorted(found)


def recover(manager,paths,zone_name='Europe/Madrid',commit=False):
    zone=ZoneInfo(zone_name);report={'parser_version':PARSER_VERSION,'files':[],'messages_added':0,'records_added':0,'duplicates':0,'unresolved':0,'forgotten_suppressed':0,'historical_conflicts':0,'local_timezone':zone_name,'committed':False}
    with manager._lock:
        m=manager.load();existing=list(manager._raw_messages());known={}
        for msg in existing:
            sig=signature(msg,zone)
            if sig:known.setdefault(sig,[]).append(msg)
        forgotten=set(m.get('forgotten_records',{}));blocked_text=[normal(str(r.get('value',''))) for r in m.get('forgotten_records',{}).values() if len(str(r.get('value','')).strip())>=4];blocked={(r.get('category'),r.get('key'),normal(canonical(r.get('value')))) for r in m.get('forgotten_records',{}).values()}
        records={(r.get('category'),r.get('key'),normal(canonical(r.get('value'))),r.get('profile_id',''),r.get('project_id','')):r for r in m['records'].values()}
        bykey={(r.get('category'),r.get('key'),r.get('profile_id',''),r.get('project_id','')):r for r in m['records'].values()}
        incoming=[];filehashes=set();ledger=m['_meta'].setdefault('historical_recovery',{})
        for path in paths:
            entry={'path':str(path),'messages':0,'records':0,'unresolved':0,'entries':[]};report['files'].append(entry)
            try:raw=path.read_bytes()
            except OSError:entry.update(status='unreadable',reason='source_read_failed');report['unresolved']+=1;continue
            digest=hashlib.sha256(raw).hexdigest();entry['fingerprint']=digest
            if digest in filehashes or ledger.get(digest,{}).get('parser_version',0)>=PARSER_VERSION:entry['status']='duplicate_file';report['duplicates']+=1;continue
            filehashes.add(digest)
            try:
                content=raw.decode('utf-8-sig');data=parse_history(content) if path.suffix!='.jsonl' else [parse_history(line) for line in content.splitlines() if line.strip()]
            except (ValueError,UnicodeError):
                try:
                    # Retain only a complete JSON prefix; never guess missing braces or entries.
                    clean=clean_history(raw.decode('utf-8-sig')).lstrip();data,end=json.JSONDecoder().raw_decode(clean)
                    if not clean[end:].strip():raise ValueError()
                    entry['unresolved']+=1;entry['reason']='unparsed_trailing_data';entry['entries'].append({'entry_id':'trailing-data','result':'unresolved','reason':'unparsed_trailing_data','target_id':''})
                except (ValueError,UnicodeError):entry['status']='malformed';entry['reason']='invalid_json_or_encoding';report['unresolved']+=1;continue
            if isinstance(data,dict) and data.get('privacy_settings',{}).get('private_session'):
                entry['status']='private';continue
            if not isinstance(data,(dict,list)):
                entry['status']='unsupported';report['unresolved']+=1;continue
            entry['status']='read';source={'file':str(path),'fingerprint':digest,'parser_version':PARSER_VERSION}
            messages=data if isinstance(data,list) else data.get('conversation',data.get('messages',data.get('chat_history',[])))
            if not isinstance(messages,list):messages=[]
            turns={};session_map={}
            def audit(index,result,reason='',target=''):
                entry['entries'].append({'entry_id':str(index),'result':result,'reason':reason,'target_id':target})
            for index,item in enumerate(messages):
                if not isinstance(item,dict):audit(index,'unresolved','unsupported_entry');entry['unresolved']+=1;continue
                # Derived summaries are retained below as history, never as user messages.
                if item.get('summary') and not item.get('role'):continue
                role=str(item.get('role',item.get('speaker',''))).lower();role={'human':'user','ai':'assistant','nova':'assistant','aegis':'assistant'}.get(role,role)
                text=item.get('content',item.get('text',''));source_id=str(item.get('id',item.get('entry_id',index)))
                if role not in {'user','assistant'} or not isinstance(text,str) or not text.strip():audit(source_id,'unresolved','missing_attributed_speaker_or_text');entry['unresolved']+=1;continue
                if item.get('private') or item.get('private_session') or item.get('consent') in {'denied','revoked','private','none'} or item.get('forgotten') or item.get('forgotten_at') or item.get('state')=='forgotten':report['forgotten_suppressed']+=1;audit(source_id,'suppressed','private_or_forgotten');continue
                if any(value and value in normal(text) for value in blocked_text):report['forgotten_suppressed']+=1;audit(source_id,'suppressed','forgotten_content');continue
                try:stamp=timestamp(item.get('timestamp'),zone)
                except (ValueError,TypeError):audit(source_id,'unresolved','invalid_or_ambiguous_date');entry['unresolved']+=1;continue
                profile=item.get('profile_id','');project=item.get('project_id','');sig=(profile,project,role,re.sub(r'\s+',' ',safe(text)).strip(),stamp)
                raw_sid=str(item.get('session_id') or '');compatible=[x for x in known.get(sig,[]) if not raw_sid or x.get('session_id')==raw_sid or str(x.get('session_id','')).startswith('recovered-')]
                if not raw_sid and len({x.get('session_id') for x in compatible})>1:audit(source_id,'unresolved','ambiguous_session');entry['unresolved']+=1;continue
                prior=compatible[0] if compatible else None
                sid=session_map.get(raw_sid,raw_sid or 'recovered-'+stamp[:10])
                if prior:sid=prior.get('session_id',sid);session_map[raw_sid]=sid
                tid=(prior.get('turn_id') if prior else None) or item.get('turn_id')
                if role=='user':tid=tid or stable('recovered-turn-v2',sid,stamp,text);turns[sid]=tid
                else:tid=tid or turns.get(sid)
                if prior:report['duplicates']+=1;audit(source_id,'duplicate','matching_attributed_message',prior.get('id',''));continue
                if not tid:audit(source_id,'unresolved','assistant_without_attributed_turn');entry['unresolved']+=1;continue
                mid=stable('recovered-message-v2',*sig,sid,source_id if item.get('id') else '')
                message={'id':mid,'session_id':sid,'turn_id':str(tid),'role':role,'content':safe(text),'timestamp':stamp,'original_timestamp':item.get('timestamp'),'original_session_id':raw_sid,'original_entry_id':source_id,'profile_id':profile,'project_id':project,'source':'historical_recovery','provenance':{**source,'entry_id':source_id},'completed':item.get('completed',True),'status':item.get('status','completed'),'consent':item.get('consent','granted'),'revision':item.get('revision',1)}
                incoming.append(message);known.setdefault(sig,[]).append(message);entry['messages']+=1;audit(source_id,'imported',target=mid)
            if isinstance(data,(dict,list)):
                summary_items=data if isinstance(data,list) else [data]
                data=data if isinstance(data,dict) else {'derived_items':summary_items}
                candidates=[]
                for rid,r in inflate(data).get('records',{}).items():
                    if isinstance(r,dict) and r.get('category') in CATEGORIES:candidates.append((rid,copy.deepcopy(r)))
                for category,values in data.get('memory_categories',{}).items():
                    category=ALIASES.get(category,category)
                    if category not in CATEGORIES or not isinstance(values,dict):continue
                    for key,value in values.items():
                        if key in DEFINITIONS or value in (None,'',[],{}):continue
                        candidates.append(('',manager._record('', 'fact',category,key,value.get('value',value) if isinstance(value,dict) else value,source='historical_recovery',evidence='Historical memory snapshot; not a new user instruction')))
                for parts,leaf in _iter_leaves({k:v for k,v in data.items() if k in CATEGORIES or k in ALIASES}):
                    if len(parts)>1:candidates.append(('',manager._record('','fact',ALIASES.get(parts[0],parts[0]),'_'.join(parts[1:]),leaf.get('value'),source='historical_recovery',evidence='Historical memory snapshot')))
                events=data.get('memory_events',[])
                if isinstance(events,dict):events=list(events.values())
                for event in events if isinstance(events,list) else []:
                    if not isinstance(event,dict):continue
                    payload=event.get('content',event.get('summary',event.get('current_value',event)))
                    eventkey=str(event.get('key',event.get('event_id',stable(canonical(event)))))
                    candidates.append(('',manager._record('','activity','meta_memory',eventkey,payload,event_type='historical_trace',source_timestamp=event.get('timestamp',''),attributes={'original_event':event},source='historical_recovery')))
                for key,value in data.get('fact_history',{}).items():
                    candidates.append(('',manager._record('','activity','meta_memory','history_'+key,value,event_type='historical_trace',source='historical_recovery')))
                summaries=data.get('derived_items',[data] if data.get('daily_summary') else [])
                for i,item in enumerate(summaries):
                    text=item.get('summary',item.get('daily_summary','')) if isinstance(item,dict) else ''
                    if not isinstance(text,str) or not text.strip():continue
                    candidates.append(('',manager._record('','activity','meta_memory','derived_summary_'+str(item.get('entry_id',stable(safe(text)))),safe(text),event_type='historical_trace',attributes={'derived_context':True,'original_date':item.get('date',item.get('processed_at',''))},source='historical_recovery')))
                for rid,r in candidates:
                    category=r['category'];key=r.get('key','');value=r.get('value');profile=r.get('profile_id','');project=r.get('project_id','');sig=(category,key,normal(canonical(value)),profile,project)
                    if r.get('private') or r.get('private_session') or r.get('consent') in {'denied','revoked','private','none'} or rid in forgotten or sig[:3] in blocked or r.get('forgotten_at') or r.get('lifecycle') in {'forgotten','superseded'} or r.get('state') in {'forgotten','superseded'}:report['forgotten_suppressed']+=1;continue
                    if _SECRET_KEY_RE.search(key) or _SECRET_VALUE_RE.search(canonical(value)):entry['unresolved']+=1;continue
                    if sig in records:report['duplicates']+=1;audit(rid or key,'duplicate','matching_memory_record',records[sig]['id']);continue
                    prior=m['records'].get(rid) if rid else None
                    prior=prior or bykey.get((category,key,profile,project))
                    if prior or category in RULES:
                        if prior:
                            history=prior.setdefault('history',[]);revision={'value':value,'source':'historical_recovery','provenance':source,'historical':True}
                            if not any(normal(canonical(h.get('value')))==sig[2] for h in history):history.append(revision)
                        entry['unresolved']+=1;report['historical_conflicts']+=1;audit(rid or key,'historical_conflict','current_value_or_rule_preserved',prior['id'] if prior else '');continue
                    if r.get('kind')=='fact':
                        r.update(kind='activity',event_type='historical_trace',attributes={**r.get('attributes',{}),'historical_snapshot':True},evidence='Historical snapshot context; requires attributed user evidence before promotion')
                    rid=rid or stable('recovered-record',*sig);r.update(id=rid,provenance=source,source='historical_recovery');m['records'][rid]=r;records[sig]=r;bykey[(category,key,profile,project)]=r;entry['records']+=1;audit(rid,'imported',target=rid)
            report['unresolved']+=entry['unresolved'];ledger[digest]={'parser_version':PARSER_VERSION,'source':str(path),'imported_at':now(),'messages':entry['messages'],'records':entry['records'],'unresolved':entry['unresolved']}
        report['messages_added']=len(incoming);report['records_added']=sum(f['records'] for f in report['files'])
        if commit:
            for path in (manager.memory_path,manager.transcript_path,manager.forgotten_path):manager._backup(path,'before_historical_recovery')
            for path in manager.archive.glob('*.jsonl'):manager._backup(path,'before_historical_recovery')
            # Write transcript first; stable signatures make recovery safe after a partial commit.
            result=manager.append_messages(incoming)
            if result.get('status')=='private':raise ValueError('Conversation retention is disabled')
            manager._commit(m);report['committed']=True
            report_path=manager.memory_path.parent/'historical-recovery-report-v2.json'
            manager._backup(report_path,'previous_recovery_report');atomic(report_path,report)
    return report
