import { conversationSnapshot } from './conversation';
let render: () => void = () => { };
window.addEventListener('nova-workspace-presence', () => render());
export function mountConnectedWindows() {
    const host = document.getElementById('workspace-connections');
    if (!host)
        return;
    let busy = false;
    const headers = () => ({ 'Content-Type': 'application/json', 'X-Nova-Client': conversationSnapshot().clientId });
    const button = (label: string, action: () => void) => { const b = document.createElement('button'); b.className = 'settings-btn'; b.type = 'button'; b.textContent = label; b.onclick = action; return b; };
    render = () => {
        if (busy || !host.isConnected)
            return;
        busy = true;
        void (async () => {
            try {
                const response = await fetch('/api/sync/presence', { headers: headers() });
                if (!response.ok)
                    throw Error('Reconnect to view connected windows.');
                const data = await response.json();
                host.replaceChildren();
                const count = document.createElement('p');
                count.textContent = data.count + ' connected window' + (data.count === 1 ? '' : 's');
                host.append(count);
                for (const row of data.windows || []) {
                    const item = document.createElement('p');
                    item.textContent = row.label + ' · ' + ((row.context.view || 'Dashboard') + (row.context.view === 'research' && row.context.title ? ' · ' + row.context.title : '')) + (data.voice?.client_id === row.client_id ? ' · Voice owner' : '');
                    host.append(item);
                }
                const devices = await fetch('/api/devices', { headers: headers() });
                if (!devices.ok)
                    return;
                const list = await devices.json();
                for (const row of list.devices || []) {
                    const item = document.createElement('div');
                    item.textContent = row.label + (row.revoked ? ' · Not authorized' : ' · Paired');
                    item.append(button(row.revoked ? 'Approve' : 'Revoke', () => { void fetch('/api/devices/' + row.id + '/' + (row.revoked ? 'approve' : 'revoke'), { method: 'POST', headers: headers() }).then(() => render()); }));
                    host.append(item);
                }
                if (!list.pairing_enabled) {
                    const note = document.createElement('p');
                    note.textContent = 'Paired computers are disabled. Local windows remain connected.';
                    host.append(note);
                    return;
                }
                host.append(button('Pair a computer', () => { void fetch('/api/devices/pairing', { method: 'POST', headers: headers() }).then(r => r.json()).then(code => { const p = document.createElement('p'); p.textContent = 'Pairing code: ' + code.code + ' · Expires in 5 minutes. Enter it through your trusted HTTPS host gateway, then approve this device here.'; host.append(p); }); }));
            }
            catch (e: any) {
                host.textContent = e.message;
            }
            finally {
                busy = false;
            }
        })();
    };
    render();
}
