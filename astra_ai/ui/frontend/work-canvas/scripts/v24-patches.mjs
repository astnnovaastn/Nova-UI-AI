// MPL-2.0. AEGIS activation seams for original Zephium presentations.
export const v24Patches = [
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "onclick={(event) => type === \"collection\" && (data as any).collection?.kind === \"videos\" ? window.dispatchEvent(new CustomEvent(\"aegis-video-open\",{detail:{id,activation:event}})) : (waiting ? action(id, \"help\") : open(id))}",
    "replace": "onclick={(event) => type === \"collection\" && (data as any).collection?.kind === \"videos\" ? window.dispatchEvent(new CustomEvent(\"aegis-video-open\",{detail:{id,activation:event}})) : type === \"adaptive\" ? window.dispatchEvent(new CustomEvent(\"aegis-adaptive-open\",{detail:{object:(data as any).aegisObject,activation:event}})) : (waiting ? action(id, \"help\") : open(id))}",
    "why": "Carry the original selection activation to video recommendations and media objects."
  },
  {
    "file": "features/work/components/objects/PickCard.svelte",
    "find": "    <div class=\"photo\" class:video class:product>",
    "replace": "    <div class=\"photo\" class:video class:product>\n      {#if video && pick.url && actions.link}<button type=\"button\" class=\"poster-open nodrag nopan\" aria-label={'Watch '+pick.name} onclick={(event)=>{event.stopPropagation();actions.link?.(pick.url!);}}></button>{/if}",
    "why": "Open a recommended video through the existing trusted source-browser action."
  },
  {
    "file": "features/work/components/objects/PickCard.svelte",
    "find": "<style>",
    "replace": "<style>\n  .poster-open{position:absolute;inset:0;z-index:3;width:100%;height:100%;border:0;background:transparent;cursor:pointer;border-radius:inherit}\n  .poster-open:focus-visible{outline:2px solid var(--color-ring);outline-offset:-4px}",
    "why": "Make the original video poster keyboard and touch actionable."
  },
  {
    "file": "features/work/components/objects/PickCard.svelte",
    "find": "  {#if actions.choose || actions.ask || onopen}",
    "replace": "  {#if false && (actions.choose || actions.ask || onopen)}",
    "why": "AEGIS uses the shared five-action selection toolbar; no duplicate hover controls."
  }
];

v24Patches.push({file:'features/work/components/WorkCanvas.svelte',find:'          else onopen?.(input?.element ?? node.id);',replace:'          else if ((node.data as any).aegisObject) window.dispatchEvent(new CustomEvent("aegis-adaptive-open",{detail:{object:(node.data as any).aegisObject,activation:event}}));\n          else onopen?.(input?.element ?? node.id);',why:'Preserve original double-click activation for recommended and standalone video objects.'});
