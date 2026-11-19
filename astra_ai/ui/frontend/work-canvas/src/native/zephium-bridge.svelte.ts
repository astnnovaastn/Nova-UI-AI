/**
 * V32: answers the native commands of the Zephium Browse components AEGIS vendors unchanged
 * (EngineMenu, ModeTabs, TabRow, TimePage) from AEGIS's own state, and sends their native events
 * (`zephium:items`, `zephium:favicons`, `zephium:focus`, `zephium:ui-command`) the way Zephium's
 * Rust shell would. Nothing here pretends a native effect happened: a command either acts on AEGIS
 * state or returns `undefined` so the shim reports it as unavailable.
 *
 * Sources: shared/ipc/bindings.ts (command and view shapes), domain/tabs/tabs-model.ts (snapshot
 * admission), domain/surface/surface.svelte.ts ("browser.<page>" commands), domain/time/focus.svelte.ts.
 */
import { browserHost, desktopWork } from "../browser-host";
import { browserTabs, type BrowserTab } from "../browser-tabs.svelte";
import { DEFAULT_SHORTCUTS, ENGINES, type EngineId } from "../search-engines";
import { focus, type FocusSession } from "../focus.svelte";
import { browserSettings } from "../browser-settings.svelte";
import { settingsView } from "../settings/settings-view.svelte";
import { newTabSearchCommand } from "./newtab-search";

export const PROFILE = { id: "aegis-local", name: "AEGIS", kind: "default" as const };
const ACCEPTED = { operation_id: null, accepted: true };
const DAY_MS = 86_400_000;

let revision = 0;
const nextRevision = () => (++revision).toString(16).padStart(32, "0");
// Sent on a microtask: Zephium's stores call flushSync on some events, which Svelte refuses inside an effect.
const emit = (name: string, detail: unknown) => queueMicrotask(() => window.dispatchEvent(new CustomEvent(name, { detail })));

/** Zephium's id is a string; AEGIS tab ids are numbers. */
const tabId = (id: unknown) => Number(id);
const tabRevisions = new Map<number, { key: string; revision: string }>();

export function tabView(tab: BrowserTab) {
  const key = JSON.stringify([tab.title, tab.url, tab.loading, tab.back, tab.forward, tab.icon ? tab.icon.slice(-24) : null, tab.error, tab.media]);
  const held = tabRevisions.get(tab.id);
  const rev = held?.key === key ? held.revision : nextRevision();
  tabRevisions.set(tab.id, { key, revision: rev });
  return {
    id: String(tab.id),
    projection_revision: rev,
    title: tab.title || (tab.url ? hostOf(tab.url) : "New tab"),
    url: tab.url || null,
    content: "web" as const,
    loading: tab.loading,
    can_go_back: tab.back,
    can_go_forward: tab.forward,
    audio: (tab.media?.audible || tab.media?.muted) ? { muted: tab.media.muted, can_mute: Boolean(browserHost.media) } : null,
    icon: tab.icon && tab.url ? { origin: originOf(tab.url), revision: String(tab.icon.length) + tab.icon.slice(-8) } : null,
  };
}

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
const originOf = (url: string) => { try { return new URL(url).origin; } catch { return url; } };

export function snapshot() {
  const tabs = browserTabs.tabs.map(tabView);
  return {
    projection_revision: nextRevision(),
    profile: PROFILE,
    spaces: [{ id: "aegis-space", name: "Browse", icon: null, color: 210, theme: null, tabs: tabs.length, previews: [] }],
    active_space_id: "aegis-space",
    nodes: tabs.map((tab) => ({ id: `node-${tab.id}`, parent_id: null, section: "today" as const, kind: { type: "tab" as const, tab_id: tab.id } })),
    tabs,
    active: typeof browserTabs.active === "number" ? String(browserTabs.active) : null,
    split_group: null,
  };
}

