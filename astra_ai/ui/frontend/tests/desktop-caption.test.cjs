// V35: the caption reveal decision (desktop/caption.cjs), without moving the real pointer.
const test = require("node:test");
const assert = require("node:assert");
const { decide, ZONE } = require("../desktop/caption.cjs");
const rest = { shown: false, armed: 0, away: 0 };
const at = (fromRight, fromTop, extra = {}) => ({ inside: true, fromRight, fromTop, elapsed: 30, visible: true, fullscreen: false, ...extra });
const run = (state, input, n) => { for (let i = 0; i < n; i++) state = decide(state, input); return state; };

test("on the buttons the symbols come up at once, focused or not", () => {
  assert.equal(decide(rest, at(60, 10)).shown, true);
});
test("approaching the corner reveals after a short dwell, passing through does not", () => {
  assert.equal(decide(rest, at(200, 40)).shown, false);
  assert.equal(run(rest, at(200, 40), 3).shown, true);
});
test("far from the corner nothing is revealed", () => {
  assert.equal(run(rest, at(600, 300), 20).shown, false);
});
test("revealed controls stay while the pointer is in the corner band or the Snap flyout", () => {
  const up = { shown: true, armed: 0, away: 0 };
  assert.equal(run(up, at(260, 90), 40).shown, true);
  assert.equal(run(up, at(150, 200), 40).shown, true);
});
test("they fade a moment after the pointer leaves, not at once", () => {
  const up = { shown: true, armed: 0, away: 0 };
  assert.equal(run(up, at(900, 500), 5).shown, true);
  assert.equal(run(up, at(900, 500), Math.ceil(ZONE.linger / 30) + 1).shown, false);
});
test("fullscreen and minimised windows keep them quiet", () => {
  assert.equal(decide({ shown: true, armed: 0, away: 0 }, at(60, 10, { fullscreen: true })).shown, false);
  assert.equal(decide(rest, at(60, 10, { visible: false })).shown, false);
});
