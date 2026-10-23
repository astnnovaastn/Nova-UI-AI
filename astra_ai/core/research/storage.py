"""Readable research folders with a recoverable, single-writer commit journal.

The catalogue is the commit marker. Every reader holds the same reentrant file
lock and recovers a committed intent before observing page files. SQLite CRDT
and conversation stores remain separately authoritative.
"""
from __future__ import annotations

import copy
import gzip
import hashlib
import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from astra_ai.memory.shared_memory import StorageLock, atomic, read


PAGE_FILES = {
    'artifacts': 'publication.json', 'requests': 'page.json',
    'drafts': 'drafts.json', 'draft_history': 'revisions/drafts.json',
    'report_history': 'revisions/publications.json', 'media': 'media.json',
    'attachments': 'attachments.json', 'extensions': 'extensions.json',
    'extension_activity': 'activity.json', 'extension_operations': 'operations.json',
    'removed': 'removal.json', 'thread_links': 'conversation-links.json',
}


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


def component(value):
    """IDs are never treated as user-supplied relative filesystem paths."""
    value = str(value)
    return value if len(value) == 32 and all(c in '0123456789abcdef' for c in value) else hashlib.sha256(value.encode()).hexdigest()[:32]


def managed_path(value):
    path = Path(value).resolve()
    return Path('\\\\?\\' + str(path)) if os.name == 'nt' and not str(path).startswith('\\\\?\\') else path


class ResearchBackups:
    def __init__(self, root):
        self.root = managed_path(root)
        self.lock = StorageLock(self.root / '.backup.lock')

    def snapshot(self, files, kind='daily', extend=False):
        """Content-addressed objects avoid copying unchanged images seven times."""
        with self.lock:
            label = datetime.now(timezone.utc).date().isoformat() if kind == 'daily' else 'pre-upgrade'
            target = self.root / kind / (label + '.json')
            if target.exists() and not extend:
                return target
            entries = read(target,{}).get('files',{}) if target.exists() else {}
            for name, path in sorted(files.items()):
                if name in entries:continue
                path = Path(path)
                if not path.is_file():
                    continue
                payload = path.read_bytes()
                checksum = hashlib.sha256(payload).hexdigest()
                obj = self.root / 'objects' / (checksum + '.gz')
                if not obj.exists():
                    obj.parent.mkdir(parents=True, exist_ok=True)
                    temporary = obj.with_suffix('.tmp')
                    with temporary.open('wb') as out:
                        out.write(gzip.compress(payload)); out.flush(); os.fsync(out.fileno())
                    os.replace(temporary, obj)
                # A corrupt object must never be certified as a recovery point.
                if hashlib.sha256(gzip.decompress(obj.read_bytes())).hexdigest() != checksum:
                    raise ValueError('Research backup verification failed')
                entries[name] = {'sha256': checksum, 'bytes': len(payload)}
            atomic(target, {'schema_version': 1, 'created': datetime.now(timezone.utc).isoformat(), 'files': entries})
            if kind == 'daily':
                for old in sorted(target.parent.glob('*.json'))[:-7]:
                    old.unlink()
            referenced = set()
            for folder in ('daily', 'migration'):
                for manifest in (self.root / folder).glob('*.json'):
                    referenced.update(row['sha256'] for row in read(manifest, {}).get('files', {}).values())
            for obj in (self.root / 'objects').glob('*.gz'):
                if obj.stem not in referenced:obj.unlink()
            return target

    def restore(self, manifest, destination):
        """Explicit restoration into an empty directory; never overwrite live state."""
        destination = managed_path(destination)
        if destination.exists() and any(destination.iterdir()):
            raise ValueError('Restore destination must be empty')
        for name, row in read(Path(manifest), {})['files'].items():
            path = (destination / name).resolve()
            if not path.is_relative_to(destination):
                raise ValueError('Unsafe backup member')
            payload = gzip.decompress((self.root / 'objects' / (row['sha256'] + '.gz')).read_bytes())
            if hashlib.sha256(payload).hexdigest() != row['sha256']:
                raise ValueError('Research backup checksum mismatch')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)


