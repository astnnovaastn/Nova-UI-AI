# Supplied Memory Globe replacement

Integrated 2026-10-13 from `Downloads/memory-globe-package/memory-globe-package/src/memory-globe/`.

The supplied production Canvas engine replaces the previous layout. It uses the package's spherical category patches, Fibonacci hub placement, organic golden-angle memory placement, inward entity relays, period patches, and category/semantic/session/explicit/catalog connection kinds. The former custom alternating rosettes and two-arm spiral layouts are removed. The React component remains inside Nova's existing Memory workspace, opened through Settings → System Info → Memory. The supplied wrapper's hover, contextual card, connected-target navigation, statistics, and Escape handling are integrated with Nova's existing rails and full-detail services.

`dev/demoGraph.ts`, standalone preview HTML, the example application, and rolled-back optional experiments are not production imports. They do not populate user memory.

## Documented engine and adapter patches

- Shared `/api/memory/globe` snapshots and scoped record retrieval remain authoritative. IDs, revisions, categories, attributed activity, provenance, lifecycle/access filters, full details, and reversible edits/forget/restore retain their existing service path.
- Dynamic category palette metadata is passed through the worker adapter. The renderer supports additional roots and descendants without a 27/127 presentation limit. It uses blue `#4C83B7`, violet `#916CB0`, red `#BA6068`, orange `#C58D3D`, and soft-white `#DCD7CE`. Thirty-six bounded paint shades use controlled OKLCH mixing, stable ID assignments, and panel-dependent lightness. Palette buckets bound draw calls, not the number of categories.
- Canvas, hover, and detail surfaces inherit `--widget-surface`; `themechange` refreshes contrast without rebuilding the graph. Labels and named connection kinds complement color.
- Category spokes are deduplicated when registry memberships repeat the renderer's implicit spoke. Similar-content strings stay visual inference, never saved factual links.
- The supplied visible recall/birth-glow correction is retained. Actual committed additions call `addMemory`, returned record IDs call `recall`, and idle pulses/continuous flows/decorative dust stay off in Nova. Growth has no silent 6,000-record cap.
- Reduced motion stops automatic rotation and traveling signals, updates when the preference changes, and focuses immediately. Existing viewport clipping, bounded layout work, adaptive detail, selected-neighborhood completeness, progressive labels, and stationary scene caching remain.
- Existing live snapshot replacement, revision checking, reconnect handling, activity deduplication, selection restoration, conversation rail, history, memory library, and learning/task controls remain integrated. No floating graph-settings menu is added.

Color references: [MDN color mixing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix) and [Oklab conversion](https://bottosson.github.io/posts/oklab/).

## Validation

New tests first reproduced metadata-color omission, duplicate spokes, and invisible recall glow; those now pass. The globe suite also checks reduced-motion changes, deterministic positions, every dated member's connections, bounded 20,000-record layout work, offscreen culling, scene invalidation, and stable color assignments for 2,400 category IDs. TypeScript and production compilation pass. Mobile polish remains deferred.

## Stability follow-up

The palette now uses deeper, more saturated panel-adjusted shades, with mixing limited to 8–16 percent and reduced violet emphasis in fallback assignments. Back-facing dots retain their color instead of becoming nearly transparent. Existing category metadata and records remain unchanged.

Automatic rotation changes both yaw and pitch. Dragging can pass either pole, and selected dots can focus without the former pitch clamp. Reduced motion still stops automatic rotation. Zooming out restores the undimmed overview. The current Memory workspace and finite camera angles/zoom persist across reloads; no memory text or selected record IDs are stored in browser presentation preferences.

Quality adaptation measures drawing cost rather than animation-callback delay and can recover after load subsides. All memory dots remain drawn through 6,000 memories, and sampled larger graphs retain dots for every rendered strand endpoint. Offscreen curve clipping is bounded. The hidden dashboard orb pauses its expensive visual work while Memory is open. These changes preserve the supplied layout and real operation signals.

Validation: 33 globe/adapter/palette/persistence tests and 95 frontend regressions pass, along with TypeScript and the production build. Tests cover five-minute dot/color retention, larger-graph endpoint consistency, full rotation/pole focus, camera validation, reduced motion, and quality recovery. Existing build warnings concern Calculator eval and large dashboard bundles.

The populated live browser reports 2,873 memory records and 6,081 connections, retaining 3,132 rendered dots including hubs/entities. Drawing cost measured approximately 5–6 milliseconds, but the in-app browser delivered animation callbacks at approximately one frame per second. This does not establish desktop FPS or performance on older hardware. Reload was verified to remain in Memory. Screenshot capture was unavailable. Backend/UI/supervisor health checks succeeded on ports 8340/5173/8341; mobile polish remains deferred.


## Current library/palette follow-up
The final palette and live library changes supersede the earlier palette paragraphs above. See [Live Memory Explorer validation](live_memory_explorer_validation.md) for implementation, latest checks, measured limits and outstanding physical-camera validation.
