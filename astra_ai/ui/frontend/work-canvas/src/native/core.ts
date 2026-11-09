/**
 * Stands in for Tauri's `invoke`. Zephium's generated bindings call this unchanged.
 * AEGIS has no Rust runtime: research goes through the React host and FastAPI, so
 * only harmless cache and shortcut queries are answered here. Anything else fails
 * loudly rather than pretending a native effect happened.
 */
const answers: Record<string, unknown> = {
  favicon_probe: true,
  work_release_memory: true,
  keymap_entries: [],
};

const missing = new Set<string>();
export const missingCommands = (): string[] => [...missing];

export async function invoke<T>(command: string): Promise<T> {
  if (command in answers) return answers[command] as T;
  missing.add(command);
  throw new Error(`"${command}" is not available in AEGIS Research.`);
}
