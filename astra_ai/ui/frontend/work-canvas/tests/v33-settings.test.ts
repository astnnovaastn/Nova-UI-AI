import { describe, expect, it, vi } from "vitest";

// Settings are kept in the window's storage; Node has none without a file, so the test gives it one.
vi.hoisted(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, String(v)), removeItem: (k: string) => void data.delete(k), clear: () => data.clear() } });
});
import { bridge } from "../src/native/zephium-bridge.svelte";
import { browserSettings, cleanSettings, DEFAULT_SETTINGS } from "../src/browser-settings.svelte";
import { focus } from "../src/focus.svelte";
import { GROUPS, SECTIONS, searchSections, settingsView } from "../src/settings/settings-view.svelte";
import { dueCounts } from "../src/today-tasks.svelte";

describe("V33 unified Settings: sections and search", () => {
  it("offers every old setting's home, each section in a group", () => {
    const ids = SECTIONS.map((section) => section.id);
    // V31 browser settings, the dashboard panel's sections, and the new Tasks and Accounts pages.
    for (const id of ["search", "appearance", "tabs", "privacy", "permissions", "downloads", "focus", "accounts", "ai", "keys", "voice", "work", "connections", "system", "tasks"]) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set<string>(GROUPS.map((group) => group.id));
    expect(SECTIONS.every((section) => section.group === "identity" || groups.has(section.group))).toBe(true);
  });

  it("finds sections by the words of the rows they hold", () => {
    expect(searchSections("tavily").map((s) => s.id)).toEqual(["keys"]);
    expect(searchSections("research writer").map((s) => s.id)).toContain("ai");
    expect(searchSections("oauth").map((s) => s.id)).toEqual(["accounts"]);
    expect(searchSections("").length).toBe(0);
    expect(searchSections("nothing-like-this").length).toBe(0);
  });

  it("opens at a section and closes again (web: over the workspace)", () => {
    settingsView.open("keys");
    expect(settingsView.isOpen).toBe(true);
    expect(settingsView.section).toBe("keys");
    settingsView.open("not-a-section");
    expect(settingsView.section).toBe("keys");
    settingsView.close();
    expect(settingsView.isOpen).toBe(false);
  });
});

describe("V33 focus: breaks are a kept setting, read by Zephium's Focus card", () => {
  it("defaults to Zephium's default (no breaks) and survives a damaged value", () => {
    expect(DEFAULT_SETTINGS.focus.breaks).toBe(false);
    expect(cleanSettings({ focus: { breaks: "yes" } }).focus.breaks).toBe(false);
    expect(cleanSettings({ focus: { breaks: true } }).focus.breaks).toBe(true);
  });

  it("reads and writes focus.breaks through the bridge, and a start without breaks uses the setting", () => {
    expect(bridge("setting_set", { key: "focus.breaks", value: "true" })).toEqual({ operation_id: null, accepted: true });
    expect(browserSettings.value.focus.breaks).toBe(true);
    expect(bridge("setting_get", { key: "focus.breaks" })).toBe("true");
    expect(bridge("setting_set", { key: "focus.breaks", value: "maybe" })).toEqual({ operation_id: null, accepted: false });
    bridge("focus_control", { control: { kind: "start", minutes: 25 } });
    expect(focus.session?.breaks).toBe(true);
    bridge("focus_control", { control: { kind: "start", minutes: 25, breaks: false } });
    expect(focus.session?.breaks).toBe(false);
    bridge("focus_control", { control: { kind: "stop" } });
    expect(focus.session).toBeNull();
    bridge("setting_set", { key: "focus.breaks", value: "false" });
  });

  it("refuses a pause: Zephium's focus model has none", () => {
    expect(bridge("focus_control", { control: { kind: "pause" } })).toEqual({ operation_id: null, accepted: false });
  });
});

describe("V33 tasks: one list, counted the same everywhere", () => {
  it("counts only open tasks with a due date", () => {
    const rows = [
      { id: "a", status: "open", dueDate: "2026-11-19" },
      { id: "b", status: "done", dueDate: "2026-11-19" },
      { id: "c", status: "open", dueDate: "2026-11-18" },
      { id: "d", status: "open", dueDate: null },
      { id: "e", status: "open", dueDate: "2026-11-19", trashed: true },
    ];
    expect(dueCounts(rows, "2026-11-19")).toEqual({ today: 1, overdue: 1 });
  });
});
