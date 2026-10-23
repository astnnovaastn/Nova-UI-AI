"""Scoped document attachments and versioned PDF edits for Research artifacts.

Original bytes are immutable. Extracted bodies live outside the history store.
All callers must supply the server-resolved owner/project context.
"""
import copy, hashlib, io, json, re, zipfile, os, threading
from pathlib import Path
from .research_learning import display_title, reader_text, scope
from astra_ai.memory.shared_memory import atomic, read, stable, now, StorageLock

MAX_FILE=25*1024*1024
PDF_MIME='application/pdf'
DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
PPTX_MIME='application/vnd.openxmlformats-officedocument.presentationml.presentation'
PDF_LOCK=threading.RLock() # PDFium is not thread-safe, including read-only native operations.

def export_illustrations(artifacts,identifier,context,soup,document,draft=False):
    """Only materialize validated scoped images, never arbitrary draft URLs."""
    if not draft:
        for image in [*document.get('image_items',[]),*document.get('attachment_images',[])][:4]:
            source_id=image.get('source_id','')
            target=next((p for p in soup.find_all(['p','li']) if source_id and '['+source_id+']' in p.get_text()),None)
            if not target:continue
            tag=soup.new_tag('img',src=image.get('url') or f'/api/research/{identifier}/images/{image["id"]}',alt=image.get('caption',''))
            target.insert_before(tag)
    images={}
    for index,image in enumerate(soup.find_all('img')):
        if index>=4:image.decompose();continue
        src=image.get('src','')
        attachment=re.fullmatch(r'/api/research/([a-f0-9]{32})/attachments/([a-f0-9]{32})/images/(A[a-f0-9]{24})',src)
        research=re.fullmatch(r'/api/research/([a-f0-9]{32})/images/(I[a-f0-9]{24})',src)
        try:
            if attachment:body,_=DocumentFiles(artifacts).image(attachment[1],context,attachment[2],attachment[3])
            elif research:body,_=artifacts.image_bytes(research[1],context,research[2])
            else:image.decompose();continue
            images[str(index)]=body;image['data-export-image']=str(index)
        except (ValueError,OSError,RuntimeError):image.decompose()
    return images

def create_entry(artifacts, context, kind, brief, operation_id, source_research_id=''):
    if context.get('guest'):return {'status':'rejected','reason':'owner_required'}
    reserved=artifacts.reserve(brief or ('New chat' if kind=='chat' else 'New documentary'),'detailed',context,operation_id,kind,source_research_id)
    if reserved['status']!='ok':return reserved
    if kind=='chat':
        artifacts.request_state(reserved['id'],context,phase='complete',origin_text='')
        artifacts.save(reserved['query'],'detailed','',[],[],context,operation_id)
    elif kind=='documentary' and reserved['phase']=='queued' and not reserved.get('job_id'):
        sources=[]
        if source_research_id:
            parent=artifacts.get(source_research_id,context)['artifact']
            sources=[{**s,'origin_research_id':source_research_id,**({'attachment_origin_id':s.get('attachment_origin_id') or s.get('origin_research_id') or source_research_id} if s.get('attachment_id') else {})} for s in artifacts.source_catalog(parent)]
        artifacts.request_state(reserved['id'],context,phase='draft',sources=sources,origin_text=context.get('user_text') or (brief if brief!='New documentary' else ''))
    return {'status':'completed','research_id':reserved['id'],'thread_id':reserved['thread_id']}

