"""Scoped document transport. Upload bodies and edit intents never enter job arguments."""
import asyncio, json, re, uuid
from fastapi import Request,HTTPException
from fastapi.responses import Response,JSONResponse
from astra_ai.core.research_documents import DocumentFiles,MAX_FILE,compose_documentary,create_entry
from astra_ai.memory.shared_memory import atomic,read

def prepare_composition(artifacts,identifier,context,brief):
    from astra_ai.core.research_learning import display_title
    from astra_ai.memory.shared_memory import safe
    if not isinstance(brief,str) or not 1<=len(brief.strip())<=12000 or safe(brief)!=brief:raise ValueError('Document brief must contain 1–12,000 characters and no credentials.')
    with artifacts.lock:
        metadata=artifacts.request_state(identifier,context)
        item=artifacts.get(identifier,context).get('artifact',{})
        if metadata.get('kind')!='documentary' or metadata.get('phase') not in {'draft','failed'} or item.get('completeness') not in {'pending','failed'}:raise ValueError('This documentary is already being prepared or has been written.')
        artifacts.request_state(identifier,context,query=brief,origin_text=context.get('user_text') or brief,display_title=display_title(brief),phase='queued',outbound_started=False)
    return metadata

def submit(jobs,context,identifier,action,**args):
    operation_id=args.pop('operation_id',None) or uuid.uuid4().hex
    context={**context,'requested_research':True}
    return {**jobs.submit([{'name':'search_web','arguments':{'action':action,'research_id':identifier,**args}}],context,operation_id,goal={'document_extract':'Read attachment','document_pdf':'Prepare PDF preview','document_compose':'Write documentary'}[action]),'research_id':identifier}

def intent(files,identifier,context,file_id,edit_id,body=None):
    if not re.fullmatch(r'[0-9a-f]{32}',edit_id):raise ValueError('invalid_edit_id')
    if not files.get(identifier,context,file_id):raise ValueError('attachment_unavailable')
    path=files.folder(identifier,file_id)/(edit_id+'.json')
    if body is not None:
        if len(json.dumps(body))>18000:raise ValueError('edit_request_too_large')
        atomic(path,body)
    return read(path,{})

async def run_document_job(artifacts,search,model,cpu,args,context):
    identifier=str(args.get('research_id',''));files=DocumentFiles(artifacts)
    try:
        await asyncio.to_thread(files.require,identifier,context)
        if args['action']=='document_compose':return await compose_documentary(artifacts,search,model,context,identifier)
        file_id=str(args.get('attachment_id',''))
        async with cpu:
            if args['action']=='document_extract':
                row=await asyncio.to_thread(files.process,identifier,context,file_id)
                return {'status':'completed','attachment_id':row['id'],'page_count':row['page_count']}
            if args['action']=='document_pdf':
                edit_id=str(args.get('edit_id',''));body=await asyncio.to_thread(intent,files,identifier,context,file_id,edit_id)
                result=await asyncio.to_thread(files.edit_pdf,identifier,context,file_id,str(body.get('revision','')),body.get('commands'),edit_id)
                return {**result,'status':'completed','preview_status':result['status']}
        return {'status':'rejected','reason':'unsupported_document_operation'}
    except (ValueError,OSError) as error:return {'status':'failed','reason':str(error)[:180]}

