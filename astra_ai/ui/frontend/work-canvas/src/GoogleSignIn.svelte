<script lang="ts">
  /*
   * V32: shown above a Google sign-in page in a Browse tab. Google refuses sign-in from embedded browser
   * frameworks ("Couldn't sign you in — This browser or app may not be secure"), and AEGIS Desktop is one
   * (Electron). AEGIS does not disguise itself to get past that check. What it offers instead:
   *  - sign in with the default browser, where Google allows it (that signs in that browser, not AEGIS);
   *  - connect Gmail and Calendar to AEGIS through Google's own OAuth flow for installed apps: the consent
   *    page opens in the system browser, with PKCE and a loopback redirect (core/work/google_accounts.py).
   * V33: "Accounts" opens Settings, Profile and accounts, which says whether that connection is set up.
   * The band stays until it is dismissed; the page under it keeps working signed out.
   */
  import { browserHost } from "./browser-host";
  import { workApi } from "./work-panels.svelte";
  import { settingsView } from "./settings/settings-view.svelte";

  let { tabId, url, open = $bindable(true) }: { tabId: number; url: string; open?: boolean } = $props();
  let status = $state<{ configured: boolean; connected: boolean } | null>(null);
  let message = $state("");
  const rejected = $derived(/\/signin\/rejected|\/v3\/signin\/rejected/.test(url));

  $effect(() => {
    void tabId;
    workApi<{ configured: boolean; connected: boolean }>("/api/work/google").then((reply) => (status = reply)).catch(() => (status = null));
  });

  async function connect() {
    message = "";
    try {
      const reply = await workApi<{ authorization_url: string }>("/api/work/google/connect", { method: "POST", body: JSON.stringify({ services: ["gmail", "calendar"] }) });
      const target = new URL(reply.authorization_url);
      if (target.origin !== "https://accounts.google.com") throw new Error("Unexpected authorization address.");
      await browserHost.openExternal(target.href);
      message = "Google's consent page opened in your default browser. Come back here when it says you're done.";
    } catch (error) {
      message = (error as Error).message || "Google connection isn't available.";
    }
  }
</script>

{#if open}
  <div class="band" role="note" aria-label="Google sign-in in AEGIS">
    <div class="words">
      <strong>{rejected ? "Google refused to sign in here." : "Google may refuse to sign in here."}</strong>
      <span>Google blocks sign-in from embedded browsers such as AEGIS Desktop, and AEGIS doesn't disguise itself to get around that. Google pages keep working signed out.</span>
      {#if message}<span class="message" role="status">{message}</span>{/if}
    </div>
    <div class="actions">
      <button type="button" onclick={() => void browserHost.openExternal(url)} title="Opens this page in your default browser">Sign in with your browser</button>
      {#if status?.connected}<span class="connected">Gmail and Calendar connected</span>
      {:else if status?.configured}<button type="button" class="primary" onclick={connect}>Connect Gmail and Calendar</button>{/if}
      <!-- V33: the Google connection's honest state ("not set up" without an OAuth client) lives in Settings. -->
      <button type="button" onclick={() => settingsView.open("accounts")} title="Profile and accounts in Settings">Accounts</button>
      <button type="button" class="dismiss" aria-label="Dismiss" onclick={() => (open = false)}>×</button>
    </div>
  </div>
{/if}

<style>
  .band { position: absolute; z-index: 6; inset-inline: 0; inset-block-start: 0; display: flex; align-items: center; gap: 14px; block-size: 64px; padding: 0 14px; border-radius: 12px 12px 0 0; background: var(--color-raised, #222326); color: var(--color-text); font: 12.5px/1.35 var(--font-sans); box-sizing: border-box; }
  .words { flex: 1; display: grid; min-inline-size: 0; }
  .words span { color: var(--color-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .words .message { color: var(--color-text); }
  .actions { display: flex; align-items: center; gap: 6px; }
  button { block-size: 30px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 999px; background: none; color: var(--color-text); font: 600 12px var(--font-sans); white-space: nowrap; cursor: pointer; }
  button.primary { background: var(--color-text); color: var(--color-page, #111); border-color: transparent; }
  .dismiss { inline-size: 30px; padding: 0; font-size: 16px; border: 0; }
  .connected { color: var(--color-muted); font-size: 12px; }
</style>
