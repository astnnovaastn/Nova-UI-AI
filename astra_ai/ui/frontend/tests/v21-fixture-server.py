"""Loopback-only real component/API test host. Never imports the application server or providers."""
import sys,tempfile,threading
from pathlib import Path
from types import SimpleNamespace
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
root=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(root))
from astra_ai.ui.backend.v21_workspace import NotesLibrary
from astra_ai.ui.backend.task_backend.store import TaskStore
from astra_ai.ui.backend.api.workspace_v21 import install
temporary=tempfile.TemporaryDirectory(prefix='aegis-v21-fixture-')
data=Path(temporary.name)
state=SimpleNamespace(notes_state_dir=data/'notes',notes_state_lock=threading.Lock(),notes_data=[],notes_summaries=[])
library=NotesLibrary(state.notes_state_dir)
for i in range(3):library.call({'kind':'create','request_id':str(i),'markdown':f'# Fixture note {i+1}\n\nA recorded idea with **formatting**, a list and provenance.\n\n- Preserve the source\n- Review the result'})
app=FastAPI();notes,tasks=install(app,state=state,task_store=TaskStore(data/'tasks'),owner_only=lambda _:None,task_owner=lambda _:'fixture')
tasks.create('fixture',{'title':'Review the architecture','description':'Inspect sources before recording a decision.'},'fixture-task')
@app.get('/v21-host.css')
def host_css():return FileResponse(Path(__file__).resolve().parents[1]/'src/components/WorkspaceTools.css',media_type='text/css')
app.mount('/',StaticFiles(directory=Path(__file__).resolve().parents[1]/'public',html=True))
if __name__=='__main__':uvicorn.run(app,host='127.0.0.1',port=int(sys.argv[1]) if len(sys.argv)>1 else 5191,log_level='warning')
