/**
 * V33: the AEGIS server's settings routes, as the old React settings panel (src/settings.ts) used them,
 * carrying the live owner session (X-Nova-Client) the React host supplies. Keys are only ever written:
 * the server answers which keys are set, never their values, and nothing here keeps a key after sending it.
 */
import { workspaceHeaders } from "../native/host-session";

export type ProviderRow = {
  id: "gemini" | "openai"; configured: boolean; active: boolean; model: string; effective_model: string; credential_source?: string;
  requests_used: number; request_limit: number; tokens_used: number; token_limit: number; local_limit_reached: boolean;
};
export type ResearchWriter = {
  provider: "gemini" | "openai" | "none"; switching: boolean; voice_model: string;
  fallback?: { enabled: boolean; configured: boolean; models?: string[]; cooperative_enabled?: boolean };
  providers: ProviderRow[];
};
export type ServerStatus = {
  research_writer?: ResearchWriter | null;
  aegis_ai_connected: boolean;
  gemini_live_configured?: boolean;
  models?: Record<string, { preferred: string; effective: string | null; verified: boolean; fallback_reason: string | null }>;
  google_calendar_accessible: boolean;
  google_mail_accessible: boolean;
  memory_count: number;
  task_count: number;
  server_port: number;
  uptime_seconds: number;
  env_keys_set: Record<string, boolean>;
};
export type Preferences = { user_name: string; honorific: string; calendar_accounts: string };
export type GoogleStatus = { configured: boolean; connected: boolean; services: string[] };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: "same-origin", ...init, headers: { ...workspaceHeaders(), ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (body as { detail?: unknown; error?: unknown }).detail ?? (body as { error?: unknown }).error;
    throw new Error(typeof detail === "string" ? detail : `The AEGIS server answered ${response.status}.`);
  }
  return body as T;
}

export const post = <T>(path: string, body: unknown) => api<T>(path, { method: "POST", body: JSON.stringify(body) });

/** Saves one key in the server's environment file; the value is sent once and not kept here. */
export const saveKey = (name: string, value: string) => post<{ success: boolean }>("/api/settings/keys", { key_name: name, key_value: value });

export function uptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/** What the React host offers Settings that lives in its own code (src/settings.ts sets it). */
export type AppearanceMode = "theme" | "light" | "dark" | "system";
export type Appearance = {
  mode: AppearanceMode; themeId: string; accent: string; font: string;
  motion: string; frosted: boolean; uiScale: number;
};
export type ThemeOption = { id: string; name: string; tokens: { bg: string; fg: string; accent: string } };
export type HostSettings = {
  appearance(): Appearance;
  setAppearance(patch: Partial<Omit<Appearance, "themeId">>): void;
  listThemes(): Promise<ThemeOption[]>;
  selectTheme(id: string): Promise<void>;
  orbThemes(): { name: string; label: string; color: string }[];
  orbTheme(): string;
  setOrbTheme(name: string): void;
  /** Mounts the voice profile controls into `host`; the returned function releases the microphone. */
  mountVoice(host: HTMLElement): (() => void) | void;
  notificationHistory(): void;
  legacy(): void;
};
export const hostSettings = (): HostSettings | null => ((globalThis as { aegisHostSettings?: HostSettings }).aegisHostSettings ?? null);
