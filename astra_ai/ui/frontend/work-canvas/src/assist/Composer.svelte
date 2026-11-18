<!-- Adapted from Zephium frame/src/features/assist/components/Composer.svelte
     Commit 9026a1fffad74d6e201ef97fe8c02c1b01403cd2. MPL-2.0, see upstream/LICENSE.
     AEGIS supplies the draft, session state and callbacks. -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { AssistComposerState } from "./types";
  import Icon from "$shared/ui/Icon";
  import Add01Icon from "@hugeicons/core-free-icons/Add01Icon";
  import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon";
  import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
  import StopIcon from "@hugeicons/core-free-icons/StopIcon";

  let { state: model }: { state: AssistComposerState } = $props();
  let field = $state<HTMLTextAreaElement>();
  let menu = $state(false);
  const draft = $derived(model.draft);
  const off = $derived(model.disabled);
  const busy = $derived(model.busy);
  const ready = $derived(!!draft.trim() && !off && !busy && !model.sending);
  const action = $derived(busy ? "stop" : draft.trim() ? "send" : "mic");
  onMount(() => field?.focus());

  function grow() {
    if (!field) return;
    field.style.blockSize = "auto";
    field.style.blockSize = `${Math.min(field.scrollHeight, 168)}px`;
  }
  $effect(() => {
    void draft;
    void tick().then(grow);
  });

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      menu = false;
    }
  }

  function send() {
    if (ready) model.send(draft);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && busy) {
      event.preventDefault();
      event.stopPropagation();
      model.stop();
    } else if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send();
    }
  }
</script>

