// The vendored tools own their editors and persistence. This adapter owns where they open.
import { browserTabs } from "../browser-tabs.svelte";

export const toolContext = $state<{page: "notes" | "tasks" | null; source: {url: string; title: string} | null}>({ page: null, source: null });
let notesReturn: { workspace: string; page: typeof browserTabs.page } | null = null;

export const surface = {
  async open(kind: string) {
    if (kind !== "notes" && kind !== "tasks") return;
    if (kind === "notes" && browserTabs.available) {
      const surface = new URLSearchParams(location.search).get("research") ?? localStorage.getItem("nova-research-surface");
      if (surface !== "classic") {
        const workspace = sessionStorage.getItem("nova-current-workspace") || "dashboard";
        notesReturn = { workspace, page: browserTabs.page };
        browserTabs.page = "notes";
        if (workspace !== "research") window.dispatchEvent(new Event("nova-open-research"));
        return;
      }
    }
    toolContext.page = kind;
    window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind } }));
  },
  async close() {
    if (browserTabs.page === "notes") {
      const previous = notesReturn;
      notesReturn = null;
      browserTabs.page = previous?.page ?? null;
      if (previous?.workspace === "dashboard" || previous?.workspace === "memory") {
        window.dispatchEvent(new Event("nova-open-" + previous.workspace));
      }
      return;
    }
    toolContext.page = null;
    window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind: null } }));
  },
};

export const tabs = { profile: () => ({id: "aegis-owner"}), activeTab: () => toolContext.source };
