// MPL-2.0. AEGIS video collection on Zephium's media card. The reference checkout stays untouched.
// A run's videos stand as one card: the first video, stacked layers behind it and a count; on hover or
// keyboard focus the others slide out to the right in a bounded strip, each opening its own page
// (where every page opens: the workspace browser). No player is created until the person opens one.
const STRIP = `
    {#if object.more?.length}
      <span class="collection-label">Video collection · {object.more.length + 1} videos</span>
      <div class="strip nodrag nopan nowheel" role="list" aria-label="More videos in this collection">
        {#each object.more as video, index (video.url)}
          <div role="listitem" class="clip-item" style:--i={index + 1}>
            <button type="button" class="clip" aria-label={\`Play \${video.title || "video"}\`} onclick={() => actions.link?.(video.url)}>
              {#if video.poster}<img src={video.poster} alt="" loading="lazy" decoding="async" draggable="false" />{/if}
              <span class="play"><PlayMark size={34} youtube={!!youtubeId(video.url)} /></span>
            </button>
            <span class="clip-title">{video.title || "Video"}</span>
            {#if video.channel}<span class="clip-channel">{video.channel}</span>{/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}`;

const STYLE = `
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
</style>`;

const SCRIPT = `  const youtube = $derived(object.media === "video" && !!youtubeId(object.url));
  /** AEGIS: the collection opens to whichever side has room in the window, never off-screen. */
  let stripSide = $state<"right" | "left">("right");
  function placeStrip(figure: HTMLElement) {
    if (!object.more?.length) return;
    const box = figure.getBoundingClientRect();
    const scale = box.width / Math.max(1, figure.offsetWidth);
    const need = Math.min(object.more.length, 3) * 252 * scale + 16 * scale;
    stripSide = box.right + need > window.innerWidth && box.left - need > 0 ? "left" : "right";
  }`;

export const mediaCollectionPatches = [
  {
    file: "features/work/components/objects/Media.svelte",
    find: '  const youtube = $derived(object.media === "video" && !!youtubeId(object.url));',
    replace: SCRIPT,
    why: "Open a video collection toward the side with room.",
  },
  {
    file: "features/work/lib/board/types.ts",
    find: "  /** The channel a video was published on, when its page said. */\n  channel?: string;\n};",
    replace: "  /** The channel a video was published on, when its page said. */\n  channel?: string;\n  /** AEGIS: the rest of a video collection, beside the first video. */\n  more?: { url: string; title?: string; poster?: string; channel?: string }[];\n};",
    why: "A media card can carry the other videos of its collection.",
  },
  {
    file: "features/work/lib/board/objects.ts",
    find: "        ...(data.start_secs !== null && data.start_secs !== undefined\n          ? { startSecs: data.start_secs }\n          : {}),\n      };",
    replace: "        ...(data.start_secs !== null && data.start_secs !== undefined\n          ? { startSecs: data.start_secs }\n          : {}),\n        ...((data as unknown as { title?: string }).title ? { title: (data as unknown as { title: string }).title } : {}),\n        ...((data as unknown as { channel?: string }).channel ? { channel: (data as unknown as { channel: string }).channel } : {}),\n        ...((data as unknown as { more?: unknown[] }).more?.length ? { more: (data as unknown as { more: { url: string; title?: string; poster?: string; channel?: string }[] }).more } : {}),\n      };",
    why: "Pass a video collection's other videos, and a video's channel, through to its card.",
  },
  {
    file: "features/work/components/objects/Media.svelte",
    find: '<figure class="media {object.media}" aria-label={object.title}>',
    replace: '<figure class="media {object.media}" class:collection={!!object.more?.length} data-side={stripSide} aria-label={object.title} onpointerenter={(event) => placeStrip(event.currentTarget)} onfocusin={(event) => placeStrip(event.currentTarget)}>',
    why: "Mark a media card that holds a video collection.",
  },
  {
    file: "features/work/components/objects/Media.svelte",
    find: "\n  {:else}\n    <div class=\"player\">",
    replace: STRIP + "\n    <div class=\"player\">",
    why: "Draw the collection's count and its hover strip of videos.",
  },
  {
    file: "features/work/components/objects/Media.svelte",
    find: "\n</style>",
    replace: STYLE,
    why: "Stacked layers and the horizontal reveal for a video collection.",
  },
];
