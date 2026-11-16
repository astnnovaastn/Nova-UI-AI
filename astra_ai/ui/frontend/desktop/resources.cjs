/**
 * The resource lifecycle manager: decides which expensive things stay alive.
 *
 * Anything costly registers here with a few hooks (how to suspend it, how to release it, whether
 * it is busy). The manager knows what the person can see and how much memory the computer has to
 * spare, and moves each resource through:
 *
 *   active      shown to the person; never touched
 *   background  hidden; the engine throttles it at once, state fully kept
 *   suspended   hidden and idle; frozen (no CPU), state fully kept, resumes instantly
 *   hibernated  released (no memory); enough is remembered to bring it back
 *   closed      gone
 *
 * The rules follow Zephium's view lifecycle (crates/zephium-app/src/shell/view_lifecycle.rs):
 * hidden pages are suspended after a short idle; only a small warm set of the most recently used
 * hidden pages stays resident; an unusually heavy page sleeps sooner; and a page that is busy or
 * would lose something is never released by force.
 *
 * This file is plain logic with no Electron in it, so it is tested on its own
 * (tests/desktop-resources.test.cjs). `desktop/main.cjs` supplies the hooks.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * warm: hidden resources kept resident for instant return.
 * suspendAfter: hidden this long, then frozen.
 * releaseAfter: hidden this long and outside the warm set, then released.
 * heavyMB / heavyAfter: a hidden resource this large is released sooner, unless it is the most recent.
 * maxResident: ceiling on resident (not hibernated) resources, visible ones included.
 */
const POLICIES = {
  saving: { warm: 0, suspendAfter: 10 * SECOND, releaseAfter: 45 * SECOND, heavyMB: 160, heavyAfter: 45 * SECOND, maxResident: 2 },
  normal: { warm: 2, suspendAfter: 30 * SECOND, releaseAfter: 5 * MINUTE, heavyMB: 256, heavyAfter: 3 * MINUTE, maxResident: 4 },
  performance: { warm: 4, suspendAfter: 60 * SECOND, releaseAfter: 30 * MINUTE, heavyMB: 512, heavyAfter: 10 * MINUTE, maxResident: 8 },
};

/**
 * Which policy fits the computer right now. `pressure` is "none", "warning" or "critical".
 * Left to itself the app is "normal" and drops to "saving" when memory runs short. "performance"
 * keeps more pages warm and is only ever chosen by the person (`resourceMode` in desktop.json):
 * spare memory is not a reason to hold on to pages nobody is looking at.
 */
function chooseMode({ totalBytes, freeBytes, override = "" }) {
  const GB = 2 ** 30;
  const share = totalBytes > 0 ? freeBytes / totalBytes : 1;
  const pressure = freeBytes < 1.5 * GB || share < 0.08 ? "critical" : freeBytes < 3 * GB || share < 0.18 ? "warning" : "none";
  // Real pressure outranks a chosen mode: a page kept warm is not worth the computer swapping.
  if (pressure !== "none") return { mode: "saving", pressure };
  return { mode: POLICIES[override] ? override : "normal", pressure };
}

class ResourceManager {
  /**
   * @param {object} host
   * @param {() => number} host.now            milliseconds
   * @param {() => object} host.system         { totalBytes, freeBytes, override }
   * @param {(id, state) => void} [host.changed]
   * @param {number} [host.scale]              shrinks every wait, for tests
   */
  constructor(host) {
    this.host = host;
    this.scale = host.scale > 0 ? host.scale : 1;
    this.resources = new Map();
    this.mode = "normal";
    this.pressure = "none";
    this.busy = false;
  }

  /**
   * hooks: {
   *   busy(): string | ""        why it must keep running ("audio", "loading"), or ""
   *   memoryMB(): number
   *   suspend(): Promise<boolean>   freeze; false if refused
   *   resume(): Promise<void>
   *   safeToRelease(): Promise<boolean>   false if releasing would lose something (an unsaved form)
   *   release(): Promise<void>     free it, remembering how to bring it back
   *   revive(): Promise<void>
   * }
   */
  register(id, kind, hooks) {
    const now = this.host.now();
    this.resources.set(id, { id, kind, hooks, visible: true, state: "active", lastUsed: now, hiddenAt: 0, refusals: 0, retryAt: 0, protectedUntil: 0 });
  }

  unregister(id) {
    const resource = this.resources.get(id);
    if (!resource) return;
    resource.state = "closed";
    this.resources.delete(id);
  }

  stateOf(id) {
    return this.resources.get(id)?.state ?? "closed";
  }

