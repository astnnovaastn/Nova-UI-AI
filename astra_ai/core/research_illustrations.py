"""Bounded, checkpointed image discovery. Descriptions are never claim evidence."""
import asyncio, io, re, hashlib, time
from .research_learning import scope,display_title
from urllib.parse import urlsplit, urljoin
from PIL import Image,ImageStat,ImageOps
from urllib3.exceptions import HTTPError
from astra_ai.memory.shared_memory import stable, safe

IMAGE_VERSION=5
MAX_IMAGES=6
TARGET_IMAGES=4

def report_image_limit(report,query=''):
    """A few illustrations, with a small allowance for substantial long reports."""
    numbers={'one':1,'two':2,'three':3,'four':4,'five':5,'six':6}
    number=r'(?:[1-6]|one|two|three|four|five|six)'
    requested=re.search(r'\b('+number+r')(?:\s*(?:to|or|[-\u2013])\s*('+number+r'))?\s+(?:(?:relevant|technical|supporting)\s+){0,3}images?\b',query,re.I)
    if requested:
        value=(requested[2] or requested[1]).lower()
        return numbers[value] if value in numbers else int(value)
    return 6 if len(report)>18000 else 4

def image_fingerprint(body):
    with Image.open(io.BytesIO(body)) as original:
        image=ImageOps.exif_transpose(original).convert('RGB')
        small=image.resize((9,8),Image.Resampling.LANCZOS).convert('L')
        pixels=list(small.tobytes());bits=0
        for row in range(8):
            for column in range(8):bits=(bits<<1)|int(pixels[row*9+column]>pixels[row*9+column+1])
        return {'visual_hash':format(bits,'016x'),'visual_color':[round(n) for n in ImageStat.Stat(image.resize((16,16))).mean]}

def same_picture(first,second):
    if first.get('content_hash') and first.get('content_hash')==second.get('content_hash'):return True
    if not all(row.get('visual_hash') and row.get('visual_color') for row in (first,second)):return False
    if abs(first['width']/first['height']-second['width']/second['height'])>.08:return False
    return (int(first['visual_hash'],16)^int(second['visual_hash'],16)).bit_count()<=4 and max(abs(a-b) for a,b in zip(first['visual_color'],second['visual_color']))<=5


def useful_image(row):
    if re.search(r'\b(?:official white svgs|partnership card)\b',str(row.get('caption','')),re.I):return False
    return not re.search(r'(?:logo|favicon|avatar|sprite|tracking|banner-ad|\.svg(?:\?|$)|\.gif(?:\?|$))',str(row.get('url','')),re.I) and not re.search(r'\b(?:add (?:us )?as (?:a )?preferred source|follow us|subscribe|newsletter|cookie consent|sign in|advertisement)\b',str(row.get('caption','')),re.I)