async def compose_documentary(artifacts, search, model, context, identifier):
    import asyncio,time
    from .background_budget import BudgetPaused
    from astra_ai.memory.shared_memory import stable
    key=stable('documentary',scope(context),identifier)
    async with search.operation_locks.setdefault(key,asyncio.Lock()):
        metadata=await asyncio.to_thread(artifacts.request_state,identifier,context)
        if metadata.get('kind')!='documentary':return {'status':'rejected','reason':'documentary_required'}
        existing=await asyncio.to_thread(artifacts.get,identifier,context)
        if existing['status']!='ok':return existing
        if existing['artifact']['completeness'] not in {'pending','failed'}:return artifacts.brief(existing['artifact'])
        files=await asyncio.to_thread(DocumentFiles(artifacts).listing,identifier,context)
        if any(f['status'] in {'queued','processing'} for f in files):return {'status':'waiting_for_retry','next_attempt':time.time()+2,'reason':'processing_attachments','research_id':identifier}
        sources=await asyncio.to_thread(artifacts.source_catalog,existing['artifact'])
        if files and not sources:
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='failed',waiting_reason='No readable source text was found. Open the original in Assets; image-only documents need OCR before evidence-based writing.')
            return {'status':'failed','reason':'uploaded_document_has_no_native_text','research_id':identifier}
        if sources and not metadata.get('freshness_checked') and re.search(r'\b(latest|today|current|up.to.date|recent|updated)\b',metadata['query'],re.I):
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='collecting_sources')
            async with search.network:rows,error=await asyncio.to_thread(search._request,display_title(metadata['query']),'detailed',8)
            if error:
                await asyncio.to_thread(artifacts.request_state,identifier,context,phase='failed',waiting_reason='Fresh evidence unavailable: '+error['reason'])
                return {'status':'failed','reason':'fresh_evidence_unavailable','research_id':identifier}
            seen={s['url'] for s in sources};sources=[*sources,*[s for s in rows if s['url'] not in seen]]
            await asyncio.to_thread(artifacts.request_state,identifier,context,sources=sources,freshness_checked=True)
        if not sources:
            if metadata.get('outbound_started'):return {'status':'unconfirmed','reason':'reconcile_document_search_before_retry','research_id':identifier}
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='collecting_sources',outbound_started=True)
            async with search.network:rows,error=await asyncio.to_thread(search._request,display_title(metadata['query']),'detailed',8)
            if error:
                await asyncio.to_thread(artifacts.request_state,identifier,context,phase='failed',waiting_reason=error['reason'])
                return {'status':'failed','reason':error['reason'],'research_id':identifier}
            sources=rows
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='comparing_evidence',sources=sources,freshness_checked=True)
        # Resolve relevant page passages from immutable extraction files, never job arguments.
        evidence=copy.deepcopy(sources)
        for source in evidence:
            if source.get('attachment_id'):
                page=await asyncio.to_thread(DocumentFiles(artifacts).page,source.get('attachment_origin_id') or source.get('origin_research_id') or identifier,context,source['attachment_id'],source.get('page',1),'',0,8000)
                source['content']=page.get('text',source.get('content',''))
        await asyncio.to_thread(artifacts.request_state,identifier,context,phase='preparing_report')
        try:
            if not model:raise ValueError('background_model_unavailable')
            report=await model.report(metadata['query'],evidence,kind='documentary')
        except BudgetPaused as error:
            until=max(time.time()+5,error.until)
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='waiting_for_quota',next_attempt=until,waiting_reason=error.reason)
            return {'status':'waiting_for_quota','reason':error.reason,'next_attempt':until,'research_id':identifier}
        except Exception:
            await asyncio.to_thread(artifacts.request_state,identifier,context,phase='failed',waiting_reason='document_synthesis_unavailable')
            return {'status':'failed','reason':'document_synthesis_unavailable','research_id':identifier}
        title=re.search(r'^# (.+)',report,re.M)
        await asyncio.to_thread(artifacts.request_state,identifier,context,phase='complete',display_title=display_title(title[1] if title else metadata['query']),next_attempt=None)
        item=await asyncio.to_thread(artifacts.save,metadata['query'],'detailed',report,sources,[],context,metadata['operation_id'])
        return artifacts.brief(item)

