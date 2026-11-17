<script lang="ts">
  import * as m from "$shared/i18n/messages";
  import type { MediaView, ObjectActions } from "../../lib/board/types";
  import { youtubeId } from "../../lib/link-media";
  import Mark from "./Mark.svelte";
  import PlayMark from "./PlayMark.svelte";
  /**
   * An image is the image. A video is its poster with a play mark (YouTube's
   * own on a YouTube video); a click opens its page where every page opens.
   * Audio is a compact player that opens its page the same way.
   */
  let { object, actions = {} }: { object: MediaView; actions?: ObjectActions } = $props();
  const youtube = $derived(object.media === "video" && !!youtubeId(object.url));
  /** AEGIS: the collection opens to whichever side has room in the window, never off-screen. */
  let stripSide = $state<"right" | "left">("right");
  function placeStrip(figure: HTMLElement) {
    if (!object.more?.length) return;
    const box = figure.getBoundingClientRect();
    const scale = box.width / Math.max(1, figure.offsetWidth);
    const need = Math.min(object.more.length, 3) * 252 * scale + 16 * scale;
    stripSide = box.right + need > window.innerWidth && box.left - need > 0 ? "left" : "right";
  }
  const poster = $derived(object.poster ?? object.picture);
  /** The address that would not load; a new poster gets its own chance. */
  let broken = $state<string | null>(null);
  const failed = $derived(!!poster && broken === poster.src);
</script>

