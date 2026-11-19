<script lang="ts">
  /*
   * V35 Settings → About and updates. Everything shown comes from the desktop updater (desktop/updater.cjs):
   * the installed version, channel and build, the update source and its state. Nothing is installed without the
   * person pressing Install and restart; the GitHub token is stored encrypted on this computer and never shown.
   */
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import Switch from "$shared/ui/Switch";

  type Status = {
    state: string; version: string; channel: string; repo: string; auto: boolean; tokenSet: boolean; installed: boolean; lastCheck: number; error: string;
    build?: { commit?: string; built_at?: string; electron?: string; python?: string; local_test?: boolean };
    progress?: { received: number; total: number } | null;
    available?: { version: string; channel: string; notes: string; published?: string; url?: string; download: number; components: string[] } | null;
  };
  const desktop = (globalThis as { aegisDesktop?: { invoke: <T>(c: string, a?: unknown) => Promise<T> } }).aegisDesktop;
  let status = $state<Status | null>(null);
  let repo = $state("");
  let token = $state("");
  let busy = $state(false);
  let error = $state("");
  let notesOpen = $state(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  async function call(command: string, args: Record<string, unknown> = {}) {
    if (!desktop) return;
    busy = true;
    error = "";
    try { status = await desktop.invoke<Status>(command, args); if (command === "update_configure") token = ""; }
    catch (e) { error = (e as Error).message.replace(/^Error invoking remote method 'aegis': (Error: )?/, ""); }
    finally { busy = false; }
  }
  onMount(() => {
    void call("update_status").then(() => { repo = status?.repo ?? ""; });
    timer = setInterval(() => { if (status && ["downloading", "checking", "installing"].includes(status.state)) void call("update_status"); }, 700);
    return () => clearInterval(timer);
  });
  const mb = (n: number) => (n / 1048576).toFixed(n > 1e8 ? 0 : 1) + " MB";
  const when = (iso?: string | number) => (iso ? new Date(iso).toLocaleString() : "never");
  const word: Record<string, string> = {
    development: "This is a development copy. It is updated from source, not from releases.",
    idle: "Not checked yet.", checking: "Checking…", current: "AEGIS is up to date.", not_configured: "Choose where updates come from.",
    offline: "Offline. AEGIS keeps working with this version.", available: "An update is available.", downloading: "Downloading…",
    ready: "Downloaded and verified. Ready to install.", installing: "Installing…", installed: "Installed. Restarting…", error: "The last check failed.",
  };
</script>

{#if !desktop}
  <SettingsGroup title="AEGIS"><SettingsRow title="Version" description="Open AEGIS Desktop to see its version and updates."><span></span></SettingsRow></SettingsGroup>
{:else if status}
  <SettingsGroup title="AEGIS Desktop" description="The program on this computer. Your research, Work sessions, browser profile and settings are kept separately and survive updates.">
    <SettingsRow title="Version" description={status.installed ? "Installed from a signed release" : "Running from source"} settingId="about.version">
      <span class="value" data-about-version>{status.version}</span>
    </SettingsRow>
    <SettingsRow title="Release channel" description="Stable gets validated releases only. Beta also gets previews. Dev gets internal builds." settingId="about.channel">
      <select disabled={!status.installed || busy} value={status.channel} onchange={(e) => void call("update_configure", { channel: (e.currentTarget as HTMLSelectElement).value })}>
        <option value="stable">Stable</option><option value="beta">Beta</option><option value="dev">Development</option>
      </select>
    </SettingsRow>
    <SettingsRow title="Build" description={[status.build?.commit ? "commit " + status.build.commit : "", status.build?.built_at ? "built " + when(status.build.built_at) : "", status.build?.electron ? "Electron " + status.build.electron : "", status.build?.python ? "Python " + status.build.python : ""].filter(Boolean).join(" · ") || "—"} settingId="about.build">
      {#if status.build?.local_test}<span class="tag">Local test build</span>{/if}
    </SettingsRow>
  </SettingsGroup>

  {#if status.installed}
    <SettingsGroup title="Updates" description="Releases come from your GitHub repository. Each one is checked against the AEGIS release key before anything is installed.">
      <SettingsRow title="Status" description={(word[status.state] ?? status.state) + (status.lastCheck ? " Last checked " + when(status.lastCheck) + "." : "")} settingId="about.status">
        <button type="button" class="pill" data-update-check disabled={busy || ["checking", "downloading", "installing"].includes(status.state)} onclick={() => void call("update_check")}>Check for updates</button>
      </SettingsRow>
      {#if status.available}
        <div class="update" data-update-available={status.available.version}>
          <div class="head"><strong>AEGIS {status.available.version}</strong><span>{status.available.channel}{status.available.published ? " · " + when(status.available.published) : ""} · {mb(status.available.download)} to download</span></div>
          <button type="button" class="link" onclick={() => (notesOpen = !notesOpen)}>{notesOpen ? "Hide changes" : "View changes"}</button>
          {#if notesOpen}<pre class="notes">{status.available.notes}</pre>{/if}
          {#if status.state === "downloading" && status.progress}
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={status.progress.total} aria-valuenow={status.progress.received}><span style:width="{Math.min(100, (100 * status.progress.received) / Math.max(1, status.progress.total))}%"></span></div>
            <p class="muted">{mb(status.progress.received)} of {mb(status.progress.total)}</p>
          {/if}
          <div class="actions">
            {#if status.state === "available"}<button type="button" class="pill primary" data-update-download disabled={busy} onclick={() => void call("update_download")}>Download update</button>{/if}
            {#if status.state === "ready"}<button type="button" class="pill primary" data-update-install disabled={busy} onclick={() => void call("update_install")}>Install and restart</button>
              <span class="muted">Later is fine: it stays ready until you install it.</span>{/if}
          </div>
        </div>
      {/if}
      {#if status.error || error}<p class="error" role="alert">{error || status.error}</p>{/if}
      <SettingsRow title="Check automatically" description="At start-up and every few hours. Never more than once an hour; never while offline." settingId="about.auto">
        <Switch label="Check automatically" labelHidden checked={status.auto} onchange={(on) => void call("update_configure", { auto: on })} />
      </SettingsRow>
      <SettingsRow title="Repository" description="owner/repository of the private AEGIS repository on GitHub." settingId="about.repo">
        <input class="field" placeholder="owner/repository" bind:value={repo} onchange={() => void call("update_configure", { repo })} />
      </SettingsRow>
      <SettingsRow title="GitHub token" description={status.tokenSet ? "A token is stored on this computer, encrypted for your Windows account. Enter a new one to replace it, or clear it." : "A fine-grained token with read-only Contents access to the repository. It stays on this computer, encrypted."} settingId="about.token">
        <input class="field" type="password" autocomplete="off" placeholder={status.tokenSet ? "••••••••  (stored)" : "github_pat_…"} bind:value={token} />
        <button type="button" class="pill" disabled={busy || !token} onclick={() => void call("update_configure", { token })}>Save</button>
        {#if status.tokenSet}<button type="button" class="pill" disabled={busy} onclick={() => void call("update_configure", { token: "" })}>Clear</button>{/if}
      </SettingsRow>
    </SettingsGroup>
  {/if}
{:else}
  <p class="muted">Reading…</p>
{/if}

<style>
  .value { font-variant-numeric: tabular-nums; font-weight: 600; }
  .tag { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--color-accent, #8ab4f8) 18%, transparent); }
  .update { margin: 6px 0 10px; padding: 14px 16px; border-radius: 12px; background: color-mix(in srgb, var(--color-accent, #8ab4f8) 9%, transparent); display: grid; gap: 8px; }
  .head { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; }
  .head span, .muted { color: var(--color-muted, #999); font-size: 12.5px; }
  .notes { margin: 0; white-space: pre-wrap; font: 12.5px/1.5 inherit; max-block-size: 240px; overflow: auto; }
  .bar { block-size: 6px; border-radius: 3px; background: rgba(127, 127, 127, 0.2); overflow: hidden; }
  .bar span { display: block; block-size: 100%; background: var(--color-accent, #8ab4f8); transition: width 0.3s ease; }
  .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .field { min-inline-size: 220px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-border, rgba(127,127,127,.3)); background: transparent; color: inherit; font: inherit; }
  .error { color: #f28b82; margin: 4px 0; }
  .link { background: none; border: 0; padding: 0; color: var(--color-accent, #8ab4f8); cursor: pointer; justify-self: start; font: inherit; }
  select { font: inherit; padding: 4px 8px; border-radius: 8px; background: transparent; color: inherit; border: 1px solid var(--color-border, rgba(127,127,127,.3)); }
</style>
