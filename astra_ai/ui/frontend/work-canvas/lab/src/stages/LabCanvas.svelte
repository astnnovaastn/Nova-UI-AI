<script lang="ts">
  /*
   * The lab's host for Zephium's genuine WorkCanvas.
   *
   * Derived from the reference test stages
   *   frame/src/features/work/tests/BoardCanvas.svelte and PartsCanvas.svelte
   * (MPL-2.0, (c) Zephium contributors; this derived file is offered under the same
   * licence). The items, places and lines all come from Zephium's own pipeline:
   * environmentStages → placeRun → environmentRequests / Boards / Parts / Inputs / Sources.
   * The lab adds only what a screen around the canvas owns: selection reporting,
   * a local "remove", and the opened view (Lift + ObjectCentre).
   */
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { provideLeadLook } from "$shared/ui/presence";
  import WorkCanvas from "$features/work/components/WorkCanvas.svelte";
  import Lift from "$features/work/components/Lift.svelte";
  import LiftHeader from "$features/work/components/LiftHeader.svelte";
  import ObjectCentre from "$features/work/components/objects/ObjectCentre.svelte";
  import {
    ownPlaces,
    environmentStages,
    fetchedPictures,
    measurer,
  } from "$features/work/lib/project-environment-board";
  import {
    environmentAgents,
    environmentBoards,
    environmentInputs,
    environmentItems,
    environmentParts,
    environmentSources,
    environmentView,
  } from "$features/work/lib/project-environment";
  import {
    environmentRequests,
    requestDress,
    runFolders,
  } from "$features/work/lib/project-environment-thread";
  import type { BoardActions } from "$features/work/lib/canvas-context";
  import { defaultSize, type CanvasItem } from "$features/work/lib/canvas-model";
  import { exchangeOf } from "$features/work/components/asks/asks";
  import { objectIcon, objectLabel } from "$features/work/lib/object-kind";
  import type { PartAsk } from "$features/work/lib/run/parts";
  import type { BoardScene } from "$features/work/tests/board-fixtures";

  let {
    scene,
    full,
    asks,
    onselect,
    onlog,
    onitems,
  }: {
    scene: BoardScene;
    /** The same run once finished: the canvas opens framed on all of it, so a replay needs no camera move. */
    full?: BoardScene;
    asks?: (objective: string) => readonly PartAsk[];
    /** The cards the person selected, as the canvas names them. */
    onselect?: (items: CanvasItem[]) => void;
    /** A line for the lab's action log: what the canvas asked of its owner. */
    onlog?: (text: string, simulated?: boolean) => void;
    /** Every item on the canvas and the lines between them, for the inspector's counts. */
    onitems?: (items: readonly CanvasItem[], links: number) => void;
  } = $props();

  provideLeadLook(() => scene.snapshot.id);
  const measured = new SvelteMap<string, number>();
  const removed = new SvelteSet<string>();
  let open = $state<string | null>(null);
  let lifted = $state<string | null>(null);
  let frame = $state<HTMLElement>();
  const recorded = () => scene.pages;
  const stages = $derived(
    environmentStages(scene.snapshot, scene.objectives, {
      recorded,
      pictures: scene.pictures,
      ...(scene.media ? { fetched: fetchedPictures(scene.snapshot, scene.media) } : {}),
      measured,
      open,
      exchange: exchangeOf,
      ...(asks ? { asks } : {}),
    }),
  );
  const requests = $derived(environmentRequests(stages));
  const own = $derived(environmentView(scene.snapshot));
  const agents = $derived(
    environmentAgents(scene.snapshot, scene.objectives, () => undefined, stages),
  );
  const folders = $derived(runFolders(stages));
  const dress = $derived(requestDress(stages));
  const base = $derived(
    environmentItems(scene.snapshot, [], [], scene.objectives, scene.media),
  );
  const items = $derived(
    [
      ...[...base.filter((item) => !folders.has(item.id)), ...requests.items].map((item) =>
        dress.get(item.id) ? { ...item, ...dress.get(item.id) } : item,
      ),
      ...environmentBoards(stages),
      ...environmentParts(scene.objectives, stages, recorded),
      ...environmentInputs(stages),
      ...environmentSources(stages),
      ...agents.items,
    ].filter((item) => !removed.has(item.id)),
  );
  const links = $derived(
    requests.links.filter((link) => !removed.has(link.source) && !removed.has(link.target)),
  );
  $effect(() => onitems?.(items, links.length));
  const pictures = $derived(
    new Map(
      stages.flatMap((stage) =>
        stage.board.blocks.flatMap((block) =>
          (block.kind === "gallery"
            ? block.entities
            : block.kind === "entity"
              ? [block.entity]
              : []
          ).flatMap((entity) => (entity.image ? [[entity.key, entity.image] as const] : [])),
        ),
      ),
    ),
  );
  const said = (text: string, simulated = true) => onlog?.(text, simulated);
  const board: BoardActions = {
    measure: measurer(measured),
    toggle: (id) => {
      open = open === id ? null : id;
      said(`Block ${open ? "opened" : "closed"} in place`, false);
    },
    ask: (name) => said(`Ask about “${name}” → the ask bar would take the question`),
    choose: (element, chosen) => said(`${chosen ? "Chose" : "Unchose"} ${element} → recorded by the run`),
    evidence: (reference) => said(`Source chip → would open ${reference.url ?? "its page"} in the pane`),
    entity: (element) => said(`Entity ${element} → its product view`),
    command: (record) => said(`Command record ${record} → its recorded output`),
    page: (url) => said(`Page → would open ${url} in the browser pane`),
    compare: (id) => said(`Compare ${id} → picks laid out as a sheet`),
    send: (id) => said(`Send ${id} → always held for Confirm; nothing is sent here`),
    write: () => said("Edit → would be written through the notes store"),
    review: (id, review) => said(`Review state of ${id} → ${review}`),
    note: () => undefined,
  };
  const liftedItem = $derived(items.find((item) => item.id === lifted));
  const bounds = $derived(frame?.getBoundingClientRect() ?? new DOMRect(0, 0, 1200, 800));
  /**
   * Lab framing: Zephium opens a work on its newest result at no less than 50%. To judge a
   * layout you want the whole run, so the lab opens on the finished run's box instead.
   */
  function wholeRun() {
    const whole = full ?? scene;
    const laid = environmentStages(whole.snapshot, whole.objectives, {
      recorded: () => whole.pages,
      pictures: whole.pictures,
      measured: new Map(),
      open: null,
      exchange: exchangeOf,
    });
    const boxes = laid.map((stage) => stage.lane.box);
    if (!boxes.length) return undefined;
    const left = Math.min(...boxes.map((box) => box.x));
    const top = Math.min(...boxes.map((box) => box.y));
    const right = Math.max(...boxes.map((box) => box.x + box.width));
    const bottom = Math.max(...boxes.map((box) => box.y + box.height));
    const room = { width: Math.max(480, window.innerWidth - 272 - 344), height: Math.max(360, window.innerHeight - 64) };
    const zoom = Math.min(1, Math.max(0.2, Math.min((room.width - 96) / (right - left), (room.height - 150) / (bottom - top))));
    return { x: 48 - left * zoom, y: 84 - top * zoom, zoom };
  }
  const viewport = wholeRun();
  const positions = $derived({
    ...ownPlaces(
      own.positions,
      { ...Object.fromEntries(base.map((item) => [item.id, defaultSize(item)])), ...own.sizes },
      stages,
      base.flatMap((item) => (item.type === "objective" || folders.has(item.id) ? [] : [item.id])),
    ),
    ...requests.positions,
    ...agents.positions,
  });