def page_candidates(body, final_url, source, identifier, source_id):
    """Read actual article image URLs, including lazy pictures and high-resolution srcsets."""
    from bs4 import BeautifulSoup
    page=BeautifulSoup(body,'html.parser') if isinstance(body,(str,bytes)) else body
    for node in page.select('nav,header,footer,aside,[role="navigation"],script,style'):node.decompose()
    root=page.find('article') or page.find('main') or page
    found=[]
    def address(image):
        sets=image.get('data-srcset') or image.get('srcset') or ''
        picture=image.find_parent('picture')
        if not sets and picture:
            variant=picture.find('source',srcset=True)
            if variant:sets=variant['srcset']
        if sets:
            variants=[]
            for part in sets.split(','):
                bits=part.strip().split()
                if bits and bits[0].startswith(('http','/')):
                    try:rank=float(bits[1].rstrip('wx')) if len(bits)>1 else 1
                    except ValueError:rank=1
                    variants.append((rank,bits[0]))
            if variants:return max(variants)[1]
        return image.get('data-original') or image.get('data-src') or image.get('data-lazy-src') or image.get('src')
    for image in root.find_all('img')[:80]:
        url=address(image)
        if url:
            figure=image.find_parent('figure');caption=figure.find('figcaption') if figure else None
            found.append((url,image.get('alt') or (caption.get_text(' ',strip=True) if caption else '') or source['title'],image))
    for meta in page.select('meta[property="og:image"],meta[name="twitter:image"]')[:2]:
        if meta.get('content'):found.append((meta['content'],source['title'],None))
    rows=[];seen=set()
    for address,caption,node in found:
        url=urljoin(final_url,address)
        if url in seen or not url.startswith(('https://','http://')) or not useful_image({'url':url,'caption':caption}):continue
        seen.add(url)
        rows.append(({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':safe(str(caption))[:300],'source_id':source_id,'publication':urlsplit(source['url']).hostname,'source_url':source['url']},node))
    return rows


def terms(text):
    words=set(re.findall(r'[\w]{2,}',text.casefold()))-{'the','and','with','for','research','about','what','image','images','this','that','from','information','can','could','would','you','new','find','search','please','need','want','have','will','which','biggest','bigger','biger','most','run'}
    return {word[:-1] if len(word)>4 and word.endswith('s') else word for word in words}

def relevant_candidate(row,query):
    """A page's subject must not lend relevance to unrelated recommendation images."""
    query=display_title(query)
    wanted={t for t in terms(query) if not t.isdigit()}-{'ai','company','model','latest','current','available','capable','comparison','compare','detail','detailed','report','as','its','in','on','at','to','of','an','by','be','is','are','it','or','not','more','other'}
    if re.search(r'\bcover\b',row.get('caption',''),re.I) and not wanted & terms(row.get('caption','')):return False
    host=urlsplit(row.get('source_url','')).hostname or ''
    return not wanted or bool(wanted & (terms(row.get('caption','')) | terms(host.replace('.',' '))))


async def prepare_images(search, identifier, context, sources, query):
    artifacts=search.artifacts
    metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
    evidence_key=hashlib.sha256(repr([(source.get('url'),source.get('images',[])) for source in sources]).encode()).hexdigest()
    if metadata.get('images_prepared') and metadata.get('image_enrichment_version')==IMAGE_VERSION:
        verified=[r for r in (metadata.get('validated_images') or metadata.get('selected_images',[])) if useful_image(r) and relevant_candidate(r,query)]
        if verified:
            return verified
        # An empty result prepared before collection must not hide later evidence.
        if metadata.get('image_evidence_key')==evidence_key:return []
    candidates=list(metadata.get("image_candidates",[]));seen={r["url"] for r in candidates};wanted=terms(query)
    for index,source in enumerate(sources):
        for image in source.get('images',[])[:30]:
            url=str(image.get('url',''));caption=safe(str(image.get('caption') or source['title']))[:300]
            if url in seen or not url.startswith(('https://','http://')):continue
            if not useful_image({'url':url,'caption':caption}) or not relevant_candidate({'caption':caption,'source_url':source['url']},query):continue
            seen.add(url)
            score=len(wanted & terms(caption+' '+source['title']))
            if not score:continue
            candidates.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':caption,'source_id':'S'+str(index+1),'publication':urlsplit(source['url']).hostname,'source_url':source['url'],'score':score})

    candidates=[row for row in candidates if relevant_candidate(row,query)]
    candidates.extend(row for row in metadata.get('validated_images',[]) if row.get('url') not in seen and useful_image(row) and relevant_candidate(row,query))
    attempted=set();selected=[];hashes=set()
    async def validate(rows):
        async def one(row):
            if row['url'] in attempted:return None
            attempted.add(row['url'])
            try:
                async with search.network:
                    body,mime,_=await asyncio.to_thread(artifacts._fetch_public_source,row['url'],True)
                if len(body)>8_000_000:return None
                def dimensions():
                    with artifacts.image_worker,Image.open(io.BytesIO(body)) as image:
                        width,height=image.size
                        if min(width,height)<160 or max(width,height)<320 or width*height>20_000_000 or getattr(image,'n_frames',1)>1:raise ValueError('unsuitable_image')
                        image.verify();return width,height
                width,height=await asyncio.to_thread(dimensions)
                return row,body,mime,width,height
            except (ValueError,OSError,RuntimeError,HTTPError,Image.DecompressionBombError):return None
        # Round-robin source hosts so one page's decorations cannot consume the whole attempt budget.
        groups={}
        for row in sorted(rows,key=lambda r:r.get('score',0),reverse=True):groups.setdefault(row['source_id'],[]).append(row)
        ordered=[]
        while any(groups.values()) and len(ordered)<48:
            for group in groups.values():
                if group:ordered.append(group.pop(0))
        for start in range(0,len(ordered),4):
            if len(selected)>=MAX_IMAGES:break
            results=await asyncio.gather(*(one(row) for row in ordered[start:start+4]))
            for result in results:
                if not result:continue
                row,body,mime,width,height=result;digest=hashlib.sha256(body).hexdigest()
                def signature():
                    with artifacts.image_worker:return image_fingerprint(body)
                candidate={**row,'width':width,'height':height,'content_hash':digest,**await asyncio.to_thread(signature),'layout':'wide' if width/height>1.8 else 'aside'}
                if digest in hashes or any(r['url']==row['url'] or same_picture(candidate,r) for r in selected):continue
                hashes.add(digest);selected.append(candidate)
                artifacts.reader_cache[(stable(scope(context),identifier),'image',row['id'])]=(time.time(),(body,mime))
                while len(artifacts.reader_cache)>64 or sum(len(v[1][0]) for v in artifacts.reader_cache.values())>16_000_000:artifacts.reader_cache.pop(next(iter(artifacts.reader_cache)))
                if len(selected)>=MAX_IMAGES:break
        return selected

    selected=await validate(candidates)
    if len(selected)<TARGET_IMAGES and metadata.get('image_pages_version')!=IMAGE_VERSION:
        async def page_images(index,source):
            if not source.get('url','').startswith(('https://','http://')):return []
            try:
                async with search.network:body,mime,final=await asyncio.to_thread(artifacts._fetch_public_source,source['url'])
                if mime!='text/html':return []
                result=[]
                for row,_ in page_candidates(body,final,source,identifier,'S'+str(index+1)):
                    score=len(wanted & terms(row['caption']+' '+source['title']))
                    if score and row['url'] not in seen and relevant_candidate(row,query):
                        seen.add(row['url']);result.append({**row,'score':score})
                return result
            except (ValueError,OSError,RuntimeError,HTTPError):return []
        groups=await asyncio.gather(*(page_images(i,source) for i,source in enumerate(sources[:8])))
        candidates.extend(r for group in groups for r in group)
        await asyncio.to_thread(artifacts.request_state,identifier,context,image_candidates=candidates,image_pages_checked=True,image_pages_version=IMAGE_VERSION)
        selected=await validate(candidates)
    if len(selected)<3 and not metadata.get('image_search_attempted'):
        from .research_topics import search_key
        key=search_key(search.key_provider,'quick')
        if key:
            await asyncio.to_thread(artifacts.request_state,identifier,context,image_search_attempted=True)
            def discover():
                try:
                    response=search.transport.get('https://serpapi.com/search.json',params={'engine':'google_images','q':query[:300],'api_key':key,'safe':'active'},timeout=25)
                    if response.status_code!=200:return []
                    return response.json().get('images_results',[])[:24]
                except Exception:return []
            async with search.network:rows=await asyncio.to_thread(discover)
            for image in rows:
                url=str(image.get('original',''));page=str(image.get('link',''));caption=safe(str(image.get('title','')))[:300]
                score=len(wanted & terms(caption))
                if not score or not useful_image({'url':url,'caption':caption}) or image.get('unsafe') or not page.startswith(('http://','https://')):continue
                candidates.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':caption,'source_id':'P'+stable(page)[:24],'publication':urlsplit(page).hostname,'source_url':page,'score':score})
            await asyncio.to_thread(artifacts.request_state,identifier,context,image_candidates=candidates)
            selected=await validate(candidates)
    retained={row['id']:row for row in metadata.get('image_archive',[])}
    current_ids={row['id'] for row in selected}
    for row in metadata.get('validated_images',[]) or metadata.get('selected_images',[]):
        if row['id'] not in current_ids:retained[row['id']]={**row,'source_only':True}
    await asyncio.to_thread(artifacts.request_state,identifier,context,selected_images=selected,validated_images=selected,image_archive=list(retained.values()),images_prepared=True,image_enrichment_version=IMAGE_VERSION,image_evidence_key=evidence_key,image_candidates=[])
    return selected


def place_images(images, report, query=''):
    """Choose an evidence-adjacent passage; never scatter images arbitrarily."""
    from markdown_it import MarkdownIt
    from bs4 import BeautifulSoup
    document=BeautifulSoup(MarkdownIt().enable('table').render(report),'html.parser')
    nodes=[node for node in document.find_all(['p','li']) if not node.find_parent(['table','blockquote','pre']) and (node.name=='li' and not node.find('li') or node.name=='p' and not node.find_parent('li'))]
    blocks=[node.get_text(' ',strip=True) for node in nodes]
    contexts={}
    for node,block in zip(nodes,blocks):
        heading=node.find_previous(['h1','h2','h3','h4','h5','h6'])
        contexts[block]=(heading.get_text(' ',strip=True)+' ' if heading else '')+block
    result=[];counts={}
    def products(text):
        found=set()
        for brand,pattern in [('apple',r'\b(?:apple|iphone)\b'),('samsung',r'\b(?:samsung|galaxy)\b'),('google',r'\b(?:google|pixel)\b'),('honor',r'\bhonor\b'),('xiaomi',r'\bxiaomi\b'),('oneplus',r'\boneplus\b'),('zte',r'\b(?:zte|redmagic)\b')]:
            if re.search(pattern,text,re.I):found.add(brand)
        for family,number in re.findall(r'\b(iphone|pixel|galaxy\s*s)\s*(\d+)\b',text,re.I):found.add(re.sub(r'\s','',family.lower())+number)
        for shape in ('fold','flip'):
            if re.search(r'\b'+shape+r'\b',text,re.I):found.add(shape)
        return found
    headline=document.find('h1')
    subjects=products(headline.get_text(' ',strip=True)) if headline else set()
    for image in images:
        if len(result)>=report_image_limit(report,query):break
        if not useful_image(image):continue
        if re.search(r'\b(?:book cover|inside preview)\b',image['caption'],re.I) and not re.search(r'\b(?:books?|publishing)\b',report,re.I):continue
        if any(same_picture(image,old) or image['id']==old['id'] for old in result):continue
        identities=products(image['caption'])
        if subjects and identities and not identities<=subjects:continue
        if not identities and re.search(r'\b(?:iphone|galaxy|pixel)\b',report,re.I) and re.search(r'\bphone\b',image['caption'],re.I):continue
        eligible=[b for b in blocks if counts.get(b,0)<3 and (not identities or identities<=products(contexts[b]))]
        def associated(block):return bool(re.search(r'\[(?:S\d+\s*[,;]\s*)*'+re.escape(image['source_id'])+r'(?:\s*[,;]\s*S\d+)*\]',block))
        candidates=[b for b in eligible if associated(b) or len(terms(image['caption']) & terms(contexts[b]))>=2]
        if not candidates:continue
        block=max(candidates,key=lambda b:(len(terms(image['caption']) & terms(contexts[b]))*3+2*associated(b)-counts.get(b,0), -len(b)))
        counts[block]=counts.get(block,0)+1
        result.append({**image,'placement_text':re.sub(r'\[S\d+(?:\s*[,;]\s*S\d+)*\]', '',block).strip()[:90]})
    return result
