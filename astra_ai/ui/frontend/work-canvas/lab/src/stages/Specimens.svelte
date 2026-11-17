<script lang="ts">
  /*
   * A pannable, zoomable sheet of object specimens.
   *
   * The sheet itself is lab chrome (an adapter, like Zephium's own tests/ObjectsSheet.svelte).
   * What stands on it is not: each specimen is Zephium's genuine ObjectView, fed Zephium's
   * own fixtures, and opens into the genuine Lift + ObjectCentre.
   */
  import ObjectView from "$features/work/components/objects/ObjectView.svelte";
  import ObjectCentre from "$features/work/components/objects/ObjectCentre.svelte";
  import Lift from "$features/work/components/Lift.svelte";
  import LiftHeader from "$features/work/components/LiftHeader.svelte";
  import { objectHeight, objectWidth } from "$features/work/lib/board/object-size";
  import { objectIcon, objectLabel } from "$features/work/lib/object-kind";
  import type { ObjectActions, ObjectKind, ObjectView as View } from "$features/work/lib/board/types";
  import { allObjects, looks } from "$features/work/tests/object-fixtures";

  export type Picked = {
    view: View;
    width: number;
    range: { min: number; ideal: number; max: number };
    height: number;
  };

  let {
    kinds,
    onselect,
    onlog,
  }: {
    kinds: readonly ObjectKind[];
    onselect?: (picked: Picked | null) => void;
    onlog?: (text: string, simulated?: boolean) => void;
  } = $props();

  type Row = { view: View; width: number };
  function rowsFor(wanted: readonly ObjectKind[]): Row[] {
    const seen = new Set<string>();
    const out: Row[] = [];
    const take = (view: View, width: number) => {
      if (!wanted.includes(view.kind) || seen.has(view.id)) return;
      seen.add(view.id);
      out.push({ view, width });
    };
    for (const rows of Object.values(looks)) for (const row of rows) take(row.object, row.width);
    for (const view of allObjects) take(view, objectWidth(view).ideal);
    return out;
  }

  const rows = $derived(rowsFor(kinds));
  let widths = $state<Record<string, number>>({});
  let offsets = $state<Record<string, { x: number; y: number }>>({});
  let edits = $state<Record<string, View>>({});
  let selected = $state<string | null>(null);
  let lifted = $state<string | null>(null);
  let camera = $state({ x: 48, y: 72, zoom: 0.8 });
  let surface = $state<HTMLElement>();
  let world = $state<HTMLElement>();

  const viewOf = (row: Row) => edits[row.view.id] ?? row.view;
  const widthOf = (row: Row) => widths[row.view.id] ?? row.width;
  const picked = (row: Row): Picked => {
    const view = viewOf(row);
    const range = objectWidth(view);
    return { view, width: widthOf(row), range, height: Math.round(objectHeight(view, widthOf(row))) };
  };
  function select(row: Row | null) {
    selected = row?.view.id ?? null;
    onselect?.(row ? picked(row) : null);
  }

  // A new set of kinds starts from a clean sheet.
  $effect(() => {
    void kinds;
    widths = {};
    offsets = {};
    edits = {};
    selected = null;
    lifted = null;
    camera = { x: 48, y: 72, zoom: 0.8 };
    onselect?.(null);
  });

  function actionsFor(row: Row): ObjectActions {
    const id = row.view.id;
    return {
      open: () => {
        lifted = id;
        onlog?.(`Opened ${row.view.kind} in the centre (Lift + ObjectCentre)`, false);
      },
      check: (_, index, done) => {
        const view = viewOf(row);
        if (view.kind === "plan")
          edits[id] = { ...view, steps: view.steps.map((step, at) => (at === index ? { ...step, done } : step)) };
        else if (view.kind === "list")
          edits[id] = { ...view, items: view.items.map((item, at) => (at === index ? { ...item, done } : item)) };
        onlog?.(`${done ? "Ticked" : "Unticked"} item ${index + 1} (kept in the lab only)`, true);
      },
      choose: (element, chosen) => onlog?.(`${chosen ? "Chose" : "Unchose"} ${element} → would be recorded on the run`, true),
      compare: () => onlog?.("Compare → the picks would open side by side as a sheet", true),
      ask: (subject) => onlog?.(`Ask about “${subject}” → the ask bar would take it`, true),
      evidence: (reference) => onlog?.(`Source chip → would open ${reference.url ?? "its page"}`, true),
      link: (url) => onlog?.(`Link → would open ${url} in the browser pane`, true),
      send: () => onlog?.("Send → always held for Confirm; nothing is sent in the lab", true),
      write: () => onlog?.("Edit → would be written through the notes store", true),
      review: (_, review) => onlog?.(`Review state → ${review}`, true),
    };
  }

  function wheel(event: WheelEvent) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const rect = surface!.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const zoom = Math.min(2, Math.max(0.2, camera.zoom * Math.exp(-event.deltaY * 0.0022)));
      const k = zoom / camera.zoom;
      camera = { zoom, x: px - (px - camera.x) * k, y: py - (py - camera.y) * k };
    } else camera = { ...camera, x: camera.x - event.deltaX, y: camera.y - event.deltaY };
  }
  function drag(event: PointerEvent, move: (dx: number, dy: number) => void) {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    let x = event.clientX;
    let y = event.clientY;
    const moved = (next: PointerEvent) => {
      move(next.clientX - x, next.clientY - y);
      x = next.clientX;
      y = next.clientY;
    };
    const stop = () => {
      target.removeEventListener("pointermove", moved);
      target.removeEventListener("pointerup", stop);
      target.removeEventListener("pointercancel", stop);
    };
    target.addEventListener("pointermove", moved);
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  }
  const pan = (event: PointerEvent) => {
    if (event.target !== surface && event.target !== world) return;
    select(null);
    drag(event, (dx, dy) => (camera = { ...camera, x: camera.x + dx, y: camera.y + dy }));
  };
  export function zoomBy(factor: number) {
    const rect = surface!.getBoundingClientRect();
    const zoom = Math.min(2, Math.max(0.2, camera.zoom * factor));
    const k = zoom / camera.zoom;
    camera = { zoom, x: rect.width / 2 - (rect.width / 2 - camera.x) * k, y: rect.height / 2 - (rect.height / 2 - camera.y) * k };
  }
  export function fit() {
    if (!surface || !world) return;
    const rect = surface.getBoundingClientRect();
    const zoom = Math.min(1, Math.max(0.2, Math.min((rect.width - 96) / world.scrollWidth, (rect.height - 120) / world.scrollHeight)));
    camera = { zoom, x: 48, y: 72 };
  }
  const liftedRow = $derived(rows.find((row) => row.view.id === lifted));
