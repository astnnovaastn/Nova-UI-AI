import { createSubscriber } from "svelte/reactivity";

export type SitePreview = {
  title: string;
  excerpt?: string;
  favicon?: string;
  image?: string;
  thumbnail?: string;
  capturedAt?: number;
  retrieval?: string;
  citations?: number;
};

export type PreviewProvider = {
  name: string;
  previewFor(url: string): SitePreview | null;
};

export function savedDataProvider(previews: ReadonlyMap<string, SitePreview>): PreviewProvider {
  return { name: "saved-data", previewFor: (url) => previews.get(url) ?? null };
}

let provider: PreviewProvider = savedDataProvider(new Map());
let thumbnails = new Map<string, { thumbnail: string; capturedAt: number }>();
let invalidate: (() => void) | undefined;
const subscribe = createSubscriber((update) => {
  invalidate = update;
  return () => { invalidate = undefined; };
});

export function installPreviewProvider(next: PreviewProvider) {
  provider = next;
  invalidate?.();
}

export function previewFor(url: string): SitePreview | null {
  subscribe();
  const base = provider.previewFor(url);
  return base ? { ...base, ...thumbnails.get(url) } : null;
}

type PreviewRow = { id: string; url: string; status: string; captured_at?: number };

export function watchThumbnails(run: string, revision: string, urls: ReadonlySet<string>, headers: Record<string, string>) {
  const controller = new AbortController();
  const options = { headers, signal: controller.signal };
  const root = "/api/research/" + encodeURIComponent(run) + "/source-previews";
  const query = revision ? "?revision=" + encodeURIComponent(revision) : "";
  const images = new Map<string, { thumbnail: string; capturedAt: number }>();
  let timer: ReturnType<typeof setTimeout>;

  async function read() {
    try {
      const reply = await fetch(root + query, options);
      if (!reply.ok) return;
      const data: { previews: PreviewRow[] } = await reply.json();
      const candidates = data.previews.filter((row) => urls.has(row.url));
      const ready = candidates.filter((row) => row.status === "ready" && !images.has(row.url));
      for (let index = 0; index < ready.length; index += 4) {
        await Promise.all(ready.slice(index, index + 4).map(async (row) => {
          try {
            const response = await fetch(root + "/" + row.id + query, options);
            if (!response.ok) return;
            const blob = await response.blob();
            if (controller.signal.aborted) return;
            images.set(row.url, { thumbnail: URL.createObjectURL(blob), capturedAt: row.captured_at ?? 0 });
          } catch { /* The source card still has its saved excerpt. */ }
        }));
        if (controller.signal.aborted) return;
        thumbnails = images;
        invalidate?.();
      }
      if (candidates.some((row) => row.status === "pending") && !controller.signal.aborted) {
        timer = setTimeout(() => void read(), 3500);
      }
    } catch { /* A missing capture never holds up the canvas. */ }
  }

  void read();
  return () => {
    controller.abort();
    clearTimeout(timer);
    for (const image of images.values()) URL.revokeObjectURL(image.thumbnail);
    if (thumbnails === images) {
      thumbnails = new Map();
      invalidate?.();
    }
  };
}