<form class="surface composer" aria-label="Research chat input" data-off={off || undefined}
  onsubmit={(event) => { event.preventDefault(); send(); }}>
    <textarea
      bind:this={field}
      aria-label="Ask Aegis…"
      placeholder="Ask Aegis…"
      rows="1"
      maxlength={12000}
      disabled={off}
      value={draft}
      oninput={(event) => {
        model.change(event.currentTarget.value);
      }}
      {onkeydown}></textarea>
  <div class="bar">
    <div class="assist-add">
      <button class="tool" type="button" aria-label="Add chat context" aria-expanded={menu} disabled={off}
        onclick={() => (menu = !menu)}><Icon icon={Add01Icon} size={16} /></button>
      {#if menu}
        <div class="assist-add-menu" role="group" aria-label="Chat context">
          {#if model.hasNativeBrowser}<button type="button" onkeydown={closeOnEscape} onclick={() => { menu = false; model.openTool("browser"); }}>Browser context</button>{/if}
          <button type="button" onkeydown={closeOnEscape} onclick={() => { menu = false; model.openTool("work"); }}>Continue in Work</button>
        </div>
      {/if}
    </div>
    <span class="grow"></span>
    <span class="model">
      <button type="button" class="model-trigger" onclick={model.models} title="Model settings">{model.model}</button>
    </span>
    <div class="action" data-action={action}>
      <button
        type="button"
        class="round mic"
        aria-label={model.muted ? "Start voice chat" : "Mute microphone"}
        title={model.muted ? "Start voice chat" : "Mute microphone"}
        aria-pressed={!model.muted}
        disabled={off || model.sending}
        inert={action !== "mic"}
        onclick={model.microphone}
        ><Icon icon={Mic01Icon} size={16} strokeWidth={1.7} /></button
      >
      <button
        type="submit"
        class="round send"
        aria-label="Send message"
        title="Send message"
        disabled={!ready}
        inert={action !== "send"}><Icon icon={ArrowUp02Icon} size={15} strokeWidth={2.2} /></button
      >
      <button
        type="button"
        class="round send stop"
        aria-label="Stop response"
        title="Stop response"
        inert={action !== "stop"}
        onclick={model.stop}><Icon icon={StopIcon} size={11} /></button
      >
    </div>
  </div>
</form>
<style>
  /* One soft plate: the lifted material of the sidebar's own field, rounded
     like a sheet, with a hairline and a breath of shadow so it stands on the
     column rather than in it. */
  .composer {
    display: flex;
    flex: none;
    flex-direction: column;
    margin: 4px 10px 10px;
    padding: 4px;
    border-radius: var(--radius-card);
    background: var(--row-active);
    box-shadow: var(--shine-top), var(--shadow-raised);
    transition: box-shadow var(--motion-fast) var(--ease-out);
  }

  .composer:focus-within {
    box-shadow: var(--shine-top), var(--shadow-raised), var(--shadow-field-focus);
  }

  textarea {
    inline-size: 100%;
    min-block-size: 40px;
    max-block-size: 168px;
    box-sizing: border-box;
    padding: 10px 10px 8px;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-size: var(--text-page-title);
    letter-spacing: -0.004em;
    line-height: 22px;
    resize: none;
  }

  textarea::placeholder {
    color: var(--color-faint);
  }

  .composer[data-off] textarea {
    opacity: 0.5;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 2px;
    min-inline-size: 0;
    block-size: 32px;
  }

  .grow {
    flex: 1;
  }

  .bar .tool {
    display: grid;
    flex: none;
    place-items: center;
    inline-size: 28px;
    block-size: 28px;
    margin-inline-start: 2px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control-compact);
    background: transparent;
    color: var(--color-muted);
    cursor: default;
    transition:
      background-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }

  .bar .tool:hover,
  .bar .tool[aria-expanded="true"] {
    background: var(--color-fill-hover);
    color: var(--color-text);
  }

  .bar .tool:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 1px;
  }

  /* The model reads as words, the effort a step quieter; it is a control
     only under the pointer. */
  .model {
    display: flex;
    min-inline-size: 0;
    margin-inline-end: 2px;
  }

  .bar .model .model-trigger {
    max-inline-size: 100%;
    block-size: 28px;
    margin: 0;
    padding-inline: 8px;
    gap: 0;
    border-radius: var(--radius-control-compact);
    background: transparent;
    box-shadow: none;
    color: var(--color-label-secondary);
    font-size: 12.5px;
    line-height: 28px;
  }

  .bar .model .model-trigger:hover {
    background: var(--color-fill-hover);
    color: var(--color-text);
  }

  .bar .model .model-trigger:active {
    scale: 1;
  }

  /* Mic, Send and Stop share one place and cross over in it. */
  .action {
    display: grid;
    flex: none;
    place-items: center;
    margin-inline-end: 2px;
  }

  .round {
    display: grid;
    grid-area: 1 / 1;
    place-items: center;
    inline-size: 28px;
    block-size: 28px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    cursor: default;
    opacity: 0;
    scale: 0.7;
    transition:
      background-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out),
      opacity var(--motion-fast) var(--ease-out),
      scale var(--motion-base) var(--ease-spring);
  }

  .mic {
    background: transparent;
    color: var(--color-muted);
  }

  .mic:disabled {
    color: var(--color-faint);
  }

  .mic:hover:not(:disabled) {
    background: var(--color-fill-hover);
    color: var(--color-text);
  }

  .mic[aria-pressed="true"] {
    background: var(--color-lit);
    color: var(--color-on-lit);
  }

  .send {
    background: var(--color-lit);
    color: var(--color-on-lit);
  }

  .send:disabled {
    background: var(--color-fill-strong);
    color: var(--color-on-lit);
  }

  .send:hover:not(:disabled) {
    background: var(--color-lit-hover);
  }

  .send:active:not(:disabled) {
    transform: scale(0.9);
  }

  .action[data-action="mic"] .mic,
  .action[data-action="send"] .send:not(.stop),
  .action[data-action="stop"] .stop {
    opacity: 1;
    scale: 1;
  }

  .round:focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .round {
      scale: 1;
      transition: opacity var(--motion-fast) linear;
    }
  }

  :global(:root[data-reduce-motion="true"]) .round {
    scale: 1;
    transition: opacity var(--motion-fast) linear;
  }

  @media (forced-colors: active) {
    .composer,
    .round {
      border: 1px solid ButtonText;
    }
  }

  .assist-add { position: relative; }
  .assist-add-menu {
    position: absolute;
    z-index: 4;
    inset-block-end: calc(100% + 6px);
    inset-inline-start: 0;
    display: grid;
    width: max-content;
    padding: 6px;
    border-radius: var(--radius-card);
    background: var(--row-active);
    box-shadow: var(--shine-top), var(--shadow-raised);
  }
  .assist-add-menu button {
    text-align: start;
    padding: 8px 10px;
    border: 0;
    border-radius: var(--radius-control-compact);
    background: transparent;
    color: var(--color-text);
  }
  .assist-add-menu button:hover { background: var(--color-fill-hover); }
  .model-trigger {
    border: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
