"""V33: folders and files the person chose in AEGIS Desktop's own Open Folder / Open File dialog.

Only the desktop process writes the grants file, right after a native dialog the person answered
(desktop/work-dev.cjs). The backend only reads it: no web request can add a path. A grant is read-only
unless the person also allowed saving approved changes in that dialog. Revoking removes the row.

File: state/work/authorized_folders.json, or AEGIS_WORK_AUTHORIZED_FOLDERS_FILE.
{"version": 1, "folders": [{"id", "path", "title", "write", "only", "granted_at", "via"}]}
"""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

DEFAULT_FILE = Path(__file__).resolve().parents[3] / 'state' / 'work' / 'authorized_folders.json'
ID = re.compile(r'^[a-zA-Z0-9_-]{1,40}$')


def grants_file(settings=None):
    explicit = ''
    if settings:
        try:
            explicit = settings('AEGIS_WORK_AUTHORIZED_FOLDERS_FILE') or ''
        except Exception:
            explicit = ''
    explicit = explicit or os.environ.get('AEGIS_WORK_AUTHORIZED_FOLDERS_FILE', '')
    return Path(explicit) if explicit else DEFAULT_FILE


def refused(path):
    """Folders too broad to hand over as a project: a drive root, the home folder itself, system folders."""
    path = Path(path)
    if path.parent == path:
        return 'drive_root'
    home = Path.home().resolve()
    if path == home or home.is_relative_to(path):
        return 'home_folder'
    windir = Path(os.environ.get('WINDIR', 'C:/Windows')).resolve()
    for system in (windir, Path(os.environ.get('ProgramFiles', 'C:/Program Files')), Path(os.environ.get('ProgramFiles(x86)', 'C:/Program Files (x86)'))):
        try:
            if path == system.resolve() or path.is_relative_to(system.resolve()):
                return 'system_folder'
        except OSError:
            continue
    return ''


def load(path):
    """id -> grant. Rows that are malformed, gone or too broad are left out."""
    try:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}
    rows = data.get('folders') if isinstance(data, dict) else None
    out = {}
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict) or not ID.match(str(row.get('id', ''))) or not isinstance(row.get('path'), str):
            continue
        folder = Path(row['path'])
        try:
            if not folder.is_absolute() or not folder.is_dir():
                continue
            folder = folder.resolve()
        except OSError:
            continue
        if refused(folder):
            continue
        only = row.get('only')
        only = sorted({p for p in only if isinstance(p, str) and p and '..' not in p.split('/') and '\\' not in p})[:50] if isinstance(only, list) else None
        out[row['id']] = {'id': row['id'], 'path': folder, 'title': str(row.get('title') or folder.name)[:80],
                          'write': row.get('write') is True, 'only': only or None,
                          'granted_at': row.get('granted_at'), 'via': str(row.get('via') or '')[:40]}
        if len(out) >= 24:
            break
    return out


def save(path, grants):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = [{'id': g['id'], 'path': str(g['path']), 'title': g['title'], 'write': bool(g.get('write')),
             **({'only': g['only']} if g.get('only') else {}), 'granted_at': g.get('granted_at') or time.time(),
             'via': g.get('via') or 'desktop_dialog'} for g in grants.values()]
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps({'version': 1, 'folders': rows}, indent=1), encoding='utf-8')
    temp.replace(path)


def revoke(path, grant_id):
    grants = load(path)
    if grants.pop(grant_id, None) is None:
        return False
    save(path, grants)
    return True
