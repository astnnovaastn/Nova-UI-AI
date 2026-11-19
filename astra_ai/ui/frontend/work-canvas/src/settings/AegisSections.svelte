<script lang="ts">
  /*
   * V33: the AEGIS settings the dashboard's Settings panel (src/settings.ts, src/workspaceSettings.ts,
   * src/notifications.ts, src/voiceEnrollment.ts) held, as pages of the unified Settings:
   *  - AI models: the research writer (provider, model, activate or deactivate), its Groq backup, and the
   *    chat and voice models' status;
   *  - API keys: each key is write-only. The server says which are set; a saved value is never shown or kept;
   *  - Voice and sound: the voice profile (the React host's own controls, mounted here), sounds, your name;
   *  - Work: the model slots AEGIS Work routes to;
   *  - Connections and devices: service status, connected windows and paired computers;
   *  - System: the server, counts, restart and repair.
   * Everything is read from and saved by the AEGIS server as before; nothing new is stored.
   */
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import Switch from "$shared/ui/Switch";
  import Icon from "$shared/ui/Icon";
  import Menu from "$shared/ui/Menu";
  import { UserCircleIcon, VolumeHighIcon } from "@hugeicons/core-free-icons";
  import ProviderKeyRow from "./ProviderKeyRow.svelte";
  import { store } from "../store.svelte";
  import { api, hostSettings, post, saveKey, uptime, type Preferences, type ResearchWriter, type ServerStatus } from "./api";
  import { settingsView, type SettingsSection } from "./settings-view.svelte";

  let { section }: { section: SettingsSection } = $props();

  let status = $state<ServerStatus | null>(null);
  let failed = $state("");
  let writer = $state<ResearchWriter | null>(null);
  let chosen = $state<"gemini" | "openai">("gemini");
  let model = $state("");
  let busy = $state(false);
  let message = $state("");
  let drafts = $state<Record<string, string>>({});
  let prefs = $state<Preferences>({ user_name: "", honorific: "sir", calendar_accounts: "" });
  let work = $state<{ slots: { slot: string; configured: boolean; provider?: string; model?: string; circuit?: string }[]; daily_tokens_used: number; daily_tokens_limit: number; availability?: { slot: string; available: boolean }[] } | null>(null);
  let presence = $state<{ count: number; windows: { client_id: string; label: string; context: { view?: string; title?: string } }[]; voice?: { client_id?: string } } | null>(null);
  let devices = $state<{ devices: { id: string; label: string; revoked: boolean }[]; pairing_enabled: boolean } | null>(null);
  let pairing = $state("");
  let voiceHost = $state<HTMLElement>();
  const host = hostSettings();

  async function load() {
    try {
      status = await api<ServerStatus>("/api/settings/status");
      failed = "";
      if (status.research_writer) show(status.research_writer);
    } catch (error) {
      failed = error instanceof Error ? error.message : "The AEGIS server isn't answering.";
    }
  }
  function show(next: ResearchWriter) {
    const first = writer === null;
    writer = next;
    if (first) {
      chosen = next.provider === "none" ? "gemini" : next.provider;
      model = next.providers.find((row) => row.id === chosen)?.model ?? "";
    }
  }

  onMount(() => {
    void load();
    if (section === "voice") api<Preferences>("/api/settings/preferences").then((p) => (prefs = p)).catch(() => {});
    if (section === "work") api<typeof work>("/api/settings/work-models").then((w) => (work = w)).catch((e) => (failed = (e as Error).message));
    if (section === "connections") void connections();
    const timer = setInterval(() => { if (section === "connections" || section === "system" || section === "ai") void load(); }, 5000);
    return () => clearInterval(timer);
  });

  // The voice profile controls are the React host's own; they are mounted here and released on leaving.
  $effect(() => {
    const element = voiceHost;
    if (!element || !host) return;
    const release = host.mountVoice(element);
    return () => { if (typeof release === "function") release(); element.replaceChildren(); };
  });

  const providerRow = $derived(writer?.providers.find((row) => row.id === chosen));
  const label = (id: string) => (id === "gemini" ? "Gemini" : "OpenAI");
  const same = $derived(writer?.provider === chosen && providerRow?.model === model.trim());

  async function activate(off: boolean) {
    if (busy) return;
    busy = true;
    message = "Finishing any current write before changing the research writer…";
    try {
      const next = await post<ResearchWriter>("/api/settings/research-provider", off ? { provider: "none" } : { provider: chosen, model: model.trim() });
      show(next);
      message = off ? "Research writing deactivated. Saved work is kept; Gemini Live continues." : `${label(chosen)} activated for research. Chat and voice are unchanged.`;
    } catch (error) {
      message = error instanceof Error ? error.message : "The research writer could not be changed. The previous choice stays.";
    } finally {
      busy = false;
      void load();
    }
  }
  async function fallback(change: { enabled?: boolean; cooperative?: boolean; models?: string[] }) {
    busy = true;
    try {
      await post("/api/settings/research-fallback", { enabled: change.enabled ?? !!writer?.fallback?.enabled, ...change });
      show(await api<ResearchWriter>("/api/settings/research-provider"));
      message = "Saved.";
    } catch (error) {
      message = error instanceof Error ? error.message : "The backup setting could not be changed.";
    } finally { busy = false; }
  }
  async function key(name: string, words = "Saved. The value isn't shown again.", entry = drafts[name] ?? "") {
    const value = entry.trim();
    if (!value || busy) return false;
    busy = true;
    try {
      if (!(await saveKey(name, value)).success) throw new Error("Save refused.");
      drafts[name] = "";
      message = words;
      await load();
      return true;
    } catch {
      message = "The key could not be saved. Try again.";
      return false;
    } finally { busy = false; }
  }
  async function test(kind: "groq" | "elevenlabs") {
    busy = true;
    message = "Checking the key with the provider…";
    try {
      const reply = await post<{ valid: boolean; error?: string }>(`/api/settings/test-${kind}`, { api_key: (drafts[kind === "groq" ? "GROQ_API_KEY" : "ELEVENLABS_API_KEY"] ?? "").trim() || undefined });
      message = reply.valid ? "The provider accepted the key." : `The provider refused the key${reply.error ? `: ${reply.error}` : "."}`;
    } catch (error) {
      message = error instanceof Error ? error.message : "The check failed.";
    } finally { busy = false; }
  }
  async function savePrefs() {
    busy = true;
    try {
      prefs = await post<Preferences>("/api/settings/preferences", prefs);
      window.dispatchEvent(new CustomEvent("aegis-profile-name", { detail: prefs.user_name }));
      message = "Saved.";
    } catch (error) {
      message = error instanceof Error ? error.message : "Could not save. Your entries are still here.";
    } finally { busy = false; }
  }
  async function connections() {
    try { presence = await api("/api/sync/presence"); } catch { presence = null; }
    try { devices = await api("/api/devices"); } catch { devices = null; }
  }
  async function device(id: string, action: "approve" | "revoke") {
    try { await post(`/api/devices/${encodeURIComponent(id)}/${action}`, {}); } catch (error) { message = (error as Error).message; }
    void connections();
  }
  async function pair() {
    try { const code = await post<{ code: string }>("/api/devices/pairing", {}); pairing = code.code; }
    catch (error) { message = (error as Error).message; }
  }

  // Sounds: the same keys the dashboard's sound settings use (src/notifications.ts).
  const read = (name: string, fallback: string) => { try { return localStorage.getItem(name) ?? fallback; } catch { return fallback; } };
  let sounds = $state({ notification: read("nova-sound-notification", "1") !== "0", voice: read("nova-sound-voice", "1") !== "0", notificationVolume: Number(read("nova-sound-notification-volume", "0.35")), voiceVolume: Number(read("nova-sound-voice-volume", "0.35")) });
  function sound(name: "notification" | "voice", on: boolean) {
    try {
      localStorage.setItem("nova-sound-" + name, on ? "1" : "0");
      if (name === "notification") localStorage.setItem("nova-notification-sound", on ? "on" : "off");
    } catch { /* storage blocked */ }
    sounds[name] = on;
    if (name === "notification") window.dispatchEvent(new CustomEvent("nova-notification-sound", { detail: { enabled: on } }));
  }
  function volume(name: "notification" | "voice", value: number) {
    try { localStorage.setItem(`nova-sound-${name}-volume`, String(value)); } catch { /* storage blocked */ }
    sounds[name === "notification" ? "notificationVolume" : "voiceVolume"] = value;
  }

  const set = (flag: string | undefined) => (status ? (flag ? status.env_keys_set?.[flag] === true : false) : null);
  const KEYS: { name: string; title: string; description: string; flag?: string; placeholder: string; secret: boolean }[] = [
    { name: "GEMINI_API_KEY", title: "Gemini", description: "Voice, chat and AI features.", flag: "gemini", placeholder: "Google AI Studio key", secret: true },
    { name: "NOVA_RESEARCH_OPENAI_API_KEY", title: "OpenAI (research only)", description: "Saving a key does not activate OpenAI; choose the writer in AI models.", flag: "openai_research", placeholder: "sk-…", secret: true },
    { name: "GROQ_API_KEY", title: "Groq", description: "Fast text models.", flag: "groq", placeholder: "gsk_…", secret: true },
    { name: "ELEVENLABS_API_KEY", title: "ElevenLabs", description: "Speech.", flag: "elevenlabs", placeholder: "sk_…", secret: true },
    { name: "elevenlabs_voice_id", title: "ElevenLabs voice ID", description: "Not a secret: the voice AEGIS speaks with.", flag: "elevenlabs_voice_id", placeholder: "e.g. MuWZEhlucXEKPv3WaubS", secret: false },
    { name: "QUICK_SEARCH_API_KEY", title: "Quick Search · SerpAPI", description: "Fills missing or current information in conversations.", flag: "quick_search", placeholder: "Conversation search key", secret: true },
    { name: "DEEP_RESEARCH_API_KEY", title: "Deep Research · Tavily", description: "Extensive investigations. Conversations never use it.", flag: "deep_research", placeholder: "Detailed research key", secret: true },
  ];
