<script lang="ts">
  /* Zephium's ask cards, built exactly as tests/WorkAsksLook.component.test.ts builds them. */
  import AsksSheet from "$features/work/tests/AsksSheet.svelte";
  import { asksOf } from "$features/work/components/asks/asks";
  import type { AskActions } from "$features/work/components/asks/actions";
  import * as f from "$features/work/tests/ask-fixtures";

  let { onlog }: { onlog?: (text: string, simulated?: boolean) => void } = $props();

  const execution = f.runWith([
    f.slackTask,
    f.slackEntry,
    f.slackSend,
    f.airbnbBook,
    f.notionEdit,
    f.typeSearch,
    f.deleteRepo,
    f.historyAsk,
    f.notesAsk,
    f.tabsAsk,
    f.githubAsk,
    f.folderAsk,
    f.documentsAsk,
    f.addressAsk,
    f.budgetAsk,
    f.notionTask,
    f.settled(f.decided(f.slackSend, "approved", "succeeded"), { id: "sent" }),
    f.settled(f.decided(f.airbnbBook, "declined", "cancelled"), { id: "declined" }),
    f.settled(f.answered(f.slackEntry, "Always for Slack"), { id: "entry-always" }),
    f.settled(f.answered(f.folderAsk, "Allow for this work"), { id: "folder-allowed" }),
  ]);
  const rows = asksOf(execution, [f.tripPage], [f.notionWall]).map((ask) => ({
    name: `${ask.kind}-${ask.step}`,
    ask,
  }));
  const actions: AskActions = {
    confirm: async (step, decision) => {
      onlog?.(`Confirm “${decision}” on ${step} → would go to the run through Rust`, true);
      return true;
    },
    answer: async (step, text) => {
      onlog?.(`Answered “${text}” on ${step} → would go to the run`, true);
      return true;
    },
    openPage: (step) => onlog?.(`Show the held page for ${step}`, true),
    signedIn: async () => {
      onlog?.("Signed in → the held page would carry on", true);
      return true;
    },
    chooseFolder: async () => {
      onlog?.("Choose folder → the system's folder panel (native)", true);
      return null;
    },
  };
</script>

<div class="scroll scrolls">
  <p class="key">Each row: the ask on the canvas · in the island · as the canvas shows it at 50%</p>
  <AsksSheet {rows} {actions} />
</div>

<style>
  .scroll {
    position: absolute;
    inset: 0;
    overflow: auto;
    background: var(--color-canvas);
  }

  .key {
    margin: 0;
    padding: 64px 32px 0;
    color: var(--color-muted);
    font-size: 12px;
  }
</style>