def authored_preview(files,identifier,context,markdown,expected_revision,operation_id,placement="replace",selected_text="",section_heading=""):
    from markdown_it import MarkdownIt
    import bleach
    files.require(identifier,context)
    if not isinstance(markdown,str) or not markdown.strip() or len(markdown)>30000:raise ValueError('document_edit_must_contain_1_to_30000_characters')
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}',operation_id):raise ValueError('invalid_edit_id')
    current=files.artifacts.document(identifier,context,bounded=True)
    if expected_revision!=(current.get('draft') or {}).get('revision',''):return {'status':'conflict','reason':'draft_changed'}
    html=bleach.clean(MarkdownIt().render(markdown),tags={'p','h1','h2','h3','h4','strong','em','s','ul','ol','li','blockquote','pre','code','br','hr','a','img','table','thead','tbody','tr','th','td'},attributes={'a':['href','title'],'img':['src','alt','title']},protocols={'https','http'},strip=True)
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(html,'html.parser')
    for image in soup.find_all('img'):
        match=re.fullmatch(r'/api/research/([0-9a-f]{32})/attachments/([0-9a-f]{32})/images/(A[0-9a-f]{24})',image.get('src',''))
        if not match:
            research=re.fullmatch(r'/api/research/([0-9a-f]{32})/images/(I[0-9a-f]{24})',image.get('src',''))
            if not research or research[1]!=identifier or not any(i['id']==research[2] for i in files.artifacts.images(identifier,context)):image.decompose()
            continue
        row=files.get(match[1],context,match[2])
        if not row or not any(i['id']==match[3] for i in [*row.get('images',[]),*[i for r in row.get('pdf_revisions',[]) for i in r.get('images',[])]]):image.decompose()
    if placement not in {'replace','append','selection','section'}:raise ValueError('invalid_document_placement')
    previous=BeautifulSoup((current.get('draft') or {}).get('html',''),'html.parser')
    fragments=list(soup.contents)
    if placement=='append':
        for fragment in fragments:previous.append(fragment)
        soup=previous
    elif placement=='section':
        headings=[h for h in previous.find_all(['h1','h2','h3','h4']) if h.get_text(' ',strip=True).casefold()==section_heading.strip().casefold()]
        if len(headings)!=1:raise ValueError('document_section_is_missing_or_ambiguous')
        anchor=headings[0]
        for fragment in fragments:anchor.insert_after(fragment);anchor=fragment
        soup=previous
    elif placement=='selection':
        if not selected_text or len(selected_text)>600:raise ValueError('select_a_short_document_passage')
        matches=[n for n in previous.find_all(string=True) if selected_text in str(n)]
        if len(matches)!=1 or str(matches[0]).count(selected_text)!=1:raise ValueError('selection_changed_or_crosses_formatted_blocks')
        node=matches[0];before,after=str(node).split(selected_text,1)
        # Insert at a text position. Block fragments are split out of the containing paragraph.
        parent=node.parent
        if parent.name in {'p','h1','h2','h3','h4'} and parent.get_text()==str(node):
            from bs4 import NavigableString
            if before:parent.insert_before(BeautifulSoup('<p></p>','html.parser').p);parent.previous_sibling.string=before
            for fragment in fragments:parent.insert_before(fragment)
            if after:parent.insert_before(BeautifulSoup('<p></p>','html.parser').p);parent.previous_sibling.string=after
            parent.decompose()
        else:raise ValueError('select_a_plain_text_paragraph_or_use_append')
        soup=previous
    html=str(soup)
    if len(html)>1_000_000:raise ValueError('document_too_large')
    folder=files.root/identifier/'authored';folder.mkdir(parents=True,exist_ok=True)
    proposal={'id':operation_id,'html':html,'expected_revision':expected_revision,'source_revision':current['research_revision']}
    atomic(folder/(operation_id+'.json'),proposal)
    metadata=files.artifacts.request_state(identifier,context)
    revisions=metadata.get('document_revisions',[])
    if not any(r['id']==operation_id for r in revisions):files.artifacts.request_state(identifier,context,document_revisions=[*revisions,{'id':operation_id,'status':'preview'}][-30:])
    return {'status':'preview','edit_id':operation_id,'html':html}

def authored_apply(files,identifier,context,edit_id):
    files.require(identifier,context)
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}',edit_id):raise ValueError('invalid_edit_id')
    proposal=read(files.root/identifier/'authored'/(edit_id+'.json'),{})
    if not proposal:raise ValueError('document_preview_unavailable')
    result=files.artifacts.save_draft(identifier,context,proposal['source_revision'],proposal['expected_revision'],proposal['html'])
    if result['status']=='completed':
        metadata=files.artifacts.request_state(identifier,context)
        files.artifacts.request_state(identifier,context,document_revisions=[{**r,'status':'applied'} if r['id']==edit_id else r for r in metadata.get('document_revisions',[])])
    return result