</script>

<div class="surface" bind:this={surface} onwheel={wheel} onpointerdown={pan} role="application" aria-label="Component specimens">
  <div
    class="world"
    bind:this={world}
    style:transform={`translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`}
  >
    {#each rows as row (row.view.id)}
      {@const view = viewOf(row)}
      {@const offset = offsets[row.view.id] ?? { x: 0, y: 0 }}
      <figure
        class="specimen"
        class:selected={selected === row.view.id}
        data-specimen={row.view.id}
        style:inline-size={`${widthOf(row)}px`}
        style:translate={`${offset.x}px ${offset.y}px`}
      >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <figcaption
          onpointerdown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            select(row);
            drag(event, (dx, dy) => {
              const at = offsets[row.view.id] ?? { x: 0, y: 0 };
              offsets[row.view.id] = { x: at.x + dx / camera.zoom, y: at.y + dy / camera.zoom };
            });
          }}
        >
          <span class="kind">{view.kind}</span>
          <span class="name">{view.title || view.id}</span>
          <span class="px">{Math.round(widthOf(row))} px</span>
          <button type="button" onclick={() => actionsFor(row).open?.(row.view.id)}>Open</button>
        </figcaption>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="body" onclick={() => select(row)}>
          <ObjectView object={view} actions={actionsFor(row)} />
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="grip"
          title="Drag to resize: the object lays itself out again at the new width"
          onpointerdown={(event) => {
            event.stopPropagation();
            select(row);
            drag(event, (dx) => {
              widths[row.view.id] = Math.min(1600, Math.max(240, widthOf(row) + dx / camera.zoom));
              onselect?.(picked(row));
            });
          }}
        ></div>
      </figure>
    {/each}
  </div>
  <div class="zoom">{Math.round(camera.zoom * 100)}%</div>
  {#if liftedRow}
    {@const view = viewOf(liftedRow)}
    <Lift
      origin={null}
      bounds={surface?.getBoundingClientRect() ?? new DOMRect(0, 0, 1200, 800)}
      preferred={{ width: 980, height: 720 }}
      title={view.title ?? view.kind}
      onclose={() => (lifted = null)}
    >
      <div class="lift-body">
        <LiftHeader kind={objectLabel(view.kind)} title={view.title} icon={objectIcon(view.kind)} />
        <ObjectCentre object={view} actions={actionsFor(liftedRow)} />
      </div>
    </Lift>
  {/if}
</div>

<style>
  .surface {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle, color-mix(in srgb, var(--color-text) 9%, transparent) 1px, transparent 1.5px) 0 0 / 24px 24px,
      var(--color-canvas);
    cursor: grab;
    touch-action: none;
  }

  .surface:active {
    cursor: grabbing;
  }

  .world {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 72px 64px;
    inline-size: 2600px;
    transform-origin: 0 0;
    cursor: default;
  }

  .specimen {
    position: relative;
    flex: none;
    margin: 0;
    color: var(--color-text);
  }

  figcaption {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-end: 12px;
    padding: 5px 6px 5px 10px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    color: var(--color-muted);
    font-size: 11px;
    cursor: grab;
    user-select: none;
  }

  .selected figcaption {
    background: color-mix(in srgb, var(--color-accent, #6aa3ff) 26%, transparent);
    color: var(--color-text);
  }

  .kind {
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .name {
    flex: 1;
    overflow: hidden;
    min-inline-size: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .px {
    font-variant-numeric: tabular-nums;
  }

  figcaption button {
    padding: 2px 9px;
    border: 0;
    border-radius: 6px;
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
    color: var(--color-text);
    font-size: 11px;
    cursor: pointer;
  }

  .body {
    position: relative;
  }

  .selected .body {
    outline: 1px dashed color-mix(in srgb, var(--color-accent, #6aa3ff) 70%, transparent);
    outline-offset: 10px;
    border-radius: 4px;
  }

  .grip {
    position: absolute;
    inset-block: 40px 0;
    inset-inline-end: -16px;
    inline-size: 12px;
    border-radius: 6px;
    cursor: ew-resize;
  }

  .grip::after {
    position: absolute;
    inset-block: calc(50% - 18px);
    inset-inline-start: 4px;
    inline-size: 4px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--color-text) 22%, transparent);
    content: "";
  }

  .grip:hover::after,
  .selected .grip::after {
    background: var(--color-accent, #6aa3ff);
  }

  .zoom {
    position: absolute;
    inset-block-end: 12px;
    inset-inline-end: 14px;
    color: var(--color-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  .lift-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 28px 28px;
  }
</style>
