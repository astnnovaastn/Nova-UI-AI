// The resource lifecycle rules on their own, with a clock the test moves. No Electron, no network.
// Run: node --test tests/desktop-resources.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const { ResourceManager, POLICIES, chooseMode } = require("../desktop/resources.cjs");

const GB = 2 ** 30;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

function setup(system = { totalBytes: 32 * GB, freeBytes: 12 * GB }) {
  const world = { now: 0, system, log: [] };
  const manager = new ResourceManager({ now: () => world.now, system: () => world.system, changed: (id, state) => world.log.push(`${id}:${state}`) });
  /** Adds a page; each one is "used" a second after the last, so the order of use is the order added. */
  const add = (id, traits = {}) => {
    world.now += SECOND;
    const page = { busy: "", memoryMB: 80, refuseSuspend: false, safe: true, calls: [], ...traits };
    manager.register(id, "source page", {
      busy: () => page.busy,
      memoryMB: () => page.memoryMB,
      suspend: async () => (page.calls.push("suspend"), !page.refuseSuspend),
      resume: async () => void page.calls.push("resume"),
      safeToRelease: async () => (page.calls.push("probe"), page.safe),
      release: async () => void page.calls.push("release"),
      revive: async () => void page.calls.push("revive"),
    });
    return page;
  };
  const after = async (ms) => {
    world.now += ms;
    await manager.tick();
  };
  return { world, manager, add, after };
}

test("a hidden page is throttled at once, frozen after the idle wait, and wakes when shown", async () => {
  const { manager, add, after } = setup();
  const page = add("a");
  assert.equal(manager.stateOf("a"), "active");
  await manager.setVisible("a", false);
  assert.equal(manager.stateOf("a"), "background");
  await after(POLICIES.normal.suspendAfter - SECOND);
  assert.equal(manager.stateOf("a"), "background", "not yet idle long enough");
  await after(2 * SECOND);
  assert.equal(manager.stateOf("a"), "suspended");
  await manager.setVisible("a", true);
  assert.equal(manager.stateOf("a"), "active");
  assert.deepEqual(page.calls, ["suspend", "resume"]);
});

test("a visible page is never suspended or released, however long it sits", async () => {
  const { manager, add, after } = setup();
  const page = add("a");
  await after(2 * 60 * MINUTE);
  assert.equal(manager.stateOf("a"), "active");
  assert.deepEqual(page.calls, []);
});

test("only the warm set of recently used hidden pages stays resident", async () => {
  const { manager, add, after } = setup();
  const pages = ["a", "b", "c", "d"].map((id) => add(id));
  for (const id of ["a", "b", "c", "d"]) await manager.setVisible(id, false);
  await after(POLICIES.normal.releaseAfter + SECOND);
  // d and c were used last: they stay, frozen. a and b are released.
  assert.deepEqual(["a", "b", "c", "d"].map((id) => manager.stateOf(id)), ["hibernated", "hibernated", "suspended", "suspended"]);
  assert.ok(pages[0].calls.includes("release") && pages[1].calls.includes("release"));
  assert.ok(!pages[2].calls.includes("release") && !pages[3].calls.includes("release"));
});

test("showing a released page brings it back", async () => {
  const { manager, add, after } = setup();
  add("keep1");
  add("keep2");
  const page = add("old");
  await manager.setVisible("old", false);
  await manager.setVisible("keep1", false);
  await manager.setVisible("keep2", false);
  // keep1 and keep2 were hidden later but used earlier; make "old" the least recently used.
  manager.touch("keep1");
  manager.touch("keep2");
  await after(POLICIES.normal.releaseAfter + SECOND);
  assert.equal(manager.stateOf("old"), "hibernated");
  await manager.setVisible("old", true);
  assert.equal(manager.stateOf("old"), "active");
  assert.equal(page.calls.at(-1), "revive");
});

test("a page with sound is neither frozen nor released", async () => {
  const { manager, add, after } = setup();
  add("x");
  add("y");
  const loud = add("loud", { busy: "audio" });
  await manager.setVisible("loud", false);
  manager.touch("x");
  manager.touch("y");
  await manager.setVisible("x", false);
  await manager.setVisible("y", false);
  await after(POLICIES.normal.releaseAfter + MINUTE);
  assert.equal(manager.stateOf("loud"), "background");
  assert.deepEqual(loud.calls, []);
});