async def document_tool(artifacts,context,args,operation_id,jobs):
    files=DocumentFiles(artifacts);identifier=str(args.get('research_id') or context.get('research_id',''))
    try:
        action=args['action']
        if action=='create_documentary':
            selected=await asyncio.to_thread(artifacts.get,identifier,context)
            current=selected.get('artifact',{})
            if current.get('kind')=='documentary' and current.get('completeness') in {'pending','failed'}:
                await asyncio.to_thread(prepare_composition,artifacts,identifier,context,str(args.get('detail') or context.get('user_text') or current['query']))
                result=submit(jobs,context,identifier,'document_compose',operation_id=operation_id)
                if result.get('status') in {'queued','duplicate'}:await asyncio.to_thread(artifacts.request_state,identifier,context,job_id=result['job_id'])
                return result
            created=await asyncio.to_thread(create_entry,artifacts,context,'documentary',str(args.get('detail') or 'An illustrated written documentary based on this research'),operation_id,identifier)
            if created['status']!='completed':return created
            result=submit(jobs,context,created['research_id'],'document_compose',operation_id=operation_id+'-compose')
            if result.get('status') in {'queued','duplicate'}:await asyncio.to_thread(artifacts.request_state,created['research_id'],context,phase='queued',job_id=result['job_id'])
            return result
        await asyncio.to_thread(files.require,identifier,context)
        if action=='read_attachment':
            file_id=str(args.get('attachment_id',''));row=await asyncio.to_thread(files.get,identifier,context,file_id)
            if not row:return {'status':'not_found'}
            revision=str(args.get('pdf_revision') or row.get('pdf_revision') or row['revision'])
            result=await asyncio.to_thread(files.page,identifier,context,file_id,int(args.get('page',1)),revision,int(args.get('offset',0)),3500,int(args.get('object_offset',0)),20)
            result.pop('attachment',None)
            return {**result,'pdf_revision':revision}
        if action=='preview_document':return await asyncio.to_thread(authored_preview,files,identifier,context,str(args.get('markdown','')),str(args.get('draft_revision','')),operation_id,str(args.get('placement','append')),str(args.get('selected_text','')),str(args.get('section_heading','')))
        if action=='apply_document':return await asyncio.to_thread(authored_apply,files,identifier,context,str(args.get('edit_id','')))
        if action=='preview_pdf':
            edit_id=uuid.uuid4().hex;file_id=str(args.get('attachment_id',''))
            await asyncio.to_thread(intent,files,identifier,context,file_id,edit_id,{'revision':str(args.get('pdf_revision','')),'commands':args.get('commands')})
            return submit(jobs,context,identifier,'document_pdf',attachment_id=file_id,edit_id=edit_id,operation_id=edit_id)
    except (ValueError,OSError) as error:return {'status':'rejected','reason':str(error)[:180]}

