<script lang="ts">
  /*
   * AEGIS Work Layout Lab — the shell: catalogue, stage, inspector.
   * This file is lab chrome. Everything on the stage is Zephium's genuine code.
   */
  import { onMount } from "svelte";
  import type { CanvasItem } from "$features/work/lib/canvas-model";
  import { objectHeight, objectWidth } from "$features/work/lib/board/object-size";
  import StartStage from "$features/work/tests/StartStage.svelte";
  import LabCanvas from "./stages/LabCanvas.svelte";
  import Specimens, { type Picked } from "./stages/Specimens.svelte";
  import AsksStage from "./stages/AsksStage.svelte";
  import { CATEGORIES, ENTRIES, GROUP_LABEL, MISSING, type Category, type Entry } from "./registry";
  import { SCENES, type Built } from "./scenes";
  import { nativeCalls, watchNative } from "./native";

  const query = new URLSearchParams(location.search);
  const first = ENTRIES.find((entry) => entry.id === query.get("entry")) ?? ENTRIES[0]!;
  let category = $state<Category | "All Components">(
    (CATEGORIES as readonly string[]).includes(query.get("category") ?? "")
      ? (query.get("category") as Category)
      : query.get("entry")
        ? "All Components"
        : "Workspaces",
  );
  let entry = $state<Entry>(first);
  let search = $state("");
  let theme = $state<"dark" | "light">(query.get("theme") === "light" ? "light" : "dark");
  let reset = $state(0);
  let beat = $state(Number(query.get("beat")) || 0);
  let playing = $state(false);
  let picked = $state<Picked | null>(null);
  let chosen = $state<CanvasItem[]>([]);
  let counts = $state<{ kinds: Record<string, number>; items: number; links: number }>({ kinds: {}, items: 0, links: 0 });
  let log = $state<{ text: string; simulated: boolean; at: number }[]>([]);
  let native = $state<string[]>([]);
  let specimens = $state<Specimens>();
  let showMissing = $state(false);

  const listed = $derived(
    ENTRIES.filter(
      (each) =>
        (category === "All Components" || each.categories.includes(category)) &&
        (!search.trim() ||
          `${each.name} ${each.internal} ${each.source.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())),
    ),
  );
  const grouped = $derived(
    Object.entries(
      listed.reduce<Record<string, Entry[]>>((out, each) => {
        (out[GROUP_LABEL[each.group]] ??= []).push(each);
        return out;
      }, {}),
    ),
  );
  const def = $derived(entry.stage.kind === "scene" ? SCENES[entry.stage.scene] : undefined);
  const beats = $derived(def?.beats ?? []);
  const upto = $derived(beats.length ? (beat > 0 ? Math.min(beat, beats.length) : beats.length) : Infinity);
  const built = $derived<Built | undefined>(def ? def.build(upto) : undefined);
  const whole = $derived(def?.beats ? def.build().scene : undefined);

  function choose(next: Entry) {
    entry = next;
    beat = 0;
    playing = false;
    picked = null;
    chosen = [];
    log = [];
    reset++;
  }
  const say = (text: string, simulated = true) => {
    log = [{ text, simulated, at: Date.now() }, ...log].slice(0, 12);
  };

  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });
  $effect(() => {
    const url = new URL(location.href);
    url.searchParams.set("entry", entry.id);
    if (beat) url.searchParams.set("beat", String(beat));
    else url.searchParams.delete("beat");
    history.replaceState(null, "", url);
  });
  $effect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const at = beat === 0 ? beats.length : beat;
      if (at >= beats.length) playing = false;
      else beat = at + 1;
    }, 900);
    return () => clearInterval(timer);
  });
  onMount(() =>
    watchNative(() => {
      native = [...new Set(nativeCalls().map((call) => `${call.command}${call.answered ? "" : " (rejected)"}`))];
    }),
  );
  function play() {
    if (!beats.length) return;
    if (beat === 0 || beat >= beats.length) beat = 1;
    playing = true;
  }
  const shown = $derived(beat === 0 ? beats.length : Math.min(beat, beats.length));
  const dims = $derived.by(() => {
    if (!picked) return null;
    return `${picked.range.min}–${picked.range.max} wide (ideal ${picked.range.ideal}); about ${Math.round(objectHeight(picked.view, picked.range.ideal))} tall at its ideal width, ${picked.height} at the ${Math.round(picked.width)} px it stands at now`;
  });
  const trimmed = (value: unknown) => {
    const text = JSON.stringify(value, (_, each) => (typeof each === "string" && each.length > 140 ? `${each.slice(0, 140)}…` : each), 1);
    return text.length > 2600 ? `${text.slice(0, 2600)}\n…` : text;
  };
  void objectWidth;
</script>

<div class="lab">
  <aside class="rail">
    <header>
      <strong>AEGIS Work Layout Lab</strong>
      <span>Zephium Work source · commit 9026a1f · development only</span>
      <a class="nav" href="/dev/agent-execution-lab/" data-nav="agent">Agent Execution Lab →</a>
    </header>
    <input class="search" type="search" placeholder="Search components and source paths" bind:value={search} />
    <nav class="cats" aria-label="Categories">
      {#each ["All Components", ...CATEGORIES] as const as name (name)}
        {@const count = name === "All Components" ? ENTRIES.length : ENTRIES.filter((each) => each.categories.includes(name)).length}
        <button type="button" class:on={category === name} onclick={() => (category = name)}>
          <span>{name}</span><em>{count}</em>
        </button>
      {/each}
    </nav>
    <div class="list scrolls">
      {#each grouped as [label, entries] (label)}
        <h3>{label}</h3>
        {#each entries as each (each.id)}
          <button type="button" class="item" class:on={entry.id === each.id} data-entry={each.id} onclick={() => choose(each)}>
            {each.name}
          </button>
        {/each}
      {/each}
      {#if !listed.length}<p class="none">Nothing in the source matches.</p>{/if}
      <button type="button" class="missing" onclick={() => (showMissing = !showMissing)}>
        Not in the accessible source ({MISSING.length})
      </button>
      {#if showMissing}
        <ul class="gone">
          {#each MISSING as gone (gone.name)}<li><b>{gone.name}</b>{gone.why}</li>{/each}
        </ul>
      {/if}
    </div>
  </aside>

  <main class="stage">
    <div class="bar">
      <div class="title">
        <strong>{entry.name}</strong>
        <span class="chip real">Genuine Zephium components</span>
        <span class="chip sim">
          {def?.origin === "zephium" || entry.stage.kind !== "scene" ? "Zephium's own test fixtures" : "Invented local sample data"}
        </span>
        <span class="chip off">No AI · no network</span>
      </div>
      <div class="tools">
        {#if entry.stage.kind === "objects"}
          <button type="button" onclick={() => specimens?.zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
          <button type="button" onclick={() => specimens?.zoomBy(1.25)} aria-label="Zoom in">+</button>
          <button type="button" onclick={() => specimens?.fit()}>Fit</button>
        {/if}
        <button type="button" onclick={() => choose(entry)}>Reset</button>
        <button type="button" onclick={() => (theme = theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </div>

    <div class="view" data-lab-view>
      {#key `${entry.id}:${reset}`}
        {#if entry.stage.kind === "objects"}
          <Specimens bind:this={specimens} kinds={entry.stage.kinds} onselect={(next) => (picked = next)} onlog={say} />
        {:else if entry.stage.kind === "scene" && built}
          <LabCanvas
            scene={built.scene}
            full={whole}
            asks={built.asks}
            onselect={(items) => (chosen = items)}
            onlog={say}
            onitems={(items, links) => {
              const kinds: Record<string, number> = {};
              for (const item of items) {
                const kind = item.object ? `object:${item.object.view.kind}` : item.block ? `block:${item.block.data.kind}` : (item.type ?? "card");
                kinds[kind] = (kinds[kind] ?? 0) + 1;
              }
              counts = { kinds, items: items.length, links };
            }}
          />
        {:else if entry.stage.kind === "asks"}
          <AsksStage onlog={say} />
        {:else if entry.stage.kind === "start"}
          <div class="contained">
            <StartStage
              works={[
                { requests: ["Research how competitors price issue trackers"], touched_ms: "300" },
                { requests: ["Plan my day"], touched_ms: "200" },
                { requests: ["Explain how this code works: ~/Dev/zephium/crates/zephium-app"], touched_ms: "100" },
              ]}
            />
          </div>
        {/if}
      {/key}
    </div>

    {#if beats.length}
      <div class="replay">
        <button type="button" onclick={() => ((playing = false), (beat = 1))} aria-label="First beat">⏮</button>
        <button type="button" onclick={() => ((playing = false), (beat = Math.max(1, shown - 1)))} aria-label="Previous beat">◀</button>
        <button type="button" class="play" onclick={() => (playing ? (playing = false) : play())}>
          {playing ? "Pause" : "Replay"}
        </button>
        <button type="button" onclick={() => ((playing = false), (beat = Math.min(beats.length, shown + 1)))} aria-label="Next beat">▶</button>
        <input
          type="range"
          min="1"
          max={beats.length}
          value={shown}
          aria-label="Replay position"
          oninput={(event) => ((playing = false), (beat = Number(event.currentTarget.value)))}
        />
        <span class="beat" data-beat={shown}>
          <b>{shown}/{beats.length}</b>
          {beats[shown - 1]?.label}
          {#if beats[shown - 1]?.detail}<i>{beats[shown - 1]?.detail}</i>{/if}
        </span>
      </div>
    {/if}
  </main>

  <aside class="inspector scrolls">
    <h2>{entry.name}</h2>
    <p class="group">{GROUP_LABEL[entry.group]}</p>
    {#if entry.note}<p class="note">{entry.note}</p>{/if}
    <dl>
      <dt>Internal type</dt>
      <dd><code>{entry.internal}</code></dd>
      <dt>Original source</dt>
      <dd>
        <ul class="paths">
          {#each entry.source as path (path)}<li><code>{path}</code></li>{/each}
        </ul>
      </dd>
      <dt>Renderer</dt>
      <dd>{entry.renderer}</dd>
      <dt>Data schema</dt>
      <dd><code class="wrap">{entry.schema}</code></dd>
      <dt>Default dimensions</dt>
      <dd>
        {entry.size}
        {#if dims}<span class="live">Selected specimen, from objectWidth / objectHeight: {dims}.</span>{/if}
      </dd>
      <dt>Supported interactions</dt>
      <dd>
        <ul>
          {#each entry.interactions as each (each)}<li>{each}</li>{/each}
        </ul>
      </dd>
      <dt>Backend requirements</dt>
      <dd>{entry.backend}</dd>
      <dt>Renders locally · mock data</dt>
      <dd>{entry.local} · {entry.mock}</dd>
      <dt>Reuse strategy</dt>
      <dd><b>{entry.strategy}</b></dd>
      <dt>React compatibility</dt>
      <dd>{entry.react}</dd>
      <dt>Status in AEGIS</dt>
      <dd><b>{entry.aegis}</b><br />{entry.aegisNote}</dd>
    </dl>

    {#if entry.stage.kind === "scene"}
      <h4>On this canvas</h4>
      <p class="counts" data-counts>
        {counts.items} items · {counts.links} lines<br />
        {#each Object.entries(counts.kinds).sort() as [kind, count] (kind)}<span>{kind} × {count}</span>{/each}
      </p>
    {/if}
    {#if picked}
      <h4>Selected specimen</h4>
      <pre>{trimmed(picked.view)}</pre>
    {:else if chosen.length}
      <h4>Selected on canvas ({chosen.length})</h4>
      <pre>{trimmed(chosen.map((item) => ({ id: item.id, type: item.type, kind: item.kind, title: item.title, object: item.object?.view.kind, block: item.block?.data.kind, part: item.part?.title })))}</pre>
    {/if}
    <h4>Action log</h4>
    {#if log.length}
      <ul class="log">
        {#each log as line (line.at + line.text)}
          <li><span class="tag" class:sim={line.simulated}>{line.simulated ? "simulated" : "real"}</span>{line.text}</li>
        {/each}
      </ul>
    {:else}<p class="none">Interact with the stage: every action a component asks of its owner is listed here.</p>{/if}
    <h4>Native commands reached</h4>
    {#if native.length}
      <ul class="log">
        {#each native as command (command)}<li><code>{command}</code></li>{/each}
      </ul>
    {:else}<p class="none">None yet. Anything a component asks of Zephium's Rust backend shows up here.</p>{/if}
  </aside>
</div>

<style>
  .lab {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: 272px minmax(0, 1fr) 344px;
    background: var(--color-chrome);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 12.5px;
  }

  .rail,
  .inspector {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    background: var(--color-chrome);
  }

  .rail header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 14px 10px;
  }

  .rail header strong {
    font-size: 13.5px;
  }

  .nav {
    margin-block-start: 4px;
    color: #6aa3ff;
    font-size: 11.5px;
    text-decoration: none;
  }

  .rail header span,
  .group,
  .none {
    color: var(--color-muted);
    font-size: 11px;
  }

  .search {
    margin: 0 12px 8px;
    padding: 6px 9px;
    border: 0;
    border-radius: 7px;
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
    color: var(--color-text);
    font-size: 12px;
  }

  .cats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    padding: 0 8px 8px;
  }

  .cats button,
  .item,
  .missing {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 5px 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--color-muted);
    font-size: 11.5px;
    text-align: start;
    cursor: pointer;
  }

  .cats button:first-child {
    grid-column: 1 / -1;
  }

  .cats em {
    font-style: normal;
    font-variant-numeric: tabular-nums;
    opacity: 0.6;
  }

  .cats button:hover,
  .item:hover,
  .missing:hover {
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    color: var(--color-text);
  }

  .cats button.on,
  .item.on {
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
    color: var(--color-text);
    font-weight: 600;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    min-block-size: 0;
    padding: 4px 8px 16px;
    border-block-start: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  }

  .list h3,
  .inspector h4,
  dt {
    margin: 12px 8px 4px;
    color: var(--color-muted);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .item {
    inline-size: 100%;
    font-size: 12.5px;
  }

  .missing {
    inline-size: 100%;
    margin-block-start: 14px;
  }

  .gone {
    margin: 4px 0 0;
    padding: 0 8px;
    list-style: none;
  }

  .gone li {
    padding: 6px 0;
    color: var(--color-muted);
    font-size: 11.5px;
    line-height: 1.45;
  }

  .gone b {
    display: block;
    color: var(--color-text);
  }

  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    padding-block-start: 8px;
  }

  .bar {
    position: absolute;
    inset-block-start: 16px;
    inset-inline: 12px;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    pointer-events: none;
  }

  .title,
  .tools {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--color-chrome) 88%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-text) 8%, transparent);
    pointer-events: auto;
  }

  .title strong {
    margin-inline-end: 4px;
    font-size: 13px;
    white-space: nowrap;
  }

  .chip {
    padding: 2px 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-muted);
    font-size: 10.5px;
    white-space: nowrap;
  }

  .chip.real {
    background: color-mix(in srgb, #3fb37f 22%, transparent);
    color: var(--color-text);
  }

  .tools button,
  .replay button {
    padding: 4px 10px;
    border: 0;
    border-radius: 7px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    color: var(--color-text);
    font-size: 12px;
    cursor: pointer;
  }

  .tools button:hover,
  .replay button:hover {
    background: color-mix(in srgb, var(--color-text) 16%, transparent);
  }

  .view {
    position: relative;
    flex: 1;
    overflow: hidden;
    min-block-size: 0;
    border-radius: 12px 12px 0 0;
    background: var(--color-canvas);
  }

  /* StartStage places itself with position: fixed; a transform makes this box its viewport. */
  .contained {
    position: absolute;
    inset: 0;
    transform: translateZ(0);
  }

  .replay {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--color-chrome);
  }

  .replay .play {
    min-inline-size: 64px;
    background: color-mix(in srgb, #6aa3ff 34%, transparent);
    font-weight: 600;
  }

  .replay input {
    flex: 0 0 180px;
  }

  .beat {
    overflow: hidden;
    min-inline-size: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .beat b {
    margin-inline-end: 6px;
    font-variant-numeric: tabular-nums;
  }

  .beat i {
    margin-inline-start: 6px;
    color: var(--color-muted);
    font-style: normal;
  }

  .inspector {
    overflow-y: auto;
    padding: 14px 14px 32px;
    line-height: 1.5;
  }

  .inspector h2 {
    margin: 0;
    font-size: 15px;
  }

  .group {
    margin: 2px 0 8px;
  }

  .note {
    margin: 0 0 6px;
    padding: 8px 10px;
    border-radius: 8px;
    background: color-mix(in srgb, #6aa3ff 14%, transparent);
  }

  dl {
    margin: 0;
  }

  dt,
  .inspector h4 {
    margin: 12px 0 3px;
  }

  dd {
    margin: 0;
  }

  dd ul {
    margin: 0;
    padding-inline-start: 16px;
  }

  .paths {
    padding: 0;
    list-style: none;
  }

  code,
  pre {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
  }

  .paths code,
  .wrap {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .live {
    display: block;
    margin-block-start: 4px;
    color: #6aa3ff;
  }

  .counts span {
    display: inline-block;
    margin: 3px 4px 0 0;
    padding: 1px 6px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
    font-size: 11px;
  }

  pre {
    overflow: auto;
    max-block-size: 260px;
    margin: 0;
    padding: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    white-space: pre-wrap;
  }

  .log {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .log li {
    padding: 3px 0;
  }

  .tag {
    margin-inline-end: 6px;
    padding: 0 5px;
    border-radius: 4px;
    background: color-mix(in srgb, #3fb37f 26%, transparent);
    font-size: 10px;
  }

  .tag.sim {
    background: color-mix(in srgb, #e0a53a 30%, transparent);
  }
</style>
