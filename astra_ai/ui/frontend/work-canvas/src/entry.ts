/**
 * The React host's one door into the canvas. Stylesheet loading stays here so the page
 * only ever carries the scoped CSS while Research uses the canvas.
 */
import "./styles.css";
import { mount, unmount } from "svelte";
import AskEmpty from "./assist/Empty.svelte";
import AegisWorkHost from "./AegisWorkHost.svelte";
import { store, type CanvasActions, type CanvasState } from "./store.svelte";
import { missingCommands } from "./native/core";
import {setWorkspaceHeaders} from './native/host-session';
import SettingsHost from "./settings/SettingsHost.svelte";
import { settingsView } from "./settings/settings-view.svelte";

let settingsRoot: HTMLElement | undefined;

function ensureSettings() {
  if (settingsRoot) return;
  settingsRoot = document.createElement("div");
  settingsRoot.className = "aegis-work-root";
  settingsRoot.dataset.material = "aegis";
  const syncTheme = () => {
    if (settingsRoot) settingsRoot.dataset.theme = document.documentElement.dataset.appearanceMode || document.body.dataset.researchCanvasTheme || "dark";
  };
  syncTheme();
  window.addEventListener("themechange", syncTheme);
  document.body.append(settingsRoot);
  mount(SettingsHost, { target: settingsRoot });
}

export function openUnifiedSettings(section?: string) {
  ensureSettings();
  settingsView.open(section);
}

export type { CanvasActions, CanvasState };

/** V31: the canvas's own reads of the person's workspace (Today's task counts) carry the live client id. */
export { setWorkspaceHeaders };

export function mountAskEmpty(target: HTMLElement, context: boolean) {
  const instance = mount(AskEmpty, { target, props: { context } });
  return { destroy() { void unmount(instance); } };
}


export async function mountWorkspaceTools(target:HTMLElement, props:{kind:'notes'|'tasks';onclose:()=>void;onlegacy?:()=>void;headers?:()=>Record<string,string>}) {
  setWorkspaceHeaders(props.headers??(()=>({})));
  const {default:WorkspaceTools}=await import('./tools/WorkspaceTools.svelte');
  const instance=mount(WorkspaceTools,{target,props});
  return {destroy:()=>void unmount(instance),command:async(value:Record<string,unknown>)=>(await import('./tools/note-commands')).runNoteCommand(value)};
}

export type CanvasHandle = {
  update(next: Partial<CanvasState>): void;
  setActions(actions: CanvasActions): void;
  destroy(): void;
  /** Native commands reached that AEGIS does not provide; empty in normal use. */
  missingCommands(): string[];
};

export function mountCanvas(target: HTMLElement, portal: HTMLElement): CanvasHandle {
  const fixture = ['127.0.0.1','localhost','[::1]'].includes(location.hostname) && new URLSearchParams(location.search).has('aegisFixture');
  let host:ReturnType<typeof mount>|undefined,dead=false;
  if(fixture)void import('./fixtures/FixtureWorkspace.svelte').then(({default:FixtureWorkspace})=>{if(!dead)host=mount(FixtureWorkspace,{target});});
  else {
    ensureSettings();
    host=mount(AegisWorkHost, { target, props: { portal } });
  }
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
      dead=true;
      if(host)void unmount(host);
    },
    missingCommands,
  };
}
