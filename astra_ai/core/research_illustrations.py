"""Bounded, checkpointed image discovery. Descriptions are never claim evidence."""
import asyncio, io, re, hashlib, time
from .research_learning import scope
from urllib.parse import urlsplit, urljoin
from PIL import Image
from urllib3.exceptions import HTTPError
from astra_ai.memory.shared_memory import stable, safe

IMAGE_VERSION=4
MAX_IMAGES=24
TARGET_IMAGES=5


def useful_image(row):
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


async def prepare_images(search, identifier, context, sources, query):
    artifacts=search.artifacts
    metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
    if metadata.get('images_prepared') and metadata.get('image_enrichment_version')==IMAGE_VERSION:
        verified=[r for r in (metadata.get('validated_images') or metadata.get('selected_images',[])) if useful_image(r)]
        if verified:
            return verified
        return []
    candidates=list(metadata.get("image_candidates",[]));seen={r["url"] for r in candidates};wanted=terms(query)
    for index,source in enumerate(sources):
        for image in source.get('images',[])[:30]:
            url=str(image.get('url',''));caption=safe(str(image.get('caption') or source['title']))[:300]
            if url in seen or not url.startswith(('https://','http://')):continue
            if not useful_image({'url':url,'caption':caption}):continue
            seen.add(url)
            score=len(wanted & terms(caption+' '+source['title']))
            if not score:continue
            candidates.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':caption,'source_id':'S'+str(index+1),'publication':urlsplit(source['url']).hostname,'source_url':source['url'],'score':score})

    attempted=set();selected=[];hashes=set()
    for image in metadata.get('validated_images',[]):
        if not useful_image(image):continue
        selected.append(image);attempted.add(image['url'])
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
                if digest in hashes or any(r['url']==row['url'] for r in selected):continue
                hashes.add(digest);selected.append({**row,'width':width,'height':height,'layout':'wide' if width/height>1.8 else 'aside'})
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
                    if score and row['url'] not in seen:
                        seen.add(row['url']);result.append({**row,'score':score})
                return result
            except (ValueError,OSError,RuntimeError,HTTPError):return []
        groups=await asyncio.gather(*(page_images(i,source) for i,source in enumerate(sources[:8])))
        candidates.extend(r for group in groups for r in group)
        await asyncio.to_thread(artifacts.request_state,identifier,context,image_candidates=candidates,image_pages_checked=True,image_pages_version=IMAGE_VERSION)
        selected=await validate(candidates)
    if len(selected)<3 and not metadata.get('image_search_attempted'):
        key=search.key_provider('SERPAPI_KEY')
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
    await asyncio.to_thread(artifacts.request_state,identifier,context,selected_images=selected,validated_images=selected,images_prepared=True,image_enrichment_version=IMAGE_VERSION,image_candidates=[])
    return selected


def place_images(images, report):
    """Choose an evidence-adjacent passage; never scatter images arbitrarily."""
    # Markdown allows a paragraph immediately after a heading without a blank line.
    passages=re.sub(r'(?m)^(#{1,6}[^\n]*\n)',r'\1\n',report)
    blocks=[b for b in re.split(r'\n\s*\n',passages) if not b.startswith(('#','```','~~~','|'))]
    result=[]
    for image in images:
        candidates=[b for b in blocks if re.search(r'\[(?:S\d+\s*[,;]\s*)*'+re.escape(image['source_id'])+r'(?:\s*[,;]\s*S\d+)*\]',b)]
        if not candidates:candidates=[b for b in blocks if len(terms(image['caption']) & terms(b))>=2]
        if not candidates:continue
        block=max(candidates,key=lambda b:(len(terms(image['caption']) & terms(b)), -len(b)))
        from markdown_it import MarkdownIt
        from bs4 import BeautifulSoup
        plain=BeautifulSoup(MarkdownIt().render(block),'html.parser').get_text(' ',strip=True)
        result.append({**image,'placement_text':re.sub(r'\[S\d+(?:\s*[,;]\s*S\d+)*\]', '',plain).strip()[:90]})
    return result
