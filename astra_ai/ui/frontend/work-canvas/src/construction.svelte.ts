/**
 * The construction hand: a visual playback of the graph a live run actually builds.
 *
 * It never delays the backend, a save, or the person. Cards and strings exist in the canvas data the
 * moment the run records them; this only decides when each is shown, then moves a cursor to place
 * it and to draw its string, in dependency order. What was on the canvas when it opened is shown at
 * once (a reload rebuilds from the record and replays nothing). Many arrivals at once are batched,
 * so the person never waits behind dozens of trips. Any pointer or key input finishes the playback
 * instantly. Reduced motion shows everything with no hand at all.
 */

export type Step =
  | { kind: "node"; id: string; label: string }
  | { kind: "edge"; id: string; source: string; target: string; label: string };

export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };

/** Past this many waiting steps, the oldest are shown together without a trip each. */
export const BATCH_AFTER = 10;
const KEEP_ANIMATED = 6;
const KEEP_NODES = 4;
const MAX_ANIMATED = 14;

export const SPEEDS = [0.75, 1, 1.5, 2] as const;

/** How long a trip takes: by distance, eased, never frantic and never slow. */
export function travelMs(from: Point, to: Point, speed = 1) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round(Math.min(720, Math.max(240, 200 + distance * 0.42)) / speed);
}

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A point on the cubic a string follows from one port to the other (ports face right and left). */
export function alongString(from: Point, to: Point, t: number): Point {
  const reach = Math.max(48, Math.min(260, (Math.abs(to.x - from.x) + Math.abs(to.y - from.y) * 0.35) / 2));
  const c1 = { x: from.x + reach, y: from.y };
  const c2 = { x: to.x - reach, y: to.y };
  const u = 1 - t;
  return {
    x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
    y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y,
  };
}

/**
 * Orders new arrivals so a string is drawn only after both its cards: cards left to right, each
 * followed by the strings that join it to cards already placed.
 */
export function plan(
  nodes: readonly { id: string; x: number; y: number; label: string }[],
  edges: readonly { id: string; source: string; target: string; label: string }[],
  shown: ReadonlySet<string>,
): Step[] {
  const steps: Step[] = [];
  const placed = new Set(shown);
  const waiting = [...edges];
  const ordered = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
  const flush = () => {
    for (let index = 0; index < waiting.length; ) {
      const edge = waiting[index]!;
      if (placed.has(edge.source) && placed.has(edge.target)) {
        steps.push({ kind: "edge", ...edge });
        waiting.splice(index, 1);
      } else index++;
    }
  };
  flush();
  for (const node of ordered) {
    steps.push({ kind: "node", id: node.id, label: node.label });
    placed.add(node.id);
    flush();
  }
  // A string to a card the canvas does not show is left out rather than drawn to nothing.
  return steps;
}

type Geometry = {
  rect(id: string): Rect | null;
  screen(point: Point): Point;
  /** Brings a card into view without changing zoom, when it is outside the visible canvas. */
  follow?(id: string): void;
};

class Construction {
  /** Bumped on every change, for the overlay and edges to redraw. */
  version = $state(0);
  hand = $state<{ x: number; y: number; label: string; pressing: boolean; visible: boolean }>({ x: 0, y: 0, label: "", pressing: false, visible: false });
  paused = $state(false);
  speed = $state(1);
  instant = false;
  private page = "";
  private active = false;
  private shown = new Set<string>();
  private queue: Step[] = [];
  private hidden = new Set<string>();
  private drawing = new Set<string>();
  private revealing = new Set<string>();
  private geometry: Geometry | null = null;
  private running = false;
  private last: Point | null = null;
  private frame = 0;
  private yieldUntil = 0;
  /** Bumped when playback is finished early, so a trip in flight stops where it is. */
  private generation = 0;
  /** For tests and diagnosis: how many arrivals were played back, and how many shown at once (and why). */
  stats = { page: "", active: false, played: 0, immediate: 0, reason: "" };

  constructor() {
    if (typeof window === "undefined") return;
    try {
      const saved = Number(localStorage.getItem("aegis-construction-speed"));
      if ((SPEEDS as readonly number[]).includes(saved)) this.speed = saved;
    } catch {
      // Without storage the speed is the default.
    }
    window.addEventListener("pointerdown", this.interrupt, true);
    window.addEventListener("keydown", this.interrupt, true);
    window.addEventListener("wheel", this.interrupt, { capture: true, passive: true });
  }