def install(app,services,context_for,jobs_for):
    def files_for(request,identifier):
        context=context_for(request);artifacts,_=services();files=DocumentFiles(artifacts)
        try:files.require(identifier,context)
        except ValueError:raise HTTPException(404,'Document unavailable')
        return files,context

    @app.post('/api/research/{identifier}/compose')
    async def compose(identifier:str,request:Request):
        files,context=files_for(request,identifier);body=await request.json();metadata=await asyncio.to_thread(files.artifacts.request_state,identifier,context)
        brief=body.get('query') or metadata['query']
        try:await asyncio.to_thread(prepare_composition,files.artifacts,identifier,context,brief)
        except ValueError as error:raise HTTPException(409,str(error))
        result=submit(jobs_for(),context,identifier,'document_compose',operation_id=uuid.uuid4().hex)
        if result.get('status') in {'queued','duplicate'}:await asyncio.to_thread(files.artifacts.request_state,identifier,context,job_id=result['job_id'])
        else:await asyncio.to_thread(files.artifacts.request_state,identifier,context,phase='draft')
        return result

    @app.get('/api/research/{identifier}/attachments')
    async def listing(identifier:str,request:Request):
        files,context=files_for(request,identifier);return {'status':'ok','attachments':await asyncio.to_thread(files.listing,identifier,context)}

    @app.post('/api/research/{identifier}/attachments')
    async def upload(identifier:str,request:Request):
        files,context=files_for(request,identifier)
        # Stream the single raw file with a strict limit before allocating extraction work.
        chunks=[];size=0
        async for chunk in request.stream():
            size+=len(chunk)
            if size>MAX_FILE:raise HTTPException(413,'Each attachment must be at most 25 MB.')
            chunks.append(chunk)
        if context_for(request)!=context:raise HTTPException(403,'Document session changed')
        from urllib.parse import unquote
        try:row=await asyncio.to_thread(files.upload,identifier,context,unquote(request.headers.get('X-File-Name','Document')),b''.join(chunks))
        except (ValueError,OSError,UnicodeError) as error:raise HTTPException(422,str(error)[:180])
        result=submit(jobs_for(),context,identifier,'document_extract',attachment_id=row['id'],operation_id='attachment-'+identifier+'-'+row['id'])
        return {**result,'attachment':row}

    @app.post('/api/research/{identifier}/attachments/{file_id}/retry')
    async def retry_file(identifier:str,file_id:str,request:Request):
        files,context=files_for(request,identifier);row=await asyncio.to_thread(files.get,identifier,context,file_id)
        if not row or row['status']!='failed':raise HTTPException(409,'Only failed attachment processing can be retried.')
        result=submit(jobs_for(),context,identifier,'document_extract',attachment_id=file_id)
        if result.get('status') in {'queued','duplicate'}:await asyncio.to_thread(files.update,identifier,context,file_id,status='queued',error='')
        return result

    @app.get('/api/research/{identifier}/attachments/{file_id}/original')
    async def original(identifier:str,file_id:str,request:Request,revision:str='',download:bool=False):
        files,context=files_for(request,identifier)
        try:body,mime=await asyncio.to_thread(files.original,identifier,context,file_id,revision)
        except (ValueError,OSError):raise HTTPException(404,'Attachment revision unavailable')
        if context_for(request)!=context:raise HTTPException(403,'Document session changed')
        return Response(body,media_type=mime,headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':('attachment' if download else 'inline')+'; filename="document'+('.pdf' if mime=='application/pdf' else '')+'"'})

    @app.get('/api/research/{identifier}/attachments/{file_id}/page')
    async def page(identifier:str,file_id:str,request:Request,page:int=1,revision:str='',offset:int=0):
        files,context=files_for(request,identifier)
        try:return await asyncio.to_thread(files.page,identifier,context,file_id,page,revision,offset,8000)
        except (ValueError,OSError):raise HTTPException(422,'Page unavailable')

    @app.get('/api/research/{identifier}/attachments/{file_id}/images/{image_id}')
    async def image(identifier:str,file_id:str,image_id:str,request:Request):
        files,context=files_for(request,identifier)
        try:body,mime=await asyncio.to_thread(files.image,identifier,context,file_id,image_id)
        except (ValueError,OSError):raise HTTPException(404,'Image unavailable')
        return Response(body,media_type=mime,headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})

    @app.post('/api/research/{identifier}/attachments/{file_id}/preview')
    async def preview(identifier:str,file_id:str,request:Request):
        files,context=files_for(request,identifier);body=await request.json();edit_id=uuid.uuid4().hex
        try:await asyncio.to_thread(intent,files,identifier,context,file_id,edit_id,body)
        except (ValueError,OSError) as error:raise HTTPException(422,str(error))
        return {**submit(jobs_for(),context,identifier,'document_pdf',attachment_id=file_id,edit_id=edit_id,operation_id=edit_id),'edit_id':edit_id}

    @app.post('/api/research/{identifier}/attachments/{file_id}/apply')
    async def apply(identifier:str,file_id:str,request:Request):
        files,context=files_for(request,identifier);body=await request.json()
        try:return await asyncio.to_thread(files.edit_pdf,identifier,context,file_id,str(body.get('revision','')),[],str(body.get('edit_id','')),True)
        except (ValueError,OSError) as error:raise HTTPException(409,str(error))

    @app.post('/api/research/{identifier}/attachments/{file_id}/restore')
    async def restore(identifier:str,file_id:str,request:Request):
        files,context=files_for(request,identifier);body=await request.json()
        try:return await asyncio.to_thread(files.restore_pdf,identifier,context,file_id,str(body.get('expected_revision','')),str(body.get('revision','')))
        except (ValueError,OSError) as error:raise HTTPException(409,str(error))

    @app.get('/api/research/{identifier}/document-edits/{edit_id}')
    async def edit_preview(identifier:str,edit_id:str,request:Request):
        files,context=files_for(request,identifier)
        if not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}',edit_id):raise HTTPException(400,'Invalid preview')
        proposal=await asyncio.to_thread(read,files.root/identifier/'authored'/(edit_id+'.json'),{})
        return {'status':'ok',**proposal}

    @app.post('/api/research/{identifier}/document-edits')
    async def make_edit(identifier:str,request:Request):
        files,context=files_for(request,identifier);body=await request.json()
        try:return await asyncio.to_thread(authored_preview,files,identifier,context,body.get('markdown'),str(body.get('draft_revision','')),uuid.uuid4().hex)
        except (ValueError,OSError) as error:raise HTTPException(422,str(error))

    @app.post('/api/research/{identifier}/document-edits/{edit_id}/apply')
    async def apply_edit(identifier:str,edit_id:str,request:Request):
        files,context=files_for(request,identifier)
        try:return await asyncio.to_thread(authored_apply,files,identifier,context,edit_id)
        except (ValueError,OSError) as error:raise HTTPException(409,str(error))
