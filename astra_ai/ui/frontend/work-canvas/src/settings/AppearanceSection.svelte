<script lang="ts">
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import Switch from "$shared/ui/Switch";
  import { hostSettings, type Appearance, type ThemeOption } from "./api";
  import { browserHost } from "../browser-host";
  import { browserSettings } from "../browser-settings.svelte";
  import AppearanceModePicker from "./AppearanceModePicker.svelte";
  import { settingsView } from "./settings-view.svelte";

  const host = hostSettings();
  let appearance = $state(host?.appearance());
  let themes = $state<ThemeOption[]>([]);
  let busy = $state(false);
  let message = $state("");

  onMount(() => {
    const refresh = () => { appearance = host?.appearance(); };
    window.addEventListener("themechange", refresh);
    host?.listThemes().then((rows) => { themes = rows; })
      .catch(() => { message = "Saved themes are unavailable. Other appearance controls still work."; });
    return () => window.removeEventListener("themechange", refresh);
  });

  function change(patch: Partial<Omit<Appearance, "themeId">>) {
    host?.setAppearance(patch);
  }

  let zoomBusy = $state(false);

  async function setPageZoom(percent: number) {
    if (!browserHost.setPageZoom || zoomBusy) return;
    message = "";
    zoomBusy = true;
    const previous = browserSettings.value.pageZoom;
    try {
      await browserHost.setPageZoom(percent);
      browserSettings.update((draft) => { draft.pageZoom = percent; });
      if (browserSettings.value.pageZoom !== percent) {
        await browserHost.setPageZoom(previous);
        throw new Error("Could not keep the zoom preference.");
      }
    } catch (error) {
      message = error instanceof Error ? error.message : "Could not change browser page zoom.";
    } finally { zoomBusy = false; }
  }

  async function select(id: string) {
    if (!host || busy) return;
    busy = true;
    message = "";
    try { await host.selectTheme(id); }
    catch (error) { message = error instanceof Error ? error.message : "Could not apply the theme."; }
    finally { busy = false; }
  }
</script>

{#if appearance}
  <SettingsGroup title="Mode">
    <AppearanceModePicker value={appearance.mode} accent={appearance.accent} glass={appearance.frosted} onchange={(mode) => change({ mode })} />
    <SettingsRow title="Follow the selected theme" description="Use the theme's original light or dark palette." settingId="appearance.follow-theme">
      <button type="button" class="pill" disabled={appearance.mode === "theme"} onclick={() => change({ mode: "theme" })}>Use theme mode</button>
    </SettingsRow>
  </SettingsGroup>

  <SettingsGroup title="Theme and color">
    <SettingsRow title="Theme" description="Shared with the Dashboard theme picker." settingId="appearance.palette">
      <select class="field" aria-label="Theme" value={appearance.themeId} disabled={busy || !themes.length} onchange={(event) => void select(event.currentTarget.value)}>
        {#each themes as theme (theme.id)}<option value={theme.id}>{theme.name}</option>{/each}
      </select>
    </SettingsRow>
    <SettingsRow title="Accent color" settingId="appearance.accent">
      <div class="actions">
        <input type="color" aria-label="Accent color" value={appearance.accent} onchange={(event) => change({ accent: event.currentTarget.value })} />
        <button type="button" class="pill" onclick={() => change({ accent: undefined })}>Reset</button>
      </div>
    </SettingsRow>
  </SettingsGroup>

  <SettingsGroup title="Window and background">
    <SettingsRow title="Frosted panels" description="Use translucent surfaces and blur where the AEGIS theme supports them." settingId="appearance.frosted">
      <Switch label="Frosted panels" labelHidden checked={appearance.frosted} onchange={(frosted) => change({ frosted })} />
    </SettingsRow>
    <SettingsRow title="New tab background" settingId="appearance.background">
      <button type="button" class="pill" onclick={() => settingsView.select("new-tab")}>Change wallpaper</button>
    </SettingsRow>
  </SettingsGroup>

  {#if browserHost.setPageZoom}
    <SettingsGroup title="Page zoom">
      <SettingsRow title="Web pages" description="Set the default zoom for Browse tabs." settingId="appearance.page-zoom">
        <select class="field narrow" aria-label="Page zoom" value={browserSettings.value.pageZoom} disabled={zoomBusy} onchange={(event) => void setPageZoom(Number(event.currentTarget.value))}>
          {#each [50, 67, 75, 90, 100, 110, 125, 150, 175, 200] as scale (scale)}<option value={scale}>{scale}%</option>{/each}
        </select>
      </SettingsRow>
    </SettingsGroup>
  {/if}

  <SettingsGroup title="Advanced">
    <SettingsRow title="Interface scale" description="Adjusts AEGIS controls and text." settingId="appearance.scale">
      <select class="field narrow" aria-label="Interface scale" value={appearance.uiScale} onchange={(event) => change({ uiScale: Number(event.currentTarget.value) })}>
        {#each [...new Set([80, 90, 100, 110, 120, 130, 140, appearance.uiScale])].sort((a, b) => a - b) as scale (scale)}<option value={scale}>{scale}%</option>{/each}
      </select>
    </SettingsRow>
    <SettingsRow title="Interface font" settingId="appearance.font">
      <select class="field" aria-label="Interface font" value={appearance.font} onchange={(event) => change({ font: event.currentTarget.value })}>
        {#each Object.entries({ sans: "System", mono: "Monospace", serif: "Serif", opendyslexic: "OpenDyslexic" }) as [id, label] (id)}<option value={id}>{label}</option>{/each}
        {#if !["sans", "mono", "serif", "opendyslexic"].includes(appearance.font)}<option value={appearance.font}>{appearance.font}</option>{/if}
      </select>
    </SettingsRow>
    <SettingsRow title="Reduce motion" settingId="appearance.motion">
      <Switch label="Reduce motion" labelHidden checked={appearance.motion !== "full"} onchange={(on) => change({ motion: on ? "reduced" : "full" })} />
    </SettingsRow>
  </SettingsGroup>
{:else}
  <p class="block" role="status">Appearance controls are unavailable in this window.</p>
{/if}
{#if message}<p class="message" role="status">{message}</p>{/if}
