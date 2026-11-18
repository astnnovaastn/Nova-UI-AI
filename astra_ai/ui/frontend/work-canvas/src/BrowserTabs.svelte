<script lang="ts">
  /*
   * V30: AEGIS Desktop's browser. A tab strip whose first tab is the Work canvas, real web pages in the
   * other tabs, an address bar that opens addresses and searches with the person's chosen engine, and
   * back, forward, reload and stop. The page itself is a native view placed over `.page` (browser-tabs).
   * Ordinary browsing: no AI request, no research job, and AEGIS agents never see these tabs.
   */
  import { browserTabs } from "./browser-tabs.svelte";
  import { ENGINES, displayEntry, engineName, searxngTemplate, validTemplate, type EngineId } from "./search-engines";

  let page = $state<HTMLElement>();
  let address = $state<HTMLInputElement>();
  let typed = $state("");
  let editing = $state(false);
  let settings = $state(false);
  let custom = $state(browserTabs.engine.custom ?? "");
  let searxng = $state(browserTabs.engine.searxng ?? "");
  let settingsError = $state("");

  const tab = $derived(browserTabs.current);
  const shown = $derived(browserTabs.active !== "work");

  // The address field shows the page (or the search words) unless the person is typing in it.
  $effect(() => {
    const url = tab?.url ?? "";
    if (!editing) typed = url ? displayEntry(url, browserTabs.engine) : "";
  });

  // A new empty tab puts the cursor in its address field.
  $effect(() => {
    void browserTabs.focusAddress;
    if (!browserTabs.focusAddress) return;
    // Effects run after the DOM update, so the field takes the keyboard at once and no typed letter is lost.
    address?.focus();
  });

  // The native view follows the page area; anything drawn over it (settings, an error) hides it.
  $effect(() => {
    const element = page;
    if (!element || !shown) {
      browserTabs.setRect(null);
      return;
    }
    const place = () => {
      const box = element.getBoundingClientRect();
      browserTabs.setRect({ x: box.left, y: box.top, width: box.width, height: box.height });
      void browserTabs.attach();
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  });
  $effect(() => {
    browserTabs.cover(settings || Boolean(tab?.error) || !tab?.url);
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!tab) return;
    if (browserTabs.go(tab.id, typed)) {
      editing = false;
      address?.blur();
    }
  }

  function chooseEngine(id: EngineId) {
    settingsError = "";
    if (id === "custom" && !validTemplate(custom)) {
      settingsError = "Enter an https address with {query} where the search words go.";
      return;
    }
    if (id === "searxng" && !searxngTemplate(searxng)) {
      settingsError = "Enter your SearXNG address, for example https://search.example.org.";
      return;
    }
    browserTabs.setEngine({ id, ...(custom ? { custom } : {}), ...(searxng ? { searxng } : {}) });
    settings = false;
  }

  function keys(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "t") { event.preventDefault(); browserTabs.newTab(); }
    else if (!shown) return;
    else if (mod && event.key.toLowerCase() === "w" && tab) { event.preventDefault(); browserTabs.close(tab.id); }
    else if (mod && event.key.toLowerCase() === "l" && tab) { event.preventDefault(); address?.focus(); address?.select(); }
  }

  const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
</script>

<svelte:window onkeydown={(event) => browserTabs.available && keys(event)} />