</script>

<div class="frame" bind:this={frame}>
  <WorkCanvas
    {items}
    {links}
    {pictures}
    authoritative={new Set()}
    initialView={{ positions, sizes: own.sizes, ...(viewport ? { viewport } : {}) }}
    home={stages.at(-1)?.lane.box}
    fitTopInset={56}
    fitBottomInset={8}
    {board}
    work={(objective) => scene.objectives.get(objective)}
    oninspect={(id) => {
      const item = items.find((entry) => entry.id === id);
      if (item) onselect?.([item]);
    }}
    onopen={(id) => {
      const item = items.find((entry) => entry.id === id);
      if (item?.object) {
        lifted = id;
        said(`Opened ${item.object.view.kind} in the centre (Lift + ObjectCentre)`, false);
      } else board.toggle(id);
    }}
    onaction={(id, action) => {
      if (action === "remove") {
        removed.add(id);
        said("Removed from this canvas (local to the lab; Reset brings it back)", true);
      } else said(`Card action “${action ?? "open"}” on ${id}`);
    }}
    onselectionchange={(ids) =>
      onselect?.(ids.flatMap((id) => items.find((item) => item.id === id) ?? []))}
    onselectionaction={(action, ids) => {
      if (action === "remove") {
        ids.forEach((id) => removed.add(id));
        said(`Removed ${ids.length} cards (local to the lab)`, true);
      } else said(`Selection action “${action}” on ${ids.length} cards`);
    }}
    onmoved={(ids) => said(`Moved ${ids.length} card${ids.length === 1 ? "" : "s"}: the canvas keeps the new place`, false)}
    onopenlink={(href) => said(`Link → would open ${href}`)}
    onevidence={(_, reference) => said(`Source → would open ${reference.url ?? "its page"}`)}
  />
  {#if liftedItem?.object}
    {@const view = liftedItem.object.view}
    <Lift
      origin={null}
      source={liftedItem.id}
      {bounds}
      preferred={{ width: 980, height: 720 }}
      title={liftedItem.title}
      onclose={() => (lifted = null)}
    >
      <div class="lift-body">
        <LiftHeader kind={objectLabel(view.kind)} title={view.title} icon={objectIcon(view.kind)} />
        <ObjectCentre
          object={view}
          actions={{
            ask: (subject) => said(`Ask about “${subject}”`),
            link: (url) => said(`Link → would open ${url}`),
            send: () => said("Send → held for Confirm; nothing is sent here"),
          }}
        />
      </div>
    </Lift>
  {/if}
</div>

<style>
  .frame {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--color-canvas);
  }

  .lift-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 28px 28px;
  }
</style>
