<script lang="ts">
  /*
   * V33 §10: the profile control's menu (the new tab's round profile button). Real information only, and
   * the five things kept apart: the local AEGIS profile, the browser profile (persist:aegis-user), signing
   * in to Google websites, the Google API connection for Work (OAuth), and what AEGIS agents may use.
   * Zephium's AccountButton is not used: it is Zephium's own cloud account service.
   */
  import { tick } from "svelte";
  import Icon from "$shared/ui/Icon";
  import AccountSummary from "$shared/ui/AccountSummary";
  import { ChartBarLineIcon, UserCircleIcon } from "@hugeicons/core-free-icons";
  import { api, type Preferences, type ResearchWriter } from "./api";
  import { settingsView, type SettingsSection } from "./settings-view.svelte";

  let { open = $bindable(false), anchor = null }: { open?: boolean; anchor?: DOMRect | null } = $props();

  let menu = $state<HTMLElement>();
  let name = $state("");
  let writer = $state<ResearchWriter | null>(null);
  let opener: HTMLElement | null = null;
  const used = $derived.by(() => {
    const row = writer?.providers.find(provider => provider.id === writer?.provider && provider.configured);
    if (!row || !Number.isFinite(row.tokens_used) || !(row.token_limit > 0)) return null;
    return Math.max(0, Math.min(100, Math.round(100 * row.tokens_used / row.token_limit)));
  });
  const tone = $derived(used === 100 ? "full" : (used ?? 0) >= 80 ? "high" : "calm");

  $effect(() => {
    if (!open) return;
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const pending = new AbortController();
    const options = { signal: pending.signal };
    const refresh = () => {
      void api<ResearchWriter>("/api/settings/research-provider", options).then((state) => { writer = state; })
        .catch(() => { if (!pending.signal.aborted) writer = null; });
    };
    void api<Preferences>("/api/settings/preferences", options).then((p) => (name = p.user_name)).catch(() => {});
    refresh();
    const update = setInterval(refresh, 5000);
    void tick().then(() => menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    const away = (event: PointerEvent) => { if (!menu?.contains(event.target as Node)) open = false; };
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); open = false; opener?.focus({ preventScroll: true }); return; }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Tab") return;
      const items = [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      const at = items.indexOf(document.activeElement as HTMLElement);
      items[(at + (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey) ? 1 : -1) + items.length) % items.length]?.focus();
      event.preventDefault();
    };
    const timer = setTimeout(() => window.addEventListener("pointerdown", away, true));
    window.addEventListener("keydown", keys, true);
    return () => { clearTimeout(timer); clearInterval(update); pending.abort(); window.removeEventListener("pointerdown", away, true); window.removeEventListener("keydown", keys, true); };
  });

  function go(section: SettingsSection) {
    open = false;
    settingsView.open(section);
  }

  const place = $derived(anchor ? `top:${Math.round(anchor.bottom + 8)}px;right:${Math.max(8, Math.round(window.innerWidth - anchor.right))}px` : "top:56px;right:24px");
</script>

{#if open}
  <div class="profile-menu" role="menu" aria-label="Profile" bind:this={menu} style={place}>
    <div class="summary">
      <AccountSummary email={name || "AEGIS profile"} initials={(name || "A").slice(0, 1).toUpperCase()}
        plan="Local" {used} {tone} barOnly usageLabel={used === null ? "Daily research allowance unavailable" : "Daily research tokens used"} />
    </div>
    <div class="rule" role="separator"></div>
    <div class="items">
      <button type="button" role="menuitem" class="usage-action" onclick={() => go("ai")}><Icon icon={ChartBarLineIcon} size={16} /> Research usage</button>
      <button type="button" role="menuitem" onclick={() => go("accounts")}><Icon icon={UserCircleIcon} size={16} /> Profile and accounts…</button>
    </div>
  </div>
{/if}

<style>
  .profile-menu {
    position: fixed; z-index: 2600; inline-size: min(274px, calc(100vw - 16px)); padding: 6px;
    border-radius: var(--radius-panel, 22px); background: var(--color-menu, var(--color-float));
    box-shadow: var(--shadow-menu); color: var(--color-text); font: 13px var(--font-sans); -webkit-app-region: no-drag;
  }
  .summary { padding: 8px 9px 12px; }
  .rule { block-size: 1px; margin: 0 8px 4px; background: var(--color-border); }
  .items { display: grid; }
  button { display: flex; align-items: center; gap: 9px; min-block-size: 32px; padding: 6px 10px; border: 0; border-radius: var(--radius-row); background: none; color: var(--color-text); font: inherit; text-align: start; cursor: pointer; }
  button.usage-action { background: var(--color-fill); }
  button:hover, button:focus-visible { background: var(--color-fill-active); }
</style>
