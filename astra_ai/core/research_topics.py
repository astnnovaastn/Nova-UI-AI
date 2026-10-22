"""Conversation search routing; never borrows the deep-research credential."""
import re,time
from datetime import datetime,timezone
from astra_ai.memory.shared_memory import stable

def search_key(provider, mode):
    names=('DEEP_RESEARCH_API_KEY','TAVILY_API_KEY') if mode=='detailed' else ('QUICK_SEARCH_API_KEY','SERPAPI_KEY')
    return provider(names[0]) or provider(names[1])


def search_subject(brief):
    """Send the subject to keyword search, keeping writing instructions in the brief."""
    text=' '.join(str(brief).split())
    text=re.split(r'(?<=[.!?])\s+(?=[A-Z])',text,maxsplit=1)[0]
    text=re.sub(r'^(?:(?:please\s+)?(?:can|could|would) you\s+|please\s+|(?:research|search|investigate|find)\s+(?:for\s+|about\s+|information\s+(?:on|about)\s+)*)+','',text,flags=re.I)
    return text[:300].rstrip(' .!?') or str(brief).strip()[:300]

def new_research_request(text):
    return bool(re.search(r'\b(new research|new topic|different topic|start over|instead research)\b',str(text),re.I))

def followup_view(text):
    text=str(text)
    if re.search(r'\b(?:(?:more|additional|related)\s+(?:youtube\s+)?videos?|(?:watch|play|find|show|recommend)\b.{0,30}\b(?:videos?|youtube))\b',text,re.I):return 'media'
    if re.search(r'\b(?:more|additional) sources\b',text,re.I):return 'sources'
    return 'reader'

def conversational_mode(arguments, context):
    if arguments.get('mode')!='detailed':return 'quick'
    if context.get('requested_research'):return 'detailed'
    brief=context.get('user_text') or context.get('research_user_text','')
    extensive=re.search(r'\b(deep|detailed|extensive|exhaustive|comprehensive|in.depth|research report|investigate|investigation|compare.{0,30}(sources|studies))\b',brief,re.I)
    substantive=len(brief)>120 and re.search(r'\b(research|report|analysis|compare|investigate)\b',brief,re.I)
    return 'detailed' if extensive or substantive else 'quick'

def conversation_topic(query, topic=''):
    subject=topic.strip()[:90] or query.strip()[:90]
    if re.search(r'\b(football|soccer|premier league|la liga|champions league|world cup|f[uú]tbol)\b',subject,re.I):return 'football'
    return ' '.join(re.findall(r'[^\W_]+',subject.casefold(),re.U))[:90]

def topic_identity(context, query, topic='', stamp=None):
    day=datetime.fromtimestamp(stamp or time.time(),timezone.utc).date().isoformat()
    subject=conversation_topic(query,topic)
    # Topic reuse never crosses owner, project, guest, or originating conversation.
    from .research_learning import scope
    return stable('quick-topic',scope(context),context.get('session_id',''),day,subject),subject
