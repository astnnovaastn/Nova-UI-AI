<script lang="ts">
  import { onMount } from "svelte";
  import { BitsConfig } from "bits-ui";
  import ProfileMenu from "./ProfileMenu.svelte";
  import SettingsApp from "./SettingsApp.svelte";
  import { settingsView } from "./settings-view.svelte";

  let menu = $state(false);
  let anchor = $state<DOMRect | null>(null);
  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    if (settingsView.isOpen && dialog && !dialog.open) dialog.showModal();
  });

  onMount(() => {
    const profile = (event: Event) => {
      const at = (event as CustomEvent<{ anchor?: DOMRect }>).detail?.anchor ?? document.querySelector<HTMLElement>('.newtab [aria-label="Browser profile"]')?.getBoundingClientRect() ?? null;
      anchor = at;
      menu = !menu;
    };
    window.addEventListener("aegis-profile-menu", profile);
    return () => window.removeEventListener("aegis-profile-menu", profile);
  });
</script>

<ProfileMenu bind:open={menu} {anchor} />
{#if settingsView.isOpen}
  <dialog bind:this={dialog} class="settings-overlay" aria-label="AEGIS Settings" oncancel={(event) => { event.preventDefault(); settingsView.close(); }}>
    {#if dialog}<BitsConfig defaultPortalTo={dialog}>
      <SettingsApp onclose={() => settingsView.close()} />
    </BitsConfig>{/if}
  </dialog>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    border: 0;
    padding: 0;
    overflow: hidden;
    background: var(--color-page);
  }
</style>
