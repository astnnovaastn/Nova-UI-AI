"""One private runtime tree; source directories are not application databases."""
from pathlib import Path
import hashlib
import os
import shutil
import sqlite3
from contextlib import closing

from astra_ai.memory.shared_memory import StorageLock, atomic, read
from astra_ai.core.research.storage import ResearchBackups, managed_path


class RuntimePaths:
    def __init__(self, installation=None, root=None):
        self.installation=managed_path(installation or Path(__file__).resolve().parents[3])
        self.root=managed_path(root or os.getenv('NOVA_STATE_DIR') or self.installation/'state')
        self.research=self.root/'research';self.system=self.root/'system'
        self.usage=self.system/'usage';self.generated=self.root/'media'/'generated'
        self.logs=self.root/'logs';self.cache=self.root/'cache'

    def widget(self,name):return self.root/'widgets'/name

    def initialize(self):
        with StorageLock(self.root/'.layout.lock'):
            marker=self.root/'layout.json'
            previous=read(marker,{})
            if previous.get('schema_version',0)>=2:return previous
            backend=self.installation/'astra_ai'/'ui'/'backend'
            memory=self.installation/'astra_ai'/'memory'
            mappings={backend/(name+'_widget_data'):self.widget(name) for name in ('search','news','theme','weather','calendar','task')}
            mappings.update({backend/'noted_widget_data':self.widget('notes'),backend/'ai_generated_images':self.generated,
                             backend/'context_preprocessor_data':self.cache/'context',backend/'guest_memory':self.system/'guest-memory'})
            files={};copies={}
            for source,target in mappings.items():
                if source.exists():
                    for item in source.rglob('*'):
                        if item.is_file():
                            copies[item]=target/item.relative_to(source)
                            files['legacy/'+item.relative_to(self.installation).as_posix()]=item
            for name in ('background_budget.json','research_gemini_budget.json','research_openai_budget.json'):
                source=memory/name
                if source.exists():copies[source]=self.usage/name;files['legacy/'+name]=source
            for name in ('action_jobs.json','speaker_profile.json','browser_operations.json','memory_presentation.json','user_preferences.json'):
                source=backend/name
                if source.exists():copies[source]=self.system/name;files['legacy/backend/'+name]=source
            # Include research originals before any runtime path starts using the new tree.
            legacy=memory/'research_artifacts'
            if legacy.exists():
                for item in legacy.rglob('*'):
                    if item.is_file() and item.suffix!='.lock':
                        files['legacy/'+('reports.json' if item.name=='reports.json' else item.relative_to(legacy).as_posix())]=item
            database_copies=[]
            for name in ('workspace-sync.sqlite3','collaboration.sqlite3'):
                source=memory/name
                if source.exists():
                    snapshot=self.root/'.migration'/name;snapshot.parent.mkdir(parents=True,exist_ok=True)
                    with closing(sqlite3.connect(source)) as src,closing(sqlite3.connect(snapshot)) as dst:
                        with dst:src.backup(dst)
                    files['legacy/'+name]=snapshot;database_copies.append((snapshot,self.system/name))
            ResearchBackups(self.root/'backups'/'research').snapshot(files,'migration',extend=True)
            checks=dict(previous.get('migrated_files',{}))
            for source,target in [*copies.items(),*database_copies]:
                if target.relative_to(self.root).as_posix() in checks:continue
                target.parent.mkdir(parents=True,exist_ok=True)
                if not target.exists():shutil.copy2(source,target)
                checksum=hashlib.sha256(source.read_bytes()).hexdigest()
                if hashlib.sha256(target.read_bytes()).hexdigest()!=checksum:raise ValueError('Runtime migration mismatch; originals preserved')
                checks[target.relative_to(self.root).as_posix()]=checksum
            for directory in (self.logs,self.cache,self.system,self.usage,self.generated):directory.mkdir(parents=True,exist_ok=True)
            document={'schema_version':2,'migrated_files':checks}
            atomic(marker,document)
            for snapshot,_ in database_copies:snapshot.unlink(missing_ok=True)
            return document

    def export_legacy(self,destination):
        """Export current data for an older installation, including post-upgrade edits."""
        destination=managed_path(destination)
        if destination.exists() and any(destination.iterdir()):raise ValueError('Rollback destination must be empty')
        backend=destination/'astra_ai/ui/backend';memory=destination/'astra_ai/memory'
        mappings={self.widget(name):backend/(name+'_widget_data') for name in ('search','news','theme','weather','calendar','task')}
        mappings.update({self.widget('notes'):backend/'noted_widget_data',self.generated:backend/'ai_generated_images',
                         self.system/'guest-memory':backend/'guest_memory'})
        for source,target in mappings.items():
            if source.exists():shutil.copytree(source,target,dirs_exist_ok=True)
        for name in ('action_jobs.json','speaker_profile.json','browser_operations.json','memory_presentation.json','user_preferences.json'):
            if (self.system/name).exists():
                backend.mkdir(parents=True,exist_ok=True);shutil.copy2(self.system/name,backend/name)
        for name in ('background_budget.json','research_gemini_budget.json','research_openai_budget.json'):
            if (self.usage/name).exists():
                memory.mkdir(parents=True,exist_ok=True);shutil.copy2(self.usage/name,memory/name)
        for name in ('workspace-sync.sqlite3','collaboration.sqlite3'):
            if (self.system/name).exists():
                memory.mkdir(parents=True,exist_ok=True)
                with closing(sqlite3.connect(self.system/name)) as src,closing(sqlite3.connect(memory/name)) as dst:
                    with dst:src.backup(dst)
        if (self.research/'catalog.json').exists():
            from astra_ai.core.research.storage import FolderResearchStore
            FolderResearchStore(self.research).export_legacy(memory/'research_artifacts/reports.json')
        return destination


runtime_paths=RuntimePaths()
