// MPL-2.0. AEGIS durable presentation adapters.
export const v23Patches = [
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "    <button type=\"button\" onclick={() => (waiting ? action(id, \"help\") : open(id))}>\n      <Icon icon={ArrowUpRight01Icon} size={14} />{waiting\n        ? m.work_human_open()\n        : type === \"block\" && data.block?.open\n          ? m.work_board_close()\n          : m.work_env_open()}\n    </button>\n    {#if type === \"adaptive\"}<button type=\"button\" onclick={() => window.dispatchEvent(new CustomEvent('aegis-object-save',{detail:{id:(data as any).aegisObject.id,action:'note'}}))}>Save as note</button><button type=\"button\" onclick={() => window.dispatchEvent(new CustomEvent('aegis-object-save',{detail:{id:(data as any).aegisObject.id,action:'task'}}))}>Make task</button>{/if}\n    {#if data.artifact && !inert}<button\n        type=\"button\"\n        onclick={async () => {\n          focusResult(id);\n          await tick();\n          root?.querySelector<HTMLElement>(\".artifact-body\")?.focus({ preventScroll: true });\n        }}\n      >\n        <Icon icon={Target01Icon} size={14} />{m.work_env_focus_result()}\n      </button>{/if}\n    {#if !inert}<button type=\"button\" onclick={() => action(id, \"ask\")}>{m.work_env_ask()}</button\n      >{/if}\n    {#if !inert && !data.actionLabel}<button\n        type=\"button\"\n        class:on={!!data.decision}\n        onclick={() => action(id, data.decision ? \"unchoose\" : \"choose\")}\n        >{data.decision ? m.work_env_unchoose() : m.work_env_choose()}</button\n      ><button type=\"button\" onclick={() => action(id, \"pin\")}>{data.positionPinned ? \"Unpin\" : \"Pin position\"}</button><button type=\"button\" onclick={() => action(id, \"lock-size\")}>{data.sizeLocked ? \"Unlock size\" : \"Lock size\"}</button><button type=\"button\" onclick={() => action(id, \"release-position\")}>Release position</button>{#if areas?.list.length}<select\n          class=\"area nodrag nopan\"\n          aria-label={m.work_env_area_select()}\n          value={data.area ?? \"\"}\n          onchange={(event) => action(id, `area:${event.currentTarget.value}`)}\n        >\n          <option value=\"\">{m.work_env_no_area()}</option>\n          {#each areas.list as area (area.id)}<option value={area.id}>{area.title}</option>{/each}\n        </select>{/if}{/if}\n    {#if !inert && !data.actionLabel}<span class=\"separator\"></span><button\n        type=\"button\"\n        class=\"danger\"\n        onclick={() => action(id, \"remove\")}\n      >\n        <Icon icon={MinusSignIcon} size={14} />{m.work_env_remove()}\n      </button>{/if}\n",
    "replace": "    <button type=\"button\" onclick={() => (waiting ? action(id, \"help\") : open(id))}><Icon icon={ArrowUpRight01Icon} size={14} />{m.work_env_open()}</button>\n    <button type=\"button\" onclick={() => focusResult(id)}><Icon icon={Target01Icon} size={14} />{m.work_env_focus_result()}</button>\n    <button type=\"button\" onclick={() => action(id, \"ask\")}>{m.work_env_ask()}</button>\n    <button type=\"button\" class:on={!!data.decision} aria-pressed={!!data.decision} onclick={() => action(id, data.decision ? \"unchoose\" : \"choose\")}>{m.work_env_choose()}</button>\n    <span class=\"separator\"></span><button type=\"button\" class=\"danger\" onclick={() => action(id, \"remove\")}><Icon icon={MinusSignIcon} size={14} />{m.work_env_remove()}</button>\n",
    "why": "Keep the five original selection actions; saved constraints remain authoritative."
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "  const tooled = $derived(\n    type !== \"head\" &&\n      type !== \"trail\" &&\n      (type !== \"part\" || !!data.orders) &&\n      type !== \"mapgroup\" &&\n      type !== \"input\" &&\n      (type !== \"block\" || opens),\n  );\n",
    "replace": "  const tooled = $derived(![\"head\", \"trail\", \"mapgroup\", \"input\"].includes(type));\n",
    "why": "Offer selection controls on real cards, not decorative marks."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "    setCamera({\n      x: Math.max(24, (canvasWidth - (node.width ?? 480)) / 2) - position.x,\n      y:\n        fitTopInset +\n        Math.max(0, (canvasHeight - fitBottomInset - fitTopInset - (node.height ?? 360)) / 2) -\n        position.y,\n      zoom: 1,\n    });",
    "replace": "    const width=node.width ?? 480, height=node.height ?? 360;\n    const roomHeight=Math.max(1,canvasHeight-fitBottomInset-fitTopInset-64);\n    const zoom=Math.min(1,Math.max(0.05,Math.min((canvasWidth-64)/width,roomHeight/height)));\n    setCamera({x:(canvasWidth-width*zoom)/2-position.x*zoom,\n      y:fitTopInset+(roomHeight-height*zoom)/2+32-position.y*zoom,zoom});",
    "why": "Focus a result in the existing camera without clipping wide diagrams or altering saved geometry."
  },
  {
    "file": "features/work/lib/board/types.ts",
    "find": "export type DiagramView = ObjectBase & { kind: \"diagram\"; diagram: Diagram };",
    "replace": "export type DiagramView = ObjectBase & { kind: \"diagram\"; way?: \"right\" | \"down\"; diagram: Diagram };",
    "why": "Carry a presentation direction into the original diagram renderer."
  },
  {
    "file": "features/work/components/objects/Diagram.svelte",
    "find": "diagram={object.diagram} {width} ask={actions.ask}",
    "replace": "diagram={object.diagram} {width} way={object.way} ask={actions.ask}",
    "why": "Reuse upstream tiered down/right layout and node inspection."
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "onclick={() => (waiting ? action(id, \"help\") : open(id))}",
    "replace": "onclick={(event) => type === \"collection\" && (data as any).collection?.kind === \"videos\" ? window.dispatchEvent(new CustomEvent(\"aegis-video-open\",{detail:{id,activation:event}})) : (waiting ? action(id, \"help\") : open(id))}",
    "why": "Open video collections in their focused player after the original user activation."
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "max-inline-size: min(360px, calc(100vw - 32px));",
    "replace": "max-inline-size: min(440px, calc(100vw - 24px));",
    "why": "Keep all five actions on one compact row at ordinary desktop widths."
  },
  {
    "file": "features/work/components/CanvasNode.svelte",
    "find": "  .bar .area {\n    block-size: 28px;\n    max-inline-size: 140px;\n    padding: 0 8px;\n    border: 0;\n    border-radius: var(--radius-control-compact);\n    background: transparent;\n    color: var(--color-text);\n    font: inherit;\n    font-size: var(--text-label);\n  }\n\n  .bar .area:hover {\n    background: var(--color-control-hover);\n  }\n\n",
    "replace": "",
    "why": "Remove retired area-selector styling."
  },
  {
    "file": "features/work/components/WorkCanvas.svelte",
    "find": "          onopen?.(input?.element ?? node.id);",
    "replace": "          if ((node.data as any).collection?.kind === \"videos\") window.dispatchEvent(new CustomEvent(\"aegis-video-open\",{detail:{id:node.id,activation:event}}));\n          else onopen?.(input?.element ?? node.id);",
    "why": "Double-clicking a video collection uses the same activation-gated player, not Reader."
  }
];