<figure class="media {object.media}" class:collection={!!object.more?.length} data-side={stripSide} aria-label={object.title} onpointerenter={(event) => placeStrip(event.currentTarget)} onfocusin={(event) => placeStrip(event.currentTarget)}>
  {#if object.media === "image"}
    {#if poster && !failed}<img
        class="image"
        src={poster.src}
        alt={object.title ?? ""}
        width={poster.width}
        height={poster.height}
        decoding="async"
        loading="lazy"
        draggable="false"
        onerror={() => (broken = poster?.src ?? null)}
      />{:else}<div class="missing">{object.title ?? m.work_media_missing()}</div>{/if}
  {:else if object.media === "video"}
    <button
      type="button"
      class="screen nodrag nopan"
      class:bare={!poster || failed}
      aria-label={m.work_media_play({
        title: object.title || (youtube ? m.work_media_youtube_video() : ""),
      })}
      onclick={() => actions.link?.(object.url)}
    >
      {#if poster && !failed}<img
          src={poster.src}
          alt=""
          width={poster.width}
          height={poster.height}
          decoding="async"
          loading="lazy"
          draggable="false"
          onerror={() => (broken = poster?.src ?? null)}
        />{/if}
      <span class="play"><PlayMark size={youtube ? 60 : 52} {youtube} /></span>
      {#if object.duration}<span class="length">{object.duration}</span>{/if}
    </button>
    {#if object.title || youtube}
      <figcaption>
        {#if youtube}<Mark address="youtube.com" size={16} />{/if}
        <span class="words">
          <span class="title" class:unnamed={!object.title} class:clamped={!!object.title}
            >{object.title || m.work_media_youtube_video()}</span
          >
          {#if object.title && object.channel}<span class="channel">{object.channel}</span>{/if}
        </span>
      </figcaption>
    {/if}
    {#if object.more?.length}
      <span class="collection-label">Video collection · {object.more.length + 1} videos</span>
      <div class="strip nodrag nopan nowheel" role="list" aria-label="More videos in this collection">
        {#each object.more as video, index (video.url)}
          <div role="listitem" class="clip-item" style:--i={index + 1}>
            <button type="button" class="clip" aria-label={`Play ${video.title || "video"}`} onclick={() => actions.link?.(video.url)}>
              {#if video.poster}<img src={video.poster} alt="" loading="lazy" decoding="async" draggable="false" />{/if}
              <span class="play"><PlayMark size={34} youtube={!!youtubeId(video.url)} /></span>
            </button>
            <span class="clip-title">{video.title || "Video"}</span>
            {#if video.channel}<span class="clip-channel">{video.channel}</span>{/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="player">
      <button
        type="button"
        class="round nodrag nopan"
        aria-label={m.work_media_play({ title: object.title ?? "" })}
        onclick={() => actions.link?.(object.url)}><PlayMark size={36} /></button
      >
      <div class="words">
        <span class="title">{object.title ?? m.work_media_audio()}</span>
        {#if object.duration}<span class="length-text">{object.duration}</span>{/if}
      </div>
      <span class="wave" aria-hidden="true"
        >{#each Array.from({ length: 28 }, (_, index) => index) as index (index)}<span
            style:block-size={`${30 + ((index * 37) % 70)}%`}
          ></span>{/each}</span
      >
    </div>
  {/if}
</figure>

<style>
  .media {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    inline-size: 100%;
    color: var(--color-text);
  }

  .image {
    display: block;
    inline-size: 100%;
    block-size: auto;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-raised);
  }

  .missing {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    padding: 24px;
    border-radius: var(--radius-card);
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: var(--text-page-title);
    text-align: center;
  }

  .screen {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-card);
    background: var(--color-canvas);
    box-shadow: var(--shadow-raised);
    color: inherit;
    font: inherit;
    cursor: default;
  }

  /* Until its poster is here (or when it cannot be), a quiet lit screen, not a blank one. */
  .screen.bare {
    background: radial-gradient(
      circle at 50% 45%,
      color-mix(in srgb, var(--color-text) 9%, var(--color-surface)),
      var(--color-surface) 72%
    );
  }

  .screen:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }

  .screen img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .play {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .play :global(svg) {
    transition: transform var(--motion-fast) var(--ease-out);
  }

  .screen:hover .play :global(svg) {
    transform: scale(1.06);
  }

  .length {
    position: absolute;
    inset-block-end: 10px;
    inset-inline-end: 10px;
    padding: 2px 8px;
    border-radius: var(--radius-capsule);
    background: var(--color-float);
    font-size: var(--text-caption);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  figcaption {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-inline: 2px;
  }

  .title {
    font-size: var(--text-body);
    font-weight: 600;
    line-height: 18px;
    text-wrap: pretty;
  }

  .title.clamped {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
  }

  .channel {
    display: block;
    overflow: hidden;
    color: var(--color-muted);
    font-size: var(--text-caption);
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title.unnamed {
    color: var(--color-muted);
    font-weight: 500;
  }

  .player {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px 10px 10px;
    border-radius: var(--radius-capsule);
    background: var(--color-surface);
    box-shadow: var(--shadow-raised);
  }

  .round {
    display: grid;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--radius-capsule);
    background: none;
    cursor: default;
  }

  .words {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-inline-size: 0;
  }

  .length-text {
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  .wave {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 2px;
    block-size: 24px;
    min-inline-size: 60px;
    margin-inline-start: 8px;
  }

  .wave span {
    flex: 1;
    border-radius: var(--radius-capsule);
    background: var(--color-fill-strong);
  }
  /* AEGIS video collection: layers behind the first video, the rest beside it on hover. */
  .media.collection { position: relative; }
  .media.collection .screen {
    box-shadow:
      var(--shadow-raised),
      10px -10px 0 -3px color-mix(in srgb, var(--color-text) 14%, var(--color-surface)),
      20px -20px 0 -6px color-mix(in srgb, var(--color-text) 8%, var(--color-surface));
  }
  .collection-label {
    position: absolute;
    inset-block-start: 10px;
    inset-inline-start: 10px;
    z-index: 2;
    padding: 2px 10px;
    border-radius: var(--radius-capsule);
    background: color-mix(in srgb, #000 62%, transparent);
    color: #fff;
    font-size: var(--text-caption);
    font-weight: 600;
    pointer-events: none;
  }
  .strip {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 100%;
    z-index: 5;
    display: flex;
    gap: 12px;
    padding-inline-start: 16px;
    max-inline-size: calc(3 * 252px + 16px);
    overflow-x: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-24px);
    transition:
      opacity var(--motion-slow) var(--ease-emphasized),
      transform var(--motion-slow) var(--ease-emphasized);
  }
  .strip::-webkit-scrollbar { display: none; }
  .media.collection[data-side="left"] .strip {
    inset-inline-start: auto;
    inset-inline-end: 100%;
    flex-direction: row-reverse;
    padding-inline: 0 16px;
    transform: translateX(24px);
  }
  .media.collection:hover .strip,
  .media.collection:focus-within .strip {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }
  .clip-item {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 6px;
    inline-size: 240px;
    opacity: 0;
    transform: translateX(-12px);
    transition:
      opacity var(--motion-slow) var(--ease-emphasized) calc(var(--i) * 40ms),
      transform var(--motion-slow) var(--ease-emphasized) calc(var(--i) * 40ms);
  }
  .media.collection:hover .clip-item,
  .media.collection:focus-within .clip-item {
    opacity: 1;
    transform: none;
  }
  .clip {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-raised);
    cursor: default;
  }
  .clip img { display: block; inline-size: 100%; block-size: 100%; object-fit: cover; }
  .clip .play { position: absolute; inset: 0; display: grid; place-items: center; }
  .clip:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .clip-title {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text);
    font-size: var(--text-caption);
    font-weight: 600;
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .clip-channel { color: var(--color-muted); font-size: var(--text-caption); }
  :global(.svelte-flow__node:has(.media.collection:hover)),
  :global(.svelte-flow__node:has(.media.collection:focus-within)) { z-index: 1000 !important; }
  @media (prefers-reduced-motion: reduce) {
    .strip, .clip-item { transition: none; transform: none; }
  }
</style>
