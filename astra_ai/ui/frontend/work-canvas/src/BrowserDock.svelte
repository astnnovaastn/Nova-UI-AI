<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Dock from "$features/dock/components/Dock.svelte";
  import Disclosure from "$shared/ui/Disclosure";
  import Icon from "$shared/ui/Icon";
  import EngineMark from "$shared/ui/EngineMark";
  import { ArrowUpRight01Icon, Bookmark01Icon, BubbleChatIcon, CheckListIcon, Clock01Icon, Download01Icon, FolderOpenIcon, Note01Icon, Settings01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
  import { browserTabs } from "./browser-tabs.svelte";
  import { settingsView } from "./settings/settings-view.svelte";
  import { surface } from "./tools/context.svelte";
  import { store } from "./store.svelte";
  import { knownSiteMark } from "./search-engines";

  let { compact = false, dragging = false }: { compact?: boolean; dragging?: boolean } = $props();
  onDestroy(() => { browserTabs.shelfOpen = false; });
  onMount(() => {
    window.addEventListener("aegis-browser-tools-key", nativeKeys);
    return () => window.removeEventListener("aegis-browser-tools-key", nativeKeys);
  });

  function show(page: "history" | "bookmarks" | "downloads" | "tasks" | "time") { browserTabs.page = page; }

  const groups = [
    [
      { name: "Ask AEGIS", icon: BubbleChatIcon, key: "Ctrl+E", run: () => { browserTabs.returnToWork(); store.actions?.openPanel("conversation"); } },
      { name: "Notes", icon: Note01Icon, key: "Ctrl+Shift+E", run: () => void surface.open("notes") },
      { name: "Tasks", icon: CheckListIcon, key: "Ctrl+Shift+K", run: () => show("tasks") },
      { name: "Time", icon: Clock01Icon, key: "Ctrl+Shift+F", run: () => show("time") },
    ],
    [
      { name: "History", icon: Clock01Icon, key: "Ctrl+H", run: () => show("history") },
      { name: "Downloads", icon: Download01Icon, key: "Ctrl+J", run: () => show("downloads") },
      { name: "Bookmarks", icon: Bookmark01Icon, key: "Ctrl+Shift+O", run: () => show("bookmarks") },
    ],
    [{ name: "Settings", icon: Settings01Icon, key: "Ctrl+,", run: () => settingsView.open() }],
  ];

  function choose(key: string, shift: boolean) {
    return groups.flat().find(item => item.key === "Ctrl+" + (shift ? "Shift+" : "") + key.toUpperCase());
  }

  function nativeKeys(event: Event) {
    if (settingsView.isOpen || browserTabs.active === "work") return;
    const {key, shift} = (event as CustomEvent<{key: string; shift?: boolean}>).detail;
    choose(key, Boolean(shift))?.run();
  }

  function keys(event: KeyboardEvent) {
    if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey || settingsView.isOpen || (browserTabs.active === "work" && browserTabs.page !== "notes")) return;
    const row = choose(event.key, event.shiftKey);
    if (row) { event.preventDefault(); row.run(); }
  }
</script>

<svelte:window onkeydown={keys} />

<Dock {compact}>
  {#snippet shelf()}
    <div class="shelf">
      <Disclosure menu label="Browser tools" triggerClass="shelf-trigger" panelClass="shelf-stack browser-tools-menu"
        onopen={() => browserTabs.shelfOpen = true} onclose={() => browserTabs.shelfOpen = false}>
        {#snippet trigger()}<Icon icon={UserCircleIcon} size={18} />{/snippet}
        <button type="button" role="menuitem" class="ui-menu-item" onclick={() => settingsView.open("accounts")}><Icon icon={UserCircleIcon} size={16} /> Personal</button>
        {#each groups as group, index (index)}
          <div class="shelf-rule" role="separator"></div>
          {#each group as item (item.name)}
            <button type="button" role="menuitem" class="ui-menu-item" onclick={item.run}>
              <Icon icon={item.icon} size={16} /><span>{item.name}</span><kbd>{item.key}</kbd>
            </button>
          {/each}
        {/each}
      </Disclosure>
    </div>
  {/snippet}
  {#snippet sites()}
    {#if !compact}
      <div class="kept" class:dragging data-kept-drop>
        {#each browserTabs.kept.slice(0, 5) as item (item.url)}
          {@const mark = knownSiteMark(item.url)}
          <button type="button" title={item.title} aria-label={"Open kept tab " + item.title} onclick={() => browserTabs.openAddress(item.url)}>
            {#if mark}<EngineMark engine={mark} size={17} />{:else}<Icon icon={ArrowUpRight01Icon} size={17} />{/if}
          </button>
        {:else}<span>Drag a tab here to keep it</span>{/each}
        {#if browserTabs.kept.length > 5}<button type="button" aria-label="All bookmarks" onclick={() => show("bookmarks")}><Icon icon={FolderOpenIcon} size={17} /></button>{/if}
      </div>
    {/if}
  {/snippet}
</Dock>

<style>
  .shelf { position: relative; z-index: 20; flex: none; }
  .shelf :global(.shelf-trigger) {
    display: grid; place-items: center; inline-size: 40px; block-size: 40px; padding: 0;
    border: 0; border-radius: var(--radius-capsule); background: var(--color-fill); color: var(--color-muted); box-shadow: var(--shine-top);
  }
  .shelf :global(.browser-tools-menu) { inset-block: auto calc(100% + 8px); inline-size: min(236px, calc(var(--side) - 12px), 68vw); padding: 6px; background: var(--color-menu, var(--color-float)); }
  :global(.browser.collapsed) .shelf :global(.browser-tools-menu) { inline-size: min(236px, 68vw); }
  .shelf :global(.ui-menu-item) { gap: 9px; }
  .shelf-rule { block-size: 1px; margin: 4px 8px; background: var(--color-border); }
  kbd { margin-inline-start: auto; color: var(--color-muted); font: 11px var(--font-sans); white-space: nowrap; }
  .kept { display: flex; gap: 4px; align-items: center; justify-content: center; min-inline-size: 0; min-block-size: 40px; padding: 3px; border-radius: 18px; background: var(--color-fill); color: var(--color-muted); }
  .kept span { font-size: 12px; text-align: center; padding-inline: 4px; }
  .kept.dragging { box-shadow: inset 0 0 0 1px var(--color-ring); }
  .kept button { display: grid; place-items: center; inline-size: 30px; block-size: 30px; flex: 1; min-inline-size: 0; border: 0; border-radius: 12px; background: transparent; color: var(--color-text); }
  .kept button:hover { background: var(--color-fill-active); }
</style>
