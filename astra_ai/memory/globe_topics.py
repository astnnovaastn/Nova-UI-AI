"""Scoped, evidenced presentation groups; never generate collections from words.

The registry and organizer own classification. This projection preserves stored
IDs and only intersects their explicit membership with accessible records.
"""
from .shared_memory import normal

# Compatibility default for older callers; stored groups are not truncated.
MAX_AUTO_TOPICS=100

def topics(records,stored,limit=MAX_AUTO_TOPICS):
    groups=[]
    for tid,topic in sorted(stored.items()):
        if topic.get('state')!='active':continue
        members=sorted(set(topic.get('member_ids',[]))&records.keys())
        if len(members)<2:continue
        groups.append({'id':'topic:'+tid,'label':topic.get('label',tid),
                       'member_ids':members,'description':'Source-backed presentation group; membership is not a factual relationship',
                       'visual_only':True})
    return groups
