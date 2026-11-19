<script lang="ts">
  import { onMount } from "svelte";
  import SearchField from "$shared/ui/SearchField";
  import IconButton from "$shared/ui/IconButton";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import { Cancel01Icon } from "@hugeicons/core-free-icons";
  import { browserTabs } from "./browser-tabs.svelte";
  import { browserHost, type DownloadRow } from "./browser-host";

  let { page }: { page: "history" | "downloads" | "bookmarks" } = $props();
  let query = $state("");
  let count = $state(50);
  let files = $state<DownloadRow[]>([]);
  let failed = $state(false);
  const title = $derived({history:"History", downloads:"Downloads", bookmarks:"Bookmarks"}[page]);
  const entries = $derived((page === "history" ? browserTabs.history : browserTabs.kept)
    .filter(row => (row.title + " " + row.url).toLowerCase().includes(query.trim().toLowerCase())));
  const downloaded = $derived(files.filter(row => row.filename.toLowerCase().includes(query.trim().toLowerCase())));

  onMount(() => {
    if (page !== "downloads") return;
    let live = true;
    async function load() {
      try { const rows = await browserHost.downloads(); if (live) { files = rows; failed = false; } }
      catch { if (live) failed = true; }
    }
    void load();
    const timer = setInterval(load, 1200);
    return () => { live = false; clearInterval(timer); };
  });
</script>

<section class="records" aria-label={title}>
  <header><h1>{title}</h1><IconButton icon={Cancel01Icon} label={"Close " + title.toLowerCase()} onclick={() => browserTabs.page = null} /></header>
  <SearchField label={"Filter " + title.toLowerCase()} placeholder={"Filter " + title.toLowerCase()} bind:value={query} />
  <SettingsGroup title={page === "downloads" ? "This session" : "This browser"}>
    {#if page === "downloads"}
      {#each downloaded as row (row.id)}
        <SettingsRow title={row.filename} description={row.state === "progressing" && row.total > 0 ? Math.round(row.received * 100 / row.total) + "% downloaded" : row.state}>
          <button type="button" disabled={row.state !== "completed"} onclick={() => void browserHost.showDownload(row.id)}>Show in folder</button>
        </SettingsRow>
      {:else}<p>{failed ? "Downloads are unavailable." : "No downloads to show."}</p>{/each}
    {:else}
      {#each entries.slice(0, count) as row (row.url)}
        <SettingsRow title={row.title || row.url} description={row.url}>
          <div class="actions">
            <button type="button" aria-label={"Open " + (row.title || row.url)} onclick={() => browserTabs.openAddress(row.url)}>Open</button>
            {#if page === "bookmarks"}
              <button type="button" aria-label={"Remove " + (row.title || row.url)} onclick={() => browserTabs.forgetKept(row.url)}>Remove</button>
            {/if}
          </div>
        </SettingsRow>
      {:else}<p>{page === "bookmarks" ? "Drag a tab to the shelf to keep it." : "No matching pages."}</p>{/each}
      {#if entries.length > count}<p><button type="button" onclick={() => count += 50}>Show more</button></p>{/if}
    {/if}
  </SettingsGroup>
</section>

<style>
  .records { block-size: 100%; overflow: auto; max-inline-size: 820px; margin: auto; padding: 32px clamp(14px, 4vw, 48px); }
  header { display: flex; align-items: center; justify-content: space-between; margin-block-end: 16px; }
  header h1 { margin: 0; font: 550 24px var(--font-sans); }
  .records :global(form) { margin-block-end: 20px; }
  p { padding: 12px 18px; color: var(--color-muted); font-size: 13px; }
  .actions { display: flex; gap: 5px; }
  button { padding: 6px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-capsule); background: var(--color-fill); color: var(--color-text); font: 12px var(--font-sans); }
  button:disabled { opacity: .55; }
</style>
