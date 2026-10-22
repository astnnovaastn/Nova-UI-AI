import { setSoundArbiter } from './notifications';
import type { AegisSocket } from './ws';
import { conversationSnapshot, conversationMessage, conversationResearch, uiSnapshot } from './conversation';
// @ts-expect-error Theme module is shared with the existing JavaScript theme editor.
import { applyTheme } from './components/Theme/theme.js';
// Migrate saved view preferences once; navigation and camera state belong to this window.
for (const key of ['nova-current-workspace', 'nova-memory-camera-v2', 'nova-memory-chat-spherical']) {
    try {
        if (sessionStorage.getItem(key) === null && typeof localStorage !== 'undefined') {
            const value = localStorage.getItem(key);
            if (value !== null) sessionStorage.setItem(key, value);
        }
    } catch {}
}
export let windowId = sessionStorage.getItem('aegis-window-id') || crypto.randomUUID();
sessionStorage.setItem('aegis-window-id', windowId);
let client = '', voice: any = null, connected = false, lastAck = 0, sequence = 0, bootId = '', applying = false;
let request: ((ok: boolean) => void) | null = null;
const revisions = new Map<string, number>();
export function ownsVoice() { return connected && voice?.client_id === client && Date.now() - lastAck < 12000; }
export function voiceOwner() { return voice; }
export function acquireVoice(socket: AegisSocket) { return new Promise<boolean>(resolve => { if (!connected)
    return resolve(false); request = resolve; socket.send({ type: 'workspace_voice_acquire' }); setTimeout(() => { if (request === resolve) {
    request = null;
    resolve(false);
} }, 5000); }); }
export function releaseVoice(socket: AegisSocket) { voice = null; socket.send({ type: 'workspace_voice_release' }); }
function event(payload: any) {
    const next = Number(payload.sequence) || 0, key = payload.resource + ':' + (payload.entity_id || '');
    if (next <= (revisions.get(key) || 0))
        return;
    revisions.set(key, next);
    sequence = Math.max(sequence, next);
    if (payload.resource === 'theme' && payload.data?.theme) {
        applying = true;
        try {
            applyTheme(payload.data.theme);
        }
        finally {
            applying = false;
        }
    }
    if (payload.resource === 'research')
        window.dispatchEvent(new CustomEvent('nova-research-refresh', { detail: { ...payload.data, research_id: payload.entity_id } }));
    if (payload.resource === 'memory')
        window.dispatchEvent(new Event('nova-memory-changed'));
    if (payload.resource === 'preferences')
        window.dispatchEvent(new Event('nova-preferences-changed'));
    if (payload.resource === 'widgets')
        window.dispatchEvent(new Event('nova-widget-data-changed'));
}
export function startWorkspaceSync(socket: AegisSocket) {
    const sounds = new Map<string, (value: boolean) => void>();
    setSoundArbiter(key => new Promise<boolean>(resolve => { if (!connected) {
        resolve(false);
        return;
    } const id = crypto.randomUUID(); sounds.set(id, resolve); socket.send({ type: 'workspace_sound_claim', key, request_id: id }); setTimeout(() => { sounds.delete(id); resolve(false); }, 2000); }));
    const hello = () => socket.send({ type: 'workspace_hello', window_id: windowId, label: 'Window ' + windowId.slice(0, 4), conversation_id: conversationSnapshot().sessionId, since: sequence, boot_id: bootId });
    const lose = () => { voice = null; window.dispatchEvent(new Event('nova-voice-lease-lost')); };
    socket.onOpen(() => { connected = true; lastAck = Date.now(); });
    socket.onClose(() => { connected = false; lose(); request?.(false); request = null; });
    socket.onMessage((m: any) => {
        if (m.type === 'status' && m.client_id) {
            client = String(m.client_id);
            hello();
        }
        if (m.type === 'workspace_identity_conflict') {
            windowId = crypto.randomUUID();
            sessionStorage.setItem('aegis-window-id', windowId);
            hello();
            return;
        }
        if (m.type === 'workspace_bootstrap') {
            bootId = String(m.boot_id || '');
            for (const e of m.events || [])
                event(e);
            sequence = Math.max(sequence, Number(m.sequence) || 0);
            if (m.theme) {
                applying = true;
                try {
                    applyTheme(m.theme);
                }
                finally {
                    applying = false;
                }
            }
            if (m.reconcile) {
                window.dispatchEvent(new CustomEvent('nova-research-refresh', { detail: { research_id: uiSnapshot().research_id } }));
                window.dispatchEvent(new Event('nova-memory-changed'));
            }
        }
        if (m.type === 'workspace_sound_result') {
            sounds.get(m.request_id)?.(m.allowed === true);
            sounds.delete(m.request_id);
        }
        if (m.type === 'workspace_event')
            event(m);
        if (m.type === 'workspace_presence' || m.type === 'workspace_bootstrap') {
            voice = m.voice;
            window.dispatchEvent(new CustomEvent('nova-workspace-presence', { detail: m }));
        }
        if (m.type === 'workspace_heartbeat_ack') {
            lastAck = Date.now();
            const owned = ownsVoice();
            voice = m.voice;
            if (owned && !ownsVoice())
                lose();
            for (const e of m.events || [])
                event(e);
            if (m.reconcile)
                hello();
        }
        if (m.type === 'workspace_voice_result') {
            voice = m.owner || null;
            lastAck = Date.now();
            request?.(m.granted === true);
            request = null;
            window.dispatchEvent(new CustomEvent('nova-workspace-voice', { detail: m }));
        }
        if (m.type === 'workspace_voice_denied') {
            lose();
            window.dispatchEvent(new CustomEvent('nova-workspace-voice', { detail: m }));
        }
        if (m.type === 'workspace_chat') {
            const msg = m.message || {}, rid = String(msg.request_id || msg.turn_id || ''), research = String(msg.research_id || '');
            if (research && uiSnapshot().research_id !== m.page_id)
                return;
            if (research && m.research_session_id)
                conversationResearch(research, undefined, String(m.research_session_id));
            if (!research && conversationSnapshot().sessionId !== m.channel)
                return;
            if (msg.type === 'live_input_transcript')
                conversationMessage('user', String(msg.full_text || msg.text || ''), 'completed', rid, research, m.context_cards);
            if (msg.type === 'live_output_transcript')
                conversationMessage('assistant', String(msg.full_text || msg.text || ''), 'streaming', 'reply:' + rid, research);
            if (msg.type === 'live_generation_complete') {
                if (msg.input_text)
                    conversationMessage('user', String(msg.input_text), 'completed', rid, research, m.context_cards);
                if (msg.output_text)
                    conversationMessage('assistant', String(msg.output_text), 'completed', 'reply:' + rid, research);
            }
        }
    });
    setInterval(() => { if (connected)
        socket.send({ type: 'workspace_heartbeat', conversation_id: conversationSnapshot().sessionId, since: sequence }); if (voice && Date.now() - lastAck > 12000)
        lose(); }, 5000);
    window.addEventListener('themechange', (e: Event) => { const theme = (e as CustomEvent).detail?.theme; if (!applying && theme && theme.id !== 'unsaved-draft')
        socket.send({ type: 'workspace_theme', theme }); });
    const reconcile = () => { if (connected && document.visibilityState === 'visible')
        hello(); };
    document.addEventListener('visibilitychange', reconcile);
    window.addEventListener('online', reconcile);
    window.addEventListener('nova-conversation', () => { if (connected)
        socket.send({ type: 'workspace_heartbeat', conversation_id: conversationSnapshot().sessionId }); });
}
