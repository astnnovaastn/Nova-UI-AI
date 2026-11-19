/**
 * V33: moving a page between AEGIS Work and the AEGIS browser.
 *
 * - `originalAddress`: the page a source window really shows, for "Open in browser": a consent or
 *   interstitial page is unwrapped to where it was going, and a video in any of YouTube's address forms
 *   (embed, nocookie, shorts, youtu.be) becomes its watch page, at the second it was playing.
 * - `pageKey`: one identity per page, so the same page is one tab and one Work reference. Mirrors the
 *   backend's core/work/page_identity.py.
 */
import { youtubeVideoId } from "./video-player";

const TRACKING = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src|si|feature)$/i;
/** Interstitials that carry the real destination in a parameter. */
const WRAPPERS: [RegExp, string][] = [
  [/^consent\.(youtube|google)\.com$/i, "continue"],
  [/^(www\.)?google\.[a-z.]+$/i, "url"],
  [/^l\.facebook\.com$/i, "u"],
  [/^out\.reddit\.com$/i, "url"],
];

function parse(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** The page behind an interstitial, when the interstitial names a public http(s) page. */
function unwrap(url: URL): URL {
  for (const [host, key] of WRAPPERS) {
    if (!host.test(url.hostname)) continue;
    if (host.source.includes("google") && url.pathname !== "/url" && !url.hostname.startsWith("consent.")) continue;
    const inner = parse(url.searchParams.get(key) ?? "");
    if (inner) return inner;
  }
  return url;
}

/** A YouTube video's own page: https://www.youtube.com/watch?v=ID (with &t=Ns when a time is known). */
export function youtubeWatch(value: string, seconds?: number | null): string | null {
  const id = youtubeVideoId(value);
  if (!id) return null;
  const at = seconds && seconds >= 1 ? `&t=${Math.floor(seconds)}s` : (() => {
    const t = parse(value)?.searchParams.get("t") ?? parse(value)?.searchParams.get("start");
    return t && /^\d+s?$/.test(t) ? `&t=${parseInt(t, 10)}s` : "";
  })();
  return `https://www.youtube.com/watch?v=${id}${at}`;
}

/**
 * The address "Open in browser" should open for a source window. `live` is where the window's own view is
 * now (links followed included); `asked` is the source it was opened for; `info` is the research's own record.
 * Page fragments (#section, #page=3, #:~:text=) are kept: they point at the part the person was reading.
 */
export function originalAddress({ live, asked, recorded }: { live?: string; asked?: string; recorded?: string }, seconds?: number | null): string | null {
  const pick = [live, asked, recorded].map((value) => (value ? parse(value) : null)).find(Boolean);
  if (!pick) return null;
  const page = unwrap(pick);
  return youtubeWatch(page.href, seconds) ?? page.href;
}

/** One identity per page: tabs are focused and Work references deduplicated by it. */
export function pageKey(value: string): string {
  const video = youtubeVideoId(value);
  if (video) return `youtube:${video}`;
  const url = parse(value.trim());
  if (!url) return value;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
  const query = [...url.searchParams.entries()].filter(([key]) => !TRACKING.test(key)).sort(([a, x], [b, y]) => (a === b ? (x < y ? -1 : x > y ? 1 : 0) : a < b ? -1 : 1));
  const search = query.length ? "?" + new URLSearchParams(query).toString() : "";
  return `${url.protocol}//${host}${port}${url.pathname.replace(/\/+$/, "")}${search}`;
}

export const samePage = (a: string, b: string) => !!a && !!b && pageKey(a) === pageKey(b);
