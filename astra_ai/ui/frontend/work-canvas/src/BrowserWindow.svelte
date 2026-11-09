<!--
  One source window: Zephium's own BrowserPane (MPL-2.0) for the chrome, moving and resizing.
  Zephium paints a native webview into the pane; a browser build has only an iframe, so that is
  what goes in the hole, locked down below. The page loads straight from its own site, with no
  proxy, and a site that refuses framing is told so rather than worked around.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import BrowserPane from "$features/work/components/pane/BrowserPane.svelte";
  import { blockedWords, normalizeAddress } from "./browser-address";
  import { browser, type BrowserWindowState } from "./browser-windows.svelte";
  import { store } from "./store.svelte";
  import type { SourceInfo } from "./research-to-run";

  let {
    entry,
    bounds,
    info,
    added,
  }: { entry: BrowserWindowState; bounds: DOMRect; info: SourceInfo | undefined; added: boolean } = $props();

  const actions = $derived(store.actions);
  const url = $derived(entry.history[entry.index] ?? "");
  const STUCK_AFTER = 20000;

  /** Checking the site's rules, showing the page, or a reason it can't be shown. */
  let view = $state<"checking" | "frame" | "blocked">("checking");
  let blockedReason = $state("");
  /** The site's rules couldn't be read in advance, so a refusal would only show inside the frame. */
  let unverified = $state(false);
  let loaded = $state(false);
  let stuck = $state(false);
  /** Its own links were followed; the address shown is where this window started. */
  let moved = $state(false);
  let details = $state(false);

  $effect(() => {
    const address = url;
    void entry.load;
    untrack(() => {
      view = "checking";
      loaded = false;
      stuck = false;
      moved = false;
      unverified = false;
      blockedReason = "";
    });
    if (!normalizeAddress(address, location.host)) {
      blockedReason = "address";
      view = "blocked";
      return;
    }
    let current = true;
    void Promise.resolve(actions?.checkFrame(address))
      .catch(() => ({ embeddable: null, reason: "unchecked" }))
      .then((verdict) => {
        if (!current) return;
        if (verdict?.embeddable === false) {
          blockedReason = verdict.reason;
          view = "blocked";
          return;
        }
        unverified = verdict?.embeddable !== true;
        view = "frame";
      });
    return () => {
      current = false;
    };
  });

  /** Built by hand because credentialless must be set before the address is. */
  function pageFrame(host: HTMLElement, address: string) {
    let timer = 0;
    let frame: HTMLIFrameElement | null = null;
    const raiseOnFocus = () => setTimeout(() => {
      if (frame && document.activeElement === frame) browser.raise(entry.id);
    });
    function build(next: string) {
      clearTimeout(timer);
      frame?.remove();
      const made = document.createElement("iframe");
      // Scripts run in the site's own origin, which is never this app's (see browser-address).
      // No top navigation, no downloads, and no camera, microphone or location.
      made.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox");
      made.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'; usb 'none'; payment 'none'; clipboard-read 'none'");
      made.setAttribute("referrerpolicy", "no-referrer");
      // Chromium: the page gets throwaway storage, without the person's cookies for that site.
      (made as HTMLIFrameElement & { credentialless?: boolean }).credentialless = true;
      made.title = info?.title || "Source page";
      let loads = 0;
      made.addEventListener("load", () => {
        if (++loads > 1) moved = true;
        loaded = true;
        stuck = false;
        clearTimeout(timer);
      });
      made.src = next;
      host.append(made);
      frame = made;
      timer = window.setTimeout(() => {
        if (!loaded) stuck = true;
      }, STUCK_AFTER);
    }
    build(address);
    window.addEventListener("blur", raiseOnFocus);
    return {
      update: build,
      destroy() {
        clearTimeout(timer);
        window.removeEventListener("blur", raiseOnFocus);
        frame?.remove();
      },
    };
  }

  const tab = $derived({
    id: entry.id,
    url,
    title: info?.title || entry.title || url,
    can_go_back: entry.index > 0,
    can_go_forward: entry.index < entry.history.length - 1,
    loading: view === "checking" || (view === "frame" && !loaded && !stuck),
    icon: null,
    projection_revision: 0,
  });
  const phase = $derived<"opening" | "shown">(view === "checking" ? "opening" : "shown");
  const retrieved = $derived(info?.retrieved_at ? new Date(info.retrieved_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
  const citations = $derived(info?.citations.reduce((sum, row) => sum + row.count, 0) ?? 0);
</script>

<BrowserPane
  tab={tab as never}
  applied={null}
  {bounds}
  origin={null}
  {phase}
  {added}
  hidden={entry.minimized}
  order={entry.order}
  start={entry.cascade ? entry.cascade : 0}
  onraise={() => browser.raise(entry.id)}
  onminimize={() => browser.minimize(entry.id, true)}
  onmeasure={() => {}}
  onnavigate={(input: string) => {
    const next = normalizeAddress(input, location.host);
    if (next) browser.navigate(entry.id, next);
    else {
      blockedReason = "address";
      view = "blocked";
    }
  }}
  onback={() => browser.step(entry.id, -1)}
  onforward={() => browser.step(entry.id, 1)}
  onreload={() => browser.reload(entry.id)}
  onopenbrowse={() => window.open(url, "_blank", "noopener,noreferrer")}
  onadd={() => actions?.addWorkSource(url, info?.title || entry.title || "")}
  onclose={() => browser.close(entry.id)}
>
  <div class="content">
    {#if info}
      <div class="about">
        <div class="about-line">
          <button type="button" class="about-title" aria-expanded={details} title={info.title} onclick={() => (details = !details)}>{info.title}</button>
          {#if retrieved}<span class="about-fact">Retrieved {retrieved}</span>{/if}
          {#if citations}<span class="about-fact">Cited {citations === 1 ? "once" : `${citations} times`}</span>{/if}
          {#if info.evidence}<button type="button" class="about-action" onclick={() => actions?.openSource(url)}>View evidence</button>{/if}
        </div>
        {#if details}
          <div class="about-more">
            <p class="address-line">{url}</p>
            {#if info.excerpt}<p><strong>Saved excerpt:</strong> {info.excerpt}</p>{/if}
            {#if info.citations.length}<p><strong>Cited in:</strong> {info.citations.map((row) => row.section).join(" · ")}</p>{/if}
          </div>
        {/if}
      </div>
    {/if}
    {#if view === "blocked"}
      <div class="notice" role="status">
        <p>{blockedWords(blockedReason)}</p>
        {#if normalizeAddress(url, location.host)}<button type="button" class="primary" onclick={() => window.open(url, "_blank", "noopener,noreferrer")}>Open in browser</button>{/if}
        {#if info?.evidence}<button type="button" onclick={() => actions?.openSource(url)}>Read the saved copy</button>{/if}
      </div>
    {:else if view === "frame"}
      {#key entry.load}<div class="frame" class:ready={loaded} use:pageFrame={url}></div>{/key}
      {#if !loaded}<p class="waiting" role="status">{stuck ? "This page is taking a long time, or the site may not allow being shown here." : "Opening…"}</p>{/if}
      {#if moved || stuck || (unverified && loaded)}
        <p class="hint">
          {#if moved}You followed a link on this page. The address above is where this window started.
          {:else if stuck}<button type="button" onclick={() => window.open(url, "_blank", "noopener,noreferrer")}>Open in browser</button>
          {:else}If this stays blank, the site may not allow being shown here. <button type="button" onclick={() => window.open(url, "_blank", "noopener,noreferrer")}>Open in browser</button>{/if}
        </p>
      {/if}
    {/if}
  </div>
</BrowserPane>

<style>
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: inherit;
    background: var(--color-surface);
    font-size: var(--text-label);
  }

  button {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 1px;
  }

  .about {
    flex: none;
    border-block-end: 1px solid var(--color-border);
    color: var(--color-muted);
  }

  .about-line {
    display: flex;
    align-items: center;
    gap: 12px;
    min-block-size: 30px;
    padding-inline: 12px 8px;
  }

  .about-title {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    padding: 0;
    color: var(--color-text);
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .about-fact {
    flex: none;
    white-space: nowrap;
  }

  .about-action {
    flex: none;
    padding: 3px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-text);
  }

  .about-action:hover {
    background: color-mix(in srgb, var(--color-text) 15%, transparent);
  }

  .about-more {
    max-block-size: 140px;
    overflow-y: auto;
    padding: 0 12px 10px;
    line-height: 1.45;
  }

  .about-more p {
    margin: 6px 0 0;
  }

  .about-more strong {
    color: var(--color-text);
    font-weight: 600;
  }

  .address-line {
    overflow-wrap: anywhere;
  }

  .frame {
    position: relative;
    flex: 1;
    min-block-size: 0;
    opacity: 0;
    background: #fff;
  }

  .frame.ready {
    opacity: 1;
  }

  .frame :global(iframe) {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    border: 0;
    background: #fff;
  }

  .waiting {
    position: absolute;
    inset: 44px 24px auto;
    margin: 0;
    color: var(--color-muted);
    text-align: center;
  }

  .hint {
    flex: none;
    margin: 0;
    padding: 5px 12px;
    border-block-start: 1px solid var(--color-border);
    color: var(--color-muted);
  }

  .hint button {
    padding: 0;
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .notice {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    color: var(--color-text);
    font-size: var(--text-body);
    text-align: center;
  }

  .notice p {
    max-inline-size: 42ch;
    margin: 0 0 4px;
    line-height: 1.5;
  }

  .notice button {
    padding: 6px 14px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
  }

  .notice button.primary {
    background: var(--color-text);
    color: var(--color-canvas);
  }
</style>
