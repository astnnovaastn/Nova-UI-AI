<!-- Adapted from Zephium frame/src/features/assist/components/Empty.svelte,
     commit 9026a1fffad74d6e201ef97fe8c02c1b01403cd2, MPL-2.0. -->
<script lang="ts">
  import Icon from "$shared/ui/Icon";
  import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon";
  let { context }: { context: boolean } = $props();
</script>
<div class="start">
  <span class="mark" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="1" width="34" height="34" rx="10"/><path d="m8 25 8-14h4l8 14M12 20h12M15 25h6"/></svg></span>
  <h3 class="greeting">How can I help?</h3>
  <p class="aside"><Icon icon={InformationCircleIcon} size={14} strokeWidth={1.7} />
    <span>{context ? "Ask a question about this research." : "Open a report to ask about its findings."}</span>
  </p>
</div>
<style>
  .start {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-block-start: auto;
    padding: 0 2px 8px;
  }

  .mark {
    display: block;
    inline-size: 36px;
    block-size: 36px;
    margin-block-end: 14px;
  }

  .greeting {
    margin: 0;
    color: var(--color-text);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.022em;
    line-height: 26px;
    text-wrap: balance;
  }

  .aside {
    display: flex;
    gap: 7px;
    margin: 10px 0 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 19px;
    text-wrap: pretty;
  }

  .aside > :global(svg) {
    flex: none;
    margin-block-start: 2.5px;
    color: var(--color-faint);
  }

</style>
