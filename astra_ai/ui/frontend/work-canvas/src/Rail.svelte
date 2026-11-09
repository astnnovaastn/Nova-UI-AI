<script lang="ts">
  import { Popover } from "bits-ui";
  import Icon from "$shared/ui/Icon";
  import {
    AiBrain01Icon,
    BubbleChatIcon,
    Clock01Icon,
    DashboardSquare01Icon,
    FileSearchIcon,
    MoreHorizontalIcon,
    PlusSignIcon,
    Settings01Icon,
  } from "@hugeicons/core-free-icons";
  import { store } from "./store.svelte";

  let more = $state(false);
  const actions = $derived(store.actions);
  const panel = $derived(store.state.panel);
</script>

<nav class="rail" aria-label="AEGIS">
  <button type="button" class="logo" aria-label="AEGIS dashboard" title="AEGIS" onclick={() => actions?.navigate("dashboard")}>
    <span class="mark" aria-hidden="true"></span>
  </button>
  <div class="group">
    <button type="button" aria-label="Dashboard" title="Dashboard" onclick={() => actions?.navigate("dashboard")}>
      <Icon icon={DashboardSquare01Icon} size={19} strokeWidth={1.6} />
    </button>
    <button type="button" aria-label="Memory" title="Memory" onclick={() => actions?.navigate("memory")}>
      <Icon icon={AiBrain01Icon} size={19} strokeWidth={1.6} />
    </button>
    <button type="button" class="selected" aria-label="Research" aria-current="page" title="Research">
      <Icon icon={FileSearchIcon} size={19} strokeWidth={1.6} />
    </button>
  </div>
  <span class="rule" aria-hidden="true"></span>
  <div class="group">
    <button type="button" aria-label="New research" title="New research" onclick={() => actions?.newEntry("research")}>
      <Icon icon={PlusSignIcon} size={19} strokeWidth={1.6} />
    </button>
    <button
      type="button"
      class:selected={panel === "history"}
      aria-label="Research library"
      aria-expanded={panel === "history"}
      title="Research library"
      onclick={() => actions?.openPanel("history")}
    >
      <Icon icon={Clock01Icon} size={19} strokeWidth={1.6} />
    </button>
    <button
      type="button"
      class:selected={panel === "conversation"}
      aria-label="Research conversation"
      aria-expanded={panel === "conversation"}
      title="Research conversation"
      onclick={() => actions?.openPanel("conversation")}
    >
      <Icon icon={BubbleChatIcon} size={19} strokeWidth={1.6} />
    </button>
  </div>
  <span class="gap"></span>
  <div class="group">
    <Popover.Root bind:open={more}>
      <Popover.Trigger aria-label="More" title="More">
        <Icon icon={MoreHorizontalIcon} size={19} strokeWidth={1.6} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="right" sideOffset={10} align="end" class="aegis-menu">
          <button type="button" onclick={() => { more = false; actions?.useClassic(); }}>Classic Research view</button>
          <button type="button" onclick={() => { more = false; actions?.restart(); }}>Restart server</button>
          <button type="button" onclick={() => { more = false; actions?.repair(); }}>Fix yourself</button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    <button type="button" aria-label="Settings" title="Settings" onclick={() => actions?.settings()}>
      <Icon icon={Settings01Icon} size={19} strokeWidth={1.6} />
    </button>
  </div>
</nav>

<style>
  /* Part of the outer shell, not a card on the canvas: it shares the shell's ground. */
  .rail {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    inline-size: var(--aegis-rail-width);
    block-size: 100%;
    padding: 14px 0 12px;
    color: var(--color-muted);
  }

  .group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .gap {
    flex: 1;
  }

  .rule {
    flex: none;
    inline-size: 26px;
    block-size: 1px;
    background: var(--color-border);
  }

  .rail button,
  .rail :global([data-popover-trigger]) {
    display: grid;
    place-items: center;
    inline-size: 40px;
    block-size: 40px;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }

  .rail button:hover,
  .rail :global([data-popover-trigger]:hover) {
    background: var(--aegis-shell-raised);
    color: var(--color-text);
  }

  .rail button:focus-visible,
  .rail :global([data-popover-trigger]:focus-visible) {
    outline: 2px solid var(--color-focus, currentcolor);
    outline-offset: 1px;
  }

  .rail button.selected {
    background: var(--aegis-shell-raised);
    color: var(--color-text);
  }

  .rail .logo {
    margin-block-end: 6px;
  }

  .rail .logo:hover {
    background: transparent;
  }

  .mark {
    inline-size: 28px;
    block-size: 28px;
    background: var(--color-text);
    mask: url("/assets/aegis_logo.svg") center / contain no-repeat;
  }

  :global(.aegis-menu) {
    z-index: 60;
    display: flex;
    flex-direction: column;
    min-inline-size: 200px;
    padding: 6px;
    border-radius: var(--radius-menu);
    background: var(--color-float);
    box-shadow: var(--shadow-popover);
    color: var(--color-text);
    pointer-events: auto;
  }

  :global(.aegis-menu button),
  :global(.aegis-menu .aegis-menu-label) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font-size: var(--text-body);
    text-align: start;
  }

  :global(.aegis-menu button) {
    cursor: pointer;
  }

  :global(.aegis-menu button:hover:not(:disabled)),
  :global(.aegis-menu button:focus-visible) {
    background: color-mix(in srgb, var(--color-text) 9%, transparent);
    outline: none;
  }

  :global(.aegis-menu button:disabled) {
    opacity: 0.45;
    cursor: default;
  }

  :global(.aegis-menu button[aria-pressed="true"]) {
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
  }

  :global(.aegis-menu .aegis-menu-label) {
    padding-block: 6px 2px;
    color: var(--color-muted);
    font-size: var(--text-label);
  }

  :global(.aegis-menu small) {
    color: var(--color-muted);
    font-size: var(--text-label);
  }
</style>
