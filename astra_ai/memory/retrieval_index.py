"""Disposable FTS index. Synchronize changed rows, never rewrite authority."""
import copy
import hashlib
import json
import sqlite3

VERSION = 2


def source_rows(manager):
    from .shared_memory import canonical, normal, stable
    from .category_registry import registry
    loaded = manager.read_snapshot()
    terms = {}
    for section in ('entities',):
        for entity in loaded.get('entity_graph', {}).get(section, {}).values():
            if entity.get('state') == 'active':
                for rid in entity.get('member_ids', []):
                    terms.setdefault(rid, []).extend([entity.get('label', ''), *entity.get('aliases', [])])
    for topic in loaded.get('topic_groups', {}).values():
        if topic.get('state') == 'active':
            for rid in topic.get('member_ids', []):
                terms.setdefault(rid, []).append(topic.get('label', ''))
    categories = registry({'category_registry': copy.deepcopy(loaded.get('category_registry', {}))})
    rows = {}
    for record in loaded.get('records', {}).values():
        category = categories.get(record.get('category')); seen = set()
        while category and category['id'] not in seen:
            seen.add(category['id'])
            terms.setdefault(record['id'], []).extend([category['label'], *category.get('aliases', [])])
            category = categories.get(category.get('parent_id'))
        text = ' '.join(terms.get(record['id'], [])) + ' ' + str(record.get('key', '')) + ' ' + canonical(record.get('value')) + ' ' + record.get('category', '') + ' ' + str(record.get('event_type', ''))
        rows[record['id']] = (text, canonical(record))
    hidden = [normal(str(r.get('value', ''))) for r in loaded.get('forgotten_records', {}).values() if len(str(r.get('value', '')).strip()) >= 4]
    for message in manager._messages():
        if any(value in normal(message.get('content', '')) for value in hidden):
            continue
        rid = message.get('id') or stable(message.get('role'), message.get('content'), message.get('timestamp'), message.get('session_id'))
        record = {**message, 'id': rid, 'kind': 'conversation', 'source': message.get('source', 'conversation'), 'updated': message.get('timestamp', '')}
        rows.setdefault(rid, (str(message.get('content', '')), canonical(record)))
    for summary in loaded['_meta'].get('episodic_summaries', {}).values():
        refs = summary.get('source_ids', [])
        source = loaded['records'].get(refs[0]) if len(refs) == 1 else None
        if not source or source.get('revision', 1) != summary.get('source_revision'):
            continue
        record = {**source, 'id': summary['id'], 'kind': 'summary', 'source': 'organizer_summary', 'value': summary['summary'], 'content': summary['summary'], 'source_ids': refs, 'source_refs': [{'record_id': rid} for rid in refs], 'source_revision': summary['source_revision'], 'summary_created': summary['created'], 'history': [], 'attributes': {**source.get('attributes', {}), 'derived_summary': True}}
        rows[record['id']] = (summary['summary'], canonical(record))
    return rows


def synchronize(manager):
    from .shared_memory import canonical
    signature = canonical(manager._signature())
    conn = sqlite3.connect(manager.index_path, timeout=5)
    try:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('CREATE VIRTUAL TABLE IF NOT EXISTS recall USING fts5(id UNINDEXED, text, payload UNINDEXED)')
        conn.execute('CREATE TABLE IF NOT EXISTS metadata (signature TEXT)')
        conn.execute('CREATE TABLE IF NOT EXISTS source_hashes (id TEXT PRIMARY KEY, digest TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS index_version (version INTEGER)')
        current = conn.execute('SELECT signature FROM metadata').fetchone()
        version = conn.execute('SELECT version FROM index_version').fetchone()
        if current and current[0] == signature and version == (VERSION,):
            return conn
        rows = source_rows(manager)
        old = dict(conn.execute('SELECT id, digest FROM source_hashes'))
        rebuilding = version != (VERSION,)
        changed = []
        hashes = []
        for rid, (text, payload) in rows.items():
            digest = hashlib.sha256((text + '\0' + payload).encode()).hexdigest()
            if rebuilding or old.get(rid) != digest:
                changed.append((rid, text, payload)); hashes.append((rid, digest))
        removed = set(old) - rows.keys()
        with conn:
            if rebuilding:
                conn.execute('DELETE FROM recall'); conn.execute('DELETE FROM source_hashes')
            else:
                conn.executemany('DELETE FROM recall WHERE id=?', [(rid,) for rid in removed | {r[0] for r in changed}])
                conn.executemany('DELETE FROM source_hashes WHERE id=?', [(rid,) for rid in removed])
            conn.executemany('INSERT INTO recall VALUES (?,?,?)', changed)
            conn.executemany('INSERT OR REPLACE INTO source_hashes VALUES (?,?)', hashes)
            conn.execute('DELETE FROM metadata'); conn.execute('INSERT INTO metadata VALUES (?)', (signature,))
            conn.execute('DELETE FROM index_version'); conn.execute('INSERT INTO index_version VALUES (?)', (VERSION,))
        manager._index_stats = {'changed': len(changed), 'removed': len(removed), 'total': len(rows), 'rebuilt': rebuilding}
        return conn
    except Exception:
        conn.close()
        raise


def indexed_sources(manager):
    with manager._lock:
        signature = manager._signature()
        cache = getattr(manager, '_indexed_source_cache', None)
        if cache and cache[0] == signature:return cache[1]
        conn = manager._index()
        try:
            sources = [json.loads(row[0]) for row in conn.execute('SELECT payload FROM recall')]
            manager._indexed_source_cache = (manager._signature(), sources)
            return sources
        finally:
            conn.close()
