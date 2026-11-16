/**
 * The React host's one door into the canvas. Stylesheet loading stays here so the page
 * only ever carries the scoped CSS while Research uses the canvas.
 */
import "./styles.css";
import { mount, unmount } from "svelte";
import AegisWorkHost from "./AegisWorkHost.svelte";
import { store, type CanvasActions, type CanvasState } from "./store.svelte";
import { missingCommands } from "./native/core";
import {setWorkspaceHeaders} from './native/host-session';

export type { CanvasActions, CanvasState };

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
  else host=mount(AegisWorkHost, { target, props: { portal } });
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
