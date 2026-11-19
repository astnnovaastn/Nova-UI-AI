<script lang="ts">
  /*
   * V33 §10–11: Profile and accounts. Five separate things, never mixed up:
   *  1. the local AEGIS profile (the owner of this AEGIS on this computer; the name it uses);
   *  2. the browser profile: the tab session `persist:aegis-user`, where sites keep their own sign-ins;
   *  3. signing in to Google websites through the browser tab's profile;
   *  4. the Google API connection for AEGIS Work: Google's OAuth flow for installed apps (PKCE, loopback,
   *     consent in the system browser; core/work/google_accounts.py). "Not set up" when no OAuth client is
   *     configured, which is the case until one is created for this install;
   *  5. what AEGIS agents may use: their own isolated browser, never the tab sign-ins.
   * AEGIS never reads the sites' cookies to guess a sign-in state.
   */
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import { browserHost } from "../browser-host";
  import { browserTabs } from "../browser-tabs.svelte";
  import { api, post, type GoogleStatus, type Preferences, type ServerStatus } from "./api";
  import { settingsView } from "./settings-view.svelte";

  let prefs = $state<Preferences | null>(null);
  let google = $state<GoogleStatus | null>(null);
  let googleError = $state("");
  let server = $state<ServerStatus | null>(null);
  let message = $state("");
  let busy = $state(false);
  const desktop = browserTabs.available;
  let visitsShown = $state(12);
  let presence = $state<{ windows: { client_id: string; label: string; context: { view?: string } }[] } | null>(null);
  let devices = $state<{ devices: { id: string; label: string; revoked: boolean }[]; pairing_enabled: boolean } | null>(null);

  function refreshDevices(signal: AbortSignal) {
    void api<NonNullable<typeof presence>>("/api/sync/presence", { signal })
      .then((state) => { presence = state; }).catch(() => { if (!signal.aborted) presence = null; });
    void api<NonNullable<typeof devices>>("/api/devices", { signal })
      .then((state) => { devices = state; }).catch(() => { if (!signal.aborted) devices = null; });
  }

  function openVisit(url: string) {
    if (!/^https?:\/\//i.test(url)) return;
    settingsView.dismiss();
    browserTabs.page = null;
    browserTabs.newTab(url);
  }

  function dateLabel(at: number) {
    const date = new Date(at);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : "";
  }

  async function refresh() {
    try { google = await api<GoogleStatus>("/api/work/google"); googleError = ""; }
    catch (error) { google = null; googleError = error instanceof Error ? error.message : "Unavailable"; }
  }
  onMount(() => {
    api<Preferences>("/api/settings/preferences").then((p) => (prefs = p)).catch(() => {});
    api<ServerStatus>("/api/settings/status").then((s) => (server = s)).catch(() => {});
    void refresh();
    const pending = new AbortController();
    refreshDevices(pending.signal);
    const timer = setInterval(() => refreshDevices(pending.signal), 5000);
    return () => { clearInterval(timer); pending.abort(); };
  });

  async function connect() {
    busy = true;
    message = "";
    try {
      const reply = await post<{ authorization_url: string }>("/api/work/google/connect", { services: ["gmail", "calendar"] });
      const target = new URL(reply.authorization_url);
      if (target.origin !== "https://accounts.google.com") throw new Error("Unexpected authorization address.");
      if (desktop) await browserHost.openExternal(target.href);
      else window.open(target.href, "_blank", "noopener,noreferrer");
      message = "Google's consent page opened in your default browser. Come back and refresh when it says you're done.";
    } catch (error) {
      message = error instanceof Error ? error.message : "Google connection isn't available.";
    } finally { busy = false; }
  }
  async function disconnect() {
    busy = true;
    try { await api("/api/work/google", { method: "DELETE" }); message = "Disconnected on this computer. Attachments you already used stay."; await refresh(); }
    catch (error) { message = error instanceof Error ? error.message : "Could not disconnect."; }
    finally { busy = false; }
  }

  const googleState = $derived(google ? (!google.configured ? "Not set up" : google.connected ? "Connected" : "Not connected") : googleError ? "Unavailable" : "Checking…");
  // The server says why (for example "owner profile required" before the owner session has a profile).
  const writer = $derived(server?.research_writer);
</script>

<SettingsGroup title="AEGIS profile" description="AEGIS keeps one local profile: the owner of this AEGIS on this computer. It has no cloud account.">
  <SettingsRow title={prefs?.user_name || "No name set"} description="The name AEGIS uses for you." settingId="accounts.name">
    <button type="button" class="pill" onclick={() => settingsView.select("voice")}>Change</button>
  </SettingsRow>
  <SettingsRow title="Stored on" description="Your research, notes, tasks and memories stay with the AEGIS server on this computer." settingId="accounts.local">
    <span class="muted">This computer</span>
  </SettingsRow>
</SettingsGroup>

<SettingsGroup title="Browser profile" description="Your tabs use their own browser profile. Sites keep their sign-ins there, and they survive a restart. AEGIS never sees or stores your passwords.">
  <SettingsRow title="Profile" description={desktop ? `persist:aegis-user · ${browserTabs.tabs.length} tab${browserTabs.tabs.length === 1 ? "" : "s"} · ${browserTabs.history.length} pages in history` : "Tabs are part of AEGIS Desktop."} settingId="accounts.browser">
    {#if desktop}<button type="button" class="pill" onclick={() => settingsView.select("privacy")}>Sign-ins and cookies</button>{/if}
  </SettingsRow>
</SettingsGroup>

<SettingsGroup title="Browser history" description="Recent pages saved by this browser profile.">
  {#if !desktop}
    <p class="block">Browser history is available in AEGIS Desktop.</p>
  {:else if browserTabs.history.length}
    <ul class="rows visit-list">
      {#each browserTabs.history.slice(0, visitsShown) as visit (visit.url)}
        <li>
          <span title={visit.url}>{visit.title || visit.url}<small>{dateLabel(visit.at)}</small></span>
          <button type="button" class="pill" aria-label={"Reopen " + (visit.title || visit.url)} onclick={() => openVisit(visit.url)}>Open</button>
        </li>
      {/each}
    </ul>
    {#if browserTabs.history.length > visitsShown}
      <div class="block"><button type="button" class="pill" onclick={() => visitsShown += 24}>Show more history</button></div>
    {/if}
  {:else}
    <p class="block">No pages have been saved in this browser profile yet.</p>
  {/if}
</SettingsGroup>

<SettingsGroup title="Connected windows and devices">
  <SettingsRow title="Windows connected now" settingId="accounts.windows">
    <span class="muted">{presence ? presence.windows.length : "Unavailable"}</span>
  </SettingsRow>
  {#if presence?.windows.length}
    <ul class="rows">
      {#each presence.windows as item, index (index)}
        <li><span>{item.label}</span><span class="muted">{item.context?.view || "Dashboard"}</span></li>
      {/each}
    </ul>
  {/if}
  <SettingsRow title="Paired devices" settingId="accounts.devices">
    <button type="button" class="pill" onclick={() => settingsView.select("connections")}>Manage devices</button>
  </SettingsRow>
  {#if devices?.devices.length}
    <ul class="rows">
      {#each devices.devices as item (item.id)}
        <li><span>{item.label}</span><span class="muted">{item.revoked ? "Not authorized" : "Paired"}</span></li>
      {/each}
    </ul>
  {:else}
    <p class="block">{devices ? "No paired devices." : "Device information is unavailable."}</p>
  {/if}
</SettingsGroup>

<SettingsGroup title="Google websites" description="Sign in to Google websites in your browser profile. Each site controls whether it accepts sign-in from this browser.">
  {#if desktop}
    <SettingsRow title="Sign in from a tab" description="Uses your AEGIS browser profile." settingId="accounts.google-tab">
      <button type="button" class="pill" onclick={() => openVisit("https://accounts.google.com/")}>Open Google sign-in</button>
    </SettingsRow>
    <SettingsRow title="Sign in with your browser" description="Signs in your default browser, not AEGIS." settingId="accounts.google-browser">
      <button type="button" class="pill" onclick={() => void browserHost.openExternal("https://accounts.google.com/")}>Open in your browser</button>
    </SettingsRow>
  {:else}
    <div class="block">In a web browser, Google sign-in is your browser's own.</div>
  {/if}
</SettingsGroup>

<SettingsGroup title="Google for AEGIS Work" description="Read-only Gmail and Google Calendar through Google's sign-in for installed apps: the consent page opens in your default browser. Only items you pick go to the AI when you send a task.">
  <SettingsRow title="Gmail and Calendar" description={google?.connected ? `Authorized: ${google.services.join(", ") || "nothing"}.` : google && !google.configured ? "This AEGIS has no Google OAuth client yet. Someone with a Google Cloud project creates one (type: Desktop app) and adds it to the AEGIS server's settings." : googleError || ""} settingId="accounts.google-api">
    <div class="actions">
      <span class="status" class:on={google?.connected} class:off={google && !google.connected}>{googleState}</span>
      {#if google?.configured}
        <button type="button" class="pill primary" disabled={busy} onclick={connect}>{google.connected ? "Change" : "Connect"}</button>
        {#if google.connected}<button type="button" class="pill" disabled={busy} onclick={disconnect}>Disconnect</button>{/if}
      {/if}
      <button type="button" class="pill" disabled={busy} onclick={refresh}>Refresh</button>
    </div>
  </SettingsRow>
</SettingsGroup>

<SettingsGroup title="What AEGIS agents may use" description="Agents read the web in their own isolated browser. They never get your tabs, cookies or sign-ins, and never your site permissions.">
  <SettingsRow title="Your tabs and sign-ins" settingId="accounts.agents-tabs"><span class="status off">Never</span></SettingsRow>
  <SettingsRow title="Gmail and Calendar" description="Only items you choose in Work's Connections, when you send a task." settingId="accounts.agents-google"><span class="status" class:on={google?.connected}>{google?.connected ? "When you pick items" : "Not connected"}</span></SettingsRow>
  <SettingsRow title="AI providers" description={writer ? (writer.provider === "none" ? "Research writing is off." : `Research is written by ${writer.provider === "gemini" ? "Gemini" : "OpenAI"}. Keys stay on the AEGIS server.`) : "Keys stay on the AEGIS server."} settingId="accounts.agents-ai">
    <button type="button" class="pill" onclick={() => settingsView.select("ai")}>AI models</button>
  </SettingsRow>
</SettingsGroup>
{#if message}<p class="message" role="status">{message}</p>{/if}

<style>
  .visit-list small { display: block; margin-block-start: 3px; color: var(--color-muted); font-size: 11px; }
</style>