/** Publishes the tab list, favicons and the surface whenever AEGIS's tab state changes. */
export function startBridge(): () => void {
  return $effect.root(() => {
    $effect(() => {
      const items = snapshot();
      emit("zephium:items", items);
      const entries = browserTabs.tabs
        .filter((tab) => tab.icon && tab.url)
        .map((tab) => ({ origin: originOf(tab.url), revision: String(tab.icon!.length) + tab.icon!.slice(-8), rgba: tab.icon! }));
      if (entries.length) emit("zephium:favicons", { surface: "chrome", profile_id: PROFILE.id, entries });
    });
    $effect(() => {
      const page = browserTabs.page ?? (browserTabs.active === "work" ? "work" : null);
      emit("zephium:ui-command", `browser.${page ?? "return"}`);
    });
    $effect(() => {
      emit("zephium:focus", { session: focusView(focus.session), shut: [] });
    });
    // V33: a setting changed in AEGIS's Settings reaches Zephium's preference store the way its Rust shell
    // announces one ("preference.<key>=<value>"), so an open Focus page or engine menu shows it at once.
    const sent = new Map<string, string>();
    $effect(() => {
      void browserSettings.value;
      void browserTabs.engine.id;
      for (const key of ECHOED) {
        const value = settingGet(key) ?? "";
        if (sent.get(key) === value) continue;
        const first = !sent.has(key);
        sent.set(key, value);
        if (!first) emit("zephium:ui-command", `preference.${key}=${value}`);
      }
    });
  });
}

const ECHOED = ["search.engine", "focus.minutes", "focus.goal", "focus.breaks", "focus.blocked"] as const;

function focusView(session: FocusSession | null) {
  if (!session) return null;
  return {
    phase: session.phase,
    started_at: session.startedAt,
    phase_started_at: session.phaseStartedAt,
    phase_ends_at: session.phaseEndsAt,
    minutes: session.minutes,
    breaks: session.breaks,
    break_minutes: session.breakMinutes,
    long_break_minutes: session.longBreakMinutes,
    rounds: session.rounds,
    focused: session.focused,
    allowed: session.allowed,
  };
}

/** Zephium's local day number (time-model.ts localDay) for an AEGIS "YYYY-MM-DD" key. */
function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY_MS);
}

/** Settings Zephium reads that AEGIS answers. Anything else reads as unset (Zephium's default). */
function settingGet(key: string): string | null {
  switch (key) {
    // SearXNG and a custom engine stay AEGIS settings; Zephium's menu then marks none of its four.
    case "search.engine": return browserTabs.engine.id;
    case "search.shortcuts": return browserTabs.shortcutPreference;
    // Left at Zephium's default so the Focus card shows; the site report itself answers "unavailable" below.
    case "time.track": return null;
    case "focus.goal": return String(browserSettings.value.focus.goal);
    case "focus.minutes": return String(browserSettings.value.focus.minutes);
    // V33: whether a break follows each round, kept with AEGIS's focus settings.
    case "focus.breaks": return String(browserSettings.value.focus.breaks);
    // Zephium's "Shut during focus" list, one site per line; AEGIS keeps it as its focus sites.
    case "focus.blocked": return browserSettings.value.focus.holdSites ? browserSettings.value.focus.sites.join("\n") : "";
    default: return null;
  }
}

function settingSet(key: string, value: string) {
  if (key === "search.shortcuts") {
    return browserTabs.setShortcuts(value) ? ACCEPTED : { operation_id: null, accepted: false };
  }
  if (key === "search.engine" && ENGINES.some((engine) => engine.id === value)) {
    browserTabs.setEngine({ ...browserTabs.engine, id: value as EngineId });
    return ACCEPTED;
  }
  if (key === "focus.goal" || key === "focus.minutes") {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return { operation_id: null, accepted: false };
    browserSettings.update((draft) => { draft.focus[key === "focus.goal" ? "goal" : "minutes"] = Math.round(number); });
    return ACCEPTED;
  }
  if (key === "focus.breaks" && (value === "true" || value === "false")) {
    browserSettings.update((draft) => { draft.focus.breaks = value === "true"; });
    return ACCEPTED;
  }
  if (key === "focus.blocked") {
    const sites = value.split("\n").map((site) => site.trim().toLowerCase()).filter(Boolean).slice(0, 50);
    browserSettings.update((draft) => { draft.focus.sites = sites; draft.focus.holdSites = sites.length > 0; });
    return ACCEPTED;
  }
  return { operation_id: null, accepted: false };
}

/** Returns the answer, or `undefined` when the command is not one this bridge serves. */
/**
 * V34: Zephium's Work folder commands (WorkStart "Choose a folder", AskCard's folder panel) open the desktop's own
 * dialog, which also records the grant the backend reads. Before V34 these threw "not available", so the picker
 * silently did nothing. A drop (`work_admit_folder`) cannot be granted without the dialog, so it is refused.
 */