class FolderResearchStore:
    def __init__(self, root, backup_root=None):
        self.root = managed_path(root)
        self.path = self.root / 'catalog.json'
        self.lock = StorageLock(self.root / '.store.lock')
        self.backups = ResearchBackups(backup_root or self.root.parent / 'backups' / 'research')
        self._cache_stamp = None
        self._cache = None
        with self.lock:
            self.recover()

    def _target(self, relative):
        target = (self.root / relative).resolve()
        if not target.is_relative_to(self.root) or relative.startswith('.transactions'):
            raise ValueError('Unsafe research storage path')
        return target

    def recover(self):
        transactions = self.root / '.transactions'
        if not transactions.exists():
            return
        recovered=False
        for transaction in sorted(transactions.iterdir()):
            if not transaction.is_dir():
                continue
            if transaction.is_symlink() or not transaction.resolve().is_relative_to(transactions.resolve()):
                raise ValueError('Unsafe research transaction directory')
            intent = transaction / 'intent.json'
            if intent.exists():
                body = read(intent, {})
                # Catalogue is always applied last, after all page files.
                for relative, checksum in body['writes'].items():
                    self._target(relative)
                    source = transaction / 'files' / relative
                    if not source.is_file() or digest(read(source, {})) != checksum:
                        raise ValueError('Incomplete research transaction; original files preserved')
                for relative in body['writes']:
                    atomic(self._target(relative), read(transaction / 'files' / relative, {}))
            shutil.rmtree(transaction);recovered=True
        if recovered:self._cache_stamp = None

    def stamp(self):
        with self.lock:
            self.recover()
            stat = self.path.stat() if self.path.exists() else None
            return (stat.st_mtime_ns, stat.st_size) if stat else None

    def load(self):
        with self.lock:
            stamp = self.stamp()
            if self._cache is not None and stamp == self._cache_stamp:
                return copy.deepcopy(self._cache)
            catalog = read(self.path, {'collections': {'artifacts': {}, 'imports': {}}, 'pages': {}})
            data = copy.deepcopy(catalog['collections'])
            for identifier, meta in catalog['pages'].items():
                for collection, filename in PAGE_FILES.items():
                    if collection not in meta['collections']:
                        continue
                    row = read(self._target(meta['folder'] + '/' + filename), {})
                    if digest(row) != meta['hashes'][collection]:
                        raise ValueError('Research file changed outside the application: ' + filename)
                    if collection=='artifacts' and meta.get('evidence_hash'):
                        evidence=read(self._target(meta['folder']+'/evidence.json'),{})
                        if digest(evidence)!=meta['evidence_hash']:raise ValueError('Research evidence checksum mismatch')
                        row['value']['sources']=evidence['sources']
                    data.setdefault(collection, {})[identifier] = row['value']
            self._cache = copy.deepcopy(data); self._cache_stamp = stamp
            return data

    def write(self, data, backup=True):
        with self.lock:
            self.recover()
            old = read(self.path, {'sequence': 0, 'pages': {}})
            if backup and self.path.exists():
                self.backups.snapshot(self.files())
            rest = copy.deepcopy(data)
            identifiers = set()
            for name in PAGE_FILES:
                if isinstance(rest.get(name), dict):
                    identifiers.update(rest[name])
            catalog = {'schema_version': 1, 'sequence': old['sequence'] + 1, 'pages': {}, 'collections': {}}
            writes = {}
            sessions = {}
            for identifier in sorted(identifiers):
                item = data.get('requests', {}).get(identifier) or data.get('artifacts', {}).get(identifier, {})
                session = item.get('research_session_id') or identifier
                base = 'conversations/' + component(session)
                folder = base + '/pages/' + component(identifier)
                meta = {'folder': folder, 'session_id': session, 'collections': [], 'hashes': {}}
                sessions.setdefault(session, []).append(identifier)
                for collection, filename in PAGE_FILES.items():
                    if identifier not in data.get(collection, {}):
                        continue
                    item_value=rest[collection].pop(identifier)
                    if collection=='artifacts' and 'sources' in item_value:
                        evidence={'schema_version':1,'sources':item_value.pop('sources')}
                        meta['evidence_hash']=digest(evidence)
                        if old.get('pages',{}).get(identifier,{}).get('evidence_hash')!=meta['evidence_hash'] or old.get('pages',{}).get(identifier,{}).get('folder')!=folder:
                            writes[folder+'/evidence.json']=evidence
                    value = {'schema_version': 1, 'value': item_value}
                    checksum = digest(value)
                    meta['collections'].append(collection); meta['hashes'][collection] = checksum
                    relative = folder + '/' + filename
                    if old.get('pages', {}).get(identifier, {}).get('hashes', {}).get(collection) != checksum or old.get('pages', {}).get(identifier, {}).get('folder') != folder:
                        writes[relative] = value
                catalog['pages'][identifier] = meta
            for session, pages in sessions.items():
                relative = 'conversations/' + component(session) + '/conversation.json'
                value = {'schema_version': 1, 'research_session_id': session, 'thread_id': 'research-' + session, 'page_ids': pages}
                if not self._target(relative).exists() or read(self._target(relative), {}) != value:
                    writes[relative] = value
            catalog['collections'] = rest
            writes['catalog.json'] = catalog
            transaction = self.root / '.transactions' / uuid.uuid4().hex
            for relative, value in writes.items():
                atomic(transaction / 'files' / relative, value)
            atomic(transaction / 'intent.json', {'writes': {name: digest(value) for name, value in writes.items()}})
            self.recover()
            self._cache = copy.deepcopy(data); self._cache_stamp = self.stamp()

    def files(self):
        result = {}
        if self.path.exists():
            result['catalog.json'] = self.path
            catalog = read(self.path, {})
            for meta in catalog.get('pages', {}).values():
                for collection in meta['collections']:
                    relative = meta['folder'] + '/' + PAGE_FILES[collection]
                    result[relative] = self._target(relative)
                if meta.get('evidence_hash'):
                    relative=meta['folder']+'/evidence.json';result[relative]=self._target(relative)
                base = meta['folder'].split('/pages/')[0] + '/conversation.json'
                result[base] = self._target(base)
            for assets in (self.root/'conversations').glob('*/assets'):
                for path in assets.rglob('*'):
                    if path.is_file():result[path.relative_to(self.root).as_posix()] = path
        return result

    def migrate(self, legacy):
        legacy = managed_path(legacy)
        with StorageLock(legacy.with_suffix('.lock')), self.lock:
            if self.path.exists():
                return {'status': 'already_migrated', 'pages': len(read(self.path, {})['pages'])}
            data = read(legacy, {'artifacts': {}, 'imports': {}})
            files = {'legacy/reports.json': legacy}
            history = legacy.with_name(legacy.stem + '.history.json')
            if history.exists():
                files['legacy/history.json'] = history
                data['history_metadata'] = read(history, {})
            # Originals are included in the protected recovery snapshot.
            assets = legacy.parent / 'attachments'
            if assets.exists():
                for path in assets.rglob('*'):
                    if path.is_file(): files['legacy/attachments/' + path.relative_to(assets).as_posix()] = path
            self.backups.snapshot(files, 'migration')
            if assets.exists():
                for source in assets.rglob('*'):
                    if not source.is_file():continue
                    relative=source.relative_to(assets);identifier=relative.parts[0]
                    row=data.get('requests',{}).get(identifier) or data.get('artifacts',{}).get(identifier,{})
                    session=row.get('research_session_id') or identifier
                    target = self.root/'conversations'/component(session)/'assets'/component(identifier)/Path(*relative.parts[1:])
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if not target.exists():shutil.copy2(source, target)
                    if hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(target.read_bytes()).digest():
                        raise ValueError('Research attachment migration mismatch')
            self.write(data, backup=False)
            if self.load() != data:
                raise ValueError('Research migration verification failed')
            return {'status': 'migrated', 'pages': len(read(self.path, {})['pages'])}

    def asset_folder(self,identifier,file_id):
        with self.lock:
            self.recover();meta=read(self.path,{}).get('pages',{}).get(identifier)
            if not meta:raise ValueError('Research asset owner unavailable')
            return self._target('conversations/'+component(meta['session_id'])+'/assets/'+component(identifier)+'/'+component(file_id))

    def export_legacy(self, destination):
        destination = managed_path(destination)
        if destination.exists():
            raise ValueError('Rollback export must not overwrite an existing store')
        data = self.load(); history = data.pop('history_metadata', {})
        atomic(destination, data)
        atomic(destination.with_name(destination.stem + '.history.json'), history)
        catalog=read(self.path,{})
        for identifier,meta in catalog['pages'].items():
            assets=self.root/'conversations'/component(meta['session_id'])/'assets'/component(identifier)
            for source in assets.rglob('*'):
                if source.is_file():
                    target=destination.parent/'attachments'/identifier/source.relative_to(assets)
                    target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
        return destination
