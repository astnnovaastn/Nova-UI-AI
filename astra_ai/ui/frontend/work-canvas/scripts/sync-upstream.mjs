// Copies the Zephium Work files AEGIS uses out of the read-only reference clone, unchanged
// except for the patches listed below, and writes the provenance manifest.
// Usage: node scripts/sync-upstream.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import {designerPatches} from "./designer-patches.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, "..");
const clone = path.resolve(pkg, "../../zephium-source");
const frame = path.join(clone, "frame");
const from = path.join(frame, "src");
const out = path.join(pkg, "upstream");
const dest = path.join(out, "src");

const roots = [
  "features/work/components/WorkCanvas.svelte",
  "features/work/components/bar/WorkBar.svelte",
  "features/work/components/bar/BarTool.svelte",
  "features/work/components/AgentLine.svelte",
  "features/work/components/start/WorkStart.svelte",
  "features/work/components/pane/BrowserPane.svelte",
  "features/work/components/Lift.svelte",
  "features/work/components/lift/RequestLift.svelte",
  "features/work/lib/project-environment.ts",
  "features/work/lib/project-environment-board.ts",
  "features/work/lib/project-environment-thread.ts",
  "features/work/lib/organize.ts",
  "features/work/lib/pointer-tool.svelte.ts",
  "features/work/lib/composer-hole.ts",
  "features/work/components/asks/asks.ts",
  "shared/ui/presence/index.ts",
  "shared/ui/Icon/index.ts",
];

