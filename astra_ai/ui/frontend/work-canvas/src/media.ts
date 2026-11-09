/**
 * Replaces Zephium's privileged media routes. Pictures are blob URLs the host fetched
 * from AEGIS's authenticated research routes; a key with no picture returns null, and
 * the canvas then shows its text-only face.
 */
const pictures = new Map<string, string>();
const frames = new Map<string, string>();

export function setCanvasPictures(next: { pictures: Map<string, string>; frames: Map<string, string> }) {
  pictures.clear();
  frames.clear();
  for (const [key, url] of next.pictures) pictures.set(key, url);
  for (const [key, url] of next.frames) frames.set(key, url);
}

export function mediaUrl(_profile: string, digest: string): string | null {
  return pictures.get(digest) ?? null;
}

export function pageFrameUrl(_attempt: string, step: string): string | null {
  return frames.get(step) ?? null;
}