  private reduced() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private bump() {
    this.version++;
  }

  /**
   * A research opened. Everything it already has is shown at once. Only a live run plays back what
   * arrives from now on.
   */
  open(page: string, live: boolean, ids: Iterable<string>) {
    this.stats.page = page;
    this.stats.active = live;
    if (page === this.page) {
      if (!live) this.finish();
      this.active = live;
      return;
    }
    this.finish();
    this.page = page;
    this.active = live;
    this.shown = new Set(ids);
    this.bump();
  }

  attach(geometry: Geometry | null) {
    this.geometry = geometry;
  }

  /** The canvas now holds these cards and strings; anything new joins the playback. */
  observe(
    nodes: readonly { id: string; x: number; y: number; label: string }[],
    edges: readonly { id: string; source: string; target: string; label: string }[],
  ) {
    const fresh = nodes.filter((node) => !this.shown.has(node.id) && !this.hidden.has(node.id));
    const freshEdges = edges.filter((edge) => !this.shown.has(edge.id) && !this.hidden.has(edge.id));
    if (!fresh.length && !freshEdges.length) return;
    if (!this.active || this.reduced() || performance.now() < this.yieldUntil) {
      this.stats.immediate += fresh.length + freshEdges.length;
      this.stats.reason = !this.active ? "inactive" : this.reduced() ? "reduced-motion" : "yielded";
      for (const row of [...fresh, ...freshEdges]) this.shown.add(row.id);
      this.bump();
      return;
    }
    const known = new Set([...this.shown, ...this.hidden]);
    const steps = plan(fresh, freshEdges, known);
    this.stats.played += steps.length;
    for (const step of steps) this.hidden.add(step.id);
    // Strings whose cards never arrive are shown as they are, not held back forever.
    for (const edge of freshEdges) if (!this.hidden.has(edge.id)) this.shown.add(edge.id);
    this.queue.push(...steps);
    this.batch();
    this.bump();
    void this.run();
  }

  pendingNode(id: string) {
    void this.version;
    return this.hidden.has(id);
  }

  pendingEdge(id: string) {
    void this.version;
    return this.hidden.has(id);
  }

  /** A card the hand is placing right now, for its arrival animation. */
  revealingNode(id: string) {
    void this.version;
    return this.revealing.has(id);
  }

  animating(id: string) {
    return this.drawing.has(id);
  }

  drawMs() {
    return Math.round(520 / this.speed);
  }

  get busy() {
    void this.version;
    return this.queue.length > 0 || this.running;
  }

  get waiting() {
    void this.version;
    return this.queue.length;
  }

  setSpeed(value: number) {
    this.speed = value;
    try {
      localStorage.setItem("aegis-construction-speed", String(value));
    } catch {
      // The speed holds for this page only.
    }
  }

  togglePause() {
    this.paused = !this.paused;
    if (!this.paused) void this.run();
  }

  /** Shows everything now. */
  finish() {
    this.generation++;
    cancelAnimationFrame(this.frame);
    for (const step of this.queue) this.shown.add(step.id);
    for (const id of this.hidden) this.shown.add(id);
    this.queue = [];
    this.hidden.clear();
    this.drawing.clear();
    this.revealing.clear();
    this.hand = { ...this.hand, visible: false, pressing: false };
    this.paused = false;
    this.bump();
  }

  /** Plays the whole canvas again, on request only. */
  replay(
    nodes: readonly { id: string; x: number; y: number; label: string }[],
    edges: readonly { id: string; source: string; target: string; label: string }[],
  ) {
    this.finish();
    this.shown = new Set();
    const was = this.active;
    this.active = true;
    this.yieldUntil = 0;
    this.observe(nodes, edges);
    this.active = was;
  }

  private interrupt = (event: Event) => {
    if (!this.queue.length && !this.running) return;
    const target = event.target as Element | null;
    // The playback's own controls do not count as taking over.
    if (target?.closest?.("[data-construction-control]")) return;
    this.yieldUntil = performance.now() + 1500;
    this.finish();
  };

