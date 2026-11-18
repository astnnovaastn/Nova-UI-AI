# AEGIS V30 Research conversation

The source reference is the local Zephium checkout at `9026a1fffad74d6e201ef97fe8c02c1b01403cd2`. The browser Ask panel is the visual reference. AEGIS owns the conversation, transport, saved reports, and Work actions.

| Zephium source | AEGIS mapping |
| --- | --- |
| `frame/src/features/tools/components/previews/ChatView.svelte`, `ToolFrame.svelte` | Existing Research conversation drawer and header |
| `frame/src/features/assist/components/AssistPanel.svelte`, `HistoryView.svelte` | Conversation actions and the existing Research Library |
| `frame/src/features/assist/components/Thread.svelte` | Independent thread scroller, resize observation, 32 px follow threshold, and jump control |
| `frame/src/features/assist/components/PersonMessage.svelte`, `Reply.svelte`, `blocks/TextBlock.svelte` | User bubble and assistant message presentation, with sanitized Markdown and AEGIS citation actions |
| `frame/src/features/assist/components/Empty.svelte` | Adapted original Svelte welcome view mounted through the Work canvas bridge |
| `frame/src/features/assist/components/WorkingLine.svelte`, `FaultNote.svelte` | Reference for activity and error presentation, driven by existing AEGIS state |
| `frame/src/features/assist/lib/assist-session.svelte.ts`, `conversation.ts`, `crates/zephium-ipc/src/page_assist.rs`, `desktop/src/page_assist.rs` | Reference for session and event boundaries. AEGIS uses its existing report-scoped WebSocket transport and history. |

The Work composer clears an accepted draft only if the same report and draft are still selected. Shift+Enter still inserts a newline. The drawer exposes browser context and Work handoff in its menu, and Stop sits beside the canvas composer while a reply is active.

Message rows keep the existing stable IDs and context cards. The client retains persisted timestamps and model values where provided by the history response. Scroll state is held per client and conversation for the active window. An absent timestamp or model remains absent.

Zephium-derived visual and layout code is covered by the existing MPL-2.0 canvas notices. Zephium's native browser and chat backend remain separate from AEGIS's implementation.
