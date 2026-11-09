<script lang="ts">
  import HostGlyph from "../cards/HostGlyph.svelte";
  import { thumbnail } from "../../lib/frame-thumbs";
  import { previewFor } from "../../../../../../src/preview-provider";

  /**
   * A page as a small browser window: a slim bar with the site's mark, its
   * host and the page's title over the frame the run captured. Without a
   * frame the page still reads as itself, its title set on its own sheet.
   */
  let {
    url,
    title,
    frame,
    host = "",
    live = false,
    still = false,
  }: {
    url: string;
    title: string;
    frame: string | null;
    host?: string;
    /** The agent is on this page now: its window is ringed and its frame follows. */
    live?: boolean;
    /** The run waits on the person here: the window holds perfectly still, frames drawn in place. */
    still?: boolean;
  } = $props();

  /** A frame that failed to load is not shown. */
  let failed = $state<string | null>(null);
  const shown = $derived(!!frame && failed !== frame);
  const preview = $derived(previewFor(url));
  const site = $derived.by(() => {
    try {
      return new URL(url).hostname.replace(/^www\./u, "");
    } catch {
      return host.replace(/^www\./u, "");
    }
  });
  /** The title without the site's own name trailing it: the bar already says the site. */
  const heading = $derived.by(() => {
    const segments = title.split(/\s+[|·–—-]\s+/u).map((segment) => segment.trim());
    const own = segments.filter(Boolean);
    return own.length > 1 ? own.slice(0, -1).join(" – ") : title.trim();
  });
</script>

<span class="window" class:live class:still>
  <span class="bar">
    <span class="mark">{#if preview?.favicon}<img class="favicon" src={preview.favicon} alt="" width="14" height="14" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onerror={(event) => ((event.currentTarget as HTMLElement).style.visibility = "hidden")} />{:else}<HostGlyph {host} {url} size={14} initial={false} />{/if}</span>
    <span class="host">{site}</span>
    <span class="heading">{heading}</span>
    {#if live && !still}{#key frame}<span class="arrived" aria-hidden="true"></span>{/key}{/if}
  </span>
  <span class="view">
    <!-- Every frame, the live one too, is drawn into a canvas at the size it is seen:
         an image element held its decoded pixels long after the work was left. -->
    {#if shown}
      <canvas
        class="thumb"
        use:thumbnail={{ url: frame!, width: 360, onmissing: () => (failed = frame) }}
      ></canvas>
      {#if preview?.excerpt}<span class="caption">{preview.excerpt}</span>{/if}
    {:else}
      <span class="face">
        <span class="sign"><HostGlyph {host} {url} size={28} initial={false} /></span>
        <span class="words">{heading || site}</span>
        {#if preview?.excerpt}<span class="excerpt">{preview.excerpt}</span>{/if}
      </span>
    {/if}
  </span>
</span>

<style>
  .favicon {
    display: block;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 3px;
  }

  .caption {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    display: -webkit-box;
    overflow: hidden;
    padding: 18px 12px 10px;
    background: linear-gradient(to top, rgb(0 0 0 / 78%), transparent);
    color: #fff;
    font-size: 11.5px;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .excerpt {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .window {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    overflow: hidden;
    border-radius: var(--radius-row);
    background: var(--color-surface);
    box-shadow:
      0 0 0 1px var(--color-border),
      var(--shadow-raised);
    transition: box-shadow var(--motion-base) var(--ease-out);
  }

  .window.still {
    transition: none;
  }

  .window.live {
    box-shadow:
      0 0 0 1px var(--color-ring),
      var(--shadow-float);
  }

  .bar {
    position: relative;
    display: grid;
    flex: none;
    grid-template-columns: 14px max-content minmax(0, 1fr);
    align-items: center;
    gap: 7px;
    block-size: 28px;
    padding: 0 10px;
    border-block-end: 1px solid var(--color-border);
    background: var(--color-raised);
    font-size: var(--text-caption);
    line-height: 14px;
  }

  /* A new look at the live page draws one hairline across the bar, once: the
     page moved, and nothing moves between looks. */
  .arrived {
    position: absolute;
    inset: auto 0 -1px;
    block-size: 1.5px;
    background: var(--color-accent);
    transform-origin: left;
    animation: arrived var(--motion-page) var(--ease-emphasized) forwards;
  }

  @keyframes arrived {
    0% {
      scale: 0 1;
      opacity: 1;
    }

    70% {
      scale: 1 1;
      opacity: 1;
    }

    100% {
      scale: 1 1;
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .arrived {
      animation: none;
      opacity: 0;
    }
  }

  .mark {
    display: grid;
    place-items: center;
    inline-size: 14px;
    block-size: 14px;
  }

  .host {
    color: var(--color-text);
    font-weight: 600;
  }

  /* One line in the bar: a long title fades at the window's edge. */
  .heading {
    overflow: hidden;
    color: var(--color-muted);
    white-space: nowrap;
    mask-image: linear-gradient(to right, black calc(100% - 20px), transparent);
  }

  .view {
    position: relative;
    display: block;
    flex: 1;
    min-block-size: 0;
    overflow: hidden;
    background: var(--color-surface);
  }

  .thumb {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    object-position: top;
  }

  /* No picture of the page: its title, set, on the page's own sheet. */
  .face {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    padding: 18px 20px 20px;
  }

  .sign {
    display: grid;
    inline-size: 28px;
    block-size: 28px;
  }

  .words {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 23px;
    text-wrap: balance;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
</style>
