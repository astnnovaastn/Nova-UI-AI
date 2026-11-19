<script lang="ts">
  /*
   * AEGIS Browse (V32), laid out as Zephium's browser shell (frame/src/app/browser/Shell.svelte and
   * features/sidebar/components/Sidebar.svelte, MPL-2.0): a sidebar column on the left with page controls,
   * the Browse/Work switch, the address field and the tab list; the page, the new tab or a full page
   * (Tasks, Time, Notes) beside it in one rounded panel. Vendored unchanged from Zephium and answered
   * by native/zephium-bridge: ModeTabs, TabRow, EngineMenu (inside AddressField), TimePage; TasksPage
   * was already vendored. The page itself is a native view placed over `.page` (browser-tabs).
   * Ordinary browsing: no AI request, no research job, and AEGIS agents never see these tabs.
   *
   * V33: the sidebar's head uses Zephium's IconButton and its sizes (SidebarHeader.svelte); collapsing it
   * leaves Zephium's compact rail (TabRail.svelte, SidebarHeader compact) instead of nothing, so showing it
   * again is always one click away and never under the native page view; pinned tabs lead the list
   * (SidebarBody.svelte); colours come from the shared AEGIS tokens (styles.css); the page slides out from
   * under the window caption instead of jumping.
   */
  import { onMount, tick } from "svelte";
  import { BitsConfig } from "bits-ui";
  import Icon from "$shared/ui/Icon";
  import { Add01Icon, ArrowLeft02Icon, ArrowRight02Icon, Cancel01Icon, CheckListIcon, Refresh01Icon, Shield01Icon, SidebarLeftIcon, Clock01Icon } from "@hugeicons/core-free-icons";
  import IconButton from "$shared/ui/IconButton";
  import FavIcon from "$shared/ui/FavIcon";
  import { tabFallbackIcon } from "$features/tabs/lib/tab-icon";
  import ModeTabs from "$features/sidebar/components/ModeTabs.svelte";
  import TabRow from "$features/tabs/components/TabRow.svelte";
  import TimePage from "$features/time/components/TimePage.svelte";
  import TasksPage from "$features/tasks/components/TasksPage.svelte";
  import { tabs as zephiumTabs } from "$domain/tabs";
  import { surface } from "$domain/surface";
  import { preferences } from "$domain/preferences";
  import { favicons } from "$domain/favicons";
  import { focus as zephiumFocus } from "$domain/time";
  import { startBridge } from "./native/zephium-bridge.svelte";
  import { captureNativeActivation } from "./native/core";
  import AddressField from "./AddressField.svelte";
  import BrowserNewTab from "./BrowserNewTab.svelte";
  import BrowserDock from "./BrowserDock.svelte";
  import BrowserRecords from "./BrowserRecords.svelte";
  import BrowserMediaCard from "./BrowserMediaCard.svelte";
  import EngineMark from "$shared/ui/EngineMark";
  import { knownSiteMark } from "./search-engines";
  import NotesPage from "$features/notes/components/NotesPage.svelte";
  import { settingsView } from "./settings/settings-view.svelte";
  import { surface as toolSurface } from "./tools/context.svelte";
  import GoogleSignIn from "./GoogleSignIn.svelte";
  import AddToWork from "./AddToWork.svelte";
  import { browserTabs } from "./browser-tabs.svelte";
  import { browserSettings } from "./browser-settings.svelte";
  import { browserHost } from "./browser-host";
  import { focus } from "./focus.svelte";
  import { today } from "./today-tasks.svelte";

  import { sidebar, saveSidebar } from './browser-sidebar.svelte';

  let page = $state<HTMLElement>();
  let portal = $state<HTMLElement>();
  let resizing = $state(false);
  let drag = $state<{ id: number; y: number; moved: boolean; over: number } | null>(null);
  let ghost = $state<{ from: DOMRect; to: DOMRect } | null>(null);
  /** The Google sign-in band (GoogleSignIn.svelte) is open; it comes back for each sign-in visit. */
  let signInBand = $state(true);
  /** A tab's menu (pin, close), opened from its row. */
  let menu = $state<{ id: number; x: number; y: number } | null>(null);

  const tab = $derived(browserTabs.current);
  const pinnedCount = $derived(browserTabs.tabs.filter((row) => row.pinned).length);
  const pinnedIds = $derived(new Set(browserTabs.tabs.filter((row) => row.pinned).map((row) => String(row.id))));
  const shown = $derived(browserTabs.active !== "work" || browserTabs.page === "notes");
  const website = $derived(Boolean(tab?.url) && browserTabs.page === null);
  const signIn = $derived(Boolean(tab?.url && /^https:\/\/accounts\.google\.com\//.test(tab.url)));

  onMount(() => {
    const stop = startBridge();
    if (browserSettings.value.pageZoom !== 100) {
      void browserHost.setPageZoom?.(browserSettings.value.pageZoom).catch(() => {});
    }
    void preferences.init();
    void favicons.init();
    void surface.init();
    void zephiumTabs.init();
    void zephiumFocus.init();
    // Tasks closes through AEGIS's tools context (tools/context.svelte.ts).
    const closed = (event: Event) => { if (!(event as CustomEvent).detail?.kind && browserTabs.page === "tasks") browserTabs.page = null; };
    window.addEventListener("aegis-tools-page", closed);
    return () => { stop(); window.removeEventListener("aegis-tools-page", closed); };
  });

  $effect(() => {
    if (!signIn) signInBand = true;
  });
  $effect(() => {
    saveSidebar();
  });

  // The native view follows the page area. While the window caption is out, a web page stands below its
  // band, as Zephium's caption moves the page (windows_caption.rs); anything drawn over the page hides it.
  // V33: it slides there over the caption's own fade (the desktop sends its duration). In flight the view
  // only moves, keeping its size, so the site doesn't reflow on every frame (Zephium translates "without
  // reflow"); it takes its final height once, when the caption has settled.
  let band = 0;
  let settled = true;
  let placeNow: ((final: boolean) => void) | null = null;
  $effect(() => {
    const target = browserTabs.caption.shown ? browserTabs.caption.height : 0;
    const duration = browserTabs.caption.duration;
    const from = band, start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      band = from + (target - from) * (1 - (1 - t) ** 3);
      settled = t >= 1;
      placeNow?.(settled);
      if (!settled) frame = requestAnimationFrame(step);
    };
    if (duration > 0 && from !== target) frame = requestAnimationFrame(step);
    else step(start);
    return () => cancelAnimationFrame(frame);
  });
  $effect(() => {
    const element = page;
    void website;
    const settingsOpen = settingsView.isOpen;
    const notice = signIn && signInBand ? 64 : 0;
    void sidebar.width;
    void sidebar.collapsed;
    if (!element || !shown || !website || settingsOpen) {
      placeNow = null;
      browserTabs.setRect(null);
      return;
    }
    const place = (final = true) => {
      const box = element.getBoundingClientRect();
      const top = Math.max(notice, band - box.top);
      const height = settled ? box.height - top : box.height - notice;
      browserTabs.setRect({ x: box.left, y: box.top + top, width: box.width, height: Math.max(0, height) });
      if (final) void browserTabs.attach();
    };
    placeNow = place;
    place();
    const observer = new ResizeObserver(() => place());
    observer.observe(element);
    const resized = () => place();
    window.addEventListener("resize", resized);
    return () => {
      placeNow = null;
      observer.disconnect();
      window.removeEventListener("resize", resized);
    };
  });
  $effect(() => {
    if (!shown || sidebar.collapsed) menu = null;
  });
  $effect(() => {
    browserTabs.cover(settingsView.isOpen || browserTabs.page !== null || browserTabs.overlay || (sidebar.collapsed && browserTabs.shelfOpen) || Boolean(ghost) || Boolean(tab?.error) || Boolean(tab?.held) || !tab?.url || resizing);
  });

  // "Open in browser" from a source window: the page grows out of that window, briefly, then shows.
  $effect(() => {
    const from = browserTabs.origin;
    if (!from || !shown) return;
    browserTabs.origin = null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void tick().then(() => {
      const to = page?.getBoundingClientRect();
      if (!to) return;
      ghost = { from, to };
      setTimeout(() => (ghost = null), 280);
    });
  });

  function openSettings(where = "search") {
    settingsView.open(where);
  }

  function keys(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod || settingsView.isOpen) return;
    const key = event.key.toLowerCase();
    if (key === "t" && event.shiftKey) { event.preventDefault(); browserTabs.reopen(); }
    else if (key === "t") { event.preventDefault(); browserTabs.page = null; browserTabs.newTab(); }
    else if (!shown) return;
    else if (key === "\\") { event.preventDefault(); sidebar.collapsed = !sidebar.collapsed; }
    else if (key === "w" && tab) { event.preventDefault(); browserTabs.close(tab.id); }
    else if (key === "l" && tab) { event.preventDefault(); if (sidebar.collapsed && website) sidebar.collapsed = false; browserTabs.focusFor = tab.id; browserTabs.focusAddress += 1; }
    else if (event.key === "Tab" && browserTabs.tabs.length > 1) {
      event.preventDefault();
      browserTabs.cycle(event.shiftKey);
    }
  }

  // Sidebar width: dragged on its edge, kept between 200 and 420 px (Zephium SidebarResizeHandle bounds its own).
  function resize(event: PointerEvent) {
    const start = event.clientX, from = sidebar.width;
    resizing = true;
    const move = (next: PointerEvent) => (sidebar.width = Math.round(Math.min(420, Math.max(200, from + next.clientX - start))));
    const end = () => { resizing = false; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  }

  // Reordering: press a row and move it; the list shows where it lands.
  const rowAt = (y: number) => {
    const rows = [...document.querySelectorAll<HTMLElement>(".browser .rows [data-index]")];
    const hit = rows.findIndex((row) => { const box = row.getBoundingClientRect(); return y < box.top + box.height / 2; });
    return hit === -1 ? rows.length - 1 : hit;
  };
  function dragMove(event: PointerEvent) {
    if (!drag) return;
    if (!drag.moved && Math.abs(event.clientY - drag.y) < 5) return;
    drag = { ...drag, moved: true, over: rowAt(event.clientY) };
  }
  function dragEnd(event: PointerEvent) {
    if (drag?.moved) {
      if (document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-kept-drop]")) browserTabs.keep(drag.id);
      else browserTabs.move(drag.id, drag.over);
    }
    setTimeout(() => (drag = null));
  }

  function openMenu(event: MouseEvent, id: number) {
    event.preventDefault();
    // Inside the sidebar column, so the native page never paints over it.
    menu = { id, x: Math.min(event.clientX, sidebar.width - 172), y: Math.min(event.clientY, window.innerHeight - 120) };
  }
  function menuKeys(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); menu = null; }
  }

  const at = (box: DOMRect) => `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`;
  const blockedHere = $derived(tab?.url ? tab.blocked : 0);
