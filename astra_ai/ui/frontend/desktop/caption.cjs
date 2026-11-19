/**
 * V35 caption reveal decision (pure; main.cjs polls the pointer and paints the real Windows caption buttons).
 *
 * The buttons stay native (titleBarOverlay): Snap layouts, Alt+Space, keyboard, screen readers and double-click
 * keep working, and they can always be clicked. At rest their symbols are almost the colour of the surface under
 * them; they come up to full contrast when the pointer approaches the top-right corner and stay up while it is in
 * the corner band or where the Snap flyout opens, then fade a moment after it leaves.
 *
 * V35 changes from V33: no window-focus requirement (an unfocused AEGIS still reveals its buttons on approach,
 * as Windows lets them be clicked), a real approach zone instead of a 10 px edge, and a short dwell only to
 * ignore a pointer passing straight through.
 */
const ZONE = {
  /** Windows' three caption buttons: 46 DIP each, 36 tall here. */
  buttons: 138, height: 36,
  /** Where the pointer counts as approaching the controls. */
  approachRight: 240, approachTop: 64,
  /** Where revealed controls stay up (the corner band). */
  holdRight: 280, holdTop: 104,
  /** The Snap layouts flyout hangs below Maximize (the middle button). */
  snap: 220,
  dwell: 60, linger: 600,
};

/**
 * One poll. `now` is { inside, fromRight, fromTop, visible, fullscreen, elapsed }; `prev` is { shown, armed, away }.
 * Returns the next { shown, armed, away, delay }.
 */
function decide(prev, now) {
  const next = { shown: prev.shown, armed: prev.armed, away: prev.away, delay: 80 };
  if (!now.visible || now.fullscreen) return { shown: false, armed: 0, away: 0, delay: 250 };
  const { inside, fromRight: r, fromTop: t } = now;
  const onButtons = inside && r <= ZONE.buttons && t <= ZONE.height;
  const approaching = inside && r <= ZONE.approachRight && t <= ZONE.approachTop;
  const snap = inside && r >= 46 - ZONE.snap && r <= 92 + ZONE.snap && t <= ZONE.height + ZONE.snap;
  const held = prev.shown && ((inside && r <= ZONE.holdRight && t <= ZONE.holdTop) || snap);
  if (onButtons) Object.assign(next, { shown: true, armed: 0, away: 0 });
  else if (held) next.away = 0;
  else if (approaching) { next.away = 0; next.armed += now.elapsed; if (next.armed >= ZONE.dwell) next.shown = true; }
  else { next.armed = 0; if (prev.shown && (next.away += now.elapsed) >= ZONE.linger) next.shown = false; }
  const near = inside && r <= ZONE.holdRight + 160 && t <= ZONE.holdTop + 120;
  next.delay = near || next.shown ? 30 : 90;
  return next;
}

module.exports = { decide, ZONE };
