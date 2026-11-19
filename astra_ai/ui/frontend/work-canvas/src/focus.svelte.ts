/**
 * V31 Focus, after Zephium's (frame/src/domain/time/focus.svelte.ts and time-model.ts, MPL-2.0), where the
 * native side owns the clock. Here the browser window owns it, saved in local storage so a reload or a
 * restart keeps the session:
 *
 *  - a session runs focus rounds of `minutes`; with breaks, a short break follows each round and a long
 *    one every fourth (breakMinutes: as Zephium sets them);
 *  - the day's focused seconds are kept per local day, for the new tab's figure and its goal meter;
 *  - while a focus round runs, sites the person listed can be held back (off by default). "Open anyway"
 *    lets one site through for the rest of the round. Nothing is ever held back without the person's choice.
 *
 * One timer, set for the end of the running phase; nothing ticks while nothing changes.
 */
export type FocusPhase = "focus" | "break" | "long_break";
export type FocusSession = {
  phase: FocusPhase;
  startedAt: number;
  phaseStartedAt: number;
  phaseEndsAt: number;
  minutes: number;
  breaks: boolean;
  breakMinutes: number;
  longBreakMinutes: number;
  rounds: number;
  /** Seconds focused in finished rounds; the running round adds to it. */
  focused: number;
  allowed: string[];
};
type Saved = { session: FocusSession | null; days: Record<string, number>; rounds?: Record<string, { sessions: number; completed: number }> };

const KEY = "aegis-focus-v1";

/** Short and long break minutes for a round length (Zephium time-model.ts breakMinutes). */
export function breakMinutes(minutes: number): { short: number; long: number } {
  const short = Math.min(20, Math.max(3, Math.floor(minutes / 5)));
  return { short, long: Math.min(30, short * 3) };
}

export function localDayKey(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
}

/** Seconds focused in this session up to `now`, the running round included (Zephium focusedSeconds). */
export function focusedSeconds(view: FocusSession, now = Date.now()): number {
  const running = view.phase === "focus" ? Math.max(0, Math.min(now, view.phaseEndsAt) - view.phaseStartedAt) / 1000 : 0;
  return view.focused + running;
}

export function remaining(view: FocusSession, now = Date.now()): number {
  return Math.max(0, (view.phaseEndsAt - now) / 1000);
}

export function progress(view: FocusSession, now = Date.now()): number {
  const length = view.phaseEndsAt - view.phaseStartedAt;
  return length > 0 ? Math.min(1, Math.max(0, (now - view.phaseStartedAt) / length)) : 1;
}

/** The session after the running phase ends at `at`: focus becomes a break (or the next round), a break the next round. */
export function advance(view: FocusSession, at: number): { next: FocusSession; finishedRound: number } {
  if (view.phase === "focus") {
    const finishedRound = Math.max(0, (Math.min(at, view.phaseEndsAt) - view.phaseStartedAt) / 1000);
    const rounds = view.rounds + 1;
    const focused = view.focused + finishedRound;
    if (!view.breaks) return { next: { ...view, rounds, focused, allowed: [], phaseStartedAt: at, phaseEndsAt: at + view.minutes * 60_000 }, finishedRound };
    const long = rounds % 4 === 0;
    const length = long ? view.longBreakMinutes : view.breakMinutes;
    return { next: { ...view, phase: long ? "long_break" : "break", rounds, focused, allowed: [], phaseStartedAt: at, phaseEndsAt: at + length * 60_000 }, finishedRound };
  }
  return { next: { ...view, phase: "focus", phaseStartedAt: at, phaseEndsAt: at + view.minutes * 60_000 }, finishedRound: 0 };
}

function read(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Saved | null;
    if (saved && typeof saved === "object" && saved.days && typeof saved.days === "object") return { session: saved.session ?? null, days: saved.days, rounds: saved.rounds && typeof saved.rounds === "object" ? saved.rounds : {} };
  } catch {
    /* fall through */
  }
  return { session: null, days: {} };
}

