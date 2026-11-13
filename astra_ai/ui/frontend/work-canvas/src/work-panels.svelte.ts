/** Which Work side panel is open beside the rail (Skills or Connections), and the backend calls they make. */
import { store } from "./store.svelte";

class WorkPanels {
  open = $state<"" | "skills" | "connections">("");
  toggle(panel: "skills" | "connections") {
    this.open = this.open === panel ? "" : panel;
  }
}

export const workPanels = new WorkPanels();

/** A JSON call to the AEGIS backend with this page's client header. Errors carry the server's own words. */
export async function workApi<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(store.actions?.imageHeaders() ?? {}), ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (body as { detail?: unknown }).detail;
    throw new Error(typeof detail === "string" ? detail : `Request failed (${response.status})`);
  }
  return body as T;
}
