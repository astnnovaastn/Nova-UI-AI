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
import { normalizeAddress } from "./browser-address";

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
export function resolveEntry(input: string, setting: EngineSetting): { url: string; search: boolean } | null {
  const text = input.trim();
  if (!text) return null;
  const looksLikeAddress = !/\s/.test(text) && (/^https?:\/\//i.test(text) || /^[^\s/?#]+\.[a-z]{2,}(?::\d+)?([/?#].*)?$/i.test(text));
  if (looksLikeAddress) {
    const address = normalizeAddress(text);
    if (address) return { url: address, search: false };
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