class Focus {
  session = $state<FocusSession | null>(null);
  /** Focused seconds per local day, finished rounds only. */
  days = $state<Record<string, number>>({});
  /** Focus rounds per local day (V32, for Zephium's Time page). */
  rounds = $state<Record<string, { sessions: number; completed: number }>>({});
  /** Redrawn once a minute by whoever shows the figure (the new tab's clock); this is only "now". */
  now = $state(Date.now());
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const saved = read();
    this.days = saved.days;
    this.rounds = saved.rounds ?? {};
    this.session = saved.session;
    this.catchUp(Date.now());
  }

  private save() {
    // Thirty days of figures are plenty for a goal meter.
    const keep = Object.keys(this.days).sort().slice(-30);
    try {
      localStorage.setItem(KEY, JSON.stringify({ session: this.session, days: Object.fromEntries(keep.map((d) => [d, this.days[d]])), rounds: Object.fromEntries(keep.filter((d) => this.rounds[d]).map((d) => [d, this.rounds[d]])) }));
    } catch {
      /* storage blocked: the session lasts until the window closes */
    }
  }

  /** `completed`: the round ran to its end, not stopped or skipped (Zephium FocusDayView.completed). */
  private credit(seconds: number, at: number, completed = false) {
    if (seconds <= 0) return;
    const day = localDayKey(new Date(at));
    this.days = { ...this.days, [day]: (this.days[day] ?? 0) + seconds };
    const held = this.rounds[day] ?? { sessions: 0, completed: 0 };
    this.rounds = { ...this.rounds, [day]: { sessions: held.sessions + 1, completed: held.completed + (completed ? 1 : 0) } };
  }

  /** Phases that ended while the app was closed or the window slept are applied in order. */
  private catchUp(now: number) {
    let guard = 0;
    while (this.session && this.session.phaseEndsAt <= now && guard++ < 500) {
      const ended = this.session.phaseEndsAt;
      const { next, finishedRound } = advance(this.session, ended);
      this.credit(finishedRound, ended, true);
      this.session = next;
      this.announce(next);
    }
    this.save();
    this.schedule();
  }

  private schedule() {
    clearTimeout(this.timer);
    if (!this.session) return;
    this.timer = setTimeout(() => this.catchUp(Date.now()), Math.max(250, this.session.phaseEndsAt - Date.now() + 50));
  }

  private announce(view: FocusSession) {
    // Only when the person already allowed AEGIS's notifications; never asked for here.
    if (typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState === "visible") return;
    try {
      new Notification(view.phase === "focus" ? "Focus round started" : "Time for a break", { body: view.phase === "focus" ? `${view.minutes} minutes` : `Round ${view.rounds} done`, silent: true });
    } catch {
      /* not available in this window */
    }
  }

  start(minutes: number, breaks = true, now = Date.now()) {
    const { short, long } = breakMinutes(minutes);
    this.session = { phase: "focus", startedAt: now, phaseStartedAt: now, phaseEndsAt: now + minutes * 60_000, minutes, breaks, breakMinutes: short, longBreakMinutes: long, rounds: 0, focused: 0, allowed: [] };
    this.save();
    this.schedule();
  }

  /** Ends the session; the running round's focused time counts. */
  stop(now = Date.now()) {
    if (!this.session) return;
    if (this.session.phase === "focus") this.credit(Math.max(0, (Math.min(now, this.session.phaseEndsAt) - this.session.phaseStartedAt) / 1000), now);
    this.session = null;
    clearTimeout(this.timer);
    this.save();
  }

  /** Ends the running phase now (a break cut short, or a round finished early). */
  skip(now = Date.now()) {
    if (!this.session) return;
    const { next, finishedRound } = advance({ ...this.session, phaseEndsAt: Math.min(now, this.session.phaseEndsAt) }, now);
    this.credit(finishedRound, now);
    this.session = next;
    this.save();
    this.schedule();
  }

  /** Lets one held-back site through for the rest of this round. */
  allow(site: string) {
    if (!this.session || this.session.allowed.includes(site)) return;
    this.session = { ...this.session, allowed: [...this.session.allowed, site] };
    this.save();
  }

  /** The site a running focus round holds back for this address, or null. */
  holds(url: string, sites: readonly string[], enabled: boolean): string | null {
    if (!enabled || !this.session || this.session.phase !== "focus") return null;
    let host = "";
    try {
      host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return null;
    }
    const site = sites.find((entry) => host === entry || host.endsWith("." + entry));
    return site && !this.session.allowed.includes(site) ? site : null;
  }

  /** Seconds focused today: finished rounds plus the running one. */
  today(now = this.now): number {
    const day = localDayKey(new Date(now));
    return (this.days[day] ?? 0) + (this.session ? focusedSeconds(this.session, now) - this.session.focused : 0);
  }
}

export const focus = new Focus();
