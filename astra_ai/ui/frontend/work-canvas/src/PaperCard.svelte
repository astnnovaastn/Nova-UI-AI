<!--
  Finished research as a paper on the canvas. Dragged by its head, read in place, and opened
  into the existing Reader, Edit, Sources and Media views, which it does not repeat.
-->
<script lang="ts">
  import Icon from "$shared/ui/Icon";
  import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
  import { dressPaper, paperSites, type PaperData } from "./paper";
  import { pictureUrl } from "./report-images";
  import { browser } from "./browser-windows.svelte";
  import { store } from "./store.svelte";

  let { item }: { id: string; item: { paper: PaperData }; selected?: boolean } = $props();
  const paper = $derived(item.paper);
  const actions = $derived(store.actions);
  const html = $derived(actions ? dressPaper(actions.renderMarkdown(paper.markdown), paper) : "");
  const sites = $derived(paperSites(paper.sources));
  let body = $state<HTMLElement>();

  // Pictures are fetched once the sheet holds their places. A failed picture leaves no gap.
  $effect(() => {
    const element = body;
    void html;
    if (!element) return;
    for (const figure of element.querySelectorAll<HTMLElement>("figure[data-image]")) {
      if (figure.querySelector("img")) continue;
      const image = paper.images.find((entry) => entry.id === figure.dataset.image);
      void pictureUrl(paper.researchId, figure.dataset.image!).then((url) => {
        if (!url) {
          figure.remove();
          return;
        }
        const picture = document.createElement("img");
        picture.src = url;
        picture.alt = image?.caption ?? "";
        picture.loading = "lazy";
        figure.prepend(picture);
      });
    }
  });

  function click(event: MouseEvent) {
    const target = event.target as Element;
    const chip = target.closest<HTMLElement>("[data-url]");
    if (chip) {
      event.preventDefault();
      browser.open(chip.dataset.url!, chip.title);
      return;
    }
    if (target.closest("figure")) {
      actions?.openView("media");
      return;
    }
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (link && paper.sources.some((source) => source.url === link.href)) {
      event.preventDefault();
      browser.open(link.href);
    }
  }
</script>

<article class="paper" aria-label={paper.title} data-paper={paper.id}>
  <header class="work-drag-handle">
    <span class="label">{paper.label}</span>
    <button type="button" class="expand nodrag nopan" onclick={() => actions?.openView("reader")}>
      <Icon icon={ArrowUpRight01Icon} size={14} />Expand
    </button>
  </header>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
  <div class="sheet nowheel nodrag nopan" role="document" tabindex="0" bind:this={body} onclick={click}>
    <h2>{paper.title}</h2>
    {#if paper.note}<p class="note">{paper.note}</p>{/if}
    <div class="text">{@html html}</div>
  </div>
  {#if sites.length}
    <footer>
      <button type="button" class="all nodrag nopan" onclick={() => actions?.openView("sources")}>
        {paper.sources.length} {paper.sources.length === 1 ? "source" : "sources"}
      </button>
      <span class="sites">
        {#each sites.slice(0, 5) as site (site.host)}
          <button type="button" class="nodrag nopan" title={site.source.title} onclick={() => browser.open(site.source.url, site.source.title)}>{site.host}</button>
        {/each}
      </span>
    </footer>
  {/if}
</article>

<style>
  .paper {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    overflow: hidden;
    border-radius: 14px;
    background: var(--color-raised);
    box-shadow:
      0 0 0 1px var(--color-border),
      var(--shadow-float);
    color: var(--color-text);
  }

  header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px 10px 44px;
    border-block-end: 1px solid var(--color-border);
    cursor: grab;
  }

  .label {
    overflow: hidden;
    color: var(--color-muted);
    font-size: var(--text-label);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  button:focus-visible,
  .sheet:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: -2px;
  }

  .expand {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    padding: 4px 10px 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    font-size: var(--text-label);
  }

  .expand:hover {
    background: color-mix(in srgb, var(--color-text) 15%, transparent);
  }

  .sheet {
    flex: 1;
    min-block-size: 0;
    padding: 30px 44px 36px;
    overflow-y: auto;
    cursor: text;
    user-select: text;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 27px;
    font-weight: 650;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .note {
    margin: 0 0 16px;
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
    color: var(--color-muted);
    font-size: var(--text-label);
  }

  .text {
    color: var(--color-label-secondary);
    font-size: 15px;
    line-height: 1.62;
  }

  .text :global(.lead) {
    color: var(--color-text);
    font-size: 16.5px;
  }

  .text :global(p) {
    margin: 0 0 13px;
  }

  .text :global(h1),
  .text :global(h2),
  .text :global(h3),
  .text :global(h4) {
    margin: 26px 0 9px;
    color: var(--color-text);
    font-weight: 650;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .text :global(h1:first-child),
  .text :global(h2:first-child),
  .text :global(h3:first-child) {
    margin-block-start: 0;
  }

  .text :global(h1),
  .text :global(h2) {
    font-size: 20px;
  }

  .text :global(h3),
  .text :global(h4) {
    font-size: 16.5px;
  }

  .text :global(ul),
  .text :global(ol) {
    margin: 0 0 13px;
    padding-inline-start: 22px;
  }

  .text :global(ul) {
    list-style: disc;
  }

  .text :global(ol) {
    list-style: decimal;
  }

  .text :global(li) {
    margin-block-end: 5px;
  }

  .text :global(strong) {
    color: var(--color-text);
    font-weight: 600;
  }

  .text :global(a) {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .text :global(blockquote) {
    margin: 0 0 13px;
    padding-inline-start: 14px;
    border-inline-start: 2px solid var(--color-border);
  }

  .text :global(code) {
    font-family: var(--font-mono, monospace);
    font-size: 0.92em;
  }

  .text :global(pre) {
    margin: 0 0 13px;
    padding: 12px;
    overflow-x: auto;
    border-radius: 10px;
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
  }

  .text :global(.table-wrap) {
    margin: 0 0 16px;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: 10px;
  }

  .text :global(table) {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: 13px;
    line-height: 1.45;
  }

  .text :global(th),
  .text :global(td) {
    padding: 7px 10px;
    border-block-end: 1px solid var(--color-border);
    text-align: start;
    vertical-align: top;
  }

  .text :global(th) {
    color: var(--color-text);
    font-weight: 600;
  }

  .text :global(tr:last-child td) {
    border-block-end: 0;
  }

  .text :global(figure) {
    margin: 4px 0 18px;
    cursor: zoom-in;
  }

  .text :global(figure img) {
    display: block;
    inline-size: 100%;
    max-block-size: 340px;
    object-fit: cover;
    border-radius: 10px;
  }

  .text :global(figcaption) {
    margin-block-start: 6px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .text :global(.cite) {
    display: inline-block;
    margin-inline: 3px 0;
    padding: 0 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
    color: var(--color-muted);
    font-size: 11.5px;
    line-height: 18px;
    vertical-align: 1px;
  }

  .text :global(.cite:hover) {
    background: color-mix(in srgb, var(--color-text) 18%, transparent);
    color: var(--color-text);
  }

  footer {
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;
    min-inline-size: 0;
    padding: 9px 14px 9px 44px;
    border-block-start: 1px solid var(--color-border);
    font-size: var(--text-label);
  }

  .all {
    flex: none;
    font-weight: 600;
  }

  .all:hover,
  .sites button:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .sites {
    display: flex;
    gap: 10px;
    min-inline-size: 0;
    overflow: hidden;
    color: var(--color-muted);
    white-space: nowrap;
  }
</style>
