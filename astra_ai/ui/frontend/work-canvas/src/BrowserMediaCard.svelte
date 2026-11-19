<script lang="ts">
  import Icon from "$shared/ui/Icon";
  import EngineMark from "$shared/ui/EngineMark";
  import { Globe02Icon, PauseIcon, PlayIcon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
  import { browserTabs } from "./browser-tabs.svelte";
  import { browserHost } from "./browser-host";
  import { knownSiteMark } from "./search-engines";

  const tab = $derived(browserTabs.tabs.find(row => row.media?.playing && row.id !== browserTabs.active) ??
    browserTabs.tabs.find(row => row.media?.playing) ?? browserTabs.tabs.find(row => row.media?.available));
  const source = $derived.by(() => {
    try { return tab ? new URL(tab.url).hostname.replace(/^www[.]/, "") : ""; } catch { return ""; }
  });
  const mark = $derived(tab ? knownSiteMark(tab.url) : null);
  let failed = $state("");
  async function act(action: "play" | "pause" | "mute" | "unmute") {
    if (!tab || !browserHost.media) return;
    failed = "";
    try { await browserHost.media(tab.id, action); }
    catch { failed = "The tab could not change playback."; }
  }
</script>

{#if tab && browserHost.media}
  <section class="media-player" aria-label="Browser media">
    <button type="button" class="title" aria-label={"Open " + (tab.title || source)} onclick={() => browserTabs.openAddress(tab!.url)}>
      <span class="tile">{#if mark}<EngineMark engine={mark} size={18} />{:else}<Icon icon={Globe02Icon} size={18} />{/if}</span>
      <span class="text"><strong>{tab.title || source}</strong><small>{source}</small></span>
    </button>
    <button type="button" aria-label={tab.media?.playing ? "Pause media" : "Play media"} onclick={() => void act(tab?.media?.playing ? "pause" : "play")}><Icon icon={tab.media?.playing ? PauseIcon : PlayIcon} size={15} /></button>
    <button type="button" aria-label={tab.media?.muted ? "Unmute tab" : "Mute tab"} onclick={() => void act(tab?.media?.muted ? "unmute" : "mute")}><Icon icon={tab.media?.muted ? VolumeOffIcon : VolumeHighIcon} size={15} /></button>
  </section>
  {#if failed}<p role="status">{failed}</p>{/if}
{/if}

<style>
  .media-player { flex: none; display: flex; align-items: center; gap: 3px; margin-block-start: 6px; padding: 4px; border-radius: 18px; background: var(--color-fill); box-shadow: var(--row-rim); }
  button { display: grid; place-items: center; flex: none; inline-size: 28px; block-size: 32px; padding: 0; border: none; border-radius: var(--radius-row); background: none; color: var(--color-text); }
  button:hover { background: var(--color-fill-active); }
  button:focus-visible { outline: 2px solid var(--color-ring); }
  button.title { display: flex; min-inline-size: 0; flex: 1; gap: 8px; text-align: start; padding-inline: 4px; }
  .tile { display: grid; place-items: center; flex: none; inline-size: 28px; block-size: 28px; border-radius: 9px; background: var(--color-fill-active); }
  .text { min-inline-size: 0; display: grid; }
  strong, small { font-size: 11px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
  small { color: var(--color-muted); }
  p { margin: 4px; font-size: 11px; color: var(--color-muted); }
</style>
