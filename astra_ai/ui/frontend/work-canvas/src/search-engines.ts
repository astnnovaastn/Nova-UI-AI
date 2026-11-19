/**
 * V30: what the address bar of a browser tab does with what the person types.
 *
 * An address goes to that page. Anything else is a search with the person's chosen engine, opened as
 * that engine's ordinary results page in the tab, exactly as any browser does. This is the person
 * browsing; it is never used by AEGIS agents, which search only through permitted APIs (free_search.py).
 *
 * Engines follow Zephium's set (zephium-core/src/search.rs: DuckDuckGo, Google, Bing, Brave, custom
 * template), plus a self-hosted SearXNG address.
 */
import type { SearchShortcut } from "$shared/ipc/bindings";
import { shortcutFor, withShortcut } from "$shared/lib/search-shortcuts";
import shortcuts from "../upstream/search-shortcuts.json";
import { normalizeAddress } from "./browser-address";

export const DEFAULT_SHORTCUTS: SearchShortcut[] = shortcuts.map((entry) => ({ ...entry, suggestions: null }));

export function knownSiteMark(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "youtu.be" || host === "m.youtube.com") return "youtube";
    if (host === "mail.google.com") return null;
    return DEFAULT_SHORTCUTS.find(item => item.domain.replace(/^www\./, "") === host)?.id ?? null;
  } catch {
    return null;
  }
}

/** Verify profile preferences before they can supply a navigation target. */
export function parseShortcuts(raw: string): SearchShortcut[] | null {
  if (raw.length > 96_000) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(parsed) || parsed.length > 128) return null;
  const ids = new Set<string>();
  const keywords = new Set<string>();
  const result: SearchShortcut[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry.id !== "string" || !/^[a-z0-9:-]{1,96}$/i.test(entry.id) || ids.has(entry.id) ||
        typeof entry.name !== "string" || !entry.name.trim() || entry.name.length > 80 ||
        !Array.isArray(entry.keywords) || !entry.keywords.length || entry.keywords.length > 8 ||
        typeof entry.enabled !== "boolean" || typeof entry.search_url !== "string" ||
        typeof entry.home_url !== "string" || entry.search_url.length > 2048 ||
        !entry.home_url.startsWith("https://") || !normalizeAddress(entry.home_url)) return null;
    const template = validTemplate(entry.search_url);
    if (!template) return null;
    for (const key of entry.keywords) {
      if (typeof key !== "string" || !/^[a-z0-9_-]{1,32}$/i.test(key) || keywords.has(key.toLowerCase())) return null;
      keywords.add(key.toLowerCase());
    }
    ids.add(entry.id);
    result.push({ id: entry.id, name: entry.name, keywords: entry.keywords, search_url: template,
      home_url: entry.home_url, domain: new URL(entry.home_url).hostname, enabled: entry.enabled, suggestions: null });
  }
  return result;
}

export type EngineId = "google" | "bing" | "duckduckgo" | "brave" | "searxng" | "custom";
export type Engine = { id: EngineId; name: string; template: string };

export const ENGINES: readonly Engine[] = [
  { id: "google", name: "Google", template: "https://www.google.com/search?q={query}" },
  { id: "bing", name: "Bing", template: "https://www.bing.com/search?q={query}" },
  { id: "duckduckgo", name: "DuckDuckGo", template: "https://duckduckgo.com/?q={query}" },
  { id: "brave", name: "Brave Search", template: "https://search.brave.com/search?q={query}" },
];

export type EngineSetting = { id: EngineId; custom?: string; searxng?: string };
export const DEFAULT_ENGINE: EngineSetting = { id: "google" };

/** A custom template must be a public https address with exactly one {query} (or %s) in it. */
export function validTemplate(template: string): string | null {
  const value = template.trim().replace("%s", "{query}");
  if ((value.match(/\{query\}/g) ?? []).length !== 1) return null;
  return normalizeAddress(value.replace("{query}", "aegis")) && value.startsWith("https://") ? value : null;
}

/** A SearXNG instance: its base address; results come from its /search page. */
export function searxngTemplate(base: string): string | null {
  const trimmed = base.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}/search?q={query}`;
  } catch {
    return null;
  }
}

export function templateOf(setting: EngineSetting): string {
  if (setting.id === "custom") return validTemplate(setting.custom ?? "") ?? ENGINES[0]!.template;
  if (setting.id === "searxng") return searxngTemplate(setting.searxng ?? "") ?? ENGINES[0]!.template;
  return (ENGINES.find((engine) => engine.id === setting.id) ?? ENGINES[0]!).template;
}

export function engineName(setting: EngineSetting): string {
  if (setting.id === "custom") return "Custom search";
  if (setting.id === "searxng") return "SearXNG";
  return (ENGINES.find((engine) => engine.id === setting.id) ?? ENGINES[0]!).name;
}

/**
 * The page a typed entry opens: { url, search }. An address (with or without https://) opens as is;
 * a phrase, a single word or anything with spaces is a search.
 */
export function resolveEntry(input: string, setting: EngineSetting, shortcuts: readonly SearchShortcut[] = DEFAULT_SHORTCUTS): { url: string; search: boolean; destination?: string } | null {
  const text = input.trim();
  if (!text) return null;
  const looksLikeAddress = !/\s/.test(text) && (/^https?:\/\//i.test(text) || /^[^\s/?#]+\.[a-z]{2,}(?::\d+)?([/?#].*)?$/i.test(text));
  if (looksLikeAddress) {
    const address = normalizeAddress(text);
    if (address) return { url: address, search: false };
  }
  const shortcut = shortcutFor(text, shortcuts);
  if (shortcut) {
    const query = withShortcut(text, "", shortcuts).trim();
    const template = validTemplate(shortcut.search_url);
    if (!template) return null;
    const encoded = encodeURIComponent(query);
    const url = query ? template.replace("{query}", encoded) : shortcut.home_url;
    return normalizeAddress(url) ? { url, search: Boolean(query), destination: shortcut.name } : null;
  }
  return { url: templateOf(setting).replace("{query}", encodeURIComponent(text).replace(/%20/g, "+")), search: true };
}

/** What the address bar shows for a page: the search words for a results page of the chosen engine, else the address. */
export function displayEntry(url: string, setting: EngineSetting): string {
  const template = templateOf(setting);
  const [before] = template.split("{query}");
  if (before && url.startsWith(before)) {
    const rest = url.slice(before.length).split(/[&#]/)[0] ?? "";
    try {
      return decodeURIComponent(rest.replace(/\+/g, " "));
    } catch {
      return url;
    }
  }
  return url;
}
