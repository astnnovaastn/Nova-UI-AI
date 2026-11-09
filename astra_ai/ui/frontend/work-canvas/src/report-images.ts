/** Saved report pictures, through AEGIS's authenticated route, fetched once per image. */
import { store } from "./store.svelte";

const fetched = new Map<string, Promise<string | null>>();

export function pictureUrl(researchId: string, imageId: string) {
  const key = `${researchId}:${imageId}`;
  let pending = fetched.get(key);
  if (!pending) {
    pending = fetch(`/api/research/${researchId}/images/${imageId}`, { headers: store.actions?.imageHeaders() ?? {} })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? URL.createObjectURL(blob) : null))
      .catch(() => null);
    fetched.set(key, pending);
  }
  return pending;
}
