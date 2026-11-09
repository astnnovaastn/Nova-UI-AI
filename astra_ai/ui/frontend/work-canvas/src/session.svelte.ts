/**
 * The small part of Zephium's WorkSession that its activity line reads, backed by real
 * AEGIS job state instead of Rust. Stop cancels the actual job; steering sends the
 * person's words to the real conversation.
 */
import type { WorkPageV1, WorkRuntimeProjection, WorkSignalV1 } from "$shared/ipc/bindings";
import type { WorkSession } from "$domain/work";
import { store } from "./store.svelte";

class AegisWorkSession {
  projection = $state.raw<WorkRuntimeProjection | null>(null);
  activity = $state.raw<WorkSignalV1[]>([]);
  pages = $state.raw<WorkPageV1[]>([]);
  selected = $state<string | null>(null);
  pending = null;
  delivery = "ready";
  failure = null;
  queue: string[] = [];
  followups: string[] = [];
  profile = "";
  operations = { latest: () => undefined };

  update(projection: WorkRuntimeProjection | null, activity: WorkSignalV1[], pages: WorkPageV1[]) {
    this.projection = projection;
    this.activity = activity;
    this.pages = pages;
    this.selected = projection?.work.id ?? null;
  }
  async execute(command: { kind: string }) {
    if (command.kind === "cancel" && store.state.jobId) store.actions?.stopJob(store.state.jobId);
    return true;
  }
  async steer(text: string) {
    store.actions?.prompt(text);
    return true;
  }
  async continueWith(text: string) {
    store.actions?.prompt(text);
    return true;
  }
  async answerStep(_execution: string, _question: string, text: string) {
    store.actions?.prompt(text);
    return true;
  }
  enqueue() {}
  async sendQueued() {}
}

export const aegisSession = new AegisWorkSession();
export const asWorkSession = () => aegisSession as unknown as WorkSession;
