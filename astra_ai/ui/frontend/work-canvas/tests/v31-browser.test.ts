import { describe, expect, it } from "vitest";
import { advance, breakMinutes, focus, focusedSeconds, localDayKey, type FocusSession } from "../src/focus.svelte";
import { dueCounts } from "../src/today-tasks.svelte";
import { suggest } from "../src/browser-tabs.svelte";
import { cleanSettings, DEFAULT_SETTINGS } from "../src/browser-settings.svelte";

const session = (over: Partial<FocusSession> = {}): FocusSession => ({
  phase: "focus", startedAt: 0, phaseStartedAt: 0, phaseEndsAt: 25 * 60_000, minutes: 25, breaks: true,
  breakMinutes: 5, longBreakMinutes: 15, rounds: 0, focused: 0, allowed: [], ...over,
});

describe("focus (after Zephium's time model)", () => {
  it("sets breaks as Zephium does", () => {
    expect(breakMinutes(25)).toEqual({ short: 5, long: 15 });
    expect(breakMinutes(10)).toEqual({ short: 3, long: 9 });
    expect(breakMinutes(120)).toEqual({ short: 20, long: 30 });
  });

  it("moves round → break → round, with a long break every fourth round", () => {
    let view = session();
    const at = view.phaseEndsAt;
    const first = advance(view, at);
    expect(first.next.phase).toBe("break");
    expect(first.finishedRound).toBe(25 * 60);
    expect(first.next.focused).toBe(25 * 60);
    view = { ...first.next, rounds: 3, phase: "focus", phaseStartedAt: 0, phaseEndsAt: 1000 };
    expect(advance(view, 1000).next.phase).toBe("long_break");
    expect(advance({ ...session(), breaks: false }, 25 * 60_000).next.phase).toBe("focus");
  });

  it("counts the running round", () => {
    expect(focusedSeconds(session({ focused: 60 }), 30_000)).toBe(90);
    expect(focusedSeconds(session({ phase: "break", focused: 60 }), 30_000)).toBe(60);
  });

  it("holds back listed sites only during a focus round, and only when asked", () => {
    focus.start(25, true);
    expect(focus.holds("https://www.youtube.com/watch?v=1", ["youtube.com"], true)).toBe("youtube.com");
    expect(focus.holds("https://m.youtube.com/", ["youtube.com"], true)).toBe("youtube.com");
    expect(focus.holds("https://www.youtube.com/", ["youtube.com"], false)).toBeNull();
    expect(focus.holds("https://example.org/", ["youtube.com"], true)).toBeNull();
    focus.allow("youtube.com");
    expect(focus.holds("https://youtube.com/", ["youtube.com"], true)).toBeNull();
    focus.stop();
    expect(focus.holds("https://x.com/", ["x.com"], true)).toBeNull();
  });
});

describe("today's tasks", () => {
  it("counts open tasks due today and overdue, never done ones", () => {
    const day = localDayKey(new Date(2026, 10, 18));
    expect(day).toBe("2026-11-18");
    const rows = [
      { id: "a", status: "open", dueDate: "2026-11-18" },
      { id: "b", status: "done", dueDate: "2026-11-18" },
      { id: "c", status: "active", dueDate: "2026-11-17" },
      { id: "d", status: "open", dueDate: null },
      { id: "e", status: "open", dueDate: "2026-11-19" },
    ];
    expect(dueCounts(rows, day)).toEqual({ today: 1, overdue: 1 });
    expect(dueCounts([], day)).toEqual({ today: 0, overdue: 0 });
  });
});

describe("address suggestions and settings", () => {
  it("suggests from history by every typed word, most visited first", () => {
    const history = [
      { url: "https://docs.python.org/3/", title: "Python docs", at: 1, count: 1 },
      { url: "https://www.python.org/", title: "Welcome to Python.org", at: 2, count: 5 },
      { url: "https://svelte.dev/", title: "Svelte", at: 3, count: 9 },
    ];
    expect(suggest(history, "python").map((v) => v.url)).toEqual(["https://www.python.org/", "https://docs.python.org/3/"]);
    expect(suggest(history, "python docs").map((v) => v.url)).toEqual(["https://docs.python.org/3/"]);
    expect(suggest(history, "")).toEqual([]);
  });

  it("falls back field by field from damaged settings", () => {
    expect(cleanSettings(null)).toEqual(DEFAULT_SETTINGS);
    const cleaned = cleanSettings({ wallpaper: { kind: "image", data: "javascript:alert(1)" }, focus: { minutes: 3, goal: 90, sites: ["ok.com", "not a site"] }, restoreTabs: false });
    expect(cleaned.wallpaper).toEqual({ kind: "sky" });
    expect(cleaned.focus.minutes).toBe(25);
    expect(cleaned.focus.goal).toBe(90);
    expect(cleaned.focus.sites).toEqual(["ok.com"]);
    expect(cleaned.restoreTabs).toBe(false);
    expect(cleanSettings({ wallpaper: { kind: "color", color: "#123456" } }).wallpaper).toEqual({ kind: "color", color: "#123456" });
  });
});
