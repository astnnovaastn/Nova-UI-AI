import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { conversationSnapshot } from '../../conversation';
const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
export function usePdfCollaboration(page: string, file: string, revision: string, enabled = true) {
    const connection = useRef<{
        doc: Y.Doc;
        provider: WebsocketProvider;
        cache: IndexeddbPersistence;
        map: Y.Map<any>;
        undo: Y.UndoManager;
    } | null>(null);
    const [values, setValues] = useState<Record<string, any>>({}), [status, setStatus] = useState('Connecting shared overlays…');
    useEffect(() => {
        let gone = false;
        setValues({});
        if (!enabled) {
            setStatus('');
            return;
        }
        const seed = new Y.Doc();
        seed.getXmlFragment('default');
        void (async () => {
            try {
                const identifier = [page, file, revision].join(':'), r = await fetch('/api/research/' + identifier + '/collaboration', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Nova-Client': conversationSnapshot().clientId }, body: JSON.stringify({ schema: 'aegis-paper-v1', seed: encode(Y.encodeStateAsUpdate(seed)) }) }), data = await r.json();
                if (!r.ok)
                    throw Error(data.detail || 'Shared overlays unavailable.');
                if (gone)
                    return;
                const doc = new Y.Doc();
                Y.applyUpdate(doc, Uint8Array.from(atob(data.update), c => c.charCodeAt(0)));
                const map = doc.getMap('overlays');
                const cache = new IndexeddbPersistence('aegis-overlays:' + identifier + ':' + data.epoch, doc), provider = new WebsocketProvider((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/collaboration', identifier, doc, { params: { client: conversationSnapshot().clientId, epoch: data.epoch, schema: 'aegis-paper-v1' } });
                const undo = new Y.UndoManager(map, { trackedOrigins: new Set(['overlay-local']) });
                connection.current = { doc, cache, provider, map, undo };
                map.observe(() => { setValues(map.toJSON()); setStatus(provider.wsconnected ? 'Shared overlay saved' : 'Saved locally · reconnecting'); });
                provider.on('status', ({ status }: any) => setStatus(status === 'connected' ? 'Shared overlays connected' : 'Saved locally · reconnecting'));
                setValues(map.toJSON());
                setStatus('Shared overlays connected');
            }
            catch (e: any) {
                if (!gone)
                    setStatus(e.message);
            }
            finally {
                seed.destroy();
            }
        })();
        return () => { gone = true; const current = connection.current; connection.current = null; current?.provider.destroy(); void current?.cache.destroy(); current?.undo.destroy(); current?.doc.destroy(); };
    }, [page, file, revision, enabled]);
    useEffect(() => { const current = connection.current; if (current) {
        current.provider.params.client = conversationSnapshot().clientId;
        current.provider.disconnect();
        current.provider.connect();
    } }, [conversationSnapshot().clientId]);
    return { values, status, change: (object: string, property: string, value: any) => { const c = connection.current; if (c)
            c.doc.transact(() => c.map.set(object + ':' + property, value), 'overlay-local'); }, undo: () => connection.current?.undo.undo(), redo: () => connection.current?.undo.redo() };
}
