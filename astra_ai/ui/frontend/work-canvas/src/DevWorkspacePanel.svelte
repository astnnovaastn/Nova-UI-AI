<script lang="ts">
  /**
   * V34 developer workspace bar for a developer run: which authorized project and files were read, and, for a
   * Fix a Failing Test draft, the proposed changes, the real sandbox runs (terminal view) and the approval flow.
   * Everything shown comes from the backend record (store.public → run.developer and /api/work/drafts/{id}).
   * Nothing here writes a file: Apply posts the reviewed draft's approval token; the backend checks the grant
   * allows saving and that the originals did not change since the draft was made.
   */
  import { workApi } from "./work-panels.svelte";

  type Run = {
    status?: string; argv?: string[]; cwd?: string; image?: string; started_at?: string; duration_ms?: number;
    exit_code?: number | null; counts?: Record<string, number>; failing?: string[]; passed?: boolean; reason?: string; output?: string;
    environment?: Record<string, string | number>;
  };
  type DraftFile = { path: string; change: "modified" | "created" | "deleted"; diff: string; added: number; removed: number };
  type Draft = {
    id: string; title?: string; status: string; approval: string; argv: string[]; runs: Record<string, Run>;
    files: DraftFile[]; warnings: string[]; write_allowed: boolean; conflicts?: string[];
  };
  type Developer = {
    scope?: { title?: string; scope?: string; files?: string[]; missing?: string[]; why?: string; source?: string };
    read?: { path: string; start?: number; end?: number; total?: number }[];
    sandbox?: { available?: boolean; reason?: string; image?: string };
    draft?: Draft | null;
  };

  let { developer }: { developer: Developer | null | undefined } = $props();

  let open = $state(false);
  let tab = $state<"changes" | "terminal">("changes");
  let live = $state<Draft | null>(null);
  let reviewed = $state(false);
  let busy = $state("");
  let error = $state("");
  const draft = $derived(live && live.id === developer?.draft?.id ? live : developer?.draft ?? null);
  const scope = $derived(developer?.scope);
  const runs = $derived(draft ? (["before", "after"] as const).filter((k) => draft.runs?.[k] && draft.runs[k].status !== "unavailable") : []);
  const fmt = (run?: Run) => run ? `exit ${run.exit_code ?? "—"}${run.counts && Object.keys(run.counts).length ? " · " + Object.entries(run.counts).map(([k, v]) => `${v} ${k}`).join(", ") : ""}` : "not run";

  async function refresh() {
    if (!developer?.draft?.id) return;
    try { live = await workApi<Draft>("/api/work/drafts/" + developer.draft.id); } catch { /* the run record still shows the draft */ }
  }
  $effect(() => { if (open) void refresh(); });

  async function act(action: "apply" | "discard" | "rollback" | "run") {
    if (!draft || busy) return;
    busy = action;
    error = "";
    try {
      live = await workApi<Draft>(`/api/work/drafts/${draft.id}/${action}`, {
        method: "POST", body: JSON.stringify(action === "apply" ? { approval: draft.approval } : {}),
      });
      if (action === "run") tab = "terminal";
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = "";
    }
  }

  const lineClass = (line: string) => line.startsWith("+++") || line.startsWith("---") ? "meta" : line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : line.startsWith("@@") ? "hunk" : "";
</script>

