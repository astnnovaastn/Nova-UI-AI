export type WorkLibraryPanel = "skills" | "connections";
export type CanvasRailPanel = "history" | "conversation" | WorkLibraryPanel;
export type CanvasPanel = "" | "document" | CanvasRailPanel;

export function focusWorkLibraryTrigger(panel: WorkLibraryPanel) {
  document.querySelector<HTMLButtonElement>('button[aria-controls="work-' + panel + '-drawer"]')?.focus({ preventScroll: true });
}