</script>

{#if failed}<p class="message" role="alert">{failed}</p>{/if}

{#if section === "ai"}
  <SettingsGroup title="Research writer" description={writer ? `Chat and voice stay on Gemini Live · ${writer.voice_model}. Inactive writers get no new requests; reports, drafts and keys stay saved.` : undefined}>
    <SettingsRow title="Active" description={writer ? (writer.switching ? "Switching…" : writer.provider === "none" ? "Research writing is deactivated." : `${label(writer.provider)} · ${writer.providers.find((r) => r.active)?.model ?? ""}`) : "Checking…"} settingId="ai.active">
      <span class="status" class:on={writer && writer.provider !== "none"} class:off={writer?.provider === "none"}>{writer?.provider === "none" ? "Off" : writer ? "On" : "…"}</span>
    </SettingsRow>
    <SettingsRow title="Provider" description={providerRow ? (providerRow.active ? "Active" : providerRow.configured ? "Key saved · inactive" : "No key saved") : ""} settingId="ai.provider">
      <div class="choices" role="radiogroup" aria-label="Research provider">
        {#each ["gemini", "openai"] as const as id (id)}
          <button type="button" class="pill" role="radio" aria-checked={chosen === id} disabled={busy || writer?.switching} onclick={() => { chosen = id; model = writer?.providers.find((r) => r.id === id)?.model || (id === "gemini" ? "gemini-3.5-flash" : "gpt-4.1-mini"); }}>{label(id)}</button>
        {/each}
      </div>
    </SettingsRow>
    <SettingsRow title="Model" description={providerRow ? `Today: ${providerRow.requests_used.toLocaleString()} / ${providerRow.request_limit.toLocaleString()} requests · ${providerRow.tokens_used.toLocaleString()} / ${providerRow.token_limit.toLocaleString()} tokens.` : ""} settingId="ai.model">
      <input class="field" list="aegis-research-models" bind:value={model} aria-label="Research model" disabled={busy} spellcheck="false" />
      <datalist id="aegis-research-models">{#each chosen === "gemini" ? ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"] : ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"] as option (option)}<option value={option}></option>{/each}</datalist>
    </SettingsRow>
    <SettingsRow title="Apply" description={providerRow?.local_limit_reached ? "This provider's local daily allowance is used up; saved research waits for the next one." : !providerRow?.configured ? `Save a ${label(chosen)} key in API keys before activating it.` : ""} settingId="ai.apply">
      <div class="actions">
        <button type="button" class="pill primary" disabled={busy || !writer || writer.switching || !providerRow?.configured || !model.trim() || same} onclick={() => activate(false)}>{same ? `${label(chosen)} is active` : `Activate ${label(chosen)}`}</button>
        <button type="button" class="pill" disabled={busy || !writer || writer.switching || writer.provider === "none"} onclick={() => activate(true)}>Deactivate</button>
      </div>
    </SettingsRow>
    <SettingsRow title="Separate Gemini research key" description={writer?.providers.find((r) => r.id === "gemini")?.credential_source === "research" ? "Saved. Chat and voice keep their own key." : "Research uses the shared Gemini key until one is saved here."} settingId="ai.research-key">
      <div class="inline"><input class="field" type="password" autocomplete="off" placeholder="Research key" aria-label="Gemini research key" bind:value={drafts.NOVA_RESEARCH_GEMINI_API_KEY} /><button type="button" class="pill" disabled={busy || !drafts.NOVA_RESEARCH_GEMINI_API_KEY?.trim()} onclick={() => key("NOVA_RESEARCH_GEMINI_API_KEY")}>Save</button></div>
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Backup writing" description={writer?.fallback?.configured ? `Gemini stays primary. Groq ${writer.fallback.enabled ? "is available as backup" : "is off"}.` : "Save a Groq research key to enable a backup."}>
    <SettingsRow title="Automatic Groq backup" settingId="ai.fallback">
      <Switch label="Automatic Groq backup for research writing" labelHidden disabled={busy || !writer} checked={!!writer?.fallback?.enabled} onchange={(on) => fallback({ enabled: on })} />
    </SettingsRow>
    <SettingsRow title="Cooperative research" description="Extra writing stages." settingId="ai.cooperative">
      <Switch label="Advanced cooperative research" labelHidden disabled={busy || !writer} checked={!!writer?.fallback?.cooperative_enabled} onchange={(on) => fallback({ cooperative: on })} />
    </SettingsRow>
    <SettingsRow title="Preferred backup model" settingId="ai.fallback-model">
      <select class="field" aria-label="Preferred Groq backup" disabled={busy || !writer} value={writer?.fallback?.models?.[0] ?? "openai/gpt-oss-120b"} onchange={(e) => { const v = (e.currentTarget as HTMLSelectElement).value; void fallback({ models: [v, v === "openai/gpt-oss-120b" ? "openai/gpt-oss-20b" : "openai/gpt-oss-120b"] }); }}>
        <option value="openai/gpt-oss-120b">GPT-OSS 120B</option><option value="openai/gpt-oss-20b">GPT-OSS 20B</option>
      </select>
    </SettingsRow>
    <SettingsRow title="Groq research key" description="Optional separate credential for research." settingId="ai.groq-key">
      <div class="inline"><input class="field" type="password" autocomplete="off" placeholder="gsk_…" aria-label="Groq research key" bind:value={drafts.NOVA_RESEARCH_GROQ_API_KEY} /><button type="button" class="pill" disabled={busy || !drafts.NOVA_RESEARCH_GROQ_API_KEY?.trim()} onclick={() => key("NOVA_RESEARCH_GROQ_API_KEY")}>Save</button></div>
    </SettingsRow>
  </SettingsGroup>
  {#if status?.models}
    <SettingsGroup title="Chat and voice">
      {#each Object.entries(status.models) as [kind, row] (kind)}
        <SettingsRow title={kind === "voice" ? "Voice" : "Text"} description={`${row.effective || row.preferred}${row.verified ? "" : " · access not checked yet"}${row.fallback_reason ? " · " + row.fallback_reason : ""}`}><span class="status" class:on={row.verified}>{row.verified ? "Checked" : "Not checked"}</span></SettingsRow>
      {/each}
    </SettingsGroup>
  {/if}
{:else if section === "keys"}
  <SettingsGroup title="Provider keys" description="Add or replace the credentials used by your AEGIS server.">
    {#each KEYS as row (row.name)}
      <ProviderKeyRow title={row.title} description={row.description} keyName={row.name} configured={set(row.flag)} secret={row.secret}
        provider={row.name === "GEMINI_API_KEY" ? "google" : row.name === "GROQ_API_KEY" ? "groq" : row.name === "NOVA_RESEARCH_OPENAI_API_KEY" ? "open_ai" : undefined}
        disabled={busy} save={(value) => key(row.name, row.secret ? "Key saved." : "Saved.", value)}
        test={row.name === "GROQ_API_KEY" ? () => test("groq") : row.name === "ELEVENLABS_API_KEY" ? () => test("elevenlabs") : undefined} />
    {/each}
  </SettingsGroup>
{:else if section === "voice"}
  <SettingsGroup title="You">
    <SettingsRow title="Your name" settingId="voice.name"><input class="field" bind:value={prefs.user_name} maxlength="120" aria-label="Your name" placeholder="Your name" /></SettingsRow>
    <SettingsRow title="How AEGIS addresses you" settingId="voice.honorific">
      <Menu label="Honorific" triggerClass="pill honorific-trigger" align="end"
        entries={[{kind:"item",id:"sir",label:"Sir",checked:prefs.honorific === "sir"},{kind:"item",id:"ma'am",label:"Ma’am",checked:prefs.honorific === "ma'am"},{kind:"item",id:"none",label:"No honorific",checked:prefs.honorific === "none"}]}
        onselect={(id) => { prefs.honorific = id; }}>
        {#snippet trigger()}<Icon icon={UserCircleIcon} size={15} />{prefs.honorific === "sir" ? "Sir" : prefs.honorific === "ma'am" ? "Ma’am" : "No honorific"}{/snippet}
      </Menu>
    </SettingsRow>
    <SettingsRow title="Calendar accounts" description="auto, or comma-separated addresses." settingId="voice.calendar"><input class="field" bind:value={prefs.calendar_accounts} aria-label="Calendar accounts" placeholder="auto" /></SettingsRow>
    <SettingsRow title="Save" settingId="voice.save"><button type="button" class="pill primary" disabled={busy} onclick={savePrefs}>Save preferences</button></SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Sounds">
    <SettingsRow title="Notification sounds" settingId="voice.notification-sound">
      <div class="sound-control"><Icon icon={VolumeHighIcon} size={16} /><input type="range" min="0" max="1" step="0.05" aria-label="Notification sounds volume" value={sounds.notificationVolume} oninput={(e) => volume("notification", Number((e.currentTarget as HTMLInputElement).value))} /><Switch label="Notification sounds" labelHidden checked={sounds.notification} onchange={(on) => sound("notification", on)} /></div>
    </SettingsRow>
    <SettingsRow title="Voice cues" settingId="voice.cues">
      <div class="sound-control"><Icon icon={VolumeHighIcon} size={16} /><input type="range" min="0" max="1" step="0.05" aria-label="Voice cues volume" value={sounds.voiceVolume} oninput={(e) => volume("voice", Number((e.currentTarget as HTMLInputElement).value))} /><Switch label="Voice cues" labelHidden checked={sounds.voice} onchange={(on) => sound("voice", on)} /></div>
    </SettingsRow>
    {#if host}<SettingsRow title="Notification history" settingId="voice.history"><button type="button" class="pill" onclick={() => host.notificationHistory()}>Show</button></SettingsRow>{/if}
  </SettingsGroup>
  <SettingsGroup title="Your voice" description="Three spoken sentences. Audio stays in memory; only an encrypted voice fingerprint is saved on this PC.">
    {#if host}<div class="voice" bind:this={voiceHost}></div>{:else}<div class="block">Voice profiles are set up from the AEGIS dashboard.</div>{/if}
  </SettingsGroup>
{:else if section === "work"}
  <SettingsGroup title="Model slots" description={work ? `Today: ${work.daily_tokens_used.toLocaleString()} of ${work.daily_tokens_limit.toLocaleString()} Work tokens.` : "Checking…"}>
    {#if work}
      <ul class="rows">{#each work.slots as slot (slot.slot)}<li><span>{slot.slot}</span><span class="muted">{slot.configured ? `${slot.provider} · ${slot.model}${slot.circuit === "open" ? " · paused after failures" : ""}` : "not configured"}</span>{#if work.availability}{@const found = work.availability.find((a) => a.slot === slot.slot)}{#if found}<span class="status" class:on={found.available} class:off={!found.available}>{found.available ? "Available" : "Unavailable"}</span>{/if}{/if}</li>{/each}</ul>
    {/if}
    <SettingsRow title="Check availability" description="Asks each provider whether its model exists. No text is generated." settingId="work.check">
      <button type="button" class="pill" disabled={busy} onclick={async () => { busy = true; try { work = await api("/api/settings/work-models?check=true"); } catch (e) { message = (e as Error).message; } finally { busy = false; } }}>Check</button>
    </SettingsRow>
  </SettingsGroup>
{:else if section === "memory"}
  <SettingsGroup title="Workspace memory">
    <SettingsRow title="Saved memories" description={typeof status?.memory_count === "number" ? status.memory_count + " stored in this workspace" : "Open the workspace to view your memories."}>
      <button type="button" class="pill" onclick={() => { settingsView.dismiss(); window.dispatchEvent(new Event("nova-open-memory")); }}>Open Memory</button>
    </SettingsRow>
  </SettingsGroup>
{:else if section === "connections"}
  <SettingsGroup title="Services">
    <SettingsRow title="AEGIS server" description={status ? `Port ${status.server_port} · up ${uptime(status.uptime_seconds)}` : ""}><span class="status" class:on={!!status} class:off={!status}>{status ? "Connected" : "Not answering"}</span></SettingsRow>
    <SettingsRow title="AEGIS AI assistant"><span class="status" class:on={status?.aegis_ai_connected} class:off={status && !status.aegis_ai_connected}>{status?.aegis_ai_connected ? "Running" : "Not running"}</span></SettingsRow>
    <SettingsRow title="Google Calendar (assistant)" description="The assistant's own calendar access."><span class="status" class:on={status?.google_calendar_accessible}>{status?.google_calendar_accessible ? "Reachable" : "Not reachable"}</span></SettingsRow>
    <SettingsRow title="Google Mail (assistant)"><span class="status" class:on={status?.google_mail_accessible}>{status?.google_mail_accessible ? "Reachable" : "Not reachable"}</span></SettingsRow>
    <SettingsRow title="Google for AEGIS Work" description="Read-only Gmail and Calendar through Google's own sign-in."><button type="button" class="pill" onclick={() => settingsView.select("accounts")}>Profile and accounts</button></SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Connected windows">
    {#if presence}
      <ul class="rows">{#each presence.windows as row, index (index)}<li><span>{row.label}</span><span class="muted">{(row.context.view || "Dashboard") + (row.context.view === "research" && row.context.title ? " · " + row.context.title : "")}{presence.voice?.client_id === row.client_id ? " · voice" : ""}</span></li>{/each}</ul>
      <div class="block">{presence.count} connected window{presence.count === 1 ? "" : "s"}.</div>
    {:else}<div class="block">Reconnect to see connected windows.</div>{/if}
  </SettingsGroup>
  <SettingsGroup title="Paired computers">
    {#if devices}
      {#if devices.devices.length}<ul class="rows">{#each devices.devices as row (row.id)}<li><span>{row.label}</span><span class="muted">{row.revoked ? "Not authorized" : "Paired"}</span><button type="button" class="pill" onclick={() => device(row.id, row.revoked ? "approve" : "revoke")}>{row.revoked ? "Approve" : "Revoke"}</button></li>{/each}</ul>{/if}
      {#if devices.pairing_enabled}
        <SettingsRow title="Pair a computer" description={pairing ? `Code ${pairing} · expires in 5 minutes. Enter it through your trusted HTTPS host gateway, then approve the device here.` : "Through your trusted HTTPS host gateway."}><button type="button" class="pill" onclick={pair}>Get a code</button></SettingsRow>
      {:else}<div class="block">Paired computers are off. Local windows stay connected.</div>{/if}
    {:else}<div class="block">Device pairing isn't available.</div>{/if}
  </SettingsGroup>
{:else if section === "system"}
  <SettingsGroup title="AEGIS">
    <SettingsRow title="Memories" description="Explore your connected memories."><div class="actions"><span class="muted">{status?.memory_count ?? "–"}</span><button type="button" class="pill" onclick={() => { settingsView.close(); window.dispatchEvent(new Event("nova-open-memory")); }}>Open</button></div></SettingsRow>
    <SettingsRow title="Tasks"><div class="actions"><span class="muted">{status?.task_count ?? "–"}</span><button type="button" class="pill" onclick={() => settingsView.select("tasks")}>Tasks settings</button></div></SettingsRow>
    <SettingsRow title="Server port"><span class="muted">{status?.server_port ?? "–"}</span></SettingsRow>
    <SettingsRow title="Uptime"><span class="muted">{status ? uptime(status.uptime_seconds) : "–"}</span></SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Recovery" description="Restart keeps your work; it stops and starts the AEGIS server.">
    <SettingsRow title="Restart the server" settingId="system.restart"><button type="button" class="pill" disabled={!store.actions} onclick={() => store.actions?.restart()}>Restart</button></SettingsRow>
    <SettingsRow title="Fix yourself" description="AEGIS checks and repairs its own runtime." settingId="system.repair"><button type="button" class="pill" disabled={!store.actions} onclick={() => store.actions?.repair()}>Repair</button></SettingsRow>
    {#if host}<SettingsRow title="Classic settings panel" description="The dashboard's earlier panel, kept as a fallback. It saves to the same places." settingId="system.legacy"><button type="button" class="pill" onclick={() => { settingsView.close(); host.legacy(); }}>Open</button></SettingsRow>{/if}
  </SettingsGroup>
{/if}
{#if message}<p class="message" role="status">{message}</p>{/if}

<style>
  .sound-control { display: flex; align-items: center; gap: 9px; color: var(--color-muted); }
  .sound-control input { inline-size: clamp(64px, 14vw, 140px); accent-color: var(--color-accent, var(--color-text)); }
  .sound-control input:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .voice { padding: 12px 18px; font-size: 13px; }
  .voice :global(h3) { margin: 0 0 4px; font-size: 13px; }
  .voice :global(p), .voice :global(small) { color: var(--color-muted); font-size: 12px; }
  .voice :global(button) { margin: 4px 6px 4px 0; padding: 6px 12px; border: 1px solid var(--color-border); border-radius: 999px; background: none; color: var(--color-text); font: 600 12px var(--font-sans); cursor: pointer; }
  .voice :global(button:disabled) { opacity: 0.45; }
  .voice :global(select), .voice :global(input) { block-size: 30px; padding: 0 8px; border: 1px solid var(--color-border); border-radius: 8px; background: transparent; color: var(--color-text); }
  .voice :global([hidden]) { display: none !important; }
  .voice :global(.voice-enrollment-heading) { display: none; }
</style>
