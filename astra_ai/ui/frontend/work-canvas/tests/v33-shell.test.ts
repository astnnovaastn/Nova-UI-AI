import { beforeEach, describe, expect, it } from "vitest";
import { browserTabs, type BrowserTab } from "../src/browser-tabs.svelte";

const row = (id: number, over: Partial<BrowserTab> = {}): BrowserTab => ({
  id, url: `https://example.com/${id}`, title: `Tab ${id}`, favicon: "", loading: false, back: false, forward: false,
  error: "", opened: false, download: "", blocked: 0, from: null, held: null, ...over,
});
const order = () => browserTabs.tabs.map((tab) => `${tab.id}${tab.pinned ? "p" : ""}`).join(" ");

describe("V33 pinned tabs (Zephium SidebarBody: pinned first, then the rest)", () => {
  beforeEach(() => {
    browserTabs.tabs = [row(1), row(2), row(3), row(4)];
  });

  it("pinning puts the tab at the end of the pinned ones, keeping both groups' order", () => {
    browserTabs.setPinned(3, true);
    expect(order()).toBe("3p 1 2 4");
    browserTabs.setPinned(4, true);
    expect(order()).toBe("3p 4p 1 2");
  });

  it("unpinning puts the tab at the head of the others", () => {
    browserTabs.setPinned(3, true);
    browserTabs.setPinned(4, true);
    browserTabs.setPinned(3, false);
    expect(order()).toBe("4p 3 1 2");
  });

  it("keeps the same tab objects, so a shown tab's state survives pinning", () => {
    const tab = browserTabs.tabs.find((t) => t.id === 2)!;
    tab.back = true;
    browserTabs.setPinned(2, true);
    expect(browserTabs.tabs[0]!.back).toBe(true);
  });

  it("a tab dragged among the pinned ones is pinned there; dragged out of them it is not", () => {
    browserTabs.setPinned(1, true);
    browserTabs.setPinned(2, true);
    expect(order()).toBe("1p 2p 3 4");
    browserTabs.move(4, 1);
    expect(order()).toBe("1p 4p 2p 3");
    browserTabs.move(1, 3);
    expect(order()).toBe("4p 2p 3 1");
  });

  it("on the boundary between the groups a tab keeps what it was", () => {
    browserTabs.setPinned(1, true);
    browserTabs.move(3, 1);
    expect(order()).toBe("1p 3 2 4");
  });
});

describe("V33 caption event", () => {
  it("carries the fade's duration, bounded", () => {
    (browserTabs as unknown as { onEvent(e: unknown): void }).onEvent({ id: 0, kind: "caption", shown: true, height: 36, duration: 180 });
    expect(browserTabs.caption).toEqual({ shown: true, height: 36, duration: 180 });
    (browserTabs as unknown as { onEvent(e: unknown): void }).onEvent({ id: 0, kind: "caption", shown: false, height: 36, duration: 99999 });
    expect(browserTabs.caption.duration).toBe(400);
    (browserTabs as unknown as { onEvent(e: unknown): void }).onEvent({ id: 0, kind: "caption", shown: false, height: 36 });
    expect(browserTabs.caption.duration).toBe(0);
  });
});