test("a page that would lose something is never released by force", async () => {
  const { manager, add, after } = setup();
  const form = add("form", { safe: false });
  add("x");
  add("y");
  for (const id of ["form", "x", "y"]) await manager.setVisible(id, false);
  await after(POLICIES.normal.releaseAfter + SECOND);
  await after(POLICIES.normal.releaseAfter);
  assert.notEqual(manager.stateOf("form"), "hibernated");
  assert.ok(form.calls.includes("probe") && !form.calls.includes("release"));
  // It was woken to be asked, and put back to sleep.
  assert.equal(manager.stateOf("form"), "suspended");
});

test("a refused freeze is tried once more, then left alone", async () => {
  const { manager, add, after } = setup();
  const page = add("a", { refuseSuspend: true });
  await manager.setVisible("a", false);
  for (let i = 0; i < 6; i++) await after(POLICIES.normal.suspendAfter + SECOND);
  assert.equal(page.calls.filter((call) => call === "suspend").length, 2);
  assert.equal(manager.stateOf("a"), "background");
});

test("an unusually heavy hidden page sleeps sooner, unless it is the most recent", async () => {
  const { manager, add, after } = setup();
  add("heavyOld", { memoryMB: 400 });
  add("heavyRecent", { memoryMB: 400 });
  await manager.setVisible("heavyOld", false);
  await manager.setVisible("heavyRecent", false);
  await after(POLICIES.normal.heavyAfter + SECOND);
  assert.equal(manager.stateOf("heavyOld"), "hibernated");
  assert.equal(manager.stateOf("heavyRecent"), "suspended");
});

test("over the ceiling, the least recently used hidden pages go without waiting", async () => {
  const { manager, add } = setup();
  const ids = ["a", "b", "c", "d", "e", "f"];
  ids.forEach((id) => add(id));
  for (const id of ids.slice(0, 5)) await manager.setVisible(id, false);
  await manager.tick();
  const resident = ids.filter((id) => manager.stateOf(id) !== "hibernated");
  assert.equal(resident.length, POLICIES.normal.maxResident);
  assert.deepEqual(resident, ["c", "d", "e", "f"]);
});

test("under critical memory pressure every hidden page is released at once", async () => {
  const { world, manager, add } = setup();
  add("a");
  add("b");
  add("shown");
  await manager.setVisible("a", false);
  await manager.setVisible("b", false);
  world.system = { totalBytes: 16 * GB, freeBytes: 1 * GB };
  await manager.tick();
  assert.equal(manager.mode, "saving");
  assert.equal(manager.pressure, "critical");
  assert.deepEqual(["a", "b", "shown"].map((id) => manager.stateOf(id)), ["hibernated", "hibernated", "active"]);
});

test("the mode follows the computer, and pressure outranks a chosen mode", () => {
  assert.deepEqual(chooseMode({ totalBytes: 64 * GB, freeBytes: 30 * GB }), { mode: "normal", pressure: "none" });
  assert.deepEqual(chooseMode({ totalBytes: 64 * GB, freeBytes: 30 * GB, override: "performance" }), { mode: "performance", pressure: "none" });
  assert.deepEqual(chooseMode({ totalBytes: 8 * GB, freeBytes: 2.5 * GB }), { mode: "saving", pressure: "warning" });
  assert.deepEqual(chooseMode({ totalBytes: 64 * GB, freeBytes: 1 * GB, override: "performance" }), { mode: "saving", pressure: "critical" });
  assert.deepEqual(chooseMode({ totalBytes: 64 * GB, freeBytes: 30 * GB, override: "nonsense" }), { mode: "normal", pressure: "none" });
});

test("a closed page is forgotten", async () => {
  const { manager, add } = setup();
  add("a");
  manager.unregister("a");
  assert.equal(manager.stateOf("a"), "closed");
  assert.equal(manager.status().resources.length, 0);
});