class DocumentFiles:
    def __init__(self, artifacts):
        self.artifacts=artifacts
        self.root=(artifacts.path.parent/'attachments').resolve()
        # Scoped IDs plus revision hashes exceed legacy Windows MAX_PATH in OneDrive.
        if os.name=='nt' and not str(self.root).startswith('\\\\?\\'):
            self.root=Path('\\\\?\\'+str(self.root))

    def require(self, identifier, context):
        result=self.artifacts.get(identifier,context)
        if context.get('guest') or result['status']!='ok':raise ValueError('document_unavailable')
        return result['artifact']

    def folder(self, identifier, file_id):
        if not re.fullmatch(r'[0-9a-f]{32}',identifier) or not re.fullmatch(r'[0-9a-f]{32}',file_id):raise ValueError('invalid_attachment_id')
        if self.artifacts.repository:return self.artifacts.repository.asset_folder(identifier,file_id)
        target=(self.root/identifier/file_id).resolve()
        if not target.is_relative_to(self.root.resolve()):raise ValueError('invalid_attachment_path')
        return target

    def listing(self, identifier, context):
        self.require(identifier,context)
        with self.artifacts.lock:return copy.deepcopy(self.artifacts.snapshot().get('attachments',{}).get(identifier,[]))

    def update(self, identifier, context, file_id, **changes):
        self.require(identifier,context)
        with self.artifacts.lock:
            data=self.artifacts.read({})
            row=next((r for r in data.get('attachments',{}).get(identifier,[]) if r['id']==file_id),None)
            if not row:raise ValueError('attachment_unavailable')
            row.update(changes,updated=now());self.artifacts.write(data)
            return copy.deepcopy(row)

    def get(self, identifier, context, file_id):
        return next((r for r in self.listing(identifier,context) if r['id']==file_id),None)

    @staticmethod
    def identify(name, body):
        suffix=Path(name).suffix.lower()
        if body.startswith(b'%PDF-'):return PDF_MIME
        if body.startswith(b'PK') and suffix in {'.docx','.pptx'}:
            with zipfile.ZipFile(io.BytesIO(body)) as archive:
                entries=archive.infolist()
                if len(entries)>5000 or sum(f.file_size for f in entries)>100*1024*1024 or any(f.file_size>max(1,f.compress_size)*1000 for f in entries):raise ValueError('document_archive_too_large')
                if not {'[Content_Types].xml','ppt/presentation.xml' if suffix=='.pptx' else 'word/document.xml'}<=set(archive.namelist()):raise ValueError('invalid_office_document')
            return PPTX_MIME if suffix==".pptx" else DOCX_MIME
        if body.startswith((b'\x89PNG',b'\xff\xd8\xff')) or body[:4]==b'RIFF' and body[8:12]==b'WEBP':
            from PIL import Image
            with Image.open(io.BytesIO(body)) as image:
                if image.width*image.height>20_000_000 or getattr(image,'n_frames',1)!=1:raise ValueError('image_decode_limit')
                image.verify();return Image.MIME[image.format]
        if suffix in {'.txt','.md','.markdown'}:
            body.decode('utf-8-sig')
            if b'\x00' in body:raise ValueError('invalid_text_file')
            return 'text/markdown' if suffix!='.txt' else 'text/plain'
        raise ValueError('unsupported_document_type')

    def upload(self, identifier, context, name, body):
        self.require(identifier,context)
        if not body or len(body)>MAX_FILE:raise ValueError('attachment_must_be_between_1_byte_and_25_MB')
        name=re.split(r'[/\\]',str(name))[-1][:120] or 'Document'
        mime=self.identify(name,body);digest=hashlib.sha256(body).hexdigest();file_id=stable(digest)
        with self.artifacts.lock:
            data=self.artifacts.read({});rows=data.setdefault('attachments',{}).setdefault(identifier,[])
            existing=next((r for r in rows if r['id']==file_id),None)
            if existing:return {**copy.deepcopy(existing),'duplicate':True}
            if len(rows)>=5:raise ValueError('maximum_five_attachments_per_entry')
            folder=self.folder(identifier,file_id);folder.mkdir(parents=True,exist_ok=True)
            (folder/'original').write_bytes(body)
            row={'id':file_id,'name':name,'mime':mime,'size':len(body),'revision':digest,'status':'queued','created':now(),'page_count':0,'images':[]}
            rows.append(row);self.artifacts.backup_metadata();self.artifacts.write(data)
            return copy.deepcopy(row)

    def original(self, identifier, context, file_id, revision=''):
        row=self.get(identifier,context,file_id)
        if not row:raise ValueError('attachment_unavailable')
        folder=self.folder(identifier,file_id)
        if revision and revision!=row['revision']:
            if not re.fullmatch(r'[0-9a-f]{64}',revision) or not any(r['revision']==revision for r in row.get('pdf_revisions',[])):raise ValueError('pdf_revision_unavailable')
            return (folder/(revision+'.pdf')).read_bytes(),PDF_MIME
        body=(folder/'original').read_bytes()
        if hashlib.sha256(body).hexdigest()!=row['revision']:raise ValueError('original_integrity_failed')
        return body,row['mime']

    def _image(self, folder, body, page, caption):
        from PIL import Image
        with Image.open(io.BytesIO(body)) as image:
            if image.width*image.height>20_000_000 or getattr(image,'n_frames',1)!=1:raise ValueError('image_decode_limit')
            image.load();image.thumbnail((2400,2400));output=io.BytesIO();image.convert('RGB').save(output,format='JPEG',quality=90)
            image_id='A'+stable(output.getvalue().hex())[:24];(folder/(image_id+'.jpg')).write_bytes(output.getvalue())
            return {'id':image_id,'page':page,'caption':caption,'width':image.width,'height':image.height}

    def process(self, identifier, context, file_id):
        with PDF_LOCK:return self._process(identifier,context,file_id)

    def _process(self, identifier, context, file_id):
        row=self.get(identifier,context,file_id)
        if not row:raise ValueError('attachment_unavailable')
        if row['status']=='ready':return row
        folder=self.folder(identifier,file_id);body,mime=self.original(identifier,context,file_id)
        self.update(identifier,context,file_id,status='processing',error='')
        pages=[];images=[];truncated=False
        try:
            if mime==PDF_MIME:
                import pypdfium2 as pdfium
                document=pdfium.PdfDocument(body)
                try:
                    if len(document)>100:raise ValueError('PDF_page_limit_100')
                    for n in range(len(document)):
                        page=document[n];textpage=page.get_textpage()
                        count=textpage.count_chars();text=textpage.get_text_range(0,min(count,32000));truncated|=count>32000
                        objects=[]
                        for index,obj in enumerate(page.get_objects(max_depth=1,textpage=textpage)):
                            if obj.type not in {pdfium.raw.FPDF_PAGEOBJ_TEXT,pdfium.raw.FPDF_PAGEOBJ_IMAGE}:continue
                            left,bottom,right,top=obj.get_bounds()
                            entry={'id':f'P{n+1}-O{index}','type':'text' if obj.type==pdfium.raw.FPDF_PAGEOBJ_TEXT else 'image','rect':[left,bottom,right-left,top-bottom]}
                            if entry['type']=='text':entry.update(text=obj.extract(),font_size=obj.get_font_size(),font=obj.get_font().get_base_name())
                            elif len(images)<20:
                                try:
                                    width,height=obj.get_px_size()
                                    if width*height>20_000_000:continue
                                    bitmap=obj.get_bitmap(render=True);out=io.BytesIO();bitmap.to_pil().save(out,format='PNG');bitmap.close()
                                    images.append(self._image(folder,out.getvalue(),n+1,f'Figure from {row["name"]}, page {n+1}'))
                                except (ValueError,RuntimeError,OSError):pass
                            objects.append(entry)
                        pages.append({'page':n+1,'width':page.get_width(),'height':page.get_height(),'text':reader_text(text[:32000]),'objects':objects,'scanned':not bool(text.strip())})
                        textpage.close();page.close()
                finally:document.close()
            elif mime==DOCX_MIME:
                from docx import Document
                from docx.oxml.ns import qn
                document=Document(io.BytesIO(body));parts=[];blocks=[]
                for n,element in enumerate(document.element.body):
                    text=' '.join(element.xpath('.//w:t/text()'))
                    if element.tag==qn('w:tbl'):
                        table=[]
                        for r in element.xpath('./w:tr'):table.append([' '.join(c.xpath('.//w:t/text()')) for c in r.xpath('./w:tc')])
                        if table:
                            width=max(map(len,table));table=[r+['']*(width-len(r)) for r in table]
                            lines=['| '+' | '.join(c.replace('|','\\|').replace('\n',' ') for c in r)+' |' for r in table]
                            text='\n'.join([lines[0],'| '+' | '.join(['---']*width)+' |',*lines[1:]])
                    styles=element.xpath('./w:pPr/w:pStyle/@w:val') if element.tag==qn('w:p') else []
                    heading=re.fullmatch(r'Heading([1-6])',styles[0],re.I) if styles else None
                    if heading:text='#'*int(heading[1])+' '+text
                    if text:parts.append(text);blocks.append({'id':'B'+str(n+1),'type':'table' if element.tag==qn('w:tbl') else 'heading' if heading else 'text','text':text[:8000]})
                for relationship in document.part.rels.values():
                    if not relationship.is_external and 'image' in relationship.reltype and len(images)<20:
                        try:images.append(self._image(folder,relationship.target_part.blob,None,f'Image from {row["name"]}'))
                        except (ValueError,OSError):pass
                text='\n\n'.join(parts);truncated=len(text)>500000
                pages=[{'page':1,'page_label':'Document blocks (original pagination unavailable)','text':reader_text(text[:500000]),'objects':blocks,'scanned':False}]
            elif mime==PPTX_MIME:
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(body)) as archive:
                    slides=sorted([n for n in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n)[1]))
                    if len(slides)>100:raise ValueError('presentation_exceeds_100_slides')
                    pages=[];total=0
                    for number,name in enumerate(slides,1):
                        root=ET.fromstring(archive.read(name));text='\n'.join(n.text or '' for n in root.iter() if n.tag.endswith('}t'));total+=len(text)
                        if total>500000:raise ValueError('presentation_text_too_large')
                        pages.append({'page':number,'page_label':f'Slide {number}','text':text,'objects':[],'scanned':not text.strip()})
                    for name in archive.namelist():
                        if name.startswith('ppt/media/') and name.lower().endswith(('.png','.jpg','.jpeg','.webp')) and len(images)<20:
                            try:images.append(self._image(folder,archive.read(name),None,'Presentation illustration'))
                            except (ValueError,OSError):pass
            elif mime.startswith('image/'):
                images=[self._image(folder,body,1,row['name'])];pages=[{'page':1,'text':'','objects':[],'scanned':True}]
            else:
                text=reader_text(body.decode('utf-8-sig'));truncated=len(text)>500000
                pages=[{'page':1,'text':text[:500000],'objects':[],'scanned':False}]
            atomic(folder/'extracted.json',{'pages':pages,'images':images})
            item=self.require(identifier,context);sources=[]
            for p in pages:
                if not p['text'].strip():continue
                sources.append({'attachment_id':file_id,'attachment_revision':row['revision'],'reference_kind':'page' if mime==PDF_MIME else 'block','page':p['page'],'title':row['name']+(f' · Page {p["page"]}' if mime==PDF_MIME else ''),'url':f'/api/research/{identifier}/attachments/{file_id}/original#page={p["page"]}','content':p['text'][:1400],'retrieved_at':now(),'provider':'uploaded_document'})
            if sources:self.artifacts.append_extension(identifier,context,item['revision'],'attachment-'+file_id,'',sources)
            return self.update(identifier,context,file_id,status='ready',page_count=len(pages),images=images,extraction_truncated=truncated,needs_ocr=all(p['scanned'] for p in pages))
        except Exception as error:
            self.update(identifier,context,file_id,status='failed',error=str(error)[:160])
            raise ValueError('Document extraction failed: '+str(error)[:160]) from error

    def page(self, identifier, context, file_id, page=1, revision='', offset=0, limit=8000, object_offset=0, object_limit=500):
        with PDF_LOCK:return self._page(identifier,context,file_id,page,revision,offset,limit,object_offset,object_limit)

    def _page(self, identifier, context, file_id, page=1, revision='', offset=0, limit=8000, object_offset=0, object_limit=500):
        row=self.get(identifier,context,file_id)
        if not row:raise ValueError('attachment_unavailable')
        if row['status']!='ready':return {'status':row['status'],'error':row.get('error',''),'attachment':row}
        if revision and revision!=row['revision']:
            # Edited PDF object identities and geometry belong to that exact revision.
            body,_=self.original(identifier,context,file_id,revision)
            import pypdfium2 as pdfium
            document=pdfium.PdfDocument(body)
            try:
                if not 1<=page<=len(document):raise ValueError('page_out_of_range')
                p=document[page-1];tp=p.get_textpage();objects=[]
                for index,obj in enumerate(p.get_objects(max_depth=1,textpage=tp)):
                    if obj.type not in {pdfium.raw.FPDF_PAGEOBJ_TEXT,pdfium.raw.FPDF_PAGEOBJ_IMAGE}:continue
                    l,b,r,t=obj.get_bounds();o={'id':f'P{page}-O{index}','type':'text' if obj.type==pdfium.raw.FPDF_PAGEOBJ_TEXT else 'image','rect':[l,b,r-l,t-b]}
                    if o['type']=='text':o.update(text=obj.extract(),font_size=obj.get_font_size())
                    objects.append(o)
                text=tp.get_text_range(0,min(32000,tp.count_chars()));start=max(0,int(object_offset));count=max(1,min(500,int(object_limit)))
                result={'page':page,'page_count':len(document),'width':p.get_width(),'height':p.get_height(),'objects':[{**o,'text':o.get('text','')[:400]} for o in objects[start:start+count]],'next_object_offset':start+count if start+count<len(objects) else None,'text':text[max(0,offset):max(0,offset)+min(12000,max(1,limit))]};tp.close();p.close();return {'status':'ok',**result}
            finally:document.close()
        data=read(self.folder(identifier,file_id)/'extracted.json',{});pages=data.get('pages',[])
        if not 1<=page<=len(pages):raise ValueError('page_out_of_range')
        p=copy.deepcopy(pages[page-1]);offset=max(0,int(offset));limit=max(1,min(12000,int(limit)));text=p['text']
        p['text']=text[offset:offset+limit]
        # Geometry is bounded separately; text blocks remain available via the cursor.
        objects=p.get('objects',[]);start=max(0,int(object_offset));count=max(1,min(500,int(object_limit)))
        p['objects']=[{**o,'text':o.get('text','')[:400]} for o in objects[start:start+count]]
        return {'status':'ok','attachment':row,**p,'page_count':len(pages),'offset':offset,'next_offset':offset+limit if offset+limit<len(text) else None,'next_object_offset':start+count if start+count<len(objects) else None}

    def image(self, identifier, context, file_id, image_id):
        row=self.get(identifier,context,file_id)
        if not row or not any(r['id']==image_id for r in [*row.get('images',[]),*[image for revision in row.get('pdf_revisions',[]) for image in revision.get('images',[])]]):raise ValueError('image_unavailable')
        return (self.folder(identifier,file_id)/(image_id+'.jpg')).read_bytes(),'image/jpeg'

    def presentation(self, identifier, context):
        rows=self.listing(identifier,context);images=[]
        item=self.require(identifier,context);sources=self.artifacts.source_catalog(item)
        for file in rows:
            for image in file.get('images',[]):
                source_index=next((i for i,s in enumerate(sources) if s.get('attachment_id')==file['id'] and (not image.get('page') or s.get('page')==image['page'])),None)
                images.append({**image,'attachment_id':file['id'],'source_id':'S'+str(source_index+1) if source_index is not None else '', 'publication':file['name'],'url':f'/api/research/{identifier}/attachments/{file["id"]}/images/{image["id"]}'})
        metadata=self.artifacts.request_state(identifier,context);parent=metadata.get('source_research_id','')
        visited={identifier}
        while parent and parent not in visited and len(visited)<5 and len(images)<4:
            visited.add(parent)
            if self.artifacts.get(parent,context)['status']!='ok':break
            for file in self.listing(parent,context):
                for image in file.get('images',[]):
                    index=next((i for i,s in enumerate(sources) if s.get('attachment_id')==file['id'] and (not image.get('page') or s.get('page')==image['page'])),None)
                    if index is not None and not any(r['id']==image['id'] for r in images):images.append({**image,'attachment_id':file['id'],'source_id':'S'+str(index+1),'publication':file['name'],'url':f'/api/research/{parent}/attachments/{file["id"]}/images/{image["id"]}'})
            parent=self.artifacts.request_state(parent,context).get('source_research_id','')
        return {'attachments':rows,'attachment_images':images[:4]}

    def edit_pdf(self, identifier, context, file_id, revision, commands, operation_id, apply=False):
        self.require(identifier,context)
        if not re.fullmatch(r'[a-zA-Z0-9:_-]{1,100}',operation_id):raise ValueError('invalid_edit_operation')
        with PDF_LOCK,StorageLock(self.folder(identifier,file_id)/'edits.lock'):
            return self._edit_pdf(identifier,context,file_id,revision,commands,operation_id,apply)

    def _edit_pdf(self, identifier, context, file_id, revision, commands, operation_id, apply=False):
        """Produce a preview revision; commit only that exact operation after review."""
        row=self.get(identifier,context,file_id)
        if not row or row['mime']!=PDF_MIME:raise ValueError('PDF_required')
        current=row.get('pdf_revision') or row['revision']
        revisions=row.get('pdf_revisions',[]);previous=next((r for r in revisions if r['operation_id']==operation_id),None)
        if previous:
            if not apply and commands and previous.get('command_digest')!=hashlib.sha256(json.dumps(commands,sort_keys=True).encode()).hexdigest():raise ValueError('edit_operation_id_reused')
            if apply:
                if current!=previous['parent_revision'] and current!=previous['revision']:raise ValueError('pdf_revision_changed')
                self.update(identifier,context,file_id,pdf_revision=previous['revision'])
            return {'status':'completed' if apply else 'preview','revision':previous['revision'],'parent_revision':previous['parent_revision']}
        if apply:raise ValueError('preview_required')
        if revision!=current:raise ValueError('pdf_revision_changed')
        if not isinstance(commands,list) or not 1<=len(commands)<=30:raise ValueError('one_to_thirty_commands_required')
        if any(not isinstance(c,dict) or type(c.get('page',1)) is not int for c in commands):raise ValueError('invalid_edit_command')
        native={'replace_text','move_object','resize_object','remove_object'};removed=set();inserted_text=set();added_page=False
        for command in commands:
            number=command.get('page',1);action=command.get('action')
            if action in native and (number in removed or number in inserted_text or added_page):raise ValueError('Select_native_objects_again_after_removing_inserting_or_adding_pages')
            if action=='remove_object':removed.add(number)
            if action=='insert_text':inserted_text.add(number)
            if action=='add_page':added_page=True
        import pypdfium2 as pdfium
        from pypdfium2 import raw
        import ctypes, math
        body,_=self.original(identifier,context,file_id,revision);document=pdfium.PdfDocument(body)
        try:
            for command in commands:
                action=command.get('action');number=int(command.get('page',1))
                if action=='add_page':
                    if len(document)>=100:raise ValueError('PDF_page_limit_100')
                    page=document.new_page(595,842,index=min(max(0,number),len(document)));page.gen_content();page.close();continue
                if not 1<=number<=len(document):raise ValueError('page_out_of_range')
                page=document[number-1]
                try:
                    objects=list(page.get_objects(max_depth=1));obj=None
                    if action in {'replace_text','move_object','resize_object','remove_object'}:
                        match=re.fullmatch(r'P(\d+)-O(\d+)',str(command.get('object_id','')))
                        if not match or int(match[1])!=number or int(match[2])>=len(objects):raise ValueError('invalid_page_object')
                        obj=objects[int(match[2])]
                    if action=='replace_text':
                        if obj.type!=raw.FPDF_PAGEOBJ_TEXT:raise ValueError('native_text_object_required')
                        text=str(command.get('text',''))
                        if not text or len(text)>4000 or '\n' in text:raise ValueError('replace_one_text_line_at_a_time')
                        from reportlab.pdfbase.pdfmetrics import stringWidth
                        size=obj.get_font_size();l,b,r,t=obj.get_bounds()
                        if stringWidth(text,'Helvetica',size)>max(r-l,10)*1.1:raise ValueError('text_overflow_add_a_text_box_or_page')
                        value=(ctypes.c_ushort*((len(text.encode('utf-16-le'))//2)+1)).from_buffer_copy(text.encode('utf-16-le')+b'\0\0')
                        if not raw.FPDFText_SetText(obj,value):raise ValueError('text_font_cannot_represent_change')
                        page.gen_content();tp=page.get_textpage();obj.textpage=tp
                        try:actual=obj.extract()
                        finally:obj.textpage=None;tp.close()
                        if actual!=text:raise ValueError('native_font_cannot_represent_text_use_an_editable_copy')
                        nl,nb,nr,nt=obj.get_bounds()
                        if nr>r+2 or nl<l-2 or nt>t+max(2,(t-b)*.25) or nb<b-max(2,(t-b)*.25):raise ValueError('text_overflow_add_a_text_box_or_page')
                    elif action in {'move_object','resize_object'}:
                        rect=command.get('rect',[])
                        if len(rect)!=4 or not all(isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x) for x in rect):raise ValueError('invalid_object_rectangle')
                        x,y,w,h=rect
                        if x<0 or y<0 or w<=0 or h<=0 or x+w>page.get_width()+1 or y+h>page.get_height()+1:raise ValueError('object_outside_page')
                        l,b,r,t=obj.get_bounds();sx=w/max(.01,r-l);sy=h/max(.01,t-b)
                        obj.transform(pdfium.PdfMatrix(sx,0,0,sy,x-l*sx,y-b*sy))
                    elif action=='remove_object':page.remove_obj(obj)
                    elif action=='insert_text':
                        text=str(command.get('text',''));rect=command.get('rect',[])
                        if not text or len(text)>8000 or len(rect)!=4:raise ValueError('text_and_rectangle_required')
                        x,y,w,h=map(float,rect);size=float(command.get('font_size',12))
                        if not all(math.isfinite(n) for n in [x,y,w,h,size]) or min(x,y)<0 or min(w,h)<=0 or not 6<=size<=72 or x+w>page.get_width() or y+h>page.get_height():raise ValueError('invalid_text_rectangle')
                        for existing in objects:
                            if existing.type!=raw.FPDF_PAGEOBJ_TEXT:continue
                            left,bottom,right,top=existing.get_bounds()
                            if max(x,left)<min(x+w,right) and max(y,bottom)<min(y+h,top):raise ValueError('text_area_overlaps_existing_text_choose_a_clear_region_or_add_a_page')
                        from reportlab.lib.styles import ParagraphStyle
                        from reportlab.platypus import Paragraph
                        from reportlab.pdfgen.canvas import Canvas
                        import html
                        from reportlab.pdfbase import pdfmetrics
                        from reportlab.pdfbase.ttfonts import TTFont
                        font='Helvetica';font_path=Path('C:/Windows/Fonts/segoeui.ttf')
                        if font_path.exists():
                            if 'NovaDocument' not in pdfmetrics.getRegisteredFontNames():pdfmetrics.registerFont(TTFont('NovaDocument',str(font_path)))
                            font='NovaDocument'
                            if any(ord(c)>127 and ord(c) not in pdfmetrics.getFont(font).face.charToGlyph for c in text):raise ValueError('inserted_text_needs_an_available_font_for_these_characters')
                        elif any(ord(c)>255 for c in text):raise ValueError('Unicode_font_unavailable_use_an_editable_copy')
                        paragraph=Paragraph(html.escape(text).replace('\n','<br/>'),ParagraphStyle('Added',fontName=font,fontSize=size,leading=size*1.3))
                        _,height=paragraph.wrap(w,h)
                        if height>h:raise ValueError('text_overflow_add_a_page')
                        # Add as a form object, preserving the untouched original page objects.
                        overlay=io.BytesIO();canvas=Canvas(overlay,pagesize=(page.get_width(),page.get_height()));paragraph.drawOn(canvas,x,y+h-height);canvas.save()
                        page.gen_content();page.close();serialized=io.BytesIO();document.save(serialized);document.close()
                        from pypdf import PdfReader,PdfWriter
                        reader=PdfReader(io.BytesIO(serialized.getvalue()));layer=PdfReader(io.BytesIO(overlay.getvalue()));writer=PdfWriter(clone_from=reader);writer.pages[number-1].merge_page(layer.pages[0]);merged=io.BytesIO();writer.write(merged);document=pdfium.PdfDocument(merged.getvalue());page=None
                    elif action=='insert_image':
                        image_id=str(command.get('image_id',''));image_file=str(command.get('image_attachment_id',''))
                        image_body,_=self.image(identifier,context,image_file,image_id);rect=command.get('rect',[])
                        if len(rect)!=4:raise ValueError('image_rectangle_required')
                        x,y,w,h=map(float,rect)
                        if not all(math.isfinite(n) for n in [x,y,w,h]) or min(x,y)<0 or min(w,h)<=0 or x+w>page.get_width() or y+h>page.get_height():raise ValueError('invalid_image_rectangle')
                        from PIL import Image
                        bitmap=pdfium.PdfBitmap.from_pil(Image.open(io.BytesIO(image_body)).convert('RGB'));image=pdfium.PdfImage.new(document);image.set_bitmap(bitmap);image.set_matrix(pdfium.PdfMatrix(w,0,0,h,x,y));page.insert_obj(image)
                    else:raise ValueError('unsupported_PDF_edit')
                    if page:page.gen_content()
                finally:
                    if page:page.close()
            output=io.BytesIO();document.save(output);result=output.getvalue()
        finally:document.close()
        new_revision=hashlib.sha256(result).hexdigest();folder=self.folder(identifier,file_id);(folder/(new_revision+'.pdf')).write_bytes(result)
        figures=[]
        with pdfium.PdfDocument(result) as rendered:
            for n in range(len(rendered)):
                page=rendered[n]
                try:
                    for obj in page.get_objects(max_depth=1):
                        if obj.type!=raw.FPDF_PAGEOBJ_IMAGE:continue
                        width,height=obj.get_px_size()
                        if width*height>20_000_000:continue
                        bitmap=obj.get_bitmap(render=True);out=io.BytesIO();bitmap.to_pil().save(out,format='PNG');bitmap.close()
                        figures.append(self._image(folder,out.getvalue(),n+1,f'Image from edited {row["name"]}, page {n+1}'))
                        if len(figures)>=4:break
                finally:page.close()
                if len(figures)>=4:break
        entry={'revision':new_revision,'parent_revision':revision,'operation_id':operation_id,'created':now(),'images':figures,'changes':[c.get('action') for c in commands],'command_digest':hashlib.sha256(json.dumps(commands,sort_keys=True).encode()).hexdigest()}
        self.update(identifier,context,file_id,pdf_revisions=[*revisions,entry])
        return {'status':'preview','revision':new_revision,'parent_revision':revision}

    def restore_pdf(self, identifier, context, file_id, expected_revision, revision):
        self.require(identifier,context)
        with StorageLock(self.folder(identifier,file_id)/'edits.lock'):
            return self._restore_pdf(identifier,context,file_id,expected_revision,revision)

    def _restore_pdf(self, identifier, context, file_id, expected_revision, revision):
        row=self.get(identifier,context,file_id)
        if not row or (row.get('pdf_revision') or row['revision'])!=expected_revision:raise ValueError('pdf_revision_changed')
        self.original(identifier,context,file_id,revision)
        self.update(identifier,context,file_id,pdf_revision=revision)
        return {'status':'completed','revision':revision}
