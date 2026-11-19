<script lang="ts">
  /**
   * What a developer workflow can start from in AEGIS Desktop (V34, reworked in V35 for ordinary use):
   *   Choose file · Choose folder · Connect repository · Paste code · Continue with existing project ▾
   * Choose file grants one file; Choose folder and Connect repository grant a folder in the desktop's own dialog
   * (desktop/work-dev.cjs writes the grant the backend reads; Connect repository also asks whether approved changes
   * may be saved). A connected project is reused from the menu without opening the dialog again. The chosen path
   * goes into the request, where core/work/dev_scope.py maps it back to that grant; nothing else becomes readable.
   *
   * Folders that are clearly not the person's projects (temporary folders, test fixtures) are left out of the menu
   * unless developer tools are switched on (localStorage "aegis-dev-tools" = "1", or ?aegis-dev-tools in the URL).
   */
  import { onMount } from "svelte";
  import { desktopWork, type GrantedFolder } from "./browser-host";

  let { skill, request, disabled = false, onplace }: {
    skill: string; request: string; disabled?: boolean; onplace: (text: string) => void;
  } = $props();

  let grants = $state<GrantedFolder[]>([]);
  let pending = $state("");
  let error = $state("");
  let note = $state("");
  const devTools = (() => {
    try { return localStorage.getItem("aegis-dev-tools") === "1" || new URLSearchParams(location.search).has("aegis-dev-tools"); } catch { return false; }
  })();
  const join = (folder: string, file: string) => folder.replace(/[\\/]+$/, "") + "\\" + file;
  const internal = (p: string) => /[\\/]AppData[\\/]Local[\\/]Temp[\\/]|[\\/]tests?[\\/]fixtures[\\/]|[\\/]aegis-v\d+-/i.test(p);
  const projects = $derived(grants.filter((g) => devTools || !internal(g.path)));

  /** Which choices fit the workflow: one file for an explanation, a project for the rest. */
  const choices = $derived(
    skill === "explain-code" ? (["file", "folder", "paste"] as const)
    : skill === "review-a-change" ? (["repository", "folder", "paste"] as const)
    : skill === "fix-a-bug" ? (["repository", "paste"] as const)
    : (["folder", "repository"] as const),
  );
  const LABEL = { file: "Choose file", folder: "Choose folder", repository: "Connect repository", paste: "Paste code" } as const;
  const PASTE_HINT: Record<string, string> = {
    "explain-code": "Paste the code below the request, then press Return.",
    "review-a-change": "Paste the diff or patch below the request, then press Return.",
    "fix-a-bug": "Paste the failing test's output below the request, then press Return.",
  };

  async function load() {
    try { grants = await desktopWork.folders(); } catch { grants = []; }
  }
  onMount(() => {
    void load();
    const changed = () => void load();
    window.addEventListener("aegis-dev-grants-changed", changed);
    return () => window.removeEventListener("aegis-dev-grants-changed", changed);
  });

  const place = (text: string) => onplace(`${request} ${text}`.replace(/\s+$/, "") + " ");
  const label = (g: GrantedFolder) => (g.files?.length === 1 ? g.files[0] : g.title);
  const where = (g: GrantedFolder) => g.path.replace(/^([A-Za-z]:\\Users\\[^\\]+)/, "~");

  async function choose(kind: "file" | "folder" | "repository" | "paste") {
    if (pending || disabled) return;
    error = "";
    note = "";
    if (kind === "paste") {
      // Clipboard text is used only when it is there; otherwise the request is set up for pasting by hand.
      let text = "";
      try { text = (await navigator.clipboard.readText()).trim(); } catch { text = ""; }
      if (text) onplace(`${request}\n\`\`\`\n${text.slice(0, 60000)}\n\`\`\`\n`);
      else { onplace(`${request}\n`); note = PASTE_HINT[skill] ?? "Paste the code below the request."; }
      return;
    }
    pending = kind;
    try {
      const granted = kind === "file" ? await desktopWork.selectFile()
        : await desktopWork.selectFolder(kind === "repository" ? { write: true, title: "Connect a repository to AEGIS Work" } : {});
      if (!granted) return;
      place(granted.file ? join(granted.path, granted.file) : granted.path);
      window.dispatchEvent(new CustomEvent("aegis-dev-grants-changed"));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      pending = "";
    }
  }

  function reuse(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const grant = projects.find((g) => g.id === select.value);
    select.value = "";
    if (grant) place(grant.files?.length === 1 ? join(grant.path, grant.files[0]) : grant.path);
  }
</script>

{#if desktopWork.available}
  <div class="dev-sources" role="group" aria-label="Code to work on">
    {#each choices as kind (kind)}
      <button type="button" class="pick" data-dev-pick={kind} disabled={disabled || !!pending} aria-busy={pending === kind} onclick={() => void choose(kind)}>
        {pending === kind ? "Waiting for your choice…" : LABEL[kind]}
      </button>
    {/each}
    {#if projects.length}
      <label class="existing">
        <span class="sr">Continue with an existing project</span>
        <select data-dev-existing {disabled} onchange={reuse} value="">
          <option value="" disabled>Continue with existing project…</option>
          {#each projects.slice(-8).reverse() as grant (grant.id)}
            <option value={grant.id} title={grant.path}>{label(grant)} — {where(grant)}{grant.write ? "" : " (read only)"}</option>
          {/each}
        </select>
      </label>
    {/if}
    {#if note}<p class="note" role="status">{note}</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </div>
{:else}
  <p class="web-note">Folders and files on this computer can be opened in AEGIS Desktop. Here, paste the code.</p>
{/if}

<style>
  .dev-sources { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; max-inline-size: 680px; pointer-events: auto; }
  button, select {
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.14)); border-radius: 999px; padding: 5px 12px;
    font: inherit; font-size: 12.5px; color: var(--color-text, inherit); background: var(--color-surface, transparent); cursor: pointer;
  }
  select { max-inline-size: 280px; color: var(--color-muted, inherit); }
  button:hover:not(:disabled), select:hover:not(:disabled) { background: var(--color-hover, rgba(255, 255, 255, 0.06)); }
  button:disabled, select:disabled { opacity: 0.55; cursor: default; }
  .sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .note, .error, .web-note { flex-basis: 100%; margin: 4px 0 0; text-align: center; font-size: 12px; color: var(--color-muted, inherit); }
  .error { color: var(--color-danger, #e66); }
</style>
