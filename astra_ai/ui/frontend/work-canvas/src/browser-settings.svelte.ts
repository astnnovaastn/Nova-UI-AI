/**
 * V31: AEGIS Desktop browser settings, kept in this window's local storage (they hold no secrets: sign-ins
 * live in the browser engine's own cookie store, never here). Every setting here changes real behaviour:
 *
 *  - wallpaper   the new tab's picture: the sky (Zephium's MPL-2.0 sky print), a picture the person
 *                chose (downscaled to at most 1920 px before it is kept), or a plain colour; and a dimmer.
 *  - newtab      which figures the new tab shows along its foot, and whether it shows the clock.
 *  - startup     reopen the last tabs (lazily) or start with none.
 *  - history     keep a visit history for address suggestions, or not.
 *  - focus       the focus round's length, whether breaks follow it (V33, Zephium's "focus.breaks"), the
 *                day's goal, and sites a running round holds back.
 */
export type Wallpaper = { kind: "sky" } | { kind: "image"; data: string } | { kind: "color"; color: string };

export type BrowserSettings = {
  wallpaper: Wallpaper;
  dim: boolean;
  showClock: boolean;
  pageZoom: number;
  figures: { trackers: boolean; focus: boolean; due: boolean };
  restoreTabs: boolean;
  afterClose: "next" | "previous" | "recent";
  history: boolean;
  focus: { minutes: number; goal: number; breaks: boolean; holdSites: boolean; sites: string[] };
};

const KEY = "aegis-browser-settings-v1";
export const DEFAULT_SETTINGS: BrowserSettings = {
  wallpaper: { kind: "sky" },
  dim: false,
  showClock: true,
  pageZoom: 100,
  figures: { trackers: true, focus: true, due: true },
  restoreTabs: true,
  afterClose: "next",
  history: true,
  focus: { minutes: 25, goal: 120, breaks: false, holdSites: false, sites: ["youtube.com", "x.com", "reddit.com"] },
};

const COLOR = /^#[0-9a-f]{6}$/i;

/** Anything read back is checked: a damaged or old value falls back to the default for that field. */
export function cleanSettings(raw: unknown): BrowserSettings {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<BrowserSettings> & Record<string, unknown>;
  const paper = value.wallpaper as Wallpaper | undefined;
  const wallpaper: Wallpaper =
    paper?.kind === "image" && typeof paper.data === "string" && paper.data.startsWith("data:image/") ? paper
    : paper?.kind === "color" && typeof paper.color === "string" && COLOR.test(paper.color) ? paper
    : { kind: "sky" };
  const figures = (value.figures ?? {}) as Partial<BrowserSettings["figures"]>;
  const focus = (value.focus ?? {}) as Partial<BrowserSettings["focus"]>;
  const minutes = Number(focus.minutes);
  const goal = Number(focus.goal);
  return {
    wallpaper,
    dim: value.dim === true,
    showClock: value.showClock !== false,
    pageZoom: typeof value.pageZoom === "number" && Number.isInteger(value.pageZoom) && value.pageZoom >= 50 && value.pageZoom <= 200 ? value.pageZoom : 100,
    figures: { trackers: figures.trackers !== false, focus: figures.focus !== false, due: figures.due !== false },
    restoreTabs: value.restoreTabs !== false,
    afterClose: value.afterClose === "previous" || value.afterClose === "recent" ? value.afterClose : "next",
    history: value.history !== false,
    focus: {
      minutes: Number.isFinite(minutes) && minutes >= 5 && minutes <= 120 ? Math.round(minutes) : 25,
      goal: Number.isFinite(goal) && goal >= 15 && goal <= 720 ? Math.round(goal) : 120,
      breaks: focus.breaks === true,
      holdSites: focus.holdSites === true,
      sites: Array.isArray(focus.sites) ? focus.sites.filter((s): s is string => typeof s === "string" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)).slice(0, 50) : DEFAULT_SETTINGS.focus.sites,
    },
  };
}

function read(): BrowserSettings {
  try {
    return cleanSettings(JSON.parse(localStorage.getItem(KEY) || "null"));
  } catch {
    return cleanSettings(null);
  }
}

class Settings {
  value = $state<BrowserSettings>(read());
  /** Why the last save failed (a picture too large for local storage), shown in Settings. */
  error = $state("");

  update(change: (draft: BrowserSettings) => void) {
    const next = cleanSettings(JSON.parse(JSON.stringify(this.value)));
    change(next);
    const clean = cleanSettings(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(clean));
      this.error = "";
    } catch {
      this.error = "That picture is too large to keep. Choose a smaller one.";
      return;
    }
    this.value = clean;
  }
}

export const browserSettings = new Settings();

/** A chosen picture, scaled so its longest side is at most 1920 px and kept as a JPEG (a few hundred KB). */
export async function wallpaperFrom(file: File, longest = 1920): Promise<string> {
  if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(file.type)) throw new Error("Choose a PNG, JPEG, WebP or AVIF picture.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
