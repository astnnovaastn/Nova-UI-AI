<script lang="ts">
  /*
   * V33: the browser's settings (V31 BrowserSettings.svelte), now as pages of the unified Settings in
   * Zephium's cards and rows. Each control acts on something real: the engine for typed searches, the new
   * tab's picture and figures, restoring tabs, history, the request blocker and its exceptions, site
   * permissions, downloads, browsing data and focus. Kept in this window's storage (browser-settings) or by
   * the desktop (blocker, permissions); nothing here touches source panes or the agents' isolated browser.
   */
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SearchShortcuts from "$features/settings/components/SearchShortcuts.svelte";
  import { preferences } from "$domain/preferences";
  import SettingsRow from "$shared/ui/SettingsRow";
  import Switch from "$shared/ui/Switch";
  import { browserHost, type BlockerStatus, type DownloadRow, type PermissionRow } from "../browser-host";
  import { browserSettings, wallpaperFrom } from "../browser-settings.svelte";
  import { browserTabs } from "../browser-tabs.svelte";
  import { sidebar, saveSidebar } from "../browser-sidebar.svelte";
  import { ENGINES, searxngTemplate, validTemplate, type EngineId } from "../search-engines";
  import { hostSettings } from "./api";
  import { settingsView, type SettingsSection } from "./settings-view.svelte";

  let { section }: { section: SettingsSection } = $props();

  let blocker = $state<BlockerStatus | null>(null);
  let permissions = $state<PermissionRow[]>([]);
  let downloads = $state<DownloadRow[]>([]);
  let custom = $state(browserTabs.engine.custom ?? "");
  let searxng = $state(browserTabs.engine.searxng ?? "");
  let allowSite = $state("");
  let focusSite = $state("");
  let message = $state("");
  let confirmClear = $state(false);
  const host = hostSettings();
  let orb = $state(host?.orbTheme() ?? "");
  const settings = $derived(browserSettings.value);
  const desktop = browserTabs.available;

  onMount(() => {
    if (section === "search") void preferences.init();
    if (!desktop) return;
    void Promise.all([browserHost.blockerStatus(null), browserHost.permissions().catch(() => []), browserHost.downloads().catch(() => [])])
      .then(([b, p, d]) => { blocker = b; permissions = p; downloads = d; });
  });

  function engine(id: EngineId) {
    message = "";
    if (id === "custom" && !validTemplate(custom)) return (message = "Enter an https address with {query} where the search words go.");
    if (id === "searxng" && !searxngTemplate(searxng)) return (message = "Enter your SearXNG address, for example https://search.example.org.");
    browserTabs.setEngine({ id, ...(custom ? { custom } : {}), ...(searxng ? { searxng } : {}) });
  }

  async function picture(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const data = await wallpaperFrom(file);
      browserSettings.update((draft) => { draft.wallpaper = { kind: "image", data }; });
      message = browserSettings.error;
    } catch (error) {
      message = error instanceof Error ? error.message : "That picture could not be used.";
    }
  }
  async function protection(on: boolean) { blocker = await browserHost.blockerSet(on); }
  async function allow(site: string, on: boolean) {
    try { blocker = await browserHost.blockerAllow(site.trim().replace(/^https?:\/\//, "").split("/")[0] ?? "", on); allowSite = ""; message = ""; }
    catch { message = "Enter a site such as example.com."; }
  }
  async function clear(what: { cookies?: boolean; cache?: boolean }, words: string) {
    await browserHost.clearData(what);
    confirmClear = false;
    message = words;
  }
  const size = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`);
  const number = (event: Event) => Number((event.currentTarget as HTMLInputElement).value);
  const set = (change: (draft: typeof settings) => void) => browserSettings.update(change);
</script>

{#if section === "search"}
  <SettingsGroup title="Search engine">
    <SettingsRow title="Engine" description="Typed words in an address field search here." settingId="search.engine">
      <div class="choices" role="radiogroup" aria-label="Search engine">
        {#each ENGINES.filter((item) => item.id !== "searxng" && item.id !== "custom") as item (item.id)}
          <button type="button" class="pill" role="radio" aria-checked={browserTabs.engine.id === item.id} onclick={() => engine(item.id)}>{item.name.replace(" Search", "")}</button>
        {/each}
      </div>
    </SettingsRow>
    <SettingsRow title="SearXNG" description={browserTabs.engine.id === "searxng" ? "In use." : "Your own SearXNG instance."} settingId="search.searxng">
      <div class="inline"><input class="field" bind:value={searxng} placeholder="https://search.example.org" aria-label="SearXNG address" /><button type="button" class="pill" aria-checked={browserTabs.engine.id === "searxng"} onclick={() => engine("searxng")}>Use</button></div>
    </SettingsRow>
    <SettingsRow title="Custom search" description={browserTabs.engine.id === "custom" ? "In use." : "An https address with {query}."} settingId="search.custom">
      <div class="inline"><input class="field" bind:value={custom} placeholder={"https://example.org/search?q={query}"} aria-label="Custom search address" /><button type="button" class="pill" aria-checked={browserTabs.engine.id === "custom"} onclick={() => engine("custom")}>Use</button></div>
    </SettingsRow>
  </SettingsGroup>
  <SearchShortcuts />
  <SettingsGroup title="Suggestions" description="AEGIS agents never use your engine: they read only permitted sources.">
    <SettingsRow title="Suggest pages from your history" description={`${browserTabs.history.length} pages kept.`} settingId="search.history">
      <Switch label="Suggest pages from your history" labelHidden checked={settings.history} onchange={(on) => set((d) => { d.history = on; })} />
    </SettingsRow>
  </SettingsGroup>
{:else if section === "new-tab"}
  <SettingsGroup title="New tab">
    <SettingsRow title="Background" description="The sky follows AEGIS's theme. A picture is scaled to 1920 px before it is kept." settingId="newtab.background">
      <div class="choices" role="radiogroup" aria-label="Background">
        <button type="button" class="pill" role="radio" aria-checked={settings.wallpaper.kind === "sky"} onclick={() => set((d) => { d.wallpaper = { kind: "sky" }; })}>Sky</button>
        <label class="pill file" role="radio" aria-checked={settings.wallpaper.kind === "image"}>Picture…<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onchange={picture} /></label>
        <button type="button" class="pill" role="radio" aria-checked={settings.wallpaper.kind === "color"} onclick={() => set((d) => { d.wallpaper = { kind: "color", color: d.wallpaper.kind === "color" ? d.wallpaper.color : "#1b1d22" }; })}>Colour</button>
      </div>
    </SettingsRow>
    {#if settings.wallpaper.kind === "color"}
      <SettingsRow title="Colour" settingId="newtab.color">
        <input type="color" value={settings.wallpaper.color} aria-label="Background colour" onchange={(e) => set((d) => { d.wallpaper = { kind: "color", color: (e.currentTarget as HTMLInputElement).value }; })} />
      </SettingsRow>
    {/if}
    <SettingsRow title="Dim your picture" description="So the time reads clearly." settingId="newtab.dim"><Switch label="Dim your picture" labelHidden checked={settings.dim} onchange={(on) => set((d) => { d.dim = on; })} /></SettingsRow>
    <SettingsRow title="Time and date" settingId="newtab.clock"><Switch label="Show the time and date" labelHidden checked={settings.showClock} onchange={(on) => set((d) => { d.showClock = on; })} /></SettingsRow>
    <SettingsRow title="Trackers blocked" settingId="newtab.trackers"><Switch label="Show trackers blocked" labelHidden checked={settings.figures.trackers} onchange={(on) => set((d) => { d.figures.trackers = on; })} /></SettingsRow>
    <SettingsRow title="Focus today" settingId="newtab.focus"><Switch label="Show focus" labelHidden checked={settings.figures.focus} onchange={(on) => set((d) => { d.figures.focus = on; })} /></SettingsRow>
    <SettingsRow title="Tasks due today" settingId="newtab.tasks"><Switch label="Show tasks due today" labelHidden checked={settings.figures.due} onchange={(on) => set((d) => { d.figures.due = on; })} /></SettingsRow>
  </SettingsGroup>
  {#if host}
    <SettingsGroup title="Dashboard orb" description="The orb on the AEGIS voice dashboard. Kept in this window.">
      <SettingsRow title="Orb theme" settingId="orb.theme">
        <select class="field" aria-label="Orb theme" value={orb} onchange={(e) => { orb = (e.currentTarget as HTMLSelectElement).value; host.setOrbTheme(orb); }}>
          {#each host.orbThemes() as theme (theme.name)}<option value={theme.name}>{theme.label}</option>{/each}
        </select>
      </SettingsRow>
    </SettingsGroup>
  {/if}
{:else if section === "tabs"}
  {#if desktop}
    <SettingsGroup title="Sidebar">
      <SettingsRow title="Compact sidebar" settingId="tabs.sidebar">
        <Switch label="Compact sidebar" labelHidden checked={sidebar.collapsed} onchange={(collapsed) => { sidebar.collapsed = collapsed; saveSidebar(); }} />
      </SettingsRow>
    </SettingsGroup>
  {/if}
  <SettingsGroup title="Startup">
    <SettingsRow title="Reopen my tabs when AEGIS starts" description="Restored tabs load only when you open them, so starting stays light." settingId="tabs.restore">
      <Switch label="Reopen my tabs when AEGIS starts" labelHidden checked={settings.restoreTabs} onchange={(on) => set((d) => { d.restoreTabs = on; })} />
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Tab behavior">
    <SettingsRow title="After closing the current tab" settingId="tabs.after-close">
      <select class="field" aria-label="After closing the current tab" value={settings.afterClose}
        onchange={event => set(draft => { draft.afterClose = event.currentTarget.value as typeof settings.afterClose; })}>
        <option value="next">Next tab</option>
        <option value="previous">Previous tab</option>
        <option value="recent">Most recently used</option>
      </select>
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Recently closed">
    {#if browserTabs.closed.length}
      <ul class="rows">{#each browserTabs.closed as row, index (row.url + index)}<li><span>{row.title || row.url}</span><button type="button" class="pill" onclick={() => { settingsView.dismiss(); browserTabs.reopen(index); }}>Reopen</button></li>{/each}</ul>
    {:else}<div class="block">None.</div>{/if}
  </SettingsGroup>
{:else if section === "privacy"}
  {#if desktop}
    <SettingsGroup title="Adverts and trackers" description="Rules: EasyList and EasyPrivacy host rules (CC BY-SA 3.0, the EasyList authors). Element hiding is not applied.">
      <SettingsRow title="Block adverts and trackers in my tabs" description={blocker?.started ? `${blocker.today} blocked today · ${blocker.sinceStart} since AEGIS started${blocker.rules ? ` · ${blocker.rules.toLocaleString()} host rules` : ""}` : "Counts start with the first tab you open."} settingId="privacy.blocker">
        <Switch label="Block adverts and trackers" labelHidden checked={blocker?.enabled ?? true} onchange={(on) => void protection(on)} />
      </SettingsRow>
      {#if blocker?.topHosts.length}<ul class="rows">{#each blocker.topHosts as row (row.host)}<li><span>{row.host}</span><span class="muted">{row.count}</span></li>{/each}</ul>{/if}
    </SettingsGroup>
    <SettingsGroup title="Sites where nothing is blocked">
      {#if blocker?.allowed.length}<ul class="rows">{#each blocker.allowed as site (site)}<li><span>{site}</span><button type="button" class="pill" onclick={() => allow(site, false)}>Remove</button></li>{/each}</ul>{/if}
      <SettingsRow title="Allow a site" settingId="privacy.allow">
        <form class="inline" onsubmit={(e) => { e.preventDefault(); void allow(allowSite, true); }}><input class="field" bind:value={allowSite} placeholder="example.com" aria-label="Site to allow" /><button class="pill" type="submit">Allow</button></form>
      </SettingsRow>
    </SettingsGroup>
  {/if}
  <SettingsGroup title="Browsing data">
    <SettingsRow title="History" description={`Used for address suggestions (${browserTabs.history.length} pages).`} settingId="privacy.history">
      <div class="actions"><Switch label="Keep a history" labelHidden checked={settings.history} onchange={(on) => set((d) => { d.history = on; })} /><button type="button" class="pill" onclick={() => { browserTabs.clearHistory(); message = "History cleared."; }}>Clear</button></div>
    </SettingsRow>
    {#if desktop}
      <SettingsRow title="Cached files" settingId="privacy.cache"><button type="button" class="pill" onclick={() => clear({ cache: true }, "Cached files cleared.")}>Clear cached files</button></SettingsRow>
      <SettingsRow title="Sign-ins and cookies" description="Signs you out of every site in your tabs." settingId="privacy.cookies">
        {#if confirmClear}
          <div class="actions"><button type="button" class="pill danger" onclick={() => clear({ cookies: true, cache: true }, "Signed out of every site in your tabs.")}>Sign out of every site</button><button type="button" class="pill" onclick={() => (confirmClear = false)}>Keep</button></div>
        {:else}<button type="button" class="pill" onclick={() => (confirmClear = true)}>Sign out of all sites…</button>{/if}
      </SettingsRow>
    {/if}
  </SettingsGroup>
{:else if section === "permissions"}
  <SettingsGroup title="Sites that asked" description="Sites ask before using your camera, microphone, location or notifications; your answer lasts until AEGIS closes. AEGIS agents never get these permissions.">
    {#if permissions.length}
      <ul class="rows">{#each permissions as row (row.origin)}<li><span>{row.origin}</span><span class="muted">{Object.entries(row).filter(([k]) => k !== "origin").map(([k, v]) => `${k}: ${v ? "allowed" : "blocked"}`).join(", ")}</span><button type="button" class="pill" onclick={async () => (permissions = await browserHost.resetPermissions(row.origin))}>Forget</button></li>{/each}</ul>
    {:else}<div class="block">No site has asked yet.</div>{/if}
  </SettingsGroup>
{:else if section === "downloads"}
  <SettingsGroup title="Downloads" description="Files go where you choose, Downloads by default.">
    {#if downloads.length}
      <ul class="rows">{#each downloads as row (row.id)}<li><span>{row.filename}</span><span class="muted">{row.state === "completed" ? size(row.total || row.received) : row.state}</span>{#if row.state === "completed"}<button type="button" class="pill" onclick={() => browserHost.showDownload(row.id)}>Show</button>{/if}</li>{/each}</ul>
    {:else}<div class="block">Nothing downloaded since AEGIS started.</div>{/if}
  </SettingsGroup>
{:else if section === "focus"}
  <SettingsGroup title="Focus rounds" description="The Focus page (sidebar Focus, or the new tab's figure) starts, skips and ends rounds.">
    <SettingsRow title="Round length" description="Minutes, 5 to 120." settingId="focus.minutes">
      <input class="field narrow" type="number" min="5" max="120" aria-label="Round length in minutes" value={settings.focus.minutes} onchange={(e) => set((d) => { d.focus.minutes = number(e); })} />
    </SettingsRow>
    <SettingsRow title="Breaks between rounds" description="A short break after each round, a long one every fourth." settingId="focus.breaks">
      <Switch label="Breaks between rounds" labelHidden checked={settings.focus.breaks} onchange={(on) => set((d) => { d.focus.breaks = on; })} />
    </SettingsRow>
    <SettingsRow title="Daily goal" description="Minutes, 15 to 720." settingId="focus.goal">
      <input class="field narrow" type="number" min="15" max="720" aria-label="Daily goal in minutes" value={settings.focus.goal} onchange={(e) => set((d) => { d.focus.goal = number(e); })} />
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="Held back during focus" description="During a focus round, a tab going to a listed site asks first. You can always open one anyway.">
    <SettingsRow title="Hold back these sites" settingId="focus.hold">
      <Switch label="Hold back these sites" labelHidden checked={settings.focus.holdSites} onchange={(on) => set((d) => { d.focus.holdSites = on; })} />
    </SettingsRow>
    <ul class="rows">{#each settings.focus.sites as site (site)}<li><span>{site}</span><button type="button" class="pill" onclick={() => set((d) => { d.focus.sites = d.focus.sites.filter((s) => s !== site); })}>Remove</button></li>{/each}</ul>
    <SettingsRow title="Add a site" settingId="focus.add">
      <form class="inline" onsubmit={(e) => { e.preventDefault(); const s = focusSite.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? ""; if (s) set((d) => { d.focus.sites = [...new Set([...d.focus.sites, s])]; }); focusSite = ""; }}>
        <input class="field" bind:value={focusSite} placeholder="example.com" aria-label="Site to hold back" /><button class="pill" type="submit">Add</button>
      </form>
    </SettingsRow>
  </SettingsGroup>
{/if}
{#if message}<p class="message" role="status">{message}</p>{/if}

<style>
  .file input { display: none; }
</style>
