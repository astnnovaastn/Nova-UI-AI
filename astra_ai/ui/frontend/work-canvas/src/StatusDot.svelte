<!-- A status dot with one documented meaning (see status.ts): shape and colour both carry it, and it has a name. -->
<script lang="ts">
  import { STATUS_LABEL, type NodeStatus } from "./status";

  let { status, label = "" }: { status: NodeStatus; label?: string } = $props();
  const words = $derived(label || STATUS_LABEL[status]);
</script>

<span class="status-dot" data-status={status} title={words} role="img" aria-label={words}></span>

<style>
  .status-dot {
    flex: none;
    position: relative;
    display: inline-block;
    box-sizing: border-box;
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
  }

  [data-status="queued"] {
    box-shadow: inset 0 0 0 1.5px var(--color-faint);
  }

  [data-status="running"] {
    background: var(--aegis-status-running, #5b9dff);
    animation: status-pulse 1.4s ease-in-out infinite;
  }

  [data-status="waiting"] {
    box-shadow: inset 0 0 0 1.5px var(--aegis-status-waiting, #e2a336);
  }

  [data-status="waiting"]::after {
    content: "";
    position: absolute;
    inset: 2.5px;
    border-radius: 50%;
    background: var(--aegis-status-waiting, #e2a336);
  }

  [data-status="complete"] {
    background: var(--aegis-status-complete, #3fcf7f);
  }

  [data-status="failed"] {
    border-radius: 2px;
    background: var(--aegis-status-failed, #f0605a);
  }

  @keyframes status-pulse {
    50% {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-status="running"] {
      animation: none;
    }
  }
</style>
