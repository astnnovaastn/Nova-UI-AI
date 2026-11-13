<!--
  What AEGIS Work can reach, after Zephium Work's Connections: each with its real status from the
  server's configuration (keys never reach this page), a switch where the person may turn one off,
  and connections this build cannot offer shown as unavailable with the reason. The source browser's
  manual proxy lives here too, with a test that makes a real request through it.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { workApi, workPanels } from "./work-panels.svelte";

  type Row = { id: string; title: string; kind: string; status: string; enabled: boolean; toggle: boolean; capabilities: string[]; scope: string };
  type Proxy = { mode: string; host: string; port: number | null; username: string; has_password: boolean; remote_dns: boolean; last_test: { ok: boolean; status?: number; ms?: number; reason?: string; at?: number } | null; not_applied_to: string };
  let rows = $state<Row[]>([]);
  let proxy = $state<Proxy | null>(null);
  let form = $state({ mode: "off", host: "", port: "", username: "", password: "", remote_dns: true });
  let error = $state("");
  let saved = $state("");
  let testing = $state(false);
  let busy = $state(false);

  const KINDS: [string, string][] = [["search", "Search"], ["model", "AI models"], ["network", "Network"], ["unavailable", "Not available in this build"]];
  const WORDS: Record<string, string> = { connected: "Connected", off: "Off", not_configured: "Not set up", unavailable: "Unavailable", failing: "Failing", untested: "Not tested" };

  async function load() {
    try {
      rows = (await workApi<{ connections: Row[] }>("/api/work/connections")).connections;
      proxy = (await workApi<{ proxy: Proxy }>("/api/work/network")).proxy;
      form = { mode: proxy.mode, host: proxy.host, port: proxy.port ? String(proxy.port) : "", username: proxy.username, password: "", remote_dns: proxy.remote_dns };
      error = "";
    } catch (e) {
      error = (e as Error).message;
    }
  }
  onMount(load);

  async function toggle(row: Row) {
    busy = true;
    try {
      await workApi(`/api/work/connections/${encodeURIComponent(row.id)}/enabled`, { method: "POST", body: JSON.stringify({ enabled: !row.enabled }) });
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function saveProxy(event: Event) {
    event.preventDefault();
    busy = true;
    saved = "";
    try {
      const body = form.mode === "off" ? { mode: "off" } : { ...form, port: Number(form.port), password: form.password ? form.password : null };
      proxy = (await workApi<{ proxy: Proxy }>("/api/work/network", { method: "PUT", body: JSON.stringify(body) })).proxy;
      form.password = "";
      saved = form.mode === "off" ? "Proxy turned off." : "Saved. Test it to see whether it works.";
      error = "";
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function testProxy() {
    testing = true;
    try {
      await workApi("/api/work/network/test", { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      testing = false;
    }
  }
  const reason = (value = "") =>
    ({ proxy_off: "The proxy is off.", ConnectionError: "Could not connect through the proxy.", ProxyError: "The proxy refused the connection.", ConnectTimeout: "The proxy did not answer in time.", ReadTimeout: "The page did not answer in time through the proxy.", InvalidSchema: "SOCKS support is missing on the server." } as Record<string, string>)[value] ?? value.replace(/_/g, " ");
</script>

<section class="work-panel" aria-label="Connections">
  <header>
    <h2>Connections</h2>
    <button type="button" class="close" aria-label="Close connections" onclick={() => (workPanels.open = "")}>×</button>
  </header>
  <p class="lede">What AEGIS can reach for your research. Keys stay on the server; nothing here can send, post or delete.</p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}

  {#each KINDS as [kind, label] (kind)}
    {@const group = rows.filter((row) => row.kind === kind)}
    {#if group.length}
      <h4>{label}</h4>
      <ul>
        {#each group as row (row.id)}
          <li data-connection={row.id} data-status={row.status}>
            <span class="dot" aria-hidden="true"></span>
            <div class="words">
              <strong>{row.title}</strong>
              <span>{WORDS[row.status] ?? row.status}{row.capabilities.length ? ` · ${row.capabilities.join(", ")}` : ""}</span>
              <em>{row.scope}</em>
            </div>
            {#if row.toggle}
              <label class="switch" title={row.enabled ? "Turn off" : "Turn on"}>
                <input type="checkbox" checked={row.enabled} disabled={busy} onchange={() => toggle(row)} aria-label={`${row.title} enabled`} />
                <span></span>
              </label>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/each}

  {#if proxy}
    <h4>Proxy for the source browser</h4>
    <form class="proxy" onsubmit={saveProxy}>
      <label>Mode
        <select bind:value={form.mode}>
          <option value="off">Off</option>
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="socks5">SOCKS5</option>
        </select>
      </label>
      {#if form.mode !== "off"}
        <div class="pair">
          <label>Host <input bind:value={form.host} placeholder="127.0.0.1" autocomplete="off" required /></label>
          <label class="port">Port <input bind:value={form.port} inputmode="numeric" placeholder="1080" required /></label>
        </div>
        <div class="pair">
          <label>User <input bind:value={form.username} autocomplete="off" /></label>
          <label>Password <input type="password" bind:value={form.password} autocomplete="new-password" placeholder={proxy.has_password ? "Saved; leave empty to keep" : ""} /></label>
        </div>
        {#if form.mode === "socks5"}<label class="check"><input type="checkbox" bind:checked={form.remote_dns} /> Resolve names through the proxy</label>{/if}
      {/if}
      <div class="row">
        <button type="submit" class="primary" disabled={busy}>Save</button>
        {#if proxy.mode !== "off"}<button type="button" class="ghost" disabled={testing} onclick={testProxy}>{testing ? "Testing…" : "Test connection"}</button>{/if}
      </div>
      {#if saved}<p class="meta">{saved}</p>{/if}
      {#if proxy.mode !== "off" && proxy.last_test}
        <p class="result" data-ok={proxy.last_test.ok}>
          {proxy.last_test.ok ? `Working: reached the test page (gstatic.com) through the proxy in ${proxy.last_test.ms} ms (HTTP ${proxy.last_test.status}).` : `Not working: ${reason(proxy.last_test.reason)}`}
        </p>
      {/if}
      <p class="meta">Used for the Source Reader. {proxy.not_applied_to}</p>
    </form>
  {/if}
</section>

<style>
  .work-panel {
    position: absolute;
    inset-block: 12px;
    inset-inline-start: 64px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
    inline-size: min(380px, calc(100vw - 96px));
    padding: 14px 14px 12px;
    overflow-y: auto;
    border-radius: 14px;
    background: var(--color-raised);
    box-shadow: 0 0 0 1px var(--color-border), var(--shadow-float);
    color: var(--color-text);
    font: 13px/1.45 var(--font-sans, Inter, sans-serif);
  }
  header {
    display: flex;
    align-items: center;
  }
  h2 {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 650;
  }
  h4 {
    margin: 10px 0 2px;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  p {
    margin: 0;
  }
  .lede,
  .meta {
    color: var(--color-muted);
    font-size: 12px;
  }
  .error {
    color: var(--aegis-status-failed, #f0605a);
    font-size: 12px;
  }
  button {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--color-ring, var(--color-text));
    outline-offset: 1px;
  }
  .close {
    inline-size: 26px;
    block-size: 26px;
    border-radius: 8px;
    font-size: 18px;
    line-height: 1;
  }
  .ghost,
  .primary {
    padding: 5px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    font-size: 12px;
  }
  .primary {
    background: var(--color-text);
    color: var(--color-canvas, #111);
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 6px 4px;
  }
  .dot {
    flex: none;
    inline-size: 8px;
    block-size: 8px;
    margin-block-start: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 30%, transparent);
  }
  [data-status="connected"] .dot {
    background: var(--aegis-strand-green, #3fdc84);
  }
  [data-status="failing"] .dot {
    background: var(--aegis-status-failed, #f0605a);
  }
  [data-status="untested"] .dot {
    background: var(--aegis-status-waiting, #e2a336);
  }
  .words {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-inline-size: 0;
  }
  .words span,
  .words em {
    color: var(--color-muted);
    font-size: 12px;
  }
  .words em {
    font-size: 11px;
    font-style: normal;
  }
  [data-status="unavailable"] strong {
    color: var(--color-muted);
  }
  .switch {
    position: relative;
    flex: none;
    inline-size: 30px;
    block-size: 18px;
    margin-block-start: 2px;
  }
  .switch input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .switch span {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 18%, transparent);
    pointer-events: none;
  }
  .switch span::after {
    content: "";
    position: absolute;
    inset-block-start: 3px;
    inset-inline-start: 3px;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 999px;
    background: var(--color-text);
  }
  .switch input:checked + span {
    background: color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 70%, transparent);
  }
  .switch input:checked + span::after {
    transform: translateX(12px);
  }
  .proxy {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    color: var(--color-muted);
    font-size: 11.5px;
  }
  .check {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .pair {
    display: flex;
    gap: 8px;
  }
  .port {
    flex: 0 0 84px;
  }
  input:not([type="checkbox"]),
  select {
    padding: 6px 9px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text);
    font: inherit;
  }
  select option {
    background: var(--color-raised);
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .result {
    padding: 7px 10px;
    border-radius: 9px;
    background: color-mix(in oklab, var(--aegis-status-failed, #f0605a) 14%, transparent);
    font-size: 12px;
  }
  .result[data-ok="true"] {
    background: color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 14%, transparent);
  }
</style>
