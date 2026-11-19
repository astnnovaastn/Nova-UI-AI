<script lang="ts">
  /*
   * V31: AEGIS Desktop's new tab, after Zephium's (frame/src/features/newtab/components/NewTab.svelte,
   * MPL-2.0): a window onto the sky with the field hanging in a notch cut into the page's top edge, the
   * name and the time in the open sky, the day's figures along the foot, and two round controls in the
   * corner. The sky print and the notch geometry are Zephium's own code (vendored unchanged in
   * upstream/src/shared/sky and features/newtab/lib); the custom AEGIS wordmark is original, since the
   * Zephium name and logo are not licensed.
   *
   * Drawn by the workspace, so a new tab costs no web view. The clock redraws once a minute, on the
   * minute, and not at all while the page is hidden.
   */
  import { onMount } from "svelte";
  import Icon from "$shared/ui/Icon";
  import IconButton from "$shared/ui/IconButton";
  import { layout } from "$features/newtab/lib/layout";
  import { api, type Preferences } from "./settings/api";
  import { CheckListIcon, Clock01Icon, Settings01Icon, Shield01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
  import { PICTURE, placeSky, scene as skyScene, SkyPrint } from "$shared/sky";
  import { clockFace, clockFormat, untilNextMinute, focusSpan } from "$features/newtab/lib/clock";
  import { groundPath, notchShape, notchWidth, type Notch } from "$features/newtab/lib/ground";
  import NewTabSearch from "$features/search/components/NewTabSearch.svelte";
  import { browserTabs } from "./browser-tabs.svelte";
  import { browserHost, type BlockerStatus } from "./browser-host";
  import { browserSettings } from "./browser-settings.svelte";
  import { focus } from "./focus.svelte";
  import { today } from "./today-tasks.svelte";

  let { tabId, onsettings, onsearchsettings, onprofile, onfocus }: { tabId: number; onsettings: () => void; onsearchsettings: () => void; onprofile: () => void; onfocus: () => void } = $props();

  let width = $state(0);
  let height = $state(0);
  let now = $state(new Date());
  let blocker = $state<BlockerStatus | null>(null);

  let initials = $state("");
  const settings = $derived(browserSettings.value);
  const scene = $derived(skyScene());
  const sky = $derived(settings.wallpaper.kind === "sky");
  const pageLayout = $derived(layout(width, height, { controls: [32, 32], clock: settings.showClock }));
  const notch: Notch = $derived({ ...pageLayout.notch, width: width < 440 ? Math.max(0, width - 34) : pageLayout.notch.width });
  const horizon = $derived(Math.round(height * (height < 600 ? 0.62 : 0.6)));
  const placed = $derived(placeSky(width, horizon));
  const ground = $derived(width > 0 && height > 0 ? groundPath(width, height, notch) : "");
  const lip = $derived(width > 0 ? notchShape(width, height, notch) : "");
  const fieldWidth = $derived(notchWidth(width, notch));
  // The name and the time stand low in the open sky, as Zephium places its name (layout.ts).
  const markWidth = $derived(Math.max(0, Math.min(610, width - 40, Math.max(286, width * 0.48))));
  const markHeight = $derived(markWidth * 60 / 441);
  const markTop = $derived(Math.max(notch.height + 40, Math.round(notch.height + (horizon - notch.height) * 0.74 - (markHeight + 34) / 2)));
  const quiet = $derived(width > 0 ? { x: width / 2, y: markTop + markHeight / 2 + 10, rx: markWidth / 2 + 38, ry: (markHeight + 34) * 1.4 + 24 } : null);

  const face = $derived(clockFace(now, clockFormat("system")));
  const date = $derived(new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(now));

  const focusMinutes = $derived((void now, focus.today(now.getTime()) / 60));
  const goal = $derived(settings.focus.goal);

  // One redraw per minute, on the turn, and none while hidden; the figures are re-read with it.
  onMount(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      now = new Date();
      focus.now = now.getTime();
      clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(update, untilNextMinute(Date.now()));
      if (settings.figures.due) void today.read();
      if (settings.figures.trackers) void browserHost.blockerStatus(null).then((status) => (blocker = status));
    };
    const visibility = () => { clearTimeout(timer); if (document.visibilityState === "visible") update(); };
    const controller = new AbortController();
    const name = (value: string) => { initials = (value || "").trim().slice(0, 1).toUpperCase(); };
    void api<Preferences>("/api/settings/preferences", { signal: controller.signal }).then((p) => name(p.user_name)).catch(() => {});
    const renamed = (event: Event) => name((event as CustomEvent<string>).detail);
    update();
    window.addEventListener("aegis-profile-name", renamed);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("aegis-profile-name", renamed);
      document.removeEventListener("visibilitychange", visibility);
    };
  });

  let dock = $state<HTMLElement>();
  $effect(() => {
    void browserTabs.focusAddress;
    const field = dock?.querySelector<HTMLInputElement>("input");
    if (!field || browserTabs.active !== tabId || browserTabs.focusFor !== tabId) return;
    browserTabs.focusFor = null;
    field.focus({ preventScroll: true });
  });

  const number = new Intl.NumberFormat();
