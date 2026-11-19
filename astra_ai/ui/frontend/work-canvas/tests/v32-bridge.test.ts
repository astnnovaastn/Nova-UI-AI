import { describe, expect, it } from "vitest";
import { bridge, snapshot, tabView, PROFILE } from "../src/native/zephium-bridge.svelte";
import { TabProjectionModel } from "../upstream/src/domain/tabs/tabs-model";
import { browserTabs, type BrowserTab } from "../src/browser-tabs.svelte";
import { focus } from "../src/focus.svelte";

const row = (over: Partial<BrowserTab> = {}): BrowserTab => ({
  id: 100001, url: "https://example.com/a", title: "Example", favicon: "", loading: false, back: true, forward: false,
  error: "", opened: true, download: "", blocked: 0, from: null, held: null, ...over,
});

describe("V32 bridge: Zephium's tab projection from AEGIS tabs", () => {
  it("maps an AEGIS tab onto Zephium's TabView", () => {
    const view = tabView(row());
    expect(view).toMatchObject({ id: "100001", title: "Example", url: "https://example.com/a", content: "web", can_go_back: true, can_go_forward: false, icon: null });
    expect(view.projection_revision).toMatch(/^[0-9a-f]{32}$/);
    expect(tabView(row({ url: "", title: "" })).title).toBe("New tab");
  });

  it("keeps a tab's revision until it changes, so Zephium re-renders only changed rows", () => {
    const first = tabView(row({ id: 7 }));
    expect(tabView(row({ id: 7 })).projection_revision).toBe(first.projection_revision);
    expect(tabView(row({ id: 7, title: "Changed" })).projection_revision > first.projection_revision).toBe(true);
  });

  it("sends snapshots Zephium's own admission model accepts in order", () => {
    const model = new TabProjectionModel();
    const one = snapshot();
    const two = snapshot();
    expect(model.applySnapshot(one as never)).toBe(true);
    expect(model.applySnapshot(two as never)).toBe(true);
    expect(model.applySnapshot(one as never)).toBe(false);
    expect(two.profile).toEqual(PROFILE);
    expect(two.nodes.length).toBe(two.tabs.length);
  });
});

describe("V32 bridge: commands", () => {
  it("settles operations and returns Zephium's engines and site shortcuts", () => {
    expect(bridge("operations_reconcile")).toEqual([]);
    const defaults = bridge("search_shortcut_defaults") as { id: string; search_url: string; suggestions: string | null }[];
    expect(defaults.slice(0, 4).map(row => row.id)).toEqual(["google", "duckduckgo", "bing", "brave"]);
    expect(defaults.map(row => row.id)).toEqual(expect.arrayContaining(["kagi", "wikipedia", "youtube", "github"]));
    expect(defaults.every(row => row.search_url.includes("{query}") && row.suggestions === null)).toBe(true);
  });

  it("reads and writes the search engine through AEGIS's setting", () => {
    expect(bridge("setting_set", { key: "search.engine", value: "duckduckgo" })).toEqual({ operation_id: null, accepted: true });
    expect(browserTabs.engine.id).toBe("duckduckgo");
    expect(bridge("setting_get", { key: "search.engine" })).toBe("duckduckgo");
    expect(bridge("setting_set", { key: "search.engine", value: "nowhere" })).toEqual({ operation_id: null, accepted: false });
    bridge("setting_set", { key: "search.engine", value: "google" });
  });

  it("says site time is not tracked rather than reporting zeros", () => {
    expect(bridge("setting_get", { key: "time.track" })).toBe(null);
    expect(bridge("time_call", { call: { kind: "report", from_hour: 0, bucket_hours: 1, buckets: 24, site: null } })).toEqual({ kind: "error", error: "unavailable" });
  });

  it("turns Browse page commands into AEGIS pages and refuses unknown ones", () => {
    expect(bridge("run_command", { id: "browser.tasks" })).toEqual({ operation_id: null, accepted: true });
    expect(browserTabs.page).toBe("tasks");
    bridge("run_command", { id: "browser.return" });
    expect(browserTabs.page).toBe(null);
    expect(bridge("run_command", { id: "launcher.open" })).toEqual({ operation_id: null, accepted: false });
    expect(bridge("tabs_split", {})).toBeUndefined();
  });

  it("controls focus and reports real finished rounds per day", () => {
    bridge("focus_control", { control: { kind: "start", minutes: 25, breaks: true } });
    expect(focus.session?.minutes).toBe(25);
    bridge("focus_control", { control: { kind: "stop" } });
    expect(focus.session).toBe(null);
    const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000);
    const reply = bridge("time_call", { call: { kind: "focus_days", from_day: today - 1, days: 2 } }) as { kind: string; days: { day: number; sessions: number }[] };
    expect(reply.kind).toBe("focus_days");
    expect(reply.days.map((day) => day.day)).toEqual([today - 1, today]);
  });
});
