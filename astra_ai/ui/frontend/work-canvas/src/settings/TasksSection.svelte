<script lang="ts">
  /*
   * V33 §12: Tasks settings. AEGIS has one task list, kept by the AEGIS server (the task store behind
   * /api/workspace/v21 and /api/workspace/v22/resources, and the assistant's /api/tasks/v1). Every entry
   * point reads and writes it: the Browse Tasks page (Zephium's TasksPage), the new tab's "Due today", the
   * sidebar tray, Work's Tasks panel, tasks made from research results, and tasks the assistant creates.
   * The counts here are read from it, never made up.
   */
  import { onMount } from "svelte";
  import SettingsGroup from "$shared/ui/SettingsGroup";
  import SettingsRow from "$shared/ui/SettingsRow";
  import Switch from "$shared/ui/Switch";
  import { browserSettings } from "../browser-settings.svelte";
  import { browserTabs } from "../browser-tabs.svelte";
  import { openTasks, today, type TaskRow } from "../today-tasks.svelte";
  import { api } from "./api";
  import { settingsView } from "./settings-view.svelte";

  let { onclose }: { onclose: () => void } = $props();
  let totals = $state<{ open: number; done: number } | null>(null);
  let failed = $state(false);

  onMount(() => {
    void today.read();
    api<{ items?: TaskRow[] }>("/api/workspace/v21/tasks")
      .then((body) => {
        const rows = (body.items ?? []).filter((row) => !row.trashed);
        totals = { open: rows.filter((row) => row.status !== "done").length, done: rows.filter((row) => row.status === "done").length };
      })
      .catch(() => (failed = true));
  });

  function open() {
    if (browserTabs.available) {
      settingsView.dismiss();
      browserTabs.page = "tasks";
    } else {
      onclose();
      openTasks();
    }
  }
</script>

<SettingsGroup title="Your tasks" description="One list for all of AEGIS: the Tasks page, the new tab, the sidebar, Work's Tasks panel, tasks made from research, and tasks the assistant creates.">
  <SettingsRow title="Today" description={today.counts ? `${today.counts.today} due today · ${today.counts.overdue} overdue` : today.failed || failed ? "Tasks can't be read right now. Restarting the AEGIS server usually fixes it." : "Reading…"} settingId="tasks.today">
    <button type="button" class="pill primary" onclick={open}>Open Tasks</button>
  </SettingsRow>
  <SettingsRow title="All tasks" description={totals ? `${totals.open} open · ${totals.done} done` : failed ? "Unavailable" : "Reading…"} settingId="tasks.totals">
    <span class="muted">Kept by the AEGIS server</span>
  </SettingsRow>
</SettingsGroup>
<SettingsGroup title="Where tasks show">
  <SettingsRow title="Tasks due today on the new tab" settingId="tasks.newtab">
    <Switch label="Tasks due today on the new tab" labelHidden checked={browserSettings.value.figures.due} onchange={(on) => browserSettings.update((d) => { d.figures.due = on; })} />
  </SettingsRow>
</SettingsGroup>