</script>

<svelte:window onkeydown={(event) => browserTabs.available && keys(event)} onpointermove={dragMove} onpointerup={dragEnd} />

<div class="browser" class:shown class:collapsed={sidebar.collapsed} class:resizing style:--side="{sidebar.width}px" aria-hidden={!shown} inert={!shown}
  onclickcapture={captureNativeActivation} onkeydowncapture={captureNativeActivation}>
  <div class="portals" bind:this={portal}></div>
  {#if portal}<BitsConfig defaultPortalTo={portal}>
  <aside class="side" aria-label="Browser sidebar">
    <!-- Zephium's SidebarHeader: the column's toggle, then back, forward and reload at 28 px. -->
    <header class="head" aria-label="Navigation">
      <IconButton icon={SidebarLeftIcon} label="Compact sidebar (Ctrl+\)" onclick={() => (sidebar.collapsed = true)} />
      <span class="head-gap" aria-hidden="true"></span>
      <div class="nav" role="group" aria-label="Page">
        <IconButton icon={ArrowLeft02Icon} label="Back" buttonSize={28} size={16} disabled={!website || !tab?.back} onclick={() => tab && browserTabs.back(tab.id)} />
        <IconButton icon={ArrowRight02Icon} label="Forward" buttonSize={28} size={16} disabled={!website || !tab?.forward} onclick={() => tab && browserTabs.forward(tab.id)} />
        {#if tab?.loading && website}
          <IconButton icon={Cancel01Icon} label="Stop loading" buttonSize={28} size={16} onclick={() => tab && browserTabs.stop(tab.id)} />
        {:else}
          <IconButton icon={Refresh01Icon} label="Reload" buttonSize={28} size={16} disabled={!website || !tab?.opened} onclick={() => tab && browserTabs.reload(tab.id)} />
        {/if}
      </div>
    </header>

    <div class="modes"><ModeTabs /></div>

    {#if tab && tab.url}
      <div class="address">{#key tab.id}<AddressField tabId={tab.id} url={tab.url} size="compact" onsettings={() => openSettings("search")} onsubmitted={() => (browserTabs.page = null)} />{/key}</div>
    {/if}
    {#if tab?.from}<button type="button" class="back-work" onclick={() => browserTabs.returnToWork(tab?.id ?? null)} title="Back to the research this page came from">← {tab.from.title.length > 30 ? tab.from.title.slice(0, 29) + "…" : tab.from.title}</button>{/if}
    {#if website}<AddToWork {tab} />{/if}

    <button type="button" class="new-row" onclick={() => { browserTabs.page = null; browserTabs.newTab(); }} title="New tab (Ctrl+T)">
      <Icon icon={Add01Icon} size={16} /><span>New tab</span>
    </button>

    <div class="rows" role="tablist" aria-label="Browser tabs">
      {#each zephiumTabs.tabs() as view, index (view.id)}
        {#if pinnedCount > 0 && index === pinnedCount}<div class="divider" aria-hidden="true"></div>{/if}
        <div class="slot" data-index={index} data-pinned={pinnedIds.has(view.id) || undefined} class:lifted={drag?.moved && drag.id === Number(view.id)} class:landing={drag?.moved && drag.over === index && drag.id !== Number(view.id)}>
          <TabRow
            tab={view}
            active={browserTabs.page === null && String(browserTabs.active) === view.id}
            closable={!pinnedIds.has(view.id)}
            splitCandidate={false}
            onSelect={(id) => { if (drag?.moved) return; browserTabs.page = null; browserTabs.show(Number(id)); }}
            onClose={(id) => browserTabs.close(Number(id))}
            onContextMenu={(event, row) => openMenu(event, Number(row.id))}
            onPointerDown={(event, row) => { if (event.button === 0) drag = { id: Number(row.id), y: event.clientY, moved: false, over: index }; }}
            onPointerMove={() => {}}
            onPointerUp={() => {}}
            onPointerCancel={() => (drag = null)}
          />
        </div>
      {/each}
    </div>
    {#if browserTabs.closed.length}
      <button type="button" class="reopen" onclick={() => browserTabs.reopen()} title="Reopen closed tab (Ctrl+Shift+T)">Reopen “{browserTabs.closed[0]!.title || browserTabs.closed[0]!.url}”</button>
    {/if}

    <footer class="tray" aria-label="Browser indicators">
      <button type="button" class="tray-item" title="Adverts and trackers blocked on this page" onclick={() => openSettings("privacy")}><Icon icon={Shield01Icon} size={15} strokeWidth={1.7} /><span>{blockedHere}</span></button>
      <button type="button" class="tray-item" class:on={browserTabs.page === "time"} title="Focus" onclick={() => (browserTabs.page = browserTabs.page === "time" ? null : "time")}><Icon icon={Clock01Icon} size={15} strokeWidth={1.7} /><span>{focus.session ? "On" : "Focus"}</span></button>
      <button type="button" class="tray-item" class:on={browserTabs.page === "tasks"} title="Tasks" onclick={() => (browserTabs.page = browserTabs.page === "tasks" ? null : "tasks")}><Icon icon={CheckListIcon} size={15} strokeWidth={1.7} /><span>{today.counts ? today.counts.today : "Tasks"}</span></button>
    </footer>
    <BrowserMediaCard />
    {#if !sidebar.collapsed}<BrowserDock dragging={!!drag?.moved} />{/if}
    <div class="edge" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" onpointerdown={resize}></div>
  </aside>

  {#if sidebar.collapsed}
    <!-- Zephium's compact column (SidebarHeader compact + TabRail): the switch, then one mark per tab. It
         stands beside the page, never over it, so the way back to the full column can't be covered. -->
    <nav class="compact" aria-label="Browser sidebar, compact">
      <div class="compact-head">
        <IconButton icon={SidebarLeftIcon} label="Expand sidebar (Ctrl+\)" class="reveal-side" onclick={() => (sidebar.collapsed = false)} />
        <ModeTabs compact />
        <span class="compact-rule" aria-hidden="true"></span>
      </div>
      <ul class="rail-list" role="list" aria-label="Open tabs">
        {#each zephiumTabs.tabs() as view, index (view.id)}
          {@const on = browserTabs.page === null && String(browserTabs.active) === view.id}
          {#if pinnedCount > 0 && index === pinnedCount}<li class="compact-rule" aria-hidden="true"></li>{/if}
          <li>
            <button type="button" class="rail-item" data-tab={view.id} title={view.title || "New tab"} aria-label={view.title || "New tab"} aria-current={on ? "page" : undefined}
              onclick={() => { browserTabs.page = null; browserTabs.show(Number(view.id)); }} oncontextmenu={(event) => openMenu(event, Number(view.id))}>
              {#if !favicons.image(view.icon) && knownSiteMark(view.url ?? "")}
                <EngineMark engine={knownSiteMark(view.url ?? "")!} size={16} />
              {:else}<FavIcon image={favicons.image(view.icon)} tone={favicons.tone(view.icon)} loading={view.loading} lit={on} size={16} fallback={tabFallbackIcon(view.content)} />{/if}
            </button>
            {#if !pinnedIds.has(view.id)}<button type="button" class="rail-close" title="Close tab" aria-label={"Close " + (view.title || "tab")} onclick={() => browserTabs.close(Number(view.id))}><Icon icon={Cancel01Icon} size={8} strokeWidth={2.4} /></button>{/if}
          </li>
        {/each}
        <li><button type="button" class="rail-item" title="New tab (Ctrl+T)" aria-label="New tab" onclick={() => { browserTabs.page = null; browserTabs.newTab(); }}><Icon icon={Add01Icon} size={16} /></button></li>
      </ul>
      <div class="compact-tray">
        <button type="button" class="rail-item" class:on={browserTabs.page === "time"} title={focus.session ? "Focus (on)" : "Focus"} aria-label="Focus" onclick={() => (browserTabs.page = browserTabs.page === "time" ? null : "time")}><Icon icon={Clock01Icon} size={16} /></button>
        <button type="button" class="rail-item" class:on={browserTabs.page === "tasks"} title="Tasks" aria-label="Tasks" onclick={() => (browserTabs.page = browserTabs.page === "tasks" ? null : "tasks")}><Icon icon={CheckListIcon} size={16} /></button>
      </div>
      <BrowserDock compact />
    </nav>
  {/if}

  <main class="content">
    <div class="page" class:blank={!website} bind:this={page}>
      {#if browserTabs.page === "tasks"}
        <div class="full"><TasksPage /></div>
      {:else if browserTabs.page === "time"}
        <div class="full"><TimePage /></div>
      {:else if browserTabs.page === "notes"}
        <div class="full"><NotesPage profile="aegis-owner" onclose={() => toolSurface.close()} /></div>
      {:else if browserTabs.page === "history" || browserTabs.page === "bookmarks" || browserTabs.page === "downloads"}
        {#key browserTabs.page}<div class="full"><BrowserRecords page={browserTabs.page} /></div>{/key}
      {:else if tab && !tab.url}
        {#key tab.id}<BrowserNewTab tabId={tab.id} onsettings={() => openSettings("new-tab")} onsearchsettings={() => openSettings("search")} onprofile={() => window.dispatchEvent(new CustomEvent("aegis-profile-menu"))} onfocus={() => (browserTabs.page = "time")} />{/key}
      {:else if tab?.held}
        <div class="problem" role="alert">
          <h2>{tab.held} is held back while you focus</h2>
          <p>You chose to keep this site aside during focus rounds.</p>
          <div class="row"><button type="button" onclick={() => browserTabs.release(tab.id)}>Open anyway</button><button type="button" onclick={() => browserTabs.close(tab.id)}>Close tab</button></div>
        </div>
      {:else if tab?.error}
        <div class="problem" role="alert">
          <h2>This page didn't open</h2>
          <p>{tab.error}</p>
          <button type="button" onclick={() => { tab.error = ""; browserTabs.reload(tab.id); }}>Try again</button>
        </div>
      {/if}
      {#if tab?.download}<p class="download" role="status">{tab.download}</p>{/if}
    </div>
    {#if signIn && website && tab}<GoogleSignIn tabId={tab.id} url={tab.url} bind:open={signInBand} />{/if}
  </main>
  </BitsConfig>{/if}
  {#if menu}{@const row = browserTabs.tabs.find((item) => item.id === menu?.id)}
    {#if row}
      <div class="menu-veil" role="presentation" onpointerdown={() => (menu = null)} oncontextmenu={(event) => { event.preventDefault(); menu = null; }}></div>
      <div class="tab-menu" role="menu" aria-label="Tab" tabindex="-1" style:left="{menu.x}px" style:top="{menu.y}px" onkeydown={menuKeys}>
        <button type="button" role="menuitem" onclick={() => { browserTabs.setPinned(row.id, !row.pinned); menu = null; }}>{row.pinned ? "Unpin tab" : "Pin tab"}</button>
        <button type="button" role="menuitem" disabled={!row.url} onclick={() => { browserTabs.newTab(row.url); menu = null; }}>Duplicate</button>
        <button type="button" role="menuitem" disabled={!row.url} onclick={() => { browserTabs.keep(row.id); menu = null; }}>Keep on shelf</button>
        <button type="button" role="menuitem" onclick={() => { browserTabs.close(row.id); menu = null; }}>Close tab</button>
      </div>
    {/if}
  {/if}
  {#if ghost}<div class="ghost" aria-hidden="true" style={at(ghost.from)} style:--to-x={`${ghost.to.left - ghost.from.left}px`} style:--to-y={`${ghost.to.top - ghost.from.top}px`} style:--to-sx={ghost.to.width / Math.max(1, ghost.from.width)} style:--to-sy={ghost.to.height / Math.max(1, ghost.from.height)}></div>{/if}
</div>

<style>
  /* Zephium's shell: the window's own ground, 8 px gutters, the sidebar column and one rounded panel. */
  /* Browse owns the window, as Zephium's shell does; the Browse/Work switch (ModeTabs) leads back to Work. */
  /* V33: every colour is a shared AEGIS token (styles.css), so Browse and Work stand on one ground. */
  .browser { position: fixed; inset: 0; z-index: 2000; display: none; grid-template-columns: var(--side) minmax(0, 1fr); gap: var(--aegis-gutter); padding: var(--aegis-gutter); background: var(--aegis-bg); color: var(--aegis-text); font-family: var(--font-sans); -webkit-app-region: no-drag; }
  .browser.shown { display: grid; }
  /* Compact: Zephium's 56 px rail (.sidebar-tool-rail) instead of the column; the column stays mounted, so
     its field, its scroll and the page keep their state across any number of collapses. */
  .browser.collapsed { grid-template-columns: 56px minmax(0, 1fr); }
  .browser.collapsed .side { display: none; }
  .browser.resizing { cursor: col-resize; user-select: none; }
  .portals { position: fixed; inset: 0; z-index: 1800; pointer-events: none; }
  .portals :global(> *) { pointer-events: auto; -webkit-app-region: no-drag; }

  .side { position: relative; display: flex; flex-direction: column; gap: var(--sidebar-row-gap, 4px); min-inline-size: 0; min-block-size: 0; }
  .side > :not(.head) { -webkit-app-region: no-drag; }
  /* SidebarHeader: the titlebar's 32 px row, 6 px in from the start and the end, 1 px between buttons. */
  .head { display: flex; align-items: center; gap: 1px; block-size: var(--titlebar-height, 32px); padding-inline: 6px; margin-block-end: 2px; }
  .head { -webkit-app-region: drag; }
  .head :global(.icon-button), .compact :global(.icon-button) { -webkit-app-region: no-drag; }
  .head-gap { flex: 1; align-self: stretch; }
  .nav { display: flex; align-items: center; gap: 2px; }
  .modes { display: flex; padding-block-end: 2px; }
  .address { display: block; padding-block: 2px; }
  .back-work { block-size: 30px; padding: 0 12px; border: 1px solid var(--aegis-border); border-radius: var(--aegis-radius-row); background: none; color: var(--aegis-text-secondary); font: 600 12px var(--font-sans); text-align: start; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
  .back-work:hover { background: var(--aegis-hover); color: var(--aegis-text); }
  /* SidebarBody's new tab row: a row's height, its glyph 10 px from its label, muted until hovered. */
  .new-row { display: flex; align-items: center; gap: 10px; block-size: var(--aegis-row); padding-inline: 8px; border: 0; border-radius: var(--aegis-radius-row); background: transparent; color: var(--aegis-text-muted); font: var(--sidebar-row-weight, 500) var(--sidebar-row-text, 13px) var(--font-sans); letter-spacing: -0.005em; text-align: start; cursor: pointer; transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out); }
  .new-row:hover { background: var(--aegis-hover); color: var(--aegis-text-secondary); }
  .rows { flex: 1; display: flex; flex-direction: column; gap: var(--sidebar-row-gap, 4px); min-block-size: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding-block-end: 4px; }
  .slot { position: relative; }
  .slot.lifted { opacity: 0.5; }
  .slot.landing::before { content: ""; position: absolute; inset-inline: 6px; inset-block-start: -1px; block-size: 2px; border-radius: 2px; background: var(--aegis-accent); }
  /* SidebarBody's rule between the pinned tabs and the rest. */
  .divider { flex: none; block-size: 1px; margin: 3px 8px; background: var(--aegis-border); }
  .reopen { block-size: 28px; padding: 0 8px; border: 0; border-radius: var(--aegis-radius-row); background: none; color: var(--aegis-text-muted); font: 12px var(--font-sans); text-align: start; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
  .reopen:hover { color: var(--aegis-text); background: var(--aegis-hover); }
  .tray { display: flex; gap: 4px; padding-block-start: 6px; border-block-start: 1px solid var(--aegis-border); }
  .tray-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; block-size: 32px; border: 0; border-radius: var(--aegis-radius-row); background: none; color: var(--aegis-text-muted); font: 600 12px var(--font-sans); font-variant-numeric: tabular-nums; cursor: pointer; }
  .tray-item:hover, .tray-item.on { color: var(--aegis-text); background: var(--aegis-hover); }
  .tray-item.on { background: var(--aegis-selected); box-shadow: var(--aegis-selected-rim); }
  .edge { position: absolute; inset-block: 0; inset-inline-end: -6px; inline-size: 6px; cursor: col-resize; -webkit-app-region: no-drag; }

  /* The compact rail (TabRail.svelte): the expanded row with its label taken away, square at the row's height. */
  .compact { display: flex; flex-direction: column; align-items: center; min-block-size: 0; }
  .compact-head { display: flex; flex-direction: column; align-items: center; gap: 3px; padding-block-start: 2px; }
  .compact-rule { flex: none; inline-size: 22px; block-size: 1px; margin: 6px 0 7px; border-radius: 999px; background: var(--aegis-border); list-style: none; }
  .rail-list { flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--sidebar-row-gap, 4px); min-block-size: 0; margin: 0; padding: 0 0 8px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; list-style: none; -webkit-app-region: no-drag; }
  .rail-list > li { position: relative; }
  .rail-item { display: grid; place-items: center; inline-size: var(--aegis-row); block-size: var(--aegis-row); padding: 0; border: 0; border-radius: var(--aegis-radius-row); background: transparent; color: var(--aegis-text-faint); cursor: pointer; transition: background-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), scale var(--motion-slow) var(--ease-spring); -webkit-app-region: no-drag; }
  .rail-item:hover { background: var(--aegis-hover); color: var(--aegis-text-secondary); }
  .rail-item:active { scale: 0.94; }
  .rail-item[aria-current="page"], .rail-item.on { background: var(--aegis-selected); box-shadow: var(--aegis-selected-rim); color: var(--aegis-text); }
  .rail-close { position: absolute; inset-block-start: -3px; inset-inline-end: -3px; display: grid; place-items: center; inline-size: 16px; block-size: 16px; padding: 0; border: 0; border-radius: 999px; background: var(--aegis-float); box-shadow: var(--shadow-badge); color: var(--aegis-text-muted); opacity: 0; scale: 0.6; pointer-events: none; cursor: pointer; transition: opacity var(--motion-fast) var(--ease-out), scale var(--motion-base) var(--ease-spring); }
  .rail-list > li:hover .rail-close, .rail-close:focus-visible { opacity: 1; scale: 1; pointer-events: auto; transition-delay: 160ms, 160ms; }
  .rail-close:hover { color: var(--aegis-text); }
  .compact-tray { display: flex; flex-direction: column; gap: 4px; padding-block-start: 6px; border-block-start: 1px solid var(--aegis-border); -webkit-app-region: no-drag; }

  .content { position: relative; min-inline-size: 0; min-block-size: 0; -webkit-app-region: no-drag; }
  .page { position: absolute; inset: 0; overflow: hidden; border-radius: var(--aegis-radius-content); background: var(--aegis-surface); }
  .full { position: absolute; inset: 0; overflow: auto; display: flex; flex-direction: column; }
  .problem { max-inline-size: 520px; margin: 64px auto 0; padding: 0 24px; }
  h2 { margin: 0 0 8px; font-size: 18px; }
  p { margin: 0 0 16px; color: var(--aegis-text-muted); font-size: 13px; line-height: 1.5; }
  .row { display: flex; gap: 8px; }
  .problem button { padding: 7px 14px; border: 1px solid var(--aegis-border-strong); border-radius: 999px; background: none; color: var(--aegis-text); font: 600 12px var(--font-sans); cursor: pointer; }
  .problem button:hover { background: var(--aegis-hover); }
  .download { position: absolute; inset-inline-end: 16px; inset-block-end: 16px; margin: 0; padding: 8px 14px; border-radius: 999px; background: var(--aegis-float); box-shadow: var(--aegis-shadow-float); color: var(--aegis-text); }
  .ghost { position: fixed; z-index: 90; border: 1px solid var(--aegis-border-strong); border-radius: var(--aegis-radius-content); background: color-mix(in oklab, var(--aegis-surface-raised) 70%, transparent); transform-origin: 0 0; animation: grow 260ms cubic-bezier(0.2, 0, 0, 1) forwards; pointer-events: none; }
  @keyframes grow { to { transform: translate(var(--to-x), var(--to-y)) scale(var(--to-sx), var(--to-sy)); opacity: 0.2; } }

  /* A tab's menu: inside the sidebar column, over a veil that closes it. */
  .menu-veil { position: fixed; inset: 0; z-index: 2001; -webkit-app-region: no-drag; }
  .tab-menu { position: fixed; z-index: 2002; display: flex; flex-direction: column; min-inline-size: 164px; padding: var(--menu-pad, 4px); border-radius: var(--radius-menu, 12px); background: var(--color-menu, var(--aegis-float)); box-shadow: var(--shadow-menu); -webkit-app-region: no-drag; }
  .tab-menu button { display: flex; align-items: center; block-size: 30px; padding: 0 10px; border: 0; border-radius: var(--radius-inset, 8px); background: none; color: var(--aegis-text); font: 13px var(--font-sans); text-align: start; cursor: pointer; }
  .tab-menu button:hover:not(:disabled), .tab-menu button:focus-visible { background: var(--aegis-hover); outline: none; }
  .tab-menu button:disabled { color: var(--aegis-text-faint); cursor: default; }

  button:focus-visible { outline: 2px solid var(--aegis-focus-ring); outline-offset: 1px; }
  @media (prefers-reduced-motion: reduce) { .ghost { animation: none; } .rail-item, .rail-close, .new-row { transition: none; } }
</style>
