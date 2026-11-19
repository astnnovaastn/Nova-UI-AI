import { describe, expect, it } from "vitest";
import { DEFAULT_SHORTCUTS, parseShortcuts, displayEntry, resolveEntry, searxngTemplate, validTemplate } from "../src/search-engines";

describe("search engines (V30 browser tabs)", () => {
  it("opens addresses and searches everything else with the chosen engine", () => {
    expect(resolveEntry("example.org/docs", { id: "google" })).toEqual({ url: "https://example.org/docs", search: false });
    expect(resolveEntry("https://arxiv.org/abs/1", { id: "bing" })).toEqual({ url: "https://arxiv.org/abs/1", search: false });
    expect(resolveEntry("AI robotics research", { id: "duckduckgo" })).toEqual({ url: "https://duckduckgo.com/?q=AI+robotics+research", search: true });
    expect(resolveEntry("svelte", { id: "brave" })?.url).toBe("https://search.brave.com/search?q=svelte");
    expect(resolveEntry("localhost:8340", { id: "google" })?.search).toBe(true);
    expect(resolveEntry("   ", { id: "google" })).toBeNull();
  });

  it("accepts only safe custom and SearXNG templates", () => {
    expect(validTemplate("https://example.org/find?q=%s")).toBe("https://example.org/find?q={query}");
    expect(validTemplate("http://example.org/?q={query}")).toBeNull();
    expect(validTemplate("https://example.org/")).toBeNull();
    expect(searxngTemplate("https://search.example.org/")).toBe("https://search.example.org/search?q={query}");
    expect(resolveEntry("rust async", { id: "custom", custom: "https://example.org/find?q={query}" })?.url).toBe("https://example.org/find?q=rust+async");
    // A broken custom template falls back to the first engine rather than to nothing.
    expect(resolveEntry("x y", { id: "custom", custom: "nope" })?.url).toBe("https://www.google.com/search?q=x+y");
  });

  it("uses enabled Zephium shortcuts without changing the selected engine", () => {
    const setting = { id: "bing" } as const;
    expect(resolveEntry("!yt lunar landing", setting)).toEqual({
      url: "https://www.youtube.com/results?search_query=lunar%20landing", search: true, destination: "YouTube",
    });
    expect(resolveEntry("!w", setting)?.url).toBe("https://en.wikipedia.org/");
    expect(resolveEntry("lunar landing !gh", setting)?.url).toBe("https://github.com/search?q=lunar%20landing");
    const disabled = DEFAULT_SHORTCUTS.map(row => row.id === "youtube" ? { ...row, enabled: false } : row);
    expect(resolveEntry("!yt lunar landing", setting, disabled)?.url).toBe("https://www.bing.com/search?q=!yt+lunar+landing");
    expect(resolveEntry("example.org/?q=!yt", setting)?.url).toBe("https://example.org/?q=!yt");
  });

  it("validates saved shortcut documents before loading them", () => {
    expect(parseShortcuts(JSON.stringify(DEFAULT_SHORTCUTS))).toHaveLength(DEFAULT_SHORTCUTS.length);
    expect(parseShortcuts(JSON.stringify([{ ...DEFAULT_SHORTCUTS[0], search_url: "https://127.0.0.1/?q={query}" }]))).toBeNull();
    expect(parseShortcuts(JSON.stringify([{ ...DEFAULT_SHORTCUTS[0], keywords: ["yt", "YT"] }]))).toBeNull();
  });

  it("shows search words for the engine's own results page", () => {
    expect(displayEntry("https://www.google.com/search?q=AI+robotics&hl=en", { id: "google" })).toBe("AI robotics");
    expect(displayEntry("https://example.org/a", { id: "google" })).toBe("https://example.org/a");
  });
});