// Each patch must match exactly once, so an upstream change fails loudly instead of silently.
const patches = [...designerPatches,
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "Keep the Svelte Flow attribution visible; hiding it is meant for Pro subscribers.",
    find: "      proOptions={{ hideAttribution: true }}\n",
    replace: "",
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Add the AEGIS preview provider: saved favicon and excerpt beside the title.",
    find: '  import { thumbnail } from "../../lib/frame-thumbs";\n',
    replace:
      '  import { thumbnail } from "../../lib/frame-thumbs";\n  import { previewFor } from "../../../../../../src/preview-provider";\n',
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Look up the preview for this page.",
    find: "  const shown = $derived(!!frame && failed !== frame);\n",
    replace:
      "  const shown = $derived(!!frame && failed !== frame);\n  const preview = $derived(previewFor(url));\n",
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Show the saved excerpt over the saved image.",
    find: "        use:thumbnail={{ url: frame!, width: 360, onmissing: () => (failed = frame) }}\n      ></canvas>\n",
    replace:
      '        use:thumbnail={{ url: frame!, width: 360, onmissing: () => (failed = frame) }}\n      ></canvas>\n      {#if preview?.excerpt}<span class="caption">{preview.excerpt}</span>{/if}\n',
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Show the saved excerpt when a page has no image, so no card is blank.",
    find: '        <span class="words">{heading || site}</span>\n',
    replace:
      '        <span class="words">{heading || site}</span>\n        {#if preview?.excerpt}<span class="excerpt">{preview.excerpt}</span>{/if}\n',
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Show the saved favicon in the card's bar.",
    find: '    <span class="mark"><HostGlyph {host} {url} size={14} initial={false} /></span>\n',
    replace:
      '    <span class="mark">{#if preview?.favicon}<img class="favicon" src={preview.favicon} alt="" width="14" height="14" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onerror={(event) => ((event.currentTarget as HTMLElement).style.visibility = "hidden")} />{:else}<HostGlyph {host} {url} size={14} initial={false} />{/if}</span>\n',
  },
  {
    file: "features/work/components/run/PageFace.svelte",
    why: "Styles for the preview additions.",
    find: "<style>\n",
    replace: `<style>
  .favicon {
    display: block;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 3px;
  }

  .caption {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    display: -webkit-box;
    overflow: hidden;
    padding: 18px 12px 10px;
    background: linear-gradient(to top, rgb(0 0 0 / 78%), transparent);
    color: #fff;
    font-size: 11.5px;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .excerpt {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

`,
  },
  {
    file: "features/work/components/AgentLine.svelte",
    why: "A paused run says the real reason AEGIS recorded.",
    find: "    paused: m.work_line_paused,\n",
    replace: "    paused: () => waitingWords() || m.work_line_paused(),\n",
  },
  {
    file: "features/work/components/AgentLine.svelte",
    why: "Import the recorded reason.",
    find: '  import { tick, untrack } from "svelte";\n',
    replace: '  import { tick, untrack } from "svelte";\n  import { waitingWords } from "../../../../../src/waiting.svelte";\n',
  },
  {
    file: "features/work/components/bar/WorkBar.svelte",
    why: "Let the host own the microphone, so AEGIS can use its Gemini Live voice instead of native dictation.",
    find: "    onsubmit,\n    ref = $bindable(),\n",
    replace: "    onsubmit,\n    ondictate,\n    listening = false,\n    ref = $bindable(),\n",
  },
  {
    file: "features/work/components/bar/WorkBar.svelte",
    why: "Types for the microphone props.",
    find: "    onsubmit: () => void;\n    ref?: HTMLElement;\n",
    replace:
      "    onsubmit: () => void;\n    /** The host's own voice feature; when set, the mic calls it instead of native dictation. */\n    ondictate?: () => void;\n    listening?: boolean;\n    ref?: HTMLElement;\n",
  },
  {
    file: "features/work/components/bar/WorkBar.svelte",
    why: "Route the mic to the host.",
    find: "  function dictate() {\n    if (dictating) voice?.toggle();\n",
    replace:
      "  function dictate() {\n    if (ondictate) {\n      if (!disabled) ondictate();\n      return;\n    }\n    if (dictating) voice?.toggle();\n",
  },
  {
    file: "features/work/components/bar/WorkBar.svelte",
    why: "Say whether the microphone is on.",
    find: '              aria-label={m.voice_start()}\n              title={dictateHint}\n',
    replace:
      '              aria-label={listening ? "Turn microphone off" : m.voice_start()}\n              aria-pressed={listening}\n              data-listening={listening}\n              title={ondictate ? (listening ? "Turn microphone off" : "Talk to Aegis") : dictateHint}\n',
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "Finished research is drawn as a paper: import AEGIS's paper card.",
    find: '  import Trail from "./board/Trail.svelte";\n',
    replace: '  import Trail from "./board/Trail.svelte";\n  import PaperCard from "../../../../../src/PaperCard.svelte";\n',
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "A paper offers Open, without the ask, choose and remove orders meant for the person's own objects.",
    find: '["page", "sources", "request", "block", "head", "trail", "part", "input"].includes(type),',
    replace: '["page", "sources", "request", "block", "head", "trail", "part", "input", "paper"].includes(type),',
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "Draw the paper card.",
    find: '    {#if type === "block" && data.block}<BlockHost {id} item={data} {selected} />\n',
    replace: '    {#if type === "paper"}<PaperCard {id} item={data} {selected} />\n    {:else if type === "block" && data.block}<BlockHost {id} item={data} {selected} />\n',
  },
  {
    file: "features/work/components/start/WorkStart.svelte",
    why: "A narrow window scrolls the role tabs, so their names stay readable. Opens the scrolling wrapper.",
    find: "    <SegmentedControl\n      label={m.work_start_roles()}\n",
    replace: '    <div class="roles"><SegmentedControl\n      label={m.work_start_roles()}\n',
  },
  {
    file: "features/work/components/start/WorkStart.svelte",
    why: "Closes the scrolling wrapper.",
    find: "      onchange={(next) => (chosen = next as Persona)}\n    />\n",
    replace: "      onchange={(next) => (chosen = next as Persona)}\n    /></div>\n",
  },
  {
    file: "features/work/components/start/WorkStart.svelte",
    why: "Styles for the scrolling wrapper.",
    find: "<style>\n  .start {\n",
    replace: "<style>\n  .roles {\n    max-inline-size: 100%;\n    overflow-x: auto;\n    scrollbar-width: none;\n  }\n\n  .roles :global(.segmented) {\n    min-inline-size: max-content;\n  }\n\n  .start {\n",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Zephium's pane is transparent over a native webview; here the page sits inside it, so showing it depends only on the phase.",
    find: "const presented = $derived(phase === \"shown\" && !!applied?.presented);",
    replace: "const presented = $derived(phase === \"shown\");",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Props for the iframe slot, stacking, minimizing and where a further window opens.",
    find: "    onadd,\n    onclose,\n  }: {",
    replace: "    onadd,\n    onclose,\n    children,\n    hidden = false,\n    order = 0,\n    start = 0,\n    onraise,\n    onminimize,\n  }: {",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Types for those props.",
    find: "    onadd: () => void;\n    onclose: () => void;\n  } = $props();",
    replace: "    onadd: () => void;\n    onclose: () => void;\n    children?: import(\"svelte\").Snippet;\n    hidden?: boolean;\n    order?: number;\n    /** How many windows are open already: each further one opens stepped from the first. */\n    start?: number;\n    onraise?: () => void;\n    onminimize?: () => void;\n  } = $props();",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "A further window opens stepped from the first, so it does not hide it.",
    find: "let rect = $state.raw<PaneRect>(untrack(() => paneGeometry(bounds)));",
    replace: "let rect = $state.raw<PaneRect>(untrack(() => {\n    const placed = paneGeometry(bounds);\n    const step = (start % 6) * 28;\n    return { ...placed, x: Math.min(placed.x + step, bounds.right - placed.width), y: Math.min(placed.y + step, bounds.bottom - placed.height) };\n  }));",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Stays inside a canvas narrower than the pane's normal minimum.",
    find: "const width = Math.max(MIN.width, Math.min(next.width, bounds.width));\n    const height = Math.max(MIN.height, Math.min(next.height, bounds.height));",
    replace: "const width = Math.min(bounds.width, Math.max(MIN.width, next.width));\n    const height = Math.min(bounds.height, Math.max(MIN.height, next.height));",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "With several windows, Escape closes only the one in use, and not while another panel holds the focus.",
    find: "if (event.key === \"Escape\" && !event.defaultPrevented) {",
    replace: "if (event.key === \"Escape\" && !event.defaultPrevented && root?.contains(document.activeElement)) {",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Stacking, hiding when minimized, and raising when touched.",
    find: "  style:--pane-header={`${HEADER}px`}\n>",
    replace: "  style:--pane-header={`${HEADER}px`}\n  style:z-index={order + 28}\n  style:display={hidden ? \"none\" : undefined}\n  onpointerdowncapture={() => onraise?.()}\n  onfocusin={() => onraise?.()}\n>",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "A minimize control, beside close.",
    find: "      <IconButton icon={Cancel01Icon} label={m.work_pane_close()} onclick={close} />",
    replace: "      <IconButton icon={MinusSignIcon} label=\"Minimize\" onclick={() => onminimize?.()} />\n      <IconButton icon={Cancel01Icon} label={m.work_pane_close()} onclick={close} />",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "Import the minimize icon.",
    find: "    LockIcon,\n    PlusSignIcon,",
    replace: "    LockIcon,\n    MinusSignIcon,\n    PlusSignIcon,",
  },
  {
    file: "features/work/components/pane/BrowserPane.svelte",
    why: "The page itself goes where Zephium's native view would be painted.",
    find: "      </p>\n    {/if}\n  </div>\n  {#each [\"n\", \"e\",",
    replace: "      </p>\n    {/if}\n    {@render children?.()}\n  </div>\n  {#each [\"n\", \"e\",",
  },
  {
    file: "features/work/lib/run/parts.ts",
    why: "AEGIS reports exact step states, so a lane is working only while one of its run's steps is running, not whenever the run is live.",
    find: "  if (working && parts.has(working)) {\n    const part = parts.get(working)!;\n    part.state = \"running\";",
    replace: "  if (working && parts.has(working) && runs.some((run) => live(run) && run.steps?.some((step) => step.status === \"running\"))) {\n    const part = parts.get(working)!;\n    part.state = \"running\";",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "explain code: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"folder\",\n    reads: [],\n    title: m.work_flow_explain_code,",
    replace: "input: \"text\",\n    reads: [],\n    title: m.work_flow_explain_code,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "map a project: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"folder\",\n    reads: [],\n    title: m.work_flow_map_project,",
    replace: "input: \"text\",\n    reads: [],\n    title: m.work_flow_map_project,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "review a change: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"folder\",\n    reads: [\"GitHub\"],",
    replace: "input: \"text\",\n    reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "fix a test: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"folder\",\n    reads: [],\n    title: m.work_flow_fix_test,",
    replace: "input: \"text\",\n    reads: [],\n    title: m.work_flow_fix_test,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "moodboard: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "reads: [\"Are.na\", \"Dribbble\"],",
    replace: "reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "plan my day: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"none\",\n    reads: [\"Calendar\", \"Gmail\", \"Slack\"],",
    replace: "input: \"text\",\n    reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "plan my day ask: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "request: m.work_flow_day_request,\n    ask: none,",
    replace: "request: m.work_flow_day_request,\n    ask: m.work_flow_day_ask,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "weekly status: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"none\",\n    reads: [\"Linear\", \"GitHub\", \"Slack\"],",
    replace: "input: \"text\",\n    reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "weekly status ask: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "request: m.work_flow_status_request,\n    ask: none,",
    replace: "request: m.work_flow_status_request,\n    ask: m.work_flow_status_ask,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "inbox triage: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"none\",\n    reads: [\"Gmail\"],",
    replace: "input: \"text\",\n    reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "inbox triage ask: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "request: m.work_flow_inbox_request,\n    ask: none,",
    replace: "request: m.work_flow_inbox_request,\n    ask: m.work_flow_inbox_ask,",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "meeting prep: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "input: \"none\",\n    reads: [\"Calendar\", \"Gmail\"],",
    replace: "input: \"text\",\n    reads: [],",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "meeting prep ask: AEGIS Research reads the web and what is pasted, not local folders or connected accounts, so it asks for the input and names no app it cannot read.",
    find: "request: m.work_flow_meeting_request,\n    ask: none,",
    replace: "request: m.work_flow_meeting_request,\n    ask: m.work_flow_meeting_ask,",
  },
  // AEGIS Work: the eighth category.
  {
    file: "features/work/lib/start/workflows.ts",
    why: "Research is the eighth category.",
    find: '  "developer" | "designer" | "marketing" | "manager" | "student" | "office" | "founder";',
    replace: '  "developer" | "designer" | "marketing" | "manager" | "student" | "office" | "founder" | "research";',
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "Research's tab stands next to Founder.",
    find: "  { id: \"founder\", label: m.work_start_founder },\n",
    replace: "  { id: \"founder\", label: m.work_start_founder },\n  { id: \"research\", label: m.work_start_research },\n",
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "Each Research card is drawn from its own shape.",
    find: '  | "investors";',
    replace: '  | "investors"\n  | "quick"\n  | "deep"\n  | "atlas";',
  },
  {
    file: "features/work/lib/start/workflows.ts",
    why: "The three Research workflows.",
    find: "    known: /\\binvestors?\\b|\\bvcs?\\b|\\bangels?\\b.*\\b(raise|round)\\b/iu,\n  },\n];",
    replace: `    known: /\\binvestors?\\b|\\bvcs?\\b|\\bangels?\\b.*\\b(raise|round)\\b/iu,
  },
  {
    skill: "quick-research",
    persona: "research",
    shape: "quick",
    hue: "sky",
    input: "text",
    reads: [],
    title: m.work_flow_quick_research,
    line: m.work_flow_quick_research_line,
    request: m.work_flow_quick_research_request,
    ask: m.work_flow_quick_research_ask,
    known: /\\bquick research\\b/iu,
  },
  {
    skill: "deep-research",
    persona: "research",
    shape: "deep",
    hue: "lilac",
    input: "text",
    reads: [],
    title: m.work_flow_deep_research,
    line: m.work_flow_deep_research_line,
    request: m.work_flow_deep_research_request,
    ask: m.work_flow_deep_research_ask,
    known: /\\bdeep research\\b/iu,
  },
  {
    skill: "knowledge-map",
    persona: "research",
    shape: "atlas",
    hue: "mint",
    input: "text",
    reads: [],
    title: m.work_flow_knowledge_map,
    line: m.work_flow_knowledge_map_line,
    request: m.work_flow_knowledge_map_request,
    ask: m.work_flow_knowledge_map_ask,
    known: /\\bknowledge map\\b|\\bblueprint\\b/iu,
  },
];`,
  },
  {
    file: "features/work/components/start/Vignette.svelte",
    why: "Artwork for the three Research cards: a focused answer, a converging search, and a connected map.",
    find: '  {:else if shape === "bars"}\n',
    replace: `  {:else if shape === "quick"}
    <circle class="ring" cx="46" cy="44" r="20" />
    <circle class="hue" cx="46" cy="44" r="8" />
    <path class="ln" d="M61 59 L76 74" />
    <rect class="plate" x="92" y="20" width="92" height="56" rx="8" />
    <rect class="ink" x="102" y="31" width="58" height="5" rx="2.5" />
    <rect class="t1" x="102" y="44" width="72" height="4" rx="2" />
    <rect class="t2" x="102" y="54" width="48" height="4" rx="2" />
    <rect class="hue" x="102" y="64" width="16" height="4" rx="2" />
  {:else if shape === "deep"}
    {#each [14, 34, 54, 74] as y, i (y)}
      <rect class="plate" x="12" y={y - 6} width="44" height="14" rx="5" />
      <circle class={i === 1 ? "hue" : "t1"} cx="22" cy={y + 1} r="3.5" />
      <rect class="t2" x="30" y={y - 1} width="20" height="4" rx="2" />
      <path class="ln" d="M56 {y + 1} C 74 {y + 1} 72 45 90 45" />
    {/each}
    <circle class="hue" cx="96" cy="45" r="7" />
    <path class="ln" d="M103 45 H122" />
    <rect class="plate" x="122" y="10" width="62" height="72" rx="8" />
    <rect class="ink" x="131" y="20" width="36" height="5" rx="2.5" />
    {#each [32, 42, 52, 62] as y (y)}
      <rect class="t1" x="131" y={y} width={y === 62 ? 26 : 44} height="4" rx="2" />
    {/each}
  {:else if shape === "atlas"}
    <rect class="gap" x="10.5" y="10.5" width="68" height="74" rx="9" />
    <rect class="gap" x="118.5" y="10.5" width="68" height="74" rx="9" />
    <path class="ln" d="M60 30 C 84 30 92 26 132 26" />
    <path class="ln" d="M60 30 C 84 30 92 66 132 66" />
    <path class="ln" d="M60 64 C 84 64 92 66 132 66" />
    <path class="ln" d="M40 36 V58" />
    <rect class="plate" x="20" y="22" width="40" height="16" rx="5" />
    <rect class="hue" x="20" y="56" width="40" height="16" rx="5" />
    <rect class="plate" x="132" y="18" width="44" height="16" rx="5" />
    <rect class="plate" x="132" y="58" width="44" height="16" rx="5" />
    <rect class="t2" x="26" y="28" width="26" height="4" rx="2" />
    <rect class="on-hue" x="26" y="62" width="26" height="4" rx="2" />
    <rect class="t2" x="138" y="24" width="30" height="4" rx="2" />
    <rect class="t2" x="138" y="64" width="26" height="4" rx="2" />
  {:else if shape === "bars"}
`,
  },
  // AEGIS Work: the node toolbar on the cards a run draws.
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "AEGIS's agent, blueprint and map group cards.",
    find: '  import PaperCard from "../../../../../src/PaperCard.svelte";\n',
    replace: '  import PaperCard from "../../../../../src/PaperCard.svelte";\n  import AgentCard from "../../../../../src/AgentCard.svelte";\n  import BlueprintCard from "../../../../../src/BlueprintCard.svelte";\n  import MapGroupCard from "../../../../../src/MapGroupCard.svelte";\n',
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "A card AEGIS marks with `orders` takes Ask, Choose and Remove even though the run drew it; those act on the canvas view, never on saved research.",
    find: '["page", "sources", "request", "block", "head", "trail", "part", "input", "paper"].includes(type),',
    replace: '!data.orders && ["page", "sources", "request", "block", "head", "trail", "part", "input", "paper", "mapgroup"].includes(type),',
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "A lane, marked with `orders`, has the toolbar too; a map group's own cards carry it instead.",
    find: "      type !== \"part\" &&\n      type !== \"input\" &&\n",
    replace: "      (type !== \"part\" || !!data.orders) &&\n      type !== \"mapgroup\" &&\n      type !== \"input\" &&\n",
  },
  {
    file: "features/work/components/CanvasNode.svelte",
    why: "Draw AEGIS's agent, blueprint and map group cards.",
    find: '    {#if type === "paper"}<PaperCard {id} item={data} {selected} />\n',
    replace: '    {#if type === "paper"}<PaperCard {id} item={data} {selected} />\n    {:else if type === "agentcard"}<AgentCard {id} item={data} {selected} />\n    {:else if type === "blueprint"}<BlueprintCard {id} item={data} {selected} />\n    {:else if type === "mapgroup"}<MapGroupCard item={data} />\n',
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "Selection actions: Choose as well as Ask and Remove, with removal offered for run-drawn cards.",
    find: '    onselectionaction?: (action: "area" | "ask" | "remove", ids: string[]) => void;',
    replace: '    onselectionaction?: (action: "area" | "ask" | "remove" | "choose", ids: string[]) => void;',
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "Offer Choose for a selection.",
    find: '          onask={() => onselectionaction?.("ask", selectedItems)}\n',
    replace: '          onask={() => onselectionaction?.("ask", selectedItems)}\n          onchoose={() => onselectionaction?.("choose", selectedItems)}\n',
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "A card AEGIS marks with orders counts as removable from this view.",
    find: "          owned={selectedItems.filter((id) => authoritative.has(id)).length}\n",
    replace: "          owned={selectedItems.filter((id) => authoritative.has(id) || byId.get(id)?.orders).length}\n",
  },
  {
    file: "features/work/components/SelectionBar.svelte",
    why: "Accept the Choose action.",
    find: "    onask,\n    onremove,\n  }: {",
    replace: "    onask,\n    onchoose,\n    onremove,\n  }: {",
  },
  {
    file: "features/work/components/SelectionBar.svelte",
    why: "Type the Choose action.",
    find: "    onask: () => void;\n",
    replace: "    onask: () => void;\n    onchoose?: () => void;\n",
  },
  {
    file: "features/work/components/SelectionBar.svelte",
    why: "AEGIS has no areas, so its button becomes Choose, which selects the group for the next instruction.",
    find: "  <button type=\"button\" disabled={!owned} onclick={onarea}>\n    <Icon icon={LayoutGridIcon} size={14} />{m.work_select_area()}\n  </button>\n",
    replace: "  {#if onchoose}<button type=\"button\" onclick={onchoose}>{m.work_env_choose()}</button>{:else}<button type=\"button\" disabled={!owned} onclick={onarea}>\n    <Icon icon={LayoutGridIcon} size={14} />{m.work_select_area()}\n  </button>{/if}\n",
  },
];

