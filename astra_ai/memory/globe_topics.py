"""Bounded presentation topics backed by permitted records; never user facts or links."""
import re
from collections import defaultdict
from .shared_memory import stable,normal

MAX_AUTO_TOPICS=100
# These are collection labels. Matching a word asserts no relationship or user preference.
SUBJECTS={
 'Artificial intelligence':('artificial intelligence','machine learning',' ai ','inteligencia artificial'),
 'Memory systems':('memory','memories','memoria','recall','remember'),
 'Interface design':('interface','dashboard','widget','frontend','design','diseño'),
 'Software development':('python','typescript','javascript','code','coding','programming','código'),
 'Voice and audio':('voice','audio','microphone','speech','voz'),
 'Gemini':('gemini',), 'Nova and Aegis':('nova','aegis','astra'),
 'Knowledge graphs':('graph','globe','nodes','network','connections','grafo'),
 'Historical recovery':('archive','backup','historical','jsonl','recovery'),
 'Research':('research','sources','investigation','investigación'),
 'Files and documents':('file','folder','document','archivo','carpeta'),
 'Projects':('project','milestone','proyecto'), 'Travel':('travel','flight','trip','viaje'),
 'Learning':('learn','study','lesson','education','aprender'),
 'Work and business':('business','work','company','trabajo','empresa'),
 'Health and fitness':('health','exercise','fitness','salud'),
 'Music':('music','song','música'), 'Games':('game','gaming','juego'),
 'Calendar and scheduling':('calendar','schedule','appointment','calendario'),
 'Time and location':('timezone','madrid','location','zona horaria'),
 'Privacy and permissions':('privacy','consent','permission','privacidad'),
 'Hardware and performance':('computer','hardware','performance','latency','fps'),
 'Images and video':('image','video','picture','imagen'),
 'Relationships and people':('family','friend','colleague','familia','amigo'),
 'Goals':('goal','objective','ambition','objetivo'),
}
STOP=set(('about after again also always another around because before being between could currently different every everything first going great having image images inside itself just little looking memory messages really right should something sometimes still stuff thank their there these thing things think those through together under using very want wanted wants what when where which while will with would your yours user assistant nova aegis astra please okay need needs like make much more only have that this from they them then than into been were does doing said says know good look looks nice now all and for the not but can are was you has had new how why date time http https www com redacted fake fixture true false none null').split())

def topics(records,stored,limit=MAX_AUTO_TOPICS):
 groups=[];seen=set();blocked={normal(t.get('label','')) for t in stored.values() if t.get('state') in {'forgotten','superseded'}}
 def add(tid,label,members):
  members=sorted(set(members)&records.keys())
  if len(members)<2 or normal(label) in seen or normal(label) in blocked:return
  seen.add(normal(label));groups.append({'id':'topic:'+tid,'label':label,'member_ids':members,'description':'Content collection; membership is not a factual relationship','visual_only':True})
 for tid,t in sorted(stored.items()):
  if t.get('state')=='active':add(tid,t.get('label',tid),t.get('member_ids',[]))
 texts={rid:' '+normal(str(r.get('content',r.get('value',''))))+' ' for rid,r in records.items() if r.get('source')=='conversation' or r.get('attributes',{}).get('historical_snapshot') or r.get('kind')=='activity'}
 for label,terms in SUBJECTS.items():
  ids=[rid for rid,text in texts.items() if any(re.search(r'(?<!\w)'+re.escape(term.strip())+r'(?!\w)',text) for term in terms)]
  if len(ids)>=3:add(stable('globe-topic',label),label,ids)
 words=defaultdict(set)
 for rid,text in texts.items():
  for word in set(re.findall(r'[a-z][a-z]{4,23}',text)):
   if word not in STOP:words[word].add(rid)
 for word,ids in sorted(words.items(),key=lambda item:(-len(item[1]),item[0])):
  if len(ids)>=6 and len(ids)<=max(20,len(texts)*.22):add(stable('globe-word',word),word.capitalize(),ids)
  if limit is not None and len(groups)>=len(stored)+limit:break
 return groups
