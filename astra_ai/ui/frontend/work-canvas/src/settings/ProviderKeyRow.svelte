<!-- Adapts Zephium’s AiProviderRow under MPL-2.0. See work-canvas/NOTICE.md. -->
<script lang="ts">
  import { tick } from "svelte";
  import Icon from "$shared/ui/Icon";
  import ProviderMark from "$shared/ui/ProviderMark";
  import Button from "$shared/ui/Button";
  import Field from "$shared/ui/Field";
  import { Key01Icon } from "@hugeicons/core-free-icons";

  let { title, description, keyName, provider, configured, disabled, secret, save, test }: {
    title: string; description: string; keyName: string; provider?: "google" | "groq" | "open_ai";
    configured: boolean | null; disabled: boolean; secret: boolean;
    save: (value: string) => Promise<boolean>; test?: () => unknown;
  } = $props();

  let editing = $state(false);
  let entry = $state("");
  let form = $state<HTMLFormElement>();
  let add = $state<HTMLElement>();
  function cancel() {
    editing = false;
    entry = "";
    void tick().then(() => add?.focus());
  }
  function open() {
    editing = true;
    void tick().then(() => form?.querySelector("input")?.focus());
  }
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!entry.trim() || disabled) return;
    if (await save(entry)) cancel();
  }
</script>

<div class="ai-row" data-setting={"keys." + keyName} data-editing={editing}>
  <div class="head">
    <span class="tile" aria-hidden="true">{#if provider}<ProviderMark {provider} size={20} />{:else}<Icon icon={Key01Icon} size={18} />{/if}</span>
    <div class="copy">
      <h3>{title}</h3>
      <p>{description}</p>
      <p><span class="status" data-tone={configured ? "valid" : undefined}><span class="dot" aria-hidden="true"></span>{configured === null ? "Checking…" : configured ? "Set" : "Not set"}</span></p>
    </div>
    {#if !editing}
      <div class="actions">
        {#if test && configured}<Button variant="ghost" size="compact" {disabled} onclick={test}>Test</Button>{/if}
        <Button bind:ref={add} size="compact" {disabled} onclick={open}>{configured ? (secret ? "Replace key" : "Change") : (secret ? "Add key" : "Set value")}</Button>
      </div>
    {/if}
  </div>
  {#if editing}
    <form class="editor" bind:this={form} onsubmit={submit}>
      <Field label={title + (secret ? " key" : "")} labelHidden type={secret ? "password" : "text"} bind:value={entry} autocomplete="off" spellcheck="false" />
      <div class="buttons">
        <Button type="button" size="compact" variant="ghost" {disabled} onclick={cancel}>Cancel</Button>
        <Button size="compact" variant="primary" type="submit" disabled={disabled || !entry.trim()}>Save</Button>
      </div>
    </form>
  {/if}
</div>

<style>
  /* Row metrics match SettingsRow exactly; this row carries a mark and can
     open into its own small form. */
  .ai-row {
    position: relative;
    box-sizing: border-box;
    padding: 12px 18px 12px 14px;
  }

  :global(.ai-row) + .ai-row::before {
    content: "";
    position: absolute;
    inset-inline: 58px 0;
    top: 0;
    height: 1px;
    background: var(--color-border);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: calc(var(--row-page) - 24px);
  }

  .tile {
    display: grid;
    flex: none;
    inline-size: 32px;
    block-size: 32px;
    border-radius: var(--radius-control);
    background: var(--color-fill);
    color: var(--color-text);
    place-items: center;
  }

  .copy {
    flex: 1;
    min-width: 0;
  }

  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-page-title);
    font-weight: 500;
    line-height: 19px;
    letter-spacing: -0.008em;
  }

  .copy p {
    margin: 2px 0 0;
    overflow: hidden;
    color: var(--color-muted);
    font-size: var(--text-label);
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    inline-size: 6px;
    block-size: 6px;
    border-radius: var(--radius-capsule);
    background: var(--color-faint);
  }

  .status[data-tone="valid"] .dot {
    background: var(--color-success);
  }

  .status[data-tone="invalid"] {
    color: var(--color-danger);
  }

  .status[data-tone="invalid"] .dot {
    background: var(--color-danger);
  }

  .actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 4px;
  }

  :global(.ai-row-more) {
    display: grid;
    inline-size: 28px;
    block-size: 28px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control-compact);
    background: transparent;
    color: var(--color-muted);
    place-items: center;
    transition: background-color var(--motion-instant) var(--ease-smooth);
  }

  :global(.ai-row-more:hover),
  :global(.ai-row-more[data-state="open"]) {
    background: var(--color-fill-hover);
    color: var(--color-text);
  }

  :global(.ai-row-more:focus-visible) {
    outline: 2px solid var(--color-ring);
    outline-offset: 1px;
  }

  .editor {
    display: grid;
    gap: 10px;
    margin: 12px 0 2px 44px;
    animation: editor-in var(--motion-base) var(--ease-out);
  }

  @keyframes editor-in {
    from {
      opacity: 0;
      translate: 0 -4px;
    }
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .message {
    margin: 8px 0 0 44px;
    white-space: normal;
  }

</style>
