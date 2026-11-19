<script lang="ts">
  /*
   * V33: AEGIS's one Settings application. Laid out as Zephium's Settings (frame/src/features/settings:
   * components/Settings.svelte, SettingsNavigation.svelte, SettingsIdentity.svelte and styles/browser.css,
   * MPL-2.0): a navigation column with the identity card, a search field and grouped sections, beside
   * a page with its heading and cards of rows. The cards, rows and switches are Zephium's own
   * (shared/ui/SettingsGroup, SettingsRow, Switch, vendored unchanged). Every section holds AEGIS's
   * working settings: what the old dashboard Settings panel (src/settings.ts) and the V31 browser
   * settings offered, in one place.
   */
  import { onMount, tick } from "svelte";
  import Icon from "$shared/ui/Icon";
  import {
    UserCircleIcon, Search01Icon, PaintBoardIcon, Layers01Icon, Shield01Icon, LockKeyIcon, Download01Icon, Clock01Icon,
    CheckListIcon, ChipIcon, Key01Icon, Mic01Icon, Briefcase02Icon, Plug01Icon, ComputerIcon, Cancel01Icon, ArrowRight01Icon,
  } from "@hugeicons/core-free-icons";
  import { GROUPS, SECTIONS, searchSections, settingsView, type SettingsSection } from "./settings-view.svelte";
  import { api, type Preferences } from "./api";
  import BrowserSections from "./BrowserSections.svelte";
  import AppearanceSection from "./AppearanceSection.svelte";
  import AegisSections from "./AegisSections.svelte";
  import AccountsSection from "./AccountsSection.svelte";
  import TasksSection from "./TasksSection.svelte";
  import SkillsPanel from "../SkillsPanel.svelte";

  let { onclose }: { onclose: () => void } = $props();

  const ICONS: Record<SettingsSection, typeof UserCircleIcon> = {
    accounts: UserCircleIcon, search: Search01Icon, appearance: PaintBoardIcon, "new-tab": Layers01Icon, tabs: Layers01Icon, privacy: Shield01Icon,
    permissions: LockKeyIcon, downloads: Download01Icon, focus: Clock01Icon, tasks: CheckListIcon, ai: ChipIcon, keys: Key01Icon,
    voice: Mic01Icon, work: Briefcase02Icon, skills: CheckListIcon, memory: Layers01Icon, connections: Plug01Icon, system: ComputerIcon,
  };
  const BROWSER = new Set<SettingsSection>(["search", "new-tab", "tabs", "privacy", "permissions", "downloads", "focus"]);
  const AEGIS = new Set<SettingsSection>(["ai", "keys", "voice", "work", "memory", "connections", "system"]);

  let content = $state<HTMLElement>();
  let name = $state("");
  const current = $derived(SECTIONS.find((row) => row.id === settingsView.section) ?? SECTIONS[1]!);
  const results = $derived(searchSections(settingsView.query));

  onMount(() => {
    api<Preferences>("/api/settings/preferences").then((prefs) => (name = prefs.user_name)).catch(() => {});
    const renamed = (event: Event) => (name = String((event as CustomEvent).detail ?? name));
    window.addEventListener("aegis-profile-name", renamed);
    return () => window.removeEventListener("aegis-profile-name", renamed);
  });

  // Each open and each section change moves the keyboard to the page heading, as Zephium's Settings does.
  $effect(() => {
    void settingsView.revision;
    void settingsView.section;
    void tick().then(() => {
      if (!content) return;
      content.scrollTop = 0;
      content.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    });
  });

  function keys(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (settingsView.query) settingsView.query = "";
    else onclose();
    event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="aegis-settings" aria-label="Settings" onkeydown={keys}>
  <nav class="side" aria-label="Settings sections">
    <header class="head">
      <h2>Settings</h2>
      <button type="button" class="close" aria-label="Close settings" title="Close settings (Esc)" onclick={onclose}><Icon icon={Cancel01Icon} size={16} strokeWidth={1.7} /></button>
    </header>
    <button type="button" class="item identity" data-section="accounts" aria-current={settingsView.section === "accounts" && !settingsView.query ? "page" : undefined} onclick={() => settingsView.select("accounts")}>
      <span class="avatar" aria-hidden="true">{(name || "A").slice(0, 1).toUpperCase()}</span>
      <span class="copy"><strong>{name || "AEGIS profile"}</strong><small>Local profile on this computer</small></span>
    </button>
    <label class="find">
      <Icon icon={Search01Icon} size={14} />
      <input type="search" placeholder="Search settings" aria-label="Search settings" bind:value={settingsView.query} />
    </label>
    <div class="list">
      {#each GROUPS as group (group.id)}
        <div class="group">
          <h2>{group.label}</h2>
          {#each SECTIONS.filter((row) => row.group === group.id) as item (item.id)}
            <button type="button" class="item" data-section={item.id} aria-current={settingsView.section === item.id && !settingsView.query ? "page" : undefined} onclick={() => settingsView.select(item.id)}>
              <Icon icon={ICONS[item.id]} size={16} strokeWidth={1.7} /><span>{item.title}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </nav>
  <div class="content" bind:this={content}>
    <div class="page">
      {#key settingsView.query ? "search" : current.id}
        <div class="view">
          <header class="heading">
            <h1 tabindex="-1">{settingsView.query ? "Search results" : current.title}</h1>
            {#if !settingsView.query}<p>{current.description}</p>{/if}
          </header>
          {#if settingsView.query}
            {#if results.length}
              <div class="results">
                {#each results as result (result.id)}
                  <button type="button" onclick={() => settingsView.select(result.id)}>
                    <span><strong>{result.title}</strong><small>{result.description}</small></span><Icon icon={ArrowRight01Icon} size={16} />
                  </button>
                {/each}
              </div>
            {:else}
              <p class="empty">No settings match “{settingsView.query}”. <button type="button" class="link" onclick={() => (settingsView.query = "")}>Clear search</button></p>
            {/if}
          {:else if current.id === "accounts"}<AccountsSection />
          {:else if current.id === "appearance"}<AppearanceSection />
          {:else if current.id === "skills"}<SkillsPanel embedded />
          {:else if current.id === "tasks"}<TasksSection onclose={onclose} />
          {:else if BROWSER.has(current.id)}<BrowserSections section={current.id} />
          {:else if AEGIS.has(current.id)}<AegisSections section={current.id} />
          {/if}
        </div>
      {/key}
    </div>
  </div>
</section>

<style>
  /* Zephium's settings shell (styles/browser.css: .settings-shell, .settings-sidebar-navigation,
     .settings-nav-item, .settings-content, .settings-page), on AEGIS's page ground. */
  .aegis-settings { position: absolute; inset: 0; z-index: 40; display: grid; grid-template-columns: 236px minmax(0, 1fr); overflow: hidden; border-radius: inherit; background: var(--color-page, #1b1c1f); color: var(--color-text); font-family: var(--font-sans); -webkit-app-region: no-drag; }
  .side { background: var(--color-chrome); display: flex; flex-direction: column; min-block-size: 0; padding: 0 8px 8px; border-inline-end: 1px solid var(--color-border); }
  .head { display: flex; align-items: center; gap: 8px; min-block-size: 44px; margin-block: 4px 6px; padding-inline: 6px 0; }
  .head h2 { flex: 1; margin: 0; font-size: 14px; font-weight: 550; letter-spacing: -0.015em; }
  .close { display: grid; place-items: center; inline-size: 28px; block-size: 28px; border: 0; border-radius: var(--radius-row, 8px); background: none; color: var(--color-text); cursor: pointer; }
  .close:hover { background: var(--row-hover); }
  .find { display: flex; align-items: center; gap: 6px; min-block-size: var(--search-height, 30px); margin-block-end: 10px; padding-inline: 9px; border-radius: var(--radius-field, 8px); background: var(--color-field); color: var(--color-faint); }
  .find:focus-within { background: var(--color-field-hover); box-shadow: var(--shadow-field-focus); color: var(--color-muted); }
  .find input { inline-size: 100%; min-inline-size: 0; border: 0; outline: none; background: transparent; color: var(--color-text); font: 13px var(--font-sans); }
  .list { min-block-size: 0; overflow-y: auto; scrollbar-width: thin; }
  .group { margin-block: 10px 16px; }
  .group h2 { margin: 0 0 7px; padding-inline: 11px; color: var(--color-faint); font-size: 10px; font-weight: 550; letter-spacing: 0.035em; text-transform: uppercase; user-select: none; }
  .item { position: relative; display: flex; align-items: center; gap: 9px; inline-size: 100%; margin-block: 2px; padding: 8px 10px; border: 0; border-radius: var(--radius-row, 8px); background: transparent; color: var(--color-muted); font: 13px/18px var(--font-sans); text-align: start; cursor: pointer; user-select: none; }
  .item:hover { background: var(--row-hover); color: var(--color-text); }
  .item[aria-current="page"] { background: var(--row-active); box-shadow: var(--row-rim); color: var(--color-text); }
  .item:active { scale: 0.97; }
  .identity { gap: 10px; min-block-size: 46px; margin-block-end: 8px; padding: 7px 9px; }
  .avatar { display: grid; place-items: center; flex: none; inline-size: 30px; block-size: 30px; border-radius: 50%; background: color-mix(in oklab, var(--color-text) 14%, transparent); color: var(--color-text); font-weight: 600; }
  .copy { display: flex; flex-direction: column; gap: 1px; min-inline-size: 0; }
  .copy strong, .copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .copy strong { color: var(--color-text); font-size: 13px; font-weight: 550; line-height: 16px; }
  .copy small { color: var(--color-label-secondary, var(--color-muted)); font-size: 11px; line-height: 15px; }
  .content { min-inline-size: 0; overflow-y: auto; container-type: inline-size; scrollbar-width: thin; }
  .page { --text-label: 12px; max-inline-size: 820px; margin-inline: auto; padding: 44px clamp(22px, 5cqi, 56px) 64px; }
  .view { animation: view-in 220ms cubic-bezier(0.2, 0, 0, 1) both; }
  @keyframes view-in { from { opacity: 0; transform: translateY(10px); } }
  .heading { margin-block-end: 30px; }
  .heading h1 { margin: 0; font-size: 26px; font-weight: 550; line-height: 1.25; letter-spacing: -0.035em; outline: none; }
  .heading p { margin: 8px 0 0; color: var(--color-muted); font-size: 13px; line-height: 1.6; }
  .results { display: grid; gap: 4px; }
  .results button { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border: 0; border-radius: var(--radius-card, 12px); background: var(--color-surface); box-shadow: var(--shadow-card); color: var(--color-text); font: 13px var(--font-sans); text-align: start; cursor: pointer; }
  .results span { display: grid; gap: 2px; }
  .results small { color: var(--color-muted); font-size: 12px; }
  .empty { color: var(--color-muted); font-size: 13px; }
  .link { padding: 0; border: 0; background: none; color: var(--color-text); text-decoration: underline; font: inherit; cursor: pointer; }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--color-accent, var(--color-text)); outline-offset: 1px; }
  :global(html:is([data-motion="none"], [data-motion="reduced"])) .view { animation: none; }
  @media (max-width: 620px) {
    .aegis-settings { grid-template-columns: clamp(108px, 28vw, 156px) minmax(0, 1fr); }
    .page { padding: 24px 12px 40px; }
    .item { overflow-wrap: anywhere; }
    .identity { gap: 5px; padding-inline: 3px; }
    .identity .avatar { inline-size: 22px; block-size: 22px; }
  }
  @media (prefers-reduced-motion: reduce) { .view { animation: none; } }

  /* Shared by the section pages: the controls inside Zephium's rows. */
  .aegis-settings :global(.pill) { display: inline-flex; align-items: center; gap: 6px; block-size: 30px; padding: 0 13px; border: 1px solid var(--color-border); border-radius: 999px; background: none; color: var(--color-text); font: 600 12px var(--font-sans); white-space: nowrap; cursor: pointer; }
  .aegis-settings :global(.pill:hover:not(:disabled)) { background: var(--row-hover); }
  .aegis-settings :global(.pill:disabled) { opacity: 0.45; cursor: default; }
  .aegis-settings :global(.pill.primary) { border-color: transparent; background: var(--color-text); color: var(--color-page, #111); }
  .aegis-settings :global(.pill.danger) { border-color: #c2553f; color: #ff9a85; }
  .aegis-settings :global(.pill[aria-checked="true"]) { border-color: transparent; background: var(--color-text); color: var(--color-page, #111); }
  .aegis-settings :global(.field) { box-sizing: border-box; block-size: 30px; min-inline-size: 0; inline-size: 240px; max-inline-size: 100%; padding: 0 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-field, transparent); color: var(--color-text); font: 13px var(--font-sans); }
  .aegis-settings :global(select.field) { padding-inline-end: 4px; }
  .aegis-settings :global(.field.narrow) { inline-size: 90px; }
  .aegis-settings :global(.choices), .aegis-settings :global(.actions) { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
  .aegis-settings :global(.rows) { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .aegis-settings :global(.rows li) { display: flex; align-items: center; gap: 10px; min-block-size: 40px; padding: 6px 18px; font-size: 13px; }
  .aegis-settings :global(.rows li + li) { border-block-start: 1px solid var(--color-border); }
  .aegis-settings :global(.rows li > span:first-child) { flex: 1; min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .aegis-settings :global(.muted) { color: var(--color-muted); font-size: 12px; }
  .aegis-settings :global(.status) { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: 12px; }
  .aegis-settings :global(.status::before) { content: ""; inline-size: 7px; block-size: 7px; border-radius: 50%; background: var(--color-faint, #777); }
  .aegis-settings :global(.status.on::before) { background: #4cbb75; }
  .aegis-settings :global(.status.off::before) { background: #d0634f; }
  .aegis-settings :global(.message) { margin: -18px 16px 24px; color: var(--color-text); font-size: 12px; }
  .aegis-settings :global(.inline) { display: flex; gap: 6px; }
  .aegis-settings :global(.block) { padding: 12px 18px; font-size: 13px; line-height: 1.5; color: var(--color-muted); }
  .aegis-settings :global(.block p) { margin: 0 0 8px; }
</style>