  private batch() {
    if (this.queue.length <= BATCH_AFTER) return;
    // The hand keeps the last few cards and their strings; earlier steps appear together.
    const nodes = this.queue.flatMap((step, index) => (step.kind === "node" ? [index] : []));
    const from = nodes.length ? nodes[Math.max(0, nodes.length - KEEP_NODES)]! : this.queue.length - KEEP_ANIMATED;
    const overflow = this.queue.splice(0, from);
    const edges = this.queue.filter((step) => step.kind === "edge");
    if (this.queue.length > MAX_ANIMATED) {
      const extra = new Set(edges.slice(0, this.queue.length - MAX_ANIMATED));
      overflow.push(...this.queue.filter((step) => extra.has(step)));
      this.queue = this.queue.filter((step) => !extra.has(step));
    }
    // The oldest arrivals appear together, in one gentle fade, without a trip each.
    for (const step of overflow) {
      this.hidden.delete(step.id);
      this.shown.add(step.id);
      if (step.kind === "node") this.revealing.add(step.id);
    }
    const ids = overflow.map((step) => step.id);
    setTimeout(() => {
      for (const id of ids) this.revealing.delete(id);
      this.bump();
    }, 420);
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /** Moves the hand from where it is to `to` (canvas coordinates) over `ms`, following `path`. */
  private travel(to: Point, ms: number, path?: (t: number) => Point) {
    const from = this.last ?? to;
    const geometry = this.geometry;
    const generation = this.generation;
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        if (!this.running || generation !== this.generation) return resolve();
        const t = Math.min(1, (now - start) / ms);
        const at = path ? path(ease(t)) : { x: from.x + (to.x - from.x) * ease(t), y: from.y + (to.y - from.y) * ease(t) };
        const screen = geometry?.screen(at) ?? at;
        this.hand = { ...this.hand, x: screen.x, y: screen.y, visible: true };
        this.last = at;
        if (t < 1) this.frame = requestAnimationFrame(tick);
        else resolve();
      };
      this.frame = requestAnimationFrame(tick);
    });
  }

  private async run() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length) {
        while (this.paused && this.running) await this.wait(120);
        if (!this.running || !this.queue.length) break;
        const step = this.queue[0]!;
        const geometry = this.geometry;
        if (!geometry) {
          await this.wait(80);
          continue;
        }
        if (step.kind === "node") await this.place(step, geometry);
        else await this.connect(step, geometry);
        this.queue.shift();
        this.bump();
      }
    } finally {
      this.running = false;
      if (!this.queue.length) {
        await this.wait(500);
        if (!this.queue.length) this.hand = { ...this.hand, visible: false, pressing: false };
      }
      this.bump();
    }
  }

  private async place(step: Extract<Step, { kind: "node" }>, geometry: Geometry) {
    const rect = geometry.rect(step.id);
    if (!rect) {
      this.reveal(step.id);
      return;
    }
    geometry.follow?.(step.id);
    const spot = { x: rect.x + Math.min(48, rect.width / 3), y: rect.y + Math.min(28, rect.height / 3) };
    this.hand = { ...this.hand, label: "Adding " + step.label };
    await this.travel(spot, travelMs(this.last ?? spot, spot, this.speed));
    this.hand = { ...this.hand, pressing: true };
    this.revealing.add(step.id);
    this.reveal(step.id);
    await this.wait(260 / this.speed);
    this.hand = { ...this.hand, pressing: false };
    setTimeout(() => {
      this.revealing.delete(step.id);
      this.bump();
    }, 420);
  }

  private async connect(step: Extract<Step, { kind: "edge" }>, geometry: Geometry) {
    const a = geometry.rect(step.source);
    const b = geometry.rect(step.target);
    if (!a || !b) {
      this.reveal(step.id);
      return;
    }
    const from = { x: a.x + a.width, y: a.y + a.height / 2 };
    const to = { x: b.x, y: b.y + b.height / 2 };
    this.hand = { ...this.hand, label: "Connecting " + step.label };
    await this.travel(from, travelMs(this.last ?? from, from, this.speed));
    this.hand = { ...this.hand, pressing: true };
    this.drawing.add(step.id);
    this.reveal(step.id);
    await this.travel(to, this.drawMs(), (t) => alongString(from, to, t));
    this.drawing.delete(step.id);
    this.hand = { ...this.hand, pressing: false };
    await this.wait(90 / this.speed);
  }

  private reveal(id: string) {
    this.hidden.delete(id);
    this.shown.add(id);
    this.bump();
  }
}

export const construction = new Construction();
