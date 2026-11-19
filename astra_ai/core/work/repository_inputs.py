"""Read-only source excerpts from host-configured repositories. Never executes project code.

V33: besides AEGIS_WORK_REPOSITORIES, the folders (and single files) the person chose in AEGIS Desktop's
native Open Folder / Open File dialog (authorized_folders.py). Discovery goes through repo_index.RepoIndex:
.gitignore and build folders are honoured, files are size- and type-limited, and the listing is deterministic.
"""
import hashlib
import json
import os
import re
from pathlib import Path

from . import authorized_folders
from .repo_index import Limits, RepoIndex

class RepositoryError(ValueError):
    pass

BLOCKED={'.git','.env','.aws','.ssh','.codex','.agents','node_modules','.venv','venv','__pycache__','dist','build'}
SUFFIXES={'.py','.ts','.tsx','.js','.jsx','.mjs','.cjs','.svelte','.vue','.rs','.go','.java','.c','.h','.cpp','.cs','.css','.scss','.html','.md','.txt','.json','.toml','.yaml','.yml','.sql','.patch','.diff'}

class RepositoryInputs:
    def __init__(self,settings,grants_file=None):
        self.settings=settings
        self.grants_file=Path(grants_file) if grants_file else authorized_folders.grants_file(settings)

    def configured(self):
        try:config=json.loads(self.settings('AEGIS_WORK_REPOSITORIES') or '{}')
        except (ValueError,TypeError):return {}
        if not isinstance(config,dict):return {}
        result={}
        for name,value in list(config.items())[:12]:
            if not re.fullmatch(r'[a-zA-Z0-9_-]{1,40}',name) or not isinstance(value,str):continue
            path=Path(value)
            if path.is_absolute() and path.is_dir():
                result[name]=path.resolve()
        return result

    def grants(self):
        """The person's own choices in the desktop dialog; a configured name wins over a grant with the same id."""
        configured=self.configured()
        return {k:v for k,v in authorized_folders.load(self.grants_file).items() if k not in configured}

    def roots(self):
        return {**self.configured(),**{k:g['path'] for k,g in self.grants().items()}}

    def grant(self,name):
        """How a repository was made available: configured by the host (read-only) or chosen by the person."""
        if name in self.configured():return {'id':name,'source':'configured','write':False,'only':None}
        found=self.grants().get(name)
        if not found:raise RepositoryError('repository_not_configured')
        return {**found,'source':'authorized'}

    @staticmethod
    def allowed(relative):
        if not isinstance(relative,str) or len(relative)>400 or ':' in relative or '\\' in relative:return False
        parts=Path(relative).parts
        return bool(parts) and not any(p in ('.','..') or p.lower() in BLOCKED or p.startswith('.') for p in parts) and Path(relative).suffix.lower() in SUFFIXES and not any(w in Path(relative).name.lower() for w in ('credential','secret','token','password','private-key'))

    def root(self,name):
        roots=self.roots()
        if name not in roots:raise RepositoryError('repository_not_configured')
        return roots[name]

    def index(self,name,should_stop=None,limits=None):
        grant=self.grant(name)
        return RepoIndex(self.root(name),suffixes=SUFFIXES,should_stop=should_stop,only=grant.get('only'),
                         limits=limits or Limits(),cache_path=self.cache_path(name))

    def cache_path(self,name):
        folder=self.grants_file.parent
        if not folder.is_dir():return None
        key=hashlib.sha256((name+'|'+str(self.root(name))).encode()).hexdigest()[:24]
        return folder/'repo-index'/(key+'.json')

    def list(self):
        rows=[{'id':name,'title':root.name} for name,root in self.configured().items()]
        rows+=[{'id':g['id'],'title':g['title'],'source':'authorized','write':g['write'],**({'files':g['only']} if g['only'] else {})} for g in self.grants().values()]
        return {'repositories':rows,
                'capabilities':['repository_read'] if rows else [],
                'execution_available':False,'edits_available':any(g['write'] for g in self.grants().values())}

    def files(self,name,limit=1000):
        index=self.index(name)
        scan=index.scan()
        # Breadth first, so a large repository keeps its top-level structure inside the limit; then sorted.
        paths=[p for p in sorted(index.paths(),key=lambda p:(p.count('/'),p)) if self.allowed(p)]
        truncated=scan.truncated or len(paths)>limit
        return {'files':sorted(paths[:limit]),'truncated':truncated,'total':len(paths),
                'skipped':dict(sorted(scan.skipped.items())),'errors':scan.errors[:20]}

    def read(self,name,relative,start=1,end=120):
        root=self.root(name)
        if not isinstance(relative,str) or Path(relative).is_absolute() or not self.allowed(relative):
            raise RepositoryError('source_path_not_allowed')
        candidate=root/relative
        path=candidate.resolve()
        if not path.is_relative_to(root) or candidate.is_symlink() or not path.is_file():
            raise RepositoryError('source_path_not_allowed')
        if self.grants().get(name) and self.index(name).path_ignored(relative):
            raise RepositoryError('source_path_not_allowed')
        try:
            start=int(start);end=int(end)
            if start<1 or end<start or end-start>=200:raise ValueError()
        except (ValueError,TypeError):raise RepositoryError('choose_up_to_200_lines') from None
        with path.open('rb') as stream:raw=stream.read(512001)
        if len(raw)>512000:raise RepositoryError('source_file_too_large')
        try:text=raw.decode('utf-8-sig')
        except UnicodeError:raise RepositoryError('source_is_not_utf8_text') from None
        if '\x00' in text:raise RepositoryError('source_is_not_text')
        lines=text.splitlines()
        if start>max(1,len(lines)):raise RepositoryError('line_range_outside_file')
        selected='\n'.join(f'{i}: {line}' for i,line in enumerate(lines[start-1:end],start))
        if len(selected)>11000:raise RepositoryError('choose_a_shorter_line_range')
        # Source content stays inert. Its digest identifies the read revision; no model-selected path is read.
        return {'id':'repository:'+name+':'+relative+':'+str(start),'kind':'code','title':relative,
                'summary':selected,'start':start,'end':min(end,len(lines)),'total_lines':len(lines),
                'sha256':hashlib.sha256(raw).hexdigest(),'repository':name,'read_only':True}