const layers = ["app", "features", "session", "domain", "shared", "styles"];
const exts = ["", ".ts", ".svelte.ts", ".svelte", ".js", ".css", "/index.ts"];
const resolve = (spec, file) => {
  const alias = spec.match(/^\$(\w+)(\/.*)?$/);
  let base;
  if (alias && layers.includes(alias[1])) base = path.join(from, alias[1], alias[2] || "");
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(file), spec);
  else return null;
  for (const ext of exts) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return undefined;
};
const importRe =
  /(?:^|[\s;(])(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/gm;
const seen = new Set();
const unresolved = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const text = fs.readFileSync(file, "utf8");
  const specs = file.endsWith(".css")
    ? [...text.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1])
    : [
        ...[...text.matchAll(importRe)].map((m) => m[1] || m[2]),
        // Workers and assets referenced by URL are dependencies too.
        ...[...text.matchAll(/new URL\(\s*["'](\.[^"']+)["']\s*,\s*import\.meta\.url/g)].map((m) => m[1]),
      ];
  for (const raw of specs) {
    if (!raw) continue;
    const spec = raw.split("?")[0];
    const target = resolve(spec, file);
    if (target) walk(target);
    else if (target === undefined && !spec.startsWith("$shared/i18n")) unresolved.add(`${spec} (from ${path.relative(from, file)})`);
  }
}
for (const root of roots) walk(path.join(from, root));
// Stylesheets the host imports directly; browser.css is left out on purpose.
for (const css of ["tokens.css", "tokens/primitive.css", "tokens/avatar.css", "tokens/sky.css", "controls.css", "favicon.css", "axes/bootstrap.css", "axes/palette.css", "axes/tint.css", "axes/density.css", "axes/contrast.css", "axes/material.css", "axes/motion.css", "axes/type.css"]) {
  const file = path.join(from, "styles", css);
  if (fs.existsSync(file)) walk(file);
}

// OneDrive can hold a folder open briefly on Windows, so old files go first and folders may stay.
for (const entry of fs.existsSync(out) ? fs.readdirSync(out, { recursive: true }) : []) {
  const file = path.join(out, String(entry));
  if (fs.statSync(file).isFile()) fs.rmSync(file, { force: true, maxRetries: 8, retryDelay: 400 });
}
const files = [...seen].filter((f) => !/\/tests?\/|\.test\.|[\\/]shared[\\/]testing[\\/]/.test(f)).sort();
for (const file of files) {
  const target = path.join(dest, path.relative(from, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

// English strings only; the Zephium name is not licensed, so user-facing text says Aegis.
fs.mkdirSync(path.join(out, "messages"), { recursive: true });
const messages = fs.readFileSync(path.join(frame, "messages/en.json"), "utf8");
const renamed = messages.replace(/Zephium/g, "Aegis");
fs.writeFileSync(path.join(out, "messages/en.json"), renamed);
fs.copyFileSync(path.join(clone, "LICENSE"), path.join(out, "LICENSE"));

// A paused run in AEGIS is waiting on a provider, never on a hidden window.
const messagesFile = path.join(out, "messages/en.json");
const texts = JSON.parse(fs.readFileSync(messagesFile, "utf8"));
texts.work_line_paused = "Waiting to continue";
// The start screen's words promise only what AEGIS Research does: it searches the web and
// reads what is pasted. It cannot open local folders, run tests or read connected accounts.
Object.assign(texts, {
  work_pane: "Source browser",
  work_env_open_browse: "Open in browser",
  ui_search_or_enter_an_address: "Enter a web address",
  work_flow_explain_code_line: "How a file, a function or a flow works, explained from what you paste",
  work_flow_explain_code_ask: "Paste the code, or name a public repository. Research can't open folders on this computer.",
  work_flow_map_project_ask: "Name a public repository, or paste its file tree. Research can't open folders on this computer.",
  work_flow_review_change_ask: "Paste a public pull request link, or the diff.",
  work_flow_fix_test_line: "Likely causes and fixes, from the error you paste",
  work_flow_fix_test_request: "Find the likely cause and fix for this failing test:",
  work_flow_fix_test_ask: "Paste the test and its error. Research can't run tests or change your code.",
  work_flow_moodboard_ask: "A direction in a few words.",
  work_flow_day_line: "Your day as one timed plan, from what you paste",
  work_flow_day_request: "Plan my day from this:",
  work_flow_day_ask: "Research can't read your calendar or mail. Paste what's on today, leaving out anything private: it goes to the research services.",
  work_flow_status_line: "Shipped, in progress and blocked, from your notes",
  work_flow_status_request: "Write my weekly status from these notes:",
  work_flow_status_ask: "Research can't read Linear, GitHub or Slack. Paste your notes, leaving out anything private: they go to the research services.",
  work_flow_inbox_line: "What needs you, replies drafted, from what you paste",
  work_flow_inbox_request: "Triage these emails:",
  work_flow_inbox_ask: "Research can't read your mail. Paste the messages, leaving out anything private: they go to the research services.",
  work_flow_meeting_line: "Who's coming and what to raise, from what you paste",
  work_flow_meeting_request: "Prepare me for this meeting:",
  work_flow_meeting_ask: "Research can't read your calendar or mail. Paste the invite, leaving out anything private: it goes to the research services.",
  work_start_research: "Research",
  work_flow_quick_research: "Quick Research",
  work_flow_quick_research_line: "A short sourced answer to one clear question",
  work_flow_quick_research_request: "Quick research:",
  work_flow_quick_research_ask: "What do you want to know?",
  work_flow_deep_research: "Deep Research",
  work_flow_deep_research_line: "Searches from many angles, cross-checks claims and writes a cited report",
  work_flow_deep_research_request: "Deep research:",
  work_flow_deep_research_ask: "What should AEGIS research? Add any scope or sources you want it to favour.",
  work_flow_knowledge_map: "Structured Research & Knowledge Map",
  work_flow_knowledge_map_line: "An architecture, comparison or flow as connected cards, with a full document",
  work_flow_knowledge_map_request: "Build a knowledge map of",
  work_flow_knowledge_map_ask: "What should the map explain? An architecture, a comparison, a flow or a blueprint.",
  work_env_decided: "Chosen",
});
fs.writeFileSync(messagesFile, JSON.stringify(texts, null, 2));

patches.push(...[
  {
    "file": "features/work/lib/canvas-context.ts",
    "why": "Share the explicitly activated toolbar node.",
    "find": "export const canvasSeen = Symbol(\"canvas-seen\");",
    "replace": "export const canvasSeen = Symbol(\"canvas-seen\");\nexport const canvasToolbar = Symbol(\"canvas-toolbar\");"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Show actions only for the activated selected card.",
    "find": "    canvasSeen,\n  } from \"../lib/canvas-context\";",
    "replace": "    canvasSeen,\n    canvasToolbar,\n  } from \"../lib/canvas-context\";"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Keep toolbar actions outside canvas gestures.",
    "find": "<NodeToolbar isVisible={selected && tooled} position={Position.Top} offset={10 * scale}>\n  <div class=\"bar\" role=\"toolbar\" aria-label={data.title} style:--scale={scale}>",
    "replace": "<NodeToolbar isVisible={selected && tooled && activeToolbar?.() === id} position={Position.Top} offset={10 * scale}>\n  <div class=\"bar nopan nodrag\" role=\"toolbar\" aria-label={data.title} style:--scale={scale}>"
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "why": "Read toolbar activation from the canvas.",
    "find": "</script>\n\n<Handle\n  type=\"target\"",
    "replace": "  const activeToolbar = getContext<(() => string | null) | undefined>(canvasToolbar);\n</script>\n\n<Handle\n  type=\"target\""
  },
  {
    "file": "features/work/components/AreaNode.svelte",
    "why": "Use the same explicit activation for area actions.",
    "find": "import { canvasAreaActions, canvasResize }",
    "replace": "import { canvasAreaActions, canvasResize, canvasToolbar }"
  },
  {
    "file": "features/work/components/AreaNode.svelte",
    "why": "Read area toolbar activation.",
    "find": "  let editing = $state(false);",
    "replace": "  const activeToolbar = getContext<(() => string | null) | undefined>(canvasToolbar);\n  let editing = $state(false);"
  },
  {
    "file": "features/work/components/AreaNode.svelte",
    "why": "Only show the selected area toolbar after activation.",
    "find": "{#if actions}<NodeToolbar position={Position.Top} offset={10}>\n    <div class=\"bar\" role=\"toolbar\"",
    "replace": "{#if actions}<NodeToolbar isVisible={selected && activeToolbar?.() === id} position={Position.Top} offset={10}>\n    <div class=\"bar nopan nodrag\" role=\"toolbar\""
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Track an explicit single-node toolbar activation independently of drag selection.",
    "find": "    canvasArrival,\n",
    "replace": "    canvasArrival,\n    canvasToolbar,\n"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Share toolbar activation with node components.",
    "find": "  let lastClick = { id: \"\", at: 0 };",
    "replace": "  let toolbarNode = $state<string | null>(null);\n  setContext(canvasToolbar, () => toolbarNode);\n  let lastClick = { id: \"\", at: 0 };"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Activate the toolbar when a node is clicked.",
    "find": "        const now = performance.now();\n        if (lastClick.id",
    "replace": "        toolbarNode = node.id;\n        const now = performance.now();\n        if (lastClick.id"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Dismiss node actions when the pane is clicked.",
    "find": "      onpaneclick={() => {\n        lastClick",
    "replace": "      onpaneclick={() => {\n        toolbarNode = null;\n        lastClick"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Dismiss node actions during drag selection and node dragging.",
    "find": "      onselectionstart={() => (marquee = true)}",
    "replace": "      onselectionstart={() => { marquee = true; toolbarNode = null; }}"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Dismiss node actions when moving cards.",
    "find": "      onnodedragstart={() => {\n",
    "replace": "      onnodedragstart={() => {\n        toolbarNode = null;\n"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Support Enter and Space activation and Escape dismissal.",
    "find": "    const key = event.key.toLowerCase();\n    if (key === \"v\" || key === \"h\") {",
    "replace": "    const key = event.key.toLowerCase();\n    if ((key === \"enter\" || key === \" \") && target?.matches(\".svelte-flow__node\")) {\n      toolbarNode = target.dataset.id ?? null;\n      event.preventDefault();\n    } else if (key === \"escape\" && toolbarNode) {\n      const focusedAction = target?.closest('[role=\"toolbar\"]');\n      if (focusedAction) {\n        host?.querySelector<HTMLElement>('.svelte-flow__node[data-id=\"' + CSS.escape(toolbarNode) + '\"]')\n          ?.focus({ preventScroll: true });\n      }\n      toolbarNode = null;\n      clearSelection();\n      event.preventDefault();\n    } else if (key === \"v\" || key === \"h\") {"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Set the rendered camera and gesture transform through the same flow API.",
    "find": "    viewport = {\n      x: Math.max(24,",
    "replace": "    setCamera({\n      x: Math.max(24,"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Publish the explicit center camera after setting it.",
    "find": "      zoom: 1,\n    };\n    publishView();",
    "replace": "      zoom: 1,\n    });"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Frame once after the flow is ready and only before a canvas gesture.",
    "find": "  /**\n   * A canvas with no saved camera stands on its home run, and keeps standing\n   * there as the run's objects measure themselves, until the person moves.\n   */\n  let homed = !restoredViewport;\n  $effect(() => {\n    const target = home;\n    if (!homed || !target || !canvasWidth) return;\n    untrack(() => (viewport = framing(target)));\n  });\n  // Homing lasts while the opened run measures itself, never through a run that goes on growing.\n  $effect(() => {\n    if (!homed || !canvasWidth) return;\n    const settle = setTimeout(() => (homed = false), HOME_SETTLE);\n    return () => clearTimeout(settle);\n  });",
    "replace": "  let homed = !restoredViewport;\n  let cameraReady = $state(false);\n  $effect(() => {\n    const target = home;\n    if (!homed || !cameraReady || !target || !canvasWidth) return;\n    homed = false;\n    untrack(() => setCamera(framing(target)));\n  });"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Drop the timer for repeated initial framing.",
    "find": "  const HOME_SETTLE = 1500;\n",
    "replace": ""
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Apply an explicitly restored camera to the gesture engine.",
    "find": "    if (restored) viewport = restored;",
    "replace": "    if (restored) setCamera(restored);"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Use the flow API for programmatic camera updates.",
    "find": "  let following = $state(true);",
    "replace": "  function setCamera(view: CameraView) {\n    if (cameraReady && flow) void flow.setViewport(view);\n    else viewport = view;\n  }\n  let following = $state(true);"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Cancel pending initial framing as soon as the canvas receives a pointer press.",
    "find": "  onpointerdowncapture={(event) => (engaged = !!host?.contains(event.target as Node))}",
    "replace": "  onpointerdowncapture={(event) => {\n    engaged = !!host?.contains(event.target as Node);\n    if (engaged) homed = false;\n  }}"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Use one initial framing path instead of a second queued fit.",
    "find": "      fitView={scene.items.length > 0 && !restoredViewport && !home}\n      fitViewOptions={{ padding: 0.2, duration: 0 }}\n",
    "replace": ""
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Wait for the camera engine before applying initial framing.",
    "find": "      oninit={() => requestAnimationFrame(() => requestAnimationFrame(() => (fitted = true)))}",
    "replace": "      oninit={() => {\n        cameraReady = true;\n        requestAnimationFrame(() => requestAnimationFrame(() => (fitted = true)));\n      }}"
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "why": "Keep manual follow motion and pan state synchronized.",
    "find": "      if(dx||dy)viewport={...viewport,x:viewport.x+dx*.12,y:viewport.y+dy*.12};",
    "replace": "      if (dx || dy) setCamera({ ...viewport, x: viewport.x + dx * .12, y: viewport.y + dy * .12 });"
  }
]);

// Semantic strings: a link that carries backend relations draws as an AEGIS strand.
patches.push(
  {
    file: "features/work/lib/canvas-model.ts",
    why: "A link may carry the backend relations it stands for (AEGIS src/relations.ts).",
    find: "  label?: string;\n  /** A run's line while work is moving along it. */\n",
    replace: "  label?: string;\n  /** AEGIS: the persisted relations this string stands for, and its place among parallel strands. */\n  strand?: unknown;\n  /** A run's line while work is moving along it. */\n",
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "Register the AEGIS strand edge.",
    find: '  import WorkEdge from "./WorkEdge.svelte";\n',
    replace: '  import WorkEdge from "./WorkEdge.svelte";\n  import StrandEdge from "../../../../../src/StrandEdge.svelte";\n',
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "Strands are an edge type of their own.",
    find: "  const edgeTypes = { work: WorkEdge };\n",
    replace: "  const edgeTypes = { work: WorkEdge, strand: StrandEdge };\n",
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "A strand link draws as a strand and keeps its relations.",
    find: '          type: "work",\n          data: {\n',
    replace: '          type: link.strand ? "strand" : "work",\n          data: {\n            ...(link.strand ? { strand: link.strand } : {}),\n',
  },
  {
    file: "features/work/components/WorkCanvas.svelte",
    why: "A strand can be selected to inspect what it means.",
    find: "          deletable: false,\n          selectable: false,\n",
    replace: "          deletable: false,\n          selectable: !!link.strand,\n",
  },
);

const applied = [];
for (const patch of patches) {
  const target = path.join(dest, patch.file);
  const text = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  const parts = text.split(patch.find);
  if (parts.length !== 2) throw new Error(`Patch no longer matches once (${parts.length - 1}): ${patch.file}\n${patch.find}`);
  fs.writeFileSync(target, parts.join(patch.replace));
  applied.push(patch);
}

const commit = execFileSync("git", ["-C", clone, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const patched = new Set(patches.map((p) => p.file));
const manifest = {
  upstream: "https://github.com/zephium-browser/Zephium",
  commit,
  license: "MPL-2.0",
  messages: { file: "frame/messages/en.json", change: "Zephium replaced with Aegis in user-facing text" },
  patches: applied.map(({ file, why }) => ({ file, why })),
  files: files.map((f) => {
    const rel = path.relative(from, f).replace(/\\/g, "/");
    return { path: `frame/src/${rel}`, status: patched.has(rel) ? "adapted" : "unchanged" };
  }),
};
fs.writeFileSync(path.join(out, "MANIFEST.json"), JSON.stringify(manifest, null, 1));
console.log(`${files.length} files copied from ${commit.slice(0, 9)}, ${patched.size} adapted, ${patches.length} patches.`);
if (unresolved.size) console.log("Unresolved:", [...unresolved].slice(0, 20));
