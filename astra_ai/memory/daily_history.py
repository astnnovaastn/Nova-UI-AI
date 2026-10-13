"""Daily presentation of scoped transcripts; original sessions are never rewritten."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from .globe_projection import projection

MADRID = ZoneInfo('Europe/Madrid')

def conversation_day(timestamp):
    try:
        date=datetime.fromisoformat(str(timestamp).replace('Z','+00:00'))
        if date.tzinfo is None:date=date.replace(tzinfo=MADRID)
        return (date.astimezone(MADRID)-timedelta(hours=4)).date().isoformat()
    except (ValueError,TypeError,OverflowError):return 'undated'

def history(manager, profile_id='', project_id='', day='', session_id='', query='', limit=20, offset=0):
    snapshot=projection(manager,profile_id,project_id)
    groups={}
    for record in snapshot['records'].values():
        attrs=record.get('attributes',{})
        if not attrs.get('transcript'):continue
        date=attrs.get('original_date',record.get('created',''))
        row={**record,'timestamp':date,'role':attrs.get('speaker'),'content':record.get('content','')}
        groups.setdefault(conversation_day(date),[]).append(row)
    def order(row):
        try:
            date=datetime.fromisoformat(str(row['timestamp']).replace('Z','+00:00'))
            if date.tzinfo is None:date=date.replace(tzinfo=MADRID)
            return (date.timestamp(),row['id'])
        except (ValueError,TypeError,OverflowError):return (0,row['id'])
    for rows in groups.values():rows.sort(key=order)
    if session_id and not day:
        matching=[key for key,rows in groups.items() if any(r.get('session_id')==session_id for r in rows)]
        day=max(matching) if matching else 'missing'
    offset=max(0,int(offset));limit=min(50,max(1,int(limit)))
    if day:
        rows=groups.get(day,[]);sessions=list(dict.fromkeys(r.get('session_id','legacy-history') for r in rows))
        return {'status':'ok','revision':snapshot['revision'],'day':day,'messages':rows[offset:offset+limit],'total':len(rows),'session_ids':sessions,'continue_session':sessions[-1] if sessions else ''}
    days=[]
    for key,rows in groups.items():
        if query and not any(query.casefold() in r['content'].casefold() for r in rows):continue
        days.append({'day':key,'count':len(rows),'session_count':len({r.get('session_id') for r in rows}),'updated':rows[-1]['timestamp'],'preview':rows[0]['content'][:180]})
    days.sort(key=lambda r:r['day'],reverse=True)
    return {'status':'ok','revision':snapshot['revision'],'days':days[offset:offset+limit],'total':len(days),'timezone':'Europe/Madrid','day_boundary_hour':4}
