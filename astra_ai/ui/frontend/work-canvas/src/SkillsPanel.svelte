<!--
  The person's skill library, after Zephium Work's Settings › Skills (MPL-2.0 source in
  zephium-source/frame). A skill is instructions the AEGIS lead follows for a kind of job; it never
  adds a model, a tool or a permission. Built-ins can be read, turned off or copied; the person's own
  can be written, edited and removed. The research open on the canvas shows the skill it used.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { store } from "./store.svelte";
  import { workApi, workPanels } from "./work-panels.svelte";

  type SkillRow = { name: string; title: string; description: string; category: string; source: string; origin: string; enabled: boolean; version: string; triggers: string[] };
  let skills = $state<SkillRow[]>([]);
  let query = $state("");
  let error = $state("");
  let loading = $state(true);
  let opened = $state<{ row: SkillRow; text: string; body: string } | null>(null);
  let editing = $state<{ name: string; text: string; isNew: boolean } | null>(null);
  let busy = $state(false);

  const used = $derived((store.state.run as { plan?: { skill?: { name: string; version: string; chosen: string } } } | null | undefined)?.plan?.skill ?? null);
  const shown = $derived.by(() => {
    const words = query.trim().toLowerCase();
    return skills.filter((row) => !words || `${row.title} ${row.description} ${row.category} ${row.triggers.join(" ")}`.toLowerCase().includes(words));
  });
  const groups = $derived.by(() => {
    const order = ["research", "founder", "marketing", "designer", "developer", "student", "manager", "office"];
    const by = new Map<string, SkillRow[]>();
    for (const row of shown) by.set(row.category, [...(by.get(row.category) ?? []), row]);
    return [...by.entries()].sort((a, b) => (order.indexOf(a[0]) + 99) % 99 - (order.indexOf(b[0]) + 99) % 99);
  });

  async function load() {
    loading = true;
    try {
      skills = (await workApi<{ skills: SkillRow[] }>("/api/work/skills")).skills;
      error = "";
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
  onMount(load);

  async function open(row: SkillRow) {
    try {
      const found = await workApi<{ text: string; skill: { body: string } }>(`/api/work/skills/${encodeURIComponent(row.name)}`);
      opened = { row, text: found.text, body: found.skill.body };
    } catch (e) {
      error = (e as Error).message;
    }
  }
  async function toggle(row: SkillRow) {
    busy = true;
    try {
      await workApi(`/api/work/skills/${encodeURIComponent(row.name)}/enabled`, { method: "POST", body: JSON.stringify({ enabled: !row.enabled }) });
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function duplicate(row: SkillRow) {
    const name = `my-${row.name}`.slice(0, 40);
    try {
      await workApi(`/api/work/skills/${encodeURIComponent(row.name)}/duplicate`, { method: "POST", body: JSON.stringify({ name }) });
      await load();
      const copy = skills.find((entry) => entry.name === name);
      if (copy) await edit(copy);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  async function edit(row: SkillRow) {
    const found = await workApi<{ text: string }>(`/api/work/skills/${encodeURIComponent(row.name)}`);
    editing = { name: row.name, text: found.text, isNew: false };
    opened = null;
  }
  function create() {
    editing = {
      name: "",
      isNew: true,
      text: "---\nname: my-skill\ntitle: My skill\ndescription: One line on when this applies.\ncategory: research\ntriggers: [words, that, choose, it]\n---\n\n# My skill\n\n## Gather\n- What to look for and where.\n\n## Result\n- The sections and tables the report should have.\n",
    };
    opened = null;
  }
  async function save() {
    if (!editing) return;
    const name = /^name:\s*(.+)$/m.exec(editing.text)?.[1]?.trim() ?? "";
    busy = true;
    try {
      await workApi(`/api/work/skills/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify({ text: editing.text }) });
      editing = null;
      error = "";
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function remove(row: SkillRow) {
    busy = true;
    try {
      await workApi(`/api/work/skills/${encodeURIComponent(row.name)}`, { method: "DELETE" });
      opened = null;
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<section class="work-panel" aria-label="Skills">
  <header>
    <h2>Skills</h2>
    <button type="button" class="ghost" onclick={create}>New skill</button>
    <button type="button" class="close" aria-label="Close skills" onclick={() => (workPanels.open = "")}>×</button>
  </header>
  <p class="lede">Instructions AEGIS follows for a kind of research. A skill shapes what is gathered and how the report is built; it never adds a model or a tool.</p>
  {#if used}
    <p class="used" data-used={used.name}>This research used <strong>{skills.find((row) => row.name === used.name)?.title ?? used.name}</strong> · v{used.version} · {used.chosen === "workflow" ? "from the workflow you chose" : "matched your request"}</p>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}

  {#if editing}
    <div class="editor">
      <label for="skill-text">{editing.isNew ? "New skill" : `Edit ${editing.name}`} <span>SKILL.md: a --- header, then the instructions</span></label>
      <textarea id="skill-text" bind:value={editing.text} spellcheck="false" rows="18"></textarea>
      <div class="row">
        <button type="button" class="primary" disabled={busy} onclick={save}>Save</button>
        <button type="button" class="ghost" onclick={() => (editing = null)}>Cancel</button>
      </div>
    </div>
  {:else if opened}
    <div class="detail">
      <button type="button" class="back" onclick={() => (opened = null)}>← All skills</button>
      <h3>{opened.row.title}</h3>
      <p class="meta">{opened.row.source === "user" ? "Yours" : "Built-in"} · v{opened.row.version}{opened.row.origin ? ` · ${opened.row.origin}` : ""}</p>
      <p>{opened.row.description}</p>
      {#if opened.row.triggers.length}<p class="meta">Chosen when a request says: {opened.row.triggers.join(", ")}</p>{/if}
      <pre>{opened.body}</pre>
      <div class="row">
        {#if opened.row.source === "user"}
          <button type="button" class="primary" onclick={() => opened && edit(opened.row)}>Edit</button>
          <button type="button" class="danger" disabled={busy} onclick={() => opened && remove(opened.row)}>Delete</button>
        {:else}
          <button type="button" class="primary" onclick={() => opened && duplicate(opened.row)}>Duplicate to edit</button>
        {/if}
      </div>
    </div>
  {:else}
    <input class="search" type="search" placeholder="Search skills" aria-label="Search skills" bind:value={query} />
    {#if loading}<p class="meta">Loading…</p>{/if}
    {#each groups as [category, rows] (category)}
      <h4>{category}</h4>
      <ul>
        {#each rows as row (row.name)}
          <li class:off={!row.enabled} class:current={used?.name === row.name}>
            <button type="button" class="item" onclick={() => open(row)}>
              <strong>{row.title}</strong>
              <span>{row.description}</span>
              <em>{row.source === "user" ? "Yours" : row.origin ? "Built-in · from Zephium" : "Built-in"}</em>
            </button>
            <label class="switch" title={row.enabled ? "Turn off" : "Turn on"}>
              <input type="checkbox" checked={row.enabled} disabled={busy} onchange={() => toggle(row)} aria-label={`${row.title} enabled`} />
              <span></span>
            </label>
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
</section>

<style>
  .work-panel {
    position: absolute;
    inset-block: 12px;
    inset-inline-start: 64px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
    inline-size: min(380px, calc(100vw - 96px));
    padding: 14px 14px 12px;
    overflow-y: auto;
    border-radius: 14px;
    background: var(--color-raised);
    box-shadow: 0 0 0 1px var(--color-border), var(--shadow-float);
    color: var(--color-text);
    font: 13px/1.45 var(--font-sans, Inter, sans-serif);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 650;
  }
  h3 {
    margin: 4px 0 0;
    font-size: 15px;
  }
  h4 {
    margin: 10px 0 2px;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  p {
    margin: 0;
  }
  .lede,
  .meta {
    color: var(--color-muted);
    font-size: 12px;
  }
  .used {
    padding: 7px 10px;
    border-radius: 9px;
    background: color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 14%, transparent);
    font-size: 12px;
  }
  .error {
    color: var(--aegis-status-failed, #f0605a);
    font-size: 12px;
  }
  button {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--color-ring, var(--color-text));
    outline-offset: 1px;
  }
  .close {
    inline-size: 26px;
    block-size: 26px;
    border-radius: 8px;
    font-size: 18px;
    line-height: 1;
  }
  .ghost,
  .primary,
  .danger,
  .back {
    padding: 5px 11px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    font-size: 12px;
  }
  .primary {
    background: var(--color-text);
    color: var(--color-canvas, #111);
  }
  .danger {
    color: var(--aegis-status-failed, #f0605a);
  }
  .back {
    align-self: flex-start;
  }
  .search {
    padding: 7px 10px;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 9px;
  }
  li.current {
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 60%, transparent);
  }
  li.off .item {
    opacity: 0.5;
  }
  .item {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-inline-size: 0;
    padding: 6px 8px;
    border-radius: 9px;
    text-align: start;
  }
  .item:hover {
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
  }
  .item span {
    overflow: hidden;
    color: var(--color-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item em {
    color: var(--color-muted);
    font-size: 10.5px;
    font-style: normal;
  }
  .switch {
    position: relative;
    flex: none;
    inline-size: 30px;
    block-size: 18px;
    margin-inline-end: 4px;
  }
  .switch input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .switch span {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-text) 18%, transparent);
    pointer-events: none;
    transition: background 150ms ease;
  }
  .switch span::after {
    content: "";
    position: absolute;
    inset-block-start: 3px;
    inset-inline-start: 3px;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 999px;
    background: var(--color-text);
    transition: transform 150ms ease;
  }
  .switch input:checked + span {
    background: color-mix(in oklab, var(--aegis-strand-green, #3fdc84) 70%, transparent);
  }
  .switch input:checked + span::after {
    transform: translateX(12px);
  }
  .switch input:focus-visible + span {
    outline: 2px solid var(--color-text);
    outline-offset: 1px;
  }
  .detail,
  .editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  pre {
    max-block-size: 42vh;
    margin: 0;
    padding: 10px;
    overflow: auto;
    border-radius: 9px;
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
    font: 11.5px/1.5 var(--font-mono, ui-monospace, monospace);
    white-space: pre-wrap;
  }
  label span {
    color: var(--color-muted);
    font-size: 11px;
  }
  textarea {
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    background: transparent;
    color: inherit;
    font: 11.5px/1.5 var(--font-mono, ui-monospace, monospace);
    resize: vertical;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  @media (prefers-reduced-motion: reduce) {
    .switch span,
    .switch span::after {
      transition: none;
    }
  }
</style>
