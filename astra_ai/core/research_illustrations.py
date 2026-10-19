"""Bounded, checkpointed image discovery. Descriptions are never claim evidence."""
import asyncio, io, re, hashlib, time
from .research_learning import scope
from urllib.parse import urlsplit, urljoin
from PIL import Image
from astra_ai.memory.shared_memory import stable, safe


def terms(text):
    words=set(re.findall(r'[\w]{2,}',text.casefold()))-{'the','and','with','for','research','about','what','image','images','this','that','from','information','can','could','would','you','new','find','search','please','need','want','have','will','which','biggest','bigger','biger','most','run'}
    return {word[:-1] if len(word)>4 and word.endswith('s') else word for word in words}


async def prepare_images(search, identifier, context, sources, query):
    artifacts=search.artifacts
    metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
    if metadata.get('images_prepared'):
        verified=metadata.get('validated_images') or metadata.get('selected_images',[])
        if verified:
            await asyncio.to_thread(artifacts.request_state,identifier,context,validated_images=verified,image_enrichment_version=3)
            return verified
        if metadata.get('image_enrichment_version')==3:return []
    candidates=list(metadata.get("image_candidates",[]));seen={r["url"] for r in candidates};wanted=terms(query)
    for index,source in enumerate(sources):
        for image in source.get('images',[])[:8]:
            url=str(image.get('url',''));caption=safe(str(image.get('caption') or source['title']))[:300]
            if url in seen or not url.startswith(('https://','http://')):continue
            if re.search(r'(?:logo|favicon|avatar|sprite|tracking|banner-ad)',url,re.I):continue
            seen.add(url)
            score=len(wanted & terms(caption+' '+source['title']))
            if not score:continue
            candidates.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':caption,'source_id':'S'+str(index+1),'publication':urlsplit(source['url']).hostname,'source_url':source['url'],'score':score})

    attempted=set()
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
                        if min(width,height)<240 or max(width,height)<480 or width*height>20_000_000 or getattr(image,'n_frames',1)>1:raise ValueError('unsuitable_image')
                        image.verify();return width,height
                width,height=await asyncio.to_thread(dimensions)
                return row,body,mime,width,height
            except (ValueError,OSError,RuntimeError,Image.DecompressionBombError):return None
        results=await asyncio.gather(*(one(row) for row in sorted(rows,key=lambda r:r['score'],reverse=True)[:8]))
        selected=[];hashes=set()
        for result in results:
            if not result:continue
            row,body,mime,width,height=result;digest=hashlib.sha256(body).hexdigest()
            if digest in hashes:continue
            hashes.add(digest);selected.append({**row,'width':width,'height':height,'layout':'wide' if width/height>1.8 else 'aside'})
            artifacts.reader_cache[(stable(scope(context),identifier),'image',row['id'])]=(time.time(),(body,mime))
            while len(artifacts.reader_cache)>64 or sum(len(v[1][0]) for v in artifacts.reader_cache.values())>16_000_000:artifacts.reader_cache.pop(next(iter(artifacts.reader_cache)))
            if len(selected)==4:break
        return selected

    selected=await validate(candidates)
    if not selected and not metadata.get('image_pages_checked'):
        await asyncio.to_thread(artifacts.request_state,identifier,context,image_pages_checked=True)
        async def page_images(index,source):
            if not source.get('url','').startswith(('https://','http://')):return []
            try:
                async with search.network:body,mime,final=await asyncio.to_thread(artifacts._fetch_public_source,source['url'])
                if mime!='text/html':return []
                from bs4 import BeautifulSoup
                page=BeautifulSoup(body,'html.parser');root=page.find('article') or page.find('main') or page
                found=[];og=page.find('meta',property='og:image')
                if og and og.get('content'):found.append((og['content'],source['title']))
                for image in root.find_all('img')[:12]:
                    address=image.get('data-src') or image.get('src');caption=image.get('alt') or source['title']
                    if address:found.append((address,caption))
                result=[]
                for address,caption in found:
                    url=urljoin(final,address);score=len(wanted & terms(caption+' '+source['title']))
                    if not score or url in seen or re.search(r'(logo|favicon|avatar|sprite|tracking|\.svg(?:\?|$)|\.gif(?:\?|$))',url,re.I):continue
                    seen.add(url);result.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':safe(caption)[:300],'source_id':'S'+str(index+1),'publication':urlsplit(source['url']).hostname,'source_url':source['url'],'score':score})
                return result
            except (ValueError,OSError,RuntimeError):return []
        groups=await asyncio.gather(*(page_images(i,source) for i,source in enumerate(sources[:2])))
        candidates.extend(r for group in groups for r in group)
        await asyncio.to_thread(artifacts.request_state,identifier,context,image_candidates=candidates)
        selected=await validate(candidates)
    if not selected and not metadata.get('image_search_attempted'):
        key=search.key_provider('SERPAPI_KEY')
        if key:
            await asyncio.to_thread(artifacts.request_state,identifier,context,image_search_attempted=True)
            def discover():
                try:
                    response=search.transport.get('https://serpapi.com/search.json',params={'engine':'google_images','q':query[:300],'api_key':key,'safe':'active'},timeout=25)
                    if response.status_code!=200:return []
                    return response.json().get('images_results',[])[:12]
                except Exception:return []
            async with search.network:rows=await asyncio.to_thread(discover)
            for image in rows:
                url=str(image.get('original',''));page=str(image.get('link',''));caption=safe(str(image.get('title','')))[:300]
                score=len(wanted & terms(caption))
                if not score or image.get('unsafe') or not page.startswith(('http://','https://')):continue
                candidates.append({'id':'I'+stable(identifier,url)[:24],'url':url,'caption':caption,'source_id':'P'+stable(page)[:24],'publication':urlsplit(page).hostname,'source_url':page,'score':score})
            await asyncio.to_thread(artifacts.request_state,identifier,context,image_candidates=candidates)
            selected=await validate(candidates)
    await asyncio.to_thread(artifacts.request_state,identifier,context,selected_images=selected,validated_images=selected,images_prepared=True,image_enrichment_version=3,image_candidates=[])
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
