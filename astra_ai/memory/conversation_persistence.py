"""Conversation persistence helpers

Provides functions to append conversation messages to the project's
memory JSON (`data/nova_ai_memory.json`) with backups and provenance.
"""
from __future__ import annotations
import json
import os
import shutil
from datetime import datetime, timezone
from typing import Dict, Any, List

DEFAULT_MEMORY_PATH = os.path.join('data', 'nova_ai_memory.json')
BACKUP_DIR = os.path.join('data', 'backups')


def _load_memory(path: str = DEFAULT_MEMORY_PATH) -> Dict[str, Any]:
    if not os.path.exists(path):
        # create minimal structure if missing
        base = {
            'memory_events': [],
            'conversation': [],
            'fact_history': {},
        }
        return base
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def _make_backup(path: str = DEFAULT_MEMORY_PATH) -> None:
    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        if os.path.exists(path):
            ts = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            dst = os.path.join(BACKUP_DIR, f'nova_ai_memory.{ts}.json')
            shutil.copy2(path, dst)
    except Exception:
        # never raise from backup failure; best-effort
        pass


def append_conversation_messages(messages: List[Dict[str, Any]], memory_path: str = DEFAULT_MEMORY_PATH) -> None:
    """Append conversation messages to the memory file.

    Each message should be a dict like: {"role": "user"|"assistant", "content": str, "timestamp": ISO8601, "session_id": str}
    The function will create a backup, load the JSON, append messages to `conversation`, and write the file.
    It will also update `memory_events` with lightweight ADD events for traceability.
    """
    if not messages:
        return

    _make_backup(memory_path)

    data = _load_memory(memory_path)

    if 'conversation' not in data:
        data['conversation'] = []
    if 'memory_events' not in data:
        data['memory_events'] = []

    for msg in messages:
        # normalize message
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        ts = msg.get('timestamp') or datetime.now(timezone.utc).isoformat()
        session_id = msg.get('session_id')

        conv_item = {
            'role': role,
            'content': content,
            'timestamp': ts,
        }
        if session_id:
            conv_item['session_id'] = session_id

        data['conversation'].append(conv_item)

        # Add a lightweight memory event to keep traceability
        try:
            add_evt = {
                'type': 'ADD',
                'summary': content if len(content) < 500 else content[:500] + '...',
                'timestamp': ts,
                'importance_score': 0.5,
                'confidence': 0.5,
                'category': None,
                'provenance': {
                    'source': 'conversation_persistence',
                    'session_id': session_id,
                    'role': role
                }
            }
            data['memory_events'].append(add_evt)
        except Exception:
            # best-effort; don't abort the loop
            pass

    # write back
    tmp = memory_path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, memory_path)


def append_single_message(role: str, content: str, session_id: str = None, timestamp: str = None, memory_path: str = DEFAULT_MEMORY_PATH) -> None:
    append_conversation_messages([
        {
            'role': role,
            'content': content,
            'session_id': session_id,
            'timestamp': timestamp or datetime.now(timezone.utc).isoformat()
        }
    ], memory_path=memory_path)