  #set(resource, state) {
    if (resource.state === state) return;
    resource.state = state;
    this.host.changed?.(resource.id, state);
  }

  /** The person is using it (clicked into it, typed an address). */
  touch(id) {
    const resource = this.resources.get(id);
    if (resource) resource.lastUsed = this.host.now();
  }

  /** Shown or hidden. Showing wakes it at once, whatever state it was in. */
  async setVisible(id, visible) {
    const resource = this.resources.get(id);
    if (!resource || resource.visible === visible) return;
    const now = this.host.now();
    resource.visible = visible;
    if (!visible) {
      resource.hiddenAt = now;
      resource.refusals = 0;
      resource.retryAt = 0;
      if (resource.state === "active") this.#set(resource, "background");
      return;
    }
    resource.lastUsed = now;
    const was = resource.state;
    this.#set(resource, "active");
    if (was === "suspended") await resource.hooks.resume();
    else if (was === "hibernated") await resource.hooks.revive();
    // Bringing one back may put the app over its ceiling; make room among the hidden ones.
    void this.tick();
  }

  async #suspend(resource, now, policy) {
    if (resource.state !== "background" || now < resource.retryAt || resource.refusals >= 2) return;
    if (now - resource.hiddenAt < policy.suspendAfter * this.scale) return;
    if (resource.hooks.busy()) return;
    const frozen = await resource.hooks.suspend().catch(() => false);
    if (resource.visible || resource.state !== "background") {
      // Shown again while the request was in flight.
      if (frozen) await resource.hooks.resume().catch(() => {});
      return;
    }
    if (frozen) this.#set(resource, "suspended");
    else {
      // Asked once more after the same wait; refused twice, it runs until shown (as Zephium does).
      resource.refusals++;
      resource.retryAt = now + policy.suspendAfter * this.scale;
    }
  }

  async #release(resource, now) {
    if (resource.visible || resource.state === "hibernated" || now < resource.protectedUntil) return false;
    const guard = (ms) => {
      resource.protectedUntil = now + ms * this.scale;
      return false;
    };
    if (resource.hooks.busy()) return guard(MINUTE);
    // A frozen page cannot answer the safety question; wake it for the moment of asking.
    const wasSuspended = resource.state === "suspended";
    if (wasSuspended) await resource.hooks.resume().catch(() => {});
    const safe = await resource.hooks.safeToRelease().catch(() => false);
    if (resource.visible) return false;
    if (!safe) {
      if (wasSuspended && (await resource.hooks.suspend().catch(() => false))) return guard(5 * MINUTE);
      if (wasSuspended) this.#set(resource, "background");
      return guard(5 * MINUTE);
    }
    await resource.hooks.release();
    this.#set(resource, "hibernated");
    return true;
  }

  /** One pass of the rules. Called on a timer, and whenever something is shown or opened. */
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      const { mode, pressure } = chooseMode(this.host.system());
      this.mode = mode;
      this.pressure = pressure;
      const policy = POLICIES[mode];
      const now = this.host.now();
      const all = [...this.resources.values()];
      // Most recently used first.
      const hidden = all.filter((resource) => !resource.visible && resource.state !== "hibernated").sort((a, b) => b.lastUsed - a.lastUsed);

      for (const resource of hidden) await this.#suspend(resource, now, policy);

      const idle = (resource) => now - resource.hiddenAt;
      for (const [index, resource] of hidden.entries()) {
        const cold = index >= policy.warm;
        const grace = pressure === "critical" ? 0 : policy.releaseAfter * this.scale;
        if (cold && idle(resource) >= grace) await this.#release(resource, now);
        else if (index > 0 && idle(resource) >= policy.heavyAfter * this.scale && resource.hooks.memoryMB() >= policy.heavyMB) await this.#release(resource, now);
      }

      // Over the ceiling: the least recently used hidden ones go first, without waiting.
      const resident = () => [...this.resources.values()].filter((resource) => resource.state !== "hibernated").length;
      for (const resource of [...hidden].reverse()) {
        if (resident() <= policy.maxResident) break;
        await this.#release(resource, now);
      }
    } finally {
      this.busy = false;
    }
  }

  status() {
    return {
      mode: this.mode,
      pressure: this.pressure,
      policy: POLICIES[this.mode],
      resources: [...this.resources.values()].map((resource) => ({ id: resource.id, kind: resource.kind, state: resource.state, visible: resource.visible, memoryMB: resource.state === "hibernated" ? 0 : resource.hooks.memoryMB() })),
    };
  }
}

module.exports = { ResourceManager, POLICIES, chooseMode };