<div class="browser" class:shown aria-hidden={!shown} inert={!shown}>
  <div class="strip" role="tablist" aria-label="Browser tabs">
    <button type="button" role="tab" class="tab work" aria-selected={browserTabs.active === "work"} onclick={() => browserTabs.show("work")}>
      <span class="dot" aria-hidden="true"></span><span class="name">Work</span>
    </button>
    {#each browserTabs.tabs as row (row.id)}
      <div class="tab" class:active={browserTabs.active === row.id} role="presentation">
        <button type="button" role="tab" class="pick" aria-selected={browserTabs.active === row.id} title={row.title || row.url} onclick={() => browserTabs.show(row.id)}>
          {#if row.loading}<span class="spin" aria-hidden="true"></span>
          {:else if row.favicon}<img src={row.favicon} alt="" width="14" height="14" referrerpolicy="no-referrer" />
          {:else}<span class="globe" aria-hidden="true"></span>{/if}
          <span class="name">{row.title || hostOf(row.url) || "New tab"}</span>
        </button>
        <button type="button" class="close" aria-label="Close {row.title || 'tab'}" title="Close tab (Ctrl+W)" onclick={() => browserTabs.close(row.id)}>×</button>
      </div>
    {/each}
    <button type="button" class="add" aria-label="New tab" title="New tab (Ctrl+T)" onclick={() => browserTabs.newTab()}>+</button>
  </div>

  {#if tab}
    <form class="bar" onsubmit={submit}>
      <button type="button" aria-label="Back" title="Back" disabled={!tab.back} onclick={() => browserTabs.back(tab.id)}>‹</button>
      <button type="button" aria-label="Forward" title="Forward" disabled={!tab.forward} onclick={() => browserTabs.forward(tab.id)}>›</button>
      {#if tab.loading}
        <button type="button" aria-label="Stop loading" title="Stop" onclick={() => browserTabs.stop(tab.id)}>✕</button>
      {:else}
        <button type="button" aria-label="Reload" title="Reload" disabled={!tab.opened} onclick={() => browserTabs.reload(tab.id)}>↻</button>
      {/if}
      <input
        bind:this={address}
        bind:value={typed}
        class="address"
        type="text"
        spellcheck="false"
        autocomplete="off"
        aria-label="Address or search"
        placeholder="Search with {engineName(browserTabs.engine)} or enter an address"
        onfocus={() => { editing = true; address?.select(); }}
        onblur={() => (editing = false)}
        onkeydown={(event) => { if (event.key === "Escape") { editing = false; typed = tab.url ? displayEntry(tab.url, browserTabs.engine) : ""; address?.blur(); } }}
      />
      <button type="button" class="engine" aria-expanded={settings} aria-label="Search engine: {engineName(browserTabs.engine)}" title="Search engine" onclick={() => (settings = !settings)}>{engineName(browserTabs.engine)}</button>
    </form>
  {/if}

  <div class="page" bind:this={page}>
    {#if settings}
      <section class="sheet" aria-label="Search engine">
        <h2>Search engine for your tabs</h2>
        <p>Used when you type words instead of an address. AEGIS agents never use it: they read only permitted sources.</p>
        <div class="engines" role="radiogroup" aria-label="Search engine">
          {#each ENGINES as engine (engine.id)}
            <button type="button" role="radio" aria-checked={browserTabs.engine.id === engine.id} onclick={() => chooseEngine(engine.id)}>{engine.name}</button>
          {/each}
        </div>
        <label>SearXNG address <input bind:value={searxng} placeholder="https://search.example.org" /></label>
        <button type="button" class="use" onclick={() => chooseEngine("searxng")}>Use SearXNG</button>
        <label>Custom search address <input bind:value={custom} placeholder="https://example.org/search?q={'{query}'}" /></label>
        <button type="button" class="use" onclick={() => chooseEngine("custom")}>Use custom</button>
        {#if settingsError}<p role="alert">{settingsError}</p>{/if}
        <button type="button" class="done" onclick={() => (settings = false)}>Done</button>
      </section>
    {:else if tab && !tab.url}
      <div class="start">
        <h2>New tab</h2>
        <p>Search with {engineName(browserTabs.engine)} or type an address above. Your Work canvas stays where you left it.</p>
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
</div>

<style>
  .browser {
    position: absolute;
    inset: 0;
    z-index: 70;
    display: none;
    grid-template-rows: auto auto 1fr;
    background: var(--color-surface, #16171a);
    color: var(--color-text);
    font-family: var(--font-sans);
  }
  .browser.shown { display: grid; }
  .strip {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    padding: 8px 10px 0;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--color-border);
  }
  .tab, .add {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 32px;
    border-radius: 10px 10px 0 0;
    color: var(--color-muted);
  }
  .tab { flex: 0 1 220px; }
  .tab.work { flex: 0 0 auto; padding: 0 14px; gap: 8px; border: 0; background: none; font: 600 12px var(--font-sans); cursor: pointer; }
  .tab.active, .tab.work[aria-selected="true"] { background: var(--color-raised); color: var(--color-text); }
  .tab .pick { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; height: 100%; padding: 0 4px 0 12px; border: 0; background: none; color: inherit; font: 500 12px var(--font-sans); cursor: pointer; text-align: start; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .close { width: 22px; height: 22px; margin-inline-end: 6px; border: 0; border-radius: 6px; background: none; color: inherit; font-size: 15px; cursor: pointer; }
  .close:hover, .tab .pick:hover, .add:hover { color: var(--color-text); }
  .add { justify-content: center; width: 32px; border: 0; background: none; font-size: 18px; cursor: pointer; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #ff8a3d; }
  .globe { width: 12px; height: 12px; border: 1.5px solid currentColor; border-radius: 50%; }
  .spin { width: 12px; height: 12px; border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .bar { display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--color-raised); border-bottom: 1px solid var(--color-border); }
  .bar > button { width: 30px; height: 30px; border: 0; border-radius: 8px; background: none; color: var(--color-text); font-size: 17px; cursor: pointer; }
  .bar > button:disabled { opacity: 0.35; cursor: default; }
  .bar > button:not(:disabled):hover { background: color-mix(in oklab, var(--color-text) 8%, transparent); }
  .address { flex: 1; min-width: 0; height: 32px; padding: 0 14px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface, #16171a); color: var(--color-text); font: 13px var(--font-sans); }
  .address:focus { outline: 2px solid color-mix(in oklab, var(--color-text) 40%, transparent); outline-offset: 0; }
  .bar > .engine { width: auto; padding: 0 12px; font: 600 12px var(--font-sans); color: var(--color-muted); }
  .page { position: relative; min-height: 0; }
  .sheet, .start, .problem { max-width: 520px; margin: 64px auto 0; padding: 0 24px; }
  h2 { margin: 0 0 8px; font-size: 18px; }
  p { margin: 0 0 16px; color: var(--color-muted); font-size: 13px; line-height: 1.5; }
  .engines { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .engines button, .use, .done, .problem button { padding: 7px 14px; border: 1px solid var(--color-border); border-radius: 999px; background: none; color: var(--color-text); font: 600 12px var(--font-sans); cursor: pointer; }
  .engines button[aria-checked="true"] { background: var(--color-text); color: var(--color-surface, #16171a); }
  label { display: grid; gap: 6px; margin: 12px 0 6px; font-size: 12px; color: var(--color-muted); }
  label input { height: 32px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface, #16171a); color: var(--color-text); font: 13px var(--font-sans); }
  .done { margin-top: 20px; }
  .download { position: absolute; inset-inline-end: 16px; inset-block-end: 16px; margin: 0; padding: 8px 14px; border-radius: 999px; background: var(--color-float); box-shadow: var(--shadow-popover); color: var(--color-text); }
  button:focus-visible { outline: 2px solid var(--color-text); outline-offset: 1px; }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
