<script lang="ts">
  // The page-sized field uses Zephium's SearchField, EngineMenu and NewTabSearch dock styling.
  // Navigation and suggestions use AEGIS's own browser tabs and local visit history.
  import { untrack } from "svelte";
  import SearchField from "$shared/ui/SearchField";
  import * as m from "$shared/i18n/messages";
  import Icon from "$shared/ui/Icon";
  import { Cancel01Icon } from "@hugeicons/core-free-icons";
  import { browserTabs, suggest } from "./browser-tabs.svelte";
  import EngineMenu from "$features/search/components/EngineMenu.svelte";
  import { displayEntry, engineName, resolveEntry } from "./search-engines";

  let {
    tabId,
    url = "",
    size = "large",
    onsubmitted,
    onsettings,
  }: {
    tabId: number;
    /** The page the tab shows, displayed while the field is not being edited. */
    url?: string;
    size?: "large" | "compact";
    onsubmitted?: () => void;
    /** Opens the search settings, from the engine menu's "Edit" entry. */
    onsettings?: () => void;
  } = $props();

  let input = $state<HTMLInputElement>();
  let typed = $state("");
  let editing = $state(false);
  let chosen = $state(-1);
  let engines = $state(false);
  let engineHost = $state<HTMLElement>();
  let dismissed = $state(false);
  /** The click that focused the field selects the whole address, as a browser's address bar does. */
  let selectOnUp = false;

  $effect(() => {
    const address = url;
    typed = address ? untrack(() => displayEntry(address, browserTabs.engine)) : "";
  });
  // A focus request names its tab and is used once, so a field mounted later (the sidebar's, after a page
  // opens) does not replay an earlier one and open its suggestions over the page (V32 fix).
  $effect(() => {
    void browserTabs.focusAddress;
    if (!input || browserTabs.focusFor !== tabId || browserTabs.active !== tabId) return;
    browserTabs.focusFor = null;
    input?.focus();
    input?.select();
  });

  type Suggestion = { kind: "tab" | "visit" | "entry"; title: string; url: string; id?: number };
  const suggestions = $derived.by((): Suggestion[] => {
    if (!editing || dismissed || !typed.trim() || typed === displayEntry(url, browserTabs.engine)) return [];
    const words = typed.toLowerCase();
    const open = browserTabs.tabs
      .filter((tab) => tab.id !== tabId && tab.url && (tab.title + " " + tab.url).toLowerCase().includes(words))
      .slice(0, 2)
      .map((tab) => ({ kind: "tab" as const, title: tab.title || tab.url, url: tab.url, id: tab.id }));
    const visits = suggest(browserTabs.history, typed, 5)
      .filter((visit) => !open.some((row) => row.url === visit.url))
      .map((visit) => ({ kind: "visit" as const, title: visit.title || visit.url, url: visit.url }));
    const entry = resolveEntry(typed, browserTabs.engine, browserTabs.shortcuts);
    const first: Suggestion[] = entry ? [{ kind: "entry", title: entry.search ? `Search ${(entry.destination ?? engineName(browserTabs.engine))} for “${typed.trim()}”` : typed.trim(), url: entry.url }] : [];
    return [...first, ...open, ...visits].slice(0, 7);
  });

  // Scope native-page occlusion to this field's menu trigger.
  $effect(() => {
    const host = engineHost;
    if (!host || size !== "compact") return;
    const read = () => { engines = Boolean(host.querySelector('button[aria-expanded="true"]')); };
    const watch = new MutationObserver(read);
    watch.observe(host, { attributes: true, attributeFilter: ["aria-expanded"], childList: true, subtree: true });
    read();
    return () => watch.disconnect();
  });

  // A list drawn over a website would be under its native view, so the page steps aside while one is open.
  $effect(() => {
    const over = engines || suggestions.length > 0;
    if (size === "compact") browserTabs.overlay = over;
    return () => { if (size === "compact") browserTabs.overlay = false; };
  });

  function open(row: Suggestion | null) {
    const target = row ?? suggestions[0] ?? null;
    if (target?.kind === "tab" && target.id !== undefined) browserTabs.show(target.id);
    else if (!browserTabs.go(tabId, target && target.kind !== "entry" ? target.url : typed)) return;
    editing = false;
    chosen = -1;
    input?.blur();
    onsubmitted?.();
  }

  function keys(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      chosen = (chosen + 1) % suggestions.length;
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      chosen = chosen <= 0 ? suggestions.length - 1 : chosen - 1;
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(chosen >= 0 ? (suggestions[chosen] ?? null) : null);
    } else if (event.key === "Escape") {
      if (suggestions.length && !dismissed) dismissed = true;
      else {
        editing = false;
        typed = url ? displayEntry(url, browserTabs.engine) : "";
        input?.blur();
      }
    }
  }


  const host = (address: string) => { try { return new URL(address).hostname.replace(/^www\./, ""); } catch { return address; } };
  const listId = $props.id();
</script>

