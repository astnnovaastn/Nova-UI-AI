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
  const loadGeneration = $derived(entry.load);
  const sourceTitle = $derived(info?.title || (url === entry.history[0] ? entry.title : "") || reader?.title || "");
  const validAddress = $derived(normalizeAddress(url, location.host));
  const favicon = $derived(info?.favicon && normalizeAddress(info.favicon, location.host) || "");
  const STUCK_AFTER = 20000;

  /**
   * Checking the site's rules; the live page; the Source Reader (text AEGIS retrieved, clearly not
   * the live site); or a reason neither could be shown.
   */
  let view = $state<"checking" | "frame" | "blocked" | "reader">("checking");
  const canOpenOriginal = $derived(Boolean(validAddress && view !== "checking" && (view !== "blocked" || framingDenied)));
  function openOriginal() {
    if (validAddress && canOpenOriginal) window.open(validAddress, "_blank", "noopener,noreferrer");
  }

  type ReaderPage = { status: string; title?: string; site?: string; html?: string; final_url?: string; retrieved_at?: number; via_proxy?: boolean; words?: number; reason?: string };
  let reader = $state<ReaderPage | null>(null);
  let readerLoading = $state(false);
  let beforeReader = $state<"frame" | "blocked">("frame");
  let readerRequest: AbortController | undefined;
  let readerAddress = "";
  let addressError = $state(false);
  let adding = $state(false);

  function showFrame() {
    loaded = false;
    stuck = false;
    moved = false;
    view = "frame";
  }

  async function openReader() {
    if (view === "frame" || view === "blocked") beforeReader = view;
    view = "reader";
    const address = url;
    if (readerAddress === address && reader?.status === "ok") return;

    readerRequest?.abort();
    const request = new AbortController();
    readerRequest = request;
    readerAddress = address;
    readerLoading = true;
    reader = null;
    try {
      const response = await fetch('/api/work/reader?' + new URLSearchParams({ url: address }), {
        headers: actions?.imageHeaders() ?? {},
        signal: request.signal,
      });
      if (!response.ok) throw new Error("Source Reader unavailable");
      const page = (await response.json()) as ReaderPage;
      if (!request.signal.aborted && url === address) reader = page;
    } catch {
      if (!request.signal.aborted && url === address) reader = { status: "unavailable", reason: "unreachable" };
    } finally {
      if (readerRequest === request && url === address) readerLoading = false;
    }
  }

  async function addReference() {
    if (!actions || adding || !validAddress) return;
    adding = true;
    try {
      await actions.addWorkSource(info?.url ?? url, sourceTitle);
    } finally {
      adding = false;
    }
  }

  /** The reader's page in a frame that can run nothing: no scripts, no forms, links leave in a new tab. */
  const readerDoc = $derived(
    reader?.status === "ok"
      ? `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:"><base target="_blank"><style>body{margin:0;padding:22px 26px 40px;font:15px/1.65 system-ui,-apple-system,Segoe UI,sans-serif;color:#e8e8ea;background:#16171a}a{color:#9cc3ff}h1,h2,h3,h4{line-height:1.25;color:#fff}pre,code{white-space:pre-wrap;font-size:13px}table{border-collapse:collapse}td,th{border:1px solid #333;padding:4px 8px}blockquote{margin:0;padding-left:12px;border-left:2px solid #444;color:#bbb}</style></head><body>${reader.html ?? ""}</body></html>`
      : "",
  );
  const READER_WHY: Record<string, string> = {
    non_public_address: "AEGIS only opens public web addresses.",
    invalid_address: "That is not a web address AEGIS can open.",
    not_a_page: "This address is a file, not a page AEGIS can read.",
    unresolvable: "The site's name could not be found.",
    too_many_redirects: "The site redirected too many times.",
    ConnectionError: "The site could not be reached.",
    ReadTimeout: "The site took too long to answer.",
    ConnectTimeout: "The site took too long to answer.",
  };
  const readerWhy = (reason = "") => READER_WHY[reason] ?? (reason.startsWith("http_") ? `The site answered with an error (${reason.slice(5)}).` : "The page could not be read.");
  let blockedReason = $state("");
  const framingDenied = $derived(blockedReason === "frame_ancestors" || blockedReason === "x_frame_options");
  /** The site's rules couldn't be read in advance, so a refusal would only show inside the frame. */
  let unverified = $state(false);
  let loaded = $state(false);
  let stuck = $state(false);
  /** Its own links were followed; the address shown is where this window started. */
  let moved = $state(false);
  let details = $state(false);

  $effect(() => {
    const address = url;
    void loadGeneration;
    const check = new AbortController();
    untrack(() => {
      readerRequest?.abort();
      readerRequest = undefined;
      readerAddress = "";
      reader = null;
      readerLoading = false;
      addressError = false;
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
    void Promise.resolve(untrack(() => actions?.checkFrame(address, check.signal)))
      .catch(() => ({ embeddable: null, reason: "unchecked" }))
      .then((verdict) => {
        if (check.signal.aborted || url !== address) return;
        if (verdict?.embeddable === false) {
          blockedReason = verdict.reason;
          view = "blocked";
          return;
        }
        unverified = verdict?.embeddable !== true;
        showFrame();
      });
    return () => {
      check.abort();
      readerRequest?.abort();
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
      // Keep an opaque origin even if a page redirects or links to an AEGIS address.
      made.setAttribute("sandbox", "allow-scripts allow-forms");
      made.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'; usb 'none'; payment 'none'; clipboard-read 'none'");
      made.setAttribute("referrerpolicy", "no-referrer");
      // Chromium: the page gets throwaway storage, without the person's cookies for that site.
      (made as HTMLIFrameElement & { credentialless?: boolean }).credentialless = true;
      made.title = sourceTitle || "Source page";
      let loads = 0;
      made.addEventListener("load", () => {
        if (frame !== made) return;
        if (++loads > 1) moved = true;
        loaded = true;
        stuck = false;
        clearTimeout(timer);
      });
      made.src = next;
      frame = made;
      host.append(made);
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
        frame = null;
      },
    };
  }

  const tab = $derived({
    id: entry.id,
    url,
    title: sourceTitle || url,
    can_go_back: entry.index > 0,
    can_go_forward: entry.index < entry.history.length - 1,
    loading: view === "checking" || (view === "frame" && !loaded && !stuck) || (view === "reader" && readerLoading),
    icon: null,
    projection_revision: 0,
  });
  const retrieved = $derived(info?.retrieved_at ? new Date(info.retrieved_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
  const citations = $derived(info?.citations.reduce((sum, row) => sum + row.count, 0) ?? 0);
</script>

<BrowserPane
  tab={tab as never}
  applied={null}
  {bounds}
  origin={null}
  phase="shown"
  {added}
  addDisabled={adding || !validAddress || view === "checking" || (view === "blocked" && !framingDenied)}
  {favicon}
  hidden={entry.minimized}
  order={entry.order}
  start={entry.cascade ? entry.cascade : 0}
  onraise={() => browser.raise(entry.id)}
  onminimize={() => browser.minimize(entry.id, true)}
  onmeasure={() => {}}
  onnavigate={(input: string) => {
    const next = normalizeAddress(input, location.host);
    addressError = !next;
    if (next) browser.navigate(entry.id, next);
  }}
  onback={() => browser.step(entry.id, -1)}
  onforward={() => browser.step(entry.id, 1)}
  onreload={() => browser.reload(entry.id)}
  onadd={addReference}
  onopenbrowse={canOpenOriginal ? openOriginal : undefined}
  onclose={() => browser.close(entry.id)}
>
  <div class="content">
    {#if addressError}<p class="address-error" role="alert">{blockedWords("address")}</p>{/if}
    {#if info}
      <div class="about">
        <div class="about-line">
          <button type="button" class="about-title" aria-expanded={details} title={info.title} onclick={() => (details = !details)}>{info.title}</button>
          {#if retrieved}<span class="about-fact">Retrieved {retrieved}</span>{/if}
          {#if citations}<span class="about-fact">Cited {citations === 1 ? "once" : `${citations} times`}</span>{/if}
          {#if info.evidence}<button type="button" class="about-action" onclick={() => actions?.openSource(info?.url ?? url)}>View evidence</button>{/if}
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
    {#if view === "checking"}
      <p class="waiting" role="status">Checking whether this site can open here…</p>
    {:else if view === "reader"}
      <div class="reader-bar" role="status" data-mode="source-reader">
        <span class="badge">Source Reader</span>
        <span class="why">
          Readable text retrieved from the source.
          {#if reader?.via_proxy} Fetched through your proxy.{/if}
        </span>
        <button type="button" onclick={() => beforeReader === "frame" ? showFrame() : (view = "blocked")}>
          {beforeReader === "frame" ? "Live page" : "Back to source"}
        </button>
      </div>
      {#if readerLoading}
        <p class="waiting" role="status">Reading the page…</p>
      {:else if reader?.status === "ok"}
        <iframe class="reader-page" title={`Source Reader: ${reader.title ?? url}`} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" srcdoc={readerDoc}></iframe>
      {:else if reader}
        <div class="notice" role="alert" data-mode="unavailable">
          <p>This page can't be shown here. {readerWhy(reader.reason)}</p>
          {#if info?.evidence}<button type="button" class="primary" onclick={() => actions?.openSource(info?.url ?? url)}>Read the saved copy</button>{/if}
        </div>
      {/if}
    {:else if view === "blocked"}
      <div class="notice" role="status" data-mode="unavailable">
        <p>{blockedWords(blockedReason)}</p>
        {#if framingDenied}
          <div class="notice-actions">
            <button type="button" class="primary" onclick={() => { unverified = true; showFrame(); }}>Try live page</button>
            <button type="button" onclick={() => openReader()}>Source Reader</button>
          </div>
        {:else if info?.evidence}
          <button type="button" class="primary" onclick={() => actions?.openSource(info?.url ?? url)}>Read the saved copy</button>
        {/if}
      </div>
    {:else if view === "frame"}
      {#key loadGeneration}<div class="frame" class:ready={loaded} use:pageFrame={url} data-mode="iframe-live"></div>{/key}
      {#if !loaded}<p class="waiting" role="status">{stuck ? "This page is taking a long time, or the site may not allow being shown here." : "Opening…"}</p>{/if}
      <p class="hint" class:quiet={!(moved || stuck || (unverified && loaded))}>
        {#if moved}This site changed pages inside the frame. The toolbar and Add to Work use the address above.
        {:else if framingDenied}This site may block the live page inside Research.
        {:else if stuck || (unverified && loaded)}If this stays blank, the site may block embedding.{/if}
        <button type="button" onclick={() => openReader()}>Source Reader</button>
      </p>
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

  .address-error {
    margin: 0;
    padding: 6px 12px;
    color: var(--color-text);
    border-block-end: 1px solid var(--color-border);
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

  .hint {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .hint button {
    margin-inline-start: auto;
  }

  .hint.quiet {
    padding-block: 3px;
  }

  .reader-bar {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-block-end: 1px solid var(--color-border);
    background: color-mix(in oklab, var(--aegis-status-waiting, #e2a336) 12%, var(--color-surface));
    color: var(--color-text);
  }

  .reader-bar .badge {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--aegis-status-waiting, #e2a336) 35%, transparent);
    font-weight: 600;
  }

  .reader-bar .why {
    flex: 1;
    min-inline-size: 0;
    color: var(--color-muted);
  }

  .reader-bar button {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
  }

  .reader-page {
    flex: 1;
    min-block-size: 0;
    inline-size: 100%;
    border: 0;
    background: #16171a;
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

  .notice-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
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
