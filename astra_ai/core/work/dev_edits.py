"""V33: proposed edits to a folder the person authorized, saved only after they approve that exact change.

- A proposal names one existing text file, the revision it was made against (sha256) and the new text.
  It is stored with its unified diff and an approval token (the digest of the whole proposal).
- Saving needs: a grant that allows saving (chosen in the desktop dialog), the same approval token,
  and an unchanged file. The write is atomic (temp file in the same folder, then replace); the previous
  text stays in the record so the person can see what was replaced.
- Nothing is executed. Tests run only through IsolatedWorkspace (Docker), after their own approval.
"""
from __future__ import annotations

import difflib
import hashlib
import json
import re
import threading
import time
import uuid
from pathlib import Path

from .repo_index import parse_unified_diff
from .repository_inputs import RepositoryError, RepositoryInputs


def _sha(data):
    return hashlib.sha256(data).hexdigest()


class ReviewedEdits:
    def __init__(self, state_dir, repositories: RepositoryInputs):
        self.root = Path(state_dir) / 'reviewed-edits'
        self.repositories = repositories
        self.lock = threading.RLock()

    def _folder(self, owner):
        return self.root / _sha(str(owner).encode())[:32]

    def _record_path(self, owner, edit_id):
        if not re.fullmatch(r'[a-f0-9]{32}', edit_id or ''):
            raise ValueError('invalid_edit')
        return self._folder(owner) / (edit_id + '.json')

    def _target(self, repository, relative):
        grant = self.repositories.grant(repository)
        if grant.get('source') != 'authorized' or not grant.get('write'):
            raise RepositoryError('saving_not_authorized_for_this_folder')
        if not self.repositories.allowed(relative):
            raise RepositoryError('source_path_not_allowed')
        index = self.repositories.index(repository)
        if index.path_ignored(relative):
            raise RepositoryError('source_path_not_allowed')
        path = index._within(relative)
        if path is None:
            raise RepositoryError('source_path_not_allowed')
        raw = path.read_bytes()
        if len(raw) > 512_000 or b'\x00' in raw:
            raise RepositoryError('choose_a_smaller_text_file')
        return path, raw

    def propose(self, owner, repository, relative, text, base_sha, reason=''):
        if not isinstance(text, str) or len(text.encode('utf-8')) > 512_000:
            raise ValueError('edit_too_large')
        path, raw = self._target(repository, relative)
        if _sha(raw) != base_sha:
            raise RepositoryError('source_changed_read_it_again')
        before = raw.decode('utf-8')
        if before == text:
            raise ValueError('no_change')
        diff = ''.join(difflib.unified_diff(before.splitlines(True), text.splitlines(True), 'a/' + relative, 'b/' + relative, n=3))
        record = {'id': uuid.uuid4().hex, 'repository': repository, 'path': relative, 'base_sha': base_sha,
                  'after_sha': _sha(text.encode('utf-8')), 'before': before, 'after': text, 'reason': str(reason)[:400],
                  'diff': diff, 'status': 'awaiting_approval', 'created': time.time()}
        record['approval'] = _sha(json.dumps({k: record[k] for k in ('id', 'repository', 'path', 'base_sha', 'after_sha')}, sort_keys=True).encode())
        with self.lock:
            target = self._record_path(owner, record['id'])
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(record), encoding='utf-8')
        return self.public(record)

    @staticmethod
    def public(record):
        git_style = 'diff --git a/{0} b/{0}\n'.format(record['path']) + record['diff']
        return {**{k: record[k] for k in ('id', 'repository', 'path', 'base_sha', 'after_sha', 'reason', 'diff', 'status', 'approval') if k in record},
                'files': parse_unified_diff(git_style), **({'saved_at': record['saved_at']} if record.get('saved_at') else {})}

    def get(self, owner, edit_id):
        try:
            return json.loads(self._record_path(owner, edit_id).read_text(encoding='utf-8'))
        except FileNotFoundError:
            raise ValueError('edit_not_found') from None

    def apply(self, owner, edit_id, approval):
        with self.lock:
            record = self.get(owner, edit_id)
            if record['status'] != 'awaiting_approval' or approval != record['approval']:
                raise ValueError('edit_changed_or_already_decided')
            path, raw = self._target(record['repository'], record['path'])
            if _sha(raw) != record['base_sha']:
                raise RepositoryError('source_changed_nothing_saved')
            temp = path.with_name(path.name + '.aegis-' + edit_id + '.tmp')
            try:
                with temp.open('x', encoding='utf-8', newline='') as out:
                    out.write(record['after'])
                if _sha(path.read_bytes()) != record['base_sha']:
                    raise RepositoryError('source_changed_nothing_saved')
                temp.replace(path)
            finally:
                temp.unlink(missing_ok=True)
            record.update(status='saved', saved_at=time.time())
            self._record_path(owner, edit_id).write_text(json.dumps(record), encoding='utf-8')
            return self.public(record)

    def discard(self, owner, edit_id):
        with self.lock:
            record = self.get(owner, edit_id)
            if record['status'] == 'awaiting_approval':
                record['status'] = 'discarded'
                self._record_path(owner, edit_id).write_text(json.dumps(record), encoding='utf-8')
            return self.public(record)
