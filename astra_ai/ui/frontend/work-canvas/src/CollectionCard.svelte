<!--
  The research's Images or Videos collection as a paper sheet, in the report's own style: a head
  to drag it by, a titled sheet, and a footer that opens the existing Media view. Pictures are the
  report's validated images, fetched with the app's headers; videos are what the video search found.
-->
<script lang="ts">
  import { getContext } from "svelte";
  import Icon from "$shared/ui/Icon";
  import { ArrowUpRight01Icon, Image02Icon, PlayIcon, Video01Icon } from "@hugeicons/core-free-icons";
  import { SHOWN_IMAGES, SHOWN_VIDEOS, type CollectionData } from "./collections";
  import { pictureUrl } from "./report-images";
  import { store } from "./store.svelte";

  let { item }: { id: string; item: { collection: CollectionData }; selected?: boolean } = $props();
  const data = $derived(item.collection);
  const actions = $derived(store.actions);
  const shownImages = $derived(data.images.slice(0, SHOWN_IMAGES));
  const shownVideos = $derived(data.videos.slice(0, SHOWN_VIDEOS));
  const count = $derived(data.kind === "images" ? data.images.length : data.videos.length);
  const hosts = $derived(new Set(data.images.map((image) => image.host).filter(Boolean)).size);
  /** Picture URLs as they arrive; one that fails leaves its tile out. */
  let pictures = $state<Record<string, string | null>>({});
  $effect(() => {
    const id = data.researchId;
    for (const image of shownImages) {
      if (image.id in pictures) continue;
      void pictureUrl(id, image.id).then((url) => {
        if (store.state.report?.research_id === id) pictures = { ...pictures, [image.id]: url ?? null };
      });
    }
  });
  let searching = $state(false);
  function findVideos() {
    searching = true;
    actions?.findVideos?.();
  }
</script>

<article class="sheet-card" data-collection={data.kind} data-state={data.state} aria-label={`${data.title}: ${count}`}>
  <header class="work-drag-handle">
    <span class="label"><Icon icon={data.kind === "images" ? Image02Icon : Video01Icon} size={13} />{data.kind === "images" ? "Images collection" : "Video collection"}</span>
    <button type="button" class="expand nodrag nopan" onclick={() => actions?.openView("media")}>
      <Icon icon={ArrowUpRight01Icon} size={14} />Media
    </button>
  </header>
  <div class="sheet nowheel nodrag nopan">
    <h3>{data.title}</h3>
    <p class="meta">
      {#if data.kind === "images"}
        {count} {count === 1 ? "image" : "images"} from {hosts} {hosts === 1 ? "source" : "sources"}, as placed in the report
      {:else if data.state === "searching"}
        Searching for videos on this research…
      {:else if data.state === "unavailable"}
        {data.note}
      {:else}
        {count} {count === 1 ? "video" : "videos"} found for this research
      {/if}
    </p>
    {#if data.kind === "images"}
      <ul class="grid">
        {#each shownImages as image (image.id)}
          {#if pictures[image.id] !== null}
            <li>
              <button type="button" class="tile nodrag nopan" title={image.caption || image.host} onclick={() => actions?.openView("media")}>
                {#if pictures[image.id]}<img src={pictures[image.id]} alt={image.caption} loading="lazy" />{:else}<span class="placeholder" aria-hidden="true"></span>{/if}
              </button>
              {#if image.host}<button type="button" class="host nodrag nopan" title={image.url} onclick={() => { if (image.url) actions?.openSource(image.url); }}>{image.host}</button>{/if}
            </li>
          {/if}
        {/each}
      </ul>
    {:else if shownVideos.length}
      <ul class="videos">
        {#each shownVideos as video (video.videoId)}
          <li>
            <button type="button" class="video nodrag nopan" title={video.title} onclick={() => actions?.openSource(video.url)}>
              <span class="thumb"><img src={video.thumbnail} alt="" loading="lazy" referrerpolicy="no-referrer" /><span class="play"><Icon icon={PlayIcon} size={12} /></span></span>
              <span class="words"><strong>{video.title}</strong>{#if video.channel}<span>{video.channel}</span>{/if}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else if data.state === "unavailable" && actions?.findVideos}
      <button type="button" class="find nodrag nopan" disabled={searching} onclick={findVideos}>{searching ? "Searching…" : "Search for videos again"}</button>
    {/if}
  </div>
  <footer>
    <button type="button" class="all nodrag nopan" onclick={() => actions?.openView("media")}>
      {count > (data.kind === "images" ? SHOWN_IMAGES : SHOWN_VIDEOS) ? `All ${count} in Media` : "Open in Media"}
    </button>
    {#if data.kind === "videos" && data.videos[0]?.provider}<span class="via">via {data.videos[0].provider === "serpapi" ? "YouTube search" : data.videos[0].provider === "tavily" ? "Tavily" : "Exa"}</span>{/if}
  </footer>
</article>

<style>
  .sheet-card {
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
    padding: 9px 12px 9px 16px;
    border-block-end: 1px solid var(--color-border);
    cursor: grab;
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    color: var(--color-muted);
    font-size: var(--text-label);
    white-space: nowrap;
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
    padding: 14px 16px 12px;
    overflow: hidden;
  }

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .meta {
    margin: 3px 0 12px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px 8px;
  }

  .grid li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-inline-size: 0;
  }

  .tile {
    display: block;
    padding: 0;
    overflow: hidden;
    border-radius: 8px;
    aspect-ratio: 4 / 3;
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    cursor: zoom-in;
  }

  .tile img,
  .placeholder {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .host {
    overflow: hidden;
    padding: 0;
    color: var(--color-muted);
    font-size: 10.5px;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .host:hover,
  .all:hover {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .videos {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .video {
    display: flex;
    align-items: center;
    gap: 10px;
    inline-size: 100%;
    padding: 4px;
    border-radius: 9px;
    text-align: start;
  }

  .video:hover {
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
  }

  .thumb {
    position: relative;
    flex: none;
    inline-size: 112px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 7px;
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
  }

  .thumb img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .play {
    position: absolute;
    inset-block-end: 5px;
    inset-inline-start: 5px;
    display: grid;
    place-items: center;
    inline-size: 20px;
    block-size: 20px;
    border-radius: 999px;
    background: rgb(0 0 0 / 0.62);
    color: #fff;
  }

  .words {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-inline-size: 0;
    font-size: 12px;
    line-height: 1.35;
  }

  .words strong {
    display: -webkit-box;
    overflow: hidden;
    font-weight: 600;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .words span {
    overflow: hidden;
    color: var(--color-muted);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .find {
    padding: 7px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    font-size: var(--text-label);
  }

  .find:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-text) 15%, transparent);
  }

  .find:disabled {
    cursor: progress;
    opacity: 0.7;
  }

  footer {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 16px;
    border-block-start: 1px solid var(--color-border);
    font-size: var(--text-label);
  }

  .all {
    font-weight: 600;
  }

  .via {
    color: var(--color-muted);
  }

  [data-state="searching"] .meta::before {
    content: "";
    display: inline-block;
    inline-size: 7px;
    block-size: 7px;
    margin-inline-end: 6px;
    border-radius: 999px;
    background: var(--aegis-strand-green, #3fdc84);
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-state="searching"] .meta::before {
      animation: none;
    }
  }
</style>