</script>

<section class="newtab" data-scene={scene} class:custom={!sky} aria-label="New tab" bind:clientWidth={width} bind:clientHeight={height}>
  {#if ground}
    <div class="page" aria-hidden="true" style:clip-path={`path(evenodd, "${ground}")`}
      style:background={settings.wallpaper.kind === "color" ? settings.wallpaper.color : undefined}>
      {#if settings.wallpaper.kind === "image"}
        <img class="picture" src={settings.wallpaper.data} alt="" decoding="async" />
      {:else if sky && width > 0 && height > 0}
        <div class="sky"><SkyPrint {scene} {width} {height} sky={placed} {horizon} pictureHorizon={PICTURE.horizon} {quiet} /></div>
      {/if}
      {#if settings.dim && !sky}<div class="dim"></div>{/if}
    </div>
    <svg class="rim" aria-hidden="true" style:height={`${notch.height + 1}px`}><path d={lip} /></svg>
  {/if}

  <div class="notch-field" bind:this={dock} style:width={fieldWidth + "px"} style:height={notch.height + "px"}>
    <NewTabSearch tabId={String(tabId)} onsettings={onsearchsettings} />
  </div>

  <div class="corner" style:--control-top={(notch.height + 6) + "px"}>
    <div class="control">
      <button type="button" class="round" aria-label="Browser profile" title="Profile and sign-ins" onclick={onprofile}>
        {#if initials}{initials}{:else}<Icon icon={UserCircleIcon} size={17} strokeWidth={1.6} />{/if}
      </button>
    </div>
    <div class="control">
      <IconButton icon={Settings01Icon} label="Browser settings" shape="circle" size={16} buttonSize={32} onclick={onsettings} />
    </div>
  </div>

  <div class="name" style:top={`${markTop}px`}>
    <svg class="mark" viewBox="0 0 441 60" role="img" aria-label="AEGIS" style:width={markWidth + "px"}>
      <!-- A -->
      <path d="M0 60 31 0h12l17 32H49L37 9 11 60Zm54-19h11l10 19H64ZM24 39h22l5 8H19Z" />
      <!-- E -->
      <path d="M101 0h69l-9 9h-50v12h-10Zm10 26h50v9h-50Zm-10 13h10v12h59l-9 9h-60Z" />
      <!-- G -->
      <path d="M224 0h33q15 0 23 12l-8 6q-5-9-16-9h-31q-21 0-21 21t21 21h27q13 0 19-8v-9h-24l9-9h25v22q-10 13-29 13h-28q-30 0-30-30t30-30Z" />
      <!-- I -->
      <path d="M316 0h12v18l-12 9Zm0 38 12-9v31h-12Z" />
      <!-- S -->
      <path d="M384 0h57l-10 9h-47q-12 0-12 8t12 8h20l-10 9h-11q-22 0-22-17t23-17Zm31 25h6q20 0 20 17t-24 18h-56l10-9h46q13 0 13-9t-11-8h-14Z" />
    </svg>
    {#if settings.showClock}
      <p class="when"><span class="time">{face.time}</span>{#if face.period}<span class="period">{face.period}</span>{/if}<span class="dot" aria-hidden="true">·</span><span class="date">{date}</span></p>
    {/if}
  </div>

  <div class="foot">
    {#if settings.figures.trackers && blocker}
      <div class="figure" title={blocker.enabled ? "Adverts and trackers blocked in your tabs today" : "Protection is off"}>
        <Icon icon={Shield01Icon} size={14} /><span class="label">{blocker.enabled ? "Trackers blocked" : "Protection off"}</span><span class="value">{blocker.enabled ? number.format(blocker.today) : ""}</span>
      </div>
    {/if}
    {#if settings.figures.focus}
      <button type="button" class="figure" onclick={onfocus}>
        <Icon icon={Clock01Icon} size={14} /><span class="label">{focus.session ? (focus.session.phase === "focus" ? "Focusing" : "On a break") : "Focused"}</span>
        <span class="value">{focusSpan(focusMinutes)}</span>
        <span class="meter" role="meter" aria-label="Focus goal {focusSpan(goal)}" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(focusMinutes, goal)}><span class="fill" style:transform={`scaleX(${Math.min(1, focusMinutes / goal)})`}></span></span>
      </button>
    {/if}
    {#if settings.figures.due && (today.counts || today.failed)}
      <button type="button" class="figure" onclick={() => (browserTabs.page = "tasks")} title="Open Tasks">
        <Icon icon={CheckListIcon} size={14} />
        {#if today.counts}
          <span class="label">Due today</span><span class="value">{today.counts.today}</span>
          <span class="aside">{today.counts.overdue ? `${today.counts.overdue} overdue` : "Nothing overdue"}</span>
        {:else}<span class="label">Tasks unavailable</span>{/if}
      </button>
    {/if}
  </div>
</section>

<style>
  .newtab {
    /* Fills the browser's page area (a percentage height would resolve to nothing there). */
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: color-mix(in oklab, var(--aegis-surface) 70%, var(--sky-paper, #0a1e36));
    isolation: isolate;
    -webkit-app-region: no-drag;
    color: var(--color-text);
    font-family: var(--font-sans);
    --sky-ink: #f2f4f8;
    --disc-fill: color-mix(in oklab, var(--sky-ink) 12%, transparent);
    --disc-rim: color-mix(in oklab, var(--sky-ink) 24%, transparent);
    --sky-card: color-mix(in oklab, var(--color-float) 48%, var(--sky-paper, #102336));
    --sky-card-edge: var(--color-border);
    --sky-edge-tint: color-mix(in oklab, #000 26%, transparent);
  }
  :global(.aegis-work-root[data-theme="light"]) .newtab { --sky-card: color-mix(in oklab, var(--color-float) 91%, #b9cce2); }
  .newtab[data-scene="day"] { --sky-ink: #142033; --sky-edge-tint: color-mix(in oklab, #fff 30%, transparent); }
  .newtab.custom { --sky-ink: #f2f4f8; }
  .page, .sky, .picture, .dim { position: absolute; inset: 0; }
  .page { background: var(--sky-paper, #0a1e36); pointer-events: none; }
  .picture { inline-size: 100%; block-size: 100%; object-fit: cover; }
  .dim { background: #0007; }
  /* Pictures ease into the page's sides rather than ending at them (Zephium's edge). */
  .page::after { position: absolute; inset: 0; content: ""; pointer-events: none;
    background: linear-gradient(to right, var(--sky-edge-tint) 0, transparent 9%, transparent 91%, var(--sky-edge-tint) 100%); }
  .rim { position: absolute; inset: 0 0 auto; inline-size: 100%; pointer-events: none; }
  .rim path { fill: none; stroke: color-mix(in oklab, var(--sky-ink) 22%, transparent); stroke-width: 1; }
  .notch-field {
    position: absolute; z-index: 6; inset-block-start: 0; inset-inline: 0;
    margin-inline: auto; -webkit-app-region: no-drag;
  }
  .notch-field :global(input), .notch-field :global(button) {
    -webkit-app-region: no-drag;
  }
  .corner {
    position: absolute; z-index: 3;
    inset-block-start: var(--control-top);
    inset-inline-end: 14px;
    display: flex; gap: 6px; -webkit-app-region: no-drag;
  }
  /* Zephium's NewTab control discs. Keep the native system caption area clear. */
  .control {
    display: grid; place-items: center; border-radius: var(--radius-capsule);
    background: var(--disc-fill);
    box-shadow: inset 0 0 0 0.5px var(--disc-rim), inset 0 1px 0 var(--disc-rim);
    color: var(--sky-ink);
  }
  .control, .control :global(button) { -webkit-app-region: no-drag; }
  .control :global(.icon-button) {
    --color-text: var(--sky-ink); --color-muted: var(--sky-ink);
  }
  .round {
    display: grid; place-items: center; inline-size: 32px; block-size: 32px;
    padding: 0; border: 0; border-radius: var(--radius-capsule); background: none;
    color: inherit; font: 600 13px var(--font-sans); cursor: pointer;
  }
  .round:hover { background: var(--disc-rim); }
  .name { position: absolute; z-index: 2; inset-inline: 0; display: grid; justify-items: center; gap: 14px; pointer-events: none; color: var(--sky-ink); }
  .mark {
    display: block;
    block-size: auto;
    aspect-ratio: 441 / 60;
    fill: currentColor;
    filter: drop-shadow(0 1px 2px #0004);
  }
  .newtab[data-scene="day"]:not(.custom) .mark { filter: drop-shadow(0 1px 12px #fff6); }
  .when { display: flex; align-items: baseline; gap: 8px; margin: 0; font-size: 16px; line-height: 20px; text-shadow: 0 1px 5px color-mix(in oklab, #000 35%, transparent); }
  .time { font-weight: 600; font-variant-numeric: tabular-nums; }
  .period { font-size: 11px; font-weight: 600; }
  .dot, .date { opacity: 0.82; }
  .foot { position: absolute; z-index: 2; inset-block-end: 18px; inset-inline: 0; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 0 16px; }
  .figure {
    display: flex; align-items: center; gap: 7px; block-size: 32px; padding: 0 14px; border: 1px solid var(--color-border);
    border-radius: 999px; background: color-mix(in oklab, var(--aegis-surface-raised) 82%, transparent); backdrop-filter: blur(14px);
    color: var(--color-muted); font: 12px var(--font-sans);
  }
  button.figure { cursor: pointer; }
  button.figure:hover { color: var(--color-text); }
  .label { color: inherit; }
  .value { color: var(--color-text); font-weight: 600; font-variant-numeric: tabular-nums; }
  .aside { color: var(--color-muted); }
  .meter { position: relative; inline-size: 44px; block-size: 3px; border-radius: 2px; overflow: hidden; background: color-mix(in oklab, var(--color-text) 14%, transparent); }
  .fill { position: absolute; inset: 0; transform-origin: left; background: #ff8a3d; }
  button:focus-visible { outline: 2px solid var(--color-text); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .round { transition: none; } }
</style>
