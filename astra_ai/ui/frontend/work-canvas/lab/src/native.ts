/**
 * Stands in for every `@tauri-apps/api/*` module inside the lab.
 *
 * The lab has no Rust runtime, no backend and no AI provider. A native command either
 * has a harmless fixed answer below or is recorded and rejected, so the inspector can
 * list exactly which backend calls a component reaches for.
 */
const answers: Record<string, unknown> = {
  favicon_probe: false,
  work_release_memory: true,
  keymap_entries: [],
};

export type NativeCall = { command: string; at: number; answered: boolean };
const calls: NativeCall[] = [];
const watchers = new Set<() => void>();

export const nativeCalls = (): readonly NativeCall[] => calls;
export function watchNative(run: () => void): () => void {
  watchers.add(run);
  return () => watchers.delete(run);
}

export async function invoke<T>(command: string, _args?: Record<string, unknown>): Promise<T> {
  const answered = command in answers;
  calls.push({ command, at: Date.now(), answered });
  if (calls.length > 400) calls.splice(0, calls.length - 400);
  queueMicrotask(() => watchers.forEach((run) => run()));
  if (answered) return answers[command] as T;
  throw new Error(`Work Layout Lab: native command "${command}" is not available (simulated).`);
}

type Unlisten = () => void;
type Handler<T> = (event: { event: string; id: number; payload: T }) => void;
export const listen = async <T>(name: string, callback: Handler<T>): Promise<Unlisten> => {
  const handler = (event: Event) =>
    callback({ event: name, id: 0, payload: (event as CustomEvent<T>).detail });
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
};
export const once = async <T>(name: string, callback: Handler<T>) => {
  let stop: Unlisten = () => {};
  stop = await listen<T>(name, (event) => {
    stop();
    callback(event);
  });
  return stop;
};
export const emit = async (name: string, payload?: unknown) => {
  window.dispatchEvent(new CustomEvent(name, { detail: payload }));
};
export const emitTo = async (_target: unknown, name: string, payload?: unknown) => emit(name, payload);

export class Window {}
export class Webview {}
export class Channel<T> {
  onmessage: (message: T) => void = () => {};
}
const surface = {
  label: "main",
  isFullscreen: async () => false,
  isMaximized: async () => false,
  isFocused: async () => true,
  scaleFactor: async () => globalThis.devicePixelRatio || 1,
  onResized: async () => () => {},
  onMoved: async () => () => {},
  onFocusChanged: async () => () => {},
  onScaleChanged: async () => () => {},
  listen,
  once,
  emit,
};
export const getCurrentWindow = () => surface;
export const getCurrentWebview = () => surface;
export const convertFileSrc = (path: string) => path;
export const isTauri = () => false;