<div class="field {size}" class:focused={editing} data-glass-text>
  <div class="bar">
    <SearchField
      size={size === "large" ? "page" : "chrome"}
      label="Address or search"
      placeholder={size === "large" ? m.search_web_short() : "Search or enter an address"}
      bind:ref={input}
      bind:value={typed}
      oninput={() => { dismissed = false; chosen = -1; }}
      onsubmit={() => open(chosen >= 0 ? (suggestions[chosen] ?? null) : null)}
      inputProps={{
        role: "combobox",
        "aria-label": "Address or search",
        "aria-autocomplete": "list",
        "aria-controls": suggestions.length ? listId : undefined,
        "aria-expanded": suggestions.length > 0,
        "aria-activedescendant": chosen >= 0 ? listId + "-" + chosen : undefined,
        maxlength: 2048,
        spellcheck: false,
        autocapitalize: "off",
        autocorrect: "off",
        style: editing && typed ? "padding-inline-end: 38px" : undefined,
        onfocus: () => { editing = true; dismissed = false; selectOnUp = Boolean(url); },
        onmouseup: (event) => {
          if (selectOnUp) { event.preventDefault(); input?.select(); }
          selectOnUp = false;
        },
        onblur: () => { editing = false; chosen = -1; selectOnUp = false; },
        onkeydown: keys,
      }}
    >
      {#snippet lead()}
        <span class="engine-slot" bind:this={engineHost}>
          <EngineMenu query={typed} awake={size === "large" || editing || !!typed} loadMenu={() => import("$shared/ui/Menu")} size={size === "compact" ? 16 : 18}
            onpick={(next) => {
              if (next !== null) typed = next;
              input?.focus();
              if (next !== null && input) {
                input.value = next;
                input.setSelectionRange(next.length, next.length);
              }
            }} {onsettings} />
        </span>
      {/snippet}
    </SearchField>
  </div>
  {#if editing && typed}
    <button type="button" class="clear" aria-label="Clear" title="Clear" onmousedown={(event) => event.preventDefault()} onclick={() => { typed = ""; input?.focus(); }}>
      <Icon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
    </button>
  {/if}
  {#if suggestions.length}
    <ul class="suggestions" id={listId} role="listbox" aria-label="Suggestions">
      {#each suggestions as row, index (row.kind + row.url)}
        <li id="{listId}-{index}" role="option" aria-selected={chosen === index}>
          <button type="button" tabindex="-1" onmousedown={(event) => event.preventDefault()} onclick={() => open(row)}>
            <span class="kind">{row.kind === "tab" ? "Tab" : row.kind === "visit" ? "History" : resolveEntry(typed, browserTabs.engine, browserTabs.shortcuts)?.search ? "Search" : "Go"}</span>
            <span class="title">{row.title}</span>
            {#if row.kind !== "entry"}<span class="site">{host(row.url)}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .field { position: relative; inline-size: 100%; -webkit-app-region: no-drag; }
  .engine-slot { display: contents; }
  .field :global(button), .field :global(input) { -webkit-app-region: no-drag; }
  .large {
    position: relative;
    display: flex;
    align-items: center;
    block-size: 100%;
    padding-block: 3px;
    -webkit-app-region: no-drag;
    text-align: start;
  }

  .bar {
    position: relative;
    inline-size: 100%;
  }

  /* The notch is the field's shape and material, so the field inside it is
     only its words. Set here rather than as a size of the shared field, which
     every page would pay for on behalf of this one. */
  .large .bar :global(.ui-search[data-size]),
  .large .bar :global(.ui-search[data-size]:hover),
  .large .bar :global(.ui-search[data-size]:focus-within) {
    min-height: 44px;
    padding-inline: 18px;
    gap: 11px;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .large .bar :global(.ui-search[data-size] > svg) {
    inline-size: 16px;
    block-size: 16px;
  }

  .large .bar :global(.ui-search[data-size] input) {
    height: 44px;
    font-size: 15px;
    -webkit-app-region: no-drag;
    letter-spacing: -0.008em;
  }

  .compact .bar :global(.ui-search) {
    min-height: 34px;
    border-radius: var(--aegis-radius-row);
    background: var(--aegis-input);
    box-shadow: var(--shadow-tile, none);
  }
  .compact .bar :global(.ui-search:hover),
  .compact .bar :global(.ui-search:focus-within) { background: var(--aegis-input-hover); }
  .compact .bar :global(.ui-search:focus-within) { box-shadow: var(--aegis-input-focus); }
  .compact .bar :global(input) { height: 34px; font-size: 13px; }
  .clear { position: absolute; inset-inline-end: 8px; inset-block-start: 50%; translate: 0 -50%; display: grid; place-items: center; inline-size: 26px; block-size: 26px; margin-inline-end: 7px; border: 0; border-radius: 50%; background: none; color: var(--color-muted); cursor: pointer; }
  .clear:hover { color: var(--color-text); background: color-mix(in oklab, var(--color-text) 8%, transparent); }
  .suggestions {
    position: absolute; z-index: 20; margin: 0; padding: 6px; list-style: none;
    border: 1px solid var(--aegis-border); border-radius: 14px; background: var(--aegis-surface-raised);
    box-shadow: var(--aegis-shadow-overlay);
  }
  .suggestions { inset-block-start: calc(100% + 8px); inset-inline: 0; }
  .suggestions button { display: flex; align-items: baseline; gap: 10px; inline-size: 100%; padding: 8px 10px; border: 0; border-radius: 8px; background: none; color: var(--color-text); font: 13px var(--font-sans); text-align: start; cursor: pointer; }
  .suggestions li[aria-selected="true"] button, .suggestions button:hover { background: color-mix(in oklab, var(--color-text) 9%, transparent); }
  .kind { flex: none; inline-size: 52px; color: var(--color-muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .title { flex: 1; min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .site { flex: none; color: var(--color-muted); font-size: 12px; }
  button:focus-visible { outline: 2px solid var(--aegis-focus-ring); outline-offset: 1px; }
  @media (prefers-reduced-motion: reduce) { .field { transition: none; } }
</style>