{#if developer && (scope?.title || draft)}
  <aside class="dev-ws" class:open data-dev-workspace data-construction-control aria-label="Developer workspace">
    <button type="button" class="bar" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="dot" data-state={draft?.status ?? "read"}></span>
      <span class="what">
        {#if draft}
          Code draft · {draft.files.length} file{draft.files.length === 1 ? "" : "s"} · {draft.status === "draft" ? "not applied" : draft.status.replace("_", " ")}
          {#if draft.runs?.after && draft.runs.after.status !== "unavailable"} · tests {fmt(draft.runs.before)} → {fmt(draft.runs.after)}{/if}
        {:else}
          Read from {scope?.title}{scope?.scope ? " / " + scope.scope : ""} · {developer.read?.length ?? 0} file{developer.read?.length === 1 ? "" : "s"}
          {#if scope?.missing?.length} · not found: {scope.missing.join(", ")}{/if}
        {/if}
      </span>
      <span class="toggle">{open ? "Close" : draft ? "Review changes" : "Details"}</span>
    </button>

    {#if open}
      <div class="body">
        {#if scope?.title}
          <p class="scope">Project <strong>{scope.title}</strong>{scope.scope ? " / " + scope.scope : ""} ({scope.source === "authorized" ? "connected by you" : "configured"}).
            {#if developer.read?.length}Read: {developer.read.map((r) => `${r.path}${r.total ? ` (${r.start}–${r.end} of ${r.total})` : ""}`).join(", ")}.{/if}
            {#if scope.missing?.length}<span class="warn"> Not found: {scope.missing.join(", ")}.</span>{/if}</p>
        {/if}

        {#if draft}
          <div class="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "changes"} onclick={() => (tab = "changes")}>Changes ({draft.files.length})</button>
            <button type="button" role="tab" aria-selected={tab === "terminal"} onclick={() => (tab = "terminal")}>Sandbox runs ({runs.length})</button>
          </div>

          {#if tab === "changes"}
            {#each draft.files as file (file.path)}
              <section class="file" data-draft-file={file.path}>
                <header><span class="badge" data-change={file.change}>{file.change}</span><code>{file.path}</code><small>+{file.added} −{file.removed}</small></header>
                <pre class="diff">{#each file.diff.split("\n") as line, i (i)}<span class={lineClass(line)}>{line}</span>{"\n"}{/each}</pre>
              </section>
            {:else}
              <p class="warn">The proposed patch did not match the current files, so nothing was drafted.</p>
            {/each}
            {#each draft.warnings ?? [] as warning (warning)}<p class="warn">Not applied in the draft: {warning}</p>{/each}
          {:else}
            {#if !developer.sandbox?.available}<p class="warn">{developer.sandbox?.reason ?? "No sandbox is available."} Nothing was executed.</p>{/if}
            {#each runs as key (key)}
              {@const run = draft.runs[key]}
              <section class="terminal" data-terminal={key}>
                <header>
                  <strong>{key === "before" ? "Original copy" : "Patched draft"}</strong>
                  <span class:pass={run.exit_code === 0} class:fail={run.exit_code !== 0}>{fmt(run)}</span>
                </header>
                <dl>
                  <dt>Command</dt><dd><code>{run.argv?.join(" ")}</code></dd>
                  <dt>Directory</dt><dd><code>{run.cwd}</code> (isolated copy)</dd>
                  <dt>Environment</dt><dd>{run.image} · network {run.environment?.network} · {run.environment?.memory} · {run.environment?.cpus} CPU · {run.environment?.time_limit_s}s limit</dd>
                  <dt>Started</dt><dd>{run.started_at ? new Date(run.started_at).toLocaleString() : "—"} · {run.duration_ms} ms</dd>
                </dl>
                <pre class="out">{run.output || "(no output)"}</pre>
              </section>
            {/each}
          {/if}

          {#if draft.conflicts?.length}<p class="error">Conflict: {draft.conflicts.join("; ")}. Discard this draft and run the fix again.</p>{/if}
          {#if error}<p class="error" role="alert">{error}</p>{/if}

          <footer class="actions">
            {#if draft.status === "draft"}
              {#if draft.write_allowed}
                <label><input type="checkbox" bind:checked={reviewed} /> I reviewed these changes</label>
                <button type="button" class="primary" data-dev-apply disabled={!reviewed || !draft.files.length || !!busy} onclick={() => void act("apply")}>{busy === "apply" ? "Applying…" : "Approve and apply"}</button>
              {:else}
                <p class="note">This project was connected read only. To apply, connect it again with Select repository and allow saving.</p>
              {/if}
              <button type="button" disabled={!!busy || !developer.sandbox?.available} onclick={() => void act("run")}>{busy === "run" ? "Running…" : "Re-run tests"}</button>
              <button type="button" data-dev-discard disabled={!!busy} onclick={() => void act("discard")}>Discard</button>
            {:else if draft.status === "applied"}
              <p class="note">Applied to {draft.title}. Nothing was published to GitHub.</p>
              <button type="button" data-dev-rollback disabled={!!busy} onclick={() => void act("rollback")}>Roll back</button>
            {:else}
              <p class="note">This draft is {draft.status.replace("_", " ")}.</p>
            {/if}
          </footer>
        {/if}
      </div>
    {/if}
  </aside>
{/if}

<style>
  .dev-ws {
    position: absolute;
    inset-block-start: 56px;
    inset-inline-end: 16px;
    z-index: 30;
    inline-size: min(620px, calc(100% - 32px));
    border-radius: 14px;
    background: var(--color-surface, #16171a);
    box-shadow: var(--shadow-raised, 0 8px 30px rgba(0, 0, 0, 0.35));
    color: var(--color-text, #eee);
    font-size: 13px;
    pointer-events: auto;
  }
  .bar { display: flex; align-items: center; gap: 10px; inline-size: 100%; padding: 10px 14px; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; }
  .what { flex: 1; min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toggle { color: var(--color-muted, #aaa); }
  .dot { inline-size: 8px; block-size: 8px; border-radius: 50%; background: #8ab4f8; flex: none; }
  .dot[data-state="applied"] { background: #6dd58c; }
  .dot[data-state="discarded"], .dot[data-state="rolled_back"] { background: #888; }
  .body { padding: 0 14px 14px; max-block-size: min(70vh, 720px); overflow: auto; }
  .scope { margin: 0 0 10px; color: var(--color-muted, #bbb); line-height: 1.45; }
  .tabs { display: flex; gap: 6px; margin-block-end: 10px; }
  .tabs button, .actions button { border: 1px solid var(--color-border, rgba(255,255,255,.14)); background: none; color: inherit; border-radius: 999px; padding: 5px 12px; font: inherit; cursor: pointer; }
  .tabs button[aria-selected="true"] { background: var(--color-hover, rgba(255,255,255,.08)); }
  .file, .terminal { margin-block-end: 12px; border: 1px solid var(--color-border, rgba(255,255,255,.1)); border-radius: 10px; overflow: hidden; }
  .file header, .terminal header { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,.03); }
  .badge { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(138,180,248,.18); }
  .badge[data-change="created"] { background: rgba(109,213,140,.2); }
  .badge[data-change="deleted"] { background: rgba(230,102,102,.22); }
  .file small { margin-inline-start: auto; color: var(--color-muted, #aaa); }
  pre { margin: 0; padding: 8px 10px; overflow: auto; max-block-size: 320px; font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre; }
  .diff .add { color: #6dd58c; } .diff .del { color: #f28b82; } .diff .hunk { color: #8ab4f8; } .diff .meta { color: #999; }
  .out { background: #0d0e10; color: #d7d7d7; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 2px 10px; margin: 0; padding: 8px 10px; font-size: 12px; }
  dt { color: var(--color-muted, #999); } dd { margin: 0; min-inline-size: 0; overflow-wrap: anywhere; }
  .terminal header span { margin-inline-start: auto; }
  .pass { color: #6dd58c; } .fail { color: #f28b82; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-block-start: 6px; }
  .actions .primary { background: #e8eaed; color: #111; border-color: transparent; }
  .actions button:disabled { opacity: .5; cursor: default; }
  .warn, .note { color: var(--color-muted, #bbb); margin: 6px 0; } .warn { color: #fdd663; }
  .error { color: #f28b82; margin: 6px 0; }
</style>
