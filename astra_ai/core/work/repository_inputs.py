"""Read-only source excerpts from host-configured repositories. Never executes project code."""
import hashlib
import json
import os
import re
from pathlib import Path

class RepositoryError(ValueError):
    pass

BLOCKED={'.git','.env','.aws','.ssh','.codex','.agents','node_modules','.venv','venv','__pycache__','dist','build'}
SUFFIXES={'.py','.ts','.tsx','.js','.jsx','.mjs','.cjs','.svelte','.vue','.rs','.go','.java','.c','.h','.cpp','.cs','.css','.scss','.html','.md','.txt','.json','.toml','.yaml','.yml','.sql'}

class RepositoryInputs:
    def __init__(self,settings):self.settings=settings

    def roots(self):
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

    @staticmethod
    def allowed(relative):
        if not isinstance(relative,str) or len(relative)>400 or ':' in relative or '\\' in relative:return False
        parts=Path(relative).parts
        return bool(parts) and not any(p in ('.','..') or p.lower() in BLOCKED or p.startswith('.') for p in parts) and Path(relative).suffix.lower() in SUFFIXES and not any(w in Path(relative).name.lower() for w in ('credential','secret','token','password','private-key'))

    def root(self,name):
        roots=self.roots()
        if name not in roots:raise RepositoryError('repository_not_configured')
        return roots[name]

    def list(self):
        return {'repositories':[{'id':name,'title':root.name} for name,root in self.roots().items()],
                'capabilities':['repository_read'] if self.roots() else [],
                'execution_available':False,'edits_available':False}

    def files(self,name):
        root=self.root(name);found=[];visited=0;truncated=False
        for current,dirs,files in os.walk(root,followlinks=False):
            visited+=1
            dirs[:]=sorted(d for d in dirs if d.lower() not in BLOCKED and not d.startswith('.') and not (Path(current)/d).is_symlink() and not (Path(current)/d).is_junction())
            for filename in sorted(files):
                path=Path(current)/filename;relative=path.relative_to(root).as_posix()
                if self.allowed(relative) and not path.is_symlink() and path.resolve().is_relative_to(root):
                    found.append(relative)
                    if len(found)>=1000:truncated=True;break
            if truncated or visited>=3000:truncated=True;break
        return {'files':found,'truncated':truncated}

    def read(self,name,relative,start=1,end=120):
        root=self.root(name)
        if not isinstance(relative,str) or Path(relative).is_absolute() or not self.allowed(relative):
            raise RepositoryError('source_path_not_allowed')
        candidate=root/relative
        path=candidate.resolve()
        if not path.is_relative_to(root) or candidate.is_symlink() or not path.is_file():
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

