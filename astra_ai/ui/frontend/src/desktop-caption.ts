/**
 * V33 AEGIS Desktop: the window buttons are Windows' own, drawn on a transparent overlay over the page's
 * top-right corner (desktop/main.cjs, captionReveal). Their symbols must read on whatever is under that
 * corner, in every view (Browse, Work, Dashboard, Memory, Settings), so this tells the desktop the tone of
 * the surface there: "dark", "light", or "page"/"page-light" when a website's native view is under it (its
 * colours are the site's, not AEGIS's; the suffix names the Browse chrome the symbols stand on once out,
 * after the page has stepped down). It reads one point about once a second while the window is shown, and right
 * after a click or key, and sends only changes. Nothing else crosses the bridge.
 */
type Tone = "dark" | "light" | "page" | "page-light";

const CORNER = { fromRight: 69, top: 18 };

function rgba(value: string): [number, number, number, number] | null {
  const parts = value.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) return null;
  return [parts[0]!, parts[1]!, parts[2]!, parts.length > 3 ? parts[3]! : 1];
}

/** The tone of the first opaque surface at a point, walking out from the element drawn there. */
export function toneAt(x: number, y: number, doc: Document = document): Tone {
  const top = doc.elementFromPoint(x, y);
  // Over a website the symbols rest on the site's own colours, and once out on the Browse chrome around it.
  const page = top?.closest(".browser.shown .page:not(.blank)");
  if (page) return surfaceTone(page.closest(".browser")) === "light" ? "page-light" : "page";
  return surfaceTone(top);
}

function surfaceTone(from: Element | null | undefined): "dark" | "light" {
  for (let node: Element | null = from ?? null; node; node = node.parentElement) {
    const color = rgba(getComputedStyle(node).backgroundColor);
    if (!color || color[3] < 0.5) continue;
    const [r, g, b] = color.slice(0, 3).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36 ? "light" : "dark";
  }
  return "dark";
}

export function watchCaptionSurface(): () => void {
  const bridge = (window as Window & { aegisDesktop?: { invoke(command: string, args?: unknown): Promise<unknown> } }).aegisDesktop;
  if (!bridge) return () => {};
  let sent: Tone | null = null;
  let soon = 0;
  const read = () => {
    soon = 0;
    if (document.visibilityState !== "visible") return;
    const tone = toneAt(window.innerWidth - CORNER.fromRight, CORNER.top);
    if (tone === sent) return;
    sent = tone;
    bridge.invoke("caption_surface", { tone }).catch(() => { sent = null; });
  };
  const later = () => { if (!soon) soon = window.setTimeout(read, 160); };
  const timer = window.setInterval(read, 1000);
  window.addEventListener("pointerup", later, true);
  window.addEventListener("keyup", later, true);
  window.addEventListener("resize", later);
  later();
  return () => {
    window.clearInterval(timer);
    window.clearTimeout(soon);
    window.removeEventListener("pointerup", later, true);
    window.removeEventListener("keyup", later, true);
    window.removeEventListener("resize", later);
  };
}
