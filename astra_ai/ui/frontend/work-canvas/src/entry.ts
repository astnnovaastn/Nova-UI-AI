/**
 * The React host's one door into the canvas. Stylesheet loading stays here so the page
 * only ever carries the scoped CSS while Research uses the canvas.
 */
import "./styles.css";
import { mount, unmount } from "svelte";
import AegisWorkHost from "./AegisWorkHost.svelte";
import { store, type CanvasActions, type CanvasState } from "./store.svelte";
import { missingCommands } from "./native/core";

export type { CanvasActions, CanvasState };

export type CanvasHandle = {
  update(next: Partial<CanvasState>): void;
  setActions(actions: CanvasActions): void;
  destroy(): void;
  /** Native commands reached that AEGIS does not provide; empty in normal use. */
  missingCommands(): string[];
};

export function mountCanvas(target: HTMLElement, portal: HTMLElement): CanvasHandle {
  const host = mount(AegisWorkHost, { target, props: { portal } });
  return {
    update(next) {
      store.state = { ...store.state, ...next };
      for (const root of [target, portal]) root.dataset.theme = store.state.theme;
      document.body.dataset.researchCanvasTheme = store.state.theme;
    },
    setActions(actions) {
      store.actions = actions;
    },
    destroy() {
      void unmount(host);
    },
    missingCommands,
  };
}
