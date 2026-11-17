<script lang="ts">
  /*
   * The research report in reading mode, opened in the centre. Its words are the report's own (or the
   * person's saved edit of them: one document, never a copy); its pictures are the report's saved
   * images, placed beside the paragraph each was saved for (paper.ts), sized by what each picture is.
   * HTML comes from the app's sanitizer; citations become source chips that open the source.
   */
  import { dressPaper, paperSites, type PaperData } from "./paper";
  import { pictureUrl } from "./report-images";
  import { browser } from "./browser-windows.svelte";
  import { store } from "./store.svelte";

  let { paper, draftHtml = "" }: { paper: PaperData; draftHtml?: string } = $props();

  const actions = $derived(store.actions);
  const source = $derived(
    draftHtml && actions?.renderHtml ? actions.renderHtml(draftHtml) : actions ? actions.renderMarkdown(paper.markdown) : "",
  );
  const html = $derived(source ? dressPaper(source, paper, { limit: 12, pairs: true, gallery: true }) : "");
  const sites = $derived(paperSites(paper.sources));
  let body = $state<HTMLElement>();
  let enlarged = $state<{ src: string; caption: string } | null>(null);

  /** What a picture is decides how large it stands: a logo small, a diagram large, a photo in between. */
  function role(image: HTMLImageElement, caption: string): "small" | "medium" | "large" {
    const width = image.naturalWidth, height = image.naturalHeight || 1;
    if (/\b(logo|icon|badge|avatar)\b/i.test(caption) || width < 360) return "small";
    if (/\b(diagram|architecture|chart|graph|map|timeline|infographic|flow|schematic|overview)\b/i.test(caption)) return "large";
    if (width >= 1000 && width / height >= 1.5) return "large";
    return "medium";
  }

  // Pictures load once the text holds their places; a picture that will not load leaves no gap.
  $effect(() => {
    const element = body;
    void html;
    if (!element) return;
    for (const figure of element.querySelectorAll<HTMLElement>("figure[data-image]")) {
      if (figure.querySelector("img")) continue;
      const image = paper.images.find((entry) => entry.id === figure.dataset.image);
      const caption = figure.querySelector("figcaption")?.textContent ?? image?.caption ?? "";
      void pictureUrl(paper.researchId, figure.dataset.image!).then((url) => {
        if (!url) {
          const pair = figure.parentElement?.classList.contains("figure-pair") ? figure.parentElement : null;
          figure.remove();
          if (pair && pair.children.length === 1) pair.replaceWith(pair.firstElementChild!);
          return;
        }
        const picture = document.createElement("img");
        picture.alt = image?.caption ?? "";
        picture.decoding = "async";
        picture.loading = "lazy";
        picture.onload = () => {
          figure.dataset.size = figure.parentElement?.classList.contains("figure-pair") ? "pair" : role(picture, caption);
          // Never larger than the picture itself: a small image is not blown up.
          picture.style.maxInlineSize = `${picture.naturalWidth}px`;
        };
        picture.src = url;
        figure.prepend(picture);
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", `Open image${caption ? `: ${caption}` : ""}`);
      });
    }
  });

  function click(event: MouseEvent) {
    const target = event.target as Element;
    const chip = target.closest<HTMLElement>("[data-url]");
    if (chip) {
      event.preventDefault();
      browser.open(chip.dataset.url!, chip.title, "report-citation", undefined, event);
      return;
    }
    const figure = target.closest<HTMLElement>("figure[data-image]");
    const picture = figure?.querySelector("img");
    if (figure && picture) {
      enlarged = { src: picture.src, caption: figure.querySelector("figcaption")?.textContent ?? "" };
      return;
    }
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (link && /^https?:/i.test(link.href)) {
      event.preventDefault();
      browser.open(link.href, link.textContent ?? "", "report-link", undefined, event);
    }
  }
  function keys(event: KeyboardEvent) {
    if (event.key === "Escape" && enlarged) {
      event.stopPropagation();
      enlarged = null;
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && (event.target as Element).matches?.("figure[data-image]")) {
      event.preventDefault();
      (event.target as HTMLElement).click();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article class="report-reader" aria-label={paper.title} bind:this={body} onclick={click} onkeydown={keys}>
  <h1>{paper.title}</h1>
  {#if paper.note}<p class="note">{paper.note}</p>{/if}
  {#if draftHtml}<p class="edited">Showing your edited version</p>{/if}
  <div class="text">{@html html}</div>
  {#if sites.length}
    <footer>
      <span>{paper.sources.length} {paper.sources.length === 1 ? "source" : "sources"}</span>
      {#each sites.slice(0, 8) as site (site.host)}
        <button type="button" class="site" onclick={(event) => browser.open(site.source.url, site.source.title, "report-footer", undefined, event)}>{site.host}</button>
      {/each}
    </footer>
  {/if}
  {#if enlarged}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <div class="enlarged" role="dialog" aria-modal="true" aria-label="Image" tabindex="-1" onclick={(event) => { event.stopPropagation(); enlarged = null; }}>
      <button type="button" class="close" aria-label="Close image" onclick={(event) => { event.stopPropagation(); enlarged = null; }}>×</button>
      <img src={enlarged.src} alt={enlarged.caption} />
      {#if enlarged.caption}<p>{enlarged.caption}</p>{/if}
    </div>
  {/if}
</article>

<style>
  .report-reader {
    --measure: 68ch;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 40px;
    color: var(--color-text);
    font: 16.5px/1.7 var(--font-sans, Inter, system-ui, sans-serif);
  }
  h1, .note, .edited, .text, footer { inline-size: min(100%, var(--measure)); }
  h1 { margin: 0 0 18px; font-size: 32px; line-height: 1.2; letter-spacing: -0.02em; font-weight: 650; }
  .note, .edited { margin: 0 0 16px; color: var(--color-muted); font-size: 13.5px; }
  .text :global(h1) { display: none; }
  .text :global(h2) {
    margin: 2.2em 0 0.6em;
    padding-block-start: 1.1em;
    border-block-start: 1px solid color-mix(in oklab, var(--color-text) 10%, transparent);
    font-size: 23px;
    line-height: 1.3;
    letter-spacing: -0.01em;
    font-weight: 650;
  }
  .text :global(h3) { margin: 1.6em 0 0.4em; font-size: 18.5px; font-weight: 640; }
  .text :global(p) { margin: 0 0 1em; }
  .text :global(p.lead) { font-size: 18.5px; line-height: 1.65; color: color-mix(in oklab, var(--color-text) 92%, transparent); }
  .text :global(ul), .text :global(ol) { margin: 0 0 1.1em; padding-inline-start: 1.4em; }
  .text :global(li) { margin: 0.3em 0; }
  .text :global(blockquote) { margin: 1.2em 0; padding: 0.2em 1em; border-inline-start: 3px solid color-mix(in oklab, var(--color-text) 25%, transparent); color: var(--color-muted); }
  .text :global(a) { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
  .text :global(code) { font-size: 0.9em; padding: 1px 5px; border-radius: 5px; background: color-mix(in oklab, var(--color-text) 8%, transparent); }
  .text :global(.cite) {
    margin-inline: 2px;
    padding: 0 7px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-text) 9%, transparent);
    color: var(--color-muted);
    font: 600 11.5px/1.7 var(--font-sans, Inter, sans-serif);
    vertical-align: 1px;
    cursor: pointer;
  }
  .text :global(.cite:hover) { color: var(--color-text); }
  .text :global(.table-wrap) { margin: 1.4em 0; overflow-x: auto; border: 1px solid color-mix(in oklab, var(--color-text) 10%, transparent); border-radius: 12px; }
  .text :global(table) { inline-size: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.5; }
  .text :global(th) { text-align: start; font-weight: 640; background: color-mix(in oklab, var(--color-text) 6%, transparent); }
  .text :global(th), .text :global(td) { padding: 9px 12px; border-block-end: 1px solid color-mix(in oklab, var(--color-text) 8%, transparent); vertical-align: top; }
  .text :global(tr:last-child td) { border-block-end: 0; }
  /* Figures, by what each picture is. */
  .text :global(figure) { margin: 1.6em auto; cursor: zoom-in; }
  .text :global(figure img) { display: block; inline-size: 100%; block-size: auto; margin-inline: auto; border-radius: 12px; background: color-mix(in oklab, var(--color-text) 5%, transparent); }
  .text :global(figure[data-size="small"]) { inline-size: min(220px, 100%); float: inline-end; margin: 0.3em 0 1em 1.4em; }
  .text :global(figure[data-size="medium"]) { inline-size: min(78%, 100%); }
  .text :global(figure[data-size="large"]) { inline-size: min(100% + 80px, 92vw); margin-inline: -40px; }
  .text :global(figure:focus-visible) { outline: 2px solid var(--color-text); outline-offset: 4px; border-radius: 12px; }
  .text :global(figcaption) { margin-block-start: 8px; color: var(--color-muted); font-size: 13px; line-height: 1.45; text-align: center; }
  .text :global(.figure-pair) { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 1.6em 0; clear: both; }
  .text :global(.figure-pair figure) { margin: 0; }
  .text :global(.figure-gallery) { clear: both; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .text :global(.figure-gallery h2) { grid-column: 1 / -1; }
  .text :global(.figure-gallery figure) { margin: 0; inline-size: auto; float: none; }
  .text :global(h2), .text :global(.table-wrap) { clear: both; }
  footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-block-start: 32px; padding-block-start: 16px; border-block-start: 1px solid color-mix(in oklab, var(--color-text) 10%, transparent); color: var(--color-muted); font-size: 13px; }
  .site { border: 0; border-radius: 999px; padding: 3px 10px; background: color-mix(in oklab, var(--color-text) 8%, transparent); color: var(--color-text); font: 12px var(--font-sans, Inter, sans-serif); cursor: pointer; }
  .enlarged { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; align-content: center; gap: 12px; padding: 48px; background: color-mix(in srgb, #000 82%, transparent); cursor: zoom-out; }
  .enlarged img { max-inline-size: min(1400px, 92vw); max-block-size: 80vh; border-radius: 12px; }
  .enlarged p { margin: 0; color: #ddd; font-size: 14px; text-align: center; }
  .enlarged .close { position: absolute; inset-block-start: 20px; inset-inline-end: 24px; inline-size: 36px; block-size: 36px; border: 0; border-radius: 50%; background: #ffffff1f; color: #fff; font-size: 22px; cursor: pointer; }
  @media (max-width: 900px) {
    .text :global(figure[data-size="large"]) { inline-size: 100%; margin-inline: 0; }
    .text :global(.figure-pair) { grid-template-columns: 1fr; }
  }
</style>
