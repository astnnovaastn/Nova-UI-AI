/**
 * The Images and Videos collections of a research, as paper sheets on the canvas, with the
 * relations that join them to the rest of the run. Everything comes from what the backend saved:
 * the report's own validated images (`image_items`, each with the source it came from) and the
 * videos its video search found (`media`, see artifacts.media). Nothing is invented: a research
 * with no images has no Images sheet, and a video search that never ran has no Videos sheet.
 */
import type { Relation, RelationStatus } from "./relations";
import type { ResearchReport } from "./research-to-run";

export const IMAGES_ID = "collection:images";
export const VIDEOS_ID = "collection:videos";

export type CollectedImage = { id: string; caption: string; sourceId: string; url: string; host: string };
export type CollectedVideo = { id: string; videoId: string; title: string; url: string; channel: string; thumbnail: string; provider: string };
export type CollectionState = "ready" | "searching" | "unavailable";
export type CollectionData = {
  kind: "images" | "videos";
  researchId: string;
  title: string;
  state: CollectionState;
  /** Why a search found nothing, in plain words. */
  note: string;
  images: CollectedImage[];
  videos: CollectedVideo[];
};

/** Cards drawn at most; the rest stay in the Media view. */
export const SHOWN_IMAGES = 9;
export const SHOWN_VIDEOS = 5;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const YOUTUBE = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;
export const videoIdOf = (url: string) => YOUTUBE.exec(url)?.[1] ?? "";

const VIDEO_REASONS: Record<string, string> = {
  video_provider_quota: "The video search is out of quota.",
  video_provider_unavailable: "The video search was unavailable.",
  video_provider_not_configured: "No video search is set up.",
  video_provider_reported_error: "The video search reported an error.",
  no_relevant_videos_returned: "The video search found no relevant videos.",
  video_request_interrupted_no_automatic_retry: "The video search was interrupted.",
};

export function imageCollection(report: ResearchReport | null): CollectionData | null {
  if (!report) return null;
  const sources = new Map((report.sources ?? []).map((source) => [source.id, source.url]));
  const seen = new Set<string>();
  const images: CollectedImage[] = [];
  for (const image of report.image_items ?? []) {
    if (!image.id || seen.has(image.content_hash || image.id)) continue;
    seen.add(image.content_hash || image.id);
    const url = (image.source_id && sources.get(image.source_id)) || image.publication || "";
    images.push({ id: image.id, caption: image.caption ?? "", sourceId: image.source_id ?? "", url, host: hostOf(url) });
  }
  if (!images.length) return null;
  return { kind: "images", researchId: report.research_id, title: "Images", state: "ready", note: "", images, videos: [] };
}

export function videoCollection(report: ResearchReport | null): CollectionData | null {
  if (!report) return null;
  const seen = new Set<string>();
  const videos: CollectedVideo[] = [];
  for (const row of report.media ?? []) {
    const videoId = row.video_id || videoIdOf(row.url);
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    videos.push({
      id: row.id || `V${videoId}`,
      videoId,
      title: row.title || "Video",
      url: row.url,
      channel: row.channel ?? "",
      // YouTube's own still for the video, when the search gave none.
      thumbnail: row.thumbnail?.startsWith("https://") ? row.thumbnail : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      provider: row.provider ?? "",
    });
  }
  const status = report.media_status ?? "idle";
  const searching = status === "pending" || status === "running";
  const reason = report.media_failures?.[0]?.reason ?? "";
  // A finished search with nothing to show, or none at all, has no sheet.
  if (!videos.length && !searching && !(status === "partial" || status === "unavailable")) return null;
  return {
    kind: "videos",
    researchId: report.research_id,
    title: "Videos",
    state: videos.length ? "ready" : searching ? "searching" : "unavailable",
    note: videos.length || searching ? "" : (VIDEO_REASONS[reason] ?? "No videos were found."),
    images: [],
    videos,
  };
}

const relation = (id: string, type: Relation["type"], source: string, target: string, label: string, status: RelationStatus, note: string, detail: Record<string, unknown>): Relation => ({
  id, type, source, target, label, status, event_seq: 0, at: 0, evidence_id: "", url: "", note, detail: { derived: true, ...detail },
});

/**
 * The joins the collections stand for. Each image comes from the source page it was taken from
 * (`url:` that page) and belongs to the report; the videos were found by searching the request and
 * are offered beside the report. `query` is the request that searched, `report` the report's ref.
 */
export function collectionRelations(images: CollectionData | null, videos: CollectionData | null, refs: { query: string; report: string }): Relation[] {
  const rows: Relation[] = [];
  for (const image of images?.images ?? []) {
    if (image.url) rows.push(relation(`img-${image.id}`, "illustrates", `url:${image.url}`, IMAGES_ID, "Image", "complete", image.caption.slice(0, 200), { image: image.id, source: image.sourceId }));
  }
  if (images?.images.length) rows.push(relation("img-report", "includes", IMAGES_ID, refs.report, "In the report", "complete", `${images.images.length} ${images.images.length === 1 ? "image" : "images"} from the report's sources`, { count: images.images.length }));
  if (videos) {
    if (videos.state === "searching") rows.push(relation("vid-search", "collects", refs.query, VIDEOS_ID, "Searching videos", "active", "", {}));
    else if (videos.state === "unavailable") rows.push(relation("vid-search", "collects", refs.query, VIDEOS_ID, "Video search", "failed", videos.note, {}));
    for (const video of videos.videos) rows.push(relation(`vid-${video.videoId}`, "collects", refs.query, VIDEOS_ID, "Video", "complete", video.title.slice(0, 200), { video: video.videoId, provider: video.provider }));
    if (videos.videos.length) rows.push(relation("vid-report", "includes", VIDEOS_ID, refs.report, "Related videos", "complete", `${videos.videos.length} related ${videos.videos.length === 1 ? "video" : "videos"} beside the report`, { count: videos.videos.length }));
  }
  return rows;
}

/** The sheet's size on the canvas, from what it holds. */
export function collectionSize(data: CollectionData): { width: number; height: number } {
  const width = 380;
  const chrome = 41 + 58 + 41; // header, title block, footer
  if (data.kind === "images") {
    const rows = Math.ceil(Math.min(SHOWN_IMAGES, data.images.length) / 3);
    return { width, height: chrome + rows * 116 + 12 };
  }
  const rows = Math.max(1, Math.min(SHOWN_VIDEOS, data.videos.length));
  return { width, height: chrome + (data.videos.length ? rows * 78 : 64) + 12 };
}
