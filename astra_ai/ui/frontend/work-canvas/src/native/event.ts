/** Stands in for Tauri's events: nothing native ever fires in AEGIS. */
type Unlisten = () => void;
export const listen = async (): Promise<Unlisten> => () => {};
export const once = async (): Promise<Unlisten> => () => {};
export const emit = async (): Promise<void> => {};
export const emitTo = async (): Promise<void> => {};