async function pickFolder(): Promise<{ kind: "admitted"; path: string; name: string } | null> {
  const granted = await desktopWork.selectFolder({ title: "Choose a project folder for AEGIS Work" });
  if (!granted) return null;
  window.dispatchEvent(new CustomEvent("aegis-dev-grants-changed"));
  return { kind: "admitted", path: granted.path, name: granted.title };
}

export function bridge(command: string, args: Record<string, unknown> = {}): unknown {
  switch (command) {
    case "work_pick_folder":
    case "work_choose_folder":
      return desktopWork.available ? pickFolder() : undefined;
    case "work_admit_folder":
      return desktopWork.available ? { kind: "refused", not_a_folder: false } : undefined;
    case "operations_reconcile": return [];
    case "operation_status": return { state: "unknown" };
    case "operation_acknowledge": return true;
    case "newtab_search_context":
    case "newtab_search":
    case "newtab_run":
    case "newtab_cancel":
      return newTabSearchCommand(command, args);
    case "search_shortcut_defaults": return DEFAULT_SHORTCUTS;
    case "setting_get": return settingGet(String(args.key));
    case "setting_set": return settingSet(String(args.key), String(args.value));
    case "tabs_bootstrap": queueMicrotask(() => emit("zephium:items", snapshot())); return ACCEPTED;
    case "tabs_open": browserTabs.newTab(); return ACCEPTED;
    case "tabs_activate": browserTabs.page = null; browserTabs.show(tabId(args.id)); return ACCEPTED;
    case "tab_set_muted":
      return browserHost.media?.(tabId(args.id), args.muted === true ? "mute" : "unmute")
        .then(() => ACCEPTED) ?? { operation_id: null, accepted: false };
    case "tabs_close": browserTabs.close(tabId(args.id)); return ACCEPTED;
    case "tabs_navigate": return browserTabs.go(tabId(args.id), String(args.input ?? "")) ? ACCEPTED : { operation_id: null, accepted: false };
    case "tabs_back": browserTabs.back(tabId(args.id)); return ACCEPTED;
    case "tabs_forward": browserTabs.forward(tabId(args.id)); return ACCEPTED;
    case "tabs_reload": browserTabs.reload(tabId(args.id)); return ACCEPTED;
    case "run_command": {
      const name = String(args.id ?? "");
      if (!name.startsWith("browser.")) return { operation_id: null, accepted: false };
      const page = name.slice(8);
      if (page === "work") { browserTabs.page = null; browserTabs.show("work"); }
      else if (page === "return") { browserTabs.page = null; if (browserTabs.active === "work") browserTabs.resume(); }
      else if (page === "settings") settingsView.open();
      else if (page === "tasks" || page === "time") {
        browserTabs.page = page;
        if (browserTabs.active === "work") browserTabs.resume();
      } else return { operation_id: null, accepted: false };
      return ACCEPTED;
    }
    case "focus_control": {
      const control = args.control as { kind: string; minutes?: number; breaks?: boolean; site?: string };
      if (control?.kind === "start") focus.start(Number(control.minutes) || browserSettings.value.focus.minutes, typeof control.breaks === "boolean" ? control.breaks : browserSettings.value.focus.breaks);
      else if (control?.kind === "stop") focus.stop();
      else if (control?.kind === "skip") focus.skip();
      else if (control?.kind === "allow" && control.site) focus.allow(control.site);
      else return { operation_id: null, accepted: false };
      return ACCEPTED;
    }
    case "time_call": {
      const call = args.call as { kind: string; from_day?: number; days?: number };
      if (call?.kind === "focus_days") {
        const from = Number(call.from_day), count = Math.min(400, Number(call.days) || 0);
        const days = Array.from({ length: count }, (_, index) => {
          const day = from + index;
          const key = Object.keys(focus.days).find((candidate) => dayNumber(candidate) === day);
          const seconds = key ? focus.days[key]! : 0;
          const rounds = (key && focus.rounds[key]) || { sessions: 0, completed: 0 };
          // Ended rounds only; a running round shows on the Focus card instead.
          return { day, seconds, sessions: rounds.sessions, completed: rounds.completed };
        });
        return { kind: "focus_days", days };
      }
      return { kind: "error", error: "unavailable" };
    }
    default: return undefined;
  }
}
